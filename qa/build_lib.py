# -*- coding: utf-8 -*-
"""第五/六章页面构建公共库：统一 head 模板、封面/部分封面/互动题样式、写出器。
页面 body 用 __PAGENO__ 占位，由 write_all 按顺序注入 data-page。"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VER = "504"   # 新页面版本参数（防 stale 缓存，HANDOVER §3.3）


def head(title, lesson="lesson05-root-locus", nochrome=False, pageattr="", extra_css="", scripts=(), fig="fig"):
    if isinstance(scripts, str):
        scripts = [scripts]
    scr = "".join(scripts)
    if scr and not scr.endswith("\n"):
        scr += "\n"
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>{title}</title>
<link rel="stylesheet" href="../../../theme/theme.css?v={VER}">
<script src="../../../theme/mathjax/mathjax-render.js"></script>
<script src="../../../theme/mathjax/tex-chtml.js"></script>
<script src="../../../theme/mathjax/mjx/input/tex/extensions/color.js"></script>
<script src="../../../theme/act-base.js?v={VER}" defer></script>
<script src="../{fig}.js?v={VER}"></script>
{scr}<style>
{extra_css}</style>
</head>
<body data-title="{title}"{pageattr}{" data-nochrome=\"1\"" if nochrome else ""}>
<div class="act-stage"><div class="act-slide">
"""


def foot():
    return "</div></div>\n</body>\n</html>\n"


def note(lead, text):
    return f'<div class="act-note"><span class="lead">{lead}</span><span>{text}</span></div>\n'


COVER_CSS = """
  .cover { position:absolute; inset:0; display:flex; align-items:center; gap:56px; padding:64px 72px 84px; }
  .left { flex:1.12; display:flex; flex-direction:column; align-items:flex-start; gap:26px; }
  .left .cap { width:110px; height:110px; }
  .left h1 { font-size:76px; color:var(--navy); letter-spacing:4px; }
  .left .deco { width:150px; height:10px; border-radius:5px; background:var(--orange); position:relative; }
  .left .deco::after { content:""; position:absolute; right:-28px; top:0; width:12px; height:10px; border-radius:5px; background:var(--orange); }
  .left .sub { font-size:52px; color:var(--blue); font-weight:700; letter-spacing:3px; }
  .left .meta { font-size:25px; color:var(--muted); }
  .toc { display:grid; grid-template-columns:1fr; gap:14px; margin-top:10px; width:100%; }
  .toc .it { background:var(--sky); border:2px solid var(--line); border-radius:12px; padding:14px 20px; font-size:22px; color:var(--navy); font-weight:700; white-space:nowrap; }
  .toc .it b { color:var(--orange); margin-right:8px; }
  .right { flex:1; height:100%; display:flex; align-items:stretch; }
  .imgc { width:100%; border:2px solid var(--line); border-radius:20px; overflow:hidden; background:#fff; box-shadow:0 10px 34px rgba(18,38,110,.14); display:flex; }
  .imgc img { width:100%; height:100%; object-fit:cover; display:block; }
"""

QUIZ_CSS = """
  .row { display:flex; gap:24px; height:100%; min-height:0; }
  .qcol { flex:1.25; display:flex; flex-direction:column; gap:20px; min-height:0; }
  .qtype { display:inline-block; background:var(--orange); color:#fff; font-size:21px; font-weight:700; border-radius:10px; padding:7px 20px; width:fit-content; }
  .qz { background:#fff; border:2px solid var(--line); border-radius:16px; padding:22px 28px; flex:1; display:flex; flex-direction:column; justify-content:center; min-height:0; }
  .qz .qt { font-size:23px; color:var(--navy); font-weight:700; margin-bottom:18px; line-height:1.5; }
  .stage-tip { display:inline-block; margin-bottom:16px; font-size:19.5px; color:#fff; background:var(--blue); border-radius:20px; padding:6px 20px; width:fit-content; }
  .opts { display:flex; flex-direction:column; gap:14px; }
  .opt { background:var(--sky); border:2px solid var(--line); border-radius:12px; padding:14px 18px; font-size:20px; color:var(--ink); font-weight:700; position:relative; line-height:1.45; }
  .opt.right { border-color:#1E9E57; background:#F0FAF4; }
  .opt.right::after { content:"✓"; position:absolute; top:-13px; right:-10px; width:31px; height:31px; border-radius:50%; background:#1E9E57; color:#fff; font-weight:800; font-size:19px; display:grid; place-items:center; }
  .opt.wrong { border-color:#D63A2F; background:#FDF1EF; }
  .opt.wrong::after { content:"✗"; position:absolute; top:-13px; right:-10px; width:31px; height:31px; border-radius:50%; background:#D63A2F; color:#fff; font-weight:800; font-size:19px; display:grid; place-items:center; }
  .ans { font-size:23px; color:var(--navy); background:var(--sky); border-radius:12px; padding:16px 24px; line-height:1.7; }
  .ans b { color:var(--danger); }
"""


def cover(title, sub, meta, toc_items, img, img_alt, footno):
    tocs = "\n".join(f'<div class="it"><b>{a}</b>{b}</div>' for a, b in toc_items)
    return f"<style>{COVER_CSS}</style>" + f"""
  <div class="cover">
    <div class="left">
      <svg class="cap" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#1D3FA0"/><path d="M32 16 L52 25 L32 34 L12 25 Z" fill="#fff"/><path d="M22 30 v8 c0 4 20 4 20 0 v-8 l-10 5 z" fill="#fff"/><rect x="48" y="25" width="3" height="12" fill="#F5821F"/><circle cx="49.5" cy="39" r="2.5" fill="#F5821F"/></svg>
      <h1>自动控制理论</h1>
      <div class="deco"></div>
      <div class="sub">{sub}</div>
      <div class="meta">{meta}</div>
      <div class="toc">
{tocs}
      </div>
    </div>
    <div class="right">
      <div class="imgc"><img src="../../../assets/image2/{img}" alt="{img_alt}"></div>
    </div>
  </div>
  <div class="act-foot"></div><div class="act-footno">{footno}</div>
"""


def partcover(part, title, sub, meta, toc_items, img, img_alt):
    tocs = "\n".join(f'<div class="it"><b>{a}</b>{b}</div>' for a, b in toc_items)
    return f"<style>{COVER_CSS}</style>" + f"""
  <div class="cover">
    <div class="left">
      <span class="part" style="display:inline-block;background:var(--navy);color:#fff;font-size:24px;font-weight:700;letter-spacing:6px;border-radius:12px;padding:10px 26px;">{part}</span>
      <h1 style="font-size:58px;color:var(--navy);letter-spacing:3px;margin-top:6px;">{title}</h1>
      <div class="deco"></div>
      <div class="sub" style="font-size:38px;color:var(--blue);font-weight:700;letter-spacing:2px;">{sub}</div>
      <div class="meta">{meta}</div>
      <div class="toc">
{tocs}
      </div>
    </div>
    <div class="right">
      <div class="imgc"><img src="../../../assets/image2/{img}" alt="{img_alt}"></div>
    </div>
  </div>
  <div class="act-foot"></div>
"""


def write_all(lesson_dir, pages, lesson_meta):
    pages_dir = ROOT / "lessons" / lesson_dir / "pages"
    pages_dir.mkdir(parents=True, exist_ok=True)
    total = len(pages)
    lesson_pages = []
    for i, p in enumerate(pages, 1):
        html = p["html"].replace("__PAGENO__", f"{i} / {total}")
        scr = p.get("scripts", "")
        if isinstance(scr, str):
            scr = [scr]
        inject = "".join(scr)
        if inject and "<style>" in html:
            html = html.replace("<style>", inject + "\n<style>", 1)
        fp = pages_dir / p["file"]
        fp.write_text(html, encoding="utf-8")
        lesson_pages.append({
            "id": f"l{lesson_dir.split('lesson')[1][:1]}-p{i:02d}",
            "file": f"pages/{p['file']}",
            "title": p["title"],
            "complexity": p.get("cx", "L1"),
            "status": "Draft",
            "legacy_action": "NEW"
        })
    lj = dict(lesson_meta)
    lj["pages"] = lesson_pages
    (ROOT / "lessons" / lesson_dir / "lesson.json").write_text(
        json.dumps(lj, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{lesson_dir}: {total} pages written.")
