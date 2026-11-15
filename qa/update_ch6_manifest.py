from pathlib import Path
import json, re
ROOT = Path(__file__).resolve().parents[1]
lesson = ROOT / "lessons" / "lesson06-correction"
mp = lesson / "lesson.json"
data = json.loads(mp.read_text(encoding="utf-8"))
new_pages = [
    {"id":"l6-p38a","file":"pages/p38a-ex65-k.html","title":"例6-5：题设与未校分析","complexity":"L3","status":"Draft","legacy_action":"NEW"},
    {"id":"l6-p38b","file":"pages/p38b-ex65-design.html","title":"例6-5：滞后—超前参数设计","complexity":"L3","status":"Draft","legacy_action":"NEW"},
    {"id":"l6-p38c","file":"pages/p38c-ex65-verify.html","title":"例6-5：校后 Bode 与检验","complexity":"L3","status":"Draft","legacy_action":"NEW"},
]
pages = [p for p in data["pages"] if p["file"] not in {n["file"] for n in new_pages}]
pos = next(i for i,p in enumerate(pages) if p["id"] == "l6-p38") + 1
pages[pos:pos] = new_pages
data["pages"] = pages
mp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
total = len(pages)
for i,p in enumerate(pages,1):
    fp = lesson / p["file"]
    s = fp.read_text(encoding="utf-8")
    s2, n = re.subn(r'data-page="\d+\s*/\s*\d+"', f'data-page="{i} / {total}"', s, count=1)
    if n != 1:
        raise RuntimeError(f"data-page missing: {fp}")
    fp.write_text(s2, encoding="utf-8")
print(f"第六章共 {total} 页，清单与页码已同步")
