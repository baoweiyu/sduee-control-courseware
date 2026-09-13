# 按页码选择重截第一章页面: python qa/shot_l1_sel.py 13 16 26 ...
import os, sys, subprocess, concurrent.futures

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PAGES_DIR = os.path.join(ROOT, "lessons", "lesson01-intro", "pages")
OUT_PDF = os.path.join(ROOT, "qa", "ch1-qa", "pdf")
OUT_PNG = os.path.join(ROOT, "qa", "ch1-qa", "png")
os.makedirs(OUT_PDF, exist_ok=True)
os.makedirs(OUT_PNG, exist_ok=True)

allfiles = sorted(f for f in os.listdir(PAGES_DIR) if f.endswith(".html"))
want = set("p%02d" % int(a) for a in sys.argv[1:])
files = [f for f in allfiles if f[:3] in want]
print("shooting:", files)

def shot(fn):
    name = fn[:-5]
    pdf = os.path.join(OUT_PDF, name + ".pdf")
    png = os.path.join(OUT_PNG, name + ".png")
    url = f"http://localhost:7100/qa/shot.html?page=/lessons/lesson01-intro/pages/{fn}"
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
    for res in ex.map(shot, files):
        print(res, flush=True)
print("DONE")
