#!/bin/bash
cd /h/D_tools/courseware-system-kimi
P=lessons/lesson04-freq/pages
OUT="H:\D_tools\courseware-system-kimi\qa\lesson04-freq-qa\png"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
sed 's/let K = 0; const TOTAL = 4;/let K = 4; const TOTAL = 4;/' $P/p75-ex412.html > $P/zz-qa-p75k4.html
sed 's/let K = 0; const TOTAL = 4;/let K = 2; const TOTAL = 4;/' $P/p75-ex412.html > $P/zz-qa-p75k2.html
sed 's/let K = 0; const TOTAL = 4;/let K = 1; const TOTAL = 4;/' $P/p75-ex412.html > $P/zz-qa-p75k1.html
sed 's/let K = 0; const TOTAL = 4;/let K = 4; const TOTAL = 4;/' $P/p77-conditional-stab.html > $P/zz-qa-p77k4.html
sed -e 's/let K = 0; const TOTAL = 4;/let K = 4; const TOTAL = 4;/' -e 's/DEFAULT_K = 2;/DEFAULT_K = 0.5;/' -e 's/value="2"/value="0.5"/' $P/p77-conditional-stab.html > $P/zz-qa-p77k05.html
sed -e 's/let K = 0; const TOTAL = 4;/let K = 4; const TOTAL = 4;/' -e 's/DEFAULT_K = 2;/DEFAULT_K = 4 \/ 3;/' $P/p77-conditional-stab.html > $P/zz-qa-p77kc.html
node server.js --port 7199 >/dev/null 2>&1 &
SRV=$!
sleep 2
shot() {
  "$CHROME" --headless=new --disable-gpu --window-size=1600,900 --virtual-time-budget=9000 \
    --screenshot="$OUT\\$1.png" "http://localhost:7199/lessons/lesson04-freq/pages/$2" >/dev/null 2>&1
  echo "$1: $?"
}
shot v232-p75-k1 zz-qa-p75k1.html
shot v232-p75-k2 zz-qa-p75k2.html
shot v232-p75-k4 zz-qa-p75k4.html
shot v232-p77-k4 zz-qa-p77k4.html
shot v232-p77-k05 zz-qa-p77k05.html
shot v232-p77-kc zz-qa-p77kc.html
kill $SRV 2>/dev/null
PID=$(netstat -ano | grep 7199 | grep LISTEN | awk '{print $5}' | head -1)
[ -n "$PID" ] && taskkill //PID $PID //F 2>/dev/null
rm -f $P/zz-qa-*.html
echo DONE
