#!/bin/bash
# 截图自验管线：临时启动 7194 静态服务器，批量无头截图后关闭服务器。
# 用法：bash qa/shot7194.sh "名称|URL" "名称|URL" ...
# URL 相对工作区根，如 lessons/lesson06-correction/pages/p08-lead-bode.html?ff=0.999
cd "$(dirname "$0")/.." || exit 1
OUT='H:\D_tools\courseware-system-kimi\qa\review-shots'
python -m http.server 7194 --bind 127.0.0.1 >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT
sleep 1.5
for spec in "$@"; do
  name="${spec%%|*}"; url="${spec#*|}"
  "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu \
    --window-size=1600,900 --virtual-time-budget=12000 \
    --screenshot="${OUT}\\${name}.png" "http://127.0.0.1:7194/${url}" >/dev/null 2>&1
  sleep 0.4
  if [ -f "qa/review-shots/${name}.png" ]; then echo "OK  ${name}"; else echo "MISS ${name}"; fi
done
kill $SRV 2>/dev/null
trap - EXIT
