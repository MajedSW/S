/* ==========================================================================
   Lisan · content-work.js — Work path, units 2-4, 6-7
   Field reference: see the header of js/scenarios.js.
   ========================================================================== */
(function (root) {
  'use strict';
  root.LisanContent.addScenarios([
    /* ------------------------------------------------------------ */
    {
      id: 'smalltalk', category: 'work', level: 'Intermediate', minutes: 4, icon: 'chat', tint: '#4E5BC8',
      title: 'Small talk before a meeting', titleAr: 'دردشة قبل الاجتماع',
      place: 'Dubai office · Five minutes before the meeting',
      persona: { name: 'Tom', role: 'Project partner', roleAr: 'شريك في المشروع', gender: 'male' },
      goal: { en: 'I can make relaxed small talk before a meeting.', ar: 'أستطيع الدردشة بارتياح قبل الاجتماع.' },
      mission: {
        en: 'You meet a partner from another company in person for the first time. Chat about the trip, the city and the weekend.',
        ar: 'تلتقي شريكاً من شركة أخرى وجهاً لوجه لأول مرة. تحدّث عن الرحلة والمدينة وعطلة الأسبوع.'
      },
      vocab: [
        { en: 'in person', ar: 'وجهاً لوجه' }, { en: 'heavy traffic', ar: 'زحمة شديدة' }, { en: 'made it on time', ar: 'وصلت في الوقت' },
        { en: 'I know what you mean', ar: 'أفهم ما تقصد' }, { en: 'keep in mind', ar: 'يضع في الحسبان' }, { en: 'get started', ar: 'نبدأ' }
      ],
      tip: {
        en: 'Small talk is short and positive: answer, add one detail, and ask something back.',
        ar: 'الدردشة الخفيفة قصيرة وإيجابية: أجب، وأضف تفصيلة، واسأل سؤالاً بالمقابل.'
      },
      turns: [
        {
          ai: { en: 'Hi! Good to finally meet you in person. How was your trip here?', ar: 'مرحباً! سعيد بلقائك أخيراً وجهاً لوجه. كيف كانت رحلتك إلى هنا؟' },
          keys: ['good', 'fine', 'long', 'traffic', 'smooth', 'easy', 'flight', 'drive', 'trip', 'great', 'bad'],
          hint: { ar: 'أجب بجملة إيجابية وأضف تفصيلة صغيرة.', starter: 'It was good, thanks. The traffic …' },
          model: { en: 'It was good, thanks. The traffic was a bit heavy, but I made it on time.', ar: 'كانت جيدة، شكراً. كانت الزحمة شديدة قليلاً، لكنني وصلت في الوقت.' },
          also: { en: "Not bad at all. It's nice to meet you in person too.", ar: 'ليست سيئة أبداً. سعيد بلقائك وجهاً لوجه أيضاً.' }
        },
        {
          ai: { en: 'Glad to hear it. Is this your first time in Dubai?', ar: 'يسعدني سماع ذلك. هل هذه أول مرة لك في دبي؟' },
          keys: ['#yesno', 'first', 'time', 'before', 'often', 'come', 'been', 'visited'],
          hint: { ar: 'أجب وأضف معلومة: كم مرة تأتي، أو انطباعك.', starter: 'No, I come here …' },
          model: { en: 'No, I come here quite often for work, but I never have time to explore.', ar: 'لا، آتي إلى هنا كثيراً للعمل، لكن لا يكون لدي وقت للتجوّل أبداً.' },
          also: { en: "Yes, it's my first time, and I'm really impressed.", ar: 'نعم، إنها أول مرة، وأنا معجب جداً.' }
        },
        {
          ai: { en: 'I know what you mean. Did you do anything fun last weekend?', ar: 'أفهم ما تقصد. هل فعلت شيئاً ممتعاً في عطلة الأسبوع الماضي؟' },
          keys: ['#yesno', 'went', 'took', 'family', 'beach', 'desert', 'watched', 'visited', 'relaxed', 'stayed', 'played'],
          hint: { ar: 'تحدّث بالماضي: I went… / I took…', starter: 'Yes, I took my kids to …' },
          model: { en: 'Yes, I took my kids to the desert. We had a barbecue and watched the sunset.', ar: 'نعم، أخذت أطفالي إلى البر. شوينا وشاهدنا الغروب.' },
          also: { en: 'Not really. I stayed at home and relaxed.', ar: 'ليس حقاً. بقيت في البيت وارتحت.' }
        },
        {
          ai: { en: "That sounds lovely. I've never been camping in the desert. Would you recommend it?", ar: 'يبدو ذلك جميلاً. لم أخيّم في الصحراء من قبل. هل تنصح بذلك؟' },
          keys: ['#yesno', 'recommend', 'definitely', 'winter', 'night', 'stars', 'should', 'must', 'try', 'cold', 'hot'],
          hint: { ar: 'انصحه واذكر أفضل وقت: You should go in…', starter: 'Definitely! You should go in …' },
          model: { en: 'Definitely! You should go in winter, when the nights are cool and you can see the stars.', ar: 'بالتأكيد! يجب أن تذهب في الشتاء، حين تكون الليالي باردة ويمكنك رؤية النجوم.' },
          also: { en: 'Yes, but go in winter. Summer is far too hot.', ar: 'نعم، لكن اذهب في الشتاء. الصيف حار جداً.' }
        },
        {
          ai: { en: "I'll keep that in mind. Oh, it looks like everyone's here. Shall we get started?", ar: 'سأتذكر ذلك. يبدو أن الجميع وصلوا. هل نبدأ؟' },
          keys: ['#yesno', 'start', 'started', 'begin', 'ready', 'sure', 'let', 'go'],
          hint: { ar: 'وافق على البدء.', starter: "Sure, let's …" },
          model: { en: "Sure, let's get started.", ar: 'بالتأكيد، لنبدأ.' },
          also: { en: "Yes, I'm ready when you are.", ar: 'نعم، أنا جاهز متى كنت جاهزاً.' }
        }
      ],
      outro: { en: "Great. Thanks for coming, everyone. Let's begin with a quick update.", ar: 'رائع. شكراً لحضوركم جميعاً. لنبدأ بتحديث سريع.' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'standup', category: 'work', level: 'Intermediate', minutes: 4, icon: 'chart', tint: '#3D4FA6',
      title: 'Giving a project update', titleAr: 'تقديم تحديث عن المشروع',
      place: 'Office · Monday team meeting',
      persona: { name: 'Natalie', role: 'Team manager', roleAr: 'مديرة الفريق', gender: 'female' },
      goal: { en: 'I can give a short, clear update in a team meeting.', ar: 'أستطيع تقديم تحديث قصير وواضح في اجتماع الفريق.' },
      mission: {
        en: 'Tell your manager what you finished last week, what you’ll do this week, and one problem you need help with.',
        ar: 'أخبر مديرتك بما أنجزته الأسبوع الماضي، وما ستفعله هذا الأسبوع، ومشكلة واحدة تحتاج فيها مساعدة.'
      },
      vocab: [
        { en: 'update', ar: 'تحديث' }, { en: 'blocker', ar: 'عائق' }, { en: 'on track', ar: 'يسير حسب الخطة' },
        { en: 'budget', ar: 'ميزانية' }, { en: 'by Thursday', ar: 'بحلول الخميس' }, { en: 'follow up', ar: 'يتابع' }
      ],
      tip: {
        en: 'A good update has three parts: done, next, and blockers. Keep each part to one or two sentences.',
        ar: 'التحديث الجيد من ثلاثة أجزاء: ما أُنجز، وما التالي، والعوائق. اجعل كل جزء جملة أو جملتين.'
      },
      turns: [
        {
          ai: { en: "Morning, everyone. Let's go round the table. What did you work on last week?", ar: 'صباح الخير جميعاً. لنبدأ واحداً تلو الآخر. على ماذا عملت الأسبوع الماضي؟' },
          keys: ['worked', 'finished', 'completed', 'report', 'prepared', 'met', 'week', 'project', 'design', 'client'], minWords: 6,
          hint: { ar: 'استخدم الماضي البسيط: I finished… I met…', starter: 'Last week I finished …' },
          model: { en: 'Last week I finished the sales report and met two new clients.', ar: 'الأسبوع الماضي أنهيت تقرير المبيعات والتقيت بعميلين جديدين.' },
          also: { en: 'I worked on the new website design and fixed some bugs.', ar: 'عملت على تصميم الموقع الجديد وأصلحت بعض الأخطاء.' }
        },
        {
          ai: { en: 'Great work. What are you planning to do this week?', ar: 'عمل رائع. ماذا تخطط أن تفعل هذا الأسبوع؟' },
          keys: ['going', 'plan', 'planning', 'will', 'week', 'start', 'prepare', 'finish', 'meet'], minWords: 6,
          hint: { ar: 'للخطط استخدم I\'m going to…', starter: "This week I'm going to …" },
          model: { en: "This week I'm going to prepare the budget and start the new campaign.", ar: 'هذا الأسبوع سأجهّز الميزانية وأبدأ الحملة الجديدة.' },
          also: { en: "I'm planning to finish the presentation by Wednesday.", ar: 'أخطط لإنهاء العرض التقديمي بحلول الأربعاء.' }
        },
        {
          ai: { en: 'Sounds good. Are there any problems or blockers?', ar: 'يبدو جيداً. هل هناك أي مشاكل أو عوائق؟' },
          keys: ['#yesno', 'problem', 'waiting', 'need', 'help', 'data', 'approval', 'delay', 'late', 'track'],
          hint: { ar: 'اذكر مشكلة واحدة وأثرها.', starter: "Yes, I'm still waiting for …" },
          model: { en: "Yes, I'm still waiting for data from the finance team, so I might be late.", ar: 'نعم، ما زلت أنتظر بيانات من فريق المالية، لذا قد أتأخر.' },
          also: { en: 'No, everything is on track.', ar: 'لا، كل شيء يسير حسب الخطة.' }
        },
        {
          ai: { en: 'Okay. Do you want me to speak to the finance team?', ar: 'حسناً. هل تريدني أن أتحدث مع فريق المالية؟' },
          keys: ['#yesno', 'helpful', 'great', 'thanks', 'follow', 'email', 'myself', 'reminder'],
          hint: { ar: 'اقبل المساعدة أو قل إنك ستتابع بنفسك.', starter: 'That would be …' },
          model: { en: 'That would be really helpful, thank you.', ar: 'سيكون ذلك مفيداً جداً، شكراً لك.' },
          also: { en: "Thanks, but I'll send them a reminder first.", ar: 'شكراً، لكنني سأرسل لهم تذكيراً أولاً.' }
        },
        {
          ai: { en: "I'll message them after this meeting. When do you think you can share the budget?", ar: 'سأراسلهم بعد هذا الاجتماع. متى تظن أنك تستطيع مشاركة الميزانية؟' },
          keys: ['by', 'thursday', 'wednesday', 'friday', 'end', 'week', 'tomorrow', 'monday', 'next', 'probably'],
          hint: { ar: 'أعطِ موعداً مع by.', starter: 'I can share it by …' },
          model: { en: 'I can share it by Thursday afternoon.', ar: 'يمكنني مشاركتها بحلول ظهر الخميس.' },
          also: { en: 'Probably by the end of the week.', ar: 'غالباً بحلول نهاية الأسبوع.' }
        }
      ],
      outro: { en: 'Perfect, Thursday it is. Thanks, that was a clear update.', ar: 'ممتاز، اتفقنا على الخميس. شكراً، كان تحديثاً واضحاً.' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'time-off', category: 'work', level: 'Intermediate', minutes: 4, icon: 'calendar', tint: '#5A4FB0',
      register: 'polite',
      title: 'Asking for time off', titleAr: 'طلب إجازة',
      place: 'Office · Manager’s desk',
      persona: { name: 'David', role: 'Line manager', roleAr: 'المدير المباشر', gender: 'male' },
      goal: { en: 'I can ask politely for time off and plan my handover.', ar: 'أستطيع طلب إجازة بأدب وترتيب تسليم العمل.' },
      mission: {
        en: 'Ask your manager for three days off next week, explain why, and show who will cover your work.',
        ar: 'اطلب من مديرك ثلاثة أيام إجازة الأسبوع القادم، واشرح السبب، ووضّح من سيغطي عملك.'
      },
      vocab: [
        { en: 'take … days off', ar: 'يأخذ إجازة … أيام' }, { en: 'I was wondering if…', ar: 'كنت أتساءل إن…' }, { en: 'cover', ar: 'يغطي العمل' },
        { en: 'due', ar: 'مطلوب تسليمه' }, { en: 'handover', ar: 'تسليم العمل' }, { en: 'flexible', ar: 'مرن' }
      ],
      tip: {
        en: '"I was wondering if I could…" is softer than "Can I…?". Use it when you ask a manager for something.',
        ar: 'عبارة I was wondering if I could… ألطف من Can I…؟ استخدمها عند طلب شيء من مديرك.'
      },
      turns: [
        {
          ai: { en: 'Hi, come in. You wanted to talk to me?', ar: 'مرحباً، تفضّل. أردت التحدث معي؟' },
          keys: ['#yesno', 'days', 'off', 'leave', 'holiday', 'vacation', 'ask', 'wondering', 'time'],
          hint: { ar: 'اطلب بأدب: I was wondering if I could…', starter: 'Yes. I was wondering if I could …' },
          model: { en: 'Yes. I was wondering if I could take three days off next week.', ar: 'نعم. كنت أتساءل إن كان بإمكاني أخذ ثلاثة أيام إجازة الأسبوع القادم.' },
          also: { en: "Yes, I'd like to ask for some leave.", ar: 'نعم، أودّ أن أطلب إجازة.' }
        },
        {
          ai: { en: "Next week is busy. What's the reason, if you don't mind me asking?", ar: 'الأسبوع القادم مزدحم. ما السبب، إن لم تمانع سؤالي؟' },
          keys: ['wedding', 'brother', 'sister', 'family', 'sick', 'father', 'mother', 'moving', 'because', 'graduation', 'surgery'],
          hint: { ar: 'اذكر السبب باختصار.', starter: 'My brother is getting …' },
          model: { en: 'My brother is getting married, and the wedding is in Abha.', ar: 'أخي سيتزوج، والزفاف في أبها.' },
          also: { en: 'My father is having surgery, and I want to be with him.', ar: 'والدي سيُجري عملية، وأريد أن أكون معه.' }
        },
        {
          ai: { en: 'I understand. Who can cover your work while you’re away?', ar: 'أفهم. من يمكنه تغطية عملك أثناء غيابك؟' },
          keys: ['cover', 'colleague', 'omar', 'team', 'can', 'handle', 'already', 'spoke', 'spoken', 'finish'],
          hint: { ar: 'قل من سيغطي عملك، أو أنك ستنهي كل شيء.', starter: "I've already spoken to …" },
          model: { en: "I've already spoken to Omar. He can cover my clients.", ar: 'تحدثت مع عمر مسبقاً. يمكنه متابعة عملائي.' },
          also: { en: "I'll make sure everything is finished before I go.", ar: 'سأحرص على إنهاء كل شيء قبل أن أذهب.' }
        },
        {
          ai: { en: "Good. What about the report that's due on Wednesday?", ar: 'جيد. وماذا عن التقرير المطلوب يوم الأربعاء؟' },
          keys: ['finish', 'before', 'monday', 'sunday', 'early', 'send', 'done', 'deadline', 'submit'],
          hint: { ar: 'قدّم حلاً: تنهيه مبكراً أو تطلب موعداً آخر.', starter: "I'll finish it before …" },
          model: { en: "I'll finish it before I leave and send it to you on Monday.", ar: 'سأنهيه قبل أن أغادر وأرسله لك يوم الاثنين.' },
          also: { en: 'Could I submit it the following Sunday instead, please?', ar: 'هل يمكنني تسليمه يوم الأحد الذي يليه بدلاً من ذلك، من فضلك؟' }
        },
        {
          ai: { en: 'That works. Please put the request in the HR system today. Anything else?', ar: 'هذا مناسب. يُرجى تقديم الطلب في نظام الموارد البشرية اليوم. هل هناك شيء آخر؟' },
          keys: ['#yesno', 'thank', 'appreciate', 'will', 'today', 'that'],
          hint: { ar: 'اشكره بأدب.', starter: 'No, that’s all. Thank you, I really …' },
          model: { en: "No, that's all. Thank you, I really appreciate it.", ar: 'لا، هذا كل شيء. شكراً، أقدّر ذلك كثيراً.' },
          also: { en: "I'll do it right now. Thanks for being flexible.", ar: 'سأفعل ذلك الآن. شكراً لمرونتك.' }
        }
      ],
      outro: { en: 'You’re welcome. I hope everything goes well with your family.', ar: 'على الرحب. أتمنى أن يسير كل شيء على ما يرام مع عائلتك.' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'client-call', category: 'work', level: 'Advanced', minutes: 5, icon: 'laptop', tint: '#2F3F8F',
      title: 'Handling an unhappy client', titleAr: 'التعامل مع عميل غير راضٍ',
      place: 'Video call · Client meeting',
      persona: { name: 'Jessica', role: 'Client, marketing director', roleAr: 'عميلة، مديرة تسويق', gender: 'female' },
      goal: { en: 'I can calm an unhappy client: apologise, explain and offer a plan.', ar: 'أستطيع تهدئة عميل غير راضٍ: أعتذر وأشرح وأقدّم خطة.' },
      mission: {
        en: 'Your team delivered late. Acknowledge the problem, explain what happened without excuses, and agree on a new plan.',
        ar: 'تأخر فريقك في التسليم. اعترف بالمشكلة، واشرح ما حدث دون أعذار، واتفق على خطة جديدة.'
      },
      vocab: [
        { en: 'disappointed', ar: 'محبَط' }, { en: 'apologise', ar: 'يعتذر' }, { en: 'realistically', ar: 'بشكل واقعي' },
        { en: 'at the latest', ar: 'كحدّ أقصى' }, { en: 'on schedule', ar: 'حسب الجدول' }, { en: 'from now on', ar: 'من الآن فصاعداً' }
      ],
      tip: {
        en: 'With an unhappy client: acknowledge first, then explain, then offer a plan. Don\'t start with excuses.',
        ar: 'مع العميل الغاضب: اعترف أولاً، ثم اشرح، ثم قدّم خطة. لا تبدأ بالأعذار.'
      },
      turns: [
        {
          ai: { en: "Hi. I'll be honest, I'm quite disappointed. We were expecting the designs last Thursday.", ar: 'مرحباً. سأكون صريحة، أنا محبطة جداً. كنا ننتظر التصاميم يوم الخميس الماضي.' },
          keys: ['sorry', 'apologise', 'apologize', 'understand', 'delay', 'right', 'frustrating', 'fault'], minWords: 5,
          hint: { ar: 'ابدأ بالاعتذار والتفهّم قبل أي تبرير.', starter: 'I completely understand, and I’m really sorry …' },
          model: { en: "I completely understand, and I'm really sorry for the delay.", ar: 'أتفهّم تماماً، وأعتذر جداً عن التأخير.' },
          also: { en: "You're right, and I apologise. That's not the service we want to give you.", ar: 'معكِ حق، وأعتذر. هذه ليست الخدمة التي نريد تقديمها لكِ.' }
        },
        {
          ai: { en: 'So what happened?', ar: 'إذن ماذا حدث؟' },
          keys: ['because', 'team', 'sick', 'problem', 'technical', 'changes', 'server', 'issue', 'underestimated', 'redo'], minWords: 7,
          hint: { ar: 'اشرح السبب بوضوح بدون لوم أحد.', starter: 'Two of our designers were …' },
          model: { en: 'Two of our designers were sick, and we also had a technical problem with our server.', ar: 'اثنان من مصمّمينا كانا مريضين، وواجهنا أيضاً مشكلة تقنية في الخادم.' },
          also: { en: 'We had to redo some work after the last changes, and we underestimated the time.', ar: 'اضطررنا لإعادة بعض العمل بعد التعديلات الأخيرة، وأخطأنا في تقدير الوقت.' }
        },
        {
          ai: { en: 'I see. When can we realistically expect them?', ar: 'فهمت. متى يمكننا أن نتوقعها بشكل واقعي؟' },
          keys: ['by', 'tuesday', 'monday', 'wednesday', 'thursday', 'end', 'week', 'send', 'tomorrow', 'latest'],
          hint: { ar: 'أعطِ موعداً واقعياً ومحدداً.', starter: "We'll send you … by …" },
          model: { en: "We'll send you the first half by Tuesday, and the rest by Thursday.", ar: 'سنرسل لكِ النصف الأول بحلول الثلاثاء، والباقي بحلول الخميس.' },
          also: { en: "You'll have everything by Monday at the latest. I'll make sure of it personally.", ar: 'سيكون كل شيء لديكِ بحلول الاثنين كحدّ أقصى. سأتأكد من ذلك بنفسي.' }
        },
        {
          ai: { en: "Okay. But how do I know it won't happen again?", ar: 'حسناً. لكن كيف أعرف أن ذلك لن يتكرر؟' },
          keys: ['update', 'updates', 'weekly', 'call', 'extra', 'designer', 'added', 'every', 'will', 'plan'], minWords: 6,
          hint: { ar: 'اقترح إجراءً ملموساً: تحديث أسبوعي أو موظف إضافي.', starter: "From now on, I'll …" },
          model: { en: "From now on, I'll send you a short update every Friday, so there are no surprises.", ar: 'من الآن فصاعداً، سأرسل لكِ تحديثاً قصيراً كل جمعة، حتى لا تكون هناك مفاجآت.' },
          also: { en: "We've added another designer to your project to make sure we stay on schedule.", ar: 'أضفنا مصمماً آخر إلى مشروعكم للتأكد من الالتزام بالجدول.' }
        },
        {
          ai: { en: 'That would help a lot. Is there anything you need from our side?', ar: 'سيساعد ذلك كثيراً. هل تحتاجون أي شيء من جهتنا؟' },
          keys: ['#yesno', 'feedback', 'approve', 'approval', 'quickly', 'logo', 'content', 'images', 'text', 'need'],
          hint: { ar: 'اطلب منها شيئاً يساعدكم على الالتزام.', starter: 'It would help if you could …' },
          model: { en: 'Yes, it would help if you could give us feedback within two days.', ar: 'نعم، سيكون مفيداً إن أرسلتم ملاحظاتكم خلال يومين.' },
          also: { en: 'Just the final text for the homepage, if possible.', ar: 'فقط النص النهائي للصفحة الرئيسية إن أمكن.' }
        }
      ],
      outro: { en: "That's fair. Thanks for being honest with me. Let's speak again on Friday.", ar: 'هذا عادل. شكراً لصراحتك معي. لنتحدث مرة أخرى يوم الجمعة.' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'negotiation', category: 'work', level: 'Advanced', minutes: 5, icon: 'handshake', tint: '#26366E',
      title: 'Negotiating with a supplier', titleAr: 'التفاوض مع مورّد',
      place: 'Video call · Supplier negotiation',
      persona: { name: 'Robert', role: 'Supplier sales manager', roleAr: 'مدير مبيعات لدى المورّد', gender: 'male' },
      goal: { en: 'I can negotiate price and delivery politely but firmly.', ar: 'أستطيع التفاوض على السعر والتسليم بأدب وحزم.' },
      mission: {
        en: 'You need five hundred office chairs within four weeks. Get a better price and a delivery plan that works.',
        ar: 'تحتاج خمسمئة كرسي مكتب خلال أربعة أسابيع. احصل على سعر أفضل وخطة تسليم مناسبة.'
      },
      vocab: [
        { en: 'upfront', ar: 'مقدَّماً' }, { en: 'budget', ar: 'ميزانية' }, { en: 'meet in the middle', ar: 'حلّ وسط' },
        { en: 'as long as', ar: 'بشرط أن' }, { en: 'tight', ar: 'ضيّق' }, { en: 'contract', ar: 'عقد' }
      ],
      tip: {
        en: 'Use "What if…?" to suggest a trade: you give something, they give something.',
        ar: 'استخدم What if…? لاقتراح مقايضة: تقدّم شيئاً مقابل شيء.'
      },
      turns: [
        {
          ai: { en: 'Thanks for your time. So, for five hundred chairs, our price is one hundred and twenty dollars each. What do you think?', ar: 'شكراً على وقتك. لخمسمئة كرسي، سعرنا مئة وعشرون دولاراً للكرسي. ما رأيك؟' },
          keys: ['price', 'high', 'expensive', 'discount', 'lower', 'budget', 'hoping', 'expected', 'flexibility', 'too'], minWords: 5,
          hint: { ar: 'قل إن السعر مرتفع بأدب واقترح رقماً.', starter: "To be honest, that's higher than …" },
          model: { en: "To be honest, that's higher than we expected. We were hoping for around ninety-five.", ar: 'بصراحة، هذا أعلى مما توقعنا. كنا نأمل في حوالي خمسة وتسعين.' },
          also: { en: "That's above our budget. Is there any flexibility on the price?", ar: 'هذا فوق ميزانيتنا. هل هناك أي مرونة في السعر؟' }
        },
        {
          ai: { en: 'Ninety-five is too low for us. I could do one hundred and ten if you order six hundred.', ar: 'خمسة وتسعون منخفض جداً بالنسبة لنا. يمكنني أن أعرض مئة وعشرة إذا طلبتم ستمئة.' },
          keys: ['only', 'need', 'what if', 'upfront', 'meet', 'middle', 'instead', 'pay', 'five hundred'], minWords: 5,
          hint: { ar: 'اقترح مقايضة: What if we…? أو حلاً وسطاً.', starter: 'We only need five hundred. What if …' },
          model: { en: 'We only need five hundred. What if we pay upfront? Could you do one hundred then?', ar: 'نحتاج خمسمئة فقط. ماذا لو دفعنا مقدماً؟ هل يمكنك أن تعرض مئة حينها؟' },
          also: { en: "Let's meet in the middle at one hundred and five.", ar: 'لنلتقِ في المنتصف عند مئة وخمسة.' }
        },
        {
          ai: { en: 'Paying upfront helps. Okay, one hundred and five, paid upfront. Does that work for you?', ar: 'الدفع المقدم يساعد. حسناً، مئة وخمسة مع الدفع مقدماً. هل يناسبكم ذلك؟' },
          keys: ['#yesno', 'works', 'deal', 'agree', 'delivery', 'long', 'condition', 'include', 'weeks'],
          hint: { ar: 'اقبل بشرط: as long as…', starter: 'That works, as long as …' },
          model: { en: 'That works, as long as you can deliver within three weeks.', ar: 'هذا مناسب، بشرط أن تتمكنوا من التسليم خلال ثلاثة أسابيع.' },
          also: { en: "It's close. Can you include delivery in that price?", ar: 'هذا قريب. هل يمكنكم تضمين التوصيل في هذا السعر؟' }
        },
        {
          ai: { en: 'Three weeks is tight. Our usual time is five weeks.', ar: 'ثلاثة أسابيع وقت ضيّق. مدتنا المعتادة خمسة أسابيع.' },
          keys: ['four', 'weeks', 'half', 'first', 'office', 'opens', 'need', 'split', 'deliver', 'latest', 'rest'], minWords: 5,
          hint: { ar: 'اشرح حاجتك واقترح تسليماً على دفعتين.', starter: 'Our new office opens in four weeks. Could you …' },
          model: { en: 'Our new office opens in four weeks. Could you deliver half in three weeks and the rest after that?', ar: 'مكتبنا الجديد يُفتتح بعد أربعة أسابيع. هل يمكنكم تسليم النصف خلال ثلاثة أسابيع والباقي بعد ذلك؟' },
          also: { en: 'Four weeks is the latest we can accept.', ar: 'أربعة أسابيع هي أقصى مدة يمكننا قبولها.' }
        },
        {
          ai: { en: 'We can do that: two hundred and fifty in three weeks, the rest in five. Shall I send you the contract?', ar: 'يمكننا ذلك: مئتان وخمسون خلال ثلاثة أسابيع، والباقي خلال خمسة. هل أرسل لك العقد؟' },
          keys: ['#yesno', 'send', 'contract', 'review', 'legal', 'team', 'deal', 'great'],
          hint: { ar: 'وافق واطلب العقد للمراجعة.', starter: 'Yes, please send it over, and …' },
          model: { en: "Yes, please send it over, and I'll review it with our legal team.", ar: 'نعم، أرسله من فضلك، وسأراجعه مع فريقنا القانوني.' },
          also: { en: 'Great, we have a deal. Please send it today.', ar: 'رائع، اتفقنا. أرسله اليوم من فضلك.' }
        }
      ],
      outro: { en: 'Will do. It’s a pleasure doing business with you.', ar: 'سأفعل. سعدت بالتعامل معكم.' }
    }
  ]);
})(typeof window !== 'undefined' ? window : globalThis);
