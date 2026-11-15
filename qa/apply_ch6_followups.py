from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
PAGES = ROOT / "lessons" / "lesson06-correction" / "pages"

def apply(name, pairs):
    p = PAGES / name
    s = p.read_text(encoding="utf-8")
    for old, new in pairs:
        if old not in s:
            if new in s:
                continue
            raise RuntimeError(f"{name}: missing {old[:120]!r}")
        s = s.replace(old, new)
    p.write_text(s, encoding="utf-8")
    print("updated", name)

apply("p24-time-freq.html", [
    ("grid-template-rows:32px minmax(0,1fr) 154px", "grid-template-rows:32px minmax(0,1fr) 182px"),
    ('<path id="magPath" class="mag"/>', '<path id="magPath" class="mag" fill="none" style="fill:none"/>'),
    ('<path id="phasePath" class="phasecurve"/>', '<path id="phasePath" class="phasecurve" fill="none" style="fill:none"/>'),
])

apply("p34-ex63-k.html", [
    ('      const xa = F.X(M.wc1_asym);\n      F.mk("circle", { cx: xa, cy: y, r: 8, fill: "#fff", stroke: "#F5821F", "stroke-width": 3 }, g);\n      F.tx(g, xa + 20, y - 24, "ω_{c1}≈2.2", { fs: 21, fill: "#F5821F", b: 1, an: "start" });\n      F.tx(g, xa + 20, y - 50, "（课本读图）", { fs: 19, fill: "#F5821F", an: "start" });\n', ''),
    ("/* ③ γ0 读数（两口径）+ 不稳定判定 */", "/* ③ 相角裕度读数与不稳定判定 */"),
])

apply("p22-role-3curves.html", [
    ("K 提到 12：低频段抬高，稳态精度达标", "K 提到 15：低频段抬高，稳态精度达标"),
    (r"\omega_{c1}=3.5", r"\omega_{c1}\approx3.9"),
    (r"\gamma_{0}=16^{\circ}", r"\gamma_{0}\approx14^{\circ}"),
    ("保持 K=12，串联超前校正装置", "保持 K=15，串联超前校正装置"),
    (r"\omega_{c2}=4.6", r"\omega_{c2}\approx5.2"),
    (r"\gamma=42.6^{\circ}", r"\gamma\approx41^{\circ}"),
    ("/* 曲线Ⅰ：K=3，即 G0 幅频精确下移 20lg(12/3)=12.04dB（相频与 K 无关，不变） */", "/* 曲线Ⅰ：K=3，即 G0 幅频精确下移 20lg(15/3)=13.98dB（相频与 K 无关，不变） */"),
    ("const dK = -20 * Math.log10(4);", "const dK = -20 * Math.log10(5);"),
    ('"Ⅱ K=12"', '"Ⅱ K=15"'),
    ('"Ⅲ K=12 + 超前校正"', '"Ⅲ K=15 + 超前校正"'),
    ('"γ_{0}=16.4° → γ=43.8°"', '"γ_{0}≈14° → γ≈41°"'),
    ('"Ⅱ K=12：稳态达标，γ0=16° 太小"', '"Ⅱ K=15：稳态达标，γ0≈14° 太小"'),
])

apply("p23-three-bands.html", [
    (r"G_{0}(s)=\dfrac{12}{s(s+1)}", r"G_{0}(s)=\dfrac{15}{s(s+1)}"),
    ("仅 16°", "约 14°"),
    ("const x = F.X(3.3927);", "const x = F.X(BD.data.ex61.meta.wc1.val);"),
    ('"ω_{c1}=3.39"', '"ω_{c1}≈3.9"'),
])

apply("p25-lead-principle.html", [
    (r"\omega_{c1}=3.5", r"\omega_{c1}\approx3.9"),
    ("φ₀=−163.6°", "φ₀≈−165.3°"),
    ("γ0=16°", "γ0≈14°"),
    (r"\varphi_{m}\approx31^{\circ}", r"\varphi_{m}=30^{\circ}"),
    ("本例 α=0.3158", "本例 α=0.334"),
    (r"\omega_{c2}=4.6", r"\omega_{c2}\approx5.2"),
    (r"\gamma=42.6^{\circ}", r"\gamma\approx41^{\circ}"),
    ("const X1 = F.X(3.3927), X2 = F.X(WC2);", "const X1 = F.X(D.meta.wc1.val), X2 = F.X(WC2);"),
    ("const y1 = F.Y(PP, -163.58), y2 = F.Y(PP, -180);", "const y1 = F.Y(PP, -180 + D.meta.gamma0.val), y2 = F.Y(PP, -180);"),
    ('"γ_{0}=16.4°"', '"γ_{0}≈14°"'),
    ('"φ_{m}=31.3°"', '"φ_{m}=30°"'),
    ("yB = F.Y(PP, -136.22)", "yB = F.Y(PP, -180 + D.meta.gamma.val)"),
    ('"γ=43.8°"', '"γ≈41°"'),
    ('"ω_{c2}=4.6"', '"ω_{c2}≈5.2"'),
    ('["① 未校 φ₀：γ0≈14° 不足", "② 网络 φc：ωm 处 φm≈31°", "③ 叠加：ωc2 处 γ=42.6°"]', '["① 未校 φ₀：γ0≈14° 不足", "② 网络 φc：ωm 处 φm=30°", "③ 叠加：ωc2 处 γ≈41°"]'),
])

apply("p32-lag-principle.html", [
    ("低频增益不变，<span class=\"tex\">e_{ss}</span> 不变，<span class=\"tex\">\\gamma</span> 增大。", "低频增益按稳态精度配置，中高频幅值衰减，<span class=\"tex\">\\gamma</span> 增大。"),
    (r"G_{c}(s)=\frac{Ts+1}{\beta Ts+1}\quad(\beta>1)", r"G_{c}(s)=K_{c}\frac{Ts+1}{\beta Ts+1}\quad(\beta>1)"),
    (r"\omega_{c1}=2.2", r"\omega_{c1}\approx2.7"),
    (r"\gamma_{0}=-23^{\circ}", r"\gamma_{0}\approx-33^{\circ}"),
    ("接入滞后 <span class=\"tex\">G_{c}</span>：低频段 ≈0dB（增益不动），高频段压下 <span class=\"tex\">-20\\lg\\beta</span>", "接入滞后 <span class=\"tex\">G_{c}</span>：低频增益按 <span class=\"tex\">K_{v}</span> 配置，中高频段压下"),
    ("本例 <b>−20lgβ=−18dB</b>（β=8）", "本例 <b>β=20</b>，高频段约衰减 26dB"),
    (r"\gamma=+40.2^{\circ}", r"\gamma\approx+37^{\circ}"),
    ("低频增益不动（<span class=\"tex\">e_{ss}</span> 不变）", "低频增益满足稳态精度要求"),
    ('wcMark(g, M.wc1.val, "ω_{c1}=1.80", 14, -16);', 'wcMark(g, M.wc1.val, "ω_{c1}≈2.7", 14, -16);'),
    ('marginMark(g, M.wc1.val, -193, "γ_{0}=−13.0°", 12, 6);', 'marginMark(g, M.wc1.val, -180 + M.gamma0.val, "γ_{0}≈−33°", 12, 6);'),
    ('vlineMag(g, 0.00699, "1/(βT)=0.0070", 20, "#0E7A36");', 'vlineMag(g, 0.005, "1/(βT)=0.005", 20, "#0E7A36");'),
    ('vlineMag(g, 0.056, "1/T=0.056", 44, "#0E7A36");', 'vlineMag(g, 0.1, "1/T=0.1", 44, "#0E7A36");'),
    ("const y = F.Y(PM, -18.07);", "const y = F.Y(PM, -26.02);"),
    ("F.X(0.056)", "F.X(0.1)"),
    ('"−20lgβ=−18dB"', '"高频段约 −26dB"'),
    ('"低频段 ≈0dB（增益不变）"', '"低频段约 +6dB"'),
    ('wcMark(g, M.wc2.val, "ω_{c2}=0.53", 14, -38);', 'wcMark(g, M.wc2.val, "设计值 ω_{c2}≈0.56", 14, -38);'),
    ('marginMark(g, M.wc2.val, -138.34, "γ=41.7°", 12, 6);', 'marginMark(g, 0.56, -143, "γ≈37°", 12, 6);'),
    ('["① 未校：ωc1=2.2 处 γ0=−23°", "② Gc：高频衰减 −18dB", "③ 校后：穿越点左移，γ=40.2°"]', '["① 未校：ωc1≈2.7 处 γ0≈−33°", "② Gc：高频衰减约 26dB", "③ 校后：穿越点左移，γ≈37°"]'),
])

apply("p36-ex63-verify.html", [
    ('\n          <div class="eq"><span class="tex">G(s)=G_{c}(s)G_{0}(s)</span></div>', ''),
])

apply("p37-lag-pros.html", [
    ("例6-3：γ 由 −23° 提升到 +40.2°，同时 Kg≥10dB 达标。", "例6-3：γ 由 −33° 提升到约 +37°，同时 Kg≥10dB 达标。"),
])

apply("p47-summary.html", [
    (r"\gamma:\,16^{\circ}\to42.6^{\circ}", r"\gamma:\,14^{\circ}\to41^{\circ}"),
    (r"\gamma:\,-23^{\circ}\to40.2^{\circ}", r"\gamma:\,-33^{\circ}\to37^{\circ}"),
])
