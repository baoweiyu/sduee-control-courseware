# -*- coding: utf-8 -*-
"""第五章 P56-P68 页面定义（第四部分：控制系统的根轨迹分析法）。"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_lib import head, foot, note, partcover, QUIZ_CSS

PAGES = []

DERIV_CSS = """
  .row { display:flex; gap:26px; height:100%; min-height:0; }
  .c { flex:1; display:flex; flex-direction:column; min-height:0; }
  .c .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:9px; }
  .hl { background:#FDF3EC; border-radius:12px; padding:11px 17px; font-size:21px; line-height:1.55; }
  .seg { background:var(--sky); border-radius:12px; padding:9px 15px; font-size:20px; line-height:1.5; }
"""

ANIM_CSS = """
  .row { display:flex; gap:22px; height:100%; min-height:0; }
  .figc { flex:1.3; display:flex; flex-direction:column; overflow:hidden; }
  .figc .bd2 { flex:1; display:grid; place-items:center; background:#fff; padding:6px 8px; min-height:0; }
  .figc svg { width:100%; height:100%; }
  .ctl { display:flex; align-items:center; gap:10px; justify-content:center; padding:6px 0 8px; }
  .btn { background:var(--blue); color:#fff; border:none; border-radius:10px; font-size:18px; font-weight:700; padding:7px 18px; cursor:pointer; }
  .btn.ghost { background:#fff; color:var(--blue); border:2px solid var(--blue); }
  .prog { font-size:17px; color:var(--muted); min-width:52px; }
  .side { flex:1; display:flex; flex-direction:column; gap:14px; min-height:0; }
  .side .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:8px; }
  .kv { background:var(--sky); border-radius:12px; padding:10px 15px; font-size:19.5px; line-height:1.5; }
"""

# ---------------- P56 第四部分封面 ----------------
PAGES.append(dict(file="p56-part4-cover.html", title="第四部分封面", cx="L0", html=
head("第四部分封面 · 控制系统的根轨迹分析法", nochrome=True, pageattr=' data-page="__PAGENO__"', extra_css="") +
partcover("第四部分", "控制系统的根轨迹分析法", "由轨迹读性能 · 零极点配置规律", "轨迹画好了，怎么用它回答性能与设计问题",
      [("4.1", "闭环零极点的确定 · 试探法 · 例5-13"),
       ("4.2", "零极点分布对性能的影响 · 偶极子"),
       ("4.3", "例5-14 / 例5-15：零点作用与主导极点近似"),
       ("4.4", "例5-16：开环零极点对轨迹的改造 · 三大规律")],
      "servo-antenna.png", "伺服天线定位系统") + foot()))

# ---------------- P57 闭环零点与闭环增益 ----------------
PAGES.append(dict(file="p57-closed-zp.html", title="闭环零点与闭环增益", html=
head("闭环零点与闭环增益", pageattr=' data-page="__PAGENO__"', extra_css=DERIV_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">一般反馈结构的闭环传函</div>
      <div class="bd">
        <div class="mathbox math eqline tex tex-d">\varPhi(s)=\dfrac{G(s)}{1+G(s)H(s)}</div>
        <div class="seg" style="font-size:20px;"><b>结论①</b>：闭环零点 = <span class="kw-r">G(s) 的零点 + H(s) 的极点</span>（前向通道零点 + 反馈通道极点）。</div>
        <div class="seg" style="font-size:20px;"><b>结论②</b>：闭环根轨迹增益 = <span class="kw-r">前向通道根轨迹增益</span>（与 H 无关）。</div>
        <div class="seg" style="font-size:20px;">单位反馈（H=1）：闭环零点 = 开环零点；开环无零点 → 闭环也无零点。</div>
      </div>
    </div>
    <div class="act-card c">
      <div class="hd">为什么重要</div>
      <div class="bd">
        <div class="mathbox math eqline tex tex-d">\varPhi(s)=\dfrac{K_1^{\,*}\prod\limits_{j=1}^{m}(s-z_j)}{\prod\limits_{i=1}^{n}(s-p_i)}</div>
        <div class="seg" style="font-size:20px;">闭环极点 p_i：随 K₁ 沿根轨迹移动（轨迹只管极点）。</div>
        <div class="seg" style="font-size:20px;">闭环零点 z_j：<span class="kw-r">不随 K₁ 变</span>，由结构决定——但直接影响暂态响应的形态（例 5-14 将见分晓）。</div>
        <div class="hl" style="font-size:20px;">同一条根轨迹 + 不同的零点位置 = 不同的系统——这就是"轨迹相同、性能不同"的根源。</div>
      </div>
    </div>
  </div>
</div>
""" + note("对照", "第三章结论：闭环零点会<span class=\"kw-r\">加快响应、增大超调</span>；此处给出它的结构来源。") + foot()))

# ---------------- P58 试探法 ----------------
PAGES.append(dict(file="p58-trial.html", title="试探法确定闭环极点", html=
head("试探法确定闭环极点", pageattr=' data-page="__PAGENO__"', extra_css=DERIV_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">操作步骤</div>
      <div class="bd">
        <div class="seg">① 在根轨迹上（按性能要求选区域，如指定 ζ 射线附近）<span class="kw-r">试取一点 s</span>；</div>
        <div class="seg">② 用<span class="kw-r">相角条件</span>检验：Σ∠z−Σ∠p = 奇数倍 180°？不满足就修移试点；</div>
        <div class="seg">③ 满足后由<span class="kw-r">幅值条件</span>算出该点的 K₁；</div>
        <div class="seg">④ 其余闭环极点用<span class="kw-r">根之和 / 根之积</span>（或长除法）求出；</div>
        <div class="seg" style="font-size:19.5px;">⑤ 高阶系统的精确求解可借助 MATLAB 等工具（rlocus），但手工试探是理解轨迹的基础。</div>
      </div>
    </div>
    <div class="act-card c">
      <div class="hd">示意</div>
      <div class="bd" style="justify-content:center;">
        <div class="hl" style="font-size:20.5px;">下一页的例 5-13 就是完整示范：<span class="kw-r">ζ=0.5 射线</span>与轨迹的交点 → 幅值条件算 K₁ → 根之和 + 长除法补齐全部极点 → 写出闭环传函。</div>
        <div class="seg" style="font-size:20px;">要点：闭环极点必须<span class="kw-r">成对出现在轨迹上</span>——试探点不在轨迹上就没有对应的 K₁。</div>
        <div class="seg" style="font-size:20px;">实轴上剩余极点的位置常用根之和估算：n−m≥2 时 Σs_i 不随 K₁ 变。</div>
      </div>
    </div>
  </div>
</div>
""" + note("衔接", "试探法把「画轨迹」升级为「用轨迹」：从性能出发反查参数。") + foot()))

# ---------------- P59 例5-13① ----------------
PAGES.append(dict(file="p59-ex513a.html", title="例5-13①：ζ=0.5求K₁", scripts='<script src="../data/ex54.js"></script>\n', html=
head("例5-13①：确定 ζ=0.5 对应的 K₁", pageattr=' data-page="__PAGENO__"', extra_css="""
  .row { display:flex; gap:24px; height:100%; min-height:0; }
  .c { flex:1.05; display:flex; flex-direction:column; min-height:0; }
  .c .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:9px; }
  .figc { flex:1.15; display:flex; flex-direction:column; overflow:hidden; }
  .figc .bd2 { flex:1; display:grid; place-items:center; background:#fff; padding:6px 8px; min-height:0; }
  .figc svg { width:100%; height:100%; }
  .seg { background:var(--sky); border-radius:12px; padding:9px 15px; font-size:20px; line-height:1.5; }
  .hl { background:#FDF3EC; border-radius:12px; padding:10px 16px; font-size:20.5px; line-height:1.55; }
""") + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">例 5-13：求 ζ=0.5 的复数极点与 K₁</div>
      <div class="bd">
        <div style="font-size:20.5px;">系统同例 5-5/5-6：<span class="tex">G(s)H(s)=\dfrac{K_1}{s(s+3)(s^{2}+2s+2)}</span>。</div>
        <div class="seg" style="font-size:20px;">① 过原点作与负实轴夹角 β=60° 的射线：<span class="tex">\zeta=\cos\beta=0.5</span>。</div>
        <div class="seg" style="font-size:20px;">② 射线与根轨迹交点即所求复数极点：<span class="tex">s_{1,2}\approx-0.4\pm\mathrm{j}0.7</span>（精确 −0.409±j0.709）。</div>
        <div class="seg" style="font-size:20px;">③ 幅值条件求 K₁：</div>
        <div class="mathbox math eqline tex tex-d" style="font-size:20px;">K_1=\left|s_1\right|\cdot\left|s_1+3\right|\cdot\left|s_1+1+\mathrm{j}\right|\cdot\left|s_1+1-\mathrm{j}\right|=2.62</div>
      </div>
    </div>
    <div class="figc">
      <div class="act-card" style="height:100%; display:flex; flex-direction:column; overflow:hidden;">
        <div class="hd">ζ=0.5 射线与轨迹交点</div>
        <div class="bd2"><svg id="fig"></svg></div>
      </div>
    </div>
  </div>
</div>
""" + note("读数口径", "教材按图读 s₁,₂=−0.4±j0.7、K₁=2.62；本课件数值解：交点 −0.409±j0.709、K₁=2.618——<span class=\"kw-r\">口径一致</span>。") + r"""
<script>
document.addEventListener("DOMContentLoaded", () => {
  RL.figure("fig", "ex54", { vw: 860, vh: 620, static: true, zeta: 0.5, crossLabels: true, extra: (F) => {
    // 标注 ζ=0.5 射线交点 s1,2（数值解）
    [[-0.409, 0.709], [-0.409, -0.709]].forEach((p, i) => {
      RL.mk("circle", { cx: F.X(p[0]), cy: F.Y(p[1]), r: 7, fill: "#D63A2F" }, F.gTop);
      RL.tx(F.gTop, F.X(p[0]) + 40, F.Y(p[1]) + (i === 0 ? -8 : 22), "s_{" + (i + 1) + "}", { fs: 20, b: 1, fill: "#D63A2F", halo: 1 });
    });
  } });
});
</script>
""" + foot()))

# ---------------- P60 例5-13② ----------------
PAGES.append(dict(file="p60-ex513b.html", title="例5-13②：求其余极点写Φ(s)", html=
head("例5-13②：求其余极点，写出闭环传函", pageattr=' data-page="__PAGENO__"', extra_css=DERIV_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">长除法求其余两个极点</div>
      <div class="bd">
        <div style="font-size:20.5px;">K₁=2.62 时闭环特征式：</div>
        <div class="mathbox math eqline tex tex-d" style="font-size:20px;">D(s)=s^{4}+5s^{3}+8s^{2}+6s+2.62</div>
        <div style="font-size:20.5px;">已知一对极点 <span class="tex">-0.4\pm\mathrm{j}0.7</span>（因式 <span class="tex">s^{2}+0.8s+0.65</span>），长除得商：</div>
        <div class="mathbox math eqline tex tex-d" style="font-size:20px;">D(s)\approx(s^{2}+0.8s+0.65)(s+1.41)(s+2.79)</div>
        <div class="seg" style="font-size:19.5px;">其余极点：<span class="tex">s_3=-1.41</span>、<span class="tex">s_4=-2.79</span>（数值精确解 −1.411、−2.772）。</div>
        <div class="seg" style="font-size:19.5px;">验证根之和：−0.4×2−1.41−2.79 = −5 = 开环极点之和 ✓。</div>
      </div>
    </div>
    <div class="act-card c">
      <div class="hd">写出闭环传递函数</div>
      <div class="bd">
        <div class="mathbox math eqline tex tex-d" style="font-size:20.5px;">\varPhi(s)=\dfrac{2.62}{(s^{2}+0.8s+0.65)(s+1.41)(s+2.79)}</div>
        <div class="seg" style="font-size:20px;">主导极点分析：<span class="tex">s_{1,2}</span> 离虚轴最近、附近无零点；<span class="tex">|s_3|,\ |s_4|</span> 与虚轴距离是 s₁,₂ 实部的 3.5~7 倍 → <span class="kw-r">s₁,₂ 为主导极点</span>。</div>
        <div class="seg" style="font-size:20px;">近似：把系统按二阶 <span class="tex">\zeta=0.5,\ \omega_n\approx0.8</span> 估算性能（方法见 P65）。</div>
      </div>
    </div>
  </div>
</div>
""" + note("工具箱", "试探定主导对 → 长除/根和补齐 → 主导极点降阶估算——高阶系统分析的<span class=\"kw-r\">标准三连</span>。") + foot()))

# ---------------- P61 性能影响四规律 ----------------
PAGES.append(dict(file="p61-perf-rules.html", title="零极点分布对性能的影响", html=
head("闭环零极点分布对性能的影响（四条规律）", pageattr=' data-page="__PAGENO__"', extra_css="""
  .grid { flex:1; display:grid; grid-template-columns:1fr 1fr; gap:18px; min-height:0; }
  .g { background:var(--sky); border-radius:14px; padding:16px 20px; font-size:20.5px; line-height:1.6; display:flex; flex-direction:column; justify-content:center; gap:8px; }
  .g b { color:var(--navy); font-size:21.5px; }
  .g .r { color:var(--danger); font-weight:700; }
""") + r"""
<div class="act-body has-note">
  <div class="act-card" style="flex:1; display:flex; flex-direction:column; min-height:0;">
    <div class="hd">性能四问：稳定性 · 运动形态 · 平稳性 · 快速性</div>
    <div class="grid">
      <div class="g"><b>① 稳定性</b>闭环极点全部位于<span class="r">左半 s 平面</span>，系统才稳定；与闭环零点位置无关。</div>
      <div class="g"><b>② 运动形态</b>实极点 → 单调（指数）分量；复极点 → <span class="r">振荡</span>分量；响应形态由极点性质决定。</div>
      <div class="g"><b>③ 平稳性</b>复极点离实轴越近（阻尼角越小）越平稳；主导极点阻尼角常取 <span class="r">±45°</span>（ζ≈0.707 最佳）附近。</div>
      <div class="g"><b>④ 快速性</b>极点<span class="r">离虚轴越远</span>衰减越快、t_s 越短；系数很小的分量、以及<span class="r">偶极子</span>（相近零极点）对消后可忽略。</div>
    </div>
  </div>
</div>
""" + note("使用", "在根轨迹上选极点 = 在这四条之间<span class=\"kw-r\">折中</span>：稳定是前提，平稳与快速靠阻尼角与实部距离权衡。") + foot()))

# ---------------- P62 闭环偶极子 ----------------
PAGES.append(dict(file="p62-dipole.html", title="闭环偶极子", html=
head("闭环偶极子", pageattr=' data-page="__PAGENO__"', extra_css="""
  .row { display:flex; gap:26px; height:100%; min-height:0; }
  .c { flex:1; display:flex; flex-direction:column; min-height:0; }
  .c .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:10px; }
  .c2 { flex:1.05; display:flex; flex-direction:column; overflow:hidden; }
  .c2 .bd2 { flex:1; display:grid; place-items:center; background:#fff; padding:6px 10px; min-height:0; }
  .c2 svg { width:100%; height:100%; }
  .seg { background:var(--sky); border-radius:12px; padding:10px 16px; font-size:20.5px; line-height:1.55; }
""") + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">定义与对消条件</div>
      <div class="bd">
        <div class="seg">一对<span class="kw-r">相距很近</span>的闭环零、极点 <span class="tex">z,\ p</span>（<span class="tex">|p-z|\ll|z-s_k|,\ |p-s_k|</span>，s_k 为其它极点）构成<span class="kw-r">闭环偶极子</span>。</div>
        <div class="seg">二者对其它极点处响应的作用<span class="kw-r">互相抵消</span>：系数 α_k=|p−z|/|s_k−z| ≈ 0，该分量可忽略。</div>
        <div class="seg" style="font-size:19.5px;">工程判据：|p−z| 小于主导极点实部的 1/5~1/10 即可视作对消。</div>
      </div>
    </div>
    <div class="act-card c2">
      <div class="hd">对消示意（s 平面放大图）</div>
      <div class="bd2"><svg id="fig" viewBox="0 0 880 520"></svg></div>
    </div>
  </div>
</div>
""" + note("价值", "偶极子让「在轨迹附近安插零点」成为<span class=\"kw-r\">不破坏暂态</span>的稳态优化手段（P67 开环偶极子改善 e_ss 的原理）。") + r"""
<script>
document.addEventListener("DOMContentLoaded", () => {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.getElementById("fig");
  const mk = (t, a, p) => { const n = document.createElementNS(NS, t); for (const k in a) n.setAttribute(k, a[k]); (p || svg).appendChild(n); return n; };
  const MF = "'Cambria Math','STIX Two Math',Georgia,'Microsoft YaHei',serif";
  const tx = (p, x, y, s, o) => { o = o || {}; const n = mk("text", { x, y, "font-size": o.fs || 22, "text-anchor": o.an || "middle", fill: o.fill || "#1B3B8B", "font-weight": o.b ? 700 : 400, "font-family": MF }, p); n.textContent = s; if (o.halo) n.setAttribute("style", "paint-order:stroke;stroke:#FFF;stroke-width:5;stroke-linejoin:round"); return n; };
  const defs = mk("defs", {});
  const m = mk("marker", { id: "dpa", markerWidth: 10, markerHeight: 8, refX: 7, refY: 3, orient: "auto" }, defs);
  mk("path", { d: "M0,0 L7,3 L0,6 Z", fill: "#5B6B8C" }, m);
  const X = x => 440 + x * 90, Y = y => 260 - y * 90;
  mk("line", { x1: 40, y1: Y(0), x2: 850, y2: Y(0), stroke: "#5B6B8C", "stroke-width": 1.5, "marker-end": "url(#dpa)" });
  mk("line", { x1: X(0), y1: 480, x2: X(0), y2: 60, stroke: "#5B6B8C", "stroke-width": 1.5, "marker-end": "url(#dpa)" });
  tx(svg, 856, Y(0) + 26, "σ", { fs: 23, it: 1, b: 1, fill: "#5B6B8C", an: "start" });
  tx(svg, X(0) + 18, 62, "jω", { fs: 23, it: 1, b: 1, fill: "#5B6B8C", an: "start" });
  // 偶极子：z=-1.2, p=-0.9（示意），主导极点 -0.4±j1.5
  mk("circle", { cx: X(-1.2), cy: Y(0), r: 8, fill: "#fff", stroke: "#16324f", "stroke-width": 3.4 });
  tx(svg, X(-1.2), Y(0) + 36, "z", { fs: 21, b: 1, fill: "#16324f" });
  [[X(-0.9) - 8, Y(0) - 8], [X(-0.9) - 8, Y(0) + 8], [X(-0.9) + 8, Y(0) - 8], [X(-0.9) + 8, Y(0) + 8]].forEach((a, i) => {
    mk("line", { x1: a[0], y1: a[1], x2: a[0] + 16, y2: a[1] + 16, stroke: "#16324f", "stroke-width": 3.2, "stroke-linecap": "round" });
  });
  tx(svg, X(-0.9), Y(0) - 20, "p", { fs: 21, b: 1, fill: "#16324f" });
  // 距离标注
  mk("path", { d: `M ${X(-1.2)} ${Y(0) - 44} L ${X(-0.9)} ${Y(0) - 44}`, stroke: "#D63A2F", "stroke-width": 2.2, "marker-end": "url(#dpa)" });
  tx(svg, X(-1.05), Y(0) - 56, "|p−z| 极小", { fs: 20, b: 1, fill: "#D63A2F" });
  // 主导极点
  [[-0.4, 1.5, "s_1"], [-0.4, -1.5, "s_2"]].forEach(([re, im, lab]) => {
    mk("line", { x1: X(re) - 8, y1: Y(im) - 8, x2: X(re) + 8, y2: Y(im) + 8, stroke: "#2B5CE6", "stroke-width": 3.4, "stroke-linecap": "round" });
    mk("line", { x1: X(re) - 8, y1: Y(im) + 8, x2: X(re) + 8, y2: Y(im) - 8, stroke: "#2B5CE6", "stroke-width": 3.4, "stroke-linecap": "round" });
    tx(svg, X(re) + 26, Y(im) + 6, lab, { fs: 21, b: 1, fill: "#2B5CE6", an: "start" });
  });
  tx(svg, 640, 120, "偶极子到 s₁ 的距离 ≫ |p−z|", { fs: 21, b: 1, fill: "#16324f" });
  tx(svg, 440, 496, "响应中 z、p 的作用近似抵消 → 系统降阶处理", { fs: 21, b: 1 });
});
</script>
""" + foot()))

# ---------------- P63 例5-14① ----------------
PAGES.append(dict(file="p63-ex514a.html", title="例5-14①：同轨迹不同零点", scripts='<script src="../data/ex514.js"></script>\n', html=
head("例5-14①：两系统同轨迹、不同闭环零点", pageattr=' data-page="__PAGENO__"', extra_css=DERIV_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">例 5-14：两种结构，同一开环</div>
      <div class="bd">
        <div class="mathbox math eqline tex tex-d">G_a(s)=G_b(s)=\dfrac{K(0.8s+1)}{s(5s+1)}=\dfrac{0.16K(s+1.25)}{s(s+0.2)}</div>
        <div class="seg" style="font-size:19.5px;">(a) 比例微分控制：K(0.8s+1) 在<span class="kw-r">前向通道</span> → z=−1.25 既是开环零点、<span class="kw-r">又是闭环零点</span>。</div>
        <div class="seg" style="font-size:19.5px;">(b) 速度反馈控制：K 在前向、(0.8s+1) 在<span class="kw-r">反馈通道</span> → <span class="tex">\varPhi_b=\dfrac{K}{s(5s+1)+K(0.8s+1)}</span> 无闭环零点。</div>
        <div class="seg" style="font-size:19.5px;">特征方程相同 → <span class="kw-r">根轨迹相同</span>（圆轨迹，圆心 −1.25、半径 1.146；会合点 s=−2.396 对应 K=28.7）。</div>
      </div>
    </div>
    <div class="act-card c">
      <div class="hd">共同根轨迹（数值生成）</div>
      <div class="bd" style="justify-content:center;">
        <svg id="fig" style="width:100%; height:86%;"></svg>
      </div>
    </div>
  </div>
</div>
""" + note("悬念", "轨迹一样、K 一致，两系统的阶跃响应却不同——差别全在<span class=\"kw-r\">那个闭环零点</span>。下一页动画对比。") + r"""
<script>
document.addEventListener("DOMContentLoaded", () => {
  RL.figure("fig", "ex514", { vw: 860, vh: 520, static: true, extra: (F) => {
    [[-0.5, 0.866, "s_1", -10], [-0.5, -0.866, "s_2", 24]].forEach((p) => {
      RL.mk("circle", { cx: F.X(p[0]), cy: F.Y(p[1]), r: 6.5, fill: "#D63A2F" }, F.gTop);
      RL.tx(F.gTop, F.X(p[0]) + 34, F.Y(p[1]) + p[3], p[2] + "（K=5）", { fs: 18, b: 1, fill: "#D63A2F", halo: 1 });
    });
  } });
});
</script>
""" + foot()))

# ---------------- P64 例5-14②响应对比动画 ----------------
PAGES.append(dict(file="p64-ex514b.html", title="例5-14②：闭环零点的影响", cx="L2", scripts='<script src="../data/ex514.js"></script>\n', html=
head("例5-14②：闭环零点对暂态响应的影响（动画对比）", pageattr=' data-page="__PAGENO__"', extra_css=ANIM_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card figc">
      <div class="hd"><span style="flex:1">K=5（s₁,₂=−0.5±j0.866，ζ=0.5）：阶跃响应同步生长</span></div>
      <div class="bd2"><svg id="fig"></svg></div>
      <div class="ctl">
        <button class="btn" id="play">▶ 播放</button>
        <button class="btn ghost" onclick="ACT.step.reset()">↺ 重置</button>
        <span class="prog" id="prog">0 / 10</span>
      </div>
    </div>
    <div class="side">
      <div class="act-card">
        <div class="hd">两个响应（教材 p87）</div>
        <div class="bd" style="font-size:19px;">
          <div class="kv">(a) 有闭环零点：<span class="tex">\sigma\%=24.6\%,\ t_p=2.63\,\mathrm{s}</span><br>h_a=1+1.06e^{−0.5t}sin(0.866t−70.7°)</div>
          <div class="kv">(b) 无闭环零点：<span class="tex">\sigma\%=16.3\%,\ t_p=3.63\,\mathrm{s}</span><br>h_b=1−1.15e^{−0.5t}sin(0.866t+60°)</div>
        </div>
      </div>
      <div class="act-card">
        <div class="hd">结论</div>
        <div class="bd" style="font-size:19px;">
          <div class="kv">前向通道 PD：<span class="kw-r">t_p 最小</span>（响应快）</div>
          <div class="kv">反馈通道（速度反馈）：<span class="kw-r">σ% 最小</span>（平稳）</div>
          <div class="kv">附加闭环零点<span class="kw-r">越靠近虚轴影响越显著</span></div>
        </div>
      </div>
    </div>
  </div>
</div>
""" + note("机理", "闭环零点使响应叠加<span class=\"kw-r\">微分分量</span>：上升更快、超调更大——同为 ζ=0.5，形态迥异。") + r"""
<div data-step="1" style="display:none"></div><div data-step="2" style="display:none"></div><div data-step="3" style="display:none"></div><div data-step="4" style="display:none"></div><div data-step="5" style="display:none"></div>
<div data-step="6" style="display:none"></div><div data-step="7" style="display:none"></div><div data-step="8" style="display:none"></div><div data-step="9" style="display:none"></div><div data-step="10" style="display:none"></div>
<script>
document.addEventListener("DOMContentLoaded", () => {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.getElementById("fig");
  const mk = (t, a, p) => { const n = document.createElementNS(NS, t); for (const k in a) n.setAttribute(k, a[k]); (p || svg).appendChild(n); return n; };
  const MF = "'Cambria Math','STIX Two Math',Georgia,'Microsoft YaHei',serif";
  const tx = (p, x, y, s, o) => { o = o || {}; const n = mk("text", { x, y, "font-size": o.fs || 20, "text-anchor": o.an || "middle", fill: o.fill || "#1B3B8B", "font-weight": o.b ? 700 : 400, "font-family": MF }, p); n.textContent = s; if (o.halo) n.setAttribute("style", "paint-order:stroke;stroke:#FFF;stroke-width:5;stroke-linejoin:round"); return n; };
  const W = 880, H = 620, L = 78, R = 30, T = 24, B = 60;
  const tMax = 10, yMax = 1.3;
  const X = t => L + t / tMax * (W - L - R), Y = y => T + (yMax - y) / yMax * (H - T - B);
  const defs = mk("defs", {});
  const mm = mk("marker", { id: "rqa", markerWidth: 10, markerHeight: 8, refX: 7, refY: 3, orient: "auto" }, defs);
  mk("path", { d: "M0,0 L7,3 L0,6 Z", fill: "#5B6B8C" }, mm);
  mk("line", { x1: L, y1: Y(0), x2: W - 14, y2: Y(0), stroke: "#5B6B8C", "stroke-width": 1.6, "marker-end": "url(#rqa)" });
  mk("line", { x1: L, y1: Y(0), x2: L, y2: T - 10, stroke: "#5B6B8C", "stroke-width": 1.6, "marker-end": "url(#rqa)" });
  tx(svg, W - 12, Y(0) + 30, "t/s", { fs: 21, b: 1, fill: "#5B6B8C", an: "start" });
  tx(svg, L - 12, T + 2, "h(t)", { fs: 21, b: 1, fill: "#5B6B8C", an: "start" });
  [0.5, 1.0].forEach(v => { mk("line", { x1: L, y1: Y(v), x2: W - R, y2: Y(v), stroke: "#E4EAF7", "stroke-width": 1 }); tx(svg, L - 10, Y(v) + 7, String(v), { fs: 19, fill: "#5B6B8C", an: "end" }); });
  mk("line", { x1: L, y1: Y(1), x2: W - R, y2: Y(1), stroke: "#8A97B5", "stroke-width": 1.4, "stroke-dasharray": "8 6" });
  tx(svg, W - R - 6, Y(1) - 10, "稳态值 1", { fs: 19, fill: "#8A97B5", an: "end" });
  const ha = t => 1 + 1.06 * Math.exp(-0.5 * t) * Math.sin(0.866 * t - 70.7 * Math.PI / 180);
  const hb = t => 1 - 1.15 * Math.exp(-0.5 * t) * Math.sin(0.866 * t + 60 * Math.PI / 180);
  const gA = mk("g", {}, svg), gB = mk("g", {}, svg);
  function drawCurve(g, f, color) {
    let d = "";
    for (let i = 0; i <= 300; i++) { const t = tMax * i / 300; d += (i ? "L" : "M") + X(t).toFixed(1) + "," + Y(f(t)).toFixed(1); }
    mk("path", { d, fill: "none", stroke: color, "stroke-width": 3.6 }, g);
  }
  const TOTAL = 10;
  function paint(K) {
    gA.innerHTML = ""; gB.innerHTML = "";
    const tK = tMax * K / TOTAL;
    // 底轨（淡）
    [[ha, "#C9D6F2"], [hb, "#C9D6F2"]].forEach(([f]) => { let d = ""; for (let i = 0; i <= 300; i++) { const t = tMax * i / 300; d += (i ? "L" : "M") + X(t).toFixed(1) + "," + Y(f(t)).toFixed(1); } mk("path", { d, fill: "none", stroke: "#E7EDF9", "stroke-width": 3 }, K > 0 && K < TOTAL ? gA : gA); });
    // 曲线到 tK
    [[ha, "#2563eb", "(a) PD 前向（有零点）"], [hb, "#dc2626", "(b) 速度反馈（无零点）"]].forEach(([f, c]) => {
      let d = "";
      const n = Math.max(2, Math.floor(300 * K / TOTAL));
      for (let i = 0; i <= n; i++) { const t = tMax * i / 300; d += (i ? "L" : "M") + X(t).toFixed(1) + "," + Y(f(t)).toFixed(1); }
      mk("path", { d, fill: "none", stroke: c, "stroke-width": 3.8 }, gA);
    });
    if (K >= 2) tx(gA, X(2.63) + 10, Y(1.246) - 12, "(a) σ%=24.6%, t_p=2.63", { fs: 20, b: 1, fill: "#2563eb", an: "start", halo: 1 });
    if (K >= 5) tx(gA, X(3.63) + 14, Y(1.163) + 34, "(b) σ%=16.3%, t_p=3.63", { fs: 20, b: 1, fill: "#dc2626", an: "start", halo: 1 });
  }
  RL.wire(TOTAL, paint, { dur: 9000 });
});
</script>
""" + foot()))

# ---------------- P65 例5-15 主导极点近似 ----------------
PAGES.append(dict(file="p65-ex515.html", title="主导极点高阶近似（例5-15）", cx="L1", scripts='<script src="../data/ex515.js"></script>\n', html=
head("例5-15：闭环主导极点与高阶系统近似", pageattr=' data-page="__PAGENO__"', extra_css="""
  .row { display:flex; gap:24px; height:100%; min-height:0; }
  .c { flex:1.08; display:flex; flex-direction:column; min-height:0; }
  .c .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:8px; }
  .figc { flex:1; display:flex; flex-direction:column; overflow:hidden; }
  .figc .bd2 { flex:1; display:grid; place-items:center; background:#fff; padding:6px 8px; min-height:0; }
  .figc svg { width:100%; height:100%; }
  .seg { background:var(--sky); border-radius:12px; padding:8px 14px; font-size:19.5px; line-height:1.5; }
  .err { background:#FDF1EF; border:2px solid #D63A2F; border-radius:12px; padding:9px 14px; font-size:18.5px; line-height:1.5; color:#7A2620; }
""") + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">例 5-15：三阶系统的二阶近似</div>
      <div class="bd">
        <div class="mathbox math eqline tex tex-d" style="font-size:20px;">\varPhi(s)=\dfrac{2.7}{s^{3}+5s^{2}+4s+2.7}</div>
        <div class="seg" style="font-size:19px;">闭环极点：−4.201、−0.400±j0.695 → ζ≈0.5、ωₙ≈0.80。</div>
        <div class="seg" style="font-size:19px;">远极点检验：<span class="tex">|s_3|/(\zeta\omega_n)=4.2/0.4=10.5&gt;5</span> → −4.2 极点影响可忽略。</div>
        <div class="seg" style="font-size:19px;">二阶近似：<span class="tex">\varPhi_2(s)\approx\dfrac{0.64}{s^{2}+0.8s+0.64}</span>（增益按 K(0)=1 配）。</div>
        <div class="seg" style="font-size:18.5px;">指标对比：三阶 σ%=16%, t_r=3.2, t_p=4.6, t_s=10 ↔ 二阶 σ%=16.3%, t_p=4.55, t_s(2%)≈10.4 —— <span class="kw-r">基本一致</span>。</div>
        <div class="err"><b>原素材勘误：</b>原书 p89 印刷 Φ(s)=7.2/(s³+5s²+4s+7.2)，但其极点 −4.2、−0.4±j0.69 及后续全部演算对应常数项 2.7（7.2 版极点为 −4.47、−0.27±j1.24，两组数据互相矛盾）。本页采用与原书演算自洽的 2.7 版，特此说明。</div>
      </div>
    </div>
    <div class="figc">
      <div class="act-card" style="height:100%; display:flex; flex-direction:column; overflow:hidden;">
        <div class="hd">阶跃响应：三阶（蓝）vs 二阶近似（红）</div>
        <div class="bd2"><svg id="fig" viewBox="0 0 880 560"></svg></div>
      </div>
    </div>
  </div>
</div>
""" + note("方法", "闭环主导极点 = 离虚轴最近、附近无零点、其余极点与零点足够远——满足时高阶系统<span class=\"kw-r\">可按二阶估算</span>。") + r"""
<script>
document.addEventListener("DOMContentLoaded", () => {
  const D = RL.data.ex515, R3 = D.resp3;
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.getElementById("fig");
  const mk = (t, a, p) => { const n = document.createElementNS(NS, t); for (const k in a) n.setAttribute(k, a[k]); (p || svg).appendChild(n); return n; };
  const MF = "'Cambria Math','STIX Two Math',Georgia,'Microsoft YaHei',serif";
  const tx = (p, x, y, s, o) => { o = o || {}; const n = mk("text", { x, y, "font-size": o.fs || 20, "text-anchor": o.an || "middle", fill: o.fill || "#1B3B8B", "font-weight": o.b ? 700 : 400, "font-family": MF }, p); n.textContent = s; if (o.halo) n.setAttribute("style", "paint-order:stroke;stroke:#FFF;stroke-width:5;stroke-linejoin:round"); return n; };
  const W = 880, H = 560, L = 74, Rp = 28, T = 22, B = 56;
  const tMax = 12, yMax = 1.35;
  const X = t => L + t / tMax * (W - L - Rp), Y = y => T + (yMax - y) / yMax * (H - T - B);
  const defs = mk("defs", {});
  const mm = mk("marker", { id: "q5a", markerWidth: 10, markerHeight: 8, refX: 7, refY: 3, orient: "auto" }, defs);
  mk("path", { d: "M0,0 L7,3 L0,6 Z", fill: "#5B6B8C" }, mm);
  mk("line", { x1: L, y1: Y(0), x2: W - 12, y2: Y(0), stroke: "#5B6B8C", "stroke-width": 1.6, "marker-end": "url(#q5a)" });
  mk("line", { x1: L, y1: Y(0), x2: L, y2: T - 8, stroke: "#5B6B8C", "stroke-width": 1.6, "marker-end": "url(#q5a)" });
  tx(svg, W - 10, Y(0) + 28, "t/s", { fs: 20, b: 1, fill: "#5B6B8C", an: "start" });
  tx(svg, L - 10, T + 4, "h(t)", { fs: 20, b: 1, fill: "#5B6B8C", an: "start" });
  mk("line", { x1: L, y1: Y(1), x2: W - Rp, y2: Y(1), stroke: "#8A97B5", "stroke-width": 1.4, "stroke-dasharray": "8 6" });
  const c3 = t => 1 + R3.A * Math.exp(R3.p3 * t) + Math.exp(R3.sig * t) * (R3.B * Math.cos(R3.w * t) + R3.C * Math.sin(R3.w * t));
  const c2 = t => 1 - Math.exp(R3.sig * t) * (Math.cos(R3.w * t) + 0.5749 * Math.sin(R3.w * t));
  function curve(f, color, w) { let d = ""; for (let i = 0; i <= 360; i++) { const t = tMax * i / 360; d += (i ? "L" : "M") + X(t).toFixed(1) + "," + Y(f(t)).toFixed(1); } mk("path", { d, fill: "none", stroke: color, "stroke-width": w }); }
  curve(c3, "#2563eb", 3.8); curve(c2, "#dc2626", 3);
  tx(svg, X(4.6), Y(1.24), "三阶（σ%=16%）", { fs: 20, b: 1, fill: "#2563eb", halo: 1 });
  tx(svg, X(6.8), Y(1.06), "二阶近似（σ%=16.3%）", { fs: 20, b: 1, fill: "#dc2626", halo: 1 });
});
</script>
""" + foot()))

# ---------------- P66 例5-16 五情形动画 ----------------
PAGES.append(dict(file="p66-ex516.html", title="开环零点的影响（例5-16）", cx="L2", scripts='<script src="../data/ex516.js"></script>\n', html=
head("例5-16：开环零点位置如何改造根轨迹（分步切换）", pageattr=' data-page="__PAGENO__"', extra_css=ANIM_CSS + """
  .tabs { display:flex; gap:8px; flex-wrap:wrap; }
  .tab { border:2px solid var(--line); background:#fff; border-radius:10px; padding:6px 13px; font-size:17.5px; font-weight:700; color:var(--navy); cursor:pointer; }
  .tab.on { background:var(--navy); color:#fff; border-color:var(--navy); }
""") + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card figc">
      <div class="hd"><span style="flex:1">G(s)H(s)=K₁(s+b)/[s²(s+a)]，取 a=1：零点 b 逐步右移</span><span class="tabs" id="tabs"></span></div>
      <div class="bd2" id="stage" style="position:relative;"></div>
      <div class="ctl">
        <button class="btn" id="play">▶ 播放</button>
        <button class="btn ghost" onclick="ACT.step.reset()">↺ 重置</button>
        <span class="prog" id="prog">0 / 5</span>
      </div>
    </div>
    <div class="side">
      <div class="act-card">
        <div class="hd">五种情形（原书 p95-99）</div>
        <div class="bd" style="font-size:18.5px;">
          <div class="kv" id="d0">(1) b→∞（无有限零点）：σ_a=−a/3，±60°,180° — 两支全在右半平面，<span class="kw-r">结构不稳定</span></div>
          <div class="kv" id="d1">(2) b&gt;a：σ_a=(b−a)/2&gt;0，±90° — 渐近线在右半平面，<span class="kw-r">不稳定</span></div>
          <div class="kv" id="d2">(3) b=a：σ_a=0 — 轨迹沿虚轴，<span class="kw-r">临界稳定</span>（p=−a 与 z=−b 构成开环偶极子）</div>
          <div class="kv" id="d3">(4) b&lt;a：σ_a&lt;0，±90° — 渐近线在左半平面，<span class="kw-r">结构稳定</span></div>
          <div class="kv" id="d4">(5) b=0：无零点二阶系统 K₁/[s(s+a)] — <span class="kw-r">恒稳定</span></div>
        </div>
      </div>
    </div>
  </div>
</div>
""" + note("规律", "开环零点<span class=\"kw-r\">左移</span>轨迹：把复分支从右半平面「拉」回左半平面——零点离虚轴越近，作用越强。") + r"""
<div data-step="1" style="display:none"></div><div data-step="2" style="display:none"></div><div data-step="3" style="display:none"></div><div data-step="4" style="display:none"></div><div data-step="5" style="display:none"></div>
<script>
document.addEventListener("DOMContentLoaded", () => {
  const cases = RL.data.ex516.cases;
  const TAGS = ["(1) b→∞", "(2) b＞a", "(3) b＝a", "(4) b＜a", "(5) b＝0"];
  const stage = document.getElementById("stage");
  const tabs = document.getElementById("tabs");
  const apis = [];
  cases.forEach((c, i) => {
    RL.data["_e16_" + i] = c.d;
    const wrap = document.createElement("div");
    wrap.style.cssText = "position:absolute; inset:6px 8px; display:none;";
    wrap.id = "e16wrap" + i;
    stage.appendChild(wrap);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = "e16fig" + i;
    svg.style.width = "100%"; svg.style.height = "100%";
    wrap.appendChild(svg);
    const lab = document.createElement("div");
    lab.innerHTML = TAGS[i] + "　σ<sub>a</sub>=" + (c.d.sig_a === null ? "—" : c.d.sig_a) + "，夹角 " + c.d.ang_a.join(" / ");
    lab.style.cssText = "position:absolute; left:14px; top:8px; font:italic 700 20px 'Cambria Math','STIX Two Math',Georgia,'Microsoft YaHei',serif; color:#1D3FA0; background:rgba(255,255,255,.85); padding:2px 10px; border-radius:8px;";
    wrap.appendChild(lab);
  });
  cases.forEach((c, i) => {
    // fig.js 的 RL.figure 需要 svg 已有 id 且在 DOM 中
    const f = RL.figure("e16fig" + i, "_e16_" + i, { vw: 880, vh: 560, static: true, poleLabels: false });
    f.setProgress(1);
    apis.push(f);
    const tb = document.createElement("span");
    tb.className = "tab"; tb.textContent = TAGS[i];
    tb.onclick = () => { const S = ACT.step; while (S.cur < i + 1) S.next(); while (S.cur > i + 1) window.prev(); };
    tabs.appendChild(tb);
  });
  function paint(K) {
    cases.forEach((c, i) => { document.getElementById("e16wrap" + i).style.display = i === Math.max(0, Math.min(K, 5) - 1) ? "block" : "none"; });
    document.querySelectorAll(".tab").forEach((t, i) => t.classList.toggle("on", i === Math.max(0, Math.min(K, 5) - 1)));
    [0, 1, 2, 3, 4].forEach(i => { const d = document.getElementById("d" + i); if (d) d.style.background = i === Math.max(0, Math.min(K, 5) - 1) ? "#FDF3EC" : "var(--sky)"; });
  }
  RL.wire(5, paint, { dur: 7000 });
});
</script>
""" + foot()))

# ---------------- P67 三大规律 ----------------
PAGES.append(dict(file="p67-three-rules.html", title="零极点配置的三大规律", scripts='<script src="../data/p67.js"></script>\n', html=
head("开环零、极点配置的三大规律", pageattr=' data-page="__PAGENO__"', extra_css="""
  .row { display:flex; gap:24px; height:100%; min-height:0; }
  .c { flex:1; display:flex; flex-direction:column; min-height:0; }
  .c .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:9px; }
  .figc { flex:1.08; display:flex; flex-direction:column; overflow:hidden; }
  .figc .bd2 { flex:1; display:grid; place-items:center; background:#fff; padding:4px 6px; min-height:0; }
  .figc svg { width:100%; height:100%; }
  .seg { background:var(--sky); border-radius:12px; padding:9px 15px; font-size:19.5px; line-height:1.5; }
  .hl { background:#FDF3EC; border-radius:12px; padding:10px 15px; font-size:20px; line-height:1.55; }
""") + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">三大规律（设计段的"方向盘"）</div>
      <div class="bd">
        <div class="seg"><b>① 加开环零点</b> → 轨迹<span class="kw-r">左偏</span>，稳定度↑、动态性能↑；负实零点<span class="kw-r">离虚轴越近作用越大</span>（例5-16）。</div>
        <div class="seg"><b>② 加开环极点</b> → 轨迹<span class="kw-r">右偏</span>，稳定度↓、快速性变差；负实极点离虚轴越近作用越大。</div>
        <div class="seg"><b>③ 开环偶极子</b>（z_c、p_c 相近）→ <span class="kw-r">不影响轨迹形状与 K₁</span>，但改变开环放大系数：K_c = K·z_c/p_c，可在不动暂态的前提下改善稳态。</div>
        <div class="hl" style="font-size:19px;">例：取 z_c=−0.5、p_c=−0.05 → K_c = K×0.5/0.05 = <span class="kw-r">10K</span>（开环放大系数提高 10 倍，e_ss 降为 1/10）。</div>
      </div>
    </div>
    <div class="figc">
      <div class="act-card" style="height:100%; display:flex; flex-direction:column; overflow:hidden;">
        <div class="hd">加极点右偏（上：K₁/[s(s+1)]；下：K₁/[s(s+1)(s+2)]）</div>
        <div class="bd2"><svg id="fa"></svg></div>
        <div class="bd2"><svg id="fb"></svg></div>
      </div>
    </div>
  </div>
</div>
""" + note("来源", "①②正是第六章<span class=\"kw-r\">超前（PD 类）/ 滞后（PI 类）校正</span>改善性能的根轨迹机理。") + r"""
<script>
document.addEventListener("DOMContentLoaded", () => {
  RL.data.p67a = RL.data.p67.a;
  RL.data.p67b = RL.data.p67.b;
  RL.figure("fa", "p67a", { vw: 820, vh: 250, static: true, brkLabels: false });
  RL.figure("fb", "p67b", { vw: 820, vh: 250, static: true });
});
</script>
""" + foot()))

# ---------------- P68 小结+互动③ ----------------
PAGES.append(dict(file="p68-summary.html", title="本章小结+课堂互动③", cx="L2", html=
head("本章小结 + 课堂互动③", pageattr=' data-page="__PAGENO__"', extra_css="""
  .row { display:flex; gap:22px; height:100%; min-height:0; }
  .sum { flex:1; display:flex; flex-direction:column; min-height:0; }
  .sum .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:8px; font-size:19px; line-height:1.5; }
  .sum .seg { background:var(--sky); border-radius:10px; padding:8px 13px; }
""" + QUIZ_CSS) + r"""
<div class="act-body">
  <div class="row">
    <div class="act-card sum">
      <div class="hd">第五章知识地图</div>
      <div class="bd">
        <div class="seg"><b>根轨迹方程</b>：G(s)H(s)=−1 → 相角条件（画轨迹）+ 幅值条件（定 K₁）</div>
        <div class="seg"><b>七法则</b>：对称分支 → 起止 → 实轴段 → 渐近线 → 分离点 → 出射角 → 虚轴交点</div>
        <div class="seg"><b>广义</b>：参量（黄金法则 G*H*）· 零度（正反馈，奇→偶）· 非最小相位（先整形再判型）</div>
        <div class="seg"><b>分析</b>：试探+根和/根积定极点 → 主导极点降阶 → 零极点配置三规律（零左偏/极右偏/偶极子提 K）</div>
        <div class="seg" style="background:#FDF3EC;">下一章预告：这些规律正是<span class="kw-r">校正装置</span>（超前/滞后/PID）起作用的机理。</div>
      </div>
    </div>
    <div class="qcol">
      <span class="qtype">多选题　1 分</span>
      <div class="qz">
        <div class="qt">关于根轨迹分析法，以下说法<span style="color:var(--danger)">正确的</span>是？</div>
        <span class="stage-tip">请先作出判断</span>
        <div class="opts">
          <div class="opt" data-mark="1">A　闭环零点不随 K₁ 变化，由结构（前向零点+反馈极点）决定</div>
          <div class="opt" data-mark="0">B　同一根轨迹必对应同一闭环传函</div>
          <div class="opt" data-mark="1">C　条件稳定系统只在某段 K₁ 范围内稳定（如 0.2&lt;K₁&lt;0.75）</div>
          <div class="opt" data-mark="0">D　开环偶极子会显著改变根轨迹的形状</div>
        </div>
      </div>
      <div class="ans" data-step="2">
        <b>答案：A、C。</b>闭环零点由结构决定、不随 K₁ 变（A 对）；例5-14 表明同轨迹可有不同闭环传函与响应（B 错）；例5-12 即条件稳定（C 对）；开环偶极子<span class="kw-r">不改变轨迹形状</span>、只改开环放大系数（D 错）。
      </div>
    </div>
  </div>
</div>
""" + r"""
<script>
document.addEventListener("DOMContentLoaded", () => {
  const S = ACT.step, _n = S.next.bind(S), _r = S.reset.bind(S);
  function mark() {
    const on = S.cur >= 1;
    document.querySelectorAll(".opt").forEach(o => {
      o.classList.toggle("right", on && o.dataset.mark === "1");
      o.classList.toggle("wrong", on && o.dataset.mark === "0");
    });
  }
  S.next = function () { const d = _n(); mark(); return d; };
  S.reset = function () { _r(); mark(); };
  window.prev = function () { const n = Math.max(0, S.cur - 1); S.reset(); for (let i = 0; i < n; i++) S.next(); };
});
</script>
""" + foot()))
