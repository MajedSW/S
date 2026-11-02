# Spoken voices in games and programs

Spoken lines in games and programs here come from Microsoft Azure neural text-to-speech; the owner picked
it after listening to it, Gemini and the device's own voice. Lines are generated ahead of time with
`tools/game-voices.py` and shipped as MP3 files next to the game, so games work offline, cost nothing per
player and never hold the key. Never call Azure from a page: anyone who opens it could take the key.

## Writing the lines

- Full tashkeel on every word. Azure follows the diacritics it is given and guesses the rest, and its
  guesses were wrong often enough to hear. The script warns about any Arabic word with no haraka. Write
  the grammatical case ending on a sentence's last word too; Azure pauses there by itself («قَادِمٌ.» is
  read «قَادِمْ»).
- Show the owner the vowelled lines before generating, so they can check the tashkeel.
- Voice: `ar-SA-HamedNeural` (male, Saudi) by default; `ar-SA-ZariyahNeural` (female, Saudi) is the other
  one the owner liked. `python3 tools/game-voices.py --check` lists every Arabic voice.

## Generating

Keep the lines in a JSON file beside the game, e.g. `star-blaster-lines.json`:

```json
{"voice": "ar-SA-HamedNeural",
 "lines": [{"id": "start", "text": "مَرْحَبًا يَا بَطَلُ!"},
           {"id": "boss",  "text": "تَحْذِيرٌ! التِّنِّينُ قَادِمٌ."}]}
```

```
python3 tools/game-voices.py star-blaster-lines.json --out star-blaster/voices
```

It writes `<id>.mp3` per line and `manifest.json`, and remakes only lines whose text or voice changed.
Commit the lines file, the clips and the manifest. When a game is published as an Artifact, pass the clips
and the manifest in `files` under the same `voices/` path the game loads them from.

## Playing them in a game

```js
// voices.start() inside the first tap (the Start button), then voices.say('boss') from anywhere.
// A game with its own Web Audio context passes it and its output node: voices.start(AU.ctx, AU.master).
const voices = {
  ctx: null, out: null, buf: {},
  async start(ctx, out, dir = 'voices'){
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = ctx || (AC ? new AC() : null);
    if (!this.ctx) return;
    this.out = out || this.ctx.destination;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    try {
      const m = await (await fetch(dir + '/manifest.json')).json();
      await Promise.all(m.lines.map(async l => {
        this.buf[l.id] = await this.ctx.decodeAudioData(await (await fetch(dir + '/' + l.file)).arrayBuffer());
      }));
    } catch (e) { console.warn('voices not loaded', e); }
  },
  say(id){
    const b = this.buf[id];
    if (!b) return;
    const s = this.ctx.createBufferSource();
    s.buffer = b; s.connect(this.out); s.start();
  },
};
```

Web Audio unlocked by that first tap is what lets a line play later from a game event on iPhone; there,
`new Audio(...).play()` outside a tap is blocked.

## Setup and limits

- `AZURE_SPEECH_KEY` is an environment variable in the cloud environment (not a Network secret: Azure
  reads the key from its own header). Network access is Full, or Limited with
  `qatarcentral.tts.speech.microsoft.com` under Allowed domains. The region is qatarcentral unless
  `AZURE_SPEECH_REGION` says otherwise.
- Azure's free tier: 500,000 characters a month (about 10,000 vowelled lines) and about 20 requests a
  minute; the script waits when told to slow down. When the month's quota runs out, Azure refuses until
  the next month and nothing is charged.
