# Nyquist 图绘制技能（教学级 · 完整闭合曲线规范）

> 用途：当用户要求画**开环传递函数 G(s)H(s) 的 Nyquist 图（奈奎斯特图）**，
> 特别是用于课堂教学、且开环含**原点极点（Ⅰ/Ⅱ/Ⅲ 型系统）**时，按本规范绘制。
> 参考实现（Python + numpy + matplotlib）见文末，已通过两个标准算例验证。

---

## 1. 成图标准（一张合格的教材级 Nyquist 图必须同时满足）

1. **闭合曲线**：整条 Nyquist 曲线 = 两条频率支路 + 无穷远圆弧 + 原点附近
   闭合小弧，首尾相连构成一条闭合回路（对应 s 平面上完整的 Nyquist 回线）。
2. **无穷远用虚线**：|G|→∞ 的部分（无穷远大圆弧、支路向无穷延伸的尾段）
   一律用**虚线**绘制，并标注 "R→∞"；有限频率支路用实线。
3. **无穷远圆弧的圈数必须正确**：开环在原点有 ν 重极点时，圆弧从
   ∠(+90°×ν) 出发**顺时针**扫 **ν×180°** 到 ∠(−90°×ν)。
   Ⅰ型(ν=1)：右侧半圆 180°；Ⅱ型(ν=2)：整圆 360°；Ⅲ型(ν=3)：1.5 圈 540°。
   ν≥3 时圆弧自相重迭，画成两条半径略错开（±8%）的虚线弧并标注"第1圈/第2圈"。
4. **正负频率都画**：ω∈(0,+∞) 与 ω∈(−∞,0) 两条支路关于实轴互为镜像。
5. **标注临界点 −1**（红×）、**实轴交点**（交点坐标与对应 ω）、**行进方向箭头**
   （支路上 ω 增大方向；圆弧上顺时针方向）。
6. **给出判稳结论**：P（右半平面开环极点数）、N（曲线对 −1 的顺时针净包围
   圈数）、Z=P+N（右半平面闭环极点数），Z=0 且闭环极点实部全负 → 稳定。
7. 坐标轴为穿过原点的十字样式，横轴 Re、纵轴 Im，等比例纵横比。

## 2. 理论要点（画图前必须想清楚的对应关系）

**s 平面 Nyquist 回线**（顺时针方向，包围整个右半平面）：
虚轴从 −j∞ 向上到 +j∞（原点极点用**右侧小半圆**绕开，使极点在回线之外），
再经右半平面半径 ∞ 的大半圆（从 +j∞ 经 +∞ 回到 −j∞）回到起点。

**逐段映射**（设原点极点重数 ν，K0 = lim_{s→0} s^ν·G(s)）：

| s 回线分段 | G 的像 | 画法 |
|---|---|---|
| ω: −∞ → 0⁻ | G(jω)，正支路的共轭镜像 | 实线 |
| 原点右侧小半圆 s=εe^{jθ}, θ:−90°→+90° | K0/ε^ν · e^{−jνθ}：半径→∞ 的圆弧，从 ∠(+90°ν) 顺时针扫 ν×180° | **虚线**（示意半径 R_arc） |
| ω: 0⁺ → +∞ | G(jω) 频率支路 | 实线 |
| \|s\|=∞ 大半圆 | 严格真分式 → 收敛于原点 | 实线（原点附近小弧，使曲线闭合） |

支路实线画到 |G|=R_lo 为止；从 R_lo 到 R_arc 之间的延伸段画虚线（方向与
渐近方向一致时按真实 G(jω) 画尾段，否则用直虚线弦连到圆弧——两种都属
教材式示意）。K0<0 时整条圆弧相位再加 180°。

**约定**：N 以顺时针包围为正；P 只统计严格位于右半平面的开环极点（原点
及虚轴上的极点被豁口排除在外）；Z = P + N。

**非原点的虚轴极点**（如 s=±jωp）：同样在右侧作小半圆豁口，豁口弧的像是
"半径 ∞、顺时针 νp×180°"的圆弧，起点角由 G 在该极点处的留数辐角决定。
参考实现未覆盖此情形，需按同一方法手工补画。

## 3. 常见错误清单（AI 画 Nyquist 图的高频翻车点，逐条自查）

1. 只画 ω>0 半条支路，图不闭合——这是软件默认输出，教学场景不合格。
2. 完全漏画无穷远大圆弧，或把圆弧画成实线。
3. 圆弧圈数/方向错：ν 重原点极点必须 ν×180° 且顺时针；Ⅲ型画成 1 圈、
   或方向逆时针，都是错的。
4. Ⅰ型系统把无穷远弧画在左侧——错。G≈K0/s 时 ω→0⁺ 支路趋于 ∠−90°，
   弧从 ∠+90° 经**正实轴方向**（∠0°）转到 ∠−90°，在**右侧**。
5. 不标 −1 点、不标实轴交点、不画方向箭头。
6. 交点算错：交点必须满足 Im G(jω)=0，同步给出 ω 与 Re 值（例如
   5(s+1)(2s+1)/s³ 的交点是 ω=1/√2≈0.707、G=−30）。
7. 用 Bode 图、Nichols 图或零极点图冒充 Nyquist 图。
8. 判据符号混乱：教材通用约定 N（顺时针为正）与 Z=P+N，结论要与闭环
   特征根实际位置互相印证。

## 4. 绘图算法（参考实现的流程）

1. 输入 num、den（s 降幂系数）。求：ν（den 末尾连续零的个数）、K0、
   P（den 根中实部>0 的个数）；闭环极点 = roots(den+num)。
2. 扫描 ω∈(0,∞) 找 Im G(jω)=0 的实轴交点（变号区间二分精化）。
3. 定显示参数：特征尺度 F=max(1.6, 1.6×最大负实轴交点|Re|)；
   实线截止 R_lo=F；圆弧示意半径 R_arc=2.3F；坐标半宽 lim=1.35·R_arc；
   解 |G(jω)|=R_lo 得支路低端频率 w_a（对数二分）；回线大半圆半径
   Ω=max(50, 5×max|den,num 根|)。
4. 构造闭合曲线八段：镜像支路(−Ω→−w_a) → [虚线尾段] → 虚线弦 →
   无穷远圆弧(∠+90°ν 顺时针 ν×180°，ν≥3 时半径按 1±8%·sin(2πt)
   波动以分离重迭圈) → 虚线弦 → [虚线尾段] → 正支路(w_a→Ω) →
   s=∞ 半圆的真实映射（原点附近小弧，闭合回路）。
5. 数值自检（必须做，全过才算画对）：
   - 闭合残差 |首点−末点| ≈ 0；
   - 整条闭合折线对 −1 的缠绕数 N = −Δarg(G+1)/2π（取整）；
   - Z=P+N 应等于闭环极点中实部>0 的个数；
   - 实轴交点与理论值一致（见 §6）。
6. 标注：−1（红×）、交点（绿点+坐标）、ω 端点标签、方向箭头（支路按
   弧长 25% 处避开交点，圆弧每半圈一个）、"R→∞ 虚线圆弧 顺时针 ν×180°"、
   ν≥3 时"第1圈/第2圈"；标题下一行结论：ν、K0、P、N、Z 与稳定性、交点；
   大半径图加"原点附近放大"插图（看清曲线与 −1 的关系）。
7. 中文字体：Microsoft YaHei / SimHei，`axes.unicode_minus=False`；
   避免使用上标字符 ⁺⁻₀（雅黑缺字形），用 ω→0+ / K0 等普通字符。

## 5. 已验证参考实现（Python，单文件，输出 PNG + 控制台自检）

依赖：`numpy`、`matplotlib`。运行：`python nyquist.py` 画两个标准算例；
`python nyquist.py "10 15 5" "1 0 0 0"` 自定义分子/分母系数。

```python
# -*- coding: utf-8 -*-
"""教学用 Nyquist 图：完整闭合曲线 + 无穷远虚线圆弧 + 数值自检。"""
import os, sys
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import rcParams

rcParams["font.sans-serif"] = ["Microsoft YaHei", "SimHei", "DejaVu Sans"]
rcParams["axes.unicode_minus"] = False
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

def make_G(num, den):
    num = np.atleast_1d(np.asarray(num, float))
    den = np.atleast_1d(np.asarray(den, float))
    return lambda s: np.polyval(num, s) / np.polyval(den, s)

def analyze_gh(num, den):
    """返回 (nu, K0, P, jw_poles)。nu=原点极点重数, P=右半平面开环极点数."""
    den = np.atleast_1d(np.asarray(den, float))
    num = np.atleast_1d(np.asarray(num, float))
    nu = 0
    for c in den[::-1]:
        if abs(c) < 1e-12:
            nu += 1
        else:
            break
    if nu >= len(den):
        raise ValueError("分母全为零")
    K0 = num[::-1][0] / den[::-1][nu]          # s→0 时 G ≈ K0/s^nu
    roots = np.roots(den)
    jw = [r for r in roots if abs(r.real) < 1e-9 and abs(r.imag) > 1e-9]
    P = int(np.sum(roots.real > 1e-9))
    return nu, K0, P, jw

def solve_omega(G, R, w_lo=1e-6, w_hi=1e4):
    """解 |G(jω)|=R（低频段幅值单调下降，对数二分）。"""
    f = lambda w: abs(G(1j * w)) - R
    assert f(w_lo) > 0 > f(w_hi), "二分区间不包围目标幅值"
    for _ in range(200):
        mid = np.sqrt(w_lo * w_hi)
        if f(mid) > 0:
            w_lo = mid
        else:
            w_hi = mid
    return np.sqrt(w_lo * w_hi)

def real_axis_crossings(G, w_lo=1e-4, w_hi=1e3, n=4000):
    """ω>0 上 Im G(jω)=0 的交点，变号区间二分精化。"""
    w = np.logspace(np.log10(w_lo), np.log10(w_hi), n)
    gv = G(1j * w)
    out = []
    for k in range(len(w) - 1):
        if gv[k].imag * gv[k + 1].imag < 0:
            lo, hi, flo = w[k], w[k + 1], gv[k].imag
            for _ in range(80):
                mid = np.sqrt(lo * hi)
                fm = G(1j * mid).imag
                if flo * fm <= 0:
                    hi = mid
                else:
                    lo, flo = mid, fm
            wc = np.sqrt(lo * hi)
            out.append((wc, G(1j * wc).real))
    return out

def arrow_on_curve(ax, xs, ys, frac, color, lim, by_arclen=False):
    """在折线 frac 处沿行进方向画箭头；by_arclen=True 按弧长取点。"""
    n = len(xs)
    if by_arclen:
        c = np.concatenate([[0.0], np.cumsum(np.hypot(np.diff(xs),
                                                      np.diff(ys)))])
        i = int(np.clip(np.searchsorted(c, frac * c[-1]), 1, n - 2))
    else:
        i = int(np.clip(frac * (n - 1), 1, n - 2))
    dx, dy = xs[i + 1] - xs[i - 1], ys[i + 1] - ys[i - 1]
    L = np.hypot(dx, dy) or 1.0
    dx, dy = dx / L, dy / L
    s = 0.02 * lim
    ax.annotate("", xy=(xs[i] + 0.55 * s * dx, ys[i] + 0.55 * s * dy),
                xytext=(xs[i] - 0.55 * s * dx, ys[i] - 0.55 * s * dy),
                arrowprops=dict(arrowstyle="-|>", color=color, lw=1.7,
                                mutation_scale=15, shrinkA=0, shrinkB=0),
                zorder=6)

def nyquist_plot(num, den, title, fname, asymptote_re=None):
    G = make_G(num, den)
    nu, K0, P, jw_poles = analyze_gh(num, den)
    if jw_poles:
        print("警告：非原点虚轴极点 %s 需按同法另补豁口弧" % jw_poles)
    cl = np.roots(np.polyadd(np.atleast_1d(np.asarray(den, float)),
                             np.atleast_1d(np.asarray(num, float))))

    cross = real_axis_crossings(G)
    cross_sig = [c for c in cross if c[1] < -1e-9]
    F = max(1.6, 1.6 * max([abs(c[1]) for c in cross_sig] + [0.0]))
    if asymptote_re is not None:
        F = max(F, 2.2)
    R_lo, R_arc, lim = F, 2.3 * F, 1.35 * 2.3 * F
    w_a = solve_omega(G, R_lo)
    roots = np.concatenate([np.roots(np.atleast_1d(np.asarray(den, float))),
                            np.roots(np.atleast_1d(np.asarray(num, float)))])
    W_HI = max(50.0, 5.0 * float(np.max(np.abs(roots))))

    w_pos = np.logspace(np.log10(w_a), np.log10(W_HI), 900)
    branch_pos = G(1j * w_pos)                       # ω: +w_a → +Ω
    branch_neg = G(-1j * w_pos[::-1])                # ω: -Ω → -w_a（镜像）
    w_t = solve_omega(G, R_arc)
    wt = np.logspace(np.log10(w_t), np.log10(w_a), 400)
    tail_pos = G(1j * wt)                            # 虚线尾段（真实 G）
    tail_neg = G(-1j * wt[::-1])
    arc_origin = G(W_HI * np.exp(1j * np.linspace(np.pi / 2, -np.pi / 2,
                                                  400)))   # s=∞ 的像
    t = np.linspace(0, 1, 1200)                      # 无穷远圆弧
    phi = np.deg2rad(90.0 * nu + (180.0 if K0 < 0 else 0.0)) \
        - t * np.deg2rad(180.0 * nu)
    h = 0.08 if nu >= 3 else 0.0                     # 分离重迭圈
    arc_inf = R_arc * (1 + h * np.sin(2 * np.pi * t)) * np.exp(1j * phi)

    use_tail = bool(abs(np.angle(tail_pos[0] / arc_inf[-1]))
                    < np.deg2rad(35.0))   # 尾段与圆弧端同向才画尾段
    jn_neg = tail_neg[-1] if use_tail else branch_neg[-1]
    jn_pos = tail_pos[0] if use_tail else branch_pos[0]
    chord1 = np.array([jn_neg, arc_inf[0]])          # 教材式虚线弦
    chord2 = np.array([arc_inf[-1], jn_pos])

    closed = np.concatenate(
        [branch_neg] + ([tail_neg] if use_tail else [])
        + [chord1, arc_inf, chord2]
        + ([tail_pos] if use_tail else []) + [branch_pos, arc_origin])
    closure_res = abs(closed[0] - closed[-1])
    ang = np.unwrap(np.angle(closed + 1.0))
    N_cw = int(np.round(-(ang[-1] - ang[0]) / (2 * np.pi)))   # 顺时针为正
    Z, zrhp = P + N_cw, int(np.sum(cl.real > 1e-9))

    print("== %s ==" % title)
    print("  ν=%d K0=%g P=%d 交点=%s" % (nu, K0, P, cross or "无"))
    print("  N=%d Z=%d 右半平面闭环极点=%d %s 闭环极点=%s"
          % (N_cw, Z, zrhp, "✓" if Z == zrhp else "✗",
             np.sort_complex(cl)))
    print("  闭合残差=%.2e" % closure_res)
    assert closure_res < 1e-6 * R_arc and Z == zrhp, "自检失败"

    fig, ax = plt.subplots(figsize=(9.5, 8.6))
    BLUE, RED = "#1f5fbf", "#d62728"
    ax.plot(branch_pos.real, branch_pos.imag, "-", color=BLUE, lw=1.8,
            label="频率支路 G(jω)（ω>0 与 ω<0，实线）", zorder=3)
    ax.plot(branch_neg.real, branch_neg.imag, "-", color=BLUE, lw=1.8,
            zorder=3)
    ax.plot(arc_origin.real, arc_origin.imag, "-", color=BLUE, lw=1.3,
            label="s=∞ 半圆的映射（曲线在原点闭合）", zorder=3)
    ax.plot(arc_inf.real, arc_inf.imag, "--", color=RED, lw=2.0,
            dashes=(7, 4), zorder=4,
            label="无穷远圆弧：顺时针 %d×180°=%d°（R→∞，虚线示意）"
                  % (nu, nu * 180))
    for seg in [chord1, chord2] + ([tail_pos, tail_neg] if use_tail
                                   else []):
        ax.plot(seg.real, seg.imag, "--", color=RED, lw=2.0, dashes=(7, 4),
                zorder=4)
    for pt in (jn_neg, arc_inf[0], arc_inf[-1], jn_pos):
        ax.plot(pt.real, pt.imag, "o", color=RED, ms=4, zorder=5)

    arrow_on_curve(ax, branch_pos.real, branch_pos.imag, 0.25, BLUE, lim,
                   by_arclen=True)
    arrow_on_curve(ax, branch_neg.real, branch_neg.imag, 0.75, BLUE, lim,
                   by_arclen=True)
    fracs = [(k + 0.5) / nu for k in range(nu)] + ([0.25, 0.75] if nu == 1
                                                   else [])
    for f in fracs:
        arrow_on_curve(ax, arc_inf.real, arc_inf.imag, f, RED, lim)

    ax.plot(-1, 0, "x", color=RED, ms=14 if R_arc > 8 else 12,
            mew=3.0 if R_arc > 8 else 2.5, zorder=6)
    ax.text(-1, 0.05 * lim, "−1", color=RED, ha="center")
    for wc, gc in cross_sig:
        ax.plot(gc, 0, "o", color="#2ca02c", ms=6, zorder=6)
        ax.annotate("(%.6g, j0)\nω=%.6g" % (gc, wc), xy=(gc, 0),
                    xytext=(gc * 1.02, -0.17 * lim), ha="center",
                    fontsize=8.5, color="#2ca02c",
                    arrowprops=dict(arrowstyle="->", color="#2ca02c",
                                    lw=0.8))
    if asymptote_re is not None:
        ax.axvline(asymptote_re, ls=":", color="0.45", lw=1)
        ax.text(asymptote_re, -0.93 * lim, "渐近线 Re(G)=−1", color="0.35",
                fontsize=8.5, rotation=90, va="bottom", ha="right")

    ax.text(0.16 * lim, -0.13 * lim, "ω=+∞（支路终端）", fontsize=8,
            color=BLUE, ha="left")
    ax.text(0.16 * lim, 0.13 * lim, "ω=−∞（支路起点）", fontsize=8,
            color=BLUE, va="bottom", ha="left")
    ax.text(jn_pos.real - 0.08 * R_arc,
            jn_pos.imag + 0.06 * R_arc * np.sign(jn_pos.imag),
            "ω→0+", fontsize=8.5, color=RED, ha="right")
    ax.text(jn_neg.real - 0.08 * R_arc,
            jn_neg.imag + 0.06 * R_arc * np.sign(jn_neg.imag),
            "ω→0−", fontsize=8.5, color=RED, ha="right")
    ax.text(0.45 * R_arc, 0.50 * R_arc,
            "R→∞ 虚线圆弧\n顺时针 %d×180°=%d°" % (nu, nu * 180),
            color=RED, fontsize=9, ha="center")
    if nu >= 3:
        ax.text(-1.20 * R_arc, -0.02 * R_arc, "第1圈", color=RED,
                fontsize=7.5, rotation=90, va="center", ha="center")
        ax.text(-0.82 * R_arc, 0.02 * R_arc, "第2圈", color=RED,
                fontsize=7.5, rotation=90, va="center", ha="center")

    stable = (Z == 0) and bool(np.all(cl.real < 0))
    ax.text(0.5, 1.018,
            "ν=%d（K0=%g）  P=%d  N=%d（对 −1 顺时针净包围圈数）  "
            "Z=P+N=%d → 闭环%s   |   %s"
            % (nu, K0, P, N_cw, Z, "稳定" if stable else "不稳定",
               ("实轴交点: ω=%.5g → G=%.5g" % cross_sig[0]
                if cross_sig else "与负实轴无有限交点")),
            transform=ax.transAxes, ha="center", fontsize=9.3,
            color="#333333")

    ax.set_xlim(-lim, lim); ax.set_ylim(-lim, lim)
    ax.set_aspect("equal")
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    ax.spines["left"].set_position("zero")
    ax.spines["bottom"].set_position("zero")
    ax.grid(True, ls=":", alpha=0.35)
    ax.tick_params(labelsize=8.5)
    ax.text(0.965 * lim, 0.03 * lim, "Re", fontsize=11)
    ax.text(0.025 * lim, 0.955 * lim, "Im", fontsize=11)

    if R_arc > 8:                       # 原点附近放大，看清曲线与 -1 的关系
        axi = ax.inset_axes([0.60, 0.045, 0.37, 0.37])
        for xs, ys in ((branch_pos.real, branch_pos.imag),
                       (branch_neg.real, branch_neg.imag)):
            axi.plot(xs, ys, "-", color=BLUE, lw=1.3)
        axi.plot(arc_origin.real, arc_origin.imag, "-", color=BLUE, lw=1.1)
        axi.plot(arc_inf.real, arc_inf.imag, "--", color=RED, lw=1.2,
                 dashes=(6, 4))
        axi.plot(-1, 0, "x", color=RED, ms=10, mew=2.2)
        axi.set_xlim(-2.6, 2.0); axi.set_ylim(-2.2, 2.2)
        axi.set_aspect("equal")
        axi.grid(True, ls=":", alpha=0.4)
        axi.tick_params(labelsize=7)
        axi.set_title("原点附近放大", fontsize=8.5)

    ax.set_title("%s 的 Nyquist 图（完整闭合曲线，虚线=|G|→∞）" % title,
                 fontsize=12.5, pad=30)
    ax.legend(loc="upper center", bbox_to_anchor=(0.5, -0.03), fontsize=8.5,
              frameon=False)
    fig.subplots_adjust(bottom=0.17)
    fig.savefig(fname, dpi=200, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    return {"nu": nu, "K0": K0, "P": P, "N": N_cw, "Z": Z,
            "cross": cross, "cross_sig": cross_sig, "cl": cl,
            "closure": closure_res, "R_arc": R_arc}

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    if len(sys.argv) == 3:
        coef = lambda s: [float(x) for x in s.replace(",", " ").split()]
        nyquist_plot(coef(sys.argv[1]), coef(sys.argv[2]), "G(s)H(s)",
                     "nyquist_custom.png")
        sys.exit(0)
    r1 = nyquist_plot([1.0], [1.0, 1.0, 0.0],
                      r"$G(s)H(s)=\frac{1}{s(s+1)}$",
                      "nyquist_case1.png", asymptote_re=-1.0)
    r2 = nyquist_plot([10.0, 15.0, 5.0], [1.0, 0.0, 0.0, 0.0],
                      r"$G(s)H(s)=\frac{5(s+1)(2s+1)}{s^{3}}$",
                      "nyquist_case2.png")
    G1 = make_G([1.0], [1.0, 1.0, 0.0])
    assert abs(G1(1j) - (-0.5 - 0.5j)) < 1e-12
    assert not r1["cross"] and r1["N"] == 0 and r1["Z"] == 0
    (w2, g2), = r2["cross_sig"]
    assert abs(w2 - 1 / np.sqrt(2)) < 1e-4 and abs(g2 + 30.0) < 1e-6
    assert r2["N"] == 0 and r2["Z"] == 0
    print("全部自检通过")
```

（上面是已验证的精简版实现，与同目录 `nyquist.py` 算法一致、自检相同，
两个算例的成品图 `nyquist_case1.png`、`nyquist_case2.png` 与脚本在同目录。）

## 6. 验收自检清单（对任何实现都适用，含标准答案）

用以下两个标准算例验收，全部吻合才算实现正确：

**算例 1：G = 1/(s(s+1))**
- ν=1，K0=1，P=0；两支路位于 −1<Re<0，低频渐近线 Re=−1；
  **与负实轴无有限交点**；G(j1) = −0.5−j0.5（抽查用）。
- 无穷远弧：右半平面半圆，从 (0,+R) 经 (+R,0) 顺时针到 (0,−R)，180°。
- N=0，Z=0，闭环极点 −0.5±j0.866，稳定。

**算例 2：G = 5(s+1)(2s+1)/s³ = (10s²+15s+5)/s³**
- ν=3，K0=5，P=0；支路在 ω=1/√2≈0.707107 处穿过负实轴 **G=−30**。
- 无穷远弧：顺时针 **3×180°=540°（1.5 圈）**，从 ∠−90°（下）起、
  ∠+90°（上）止；左侧出现两次错开的弧段。
- N=0（虽然曲线经过 −30 的左侧，但净包围为 0），Z=0；
  闭环特征方程 s³+10s²+15s+5，极点 ≈ −0.479、−1.264、−8.257，稳定。

**通用检查**：曲线闭合（首尾残差≈0）；缠绕数 N 与闭环极点互相印证；
虚线只用于 |G|→∞ 的部分；−1、交点、方向箭头、结论行齐全。
