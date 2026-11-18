#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V3.1 第八章独立数学复核：高精度闭式求根、描述函数性质与谐波衰减。"""
from decimal import Decimal, getcontext
from pathlib import Path
import sys

getcontext().prec = 80
D = Decimal
ROOT = Path(__file__).resolve().parents[1]
PAGES = ROOT / "lessons" / "lesson08-nonlinear" / "pages"


def pi_machin():
    """pi = 16 atan(1/5) - 4 atan(1/239)，仅用 Decimal 独立计算。"""
    def arctan_inverse(n):
        x = D(1) / D(n)
        x2 = x * x
        term = x
        total = term
        k = 1
        sign = -1
        while True:
            term *= x2
            delta = term / D(2 * k + 1)
            if sign > 0:
                total += delta
            else:
                total -= delta
            if abs(delta) < D("1e-75"):
                return total
            sign *= -1
            k += 1
    return 16 * arctan_inverse(5) - 4 * arctan_inverse(239)


PI = pi_machin()
W0 = D(50).sqrt()
DISC = D(16) - PI * PI
assert DISC > 0
Y_B = (D(32) - 8 * DISC.sqrt()) / (PI * PI)
Y_A = (D(32) + 8 * DISC.sqrt()) / (PI * PI)
XB, XA = Y_B.sqrt(), Y_A.sqrt()


def neginv_dead_relay(x):
    return -PI * x * x / (4 * (x * x - 1).sqrt())


def quadratic_residual(y):
    return PI * PI * y * y - 64 * y + 64


print("== P27：由交点方程独立闭式求根（80 位 Decimal）==")
print(f"pi       = {PI}")
print(f"omega0   = {W0}")
print(f"Xb       = {XB}")
print(f"Xa       = {XA}")
for name, x, y in (("b", XB, Y_B), ("a", XA, Y_A)):
    assert abs(quadratic_residual(y)) < D("1e-65")
    assert abs(neginv_dead_relay(x) + 2) < D("1e-65")
    print(f"PASS {name} 点：二次方程与 -1/N(X)=-2 残差均 < 1e-65")
assert XB < D(2).sqrt() < XA
assert abs(XB - D("1.1114573316983787")) < D("1e-15")
assert abs(XA - D("2.291117271752701")) < D("1e-15")

# 线性部分分母 D(jw)=-0.3w²+jw(1-0.02w²)。
RE = D("-0.3") * W0 * W0
IM = W0 * (1 - D("0.02") * W0 * W0)
assert abs(IM) < D("1e-70")
assert abs(RE + 15) < D("1e-70")
G_CROSS = D(30) / RE
assert abs(G_CROSS + 2) < D("1e-70")
print("PASS G(j√50)=-2；分母为 -15+j0，P=0（无右半平面开环极点）")

print("\n== P21：滞环继电器描述函数模值与负倒函数虚部 ==")
for x_text in ("1.2", "2", "5"):
    x = D(x_text)
    r = 1 / x
    n_re = 4 / (PI * x) * (1 - r * r).sqrt()
    n_im = -4 / (PI * x * x)
    n_abs = (n_re * n_re + n_im * n_im).sqrt()
    n_abs_formula = 4 / (PI * x)
    assert abs(n_abs - n_abs_formula) < D("1e-65")
    # -1/N = -(conj N)/|N|²，其虚部恒为 -pi/4（M=a=1）。
    neginv_re = -n_re / (n_abs * n_abs)
    neginv_im = n_im / (n_abs * n_abs)
    assert abs(neginv_im + PI / 4) < D("1e-65")
    direct_re = -PI * x / 4 * (1 - r * r).sqrt()
    assert abs(neginv_re - direct_re) < D("1e-65")
    print(f"PASS X={x}: |N|={n_abs}，Im(-1/N)={neginv_im}")

print("\n== 描述函数低通假设：本例高次谐波返回非线性输入端的相对幅值 ==")
def g_abs(w, k=D(30)):
    return k / (w * (1 + (D("0.1") * w) ** 2).sqrt() * (1 + (D("0.2") * w) ** 2).sqrt())

G1 = g_abs(W0)
for harmonic in (3, 5):
    ratio_g = g_abs(harmonic * W0) / G1
    ratio_input = ratio_g / D(harmonic)  # 理想继电器第 h 次谐波为基波的 1/h。
    print(f"h={harmonic}: |G(jhω0)|/|G(jω0)|={ratio_g}，返回输入端谐波/基波={ratio_input}")
    if harmonic == 3:
        assert abs(ratio_g - D("0.0691714464")) < D("1e-9")
        assert ratio_input < D("0.024")
    else:
        assert abs(ratio_g - D("0.0161690417")) < D("1e-9")
        assert ratio_input < D("0.0033")
print("PASS 三阶谐波返回输入端约为基波的 2.31%，五阶约 0.32%（一阶谐波近似校核）")

if "--math-only" not in sys.argv:
    print("\n== 页面防回归：严格代数结论与描述函数近似结论须明确区分 ==")
    p21 = (PAGES / "p21-neginv.html").read_text(encoding="utf-8")
    p27 = (PAGES / "p27-limit-cycle.html").read_text(encoding="utf-8")
    assert "与 X 无关。</div>" not in p21
    assert "随 X 增大而减小" in p21
    assert "\\pi^{2}y^{2}-64y+64=0" in p27
    assert "描述函数近似局部稳定" in p27
    assert "严格全局结论" in p27
    print("PASS P21/P27 关键教学口径")

print("\nALL V3.1 MATH CHECKS PASSED")
