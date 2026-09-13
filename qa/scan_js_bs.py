import glob, io, re

BS = chr(92)  # 反斜杠
for f in sorted(glob.glob('lessons/lesson02-math-model/pages/*.html')):
    s = io.open(f, encoding='utf-8').read()
    scripts = re.findall(r'<script>(.*?)</script>', s, re.S)
    rows = []
    for js in scripts:
        for line in js.split('\n'):
            if BS in line and ('"' in line or "'" in line):
                rows.append(line.strip()[:90])
    if rows:
        print('==', f.split('pages/')[-1], len(rows))
        for r in rows[:4]:
            print('   ', r)
