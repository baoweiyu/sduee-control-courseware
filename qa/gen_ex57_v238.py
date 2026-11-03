# -*- coding: utf-8 -*-
"""V2.38：例5-7 GH=K1/[s(s+4)(s^2+4s+20)] 根轨迹数据重算
特征方程 s^4+8s^3+36s^2+80s+K=0。
分离点：dK/ds=0 → s^3+6s^2+18s+20=(s+2)(s^2+4s+10)=0
  → s=-2（K=64），共轭复分离点 -2±j√6（K=100，(s^2+4s+10)^2 双重复根）。
在 K=64/100/260 附近加密采样，消除复分离点处的分支间断。"""
import numpy as np, json, os

OUT = r'H:\D_tools\courseware-system-kimi\lessons\lesson05-root-locus\data\ex57.js'
POLES = np.array([0.0, -4.0, -2.0 + 4.0j, -2.0 - 4.0j])

ks = set(np.geomspace(0.01, 400.0, 400).tolist())
ks.update(np.linspace(55, 75, 121).tolist())     # K=64 实轴分离点
ks.update(np.linspace(90, 110, 241).tolist())    # K=100 共轭复分离点
ks.update(np.linspace(250, 270, 41).tolist())    # K=260 虚轴交点
ks = sorted(ks)
ks = [0.0] + ks

def roots_of(K):
    return np.roots([1.0, 8.0, 36.0, 80.0, K])

branches = [[], [], [], []]
prev = POLES.copy()
for bi in range(4):
    branches[bi].append([round(float(prev[bi].real), 5), round(float(prev[bi].imag), 5)])
for K in ks[1:]:
    r = roots_of(K)
    assign, used = [], set()
    for bi in range(4):
        d = [abs(r[i] - prev[bi]) if i not in used else 1e18 for i in range(4)]
        i = int(np.argmin(d)); used.add(i); assign.append(i)
    prev = r[assign]
    for bi in range(4):
        branches[bi].append([round(float(prev[bi].real), 5), round(float(prev[bi].imag), 5)])

# 校验：K=100 时双重复根 -2±j√6
r100 = roots_of(100.0)
print('K=100 roots:', np.round(r100, 4))
print('expect double -2±j2.4495')
# 分支连续性：相邻点最大步距（复分离点附近）
b2 = np.array(branches[2])
dd = np.linalg.norm(np.diff(b2, axis=0), axis=1)
print('branch2 max step: %.4f (mean %.5f)' % (dd.max(), dd.mean()))

data = {
    "kmin": 0.01, "kmax": 400.0,
    "xlim": [-9.0, 2.6], "ylim": [-5.6, 5.6],
    "poles": [[0.0, 0.0], [-4.0, 0.0], [-2.0, 4.0], [-2.0, -4.0]],
    "zeros": [],
    "segments": [[-4.0, 0.0]],
    "asym": {"sigma": -2.0, "angles": [45.0, 135.0, -135.0, -45.0]},
    "breakaways": [{"s": -2.0, "K": 64.0}, {"s": [-2.0, 2.4495], "K": 100.0}, {"s": [-2.0, -2.4495], "K": 100.0}],
    "crossings": [{"w": 3.1623, "K": 260.0}],
    "ks": [round(float(k), 5) for k in ks],
    "branches": branches,
    "groups": [[0, 1], [2], [3]], "pairs": [[0, 1]]
}
open(OUT, 'w', encoding='utf-8').write('RL.data["ex57"] = ' + json.dumps(data, separators=(',', ':')) + ';')
print('written', OUT, os.path.getsize(OUT), 'bytes,', len(ks), 'K points')
