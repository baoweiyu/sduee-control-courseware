# -*- coding: utf-8 -*-
"""第三章 V2.17 六页修复：精确替换，逐条校验。"""
import io, sys

ROOT = r"H:\D_tools\courseware-system-kimi\lessons\lesson03-timedomain\pages"

# (文件, [(old, new), ...])  —— old 必须与当前文件字节级一致
EDITS = {
 "p06-signal-parab.html": [
  ('<line x1="495" y1="252" x2="495" y2="470" stroke="#F5821F" stroke-width="2.5" stroke-dasharray="9 7"/>',
   '<line x1="495" y1="251" x2="495" y2="470" stroke="#F5821F" stroke-width="2.5" stroke-dasharray="9 7"/>'),
  ('<line x1="90" y1="252" x2="495" y2="252" stroke="#F5821F" stroke-width="2.5" stroke-dasharray="9 7"/>',
   '<line x1="90" y1="251" x2="495" y2="251" stroke="#F5821F" stroke-width="2.5" stroke-dasharray="9 7"/>'),
  ('<circle cx="495" cy="252" r="5" fill="#F5821F"/>',
   '<circle cx="495" cy="251" r="5.5" fill="#F5821F"/>'),
  ('<text x="495" y="505" class="svgsub" font-size="21" text-anchor="middle">t₁</text>',
   '<foreignObject x="475" y="478" width="42" height="34"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:22px;text-align:center;color:#5B6B8C"><span class="tex">t_{1}</span></div></foreignObject>'),
  ('<text x="150" y="238" class="svgsub" font-size="22">½At₁²</text>',
   '<foreignObject x="96" y="203" width="152" height="46"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:22px;text-align:center;color:#5B6B8C"><span class="tex">\\frac{1}{2} A t_{1}^{2}</span></div></foreignObject>'),
 ],
 "p13-ess-meaning.html": [
  ('.mn .k { flex:none; width:118px; text-align:center; background:var(--blue); color:#fff; border-radius:10px; padding:7px 6px;',
   '.mn .k { flex:none; min-width:118px; width:auto; text-align:center; background:var(--blue); color:#fff; border-radius:10px; padding:7px 14px;'),
  ('对单位负反馈系统，当 <span class="tex">t \\to \\infty</span> 时，',
   '对单位负反馈系统，<span style="white-space:nowrap">当 <span class="tex">t \\to \\infty</span> 时</span>，'),
  ('<span class="k">t<sub>d</sub>、t<sub>r</sub></span><span class="v">表征响应',
   '<span class="k">t<sub>d</sub>、t<sub>r</sub>、t<sub>p</sub></span><span class="v">表征响应'),
 ],
 "p23-so-poles.html": [
  (r'= -\zeta\omega_{n} \pm \omega_{n}\sqrt{\zeta^{2}-1}</div>',
   r'= -\zeta\omega_{n} \pm \omega_{n}\sqrt{\zeta^{2}-1} \quad (\zeta \geq 1)</div>'),
 ],
 "p25-resp-zero.html": [
  ('<div class="mathbox math eqline tex tex-d" style="font-size:27px">h(t) = 1 - \\cos\\,\\omega_{n} t \\quad (t \\geq 0)</div>\n            极点 <span class="tex">s_{1,2} = \\pm\\mathrm{j}\\,\\omega_{n}</span>（纯虚根，位于虚轴）。',
   '<div style="margin-bottom:10px">极点 <span class="tex">s_{1,2} = \\pm\\mathrm{j}\\,\\omega_{n}</span>（纯虚根，位于虚轴上）。</div>\n            <div class="mathbox math eqline tex tex-d" style="font-size:27px;margin-bottom:10px">h(t) = 1 - \\cos\\,\\omega_{n} t \\quad (t \\geq 0)</div>\n            <div style="font-size:20.5px;color:var(--muted)">暂态分量无衰减 —— 振幅恒为 1 的等幅余弦振荡。</div>'),
 ],
 "p26-resp-over.html": [
  ('两个相异负实极点：<span class="tex" style="font-size:23px">s_{1,2} = -\\left(\\zeta \\pm \\sqrt{\\zeta^{2}-1}\\right)\\omega_{n}</span>\r\n            <div class="mathbox math eqline tex tex-d" style="font-size:23.5px;margin-top:10px">h(t) = 1 + A_{1}e^{s_{1}t} + A_{2}e^{s_{2}t} \\quad (t \\geq 0)</div>',
   '<div class="mathbox math eqline tex tex-d" style="font-size:23px;margin-bottom:10px">C(s) = \\dfrac{\\omega_{n}^{2}}{s\\,(s^{2}+2\\zeta\\omega_{n}\\,s+\\omega_{n}^{2})} = \\dfrac{1}{s} + \\dfrac{A_{1}}{s-s_{1}} + \\dfrac{A_{2}}{s-s_{2}}</div>\r\n            <div style="margin-bottom:10px">两个相异负实极点（位于负实轴）：<span class="tex" style="font-size:23px">s_{1,2} = -\\left(\\zeta \\pm \\sqrt{\\zeta^{2}-1}\\right)\\omega_{n}</span></div>\r\n            <div class="mathbox math eqline tex tex-d" style="font-size:23.5px;margin-bottom:10px">h(t) = 1 + A_{1}e^{s_{1}t} + A_{2}e^{s_{2}t} \\quad (t \\geq 0)</div>'),
 ],
 "p27-resp-crit.html": [
  ('重实极点：<span class="tex" style="font-size:24px">s_{1,2} = -\\omega_{n}</span>\r\n            <div class="mathbox math eqline tex tex-d" style="font-size:24px;margin-top:8px">C(s)',
   '<div class="mathbox math eqline tex tex-d" style="font-size:24px;margin-bottom:10px">C(s)'),
  ("= \\dfrac{1}{s} - \\dfrac{1}{s+\\omega_{n}} - \\dfrac{\\omega_{n}}{(s+\\omega_{n})^{2}}</div>\r\n            <div class=\"mathbox math eqline tex tex-d\" style=\"font-size:26px\">h(t) = 1 - (1 + \\omega_{n} t)\\,e^{-\\omega_{n} t} \\quad (t \\geq 0)</div>",
   "= \\dfrac{1}{s} - \\dfrac{1}{s+\\omega_{n}} - \\dfrac{\\omega_{n}}{(s+\\omega_{n})^{2}}</div>\r\n            <div style=\"margin-bottom:10px\">重实极点（位于负实轴）：<span class=\"tex\" style=\"font-size:24px\">s_{1,2} = -\\omega_{n}</span></div>\r\n            <div class=\"mathbox math eqline tex tex-d\" style=\"font-size:26px;margin-bottom:10px\">h(t) = 1 - (1 + \\omega_{n} t)\\,e^{-\\omega_{n} t} \\quad (t \\geq 0)</div>\r\n            <div style=\"font-size:20.5px;color:var(--muted)\">重根使响应含 t·e<sup>−ω<sub>n</sub>t</sup> 项 —— 单调上升、无超调。</div>"),
 ],
 "p28-resp-under.html": [
  ('共轭复极点：<span class="tex" style="font-size:24px">s_{1,2} = -\\sigma \\pm j\\omega_{d}</span>，其中',
   '<div class="mathbox math eqline tex tex-d" style="font-size:22.5px;margin-bottom:10px">C(s) = \\dfrac{\\omega_{n}^{2}}{s\\,(s^{2}+2\\zeta\\omega_{n}\\,s+\\omega_{n}^{2})} = \\dfrac{1}{s} - \\dfrac{s+2\\zeta\\omega_{n}}{s^{2}+2\\zeta\\omega_{n}\\,s+\\omega_{n}^{2}}</div>\r\n            共轭复极点（位于左半 s 平面）：<span class="tex" style="font-size:24px">s_{1,2} = -\\sigma \\pm j\\omega_{d}</span>，其中'),
 ],
}

fail = 0
for fn, pairs in EDITS.items():
    path = ROOT + "\\" + fn
    s = io.open(path, encoding="utf-8").read()
    for i, (old, new) in enumerate(pairs, 1):
        if old not in s:
            print("MISS %s #%d: %s" % (fn, i, old[:70]))
            fail += 1
        else:
            s = s.replace(old, new, 1)
    # 版本号 bump 216 -> 217（theme.css 与 act-base.js 两处）
    n = s.count("?v=216")
    s = s.replace("?v=216", "?v=217")
    io.open(path, "w", encoding="utf-8", newline="").write(s)
    print("OK %s: %d 处替换 + ?v=217×%d" % (fn, len(pairs), n))

print("FAIL=" + str(fail))
sys.exit(1 if fail else 0)
