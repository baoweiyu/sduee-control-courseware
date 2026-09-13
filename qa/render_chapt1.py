import sys, subprocess
from pathlib import Path

try:
    import fitz
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pymupdf", "-q"])
    import fitz

doc = fitz.open("bwy-ori-oldPPT/chapt1.pdf")
out = Path("qa/chapt1-pages")
out.mkdir(parents=True, exist_ok=True)
for i, page in enumerate(doc, 1):
    pix = page.get_pixmap(dpi=100)
    pix.save(str(out / f"p{i:02d}.png"))
print("rendered", len(doc), "pages to", out)
