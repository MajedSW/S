# مختبر الصوت العربي

الصفحة `voice-lab.html` هي نسخة صفحة Artifact «مختبر الصوت العربي»، وفيها قسم «صوت مسجّل أم صوت جهازك؟» الذي يشغّل ملفات `gemini/*.mp3` و`azure/*.mp3`. أصوات Azure تظهر في الصفحة تلقائيًا من `azure/manifest.json` بعد توليدها.

## توليد أصوات Gemini

يحتاج مفتاح Gemini في بيئة الجلسة السحابية: في قسم Network secrets للعنوان `generativelanguage.googleapis.com`، أو متغير البيئة `GEMINI_API_KEY`.

```
python3 tools/gemini-tts.py            # 6 جمل × 4 أصوات (Puck, Fenrir, Leda, Zephyr)
python3 tools/gemini-tts.py --voices Puck,Leda --force   # أصوات أخرى أو إعادة التوليد
```

يكتب `voice-lab/gemini/<voice>-<n>.mp3` و`voice-lab/gemini/manifest.json`. الملفات الموجودة تُتخطّى، فإذا توقف التشغيل عند حد الحصة اليومي يكمل من حيث توقف، وبالنموذج المكتوب في `manifest.json` حتى تكون كل المقاطع من نموذج واحد.

الحصة المجانية لنموذج `gemini-3.8-flash-tts` عشرة طلبات في اليوم، أي عشرة مقاطع تقريبًا من 24.

### توجيه النبرة

نبرة كل جملة وسمٌ صوتي بين قوسين مربعين قبلها، مثل `[excited] مرحبًا يا بطل!`، فينفّذه Gemini دون أن يقرأه. أي توجيه مكتوب بالإنجليزية جملةً يقرؤه Gemini بصوت عالٍ قبل الجملة العربية، الطويل منه والقصير مثل `Say happily:`، ونماذج TTS لا تقبل تعليمات النظام. يطبع السكربت تحذيرًا إذا زاد طول مقطع على 6 ثوانٍ.

الصفحة تعطّل زر Gemini لأي جملة لم تُسجَّل بعد، وتعرض عدد المقاطع الجاهزة.

## توليد أصوات Microsoft Azure

يحتاج مورد Azure Speech بفئة Free F0، ثم في إعدادات البيئة السحابية:

- متغيرا البيئة `AZURE_SPEECH_KEY` (قيمة KEY 1 من Keys and Endpoint) و`AZURE_SPEECH_REGION` (قيمة Location/Region، مثل `qatarcentral` أو `eastus`).
- السماح بالعنوان `<المنطقة>.tts.speech.microsoft.com` في Allowed domains ضمن Network access، مثل `qatarcentral.tts.speech.microsoft.com`.

المفتاح يعمل فقط مع منطقة المورد نفسه، فإذا تغيّرت المنطقة تغيّر العنوان المسموح به أيضًا.

```
python3 tools/azure-tts.py --check   # يعرض الأصوات العربية: يثبت أن المفتاح والمنطقة والشبكة تعمل
python3 tools/azure-tts.py           # 6 جمل × صوتين سعوديين (حامد وزارية)
```

يكتب `voice-lab/azure/<voice>-<n>.mp3` و`voice-lab/azure/manifest.json`، بالجمل نفسها وبالترميز نفسه لمقاطع Gemini. صوت Azure أخفض من Gemini بنحو 6 ديسيبل، فيرفع السكربت كل مقطع إلى مستوى مقاطع Gemini (‎-14.5 LUFS) مع محدِّد عند ‎-2 dBFS، حتى لا يبدو أحد الصوتين أفضل لمجرد أنه أعلى. يستخدم واجهة REST مباشرة لأن حزمة Speech SDK تتصل عبر WebSocket، وشبكة الجلسة لا تمرّرها.

## النشر

انشر `voice-lab/voice-lab.html` على رابط الصفحة نفسه، ومعه كل ملفات `voice-lab/gemini/` بمسار `gemini/<اسم الملف>`، وكل ملفات `voice-lab/azure/` بمسار `azure/<اسم الملف>`.
