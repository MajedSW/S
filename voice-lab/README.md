# مختبر الصوت العربي

الصفحة `voice-lab.html` هي نسخة صفحة Artifact «مختبر الصوت العربي»، وفيها قسم «Gemini أم صوت جهازك؟» الذي يشغّل ملفات `gemini/*.mp3`.

## توليد أصوات Gemini

يحتاج مفتاح Gemini في بيئة الجلسة السحابية: في قسم Network secrets للعنوان `generativelanguage.googleapis.com`، أو متغير البيئة `GEMINI_API_KEY`.

```
python3 tools/gemini-tts.py            # 6 جمل × 4 أصوات (Puck, Fenrir, Leda, Zephyr)
python3 tools/gemini-tts.py --voices Puck,Leda --force   # أصوات أخرى أو إعادة التوليد
```

يكتب `voice-lab/gemini/<voice>-<n>.mp3` و`voice-lab/gemini/manifest.json`. الملفات الموجودة تُتخطّى، فإذا توقف التشغيل عند حد الحصة اليومي يكمل من حيث توقف.

## النشر

انشر `voice-lab/voice-lab.html` على رابط الصفحة نفسه، ومعه كل ملفات `voice-lab/gemini/` بمسار `gemini/<اسم الملف>`.
