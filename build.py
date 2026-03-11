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
            01-hero.md        — supports Markdown (.md) or HTML (.html)
            02-section.md
            ...

Output:
    Root-level HTML files (index.html, about.html, etc.)

Notes:
    - .md section files are rendered via the Python Markdown library
    - If a sections/ directory contains any .md files, ALL .html files in
      that directory are ignored (use .md exclusively after migrating)
    - YAML frontmatter (---...---) at the top of .md files is stripped
      before rendering, so CMS-managed files work correctly
"""

import os
import re
import json
import glob

try:
    import markdown as md_lib
    MD_EXTENSIONS = ['extra', 'md_in_html']
    HAS_MARKDOWN = True
except ImportError:
    HAS_MARKDOWN = False
    print('Warning: markdown library not installed.')
    print('Run: pip install Markdown')
    print('.md section files will fall back to plain text.\n')

REPO     = os.path.dirname(os.path.abspath(__file__))
SRC      = os.path.join(REPO, '_src')
LAYOUTS  = os.path.join(SRC, 'layouts')
PARTIALS = os.path.join(SRC, 'partials')
PAGES    = os.path.join(SRC, 'pages')


def read(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()


def strip_frontmatter(text):
    """
    Remove YAML frontmatter (---...---) from the start of a markdown file.
    Returns the body content only.
    """
    m = re.match(r'^---\s*\n(.*?\n)?---\s*\n(.*)', text, re.DOTALL)
    if m:
        return m.group(2).strip()
    return text.strip()


def dedent_html_tags(text):
    """
    Remove leading whitespace from lines that start with an HTML tag.

    Markdown treats lines indented by 4+ spaces as code blocks, which causes
    HTML tags inside markdown="1" divs to be escaped as <pre><code> if they
    are indented (as they often are for readability in source files).
    Stripping indentation from tag lines prevents this while leaving prose
    lines and blank lines untouched.
    """
    result = []
    for line in text.split('\n'):
        stripped = line.lstrip()
        if stripped.startswith('<') or stripped.startswith('</'):
            result.append(stripped)
        else:
            result.append(line)
    return '\n'.join(result)


def render_section(path):
    """
    Read a section file (.html or .md) and return its HTML content.
    .md files are rendered via the Markdown library; frontmatter is stripped first.
    """
    raw = read(path).strip()

    if path.endswith('.md'):
        body = strip_frontmatter(raw)
        if HAS_MARKDOWN:
            body = dedent_html_tags(body)
            return md_lib.markdown(body, extensions=MD_EXTENSIONS)
        return body  # fallback: return as plain text

    return raw


def collect_sections(sections_dir):
    """
    Collect section files from a directory in alphabetical order.

    Strategy:
    - If ANY .md files exist in the directory, use ONLY .md files.
    - Otherwise, fall back to .html files.
    This lets pages migrate to Markdown incrementally; once you add
    the first .md file, the old .html files in that directory are ignored.
    """
    md_files   = sorted(glob.glob(os.path.join(sections_dir, '*.md')))
    html_files = sorted(glob.glob(os.path.join(sections_dir, '*.html')))

    if md_files:
        return md_files
    return html_files


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

        config      = json.loads(read(config_path))
        title       = config.get('title', 'Found Room')
        description = config.get('description', '')
        output      = config.get('output', f'{page_dir}.html')

        # Load page-specific CSS
        style_path = os.path.join(page_path, 'style.css')
        page_style = read(style_path).strip() if os.path.exists(style_path) else ''

        # Assemble content from sections in order
        sections_dir  = os.path.join(page_path, 'sections')
        section_files = collect_sections(sections_dir)
        content = '\n\n'.join(render_section(f) for f in section_files)

        # Page metadata
        base_url  = 'https://foundroom.co'
        canonical = (base_url + '/') if output == 'index.html' else f'{base_url}/{output}'
        og_image  = config.get('og_image', f'{base_url}/assets/og-default.jpg')
        og_type   = config.get('og_type', 'website')

        # Substitute into base layout
        html = base
        html = html.replace('{{title}}',       title)
        html = html.replace('{{description}}', description)
        html = html.replace('{{canonical}}',   canonical)
        html = html.replace('{{og_image}}',    og_image)
        html = html.replace('{{og_type}}',     og_type)
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
