# -*- coding: utf-8 -*-
"""根轨迹数据生成与关键点解析交叉验证（第五章 R1 红线工具）

- 对特征方程 D(s) ± K·N(s) = 0（mode "180" 取 +，mode "0" 取 −）在 K∈[0,kmax]
  对数加密网格上用 numpy.roots 扫掠，按分支连续性（最小代价全排列匹配）排序；
- 分离/会合点：dK/ds=0 解析求根 + 实轴段判据 + K≥0 + 代回特征方程四重校验；
- 与虚轴交点：偶/奇部消元（resultant）精确解 ω、K，另给劳斯临界 K 互证；
- 输出 JSON（branches 每分支 ≤maxpts 点列 + keypoints），供页面嵌入。

用法：
  from qa.rlocus_gen import *  （qa 目录下脚本 import 本文件）
  python qa/rlocus_gen.py          → 运行第五章全部例题自检并打印对照表
"""
import json
import itertools
import numpy as np


def poly_from_roots(roots):
    """由根列表求首一实系数多项式系数（高次→低次）。空列表返回 [1]。"""
    roots = [complex(r) for r in roots]
    if not roots:
        return np.array([1.0])
    c = np.array([1.0 + 0j])
    for r in roots:
        c = np.polymul(c, np.array([1.0, -r]))
    return np.real_if_close(c, tol=1e5).real if np.max(np.abs(c.imag)) < 1e-6 else c


class TF:
    """开环传递函数 N(s)/D(s)，N、D 为实系数数组（高次→低次）。"""

    def __init__(self, num, den):
        self.num = np.poly1d(np.asarray(num, dtype=float))
        self.den = np.poly1d(np.asarray(den, dtype=float))
        self.gain = self.num.coeffs[0] / self.den.coeffs[0]
        self.mon_num = np.poly1d(self.num.coeffs / self.num.coeffs[0])
        self.mon_den = np.poly1d(self.den.coeffs / self.den.coeffs[0])

    @classmethod
    def from_zp(cls, zeros=(), poles=(), gain=1.0):
        return cls(gain * poly_from_roots(zeros), poly_from_roots(poles))

    def roots_at(self, K, mode="180"):
        """特征方程 D ± K·N = 0 的根。"""
        sign = 1.0 if mode == "180" else -1.0
        poly = np.polyadd(self.mon_den, sign * K * self.mon_num)
        return np.roots(poly)

    def K_of(self, s, mode="180"):
        """s 处对应的根轨迹增益（mode "180": K=−D/N；mode "0": K=+D/N）。"""
        v = self.den(s) / self.num(s)
        return -v if mode == "180" else v

    # ---- 实轴根轨迹段（含 K≥0 校验）----
    def real_segments(self, mode="180", kmin=0.0):
        zr_all = [complex(z) for z in np.roots(self.mon_num)]
        pr_all = [complex(p) for p in np.roots(self.mon_den)]
        zr = sorted(z.real for z in zr_all)
        pr = sorted(p.real for p in pr_all)
        pts = sorted(set([round(v, 9) for v in zr + pr]))
        if not pts:
            return []
        bounds = [pts[0] - 1.0] + pts + [pts[-1] + 1.0]
        segs, cur = [], None
        for a, b in zip(bounds, bounds[1:]):
            m = (a + b) / 2
            n_right = int(np.sum([z.real > m + 1e-9 for z in zr_all])) + \
                int(np.sum([p.real > m + 1e-9 for p in pr_all]))
            angle_ok = (n_right % 2 == 1) if mode == "180" else (n_right % 2 == 0)
            K = self.K_of(m + 0j, mode).real if abs(self.num(m + 0j)) > 1e-12 else np.inf
            on = angle_ok and (K >= kmin - 1e-9)
            if on and cur is None:
                cur = [a, b]
            elif on:
                cur[1] = b
            elif cur is not None:
                segs.append(tuple(cur)); cur = None
        if cur is not None:
            segs.append(tuple(cur))
        # 最左/最右区段无界（延伸到 ±∞）
        out = []
        lo, hi = bounds[0], bounds[-1]
        for a, b in segs:
            aa = -np.inf if a <= lo + 1e-9 else a
            bb = np.inf if b >= hi - 1e-9 else b
            out.append((float(aa), float(bb)))
        return out

    def on_real_locus(self, x, mode="180", tol=1e-7):
        return any(a - tol <= x <= b + tol for a, b in self.real_segments(mode))

    # ---- 分离/会合点：dK/ds = 0（解析多项式求根）----
    def breakaway_points(self, mode="180", kmin=0.0):
        N, D = self.mon_num, self.mon_den
        P = np.polymul(np.polyder(D), N) - np.polymul(D, np.polyder(N))
        cands = []
        for r in np.roots(P):
            if abs(r.imag) > 1e-6:
                continue
            x = r.real
            if abs(self.num(x + 0j)) < 1e-9:      # 分母为零处（开环零点）非分离点
                continue
            K = self.K_of(x + 0j, mode).real
            if K < kmin - 1e-9:
                continue
            if not self.on_real_locus(x, mode):
                continue
            # 代回特征方程校验
            res = np.polyval(np.polyadd(self.mon_den, (1 if mode == "180" else -1) * K * self.mon_num), x)
            if abs(res) > 1e-6 * max(1.0, abs(K)):
                continue
            cands.append({"s": round(x, 4), "K": round(K, 4)})
        return sorted(cands, key=lambda d: d["s"])

    # ---- 与虚轴交点：偶/奇部消元 ----
    def jw_crossings(self, mode="180", kmin=0.0):
        sign = 1.0 if mode == "180" else -1.0
        N, D = self.mon_num.coeffs, self.mon_den.coeffs
        def even_odd(c):
            c = np.asarray(c, dtype=float)
            n = len(c)
            e = [c[i] for i in range(n) if (n - 1 - i) % 2 == 0]
            o = [c[i] for i in range(n) if (n - 1 - i) % 2 == 1]
            return np.poly1d(e) if e else np.poly1d([0.0]), np.poly1d(o) if o else np.poly1d([0.0])
        De, Do = even_odd(D)
        Ne, No = even_odd(N)
        # 以 s=jω 代入 D±KN=0：实部 De(x)+K·Ne(x)=0，虚部 ω·(Do(x)+K·No(x))=0，x=−ω²
        # 消 K：De(x)·No(x) − Do(x)·Ne(x) = 0（poly1d 运算自动对齐长度）
        R = De * No - Do * Ne
        out = []
        for x in np.roots(R.coeffs):
            if x >= -1e-9:
                continue
            w2 = -x
            if w2 <= 1e-12:
                continue
            w = float(np.sqrt(w2))
            # K = −De(x)/Ne(x)（Ne(x)≈0 时改用奇部求 K）
            if abs(float(np.polyval(Ne.coeffs, x))) > 1e-12:
                K = -float(np.polyval(De.coeffs, x)) / float(np.polyval(Ne.coeffs, x))
            else:
                K = -float(np.polyval(Do.coeffs, x)) / float(np.polyval(No.coeffs, x))
            if K < kmin - 1e-9 or not np.isfinite(K):
                continue
            # 代回校验：D(jω) ± K·N(jω) ≈ 0
            val = np.polyval(np.polyadd(self.mon_den, sign * K * self.mon_num), 1j * w)
            if abs(val) > 1e-5 * max(1.0, abs(K)):
                continue
            out.append({"s": round(w, 4), "K": round(K, 4)})
        # 去重
        uniq, seen = [], set()
        for c in sorted(out, key=lambda d: d["s"]):
            key = (round(c["s"], 3), round(c["K"], 2))
            if key not in seen:
                seen.add(key); uniq.append(c)
        return uniq

    # ---- 渐近线 ----
    def asymptote(self):
        zr = [z.real for z in np.roots(self.mon_num)]
        pr = [p.real for p in np.roots(self.mon_den)]   # 复极点也贡献实部
        n, m = len(self.mon_den.coeffs) - 1, len(self.mon_num.coeffs) - 1
        q = n - m
        sa = (sum(pr) - sum(zr)) / q if q > 0 else None
        angs = [(2 * k + 1) * 180.0 / q for k in range(q)] if q > 0 else []
        return sa, angs, q

    # ---- K 扫掠 + 分支连续匹配 ----
    def locus(self, mode="180", kmax=100.0, n_k=1500, extra_K=(), kstart=1e-6):
        Ks = list(np.logspace(np.log10(kstart), np.log10(kmax), n_k))
        Ks += [k for k in extra_K if 0 <= k <= kmax]
        Ks = np.unique(np.array(Ks, dtype=float))
        prev = self.roots_at(0.0, mode) if False else None
        # K≈0 的根 → 开环极点（首一化后 K=0 即 den 的根）
        prev = np.roots(self.mon_den)
        order0 = sorted(range(len(prev)), key=lambda i: (round(prev[i].imag, 6), prev[i].real))
        branches = [[complex(prev[i])] for i in range(len(prev))]
        for K in Ks:
            r = self.roots_at(K, mode)
            n = len(r)
            if n != len(branches):        # 阶数保护（不应发生）
                branches = [b for b in branches]
            # 全排列最小代价匹配
            best, bestc = None, np.inf
            pv = np.array([b[-1] for b in branches])
            for perm in itertools.permutations(range(n)):
                c = sum(abs(pv[i] - r[perm[i]]) for i in range(n))
                if c < bestc:
                    bestc, best = c, perm
            for i, b in enumerate(branches):
                b.append(r[best[i]])
        return Ks, [[(pt.real, pt.imag) for pt in b] for b in branches]


def downsample(Ks, branch, maxpts=220, keep_K=()):
    """均匀（按序号）+ 保留关键 K 索引的抽稀。"""
    n = len(Ks)
    if n <= maxpts:
        return branch
    idx = set(np.linspace(0, n - 1, maxpts).round().astype(int).tolist())
    for k in keep_K:
        i = int(np.argmin(np.abs(Ks - k)))
        idx.update([max(0, i - 1), i, min(n - 1, i + 1)])
    return [branch[i] for i in sorted(idx)]


def figure_data(tf, mode="180", kmax=None, xlim=None, ylim=None, maxpts=220,
                breakaways=None, crossings=None, kfloor=1e-6):
    """生成单张根轨迹图的页面 JSON 数据。"""
    if kmax is None:
        kmax = 1e4
    extra = [d["K"] for d in (breakaways or [])] + [d["K"] for d in (crossings or [])]
    extra += [k / 2 for k in extra] + [k * 2 for k in extra]
    Ks, brs = tf.locus(mode=mode, kmax=kmax, n_k=1600, extra_K=extra, kstart=kfloor)
    keep = list(extra)
    data = {
        "mode": mode,
        "kmax": float(kmax),
        "zeros": [[round(float(np.real(z)), 4), round(float(np.imag(z)), 4)]
                  for z in np.roots(tf.mon_num)],
        "poles": [[round(float(np.real(p)), 4), round(float(np.imag(p)), 4)]
                  for p in np.roots(tf.mon_den)],
        "branches": [downsample(Ks, b, maxpts, keep) for b in brs],
    }
    if xlim: data["xlim"] = list(xlim)
    if ylim: data["ylim"] = list(ylim)
    sa, angs, q = tf.asymptote()
    data["asym"] = {"sigma": round(sa, 4) if sa is not None else None,
                    "angles": [round(a, 2) for a in angs]}
    data["breakaways"] = breakaways or tf.breakaway_points(mode)
    data["crossings"] = crossings or tf.jw_crossings(mode)
    data["segments"] = [[round(a, 4), round(b, 4)] for a, b in tf.real_segments(mode)]
    return data


# ---------------- 第五章例题自检 ----------------
def _verify():
    P = print
    P("== 例5-2  G=K1/[s(s+1)(s+2)] ==")
    tf = TF([1], [1, 3, 2, 0])
    P(" 分离点(解析):", tf.breakaway_points(), " 期望 d=-0.4226(K=0.385)，-1.577 舍去")
    P(" 虚轴交点:", tf.jw_crossings(), " 期望 ±j1.4142, K=6")
    P(" 渐近线:", tf.asymptote(), " 期望 σa=-1, ±60°,180°")

    P("== 例5-3  G=K1(s+2)/[s(s+1)]（原书 p16，圆轨迹） ==")
    tf = TF([1, 2], [1, 1, 0])
    P(" 实轴段:", tf.real_segments(), " 期望 [-1,0] 与 (-∞,-2]")
    P(" 分离/会合点:", tf.breakaway_points(), " 期望 d1=-0.5858(K=0.1716), d2=-3.4142(K=5.8284)")
    P(" 圆轨迹验证: (σ+2)²+ω²=2（圆心-2 半径√2），见 figure_data")
    P(" Δ=K1²-6K1+1=0 → K1=3±2√2=0.1716/5.8284")

    P("== 例5-4/5-5/5-6  G=K1/[s(s+3)(s^2+2s+2)] ==")
    tf = TF([1], np.polymul([1, 3, 0], [1, 2, 2]))
    P(" 渐近线:", tf.asymptote(), " 期望 σa=-1.25, ±45°,±135°")
    P(" 分离点:", tf.breakaway_points(), " 期望 -2.2889(K≈4.332) 实轴")
    P(" 虚轴交点:", tf.jw_crossings(), " 期望 ±j1.0954, K=8.16")
    r = tf.roots_at(2.91)
    P(" K1=2.91 极点:", np.round(np.sort_complex(r), 3), " 期望 -2.735,-1.543,-0.361±j0.748")
    r = tf.roots_at(2.62)
    P(" K1=2.62 极点:", np.round(np.sort_complex(r), 3), " 期望 -2.79,-1.41,-0.4±j0.7 (例5-13)")

    P("== 例5-7  G=K1/[s(s+4)(s^2+4s+20)] ==")
    tf = TF([1], np.polymul([1, 4, 0], [1, 4, 20]))
    P(" 渐近线:", tf.asymptote(), " 期望 σa=-2, ±45°,±135°")
    P(" 分离点:", tf.breakaway_points(), " 期望 -2(K=64), -2±j2.449")
    P(" 虚轴交点:", tf.jw_crossings(), " 期望 ±j3.1623(√10), K=260 ←spec 中 60 为 OCR 误")

    P("== 例5-8  等效 G*=a·s/[(s+j2)(s-j2)] ==")
    tf = TF([1, 0], [1, 4])
    P(" 会合点:", tf.breakaway_points(), " 期望 -2；零度无")

    P("== 例5-10(零度)  K1/[s(s+1)(s+2)] mode 0 ==")
    tf = TF([1], [1, 3, 2, 0])
    P(" 实轴段:", tf.real_segments("0"), " 期望 [-2,-1] 与 [0,+∞)")
    P(" 分离点:", tf.breakaway_points("0"), " 期望 -1.577")

    P("== 例5-12  K1(s^2-2s+5)/[(s+2)(s-0.5)] ==")
    tf = TF([1, -2, 5], np.polymul([1, 2], [1, -0.5]))
    P(" 分离点:", tf.breakaway_points(), " 期望 -0.41(K≈0.242)")
    P(" 虚轴交点:", tf.jw_crossings(), " 期望 ±j1.2536, K=0.75")
    a = tf.roots_at(0.2); b = tf.roots_at(0.75)
    P(" K=0.2 极点:", np.round(np.sort_complex(a), 3), "（含原点极点→临界）")
    P(" K=0.75 极点:", np.round(np.sort_complex(b), 3), "（±j1.25→临界）")

    P("== 例5-14  特征式 0.16s^3+1.8s^2+(5+0.8K)s+K，K=28.7 ==")
    D = [0.16, 1.8, 5 + 0.8 * 28.7, 28.7]
    P(" 极点:", np.round(np.sort_complex(np.roots(D)), 3))

    P("== 例5-15  Φ=2.7/(s^3+5s^2+4s+2.7) ==")
    P(" 极点:", np.round(np.sort_complex(np.roots([1, 5, 4, 2.7])), 4),
      " 期望 -4.2010, -0.3995±j0.6960")
    P(" 7.2 版极点(原素材矛盾):", np.round(np.sort_complex(np.roots([1, 5, 4, 7.2])), 4))

    P("== 例5-16  K1(s+b)/[s^2(s+a)] 五情形（a=1 示例）==")
    for tag, b in [("b→∞(无零点)", None), ("b>a: b=2", 2.0), ("b=a: b=1", 1.0), ("b<a: b=0.5", 0.5)]:
        if b is None:
            tf = TF([1], [1, 1, 0, 0])
        else:
            tf = TF([1, b], [1, 1, 0, 0])
        sa, angs, q = tf.asymptote()
        P(f" {tag}: σa={sa:.3f}, 角度={angs}")

    P("== 例6-8 相关（备用）==")
    P("done")


if __name__ == "__main__":
    _verify()
