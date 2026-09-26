# -*- coding: utf-8 -*-
"""按章拆分打包：每章一个独立可部署 zip。
每包含：player/ components/ theme/ server.js 启动脚本 本章 lessons 目录、
裁剪版 lessons/index.json（仅本章）、本章实际引用的 assets 文件、按章 README。
安全：仅收被页面引用的 assets 文件，天然排除 image2_config.json / generate.py / prompts/。
"""
import os, re, json, zipfile

ROOT = r"H:\D_tools\courseware-system-kimi"

LESSONS = [
    {"id": "lesson01-intro",      "zip": "act-courseware-ch1-绪论-v2.23.zip",
     "title": "第一章 绪论",
     "desc": "先导概述、开环/闭环/复合控制、系统组成与分类、基本要求（稳·快·准）、课程地图；含 2 页课堂互动题。2026-09-13 起含全局主题更新（结论条贴近页脚不再遮挡内容、小视口舞台居中不裁底），章节内容未变；2026-09-21 起统一版本号 V2.21；2026-09-23 统一版本号 V2.22；2026-09-27 统一版本号 V2.23。"},
    {"id": "lesson02-math-model", "zip": "act-courseware-ch2-数学模型-v2.23.zip",
     "title": "第二章 控制系统的数学模型",
     "desc": "微分方程、拉氏变换、传递函数、方框图等效化简、信号流图、梅逊公式；含方框图化简、方框图↔信号流图转换、梅逊公式数回路三个重点交互动画页，另有 4 页课堂互动题。历史修复：信号流图支路箭头统一画在传输线中点（P40-P47）；2026-09-13 起含全局主题更新，章节内容未变；2026-09-21 起统一版本号 V2.21；2026-09-23 统一版本号 V2.22；2026-09-27 统一版本号 V2.23。"},
    {"id": "lesson03-timedomain", "zip": "act-courseware-ch3-时域分析-v2.23.zip",
     "title": "第三章 时域分析法",
     "desc": "典型输入与性能指标、一阶/二阶系统响应、劳斯判据与稳定性、稳态误差；含二阶系统参数-特征根-响应曲线联动等重点交互动画。V2.17（2026-09-14）：P6 抛物线按解析式精确绘制、特征点落在线上、图内公式改 MathJax；P14 稳态误差定义换行修复、指标徽章补峰值时间 tp；P25 求根公式补 ζ≥1 适用条件；P27-30 四种阻尼响应页左上卡统一为 C(s)→极点→h(t)→备注顺序并补全 C(s) 表达式。V2.20（2026-09-20）：P36 互动实验改为左右等大双图版式（滑块移至顶部、指标读数嵌入响应曲线空白处），修复拖动 ωn 极点不动的缺陷（极点平面改固定比例尺）；P39 系统结构图放大并改规范分式；P51/52/54/60/66/72/77/79 八页留白填充与字号放大。V2.22（2026-09-23）：P51 左上文字排版（「区分」不再断行）；P52 齐次微分方程公式溢出下边框修复；P54 左框下部留白填充；P69/P71 框图前向通道右移、E(s) 完整显示；P77 底部两条记忆规律改竖排两行；P78 两张传递函数框图放大；P85 可行区域图 60° 角弧方向修正。历史修复：SVG 图内文字统一 STIX2 公式字体、标注避线与字号放大、箭头方向修正、mk() parent 缺陷修复（Astra 修复版融入）；2026-09-13 起含全局主题更新。"},
    {"id": "lesson04-freq",       "zip": "act-courseware-ch4-频率响应-v2.23.zip",
     "title": "第四章 频率响应法",
     "desc": "频率特性与极坐标图、对数坐标图（Bode）、映射原理与 Nyquist 判据、稳定裕度、等 M/等 N 圆、Nichols 图、三频段理论、频域指标与时域指标关系；含 s 域→F(s) 域映射联动动画、典型环节极坐标图逐点绘制动画、等 M 圆滑块实验、ζ 联动实验、三频段高亮等交互动画。V2.14（2026-09-13 融合外部精修版）：全 87 页终审修复——图内有效字号全章 ≥14px、P25/P41 改 2×4 分组切换、P43-46/P55-60 样板版式统一、映射动画轨迹紧贴端点、结论条位置全局下移、小视口舞台居中修复等。V2.23（2026-09-27）：P8 定义框删繁就简（仅保留频率响应文字定义）；P12 例4-2 联立式修正为 ωn²−1=2ζωn；P22 三图图注排版修复；P25 二阶微分极坐标图改为正确的左开口抛物线；原 P26-28 重排为四页（相量几何例题→绘制三步法→起点终点确定→例4-4练习），起终点图全部重绘并补 ν=3 与 n−m=4 情形，全章 87→88 页。"},
    {"id": "lesson05-root-locus", "zip": "act-courseware-ch5-根轨迹法-v2.23.zip",
     "title": "第五章 根轨迹法",
     "desc": "根轨迹基本概念、绘制规则七条、广义根轨迹（参数根轨迹/零度根轨迹）、根轨迹分析方法（条件稳定、主导极点、偶极子、零点影响）；61 页，全部根轨迹由数值计算严谨绘制，含连贯生长动画 + 分步演示 + 图面缩放，以及 3 页课堂互动题。V2.19：四轮细调版（13 页精修、四个部分封面补全主题配图）；2026-09-21 起统一版本号 V2.21；2026-09-23 统一版本号 V2.22；2026-09-27 统一版本号 V2.23。"},
    {"id": "lesson06-correction", "zip": "act-courseware-ch6-系统校正-v2.23.zip",
     "title": "第六章 控制系统的校正",
     "desc": "校正概念与方式、常用校正装置（超前/滞后/滞后-超前/PID）、频率法串联校正（三频段理论、超前 6 步与滞后 6 步设计及完整例题）、局部反馈校正、复合校正（按输入/按扰动补偿）；48 页，全部 Bode 图数值严谨绘制，含超前网络 α 联动、设计步骤分步演示等交互动画，另有 2 页课堂互动题。V2.21（2026-09-21）：首次发布（一轮修改版，41 页精修 + 四个部分封面配图）；2026-09-23 统一版本号 V2.22；2026-09-27 统一版本号 V2.23。"},
]

ONLY = os.environ.get("PACK_ONLY", "").strip()  # 只打某一章：set PACK_ONLY=lesson04-freq

COMMON_DIRS = ["player", "components", "theme"]
COMMON_FILES = ["server.js", "start.bat", "start.command", "start.sh", "package.json"]
ASSET_RE = re.compile(r"assets/(?:image2|legacy)/[^\"'\)\s>]+")

def arc(rel):
    """zip 条目名统一用正斜杠（Windows 反斜杠会让 macOS 解压失败）"""
    return rel.replace("\\", "/")

README_TMPL = """自动控制理论 HTML 课件 — {title} 独立播放包

【Windows 快速播放】
1. 解压本压缩包到任意目录（路径含中文一般也可以）。
2. 双击 start.bat：
   - 若电脑装有 Node.js：自动启动 server.js 并打开浏览器；
   - 若没有 Node.js 而有 Python：自动用 python -m http.server 打开。

【macOS 快速播放】
1. 解压本压缩包到任意目录。
2. 双击 start.command（自动选 Node.js 或系统自带 python3，并打开浏览器）。
3. 若首次双击被系统拦截：在「终端」进入本目录执行一次
     chmod +x start.command && ./start.command
   或在 start.command 上点右键 →「打开」→ 确认。
4. 也可手动：终端进入本目录后执行
     node server.js --port 7100     或     python3 -m http.server 7100
   然后浏览器访问 http://127.0.0.1:7100/
   （python3 方式请访问 http://127.0.0.1:7100/player/index.html ）。

【Linux 播放】
终端进入本目录，执行 bash start.sh，或参照上面 macOS 的手动命令。

【播放器操作】（V2.16 起）
  底部按钮：‹上一页 ｜ ‹上一步 ｜ 下一步› ｜ 下一页›。
  「上一步/下一步」：页面含动画时逐步回退/推进动画，步尽后自动翻页；
  页面无动画时等同「上一页/下一页」。
  「上一页/下一页」：永远直接翻页。
  键盘与翻页笔：←/→/↑/↓/PgUp/PgDn/Space 全部 = 上一步/下一步
  （翻页笔两种常见映射均可，按一下=进一步，步尽自动翻页）；
  N 页面导航；F 全屏；R 重置本页；Esc 退出全屏/导航。
右上角「导航」显示每页编号与内容关键词，可跳转，也可返回当前页。

【注意】
- 不要直接双击 player/index.html 用 file:// 打开（浏览器会拦截本地 JSON
  读取），必须通过上面的本地服务器方式访问。
- 数学公式字体（STIX2）与插图均已内嵌，离线可用；
  Windows / macOS / Linux 显示效果一致。
- 本包内容：{title}（{pages} 页）：{desc}
- 课堂互动题统一为：先显示全部选项，按键后高亮正确答案并给出解释。
- 公式采用 MathJax + STIX2 数学字体渲染，方框图相加点统一为「圆圈内 × 叉」。
"""

def collect_assets(scan_dirs):
    """扫描给定目录下所有文本文件，返回引用到的 assets 相对路径集合"""
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

# 公共资源（player/components/theme）引用的 assets 每个包都要带
common_assets = collect_assets(COMMON_DIRS)

for les in LESSONS:
    lid = les["id"]
    if ONLY and lid != ONLY:
        continue
    out = os.path.join(ROOT, les["zip"])
    les_dir = os.path.join("lessons", lid)

    # 本章页面引用的 assets + 公共 assets
    assets = sorted(collect_assets([les_dir]) | common_assets)

    # 校验引用的 assets 源文件都存在
    missing = [a for a in assets if not os.path.isfile(os.path.join(ROOT, a))]
    if missing:
        print("!! %s 引用但源文件缺失: %s" % (lid, missing))

    with open(os.path.join(ROOT, les_dir, "lesson.json"), encoding="utf-8") as f:
        n_pages = len(json.load(f)["pages"])

    count = 0
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for d in COMMON_DIRS + [les_dir]:
            for dirpath, _, filenames in os.walk(os.path.join(ROOT, d)):
                for fn in filenames:
                    full = os.path.join(dirpath, fn)
                    z.write(full, arc(os.path.relpath(full, ROOT)))
                    count += 1
        for a in assets:
            z.write(os.path.join(ROOT, a), arc(a))
            count += 1
        for fn in COMMON_FILES:
            z.write(os.path.join(ROOT, fn), fn)
            count += 1
        # 裁剪版章节索引：仅本章，播放器下拉框不会列出缺失章节
        z.writestr("lessons/index.json", json.dumps(
            [{"lesson_id": lid, "path": lid + "/lesson.json", "title": les["title"].replace("（初稿）", "")}],
            ensure_ascii=False, indent=2))
        z.writestr("README-播放说明.txt", README_TMPL.format(
            title=les["title"], pages=n_pages, desc=les["desc"]))
        count += 2

    size = os.path.getsize(out)
    # 校验：包内必备项 + 无密钥文件
    with zipfile.ZipFile(out) as z:
        names = set(z.namelist())
    must = ["player/index.html", "lessons/index.json", arc(les_dir) + "/lesson.json",
            "server.js", "start.bat", "start.command", "start.sh", "README-播放说明.txt"] + [arc(a) for a in assets]
    lack = [m for m in must if m not in names]
    leak = [n for n in names if "image2_config" in n or n.endswith("generate.py") or "prompts/" in n]
    backslash = [n for n in names if "\\" in n]
    print("%s: files=%d pages=%d assets=%d size=%.1fMB | lack=%s | leak=%s | 反斜杠条目=%s"
          % (les["zip"], count, n_pages, len(assets), size / 1048576, lack or "无", leak or "无", backslash or "无"))
