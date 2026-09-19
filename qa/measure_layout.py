# -*- coding: utf-8 -*-
"""页面版式/动画度量：为整改提供量化依据。
用法: python qa/measure_layout.py lesson05-root-locus [lesson04-freq ...]
输出: qa/measure_<lesson>.json（每页字体统计、内容覆盖率、留白率、动画/播放能力、图注字号等）
"""
import os, re, json, subprocess, threading, functools, http.server, sys, concurrent.futures

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 7198

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

Handler = functools.partial(Quiet, directory=ROOT)
srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
threading.Thread(target=srv.serve_forever, daemon=True).start()

lessons = sys.argv[1:] or ["lesson05-root-locus"]
tasks = []
for ls in lessons:
    idx = json.load(open(os.path.join(ROOT, "lessons", ls, "lesson.json"), encoding="utf-8"))
    for i, pg in enumerate(idx["pages"], 1):
        tasks.append((i, ls, "/lessons/%s/%s" % (ls, pg["file"])))
print("总页数:", len(tasks))

PROBE = '''<!DOCTYPE html><html><head><meta charset="UTF-8"><title>m</title></head><body>
<iframe id="fr" style="width:1448px;height:1086px;border:0"></iframe>
<pre id="out">RUNNING</pre>
<script>
const fr = document.getElementById("fr");
const page = new URLSearchParams(location.search).get("page");
fr.src = ".." + page;
fr.onload = async () => {
  const res = {};
  try {
    const d = fr.contentDocument, w = fr.contentWindow;
    if (!d || !d.querySelector(".act-slide")) { res.err = "no-slide"; return done(); }
    try { const mj = w.MathJax; if (mj && mj.startup && mj.startup.promise) await Promise.race([mj.startup.promise, new Promise(r=>setTimeout(r,9000))]); } catch(e){}
    await new Promise(r=>setTimeout(r,300));
    const slide = d.querySelector(".act-slide").getBoundingClientRect();
    const body = d.querySelector(".act-body");
    const bodyR = body ? body.getBoundingClientRect() : slide;
    const fonts = {}, sizes = [];
    let chars = 0, blocks = 0;
    let minX=1e9, minY=1e9, maxX=-1e9, maxY=-1e9;
    body.querySelectorAll("*").forEach(el => {
      const cs = w.getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const ownText = Array.from(el.childNodes).filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join("");
      if (ownText.length >= 2 && !el.closest("mjx-container") && !String(el.className).startsWith("mjx-")) {
        blocks++; chars += ownText.length;
        const fs = parseFloat(cs.fontSize);
        sizes.push(fs);
        fonts[Math.round(fs)] = (fonts[Math.round(fs)]||0) + ownText.length;
      }
      minX = Math.min(minX, r.left); minY = Math.min(minY, r.top);
      maxX = Math.max(maxX, r.right); maxY = Math.max(maxY, r.bottom);
    });
    // 内容密度：仅统计有意义内容（文字块/svg/img/table），排除卡片背景容器
    const gw = Math.ceil((bodyR.width)/40), gh = Math.ceil((bodyR.height)/40);
    const grid = new Set();
    const mark = el => {
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      for (let gx = 0; gx < gw; gx++) for (let gy = 0; gy < gh; gy++) {
        const cx = bodyR.left + gx*40 + 20, cy = bodyR.top + gy*40 + 20;
        if (r.left <= cx && cx <= r.right && r.top <= cy && cy <= r.bottom) grid.add(gx+","+gy);
      }
    };
    body.querySelectorAll("*").forEach(el => {
      const cs = w.getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") return;
      const ownText = Array.from(el.childNodes).filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join("");
      if (ownText.length >= 2) mark(el);
      const tg = el.tagName;
      if (tg === "svg" || tg === "img" || tg === "table") mark(el);
    });
    res.slideW = Math.round(slide.width); res.slideH = Math.round(slide.height);
    res.bodyW = Math.round(bodyR.width); res.bodyH = Math.round(bodyR.height);
    res.coverage = Math.round(grid.size / (gw*gh) * 100);
    res.textBlocks = blocks; res.textChars = chars;
    res.avgFont = sizes.length ? Math.round(sizes.reduce((a,b)=>a+b,0)/sizes.length*10)/10 : 0;
    res.minFont = sizes.length ? Math.min(...sizes) : 0;
    res.fontHist = Object.entries(fonts).map(([fs,c])=>({fs:+fs, chars:c})).sort((a,b)=>b.chars-a.chars).slice(0,6);
    res.svgCount = d.querySelectorAll("svg").length;
    res.playBtn = !!d.getElementById("play");
    res.steps = d.querySelectorAll("[data-step]").length;
    res.imgs = d.querySelectorAll("img").length;
    res.tables = d.querySelectorAll("table").length;
    res.mathbox = d.querySelectorAll(".mathbox").length;
    // 图内文字字号（svg text）
    const sfs = [];
    d.querySelectorAll("svg text").forEach(t => { const fs = parseFloat(w.getComputedStyle(t).fontSize); if (fs) sfs.push(fs); });
    res.svgTextAvg = sfs.length ? Math.round(sfs.reduce((a,b)=>a+b,0)/sfs.length*10)/10 : 0;
    res.svgTextMin = sfs.length ? Math.min(...sfs) : 0;
  } catch (e) { res.err = String(e).slice(0,120); }
  done();
  function done(){ document.getElementById("out").textContent = JSON.stringify(res); }
};
</script></body></html>'''

open(os.path.join(ROOT, "qa", "_measure_probe.html"), "w", encoding="utf-8").write(PROBE)

def probe(task):
    i, ls, page = task
    url = f"http://127.0.0.1:{PORT}/qa/_measure_probe.html?page={page}"
    try:
        r = subprocess.run([CHROME, "--headless=new", "--virtual-time-budget=25000",
                            "--window-size=1500,1150", "--dump-dom", url],
                           capture_output=True, timeout=60)
        h = r.stdout.decode("utf-8", errors="ignore")
        m = re.search(r'<pre id="out">(.*?)</pre>', h, re.S)
        if not m: return {"page": i, "err": "no-out"}
        t = m.group(1).strip()
        if not t.startswith("{"): return {"page": i, "err": "not-json:" + t[:40]}
        d = json.loads(t); d["page"] = i; d["file"] = page
        return d
    except Exception as e:
        return {"page": i, "err": str(e)[:80]}

for ls in lessons:
    data = []
    lt = [t for t in tasks if t[1] == ls]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
        for i, res in enumerate(ex.map(probe, lt)):
            data.append(res)
    outp = os.path.join(ROOT, "qa", f"measure_{ls}.json")
    open(outp, "w", encoding="utf-8").write(json.dumps(data, ensure_ascii=False, indent=1))
    # 摘要
    ok = [d for d in data if not d.get("err")]
    cov = sorted(ok, key=lambda d: d.get("coverage", 0))
    print(f"\n== {ls}: {len(ok)}/{len(data)} 页测量成功，输出 {outp}")
    print("覆盖率最低 8 页:", [(d["page"], d.get("coverage")) for d in cov[:8]])
    print("全章平均覆盖率:", round(sum(d.get("coverage",0) for d in ok)/max(1,len(ok)),1), "%")
    print("平均正文字号:", round(sum(d.get("avgFont",0) for d in ok)/max(1,len(ok)),1), "px")
    print("带播放按钮页数:", sum(1 for d in ok if d.get("playBtn")))
srv.shutdown(); srv.server_close()
os.remove(os.path.join(ROOT, "qa", "_measure_probe.html"))
print("done")
