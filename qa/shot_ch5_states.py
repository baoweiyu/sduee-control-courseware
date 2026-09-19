# -*- coding: utf-8 -*-
# 第五章示例页多状态截图：python qa/shot_ch5_states.py
import os, subprocess, concurrent.futures

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
LESSON = "lesson05-root-locus"
OUT = os.path.join(ROOT, "qa", LESSON + "-qa", "png")
os.makedirs(OUT, exist_ok=True)

JOBS = [
    ("p01-intro-anim.html", [0, 3, 5]),
    ("p02-rule3.html", [0, 3, 6]),
    ("p03-ex53-circle.html", [0, 3, 5]),
    ("p04-ex52-full.html", [0, 2, 4, 5]),
    ("p05-asym-dual.html", [0, 2, 4]),
]

def shot(fn, st):
    name = fn[:-5] + f"-s{st}"
    pdf = os.path.join(ROOT, "qa", LESSON + "-qa", "pdf", name + ".pdf")
    png = os.path.join(OUT, name + ".png")
    os.makedirs(os.path.dirname(pdf), exist_ok=True)
    url = f"http://localhost:7100/qa/shot_steps.html?page=/lessons/{LESSON}/pages/{fn}&steps={st}"
    r = subprocess.run([CHROME, "--headless=new", "--virtual-time-budget=14000",
                        "--window-size=1448,1086", f"--print-to-pdf={pdf}", url],
                       capture_output=True, timeout=90)
    if not os.path.exists(pdf):
        return name + " PDF-FAIL " + r.stderr.decode(errors="ignore")[-120:]
    import pymupdf
    doc = pymupdf.open(pdf)
    pix = doc[0].get_pixmap(matrix=pymupdf.Matrix(2.0, 2.0), alpha=False)
    pix.save(png)
    return name + " ok"

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
    futs = [ex.submit(shot, fn, st) for fn, sts in JOBS for st in sts]
    for f in futs:
        print(f.result(), flush=True)
print("DONE")
