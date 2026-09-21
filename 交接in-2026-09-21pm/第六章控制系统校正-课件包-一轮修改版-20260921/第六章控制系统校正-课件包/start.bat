@echo off
chcp 65001 >nul
cd /d %~dp0
echo 正在启动 自动控制理论课件播放器 ...
echo 启动后会自动打开浏览器；关闭本窗口即可退出。
where node >nul 2>nul
if %errorlevel%==0 (
  start "" cmd /c "node server.js --port 7100 & timeout /t 2 >nul & start http://127.0.0.1:7100/"
) else (
  where python >nul 2>nul && (
    start "" cmd /c "python -m http.server 7100 & timeout /t 2 >nul & start http://127.0.0.1:7100/player/index.html"
  ) || ( echo 未找到 node 或 python，请先安装其中之一。 & pause )
)
