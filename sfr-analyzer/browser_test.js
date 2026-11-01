// 零依赖浏览器验收：临时启动静态服务器和 Headless Chrome/Edge，结束后全部清理。
const { spawn, execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const PORT = 7123, CDP_PORT = 9223;
const sleep = ms => new Promise(r => setTimeout(r, ms));
let server, browser, ws, seq = 0;
const pending = new Map();
const errors = [];

function browserPath() {
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome", "/usr/bin/chromium"
  ];
  const found = candidates.find(fs.existsSync);
  if (!found) throw new Error("未找到 Chrome / Edge");
  return found;
}
async function waitHttp(url, timeout = 12000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { const r = await fetch(url); if (r.ok) return r; } catch (_) {}
    await sleep(150);
  }
  throw new Error("等待服务超时: " + url);
}
function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text + ": " + JSON.stringify(result.exceptionDetails.exception));
  return result.result.value;
}
function assert(condition, message) { if (!condition) throw new Error("断言失败: " + message); console.log("PASS", message); }

async function main() {
  server = spawn(process.execPath, [path.join(ROOT, "server.js"), "--port", String(PORT), "--host", "127.0.0.1"], { stdio: "ignore" });
  await waitHttp(`http://127.0.0.1:${PORT}/`);
  const profile = path.join(__dirname, ".browser-test-profile");
  browser = spawn(browserPath(), ["--headless=new", "--disable-gpu", "--no-first-run", `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
  await waitHttp(`http://127.0.0.1:${CDP_PORT}/json/version`);
  const targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
  const page = targets.find(t => t.type === "page");
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  ws.onmessage = event => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const item = pending.get(msg.id); pending.delete(msg.id);
      if (msg.error) item.reject(new Error(JSON.stringify(msg.error))); else item.resolve(msg.result);
    }
    if (msg.method === "Runtime.exceptionThrown") errors.push(msg.params.exceptionDetails);
  };
  await cdp("Page.enable"); await cdp("Runtime.enable");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await cdp("Page.navigate", { url: `http://127.0.0.1:${PORT}/` });
  await sleep(1600);
  assert(await evaluate("document.title.includes('SFR Lab')"), "页面与脚本成功加载");
  assert(await evaluate("state.scanData.results.length === 121 && state.scanData.results.every(r => r.valid)"), "默认 λ 扫描生成 121 个有效工况");
  assert(await evaluate("state.background.length === 9 && state.response.values.length === 2201"), "双图共享扫描索引且当前响应独立高精度计算");
  assert(await evaluate("Math.abs(state.currentValue - 1) < 1e-12 && state.current.damping === '过阻尼'"), "默认工况特征量正确");

  await evaluate("parameterSlider.value=2; parameterSlider.dispatchEvent(new Event('input',{bubbles:true}))");
  assert(await evaluate("Math.abs(state.currentValue-2)<1e-12 && Math.abs(state.current.p.TR-10/Math.SQRT2)<1e-9"), "滑块实时重算 λ 路径 C 物理参数");
  const before = await evaluate("state.currentValue");
  assert(before === 2, "滑块值与当前工况一致");

  await evaluate("scanVariable.value='FH'; scanVariable.dispatchEvent(new Event('change',{bubbles:true})); parameterSlider.value=1; parameterSlider.dispatchEvent(new Event('input',{bubbles:true}))");
  assert(await evaluate("state.current.reduced && state.current.poles.length===1 && state.current.zero===null"), "F_H=1 自动极零相消并降为一阶");
  assert(await evaluate("Math.abs(state.response.tNadir-state.config.duration)<1e-9"), "一阶单调响应最低点位于仿真末端");

  await evaluate("scanVariable.value='T1'; scanVariable.dispatchEvent(new Event('change',{bubbles:true})); scanPath.value='fixedH'; scanPath.dispatchEvent(new Event('change',{bubbles:true})); currentValue.value=16; currentValue.dispatchEvent(new Event('change',{bubbles:true}))");
  assert(await evaluate("Math.abs(state.current.p.H-5)<1e-12 && Math.abs(state.current.p.D-0.625)<1e-12"), "T₁ 固定 H 路径同步更新 D 与派生量");

  await evaluate("resetParams.click()");
  await sleep(250);
  const clickPoint = await evaluate(`(()=>{const r=state.scanData.results[90],p=r.characteristic.poles[0],t=state.poleTransform,rect=poleSvg.getBoundingClientRect();return {x:rect.left+t.sx(p.re)*rect.width/t.width,y:rect.top+t.sy(p.im)*rect.height/t.height,value:r.value}})()`);
  await cdp("Input.dispatchMouseEvent", { type: "mousePressed", x: clickPoint.x, y: clickPoint.y, button: "left", clickCount: 1 });
  await cdp("Input.dispatchMouseEvent", { type: "mouseReleased", x: clickPoint.x, y: clickPoint.y, button: "left", clickCount: 1 });
  await sleep(150);
  assert(await evaluate(`Math.abs(state.currentValue-${clickPoint.value})<1e-9`), "点击极点轨迹可选中对应扫描参数");

  await evaluate("$('setBaseline').click(); parameterSlider.value=2; parameterSlider.dispatchEvent(new Event('input',{bubbles:true})); responseMode.querySelector('[data-mode=normalized]').click()");
  assert(await evaluate("state.baselineVisible && state.responseMode==='normalized' && Math.abs(state.baseline.value-state.currentValue)>1"), "基准比较与归一化频差切换可用");
  assert(await evaluate("resultPayload().responses.length===9 && resultPayload().selected.performance.values===undefined"), "完整 JSON 数据结构可导出");
  const downloadDir = path.join(__dirname, ".test-downloads");
  fs.rmSync(downloadDir, { recursive: true, force: true }); fs.mkdirSync(downloadDir);
  await cdp("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloadDir, eventsEnabled: true });
  await evaluate("$('exportCsv').click(); $('exportJson').click(); $('exportPng').click()");
  await sleep(1800);
  const downloads = fs.readdirSync(downloadDir).filter(name => !name.endsWith(".crdownload"));
  assert(downloads.length === 3 && downloads.every(name => fs.statSync(path.join(downloadDir, name)).size > 100), "CSV、JSON 与双图 PNG 均可实际下载");
  const shot = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  fs.writeFileSync(path.join(__dirname, "browser-check.png"), Buffer.from(shot.data, "base64"));
  assert(errors.length === 0, "浏览器运行无 JavaScript 异常");
  console.log(JSON.stringify({ passed: true, screenshot: path.join(__dirname, "browser-check.png") }));
}

main().catch(error => { console.error(error.stack || error); process.exitCode = 1; }).finally(async () => {
  try { if (ws) ws.close(); } catch (_) {}
  if (browser) { try { browser.kill("SIGTERM"); } catch (_) {} }
  if (server) { try { server.kill("SIGTERM"); } catch (_) {} }
  await sleep(300);
  try { fs.rmSync(path.join(__dirname, ".browser-test-profile"), { recursive: true, force: true }); } catch (_) {}
  try { fs.rmSync(path.join(__dirname, ".test-downloads"), { recursive: true, force: true }); } catch (_) {}
});
