#!/usr/bin/env python3
"""
Found Room — Site Builder
=========================
Assembles static HTML pages from modular source files.

Usage:
    python3 build.py

Structure:
    _src/
      layouts/base.html       — HTML shell template
      partials/header.html    — shared nav (edit to change nav site-wide)
      partials/footer.html    — shared footer
      pages/
        <page-name>/
          config.json         — title, description, output filename
          style.css           — page-specific CSS
          sections/           — content modules in alphabetical order
            01-hero.html
            02-section.html
            ...

Output:
    Root-level HTML files (index.html, about.html, etc.)
"""

import os
import json
import glob

REPO     = os.path.dirname(os.path.abspath(__file__))
SRC      = os.path.join(REPO, '_src')
LAYOUTS  = os.path.join(SRC, 'layouts')
PARTIALS = os.path.join(SRC, 'partials')
PAGES    = os.path.join(SRC, 'pages')


def read(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()


def build():
    # Load shared pieces
    base     = read(os.path.join(LAYOUTS,  'base.html'))
    header   = read(os.path.join(PARTIALS, 'header.html'))
    footer   = read(os.path.join(PARTIALS, 'footer.html'))

    pages_built = []

    # Find all page directories
    for page_dir in sorted(os.listdir(PAGES)):
        page_path = os.path.join(PAGES, page_dir)
        if not os.path.isdir(page_path):
            continue

        config_path = os.path.join(page_path, 'config.json')
        if not os.path.exists(config_path):
            print(f'  ⚠ Skipping {page_dir} — no config.json')
            continue

        config = json.loads(read(config_path))
        title       = config.get('title', 'Found Room')
        description = config.get('description', '')
        output      = config.get('output', f'{page_dir}.html')

        # Load page-specific CSS
        style_path = os.path.join(page_path, 'style.css')
        page_style = read(style_path).strip() if os.path.exists(style_path) else ''

        # Assemble content from sections in order
        sections_dir = os.path.join(page_path, 'sections')
        section_files = sorted(glob.glob(os.path.join(sections_dir, '*.html')))
        content = '\n\n'.join(read(f).strip() for f in section_files)

        # Substitute into base layout
        html = base
        html = html.replace('{{title}}',       title)
        html = html.replace('{{description}}', description)
        html = html.replace('{{page_style}}',  page_style)
        html = html.replace('{{header}}',      header.strip())
        html = html.replace('{{content}}',     content)
        html = html.replace('{{footer}}',      footer.strip())

        # Write output file to repo root
        out_path = os.path.join(REPO, output)
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(html)

        pages_built.append(output)
        print(f'  ✓ {output}')

    print(f'\nBuilt {len(pages_built)} pages.')


if __name__ == '__main__':
    print('Building Found Room...\n')
    build()
    print('\nDone. Run `git push` to deploy.')
