# -*- coding: utf-8 -*-
"""交付第五步：GitHub 发布（源码推送 + Release 资产上传）。

用法:
    python qa/release_github.py v2.16

前置条件:
    1. 本机已安装 gh CLI 且已完成 gh auth login；
    2. 仓库已关联远程 origin（首次由 gh repo create 建立）；
    3. 本地播放版四章包、网页部署版整包已归档到「版本迭代-*」文件夹。

流程（任一前置失败立即退出，不做半截发布）:
    0. 预检：gh 认证、git 身份、红线文件不入库、5 个 zip 齐全；
    1. git add -A，如有改动则 commit；
    2. 打标签 vX.Y（已存在则报错，防止覆盖历史）；
    3. push main + 标签；
    4. gh release create 上传 6 个 zip。
"""
import glob
import os
import subprocess
import sys

ROOT = r"H:\D_tools\courseware-system-kimi"
GH = r"C:\Program Files\GitHub CLI\gh.exe"
LOCAL_DIR = os.path.join(ROOT, "版本迭代-本地播放用")
WEB_DIR = os.path.join(ROOT, "版本迭代-服务器部署用")
CHAPTERS = ["Ch1", "Ch2", "Ch3", "Ch4", "Ch5", "Ch6"]

REDLINE_PATTERNS = ["image2_config.json", "assets/image2/generate.py", "assets/image2/prompts/"]


def run(cmd, **kw):
    print("+", " ".join(cmd))
    return subprocess.run(cmd, cwd=ROOT, check=True, **kw)


def out(cmd):
    return subprocess.run(cmd, cwd=ROOT, check=True, capture_output=True, text=True).stdout.strip()


def find_zip(base_dir, folder_key):
    """在归档目录里按「日期-章节-版本」文件夹名找最新一个匹配文件夹内的 zip。"""
    cands = sorted(glob.glob(os.path.join(base_dir, "*" + folder_key)))
    if not cands:
        return None
    zips = glob.glob(os.path.join(cands[-1], "*.zip"))
    return zips[0] if zips else None


def main():
    if len(sys.argv) != 2 or not sys.argv[1].lower().startswith("v"):
        sys.exit("用法: python qa/release_github.py v2.16")
    ver = sys.argv[1].lower()
    vernum = ver[1:]

    # ---- 0. 预检 ----
    print("== 0. 预检 ==")
    subprocess.run([GH, "auth", "status"], check=True, capture_output=True)
    for k in ("user.name", "user.email"):
        if not out(["git", "config", "--get", k]):
            sys.exit("git %s 未配置" % k)
    tracked = out(["git", "ls-files"]).replace("\\", "/")
    leaks = [p for p in REDLINE_PATTERNS if p in tracked]
    if leaks:
        sys.exit("红线文件已入库，禁止发布: %s" % leaks)

    zips = []
    for ch in CHAPTERS:
        z = find_zip(LOCAL_DIR, "-%s-V%s" % (ch, vernum))
        if not z:
            sys.exit("缺本地播放包: %s V%s" % (ch, vernum))
        zips.append(z)
    web = find_zip(WEB_DIR, "-Ch1-Ch6-V%s" % vernum)
    if not web:
        sys.exit("缺网页部署包: Ch1-Ch5 V%s" % vernum)
    zips.append(web)
    for z in zips:
        print("  资产:", os.path.relpath(z, ROOT))

    # ---- 1. commit ----
    print("== 1. 提交源码 ==")
    run(["git", "add", "-A"])
    if subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=ROOT).returncode != 0:
        run(["git", "commit", "-m", "发布 %s" % ver])
    else:
        print("  无源码改动，跳过 commit")

    # ---- 2. tag ----
    print("== 2. 打标签 ==")
    if ver in out(["git", "tag", "-l", ver]):
        sys.exit("标签 %s 已存在；如需重发请先删除: git tag -d %s" % (ver, ver))
    run(["git", "tag", "-a", ver, "-m", "发布 %s" % ver])

    # ---- 3. push ----
    print("== 3. 推送 ==")
    run(["git", "push", "origin", "main"])
    run(["git", "push", "origin", ver])

    # ---- 4. release ----
    print("== 4. 创建 Release ==")
    notes = "自动控制理论三层 HTML 课件 %s\r\n\r\n" % ver
    notes += "- 6 个章节 zip：本地播放版（解压后双击 start.bat / start.command 即可离线播放）\r\n"
    notes += "- act-courseware-web-deploy：网页部署版（静态站点，含全部六章）\r\n"
    run([GH, "release", "create", ver, "--title", "课件 %s" % ver, "--notes", notes] + zips)
    print("完成:", out([GH, "release", "view", ver, "--json", "url", "-q", ".url"]))


if __name__ == "__main__":
    main()
