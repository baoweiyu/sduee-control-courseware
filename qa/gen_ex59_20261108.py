from pathlib import Path
from itertools import permutations
import json
import math
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "lessons" / "lesson05-root-locus" / "data"


def track_family(k1: float):
    astar = (math.sqrt(1 + 4 * k1) - 1) / 2
    # 一直计算到很大的 a，保证趋零点和无穷远的终段完整；起点、临界点处另行加密。
    amax = 1.0e6
    base = np.geomspace(0.002, amax, 1100)
    near = np.concatenate([
        np.linspace(max(0.0002, astar - 0.035), astar + 0.035, 100),
        np.geomspace(0.002, 1.0, 160),
        np.geomspace(8.0, amax, 240),
    ])
    aa = np.unique(np.concatenate([[0.0, astar], base, near]))
    aa.sort()
    branches = [[], [], []]
    prev = None
    for a in aa:
        roots = np.roots([1.0, a + 1.0, a, k1])
        if prev is None:
            roots = sorted(roots, key=lambda z: (round(z.imag, 12), z.real))
        else:
            # 三分支全局最近邻匹配，而不是逐根贪心，防止分支交叉时错配。
            best = min(
                permutations(range(3)),
                key=lambda p: sum(abs(roots[p[i]] - prev[i]) ** 2 for i in range(3)),
            )
            roots = [roots[j] for j in best]
        prev = list(roots)
        for i, z in enumerate(roots):
            branches[i].append([round(float(z.real), 6), round(float(z.imag), 6)])
    poles = sorted(np.roots([1.0, 1.0, 0.0, k1]), key=lambda z: (round(z.imag, 12), z.real))
    poles = [[round(float(z.real), 6), round(float(z.imag), 6)] for z in poles]
    critical = np.roots([1.0, astar + 1.0, astar, k1])
    cw = sorted([z.imag for z in critical if abs(z.real) < 1e-7 and z.imag > 0])
    assert cw and abs(cw[0] - math.sqrt(astar)) < 1e-7, (k1, critical)
    # 数值根已充分接近极限后，显式接到两个开环零点；第三支已越过视窗并趋向 −∞。
    i0 = min(range(3), key=lambda i: abs(complex(*branches[i][-1])))
    i1 = min((i for i in range(3) if i != i0), key=lambda i: abs(complex(*branches[i][-1]) + 1))
    iinf = next(i for i in range(3) if i not in (i0, i1))
    assert branches[iinf][-1][0] < -0.9 * amax, (k1, branches[iinf][-1])
    branches[i0].append([0.0, 0.0])
    branches[i1].append([-1.0, 0.0])
    max_jump = max(
        math.hypot(b[i][0] - b[i - 1][0], b[i][1] - b[i - 1][1])
        for b in branches for i in range(1, len(b))
    )
    return {
        "k": k1,
        "kmin": 0.002,
        "kmax": amax,
        "xlim": [-3.6, 1.0],
        "ylim": [-2.6, 2.6],
        "poles": poles,
        "zeros": [[0, 0], [-1, 0]],
        "segments": [],
        "asym": {"sigma": None, "angles": []},
        "breakaways": [],
        "crossings": [{"K": k1, "w": round(math.sqrt(astar), 6), "a": round(astar, 6)}],
        "ks": [round(float(a), 6) for a in aa],
        "branches": branches,
        "groups": [[0, 2]] if abs(branches[0][0][1] + branches[2][0][1]) < 1e-8 else [],
        "astar": round(astar, 6),
        "maxJump": round(max_jump, 6),
    }


families = {k: track_family(k) for k in (0.5, 2.0, 10.0)}
for k, fam in families.items():
    print(f"K1={k}: a*={fam['astar']}, points={len(fam['ks'])}, max_jump={fam['maxJump']}")

fixed = {name: families[k] for name, k in (("ex59k05", 0.5), ("ex59k2", 2.0), ("ex59k10", 10.0))}
(DATA / "ex59fixed.js").write_text(
    "// 例5-9：固定 K1、以 a 为参量的严格数值根轨迹；由 qa/gen_ex59_20261108.py 生成。\n"
    + "\n".join(f'RL.data["{name}"] = {json.dumps(fam, ensure_ascii=False, separators=(",", ":"))};' for name, fam in fixed.items())
    + "\n",
    encoding="utf-8",
)

fam59 = {
    "kmin": 0.002,
    "kmax": 1.0e6,
    "xlim": [-3.6, 1.0],
    "ylim": [-2.6, 2.6],
    "poles": [],
    "zeros": [],
    "segments": [],
    "asym": {"sigma": None, "angles": []},
    "breakaways": [],
    "crossings": [],
    "ks": [],
    "branches": [],
    "groups": [],
    "pairs": [],
    "fams": list(families.values()),
}
(DATA / "fam59.js").write_text(
    "// 例5-9：K1 与 a 双参数根轨迹簇；与 ex59fixed.js 共用同一数值采样。\n"
    + f'RL.data["fam59"] = {json.dumps(fam59, ensure_ascii=False, separators=(",", ":"))};\n',
    encoding="utf-8",
)
print("Wrote ex59fixed.js and fam59.js")
