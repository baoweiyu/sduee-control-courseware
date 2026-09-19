# -*- coding: utf-8 -*-
"""第五章 P43-P55 页面定义（第三部分：广义根轨迹）。"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_lib import head, foot, note, partcover

PAGES = []

DERIV_CSS = """
  .row { display:flex; gap:26px; height:100%; min-height:0; }
  .c { flex:1; display:flex; flex-direction:column; min-height:0; }
  .c .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:10px; }
  .hl { background:#FDF3EC; border-radius:12px; padding:12px 18px; font-size:21.5px; line-height:1.6; }
  .seg { background:var(--sky); border-radius:12px; padding:10px 16px; font-size:20.5px; line-height:1.55; }
"""

FIGONLY_CSS = """
  .row { display:flex; gap:26px; height:100%; min-height:0; }
  .c { flex:1; display:flex; flex-direction:column; min-height:0; }
  .c .bd { flex:1; display:grid; place-items:center; background:#fff; padding:6px 10px; min-height:0; }
  .c svg { width:100%; height:100%; }
"""

ANIM2_CSS = """
  .row { display:flex; gap:20px; height:100%; min-height:0; }
  .figc { flex:1; display:flex; flex-direction:column; overflow:hidden; min-height:0; }
  .figc .bd2 { flex:1; display:grid; place-items:center; background:#fff; padding:6px 8px; min-height:0; }
  .figc svg { width:100%; height:100%; }
  .ctl { display:flex; align-items:center; gap:10px; justify-content:center; padding:2px 0 4px; }
  .btn { background:var(--blue); color:#fff; border:none; border-radius:10px; font-size:18px; font-weight:700; padding:7px 18px; cursor:pointer; }
  .btn.ghost { background:#fff; color:var(--blue); border:2px solid var(--blue); }
  .prog { font-size:17px; color:var(--muted); min-width:52px; }
"""

# ---------------- P43 第三部分封面 ----------------
PAGES.append(dict(file="p43-part3-cover.html", title="第三部分封面", cx="L0", html=
head("第三部分封面 · 广义根轨迹", nochrome=True, pageattr=' data-page="__PAGENO__"', extra_css="") +
partcover("第三部分", "广义根轨迹", "参量根轨迹 · 零度根轨迹 · 非最小相位", "可变的不只是增益：让别的参数也「跑」起来",
      [("3.1", "广义根轨迹概念与参量根轨迹黄金法则"),
       ("3.2", "例5-8 / 例5-9：参量根轨迹与轨迹族"),
       ("3.3", "零度根轨迹：正反馈系统的规则差异"),
       ("3.4", "例5-10 / 例5-11 / 例5-12：判型与条件稳定")],
      "radar-track.png", "雷达目标跟踪系统") + foot()))

# ---------------- P44 广义根轨迹概念 ----------------
PAGES.append(dict(file="p44-genrl-concept.html", title="广义根轨迹的概念", html=
head("广义根轨迹的概念", pageattr=' data-page="__PAGENO__"', extra_css=DERIV_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">什么是广义根轨迹</div>
      <div class="bd">
        <div class="seg">前面只讨论<span class="kw-r">根轨迹增益 K₁</span> 变化的根轨迹（常规根轨迹 / 180° 轨迹）。</div>
        <div class="seg">以<span class="kw-r">其它参数</span>（开环零点、极点、时间常数、反馈系数等）为参变量的根轨迹，统称<span class="kw-r">广义根轨迹</span>。</div>
        <div class="seg">典型三类：<b>参量根轨迹</b>（非 K₁ 参量）、<b>零度根轨迹</b>（正反馈）、<b>非最小相位系统</b>的根轨迹。</div>
      </div>
    </div>
    <div class="act-card c">
      <div class="hd">为什么可行</div>
      <div class="bd">
        <div style="font-size:21px; line-height:1.65;">根轨迹的出发点是特征方程 <span class="tex">1+G(s)H(s)=0</span>：只要能把可变参量演化到<span class="kw-r">相当于 K₁ 的位置</span>，前述全部绘制法则照常适用。</div>
        <div class="hl" style="font-size:20px;">绘制参量根轨迹时，前述绘制方法和规则依然适用——只需预先将可变参量演化到 K₁ 的位置上（黄金法则，见下页）。</div>
      </div>
    </div>
  </div>
</div>
""" + note("总纲", "广义根轨迹 = <span class=\"kw-r\">同一条特征方程</span> + <span class=\"kw-r\">不同的参变量视角</span>。法则不变，只换「开环传函」的包装。") + foot()))

# ---------------- P45 黄金法则 ----------------
PAGES.append(dict(file="p45-golden-rule.html", title="参量根轨迹：黄金法则", html=
head("参量根轨迹：黄金法则（等效开环传递函数）", pageattr=' data-page="__PAGENO__"', extra_css=DERIV_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">三步演化</div>
      <div class="bd">
        <div class="seg">① 写出闭环特征方程 <span class="tex">1+G(s)H(s)=0</span>；</div>
        <div class="seg">② 将方程按<span class="kw-r">参变量 a</span> 整理为 <span class="tex">1+\dfrac{aP(s)}{Q(s)}=0</span>（a 的<span class="kw-r">一次式</span>）；</div>
        <div class="seg">③ 构造<span class="kw-r">等效开环传递函数</span> <span class="tex">G^*(s)H^*(s)=\dfrac{aP(s)}{Q(s)}</span>——之后一切法则照旧。</div>
      </div>
    </div>
    <div class="act-card c">
      <div class="hd">要点与警示</div>
      <div class="bd">
        <div class="mathbox math eqline tex tex-d">Q(s)+aP(s)=0\ \Longleftrightarrow\ 1+\dfrac{aP(s)}{Q(s)}=0</div>
        <div class="seg" style="font-size:20px;">等效系统的<span class="kw-r">「开环极点」= Q(s)=0 的根</span>（原特征方程在 a=0 时的根）；「开环零点」= P(s)=0 的根。</div>
        <div class="seg" style="font-size:20px;"><span class="kw-r">警示</span>：等效 G*H* 与原 GH 的零极点不同，但闭环极点相同——等效只用于<span class="kw-r">画轨迹</span>，不能用它求原系统的零点/增益。</div>
      </div>
    </div>
  </div>
</div>
""" + note("口诀", "<span class=\"kw-r\">「一提、一除、一套」</span>：提出参量、除以系数、套用七法则。") + foot()))

# ---------------- P46 例5-8① ----------------
PAGES.append(dict(file="p46-ex58a.html", title="例5-8①：等效变换", scripts='<script src="../data/ex58.js"></script>\n', html=
head("例5-8①：等效变换", pageattr=' data-page="__PAGENO__"', extra_css=DERIV_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">例 5-8：参量 a 的根轨迹</div>
      <div class="bd">
        <div style="font-size:21px;">单位反馈系统 <span class="tex">G(s)=\dfrac{4}{s(s+a)}</span>，试绘 a: 0→∞ 的参量根轨迹。</div>
        <div class="seg">特征方程：<span class="tex">s^{2}+as+4=0</span>。</div>
        <div class="seg">黄金法则：<span class="tex">1+\dfrac{a\cdot s}{s^{2}+4}=0</span> → <span class="tex">G^*H^*=\dfrac{as}{(s+\mathrm{j}2)(s-\mathrm{j}2)}</span>。</div>
        <div class="seg" style="font-size:20px;">等效"开环极点" ±j2（a=0 时原方程的根），等效"开环零点" 0（原点）。</div>
      </div>
    </div>
    <div class="act-card c">
      <div class="hd">等效零极点布局</div>
      <div class="bd" style="justify-content:center;"><svg id="fig" style="width:100%; height:86%;"></svg></div>
    </div>
  </div>
</div>
""" + note("观察", "两个等效极点在<span class=\"kw-r\">虚轴上</span>（±j2）——这不是常规布局，但法则完全照用。") + r"""
<script>
document.addEventListener("DOMContentLoaded", () => { RL.figure("fig", "ex58", { vw: 860, vh: 520, static: true, asym: false }); });
</script>
""" + foot()))

# ---------------- P47 例5-8②动画 ----------------
PAGES.append(dict(file="p47-ex58b.html", title="例5-8②：参量根轨迹动画", cx="L2", scripts='<script src="../data/ex58.js"></script>\n', html=
head("例5-8②：a: 0→∞ 的圆轨迹动画", pageattr=' data-page="__PAGENO__"', extra_css="""
  .row { display:flex; gap:24px; height:100%; min-height:0; }
  .figc { flex:1.32; display:flex; flex-direction:column; overflow:hidden; }
  .figc .bd2 { flex:1; display:grid; place-items:center; background:#fff; padding:6px 10px; min-height:0; }
  .figc svg { width:100%; height:100%; }
  .ctl { display:flex; align-items:center; gap:12px; justify-content:center; padding:8px 0 10px; }
  .btn { background:var(--blue); color:#fff; border:none; border-radius:10px; font-size:19px; font-weight:700; padding:8px 22px; cursor:pointer; }
  .btn.ghost { background:#fff; color:var(--blue); border:2px solid var(--blue); }
  .prog { font-size:18px; color:var(--muted); min-width:64px; }
  .side { flex:1; display:flex; flex-direction:column; gap:16px; min-height:0; }
  .side .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:10px; }
  .kv { background:var(--sky); border-radius:12px; padding:12px 17px; font-size:20px; line-height:1.55; }
""") + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card figc">
      <div class="hd"><span style="flex:1">a 从 0 生长：自 ±j2 出发，沿圆会合，趋向 0 与 −∞</span></div>
      <div class="bd2"><svg id="fig"></svg></div>
      <div class="ctl">
        <button class="btn" id="play">▶ 播放</button>
        <button class="btn ghost" onclick="ACT.step.reset()">↺ 重置</button>
        <span class="prog" id="prog">0 / 8</span>
      </div>
    </div>
    <div class="side">
      <div class="act-card">
        <div class="hd">关键量（法则速算）</div>
        <div class="bd" style="font-size:20px;">
          <div class="kv">会合点：da/ds=0 → <span class="kw-r">s=−2</span>（a=4）</div>
          <div class="kv">出射角：θ=180°+90°−90°=<span class="kw-r">±180°</span>（沿圆切线方向射出）</div>
          <div class="kv">轨迹：|s|=2 的圆（圆心原点）→ 与 <span class="tex">s^{2}+as+4</span> 的根 <span class="tex">|s|^{2}=4</span> 一致</div>
        </div>
      </div>
      <div class="act-card">
        <div class="hd">解析一眼看穿</div>
        <div class="bd" style="font-size:20px;">
          <div class="kv" style="background:#FDF3EC;">s^{2}+as+4=0 的根满足 <span class="tex">s_1s_2=4</span>（韦达）→ |s|²=4 → <span class="kw-r">轨迹必在半径 2 的圆上</span>，会合点 −2，一支到 0、一支到 −∞。</div>
        </div>
      </div>
    </div>
  </div>
</div>
""" + note("出射角", "对 p=+j2：θ=180°+∠(p−z)−∠(p−p̄)=180°+90°−90°=180°，即<span class=\"kw-r\">沿圆的切线（水平向左）出发</span>——与圆轨迹严格相切。") + r"""
<div data-step="1" style="display:none"></div><div data-step="2" style="display:none"></div><div data-step="3" style="display:none"></div><div data-step="4" style="display:none"></div>
<div data-step="5" style="display:none"></div><div data-step="6" style="display:none"></div><div data-step="7" style="display:none"></div><div data-step="8" style="display:none"></div>
<script>
document.addEventListener("DOMContentLoaded", () => {
  const F = RL.figure("fig", "ex58", { vw: 900, vh: 560, asym: false });
  const TOTAL = 8, ASTEPS = [0, 0.001, 0.6, 2.0, 4.0, 6.0, 12, 40, 200];
  function paint(K) {
    const a = ASTEPS[Math.min(K, 8)];
    const f = F.mapK(a);
    F.setProgress(Math.max(0, Math.min(1, f)));
  }
  RL.wire(TOTAL, paint, { dur: 8000 });
});
</script>
""" + foot()))

# ---------------- P48 例5-9 ----------------
PAGES.append(dict(file="p48-ex59.html", title="例5-9：双参数根轨迹族", cx="L1", scripts='<script src="../data/ex59a.js"></script>\n<script src="../data/ex59b.js"></script>\n', html=
head("例5-9：双参数根轨迹族", pageattr=' data-page="__PAGENO__"', extra_css="""
  .row { display:flex; gap:22px; height:100%; min-height:0; }
  .c { flex:1; display:flex; flex-direction:column; min-height:0; }
  .c .bd { flex:1; display:grid; place-items:center; background:#fff; padding:6px 8px; min-height:0; }
  .c svg { width:100%; height:100%; }
  .cap { flex:none; font-size:18.5px; color:var(--navy); background:var(--sky); border-radius:12px; padding:8px 14px; margin:0 10px 10px; }
  .mid { flex:1.15; }
""") + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c mid">
      <div class="hd">图5-11：等效系统 K₁/[s²(s+1)] 的根轨迹</div>
      <div class="bd"><svg id="fa"></svg></div>
      <div class="cap">先固定参数 a、让 K₁ 变：等效系统 <span class="tex">s^{2}(s+1)+K_1=0</span> 的轨迹。其上取 <span class="tex">K_1=K_{11},\ K_{12}</span> 两组极点作为下一步的"开环极点"。</div>
    </div>
    <div class="act-card c">
      <div class="hd">图5-12：a 参量根轨迹族</div>
      <div class="bd"><svg id="fb"></svg></div>
      <div class="cap">再对 <span class="tex">G^*H^*=\dfrac{a\,s(s+1)}{s^{2}(s+1)+K_1}</span> 分别取 K₁=0.1 / 0.35 / 1.0，画出一<span class="kw-r">族</span> a 轨迹（双参数问题的工程画法）。</div>
    </div>
  </div>
</div>
""" + note("方法", "双参数问题 = <span class=\"kw-r\">两次单参数问题</span>：先冻结一个参数画轨迹、取点；再以这些点为开环极点画另一参数的轨迹族。") + r"""
<script>
document.addEventListener("DOMContentLoaded", () => {
  RL.figure("fa", "ex59a", { vw: 800, vh: 560, static: true, brk: false });
  const fam = RL.data.ex59b.loci;
  fam.forEach((d, i) => {
    RL.data["_fam" + i] = d;
    RL.figure("fb", "_fam" + i, { vw: 800, vh: 560, static: true, merge: i > 0, asym: false, brk: false, cross: false, arrows: false, poleLabels: i === 0 });
  });
});
</script>
""" + foot()))

# ---------------- P49 零度根轨迹① ----------------
PAGES.append(dict(file="p49-zerodeg1.html", title="零度根轨迹①：由来与条件", html=
head("零度根轨迹①：由来与相角条件", pageattr=' data-page="__PAGENO__"', extra_css=DERIV_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">正反馈 → 特征方程变号</div>
      <div class="bd">
        <div class="seg">正反馈系统闭环特征方程：<span class="tex">1-G(s)H(s)=0</span>，即</div>
        <div class="mathbox math eqline tex tex-d">G(s)H(s)=+1</div>
        <div class="seg">相角条件变为：<span class="tex">\sum\angle(s-z_j)-\sum\angle(s-p_i)=0^\circ+2q\pi</span> ——<span class="kw-r">零度根轨迹</span>。</div>
        <div class="seg" style="font-size:20px;">凡<span class="kw-r">正反馈</span>系统、或开环传函含<span class="kw-r">负号</span>（如 <span class="tex">-K_1</span>）的系统，都画零度根轨迹。</div>
      </div>
    </div>
    <div class="act-card c">
      <div class="hd">180° vs 0°：三条规则差异对比</div>
      <div class="bd">
        <table class="act-table" style="font-size:19.5px;">
          <tr><th>项目</th><th>180° 轨迹</th><th>0° 轨迹</th></tr>
          <tr><td>相角条件</td><td>(2q+1)·180°</td><td>2q·180°（即 0°）</td></tr>
          <tr><td>实轴段判据</td><td>右侧零极点数 <b>奇</b>数</td><td>右侧零极点数 <b>偶</b>数</td></tr>
          <tr><td>渐近线夹角</td><td>(2q+1)·180°/(n−m)</td><td>2q·180°/(n−m)</td></tr>
          <tr><td>出射角</td><td>180°+Σ∠z−Σ∠p</td><td>0°+Σ∠z−Σ∠p</td></tr>
        </table>
        <div style="font-size:19.5px; color:var(--muted);">其余法则（对称性、起止点、分离点方程 dK₁/ds=0）两族相同。</div>
      </div>
    </div>
  </div>
</div>
""" + note("本质", "差别只在「合相角凑 0° 还是 180°」——把奇偶对调，全套法则平移即可。") + foot()))

# ---------------- P50 零度根轨迹② ----------------
PAGES.append(dict(file="p50-zerodeg2.html", title="零度根轨迹②：规则对照", html=
head("零度根轨迹②：逐条对照", pageattr=' data-page="__PAGENO__"', extra_css=DERIV_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">例：K₁/[s(s+1)(s+2)] 的 0° 轨迹</div>
      <div class="bd">
        <div class="seg">实轴段（右侧数为<b>偶</b>）：[−2,−1] 与 [0,+∞)。</div>
        <div class="seg">渐近线：σ_a=−1；夹角 <span class="tex">2q\cdot180^\circ/3=0^\circ,\pm120^\circ</span>。</div>
        <div class="seg">分离点：dK₁/ds=0 解仍为 −0.423、−1.577；其中 <span class="kw-r">−1.577 ∈ [−2,−1] ✓</span>（K₁=0.385）。</div>
      </div>
    </div>
    <div class="act-card c">
      <div class="hd">记忆法</div>
      <div class="bd">
        <div class="hl" style="font-size:20.5px;">把 180° 法则里的「奇」换成「偶」、「(2q+1)π」换成「2qπ」——其余逐字照抄。</div>
        <div class="seg" style="font-size:20px;">起始于开环极点、终止于零点/无穷远：不变（K₁=0 根在开环极点、K₁→∞ 根到零点的推导与符号无关）。</div>
        <div class="seg" style="font-size:20px;">分离点方程 dK₁/ds=0：不变（同一特征方程）。</div>
        <div class="seg" style="font-size:20px;">虚轴交点：劳斯/代入法照用，但对应特征方程为 <span class="tex">D(s)-K_1N(s)=0</span>。</div>
      </div>
    </div>
  </div>
</div>
""" + note("预告", "下一页起以例 5-10 完整对比两种轨迹（同系统、同图框、左右对照）。") + foot()))

# ---------------- P51 例5-10① ----------------
PAGES.append(dict(file="p51-ex510a.html", title="例5-10①：正反馈系统分析", scripts='<script src="../data/ex510.js"></script>\n', html=
head("例5-10①：正反馈系统的零度根轨迹", pageattr=' data-page="__PAGENO__"', extra_css=DERIV_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">例 5-10（正反馈）</div>
      <div class="bd">
        <div class="mathbox math eqline tex tex-d">G(s)H(s)=\dfrac{K_1}{s(s+1)(s+2)}\quad(正反馈)</div>
        <div class="seg">实轴段：[−2,−1] 与 [0,+∞)（偶数判据）。</div>
        <div class="seg">渐近线：σ_a=−1；0°, ±120°。</div>
        <div class="seg">分离点：−1.577（K₁=0.385），在 [−2,−1] 段。</div>
      </div>
    </div>
    <div class="act-card c">
      <div class="hd">0° 轨迹骨架</div>
      <div class="bd" style="justify-content:center;"><svg id="fig" style="width:100%; height:86%;"></svg></div>
    </div>
  </div>
</div>
""" + note("预感", "右半实轴 [0,+∞) 整段都是轨迹——已经预示：<span class=\"kw-r\">总有一条分支赖在右半平面</span>。") + r"""
<script>
document.addEventListener("DOMContentLoaded", () => { RL.figure("fig", "ex510", { vw: 860, vh: 520, static: true }); });
</script>
""" + foot()))

# ---------------- P52 例5-10②对比动画 ----------------
PAGES.append(dict(file="p52-ex510b.html", title="例5-10②：零度vs180°对比动画", cx="L2", scripts='<script src="../data/ex52.js"></script>\n<script src="../data/ex510.js"></script>\n', html=
head("例5-10②：负反馈 vs 正反馈 同屏对比动画", pageattr=' data-page="__PAGENO__"', extra_css=ANIM2_CSS) + r"""
<div class="act-body has-note">
  <div class="row" style="height:calc(100% - 26px);">
    <div class="act-card figc">
      <div class="hd">负反馈（180° 轨迹）· 分离点 −0.423</div>
      <div class="bd2"><svg id="fg"></svg></div>
    </div>
    <div class="act-card figc">
      <div class="hd">正反馈（0° 轨迹）· 分离点 −1.577</div>
      <div class="bd2"><svg id="fz"></svg></div>
    </div>
  </div>
  <div class="ctl" style="display:flex; align-items:center; gap:12px; justify-content:center; padding:0 0 2px;">
    <button class="btn" id="play">▶ 播放</button>
    <button class="btn ghost" onclick="ACT.step.reset()">↺ 重置</button>
    <span class="prog" id="prog" style="font-size:17px; color:var(--muted); min-width:52px;">0 / 8</span>
  </div>
</div>
""" + note("对照读图", "同一系统只换反馈极性：轨迹<span class=\"kw-r\">实轴段互补</span>（奇 ↔ 偶）、分离点左右互换、复分支渐近线从 ±60° 变 ±120°。") + r"""
<div data-step="1" style="display:none"></div><div data-step="2" style="display:none"></div><div data-step="3" style="display:none"></div><div data-step="4" style="display:none"></div>
<div data-step="5" style="display:none"></div><div data-step="6" style="display:none"></div><div data-step="7" style="display:none"></div><div data-step="8" style="display:none"></div>
<script>
document.addEventListener("DOMContentLoaded", () => {
  const FA = RL.figure("fg", "ex52", { vw: 800, vh: 560 });
  const FB = RL.figure("fz", "ex510", { vw: 800, vh: 560 });
  const TOTAL = 8, KSTEPS = [0, 0.001, 0.05, 0.385, 1.0, 6.0, 25, 120, 1500];
  function paint(K) {
    const kA = KSTEPS[Math.min(K, 8)];
    const f = F.mapK(kA);
    FA.setProgress(f); FB.setProgress(f);
  }
  RL.wire(TOTAL, paint, { dur: 9000 });
});
</script>
""" + foot()))

# ---------------- P53 例5-10③ ----------------
PAGES.append(dict(file="p53-ex510c.html", title="例5-10③：结论", html=
head("例5-10③：正反馈系统不可能稳定", pageattr=' data-page="__PAGENO__"', extra_css=DERIV_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">从轨迹看结论</div>
      <div class="bd">
        <div class="hl">[0,+∞) 整段是根轨迹：<span class="kw-r">无论 K₁ 取何值，恒有一个正实闭环极点</span> → 正反馈系统<span class="kw-r">不可能稳定</span>。</div>
        <div class="seg">左半平面的一对分支（[−2,−1] 内分离）只能保证"另外两极"暂时稳定——整体无稳定可言。</div>
        <div class="seg" style="font-size:20px;">代数印证：D(s)=s(s+1)(s+2)−K₁ 常数项为 −K₁ &lt; 0，三根之积 &gt; 0 → 必有正根或一对右半复根。</div>
      </div>
    </div>
    <div class="act-card c">
      <div class="hd">推广</div>
      <div class="bd">
        <div class="seg" style="font-size:20.5px;">凡是<span class="kw-r">原点起于开环极点且 n≥2 的正反馈</span>系统，[0,+∞) 恒为轨迹（右侧计数 0，偶）——结论具有一般性。</div>
        <div class="seg" style="font-size:20.5px;">工程含义：正反馈结构（或极性接反）必然失稳；根轨迹一眼看出<span class="kw-r">结构性不稳定</span>。</div>
        <div class="seg" style="font-size:20.5px;">若想"利用"正反馈的局部能量回馈，必须配合校正改造结构（第六章的局部反馈校正是负反馈意义上的）。</div>
      </div>
    </div>
  </div>
</div>
""" + note("考点", "「正反馈 + 原点极点 → 必不稳定」是零度根轨迹最常考的推论，依据就是 <span class=\"kw-r\">[0,+∞) 恒为实轴轨迹</span>。") + foot()))

# ---------------- P54 非最小相位 ----------------
PAGES.append(dict(file="p54-nonminphase.html", title="非最小相位系统", scripts='<script src="../data/ex511.js"></script>\n', html=
head("非最小相位系统的判型", pageattr=' data-page="__PAGENO__"', extra_css="""
  .row { display:flex; gap:24px; height:100%; min-height:0; }
  .c1 { flex:1.05; display:flex; flex-direction:column; min-height:0; }
  .c1 .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:9px; }
  .figc { flex:1.2; display:flex; flex-direction:column; overflow:hidden; }
  .figc .bd2 { flex:1; display:grid; place-items:center; background:#fff; padding:6px 8px; min-height:0; }
  .figc svg { width:100%; height:100%; }
  .seg { background:var(--sky); border-radius:12px; padding:9px 15px; font-size:20px; line-height:1.5; }
  .hl { background:#FDF3EC; border-radius:12px; padding:10px 16px; font-size:20.5px; line-height:1.55; }
""") + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c1">
      <div class="hd">例 5-11：判型</div>
      <div class="bd">
        <div class="seg" style="font-size:19.5px;"><b>定义</b>：在 s 右半平面有开环零点或极点的系统，称非最小相位系统。</div>
        <div class="seg" style="font-size:19.5px;">例5-11 两系统均在右半平面有一个开环零点（z=+1），均属非最小相位。</div>
        <div class="seg" style="font-size:19.5px;">系统(1) <span class="tex">G_1H_1=\dfrac{K_1(s+1)}{(s-1)(s+2)}</span>：标准形 → 特征方程即 <span class="tex">1+G_1H_1=0</span> → <span class="kw-r">180° 轨迹</span>。</div>
        <div class="seg" style="font-size:19.5px;">系统(2) <span class="tex">G_2H_2=\dfrac{-K_1(s+1)}{(s-1)(s+2)}</span>：整理成标准形后 K₁ 前带负号 → <span class="tex">1-\dfrac{K_1(s+1)}{(s-1)(s+2)}=0</span> → <span class="kw-r">0° 轨迹</span>。</div>
        <div class="hl" style="font-size:19.5px;">口诀：非最小相位 ≠ 必画零度——<span class="kw-r">先整理标准形，再看 K₁ 的符号</span>。</div>
      </div>
    </div>
    <div class="figc">
      <div class="act-card" style="height:100%; display:flex; flex-direction:column; overflow:hidden;">
        <div class="hd">系统(1) 180° 轨迹（上）与系统(2) 0° 轨迹（下）</div>
        <div class="bd2" style="flex:1;"><svg id="fa"></svg></div>
        <div class="bd2" style="flex:1;"><svg id="fb"></svg></div>
      </div>
    </div>
  </div>
</div>
""" + note("验证", "两图的轨迹由数值求根生成：180° 轨迹的分支把右平面极点 +1 「拉」向零点 +1 或趋于 −∞；0° 轨迹的实轴段则完全互补。") + r"""
<script>
document.addEventListener("DOMContentLoaded", () => {
  RL.data.ex511a = RL.data.ex511.a;
  RL.data.ex511b = RL.data.ex511.b;
  RL.figure("fa", "ex511a", { vw: 840, vh: 265, static: true });
  RL.figure("fb", "ex511b", { vw: 840, vh: 265, static: true });
});
</script>
""" + foot()))

# ---------------- P55 例5-12 ----------------
PAGES.append(dict(file="p55-ex512.html", title="例5-12：条件稳定系统", scripts='<script src="../data/ex512.js"></script>\n', html=
head("例5-12：条件稳定系统", pageattr=' data-page="__PAGENO__"', extra_css="""
  .row { display:flex; gap:24px; height:100%; min-height:0; }
  .c { flex:1; display:flex; flex-direction:column; min-height:0; }
  .c .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:9px; }
  .figc { flex:1.12; display:flex; flex-direction:column; overflow:hidden; }
  .figc .bd2 { flex:1; display:grid; place-items:center; background:#fff; padding:6px 8px; min-height:0; }
  .figc svg { width:100%; height:100%; }
  .seg { background:var(--sky); border-radius:12px; padding:9px 15px; font-size:20px; line-height:1.5; }
  .hl { background:#FDF3EC; border-radius:12px; padding:10px 16px; font-size:20.5px; line-height:1.55; }
""") + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">例 5-12：系统与关键点</div>
      <div class="bd">
        <div class="mathbox math eqline tex tex-d">G(s)H(s)=\dfrac{K_1(s^{2}-2s+5)}{(s+2)(s-0.5)}</div>
        <div class="seg" style="font-size:19.5px;">开环极点 −2、+0.5；复零点 <span class="tex">1\pm\mathrm{j}2</span>（右半平面 → 非最小相位）。</div>
        <div class="seg" style="font-size:19.5px;">分离点：dK₁/ds=0 → s=−0.41（K₁≈0.242）；入射角（复零点）≈199°。</div>
        <div class="seg" style="font-size:19.5px;">虚轴交点：<span class="tex">s=\pm\mathrm{j}1.25</span>（K₁=0.75）；K₁=0.2 时含原点极点（临界）。</div>
        <div class="hl" style="font-size:20px;">闭环稳定范围 <span class="tex">0.2&lt;K_1&lt;0.75</span>：K₁ 太小、太大都不稳定——<span class="kw-r">条件稳定系统</span>。</div>
      </div>
    </div>
    <div class="figc">
      <div class="act-card" style="height:100%; display:flex; flex-direction:column; overflow:hidden;">
        <div class="hd">根轨迹（图5-14 重绘，数值生成）</div>
        <div class="bd2"><svg id="fig"></svg></div>
      </div>
    </div>
  </div>
</div>
""" + note("推导骨架", "特征方程 <span class=\"tex\">(1+K_1)s^{2}+(1.5-2K_1)s+(-1+5K_1)=0</span>：三项系数同为正 ⇔ <span class=\"kw-r\">0.2&lt;K₁&lt;0.75</span>（二阶系统稳定充要条件）。") + r"""
<script>
document.addEventListener("DOMContentLoaded", () => {
  RL.figure("fig", "ex512", { vw: 840, vh: 600, static: true });
  // 临界带标注
});
</script>
""" + foot()))
