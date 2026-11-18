自动控制理论 HTML 课件 — 播放说明（V3.1）

【内容】
本版本包含第一至第八章，共 468 页：
第一章 35 页；第二章 51 页；第三章 85 页；第四章 95 页；
第五章 60 页；第六章 53 页；第七章 56 页；第八章 33 页。

【Windows 快速播放】
1. 解压章节压缩包到任意目录。
2. 双击 start.bat：自动选择 Node.js 或 Python 启动本地服务器并打开浏览器。

【macOS / Linux】
macOS 双击 start.command；Linux 执行 bash start.sh。
若 macOS 首次拦截 start.command，在终端进入解压目录后执行：
chmod +x start.command && ./start.command

也可手动执行：node server.js --port 7100
然后访问 http://127.0.0.1:7100/ 。

【播放器操作】
←/→/↑/↓、PgUp/PgDn、Space = 上一步/下一步，步尽后自动翻页。
底栏「上一页/下一页」直接翻页；「上一步/下一步」优先控制动画。
N = 页面导航；F = 全屏；R = 重置本页；Esc = 退出全屏或导航。

【注意】
请勿直接双击 player/index.html 以 file:// 打开，浏览器会拦截本地 JSON 读取。
公式、字体、图片和交互脚本均随包提供，可离线使用。
网页部署版为纯静态站点，请保持目录结构上传并通过 HTTP(S) 访问。
