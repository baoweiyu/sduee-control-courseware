# -*- coding: utf-8 -*-
# 联系图：python qa/make_review_contacts.py lesson07-discrete s0 [页面正则] [输出标签]
# 最终态：python qa/make_review_contacts.py lesson07-discrete final
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
LESSON = sys.argv[1]
STATE = sys.argv[2] if len(sys.argv) > 2 else "s0"
FILTER = sys.argv[3] if len(sys.argv) > 3 else ""
TAG = STATE + ("-" + sys.argv[4] if len(sys.argv) > 4 else "")
PNG = ROOT / "qa" / (LESSON + "-qa") / "png"
pat = (re.compile(r"^(p\d{2}.+)\.png$") if STATE == "final"
       else re.compile(r"^(p\d{2}.+)-" + re.escape(STATE) + r"\.png$"))
files = sorted((p for p in PNG.glob("p*.png")
                if pat.match(p.name)
                and (STATE != "final" or not re.search(r"-s\d+\.png$", p.name))
                and (not FILTER or re.search(FILTER, p.name))), key=lambda p: p.name)
assert files, "no matching screenshots"
W, H, LABEL, COLS, ROWS = 480, 360, 34, 3, 4
font = ImageFont.truetype(r"C:\Windows\Fonts\msyh.ttc", 20)
for page in range(math.ceil(len(files) / (COLS * ROWS))):
    batch = files[page * COLS * ROWS:(page + 1) * COLS * ROWS]
    sheet = Image.new("RGB", (W * COLS, (H + LABEL) * ROWS), "#DCE3EF")
    draw = ImageDraw.Draw(sheet)
    for i, path in enumerate(batch):
        with Image.open(path) as im:
            im = im.convert("RGB")
            im.thumbnail((W, H), Image.Resampling.LANCZOS)
            x, y = (i % COLS) * W, (i // COLS) * (H + LABEL)
            sheet.paste(im, (x + (W - im.width) // 2, y + LABEL + (H - im.height) // 2))
            draw.text((x + 10, y + 4), path.stem, font=font, fill="#12266E")
    out = PNG / f"{LESSON}-{TAG}-contact-{page + 1}.jpg"
    sheet.save(out, quality=92)
    print(out)
print(f"TOTAL {len(files)}")
