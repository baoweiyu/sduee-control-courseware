#!/bin/bash
# 第五章 61 页截图脚本（只读审查，不修改 lessons/）
cd /h/D_tools/courseware-system-kimi
mkdir -p qa/review-shots

# 清理旧服务
OLDPID=$(netstat -ano | grep 7191 | grep LISTEN | awk '{print $5}' | head -1)
[ -n "$OLDPID" ] && taskkill //PID $OLDPID //F 2>/dev/null

node server.js --port 7191 >/dev/null 2>&1 &
SRV=$!
sleep 3

CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"

files=(
p01-cover.html p02-schedule.html p03-part1-cover.html p04-intro.html p05-ex-derive.html
p06-ex-table.html p07-intro-anim.html p08-perf-link.html p09-equation.html p10-ex51-complex.html
p11-ex51-real.html p12-quiz1.html p13-sec52-cover.html p14-rule1-symmetry.html p15-rule2-endpoints.html
p16-rule3.html p17-ex53-system.html p18-ex53-circle-proof.html p19-rule4-asymptote.html p20-asym-dual.html
p21-rule5-breakaway.html p22-ex53-breakaway.html p23-ex53-circle.html p24-rule6-angles.html p25-departure-example.html
p26-rule7-crossing.html p27-rules-table.html p28-quiz2.html p29-ex54-calc-full.html p30-ex54-anim.html
p31-ex52-analysis.html p32-ex52-full.html p33-ex57-finale.html p34-part3-cover.html p35-general-idea.html
p36-ex58a-equiv.html p37-ex58b-anim.html p38-ex59-family.html p39-zero-a.html p40-zero-b.html
p41-ex510a-analyze.html p42-ex510b-dual-anim.html p43-nonmin-phase.html p44-ex511-classify.html p45-ex511-dual-anim.html
p46-cond-stable-concept.html p47-ex512-cond-stable.html p48-part4-cover.html p49-closed-zero-gain.html p50-trial-method.html
p51-ex513a-zeta.html p52-ex513b-phi.html p53-pole-effects.html p54-dipole.html p55-ex514a-two-systems.html
p56-ex514b-response-anim.html p57-ex515-dominant.html p58-ex516-zero-move-anim.html p59-three-rules.html p60-summary-quiz3.html
p61-quiz3.html
)

for f in "${files[@]}"; do
  num=$(echo "$f" | sed -E 's/p([0-9]+).*/\1/')
  "$CHROME" --headless=new --disable-gpu --window-size=1600,900 --virtual-time-budget=9000 \
    --screenshot="H:\\D_tools\\courseware-system-kimi\\qa\\review-shots\\ch5-${num}.png" \
    "http://localhost:7191/lessons/lesson05-root-locus/pages/${f}?cb=1" >/dev/null 2>&1
  echo "shot $num"
done

kill $SRV 2>/dev/null
PID=$(netstat -ano | grep 7191 | grep LISTEN | awk '{print $5}' | head -1)
[ -n "$PID" ] && taskkill //PID $PID //F
echo "DONE"
