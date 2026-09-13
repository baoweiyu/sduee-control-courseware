# -*- coding: utf-8 -*-
"""裁掉 ref-driving.png / ref-level.png 底部的蓝色结论横条（结论改用 HTML 独立框呈现）。
从底部向上扫描，找第一条蓝色占比>25% 的连续横带，裁到其顶边上方 10px。
原图不改动，输出 -noc.png 新文件。"""
import numpy as np
from PIL import Image

SRC = [
    (r"assets\legacy\chapt1\ref-driving.png", r"assets\legacy\chapt1\ref-driving-noc.png"),
    (r"assets\legacy\chapt1\ref-level.png",   r"assets\legacy\chapt1\ref-level-noc.png"),
]

for src, dst in SRC:
    im = Image.open(src).convert("RGB")
    a = np.asarray(im).astype(int)
    H, W, _ = a.shape
    R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    blue = (B > 90) & (B - R > 30) & (B - G > 10)
    ratio = blue.mean(axis=1)

    # 从底部向上：先跳过底部的非蓝行，再吃掉整条蓝带
    y = H - 1
    while y >= 0 and ratio[y] < 0.25:
        y -= 1
    if y < 0:
        print(src, "未找到蓝色横带，未裁剪")
        continue
    bottom = y
    while y >= 0 and ratio[y] >= 0.25:
        y -= 1
    top = y + 1  # 蓝带顶边
    cut = max(0, top - 10)
    im.crop((0, 0, W, cut)).save(dst)
    print("%s %dx%d → 蓝带 y=%d..%d，裁剪到 %d，输出 %s (%dx%d)"
          % (src, W, H, top, bottom, cut, dst, W, cut))
