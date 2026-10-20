# -*- coding: utf-8 -*-
"""V2.29 第四章重编号：删 p49-min-phase，最小相位拆三页移到第二部分末，
新增 p68-opencl-poles、p74-fourstep-puzzle，全章 91 -> 95 页。
两阶段重命名防碰撞；同步 data-page 与 lesson.json。"""
import json, re, sys
from pathlib import Path

PAGES = Path("lessons/lesson04-freq/pages")
LJSON = Path("lessons/lesson04-freq/lesson.json")

rename_map = {
    'p50-bode-ess': 'p49-bode-ess', 'p51-quiz-ka': 'p50-quiz-ka',
    'p52-experiment': 'p51-experiment', 'p53-ex49': 'p52-ex49',
    'p54-part2-summary': 'p56-part2-summary', 'p55-zeta-slope-proof': 'p57-zeta-slope-proof',
    'p56-zeta-slope-vectors': 'p58-zeta-slope-vectors', 'p57-part3-cover': 'p59-part3-cover',
    'p58-alg-to-freq': 'p60-alg-to-freq', 'p59-map-vector': 'p61-map-vector',
    'p60-map-diff': 'p62-map-diff', 'p61-map-product': 'p63-map-product',
    'p62-map-encircle': 'p64-map-encircle', 'p63-map-outside': 'p65-map-outside',
    'p64-map-general': 'p66-map-general', 'p65-map-conclusion': 'p67-map-conclusion',
    'p66-f-to-gh': 'p69-f-to-gh', 'p67-nyquist-contour': 'p70-nyquist-contour',
    'p68-nyquist-criterion': 'p71-nyquist-criterion', 'p69-ex410': 'p72-ex410',
    'p70-ex410-concl': 'p73-ex410-concl', 'p71-ex412': 'p75-ex412',
    'p72-quiz-nyquist': 'p76-quiz-nyquist', 'p73-conditional-stab': 'p77-conditional-stab',
    'p74-margin-intro': 'p78-margin-intro', 'p75-margin-nyquist': 'p79-margin-nyquist',
    'p76-margin-bode': 'p80-margin-bode', 'p77-notes-summary': 'p81-notes-summary',
    'p78-part4-cover': 'p82-part4-cover', 'p79-cl-problem': 'p83-cl-problem',
    'p80-mcircle-deriv': 'p84-mcircle-deriv', 'p81-mcircle-plot': 'p85-mcircle-plot',
    'p82-ncircle': 'p86-ncircle', 'p83-nichols': 'p87-nichols',
    'p84-gamma-zeta': 'p88-gamma-zeta', 'p85-wc-ts': 'p89-wc-ts',
    'p86-cl-metrics': 'p90-cl-metrics', 'p87-cl-zeta-lab': 'p91-cl-zeta-lab',
    'p88-highorder-empirical': 'p92-highorder-empirical', 'p89-three-band': 'p93-three-band',
    'p90-quiz-metrics': 'p94-quiz-metrics', 'p91-ch4-summary': 'p95-ch4-summary',
}
new_map = {
    'zz-new-minphase-def': 'p53-minphase-def', 'zz-new-minphase-why': 'p54-minphase-why',
    'zz-new-minphase-judge': 'p55-minphase-judge', 'zz-new-opencl-poles': 'p68-opencl-poles',
    'zz-new-fourstep-puzzle': 'p74-fourstep-puzzle',
}
new_entries = {
    'p53-minphase-def': ('2.6 最小相位系统：定义与工程意义', 'L1'),
    'p54-minphase-why': ('2.6 为什么叫「最小相位」：零点相位动态对比', 'L2'),
    'p55-minphase-judge': ('2.6 最小相位系统的判断：高频「总账」', 'L1'),
    'p68-opencl-poles': ('3.3 开环与闭环的零极点：F(s) 的角色', 'L1'),
    'p74-fourstep-puzzle': ('3.3 四步拼图法：由极坐标图拼画闭合 Nyquist 曲线', 'L1'),
}

def num(base):
    m = re.match(r'p(\d+)-', base)
    return int(m.group(1)) if m else None

def main():
    old_bases = {p.stem for p in PAGES.glob('p*.html')}
    missing = [b for b in rename_map if b not in old_bases]
    if missing:
        print('缺失文件:', missing); sys.exit(1)
    if 'p49-min-phase' not in old_bases:
        print('p49-min-phase 不存在，可能已执行过'); sys.exit(1)

    # 页码映射：旧号 -> 新号
    num_map = {num(o): num(n) for o, n in rename_map.items()}

    # 阶段 1：旧文件 -> 临时名
    for o, n in rename_map.items():
        (PAGES / (o + '.html')).rename(PAGES / ('zz-tmp-' + n + '.html'))
    # 删 p49
    (PAGES / 'p49-min-phase.html').unlink()
    # 新页面 -> 临时名统一再走阶段 2
    for o, n in new_map.items():
        (PAGES / (o + '.html')).rename(PAGES / ('zz-tmp-' + n + '.html'))
    # 阶段 2：临时名 -> 正式名
    for tmp in sorted(PAGES.glob('zz-tmp-*.html')):
        final = tmp.name[len('zz-tmp-'):]
        tmp.rename(PAGES / final)

    # 同步 data-page="N / 91" -> "M / 95"
    for tmp_base, final_base in list(rename_map.items()):
        f = PAGES / (final_base + '.html')
        t = f.read_text(encoding='utf-8')
        old_no, new_no = num(tmp_base), num(final_base)
        t2 = re.sub(r'data-page="%d / 91"' % old_no, 'data-page="%d / 95"' % new_no, t)
        if t2 != t:
            f.write_text(t2, encoding='utf-8')
        else:
            print('警告: data-page 未命中', final_base)

    # lesson.json 重建
    d = json.loads(LJSON.read_text(encoding='utf-8'))
    pages = d['pages']
    out = []
    for e in pages:
        base = Path(e['file']).stem
        if base == 'p49-min-phase':
            continue
        nb = rename_map.get(base, base)
        nn = num(nb)
        out.append({'id': 'l4-p%02d' % nn, 'file': 'pages/%s.html' % nb,
                    'title': e['title'], 'complexity': e['complexity'],
                    'status': e['status'], 'legacy_action': e['legacy_action']})
        # 在新页面位置插入
        if nb == 'p52-ex49':
            for nb2 in ['p53-minphase-def', 'p54-minphase-why', 'p55-minphase-judge']:
                ti, cx = new_entries[nb2]
                out.append({'id': 'l4-p%s' % nb2[1:3], 'file': 'pages/%s.html' % nb2,
                            'title': ti, 'complexity': cx, 'status': 'Draft', 'legacy_action': 'REDESIGN'})
        if nb == 'p67-map-conclusion':
            ti, cx = new_entries['p68-opencl-poles']
            out.append({'id': 'l4-p68', 'file': 'pages/p68-opencl-poles.html',
                        'title': ti, 'complexity': cx, 'status': 'Draft', 'legacy_action': 'REDESIGN'})
        if nb == 'p73-ex410-concl':
            ti, cx = new_entries['p74-fourstep-puzzle']
            out.append({'id': 'l4-p74', 'file': 'pages/p74-fourstep-puzzle.html',
                        'title': ti, 'complexity': cx, 'status': 'Draft', 'legacy_action': 'REDESIGN'})
    assert len(out) == 95, len(out)
    d['pages'] = out
    LJSON.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding='utf-8')
    print('重编号完成：91 -> 95 页')

if __name__ == '__main__':
    main()
