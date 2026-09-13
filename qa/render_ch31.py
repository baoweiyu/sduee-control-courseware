# -*- coding: utf-8 -*-
"""渲染 chapt3-1.pdf 指定页为 PNG"""
import pymupdf, os

SRC = r"H:\D_tools\courseware-system-kimi\bwy-ori-oldPPT\chapt3-1.pdf"
OUT = r"H:\D_tools\courseware-system-kimi\qa\ch3-text"
doc = pymupdf.open(SRC)
for p in [3, 4, 5, 6, 7, 10, 11, 12, 16, 17, 18, 19]:  # 0-based: PDF 第 4-8, 11-13, 17-20 页
    pg = doc[p]
    pix = pg.get_pixmap(matrix=pymupdf.Matrix(2.0, 2.0), alpha=False)
    dst = os.path.join(OUT, "ch31-p%02d.png" % (p + 1))
    pix.save(dst)
    print("OK", dst, "%dx%d" % (pix.width, pix.height))
