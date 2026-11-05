/* ==========================================================================
   Lisan · voice.js — speech output engine
   --------------------------------------------------------------------------
   The app never talks to a speech API directly. It calls:

       LisanVoice.speak(text, { role:'persona'|'coach', gender, rate, onWord })

   and the engine picks the best voice that can say that line, in order:

     1. Studio voice pack   pre-generated neural clips in /voice (best, free
                            at runtime, works offline). Built with
                            tools/build-voice-pack.mjs.
     2. Cloud neural voice  live TTS (OpenAI / ElevenLabs / your own proxy)
                            for lines that can't be pre-recorded (e.g. the
                            coach repeating YOUR corrected sentence).
     3. Device voice        the best built-in voice this device has, chosen
                            by a quality ranking (Natural/Neural/Premium/Siri
                            voices first, robotic novelty voices never).

   If a provider fails it falls through to the next one, so speech never
   breaks. Upgrading voice quality later = adding clips, or configuring a
   cloud provider, or adding a new provider object — the UI and lesson
   content never change.

   Voice "profiles" decouple content from concrete voices:
       us-female, us-male, gb-female, gb-male, coach-us, coach-gb
   ========================================================================== */
(function (root) {
  'use strict';

  const VK = root.LisanVoiceKey;
  const ua = navigator.userAgent || '';
  const IS_IOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const AC = root.AudioContext || root.webkitAudioContext;
  // Routing <audio> through Web Audio enables the clarity chain + true level
  // metering. Skipped on iOS (the mute switch would silence it) and on file://
  // (browsers output silence for "cross-origin" local files).
  const CAN_ROUTE = !!AC && !IS_IOS && /^https?:$/.test(location.protocol);

  /* ------------------------------------------------------------------ *
   * Profiles
   * ------------------------------------------------------------------ */
  function profileId(o) {
    const a = o.accent === 'gb' ? 'gb' : 'us';
    if (o.role === 'coach') return 'coach-' + a;
    return a + '-' + (o.gender === 'male' ? 'male' : 'female');
  }
  function profileInfo(id) {
    const p = id.split('-');
    if (p[0] === 'coach') return { role: 'coach', accent: p[1], gender: 'female', lang: p[1] === 'gb' ? 'en-GB' : 'en-US' };
    return { role: 'persona', accent: p[0], gender: p[1], lang: p[0] === 'gb' ? 'en-GB' : 'en-US' };
  }
  const PROFILE_IDS = ['us-female', 'us-male', 'gb-female', 'gb-male', 'coach-us', 'coach-gb'];

  function splitSentences(text) {
    const out = [];
    const re = /[^.!?]+(?:[.!?]+["')\]]*)?/g;
    let m;
    while ((m = re.exec(text))) {
      if (m[0].trim()) out.push({ text: m[0].trim(), offset: m.index + (m[0].length - m[0].trimStart().length) });
    }
    return out.length ? out : [{ text: text, offset: 0 }];
  }
  function estimateMs(text, rate) { return Math.max(700, (text.length / (14.5 * (rate || 1))) * 1000); }

  /* ------------------------------------------------------------------ *
   * Audio hub: one AudioContext for playback FX, meters and UI sounds
   * ------------------------------------------------------------------ */
  const Hub = {
    ctx: null,
    get: function () {
      if (!AC) return null;
      if (!this.ctx) {
        try {
          this.ctx = new AC();
          if (navigator.audioSession) { try { navigator.audioSession.type = 'playback'; } catch (e) { /* noop */ } }
        } catch (e) { return null; }
      }
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(function () {});
      return this.ctx;
    }
  };

  /* ------------------------------------------------------------------ *
   * Player — one reusable <audio> element (needed to stay unlocked on iOS)
   * with an optional clarity chain: high-pass → presence lift → gentle
   * compression. Tune here to change how every voice sounds.
   * ------------------------------------------------------------------ */
  const Player = {
    el: null, analyser: null, fxIn: null, dry: null, buf: null, routed: false, fx: true,
    ensure: function () {
      if (this.el) return this.el;
      const el = new Audio();
      el.preload = 'auto';
      el.setAttribute('playsinline', '');
      this.el = el;
      return el;
    },
    route: function () {
      if (this.routed || !CAN_ROUTE) return;
      const ctx = Hub.get();
      if (!ctx) return;
      try {
        const src = ctx.createMediaElementSource(this.ensure());
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 75;
        const presence = ctx.createBiquadFilter(); presence.type = 'peaking'; presence.frequency.value = 3200; presence.Q.value = 0.9; presence.gain.value = 2.5;
        const air = ctx.createBiquadFilter(); air.type = 'highshelf'; air.frequency.value = 9000; air.gain.value = 1.5;
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -20; comp.knee.value = 12; comp.ratio.value = 2.5; comp.attack.value = 0.005; comp.release.value = 0.2;
        const makeup = ctx.createGain(); makeup.gain.value = 1.12;
        const dry = ctx.createGain();
        const wet = ctx.createGain();
        const analyser = ctx.createAnalyser(); analyser.fftSize = 512; analyser.smoothingTimeConstant = 0.6;
        src.connect(hp); hp.connect(presence); presence.connect(air); air.connect(comp); comp.connect(makeup); makeup.connect(wet);
        src.connect(dry);
        wet.connect(analyser); dry.connect(analyser); analyser.connect(ctx.destination);
        this.wet = wet; this.dry = dry; this.analyser = analyser;
        this.buf = new Uint8Array(analyser.fftSize);
        this.routed = true;
        this.setFx(this.fx);
      } catch (e) { this.routed = false; }
    },
    setFx: function (on) {
      this.fx = !!on;
      if (this.wet) { this.wet.gain.value = on ? 1 : 0; this.dry.gain.value = on ? 0 : 1; }
    },
    level: function () {
      if (!this.analyser || !this.el || this.el.paused) return null;
      this.analyser.getByteTimeDomainData(this.buf);
      let sum = 0;
      for (let i = 0; i < this.buf.length; i++) { const v = (this.buf[i] - 128) / 128; sum += v * v; }
      return Math.min(1, Math.sqrt(sum / this.buf.length) * 4.2);
    },
    /** Play a URL. Resolves when finished (or stopped). */
    play: function (url, opts) {
      const self = this;
      const el = this.ensure();
      this.route();
      return new Promise(function (resolve, reject) {
        let done = false, raf = 0;
        function cleanup() { el.onended = el.onerror = el.onplaying = null; cancelAnimationFrame(raf); }
        function finish(err) { if (done) return; done = true; cleanup(); err ? reject(err) : resolve(); }
        if (opts.signal) {
          if (opts.signal.aborted) return resolve();
          opts.signal.addEventListener('abort', function () { try { el.pause(); } catch (e) { /* noop */ } finish(); }, { once: true });
        }
        function tick() {
          if (done) return;
          if (el.duration && isFinite(el.duration) && opts.onProgress) opts.onProgress(Math.min(1, el.currentTime / el.duration));
          raf = requestAnimationFrame(tick);
        }
        el.onplaying = function () { if (opts.onStart) opts.onStart(); tick(); };
        el.onended = function () { if (opts.onProgress) opts.onProgress(1); finish(); };
        el.onerror = function () { finish(new Error('audio-error')); };
        el.src = url;
        el.playbackRate = opts.rate || 1;
        try { el.preservesPitch = true; el.webkitPreservesPitch = true; } catch (e) { /* noop */ }
        const p = el.play();
        if (p && p.catch) p.catch(function (e) { finish(e); });
        self.current = el;
      });
    },
    stop: function () {
      if (this.el) { try { this.el.pause(); } catch (e) { /* noop */ } }
    },
    unlock: function () {
      const el = this.ensure();
      if (this.unlocked) return;
      this.unlocked = true;
      try {
        el.src = SILENT_WAV;
        const p = el.play();
        if (p && p.catch) p.catch(function () {});
      } catch (e) { /* noop */ }
    }
  };

  // 0.05s of silence — used to unlock audio on the first tap (iOS).
  const SILENT_WAV = (function () {
    const n = 2205, b = new ArrayBuffer(44 + n * 2), v = new DataView(b);
    function w(o, s) { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 44100, true); v.setUint32(28, 88200, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    w(36, 'data'); v.setUint32(40, n * 2, true);
    let bin = ''; const bytes = new Uint8Array(b);
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return 'data:audio/wav;base64,' + btoa(bin);
  })();

  /* ------------------------------------------------------------------ *
   * Provider 1 — Studio voice pack (pre-generated clips)
   * ------------------------------------------------------------------ */
  function ClipProvider(base) {
    this.id = 'studio';
    this.label = 'Studio voice pack';
    this.base = base || 'voice/';
    this.manifest = null;
    const self = this;
    this.ready = fetch(this.base + 'manifest.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (m) { self.manifest = m; })
      .catch(function () { self.manifest = null; });
  }
  ClipProvider.prototype.count = function (profile) {
    const c = this.manifest && this.manifest.clips;
    if (!c) return 0;
    if (profile) return c[profile] ? Object.keys(c[profile]).length : 0;
    return Object.keys(c).reduce(function (n, k) { return n + Object.keys(c[k]).length; }, 0);
  };
  ClipProvider.prototype.available = function () { return this.count() > 0; };
  ClipProvider.prototype.canSpeak = function (text, profile) {
    const c = this.manifest && this.manifest.clips && this.manifest.clips[profile];
    return !!(c && c[VK.clipKey(profile, text)]);
  };
  ClipProvider.prototype.speak = function (text, profile, opts) {
    const file = this.manifest.clips[profile][VK.clipKey(profile, text)];
    return Player.play(this.base + file, opts);
  };
  ClipProvider.prototype.describe = function () {
    const n = this.count();
    return n ? n + ' studio clips installed' : 'Not installed';
  };

  /* ------------------------------------------------------------------ *
   * Provider 2 — Cloud neural voice (optional, configured in Settings)
   * ------------------------------------------------------------------ */
  const CLOUD_DEFAULTS = {
    openai: {
      endpoint: 'https://api.openai.com/v1/audio/speech', model: 'gpt-4o-mini-tts',
      voices: { 'us-female': 'coral', 'us-male': 'ash', 'gb-female': 'fable', 'gb-male': 'onyx', 'coach-us': 'sage', 'coach-gb': 'sage' }
    },
    elevenlabs: {
      endpoint: 'https://api.elevenlabs.io/v1/text-to-speech/', model: 'eleven_multilingual_v2',
      voices: {
        'us-female': '21m00Tcm4TlvDq8ikWAM', 'us-male': 'pNInz6obpgDQGcFmaJgB',
        'gb-female': 'Xb7hH8MSUJpSbSDYk0k2', 'gb-male': 'JBFqnCBsd6RMkjVDRZzb',
        'coach-us': 'EXAVITQu4vr4xnAQxRWK', 'coach-gb': 'Xb7hH8MSUJpSbSDYk0k2'
      }
    },
    custom: { endpoint: '', model: '', voices: {} }
  };
  const SPEAKING_STYLE = 'Speak clearly and warmly, like a friendly native speaker talking to an English learner. Natural rhythm, slightly slower than normal, crisp consonants.';

  function CloudProvider() {
    this.id = 'cloud';
    this.label = 'Cloud neural voice';
    this.cfg = { kind: 'off' };
    this.mem = new Map();
  }
  CloudProvider.prototype.configure = function (cfg) {
    this.cfg = Object.assign({ kind: 'off' }, cfg || {});
    this.mem.clear();
  };
  CloudProvider.prototype.available = function () {
    const c = this.cfg;
    if (!c || c.kind === 'off' || !CLOUD_DEFAULTS[c.kind]) return false;
    return c.kind === 'custom' ? !!c.endpoint : !!c.apiKey;
  };
  CloudProvider.prototype.canSpeak = function () { return this.available(); };
  CloudProvider.prototype.voiceFor = function (profile) {
    const d = CLOUD_DEFAULTS[this.cfg.kind] || {};
    return (this.cfg.voices && this.cfg.voices[profile]) || (d.voices && d.voices[profile]) || profile;
  };
  CloudProvider.prototype.signature = function (profile) {
    const c = this.cfg;
    return VK.clipKey(c.kind + '|' + (c.model || '') + '|' + (c.endpoint || ''), this.voiceFor(profile));
  };
  CloudProvider.prototype.request = function (text, profile) {
    const c = this.cfg, d = CLOUD_DEFAULTS[c.kind], info = profileInfo(profile);
    const voice = this.voiceFor(profile);
    let url, init;
    if (c.kind === 'openai') {
      url = c.endpoint || d.endpoint;
      init = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + c.apiKey },
        body: JSON.stringify({
          model: c.model || d.model, voice: voice, input: text, response_format: 'mp3',
          instructions: SPEAKING_STYLE + (info.accent === 'gb' ? ' Use a British English accent.' : ' Use an American English accent.')
        })
      };
    } else if (c.kind === 'elevenlabs') {
      url = (c.endpoint || d.endpoint) + encodeURIComponent(voice) + '?output_format=mp3_44100_128';
      init = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'xi-api-key': c.apiKey, Accept: 'audio/mpeg' },
        body: JSON.stringify({
          text: text, model_id: c.model || d.model,
          voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true }
        })
      };
    } else {
      // Your own server: POST {text, profile, voice, accent, gender, lang, role} → audio bytes.
      url = c.endpoint;
      const headers = { 'Content-Type': 'application/json' };
      if (c.apiKey) headers.Authorization = 'Bearer ' + c.apiKey;
      init = {
        method: 'POST', headers: headers,
        body: JSON.stringify({ text: text, profile: profile, voice: voice, accent: info.accent, gender: info.gender, lang: info.lang, role: info.role })
      };
    }
    return fetch(url, init).then(function (r) {
      if (!r.ok) throw new Error('cloud-tts ' + r.status);
      return r.blob();
    }).then(function (blob) {
      if (!blob.size) throw new Error('cloud-tts empty');
      return blob;
    });
  };
  /** Returns a playable URL, using memory + persistent Cache Storage. */
  CloudProvider.prototype.fetchClip = function (text, profile) {
    const self = this;
    const key = this.signature(profile) + '/' + VK.clipKey(profile, text);
    if (this.mem.has(key)) return this.mem.get(key);
    const cacheUrl = 'https://lisan.local/voice-cache/' + key + '.mp3';
    const p = (async function () {
      let cache = null;
      try { if (root.caches) cache = await root.caches.open('lisan-voice-v1'); } catch (e) { cache = null; }
      if (cache) {
        try { const hit = await cache.match(cacheUrl); if (hit) return URL.createObjectURL(await hit.blob()); } catch (e) { /* miss */ }
      }
      const blob = await self.request(text, profile);
      if (cache) { try { await cache.put(cacheUrl, new Response(blob, { headers: { 'Content-Type': blob.type || 'audio/mpeg' } })); } catch (e) { /* quota */ } }
      return URL.createObjectURL(blob);
    })();
    this.mem.set(key, p);
    p.catch(function () { self.mem.delete(key); });
    return p;
  };
  CloudProvider.prototype.prefetch = function (text, profile) {
    if (this.available()) this.fetchClip(text, profile).catch(function () {});
  };
  CloudProvider.prototype.speak = function (text, profile, opts) {
    return this.fetchClip(text, profile).then(function (url) {
      if (opts.signal && opts.signal.aborted) return;
      return Player.play(url, opts);
    });
  };
  CloudProvider.prototype.describe = function () {
    if (!this.available()) return 'Off';
    if (this.cfg.kind === 'custom' && this.cfg.endpoint === 'api/tts') return 'Lisan server · on';
    return ({ openai: 'OpenAI', elevenlabs: 'ElevenLabs', custom: 'Custom endpoint' })[this.cfg.kind] + ' · on';
  };

  /* ------------------------------------------------------------------ *
   * Provider 3 — Device voice (speechSynthesis) with quality ranking
   * ------------------------------------------------------------------ */
  const FEMALE_NAMES = /\b(samantha|ava|allison|susan|zoe|victoria|karen|moira|tessa|serena|kate|stephanie|fiona|martha|nicky|aria|jenny|michelle|sonia|libby|maisie|emma|sara|joanna|salli|kimberly|ivy|kendra|amy|zira|hazel|catherine|natasha|clara|evelyn|shelley|flo|sandy|jane|ana|ashley|cora|elizabeth|emily|jessa|monica|nancy|olivia|isabella|amber|abbi|bella|hollie|mia|sienna|aoife|siri female)\b/i;
  const MALE_NAMES = /\b(daniel|alex|tom|aaron|arthur|evan|nathan|oliver|gordon|lee|rishi|guy|ryan|thomas|christopher|eric|davis|jason|tony|brian|matthew|joey|justin|david|mark|george|james|reed|eddy|andrew|brandon|roger|steffan|william|alfie|elliot|ethan|noah|liam|siri male)\b/i;
  const NOVELTY = /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy|grandma|grandpa|rocko|eddy|flo|reed|sandy|shelley)\b/i;

  function voiceGender(v) {
    const n = v.name || '';
    if (/female|woman/i.test(n)) return 'female';
    if (/\bmale\b|\bman\b/i.test(n)) return 'male';
    if (FEMALE_NAMES.test(n)) return 'female';
    if (MALE_NAMES.test(n)) return 'male';
    return null;
  }
  function scoreVoice(v, info) {
    const lang = (v.lang || '').replace('_', '-');
    if (!/^en(-|$)/i.test(lang)) return -1e9;
    const n = v.name || '';
    let s = 0;
    if (lang.toLowerCase() === info.lang.toLowerCase()) s += 40;
    else if (/^en-(US|GB)$/i.test(lang)) s += 14;
    else if (/^en-(AU|CA|IE|NZ)$/i.test(lang)) s += 8;
    if (/natural|neural/i.test(n)) s += 60;
    if (/premium/i.test(n)) s += 55;
    if (/siri/i.test(n)) s += 50;
    if (/enhanced/i.test(n)) s += 45;
    if (/google/i.test(n)) s += 32;
    if (/online/i.test(n)) s += 20;
    if (/\b(ava|samantha|allison|zoe|evan|nathan|serena|daniel|kate|aria|jenny|guy|sonia|ryan|libby|emma|andrew|brian|michelle|christopher)\b/i.test(n)) s += 14;
    if (/compact|eloquence|espeak|robot/i.test(n)) s -= 40;
    if (NOVELTY.test(n)) s -= 500;
    const g = voiceGender(v);
    if (g === info.gender) s += 30; else if (g) s -= 45;
    if (v.localService === false) s += 4;
    if (v.default) s += 2;
    return s;
  }

  function DeviceProvider() {
    this.id = 'device';
    this.label = 'Device voice';
    this.synth = root.speechSynthesis || null;
    this.voices = [];
    this.overrides = {};
    this.picked = {};
    this.keep = [];
    const self = this;
    function load() {
      if (!self.synth) return;
      const v = self.synth.getVoices();
      if (v && v.length) { self.voices = v; self.picked = {}; if (self.onvoices) self.onvoices(); }
    }
    if (this.synth) {
      load();
      if ('onvoiceschanged' in this.synth) this.synth.addEventListener('voiceschanged', load);
      setTimeout(load, 300); setTimeout(load, 1500);
    }
  }
  DeviceProvider.prototype.available = function () { return !!this.synth; };
  DeviceProvider.prototype.canSpeak = function () { return !!this.synth; };
  DeviceProvider.prototype.ranked = function (profile) {
    const info = profileInfo(profile);
    return this.voices
      .map(function (v) { return { v: v, s: scoreVoice(v, info) }; })
      .filter(function (x) { return x.s > -1e8; })
      .sort(function (a, b) { return b.s - a.s; });
  };
  DeviceProvider.prototype.pick = function (profile) {
    const want = this.overrides[profileInfo(profile).gender];
    if (want) {
      const o = this.voices.find(function (v) { return v.voiceURI === want || v.name === want; });
      if (o) return o;
    }
    if (this.picked[profile] !== undefined) return this.picked[profile];
    const r = this.ranked(profile);
    // Coach gets a different voice from the same-gender character when possible.
    let choice = r.length ? r[0].v : null;
    if (profileInfo(profile).role === 'coach' && r.length > 1) {
      const persona = this.pick(profileInfo(profile).accent + '-female');
      if (persona && choice && persona.voiceURI === choice.voiceURI && r[1].s > r[0].s - 40) choice = r[1].v;
    }
    this.picked[profile] = choice;
    return choice;
  };
  DeviceProvider.prototype.speak = function (text, profile, opts) {
    const self = this, synth = this.synth, info = profileInfo(profile);
    const voice = this.pick(profile);
    const chunks = splitSentences(text);
    const rate = opts.rate || 1;
    return new Promise(function (resolve, reject) {
      let i = 0, done = false, wd = 0, sawBoundary = false, raf = 0, chunkStart = 0;
      function finish(err) {
        if (done) return; done = true;
        clearTimeout(wd); cancelAnimationFrame(raf);
        self.keep = [];
        err ? reject(err) : resolve();
      }
      if (opts.signal) {
        if (opts.signal.aborted) return resolve();
        opts.signal.addEventListener('abort', function () { synth.cancel(); finish(); }, { once: true });
      }
      // Estimated word progress for voices that don't emit boundary events.
      function estimate() {
        if (done) return;
        if (!sawBoundary && opts.onWord && i > 0) {
          const c = chunks[i - 1];
          const frac = Math.min(0.98, (performance.now() - chunkStart) / estimateMs(c.text, rate));
          opts.onWord(c.offset + Math.floor(frac * c.text.length));
        }
        raf = requestAnimationFrame(estimate);
      }
      function next() {
        if (done) return;
        clearTimeout(wd);
        if (i >= chunks.length) return finish();
        const c = chunks[i++];
        const u = new SpeechSynthesisUtterance(c.text);
        if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = info.lang;
        // Most built-in voices sound rushed at 1.0 for learners.
        u.rate = Math.max(0.5, Math.min(1.6, rate * 0.94));
        u.pitch = 1;
        u.onstart = function () {
          chunkStart = performance.now();
          if (i === 1 && opts.onStart) opts.onStart();
        };
        u.onboundary = function (e) {
          if (e.name && e.name !== 'word') return;
          sawBoundary = true;
          if (opts.onWord) opts.onWord(c.offset + (e.charIndex || 0));
        };
        u.onend = function () { next(); };
        u.onerror = function (e) {
          if (e.error === 'interrupted' || e.error === 'canceled') return finish();
          finish(new Error(e.error || 'tts-error'));
        };
        self.keep.push(u); // prevent GC from dropping callbacks (Chrome)
        // Watchdog: some engines never fire onend.
        wd = setTimeout(next, estimateMs(c.text, rate) * 2.4 + 2500);
        synth.speak(u);
      }
      synth.cancel();
      setTimeout(function () { next(); raf = requestAnimationFrame(estimate); }, 60);
    });
  };
  DeviceProvider.prototype.describe = function (profile) {
    const v = this.pick(profile || 'us-female');
    return v ? v.name : (this.synth ? 'System default' : 'Not supported');
  };
  DeviceProvider.prototype.list = function (gender, accent) {
    const info = { lang: accent === 'gb' ? 'en-GB' : 'en-US', gender: gender };
    return this.voices
      .map(function (v) { return { v: v, s: scoreVoice(v, info) }; })
      .filter(function (x) { return x.s > -1e8; })
      .sort(function (a, b) { return b.s - a.s; })
      .map(function (x) { return x.v; });
  };

  /* ------------------------------------------------------------------ *
   * Engine
   * ------------------------------------------------------------------ */
  const clips = new ClipProvider('voice/');
  const cloud = new CloudProvider();
  const device = new DeviceProvider();

  const Voice = {
    providers: [clips, cloud, device],
    clips: clips, cloud: cloud, device: device,
    settings: { accent: 'us', rate: 1, fx: true },
    speaking: false,
    lastProvider: null,
    _ctl: null,
    _sim: { t0: 0 },

    configure: function (s) {
      Object.assign(this.settings, s || {});
      Player.setFx(this.settings.fx);
      if (s && s.cloud) cloud.configure(s.cloud);
      if (s && s.deviceVoices) { device.overrides = s.deviceVoices; device.picked = {}; }
    },
    profileFor: function (o) { return profileId({ role: o.role, gender: o.gender, accent: o.accent || this.settings.accent }); },

    /**
     * Speak a line.
     *   opts.role      'persona' | 'coach'
     *   opts.gender    'female' | 'male'
     *   opts.rate      multiplier on top of the user's speed setting
     *   opts.onStart() / opts.onWord(charIndex)
     * Resolves { provider } when finished, interrupted or failed gracefully.
     */
    speak: async function (text, opts) {
      opts = opts || {};
      this.stop();
      const ctl = new AbortController();
      this._ctl = ctl;
      const profile = this.profileFor(opts);
      const rate = (opts.rate || 1) * (this.settings.rate || 1);
      const self = this;
      await clips.ready;
      const chain = this.providers.filter(function (p) { return p.available() && p.canSpeak(text, profile); });
      const len = text.length;
      for (let k = 0; k < chain.length; k++) {
        const p = chain[k];
        if (ctl.signal.aborted) return { provider: null };
        let lastWord = -1;
        try {
          this.speaking = true;
          this._sim.t0 = performance.now();
          this.lastProvider = p.id;
          await p.speak(text, profile, {
            rate: rate,
            signal: ctl.signal,
            onStart: function () { self._sim.t0 = performance.now(); if (opts.onStart) opts.onStart(p.id); },
            onWord: function (ci) { if (ci !== lastWord) { lastWord = ci; if (opts.onWord) opts.onWord(ci); } },
            onProgress: function (f) {
              const ci = Math.floor(f * len);
              if (ci !== lastWord) { lastWord = ci; if (opts.onWord) opts.onWord(ci); }
            }
          });
          if (this._ctl === ctl) this.speaking = false;
          return { provider: p.id };
        } catch (e) {
          if (ctl.signal.aborted) break;
          if (root.console) console.warn('[voice] ' + p.id + ' failed, falling back:', e && e.message);
        }
      }
      // Nothing could speak: give the reader time, then move on.
      if (!ctl.signal.aborted) {
        await new Promise(function (r) {
          const t = setTimeout(r, Math.min(4000, estimateMs(text, rate)));
          ctl.signal.addEventListener('abort', function () { clearTimeout(t); r(); }, { once: true });
        });
      }
      if (this._ctl === ctl) this.speaking = false;
      return { provider: null };
    },

    stop: function () {
      if (this._ctl) { this._ctl.abort(); this._ctl = null; }
      Player.stop();
      if (device.synth) { try { device.synth.cancel(); } catch (e) { /* noop */ } }
      this.speaking = false;
    },

    /** Warm the cloud cache for a line you'll need soon. */
    prefetch: function (text, opts) {
      const profile = this.profileFor(opts || {});
      if (clips.canSpeak(text, profile)) return;
      cloud.prefetch(text, profile);
    },

    /** 0..1 loudness of the current speech (real when measurable). */
    level: function () {
      if (!this.speaking) return 0;
      const real = Player.level();
      if (real !== null && this.lastProvider !== 'device') return real;
      // Speech-like envelope for engines we can't measure (syllable rhythm).
      const t = (performance.now() - this._sim.t0) / 1000;
      const syll = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 4.1 + Math.sin(t * 2.3) * 2.2);
      const phrase = 0.55 + 0.45 * Math.sin(t * 2 * Math.PI * 0.55 + 1.3);
      return Math.max(0, Math.min(1, 0.18 + syll * phrase * 0.62 + (Math.random() - 0.5) * 0.08));
    },

    /** Call from the first user gesture (required by iOS / Safari). */
    unlock: function () {
      Hub.get();
      Player.unlock();
      if (device.synth && !this._ttsUnlocked) {
        this._ttsUnlocked = true;
        try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; device.synth.speak(u); } catch (e) { /* noop */ }
      }
    },

    /** For the Settings screen. */
    status: function (accent) {
      const a = accent || this.settings.accent;
      return {
        studio: { on: clips.available(), text: clips.describe(), count: clips.count() },
        cloud: { on: cloud.available(), text: cloud.describe() },
        device: {
          on: device.available(),
          female: device.describe(a + '-female'),
          male: device.describe(a + '-male')
        },
        routed: CAN_ROUTE
      };
    },

    canRoute: CAN_ROUTE,
    profileIds: PROFILE_IDS,
    profileInfo: profileInfo,
    cloudDefaults: CLOUD_DEFAULTS,
    hub: Hub
  };

  /* ------------------------------------------------------------------ *
   * UI sound design — tiny synthesized cues (no files to load)
   * ------------------------------------------------------------------ */
  const Sfx = {
    enabled: true,
    tone: function (freqs, opts) {
      if (!this.enabled) return;
      const ctx = Hub.get();
      if (!ctx) return;
      opts = opts || {};
      const t0 = ctx.currentTime + 0.01;
      const gap = opts.gap || 0.09, dur = opts.dur || 0.16, vol = opts.vol || 0.05;
      freqs.forEach(function (f, i) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = opts.type || 'sine';
        const s = t0 + i * gap;
        o.frequency.setValueAtTime(f, s);
        if (opts.glide) o.frequency.exponentialRampToValueAtTime(f * opts.glide, s + dur);
        g.gain.setValueAtTime(0.0001, s);
        g.gain.exponentialRampToValueAtTime(vol, s + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
        o.connect(g); g.connect(ctx.destination);
        o.start(s); o.stop(s + dur + 0.02);
      });
    },
    listenOn: function () { this.tone([587.33, 880], { gap: 0.07, dur: 0.12, vol: 0.04 }); },
    listenOff: function () { this.tone([880, 587.33], { gap: 0.07, dur: 0.12, vol: 0.035 }); },
    success: function () { this.tone([659.25, 987.77], { gap: 0.1, dur: 0.22, vol: 0.05, type: 'triangle' }); },
    nudge: function () { this.tone([440], { dur: 0.18, vol: 0.035, type: 'sine', glide: 0.94 }); },
    complete: function () { this.tone([523.25, 659.25, 783.99, 1046.5], { gap: 0.11, dur: 0.32, vol: 0.045, type: 'triangle' }); }
  };

  root.LisanVoice = Voice;
  root.LisanSfx = Sfx;
})(window);
