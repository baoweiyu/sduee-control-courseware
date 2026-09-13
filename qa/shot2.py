# 稳健版按页截图：进程内起服务器（独立端口 7299，避开 7100 僵尸），截完自动关停
# 用法: python qa/shot2.py lesson01-intro 3 11 20 ...
import os, sys, subprocess, threading, functools, http.server, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 7199
LESSON = sys.argv[1]
PAGES_DIR = os.path.join(ROOT, "lessons", LESSON, "pages")
OUT_PDF = os.path.join(ROOT, "qa", LESSON + "-qa", "pdf")
OUT_PNG = os.path.join(ROOT, "qa", LESSON + "-qa", "png")
os.makedirs(OUT_PDF, exist_ok=True)
os.makedirs(OUT_PNG, exist_ok=True)

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

Handler = functools.partial(Quiet, directory=ROOT)
srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
threading.Thread(target=srv.serve_forever, daemon=True).start()
time.sleep(0.6)

allfiles = sorted(f for f in os.listdir(PAGES_DIR) if f.endswith(".html"))
want = set("p%02d" % int(a) for a in sys.argv[2:])
files = [f for f in allfiles if f[:3] in want]
print("shooting:", files)

for fn in files:
    name = fn[:-5]
    pdf = os.path.join(OUT_PDF, name + ".pdf")
    png = os.path.join(OUT_PNG, name + ".png")
    url = f"http://127.0.0.1:{PORT}/qa/shot.html?page=/lessons/{LESSON}/pages/{fn}"
    r = subprocess.run([CHROME, "--headless=new", "--virtual-time-budget=14000",
                        "--window-size=1448,1086", f"--print-to-pdf={pdf}", url],
                       capture_output=True, timeout=90)
    if not os.path.exists(pdf):
        print(name, "PDF-FAIL", r.stderr.decode(errors="ignore")[-120:])
        continue
    import pymupdf
    doc = pymupdf.open(pdf)
    pix = doc[0].get_pixmap(matrix=pymupdf.Matrix(2.0, 2.0), alpha=False)
    pix.save(png)
    print(name, "ok", flush=True)

srv.shutdown()
srv.server_close()
print("DONE")
