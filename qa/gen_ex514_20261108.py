"""Regenerate example 5-14 from the exact quadratic roots.

Characteristic equation: s^2 + (0.2 + K1)s + 1.25K1 = 0.
The plus/minus root formulas give two globally continuous branches; dense samples
around both repeated-root gains prevent artificial gaps at break-in/breakaway.
"""
import json
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "lessons" / "lesson05-root-locus" / "data" / "ex514.js"
D1 = (4.6 - float(np.sqrt(21.0))) / 2.0
D2 = (4.6 + float(np.sqrt(21.0))) / 2.0

ks = {0.0, 1e-4, 100.0, D1, D2, 0.8}
ks.update(np.geomspace(1e-4, 100.0, 1400).tolist())
for d in (D1, D2):
    ks.update(np.linspace(d * 0.90, d * 1.10, 181).tolist())
    ks.update(np.linspace(max(0.0, d - 0.002), d + 0.002, 81).tolist())
ks = sorted(k for k in ks if 0.0 <= k <= 100.0)

branches = [[], []]
for k in ks:
    b = 0.2 + k
    disc = b * b - 5.0 * k
    if disc >= 0.0:
        q = float(np.sqrt(disc))
        branches[0].append([(-b + q) / 2.0, 0.0])
        branches[1].append([(-b - q) / 2.0, 0.0])
    else:
        q = float(np.sqrt(-disc))
        branches[0].append([-b / 2.0, q / 2.0])
        branches[1].append([-b / 2.0, -q / 2.0])

# Round only after all root calculations; repeated-root coordinates agree exactly.
branches = [[[round(x, 7), round(y, 7)] for x, y in br] for br in branches]
for br in branches:
    for i in (ks.index(D1), ks.index(D2)):
        br[i][1] = 0.0

data = {
    "kmin": 0.0001,
    "kmax": 100.0,
    "xlim": [-3.3, 0.9],
    "ylim": [-1.75, 1.75],
    "poles": [[0.0, 0.0], [-0.2, 0.0]],
    "zeros": [[-1.25, 0.0]],
    "segments": [[-0.2, 0.0], ["-Infinity", -1.25]],
    "asym": {"sigma": 1.05, "angles": [180.0]},
    "circle": {"cx": -1.25, "cy": 0.0, "r": 1.14564},
    "breakaways": [{"s": -0.10436, "K": D1}, {"s": -2.39564, "K": D2}],
    "crossings": [],
    "ks": [round(k, 9) for k in ks],
    "branches": branches,
    "groups": [[0, 1]],
    "pairs": [[0, 1]],
}
# JSON has no Infinity literal; restore the negative-infinity segment sentinel.
payload = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace('"-Infinity"', "-Infinity")
OUT.write_text('RL.data["ex514"] = ' + payload + ";\n", encoding="utf-8")

for idx, d in ((ks.index(D1), D1), (ks.index(D2), D2)):
    print(f"K1={d:.9f}: plus={branches[0][idx]}, minus={branches[1][idx]}")
for name, br in zip(("plus", "minus"), branches):
    gaps = [float(np.hypot(br[i + 1][0] - br[i][0], br[i + 1][1] - br[i][1])) for i in range(len(br) - 1)]
    print(f"{name}: {len(br)} points, max adjacent root-plane step={max(gaps):.7f}")
print(OUT)
