# 批量截图第四章全部页面（终态，所有 step 展开）
# 用法: python qa/shot_l4_all.py [起始序号 1-83]
import os, sys, subprocess, concurrent.futures

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PAGES_DIR = os.path.join(ROOT, "lessons", "lesson04-freq", "pages")
OUT_PDF = os.path.join(ROOT, "qa", "ch4-qa", "pdf")
OUT_PNG = os.path.join(ROOT, "qa", "ch4-qa", "png")
os.makedirs(OUT_PDF, exist_ok=True)
os.makedirs(OUT_PNG, exist_ok=True)

files = sorted(f for f in os.listdir(PAGES_DIR) if f.endswith(".html"))
start = int(sys.argv[1]) - 1 if len(sys.argv) > 1 else 0
files = files[start:]

def shot(fn):
    name = fn[:-5]
    pdf = os.path.join(OUT_PDF, name + ".pdf")
    png = os.path.join(OUT_PNG, name + ".png")
    url = f"http://localhost:7100/qa/shot.html?page=/lessons/lesson04-freq/pages/{fn}"
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
