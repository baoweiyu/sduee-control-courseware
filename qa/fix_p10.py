#!/usr/bin/env python
# -*- coding: utf-8 -*-
import io
p = 'lessons/lesson02-math-model/pages/p10-laplace-theorems.html'
s = io.open(p, encoding='utf-8').read()

old23 = '<span class="math">L[f′(t)] = sF(s) − f(0)<br>L[f″(t)] = s²F(s) − s·f(0) − f′(0)<br>L[f⁽ⁿ⁾(t)] = sⁿF(s) − Σ<sub>k=1..n</sub> sⁿ⁻ᵏf⁽ᵏ⁻¹⁾(0)</span>'
new23 = r'''<span class="math tex">\mathcal{L} [f'(t)] = sF(s) - f(0)</span><br><span class="math tex">\mathcal{L} [f''(t)] = s^{2}F(s) - s f(0) - f'(0)</span><br><span class="math tex">\mathcal{L} [f^{(n)}(t)] = s^{n}F(s) - \sum _{k=1}^{n} s^{n-k}f^{(k-1)}(0)</span>'''
assert old23 in s
s = s.replace(old23, new23)

old24 = '<span class="math">L[∫f(t)dt] = <span class="fr"><span class="nu">F(s)</span><span class="de">s</span></span> + <span class="fr"><span class="nu">f⁽⁻¹⁾(0)</span><span class="de">s</span></span><br>L[∫∫f(t)dt²] = <span class="fr"><span class="nu">F(s)</span><span class="de">s²</span></span> + <span class="fr"><span class="nu">f⁽⁻¹⁾(0)</span><span class="de">s²</span></span> + <span class="fr"><span class="nu">f⁽⁻²⁾(0)</span><span class="de">s</span></span></span>'
new24 = r'''<span class="math tex">\mathcal{L} [\int f(t)dt] = \dfrac{F(s)}{s} + \dfrac{f^{(-1)}(0)}{s}</span><br><span class="math tex">\mathcal{L} [\int_{0}^{t}\!\!\int_{0}^{\tau} f(\tau )d\tau dt] = \dfrac{F(s)}{s^{2}} + \dfrac{f^{(-1)}(0)}{s^{2}} + \dfrac{f^{(-2)}(0)}{s}</span>'''
assert old24 in s
s = s.replace(old24, new24)

old25 = '<span class="math">实位移：L[f(t−τ)] = F(s)·e<sup>−τs</sup><br>复位移：L[e<sup>−at</sup>f(t)] = F(s+a)</span>'
new25 = r'''<span class="math tex">\text{实位移：}\mathcal{L} [f(t-\tau )] = F(s)\cdot e^{-\tau s}</span><br><span class="math tex">\text{复位移：}\mathcal{L} [e^{-at}f(t)] = F(s+a)</span>'''
assert old25 in s
s = s.replace(old25, new25)

io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('p10 fixed, tabs:', s.count(chr(9)))
