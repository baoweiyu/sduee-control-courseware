import sys
from pathlib import Path
try:
    import pymupdf
except ImportError:
    import fitz as pymupdf

doc = pymupdf.open("bwy-ori-oldPPT/chapt1.pdf")
out = Path("assets/legacy/chapt1")
out.mkdir(parents=True, exist_ok=True)
count = 0
for pno in range(len(doc)):
    page = doc[pno]
    for i, img in enumerate(page.get_images(full=True)):
        xref = img[0]
        try:
            pix = pymupdf.Pixmap(doc, xref)
            if pix.width < 60 or pix.height < 60:
                continue
            if pix.n - pix.alpha > 3:
                pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
            fn = out / f"p{pno+1:02d}-img{i:02d}-{pix.width}x{pix.height}.png"
            pix.save(str(fn))
            count += 1
        except Exception as e:
            print("skip", pno + 1, i, e)
print("extracted", count, "images ->", out)
