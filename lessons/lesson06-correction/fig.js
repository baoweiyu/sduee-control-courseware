/* 第六章控制系统校正共享绘图库（v1，Bode 图库 BD；沿用第五章 RL-DRAW-1.1 视觉规范与 wire 状态机）
   与 RL 的对应关系：
   - BD.figure(svgId, dataName, opt)：半对数坐标 Bode 图（横轴 ω 对数、纵轴 dB / ° 线性）。
       opt = { mag:true/false, phase:true/false }，双图时幅频在上、相频在下、共享 ω 轴；
       xlim [wmin,wmax]（普通数值，内部取 log10）；ylim 由 data 各 panel 给出或 opt 覆盖；
       zoom:true → 滚轮缩放（锚定光标）+ 拖拽平移 + 双击复位，手感与 RL 一致；
       预绘底轨（淡色精确曲线 track）、渐近线（橙色虚折线 asym）、标注 marks：
         {type:"vline",  w, label}            转折频率竖虚线（贯穿双图）
         {type:"wc",     w, label}            ωc 0dB 穿越点（圆点 + 竖虚线）
         {type:"margin", w, gamma, phi, label} γ 相角裕度：相频图内 φ(w)→−180° 竖线 + 读数
         {type:"hlevel", y, w0, w1, label}    −10lgα / −20lgβ 电平线（幅频图内水平虚线）
   - BD.wire(total, paint, o)：与 RL.wire 完全同款（▶连贯生长 / ⧉分步逐段 / 按钮置灰防连击 /
     永不变暂停语义 / S.next·S.reset / syncStepCur / ?ff= · ?seg= QA 钩子 / solos 单图互斥播放）。
   - 生长动画：曲线按 ω 从左到右逐段生长（rAF，时长 o.dur / o.segDur 可配）。
     叠加动画（校正前后对比）：校后曲线 = 原曲线 + 校正曲线（dB 与 ° 直接相加，数据由生成器
     预计算为独立 branch），用 segments 编排：先原曲线与校正曲线生长 → 二者 setOp(.15) 淡化
     → 校后曲线逐段生长，即"逐段相加"观感；JS 侧亦可用 BD.sumCurves(a,b) 现算。
   - BD.block(svgId, blocks, opt)：方框图 helper（方框 + 求和点⊕带 +/− + 箭头 + 信号名，
     line 支持 flow:true 信号流虚线动画）。
   图内文字 STIX2 系字体；tx() 支持 _{} ^{} 上下标；标注白 halo 防压线；
   刻度字号 ≥14px、标注字号 ≥16px（viewBox 960 基准下刻度 20、标注 22，等效屏幕字号达标）。
   数据一律来自 qa/gen_ch6_data.py 预计算（图不撒谎）。 */
window.BD = window.BD || { data: {} };
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const REF = Object.freeze({
    viewBox: { width: 960, height: 600 },
    pad: { left: 78, right: 30, top: 26, bottom: 44, gap: 34 },
    font: { family: '"Cambria Math","STIX Two Math","Lesson06 STIX2",Georgia,"Times New Roman","Microsoft YaHei",serif', axisName: 26, tick: 20, label: 22, badge: 24, subScale: .72, halo: 6 },
    color: { bg: "#FFFFFF", title: "#1D3FA0", branch: ["#1D3FA0", "#0E7A36", "#C02A20", "#7B21C8", "#C2410C"], axis: "#5B6B8C", secondary: "#8A97B5", ink: "#16324F", asymptote: "#F5821F", track: "#C9D6F2", grid: "#E7EDF9", focus: "#D63A2F", zero: "#8A97B5" },
    opacity: { grid: .75, track: .85, asymptote: .92, weak: .15 },
    stroke: { axis: 2.2, branch: 4.5, track: 2.2, asymptote: 2.6, grid: 1.5, mark: 2.2, block: 3 },
    marker: { movingPointRadius: 9, wcRadius: 9 },
    dash: { asymptote: "9 6", mark: "7 5", hlevel: "6 5", flow: "10 8" }
  });
  const MF = REF.font.family;
  const PAL = REF.color.branch;
  const AX = REF.color.axis, ASY = REF.color.asymptote, TRACK = REF.color.track,
        FOCUS = REF.color.focus, INK = REF.color.ink, GRID = REF.color.grid;

  function mk(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  /* 文字：支持 _{下标} / ^{上标}，默认白色 halo 防压线（与 RL.tx 同款） */
  function tx(parent, x, y, s, o) {
    o = o || {};
    const n = mk("text", { x, y, "font-size": o.fs || REF.font.badge, "text-anchor": o.an || "middle",
      fill: o.fill || "#1B3B8B", "font-weight": o.b ? 700 : 400,
      "font-style": o.it ? "italic" : "normal", "font-family": MF }, parent);
    const esc = t => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    let html = "", dy = 0;
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
    const defs = svg.querySelector("defs") || mk("defs", {}, svg);
    const m = mk("marker", { id, markerWidth: 10, markerHeight: 8, refX: 7, refY: 3, orient: "auto" }, defs);
    mk("path", { d: "M0,0 L7,3 L0,6 Z", fill: color }, m);
  }
  /* 折线对矩形裁剪（Liang-Barsky），输入像素坐标 */
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
  /* 曲线逐点相加（dB/° 意义下的"叠加"，要求同一 ω 网格；生长动画与 setF 天然兼容） */
  function sumCurves(a, b) {
    const n = Math.min(a.length, b.length), out = [];
    for (let i = 0; i < n; i++) out.push([a[i][0], a[i][1] + b[i][1]]);
    return out;
  }

  /* ================= Bode 图 ================= */
  function figure(svgId, dataName, opt) {
    opt = opt || {};
    const data = BD.data[dataName];
    const svg = document.getElementById(svgId);
    const VW = opt.vw || REF.viewBox.width, VH = opt.vh || REF.viewBox.height;
    svg.setAttribute("viewBox", `0 0 ${VW} ${VH}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.style.display = "block";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.userSelect = "none";

    const wantMag = opt.mag !== false && !!data.mag;
    const wantPhase = opt.phase !== false && !!data.phase;
    const dual = wantMag && wantPhase;
    const pad = { l: REF.pad.left, r: REF.pad.right, t: REF.pad.top, b: REF.pad.bottom };
    const FULL = { x0: pad.l, y0: pad.t, x1: VW - pad.r, y1: VH - pad.b };
    const PW = FULL.x1 - FULL.x0;
    /* panel 几何：dual 时上下排布（幅上相下），单图占全区 */
    const panels = [];
    const secName = (sec, dflt) => (sec && sec.name) || dflt;
    if (dual) {
      const ph = (FULL.y1 - FULL.y0 - REF.pad.gap) / 2;
      panels.push({ key: "mag", sec: data.mag, y0: FULL.y0, y1: FULL.y0 + ph, name: secName(data.mag, "L(ω)/dB") });
      panels.push({ key: "phase", sec: data.phase, y0: FULL.y0 + ph + REF.pad.gap, y1: FULL.y1, name: secName(data.phase, "φ(ω)/°") });
    } else if (wantMag) panels.push({ key: "mag", sec: data.mag, y0: FULL.y0, y1: FULL.y1, name: secName(data.mag, "L(ω)/dB") });
    else if (wantPhase) panels.push({ key: "phase", sec: data.phase, y0: FULL.y0, y1: FULL.y1, name: secName(data.phase, "φ(ω)/°") });
    panels.forEach(p => { p.x0 = FULL.x0; p.x1 = FULL.x1; p.h = p.y1 - p.y0; });

    /* 视窗：x 共享（log10 ω），y 每 panel 独立；无 1:1 约束（Bode 图横纵量纲不同） */
    const xr0 = opt.xlim || data.xlim;
    const lx0 = Math.log10(xr0[0]), lx1 = Math.log10(xr0[1]);
    const homeX = { c: (lx0 + lx1) / 2, s: PW / (lx1 - lx0) };
    const viewX = { c: homeX.c, s: homeX.s };
    panels.forEach(p => {
      const yr = (opt.ylim && opt.ylim[p.key]) || p.sec.ylim;
      p.yr = yr.slice();
      p.homeY = { c: (yr[0] + yr[1]) / 2, s: p.h / (yr[1] - yr[0]) };
      p.viewY = { c: p.homeY.c, s: p.homeY.s };
    });
    const X = w => FULL.x0 + PW / 2 + (Math.log10(w) - viewX.c) * viewX.s;
    const Y = (p, y) => p.y0 + p.h / 2 - (y - p.viewY.c) * p.viewY.s;
    const panelOf = key => panels.find(p => p.key === key);

    /* 持久图层 */
    svg.innerHTML = "";
    const defs = mk("defs", {}, svg);
    panels.forEach((p, i) => {
      const cp = mk("clipPath", { id: "pcl" + svgId + i }, defs);
      mk("rect", { x: p.x0, y: p.y0, width: PW, height: p.h }, cp);
      p.clip = "pcl" + svgId + i;
    });
    arrowDef(svg, "rx" + svgId, AX);
    const gGrid   = mk("g", {}, svg);
    const gTrack  = mk("g", {}, svg);   // 预绘底轨（淡色精确曲线）
    const gAsym   = mk("g", { opacity: opt.asym === false ? 0 : 1 }, svg);
    const gBranch = mk("g", {}, svg);
    const gMark   = mk("g", { opacity: opt.marks === false ? 0 : 1 }, svg);
    const gMove   = mk("g", {}, svg);   // 当前端点
    const gDyn    = mk("g", {}, svg);   // wire 每次 paint 前清空的装饰层

    /* 分支：全部 panel 曲线拉平（先 mag 后 phase），与 wire 的 setF/setOp 对接 */
    const brs = [], brPanel = [], brColor = [];
    panels.forEach(p => (p.sec.curves || []).forEach((c, ci) => {
      brs.push(c.pts); brPanel.push(p);
      brColor.push(c.color || PAL[(brs.length - 1) % PAL.length]);
    }));
    const bf = brs.map(() => 0), bop = brs.map(() => 1);
    let pathEls = [], trackEls = [], epG = [];

    const fmtTick = v => {
      if (Math.abs(v) < 1e-9) return "0";
      if (Math.abs(v) >= 100 || (Math.abs(v) < 0.01 && v !== 0)) return String(Math.round(v * 100) / 100);
      return String(Math.round(v * 10) / 10);
    };

    /* ---------- 坐标轴 / 网格（随视窗现算） ---------- */
    function drawAxes() {
      const lw0 = viewX.c - PW / 2 / viewX.s, lw1 = viewX.c + PW / 2 / viewX.s;
      const k0 = Math.ceil(lw0 - 1e-9), k1 = Math.floor(lw1 + 1e-9);
      panels.forEach((p, pi) => {
        /* 竖向网格：十倍频程主刻度 + 2..9 次刻度 */
        for (let k = k0; k <= k1; k++) {
          const x = FULL.x0 + PW / 2 + (k - viewX.c) * viewX.s;
          if (x < p.x0 + 2 || x > p.x1 - 2) continue;
          mk("line", { x1: x, y1: p.y0, x2: x, y2: p.y1, stroke: GRID, "stroke-width": REF.stroke.grid, opacity: REF.opacity.grid }, gGrid);
          if (pi === panels.length - 1) tx(gGrid, x, p.y1 + 26, "10^{" + k + "}", { fs: REF.font.tick, fill: AX });
          if (viewX.s > PW / (lx1 - lx0) * .8) // 视窗不太宽时画次刻度
            for (let m = 2; m <= 9; m++) {
              const xm = FULL.x0 + PW / 2 + (k + Math.log10(m) - viewX.c) * viewX.s;
              if (xm < p.x0 + 2 || xm > p.x1 - 2) continue;
              mk("line", { x1: xm, y1: p.y0, x2: xm, y2: p.y1, stroke: GRID, "stroke-width": 1, opacity: .45 }, gGrid);
            }
        }
        /* 横向网格：y 线性刻度 */
        const vy0 = p.viewY.c - p.h / 2 / p.viewY.s, vy1 = p.viewY.c + p.h / 2 / p.viewY.s;
        const sty = niceStep((vy1 - vy0) / 5);
        for (let v = Math.ceil(vy0 / sty) * sty; v <= vy1 + 1e-9; v += sty) {
          const y = Y(p, v);
          if (y < p.y0 + 2 || y > p.y1 - 2) continue;
          mk("line", { x1: p.x0, y1: y, x2: p.x1, y2: y, stroke: GRID, "stroke-width": REF.stroke.grid, opacity: REF.opacity.grid }, gGrid);
          mk("line", { x1: p.x0 - 5, y1: y, x2: p.x0 + 5, y2: y, stroke: AX, "stroke-width": 1.6 }, gGrid);
          tx(gGrid, p.x0 - 10, y + 6, fmtTick(v), { fs: REF.font.tick, fill: AX, an: "end" });
        }
        /* 基准线强调：幅频 0 dB、相频 −180° */
        const base = p.key === "mag" ? 0 : -180;
        if (base > vy0 && base < vy1)
          mk("line", { x1: p.x0, y1: Y(p, base), x2: p.x1, y2: Y(p, base), stroke: REF.color.zero, "stroke-width": 2.4, opacity: .8 }, gGrid);
        /* 边框 + 纵轴名 */
        mk("rect", { x: p.x0, y: p.y0, width: PW, height: p.h, fill: "none", stroke: AX, "stroke-width": 1.4, opacity: .55 }, gGrid);
        tx(gGrid, p.x0 - 44, p.y0 - 8, p.name, { fs: REF.font.axisName, fill: AX, b: 1, an: "start" });
      });
      /* 底图横轴箭头 + ω 轴名 */
      const bp = panels[panels.length - 1];
      mk("line", { x1: bp.x0 - 6, y1: bp.y1, x2: bp.x1 + 16, y2: bp.y1, stroke: AX, "stroke-width": REF.stroke.axis, "marker-end": `url(#rx${svgId})` }, gGrid);
      tx(gGrid, Math.min(bp.x1 + 16, VW - 18), bp.y1 + 30, "ω", { fs: 28, it: 1, b: 1, fill: AX });
    }

    /* ---------- 底轨 / 渐近线 ---------- */
    function drawTracks() {
      trackEls = brs.map((b, i) => {
        const p = brPanel[i];
        const el = mk("path", { fill: "none", stroke: TRACK, "stroke-width": REF.stroke.track,
          opacity: opt.static ? 0 : REF.opacity.track, "clip-path": `url(#${p.clip})` }, gTrack);
        el.setAttribute("d", toPath(clipPoly(b.map(q => [X(q[0]), Y(p, q[1])]), p)));
        return el;
      });
    }
    function drawAsym() {
      panels.forEach(p => (p.sec.asym || []).forEach(line => {
        const pts = (line.pts || line).map(q => [X(q[0]), Y(p, q[1])]);
        mk("path", { d: toPath(clipPoly(pts, p)), fill: "none", stroke: line.color || ASY,
          "stroke-width": REF.stroke.asymptote, "stroke-dasharray": REF.dash.asymptote,
          opacity: REF.opacity.asymptote, "clip-path": `url(#${p.clip})` }, gAsym);
        (line.labels || []).forEach(L => {
          const x = Math.max(p.x0 + 30, Math.min(p.x1 - 30, X(L.w))), y = Y(p, L.y);
          tx(gAsym, x + (L.dx || 0), Math.max(p.y0 + 18, Math.min(p.y1 - 8, y + (L.dy || -10))), L.t,
            { fs: REF.font.label, fill: line.color || ASY, b: 1 });
        });
      }));
    }

    /* ---------- 标注（转折频率 / ωc / γ / 电平线） ---------- */
    function drawMarks() {
      (data.marks || []).forEach(mk_ => {
        const m = mk_;
        if (m.type === "vline") {
          const x = X(m.w);
          panels.forEach(p => {
            if (x < p.x0 - 2 || x > p.x1 + 2) return;
            mk("line", { x1: x, y1: p.y0, x2: x, y2: p.y1, stroke: m.color || REF.color.secondary,
              "stroke-width": REF.stroke.mark, "stroke-dasharray": REF.dash.mark, opacity: .8, "clip-path": `url(#${p.clip})` }, gMark);
          });
          if (m.label && x > FULL.x0 && x < FULL.x1)
            tx(gMark, x + (m.dx || 0), panels[0].y0 + (m.dy || 20), m.label, { fs: REF.font.label, fill: m.color || INK, b: 1 });
        } else if (m.type === "wc") {
          const p = panelOf("mag"); if (!p) return;
          const x = X(m.w), y = Y(p, 0);
          if (x < p.x0 - 2 || x > p.x1 + 2) return;
          mk("line", { x1: x, y1: p.y0, x2: x, y2: p.y1, stroke: FOCUS, "stroke-width": REF.stroke.mark,
            "stroke-dasharray": REF.dash.mark, opacity: .85, "clip-path": `url(#${p.clip})` }, gMark);
          mk("circle", { cx: x, cy: y, r: REF.marker.wcRadius, fill: FOCUS, stroke: "#fff", "stroke-width": 2.5 }, gMark);
          tx(gMark, x + (m.dx || 14), y + (m.dy || -16), m.label || "ω_{c}", { fs: REF.font.label, fill: FOCUS, b: 1, an: "start" });
        } else if (m.type === "margin") {
          const p = panelOf("phase"); if (!p) return;
          const x = X(m.w), yPhi = Y(p, m.phi), y180 = Y(p, -180);
          if (x < p.x0 - 2 || x > p.x1 + 2) return;
          mk("line", { x1: x, y1: p.y0, x2: x, y2: p.y1, stroke: FOCUS, "stroke-width": REF.stroke.mark,
            "stroke-dasharray": REF.dash.mark, opacity: .55, "clip-path": `url(#${p.clip})` }, gMark);
          mk("line", { x1: x, y1: yPhi, x2: x, y2: y180, stroke: FOCUS, "stroke-width": 3.4 }, gMark);
          mk("circle", { cx: x, cy: yPhi, r: REF.marker.wcRadius, fill: FOCUS, stroke: "#fff", "stroke-width": 2.5 }, gMark);
          const ym = (yPhi + y180) / 2;
          tx(gMark, x + (m.dx || 12), ym + (m.dy || 6), m.label || ("γ=" + m.gamma + "°"), { fs: REF.font.label, fill: FOCUS, b: 1, an: "start" });
        } else if (m.type === "hlevel") {
          const p = panelOf("mag"); if (!p) return;
          const x0 = Math.max(p.x0, X(m.w0 != null ? m.w0 : xr0[0])),
                x1 = Math.min(p.x1, X(m.w1 != null ? m.w1 : xr0[1])), y = Y(p, m.y);
          if (y < p.y0 || y > p.y1) return;
          mk("line", { x1: x0, y1: y, x2: x1, y2: y, stroke: m.color || ASY, "stroke-width": REF.stroke.mark,
            "stroke-dasharray": REF.dash.hlevel, opacity: .9 }, gMark);
          if (m.label) tx(gMark, x1 - 8, y + (m.dy || -10), m.label, { fs: REF.font.label, fill: m.color || ASY, b: 1, an: "end" });
        }
      });
    }

    /* ---------- 分支生长（按 ω 从左到右） ---------- */
    function buildBranches() {
      pathEls = brs.map((b, i) => mk("path", { fill: "none", stroke: brColor[i], "stroke-width": REF.stroke.branch,
        "stroke-linecap": "round", opacity: bop[i], "clip-path": `url(#${brPanel[i].clip})` }, gBranch));
      epG = brs.map((b, i) => mk("g", { opacity: bop[i], "clip-path": `url(#${brPanel[i].clip})` }, gMove));
    }
    function setF(i, f) {
      const b = brs[i]; if (!b) return;
      const p = brPanel[i], n = b.length;
      bf[i] = f = Math.max(0, Math.min(1, f));
      const el = pathEls[i], g = epG[i];
      g.innerHTML = "";
      if (f <= 0) { el.setAttribute("d", ""); return; }
      const kk = Math.max(1, Math.min(n, Math.floor(f * (n - 1)) + 1));
      const pts = [];
      for (let j = 0; j < Math.min(kk, n); j++) pts.push([X(b[j][0]), Y(p, b[j][1])]);
      let ex, ey;
      if (kk < n) {
        const t = Math.max(0, Math.min(1, f * (n - 1) - (kk - 1)));
        ex = b[kk - 1][0] + (b[kk][0] - b[kk - 1][0]) * t;
        ey = b[kk - 1][1] + (b[kk][1] - b[kk - 1][1]) * t;
        pts.push([X(ex), Y(p, ey)]);
      } else { ex = b[n - 1][0]; ey = b[n - 1][1]; }
      el.setAttribute("d", toPath(clipPoly(pts, p)));
      if (opt.endpoint !== false && f > 0.02 && f < 1)
        mk("circle", { cx: X(ex), cy: Y(p, ey), r: REF.marker.movingPointRadius, fill: brColor[i], stroke: "#fff", "stroke-width": 2.5 }, g);
    }

    function render() {
      [gGrid, gTrack, gAsym, gBranch, gMark, gMove, gDyn].forEach(g => g.innerHTML = "");
      drawAxes(); drawTracks(); drawAsym(); buildBranches(); drawMarks();
      brs.forEach((_, i) => setF(i, bf[i]));
      if (opt.extra) opt.extra(api);
      if (api.onView) api.onView(api);
    }

    /* ---------- 缩放 / 平移 / 复位（手感与 RL 一致） ---------- */
    function clampView() {
      const mX = (lx1 - lx0) * .75;
      viewX.c = Math.max(homeX.c - mX, Math.min(homeX.c + mX, viewX.c));
      panels.forEach(p => {
        const mY = (p.yr[1] - p.yr[0]) * .75;
        p.viewY.c = Math.max(p.homeY.c - mY, Math.min(p.homeY.c + mY, p.viewY.c));
      });
    }
    function resetView() {
      viewX.c = homeX.c; viewX.s = homeX.s;
      panels.forEach(p => { p.viewY.c = p.homeY.c; p.viewY.s = p.homeY.s; });
      render();
    }
    const panelAtY = py => panels.find(p => py >= p.y0 - 8 && py <= p.y1 + 8) || panels[panels.length - 1];
    if (opt.zoom !== false) {
      svg.style.cursor = "grab";
      svg.style.touchAction = "none";
      let drag = null;
      svg.addEventListener("dblclick", () => resetView());
      svg.addEventListener("pointerdown", e => {
        drag = { x: e.clientX, y: e.clientY, cX: viewX.c, panels: panels.map(p => p.viewY.c) };
        if (svg.setPointerCapture) try { svg.setPointerCapture(e.pointerId); } catch (err) {}
        svg.style.cursor = "grabbing";
      });
      svg.addEventListener("pointermove", e => {
        if (!drag) return;
        const r = svg.getBoundingClientRect();
        if (!r.width) return;
        const k = VW / r.width;
        const py = (e.clientY - r.top) * VH / r.height;
        const p = panelAtY(py);
        viewX.c = drag.cX - (e.clientX - drag.x) * k / viewX.s;
        p.viewY.c = drag.panels[panels.indexOf(p)] + (e.clientY - drag.y) * k / p.viewY.s;
        clampView(); render();
      });
      const up = () => { if (drag) { drag = null; svg.style.cursor = "grab"; } };
      svg.addEventListener("pointerup", up);
      svg.addEventListener("pointercancel", up);
      svg.addEventListener("wheel", e => {
        e.preventDefault();
        const r = svg.getBoundingClientRect();
        if (!r.width) return;
        const mx = (e.clientX - r.left) * VW / r.width, my = (e.clientY - r.top) * VH / r.height;
        const p = panelAtY(my);
        const mLX = viewX.c + (mx - (FULL.x0 + PW / 2)) / viewX.s;
        const mY = p.viewY.c - (my - (p.y0 + p.h / 2)) / p.viewY.s;
        const nsX = Math.max(homeX.s * .9, Math.min(homeX.s * 40, viewX.s * Math.exp(-e.deltaY * .0013)));
        const nsY = Math.max(p.homeY.s * .9, Math.min(p.homeY.s * 40, p.viewY.s * Math.exp(-e.deltaY * .0013)));
        viewX.c = mLX - (mx - (FULL.x0 + PW / 2)) / nsX;
        viewX.s = nsX;
        p.viewY.c = mY + (my - (p.y0 + p.h / 2)) / nsY;
        p.viewY.s = nsY;
        clampView(); render();
      }, { passive: false });
    }

    const api = { svg, X, Y, VW, VH, PLOT: FULL, panels, panelOf, data, tx, mk, gTop: gMark, gDyn, gGrid, gMark, gAsym,
                  colorOf: brColor, setF, setOp: (i, op) => { bop[i] = op; pathEls[i].setAttribute("opacity", op); epG[i].setAttribute("opacity", op); },
                  setAllF: f => brs.forEach((_, i) => setF(i, f)),
                  setProgress: f => brs.forEach((_, i) => setF(i, f)),
                  getF: i => bf[i], nb: brs.length,
                  clipPoly, toPath, render, resetView, viewX, homeX, xr: xr0,
                  onView: null, onPick: null, _pickEnabled: false, setPickEnabled(v) { this._pickEnabled = !!v; }, pick: () => null, REF };

    /* QA 钩子：?zz=倍数 预设缩放（截图管线用） */
    const qp = new URLSearchParams(location.search);
    if (qp.has("zz")) {
      const z = Math.max(.9, Math.min(40, parseFloat(qp.get("zz")) || 1));
      viewX.s = homeX.s * z;
      panels.forEach(p => { p.viewY.s = p.homeY.s * z; });
      if (qp.has("zx")) viewX.c = parseFloat(qp.get("zx"));
      clampView();
    }
    if (opt.static) brs.forEach((_, i) => bf[i] = 1);
    render();
    return api;
  }

  /* ================= 步进接线（与 RL.wire 完全同款） =================
     total 步；paint(K) 画第 K 步图内装饰与静态开关（进度由 wire 负责）；
     o.figs 本页全部 figure；o.FS 每步连续进度阈值（长度 total+1，末位=1，缺省均匀）；
     o.frame(f,K,info) 联动面板逐帧刷新；o.segments 分步定义 [{label, parts:[{F,b:[分支],f0,f1}]}]；
     o.segLabel / o.segPaint / o.dur / o.segDur / o.segGap 同 RL。 */
  function wire(total, paint, o) {
    o = o || {};
    const S = ACT.step, _n = S.next.bind(S), _r = S.reset.bind(S);
    const figs = o.figs || [];
    const FS = o.FS || null;
    let K = 0, mode = "idle", raf = null; // idle | play | seg
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
    const solos = [];

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
      syncStepCur(K);
    }
    function applyK() {
      figs.forEach(F => { F.setAllF(fOf(K)); F.gDyn.innerHTML = ""; F.setPickEnabled(K >= total); });
      paint(K);
      progTxt(K + " / " + total);
      if (o.frame) o.frame(fOf(K), K, { mode: "step" });
    }
    figs.forEach(F => { F.onView = () => {
      if (mode === "seg" && o.segments) { F.gDyn.innerHTML = ""; (o.segPaint || paint)(total); segState(segSi, segT); }
      else applyK();
    }; });

    S.next = function () { stopAll(); if (K < total) K++; const d = _n(); applyK(); return d; };
    S.reset = function () { stopAll(); K = 0; _r(); applyK(); };
    window.prev = function () { if (K <= 0) return; const t = K - 1; S.reset(); for (let i = 0; i < t; i++) S.next(); };

    /* ---- 连贯平滑播放：rAF 连续推进共享进度，跨过步阈值时刷新该步装饰 ---- */
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

    /* ---- 分步播放：逐段生长，其余分支淡化 0.15 ---- */
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
        else sg._g = BD.mk("g", {}, figs[0].gDyn);
        sg.draw(t, sg._g);
      }
    }
    const stepBtn = document.getElementById("step");
    if (stepBtn && o.segments && o.segments.length) stepBtn.onclick = function () {
      if (mode === "seg") { stopAll(); return; }
      stopAll();
      _r(); for (let i = 0; i < total; i++) _n();
      K = total;
      figs.forEach(F => F.gDyn.innerHTML = ""); (o.segPaint || paint)(total);
      progTxt(total + " / " + total);
      mode = "seg"; setBtn("step", "❚❚ 暂停");
      const segs = o.segments, segDur = o.segDur || 3400, segGap = o.segGap || 650;
      segSi = 0;
      const runSeg = () => {
        if (mode !== "seg") return;
        if (segSi >= segs.length) {
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
    /* ---- 独立单图播放（对照页）：与总控互斥 ---- */
    (o.solos || []).forEach(so => {
      const F = so.F, btn = document.getElementById(so.btn), rst = document.getElementById(so.rst);
      if (!F || !btn || !rst) return;
      let sraf = null;
      const sStop = () => { if (sraf) { cancelAnimationFrame(sraf); sraf = null; btn.textContent = "▶ 播放"; } };
      solos.push(sStop);
      btn.onclick = function () {
        if (sraf) { sStop(); mode = "idle"; figs.forEach(X => X.setPickEnabled(false)); return; }
        stopAll();
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
    /* QA 钩子：?seg=N&segT=T 直达分步第 N 段（1 起）进度 T 的确定性画面（截图管线用） */
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

  /* ================= 方框图 helper =================
     blocks 元素（坐标为 viewBox 用户坐标）：
       {type:"box",  x, y, w, h, label, fill?, color?}   方框（label 支持 \n 多行与 _{} ^{}）
       {type:"sum",  x, y, r?, signs:{left?:"+"/"−", top?, right?, bottom?}}  求和点 ⊕
       {type:"line", pts:[[x,y],...], arrow?:true, label?, labelDx?, labelDy?, flow?:bool, color?}
         arrow 缺省 true；flow:true → 信号流虚线流动动画（装置接入 / 复合校正用）；
       {type:"dot",  x, y}                                引出点
     opt = {vw, vh, static}。返回 {svg, tx, mk, lines}（lines 供页面按名控制显隐）。 */
  function block(svgId, blocks, opt) {
    opt = opt || {};
    const svg = document.getElementById(svgId);
    const VW = opt.vw || REF.viewBox.width, VH = opt.vh || REF.viewBox.height;
    svg.setAttribute("viewBox", `0 0 ${VW} ${VH}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "100%";
    svg.innerHTML = "";
    const defs = mk("defs", {}, svg);
    arrowDef(svg, "bx" + svgId, INK);
    arrowDef(svg, "bxo" + svgId, REF.color.title);
    const g = mk("g", {}, svg);
    const lines = {};
    (blocks || []).forEach(b => {
      if (b.type === "box") {
        const rect = mk("rect", { x: b.x, y: b.y, width: b.w, height: b.h, rx: 8,
          fill: b.fill || "#F4F7FE", stroke: b.color || REF.color.title, "stroke-width": REF.stroke.block }, g);
        const rows = String(b.label || "").split("\n");
        rows.forEach((r, i) => tx(g, b.x + b.w / 2, b.y + b.h / 2 + (i - (rows.length - 1) / 2) * 30 + 8, r,
          { fs: b.fs || 24, fill: INK, b: 1, halo: false }));
        if (b.name) lines[b.name] = rect;
      } else if (b.type === "sum") {
        const r = b.r || 16;
        const c = mk("g", {}, g);
        mk("circle", { cx: b.x, cy: b.y, r, fill: "#fff", stroke: b.color || INK, "stroke-width": REF.stroke.block }, c);
        mk("line", { x1: b.x - r * .62, y1: b.y, x2: b.x + r * .62, y2: b.y, stroke: b.color || INK, "stroke-width": 2.2 }, c);
        mk("line", { x1: b.x, y1: b.y - r * .62, x2: b.x, y2: b.y + r * .62, stroke: b.color || INK, "stroke-width": 2.2 }, c);
        const pos = { left: [b.x - r - 10, b.y + 7, "end"], right: [b.x + r + 10, b.y + 7, "start"],
                      top: [b.x, b.y - r - 8, "middle"], bottom: [b.x, b.y + r + 20, "middle"] };
        for (const k in (b.signs || {})) {
          const p = pos[k]; if (!p) continue;
          tx(g, p[0], p[1], b.signs[k] === "-" ? "−" : b.signs[k], { fs: 26, fill: INK, b: 1, an: p[2] });
        }
        if (b.name) lines[b.name] = c;
      } else if (b.type === "line") {
        const d = "M" + b.pts.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join("L");
        const attrs = { d, fill: "none", stroke: b.color || INK, "stroke-width": REF.stroke.block, "stroke-linejoin": "round" };
        if (b.arrow !== false && !b.flow) attrs["marker-end"] = `url(#bx${b.color ? "o" : ""}${svgId})`;
        const el = mk("path", attrs, g);
        if (b.flow) {
          el.setAttribute("stroke-dasharray", REF.dash.flow);
          el.setAttribute("marker-end", `url(#bx${b.color ? "o" : ""}${svgId})`);
          const anim = mk("animate", { attributeName: "stroke-dashoffset", from: "36", to: "0", dur: "1.2s", repeatCount: "indefinite" }, el);
          if (opt.static) anim.remove();
        }
        if (b.label) {
          const mid = b.pts[Math.floor((b.pts.length - 1) / 2)];
          tx(g, mid[0] + (b.labelDx || 0), mid[1] + (b.labelDy || -12), b.label, { fs: 24, fill: b.color || INK, it: 1 });
        }
        if (b.name) lines[b.name] = el;
      } else if (b.type === "dot") {
        mk("circle", { cx: b.x, cy: b.y, r: 5.5, fill: INK }, g);
      }
    });
    return { svg, tx, mk, lines, g, VW, VH };
  }

  BD.REF = REF;
  window.BD.figure = figure;
  window.BD.wire = wire;
  window.BD.block = block;
  window.BD.mk = mk; window.BD.tx = tx;
  window.BD.clipPoly = clipPoly; window.BD.toPath = toPath;
  window.BD.sumCurves = sumCurves;
  window.BD.PAL = PAL; window.BD.AX = AX; window.BD.ASY = ASY;
  window.BD.TRACK = TRACK; window.BD.FOCUS = FOCUS; window.BD.INK = INK;
})();
