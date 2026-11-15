from pathlib import Path
import re
p = Path(__file__).with_name("apply_ch6_textbook_pages.py")
out = []
for line in p.read_text(encoding="utf-8").splitlines(True):
    if 'r"' in line and '\\"' in line:
        line = line.replace('r"', "r'''")
        line = re.sub(r'(?<!\\)"(?=[,\)])', "'''", line)
        line = line.replace('\\"', '"')
    out.append(line)
p.write_text(''.join(out), encoding='utf-8')
