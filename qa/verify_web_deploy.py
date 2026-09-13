# -*- coding: utf-8 -*-
"""Web 部署包端到端验证：解压 -> 起临时静态服务器 -> headless Chrome 截图 -> 关停服务器。
不留下任何后台进程。"""
import os, subprocess, sys, time, zipfile, socket, http.server, functools, threading

ROOT = r"H:\D_tools\courseware-system-kimi"
ZIP = os.environ.get("WEBDEPLOY_ZIP", "").strip() or os.path.join(ROOT, "act-courseware-web-deploy-v2.16.zip")
TMP = os.path.join(ROOT, "_webtest_tmp")
PORT = 7291
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUTDIR = os.path.join(ROOT, "qa", "webtest")
os.makedirs(OUTDIR, exist_ok=True)

# 0. 清理并解压
import shutil
if os.path.exists(TMP):
    shutil.rmtree(TMP)
os.makedirs(TMP)
with zipfile.ZipFile(ZIP) as z:
    z.extractall(TMP)
print("解压完成:", len(os.listdir(TMP)), "个顶层条目")

# 1. 起临时静态服务器（子线程，主线程结束时随进程退出）
Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=TMP)
httpd = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
httpd.log_message = lambda *a, **k: None
t = threading.Thread(target=httpd.serve_forever, daemon=True)
t.start()
time.sleep(0.8)

# 2. HTTP 级检查
import urllib.request
urls = ["/", "/player/", "/lessons/index.json", "/theme/theme.css",
        "/lessons/lesson04-freq/lesson.json",
        "/lessons/lesson04-freq/pages/p16-elem-pid.html"]
for u in urls:
    try:
        r = urllib.request.urlopen(f"http://127.0.0.1:{PORT}{u}", timeout=5)
        print(f"GET {u} -> {r.status} ({len(r.read())}B)")
    except Exception as e:
        print(f"GET {u} -> 失败: {e}")

# 3. 抽查一个 assets 图片
with open(os.path.join(TMP, "lessons", "lesson04-freq", "pages", "p16-elem-pid.html"), encoding="utf-8") as f:
    import re
    m = re.search(r"assets/(?:image2|legacy)/[^\"'\)\s>]+", f.read())
if m:
    try:
        r = urllib.request.urlopen(f"http://127.0.0.1:{PORT}/{m.group(0)}", timeout=5)
        print(f"GET /{m.group(0)} -> {r.status} ({len(r.read())//1024}KB)")
    except Exception as e:
        print(f"GET /{m.group(0)} -> 失败: {e}")

# 4. headless Chrome 截播放器首页（验证 http 下 fetch+渲染真工作）
pdf = os.path.join(OUTDIR, "webtest-player.pdf")
r = subprocess.run([CHROME, "--headless=new", "--virtual-time-budget=14000",
                    "--window-size=1448,1086", f"--print-to-pdf={pdf}",
                    f"http://127.0.0.1:{PORT}/player/"],
                   capture_output=True, timeout=120)
print("chrome rc:", r.returncode, "pdf:", os.path.exists(pdf))

# 5. 转 png 供目检（pdf2png 是 CLI 脚本，用子进程调用）
r2 = subprocess.run([sys.executable, os.path.join(ROOT, "qa", "pdf2png.py"),
                     pdf, os.path.join(OUTDIR, "webtest-player.png")],
                    capture_output=True, timeout=120)
print("pdf2png rc:", r2.returncode)

# 6. 关停服务器并清理解压目录
httpd.shutdown()
httpd.server_close()
shutil.rmtree(TMP, ignore_errors=True)
print("服务器已关停，临时目录已清理")
