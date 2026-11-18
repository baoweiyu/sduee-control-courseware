# -*- coding: utf-8 -*-
"""Render and verify the eight newly integrated chapter/section illustrations."""
from pathlib import Path
import subprocess

import pymupdf
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUT = ROOT / "qa" / "ch7-ch8-integrated-images"
OUT.mkdir(parents=True, exist_ok=True)

PAGES = [
    ("第七章 P1", "lesson07-discrete", "p01-cover.html"),
    ("第七章 P3", "lesson07-discrete", "p03-sec71-cover.html"),
    ("第七章 P13", "lesson07-discrete", "p13-sec73-cover.html"),
    ("第七章 P33", "lesson07-discrete", "p33-sec75-cover.html"),
    ("第七章 P46", "lesson07-discrete", "p46-sec77-cover.html"),
    ("第八章 P1", "lesson08-nonlinear", "p01-cover.html"),
    ("第八章 P3", "lesson08-nonlinear", "p03-sec81-cover.html"),
    ("第八章 P15", "lesson08-nonlinear", "p15-sec83-cover.html"),
]

shots = []
for index, (label, lesson, filename) in enumerate(PAGES, 1):
    stem = f"{index:02d}-{lesson}-{Path(filename).stem}"
    pdf = OUT / f"{stem}.pdf"
    png = OUT / f"{stem}.png"
    url = (
        "http://localhost:7100/qa/shot_steps.html"
        f"?page=/lessons/{lesson}/pages/{filename}&steps=0"
    )
    result = subprocess.run(
        [
            CHROME,
            "--headless=new",
            "--virtual-time-budget=10000",
            "--window-size=1448,1086",
            f"--print-to-pdf={pdf}",
            url,
        ],
        capture_output=True,
        timeout=90,
    )
    if not pdf.exists():
        raise RuntimeError(f"PDF render failed: {label}: {result.stderr.decode(errors='ignore')[-300:]}")
    with pymupdf.open(pdf) as doc:
        pix = doc[0].get_pixmap(matrix=pymupdf.Matrix(1.5, 1.5), alpha=False)
        pix.save(png)
    with Image.open(png) as im:
        print(f"{label}: {png.name} {im.width}x{im.height} {png.stat().st_size} bytes")
    shots.append((label, png))

thumb_w, thumb_h, label_h = 720, 540, 40
sheet = Image.new("RGB", (thumb_w * 2, (thumb_h + label_h) * 4), "#e9edf3")
draw = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype(r"C:\Windows\Fonts\msyh.ttc", 24)
except OSError:
    font = ImageFont.load_default()
for i, (label, png) in enumerate(shots):
    x = (i % 2) * thumb_w
    y = (i // 2) * (thumb_h + label_h)
    with Image.open(png) as im:
        thumb = im.convert("RGB")
        thumb.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        px = x + (thumb_w - thumb.width) // 2
        py = y + label_h + (thumb_h - thumb.height) // 2
        sheet.paste(thumb, (px, py))
    draw.text((x + 14, y + 5), label, fill="#17233b", font=font)

contact = OUT / "contact-sheet.jpg"
sheet.save(contact, quality=92, subsampling=0)
print(f"CONTACT {contact} {contact.stat().st_size} bytes")
