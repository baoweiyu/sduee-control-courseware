#!/bin/bash
# 自动控制理论课件播放器 — Linux/终端通用启动脚本
cd "$(dirname "$0")"
echo "正在启动 自动控制理论课件播放器 ..."
if command -v node >/dev/null 2>&1; then
  ( sleep 2; (command -v xdg-open >/dev/null 2>&1 && xdg-open "http://127.0.0.1:7100/") || (command -v open >/dev/null 2>&1 && open "http://127.0.0.1:7100/") ) &
  node server.js --port 7100
elif command -v python3 >/dev/null 2>&1; then
  ( sleep 2; (command -v xdg-open >/dev/null 2>&1 && xdg-open "http://127.0.0.1:7100/player/index.html") || (command -v open >/dev/null 2>&1 && open "http://127.0.0.1:7100/player/index.html") ) &
  python3 -m http.server 7100
else
  echo "未找到 node 或 python3，请先安装其中之一。"
fi
