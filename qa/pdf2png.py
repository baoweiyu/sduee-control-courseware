"""把 save_as_pdf 生成的 PDF 首页渲染为 PNG，供目检。
用法: python qa/pdf2png.py <pdf路径> <png输出路径>
"""
import sys, pymupdf

src, dst = sys.argv[1], sys.argv[2]
doc = pymupdf.open(src)
page = doc[0]
mat = pymupdf.Matrix(2.2, 2.2)  # 放大保证清晰度
pix = page.get_pixmap(matrix=mat, alpha=False)
pix.save(dst)
print(f"OK {dst} {pix.width}x{pix.height}")
