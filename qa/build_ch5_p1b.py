# -*- coding: utf-8 -*-
"""第五章 P9-P15 页面定义（整改版）。"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_lib import head, foot, note, QUIZ_CSS

PAGES = []

DENSE_CSS = """
  .row { display:flex; gap:24px; height:100%; min-height:0; }
  .c { flex:1; display:flex; flex-direction:column; min-height:0; }
  .c > .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:12px; }
  .seg { background:var(--sky); border-radius:12px; padding:12px 18px; font-size:22.5px; line-height:1.6; }
  .hl { background:#FDF3EC; border-radius:12px; padding:12px 18px; font-size:23px; line-height:1.6; }
"""

ANIM_CSS = DENSE_CSS + """
  .figc { flex:1.34; display:flex; flex-direction:column; overflow:hidden; }
  .figc .bd2 { flex:1; display:grid; place-items:center; background:#fff; padding:6px 10px; min-height:0; }
  .figc svg { width:100%; height:100%; }
  .ctl { display:flex; align-items:center; gap:12px; justify-content:center; padding:6px 0 8px; }
  .btn { background:var(--blue); color:#fff; border:none; border-radius:10px; font-size:19px; font-weight:700; padding:8px 22px; cursor:pointer; }
  .btn.ghost { background:#fff; color:var(--blue); border:2px solid var(--blue); }
  .prog { font-size:18px; color:var(--muted); min-width:64px; }
  .side { flex:1; display:flex; flex-direction:column; gap:14px; min-height:0; }
  .side .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:10px; }
  .kv { background:var(--sky); border-radius:12px; padding:12px 17px; font-size:21.5px; line-height:1.55; }
"""

# ---------------- P9 幅值/相角条件 ----------------
PAGES.append(dict(file="p09-conds.html", title="幅值条件与相角条件", html=
head("幅值条件与相角条件", pageattr=' data-page="__PAGENO__"', extra_css="""
  .row { display:flex; gap:24px; height:100%; min-height:0; }
  .c1 { flex:1.05; display:flex; flex-direction:column; min-height:0; }
  .c1 .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:10px; }
  .c2 { flex:1.12; display:flex; flex-direction:column; overflow:hidden; }
  .c2 .bd2 { flex:1; display:grid; place-items:center; background:#fff; padding:6px 8px; min-height:0; }
  .c2 svg { width:100%; height:100%; }
  .blk { background:var(--sky); border-radius:12px; padding:11px 16px; font-size:22px; line-height:1.55; }
  .blk b.t { color:var(--navy); }
""") + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c1">
      <div class="hd">两个条件（s 为根轨迹上的点）</div>
      <div class="bd">
        <div class="blk"><b class="t">幅值条件</b> —— 确定 K₁ 值：</div>
        <div class="mathbox math eqline tex tex-d" style="font-size:24px;">K_1=\dfrac{\prod\limits_{i=1}^{n}\left|s-p_i\right|}{\prod\limits_{j=1}^{m}\left|s-z_j\right|}</div>
        <div class="blk"><b class="t">相角条件</b> —— 判定 s 是否在轨迹上（q=0,1,2,…）：</div>
        <div class="mathbox math eqline tex tex-d" style="font-size:23px;">\sum_{j=1}^{m}\angle(s-z_j)-\sum_{i=1}^{n}\angle(s-p_i)=(2q+1)\pi</div>
        <div class="blk" style="background:#FDF3EC;"><span class="kw-r">相角条件是绘制根轨迹的依据</span>（与 K₁ 无关）；幅值条件用来确定轨迹上各点对应的 K₁ 值。</div>
      </div>
    </div>
    <div class="act-card c2">
      <div class="hd">几何意义：从零、极点向 s 引向量</div>
      <div class="bd2"><svg id="fig" viewBox="0 0 880 640"></svg></div>
    </div>
  </div>
</div>
""" + note("几何意义", "∠(s−z_j) 是<span class=\"kw-r\">零点指向 s</span> 的向量相角：所有零点向量相角之和减去所有极点向量相角之和 = 奇数倍 180°。") + r"""
<script>
document.addEventListener("DOMContentLoaded", () => {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.getElementById("fig");
  const mk = (t, a, p) => { const n = document.createElementNS(NS, t); for (const k in a) n.setAttribute(k, a[k]); (p || svg).appendChild(n); return n; };
  const MF = "'Cambria Math','STIX Two Math',Georgia,'Microsoft YaHei',serif";
  const tx = (p, x, y, s, o) => { o = o || {}; const n = mk("text", { x, y, "font-size": o.fs || 23, "text-anchor": o.an || "middle", fill: o.fill || "#1B3B8B", "font-weight": o.b ? 700 : 400, "font-style": o.it ? "italic" : "normal", "font-family": MF }, p); n.textContent = s; return n; };
  const defs = mk("defs", {});
  const mkM = (id, c) => { const m = mk("marker", { id, markerWidth: 10, markerHeight: 8, refX: 7, refY: 3, orient: "auto" }, defs); mk("path", { d: "M0,0 L7,3 L0,6 Z", fill: c }, m); };
  mkM("ga", "#2B5CE6"); mkM("gb", "#16a34a"); mkM("gc", "#9333ea"); mkM("gd", "#5B6B8C");
  const X0 = 600, Y0 = 330, SC = 66;
  const P = w => [X0 + w * SC, Y0];
  const sPt = [X0, Y0 - 268];
  mk("line", { x1: 56, y1: Y0, x2: 840, y2: Y0, stroke: "#5B6B8C", "stroke-width": 1.6, "marker-end": "url(#gd)" });
  mk("line", { x1: X0, y1: Y0 + 10, x2: X0, y2: 52, stroke: "#5B6B8C", "stroke-width": 1.6, "marker-end": "url(#gd)" });
  tx(svg, 850, Y0 + 30, "σ", { fs: 24, it: 1, b: 1, fill: "#5B6B8C", an: "start" });
  tx(svg, X0 + 18, 58, "jω", { fs: 24, it: 1, b: 1, fill: "#5B6B8C", an: "start" });
  [[0, "p_1"], [-2, "p_2"]].forEach(([w, lab], i) => { const [x, y] = P(w); mk("line", { x1: x - 9, y1: y - 9, x2: x + 9, y2: y + 9, stroke: "#16324f", "stroke-width": 3.6, "stroke-linecap": "round" }); mk("line", { x1: x - 9, y1: y + 9, x2: x + 9, y2: y - 9, stroke: "#16324f", "stroke-width": 3.6, "stroke-linecap": "round" }); tx(svg, x, y + 36, lab, { fs: 22, b: 1, fill: "#16324f" }); });
  { const [x, y] = P(-4); mk("circle", { cx: x, cy: y, r: 8.5, fill: "#fff", stroke: "#16324f", "stroke-width": 3.4 }); tx(svg, x, y - 22, "z_1", { fs: 22, b: 1, fill: "#16324f" }); }
  function vec(w, color, id, lab, off) {
    const [x0, y0] = P(w);
    mk("line", { x1: x0, y1: y0, x2: sPt[0], y2: sPt[1], stroke: color, "stroke-width": 3.2, "marker-end": `url(#${id})` });
    const mx = (x0 + sPt[0]) / 2, my = (y0 + sPt[1]) / 2;
    tx(svg, mx + (off ? off[0] : 0), my + (off ? off[1] : -12), lab, { fs: 22, b: 1, fill: color });
  }
  vec(0, "#2B5CE6", "ga", "s−p_1");
  vec(-2, "#16a34a", "gb", "s−p_2", [50, 4]);
  vec(-4, "#9333ea", "gc", "s−z_1", [50, 4]);
  mk("circle", { cx: sPt[0], cy: sPt[1], r: 9.5, fill: "#D63A2F" });
  tx(svg, sPt[0] + 32, sPt[1] - 8, "s", { fs: 26, it: 1, b: 1, fill: "#D63A2F", an: "start" });
  tx(svg, 440, 600, "相角条件：∠(s−z₁) − ∠(s−p₁) − ∠(s−p₂) = (2q+1)·180°", { fs: 24, b: 1 });
});
</script>
""" + foot()))

# ---------------- P10 例5-1①（向量分步揭示） ----------------
PAGES.append(dict(file="p10-ex51a.html", title="例5-1①：试验点验证", cx="L1", html=
head("例5-1①：试验点验证（分步作图）", pageattr=' data-page="__PAGENO__"', extra_css="""
  .row { display:flex; gap:24px; height:100%; min-height:0; }
  .c1 { flex:1.05; display:flex; flex-direction:column; min-height:0; }
  .c1 .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:10px; }
  .c2 { flex:1.1; display:flex; flex-direction:column; overflow:hidden; }
  .c2 .bd2 { flex:1; display:grid; place-items:center; background:#fff; padding:6px 10px; min-height:0; }
  .c2 svg { width:100%; height:100%; }
  .seg { background:var(--sky); border-radius:12px; padding:11px 16px; font-size:22px; line-height:1.55; }
  .ctl { display:flex; align-items:center; gap:12px; padding:6px 0 0; }
  .btn { background:var(--blue); color:#fff; border:none; border-radius:10px; font-size:18px; font-weight:700; padding:7px 20px; cursor:pointer; }
  .btn.ghost { background:#fff; color:var(--blue); border:2px solid var(--blue); }
  .prog { font-size:18px; color:var(--muted); min-width:56px; }
""") + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c1">
      <div class="hd">例 5-1：试验点 s₁ 在根轨迹上吗？</div>
      <div class="bd">
        <div style="font-size:22.5px;">单位反馈系统开环传递函数：</div>
        <div class="mathbox math eqline tex tex-d" style="font-size:23px;">G(s)=\dfrac{K_1(s+4)}{s(s+2)(s+6.6)}</div>
        <div class="seg" style="font-size:21.5px;">开环极点：<span class="tex">p_1=0,\ p_2=-2,\ p_3=-6.6</span>；开环零点：<span class="tex">z_1=-4</span>。</div>
        <div class="seg" style="font-size:21.5px;">取试验点 <span class="tex">s_1\approx-1.5+\mathrm{j}2.55</span>，从各零、极点向 s₁ 引向量（右图分步）。</div>
        <div class="ctl" style="justify-content:center;">
          <button class="btn" id="play">▶ 播放</button>
          <button class="btn ghost" onclick="ACT.step.reset()">↺ 重置</button>
          <span class="prog" id="prog">0 / 3</span>
        </div>
      </div>
    </div>
    <div class="act-card c2">
      <div class="hd">零极点分布与试验点（分步：落位 → 向量 → 角度）</div>
      <div class="bd2"><svg id="fig" viewBox="0 0 880 640"></svg></div>
    </div>
  </div>
</div>
""" + note("下一步", "把量得的相角代入<span class=\"kw-r\">相角条件</span>验算——见下一页。") + r"""
<div data-step="1" style="display:none"></div><div data-step="2" style="display:none"></div><div data-step="3" style="display:none"></div>
<script>
document.addEventListener("DOMContentLoaded", () => {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.getElementById("fig");
  const mk = (t, a, p) => { const n = document.createElementNS(NS, t); for (const k in a) n.setAttribute(k, a[k]); (p || svg).appendChild(n); return n; };
  const MF = "'Cambria Math','STIX Two Math',Georgia,'Microsoft YaHei',serif";
  const tx = (p, x, y, s, o) => { o = o || {}; const n = mk("text", { x, y, "font-size": o.fs || 21, "text-anchor": o.an || "middle", fill: o.fill || "#1B3B8B", "font-weight": o.b ? 700 : 400, "font-family": MF }, p); n.textContent = s; if (o.halo) n.setAttribute("style", "paint-order:stroke;stroke:#FFF;stroke-width:5;stroke-linejoin:round"); return n; };
  const defs = mk("defs", {});
  const mkM = (id, c) => { const m = mk("marker", { id, markerWidth: 10, markerHeight: 8, refX: 7, refY: 3, orient: "auto" }, defs); mk("path", { d: "M0,0 L7,3 L0,6 Z", fill: c }, m); };
  mkM("va", "#2B5CE6"); mkM("vb", "#16a34a"); mkM("vc", "#dc2626"); mkM("vd", "#9333ea"); mkM("ge", "#5B6B8C");
  const vw = 880, vh = 640, pl = 46, pr = 24, pt = 16, pb = 46;
  const xr = [-8.5, 2.5], yr = [-3.2, 6.2];
  const s0 = Math.min((vw - pl - pr) / (xr[1] - xr[0]), (vh - pt - pb) / (yr[1] - yr[0]));
  const ox = pl + ((vw - pl - pr) - (xr[1] - xr[0]) * s0) / 2, oy = pt + ((vh - pt - pb) - (yr[1] - yr[0]) * s0) / 2;
  const X = x => ox + (x - xr[0]) * s0, Y = y => oy + (yr[1] - y) * s0;
  mk("line", { x1: X(xr[0]) - 4, y1: Y(0), x2: X(xr[1]) + 12, y2: Y(0), stroke: "#5B6B8C", "stroke-width": 1.5, "marker-end": "url(#ge)" });
  mk("line", { x1: X(0), y1: Y(yr[0]) + 4, x2: X(0), y2: Y(yr[1]) - 10, stroke: "#5B6B8C", "stroke-width": 1.5, "marker-end": "url(#ge)" });
  tx(svg, X(xr[1]) + 18, Y(0) + 6, "σ", { fs: 23, it: 1, b: 1, fill: "#5B6B8C", an: "start" });
  tx(svg, X(0) + 10, Y(yr[1]) - 4, "j", { fs: 23, it: 1, b: 1, fill: "#5B6B8C", an: "start" });
  [[-8, "-8"], [-4, "-4"], [-2, "-2"], [0, "0"]].forEach(([v, t]) => { tx(svg, X(v), Y(0) + 26, t, { fs: 19, fill: "#5B6B8C" }); mk("line", { x1: X(v), y1: Y(0) - 4, x2: X(v), y2: Y(0) + 4, stroke: "#5B6B8C", "stroke-width": 1.3 }); });
  [[0, "p_1", 30], [-2, "p_2", 34], [-6.6, "p_3", 30]].forEach(([w, lab, dy]) => {
    const x = X(w), y = Y(0);
    mk("line", { x1: x - 8, y1: y - 8, x2: x + 8, y2: y + 8, stroke: "#16324f", "stroke-width": 3.4, "stroke-linecap": "round" });
    mk("line", { x1: x - 8, y1: y + 8, x2: x + 8, y2: y - 8, stroke: "#16324f", "stroke-width": 3.4, "stroke-linecap": "round" });
    tx(svg, x, y + dy, lab, { fs: 20, b: 1, fill: "#16324f" });
  });
  mk("circle", { cx: X(-4), cy: Y(0), r: 7, fill: "#fff", stroke: "#16324f", "stroke-width": 3.2 });
  tx(svg, X(-4), Y(0) + 50, "z_1", { fs: 20, b: 1, fill: "#16324f" });
  const sx = X(-1.5), sy = Y(2.55);
  const gVec = mk("g", { "data-step": "2" }, svg);
  [[0, "#2B5CE6", "va"], [-2, "#16a34a", "vb"], [-6.6, "#dc2626", "vc"], [-4, "#9333ea", "vd"]].forEach(([w, c, id]) => {
    mk("line", { x1: X(w), y1: Y(0), x2: sx, y2: sy, stroke: c, "stroke-width": 2.6, "marker-end": `url(#${id})` }, gVec);
  });
  const gLab = mk("g", { "data-step": "3" }, svg);
  mk("circle", { cx: sx, cy: sy, r: 8, fill: "#D63A2F" }, gLab);
  tx(gLab, sx + 8, sy - 16, "s_1", { fs: 22, it: 1, b: 1, fill: "#D63A2F", an: "start", halo: 1 });
  tx(gLab, X(-5.5), Y(1.2), "45°", { fs: 20, b: 1, fill: "#9333ea", halo: 1 });
  tx(gLab, X(-0.62), Y(1.2), "120°", { fs: 20, b: 1, fill: "#2B5CE6", halo: 1 });
  tx(gLab, X(-2.0), Y(1.0), "79°", { fs: 20, b: 1, fill: "#16a34a", halo: 1 });
  tx(gLab, X(-5.6), Y(2.1), "26°", { fs: 20, b: 1, fill: "#dc2626", halo: 1 });
  const S = ACT.step, _n = S.next.bind(S), _r = S.reset.bind(S);
  let K = 0, playing = false;
  function paint(k) {
    document.getElementById("prog").textContent = k + " / 3";
  }
  S.next = function () { if (K < 3) K++; const dd = _n(); paint(K); return dd; };
  S.reset = function () { K = 0; playing = false; _r(); paint(K); };
  window.prev = function () { if (K <= 0) return; const t = K - 1; S.reset(); for (let i = 0; i < t; i++) S.next(); };
  document.getElementById("play").onclick = function () {
    if (playing) return; playing = true; S.reset();
    const t0 = performance.now(), DUR = 5000;
    (function fr(ts) { if (!playing) return; const f = Math.min(1, (ts - t0) / DUR); const k = Math.min(3, Math.floor(f * 3)); if (k > K) { K = k; const dd = _n(); paint(K); } if (f < 1) requestAnimationFrame(fr); else playing = false; })(t0);
  };
});
</script>
""" + foot()))

# ---------------- P11 例5-1② ----------------
PAGES.append(dict(file="p11-ex51b.html", title="例5-1②：相角与幅值计算", html=
head("例5-1②：相角与幅值计算", pageattr=' data-page="__PAGENO__"', extra_css="""
  .colv { display:flex; flex-direction:column; gap:16px; height:100%; min-height:0; }
  .duo { flex:1; display:flex; gap:20px; min-height:0; }
  .blk { flex:1; display:flex; flex-direction:column; min-height:0; }
  .blk .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:10px; }
  .calc { background:var(--sky); border-radius:12px; padding:11px 16px; font-size:22px; line-height:1.55; font-family:var(--font-math); }
  .calc .lab { color:var(--navy); font-weight:700; font-family:var(--font); }
  .judge { flex:none; background:#FDF3EC; border:2px solid var(--orange); border-radius:14px; padding:14px 20px; font-size:24px; line-height:1.6; text-align:center; }
""") + r"""
<div class="act-body has-note">
  <div class="colv">
    <div class="duo">
      <div class="act-card blk">
        <div class="hd">① 相角条件验证（判断「在不在」）</div>
        <div class="bd">
          <div class="calc"><span class="lab">零点向量</span>　∠(s₁−z₁) = <b>45°</b></div>
          <div class="calc"><span class="lab">极点向量</span>　∠(s₁−p₁) = <b>120°</b>，∠(s₁−p₂) = <b>79°</b>，∠(s₁−p₃) = <b>26°</b></div>
          <div class="calc"><span class="lab">代入</span>　45° − 120° − 79° − 26° = <b style="color:var(--danger);">−180°</b></div>
          <div class="calc"><span class="lab">结论</span>　= (2q+1)·180°（q=−1）→ <b>相角条件成立</b></div>
        </div>
      </div>
      <div class="act-card blk">
        <div class="hd">② 幅值条件求 K₁（确定「K 是多少」）</div>
        <div class="bd">
          <div class="calc"><span class="lab">量得长度</span>　|s₁−p₁|=2.9，|s₁−p₂|=2.6，|s₁−p₃|=5.8，|s₁−z₁|=3.6</div>
          <div class="calc"><span class="lab">代入</span>　K₁ = (2.9×2.6×5.8) / 3.6 = 43.53 / 3.6</div>
          <div class="calc"><span class="lab">结果</span>　K₁ ≈ <b style="color:var(--danger);">12.15</b></div>
          <div class="calc"><span class="lab">含义</span>　幅值条件 = 各极点向量长度之积 ÷ 各零点向量长度之积</div>
          <div class="calc"><span class="lab">几何</span>　从 s 平面上量 4 个向量长度即可，右图（P10）已画出</div>
        </div>
      </div>
    </div>
    <div class="judge">满足相角条件（奇数倍 180°）→ <span class="kw-r">s₁ 确实是根轨迹上的一点</span>；且当 K₁ ≈ 12.15 时，系统的一个闭环极点恰好位于 s₁。</div>
  </div>
</div>
""" + note("方法小结", "<span class=\"kw-r\">相角条件定「在不在」</span>（是否在根轨迹上），<span class=\"kw-r\">幅值条件定「K₁ 是多少」</span>——两问两答，是根轨迹法最基本的操作。") + foot()))

# ---------------- P12 课堂互动① ----------------
PAGES.append(dict(file="p12-quiz1.html", title="课堂互动①", cx="L2", html=
head("课堂互动①", pageattr=' data-page="__PAGENO__"', extra_css=QUIZ_CSS + """
  .recap .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:10px; font-size:21.5px; line-height:1.6; }
""") + r"""
<div class="act-body">
  <div class="row">
    <div class="qcol" style="flex:1.25;">
      <span class="qtype">多选题　1 分</span>
      <div class="qz">
        <div class="qt">关于根轨迹方程与绘制依据，以下说法<span style="color:var(--danger)">正确的</span>是？</div>
        <span class="stage-tip">请先作出判断</span>
        <div class="opts">
          <div class="opt" data-mark="1">A　根轨迹是闭环特征根随根轨迹增益 K₁ 变化的轨迹</div>
          <div class="opt" data-mark="0">B　绘制根轨迹时，幅值条件是首要依据</div>
          <div class="opt" data-mark="1">C　相角条件与 K₁ 无关，是判定某点是否在根轨迹上的依据</div>
          <div class="opt" data-mark="0">D　根轨迹上的点对应的 K₁ 只能由特征方程求得</div>
          <div class="opt" data-mark="1">E　K₁ 变化时，闭环极点在根轨迹上连续移动</div>
          <div class="opt" data-mark="0">F　根轨迹只在左半 s 平面内绘制</div>
        </div>
      </div>
      <div class="ans" data-step="2">
        <b>答案：A、C、E。</b>根轨迹正是闭环特征根随 K₁ 从 0→∞ 移动的轨迹（A 对，E 对——极点沿轨迹连续移动）；绘制时<span class="kw-r">相角条件是依据</span>，幅值条件只用来确定轨迹上各点的 K₁ 值（B、D、F 错——右半平面的轨迹照画，稳定性由轨迹位置判断）。
      </div>
    </div>
    <div class="act-card recap" style="flex:1; display:flex; flex-direction:column; min-height:0;">
      <div class="hd">速判卡</div>
      <div class="bd">
        <div>① 根轨迹方程：<span class="tex">G(s)H(s)=-1</span></div>
        <div>② 相角条件 = 奇数倍 180°（<span class="kw-r">画形</span>的依据）</div>
        <div>③ 幅值条件 → 反算 K₁（<span class="kw-r">定值</span>的依据）</div>
        <div>④ K₁ 是<span class="kw-r">根轨迹增益</span>，与开环放大系数 K 未必相等</div>
        <div style="background:var(--sky); border-radius:12px; padding:12px 18px;">速判：见到「首要依据」先想<span class="kw-r">相角</span>；见到「求 K₁」先想<span class="kw-r">幅值</span>。</div>
        <div style="background:#FDF3EC; border-radius:12px; padding:12px 18px;">下一步预告：相角条件怎么用？——下一页例 5-1 用试验点亲自算一遍。</div>
      </div>
    </div>
  </div>
</div>
""" + r"""
<div data-step="1" style="display:none"></div>
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

# ---------------- P13 法则1 ----------------
PAGES.append(dict(file="p13-rule1.html", title="法则1：对称性与分支数", html=
head("法则 1：根轨迹的对称性与分支数", pageattr=' data-page="__PAGENO__"', extra_css="""
  .row { display:flex; gap:24px; height:100%; min-height:0; }
  .c { flex:1; display:flex; flex-direction:column; min-height:0; }
  .c .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:11px; }
  .st { background:var(--sky); border-radius:14px; padding:13px 19px; font-size:22.5px; line-height:1.6; }
  .st b.r { color:var(--danger); }
  .figc { flex:1.05; display:flex; flex-direction:column; overflow:hidden; }
  .figc .bd2 { flex:1; display:grid; place-items:center; background:#fff; border:1.5px solid var(--line); border-radius:12px; padding:6px; min-height:0; }
  .figc svg { width:100%; height:100%; }
""") + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">法则 1</div>
      <div class="bd">
        <div class="st"><b>对称性：</b>根轨迹<span class="kw-r">对称于实轴</span>——实系数特征方程若有复根 s，其共轭 s̄ 也必是根。</div>
        <div class="st"><b>分支数：</b>根轨迹分支数 = <span class="kw-r">闭环极点数 = 开环极点数 n</span>（特征方程是 n 次的）。</div>
        <div style="font-size:22px; color:var(--muted);">分支：K₁ 从 0 → ∞ 时，一个闭环极点沿根轨迹走出的整条路径。</div>
      </div>
    </div>
    <div class="act-card c">
      <div class="hd">证明骨架（分支数 = n）</div>
      <div class="bd">
        <div style="font-size:22px;">闭环特征方程：</div>
        <div class="mathbox math eqline tex tex-d" style="font-size:22px;">D(s)=\prod\limits_{i=1}^{n}(s-p_i)+K_1\prod\limits_{j=1}^{m}(s-z_j)=0</div>
        <div style="font-size:22px;">K₁ 任意变化，D(s) 始终是 s 的 <b>n 次多项式</b> → n 个根；实系数 → 复根成对（共轭对称）。</div>
        <div style="font-size:22px;">另一理解：K₁ 每取一个值就有 n 个闭环极点 → n 条轨迹；K₁ 连续变 → n 条连续曲线。</div>
      </div>
    </div>
    <div class="act-card figc">
      <div class="hd">共轭对称示意（s 与 s̄ 成对出现）</div>
      <div class="bd2"><svg id="fig" viewBox="0 0 820 430"></svg></div>
    </div>
  </div>
</div>
""" + note("例", "引例 D(s)=s²+2s+K₁：n=2 → 两条分支；两支轨迹关于实轴镜像（上下对称）。") + r"""
<script>
document.addEventListener("DOMContentLoaded", () => {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.getElementById("fig");
  const mk = (t, a, p) => { const n = document.createElementNS(NS, t); for (const k in a) n.setAttribute(k, a[k]); (p || svg).appendChild(n); return n; };
  const MF = "'Cambria Math','STIX Two Math',Georgia,'Microsoft YaHei',serif";
  const tx = (p, x, y, s, o) => { o = o || {}; const n = mk("text", { x, y, "font-size": o.fs || 24, "text-anchor": o.an || "middle", fill: o.fill || "#1B3B8B", "font-weight": o.b ? 700 : 400, "font-family": MF }, p); n.textContent = s; return n; };
  const defs = mk("defs", {});
  const m = mk("marker", { id: "r1a", markerWidth: 10, markerHeight: 8, refX: 7, refY: 3, orient: "auto" }, defs);
  mk("path", { d: "M0,0 L7,3 L0,6 Z", fill: "#5B6B8C" }, m);
  const X = x => 410 + x * 95, Y = y => 215 - y * 88;
  mk("line", { x1: 40, y1: Y(0), x2: 790, y2: Y(0), stroke: "#5B6B8C", "stroke-width": 1.6, "marker-end": "url(#r1a)" });
  mk("line", { x1: X(0), y1: 380, x2: X(0), y2: 40, stroke: "#5B6B8C", "stroke-width": 1.6, "marker-end": "url(#r1a)" });
  tx(svg, 800, Y(0) + 28, "σ", { fs: 23, it: 1, b: 1, fill: "#5B6B8C", an: "start" });
  tx(svg, X(0) + 16, 46, "jω", { fs: 23, it: 1, b: 1, fill: "#5B6B8C", an: "start" });
  // 一对共轭闭环极点 -1±j1.2 与其实轴上的开环极点
  mk("line", { x1: X(0) - 9, y1: Y(0) - 9, x2: X(0) + 9, y2: Y(0) + 9, stroke: "#16324f", "stroke-width": 3.6, "stroke-linecap": "round" });
  mk("line", { x1: X(0) - 9, y1: Y(0) + 9, x2: X(0) + 9, y2: Y(0) - 9, stroke: "#16324f", "stroke-width": 3.6, "stroke-linecap": "round" });
  tx(svg, X(0) + 26, Y(0) + 8, "p", { fs: 22, b: 1, fill: "#16324f", an: "start" });
  mk("line", { x1: X(-1) - 9, y1: Y(1.2) - 9, x2: X(-1) + 9, y2: Y(1.2) + 9, stroke: "#2B5CE6", "stroke-width": 3.6, "stroke-linecap": "round" });
  mk("line", { x1: X(-1) - 9, y1: Y(1.2) + 9, x2: X(-1) + 9, y2: Y(1.2) - 9, stroke: "#2B5CE6", "stroke-width": 3.6, "stroke-linecap": "round" });
  tx(svg, X(-1) - 24, Y(1.2) + 8, "s", { fs: 22, b: 1, fill: "#2B5CE6" });
  mk("line", { x1: X(-1) - 9, y1: Y(-1.2) - 9, x2: X(-1) + 9, y2: Y(-1.2) + 9, stroke: "#2B5CE6", "stroke-width": 3.6, "stroke-linecap": "round" });
  mk("line", { x1: X(-1) - 9, y1: Y(-1.2) + 9, x2: X(-1) + 9, y2: Y(-1.2) - 9, stroke: "#2B5CE6", "stroke-width": 3.6, "stroke-linecap": "round" });
  tx(svg, X(-1) - 26, Y(-1.2) + 8, "s̄", { fs: 22, b: 1, fill: "#2B5CE6" });
  mk("line", { x1: X(-1), y1: Y(1.2) - 14, x2: X(-1), y2: Y(-1.2) + 14, stroke: "#D63A2F", "stroke-width": 2, "stroke-dasharray": "7 5" }, svg);
  tx(svg, X(-1) - 60, Y(0), "镜像", { fs: 22, b: 1, fill: "#D63A2F" });
  tx(svg, 410, 404, "实系数 D(s)：复根 s 与 s̄ 必成对 → 根轨迹上下对称", { fs: 23, b: 1 });
});
</script>
""" + foot()))

# ---------------- P14 法则2 ----------------
PAGES.append(dict(file="p14-rule2.html", title="法则2：起点与终点", html=
head("法则 2：根轨迹的起点与终点", pageattr=' data-page="__PAGENO__"', extra_css="""
  .colv { display:flex; flex-direction:column; gap:16px; height:100%; min-height:0; }
  .duo { flex:1; display:grid; grid-template-columns:1fr 1fr; gap:20px; min-height:0; }
  .blk .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:10px; }
  .st { background:var(--sky); border-radius:12px; padding:12px 17px; font-size:22.5px; line-height:1.6; }
  .st b.r { color:var(--danger); }
  .fm { background:#FDF3EC; border-radius:12px; padding:12px 17px; font-size:22px; line-height:1.6; }
  .tail { flex:none; display:flex; gap:16px; min-height:0; }
  .tail .st { flex:1; }
""") + r"""
<div class="act-body has-note">
  <div class="colv">
    <div class="duo">
      <div class="act-card blk">
        <div class="hd">起点（K₁ = 0）</div>
        <div class="bd">
          <div class="st">根轨迹<span class="kw-r">起始于开环极点</span>：K₁→0 时幅值条件右端→0，需 <span class="tex">s→p_i</span>。</div>
          <div class="mathbox math eqline tex tex-d" style="font-size:21.5px;">K_1=\dfrac{\prod\left|s-p_i\right|}{\prod\left|s-z_j\right|}=0\ \Leftrightarrow\ s=p_i</div>
        </div>
      </div>
      <div class="act-card blk">
        <div class="hd">终点（K₁ → ∞）</div>
        <div class="bd">
          <div class="st">其中 m 条<span class="kw-r">终止于开环有限零点</span>；其余 <span class="tex">n−m</span> 条<span class="kw-r">终止于无穷远处</span>。</div>
          <div class="mathbox math eqline tex tex-d" style="font-size:21.5px;">K_1\to\infty:\ s\to z_j\ \text{或}\ |s|\to\infty</div>
        </div>
      </div>
    </div>
    <div class="tail">
      <div class="st" style="background:#FDF3EC;">「无穷远的零点」：n&gt;m 时，把 K₁→∞ 的极限情形理解为存在 n−m 个无穷远零点——它们的方位就是下一页的<span class="kw-r">渐近线</span>。</div>
      <div class="st">对照引例：两条分支起于 p₁=0、p₂=−2（开环极点），n−m=2 条都趋于无穷——与 P6 动画完全一致。</div>
      <div class="fm">极限推导：K₁→∞ 时 <span class="tex">\prod|s-p_i|/\prod|s-z_j|	o\infty</span>，须 <span class="tex">|s|	o\infty</span> 或 <span class="tex">s	o z_j</span>；K₁→0 时须 <span class="tex">s	o p_i</span>。</div>
    </div>
  </div>
</div>
""" + note("守恒", "起点 n 个、终点也是 n 个（m 个有限零点 + n−m 个无穷远零点）——<span class=\"kw-r\">分支数守恒</span>。") + foot()))

# ---------------- P15 法则3（计数动画） ----------------
PAGES.append(dict(file="p15-rule3.html", title="法则3：实轴上的根轨迹", cx="L1", scripts='<script src="../data/law3.js"></script>\n', html=
head("法则 3：实轴上的根轨迹（逐区间计数动画）", pageattr=' data-page="__PAGENO__"', extra_css=ANIM_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card figc">
      <div class="hd"><span style="flex:1">从右向左逐区间计数（G=K₁(s+1)/[s(s+2)(s+4)]）</span></div>
      <div class="bd2"><svg id="fig"></svg></div>
      <div class="ctl">
        <button class="btn" id="play">▶ 播放</button>
        <button class="btn ghost" onclick="ACT.step.reset()">↺ 重置</button>
        <span class="prog" id="prog">0 / 8</span>
      </div>
    </div>
    <div class="side">
      <div class="act-card">
        <div class="hd">法则 3</div>
        <div class="bd">
          <div class="kv">实轴上某区段<span class="kw-r">右侧的开环实零点与实极点数目之和为奇数</span>，则该区段是根轨迹。</div>
          <div class="kv">共轭复零、极点不影响判断——一对共轭复零/极点对实轴上任意点的相角之和恒为 360°，相互抵消。</div>
        </div>
      </div>
      <div class="act-card">
        <div class="hd">计数过程（右 → 左）</div>
        <div class="bd" style="font-size:20px;">
          <div class="kv" id="c0">(0,+∞)：右侧 0 个 → 偶 ✗</div>
          <div class="kv" id="c1">(−1,0)：右侧 1 个 → 奇 ✓ 轨迹</div>
          <div class="kv" id="c2">(−2,−1)：右侧 2 个 → 偶 ✗</div>
          <div class="kv" id="c3">(−4,−2)：右侧 3 个 → 奇 ✓ 轨迹</div>
          <div class="kv" id="c4">(−∞,−4)：右侧 4 个 → 偶 ✗</div>
        </div>
      </div>
    </div>
  </div>
</div>
""" + note("理解", "实轴上的点只由实零、实极点决定方向：右侧计数为奇数，合相角才能凑出<span class=\"kw-r\">奇数个 180°</span>。") + r"""
<div data-step="1" style="display:none"></div><div data-step="2" style="display:none"></div><div data-step="3" style="display:none"></div><div data-step="4" style="display:none"></div>
<div data-step="5" style="display:none"></div><div data-step="6" style="display:none"></div><div data-step="7" style="display:none"></div><div data-step="8" style="display:none"></div>
<script>
document.addEventListener("DOMContentLoaded", () => {
  const F = RL.figure("fig", "law3", { vw: 900, vh: 560, arrows: false, segs: false });
  // 区间（右→左）：边界与计数
  const IVS = [
    { a: 0, b: 4.5, n: 0, ok: false, lab: "(0,+∞)：0 个 ✗" },
    { a: -1, b: 0, n: 1, ok: true, lab: "(−1,0)：1 个 ✓" },
    { a: -2, b: -1, n: 2, ok: false, lab: "(−2,−1)：2 个 ✗" },
    { a: -4, b: -2, n: 3, ok: true, lab: "(−4,−2)：3 个 ✓" },
    { a: -7, b: -4, n: 4, ok: false, lab: "(−∞,−4)：4 个 ✗" },
  ];
  const TOTAL = 8;
  function paint(K) {
    // K: 1=零极点落位 2-6=逐区间计数 7=点亮奇数段+分支生长 8=箭头+结论
    F.setProgress(K >= 7 ? (K >= 8 ? 1 : 0.55) : 0);
    const gOv = F.gDyn;
    gOv.innerHTML = "";
    const nIv = Math.max(0, Math.min(5, K - 1));
    for (let c = 0; c < 5; c++) {
      const id = document.getElementById("c" + c);
      if (id) { id.style.background = "var(--sky)"; id.style.opacity = "1"; id.style.borderLeft = "5px solid transparent"; }
    }
    for (let i = 0; i < nIv; i++) {
      const iv = IVS[i];
      const x1 = F.X(iv.a), x2 = F.X(iv.b === 4.5 ? 4.4 : iv.b);
      RL.mk("rect", { x: Math.min(x1, x2), y: F.Y(0) - 26, width: Math.abs(x2 - x1), height: 52,
        fill: iv.ok ? "rgba(214,58,47,.16)" : "rgba(90,107,140,.10)", stroke: iv.ok ? "#D63A2F" : "#8A97B5", "stroke-width": 1.4 }, gOv);
      RL.tx(gOv, (Math.min(x1, x2) + Math.max(x1, x2)) / 2, F.Y(0) - 34, iv.lab, { fs: 19, b: 1, fill: iv.ok ? "#D63A2F" : "#5B6B8C", halo: 1 });
      for (let c = 0; c < i; c++) {
        const id = document.getElementById("c" + c);
        if (id) { id.style.background = IVS[c].ok ? "#F0FAF4" : "#F3F5FA"; id.style.opacity = "0.55"; }
      }
    }
    const cur = nIv - 1;
    if (cur >= 0) { const id = document.getElementById("c" + cur); if (id) { id.style.background = "#FDF3EC"; id.style.opacity = "1"; id.style.borderLeft = "5px solid var(--orange)"; } }
  }
  RL.wire(TOTAL, paint, { dur: 9000 });
});
</script>
""" + foot()))
