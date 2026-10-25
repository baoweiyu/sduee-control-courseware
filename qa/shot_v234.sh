#!/bin/bash
cd /h/D_tools/courseware-system-kimi
P=lessons/lesson04-freq/pages
OUT="H:\\D_tools\\courseware-system-kimi\\qa\\lesson04-freq-qa\\png"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
# JS 语法快速校验（抽取 <script> 块）
for f in p78-margin-intro p81-notes-summary p68-opencl-poles; do
  sed -n '/<script>$/,/<\/script>/p' $P/$f.html | sed '1d;$d' > /tmp/chk_$f.js
  node --check /tmp/chk_$f.js && echo "JS-OK $f" || echo "JS-FAIL $f"
done
# 全步显临时副本：剥 HTML 与 JS 中的 data-step
sed -e 's/ data-step="[0-9]*"//g' -e 's/{ "data-step": "[0-9]" }/{}/g' $P/p78-margin-intro.html > $P/zz-qa-p78.html
sed -e 's/ data-step="[0-9]*"//g' $P/p81-notes-summary.html > $P/zz-qa-p81.html
node server.js --port 7199 >/dev/null 2>&1 &
SRV=$!
sleep 2
TS=$(date +%s)
shot() {
  "$CHROME" --headless=new --disable-gpu --window-size=1600,900 --virtual-time-budget=9000 \
    --screenshot="$OUT\\$1.png" "http://localhost:7199/$P/$2?cb=$TS" >/dev/null 2>&1
  echo "$1: $?"
}
shot v234-p68 p68-opencl-poles.html
shot v234-p78 zz-qa-p78.html
shot v234-p81 zz-qa-p81.html
kill $SRV 2>/dev/null
PID=$(netstat -ano | grep 7199 | grep LISTEN | awk '{print $5}' | head -1)
[ -n "$PID" ] && taskkill //PID $PID //F 2>/dev/null
rm -f $P/zz-qa-p78.html $P/zz-qa-p81.html
echo DONE
