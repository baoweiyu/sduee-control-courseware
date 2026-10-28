#!/bin/bash
cd /h/D_tools/courseware-system-kimi
OUT="H:\\D_tools\\courseware-system-kimi\\qa\\lesson04-freq-qa\\png"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
P6=lessons/lesson06-correction/pages
P3=lessons/lesson03-timedomain/pages
for p in p40-localfb-principle p42-compound-concept p43-input-comp p44-ex68 p45-disturb-comp; do
  sed -e 's/ data-step="[0-9]*"//g' -e 's/{ "data-step": "[0-9]" }/{}/g' $P6/$p.html > $P6/zz-b-$p.html
done
sed -e 's/ data-step="[0-9]*"//g' $P3/p69-disturb-ess.html > $P3/zz-b-p69.html 2>/dev/null || true
ls $P3 | grep 69
node server.js --port 7196 >/dev/null 2>&1 &
SRV=$!
sleep 2
TS=$(date +%s)
shot() {
  "$CHROME" --headless=new --disable-gpu --window-size=1600,900 --virtual-time-budget=9000 \
    --screenshot="$OUT\\$1.png" "http://localhost:7196/$2?cb=$TS&ff=1" >/dev/null 2>&1
  echo "$1: $?"
}
shot bd6-p40 "$P6/zz-b-p40-localfb-principle.html"
shot bd6-p42 "$P6/zz-b-p42-compound-concept.html"
shot bd6-p43 "$P6/zz-b-p43-input-comp.html"
shot bd6-p44 "$P6/zz-b-p44-ex68.html"
shot bd6-p45 "$P6/zz-b-p45-disturb-comp.html"
kill $SRV 2>/dev/null
PID=$(netstat -ano | grep 7196 | grep LISTEN | awk '{print $5}' | head -1)
[ -n "$PID" ] && taskkill //PID $PID //F 2>/dev/null
rm -f $P6/zz-b-*.html $P3/zz-b-p69.html
echo DONE
