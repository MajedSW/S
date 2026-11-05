/* ==========================================================================
   Lisan · live.js — the live AI conversation ("gap filler")
   --------------------------------------------------------------------------
   Turn by turn:
     1. The partner speaks. Its reply streams in and the first sentence is
        spoken while the rest is still being written.
     2. The learner speaks. A GapWatch follows the live transcript; when they
        freeze mid-sentence the partner offers the missing words on screen
        ("Looking for a word?"), and if they stay stuck it says the cue out
        loud ("Do you mean a shark's fin?") and keeps listening. A word they
        only know in Arabic can be said in Arabic and comes back in English.
     3. The partner answers naturally, echoing the learner's idea with the
        right words (silent correction). In parallel the learner's bubble
        gets a quiet "polished" version, the fixes and the new words.
     4. At the end: a coaching report (scores, patterns to work on, words).
   UI helpers come from app.js through window.LisanUI.
   ========================================================================== */
(function (root) {
  'use strict';

  const V = root.LisanVoice, L = root.LisanListen, S = root.LisanSfx, C = root.LisanCoach;
  const Brain = root.LisanBrain, Learner = root.LisanLearner, Gap = root.LisanGap;
  const U = function () { return root.LisanUI; };
  const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  const $ = function (s, el) { return (el || document).querySelector(s); };

  let active = null;

  /* ------------------------------------------------------------------ *
   * Partner bubble (streams, karaoke, recast highlights)
   * ------------------------------------------------------------------ */
  function PartnerBubble(talk) {
    const ui = U();
    const el = document.createElement('div');
    el.className = 'msg ai';
    el.dataset.role = 'persona';
    el.innerHTML =
      '<div class="bubble"><div class="en" data-k><span class="typing" aria-label="Typing"><i></i><i></i><i></i></span></div>' +
      '<div class="trans ar ' + talk.arClass() + '"></div></div>' +
      '<div class="msg-tools" hidden>' +
        '<button class="icon-btn" data-act="replay" aria-label="Play again">' + ui.icon('volume', 'sm') + '</button>' +
        '<button class="icon-btn rate" data-act="slow" aria-label="Play slowly">0.7×</button>' +
      '</div>';
    talk.feed.appendChild(el);
    talk.scrollDown();
    this.el = el;
    this.enEl = $('.en', el);
    this.text = '';
    this.cur = -1;
  }
  PartnerBubble.prototype.setText = function (en) {
    if (en === this.text || !en) return;
    const grew = en.length > this.text.length;
    this.text = en;
    this.enEl.innerHTML = U().wordSpans(en);
    if (this.cur >= 0) U().markWord(this.enEl, this.cur);
    if (grew) active && active.scrollDown();
  };
  PartnerBubble.prototype.mark = function (ci) { this.cur = ci; U().markWord(this.enEl, ci); };
  PartnerBubble.prototype.clearMark = function () { this.cur = -1; U().clearMarks(this.enEl); };
  PartnerBubble.prototype.finish = function (en, ar) {
    this.setText(en);
    this.el.dataset.say = en;
    $('.trans', this.el).innerHTML = U().arHtml(ar || '');
    $('.msg-tools', this.el).hidden = false;
  };
  /** Mark the words the partner used to silently correct the learner. */
  PartnerBubble.prototype.highlight = function (items) {
    const text = this.text.toLowerCase();
    const spans = Array.prototype.slice.call(this.enEl.querySelectorAll('.w'));
    items.forEach(function (it) {
      // The partner may adapt the phrase ("I want to visit" → "you want to
      // visit"): fall back to the longest matching tail of at least 2 words.
      let words = String(it.text || '').toLowerCase().replace(/[.?!,]+$/, '').trim().split(/\s+/);
      let needle = words.join(' '), at = text.indexOf(needle);
      while (at < 0 && words.length > 2) { words = words.slice(1); needle = words.join(' '); at = text.indexOf(needle); }
      if (at < 0 || needle.length < 2) return;
      const end = at + needle.length;
      let first = true;
      spans.forEach(function (s) {
        const st = +s.dataset.s;
        if (st >= at && st < end) {
          s.classList.add('recast');
          if (first) { s.dataset.tip = it.tip; s.title = it.tip; first = false; }
        }
      });
    });
  };
  PartnerBubble.prototype.remove = function () { this.el.remove(); };

  /* ------------------------------------------------------------------ *
   * Speech queue: speak sentences as soon as they are complete
   * ------------------------------------------------------------------ */
  function SpeechQueue(talk, bubble) {
    const self = this;
    this.talk = talk; this.bubble = bubble;
    this.items = []; this.running = false; this.closed = false; this.cancelled = false; this.spoke = false;
    this.promise = new Promise(function (r) { self.resolve = r; });
  }
  SpeechQueue.prototype.push = function (text, offset) {
    if (!text || this.cancelled) return;
    V.prefetch(text, { role: 'persona', gender: this.talk.persona.gender });
    this.items.push({ text: text, offset: offset });
    this.run();
  };
  SpeechQueue.prototype.run = async function () {
    if (this.running) return;
    this.running = true;
    const self = this, talk = this.talk;
    while (this.items.length && !this.cancelled) {
      const it = this.items.shift();
      if (!talk.alive) break;
      if (talk.mode !== 'listening') talk.setMode('speaking');
      this.spoke = true;
      await V.speak(it.text, {
        role: 'persona', gender: talk.persona.gender,
        onWord: function (ci) { self.bubble.mark(it.offset + ci); }
      });
    }
    this.running = false;
    this.bubble.clearMark();
    if ((this.closed && !this.items.length) || this.cancelled) this.resolve();
  };
  SpeechQueue.prototype.close = function () {
    this.closed = true;
    if (!this.running && !this.items.length) this.resolve();
  };
  SpeechQueue.prototype.cancel = function () {
    this.cancelled = true;
    this.items = [];
    V.stop();
    this.resolve();
  };
  SpeechQueue.prototype.done = function () { return this.promise; };

  function lastBoundary(en, from) {
    const re = /[.!?]+["')\]]*(?=\s)/g;
    let m, cut = from;
    while ((m = re.exec(en))) { const e = m.index + m[0].length; if (e > cut) cut = e; }
    return cut;
  }

  /* ------------------------------------------------------------------ *
   * Live conversation controller
   * ------------------------------------------------------------------ */
  function LiveTalk(cfg) {
    const self = this;
    this.cfg = cfg;
    this.persona = cfg.persona;
    this.history = [];
    this.feedbacks = [];
    this.mode = 'idle';
    this.awaiting = false;
    this.buffer = '';
    this.partial = '';
    this.assisted = [];
    this.lastAssist = null;
    this.alive = true;
    // Inside the claude.ai viewer the microphone is not available: start typing.
    this.typing = !L.supported() || !!(root.claude && typeof root.claude.use === 'function');
    this.t0 = Date.now();
    this.stats = { learnerTurns: 0, words: 0, gaps: 0, fixes: 0, speakMs: 0, cues: 0, arabic: 0 };
    const st = U().settings();
    this.gap = new Gap.GapWatch({
      stallMs: ({ quick: 1000, normal: 1400, relaxed: 2000 })[st.gapSpeed] || 1400,
      onGap: function (t, why) { self.onGap(t, why); }
    });
  }

  LiveTalk.prototype.ctx = function (extra) {
    const st = U().settings(), c = this.cfg;
    return Object.assign({
      mode: c.mode, level: st.level, persona: this.persona,
      topic: c.topic, angle: c.angle, place: c.place, mission: c.mission, beats: c.beats, outro: c.outro,
      style: c.style, goal: c.goal,
      maxTurns: c.maxTurns, learner: Learner.summary(),
      history: this.history.map(function (h) { return { role: h.role, text: h.text, note: h.note }; })
    }, extra || {});
  };

  LiveTalk.prototype.arClass = function () {
    const a = U().settings().arabic;
    return a === 'hide' ? 'hidden-ar' : a === 'tap' ? 'veiled' : '';
  };

  LiveTalk.prototype.mount = function () {
    const ui = U(), c = this.cfg, p = this.persona, self = this;
    const el = $('#s-live');
    el.style.setProperty('--tint', c.tint || 'var(--brand)');
    el.innerHTML =
      '<div class="talk-head">' +
        '<button class="icon-btn" data-act="exit" aria-label="Leave conversation">' + ui.icon('x') + '</button>' +
        '<div class="th-mid"><div class="th-title">' + ui.esc(c.title) + '</div>' +
          '<div class="th-sub"><span class="live-dot"></span>Live with AI · <span class="ar">محادثة حيّة</span></div></div>' +
        '<button class="icon-btn ar-toggle" data-act="ar" aria-label="Arabic translation">ع</button>' +
        '<button class="btn btn-soft th-done" data-act="finish">Finish</button>' +
      '</div>' +
      '<div class="stage">' +
        '<div class="orb-wrap"><canvas aria-hidden="true"></canvas></div>' +
        '<div class="who"><b>' + ui.esc(p.name) + '</b><span>' + ui.esc(p.role) + ' · <span class="ar">' + ui.esc(p.roleAr || '') + '</span></span>' +
        '<div class="status" aria-live="polite"></div></div>' +
      '</div>' +
      '<div class="scroll"><div class="feed" aria-live="polite"><div class="place">' + ui.esc(c.place || c.topicLabel || '') + '</div></div></div>' +
      '<div class="dock"><div class="lifeline" hidden aria-live="polite"></div><div class="live"></div><div class="dock-ctl"></div></div>';
    this.el = el;
    this.feed = $('.feed', el);
    this.scroller = $('.scroll', el);
    this.liveEl = $('.live', el);
    this.ctl = $('.dock-ctl', el);
    this.lifeEl = $('.lifeline', el);
    this.statusEl = $('.status', el);
    this.orb = new ui.Orb($('canvas', el));
    this.updateArToggle();
    this.renderDock();
    el.onclick = function (e) {
      const b = e.target.closest('[data-act]');
      if (b) { self.act(b.dataset.act, b); return; }
      const veil = e.target.closest('.trans.veiled');
      if (veil) veil.classList.remove('veiled');
    };
    const loop = function () {
      if (!self.alive) return;
      self.orb.draw({ mode: self.mode === 'cue' ? 'speaking' : self.mode });
      const mic = $('.mic', self.el);
      if (mic && self.mode === 'listening') mic.style.setProperty('--lvl', (1 + L.level() * 0.28).toFixed(3));
      self.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    this.keyHandler = function (e) {
      if (e.code !== 'Space' || e.target.closest('input, textarea, button, select')) return;
      e.preventDefault();
      self.act('mic');
    };
    document.addEventListener('keydown', this.keyHandler);
  };

  LiveTalk.prototype.destroy = function () {
    if (!this.alive) return;
    this.alive = false;
    cancelAnimationFrame(this.raf);
    document.removeEventListener('keydown', this.keyHandler);
    this.gap.stop();
    clearTimeout(this.cueT);
    if (this.turnCtl) this.turnCtl.abort();
    if (this.assistCtl) this.assistCtl.abort();
    if (this.queue) this.queue.cancel();
    V.stop();
    L.cancel();
    if (!this.finished && this.stats.learnerTurns) U().Progress.addPractice((Date.now() - this.t0) / 1000);
    if (active === this) active = null;
  };

  LiveTalk.prototype.scrollDown = function () {
    const sc = this.scroller;
    requestAnimationFrame(function () { sc.scrollTo({ top: sc.scrollHeight, behavior: 'smooth' }); });
  };

  LiveTalk.prototype.updateArToggle = function () {
    const b = $('[data-act="ar"]', this.el), a = U().settings().arabic;
    b.classList.toggle('on', a !== 'hide');
    b.style.opacity = a === 'tap' ? '.75' : '';
  };

  /* --- modes & dock ------------------------------------------------- */
  LiveTalk.prototype.setMode = function (mode) {
    this.mode = mode;
    const map = {
      speaking: ['', '<span class="dot-live"></span>Speaking'],
      cue: ['coach', '<span class="dot-live"></span>Helping you'],
      listening: ['you', '<span class="dot-live"></span>' + (this.arabicMode ? 'Listening in Arabic' : 'Listening to you')],
      thinking: ['', '<span class="dots"><i></i><i></i><i></i></span>Thinking'],
      idle: ['you', this.awaiting ? 'Your turn' : '']
    };
    const m = map[mode] || map.idle;
    this.statusEl.className = 'status ' + m[0];
    this.statusEl.innerHTML = m[1];
    this.renderDock();
  };

  LiveTalk.prototype.renderDock = function () {
    const ui = U(), mode = this.mode, p = this.persona;
    let live = '', cls = '';
    const said = (this.buffer + ' ' + this.partial).trim();
    if (mode === 'speaking') live = ui.esc(p.name) + ' is talking… <span class="ar inl muted">تحدّث متى شئت</span>';
    else if (mode === 'cue') live = ui.esc(p.name) + ' is helping you find the word';
    else if (mode === 'thinking') live = said ? ui.esc(said) : ui.esc(p.name) + ' is thinking…';
    else if (mode === 'listening') {
      if (this.arabicMode) { live = this.partial ? '<span class="ar">' + ui.esc(this.partial) + '</span>' : 'Say the word in Arabic <span class="ar inl">قل الكلمة بالعربي</span>'; cls = 'speaking'; }
      else { live = said ? ui.esc(said) + '<span class="caret"></span>' : 'Listening… speak naturally, pauses are fine'; cls = said ? 'speaking' : ''; }
    } else if (this.awaiting) live = this.typing ? 'Type in English, or Arabic if you’re stuck' : 'Tap the mic and talk <span class="ar inl muted">اضغط وتحدّث</span>';
    this.liveEl.className = 'live ' + cls;
    this.liveEl.innerHTML = live;

    if (this.typing) {
      if (!$('.typebar', this.ctl)) {
        const self = this;
        this.ctl.innerHTML =
          '<form class="typebar" autocomplete="off">' +
            (L.supported() ? '<button type="button" class="icon-btn" data-act="voice" aria-label="Use microphone">' + ui.icon('mic') + '</button>' : '') +
            '<input id="live-input" type="text" enterkeyhint="send" placeholder="Type your reply…" aria-label="Your reply" dir="auto">' +
            '<button type="button" class="icon-btn" data-act="help" aria-label="Ideas to answer">' + ui.icon('bulb') + '</button>' +
            '<button class="send" type="submit" aria-label="Send">' + ui.icon('send', 'sm') + '</button>' +
          '</form>';
        $('form', this.ctl).onsubmit = function (e) {
          e.preventDefault();
          const inp = $('#live-input');
          const v = inp.value.trim();
          if (!v || !self.awaiting) return;
          inp.value = '';
          self.learnerTurn(v, { typed: true });
        };
      }
      $('.send', this.ctl).disabled = !this.awaiting;
      return;
    }

    let row = $('.dock-row', this.ctl);
    if (!row) {
      this.ctl.innerHTML =
        '<div class="dock-row">' +
          '<button class="side-btn" data-act="left"></button>' +
          '<button class="mic" data-act="mic"><span class="meter"></span><span class="mic-ic"></span></button>' +
          '<button class="side-btn" data-act="type">' + ui.icon('keyboard') + 'Type</button>' +
        '</div>';
      row = $('.dock-row', this.ctl);
    }
    const left = row.children[0], mic = row.children[1], micIc = mic.children[1];
    const listening = mode === 'listening';
    const lk = listening ? (this.arabicMode ? 'none' : 'arabic') : 'help';
    if (left.dataset.k !== lk) {
      left.dataset.k = lk;
      left.innerHTML = lk === 'arabic' ? '<span class="ar-glyph">ع</span>Arabic word' : lk === 'none' ? '' : ui.icon('bulb') + 'Ideas';
    }
    left.disabled = lk === 'none' || (lk === 'help' && (!this.awaiting || mode !== 'idle'));
    left.classList.toggle('glow', lk === 'help' && !!this.idleLong);
    let mc = 'mic', mi = 'mic', ml = 'Speak';
    if (listening) { mc += ' listening'; mi = 'stop'; ml = 'Done speaking'; }
    else if (mode === 'speaking' || mode === 'cue') { mc += ' busy'; mi = 'mic'; ml = 'Interrupt and speak'; }
    else if (mode === 'thinking' || !this.awaiting) { mc += ' busy'; mi = 'wave'; ml = 'Please wait'; }
    if (mic.className !== mc) mic.className = mc;
    if (micIc.dataset.i !== mi) { micIc.innerHTML = ui.icon(mi); micIc.dataset.i = mi; }
    mic.setAttribute('aria-label', ml);
    row.children[2].disabled = listening;
  };

  LiveTalk.prototype.act = function (a, b) {
    const self = this, ui = U();
    if (a === 'exit') {
      if (!this.stats.learnerTurns) { ui.Router.go('home'); return; }
      ui.modal({
        title: 'Leave this conversation?',
        html: '<p class="muted">Tap <b>Finish</b> instead to get your feedback report.</p>',
        actions: [{ label: 'Leave', kind: 'btn-soft', onClick: function () { ui.Router.go('home'); } },
          { label: 'Get my report', kind: 'btn-primary', onClick: function () { self.finish(); } }]
      });
      return;
    }
    if (a === 'finish') { if (!this.stats.learnerTurns) { ui.toast('Say something first. Your report needs at least one reply.'); return; } this.finish(); return; }
    if (a === 'ar') {
      const order = ['show', 'tap', 'hide'], s = ui.settings();
      s.arabic = order[(order.indexOf(s.arabic) + 1) % 3];
      ui.save();
      const cls = this.arClass();
      Array.prototype.forEach.call(this.feed.querySelectorAll('.trans'), function (t) {
        t.classList.remove('veiled', 'hidden-ar');
        if (cls) t.classList.add(cls);
      });
      this.updateArToggle();
      ui.toast(({ show: 'Arabic translation: shown', tap: 'Arabic translation: tap to reveal', hide: 'Arabic translation: hidden' })[s.arabic]);
      return;
    }
    if (a === 'mic') {
      if (this.mode === 'listening') { this.stopListening(); return; }
      if (this.mode === 'cue') { V.stop(); this.listen({ resume: true }); return; }
      if (this.mode === 'speaking') {
        if (this.queue) this.queue.cancel();
        V.stop();
        this.awaiting = true;
        this.listen();
        return;
      }
      if (this.awaiting && this.mode === 'idle') this.listen();
      return;
    }
    if (a === 'left') {
      if (this.mode === 'listening' && !this.arabicMode) this.sayArabic();
      else this.help();
      return;
    }
    if (a === 'help') { this.help(); return; }
    if (a === 'type') { this.setTyping(true); return; }
    if (a === 'voice') { this.setTyping(false); return; }
    if (a === 'chip') { this.useChip(+b.dataset.i); return; }
    if (a === 'close-life') { this.hideLifeline(); return; }
    if (a === 'replay' || a === 'slow') {
      const msg = b.closest('[data-say]');
      if (!msg || this.mode === 'listening') return;
      const role = msg.dataset.role || 'persona';
      const zone = msg.querySelector('[data-k]') || msg;
      V.speak(msg.dataset.say, {
        role: role, gender: this.persona.gender, rate: a === 'slow' ? 0.72 : 1,
        onWord: function (ci) { ui.markWord(zone, ci); }
      }).then(function () { ui.clearMarks(zone); });
      return;
    }
    if (a === 'say-better') {
      const box = b.closest('.polish');
      if (box) V.speak(box.dataset.better, { role: 'coach' });
      return;
    }
    if (a === 'why') {
      const box = b.closest('.polish');
      const d = box && box.querySelector('.fix-list');
      if (d) { d.hidden = !d.hidden; b.setAttribute('aria-expanded', String(!d.hidden)); this.scrollDown(); }
      return;
    }
    if (a === 'starter') {
      const t = b.dataset.text;
      if (this.typing) { const i = $('#live-input'); if (i) { i.value = t.replace(/…$/, ' '); i.focus(); } }
      else V.speak(t.replace(/…$/, ''), { role: 'coach' });
    }
  };

  LiveTalk.prototype.setTyping = function (on) {
    this.typing = on;
    if (on && this.mode === 'listening') this.stopListening(true);
    this.ctl.innerHTML = '';
    this.renderDock();
    if (on) { const i = $('#live-input'); if (i) i.focus(); }
  };

  LiveTalk.prototype.await = function () {
    if (!this.alive) return;
    const self = this;
    this.awaiting = true;
    this.idleLong = false;
    this.setMode('idle');
    clearTimeout(this.idleT);
    this.idleT = setTimeout(function () {
      if (self.awaiting && self.mode === 'idle') { self.idleLong = true; self.renderDock(); }
    }, 10000);
    if (U().settings().autoListen && !this.typing && L.supported()) {
      setTimeout(function () { if (self.alive && self.awaiting && self.mode === 'idle') self.listen(); }, 250);
    }
  };

  /* --- the partner speaks -------------------------------------------- */
  LiveTalk.prototype.partnerTurn = async function (feedbackPromise) {
    const self = this;
    this.awaiting = false;
    this.setMode('thinking');
    const bubble = new PartnerBubble(this);
    const q = new SpeechQueue(this, bubble);
    this.queue = q;
    const ctl = new AbortController();
    this.turnCtl = ctl;
    let spokenUpTo = 0, result;
    try {
      result = await Brain.turn(this.ctx(), {
        signal: ctl.signal,
        onText: function (raw) {
          if (!self.alive) return;
          const en = Brain.english(raw);
          bubble.setText(en);
          const englishDone = /\n\s*AR\s*[:：]/.test(raw);
          const cut = englishDone ? en.length : lastBoundary(en, spokenUpTo);
          if (cut > spokenUpTo) {
            const seg = en.slice(spokenUpTo, cut);
            q.push(seg.trim(), spokenUpTo + (seg.length - seg.replace(/^\s+/, '').length));
            spokenUpTo = cut;
          }
        }
      });
    } catch (e) {
      q.cancel();
      bubble.remove();
      if (this.queue === q) this.queue = null;
      if (!this.alive || e.code === 'cancelled') return;
      return this.onBrainError(e, function () { self.partnerTurn(feedbackPromise); });
    }
    if (!this.alive) return;
    if (result.en.length > spokenUpTo) {
      const seg = result.en.slice(spokenUpTo);
      q.push(seg.trim(), spokenUpTo + (seg.length - seg.replace(/^\s+/, '').length));
    }
    bubble.finish(result.en, result.ar);
    this.history.push({ role: 'tutor', text: result.en, ar: result.ar });
    if (feedbackPromise) {
      feedbackPromise.then(function (fb) { if (fb) bubble.highlight(recastItems(fb)); });
    }
    q.close();
    await q.done();
    if (this.queue === q) this.queue = null;
    if (!this.alive) return;
    if (result.end) { await sleep(400); return this.finish(); }
    if (this.mode !== 'listening') this.await();
  };

  function recastItems(fb) {
    const out = [];
    (fb.fixes || []).forEach(function (f) { out.push({ text: f.right, tip: 'You said: “' + f.wrong + '”' }); });
    (fb.gaps || []).forEach(function (g) { out.push({ text: g.en, tip: g.ar }); });
    return out;
  }

  LiveTalk.prototype.onBrainError = function (e, retry) {
    const ui = U(), self = this;
    this.setMode('idle');
    if (e.code === 'unavailable') {
      Brain.disable();
      ui.modal({
        title: 'The AI partner is off',
        html: '<p class="muted">Claude isn’t available for this page right now. You can keep practising with the guided scenarios, which work offline.</p>',
        actions: [{ label: 'Go to practice', kind: 'btn-primary', onClick: function () { ui.Router.go('home'); } }]
      });
      return;
    }
    const msg = e.code === 'rate_limited' ? 'Too many requests. Wait a few seconds, then try again.' :
      e.code === 'network' ? 'Couldn’t reach the AI partner. Check your connection.' : 'The reply didn’t come through.';
    const card = document.createElement('div');
    card.className = 'tip-card hint';
    card.innerHTML = '<div class="tc-body"><div class="tc-label">Connection</div><div class="small">' + ui.esc(msg) + '</div></div>' +
      '<button class="btn btn-soft" style="min-height:40px;font-size:14px">' + ui.icon('redo', 'sm') + 'Try again</button>';
    $('button', card).onclick = function () { card.remove(); retry(); };
    this.feed.appendChild(card);
    this.scrollDown();
    void self;
  };

  /* --- the learner speaks ------------------------------------------- */
  LiveTalk.prototype.listen = function (opts) {
    opts = opts || {};
    const self = this;
    if (!L.supported()) { this.setTyping(true); return; }
    V.stop();
    clearTimeout(this.idleT);
    this.idleLong = false;
    if (!opts.resume) { this.buffer = ''; this.assisted = []; this.lastAssist = null; this.hideLifeline(); }
    this.partial = '';
    this.arabicMode = false;
    this.setMode('listening');
    if (!opts.resume) S.listenOn();
    this.gap.start();
    if (this.buffer) this.gap.update(this.buffer);
    L.start({
      expected: [],
      onPartial: function (t) {
        if (!self.alive) return;
        self.partial = t;
        self.gap.update((self.buffer + ' ' + t).trim());
        self.renderDock();
      },
      onFinal: function (res) { if (self.alive) self.onFinal(res); },
      onError: function (code) { if (self.alive) self.onListenError(code); }
    });
  };

  LiveTalk.prototype.stopListening = function (cancel) {
    if (cancel) { L.cancel(); this.gap.stop(); this.setMode('idle'); return; }
    L.stop();
  };

  LiveTalk.prototype.onListenError = function (code) {
    const ui = U();
    this.gap.stop();
    S.listenOff();
    this.setMode('idle');
    if (code === 'not-allowed' || code === 'service-not-allowed') {
      this.setTyping(true);
      ui.toast('Microphone blocked. Allow it in your browser settings, or type your replies.');
    } else if (code === 'network') ui.toast('Speech recognition needs an internet connection.');
    else if (code === 'unsupported' || code === 'start-failed') { this.setTyping(true); ui.toast('Voice input isn’t available here. You can type.'); }
    else if (code === 'language-not-supported') ui.toast('Arabic speech recognition isn’t available on this device. Type the word instead.');
    if (this.arabicMode) { this.arabicMode = false; }
  };

  LiveTalk.prototype.onFinal = function (res) {
    this.gap.stop();
    clearTimeout(this.cueT);
    S.listenOff();
    let said = String(res.text || '').trim();
    if (this.lastAssist && this.buffer && Gap.isConfirm(said) && this.lastAssist.options && this.lastAssist.options[0]) {
      said = this.lastAssist.options[0].en;
      this.assisted.push(said);
    }
    const full = (this.buffer + ' ' + said).replace(/\s+/g, ' ').trim();
    this.buffer = '';
    this.partial = '';
    if (!full) {
      this.setMode('idle');
      S.nudge();
      U().toast(res.reason === 'no-speech' ? 'I didn’t hear anything. Tap the mic and speak.' : 'I didn’t catch that. Try again.');
      return;
    }
    this.hideLifeline(true);
    this.learnerTurn(full, { ms: res.durationMs });
  };

  LiveTalk.prototype.learnerTurn = function (text, meta) {
    const self = this, ui = U();
    meta = meta || {};
    this.awaiting = false;
    clearTimeout(this.idleT);
    const assisted = this.assisted.slice();
    this.assisted = [];
    this.lastAssist = null;
    this.hideLifeline(true);
    const bubble = this.addLearnerBubble(text, assisted);
    const note = assisted.length ? 'The learner froze and was helped with: ' + assisted.join(', ') : '';
    this.history.push({ role: 'learner', text: text, note: note });
    const words = C.canonTokens(text).length;
    this.stats.learnerTurns++;
    this.stats.words += words;
    // Speech time for words-per-minute: never faster than ~200 wpm per turn.
    const ms = meta.typed ? 0 : Math.max(meta.ms || 0, words * 300);
    this.stats.speakMs += ms;
    ui.Progress.addSentence(ms / 1000);
    const fbP = Brain.task('feedback', this.ctx({ said: text, assisted: assisted }))
      .then(function (fb) { self.applyFeedback(bubble, text, fb); return fb; })
      .catch(function () { bubble.querySelector('.polish').remove(); return null; });
    this.partnerTurn(fbP);
  };

  LiveTalk.prototype.addLearnerBubble = function (text, assisted) {
    const ui = U();
    let html = ui.esc(text);
    assisted.forEach(function (w) {
      const at = text.toLowerCase().lastIndexOf(w.toLowerCase());
      if (at < 0) return;
      const before = ui.esc(text.slice(0, at)), mid = ui.esc(text.slice(at, at + w.length)), after = ui.esc(text.slice(at + w.length));
      html = before + '<span class="assisted" title="Filled in with your partner">' + mid + '</span>' + after;
    });
    const el = document.createElement('div');
    el.className = 'msg me';
    el.innerHTML = '<div class="bubble"><div class="en">' + html + '</div></div>' +
      '<div class="polish pending"><span class="shimmer"></span></div>';
    this.feed.appendChild(el);
    this.scrollDown();
    return el;
  };

  LiveTalk.prototype.applyFeedback = function (bubble, said, fb) {
    const ui = U();
    const box = bubble.querySelector('.polish');
    if (!box || !fb) return;
    fb.fixes = Array.isArray(fb.fixes) ? fb.fixes.slice(0, 3) : [];
    fb.gaps = Array.isArray(fb.gaps) ? fb.gaps.slice(0, 3) : [];
    this.feedbacks.push({ said: said, fb: fb });
    this.stats.fixes += fb.fixes.length;
    Learner.recordFeedback(fb, this.cfg.title);
    const better = String(fb.better || '').trim();
    const same = !better || C.judge([better], said, []).score > 0.97;
    box.classList.remove('pending');
    let html = '';
    if (!fb.fixes.length && same) {
      html = '<div class="verdict ok">' + ui.icon('check', 'xs') + ui.esc(fb.praise || 'Clear and natural') + '</div>';
    } else {
      const ops = C.diffWords(C.prettify(said), better);
      const line = ops.filter(function (o) { return o.type !== 'del'; }).map(function (o) {
        return o.type === 'ins' ? '<ins class="i">' + ui.esc(o.text) + '</ins>' : ui.esc(o.text);
      }).join(' ');
      box.dataset.better = better;
      html =
        '<div class="polish-line"><span class="pl-label">' + ui.icon('sparkle', 'xs') + 'Polished</span><span class="pl-text">' + line + '</span></div>' +
        '<div class="polish-tools">' +
          '<button class="link-btn" data-act="say-better">' + ui.icon('volume', 'xs') + 'Listen</button>' +
          (fb.fixes.length ? '<button class="link-btn" data-act="why" aria-expanded="false">Why? · <span class="ar">لماذا؟</span></button>' : '') +
        '</div>' +
        (fb.fixes.length ? '<div class="fix-list" hidden>' + fb.fixes.map(function (f) {
          return '<div class="fx"><div class="fx-pair"><del class="d">' + ui.esc(f.wrong) + '</del>' + ui.icon('arrow', 'xs') + '<ins class="i">' + ui.esc(f.right) + '</ins></div>' +
            '<div class="ar">' + ui.arHtml(f.why_ar) + '</div><div class="fx-en">' + ui.esc(f.why_en) + '</div></div>';
        }).join('') + '</div>' : '');
      ui.Phrases.add({ en: better, ar: '', note: fb.fixes[0] ? fb.fixes[0].why_ar : '', scenario: this.cfg.scenarioId || '', kind: 'fix' });
    }
    if (fb.gaps.length) {
      html += '<div class="gap-chips">' + fb.gaps.map(function (g) {
        return '<span class="gap-chip">' + ui.icon('star', 'xs') + '<b>' + ui.esc(g.en) + '</b><span class="ar">' + ui.esc(g.ar) + '</span></span>';
      }).join('') + '<span class="tiny muted">saved to your words</span></div>';
    }
    box.innerHTML = html;
    this.scrollDown();
  };

  /* --- gap filling --------------------------------------------------- */
  LiveTalk.prototype.onGap = async function (partial, why) {
    if (!this.alive || this.mode !== 'listening' || this.assistBusy || this.arabicMode) return;
    const self = this, ui = U();
    const full = String(partial || '').trim();
    if (!full) return;
    this.assistBusy = true;
    this.stats.gaps++;
    L.hold(7000);
    this.showLifeline({ loading: true });
    const ctl = new AbortController();
    this.assistCtl = ctl;
    let res = null;
    try { res = await Brain.task('assist', this.ctx({ partial: full }), { signal: ctl.signal }); } catch (e) { res = null; }
    this.assistBusy = false;
    if (!this.alive || this.mode !== 'listening' || !res || !Array.isArray(res.options) || !res.options.length) {
      if (!res) this.hideLifeline();
      return;
    }
    res.options = res.options.filter(function (o) { return o && o.en; }).slice(0, 3);
    this.lastAssist = res;
    this.showLifeline({ res: res, why: why });
    L.hold(6000);
    const seenPartial = this.partial;
    clearTimeout(this.cueT);
    if (ui.settings().spokenCues !== false && res.cue) {
      this.cueT = setTimeout(function () {
        if (self.alive && self.mode === 'listening' && self.partial === seenPartial && !self.arabicMode) self.speakCue(res.cue);
      }, 1500);
    }
  };

  /** Pause listening, say the cue, then keep listening from where they were. */
  LiveTalk.prototype.speakCue = async function (cue) {
    this.buffer = (this.buffer + ' ' + this.partial).trim();
    this.partial = '';
    L.cancel();
    this.gap.stop();
    this.stats.cues++;
    this.setMode('cue');
    const life = this.lifeEl.querySelector('.ll-cue');
    if (life) life.classList.add('speaking');
    await V.speak(cue, { role: 'persona', gender: this.persona.gender, rate: 0.95 });
    if (life) life.classList.remove('speaking');
    if (!this.alive || this.mode !== 'cue') return;
    this.listen({ resume: true });
  };

  /** The learner says the missing word in Arabic; we give it back in English. */
  LiveTalk.prototype.sayArabic = function () {
    const self = this, ui = U();
    clearTimeout(this.cueT);
    this.buffer = (this.buffer + ' ' + this.partial).trim();
    this.partial = '';
    L.cancel();
    this.gap.stop();
    this.arabicMode = true;
    this.stats.arabic++;
    this.setMode('listening');
    S.listenOn();
    L.start({
      lang: 'ar-SA', patienceMs: 1100, expected: [],
      onPartial: function (t) { self.partial = t; self.renderDock(); },
      onError: function (code) { self.arabicMode = false; self.onListenError(code); self.listen({ resume: true }); },
      onFinal: async function (res) {
        const arabic = String(res.text || '').trim();
        self.arabicMode = false;
        self.partial = '';
        if (!arabic) { self.listen({ resume: true }); return; }
        self.setMode('thinking');
        self.showLifeline({ loading: true, arabic: arabic });
        let r = null;
        try { r = await Brain.task('translate', self.ctx({ arabic: arabic, partial: self.buffer })); } catch (e) { r = null; }
        if (!self.alive) return;
        if (!r || !Array.isArray(r.options) || !r.options.length) {
          self.hideLifeline();
          ui.toast('Couldn’t find that word. Try describing it in English.');
          self.listen({ resume: true });
          return;
        }
        r.options = r.options.filter(function (o) { return o && o.en; }).slice(0, 3);
        self.lastAssist = r;
        self.stats.gaps++;
        r.options.forEach(function (o) { Learner.addWord({ en: o.en, ar: o.ar || arabic }, self.cfg.title); });
        self.showLifeline({ res: r, arabic: arabic });
        self.setMode('cue');
        if (r.cue) await V.speak(r.cue, { role: 'persona', gender: self.persona.gender, rate: 0.95 });
        if (!self.alive || self.mode !== 'cue') return;
        self.listen({ resume: true });
      }
    });
  };

  LiveTalk.prototype.showLifeline = function (o) {
    const ui = U(), el = this.lifeEl;
    el.hidden = false;
    el.classList.remove('used');
    const head = o.arabic ? 'In English · <span class="ar">بالإنجليزية</span> <span class="ar ll-src">«' + ui.esc(o.arabic) + '»</span>' :
      'Looking for a word? · <span class="ar">تبحث عن كلمة؟</span>';
    let body;
    if (o.loading) body = '<div class="ll-chips"><span class="ll-chip ghost"></span><span class="ll-chip ghost"></span></div>';
    else {
      body = (o.res.cue ? '<div class="ll-cue">' + ui.icon('volume', 'xs') + '“' + ui.esc(o.res.cue) + '”</div>' : '') +
        '<div class="ll-chips">' + o.res.options.map(function (op, i) {
          return '<button class="ll-chip" data-act="chip" data-i="' + i + '"><b>' + ui.esc(op.en) + '</b>' + (op.ar ? '<span class="ar">' + ui.esc(op.ar) + '</span>' : '') + '</button>';
        }).join('') + '</div><div class="ll-foot">Say it in your sentence, or tap to add it</div>';
    }
    el.innerHTML = '<div class="ll-head">' + ui.icon('sparkle', 'xs') + '<span>' + head + '</span>' +
      '<button class="icon-btn ll-x" data-act="close-life" aria-label="Hide suggestions">' + ui.icon('x', 'xs') + '</button></div>' + body;
  };
  LiveTalk.prototype.hideLifeline = function (soft) {
    if (soft && !this.lifeEl.hidden) { this.lifeEl.classList.add('used'); const el = this.lifeEl; setTimeout(function () { el.hidden = true; el.classList.remove('used'); }, 260); return; }
    this.lifeEl.hidden = true;
    this.lifeEl.innerHTML = '';
  };

  LiveTalk.prototype.useChip = function (i) {
    const a = this.lastAssist;
    if (!a || !a.options[i]) return;
    const word = a.options[i].en;
    this.assisted.push(word);
    Learner.addWord({ en: word, ar: a.options[i].ar }, this.cfg.title);
    clearTimeout(this.cueT);
    S.success();
    if (this.typing) {
      const inp = $('#live-input');
      if (inp) { inp.value = (inp.value.replace(/\s+$/, '') + ' ' + word + ' ').replace(/^\s+/, ''); inp.focus(); }
      this.hideLifeline(true);
      return;
    }
    // Add the word to what they've said and keep listening for the rest.
    this.buffer = (this.buffer + ' ' + this.partial + ' ' + word).replace(/\s+/g, ' ').trim();
    this.partial = '';
    this.hideLifeline(true);
    if (this.mode === 'listening' || this.mode === 'cue') {
      L.cancel();
      this.gap.stop();
      this.listen({ resume: true });
    }
  };

  /* --- help before answering ---------------------------------------- */
  LiveTalk.prototype.help = async function () {
    if (!this.awaiting || this.mode !== 'idle' || this.hintBusy) return;
    const ui = U(), self = this;
    this.idleLong = false;
    this.hintBusy = true;
    this.renderDock();
    const card = document.createElement('div');
    card.className = 'tip-card hint';
    card.innerHTML = '<div class="tc-body"><div class="tc-label">Ideas to answer · <span class="ar">أفكار للإجابة</span></div><div class="shimmer-lines"><i></i><i></i></div></div>';
    this.feed.appendChild(card);
    this.scrollDown();
    let r = null;
    try { r = await Brain.task('hint', this.ctx()); } catch (e) { r = null; }
    this.hintBusy = false;
    if (!this.alive) return;
    if (!r || !Array.isArray(r.starters) || !r.starters.length) { card.remove(); ui.toast('No ideas came through. Try again.'); this.renderDock(); return; }
    card.querySelector('.tc-body').innerHTML = '<div class="tc-label">Ideas to answer · <span class="ar">أفكار للإجابة</span></div>' +
      r.starters.slice(0, 3).map(function (s) {
        return '<button class="starter-row" data-act="starter" data-text="' + ui.esc(s.en) + '"><span class="tc-en">' + ui.esc(s.en) + '</span>' +
          '<span class="tc-ar ar">' + ui.arHtml(s.ar) + '</span></button>';
      }).join('') + '<div class="tiny muted">' + (this.typing ? 'Tap one to start typing it.' : 'Tap one to hear it, then say it your way.') + '</div>';
    this.scrollDown();
    this.renderDock();
    void self;
  };

  /* --- finish -------------------------------------------------------- */
  LiveTalk.prototype.finish = async function () {
    if (this.finishing || !this.alive) return;
    const ui = U(), self = this;
    this.finishing = true;
    this.gap.stop();
    clearTimeout(this.cueT);
    if (this.turnCtl) this.turnCtl.abort();
    if (this.queue) this.queue.cancel();
    L.cancel();
    V.stop();
    this.awaiting = false;
    this.setMode('thinking');
    const card = document.createElement('div');
    card.className = 'tip-card';
    card.innerHTML = '<div class="tc-body"><div class="tc-label">Your report</div><div class="small">' + ui.esc(this.persona.name) +
      ' is writing your feedback… <span class="ar inl muted">جاري إعداد تقريرك</span></div><div class="shimmer-lines"><i></i><i></i><i></i></div></div>';
    this.feed.appendChild(card);
    this.scrollDown();
    const sec = (Date.now() - this.t0) / 1000;
    const minutes = Math.max(0.1, this.stats.speakMs / 60000);
    const stats = {
      learnerTurns: this.stats.learnerTurns, words: this.stats.words, gaps: this.stats.gaps,
      wpm: this.stats.speakMs >= 8000 ? Math.round(this.stats.words / minutes) : 0, minutes: Math.round(sec / 6) / 10
    };
    const fixesSeen = [];
    this.feedbacks.forEach(function (f) { (f.fb.fixes || []).forEach(function (x) { fixesSeen.push(x); }); });
    let report = null;
    if (this.stats.learnerTurns) {
      try { report = await Brain.task('report', this.ctx({ fixesSeen: fixesSeen, stats: stats })); } catch (e) { report = null; }
    }
    if (!this.alive) return;
    this.finished = true;
    Learner.noteInterest(this.cfg.topicLabel || this.cfg.title);
    ui.Progress.addPractice(sec);
    const sc = report && report.scores ? report.scores : null;
    const score = sc ? Math.round((+sc.fluency + +sc.grammar + +sc.vocabulary + +sc.confidence) / 4) : null;
    if (this.cfg.scenarioId && score != null) ui.Progress.record({ id: this.cfg.scenarioId, score: score, fixedOk: 0 });
    else ui.Progress.recordLive(this.stats.fixes);
    if (report && Array.isArray(report.new_words)) report.new_words.forEach(function (w) { Learner.addWord(w, self.cfg.title); });
    S.complete();
    ui.Router.go('report', { report: report, score: score, stats: stats, cfg: this.cfg, feedbacks: this.feedbacks, sec: sec });
  };

  /* ------------------------------------------------------------------ *
   * Report screen
   * ------------------------------------------------------------------ */
  function renderReport(d) {
    const ui = U();
    const el = $('#s-report');
    const r = d.report, st = d.stats;
    const pct = function (v) { return Math.max(0, Math.min(100, Math.round(+v || 0))); };
    const bar = function (label, ar, v) {
      return '<div class="metric"><span>' + label + ' <span class="ar inl">' + ar + '</span></span><b>' + pct(v) + '</b><div class="meter-bar"><i style="width:' + pct(v) + '%"></i></div></div>';
    };
    let body = '';
    if (r) {
      body +=
        '<div class="sum-hero"><div class="ring big-ring">' + ui.ringSvg((d.score || 0) / 100, 2.6) + '<div class="ring-txt"><div><b>' + (d.score != null ? d.score : '–') + '</b><span>overall</span></div></div></div>' +
          '<h1 class="display rep-head">' + ui.esc(r.headline) + '</h1><p class="ar muted">' + ui.esc(r.headline_ar) + '</p></div>' +
        '<div class="metrics four">' + bar('Fluency', 'الطلاقة', r.scores.fluency) + bar('Grammar', 'القواعد', r.scores.grammar) +
          bar('Vocabulary', 'المفردات', r.scores.vocabulary) + bar('Confidence', 'الثقة', r.scores.confidence) + '</div>';
    } else {
      body += '<div class="sum-hero"><h1 class="display">Conversation complete</h1><p class="muted">The full report couldn’t be created this time. Here’s what we saved.</p></div>';
    }
    body += '<div class="stats">' +
      '<div class="stat"><b>' + st.learnerTurns + '</b><span>replies spoken</span></div>' +
      '<div class="stat"><b>' + st.words + '</b><span>English words</span></div>' +
      '<div class="stat"><b>' + (st.wpm || '–') + '</b><span>words per minute</span></div>' +
      '<div class="stat"><b>' + st.gaps + '</b><span>gaps filled</span></div></div>';
    if (r && r.strengths && r.strengths.length) {
      body += '<section class="section"><div class="section-head"><h2>What went well</h2><span class="ar">ما أحسنت فيه</span></div><div class="group">' +
        r.strengths.slice(0, 2).map(function (s) { return '<div class="rep-row">' + ui.icon('check', 'sm') + '<span>' + ui.esc(s) + '</span></div>'; }).join('') + '</div></section>';
    }
    if (r && r.focus && r.focus.length) {
      body += '<section class="section"><div class="section-head"><h2>Work on next</h2><span class="ar">ركّز على</span></div>' +
        r.focus.slice(0, 3).map(function (f) {
          return '<div class="focus-card"><div class="fc-title"><b>' + ui.esc(f.title) + '</b><span class="ar">' + ui.esc(f.title_ar) + '</span></div>' +
            '<div class="line wrong"><span class="mark">' + ui.icon('x') + '</span><span class="txt">' + ui.esc(f.wrong) + '</span></div>' +
            '<div class="line right"><span class="mark">' + ui.icon('check') + '</span><span class="txt">' + ui.esc(f.right) + '</span></div>' +
            '<p class="ar fc-tip">' + ui.arHtml(f.tip_ar) + '</p></div>';
        }).join('') + '</section>';
    }
    const better = r && r.say_it_better && r.say_it_better.length ? r.say_it_better :
      d.feedbacks.filter(function (f) { return f.fb.fixes && f.fb.fixes.length; }).slice(0, 3).map(function (f) { return { said: f.said, better: f.fb.better }; });
    if (better.length) {
      body += '<section class="section"><div class="section-head"><h2>Say it better</h2><span class="ar">قلها بشكل أفضل</span></div><div class="group">' +
        better.slice(0, 3).map(function (b, i) {
          return '<div class="fix-row"><span class="from">' + ui.esc(b.said) + '</span><div class="to"><span class="txt">' + ui.esc(b.better) + '</span>' +
            '<button class="icon-btn" data-say-better="' + i + '" aria-label="Listen">' + ui.icon('volume', 'sm') + '</button></div></div>';
        }).join('') + '</div></section>';
    }
    const words = r && r.new_words ? r.new_words : [];
    const gapWords = [];
    d.feedbacks.forEach(function (f) { (f.fb.gaps || []).forEach(function (g) { gapWords.push(g); }); });
    const allWords = gapWords.concat(words).filter(function (w, i, a) {
      return w && w.en && a.findIndex(function (x) { return x.en.toLowerCase() === w.en.toLowerCase(); }) === i;
    }).slice(0, 10);
    if (allWords.length) {
      body += '<section class="section"><div class="section-head"><h2>New words</h2><span class="ar">كلمات جديدة</span></div><div class="word-cloud">' +
        allWords.map(function (w, i) {
          return '<button class="gap-chip big" data-word="' + i + '">' + ui.icon('volume', 'xs') + '<b>' + ui.esc(w.en) + '</b><span class="ar">' + ui.esc(w.ar) + '</span></button>';
        }).join('') + '</div><p class="note" style="padding-inline:4px">Saved in <b>Words</b>. Lisan will bring them back in your next conversations.</p></section>';
    }
    if (r && r.next_step) {
      body += '<div class="tip-card"><div class="tc-body"><div class="tc-label">Next time</div><div class="tc-en">' + ui.esc(r.next_step) + '</div><div class="tc-ar ar">' + ui.arHtml(r.next_step_ar) + '</div></div></div>';
    }
    const next = d.cfg.scenarioId && ui.nextScenario ? ui.nextScenario(d.cfg.scenarioId) : null;
    el.innerHTML =
      '<div class="topbar"><button class="icon-btn" data-act="home" aria-label="Close">' + ui.icon('x') + '</button><div class="grow"></div>' +
        '<span class="chip ok">' + ui.icon('check', 'xs') + ui.esc(d.cfg.title) + '</span></div>' +
      '<div class="scroll"><div class="sum-body">' + body + '</div></div>' +
      '<div class="foot stack">' +
        (next ? '<button class="btn btn-primary btn-block" data-act="next">Next: ' + ui.esc(next.title) + ui.icon('arrow', 'sm') + '</button>' +
          '<button class="btn btn-soft btn-block" data-act="again">' + ui.icon('redo', 'sm') + 'Practise this again</button>' :
          '<button class="btn btn-primary btn-block" data-act="again">' + ui.icon('mic', 'sm') + 'Talk again</button>' +
          '<button class="btn btn-soft btn-block" data-act="home">Back to home</button>') +
      '</div>';
    el.onclick = function (e) {
      const a = e.target.closest('[data-act]');
      if (a && a.dataset.act === 'home') { ui.Router.go('home', 'practice'); return; }
      if (a && a.dataset.act === 'again') { V.unlock(); start(d.cfg); return; }
      if (a && a.dataset.act === 'next' && next) { ui.Router.go('brief', next.id); return; }
      const sb = e.target.closest('[data-say-better]');
      if (sb) { V.speak(better[+sb.dataset.sayBetter].better, { role: 'coach' }); return; }
      const w = e.target.closest('[data-word]');
      if (w) V.speak(allWords[+w.dataset.word].en, { role: 'coach' });
    };
  }

  /* ------------------------------------------------------------------ *
   * Public
   * ------------------------------------------------------------------ */
  function start(cfg) {
    if (active) active.destroy();
    U().Router.go('live', new LiveTalk(cfg));
  }
  function mountScreen(t) {
    active = t;
    t.mount();
    t.begin();
  }
  LiveTalk.prototype.begin = async function () {
    await sleep(350);
    if (!this.alive) return;
    this.partnerTurn(null);
  };

  root.LisanLive = {
    start: start,
    mount: mountScreen,
    leave: function () { if (active) active.destroy(); },
    renderReport: renderReport,
    current: function () { return active; },
    _lastBoundary: lastBoundary
  };
})(window);
