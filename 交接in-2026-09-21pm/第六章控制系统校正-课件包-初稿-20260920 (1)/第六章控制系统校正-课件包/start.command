#!/bin/bash
# 自动控制理论课件播放器 — macOS 双击启动脚本
cd "$(dirname "$0")"
echo "正在启动 自动控制理论课件播放器 ..."
echo "启动后会自动打开浏览器；关闭本窗口即可退出。"
if command -v node >/dev/null 2>&1; then
  ( sleep 2; open "http://127.0.0.1:7100/" ) &
  node server.js --port 7100
elif command -v python3 >/dev/null 2>&1; then
  ( sleep 2; open "http://127.0.0.1:7100/player/index.html" ) &
  python3 -m http.server 7100
else
  echo "未找到 node 或 python3，请先安装其中之一（macOS 自带 python3）。"
  read -n 1 -s -r -p "按任意键退出..."
fi
