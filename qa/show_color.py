#!/usr/bin/env python
# -*- coding: utf-8 -*-
import io, re
for f in ['p15-linearization','p21-typical-1','p22-typical-2','p23-typical-3','p26-ex-opamp','p45-mason-formula']:
    s = io.open(f'lessons/lesson02-math-model/pages/{f}.html', encoding='utf-8').read()
    print('='*16, f)
    for m in re.finditer(r'.{70}\\color\{#D63A2F\}.{0,70}', s, re.S):
        print(m.group(0).replace('\n',' '))
        print('---')
