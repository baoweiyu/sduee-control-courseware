# -*- coding: utf-8 -*-
"""Build the V3.0 release: eight standalone chapter players and one full static site."""
from pathlib import Path
import hashlib
import json
import re
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
VERSION = "v3.0"
VERSION_LABEL = "V3.0"
DATE = "2026-11-18"
LOCAL_ARCHIVE = ROOT / "版本迭代-本地播放用"
WEB_ARCHIVE = ROOT / "版本迭代-服务器部署用"

LESSONS = [
    ("lesson01-intro", "Ch1", "ch1-绪论", "第一章 绪论", "自动控制基本概念、开环/闭环/复合控制、控制理论发展史"),
    ("lesson02-math-model", "Ch2", "ch2-数学模型", "第二章 控制系统的数学模型", "微分方程、传递函数、方框图化简、信号流图与梅逊公式"),
    ("lesson03-timedomain", "Ch3", "ch3-时域分析", "第三章 时域分析法", "一阶/二阶系统响应、性能指标、劳斯判据与稳态误差"),
    ("lesson04-freq", "Ch4", "ch4-频率响应", "第四章 频率响应法", "频率特性、Bode 图、Nyquist 判据、稳定裕度与频域指标"),
    ("lesson05-root-locus", "Ch5", "ch5-根轨迹法", "第五章 根轨迹法", "根轨迹绘制规则、广义根轨迹与根轨迹分析"),
    ("lesson06-correction", "Ch6", "ch6-系统校正", "第六章 控制系统的校正", "校正装置、频率法串联校正、局部反馈与复合校正"),
    ("lesson07-discrete", "Ch7", "ch7-离散控制系统", "第七章 离散控制系统", "采样与保持、z 变换、脉冲传递函数、稳定性与稳态误差"),
    ("lesson08-nonlinear", "Ch8", "ch8-非线性系统", "第八章 非线性系统分析", "非线性特征、典型非线性环节、描述函数与自激振荡分析"),
]

COMMON_DIRS = ["player", "components", "theme"]
COMMON_FILES = ["server.js", "start.bat", "start.command", "start.sh", "package.json", "favicon.ico"]
ASSET_RE = re.compile(r"assets/(?:image2|legacy)/[^\"'\)\s>]+")
SKIP_NAMES = {"image2_config.json", "generate.py", "封面配图提示词.md"}
GENERATED_IMAGES = [
    "lessons/lesson07-discrete/img/p01-cover.png",
    "lessons/lesson07-discrete/img/p03-sec71.png",
    "lessons/lesson07-discrete/img/p13-sec73.png",
    "lessons/lesson07-discrete/img/p33-sec75.png",
    "lessons/lesson07-discrete/img/p46-sec77.png",
    "lessons/lesson08-nonlinear/img/p01-cover.png",
    "lessons/lesson08-nonlinear/img/p03-sec81.png",
    "lessons/lesson08-nonlinear/img/p15-sec83.png",
]

INDEX_HTML = """<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>自动控制理论 · 交互课件</title>
<style>body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;font-family:"Microsoft YaHei",system-ui,sans-serif;background:#F4F6FB;color:#12266E}.box{text-align:center}.t{font-size:28px;font-weight:700;margin-bottom:14px}.s{color:#5B6B8C;margin-bottom:26px}a{color:#2B5CE6;text-decoration:none;font-size:18px}</style></head>
<body><div class="box"><div class="t">《自动控制理论》交互课件</div><div class="s">正在进入播放器…</div><a href="player/">若未自动跳转，请点击这里</a></div>
<script>location.replace("player/"+location.search+location.hash);</script></body></html>"""

README_TMPL = """自动控制理论 HTML 课件 — {title} 独立播放包
版本：{version}（2026-11-18）

【快速播放】
Windows：解压后双击 start.bat。
macOS：解压后双击 start.command；如被拦截，在终端执行 chmod +x start.command && ./start.command。
Linux：在解压目录执行 bash start.sh。
也可手动执行 node server.js --port 7100，然后访问 http://127.0.0.1:7100/。

【播放器操作】
底部「上一页/下一页」直接翻页；「上一步/下一步」先推进或回退动画，步尽后翻页。
←/→/↑/↓、PgUp/PgDn、Space = 上一步/下一步，兼容常见翻页笔。
N = 页面导航；F = 全屏；R = 重置本页；Esc = 退出全屏或导航。

【本包内容】
{title}，共 {pages} 页。
{desc}
公式使用本地 MathJax/STIX2 资源，插图与交互脚本均随包提供，可离线使用。
请勿直接以 file:// 双击 player/index.html，必须通过上述本地服务器访问。
"""

DEPLOY_MD = """# 《自动控制理论》交互课件 — Web 部署说明

版本：V3.0（2026-11-18）。本地播放版与网页部署版版本号一致。

本包为纯静态站点，含八章共 468 页：35 / 51 / 85 / 95 / 60 / 53 / 56 / 33 页。
V3.0 新增第七章离散控制系统、第八章非线性系统分析，完成理论、视觉与交互审查，融合 8 张新生成配图；修复第七、八章章节标识字段导致的导航空白，并增加章节异步切换防竞争与失败兜底。

## 部署
保持目录结构上传至任意静态托管、Nginx、Apache、对象存储或 GitHub Pages。
入口为根目录 index.html，也可直接访问 player/。必须通过 http(s) 访问，不能使用 file://。
可选本地验证：node server.js --port 7100，或 python3 -m http.server 7100。

## 直达方式
`/?lesson=<章节id>&p=<页码>`，页码从 1 开始。
章节 id：lesson01-intro、lesson02-math-model、lesson03-timedomain、lesson04-freq、lesson05-root-locus、lesson06-correction、lesson07-discrete、lesson08-nonlinear。

## 操作
方向键、PgUp/PgDn、Space = 上一步/下一步（步尽自动翻页）；底栏上一页/下一页直接翻页；N 页面导航；F 全屏；R 重置。

## 运维
html/json 建议短缓存或 no-cache；图片与本地数学字体可配置长缓存。
更新时须同步覆盖 pages、lesson.json、lessons/index.json 和新增资源。
"""


def arc(path):
    return Path(path).as_posix()


def allowed(path):
    rel = path.relative_to(ROOT)
    return not (
        path.name in SKIP_NAMES
        or path.suffix == ".pyc"
        or "__pycache__" in rel.parts
        or "prompts" in rel.parts
        or any(part.endswith((".bak", ".tmp")) for part in rel.parts)
    )


def files_under(relative):
    base = ROOT / relative
    return sorted(p for p in base.rglob("*") if p.is_file() and allowed(p))


def collect_assets(scan_dirs):
    found = set()
    for directory in scan_dirs:
        for path in files_under(directory):
            if path.suffix.lower() not in {".html", ".css", ".js", ".json"}:
                continue
            text = path.read_text(encoding="utf-8")
            found.update(match.replace("\\", "/") for match in ASSET_RE.findall(text))
    return found


def add_file(z, path, archive_name=None):
    path = Path(path)
    z.write(path, archive_name or arc(path.relative_to(ROOT)))


def check_zip(path, required):
    with zipfile.ZipFile(path) as z:
        names = set(z.namelist())
        bad = [n for n in names if "\\" in n]
        leaks = [n for n in names if any(x in n.lower() for x in ("image2_config", "generate.py", "prompts/", ".env"))]
        missing = [n for n in required if n not in names]
        if bad or leaks or missing:
            raise RuntimeError(f"{path.name}: backslash={bad}, leaks={leaks}, missing={missing}")
        test = z.testzip()
        if test:
            raise RuntimeError(f"{path.name}: corrupt member {test}")
    print(f"OK {path.name}: {path.stat().st_size / 1048576:.1f} MiB, {len(required)} required entries checked")


def main():
    index = json.loads((ROOT / "lessons/index.json").read_text(encoding="utf-8"))
    index_by_id = {entry["lesson_id"]: entry for entry in index}
    manifests = {}
    for lesson_id, _, _, _, _ in LESSONS:
        manifest_path = ROOT / "lessons" / lesson_id / "lesson.json"
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        if manifest.get("lesson_id") != lesson_id:
            raise RuntimeError(f"Invalid lesson_id in {manifest_path}")
        for page in manifest["pages"]:
            if not (manifest_path.parent / page["file"]).is_file():
                raise FileNotFoundError(manifest_path.parent / page["file"])
        manifests[lesson_id] = manifest

    total_pages = sum(len(m["pages"]) for m in manifests.values())
    if total_pages != 468:
        raise RuntimeError(f"Expected 468 pages, found {total_pages}")

    common_assets = collect_assets(COMMON_DIRS)
    outputs = []
    for lesson_id, chapter, filename_part, title, desc in LESSONS:
        output = ROOT / f"act-courseware-{filename_part}-{VERSION}.zip"
        lesson_dir = Path("lessons") / lesson_id
        assets = sorted(common_assets | collect_assets([lesson_dir]))
        with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
            for directory in COMMON_DIRS + [lesson_dir]:
                for path in files_under(directory):
                    add_file(z, path)
            for relative in assets + COMMON_FILES:
                add_file(z, ROOT / relative)
            entry = index_by_id[lesson_id]
            z.writestr("lessons/index.json", json.dumps([entry], ensure_ascii=False, indent=2))
            z.writestr("README-播放说明.txt", README_TMPL.format(
                title=title, version=VERSION_LABEL, pages=len(manifests[lesson_id]["pages"]), desc=desc))
        required = [
            "player/index.html", "lessons/index.json", arc(lesson_dir / "lesson.json"),
            "server.js", "start.bat", "start.command", "start.sh", "README-播放说明.txt",
        ] + assets + [arc(lesson_dir / p["file"]) for p in manifests[lesson_id]["pages"]]
        check_zip(output, required)
        archive = LOCAL_ARCHIVE / f"{DATE}-{chapter}-{VERSION_LABEL}"
        archive.mkdir(parents=True, exist_ok=True)
        shutil.copy2(output, archive / output.name)
        outputs.append(output)

    web_output = ROOT / f"act-courseware-web-deploy-{VERSION}.zip"
    lesson_dirs = [Path("lessons") / item[0] for item in LESSONS]
    assets = sorted(common_assets | set().union(*(collect_assets([d]) for d in lesson_dirs)))
    with zipfile.ZipFile(web_output, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        z.writestr("index.html", INDEX_HTML)
        z.writestr("DEPLOY-部署说明.md", DEPLOY_MD)
        for directory in COMMON_DIRS + lesson_dirs:
            for path in files_under(directory):
                add_file(z, path)
        selected_index = [index_by_id[item[0]] for item in LESSONS]
        z.writestr("lessons/index.json", json.dumps(selected_index, ensure_ascii=False, indent=2))
        for relative in assets:
            add_file(z, ROOT / relative)
        add_file(z, ROOT / "server.js")
        add_file(z, ROOT / "favicon.ico")

    required = [
        "index.html", "DEPLOY-部署说明.md", "player/index.html", "lessons/index.json",
        "theme/theme.css", "server.js", "favicon.ico",
    ] + assets + GENERATED_IMAGES
    for lesson_id, _, _, _, _ in LESSONS:
        required.append(f"lessons/{lesson_id}/lesson.json")
        required.extend(f"lessons/{lesson_id}/{p['file']}" for p in manifests[lesson_id]["pages"])
    check_zip(web_output, required)
    with zipfile.ZipFile(web_output) as z:
        packed_index = json.loads(z.read("lessons/index.json").decode("utf-8"))
        if len(packed_index) != 8:
            raise RuntimeError("Web package does not contain all eight chapters")
        for relative in GENERATED_IMAGES:
            if hashlib.sha256(z.read(relative)).digest() != hashlib.sha256((ROOT / relative).read_bytes()).digest():
                raise RuntimeError(f"Image hash mismatch in web package: {relative}")
    web_archive = WEB_ARCHIVE / f"{DATE}-Ch1-Ch8-{VERSION_LABEL}"
    web_archive.mkdir(parents=True, exist_ok=True)
    shutil.copy2(web_output, web_archive / web_output.name)
    outputs.append(web_output)

    print(f"V3.0 BUILD COMPLETE: {len(outputs)} archives, 8 chapters, {total_pages} pages")
    for output in outputs:
        print(output)


if __name__ == "__main__":
    main()
