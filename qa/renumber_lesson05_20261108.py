"""Mechanically align lesson 5 body page labels with lesson.json order."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LESSON = ROOT / "lessons" / "lesson05-root-locus"
manifest = json.loads((LESSON / "lesson.json").read_text(encoding="utf-8"))
total = len(manifest["pages"])
assert total == 60, total
for number, entry in enumerate(manifest["pages"], 1):
    path = LESSON / entry["file"]
    text = path.read_text(encoding="utf-8")
    text, count = re.subn(r'data-page="[^"]*"', f'data-page="{number} / {total}"', text, count=1)
    assert count == 1, path
    text = re.sub(r'(<div class="act-footno">)\d+(</div>)', rf'\g<1>{number}\g<2>', text)
    path.write_text(text, encoding="utf-8")

# The open-loop dipole summary moved from old page 59 to new page 58.
p54 = LESSON / "pages" / "p54-dipole.html"
text = p54.read_text(encoding="utf-8").replace("第59页再讲", "第58页再讲")
p54.write_text(text, encoding="utf-8")
print(f"Renumbered {total} pages and updated explicit cross-reference.")
