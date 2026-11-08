/* 第五章关键动画与播放器交互实测；自带静态服务器和 Headless Chrome。 */
const fs=require("fs"),path=require("path"),http=require("http");
const {spawn,spawnSync}=require("child_process");
const ROOT=path.resolve(__dirname,".."),OUT=path.join(__dirname,"lesson05-20261108-shots");
const PROFILE=path.join(__dirname,".chrome-lesson05-interact"),PORT=7193;
const CHROME="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
fs.mkdirSync(OUT,{recursive:true});fs.rmSync(PROFILE,{recursive:true,force:true});fs.mkdirSync(PROFILE,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const MIME={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".png":"image/png",".svg":"image/svg+xml",".ico":"image/x-icon",".woff2":"font/woff2"};
const server=http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split("?")[0]);if(p==="/")p="/player/index.html";const file=path.normalize(path.join(ROOT,p));if(!file.startsWith(ROOT)){res.writeHead(403);return res.end();}fs.readFile(file,(e,d)=>{if(e){res.writeHead(404);res.end();}else{res.writeHead(200,{"Content-Type":MIME[path.extname(file).toLowerCase()]||"application/octet-stream"});res.end(d);}});});
let chrome,ws,seq=0;const pending=new Map(),results=[];
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});}
async function ev(expression){const r=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
async function shot(name){const r=await send("Page.captureScreenshot",{format:"png",fromSurface:true,captureBeyondViewport:false});fs.writeFileSync(path.join(OUT,name+".png"),Buffer.from(r.data,"base64"));}
async function go(file){await send("Page.navigate",{url:`http://127.0.0.1:${PORT}/lessons/lesson05-root-locus/${file}`});await sleep(1200);}
function check(name,ok,detail){results.push({name,ok,detail});if(!ok)throw new Error(name+": "+JSON.stringify(detail));}
async function main(){
 await new Promise((r,j)=>server.listen(PORT,"127.0.0.1",e=>e?j(e):r()));
 chrome=spawn(CHROME,["--headless=new","--disable-gpu","--no-first-run",`--remote-debugging-port=${PORT+100}`,`--user-data-dir=${PROFILE}`,"--window-size=1600,900","about:blank"],{stdio:"ignore"});
 let targets=[];for(let i=0;i<80;i++){await sleep(150);try{targets=await(await fetch(`http://127.0.0.1:${PORT+100}/json/list`)).json();if(targets.some(t=>t.type==="page"))break;}catch(e){}}
 ws=new WebSocket(targets.find(t=>t.type==="page").webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);}}};
 await send("Page.enable");await send("Runtime.enable");await send("Emulation.setDeviceMetricsOverride",{width:1600,height:900,deviceScaleFactor:1,mobile:false});
 await go("pages/p38-ex59-family.html");
 await ev(`document.getElementById('nx0').click()`);await sleep(100);
 check("P38 单图步进互不干扰",await ev(`pg0.textContent==='1/4'&&pg1.textContent==='0/4'&&pg2.textContent==='0/4'`));
 await ev(`pl0.click()`);await sleep(650);check("P38 单图播放可启动",await ev(`pl0.textContent.includes('暂停')&&pg1.textContent==='0/4'`));await ev(`pl0.click()`);
 await ev(`ACT.step.reset();for(let i=0;i<12;i++)ACT.step.next()`);await sleep(3600);
 check("P38 翻页笔十二步到末态",await ev(`ACT.step.cur===12&&pg0.textContent==='4/4'&&pg1.textContent==='4/4'&&pg2.textContent==='4/4'`));
 await ev(`ACT.step.prev()`);check("P38 上一步回退",await ev(`ACT.step.cur===11&&pg2.textContent==='3/4'`));
 await ev(`ACT.step.reset()`);check("P38 总重置",await ev(`ACT.step.cur===0&&pg0.textContent==='0/4'&&pg1.textContent==='0/4'&&pg2.textContent==='0/4'`));
 await ev(`window.qaFinal()`);await shot("interaction-p38-final");
 check("P38/P39 数据起点与终点完整",await ev(`['ex59k05','ex59k2','ex59k10'].every(key=>{const d=RL.data[key],ends=d.branches.map(b=>b[b.length-1]);const at=(a,b)=>Math.abs(a[0]-b[0])<1e-8&&Math.abs(a[1]-b[1])<1e-8;return ends.some(p=>at(p,[0,0]))&&ends.some(p=>at(p,[-1,0]))&&ends.some(p=>p[0]<-900000)&&d.branches.every(b=>d.poles.some(p=>at(b[0],p)));})`));
 await ev(`window.__z0=fig0.innerHTML;window.__z1=fig1.innerHTML;zp0.click()`);
 check("P38 放大且各图独立",await ev(`fig0.innerHTML!==window.__z0&&fig1.innerHTML===window.__z1`));
 await ev(`zr0.click()`);check("P38 视图复位",await ev(`fig0.innerHTML===window.__z0`));
 await go("pages/p38b-ex59-family.html");await ev(`step.click()`);await sleep(2300);
 check("P38B 下一条生长",await ev(`ACT.step.cur===1&&document.querySelectorAll('#fig path').length>=3`));
 await ev(`chip1.click()`);check("P38B 图例单独查看",await ev(`chip1.classList.contains('cur')&&!chip0.classList.contains('cur')`));
 await ev(`reset.click()`);check("P38B 重置",await ev(`ACT.step.cur===0&&read.textContent.includes('点击播放')`));
 await ev(`for(let i=0;i<3;i++)ACT.step.next()`);await sleep(2400);check("P38B 翻页笔三条叠加",await ev(`ACT.step.cur===3&&read.textContent.includes('K₁=10')`));
 await ev(`ACT.step.prev()`);check("P38B 上一步",await ev(`ACT.step.cur===2`));await ev(`window.qaFinal()`);await shot("interaction-p38b-final");
 await ev(`window.__zf=fig.innerHTML;zoomIn.click()`);check("P39 轨迹簇放大",await ev(`fig.innerHTML!==window.__zf`));
 await ev(`zoomReset.click()`);check("P39 轨迹簇视图复位",await ev(`fig.innerHTML===window.__zf`));
 for(const file of ["p41-ex510a-analyze.html","p50-trial-method.html","p51-ex513a-zeta.html"]){
   await go("pages/"+file);const total=file.startsWith("p41")?5:4;
   await ev(`for(let i=0;i<${total};i++)ACT.step.next()`);await sleep(300);
   check(file+" 分步到末态",await ev(`ACT.step.cur===${total}&&document.getElementById('prog').textContent.includes('${total} / ${total}')`));
   await ev(`ACT.step.prev()`);check(file+" 回退",await ev(`ACT.step.cur===${total-1}`));
   await ev(`ACT.step.reset()`);check(file+" 重置",await ev(`ACT.step.cur===0`));
   await ev(`play.click()`);await sleep(400);check(file+" 播放",await ev(`play.textContent.includes('暂停')`));await ev(`play.click()`);
   await ev(`for(let i=0;i<${total};i++)ACT.step.next()`);await sleep(300);await shot("interaction-"+file.replace('.html',''));
 }
 await go("pages/p55-ex514a-two-systems.html");await ev(`for(let i=0;i<3;i++)ACT.step.next()`);await sleep(300);
 check("P55 根轨迹分步",await ev(`ACT.step.cur===3&&prog.textContent==='3 / 3'&&document.querySelectorAll('#resp55 path').length>=2`));await shot("interaction-p55-final");
 for(const file of ["p43-nonmin-phase.html","p53-pole-effects.html"]){
   await go("pages/"+file);await ev(`for(let i=0;i<ACT.step.els.length;i++)ACT.step.next()`);await sleep(350);
   check(file+" 文本框无裁切",await ev(`[...document.querySelectorAll('.act-card')].every(e=>e.scrollHeight<=e.clientHeight+3&&e.scrollWidth<=e.clientWidth+3)`));
   await shot("interaction-"+file.replace('.html',''));
 }
 const dual=[];
 for(const file of ["p44-ex511-classify.html","p45-ex511-dual-anim.html"]){
   await go("pages/"+file);
   await shot("interaction-"+file.replace('.html','')+"-initial");
   check(file+" 左侧文字初始全部显示",await ev(`document.querySelectorAll('.lft [data-step]').length===0&&[...document.querySelectorAll('.lft .kv')].every(e=>+getComputedStyle(e).opacity===1)`));
   await ev(`window.__left=document.querySelector('.lft').textContent;window.__right=figA.outerHTML+figB.outerHTML;ACT.step.next()`);await sleep(250);
   check(file+" 下一步仅改变右图",await ev(`document.querySelector('.lft').textContent===window.__left&&(figA.outerHTML+figB.outerHTML)!==window.__right`));
   await ev(`while(ACT.step.cur<ACT.step.els.length)ACT.step.next()`);await sleep(350);
   dual.push(await ev(`[figA.outerHTML,figB.outerHTML]`));
 }
 check("P45/P46 两页右侧图完全一致",JSON.stringify(dual[0])===JSON.stringify(dual[1]));
 await send("Page.navigate",{url:`http://127.0.0.1:${PORT}/player/index.html?lesson=lesson05-root-locus&p=39`});await sleep(1800);
 check("播放器第五章60页与新增第39页",await ev(`document.getElementById('pg').textContent==='39 / 60'&&document.getElementById('frame').contentDocument.body.dataset.page==='39 / 60'`));
 await ev(`document.getElementById('stepFwd').click()`);await sleep(2400);
 check("播放器下一步推进动画",await ev(`document.getElementById('pg').textContent==='39 / 60'&&document.getElementById('frame').contentWindow.ACT.step.cur===1`));
 await ev(`document.getElementById('next').click()`);await sleep(1000);check("播放器下一页直接翻页",await ev(`document.getElementById('pg').textContent==='40 / 60'`));
 await ev(`document.getElementById('prev').click()`);await sleep(1000);check("播放器上一页直接翻页",await ev(`document.getElementById('pg').textContent==='39 / 60'`));
 fs.writeFileSync(path.join(OUT,"interaction-report.json"),JSON.stringify(results,null,2));console.log(`PASS ${results.length} 项交互检查`);
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{try{if(ws)ws.close();}catch(e){}if(chrome){try{chrome.kill();}catch(e){}await sleep(400);try{spawnSync("taskkill",["/PID",String(chrome.pid),"/T","/F"],{stdio:"ignore"});}catch(e){}}await new Promise(r=>server.close(r));try{fs.rmSync(PROFILE,{recursive:true,force:true});}catch(e){}});
