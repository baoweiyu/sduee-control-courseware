/* ==========================================================================
   可复用组件库（P0 最小实现，随真实课程迭代增强）
   - ACT.ResponsePlot  二阶系统单位阶跃响应（解析解，程序生成曲线，非图片）
   - ACT.slider        参数滑块（数值联动、范围约束、重置）
   数学正确性：与 qa/ 中数值测试共用同一公式实现。
   ========================================================================== */
(function () {
  "use strict";
  window.ACT = window.ACT || {};

  /* ---- 数学逻辑层：标准二阶系统 G(s)=ωn²/(s²+2ζωn s+ωn²) 单位阶跃响应 ---- */
  const SecondOrder = {
    // 返回 {t:[], y:[], metrics:{tp,po,tr,ts,stable}}
    stepResponse(zeta, wn, tMax, n) {
      n = n || 400;
      const t = [], y = [];
      const z = Math.max(zeta, 1e-6);
      for (let i = 0; i <= n; i++) {
        const ti = (tMax * i) / n;
        t.push(ti);
        y.push(this._y(z, wn, ti));
      }
      return { t, y, metrics: this.metrics(z, wn) };
    },
    _y(z, wn, t) {
      if (t <= 0) return 0;
      if (z < 1) {                                   // 欠阻尼
        const wd = wn * Math.sqrt(1 - z * z);
        const phi = Math.atan2(Math.sqrt(1 - z * z), z);
        return 1 - Math.exp(-z * wn * t) / Math.sqrt(1 - z * z) * Math.sin(wd * t + phi);
      }
      if (Math.abs(z - 1) < 1e-9) {                  // 临界阻尼
        return 1 - (1 + wn * t) * Math.exp(-wn * t);
      }
      const s1 = -wn * (z - Math.sqrt(z * z - 1));   // 过阻尼
      const s2 = -wn * (z + Math.sqrt(z * z - 1));
      return 1 + (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s1 - s2);
    },
    metrics(z, wn) {
      if (z >= 1) {  // 临界/过阻尼：无超调，ts≈按 2% 带数值解
        const ts = this._settle(z, wn);
        return { tp: null, po: 0, tr: null, ts };
      }
      const wd = wn * Math.sqrt(1 - z * z);
      const tp = Math.PI / wd;
      const po = Math.exp(-Math.PI * z / Math.sqrt(1 - z * z)) * 100;
      const tr = (Math.PI - Math.atan2(Math.sqrt(1 - z * z), z)) / wd;
      const ts = 4 / (z * wn);                     // 2% 误差带近似
      return { tp, po, tr, ts };
    },
    _settle(z, wn) { // 数值求 2% 调节时间
      let t = 0; const dt = 0.005 / wn * (z > 1 ? z : 1);
      for (let k = 0; k < 200000; k++) {
        t += dt;
        if (Math.abs(this._y(z, wn, t) - 1) > 0.02) continue;
        // 确认之后都保持在带内（粗查）
        if (Math.abs(this._y(z, wn, t + 20 * dt) - 1) <= 0.02) return t;
      }
      return t;
    }
  };
  window.ACT.SecondOrder = SecondOrder;

  /* ---- ResponsePlot：SVG 阶跃响应图 ----
     new ACT.ResponsePlot(el, {width,height,xLabel,yLabel})
     .setData({t,y,metrics})  自动坐标、网格、参考线 y=1、超调标注 */
  function ResponsePlot(el, opt) {
    opt = opt || {};
    const W = opt.width || 620, H = opt.height || 420;
    const M = { l: 64, r: 24, t: 24, b: 56 };
    el.classList.add("act-plot");
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    el.innerHTML = ""; el.appendChild(svg);
    const mk = (tag, attrs, parent) => {
      const n = document.createElementNS(NS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      (parent || svg).appendChild(n); return n;
    };
    const txt = (x, y, s, cls, anchor) => {
      const n = mk("text", { x, y, "text-anchor": anchor || "middle" });
      if (cls) n.setAttribute("class", cls);
      n.textContent = s; return n;
    };

    this.setData = function (d, opt2) {
      opt2 = opt2 || {};
      svg.innerHTML = "";
      const tMax = d.t[d.t.length - 1];
      const yMax = Math.max(1.2, ...d.y.map(v => v)) * 1.08;
      const X = v => M.l + (v / tMax) * (W - M.l - M.r);
      const Y = v => H - M.b - (v / yMax) * (H - M.t - M.b);
      // 网格与刻度
      for (let i = 0; i <= 5; i++) {
        const tv = (tMax * i) / 5;
        mk("line", { x1: X(tv), y1: M.t, x2: X(tv), y2: H - M.b, class: "grid" });
        txt(X(tv), H - M.b + 26, +tv.toFixed(2) + "");
      }
      const yTicks = [0, 0.5, 1, 1.5, 2].filter(v => v <= yMax);
      yTicks.forEach(v => {
        mk("line", { x1: M.l, y1: Y(v), x2: W - M.r, y2: Y(v), class: v === 1 ? "ref" : "grid" });
        txt(M.l - 12, Y(v) + 6, v + "", null, "end");
      });
      mk("line", { x1: M.l, y1: H - M.b, x2: W - M.r + 8, y2: H - M.b, class: "axis", "marker-end": "url(#actArr)" });
      mk("line", { x1: M.l, y1: H - M.b, x2: M.l, y2: M.t - 8, class: "axis", "marker-end": "url(#actArr)" });
      const defs = mk("defs", {});
      const mkd = mk("marker", { id: "actArr", markerWidth: 10, markerHeight: 10, refX: 7, refY: 3, orient: "auto" }, defs);
      mk("path", { d: "M0,0 L7,3 L0,6 Z", fill: "#5B6B8C" }, mkd);
      txt(W - M.r, H - M.b + 30, opt2.xLabel || "t / s", "tag", "end");
      txt(M.l - 8, M.t - 10, opt2.yLabel || "y(t)", "tag", "end");
      // 曲线
      let path = "";
      d.t.forEach((ti, i) => { path += (i ? "L" : "M") + X(ti).toFixed(1) + "," + Y(d.y[i]).toFixed(1); });
      mk("path", { d: path, class: "curve" });
      // 指标标注
      const m = d.metrics || {};
      if (m.tp && m.po > 0.5) {
        const yp = 1 + m.po / 100;
        mk("circle", { cx: X(m.tp), cy: Y(yp), r: 6, fill: "#F5821F" });
        txt(X(m.tp), Y(yp) - 14, `σ%=${m.po.toFixed(1)}%`, "tag");
        mk("line", { x1: X(m.tp), y1: Y(yp), x2: X(m.tp), y2: Y(1), class: "ref" });
      }
      if (m.ts) txt(W - M.r - 4, M.t + 22, `t_s≈${m.ts.toFixed(2)}s`, "tag", "end");
    };
  }
  window.ACT.ResponsePlot = ResponsePlot;

  /* ---- ParameterSlider ----
     ACT.slider(el,{label,min,max,step,value,unit,onChange}) → {get,reset,set} */
  window.ACT.slider = function (el, o) {
    el.className = "act-slider";
    el.innerHTML =
      `<span class="lab">${o.label}</span>` +
      `<input type="range" min="${o.min}" max="${o.max}" step="${o.step}" value="${o.value}">` +
      `<span class="val">${o.value}${o.unit || ""}</span>`;
    const inp = el.querySelector("input"), val = el.querySelector(".val");
    const fmt = v => (+v).toFixed(String(o.step).includes(".") ? String(o.step).split(".")[1].length : 0);
    inp.addEventListener("input", () => {
      val.textContent = fmt(inp.value) + (o.unit || "");
      o.onChange && o.onChange(+inp.value);
    });
    return {
      get: () => +inp.value,
      set(v) { inp.value = v; val.textContent = fmt(v) + (o.unit || ""); o.onChange && o.onChange(+v); },
      reset() { this.set(o.value); }
    };
  };
})();
