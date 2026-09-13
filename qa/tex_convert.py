#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""半自动公式转换器 v2：把旧式 HTML 公式标记转成 MathJax .tex 元素。
v2 改进：
- 栈式元素提取（span 内嵌 span 不再截断）
- 白名单制：元素内只允许 sub/sup/b(含danger)/.fr/.mn，其余一律跳过留人工
- 跳过纯中文叙述元素
- 新增 ⁽⁾ → ∥ √合并下标 \lim \sum 上下限 \mathcal{L} 等规则
"""
import re, sys, io, glob, os

SUB = {'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9',
       'ₐ':'a','ₑ':'e','ₒ':'o','ₓ':'x','ₕ':'h','ₖ':'k','ₗ':'l','ₘ':'m','ₙ':'n','ₚ':'p','ₛ':'s','ₜ':'t',
       'ᵣ':'r','ᵤ':'u','ᵢ':'i','𝒇':'f','𝒸':'c','ⱼ':'j','₋':'-'}
SUP = {'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9',
       'ⁿ':'n','ᵐ':'m','ⁱ':'i','ʳ':'r','ˢ':'s','ᵗ':'t','ᵘ':'u','ˣ':'x','ʸ':'y','ᵃ':'a','ᵇ':'b','ᶜ':'c','ᵈ':'d','ᵉ':'e',
       'ᵀ':'T','⁻':'-','⁺':'+','⁽':'(','⁾':')'}
GREEK = {'ω':'\\omega ','ζ':'\\zeta ','τ':'\\tau ','Φ':'\\Phi ','φ':'\\varphi ','Δ':'\\Delta ','δ':'\\delta ',
         'λ':'\\lambda ','π':'\\pi ','Σ':'\\Sigma ','σ':'\\sigma ','Ω':'\\Omega ','α':'\\alpha ','β':'\\beta ',
         'γ':'\\gamma ','θ':'\\theta ','η':'\\eta ','μ':'\\mu ','ν':'\\nu ','ρ':'\\rho ','ε':'\\varepsilon ',
         'ξ':'\\xi ','χ':'\\chi ','ψ':'\\psi ','Γ':'\\Gamma ','Λ':'\\Lambda ','Π':'\\Pi ','Θ':'\\Theta '}
OPS = {'⋯':'\\cdots ','…':'\\ldots ','≥':'\\ge ','≤':'\\le ','±':'\\pm ','∓':'\\mp ','×':'\\times ','÷':'\\div ',
       '−':'-','·':'\\cdot ','∫':'\\int ','∞':'\\infty ','≠':'\\ne ','≈':'\\approx ','⇒':'\\Rightarrow ',
       '∑':'\\sum ','∏':'\\prod ','∈':'\\in ','∂':'\\partial ','′':"'",'″':"''",
       '→':'\\to ','←':'\\leftarrow ','∥':'\\parallel ',
       '＋':'+','＝':'='}

CJK = re.compile(r'[\u4e00-\u9fff]')

def conv_text(t):
    """纯文本层的符号转换（在 sup/sub/.fr 已处理后调用）。"""
    # √(…) -> \sqrt{…}（无嵌套括号）
    t = re.sub(r'√\(([^()]*)\)', r'\\sqrt{\1}', t)
    t = t.replace('√', '\\sqrt{}')
    # Unicode 下标：字母/数字/右括号/右花括号后紧跟下标串
    def sub_rep(m):
        subs = ''.join(SUB[c] for c in m.group(2))
        return m.group(1) + '_{' + subs + '}'
    t = re.sub(r'([A-Za-z0-9\)\}])\s*([' + ''.join(SUB) + ']+)', sub_rep, t)
    # 裸下标字符
    t = re.sub(r'([' + ''.join(SUB) + ']+)', lambda m: '_{' + ''.join(SUB[c] for c in m.group(1)) + '}', t)
    # 合并 _{a},_{b} -> _{a,b}
    t = re.sub(r'_\{([^}]*)\},_\{([^}]*)\}', r'_{\1,\2}', t)
    # Unicode 上标
    def sup_rep(m):
        return m.group(1) + '^{' + ''.join(SUP[c] for c in m.group(2)) + '}'
    t = re.sub(r'([A-Za-z0-9\)\}])\s*([' + ''.join(SUP) + ']+)', sup_rep, t)
    t = re.sub(r'([' + ''.join(SUP) + ']+)', lambda m: '^{' + ''.join(SUP[c] for c in m.group(1)) + '}', t)
    # 希腊字母与运算符（值自带尾空格，避免与后随字母粘连）
    for k, v in {**GREEK, **OPS}.items():
        t = t.replace(k, v)
    # 标准函数名正体
    t = re.sub(r'(?<![\\A-Za-z])(arctan|arcsin|arccos|sin|cos|tan|cot|sec|csc|ln|log|exp|lim)(?![A-Za-z])', r'\\\1 ', t)
    # \sum_{i=1..n} -> \sum_{i=1}^{n}
    t = t.replace('\\sum _{i=1..n}', '\\sum _{i=1}^{n}')
    return t

def conv_html_inner(h):
    """对元素 innerHTML 做结构转换：sup/sub、.fr、.mn、红 b、粗 b。"""
    h = re.sub(r'<sup>(.*?)</sup>', lambda m: '^{' + m.group(1) + '}', h, flags=re.S)
    h = re.sub(r'<sub>(.*?)</sub>', lambda m: '_{' + m.group(1) + '}', h, flags=re.S)
    fr = re.compile(r'<span class="fr"><span class="nu">(.*?)</span><span class="de">(.*?)</span></span>', re.S)
    for _ in range(6):
        h2 = fr.sub(lambda m: '\\dfrac{' + m.group(1) + '}{' + m.group(2) + '}', h)
        if h2 == h: break
        h = h2
    def mn_rep(m):
        c = m.group(1)
        return '\\mathcal{L}' if c.strip() == 'L' else '\\mathrm{' + c + '}'
    h = re.sub(r'<span class="mn">(.*?)</span>', mn_rep, h, flags=re.S)
    h = re.sub(r'<b style="[^"]*(?:danger|#D63A2F)[^"]*">(.*?)</b>',
               lambda m: '\\color{#D63A2F}{' + m.group(1) + '}', h, flags=re.S)
    def b_rep(m):
        c = m.group(1)
        return '\\text{\\textbf{' + c + '}}' if CJK.search(c) else '\\mathbf{' + c + '}'
    h = re.sub(r'<b>(.*?)</b>', b_rep, h, flags=re.S)
    h = re.sub(r'<[^>]+>', '', h)  # 安全网（白名单制下不会触发）
    h = h.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    return h

CJK_RUN = re.compile(r'([\u4e00-\u9fff\u3000-\u303f\uff00-\uffef，。：；（）——、“”]+(?:[A-Za-z0-9\s]*[\u4e00-\u9fff，。：；（）——]+)+|[\u4e00-\u9fff]+[，。：；（）——\u4e00-\u9fff]*|[，。：；（）——、]+)')

def wrap_cjk(t):
    def rep(m):
        s = m.group(0).strip()
        if s == '（': return '('
        if s == '）': return ')'
        return '\\text{' + s + '}' if s else ''
    return CJK_RUN.sub(rep, t)

def convert_math_inner(h):
    h = conv_html_inner(h)
    h = conv_text(h)
    h = wrap_cjk(h)
    h = re.sub(r'\\text\{([^}]*)\}\\text\{', lambda m: '\\text{' + m.group(1) + '}', h)
    return re.sub(r'\s+', ' ', h).strip()

def is_block(cls, tag):
    return tag == 'div' or 'mathbox' in cls or 'eqline' in cls

# 白名单：移除允许的标签后不得再有 '<'
def convertible(inner):
    t = inner
    for _ in range(3):
        t = re.sub(r'<span class="fr"><span class="nu">.*?</span><span class="de">.*?</span></span>', '', t, flags=re.S)
    t = re.sub(r'</?(?:sup|sub)>', '', t)
    t = re.sub(r'<span class="mn">.*?</span>', '', t, flags=re.S)
    t = re.sub(r'<b style="[^"]*(?:danger|#D63A2F)[^"]*">.*?</b>', '', t, flags=re.S)
    t = re.sub(r'</?b>', '', t)
    return '<' not in t

TAGRE = re.compile(r'<(/?)(span|div|td|th|b)(\s[^>]*)?/?>')
MATHCLS = re.compile(r'\b(?:math|eq|eqline)\b')

def find_math_elements(s):
    """栈式扫描：返回 [(start,end,tag,attrs,cls,inner_start,inner_end)]，按起点升序。"""
    out = []
    for m in re.finditer(r'<(span|div|td|th|b)([^>]*\bclass="([^"]*)"[^>]*)>', s):
        cls = m.group(3)
        if not MATHCLS.search(cls):
            continue
        tag = m.group(1)
        depth, i = 1, m.end()
        while depth > 0:
            t = TAGRE.search(s, i)
            if not t:
                break
            if t.group(2) == tag and not t.group(0).endswith('/>'):
                depth += -1 if t.group(1) else 1
            i = t.end()
        if depth == 0:
            out.append((m.start(), i, tag, m.group(2), cls, m.end(), i - len('</' + tag + '>')))
    return out

def process_file(path, dry=False):
    s = io.open(path, encoding='utf-8').read()
    # 保护 style/script
    keep = []
    def stash(m):
        keep.append(m.group(0))
        return f'@@PROTECT{len(keep)-1}@@'
    s = re.sub(r'<style>.*?</style>', stash, s, flags=re.S)
    s = re.sub(r'<script\b.*?</script>', stash, s, flags=re.S)

    els = find_math_elements(s)
    changed, skipped = 0, 0
    # 从后往前替换，偏移不失效；内层元素先被处理，外层因含 tex 子类自动跳过
    for start, end, tag, attrs, cls, is_, ie in sorted(els, reverse=True):
        if 'tex' in cls.split():
            continue
        inner = s[is_:ie]
        if 'class="tex' in inner:
            skipped += 1; continue
        if not convertible(inner):
            skipped += 1; continue
        if not re.search(r'[A-Za-z0-9=+·−−]', inner):
            skipped += 1; continue  # 纯中文叙述
        newinner = convert_math_inner(inner)
        newcls = cls + ' tex' + (' tex-d' if is_block(cls, tag) else '')
        newattrs = attrs.replace(f'class="{cls}"', f'class="{newcls}"', 1)
        s = s[:start] + f'<{tag}{newattrs}>{newinner}</{tag}>' + s[end:]
        changed += 1

    for i, k in enumerate(keep):
        s = s.replace(f'@@PROTECT{i}@@', k)
    if changed and not dry:
        io.open(path, 'w', encoding='utf-8', newline='').write(s)
    return changed, skipped

if __name__ == '__main__':
    files = sys.argv[1:] or sorted(glob.glob('lessons/lesson02-math-model/pages/*.html'))
    skip = {'p16-tf-definition.html', 'p28-ex-speed-tf.html'}
    total, tskip = 0, 0
    for f in files:
        base = os.path.basename(f)
        if base in skip:
            print(f'  跳过 {base}'); continue
        n, k = process_file(f)
        total += n; tskip += k
        print(f'  {base}: 转换 {n} 处, 跳过 {k} 处')
    print(f'共转换 {total} 处, 人工处理 {tskip} 处')
