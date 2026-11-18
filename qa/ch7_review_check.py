#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""第七章独立复核：由定义、留数、递推和映射重算，并检查修订后的页面文本。"""
from pathlib import Path
import cmath
import math

ROOT = Path(__file__).resolve().parents[1]
PAGES = ROOT / "lessons" / "lesson07-discrete" / "pages"
ok = True


def check(name, condition, detail=""):
    global ok
    print(("PASS " if condition else "FAIL ") + name + ("  " + detail if detail else ""))
    if not condition:
        ok = False


def close(a, b, tol=1e-9):
    return abs(a - b) <= tol


# 页面集合与页码：本章必须仍为 56 页。
files = sorted(PAGES.glob("p*.html"))
check("第七章页面数量与前缀", len(files) == 56 and [f.name[:3] for f in files] == [f"p{i:02d}" for i in range(1, 57)],
      f"{len(files)} 页")
text = {f.name: f.read_text(encoding="utf-8") for f in files}

# 例 7-15：先去掉 0.1，再独立做部分分式。
# 1/[s(0.1s+1)] = 10/[s(s+10)] = 1/s - 1/(s+10)，不能在括号外再乘 10。
f = lambda s: 1 / (s * (0.1 * s + 1))
normalized = lambda s: 10 / (s * (s + 10))
pf = lambda s: 1 / s - 1 / (s + 10)
check("例7-15 部分分式不多乘因子10",
      all(close(f(s), normalized(s), 1e-10) and close(f(s), pf(s), 1e-10) for s in (0.3, 1.0, 7.0)),
      "1/[s(0.1s+1)] = 10/[s(s+10)] = 1/s - 1/(s+10)")

e = math.exp(-1)
b = 1 - e
d1 = 1 + e
d0 = e
check("例7-15 开环精确系数", close(b, 0.6321205588, 5e-11) and close(d1, 1.3678794412, 5e-11) and close(d0, 0.3678794412, 5e-11),
      f"G(z)={b:.10f}Kz/(z^2-{d1:.10f}z+{d0:.10f})")

# z^2+(bK-d1)z+d0=0 经 z=(1+w)/(1-w) 后的三个系数。
a2 = 2 * (1 + e)
a1 = 2 * (1 - e)
kmax = a2 / b
check("例7-15 w方程与精确上限",
      close(a2, 2.7357588823, 5e-11) and close(a1, 1.2642411177, 5e-11) and close(kmax, 4.32790683, 5e-9),
      f"({a2:.9f}-{b:.9f}K)w^2+{a1:.9f}w+{b:.9f}K=0, Kmax={kmax:.9f}")


def roots_for_k(k):
    aa = b * k - d1
    disc = cmath.sqrt(aa * aa - 4 * d0)
    return ((-aa + disc) / 2, (-aa - disc) / 2)


r4 = roots_for_k(4)
r5 = roots_for_k(5)
check("例7-15 K=4 稳定", max(map(abs, r4)) < 1,
      "极点模长 " + ", ".join(f"{abs(r):.6f}" for r in r4))
check("例7-15 K=5 不稳定", max(map(abs, r5)) > 1,
      "极点 " + ", ".join(f"{r.real:.6f}{r.imag:+.6f}j" for r in r5))
check("例7-15 二阶 Jury 条件",
      all(d0 < 1 and 1 + (b*k-d1) + d0 > 0 and 1 - (b*k-d1) + d0 > 0 for k in (0.1, 4))
      and not (1 - (b*5-d1) + d0 > 0),
      "K>0 时 P(1)>0、P(-1)>0 且 |e^-1|<1；K=5 时 P(-1)<0")

# 例 7-12。
y = lambda n: 1/6 + (-1)**n/2 - (-2)**n * 2/3
vals = [round(y(n), 6) for n in range(7)]
check("例7-12 序列", vals == [0, 1, -2, 5, -10, 21, -42], str(vals))

# p47：由闭环与单位阶跃相乘后的 z^-1 分母直接递推，延长序列验证稳定后的 ±5% 带。
c = [0.0, 0.368, 1.0]
for k in range(3, 201):
    c.append(2*c[k-1] - 1.632*c[k-2] + 0.632*c[k-3])
expected = [0.368, 1.0, 1.4, 1.4, 1.147, 0.895, 0.802]
check("p47 长除递推序列", all(abs(c[i+1] - expected[i]) < 0.001 for i in range(7)),
      str([round(v, 3) for v in c[1:8]]))
cmax = max(c[1:])
ts5 = next(k for k in range(1, len(c)) if all(0.95 < c[j] < 1.05 for j in range(k, len(c))))
check("p47 超调与调节时间", abs((cmax-1)*100 - 40) < 0.1 and ts5 == 12,
      f"cmax={cmax:.6f}, Mp={(cmax-1)*100:.3f}%, ts={ts5}T=12s")

# 例 7-16：闭环 z^2-2e^-1 z+e^-1=0。
re = e
im = math.sqrt(e - e*e)
mod = math.hypot(re, im)
kv = (1 - e) / (1 - e)
check("例7-16 闭环极点", close(re, 0.3678794412, 5e-11) and close(im, 0.4822283255, 5e-11) and close(mod, math.sqrt(e)),
      f"lambda={re:.6f}±j{im:.6f}, |lambda|={mod:.9f}")
check("例7-16 静态速度误差系数", close(kv, 1.0), f"Kv={kv:.6f}")

# 零阶保持器：omega_s 归零，第一旁瓣满足 x=tan(x)，x=omega*T/2。
mag_ws = abs(math.sin(math.pi) / math.pi)
lo, hi = math.pi + 1e-6, 3*math.pi/2 - 1e-6
for _ in range(100):
    mid = (lo + hi) / 2
    if math.tan(mid) - mid > 0:
        hi = mid
    else:
        lo = mid
xside = (lo + hi) / 2
wside = 2 * xside
check("ZOH 采样频率处归零与第一旁瓣", mag_ws < 1e-12 and close(wside, 8.986818916, 5e-10),
      f"|Gh(jωs)|={mag_ws:.3g}, 第一旁瓣 ωT={wside:.9f}")

# 例 7-13：无开关是连续冲激响应采样；有开关是两个离散序列的卷积。
a, bb, T = 1.0, 2.0, 0.3
A, B = math.exp(-a*T), math.exp(-bb*T)
no_switch_direct = [(A**n - B**n)/(bb-a) for n in range(9)]
no_switch_closed = [((math.exp(-a*n*T)-math.exp(-bb*n*T))/(bb-a)) for n in range(9)]
switch_conv = [sum(A**k * B**(n-k) for k in range(n+1)) for n in range(9)]
switch_closed = [(A**(n+1)-B**(n+1))/(A-B) for n in range(9)]
check("例7-13 无开关序列", all(close(x, y, 1e-12) for x, y in zip(no_switch_direct, no_switch_closed)),
      "g[n]=(e^-anT-e^-bnT)/(b-a)")
check("例7-13 有开关卷积序列", all(close(x, y, 1e-12) for x, y in zip(switch_conv, switch_closed)),
      "g[n]=(A^(n+1)-B^(n+1))/(A-B)")

# 例 7-14：由连续阶跃响应相差一个采样周期得到的脉冲序列。
zoh_direct = [0.0] + [(math.exp(-a*(n-1)*T)-math.exp(-a*n*T))/a for n in range(1, 10)]
zoh_closed = [0.0] + [(1-A)*A**(n-1)/a for n in range(1, 10)]
check("例7-14 脉冲序列", all(close(x, y, 1e-12) for x, y in zip(zoh_direct, zoh_closed)),
      "g[0]=0；g[n]=(1-e^-aT)e^-a(n-1)T/a")

# w=(z-1)/(z+1)：圆内、圆周、圆外分别对应左半、虚轴、右半。
w = lambda z: (z-1)/(z+1)
zinv = lambda ww: (1+ww)/(1-ww)
z_in, z_on, z_out = 0.3+0.2j, 1j, 2+0.5j
check("w 映射区域与逆变换",
      w(z_in).real < 0 and abs(w(z_on).real) < 1e-12 and w(z_out).real > 0
      and all(abs(zinv(w(z))-z) < 1e-12 for z in (z_in, z_on, z_out)),
      f"Re w_in={w(z_in).real:.6f}, Re w_on={w(z_on).real:.3g}, Re w_out={w(z_out).real:.6f}")

# 页面文本断言：防止误加十倍系数，并核对本次关键修订确实写入源文件。
p53 = text["p53-ex715.html"]
p56 = text["p56-summary.html"]
check("p53/p56 使用正确稳定范围",
      "0.433" not in p53 and "0.433" not in p56 and "6.321" not in p53
      and "0&lt;K&lt;4.328" in p53 and "0&lt;K&lt;4.328" in p56)
check("p53 部分分式未多乘十倍", "K\\!\\left(\\frac{1}{s}-\\frac{1}{s+10}\\right)" in p53 and "0.632\\,Kz" in p53)
check("p08 原点与脉冲串标注", "const X0 = 260" in text["p08-ideal-pulse.html"] and 'const ySub = mk("tspan"' in text["p08-ideal-pulse.html"])
check("p09/p10 频谱表述", "谐波序号" in text["p09-star-laplace.html"] and "一般复频谱须先求矢量和再取模" in text["p10-spectrum.html"])
check("p20/p21/p32 映射与留数式",
      "width: L.cx - L.x0" in text["p20-z-def.html"]
      and "\\operatorname{Res}_{s=p_{i}}" in text["p21-z-methods.html"]
      and "\\operatorname{Res}_{z=p_{i}}" in text["p32-residue.html"])
check("p31/p32 冲激串显式求和",
      "\\sum_{n=0}^{\\infty}\\left(1-0.5^{n}\\right)\\delta(t-nT)" in text["p31-partial.html"]
      and "\\sum_{n=0}^{\\infty}\\left[(-1)^{n}-(-2)^{n}\\right]\\delta(t-nT)" in text["p32-residue.html"])
check("p41/p45 零阶保持器结论限于本例",
      "本例中零阶保持器未改变" in text["p41-ex714.html"]
      and "例 7-14 中零阶保持器未改变" in text["p45-quiz3.html"])
check("p52 两种 w 约定不混用", "w'=-w" in text["p52-w-transform.html"] and "不混用" in text["p52-w-transform.html"])

print("\nALL OK" if ok else "\nSOME FAILED")
raise SystemExit(0 if ok else 1)
