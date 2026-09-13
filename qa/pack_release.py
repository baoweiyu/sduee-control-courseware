# -*- coding: utf-8 -*-
"""打包第一章+第二章正式稿：剔除密钥配置与生成脚本，仅保留播放所需文件"""
import os, zipfile

ROOT = r"H:\D_tools\courseware-system-kimi"
OUT = os.path.join(ROOT, "act-courseware-ch1-ch2-v1.1-正式稿.zip")

INCLUDE_DIRS = ["player", "lessons", "theme", "components", os.path.join("assets", "legacy")]
INCLUDE_FILES = ["server.js", "start.bat", "package.json", "README-播放说明.txt"]
IMG2_DIR = os.path.join("assets", "image2")

count = 0
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for d in INCLUDE_DIRS:
        for dirpath, dirnames, filenames in os.walk(os.path.join(ROOT, d)):
            for fn in filenames:
                full = os.path.join(dirpath, fn)
                rel = os.path.relpath(full, ROOT)
                z.write(full, rel)
                count += 1
    # image2 仅收 png（剔除 image2_config.json / generate.py / prompts/）
    for fn in sorted(os.listdir(os.path.join(ROOT, IMG2_DIR))):
        if fn.lower().endswith(".png"):
            z.write(os.path.join(ROOT, IMG2_DIR, fn), os.path.join(IMG2_DIR, fn))
            count += 1
    for fn in INCLUDE_FILES:
        z.write(os.path.join(ROOT, fn), fn)
        count += 1

size = os.path.getsize(OUT)
print("files=%d size=%.1fMB" % (count, size / 1048576))
print(OUT)

# 安全校验：压缩包内不得出现密钥文件
with zipfile.ZipFile(OUT) as z:
    names = z.namelist()
leak = [n for n in names if "image2_config" in n or n.endswith("generate.py") or "prompts" in n]
print("leak-check:", leak or "OK 无密钥文件")
