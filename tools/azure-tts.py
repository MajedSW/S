#!/usr/bin/env python3
"""Voice the Arabic voice lab's game lines with Microsoft Azure neural voices and save them as MP3.

Reads AZURE_SPEECH_KEY and AZURE_SPEECH_REGION (the Location/Region of the
Speech resource, e.g. eastus). It calls the plain REST endpoint on
<region>.tts.speech.microsoft.com, so that host must be allowed in the
environment's network access. (The Speech SDK talks over WebSocket, which the
session's proxy does not carry.) One request per line and voice; it writes:
  voice-lab/azure/<voice>-<n>.mp3   one clip per line (n = 1..6), e.g. hamed-1.mp3
  voice-lab/azure/manifest.json     voices, lines and clip lengths, read by the page

Clips that already exist are skipped; --force regenerates everything.

usage: python3 tools/azure-tts.py --check      # list the Arabic voices: proves the key, region and network
       python3 tools/azure-tts.py              # 6 lines x Hamed and Zariyah (Saudi)
       python3 tools/azure-tts.py --voices ar-SA-HamedNeural,ar-EG-SalmaNeural --force
"""
import argparse
import importlib.util
import json
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape

# the lines, MP3 encoding and clip length come from the Gemini script, so both read identical text
_spec = importlib.util.spec_from_file_location('gemini_tts', Path(__file__).with_name('gemini-tts.py'))
gemini = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(gemini)

OUT = Path(__file__).resolve().parent.parent / 'voice-lab' / 'azure'
RATE = 24000
FORMAT = 'raw-24khz-16bit-mono-pcm'  # raw PCM, trimmed and encoded the same way as the Gemini clips

# Arabic labels are shown on the page. Saudi voices first; any other Azure voice name works with --voices.
VOICES = {
    'ar-SA-HamedNeural':   {'id': 'Hamed', 'ar': 'حامد', 'trait': 'صوت رجالي سعودي'},
    'ar-SA-ZariyahNeural': {'id': 'Zariyah', 'ar': 'زارية', 'trait': 'صوت نسائي سعودي'},
}


def base(region):
    return os.environ.get('AZURE_TTS_BASE') or f'https://{region}.tts.speech.microsoft.com'


def call(url, key, body=None, accept_json=False, tries=5):
    ctx = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE') or None)
    headers = {'Ocp-Apim-Subscription-Key': key, 'User-Agent': 'voice-lab'}
    if body is not None:
        headers.update({'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': FORMAT})
    for attempt in range(tries):
        req = urllib.request.Request(url, data=body, headers=headers, method='POST' if body is not None else 'GET')
        try:
            with urllib.request.urlopen(req, timeout=60, context=ctx) as r:
                data = r.read()
                return json.loads(data) if accept_json else data
        except urllib.error.HTTPError as e:
            text = e.read().decode(errors='replace')[:600]
            if e.code == 429 and attempt < tries - 1:
                wait = int(e.headers.get('Retry-After') or 0) or 15 * (attempt + 1)
                print(f'  rate limited, waiting {wait}s', flush=True)
                time.sleep(wait)
                continue
            if e.code >= 500 and attempt < tries - 1:
                time.sleep(5 * (attempt + 1))
                continue
            if e.code == 401:
                sys.exit('Azure refused the key (401). Check AZURE_SPEECH_KEY (KEY 1 from Keys and Endpoint) '
                         'and that AZURE_SPEECH_REGION is the same resource\'s Location/Region.\n' + text)
            if e.code == 403 and re.search(r'quota|exceed', text, re.I):
                sys.exit('The free tier\'s monthly quota is used up; it resets next month. Finished clips are kept.\n' + text)
            sys.exit(f'Azure error {e.code} for {url}:\n{text}')
        except urllib.error.URLError as e:
            if 'Tunnel connection failed: 403' in str(e.reason):
                sys.exit(f'The session\'s network policy blocks {url.split("/")[2]}. Add it under Allowed domains '
                         'in the environment\'s Network access, then start a new session.')
            if attempt < tries - 1:
                time.sleep(5 * (attempt + 1))
                continue
            sys.exit(f'Could not reach {url}: {e.reason}')
    sys.exit(f'Azure kept rate limiting {url}; try again in a minute')


def ssml(voice, text):
    lang = '-'.join(voice.split('-')[:2])
    return (f"<speak version='1.0' xml:lang='{lang}'><voice name='{voice}'>{escape(text)}</voice></speak>").encode()


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('--check', action='store_true', help='list the Arabic voices for this key and region, then stop')
    ap.add_argument('--voices', default=','.join(VOICES), help='comma-separated Azure voice names')
    ap.add_argument('--force', action='store_true', help='regenerate clips that already exist')
    ap.add_argument('--out', type=Path, default=OUT, help=f'output folder (default: {OUT})')
    args = ap.parse_args()

    key, region = os.environ.get('AZURE_SPEECH_KEY'), os.environ.get('AZURE_SPEECH_REGION')
    if not key or not region:
        sys.exit('Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in the cloud environment\'s environment variables, '
                 'allow <region>.tts.speech.microsoft.com in its network access, and start a new session.')
    region = region.strip().lower().replace(' ', '')

    if args.check:
        voices = call(f'{base(region)}/cognitiveservices/voices/list', key, accept_json=True)
        arabic = [v for v in voices if v.get('Locale', '').startswith('ar-')]
        for v in arabic:
            print(f"{v['ShortName']:28} {v.get('Gender', ''):7} {v.get('LocaleName', '')}")
        print(f'{len(arabic)} Arabic voices in {region}; the key, region and network all work')
        return

    voices = [v.strip() for v in args.voices.split(',') if v.strip()]
    out = args.out
    out.mkdir(parents=True, exist_ok=True)
    name = lambda v: VOICES.get(v, {}).get('id') or v.split('-')[-1].removesuffix('Neural')
    print(f'region: {region}\nvoices: {", ".join(voices)}', flush=True)

    for n, (text, _where, _style) in enumerate(gemini.LINES, 1):
        for voice in voices:
            dest = out / f'{name(voice).lower()}-{n}.mp3'
            if dest.exists() and not args.force:
                continue
            pcm = call(f'{base(region)}/cognitiveservices/v1', key, ssml(voice, text))
            if len(pcm) < RATE:  # under half a second of audio
                sys.exit(f'Azure returned almost no audio for {voice} line {n} ({len(pcm)} bytes)')
            gemini.to_mp3(pcm, RATE, dest)
            print(f'  {dest.name}  {gemini.duration(dest):.2f}s', flush=True)

    files = {v: [out / f'{name(v).lower()}-{n}.mp3' for n in range(1, len(gemini.LINES) + 1)] for v in voices}
    manifest = {
        'model': 'Azure neural TTS',
        'region': region,
        'generated': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
        'voices': [{'name': v, **VOICES.get(v, {'id': name(v), 'ar': name(v), 'trait': ''})} for v in voices],
        'lines': [{'text': t, 'where': w} for t, w, _ in gemini.LINES],
        'durations': {name(v): [gemini.duration(f) if f.exists() else None for f in files[v]] for v in voices},
        'bytes': {name(v): [f.stat().st_size if f.exists() else None for f in files[v]] for v in voices},
    }
    (out / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    missing = sum(d is None for ds in manifest['durations'].values() for d in ds)
    print(f'wrote {out / "manifest.json"}; {missing} clip(s) missing')


if __name__ == '__main__':
    main()
