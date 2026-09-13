import io, re

BS = chr(92)
FILES = [
    'lessons/lesson02-math-model/pages/p36-bd-reduce-ex210.html',
    'lessons/lesson02-math-model/pages/p46-mason-lab.html',
    'lessons/lesson02-math-model/pages/p47-mason-rc.html',
    'lessons/lesson02-math-model/pages/p49-exercise.html',
]
for f in FILES:
    s = io.open(f, encoding='utf-8').read()
    m = re.search(r'(const CAP = \[)(.*?)(\n\s*\];)', s, re.S)
    if not m:
        print(f, 'CAP block NOT FOUND'); continue
    body = m.group(2)
    if BS + BS in body:
        print(f, 'already doubled, skip'); continue
    n = body.count(BS)
    body2 = body.replace(BS, BS + BS)
    s2 = s[:m.start(2)] + body2 + s[m.end(2):]
    io.open(f, 'w', encoding='utf-8', newline='').write(s2)
    print(f, 'doubled', n, 'backslashes')
