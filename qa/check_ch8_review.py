#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""第八章内容审查专用：公式数值积分、例题、自振扰动方向与源码关键口径。"""
from pathlib import Path
import json
import math

ROOT = Path(__file__).resolve().parents[1]
LESSON = ROOT / "lessons" / "lesson08-nonlinear"
FAILURES = []


def check(name, cond, detail=""):
    print(("PASS " if cond else "FAIL ") + name + (f"  {detail}" if detail else ""))
    if not cond:
        FAILURES.append(name)


def close(a, b, tol=2e-6):
    return abs(a - b) <= tol * max(1.0, abs(a), abs(b))


def fourier1(y, n=32768):
    """Simpson 积分返回 A1、B1；输入 x=X sin(theta)，theta∈[0,2π]。"""
    if n % 2:
        n += 1
    h = 2 * math.pi / n
    sa = sb = 0.0
    for i in range(n + 1):
        th = i * h
        yy = y(th)
        w = 1 if i in (0, n) else (4 if i % 2 else 2)
        sa += w * yy * math.cos(th)
        sb += w * yy * math.sin(th)
    return sa * h / (3 * math.pi), sb * h / (3 * math.pi)


def Nsat_formula(X, k=2.0, a=1.0):
    if X < a:
        return complex(k, 0)
    r = a / X
    return complex(2 * k / math.pi * (math.asin(r) + r * math.sqrt(1 - r * r)), 0)


def Ndead_formula(X, k=1.0, D=1.0):
    if X < D:
        return complex(0, 0)
    r = D / X
    return complex(2 * k / math.pi * (math.pi / 2 - math.asin(r) - r * math.sqrt(1 - r * r)), 0)


def Nrelay_formula(X, M=1.0, a=1.0, m=0.5):
    r, rm = a / X, m * a / X
    re = 2 * M / (math.pi * X) * (math.sqrt(1 - r * r) + math.sqrt(1 - rm * rm))
    im = 2 * M * a / (math.pi * X * X) * (m - 1)
    return complex(re, im)


def Ngap_formula(X, k=1.0, b=1.0):
    r = b / X
    q = 1 - 2 * r
    re = k / math.pi * (math.pi / 2 + math.asin(q) + 2 * q * math.sqrt(r * (1 - r)))
    im = 4 * k * b / (math.pi * X) * (r - 1)
    return complex(re, im)


def sat_wave(th, X, k=2.0, a=1.0):
    x = X * math.sin(th)
    return k * x if abs(x) <= a else k * a * (1 if x >= 0 else -1)


def dead_wave(th, X, k=1.0, D=1.0):
    x = X * math.sin(th)
    return 0.0 if abs(x) <= D else k * (x - D * (1 if x >= 0 else -1))


def relay_wave(th, X, M=1.0, a=1.0, m=0.5):
    """一般继电器周期稳态波形；m<0 时负脉冲跨周期保持到 -beta。"""
    th %= 2 * math.pi
    p1 = math.asin(a / X)
    beta = math.asin(m * a / X)
    if beta < 0 and th < -beta:
        return -M
    if p1 <= th < math.pi - beta:
        return M
    if math.pi + p1 <= th < 2 * math.pi - beta:
        return -M
    return 0.0


def relay_numeric_N(X, M=1.0, a=1.0, m=0.5):
    """按全部实际开关角分段作 Simpson Fourier 积分，避免间断点污染结果。"""
    p1 = math.asin(a / X)
    beta = math.asin(m * a / X)
    points = [0.0, 2 * math.pi]
    points.extend(p for p in (-beta, p1, math.pi - beta,
                              math.pi + p1, 2 * math.pi - beta)
                  if 0 < p < 2 * math.pi)
    points.sort()
    sa = sb = 0.0
    for left, right in zip(points, points[1:]):
        n = 128
        h = (right - left) / n
        yy = relay_wave((left + right) / 2, X, M, a, m)
        sum_a = sum_b = 0.0
        for i in range(n + 1):
            th = left + i * h
            w = 1 if i in (0, n) else (4 if i % 2 else 2)
            sum_a += w * yy * math.cos(th)
            sum_b += w * yy * math.sin(th)
        sa += h * sum_a / 3
        sb += h * sum_b / 3
    return complex(sb / (math.pi * X), sa / (math.pi * X))


def gap_wave(th, X, k=1.0, b=1.0):
    """周期稳态齿隙波形，含幅值 b<X<2b 时的跨周期保持段。"""
    th %= 2 * math.pi
    r = b / X
    alpha = math.asin(1 - 2 * r)
    down = math.pi - alpha       # 正峰值后重新反向啮合角
    up = 2 * math.pi - alpha     # 负峰值后重新正向啮合角
    x = X * math.sin(th)
    ym = k * (X - b)
    if th < math.pi / 2:
        if alpha >= 0 or th >= -alpha:
            return k * (x - b)
        return -ym
    if th < down:
        return ym
    if th < 3 * math.pi / 2:
        return k * (x + b)
    if th < up:
        return -ym
    return k * (x - b)


def numeric_N(wave, X):
    A1, B1 = fourier1(lambda th: wave(th, X))
    return complex(B1 / X, A1 / X)


print("== 描述函数：闭式公式与独立 Fourier 积分对账 ==")
for X in (1.0, 1.2, 2.475414472467084, 5.0):
    got, want = numeric_N(sat_wave, X), Nsat_formula(X)
    check(f"饱和 N({X:.4g})", close(got.real, want.real) and close(got.imag, 0),
          f"积分={got.real:.9f}{got.imag:+.2e}j 公式={want.real:.9f}")
for X in (1.0, 1.2, 2.0, 5.0):
    got, want = numeric_N(dead_wave, X), Ndead_formula(X)
    check(f"死区 N({X:g})", close(got.real, want.real) and close(got.imag, 0),
          f"积分={got.real:.9f} 公式={want.real:.9f}")
for m in (1.0, 0.5, 0.0, -0.5, -1.0):
    for X in (1.2, 2.0):
        got, want = relay_numeric_N(X, m=m), Nrelay_formula(X, m=m)
        check(f"一般继电器 m={m:g}, X={X:g}", close(got.real, want.real, 8e-6) and close(got.imag, want.imag, 8e-6),
              f"积分={got.real:.8f}{got.imag:+.8f}j 公式={want.real:.8f}{want.imag:+.8f}j")
for X in (1.0, 1.2, 2.0, 5.0):
    got, want = numeric_N(gap_wave, X), Ngap_formula(X)
    check(f"间隙 N({X:g})", close(got.real, want.real, 2e-5) and close(got.imag, want.imag, 2e-5),
          f"积分={got.real:.8f}{got.imag:+.8f}j 公式={want.real:.8f}{want.imag:+.8f}j")

print("\n== 负倒特性与例 8-1 ==")
check("饱和 N(1)=2", close(Nsat_formula(1).real, 2))
check("死区 N(1)=0", close(Ndead_formula(1).real, 0))
check("间隙 N(1)=0", close(Ngap_formula(1).real, 0) and close(Ngap_formula(1).imag, 0))
check("间隙 X→∞ 时 N→1", close(Ngap_formula(1e6).real, 1, 1e-5) and Ngap_formula(1e6).imag < 0)
lo, hi = 1.0, 30.0
for _ in range(120):
    mid = (lo + hi) / 2
    if Nsat_formula(mid).real > 1:
        lo = mid
    else:
        hi = mid
XS = (lo + hi) / 2
W0 = math.sqrt(50)
check("例8-1 振幅数值根", close(XS, 2.475414472467084, 1e-10), f"X={XS:.10f}")
check("例8-1 角频率及两位小数", close(W0, 7.0710678118654755, 1e-10) and round(W0, 2) == 7.07,
          f"ω={W0:.10f} rad/s")
check("例8-1 G 负实轴交点", close(-15 / 15, -1) and close(-7.5 / 15, -0.5))
check("例8-1 Routh 小信号边界 K=7.5", close(0.3 / 0.04, 7.5), "0.3-0.04K>0 ⇔ K<7.5")
f_sat = lambda X: -1 / Nsat_formula(X).real
check("例8-1 交点为稳定自振", f_sat(XS + 1e-4) < -1 and f_sat(XS - 1e-4) > -1,
      f"X+δ→{f_sat(XS+1e-4):.8f}（稳定区），X-δ→{f_sat(XS-1e-4):.8f}（不稳定区）")

f_relay = lambda X: -1 / Nrelay_formula(X, m=1).real
check("死区继电器极值", close(f_relay(math.sqrt(2)), -math.pi / 2),
      f"-1/N(√2)={f_relay(math.sqrt(2)):.10f}")

def bisect(lo, hi, rising):
    for _ in range(120):
        mid = (lo + hi) / 2
        if (f_relay(mid) < -2) == rising:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2

XB = bisect(1.0001, math.sqrt(2), True)
XA = bisect(math.sqrt(2), 60, False)
check("K=30 两交点数值", close(XB, 1.1114573316983787, 1e-9) and close(XA, 2.291117271752701, 1e-9),
      f"Xb={XB:.10f}, Xa={XA:.10f}")
check("b 点不稳定：X 增大进入不稳定区并远离", f_relay(XB + 1e-4) > -2 and f_relay(XB - 1e-4) < -2,
      f"f(Xb+δ)={f_relay(XB+1e-4):.8f}, f(Xb-δ)={f_relay(XB-1e-4):.8f}")
check("a 点稳定：两侧振幅均回复", f_relay(XA + 1e-4) < -2 and f_relay(XA - 1e-4) > -2,
      f"f(Xa+δ)={f_relay(XA+1e-4):.8f}, f(Xa-δ)={f_relay(XA-1e-4):.8f}")

print("\n== 摆、动画分段与页面源码口径 ==")
# 角度从铅垂向下计：V=-cosθ；θ=0 稳定，θ=π 不稳定。
check("单摆两个平衡位置及稳定性", math.sin(0) == 0 and abs(math.sin(math.pi)) < 1e-15 and math.cos(0) > 0 and math.cos(math.pi) < 0,
      "V'=sinθ=0；V''(0)>0，V''(π)<0")
check("死区动画拐点采样下标", close(40 / 82, 0.4878048780487805) and close(41 / 82, 0.5))
check("饱和动画拐点采样下标", close(50 / 150, 1 / 3) and close(100 / 150, 2 / 3))
check("间隙动画五段采样下标", [60 / 280, 80 / 280, 170 / 280, 190 / 280] == [3 / 14, 2 / 7, 17 / 28, 19 / 28])
check("一般继电器动画采样下标", close(57 / 119, 0.4789915966386555) and close(94 / 119, 0.7899159663865546))

cfg = json.loads((LESSON / "lesson.json").read_text(encoding="utf-8"))
check("lesson.json 共 33 页", len(cfg["pages"]) == 33)
all_text = ""
for i, page in enumerate(cfg["pages"], 1):
    path = LESSON / page["file"]
    check(f"P{i:02d} 文件与 data-page", path.exists() and f'data-page="{i} / 33"' in path.read_text(encoding="utf-8"), page["file"])
    all_text += "\n" + path.read_text(encoding="utf-8")
check("全章不再误写 ω≈7.05", "7.05" not in all_text)
check("全章不再写摆有三个平衡位置", "摆有三个平衡位置" not in all_text)
check("K=7.5 不再称曲线相切", "相切于 b" not in all_text and "起点 b1 相切" not in all_text)
source_expect = {
    "p10-deadzone.html": "const F1 = 40 / 82, F2 = 41 / 82;",
    "p11-saturation.html": "const F1 = 50 / 150, F2 = 100 / 150;",
    "p12-gap.html": "const FS = [0, F1, F2, F3, F4, 1];",
    "p13-relay.html": "const F1 = 57 / 119, F2 = 94 / 119;",
    "p17-harmonic.html": "\\operatorname{atan2}(A_{1},B_{1})",
    "p19-df-relay.html": "m&lt;0",
    "p29-ex81-calc.html": "X=2.4754\\approx 2.5",
}
for filename, needle in source_expect.items():
    text = (LESSON / "pages" / filename).read_text(encoding="utf-8")
    check(f"源码关键修正 {filename}", needle in text, needle)

print("\nALL OK" if not FAILURES else f"\nSOME FAILED: {len(FAILURES)}")
raise SystemExit(1 if FAILURES else 0)
