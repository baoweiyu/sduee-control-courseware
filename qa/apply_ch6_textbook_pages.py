from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES = ROOT / "lessons" / "lesson06-correction" / "pages"


def apply(name, pairs):
    path = PAGES / name
    text = path.read_text(encoding="utf-8")
    for old, new in pairs:
        if old not in text:
            if new in text:
                continue
            raise RuntimeError(f"{name}: 未找到待替换文本：{old[:100]!r}")
        text = text.replace(old, new)
    path.write_text(text, encoding="utf-8")
    print("updated", name)


apply("p27-ex61-k.html", [
    (r"G_{0}(s)=\dfrac{k}{s(s+1)}", r"G_{0}(s)=\dfrac{K}{s(s+1)}"),
    (r'''要求：<span class="tex">r(t)=t</span> 时 <span class="tex">e_{ss}\leq0.083</span>；<span class="tex">\gamma\geq40^{\circ}</span>。设计串联校正装置 <span class="tex">G_{c}(s)</span>。''', r'''要求：相角裕度 <span class="tex">\gamma\geq35^{\circ}</span>，开环增益 <span class="tex">K=15</span>。设计串联超前校正装置 <span class="tex">G_{c}(s)</span>。'''),
    ("第①步：定 K，画未校 Bode（与右图分步联动）", "第①步：由 K=15 画未校 Bode（与右图分步联动）"),
    (r'''<div><span class="tex">e_{ss}=\dfrac{1}{k_{v}}\leq0.083</span>，本系统 <span class="tex">k_{v}=k</span></div>''', r'''<div>本系统为 I 型，<span class="tex">K_{v}=K</span></div>'''),
    ("k≥12，取 <b>k=12</b>（20lg12=21.6 dB）", "取 <b>K=15</b>（20lg15=23.5 dB）"),
    (r"\omega_{c1}=3.5", r"\omega_{c1}\approx3.9"),
    (r"\gamma_{0}=16^{\circ}&lt;40^{\circ}", r"\gamma_{0}\approx14^{\circ}&lt;35^{\circ}"),
    ("未校系统 G₀=12/[s(s+1)] 的 Bode 图", "未校系统 G₀=15/[s(s+1)] 的 Bode 图"),
    (r'''<span>K 够了、<span class="kw-r">γ 不够</span>：<span class="tex">\omega_{c1}\approx3.9</span> 处 <span class="tex">\gamma_{0}</span> 只有 16°——稳态与裕度难以兼得，正是超前校正的用武之地。</span>''', r'''<span>开环增益已给定，但<span class="kw-r">相角裕度不足</span>：<span class="tex">\omega_{c1}\approx3.9</span> 处 <span class="tex">\gamma_{0}\approx14^{\circ}</span>，需要用超前校正提升中频段相角。</span>'''),
    ("21.584", "23.5218"),
    ("γ_{0}=16°＜40°，不满足", "γ_{0}≈14°＜35°，不满足"),
    ('["① ess 定 K=12", "② 未校 Bode：ωc1=3.5", "③ γ0=16°＜40° 不满足"]', '["① 取 K=15", "② 未校 Bode：ωc1≈3.9", "③ γ0≈14°＜35° 不满足"]'),
])

apply("p28-ex61-alpha.html", [
    (r'''<div class="cmt"><span class="tex">\varphi_{m}=\gamma^{*}-\gamma_{0}+\varepsilon=40^{\circ}-16^{\circ}+\varepsilon</span>；按教材口径取 <span class="tex">\omega_{c2}=4.6</span> 试算（相当于 ε≈4.6°）：</div>''', r'''<div class="cmt">取修正值 <span class="tex">\varepsilon=9^{\circ}</span>，所需最大超前角为 <span class="tex">\varphi_{m}=35^{\circ}-14^{\circ}+9^{\circ}=30^{\circ}</span>：</div>'''),
    (r"\alpha=\frac{1-\sin\varphi_{m}}{1+\sin\varphi_{m}}=0.3158", r"\alpha=\frac{1-\sin30^{\circ}}{1+\sin30^{\circ}}=0.334"),
    (r'''网络在 <span class="tex">\omega_{m}</span> 处抬高 <span class="tex">-10\lg\alpha=5.0\ \mathrm{dB}</span>，故令 <span class="tex">\omega_{c2}</span> 为未校 <span class="tex">L_{0}(\omega)=-5.0\ \mathrm{dB}</span> 处的频率（右图）：''', r'''网络在 <span class="tex">\omega_{m}</span> 处抬高 <span class="tex">10\lg(1/\alpha)=4.77\ \mathrm{dB}</span>，故在未校幅频上找 <span class="tex">L_{0}(\omega)=-4.77\ \mathrm{dB}</span> 处：'''),
    (r"\omega_{c2}=\omega_{m}=4.6", r"\omega_{c2}=\omega_{m}\approx5.2"),
    (r"T=\frac{1}{\omega_{m}\sqrt{\alpha}}=0.38", r"T=\frac{1}{\omega_{m}\sqrt{\alpha}}\approx0.33"),
    (r"G_{c}(s)=\frac{0.38s+1}{0.12s+1},\quad \frac{1}{T}=2.6,\ \frac{1}{\alpha T}=8", r"G_{c}(s)=\frac{0.33s+1}{0.11s+1},\quad \frac{1}{T}\approx3,\ \frac{1}{\alpha T}\approx9"),
    ("在未校 L₀(ω) 上：L₀=10lgα=−5.0 dB 处定 ωc2", "在未校 L₀(ω) 上：L₀=−4.77 dB 处定 ωc2"),
    (r'''<div class="act-note"><span class="lead">口径</span><span>页面文字按教材口径：α=0.3158、T=0.38、<span class="tex">\omega_{c2}=4.6</span>、γ=42.6°；图内曲线与标注为精确计算值（<span class="tex">\omega_{c2}=4.53</span>、γ=43.8°），二者并存；<span class="tex">\omega_{c1}</span> 同理（教材读图 3.5，精确 3.39）。</span></div>''', r'''<div class="act-note"><span class="lead">图解法</span><span>按课本 Bode 渐近线读图取 <span class="tex">\omega_{c2}\approx5.2</span>，由 <span class="tex">\alpha=0.334</span> 得两个转折频率约为 3 与 9 rad/s。</span></div>'''),
    ("L_{0}=10lgα=−5.0 dB", "L_{0}=−4.77 dB"),
    ('"ω_{c2}=4.53"', '"ω_{c2}≈5.2"'),
    ('[[2.632, "1/T=2.63", 22], [8.333, "1/(αT)=8.33", 48]]', '[[3, "1/T≈3", 22], [9, "1/(αT)≈9", 48]]'),
])

apply("p29-ex61-verify.html", [
    (r"G_{c}(s)=\dfrac{0.38s+1}{0.12s+1}", r"G_{c}(s)=\dfrac{0.33s+1}{0.11s+1}"),
    ("G<sub>c</sub>：1/T=2.6 起抬，1/(αT)=8 转平，<b>+5.0 dB 平台</b>", "G<sub>c</sub>：1/T≈3 起抬，1/(αT)≈9 转平，<b>+4.77 dB 平台</b>"),
    (r"\omega_{c2}=4.6", r"\omega_{c2}\approx5.2"),
    (r"\gamma=42.6^{\circ}\geq40^{\circ}", r"\gamma\approx41^{\circ}&gt;35^{\circ}"),
    (r'''<span>超前网络把<span class="kw-r">中频段顶起</span>：<span class="tex">\omega_{c}</span> 右移（3.5→4.6）、γ 增大（16°→42.6°），低频段不动、<span class="tex">e_{ss}</span> 保持。</span>''', r'''<span>超前网络把<span class="kw-r">中频段顶起</span>：<span class="tex">\omega_{c}</span> 右移（3.9→5.2）、γ 增大（14°→41°），低频段不变。</span>'''),
    ('vlineG(2.632, "1/T=2.63", 26, g); vlineG(8.333, "1/(αT)=8.33", 58, g);', 'vlineG(3, "1/T≈3", 26, g); vlineG(9, "1/(αT)≈9", 58, g);'),
    ("F.X(4.5261)", "F.X(BD.data.ex61.meta.wc2.val)"),
    ('"ω_{c2}=4.6"', '"ω_{c2}≈5.2"'),
    ("F.Y(PP, -136.22)", "F.Y(PP, -180 + BD.data.ex61.meta.gamma.val)"),
    ('"γ=42.6° ≥ 40°，满足"', '"γ≈41° ＞ 35°，满足"'),
    ('"④ γ=42.6°≥40° 满足"', '"④ γ≈41°＞35° 满足"'),
])

apply("p30-ex61-compare.html", [
    (r"\omega_{c1}=3.5", r"\omega_{c1}\approx3.9"),
    (r"\gamma_{0}=16^{\circ}", r"\gamma_{0}\approx14^{\circ}"),
    ("σ%=63.2%", "σ%=66.4%"),
    (r"t_{s}=5.70\ \mathrm{s}", r"t_{s}=5.86\ \mathrm{s}"),
    (r"\omega_{c2}=4.6", r"\omega_{c2}\approx5.2"),
    (r"\gamma=42.6^{\circ}", r"\gamma\approx41^{\circ}"),
    ("σ%=29.2%", "σ%=32.5%"),
    (r"t_{s}=1.08\ \mathrm{s}", r"t_{s}=0.98\ \mathrm{s}"),
    ("超调大、调节慢，振荡剧烈", "超调较大、调节较慢"),
    ('markWc(3.3927, "ω_{c1}=3.39", true, "end", g);', 'markWc(BD.data.ex61.meta.wc1.val, "ω_{c1}≈3.9", true, "end", g);'),
    ('markMargin(3.3927, -163.58, "γ_{0}=16.4°", "end", g);', 'markMargin(BD.data.ex61.meta.wc1.val, -180 + BD.data.ex61.meta.gamma0.val, "γ_{0}≈14°", "end", g);'),
    ('markWc(4.5261, "ω_{c2}=4.53", false, "start", g);', 'markWc(BD.data.ex61.meta.wc2.val, "ω_{c2}≈5.2", false, "start", g);'),
    ('markMargin(4.5261, -136.22, "γ=43.8°", "start", g);', 'markMargin(BD.data.ex61.meta.wc2.val, -180 + BD.data.ex61.meta.gamma.val, "γ≈41°", "start", g);'),
    ('["① 校前：σ%=66.4%，ts=5.70 s", "② 校后：σ%=32.5%，ts=1.08 s", "③ 时域表现：ωc↑→ts↓，γ↑→σ%↓"]', '["① 校前：σ%=66.4%，ts=5.86 s", "② 校后：σ%=32.5%，ts=0.98 s", "③ 时域表现：ωc↑→ts↓，γ↑→σ%↓"]'),
])

apply("p34-ex63-k.html", [
    (r"G_{0}(s)=\dfrac{k}{s(s+1)(0.5s+1)}", r"G_{0}(s)=\dfrac{K}{s(s+1)(0.5s+1)}"),
    (r'''要求：<span class="tex">r(t)=t</span> 时 <span class="tex">e_{ss}\leq0.2</span>；<span class="tex">\gamma\geq40^{\circ}</span>；<span class="tex">K_{g}\geq10\,\mathrm{dB}</span>。设计串联校正装置 <span class="tex">G_{c}(s)</span>。''', r'''要求：<span class="tex">K_{v}=10</span>，<span class="tex">\gamma\geq35^{\circ}</span>，<span class="tex">K_{g}\geq10\,\mathrm{dB}</span>。设计串联滞后校正装置 <span class="tex">G_{c}(s)</span>。'''),
    (r'''<div><span class="tex">e_{ss}=\dfrac{1}{k_{v}}\leq0.2</span>，本系统 <span class="tex">k_{v}=k</span></div>''', r'''<div><span class="tex">K_{v}=\lim_{s\to0}sG_{0}(s)=K=10</span></div>'''),
    ("k≥5，取 <b>k=5</b>（20lg5=14 dB）", "取 <b>K=10</b>（20lg10=20 dB）"),
    (r"\omega_{c1}=2.2", r"\omega_{c1}\approx2.7"),
    ("（渐近线读数）", "（课本读图）"),
    (r"\gamma_{0}=180^{\circ}+\varphi(\omega_{c1})=-23^{\circ}", r"\gamma_{0}=180^{\circ}+\varphi(\omega_{c1})\approx-33^{\circ}"),
    ('      <div class="dualnote">口径备注：ωc1=2.2、γ0=−23° 为渐近线读数；精确曲线穿越 ωc1=1.80，该处 γ0=−13.0°（图内标注为精确值）。</div>\n', ''),
    ("未校系统 G₀=5/[s(s+1)(0.5s+1)] 的 Bode 图", "未校系统 G₀=10/[s(s+1)(0.5s+1)] 的 Bode 图"),
    ('    if (K >= 2) {  /* ② ωc1：精确穿越 + 渐近线读数（双口径上下错开，互不重叠） */', '    if (K >= 2) {  /* ② 未校幅频穿越，读数按课本图解法取近似值 */'),
    ('"ω_{c1}=1.80（精确）"', '"ω_{c1}≈2.7"'),
    ('      const xa = F.X(M.wc1_asym);\n      F.mk("circle", { cx: xa, cy: y, r: 8, fill: "#fff", stroke: "#F5821F", "stroke-width": 3 }, g);\n      F.tx(g, xa + 20, y - 24, "ω_{c1}≈2.2", { fs: 21, fill: "#F5821F", b: 1, an: "start" });\n      F.tx(g, xa + 20, y - 50, "（渐近线读数）", { fs: 19, fill: "#F5821F", an: "start" });\n', ''),
    ("F.Y(PP, -193)", "F.Y(PP, -180 + M.gamma0.val)"),
    ('"γ_{0}=−13.0°"', '"γ_{0}≈−33°"'),
    ('      const xa = F.X(M.wc1_asym), ya = F.Y(PP, -180 + M["gamma0_at_2.2"]);\n      F.mk("line", { x1: xa, y1: y2, x2: xa, y2: ya, stroke: "#F5821F", "stroke-width": 3,\n        "stroke-dasharray": "5 4" }, g);\n      F.tx(g, xa + 16, ya + 22, "γ_{0}(2.2)=−23°", { fs: 21, fill: "#F5821F", b: 1, an: "start" });\n', ''),
    ('["① ess 定 K=5", "② 未校 Bode：ωc1=2.2", "③ γ0=−23°＜0 不稳定"]', '["① Kv=10，取 K=10", "② 未校 Bode：ωc1≈2.7", "③ γ0≈−33°＜0 不稳定"]'),
])

apply("p35-ex63-beta.html", [
    ("取 <span class=\"tex\">\\varepsilon=5^{\\circ}</span> 预补滞后附加相角，在未校相频上找 <span class=\"tex\">\\gamma_{0}=45^{\\circ}</span> 的点。", "取 <span class=\"tex\">\\varepsilon=10^{\\circ}</span> 预补滞后附加相角，在未校相频上找 <span class=\"tex\">\\gamma_{0}=45^{\\circ}</span> 的点。"),
    (r"L_{0}(0.56)\approx18\,\mathrm{dB}=20\lg\beta\;\Rightarrow\;\beta=8", r"L_{0}(0.56)\approx26\,\mathrm{dB}\approx20\lg\beta\;\Rightarrow\;\beta=20"),
    (r'''把滞后相角甩到低频：取 <span class="tex">\dfrac{1}{T}=0.1\omega_{c2}=0.056</span>。''', r'''取高端转折频率 <span class="tex">\dfrac{1}{T}=\dfrac{\omega_{c2}}{5}\approx0.1</span>，则 <span class="tex">T=10</span>。'''),
    (r"G_{c}(s)=\dfrac{Ts+1}{\beta Ts+1}=\dfrac{17.86s+1}{143s+1}", r"G_{c}(s)=\dfrac{1}{10}\dfrac{s+0.1}{s+0.005}=2\dfrac{10s+1}{200s+1}"),
    ('      <div class="dualnote">口径备注：图上蓝点读数（φ0(0.56)=−134.9°、L0(0.56)=17.5dB）为精确曲线值；教学取整 −135°、18dB。</div>\n', ''),
    ("相频上找 <span class=\"tex\">45^{\\circ}</span> 定 <span class=\"tex\">\\omega_{c2}</span> → 幅频上量 <span class=\"tex\">18\\,\\mathrm{dB}</span> 定 β → <span class=\"tex\">0.1\\omega_{c2}</span> 定 T", "相频上找 <span class=\"tex\">45^{\\circ}</span> 定 <span class=\"tex\">\\omega_{c2}</span> → 幅频上量约 <span class=\"tex\">26\\,\\mathrm{dB}</span> 定 β → 取 <span class=\"tex\">1/T=0.1</span>"),
    ("const WC2 = 0.56, PHI = -134.89, L0 = 17.5;", "const WC2 = 0.56, PHI = -135, L0 = 26;"),
    ("/* 第②步组：幅频 L0(0.56)≈18dB 括线 → β=8；Gc 恰给 −18dB */", "/* 第②步组：幅频 L0(0.56)≈26dB 括线 → β=20；Gc 高频约衰减 26dB */"),
    ("const yL = F.Y(PM, L0), y0 = F.Y(PM, 0), yC = F.Y(PM, -18.03);", "const yL = F.Y(PM, L0), y0 = F.Y(PM, 0), yC = F.Y(PM, -26.02);"),
    ('"L_{0}(0.56)≈18dB"', '"L_{0}(0.56)≈26dB"'),
    ('"=20lgβ → β=8"', '"=20lgβ → β=20"'),
    ('"G_{c}：−20lgβ=−18dB"', '"G_{c}：高频约 −26dB"'),
])

apply("p36-ex63-verify.html", [
    (r'''<div class="eq"><span class="tex">G_{c}(s)=\dfrac{17.86s+1}{143s+1}</span></div>''', r'''<div class="eq"><span class="tex">G_{c}(s)=2\dfrac{10s+1}{200s+1}</span></div><div class="eq"><span class="tex">G(s)=\dfrac{20(10s+1)}{s(s+1)(0.5s+1)(200s+1)}</span></div>'''),
    ("低频段 Gc≈0dB 不动增益，高频段压 −18dB", "低频段约 +6dB，高频段约 −26dB"),
    ("0dB 穿越点左移至 <b><span class=\"tex\">\\omega_{c2}=0.56</span></b>", "课本图解法取 <b><span class=\"tex\">\\omega_{c2}\\approx0.56</span></b>"),
    (r'''检验：<span class="tex">\gamma=40.2^{\circ}\geq40^{\circ}</span>；<span class="tex">\omega_{pc}=1.36</span> 处 <span class="tex">K_{g}\geq10\,\mathrm{dB}</span>''', r'''检验：<span class="tex">\gamma\approx37^{\circ}&gt;35^{\circ}</span>；由课本图 6-23 检验 <span class="tex">K_{g}\geq10\,\mathrm{dB}</span>'''),
    ('      <div class="dualnote">口径备注：教学口径 ωc2=0.56、γ=40.2°、Kg≥10dB；图内标注为精确曲线读数（0.53、41.7°、13.0dB）。</div>\n', ''),
    ("Bode 叠加：G₀×Gc → GcG₀（红）与裕度检验", "Bode 叠加与课本图解法设计点检验"),
    (r'''<span>滞后校正后：<span class="tex">\omega_{c}</span> 2.2→0.56 左移，<span class="tex">\gamma</span> −23°→<span class="kw-r">+40.2°</span>，<span class="tex">K_{g}\geq10\,\mathrm{dB}</span>——失稳系统变为裕度达标的稳定系统。</span>''', r'''<span>滞后校正后：<span class="tex">\omega_{c}</span> 2.7→0.56 左移，<span class="tex">\gamma</span> −33°→<span class="kw-r">+37°</span>；课本图解法检验相角裕度与幅值裕度均满足要求。</span>'''),
    ("const x2 = F.X(M.wc2.val), y0 = F.Y(PM, 0);", "const x2 = F.X(0.56), y0 = F.Y(PM, 0);"),
    ('      F.mk("circle", { cx: x2, cy: y0, r: 9, fill: "#D63A2F", stroke: "#fff", "stroke-width": 2.5 }, g);\n', ''),
    ('"ω_{c2}=0.53"', '"设计频率 ω_{c2}=0.56"'),
    ("const yP = F.Y(PP, -138.34), y180 = F.Y(PP, -180);", "const yP = F.Y(PP, -143), y180 = F.Y(PP, -180);"),
    ('"γ=41.7°≥40°"', '"γ≈37°＞35°"'),
    ('      /* Kg：相角穿越频率 ωpc 处的幅值储备 */\n      const xp = F.X(M.w_phase_cross), yK = F.Y(PM, -M.Kg_db.val);\n      F.mk("line", { x1: xp, y1: PM.y0, x2: xp, y2: PM.y1, stroke: "#0E7A36", "stroke-width": 2.2,\n        "stroke-dasharray": "7 5", opacity: .55, "clip-path": `url(#${PM.clip})` }, g);\n      F.mk("line", { x1: xp, y1: yK, x2: xp, y2: y0, stroke: "#0E7A36", "stroke-width": 3.4 }, g);\n      F.mk("circle", { cx: xp, cy: yK, r: 9, fill: "#0E7A36", stroke: "#fff", "stroke-width": 2.5 }, g);\n      F.tx(g, xp + 16, yK - 20, "K_{g}=13.0dB≥10dB", { fs: 22, fill: "#0E7A36", b: 1, an: "start" });\n      const yX = F.Y(PP, -180);\n      F.mk("circle", { cx: xp, cy: yX, r: 8, fill: "#0E7A36", stroke: "#fff", "stroke-width": 2.5 }, g);\n      F.tx(g, xp + 16, yX - 16, "ω_{pc}=1.36", { fs: 21, fill: "#0E7A36", b: 1, an: "start" });\n', '      F.tx(g, PM.x1 - 18, PM.y0 + 28, "课本图 6-23：K_{g}≥10 dB", { fs: 22, fill: "#0E7A36", b: 1, an: "end" });\n'),
])

apply("p32-lag-principle.html", [
    ('      <div class="dualnote">口径备注：2.2、−23°、0.56、40.2° 为渐近线读数（例6-3 教学口径）；图上曲线与标注为精确计算值（1.80、−13.0°、0.53、41.7°）。</div>\n', ''),
])

apply("p38-laglead-design.html", [
    ("；教材例 6-2 即为滞后—超前校正的设计实例，课后自学。", "。"),
])

apply("p44-ex68.html", [
    (r"\dfrac{A}{k_{v}}", r"\dfrac{A}{K_{v}}"),
])
