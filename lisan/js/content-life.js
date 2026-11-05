/* ==========================================================================
   Lisan · content-life.js — Daily life path (units 2, 3, 5, 6) and
   Health path (units 2-4)
   Field reference: see the header of js/scenarios.js.
   ========================================================================== */
(function (root) {
  'use strict';
  root.LisanContent.addScenarios([
    /* ======================= DAILY LIFE ======================= */
    {
      id: 'supermarket', category: 'daily', level: 'Beginner', minutes: 3, icon: 'cart', tint: '#3F8A4F',
      register: 'polite',
      title: 'At the supermarket', titleAr: 'في السوبرماركت',
      place: 'FreshMart · Aisle five',
      persona: { name: 'Amy', role: 'Store assistant', roleAr: 'موظفة المتجر', gender: 'female' },
      goal: { en: 'I can find products, ask about them and pay at the checkout.', ar: 'أستطيع إيجاد المنتجات والسؤال عنها والدفع عند الصندوق.' },
      mission: {
        en: 'Find the rice and fresh chicken, ask about a special offer, then pay at the checkout.',
        ar: 'اعثر على الأرز والدجاج الطازج، واسأل عن عرض خاص، ثم ادفع عند الصندوق.'
      },
      vocab: [
        { en: 'aisle', ar: 'ممر' }, { en: 'checkout', ar: 'صندوق الدفع' }, { en: 'special offer', ar: 'عرض خاص' },
        { en: 'loyalty card', ar: 'بطاقة ولاء' }, { en: 'fresh', ar: 'طازج' }, { en: 'receipt', ar: 'إيصال' }
      ],
      tip: {
        en: 'Staff often say "Are you finding everything okay?" It\'s friendly small talk, and "Yes, thanks" is a perfect answer.',
        ar: 'يقول الموظفون كثيراً Are you finding everything okay? وهي مجاملة لطيفة، والرد Yes, thanks مناسب تماماً.'
      },
      turns: [
        {
          ai: { en: 'Hi! Are you finding everything okay?', ar: 'أهلاً! هل تجد كل ما تحتاجه؟' },
          keys: ['#yesno', 'looking', 'find', 'where', 'rice', 'milk', 'bread', 'eggs', 'dates'],
          hint: { ar: 'قل ما تبحث عنه: I\'m looking for…', starter: "Actually, I'm looking for …" },
          model: { en: "Actually, I'm looking for rice. Where can I find it?", ar: 'في الحقيقة، أبحث عن الأرز. أين أجده؟' },
          also: { en: "Yes, thanks. I'm just looking.", ar: 'نعم، شكراً. أنا أتفرّج فقط.' }
        },
        {
          ai: { en: "Rice is in aisle seven, next to the pasta. Are you looking for anything else?", ar: 'الأرز في الممر السابع بجانب المعكرونة. هل تبحث عن شيء آخر؟' },
          keys: ['#yesno', 'where', 'milk', 'eggs', 'bread', 'chicken', 'fresh', 'also', 'that', 'all'],
          hint: { ar: 'اسأل عن شيء آخر: Do you have any…?', starter: 'Yes. Do you have any …' },
          model: { en: 'Yes. Do you have any fresh chicken?', ar: 'نعم. هل لديكم دجاج طازج؟' },
          also: { en: "No, that's all. Thank you.", ar: 'لا، هذا كل شيء. شكراً.' }
        },
        {
          ai: { en: "Yes, at the meat counter at the back. Today there's a special offer: buy one, get one free. Would you like me to show you?", ar: 'نعم، في قسم اللحوم في الخلف. واليوم هناك عرض خاص: اشترِ واحداً واحصل على الثاني مجاناً. هل تريد أن أريك المكان؟' },
          keys: ['#yesno', 'show', 'great', 'thanks', 'find'],
          hint: { ar: 'اقبل أو اعتذر بلطف.', starter: "That's great! …" },
          model: { en: "That's great! Yes, please show me.", ar: 'رائع! نعم، أرني من فضلك.' },
          also: { en: "No thanks, I'll find it. Thanks for your help.", ar: 'لا شكراً، سأجده. شكراً لمساعدتك.' }
        },
        {
          ai: { en: 'Hi again! I can help you at this checkout. Do you have a loyalty card?', ar: 'أهلاً مجدداً! يمكنني خدمتك عند هذا الصندوق. هل لديك بطاقة ولاء؟' },
          keys: ['#yesno', 'card', 'loyalty', 'points', 'app', 'sign', 'member'],
          hint: { ar: 'أجب، ويمكنك أن تسأل عن التسجيل.', starter: "No, I don't. Can I …" },
          model: { en: "No, I don't. Can I sign up for one?", ar: 'لا، ليس لدي. هل يمكنني التسجيل للحصول على واحدة؟' },
          also: { en: 'Yes, here it is.', ar: 'نعم، ها هي.' }
        },
        {
          ai: { en: "Sure, you can do it on our app later. That's forty-three twenty. Would you like a bag?", ar: 'بالتأكيد، يمكنك ذلك عبر تطبيقنا لاحقاً. المبلغ ثلاثة وأربعون وعشرون. هل تريد كيساً؟' },
          keys: ['#yesno', 'bag', 'bags', 'two', 'one', 'own', 'card', 'pay'],
          hint: { ar: 'اطلب أكياساً واسأل عن الدفع بالبطاقة.', starter: 'Yes, two bags, please …' },
          model: { en: 'Yes, two bags, please. Can I pay by card?', ar: 'نعم، كيسان من فضلك. هل يمكنني الدفع بالبطاقة؟' },
          also: { en: 'No thanks, I brought my own bag.', ar: 'لا شكراً، أحضرت كيسي الخاص.' }
        }
      ],
      outro: { en: 'Of course, just tap your card here. Have a great day!', ar: 'بالتأكيد، فقط قرّب بطاقتك هنا. أتمنى لك يوماً رائعاً!' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'restaurant', category: 'daily', level: 'Beginner', minutes: 4, icon: 'utensils', tint: '#A85B2A',
      register: 'polite',
      title: 'Dinner at a restaurant', titleAr: 'العشاء في مطعم',
      place: 'The Olive Tree · Table for two',
      persona: { name: 'Leo', role: 'Waiter', roleAr: 'نادل', gender: 'male' },
      goal: { en: 'I can order a meal, mention an allergy and ask for the bill.', ar: 'أستطيع طلب وجبة وذكر الحساسية وطلب الحساب.' },
      mission: {
        en: 'Get a table, order drinks and a main course, tell the waiter about an allergy, and ask for the bill.',
        ar: 'احصل على طاولة، واطلب مشروبات وطبقاً رئيسياً، وأخبر النادل بالحساسية، ثم اطلب الحساب.'
      },
      vocab: [
        { en: 'reservation', ar: 'حجز' }, { en: 'menu', ar: 'قائمة الطعام' }, { en: "I'll have…", ar: 'سآخذ…' },
        { en: 'allergic to', ar: 'لديه حساسية من' }, { en: 'the bill', ar: 'الحساب' }, { en: 'recommend', ar: 'ينصح' }
      ],
      tip: {
        en: 'British English says "the bill"; American English says "the check". Both are fine.',
        ar: 'في الإنجليزية البريطانية يقولون the bill، وفي الأمريكية the check، وكلاهما صحيح.'
      },
      turns: [
        {
          ai: { en: 'Good evening! Do you have a reservation?', ar: 'مساء الخير! هل لديكم حجز؟' },
          keys: ['#yesno', 'table', 'reservation', 'two', 'people', 'booked', 'name', 'for'],
          hint: { ar: 'اطلب طاولة: A table for two, please.', starter: "No, we don't. Do you have a table for …" },
          model: { en: "No, we don't. Do you have a table for two?", ar: 'لا، ليس لدينا. هل لديكم طاولة لشخصين؟' },
          also: { en: "Yes, it's under the name Salem.", ar: 'نعم، الحجز باسم سالم.' }
        },
        {
          ai: { en: "Yes, follow me, please. Here's the menu. Can I get you something to drink first?", ar: 'نعم، تفضّلوا معي. هذه قائمة الطعام. هل أحضر لكم مشروباً أولاً؟' },
          keys: ['water', 'juice', 'lemon', 'mint', 'tea', 'coffee', 'drink', 'sparkling', 'have'],
          hint: { ar: 'اطلب مشروباً: Could we have…, please?', starter: 'Could we have …' },
          model: { en: 'Could we have some water and a lemon mint juice, please?', ar: 'هل يمكن أن نحصل على ماء وعصير ليمون بالنعناع، من فضلك؟' },
          also: { en: 'Just water for now, thanks.', ar: 'ماء فقط الآن، شكراً.' }
        },
        {
          ai: { en: 'Of course. Are you ready to order, or do you need a few more minutes?', ar: 'بالتأكيد. هل أنتم مستعدون للطلب، أم تحتاجون بضع دقائق أخرى؟' },
          keys: ['ready', 'order', 'minutes', 'more', 'time', 'have', 'grilled', 'chicken', 'steak', 'salad', 'fish', 'recommend'],
          hint: { ar: 'اطلب طبقك: I\'ll have the…, please.', starter: "I think we're ready. I'll have …" },
          model: { en: "I think we're ready. I'll have the grilled chicken, please.", ar: 'أظن أننا مستعدون. سآخذ الدجاج المشوي، من فضلك.' },
          also: { en: 'What do you recommend?', ar: 'بماذا تنصحنا؟' }
        },
        {
          ai: { en: 'Great choice. Do you have any allergies I should tell the chef about?', ar: 'اختيار رائع. هل لديك أي حساسية يجب أن أخبر الطاهي عنها؟' },
          keys: ['#yesno', 'allergic', 'allergy', 'allergies', 'nuts', 'peanuts', 'dairy', 'milk', 'gluten', 'shellfish', 'eggs'],
          hint: { ar: 'قل I\'m allergic to… أو No allergies.', starter: "Yes, I'm allergic to …" },
          model: { en: "Yes, I'm allergic to nuts. Are there any in the sauce?", ar: 'نعم، لديّ حساسية من المكسرات. هل توجد في الصلصة؟' },
          also: { en: 'No, no allergies, thank you.', ar: 'لا، ليست لديّ أي حساسية، شكراً.' }
        },
        {
          ai: { en: 'How was everything? Can I get you some dessert or coffee?', ar: 'كيف كان كل شيء؟ هل أحضر لكم حلوى أو قهوة؟' },
          keys: ['delicious', 'good', 'great', 'lovely', 'bill', 'check', 'dessert', 'coffee', 'thank', 'full'],
          hint: { ar: 'امدح الطعام واطلب الحساب: Could we have the bill?', starter: 'Everything was delicious. Could we …' },
          model: { en: 'Everything was delicious, thank you. Could we have the bill, please?', ar: 'كان كل شيء لذيذاً، شكراً. هل يمكن أن نحصل على الحساب، من فضلك؟' },
          also: { en: "We're full, thanks. Just the bill, please.", ar: 'شبعنا، شكراً. الحساب فقط من فضلك.' }
        }
      ],
      outro: { en: "Of course, I'll bring it right away. Thank you for coming!", ar: 'بالتأكيد، سأحضره حالاً. شكراً لزيارتكم!' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'phone-booking', category: 'daily', level: 'Intermediate', minutes: 4, icon: 'phone', tint: '#3C7F86',
      title: 'Booking an appointment by phone', titleAr: 'حجز موعد بالهاتف',
      place: 'Phone call · City Clinic reception',
      persona: { name: 'Hannah', role: 'Clinic receptionist', roleAr: 'موظفة استقبال العيادة', gender: 'female' },
      goal: { en: 'I can book an appointment by phone, spell my name and confirm the time.', ar: 'أستطيع حجز موعد بالهاتف وتهجئة اسمي وتأكيد الوقت.' },
      mission: {
        en: 'Phone the clinic, book an appointment, spell your family name and give your phone number.',
        ar: 'اتصل بالعيادة، واحجز موعداً، وتهجَّ اسم عائلتك، وأعطِ رقم هاتفك.'
      },
      vocab: [
        { en: 'appointment', ar: 'موعد' }, { en: 'spell', ar: 'يتهجّى' }, { en: '… speaking', ar: 'معك … (على الهاتف)' },
        { en: 'works for me', ar: 'يناسبني' }, { en: 'just in case', ar: 'للاحتياط' }, { en: 'insurance card', ar: 'بطاقة التأمين' }
      ],
      tip: {
        en: 'On the phone, "0" is often said "oh", and numbers are said in small groups: oh-five-five, one-two-three.',
        ar: 'على الهاتف يُنطق الصفر غالباً oh، وتُقال الأرقام في مجموعات صغيرة: oh-five-five, one-two-three.'
      },
      turns: [
        {
          ai: { en: 'Good morning, City Clinic, Hannah speaking. How can I help you?', ar: 'صباح الخير، عيادة المدينة، معك هانا. كيف يمكنني مساعدتك؟' },
          keys: ['appointment', 'book', 'doctor', 'see', 'make', 'need'],
          hint: { ar: 'اطلب موعداً: I\'d like to book an appointment…', starter: "I'd like to book …" },
          model: { en: "Hello, I'd like to book an appointment with a doctor, please.", ar: 'مرحباً، أودّ حجز موعد مع طبيب، من فضلك.' },
          also: { en: 'Hi, I need to see a doctor this week.', ar: 'مرحباً، أحتاج إلى مقابلة طبيب هذا الأسبوع.' }
        },
        {
          ai: { en: 'Certainly. Can I have your full name, please?', ar: 'بالتأكيد. هل يمكنني معرفة اسمك الكامل؟' },
          keys: ['name', 'it is', 'i am', 'called'], minWords: 2,
          hint: { ar: 'قل اسمك: It\'s…', starter: "It's …" },
          model: { en: "Yes, it's Faisal Al-Harbi.", ar: 'نعم، اسمي فيصل الحربي.' },
          also: { en: 'My name is Faisal Al-Harbi.', ar: 'اسمي فيصل الحربي.' }
        },
        {
          ai: { en: 'Thank you. Could you spell your last name for me?', ar: 'شكراً. هل يمكنك تهجئة اسم عائلتك؟' },
          minWords: 2,
          hint: { ar: 'تهجَّ الحروف واحداً واحداً بالإنجليزية.', starter: "Sure. It's A, L …" },
          model: { en: "Sure. It's A, L, H, A, R, B, I.", ar: 'بالتأكيد. A, L, H, A, R, B, I.' },
          also: { en: 'Of course: A, L, hyphen, H, A, R, B, I.', ar: 'بالطبع: A, L، شرطة، H, A, R, B, I.' }
        },
        {
          ai: { en: 'Thank you. We have Tuesday at nine fifteen, or Wednesday at four thirty. Which is better for you?', ar: 'شكراً. لدينا يوم الثلاثاء الساعة التاسعة والربع، أو الأربعاء الساعة الرابعة والنصف. أيهما أنسب لك؟' },
          keys: ['tuesday', 'wednesday', 'morning', 'afternoon', 'nine', 'four', 'better', 'works', 'earlier'],
          hint: { ar: 'اختر: … works better for me.', starter: 'Wednesday at four thirty …' },
          model: { en: 'Wednesday at four thirty works better for me.', ar: 'الأربعاء الساعة الرابعة والنصف أنسب لي.' },
          also: { en: 'Is there anything earlier on Tuesday?', ar: 'هل يوجد موعد أبكر يوم الثلاثاء؟' }
        },
        {
          ai: { en: "Perfect, you're booked for Wednesday at four thirty with Doctor Lewis. Could I have a phone number, just in case?", ar: 'ممتاز، تم حجز موعدك يوم الأربعاء الساعة الرابعة والنصف مع الدكتور لويس. هل يمكنني أخذ رقم هاتفك للاحتياط؟' },
          keys: ['#num', 'number', 'oh', 'phone', 'mobile'], minWords: 4,
          hint: { ar: 'قل الرقم في مجموعات صغيرة.', starter: "Sure, it's oh five five …" },
          model: { en: "Sure, it's oh five five, one two three, four five six seven.", ar: 'بالتأكيد، الرقم 0551234567.' },
          also: { en: 'Of course. My mobile number is zero five five, one two three, four five six seven.', ar: 'بالطبع. رقم جوالي 0551234567.' }
        },
        {
          ai: { en: 'Thank you. Is there anything else I can help you with?', ar: 'شكراً. هل هناك شيء آخر يمكنني مساعدتك به؟' },
          keys: ['#yesno', 'bring', 'arrive', 'early', 'thank', 'need'],
          hint: { ar: 'اسأل إن كنت تحتاج إحضار شيء.', starter: 'Do I need to bring …' },
          model: { en: 'Do I need to bring anything?', ar: 'هل أحتاج إلى إحضار شيء؟' },
          also: { en: "No, that's all. Thank you very much.", ar: 'لا، هذا كل شيء. شكراً جزيلاً.' }
        }
      ],
      outro: { en: 'Just your ID and insurance card. Please arrive ten minutes early. See you on Wednesday!', ar: 'فقط هويتك وبطاقة التأمين. يُرجى الحضور قبل الموعد بعشر دقائق. نراك يوم الأربعاء!' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'delivery', category: 'daily', level: 'Advanced', minutes: 5, icon: 'box', tint: '#8A6A1F',
      title: 'A delivery gone wrong', titleAr: 'مشكلة في التوصيل',
      place: 'Phone call · FreshBox customer support',
      persona: { name: 'Ryan', role: 'Customer service agent', roleAr: 'موظف خدمة العملاء', gender: 'male' },
      goal: { en: 'I can complain on the phone and get a fair solution.', ar: 'أستطيع تقديم شكوى بالهاتف والحصول على حل عادل.' },
      mission: {
        en: 'Your grocery order arrived late, with wrong and missing items. Explain calmly and get a refund or replacement.',
        ar: 'وصل طلب البقالة متأخراً وفيه أغراض خاطئة وناقصة. اشرح بهدوء واحصل على استرداد أو بديل.'
      },
      vocab: [
        { en: 'instead', ar: 'بدلاً من ذلك' }, { en: 'missing', ar: 'ناقص' }, { en: 'refund', ar: 'استرداد المبلغ' },
        { en: 'replacement', ar: 'بديل' }, { en: 'delivery fee', ar: 'رسوم التوصيل' }, { en: 'confirmation', ar: 'تأكيد' }
      ],
      tip: {
        en: 'Describe a wrong order with "I ordered X, but I got Y instead." It\'s clear and calm.',
        ar: 'لوصف طلب خاطئ قل: I ordered X, but I got Y instead. جملة واضحة وهادئة.'
      },
      turns: [
        {
          ai: { en: "Thanks for calling FreshBox. My name's Ryan. How can I help you today?", ar: 'شكراً لاتصالك بفريش بوكس. اسمي رايان. كيف يمكنني مساعدتك اليوم؟' },
          keys: ['order', 'delivery', 'wrong', 'late', 'arrived', 'missing', 'problem', 'received'], minWords: 6,
          hint: { ar: 'اشرح المشكلة باختصار: التأخير والأغراض الخاطئة.', starter: 'My order arrived …' },
          model: { en: 'Hi Ryan. My order arrived an hour late, and some items were wrong.', ar: 'مرحباً رايان. وصل طلبي متأخراً ساعة، وبعض الأغراض كانت خاطئة.' },
          also: { en: "Hi. I have a problem with today's delivery.", ar: 'مرحباً. لديّ مشكلة في توصيل اليوم.' }
        },
        {
          ai: { en: "I'm really sorry about that. Could you give me your order number?", ar: 'أعتذر جداً عن ذلك. هل يمكنك إعطائي رقم الطلب؟' },
          keys: ['#num', 'number', 'order', 'it is', 'sure'], minWords: 3,
          hint: { ar: 'قل الرقم رقماً رقماً.', starter: "Sure, it's …" },
          model: { en: "Sure, it's four, seven, two, nine, one, eight.", ar: 'بالتأكيد، الرقم 472918.' },
          also: { en: 'Yes, the order number is four seven two nine one eight.', ar: 'نعم، رقم الطلب 472918.' }
        },
        {
          ai: { en: 'Thanks. I can see the order. Which items were wrong?', ar: 'شكراً. أرى الطلب. ما الأغراض التي كانت خاطئة؟' },
          keys: ['instead', 'ordered', 'got', 'received', 'sent', 'wrong', 'milk', 'chicken', 'missing', 'bread', 'eggs', 'juice'], minWords: 5,
          hint: { ar: 'استخدم: I ordered…, but I got… instead.', starter: 'I ordered …, but I got …' },
          model: { en: 'I ordered chicken breasts, but I got minced beef instead, and the milk is missing.', ar: 'طلبت صدور دجاج، لكن وصلني لحم مفروم بدلاً منها، والحليب ناقص.' },
          also: { en: 'You sent the wrong juice, and two items were missing.', ar: 'أرسلتم العصير الخطأ، وكان هناك غرضان ناقصان.' }
        },
        {
          ai: { en: 'I apologise for the trouble. I can refund those items, or send the correct ones tomorrow morning. What would you prefer?', ar: 'أعتذر عن الإزعاج. يمكنني استرداد ثمن تلك الأغراض، أو إرسال الأغراض الصحيحة صباح الغد. ماذا تفضّل؟' },
          keys: ['refund', 'send', 'tomorrow', 'replacement', 'correct', 'prefer', 'rather', 'money', 'back'],
          hint: { ar: 'اختر وأعطِ السبب.', starter: "I'd prefer a refund, because …" },
          model: { en: "I'd prefer a refund, please. I need them today.", ar: 'أفضّل استرداد المبلغ من فضلك. أحتاجها اليوم.' },
          also: { en: 'Please send the correct items tomorrow morning.', ar: 'أرسلوا الأغراض الصحيحة صباح الغد من فضلك.' }
        },
        {
          ai: { en: 'Done. The refund will reach your card in three to five days. Is there anything else I can do?', ar: 'تم. سيصل المبلغ إلى بطاقتك خلال ثلاثة إلى خمسة أيام. هل هناك شيء آخر يمكنني فعله؟' },
          keys: ['#yesno', 'delivery', 'late', 'fee', 'discount', 'thank', 'email', 'confirmation'],
          hint: { ar: 'اطلب تعويضاً بأدب: Since it was late, could you also…?', starter: 'Since it was late, could you …' },
          model: { en: 'Since it was late, could you also refund the delivery fee?', ar: 'بما أنه تأخر، هل يمكنكم أيضاً استرداد رسوم التوصيل؟' },
          also: { en: 'Could you send me a confirmation email, please?', ar: 'هل يمكنكم إرسال رسالة تأكيد إلى بريدي، من فضلك؟' }
        }
      ],
      outro: { en: "That's fair. I've refunded the delivery fee too, and you'll get an email in a minute. Sorry again!", ar: 'هذا عادل. استرددت لك رسوم التوصيل أيضاً، وستصلك رسالة خلال دقيقة. نعتذر مجدداً!' }
    },

    /* ========================= HEALTH ========================= */
    {
      id: 'doctor', category: 'health', level: 'Intermediate', minutes: 4, icon: 'stethoscope', tint: '#1E8C7A',
      title: 'Seeing a doctor', titleAr: 'عند الطبيب',
      place: 'City Clinic · Consultation room',
      persona: { name: 'Dr. Carter', role: 'Family doctor', roleAr: 'طبيبة الأسرة', gender: 'female' },
      goal: { en: 'I can describe my symptoms and check that I understand the treatment.', ar: 'أستطيع وصف أعراضي والتأكد من فهمي للعلاج.' },
      mission: {
        en: 'Describe your symptoms, answer the doctor’s questions and make sure you understand how to take the medicine.',
        ar: 'صِف أعراضك، وأجب عن أسئلة الطبيبة، وتأكد أنك فهمت طريقة أخذ الدواء.'
      },
      vocab: [
        { en: 'symptoms', ar: 'أعراض' }, { en: 'a sore throat', ar: 'التهاب الحلق' }, { en: 'prescribe', ar: 'يصف دواءً' },
        { en: 'antibiotics', ar: 'مضادات حيوية' }, { en: 'twice a day', ar: 'مرتين يومياً' }, { en: 'the whole course', ar: 'العلاج كاملاً' }
      ],
      tip: {
        en: '"I\'ve had a cough for three days" uses the present perfect, because it started in the past and is still happening.',
        ar: 'نقول I\'ve had a cough for three days بالمضارع التام، لأن السعال بدأ في الماضي وما زال مستمراً.'
      },
      turns: [
        {
          ai: { en: 'Hello, come in and have a seat. What seems to be the problem?', ar: 'مرحباً، تفضّل بالجلوس. ما المشكلة؟' },
          keys: ['pain', 'hurts', 'headache', 'fever', 'cough', 'stomach', 'back', 'feel', 'feeling', 'sick', 'dizzy', 'tired'],
          hint: { ar: 'صِف الأعراض والمدة: I\'ve had… for…', starter: "I've had …" },
          model: { en: "I've had a bad cough and a fever for three days.", ar: 'أعاني من سعال شديد وحرارة منذ ثلاثة أيام.' },
          also: { en: 'My back hurts when I sit for a long time.', ar: 'ظهري يؤلمني عندما أجلس لفترة طويلة.' }
        },
        {
          ai: { en: 'I see. Have you taken any medicine for it?', ar: 'فهمت. هل أخذت أي دواء لذلك؟' },
          keys: ['#yesno', 'paracetamol', 'medicine', 'took', 'taken', 'tablets', 'syrup', 'nothing', 'anything'],
          hint: { ar: 'استخدم الماضي: I took… أو I haven\'t taken…', starter: 'Yes, I took …' },
          model: { en: "Yes, I took some paracetamol, but it didn't help much.", ar: 'نعم، أخذت باراسيتامول، لكنه لم يساعد كثيراً.' },
          also: { en: "No, I haven't taken anything yet.", ar: 'لا، لم آخذ أي شيء بعد.' }
        },
        {
          ai: { en: 'Okay. Do you have any other symptoms, like a sore throat or trouble breathing?', ar: 'حسناً. هل لديك أعراض أخرى، مثل التهاب الحلق أو صعوبة في التنفس؟' },
          keys: ['#yesno', 'throat', 'breathing', 'breathe', 'tired', 'headache', 'pain', 'chest', 'nose', 'sleep'],
          hint: { ar: 'اذكر الأعراض الأخرى أو قل لا يوجد.', starter: 'My throat is …' },
          model: { en: 'My throat is a bit sore, but I can breathe fine.', ar: 'حلقي يؤلمني قليلاً، لكنني أتنفس بشكل طبيعي.' },
          also: { en: 'No, just the cough and the fever.', ar: 'لا، فقط السعال والحرارة.' }
        },
        {
          ai: { en: "I've listened to your chest, and it looks like a chest infection. I'll prescribe some antibiotics. Do you have any questions?", ar: 'استمعت إلى صدرك، ويبدو أنها عدوى في الصدر. سأصف لك مضادات حيوية. هل لديك أي أسئلة؟' },
          keys: ['#yesno', 'how', 'often', 'long', 'take', 'food', 'days', 'times', 'work'],
          hint: { ar: 'اسأل كم مرة ولكم من الوقت تأخذ الدواء.', starter: 'How often should I …' },
          model: { en: 'How often should I take them, and for how long?', ar: 'كم مرة يجب أن آخذها، ولمدة كم؟' },
          also: { en: 'Can I go to work tomorrow?', ar: 'هل يمكنني الذهاب إلى العمل غداً؟' }
        },
        {
          ai: { en: 'Twice a day for seven days, after meals. Please finish the whole course, even if you feel better. Is that clear?', ar: 'مرتين يومياً لمدة سبعة أيام، بعد الأكل. أكمل العلاج كاملاً حتى لو شعرت بتحسن. هل هذا واضح؟' },
          keys: ['#yesno', 'clear', 'twice', 'seven', 'week', 'days', 'understand', 'finish', 'meals', 'food'],
          hint: { ar: 'كرّر التعليمات لتتأكد أنك فهمتها.', starter: "Yes, that's clear. Twice a day …" },
          model: { en: "Yes, that's clear. Twice a day for a week, after meals.", ar: 'نعم، واضح. مرتين يومياً لمدة أسبوع، بعد الأكل.' },
          also: { en: 'Sorry, should I take them before or after food?', ar: 'عذراً، هل آخذها قبل الأكل أم بعده؟' }
        }
      ],
      outro: { en: "Exactly. Drink plenty of water, get some rest, and come back if you don't feel better in three days.", ar: 'بالضبط. اشرب الكثير من الماء وارتح، وعُد إذا لم تتحسن خلال ثلاثة أيام.' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'dentist', category: 'health', level: 'Intermediate', minutes: 4, icon: 'tooth', tint: '#2A8FA6',
      title: 'At the dentist', titleAr: 'عند طبيب الأسنان',
      place: 'Bright Smile Dental · Treatment room',
      persona: { name: 'Dr. Wilson', role: 'Dentist', roleAr: 'طبيب أسنان', gender: 'male' },
      goal: { en: 'I can explain a toothache and agree on treatment.', ar: 'أستطيع شرح ألم الأسنان والاتفاق على العلاج.' },
      mission: {
        en: 'Explain where it hurts and since when, say how you feel about the treatment, and ask what to do afterwards.',
        ar: 'اشرح أين يؤلمك ومنذ متى، وعبّر عن شعورك تجاه العلاج، واسأل ماذا تفعل بعده.'
      },
      vocab: [
        { en: 'toothache', ar: 'ألم الأسنان' }, { en: 'filling', ar: 'حشوة' }, { en: 'cavity', ar: 'تسوّس' },
        { en: 'numb', ar: 'مخدَّر' }, { en: 'sensitive', ar: 'حسّاس' }, { en: 'get it over with', ar: 'أنتهي منه' }
      ],
      tip: {
        en: '"It\'s been hurting for a week" (present perfect continuous) describes pain that started before and continues now.',
        ar: 'جملة It\'s been hurting for a week تصف ألماً بدأ سابقاً وما زال مستمراً.'
      },
      turns: [
        {
          ai: { en: 'Hi there, please sit back and relax. So, what brings you in today?', ar: 'مرحباً، استرخِ في الكرسي. ما الذي جاء بك اليوم؟' },
          keys: ['tooth', 'toothache', 'pain', 'hurts', 'gum', 'filling', 'broke', 'broken', 'check', 'cleaning', 'sensitive'],
          hint: { ar: 'صِف مكان الألم ومتى يحدث.', starter: 'I have a toothache on …' },
          model: { en: 'I have a toothache on the left side. It hurts when I eat something cold.', ar: 'عندي ألم في ضرس على الجهة اليسرى. يؤلمني عندما آكل شيئاً بارداً.' },
          also: { en: 'One of my fillings fell out yesterday.', ar: 'سقطت إحدى حشواتي أمس.' }
        },
        {
          ai: { en: 'I see. Upper or lower teeth? And how long has it been hurting?', ar: 'فهمت. الأسنان العلوية أم السفلية؟ ومنذ متى يؤلمك؟' },
          keys: ['upper', 'lower', 'top', 'bottom', 'since', 'for', '#num', 'week', 'days', 'month'],
          hint: { ar: 'حدّد المكان والمدة: It\'s been hurting for…', starter: "The lower teeth, and it's been hurting …" },
          model: { en: "The lower teeth, and it's been hurting for about a week.", ar: 'الأسنان السفلية، ويؤلمني منذ أسبوع تقريباً.' },
          also: { en: 'Upper left, since last weekend.', ar: 'العلوية اليسرى، منذ عطلة الأسبوع الماضي.' }
        },
        {
          ai: { en: "Let me take a look. I can see a small cavity, so you'll need a filling. Are you nervous about it?", ar: 'دعني ألقي نظرة. أرى تسوساً صغيراً، لذا ستحتاج إلى حشوة. هل أنت متوتر من ذلك؟' },
          keys: ['#yesno', 'nervous', 'scared', 'afraid', 'hurt', 'little', 'bit', 'fine', 'injection'],
          hint: { ar: 'قل شعورك واسأل إن كان سيؤلم.', starter: 'A little bit. Will it …' },
          model: { en: 'A little bit. Will it hurt?', ar: 'قليلاً. هل سيؤلم؟' },
          also: { en: "No, I'm fine. Let's do it.", ar: 'لا، أنا بخير. لنبدأ.' }
        },
        {
          ai: { en: "Don't worry, I'll numb the area first, so you won't feel anything. We can do it today, or book another appointment. What would you like?", ar: 'لا تقلق، سأخدّر المنطقة أولاً فلن تشعر بشيء. يمكننا فعل ذلك اليوم، أو حجز موعد آخر. ماذا تفضّل؟' },
          keys: ['today', 'now', 'another', 'appointment', 'next', 'week', 'prefer', 'rather', 'book', 'later'],
          hint: { ar: 'اختر: اليوم أو موعد آخر.', starter: "Let's do it today …" },
          model: { en: "Let's do it today, please. I want to get it over with.", ar: 'لنفعلها اليوم من فضلك. أريد أن أنتهي منها.' },
          also: { en: 'Could we book another appointment? I have to go back to work.', ar: 'هل يمكننا حجز موعد آخر؟ يجب أن أعود إلى العمل.' }
        },
        {
          ai: { en: 'All done. Your lip will feel numb for about two hours. Do you have any questions?', ar: 'انتهينا. ستشعر بخدر في شفتك لمدة ساعتين تقريباً. هل لديك أي أسئلة؟' },
          keys: ['#yesno', 'eat', 'drink', 'when', 'hours', 'brush', 'hurt', 'thank'],
          hint: { ar: 'اسأل متى يمكنك الأكل.', starter: 'When can I …' },
          model: { en: 'When can I eat again?', ar: 'متى يمكنني الأكل مرة أخرى؟' },
          also: { en: "No questions. Thank you, that wasn't bad at all.", ar: 'لا أسئلة. شكراً، لم يكن الأمر سيئاً أبداً.' }
        }
      ],
      outro: { en: "Wait until the numbness wears off, so you don't bite your cheek. And remember to floss!", ar: 'انتظر حتى يزول الخدر حتى لا تعضّ خدك. ولا تنسَ استخدام خيط الأسنان!' }
    },

    /* ------------------------------------------------------------ */
    {
      id: 'emergency', category: 'health', level: 'Advanced', minutes: 4, icon: 'siren', tint: '#B23A3A',
      title: 'Calling for help', titleAr: 'طلب المساعدة في حالة طارئة',
      place: 'Phone call · Emergency services',
      persona: { name: 'Laura', role: 'Emergency operator', roleAr: 'موظفة الطوارئ', gender: 'female' },
      goal: { en: 'I can give clear information in an emergency call.', ar: 'أستطيع إعطاء معلومات واضحة في مكالمة طوارئ.' },
      mission: {
        en: 'A colleague has fainted at work. Stay calm, give the exact location and follow the operator’s instructions.',
        ar: 'أُغمي على زميلك في العمل. حافظ على هدوئك، وأعطِ الموقع بدقة، واتبع تعليمات الموظفة.'
      },
      vocab: [
        { en: 'fainted', ar: 'أُغمي عليه' }, { en: 'ambulance', ar: 'إسعاف' }, { en: 'breathing', ar: 'يتنفس' },
        { en: 'responding', ar: 'يستجيب' }, { en: 'on his side', ar: 'على جانبه' }, { en: 'paramedics', ar: 'المسعفون' }
      ],
      tip: {
        en: 'In an emergency, say what happened and where in your first two sentences. Short sentences are best.',
        ar: 'في الطوارئ قل ماذا حدث وأين في أول جملتين. الجمل القصيرة هي الأفضل.'
      },
      turns: [
        {
          ai: { en: "Emergency services. What's your emergency?", ar: 'خدمات الطوارئ. ما حالتك الطارئة؟' },
          keys: ['fainted', 'collapsed', 'fell', 'ambulance', 'help', 'colleague', 'friend', 'breathing', 'unconscious', 'hurt', 'accident'],
          hint: { ar: 'قل ما حدث بسرعة ووضوح.', starter: 'My colleague just fainted …' },
          model: { en: 'My colleague just fainted at work. We need an ambulance.', ar: 'أُغمي على زميلي للتو في العمل. نحتاج إلى إسعاف.' },
          also: { en: 'Someone collapsed in our office. Please send help.', ar: 'سقط شخص في مكتبنا. أرسلوا المساعدة من فضلكم.' }
        },
        {
          ai: { en: "Okay, stay calm. What's the address?", ar: 'حسناً، حافظ على هدوئك. ما العنوان؟' },
          keys: ['street', 'road', 'building', 'floor', 'office', 'tower', '#num', 'address', 'near'], minWords: 4,
          hint: { ar: 'أعطِ اسم المبنى والشارع والطابق.', starter: "It's … Tower, on …" },
          model: { en: "It's Al Noor Tower on King Fahd Road, on the fifth floor.", ar: 'برج النور على طريق الملك فهد، الطابق الخامس.' },
          also: { en: "We're on the fifth floor of Al Noor Tower, near the main gate.", ar: 'نحن في الطابق الخامس من برج النور، قرب البوابة الرئيسية.' }
        },
        {
          ai: { en: 'Thank you. Help is on the way. Is he breathing?', ar: 'شكراً. المساعدة في الطريق. هل يتنفس؟' },
          keys: ['#yesno', 'breathing', 'breathe', 'chest', 'moving', 'think', 'responding'],
          hint: { ar: 'قل هل يتنفس وهل يستجيب.', starter: "Yes, he's breathing, but …" },
          model: { en: "Yes, he's breathing, but he isn't responding.", ar: 'نعم، يتنفس، لكنه لا يستجيب.' },
          also: { en: 'I think so. His chest is moving.', ar: 'أظن ذلك. صدره يتحرك.' }
        },
        {
          ai: { en: 'Okay. Turn him gently onto his side and keep his airway clear. Can you do that for me?', ar: 'حسناً. أدِره بلطف على جانبه وحافظ على مجرى التنفس مفتوحاً. هل يمكنك فعل ذلك؟' },
          keys: ['#yesno', 'done', 'side', 'doing', 'turned', 'now'],
          hint: { ar: 'أكّد أنك فعلت ذلك: I\'ve turned him…', starter: "Okay, I've turned him …" },
          model: { en: "Okay, I've turned him onto his side.", ar: 'حسناً، أدرته على جانبه.' },
          also: { en: "Yes, I'm doing it now.", ar: 'نعم، أفعل ذلك الآن.' }
        },
        {
          ai: { en: 'Well done. Does he have any medical conditions that you know of?', ar: 'أحسنت. هل لديه أي حالات مرضية تعرفها؟' },
          keys: ['#yesno', 'diabetes', 'diabetic', 'heart', 'know', 'sure', 'asthma', 'sugar', 'think', 'lunch'],
          hint: { ar: 'قل ما تعرفه، حتى لو لم تكن متأكداً.', starter: 'I think he has …' },
          model: { en: "I think he has diabetes, and he didn't eat lunch today.", ar: 'أظن أنه مصاب بالسكري، ولم يتناول الغداء اليوم.' },
          also: { en: "I'm not sure. I don't think so.", ar: 'لست متأكداً. لا أظن ذلك.' }
        }
      ],
      outro: { en: "That's very helpful. The ambulance is two minutes away. Stay with him, and send someone to meet the paramedics at the entrance.", ar: 'هذه معلومة مفيدة جداً. الإسعاف على بُعد دقيقتين. ابقَ معه، وأرسل شخصاً لاستقبال المسعفين عند المدخل.' }
    }
  ]);
})(typeof window !== 'undefined' ? window : globalThis);
