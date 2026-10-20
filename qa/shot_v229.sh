#!/bin/bash
# V2.29 回归截图：第四章 14 项修改涉及页 + 5 个新页面 + 重排后关键页
cd /h/D_tools/courseware-system-kimi
P=lessons/lesson04-freq/pages
OUT="H:\\D_tools\\courseware-system-kimi\\qa\\lesson04-freq-qa\\png"
mkdir -p qa/lesson04-freq-qa/png
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"

# 临时步进态副本
sed 's/let K = 0; const TOTAL = 6;/let K = 3; const TOTAL = 6;/' $P/p45-ex45-superpose.html > $P/zz-qa-p45k3.html
sed 's/let K = 0; const TOTAL = 6;/let K = 6; const TOTAL = 6;/' $P/p45-ex45-superpose.html > $P/zz-qa-p45k6.html
sed 's/let K = 0; const TOTAL = 6;/let K = 2; const TOTAL = 6;/' $P/p46-seq-slope.html > $P/zz-qa-p46k2.html
sed 's/let K = 0; const TOTAL = 6;/let K = 6; const TOTAL = 6;/' $P/p46-seq-slope.html > $P/zz-qa-p46k6.html
sed 's/let K = 0; const TOTAL = 4;/let K = 4; const TOTAL = 4;/' $P/p72-ex410.html > $P/zz-qa-p72k4.html
sed 's/let K = 0; const TOTAL = 4;/let K = 1; const TOTAL = 4;/' $P/p75-ex412.html > $P/zz-qa-p75k1.html
sed 's/let K = 0; const TOTAL = 4;/let K = 4; const TOTAL = 4;/' $P/p75-ex412.html > $P/zz-qa-p75k4.html
sed 's/ data-step="[0-9]*"//g' $P/p76-quiz-nyquist.html > $P/zz-qa-p76ans.html
sed 's/let K = 0; const TOTAL = 4;/let K = 4; const TOTAL = 4;/' $P/p77-conditional-stab.html > $P/zz-qa-p77k4.html
sed -e 's/let K = 0; const TOTAL = 4;/let K = 4; const TOTAL = 4;/' -e 's/DEFAULT_K = 2;/DEFAULT_K = 0.5;/' -e 's/value="2"/value="0.5"/' $P/p77-conditional-stab.html > $P/zz-qa-p77k05.html

node server.js --port 7199 >/dev/null 2>&1 &
SRV=$!
sleep 2

shot() {
  "$CHROME" --headless=new --disable-gpu --window-size=1600,900 --virtual-time-budget=9000 \
    --screenshot="$OUT\\$1.png" "http://localhost:7199/lessons/lesson04-freq/pages/$2" >/dev/null 2>&1
  echo "$1: $?"
}

shot v229-p02-schedule p02-schedule.html
shot v229-p45-k3 zz-qa-p45k3.html
shot v229-p45-k6 zz-qa-p45k6.html
shot v229-p46-k2 zz-qa-p46k2.html
shot v229-p46-k6 zz-qa-p46k6.html
shot v229-p49-bodeess p49-bode-ess.html
shot v229-p50-quizka p50-quiz-ka.html
shot v229-p53-minphase-def p53-minphase-def.html
shot v229-p54-minphase-why p54-minphase-why.html
shot v229-p55-minphase-judge p55-minphase-judge.html
shot v229-p67-mapconcl p67-map-conclusion.html
shot v229-p68-opencl p68-opencl-poles.html
shot v229-p70-contour p70-nyquist-contour.html
shot v229-p72-ex410-k4 zz-qa-p72k4.html
shot v229-p74-fourstep p74-fourstep-puzzle.html
shot v229-p75-k1 zz-qa-p75k1.html
shot v229-p75-k4 zz-qa-p75k4.html
shot v229-p76-quiz p76-quiz-nyquist.html
shot v229-p76-quiz-ans zz-qa-p76ans.html
shot v229-p77-k4 zz-qa-p77k4.html
shot v229-p77-k05 zz-qa-p77k05.html

kill $SRV 2>/dev/null
# 兜底杀端口
PID=$(netstat -ano | grep 7199 | grep LISTEN | awk '{print $5}' | head -1)
[ -n "$PID" ] && taskkill //PID $PID //F 2>/dev/null
# 清理临时副本
rm -f $P/zz-qa-*.html
echo DONE
