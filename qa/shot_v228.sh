#!/bin/bash
# V2.28 回归截图：第四章修改页 + 移动后新位置页
cd /h/D_tools/courseware-system-kimi
P=lessons/lesson04-freq/pages
OUT="H:\\D_tools\\courseware-system-kimi\\qa\\lesson04-freq-qa\\png"
mkdir -p qa/lesson04-freq-qa/png
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"

# 临时步进态副本
sed 's/let K = 0; const TOTAL = 4;/let K = 4; const TOTAL = 4;/' $P/p69-ex410.html > $P/zz-qa-p69k4.html
sed 's/let K = 0; const TOTAL = 4;/let K = 2; const TOTAL = 4;/' $P/p70-ex410-concl.html > $P/zz-qa-p70k2.html
sed 's/let K = 0; const TOTAL = 4;/let K = 3; const TOTAL = 4;/' $P/p70-ex410-concl.html > $P/zz-qa-p70k3.html
sed 's/let K = 0; const TOTAL = 2;/let K = 1; const TOTAL = 2;/' $P/p75-margin-nyquist.html > $P/zz-qa-p75k1.html
sed -e 's/DEFAULT_K = 2/DEFAULT_K = 0.5/' -e 's/value="2"/value="0.5"/' $P/p73-conditional-stab.html > $P/zz-qa-p73k05.html

node server.js --port 7199 >/dev/null 2>&1 &
SRV=$!
sleep 2

shot() {
  "$CHROME" --headless=new --disable-gpu --window-size=1600,900 --virtual-time-budget=9000 \
    --screenshot="$OUT\\$1.png" "http://localhost:7199/lessons/lesson04-freq/pages/$2" >/dev/null 2>&1
  echo "$1: $?"
}

shot v228-p55-ext1 p55-zeta-slope-proof.html
shot v228-p56-ext2 p56-zeta-slope-vectors.html
shot v228-p58-algtofreq p58-alg-to-freq.html
shot v228-p65-mapconcl p65-map-conclusion.html
shot v228-p67-contour p67-nyquist-contour.html
shot v228-p69-ex410-k4 zz-qa-p69k4.html
shot v228-p70-concl-k2 zz-qa-p70k2.html
shot v228-p70-concl-k3 zz-qa-p70k3.html
shot v228-p71-ex412 p71-ex412.html
shot v228-p73-cond-k2 p73-conditional-stab.html
shot v228-p73-cond-k05 zz-qa-p73k05.html
shot v228-p74-marginintro p74-margin-intro.html
shot v228-p75-marginnyq-k1 zz-qa-p75k1.html
shot v228-p02-schedule p02-schedule.html
shot v228-p54-part2sum p54-part2-summary.html
shot v228-p77-notessum p77-notes-summary.html

rm -f $P/zz-qa-*.html
kill $SRV 2>/dev/null
sleep 1
echo DONE
