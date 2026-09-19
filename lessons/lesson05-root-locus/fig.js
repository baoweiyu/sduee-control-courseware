/* 第五章根轨迹共享绘图库（v2，2026-09-15；视觉规范 RL-DRAW-1.1）
   v2 变更（对应用户 9-15 修改方向）：
   - ▶连贯播放：rAF 驱动的连续 K 进度，多分支共享同一 K 同步生长，经过关键点弹徽标；
   - ⧉分步播放：按分支/区段逐段生长，其余分支弱化至 opacity≈0.15（淡化成底轨）；
   - 缩放：滚轮缩放（锚定光标）+ 拖动平移 + 双击/按钮复位；刻度网格随视窗动态重算，
     横纵恒 1:1（view = 中心点 + 单一比例尺，绝不拉伸 viewBox）；
   - 图面瘦身：数字读数（当前 K、当前根坐标、关键 K 值）全部移出图外，由页面联动面板
     逐帧刷新；图内只留零极点 ×○、关键点记号（红点/方块）、方向箭头、渐近线与 σₐ/角度标注；
   - 分支深色化：PAL 改为深蓝/深绿/深红/深紫/深橙（投影可读），共轭分组同色。
   数据一律来自 qa/gen_ch5_samples.py 预计算。 */
window.RL = window.RL || { data: {} };
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const REF = Object.freeze({
    viewBox: { width: 960, height: 600 },
    pad: { left: 60, right: 28, top: 30, bottom: 48 },
    plot: { x0: 60, x1: 932, y0: 30, y1: 552 },
    font: { family: '"Cambria Math","STIX Two Math","Lesson05 STIX2",Georgia,"Times New Roman","Microsoft YaHei",serif', axis: 28, major: 28, badge: 24, minor: 24, legend: 22, tick: 21, helper: 20, subScale: .72, subDy: 6, halo: 6, haloSmall: 4 },
    color: { bg: "#FFFFFF", title: "#1D3FA0", branch: ["#1D3FA0", "#0E7A36", "#C02A20", "#7B21C8", "#C2410C"], axis: "#5B6B8C", secondary: "#8A97B5", ink: "#16324F", asymptote: "#F5821F", zeta: "#7A4E2D", badgeBg: "#FFFFFF", warningBg: "#FDF1EF", highlight: "#FFE28A", stableFill: "#C9D6F2", track: "#C9D6F2", grid: "#E7EDF9", focus: "#D63A2F", keypoint: "#B3541E" },
    opacity: { grid: .75, stableFill: .18, track: .90, asymptote: .90, keyGlow: .22, badge: .96, trail1: 0, trail2: 0, trail3: 0, weak: .15 },
    stroke: { axis: 2.2, branch: 5, realAxis: 7, track: 2.2, asymptote: 2.4, zeta: 2.4, guide: 1.8, keyGuide: 2, pole: 4, zero: 4, crossing: 3, point: 2, arrowOutline: 1.2 },
    marker: { poleRadius: 12, zeroRadius: 12, breakawayRadius: 8, breakawayGlowRadius: 14, crossingSize: 18, repeatedRootCircleRadius: 11, repeatedRootCrossRadius: 9, movingPointRadius: 11, trailRadius: 0, trailCount: 0, trailStride: 4, trailWindow: 20, arrowWidth: 18, arrowHeight: 14, arrowGap: 8, asymCenterRadius: 18, angleArcRadius: 38 },
    layout: { legend: { x: 690, y: 48, width: 230, rowHeight: 40, lineWidth: 46 }, question: { x: 76, y: 52, maxWidth: 360 }, kBadge: { x: 790, y: 530, fs: 24, padX: 10, padY: 7, radius: 9 }, progress: { x: 650, y: 540, width: 230, height: 14, radius: 7 }, labelMinGap: 12, edgeMinGap: 12, calloutMin: 26, calloutMax: 64 },
    animation: { defaultDuration: 9000, focusDuration: 11000, eventPause: 1000, progressMode: "log10", maxFlashingObjects: 1 },
    dash: { asymptote: "8 6", zeta: "3 5", highlight: "2 4" },
    threshold: { minContrastNormal: 4.5, minContrastLarge: 3, minScreenTick: 14, minScreenLabel: 16, targetCoverage: .65, hardMinCoverage: .60, equalScaleError: .01, maxLabelOverlap: 0, maxOutOfFrame: 0, endpointErrorPx: 1 }
  });
  const MF = REF.font.family;
  const PAL = REF.color.branch;
  const AX = REF.color.axis, ASY = REF.color.asymptote, TRACK = REF.color.track,
        FOCUS = REF.color.focus, INK = REF.color.ink, SEG = REF.color.title, GRID = REF.color.grid;

  function mk(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  /* 文字：支持 _{下标} / ^{上标}，默认白色 halo 防压线 */
  function tx(parent, x, y, s, o) {
    o = o || {};
      const n = mk("text", { x, y, "font-size": o.fs || REF.font.badge, "text-anchor": o.an || "middle",
      fill: o.fill || "#1B3B8B", "font-weight": o.b ? 700 : 400,
      "font-style": o.it ? "italic" : "normal", "font-family": MF }, parent);
    const esc = t => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    let html = "", dy = 0; // 0=基线 6=下标 -6=上标
    for (const p of String(s).split(/([_^]\{[^}]*\})/)) {
      if (!p) continue;
      let nd = 0, content = p, small = false;
      if (p.startsWith("_{")) { nd = 6; content = p.slice(2, -1); small = true; }
      else if (p.startsWith("^{")) { nd = -6; content = p.slice(2, -1); small = true; }
      const d = nd - dy; dy = nd;
      html += `<tspan${d ? ` dy="${d}"` : ""}${small ? ' font-size="72%"' : ""}>${esc(content)}</tspan>`;
    }
    n.innerHTML = html;
    if (o.halo !== false)
      n.setAttribute("style", `paint-order:stroke;stroke:#FFF;stroke-width:${REF.font.halo};stroke-linejoin:round`);
    return n;
  }
  function arrowDef(svg, id, color) {
    const defs = mk("defs", {}, svg);
    const m = mk("marker", { id, markerWidth: 10, markerHeight: 8, refX: 7, refY: 3, orient: "auto" }, defs);
    mk("path", { d: "M0,0 L7,3 L0,6 Z", fill: color }, m);
  }
  /* 折线对矩形裁剪（Liang-Barsky），防假平尾；输入像素坐标 */
  function clipPoly(pts, r) {
    const inside = (x, y) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
    const inter = (a, b) => {
      const dx = b[0] - a[0], dy = b[1] - a[1];
      let t0 = 0, t1 = 1;
      for (const [pp, qq] of [[-dx, a[0] - r.x0], [dx, r.x1 - a[0]], [-dy, a[1] - r.y0], [dy, r.y1 - a[1]]]) {
        if (pp === 0) { if (qq < 0) return null; continue; }
        const t = qq / pp;
        if (pp < 0) { if (t > t1) return null; if (t > t0) t0 = t; }
        else { if (t < t0) return null; if (t < t1) t1 = t; }
      }
      return [a[0] + dx * t0, a[1] + dy * t0, a[0] + dx * t1, a[1] + dy * t1];
    };
    const subs = []; let cur = null;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], ai = inside(a[0], a[1]), bi = inside(b[0], b[1]);
      if (ai && bi) { if (!cur) { cur = [a]; subs.push(cur); } cur.push(b); }
      else {
        const sg = inter(a, b);
        if (!sg) { cur = null; continue; }
        if (ai) { if (!cur) { cur = [a]; subs.push(cur); } else cur.push(a); cur.push([sg[2], sg[3]]); cur = null; }
        else if (bi) { cur = [[sg[0], sg[1]]]; subs.push(cur); cur.push(b); }
        else { cur = [[sg[0], sg[1]], [sg[2], sg[3]]]; subs.push(cur); cur = null; }
      }
    }
    return subs;
  }
  const toPath = subs => subs.map(sp => "M" + sp.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join("L")).join("");
  function niceStep(raw) {
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    for (const m of [1, 2, 2.5, 5, 10]) if (raw <= m * p) return m * p;
    return 10 * p;
  }
  /* 读数格式化：K 值与复数根（面板用；负号用 U+2212 与页面一致） */
  function fmtK(K) {
    if (K == null || !isFinite(K)) return "→ ∞";
    if (K >= 100) return String(Math.round(K));
    if (K >= 10) return K.toFixed(1).replace(/\.0$/, "");
    if (K >= 1) return K.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    if (K <= 0) return "0";
    return K.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
  }
  function fmtC(p, digs) {
    const d = digs == null ? 2 : digs;
    let re = p[0], im = p[1];
    if (Math.abs(re) < 5e-3) re = 0;
    if (Math.abs(im) < 5e-3) im = 0;
    const fx = v => v.toFixed(d).replace("-", "−");
    if (im === 0) return fx(re);
    return fx(re) + (im > 0 ? " + j" : " − j") + fx(Math.abs(im));
  }

  /* ================= 根轨迹图 ================= */
  function figure(svgId, dataName, opt) {
    opt = opt || {};
    const data = RL.data[dataName];
    const svg = document.getElementById(svgId);
    const VW = opt.vw || REF.viewBox.width, VH = opt.vh || REF.viewBox.height;
    svg.setAttribute("viewBox", `0 0 ${VW} ${VH}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.style.display = "block";
    svg.style.width = "100%";
    svg.style.height = "100%";
    const pad = { l: REF.pad.left, r: REF.pad.right, t: REF.pad.top, b: REF.pad.bottom };
    const PLOT = { x0: pad.l, y0: pad.t, x1: VW - pad.r, y1: VH - pad.b };
    const PW = PLOT.x1 - PLOT.x0, PH = PLOT.y1 - PLOT.y0;
    /* 视窗：中心点 + 单一比例尺（1:1 红线）；home 为初始适配 */
    const xr0 = opt.xlim || data.xlim, yr0 = opt.ylim || data.ylim;
    const s0 = Math.min(PW / (xr0[1] - xr0[0]), PH / (yr0[1] - yr0[0]));
    const home = { cx: (xr0[0] + xr0[1]) / 2, cy: (yr0[0] + yr0[1]) / 2, s: s0 };
    const view = { cx: home.cx, cy: home.cy, s: home.s };
    const X = x => PLOT.x0 + PW / 2 + (x - view.cx) * view.s;
    const Y = y => PLOT.y0 + PH / 2 - (y - view.cy) * view.s;

    /* 持久图层（render 只清内容、不删组，外部引用不失效） */
    svg.innerHTML = "";
    svg.style.userSelect = "none";
    const defs = mk("defs", {}, svg);
    const cpr = mk("clipPath", { id: "pcl" + svgId }, defs);
    mk("rect", { x: PLOT.x0, y: PLOT.y0, width: PW, height: PH }, cpr);
    arrowDef(svg, "rx" + svgId, AX);
    const gGrid   = mk("g", {}, svg);
    const gBaseC  = mk("g", { "clip-path": `url(#pcl${svgId})` }, svg);   // 实轴根轨迹段
    const gTrack  = mk("g", { "clip-path": `url(#pcl${svgId})` }, svg);   // 预轨迹底轨（最底层轨迹）
    const gBaseT  = mk("g", {}, svg);                                     // 渐近线/解析圆 overlay（在底轨之上、主分支之下）
    const gAsym   = mk("g", { opacity: opt.asym === false ? 0 : 1 }, gBaseT);
    const gAsymC  = mk("g", { "clip-path": `url(#pcl${svgId})` }, gAsym); // 渐近线本体（裁剪）
    const gAsymL  = mk("g", {}, gAsym);                                   // 渐近线文字（不裁剪）
    const gCirc   = mk("g", {}, gBaseT);                                  // 解析圆 overlay（独立于渐近线开关）
    const gBranch = mk("g", { "clip-path": `url(#pcl${svgId})` }, svg);
    const gMove   = mk("g", { "clip-path": `url(#pcl${svgId})` }, svg);   // 当前端点/方向箭头
    const gTop    = mk("g", {}, svg);                                     // 零极点/关键点记号
    const gDyn    = mk("g", {}, svg);                                     // 页面装饰层（wire 每次 paint 前清空）

    const brs = data.branches || [];
    /* 分支配色：groups 优先，共轭同色 */
    const colorOf = [];
    {
      const assigned = brs.map(() => -1); let nx = 0;
      (data.groups || []).forEach(g => { const c = PAL[nx++ % PAL.length]; g.forEach(i => { if (assigned[i] === -1) assigned[i] = c; }); });
      for (let i = 0; i < brs.length; i++) {
        if (assigned[i] !== -1) continue;
        const c = PAL[nx++ % PAL.length]; assigned[i] = c;
        for (let j = i + 1; j < brs.length; j++) {
          if (assigned[j] !== -1) continue;
          const a0 = brs[i][0], b0 = brs[j][0];
          if (Math.abs(a0[0] - b0[0]) < 1e-6 && Math.abs(a0[1] + b0[1]) < 1e-6) assigned[j] = c;
        }
      }
      for (let i = 0; i < brs.length; i++) colorOf.push(assigned[i] === -1 ? PAL[0] : assigned[i]);
    }
    /* 方向箭头规格：每条分支固定至少一枚中段箭头（表示 K 增大方向） */
    const arrowSpec = brs.map(b => {
      const n = b.length;
      if (n < 3) return [{ at: .5, j: Math.max(1, Math.floor(n / 2)) }];
      return [{ at: .5, j: Math.min(n - 2, Math.max(1, Math.floor((n - 1) * .5))) }];
    });

    /* 分支状态：进度 bf / 不透明度 bop / 端点 eps */
    const bf = brs.map(() => 0), bop = brs.map(() => 1), eps = brs.map(() => null);
    let segEls = [], trackEls = [], pathEls = [], epG = [], circleEl = null, brkDots = [], crossSq = [];

    const kmin = data.kmin != null ? data.kmin : 1e-2, kmax = data.kmax != null ? data.kmax : 1e4;
    const mapK = K => Math.max(0, Math.min(1, Math.log10(Math.max(K, kmin) / kmin) / Math.log10(kmax / kmin)));
    const ks = data.ks || [];
    const f_of_K = K => {
      if (!ks.length) return mapK(K);
      let bi = 0, bd = 1e99;
      ks.forEach((k, i) => { const d = Math.abs(k - K); if (d < bd) { bd = d; bi = i; } });
      return bi / (ks.length - 1);
    };
    const K_of_f = f => {
      if (!ks.length) return kmin * Math.pow(kmax / kmin, f);
      const x = Math.max(0, Math.min(1, f)) * (ks.length - 1);
      const i = Math.min(ks.length - 2, Math.floor(x)), t = x - i, a = ks[i], b = ks[i + 1];
      return (a > 0 && b > 0) ? a * Math.pow(b / a, t) : a + (b - a) * t; // ks 对数扫掠 → 对数插值，面板读数随 f 真连续
    };
    const inPlot = (x, y, m) => x >= PLOT.x0 - (m || 0) && x <= PLOT.x1 + (m || 0) && y >= PLOT.y0 - (m || 0) && y <= PLOT.y1 + (m || 0);

    /* ---------- 各层绘制（全部随视窗现算） ---------- */
    function drawAxes() {
      const vx0 = view.cx - PW / 2 / view.s, vx1 = view.cx + PW / 2 / view.s;
      const vy0 = view.cy - PH / 2 / view.s, vy1 = view.cy + PH / 2 / view.s;
      const axY = Math.max(PLOT.y0, Math.min(PLOT.y1, Y(0)));   // x 轴线像素 y（0 出界时贴边）
      const axX = Math.max(PLOT.x0, Math.min(PLOT.x1, X(0)));   // y 轴线像素 x
      const fmtT = v => String(Math.round(v * 1000) / 1000);
      const stx = niceStep((vx1 - vx0) / 8);
      for (let v = Math.ceil(vx0 / stx) * stx; v <= vx1 + 1e-9; v += stx) {
        const x = X(v);
        if (x < PLOT.x0 + 2 || x > PLOT.x1 - 2) continue;
        if (Math.abs(v) > 1e-9) mk("line", { x1: x, y1: PLOT.y0, x2: x, y2: PLOT.y1, stroke: GRID, "stroke-width": 1.5, opacity: .75 }, gGrid);
        if (Math.abs(v) > 1e-9) {
          mk("line", { x1: x, y1: axY - 5, x2: x, y2: axY + 5, stroke: AX, "stroke-width": 1.6 }, gGrid);
          tx(gGrid, x, axY + 28, fmtT(v), { fs: 22, fill: AX });
        }
      }
      const sty = niceStep((vy1 - vy0) / 6);
      for (let v = Math.ceil(vy0 / sty) * sty; v <= vy1 + 1e-9; v += sty) {
        if (Math.abs(v) < 1e-9) continue;
        const y = Y(v);
        if (y < PLOT.y0 + 2 || y > PLOT.y1 - 2) continue;
        mk("line", { x1: PLOT.x0, y1: y, x2: PLOT.x1, y2: y, stroke: GRID, "stroke-width": 1.5, opacity: .75 }, gGrid);
        mk("line", { x1: axX - 5, y1: y, x2: axX + 5, y2: y, stroke: AX, "stroke-width": 1.6 }, gGrid);
        tx(gGrid, axX - 10, y + 7, fmtT(v), { fs: 22, fill: AX, an: "end" });
      }
      /* 轴线 + 箭头（正端超出绘图区一点，伸入边距）；轴名钳在 viewBox 内防裁切 */
      mk("line", { x1: PLOT.x0 - 6, y1: axY, x2: PLOT.x1 + 16, y2: axY, stroke: AX, "stroke-width": 2.2, "marker-end": `url(#rx${svgId})` }, gGrid);
      mk("line", { x1: axX, y1: PLOT.y1 + 6, x2: axX, y2: PLOT.y0 - 16, stroke: AX, "stroke-width": 2.2, "marker-end": `url(#rx${svgId})` }, gGrid);
      tx(gGrid, Math.min(PLOT.x1 + 16, VW - 24), axY + 30, "σ", { fs: 30, it: 1, b: 1, fill: AX });
      tx(gGrid, Math.min(axX + 16, VW - 36), PLOT.y0 - 6, "jω", { fs: 30, it: 1, b: 1, fill: AX, an: "start" });
    }

    function drawSegs() {
      segEls = [];
      if (Y(0) < PLOT.y0 - 40 || Y(0) > PLOT.y1 + 40) return; // 实轴不在视口
      (data.segments || []).forEach(([a, b]) => {
        const x1 = a === -Infinity || a < -1e90 ? PLOT.x0 : Math.max(PLOT.x0, X(a));
        const x2 = b === Infinity || b > 1e90 ? PLOT.x1 : Math.min(PLOT.x1, X(b));
        segEls.push(mk("line", { x1, y1: Y(0), x2, y2: Y(0), stroke: SEG, "stroke-width": REF.stroke.realAxis,
          "stroke-linecap": "round", opacity: opt.segs === false ? 0 : .32 }, gBaseC));
      });
    }

    function drawAsym() {
      if (!(data.asym && data.asym.sigma !== null && data.asym.angles.length)) return;
      const sa = data.asym.sigma, ox = X(sa), oy = Y(0);
      data.asym.angles.forEach(a => {
        const th = a * Math.PI / 180;
        const dx = Math.cos(th) * view.s, dy = -Math.sin(th) * view.s; // 每单位数学的像素位移
        /* 射线与绘图区矩形求交（slab 法），原点可在视口外 */
        let t0 = 0, t1 = Infinity;
        if (Math.abs(dx) < 1e-9) { if (ox < PLOT.x0 || ox > PLOT.x1) return; }
        else { const ta = (PLOT.x0 - ox) / dx, tb = (PLOT.x1 - ox) / dx; t0 = Math.max(t0, Math.min(ta, tb)); t1 = Math.min(t1, Math.max(ta, tb)); }
        if (Math.abs(dy) < 1e-9) { if (oy < PLOT.y0 || oy > PLOT.y1) return; }
        else { const ta = (PLOT.y0 - oy) / dy, tb = (PLOT.y1 - oy) / dy; t0 = Math.max(t0, Math.min(ta, tb)); t1 = Math.min(t1, Math.max(ta, tb)); }
        if (!isFinite(t1) || t1 <= t0) return;
        mk("line", { x1: ox + dx * t0, y1: oy + dy * t0, x2: ox + dx * t1, y2: oy + dy * t1,
          stroke: ASY, "stroke-width": REF.stroke.asymptote, "stroke-dasharray": REF.dash.asymptote, opacity: REF.opacity.asymptote }, gAsymC);
        if (opt.asymLabels !== false) {
          const lx = Math.min(Math.max(ox + dx * t1 * .8, 40), VW - 50);
          const ly = Math.min(Math.max(oy + dy * t1 * .8, 24), VH - 14);
          tx(gAsymL, lx, ly, (a === 180 || a === -180) ? "180°" : (a > 0 ? "+" : "") + a + "°", { fs: 26, fill: ASY, b: 1 });
        }
      });
      if (opt.sigA !== false && inPlot(ox, oy)) {
        mk("circle", { cx: ox, cy: oy, r: 16, fill: "none", stroke: ASY, "stroke-width": 2.2, opacity: .75 }, gAsymC);
        tx(gAsymL, ox, Math.min(oy + 50, VH - 16), "σ_{a}", { fs: 26, fill: ASY, b: 1 });
      }
    }

    function drawCircle() {
      circleEl = null;
      if (!data.circle) return;
      const cx = X(data.circle.cx), cy = Y(data.circle.cy), r = data.circle.r * view.s;
      const nx = Math.max(PLOT.x0, Math.min(PLOT.x1, cx)), ny = Math.max(PLOT.y0, Math.min(PLOT.y1, cy));
      if (Math.hypot(nx - cx, ny - cy) > r) return; // 圆完全在视口外
      circleEl = mk("circle", { cx, cy, r, fill: "none", stroke: "#E8A34C", "stroke-width": 2.4,
        "stroke-dasharray": "10 7", opacity: opt.circle ? .9 : 0 }, gCirc);
    }

    function drawTracks() {
      trackEls = brs.map(b => {
        const el = mk("path", { fill: "none", stroke: TRACK, "stroke-width": REF.stroke.track, opacity: opt.static ? 0 : REF.opacity.track }, gTrack);
        el.setAttribute("d", toPath(clipPoly(b.map(p => [X(p[0]), Y(p[1])]), PLOT)));
        return el;
      });
    }

    function buildBranches() {
      pathEls = brs.map((b, i) => mk("path", { fill: "none", stroke: colorOf[i], "stroke-width": REF.stroke.branch,
        "stroke-linecap": "round", opacity: bop[i] }, gBranch));
        epG = brs.map((b, i) => mk("g", { opacity: bop[i] }, gMove));
    }

    /* 单分支进度生长（当前端点/方向箭头随帧重算） */
    function setF(i, f) {
      const b = brs[i]; if (!b) return;
      const n = b.length;
      bf[i] = f = Math.max(0, Math.min(1, f));
      const el = pathEls[i], g = epG[i];
      g.innerHTML = "";
      if (f <= 0) { el.setAttribute("d", ""); eps[i] = b[0].slice(); return; }
      const kk = Math.max(1, Math.min(n, Math.floor(f * (n - 1)) + 1));
      const pts = [];
      for (let j = 0; j < Math.min(kk, n); j++) pts.push([X(b[j][0]), Y(b[j][1])]);
      let ex, ey;
      if (kk < n) {
        const t = Math.max(0, Math.min(1, f * (n - 1) - (kk - 1)));
        ex = b[kk - 1][0] + (b[kk][0] - b[kk - 1][0]) * t;
        ey = b[kk - 1][1] + (b[kk][1] - b[kk - 1][1]) * t;
        pts.push([X(ex), Y(ey)]);
      } else { ex = b[n - 1][0]; ey = b[n - 1][1]; }
      eps[i] = [ex, ey];
      el.setAttribute("d", toPath(clipPoly(pts, PLOT)));
      if (opt.arrows !== false && f > 0.02)
        arrowSpec[i].forEach(sp => {
          if (sp.at > f + 1e-6) return;
          const p0 = b[sp.j - 1], p1 = b[sp.j];
          if (!inPlot(X(p1[0]), Y(p1[1]), 14)) return;
          const ang = Math.atan2(Y(p1[1]) - Y(p0[1]), X(p1[0]) - X(p0[0])) * 180 / Math.PI;
          const g2 = mk("g", { transform: `translate(${X(p1[0])},${Y(p1[1])}) rotate(${ang})` }, g);
          mk("path", { d: "M10,0 L-10,7.5 L-10,-7.5 Z", fill: colorOf[i], stroke: "#fff", "stroke-width": 1.2 }, g2);
        });
      if (opt.endpoint !== false && f > 0.02) {
        mk("circle", { cx: X(ex), cy: Y(ey), r: REF.marker.movingPointRadius, fill: colorOf[i], stroke: "#fff", "stroke-width": 3 }, g);
      }
    }

    function drawPZ() {
      (data.poles || []).forEach((p, i) => {
        const x = X(p[0]), y = Y(p[1]);
        if (!inPlot(x, y, 30)) return;
        const r = 12;
        mk("line", { x1: x - r, y1: y - r, x2: x + r, y2: y + r, stroke: INK, "stroke-width": 4.5, "stroke-linecap": "round" }, gTop);
        mk("line", { x1: x - r, y1: y + r, x2: x + r, y2: y - r, stroke: INK, "stroke-width": 4.5, "stroke-linecap": "round" }, gTop);
        if (opt.pzLabels !== false)
          tx(gTop, x + (opt.pzDx || 0), p[1] < -0.01 ? y + 38 : y - 22, "p_{" + (i + 1) + "}", { fs: 26, fill: INK, b: 1 });
      });
      (data.zeros || []).forEach((z, i) => {
        const x = X(z[0]), y = Y(z[1]);
        if (!inPlot(x, y, 30)) return;
        mk("circle", { cx: x, cy: y, r: 12, fill: "#fff", stroke: INK, "stroke-width": 4.5 }, gTop);
        if (opt.pzLabels !== false)
          tx(gTop, x + (opt.pzDx || 0), y - 22, "z_{" + (i + 1) + "}", { fs: 26, fill: INK, b: 1 });
      });
    }

    function drawKeyMarks() {
      brkDots = (data.breakaways || []).map(bp => {
        const x = X(bp.s), y = Y(0);
        if (!inPlot(x, y, 10)) return null;
        return mk("circle", { cx: x, cy: y, r: 9, fill: FOCUS, stroke: "#fff", "stroke-width": 2.5,
          opacity: opt.brkDots === false ? 0 : 1 }, gTop);
      }).filter(Boolean);
      crossSq = [];
      (data.crossings || []).forEach(cp => {
        [cp.w, -cp.w].forEach(w => {
          const x = X(0), y = Y(w);
          if (!inPlot(x, y, 12)) return;
          crossSq.push(mk("rect", { x: x - 9, y: y - 9, width: 18, height: 18,
            fill: "#fff", stroke: FOCUS, "stroke-width": 3, opacity: opt.crossSq === false ? 0 : 1 }, gTop));
        });
      });
    }

    let selected = null;
    function clearPick() { selected = null; }
    function drawSelected() {
      if (!selected) return;
      const x = X(selected.point[0]), y = Y(selected.point[1]);
      mk("circle", { cx: x, cy: y, r: 16, fill: "none", stroke: FOCUS, "stroke-width": 3.5 }, gDyn);
      mk("circle", { cx: x, cy: y, r: 5, fill: FOCUS, stroke: "#fff", "stroke-width": 2 }, gDyn);
    }

    function render() {
      [gGrid, gBaseC, gAsymC, gAsymL, gCirc, gTrack, gBranch, gMove, gTop, gDyn].forEach(g => g.innerHTML = "");
      drawAxes(); drawSegs(); drawAsym(); drawCircle(); drawTracks(); buildBranches(); drawPZ(); drawKeyMarks();
      brs.forEach((_, i) => setF(i, bf[i]));
      if (opt.extra) opt.extra(api);
      if (api.onView) api.onView(api);
      drawSelected();
    }

    /* ---------- 缩放 / 平移 / 复位 ---------- */
    function clampView() {
      const mX = (xr0[1] - xr0[0]) * .75, mY = (yr0[1] - yr0[0]) * .75;
      view.cx = Math.max(home.cx - mX, Math.min(home.cx + mX, view.cx));
      view.cy = Math.max(home.cy - mY, Math.min(home.cy + mY, view.cy));
    }
    function resetView() { view.cx = home.cx; view.cy = home.cy; view.s = home.s; render(); }
    if (opt.zoom !== false) {
      svg.style.cursor = "grab";
      svg.style.touchAction = "none";
      let drag = null, moved = false, dblSup = 0;   // dblclick 后短暂抑制取点
      svg.addEventListener("dblclick", () => {
        dblSup = performance.now() + 300;
        resetView();
        selected = null;
      });
      svg.addEventListener("pointerdown", e => {
        moved = false;
        drag = { x: e.clientX, y: e.clientY, cx: view.cx, cy: view.cy };
        if (svg.setPointerCapture) try { svg.setPointerCapture(e.pointerId); } catch (err) {}
        svg.style.cursor = "grabbing";
      });
      svg.addEventListener("pointermove", e => {
        if (!drag) return;
        if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 4) moved = true;
        const r = svg.getBoundingClientRect();
        if (!r.width) return;
        const k = VW / r.width; // viewBox 像素 / 屏幕像素
        view.cx = drag.cx - (e.clientX - drag.x) * k / view.s;
        view.cy = drag.cy + (e.clientY - drag.y) * k / view.s;
        clampView(); render();
      });
      const up = e => {
        if (drag && !moved && performance.now() > dblSup && api._pickEnabled && api.onPick) {
          const r = svg.getBoundingClientRect();
          const sc = Math.min(r.width / VW, r.height / VH);
          const ox = (r.width - VW * sc) / 2, oy = (r.height - VH * sc) / 2;
          const px = (e.clientX - r.left - ox) / sc;
          const py = (e.clientY - r.top - oy) / sc;
          const hit = api.pick(px, py);
          if (hit) { selected = hit; render(); api.onPick(hit); }
        }
        if (drag) { drag = null; svg.style.cursor = "grab"; }
      };
      svg.addEventListener("pointerup", up);
      svg.addEventListener("pointercancel", up);
      svg.addEventListener("wheel", e => {
        e.preventDefault();
        const r = svg.getBoundingClientRect();
        if (!r.width) return;
        const mx = (e.clientX - r.left) * VW / r.width, my = (e.clientY - r.top) * VH / r.height;
        const mX = view.cx + (mx - (PLOT.x0 + PW / 2)) / view.s;
        const mY = view.cy - (my - (PLOT.y0 + PH / 2)) / view.s;
        const ns = Math.max(home.s * .9, Math.min(home.s * 80, view.s * Math.exp(-e.deltaY * .0013)));
        if (ns === view.s) return;
        view.cx = mX - (mx - (PLOT.x0 + PW / 2)) / ns; // 锚定光标下的数学点
        view.cy = mY + (my - (PLOT.y0 + PH / 2)) / ns;
        view.s = ns;
        clampView(); render();
      }, { passive: false });
      svg.addEventListener("dblclick", () => resetView());
    }

    /* 可复用角弧：参数 a0/a1 采用"指北顺时针"度数（0°=屏幕上方，90°=数学 +x 方向）。
       数学角 θ ↔ 参数 90−θ；如数学 0°→+60° 扇形传 (90, 30)……随图坐标变换绘制。 */
    function angleArc(sx, sy, a0, a1, parent, opt) {
      opt = opt || {};
      const r = opt.r == null ? REF.marker.angleArcRadius : opt.r;
      const c = parent || gDyn, cx = X(sx), cy = Y(sy);
      const rad = a => (a - 90) * Math.PI / 180;
      const p = a => [cx + r * Math.cos(rad(a)), cy + r * Math.sin(rad(a))];
      const q0 = p(a0), q1 = p(a1), large = Math.abs(a1 - a0) > 180 ? 1 : 0;
      return mk("path", {
        d: `M${q0[0].toFixed(1)},${q0[1].toFixed(1)} A${r},${r} 0 ${large} 1 ${q1[0].toFixed(1)},${q1[1].toFixed(1)}`,
        fill: "none", stroke: opt.stroke || ASY,
        "stroke-width": opt.width || REF.stroke.asymptote, opacity: opt.opacity == null ? .9 : opt.opacity
      }, c);
    }

    const api = { svg, X, Y, VW, VH, PLOT, data, tx, mk, angleArc, gTop, gDyn, gBase: gBaseC, gGrid, gAsym,
                  colorOf, setF, setOp: (i, op) => { bop[i] = op; pathEls[i].setAttribute("opacity", op); epG[i].setAttribute("opacity", op); },
                  setAllF: f => brs.forEach((_, i) => setF(i, f)),
                  setProgress: f => brs.forEach((_, i) => setF(i, f)), // 兼容旧名
                  getF: i => bf[i], eps: i => eps[i], nb: brs.length,
                  f_of_K, K_of_f, mapK, clipPoly, toPath, render, resetView, clearPick, view, home, xr: xr0, yr: yr0,
                  onView: null, onPick: null, _pickEnabled: false, setPickEnabled(v) { this._pickEnabled = !!v; }, REF };
    api.pick = (px, py, tolerance) => {
      const tol = tolerance == null ? Math.max(10, Math.min(60, 22 * home.s / view.s)) : tolerance;
      let best = null, bd = tol * tol;
      brs.forEach((b, bi) => {
        for (let j = 1; j < b.length; j++) {
          const a = [X(b[j - 1][0]), Y(b[j - 1][1])], c = [X(b[j][0]), Y(b[j][1])];
          const dx = c[0] - a[0], dy = c[1] - a[1], den = dx * dx + dy * dy || 1;
          const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / den));
          const qx = a[0] + t * dx, qy = a[1] + t * dy, d2 = (px - qx) ** 2 + (py - qy) ** 2;
          if (d2 < bd) {
            bd = d2;
            const f = ((j - 1) + t) / Math.max(1, b.length - 1), p = [b[j - 1][0] + t * (b[j][0] - b[j - 1][0]), b[j - 1][1] + t * (b[j][1] - b[j - 1][1])];
            best = { branch: bi, f, K: K_of_f(f), point: p, px: qx, py: qy };
          }
        }
      });
      return best;
    };
    Object.defineProperty(api, "segEls", { get: () => segEls });
    Object.defineProperty(api, "circleEl", { get: () => circleEl });
    Object.defineProperty(api, "brkDots", { get: () => brkDots });
    Object.defineProperty(api, "crossSq", { get: () => crossSq });
    Object.defineProperty(api, "s", { get: () => view.s });

    /* QA 钩子：?zz=倍数&zx=&zy= 预设缩放（截图管线用） */
    const qp = new URLSearchParams(location.search);
    if (qp.has("zz")) {
      view.s = Math.max(home.s * .9, Math.min(home.s * 80, home.s * (parseFloat(qp.get("zz")) || 1)));
      if (qp.has("zx")) view.cx = parseFloat(qp.get("zx"));
      if (qp.has("zy")) view.cy = parseFloat(qp.get("zy"));
      clampView();
    }
    if (opt.static) brs.forEach((_, i) => bf[i] = 1);
    render();
    return api;
  }

  /* ================= 步进接线（v2） =================
     total 步；paint(K) 只画第 K 步的图内装饰与静态开关（进度由 wire 负责）；
     o.figs     本页全部 figure（多图页传数组）；
     o.FS       每步对应的连续进度阈值（长度 total+1，末位=1）；缺省均匀；
     o.frame(f,K,info)  联动面板逐帧刷新（播放/分步/步进都会调用）；
     o.segments 分步定义 [{label, parts:[{F, b:[分支号], f0, f1}]}]，存在时接管 #step 按钮；
     o.segLabel(txt,i,n)  分步标签显示（传 null 清除）；
     o.dur 连贯播放总时长 ms；o.segDur 每段时长；o.segGap 段间停顿。
     接入 ACT.step（播放器上一步/下一步、键盘、翻页笔），window.prev 重放式回退。 */
  function wire(total, paint, o) {
    o = o || {};
    const S = ACT.step, _n = S.next.bind(S), _r = S.reset.bind(S);
    const figs = o.figs || [];
    const FS = o.FS || null;
    let K = 0, mode = "idle", raf = null; // idle | play | seg
    /* 播放器步进状态同步：连续播放/暂停后，ACT.step.cur 与本地 K 保持一致 */
    function syncStepCur(target) {
      target = Math.max(0, Math.min(total, target));
      while (S.cur < target) _n();
      while (S.cur > target) {
        const t = S.cur - 1;
        _r();
        for (let i = 0; i < t; i++) _n();
      }
    }
    figs.forEach(F => { F.onPick = hit => { if (mode === "idle" && o.pick) o.pick(Object.assign({ figure: F }, hit), F); }; });
    const fOf = k => FS ? FS[Math.max(0, Math.min(k, FS.length - 1))] : k / total;
    let segSi = 0, segT = 0, segTimer = null;
    const solos = []; // 独立单图播放的停止句柄（与总控互斥）

    function progTxt(t) { const el = document.getElementById("prog"); if (el) el.textContent = t; }
    function setBtn(id, txt) { const b = document.getElementById(id); if (b) b.textContent = txt; }
    const PLAY_LABEL = o.playLabel || "▶ 播放";
    function stopAll() {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      if (segTimer) { clearTimeout(segTimer); segTimer = null; }
      solos.forEach(s => s());
      mode = "idle";
      setBtn("play", PLAY_LABEL); setBtn("step", "⧉ 分步");
      figs.forEach(F => F.setPickEnabled(K >= total));
      if (o.segments) o.segments.forEach(sg => sg.parts.forEach(p => p.b.forEach(bi => p.F.setOp(bi, 1))));
      if (o.segLabel) o.segLabel(null);
      syncStepCur(K);   // 暂停/完成时把播放器步进状态同步到本地 K
    }
    function applyK() {
      figs.forEach(F => { F.setAllF(fOf(K)); F.gDyn.innerHTML = ""; F.setPickEnabled(K >= total); });
      paint(K);
      progTxt(K + " / " + total);
      if (o.frame) o.frame(fOf(K), K, { mode: "step" });
    }
    figs.forEach(F => { F.onView = () => {   // 缩放/平移后重挂当前状态
      if (mode === "seg" && o.segments) { F.gDyn.innerHTML = ""; (o.segPaint || paint)(total); segState(segSi, segT); }
      else applyK();
    }; });

    S.next = function () { stopAll(); if (K < total) K++; const d = _n(); applyK(); return d; };
    S.reset = function () { stopAll(); K = 0; _r(); applyK(); };
    window.prev = function () { if (K <= 0) return; const t = K - 1; S.reset(); for (let i = 0; i < t; i++) S.next(); };

    /* ---- 连贯平滑播放：rAF 连续推进共享 K 进度，跨过步阈值时弹该步徽标 ---- */
    const playBtn = document.getElementById("play");
    if (playBtn) playBtn.onclick = function () {
      if (mode === "play") { stopAll(); return; }
      stopAll();
      if (K >= total) { K = 0; _r(); applyK(); }
      mode = "play"; setBtn("play", "❚❚ 暂停"); setBtn("step", "⧉ 分步");
      const DUR = o.dur || 10000, f0 = fOf(K), t0 = performance.now();
      const tick = now => {
        if (mode !== "play") return;
        const f = Math.min(1, f0 + (1 - f0) * (now - t0) / (DUR * (1 - f0) || 1));
        figs.forEach(F => F.setAllF(f));
        while (K < total && fOf(K + 1) <= f + 1e-9) {
          K++;
          syncStepCur(K);
          figs.forEach(F => F.gDyn.innerHTML = "");
          paint(K, f); progTxt(K + " / " + total);
        }
          if (o.frame) o.frame(f, K, { mode: "play" });
          else paint(K, f);
        if (f >= 1) { stopAll(); figs.forEach(F => F.setPickEnabled(true)); return; }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    /* ---- 分步播放：逐段生长，其余分支淡化 0.15 ----
       优先级：当前段（亮+生长）> 已演示段（停在已达进度，压暗 0.15）> 未演示段（整支弱化做底轨预览）。
       同一支分支同属当前段与后续段时，按当前段处理，防止被后续段的弱化覆盖。 */
    function segState(si, t) {
      const segs = o.segments;
      const st = new Map();
      segs.forEach((sg, j) => sg.parts.forEach(p => {
        const f1 = p.f1 != null ? p.f1 : 1, f0 = p.f0 != null ? p.f0 : 0;
        const fi = figs.indexOf(p.F);
        p.b.forEach(bi => {
          const key = fi + ":" + bi;
          const e = st.get(key) || { F: p.F, bi, cur: false, done: false, doneMax: 0, futMax: 0, cF0: 0, cF1: 1 };
          if (j < si) { e.done = true; e.doneMax = Math.max(e.doneMax, f1); }
          else if (j === si) { e.cur = true; e.cF0 = f0; e.cF1 = f1; }
          else e.futMax = Math.max(e.futMax, f1);
          st.set(key, e);
        });
      }));
      st.forEach(e => {
        if (e.cur) { e.F.setF(e.bi, e.cF0 + (e.cF1 - e.cF0) * t); e.F.setOp(e.bi, 1); }
        else { e.F.setF(e.bi, e.done ? e.doneMax : e.futMax); e.F.setOp(e.bi, .15); }
      });
      const sg = segs[si];
      if (sg && sg.draw) {
        if (sg._g && sg._g.parentNode) sg._g.innerHTML = "";
        else sg._g = RL.mk("g", {}, figs[0].gDyn);
        sg.draw(t, sg._g);
      }
    }
    const stepBtn = document.getElementById("step");
    if (stepBtn && o.segments && o.segments.length) stepBtn.onclick = function () {
      if (mode === "seg") { stopAll(); return; }
      stopAll();
      _r(); for (let i = 0; i < total; i++) _n();       // ACT 内部步数对齐到末态
      K = total;
      figs.forEach(F => F.gDyn.innerHTML = ""); (o.segPaint || paint)(total); // 底图（默认完整图，可被页面替换）
      progTxt(total + " / " + total);
      mode = "seg"; setBtn("step", "❚❚ 暂停");
      const segs = o.segments, segDur = o.segDur || 3400, segGap = o.segGap || 650;
      segSi = 0;
      const runSeg = () => {
        if (mode !== "seg") return;
        if (segSi >= segs.length) {                      // 全部演示完：全亮收束
          segs.forEach(sg => sg.parts.forEach(p => p.b.forEach(bi => { p.F.setF(bi, p.f1 != null ? p.f1 : 1); p.F.setOp(bi, 1); })));
          figs.forEach(F => F.gDyn.innerHTML = "");
          segs.forEach(sg => { sg._g = null; });
          stopAll();
          progTxt(total + " / " + total);
          if (o.frame) o.frame(1, total, { mode: "seg" });
          return;
        }
        if (o.segLabel) o.segLabel(segs[segSi].label, segSi, segs.length);
        progTxt("分步 " + (segSi + 1) + " / " + segs.length);
        const t0 = performance.now();
        const tick = now => {
          if (mode !== "seg") return;
          segT = Math.min(1, (now - t0) / segDur);
          segState(segSi, segT);
          const p0 = segs[segSi].parts[0], fa = (p0.f0 || 0) + (((p0.f1 != null ? p0.f1 : 1)) - (p0.f0 || 0)) * segT;
          if (o.frame) o.frame(fa, K, { mode: "seg", seg: segSi });
          if (segT < 1) raf = requestAnimationFrame(tick);
          else {
            segSi++;
            segT = 0;
            figs.forEach(F => F.gDyn.innerHTML = "");
            segs.forEach(sg => { sg._g = null; });
            segTimer = setTimeout(() => { segTimer = null; if (mode === "seg") runSeg(); }, segGap);
          }
        };
        raf = requestAnimationFrame(tick);
      };
      runSeg();
    };

    applyK();
    /* ---- 独立单图播放（对照页）：由 wire 统一仲裁，与总控播放/分步/步进互斥 ---- */
    (o.solos || []).forEach(so => {
      const F = so.F, btn = document.getElementById(so.btn), rst = document.getElementById(so.rst);
      if (!F || !btn || !rst) return;
      let sraf = null;
      const sStop = () => { if (sraf) { cancelAnimationFrame(sraf); sraf = null; btn.textContent = "▶ 播放"; } };
      solos.push(sStop);
      btn.onclick = function () {
        if (sraf) { sStop(); mode = "idle"; figs.forEach(X => X.setPickEnabled(false)); return; }
        stopAll();                                    // 停总控与其它单图，防双写同一图
        btn.textContent = "❚❚ 暂停";
        const t0 = performance.now();
        const tick = now => {
          const f = Math.min(1, (now - t0) / (so.dur || 7000));
          F.setAllF(f);
          if (so.onFrame) so.onFrame(F, f);
          if (f >= 1) { sraf = null; btn.textContent = "▶ 播放"; F.setPickEnabled(true); return; }
          sraf = requestAnimationFrame(tick);
        };
        sraf = requestAnimationFrame(tick);
      };
      rst.onclick = function () {
        stopAll(); sStop();
        F.setAllF(0);
        F.gDyn.innerHTML = "";
        if (so.onReset) so.onReset(F);
      };
    });

    /* QA 钩子：?ff=0.55 直达连续进度中间态（截图管线用） */
    const qp = new URLSearchParams(location.search);
    if (qp.has("ff")) {
      const ff = Math.max(0, Math.min(1, parseFloat(qp.get("ff")) || 0));
      while (K < total && fOf(K + 1) <= ff + 1e-9) K++;
      figs.forEach(F => { F.setAllF(ff); F.gDyn.innerHTML = ""; });
      paint(K); progTxt(K + " / " + total);
      if (o.frame) o.frame(ff, K, { mode: "qa" });
    }
    /* QA 钩子：?seg=N&segT=T 直达分步第 N 段（1 起）进度 T（0~1）的确定性画面（截图管线用） */
    if (qp.has("seg") && o.segments && o.segments.length) {
      const si = Math.max(1, Math.min(o.segments.length, parseInt(qp.get("seg"), 10) || 1)) - 1;
      const segTq = Math.max(0, Math.min(1, parseFloat(qp.get("segT")) || 0));
      _r(); for (let i = 0; i < total; i++) _n();
      K = total;
      figs.forEach(F => F.gDyn.innerHTML = "");
      (o.segPaint || paint)(total);
      segState(si, segTq);
      if (o.segLabel) o.segLabel(o.segments[si].label, si, o.segments.length);
      progTxt("分步 " + (si + 1) + " / " + o.segments.length);
      const p0 = o.segments[si].parts[0];
      const fa = p0 ? (p0.f0 || 0) + (((p0.f1 != null) ? p0.f1 : 1) - (p0.f0 || 0)) * segTq : 0.5;
      if (o.frame) o.frame(fa, K, { mode: "qa-seg", seg: si });
    }
    return { stopAll, applyK };
  }

    RL.REF = REF;
    window.RL.figure = figure;
  window.RL.wire = wire;
  window.RL.mk = mk; window.RL.tx = tx;
  window.RL.clipPoly = clipPoly; window.RL.toPath = toPath;
  window.RL.fmtK = fmtK; window.RL.fmtC = fmtC;
  window.RL.PAL = PAL; window.RL.AX = AX; window.RL.ASY = ASY;
  window.RL.TRACK = TRACK; window.RL.FOCUS = FOCUS; window.RL.INK = INK;
})();
