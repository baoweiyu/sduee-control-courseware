# -*- coding: utf-8 -*-
"""Publish a versioned release: source commit, git tag, GitHub Release and all assets."""
import glob
import os
import subprocess
import sys

ROOT = r"H:\D_tools\courseware-system-kimi"
GH = r"C:\Program Files\GitHub CLI\gh.exe"
LOCAL_DIR = os.path.join(ROOT, "版本迭代-本地播放用")
WEB_DIR = os.path.join(ROOT, "版本迭代-服务器部署用")
CHAPTERS = [f"Ch{i}" for i in range(1, 9)]
REDLINE_PATTERNS = [
    "image2_config.json", "assets/image2/generate.py", "assets/image2/prompts/",
    "bwy-ori-oldPPT/", "bwy-ori-template/", "封面配图提示词.md",
]


def run(cmd, **kw):
    print("+", " ".join(cmd), flush=True)
    return subprocess.run(cmd, cwd=ROOT, check=True, **kw)


def out(cmd):
    return subprocess.run(cmd, cwd=ROOT, check=True, capture_output=True, text=True).stdout.strip()


def find_zip(base_dir, folder_key):
    candidates = sorted(glob.glob(os.path.join(base_dir, "*" + folder_key)))
    if not candidates:
        return None
    zips = glob.glob(os.path.join(candidates[-1], "*.zip"))
    return zips[0] if len(zips) == 1 else None


def main():
    if len(sys.argv) != 2 or not sys.argv[1].lower().startswith("v"):
        sys.exit("用法: python qa/release_github.py v3.0")
    ver = sys.argv[1].lower()
    vernum = ver[1:]

    print("== 0. 预检 ==", flush=True)
    subprocess.run([GH, "auth", "status"], check=True, capture_output=True)
    for key in ("user.name", "user.email"):
        if not out(["git", "config", "--get", key]):
            sys.exit(f"git {key} 未配置")
    tracked = out(["git", "ls-files"]).replace("\\", "/")
    leaks = [p for p in REDLINE_PATTERNS if p in tracked]
    if leaks:
        sys.exit(f"红线文件已入库，禁止发布: {leaks}")
    if out(["git", "tag", "-l", ver]):
        sys.exit(f"标签 {ver} 已存在，拒绝覆盖历史版本")

    zips = []
    for chapter in CHAPTERS:
        path = find_zip(LOCAL_DIR, f"-{chapter}-V{vernum}")
        if not path:
            sys.exit(f"缺本地播放包: {chapter} V{vernum}")
        zips.append(path)
    web = find_zip(WEB_DIR, f"-Ch1-Ch8-V{vernum}")
    if not web:
        sys.exit(f"缺网页部署包: Ch1-Ch8 V{vernum}")
    zips.append(web)
    if len(zips) != 9:
        sys.exit("发布资产必须为 8 个章节包 + 1 个网页部署包")
    for path in zips:
        print("  资产:", os.path.relpath(path, ROOT), flush=True)

    print("== 1. 提交源码 ==", flush=True)
    run(["git", "add", "-A"])
    staged = out(["git", "diff", "--cached", "--name-only"]).replace("\\", "/")
    staged_leaks = [p for p in REDLINE_PATTERNS if p in staged]
    if staged_leaks:
        sys.exit(f"暂存区含红线文件，禁止发布: {staged_leaks}")
    if subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=ROOT).returncode != 0:
        run(["git", "commit", "-m", f"发布 {ver}"])
    else:
        print("  无源码改动，跳过 commit")

    print("== 2. 打标签 ==", flush=True)
    run(["git", "tag", "-a", ver, "-m", f"发布 {ver}"])

    print("== 3. 推送 ==", flush=True)
    run(["git", "push", "origin", "main"])
    run(["git", "push", "origin", ver])

    print("== 4. 创建 Release ==", flush=True)
    notes = (
        f"自动控制理论三层 HTML 课件 {ver}\n\n"
        "- 八章共 468 页，新增第七章离散控制系统、第八章非线性系统分析\n"
        "- 8 个章节 zip：本地播放版，解压后运行 start.bat / start.command\n"
        "- act-courseware-web-deploy：网页部署版，含全部八章\n"
        "- 融合 8 张新生成配图；修复第七、八章章节导航空白并强化异步切换\n"
        "- 第七章、第八章完成理论、视觉、数值与脚本回归\n"
    )
    run([GH, "release", "create", ver, "--title", f"课件 {ver.upper()}", "--notes", notes] + zips)
    url = out([GH, "release", "view", ver, "--json", "url", "-q", ".url"])
    assets_json = out([GH, "release", "view", ver, "--json", "assets", "-q", ".assets | length"])
    if assets_json.strip() != "9":
        raise RuntimeError(f"Release 资产数量异常: {assets_json}")
    print(f"完成: {url}（9 个资产）", flush=True)


if __name__ == "__main__":
    main()
