# -*- coding: utf-8 -*-
"""V2.36 打包：本地播放版 ×6 + 网页部署版 ×1"""
import zipfile, shutil, json, os, sys

ROOT = r'H:\D_tools\courseware-system-kimi'
V = 'v2.36'
VDISP = 'V2.36'
DATE = '2026-10-28'
OLD_WEB = os.path.join(ROOT, 'act-courseware-web-deploy-v2.35.zip')

CH = [
    ('ch1', '绪论',     'lesson01-intro',     '第一章 绪论'),
    ('ch2', '数学模型', 'lesson02-math-model', '第二章 控制系统的数学模型'),
    ('ch3', '时域分析', 'lesson03-timedomain', '第三章 时域分析法'),
    ('ch4', '频率响应', 'lesson04-freq',       '第四章 频率响应法'),
    ('ch5', '根轨迹法', 'lesson05-root-locus', '第五章 根轨迹法'),
    ('ch6', '系统校正', 'lesson06-correction', '第六章 控制系统的校正'),
]

def w(path):
    return os.path.join(ROOT, path)

import re as _re
USED_IMGS = set()
for dp, _, fn in os.walk(w('lessons')):
    if '.bak' in dp: continue
    for f in fn:
        if f.endswith(('.html', '.js', '.json')):
            try:
                txt = open(os.path.join(dp, f), encoding='utf-8').read()
            except UnicodeDecodeError:
                continue
            USED_IMGS.update(_re.findall(r'image2/[a-z0-9\-]+\.png', txt))
USED_IMGS = sorted(USED_IMGS)
assert len(USED_IMGS) == 40, len(USED_IMGS)

def add_tree(z, src, arc_prefix, exclude_bak=True):
    n = 0
    for dp, dn, fn in os.walk(src):
        if exclude_bak and any('.bak' in d for d in dp.split(os.sep)):
            continue
        dn[:] = [d for d in dn if '.bak' not in d]
        for f in fn:
            full = os.path.join(dp, f)
            rel = os.path.relpath(full, src).replace(os.sep, '/')
            z.write(full, arc_prefix + '/' + rel if arc_prefix else rel)
            n += 1
    return n

def w(path):
    return os.path.join(ROOT, path)

# ---------- 旧包中取模板 ----------
old = zipfile.ZipFile(OLD_WEB)
index_html = old.read('index.html')
deploy_md = old.read('DEPLOY-部署说明.md').decode('utf-8')

NEW_NOTE = ('V2.36 更新：第五、六章课堂教学审查精修（两章共 109 页）——第五章 11 页内容修订；'
            '第六章结构与排版优化、信息量过大的配图改分步显现/依次突出；'
            '第六章全部传递函数框图规范化（信号线段加长、± 号贴入口、框内符号斜体数学字体、标注防重叠）。\n')
assert f'整体版本 V2.35' in deploy_md
deploy_md = deploy_md.replace(f'整体版本 V2.35（2026-10-26）', f'整体版本 {VDISP}（{DATE}）')
deploy_md = deploy_md.replace('V2.35 更新：', NEW_NOTE + 'V2.35 更新：', 1)
assert NEW_NOTE in deploy_md

# ---------- 1. 网页部署版 ----------
out_web = w(f'act-courseware-web-deploy-{V}.zip')
if os.path.exists(out_web): os.remove(out_web)
n = 0
with zipfile.ZipFile(out_web, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('index.html', index_html)
    z.writestr('DEPLOY-部署说明.md', deploy_md.encode('utf-8'))
    z.write(w('server.js'), 'server.js'); n += 3
    for img in USED_IMGS:
        z.write(w('assets/' + img), 'assets/' + img); n += 1
    USED_LEGACY = set()
    for dp, _, fn in os.walk(w('lessons')):
        if '.bak' in dp: continue
        for f in fn:
            if f.endswith(('.html', '.js', '.json')):
                try:
                    txt = open(os.path.join(dp, f), encoding='utf-8').read()
                except UnicodeDecodeError:
                    continue
                USED_LEGACY.update(_re.findall(r'legacy/chapt1/[A-Za-z0-9\-]+\.png', txt))
    for img in sorted(USED_LEGACY):
        z.write(w('assets/' + img), 'assets/' + img); n += 1
    n += add_tree(z, w('components'), 'components')
    n += add_tree(z, w('player'), 'player')
    n += add_tree(z, w('theme'), 'theme')
    z.write(w('lessons/index.json'), 'lessons/index.json'); n += 1
    for _, _, d, _ in CH:
        n += add_tree(z, w('lessons/' + d), 'lessons/' + d)
print('web zip:', out_web, n, 'files', os.path.getsize(out_web)//1024//1024, 'MB')

# ---------- 2. 本地播放版 ×6 ----------
old_ch_zips = {c[0]: zipfile.ZipFile(w(f'act-courseware-{c[0]}-{c[1]}-v2.35.zip')) for c in CH}
for code, cname, ldir, title in CH:
    out = w(f'act-courseware-{code}-{cname}-{V}.zip')
    if os.path.exists(out): os.remove(out)
    readme = None
    oz = old_ch_zips[code]
    for nm in oz.namelist():
        if nm.startswith('README-') and nm.endswith('.txt'):
            readme = oz.read(nm); break
    assert readme, code
    scoped = json.dumps([{"lesson_id": ldir, "path": f"{ldir}/lesson.json", "title": title}],
                        ensure_ascii=False, indent=2)
    n = 0
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('README-播放说明.txt', readme)
        z.write(w('package.json'), 'package.json')
        z.write(w('server.js'), 'server.js')
        for s in ('start.bat', 'start.command', 'start.sh'):
            z.write(w(s), s)
        n += 5
        n += add_tree(z, w('components'), 'components')
        n += add_tree(z, w('player'), 'player')
        n += add_tree(z, w('theme'), 'theme')
        z.writestr('lessons/index.json', scoped); n += 1
        n += add_tree(z, w('lessons/' + ldir), 'lessons/' + ldir)
        # 章节实际引用的 assets（image2 生成图 + legacy 素材图）
        import re
        used = set()
        for dp, _, fn in os.walk(w('lessons/' + ldir)):
            for f in fn:
                if f.endswith(('.html', '.js', '.json')):
                    try:
                        txt = open(os.path.join(dp, f), encoding='utf-8').read()
                    except UnicodeDecodeError:
                        continue
                    used.update(re.findall(r'image2/[a-z0-9\-]+\.png', txt))
                    used.update(re.findall(r'legacy/chapt1/[A-Za-z0-9\-]+\.png', txt))
        for img in sorted(used):
            z.write(w('assets/' + img), 'assets/' + img); n += 1
    print(code, out.split('\\')[-1], n, 'files,', len(used), 'imgs,', os.path.getsize(out)//1024, 'KB')
print('DONE')
