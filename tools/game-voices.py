#!/usr/bin/env python3
"""Voice any game's or program's lines with an Azure neural voice: one MP3 per line, shipped with the game.

The lines file is JSON:
  {"voice": "ar-SA-HamedNeural",
   "lines": [{"id": "start", "text": "مَرْحَبًا يَا بَطَلُ!"},
             {"id": "boss",  "text": "تَحْذِيرٌ! التِّنِّينُ قَادِمٌ."}]}
"voice" is optional (default ar-SA-HamedNeural; `python3 tools/azure-tts.py --check` lists all Arabic
voices). Each id becomes a file name. Write every word with full tashkeel: Azure follows the diacritics it
is given and guesses the rest, so the script warns about any Arabic word that has none.

It writes <out>/<id>.mp3 and <out>/manifest.json (voice, and each line's text, file and length in
seconds). A clip is remade only when its text or voice changed, so editing one line costs one request.
Clips are leveled to the voice lab's loudness, so every game sounds alike. The Azure key stays here:
games play the MP3 files and never call Azure themselves.

usage: python3 tools/game-voices.py star-blaster-lines.json --out star-blaster/voices
       python3 tools/game-voices.py lines.json --out voices --voice ar-SA-ZariyahNeural
       python3 tools/game-voices.py lines.json --out voices --force    # remake every clip
"""
import argparse
import hashlib
import importlib.util
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

# the Azure call, loudness leveling and MP3 encoding are the voice lab's (tools/azure-tts.py)
_spec = importlib.util.spec_from_file_location('azure_tts', Path(__file__).with_name('azure-tts.py'))
azure = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(azure)

DEFAULT_VOICE = 'ar-SA-HamedNeural'
ID = re.compile(r'^[a-z0-9][a-z0-9_-]*$')
LETTER = re.compile('[ء-ي]')


def untashkeeled(text):
    """Arabic words in text with no haraka at all."""
    return [w for w in re.findall('[؀-ۿ]+', text) if LETTER.search(w) and not azure.HARAKAT.search(w)]


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
    ap.add_argument('lines', type=Path, help='JSON file with the lines (see above)')
    ap.add_argument('--out', type=Path, required=True, help='folder for the MP3s and manifest.json, e.g. my-game/voices')
    ap.add_argument('--voice', help=f'Azure voice name, overriding the file (default {DEFAULT_VOICE})')
    ap.add_argument('--force', action='store_true', help='remake every clip')
    args = ap.parse_args()

    file_voice, lines = read_lines(args.lines)
    voice = args.voice or file_voice or DEFAULT_VOICE
    for i, text in lines:
        if bare := untashkeeled(text):
            print(f'  warning: {i}: no tashkeel on {" ، ".join(bare)}; Azure will guess its vowels', flush=True)

    key, region = azure.credentials()
    out = args.out
    out.mkdir(parents=True, exist_ok=True)
    manifest_path = out / 'manifest.json'
    try:
        before = json.loads(manifest_path.read_text(encoding='utf-8'))
        old = {line['id']: line.get('stamp') for line in before.get('lines', [])}
    except (OSError, ValueError, KeyError, TypeError, AttributeError):
        before, old = {}, {}
    print(f'voice: {voice}  region: {region}', flush=True)

    made, entries = 0, []
    for i, text in lines:
        dest = out / f'{i}.mp3'
        stamp = hashlib.sha1(f'{voice}\n{text}'.encode()).hexdigest()[:12]  # what the clip was made from
        if args.force or not dest.exists() or old.get(i) != stamp:
            pcm = azure.call(f'{azure.base(region)}/cognitiveservices/v1', key, azure.ssml(voice, text))
            if len(pcm) < azure.RATE:  # under half a second of audio
                sys.exit(f'Azure returned almost no audio for {i} ({len(pcm)} bytes)')
            azure.gemini.to_mp3(pcm, azure.RATE, dest, azure.level(pcm))
            made += 1
            print(f'  {dest.name}  {azure.gemini.duration(dest):.2f}s  {text}', flush=True)
        entries.append({'id': i, 'text': text, 'file': dest.name, 'seconds': azure.gemini.duration(dest), 'stamp': stamp})

    manifest = {
        'voice': voice,
        'generated': datetime.now(timezone.utc).strftime('%Y-%m-%d') if made else before.get('generated'),
        'loudness': f'{azure.TARGET_LUFS} LUFS',
        'lines': entries,
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{made} clip(s) made, {len(entries) - made} unchanged; wrote {manifest_path}')
    ids = {i for i, _ in lines}
    if stale := sorted(p.name for p in out.glob('*.mp3') if p.stem not in ids):
        print('no longer in the lines file (delete them if the game does not use them): ' + ', '.join(stale))


if __name__ == '__main__':
    main()
