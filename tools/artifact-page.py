#!/usr/bin/env python3
"""Turn a standalone game file into the page version the Artifact tool publishes.

The Artifact tool wraps every page in its own <!DOCTYPE html>/<head>/<body>
skeleton, so the published file keeps only what goes inside those tags.

usage: python3 tools/artifact-page.py my-game.html /path/to/out.html
"""
import re
import sys

src, out = sys.argv[1], sys.argv[2]
html = open(src, encoding='utf-8').read()
head = re.search(r'<head[^>]*>(.*?)</head>', html, re.S | re.I)
body = re.search(r'<body[^>]*>(.*)</body>', html, re.S | re.I)
if not head or not body:
    sys.exit(f'{src}: expected a full HTML document with <head> and <body>')

# the skeleton already has the charset and viewport tags
head_inner = re.sub(r'<meta\s+(charset|name="viewport")[^>]*>\s*', '', head.group(1), flags=re.I)
with open(out, 'w', encoding='utf-8') as f:
    f.write(head_inner.strip() + '\n\n' + body.group(1).strip() + '\n')
print(f'wrote {out}')
