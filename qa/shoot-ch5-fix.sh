#!/bin/bash
# 第五章修复自验截图（端口 7193；p28 用 zz 副本截 0/1/2 三个分步态，截完即删）
cd /h/D_tools/courseware-system-kimi
mkdir -p qa/review-shots
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
PAGES=lessons/lesson05-root-locus/pages

# p28 zz 副本：注入 qa-steps 钩子（与 p39 页内钩子同款）
HOOK='<script>window.addEventListener("load",()=>setTimeout(()=>{const n=+(new URLSearchParams(location.search)).get("steps")||0;if(n){document.querySelectorAll("[data-step]").forEach(e=>e.style.transition="none");for(let i=0;i<n;i++)ACT.step.next();}},350));</script>'
sed "s#</body>#${HOOK}</body>#" "$PAGES/p28-quiz2.html" > "$PAGES/zz-p28-quiz2.html"

# 清理旧服务并启动
OLDPID=$(netstat -ano | grep 7193 | grep LISTEN | awk '{print $5}' | head -1)
[ -n "$OLDPID" ] && taskkill //PID $OLDPID //F 2>/dev/null
node server.js --port 7193 >/dev/null 2>&1 &
SRV=$!
sleep 3

shot() { # url_suffix  out_name
  "$CHROME" --headless=new --disable-gpu --window-size=1600,900 --virtual-time-budget=9000 \
    --screenshot="H:\\D_tools\\courseware-system-kimi\\qa\\review-shots\\$2.png" \
    "http://localhost:7193/$1" >/dev/null 2>&1
  echo "shot $2"
}

shot "$PAGES/zz-p28-quiz2.html?cb=1&steps=0" ch5-fix-p28-s0
shot "$PAGES/zz-p28-quiz2.html?cb=1&steps=1" ch5-fix-p28-s1
shot "$PAGES/zz-p28-quiz2.html?cb=1&steps=2" ch5-fix-p28-s2
for p in p04-intro p05-ex-derive p06-ex-table p39-zero-a p49-closed-zero-gain p54-dipole p55-ex514a-two-systems p60-summary-quiz3 p61-quiz3; do
  num=$(echo "$p" | sed -E 's/p([0-9]+).*/\1/')
  shot "$PAGES/${p}.html?cb=1" "ch5-fix-p${num}"
done

rm -f "$PAGES/zz-p28-quiz2.html"
kill $SRV 2>/dev/null
PID=$(netstat -ano | grep 7193 | grep LISTEN | awk '{print $5}' | head -1)
[ -n "$PID" ] && taskkill //PID $PID //F
echo "DONE"
