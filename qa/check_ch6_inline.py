from pathlib import Path
import json, re, subprocess, tempfile, sys
ROOT = Path(__file__).resolve().parents[1]
L = ROOT / "lessons" / "lesson06-correction"
manifest = json.loads((L / "lesson.json").read_text(encoding="utf-8"))
errors = []
ids = [p["id"] for p in manifest["pages"]]
if len(ids) != len(set(ids)):
    errors.append("页面 ID 重复")
for i, page in enumerate(manifest["pages"], 1):
    fp = L / page["file"]
    if not fp.exists():
        errors.append(f"缺文件 {fp}")
        continue
    text = fp.read_text(encoding="utf-8")
    if f'data-page="{i} / {len(manifest["pages"])}"' not in text:
        errors.append(f"页码不符 {fp.name}")
    for ref in re.findall(r'(?:src|href)="([^"]+)"', text):
        if ref.startswith(("http:", "https:", "data:", "#")):
            continue
        target = (fp.parent / ref.split("?",1)[0]).resolve()
        if not target.exists():
            errors.append(f"资源缺失 {fp.name}: {ref}")
    for j, script in enumerate(re.findall(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", text, re.S), 1):
        with tempfile.NamedTemporaryFile("w", suffix=".js", encoding="utf-8", delete=False) as tf:
            tf.write(script)
            tmp = tf.name
        node = r"C:\Program Files\nodejs\node.exe"
        r = subprocess.run([node, "--check", tmp], capture_output=True, text=True)
        Path(tmp).unlink(missing_ok=True)
        if r.returncode:
            errors.append(f"JS语法 {fp.name} script{j}: {r.stderr.strip()}")
forbidden = ["教材口径", "口径备注", "双口径", "17.86s", "143s", "0.3158", "42.6°", "40.2°"]
for fp in (L / "pages").glob("*.html"):
    text = fp.read_text(encoding="utf-8")
    for word in forbidden:
        if word in text:
            errors.append(f"禁用/旧表述 {fp.name}: {word}")
print("\n".join(errors) if errors else f"PASS：{len(manifest['pages'])} 页资源、页码、内联 JS 与旧表述检查通过")
sys.exit(bool(errors))
