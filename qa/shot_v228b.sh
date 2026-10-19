#!/bin/bash
# 补截：去步进态的 P58/P74 + 修头后的 P71 + 扩展页/日程/衔接页
cd /h/D_tools/courseware-system-kimi
P=lessons/lesson04-freq/pages
OUT="H:\\D_tools\\courseware-system-kimi\\qa\\lesson04-freq-qa\\png"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"

sed 's/ data-step="[0-9]*"//g' $P/p58-alg-to-freq.html > $P/zz-qa-p58all.html
sed 's/ data-step="[0-9]*"//g' $P/p74-margin-intro.html > $P/zz-qa-p74all.html

node server.js --port 7199 >/dev/null 2>&1 &
SRV=$!
sleep 2

shot() {
  "$CHROME" --headless=new --disable-gpu --window-size=1600,900 --virtual-time-budget=9000 \
    --screenshot="$OUT\\$1.png" "http://localhost:7199/lessons/lesson04-freq/pages/$2" >/dev/null 2>&1
  echo "$1: $?"
}

shot v228-p58-all zz-qa-p58all.html
shot v228-p74-all zz-qa-p74all.html
shot v228-p71b p71-ex412.html

rm -f $P/zz-qa-*.html
kill $SRV 2>/dev/null
sleep 1
echo DONE
