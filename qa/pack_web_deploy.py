# -*- coding: utf-8 -*-
"""Web 部署源码包：纯静态、全相对路径，任何静态托管可直接部署。
内容：根入口 index.html（自动转 player/，透传 ?lesson&p 参数）+ player/ lessons/ theme/
components/ + 实际引用的 assets + DEPLOY-部署说明.md + 可选 server.js。
安全：按引用收集 assets，天然排除 image2_config.json / generate.py / prompts/。
"""
import os, re, json, zipfile

ROOT = r"H:\D_tools\courseware-system-kimi"
OUT = os.path.join(ROOT, "act-courseware-web-deploy-v2.18.zip")

COMMON_DIRS = ["player", "components", "theme"]
LESSON_IDS = ["lesson01-intro", "lesson02-math-model", "lesson03-timedomain", "lesson04-freq", "lesson05-root-locus"]
ASSET_RE = re.compile(r"assets/(?:image2|legacy)/[^\"'\)\s>]+")

def arc(rel):
    return rel.replace("\\", "/")

INDEX_HTML = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>自动控制理论 · 交互课件</title>
<style>
  body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;
       font-family:"Microsoft YaHei",system-ui,sans-serif;background:#F4F6FB;color:#12266E}
  .box{text-align:center}
  .t{font-size:28px;font-weight:700;margin-bottom:14px}
  .s{color:#5B6B8C;margin-bottom:26px}
  a{color:#2B5CE6;text-decoration:none;font-size:18px}
</style>
</head>
<body>
<div class="box">
  <div class="t">《自动控制理论》交互课件</div>
  <div class="s">正在进入播放器…</div>
  <a id="go" href="player/">若未自动跳转，请点击这里</a>
</div>
<script>
  // 透传直达参数：?lesson=<章节id>&p=<页码>
  location.replace("player/" + location.search + location.hash);
</script>
</body>
</html>
"""

DEPLOY_MD = """# 《自动控制理论》交互课件 — Web 部署说明

## 源码仓库与版本
源码托管于 GitHub（公开仓库）：
https://github.com/baoweiyu/sduee-control-courseware
各版本打包下载（本地播放版五章包 + 本网页部署版）见 Releases：
https://github.com/baoweiyu/sduee-control-courseware/releases

## 这是什么
纯静态 HTML 课件站点（无后端、无数据库、无构建步骤），内含第一~五章共 319 页：
- 第一章 绪论（35 页）
- 第二章 控制系统的数学模型（51 页）
- 第三章 时域分析法（85 页）
- 第四章 频率响应法（87 页，含外部精修终审全部修复）
- 第五章 根轨迹法（61 页，数值严谨绘制 + 连贯/分步动画 + 图面缩放）

整体版本 V2.18（2026-09-19）。本地播放版与网页部署版使用同一版本号。
V2.18 更新：第五章《根轨迹法》首次发布（61 页）；
前四章内容未变，随第五章主题更新统一版本号。
V2.17 更新（第三章 6 页修复）：P6 抛物线按解析式精确绘制、特征点落在线上、
图内公式改 MathJax；P14 稳态误差定义换行修复、指标徽章补峰值时间 tp；
P25 求根公式补 ζ≥1 适用条件；P27-30 四种阻尼响应页左上卡统一为
C(s)→极点→h(t)→备注顺序并补全 C(s) 表达式。
V2.16 更新：①全部页面 theme.css/act-base.js 引用加版本号缓存破坏（杜绝旧版
浏览器缓存 CSS 导致的"结论条太靠上遮盖"假象）；②翻页笔/方向键/PgUp/PgDn/Space
统一为上一步/下一步（步尽自动翻页），底栏「上一页/下一页」保持直接翻页。

技术形态：MathJax（本地 STIX2 字体）渲染公式 + SVG/JS 交互与动画 + image2 生成配图。
所有资源均为相对路径，可部署在域名根目录或任意子目录（如 example.com/course/）。

## 部署要求（唯一硬性条件）
**必须通过 http(s):// 访问**。播放器用 fetch 读取 lessons/*.json，file:// 双击打开会被浏览器拦截。
除此之外无任何要求：不需要 Node、不需要数据库、不需要服务端渲染。

## 部署方式（任选其一）
1. **任意静态托管 / 虚拟主机 / Nginx / Apache / 对象存储(OSS·COS)+CDN / GitHub Pages / Vercel / Netlify**：
   保持目录结构原样上传全部文件即可，站点入口就是根目录的 index.html。
2. **Node 服务器（可选）**：`node server.js --port 7100`（server.js 为静态文件服务器，非必需）。
3. **临时本地验证**：`python3 -m http.server 7100` 后访问 http://127.0.0.1:7100/ 。

## 访问与直达链接
- 首页：`/`（自动进入播放器）或直接 `/player/`
- 直达某章某页：`/?lesson=<章节id>&p=<页码>`（页码从 1 开始），例如：
  - 第一章第 1 页：`/?lesson=lesson01-intro&p=1`
  - 第四章第 56 页：`/?lesson=lesson04-freq&p=56`
- 章节 id：lesson01-intro / lesson02-math-model / lesson03-timedomain / lesson04-freq / lesson05-root-locus
- 播放器操作：←/→/↑/↓/PgUp/PgDn/Space = 上一步/下一步（步尽自动翻页，无动画页等同翻页，翻页笔两种映射均可）；底栏「上一页/下一页」直接翻页；F 全屏；R 重置本页；右上角「导航」按页码+关键词跳转。

## 目录结构（请勿重命名/移动任何目录）
```
index.html          根入口（自动转 player/，透传查询参数）
player/             播放器（index.html）
lessons/            五章页面与数据（index.json + <章节>/lesson.json + pages/*.html）
theme/              主题 CSS + act-base.js + 本地 MathJax 库（theme/mathjax/ 必须完整保留）
components/         公共组件
assets/             页面实际引用的图片（image2 生成图 + 原始素材提取图）
server.js           可选的 Node 静态服务器（非必需）
```

## 运维建议
- assets/ 图片与 theme/mathjax/ 字体可配长缓存（如 30 天）；html/json 配短缓存或 no-cache，
  便于后续课件更新版本即时生效。
- 首次打开只加载播放器与当前页资源，图片按页懒加载，无需担心整包体积影响首屏。
- 后续课件更新：由制作方给出新版静态文件，整体覆盖同名文件即可（pages/lesson.json/assets
  均按文件覆盖；如页面总数变化，lesson.json 必须同步覆盖）。
"""

def collect_assets(scan_dirs):
    found = set()
    for d in scan_dirs:
        base = os.path.join(ROOT, d)
        for dirpath, _, filenames in os.walk(base):
            for fn in filenames:
                if not fn.lower().endswith((".html", ".css", ".js", ".json")):
                    continue
                try:
                    with open(os.path.join(dirpath, fn), encoding="utf-8") as f:
                        found.update(m.replace("\\", "/") for m in ASSET_RE.findall(f.read()))
                except UnicodeDecodeError:
                    pass
    return found

common_assets = collect_assets(COMMON_DIRS)
all_assets = set(common_assets)
for lid in LESSON_IDS:
    all_assets |= collect_assets([os.path.join("lessons", lid)])
assets = sorted(all_assets)

missing = [a for a in assets if not os.path.isfile(os.path.join(ROOT, a))]
if missing:
    print("!! 引用但源文件缺失:", missing)

# 校验五章 lesson.json
n_pages = {}
for lid in LESSON_IDS:
    with open(os.path.join(ROOT, "lessons", lid, "lesson.json"), encoding="utf-8") as f:
        n_pages[lid] = len(json.load(f)["pages"])

count = 0
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    z.writestr("index.html", INDEX_HTML)
    z.writestr("DEPLOY-部署说明.md", DEPLOY_MD)
    count += 2
    for d in COMMON_DIRS + [os.path.join("lessons", l) for l in LESSON_IDS]:
        for dirpath, _, filenames in os.walk(os.path.join(ROOT, d)):
            for fn in filenames:
                full = os.path.join(dirpath, fn)
                z.write(full, arc(os.path.relpath(full, ROOT)))
                count += 1
    # lessons/index.json：按 LESSON_IDS 过滤重写（工作区 index.json 可能含
    # 未验收章节草稿，直接打包会把缺失章节列进部署包目录，见规范第 131 条）
    with open(os.path.join(ROOT, "lessons", "index.json"), encoding="utf-8") as f:
        idx = json.load(f)
    idx = [e for e in idx if e.get("lesson_id") in LESSON_IDS]
    z.writestr("lessons/index.json", json.dumps(idx, ensure_ascii=False, indent=2))
    count += 1
    for a in assets:
        z.write(os.path.join(ROOT, a), arc(a))
        count += 1
    # 可选 Node 服务器
    z.write(os.path.join(ROOT, "server.js"), "server.js")
    count += 1

size = os.path.getsize(OUT)
with zipfile.ZipFile(OUT) as z:
    names = set(z.namelist())
must = ["index.html", "DEPLOY-部署说明.md", "player/index.html", "lessons/index.json",
        "theme/theme.css", "server.js"] + \
       [arc(os.path.join("lessons", l, "lesson.json")) for l in LESSON_IDS] + [arc(a) for a in assets]
lack = [m for m in must if m not in names]
leak = [n for n in names if "image2_config" in n or n.endswith("generate.py") or "prompts/" in n]
backslash = [n for n in names if "\\" in n]
bak = [n for n in names if ".bak-" in n]
print("pages:", n_pages)
print("%s: files=%d assets=%d size=%.1fMB | lack=%s | leak=%s | 反斜杠=%s | bak残留=%s"
      % (os.path.basename(OUT), count, len(assets), size/1048576,
         lack or "无", leak or "无", backslash or "无", bak or "无"))
