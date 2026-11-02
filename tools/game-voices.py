#!/usr/bin/env python3
"""Voice a game's or program's lines with a Microsoft Azure neural voice: one MP3 per line, shipped with the game.

Needs AZURE_SPEECH_KEY in the environment (KEY 1 from the Speech resource's Keys and Endpoint) and
<region>.tts.speech.microsoft.com under Allowed domains in the environment's network access. The region is
qatarcentral unless AZURE_SPEECH_REGION says otherwise. Standard-library Python 3.8+; when ffmpeg is
installed, clips are trimmed and leveled to the same loudness, otherwise saved as Azure sends them.

The lines file is JSON:
  {"voice": "ar-SA-HamedNeural",
   "lines": [{"id": "start", "text": "مَرْحَبًا يَا بَطَلُ!"},
             {"id": "boss",  "text": "تَحْذِيرٌ! التِّنِّينُ قَادِمٌ."}]}
"voice" is optional (default ar-SA-HamedNeural). Each id becomes a file name. Write every word with full
tashkeel: Azure follows the diacritics it is given and guesses the rest, so the script warns about any
Arabic word that has none.

It writes <out>/<id>.mp3 and <out>/manifest.json (voice, and each line's text, file and length in seconds).
A clip is remade only when its text or voice changed. The key stays here: games play the files and never
call Azure themselves.

usage: python3 tools/game-voices.py --check     # proves the key, region and network; lists the Arabic voices
       python3 tools/game-voices.py star-blaster-lines.json --out star-blaster/voices
       python3 tools/game-voices.py lines.json --out voices --voice ar-SA-ZariyahNeural
       python3 tools/game-voices.py lines.json --out voices --force    # remake every clip
"""
import argparse
import hashlib
import json
import os
import re
import shutil
import ssl
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape

DEFAULT_VOICE = 'ar-SA-HamedNeural'
DEFAULT_REGION = 'qatarcentral'
TARGET_LUFS = -14.5  # every clip this loud, so no line jumps out
RATE = 24000
FFMPEG = shutil.which('ffmpeg')
# with ffmpeg: raw PCM, trimmed, leveled and encoded here; without: Azure's own MP3
FORMAT = 'raw-24khz-16bit-mono-pcm' if FFMPEG else 'audio-24khz-48kbitrate-mono-mp3'
ID = re.compile(r'^[a-z0-9][a-z0-9_-]*$')
HARAKAT = re.compile('[\u064b-\u0652\u0670]')
LETTER = re.compile('[\u0621-\u064a]')


def credentials():
    key = os.environ.get('AZURE_SPEECH_KEY', '').strip()
    region = (os.environ.get('AZURE_SPEECH_REGION') or DEFAULT_REGION).strip().lower().replace(' ', '')
    if not key:
        sys.exit('AZURE_SPEECH_KEY is not set. Add AZURE_SPEECH_KEY=<KEY 1 from the Speech resource\'s Keys and '
                 'Endpoint> to the cloud environment\'s environment variables (not Network secrets), allow '
                 f'{region}.tts.speech.microsoft.com under Allowed domains in its network access, and start a new session.')
    return key, region


def azure(key, region, path, ssml=None, tries=5):
    """GET or POST https://<region>.tts.speech.microsoft.com/cognitiveservices/<path>; returns the body."""
    host = f'{region}.tts.speech.microsoft.com'
    headers = {'Ocp-Apim-Subscription-Key': key, 'User-Agent': 'game-voices'}
    if ssml is not None:
        headers.update({'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': FORMAT})
    ctx = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE') or None)
    for attempt in range(tries):
        req = urllib.request.Request(f'https://{host}/cognitiveservices/{path}', data=ssml, headers=headers,
                                     method='GET' if ssml is None else 'POST')
        try:
            with urllib.request.urlopen(req, timeout=60, context=ctx) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            text = e.read().decode(errors='replace')[:600]
            if (e.code == 429 or e.code >= 500) and attempt < tries - 1:
                wait = int(e.headers.get('Retry-After') or 0) or 15 * (attempt + 1)
                print(f'  Azure is busy ({e.code}), waiting {wait}s', flush=True)
                time.sleep(wait)
                continue
            if e.code == 401:
                sys.exit(f'Azure refused the key (401). Check AZURE_SPEECH_KEY, and that {region} is the Speech '
                         'resource\'s Location/Region (set AZURE_SPEECH_REGION if not).\n' + text)
            if e.code == 403 and re.search(r'quota|exceed', text, re.I):
                sys.exit('This month\'s free quota is used up; it resets next month. Finished clips are kept.\n' + text)
            sys.exit(f'Azure error {e.code}:\n{text}')
        except urllib.error.URLError as e:
            if 'Tunnel connection failed: 403' in str(e.reason):
                sys.exit(f'The network policy blocks {host}. Add it under Allowed domains in the cloud '
                         'environment\'s Network access, then start a new session.')
            if attempt < tries - 1:
                time.sleep(5 * (attempt + 1))
                continue
            sys.exit(f'Could not reach {host}: {e.reason}')
    sys.exit('Azure stayed busy; try again in a minute')


def ffmpeg(*args, pcm):
    return subprocess.run([FFMPEG, '-hide_banner', '-nostats', '-f', 's16le', '-ar', str(RATE), '-ac', '1',
                           '-i', 'pipe:0', *args], input=pcm, capture_output=True, check=True)


def save(audio, dest):
    """Without ffmpeg, Azure's MP3 as is. With it: silence trimmed to 60 ms at each end, loudness raised or
    lowered to TARGET_LUFS with a limiter at -2 dBFS (MP3 encoding overshoots a little), 64 kbps MP3."""
    if not FFMPEG:
        dest.write_bytes(audio)
        return
    measured = ffmpeg('-af', 'ebur128', '-f', 'null', '-', pcm=audio).stderr.decode()
    gain = TARGET_LUFS - float(re.findall(r'I:\s+(-?[\d.]+) LUFS', measured)[-1])
    trim = 'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.06'
    ffmpeg('-y', '-af', f'{trim},areverse,{trim},areverse,volume={gain:.1f}dB,alimiter=limit=0.794:level=0',
           '-codec:a', 'libmp3lame', '-b:a', '64k', str(dest), pcm=audio)


def seconds(path):
    probe = shutil.which('ffprobe')
    if probe:
        out = subprocess.run([probe, '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)],
                             capture_output=True, text=True)
        if out.returncode == 0 and out.stdout.strip():
            return round(float(out.stdout), 2)
    return round(path.stat().st_size * 8 / 48000, 2)  # Azure's MP3 is 48 kbps


def read_lines(path):
    try:
        spec = json.loads(path.read_text(encoding='utf-8'))
    except (OSError, ValueError) as e:
        sys.exit(f'Could not read {path}: {e}')
    lines = spec.get('lines') if isinstance(spec, dict) else None
    if not lines:
        sys.exit(f'{path} has no "lines" list')
    seen = set()
    for line in lines:
        i = line.get('id', '') if isinstance(line, dict) else ''
        if not ID.match(i):
            sys.exit(f'line id {i!r}: use lowercase English letters, digits, - and _ (it becomes the file name)')
        if i in seen:
            sys.exit(f'line id {i!r} appears twice')
        seen.add(i)
        if not str(line.get('text', '')).strip():
            sys.exit(f'line {i!r} has no text')
    return spec.get('voice'), [(line['id'], line['text'].strip()) for line in lines]


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('lines', type=Path, nargs='?', help='JSON file with the lines (see above)')
    ap.add_argument('--out', type=Path, help='folder for the MP3s and manifest.json, e.g. my-game/voices')
    ap.add_argument('--voice', help=f'Azure voice name, overriding the file (default {DEFAULT_VOICE})')
    ap.add_argument('--force', action='store_true', help='remake every clip')
    ap.add_argument('--check', action='store_true', help='list the Arabic voices, proving the key, region and network')
    args = ap.parse_args()
    if not args.check and not (args.lines and args.out):
        ap.error('give a lines file and --out, or --check')

    key, region = credentials()
    if args.check:
        voices = [v for v in json.loads(azure(key, region, 'voices/list')) if v.get('Locale', '').startswith('ar-')]
        for v in voices:
            print(f"{v['ShortName']:28} {v.get('Gender', ''):7} {v.get('LocaleName', '')}")
        print(f'{len(voices)} Arabic voices in {region}: the key, region and network work. '
              + ('ffmpeg found: clips are trimmed and leveled.' if FFMPEG else 'No ffmpeg: clips are saved as Azure sends them.'))
        return

    file_voice, lines = read_lines(args.lines)
    voice = args.voice or file_voice or DEFAULT_VOICE
    lang = '-'.join(voice.split('-')[:2])
    for i, text in lines:
        bare = [w for w in re.findall('[\u0600-\u06ff]+', text) if LETTER.search(w) and not HARAKAT.search(w)]
        if bare:
            print(f'  warning: {i}: no tashkeel on {" ، ".join(bare)}; Azure will guess its vowels', flush=True)

    out = args.out
    out.mkdir(parents=True, exist_ok=True)
    manifest_path = out / 'manifest.json'
    try:
        before = json.loads(manifest_path.read_text(encoding='utf-8'))
        old = {line['id']: line.get('stamp') for line in before.get('lines', [])}
    except (OSError, ValueError, KeyError, TypeError, AttributeError):
        before, old = {}, {}
    print(f'voice: {voice}  region: {region}' + ('' if FFMPEG else '  (no ffmpeg: clips not leveled)'), flush=True)

    made, entries = 0, []
    for i, text in lines:
        dest = out / f'{i}.mp3'
        stamp = hashlib.sha1(f'{voice}\n{text}\n{bool(FFMPEG)}'.encode()).hexdigest()[:12]  # what the clip was made from
        if args.force or not dest.exists() or old.get(i) != stamp:
            ssml = f"<speak version='1.0' xml:lang='{lang}'><voice name='{voice}'>{escape(text)}</voice></speak>"
            audio = azure(key, region, 'v1', ssml.encode())
            if len(audio) < 3000:  # well under half a second
                sys.exit(f'Azure returned almost no audio for {i} ({len(audio)} bytes)')
            save(audio, dest)
            made += 1
            print(f'  {dest.name}  {seconds(dest):.2f}s  {text}', flush=True)
        entries.append({'id': i, 'text': text, 'file': dest.name, 'seconds': seconds(dest), 'stamp': stamp})

    manifest = {
        'voice': voice,
        'generated': datetime.now(timezone.utc).strftime('%Y-%m-%d') if made else before.get('generated'),
        'loudness': f'{TARGET_LUFS} LUFS' if FFMPEG else None,
        'lines': entries,
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{made} clip(s) made, {len(entries) - made} unchanged; wrote {manifest_path}')
    ids = {i for i, _ in lines}
    stale = sorted(p.name for p in out.glob('*.mp3') if p.stem not in ids)
    if stale:
        print('no longer in the lines file (delete them if the game does not use them): ' + ', '.join(stale))


if __name__ == '__main__':
    main()
