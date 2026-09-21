自动控制理论 HTML 课件 — 第六章《控制系统的校正》播放包

【内容】
  第六章 控制系统的校正（页面逐批追加，当前含章封面）：
  6.1 系统的设计与校正问题
  6.2 常用校正装置及其特性
  6.3 串联校正（超前 / 滞后）
  6.4 反馈校正与复合校正
  全部 Bode 图与阶跃响应曲线由数值计算生成（qa/gen_ch6_data.py）。

【Windows 快速播放】
1. 解压本压缩包到任意目录。
2. 双击 start.bat：
   - 若电脑装有 Node.js：自动启动 server.js 并打开浏览器；
   - 若没有 Node.js 而有 Python：自动用 python -m http.server 打开。
3. 浏览器打开后即为 Course Player，选择「第六章 控制系统的校正」开始播放。

【macOS / Linux】
  双击 start.command（macOS 首次需在终端执行 chmod +x start.command），
  或终端进入本目录执行：node server.js --port 7100
  或：python3 -m http.server 7100
  浏览器访问 http://127.0.0.1:7100/（python3 方式访问
  http://127.0.0.1:7100/player/index.html ）。

【播放器操作】
  ←/→ 翻页；Space/点击 推进分步动画；F 全屏；R 重置本页；Esc 退出全屏。
  动画页提供 ▶ 播放（连贯）/ ⧉ 分步（逐段）/ ↺ 重置；
  Bode 图页支持滚轮缩放、拖拽平移、双击复位。

【直接用浏览器打开（不起服务器）】
  也可以直接双击 lessons/lesson06-correction/pages/ 下的单个 HTML 页面播放
  （部分浏览器对本地 fetch 有限制时，请使用上面的服务器方式）。
