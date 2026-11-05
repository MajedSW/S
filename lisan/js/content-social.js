/* ==========================================================================
   Lisan · content-social.js — Friends & culture path (all 5 units)
   Field reference: see the header of js/scenarios.js.
   ========================================================================== */
(function (root) {
  'use strict';
  root.LisanContent.addScenarios([
    /* ------------------------------------------------------------ */
    {
      id: 'neighbour', category: 'social', level: 'Beginner', minutes: 3, icon: 'home', tint: '#C2602F',
      title: 'Meeting your new neighbour', titleAr: 'التعرّف على جارك الجديد',
      place: 'Apartment building · Hallway',
      persona: { name: 'Emily', role: 'New neighbour', roleAr: 'جارة جديدة', gender: 'female' },
      goal: { en: 'I can introduce myself to a neighbour and offer help.', ar: 'أستطيع التعريف بنفسي لجاري وعرض المساعدة.' },
      mission: {
        en: 'Welcome your new neighbour, answer her questions about the area, and offer to help.',
        ar: 'رحّب بجارتك الجديدة، وأجب عن أسئلتها عن الحي، واعرض عليها المساعدة.'
      },
      vocab: [
        { en: 'next door', ar: 'المجاور' }, { en: 'moved in', ar: 'انتقل للسكن' }, { en: 'on foot', ar: 'مشياً' },
        { en: 'mostly', ar: 'في الغالب' }, { en: 'unpacking', ar: 'يفرغ الأغراض' }, { en: 'knock on the door', ar: 'يطرق الباب' }
      ],
      tip: {
        en: '"Just knock on my door" is a friendly, natural way to offer help to a neighbour.',
        ar: 'عبارة Just knock on my door طريقة ودّية وطبيعية لعرض المساعدة على الجار.'
      },
      turns: [
        {
          ai: { en: "Oh, hi! I've just moved in next door. I'm Emily.", ar: 'أهلاً! انتقلت للتو إلى الشقة المجاورة. أنا إميلي.' },
          keys: ['nice', 'meet', 'welcome', 'name', 'i am', 'hi', 'hello'],
          hint: { ar: 'رحّب بها وعرّف بنفسك.', starter: "Hi Emily, nice to meet you. I'm …" },
          model: { en: "Hi Emily, nice to meet you. I'm Saud. Welcome to the building!", ar: 'مرحباً إميلي، سعدت بلقائك. أنا سعود. أهلاً بك في المبنى!' },
          also: { en: 'Welcome! My name is Saud. I live right here.', ar: 'أهلاً بك! اسمي سعود. أسكن هنا تماماً.' }
        },
        {
          ai: { en: 'Thank you! How long have you lived here?', ar: 'شكراً! منذ متى تسكن هنا؟' },
          keys: ['for', 'since', '#num', 'years', 'year', 'months', 'about', 'lived'],
          hint: { ar: 'استخدم I\'ve lived here for…', starter: "I've lived here for …" },
          model: { en: "I've lived here for about two years.", ar: 'أسكن هنا منذ حوالي سنتين.' },
          also: { en: 'Since last summer.', ar: 'منذ الصيف الماضي.' }
        },
        {
          ai: { en: 'Nice. Do you know a good supermarket near here?', ar: 'جميل. هل تعرف سوبرماركت جيداً قريباً من هنا؟' },
          keys: ['#yesno', 'corner', 'street', 'near', 'walk', 'minutes', 'opposite', 'next', 'there', 'big'],
          hint: { ar: 'صِف المكان: there\'s a… at the end of the street.', starter: "Yes, there's a big one …" },
          model: { en: "Yes, there's a big one at the end of the street, about five minutes on foot.", ar: 'نعم، هناك واحد كبير في نهاية الشارع، على بُعد خمس دقائق مشياً.' },
          also: { en: "There's a small shop opposite the mosque. It's open late.", ar: 'هناك محل صغير مقابل المسجد. يفتح حتى وقت متأخر.' }
        },
        {
          ai: { en: 'Great, thanks. Is it usually quiet in this building?', ar: 'رائع، شكراً. هل المبنى هادئ عادةً؟' },
          keys: ['#yesno', 'quiet', 'noisy', 'kids', 'children', 'usually', 'mostly', 'sometimes', 'weekends', 'friendly'],
          hint: { ar: 'أجب واذكر استثناءً: except…', starter: "Yes, it's mostly quiet, except …" },
          model: { en: "Yes, it's mostly quiet, except at the weekend when the kids play outside.", ar: 'نعم، هادئ في الغالب، إلا في عطلة الأسبوع حين يلعب الأطفال في الخارج.' },
          also: { en: 'Very quiet. The neighbours are really friendly.', ar: 'هادئ جداً. والجيران ودودون حقاً.' }
        },
        {
          ai: { en: "Good to know. I'm still unpacking, so it's a bit of a mess!", ar: 'جيد أن أعرف. ما زلت أفرغ الصناديق، فالمكان فوضوي قليلاً!' },
          keys: ['help', 'need', 'anything', 'let', 'know', 'knock', 'door', 'carry', 'boxes'],
          hint: { ar: 'اعرض المساعدة بلطف.', starter: 'If you need any help, just …' },
          model: { en: 'If you need any help, just knock on my door.', ar: 'إذا احتجتِ أي مساعدة، فقط اطرقي بابي.' },
          also: { en: 'Do you need help carrying anything?', ar: 'هل تحتاجين مساعدة في حمل شيء؟' }
        }
      ],
      outro: { en: "That's so kind, thank you. Maybe I'll invite you for coffee once I've unpacked!", ar: 'هذا لطف كبير، شكراً. ربما أدعوك لشرب القهوة بعد أن أنتهي من الترتيب!' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'weekend-plans', category: 'social', level: 'Beginner', minutes: 3, icon: 'smile', tint: '#D07A1E',
      title: 'Making weekend plans', titleAr: 'ترتيب خطط العطلة',
      place: 'Phone call · Thursday evening',
      persona: { name: 'Jake', role: 'Your friend', roleAr: 'صديقك', gender: 'male' },
      goal: { en: 'I can suggest plans and agree on a time and place with a friend.', ar: 'أستطيع اقتراح خطط والاتفاق مع صديق على وقت ومكان.' },
      mission: {
        en: 'Your friend calls to make plans. Suggest an activity, agree on a time, and decide how you’ll get there.',
        ar: 'يتصل بك صديقك لترتيب خطط. اقترح نشاطاً، واتفقا على وقت، وقرّرا كيف ستذهبان.'
      },
      vocab: [
        { en: 'free', ar: 'متفرّغ' }, { en: 'How about…?', ar: 'ما رأيك في…؟' }, { en: "Why don't we…?", ar: 'لماذا لا…؟' },
        { en: 'pick you up', ar: 'أمرّ عليك لآخذك' }, { en: 'the more, the merrier', ar: 'كلما زاد العدد زادت المتعة' }, { en: 'for ages', ar: 'منذ زمن طويل' }
      ],
      tip: {
        en: 'After "How about…", use the -ing form: "How about playing padel?", not "How about play padel?".',
        ar: 'بعد How about نستخدم الفعل مع ing: How about playing padel? وليس How about play.'
      },
      turns: [
        {
          ai: { en: 'Hey! Are you free this weekend?', ar: 'مرحباً! هل أنت متفرّغ في عطلة نهاية الأسبوع؟' },
          keys: ['#yesno', 'free', 'saturday', 'friday', 'busy', 'why', 'plans'],
          hint: { ar: 'قل متى تكون متفرغاً.', starter: "Yes, I'm free on …" },
          model: { en: "Yes, I'm free on Saturday. Why?", ar: 'نعم، أنا متفرّغ يوم السبت. لماذا؟' },
          also: { en: "I'm busy on Friday, but Saturday is fine.", ar: 'أنا مشغول يوم الجمعة، لكن السبت مناسب.' }
        },
        {
          ai: { en: "Do you want to do something together? I'm bored of staying at home.", ar: 'هل تريد أن نفعل شيئاً معاً؟ مللت من البقاء في البيت.' },
          keys: ['how about', 'what about', 'let', 'why', 'could', 'go', 'cinema', 'bowling', 'beach', 'padel', 'football', 'watch', 'eat', 'restaurant'],
          hint: { ar: 'اقترح نشاطاً: How about + ing؟', starter: 'Sure! How about …ing …' },
          model: { en: 'Sure! How about playing padel and then getting something to eat?', ar: 'بالتأكيد! ما رأيك أن نلعب بادل ثم نأكل شيئاً؟' },
          also: { en: "Why don't we go to the new cinema in the mall?", ar: 'لماذا لا نذهب إلى السينما الجديدة في المول؟' }
        },
        {
          ai: { en: 'Sounds fun! What time is good for you?', ar: 'يبدو ممتعاً! ما الوقت المناسب لك؟' },
          keys: ['#num', 'pm', 'evening', 'afternoon', 'morning', 'after', 'around', 'four', 'five', 'seven', 'eight', 'sunset'],
          hint: { ar: 'اقترح وقتاً وأعطِ سبباً.', starter: 'How about … o’clock? …' },
          model: { en: "How about four o'clock? It's too hot earlier.", ar: 'ما رأيك في الساعة الرابعة؟ الجو حار جداً قبل ذلك.' },
          also: { en: "Let's meet around seven, after sunset.", ar: 'لنلتقِ حوالي السابعة، بعد الغروب.' }
        },
        {
          ai: { en: 'Perfect. Should I pick you up, or do you want to meet there?', ar: 'ممتاز. هل أمرّ عليك لآخذك، أم نلتقي هناك؟' },
          keys: ['pick', 'meet', 'there', 'drive', 'car', 'come', 'up', 'fine', 'easier'],
          hint: { ar: 'اختر: يمرّ عليك أو تلتقيان هناك.', starter: 'Could you pick me up? …' },
          model: { en: 'Could you pick me up? My car is at the garage.', ar: 'هل يمكنك أن تمرّ عليّ؟ سيارتي في الورشة.' },
          also: { en: "Let's just meet there. It's easier.", ar: 'لنلتقِ هناك فقط. هذا أسهل.' }
        },
        {
          ai: { en: "No problem. I'll invite Khalid too. Is that okay?", ar: 'لا مشكلة. سأدعو خالد أيضاً. هل هذا مناسب؟' },
          keys: ['#yesno', 'sure', 'great', 'more', 'fun', 'course', 'merrier', 'ages'],
          hint: { ar: 'وافق بحماس.', starter: 'Of course! …' },
          model: { en: 'Of course! The more, the merrier.', ar: 'طبعاً! كلما زاد العدد زادت المتعة.' },
          also: { en: "Sure, I haven't seen him for ages.", ar: 'بالتأكيد، لم أره منذ زمن طويل.' }
        }
      ],
      outro: { en: "Great. I'll send you a message with the details. See you on Saturday!", ar: 'رائع. سأرسل لك رسالة بالتفاصيل. أراك يوم السبت!' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'hosting', category: 'social', level: 'Intermediate', minutes: 4, icon: 'coffee', tint: '#9A5B25',
      title: 'Hosting a visitor', titleAr: 'استضافة زائر',
      place: 'Your home in Riyadh · The majlis',
      persona: { name: 'Claire', role: 'Visiting colleague from Canada', roleAr: 'زميلة زائرة من كندا', gender: 'female' },
      goal: { en: 'I can welcome a guest and explain my culture’s traditions.', ar: 'أستطيع الترحيب بضيف وشرح عادات ثقافتي.' },
      mission: {
        en: 'Welcome a foreign colleague to your home, serve Arabic coffee, and explain a few customs she might not know.',
        ar: 'رحّب بزميلة أجنبية في بيتك، وقدّم القهوة العربية، واشرح بعض العادات التي قد لا تعرفها.'
      },
      vocab: [
        { en: 'make yourself at home', ar: 'اعتبر البيت بيتك' }, { en: 'cardamom', ar: 'هيل' }, { en: 'saffron', ar: 'زعفران' },
        { en: 'tradition', ar: 'تقليد' }, { en: 'custom', ar: 'عادة / عُرف' }, { en: 'the oldest', ar: 'الأكبر سناً' }
      ],
      tip: {
        en: 'Explaining your own culture is great practice. Describe what you do and why: "We… because…".',
        ar: 'شرح ثقافتك تمرين رائع: صِف ما تفعلونه ولماذا: We… because…'
      },
      turns: [
        {
          ai: { en: 'Thank you so much for inviting me! Your home is beautiful.', ar: 'شكراً جزيلاً على دعوتك لي! بيتك جميل.' },
          keys: ['welcome', 'thank', 'pleasure', 'come', 'sit', 'honour', 'glad', 'home'],
          hint: { ar: 'رحّب بها: You\'re very welcome / Make yourself at home.', starter: "You're very welcome! Please …" },
          model: { en: "You're very welcome! Please come in and make yourself at home.", ar: 'أهلاً وسهلاً! تفضّلي بالدخول واعتبري البيت بيتك.' },
          also: { en: "Thank you for coming. It's an honour to have you here.", ar: 'شكراً لقدومك. يشرّفنا وجودك هنا.' }
        },
        {
          ai: { en: "What's this room called? It's lovely.", ar: 'ما اسم هذه الغرفة؟ إنها جميلة.' },
          keys: ['majlis', 'room', 'guests', 'sit', 'called', 'where', 'receive', 'visitors'],
          hint: { ar: 'اشرح ما هو المجلس واستخدامه.', starter: "This is the majlis. It's where …" },
          model: { en: "This is the majlis. It's where we sit with our guests.", ar: 'هذا المجلس. هنا نجلس مع ضيوفنا.' },
          also: { en: 'We call it the majlis. Families use it to welcome visitors.', ar: 'نسمّيه المجلس. تستخدمه العائلات لاستقبال الزوار.' }
        },
        {
          ai: { en: "And what's in that little cup? It smells amazing.", ar: 'وما الذي في هذا الفنجان الصغير؟ رائحته رائعة.' },
          keys: ['coffee', 'arabic', 'cardamom', 'saffron', 'dates', 'try', 'spices', 'gahwa'],
          hint: { ar: 'صِف القهوة العربية ومكوناتها.', starter: "It's Arabic coffee, with …" },
          model: { en: "It's Arabic coffee, with cardamom and a little saffron. We usually serve it with dates.", ar: 'إنها قهوة عربية بالهيل وقليل من الزعفران. نقدّمها عادةً مع التمر.' },
          also: { en: "That's gahwa, Arabic coffee. Please try it with a date.", ar: 'هذه القهوة العربية. تفضّلي جرّبيها مع تمرة.' }
        },
        {
          ai: { en: "It's delicious! My cup is empty now. What should I do if I don't want any more?", ar: 'إنها لذيذة! فنجاني فارغ الآن. ماذا أفعل إذا لم أرد المزيد؟' },
          keys: ['shake', 'cup', 'gently', 'side', 'means', 'enough', 'finished', 'sign'],
          hint: { ar: 'اشرح عادة هزّ الفنجان.', starter: 'Just shake the cup gently …' },
          model: { en: "Just shake the cup gently from side to side. That means you've had enough.", ar: 'فقط هزّي الفنجان بلطف يميناً ويساراً. هذا يعني أنك اكتفيتِ.' },
          also: { en: "You shake your cup a little, and I'll understand.", ar: 'هزّي فنجانك قليلاً، وسأفهم.' }
        },
        {
          ai: { en: "That's such a nice tradition! Are there other customs I should know about?", ar: 'يا لها من عادة جميلة! هل هناك عادات أخرى يجب أن أعرفها؟' },
          keys: ['right', 'hand', 'shoes', 'elders', 'oldest', 'first', 'serve', 'guests', 'respect', 'usually'], minWords: 6,
          hint: { ar: 'اذكر عادة أو عادتين: اليد اليمنى، تقديم الأكبر سناً.', starter: 'Yes, we usually …' },
          model: { en: 'Yes, we usually serve and eat with the right hand, and we greet the oldest person in the room first.', ar: 'نعم، نقدّم ونأكل عادةً باليد اليمنى، ونسلّم على الأكبر سناً في المجلس أولاً.' },
          also: { en: 'We often take off our shoes before we go into the majlis.', ar: 'نخلع أحذيتنا عادةً قبل دخول المجلس.' }
        }
      ],
      outro: { en: "I love that. Thank you for teaching me. Now I can't wait to try the food!", ar: 'أحب ذلك. شكراً لأنك علّمتني. لا أطيق الانتظار لتذوّق الطعام!' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'ramadan', category: 'social', level: 'Intermediate', minutes: 4, icon: 'moon', tint: '#2F5D8A',
      title: 'Explaining Ramadan', titleAr: 'شرح رمضان لزميل',
      place: 'Office · Coffee break, a week before Ramadan',
      persona: { name: 'Ben', role: 'Colleague', roleAr: 'زميل في العمل', gender: 'male' },
      goal: { en: 'I can explain Ramadan and Eid to someone who doesn’t know them.', ar: 'أستطيع شرح رمضان والعيد لشخص لا يعرفهما.' },
      mission: {
        en: 'A curious colleague asks about Ramadan. Explain fasting, iftar and Eid in simple, clear English.',
        ar: 'زميل فضولي يسأل عن رمضان. اشرح الصيام والإفطار والعيد بإنجليزية بسيطة وواضحة.'
      },
      vocab: [
        { en: 'fast', ar: 'يصوم' }, { en: 'dawn', ar: 'الفجر' }, { en: 'sunset', ar: 'الغروب' },
        { en: 'break the fast', ar: 'يفطر' }, { en: 'get used to it', ar: 'يعتاد عليه' }, { en: 'celebrate', ar: 'يحتفل' }
      ],
      tip: {
        en: 'Many people say "sunrise" for الفجر, but "dawn" is more accurate, because the fast starts before sunrise.',
        ar: 'يقول كثيرون sunrise للفجر، لكن dawn أدق، لأن الصيام يبدأ قبل شروق الشمس.'
      },
      turns: [
        {
          ai: { en: 'I heard Ramadan starts next week. What does it mean for you?', ar: 'سمعت أن رمضان يبدأ الأسبوع القادم. ماذا يعني بالنسبة لك؟' },
          keys: ['fast', 'fasting', 'month', 'dawn', 'sunrise', 'sunset', 'eat', 'drink', 'holy', 'pray'], minWords: 6,
          hint: { ar: 'اشرح الصيام بجملتين.', starter: "It's a holy month for us. We fast from …" },
          model: { en: "It's a holy month for us. We fast from dawn to sunset, so we don't eat or drink during the day.", ar: 'إنه شهر مقدّس بالنسبة لنا. نصوم من الفجر حتى الغروب، فلا نأكل ولا نشرب أثناء النهار.' }
        },
        {
          ai: { en: "Not even water? Isn't that difficult?", ar: 'ولا حتى الماء؟ أليس ذلك صعباً؟' },
          keys: ['difficult', 'hard', 'first', 'days', 'used', 'easy', 'spiritual', 'worth', 'not', 'body'],
          hint: { ar: 'استخدم get used to it (تعتاد عليه).', starter: 'The first few days are …' },
          model: { en: 'The first few days are a bit hard, but you get used to it quickly.', ar: 'الأيام الأولى صعبة قليلاً، لكنك تعتاد بسرعة.' },
          also: { en: "Not really. For me, it's more spiritual than physical.", ar: 'ليس حقاً. بالنسبة لي، الأمر روحاني أكثر منه جسدي.' }
        },
        {
          ai: { en: 'What happens at sunset?', ar: 'ماذا يحدث عند الغروب؟' },
          keys: ['iftar', 'break', 'dates', 'water', 'family', 'together', 'eat', 'meal', 'soup', 'samosas'],
          hint: { ar: 'صِف الإفطار: break our fast with…', starter: 'We break our fast with …' },
          model: { en: 'We break our fast with dates and water, and then we have iftar together as a family.', ar: 'نفطر على التمر والماء، ثم نتناول الإفطار معاً كعائلة.' },
          also: { en: "We call the sunset meal iftar. There's usually soup, samosas and lots of dishes.", ar: 'نسمّي وجبة الغروب الإفطار. عادةً فيها شوربة وسمبوسة وأطباق كثيرة.' }
        },
        {
          ai: { en: 'That sounds lovely. Should I avoid eating in front of you at work?', ar: 'يبدو ذلك جميلاً. هل يجب أن أتجنّب الأكل أمامك في العمل؟' },
          keys: ['worry', 'fine', 'okay', 'kind', 'mind', 'need', 'thank', 'thoughtful'],
          hint: { ar: 'اشكره على لطفه وطمئنه.', starter: "That's very kind, but …" },
          model: { en: "That's very kind, but don't worry. It's completely fine.", ar: 'هذا لطف منك، لكن لا تقلق. لا بأس أبداً.' },
          also: { en: "It's thoughtful of you, but you don't need to change anything.", ar: 'هذا تصرّف لطيف منك، لكنك لا تحتاج إلى تغيير أي شيء.' }
        },
        {
          ai: { en: 'And what happens at the end of the month?', ar: 'وماذا يحدث في نهاية الشهر؟' },
          keys: ['eid', 'celebrate', 'celebration', 'clothes', 'family', 'gifts', 'children', 'money', 'visit', 'prayer'], minWords: 6,
          hint: { ar: 'صِف العيد: ملابس جديدة، زيارات، عيدية.', starter: 'We celebrate Eid. We …' },
          model: { en: 'We celebrate Eid. We wear new clothes, visit our relatives, and children get money and gifts.', ar: 'نحتفل بالعيد. نلبس ملابس جديدة ونزور الأقارب، ويحصل الأطفال على العيدية والهدايا.' },
          also: { en: "There's a big celebration called Eid al-Fitr. It's a bit like a three-day holiday.", ar: 'هناك احتفال كبير اسمه عيد الفطر. إنه يشبه عطلة لثلاثة أيام.' }
        }
      ],
      outro: { en: 'That sounds wonderful. Ramadan Kareem! I hope I said that right.', ar: 'يبدو ذلك رائعاً. رمضان كريم! أتمنى أنني قلتها بشكل صحيح.' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'dinner-party', category: 'social', level: 'Advanced', minutes: 5, icon: 'gift', tint: '#A3436B',
      register: 'polite',
      title: 'At a dinner party', titleAr: 'في حفلة عشاء',
      place: 'A friend’s home in London · Dinner party',
      persona: { name: 'Charlotte', role: 'Your host', roleAr: 'مضيفتك', gender: 'female' },
      goal: { en: 'I can make conversation at a dinner party and say no politely.', ar: 'أستطيع إدارة الحديث في حفلة عشاء والرفض بأدب.' },
      mission: {
        en: 'Thank your host, compliment the food, turn down a second helping politely, and give travel tips about Saudi Arabia.',
        ar: 'اشكر مضيفتك، وامدح الطعام، وارفض الطبق الثاني بأدب، وقدّم نصائح للسفر إلى السعودية.'
      },
      vocab: [
        { en: 'thank you for having me', ar: 'شكراً لاستضافتي' }, { en: 'go to so much trouble', ar: 'يُتعب نفسه كثيراً' },
        { en: "I couldn't eat another bite", ar: 'لا أستطيع أكل لقمة أخرى' }, { en: 'definitely', ar: 'بالتأكيد' },
        { en: 'dress modestly', ar: 'يلبس باحتشام' }, { en: 'plenty', ar: 'الكثير' }
      ],
      tip: {
        en: 'To say no to food politely, praise it first: "It was delicious, but I couldn\'t eat another bite."',
        ar: 'لترفض الطعام بأدب امدحه أولاً: It was delicious, but I couldn\'t eat another bite.'
      },
      turns: [
        {
          ai: { en: "I'm so glad you could make it! Can I get you something to drink?", ar: 'سعيدة جداً أنك استطعت الحضور! هل أحضر لك شيئاً لتشربه؟' },
          keys: ['water', 'juice', 'soft', 'drink', 'thank', 'having', 'something', 'have', 'inviting'],
          hint: { ar: 'اشكرها على الدعوة واطلب مشروباً.', starter: 'Thank you for having me! Just …' },
          model: { en: 'Thank you for having me! Just some sparkling water, please.', ar: 'شكراً لاستضافتي! ماء غازي فقط، من فضلك.' },
          also: { en: "I'd love some juice. Thanks for inviting me.", ar: 'أودّ بعض العصير. شكراً على دعوتي.' }
        },
        {
          ai: { en: "Dinner's almost ready. I made roast lamb with rosemary. I hope you like lamb!", ar: 'العشاء جاهز تقريباً. حضّرت لحم ضأن مشوياً بإكليل الجبل. أتمنى أنك تحب لحم الضأن!' },
          keys: ['love', 'smells', 'delicious', 'amazing', 'lamb', 'favourite', 'great', 'looks', 'trouble'],
          hint: { ar: 'امدح الطعام قبل تذوّقه: It smells amazing!', starter: 'I love lamb. It …' },
          model: { en: 'I love lamb. It smells amazing!', ar: 'أحب لحم الضأن. رائحته رائعة!' },
          also: { en: "Lamb is my favourite. You didn't have to go to so much trouble.", ar: 'لحم الضأن طبقي المفضل. لم يكن عليكِ أن تُتعبي نفسك هكذا.' }
        },
        {
          ai: { en: "Would you like some more? There's plenty.", ar: 'هل تريد المزيد؟ هناك الكثير.' },
          keys: ['#yesno', 'full', 'thank', 'couldn', 'delicious', 'more', 'little', 'bit', 'bite'],
          hint: { ar: 'ارفض بأدب بعد مدح الطعام.', starter: 'It was delicious, but …' },
          model: { en: "It was delicious, but I couldn't eat another bite, thank you.", ar: 'كان لذيذاً، لكنني لا أستطيع أكل لقمة أخرى، شكراً.' },
          also: { en: "Just a little bit more, please. It's really good.", ar: 'القليل فقط من فضلك. إنه لذيذ حقاً.' }
        },
        {
          ai: { en: "So, my husband and I are thinking of visiting Saudi Arabia. Where would you recommend?", ar: 'زوجي وأنا نفكر في زيارة السعودية. أين تنصحنا أن نذهب؟' },
          keys: ['recommend', 'should', 'definitely', 'alula', 'riyadh', 'jeddah', 'abha', 'winter', 'visit', 'go'], minWords: 8,
          hint: { ar: 'انصحهم بمكانين وأفضل وقت للزيارة.', starter: 'You should definitely see …' },
          model: { en: "You should definitely see AlUla, and Jeddah's old town is beautiful too. I'd go in winter, when the weather is perfect.", ar: 'يجب أن تزوروا العلا بالتأكيد، والبلد في جدة جميلة أيضاً. أنصح بالذهاب في الشتاء حين يكون الطقس مثالياً.' }
        },
        {
          ai: { en: 'That sounds incredible. Is there anything we should know before we go?', ar: 'يبدو ذلك رائعاً. هل هناك شيء يجب أن نعرفه قبل أن نذهب؟' },
          keys: ['dress', 'modestly', 'weekend', 'friday', 'hot', 'visa', 'app', 'respect', 'prayer', 'times'], minWords: 8,
          hint: { ar: 'قدّم نصيحتين عمليتين.', starter: 'Dress modestly in public, and remember …' },
          model: { en: 'Dress modestly in public places, and remember that the weekend is Friday and Saturday.', ar: 'ارتدوا ملابس محتشمة في الأماكن العامة، وتذكّروا أن عطلة نهاية الأسبوع هي الجمعة والسبت.' },
          also: { en: 'You can get an e-visa online, and download a ride app. It makes everything easier.', ar: 'يمكنكم الحصول على تأشيرة إلكترونية عبر الإنترنت، وتحميل تطبيق توصيل. هذا يسهّل كل شيء.' }
        }
      ],
      outro: { en: "Thank you, that's really helpful. We'll call you when we book!", ar: 'شكراً، هذا مفيد جداً. سنتصل بك عندما نحجز!' }
    }
  ]);
})(typeof window !== 'undefined' ? window : globalThis);
