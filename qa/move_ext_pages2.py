# -*- coding: utf-8 -*-
"""步骤2-4：lesson.json 重排 + data-page 同步 + 注释页码修正（文件移动已完成）。"""
import json, re
from pathlib import Path

base = Path('lessons/lesson04-freq')
pages_dir = base / 'pages'

# 2. lesson.json（pages 为 dict 列表）
lj = base / 'lesson.json'
d = json.loads(lj.read_text(encoding='utf-8'))
pages = d['pages']
assert pages[75]['file'] == 'pages/p76-zeta-slope-proof.html', pages[75]
assert pages[76]['file'] == 'pages/p77-zeta-slope-vectors.html', pages[76]
assert pages[54]['file'] == 'pages/p55-part3-cover.html', pages[54]
d['pages'] = pages[:54] + [pages[75], pages[76]] + pages[54:75] + pages[77:]
assert len(d['pages']) == 91
# 顺手把 id 也与新顺序对齐（id 形如 l4-pNN，仅内部标识，按新页码重写）
for i, p in enumerate(d['pages'], start=1):
    p['id'] = f'l4-p{i:02d}'
lj.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('lesson.json reordered:',
      d['pages'][54]['file'], '|', d['pages'][55]['file'], '|', d['pages'][56]['file'])

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
print(f'data-page fixed on {n_fixed} files')

# 4. CSS 注释页码范围
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
        print(f'comment fixed: {name}')
print('DONE')
