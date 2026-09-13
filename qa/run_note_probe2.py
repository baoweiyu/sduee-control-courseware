# 单页结论条探针运行器：并发 chrome（每页一次运行），合并全章结果
# 用法: python qa/run_note_probe2.py [lesson ...]（缺省四章全扫）
import os, re, json, subprocess, threading, functools, http.server, sys, concurrent.futures

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 7199

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

Handler = functools.partial(Quiet, directory=ROOT)
srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
threading.Thread(target=srv.serve_forever, daemon=True).start()

lessons = sys.argv[1:] or ["lesson01-intro", "lesson02-math-model", "lesson03-timedomain", "lesson04-freq"]
tasks = []
for ls in lessons:
    idx = json.load(open(os.path.join(ROOT, "lessons", ls, "lesson.json"), encoding="utf-8"))
    for pg in idx["pages"]:
        tasks.append("/lessons/%s/%s" % (ls, pg["file"]))
print("总页数:", len(tasks))

def probe(page):
    url = f"http://127.0.0.1:{PORT}/qa/note_probe_one.html?page={page}"
    try:
        r = subprocess.run([CHROME, "--headless=new", "--virtual-time-budget=25000",
                            "--window-size=1500,1150", "--dump-dom", url],
                           capture_output=True, timeout=60)
        h = r.stdout.decode("utf-8", errors="ignore")
        m = re.search(r'<pre id="out">(.*?)</pre>', h, re.S)
        if not m: return {"page": page, "err": "no-out"}
        t = m.group(1).strip()
        if not t.startswith("{"): return {"page": page, "err": "not-json:" + t[:40]}
        return json.loads(t)
    except Exception as e:
        return {"page": page, "err": str(e)[:80]}

data = []
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
    for i, res in enumerate(ex.map(probe, tasks)):
        data.append(res)
        if (i + 1) % 25 == 0: print("  进度", i + 1, "/", len(tasks), flush=True)

srv.shutdown(); srv.server_close()
errs = [d for d in data if d.get("err")]
bad = [d for d in data if d.get("note") and d.get("overlap", 0) > 0]
print("\n=== 汇总 ===")
print("页数:", len(data), " 有结论条:", sum(1 for d in data if d.get("note")),
      " 遮挡页:", len(bad), " 异常:", len(errs))
for d in sorted(bad, key=lambda x: -x["overlap"]):
    print("  OVERLAP %4dpx  pair=%s  %-52s %s" % (d["overlap"], d["pair"], d["page"], d.get("who", "")))
for d in errs[:10]:
    print("  ERR", d["page"], d["err"])
nopair = [d["page"] for d in data if d.get("note") and not d.get("pair")]
print("缺 has-note 配对:", len(nopair))
open(os.path.join(ROOT, "qa", "note_probe_result.json"), "w", encoding="utf-8").write(
    json.dumps(data, ensure_ascii=False, indent=1))
print("明细已存 qa/note_probe_result.json")
