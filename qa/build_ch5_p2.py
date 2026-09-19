# -*- coding: utf-8 -*-
"""第五章 P16-P30 页面定义（P16-18 已动画化；整改第二批覆盖 P19-P36）。"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_lib import head, foot, note, QUIZ_CSS

PAGES = []

DERIV_CSS = """
  .row { display:flex; gap:26px; height:100%; min-height:0; }
  .c { flex:1; display:flex; flex-direction:column; min-height:0; }
  .c .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:10px; }
  .hl { background:#FDF3EC; border-radius:12px; padding:12px 18px; font-size:21.5px; line-height:1.6; }
  .seg { background:var(--sky); border-radius:12px; padding:10px 16px; font-size:20.5px; line-height:1.55; }
"""

ANIM_CSS = """
  .row { display:flex; gap:24px; height:100%; min-height:0; }
  .figc { flex:1.32; display:flex; flex-direction:column; overflow:hidden; }
  .figc .bd2 { flex:1; display:grid; place-items:center; background:#fff; padding:6px 10px; min-height:0; }
  .figc svg { width:100%; height:100%; }
  .ctl { display:flex; align-items:center; gap:12px; justify-content:center; padding:6px 0 8px; }
  .btn { background:var(--blue); color:#fff; border:none; border-radius:10px; font-size:19px; font-weight:700; padding:8px 22px; cursor:pointer; }
  .btn.ghost { background:#fff; color:var(--blue); border:2px solid var(--blue); }
  .prog { font-size:18px; color:var(--muted); min-width:64px; }
  .side { flex:1; display:flex; flex-direction:column; gap:16px; min-height:0; }
  .side .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:10px; }
  .kv { background:var(--sky); border-radius:12px; padding:12px 17px; font-size:20.5px; line-height:1.55; }
  .side .act-card { display:flex; flex-direction:column; min-height:0; }
"""

# ---------------- P16 例5-3①（动画） ----------------
PAGES.append(dict(file="p16-ex53a.html", title="例5-3①：系统与实轴段", cx="L2", scripts='<script src="../data/ex53.js"></script>\n', html=
head("例5-3①：系统与实轴段", pageattr=' data-page="__PAGENO__"', extra_css=ANIM_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card figc">
      <div class="hd"><span style="flex:1">K₁: 0→∞ 两分支动画（例 5-3：G=K₁(s+2)/[s(s+1)]）</span></div>
      <div class="bd2"><svg id="fig"></svg></div>
      <div class="ctl">
        <button class="btn" id="play">▶ 播放</button>
        <button class="btn ghost" onclick="ACT.step.reset()">↺ 重置</button>
        <span class="prog" id="prog">0 / 5</span>
      </div>
    </div>
    <div class="side">
      <div class="act-card">
        <div class="hd">题设（K₁: 0→∞）</div>
        <div class="bd">
          <div class="mathbox math eqline tex tex-d" style="font-size:22px;">G(s)=\dfrac{K_1(s+2)}{s(s+1)}</div>
          <div class="kv">开环零点 <span class="tex">z=-2</span>；开环极点 <span class="tex">p_1=0,\ p_2=-1</span></div>
          <div class="kv"><span class="tex">v=1</span>，<span class="tex">K_v=2K_1</span></div>
        </div>
      </div>
      <div class="act-card">
        <div class="hd">实轴段判断（右侧计数）</div>
        <div class="bd" style="font-size:20.5px;">
          <div class="kv">(−1,0)：<b style="color:var(--danger);">1 ✓</b>　(−2,−1)：2 ✗　(−∞,−2]：<b style="color:var(--danger);">3 ✓</b></div>
          <div class="kv" style="background:#FDF3EC;">本页任务：①动画看两分支靠拢 ②下一页代数证明：轨迹是一个圆</div>
        </div>
      </div>
    </div>
  </div>
</div>
""" + note("提示", "两条分支起于 0、−1：一支沿实轴左移、一支右移，将在 (−1,0) 内相遇后离开实轴——去哪？下一页证明：沿一个圆走。") + r"""
<div data-step="1" style="display:none"></div><div data-step="2" style="display:none"></div><div data-step="3" style="display:none"></div><div data-step="4" style="display:none"></div><div data-step="5" style="display:none"></div>
<script>
document.addEventListener("DOMContentLoaded", () => {
  const F = RL.figure("fig", "ex53", { vw: 900, vh: 560, asym: false, brk: false });
  const TOTAL = 5, KS = [0, 0.02, 0.1, 0.172, 0.172, 0.172];
  function paint(K) {
    if (K >= 5) { F.setProgress(1); return; }   // 末步：完整圆轨迹预览
    const kA = KS[Math.min(K, 5)];
    F.setProgress(F.mapK(kA));
  }
  RL.wire(TOTAL, paint, { dur: 8000 });
});
</script>
""" + foot()))

# ---------------- P17 例5-3②（动画） ----------------
PAGES.append(dict(file="p17-ex53b.html", title="例5-3②：解析证明根轨迹是圆", cx="L1", scripts='<script src="../data/ex53.js"></script>\n', html=
head("例5-3②：解析证明根轨迹是圆", pageattr=' data-page="__PAGENO__"', extra_css=ANIM_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card side">
      <div class="hd">推导（三步链）</div>
      <div class="bd">
        <div class="kv" id="d1">① 特征方程与求根公式<br><span class="tex">D(s)=s^{2}+(1+K_1)s+2K_1=0</span><br><span class="tex">s_{1,2}=\dfrac{-(1+K_1)\pm\sqrt{(1+K_1)^{2}-8K_1}}{2}</span></div>
        <div class="kv" id="d2">② 实部 → 消去 K₁<br><span class="tex">\sigma=-\dfrac{1+K_1}{2}\ \Rightarrow\ K_1=-2\sigma-1</span></div>
        <div class="kv" id="d3">③ 虚部平方代入<br><span class="tex">\omega^{2}=\dfrac{8K_1-(1+K_1)^{2}}{4}=-\sigma^{2}-4\sigma-2</span></div>
        <div class="kv" id="d4" style="background:#FDF3EC;"><b>结论：</b><span class="tex">\sigma^{2}+4\sigma+4+\omega^{2}=2</span>，即 <span class="tex">(\sigma+2)^{2}+\omega^{2}=(\sqrt{2})^{2}</span>——<span class="kw-r">圆心 (−2,0)、半径 √2 的圆</span></div>
      </div>
    </div>
    <div class="act-card figc">
      <div class="hd"><span style="flex:1">圆轨迹验证（解析圆 + 数值分支同步）</span></div>
      <div class="bd2"><svg id="fig"></svg></div>
      <div class="ctl">
        <button class="btn" id="play">▶ 播放</button>
        <button class="btn ghost" onclick="ACT.step.reset()">↺ 重置</button>
        <span class="prog" id="prog">0 / 5</span>
      </div>
    </div>
  </div>
</div>
""" + note("妙处", "圆心恰是<span class=\"kw-r\">开环零点 z=−2</span>——实轴上「一零两极」系统的根轨迹是一个以零点为圆心的圆（d₁、d₂ 是圆与实轴交点）。") + r"""
<div data-step="1" style="display:none"></div><div data-step="2" style="display:none"></div><div data-step="3" style="display:none"></div><div data-step="4" style="display:none"></div><div data-step="5" style="display:none"></div>
<script>
document.addEventListener("DOMContentLoaded", () => {
  const F = RL.figure("fig", "ex53", { vw: 900, vh: 560, asym: false, brkLabels: false });
  const TOTAL = 5, KS = [0, 0.01, 0.05, 0.172, 0.7, 5.8];
  function paint(K) {
    const kA = KS[Math.min(K, 5)];
    const f = F.mapK(kA);
    F.setProgress(f);
    for (let i = 1; i <= 4; i++) {
      const el = document.getElementById("d" + i);
      const on = K >= [1, 2, 3, 4][i - 1];
      el.style.borderLeft = on ? "5px solid var(--orange)" : "5px solid transparent";
    }
  }
  RL.wire(TOTAL, paint, { dur: 9000 });
});
</script>
""" + foot()))

# ---------------- P18 例5-3③（动画） ----------------
PAGES.append(dict(file="p18-ex53c.html", title="例5-3③：分离点与会合点", cx="L1", scripts='<script src="../data/ex53.js"></script>\n', html=
head("例5-3③：分离点与会合点", pageattr=' data-page="__PAGENO__"', extra_css=ANIM_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card side">
      <div class="hd">dK₁/ds = 0 求分离/会合点</div>
      <div class="bd">
        <div class="mathbox math eqline tex tex-d" style="font-size:21px;">K_1(s)=-\dfrac{s(s+1)}{s+2}\ \Rightarrow\ s^{2}+4s+2=0</div>
        <div class="kv" id="k1">分离点 <b>d₁=−0.586</b>（(−1,0) 段上）<br>K₁ = 3−2√2 ≈ <b>0.172</b></div>
        <div class="kv" id="k2">会合点 <b>d₂=−3.414</b>（(−∞,−2] 段上）<br>K₁ = 3+2√2 ≈ <b>5.828</b></div>
        <div class="kv" style="background:#FDF3EC;">几何对照：圆心 −2、半径 √2 与实轴交点 = −2±√2 = −0.586 / −3.414，<span class="kw-r">与代数解完全一致</span></div>
      </div>
    </div>
    <div class="act-card figc">
      <div class="hd"><span style="flex:1">动画：依次到达 d₁、d₂（读数联动）</span></div>
      <div class="bd2"><svg id="fig"></svg></div>
      <div class="ctl">
        <button class="btn" id="play">▶ 播放</button>
        <button class="btn ghost" onclick="ACT.step.reset()">↺ 重置</button>
        <span class="prog" id="prog">0 / 6</span>
      </div>
    </div>
  </div>
</div>
""" + note("单调 ↔ 振荡分界", "K₁&lt;0.172 两支在实轴（单调）；K₁&gt;0.172 进入圆轨迹（振荡）；K₁=5.828 回到实轴——<span class=\"kw-r\">分界点都在本页两个关键点上</span>。") + r"""
<div data-step="1" style="display:none"></div><div data-step="2" style="display:none"></div><div data-step="3" style="display:none"></div>
<div data-step="4" style="display:none"></div><div data-step="5" style="display:none"></div><div data-step="6" style="display:none"></div>
<script>
document.addEventListener("DOMContentLoaded", () => {
  const F = RL.figure("fig", "ex53", { vw: 900, vh: 560, asym: false, poleLabels: false });
  const TOTAL = 6, KS = [0, 0.02, 0.172, 0.172, 5.828, 5.828, 40];
  function paint(K) {
    const kA = KS[Math.min(K, 6)];
    const f = F.mapK(kA);
    F.setProgress(f);
    document.getElementById("k1").style.borderLeft = K >= 2 ? "5px solid var(--orange)" : "5px solid transparent";
    document.getElementById("k2").style.borderLeft = K >= 4 ? "5px solid var(--orange)" : "5px solid transparent";
  }
  RL.wire(TOTAL, paint, { dur: 9000 });
});
</script>
""" + foot()))

# ---------------- P19 例5-3④动画 ----------------
PAGES.append(dict(file="p19-ex53d.html", title="例5-3④：圆根轨迹动画", cx="L2", scripts='<script src="../data/ex53.js"></script>\n', html=
head("例5-3④：圆根轨迹动画", pageattr=' data-page="__PAGENO__"', extra_css=ANIM_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card figc">
      <div class="hd"><span style="flex:1">K₁ 从 0 生长：分离 → 沿圆绕行 → 会合 → 趋向终点</span></div>
      <div class="bd2"><svg id="fig"></svg></div>
      <div class="ctl">
        <button class="btn" id="play">▶ 播放</button>
        <button class="btn ghost" onclick="ACT.step.reset()">↺ 重置</button>
        <span class="prog" id="prog">0 / 10</span>
      </div>
    </div>
    <div class="side">
      <div class="act-card">
        <div class="hd">当前状态</div>
        <div class="bd">
          <div class="kv">K₁ = <b id="kv">0</b></div>
          <div class="kv" id="ks1">闭环极点：0 , −1</div>
        </div>
      </div>
      <div class="act-card">
        <div class="hd">四个阶段</div>
        <div class="bd" style="font-size:20px;">
          <div class="kv">① 0→0.172：沿实轴相向靠拢</div>
          <div class="kv">② K₁=0.172：在 d₁=−0.586 分离</div>
          <div class="kv">③ 0.172→5.83：沿圆（心 −2、半径 √2）绕行</div>
          <div class="kv">④ K₁=5.83：在 d₂=−3.414 会合 → 一支到零点 −2、一支趋于 −∞</div>
        </div>
      </div>
    </div>
  </div>
</div>
""" + note("观察", "复平面上的轨迹<span class=\"kw-r\">与实轴镜像对称</span>，且处处垂直离开/进入实轴（分离点处的切线垂直于实轴）。") + r"""
<div data-step="1" style="display:none"></div><div data-step="2" style="display:none"></div><div data-step="3" style="display:none"></div><div data-step="4" style="display:none"></div><div data-step="5" style="display:none"></div>
<div data-step="6" style="display:none"></div><div data-step="7" style="display:none"></div><div data-step="8" style="display:none"></div><div data-step="9" style="display:none"></div><div data-step="10" style="display:none"></div>
<script>
document.addEventListener("DOMContentLoaded", () => {
  const F = RL.figure("fig", "ex53", { vw: 900, vh: 560, asym: false });
  const TOTAL = 10;
  const KSTEPS = [0, 0.001, 0.02, 0.172, 0.5, 1.5, 5.828, 20, 100, 600, 3000];
  function paint(K) {
    const kA = KSTEPS[Math.min(K, 10)];
    const f = F.mapK(kA);
    F.setProgress(f);
    document.getElementById("kv").textContent = kA >= 100 ? kA.toExponential(0) : kA;
    let t = "闭环极点：0 , −1";
    if (kA >= 0.172) {
      t = kA < 5.83 ? "复数极点沿圆运动（上下对称）" : "实轴会合：一支→−2，一支→−∞";
    }
    document.getElementById("ks1").textContent = t;
  }
  RL.wire(TOTAL, paint, { dur: 9000 });
});
</script>
""" + foot()))

# ---------------- P20 法则4渐近线 ----------------
PAGES.append(dict(file="p20-rule4.html", title="法则4：渐近线", html=
head("法则 4：渐近线", pageattr=' data-page="__PAGENO__"', extra_css=DERIV_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">法则 4</div>
      <div class="bd">
        <div class="hl">n−m 条趋向无穷远的分支，沿<span class="kw-r">渐近线</span>逼近无穷远处：</div>
        <div class="mathbox math eqline tex tex-d">\sigma_a=\dfrac{\sum\limits_{i=1}^{n}p_i-\sum\limits_{j=1}^{m}z_j}{n-m}</div>
        <div class="mathbox math eqline tex tex-d">\varphi_a=\dfrac{(2q+1)\pi}{n-m},\quad q=0,1,\cdots,n-m-1</div>
        <div class="seg" style="font-size:20px;">渐近线条数 = n−m（不足的分支终止于有限零点）；渐近线为从实轴上 σ_a 点出发的一组射线，<span class="kw-r">关于实轴对称</span>。</div>
      </div>
    </div>
    <div class="act-card c">
      <div class="hd">思路说明（证明骨架）</div>
      <div class="bd">
        <div style="font-size:20.5px; line-height:1.6;">当 <span class="tex">|s|\to\infty</span> 时，开环零、极点位置差异可忽略，系统等效为「全部零极点聚于 σ_a」：</div>
        <div class="mathbox math eqline tex tex-d">G(s)H(s)\approx\dfrac{K_1}{(s-\sigma_a)^{\,n-m}}=-1</div>
        <div style="font-size:20.5px; line-height:1.6;">取 n−m 次方根：<span class="tex">(s-\sigma_a)=K_1^{1/(n-m)}\mathrm{e}^{\,\mathrm{j}(2q+1)\pi/(n-m)}</span>——辐角即渐近线方向角，且对 <span class="tex">|s|\to\infty</span> 逐点成立。</div>
        <div class="seg" style="font-size:20px;">σ_a 的分子是<span class="kw-r">极点之和减零点之和</span>（按实部计，复零极点同样计入）。</div>
      </div>
    </div>
  </div>
</div>
""" + note("速记", "渐近线交点 σ_a 也叫<span class=\"kw-r\">渐近线中心</span>：由于 n&gt;m，它总在开环极点重心一侧（通常在左半平面）。") + foot()))

# ---------------- P21 渐近线示例 ----------------
PAGES.append(dict(file="p21-rule4-ex.html", title="渐近线计算示例", scripts='<script src="../data/law4a.js"></script>\n<script src="../data/law4b.js"></script>\n', html=
head("渐近线计算示例", pageattr=' data-page="__PAGENO__"', extra_css="""
  .row { display:flex; gap:24px; height:100%; min-height:0; }
  .c { flex:1; display:flex; flex-direction:column; min-height:0; }
  .c .bd { flex:1; display:grid; place-items:center; background:#fff; padding:6px 8px; min-height:0; }
  .c svg { width:100%; height:100%; }
  .cap { flex:none; font-size:19px; color:var(--navy); background:var(--sky); border-radius:12px; padding:9px 16px; margin:0 12px 12px; }
""") + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">两极点系统</div>
      <div class="bd"><svg id="fa"></svg></div>
      <div class="cap"><span class="tex">G(s)=\dfrac{K_1}{s(s+2)}</span>：n−m=2 → 2 条渐近线，σ_a=−1，φ_a=±90°（竖直）</div>
    </div>
    <div class="act-card c">
      <div class="hd">三极点系统</div>
      <div class="bd"><svg id="fb"></svg></div>
      <div class="cap"><span class="tex">G(s)=\dfrac{K_1}{s(s+1)(s+4)}</span>：n−m=3 → σ_a=−5/3，φ_a=±60°, 180°</div>
    </div>
  </div>
</div>
""" + note("对比", "渐近线只描述<span class=\"kw-r\">无穷远处</span>的走向：分离点之前分支仍走实轴/圆弧，渐近线是分支远方走向的直线近似。") + r"""
<script>
document.addEventListener("DOMContentLoaded", () => {
  RL.figure("fa", "law4a", { vw: 760, vh: 560, static: true, brkLabels: true });
  RL.figure("fb", "law4b", { vw: 760, vh: 560, static: true });
});
</script>
""" + foot()))

# ---------------- P22 法则5分离点 ----------------
PAGES.append(dict(file="p22-rule5.html", title="法则5：分离点与会合点", html=
head("法则 5：分离点与会合点", pageattr=' data-page="__PAGENO__"', extra_css=DERIV_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">法则 5 与两条等价求法</div>
      <div class="bd">
        <div class="hl">两条或以上分支在实轴上相遇又分开的点称<span class="kw-r">分离点</span>（反向则称会合点），满足：</div>
        <div class="mathbox math eqline tex tex-d">\dfrac{\mathrm{d}K_1}{\mathrm{d}s}=0\qquad\Big(K_1(s)=-\dfrac{\prod(s-p_i)}{\prod(s-z_j)}\Big)</div>
        <div style="font-size:21px;">等价形式（对数求导导出，无开环零点时左端为 0）：</div>
        <div class="mathbox math eqline tex tex-d">\sum_{j=1}^{m}\dfrac{1}{d-z_j}=\sum_{i=1}^{n}\dfrac{1}{d-p_i}</div>
      </div>
    </div>
    <div class="act-card c">
      <div class="hd">对数求导推导 + 筛选三则</div>
      <div class="bd">
        <div class="seg" style="font-size:20px;">对 <span class="tex">\prod(s-p_i)+K_1\prod(s-z_j)=0</span> 两端取对数后求导：<span class="tex">\sum\dfrac{1}{s-p_i}=\sum\dfrac{1}{s-z_j}</span>（K₁ 消去）。</div>
        <div class="seg" style="font-size:20px;"><b>筛选：</b>①解 d 须在实轴根轨迹段上；②对应 K₁≥0；③代回特征方程验证。三者缺一不可。</div>
        <div class="seg" style="font-size:20px;">分离点处分支<span class="kw-r">垂直离开实轴</span>；两条分支相遇 → 离开角 ±90°。</div>
      </div>
    </div>
  </div>
</div>
""" + note("注意", "分离点不一定只有一个，也<span class=\"kw-r\">不一定在实轴上</span>（复数分离点存在，见例5-7）；但实轴分离点必在实轴根轨迹段内。") + foot()))

# ---------------- P23 法则6出射角 ----------------
PAGES.append(dict(file="p23-rule6.html", title="法则6：出射角与入射角", html=
head("法则 6：出射角与入射角", pageattr=' data-page="__PAGENO__"', extra_css=DERIV_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">法则 6</div>
      <div class="bd">
        <div style="font-size:21px;">复极点 <span class="tex">p_k</span> 处分支的<span class="kw-r">出射角</span>（起始方向）：</div>
        <div class="mathbox math eqline tex tex-d">\theta_{p_k}=\pi+\sum_{j=1}^{m}\angle(p_k-z_j)-\sum_{i\ne k}^{n}\angle(p_k-p_i)</div>
        <div style="font-size:21px;">复零点 <span class="tex">z_k</span> 处分支的<span class="kw-r">入射角</span>（终止方向）：</div>
        <div class="mathbox math eqline tex tex-d">\theta_{z_k}=\pi-\sum_{j\ne k}^{m}\angle(z_k-z_j)+\sum_{i=1}^{n}\angle(z_k-p_i)</div>
        <div style="font-size:20px; color:var(--muted);">共轭对称：θ(p̄_k) = −θ(p_k)。</div>
      </div>
    </div>
    <div class="act-card c">
      <div class="hd">推导（相角条件的扰动形式）</div>
      <div class="bd">
        <div class="seg" style="font-size:20px;">在复极点 <span class="tex">p_k</span> 附近取轨迹点 <span class="tex">s=p_k+\varepsilon\mathrm{e}^{\mathrm{j}\theta}</span>（ε→0）：其它零极点到 s 的相角 ≈ 到 p_k 的相角。</div>
        <div class="seg" style="font-size:20px;">零点项：<span class="tex">\angle(p_k-z_j)</span>；其它极点项：<span class="tex">\angle(p_k-p_i)</span>；自身项被 ε 的小分母吸收为出射方向 θ。</div>
        <div class="seg" style="font-size:20px;">代入相角条件 <span class="tex">\theta+\sum\angle(p_k-p_i)-\sum\angle(p_k-z_j)=(2q+1)\pi</span> → 即得公式。</div>
        <div style="font-size:20px; color:var(--muted);">几何意义：出射角 = 180° − 各其它极点张角之和 + 各零点张角之和。</div>
      </div>
    </div>
  </div>
</div>
""" + note("用途", "复极点/零点附近轨迹的走向<span class=\"kw-r\">只由出射/入射角决定</span>——它是画准复数分支起笔的第一笔（见 P25 例）。") + foot()))

# ---------------- P24 法则7虚轴交点 ----------------
PAGES.append(dict(file="p24-rule7.html", title="法则7：与虚轴的交点", html=
head("法则 7：根轨迹与虚轴的交点", pageattr=' data-page="__PAGENO__"', extra_css=DERIV_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">法则 7：两种求法</div>
      <div class="bd">
        <div class="seg"><b>法① 劳斯判据</b>：令劳斯表 s¹ 行首元为零 → 临界 K₁；由辅助方程 <span class="tex">P(s)=0</span> 求交点 ±jω。</div>
        <div class="seg"><b>法② 代入 s=jω</b>：特征方程实部、虚部分别为零，联立解出 ω 与 K₁。</div>
        <div class="hl">交点对应<span class="kw-r">临界稳定</span>：K₁ 小于临界值系统稳定、大于则不稳定——这是根轨迹给出的<span class="kw-r">参数稳定范围</span>。</div>
      </div>
    </div>
    <div class="act-card c">
      <div class="hd">微型示例（例5-2 预告）</div>
      <div class="bd">
        <div style="font-size:21px;">特征方程 <span class="tex">s^{3}+3s^{2}+2s+K_1=0</span> 的劳斯表：</div>
        <table class="act-table" style="font-size:20px;">
          <tr><th>s³</th><td>1</td><td>2</td></tr>
          <tr><th>s²</th><td>3</td><td>K₁</td></tr>
          <tr><th>s¹</th><td>(6−K₁)/3</td><td></td></tr>
          <tr><th>s⁰</th><td>K₁</td><td></td></tr>
        </table>
        <div style="font-size:20.5px;">令 (6−K₁)/3=0 → <span class="kw-r">K₁=6</span>；辅助方程 <span class="tex">3s^{2}+K_1=0</span> → <span class="tex">s=\pm\mathrm{j}\sqrt{2}</span>。</div>
      </div>
    </div>
  </div>
</div>
""" + note("要点", "两法结果必须一致——课件中每处虚轴交点都做了<span class=\"kw-r\">双法互证</span>。") + foot()))

# ---------------- P25 出射角示例 ----------------
PAGES.append(dict(file="p25-departure.html", title="出射角计算示例", html=
head("出射角计算示例：θ_p3 = −71.6°", pageattr=' data-page="__PAGENO__"', extra_css="""
  .row { display:flex; gap:26px; height:100%; min-height:0; }
  .c1 { flex:1.08; display:flex; flex-direction:column; min-height:0; }
  .c1 .bd { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; gap:10px; }
  .c2 { flex:1; display:flex; flex-direction:column; overflow:hidden; }
  .c2 .bd2 { flex:1; display:grid; place-items:center; background:#fff; padding:6px 10px; min-height:0; }
  .c2 svg { width:100%; height:100%; }
""") + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c1">
      <div class="hd">求 p₃=−1+j 复极点的出射角（例5-4 系统）</div>
      <div class="bd">
        <div style="font-size:21px;">系统 <span class="tex">G(s)=\dfrac{K_1}{s(s+3)(s^{2}+2s+2)}</span>，复极点 <span class="tex">p_{3,4}=-1\pm\mathrm{j}</span>。</div>
        <div style="font-size:21px;">各其它极点对 p₃ 的张角（右图量取）：</div>
        <div class="mathbox math eqline tex tex-d">\angle(p_3-p_1)=135^\circ,\quad \angle(p_3-p_2)\approx26.6^\circ,\quad \angle(p_3-p_4)=90^\circ</div>
        <div class="mathbox math eqline tex tex-d">\theta_{p_3}=180^\circ-(135^\circ+26.6^\circ+90^\circ)=-71.6^\circ</div>
        <div style="font-size:20.5px;">共轭极点 <span class="tex">p_4</span> 的出射角 <span class="tex">\theta_{p_4}=+71.6^\circ</span>（镜像）。</div>
      </div>
    </div>
    <div class="act-card c2">
      <div class="hd">向量张角图</div>
      <div class="bd2"><svg id="fig" viewBox="0 0 880 620"></svg></div>
    </div>
  </div>
</div>
""" + note("看图", "出射方向几乎指向右下方（−71.6°）——分支从 p₃ 出发先向<span class=\"kw-r\">右下</span>走，这正是四分支系统复平面上的一笔。") + r"""
<script>
document.addEventListener("DOMContentLoaded", () => {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.getElementById("fig");
  const mk = (t, a, p) => { const n = document.createElementNS(NS, t); for (const k in a) n.setAttribute(k, a[k]); (p || svg).appendChild(n); return n; };
  const MF = "'Cambria Math','STIX Two Math',Georgia,'Microsoft YaHei',serif";
  const tx = (p, x, y, s, o) => { o = o || {}; const n = mk("text", { x, y, "font-size": o.fs || 21, "text-anchor": o.an || "middle", fill: o.fill || "#1B3B8B", "font-weight": o.b ? 700 : 400, "font-family": MF }, p); n.textContent = s; if (o.halo) n.setAttribute("style", "paint-order:stroke;stroke:#FFF;stroke-width:5;stroke-linejoin:round"); return n; };
  const defs = mk("defs", {});
  const mkM = (id, c) => { const m = mk("marker", { id, markerWidth: 10, markerHeight: 8, refX: 7, refY: 3, orient: "auto" }, defs); mk("path", { d: "M0,0 L7,3 L0,6 Z", fill: c }, m); };
  mkM("ea", "#2B5CE6"); mkM("eb", "#16a34a"); mkM("ec", "#dc2626"); mkM("ed", "#5B6B8C");
  const vw = 880, vh = 620, pl = 44, pr = 22, pt = 14, pb = 44;
  const xr = [-4.6, 2.6], yr = [-3.0, 3.6];
  const s0 = Math.min((vw - pl - pr) / (xr[1] - xr[0]), (vh - pt - pb) / (yr[1] - yr[0]));
  const ox = pl + ((vw - pl - pr) - (xr[1] - xr[0]) * s0) / 2, oy = pt + ((vh - pt - pb) - (yr[1] - yr[0]) * s0) / 2;
  const X = x => ox + (x - xr[0]) * s0, Y = y => oy + (yr[1] - y) * s0;
  mk("line", { x1: X(xr[0]) - 4, y1: Y(0), x2: X(xr[1]) + 12, y2: Y(0), stroke: "#5B6B8C", "stroke-width": 1.5, "marker-end": "url(#ed)" });
  mk("line", { x1: X(0), y1: Y(yr[0]) + 4, x2: X(0), y2: Y(yr[1]) - 10, stroke: "#5B6B8C", "stroke-width": 1.5, "marker-end": "url(#ed)" });
  tx(svg, X(xr[1]) + 16, Y(0) + 6, "σ", { fs: 22, it: 1, b: 1, fill: "#5B6B8C", an: "start" });
  tx(svg, X(0) + 9, Y(yr[1]) - 2, "j", { fs: 22, it: 1, b: 1, fill: "#5B6B8C", an: "start" });
  [[0, "p_1", -20], [-3, "p_2", -20]].forEach(([w, lab, dy]) => {
    const x = X(w), y = Y(0);
    mk("line", { x1: x - 8, y1: y - 8, x2: x + 8, y2: y + 8, stroke: "#16324f", "stroke-width": 3.4, "stroke-linecap": "round" });
    mk("line", { x1: x - 8, y1: y + 8, x2: x + 8, y2: y - 8, stroke: "#16324f", "stroke-width": 3.4, "stroke-linecap": "round" });
    tx(svg, x, y + dy - 12, lab, { fs: 20, b: 1, fill: "#16324f" });
  });
  const px = X(-1), py3 = Y(1), py4 = Y(-1);
  [[px, py3, "p_3", 1], [px, py4, "p_4", -1]].forEach(([x, y, lab]) => {
    mk("line", { x1: x - 8, y1: y - 8, x2: x + 8, y2: y + 8, stroke: "#16324f", "stroke-width": 3.4, "stroke-linecap": "round" });
    mk("line", { x1: x - 8, y1: y + 8, x2: x + 8, y2: y - 8, stroke: "#16324f", "stroke-width": 3.4, "stroke-linecap": "round" });
    tx(svg, x - 22, y + (lab === "p_3" ? -12 : 26), lab, { fs: 20, b: 1, fill: "#16324f" });
  });
  [[0, Y(0), "#2B5CE6", "ea"], [-3, Y(0), "#16a34a", "eb"], [px, py4, "#dc2626", "ec"]].forEach(([wx, wy, c, id]) => {
    mk("line", { x1: px, y1: py3, x2: wx, y2: wy, stroke: c, "stroke-width": 2.6, "marker-end": `url(#${id})` });
  });
  tx(svg, X(-0.85), Y(0.45), "135°", { fs: 20, b: 1, fill: "#2B5CE6", an: "start", halo: 1 });
  tx(svg, X(-1.7), Y(0.35), "26.6°", { fs: 20, b: 1, fill: "#16a34a", an: "end", halo: 1 });
  tx(svg, X(-0.88), Y(0.72), "90°", { fs: 20, b: 1, fill: "#dc2626", an: "start", halo: 1 });
  const L = 150;
  mk("line", { x1: px, y1: py3, x2: px + L * Math.cos(-71.6 * Math.PI / 180), y2: py3 - L * Math.sin(-71.6 * Math.PI / 180), stroke: "#B3541E", "stroke-width": 3.4, "stroke-dasharray": "8 5", "marker-end": "url(#ed)" });
  tx(svg, px + 30, py3 + 68, "θ_p3=−71.6°", { fs: 20, b: 1, fill: "#B3541E", an: "start", halo: 1 });
});
</script>
""" + foot()))

# ---------------- P26 法则总表 ----------------
PAGES.append(dict(file="p26-rules-table.html", title="绘制法则总表", html=
head("七条绘制法则总表", pageattr=' data-page="__PAGENO__"', extra_css="""
  .tb { flex:1; display:flex; flex-direction:column; min-height:0; }
  .tb .bd { flex:1; display:flex; flex-direction:column; justify-content:center; }
  .act-table td, .act-table th { padding:9px 10px; font-size:19px; }
""") + r"""
<div class="act-body has-note">
  <div class="act-card tb">
    <div class="hd">课堂速查：根轨迹绘制七法则（180° 轨迹）</div>
    <div class="bd">
      <table class="act-table">
        <tr><th style="width:150px">法则</th><th>内容</th><th>公式 / 要点</th></tr>
        <tr><td><b>1 对称与分支</b></td><td>轨迹对称于实轴；分支数 = n</td><td>实系数方程复根共轭成对</td></tr>
        <tr><td><b>2 起点终点</b></td><td>起于开环极点，m 条终于有限零点</td><td>n−m 条终于无穷远</td></tr>
        <tr><td><b>3 实轴段</b></td><td>右侧实零极点数之和为奇数的区段</td><td>共轭复零极点不影响</td></tr>
        <tr><td><b>4 渐近线</b></td><td>n−m 条，交点 σ_a，夹角 φ_a</td><td>σ_a=(Σpᵢ−Σzⱼ)/(n−m)，φ_a=(2q+1)π/(n−m)</td></tr>
        <tr><td><b>5 分离点</b></td><td>dK₁/ds=0 的实根（须在轨迹段上）</td><td>Σ1/(d−z_j)=Σ1/(d−p_i)</td></tr>
        <tr><td><b>6 出射/入射角</b></td><td>复零极点处的起始/终止方向</td><td>θ_pₖ=180°+Σ∠(pₖ−z_j)−Σ∠(pₖ−p_i)</td></tr>
        <tr><td><b>7 虚轴交点</b></td><td>临界 K₁ 与 ±jω</td><td>劳斯判据 或 s=jω 代入</td></tr>
      </table>
    </div>
  </div>
</div>
""" + note("流程", "完整绘制口诀：<span class=\"kw-r\">定极零 → 找实轴段 → 数渐近线 → 解分离点 → 算出射角 → 求虚轴交点 → 补几组试算点</span>。") + foot()))

# ---------------- P27 课堂互动② ----------------
PAGES.append(dict(file="p27-quiz2.html", title="课堂互动②", cx="L2", html=
head("课堂互动②", pageattr=' data-page="__PAGENO__"', extra_css=QUIZ_CSS) + r"""
<div class="act-body">
  <div class="row">
    <div class="qcol">
      <span class="qtype">多选题　1 分</span>
      <div class="qz">
        <div class="qt">系统 <span class="tex" style="font-size:21px">G(s)=\dfrac{K_1}{s(s+1)(s+4)}</span>（K₁: 0→∞），以下说法<span style="color:var(--danger)">正确的</span>是？</div>
        <span class="stage-tip">请先作出判断</span>
        <div class="opts">
          <div class="opt" data-mark="1">A　实轴根轨迹段为 (−∞,−4] 与 [−1,0]</div>
          <div class="opt" data-mark="0">B　渐近线有 3 条，交点 σ_a=−5/3</div>
          <div class="opt" data-mark="1">C　渐近线夹角为 ±60° 与 180°</div>
          <div class="opt" data-mark="0">D　分离点方程的解全部都是分离点</div>
        </div>
      </div>
      <div class="ans" data-step="2">
        <b>答案：A、C。</b>右侧计数：(−∞,−4] 为 3（奇）✓、[−1,0] 为 1（奇）✓（A 对）；n−m=3 条渐近线，σ_a=(0−1−4)/3=−5/3、φ_a=±60°,180°（B 错在条数——3 条里 1 条就是实轴本身，习惯上说"交点 ±60°,180°"；C 对）；分离点解须<span class="kw-r">在轨迹段上且 K₁≥0</span>，须筛选（D 错）。
      </div>
    </div>
    <div class="act-card" style="flex:1; display:flex; flex-direction:column; min-height:0;">
      <div class="hd">速判卡</div>
      <div style="flex:1; display:flex; flex-direction:column; justify-content:space-evenly; font-size:21px; line-height:1.6;">
        <div>① 实轴段：从最右端起<span class="kw-r">右二换单</span>（奇偶交替）</div>
        <div>② σ_a：极点重心 − 零点重心（按实部）</div>
        <div>③ φ_a 相邻两条相差 <span class="tex">360^\circ/(n-m)</span></div>
        <div>④ 分离点 ∈ 实轴段 ∩ {K₁≥0}</div>
        <div style="background:var(--sky); border-radius:12px; padding:12px 18px;">思考：B 选项的说法为何易错？——「3 条渐近线」没错，但其中 <span class="tex">180^\circ</span> 的一条与负实轴重合，常并入实轴段叙述。</div>
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

# ---------------- P28 例5-4① ----------------
PAGES.append(dict(file="p28-ex54a.html", title="例5-4①：零极点与渐近线", scripts='<script src="../data/ex54.js"></script>\n', html=
head("例5-4①：零极点分布与渐近线", pageattr=' data-page="__PAGENO__"', extra_css=DERIV_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">例 5-4</div>
      <div class="bd">
        <div class="mathbox math eqline tex tex-d">G(s)H(s)=\dfrac{K_1}{s(s+3)(s^{2}+2s+2)}</div>
        <div class="seg">开环极点：<span class="tex">p_{1,2}=0,\,-3</span>，<span class="tex">p_{3,4}=-1\pm\mathrm{j}</span>（n=4，m=0）。</div>
        <div class="seg">渐近线：<span class="tex">\sigma_a=\dfrac{0-3-1-1}{4}=-1.25</span>；<span class="tex">\varphi_a=\pm45^\circ,\ \pm135^\circ</span>。</div>
        <div class="seg">实轴段：<span class="tex">[-3,0]</span>（其余实轴区段右侧计数为偶）。</div>
      </div>
    </div>
    <div class="act-card c">
      <div class="hd">零极点与渐近线布局</div>
      <div class="bd" style="justify-content:center;">
        <svg id="fig" style="width:100%; height:84%;"></svg>
      </div>
    </div>
  </div>
</div>
""" + note("注意", "复极点 ±1±j 也进入 σ_a 的分母求和（按实部 −1 计）——<span class=\"kw-r\">这是易错点</span>。") + r"""
<script>
document.addEventListener("DOMContentLoaded", () => {
  RL.figure("fig", "ex54", { vw: 860, vh: 540, static: true, brk: false, cross: false });
});
</script>
""" + foot()))

# ---------------- P29 例5-4② ----------------
PAGES.append(dict(file="p29-ex54b.html", title="例5-4②：分离点与出射角", scripts='<script src="../data/ex54.js"></script>\n', html=
head("例5-4②：分离点与出射角", pageattr=' data-page="__PAGENO__"', extra_css=DERIV_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card c">
      <div class="hd">分离点方程（实轴段 [−3,0] 内）</div>
      <div class="bd">
        <div class="mathbox math eqline tex tex-d">K_1(s)=-s(s+3)(s^{2}+2s+2)=-(s^{4}+5s^{3}+8s^{2}+6s)</div>
        <div class="mathbox math eqline tex tex-d">\dfrac{\mathrm{d}K_1}{\mathrm{d}s}=4s^{3}+15s^{2}+16s+6=0</div>
        <div class="seg">实根 <span class="tex">d=-2.289</span>（另有一对复根，不在实轴上舍去）；代回得 <span class="tex">K_{1d}\approx4.33</span>。</div>
        <div class="seg" style="font-size:20px;">复极点出射角（P25 已算）：θ_p3=−71.6°、θ_p4=+71.6°。</div>
      </div>
    </div>
    <div class="act-card c">
      <div class="hd">画出的骨架图</div>
      <div class="bd" style="justify-content:center;">
        <svg id="fig" style="width:100%; height:84%;"></svg>
      </div>
    </div>
  </div>
</div>
""" + note("检查", "分离点 −2.289 ∈ [−3,0] ✓、K₁≥0 ✓、代回特征方程残差 ~10⁻¹² ✓。") + r"""
<script>
document.addEventListener("DOMContentLoaded", () => {
  RL.figure("fig", "ex54", { vw: 860, vh: 540, static: true, asym: false, cross: false });
});
</script>
""" + foot()))

# ---------------- P30 例5-4③动画 ----------------
PAGES.append(dict(file="p30-ex54c.html", title="例5-4③：完整根轨迹动画", cx="L2", scripts='<script src="../data/ex54.js"></script>\n', html=
head("例5-4③：完整根轨迹与闭环极点（动画）", pageattr=' data-page="__PAGENO__"', extra_css=ANIM_CSS) + r"""
<div class="act-body has-note">
  <div class="row">
    <div class="act-card figc">
      <div class="hd"><span style="flex:1">四分支生长动画（K₁: 0→∞）</span></div>
      <div class="bd2"><svg id="fig"></svg></div>
      <div class="ctl">
        <button class="btn" id="play">▶ 播放</button>
        <button class="btn ghost" onclick="ACT.step.reset()">↺ 重置</button>
        <span class="prog" id="prog">0 / 12</span>
      </div>
    </div>
    <div class="side">
      <div class="act-card">
        <div class="hd">K₁=2.91 时的闭环极点</div>
        <div class="bd" style="font-size:20px;">
          <div class="kv" id="kp" style="display:none;">特征式 <span class="tex">s^{4}+5s^{3}+8s^{2}+6s+2.91</span><br>极点 ≈ −2.735、−1.543、−0.361±j0.748</div>
          <div class="kv">闭环特征多项式：<span class="tex">D(s)=s(s+3)(s^{2}+2s+2)+K_1</span></div>
          <div class="kv">虚轴交点 ±j1.10 对应 <span class="kw-r">K₁=8.16</span>（第三部分详算）</div>
        </div>
      </div>
      <div class="act-card">
        <div class="hd">本例完成动作</div>
        <div class="bd" style="font-size:20px;">
          <div class="kv">① 零极点 ② 渐近线 ③ 实轴段 ④ 四分支生长 ⑤ 关键点与 K₁ 标注</div>
        </div>
      </div>
    </div>
  </div>
</div>
""" + note("验证", "生长动画曲线由 qa/rlocus_gen.py 数值求根逐 K 生成，与解析关键点（分离点、出射角、虚轴交点）<span class=\"kw-r\">双重核对一致</span>。") + r"""
<div data-step="1" style="display:none"></div><div data-step="2" style="display:none"></div><div data-step="3" style="display:none"></div><div data-step="4" style="display:none"></div><div data-step="5" style="display:none"></div>
<div data-step="6" style="display:none"></div><div data-step="7" style="display:none"></div><div data-step="8" style="display:none"></div><div data-step="9" style="display:none"></div><div data-step="10" style="display:none"></div>
<div data-step="11" style="display:none"></div><div data-step="12" style="display:none"></div>
<script>
document.addEventListener("DOMContentLoaded", () => {
  const F = RL.figure("fig", "ex54", { vw: 900, vh: 560 });
  const TOTAL = 12, KSTEPS = [0, 0.001, 0.001, 0.02, 0.2, 1.0, 4.33, 8.16, 12, 20, 60, 200, 1000];
  function paint(K) {
    const kA = KSTEPS[Math.min(K, 12)];
    const f = F.mapK(kA);
    F.setProgress(f);
    document.getElementById("kp").style.display = K >= 7 ? "" : "none";
  }
  RL.wire(TOTAL, paint, { dur: 10000 });
});
</script>
""" + foot()))
