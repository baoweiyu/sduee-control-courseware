# -*- coding: utf-8 -*-
"""
nyquist.py —— 教学用 Nyquist 图绘制（完整闭合曲线，无穷远圆弧画虚线）

为什么需要这个脚本
------------------
MATLAB 的 nyquist / Python control 的 NyquistPlot 默认只画 ω∈(0,+∞) 的频率
支路，遇到开环含原点极点的 Ⅰ/Ⅱ/Ⅲ 型系统时，图既不闭合、也缺少"|G|→∞ 的
大圆弧"，与教材上的标准 Nyquist 图不一致，课堂教学容易误读。

本脚本按教材口径补全整条映射闭合曲线。s 平面 Nyquist 回路（右半平面、顺时针
方向、原点极点用右侧小半圆绕开）分四段，逐段求 G(s) 的像：

    ① ω: -Ω → -w_a   负频率支路（正支路关于实轴的镜像，实线）
    ② 原点右侧小豁口  像 = 半径 R→∞ 的大圆弧，从 ∠+90°×ν 顺时针扫 ν×180°
                       到 ∠-90°×ν（虚线示意，ν 为原点极点重数）
    ③ ω: +w_a → +Ω   正频率支路（实线）
    ④ |s|=Ω 无穷大半圆  严格真分式时像收敛于原点附近，把曲线闭合回起点

②④两段在教材里都取"示意半径"绘制：②画成半径 R_arc 的虚线圆弧并标注
R→∞，支路与圆弧之间用虚线直线段衔接（代表 |G| 超出显示范围的延伸段）；
④按真实映射画在原点附近（很小，正好演示"曲线在原点闭合"）。

脚本同时做数值自检：闭合残差、整条闭合曲线对 -1 的缠绕数 N、Z=P+N 与闭环
极点实部符号是否一致、实轴交点的频率与坐标。

用法：
    python nyquist.py                  # 画本文两个教学算例并自检
    python nyquist.py "10 15 5" "1 0 0 0"   # 自定义：分子、分母系数（s 降幂）
"""

import os
import sys

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


# ---------------------------------------------------------------- 基础工具
def make_G(num, den):
    """num/den 为 s 的降幂系数数组，返回复函数 G(s)。"""
    num = np.atleast_1d(np.asarray(num, float))
    den = np.atleast_1d(np.asarray(den, float))
    return lambda s: np.polyval(num, s) / np.polyval(den, s)


def analyze_gh(num, den):
    """返回 (nu, K0, P, jw_poles)：原点极点重数、低频增益、右半平面极点数、
    非原点虚轴极点。"""
    den = np.atleast_1d(np.asarray(den, float))
    num = np.atleast_1d(np.asarray(num, float))
    nu = 0
    for c in den[::-1]:                 # 降幂系数末尾连续 0 的个数 = 原点极点重数
        if abs(c) < 1e-12:
            nu += 1
        else:
            break
    if nu >= len(den):
        raise ValueError("分母全为零")
    K0 = num[::-1][0] / den[::-1][nu]   # s→0 时 G(s) ≈ K0 / s^nu
    roots = np.roots(den)
    jw_poles = [r for r in roots if abs(r.real) < 1e-9 and abs(r.imag) > 1e-9]
    P = int(np.sum(roots.real > 1e-9))
    return nu, K0, P, jw_poles


def solve_omega(G, R, w_lo=1e-6, w_hi=1e4):
    """解 |G(jω)| = R。低频段 |G(jω)| 随 ω 单调下降，对数二分即可。"""
    f = lambda w: abs(G(1j * w)) - R
    if f(w_lo) < 0 or f(w_hi) > 0:
        raise RuntimeError("二分区间不包围目标幅值，请调整 w_lo/w_hi")
    for _ in range(200):
        mid = np.sqrt(w_lo * w_hi)
        if f(mid) > 0:
            w_lo = mid
        else:
            w_hi = mid
    return np.sqrt(w_lo * w_hi)


def real_axis_crossings(G, w_lo=1e-4, w_hi=1e3, n=4000):
    """ω>0 支路与实轴的交点，返回 [(omega, G_real), ...]。"""
    w = np.logspace(np.log10(w_lo), np.log10(w_hi), n)
    gv = G(1j * w)
    out = []
    for k in range(len(w) - 1):
        y0, y1 = gv[k].imag, gv[k + 1].imag
        if y0 * y1 < 0:
            lo, hi, flo = w[k], w[k + 1], y0
            for _ in range(80):            # 对 Im(G(jω)) 的变号区间二分精化
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
    """在折线 (xs,ys) 的 frac 处沿行进方向画一个箭头。
    by_arclen=True 时 frac 按累计弧长解释（对 |G| 剧烈变化的支路更均匀）。"""
    n = len(xs)
    if by_arclen:
        d = np.hypot(np.diff(xs), np.diff(ys))
        c = np.concatenate([[0.0], np.cumsum(d)])
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


# ---------------------------------------------------------------- 主绘图
def nyquist_plot(num, den, title, fname, asymptote_re=None):
    """画一张教材级闭合 Nyquist 图，返回自检结果字典。"""
    G = make_G(num, den)
    nu, K0, P, jw_poles = analyze_gh(num, den)
    if jw_poles:
        print("  警告：存在非原点的虚轴极点 %s，本脚本只处理原点极点，"
              "其余豁口弧需按同样方法人工补充。" % jw_poles)

    cl_poles = np.roots(np.polyadd(np.atleast_1d(np.asarray(den, float)),
                                   np.atleast_1d(np.asarray(num, float))))

    # ---- 显示参数 ------------------------------------------------------
    cross = real_axis_crossings(G)
    cross_sig = [c for c in cross if c[1] < -1e-9]      # 负实轴上的交点
    F = max(1.6, 1.6 * max([abs(c[1]) for c in cross_sig] + [0.0]))
    if asymptote_re is not None:
        F = max(F, 2.2)          # 有渐近线时把实线支路画长一点，便于看出趋势
    R_lo = F                     # 实线支路画到 |G| = R_lo
    R_arc = 2.3 * F              # 无穷远圆弧的示意半径
    lim = 1.35 * R_arc           # 坐标范围（留出整圆 + 标注空间）
    w_a = solve_omega(G, R_lo)   # 实线支路的低端频率（|G(jw_a)| = R_lo）

    all_roots = np.concatenate([np.roots(np.atleast_1d(np.asarray(den, float))),
                                np.roots(np.atleast_1d(np.asarray(num, float)))])
    W_HI = max(50.0, 5.0 * float(np.max(np.abs(all_roots))))  # s 回路大半圆半径

    # ---- 各段曲线 ------------------------------------------------------
    w_pos = np.logspace(np.log10(w_a), np.log10(W_HI), 900)
    branch_pos = G(1j * w_pos)              # ③ ω: +w_a → +Ω
    w_neg = -w_pos[::-1]
    branch_neg = G(1j * w_neg)              # ① ω: -Ω → -w_a（镜像支路）

    # 实线支路只画到 |G|=R_lo。从 R_lo 到 R_arc 这一段：若真实 G(jω) 尾段的
    # 方向与圆弧端方向接近（如 1/(s(s+1)) 贴渐近线伸向 ±90°），按真实 G 画虚
    # 线尾段；否则（如三重极点支路在显示半径处仍指向 ±150°）退回教材式画法
    # ——从支路端点直接用虚线弦连到示意圆弧，避免"折返"造成视觉断裂。
    w_t = solve_omega(G, R_arc)
    wt = np.logspace(np.log10(w_t), np.log10(w_a), 400)
    tail_pos = G(1j * wt)                   # ω: +w_t → +w_a（自外向内）
    tail_neg = G(-1j * wt[::-1])            # ω: -w_a → -w_t（自内向外）

    thO = np.linspace(np.pi / 2, -np.pi / 2, 400)
    arc_origin = G(W_HI * np.exp(1j * thO)) # ④ s=∞ 半圆的像（原点附近小弧）

    t = np.linspace(0, 1, 1200)             # ② 原点小豁口的像：半径 R→∞ 圆弧
    phi0 = np.deg2rad(90.0 * nu + (180.0 if K0 < 0 else 0.0))
    phi = phi0 - t * np.deg2rad(180.0 * nu)
    h = 0.08 if nu >= 3 else 0.0            # ν≥3 时圆弧自相重迭，用 ±8% 径向
    rho = R_arc * (1 + h * np.sin(2 * np.pi * t))   # 波动把两圈分开便于辨认
    arc_inf = rho * np.exp(1j * phi)

    use_tail = bool(abs(np.angle(tail_pos[0] / arc_inf[-1]))
                    < np.deg2rad(35.0))     # 尾段方向是否与圆弧端同向
    jn_neg = tail_neg[-1] if use_tail else branch_neg[-1]   # 虚线衔接点
    jn_pos = tail_pos[0] if use_tail else branch_pos[0]
    chord1 = np.array([jn_neg, arc_inf[0]])         # 衔接段→圆弧（虚线示意）
    chord2 = np.array([arc_inf[-1], jn_pos])

    # ---- 数值自检：闭合性 + 对 -1 的缠绕数 ------------------------------
    closed = np.concatenate(
        [branch_neg] + ([tail_neg] if use_tail else [])
        + [chord1, arc_inf, chord2]
        + ([tail_pos] if use_tail else []) + [branch_pos, arc_origin])
    closure_res = abs(closed[0] - closed[-1])
    ang = np.unwrap(np.angle(closed + 1.0))
    N_cw = int(np.round(-(ang[-1] - ang[0]) / (2 * np.pi)))  # 顺时针为正
    Z = P + N_cw
    zrhp = int(np.sum(cl_poles.real > 1e-9))

    print("== %s ==" % title)
    print("  原点极点 ν=%d, K0=%g, 右半平面开环极点 P=%d" % (nu, K0, P))
    if cross:
        print("  实轴交点: " + "; ".join(
            "ω=%.6g → G=%.6g" % c for c in cross))
    else:
        print("  实轴交点: 无有限交点")
    print("  缠绕数 N=%d, Z=P+N=%d, 实际右半平面闭环极点=%d %s"
          % (N_cw, Z, zrhp, "（一致 ✓）" if Z == zrhp else "（不一致 ✗ 需检查）"))
    print("  闭环极点: %s" % np.sort_complex(cl_poles))
    print("  闭合残差 = %.3e（应≈0）" % closure_res)
    assert closure_res < 1e-6 * R_arc, "曲线未闭合"

    # ---- 绘图 ----------------------------------------------------------
    fig, ax = plt.subplots(figsize=(9.5, 8.6))
    BLUE, RED = "#1f5fbf", "#d62728"

    ax.plot(branch_pos.real, branch_pos.imag, "-", color=BLUE, lw=1.8,
            label="频率支路 G(jω)（ω>0 与 ω<0，实线）", zorder=3)
    ax.plot(branch_neg.real, branch_neg.imag, "-", color=BLUE, lw=1.8,
            zorder=3)
    ax.plot(arc_origin.real, arc_origin.imag, "-", color=BLUE, lw=1.3,
            label="s=∞ 半圆的映射（曲线在原点闭合）", zorder=3)
    ax.plot(arc_inf.real, arc_inf.imag, "--", color=RED, lw=2.0,
            dashes=(7, 4),
            label="无穷远圆弧：顺时针 %d×180°=%d°（R→∞，虚线示意）"
                  % (nu, nu * 180), zorder=4)
    dashed_segs = [chord1, chord2] + ([tail_pos, tail_neg] if use_tail
                                      else [])               # |G|→∞ 延伸段
    for seg in dashed_segs:
        ax.plot(seg.real, seg.imag, "--", color=RED, lw=2.0, dashes=(7, 4),
                zorder=4)
    for pt in (jn_neg, arc_inf[0], arc_inf[-1], jn_pos):     # 衔接点
        ax.plot(pt.real, pt.imag, "o", color=RED, ms=4, zorder=5)

    # 方向箭头（支路按弧长取 25% 处，避开原点、交点与远端拥挤区）
    arrow_on_curve(ax, branch_pos.real, branch_pos.imag, 0.25, BLUE, lim,
                   by_arclen=True)
    arrow_on_curve(ax, branch_neg.real, branch_neg.imag, 0.75, BLUE, lim,
                   by_arclen=True)
    arc_fracs = [(k + 0.5) / nu for k in range(nu)]
    if nu == 1:
        arc_fracs += [0.25, 0.75]
    for f in arc_fracs:
        arrow_on_curve(ax, arc_inf.real, arc_inf.imag, f, RED, lim)

    # 临界点 -1 与交点
    ax.plot(-1, 0, "x", color=RED, ms=14 if R_arc > 8 else 12,
            mew=2.5 if R_arc <= 8 else 3.0, zorder=6)
    ax.text(-1, 0.045 * lim, "−1", color=RED, fontsize=10, ha="center")
    for wc, gc in cross_sig:
        ax.plot(gc, 0, "o", color="#2ca02c", ms=6, zorder=6)
        ax.annotate("(%.6g, j0)\nω=%.6g" % (gc, wc), xy=(gc, 0),
                    xytext=(gc * 1.02, -0.17 * lim), ha="center",
                    fontsize=8.5, color="#2ca02c",
                    arrowprops=dict(arrowstyle="->", color="#2ca02c",
                                    lw=0.8))

    # 渐近线（例如 1/(s(s+1)) 的 Re=-1 垂直渐近线）
    if asymptote_re is not None:
        ax.axvline(asymptote_re, ls=":", color="0.45", lw=1)
        ax.text(asymptote_re, -0.93 * lim, "渐近线 Re(G)=−1", color="0.35",
                fontsize=8.5, rotation=90, va="bottom", ha="right")

    # 端点频率标注
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
    if nu >= 3:               # 540° 弧自相重迭：标出两圈的先后位置
        ax.text(-1.20 * R_arc, -0.02 * R_arc, "第1圈", color=RED, fontsize=7.5,
                rotation=90, va="center", ha="center")
        ax.text(-0.82 * R_arc, 0.02 * R_arc, "第2圈", color=RED, fontsize=7.5,
                rotation=90, va="center", ha="center")

    # 结论：作为标题下的一行文字，不遮挡曲线
    stable = (Z == 0) and bool(np.all(cl_poles.real < 0))
    summary = ("ν=%d（K0=%g）  P=%d  N=%d（对 −1 顺时针净包围圈数）  "
               "Z=P+N=%d → 闭环%s   |   %s"
               % (nu, K0, P, N_cw, Z, "稳定" if stable else "不稳定",
                  ("实轴交点: ω=%.5g → G=%.5g" % cross_sig[0]
                   if cross_sig else "与负实轴无有限交点")))
    ax.text(0.5, 1.018, summary, transform=ax.transAxes, ha="center",
            fontsize=9.3, color="#333333")

    # 坐标轴：十字穿过原点，教材风格
    ax.set_xlim(-lim, lim)
    ax.set_ylim(-lim, lim)
    ax.set_aspect("equal")
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    ax.spines["left"].set_position("zero")
    ax.spines["bottom"].set_position("zero")
    ax.grid(True, ls=":", alpha=0.35)
    ax.tick_params(labelsize=8.5)
    ax.text(0.965 * lim, 0.03 * lim, "Re", fontsize=11)
    ax.text(0.025 * lim, 0.955 * lim, "Im", fontsize=11)

    # 原点附近放大小图（大半径图形时帮助看清 -1 与支路关系）
    if R_arc > 8:
        axi = ax.inset_axes([0.60, 0.045, 0.37, 0.37])
        axi.plot(branch_pos.real, branch_pos.imag, "-", color=BLUE, lw=1.3)
        axi.plot(branch_neg.real, branch_neg.imag, "-", color=BLUE, lw=1.3)
        axi.plot(arc_origin.real, arc_origin.imag, "-", color=BLUE, lw=1.1)
        axi.plot(arc_inf.real, arc_inf.imag, "--", color=RED, lw=1.2,
                 dashes=(6, 4))
        axi.plot(-1, 0, "x", color=RED, ms=10, mew=2.2)
        axi.set_xlim(-2.6, 2.0)
        axi.set_ylim(-2.2, 2.2)
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
    print("  已保存: %s" % fname)

    return {"nu": nu, "K0": K0, "P": P, "N": N_cw, "Z": Z,
            "cross": cross, "cross_sig": cross_sig, "cl": cl_poles,
            "closure": closure_res, "R_arc": R_arc}


# ---------------------------------------------------------------- 算例
if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))   # PNG 输出到脚本目录

    if len(sys.argv) == 3:                                  # 自定义传函
        coef = lambda s: [float(x) for x in s.replace(",", " ").split()]
        nyquist_plot(coef(sys.argv[1]), coef(sys.argv[2]),
                     "G(s)H(s)", "nyquist_custom.png")
        sys.exit(0)

    # 算例 1：G = 1/(s(s+1))，Ⅰ型，经典教材图
    print("\n[理论对照] 渐近线 Re=-1；与负实轴无有限交点；N=0；"
          "闭环极点 -0.5±j0.866（稳定）")
    r1 = nyquist_plot([1.0], [1.0, 1.0, 0.0],
                      r"$G(s)H(s)=\frac{1}{s(s+1)}$",
                      "nyquist_case1.png", asymptote_re=-1.0)

    # 算例 2：G = 5(s+1)(2s+1)/s³ = (10s²+15s+5)/s³，Ⅲ型，无穷弧 1.5 圈
    print("\n[理论对照] 实轴交点 ω=1/√2≈0.7071 → G=-30；无穷弧 540°；N=0；"
          "闭环稳定（劳斯表：s³+10s²+15s+5 首列全正）")
    r2 = nyquist_plot([10.0, 15.0, 5.0], [1.0, 0.0, 0.0, 0.0],
                      r"$G(s)H(s)=\frac{5(s+1)(2s+1)}{s^{3}}$",
                      "nyquist_case2.png")

    # ---- 自动断言自检 ---------------------------------------------------
    G1 = make_G([1.0], [1.0, 1.0, 0.0])
    assert abs(G1(1j) - (-0.5 - 0.5j)) < 1e-12, "G1(j1) 应为 -0.5-0.5j"
    assert not r1["cross"], "算例 1 不应有有限实轴交点"
    assert r1["N"] == 0 and r1["Z"] == 0, "算例 1 应有 N=Z=0"

    (w2, g2), = r2["cross_sig"]
    assert abs(w2 - 1 / np.sqrt(2)) < 1e-4, "交点频率应为 1/√2"
    assert abs(g2 + 30.0) < 1e-6, "交点应为 -30"
    assert r2["N"] == 0 and r2["Z"] == 0, "算例 2 应有 N=Z=0"

    print("\n全部自检通过 ✓（曲线闭合、缠绕数与闭环极点一致、交点数值与理论一致）")
