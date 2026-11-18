# -*- coding: utf-8 -*-
# 第八章审查：互动页初始态与关键中间态截图。
import concurrent.futures
import os
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
LESSON = "lesson08-nonlinear"
OUT_PDF = os.path.join(ROOT, "qa", LESSON + "-qa", "pdf")
OUT_PNG = os.path.join(ROOT, "qa", LESSON + "-qa", "png")
os.makedirs(OUT_PDF, exist_ok=True)
os.makedirs(OUT_PNG, exist_ok=True)

JOBS = [
    ("p10-deadzone.html", 0),
    ("p11-saturation.html", 0),
    ("p12-gap.html", 0),
    ("p12-gap.html", 3),
    ("p13-relay.html", 0),
    ("p21-neginv.html", 0),
    ("p21-neginv.html", 2),
    ("p26-three-cases.html", 0),
    ("p26-three-cases.html", 1),
    ("p27-limit-cycle.html", 0),
    ("p27-limit-cycle.html", 3),
    ("p32-quiz3.html", 0),
]


def shot(fn, step):
    name = fn[:-5] + f"-s{step}"
    pdf = os.path.join(OUT_PDF, name + ".pdf")
    png = os.path.join(OUT_PNG, name + ".png")
    url = (f"http://localhost:7100/qa/shot_steps.html?page=/lessons/{LESSON}/pages/{fn}"
           f"&steps={step}")
    result = subprocess.run(
        [CHROME, "--headless=new", "--virtual-time-budget=14000",
         "--window-size=1448,1086", f"--print-to-pdf={pdf}", url],
        capture_output=True, timeout=90)
    if not os.path.exists(pdf):
        return name + " PDF-FAIL " + result.stderr.decode(errors="ignore")[-120:]
    import pymupdf
    doc = pymupdf.open(pdf)
    pix = doc[0].get_pixmap(matrix=pymupdf.Matrix(2.0, 2.0), alpha=False)
    pix.save(png)
    return name + " ok"


with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    futures = [pool.submit(shot, fn, step) for fn, step in JOBS]
    for future in futures:
        print(future.result(), flush=True)
print("DONE")
