/* ==========================================================================
   Lisan · content-study.js — Study & exams path (all 5 units)
   IELTS units use style:'exam': in live mode the AI behaves like a neutral
   examiner (no teaching during the test), and the report estimates a band.
   Field reference: see the header of js/scenarios.js.
   ========================================================================== */
(function (root) {
  'use strict';
  root.LisanContent.addScenarios([
    /* ------------------------------------------------------------ */
    {
      id: 'admissions', category: 'study', level: 'Intermediate', minutes: 4, icon: 'cap', tint: '#6B4FC8',
      register: 'polite',
      title: 'The international student office', titleAr: 'مكتب الطلاب الدوليين',
      place: 'Northfield University · International office',
      persona: { name: 'Megan', role: 'Student adviser', roleAr: 'مستشارة الطلاب', gender: 'female' },
      goal: { en: 'I can sort out my registration and housing as a new international student.', ar: 'أستطيع إنهاء تسجيلي وسكني كطالب دولي جديد.' },
      mission: {
        en: 'You’ve just arrived to start your master’s. Show your documents, ask about student housing and find out what to do next.',
        ar: 'وصلت للتو لبدء الماجستير. قدّم وثائقك، واسأل عن السكن الطلابي، واعرف ما الخطوة التالية.'
      },
      vocab: [
        { en: "master's degree", ar: 'ماجستير' }, { en: 'transcript', ar: 'كشف الدرجات' }, { en: 'accommodation', ar: 'سكن' },
        { en: 'on campus', ar: 'داخل الحرم الجامعي' }, { en: 'including bills', ar: 'شامل الفواتير' }, { en: 'orientation week', ar: 'أسبوع التعريف' }
      ],
      tip: {
        en: 'British universities say "accommodation" and "flat"; American ones say "housing" and "apartment".',
        ar: 'الجامعات البريطانية تقول accommodation و flat، والأمريكية housing و apartment.'
      },
      turns: [
        {
          ai: { en: 'Hello! Welcome to the international office. How can I help you?', ar: 'مرحباً! أهلاً بك في مكتب الطلاب الدوليين. كيف يمكنني مساعدتك؟' },
          keys: ['new', 'student', 'start', 'starting', 'master', 'masters', 'degree', 'registration', 'register', 'documents'],
          tense: 'progressive',
          hint: { ar: 'عرّف بنفسك كطالب جديد واذكر برنامجك.', starter: "Hi, I'm a new student from …" },
          model: { en: "Hi, I'm a new student from Saudi Arabia. I'm starting my master's in September.", ar: 'مرحباً، أنا طالب جديد من السعودية. سأبدأ الماجستير في سبتمبر.' },
          also: { en: 'Hi. I have some questions about registration.', ar: 'مرحباً. لديّ بعض الأسئلة عن التسجيل.' }
        },
        {
          ai: { en: 'Welcome! Which documents have you brought with you?', ar: 'أهلاً بك! ما الوثائق التي أحضرتها معك؟' },
          keys: ['passport', 'visa', 'certificate', 'degree', 'transcript', 'letter', 'scholarship', 'brought'],
          hint: { ar: 'عدّد الوثائق: I\'ve brought my…', starter: "I've brought my …" },
          model: { en: "I've brought my passport, my visa and my degree certificate.", ar: 'أحضرت جواز سفري وتأشيرتي وشهادة البكالوريوس.' },
          also: { en: 'I have my passport and my scholarship letter, but I forgot my transcript.', ar: 'معي جوازي وخطاب الابتعاث، لكنني نسيت كشف الدرجات.' }
        },
        {
          ai: { en: 'Perfect. Have you arranged your accommodation yet?', ar: 'ممتاز. هل رتّبت سكنك بالفعل؟' },
          keys: ['#yesno', 'accommodation', 'housing', 'room', 'flat', 'apartment', 'campus', 'residence', 'yet', 'rented'],
          hint: { ar: 'إن لم ترتّب السكن اسأل عن السكن الجامعي.', starter: 'Not yet. Is there any …' },
          model: { en: 'Not yet. Is there any student housing on campus?', ar: 'ليس بعد. هل يوجد سكن طلابي داخل الحرم الجامعي؟' },
          also: { en: "Yes, I've rented a flat near the city centre.", ar: 'نعم، استأجرت شقة قرب وسط المدينة.' }
        },
        {
          ai: { en: "Yes, there are some rooms left in North Hall. They're single rooms with a shared kitchen. Would you like to apply?", ar: 'نعم، بقيت بعض الغرف في سكن نورث هول. إنها غرف فردية بمطبخ مشترك. هل تودّ التقديم؟' },
          keys: ['#yesno', 'apply', 'how', 'much', 'cost', 'price', 'rent', 'month', 'private', 'bathroom'],
          hint: { ar: 'وافق واسأل عن السعر.', starter: 'Yes, please. How much is …' },
          model: { en: 'Yes, please. How much is the rent per month?', ar: 'نعم، من فضلك. كم الإيجار الشهري؟' },
          also: { en: 'Is there a room with a private bathroom?', ar: 'هل توجد غرفة بحمّام خاص؟' }
        },
        {
          ai: { en: "It's six hundred pounds a month, including bills. Orientation week starts on the fifteenth. Do you have any other questions?", ar: 'ستمئة جنيه شهرياً، شاملة الفواتير. وأسبوع التعريف يبدأ يوم الخامس عشر. هل لديك أسئلة أخرى؟' },
          keys: ['#yesno', 'bank', 'account', 'open', 'orientation', 'attend', 'sim', 'doctor', 'register', 'where', 'thank'],
          hint: { ar: 'اسأل عن أمر عملي: حساب بنكي أو التسجيل عند طبيب.', starter: 'Yes. How can I open …' },
          model: { en: 'Yes. How can I open a bank account here?', ar: 'نعم. كيف يمكنني فتح حساب بنكي هنا؟' },
          also: { en: "No, that's very helpful. Thank you.", ar: 'لا، كان هذا مفيداً جداً. شكراً.' }
        }
      ],
      outro: { en: "We'll give you a letter for the bank today. Welcome to Northfield, and good luck with your studies!", ar: 'سنعطيك خطاباً للبنك اليوم. أهلاً بك في نورثفيلد، وبالتوفيق في دراستك!' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'professor', category: 'study', level: 'Intermediate', minutes: 4, icon: 'book', tint: '#7A45B5',
      register: 'polite',
      title: 'Talking to your professor', titleAr: 'التحدث مع أستاذك',
      place: 'Office hours · Professor’s office',
      persona: { name: 'Professor Hughes', role: 'Your lecturer', roleAr: 'أستاذك الجامعي', gender: 'male' },
      goal: { en: 'I can ask a professor to clarify an assignment and request an extension.', ar: 'أستطيع أن أطلب من أستاذي توضيح الواجب وتمديد موعد التسليم.' },
      mission: {
        en: 'Go to office hours, ask what the essay requires, and politely request a one-week extension.',
        ar: 'اذهب في الساعات المكتبية، واسأل عن متطلبات المقال، واطلب بأدب تمديداً لأسبوع.'
      },
      vocab: [
        { en: 'assignment', ar: 'واجب' }, { en: 'sources', ar: 'مصادر' }, { en: 'references', ar: 'مراجع' },
        { en: 'extension', ar: 'تمديد' }, { en: 'deadline', ar: 'موعد التسليم' }, { en: 'medical note', ar: 'تقرير طبي' }
      ],
      tip: {
        en: '"Would it be possible to…?" is a formal, polite way to ask a professor for something.',
        ar: 'عبارة Would it be possible to…? طريقة رسمية ومهذبة لطلب شيء من الأستاذ.'
      },
      turns: [
        {
          ai: { en: "Come in! You're in my Tuesday seminar, aren't you? What can I do for you?", ar: 'تفضّل! أنت في حلقة النقاش يوم الثلاثاء، أليس كذلك؟ ماذا يمكنني أن أفعل لك؟' },
          keys: ['#yesno', 'assignment', 'essay', 'question', 'ask', 'understand', 'explain', 'about'],
          hint: { ar: 'أكّد وقل إن لديك سؤالاً عن المقال.', starter: "Yes, that's right. I have a question about …" },
          model: { en: "Yes, that's right. I have a question about the essay.", ar: 'نعم، صحيح. لدي سؤال عن المقال.' },
          also: { en: "Yes. I'm not sure I understand the assignment.", ar: 'نعم. لست متأكداً أنني فهمت الواجب.' }
        },
        {
          ai: { en: 'Of course. Which part is unclear?', ar: 'بالتأكيد. أي جزء غير واضح؟' },
          keys: ['sources', 'references', 'words', 'length', 'topic', 'question', 'part', 'format', 'how many', 'mean'], minWords: 5,
          hint: { ar: 'اسأل عن عدد المصادر أو عن معنى السؤال.', starter: "I'm not sure how many …" },
          model: { en: "I'm not sure how many sources we need to use.", ar: 'لست متأكداً كم مصدراً يجب أن نستخدم.' },
          also: { en: 'What do you mean by "critically discuss" in the question?', ar: 'ماذا تقصد بعبارة "ناقش بشكل نقدي" في السؤال؟' }
        },
        {
          ai: { en: 'Good question. At least eight academic sources, and please use the Harvard style for references. Anything else?', ar: 'سؤال جيد. ثمانية مصادر أكاديمية على الأقل، واستخدم نظام هارفارد للمراجع من فضلك. هل هناك شيء آخر؟' },
          keys: ['#yesno', 'extension', 'deadline', 'more', 'time', 'possible', 'extra', 'later'],
          hint: { ar: 'اطلب تمديداً بأدب: Would it be possible to…?', starter: 'Actually, yes. Would it be possible to …' },
          model: { en: 'Actually, yes. Would it be possible to get a short extension?', ar: 'في الحقيقة نعم. هل من الممكن الحصول على تمديد قصير؟' },
          also: { en: "No, that's clear now, thank you.", ar: 'لا، الأمر واضح الآن، شكراً.' }
        },
        {
          ai: { en: "Hmm. What's the reason?", ar: 'همم. ما السبب؟' },
          keys: ['sick', 'ill', 'family', 'because', 'emergency', 'hospital', 'missed', 'week', 'note'], minWords: 6,
          hint: { ar: 'اذكر سبباً واضحاً ودليلاً إن وجد.', starter: 'I was sick last week and …' },
          model: { en: 'I was sick last week and missed two classes. I have a medical note.', ar: 'كنت مريضاً الأسبوع الماضي وفاتتني محاضرتان. لدي تقرير طبي.' },
          also: { en: 'I had a family emergency and had to travel back home.', ar: 'حدث طارئ عائلي واضطررت للسفر إلى بلدي.' }
        },
        {
          ai: { en: "That's a good reason. I can give you one more week. Will that be enough?", ar: 'هذا سبب وجيه. يمكنني منحك أسبوعاً إضافياً. هل سيكون ذلك كافياً؟' },
          keys: ['#yesno', 'enough', 'perfect', 'thank', 'plenty', 'grateful', 'appreciate'],
          hint: { ar: 'اشكره وأكّد أن المدة كافية.', starter: "Yes, that's plenty. Thank you …" },
          model: { en: "Yes, that's plenty. Thank you so much, I really appreciate it.", ar: 'نعم، هذا كافٍ تماماً. شكراً جزيلاً، أقدّر ذلك حقاً.' },
          also: { en: 'Yes, I think so. Thank you for understanding.', ar: 'نعم، أظن ذلك. شكراً لتفهّمك.' }
        }
      ],
      outro: { en: "You're welcome. Email me the medical note so I can update the system. Good luck with the essay!", ar: 'على الرحب. أرسل لي التقرير الطبي بالبريد لأحدّث النظام. بالتوفيق في المقال!' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'ielts-1', category: 'study', level: 'Intermediate', minutes: 5, icon: 'pen', tint: '#5B3FA0', style: 'exam',
      title: 'IELTS Speaking · Part 1', titleAr: 'اختبار آيلتس للمحادثة · الجزء الأول',
      place: 'Exam room · IELTS Speaking, Part 1',
      persona: { name: 'Andrew', role: 'IELTS examiner', roleAr: 'ممتحن آيلتس', gender: 'male' },
      goal: { en: 'I can answer personal questions with full, extended answers.', ar: 'أستطيع الإجابة عن الأسئلة الشخصية بإجابات كاملة وموسّعة.' },
      mission: {
        en: 'Answer familiar questions about yourself in two or three sentences each: answer, reason, example. Avoid one-word answers.',
        ar: 'أجب عن أسئلة مألوفة عن نفسك بجملتين أو ثلاث لكل سؤال: إجابة، سبب، مثال. تجنّب الإجابات بكلمة واحدة.'
      },
      vocab: [
        { en: 'neighbourhood', ar: 'حيّ' }, { en: 'quite', ar: 'نوعاً ما' }, { en: "I'd love to", ar: 'أودّ كثيراً أن' },
        { en: 'usually', ar: 'عادةً' }, { en: 'spend time', ar: 'يقضي الوقت' }, { en: 'coral reefs', ar: 'الشعاب المرجانية' }
      ],
      tip: {
        en: 'In Part 1, give two or three sentences: answer, reason, example. One-word answers lower your fluency score.',
        ar: 'في الجزء الأول أعطِ جملتين أو ثلاثاً: إجابة، سبب، مثال. الإجابات القصيرة جداً تخفض درجة الطلاقة.'
      },
      turns: [
        {
          ai: { en: 'Good morning. My name is Andrew. Can you tell me your full name, please?', ar: 'صباح الخير. اسمي أندرو. هل يمكنك أن تخبرني باسمك الكامل؟' },
          keys: ['name', 'it is', 'i am', 'called', 'morning'], minWords: 3,
          hint: { ar: 'قل اسمك الكامل بجملة كاملة.', starter: 'Good morning. My full name is …' },
          model: { en: 'Good morning. My full name is Abdullah Al-Qahtani.', ar: 'صباح الخير. اسمي الكامل عبدالله القحطاني.' }
        },
        {
          ai: { en: "Thank you. Let's talk about where you live. Do you live in a house or an apartment?", ar: 'شكراً. لنتحدث عن المكان الذي تعيش فيه. هل تسكن في منزل أم شقة؟' },
          keys: ['house', 'apartment', 'flat', 'villa', 'live', 'family'], minWords: 6,
          hint: { ar: 'أجب بجملتين أو ثلاث: أين، مع من، ووصف قصير.', starter: 'I live in a … with my family in …' },
          model: { en: "I live in a villa with my family in the north of Riyadh. It's quite big, and it has a small garden.", ar: 'أعيش في فيلا مع عائلتي في شمال الرياض. إنها كبيرة نوعاً ما، ولها حديقة صغيرة.' }
        },
        {
          ai: { en: 'What do you like most about your neighbourhood?', ar: 'ما أكثر ما يعجبك في حيّك؟' },
          keys: ['like', 'quiet', 'close', 'near', 'parks', 'park', 'shops', 'neighbours', 'friendly', 'safe', 'because'], minWords: 7,
          hint: { ar: 'اذكر ما يعجبك ولماذا، مع مثال.', starter: "I like it because it's …" },
          model: { en: "I like it because it's quiet and safe, and there's a big park near my house where I go walking.", ar: 'يعجبني لأنه هادئ وآمن، ويوجد منتزه كبير قرب منزلي أتمشى فيه.' }
        },
        {
          ai: { en: "Now let's talk about free time. What do you usually do at the weekend?", ar: 'لننتقل إلى وقت الفراغ. ماذا تفعل عادةً في عطلة نهاية الأسبوع؟' },
          keys: ['usually', 'weekend', 'family', 'friends', 'play', 'watch', 'visit', 'relax', 'often', 'spend'], minWords: 8,
          hint: { ar: 'استخدم usually و often مع الحاضر البسيط.', starter: 'I usually spend time with …' },
          model: { en: "I usually spend time with my family. On Fridays we have lunch at my grandparents' house, and in the evening I play football with my friends.", ar: 'عادةً أقضي الوقت مع عائلتي. أيام الجمعة نتناول الغداء في بيت جدّي، وفي المساء ألعب كرة القدم مع أصدقائي.' }
        },
        {
          ai: { en: 'Is there a new hobby you would like to try in the future?', ar: 'هل هناك هواية جديدة تودّ تجربتها في المستقبل؟' },
          keys: ['would', 'like', 'try', 'learn', 'diving', 'photography', 'cooking', 'because', 'want', 'hobby'], minWords: 7,
          hint: { ar: 'استخدم I\'d love to + الفعل، ثم السبب.', starter: "Yes, I'd love to learn …, because …" },
          model: { en: "Yes, I'd love to learn diving, because the Red Sea has some of the best coral reefs in the world.", ar: 'نعم، أودّ تعلّم الغوص، لأن البحر الأحمر فيه من أجمل الشعاب المرجانية في العالم.' }
        }
      ],
      outro: { en: "Thank you. That's the end of Part One.", ar: 'شكراً. هذه نهاية الجزء الأول.' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'ielts-2', category: 'study', level: 'Advanced', minutes: 5, icon: 'pen', tint: '#4B3390', style: 'exam',
      title: 'IELTS Speaking · Part 2', titleAr: 'اختبار آيلتس للمحادثة · الجزء الثاني',
      place: 'Exam room · IELTS Speaking, Part 2 (long turn)',
      persona: { name: 'Andrew', role: 'IELTS examiner', roleAr: 'ممتحن آيلتس', gender: 'male' },
      goal: { en: 'I can speak for up to two minutes on a topic, in an organised way.', ar: 'أستطيع التحدث لمدة دقيقتين عن موضوع بشكل منظّم.' },
      mission: {
        en: 'Talk for one to two minutes about a place you loved visiting. Cover every point on the card, then answer two follow-up questions.',
        ar: 'تحدّث من دقيقة إلى دقيقتين عن مكان أحببت زيارته. غطِّ كل نقاط البطاقة، ثم أجب عن سؤالين لاحقين.'
      },
      vocab: [
        { en: "I'd like to talk about", ar: 'أودّ أن أتحدث عن' }, { en: 'ancient', ar: 'قديم' }, { en: 'carved', ar: 'منحوت' },
        { en: 'it felt like', ar: 'شعرت وكأن' }, { en: 'what I liked most', ar: 'أكثر ما أعجبني' }, { en: 'all in all', ar: 'بشكل عام' }
      ],
      tip: {
        en: 'Use the points on the card as your plan, and link them: "First… Then… What I liked most was…".',
        ar: 'استخدم نقاط البطاقة كخطة لكلامك، واربطها: First… Then… What I liked most was…'
      },
      turns: [
        {
          ai: {
            en: "Now I'm going to give you a topic, and I'd like you to talk about it for one to two minutes. Describe a place you visited that you really liked. You should say where it was, when you went, what you did there, and explain why you liked it. You can start when you're ready.",
            ar: 'سأعطيك الآن موضوعاً، وأريدك أن تتحدث عنه من دقيقة إلى دقيقتين. صِف مكاناً زرته وأعجبك كثيراً. اذكر أين كان، ومتى ذهبت، وماذا فعلت هناك، واشرح لماذا أعجبك. يمكنك البدء عندما تكون مستعداً.'
          },
          minWords: 25,
          hint: { ar: 'رتّب كلامك حسب النقاط الأربع: أين، متى، ماذا فعلت، ولماذا.', starter: "I'd like to talk about …" },
          model: {
            en: "I'd like to talk about AlUla, in the north-west of Saudi Arabia. I went there last winter with my cousins. We stayed in a small hotel between the mountains, and we visited Hegra, where there are ancient tombs carved into the rocks. At night we watched the stars in the desert. I really liked it because it felt like travelling back in time, and the silence was amazing.",
            ar: 'أودّ أن أتحدث عن العلا في شمال غرب السعودية. ذهبت إليها الشتاء الماضي مع أبناء عمي. أقمنا في فندق صغير بين الجبال، وزرنا الحِجر حيث توجد مقابر قديمة منحوتة في الصخور. وفي الليل شاهدنا النجوم في الصحراء. أعجبتني كثيراً لأنني شعرت وكأنني عدت بالزمن، وكان الهدوء مذهلاً.'
          }
        },
        {
          ai: { en: 'Thank you. Would you like to go back there one day?', ar: 'شكراً. هل تودّ العودة إلى هناك يوماً ما؟' },
          keys: ['#yesno', 'would', 'love', 'back', 'next', 'again', 'definitely'], minWords: 6,
          hint: { ar: 'أجب وأضف ما الذي ستفعله في المرة القادمة.', starter: "Definitely. Next time I'd like to …" },
          model: { en: "Definitely. Next time I'd like to go in spring and try a hot-air balloon ride.", ar: 'بالتأكيد. في المرة القادمة أودّ الذهاب في الربيع وتجربة رحلة المنطاد.' }
        },
        {
          ai: { en: 'And who would you take with you?', ar: 'ومن ستأخذ معك؟' },
          keys: ['take', 'parents', 'wife', 'family', 'friends', 'brother', 'sister', 'because', 'kids', 'children'], minWords: 6,
          hint: { ar: 'اذكر الشخص والسبب.', starter: "I'd take my …, because …" },
          model: { en: "I'd take my parents, because they've never been there and they love history.", ar: 'سآخذ والديّ، لأنهما لم يزوراها من قبل ويحبان التاريخ.' }
        }
      ],
      outro: { en: "Thank you. That's the end of Part Two.", ar: 'شكراً. هذه نهاية الجزء الثاني.' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'ielts-3', category: 'study', level: 'Advanced', minutes: 5, icon: 'pen', tint: '#3A2878', style: 'exam',
      title: 'IELTS Speaking · Part 3', titleAr: 'اختبار آيلتس للمحادثة · الجزء الثالث',
      place: 'Exam room · IELTS Speaking, Part 3 (discussion)',
      persona: { name: 'Andrew', role: 'IELTS examiner', roleAr: 'ممتحن آيلتس', gender: 'male' },
      goal: { en: 'I can discuss abstract questions with opinions, reasons and examples.', ar: 'أستطيع مناقشة أسئلة عامة بآراء وأسباب وأمثلة.' },
      mission: {
        en: 'Discuss tourism in general: give your opinion, support it with reasons and a real example, and look at both sides.',
        ar: 'ناقش السياحة بشكل عام: أعطِ رأيك، وادعمه بأسباب ومثال حقيقي، وانظر إلى الجانبين.'
      },
      vocab: [
        { en: 'on the one hand', ar: 'من جهة' }, { en: 'on the other hand', ar: 'من جهة أخرى' }, { en: 'heritage', ar: 'تراث' },
        { en: 'in advance', ar: 'مسبقاً' }, { en: 'responsibly', ar: 'بمسؤولية' }, { en: 'it depends', ar: 'يعتمد الأمر' }
      ],
      tip: {
        en: 'Part 3 rewards ideas, not facts. Give an opinion, a reason, and a real example, and it\'s fine to say "it depends".',
        ar: 'الجزء الثالث يكافئ الأفكار لا المعلومات. أعطِ رأياً وسبباً ومثالاً حقيقياً، ولا بأس أن تقول it depends.'
      },
      turns: [
        {
          ai: { en: "Let's talk about tourism in general. Why do you think more people travel today than in the past?", ar: 'لنتحدث عن السياحة بشكل عام. لماذا تظن أن الناس يسافرون اليوم أكثر من الماضي؟' },
          minWords: 12,
          hint: { ar: 'أعطِ رأياً وسببين ومثالاً.', starter: 'I think there are two main reasons. First, …' },
          model: { en: 'I think there are two main reasons. First, flights are much cheaper than before. Second, social media shows people beautiful places, so they want to see them for themselves.', ar: 'أظن أن هناك سببين رئيسيين. أولاً، أصبحت الرحلات أرخص بكثير من قبل. ثانياً، وسائل التواصل تُري الناس أماكن جميلة فيرغبون في رؤيتها بأنفسهم.' }
        },
        {
          ai: { en: 'Is tourism always good for a country?', ar: 'هل السياحة مفيدة دائماً للبلد؟' },
          minWords: 12,
          hint: { ar: 'انظر إلى الجانبين: On the one hand… On the other hand…', starter: 'Not always. On the one hand, …' },
          model: { en: 'Not always. On the one hand, it creates jobs and brings money. On the other hand, too many tourists can damage historical sites and make life more expensive for local people.', ar: 'ليس دائماً. من جهة، توفّر وظائف وتجلب المال. ومن جهة أخرى، قد تضرّ كثرة السياح بالمواقع التاريخية وتجعل الحياة أغلى على السكان المحليين.' }
        },
        {
          ai: { en: 'How can countries protect their heritage sites while still welcoming visitors?', ar: 'كيف يمكن للدول حماية مواقعها التراثية مع الاستمرار في استقبال الزوار؟' },
          minWords: 12,
          hint: { ar: 'اقترح حلاً وأعطِ مثالاً حقيقياً.', starter: 'One way is to … For example, …' },
          model: { en: 'One way is to limit the number of visitors each day. For example, in AlUla you have to book tickets in advance, which stops the sites from getting too crowded.', ar: 'إحدى الطرق هي تحديد عدد الزوار يومياً. مثلاً، في العلا يجب حجز التذاكر مسبقاً، مما يمنع ازدحام المواقع.' }
        },
        {
          ai: { en: 'How do you think tourism will change in the next twenty years?', ar: 'كيف تظن أن السياحة ستتغير خلال العشرين سنة القادمة؟' },
          minWords: 12,
          hint: { ar: 'تحدّث عن المستقبل: I think… will… / Maybe…', starter: 'I think people will …' },
          model: { en: 'I think people will travel more responsibly. Maybe virtual reality will even let people visit fragile places without actually going there.', ar: 'أظن أن الناس سيسافرون بمسؤولية أكبر. وربما يتيح الواقع الافتراضي زيارة الأماكن الهشّة دون الذهاب إليها فعلاً.' }
        }
      ],
      outro: { en: "Thank you. That's the end of the speaking test.", ar: 'شكراً. هذه نهاية اختبار المحادثة.' }
    }
  ]);
})(typeof window !== 'undefined' ? window : globalThis);
