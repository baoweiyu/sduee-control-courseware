from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
P=ROOT/"lessons"/"lesson06-correction"/"pages"
def apply(name,pairs):
    p=P/name;s=p.read_text(encoding="utf-8")
    for old,new in pairs:
        if old not in s:
            if new in s: continue
            raise RuntimeError(f"{name}: missing {old[:100]!r}")
        s=s.replace(old,new)
    p.write_text(s,encoding="utf-8");print("updated",name)

apply("p24-time-freq.html",[
    ("  .axis{stroke:#5d6c81;stroke-width:1.5}","  #metricBode>path{fill:none!important}\n  .axis{stroke:#5d6c81;stroke-width:1.5}"),
    ('<text class="svgmath" x="19" y="87">L(ω)/dB</text><text class="svgmath" x="10" y="326">φ(ω)/(°)</text>','<text class="svgmath" x="510" y="65" text-anchor="end">L(ω)/dB</text><text class="svgmath" x="510" y="315" text-anchor="end">φ(ω)/(°)</text>'),
])
apply("p38b-ex65-design.html",[
    ('[[.7,"0.7",24],[3.5,"ω_{c2}=3.5",50],[6,"6",76]]','[[.7,"0.7",24],[3.5,"ω_{c2}=3.5",52]]'),
    ('F.tx(g2,x+16,y-14,"20lgβ，β=51.3",{fs:22,fill:"#0E7A36",b:1,an:"start"});','F.tx(g2,x+18,(y+F.Y(PM,0))/2,"20lgβ，β=51.3",{fs:22,fill:"#0E7A36",b:1,an:"start"});'),
    ('[[1/73.3,"0.0136",22],[2,"2",48],[1/.009,"1/0.009",74]]','[[1/73.3,"0.0136",24]]'),
])
apply("p38c-ex65-verify.html",[
    ('F.tx(g,PM.x1-16,PM.y0+28,"K_{v}=180；3＜ω_{c2}＜5",{fs:22,fill:"#0E7A36",b:1,an:"end"});','F.tx(g,PM.x1-16,PM.y1-18,"K_{v}=180；3＜ω_{c2}＜5",{fs:22,fill:"#0E7A36",b:1,an:"end"});'),
])
apply("p32-lag-principle.html",[
    ('F.tx(g, x + (dx || 14), y + (dy || -16), label, { fs: 22, fill: "#D63A2F", b: 1, an: "start" });','F.tx(g, x + (dx || 14), y + (dy || -16), label, { fs: 22, fill: "#D63A2F", b: 1, an: dx < 0 ? "end" : "start" });'),
    ('wcMark(g, M.wc2.val, "设计值 ω_{c2}≈0.56", 14, -38);','wcMark(g, M.wc2.val, "设计值 ω_{c2}≈0.56", -14, -38);'),
])
apply("p27-ex61-k.html",[
    ("（20lg15=23.5 dB）","（<span class=\"tex\">20\\lg15=23.5\\,\\mathrm{dB}</span>）"),
])
apply("p34-ex63-k.html",[
    ("（20lg10=20 dB）","（<span class=\"tex\">20\\lg10=20\\,\\mathrm{dB}</span>）"),
])
