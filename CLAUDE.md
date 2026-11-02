# Spoken voices in games and programs

Any spoken line in a game or program in this repo comes from Microsoft Azure neural text-to-speech,
generated ahead of time with `tools/game-voices.py` and shipped as MP3 files next to the game. The
owner chose Azure after comparing it with Gemini and the device's own voice in the voice lab
(`voice-lab/`). Never call Azure from a page: the key would be visible to anyone who opens it.

## Writing the lines

- Put every word in full tashkeel. Azure follows the diacritics it is given and guesses the rest, and
  in the voice lab its guesses differed from the correct reading on every line. The script warns about
  any Arabic word with no haraka. Azure pauses on a sentence's last word by itself, so write the case
  ending there as grammar requires («قَادِمٌ.» is read «قَادِمْ»).
- Show the owner the vowelled lines before generating; they check the tashkeel.
- Default voice `ar-SA-HamedNeural` (male, Saudi). Also liked: `ar-SA-ZariyahNeural` (female, Saudi).
  `python3 tools/azure-tts.py --check` lists all 32 Arabic voices and proves the key and network work.

## Generating

Keep the lines in a JSON file beside the game, e.g. `star-blaster-lines.json`:

```json
{"voice": "ar-SA-HamedNeural",
 "lines": [{"id": "start", "text": "مَرْحَبًا يَا بَطَلُ!"}]}
```

```
python3 tools/game-voices.py star-blaster-lines.json --out star-blaster/voices
```

It writes `<id>.mp3` per line and `manifest.json`, remakes only lines whose text or voice changed, and
levels every clip to -14.5 LUFS. Commit the lines file, the MP3s and the manifest.

## Playing them in a game

The games already open a Web Audio context on the first tap (`AU.ctx`, `AU.master` in
`nova-squadron.html`). Decode the clips into that context and play them through the master gain, which
works on iPhone after that tap, unlike starting `new Audio()` from game events:

```js
const VOICE = {};
async function loadVoices(){
  const m = await (await fetch('voices/manifest.json')).json();
  await Promise.all(m.lines.map(async l => {
    VOICE[l.id] = await AU.ctx.decodeAudioData(await (await fetch('voices/' + l.file)).arrayBuffer());
  }));
}
function say(id){
  const b = VOICE[id];
  if (!b || !AU.ctx || !AU.on) return;
  const s = AU.ctx.createBufferSource(); s.buffer = b; s.connect(AU.master); s.start();
}
```

Call `loadVoices()` right after the audio context is created. When publishing the game as an Artifact,
pass each clip and the manifest in `files` under `voices/`.

## Account limits

- Key: `AZURE_SPEECH_KEY` in the cloud environment's variables. Region `qatarcentral` is the default;
  `AZURE_SPEECH_REGION` overrides it. Network access allows `qatarcentral.tts.speech.microsoft.com`.
- Free tier: 500,000 characters a month (about 10,000 vowelled lines) and about 20 requests a minute;
  the script waits when rate limited. When the month's quota runs out Azure refuses until next month.
