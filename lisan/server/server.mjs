/* ==========================================================================
   Lisan · server.mjs — serves the app and its AI, keys stay here
   --------------------------------------------------------------------------
     GET  /api/health   what this server offers
     POST /api/brain    {task, ctx} → Claude (prompts built here from
                        js/prompts.js; never an open relay)
                        task "turn" streams plain text, others return JSON
     POST /api/tts      {text, profile} → audio/mpeg (OpenAI or ElevenLabs)
     POST /api/stt      multipart audio → {text} (OpenAI transcription)
     GET  /*            the static app (the lisan/ folder)

   Environment
     ANTHROPIC_API_KEY   Claude (required for the AI partner)
     LISAN_MODEL         Claude model id (default claude-opus-5-5)
     OPENAI_API_KEY      premium voice + accurate speech recognition
     ELEVENLABS_API_KEY  premium voice (used when no OpenAI key)
     PORT                default 8787
   ========================================================================== */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import Anthropic from '@anthropic-ai/sdk';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..');
const require = createRequire(import.meta.url);
const Prompts = require('../js/prompts.js');

const PORT = Number(process.env.PORT) || 8787;
const MODEL = process.env.LISAN_MODEL || 'claude-opus-5-5';
const HAS_CLAUDE = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_PROFILE || process.env.LISAN_CLAUDE === 'on');
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY || '';
const client = HAS_CLAUDE ? new Anthropic() : null;

// Refusals fall back server-side to the model Anthropic recommends for that category.
const FALLBACK = { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' };

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg',
  '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8'
};
function send(res, status, body, type) {
  res.writeHead(status, { 'Content-Type': type || 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(Object.assign(new Error('too large'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Per-client request budget: 90 requests per 5 minutes (a busy conversation
// uses ~3 per learner turn).
const buckets = new Map();
function allow(req) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const now = Date.now();
  const b = buckets.get(ip) || { n: 0, t: now };
  if (now - b.t > 5 * 60 * 1000) { b.n = 0; b.t = now; }
  b.n++;
  buckets.set(ip, b);
  return b.n <= 90;
}

function apiError(res, err) {
  if (err instanceof Anthropic.RateLimitError) return send(res, 429, { error: 'The AI is busy. Try again in a moment.' });
  if (err instanceof Anthropic.AuthenticationError) return send(res, 502, { error: 'The server’s Anthropic key was rejected.' });
  if (err instanceof Anthropic.BadRequestError) return send(res, 502, { error: 'The AI request was rejected.' });
  if (err instanceof Anthropic.APIError) return send(res, 502, { error: 'The AI service returned an error.' });
  if (err && err.status === 413) return send(res, 413, { error: 'Request too large.' });
  console.error('[lisan]', err);
  return send(res, 500, { error: 'Server error.' });
}

/* ------------------------------------------------------------------ *
 * /api/brain
 * ------------------------------------------------------------------ */
async function brain(req, res) {
  if (!client) return send(res, 503, { error: 'The AI partner is not configured on this server.' });
  if (!allow(req)) return send(res, 429, { error: 'Too many requests. Slow down a little.' });
  let payload;
  try { payload = JSON.parse((await readBody(req, 200 * 1024)).toString('utf8')); } catch { return send(res, 400, { error: 'Bad JSON.' }); }
  const task = payload && payload.task;
  if (!Prompts.TASKS.includes(task)) return send(res, 400, { error: 'Unknown task.' });
  const p = Prompts.build(task, payload.ctx);

  if (task === 'turn') {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      ...FALLBACK,
      output_config: { effort: p.effort },
      system: p.system,
      messages: p.messages
    });
    let started = false;
    res.on('close', () => { if (!res.writableEnded) stream.abort(); });
    try {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          if (!started) {
            res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' });
            started = true;
          }
          res.write(event.delta.text);
        }
      }
      const final = await stream.finalMessage();
      if (final.stop_reason === 'refusal') {
        if (!started) return send(res, 422, { error: 'refused' });
        res.write('\nAR: ');
      }
      if (!started) return send(res, 502, { error: 'Empty reply.' });
      res.end();
    } catch (err) {
      if (res.writableEnded || res.destroyed) return;
      if (started) { res.end(); return; }
      return apiError(res, err);
    }
    return;
  }

  try {
    const msg = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      ...FALLBACK,
      output_config: { effort: p.effort, format: { type: 'json_schema', schema: p.schema } },
      system: p.system,
      messages: p.messages
    });
    if (msg.stop_reason === 'refusal') return send(res, 422, { error: 'refused' });
    const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    let data;
    try { data = JSON.parse(text); } catch { return send(res, 502, { error: 'The AI returned malformed data.' }); }
    return send(res, 200, data);
  } catch (err) {
    return apiError(res, err);
  }
}

/* ------------------------------------------------------------------ *
 * /api/tts — premium voice (same voices as tools/build-voice-pack.mjs)
 * ------------------------------------------------------------------ */
const STYLE = 'Speak clearly and warmly, like a friendly native speaker talking to an English learner. Natural rhythm, slightly slower than normal, crisp consonants.';
const VOICES = {
  openai: { 'us-female': 'coral', 'us-male': 'ash', 'gb-female': 'fable', 'gb-male': 'onyx', 'coach-us': 'sage', 'coach-gb': 'sage' },
  elevenlabs: {
    'us-female': '21m00Tcm4TlvDq8ikWAM', 'us-male': 'pNInz6obpgDQGcFmaJgB', 'gb-female': 'Xb7hH8MSUJpSbSDYk0k2',
    'gb-male': 'JBFqnCBsd6RMkjVDRZzb', 'coach-us': 'EXAVITQu4vr4xnAQxRWK', 'coach-gb': 'Xb7hH8MSUJpSbSDYk0k2'
  }
};
const ttsCache = new Map();
async function tts(req, res) {
  if (!OPENAI_KEY && !ELEVEN_KEY) return send(res, 503, { error: 'No voice provider configured.' });
  if (!allow(req)) return send(res, 429, { error: 'Too many requests.' });
  let body;
  try { body = JSON.parse((await readBody(req, 8 * 1024)).toString('utf8')); } catch { return send(res, 400, { error: 'Bad JSON.' }); }
  const text = String(body.text || '').slice(0, 600).trim();
  const profile = Object.keys(VOICES.openai).includes(body.profile) ? body.profile : 'us-female';
  if (!text) return send(res, 400, { error: 'No text.' });
  const key = profile + '|' + text;
  if (ttsCache.has(key)) return send(res, 200, ttsCache.get(key), 'audio/mpeg');
  let r;
  if (OPENAI_KEY) {
    r = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + OPENAI_KEY },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts', voice: VOICES.openai[profile], input: text, response_format: 'mp3',
        instructions: STYLE + (/gb/.test(profile) ? ' Use a British English accent.' : ' Use an American English accent.')
      })
    });
  } else {
    r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + VOICES.elevenlabs[profile] + '?output_format=mp3_44100_128', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'xi-api-key': ELEVEN_KEY, Accept: 'audio/mpeg' },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true } })
    });
  }
  if (!r.ok) return send(res, 502, { error: 'Voice provider error ' + r.status });
  const audio = Buffer.from(await r.arrayBuffer());
  ttsCache.set(key, audio);
  if (ttsCache.size > 500) ttsCache.delete(ttsCache.keys().next().value);
  return send(res, 200, audio, 'audio/mpeg');
}

/* ------------------------------------------------------------------ *
 * /api/stt — pass the browser's multipart form straight to OpenAI
 * ------------------------------------------------------------------ */
async function stt(req, res) {
  if (!OPENAI_KEY) return send(res, 503, { error: 'No transcription provider configured.' });
  if (!allow(req)) return send(res, 429, { error: 'Too many requests.' });
  const type = req.headers['content-type'] || '';
  if (!type.startsWith('multipart/form-data')) return send(res, 400, { error: 'Expected multipart audio.' });
  let body;
  try { body = await readBody(req, 12 * 1024 * 1024); } catch (e) { return apiError(res, e); }
  const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST', headers: { Authorization: 'Bearer ' + OPENAI_KEY, 'Content-Type': type }, body
  });
  if (!r.ok) return send(res, 502, { error: 'Transcription error ' + r.status });
  const j = await r.json();
  return send(res, 200, { text: String(j.text || '') });
}

/* ------------------------------------------------------------------ *
 * Static files
 * ------------------------------------------------------------------ */
function serveStatic(req, res) {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.resolve(ROOT, '.' + rel);
  if (!file.startsWith(ROOT + path.sep) || /[\\/](server|node_modules)[\\/]|[\\/]\./.test(file.slice(ROOT.length))) {
    return send(res, 404, 'Not found', 'text/plain');
  }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'Not found', 'text/plain');
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': /\.(mp3|png|svg)$/.test(file) ? 'public, max-age=86400' : 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    fs.createReadStream(file).pipe(res);
  });
}

/* ------------------------------------------------------------------ *
 * Router
 * ------------------------------------------------------------------ */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname === '/api/health' && req.method === 'GET') {
      return send(res, 200, { ok: true, brain: Boolean(client), tts: Boolean(OPENAI_KEY || ELEVEN_KEY), stt: Boolean(OPENAI_KEY), model: client ? MODEL : null });
    }
    if (url.pathname === '/api/brain' && req.method === 'POST') return await brain(req, res);
    if (url.pathname === '/api/tts' && req.method === 'POST') return await tts(req, res);
    if (url.pathname === '/api/stt' && req.method === 'POST') return await stt(req, res);
    if (url.pathname.startsWith('/api/')) return send(res, 404, { error: 'Not found.' });
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed.' });
    return serveStatic(req, res);
  } catch (err) {
    if (!res.headersSent) apiError(res, err);
  }
});

server.listen(PORT, () => {
  console.log(`Lisan is running at http://localhost:${PORT}/`);
  console.log(`  AI partner: ${client ? 'on (' + MODEL + ')' : 'off — set ANTHROPIC_API_KEY'}`);
  console.log(`  Premium voice: ${OPENAI_KEY ? 'OpenAI' : ELEVEN_KEY ? 'ElevenLabs' : 'off (device voices)'}  ·  Cloud listening: ${OPENAI_KEY ? 'on' : 'off'}`);
});
