#!/usr/bin/env python3
"""Voice the Arabic voice lab's game lines with Gemini TTS and save them as MP3.

Reads the key from GEMINI_API_KEY (or GOOGLE_API_KEY). Without one, it calls
the API bare, so a key the environment stores as a network secret for
generativelanguage.googleapis.com is added on the way. One request per line and
voice; it writes:
  voice-lab/gemini/<voice>-<n>.mp3   one clip per line (n = 1..6)
  voice-lab/gemini/manifest.json     model, voices, lines and clip lengths, read by the page

Clips that already exist are skipped, so a run stopped by a quota limit picks
up where it left off. --force regenerates everything.

usage: python3 tools/gemini-tts.py [--model NAME] [--voices Puck,Fenrir,Leda,Zephyr] [--force]
"""
import argparse
import base64
import json
import os
import re
import ssl
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

API = os.environ.get('GEMINI_API_BASE', 'https://generativelanguage.googleapis.com/v1beta')
OUT = Path(__file__).resolve().parent.parent / 'voice-lab' / 'gemini'

# The same six lines as the page, so the device voice and Gemini read identical text.
# The direction tells Gemini how each moment should feel; the line itself is read as written.
LINES = [
    ('مرحبًا يا بطل! استعدّ للانطلاق.', 'بداية اللعبة', 'an excited, warm welcome that makes a kid want to start playing'),
    ('تحذير! التنّين المدرّع قادم.', 'قبل الزعيم', 'a dramatic, suspenseful warning that is thrilling but never scary'),
    ('أحسنت! انضمّت إليك مركبة جديدة.', 'بوابة السفينة', 'delighted and proud, cheering the kid on'),
    ('قوّة إضافية! أسلحتك أصبحت أقوى.', 'بوابة القوة', 'punchy and energetic, like a power-up announcement'),
    ('انتهت المرحلة الأولى. رائع!', 'نهاية المرحلة', 'a happy celebration of finishing the level'),
    ('خسرت هذه المرّة. حاول مرّة أخرى!', 'شاشة الخسارة', 'kind and encouraging, upbeat rather than sad'),
]

# Gemini's prebuilt voices that suit a lively children's game. Arabic labels are shown on the page.
VOICES = {
    'Puck':   {'ar': 'بَك', 'trait': 'صوت رجالي مَرِح'},
    'Fenrir': {'ar': 'فِنرير', 'trait': 'صوت رجالي متحمّس'},
    'Leda':   {'ar': 'ليدا', 'trait': 'صوت نسائي شبابي'},
    'Zephyr': {'ar': 'زِفير', 'trait': 'صوت نسائي مُشرق'},
}

PROMPT = ('Read this Arabic line aloud for a children\'s video game, in clear Modern Standard Arabic, '
          'as {style}. Say only the Arabic line:\n{text}')


class QuotaExhausted(Exception):
    pass


def request(path, key, body=None, tries=6):
    url = f'{API}/{path}'
    data = None if body is None else json.dumps(body).encode()
    ctx = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE') or None)
    for attempt in range(tries):
        headers = {'Content-Type': 'application/json'}
        if key:
            headers['x-goog-api-key'] = key
        req = urllib.request.Request(url, data=data, method='POST' if data else 'GET', headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=120, context=ctx) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            text = e.read().decode(errors='replace')
            if e.code == 429:
                if re.search(r'per ?day|PerDay|daily', text, re.I):
                    raise QuotaExhausted(text)
                m = re.search(r'"retryDelay":\s*"(\d+(?:\.\d+)?)s"', text)
                wait = float(m.group(1)) + 1 if m else 20 * (attempt + 1)
                print(f'  rate limited, waiting {wait:.0f}s', flush=True)
                time.sleep(wait)
                continue
            if e.code in (401, 403) and re.search(r'API key|unregistered callers|API_KEY', text):
                sys.exit('Gemini refused the call for lack of a valid key. Add it to the cloud environment '
                         '(Network secrets for generativelanguage.googleapis.com, or the environment '
                         'variable GEMINI_API_KEY=...) and start a new session.\n' + text[:600])
            if e.code >= 500 and attempt < tries - 1:
                time.sleep(5 * (attempt + 1))
                continue
            sys.exit(f'Gemini API {e.code} for {path}:\n{text[:2000]}')
    sys.exit(f'Gemini API kept rate limiting {path}; try again later')


def pick_model(key):
    """The newest Flash TTS model the key can use (Flash TTS has a free tier; Pro does not)."""
    models = request('models?pageSize=1000', key).get('models', [])
    tts = [m['name'].removeprefix('models/') for m in models
           if 'tts' in m['name'] and 'generateContent' in m.get('supportedGenerationMethods', [])]
    if not tts:
        sys.exit('This key lists no Gemini TTS model. Pass one with --model.')

    def rank(name):
        version = tuple(int(x) for x in re.findall(r'\d+', name.split('-tts')[0])[:2])
        return ('flash' in name, 'preview' not in name, version, name)
    return max(tts, key=rank)


def to_mp3(pcm, rate, dest):
    """16-bit mono PCM -> trimmed MP3, keeping 60 ms of quiet at each end."""
    trim = 'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.06'
    subprocess.run([
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
        '-f', 's16le', '-ar', str(rate), '-ac', '1', '-i', 'pipe:0',
        '-af', f'{trim},areverse,{trim},areverse',
        '-codec:a', 'libmp3lame', '-b:a', '64k', str(dest),
    ], input=pcm, check=True)


def duration(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                          '-of', 'csv=p=0', str(path)], capture_output=True, text=True, check=True)
    return round(float(out.stdout.strip()), 2)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('--model', help='TTS model id, e.g. gemini-2.5-flash-preview-tts (default: newest Flash TTS)')
    ap.add_argument('--voices', default=','.join(VOICES), help='comma-separated prebuilt voice names')
    ap.add_argument('--force', action='store_true', help='regenerate clips that already exist')
    ap.add_argument('--out', type=Path, default=OUT, help=f'output folder (default: {OUT})')
    args = ap.parse_args()
    out = args.out

    key = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')
    if not key:
        print('GEMINI_API_KEY is not set; trying a network secret for the Gemini API', flush=True)
    voices = [v.strip() for v in args.voices.split(',') if v.strip()]
    model = args.model or pick_model(key)
    print(f'model: {model}\nvoices: {", ".join(voices)}', flush=True)
    out.mkdir(parents=True, exist_ok=True)

    stopped = None
    # line by line, so a run cut short still has every voice on the first lines to compare
    for n, (text, where, style) in enumerate(LINES, 1):
        for voice in voices:
            dest = out / f'{voice.lower()}-{n}.mp3'
            if dest.exists() and not args.force:
                continue
            body = {
                'contents': [{'parts': [{'text': PROMPT.format(style=style, text=text)}]}],
                'generationConfig': {
                    'responseModalities': ['AUDIO'],
                    'speechConfig': {'voiceConfig': {'prebuiltVoiceConfig': {'voiceName': voice}}},
                },
            }
            try:
                res = request(f'models/{model}:generateContent', key, body)
            except QuotaExhausted as e:
                stopped = str(e)[:600]
                break
            parts = (res.get('candidates') or [{}])[0].get('content', {}).get('parts', [])
            audio = next((p['inlineData'] for p in parts if 'inlineData' in p), None)
            if not audio:
                sys.exit(f'no audio for {voice} line {n}: {json.dumps(res, ensure_ascii=False)[:800]}')
            m = re.search(r'rate=(\d+)', audio.get('mimeType', ''))
            to_mp3(base64.b64decode(audio['data']), int(m.group(1)) if m else 24000, dest)
            print(f'  {dest.name}  {duration(dest):.2f}s', flush=True)
        if stopped:
            break

    clips = {v: [f'gemini/{v.lower()}-{n}.mp3' for n in range(1, len(LINES) + 1)] for v in voices}
    manifest = {
        'model': model,
        'generated': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
        'prompt': PROMPT,
        'voices': [{'id': v, **VOICES.get(v, {'ar': v, 'trait': ''})} for v in voices],
        'lines': [{'text': t, 'where': w, 'style': s} for t, w, s in LINES],
        'durations': {v: [duration(out / Path(p).name) if (out / Path(p).name).exists() else None
                          for p in clips[v]] for v in voices},
        'bytes': {v: [(out / Path(p).name).stat().st_size if (out / Path(p).name).exists() else None
                      for p in clips[v]] for v in voices},
    }
    (out / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    missing = sum(d is None for ds in manifest['durations'].values() for d in ds)
    print(f'wrote {out / "manifest.json"}; {missing} clip(s) missing')
    if stopped:
        sys.exit('stopped: the daily quota for this key is used up. Run again tomorrow, '
                 f'or enable billing on the key; finished clips are kept.\n{stopped}')


if __name__ == '__main__':
    main()
