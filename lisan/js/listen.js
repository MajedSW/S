/* ==========================================================================
   Lisan · listen.js — speech input engine
   --------------------------------------------------------------------------
       LisanListen.start({ onPartial, onFinal, onError, onEnd, expected })
       LisanListen.stop()     // finish now and deliver what was heard
       LisanListen.cancel()   // throw it away
       LisanListen.level()    // 0..1 mic activity for the visualiser

   Engines
     • device  The browser's speech recognition (Chrome, Edge, Safari).
               Continuous mode + our own "patience" timer, so learners who
               pause mid-sentence aren't cut off. Several recognition
               alternatives are kept so the coach can pick the one that best
               matches what the learner was trying to say.
     • cloud   Records with MediaRecorder and sends the audio to an
               OpenAI-compatible transcription endpoint (Whisper /
               gpt-4o-transcribe) — far more accurate for accented speech.
   ========================================================================== */
(function (root) {
  'use strict';

  const SR = root.SpeechRecognition || root.webkitSpeechRecognition;

  /* ------------------------------------------------------------------ *
   * Device recogniser
   * ------------------------------------------------------------------ */
  function DeviceRecognizer() {
    this.id = 'device';
    this.supported = !!SR;
    this.rec = null;
    this.energy = 0;
  }
  DeviceRecognizer.prototype.start = function (o) {
    const self = this;
    const rec = new SR();
    rec.lang = o.lang || 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 4;
    this.rec = rec;

    let finished = false, heard = false, lastText = '', candidates = [];
    let silenceT = 0, noSpeechT = 0, maxT = 0, stopT = 0;
    const t0 = performance.now();
    let speechStart = 0;

    function stopThis() { if (self.rec === rec) self.stop(); }
    function clearAll() { clearTimeout(silenceT); clearTimeout(noSpeechT); clearTimeout(maxT); clearTimeout(stopT); }
    this._kill = function () { finished = true; clearAll(); };

    function deliver(reason) {
      if (finished) return;
      finished = true;
      clearTimeout(silenceT); clearTimeout(noSpeechT); clearTimeout(maxT); clearTimeout(stopT);
      self.rec = null;
      try { rec.onresult = rec.onerror = rec.onend = null; rec.abort(); } catch (e) { /* noop */ }
      const text = lastText.trim();
      o.onFinal && o.onFinal({
        text: text,
        candidates: candidates.length ? candidates : (text ? [text] : []),
        durationMs: speechStart ? performance.now() - speechStart : 0,
        reason: reason
      });
      o.onEnd && o.onEnd();
    }
    this._deliver = deliver;

    rec.onresult = function (e) {
      // Rebuild from scratch every time: robust to engines that resend results.
      let finalText = '', interim = '';
      const finals = [];
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          finalText += r[0].transcript + ' ';
          const alts = [];
          for (let j = 0; j < r.length; j++) alts.push(r[j].transcript);
          finals.push(alts);
        } else interim += r[0].transcript + ' ';
      }
      const text = (finalText + interim).replace(/\s+/g, ' ').trim();
      if (!text) return;
      if (!heard) { heard = true; speechStart = speechStart || performance.now(); }
      lastText = text;
      // Candidate sentences: the best path + each single-segment alternative.
      const base = finals.map(function (a) { return a[0]; });
      const cands = [(base.join(' ') + ' ' + interim).trim()];
      finals.forEach(function (alts, si) {
        for (let j = 1; j < alts.length && cands.length < 8; j++) {
          const c = base.slice(); c[si] = alts[j];
          cands.push((c.join(' ') + ' ' + interim).trim());
        }
      });
      candidates = cands.map(function (c) { return c.replace(/\s+/g, ' '); });
      self.energy = Math.min(1, self.energy + 0.45);
      o.onPartial && o.onPartial(text);
      clearTimeout(noSpeechT);
      clearTimeout(silenceT);
      silenceT = setTimeout(stopThis, o.patienceMs || 1800);
    };
    rec.onspeechstart = function () { speechStart = speechStart || performance.now(); self.energy = Math.min(1, self.energy + 0.3); };
    rec.onsoundstart = function () { self.energy = Math.min(1, self.energy + 0.2); };
    rec.onerror = function (e) {
      if (finished) return;
      if (e.error === 'no-speech') return deliver('no-speech');
      if (e.error === 'aborted') return;
      finished = true;
      clearTimeout(silenceT); clearTimeout(noSpeechT); clearTimeout(maxT); clearTimeout(stopT);
      self.rec = null;
      o.onError && o.onError(e.error || 'error');
      o.onEnd && o.onEnd();
    };
    rec.onend = function () { deliver(heard ? 'end' : 'no-speech'); };

    noSpeechT = setTimeout(function () { if (!heard) stopThis(); }, o.noSpeechMs || 9000);
    maxT = setTimeout(stopThis, o.maxMs || 45000);
    try { rec.start(); } catch (e) {
      finished = true;
      o.onError && o.onError('start-failed');
      o.onEnd && o.onEnd();
      return;
    }
    this._stopFallback = function () { clearTimeout(stopT); stopT = setTimeout(function () { deliver('stopped'); }, 1400); };
    void t0;
  };
  DeviceRecognizer.prototype.stop = function () {
    if (!this.rec) return;
    try { this.rec.stop(); } catch (e) { /* noop */ }
    if (this._stopFallback) this._stopFallback();   // iOS sometimes never fires onend
  };
  DeviceRecognizer.prototype.cancel = function () {
    const r = this.rec;
    this.rec = null;
    if (this._kill) this._kill();
    if (r) { try { r.onresult = r.onerror = r.onend = null; r.abort(); } catch (e) { /* noop */ } }
  };
  DeviceRecognizer.prototype.level = function () {
    this.energy *= 0.92;
    if (!this.rec) return 0;
    const t = performance.now() / 1000;
    return Math.min(1, 0.08 + this.energy * (0.65 + 0.35 * Math.sin(t * 17)) + 0.04 * Math.sin(t * 5.3));
  };

  /* ------------------------------------------------------------------ *
   * Cloud recogniser (OpenAI-compatible /audio/transcriptions)
   * ------------------------------------------------------------------ */
  function CloudRecognizer() {
    this.id = 'cloud';
    this.cfg = { kind: 'off' };
    this.supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && root.MediaRecorder);
    this.lvl = 0;
  }
  CloudRecognizer.prototype.configure = function (cfg) { this.cfg = Object.assign({ kind: 'off' }, cfg || {}); };
  CloudRecognizer.prototype.available = function () {
    const c = this.cfg;
    return this.supported && c.kind !== 'off' && (c.kind === 'custom' ? !!c.endpoint : !!c.apiKey);
  };
  CloudRecognizer.prototype.start = async function (o) {
    const self = this;
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch (e) {
      o.onError && o.onError(e && e.name === 'NotAllowedError' ? 'not-allowed' : 'audio-capture');
      o.onEnd && o.onEnd();
      return;
    }
    const AC = root.AudioContext || root.webkitAudioContext;
    const ctx = root.LisanVoice && root.LisanVoice.hub.get() || (AC ? new AC() : null);
    let analyser = null, buf = null;
    if (ctx) {
      const src = ctx.createMediaStreamSource(stream);
      analyser = ctx.createAnalyser(); analyser.fftSize = 1024;
      buf = new Uint8Array(analyser.fftSize);
      src.connect(analyser);
    }
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    const mime = types.find(function (t) { return root.MediaRecorder.isTypeSupported && root.MediaRecorder.isTypeSupported(t); }) || '';
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks = [];
    let speaking = false, lastVoice = 0, startedSpeech = 0, raf = 0, stopped = false;
    const t0 = performance.now();
    this.active = { rec: rec, stream: stream, cancel: false };

    function rms() {
      if (!analyser) return 0;
      analyser.getByteTimeDomainData(buf);
      let s = 0;
      for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; s += v * v; }
      return Math.sqrt(s / buf.length);
    }
    function loop() {
      if (stopped) return;
      const r = rms();
      self.lvl = Math.min(1, r * 6);
      const now = performance.now();
      if (r > 0.035) { if (!speaking) { speaking = true; startedSpeech = now; } lastVoice = now; }
      if (speaking && now - lastVoice > (o.patienceMs || 1800)) return self.stop();
      if (!speaking && now - t0 > (o.noSpeechMs || 9000)) return self.stop();
      if (now - t0 > (o.maxMs || 45000)) return self.stop();
      raf = requestAnimationFrame(loop);
    }
    rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = async function () {
      stopped = true;
      cancelAnimationFrame(raf);
      stream.getTracks().forEach(function (t) { t.stop(); });
      self.lvl = 0;
      const wasCancelled = self.active && self.active.cancel;
      self.active = null;
      if (wasCancelled) { o.onEnd && o.onEnd(); return; }
      if (!speaking) {
        o.onFinal && o.onFinal({ text: '', candidates: [], durationMs: 0, reason: 'no-speech' });
        o.onEnd && o.onEnd();
        return;
      }
      o.onPartial && o.onPartial('…');
      try {
        const blob = new Blob(chunks, { type: rec.mimeType || mime || 'audio/webm' });
        const text = await self.transcribe(blob, o.expected);
        o.onFinal && o.onFinal({ text: text, candidates: text ? [text] : [], durationMs: lastVoice - startedSpeech, reason: 'end' });
      } catch (e) {
        o.onError && o.onError('network');
      }
      o.onEnd && o.onEnd();
    };
    rec.start();
    loop();
  };
  CloudRecognizer.prototype.transcribe = async function (blob, expected) {
    const c = this.cfg;
    const ext = /mp4/.test(blob.type) ? 'm4a' : /ogg/.test(blob.type) ? 'ogg' : 'webm';
    const fd = new FormData();
    fd.append('file', blob, 'speech.' + ext);
    fd.append('model', c.model || 'gpt-4o-mini-transcribe');
    fd.append('language', 'en');
    // Keep the learner's mistakes: the coach needs to hear exactly what was said.
    let prompt = 'An English learner is speaking. Transcribe exactly what is said, word for word, keeping any grammar mistakes. Do not correct the speaker.';
    if (expected && expected.length) prompt += ' They are trying to say: ' + expected.join(' / ');
    fd.append('prompt', prompt);
    const url = c.kind === 'custom' ? c.endpoint : (c.endpoint || 'https://api.openai.com/v1/audio/transcriptions');
    const headers = {};
    if (c.apiKey) headers.Authorization = 'Bearer ' + c.apiKey;
    const r = await fetch(url, { method: 'POST', headers: headers, body: fd });
    if (!r.ok) throw new Error('stt ' + r.status);
    const j = await r.json();
    return String(j.text || '').trim();
  };
  CloudRecognizer.prototype.stop = function () {
    if (this.active && this.active.rec.state !== 'inactive') { try { this.active.rec.stop(); } catch (e) { /* noop */ } }
  };
  CloudRecognizer.prototype.cancel = function () {
    if (this.active) { this.active.cancel = true; this.stop(); }
  };
  CloudRecognizer.prototype.level = function () { return this.lvl; };

  /* ------------------------------------------------------------------ *
   * Facade
   * ------------------------------------------------------------------ */
  const device = new DeviceRecognizer();
  const cloud = new CloudRecognizer();

  const Listen = {
    device: device, cloud: cloud,
    settings: { engine: 'device', patienceMs: 1800, lang: 'en-US' },
    active: null,
    configure: function (s) {
      Object.assign(this.settings, s || {});
      if (s && s.cloud) cloud.configure(s.cloud);
    },
    engine: function () {
      if (this.settings.engine === 'cloud' && cloud.available()) return cloud;
      if (device.supported) return device;
      if (cloud.available()) return cloud;
      return null;
    },
    supported: function () { return !!this.engine(); },
    start: function (o) {
      const eng = this.engine();
      if (!eng) { o.onError && o.onError('unsupported'); o.onEnd && o.onEnd(); return; }
      this.cancel();
      const self = this;
      this.active = eng;
      const opts = Object.assign({ lang: this.settings.lang, patienceMs: this.settings.patienceMs }, o, {
        onEnd: function () { if (self.active === eng) self.active = null; o.onEnd && o.onEnd(); }
      });
      eng.start(opts);
    },
    stop: function () { if (this.active) this.active.stop(); },
    cancel: function () { if (this.active) { this.active.cancel(); this.active = null; } },
    isListening: function () { return !!this.active; },
    level: function () { return this.active ? this.active.level() : 0; }
  };

  root.LisanListen = Listen;
})(window);
