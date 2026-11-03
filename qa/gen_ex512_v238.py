# -*- coding: utf-8 -*-
"""V2.38：例5-12 根轨迹延伸至开环复零点。
特征方程 (s+2)(s-0.5)+K(s^2-2s+5)=0。
原数据 Kmax=1.5，轨迹只到 0.3±j1.584；现延伸至 K=1000，
末端距复零点 1±j2 约 0.002 个复平面单位，视觉上完整终止于零点。"""
import json
import os
import numpy as np

OUT = r'H:\D_tools\courseware-system-kimi\lessons\lesson05-root-locus\data\ex512.js'
POLES = np.array([-2.0 + 0.0j, 0.5 + 0.0j])
ZEROS = np.array([1.0 + 2.0j, 1.0 - 2.0j])

# 保留关键区间的高密度采样，并补足大增益趋近零点的末段。
ks = set(np.geomspace(0.004, 1.5, 260).tolist())
ks.update(np.linspace(0.18, 0.22, 41).tolist())       # 原点穿越 K=0.2
ks.update(np.linspace(0.235, 0.25, 61).tolist())      # 实轴分离点 K≈0.2416
ks.update(np.linspace(0.72, 0.78, 61).tolist())       # 虚轴交点 K=0.75
ks.update(np.geomspace(1.5, 1000.0, 220).tolist())     # 延伸至开环零点
ks.update([0.2, 0.2416, 0.75])
ks = [0.0] + sorted(ks)


def roots_of(K):
    # (s+2)(s-0.5)+K(s^2-2s+5)
    return np.roots([1.0 + K, 1.5 - 2.0 * K, -1.0 + 5.0 * K])


branches = [[], []]
prev = POLES.copy()
for bi in range(2):
    branches[bi].append([round(float(prev[bi].real), 6), round(float(prev[bi].imag), 6)])
for K in ks[1:]:
    r = roots_of(K)
    assign, used = [], set()
    for bi in range(2):
        d = [abs(r[i] - prev[bi]) if i not in used else 1e18 for i in range(2)]
        i = int(np.argmin(d))
        used.add(i)
        assign.append(i)
    prev = r[assign]
    for bi in range(2):
        branches[bi].append([round(float(prev[bi].real), 6), round(float(prev[bi].imag), 6)])

end0 = np.array(branches[0][-1])
end1 = np.array(branches[1][-1])
dist0 = np.linalg.norm(end0 - np.array([1.0, 2.0]))
dist1 = np.linalg.norm(end1 - np.array([1.0, -2.0]))
print('Kmax endpoints:', end0, end1)
print('distance to zeros:', dist0, dist1)
for K in (0.2, 0.2416, 0.75):
    print('K=%s roots:' % K, np.round(roots_of(K), 5))
for bi, b in enumerate(branches):
    a = np.array(b)
    dd = np.linalg.norm(np.diff(a, axis=0), axis=1)
    print('branch%d max step %.5f, mean %.6f' % (bi, dd.max(), dd.mean()))
assert dist0 < 0.003
assert dist1 < 0.003

data = {
    'kmin': 0.004,
    'kmax': 1000.0,
    'xlim': [-3.4, 2.4],
    'ylim': [-2.8, 2.8],
    'poles': [[-2.0, 0.0], [0.5, 0.0]],
    'zeros': [[1.0, 2.0], [1.0, -2.0]],
    'segments': [[-2.0, 0.5]],
    'asym': {'sigma': None, 'angles': []},
    'breakaways': [{'s': -0.4094, 'K': 0.2416}],
    'crossings': [{'w': 1.2536, 'K': 0.75}],
    'ks': [round(float(k), 6) for k in ks],
    'branches': branches,
    'groups': [[0, 1]],
    'pairs': [[0, 1]],
}
with open(OUT, 'w', encoding='utf-8') as f:
    f.write('RL.data["ex512"] = ' + json.dumps(data, separators=(',', ':')) + ';')
print('written', OUT, os.path.getsize(OUT), 'bytes,', len(ks), 'K points')
