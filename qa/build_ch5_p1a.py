# -*- coding: utf-8 -*-
"""第五章 P1-P15 页面定义（整改版：版式加密、正文≥22px、P6/P7/P15 动画化）。
依据 specs/第五章整改要求.md 第一批（P1-P18）。"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_lib import head, foot, note, cover, partcover, QUIZ_CSS

PAGES = []

# 紧凑高密度通用样式（正文 22.5px 起步）
DENSE_CSS = """
  .row { display:flex; gap:24px; height:100%; min-height:0; }
  .c { flex:1; display:flex; flex-direction:column; min-height:0; }
  .c > .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:12px; }
  .seg { background:var(--sky); border-radius:12px; padding:12px 18px; font-size:22.5px; line-height:1.6; }
  .hl { background:#FDF3EC; border-radius:12px; padding:12px 18px; font-size:23px; line-height:1.6; }
"""

# 动画页样式（左图右栏 + 控制行 + K 读数卡）
ANIM_CSS = DENSE_CSS + """
  .figc { flex:1.34; display:flex; flex-direction:column; overflow:hidden; }
  .figc .bd2 { flex:1; display:grid; place-items:center; background:#fff; padding:6px 10px; min-height:0; }
  .figc svg { width:100%; height:100%; }
  .ctl { display:flex; align-items:center; gap:12px; justify-content:center; padding:6px 0 8px; }
  .btn { background:var(--blue); color:#fff; border:none; border-radius:10px; font-size:19px; font-weight:700; padding:8px 22px; cursor:pointer; }
  .btn.ghost { background:#fff; color:var(--blue); border:2px solid var(--blue); }
  .prog { font-size:18px; color:var(--muted); min-width:64px; }
  .side { flex:1; display:flex; flex-direction:column; gap:14px; min-height:0; }
  .side .act-card { display:flex; flex-direction:column; min-height:0; overflow:hidden; }
  .side .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:10px; }
  .kv { background:var(--sky); border-radius:12px; padding:12px 17px; font-size:21.5px; line-height:1.55; }
  .kv b.r { color:var(--danger); }
"""

COVER_CSS_X = """
  .cover { position:absolute; inset:0; display:flex; align-items:center; gap:48px; padding:56px 64px 76px; }
  .left { flex:1.06; display:flex; flex-direction:column; align-items:flex-start; gap:24px; }
  .left .cap { width:110px; height:110px; }
  .left h1 { font-size:78px; color:var(--navy); letter-spacing:4px; }
  .left .deco { width:150px; height:10px; border-radius:5px; background:var(--orange); position:relative; }
  .left .deco::after { content:""; position:absolute; right:-28px; top:0; width:12px; height:10px; border-radius:5px; background:var(--orange); }
  .left .sub { font-size:54px; color:var(--blue); font-weight:700; letter-spacing:3px; }
  .left .meta { font-size:26px; color:var(--muted); }
  .toc { display:grid; grid-template-columns:1fr; gap:13px; margin-top:8px; width:100%; }
  .toc .it { background:var(--sky); border:2px solid var(--line); border-radius:12px; padding:13px 20px; font-size:24px; color:var(--navy); font-weight:700; white-space:nowrap; }
  .toc .it b { color:var(--orange); margin-right:10px; }
  .hint { display:flex; align-items:center; gap:14px; background:#FDF3EC; border:2px solid var(--orange); border-radius:12px; padding:12px 20px; font-size:23px; color:#7A4E2D; font-weight:700; }
  .right { flex:0.94; height:100%; display:flex; align-items:stretch; }
  .imgc { width:100%; border:2px solid var(--line); border-radius:20px; overflow:hidden; background:#fff; box-shadow:0 10px 34px rgba(18,38,110,.14); display:flex; }
  .imgc img { width:100%; height:100%; object-fit:cover; display:block; }
"""

# ---------------- P1 章封面 ----------------
P1_BODY = cover("第五章 封面", "第五章　根轨迹法", "闭环极点如何随参数「生长」——一根轨迹看尽系统全程表现",
      [("§5.1", "根轨迹的概念与绘制法则"), ("§5.2", "根轨迹绘制综合例题"),
       ("§5.3", "广义根轨迹"), ("§5.4", "控制系统的根轨迹分析法")],
      "antenna-servo.png", "天线伺服跟踪系统", 1)
P1_BODY = P1_BODY.replace('</div>\n    <div class="right">',
    '''</div>
      <div class="hint">参数 K₁ 变化 <span style="font-size:26px;">→</span> 闭环极点在 s 平面上连续运动 <span style="font-size:26px;">→</span> 性能随之改变</div>
    </div>
    <div class="right">''', 1)
PAGES.append(dict(file="p01-cover.html", title="第五章封面", cx="L0", html=
head("第五章 封面", nochrome=True, pageattr=' data-page="__PAGENO__"', extra_css="") +
P1_BODY + foot()))

# ---------------- P2 第一部分封面 ----------------
P2_BODY = partcover("第一部分", "根轨迹的概念与绘制法则", "根轨迹方程 · 七条绘制法则", "从引例出发：让闭环极点在 s 平面上「跑」起来",
      [("1.1", "引言与引例 · 根轨迹的诞生"), ("1.2", "根轨迹方程与幅值/相角条件"),
       ("1.3", "例5-1 试验点的检验"), ("1.4", "七条绘制法则（含证明与图示）"),
       ("1.5", "例5-3 圆轨迹 · 例5-4 完整绘制")],
      "drone-wind.png", "无人机飞行姿态控制")
PAGES.append(dict(file="p02-part1-cover.html", title="第一部分封面", cx="L0", html=
head("第一部分封面 · 根轨迹的概念与绘制法则", nochrome=True, pageattr=' data-page="__PAGENO__"', extra_css="") +
P2_BODY + foot()))

# ---------------- P3 引言 ----------------
PAGES.append(dict(file="p03-intro.html", title="引言：为什么需要根轨迹", html=
head("引言：为什么需要根轨迹", pageattr=' data-page="__PAGENO__"', extra_css="""
  .row { display:flex; gap:24px; height:100%; min-height:0; }
  .tx { flex:1; display:flex; flex-direction:column; gap:16px; min-height:0; }
  .tx .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:10px; }
  .mtd { background:var(--sky); border-radius:12px; padding:12px 18px; font-size:23px; line-height:1.55; }
  .mtd b.h { color:var(--navy); font-size:24px; margin-right:10px; }
  .feat { background:#fff; border:2px solid var(--line); border-radius:12px; padding:11px 16px; font-size:22.5px; line-height:1.55; }
  .feat b.n { color:var(--orange); margin-right:8px; }
  .figc { flex:1.02; display:flex; flex-direction:column; overflow:hidden; }
  .figc .imgw { flex:1; display:grid; place-items:center; background:#fff; border:2px solid var(--line); border-radius:14px; padding:8px; min-height:0; }
  .figc img { width:100%; height:100%; object-fit:cover; }
  .figc .cap { flex:none; font-size:21px; color:var(--navy); background:var(--sky); border-radius:10px; padding:9px 14px; margin-top:10px; }
  .road { flex:none; display:flex; gap:12px; align-items:center; background:var(--sky); border-radius:12px; padding:11px 16px; font-size:22.5px; font-weight:700; color:var(--navy); }
  .road .a { color:var(--orange); font-size:26px; font-weight:800; }
""") + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card tx">
      <div class="hd">三大分析/校正方法中的根轨迹法</div>
      <div style="font-size:22.5px; color:var(--navy); background:#FDF3EC; border:2px solid var(--orange); border-radius:12px; padding:10px 16px; font-weight:700;">本页路线：方法定位 → 三特点 → 工程问题（K 取多大）</div>
      <div class="bd">
        <div class="mtd"><b class="h">时域分析法（第三章）</b>直接、准确；高阶求解难，看不清参数影响。</div>
        <div class="mtd"><b class="h">频率响应法（第四章）</b>用开环频率特性，间接评判闭环性能。</div>
        <div class="mtd" style="background:#FDF3EC;"><b class="h" style="color:var(--danger);">根轨迹法（本章）</b>开环零极点已知时，<span class="kw-r">图解</span>闭环极点随参数变化的全部可能位置。</div>
        <div class="feat"><b class="n">特点①</b><span class="kw-r">图解方法</span>，直观、形象；</div>
        <div class="feat"><b class="n">特点②</b>适合研究<span class="kw-r">某一参数变化</span>时，系统性能的变化趋势；</div>
        <div class="feat"><b class="n">特点③</b>属于<span class="kw-r">近似方法</span>，不十分精确（Evans，1948）。</div>
        <div class="feat"><b class="n">定位</b>时域看"解"、频域看"稳"，根轨迹看<span class="kw-r">"参数怎么改系统"</span>——为第六章校正打基础；</div>
        <div class="feat"><b class="n">工具</b>闭环特征方程 <span class="tex">1+G(s)H(s)=0</span> 的图解化：不用解方程，直接看根怎么走。</div>
        <div class="feat"><b class="n">本页路线</b>方法定位 → 三特点 → 工程问题（K 取多大）→ 下一页引例。</div>
        <div class="feat"><b class="n">能分析</b>K₁ 变化时闭环极点怎么走、系统稳不稳、性能怎么变；</div>
        <div class="feat"><b class="n">能设计</b>反向应用：想要什么样的性能，就把极点<span class="kw-r">引导</span>到哪儿（第六章校正的伏笔）。</div>
      </div>
    </div>
    <div class="act-card figc">
      <div class="hd">工程问题：天线伺服系统的增益 K 该取多大？</div>
      <div class="imgw"><img src="../../../assets/image2/dc-motor.png" alt="直流电机调速系统"></div>
      <div class="cap"><b>根轨迹的回答：</b>把每个 K 下的闭环极点画成一条轨迹，性能随 K 的变化<span class="kw-r">一图看全</span>。</div>
    </div>
  </div>
</div>
""" + note("特点", "根轨迹法三特点：①<span class=\"kw-r\">图解方法，直观、形象</span>；②适合研究<span class=\"kw-r\">某一参数变化</span>时系统性能的变化趋势；③属于<span class=\"kw-r\">近似方法</span>，不十分精确。") + foot()))

# ---------------- P4 引例① ----------------
PAGES.append(dict(file="p04-intro-sys.html", title="引例①：系统与特征方程", html=
head("引例①：系统与特征方程", pageattr=' data-page="__PAGENO__"', extra_css="""
  .row { display:flex; gap:24px; height:100%; min-height:0; }
  .lft { flex:1.12; display:flex; flex-direction:column; gap:14px; min-height:0; }
  .lft .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:10px; }
  .rgt { flex:1; display:flex; flex-direction:column; min-height:0; }
  .rgt .bd { flex:1; display:grid; place-items:center; background:#fff; border:1.5px solid var(--line); border-radius:12px; padding:6px 8px; min-height:0; }
  .rgt svg { width:100%; height:100%; }
  .seg { background:var(--sky); border-radius:12px; padding:11px 16px; font-size:22px; line-height:1.55; }
""") + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card lft">
      <div class="hd">单位反馈系统：开环与闭环</div>
      <div class="bd">
        <div style="font-size:23px;">设单位负反馈系统的开环传递函数为</div>
        <div class="mathbox math eqline tex tex-d">G(s)=\dfrac{K_1}{s(s+2)}</div>
        <div class="seg">两个开环极点：<span class="tex">p_1=0,\ p_2=-2</span>，无开环零点（即 <span class="tex">s(0.5s+1)</span> 的归一形式，<span class="tex">K_v=\dfrac{K_1}{2}</span>）。</div>
        <div class="mathbox math eqline tex tex-d">\varPhi(s)=\dfrac{K_1}{s(s+2)+K_1}=\dfrac{K_1}{s^{2}+2s+K_1}</div>
        <div class="mathbox math eqline tex tex-d">D(s)=s^{2}+2s+K_1=0</div>
        <div class="mathbox math eqline tex tex-d">s_{1,2}=-1\pm\sqrt{1-K_1}</div>
        <div class="seg">开环极点：由<span class="kw-r">结构</span>决定（不动）；闭环极点：随<span class="kw-r">K₁</span>移动（本页主角）。</div>
        <div class="seg">p₁=0 是积分环节（系统型别）、p₂=−2 是惯性环节——两个参数都有物理来源。</div>
        <div class="seg">K₁ 的作用：<span class="kw-r">一个旋钮同时改变</span>闭环极点位置（暂态）与 K_v（稳态）。</div>
      </div>
    </div>
    <div class="act-card rgt">
      <div class="hd">单位反馈结构（相加点＝圆圈加叉）</div>
      <div class="bd"><svg id="fig" viewBox="0 0 880 330"></svg></div>
    </div>
  </div>
</div>
""" + note("观察", "闭环极点 = 特征方程的根。研究性能随 K₁ 的变化，本质是研究<span class=\"kw-r\">特征根随 K₁ 的移动规律</span>；同时 K_v=K₁/2，稳态精度也随 K₁ 提高。") + r"""
<script>
document.addEventListener("DOMContentLoaded", () => {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.getElementById("fig");
  const mk = (t, a, p) => { const n = document.createElementNS(NS, t); for (const k in a) n.setAttribute(k, a[k]); (p || svg).appendChild(n); return n; };
  const MF = "'Cambria Math','STIX Two Math',Georgia,'Microsoft YaHei',serif";
  const tx = (p, x, y, s, o) => { o = o || {}; const n = mk("text", { x, y, "font-size": o.fs || 27, "text-anchor": o.an || "middle", fill: o.fill || "#1B3B8B", "font-weight": o.b ? 700 : 400, "font-style": o.it ? "italic" : "normal", "font-family": MF }, p); n.textContent = s; return n; };
  const defs = mk("defs", {});
  const m = mk("marker", { id: "q4a", markerWidth: 10, markerHeight: 8, refX: 7, refY: 3, orient: "auto" }, defs);
  mk("path", { d: "M0,0 L7,3 L0,6 Z", fill: "#16324f" }, m);
  const y = 110;
  tx(svg, 56, y + 9, "R(s)", { fs: 28, it: 1, b: 1, fill: "#16324f", an: "end" });
  mk("line", { x1: 66, y1: y, x2: 210, y2: y, stroke: "#16324f", "stroke-width": 2.6, "marker-end": "url(#q4a)" });
  mk("circle", { cx: 240, cy: y, r: 15, fill: "#fff", stroke: "#16324f", "stroke-width": 2.8 });
  mk("line", { x1: 230, y1: y - 10, x2: 250, y2: y + 10, stroke: "#16324f", "stroke-width": 2.6 });
  mk("line", { x1: 230, y1: y + 10, x2: 250, y2: y - 10, stroke: "#16324f", "stroke-width": 2.6 });
  tx(svg, 214, y - 20, "−", { fs: 30, b: 1, fill: "#16324f" });
  mk("line", { x1: 255, y1: y, x2: 330, y2: y, stroke: "#16324f", "stroke-width": 2.6, "marker-end": "url(#q4a)" });
  mk("rect", { x: 336, y: y - 34, width: 210, height: 68, rx: 8, fill: "#F4F7FE", stroke: "#16324f", "stroke-width": 2.8 });
  tx(svg, 441, y + 9, "G(s)", { fs: 29, b: 1, fill: "#16324f" });
  mk("line", { x1: 546, y1: y, x2: 700, y2: y, stroke: "#16324f", "stroke-width": 2.6, "marker-end": "url(#q4a)" });
  tx(svg, 716, y + 9, "C(s)", { fs: 28, it: 1, b: 1, fill: "#16324f", an: "start" });
  mk("circle", { cx: 620, cy: y, r: 5, fill: "#16324f" });
  mk("line", { x1: 620, y1: y, x2: 620, y2: 240, stroke: "#16324f", "stroke-width": 2.6 });
  mk("line", { x1: 620, y1: 240, x2: 240, y2: 240, stroke: "#16324f", "stroke-width": 2.6 });
  mk("line", { x1: 240, y1: 240, x2: 240, y2: y + 18, stroke: "#16324f", "stroke-width": 2.6, "marker-end": "url(#q4a)" });
  tx(svg, 268, 232, "H(s)=1（单位反馈）", { fs: 25, b: 1, fill: "#5B6B8C", an: "start" });
  tx(svg, 441, 292, "闭环传递函数 Φ(s)=G(s)/[1+G(s)]", { fs: 26, b: 1, fill: "#1B3B8B" });
});
</script>
""" + foot()))

# ---------------- P5 引例②数值表 ----------------
PAGES.append(dict(file="p05-intro-table.html", title="引例②：特征根数值表", html=
head("引例②：特征根数值表", pageattr=' data-page="__PAGENO__"', extra_css="""
  .colv { display:flex; flex-direction:column; gap:16px; height:100%; min-height:0; }
  .main { flex:1.25; display:flex; flex-direction:column; min-height:0; }
  .main .bd { flex:1; display:flex; flex-direction:column; justify-content:center; gap:14px; }
  .bands { flex:1; display:grid; grid-template-columns:1fr 1fr 1fr; gap:18px; min-height:0; }
  .bd2 { border-radius:14px; padding:16px 20px; font-size:22.5px; line-height:1.6; display:flex; flex-direction:column; justify-content:center; gap:8px; }
  .act-table td, .act-table th { padding:12px 8px; font-size:22px; }
  .act-table tr.hot td { background:#FDF3EC; color:var(--danger); font-weight:700; }
""") + r"""
<div class="act-body has-note">
  <div class="colv">
    <div class="act-card main">
      <div class="hd">特征根 s₁,₂ = −1 ± √(1−K₁) 随 K₁ 变化（D(s)=s²+2s+K₁）</div>
      <div class="bd">
        <table class="act-table">
          <tr><th>K₁</th><th>0</th><th>0.5</th><th>1</th><th>2</th><th>5</th><th>→∞</th></tr>
          <tr class="hot"><td>s₁</td><td>0</td><td>−0.29</td><td>−1</td><td>−1+j1</td><td>−1+j2</td><td>−1+j∞</td></tr>
          <tr class="hot"><td>s₂</td><td>−2</td><td>−1.71</td><td>−1</td><td>−1−j1</td><td>−1−j2</td><td>−1−j∞</td></tr>
          <tr><td>根型</td><td>两负实根</td><td>两负实根</td><td>负实重根</td><td colspan="2">共轭复根（实部恒 −1）</td><td>虚部→∞</td></tr>
          <tr><td>极点运动</td><td colspan="2">相向靠拢</td><td>相遇</td><td colspan="2">分离后竖直向上 / 向下</td><td>趋向无穷远</td></tr>
        </table>
      </div>
    </div>
    <div class="bands">
      <div class="bd2" style="background:var(--sky);"><b style="color:var(--navy);">阶段① 0 ≤ K₁ &lt; 1</b>两个负实根：一个增大、一个减小，沿实轴<span class="kw-r">相向靠拢</span>。</div>
      <div class="bd2" style="background:#FDF3EC;"><b style="color:var(--danger);">阶段② K₁ = 1</b>两根在 <b>−1</b> 处重合：<span class="kw-r">负实重根</span>（分离点）。</div>
      <div class="bd2" style="background:#F0FAF4;"><b style="color:#1F7A45;">阶段③ K₁ &gt; 1</b>离开实轴成<span class="kw-r">共轭复根</span>，实部恒为 −1，竖直趋向无穷。</div>
    </div>
  </div>
</div>
""" + note("思路", "把每个 K₁ 下的特征根逐点标在 s 平面上再连成线，闭环极点的「运动轨迹」就浮现出来——下一页动画演示。") + foot()))

# ---------------- P6 引例③动画 ----------------
PAGES.append(dict(file="p06-intro-anim.html", title="引例③：根轨迹的诞生（动画）", cx="L2", scripts='<script src="../data/intro.js"></script>\n', html=
head("引例③：根轨迹的诞生", pageattr=' data-page="__PAGENO__"', extra_css=ANIM_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card figc">
      <div class="hd"><span style="flex:1">K₁: 0 → ∞，两个闭环极点的「运动轨迹」</span></div>
      <div class="bd2"><svg id="fig"></svg></div>
      <div class="ctl">
        <button class="btn" id="play">▶ 播放</button>
        <button class="btn ghost" onclick="ACT.step.reset()">↺ 重置</button>
        <span class="prog" id="prog">0 / 6</span>
      </div>
    </div>
    <div class="side">
      <div class="act-card">
        <div class="hd">当前状态</div>
        <div class="bd">
          <div class="kv">K₁ = <b id="kv">0</b></div>
          <div class="kv">闭环极点：<b id="kp">0 , −2</b></div>
          <div class="kv">ζ：<b id="kz">—</b>　σ%：<b id="ks">—</b>　t_s：<b id="kt">—</b></div>
        </div>
      </div>
      <div class="act-card">
        <div class="bd" style="font-size:19px; gap:5px; overflow:hidden;">
          <div class="kv" id="s1" style="padding:8px 14px;">① p₁=0、p₂=−2 落位</div>
          <div class="kv" id="s2" style="padding:8px 14px;">② 0→1：实轴靠拢</div>
          <div class="kv" id="s3" style="padding:8px 14px;">③ K₁=1：−1 处会合</div>
          <div class="kv" id="s4" style="padding:8px 14px;">④ K₁&gt;1：共轭分离</div>
          <div class="kv" id="s5" style="padding:8px 14px;">⑤ 沿 σ=−1 竖直生长</div>
          <div class="kv" id="s6" style="padding:8px 14px;">⑥ 趋向 −1±j∞</div>
        </div>
      </div>
      <div class="act-card">
        <div class="bd" style="justify-content:center; font-size:19px; line-height:1.45;">
          参数 K₁: 0→∞ 时，<span class="kw-r">闭环特征根的移动轨迹</span>＝<span class="kw-r">根轨迹</span>
        </div>
      </div>
    </div>
  </div>
</div>
""" + note("定义", "根轨迹：开环零、极点已知的前提下，某一参数变化时<span class=\"kw-r\">闭环特征根在 s 平面上走过的路径</span>。它把「逐点试算」变成「一图看全」。") + r"""
<div data-step="1" style="display:none"></div><div data-step="2" style="display:none"></div><div data-step="3" style="display:none"></div>
<div data-step="4" style="display:none"></div><div data-step="5" style="display:none"></div><div data-step="6" style="display:none"></div>
<script>
document.addEventListener("DOMContentLoaded", () => {
  const F = RL.figure("fig", "intro", { vw: 900, vh: 560, arrows: true, asym: false, brk: false });
  const TOTAL = 6, KS = [0, 0.5, 1, 2, 5, 9, 9];
  const STEPTXT = ["① 开环极点落位", "② 实轴靠拢（两负实根）", "③ K₁=1：在 −1 会合", "④ 分离为共轭复根", "⑤ 沿 σ=−1 竖直生长", "⑥ 趋向无穷远：−1±j∞"];
  function paint(K) {
    const Kv = KS[Math.min(K, 6)];
    const f = F.mapK(Kv);
    F.setProgress(f);
    const t = 1 - Kv;
    let s1, s2;
    if (t >= 0) { s1 = -(1 + Math.sqrt(t)); s2 = -(1 - Math.sqrt(t)); }
    else { s1 = [-1, Math.sqrt(-t)]; s2 = [-1, -Math.sqrt(-t)]; }
    const fmt = v => Array.isArray(v)
      ? (v[1] >= 0 ? "−1+j" + v[1].toFixed(2) : "−1−j" + (-v[1]).toFixed(2))
      : v.toFixed(2);
    document.getElementById("kv").textContent = K >= 6 ? "→∞" : Kv;
    document.getElementById("kp").textContent = fmt(s1) + " , " + fmt(s2);
    if (t >= 0) {
      document.getElementById("kz").textContent = Kv === 0 ? "1" : (Kv < 1 ? "＞1" : "1");
      document.getElementById("ks").textContent = "无超调";
      document.getElementById("kt").textContent = Kv === 0 ? "—" : "≈4";
    } else {
      const wn = Math.sqrt(Kv), z = 1 / wn;
      document.getElementById("kz").textContent = z.toFixed(2);
      document.getElementById("ks").textContent = (100 * Math.exp(-Math.PI * z / Math.sqrt(1 - z * z))).toFixed(0) + "%";
      document.getElementById("kt").textContent = "≈4";
    }
    for (let i = 1; i <= 6; i++) {
      const el = document.getElementById("s" + i);
      el.style.background = i === K ? "#FDF3EC" : "var(--sky)";
      el.style.borderLeft = i === K ? "5px solid var(--orange)" : "5px solid transparent";
    }
  }
  RL.wire(TOTAL, paint, { dur: 9000 });
});
</script>
""" + foot()))

# ---------------- P7 引例④性能对应（新增动画） ----------------
PAGES.append(dict(file="p07-intro-perf.html", title="引例④：根轨迹与性能的对应", cx="L1", scripts='<script src="../data/intro.js"></script>\n', html=
head("引例④：由根轨迹直接读性能（动画联动）", pageattr=' data-page="__PAGENO__"', extra_css=ANIM_CSS + """
  .colv { display:flex; flex-direction:column; gap:14px; height:100%; min-height:0; }
  .wide { flex:none; display:flex; min-height:0; }
  .bdw { flex:1; display:flex; gap:16px; min-height:0; }
  .wcard { flex:1; background:var(--sky); border-radius:12px; padding:10px 18px; font-size:22px; line-height:1.55; }
  .wcard b.h { color:var(--navy); }
""") + r"""
<div class="act-body has-note">
  <div class="colv">
    <div class="row" style="flex:1.4; min-height:0;">
      <div class="act-card figc">
        <div class="hd"><span style="flex:1">根轨迹动画：ζ 与 σ% 随 K₁ 实时变化</span></div>
        <div class="bd2"><svg id="fig"></svg></div>
        <div class="ctl">
          <button class="btn" id="play">▶ 播放</button>
          <button class="btn ghost" onclick="ACT.step.reset()">↺ 重置</button>
          <span class="prog" id="prog">0 / 5</span>
        </div>
      </div>
      <div class="side">
        <div class="act-card">
          <div class="hd">当前 K₁ 下的性能</div>
          <div class="bd">
            <div class="kv">K₁ = <b id="kv">0</b>（K_v = K₁/2）</div>
            <div class="kv">阻尼比 ζ：<b id="kz">—</b>　超调 σ%：<b id="ks">—</b></div>
            <div class="kv">调节时间 t_s = 4/(ζωₙ) = <b id="kt">—</b></div>
          </div>
        </div>
        <div class="act-card">
          <div class="bd" style="justify-content:center; font-size:22px; line-height:1.65;">
            二阶系统：<span class="tex">\zeta\omega_n=1,\ \omega_n=\sqrt{K_1}</span><br>
            K₁ ↑ → ωₙ ↑ → <span class="kw-r">ζ ↓ → σ% ↑</span><br>
            实部恒 −1 → <span class="kw-r">t_s ≈ 4 不变</span>
          </div>
        </div>
      </div>
    </div>
    <div class="wide">
      <div class="bdw">
        <div class="wcard"><b class="h">平稳性</b>：看复极点<span class="kw-r">虚部/实部之比</span>（阻尼角）——K₁ 越大越振荡。</div>
        <div class="wcard"><b class="h">快速性</b>：看极点<span class="kw-r">实部</span>（离虚轴距离）——实部恒 −1，t_s 基本不变。</div>
        <div class="wcard"><b class="h">稳定性</b>：看轨迹是否<span class="kw-r">越过虚轴</span>——本例恒在左半平面，恒稳定。</div>
        <div class="wcard"><b class="h">稳态精度</b>：K_v = K₁/2，K₁ ↑ → <span class="kw-r">e_ss ↓</span>。</div>
      </div>
    </div>
  </div>
</div>
""" + note("总结", "根轨迹 = 参数—性能的<span class=\"kw-r\">全景地图</span>：快速性看实部、平稳性看阻尼角、稳定性看是否越轴、稳态看 K₁。") + r"""
<div data-step="1" style="display:none"></div><div data-step="2" style="display:none"></div><div data-step="3" style="display:none"></div><div data-step="4" style="display:none"></div><div data-step="5" style="display:none"></div>
<script>
document.addEventListener("DOMContentLoaded", () => {
  const F = RL.figure("fig", "intro", { vw: 860, vh: 560, arrows: true, asym: false, brk: false });
  const TOTAL = 5, KS = [0, 0.6, 1, 3, 9, 30];
  function paint(K) {
    const Kv = KS[Math.min(K, 5)];
    const f = F.mapK(Kv);
    F.setProgress(f);
    const t = 1 - Kv;
    document.getElementById("kv").textContent = Kv;
    if (t >= 0) {
      document.getElementById("kz").textContent = Kv === 0 ? "1" : (Kv < 1 ? "＞1" : "1");
      document.getElementById("ks").textContent = "无超调";
      document.getElementById("kt").textContent = "≈4 s";
    } else {
      const wn = Math.sqrt(Kv), z = 1 / wn;
      document.getElementById("kz").textContent = z.toFixed(2);
      document.getElementById("ks").textContent = (100 * Math.exp(-Math.PI * z / Math.sqrt(1 - z * z))).toFixed(0) + "%";
      document.getElementById("kt").textContent = "≈4 s";
    }
  }
  RL.wire(TOTAL, paint, { dur: 8000 });
});
</script>
""" + foot()))

# ---------------- P8 根轨迹方程 ----------------
PAGES.append(dict(file="p08-locus-eq.html", title="根轨迹方程", html=
head("根轨迹方程", pageattr=' data-page="__PAGENO__"', extra_css="""
  .colv { display:flex; flex-direction:column; gap:16px; height:100%; min-height:0; }
  .flow { flex:1.15; display:flex; align-items:stretch; gap:0; min-height:0; }
  .step { flex:1; background:var(--sky); border-radius:14px; padding:16px 18px; display:flex; flex-direction:column; justify-content:center; gap:10px; }
  .step .t { font-size:23px; font-weight:700; color:var(--navy); }
  .arr { flex:none; width:56px; display:grid; place-items:center; color:var(--orange); font-size:40px; font-weight:800; }
  .duo { flex:1; display:grid; grid-template-columns:1.15fr 1fr; gap:18px; min-height:0; }
  .duo .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:10px; }
  .seg { background:var(--sky); border-radius:12px; padding:11px 16px; font-size:22px; line-height:1.6; }
""") + r"""
<div class="act-body has-note">
  <div class="colv">
    <div class="flow">
      <div class="step">
        <div class="t">① 闭环特征方程</div>
        <div class="mathbox math eqline tex tex-d" style="font-size:23px;">1+G(s)H(s)=0</div>
        <div style="font-size:21.5px; color:var(--muted);">s 是闭环极点 ⟺ s 满足上式<br>这是关于 s 的<span class="kw-r">高次代数方程</span></div>
      </div>
      <div class="arr">➜</div>
      <div class="step">
        <div class="t">② 移项得根轨迹方程</div>
        <div class="mathbox math eqline tex tex-d" style="font-size:23px;">G(s)H(s)=-1</div>
        <div style="font-size:21.5px; color:var(--muted);">−1 是复数：幅值、相角都要相等<br>即 <span class="tex">|GH|=1</span> 且 <span class="tex">ngle GH=(2q+1)\pi</span></div>
      </div>
      <div class="arr">➜</div>
      <div class="step">
        <div class="t">③ 零极点乘积形式</div>
        <div class="mathbox math eqline tex tex-d" style="font-size:21px;">G(s)H(s)=\dfrac{K_1\prod\limits_{j=1}^{m}(s-z_j)}{\prod\limits_{i=1}^{n}(s-p_i)}</div>
        <div style="font-size:21.5px; color:var(--muted);">尾一标准形，K₁∈[0,+∞)<br>m 个零点、n 个极点一目了然</div>
      </div>
    </div>
    <div class="seg" style="flex:none; font-size:23px; background:#FDF3EC;">下一页把 <b>−1</b> 拆开：<span class="kw-r">幅值条件</span>（定 K₁）与<span class="kw-r">相角条件</span>（定轨迹）分别登场。</div>
    <div class="duo">
      <div class="act-card">
        <div class="hd">变量释义</div>
        <div class="bd">
          <div class="seg" style="font-size:21.5px;"><b>K₁</b>：根轨迹增益（尾一标准形的分子系数，≠开环放大系数 K）</div>
          <div class="seg" style="font-size:21.5px;"><b>z_j（m 个）</b>：开环零点；<b>p_i（n 个）</b>：开环极点</div>
        </div>
      </div>
      <div class="act-card">
        <div class="hd">化尾一标准形示例</div>
        <div class="bd">
          <div class="seg" style="font-size:21px;">例：分母因子 0.5s+2 = 0.5(s+4)，常数归入增益</div>
          <div class="seg" style="font-size:21px;"><span class="tex">\dfrac{K(s+2)}{s(s+1)(0.5s+2)}=\dfrac{4K(s+2)}{s(s+1)(s+4)}</span> → 根轨迹增益 <span class="tex">K_1=4K</span></div>
        </div>
      </div>
    </div>
  </div>
</div>
""" + note("要点", "K₁ 是<span class=\"kw-r\">根轨迹增益</span>，与开环放大系数 K 未必相等——两者不能混用。") + foot()))
