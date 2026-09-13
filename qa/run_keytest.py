# 按键测试运行器：启临时服务器 -> headless Chrome dump -> 打印 #out 结果
import os, re, sys, socket, subprocess, threading, functools, http.server

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 7199  # 用独立端口，避开可能残留的 7100

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

Handler = functools.partial(Quiet, directory=ROOT)
srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
threading.Thread(target=srv.serve_forever, daemon=True).start()

url = f"http://127.0.0.1:{PORT}/qa/keytest.html"
r = subprocess.run([CHROME, "--headless=new", "--virtual-time-budget=150000",
                    "--window-size=1500,1000", "--dump-dom", url],
                   capture_output=True, timeout=300)
srv.shutdown()
h = r.stdout.decode("utf-8", errors="ignore")
m = re.search(r'<pre id="out">(.*?)</pre>', h, re.S)
if m:
    print(m.group(1))
else:
    print("OUT NOT FOUND, dump len =", len(h))
    open(os.path.join(ROOT, "qa", "keytest-dump.html"), "w", encoding="utf-8").write(h)
print("STDERR-tail:", r.stderr.decode(errors="ignore")[-200:])
