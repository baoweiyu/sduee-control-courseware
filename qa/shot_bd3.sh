#!/bin/bash
cd /h/D_tools/courseware-system-kimi
OUT="H:\\D_tools\\courseware-system-kimi\\qa\\lesson04-freq-qa\\png"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
P6=lessons/lesson06-correction/pages
for p in p04-def-ways p05-methods p40-localfb-principle p42-compound-concept p43-input-comp p44-ex68 p45-disturb-comp; do
  sed -e 's/ data-step="[0-9]*"//g' -e 's/{ "data-step": "[0-9]" }/{}/g' $P6/$p.html > $P6/zz-v-$p.html
done
node server.js --port 7196 >/dev/null 2>&1 &
SRV=$!
sleep 2
TS=$(date +%s)
shot() {
  "$CHROME" --headless=new --disable-gpu --window-size=1600,900 --virtual-time-budget=9000 \
    --screenshot="$OUT\\$1.png" "http://localhost:7196/$2?cb=$TS&ff=1&steps=9" >/dev/null 2>&1
  echo "$1: $?"
}
shot v2-p04 $P6/zz-v-p04-def-ways.html
shot v2-p05 $P6/zz-v-p05-methods.html
shot v2-p40 $P6/zz-v-p40-localfb-principle.html
shot v2-p42 $P6/zz-v-p42-compound-concept.html
shot v2-p43 $P6/zz-v-p43-input-comp.html
shot v2-p44 $P6/zz-v-p44-ex68.html
shot v2-p45 $P6/zz-v-p45-disturb-comp.html
kill $SRV 2>/dev/null
PID=$(netstat -ano | grep 7196 | grep LISTEN | awk '{print $5}' | head -1)
[ -n "$PID" ] && taskkill //PID $PID //F 2>/dev/null
rm -f $P6/zz-v-*.html
echo DONE
