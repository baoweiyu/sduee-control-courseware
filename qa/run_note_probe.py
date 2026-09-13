# 结论条遮挡探针运行器：分章各跑一次，合并结果
import os, re, json, subprocess, threading, functools, http.server, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 7199

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

Handler = functools.partial(Quiet, directory=ROOT)
srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
threading.Thread(target=srv.serve_forever, daemon=True).start()

lessons = sys.argv[1:] or ["lesson01-intro", "lesson02-math-model", "lesson03-timedomain", "lesson04-freq"]
data = []
for ls in lessons:
    r = subprocess.run([CHROME, "--headless=new", "--virtual-time-budget=400000",
                        "--window-size=1500,1150", "--dump-dom",
                        f"http://127.0.0.1:{PORT}/qa/note_probe.html?lesson={ls}"],
                       capture_output=True, timeout=280)
    h = r.stdout.decode("utf-8", errors="ignore")
    m = re.search(r'<pre id="out">(.*?)</pre>', h, re.S)
    if not m:
        print(ls, "OUT NOT FOUND len=", len(h)); continue
    inner = m.group(1)
    done = inner.startswith("DONE")
    if done: inner = inner[4:]
    rows = [json.loads(x) for x in inner.strip().splitlines() if x.strip().startswith("{")]
    print(ls, "页数:", len(rows), " 完整:", done)
    data.extend(rows)

srv.shutdown(); srv.server_close()
bad = [d for d in data if d.get("note") and d.get("overlap", 0) > 0]
print("\n=== 汇总 ===")
print("总页数:", len(data), " 有结论条:", sum(1 for d in data if d.get("note")), " 遮挡页:", len(bad))
for d in sorted(bad, key=lambda x: -x["overlap"]):
    print("  OVERLAP %4dpx  pair=%s  %-52s %s" % (d["overlap"], d["pair"], d["page"], d.get("who","")))
nopair = [d["page"] for d in data if d.get("note") and not d.get("pair")]
print("缺 has-note 配对:", len(nopair))
open(os.path.join(ROOT, "qa", "note_probe_result.json"), "w", encoding="utf-8").write(
    json.dumps(data, ensure_ascii=False, indent=1))
print("明细已存 qa/note_probe_result.json")
