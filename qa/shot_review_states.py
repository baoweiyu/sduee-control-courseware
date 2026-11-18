# -*- coding: utf-8 -*-
# 第七、八章逐态审查：python qa/shot_review_states.py lesson07-discrete 0,1,3 [页面正则]
import concurrent.futures
import os
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
LESSON = sys.argv[1]
STEPS = [int(s) for s in (sys.argv[2].split(",") if len(sys.argv) > 2 else ["0"])]
FILTER = sys.argv[3] if len(sys.argv) > 3 else ""
PAGES = ROOT / "lessons" / LESSON / "pages"
OUT_PDF = ROOT / "qa" / (LESSON + "-qa") / "pdf"
OUT_PNG = ROOT / "qa" / (LESSON + "-qa") / "png"
OUT_PDF.mkdir(parents=True, exist_ok=True)
OUT_PNG.mkdir(parents=True, exist_ok=True)
FILES = sorted(p.name for p in PAGES.glob("p*.html")
               if "data-step=" in p.read_text(encoding="utf-8") and (not FILTER or re.search(FILTER, p.name)))
JOBS = [(fn, step) for fn in FILES for step in STEPS]
print(f"shooting {len(FILES)} stepped pages × {len(STEPS)} states", flush=True)


def shot(job):
    fn, step = job
    name = Path(fn).stem + f"-s{step}"
    pdf = OUT_PDF / (name + ".pdf")
    png = OUT_PNG / (name + ".png")
    url = f"http://localhost:7100/qa/shot_steps.html?page=/lessons/{LESSON}/pages/{fn}&steps={step}"
    result = subprocess.run(
        [CHROME, "--headless=new", "--virtual-time-budget=14000",
         "--window-size=1448,1086", f"--print-to-pdf={pdf}", url],
        capture_output=True, timeout=90)
    if not pdf.exists():
        return name + " PDF-FAIL " + result.stderr.decode(errors="ignore")[-120:]
    import pymupdf
    with pymupdf.open(pdf) as doc:
        pix = doc[0].get_pixmap(matrix=pymupdf.Matrix(2.0, 2.0), alpha=False)
        pix.save(png)
    return name + " ok"


with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    for result in pool.map(shot, JOBS):
        print(result, flush=True)
print("DONE")
