/* ==========================================================================
   Lisan · scenarios.js — conversation content
   --------------------------------------------------------------------------
   Pure data. Each scenario is a short, realistic role-play, and belongs to
   one learning path (PATHS below), which orders units from easier to harder.
   More role-plays live in js/content-*.js and register with addScenarios().
   Check everything with:  node tools/check-content.mjs

   scenario fields
     id, category (= path id), level, minutes, icon, tint, title, titleAr,
     place, persona {name, role, roleAr, gender}
     goal      "I can…" statement                     {en, ar}
     mission   what to achieve in this conversation  {en, ar}
     vocab     6 key words / phrases                 [{en, ar}]
     tip       one cultural or language note         {en, ar}
     register  'polite' → coach suggests politer phrasing
     style     'exam' → AI acts as a neutral examiner (live mode)
     turns     the scripted conversation (guided mode) / story beats (live)
     outro     closing line                          {en, ar}

   turn fields
     ai        what the character says              {en, ar}
     keys      words that show the answer is on topic ('#place', '#num',
               '#yesno' are smart sets; phrases with spaces are allowed)
     minWords  accept any answer at least this long (open questions)
     tense     'progressive' → coach expects "I am flying / joining…"
     hint      Arabic nudge + an English sentence starter
     model     a great answer                       {en, ar}
     also      another natural way to say it        {en, ar}
     reprompt  what the character says if the answer was off-topic
     ack       {yes:{en,ar}, no:{en,ar}} reaction to a yes/no answer
     noWords   phrases that count as "no" for ack (e.g. 'too big')

   Voices: every English line here can be pre-recorded by
   tools/build-voice-pack.mjs — no file names to manage.
   ========================================================================== */
(function (root) {
  'use strict';

  /* Lines the coach and characters may say in any scenario. */
  const COMMON = {
    persona: {
      reprompt: { en: 'Sorry, could you say that again?', ar: 'عذراً، هل يمكنك قول ذلك مرة أخرى؟' }
    },
    coach: {
      tryAgain: { en: 'Almost. Listen once more, then try again.', ar: 'قريب جداً. استمع مرة أخرى ثم حاول.' },
      moveOn: { en: "Good effort. Let's keep going.", ar: 'محاولة جيدة. لنكمل.' },
      welcome: { en: "Hi! I'm your speaking coach. Let's practice.", ar: 'أهلاً! أنا مدربك على المحادثة. لنتدرّب.' }
    }
  };

  const SCENARIOS = [
    /* ------------------------------------------------------------ */
    {
      id: 'checkin', category: 'travel', level: 'Beginner', minutes: 4, icon: 'id', tint: '#3B6FE0',
      register: 'polite',
      title: 'Airport check-in', titleAr: 'تسجيل الوصول في المطار',
      place: 'Departures · Check-in desk',
      persona: { name: 'Sarah', role: 'Check-in agent', roleAr: 'موظفة تسجيل الوصول', gender: 'female' },
      mission: {
        en: 'Check in for your flight to Toronto, drop one bag and choose your seat.',
        ar: 'سجّل وصولك لرحلتك إلى تورونتو، وسلّم حقيبتك، واختر مقعدك.'
      },
      turns: [
        {
          ai: { en: "Next, please! Good morning. What's your final destination today?", ar: 'التالي من فضلك! صباح الخير. ما هي وجهتك النهائية اليوم؟' },
          keys: ['#place', 'to', 'travel', 'traveling', 'travelling', 'going', 'destination'], tense: 'progressive',
          hint: { ar: 'اذكر المدينة التي ستصل إليها في النهاية.', starter: "I'm traveling to …" },
          model: { en: "I'm traveling to Toronto.", ar: 'أنا مسافر إلى تورونتو.' },
          also: { en: 'Toronto, with a short stop in Frankfurt.', ar: 'تورونتو، مع توقف قصير في فرانكفورت.' },
          reprompt: { en: 'Sorry, which city are you going to in the end?', ar: 'عذراً، إلى أي مدينة ستصل في النهاية؟' }
        },
        {
          ai: { en: 'Lovely. May I see your passport, please?', ar: 'رائع. هل يمكنني رؤية جواز سفرك من فضلك؟' },
          keys: ['here', 'sure', 'yes', 'of course', 'passport', 'ok', 'course', 'go'],
          hint: { ar: 'أعطها الجواز وقل جملة قصيرة ولطيفة.', starter: 'Sure, here …' },
          model: { en: 'Sure, here you go.', ar: 'بالتأكيد، تفضّلي.' },
          also: { en: 'Of course. Here it is.', ar: 'طبعاً، ها هو.' }
        },
        {
          ai: { en: 'Thank you. How many bags are you checking in today?', ar: 'شكراً لك. كم حقيبة ستشحن اليوم؟' },
          keys: ['#num', 'bag', 'just', 'only', 'none', 'no', 'carry', 'suitcase'],
          hint: { ar: 'قل عدد الحقائب: One bag أو Two bags.', starter: 'Just one …' },
          model: { en: 'Just one bag, please.', ar: 'حقيبة واحدة فقط، من فضلك.' },
          also: { en: 'Two bags, please.', ar: 'حقيبتان، من فضلك.' },
          reprompt: { en: 'Sorry, how many bags do you have?', ar: 'عذراً، كم حقيبة لديك؟' }
        },
        {
          ai: { en: "Please put it on the scale. Thank you, that's twenty-two kilos. Did you pack this bag yourself?", ar: 'ضعها على الميزان من فضلك. شكراً، وزنها اثنان وعشرون كيلو. هل حزمت هذه الحقيبة بنفسك؟' },
          keys: ['#yesno', 'myself', 'packed', 'pack'],
          hint: { ar: 'أجب بنعم وأكمل الجملة بالماضي: packed.', starter: 'Yes, I packed …' },
          model: { en: 'Yes, I packed it myself.', ar: 'نعم، حزمتها بنفسي.' }
        },
        {
          ai: { en: 'Okay. Would you prefer a window seat or an aisle seat?', ar: 'حسناً. هل تفضّل مقعداً بجانب النافذة أم بجانب الممر؟' },
          keys: ['window', 'aisle', 'middle', 'any', 'either', 'matter', 'prefer'],
          hint: { ar: 'اختر: window (النافذة) أو aisle (الممر).', starter: 'A window seat …' },
          model: { en: 'A window seat, please.', ar: 'مقعد بجانب النافذة، من فضلك.' },
          also: { en: "I'd prefer an aisle seat, please.", ar: 'أفضّل مقعداً بجانب الممر، من فضلك.' },
          reprompt: { en: 'Sorry, window or aisle?', ar: 'عذراً، النافذة أم الممر؟' }
        },
        {
          ai: { en: "Here's your boarding pass. Boarding starts at nine forty from gate B twelve. Do you have any questions?", ar: 'تفضّل بطاقة صعودك. يبدأ الصعود الساعة التاسعة وأربعين دقيقة من البوابة B12. هل لديك أي أسئلة؟' },
          keys: ['#yesno', 'what', 'where', 'when', 'time', 'gate', 'lounge', 'thank', 'that'],
          hint: { ar: 'اسأل سؤالاً مثل: أين صالة الانتظار؟ أو قل: لا، شكراً.', starter: 'Where is …' },
          model: { en: 'Where is the lounge, please?', ar: 'أين صالة الانتظار، من فضلك؟' },
          also: { en: "No, that's everything. Thank you!", ar: 'لا، هذا كل شيء. شكراً لك!' }
        }
      ],
      outro: { en: "You're all set. Have a wonderful flight!", ar: 'كل شيء جاهز. رحلة موفّقة!' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'plane', category: 'travel', level: 'Beginner', minutes: 4, icon: 'plane', tint: '#0E8F9C',
      register: 'polite',
      title: 'On the plane', titleAr: 'على متن الطائرة',
      place: 'Cabin · Seat 24A',
      persona: { name: 'Olivia', role: 'Flight attendant', roleAr: 'مضيفة طيران', gender: 'female' },
      mission: {
        en: 'Show your boarding pass, sort out where your bag goes, and order a drink and a meal.',
        ar: 'أظهر بطاقة صعودك، وجد مكاناً لحقيبتك، ثم اطلب مشروباً ووجبة.'
      },
      turns: [
        {
          ai: { en: 'Welcome aboard! May I see your boarding pass, please?', ar: 'أهلاً بك على متن الطائرة! هل يمكنني رؤية بطاقة صعودك من فضلك؟' },
          keys: ['here', 'sure', 'yes', 'of course', 'ok', 'course', 'go', 'pass'],
          hint: { ar: 'أعطها البطاقة وقل جملة قصيرة ولطيفة.', starter: 'Sure, here …' },
          model: { en: 'Sure, here you go.', ar: 'بالتأكيد، تفضّلي.' },
          also: { en: 'Of course. Here it is.', ar: 'طبعاً، ها هي.' }
        },
        {
          ai: { en: "Thank you. You're in twenty-four A, by the window. The lockers above your row are already full. Will your bag fit under the seat in front of you?", ar: 'شكراً لك. مقعدك 24A بجانب النافذة. الخزائن فوق صفّك ممتلئة. هل تتسع حقيبتك تحت المقعد الذي أمامك؟' },
          keys: ['#yesno', 'fit', 'fits', 'big', 'small', 'large', 'space', 'room', 'under', 'bag', 'somewhere', 'locker'],
          hint: { ar: 'قل إن الحقيبة كبيرة واسأل عن مكان آخر، أو قل إنها تتسع.', starter: "I'm afraid it's too …" },
          model: { en: "I'm afraid it's too big. Is there any space somewhere else?", ar: 'للأسف إنها كبيرة جداً. هل توجد مساحة في مكان آخر؟' },
          also: { en: "Yes, it's small. It'll fit under the seat.", ar: 'نعم، إنها صغيرة. ستتسع تحت المقعد.' },
          noWords: ['too big', 'too large', 'not fit', 'any space', 'somewhere else'],
          ack: {
            no: { en: "No problem. I'll find a space for it near the front.", ar: 'لا مشكلة. سأجد لها مكاناً قرب المقدمة.' },
            yes: { en: 'Perfect, thank you.', ar: 'ممتاز، شكراً لك.' }
          }
        },
        {
          ai: { en: 'Would you like something to drink after take-off? We have water, juice, coffee and tea.', ar: 'هل تودّ شيئاً لتشربه بعد الإقلاع؟ لدينا ماء وعصير وقهوة وشاي.' },
          keys: ['water', 'juice', 'coffee', 'tea', 'orange', 'apple', 'please', 'nothing', 'have', 'like'],
          hint: { ar: 'اطلب مشروباً بلطف: Could I have…, please?', starter: 'Could I have …' },
          model: { en: 'Could I have an orange juice, please?', ar: 'هل يمكنني الحصول على عصير برتقال، من فضلك؟' },
          also: { en: 'Just water for me, thanks.', ar: 'ماء فقط، شكراً.' }
        },
        {
          ai: { en: 'Of course. And for dinner, would you like chicken or pasta?', ar: 'بالتأكيد. وللعشاء، هل تفضّل الدجاج أم المعكرونة؟' },
          keys: ['chicken', 'pasta', 'vegetarian', 'either', 'please', 'like', 'have'],
          hint: { ar: 'اختر وجبة وقل: I’d like the…, please.', starter: "I'd like the …" },
          model: { en: "I'd like the chicken, please.", ar: 'أريد الدجاج، من فضلك.' },
          also: { en: "I'll have the pasta, please.", ar: 'سآخذ المعكرونة، من فضلك.' },
          reprompt: { en: 'Sorry, chicken or pasta?', ar: 'عذراً، الدجاج أم المعكرونة؟' }
        },
        {
          ai: { en: 'Great choice. Is there anything else I can get for you?', ar: 'اختيار رائع. هل هناك أي شيء آخر يمكنني إحضاره لك؟' },
          keys: ['#yesno', 'blanket', 'pillow', 'water', 'headphones', 'fine', 'thank', 'that'],
          hint: { ar: 'اطلب بطانية أو وسادة، أو قل إنك بخير.', starter: 'Could I have a blanket …' },
          model: { en: "Could I have a blanket, please? It's a bit cold.", ar: 'هل يمكنني الحصول على بطانية، من فضلك؟ الجو بارد قليلاً.' },
          also: { en: "No, I'm fine. Thank you.", ar: 'لا، أنا بخير. شكراً لك.' }
        }
      ],
      outro: { en: 'No problem. Sit back, relax and enjoy the flight!', ar: 'لا مشكلة. استرخِ واستمتع برحلتك!' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'immigration', category: 'travel', level: 'Intermediate', minutes: 4, icon: 'passport', tint: '#5B5BD6',
      title: 'Passport control', titleAr: 'الجوازات',
      place: 'Arrivals · Border control',
      persona: { name: 'James', role: 'Border officer', roleAr: 'ضابط الجوازات', gender: 'male' },
      mission: {
        en: 'Answer the officer’s questions clearly: why you’re here, how long, and where you’ll stay.',
        ar: 'أجب عن أسئلة الضابط بوضوح: سبب زيارتك، ومدتها، وأين ستقيم.'
      },
      turns: [
        {
          ai: { en: "Good afternoon. Passport, please. What's the purpose of your visit?", ar: 'مساء الخير. جواز السفر من فضلك. ما هو غرض زيارتك؟' },
          keys: ['vacation', 'holiday', 'business', 'work', 'visit', 'tourism', 'tourist', 'study', 'conference', 'meeting', 'family', 'friend', 'here for', 'trip'],
          hint: { ar: 'قل سبب زيارتك: إجازة (vacation) أو عمل (business).', starter: "I'm here on …" },
          model: { en: "I'm here on vacation.", ar: 'أنا هنا في إجازة.' },
          also: { en: "I'm here for a business meeting.", ar: 'أنا هنا لحضور اجتماع عمل.' },
          reprompt: { en: 'Are you here for business or for a holiday?', ar: 'هل أنت هنا للعمل أم في إجازة؟' }
        },
        {
          ai: { en: 'How long are you planning to stay?', ar: 'كم من الوقت تخطط للبقاء؟' },
          keys: ['#num', 'week', 'day', 'month', 'night', 'for', 'until', 'few', 'couple'],
          hint: { ar: 'اذكر المدة مع for: for ten days.', starter: "I'm staying for …" },
          model: { en: "I'm staying for two weeks.", ar: 'سأبقى لمدة أسبوعين.' },
          also: { en: 'Just ten days.', ar: 'عشرة أيام فقط.' }
        },
        {
          ai: { en: 'And where will you be staying?', ar: 'وأين ستقيم؟' },
          keys: ['hotel', 'friend', 'apartment', 'family', 'house', 'home', 'staying', 'at', 'with', 'cousin', 'brother', 'uncle'],
          hint: { ar: 'قل أين ستقيم: at a hotel أو with my friend.', starter: "I'm staying at …" },
          model: { en: "I'm staying at a hotel in the city center.", ar: 'سأقيم في فندق في وسط المدينة.' },
          also: { en: "I'm staying with my cousin.", ar: 'سأقيم عند ابن عمي.' }
        },
        {
          ai: { en: 'Is this your first time visiting the country?', ar: 'هل هذه أول زيارة لك إلى هذا البلد؟' },
          keys: ['#yesno', 'first', 'time', 'before', 'last', 'came', 'been'],
          hint: { ar: 'أجب بنعم أو لا. إذا زرته سابقاً قل متى: I came here… ago.', starter: "Yes, it's my …" },
          model: { en: "Yes, it's my first time.", ar: 'نعم، إنها المرة الأولى.' },
          also: { en: 'No, I came here two years ago.', ar: 'لا، جئت إلى هنا قبل سنتين.' }
        },
        {
          ai: { en: 'Do you have a return ticket?', ar: 'هل لديك تذكرة عودة؟' },
          keys: ['#yesno', 'ticket', 'return', 'back', 'flying', 'leave'],
          hint: { ar: 'قل نعم واذكر موعد العودة: I’m flying back on…', starter: "Yes, I'm flying back on …" },
          model: { en: "Yes, I'm flying back on the twentieth.", ar: 'نعم، سأعود بالطائرة يوم العشرين.' }
        }
      ],
      outro: { en: 'Everything looks fine. Welcome, and enjoy your stay.', ar: 'كل شيء على ما يرام. أهلاً بك، واستمتع بإقامتك.' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'hotel', category: 'travel', level: 'Intermediate', minutes: 4, icon: 'bed', tint: '#B4572E',
      register: 'polite',
      title: 'Hotel check-in', titleAr: 'تسجيل الدخول في الفندق',
      place: 'Harbor View Hotel · Reception',
      persona: { name: 'Daniel', role: 'Receptionist', roleAr: 'موظف الاستقبال', gender: 'male' },
      mission: {
        en: 'Check in to your room, confirm your booking and ask about breakfast and Wi-Fi.',
        ar: 'سجّل دخولك إلى غرفتك، وأكّد حجزك، واسأل عن الإفطار والواي فاي.'
      },
      turns: [
        {
          ai: { en: 'Good evening, and welcome to the Harbor View Hotel. How can I help you?', ar: 'مساء الخير، وأهلاً بك في فندق هاربر فيو. كيف يمكنني مساعدتك؟' },
          keys: ['reservation', 'booking', 'booked', 'check', 'room', 'name', 'under'],
          hint: { ar: 'أخبره أن لديك حجزاً واذكر اسمك.', starter: 'I have a reservation under …' },
          model: { en: 'Hi, I have a reservation under the name Ahmed.', ar: 'مرحباً، لديّ حجز باسم أحمد.' },
          also: { en: "Hi, I'd like to check in, please.", ar: 'مرحباً، أودّ تسجيل الدخول، من فضلك.' }
        },
        {
          ai: { en: 'Let me check. Yes, here it is: three nights in a double room. Is that correct?', ar: 'دعني أتحقق. نعم، ها هو: ثلاث ليالٍ في غرفة مزدوجة. هل هذا صحيح؟' },
          keys: ['#yesno', 'right', 'correct', 'exactly', 'perfect', 'nights', 'room'],
          hint: { ar: 'أكّد الحجز: That’s right.', starter: "Yes, that's …" },
          model: { en: "Yes, that's right.", ar: 'نعم، هذا صحيح.' },
          also: { en: 'Actually, I booked four nights.', ar: 'في الحقيقة، حجزت أربع ليالٍ.' }
        },
        {
          ai: { en: 'Could I see your ID and the card you used for the booking?', ar: 'هل يمكنني رؤية هويتك والبطاقة التي استخدمتها للحجز؟' },
          keys: ['here', 'sure', 'yes', 'of course', 'card', 'passport', 'ok', 'course', 'go'],
          hint: { ar: 'أعطه الهوية والبطاقة وقل جملة لطيفة.', starter: 'Sure, here …' },
          model: { en: 'Sure, here you are.', ar: 'بالتأكيد، تفضّل.' }
        },
        {
          ai: { en: 'Breakfast is served from seven to ten thirty. Would you like to add it for twenty dollars a day?', ar: 'يُقدَّم الإفطار من السابعة حتى العاشرة والنصف. هل تودّ إضافته مقابل عشرين دولاراً في اليوم؟' },
          keys: ['#yesno', 'breakfast', 'add', 'buffet'],
          hint: { ar: 'أجب بنعم أو لا، ويمكنك أن تسأل: Is it a buffet?', starter: 'Yes, please. Is it …' },
          model: { en: 'Yes, please. Is it a buffet?', ar: 'نعم، من فضلك. هل هو بوفيه مفتوح؟' },
          also: { en: "No, thank you. I'll eat outside.", ar: 'لا، شكراً. سآكل في الخارج.' },
          ack: {
            yes: { en: "Perfect, I've added breakfast. It's a full buffet.", ar: 'ممتاز، أضفت الإفطار. إنه بوفيه مفتوح.' },
            no: { en: 'No problem at all.', ar: 'لا مشكلة إطلاقاً.' }
          }
        },
        {
          ai: { en: "You're in room five twelve, on the fifth floor. Is there anything else you need?", ar: 'غرفتك رقم 512 في الطابق الخامس. هل تحتاج إلى أي شيء آخر؟' },
          keys: ['#yesno', 'wifi', 'wi', 'password', 'check', 'late', 'checkout', 'pool', 'gym', 'what', 'where', 'time', 'thank', 'that'],
          hint: { ar: 'اسأل عن كلمة مرور الواي فاي أو موعد المغادرة.', starter: "What's the Wi-Fi …" },
          model: { en: "What's the Wi-Fi password, please?", ar: 'ما هي كلمة مرور الواي فاي، من فضلك؟' },
          also: { en: 'Could I get a late check-out on Friday, please?', ar: 'هل يمكنني تأخير موعد المغادرة يوم الجمعة؟' }
        }
      ],
      outro: { en: "Of course. It's all on the card with your key. Enjoy your stay!", ar: 'بالتأكيد. كل التفاصيل على البطاقة مع مفتاحك. نتمنى لك إقامة ممتعة!' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'taxi', category: 'travel', level: 'Beginner', minutes: 3, icon: 'car', tint: '#C08A12',
      title: 'Taking a taxi', titleAr: 'ركوب سيارة أجرة',
      place: 'Airport · Taxi rank',
      persona: { name: 'Mark', role: 'Taxi driver', roleAr: 'سائق أجرة', gender: 'male' },
      mission: {
        en: 'Tell the driver where to go, chat a little on the way and pay at the end.',
        ar: 'أخبر السائق بوجهتك، ودردش قليلاً في الطريق، وادفع عند الوصول.'
      },
      turns: [
        {
          ai: { en: 'Hi there! Where to?', ar: 'أهلاً! إلى أين؟' },
          keys: ['#place', 'to', 'hotel', 'airport', 'street', 'center', 'centre', 'mall', 'station', 'downtown', 'please'],
          hint: { ar: 'قل وجهتك مع to: To the airport, please.', starter: 'To the …, please.' },
          model: { en: 'To the Grand Plaza Hotel, please.', ar: 'إلى فندق جراند بلازا، من فضلك.' },
          also: { en: 'Could you take me to the city center, please?', ar: 'هل يمكنك أن توصلني إلى وسط المدينة، من فضلك؟' },
          reprompt: { en: 'Sorry, where would you like to go?', ar: 'عذراً، إلى أين تريد الذهاب؟' }
        },
        {
          ai: { en: "No problem. Should I take the highway? It's faster, but there's a small toll.", ar: 'لا مشكلة. هل آخذ الطريق السريع؟ إنه أسرع، لكن عليه رسوم بسيطة.' },
          keys: ['#yesno', 'highway', 'fine', 'faster', 'toll', 'normal', 'road', 'whatever', 'best'],
          hint: { ar: 'أجب بنعم أو لا: The highway is fine.', starter: 'Yes, the highway …' },
          model: { en: 'Yes, the highway is fine.', ar: 'نعم، الطريق السريع مناسب.' },
          also: { en: "No, let's take the normal road, please.", ar: 'لا، لنأخذ الطريق العادي من فضلك.' }
        },
        {
          ai: { en: 'Is this your first time in the city?', ar: 'هل هذه أول مرة تزور فيها المدينة؟' },
          keys: ['#yesno', 'first', 'time', 'before', 'last', 'came', 'been', 'visited'],
          hint: { ar: 'أجب وأضف معلومة صغيرة.', starter: "Yes, it's my first …" },
          model: { en: "Yes, it's my first time here.", ar: 'نعم، هذه أول مرة لي هنا.' },
          also: { en: 'No, I visited last year.', ar: 'لا، زرتها العام الماضي.' }
        },
        {
          ai: { en: 'Nice! What brings you here?', ar: 'جميل! ما الذي أتى بك إلى هنا؟' },
          keys: ['work', 'business', 'visit', 'vacation', 'holiday', 'friend', 'family', 'conference', 'meeting', 'study', 'here for', 'trip', 'tourism'],
          hint: { ar: 'قل سبب رحلتك: I’m here for work.', starter: "I'm here for …" },
          model: { en: "I'm here for work, but I hope to see the city too.", ar: 'أنا هنا للعمل، لكنني آمل أن أرى المدينة أيضاً.' },
          also: { en: "I'm visiting a friend.", ar: 'أنا في زيارة لصديق.' }
        },
        {
          ai: { en: "Here we are. That's thirty-two dollars.", ar: 'وصلنا. الأجرة اثنان وثلاثون دولاراً.' },
          keys: ['here', 'card', 'cash', 'pay', 'keep', 'change', 'thank', 'receipt', 'go'],
          hint: { ar: 'ادفع وقل جملة لطيفة، أو اسأل عن الدفع بالبطاقة.', starter: 'Here you go …' },
          model: { en: 'Here you go. Keep the change.', ar: 'تفضّل. احتفظ بالباقي.' },
          also: { en: 'Can I pay by card, please?', ar: 'هل يمكنني الدفع بالبطاقة، من فضلك؟' }
        }
      ],
      outro: { en: 'Thank you! Enjoy your time in the city.', ar: 'شكراً لك! استمتع بوقتك في المدينة.' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'cafe', category: 'daily', level: 'Beginner', minutes: 3, icon: 'coffee', tint: '#8A5A3C',
      register: 'polite',
      title: 'Ordering coffee', titleAr: 'طلب القهوة',
      place: 'Corner café · Counter',
      persona: { name: 'Mia', role: 'Barista', roleAr: 'باريستا', gender: 'female' },
      mission: {
        en: 'Order a drink and something to eat, then pay — politely and naturally.',
        ar: 'اطلب مشروباً وشيئاً للأكل ثم ادفع، بأسلوب لطيف وطبيعي.'
      },
      turns: [
        {
          ai: { en: 'Hi there! What can I get for you today?', ar: 'أهلاً! ماذا أحضّر لك اليوم؟' },
          keys: ['coffee', 'latte', 'cappuccino', 'espresso', 'tea', 'americano', 'flat', 'mocha', 'water', 'juice', 'chocolate', 'could', 'can', 'like', 'have', 'get'],
          hint: { ar: 'اطلب مشروبك بلطف: Could I have…, please?', starter: 'Could I have …' },
          model: { en: 'Could I have a large latte, please?', ar: 'هل يمكنني الحصول على لاتيه كبير، من فضلك؟' },
          also: { en: "I'd like a cappuccino, please.", ar: 'أودّ كابتشينو، من فضلك.' }
        },
        {
          ai: { en: 'Sure. What kind of milk would you like? We have regular, oat and almond.', ar: 'بالتأكيد. أي نوع من الحليب تفضّل؟ لدينا العادي والشوفان واللوز.' },
          keys: ['regular', 'normal', 'oat', 'almond', 'soy', 'milk', 'without', 'any'],
          hint: { ar: 'اختر نوع الحليب وأضف please.', starter: 'Oat milk …' },
          model: { en: 'Oat milk, please.', ar: 'حليب الشوفان، من فضلك.' },
          also: { en: 'Regular milk is fine, thanks.', ar: 'الحليب العادي مناسب، شكراً.' }
        },
        {
          ai: { en: 'Would you like anything to eat with that?', ar: 'هل تودّ شيئاً لتأكله معه؟' },
          keys: ['#yesno', 'croissant', 'cake', 'muffin', 'cookie', 'sandwich', 'that', 'all', 'have'],
          hint: { ar: 'اطلب شيئاً: I’ll have a…، أو قل: That’s all.', starter: "Yes, I'll have …" },
          model: { en: "Yes, I'll have a chocolate croissant.", ar: 'نعم، سآخذ كرواسون بالشوكولاتة.' },
          also: { en: "No, that's all, thanks.", ar: 'لا، هذا كل شيء، شكراً.' }
        },
        {
          ai: { en: 'Is that for here or to go?', ar: 'هل تريده هنا أم سفري؟' },
          keys: ['here', 'go', 'take', 'away', 'takeaway', 'stay', 'sit'],
          hint: { ar: 'for here = ستبقى في المقهى، to go = ستأخذه معك.', starter: 'For here …' },
          model: { en: 'For here, please.', ar: 'هنا، من فضلك.' },
          also: { en: 'To go, please.', ar: 'سفري، من فضلك.' },
          reprompt: { en: 'Sorry, for here or to go?', ar: 'عذراً، هنا أم سفري؟' }
        },
        {
          ai: { en: "That's eight fifty. How would you like to pay?", ar: 'المبلغ ثمانية دولارات وخمسون سنتاً. كيف تودّ أن تدفع؟' },
          keys: ['card', 'cash', 'phone', 'pay', 'visa', 'credit', 'debit'],
          hint: { ar: 'قل طريقة الدفع: by card أو in cash.', starter: 'By card …' },
          model: { en: 'By card, please.', ar: 'بالبطاقة، من فضلك.' },
          also: { en: 'Can I pay by phone, please?', ar: 'هل يمكنني الدفع بالهاتف؟' }
        }
      ],
      outro: { en: 'All done. Your order will be ready at the end of the counter. Have a lovely day!', ar: 'تم. سيكون طلبك جاهزاً في نهاية الكاونتر. أتمنى لك يوماً جميلاً!' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'pharmacy', category: 'daily', level: 'Intermediate', minutes: 4, icon: 'pill', tint: '#1F9D6B',
      title: 'At the pharmacy', titleAr: 'في الصيدلية',
      place: 'City pharmacy · Counter',
      persona: { name: 'Nora', role: 'Pharmacist', roleAr: 'صيدلانية', gender: 'female' },
      mission: {
        en: 'Describe how you feel, say how long it has lasted and ask how to take the medicine.',
        ar: 'صِف ما تشعر به، وكم استمر، واسأل عن طريقة أخذ الدواء.'
      },
      turns: [
        {
          ai: { en: 'Hello! How can I help you today?', ar: 'مرحباً! كيف يمكنني مساعدتك اليوم؟' },
          keys: ['headache', 'throat', 'cold', 'cough', 'fever', 'pain', 'sick', 'medicine', 'something', 'need', 'feel', 'stomach', 'allergy', 'flu'],
          hint: { ar: 'صِف ما تشعر به باستخدام I have a…', starter: 'I have a …' },
          model: { en: 'Hi. I have a sore throat and a headache.', ar: 'مرحباً. أعاني من التهاب في الحلق وصداع.' },
          also: { en: "I think I'm getting a cold.", ar: 'أظن أنني مصاب بالزكام.' }
        },
        {
          ai: { en: "I'm sorry to hear that. How long have you had these symptoms?", ar: 'يؤسفني سماع ذلك. منذ متى تعاني من هذه الأعراض؟' },
          keys: ['#num', 'day', 'week', 'since', 'yesterday', 'morning', 'for', 'few', 'couple', 'night'],
          hint: { ar: 'للمدة استخدم for (for two days)، ولنقطة البداية since (since Monday).', starter: 'For …' },
          model: { en: 'For two days.', ar: 'منذ يومين.' },
          also: { en: 'Since yesterday morning.', ar: 'منذ صباح أمس.' }
        },
        {
          ai: { en: 'Do you have a fever?', ar: 'هل لديك حرارة؟' },
          keys: ['#yesno', 'fever', 'temperature', 'little', 'bit', 'think'],
          hint: { ar: 'أجب بنعم أو لا.', starter: 'Yes, a little …' },
          model: { en: 'Yes, a little.', ar: 'نعم، قليلاً.' },
          also: { en: "No, I don't think so.", ar: 'لا، لا أظن ذلك.' }
        },
        {
          ai: { en: 'Are you allergic to any medicine?', ar: 'هل لديك حساسية من أي دواء؟' },
          keys: ['#yesno', 'allergic', 'penicillin', 'allergy', 'anything', 'medicine'],
          hint: { ar: 'استخدم allergic to: I’m not allergic to anything.', starter: "No, I'm not allergic …" },
          model: { en: "No, I'm not allergic to anything.", ar: 'لا، ليست لديّ حساسية من أي شيء.' },
          also: { en: "Yes, I'm allergic to penicillin.", ar: 'نعم، لديّ حساسية من البنسلين.' }
        },
        {
          ai: { en: 'Okay. Take these lozenges for your throat, and these tablets are for the headache. Do you have any questions?', ar: 'حسناً. خذ هذه الأقراص للحلق، وهذه الحبوب للصداع. هل لديك أي أسئلة؟' },
          keys: ['#yesno', 'how', 'many', 'often', 'take', 'times', 'day', 'food', 'thank', 'that', 'when'],
          hint: { ar: 'اسأل كم مرة تأخذ الدواء في اليوم.', starter: 'How many tablets …' },
          model: { en: 'How many tablets should I take a day?', ar: 'كم قرصاً يجب أن آخذ في اليوم؟' },
          also: { en: "No, that's clear. Thank you.", ar: 'لا، الأمر واضح. شكراً لك.' }
        }
      ],
      outro: { en: 'One tablet every six hours, after food. I hope you feel better soon!', ar: 'قرص واحد كل ست ساعات بعد الأكل. أتمنى لك الشفاء العاجل!' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'shop', category: 'daily', level: 'Intermediate', minutes: 4, icon: 'bag', tint: '#C2417A',
      register: 'polite',
      title: 'Returning an item', titleAr: 'إرجاع مشتريات',
      place: 'Clothing store · Customer service',
      persona: { name: 'Chloe', role: 'Sales assistant', roleAr: 'موظفة مبيعات', gender: 'female' },
      mission: {
        en: 'Return a jacket that doesn’t fit, explain the problem and exchange it.',
        ar: 'أرجِع جاكيت لا يناسبك، واشرح المشكلة، واستبدله.'
      },
      turns: [
        {
          ai: { en: 'Hi! How can I help you today?', ar: 'أهلاً! كيف يمكنني مساعدتك اليوم؟' },
          keys: ['return', 'exchange', 'refund', 'jacket', 'bought', 'change', 'size'],
          hint: { ar: 'قل إنك تريد إرجاع شيء.', starter: "I'd like to return …" },
          model: { en: "Hi, I'd like to return this jacket.", ar: 'مرحباً، أودّ إرجاع هذا الجاكيت.' },
          also: { en: 'Hi, can I exchange this jacket?', ar: 'مرحباً، هل يمكنني استبدال هذا الجاكيت؟' }
        },
        {
          ai: { en: 'Sure. Is there something wrong with it?', ar: 'بالتأكيد. هل توجد مشكلة فيه؟' },
          keys: ['small', 'big', 'large', 'tight', 'size', 'fit', 'color', 'colour', 'broken', 'damaged', 'like', 'wrong', 'problem', 'hole', 'zip'],
          hint: { ar: 'اشرح المشكلة: It’s too small / The zip is broken.', starter: "It's too …" },
          model: { en: "It's too small for me.", ar: 'إنه صغير جداً عليّ.' },
          also: { en: 'The zip is broken.', ar: 'السحّاب مكسور.' }
        },
        {
          ai: { en: 'Do you have the receipt?', ar: 'هل معك الإيصال؟' },
          keys: ['#yesno', 'receipt', 'here', 'phone', 'email'],
          hint: { ar: 'أجب بنعم وأعطها الإيصال.', starter: 'Yes, here …' },
          model: { en: 'Yes, here it is.', ar: 'نعم، ها هو.' },
          also: { en: 'Yes, I have it on my phone.', ar: 'نعم، إنه على هاتفي.' }
        },
        {
          ai: { en: 'Thanks. Would you like a refund, or would you like to exchange it for a different size?', ar: 'شكراً. هل تريد استرداد المبلغ، أم تودّ استبداله بمقاس آخر؟' },
          keys: ['refund', 'exchange', 'size', 'large', 'bigger', 'money', 'back', 'change', 'medium'],
          hint: { ar: 'اختر: refund (استرداد) أو exchange (استبدال).', starter: 'Could I exchange it for …' },
          model: { en: 'Could I exchange it for a large, please?', ar: 'هل يمكنني استبداله بمقاس كبير، من فضلك؟' },
          also: { en: "I'd prefer a refund, please.", ar: 'أفضّل استرداد المبلغ، من فضلك.' }
        },
        {
          ai: { en: 'Let me check. Yes, we have it in large. Would you like to try it on?', ar: 'دعني أتحقق. نعم، لدينا المقاس الكبير. هل تودّ تجربته؟' },
          keys: ['#yesno', 'try', 'fitting', 'room', 'where', 'sure'],
          hint: { ar: 'وافق واسأل عن غرفة القياس.', starter: 'Yes, please. Where is …' },
          model: { en: 'Yes, please. Where is the fitting room?', ar: 'نعم، من فضلك. أين غرفة القياس؟' }
        }
      ],
      outro: { en: "It's just over there, on the left. Take your time!", ar: 'إنها هناك على اليسار. خذ وقتك!' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'colleague', category: 'work', level: 'Intermediate', minutes: 4, icon: 'users', tint: '#7A4FD6',
      title: 'Meeting a new colleague', titleAr: 'التعرّف على زميل جديد',
      place: 'Office · Coffee corner',
      persona: { name: 'Rachel', role: 'Marketing lead', roleAr: 'زميلة من فريق التسويق', gender: 'female' },
      mission: {
        en: 'Introduce yourself on your first day, talk about your background and accept an invitation.',
        ar: 'عرّف بنفسك في يومك الأول، وتحدّث عن خبرتك السابقة، واقبل دعوة.'
      },
      turns: [
        {
          ai: { en: "Hi! You must be new here. I'm Rachel from the marketing team. What's your name?", ar: 'مرحباً! لا بد أنك جديد هنا. أنا رايتشل من فريق التسويق. ما اسمك؟' },
          keys: ['name', 'i am', 'call me', 'nice', 'meet', 'hi', 'hello'],
          hint: { ar: 'عرّف بنفسك بجملة لطيفة.', starter: "Nice to meet you. I'm …" },
          model: { en: "Nice to meet you, Rachel. I'm Khalid.", ar: 'سعدت بلقائك يا رايتشل. أنا خالد.' },
          also: { en: 'Hi Rachel, my name is Khalid. I just started today.', ar: 'مرحباً رايتشل، اسمي خالد. بدأت العمل اليوم.' }
        },
        {
          ai: { en: 'Nice to meet you too! Which team are you joining?', ar: 'سعدت بلقائك أيضاً! إلى أي فريق ستنضم؟' },
          keys: ['team', 'joining', 'join', 'finance', 'sales', 'marketing', 'hr', 'engineering', 'design', 'operations', 'department', 'it'],
          tense: 'progressive',
          hint: { ar: 'استخدم I’m joining the… team.', starter: "I'm joining the …" },
          model: { en: "I'm joining the finance team.", ar: 'سأنضم إلى فريق المالية.' }
        },
        {
          ai: { en: 'Oh, great. Where were you working before?', ar: 'رائع. أين كنت تعمل من قبل؟' },
          keys: ['worked', 'work', 'bank', 'company', 'was', 'before', 'years', 'student', 'university', 'graduated'],
          hint: { ar: 'تحدّث بالماضي: I worked at… for… years.', starter: 'I worked at …' },
          model: { en: 'I worked at a bank in Riyadh for three years.', ar: 'عملت في بنك في الرياض لمدة ثلاث سنوات.' },
          also: { en: 'I was at a consulting firm in Jeddah.', ar: 'كنت أعمل في شركة استشارات في جدة.' }
        },
        {
          ai: { en: 'Interesting! And how do you get to the office every day?', ar: 'مثير للاهتمام! وكيف تأتي إلى المكتب كل يوم؟' },
          keys: ['drive', 'car', 'metro', 'bus', 'taxi', 'walk', 'train', 'usually', 'take', 'by', 'come'],
          hint: { ar: 'استخدم المضارع البسيط للعادات: I usually drive.', starter: 'I usually …' },
          model: { en: 'I usually drive, but sometimes I take the metro.', ar: 'عادةً أقود السيارة، لكن أحياناً أستقل المترو.' }
        },
        {
          ai: { en: 'Some of us have lunch together on Thursdays. Would you like to join us?', ar: 'بعضنا يتناول الغداء معاً أيام الخميس. هل تودّ الانضمام إلينا؟' },
          keys: ['#yesno', 'love', 'join', 'great', 'thank', 'sounds'],
          hint: { ar: 'اقبل الدعوة واشكرها.', starter: "I'd love to …" },
          model: { en: "I'd love to. Thanks for inviting me!", ar: 'يسعدني ذلك. شكراً على الدعوة!' },
          also: { en: 'That sounds great. Count me in!', ar: 'يبدو ذلك رائعاً. احسبني معكم!' }
        }
      ],
      outro: { en: 'Great! See you on Thursday, then.', ar: 'رائع! أراك يوم الخميس إذن.' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'interview', category: 'work', level: 'Advanced', minutes: 6, icon: 'briefcase', tint: '#2F4A7A',
      title: 'Job interview', titleAr: 'مقابلة عمل',
      place: 'Head office · Meeting room 3',
      persona: { name: 'Michael', role: 'Hiring manager', roleAr: 'مدير التوظيف', gender: 'male' },
      mission: {
        en: 'Talk about yourself, your experience and your strengths — in full, confident sentences.',
        ar: 'تحدّث عن نفسك وخبرتك ونقاط قوتك بجمل كاملة وواثقة.'
      },
      turns: [
        {
          ai: { en: "Thanks for coming in today. Let's start with you. Can you tell me a little about yourself?", ar: 'شكراً لحضورك اليوم. لنبدأ بك. هل يمكنك أن تحدثني قليلاً عن نفسك؟' },
          minWords: 5,
          hint: { ar: 'اذكر وظيفتك وسنوات خبرتك ومجالك.', starter: "I'm a … with … years of experience in …" },
          model: { en: "Sure. I'm a project coordinator with five years of experience in construction.", ar: 'بالتأكيد. أنا منسّق مشاريع ولديّ خمس سنوات من الخبرة في مجال البناء.' }
        },
        {
          ai: { en: 'What do you enjoy most about your work?', ar: 'ما أكثر ما تستمتع به في عملك؟' },
          minWords: 4, keys: ['enjoy', 'like', 'love', 'working', 'solving', 'people', 'team', 'learning'],
          hint: { ar: 'استخدم enjoy + فعل بـ ing.', starter: 'I enjoy …ing' },
          model: { en: 'I enjoy solving problems and working with people.', ar: 'أستمتع بحل المشكلات والعمل مع الناس.' }
        },
        {
          ai: { en: 'Tell me about a challenge you faced at work and how you handled it.', ar: 'حدّثني عن تحدٍّ واجهته في العمل وكيف تعاملت معه.' },
          minWords: 6,
          hint: { ar: 'احكِ القصة بالماضي: Last year we had… so I… and we…', starter: 'Last year, we had …' },
          model: { en: 'Last year we had a very tight deadline, so I reorganized the plan and we finished on time.', ar: 'في العام الماضي كان لدينا موعد نهائي ضيق جداً، فأعدت تنظيم الخطة وأنهينا العمل في الوقت المحدد.' }
        },
        {
          ai: { en: 'Why do you want to work with us?', ar: 'لماذا تريد العمل معنا؟' },
          minWords: 5, keys: ['because', 'company', 'grow', 'growing', 'team', 'learn', 'mission', 'reputation'],
          hint: { ar: 'ابدأ بـ Because واذكر سبباً عن الشركة وسبباً عنك.', starter: 'Because your company …' },
          model: { en: 'Because your company is growing fast, and I want to grow with it.', ar: 'لأن شركتكم تنمو بسرعة، وأريد أن أنمو معها.' }
        },
        {
          ai: { en: 'What would you say is your biggest strength?', ar: 'ما الذي تعتبره أكبر نقاط قوتك؟' },
          minWords: 4, keys: ['organized', 'organised', 'calm', 'communicate', 'leader', 'hard', 'detail', 'strength', 'team', 'problem'],
          hint: { ar: 'اذكر صفة ودليلاً قصيراً عليها.', starter: "I'm very …, and I …" },
          model: { en: "I'm very organized, and I stay calm under pressure.", ar: 'أنا منظّم جداً، وأبقى هادئاً تحت الضغط.' }
        },
        {
          ai: { en: 'Do you have any questions for me?', ar: 'هل لديك أي أسئلة لي؟' },
          keys: ['#yesno', 'what', 'how', 'when', 'team', 'role', 'day', 'next', 'question'],
          hint: { ar: 'اسأل سؤالاً ذكياً عن الوظيفة.', starter: 'What does a typical day …' },
          model: { en: 'Yes. What does a typical day look like in this role?', ar: 'نعم. كيف يبدو اليوم المعتاد في هذه الوظيفة؟' },
          also: { en: 'What are the next steps in the process?', ar: 'ما هي الخطوات التالية في عملية التوظيف؟' }
        }
      ],
      outro: { en: "Great question. I'll walk you through it. Thanks again, and we'll be in touch next week.", ar: 'سؤال رائع، سأشرح لك ذلك. شكراً مجدداً، وسنتواصل معك الأسبوع القادم.' }
    }
  ];

  /* ------------------------------------------------------------------ *
   * Goals, key words and cultural notes for the original ten role-plays
   * ------------------------------------------------------------------ */
  const EXTRAS = {
    checkin: {
      goal: { en: 'I can check in for a flight, drop a bag and choose a seat.', ar: 'أستطيع تسجيل الوصول للرحلة وتسليم الحقيبة واختيار المقعد.' },
      vocab: [{ en: 'boarding pass', ar: 'بطاقة صعود' }, { en: 'check in a bag', ar: 'يشحن حقيبة' }, { en: 'window seat', ar: 'مقعد بجانب النافذة' },
        { en: 'aisle seat', ar: 'مقعد بجانب الممر' }, { en: 'gate', ar: 'بوابة' }, { en: 'boarding', ar: 'الصعود إلى الطائرة' }],
      tip: { en: 'Say "aisle" like "I\'ll": the s is silent.', ar: 'تُنطق aisle مثل I\'ll، وحرف s صامت.' }
    },
    plane: {
      goal: { en: 'I can talk to cabin crew and order a drink and a meal.', ar: 'أستطيع التحدث مع طاقم الطائرة وطلب مشروب ووجبة.' },
      vocab: [{ en: 'overhead locker', ar: 'الخزانة العلوية' }, { en: 'take-off', ar: 'الإقلاع' }, { en: 'blanket', ar: 'بطانية' },
        { en: "I'd like…", ar: 'أودّ…' }, { en: 'Could I have…?', ar: 'هل يمكنني الحصول على…؟' }, { en: 'turbulence', ar: 'مطبات هوائية' }],
      tip: { en: 'On a plane, "Could I have…, please?" is the most natural way to ask for anything.', ar: 'على الطائرة، عبارة Could I have…, please? هي الطريقة الأكثر طبيعية لطلب أي شيء.' }
    },
    immigration: {
      goal: { en: 'I can answer border questions clearly and confidently.', ar: 'أستطيع الإجابة عن أسئلة الجوازات بوضوح وثقة.' },
      vocab: [{ en: 'purpose of your visit', ar: 'غرض الزيارة' }, { en: 'on vacation', ar: 'في إجازة' }, { en: 'staying at', ar: 'مقيم في' },
        { en: 'return ticket', ar: 'تذكرة عودة' }, { en: 'for two weeks', ar: 'لمدة أسبوعين' }, { en: 'business trip', ar: 'رحلة عمل' }],
      tip: { en: 'At passport control, short and clear answers are best. Answer the question you were asked.', ar: 'في الجوازات، الإجابات القصيرة والواضحة هي الأفضل. أجب عن السؤال المطروح فقط.' }
    },
    hotel: {
      goal: { en: 'I can check in to a hotel and ask about its services.', ar: 'أستطيع تسجيل الدخول في الفندق والسؤال عن خدماته.' },
      vocab: [{ en: 'reservation', ar: 'حجز' }, { en: 'double room', ar: 'غرفة مزدوجة' }, { en: 'check-out', ar: 'موعد المغادرة' },
        { en: 'late check-out', ar: 'تأخير المغادرة' }, { en: 'breakfast included', ar: 'شامل الإفطار' }, { en: 'key card', ar: 'بطاقة المفتاح' }],
      tip: { en: '"I have a reservation under the name…" is the standard way to start a hotel check-in.', ar: 'عبارة I have a reservation under the name… هي البداية المعتادة لتسجيل الدخول في الفندق.' }
    },
    taxi: {
      goal: { en: 'I can tell a driver where to go, chat a little and pay.', ar: 'أستطيع إخبار السائق بوجهتي والدردشة قليلاً والدفع.' },
      vocab: [{ en: 'Where to?', ar: 'إلى أين؟' }, { en: 'highway', ar: 'طريق سريع' }, { en: 'toll', ar: 'رسوم الطريق' },
        { en: 'keep the change', ar: 'احتفظ بالباقي' }, { en: 'receipt', ar: 'إيصال' }, { en: 'pull over', ar: 'توقّف جانباً' }],
      tip: { en: '"Keep the change" means the driver can keep the extra money as a tip.', ar: 'عبارة Keep the change تعني أن السائق يحتفظ بالباقي كإكرامية.' }
    },
    cafe: {
      goal: { en: 'I can order food and drink politely and pay.', ar: 'أستطيع طلب الطعام والشراب بأدب والدفع.' },
      vocab: [{ en: 'for here / to go', ar: 'هنا / سفري' }, { en: 'oat milk', ar: 'حليب الشوفان' }, { en: 'large', ar: 'كبير' },
        { en: "I'll have…", ar: 'سآخذ…' }, { en: 'pay by card', ar: 'الدفع بالبطاقة' }, { en: 'receipt', ar: 'إيصال' }],
      tip: { en: '"Could I have…?" sounds friendlier than "I want…" when you order.', ar: 'عبارة Could I have…? ألطف من I want… عند الطلب.' }
    },
    pharmacy: {
      category: 'health',
      goal: { en: 'I can describe how I feel and ask how to take medicine.', ar: 'أستطيع وصف ما أشعر به والسؤال عن طريقة أخذ الدواء.' },
      vocab: [{ en: 'sore throat', ar: 'التهاب الحلق' }, { en: 'headache', ar: 'صداع' }, { en: 'symptoms', ar: 'أعراض' },
        { en: 'allergic to', ar: 'لديه حساسية من' }, { en: 'tablets', ar: 'أقراص' }, { en: 'every six hours', ar: 'كل ست ساعات' }],
      tip: { en: 'Say "I have a headache", not "I have headache". Most common illnesses take "a".', ar: 'قل I have a headache وليس I have headache. معظم الأمراض الشائعة تأتي معها a.' }
    },
    shop: {
      goal: { en: 'I can return an item, explain the problem and exchange it.', ar: 'أستطيع إرجاع منتج وشرح المشكلة واستبداله.' },
      vocab: [{ en: 'return', ar: 'يُرجع' }, { en: 'refund', ar: 'استرداد المبلغ' }, { en: 'exchange', ar: 'يستبدل' },
        { en: 'receipt', ar: 'إيصال' }, { en: 'too small', ar: 'صغير جداً (أكثر من اللازم)' }, { en: 'fitting room', ar: 'غرفة القياس' }],
      tip: { en: '"Too small" means the size is a problem; "very small" is only a description.', ar: 'too small تعني أن المقاس مشكلة، أما very small فهي مجرد وصف.' }
    },
    colleague: {
      goal: { en: 'I can introduce myself at work and talk about my background.', ar: 'أستطيع التعريف بنفسي في العمل والحديث عن خلفيتي.' },
      vocab: [{ en: 'joining the team', ar: 'ينضم إلى الفريق' }, { en: 'I worked at', ar: 'عملت في' }, { en: 'for three years', ar: 'لمدة ثلاث سنوات' },
        { en: 'commute', ar: 'التنقل إلى العمل' }, { en: 'usually', ar: 'عادةً' }, { en: 'count me in', ar: 'احسبني معكم' }],
      tip: { en: 'Repeat a new colleague\'s name: "Nice to meet you, Rachel." It sounds warm and helps you remember it.', ar: 'كرّر اسم زميلك الجديد: Nice to meet you, Rachel. يبدو ذلك ودوداً ويساعدك على التذكّر.' }
    },
    interview: {
      goal: { en: 'I can talk about my experience and strengths in full, confident sentences.', ar: 'أستطيع الحديث عن خبرتي ونقاط قوتي بجمل كاملة وواثقة.' },
      vocab: [{ en: 'experience', ar: 'خبرة' }, { en: 'strength', ar: 'نقطة قوة' }, { en: 'deadline', ar: 'موعد نهائي' },
        { en: 'handled', ar: 'تعامل مع' }, { en: 'under pressure', ar: 'تحت الضغط' }, { en: 'a typical day', ar: 'يوم معتاد' }],
      tip: { en: 'Answer with a short story: the situation, what you did, and the result.', ar: 'أجب بقصة قصيرة: الموقف، وما فعلته، والنتيجة.' }
    }
  };
  SCENARIOS.forEach(function (s) { if (EXTRAS[s.id]) Object.assign(s, EXTRAS[s.id]); });

  /* ------------------------------------------------------------------ *
   * Learning paths: a deliberate curriculum. Each path's units run from
   * easier to harder; content files add the remaining units by id.
   * ------------------------------------------------------------------ */
  const PATHS = [
    { id: 'travel', en: 'Travel', ar: 'السفر', icon: 'plane', tint: '#3B6FE0',
      goal: { en: 'Handle every step of a trip abroad.', ar: 'تعامل مع كل مراحل رحلتك إلى الخارج.' },
      units: ['checkin', 'plane', 'taxi', 'directions', 'immigration', 'hotel', 'luggage', 'hotel-problem', 'rebooking'] },
    { id: 'daily', en: 'Daily life', ar: 'الحياة اليومية', icon: 'cart', tint: '#3F8A4F',
      goal: { en: 'Get things done around town, in person and on the phone.', ar: 'أنجز أمورك اليومية وجهاً لوجه وعلى الهاتف.' },
      units: ['cafe', 'supermarket', 'restaurant', 'shop', 'phone-booking', 'delivery'] },
    { id: 'health', en: 'Health', ar: 'الصحة', icon: 'stethoscope', tint: '#1F9D6B',
      goal: { en: 'Explain how you feel and understand medical advice.', ar: 'اشرح ما تشعر به وافهم النصائح الطبية.' },
      units: ['pharmacy', 'doctor', 'dentist', 'emergency'] },
    { id: 'work', en: 'Work', ar: 'العمل', icon: 'briefcase', tint: '#4E5BC8',
      goal: { en: 'Communicate with confidence at work, from small talk to negotiation.', ar: 'تواصل بثقة في العمل، من الدردشة إلى التفاوض.' },
      units: ['colleague', 'smalltalk', 'standup', 'time-off', 'interview', 'client-call', 'negotiation'] },
    { id: 'study', en: 'Study & exams', ar: 'الدراسة والاختبارات', icon: 'cap', tint: '#6B4FC8',
      goal: { en: 'Study abroad and get ready for the IELTS speaking test.', ar: 'ادرس في الخارج واستعد لاختبار المحادثة في آيلتس.' },
      units: ['admissions', 'professor', 'ielts-1', 'ielts-2', 'ielts-3'] },
    { id: 'social', en: 'Friends & culture', ar: 'الأصدقاء والثقافة', icon: 'users', tint: '#C2602F',
      goal: { en: 'Make friends, make plans and share your culture.', ar: 'كوّن صداقات، ورتّب خططاً، وشارك ثقافتك.' },
      units: ['neighbour', 'weekend-plans', 'hosting', 'ramadan', 'dinner-party'] }
  ];

  /* Free-conversation topics, grouped. `angle` steers the AI's opening;
     `level` marks topics that suit stronger speakers. */
  const TOPIC_CATS = [
    { id: 'everyday', en: 'Everyday', ar: 'يومياتك' },
    { id: 'stories', en: 'Tell a story', ar: 'احكِ قصة' },
    { id: 'culture', en: 'Your culture', ar: 'ثقافتك' },
    { id: 'interests', en: 'Interests', ar: 'اهتماماتك' },
    { id: 'work', en: 'Work & study', ar: 'العمل والدراسة' },
    { id: 'ideas', en: 'Ideas & opinions', ar: 'أفكار وآراء' }
  ];
  const TOPICS = [
    // Everyday
    { id: 'day', cat: 'everyday', en: 'Your day', ar: 'يومك', icon: 'sun', angle: 'Ask how their day is going and what they did, then follow whatever they mention.' },
    { id: 'weekend', cat: 'everyday', en: 'Weekend plans', ar: 'نهاية الأسبوع', icon: 'calendar', angle: 'Ask about their last weekend or their plans for the next one.' },
    { id: 'food', cat: 'everyday', en: 'Food you love', ar: 'أكلاتك المفضلة', icon: 'utensils', angle: 'Talk about favourite dishes, cooking at home and restaurants.' },
    { id: 'city', cat: 'everyday', en: 'Your city', ar: 'مدينتك', icon: 'building', angle: 'Ask about their city: favourite places, the weather, what visitors should see.' },
    { id: 'home', cat: 'everyday', en: 'Your home', ar: 'بيتك', icon: 'home', angle: 'Ask them to describe their home and their favourite room, and who they live with.' },
    { id: 'shopping', cat: 'everyday', en: 'Shopping', ar: 'التسوّق', icon: 'bag', angle: 'Talk about how they shop: malls or online, a recent purchase, a great or bad buy.' },
    { id: 'weather', cat: 'everyday', en: 'Weather & seasons', ar: 'الطقس والفصول', icon: 'cloud', angle: 'Talk about the weather where they live, their favourite season and what they do in it.' },
    // Stories
    { id: 'sea', cat: 'stories', en: 'The sea & the beach', ar: 'البحر والشاطئ', icon: 'waves', angle: 'Talk about trips to the sea or the beach: what they saw, did and felt. Sea life, boats, diving and fishing are all welcome.' },
    { id: 'trip', cat: 'stories', en: 'A memorable trip', ar: 'رحلة لا تُنسى', icon: 'plane', angle: 'Ask them to tell the story of a trip they will never forget: where, who with, what happened.' },
    { id: 'funny', cat: 'stories', en: 'A funny moment', ar: 'موقف مضحك', icon: 'smile', angle: 'Ask for a funny or embarrassing thing that happened to them, and enjoy the story with them.' },
    { id: 'lost', cat: 'stories', en: 'A time you got lost', ar: 'مرة ضعت فيها', icon: 'map', angle: 'Ask about a time they got lost or something went wrong on the way, and how they solved it.' },
    { id: 'bestday', cat: 'stories', en: 'Your best day ever', ar: 'أجمل يوم في حياتك', icon: 'star', angle: 'Ask about one of the best days of their life, and help them describe it in detail.' },
    { id: 'challenge', cat: 'stories', en: 'A challenge you overcame', ar: 'تحدٍّ تغلّبت عليه', icon: 'target', level: 'Intermediate', angle: 'Ask about a difficult time or challenge they overcame and what they learned from it.' },
    // Culture
    { id: 'coffee', cat: 'culture', en: 'Arabic coffee & hospitality', ar: 'القهوة العربية والضيافة', icon: 'coffee', angle: 'Be curious about Arabic coffee, dates and hospitality in their home. Let them teach you.' },
    { id: 'ramadan', cat: 'culture', en: 'Ramadan & Eid', ar: 'رمضان والعيد', icon: 'moon', angle: 'Ask respectfully how they spend Ramadan and Eid, and their favourite traditions.' },
    { id: 'weddings', cat: 'culture', en: 'Weddings & celebrations', ar: 'الأعراس والمناسبات', icon: 'gift', angle: 'Ask how weddings and big celebrations work in their family: the food, the music, the guests.' },
    { id: 'desert', cat: 'culture', en: 'The desert & camping', ar: 'البر والتخييم', icon: 'tent', angle: 'Talk about trips to the desert, camping in winter, bonfires and stars.' },
    { id: 'dishes', cat: 'culture', en: 'Traditional dishes', ar: 'الأطباق الشعبية', icon: 'utensils', angle: 'Ask them to describe traditional dishes like kabsa or jareesh, and how they are made.' },
    { id: 'changes', cat: 'culture', en: 'How your country is changing', ar: 'كيف تتغيّر بلادك', icon: 'globe', level: 'Intermediate', angle: 'Talk about how life in their country has changed in recent years: entertainment, tourism, work.' },
    // Interests
    { id: 'sports', cat: 'interests', en: 'Sports', ar: 'الرياضة', icon: 'ball', angle: 'Talk about sports they play or watch, favourite teams and big matches.' },
    { id: 'movies', cat: 'interests', en: 'Movies & series', ar: 'الأفلام والمسلسلات', icon: 'film', angle: 'Talk about films and series they like, and why.' },
    { id: 'cars', cat: 'interests', en: 'Cars', ar: 'السيارات', icon: 'car', angle: 'Talk about cars: their own, their dream car, road trips and driving.' },
    { id: 'gaming', cat: 'interests', en: 'Gaming', ar: 'الألعاب الإلكترونية', icon: 'gamepad', angle: 'Talk about video games they play, who they play with, and what makes a game great.' },
    { id: 'reading', cat: 'interests', en: 'Books & reading', ar: 'الكتب والقراءة', icon: 'book', angle: 'Talk about books, stories or podcasts they enjoy and what they are reading now.' },
    { id: 'fitness', cat: 'interests', en: 'Fitness & health', ar: 'اللياقة والصحة', icon: 'heart', angle: 'Talk about how they stay healthy: the gym, walking, food habits, sleep.' },
    { id: 'photo', cat: 'interests', en: 'Photography', ar: 'التصوير', icon: 'camera', angle: 'Talk about photos they like to take and a favourite photo on their phone.' },
    { id: 'music', cat: 'interests', en: 'Music', ar: 'الموسيقى والأناشيد', icon: 'music', angle: 'Talk about music or nasheeds they enjoy and when they listen.' },
    { id: 'tech', cat: 'interests', en: 'Phones & tech', ar: 'الهواتف والتقنية', icon: 'phone', angle: 'Talk about apps, gadgets and how technology fits into their life.' },
    // Work & study
    { id: 'work', cat: 'work', en: 'Your work or studies', ar: 'عملك أو دراستك', icon: 'briefcase', angle: 'Ask what they do or study, what a normal day looks like, and what they enjoy or find hard.' },
    { id: 'dreamjob', cat: 'work', en: 'Your dream job', ar: 'وظيفة أحلامك', icon: 'target', angle: 'Ask about their dream job and what they would need to get there.' },
    { id: 'english', cat: 'work', en: 'Learning English', ar: 'تعلّم الإنجليزية', icon: 'chat', angle: 'Talk about why they are learning English, what is hard for them, and moments they felt proud.' },
    { id: 'abroad', cat: 'work', en: 'Studying abroad', ar: 'الدراسة في الخارج', icon: 'cap', level: 'Intermediate', angle: 'Talk about studying abroad: where they would go or went, what they expect or experienced.' },
    // Ideas & opinions
    { id: 'social', cat: 'ideas', en: 'Social media', ar: 'وسائل التواصل', icon: 'phone', level: 'Advanced', angle: 'Discuss social media: what it adds to life, what it takes away. Ask for their opinion and reasons, and push back gently.' },
    { id: 'ai', cat: 'ideas', en: 'AI & the future', ar: 'الذكاء الاصطناعي والمستقبل', icon: 'cpu', level: 'Advanced', angle: 'Discuss how AI might change work and daily life. Ask for opinions, examples and predictions.' },
    { id: 'remote', cat: 'ideas', en: 'Working from home', ar: 'العمل من المنزل', icon: 'laptop', level: 'Advanced', angle: 'Discuss working from home versus the office: pros, cons, and what they prefer and why.' },
    { id: 'citylife', cat: 'ideas', en: 'City or countryside?', ar: 'المدينة أم الريف؟', icon: 'building', level: 'Intermediate', angle: 'Discuss whether life is better in a big city or a small town, with reasons and examples.' },
    { id: 'money', cat: 'ideas', en: 'Money & saving', ar: 'المال والادخار', icon: 'wallet', level: 'Intermediate', angle: 'Talk about saving, spending and money habits, and advice they would give a younger person.' },
    { id: 'tourism', cat: 'ideas', en: 'Tourism: good or bad?', ar: 'السياحة: نفع أم ضرر؟', icon: 'globe', level: 'Advanced', angle: 'Discuss the benefits and costs of tourism for a country and its people.' }
  ];

  /** Content files call this to add more role-plays. */
  function addScenarios(list) {
    list.forEach(function (s) { if (!SCENARIOS.some(function (x) { return x.id === s.id; })) SCENARIOS.push(s); });
  }

  root.LisanContent = {
    CATEGORIES: PATHS, PATHS: PATHS, SCENARIOS: SCENARIOS, COMMON: COMMON,
    TOPICS: TOPICS, TOPIC_CATS: TOPIC_CATS, addScenarios: addScenarios
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.LisanContent;
})(typeof window !== 'undefined' ? window : globalThis);
