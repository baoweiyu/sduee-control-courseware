/* global SFR */
"use strict";

const DEFAULT_CONFIG = {
  version: 1,
  name: "经典 SFR 参数研究",
  base: { H: 5, D: 1, KF: 20, TR: 10, FH: 0.5 },
  ranges: { H: [1, 10], D: [0.2, 2], KF: [5, 40], TR: [2, 20], FH: [0, 1] },
  ratedFrequency: 50,
  loadStep: 0.1,
  duration: 100,
  sampleCount: 121,
  curveCount: 9,
  scan: { variable: "lambda", path: "C", min: 0.25, max: 4 }
};

const $ = id => document.getElementById(id);
const deepCopy = obj => JSON.parse(JSON.stringify(obj));
const state = {
  config: deepCopy(DEFAULT_CONFIG), scanData: null, currentValue: 1,
  current: null, response: null, background: [], baseline: null,
  baselineVisible: true, responseMode: "actual", showNadir: true, showBand: true,
  autoTime: true, timeMax: DEFAULT_CONFIG.duration, poleView: null,
  poleTransform: null, candidates: [], toastTimer: null
};

const PARAM_META = {
  H: { label: "H", title: "惯性常数", unit: "s" },
  D: { label: "D", title: "负荷阻尼", unit: "pu/pu" },
  KF: { label: "K_F", title: "调频增益", unit: "pu/pu" },
  TR: { label: "T_R", title: "再热时间常数", unit: "s" },
  FH: { label: "F_H", title: "快通道比例", unit: "—" },
  T1: { label: "T₁", title: "T₁ 专项扫描", unit: "s" },
  lambda: { label: "λ", title: "时间常数比", unit: "—" }
};
const PATHS = {
  T1: [
    ["fixedD", "固定 D · 改变 H", "T₁ = 2H/D。保持 D 不变，通过改变 H 调整 T₁；K₁ 与 k 保持不变。"],
    ["fixedH", "固定 H · 改变 D", "T₁ = 2H/D。保持 H 不变，通过改变 D 调整 T₁；K₁ 与 k 会同步变化。"]
  ],
  lambda: [
    ["A", "路径 A · 固定 T₁，改变 T₂", "固定 H、D，T₂ = T₁/λ，仅改变 T_R；相同 λ 不代表其他路径具有相同时间尺度。"],
    ["B", "路径 B · 固定 T₂，改变 T₁", "固定 D、T_R，T₁ = λT₂，通过改变 H 实现；T₂ 与闭环零点保持不动。"],
    ["C", "路径 C · 固定 T_m，T₁、T₂ 同变", "固定 D 与 T_m = √(T₁T₂)，令 T₁ = T_m√λ、T₂ = T_m/√λ，同时改变 H 与 T_R。"]
  ]
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function fmt(x, n = 4) { return SFR.format(x, n); }
function showToast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2600);
}
function currentScanBaseValue() {
  const s = state.config.scan;
  if (SFR.PARAMS.includes(s.variable)) return state.config.base[s.variable];
  const d = SFR.derive(state.config.base);
  return s.variable === "T1" ? d.T1 : d.lambda;
}

function buildParameterRows() {
  $("parameterRows").innerHTML = SFR.PARAMS.map(key => `<tr>
    <td title="${PARAM_META[key].title}">${PARAM_META[key].label}</td>
    <td><input class="initial" data-param="${key}" data-kind="initial" type="number" step="any" aria-label="${key} 初始值"></td>
    <td><input data-param="${key}" data-kind="min" type="number" step="any" aria-label="${key} 最小值"></td>
    <td><input data-param="${key}" data-kind="max" type="number" step="any" aria-label="${key} 最大值"></td>
  </tr>`).join("");
  document.querySelectorAll("[data-param]").forEach(input => input.addEventListener("change", onParameterChange));
}

function syncConfigUI() {
  const c = state.config;
  $("sceneName").value = c.name;
  SFR.PARAMS.forEach(key => {
    document.querySelector(`[data-param="${key}"][data-kind="initial"]`).value = c.base[key];
    document.querySelector(`[data-param="${key}"][data-kind="min"]`).value = c.ranges[key][0];
    document.querySelector(`[data-param="${key}"][data-kind="max"]`).value = c.ranges[key][1];
  });
  $("ratedFrequency").value = c.ratedFrequency;
  $("loadStep").value = c.loadStep;
  $("duration").value = c.duration;
  $("sampleCount").value = c.sampleCount;
  $("curveCount").value = c.curveCount;
  $("scanVariable").value = c.scan.variable;
  updatePathOptions(false);
  $("scanPath").value = c.scan.path;
  $("scanMin").value = c.scan.min;
  $("scanMax").value = c.scan.max;
  updateDerivedPanel();
}

function onParameterChange(event) {
  const input = event.target;
  const key = input.dataset.param;
  const value = Number(input.value);
  if (!Number.isFinite(value)) { showToast("请输入有限数值"); syncConfigUI(); return; }
  if (input.dataset.kind === "initial") state.config.base[key] = value;
  else state.config.ranges[key][input.dataset.kind === "min" ? 0 : 1] = value;
  state.currentValue = currentScanBaseValue() ?? state.config.scan.min;
  state.poleView = null;
  recomputeAll();
}

function updatePathOptions(resetRange = true) {
  const variable = $("scanVariable").value;
  const wrap = $("pathWrap");
  if (!PATHS[variable]) {
    wrap.hidden = true;
    state.config.scan.path = "physical";
  } else {
    wrap.hidden = false;
    const paths = PATHS[variable];
    if (!paths.some(p => p[0] === state.config.scan.path)) state.config.scan.path = paths[0][0];
    $("scanPath").innerHTML = paths.map(p => `<option value="${p[0]}">${p[1]}</option>`).join("");
    $("scanPath").value = state.config.scan.path;
    $("pathDescription").textContent = paths.find(p => p[0] === state.config.scan.path)[2];
  }
  if (resetRange) setDefaultScanRange(variable);
}

function setDefaultScanRange(variable) {
  const c = state.config;
  if (SFR.PARAMS.includes(variable)) {
    c.scan.min = c.ranges[variable][0]; c.scan.max = c.ranges[variable][1];
  } else {
    const value = variable === "T1" ? SFR.derive(c.base).T1 : SFR.derive(c.base).lambda;
    c.scan.min = value && Number.isFinite(value) ? value / 4 : 0.25;
    c.scan.max = value && Number.isFinite(value) ? value * 4 : 4;
  }
  $("scanMin").value = c.scan.min;
  $("scanMax").value = c.scan.max;
  state.currentValue = currentScanBaseValue() ?? c.scan.min;
}

function readSimulationSettings() {
  state.config.name = $("sceneName").value.trim() || "未命名 SFR 场景";
  state.config.ratedFrequency = Number($("ratedFrequency").value);
  state.config.loadStep = Number($("loadStep").value);
  state.config.duration = Number($("duration").value);
  state.config.sampleCount = Math.round(Number($("sampleCount").value));
  state.config.curveCount = Math.round(Number($("curveCount").value));
  state.timeMax = state.config.duration;
  $("timeMax").value = state.timeMax;
}

function applyScanRange() {
  const min = Number($("scanMin").value), max = Number($("scanMax").value);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
    showToast("扫描范围须为有限数值，且下限小于上限"); return;
  }
  state.config.scan.min = min; state.config.scan.max = max;
  readSimulationSettings();
  if (!Number.isFinite(state.currentValue) || state.currentValue < min || state.currentValue > max) {
    state.currentValue = currentScanBaseValue();
    if (!Number.isFinite(state.currentValue) || state.currentValue < min || state.currentValue > max) state.currentValue = (min + max) / 2;
  }
  state.poleView = null;
  recomputeAll();
}

function responseOptions(points = 1601) {
  const c = state.config;
  return { ratedFrequency: c.ratedFrequency, loadStep: c.loadStep, duration: c.duration, points };
}

function recomputeAll() {
  readSimulationSettings();
  state.scanData = SFR.scan(state.config);
  const valid = state.scanData.results.filter(r => r.valid);
  const desired = Math.max(3, Math.min(21, state.config.curveCount || 9));
  const selected = [];
  if (valid.length) {
    const count = Math.min(desired, valid.length);
    for (let i = 0; i < count; i++) selected.push(valid[Math.round((valid.length - 1) * i / Math.max(1, count - 1))]);
  }
  state.background = selected.map(sample => {
    try { return { sample, response: SFR.response(sample.p, responseOptions(801)) }; }
    catch (error) { return { sample, error: error.message }; }
  }).filter(item => item.response);
  updateCurrent();
  updateIntersection();
}

function updateCurrent() {
  const c = state.config;
  $("parameterSlider").min = c.scan.min; $("parameterSlider").max = c.scan.max;
  // 连续滑块确保端点（尤其 F_H=1）不会被离散步长吸附；方向键提供精细步进。
  $("parameterSlider").step = "any";
  $("parameterSlider").value = state.currentValue;
  $("currentValue").value = Number(state.currentValue.toPrecision(8));
  $("sliderMin").textContent = fmt(c.scan.min, 3); $("sliderMax").textContent = fmt(c.scan.max, 3);
  const meta = PARAM_META[c.scan.variable];
  $("scanVariableBadge").textContent = meta.label;
  $("currentValueLabel").textContent = meta.label + " =";
  $("currentUnit").textContent = meta.unit;
  const path = PATHS[c.scan.variable]?.find(p => p[0] === c.scan.path);
  $("selectionTitle").textContent = path ? path[1] : `单参数扫描 · ${meta.title}`;
  const mapped = SFR.baseAtScan(c, state.currentValue);
  if (mapped.errors.length) {
    state.current = null; state.response = null;
  } else {
    state.current = SFR.characteristic(mapped.p);
    try { state.response = SFR.response(mapped.p, responseOptions(2201)); }
    catch (error) { state.response = null; mapped.errors.push(error.message); }
  }
  state.currentMapped = mapped;
  state.poleView = state.poleView;
  renderAll();
}

function updateDerivedPanel() {
  const d = SFR.derive(state.config.base);
  const items = [["T₁", d.T1, "s"], ["T₂", d.T2, "s"], ["λ", d.lambda, ""], ["K₁", d.K1, ""], ["k", d.k, ""], ["T_m", d.Tm, "s"]];
  $("derivedPanel").innerHTML = items.map(([label, value, unit]) => `<div class="derived-item"><span>${label}${unit ? " / " + unit : ""}</span><strong>${fmt(value)}</strong></div>`).join("");
}

function updateIntersection() {
  const info = state.scanData.intersection;
  const validCount = state.scanData.results.filter(r => r.valid).length;
  if (info.valid) {
    $("intersectionInfo").className = "intersection-info";
    $("intersectionInfo").innerHTML = `物理范围交集：<strong>[${fmt(info.min)}, ${fmt(info.max)}]</strong><br>有效采样 ${validCount} / ${state.scanData.results.length}，范围外工况已排除`;
  } else {
    $("intersectionInfo").className = "intersection-info invalid";
    $("intersectionInfo").textContent = "扫描区间与物理参数允许范围没有有效交集，请调整范围或路径。";
  }
}

function renderMessages() {
  const messages = [];
  const baseCheck = SFR.validateBase(state.config.base);
  baseCheck.errors.forEach(e => messages.push(["error", e]));
  baseCheck.warnings.forEach(w => messages.push(["warning", w]));
  SFR.PARAMS.forEach(key => {
    const r = state.config.ranges[key];
    if (r[0] > r[1]) messages.push(["error", `${PARAM_META[key].label} 的允许最小值大于最大值`]);
    const b = state.config.base[key];
    if (b < r[0] || b > r[1]) messages.push(["warning", `${PARAM_META[key].label} 初始值不在用户指定范围内`]);
  });
  if (!(state.config.duration > 0) || !(state.config.loadStep > 0) || !(state.config.ratedFrequency > 0)) messages.push(["error", "额定频率、负荷阶跃和仿真时长均须大于 0"]);
  if (state.currentMapped?.errors.length) state.currentMapped.errors.forEach(e => messages.push(["error", `当前工况：${e}`]));
  if (state.current?.warnings) state.current.warnings.forEach(w => messages.push(["warning", `当前工况：${w}`]));
  if (state.response && !state.response.settled) messages.push(["warning", `当前工况在 ${fmt(state.config.duration)} s 内未进入并保持在 2% 整定带内，请延长仿真时长`]);
  if (!messages.length) messages.push(["ok", "参数与扫描组合通过数学合法性及物理范围检查"]);
  const unique = [...new Map(messages.map(m => [m[0] + m[1], m])).values()];
  $("validationMessages").innerHTML = unique.map(([type, text]) => `<div class="message ${type}">${escapeHtml(text)}</div>`).join("");
}

function renderAll() {
  updateDerivedPanel();
  renderMessages();
  renderPoleChart();
  renderResponseChart();
  renderMetrics();
}

function niceTicks(min, max, count = 6) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0];
  if (Math.abs(max - min) < 1e-12) return [min];
  const raw = (max - min) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const start = Math.ceil(min / step) * step;
  const ticks = [];
  for (let v = start, i = 0; v <= max + step * 1e-8 && i < 100; v += step, i++) ticks.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return ticks;
}
function chartSize(svg) {
  const rect = svg.getBoundingClientRect();
  return { width: Math.max(320, rect.width || 600), height: Math.max(260, rect.height || 360) };
}
function svgText(x, y, text, attrs = "") { return `<text x="${x}" y="${y}" ${attrs}>${escapeHtml(text)}</text>`; }
function polePosition(result, branch) { return result.characteristic.poles[branch] || null; }
function linePath(points, sx, sy) {
  let path = "", open = false;
  points.forEach(q => {
    if (!q || !Number.isFinite(q.re) || !Number.isFinite(q.im)) { open = false; return; }
    path += `${open ? "L" : "M"}${sx(q.re).toFixed(2)},${sy(q.im).toFixed(2)}`;
    open = true;
  });
  return path;
}
function colorFor(index, total) {
  const t = total <= 1 ? 0 : index / (total - 1);
  const a = [142, 190, 199], b = [18, 94, 119];
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
}

function poleDomain(width, height, margins) {
  if (state.poleView) return { ...state.poleView };
  const valid = state.scanData?.results.filter(r => r.valid) || [];
  const xs = [], ys = [];
  valid.forEach(r => {
    r.characteristic.poles.forEach(p => { xs.push(p.re); ys.push(p.im); });
    if (r.characteristic.zero !== null) xs.push(r.characteristic.zero);
  });
  if (state.current) state.current.poles.forEach(p => { xs.push(p.re); ys.push(p.im); });
  if (!xs.length) return { xmin: -1, xmax: 1, ymin: -1, ymax: 1 };
  let xmin = Math.min(...xs), xmax = Math.max(...xs);
  const xpad = Math.max((xmax - xmin) * 0.12, Math.abs(xmax) * 0.04, 0.02);
  xmin -= xpad; xmax += xpad;
  let ymax = Math.max(...ys.map(Math.abs), (xmax - xmin) * 0.06, 0.01) * 1.18;
  let ymin = -ymax;
  if ($("equalAxis").checked) {
    const w = width - margins.l - margins.r, h = height - margins.t - margins.b;
    const scale = Math.max((xmax - xmin) / w, (ymax - ymin) / h);
    const xc = (xmin + xmax) / 2, yc = (ymin + ymax) / 2;
    xmin = xc - scale * w / 2; xmax = xc + scale * w / 2;
    ymin = yc - scale * h / 2; ymax = yc + scale * h / 2;
  }
  return { xmin, xmax, ymin, ymax };
}

function renderPoleChart() {
  const svg = $("poleSvg"), { width, height } = chartSize(svg);
  const m = { l: 58, r: 20, t: 22, b: 45 }, w = width - m.l - m.r, h = height - m.t - m.b;
  const d = poleDomain(width, height, m);
  const sx = x => m.l + (x - d.xmin) / (d.xmax - d.xmin) * w;
  const sy = y => m.t + (d.ymax - y) / (d.ymax - d.ymin) * h;
  state.poleTransform = { sx, sy, domain: d, margins: m, width, height };
  let out = `<defs><marker id="poleArrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8 z" fill="#438e99"/></marker></defs>`;
  const xt = niceTicks(d.xmin, d.xmax, 6), yt = niceTicks(d.ymin, d.ymax, 6);
  xt.forEach(v => { const x = sx(v); out += `<line x1="${x}" y1="${m.t}" x2="${x}" y2="${m.t + h}" stroke="#e9eff1"/>` + svgText(x, m.t + h + 18, fmt(v, 3), 'text-anchor="middle" fill="#72858f" font-size="10"'); });
  yt.forEach(v => { const y = sy(v); out += `<line x1="${m.l}" y1="${y}" x2="${m.l + w}" y2="${y}" stroke="#e9eff1"/>` + svgText(m.l - 8, y + 3, fmt(v, 3), 'text-anchor="end" fill="#72858f" font-size="10"'); });
  if (d.xmin < 0 && d.xmax > 0) out += `<line x1="${sx(0)}" y1="${m.t}" x2="${sx(0)}" y2="${m.t + h}" stroke="#a9bac2" stroke-width="1.1"/>`;
  if (d.ymin < 0 && d.ymax > 0) out += `<line x1="${m.l}" y1="${sy(0)}" x2="${m.l + w}" y2="${sy(0)}" stroke="#a9bac2" stroke-width="1.1"/>`;
  out += svgText(m.l + w / 2, height - 7, "实部 Re(s)  /  s⁻¹", 'text-anchor="middle" fill="#4e6876" font-size="11"');
  out += `<text x="15" y="${m.t + h / 2}" transform="rotate(-90 15 ${m.t + h / 2})" text-anchor="middle" fill="#4e6876" font-size="11">虚部 Im(s) / s⁻¹</text>`;
  const valid = state.scanData?.results.filter(r => r.valid) || [];
  const maxBranches = Math.max(0, ...valid.map(r => r.characteristic.poles.length));
  for (let branch = 0; branch < maxBranches; branch++) {
    const points = valid.map(r => polePosition(r, branch));
    const path = linePath(points, sx, sy);
    if (path) out += `<path d="${path}" fill="none" stroke="#438e99" stroke-width="2" opacity=".46" marker-end="url(#poleArrow)"/>`;
  }
  // 少量轨迹节点保留完整参数索引，点击时按屏幕距离匹配。
  valid.forEach((r, i) => {
    if (i % Math.max(1, Math.floor(valid.length / 28)) !== 0) return;
    r.characteristic.poles.forEach(p => { out += `<circle cx="${sx(p.re)}" cy="${sy(p.im)}" r="1.8" fill="#4d929b" opacity=".45"/>`; });
  });
  const zeros = valid.map(r => r.characteristic.zero).filter(z => z !== null);
  if (zeros.length) {
    const zmin = Math.min(...zeros), zmax = Math.max(...zeros);
    if (Math.abs(zmax - zmin) > 1e-8 * Math.max(1, Math.abs(zmax))) {
      out += `<path d="${linePath(zeros.map(re => ({ re, im: 0 })), sx, sy)}" fill="none" stroke="#d98a4d" stroke-width="1.7" stroke-dasharray="4 3" opacity=".65"/>`;
      state.background.forEach(({ sample }) => {
        const z = sample.characteristic.zero;
        if (z !== null) out += `<circle cx="${sx(z)}" cy="${sy(0)}" r="3.5" fill="#fff" stroke="#d98a4d" opacity=".6"/>`;
      });
    } else {
      out += `<circle cx="${sx(zeros[0])}" cy="${sy(0)}" r="5" fill="#fff" stroke="#d98a4d" stroke-width="1.8"/>`;
    }
  }
  if (state.baselineVisible && state.baseline?.characteristic) {
    const ch = state.baseline.characteristic;
    ch.poles.forEach(p => { out += svgPole(sx(p.re), sy(p.im), "#344f5d", 7, .85); });
    if (ch.zero !== null) out += `<circle cx="${sx(ch.zero)}" cy="${sy(0)}" r="6" fill="none" stroke="#344f5d" stroke-width="1.5" opacity=".8"/>`;
  }
  if (state.current) {
    state.current.poles.forEach(p => { out += svgPole(sx(p.re), sy(p.im), "#007f8c", 10, 1); });
    if (state.current.zero !== null) out += `<circle cx="${sx(state.current.zero)}" cy="${sy(0)}" r="8" fill="#fff" stroke="#d97735" stroke-width="2.4"/>`;
    if (state.current.feedbackZero !== null && !state.current.reduced) {
      const z = state.current.feedbackZero;
      out += `<path d="M${sx(z)},${sy(0) - 6} l6,6 l-6,6 l-6,-6 z" fill="#fff" stroke="#7a8b94" stroke-width="1.5"/>`;
    }
    if (state.current.reduced) {
      const z = state.current.cancelledZero;
      out += `<circle cx="${sx(z)}" cy="${sy(0)}" r="10" fill="none" stroke="#b2bdc2" stroke-dasharray="2 2"/>` + svgText(sx(z) + 12, sy(0) - 12, "相消", 'fill="#87969d" font-size="10"');
    }
  }
  out += `<rect id="poleZoomRect" x="0" y="0" width="0" height="0" fill="#168b9420" stroke="#168b94" stroke-dasharray="3 2" visibility="hidden"/>`;
  svg.innerHTML = out;
  $("poleSelectionInfo").textContent = state.current ? state.current.poles.map((p, i) => `p${i + 1}=${fmt(p.re)}${p.im ? (p.im >= 0 ? "+" : "−") + fmt(Math.abs(p.im)) + "j" : ""}`).join("  ·  ") : "当前工况无效";
}
function svgPole(x, y, color, size, opacity) {
  const r = size / 2;
  return `<path d="M${x - r},${y - r} L${x + r},${y + r} M${x + r},${y - r} L${x - r},${y + r}" stroke="${color}" stroke-width="2.2" opacity="${opacity}"/>`;
}

function renderResponseChart() {
  const svg = $("responseSvg"), { width, height } = chartSize(svg);
  const m = { l: 63, r: 22, t: 22, b: 45 }, w = width - m.l - m.r, h = height - m.t - m.b;
  const xmax = state.autoTime ? state.config.duration : state.timeMax;
  const curves = state.background.filter(item => item.sample.valid);
  const getY = v => state.responseMode === "actual" ? v.frequency : v.normalized;
  const ys = [];
  curves.forEach(item => item.response.values.forEach(v => { if (v.t <= xmax) ys.push(getY(v)); }));
  if (state.response) {
    state.response.values.forEach(v => { if (v.t <= xmax) ys.push(getY(v)); });
    ys.push(state.responseMode === "actual" ? state.response.finalFrequency : 1);
    if (state.showBand) {
      const band = state.responseMode === "actual" ? state.response.tolerance : 0.02;
      const center = state.responseMode === "actual" ? state.response.finalFrequency : 1;
      ys.push(center - band, center + band);
    }
  }
  let ymin = ys.length ? Math.min(...ys) : 0, ymax = ys.length ? Math.max(...ys) : 1;
  let pad = Math.max((ymax - ymin) * 0.12, state.responseMode === "actual" ? 0.005 : 0.04);
  ymin -= pad; ymax += pad;
  const sx = t => m.l + t / xmax * w;
  const sy = y => m.t + (ymax - y) / (ymax - ymin) * h;
  let out = "";
  if (state.response && state.showBand) {
    const center = state.responseMode === "actual" ? state.response.finalFrequency : 1;
    const band = state.responseMode === "actual" ? state.response.tolerance : 0.02;
    out += `<rect x="${m.l}" y="${sy(center + band)}" width="${w}" height="${Math.abs(sy(center - band) - sy(center + band))}" fill="#7ab6a210"/>`;
    out += `<line x1="${m.l}" y1="${sy(center + band)}" x2="${m.l + w}" y2="${sy(center + band)}" stroke="#8fb9aa" stroke-dasharray="3 4" opacity=".6"/>`;
    out += `<line x1="${m.l}" y1="${sy(center - band)}" x2="${m.l + w}" y2="${sy(center - band)}" stroke="#8fb9aa" stroke-dasharray="3 4" opacity=".6"/>`;
  }
  niceTicks(0, xmax, 6).forEach(v => { const x = sx(v); out += `<line x1="${x}" y1="${m.t}" x2="${x}" y2="${m.t + h}" stroke="#e9eff1"/>` + svgText(x, m.t + h + 18, fmt(v, 3), 'text-anchor="middle" fill="#72858f" font-size="10"'); });
  niceTicks(ymin, ymax, 6).forEach(v => { const y = sy(v); out += `<line x1="${m.l}" y1="${y}" x2="${m.l + w}" y2="${y}" stroke="#e9eff1"/>` + svgText(m.l - 8, y + 3, fmt(v, state.responseMode === "actual" ? 3 : 2), 'text-anchor="end" fill="#72858f" font-size="10"'); });
  out += svgText(m.l + w / 2, height - 7, "时间 t  /  s", 'text-anchor="middle" fill="#4e6876" font-size="11"');
  out += `<text x="15" y="${m.t + h / 2}" transform="rotate(-90 15 ${m.t + h / 2})" text-anchor="middle" fill="#4e6876" font-size="11">${state.responseMode === "actual" ? "实际频率 f / Hz" : "归一化频差 Δf/Δf∞"}</text>`;
  curves.forEach((item, i) => {
    const path = responsePath(item.response.values, getY, sx, sy, xmax);
    out += `<path d="${path}" fill="none" stroke="${colorFor(item.sample.index, state.config.sampleCount)}" stroke-width="1.35" opacity=".34"/>`;
  });
  if (state.response) {
    const center = state.responseMode === "actual" ? state.response.finalFrequency : 1;
    out += `<line x1="${m.l}" y1="${sy(center)}" x2="${m.l + w}" y2="${sy(center)}" stroke="#758c96" stroke-dasharray="6 4" stroke-width="1"/>`;
    out += svgText(m.l + w - 5, sy(center) - 6, state.responseMode === "actual" ? "f∞" : "准稳态 1", 'text-anchor="end" fill="#718791" font-size="10"');
  }
  if (state.baselineVisible && state.baseline?.response) {
    out += `<path d="${responsePath(state.baseline.response.values, getY, sx, sy, xmax)}" fill="none" stroke="#344f5d" stroke-width="1.8" stroke-dasharray="6 4" opacity=".85"/>`;
  }
  if (state.response) {
    out += `<path d="${responsePath(state.response.values, getY, sx, sy, xmax)}" fill="none" stroke="#007f8c" stroke-width="2.7"/>`;
    if (state.showNadir) {
      const nadirY = state.responseMode === "actual" ? state.response.fMin : state.response.minDeviation / state.response.steadyDeviation;
      out += `<circle cx="${sx(state.response.tNadir)}" cy="${sy(nadirY)}" r="4.5" fill="#d97735" stroke="#fff" stroke-width="1.5"/>`;
      const anchor = state.response.tNadir > xmax * .75 ? "end" : "start";
      const dx = anchor === "end" ? -8 : 8;
      out += svgText(sx(state.response.tNadir) + dx, sy(nadirY) - 10, state.responseMode === "actual" ? `fmin ${fmt(state.response.fMin, 3)} Hz` : `nadir ${fmt(nadirY, 3)}`, `text-anchor="${anchor}" fill="#b86229" font-size="10"`);
    }
  }
  svg.innerHTML = out;
  $("responseSelectionInfo").innerHTML = state.response ? `f<sub>min</sub> = ${fmt(state.response.fMin)} Hz · t<sub>n</sub> = ${fmt(state.response.tNadir)} s` : "当前工况无效";
  $("settlingInfo").textContent = state.response ? (state.response.settled ? `ts = ${fmt(state.response.settlingTime)} s` : "ts 超出仿真时长") : "";
}
function responsePath(values, getY, sx, sy, xmax) {
  let path = "", started = false;
  for (const v of values) {
    if (v.t > xmax) break;
    path += `${started ? "L" : "M"}${sx(v.t).toFixed(2)},${sy(getY(v)).toFixed(2)}`;
    started = true;
  }
  return path;
}

function renderMetrics() {
  const ch = state.current, r = state.response;
  $("metricWn").textContent = ch?.wn !== null && ch ? fmt(ch.wn) : "—";
  $("metricZeta").textContent = ch?.zeta !== null && ch ? fmt(ch.zeta) : "—";
  $("metricDamping").textContent = ch?.damping || "无有效工况";
  $("dampingBadge").textContent = ch?.damping || "无有效工况";
  $("metricPoles").textContent = ch ? ch.poles.map(p => `${fmt(p.re)}${Math.abs(p.im) > 1e-9 ? (p.im >= 0 ? " + " : " − ") + fmt(Math.abs(p.im)) + "j" : ""}`).join(" , ") : "—";
  $("metricPoleMod").textContent = ch ? "模长 " + ch.poles.map(p => fmt(Math.hypot(p.re, p.im))).join(" / ") : "模长 —";
  $("metricZero").textContent = ch?.zero !== null && ch ? fmt(ch.zero) : "—";
  $("zeroState").textContent = ch?.reduced ? `与 ${fmt(ch.cancelledPole)} 极点相消，无实际零点` : "实际闭环零点";
  $("metricFmin").textContent = r ? fmt(r.fMin) : "—";
  $("metricTn").textContent = r ? fmt(r.tNadir) : "—";
  $("metricMp").textContent = r ? fmt(r.overshoot) : "—";
  $("metricTs").textContent = r ? (r.settled ? fmt(r.settlingTime) : "> " + fmt(state.config.duration)) : "—";
  $("metricRocof").textContent = r ? fmt(r.initialRocofHz) : "—";
  $("metricFinal").textContent = r ? fmt(r.finalFrequency) : "—";
  $("metricDominant").textContent = ch ? fmt(ch.dominant) : "—";
  const d = ch?.derived;
  $("metricDerived").textContent = d ? `${fmt(d.T1, 3)} · ${fmt(d.T2, 3)} · ${fmt(d.lambda, 3)}` : "—";
  const valid = state.scanData?.results.filter(x => x.valid) || [];
  const wns = valid.map(x => x.characteristic.wn).filter(Number.isFinite);
  const zetas = valid.map(x => x.characteristic.zeta).filter(Number.isFinite);
  $("rangeWn").textContent = wns.length ? `扫描范围 ${fmt(Math.min(...wns), 3)}～${fmt(Math.max(...wns), 3)}` : "扫描范围 —";
  $("rangeZeta").textContent = zetas.length ? `扫描范围 ${fmt(Math.min(...zetas), 3)}～${fmt(Math.max(...zetas), 3)}` : "扫描范围 —";
}

function selectNearestPole(clientX, clientY) {
  if (!state.poleTransform) return;
  const rect = $("poleSvg").getBoundingClientRect();
  const px = (clientX - rect.left) * state.poleTransform.width / rect.width;
  const py = (clientY - rect.top) * state.poleTransform.height / rect.height;
  const { sx, sy } = state.poleTransform;
  const candidates = [];
  state.scanData.results.forEach(r => {
    if (!r.valid) return;
    r.characteristic.poles.forEach(p => {
      const distance = Math.hypot(sx(p.re) - px, sy(p.im) - py);
      candidates.push({ index: r.index, value: r.value, distance });
    });
  });
  candidates.sort((a, b) => a.distance - b.distance);
  if (!candidates.length || candidates[0].distance > 22) { showToast("请点击闭环极点轨迹附近的位置"); return; }
  const min = candidates[0].distance;
  const coincident = candidates.filter(c => Math.abs(c.distance - min) < .35).filter((c, i, arr) => arr.findIndex(x => x.index === c.index) === i);
  state.candidates = coincident;
  state.currentValue = coincident[0].value;
  if (coincident.length > 1) {
    $("candidateSelect").hidden = false;
    $("candidateSelect").innerHTML = coincident.map((c, i) => `<option value="${i}">${PARAM_META[state.config.scan.variable].label} = ${fmt(c.value, 7)}</option>`).join("");
    showToast(`该位置有 ${coincident.length} 个候选工况，请在图下方选择`);
  } else $("candidateSelect").hidden = true;
  updateCurrent();
}

function bindPoleInteraction() {
  const svg = $("poleSvg");
  let start = null, moved = false;
  svg.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    const rect = svg.getBoundingClientRect();
    start = { x: e.clientX - rect.left, y: e.clientY - rect.top }; moved = false;
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener("pointermove", e => {
    if (!start) return;
    const rect = svg.getBoundingClientRect();
    const now = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    if (Math.hypot(now.x - start.x, now.y - start.y) > 6) moved = true;
    if (moved) {
      const zoom = $("poleZoomRect");
      if (zoom) {
        zoom.setAttribute("x", Math.min(start.x, now.x)); zoom.setAttribute("y", Math.min(start.y, now.y));
        zoom.setAttribute("width", Math.abs(now.x - start.x)); zoom.setAttribute("height", Math.abs(now.y - start.y));
        zoom.setAttribute("visibility", "visible");
      }
    }
  });
  svg.addEventListener("pointerup", e => {
    if (!start) return;
    const rect = svg.getBoundingClientRect();
    const end = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    if (moved && state.poleTransform) {
      const t = state.poleTransform, d = t.domain;
      const x1 = d.xmin + (Math.min(start.x, end.x) - t.margins.l) / (t.width - t.margins.l - t.margins.r) * (d.xmax - d.xmin);
      const x2 = d.xmin + (Math.max(start.x, end.x) - t.margins.l) / (t.width - t.margins.l - t.margins.r) * (d.xmax - d.xmin);
      const y1 = d.ymax - (Math.max(start.y, end.y) - t.margins.t) / (t.height - t.margins.t - t.margins.b) * (d.ymax - d.ymin);
      const y2 = d.ymax - (Math.min(start.y, end.y) - t.margins.t) / (t.height - t.margins.t - t.margins.b) * (d.ymax - d.ymin);
      if (x2 > x1 && y2 > y1) state.poleView = { xmin: x1, xmax: x2, ymin: y1, ymax: y2 };
      renderPoleChart();
    } else selectNearestPole(e.clientX, e.clientY);
    start = null;
  });
  svg.addEventListener("dblclick", () => { state.poleView = null; renderPoleChart(); });
}

function setBaseline() {
  if (!state.current || !state.response) { showToast("当前工况无效，不能设为基准"); return; }
  state.baseline = {
    value: state.currentValue, config: deepCopy(state.config),
    characteristic: state.current, response: state.response
  };
  state.baselineVisible = true; $("toggleBaseline").classList.add("active");
  $("toggleBaseline").textContent = "基准可见"; $("toggleBaseline").setAttribute("aria-pressed", "true");
  renderAll(); showToast("已将当前工况设为比较基准");
}
function restoreBaseline() {
  if (!state.baseline) { showToast("尚未设置基准工况"); return; }
  state.config = deepCopy(state.baseline.config);
  state.currentValue = state.baseline.value;
  state.poleView = null;
  syncConfigUI(); recomputeAll(); showToast("已恢复基准场景与工况");
}
function toggleBaseline() {
  if (!state.baseline) { showToast("请先设置基准工况"); return; }
  state.baselineVisible = !state.baselineVisible;
  $("toggleBaseline").classList.toggle("active", state.baselineVisible);
  $("toggleBaseline").textContent = state.baselineVisible ? "基准可见" : "基准隐藏";
  $("toggleBaseline").setAttribute("aria-pressed", String(state.baselineVisible));
  renderPoleChart(); renderResponseChart();
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function safeName() { return state.config.name.replace(/[\\/:*?"<>|]/g, "_").slice(0, 60) || "sfr-analysis"; }
function exportConfig() {
  downloadBlob(new Blob([JSON.stringify(state.config, null, 2)], { type: "application/json;charset=utf-8" }), safeName() + "-配置.json");
}
function resultPayload() {
  return {
    metadata: { tool: "SFR Lab", version: 1, exportedAt: new Date().toISOString(), model: "Gd(s)=(1+TR*s)/(2H*TR*s^2+(2H+(D+KF*FH)*TR)*s+D+KF)" },
    config: state.config,
    intersection: state.scanData.intersection,
    selected: state.current ? { scanValue: state.currentValue, parameters: state.current.p, characteristic: state.current, performance: { ...state.response, values: undefined } } : null,
    scan: state.scanData.results.map(r => ({ index: r.index, value: r.value, valid: r.valid, errors: r.errors, parameters: r.p, characteristic: r.characteristic })),
    responses: state.background.map(item => ({ index: item.sample.index, scanValue: item.sample.value, parameters: item.sample.p, values: item.response.values }))
  };
}
function exportJson() { downloadBlob(new Blob([JSON.stringify(resultPayload(), null, 2)], { type: "application/json;charset=utf-8" }), safeName() + "-结果.json"); }
function exportCsv() {
  const s = state.config.scan;
  const headers = ["curve_index", "scan_variable", "scan_path", "scan_value", "H", "D", "KF", "TR", "FH", "time_s", "frequency_Hz", "deviation_pu", "normalized_deviation"];
  const rows = [headers.join(",")];
  state.background.forEach(item => {
    item.response.values.forEach(v => rows.push([item.sample.index, s.variable, s.path, item.sample.value, ...SFR.PARAMS.map(k => item.sample.p[k]), v.t, v.frequency, v.deviation, v.normalized].join(",")));
  });
  downloadBlob(new Blob(["\ufeff" + rows.join("\r\n")], { type: "text/csv;charset=utf-8" }), safeName() + "-响应.csv");
}
function exportPng() {
  const sources = [$("poleSvg"), $("responseSvg")].map(svg => new XMLSerializer().serializeToString(svg));
  Promise.all(sources.map(source => new Promise((resolve, reject) => {
    const img = new Image(), url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); }; img.onerror = reject; img.src = url;
  }))).then(images => {
    const canvas = document.createElement("canvas"); canvas.width = 2000; canvas.height = 650;
    const ctx = canvas.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 2000, 650);
    ctx.fillStyle = "#102f46"; ctx.font = "22px sans-serif"; ctx.fillText("闭环零极点参数轨迹", 25, 32); ctx.fillText("负荷阶跃频率响应", 1025, 32);
    ctx.drawImage(images[0], 0, 45, 1000, 590); ctx.drawImage(images[1], 1000, 45, 1000, 590);
    canvas.toBlob(blob => downloadBlob(blob, safeName() + "-双图.png"), "image/png");
  }).catch(() => showToast("图像导出失败，请重试"));
}
function importConfig(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!imported.base || !imported.ranges || !imported.scan) throw new Error("缺少 base、ranges 或 scan 字段");
      const merged = deepCopy(DEFAULT_CONFIG);
      Object.assign(merged, imported);
      merged.base = { ...DEFAULT_CONFIG.base, ...imported.base };
      merged.ranges = deepCopy(DEFAULT_CONFIG.ranges);
      SFR.PARAMS.forEach(k => { if (imported.ranges[k]) merged.ranges[k] = imported.ranges[k].map(Number); });
      merged.scan = { ...DEFAULT_CONFIG.scan, ...imported.scan };
      const check = SFR.validateBase(merged.base);
      if (!check.valid) throw new Error(check.errors.join("；"));
      if (!(merged.scan.max > merged.scan.min)) throw new Error("扫描上限必须大于下限");
      state.config = merged;
      state.currentValue = currentScanBaseValue() ?? (merged.scan.min + merged.scan.max) / 2;
      if (state.currentValue < merged.scan.min || state.currentValue > merged.scan.max) state.currentValue = (merged.scan.min + merged.scan.max) / 2;
      state.poleView = null; state.baseline = null;
      syncConfigUI(); recomputeAll(); showToast("参数配置已导入并完成复算");
    } catch (error) { showToast("导入失败：" + error.message); }
  };
  reader.readAsText(file);
}

function bindEvents() {
  $("scanVariable").addEventListener("change", () => {
    state.config.scan.variable = $("scanVariable").value;
    updatePathOptions(true); state.poleView = null; recomputeAll();
  });
  $("scanPath").addEventListener("change", () => {
    state.config.scan.path = $("scanPath").value;
    $("pathDescription").textContent = PATHS[state.config.scan.variable].find(p => p[0] === state.config.scan.path)[2];
    state.currentValue = currentScanBaseValue() ?? state.config.scan.min;
    state.poleView = null; recomputeAll();
  });
  $("applyScan").addEventListener("click", applyScanRange);
  ["ratedFrequency", "loadStep", "duration", "sampleCount", "curveCount"].forEach(id => $(id).addEventListener("change", () => { readSimulationSettings(); recomputeAll(); }));
  $("sceneName").addEventListener("change", readSimulationSettings);
  $("parameterSlider").addEventListener("input", e => { state.currentValue = Number(e.target.value); $("candidateSelect").hidden = true; updateCurrent(); });
  $("parameterSlider").addEventListener("keydown", e => {
    if (!["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp"].includes(e.key)) return;
    e.preventDefault();
    const s = state.config.scan;
    const direction = ["ArrowRight", "ArrowUp"].includes(e.key) ? 1 : -1;
    const step = (s.max - s.min) / (e.shiftKey ? 100 : 1000);
    state.currentValue = Math.max(s.min, Math.min(s.max, state.currentValue + direction * step));
    updateCurrent();
  });
  $("currentValue").addEventListener("change", e => {
    const v = Number(e.target.value), s = state.config.scan;
    if (!Number.isFinite(v) || v < s.min || v > s.max) { showToast(`请输入扫描范围 [${fmt(s.min)}, ${fmt(s.max)}] 内的数值`); e.target.value = state.currentValue; return; }
    state.currentValue = v; $("candidateSelect").hidden = true; updateCurrent();
  });
  $("candidateSelect").addEventListener("change", e => { state.currentValue = state.candidates[Number(e.target.value)].value; updateCurrent(); });
  $("setBaseline").addEventListener("click", setBaseline);
  $("restoreBaseline").addEventListener("click", restoreBaseline);
  $("toggleBaseline").addEventListener("click", toggleBaseline);
  $("responseMode").addEventListener("click", e => {
    const button = e.target.closest("button[data-mode]"); if (!button) return;
    state.responseMode = button.dataset.mode;
    document.querySelectorAll("#responseMode button").forEach(b => b.classList.toggle("active", b === button));
    renderResponseChart();
  });
  $("showNadir").addEventListener("change", e => { state.showNadir = e.target.checked; renderResponseChart(); });
  $("showBand").addEventListener("change", e => { state.showBand = e.target.checked; renderResponseChart(); });
  $("autoTime").addEventListener("change", e => { state.autoTime = e.target.checked; $("manualTimeWrap").hidden = state.autoTime; renderResponseChart(); });
  $("timeMax").addEventListener("change", e => { if (Number(e.target.value) > 0) { state.timeMax = Number(e.target.value); renderResponseChart(); } });
  $("resetTime").addEventListener("click", () => { state.autoTime = true; state.timeMax = state.config.duration; $("autoTime").checked = true; $("manualTimeWrap").hidden = true; $("timeMax").value = state.timeMax; renderResponseChart(); });
  $("resetPoleZoom").addEventListener("click", () => { state.poleView = null; renderPoleChart(); });
  $("poleAxisSettings").addEventListener("click", () => { $("poleAxisPanel").hidden = !$("poleAxisPanel").hidden; });
  $("equalAxis").addEventListener("change", () => { state.poleView = null; renderPoleChart(); });
  $("applyPoleAxis").addEventListener("click", () => {
    const d = { xmin: Number($("poleXMin").value), xmax: Number($("poleXMax").value), ymin: Number($("poleYMin").value), ymax: Number($("poleYMax").value) };
    if (!Object.values(d).every(Number.isFinite) || d.xmin >= d.xmax || d.ymin >= d.ymax) { showToast("坐标范围无效"); return; }
    state.poleView = d; renderPoleChart();
  });
  $("autoPoleAxis").addEventListener("click", () => { state.poleView = null; renderPoleChart(); });
  $("importConfigBtn").addEventListener("click", () => $("configFile").click());
  $("configFile").addEventListener("change", e => { if (e.target.files[0]) importConfig(e.target.files[0]); e.target.value = ""; });
  $("exportConfigBtn").addEventListener("click", exportConfig);
  $("exportDataBtn").addEventListener("click", exportJson);
  $("exportJson").addEventListener("click", exportJson);
  $("exportCsv").addEventListener("click", exportCsv);
  $("exportPng").addEventListener("click", exportPng);
  $("resetParams").addEventListener("click", () => {
    state.config = deepCopy(DEFAULT_CONFIG); state.currentValue = 1; state.baseline = null; state.poleView = null;
    syncConfigUI(); recomputeAll(); showToast("已恢复默认研究场景");
  });
  let resizeTimer;
  window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { renderPoleChart(); renderResponseChart(); }, 120); });
  bindPoleInteraction();
}

function init() {
  buildParameterRows(); syncConfigUI(); bindEvents();
  state.currentValue = currentScanBaseValue();
  recomputeAll();
  setBaseline();
}
init();
