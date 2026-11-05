/* ==========================================================================
   Lisan · gap.js — notices when the speaker freezes mid-sentence
   --------------------------------------------------------------------------
   Watches the live (interim) transcript while the learner speaks. It fires
   when:
     • they ask for a word ("how do you say…", "what's it called…") — at once
     • they stall on an unfinished sentence ("…and I saw a big") — after a
       short pause (stallMs), before speech recognition gives up on them
   The conversation then offers the missing words without stopping the mic.
   ========================================================================== */
(function (root) {
  'use strict';

  // Words a sentence rarely ends on: if speech stops here, they're stuck.
  const OPEN_END = new Set(('the a an some my your his her their our its this that these those to of with for in on at ' +
    'from by about into onto and but or because so if when than then very really quite too more most is are was were am ' +
    'be been being have has had do does did can could will would should must go went going see saw seen want wanted like ' +
    'need get got make made take took big small little huge large long many much few lot kind type sort called named ' +
    'um uh er erm hmm ah like such feel felt look looked looks became become there here').split(' '));

  const ASKING = /(how (do|can|would) (you|i|we) say|what('s| is| do you call| do they call) (it|that|this|the word)?\s*(called)?|what do you call|what('s| is) the word|i (don't|do not) know the word|i forgot the word|i don't know how to say|the thing (that|which|for)|something like)\s*[\w']*\s*$/i;
  const FILLER_END = /\b(um+|uh+|er+|erm+|hmm+|ah+)\s*$/i;

  function lastWord(text) {
    const m = String(text).toLowerCase().match(/([a-z']+)[^a-z']*$/);
    return m ? m[1] : '';
  }

  /** Why the text looks unfinished, or '' if it looks complete. */
  function unfinished(text) {
    const t = String(text || '').trim();
    if (!t) return '';
    if (ASKING.test(t)) return 'asked';
    if (FILLER_END.test(t)) return 'filler';
    const words = t.split(/\s+/).length;
    if (words >= 2 && OPEN_END.has(lastWord(t))) return 'trailing';
    return '';
  }

  function GapWatch(opts) {
    this.opts = Object.assign({ stallMs: 1400, onGap: function () {} }, opts || {});
    this.timer = 0;
    this.reset();
  }
  GapWatch.prototype.reset = function () {
    this.text = '';
    this.changedAt = performance.now();
    this.firedFor = '';
  };
  GapWatch.prototype.start = function () {
    const self = this;
    this.stop();
    this.reset();
    this.timer = setInterval(function () { self.tick(); }, 150);
  };
  GapWatch.prototype.stop = function () { clearInterval(this.timer); this.timer = 0; };
  GapWatch.prototype.update = function (text) {
    text = String(text || '').trim();
    if (text === this.text) return;
    this.text = text;
    this.changedAt = performance.now();
    // Asking for a word is an instant trigger.
    if (unfinished(text) === 'asked' && this.firedFor !== text) this.fire('asked');
  };
  GapWatch.prototype.tick = function () {
    const t = this.text;
    if (!t || this.firedFor === t) return;
    if (performance.now() - this.changedAt < this.opts.stallMs) return;
    const why = unfinished(t);
    if (why) this.fire(why);
  };
  GapWatch.prototype.fire = function (why) {
    this.firedFor = this.text;
    this.opts.onGap(this.text, why);
  };

  /** "yes", "yeah exactly", "that's it" — confirming a suggested word. */
  function isConfirm(text) {
    return /^(yes|yeah|yep|yup|exactly|right|correct|that's it|that is it|that's right|yes exactly|yeah exactly|yes that's it|yes yes)[.! ]*$/i.test(String(text || '').trim());
  }

  root.LisanGap = { GapWatch: GapWatch, unfinished: unfinished, isConfirm: isConfirm };
})(window);
