#!/bin/bash
cd /h/D_tools/courseware-system-kimi
OUT="H:\\D_tools\\courseware-system-kimi\\qa\\lesson04-freq-qa\\png"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
# 全步显副本
P6=lessons/lesson06-correction/pages
P5=lessons/lesson05-root-locus/pages
sed -e 's/ data-step="[0-9]*"//g' -e 's/{ "data-step": "[0-9]" }/{}/g' $P6/p28-ex61-alpha.html > $P6/zz-s-p28.html
sed -e 's/ data-step="[0-9]*"//g' -e 's/{ "data-step": "[0-9]" }/{}/g' $P6/p38-laglead-design.html > $P6/zz-s-p38.html
node server.js --port 7195 >/dev/null 2>&1 &
SRV=$!
sleep 2
TS=$(date +%s)
shot() { # $1=输出名 $2=页面相对路径
  "$CHROME" --headless=new --disable-gpu --window-size=1600,900 --virtual-time-budget=9000 \
    --screenshot="$OUT\\$1.png" "http://localhost:7195/$2?cb=$TS" >/dev/null 2>&1
  echo "$1: $?"
}
shot spot6-p07 lessons/lesson06-correction/pages/p07-lead-network.html
shot spot6-p09 lessons/lesson06-correction/pages/p09-phi-alpha.html
shot spot6-p28 lessons/lesson06-correction/pages/zz-s-p28.html
shot spot6-p38 lessons/lesson06-correction/pages/zz-s-p38.html
shot spot5-p28 lessons/lesson05-root-locus/pages/p28-quiz2.html
shot spot5-p05 lessons/lesson05-root-locus/pages/p05-ex-derive.html
kill $SRV 2>/dev/null
PID=$(netstat -ano | grep 7195 | grep LISTEN | awk '{print $5}' | head -1)
[ -n "$PID" ] && taskkill //PID $PID //F 2>/dev/null
rm -f $P6/zz-s-p28.html $P6/zz-s-p38.html
echo DONE
