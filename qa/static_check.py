# -*- coding: utf-8 -*-
"""两章页面静态复核：控制字符 + 残留橙色文字强调"""
import os, re, sys

ROOTS = [
    r"H:\D_tools\courseware-system-kimi\lessons\lesson01-intro\pages",
    r"H:\D_tools\courseware-system-kimi\lessons\lesson02-math-model\pages",
    r"H:\D_tools\courseware-system-kimi\lessons\lesson03-timedomain\pages",
]

ctrl_hits = []
orange_hits = []
for root in ROOTS:
    for fn in sorted(os.listdir(root)):
        if not fn.endswith(".html"):
            continue
        path = os.path.join(root, fn)
        with open(path, "rb") as f:
            raw = f.read()
        # 控制字符：TAB(09) / CR(0D) / 其它 C0（除 LF）
        bad = []
        if b"\t" in raw: bad.append("TAB")
        if b"\r" in raw: bad.append("CR")
        for m in re.finditer(rb"[\x00-\x08\x0b\x0c\x0e-\x1f]", raw):
            bad.append("C0:%02x" % m.group(0)[0])
            break
        if bad:
            ctrl_hits.append((fn, ",".join(bad)))
        # 橙色文字强调残留：.em/.hl/.big/.hl2 等 class 规则里用 orange 作 color/fill
        text = raw.decode("utf-8", errors="replace")
        for m in re.finditer(r"\.(\w[\w-]*)\b[^{}]*\{[^{}]*\}", text):
            rule = m.group(0)
            if re.search(r"(color|fill)\s*:\s*(var\(--orange\)|#F5821F)", rule):
                # 排除 stroke/marker/背景装饰：只看 color 与 fill
                orange_hits.append((fn, rule.strip()[:110]))

print("== 控制字符 ==")
print("\n".join("%s: %s" % h for h in ctrl_hits) or "无")
print("== 橙色 color/fill 规则 ==")
print("\n".join("%s | %s" % h for h in orange_hits) or "无")
