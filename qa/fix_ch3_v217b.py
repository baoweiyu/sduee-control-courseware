# -*- coding: utf-8 -*-
"""p26/p27 补刀：LF 换行版本。"""
import io, sys

ROOT = r"H:\D_tools\courseware-system-kimi\lessons\lesson03-timedomain\pages"

EDITS = {
 "p26-resp-over.html": [
  ('两个相异负实极点：<span class="tex" style="font-size:23px">s_{1,2} = -\\left(\\zeta \\pm \\sqrt{\\zeta^{2}-1}\\right)\\omega_{n}</span>\n            <div class="mathbox math eqline tex tex-d" style="font-size:23.5px;margin-top:10px">h(t) = 1 + A_{1}e^{s_{1}t} + A_{2}e^{s_{2}t} \\quad (t \\geq 0)</div>',
   '<div class="mathbox math eqline tex tex-d" style="font-size:23px;margin-bottom:10px">C(s) = \\dfrac{\\omega_{n}^{2}}{s\\,(s^{2}+2\\zeta\\omega_{n}\\,s+\\omega_{n}^{2})} = \\dfrac{1}{s} + \\dfrac{A_{1}}{s-s_{1}} + \\dfrac{A_{2}}{s-s_{2}}</div>\n            <div style="margin-bottom:10px">两个相异负实极点（位于负实轴）：<span class="tex" style="font-size:23px">s_{1,2} = -\\left(\\zeta \\pm \\sqrt{\\zeta^{2}-1}\\right)\\omega_{n}</span></div>\n            <div class="mathbox math eqline tex tex-d" style="font-size:23.5px;margin-bottom:10px">h(t) = 1 + A_{1}e^{s_{1}t} + A_{2}e^{s_{2}t} \\quad (t \\geq 0)</div>'),
 ],
 "p27-resp-crit.html": [
  ('重实极点：<span class="tex" style="font-size:24px">s_{1,2} = -\\omega_{n}</span>\n            <div class="mathbox math eqline tex tex-d" style="font-size:24px;margin-top:8px">C(s)',
   '<div class="mathbox math eqline tex tex-d" style="font-size:24px;margin-bottom:10px">C(s)'),
  ('= \\dfrac{1}{s} - \\dfrac{1}{s+\\omega_{n}} - \\dfrac{\\omega_{n}}{(s+\\omega_{n})^{2}}</div>\n            <div class="mathbox math eqline tex tex-d" style="font-size:26px">h(t) = 1 - (1 + \\omega_{n} t)\\,e^{-\\omega_{n} t} \\quad (t \\geq 0)</div>',
   '= \\dfrac{1}{s} - \\dfrac{1}{s+\\omega_{n}} - \\dfrac{\\omega_{n}}{(s+\\omega_{n})^{2}}</div>\n            <div style="margin-bottom:10px">重实极点（位于负实轴）：<span class="tex" style="font-size:24px">s_{1,2} = -\\omega_{n}</span></div>\n            <div class="mathbox math eqline tex tex-d" style="font-size:26px;margin-bottom:10px">h(t) = 1 - (1 + \\omega_{n} t)\\,e^{-\\omega_{n} t} \\quad (t \\geq 0)</div>\n            <div style="font-size:20.5px;color:var(--muted)">重根使响应含 t·e<sup>−ω<sub>n</sub>t</sup> 项 —— 单调上升、无超调。</div>'),
 ],
}

fail = 0
for fn, pairs in EDITS.items():
    path = ROOT + "\\" + fn
    s = io.open(path, encoding="utf-8").read()
    for i, (old, new) in enumerate(pairs, 1):
        if old not in s:
            print("MISS %s #%d" % (fn, i)); fail += 1
        else:
            s = s.replace(old, new, 1)
    io.open(path, "w", encoding="utf-8", newline="").write(s)
    print("OK %s" % fn)
print("FAIL=" + str(fail))
sys.exit(1 if fail else 0)
