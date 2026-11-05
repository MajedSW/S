/* ==========================================================================
   Lisan · app.js — screens, conversation flow, progress, settings
   ========================================================================== */
(function () {
  'use strict';

  const C = window.LisanCoach;
  const V = window.LisanVoice;
  const L = window.LisanListen;
  const S = window.LisanSfx;
  const CONTENT = window.LisanContent;
  const SCENARIOS = CONTENT.SCENARIOS;
  const CATEGORIES = CONTENT.CATEGORIES;
  const COMMON = CONTENT.COMMON;

  /* ------------------------------------------------------------------ *
   * Helpers
   * ------------------------------------------------------------------ */
  const $ = function (s, el) { return (el || document).querySelector(s); };
  const $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  const esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function dayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  const ICONS = {
    mic: '<rect x="9" y="2.5" width="6" height="12" rx="3"/><path d="M19 10.5v.5a7 7 0 0 1-14 0v-.5"/><path d="M12 18v3.5"/><path d="M8.5 21.5h7"/>',
    stop: '<rect x="7" y="7" width="10" height="10" rx="2.5"/>',
    keyboard: '<rect x="2.5" y="5.5" width="19" height="13" rx="2.5"/><path d="M6.5 9.5h.01M10.5 9.5h.01M14.5 9.5h.01M18 9.5h.01M6.5 12.5h.01M18 12.5h.01M10 12.5h4M7.5 15.5h9"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    chev: '<path d="m9 18 6-6-6-6"/>',
    volume: '<path d="M11 5 6.5 9H3v6h3.5L11 19z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
    bulb: '<path d="M9.5 18h5M10.5 21.5h3"/><path d="M12 2.5a6.5 6.5 0 0 0-3.9 11.7c.6.5.9 1.1.9 1.8v.5h6V16c0-.7.3-1.3.9-1.8A6.5 6.5 0 0 0 12 2.5z"/>',
    sliders: '<path d="M4 6.5h9M17 6.5h3M4 12h3M11 12h9M4 17.5h11M19 17.5h1"/><circle cx="15" cy="6.5" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17.5" r="2"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    sparkle: '<path d="M12 3.5l1.8 4.9 4.9 1.8-4.9 1.8L12 16.9l-1.8-4.9-4.9-1.8 4.9-1.8z"/><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
    send: '<path d="M21.5 2.5 11 13"/><path d="m21.5 2.5-6.5 19-4-8.5-8.5-4z"/>',
    redo: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5"/><path d="M3.5 3.5v5h5"/>',
    skip: '<path d="m5.5 4.5 10 7.5-10 7.5z"/><path d="M19 5v14"/>',
    plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    id: '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><circle cx="9" cy="11" r="2.3"/><path d="M5.8 16.5a3.5 3.5 0 0 1 6.4 0M14.5 9.5h3.5M14.5 13h3.5"/>',
    passport: '<rect x="4.5" y="2.5" width="15" height="19" rx="2.5"/><circle cx="12" cy="10" r="3.2"/><path d="M8.8 10h6.4M12 6.8c1 .9 1.5 2 1.5 3.2s-.5 2.3-1.5 3.2c-1-.9-1.5-2-1.5-3.2s.5-2.3 1.5-3.2zM9 17h6"/>',
    bed: '<path d="M2.5 5v15"/><path d="M2.5 9h16a3 3 0 0 1 3 3v8"/><path d="M2.5 16.5h19"/><path d="M6.5 9v7.5"/>',
    car: '<path d="M5 17H3.5v-4.5l2-5.5h11l3 5.5H21V17h-1.5"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/><path d="M9.5 17h5M4.5 12.5h15"/>',
    coffee: '<path d="M17 8.5h1a3.5 3.5 0 0 1 0 7h-1"/><path d="M3.5 8.5H17V16a4.5 4.5 0 0 1-4.5 4.5H8A4.5 4.5 0 0 1 3.5 16z"/><path d="M7 2.5v2.5M10.5 2.5v2.5M14 2.5v2.5"/>',
    pill: '<path d="m10.5 20.5 10-10a5 5 0 1 0-7-7l-10 10a5 5 0 1 0 7 7z"/><path d="m8.5 8.5 7 7"/>',
    bag: '<path d="M6 2.5 3.5 6v13.5A2 2 0 0 0 5.5 21.5h13a2 2 0 0 0 2-2V6L18 2.5z"/><path d="M3.5 6h17"/><path d="M15.5 10a3.5 3.5 0 0 1-7 0"/>',
    users: '<path d="M16 20.5v-1.5a4 4 0 0 0-4-4H6.5a4 4 0 0 0-4 4v1.5"/><circle cx="9.2" cy="7.5" r="3.8"/><path d="M21.5 20.5v-1.5a4 4 0 0 0-3-3.9"/><path d="M15.5 3.7a3.8 3.8 0 0 1 0 7.5"/>',
    briefcase: '<rect x="2.5" y="7" width="19" height="13.5" rx="2.5"/><path d="M8.5 7V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2"/><path d="M2.5 12.5h19"/>',
    home: '<path d="m3.5 10 8.5-6.5 8.5 6.5v9.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><path d="M9.5 21.5v-7h5v7"/>',
    book: '<path d="M2.5 4.5h6a3.5 3.5 0 0 1 3.5 3.5v12.5a2.6 2.6 0 0 0-2.6-2.6H2.5z"/><path d="M21.5 4.5h-6A3.5 3.5 0 0 0 12 8v12.5a2.6 2.6 0 0 1 2.6-2.6h6.9z"/>',
    chart: '<path d="M3.5 3.5v17h17"/><path d="M8 16.5v-6M12.5 16.5v-10M17 16.5v-4"/>',
    trash: '<path d="M3.5 6.5h17M9 6.5V4.5h6v2M18.5 6.5l-.9 13a2 2 0 0 1-2 1.9H8.4a2 2 0 0 1-2-1.9l-.9-13"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5.5h3a3 3 0 0 1-3.5 4M7 5.5H4a3 3 0 0 0 3.5 4"/>',
    wave: '<path d="M3 10.5v3M7 7v10M11 4v16M15 7.5v9M19 10v4"/>',
    clock: '<circle cx="12" cy="12" r="9.5"/><path d="M12 7v5l3.5 2"/>',
    target: '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="1.5"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    info: '<circle cx="12" cy="12" r="9.5"/><path d="M12 16v-4.5M12 8h.01"/>',
    alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    headphones: '<path d="M3.5 18v-6a8.5 8.5 0 0 1 17 0v6"/><path d="M20.5 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3.5 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-3z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>'
  };
  function icon(n, cls) { return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[n] || '') + '</svg>'; }

  /** Escape Arabic text and isolate embedded English so mixed lines read cleanly. */
  function arHtml(text) {
    const str = String(text == null ? '' : text);
    const re = /[A-Za-z][A-Za-z0-9'\u2019\s\/+\u2026,-]*[A-Za-z0-9'\u2019\u2026]|[A-Za-z]/g;
    let out = '', last = 0, m;
    while ((m = re.exec(str))) {
      out += esc(str.slice(last, m.index)) + '<bdi class="lat">' + esc(m[0]) + '</bdi>';
      last = m.index + m[0].length;
    }
    return out + esc(str.slice(last));
  }

  function wordSpans(text, base) {
    base = base || 0;
    let html = '', last = 0, m;
    const re = /\S+/g;
    while ((m = re.exec(text))) {
      html += esc(text.slice(last, m.index)) + '<span class="w" data-s="' + (base + m.index) + '">' + esc(m[0]) + '</span>';
      last = m.index + m[0].length;
    }
    return html + esc(text.slice(last));
  }
  function markWord(container, ci) {
    if (!container) return;
    const ws = container.querySelectorAll('.w');
    let hit = null;
    for (let i = 0; i < ws.length; i++) { if (+ws[i].dataset.s <= ci) hit = ws[i]; else break; }
    for (let i = 0; i < ws.length; i++) ws[i].classList.toggle('cur', ws[i] === hit);
  }
  function clearMarks(container) { if (container) $$('.w.cur', container).forEach(function (w) { w.classList.remove('cur'); }); }

  /* ------------------------------------------------------------------ *
   * Store (localStorage, never required to work)
   * ------------------------------------------------------------------ */
  const Store = {
    KEY: 'lisan.v1',
    data: null,
    defaults: function () {
      return {
        settings: {
          onboarded: false, level: 'Beginner', accent: 'us', rate: 0.95, arabic: 'show',
          patience: 'normal', autoListen: false, sounds: true, theme: 'system', goalMin: 5, fx: true,
          stt: 'device', cloud: { kind: 'off', apiKey: '', endpoint: '', sttEndpoint: '', model: '', voices: {} },
          deviceVoices: { female: '', male: '' }
        },
        progress: { days: {}, scenarios: {}, totals: { sentences: 0, fixes: 0, convos: 0, sec: 0 } },
        phrases: []
      };
    },
    load: function () {
      const d = this.defaults();
      let raw = null;
      try { raw = JSON.parse(localStorage.getItem(this.KEY) || 'null'); } catch (e) { raw = null; }
      if (raw && typeof raw === 'object') {
        Object.assign(d.settings, raw.settings || {});
        d.settings.cloud = Object.assign(this.defaults().settings.cloud, (raw.settings || {}).cloud || {});
        d.settings.deviceVoices = Object.assign({ female: '', male: '' }, (raw.settings || {}).deviceVoices || {});
        if (raw.progress) {
          d.progress.days = raw.progress.days || {};
          d.progress.scenarios = raw.progress.scenarios || {};
          Object.assign(d.progress.totals, raw.progress.totals || {});
        }
        if (Array.isArray(raw.phrases)) d.phrases = raw.phrases;
      }
      this.data = d;
    },
    save: function () { try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { /* storage unavailable */ } }
  };
  const settings = function () { return Store.data.settings; };

  const PATIENCE = { short: 1200, normal: 1900, long: 3200 };

  function applySettings() {
    const s = settings();
    const root = document.documentElement;
    if (s.theme === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', s.theme);
    const c = s.cloud || {};
    V.configure({
      accent: s.accent, rate: s.rate, fx: s.fx,
      cloud: { kind: c.kind, apiKey: c.apiKey, endpoint: c.endpoint, model: c.model, voices: expandVoices(c.voices) },
      deviceVoices: s.deviceVoices
    });
    let sttCloud = { kind: 'off' };
    if (c.kind === 'openai' && c.apiKey) sttCloud = { kind: 'openai', apiKey: c.apiKey };
    else if (c.kind === 'custom' && c.sttEndpoint) sttCloud = { kind: 'custom', endpoint: c.sttEndpoint, apiKey: c.apiKey };
    L.configure({ engine: s.stt, patienceMs: PATIENCE[s.patience] || 1900, lang: s.accent === 'gb' ? 'en-GB' : 'en-US', cloud: sttCloud });
    S.enabled = !!s.sounds;
  }
  function expandVoices(v) {
    v = v || {};
    const out = {};
    if (v.female) { out['us-female'] = v.female; out['gb-female'] = v.female; }
    if (v.male) { out['us-male'] = v.male; out['gb-male'] = v.male; }
    if (v.coach) { out['coach-us'] = v.coach; out['coach-gb'] = v.coach; }
    return out;
  }

  /* ------------------------------------------------------------------ *
   * Progress
   * ------------------------------------------------------------------ */
  const Progress = {
    day: function (k) {
      const days = Store.data.progress.days;
      k = k || dayKey();
      return days[k] || (days[k] = { sec: 0, spoken: 0, sentences: 0 });
    },
    addPractice: function (sec) {
      sec = clamp(Math.round(sec), 0, 1800);
      this.day().sec += sec;
      Store.data.progress.totals.sec += sec;
      Store.save();
    },
    addSentence: function (spokenSec) {
      const d = this.day();
      d.sentences += 1;
      d.spoken += spokenSec || 0;
      Store.data.progress.totals.sentences += 1;
      Store.save();
    },
    streak: function () {
      const days = Store.data.progress.days;
      let n = 0;
      const d = new Date();
      if (!(days[dayKey(d)] && days[dayKey(d)].sentences)) d.setDate(d.getDate() - 1);
      while (days[dayKey(d)] && days[dayKey(d)].sentences > 0) { n++; d.setDate(d.getDate() - 1); }
      return n;
    },
    todayMin: function () { return (this.day().sec || 0) / 60; },
    record: function (r) {
      const p = Store.data.progress;
      const rec = p.scenarios[r.id] || { best: 0, runs: 0 };
      rec.best = Math.max(rec.best || 0, r.score);
      rec.runs = (rec.runs || 0) + 1;
      rec.last = Date.now();
      p.scenarios[r.id] = rec;
      p.totals.convos += 1;
      p.totals.fixes += r.fixedOk;
      Store.save();
    }
  };

  const Phrases = {
    add: function (p) {
      const list = Store.data.phrases;
      const key = p.en.toLowerCase().replace(/[^a-z' ]/g, '').trim();
      if (!key || list.some(function (x) { return x.en.toLowerCase().replace(/[^a-z' ]/g, '').trim() === key; })) return false;
      list.unshift(Object.assign({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), at: Date.now() }, p));
      if (list.length > 300) list.length = 300;
      Store.save();
      return true;
    },
    remove: function (id) {
      Store.data.phrases = Store.data.phrases.filter(function (x) { return x.id !== id; });
      Store.save();
    }
  };

  const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
  function recommended() {
    const p = Store.data.progress.scenarios;
    const lvl = settings().level;
    const fresh = SCENARIOS.filter(function (s) { return !p[s.id]; });
    return fresh.find(function (s) { return s.level === lvl; }) ||
      fresh.find(function (s) { return LEVELS.indexOf(s.level) <= LEVELS.indexOf(lvl) + 1; }) ||
      fresh[0] ||
      SCENARIOS.slice().sort(function (a, b) { return (p[a.id].best || 0) - (p[b.id].best || 0); })[0];
  }
  function scenarioById(id) { return SCENARIOS.find(function (s) { return s.id === id; }); }
  function nextScenario(id) {
    const i = SCENARIOS.findIndex(function (s) { return s.id === id; });
    const p = Store.data.progress.scenarios;
    for (let k = 1; k <= SCENARIOS.length; k++) {
      const s = SCENARIOS[(i + k) % SCENARIOS.length];
      if (!p[s.id]) return s;
    }
    return SCENARIOS[(i + 1) % SCENARIOS.length];
  }

  /* ------------------------------------------------------------------ *
   * UI primitives: toast, modal, router
   * ------------------------------------------------------------------ */
  let toastT = 0;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }
  function modal(o) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = '<div class="modal" role="dialog" aria-modal="true"><h3>' + esc(o.title) + '</h3>' + (o.html || '') +
      '<div class="row-btns">' + o.actions.map(function (a, i) {
        return '<button class="btn ' + (a.kind || 'btn-soft') + '" data-i="' + i + '" style="min-height:44px">' + esc(a.label) + '</button>';
      }).join('') + '</div></div>';
    $('#app').appendChild(wrap);
    function close() { wrap.remove(); }
    wrap.addEventListener('click', function (e) {
      const b = e.target.closest('[data-i]');
      if (b) { close(); const a = o.actions[+b.dataset.i]; if (a.onClick) a.onClick(); }
      else if (e.target === wrap) close();
    });
    const first = $('[data-i]', wrap); if (first) first.focus();
  }

  const Router = {
    cur: null,
    go: function (name, arg) {
      if (this.cur === 'talk' && name !== 'talk' && activeTalk) { activeTalk.destroy(); activeTalk = null; }
      $$('.screen').forEach(function (s) { s.classList.toggle('active', s.id === 's-' + name); });
      this.cur = name;
      ({ onb: renderOnboarding, home: renderHome, brief: renderBrief, talk: startTalk, summary: renderSummary })[name](arg);
    }
  };

  /* ------------------------------------------------------------------ *
   * Orb — the speaking character, drawn on canvas
   * ------------------------------------------------------------------ */
  function Orb(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.lvl = 0;
    this.mix = 0;           // 0 = character colours, 1 = coach colours
    this.colors = null;
    this.frame = 0;
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const size = canvas.clientWidth || 74;
    canvas.width = size * dpr; canvas.height = size * dpr;
    this.size = size; this.dpr = dpr;
  }
  Orb.prototype.readColors = function () {
    const cs = getComputedStyle(document.documentElement);
    const g = function (n) { return cs.getPropertyValue(n).trim(); };
    this.colors = { a: g('--brand'), b: g('--brand-2'), c: g('--amber'), d: g('--amber-2'), soft: g('--surface-3') };
  };
  Orb.prototype.draw = function (state) {
    if (!this.colors || this.frame++ % 45 === 0) this.readColors();
    const ctx = this.ctx, s = this.size, dpr = this.dpr;
    const t = performance.now() / 1000;
    let target = 0.05 + 0.03 * Math.sin(t * 1.4);
    if (state.mode === 'speaking' || state.mode === 'coach') target = V.level();
    else if (state.mode === 'listening') target = 0.12 + L.level() * 0.45;
    else if (state.mode === 'thinking') target = 0.18;
    this.lvl += (target - this.lvl) * 0.22;
    this.mix += ((state.mode === 'coach' ? 1 : 0) - this.mix) * 0.12;
    const coach = this.mix > 0.5;
    const c1 = coach ? this.colors.c : this.colors.a, c2 = coach ? this.colors.d : this.colors.b;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, s, s);
    const cx = s / 2, cy = s / 2, r = s * 0.33;
    // glow
    const glow = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 1.5);
    glow.addColorStop(0, c1);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.16 + this.lvl * 0.32;
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    // blob
    const amp = 0.03 + this.lvl * 0.12;
    const spin = state.mode === 'thinking' ? t * 2.2 : 0;
    ctx.beginPath();
    const N = 72;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const k = 1 + amp * (0.55 * Math.sin(3 * a + t * 1.9 + spin) + 0.3 * Math.sin(5 * a - t * 2.6) + 0.15 * Math.sin(7 * a + t * 3.3));
      const x = cx + Math.cos(a) * r * k, y = cy + Math.sin(a) * r * k;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const fill = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    fill.addColorStop(0, c2);
    fill.addColorStop(1, c1);
    ctx.fillStyle = fill;
    ctx.fill();
    // sheen
    const sheen = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.45, 0, cx - r * 0.35, cy - r * 0.45, r * 1.1);
    sheen.addColorStop(0, 'rgba(255,255,255,0.55)');
    sheen.addColorStop(0.5, 'rgba(255,255,255,0.08)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fill();
  };

  /* ------------------------------------------------------------------ *
   * Conversation controller
   * ------------------------------------------------------------------ */
  let activeTalk = null;

  function Talk(sc) {
    this.sc = sc;
    this.persona = sc.persona;
    this.idx = 0;
    this.mode = 'idle';        // idle | speaking | coach | listening | thinking
    this.awaiting = null;      // null | 'answer' | 'repeat'
    this.hintLevel = 0;
    this.turnHinted = false;
    this.reprompted = false;
    this.repeat = null;
    this.typing = !L.supported();
    this.alive = true;
    this.t0 = Date.now();
    this.stats = { answers: 0, clean: 0, hints: 0, words: 0, speakMs: 0, fixes: [], fixedOk: 0 };
  }

  Talk.prototype.mount = function () {
    const sc = this.sc, p = this.persona, self = this;
    const el = $('#s-talk');
    el.style.setProperty('--tint', sc.tint);
    el.innerHTML =
      '<div class="talk-head">' +
        '<button class="icon-btn" data-act="exit" aria-label="Leave conversation">' + icon('x') + '</button>' +
        '<div class="th-mid"><div class="th-title">' + esc(sc.title) + '</div><div class="steps" aria-hidden="true"></div></div>' +
        '<button class="icon-btn ar-toggle" data-act="ar" aria-label="Arabic translation">ع</button>' +
      '</div>' +
      '<div class="stage">' +
        '<div class="orb-wrap"><canvas aria-hidden="true"></canvas></div>' +
        '<div class="who"><b>' + esc(p.name) + '</b><span>' + esc(p.role) + ' · <span class="ar">' + esc(p.roleAr) + '</span></span>' +
        '<div class="status" aria-live="polite"></div></div>' +
      '</div>' +
      '<div class="scroll"><div class="feed" aria-live="polite"><div class="place">' + esc(sc.place) + '</div></div></div>' +
      '<div class="dock"><div class="live"></div><div class="dock-ctl"></div></div>';
    this.el = el;
    this.feed = $('.feed', el);
    this.scroller = $('.scroll', el);
    this.live = $('.live', el);
    this.ctl = $('.dock-ctl', el);
    this.statusEl = $('.status', el);
    this.orb = new Orb($('canvas', el));
    this.updateArToggle();
    this.renderSteps();
    this.renderDock();

    el.onclick = function (e) {
      const b = e.target.closest('[data-act]');
      if (!b) {
        const veil = e.target.closest('.trans.veiled');
        if (veil) veil.classList.remove('veiled');
        return;
      }
      self.act(b.dataset.act, b);
    };
    const loop = function () {
      if (!self.alive) return;
      self.orb.draw({ mode: self.mode });
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

  Talk.prototype.destroy = function () {
    this.alive = false;
    cancelAnimationFrame(this.raf);
    document.removeEventListener('keydown', this.keyHandler);
    V.stop();
    L.cancel();
    const sec = (Date.now() - this.t0) / 1000;
    if (!this.finished && this.stats.answers) Progress.addPractice(sec);
  };

  Talk.prototype.scrollDown = function () {
    const sc = this.scroller;
    requestAnimationFrame(function () { sc.scrollTo({ top: sc.scrollHeight, behavior: 'smooth' }); });
  };

  Talk.prototype.renderSteps = function () {
    const n = this.sc.turns.length, i = this.idx;
    $('.steps', this.el).innerHTML = Array.from({ length: n }, function (_, k) {
      return '<i class="' + (k < i ? 'done' : k === i ? 'now' : '') + '"></i>';
    }).join('');
  };

  Talk.prototype.arClass = function () {
    const a = settings().arabic;
    return a === 'hide' ? 'hidden-ar' : a === 'tap' ? 'veiled' : '';
  };
  Talk.prototype.updateArToggle = function () {
    const b = $('[data-act="ar"]', this.el);
    const a = settings().arabic;
    b.classList.toggle('on', a !== 'hide');
    b.style.opacity = a === 'tap' ? '.75' : '';
    b.setAttribute('aria-label', 'Arabic translation: ' + ({ show: 'shown', tap: 'tap to reveal', hide: 'hidden' })[a]);
  };

  Talk.prototype.setMode = function (mode) {
    this.mode = mode;
    const st = this.statusEl, p = this.persona;
    const map = {
      speaking: ['', '<span class="dot-live"></span>Speaking'],
      coach: ['coach', '<span class="dot-live"></span>Coach'],
      listening: ['you', '<span class="dot-live"></span>Listening to you'],
      thinking: ['', 'Thinking…'],
      idle: ['you', this.awaiting ? 'Your turn' : '']
    };
    const m = map[mode] || map.idle;
    st.className = 'status ' + m[0];
    st.innerHTML = m[1];
    void p;
    this.renderDock();
  };

  Talk.prototype.renderDock = function () {
    const p = this.persona, mode = this.mode, rep = this.awaiting === 'repeat';
    let live = '', liveCls = '';
    if (mode === 'speaking') live = esc(p.name) + ' is speaking… <span class="ar muted">تحدّث بعد أن تنتهي</span>';
    else if (mode === 'coach') live = 'Listen to the correct sentence <span class="ar muted">استمع للجملة الصحيحة</span>';
    else if (mode === 'listening') { live = this.partial ? esc(this.partial) : 'Listening… speak now'; liveCls = this.partial ? 'speaking' : ''; }
    else if (mode === 'thinking') live = 'Checking what you said…';
    else if (rep) live = 'Now say the green sentence <span class="ar muted">قل الجملة الخضراء</span>';
    else if (this.awaiting === 'answer') live = this.typing ? 'Type your answer in English' : 'Tap the mic and answer <span class="ar muted">اضغط وأجب</span>';
    this.live.className = 'live ' + liveCls;
    this.live.innerHTML = live;

    if (this.typing) {
      if (!$('.typebar', this.ctl)) {
        this.ctl.innerHTML =
          '<form class="typebar" autocomplete="off">' +
            (L.supported() ? '<button type="button" class="icon-btn" data-act="voice" aria-label="Use microphone">' + icon('mic') + '</button>' : '') +
            '<input id="talk-input" type="text" enterkeyhint="send" placeholder="Type in English…" aria-label="Your answer">' +
            '<button type="button" class="icon-btn" data-act="help" aria-label="Help">' + icon('bulb') + '</button>' +
            '<button class="send" type="submit" aria-label="Send">' + icon('send', 'sm') + '</button>' +
          '</form>';
        const self = this;
        $('form', this.ctl).onsubmit = function (e) {
          e.preventDefault();
          const inp = $('#talk-input');
          const v = inp.value.trim();
          if (!v || !self.awaiting || self.mode !== 'idle') return;
          inp.value = '';
          self.onAnswer({ text: v, candidates: [v], durationMs: 0 }, 'typed');
        };
      }
      const busy = mode !== 'idle' || !this.awaiting;
      $('.send', this.ctl).disabled = busy;
      return;
    }

    let micCls = 'mic', micIcon = 'mic', micLabel = 'Speak';
    if (mode === 'listening') { micCls += ' listening'; micIcon = 'stop'; micLabel = 'Stop'; }
    else if (mode === 'speaking' || mode === 'coach') { micCls += ' busy'; micIcon = 'skip'; micLabel = 'Skip and answer'; }
    else if (mode === 'thinking' || !this.awaiting) { micCls += ' busy'; micIcon = 'wave'; micLabel = 'Please wait'; }
    else if (rep) micCls += ' repeat';
    let row = $('.dock-row', this.ctl);
    if (!row) {
      this.ctl.innerHTML =
        '<div class="dock-row">' +
          '<button class="side-btn" data-act="help"></button>' +
          '<button class="mic" data-act="mic"><span class="meter"></span><span class="mic-ic"></span></button>' +
          '<button class="side-btn" data-act="type">' + icon('keyboard') + 'Type</button>' +
        '</div>';
      row = $('.dock-row', this.ctl);
    }
    const help = row.children[0], mic = row.children[1], micIc = mic.children[1];
    const hk = rep ? 'listen' : 'help';
    if (help.dataset.k !== hk) { help.innerHTML = icon(rep ? 'volume' : 'bulb') + (rep ? 'Listen' : 'Help'); help.dataset.k = hk; }
    help.disabled = !this.awaiting || mode !== 'idle';
    help.classList.toggle('glow', this.awaiting === 'answer' && this.hintLevel === 0 && !!this.idleLong);
    if (mic.className !== micCls) mic.className = micCls;
    if (micIc.dataset.i !== micIcon) { micIc.innerHTML = icon(micIcon); micIc.dataset.i = micIcon; }
    mic.setAttribute('aria-label', micLabel);
  };

  Talk.prototype.act = function (a) {
    const self = this;
    if (a === 'exit') {
      if (!this.stats.answers) { Router.go('home'); return; }
      modal({
        title: 'Leave this conversation?',
        html: '<p class="muted">Your practice time is saved, but this conversation won’t get a score.</p>',
        actions: [{ label: 'Keep talking', kind: 'btn-soft' }, { label: 'Leave', kind: 'btn-primary', onClick: function () { Router.go('home'); } }]
      });
      return;
    }
    if (a === 'ar') {
      const order = ['show', 'tap', 'hide'];
      const s = settings();
      s.arabic = order[(order.indexOf(s.arabic) + 1) % 3];
      Store.save();
      const cls = this.arClass();
      $$('.trans', this.feed).forEach(function (t) {
        t.classList.remove('veiled', 'hidden-ar');
        if (cls) t.classList.add(cls);
      });
      this.updateArToggle();
      toast(({ show: 'Arabic translation: shown', tap: 'Arabic translation: tap to reveal', hide: 'Arabic translation: hidden' })[s.arabic]);
      return;
    }
    if (a === 'mic') {
      if (this.mode === 'listening') { L.stop(); return; }
      if (this.mode === 'speaking' || this.mode === 'coach') {
        this.skipSpeech = true;
        this.wantListen = true;
        V.stop();
        return;
      }
      if (this.mode === 'idle' && this.awaiting) this.listen();
      return;
    }
    if (a === 'type') { this.setTyping(true); return; }
    if (a === 'voice') { this.setTyping(false); return; }
    if (a === 'help') { this.help(); return; }
    if (a === 'replay' || a === 'slow') {
      const msg = arguments[1].closest('.msg, .tip-card, .coach-card');
      const text = msg && msg.dataset.say;
      if (!text || this.mode === 'listening') return;
      const role = msg.dataset.role || 'persona';
      this.speakInto(text, msg, role, a === 'slow' ? 0.72 : 1).then(function () { self.setMode('idle'); });
      return;
    }
    if (a === 'skip-fix') {
      if (this.awaiting !== 'repeat') return;
      L.cancel(); V.stop();
      const r = this.repeat;
      this.repeat = null;
      this.awaiting = null;
      r.card.querySelector('.cc-prompt').innerHTML = 'Skipped — saved to your phrases';
      this.advance(r.answer);
    }
  };

  Talk.prototype.setTyping = function (on) {
    this.typing = on;
    this.ctl.innerHTML = '';
    if (on && this.mode === 'listening') L.cancel();
    if (this.mode === 'listening') this.mode = 'idle';
    this.renderDock();
    if (on) { const i = $('#talk-input'); if (i) i.focus(); }
  };

  /* --- speaking ------------------------------------------------------ */
  Talk.prototype.speakInto = async function (text, container, role, rate, base) {
    this.setMode(role === 'coach' ? 'coach' : 'speaking');
    const zone = container ? (container.querySelector('[data-k]') || container) : null;
    await V.speak(text, {
      role: role === 'coach' ? 'coach' : 'persona',
      gender: this.persona.gender,
      rate: rate || 1,
      onWord: function (ci) { markWord(zone, (base || 0) + ci); }
    });
    clearMarks(zone);
  };

  /** Character says one or more lines (shown together in one bubble). */
  Talk.prototype.say = async function (lines, opts) {
    opts = opts || {};
    const en = lines.map(function (l) { return l.en; });
    const ar = lines.map(function (l) { return l.ar; }).join(' ');
    let html = '', off = 0;
    en.forEach(function (t, i) { html += (i ? ' ' : '') + wordSpans(t, off); off += t.length + 1; });
    const msg = document.createElement('div');
    msg.className = 'msg ai';
    msg.dataset.say = en.join(' ');
    msg.dataset.role = 'persona';
    msg.innerHTML =
      '<div class="bubble"><div class="en" data-k>' + html + '</div>' +
      '<div class="trans ar ' + this.arClass() + '">' + arHtml(ar) + '</div></div>' +
      '<div class="msg-tools">' +
        '<button class="icon-btn" data-act="replay" aria-label="Play again">' + icon('volume', 'sm') + '</button>' +
        '<button class="icon-btn rate" data-act="slow" aria-label="Play slowly">0.7×</button>' +
      '</div>';
    this.feed.appendChild(msg);
    this.scrollDown();
    this.skipSpeech = false;
    off = 0;
    for (let i = 0; i < en.length; i++) {
      if (!this.alive || this.skipSpeech) return;
      await this.speakInto(en[i], msg, 'persona', opts.rate, off);
      off += en[i].length + 1;
      if (i < en.length - 1) await sleep(180);
    }
  };

  Talk.prototype.addMe = function (text, verdict) {
    const msg = document.createElement('div');
    msg.className = 'msg me';
    msg.innerHTML = '<div class="bubble"><div class="en">' + esc(text) + '</div></div>' +
      (verdict === 'ok' ? '<div class="verdict ok">' + icon('check', 'xs') + 'Clear and correct</div>' :
        verdict === 'fix' ? '<div class="verdict fix">' + icon('sparkle', 'xs') + 'Let’s polish this</div>' : '');
    this.feed.appendChild(msg);
    this.scrollDown();
    return msg;
  };

  Talk.prototype.addTip = function (kind, label, en, ar, opts) {
    opts = opts || {};
    const card = document.createElement('div');
    card.className = 'tip-card ' + (kind || '');
    card.dataset.say = en || '';
    card.dataset.role = 'coach';
    card.innerHTML =
      '<div class="tc-body"><div class="tc-label">' + esc(label) + '</div>' +
      (opts.html || '') +
      (en ? '<div class="tc-en" data-k>' + wordSpans(en) + '</div>' : '') +
      (ar ? '<div class="tc-ar ar">' + arHtml(ar) + '</div>' : '') + '</div>' +
      (en ? '<button class="icon-btn" data-act="replay" aria-label="Listen">' + icon('volume', 'sm') + '</button>' : '');
    this.feed.appendChild(card);
    this.scrollDown();
    return card;
  };

  /* --- flow ---------------------------------------------------------- */
  Talk.prototype.begin = async function () {
    await sleep(450);
    if (!this.alive) return;
    await this.say([this.sc.turns[0].ai]);
    this.prefetchAhead();
    this.await('answer');
  };

  Talk.prototype.prefetchAhead = function () {
    const t = this.sc.turns[this.idx], n = this.sc.turns[this.idx + 1];
    if (t && t.model) V.prefetch(t.model.en, { role: 'coach' });
    if (n) V.prefetch(n.ai.en, { role: 'persona', gender: this.persona.gender });
  };

  Talk.prototype.await = function (what) {
    if (!this.alive) return;
    this.awaiting = what;
    this.partial = '';
    this.setMode('idle');
    const self = this;
    clearTimeout(this.idleT);
    this.idleLong = false;
    if (what === 'answer') {
      this.idleT = setTimeout(function () {
        if (self.awaiting === 'answer' && self.mode === 'idle' && self.hintLevel === 0) { self.idleLong = true; self.renderDock(); }
      }, 9000);
    }
    if (this.wantListen && !this.typing && L.supported()) {
      this.wantListen = false;
      setTimeout(function () { if (self.alive && self.mode === 'idle' && self.awaiting === what) self.listen(); }, 120);
    } else if (settings().autoListen && !this.typing && L.supported()) {
      setTimeout(function () { if (self.alive && self.mode === 'idle' && self.awaiting === what) self.listen(); }, 250);
    }
  };

  Talk.prototype.listen = function () {
    const self = this;
    V.stop();
    this.partial = '';
    this.setMode('listening');
    S.listenOn();
    const expected = this.awaiting === 'repeat' && this.repeat ? [this.repeat.target] : [];
    L.start({
      expected: expected,
      onPartial: function (t) { if (!self.alive) return; self.partial = t; self.renderDock(); },
      onFinal: function (res) {
        if (!self.alive) return;
        S.listenOff();
        self.setMode('thinking');
        setTimeout(function () { self.onAnswer(res, 'voice'); }, 120);
      },
      onError: function (code) { if (self.alive) self.onListenError(code); }
    });
  };

  Talk.prototype.onListenError = function (code) {
    S.listenOff();
    this.setMode('idle');
    if (code === 'not-allowed' || code === 'service-not-allowed') {
      const self = this;
      modal({
        title: 'Microphone is blocked',
        html: '<p class="muted">Allow microphone access for this page in your browser’s site settings, then tap the mic again. You can also type your answers.</p>' +
          '<p class="ar muted">اسمح للمتصفح باستخدام الميكروفون من إعدادات الموقع، أو اكتب إجاباتك.</p>',
        actions: [{ label: 'Type instead', kind: 'btn-soft', onClick: function () { self.setTyping(true); } }, { label: 'OK', kind: 'btn-primary' }]
      });
    } else if (code === 'network') {
      toast('Speech recognition needs an internet connection. Try again or type.');
    } else if (code === 'audio-capture') {
      toast('No microphone found. Connect one or type your answer.');
    } else if (code === 'unsupported' || code === 'start-failed') {
      this.setTyping(true);
      toast('Voice input isn’t available in this browser. Type your answers, or open in Chrome or Safari.');
    } else if (code === 'language-not-supported') {
      toast('English speech recognition isn’t available on this device.');
    }
  };

  Talk.prototype.onAnswer = async function (res, source) {
    if (!this.alive) return;
    const text = String(res.text || '').trim();
    if (!text) {
      this.setMode('idle');
      S.nudge();
      toast(res.reason === 'no-speech' ? 'I didn’t hear anything. Tap the mic and speak.' : 'I didn’t catch that. Try again.');
      return;
    }
    if (this.mode !== 'thinking') this.setMode('thinking');
    if (this.awaiting === 'repeat') return this.onRepeat(res);
    const t = this.sc.turns[this.idx];
    const pretty = C.prettify(text);
    const near = function (line) { return line && C.judge([text], line.en, []).score >= 0.86; };

    if (C.isRepeatRequest(text)) {
      this.addMe(pretty);
      this.awaiting = null;
      await this.say([t.ai], { rate: 0.82 });
      return this.await('answer');
    }
    if (C.isStuck(text)) {
      this.addMe(pretty);
      this.mode = 'idle';
      return this.help();
    }

    const a = C.analyze(text, { tense: t.tense, register: this.sc.register });
    const relevant = C.relevant(text, t);
    const words = C.canonTokens(text).length;

    if (!relevant && !this.reprompted) {
      this.addMe(a.said);
      this.reprompted = true;
      this.awaiting = null;
      await this.say([t.reprompt || COMMON.persona.reprompt]);
      return this.await('answer');
    }

    this.awaiting = null;
    this.stats.answers++;
    this.stats.words += words;
    const spokenSec = source === 'voice' ? (res.durationMs ? res.durationMs / 1000 : words * 0.45) : 0;
    this.stats.speakMs += spokenSec * 1000;
    Progress.addSentence(spokenSec);

    if (!a.ok) {
      this.addMe(a.said, 'fix');
      return this.correct(a, text);
    }

    this.addMe(a.said, 'ok');
    if (!this.turnHinted) this.stats.clean++;
    if (a.better) {
      this.addTip('', 'More natural · أكثر طبيعية', a.better.text, a.better.ar);
      Phrases.add({ en: a.better.text, ar: '', note: a.better.ar, scenario: this.sc.id, kind: 'style' });
    } else if (!relevant && t.model) {
      this.addTip('', 'You could say · يمكنك أن تقول', t.model.en, t.model.ar);
    } else if (words <= 2 && t.model && !near(t.model)) {
      this.addTip('', 'You can also say · يمكنك أيضاً أن تقول', t.model.en, t.model.ar);
    } else if (t.also && this.idx % 2 === 1 && !near(t.also) && !near(t.model)) {
      this.addTip('', 'Another way to say it · طريقة أخرى', t.also.en, t.also.ar);
    }
    await sleep(550);
    this.advance(text);
  };

  Talk.prototype.correct = async function (a, raw) {
    const ops = C.diffWords(a.said, a.corrected);
    const wrong = ops.filter(function (o) { return o.type !== 'ins'; }).map(function (o) {
      return o.type === 'del' ? '<del class="d">' + esc(o.text) + '</del>' : esc(o.from);
    }).join(' ');
    let off = 0;
    const right = ops.filter(function (o) { return o.type !== 'del'; }).map(function (o) {
      const w = '<span class="w" data-s="' + off + '">' + esc(o.text) + '</span>';
      off += o.text.length + 1;
      return o.type === 'ins' ? '<ins class="i">' + w + '</ins>' : w;
    }).join(' ');
    const why = a.issues.slice(0, 2).map(function (r) {
      return '<div class="ar">' + arHtml(r.ar) + '</div><div class="en">' + esc(r.en) + '</div>';
    }).join('');

    const card = document.createElement('div');
    card.className = 'coach-card';
    card.dataset.say = a.corrected;
    card.dataset.role = 'coach';
    card.innerHTML =
      '<div class="cc-head"><span class="cc-badge">' + icon('sparkle') + '</span>' +
        '<span class="cc-title">Coach<span class="ar">المدرّب</span></span></div>' +
      '<div class="line wrong"><span class="mark">' + icon('x') + '</span><span class="txt">' + wrong + '</span></div>' +
      '<div class="line right"><span class="mark">' + icon('check') + '</span><span class="txt" data-k>' + right + '</span></div>' +
      '<div class="why">' + why + '</div>' +
      '<div class="heard" hidden></div>' +
      '<div class="cc-actions">' +
        '<span class="cc-prompt">' + icon('mic', 'xs') + 'Your turn: say it correctly</span>' +
        '<button class="btn btn-soft" data-act="replay">' + icon('volume', 'sm') + 'Listen</button>' +
        '<button class="btn btn-ghost" data-act="skip-fix">Skip</button>' +
      '</div>';
    this.feed.appendChild(card);
    this.scrollDown();

    this.stats.fixes.push({ from: a.said, to: a.corrected, ar: a.issues[0].ar, ok: false });
    Phrases.add({ en: a.corrected, ar: '', note: a.issues[0].ar, scenario: this.sc.id, kind: 'fix' });
    this.repeat = {
      target: a.corrected, focus: C.focusTokens(a.said, a.corrected),
      card: card, attempts: 0, answer: raw, fix: this.stats.fixes[this.stats.fixes.length - 1]
    };
    S.nudge();
    await sleep(250);
    await this.speakInto(a.corrected, card, 'coach', 0.95);
    this.await('repeat');
  };

  Talk.prototype.onRepeat = async function (res) {
    const r = this.repeat;
    if (!r) return;
    const cands = res.candidates && res.candidates.length ? res.candidates : [res.text];
    const j = C.judge(cands, r.target, r.focus);
    const heard = $('.heard', r.card);
    heard.hidden = false;
    heard.innerHTML = 'You said: <b>' + esc(C.prettify(j.heard || res.text)) + '</b>';
    if (j.pass) {
      r.card.classList.add('done');
      $('.cc-badge', r.card).innerHTML = icon('check');
      $('.cc-actions', r.card).innerHTML = '<span class="cc-prompt">' + icon('check', 'xs') + 'Perfect — that’s exactly right!</span>';
      r.fix.ok = true;
      this.stats.fixedOk++;
      this.repeat = null;
      this.awaiting = null;
      S.success();
      this.setMode('idle');
      await sleep(700);
      return this.advance(r.answer);
    }
    r.attempts++;
    const miss = j.missing.slice(0, 3).join(', ');
    if (miss) heard.innerHTML += ' · <span class="muted">listen for: </span><b>' + esc(miss) + '</b>';
    S.nudge();
    if (r.attempts < 2) {
      this.awaiting = 'repeat';
      const line = COMMON.coach.tryAgain;
      const tip = this.addTip('hint', 'Coach', line.en, line.ar);
      tip.dataset.say = line.en;
      this.skipSpeech = false;
      await this.speakInto(line.en, tip, 'coach');
      if (!this.skipSpeech) await this.speakInto(r.target, r.card, 'coach', 0.88);
      return this.await('repeat');
    }
    $('.cc-prompt', r.card).innerHTML = 'Saved to your phrases — practice it later';
    this.repeat = null;
    this.awaiting = null;
    const line = COMMON.coach.moveOn;
    const tip = this.addTip('hint', 'Coach', line.en, line.ar);
    await this.speakInto(line.en, tip, 'coach');
    this.advance(r.answer);
  };

  Talk.prototype.help = async function () {
    if (!this.awaiting || this.mode === 'listening') return;
    if (this.awaiting === 'repeat' && this.repeat) {
      await this.speakInto(this.repeat.target, this.repeat.card, 'coach', 0.85);
      return this.await('repeat');
    }
    const t = this.sc.turns[this.idx];
    if (!t) return;
    if (!this.turnHinted) { this.turnHinted = true; this.stats.hints++; }
    this.idleLong = false;
    if (this.hintLevel === 0) {
      this.hintLevel = 1;
      this.addTip('hint', 'Hint · تلميح', '', t.hint.ar, {
        html: t.hint.starter ? '<div class="starter">' + esc(t.hint.starter) + '</div>' : ''
      });
      this.await('answer');
      return;
    }
    this.hintLevel = 2;
    const card = this.addTip('', 'Try saying · جرّب أن تقول', t.model.en, t.model.ar);
    Phrases.add({ en: t.model.en, ar: t.model.ar, scenario: this.sc.id, kind: 'model' });
    this.awaiting = null;
    await this.speakInto(t.model.en, card, 'coach', 0.92);
    this.await('answer');
  };

  Talk.prototype.advance = async function (answer) {
    if (!this.alive) return;
    const t = this.sc.turns[this.idx];
    let ack = null;
    if (t && t.ack) { const p = C.polarity(answer || ''); if (p && t.ack[p]) ack = t.ack[p]; }
    this.idx++;
    this.hintLevel = 0;
    this.turnHinted = false;
    this.reprompted = false;
    this.awaiting = null;
    this.renderSteps();
    this.setMode('idle');
    await sleep(250);
    if (this.idx >= this.sc.turns.length) {
      await this.say(ack ? [ack, this.sc.outro] : [this.sc.outro]);
      return this.finish();
    }
    const nt = this.sc.turns[this.idx];
    await this.say(ack ? [ack, nt.ai] : [nt.ai]);
    this.prefetchAhead();
    this.await('answer');
  };

  Talk.prototype.finish = async function () {
    if (!this.alive) return;
    this.finished = true;
    const st = this.stats, n = Math.max(1, st.answers), turns = this.sc.turns.length;
    const accuracy = st.answers ? (st.answers - st.fixes.length) / n : 0;
    const confidence = Math.max(0, (turns - st.hints) / turns);
    const target = { Beginner: 4, Intermediate: 6, Advanced: 9 }[this.sc.level] || 5;
    const fluency = Math.min(1, (st.words / n) / target);
    const repaired = st.fixes.length ? st.fixedOk / st.fixes.length : 1;
    const score = Math.round(100 * (0.4 * accuracy + 0.25 * confidence + 0.2 * fluency + 0.15 * repaired));
    const result = {
      id: this.sc.id, score: score, accuracy: accuracy, confidence: confidence, fluency: fluency,
      words: st.words, answers: st.answers, speakSec: Math.round(st.speakMs / 1000),
      fixes: st.fixes, fixedOk: st.fixedOk, sec: (Date.now() - this.t0) / 1000
    };
    Progress.addPractice(result.sec);
    Progress.record(result);
    S.complete();
    await sleep(500);
    if (this.alive) Router.go('summary', result);
  };

  function startTalk(id) {
    const sc = scenarioById(id);
    if (activeTalk) activeTalk.destroy();
    activeTalk = new Talk(sc);
    activeTalk.mount();
    activeTalk.begin();
  }

  /* ------------------------------------------------------------------ *
   * Screens
   * ------------------------------------------------------------------ */
  function ringSvg(frac, size) {
    const r = 15.5, c = 2 * Math.PI * r;
    return '<svg viewBox="0 0 36 36" aria-hidden="true"><circle class="track" cx="18" cy="18" r="' + r + '" fill="none" stroke-width="' + (size || 3.2) + '"/>' +
      '<circle class="val" cx="18" cy="18" r="' + r + '" fill="none" stroke-width="' + (size || 3.2) + '" stroke-linecap="round" stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + (c * (1 - clamp(frac, 0, 1))).toFixed(2) + '"/></svg>';
  }
  function brandMark() { return '<span class="brand-mark">' + icon('wave') + '</span>'; }

  /* --- Onboarding --- */
  let onbStep = 0;
  function renderOnboarding() {
    const el = $('#s-onb');
    const s = settings();
    if (onbStep === 0) {
      el.innerHTML =
        '<div class="topbar"><div class="brand">' + brandMark() + '<span class="brand-name">Lisan<span class="ar">لسان</span></span></div></div>' +
        '<div class="scroll"><div class="onb-body">' +
          '<h1 class="display">You understand English. Now let’s get you <em>speaking</em> it.</h1>' +
          '<p class="lede">Practice real conversations out loud — at the airport, the café, at work. Get corrected the moment you slip, and say it again until it feels natural.</p>' +
          '<p class="lede-ar ar">تفهم الإنجليزية لكن تتوقف عندما تتحدث؟ تدرّب على محادثات حقيقية بصوتك، واحصل على تصحيح فوري مع شرح بالعربية.</p>' +
          '<div class="demo" aria-label="Example correction">' +
            '<div class="msg ai"><div class="bubble"><div class="en">Do you have a reservation?</div><div class="trans ar">هل لديك حجز؟</div></div></div>' +
            '<div class="msg me"><div class="bubble"><div class="en">No, I not have a reservation.</div></div></div>' +
            '<div class="line wrong"><span class="mark">' + icon('x') + '</span><span class="txt">No, I <del class="d">not</del> have a reservation.</span></div>' +
            '<div class="line right"><span class="mark">' + icon('check') + '</span><span class="txt">No, I <ins class="i">don’t</ins> have a reservation.</span></div>' +
          '</div>' +
          '<div class="steps-list">' +
            '<div class="step"><span class="n">' + icon('headphones') + '</span><div><b>Talk through real situations</b><span>Ten scenes with characters who answer you back.</span></div></div>' +
            '<div class="step"><span class="n">' + icon('sparkle') + '</span><div><b>Instant corrections, explained in Arabic</b><span>Tuned to the mistakes Arabic speakers make most.</span></div></div>' +
            '<div class="step"><span class="n">' + icon('redo') + '</span><div><b>Say it right, out loud</b><span>Repeat the fix until it sticks. Your phrases are saved.</span></div></div>' +
          '</div>' +
        '</div></div>' +
        '<div class="foot"><button class="btn btn-primary btn-block" data-go="1">Get started ·<span class="ar inl">ابدأ</span></button></div>';
    } else {
      const lv = [
        ['Beginner', 'I know the basics but freeze when I speak', 'أعرف الأساسيات لكن أتوقف عند الكلام'],
        ['Intermediate', 'I can talk, but make mistakes and search for words', 'أتحدث لكن أخطئ وأبحث عن الكلمات'],
        ['Advanced', 'I want to sound natural and confident', 'أريد أن أبدو طبيعياً وواثقاً']
      ];
      el.innerHTML =
        '<div class="topbar"><button class="icon-btn" data-go="0" aria-label="Back">' + icon('back') + '</button><div class="grow"></div><div class="dots"><i></i><i class="on"></i></div><div class="grow"></div><span style="width:44px"></span></div>' +
        '<div class="scroll"><div class="onb-body" style="padding-top:6px">' +
          '<div><h1 class="display" style="font-size:30px">How’s your spoken English?</h1><p class="muted" style="margin-top:6px">This sets the speaking speed and how much Arabic help you see. You can change it any time.</p></div>' +
          '<div class="choice-grid" role="radiogroup">' + lv.map(function (l) {
            return '<button class="choice' + (s.level === l[0] ? ' sel' : '') + '" role="radio" aria-checked="' + (s.level === l[0]) + '" data-level="' + l[0] + '">' +
              '<div class="c-body"><b>' + l[0] + '</b><span>' + l[1] + '</span><span class="ar" style="display:block">' + l[2] + '</span></div><span class="radio">' + icon('check') + '</span></button>';
          }).join('') + '</div>' +
          '<div class="set"><div class="set-row"><div class="s-body"><b>Accent</b><span>The voice you’ll practice with</span></div>' +
            '<div class="seg" data-seg="accent"><button data-v="us" class="' + (s.accent === 'us' ? 'on' : '') + '">American</button><button data-v="gb" class="' + (s.accent === 'gb' ? 'on' : '') + '">British</button></div></div></div>' +
        '</div></div>' +
        '<div class="foot"><button class="btn btn-primary btn-block" data-start>Start my first conversation</button></div>';
    }
    el.onclick = function (e) {
      const go = e.target.closest('[data-go]');
      if (go) { onbStep = +go.dataset.go; renderOnboarding(); return; }
      const lvl = e.target.closest('[data-level]');
      if (lvl) {
        const L2 = lvl.dataset.level;
        s.level = L2;
        s.rate = { Beginner: 0.9, Intermediate: 1, Advanced: 1.05 }[L2];
        s.arabic = { Beginner: 'show', Intermediate: 'tap', Advanced: 'hide' }[L2];
        s.patience = L2 === 'Beginner' ? 'long' : 'normal';
        Store.save(); applySettings(); renderOnboarding();
        return;
      }
      const seg = e.target.closest('[data-seg] button');
      if (seg) { s.accent = seg.dataset.v; Store.save(); applySettings(); renderOnboarding(); return; }
      if (e.target.closest('[data-start]')) {
        s.onboarded = true; Store.save();
        Router.go('brief', recommended().id);
      }
    };
  }

  /* --- Home --- */
  let homeTab = 'practice';
  function greeting() {
    const h = new Date().getHours();
    return h < 5 ? ['Good evening', 'مساء الخير'] : h < 12 ? ['Good morning', 'صباح الخير'] : h < 17 ? ['Good afternoon', 'مساء الخير'] : ['Good evening', 'مساء الخير'];
  }
  function renderHome(tab) {
    if (tab) homeTab = tab;
    const el = $('#s-home');
    const streak = Progress.streak();
    let body = '';
    if (homeTab === 'practice') body = homePractice();
    else if (homeTab === 'phrases') body = homePhrases();
    else body = homeProgress();
    el.innerHTML =
      '<div class="topbar"><div class="brand grow">' + brandMark() + '<span class="brand-name">Lisan<span class="ar">لسان</span></span></div>' +
        '<span class="pill streak" title="Day streak">' + icon('flame') + streak + '</span>' +
        '<button class="icon-btn" data-act="settings" aria-label="Settings">' + icon('sliders') + '</button></div>' +
      '<div class="scroll"><div class="home-body">' + body + '</div></div>' +
      '<nav class="tabbar">' +
        [['practice', 'home', 'Practice'], ['phrases', 'book', 'Phrases'], ['progress', 'chart', 'Progress']].map(function (t) {
          return '<button class="tab' + (homeTab === t[0] ? ' active' : '') + '" data-tab="' + t[0] + '"' + (homeTab === t[0] ? ' aria-current="page"' : '') + '>' + icon(t[1]) + t[2] + '</button>';
        }).join('') +
      '</nav>';
    el.onclick = onHomeClick;
  }

  function scenarioRow(s) {
    const rec = Store.data.progress.scenarios[s.id];
    return '<button class="row" data-sc="' + s.id + '" style="--tint:' + s.tint + '">' +
      '<span class="tile">' + icon(s.icon) + '</span>' +
      '<span class="r-body"><span class="r-title">' + esc(s.title) + '</span>' +
      '<span class="r-sub"><span class="ar">' + esc(s.titleAr) + '</span> · ' + esc(s.level) + ' · ' + s.minutes + ' min</span></span>' +
      '<span class="r-end">' + (rec ? '<span class="score-badge">' + rec.best + '</span>' : '') + icon('chev', 'sm') + '</span></button>';
  }

  function homePractice() {
    const g = greeting();
    const rec = recommended();
    const s = settings();
    const mins = Progress.todayMin();
    const goal = s.goalMin;
    const left = Math.max(0, Math.ceil(goal - mins));
    let html =
      '<div class="greet"><h1 class="display">' + g[0] + '</h1><p>Ready to say it out loud?<span class="ar inl">' + g[1] + '</span></p></div>' +
      '<div class="today" style="--tint:' + rec.tint + '">' +
        '<div class="t-label"><span class="eyebrow">Today’s conversation</span><span class="chip">' + esc(rec.level) + '</span></div>' +
        '<div class="t-main"><div class="t-title">' + esc(rec.title) + '</div>' +
          '<div class="t-meta">with ' + esc(rec.persona.name) + ', ' + esc(rec.persona.role.toLowerCase()) + ' · ' + rec.minutes + ' min</div>' +
          '<div class="t-meta">' + (left ? left + ' min left to reach today’s goal' : 'Daily goal reached. Nice work!') + '</div></div>' +
        '<div class="ring" aria-label="' + Math.floor(mins) + ' of ' + goal + ' minutes today">' + ringSvg(mins / goal) +
          '<div class="ring-txt"><div><b>' + Math.floor(mins) + '</b><span>of ' + goal + ' min</span></div></div></div>' +
        '<button class="btn btn-primary" data-sc="' + rec.id + '">' + icon('mic', 'sm') + 'Start speaking</button>' +
      '</div>';
    CATEGORIES.forEach(function (c) {
      const list = SCENARIOS.filter(function (x) { return x.category === c.id; });
      html += '<section class="section"><div class="section-head"><h2>' + esc(c.en) + '</h2><span class="ar">' + esc(c.ar) + '</span></div>' +
        '<div class="group">' + list.map(scenarioRow).join('') + '</div></section>';
    });
    return html;
  }

  function homePhrases() {
    const list = Store.data.phrases;
    if (!list.length) {
      return '<div class="greet"><h1 class="display">My phrases</h1><p>Every sentence you fix is saved here to practice.</p></div>' +
        '<div class="group"><div class="empty">' + icon('book') + '<h3>No phrases yet</h3><p>Finish a conversation. Corrections and new phrases will appear here.</p>' +
        '<p class="ar">ستظهر هنا الجمل التي صحّحتها لتتدرّب عليها.</p></div></div>';
    }
    return '<div class="greet"><h1 class="display">My phrases</h1><p>' + list.length + ' saved · tap the mic to practice saying one.</p></div>' +
      '<div class="group">' + list.map(function (p) {
        const sc = scenarioById(p.scenario);
        const kind = { fix: 'Corrected', model: 'Model answer', style: 'More natural', key: 'Key phrase' }[p.kind] || '';
        return '<div class="phrase" data-id="' + p.id + '">' +
          '<div class="p-body"><span class="p-en">' + esc(p.en) + '</span>' +
          (p.ar ? '<span class="p-ar ar">' + arHtml(p.ar) + '</span>' : p.note ? '<span class="p-ar ar">' + arHtml(p.note) + '</span>' : '') +
          '<span class="p-src">' + esc(kind) + (sc ? ' · ' + esc(sc.title) : '') + '</span>' +
          '<span class="p-result" hidden></span></div>' +
          '<div class="p-actions">' +
            '<button class="icon-btn" data-pact="play" aria-label="Listen">' + icon('volume', 'sm') + '</button>' +
            '<button class="icon-btn" data-pact="say" aria-label="Practice saying it">' + icon('mic', 'sm') + '</button>' +
            '<button class="icon-btn" data-pact="del" aria-label="Remove">' + icon('trash', 'sm') + '</button>' +
          '</div></div>';
      }).join('') + '</div>';
  }

  function homeProgress() {
    const p = Store.data.progress, t = p.totals, s = settings();
    const days = [];
    const d = new Date();
    d.setDate(d.getDate() - 6);
    for (let i = 0; i < 7; i++) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }
    const mins = days.map(function (x) { return ((p.days[dayKey(x)] || {}).sec || 0) / 60; });
    const top = Math.max(s.goalMin * 1.5, Math.max.apply(null, mins), 1);
    const names = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const weekTotal = mins.reduce(function (a, b) { return a + b; }, 0);
    const done = SCENARIOS.filter(function (x) { return p.scenarios[x.id]; });
    return '<div class="greet"><h1 class="display">Your progress</h1><p>' + Progress.streak() + '-day streak · keep it going<span class="ar inl">استمر</span></p></div>' +
      '<div class="stats">' +
        '<div class="stat"><b>' + Math.round(t.sec / 60) + '</b><span>minutes practiced</span></div>' +
        '<div class="stat"><b>' + t.sentences + '</b><span>sentences spoken</span></div>' +
        '<div class="stat"><b>' + t.fixes + '</b><span>mistakes fixed out loud</span></div>' +
        '<div class="stat"><b>' + t.convos + '</b><span>conversations</span></div>' +
      '</div>' +
      '<div class="week"><div class="week-head"><b>This week</b><span class="muted small">' + Math.round(weekTotal) + ' min</span></div>' +
        '<div class="bars" style="--goal-y:' + (100 - (s.goalMin / top) * 100).toFixed(1) + '%">' + days.map(function (x, i) {
          const h = (mins[i] / top) * 100;
          return '<div class="bar' + (mins[i] >= s.goalMin ? ' met' : '') + (i === 6 ? ' is-today' : '') + '"><i style="height:' + Math.max(3, h).toFixed(1) + '%"></i><small>' + names[x.getDay()] + '</small></div>';
        }).join('') + '</div>' +
        '<div class="week-foot"><span>Dashed line: ' + s.goalMin + '-minute daily goal</span><span>' + mins.filter(function (m) { return m >= s.goalMin; }).length + '/7 days</span></div></div>' +
      '<section class="section"><div class="section-head"><h2>Conversations</h2><span class="muted small">' + done.length + ' of ' + SCENARIOS.length + '</span></div>' +
        '<div class="group">' + (done.length ? done.map(scenarioRow).join('') :
          '<div class="empty">' + icon('trophy') + '<h3>Your scores will show here</h3><p>Finish your first conversation to see how you did.</p></div>') + '</div></section>';
  }

  let phrasePractice = null;
  function onHomeClick(e) {
    const tab = e.target.closest('[data-tab]');
    if (tab) { L.cancel(); renderHome(tab.dataset.tab); $('#s-home .scroll').scrollTop = 0; return; }
    const sc = e.target.closest('[data-sc]');
    if (sc) { Router.go('brief', sc.dataset.sc); return; }
    if (e.target.closest('[data-act="settings"]')) { openSettings(); return; }
    const pa = e.target.closest('[data-pact]');
    if (pa) {
      const row = pa.closest('.phrase');
      const ph = Store.data.phrases.find(function (x) { return x.id === row.dataset.id; });
      if (!ph) return;
      const act = pa.dataset.pact;
      if (act === 'play') V.speak(ph.en, { role: 'coach' });
      else if (act === 'del') { Phrases.remove(ph.id); renderHome(); toast('Phrase removed'); }
      else if (act === 'say') practicePhrase(ph, row, pa);
    }
  }

  function practicePhrase(ph, row, btn) {
    const out = $('.p-result', row);
    if (phrasePractice === ph.id) { L.stop(); return; }
    if (!L.supported()) { toast('Voice input isn’t available in this browser.'); return; }
    V.stop();
    phrasePractice = ph.id;
    btn.classList.add('on');
    btn.innerHTML = icon('stop', 'sm');
    out.hidden = false; out.className = 'p-result'; out.textContent = 'Listening… say the sentence';
    S.listenOn();
    function reset() { phrasePractice = null; btn.classList.remove('on'); btn.innerHTML = icon('mic', 'sm'); }
    L.start({
      expected: [ph.en],
      onPartial: function (t) { out.textContent = t; },
      onFinal: function (res) {
        reset(); S.listenOff();
        if (!res.text) { out.textContent = 'I didn’t hear anything. Try again.'; return; }
        const j = C.judge(res.candidates.length ? res.candidates : [res.text], ph.en, []);
        if (j.pass) { out.className = 'p-result ok'; out.textContent = '✓ Great — ' + Math.round(j.score * 100) + '% match'; S.success(); }
        else { out.className = 'p-result bad'; out.textContent = 'Close. Listen for: ' + j.missing.slice(0, 4).join(', '); S.nudge(); }
      },
      onError: function () { reset(); out.textContent = 'Microphone unavailable. Check browser permissions.'; }
    });
  }

  /* --- Brief --- */
  function renderBrief(id) {
    const sc = scenarioById(id);
    const el = $('#s-brief');
    const p = sc.persona;
    const phrases = sc.turns.map(function (t) { return t.model; }).filter(Boolean).slice(0, 5);
    el.style.setProperty('--tint', sc.tint);
    el.innerHTML =
      '<div class="topbar"><button class="icon-btn" data-act="back" aria-label="Back">' + icon('back') + '</button><div class="grow"></div>' +
        '<span class="chip">' + esc(sc.level) + ' · ' + sc.minutes + ' min</span></div>' +
      '<div class="scroll"><div class="brief-body">' +
        '<div class="brief-hero"><span class="tile">' + icon(sc.icon) + '</span>' +
          '<div><h1 class="display">' + esc(sc.title) + '</h1><div class="ar ar-title">' + esc(sc.titleAr) + '</div></div>' +
          '<div class="persona-line"><span class="avatar">' + esc(p.name.charAt(0)) + '</span><div><b>' + esc(p.name) + '</b><div class="muted small">' + esc(p.role) + ' · <span class="ar">' + esc(p.roleAr) + '</span></div></div></div>' +
        '</div>' +
        '<div class="mission"><span class="eyebrow">Your mission</span><p>' + esc(sc.mission.en) + '</p><p class="ar">' + esc(sc.mission.ar) + '</p></div>' +
        '<section class="section"><div class="section-head"><h2>Phrases you’ll use</h2><span class="ar">عبارات ستحتاجها</span></div>' +
          '<div class="group">' + phrases.map(function (ph, i) {
            return '<div class="phrase"><div class="p-body"><span class="p-en">' + esc(ph.en) + '</span><span class="p-ar ar">' + esc(ph.ar) + '</span></div>' +
              '<div class="p-actions"><button class="icon-btn" data-say="' + i + '" aria-label="Listen">' + icon('volume', 'sm') + '</button>' +
              '<button class="icon-btn" data-save="' + i + '" aria-label="Save phrase">' + icon('star', 'sm') + '</button></div></div>';
          }).join('') + '</div></section>' +
        '<div class="tip-card"><div class="tc-body"><div class="tc-label">How it works</div>' +
          '<div class="small">Answer ' + esc(p.name) + ' out loud. If you make a mistake, the coach shows the fix and you say it again. Stuck? Tap <b>Help</b>.</div>' +
          '<div class="tc-ar ar">أجب بصوتك. إذا أخطأت سيظهر لك التصحيح لتعيد الجملة. إذا توقفت اضغط "Help".</div></div></div>' +
      '</div></div>' +
      '<div class="foot"><button class="btn btn-primary btn-block" data-act="start">' + icon('mic', 'sm') + 'Start conversation</button></div>';
    el.onclick = function (e) {
      if (e.target.closest('[data-act="back"]')) { V.stop(); Router.go('home'); return; }
      if (e.target.closest('[data-act="start"]')) { V.unlock(); Router.go('talk', sc.id); return; }
      const say = e.target.closest('[data-say]');
      if (say) { V.speak(phrases[+say.dataset.say].en, { role: 'coach' }); return; }
      const save = e.target.closest('[data-save]');
      if (save) {
        const ph = phrases[+save.dataset.save];
        const added = Phrases.add({ en: ph.en, ar: ph.ar, scenario: sc.id, kind: 'key' });
        save.classList.add('on');
        toast(added ? 'Saved to My phrases' : 'Already in My phrases');
      }
    };
  }

  /* --- Summary --- */
  function renderSummary(r) {
    const el = $('#s-summary');
    const sc = scenarioById(r.id);
    const next = nextScenario(r.id);
    const title = r.score >= 85 ? ['Excellent conversation!', 'محادثة ممتازة!'] : r.score >= 70 ? ['Great job!', 'عمل رائع!'] : r.score >= 50 ? ['Good progress!', 'تقدّم جيد!'] : ['Good start!', 'بداية جيدة!'];
    const pct = function (v) { return Math.round(clamp(v, 0, 1) * 100); };
    const metric = function (label, v) {
      return '<div class="metric"><span>' + label + '</span><b>' + pct(v) + '%</b><div class="meter-bar"><i style="width:' + pct(v) + '%"></i></div></div>';
    };
    el.innerHTML =
      '<div class="topbar"><button class="icon-btn" data-act="home" aria-label="Close">' + icon('x') + '</button><div class="grow"></div><span class="chip ok">' + icon('check', 'xs') + 'Completed</span></div>' +
      '<div class="scroll"><div class="sum-body">' +
        '<div class="sum-hero"><div class="ring big-ring">' + ringSvg(r.score / 100, 2.6) + '<div class="ring-txt"><div><b>' + r.score + '</b><span>score</span></div></div></div>' +
          '<h1 class="display">' + title[0] + '</h1><p class="muted">' + esc(sc.title) + ' with ' + esc(sc.persona.name) + '<span class="ar inl">' + title[1] + '</span></p></div>' +
        '<div class="metrics">' + metric('Accuracy', r.accuracy) + metric('Confidence', r.confidence) + metric('Fluency', r.fluency) + '</div>' +
        '<div class="stats">' +
          '<div class="stat"><b>' + r.answers + '</b><span>sentences spoken</span></div>' +
          '<div class="stat"><b>' + r.words + '</b><span>English words used</span></div>' +
        '</div>' +
        '<section class="section"><div class="section-head"><h2>' + (r.fixes.length ? 'Your corrections' : 'No corrections needed') + '</h2><span class="ar">' + (r.fixes.length ? 'تصحيحاتك' : 'بدون أخطاء') + '</span></div>' +
          (r.fixes.length ?
            '<div class="group">' + r.fixes.map(function (f, i) {
              return '<div class="fix-row"><span class="from">' + esc(f.from) + '</span>' +
                '<div class="to"><span class="txt">' + esc(f.to) + '</span>' + (f.ok ? '<span class="chip ok">' + icon('check', 'xs') + 'said it</span>' : '<span class="chip amber">practice</span>') +
                '<button class="icon-btn" data-fix="' + i + '" aria-label="Listen">' + icon('volume', 'sm') + '</button></div>' +
                '<span class="ar muted small">' + arHtml(f.ar) + '</span></div>';
            }).join('') + '</div><p class="note" style="padding-inline:4px">All corrections are saved in <b>My phrases</b> so you can practice them again.</p>' :
            '<div class="group"><div class="empty">' + icon('star') + '<h3>Clean conversation</h3><p>Every sentence was correct. Try a harder scenario next.</p></div></div>') +
        '</section>' +
      '</div></div>' +
      '<div class="foot stack">' +
        '<button class="btn btn-primary btn-block" data-next="' + next.id + '">Next: ' + esc(next.title) + icon('arrow', 'sm') + '</button>' +
        '<button class="btn btn-soft btn-block" data-again="' + r.id + '">' + icon('redo', 'sm') + 'Practice again</button>' +
      '</div>';
    el.onclick = function (e) {
      if (e.target.closest('[data-act="home"]')) { Router.go('home', 'practice'); return; }
      const n = e.target.closest('[data-next]');
      if (n) { Router.go('brief', n.dataset.next); return; }
      const ag = e.target.closest('[data-again]');
      if (ag) { V.unlock(); Router.go('talk', ag.dataset.again); return; }
      const fx = e.target.closest('[data-fix]');
      if (fx) V.speak(r.fixes[+fx.dataset.fix].to, { role: 'coach' });
    };
  }

  /* ------------------------------------------------------------------ *
   * Settings sheet
   * ------------------------------------------------------------------ */
  function seg(key, opts, cur) {
    return '<div class="seg" data-key="' + key + '">' + opts.map(function (o) {
      return '<button type="button" data-v="' + o[0] + '" class="' + (String(cur) === String(o[0]) ? 'on' : '') + '">' + esc(o[1]) + '</button>';
    }).join('') + '</div>';
  }
  function sw(key, on, id) {
    return '<label class="switch"><input type="checkbox" id="' + id + '" data-key="' + key + '"' + (on ? ' checked' : '') + '><span></span></label>';
  }

  function openSettings() {
    const wrap = $('#sheet');
    renderSettings();
    wrap.classList.add('open');
    wrap.setAttribute('aria-hidden', 'false');
    setTimeout(function () { const b = $('.sheet-head .icon-btn', wrap); if (b) b.focus(); }, 50);
  }
  function closeSettings() {
    const wrap = $('#sheet');
    wrap.classList.remove('open');
    wrap.setAttribute('aria-hidden', 'true');
    if (Router.cur === 'home') renderHome();
  }

  function renderSettings() {
    const s = settings(), c = s.cloud;
    const st = V.status(s.accent);
    const dv = V.device;
    const voiceOpts = function (g) {
      return '<option value="">Automatic (best available)</option>' + dv.list(g, s.accent).slice(0, 14).map(function (v) {
        const sel = s.deviceVoices[g] === v.voiceURI ? ' selected' : '';
        return '<option value="' + esc(v.voiceURI) + '"' + sel + '>' + esc(v.name) + ' (' + esc(v.lang) + ')</option>';
      }).join('');
    };
    const last = V.lastProvider;
    const engine = function (id, name, desc, on) {
      return '<div class="engine' + (on ? ' on' : '') + (last === id ? ' active' : '') + '"><span class="e-dot"></span><div class="s-body"><b>' + name + '</b><span>' + esc(desc) + '</span></div>' +
        (last === id ? '<span class="chip brand">in use</span>' : '') + '</div>';
    };
    const sttCloudOk = (c.kind === 'openai' && c.apiKey) || (c.kind === 'custom' && c.sttEndpoint);
    $('#sheet .scroll').innerHTML =
      '<div class="set-group"><span class="eyebrow">Voice</span><div class="set">' +
        '<div class="set-row"><div class="s-body"><b>Accent</b><span>Characters and coach</span></div>' + seg('accent', [['us', 'American'], ['gb', 'British']], s.accent) + '</div>' +
        '<div class="set-row col"><div class="s-body"><b>Speaking speed · <span id="rate-val">' + Math.round(s.rate * 100) + '%</span></b><span>Slower speech is easier to follow</span></div>' +
          '<input class="range" id="set-rate" type="range" min="0.7" max="1.15" step="0.05" value="' + s.rate + '" data-key="rate" aria-label="Speaking speed">' +
          '<div class="range-labels"><span>Slower</span><span>Natural</span><span>Faster</span></div></div>' +
        '<div class="set-row"><div class="s-body"><b>Hear a sample</b><span>Plays the current voice at this speed</span></div><button class="btn btn-soft" style="min-height:40px;font-size:14px" data-do="test">' + icon('volume', 'sm') + 'Play</button></div>' +
      '</div></div>' +

      '<div class="set-group"><span class="eyebrow">Voice quality</span><div class="set">' +
        engine('studio', 'Studio voice pack', st.studio.text, st.studio.on) +
        engine('cloud', 'Premium cloud voice', st.cloud.text, st.cloud.on) +
        engine('device', 'Device voice', st.device.female + ' · ' + st.device.male, st.device.on) +
      '</div>' +
      '<p class="note" style="padding-inline:4px">Lisan always uses the best voice available: studio clips first, then a premium cloud voice, then this device’s best built-in voice.</p>' +
      '<div class="set">' +
        (V.canRoute ? '<div class="set-row"><div class="s-body"><b>Clarity boost</b><span>Evens out loudness and sharpens consonants</span></div>' + sw('fx', s.fx, 'set-fx') + '</div>' : '') +
        '<div class="set-row col"><div class="field"><label for="dv-female">Device voice · female characters</label><select id="dv-female" data-dv="female">' + voiceOpts('female') + '</select></div>' +
          '<div class="field"><label for="dv-male">Device voice · male characters</label><select id="dv-male" data-dv="male">' + voiceOpts('male') + '</select></div></div>' +
        '<details class="adv"' + (c.kind !== 'off' ? ' open' : '') + '><summary>Connect a premium voice' + icon('chev', 'sm') + '</summary><div class="adv-body">' +
          '<div class="field"><label for="cl-kind">Provider</label><select id="cl-kind">' +
            [['off', 'Off'], ['openai', 'OpenAI'], ['elevenlabs', 'ElevenLabs'], ['custom', 'Your own server']].map(function (o) {
              return '<option value="' + o[0] + '"' + (c.kind === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
            }).join('') + '</select></div>' +
          '<div class="field" data-show="openai elevenlabs custom"><label for="cl-key">API key</label><input id="cl-key" type="password" autocomplete="off" value="' + esc(c.apiKey) + '" placeholder="Paste key"></div>' +
          '<div class="field" data-show="custom"><label for="cl-ep">Speech endpoint (POST, returns audio)</label><input id="cl-ep" type="url" value="' + esc(c.endpoint) + '" placeholder="https://your-server/tts"></div>' +
          '<div class="field" data-show="custom"><label for="cl-stt">Transcription endpoint (optional)</label><input id="cl-stt" type="url" value="' + esc(c.sttEndpoint) + '" placeholder="https://your-server/stt"></div>' +
          '<div class="field" data-show="openai elevenlabs custom"><label for="cl-model">Model (optional)</label><input id="cl-model" type="text" value="' + esc(c.model) + '" placeholder="' + esc((V.cloudDefaults[c.kind] || {}).model || '') + '"></div>' +
          '<div class="field-grid" data-show="openai elevenlabs custom">' +
            '<div class="field"><label for="cl-vf">Female voice</label><input id="cl-vf" type="text" value="' + esc((c.voices || {}).female || '') + '" placeholder="default"></div>' +
            '<div class="field"><label for="cl-vm">Male voice</label><input id="cl-vm" type="text" value="' + esc((c.voices || {}).male || '') + '" placeholder="default"></div>' +
            '<div class="field"><label for="cl-vc">Coach voice</label><input id="cl-vc" type="text" value="' + esc((c.voices || {}).coach || '') + '" placeholder="default"></div>' +
          '</div>' +
          '<p class="note warn" data-show="openai elevenlabs">Your key is stored only in this browser. To share the app publicly, use “Your own server” so keys never reach the browser.</p>' +
          '<button class="btn btn-primary" data-do="cloud-save">Save and test voice</button>' +
        '</div></details>' +
      '</div></div>' +

      '<div class="set-group"><span class="eyebrow">Listening</span><div class="set">' +
        '<div class="set-row"><div class="s-body"><b>Speech recognition</b><span>' + (sttCloudOk ? 'Cloud is more accurate with accents' : 'Connect OpenAI above to enable cloud') + '</span></div>' +
          seg('stt', [['device', 'Device'], ['cloud', 'Cloud']], s.stt) + '</div>' +
        '<div class="set-row"><div class="s-body"><b>Pause before I reply</b><span>How long you can pause while thinking</span></div>' +
          seg('patience', [['short', 'Short'], ['normal', 'Normal'], ['long', 'Long']], s.patience) + '</div>' +
        '<div class="set-row"><div class="s-body"><b>Hands-free</b><span>Start listening after the character speaks</span></div>' + sw('autoListen', s.autoListen, 'set-auto') + '</div>' +
      '</div></div>' +

      '<div class="set-group"><span class="eyebrow">Learning</span><div class="set">' +
        '<div class="set-row"><div class="s-body"><b>Level</b></div>' + seg('level', [['Beginner', 'Beginner'], ['Intermediate', 'Mid'], ['Advanced', 'Advanced']], s.level) + '</div>' +
        '<div class="set-row"><div class="s-body"><b>Arabic translation</b><span class="ar">الترجمة العربية</span></div>' + seg('arabic', [['show', 'Show'], ['tap', 'Tap'], ['hide', 'Hide']], s.arabic) + '</div>' +
        '<div class="set-row"><div class="s-body"><b>Daily goal</b><span>Minutes of practice</span></div>' + seg('goalMin', [[5, '5'], [10, '10'], [15, '15']], s.goalMin) + '</div>' +
        '<div class="set-row"><div class="s-body"><b>Sound effects</b><span>Soft cues when the mic opens and closes</span></div>' + sw('sounds', s.sounds, 'set-sounds') + '</div>' +
      '</div></div>' +

      '<div class="set-group"><span class="eyebrow">Appearance</span><div class="set">' +
        '<div class="set-row"><div class="s-body"><b>Theme</b></div>' + seg('theme', [['system', 'Auto'], ['light', 'Light'], ['dark', 'Dark']], s.theme) + '</div>' +
      '</div></div>' +

      '<div class="set-group"><span class="eyebrow">Your data</span><div class="set">' +
        '<div class="set-row"><div class="s-body"><b>Reset progress</b><span>Clears scores, streak and saved phrases on this device</span></div><button class="btn btn-ghost" data-do="reset" style="color:var(--bad)">Reset</button></div>' +
      '</div><p class="note" style="padding-inline:4px">Lisan 1.0 · Your progress stays on this device.</p></div>';
    syncCloudFields();
  }
  function syncCloudFields() {
    const kind = ($('#cl-kind') || {}).value || 'off';
    $$('#sheet [data-show]').forEach(function (f) { f.hidden = f.dataset.show.split(' ').indexOf(kind) < 0; });
  }

  function bindSettings() {
    const wrap = $('#sheet');
    wrap.addEventListener('click', function (e) {
      if (e.target.classList.contains('scrim') || e.target.closest('[data-act="close-sheet"]')) { closeSettings(); return; }
      const s = settings();
      const b = e.target.closest('.seg[data-key] button');
      if (b) {
        const key = b.parentElement.dataset.key;
        let v = b.dataset.v;
        if (key === 'goalMin') v = +v;
        if (key === 'stt' && v === 'cloud' && !((s.cloud.kind === 'openai' && s.cloud.apiKey) || (s.cloud.kind === 'custom' && s.cloud.sttEndpoint))) {
          toast('Connect OpenAI (or your own server) under “Connect a premium voice” first.');
          return;
        }
        s[key] = v;
        Store.save(); applySettings(); renderSettings();
        return;
      }
      const d = e.target.closest('[data-do]');
      if (!d) return;
      if (d.dataset.do === 'test') {
        V.unlock();
        V.speak('Hi! This is how I sound. Take your time, and let’s practice together.', { role: 'persona', gender: 'female' })
          .then(function (r) { renderSettings(); if (r.provider) toast('Played with: ' + ({ studio: 'studio voice pack', cloud: 'premium cloud voice', device: 'device voice' })[r.provider]); });
      } else if (d.dataset.do === 'cloud-save') {
        s.cloud = {
          kind: $('#cl-kind').value, apiKey: $('#cl-key').value.trim(), endpoint: $('#cl-ep').value.trim(),
          sttEndpoint: $('#cl-stt').value.trim(), model: $('#cl-model').value.trim(),
          voices: { female: $('#cl-vf').value.trim(), male: $('#cl-vm').value.trim(), coach: $('#cl-vc').value.trim() }
        };
        Store.save(); applySettings();
        V.unlock();
        V.speak('Your premium voice is connected.', { role: 'persona', gender: 'female' }).then(function (r) {
          renderSettings();
          toast(r.provider === 'cloud' ? 'Premium voice connected' : 'Couldn’t reach that voice service. Check the key and try again.');
        });
      } else if (d.dataset.do === 'reset') {
        modal({
          title: 'Reset all progress?',
          html: '<p class="muted">This clears your scores, streak and saved phrases on this device. Your settings stay.</p>',
          actions: [{ label: 'Cancel' }, {
            label: 'Reset', kind: 'btn-primary', onClick: function () {
              const keep = Store.data.settings;
              Store.data = Store.defaults();
              Store.data.settings = keep;
              Store.save();
              renderSettings();
              toast('Progress reset');
            }
          }]
        });
      }
    });
    wrap.addEventListener('change', function (e) {
      const s = settings();
      const t = e.target;
      if (t.id === 'cl-kind') { syncCloudFields(); return; }
      if (t.dataset.dv) { s.deviceVoices[t.dataset.dv] = t.value; Store.save(); applySettings(); return; }
      if (t.type === 'checkbox' && t.dataset.key) { s[t.dataset.key] = t.checked; Store.save(); applySettings(); return; }
      if (t.id === 'set-rate') { s.rate = +t.value; Store.save(); applySettings(); }
    });
    wrap.addEventListener('input', function (e) {
      if (e.target.id === 'set-rate') $('#rate-val').textContent = Math.round(+e.target.value * 100) + '%';
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && wrap.classList.contains('open')) closeSettings(); });
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */
  function boot() {
    Store.load();
    applySettings();
    bindSettings();
    V.device.onvoices = function () { if ($('#sheet').classList.contains('open')) renderSettings(); };
    // First gesture unlocks audio on iOS / Safari.
    const unlock = function () { V.unlock(); window.removeEventListener('pointerdown', unlock, true); };
    window.addEventListener('pointerdown', unlock, true);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { V.stop(); if (L.isListening()) L.cancel(); if (activeTalk && activeTalk.mode !== 'idle') activeTalk.setMode('idle'); }
    });
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', function () { if (activeTalk) activeTalk.orb.colors = null; });
    }
    Router.go(settings().onboarded ? 'home' : 'onb');
  }

  window.Lisan = { Store: Store, Router: Router, Progress: Progress, scenarios: SCENARIOS };
  boot();
})();
