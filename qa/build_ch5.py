# -*- coding: utf-8 -*-
"""第五章主构建：汇总 P1-P68 页面定义并写出 pages/ + lesson.json。"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_lib import write_all
from build_ch5_p1a import PAGES as P1
from build_ch5_p1b import PAGES as P1b
from build_ch5_p2 import PAGES as P2
from build_ch5_p3 import PAGES as P3
from build_ch5_p4 import PAGES as P4
from build_ch5_p5 import PAGES as P5

PAGES = P1 + P1b + P2 + P3 + P4 + P5
print("total pages:", len(PAGES))
write_all("lesson05-root-locus", PAGES, {
    "lesson_id": "lesson05-root-locus",
    "title": "第五章 根轨迹法",
    "source": "bwy-ori-oldPPT/chapt5 根轨迹法V2.pdf（104页四讲）",
})
