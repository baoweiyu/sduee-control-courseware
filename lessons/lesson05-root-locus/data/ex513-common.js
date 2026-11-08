/* 例5-6 / 例5-13 共用根轨迹与四步演示：P50 强调距离试探，P51 强调 ζ 射线。 */
window.RL = window.RL || { data: {} };
RL.initEx513 = function (mode) {
  const F = RL.figure("fig", "ex54", {
    vw: 960, vh: 600, xlim: [-6.4, 2.0], ylim: [-4.8, 4.8],
    asym: false, zoom: false, pzLabels: false, brkDots: false, crossSq: false
  });
  const PT = [-0.4093, 0.7089];
  const poles = [[0, 0], [-3, 0], [-1, 1], [-1, -1]];
  const stage = document.getElementById("stage");
  const calc = document.getElementById("calc");
  const labels = mode === "trial"
    ? ["① 生长完整根轨迹", "② 连接试验点与各开环极点", "③ 标出试验点", "④ 用幅值条件求增益"]
    : ["① 生长完整根轨迹", "② 作 ζ=0.5 阻尼射线", "③ 标出射线与轨迹交点", "④ 用幅值条件求增益"];
  function point(p, color) {
    F.mk("circle", { cx: F.X(p[0]), cy: F.Y(p[1]), r: 11, fill: color,
      stroke: "#fff", "stroke-width": 2.8 }, F.gDyn);
  }
  function paint(k) {
    /* 第一阶段完成后保留同一幅完整底图，后续仅切换本页辅助标记。 */
    F.setAllF(k >= 1 ? 1 : 0);
    if (k >= 2 && mode === "trial") {
      poles.forEach(p => F.mk("line", {
        x1: F.X(PT[0]), y1: F.Y(PT[1]), x2: F.X(p[0]), y2: F.Y(p[1]),
        stroke: "#B3541E", "stroke-width": 2.4, "stroke-dasharray": "7 6", opacity: .9
      }, F.gDyn));
    }
    if (k >= 2 && mode === "zeta") {
      const T = 4.5, c = Math.cos(Math.PI / 3), sn = Math.sin(Math.PI / 3);
      [1, -1].forEach(sg => F.mk("line", {
        x1: F.X(0), y1: F.Y(0), x2: F.X(-c * T), y2: F.Y(sg * sn * T),
        stroke: RL.REF.color.zeta, "stroke-width": 3,
        "stroke-dasharray": RL.REF.dash.zeta, opacity: .9
      }, F.gDyn));
      F.tx(F.gDyn, F.X(-2.55), F.Y(3.05) - 12, "β=60°", {
        fs: 25, fill: RL.REF.color.zeta, b: 1
      });
    }
    if (k >= 3) {
      const color = mode === "trial" ? "#D63A2F" : RL.REF.color.zeta;
      point(PT, color);
      if (mode === "zeta") point([PT[0], -PT[1]], color);
      F.tx(F.gDyn, F.X(PT[0]) - 24, F.Y(PT[1]) - 30,
        mode === "trial" ? "试验点" : "交点", { fs: 24, fill: color, b: 1, an: "end" });
    }
    stage.textContent = k ? labels[k - 1] : "点击播放或按“下一步”开始";
    if (mode === "trial") {
      calc.textContent = k >= 4
        ? "K₁ = 0.819 × 2.686 × 0.659 × 1.808 ≈ 2.62"
        : k >= 2
          ? "距离：0.819、2.686、0.659、1.808（数字放在图外，避免遮挡）"
          : "试验点 s = −0.409 + j0.709";
    } else {
      calc.textContent = k >= 4
        ? "K₁ = |s|·|s+3|·|s²+2s+2| ≈ 2.62"
        : k >= 3
          ? "s₁,₂ = −0.409 ± j0.709"
          : k >= 2
            ? "ζ=0.5  ⇔  β=arccos ζ=60°"
            : "阻尼比 ζ=0.5";
    }
  }
  RL.wire(4, paint, {
    figs: [F], FS: [0, .55, .72, .86, 1], dur: 9000,
    frame: (f, k) => { if (k >= 1) F.setAllF(1); }
  });
  document.getElementById("rst").onclick = () => ACT.step.reset();
  const q = new URLSearchParams(location.search);
  if (q.has("step")) {
    const n = Math.max(0, Math.min(4, parseInt(q.get("step"), 10) || 0));
    for (let i = 0; i < n; i++) ACT.step.next();
  }
};
