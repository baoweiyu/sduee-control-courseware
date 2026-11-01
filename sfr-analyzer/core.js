/* SFR 数值计算内核：与 UI 完全解耦，可在浏览器和 Node.js 中运行。 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SFR = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const PARAMS = ["H", "D", "KF", "TR", "FH"];
  const LABELS = { H: "H", D: "D", KF: "K_F", TR: "T_R", FH: "F_H", T1: "T₁", lambda: "λ" };
  const UNITS = { H: "s", D: "pu/pu", KF: "pu/pu", TR: "s", FH: "—", T1: "s", lambda: "—" };
  const EPS = 1e-10;

  function finite(x) { return typeof x === "number" && Number.isFinite(x); }
  function almost(a, b, tol = 1e-9) { return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b)); }
  function cloneBase(base) { return { H: base.H, D: base.D, KF: base.KF, TR: base.TR, FH: base.FH }; }

  function validateBase(p) {
    const errors = [];
    const warnings = [];
    for (const key of PARAMS) {
      if (!finite(p[key])) errors.push(`${LABELS[key]} 必须为有限数值`);
    }
    if (errors.length) return { valid: false, errors, warnings };
    if (p.H <= 0) errors.push("H 必须大于 0");
    if (p.TR <= 0) errors.push("T_R 必须大于 0");
    if (p.D < 0) errors.push("D 不能小于 0");
    if (p.KF < 0) errors.push("K_F 不能小于 0");
    if (p.FH < 0 || p.FH > 1) errors.push("F_H 必须处于 0～1");
    if (p.D + p.KF <= 0) errors.push("D + K_F 必须大于 0，否则频率偏差无有界准稳态");
    if (almost(p.D, 0)) warnings.push("D = 0：T₁、K₁、k 无常规有限值，当前采用未归一化物理模型计算");
    if (almost(p.FH, 1)) warnings.push("F_H = 1：闭环零点与 −1/T_R 极点相消，系统实际降为一阶");
    return { valid: errors.length === 0, errors, warnings };
  }

  function derive(p) {
    const T1 = p.D > EPS ? 2 * p.H / p.D : null;
    const K1 = p.D > EPS ? 1 / p.D : null;
    const T2 = p.TR;
    const lambda = T1 !== null ? T1 / T2 : null;
    const k = p.D > EPS ? p.KF / p.D : null;
    const Tm = T1 !== null ? Math.sqrt(T1 * T2) : null;
    return { T1, K1, T2, lambda, k, Tm };
  }

  function coefficients(p) {
    return {
      a2: 2 * p.H * p.TR,
      a1: 2 * p.H + (p.D + p.KF * p.FH) * p.TR,
      a0: p.D + p.KF,
      b1: p.TR,
      b0: 1
    };
  }

  function characteristic(p) {
    const check = validateBase(p);
    if (!check.valid) return { valid: false, errors: check.errors, warnings: check.warnings };
    const c = coefficients(p);
    const reduced = almost(p.FH, 1);
    const zc = -1 / p.TR;
    const zf = p.FH > EPS ? -1 / (p.FH * p.TR) : null;
    let poles, wn, zeta, damping, discriminant = null, cancelledPole = null;
    if (reduced) {
      poles = [{ re: -c.a0 / (2 * p.H), im: 0 }];
      cancelledPole = zc;
      wn = null;
      zeta = null;
      damping = "一阶 · 极零相消";
    } else {
      wn = Math.sqrt(c.a0 / c.a2);
      zeta = c.a1 / (2 * Math.sqrt(c.a0 * c.a2));
      discriminant = c.a1 * c.a1 - 4 * c.a2 * c.a0;
      const discTol = 1e-12 * Math.max(1, c.a1 * c.a1, 4 * c.a2 * c.a0);
      if (discriminant > discTol) {
        const root = Math.sqrt(discriminant);
        poles = [
          { re: (-c.a1 + root) / (2 * c.a2), im: 0 },
          { re: (-c.a1 - root) / (2 * c.a2), im: 0 }
        ];
        damping = "过阻尼";
      } else if (discriminant < -discTol) {
        const root = Math.sqrt(-discriminant);
        const re = -c.a1 / (2 * c.a2);
        const im = root / (2 * c.a2);
        poles = [{ re, im }, { re, im: -im }];
        damping = "欠阻尼";
      } else {
        poles = [{ re: -c.a1 / (2 * c.a2), im: 0 }, { re: -c.a1 / (2 * c.a2), im: 0 }];
        damping = "临界阻尼";
      }
    }
    const dominant = Math.min(...poles.map(q => Math.abs(q.re)));
    return {
      valid: true, p: cloneBase(p), derived: derive(p), coefficients: c,
      poles, zero: reduced ? null : zc, cancelledZero: reduced ? zc : null,
      cancelledPole, feedbackZero: zf, reduced, wn, zeta, damping,
      discriminant, dominant, warnings: check.warnings, errors: []
    };
  }

  // 负荷阶跃 ΔP > 0 时，Δf(t) = −ΔP·L⁻¹{Gd(s)/s}。
  function deviationAt(p, t, loadStep) {
    const c = coefficients(p);
    if (t === 0) return 0;
    if (almost(p.FH, 1)) {
      return -loadStep / c.a0 * (1 - Math.exp(-c.a0 * t / (2 * p.H)));
    }
    const ch = characteristic(p);
    const [p1, p2] = ch.poles;
    const steady = -loadStep / c.a0;
    if (almost(p1.im, 0) && almost(p2.im, 0) && almost(p1.re, p2.re)) {
      const r = p1.re;
      const C = -loadStep * (1 + p.TR * r) / (c.a2 * r);
      const B = -C / r + (-loadStep * p.TR / c.a2) / r;
      return steady + (B + C * t) * Math.exp(r * t);
    }
    if (almost(p1.im, 0) && almost(p2.im, 0)) {
      const r1 = p1.re, r2 = p2.re;
      const C1 = -loadStep * (1 + p.TR * r1) / (c.a2 * r1 * (r1 - r2));
      const C2 = -loadStep * (1 + p.TR * r2) / (c.a2 * r2 * (r2 - r1));
      return steady + C1 * Math.exp(r1 * t) + C2 * Math.exp(r2 * t);
    }
    const re = p1.re, im = Math.abs(p1.im);
    // C1 与 C2 共轭，2Re(C1·exp((re+i·im)t))。
    const z = { re: 1 + p.TR * re, im: p.TR * im };
    const den = {
      re: -2 * c.a2 * im * im,
      im: 2 * c.a2 * re * im
    };
    // den = a2 · p1 · (p1−p2) = a2 · p1 · 2i·im
    const C1re = -loadStep * (z.re * den.re + z.im * den.im) / (den.re * den.re + den.im * den.im);
    const C1im = -loadStep * (z.im * den.re - z.re * den.im) / (den.re * den.re + den.im * den.im);
    const e = Math.exp(re * t);
    return steady + 2 * e * (C1re * Math.cos(im * t) - C1im * Math.sin(im * t));
  }

  function response(p, options = {}) {
    const loadStep = options.loadStep ?? 0.1;
    const duration = options.duration ?? 100;
    const ratedFrequency = options.ratedFrequency ?? 50;
    const count = Math.max(200, Math.min(6000, options.points ?? 1601));
    if (!(loadStep > 0) || !(duration > 0) || !(ratedFrequency > 0)) {
      throw new Error("负荷扰动、仿真时长和额定频率必须大于 0");
    }
    const check = validateBase(p);
    if (!check.valid) throw new Error(check.errors.join("；"));
    const steadyDeviation = -loadStep / (p.D + p.KF);
    const finalFrequency = ratedFrequency + steadyDeviation;
    const values = new Array(count);
    let minDeviation = 0;
    let nadirIndex = 0;
    for (let i = 0; i < count; i++) {
      const t = duration * i / (count - 1);
      const deviation = deviationAt(p, t, loadStep);
      values[i] = { t, deviation, frequency: ratedFrequency + deviation, normalized: deviation / steadyDeviation };
      if (deviation < minDeviation) { minDeviation = deviation; nadirIndex = i; }
    }
    // 一阶约简模型单调趋近准稳态，最低频率位于仿真末端；避免机器精度平台截断。
    if (almost(p.FH, 1)) {
      nadirIndex = count - 1;
      minDeviation = values[nadirIndex].deviation;
    }
    const tolerance = Math.abs(steadyDeviation) * 0.02;
    let lastOutside = -1;
    for (let i = 0; i < count; i++) {
      if (Math.abs(values[i].deviation - steadyDeviation) > tolerance) lastOutside = i;
    }
    const settled = lastOutside < count - 1;
    const settlingTime = settled ? (lastOutside < 0 ? 0 : values[lastOutside + 1].t) : null;
    const overshoot = Math.max(0, Math.abs(minDeviation / steadyDeviation) - 1) * 100;
    return {
      values, steadyDeviation, finalFrequency, tolerance,
      fMin: values[nadirIndex].frequency, tNadir: values[nadirIndex].t,
      minDeviation, overshoot, settlingTime, settled,
      initialRocofPu: -loadStep / (2 * p.H),
      initialRocofHz: -loadStep / (2 * p.H) * ratedFrequency
    };
  }

  function inRanges(p, ranges) {
    const violations = [];
    for (const key of PARAMS) {
      const range = ranges[key];
      if (!range || !finite(range[0]) || !finite(range[1]) || range[0] > range[1]) {
        violations.push(`${LABELS[key]} 的允许范围无效`);
      } else if (p[key] < range[0] - 1e-10 || p[key] > range[1] + 1e-10) {
        violations.push(`${LABELS[key]} = ${format(p[key])} 超出 [${format(range[0])}, ${format(range[1])}]`);
      }
    }
    return violations;
  }

  function baseAtScan(config, value) {
    const p = cloneBase(config.base);
    const scan = config.scan;
    const d = derive(p);
    if (scan.variable === "T1") {
      if (!(value > 0)) return { p, value, errors: ["T₁ 必须大于 0"] };
      if (scan.path === "fixedD") {
        if (p.D <= 0) return { p, value, errors: ["固定 D 调整 T₁ 时 D 必须大于 0"] };
        p.H = value * p.D / 2;
      } else {
        if (p.H <= 0) return { p, value, errors: ["H 必须大于 0"] };
        p.D = 2 * p.H / value;
      }
    } else if (scan.variable === "lambda") {
      if (!(value > 0)) return { p, value, errors: ["λ 必须大于 0"] };
      if (!d.T1 || !d.Tm) return { p, value, errors: ["D = 0 时无法定义 λ 扫描，请使用物理参数扫描"] };
      if (scan.path === "A") {
        p.TR = d.T1 / value;
      } else if (scan.path === "B") {
        if (p.D <= 0) return { p, value, errors: ["路径 B 固定 D 调整 T₁ 时 D 必须大于 0"] };
        p.H = value * p.TR * p.D / 2;
      } else {
        const T1 = d.Tm * Math.sqrt(value);
        p.TR = d.Tm / Math.sqrt(value);
        p.H = T1 * p.D / 2;
      }
    } else {
      p[scan.variable] = value;
    }
    const mathCheck = validateBase(p);
    const rangeErrors = config.ranges ? inRanges(p, config.ranges) : [];
    return { p, value, errors: [...mathCheck.errors, ...rangeErrors], warnings: mathCheck.warnings };
  }

  function scanIntersection(config) {
    const s = config.scan;
    const r = config.ranges;
    const b = config.base;
    let lo = s.min, hi = s.max;
    const intersect = (a, c) => { lo = Math.max(lo, a); hi = Math.min(hi, c); };
    if (PARAMS.includes(s.variable)) {
      intersect(r[s.variable][0], r[s.variable][1]);
    } else if (s.variable === "T1") {
      if (s.path === "fixedD" && b.D > 0) intersect(2 * r.H[0] / b.D, 2 * r.H[1] / b.D);
      if (s.path === "fixedH") {
        const low = r.D[1] > 0 ? 2 * b.H / r.D[1] : Infinity;
        const high = r.D[0] > 0 ? 2 * b.H / r.D[0] : Infinity;
        intersect(low, high);
      }
    } else if (s.variable === "lambda" && b.D > 0) {
      const d = derive(b);
      if (s.path === "A") {
        intersect(d.T1 / r.TR[1], d.T1 / r.TR[0]);
      } else if (s.path === "B") {
        intersect(2 * r.H[0] / (b.D * b.TR), 2 * r.H[1] / (b.D * b.TR));
      } else {
        const hLo = Math.pow(2 * r.H[0] / (b.D * d.Tm), 2);
        const hHi = Math.pow(2 * r.H[1] / (b.D * d.Tm), 2);
        intersect(hLo, hHi);
        intersect(Math.pow(d.Tm / r.TR[1], 2), Math.pow(d.Tm / r.TR[0], 2));
      }
    }
    return { min: lo, max: hi, valid: lo <= hi && finite(lo) && finite(hi) };
  }

  function scan(config) {
    const s = config.scan;
    const n = Math.max(3, Math.min(1001, Math.round(config.sampleCount || 121)));
    const results = [];
    for (let i = 0; i < n; i++) {
      const value = s.min + (s.max - s.min) * i / (n - 1);
      const mapped = baseAtScan(config, value);
      if (mapped.errors.length) {
        results.push({ index: i, value, valid: false, errors: mapped.errors });
      } else {
        const ch = characteristic(mapped.p);
        results.push({ index: i, value, valid: true, p: mapped.p, characteristic: ch });
      }
    }
    return { results, intersection: scanIntersection(config) };
  }

  function format(x, digits = 4) {
    if (x === null || x === undefined || !Number.isFinite(x)) return "—";
    const a = Math.abs(x);
    if (a !== 0 && (a >= 1e5 || a < 1e-4)) return x.toExponential(3);
    return Number(x.toFixed(digits)).toString();
  }

  return {
    PARAMS, LABELS, UNITS, finite, almost, cloneBase, validateBase, derive,
    coefficients, characteristic, deviationAt, response, inRanges,
    baseAtScan, scanIntersection, scan, format
  };
});
