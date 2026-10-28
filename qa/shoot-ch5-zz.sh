#!/bin/bash
# 复制 data-step 页面为 zz-*.html，去掉 data-step 后截全内容图，用完删除
cd /h/D_tools/courseware-system-kimi
PAGES="p04-intro p05-ex-derive p06-ex-table p08-perf-link p09-equation p10-ex51-complex p11-ex51-real p35-general-idea p36-ex58a-equiv p39-zero-a p40-zero-b p41-ex510a-analyze p43-nonmin-phase p44-ex511-classify p45-ex511-dual-anim p46-cond-stable-concept p49-closed-zero-gain p50-trial-method p51-ex513a-zeta p52-ex513b-phi p53-pole-effects p54-dipole"
cd lessons/lesson05-root-locus/pages
for p in $PAGES; do
  sed 's/ data-step="[0-9]*"//g' "$p.html" > "zz-$p.html"
done
cd /h/D_tools/courseware-system-kimi
node server.js --port 7191 >/dev/null 2>&1 &
SRV=$!
sleep 3
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
for p in $PAGES; do
  "$CHROME" --headless=new --disable-gpu --window-size=1600,900 --virtual-time-budget=9000 \
    --screenshot="H:\\D_tools\\courseware-system-kimi\\qa\\review-shots\\zz-$p.png" \
    "http://localhost:7191/lessons/lesson05-root-locus/pages/zz-$p.html?cb=1" >/dev/null 2>&1
  echo "shot zz-$p"
done
kill $SRV 2>/dev/null
PID=$(netstat -ano | grep 7191 | grep LISTEN | awk '{print $5}' | head -1)
[ -n "$PID" ] && taskkill //PID $PID //F 2>/dev/null
cd lessons/lesson05-root-locus/pages
rm -f zz-*.html
echo "DONE, zz files removed:"; ls zz-*.html 2>/dev/null | wc -l
