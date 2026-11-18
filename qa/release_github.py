# -*- coding: utf-8 -*-
"""Publish a versioned release: source commit, git tag, GitHub Release and all assets."""
import glob
import os
import shutil
import subprocess
import sys

ROOT = r"H:\D_tools\courseware-system-kimi"
GH = r"C:\Program Files\GitHub CLI\gh.exe"
LOCAL_DIR = os.path.join(ROOT, "版本迭代-本地播放用")
WEB_DIR = os.path.join(ROOT, "版本迭代-服务器部署用")
UPLOAD_DIR = os.path.join(ROOT, "qa", "release-upload")
CHAPTERS = [f"Ch{i}" for i in range(1, 9)]
CHAPTER_SLUGS = [
    "ch1-intro", "ch2-math-model", "ch3-time-domain", "ch4-frequency-response",
    "ch5-root-locus", "ch6-correction", "ch7-discrete-control", "ch8-nonlinear-systems",
]
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

    # GitHub CLI 对中文资产名的兼容性不稳定；以上传副本统一使用 ASCII 文件名。
    if os.path.isdir(UPLOAD_DIR):
        shutil.rmtree(UPLOAD_DIR)
    os.makedirs(UPLOAD_DIR)
    uploads = []
    for index, path in enumerate(zips):
        name = (f"act-courseware-{CHAPTER_SLUGS[index]}-{ver}.zip" if index < 8
                else f"act-courseware-web-deploy-{ver}.zip")
        target = os.path.join(UPLOAD_DIR, name)
        shutil.copy2(path, target)
        uploads.append(target)

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
        "- 八章共 468 页；本版针对第八章描述函数与自激振荡分析进行数学复核\n"
        "- P21：区分描述函数模值随幅值变化与负倒描述函数虚部恒定\n"
        "- P27：以闭式二次方程独立验证两个交点，并明确近似局部稳定性的适用边界\n"
        "- P26–P30：统一描述函数法近似结论口径，补充 P=0、完整 Nyquist 范围与低通前提\n"
        "- 8 个章节 zip 为本地播放版；web-deploy 包含全部八章的静态网页部署版\n"
        "- 已通过高精度数值、Fourier 积分、51 个脚本语法及重点页面视觉回归\n"
    )
    run([GH, "release", "create", ver, "--title", f"课件 {ver.upper()}", "--notes", notes] + uploads)
    url = out([GH, "release", "view", ver, "--json", "url", "-q", ".url"])
    assets_json = out([GH, "release", "view", ver, "--json", "assets", "-q", ".assets | length"])
    if assets_json.strip() != "9":
        raise RuntimeError(f"Release 资产数量异常: {assets_json}")
    print(f"完成: {url}（9 个资产）", flush=True)


if __name__ == "__main__":
    main()
