# Lisan · لسان — English speaking coach

**The problem:** many Arabic speakers understand English and know the words,
but freeze when they have to speak. They need somewhere safe to practise out
loud, with someone who corrects their mistakes right away.

**What Lisan does:** you talk through real situations (airport, plane, hotel,
café, pharmacy, job interview…) with a character who answers you by voice.
When you make a mistake, a coach shows the fix (✗ → ✓) with a short Arabic
explanation. You say the corrected sentence out loud before moving on.
Corrections are saved to **My phrases** for later practice.

Open `index.html` through any static web server (GitHub Pages works).
It runs entirely in the browser and needs no build step and no backend.

```
python3 -m http.server 8000      # then open http://localhost:8000/lisan/
```

Voice input works in Chrome, Edge and Safari (desktop, Android and iOS).
In other browsers you can type your answers.

---

## Project layout

```
lisan/
├── index.html               app shell
├── css/app.css              design tokens (light + dark) and components
├── js/
│   ├── voice-key.js         stable clip IDs (shared with the build tool)
│   ├── voice.js             speech OUTPUT engine (pluggable providers)
│   ├── listen.js            speech INPUT engine (device / cloud)
│   ├── coach.js             grammar correction + answer matching (offline)
│   ├── scenarios.js         all conversation content (pure data)
│   └── app.js               screens, conversation flow, progress, settings
├── voice/manifest.json      studio voice pack index (empty until built)
├── tools/build-voice-pack.mjs  pre-records every line with a neural voice
├── icons/, manifest.webmanifest  install to home screen
```

## Voice quality: three upgrade paths

The UI never calls a speech API directly. It calls
`LisanVoice.speak(text, { role, gender })`, and the engine uses the best
voice that can say that line, falling back automatically:

| Priority | Provider | When it's used | Quality |
|---|---|---|---|
| 1 | **Studio voice pack** | the line exists in `voice/manifest.json` | best, works offline, no runtime cost |
| 2 | **Cloud neural voice** | configured in Settings → *Connect a premium voice* | excellent, any sentence |
| 3 | **Device voice** | always available | ranked: Natural / Neural / Premium / Siri voices first; novelty voices never |

Content refers to *voice profiles* (`us-female`, `us-male`, `gb-female`,
`gb-male`, `coach-us`, `coach-gb`), never to concrete voices. Swapping voices
means changing a mapping. Lessons and UI stay the same.

### 1. Build a studio voice pack (recommended)

```
cd lisan
OPENAI_API_KEY=sk-...  node tools/build-voice-pack.mjs --provider openai --accents us,gb
# or
ELEVENLABS_API_KEY=... node tools/build-voice-pack.mjs --provider elevenlabs
```

* Generates every fixed line: character lines, model answers and coach lines
  (≈170 lines per accent, ~7k characters).
* Each file is named by a hash of *voice profile + exact text*. If you edit or
  reorder lines and re-run, only changed lines are generated. Until then, a
  changed line falls back to the next provider.
* `--dry-run` lists what would be generated, `--voices '{"us-female":"nova"}'`
  overrides voices, and `--prune` removes clips that are no longer used.
* Commit `voice/` and the app picks the clips up on the next load.

### 2. Live cloud voice (covers dynamic sentences)

The coach reads out *your own* corrected sentence, which can't be
pre-recorded. In **Settings → Voice quality → Connect a premium voice**,
choose OpenAI, ElevenLabs or **Your own server**:

* `POST {text, profile, voice, accent, gender, lang, role}` → audio bytes.
* Audio is cached in the browser (Cache Storage), so a line is paid for once.
* Use the same voices as your studio pack and the switch between the two can't
  be heard.
* For a public deployment, use *Your own server* (a small proxy) so API keys
  never reach the browser.

### 3. Better speech recognition

Settings → Listening → **Cloud** sends the recording to an OpenAI-compatible
transcription endpoint (`gpt-4o-mini-transcribe` / Whisper). It handles
accented speech much better than the device recognizer. The prompt asks it to
keep the learner's mistakes, because the coach needs to hear exactly what was said.

### Adding a provider

A provider is an object with `available()`, `canSpeak(text, profile)` and
`speak(text, profile, {rate, signal, onStart, onWord, onProgress})` returning a
Promise. Add it to `Voice.providers` in `js/voice.js` at the priority you want.
Playback goes through one shared `Player`, which applies an optional clarity
chain (high-pass, presence lift, gentle compression) and real level metering
for the speaking orb.

## Content

* **Add a scenario:** append an object to `SCENARIOS` in `js/scenarios.js`.
  The field reference is at the top of that file. Re-run the voice pack
  builder.
* **Add a grammar rule:** append `{ id, type:'error'|'style', en, ar, apply }`
  to `RULES` in `js/coach.js`. Rules target common Arabic-speaker
  errors, for example: missing *to* / *am*, *I not have*, *since two days*,
  *open the light*, *I have 25 years*, *more better* and *discuss about*.

## Where a full AI conversation would plug in

`Talk.prototype.onAnswer` in `js/app.js` is the single place that decides the
reply. Today it follows a scripted scenario, with the offline coach doing the
correcting. An LLM-backed partner would replace the next-line choice there.
The voice and listening layers stay as they are.
