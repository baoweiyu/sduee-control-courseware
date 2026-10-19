#!/bin/bash
# 第三轮补截：P71 纯文本头 + 去步进的扩展两页 + 日程/衔接页
cd /h/D_tools/courseware-system-kimi
P=lessons/lesson04-freq/pages
OUT="H:\\D_tools\\courseware-system-kimi\\qa\\lesson04-freq-qa\\png"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"

sed 's/ data-step="[0-9]*"//g' $P/p55-zeta-slope-proof.html > $P/zz-qa-p55all.html
sed 's/ data-step="[0-9]*"//g' $P/p56-zeta-slope-vectors.html > $P/zz-qa-p56all.html

node server.js --port 7199 >/dev/null 2>&1 &
SRV=$!
sleep 2

shot() {
  "$CHROME" --headless=new --disable-gpu --window-size=1600,900 --virtual-time-budget=9000 \
    --screenshot="$OUT\\$1.png" "http://localhost:7199/lessons/lesson04-freq/pages/$2" >/dev/null 2>&1
  echo "$1: $?"
}

shot v228-p71c p71-ex412.html
shot v228-p55-all zz-qa-p55all.html
shot v228-p56-all zz-qa-p56all.html

rm -f $P/zz-qa-*.html
kill $SRV 2>/dev/null
sleep 1
echo DONE
