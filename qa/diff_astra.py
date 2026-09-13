# -*- coding: utf-8 -*-
"""对比 Astra 修复版与当前工作区：找出第三章改动页面，确认其他章/公共文件未动"""
import os, hashlib

KIMI = r"H:\D_tools\courseware-system-kimi"
ASTRA = r"H:\D_tools\courseware-system-Astra\2026-09-07\project"

def h(p):
    with open(p, 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()

def scan(root, sub):
    """返回 {相对路径: hash}，只扫文件"""
    base = os.path.join(root, sub)
    out = {}
    for dp, _, fns in os.walk(base):
        for fn in fns:
            full = os.path.join(dp, fn)
            out[os.path.relpath(full, base).replace('\\', '/')] = h(full)
    return out

for sub in ['lessons/lesson03-timedomain', 'lessons/lesson01-intro',
            'lessons/lesson02-math-model', 'lessons/lesson04-freq',
            'player', 'theme', 'components']:
    a = scan(ASTRA, sub)
    k = scan(KIMI, sub)
    changed = [p for p in a if p in k and a[p] != k[p]]
    added = [p for p in a if p not in k]
    removed = [p for p in k if p not in a]
    print(f"--- {sub} ---")
    print(f"  改动 {len(changed)}: {sorted(changed) if len(changed)<=25 else str(len(changed))+'个'}")
    if len(changed) > 25:
        for p in sorted(changed): print('    ~', p)
    if added: print(f"  新增 {len(added)}: {sorted(added)}")
    if removed: print(f"  删除 {len(removed)}: {sorted(removed)}")
    if not changed and not added and not removed:
        print("  完全一致 ✓")
