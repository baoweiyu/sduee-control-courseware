#!/bin/bash
cd /h/D_tools/courseware-system-kimi
OUT="H:\\D_tools\\courseware-system-kimi\\qa\\lesson04-freq-qa\\png"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
P6=lessons/lesson06-correction/pages
# 全步显副本（HTML 门控剥除）
for p in p04-def-ways p05-methods; do
  sed -e 's/ data-step="[0-9]*"//g' -e 's/{ "data-step": "[0-9]" }/{}/g' $P6/$p.html > $P6/zz-s-$p.html
done
node server.js --port 7196 >/dev/null 2>&1 &
SRV=$!
sleep 2
TS=$(date +%s)
shot() {
  "$CHROME" --headless=new --disable-gpu --window-size=1600,900 --virtual-time-budget=9000 \
    --screenshot="$OUT\\$1.png" "http://localhost:7196/$2?cb=$TS" >/dev/null 2>&1
  echo "$1: $?"
}
shot bd-p04 $P6/zz-s-p04-def-ways.html
shot bd-p05 $P6/zz-s-p05-methods.html
shot bd-p04-raw "$P6/p04-def-ways.html?steps=9"
shot bd-p05-raw "$P6/p05-methods.html?steps=9"
kill $SRV 2>/dev/null
PID=$(netstat -ano | grep 7196 | grep LISTEN | awk '{print $5}' | head -1)
[ -n "$PID" ] && taskkill //PID $PID //F 2>/dev/null
rm -f $P6/zz-s-p04-def-ways.html $P6/zz-s-p05-methods.html
echo DONE
