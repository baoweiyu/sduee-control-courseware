# -*- coding: utf-8 -*-
"""把扩展两页 p76/p77 移到 p54 之后（成为新 p55/p56），原 p55..p75 顺移 +2。"""
import json, re, shutil, sys
from pathlib import Path

base = Path('lessons/lesson04-freq')
pages_dir = base / 'pages'

# 0. 前置断言
assert (pages_dir / 'p76-zeta-slope-proof.html').exists()
assert (pages_dir / 'p77-zeta-slope-vectors.html').exists()
assert (pages_dir / 'p55-part3-cover.html').exists()
assert (pages_dir / 'p75-notes-summary.html').exists()

# 1. 文件重命名
tmp1 = pages_dir / 'zz-tmp-ext1.html'
tmp2 = pages_dir / 'zz-tmp-ext2.html'
shutil.move(str(pages_dir / 'p76-zeta-slope-proof.html'), str(tmp1))
shutil.move(str(pages_dir / 'p77-zeta-slope-vectors.html'), str(tmp2))
for i in range(75, 54, -1):
    srcs = list(pages_dir.glob(f'p{i}-*.html'))
    assert len(srcs) == 1, f'p{i}: {srcs}'
    src = srcs[0]
    dst = pages_dir / src.name.replace(f'p{i}-', f'p{i + 2}-', 1)
    shutil.move(str(src), str(dst))
shutil.move(str(tmp1), str(pages_dir / 'p55-zeta-slope-proof.html'))
shutil.move(str(tmp2), str(pages_dir / 'p56-zeta-slope-vectors.html'))

# 2. lesson.json
lj = base / 'lesson.json'
d = json.loads(lj.read_text(encoding='utf-8'))
pages = d['pages']
assert pages[75] == 'pages/p76-zeta-slope-proof.html', pages[75]
assert pages[76] == 'pages/p77-zeta-slope-vectors.html', pages[76]
assert pages[54] == 'pages/p55-part3-cover.html', pages[54]
d['pages'] = pages[:54] + [pages[75], pages[76]] + pages[54:75] + pages[77:]
assert len(d['pages']) == 91
lj.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# 3. 全部页面 data-page 与文件名同步
n_fixed = 0
for f in sorted(pages_dir.glob('p*.html')):
    m = re.match(r'p(\d+)-', f.name)
    nn = int(m.group(1))
    s = f.read_text(encoding='utf-8')
    s2, cnt = re.subn(r'data-page="\s*\d+\s*/\s*91\s*"', f'data-page="{nn} / 91"', s)
    assert cnt == 1, f'{f.name}: cnt={cnt}'
    if s2 != s:
        f.write_text(s2, encoding='utf-8')
        n_fixed += 1

# 4. CSS 注释里的页码范围（不可见，仅保持准确）
for name, old, new in [
    ('p59-map-vector.html', 'P56-61', 'P59-64'),
    ('p60-map-diff.html', 'P56-61', 'P59-64'),
    ('p61-map-product.html', 'P56-61', 'P59-64'),
    ('p62-map-encircle.html', 'P56-61', 'P59-64'),
    ('p63-map-outside.html', 'P56-61', 'P59-64'),
    ('p64-map-general.html', 'P55-60', 'P58-63'),
]:
    f = pages_dir / name
    s = f.read_text(encoding='utf-8')
    if old in s:
        f.write_text(s.replace(old, new), encoding='utf-8')

print(f'OK: files moved, lesson.json reordered, data-page fixed on {n_fixed} files')
