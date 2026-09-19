# -*- coding: utf-8 -*-
"""第五章 P31-P42 页面定义（第二部分：根轨迹绘制综合例题）。"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_lib import head, foot, note, partcover, QUIZ_CSS

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

ANIM_CSS = """
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
"""

# ---------------- P31 第二部分封面 ----------------
PAGES.append(dict(file="p31-part2-cover.html", title="第二部分封面", cx="L0", html=
head("第二部分封面 · 根轨迹绘制综合例题", nochrome=True, pageattr=' data-page="__PAGENO__"', extra_css="") +
partcover("第二部分", "根轨迹绘制综合例题", "完整流程 · 从法则到图形", "把七条法则串成一条流水线：每一步都有章法",
      [("2.1", "例5-2：三阶系统全程绘制（含动画）"),
       ("2.2", "轨迹上求点：根之和 / 根之积"),
       ("2.3", "例5-5/5-6：四阶系统复算"),
       ("2.4", "例5-7 对照卡：又一例完整流程")],
      "robot-arm.png", "工业机器人关节伺服") + foot()))

# ---------------- P32 例5-2① ----------------
PAGES.append(dict(file="p32-ex52a.html", title="例5-2①：零极点与实轴段", scripts='<script src="../data/ex52.js"></script>\n', html=
head("例5-2①：零极点分布与实轴段", pageattr=' data-page="__PAGENO__"', extra_css=DERIV_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">例 5-2</div>
      <div class="bd">
        <div class="mathbox math eqline tex tex-d">G(s)H(s)=\dfrac{K_1}{s(s+1)(s+2)}</div>
        <div class="seg">开环极点：0、−1、−2（n=3），无开环零点（m=0）。</div>
        <div class="seg">实轴段（右侧计数）：[−1,0]：<b style="color:#D63A2F">1 ✓</b>；(−2,−1)：2 ✗；(−∞,−2]：<b style="color:#D63A2F">3 ✓</b>。</div>
        <div style="font-size:20.5px; color:var(--muted);">三阶系统的绘制六步：实轴段 → 渐近线 → 分离点 → 虚轴交点 → 动画生长 → 求点算 K。</div>
      </div>
    </div>
    <div class="act-card c">
      <div class="hd">零极点与实轴段</div>
      <div class="bd" style="justify-content:center;"><svg id="fig" style="width:100%; height:86%;"></svg></div>
    </div>
  </div>
</div>
""" + note("布局", "三个开环极点全部在负实轴上——这是最经典的「入门级」根轨迹。") + r"""
<script>
document.addEventListener("DOMContentLoaded", () => { RL.figure("fig", "ex52", { vw: 860, vh: 520, static: true, asym: false, cross: false, brk: false }); });
</script>
""" + foot()))

# ---------------- P33 例5-2② ----------------
PAGES.append(dict(file="p33-ex52b.html", title="例5-2②：渐近线", scripts='<script src="../data/ex52.js"></script>\n', html=
head("例5-2②：渐近线", pageattr=' data-page="__PAGENO__"', extra_css=DERIV_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">法则 4 代入</div>
      <div class="bd">
        <div class="seg">渐近线条数：n−m = 3。</div>
        <div class="mathbox math eqline tex tex-d">\sigma_a=\dfrac{0+(-1)+(-2)}{3}=-1</div>
        <div class="mathbox math eqline tex tex-d">\varphi_a=\dfrac{(2q+1)\times180^\circ}{3}=\pm60^\circ,\ 180^\circ</div>
        <div class="hl">三条渐近线从 (−1, 0) 出发：一条沿负实轴方向（与实轴段重合），两条 ±60°。</div>
      </div>
    </div>
    <div class="act-card c">
      <div class="hd">渐近线布局</div>
      <div class="bd" style="justify-content:center;"><svg id="fig" style="width:100%; height:86%;"></svg></div>
    </div>
  </div>
</div>
""" + note("观察", "180° 那条「渐近线」与负实轴重合——分支沿 (−∞,−2] 直接趋于无穷，无需另画。") + r"""
<script>
document.addEventListener("DOMContentLoaded", () => { RL.figure("fig", "ex52", { vw: 860, vh: 520, static: true, brk: false, cross: false }); });
</script>
""" + foot()))

# ---------------- P34 例5-2③ ----------------
PAGES.append(dict(file="p34-ex52c.html", title="例5-2③：分离点", scripts='<script src="../data/ex52.js"></script>\n', html=
head("例5-2③：分离点", pageattr=' data-page="__PAGENO__"', extra_css=DERIV_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">dK₁/ds = 0</div>
      <div class="bd">
        <div class="mathbox math eqline tex tex-d">K_1(s)=-s(s+1)(s+2)=-(s^{3}+3s^{2}+2s)</div>
        <div class="mathbox math eqline tex tex-d">\dfrac{\mathrm{d}K_1}{\mathrm{d}s}=3s^{2}+6s+2=0</div>
        <div class="seg">解得 <span class="tex">d_{1,2}=\dfrac{-3\pm\sqrt{3}}{3}</span>，即 <span class="tex">d_1=-0.423</span>、<span class="tex">d_2=-1.577</span>。</div>
        <div class="hl"><b>筛选：</b>d₁=−0.423 ∈ [−1,0] ✓（分离点）；d₂=−1.577 ∈ (−2,−1)——<span class="kw-r">不在轨迹段上，舍去</span>。</div>
        <div style="font-size:20.5px; color:var(--muted);">代回幅值条件：K₁(d₁) = −(d₁³+3d₁²+2d₁) ≈ 0.385。</div>
      </div>
    </div>
    <div class="act-card c">
      <div class="hd">分离点位置</div>
      <div class="bd" style="justify-content:center;"><svg id="fig" style="width:100%; height:86%;"></svg></div>
    </div>
  </div>
</div>
""" + note("易错", "dK₁/ds=0 的解<span class=\"kw-r\">不一定是分离点</span>：必须落在实轴根轨迹段内且对应 K₁≥0——本例 d₂ 正是反例。") + r"""
<script>
document.addEventListener("DOMContentLoaded", () => { RL.figure("fig", "ex52", { vw: 860, vh: 520, static: true, asym: false, cross: false }); });
</script>
""" + foot()))

# ---------------- P35 例5-2④劳斯 ----------------
PAGES.append(dict(file="p35-ex52d.html", title="例5-2④：虚轴交点（劳斯法）", scripts='<script src="../data/ex52.js"></script>\n', html=
head("例5-2④：虚轴交点（劳斯法）", pageattr=' data-page="__PAGENO__"', extra_css=DERIV_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">劳斯阵列</div>
      <div class="bd">
        <div style="font-size:21px;">特征方程 <span class="tex">D(s)=s^{3}+3s^{2}+2s+K_1=0</span>：</div>
        <table class="act-table" style="font-size:20.5px;">
          <tr><th>s³</th><td>1</td><td>2</td></tr>
          <tr><th>s²</th><td>3</td><td>K₁</td></tr>
          <tr><th>s¹</th><td>(6−K₁)/3</td><td></td></tr>
          <tr><th>s⁰</th><td>K₁</td><td></td></tr>
        </table>
        <div class="seg">系统稳定 ⇔ 全列同正：0 &lt; K₁ &lt; 6。</div>
        <div class="hl">令 s¹ 行 = 0：<span class="kw-r">K₁ = 6（临界）</span>；辅助方程 <span class="tex">3s^{2}+K_1=0</span> → <span class="tex">s=\pm\mathrm{j}\sqrt{2}</span>。</div>
      </div>
    </div>
    <div class="act-card c">
      <div class="hd">临界点标注</div>
      <div class="bd" style="justify-content:center;"><svg id="fig" style="width:100%; height:86%;"></svg></div>
    </div>
  </div>
</div>
""" + note("稳定域", "根轨迹与虚轴交点把 K₁ 轴分成两段：<span class=\"kw-r\">0&lt;K₁&lt;6 稳定，K₁&gt;6 不稳定</span>——这就是「参数稳定范围」。") + r"""
<script>
document.addEventListener("DOMContentLoaded", () => { RL.figure("fig", "ex52", { vw: 860, vh: 520, static: true }); });
</script>
""" + foot()))

# ---------------- P36 例5-2⑤ s=jω 法 ----------------
PAGES.append(dict(file="p36-ex52e.html", title="例5-2⑤：虚轴交点（s=jω法）", scripts='<script src="../data/ex52.js"></script>\n', html=
head("例5-2⑤：虚轴交点（s=jω 法）", pageattr=' data-page="__PAGENO__"', extra_css=DERIV_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">代入 s = jω，实虚部分别为零</div>
      <div class="bd">
        <div class="mathbox math eqline tex tex-d">(\mathrm{j}\omega)^{3}+3(\mathrm{j}\omega)^{2}+2\mathrm{j}\omega+K_1=0</div>
        <div class="mathbox math eqline tex tex-d">\underbrace{(K_1-3\omega^{2})}_{实部}+\ \mathrm{j}\underbrace{\omega(2-\omega^{2})}_{虚部}=0</div>
        <div class="seg">虚部 = 0 → <span class="tex">\omega^{2}=2</span> → <span class="tex">\omega=\sqrt{2}\approx1.414</span>；</div>
        <div class="seg">实部 = 0 → <span class="tex">K_1=3\omega^{2}=6</span>。</div>
        <div class="hl">与劳斯法结果完全一致：<span class="kw-r">±j√2，K₁=6</span>（两法互证）。</div>
      </div>
    </div>
    <div class="act-card c">
      <div class="hd">结果标注</div>
      <div class="bd" style="justify-content:center;"><svg id="fig" style="width:100%; height:86%;"></svg></div>
    </div>
  </div>
</div>
""" + note("技巧", "s=jω 法对低阶系统最快；劳斯法对高阶系统更稳妥——两法结论<span class=\"kw-r\">必须一致</span>，不一致说明算错了。") + r"""
<script>
document.addEventListener("DOMContentLoaded", () => { RL.figure("fig", "ex52", { vw: 860, vh: 520, static: true }); });
</script>
""" + foot()))

# ---------------- P37 例5-2⑥动画 ----------------
PAGES.append(dict(file="p37-ex52f.html", title="例5-2⑥：完整根轨迹动画", cx="L2", scripts='<script src="../data/ex52.js"></script>\n', html=
head("例5-2⑥：完整根轨迹动画", pageattr=' data-page="__PAGENO__"', extra_css=ANIM_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card figc">
      <div class="hd"><span style="flex:1">三分支生长：实轴靠拢 → 分离 → 过虚轴 → 沿 ±60° 趋向无穷</span></div>
      <div class="bd2"><svg id="fig"></svg></div>
      <div class="ctl">
        <button class="btn" id="play">▶ 播放</button>
        <button class="btn ghost" onclick="ACT.step.reset()">↺ 重置</button>
        <span class="prog" id="prog">0 / 12</span>
      </div>
    </div>
    <div class="side">
      <div class="act-card">
        <div class="hd">关键点（动画中逐一弹出）</div>
        <div class="bd" style="font-size:20px;">
          <div class="kv">分离点 d=−0.423（K₁=0.385）</div>
          <div class="kv">虚轴交点 ±j√2（<span class="kw-r">K₁=6 临界</span>）</div>
          <div class="kv">渐近线 ±60°，σ_a=−1</div>
        </div>
      </div>
      <div class="act-card">
        <div class="hd">读图</div>
        <div class="bd" style="font-size:20px;">
          <div class="kv">0&lt;K₁&lt;0.385：两支在实轴上（一升一降）</div>
          <div class="kv">0.385&lt;K₁&lt;6：复数极点，阻尼渐小</div>
          <div class="kv">K₁&gt;6：一对极点进入<span class="kw-r">右半平面，系统不稳定</span></div>
        </div>
      </div>
    </div>
  </div>
</div>
""" + note("全程", "这就是「法则→图」的完整链条：每按一次键，曲线按数值求根结果生长一段。") + r"""
<div data-step="1" style="display:none"></div><div data-step="2" style="display:none"></div><div data-step="3" style="display:none"></div><div data-step="4" style="display:none"></div><div data-step="5" style="display:none"></div>
<div data-step="6" style="display:none"></div><div data-step="7" style="display:none"></div><div data-step="8" style="display:none"></div><div data-step="9" style="display:none"></div><div data-step="10" style="display:none"></div>
<div data-step="11" style="display:none"></div><div data-step="12" style="display:none"></div>
<script>
document.addEventListener("DOMContentLoaded", () => {
  const F = RL.figure("fig", "ex52", { vw: 900, vh: 560 });
  const TOTAL = 12, KSTEPS = [0, 0.001, 0.001, 0.05, 0.385, 1.0, 3.0, 6.0, 10, 25, 80, 300, 1500];
  function paint(K) {
    const kA = KSTEPS[Math.min(K, 12)];
    const f = F.mapK(kA);
    F.setProgress(Math.max(0, Math.min(1, f)));
  }
  RL.wire(TOTAL, paint, { dur: 10000 });
});
</script>
""" + foot()))

# ---------------- P38 例5-2⑦ ----------------
PAGES.append(dict(file="p38-ex52g.html", title="例5-2⑦：轨迹上求点与K值", html=
head("例5-2⑦：在轨迹上求点与 K 值（根之和/根之积）", pageattr=' data-page="__PAGENO__"', extra_css=DERIV_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">已知两个闭环极点，求第三个</div>
      <div class="bd">
        <div style="font-size:21px;">K₁=6（临界）时，已知一对闭环极点 <span class="tex">s_{1,2}=\pm\mathrm{j}\sqrt{2}</span>，求 s₃：</div>
        <div class="seg">根之和：n=3、n−m=2≥2 时，<span class="tex">\sum s_i=\sum p_i=-3</span>（与 K₁ 无关）。</div>
        <div class="mathbox math eqline tex tex-d">s_3=-3-(s_1+s_2)=-3-0=-3</div>
        <div class="seg" style="font-size:20px;">验证根之积：<span class="tex">s_1s_2s_3=(\mathrm{j}\sqrt2)(-\mathrm{j}\sqrt2)(-3)=-6=-K_1</span> ✓。</div>
      </div>
    </div>
    <div class="act-card c">
      <div class="hd">两条常用性质</div>
      <div class="bd">
        <div class="seg">当 <span class="tex">n-m\ge2</span> 时：闭环极点之和 = 开环极点之和 = <span class="tex">-a_{n-1}</span>（<b>根之和</b>，与 K₁ 无关）。</div>
        <div class="seg">闭环极点之积 = <span class="tex">(-1)^n(a_0+K_1)</span> 型（<b>根之积</b>，随 K₁ 线性变化）。</div>
        <div class="hl" style="font-size:20px;">用途：已知部分极点 → 秒求其余极点；再由幅值条件反算 K₁。<span class="kw-r">试探法求闭环极点的标配工具</span>（第四部分 P58 展开）。</div>
      </div>
    </div>
  </div>
</div>
""" + note("衔接", "这两条性质源自多项式系数对比（韦达定理），是高阶系统「少算快答」的关键。") + foot()))

# ---------------- P39 例5-5/5-6① ----------------
PAGES.append(dict(file="p39-ex56a.html", title="例5-5/5-6①：零极点与渐近线", scripts='<script src="../data/ex54.js"></script>\n', html=
head("例5-5/5-6①：零极点与渐近线", pageattr=' data-page="__PAGENO__"', extra_css=DERIV_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">例 5-5 / 例 5-6（同一系统两问）</div>
      <div class="bd">
        <div class="mathbox math eqline tex tex-d">G(s)H(s)=\dfrac{K_1}{s(s+3)(s^{2}+2s+2)}</div>
        <div class="seg">与例 5-4 同系统。骨架（P28-29 已绘）：渐近线 σ_a=−1.25、±45°/±135°；实轴段 [−3,0]；分离点 −2.289；出射角 ∓71.6°。</div>
        <div class="seg">例 5-5 问：<span class="kw-r">完整绘制</span>根轨迹；例 5-6 问：确定使 ζ=0.5 的 K₁（第四部分例 5-13 详算）。</div>
      </div>
    </div>
    <div class="act-card c">
      <div class="hd">骨架图（含渐近线）</div>
      <div class="bd" style="justify-content:center;"><svg id="fig" style="width:100%; height:86%;"></svg></div>
    </div>
  </div>
</div>
""" + note("节奏", "第二部分再走一遍四阶流程，重点是<span class=\"kw-r\">复算与验证</span>：每一步都能与例 5-4 相互印证。") + r"""
<script>
document.addEventListener("DOMContentLoaded", () => { RL.figure("fig", "ex54", { vw: 860, vh: 520, static: true, brk: false, cross: false }); });
</script>
""" + foot()))

# ---------------- P40 例5-5/5-6② ----------------
PAGES.append(dict(file="p40-ex56b.html", title="例5-5/5-6②：分离点与出射角", scripts='<script src="../data/ex54.js"></script>\n', html=
head("例5-5/5-6②：分离点与出射角复算", pageattr=' data-page="__PAGENO__"', extra_css=DERIV_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">复算（数值 + 解析双口径）</div>
      <div class="bd">
        <div class="seg">分离点方程 <span class="tex">4s^{3}+15s^{2}+16s+6=0</span>：实根 <span class="tex">d=-2.289</span>，对应 <span class="tex">K_1=-(d^{4}+5d^{3}+8d^{2}+6d)\approx4.33</span>。</div>
        <div class="seg" style="font-size:20px;">注意：K₁=2.91 是轨迹上<span class="kw-r">另一点的取样值</span>（ζ=0.5 射线交点附近，见例 5-13），不要与分离点绑定。</div>
        <div class="seg" style="font-size:20px;">出射角：θ_p3=−71.6°、θ_p4=+71.6°（相角求和逐项验算）。</div>
      </div>
    </div>
    <div class="act-card c">
      <div class="hd">分离点与出射方向</div>
      <div class="bd" style="justify-content:center;"><svg id="fig" style="width:100%; height:86%;"></svg></div>
    </div>
  </div>
</div>
""" + note("口径", "本课件所有关键点一律「数值求根 + 解析公式」双口径核对；教材读图值标注为近似。") + r"""
<script>
document.addEventListener("DOMContentLoaded", () => { RL.figure("fig", "ex54", { vw: 860, vh: 520, static: true, asym: false, cross: false }); });
</script>
""" + foot()))

# ---------------- P41 例5-5/5-6③ ----------------
PAGES.append(dict(file="p41-ex56c.html", title="例5-5/5-6③：劳斯求虚轴交点", scripts='<script src="../data/ex54.js"></script>\n', html=
head("例5-5/5-6③：劳斯求虚轴交点", pageattr=' data-page="__PAGENO__"', extra_css=DERIV_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">四阶劳斯阵列</div>
      <div class="bd">
        <div style="font-size:21px;">特征式 <span class="tex">D(s)=s^{4}+5s^{3}+8s^{2}+6s+K_1</span>：</div>
        <table class="act-table" style="font-size:20px;">
          <tr><th>s⁴</th><td>1</td><td>8</td><td>K₁</td></tr>
          <tr><th>s³</th><td>5</td><td>6</td><td></td></tr>
          <tr><th>s²</th><td>34/5=6.8</td><td>K₁</td><td></td></tr>
          <tr><th>s¹</th><td>(40.8−5K₁)/6.8</td><td></td><td></td></tr>
          <tr><th>s⁰</th><td>K₁</td><td></td><td></td></tr>
        </table>
        <div class="hl">令 s¹ 行 = 0：<span class="kw-r">K₁=8.16</span>；辅助方程 <span class="tex">6.8s^{2}+K_1=0</span> → <span class="tex">s=\pm\mathrm{j}1.1</span>。</div>
        <div style="font-size:20.5px; color:var(--muted);">稳定域：0 &lt; K₁ &lt; 8.16。</div>
      </div>
    </div>
    <div class="act-card c">
      <div class="hd">交点标注</div>
      <div class="bd" style="justify-content:center;"><svg id="fig" style="width:100%; height:86%;"></svg></div>
    </div>
  </div>
</div>
""" + note("数值", "精确解 K₁=8.1600、ω=1.0954（数值求根与劳斯互证一致）。") + r"""
<script>
document.addEventListener("DOMContentLoaded", () => { RL.figure("fig", "ex54", { vw: 860, vh: 520, static: true }); });
</script>
""" + foot()))

# ---------------- P42 综合收束：例5-5/5-6 动画 + 例5-7 对照卡 ----------------
PAGES.append(dict(file="p42-ex57.html", title="综合例题收束：例5-5/5-6与例5-7", cx="L2", scripts='<script src="../data/ex54.js"></script>\n<script src="../data/ex57.js"></script>\n', html=
head("综合收束：例5-5/5-6 动画 + 例5-7 对照卡", pageattr=' data-page="__PAGENO__"', extra_css="""
  .row { display:flex; gap:22px; height:100%; min-height:0; }
  .figc { flex:1.25; display:flex; flex-direction:column; overflow:hidden; }
  .figc .bd2 { flex:1; display:grid; place-items:center; background:#fff; padding:6px 8px; min-height:0; }
  .figc svg { width:100%; height:100%; }
  .ctl { display:flex; align-items:center; gap:10px; justify-content:center; padding:6px 0 8px; }
  .btn { background:var(--blue); color:#fff; border:none; border-radius:10px; font-size:18px; font-weight:700; padding:7px 18px; cursor:pointer; }
  .btn.ghost { background:#fff; color:var(--blue); border:2px solid var(--blue); }
  .prog { font-size:17px; color:var(--muted); min-width:56px; }
  .side { flex:1; display:flex; flex-direction:column; gap:14px; min-height:0; }
  .side .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:8px; }
  .kv { background:var(--sky); border-radius:12px; padding:10px 15px; font-size:19px; line-height:1.5; }
""") + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card figc">
      <div class="hd"><span style="flex:1">例5-5/5-6：四分支生长 + ζ=0.5 射线</span></div>
      <div class="bd2"><svg id="fig"></svg></div>
      <div class="ctl">
        <button class="btn" id="play">▶ 播放</button>
        <button class="btn ghost" onclick="ACT.step.reset()">↺ 重置</button>
        <span class="prog" id="prog">0 / 8</span>
      </div>
    </div>
    <div class="side">
      <div class="act-card">
        <div class="hd">例 5-7 对照卡：K₁/[s(s+4)(s²+4s+20)]</div>
        <div class="bd" style="font-size:19px;">
          <div class="kv">渐近线：σ_a=−2，±45°/±135°</div>
          <div class="kv">出射角：θ_p3=−90°（复极点 −2±j4）</div>
          <div class="kv">分离点：s=−2（另有复数分离点 −2±j√6）</div>
          <div class="kv">虚轴交点：±j√10，<span class="kw-r">K₁=260</span>（劳斯 s¹ 行与数值求根互证）</div>
          <div class="kv" style="background:#FDF3EC;">稳定域：0&lt;K₁&lt;260 —— 四阶系统可稳定范围可如此之宽</div>
        </div>
      </div>
    </div>
  </div>
</div>
""" + note("对照", "例5-7（原书图5-10）与例5-5/5-6 同为四阶、同为 ±45° 渐近线，但零极点布局不同 → 轨迹形态截然不同——<span class=\"kw-r\">布局决定形态</span>。") + r"""
<div data-step="1" style="display:none"></div><div data-step="2" style="display:none"></div><div data-step="3" style="display:none"></div><div data-step="4" style="display:none"></div>
<div data-step="5" style="display:none"></div><div data-step="6" style="display:none"></div><div data-step="7" style="display:none"></div><div data-step="8" style="display:none"></div>
<script>
document.addEventListener("DOMContentLoaded", () => {
  const F = RL.figure("fig", "ex54", { vw: 880, vh: 600, zeta: 0.5 });
  const TOTAL = 8, KSTEPS = [0, 0.001, 0.05, 1.0, 4.33, 8.16, 20, 80, 800];
  function paint(K) {
    const kA = KSTEPS[Math.min(K, 8)];
    const f = F.mapK(kA);
    F.setProgress(Math.max(0, Math.min(1, f)));
  }
  RL.wire(TOTAL, paint, { dur: 8000 });
});
</script>
""" + foot()))
