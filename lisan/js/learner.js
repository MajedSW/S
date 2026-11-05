/* ==========================================================================
   Lisan · learner.js — what Lisan knows about this speaker
   --------------------------------------------------------------------------
   A small, local learner model:
     • weak spots   counts of the error types the learner keeps making
     • words        every word or phrase they lacked (gaps) — their notebook
     • recent fixes the last few corrections, for context
   It is summarised into every AI prompt, so the partner adapts: it models
   the learner's weak structures and recycles the words they just learned.
   Stored only on this device.
   ========================================================================== */
(function (root) {
  'use strict';
  const KEY = 'lisan.learner.v1';
  const P = root.LisanPrompts;

  // Map guided-mode (offline coach) rule ids to the shared error types.
  const RULE_TYPES = {
    'missing-to-place': 'preposition', 'present-continuous-plan': 'tense', 'be-plus-base': 'grammar',
    'missing-be-ing': 'missing_word', 'missing-be-adj': 'missing_word', 'dont-verb': 'grammar', 'doesnt': 'grammar',
    'third-person-s': 'grammar', 'age': 'word_choice', 'turn-on-off': 'word_choice', 'present-perfect-since': 'tense',
    'for-duration': 'preposition', 'did-base': 'tense', 'comparative': 'grammar', 'really-like': 'word_order',
    'want-to': 'missing_word', 'article': 'article', 'illness-a': 'article', 'people-plural': 'plural',
    'uncountable': 'plural', 'was-born': 'tense', 'no-preposition': 'preposition', 'modal-to': 'grammar',
    'go-home': 'preposition', 'married-to': 'preposition', 'explain-to': 'preposition', 'can-you': 'word_order',
    'what-mean': 'word_order', 'how-much-does': 'word_order', 'plural-noun': 'plural', 'good-at': 'preposition',
    'in-time': 'preposition', 'parts-of-day': 'preposition', 'make-take': 'word_choice', 'arrive-in-at': 'preposition',
    'past-with-time': 'tense'
  };

  const Learner = {
    data: null,
    blank: function () { return { weak: {}, words: [], fixes: [], interests: [], sessions: 0 }; },
    load: function () {
      let d = null;
      try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { d = null; }
      this.data = Object.assign(this.blank(), d && typeof d === 'object' ? d : {});
      return this;
    },
    save: function () { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* storage unavailable */ } },
    reset: function () { this.data = this.blank(); this.save(); },

    addWeak: function (type, n) {
      if (!type) return;
      this.data.weak[type] = (this.data.weak[type] || 0) + (n || 1);
    },
    /** A word or phrase the learner lacked. Returns true if new. */
    addWord: function (w, source) {
      if (!w || !w.en) return false;
      const key = String(w.en).toLowerCase().trim();
      const list = this.data.words;
      const old = list.find(function (x) { return x.en.toLowerCase().trim() === key; });
      if (old) { old.seen = (old.seen || 1) + 1; old.at = Date.now(); this.save(); return false; }
      list.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), en: String(w.en).trim(), ar: String(w.ar || '').trim(), source: source || '', at: Date.now(), seen: 1 });
      if (list.length > 400) list.length = 400;
      this.save();
      return true;
    },
    removeWord: function (id) { this.data.words = this.data.words.filter(function (w) { return w.id !== id; }); this.save(); },

    /** Feed an AI feedback object into the model. */
    recordFeedback: function (fb, source) {
      if (!fb) return;
      const self = this;
      (fb.fixes || []).forEach(function (f) {
        self.addWeak(f.type || 'other');
        self.data.fixes.unshift({ wrong: f.wrong, right: f.right, type: f.type, at: Date.now() });
      });
      if (this.data.fixes.length > 60) this.data.fixes.length = 60;
      (fb.gaps || []).forEach(function (g) { self.addWord(g, source); });
      this.save();
    },
    /** Feed an offline-coach correction into the model. */
    recordRuleFix: function (ruleId, wrong, right) {
      this.addWeak(RULE_TYPES[ruleId] || 'grammar');
      this.data.fixes.unshift({ wrong: wrong, right: right, type: RULE_TYPES[ruleId] || 'grammar', at: Date.now() });
      if (this.data.fixes.length > 60) this.data.fixes.length = 60;
      this.save();
    },
    noteInterest: function (topic) {
      if (!topic) return;
      const i = this.data.interests.indexOf(topic);
      if (i > -1) this.data.interests.splice(i, 1);
      this.data.interests.unshift(topic);
      this.data.interests.length = Math.min(this.data.interests.length, 6);
      this.data.sessions++;
      this.save();
    },

    /** Top weak spots, most frequent first: [{type, label, count}] */
    weakSpots: function (n) {
      const w = this.data.weak;
      return Object.keys(w).sort(function (a, b) { return w[b] - w[a]; }).slice(0, n || 4).map(function (t) {
        return { type: t, label: (P && P.WEAK_LABELS[t]) || t, count: w[t] };
      });
    },
    /** Compact summary that goes into every AI prompt. */
    summary: function () {
      const d = this.data;
      return {
        weak: this.weakSpots(3).filter(function (x) { return x.count >= 2; }).map(function (x) { return x.label; }),
        words: d.words.slice(0, 8).map(function (w) { return w.en; }),
        fixes: d.fixes.slice(0, 3).map(function (f) { return f.wrong + ' → ' + f.right; }),
        interests: d.interests.slice(0, 4)
      };
    }
  };

  root.LisanLearner = Learner.load();
})(window);
