/* ==========================================================================
   Lisan · content-travel.js — Travel path, units 6-9
   Field reference: see the header of js/scenarios.js.
   ========================================================================== */
(function (root) {
  'use strict';
  root.LisanContent.addScenarios([
    /* ------------------------------------------------------------ */
    {
      id: 'directions', category: 'travel', level: 'Beginner', minutes: 3, icon: 'map', tint: '#2E7DA8',
      title: 'Asking for directions', titleAr: 'السؤال عن الطريق',
      place: 'City centre · Street corner',
      persona: { name: 'Liam', role: 'Local resident', roleAr: 'أحد سكان المدينة', gender: 'male' },
      goal: { en: 'I can ask for directions and check that I understood them.', ar: 'أستطيع أن أسأل عن الطريق وأتأكد أنني فهمته.' },
      mission: {
        en: 'Find your way to the National Museum: ask for directions, check you understood, and find out when it closes.',
        ar: 'اعثر على طريقك إلى المتحف الوطني: اسأل عن الاتجاهات، وتأكد من فهمك، واعرف متى يغلق.'
      },
      vocab: [
        { en: 'go straight', ar: 'امشِ مباشرة' }, { en: 'turn left', ar: 'انعطف يساراً' },
        { en: 'traffic lights', ar: 'إشارة المرور' }, { en: 'next to', ar: 'بجانب' },
        { en: 'on foot', ar: 'مشياً على الأقدام' }, { en: 'opposite', ar: 'مقابل' }
      ],
      tip: {
        en: 'Check you understood by repeating the key part: "So I turn left at the lights?" People expect it, and it isn\'t rude.',
        ar: 'للتأكد من فهمك كرّر الجزء المهم: So I turn left at the lights? هذا متوقَّع وليس فيه قلة أدب.'
      },
      turns: [
        {
          ai: { en: 'Hi there, you look a little lost. Can I help you?', ar: 'مرحباً، يبدو أنك تائه قليلاً. هل يمكنني مساعدتك؟' },
          keys: ['#yesno', 'looking', 'find', 'where', 'museum', 'how', 'get', 'lost', 'way'],
          hint: { ar: 'اسأل عن الطريق إلى المتحف بأسلوب لطيف.', starter: 'Yes, please. How do I get to …' },
          model: { en: 'Yes, please. How do I get to the National Museum?', ar: 'نعم، من فضلك. كيف أصل إلى المتحف الوطني؟' },
          also: { en: "Yes, thanks. I'm looking for the National Museum.", ar: 'نعم، شكراً. أبحث عن المتحف الوطني.' }
        },
        {
          ai: { en: 'Sure. Go straight down this street, then turn left at the traffic lights. Is that clear?', ar: 'بالتأكيد. امشِ مباشرة في هذا الشارع، ثم انعطف يساراً عند الإشارة. هل الطريق واضح؟' },
          keys: ['#yesno', 'straight', 'left', 'right', 'lights', 'again', 'repeat', 'clear', 'understand', 'slowly'],
          hint: { ar: 'كرّر الاتجاهات لتتأكد أنك فهمتها.', starter: 'So I go straight, then …' },
          model: { en: 'So I go straight, then turn left at the traffic lights?', ar: 'إذن أمشي مباشرة، ثم أنعطف يساراً عند الإشارة؟' },
          also: { en: 'Sorry, could you say that again more slowly?', ar: 'عذراً، هل يمكنك تكرار ذلك ببطء أكثر؟' }
        },
        {
          ai: { en: "Exactly. Then it's on your right, just after the park. Are you walking or driving?", ar: 'بالضبط. وبعدها ستجده على يمينك بعد الحديقة مباشرة. هل ستمشي أم ستقود السيارة؟' },
          keys: ['walk', 'walking', 'drive', 'driving', 'car', 'foot', 'taxi', 'bus'],
          hint: { ar: 'قل إن كنت ستمشي (walking) أو تقود (driving).', starter: "I'm …" },
          model: { en: "I'm walking. How long does it take?", ar: 'سأمشي. كم يستغرق ذلك؟' },
          also: { en: "I'm driving. Is there parking near the museum?", ar: 'سأقود السيارة. هل يوجد موقف قريب من المتحف؟' },
          reprompt: { en: 'Sorry, are you on foot or in a car?', ar: 'عذراً، هل أنت ماشٍ أم في سيارة؟' }
        },
        {
          ai: { en: "On foot, it's about ten minutes. Do you know what time it closes today?", ar: 'مشياً تستغرق حوالي عشر دقائق. هل تعرف متى يغلق اليوم؟' },
          keys: ['#yesno', 'close', 'closes', 'open', 'time', 'know', 'idea', 'six', 'five'],
          hint: { ar: 'إذا لم تكن تعرف، اسأله: Do you know when…? (بدون does بعد when).', starter: "No, I don't. Do you know …" },
          model: { en: "No, I don't. Do you know when it closes?", ar: 'لا، لا أعرف. هل تعرف متى يغلق؟' },
          also: { en: 'I think it closes at six.', ar: 'أظن أنه يغلق الساعة السادسة.' }
        },
        {
          ai: { en: 'It closes at six, so you have plenty of time. By the way, where are you visiting from?', ar: 'يغلق الساعة السادسة، فلديك وقت كافٍ. بالمناسبة، من أين أتيت؟' },
          keys: ['from', '#place', 'saudi', 'visiting', 'here', 'country'],
          hint: { ar: 'قل من أين أنت: I\'m from…', starter: "I'm from …" },
          model: { en: "I'm from Saudi Arabia, from Riyadh.", ar: 'أنا من السعودية، من الرياض.' },
          also: { en: "I'm visiting from Jeddah. It's my first time here.", ar: 'جئت من جدة. هذه أول مرة لي هنا.' }
        }
      ],
      outro: { en: 'Welcome to the city! Enjoy the museum.', ar: 'أهلاً بك في المدينة! استمتع بالمتحف.' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'luggage', category: 'travel', level: 'Intermediate', minutes: 4, icon: 'suitcase', tint: '#36689C',
      register: 'polite',
      title: 'Lost luggage', titleAr: 'الأمتعة المفقودة',
      place: 'Arrivals · Baggage services',
      persona: { name: 'Grace', role: 'Baggage services agent', roleAr: 'موظفة خدمات الأمتعة', gender: 'female' },
      goal: { en: 'I can report lost luggage and describe my bag.', ar: 'أستطيع الإبلاغ عن أمتعة مفقودة ووصف حقيبتي.' },
      mission: {
        en: 'Your suitcase didn’t arrive. Report it, describe it clearly and arrange delivery to your hotel.',
        ar: 'حقيبتك لم تصل. أبلغ عنها، وصِفها بوضوح، ورتّب توصيلها إلى فندقك.'
      },
      vocab: [
        { en: 'suitcase', ar: 'حقيبة سفر' }, { en: 'baggage tag', ar: 'ملصق الحقيبة' },
        { en: 'reference number', ar: 'رقم مرجعي' }, { en: 'deliver', ar: 'يوصِّل' },
        { en: 'wheels', ar: 'عجلات' }, { en: 'handle', ar: 'مقبض' }
      ],
      tip: {
        en: 'Size comes before colour in English: "a large black suitcase", not "a black large suitcase".',
        ar: 'في الإنجليزية يأتي الحجم قبل اللون: a large black suitcase وليس a black large suitcase.'
      },
      turns: [
        {
          ai: { en: 'Hello, welcome to baggage services. How can I help you?', ar: 'مرحباً بك في خدمات الأمتعة. كيف يمكنني مساعدتك؟' },
          keys: ['bag', 'suitcase', 'luggage', 'arrive', 'arrived', 'lost', 'missing', 'find', 'come'],
          hint: { ar: 'قل إن حقيبتك لم تصل.', starter: "My suitcase didn't …" },
          model: { en: "Hi. My suitcase didn't arrive on my flight from Riyadh.", ar: 'مرحباً. حقيبتي لم تصل مع رحلتي القادمة من الرياض.' },
          also: { en: 'I think my luggage is lost.', ar: 'أظن أن أمتعتي ضاعت.' }
        },
        {
          ai: { en: "I'm sorry about that. Can I see your boarding pass and baggage tag, please?", ar: 'آسفة لذلك. هل يمكنني رؤية بطاقة الصعود وملصق الحقيبة، من فضلك؟' },
          keys: ['here', 'sure', 'yes', 'of course', 'tag', 'pass', 'course', 'phone'],
          hint: { ar: 'أعطها الورقتين: here they are (للجمع).', starter: 'Sure, here …' },
          model: { en: 'Sure, here they are.', ar: 'بالتأكيد، تفضّلي.' },
          also: { en: "Here's my boarding pass. The tag is on the back.", ar: 'تفضّلي بطاقة الصعود. الملصق على ظهرها.' }
        },
        {
          ai: { en: 'Thank you. Can you describe your suitcase? What colour and size is it?', ar: 'شكراً. هل يمكنك وصف حقيبتك؟ ما لونها وحجمها؟' },
          keys: ['black', 'blue', 'red', 'grey', 'gray', 'green', 'silver', 'white', 'brown', 'big', 'large', 'small', 'medium', 'size', 'hard', 'wheels'],
          hint: { ar: 'صِف الحجم ثم اللون: It\'s a large black suitcase.', starter: "It's a large …" },
          model: { en: "It's a large black suitcase with four wheels.", ar: 'إنها حقيبة سوداء كبيرة بأربع عجلات.' },
          also: { en: "It's a medium blue bag with a red ribbon on the handle.", ar: 'إنها حقيبة زرقاء متوسطة الحجم عليها شريط أحمر على المقبض.' }
        },
        {
          ai: { en: 'Got it. Is there anything valuable or urgent inside, like medicine?', ar: 'فهمت. هل يوجد بداخلها شيء ثمين أو ضروري، مثل الأدوية؟' },
          keys: ['#yesno', 'medicine', 'laptop', 'charger', 'clothes', 'nothing', 'valuable', 'gifts', 'documents'],
          hint: { ar: 'قل ما بداخلها: just clothes / my medicine.', starter: 'Yes, my medicine …' },
          model: { en: 'Yes, my medicine is in it, so I need it soon.', ar: 'نعم، دوائي بداخلها، لذلك أحتاجها قريباً.' },
          also: { en: 'No, just clothes and some gifts.', ar: 'لا، فقط ملابس وبعض الهدايا.' }
        },
        {
          ai: { en: "We'll find it. Most bags arrive on the next flight. Where should we deliver it?", ar: 'سنجدها. معظم الحقائب تصل مع الرحلة التالية. أين نوصلها لك؟' },
          keys: ['hotel', 'address', 'deliver', 'room', 'send', 'street', 'staying', 'home'],
          hint: { ar: 'أعطها اسم الفندق: to my hotel, the…', starter: 'Could you deliver it to …' },
          model: { en: 'Could you deliver it to my hotel, the Harbor View, please?', ar: 'هل يمكنكم توصيلها إلى فندقي، هاربر فيو، من فضلك؟' },
          also: { en: "Please send it to this address. I'll write it down.", ar: 'أرسلوها إلى هذا العنوان من فضلك. سأكتبه لكِ.' }
        },
        {
          ai: { en: "No problem. Here's your reference number. You can track your bag online with it. Anything else?", ar: 'لا مشكلة. هذا رقمك المرجعي، يمكنك تتبع حقيبتك عبر الإنترنت به. هل هناك شيء آخر؟' },
          keys: ['#yesno', 'long', 'when', 'how', 'time', 'call', 'thank', 'that'],
          hint: { ar: 'اسأل كم يستغرق الأمر، أو اشكرها.', starter: 'How long will it …' },
          model: { en: 'How long will it take, usually?', ar: 'كم يستغرق ذلك عادةً؟' },
          also: { en: "No, that's all. Thank you for your help.", ar: 'لا، هذا كل شيء. شكراً لمساعدتك.' }
        }
      ],
      outro: { en: "Usually less than twenty-four hours. We'll call you as soon as it arrives.", ar: 'عادةً أقل من أربع وعشرين ساعة. سنتصل بك فور وصولها.' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'hotel-problem', category: 'travel', level: 'Intermediate', minutes: 4, icon: 'alert', tint: '#B0503A',
      register: 'polite',
      title: 'A problem with your room', titleAr: 'مشكلة في الغرفة',
      place: 'Harbor View Hotel · Front desk',
      persona: { name: 'Sophie', role: 'Duty manager', roleAr: 'مديرة المناوبة', gender: 'female' },
      goal: { en: 'I can complain politely and agree on a solution.', ar: 'أستطيع تقديم شكوى بأدب والاتفاق على حل.' },
      mission: {
        en: 'Your air conditioning isn’t working. Complain politely, explain the problem and agree on a solution.',
        ar: 'المكيّف في غرفتك لا يعمل. قدّم شكوى بأدب، واشرح المشكلة، واتفق على حل.'
      },
      vocab: [
        { en: "I'm afraid…", ar: 'للأسف…' }, { en: "isn't working", ar: 'لا يعمل' },
        { en: 'noisy', ar: 'مزعج' }, { en: "I'd prefer", ar: 'أفضّل' },
        { en: 'on us', ar: 'على حسابنا' }, { en: 'porter', ar: 'حامل الحقائب' }
      ],
      tip: {
        en: 'Start a complaint softly with "I\'m afraid…" or "I\'m sorry, but…". It sounds polite but still firm.',
        ar: 'ابدأ الشكوى بلطف: I\'m afraid… أو I\'m sorry, but… فهي مهذبة لكنها واضحة.'
      },
      turns: [
        {
          ai: { en: "Good evening. I'm Sophie, the duty manager. How can I help?", ar: 'مساء الخير. أنا صوفي، مديرة المناوبة. كيف يمكنني المساعدة؟' },
          keys: ['room', 'problem', 'air', 'conditioning', 'noisy', 'noise', 'dirty', 'working', 'broken', 'hot', 'shower'],
          hint: { ar: 'اشرح المشكلة بلطف: I\'m afraid there\'s a problem with…', starter: "I'm afraid there's a problem with …" },
          model: { en: "Hi. I'm afraid there's a problem with my room. The air conditioning isn't working.", ar: 'مرحباً. للأسف هناك مشكلة في غرفتي. المكيّف لا يعمل.' },
          also: { en: "Hi, I'm in room five twelve, and it's very noisy at night.", ar: 'مرحباً، أنا في الغرفة 512، وهي مزعجة جداً في الليل.' }
        },
        {
          ai: { en: "I'm so sorry to hear that. How long has it been like this?", ar: 'آسفة جداً لسماع ذلك. منذ متى وهي على هذه الحال؟' },
          keys: ['since', 'for', '#num', 'hour', 'hours', 'yesterday', 'night', 'morning', 'arrived', 'last'],
          hint: { ar: 'استخدم since مع نقطة البداية، و for مع المدة.', starter: 'Since …' },
          model: { en: "Since last night. I couldn't sleep.", ar: 'منذ الليلة الماضية. لم أستطع النوم.' },
          also: { en: 'For about two hours.', ar: 'منذ حوالي ساعتين.' }
        },
        {
          ai: { en: "That's not acceptable, and I apologise. I can send a technician now, or move you to another room. Which would you prefer?", ar: 'هذا غير مقبول، وأعتذر لك. يمكنني إرسال فنّي الآن، أو نقلك إلى غرفة أخرى. ماذا تفضّل؟' },
          keys: ['technician', 'move', 'another', 'room', 'change', 'fix', 'prefer', 'rather', 'new'],
          hint: { ar: 'اختر: فنّي أو غرفة جديدة. استخدم I\'d prefer to…', starter: "I'd prefer to …" },
          model: { en: "I'd prefer to move to another room, please.", ar: 'أفضّل الانتقال إلى غرفة أخرى، من فضلك.' },
          also: { en: "Could you send the technician? I don't want to pack again.", ar: 'هل يمكنك إرسال الفني؟ لا أريد أن أحزم أغراضي مرة أخرى.' }
        },
        {
          ai: { en: "Of course. I've got a quieter room on the eighth floor with a sea view. Would that be okay?", ar: 'بالتأكيد. لديّ غرفة أهدأ في الطابق الثامن مطلة على البحر. هل يناسبك ذلك؟' },
          keys: ['#yesno', 'perfect', 'great', 'fine', 'sea', 'view', 'floor'],
          hint: { ar: 'اقبل بلطف، أو ضع شرطاً: as long as…', starter: 'That would be …' },
          model: { en: 'That would be perfect, thank you.', ar: 'سيكون ذلك ممتازاً، شكراً لك.' },
          also: { en: 'Yes, as long as the air conditioning works.', ar: 'نعم، بشرط أن يعمل المكيّف.' }
        },
        {
          ai: { en: 'And to say sorry, breakfast tomorrow is on us. Is there anything else I can do for you?', ar: 'وكاعتذار منا، إفطار الغد على حسابنا. هل هناك شيء آخر يمكنني فعله لك؟' },
          keys: ['#yesno', 'thank', 'kind', 'help', 'appreciate', 'bags', 'luggage'],
          hint: { ar: 'اشكرها، ويمكنك طلب مساعدة في الحقائب.', starter: "That's very kind of you …" },
          model: { en: "That's very kind of you. Could someone help me with my bags?", ar: 'هذا لطف كبير منك. هل يمكن لأحد أن يساعدني في حمل حقائبي؟' },
          also: { en: "No, that's all. I really appreciate your help.", ar: 'لا، هذا كل شيء. أقدّر مساعدتك كثيراً.' }
        }
      ],
      outro: { en: 'Of course. A porter will be at your door in five minutes. Have a good night.', ar: 'بالتأكيد. سيكون حامل الحقائب عند بابك خلال خمس دقائق. ليلة سعيدة.' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'rebooking', category: 'travel', level: 'Advanced', minutes: 5, icon: 'clock', tint: '#24527A',
      title: 'Missed connection', titleAr: 'فاتتك رحلة الربط',
      place: 'Frankfurt Airport · Transfer desk',
      persona: { name: 'Ethan', role: 'Airline transfer agent', roleAr: 'موظف التحويل في شركة الطيران', gender: 'male' },
      goal: { en: 'I can explain a travel problem and negotiate a better option.', ar: 'أستطيع شرح مشكلة في السفر والتفاوض على خيار أفضل.' },
      mission: {
        en: 'Your first flight was late and you missed your connection to Toronto. Choose the best new option and ask for what you need.',
        ar: 'تأخرت رحلتك الأولى ففاتتك رحلة الربط إلى تورونتو. اختر أفضل خيار جديد واطلب ما تحتاجه.'
      },
      vocab: [
        { en: 'connection', ar: 'رحلة ربط' }, { en: 'delayed', ar: 'متأخرة' },
        { en: 'entitled to', ar: 'يحق لك' }, { en: 'voucher', ar: 'قسيمة' },
        { en: "I'd rather", ar: 'أفضّل' }, { en: 'sort it out', ar: 'يحل المشكلة' }
      ],
      tip: {
        en: '"Is there any chance I could…?" is a soft, polite way to ask for something extra.',
        ar: 'عبارة Is there any chance I could…? طريقة لطيفة لطلب شيء إضافي.'
      },
      turns: [
        {
          ai: { en: 'Hi, next please. What happened?', ar: 'مرحباً، التالي من فضلك. ماذا حدث؟' },
          keys: ['missed', 'connection', 'late', 'delayed', 'delay', 'flight', 'left'], minWords: 5,
          hint: { ar: 'اشرح: رحلتك الأولى تأخرت ففاتتك الرحلة التالية.', starter: 'My first flight was delayed, so I missed …' },
          model: { en: 'My flight from Riyadh was delayed, so I missed my connection to Toronto.', ar: 'تأخرت رحلتي من الرياض، ففاتتني رحلة الربط إلى تورونتو.' },
          also: { en: 'I just landed, but my connecting flight has already left.', ar: 'هبطت للتو، لكن رحلة الربط أقلعت بالفعل.' }
        },
        {
          ai: { en: "I'm sorry about that. The next direct flight is tomorrow at ten a.m. There's also one tonight, but it stops in London. Which do you prefer?", ar: 'آسف لذلك. الرحلة المباشرة التالية غداً الساعة العاشرة صباحاً. وهناك رحلة الليلة لكنها تتوقف في لندن. أيهما تفضّل؟' },
          keys: ['tonight', 'tomorrow', 'direct', 'london', 'stop', 'prefer', 'rather', 'morning'],
          hint: { ar: 'اختر وأعطِ السبب: I\'d rather… because…', starter: "I'd rather take … because …" },
          model: { en: "I'd rather take the flight tonight, because I have a meeting tomorrow afternoon.", ar: 'أفضّل رحلة الليلة، لأن لديّ اجتماعاً غداً بعد الظهر.' },
          also: { en: "The direct flight tomorrow is better for me. I'm too tired for another stop.", ar: 'الرحلة المباشرة غداً أنسب لي. أنا متعب جداً لتوقف آخر.' }
        },
        {
          ai: { en: "Alright, I can do that. Since the delay was our fault, you're also entitled to a meal voucher. Is there anything else you need?", ar: 'حسناً، يمكنني ترتيب ذلك. وبما أن التأخير كان بسببنا، يحق لك أيضاً قسيمة وجبة. هل تحتاج إلى أي شيء آخر؟' },
          keys: ['#yesno', 'bag', 'luggage', 'hotel', 'meal', 'voucher', 'seat', 'lounge', 'transferred'],
          hint: { ar: 'اسأل عن حقيبتك المشحونة.', starter: 'Will my checked bag …' },
          model: { en: 'Will my checked bag be transferred to the new flight automatically?', ar: 'هل ستُنقل حقيبتي المشحونة إلى الرحلة الجديدة تلقائياً؟' },
          also: { en: 'Could I also get access to the lounge while I wait?', ar: 'هل يمكنني أيضاً دخول الصالة أثناء الانتظار؟' }
        },
        {
          ai: { en: "Yes, it'll go straight through. One more thing: the flight is quite full, so you're in a middle seat. Is that okay?", ar: 'نعم، ستُنقل مباشرة. أمر آخر: الرحلة شبه ممتلئة، لذا مقعدك في الوسط. هل هذا مناسب؟' },
          keys: ['#yesno', 'middle', 'aisle', 'window', 'seat', 'change', 'fine', 'chance', 'possible'],
          hint: { ar: 'اطلب بلطف مقعداً آخر: Is there any chance I could…?', starter: 'Is there any chance I could …' },
          model: { en: "Is there any chance I could get an aisle seat? It's a long flight.", ar: 'هل من الممكن أن أحصل على مقعد بجانب الممر؟ إنها رحلة طويلة.' },
          also: { en: "That's fine. I just want to get there.", ar: 'لا بأس. أريد فقط أن أصل.' }
        },
        {
          ai: { en: 'Let me see. Yes, I can put you in twenty-two C, on the aisle. Do you need anything else before you go?', ar: 'دعني أرى. نعم، يمكنني وضعك في المقعد 22C بجانب الممر. هل تحتاج أي شيء آخر قبل أن تذهب؟' },
          keys: ['#yesno', 'thank', 'gate', 'where', 'lounge', 'voucher', 'help'],
          hint: { ar: 'اسأل عن البوابة أو اشكره.', starter: 'Which gate …' },
          model: { en: 'Which gate does it leave from?', ar: 'من أي بوابة تُقلع؟' },
          also: { en: "No, that's everything. Thanks for sorting it out so quickly.", ar: 'لا، هذا كل شيء. شكراً لحلّك الأمر بهذه السرعة.' }
        }
      ],
      outro: { en: 'Gate B forty-four. You have plenty of time, so go and get something to eat. Safe travels!', ar: 'البوابة B44. لديك وقت كافٍ، فاذهب وتناول شيئاً. رحلة آمنة!' }
    }
  ]);
})(typeof window !== 'undefined' ? window : globalThis);
