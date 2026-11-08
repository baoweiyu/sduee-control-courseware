/* Dependency-free Chrome CDP verification for lesson 5.
 * Starts and closes its own static server and headless Chrome.
 */
const fs = require("fs");
const path = require("path");
const http = require("http");
const { spawn, spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(__dirname, "lesson05-20261108-shots");
const PROFILE = path.join(__dirname, ".chrome-lesson05-20261108");
const PORT = 7192;
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
fs.mkdirSync(OUT, { recursive: true });
fs.rmSync(PROFILE, { recursive: true, force: true });
fs.mkdirSync(PROFILE, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const MIME = { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".json":"application/json; charset=utf-8", ".png":"image/png", ".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".svg":"image/svg+xml", ".woff2":"font/woff2", ".pdf":"application/pdf" };
const server = http.createServer((req,res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/player/index.html";
  const file = path.normalize(path.join(ROOT,p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end("forbidden"); }
  fs.readFile(file,(err,data) => { if(err){res.writeHead(404);res.end("not found");} else {res.writeHead(200,{"Content-Type":MIME[path.extname(file).toLowerCase()]||"application/octet-stream"});res.end(data);} });
});
let chrome, ws, seq=0;
const pending = new Map(), listeners = new Map();
function on(method, fn){ if(!listeners.has(method)) listeners.set(method,[]); listeners.get(method).push(fn); }
function emit(method, params){ (listeners.get(method)||[]).forEach(fn=>fn(params)); }
function send(method, params={}){
  return new Promise((resolve,reject)=>{ const id=++seq; pending.set(id,{resolve,reject}); ws.send(JSON.stringify({id,method,params})); });
}
async function evaluate(expression){ const r=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true}); if(r.exceptionDetails) throw new Error(r.exceptionDetails.text||"evaluation failed"); return r.result.value; }
async function shot(name){
  const r=await send("Page.captureScreenshot",{format:"png",fromSurface:true,captureBeyondViewport:false});
  fs.writeFileSync(path.join(OUT,name+".png"),Buffer.from(r.data,"base64"));
}
async function waitLoad(){ await new Promise(resolve=>{ const done=()=>resolve(); on("Page.loadEventFired",done); setTimeout(done,8000); }); }
async function main(){
  await new Promise((resolve,reject)=>server.listen(PORT,"127.0.0.1",e=>e?reject(e):resolve()));
  chrome=spawn(CHROME,["--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check",`--remote-debugging-port=${PORT+100}`,`--user-data-dir=${PROFILE}`,"--window-size=1600,900","about:blank"],{stdio:"ignore"});
  let targets=[];
  for(let i=0;i<80;i++){
    await sleep(150);
    try{ targets=await (await fetch(`http://127.0.0.1:${PORT+100}/json/list`)).json(); if(targets.some(t=>t.type==="page")) break; }catch(e){}
  }
  const target=targets.find(t=>t.type==="page");
  if(!target) throw new Error("Chrome debugging target unavailable");
  ws=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);}}else emit(m.method,m.params||{});};
  await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable"); await send("Log.enable");
  await send("Emulation.setDeviceMetricsOverride",{width:1600,height:900,deviceScaleFactor:1,mobile:false});
  const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,"lessons/lesson05-root-locus/lesson.json"),"utf8"));
  const report=[];
  for(let idx=0;idx<manifest.pages.length;idx++){
    const entry=manifest.pages[idx], errors=[], failed=[];
    const onException=p=>errors.push("exception: "+(p.exceptionDetails.exception?.description||p.exceptionDetails.text));
    const onConsole=p=>{if(p.type==="error")errors.push("console.error: "+p.args.map(a=>a.value||a.description||"").join(" "));};
    const onLog=p=>{if(p.entry.level==="error")errors.push("log: "+p.entry.text);};
    const onResponse=p=>{if(p.response.status>=400)failed.push(p.response.status+" "+p.response.url);};
    const onFailed=p=>{if(!p.canceled)failed.push("failed "+p.errorText+" "+(p.requestId||""));};
    on("Runtime.exceptionThrown",onException);on("Runtime.consoleAPICalled",onConsole);on("Log.entryAdded",onLog);on("Network.responseReceived",onResponse);on("Network.loadingFailed",onFailed);
    const url=`http://127.0.0.1:${PORT}/lessons/lesson05-root-locus/${entry.file}?qa=20261108`;
    await send("Page.navigate",{url}); await waitLoad(); await sleep(850);
    const initial=await evaluate(`(()=>{const b=document.body;return {page:b.dataset.page,title:document.title,steps:ACT.step?ACT.step.total||ACT.step.els.length:0,mathErrors:[...document.querySelectorAll('mjx-merror,[data-mjx-error]')].length};})()`);
    await shot(`${String(idx+1).padStart(2,"0")}-initial`);
    await evaluate(`(()=>{if(typeof window.qaFinal==='function'){window.qaFinal();return ACT.step.cur;}let n=ACT.step.els.length;for(let i=0;i<n;i++)ACT.step.next();return ACT.step.cur;})()`);
    await sleep(650);
    const layout=await evaluate(`(()=>{
      const clipped=[...document.querySelectorAll('.act-card')].filter(e=>e.scrollHeight>e.clientHeight+3||e.scrollWidth>e.clientWidth+3).map(e=>({title:e.querySelector('.hd')?.textContent?.trim()||'',sh:e.scrollHeight,ch:e.clientHeight,sw:e.scrollWidth,cw:e.clientWidth}));
      const badButtons=[...document.querySelectorAll('button')].filter(e=>e.offsetParent&& (e.scrollWidth>e.clientWidth+2||e.getBoundingClientRect().height>62)).map(e=>e.textContent.trim());
      const note=document.querySelector('.act-note'),body=document.querySelector('.act-body');
      const overlap=note&&body?(note.getBoundingClientRect().top<body.getBoundingClientRect().bottom-2):false;
      return {clipped,badButtons,noteOverlap:overlap};
    })()`);
    await shot(`${String(idx+1).padStart(2,"0")}-final`);
    report.push({number:idx+1,file:entry.file,...initial,...layout,errors,failed});
    console.log(`${idx+1}/60 ${entry.file} errors=${errors.length} 404=${failed.length} clipped=${layout.clipped.length} buttons=${layout.badButtons.length} note=${layout.noteOverlap}`);
    listeners.delete("Runtime.exceptionThrown");listeners.delete("Runtime.consoleAPICalled");listeners.delete("Log.entryAdded");listeners.delete("Network.responseReceived");listeners.delete("Network.loadingFailed");
  }
  fs.writeFileSync(path.join(OUT,"report.json"),JSON.stringify(report,null,2));
  const bad=report.filter(r=>r.errors.length||r.failed.length||r.clipped.length||r.badButtons.length||r.noteOverlap);
  console.log(`REPORT ${path.join(OUT,"report.json")}`);
  console.log(`FLAGGED ${bad.length}`);
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{
  try{if(ws)ws.close();}catch(e){}
  if(chrome){try{chrome.kill();}catch(e){}await sleep(400);try{spawnSync("taskkill",["/PID",String(chrome.pid),"/T","/F"],{stdio:"ignore"});}catch(e){}}
  await new Promise(r=>server.close(r));
  try{fs.rmSync(PROFILE,{recursive:true,force:true});}catch(e){}
});
