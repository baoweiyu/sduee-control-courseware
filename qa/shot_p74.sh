#!/bin/bash
cd /h/D_tools/courseware-system-kimi
P=lessons/lesson04-freq/pages
OUT="H:\\D_tools\\courseware-system-kimi\\qa\\lesson04-freq-qa\\png"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
node server.js --port 7199 >/dev/null 2>&1 &
SRV=$!
sleep 2
TS=$(date +%s)
"$CHROME" --headless=new --disable-gpu --window-size=1600,900 --virtual-time-budget=9000 \
  --screenshot="$OUT\\v234-p74.png" "http://localhost:7199/$P/p74-fourstep-puzzle.html?cb=$TS" >/dev/null 2>&1
echo "shot: $?"
kill $SRV 2>/dev/null
PID=$(netstat -ano | grep 7199 | grep LISTEN | awk '{print $5}' | head -1)
[ -n "$PID" ] && taskkill //PID $PID //F 2>/dev/null
python - <<'PY'
from PIL import Image
im = Image.open(r"H:\D_tools\courseware-system-kimi\qa\lesson04-freq-qa\png\v234-p74.png")
# 四个图标区（整页 1600x900 中的像素范围），放大 2 倍便于检查
boxes = {"i0": (250, 305, 525, 595), "i1": (525, 305, 800, 595), "i2": (800, 305, 1075, 595), "i3": (1075, 305, 1355, 595)}
for k, b in boxes.items():
    c = im.crop(b)
    c = c.resize((c.width * 2, c.height * 2), Image.LANCZOS)
    c.save(rf"H:\D_tools\courseware-system-kimi\qa\lesson04-freq-qa\png\v234-p74-{k}.png")
print("crops done")
PY
echo DONE
