# Lisan · لسان — speak English with an AI partner who fills your gaps

**The problem:** many Arabic speakers understand English and know the words,
but freeze when they have to speak. They need a partner who keeps them
talking, catches the moment they get stuck and gives them what they're
missing, without stopping the conversation to lecture them.

## What Lisan does

| | |
|---|---|
| **Follows the speaker** | A live AI partner (Claude) reacts to what you actually said, asks one easy question at a time, and adjusts to your level. Talk about anything (12 starter topics or your own), or role-play real situations: airport, hotel, pharmacy, job interview. |
| **Fills the gap** | While you speak, Lisan watches the live transcript. Freeze on "…and I saw a big…" and a card offers the missing words (*shark's fin · زعنفة القرش*). Stay stuck and your partner asks out loud, "Do you mean a shark's fin?", then keeps listening so you can finish your sentence. "Yes" is enough to accept it. |
| **Say it in Arabic** | Mid-sentence, tap **Arabic word**, say the word in Arabic, and get it back in English, spoken and on screen. Then carry on. |
| **Corrects silently** | Your partner echoes your idea back in correct English inside its reply. Those words are underlined, so you notice them without being interrupted. Under your own bubble, a quiet **Polished** line shows the natural version, with **Why?** for a short Arabic explanation. |
| **Knows your difficulties** | Every mistake type and every missing word goes into a local learner profile. Your partner is told your weak spots and recent words, so it models those structures and brings the words back in later conversations. **Progress → What Lisan noticed** shows the same picture. |
| **Coaching report** | At the end: fluency, grammar, vocabulary and confidence scores, what went well, the patterns to work on (with Arabic tips), "say it better" rewrites and new words, all saved to your **Notebook**. |
| **A real curriculum** | 36 role-plays in 6 learning paths, each ordered from easier to harder: **Travel** (9), **Daily life** (6), **Health** (4), **Work** (7), **Study & exams** (5, including IELTS Speaking Parts 1–3) and **Friends & culture** (5, including hosting a guest and explaining Ramadan). Every role-play has an "I can…" goal, a mission, six key words and a cultural or language note. Plus 38 free-conversation topics in six groups, from everyday chat to debates, with six suggested each day for your level and interests. |
| **Works offline too** | Without AI, all 36 role-plays run as guided practice with an offline grammar coach tuned to common Arabic-speaker errors, and the say-it-again loop. |

*Inspired by AI speaking tutors such as Loora (personal AI partner, any-topic
conversation, real-time feedback, rephrasing, progress), plus the live
gap-filling that the brief asked for. All content and code here are original.*

---

## Run it

### With the AI partner (recommended)

```bash
cd lisan/server
npm install
ANTHROPIC_API_KEY=sk-ant-...  npm start          # → http://localhost:8787
```

Optional keys, also server-side only:

| Variable | Adds |
|---|---|
| `OPENAI_API_KEY` | Premium neural voice for every line (`/api/tts`) **and** accurate cloud speech recognition (`/api/stt`) |
| `ELEVENLABS_API_KEY` | Premium neural voice (used when there's no OpenAI key) |
| `LISAN_MODEL` | Claude model id (default `claude-opus-5-5`) |
| `PORT` | default `8787` |

The browser never sees a key. The server builds every prompt itself from a
small, validated context (`js/prompts.js`), so it can't be used as a relay for
arbitrary prompts. It also rate-limits each client. Requests to Claude use
Anthropic's server-side refusal fallback (`fallbacks: "default"`).

**Deploy:** any Node host works (Render, Railway, Fly.io, a VPS). A Dockerfile
is included: `docker build -f server/Dockerfile -t lisan .` from `lisan/`.
Speech input needs HTTPS (or `localhost`).

### Inside Claude

Published as a claude.ai page, Lisan talks to Claude through the viewer's
own account (the page's `sample` capability). No server or key is needed.
That view can't use the microphone, so conversations there are typed.

### Static only (GitHub Pages, any web server)

Open `lisan/index.html` from any static host. Guided role-plays, the offline
coach, device voices and speech input all work, and the AI partner shows as
off.

Voice input works in Chrome, Edge and Safari (desktop, Android, iOS).

---

## How it fits together

```
lisan/
├── index.html
├── css/app.css               design tokens (light + dark) and components
├── js/
│   ├── prompts.js            what the AI partner is told (shared by browser + server)
│   ├── brain.js              AI providers: Lisan server → Claude (claude.ai) → offline
│   ├── live.js               live conversation: streaming, gap filling, silent fixes, report
│   ├── gap.js                notices freezes in the live transcript
│   ├── learner.js            local learner profile (weak spots, missing words)
│   ├── voice.js              speech OUT: studio clips → cloud neural → best device voice
│   ├── listen.js             speech IN: device (live transcript) or cloud transcription
│   ├── coach.js              offline grammar coach for guided mode
│   ├── scenarios.js          paths, topics, first 10 role-plays (pure data)
│   ├── content-*.js          the other 26 role-plays, one file per area
│   └── app.js                screens, guided mode, notebook, progress, settings
├── server/server.mjs         static app + /api/brain, /api/tts, /api/stt
├── tools/build-voice-pack.mjs  pre-records the fixed lines of guided mode
└── tools/check-content.mjs     validates all lesson content
```

### A live turn, step by step

1. **Partner speaks.** `/api/brain` streams the reply. `live.js` starts speaking
   the first finished sentence while the rest is still arriving, so there is
   little wait before you hear it.
2. **You speak.** The device recognizer streams interim words. `GapWatch`
   fires when you ask for a word ("how do you say…") or stall on an unfinished
   sentence (last word *the / a / big / with…*). The `assist` task returns
   options and a cue. If you stay silent, the cue is spoken: recognition is
   paused, the partner talks, and recognition resumes with what you'd already
   said kept.
3. **In parallel:** the partner's next reply (`turn`, with silent recasts)
   and an analysis of your sentence (`feedback` → polished line, fixes, new
   words, learner profile).
4. **At the end:** the `report` task.

| Task | Used for | Returns |
|---|---|---|
| `turn` | the partner's reply | streamed text, then an `AR:` line |
| `feedback` | silent analysis of one sentence | `{better, fixes[], gaps[], praise}` |
| `assist` | gap filler when you freeze | `{options[], cue}` |
| `translate` | Arabic word → English | `{options[], cue}` |
| `hint` | "my mind went blank" | `{starters[]}` |
| `report` | end-of-conversation coaching | scores, focus, words, rewrites |

## Voice quality: three upgrade paths

The UI calls `LisanVoice.speak(text, {role, gender})`. The engine uses the best
voice available and falls back automatically:

1. **Studio voice pack:** `node tools/build-voice-pack.mjs --provider openai`
   pre-records every fixed guided-mode line: about 570 lines per accent
   (≈31k characters). Clips are keyed by their text, so reordering is safe.
2. **Premium cloud voice:** for live AI replies and anything dynamic. It turns
   on automatically when the server has `OPENAI_API_KEY` or
   `ELEVENLABS_API_KEY`, or you can connect a provider in Settings.
3. **Device voice:** the best built-in voice, ranked (Natural / Neural /
   Premium / Siri first).

Settings → **Clarity boost** applies a gentle EQ and compression chain to
recorded and cloud voices.

## Privacy

Progress, the learner profile and the notebook live in this browser's
storage only. In live mode, the conversation text goes to Claude through
your server or your Claude account. Audio goes to a cloud provider only if
you turn on cloud listening.

## Extending

Run `node tools/check-content.mjs` after any content change. It checks that
every path unit exists and every role-play has all its fields. It also checks
that no model answer gets "corrected" by the offline coach (false positives)
and that every model answer is recognised as on-topic.

* **Role-play:** add it to the right `js/content-*.js` file with
  `addScenarios([...])` (field reference at the top of `js/scenarios.js`), then
  list its id in that path's `units` in `PATHS`, in difficulty order. In live
  mode its turns become story beats for the AI; in guided mode they're the
  script. `style: 'exam'` makes the AI a neutral examiner and adds a band
  estimate to the report.
* **Topic:** add `{id, cat, en, ar, icon, angle, level?}` to `TOPICS`.
* **Partner behaviour:** edit `PARTNER_CORE` and the task prompts in
  `js/prompts.js`. The server and claude.ai both use it.
* **Offline grammar rule:** add `{id, type, en, ar, apply}` to `RULES` in
  `js/coach.js`.
