#!/bin/bash
cd /h/D_tools/courseware-system-kimi
P=lessons/lesson04-freq/pages
OUT="H:\\D_tools\\courseware-system-kimi\\qa\\lesson04-freq-qa\\png"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
# P81 全步显临时副本：剥掉 data-step 属性，让所有行直接显示
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
shot v233-p61 p61-map-vector.html
shot v233-p62 p62-map-diff.html
shot v233-p63 p63-map-product.html
shot v233-p64 p64-map-encircle.html
shot v233-p68 p68-opencl-poles.html
shot v233-p71 p71-nyquist-criterion.html
shot v233-p78 p78-margin-intro.html
shot v233-p81 zz-qa-p81.html
kill $SRV 2>/dev/null
PID=$(netstat -ano | grep 7199 | grep LISTEN | awk '{print $5}' | head -1)
[ -n "$PID" ] && taskkill //PID $PID //F 2>/dev/null
rm -f $P/zz-qa-p81.html
echo DONE
