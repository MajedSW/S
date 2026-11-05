/* ==========================================================================
   Lisan · brain.js — connects the app to its AI partner
   --------------------------------------------------------------------------
   Same pattern as the voice engine: the UI asks for a task, the brain picks
   the best provider that is available.

     1. Lisan server   /api/brain on the same host (server/server.mjs).
                       Claude API with keys kept on the server. Also offers
                       /api/tts and /api/stt for premium voice and listening.
     2. Claude (here)  when the page runs as a claude.ai artifact, Claude
                       answers through the page's `sample` capability.
     3. Offline        no AI: the app falls back to guided scenarios.

   API
     LisanBrain.init()                       detect providers (async)
     LisanBrain.available()                  true if an AI partner is on
     LisanBrain.turn(ctx, {onText, signal})  → {en, ar, end}
     LisanBrain.task(name, ctx, {signal})    → parsed JSON for feedback,
                                               assist, translate, hint, report
   ========================================================================== */
(function (root) {
  'use strict';
  const P = root.LisanPrompts;

  function withTimeout(promise, ms) {
    return Promise.race([promise, new Promise(function (r) { setTimeout(function () { r(null); }, ms); })]);
  }
  function BrainError(code, message) { const e = new Error(message || code); e.code = code; return e; }

  /* ------------------------------------------------------------------ *
   * Provider: Lisan server
   * ------------------------------------------------------------------ */
  function ServerProvider(health) {
    this.id = 'server';
    this.label = 'Lisan server';
    this.health = health;
  }
  ServerProvider.prototype.post = async function (task, ctx, signal) {
    let r;
    try {
      r = await fetch('api/brain', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: task, ctx: ctx }), signal: signal
      });
    } catch (e) {
      if (signal && signal.aborted) throw BrainError('cancelled');
      throw BrainError('network', 'Could not reach the Lisan server.');
    }
    if (!r.ok) {
      let msg = '';
      try { msg = (await r.json()).error || ''; } catch (e) { /* not json */ }
      throw BrainError(r.status === 429 ? 'rate_limited' : r.status === 422 ? 'refused' : 'upstream', msg || ('Server error ' + r.status));
    }
    return r;
  };
  ServerProvider.prototype.turn = async function (ctx, opts) {
    const r = await this.post('turn', ctx, opts.signal);
    let text = '';
    if (r.body && r.body.getReader) {
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        text += dec.decode(chunk.value, { stream: true });
        if (opts.onText) opts.onText(text);
      }
      text += dec.decode();
    } else {
      text = await r.text();
    }
    if (opts.onText) opts.onText(text);
    return text;
  };
  ServerProvider.prototype.task = async function (task, ctx, opts) {
    const r = await this.post(task, ctx, opts.signal);
    return r.json();
  };

  /* ------------------------------------------------------------------ *
   * Provider: Claude inside claude.ai (artifact `sample` capability)
   * ------------------------------------------------------------------ */
  function SampleProvider(sample) {
    this.id = 'claude';
    this.label = 'Claude';
    this.sample = sample;
  }
  function mapSampleError(e) {
    const code = e && e.code;
    if (code === 'cancelled') return BrainError('cancelled');
    if (code === 'not_granted' || code === 'sampling_disabled' || code === 'not_declared' || code === 'capability_disabled' || code === 'capability_removed') {
      return BrainError('unavailable', 'Claude is not available for this page.');
    }
    if (code === 'rate_limited') return BrainError('rate_limited', 'Too many requests. Wait a moment and try again.');
    if (code === 'refused') return BrainError('refused');
    if (code === 'invalid_json') return BrainError('invalid_json');
    return BrainError('upstream', (e && e.message) || 'Claude did not answer.');
  }
  SampleProvider.prototype.turn = async function (ctx, opts) {
    const p = P.build('turn', ctx);
    try {
      const res = await this.sample(P.asTurnList(p), {
        modelTier: p.tier, cache: false, signal: opts.signal,
        onText: function (u) { if (opts.onText) opts.onText(u.text); }
      });
      return res.text;
    } catch (e) { throw mapSampleError(e); }
  };
  SampleProvider.prototype.task = async function (task, ctx, opts) {
    const p = P.build(task, ctx);
    try {
      return await this.sample.json(P.asSingleTurnInput(p), {
        modelTier: p.tier, signal: opts.signal, cache: task === 'assist' || task === 'translate' || task === 'hint' ? true : false
      });
    } catch (e) { throw mapSampleError(e); }
  };

  /* ------------------------------------------------------------------ *
   * Facade
   * ------------------------------------------------------------------ */
  const Brain = {
    provider: null,
    server: null,           // /api/health payload when a Lisan server is present
    state: 'detecting',     // detecting | ready | offline
    listeners: [],
    onChange: function (fn) { this.listeners.push(fn); },
    emit: function () { const self = this; this.listeners.forEach(function (fn) { try { fn(self); } catch (e) { /* listener error */ } }); },

    init: function () {
      const self = this;
      if (this._init) return this._init;
      // Inside the claude.ai viewer there is no Lisan server to find.
      const inClaude = !!(root.claude && typeof root.claude.use === 'function');
      const probeServer = inClaude ? Promise.resolve(null) : withTimeout(fetch('api/health', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; }), 3000);
      const probeClaude = root.claude && typeof root.claude.use === 'function'
        ? withTimeout(Promise.resolve().then(function () { return root.claude.use('sample'); }).catch(function () { return null; }), 12000)
        : Promise.resolve(null);
      this._init = probeServer.then(function (h) {
        if (h && h.ok) {
          self.server = h;
          if (h.brain) { self.provider = new ServerProvider(h); self.state = 'ready'; self.emit(); }
        }
        return probeClaude;
      }).then(function (sample) {
        if (!self.provider && typeof sample === 'function') { self.provider = new SampleProvider(sample); self.state = 'ready'; }
        if (!self.provider) self.state = 'offline';
        self.emit();
        return self;
      });
      return this._init;
    },
    available: function () { return !!this.provider; },
    label: function () { return this.provider ? this.provider.label : 'Off'; },

    /** The partner's next reply. onText receives the raw text so far. */
    turn: async function (ctx, opts) {
      if (!this.provider) throw BrainError('unavailable');
      opts = opts || {};
      const raw = await this.provider.turn(ctx, opts);
      const out = P.parseTurn(raw);
      if (!out.en) throw BrainError('empty', 'No reply.');
      return out;
    },
    /** A JSON task (feedback, assist, translate, hint, report). */
    task: async function (name, ctx, opts) {
      if (!this.provider) throw BrainError('unavailable');
      const res = await this.provider.task(name, ctx, opts || {});
      if (!res || typeof res !== 'object') throw BrainError('invalid_json');
      return res;
    },
    /** Drop the provider after a permanent failure (e.g. consent declined). */
    disable: function () { this.provider = null; this.state = 'offline'; this.emit(); },
    english: function (raw) { return P.parseTurn(raw).en; }
  };

  root.LisanBrain = Brain;
})(window);
