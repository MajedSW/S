#!/usr/bin/env node
/* ==========================================================================
   Lisan · build-voice-pack.mjs
   --------------------------------------------------------------------------
   Pre-records every fixed line in the app (characters, model answers, coach
   lines) with a neural TTS voice and writes:

       voice/<profile>/<key>.mp3       e.g. voice/us-female/3f9a0c1d2b7e41.mp3
       voice/manifest.json             profile → { key → file }

   The app picks these clips up automatically — no code changes. Keys are a
   hash of (profile + exact text), so editing a line just means re-running
   this tool; unchanged lines are skipped.

   Usage
     OPENAI_API_KEY=sk-...    node tools/build-voice-pack.mjs --provider openai
     ELEVENLABS_API_KEY=...   node tools/build-voice-pack.mjs --provider elevenlabs
   Options
     --accents us,gb          which accents to build (default: us)
     --voices '{"us-female":"nova"}'   override voice per profile (JSON)
     --model <id>             override the TTS model
     --concurrency 3          parallel requests
     --force                  re-generate clips that already exist
     --prune                  delete clips no longer used by the content
     --dry-run                list what would be generated, call nothing
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'voice');

/* ---------- args ---------- */
const args = process.argv.slice(2);
const flag = (name) => args.includes('--' + name);
const opt = (name, def) => { const i = args.indexOf('--' + name); return i > -1 && args[i + 1] ? args[i + 1] : def; };
const provider = opt('provider', process.env.OPENAI_API_KEY ? 'openai' : process.env.ELEVENLABS_API_KEY ? 'elevenlabs' : 'openai');
const accents = opt('accents', 'us').split(',').map((s) => s.trim()).filter(Boolean);
const concurrency = Math.max(1, parseInt(opt('concurrency', '3'), 10));
const dryRun = flag('dry-run');
const force = flag('force');
const prune = flag('prune');
let voiceOverrides = {};
try { voiceOverrides = JSON.parse(opt('voices', '{}')); } catch { die('--voices must be JSON'); }

/* ---------- load the app's own modules (same hashing + content) ---------- */
const sandbox = { window: {}, console };
vm.createContext(sandbox);
const contentFiles = fs.readdirSync(path.join(ROOT, 'js')).filter((f) => /^content-.*\.js$/.test(f)).sort().map((f) => 'js/' + f);
for (const f of ['js/voice-key.js', 'js/scenarios.js', ...contentFiles]) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox, { filename: f });
}
const { clipKey, normText } = sandbox.window.LisanVoiceKey;
const { SCENARIOS, COMMON } = sandbox.window.LisanContent;

/* ---------- provider presets (keep in sync with js/voice.js) ---------- */
const STYLE = 'Speak clearly and warmly, like a friendly native speaker talking to an English learner. Natural rhythm, slightly slower than normal, crisp consonants.';
const PRESETS = {
  openai: {
    model: 'gpt-4o-mini-tts', key: 'OPENAI_API_KEY',
    voices: { 'us-female': 'coral', 'us-male': 'ash', 'gb-female': 'fable', 'gb-male': 'onyx', 'coach-us': 'sage', 'coach-gb': 'sage' }
  },
  elevenlabs: {
    model: 'eleven_multilingual_v2', key: 'ELEVENLABS_API_KEY',
    voices: {
      'us-female': '21m00Tcm4TlvDq8ikWAM', 'us-male': 'pNInz6obpgDQGcFmaJgB',
      'gb-female': 'Xb7hH8MSUJpSbSDYk0k2', 'gb-male': 'JBFqnCBsd6RMkjVDRZzb',
      'coach-us': 'EXAVITQu4vr4xnAQxRWK', 'coach-gb': 'Xb7hH8MSUJpSbSDYk0k2'
    }
  }
};
const preset = PRESETS[provider] || die('Unknown --provider ' + provider + ' (use openai or elevenlabs)');
const model = opt('model', preset.model);
const apiKey = process.env[preset.key];
const voiceFor = (profile) => voiceOverrides[profile] || preset.voices[profile];

/* ---------- collect every fixed line ---------- */
const jobs = new Map();
function add(profile, text) {
  if (!text) return;
  const key = clipKey(profile, text);
  jobs.set(profile + '/' + key, { profile, key, text: normText(text) });
}
for (const a of accents) {
  const coach = 'coach-' + a;
  add(a + '-female', 'Hi! This is how I sound. Take your time, and let’s practice together.');
  for (const line of Object.values(COMMON.coach)) add(coach, line.en);
  for (const s of SCENARIOS) {
    const persona = a + '-' + (s.persona.gender === 'male' ? 'male' : 'female');
    add(persona, COMMON.persona.reprompt.en);
    add(persona, s.outro && s.outro.en);
    for (const t of s.turns) {
      add(persona, t.ai.en);
      add(persona, t.reprompt && t.reprompt.en);
      if (t.ack) { add(persona, t.ack.yes && t.ack.yes.en); add(persona, t.ack.no && t.ack.no.en); }
      add(coach, t.model && t.model.en);
      add(coach, t.also && t.also.en);
    }
  }
}

/* ---------- manifest ---------- */
const manifestPath = path.join(OUT, 'manifest.json');
let manifest = { version: 1, profiles: {}, clips: {} };
try { manifest = Object.assign(manifest, JSON.parse(fs.readFileSync(manifestPath, 'utf8'))); } catch { /* new */ }
manifest.clips = manifest.clips || {};
manifest.profiles = manifest.profiles || {};

const todo = [...jobs.values()].filter((j) => force || !fs.existsSync(path.join(OUT, j.profile, j.key + '.mp3')));
const chars = todo.reduce((n, j) => n + j.text.length, 0);
console.log(`Lisan voice pack · provider=${provider} model=${model} accents=${accents.join(',')}`);
console.log(`${jobs.size} lines in content · ${todo.length} to generate · ${chars.toLocaleString()} characters`);

if (dryRun) {
  for (const j of todo) console.log(`  ${j.profile.padEnd(10)} ${voiceFor(j.profile).padEnd(22)} ${j.text}`);
  process.exit(0);
}
if (todo.length && !apiKey) die(`Set ${preset.key} to generate clips (or use --dry-run).`);

/* ---------- synthesis ---------- */
async function synth(job) {
  const voice = voiceFor(job.profile);
  const gb = job.profile.endsWith('gb') || job.profile.startsWith('gb');
  let res;
  if (provider === 'openai') {
    res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
      body: JSON.stringify({
        model, voice, input: job.text, response_format: 'mp3',
        instructions: STYLE + (gb ? ' Use a British English accent.' : ' Use an American English accent.')
      })
    });
  } else {
    res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey, Accept: 'audio/mpeg' },
      body: JSON.stringify({
        text: job.text, model_id: model,
        voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true }
      })
    });
  }
  if (!res.ok) throw new Error(`${res.status} ${await res.text().catch(() => '')}`.slice(0, 300));
  return Buffer.from(await res.arrayBuffer());
}

async function withRetry(fn, tries = 4) {
  for (let i = 0; ; i++) {
    try { return await fn(); } catch (e) {
      if (i >= tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
    }
  }
}

let done = 0, failed = 0;
async function worker(queue) {
  while (queue.length) {
    const job = queue.shift();
    try {
      const buf = await withRetry(() => synth(job));
      fs.mkdirSync(path.join(OUT, job.profile), { recursive: true });
      fs.writeFileSync(path.join(OUT, job.profile, job.key + '.mp3'), buf);
      done++;
      process.stdout.write(`\r  generated ${done}/${todo.length}`);
    } catch (e) {
      failed++;
      console.error(`\n  ✗ ${job.profile} "${job.text}": ${e.message}`);
    }
  }
}
const queue = todo.slice();
await Promise.all(Array.from({ length: concurrency }, () => worker(queue)));
if (todo.length) process.stdout.write('\n');

/* ---------- rebuild manifest from what is on disk ---------- */
const wanted = new Set([...jobs.values()].map((j) => j.profile + '/' + j.key));
for (const j of jobs.values()) {
  if (!fs.existsSync(path.join(OUT, j.profile, j.key + '.mp3'))) continue;
  (manifest.clips[j.profile] ||= {})[j.key] = `${j.profile}/${j.key}.mp3`;
  manifest.profiles[j.profile] = { provider, model, voice: voiceFor(j.profile) };
}
if (prune) {
  let removed = 0;
  for (const [profile, clips] of Object.entries(manifest.clips)) {
    for (const key of Object.keys(clips)) {
      if (wanted.has(profile + '/' + key)) continue;
      try { fs.unlinkSync(path.join(OUT, clips[key])); } catch { /* already gone */ }
      delete clips[key];
      removed++;
    }
  }
  console.log(`  pruned ${removed} unused clips`);
}
manifest.generatedAt = new Date().toISOString();
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
const total = Object.values(manifest.clips).reduce((n, c) => n + Object.keys(c).length, 0);
console.log(`Done · ${done} new · ${failed} failed · ${total} clips in manifest`);
if (failed) process.exitCode = 1;

function die(msg) { console.error(msg); process.exit(1); }
