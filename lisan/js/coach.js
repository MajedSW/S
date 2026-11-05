/* ==========================================================================
   Lisan · coach.js — the language engine
   --------------------------------------------------------------------------
   Runs fully offline in the browser. It:
     • tidies a raw speech transcript into a readable sentence
     • finds the grammar slips Arabic speakers most often make in English
       (missing "to"/"am", "I not have", "since two days", "open the light"…)
       and explains each fix in Arabic and English
     • suggests a more natural / more polite way to say a correct sentence
     • judges whether a repeated sentence matches its target (tolerant of
       accents and speech-recognition noise, strict about the words that
       were actually fixed)
   The rule list is plain data: add a rule = add one object.
   ========================================================================== */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Word lists
   * ------------------------------------------------------------------ */
  const CITIES = new Set(('london paris dubai riyadh jeddah dammam mecca makkah medina madinah abha taif ' +
    'doha kuwait manama muscat cairo amman beirut istanbul new york boston chicago miami toronto ' +
    'vancouver sydney melbourne tokyo singapore bangkok kuala lumpur rome milan madrid barcelona ' +
    'berlin munich vienna geneva zurich amsterdam brussels manchester edinburgh dublin lisbon athens ' +
    'prague budapest moscow mumbai delhi bali seoul beijing shanghai jakarta casablanca marrakech ' +
    'tunis abu dhabi sharjah baku tbilisi los angeles las vegas san francisco washington seattle ' +
    'england britain france spain italy germany america canada australia japan china india turkey ' +
    'egypt jordan qatar bahrain oman lebanon morocco malaysia thailand indonesia switzerland austria ' +
    'scotland ireland greece portugal russia korea georgia azerbaijan maldives').split(' '));

  const PROPER = new Set(('english arabic french spanish german italian turkish chinese japanese ' +
    'monday tuesday wednesday thursday friday saturday sunday january february march april may june ' +
    'july august september october november december ramadan eid').split(' '));

  const NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const NUMBERISH = new Set(NUM_WORDS.concat(TENS.filter(Boolean), ['hundred', 'thousand', 'a', 'an',
    'couple', 'few', 'several', 'many', 'half', 'just', 'only', 'single', 'both']));

  const AUX = new Set(('am is are was were be been being do does did have has had will would can could ' +
    'shall should may might must to let make help not never also just really always usually still ' +
    "don't doesn't didn't won't can't isn't aren't wasn't weren't").split(' '));

  // Pronouns that can also be objects ("see you", "love it") — only treat as
  // the subject when they open a clause.
  const CLAUSE_OPENERS = new Set(('and but so because if when that think maybe now then yes no well ' +
    'okay ok actually also sorry hi hello oh because').split(' '));

  const NON_VERB_ING = new Set(('bring sing spring string swing sting thing nothing something anything ' +
    'everything king ring wing morning evening ceiling cling fling sling during ping ding wring ' +
    'building wedding meeting').split(' '));

  const IRREGULAR_PAST = {
    go: 'went', eat: 'ate', see: 'saw', take: 'took', come: 'came', have: 'had', buy: 'bought', fly: 'flew',
    meet: 'met', get: 'got', make: 'made', do: 'did', say: 'said', tell: 'told', give: 'gave', find: 'found',
    leave: 'left', feel: 'felt', pay: 'paid', sleep: 'slept', drive: 'drove', write: 'wrote', speak: 'spoke',
    know: 'knew', think: 'thought', bring: 'brought', send: 'sent', spend: 'spent', lose: 'lost', forget: 'forgot',
    begin: 'began', drink: 'drank', run: 'ran', sit: 'sat', stand: 'stood', wear: 'wore', hear: 'heard',
    keep: 'kept', understand: 'understood', teach: 'taught', catch: 'caught', become: 'became', put: 'put',
    read: 'read', win: 'won', choose: 'chose', break: 'broke', sell: 'sold'
  };
  const BASE_OF_PAST = Object.keys(IRREGULAR_PAST).reduce(function (m, k) {
    m[IRREGULAR_PAST[k]] = k; return m;
  }, {});

  /* ------------------------------------------------------------------ *
   * Small text helpers
   * ------------------------------------------------------------------ */
  function cap(w) { return w ? w.charAt(0).toUpperCase() + w.slice(1) : w; }
  function keepCase(src, out) { return /^[A-Z]/.test(src) ? cap(out) : out; }

  function prevWord(str, offset) {
    const m = str.slice(0, offset).match(/([A-Za-z']+)[^A-Za-z']*$/);
    return m ? m[1].toLowerCase() : null;
  }
  /** True when a pronoun at `offset` is acting as a subject. */
  function opensClause(str, offset, pronoun) {
    const p = pronoun.toLowerCase();
    const before = prevWord(str, offset);
    if (before && AUX.has(before)) return false;              // "are you sure", "did he go"
    if (p === 'you' || p === 'it') {                          // could be an object
      const head = str.slice(0, offset).trim();
      return !head || /[.,!?;:]$/.test(head) || CLAUSE_OPENERS.has(before);
    }
    return true;
  }

  function beFor(subject) {
    const s = subject.toLowerCase();
    if (s === 'i') return 'am';
    if (s === 'you' || s === 'we' || s === 'they') return 'are';
    return 'is';
  }
  function ingForm(v) {
    const w = v.toLowerCase();
    if (/ie$/.test(w)) return w.slice(0, -2) + 'ying';
    if (/[^aeiou]e$/.test(w) && w !== 'be') return w.slice(0, -1) + 'ing';
    if (/^(get|sit|run|stop|put|plan|shop|swim|set|cut|begin|travel)$/.test(w)) {
      return w === 'travel' ? 'traveling' : w + w.slice(-1) + 'ing';
    }
    return w + 'ing';
  }
  function thirdPerson(v) {
    const w = v.toLowerCase();
    if (w === 'have') return 'has';
    if (w === 'go' || w === 'do') return w + 'es';
    if (/(s|sh|ch|x|z|o)$/.test(w)) return w + 'es';
    if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + 'ies';
    return w + 's';
  }
  function pastForm(v) {
    const w = v.toLowerCase();
    if (IRREGULAR_PAST[w]) return IRREGULAR_PAST[w];
    if (/e$/.test(w)) return w + 'd';
    if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + 'ied';
    if (/^(stop|plan|shop|travel)$/.test(w)) return w === 'travel' ? 'traveled' : w + w.slice(-1) + 'ed';
    return w + 'ed';
  }
  function plural(n) {
    const w = n.toLowerCase();
    if (w === 'person') return 'people';
    if (w === 'child') return 'children';
    if (/(s|sh|ch|x)$/.test(w)) return w + 'es';
    if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + 'ies';
    return w + 's';
  }
  function isPlace(word) {
    if (!word) return false;
    if (CITIES.has(word.toLowerCase())) return true;
    return /^[A-Z][a-z]{2,}$/.test(word) && !PROPER.has(word.toLowerCase());
  }

  /* ------------------------------------------------------------------ *
   * Tidy a transcript for display
   * ------------------------------------------------------------------ */
  const QUESTION_START = /^(can|could|would|will|do|does|did|is|are|am|was|were|what|what's|where|where's|when|why|how|how's|which|who|whose|may|shall|should|have|has|isn't|aren't|don't|doesn't)\b/i;

  function prettify(text) {
    let s = String(text || '').replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();
    if (!s) return '';
    s = s.replace(/\bi\b/g, 'I').replace(/\bi'(m|ll|ve|d)\b/gi, function (m, x) { return "I'" + x.toLowerCase(); });
    s = s.replace(/[A-Za-z]+/g, function (w) {
      const l = w.toLowerCase();
      return (PROPER.has(l) || (CITIES.has(l) && l.length > 2)) ? cap(l) : w;
    });
    s = s.replace(/\b(ok|okay)\b/gi, function (w) { return w.toLowerCase() === 'ok' ? 'OK' : w; });
    s = cap(s);
    if (!/[.!?]["')]?$/.test(s)) s += QUESTION_START.test(s) ? '?' : '.';
    return s;
  }

  /* ------------------------------------------------------------------ *
   * Grammar rules
   *   type 'error' → shown as a correction the learner repeats
   *   type 'style' → shown as an optional "more natural" upgrade
   * Each rule: { id, type, en, ar, apply(sentence, ctx) → sentence }
   * ------------------------------------------------------------------ */
  function rx(re, fn) { return function (s) { return s.replace(re, fn); }; }

  const RULES = [
    {
      id: 'past-with-time', type: 'error',
      en: 'With "yesterday", "last week" or "ago", use the past tense.',
      ar: 'مع yesterday و last week و ago نستخدم الفعل في الماضي: Yesterday I went.',
      apply: function (s) {
        if (!/\b(yesterday|last\s+(night|week|month|year|time|summer|winter|weekend|friday|saturday|sunday)|(\d+|a|an|one|two|three|four|five|six|few|couple of)\s+(days?|weeks?|months?|years?)\s+ago)\b/i.test(s)) return s;
        return s.replace(/\b(I|we|they|he|she)\s+(go|eat|see|take|come|have|buy|fly|visit|work|meet|watch|play|travel|arrive|stay|study|live|get|make|do|say|tell|give|find|leave|feel|pay|sleep|drive|write|speak|call|start|finish|try|lose|forget|book|move)\b/gi,
          function (m, subj, verb, off, str) {
            if (!opensClause(str, off, subj)) return m;
            return subj + ' ' + keepCase(verb, pastForm(verb));
          });
      }
    },
    {
      id: 'missing-to-place', type: 'error',
      en: 'After verbs of movement, put "to" before the place.',
      ar: 'بعد أفعال الحركة مثل fly و go و travel نضع to قبل اسم المكان: flying to London.',
      apply: rx(/\b(fly|flying|flew|go|going|went|travel|travelling|traveling|travelled|traveled|come|coming|came|move|moving|moved|return|returning|returned|drive|driving|drove|head|heading)\s+([A-Za-z][A-Za-z'-]*)/gi,
        function (m, verb, next) {
          if (/^(to|home|back|there|here|abroad|by|with|on|in|at|now|today|tonight|tomorrow|every|a|an|the|for|out|up|down|away|first|economy|business|from|and|or|but|soon|later|again|very|so|too|alone|together|downtown|upstairs|downstairs|inside|outside|over|through|around|into|via|direct|directly|well|fast|slowly|this|that|next|last|I)$/i.test(next)) return m;
          return isPlace(next) ? verb + ' to ' + next : m;
        })
    },
    {
      id: 'present-continuous-plan', type: 'error',
      en: 'For a trip that is happening now or soon, use am/are + -ing.',
      ar: 'للحديث عن رحلة تحدث الآن أو قريباً نستخدم am / are + الفعل مع ing: I am flying to London.',
      apply: function (s, ctx) {
        if (!ctx || ctx.tense !== 'progressive') return s;
        return s.replace(/\b(I|we|they)\s+(fly|go|travel|leave|stay|join|work|start|move|head)\b(?=\s+(?:to|at|in|for|on|with|the|a|tomorrow|today|tonight|next)\b)/gi,
          function (m, subj, verb, off, str) {
            if (!opensClause(str, off, subj)) return m;
            return subj + ' ' + beFor(subj) + ' ' + ingForm(verb);
          });
      }
    },
    {
      id: 'be-plus-base', type: 'error',
      en: 'Don\'t mix am/is/are with a plain verb. Say "I work" or "I am working".',
      ar: 'لا نجمع am / is / are مع الفعل في صيغته الأساسية. قل I work أو I am working.',
      apply: function (s) {
        return s.replace(/\b(I|we|they|you|he|she)(\s+(?:am|are|is)|'m|'re|'s)\s+(work|live|study|stay|want|need|know|have|understand|agree|disagree|go|come|travel|fly)\b(?!ing)/gi,
          function (m, subj, be, verb, off, str) {
            if (!opensClause(str, off, subj)) return m;
            const v = verb.toLowerCase();
            if (/^(go|come|travel|fly)$/.test(v)) return subj + be + ' ' + ingForm(v);
            if (/^(he|she)$/i.test(subj)) return subj + ' ' + thirdPerson(v);
            return subj + ' ' + v;
          });
      }
    },
    {
      id: 'missing-be-ing', type: 'error',
      en: 'Use am / is / are before a verb with -ing.',
      ar: 'قبل الفعل المنتهي بـ ing نحتاج am أو is أو are: I am going.',
      apply: rx(/\b(I|you|we|they|he|she|it)\s+([A-Za-z]{2,}ing)\b/gi, function (m, subj, word, off, str) {
        if (NON_VERB_ING.has(word.toLowerCase()) || !opensClause(str, off, subj)) return m;
        return subj + ' ' + beFor(subj) + ' ' + word;
      })
    },
    {
      id: 'missing-be-adj', type: 'error',
      en: 'English needs am / is / are before words like "tired", "ready" or "from".',
      ar: 'في الإنجليزية لا بد من am أو is أو are قبل الصفة أو from: I am tired / I am from Riyadh.',
      apply: rx(/\b(I|you|we|they|he|she|it)\s+(tired|hungry|thirsty|happy|ready|sure|sorry|fine|busy|late|sick|ill|okay|married|single|lost|free|from|new|cold|hot|allergic|interested|excited|worried|afraid|scared|nervous|available|alone|early|right|wrong|correct|here)\b/gi,
        function (m, subj, word, off, str) {
          if (!opensClause(str, off, subj)) return m;
          if (/^here$/i.test(word) && /^(you|it)$/i.test(subj)) return m;
          return subj + ' ' + beFor(subj) + ' ' + word;
        })
    },
    {
      id: 'dont-verb', type: 'error',
      en: 'Make a verb negative with "don\'t" or "doesn\'t", not just "not".',
      ar: 'لنفي الفعل نستخدم don’t أو doesn’t قبله، وليس not أو no وحدها: I don’t have.',
      apply: rx(/\b(I|you|we|they|he|she|it)\s+(?:not|no)\s+(have|has|know|understand|like|want|need|speak|remember|think|eat|drink|smoke|work|live|mind|care|see|feel)\b/gi,
        function (m, subj, verb) {
          const v = verb.toLowerCase() === 'has' ? 'have' : verb.toLowerCase();
          return subj + (/^(he|she|it)$/i.test(subj) ? " doesn't " : " don't ") + v;
        })
    },
    {
      id: 'doesnt', type: 'error',
      en: 'With he / she / it, use "doesn\'t".',
      ar: 'مع he و she و it نستخدم doesn’t بدلاً من don’t.',
      apply: rx(/\b(he|she|it)\s+(don't|dont|do not)\b/gi, function (m, subj, neg) {
        return subj + (/^do not$/i.test(neg) ? ' does not' : " doesn't");
      })
    },
    {
      id: 'third-person-s', type: 'error',
      en: 'With he / she / it in the present, add -s to the verb.',
      ar: 'في المضارع مع he و she و it نضيف s للفعل: She works / He lives.',
      apply: rx(/\b(he|she|my\s+(?:father|mother|brother|sister|wife|husband|son|daughter|friend|boss|manager|colleague|dad|mom|mum))\s+(work|live|go|like|want|need|have|speak|study|teach|drive|play|watch|know|love|come|get|take|make|say|think|travel|eat|drink|stay|leave|start|finish|help|use)\b/gi,
        function (m, subj, verb, off, str) {
          const before = prevWord(str, off);
          if (before && AUX.has(before)) return m;
          return subj + ' ' + thirdPerson(verb);
        })
    },
    {
      id: 'age', type: 'error',
      en: 'For age, use "be … years old", not "have".',
      ar: 'للتعبير عن العمر نستخدم be وليس have: I am 25 years old.',
      apply: rx(/\b(I|he|she|we|they)\s+(?:have|has)\s+([\w-]+(?:\s+[\w-]+)?)\s+years?(?:\s+old)?\b/gi, function (m, subj, n) {
        if (!/^(\d+|[a-z]+(?:[-\s][a-z]+)?)$/i.test(n) || !(/\d/.test(n) || NUMBERISH.has(n.split(/[-\s]/)[0].toLowerCase()))) return m;
        return subj + ' ' + beFor(subj) + ' ' + n + ' years old';
      })
    },
    {
      id: 'turn-on-off', type: 'error',
      en: 'For lights and devices, say "turn on / turn off", not "open / close".',
      ar: 'مع الأضواء والأجهزة نقول turn on / turn off وليس open / close.',
      apply: rx(/\b(open|opens|opened|opening|close|closes|closed|closing)\s+(the\s+)?(light|lights|tv|television|ac|air conditioner|air conditioning|aircon|radio|fan|heater|wifi|wi-fi|bluetooth)\b/gi,
        function (m, verb, the, obj) {
          const v = verb.toLowerCase();
          const on = /^open/.test(v);
          const suffix = v.replace(/^(open|close)/, '').replace(/^d$/, 'ed');
          const turn = { '': 'turn', s: 'turns', ed: 'turned', ing: 'turning' }[suffix] || 'turn';
          return keepCase(verb, turn) + (on ? ' on ' : ' off ') + (the || '') + obj;
        })
    },
    {
      id: 'present-perfect-since', type: 'error',
      en: 'For something that started in the past and is still true, use "have + past participle".',
      ar: 'لشيء بدأ في الماضي وما زال مستمراً نستخدم have + التصريف الثالث: I have lived here for three years.',
      apply: rx(/\b(I|we|they|you|he|she)\s+(live|lives|work|works|study|studies|know|knows|have|has)\b(?=[^.?!]*?\bsince\b)/gi,
        function (m, subj, verb) {
          const PP = { live: 'lived', work: 'worked', study: 'studied', know: 'known', have: 'had' };
          const base = verb.toLowerCase().replace(/^has$/, 'have').replace(/ies$/, 'y').replace(/s$/, '');
          return subj + (/^(he|she)$/i.test(subj) ? ' has ' : ' have ') + PP[base];
        })
    },
    {
      id: 'for-duration', type: 'error',
      en: 'Use "for" with a length of time; "since" needs a starting point.',
      ar: 'مع المدة نستخدم for (for two days)، أما since فتأتي مع نقطة البداية (since Monday).',
      apply: rx(/\bsince\s+((?:\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|a few|few|many|several|a couple of)\s+(?:years?|months?|weeks?|days?|hours?|minutes?))\b/gi,
        function (m, span) { return keepCase(m, 'for') + ' ' + span; })
    },
    {
      id: 'did-base', type: 'error',
      en: 'After "did / didn\'t", use the plain verb.',
      ar: 'بعد did أو didn’t يأتي الفعل في صيغته الأساسية: I didn’t go.',
      apply: rx(/\b(didn't|didnt|did not|did)\s+((?:you|he|she|they|we|I|it)\s+)?(went|saw|ate|took|came|had|made|bought|said|got|knew|thought|told|gave|found|left|felt|paid|slept|flew|drove|wrote|spoke|understood|brought|met|sent|spent|lost|forgot|began|drank|ran|sat|stood|wore|heard|kept|liked|wanted|needed|visited|worked|called|booked|arrived|stayed|traveled|travelled)\b/gi,
        function (m, did, subj, verb) {
          const v = verb.toLowerCase();
          const base = BASE_OF_PAST[v] || v.replace(/ied$/, 'y').replace(/(?:ed|d)$/, function (x) {
            return /(liv|lik|arriv)$/.test(v.slice(0, -x.length)) ? 'e' : '';
          }).replace(/^travell?$/, 'travel');
          return did + ' ' + (subj || '') + base;
        })
    },
    {
      id: 'comparative', type: 'error',
      en: '"Better", "bigger", "cheaper"… already mean "more". Don\'t add "more".',
      ar: 'كلمات مثل better و bigger تعني "أكثر" أصلاً، فلا نضيف more قبلها.',
      apply: function (s) {
        return s.replace(/\bmore\s+good\b/gi, 'better')
          .replace(/\bmore\s+(better|worse|bigger|smaller|easier|cheaper|faster|slower|older|younger|happier|nicer|larger|longer|shorter|higher|lower|harder|closer|stronger|busier|quieter|cleaner)\b/gi, '$1');
      }
    },
    {
      id: 'really-like', type: 'error',
      en: '"Very" can\'t go before a verb. Say "I really like it" or "I like it very much".',
      ar: 'لا نضع very قبل الفعل. قل I really like it أو I like it very much.',
      apply: rx(/\b(I|we|they|you|he|she)\s+very\s+(like|love|enjoy|want|need|liked|loved|enjoyed|wanted|likes|loves|enjoys)\b/gi, '$1 really $2')
    },
    {
      id: 'want-to', type: 'error',
      en: 'After "want", "need" or "would like", put "to" before the next verb.',
      ar: 'بعد want و need و would like نضع to قبل الفعل التالي: I want to go.',
      apply: rx(/\b(want|wants|need|needs|would like|'d like)\s+(go|buy|see|eat|book|check|change|return|exchange|pay|ask|try|take|get|make|order|know|speak|visit|stay|leave|cancel|add|join|learn|work|travel)\b/gi, '$1 to $2')
    },
    {
      id: 'article', type: 'error',
      en: 'Use "an" before a vowel sound and "a" before a consonant sound.',
      ar: 'نستخدم an قبل الكلمة التي تبدأ بصوت متحرك (an aisle seat)، و a قبل الصوت الساكن (a window).',
      apply: function (s) {
        const YU = /^(uni|use|usu|uti|eu|one|once|ufo|ure)/i;
        const SILENT_H = /^(hour|honest|honou?r|heir)/i;
        return s.replace(/\b(a|an)\s+([A-Za-z][\w'-]*)/gi, function (m, art, word) {
          if (/^[A-Z]{2,}$/.test(word)) return m; // acronyms
          const vowelSound = (/^[aeiou]/i.test(word) && !YU.test(word)) || SILENT_H.test(word);
          const want = vowelSound ? 'an' : 'a';
          if (art.toLowerCase() === want) return m;
          if (art === 'a' && /^(lot|few|little|bit|couple)$/i.test(word)) return m;
          return keepCase(art, want) + ' ' + word;
        });
      }
    },
    {
      id: 'illness-a', type: 'error',
      en: 'Common illnesses take "a": "a headache", "a cold", "a sore throat".',
      ar: 'مع كثير من الأمراض نضع a قبلها: I have a headache / a cold / a sore throat.',
      apply: rx(/\b(have|has|had|got|having)\s+(headache|cold|fever|cough|sore throat|toothache|stomachache|stomach ache|backache|temperature|runny nose|rash)\b(?!\s+(?:water|drink|drinks|weather|coffee|juice|food|day|days))/gi,
        function (m, v, ill) { return v + ' a ' + ill; })
    },
    {
      id: 'people-plural', type: 'error',
      en: '"People" is plural: "people are".',
      ar: 'كلمة people جمع، فنقول people are و people were.',
      apply: rx(/\bpeople\s+(is|was|has)\b/gi, function (m, v) {
        return 'people ' + ({ is: 'are', was: 'were', has: 'have' })[v.toLowerCase()];
      })
    },
    {
      id: 'uncountable', type: 'error',
      en: 'This noun is uncountable in English — no "s".',
      ar: 'هذا الاسم غير معدود في الإنجليزية، فلا نضيف له s.',
      apply: rx(/\b(informations|advices|luggages|baggages|furnitures|equipments|homeworks|feedbacks|knowledges|researches)\b/gi,
        function (w) { return w.slice(0, -1); })
    },
    {
      id: 'was-born', type: 'error',
      en: 'Say "I was born" — it is always past tense.',
      ar: 'نقول I was born (وُلِدتُ) بصيغة الماضي دائماً.',
      apply: rx(/\b(I|he|she|we|they)(?:\s+(?:am|is|are)|'m|'s|'re)?\s+born\b/gi, function (m, subj) {
        return subj + (/^(we|they)$/i.test(subj) ? ' were born' : ' was born');
      })
    },
    {
      id: 'no-preposition', type: 'error',
      en: 'This verb doesn\'t need a preposition after it.',
      ar: 'هذا الفعل لا يحتاج حرف جر بعده: discuss the plan / enter the room / reach the hotel.',
      apply: rx(/\b(discuss|discussed|discussing|discusses)\s+about\b|\b(enter|entered|entering|enters|reach|reached|reaching|reaches)\s+to\b|\b(contact|contacted|contacting)\s+with\b/gi,
        function (m, a, b, c) { return a || b || c; })
    },
    {
      id: 'modal-to', type: 'error',
      en: 'After can / will / should, use the verb directly — no "to".',
      ar: 'بعد can و will و should يأتي الفعل مباشرة بدون to: I can go.',
      apply: rx(/\b(can|could|will|would|should|must|might|may)\s+to\s+([a-z]+)/gi, '$1 $2')
    },
    {
      id: 'go-home', type: 'error',
      en: 'Say "go home" — no "to" before "home".',
      ar: 'نقول go home و get home بدون to.',
      apply: rx(/\b(go|goes|going|went|come|comes|coming|came|get|gets|getting|got|return|returning|returned|arrive|arrived|drive|driving)\s+to\s+(?:the\s+)?home\b/gi, '$1 home')
    },
    {
      id: 'married-to', type: 'error',
      en: 'We say "married to" someone.',
      ar: 'نقول married to someone وليس married with.',
      apply: rx(/\bmarried\s+with\b(?!\s+(?:kids|children|a\s+family|\d|one|two|three|four|five)\b)/gi, 'married to')
    },
    {
      id: 'explain-to', type: 'error',
      en: 'Say "explain to me", "tell me", "wait for me", "listen to me".',
      ar: 'نقول explain to me و tell me و wait for me و listen to me.',
      apply: function (s) {
        return s.replace(/\b(explain|explained)\s+(me|him|her|us|them)\b/gi, '$1 to $2')
          .replace(/\b(say|said)\s+(me|him|her|us|them)\b/gi, function (m, v, o) { return keepCase(v, /^said$/i.test(v) ? 'told' : 'tell') + ' ' + o; })
          .replace(/\b(wait|waiting|waited)\s+(me|him|her|us|them)\b/gi, '$1 for $2')
          .replace(/\b(listen|listening|listened)\s+(me|him|her|us|them)\b/gi, '$1 to $2');
      }
    },
    {
      id: 'can-you', type: 'error',
      en: 'Questions with "can" don\'t use "do": "Can you…?"',
      ar: 'في السؤال مع can لا نستخدم do: Can you help me?',
      apply: rx(/\bdo\s+you\s+can\b/gi, function (m) { return keepCase(m, 'can you'); })
    },
    {
      id: 'what-mean', type: 'error',
      en: 'Ask "What does … mean?"',
      ar: 'السؤال الصحيح عن المعنى: What does … mean?',
      apply: rx(/\bwhat\s+(?:is\s+)?means?\s+(.+?)\s*[?.!]?$/i, function (m, x) { return keepCase(m, 'what') + ' does ' + x + ' mean?'; })
    },
    {
      id: 'how-much-does', type: 'error',
      en: 'Questions need "does / do": "How much does it cost?"',
      ar: 'السؤال يحتاج does أو do: How much does it cost?',
      apply: rx(/\bhow\s+much\s+(it|this|that|they|these|those)\s+(?:cost|costs)\b/gi, function (m, x) {
        return keepCase(m, 'how') + ' much ' + (/^(they|these|those)$/i.test(x) ? 'do ' : 'does ') + x + ' cost';
      })
    },
    {
      id: 'plural-noun', type: 'error',
      en: 'After a number bigger than one, the noun is plural.',
      ar: 'بعد الأعداد الأكبر من واحد يأتي الاسم بصيغة الجمع: two bags / three nights.',
      apply: rx(/\b(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|[2-9]|\d{2,})\s+(ticket|bag|night|room|day|week|hour|minute|year|month|coffee|person|child|suitcase|kilo|bed|key|seat|tablet|pill|time|friend|brother|sister|kid|euro|dollar|riyal|dirham|pound)\b(?!-)/gi,
        function (m, n, noun, off, str) {
          const before = prevWord(str, off);
          if (before === 'a' || before === 'an') return m; // "a two day trip"
          return n + ' ' + plural(noun);
        })
    },
    {
      id: 'good-at', type: 'error',
      en: 'For skills, say "good at": "I\'m not very good at English."',
      ar: 'مع المهارات نقول good at: I’m not very good at English.',
      apply: function (s) {
        return s.replace(/\b(I'm|I\s+am)\s+not\s+((?:so|very|too|that)\s+)?good\s+(?:in\s+)?english\b/gi, '$1 not $2good at English')
          .replace(/\bmy\s+english\s+not\b/gi, function (m) { return keepCase(m, 'my') + ' English is not'; });
      }
    },
    {
      id: 'be-back', type: 'error',
      en: 'To promise to return soon, say "I\'ll be back in…".',
      ar: 'للوعد بالعودة قريباً نقول I’ll be back in a minute (سأعود بعد دقيقة).',
      apply: rx(/\bI\s+(?:come|coming|am coming|will come)\s+back\s+(?:in|after)\s+(a|one|two|five|ten|\d+|a few)\s+(minutes?|seconds?|moment|hours?)\b/gi,
        "I'll be back in $1 $2")
    },
    {
      id: 'in-time', type: 'error',
      en: 'For time from now, use "in": "in five minutes".',
      ar: 'للمستقبل نقول in five minutes وليس after — "بعد خمس دقائق" = in five minutes.',
      apply: function (s) {
        if (!/\b(will|'ll|going to|be back|come back|coming|arrive|ready|call you|see you|start|leave)\b/i.test(s)) return s;
        return s.replace(/\bafter\s+((?:a|one|two|three|five|ten|fifteen|twenty|thirty|\d+|a few)\s+(?:minutes?|seconds?|hours?|days?|weeks?|moment))\b/gi,
          function (m, span) { return keepCase(m, 'in') + ' ' + span; });
      }
    },
    {
      id: 'parts-of-day', type: 'error',
      en: 'Say "in the morning / in the evening", but "at night".',
      ar: 'نقول in the morning و in the evening، لكن at night.',
      apply: function (s) {
        return s.replace(/\bat\s+(?:the\s+)?(morning|afternoon|evening)\b/gi, function (m, p) { return keepCase(m, 'in') + ' the ' + p; })
          .replace(/\bin\s+night\b/gi, function (m) { return keepCase(m, 'at') + ' night'; });
      }
    },
    {
      id: 'make-take', type: 'error',
      en: 'English collocations: "make a mistake", "take a photo / a shower / a break".',
      ar: 'تراكيب ثابتة: make a mistake و take a photo / a shower / a break.',
      apply: function (s) {
        const MAKE = { do: 'make', does: 'makes', did: 'made', doing: 'making' };
        const TAKE = { make: 'take', makes: 'takes', made: 'took', making: 'taking', do: 'take', does: 'takes', did: 'took', doing: 'taking' };
        return s.replace(/\b(do|does|did|doing)\s+(a\s+|the\s+|many\s+|some\s+)?(mistakes?|decision)\b/gi,
          function (m, v, mid, n) { return keepCase(v, MAKE[v.toLowerCase()]) + ' ' + (mid || '') + n; })
          .replace(/\b(make|makes|made|making|do|does|did|doing)\s+(a\s+|some\s+)?(photo|photos|picture|pictures|selfie|shower|nap|break)\b/gi,
            function (m, v, mid, n) { return keepCase(v, TAKE[v.toLowerCase()]) + ' ' + (mid || '') + n; });
      }
    },
    {
      id: 'arrive-in-at', type: 'error',
      en: 'Say "arrive in" a city or country and "arrive at" a building.',
      ar: 'نقول arrive in مع المدن والدول، و arrive at مع الأماكن المحددة، وليس arrive to.',
      apply: rx(/\b(arrive|arrived|arrives|arriving)\s+to\s+(the\s+)?([A-Za-z]+)/gi, function (m, v, the, place) {
        return v + (!the && isPlace(place) ? ' in ' : ' at ') + (the || '') + place;
      })
    },

    /* ---- Style upgrades (the sentence is fine, this sounds better) ---- */
    {
      id: 'get-by', type: 'style',
      en: '"Can I pass?" is understandable, but people usually say "Could I get by, please?"',
      ar: 'جملة Can I pass مفهومة، لكن الناس يقولون عادةً: Could I get by, please?',
      apply: rx(/^(?:(?:excuse me|sorry)[,\s]*)?(?:can|could|may)\s+I\s+pass(?:\s+please)?\s*[?.!]?$/i, 'Excuse me, could I get by, please?')
    },
    {
      id: 'polite-give', type: 'style', politeOnly: true,
      en: '"Give me…" can sound a little direct. "Could I have…, please?" is friendlier.',
      ar: 'عبارة Give me قد تبدو حادّة قليلاً. الأكثر لباقة: Could I have…, please?',
      apply: rx(/^(?:please\s+)?give\s+me\s+(.+?)(?:,?\s+please)?\s*[.!?]?$/i, 'Could I have $1, please?')
    },
    {
      id: 'polite-want', type: 'style', politeOnly: true,
      en: '"I want…" is very direct with staff. "I\'d like…" sounds more polite.',
      ar: 'عبارة I want مباشرة جداً مع الموظفين. قل I’d like… لتبدو أكثر لباقة.',
      apply: function (s) {
        return s.replace(/^I\s+want\s+to\s+(.+?)\s*[.!]?$/i, "I'd like to $1.")
          .replace(/^I\s+want\s+(?!to\b)(.+?)(?:,?\s+please)?\s*[.!]?$/i, "I'd like $1, please.");
      }
    },
    {
      id: 'add-please', type: 'style', politeOnly: true,
      en: 'Adding "please" makes a request sound warmer.',
      ar: 'إضافة please تجعل طلبك ألطف.',
      apply: function (s) {
        if (/\bplease\b/i.test(s) || !/^(can|could|may)\s+(I|you|we)\b/i.test(s)) return s;
        return s.replace(/\s*\?$/, ', please?');
      }
    }
  ];

  /* ------------------------------------------------------------------ *
   * Canonical tokens (for comparing what was said with a target)
   * ------------------------------------------------------------------ */
  const CONTRACTIONS = [
    [/\bcan't\b/g, 'can not'], [/\bcannot\b/g, 'can not'], [/\bwon't\b/g, 'will not'], [/\bshan't\b/g, 'shall not'],
    [/\bi'm\b/g, 'i am'], [/\b(you|we|they)'re\b/g, '$1 are'], [/\b(he|she|it|that|there|what|where|here|who|how)'s\b/g, '$1 is'],
    [/\blet's\b/g, 'let us'], [/\b(\w+)'ll\b/g, '$1 will'], [/\b(\w+)'ve\b/g, '$1 have'], [/\b(\w+)'d\b/g, '$1 would'],
    [/\b(\w+)n't\b/g, '$1 not'], [/\bgonna\b/g, 'going to'], [/\bwanna\b/g, 'want to'], [/\bokay\b/g, 'ok']
  ];

  function numToWords(n) {
    n = parseInt(n, 10);
    if (isNaN(n) || n < 0 || n > 9999) return String(n);
    if (n < 20) return NUM_WORDS[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + NUM_WORDS[n % 10] : '');
    if (n < 1000) return NUM_WORDS[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + numToWords(n % 100) : '');
    return numToWords(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + numToWords(n % 1000) : '');
  }

  function canonTokens(text) {
    let s = String(text || '').toLowerCase().replace(/[‘’]/g, "'");
    s = s.replace(/(\d+):(\d+)/g, ' $1 $2 ').replace(/(\d+)(st|nd|rd|th)\b/g, '$1');
    CONTRACTIONS.forEach(function (c) { s = s.replace(c[0], c[1]); });
    s = s.replace(/-/g, ' ').replace(/[^a-z0-9' ]+/g, ' ').replace(/'/g, '');
    s = s.replace(/\d+/g, function (d) { return ' ' + numToWords(d) + ' '; });
    return s.split(/\s+/).filter(Boolean);
  }

  const HOMOPHONES = [['to', 'too', 'two'], ['for', 'four'], ['right', 'write'], ['by', 'buy', 'bye'],
    ['hear', 'here'], ['new', 'knew'], ['no', 'know'], ['one', 'won'], ['eight', 'ate'], ['their', 'there'],
    ['i', 'eye'], ['ok', 'okay'], ['wear', 'where'], ['week', 'weak'], ['meet', 'meat'], ['flu', 'flew']];
  const HOMO = {};
  HOMOPHONES.forEach(function (g, i) { g.forEach(function (w) { HOMO[w] = i; }); });

  function editDistance(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (Math.abs(m - n) > 2) return 3;
    let prev = new Array(n + 1), cur = new Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;
    for (let i = 1; i <= m; i++) {
      cur[0] = i;
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      const t = prev; prev = cur; cur = t;
    }
    return prev[n];
  }
  function sameWord(a, b) {
    if (a === b) return true;
    if (HOMO[a] !== undefined && HOMO[a] === HOMO[b]) return true;
    const len = Math.min(a.length, b.length);
    if (len >= 7) return editDistance(a, b) <= 2;
    if (len >= 4) return editDistance(a, b) <= 1;
    return false;
  }

  /** LCS alignment. Returns matched index pairs [ai, bi]. */
  function align(a, b, eq) {
    eq = eq || function (x, y) { return x === y; };
    const m = a.length, n = b.length;
    const dp = [];
    for (let i = 0; i <= m; i++) dp.push(new Array(n + 1).fill(0));
    for (let i = m - 1; i >= 0; i--) {
      for (let j = n - 1; j >= 0; j--) {
        dp[i][j] = eq(a[i], b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const pairs = [];
    let i = 0, j = 0;
    while (i < m && j < n) {
      if (eq(a[i], b[j])) { pairs.push([i, j]); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
      else j++;
    }
    return pairs;
  }

  /** Word diff for display: [{type:'same'|'del'|'ins', text}] */
  function diffWords(fromText, toText) {
    const a = fromText.split(/\s+/).filter(Boolean), b = toText.split(/\s+/).filter(Boolean);
    const key = function (w) { return w.toLowerCase().replace(/[^a-z0-9']/g, ''); };
    const pairs = align(a.map(key), b.map(key));
    const ops = [];
    let i = 0, j = 0;
    pairs.concat([[a.length, b.length]]).forEach(function (p) {
      while (i < p[0]) ops.push({ type: 'del', text: a[i++] });
      while (j < p[1]) ops.push({ type: 'ins', text: b[j++] });
      if (p[0] < a.length) { ops.push({ type: 'same', text: b[j], from: a[i] }); i++; j++; }
    });
    return ops;
  }

  /* ------------------------------------------------------------------ *
   * Public API
   * ------------------------------------------------------------------ */

  /**
   * Analyse a learner sentence.
   * ctx: { tense:'progressive'|undefined, register:'polite'|undefined }
   * → { said, corrected, issues:[rule], better:{text, en, ar}|null, ok }
   */
  function analyze(text, ctx) {
    ctx = ctx || {};
    const said = prettify(text);
    let current = said;
    const issues = [];
    RULES.forEach(function (rule) {
      if (rule.type !== 'error') return;
      const next = rule.apply(current, ctx);
      if (next !== current) { issues.push(rule); current = next; }
    });
    const corrected = issues.length ? prettify(current) : said;

    let better = null;
    for (let k = 0; k < RULES.length; k++) {
      const rule = RULES[k];
      if (rule.type !== 'style' || (rule.politeOnly && ctx.register !== 'polite')) continue;
      const next = rule.apply(corrected, ctx);
      if (next !== corrected) { better = { text: prettify(next), en: rule.en, ar: rule.ar, id: rule.id }; break; }
    }
    return { said: said, corrected: corrected, issues: issues, better: better, ok: issues.length === 0 };
  }

  /** Canonical tokens of `target` that were added/changed relative to `from`. */
  function focusTokens(from, target) {
    const a = canonTokens(from), b = canonTokens(target);
    const matched = new Set(align(a, b).map(function (p) { return p[1]; }));
    const out = [];
    b.forEach(function (w, i) { if (!matched.has(i)) out.push(i); });
    return out;
  }

  /**
   * Did the learner say `target`? Tries every recognition alternative.
   * focus: indices into canonTokens(target) that MUST be present.
   * → { pass, score, heard, missing:[word] }
   */
  function judge(candidates, target, focus) {
    const t = canonTokens(target);
    let best = null;
    (candidates && candidates.length ? candidates : ['']).forEach(function (cand) {
      const s = canonTokens(cand);
      const pairs = align(t, s, sameWord);
      const hit = new Set(pairs.map(function (p) { return p[0]; }));
      const recall = t.length ? pairs.length / t.length : 0;
      const precision = s.length ? pairs.length / s.length : 0;
      const score = 0.75 * recall + 0.25 * precision;
      const focusOk = (focus || []).every(function (i) { return hit.has(i); });
      const missing = t.filter(function (w, i) { return !hit.has(i); });
      const pass = focusOk && score >= (t.length <= 4 ? 0.74 : 0.78);
      const r = { pass: pass, score: score, heard: cand, missing: missing, focusOk: focusOk };
      if (!best || (r.pass && !best.pass) || (r.pass === best.pass && r.focusOk && !best.focusOk) ||
          (r.pass === best.pass && r.focusOk === best.focusOk && r.score > best.score)) best = r;
    });
    return best;
  }

  const YES = /\b(yes|yeah|yep|yup|sure|of course|please|ok|absolutely|definitely|certainly|i would|i do|i did|i have|that is right|that is correct|correct|right|exactly|i would love|why not|go ahead)\b/;
  const NO = /\b(no|nope|nah|not really|no thanks|no thank you|i do not|i did not|i have not|never|nothing)\b/;
  function polarity(text) {
    const s = ' ' + canonTokens(text).join(' ') + ' ';
    const y = s.search(YES), n = s.search(NO);
    if (y < 0 && n < 0) return null;
    if (y < 0) return 'no';
    if (n < 0) return 'yes';
    return n < y ? 'no' : 'yes';
  }

  /** Does the answer plausibly respond to the turn? (forgiving on purpose) */
  function relevant(text, turn) {
    const toks = canonTokens(text);
    if (!toks.length) return false;
    const minWords = turn.minWords || 0;
    if (minWords && toks.length >= minWords) return true;
    const keys = turn.keys;
    if (!keys || !keys.length) return toks.length >= Math.max(2, minWords || 2);
    const joined = ' ' + toks.join(' ') + ' ';
    const raw = String(text);
    for (let k = 0; k < keys.length; k++) {
      const key = keys[k];
      if (key === '#yesno') { if (polarity(text)) return true; continue; }
      if (key === '#num') { if (toks.some(function (w) { return NUMBERISH.has(w) && !/^(a|an|just|only)$/.test(w); })) return true; continue; }
      if (key === '#place') {
        if (toks.some(function (w) { return CITIES.has(w); })) return true;
        if (/\s[A-Z][a-z]{2,}/.test(' ' + raw.split(/\s+/).slice(1).join(' '))) return true;
        continue;
      }
      if (key.indexOf(' ') > -1) { if (joined.indexOf(' ' + key + ' ') > -1) return true; continue; }
      if (toks.some(function (w) { return w === key || (key.length >= 4 && w.indexOf(key) === 0); })) return true;
    }
    return toks.length >= 4;
  }

  /** Learner asking for the line again ("sorry?", "can you repeat?") */
  function isRepeatRequest(text) {
    const s = canonTokens(text).join(' ');
    if (!s || s.split(' ').length > 8) return false;
    return /\b(repeat|say (that|it) again|again please|sorry what|pardon|what did you say|did not (understand|catch|hear)|slower|slowly|come again)\b/.test(s) ||
      /^(sorry|what|pardon|excuse me)$/.test(s);
  }

  /** Learner freezing ("I don't know", "um", "help") */
  function isStuck(text) {
    const s = canonTokens(text).join(' ');
    return /^(um+|uh+|hmm+|er+|help|i do not know|i don't know|i am not sure|no idea|what should i say|how do i say)$/.test(s) ||
      /^(i do not know what to say|i do not know how to say)/.test(s);
  }

  root.LisanCoach = {
    analyze: analyze,
    prettify: prettify,
    judge: judge,
    focusTokens: focusTokens,
    diffWords: diffWords,
    canonTokens: canonTokens,
    polarity: polarity,
    relevant: relevant,
    isRepeatRequest: isRepeatRequest,
    isStuck: isStuck,
    rules: RULES,
    _internals: { ingForm: ingForm, thirdPerson: thirdPerson, pastForm: pastForm, plural: plural }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.LisanCoach;
})(typeof window !== 'undefined' ? window : globalThis);
