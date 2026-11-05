/* ==========================================================================
   Lisan · prompts.js — what the AI partner is told
   --------------------------------------------------------------------------
   Shared by the browser (Claude inside claude.ai) and server/server.mjs
   (Claude API). The server builds prompts itself from a small, validated
   context object, so it is never an open relay for arbitrary prompts.

   Tasks
     turn       the partner's next spoken reply (streamed text + "AR:" line)
     feedback   silent analysis of one learner sentence (JSON)
     assist     gap filler: the learner froze mid-sentence (JSON, fast)
     translate  the learner said a word in Arabic (JSON, fast)
     hint       "my mind went blank" before answering (JSON)
     report     end-of-conversation coaching report (JSON)
   ========================================================================== */
(function (root) {
  'use strict';

  const LEVEL_STYLE = {
    Beginner: 'Use very common words and short sentences. Keep each reply under 25 words. One idea per sentence.',
    Intermediate: 'Use natural everyday English. Keep each reply under 40 words. Now and then use one useful new phrase.',
    Advanced: 'Talk like a native speaker, with idioms and richer vocabulary where they fit. Keep each reply under 55 words.'
  };

  const WEAK_LABELS = {
    grammar: 'grammar', tense: 'verb tenses', article: 'articles (a / an / the)', preposition: 'prepositions',
    word_choice: 'choosing the right word', missing_word: 'small missing words (am / is / to / the)',
    word_order: 'word order', vocabulary: 'vocabulary', plural: 'plurals', other: 'general accuracy'
  };
  const FIX_TYPES = Object.keys(WEAK_LABELS);

  /* ------------------------------------------------------------------ *
   * Context helpers (also used by the server to sanitise input)
   * ------------------------------------------------------------------ */
  function clip(s, n) { s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n) : s; }
  function list(a, n, m) { return (Array.isArray(a) ? a : []).slice(0, n).map(function (x) { return clip(x, m || 80); }).filter(Boolean); }

  function sanitize(ctx) {
    ctx = ctx && typeof ctx === 'object' ? ctx : {};
    const p = ctx.persona || {};
    const out = {
      mode: ctx.mode === 'roleplay' ? 'roleplay' : 'free',
      level: LEVEL_STYLE[ctx.level] ? ctx.level : 'Intermediate',
      persona: { name: clip(p.name || 'Maya', 30), role: clip(p.role || 'conversation partner', 60), gender: p.gender === 'male' ? 'male' : 'female' },
      topic: clip(ctx.topic, 120),
      angle: clip(ctx.angle, 240),
      place: clip(ctx.place, 80),
      mission: clip(ctx.mission, 240),
      beats: list(ctx.beats, 10, 200),
      outro: clip(ctx.outro, 200),
      maxTurns: Math.max(4, Math.min(16, parseInt(ctx.maxTurns, 10) || 9)),
      learner: {
        weak: list(ctx.learner && ctx.learner.weak, 4, 60),
        words: list(ctx.learner && ctx.learner.words, 10, 40),
        fixes: list(ctx.learner && ctx.learner.fixes, 4, 80),
        interests: list(ctx.learner && ctx.learner.interests, 5, 40)
      },
      history: (Array.isArray(ctx.history) ? ctx.history : []).slice(-30).map(function (h) {
        return { role: h && h.role === 'learner' ? 'learner' : 'tutor', text: clip(h && h.text, 700), note: clip(h && h.note, 200) };
      }).filter(function (h) { return h.text; }),
      said: clip(ctx.said, 700),
      partial: clip(ctx.partial, 400),
      arabic: clip(ctx.arabic, 120),
      assisted: list(ctx.assisted, 4, 40),
      stats: ctx.stats && typeof ctx.stats === 'object' ? {
        learnerTurns: +ctx.stats.learnerTurns || 0, words: +ctx.stats.words || 0, gaps: +ctx.stats.gaps || 0,
        wpm: +ctx.stats.wpm || 0, minutes: +ctx.stats.minutes || 0
      } : null,
      fixesSeen: (Array.isArray(ctx.fixesSeen) ? ctx.fixesSeen : []).slice(0, 24).map(function (f) {
        return { wrong: clip(f && f.wrong, 60), right: clip(f && f.right, 60), type: FIX_TYPES.indexOf(f && f.type) > -1 ? f.type : 'other' };
      })
    };
    return out;
  }

  function learnerNotes(c) {
    const L = c.learner, out = ['Learner level: ' + c.level + '. Native language: Arabic.'];
    if (L.weak.length) out.push('They often struggle with: ' + L.weak.join('; ') + '. Model these correctly in your own replies.');
    if (L.words.length) out.push('Words they recently learned: ' + L.words.join(', ') + '. Reuse one naturally if it fits, so it sticks.');
    if (L.fixes.length) out.push('Recent slips: ' + L.fixes.join('; ') + '.');
    if (L.interests.length) out.push('They like talking about: ' + L.interests.join(', ') + '.');
    return out.join('\n');
  }

  function transcript(c, n) {
    const h = c.history.slice(-(n || 8));
    if (!h.length) return '(no conversation yet)';
    return h.map(function (x) { return (x.role === 'learner' ? 'Learner: ' : c.persona.name + ': ') + x.text; }).join('\n');
  }

  /* ------------------------------------------------------------------ *
   * The partner's voice (task: turn)
   * ------------------------------------------------------------------ */
  const PARTNER_CORE = [
    'You are the speaking partner inside Lisan, an app where Arabic speakers (mostly from Saudi Arabia and the Gulf) practise SPEAKING English out loud. Everything you write in English is read aloud by text-to-speech and shown as a subtitle.',
    '',
    'Your job is to keep the learner talking and to fill their gaps without breaking the flow:',
    '1. Follow the speaker. React to what they actually said, show real interest, build on the details they gave. Ask one easy question per reply that they can answer out loud.',
    '2. Fill the gap. If their message trails off, is unfinished, contains fillers (um, uh), vague words ("the thing", "the big... in the sea"), or Arabic words, work out what they meant and offer the missing words as a quick friendly check, the way a friend would: "Oh, do you mean a shark\'s fin?" Then carry on with the conversation.',
    '3. Correct silently. Never say "mistake", never explain grammar, never ask them to repeat. Echo their idea back with the correct words, naturally. (They say "I go beach yesterday"; you say "Oh, you went to the beach yesterday? Nice!")',
    '4. Adjust. If they struggle, make your next question simpler and more concrete. If they are doing well, stretch them a little.',
    'Style: warm, natural spoken English with contractions. No emojis, lists, headings, stage directions or quotation marks around the reply. Never put Arabic in the English part. Never mention that you are an AI unless asked.'
  ].join('\n');

  function turnPrompt(c) {
    const p = c.persona;
    let scene;
    if (c.mode === 'roleplay') {
      scene = 'This is a role-play. You are ' + p.name + ', ' + p.role + (c.place ? ', at ' + c.place : '') + '. Stay in character.\n' +
        (c.mission ? "The learner's mission: " + c.mission + '\n' : '') +
        (c.beats.length ? 'Cover these story beats in order, roughly one per reply, adapting freely to whatever the learner says:\n' +
          c.beats.map(function (b, i) { return (i + 1) + '. ' + b; }).join('\n') + '\n' : '') +
        'When every beat is done, close the scene warmly in one or two sentences' + (c.outro ? ' (for example: "' + c.outro + '")' : '') +
        ' and end the English part with [END].';
    } else {
      scene = 'This is a free conversation. You are ' + p.name + ', a friendly conversation partner (a peer, not a teacher).' +
        (c.topic ? ' Topic: ' + c.topic + '.' : '') + (c.angle ? ' ' + c.angle : '') +
        ' Let the conversation go wherever the learner takes it. After about ' + c.maxTurns +
        ' learner replies, wrap up warmly in one or two sentences and end the English part with [END].';
    }
    const system = PARTNER_CORE + '\n\n' + scene + '\n\n' + learnerNotes(c) + '\nLevel guidance: ' + LEVEL_STYLE[c.level] +
      '\n\nReply format, exactly:\n<your English reply>\nAR: <a natural Arabic translation of your English reply>';

    const messages = [];
    c.history.forEach(function (h) {
      const content = h.role === 'learner' && h.note ? h.text + '\n(' + h.note + ')' : h.text;
      messages.push({ role: h.role === 'learner' ? 'user' : 'assistant', content: content });
    });
    if (!messages.length || messages[0].role !== 'user') {
      messages.unshift({ role: 'user', content: '(The learner has just opened the conversation. Greet them in one short sentence as ' + p.name + ' and ask your first question.)' });
    }
    if (messages[messages.length - 1].role !== 'user') {
      messages.push({ role: 'user', content: '(The learner is quiet. Encourage them gently and ask a simpler question.)' });
    }
    return { system: system, messages: messages, effort: 'low', tier: 'quick', stream: true };
  }

  /* ------------------------------------------------------------------ *
   * JSON tasks
   * ------------------------------------------------------------------ */
  const S = {
    str: { type: 'string' },
    pair: { type: 'object', properties: { en: { type: 'string' }, ar: { type: 'string' } }, required: ['en', 'ar'], additionalProperties: false }
  };
  const SCHEMAS = {
    feedback: {
      type: 'object',
      properties: {
        better: S.str,
        fixes: {
          type: 'array', items: {
            type: 'object',
            properties: { wrong: S.str, right: S.str, type: { type: 'string', enum: FIX_TYPES }, why_en: S.str, why_ar: S.str },
            required: ['wrong', 'right', 'type', 'why_en', 'why_ar'], additionalProperties: false
          }
        },
        gaps: { type: 'array', items: S.pair },
        praise: S.str
      },
      required: ['better', 'fixes', 'gaps', 'praise'], additionalProperties: false
    },
    assist: {
      type: 'object',
      properties: { options: { type: 'array', items: S.pair }, cue: S.str },
      required: ['options', 'cue'], additionalProperties: false
    },
    hint: {
      type: 'object',
      properties: { starters: { type: 'array', items: S.pair } },
      required: ['starters'], additionalProperties: false
    },
    report: {
      type: 'object',
      properties: {
        headline: S.str, headline_ar: S.str,
        scores: {
          type: 'object',
          properties: { fluency: { type: 'integer' }, grammar: { type: 'integer' }, vocabulary: { type: 'integer' }, confidence: { type: 'integer' } },
          required: ['fluency', 'grammar', 'vocabulary', 'confidence'], additionalProperties: false
        },
        strengths: { type: 'array', items: S.str },
        focus: {
          type: 'array', items: {
            type: 'object',
            properties: { title: S.str, title_ar: S.str, wrong: S.str, right: S.str, tip_ar: S.str },
            required: ['title', 'title_ar', 'wrong', 'right', 'tip_ar'], additionalProperties: false
          }
        },
        new_words: { type: 'array', items: S.pair },
        say_it_better: {
          type: 'array', items: {
            type: 'object', properties: { said: S.str, better: S.str }, required: ['said', 'better'], additionalProperties: false
          }
        },
        next_step: S.str, next_step_ar: S.str
      },
      required: ['headline', 'headline_ar', 'scores', 'strengths', 'focus', 'new_words', 'say_it_better', 'next_step', 'next_step_ar'],
      additionalProperties: false
    }
  };
  SCHEMAS.translate = SCHEMAS.assist;

  const EXAMPLES = {
    feedback: '{"better":"I went to the beach yesterday and saw a shark\'s fin.","fixes":[{"wrong":"I go","right":"I went","type":"tense","why_en":"Use the past tense for yesterday.","why_ar":"مع yesterday نستخدم الفعل في الماضي."}],"gaps":[{"en":"shark\'s fin","ar":"زعنفة القرش"}],"praise":""}',
    assist: '{"options":[{"en":"shark\'s fin","ar":"زعنفة القرش"},{"en":"wave","ar":"موجة"}],"cue":"Do you mean a shark\'s fin?"}',
    translate: '{"options":[{"en":"fin","ar":"زعنفة"},{"en":"shark\'s fin","ar":"زعنفة القرش"}],"cue":"In English, that\'s a fin."}',
    hint: '{"starters":[{"en":"Last weekend I…","ar":"في عطلة الأسبوع الماضي…"},{"en":"I stayed at home and relaxed.","ar":"بقيت في البيت وارتحت."},{"en":"I went to the beach with my cousins and we had a barbecue.","ar":"ذهبت إلى الشاطئ مع أبناء عمي وشوينا."}]}'
  };

  function jsonPrompt(task, c) {
    const who = 'an Arabic-speaking English learner (level: ' + c.level + ')';
    let body = '';
    let effort = 'low', tier = 'quick';
    if (task === 'feedback') {
      body = 'You quietly analyse one spoken sentence from ' + who + '. It came from speech recognition: ignore punctuation, capitalisation and fillers (um, uh) — never flag those.\n\n' +
        'Conversation just before it:\n' + transcript(c, 4) + '\n\nThe learner said: "' + c.said + '"' +
        (c.assisted.length ? '\nThey froze and were helped with: ' + c.assisted.join(', ') + '.' : '') + '\n\n' +
        'Return JSON with:\n' +
        '- better: how a native speaker would say exactly what they meant, keeping their own words where possible. If it was already correct and natural, repeat it unchanged.\n' +
        '- fixes: only real errors a native speaker would notice, at most 3. "wrong" and "right" are short exact fragments (1-6 words); "right" must appear word for word in "better". type is one of: ' + FIX_TYPES.join(', ') + '. why_en: max 12 words. why_ar: one short, simple Arabic sentence (max 18 words) explaining the rule.\n' +
        '- gaps: words or phrases they did not know: ones they searched for, said in Arabic, described vaguely, or were helped with. At most 3, with Arabic meaning. Empty if none.\n' +
        '- praise: 2-5 English words if the sentence was correct and natural (e.g. "Perfectly natural!"), otherwise "".';
    } else if (task === 'assist') {
      body = 'You are a gap filler. ' + who + ' froze in the middle of a sentence while speaking.\n\nConversation so far:\n' + transcript(c, 6) +
        '\n\nWhat they have said so far: "' + c.partial + '"\n\n' +
        'Guess what they are trying to say next. Return JSON with:\n' +
        '- options: 1-3 ways to continue, most likely first. Each is the missing word or a short phrase (max 5 words) that continues their sentence; never a whole new sentence. "ar" is its Arabic meaning (max 3 words).\n' +
        '- cue: what a friendly native speaker would say to help, as a short question (max 7 words), e.g. "Do you mean a shark\'s fin?"';
    } else if (task === 'translate') {
      body = who + ' is speaking English but did not know a word, so they said it in Arabic: "' + c.arabic + '".\n' +
        'Their English sentence so far: "' + c.partial + '"\nConversation so far:\n' + transcript(c, 4) + '\n\n' +
        'Return JSON with:\n- options: 1-3 English words or short phrases for what they mean in this context, best first, with the Arabic ("ar") they correspond to.\n' +
        '- cue: one short spoken line giving the word, e.g. "In English, that\'s a fin."';
    } else if (task === 'hint') {
      body = who + "'s mind went blank. Help them answer the last thing their partner said.\n\nConversation so far:\n" + transcript(c, 6) + '\n\n' +
        'Return JSON with starters: exactly 3 options in natural spoken English that fit their level: (1) a sentence starter they can finish, ending with "…"; (2) a short, simple complete answer; (3) a slightly richer complete answer. Each with a natural Arabic translation in "ar".';
      effort = 'low';
    } else if (task === 'report') {
      const fx = c.fixesSeen.map(function (f) { return f.wrong + ' → ' + f.right + ' (' + f.type + ')'; }).join('\n');
      body = 'You are a warm, honest English speaking coach. Write a short report on this conversation by ' + who + '.\n\n' +
        'Conversation:\n' + transcript(c, 30) + '\n\nCorrections noted during the conversation:\n' + (fx || '(none)') + '\n\n' +
        (c.stats ? 'Stats: ' + c.stats.learnerTurns + ' replies, ' + c.stats.words + ' English words, ' + c.stats.gaps + ' times they needed a missing word, about ' + c.stats.wpm + ' words per minute.\n\n' : '') +
        'Return JSON with:\n- headline: one encouraging, specific sentence (max 14 words); headline_ar: its Arabic.\n' +
        '- scores: integers 0-100 for fluency (flow, length, few freezes), grammar, vocabulary (range and precision) and confidence. Be fair for their level; do not inflate.\n' +
        '- strengths: 1-2 short, specific things they did well.\n' +
        '- focus: 1-3 patterns to work on next, most important first; title (max 6 words) and title_ar, one real example from the conversation (wrong / right), and tip_ar: one practical Arabic tip (max 25 words).\n' +
        '- new_words: up to 8 useful words or phrases from this conversation worth keeping, with Arabic.\n' +
        '- say_it_better: up to 3 of their sentences rewritten the way a native speaker would say them.\n' +
        '- next_step: one concrete suggestion for the next practice (max 18 words); next_step_ar: its Arabic.';
      effort = 'medium'; tier = 'default';
    } else {
      throw new Error('unknown task ' + task);
    }
    return {
      system: 'You support Lisan, an app that helps Arabic speakers speak English with confidence. Reply with JSON only.',
      messages: [{ role: 'user', content: body }],
      schema: SCHEMAS[task],
      example: EXAMPLES[task] || '',
      effort: effort,
      tier: tier
    };
  }

  /** Build the prompt for a task from a (sanitised) context. */
  function build(task, ctx) {
    const c = sanitize(ctx);
    return task === 'turn' ? turnPrompt(c) : jsonPrompt(task, c);
  }

  /** One string for hosts without a system role (claude.ai `sample`). */
  function asSingleTurnInput(p) {
    return p.system + '\n\n' + p.messages.map(function (m) { return m.content; }).join('\n\n') +
      (p.example ? '\n\nReply with only the JSON object, shaped like this example:\n' + p.example : '');
  }
  /** Turn list for hosts without a system role: instructions lead as a user turn. */
  function asTurnList(p) {
    const out = [{ role: 'user', content: p.system }];
    p.messages.forEach(function (m) { out.push({ role: m.role, content: m.content }); });
    return out;
  }

  /** Split a streamed reply into the spoken English and its Arabic line. */
  function parseTurn(text) {
    const s = String(text || '');
    const m = s.split(/\n\s*AR\s*[:：]/);
    let en = m[0], ar = m.length > 1 ? m.slice(1).join(' ') : '';
    const end = /\[END\]/i.test(s);
    en = en.replace(/\[END\]/gi, '').replace(/^\s*["“]|["”]\s*$/g, '').replace(/^\s*\w+\s*:\s+(?=[A-Z])/, '').trim();
    ar = ar.replace(/\[END\]/gi, '').trim();
    return { en: en, ar: ar, end: end };
  }

  const api = {
    build: build, sanitize: sanitize, parseTurn: parseTurn,
    asSingleTurnInput: asSingleTurnInput, asTurnList: asTurnList,
    SCHEMAS: SCHEMAS, TASKS: ['turn', 'feedback', 'assist', 'translate', 'hint', 'report'],
    WEAK_LABELS: WEAK_LABELS, FIX_TYPES: FIX_TYPES
  };
  root.LisanPrompts = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
