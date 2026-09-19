# -*- coding: utf-8 -*-
"""第五章示例页根轨迹数据生成器（本人自建，R1 数值严谨红线）

对特征方程 D(s) + K·N(s) = 0（180° 根轨迹）在 K∈[0,kmax] 对数网格上扫掠，
numpy.roots 逐点求闭环极点，全排列最小代价匹配保证分支连续；
分离/会合点用 dK/ds=0 解析求根并代回校验；虚轴交点用偶/奇部消元解析解。
输出 lessons/lesson05-root-locus/data/*.js（RL.data["name"] = {...}）。

运行：python qa/gen_ch5_samples.py   （末尾打印全部关键点解析核对表）
"""
import json
import itertools
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "lessons" / "lesson05-root-locus" / "data"


def poly_from_roots(roots):
    c = np.array([1.0 + 0j])
    for r in roots:
        c = np.polymul(c, np.array([1.0, -complex(r)]))
    c = np.real_if_close(c, tol=1e5)
    return np.real(c)


class Locus:
    """首一零极点形式：D(s) + K·N(s) = 0，K = 根轨迹增益。"""

    def __init__(self, zeros=(), poles=()):
        self.zeros = [complex(z) for z in zeros]
        self.poles = [complex(p) for p in poles]
        self.N = np.poly1d(poly_from_roots(self.zeros))   # 首一
        self.D = np.poly1d(poly_from_roots(self.poles))   # 首一

    def roots_at(self, K):
        return np.roots(np.polyadd(self.D, K * self.N)) if len(self.N.coeffs) > 1 or self.N.coeffs[0] != 1 \
            else np.roots(np.polyadd(self.D, K * self.N))

    def K_of(self, s):
        return float(np.real(-self.D(s) / self.N(s)))

    # ---- 实轴根轨迹段：右侧实零极点数之和为奇数 ----
    def real_segments(self):
        pts = sorted(set(round(v.real, 9) for v in self.zeros + self.poles))
        bounds = [pts[0] - 1.0] + pts + [pts[-1] + 1.0]
        segs, cur = [], None
        for a, b in zip(bounds, bounds[1:]):
            m = (a + b) / 2
            n_right = sum(1 for v in self.zeros + self.poles if v.real > m + 1e-9)
            on = (n_right % 2 == 1) and self.K_of(m) >= -1e-9
            if on and cur is None:
                cur = [a, b]
            elif on:
                cur[1] = b
            elif cur is not None:
                segs.append(tuple(cur)); cur = None
        if cur is not None:
            segs.append(tuple(cur))
        out = []
        for a, b in segs:
            out.append([float("-inf") if a <= bounds[0] + 1e-9 else round(a, 6),
                        float("inf") if b >= bounds[-1] - 1e-9 else round(b, 6)])
        return out

    # ---- 分离/会合点：dK/ds=0 → N'D - ND' = 0 ----
    def breakaways(self):
        P = np.polymul(np.polyder(self.D), self.N) - np.polymul(self.D, np.polyder(self.N))
        res = []
        for r in np.roots(P):
            if abs(r.imag) > 1e-7:
                continue
            x = float(r.real)
            if abs(self.N(x)) < 1e-9:        # 开环零点处不是分离点
                continue
            K = self.K_of(x)
            if K < -1e-9:
                continue
            if not any(a <= x <= b for a, b in self.real_segments()):
                continue
            if abs(np.polyval(np.polyadd(self.D, K * self.N), x)) > 1e-6 * max(1.0, abs(K)):
                continue
            res.append({"s": round(x, 4), "K": round(K, 4)})
        return sorted(res, key=lambda d: d["s"])

    # ---- 虚轴交点：s=jω 代入，实/虚部联立消 K ----
    def crossings(self):
        Dc, Nc = self.D.coeffs, self.N.coeffs
        def eo(c):
            n = len(c)
            e = [c[i] for i in range(n) if (n - 1 - i) % 2 == 0]
            o = [c[i] for i in range(n) if (n - 1 - i) % 2 == 1]
            return (np.poly1d(e) if e else np.poly1d([0.0]),
                    np.poly1d(o) if o else np.poly1d([0.0]))
        De, Do = eo(Dc); Ne, No = eo(Nc)
        R = De * No - Do * Ne
        out = []
        for x in np.roots(R.coeffs):
            if x.real >= -1e-9 or abs(x.imag) > 1e-7:
                continue
            w = float(np.sqrt(-x.real))
            if w <= 1e-9:
                continue
            K = -float(np.polyval(De.coeffs, x.real)) / float(np.polyval(Ne.coeffs, x.real)) \
                if abs(float(np.polyval(Ne.coeffs, x.real))) > 1e-12 else \
                -float(np.polyval(Do.coeffs, x.real)) / float(np.polyval(No.coeffs, x.real))
            if K < -1e-9 or not np.isfinite(K):
                continue
            if abs(np.polyval(np.polyadd(self.D, K * self.N), 1j * w)) > 1e-5 * max(1.0, abs(K)):
                continue
            out.append({"w": round(w, 4), "K": round(K, 4)})
        uniq, seen = [], set()
        for c in sorted(out, key=lambda d: d["w"]):
            k = (round(c["w"], 3), round(c["K"], 2))
            if k not in seen:
                seen.add(k); uniq.append(c)
        return uniq

    def asymptote(self):
        n, m = len(self.poles), len(self.zeros)
        q = n - m
        if q <= 0:
            return None, [], q
        sa = (sum(p.real for p in self.poles) - sum(z.real for z in self.zeros)) / q
        angs = sorted((2 * k + 1) * 180.0 / q for k in range(q))
        angs = [a - 360 if a > 180 else a for a in angs]
        return round(sa, 4), [round(a, 2) for a in angs], q

    # ---- K 对数扫掠 + 全排列最小代价分支匹配 ----
    def sweep(self, kmax, n_k=1500, extra_K=(), kstart=0.05):
        Ks = list(np.logspace(np.log10(kstart), np.log10(kmax), n_k))
        Ks += [k for k in extra_K if 0 < k <= kmax]
        Ks = np.unique(np.array(Ks))
        prev = np.roots(self.D)  # K=0 → 开环极点
        branches = [[complex(p)] for p in prev]
        for K in Ks:
            r = np.roots(np.polyadd(self.D, K * self.N))
            pv = np.array([b[-1] for b in branches])
            best, bestc = None, np.inf
            for perm in itertools.permutations(range(len(r))):
                c = sum(abs(pv[i] - r[perm[i]]) for i in range(len(r)))
                if c < bestc:
                    bestc, best = c, perm
            for i, b in enumerate(branches):
                b.append(r[best[i]])
        Ks = np.concatenate([[0.0], Ks])
        return Ks, [[(p.real, p.imag) for p in b] for b in branches]


def downsample(Ks, branch, maxpts=240, keep_K=()):
    n = len(Ks)
    if n <= maxpts:
        return list(range(n))
    idx = set(np.linspace(0, n - 1, maxpts).round().astype(int).tolist())
    for k in keep_K:
        i = int(np.argmin(np.abs(Ks - k)))
        idx.update([max(0, i - 1), i, min(n - 1, i + 1)])
    return sorted(idx)


def auto_groups(branches, ks_idx):
    """按同一 K 索引处虚部互反检测共轭分支对（实轴分支各自成组）。"""
    n = len(branches)
    assigned = [-1] * n
    groups = []
    for i in range(n):
        if assigned[i] >= 0:
            continue
        g = [i]
        for j in range(i + 1, n):
            if assigned[j] >= 0:
                continue
            ok = False
            for k in ks_idx:
                a, b = branches[i][k], branches[j][k]
                if abs(a[1]) > 1e-3 and abs(a[0] - b[0]) < 1e-3 and abs(a[1] + b[1]) < 1e-3:
                    ok = True
                    break
            if ok:
                g.append(j); assigned[j] = len(groups)
        assigned[i] = len(groups)
        groups.append(g)
    # 共轭对排前（亮蓝），实轴单支排后（深蓝）
    groups.sort(key=lambda g: len(g) == 1)
    return groups


def make_data(name, zeros, poles, kmax, xlim, ylim, groups=None, kmin=1e-2,
              circle=None, maxpts=240, kstart=0.05):
    loc = Locus(zeros, poles)
    brk = loc.breakaways()
    crs = loc.crossings()
    keep = [b["K"] for b in brk] + [c["K"] for c in crs]
    Ks, brs = loc.sweep(kmax, extra_K=keep, kstart=kstart)
    idx = downsample(Ks, brs[0], maxpts, keep)
    ks = [round(float(Ks[i]), 5) for i in idx]
    if groups is None:
        mid = [len(idx) // 2, 3 * len(idx) // 4]
        groups = auto_groups([[[b[i][0], b[i][1]] for i in idx] for b in brs], mid)
    sa, angs, _ = loc.asymptote()
    data = {
        "kmin": kmin, "kmax": float(kmax),
        "xlim": list(xlim), "ylim": list(ylim),
        "poles": [[round(p.real, 6), round(p.imag, 6)] for p in loc.poles],
        "zeros": [[z.real, z.imag] for z in loc.zeros],
        "segments": loc.real_segments(),
        "asym": {"sigma": sa, "angles": angs},
        "breakaways": brk, "crossings": crs,
        "ks": ks,
        "branches": [[[round(b[i][0], 5), round(b[i][1], 5)] for i in idx] for b in brs],
        "groups": groups,
    }
    if circle:
        data["circle"] = circle
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f"{name}.js").write_text(
        'RL.data["%s"] = %s;\n' % (name, json.dumps(data, ensure_ascii=False)
                                   .replace("Infinity", "1e999").replace("-1e999", "-1e999")),
        encoding="utf-8")
    return loc, brk, crs, (sa, angs)


def main():
    print("== intro  G=K/[s(0.5s+1)] → Δ=s²+2s+K₁ ==")
    loc, brk, crs, ay = make_data("intro", [], [0, -2], kmax=40,
                                  xlim=[-5.2, 1.4], ylim=[-3.5, 3.5], kstart=0.08)
    print("  实轴段:", loc.real_segments(), "期望 [-2,0]")
    print("  分离点:", brk, "期望 s=-1, K₁=1")
    print("  K₁=2 根:", np.round(np.sort_complex(loc.roots_at(2)), 3), "期望 -1±j1")

    print("== rule3  法则3判定示例 极点 0,-2,-5 零点 -3（仅零极点+实轴段） ==")
    loc3 = Locus([-3], [0, -2, -5])
    segs = loc3.real_segments()
    print("  实轴段:", segs, "期望 [-2,0] 与 [-5,-3]")
    data3 = {
        "kmin": 1e-2, "kmax": 10.0, "xlim": [-6.6, 1.4], "ylim": [-3.0, 3.0],
        "poles": [[0, 0], [-2, 0], [-5, 0]], "zeros": [[-3, 0]],
        "segments": segs, "asym": {"sigma": None, "angles": []},
        "breakaways": [], "crossings": [], "ks": [], "branches": [], "groups": [],
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "rule3.js").write_text('RL.data["rule3"] = %s;\n' % json.dumps(data3), encoding="utf-8")

    print("== ex53  G=K₁(s+2)/[s(s+1)] 圆轨迹 ==")
    loc, brk, crs, ay = make_data("ex53", [-2], [0, -1], kmax=60,
                                  xlim=[-7.0, 1.3], ylim=[-3.3, 3.3],
                                  circle={"cx": -2, "cy": 0, "r": round(2 ** 0.5, 5)}, kstart=0.03)
    print("  实轴段:", loc.real_segments(), "期望 [-1,0] 与 (-∞,-2]")
    print("  分离/会合:", brk, "期望 d1=-0.5858(K=0.1716), d2=-3.4142(K=5.8284)")
    k_d1 = next(b["K"] for b in brk if abs(b["s"] + 0.5858) < 0.01)
    k_d2 = next(b["K"] for b in brk if abs(b["s"] + 3.4142) < 0.01)
    print("  d1=-0.5858 解析 K₁=3-2√2=%.4f ↔ 数值 %.4f" % (3 - 2 * 2 ** 0.5, k_d1))
    print("  d2=-3.4142 解析 K₁=3+2√2=%.4f ↔ 数值 %.4f" % (3 + 2 * 2 ** 0.5, k_d2))
    print("  K₁=0.5 根(应在圆上):", np.round(np.sort_complex(loc.roots_at(0.5)), 4))
    for r in loc.roots_at(0.5):
        print("    |s+2|²=%.5f 期望=2" % abs(r + 2) ** 2)

    print("== ex52  G=K₁/[s(s+1)(s+2)] 综合例题 ==")
    loc, brk, crs, ay = make_data("ex52", [], [0, -1, -2], kmax=100,
                                  xlim=[-5.6, 1.5], ylim=[-3.7, 3.7],
                                  kstart=0.05)
    print("  实轴段:", loc.real_segments(), "期望 [-1,0] 与 (-∞,-2]")
    print("  渐近线:", ay, "期望 σa=-1, ±60°/180°")
    print("  分离点:", brk, "期望 d=-0.4226(K=0.385)，-1.5774 已舍")
    print("  虚轴交点:", crs, "期望 ±j1.4142, K₁=6")
    print("  d 解析: -1+√3/3=%.4f" % (-1 + 3 ** 0.5 / 3))

    print("== asymA  K*/[s(s+2)]（渐近线示例①）==")
    loc, brk, crs, ay = make_data("asymA", [], [0, -2], kmax=40,
                                  xlim=[-4.6, 1.2], ylim=[-3.2, 3.2], kstart=0.08)
    print("  渐近线:", ay, "期望 σa=-1, ±90°")
    print("  分离点:", brk, "期望 s=-1, K*=1")

    print("== asymB  K*/[s(s+1)(s+4)]（渐近线示例②）==")
    loc, brk, crs, ay = make_data("asymB", [], [0, -1, -4], kmax=120,
                                  xlim=[-6.2, 1.4], ylim=[-3.6, 3.6],
                                  kstart=0.05)
    print("  实轴段:", loc.real_segments(), "期望 [-1,0] 与 (-∞,-4]")
    print("  渐近线:", ay, "期望 σa=-1.6667, ±60°/180°")
    print("  分离点:", brk, "期望 s=-0.4651(K≈0.8796)")
    print("  虚轴交点:", crs, "期望 ±j2, K*=20")


if __name__ == "__main__":
    main()
