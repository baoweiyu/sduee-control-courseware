#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""提取第八章全部内联脚本，用 node --check 做纯语法检查（不执行 DOM）。"""
from pathlib import Path
import os
import re
import shutil
import subprocess

NODE = shutil.which("node")
ENV = None
if NODE is None:
    electron = Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "Kimi" / "Kimi.exe"
    if electron.exists():
        NODE = str(electron)
        ENV = os.environ.copy()
        ENV["ELECTRON_RUN_AS_NODE"] = "1"
if NODE is None:
    raise SystemExit("Node.js 未找到，无法执行语法检查")

ROOT = Path(__file__).resolve().parents[1]
LESSON = ROOT / "lessons" / "lesson08-nonlinear"
OUT = ROOT / "qa" / "lesson08-nonlinear-qa" / "js-syntax"
OUT.mkdir(parents=True, exist_ok=True)

scripts = []
pattern = re.compile(r"<script\b([^>]*)>(.*?)</script\s*>", re.IGNORECASE | re.DOTALL)
for page in sorted((LESSON / "pages").glob("p*.html")):
    html = page.read_text(encoding="utf-8")
    for index, match in enumerate(pattern.finditer(html), 1):
        attrs, body = match.groups()
        if re.search(r"\bsrc\s*=", attrs, re.IGNORECASE) or not body.strip():
            continue
        target = OUT / f"{page.stem}-inline-{index}.js"
        target.write_text(body, encoding="utf-8")
        scripts.append((page.name, target))
scripts.append(("fig.js", LESSON / "fig.js"))

failed = []
for name, target in scripts:
    result = subprocess.run([NODE, "--check", str(target)], capture_output=True, text=True, encoding="utf-8", errors="replace", env=ENV)
    if result.returncode:
        failed.append(name)
        print(f"FAIL {name}: {target.name}")
        print((result.stderr or result.stdout).strip())
    else:
        print(f"PASS {name}: {target.name}")

print(f"\nCHECKED {len(scripts)} scripts; FAILED {len(failed)}")
raise SystemExit(1 if failed else 0)
