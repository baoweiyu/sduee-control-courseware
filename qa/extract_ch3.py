# -*- coding: utf-8 -*-
"""提取 chapt3 四个 PDF 的文本，输出到 qa/ch3-text/"""
import os
from pypdf import PdfReader

SRC = r"H:\D_tools\courseware-system-kimi\bwy-ori-oldPPT"
OUT = r"H:\D_tools\courseware-system-kimi\qa\ch3-text"
os.makedirs(OUT, exist_ok=True)

for name in ["chapt3-1", "chapt3-2", "chapt3-3", "chapt3-4"]:
    path = os.path.join(SRC, name + ".pdf")
    r = PdfReader(path)
    lines = []
    for i, pg in enumerate(r.pages, 1):
        t = pg.extract_text() or ""
        lines.append("===== PAGE %d =====" % i)
        lines.append(t)
    out = os.path.join(OUT, name + ".txt")
    with open(out, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(name, "pages:", len(r.pages), "->", out)
