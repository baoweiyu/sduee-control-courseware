#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成例5-11 两系统的根轨迹采样数据（RL.data 格式），并打印解析核对表。

系统(1) ex511a：G1(s)H1(s) = K1(s-1) / [s(s+1)(s+2)]，首一标准形、增益为正 → 180° 根轨迹
    特征方程：s(s+1)(s+2) + K1(s-1) = 0  →  s^3 + 3s^2 + (2+K1)s - K1 = 0
系统(2) ex511b：G2(s)H2(s) = K1(1-s) / [s(s+1)(s+2)]，(1-s)=-(s-1) 首一化提负号 → 0° 根轨迹
    特征方程：s(s+1)(s+2) - K1(s-1) = 0  →  s^3 + 3s^2 + (2-K1)s + K1 = 0

解析口径（手算，供核对）：
    开环极点 0, -1, -2；开环零点 +1；n-m=2，sigma_a=(-3-1)/2=-2
    180°：实轴段 [-2,-1]、[0,1]（右侧实零极点数为奇数）；渐近线 ±90°
          分离点方程 dK/ds=0 → s^3-3s-1=0 → s=-1.5321（K=0.1506）
          一支从极点 0 沿 [0,1] 直达 RHP 零点 +1 → 本例 K1>0 恒不稳定（Routh: 常数项 -K1<0）
    0°  ：实轴段 (-∞,-2]、[-1,0]、[1,+∞)（右侧偶数）；渐近线 0°、180°
          分离点 s=-0.3473（K=0.2780），会合点 s=+1.8794（K≈23.87）
          虚轴交点 K1=1.5，s=±j√0.5=±j0.7071（Routh: 3(2-K1)-K1=0）→ 稳定 0<K1<1.5
"""
import json, math, sys
import numpy as np

POLES = [0.0 + 0.0j, -1.0 + 0.0j, -2.0 + 0.0j]
ZERO = 1.0 + 0.0j


def char_poly(K, deg0):
    # s^3 + 3 s^2 + (2∓K) s ∓ K   （deg0=False → 180°：-K；deg0=True → 0°：+K）
    if deg0:
        return [1.0, 3.0, 2.0 - K, K]
    return [1.0, 3.0, 2.0 + K, -K]


def match_branches(prev, cur, pred=None):
    """贪婪最近邻分支匹配：prev/cur 为长度 3 的复数列表（pred 为外推预测，可选），返回 cur 的重排索引。"""
    ref = pred if pred is not None else prev
    n = len(prev)
    d = [[abs(ref[i] - cur[j]) for j in range(n)] for i in range(n)]
    pairs = sorted((d[i][j], i, j) for i in range(n) for j in range(n))
    pi, pj = [-1] * n, [-1] * n
    for _, i, j in pairs:
        if pi[i] == -1 and pj[j] == -1:
            pi[i], pj[j] = j, i
    return pi  # pi[i_prev] = j_cur


def sweep(deg0, kmax, special_ks, npts=400):
    ks = [0.0]
    ks += list(np.logspace(math.log10(0.01), math.log10(kmax), npts))
    ks += [k for k in special_ks]
    ks = sorted(set(round(float(k), 5) for k in ks))
    branches = [[complex(p)] for p in POLES]  # K=0 起点 = 开环极点
    prev = list(POLES)
    prev2 = None
    for K in ks[1:]:
        cur = list(np.roots(char_poly(K, deg0)))
        pred = None
        if prev2 is not None:
            pred = [prev[j] + (prev[j] - prev2[j]) for j in range(3)]  # 线性外推
        pi = match_branches(prev, cur, pred)
        nxt = [cur[pi[j]] for j in range(3)]
        for j in range(3):
            branches[j].append(nxt[j])
        prev2, prev = prev, nxt
    return ks, branches


def round5(z):
    re, im = round(z.real, 5), round(z.imag, 5)
    if abs(re) < 5e-6: re = 0.0
    if abs(im) < 5e-6: im = 0.0
    return [re, im]


def build(name, deg0, kmax, xlim, ylim, segments, asym, breakaways, crossings, special_ks, groups, pairs):
    ks, br = sweep(deg0, kmax, special_ks)
    data = {
        "kmin": 0.01, "kmax": float(kmax), "xlim": xlim, "ylim": ylim,
        "poles": [[0.0, 0.0], [-1.0, 0.0], [-2.0, 0.0]], "zeros": [[1.0, 0.0]],
        "segments": segments, "asym": asym, "breakaways": breakaways, "crossings": crossings,
        "ks": ks,
        "branches": [[[round(v, 5) for v in round5(z)] for z in b] for b in br],
        "groups": groups, "pairs": pairs,
    }
    if deg0:
        data["deg0"] = True
    path = "../lessons/lesson05-root-locus/data/%s.js" % name
    with open(path, "w", encoding="utf-8") as f:
        f.write('RL.data["%s"] = %s;\n' % (name, json.dumps(data, ensure_ascii=False)))
    # 分支平滑性自检：|Im|>0.15 后虚部符号必须恒定（捕捉共轭对互換之字）
    for i, b in enumerate(br):
        sgn = [1 if z.imag > 0.15 else (-1 if z.imag < -0.15 else 0) for z in b]
        sgn = [s for s in sgn if s != 0]
        assert all(s == sgn[0] for s in sgn), "分支%d 虚部符号翻转（之字匹配错误）" % i
        jumps = [abs(b[j + 1] - b[j]) for j in range(len(b) - 1)]
        print("  [%s] 分支%d 虚部符号恒定=%s 步长 med=%.4g max=%.4g"
              % (name, i, sgn[0] if sgn else 0, sorted(jumps)[len(jumps) // 2], max(jumps)))
    return ks, br, data


def sep_point_ks():
    """s^3-3s-1=0 的三根及其 K 值（180° 取负 K=-N/(s-1)，0° 取 K=N/(s-1)）。"""
    out = []
    for s in np.roots([1, 0, -3, -1]):
        s = float(s.real)
        N = s * (s + 1) * (s + 2)
        out.append((s, -N / (s - 1), N / (s - 1)))
    return out


def main():
    print("== 解析核对：分离/会合点方程 s^3-3s-1=0 ==")
    for s, k180, k0 in sep_point_ks():
        print("  s=%+.4f   K(180°)=%.4f   K(0°)=%.4f" % (s, k180, k0))
    print("== 解析核对：0° 虚轴交点 Routh: 3(2-K)-K=0 → K=1.5, s=±j%.4f ==" % math.sqrt(0.5))

    # ---------- 系统(1) 180° ----------
    ka, bra, da = build(
        "ex511a", False, 400.0, [-4.4, 1.8], [-3.6, 3.6],
        [[-2.0, -1.0], [0.0, 1.0]],
        {"sigma": -2.0, "angles": [90.0, -90.0]},
        [{"s": -1.5321, "K": 0.1506}],
        [], [0.1506], [[1, 2], [0]], [[1, 2]])
    print("\n== ex511a（系统1，180°）==")
    print("  分支数:", len(bra), " 采样点:", len(ka))
    for i, b in enumerate(bra):
        print("  分支%d 起点(%+.4f,%+.4f) 终点(%+.4f,%+.4f)" % ((i,) + (b[0].real, b[0].imag, b[-1].real, b[-1].imag)))
    # 核对：起点=极点；一支终点→零点 +1；另两支终点实部→σ_a=-2（渐近线）
    ends = sorted(b[-1].real for b in bra)
    assert all(abs(b[0] - p) < 1e-9 for b, p in zip(bra, POLES)), "起点必须为开环极点"
    assert abs(max(ends) - 1.0) < 0.02, "一支必须止于零点 +1，实际 %.4f" % max(ends)
    tail_re = sorted(b[-1].real for b in bra)
    assert abs(tail_re[0] + 2.0) < 0.15 and abs(tail_re[1] + 2.0) < 0.15, "复支终点实部应趋向 σ_a=-2"
    # 实轴段核对（法则三 180°：右侧实零极点数为奇数）
    def cnt_right(x): return sum(1 for p in [0, -1, -2, 1] if p > x)
    for x, exp in [(-1.5, True), (-0.5, False), (0.5, True), (1.5, False), (-2.5, False)]:
        assert (cnt_right(x) % 2 == 1) == exp, "180° 实轴段核对失败 @%g" % x
    print("  实轴段核对(180°奇数)：[-2,-1]∈，[0,1]∈，其余∉ —— OK")
    print("  渐近线 σ_a=-2，φ_a=±90°；分离点 -1.5321 (K=0.1506) —— 已写入")

    # ---------- 系统(2) 0° ----------
    kb, brb, db = build(
        "ex511b", True, 1000.0, [-5.4, 3.2], [-3.2, 3.2],
        [[-1e999, -2.0], [-1.0, 0.0], [1.0, 1e999]],
        {"sigma": -2.0, "angles": [0.0, 180.0]},
        [{"s": -0.3473, "K": 0.2780}],
        [{"w": 0.7071, "K": 1.5}],
        [0.278, 1.5, 23.8747], [[0, 1], [2]], [[0, 1]])
    print("\n== ex511b（系统2，0°）==")
    print("  分支数:", len(brb), " 采样点:", len(kb))
    for i, b in enumerate(brb):
        print("  分支%d 起点(%+.4f,%+.4f) 终点(%+.4f,%+.4f)" % ((i,) + (b[0].real, b[0].imag, b[-1].real, b[-1].imag)))
    assert all(abs(b[0] - p) < 1e-9 for b, p in zip(brb, POLES)), "起点必须为开环极点"
    # 终点核对：一支 → 零点 +1；另两支 → ±∞（|z| 大、实部一正一负，沿 0°/180° 渐近线）
    finals = [b[-1] for b in brb]
    i_zero = min(range(3), key=lambda i: abs(finals[i] - 1.0))
    assert abs(finals[i_zero] - 1.0) < 0.05, "一支必须止于零点 +1"
    others = [finals[i] for i in range(3) if i != i_zero]
    assert all(abs(z) > 8 for z in others), "另两支应趋向无穷远"
    sgn = sorted(1 if z.real > 0 else -1 for z in others)
    assert sgn == [-1, 1], "∞ 方向应一正一负（渐近线 0°/180°），实际 %s" % others
    # 实轴段核对（0°：右侧偶数）
    for x, exp in [(-1.5, False), (-0.5, True), (0.5, False), (1.5, True), (-2.5, True)]:
        assert (cnt_right(x) % 2 == 0) == exp, "0° 实轴段核对失败 @%g" % x
    print("  实轴段核对(0°偶数)：(-∞,-2]∈，[-1,0]∈，[1,+∞)∈，其余∉ —— OK")
    print("  渐近线 σ_a=-2，φ_a=0°/180°；分离点 -0.3473 (K=0.2780)，会合点 +1.8794 (K≈23.87)")
    print("  虚轴交点 ±j0.7071 (K=1.5)：稳定区间 0<K1<1.5")
    # 数值验证虚轴交点：K=1.5 时特征方程根含 ±j0.7071
    rts = np.roots(char_poly(1.5, True))
    assert any(abs(r - 0.7071j) < 1e-3 for r in rts), "K=1.5 应有根 +j0.7071"
    # K=1.5 采样点的复支应过 ±j0.7071 附近
    idx = kb.index(1.5)
    near = [brb[i][idx] for i in range(3)]
    print("  K=1.5 采样点三根:", ["%+.4f%+.4fj" % (z.real, z.imag) for z in near])
    print("\nALL CHECKS PASSED")


if __name__ == "__main__":
    sys.exit(main())
