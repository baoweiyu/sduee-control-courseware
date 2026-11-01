# -*- coding: utf-8 -*-
"""V2.37：例5-1 系统补上纯积分环节 s，GH=K1(s+4)/[s(s+2)(s+6.6)]
严格按特征方程 s^3+8.6s^2+(13.2+K)s+4K=0 数值求根，逐点连续跟踪分支。"""
import numpy as np, json, os

OUT = r'H:\D_tools\courseware-system-kimi\lessons\lesson05-root-locus\data\ex51.js'

poles = np.array([0.0, -2.0, -6.6])          # p3=0（原点，纯积分环节）
ks = np.geomspace(0.01, 80.0, 200)

def roots_of(K):
    # s(s+2)(s+6.6) + K(s+4) = s^3 + 8.6 s^2 + (13.2+K) s + 4K
    return np.roots([1.0, 8.6, 13.2 + K, 4.0 * K])

branches = [[], [], []]
prev = roots_of(ks[0])
# 初始按距离开环极点最近分配
order = []
used = set()
for p in poles:
    d = [abs(prev[i] - p) if i not in used else 1e9 for i in range(3)]
    i = int(np.argmin(d)); used.add(i); order.append(i)
prev = prev[order]
for bi in range(3):
    branches[bi].append([round(float(prev[bi].real), 5), round(float(prev[bi].imag), 5)])
for K in ks[1:]:
    r = roots_of(K)
    # 最近邻连续跟踪
    assign, used = [], set()
    for bi in range(3):
        d = [abs(r[i] - prev[bi]) if i not in used else 1e18 for i in range(3)]
        i = int(np.argmin(d)); used.add(i); assign.append(i)
    prev = r[assign]
    for bi in range(3):
        branches[bi].append([round(float(prev[bi].real), 5), round(float(prev[bi].imag), 5)])

# 分离点：在 (-2,0) 上 K(s) = -s(s+2)(s+6.6)/(s+4) 取极大
ss = np.linspace(-1.999, -0.001, 200001)
K = -ss * (ss + 2) * (ss + 6.6) / (ss + 4)
i = int(np.argmax(K))
print('breakaway s=%.4f  K=%.4f' % (ss[i], K[i]))
print('σ=%.2f, 渐近线 ±90°；试验点 s=-1.5+j2.55:' % ((poles.sum() - (-4)) / 2))
s = -1.5 + 2.55j
for name, v in [('z1=-4', -4), ('p1=-2', -2), ('p2=-6.6', -6.6), ('p3=0', 0)]:
    print('  ∠(s-(%s)) = %.2f°' % (name, np.angle(s - v, deg=True)))
print('K1(s1=-5) =', abs(-5 * (-5 + 2) * (-5 + 6.6) / (-5 + 4)))

data = {
    "kmin": 0.01, "kmax": 80.0,
    "xlim": [-8.0, 1.2], "ylim": [-4.6, 4.6],
    "poles": [[0.0, 0.0], [-2.0, 0.0], [-6.6, 0.0]],
    "zeros": [[-4.0, 0.0]],
    "segments": [[-2.0, 0.0], [-6.6, -4.0]],
    "asym": {"sigma": -2.3, "angles": [90.0, -90.0]},
    "breakaways": [], "crossings": [],
    "ks": [round(float(k), 5) for k in ks],
    "branches": branches,
    "groups": [[0], [1], [2]], "pairs": []
}
js = 'RL.data["ex51"] = ' + json.dumps(data, separators=(',', ':')) + ';'
open(OUT, 'w', encoding='utf-8').write(js)
print('written', OUT, os.path.getsize(OUT), 'bytes')
