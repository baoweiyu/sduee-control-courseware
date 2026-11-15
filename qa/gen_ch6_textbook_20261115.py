"""按课本例6-1、6-3、6-5生成第六章Bode与阶跃响应数据。曲线精确计算，页面文字采用课本读数。"""
from pathlib import Path
import json
import numpy as np
from scipy import signal, optimize

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "lessons" / "lesson06-correction" / "data"
OUT.mkdir(parents=True, exist_ok=True)
BLUE, GREEN, RED = "#1D3FA0", "#0E7A36", "#C02A20"


def tf(zpk_gain, zeros=(), poles=()):
    num = np.poly1d([1.0])
    den = np.poly1d([1.0])
    for z in zeros:
        num *= np.poly1d([1.0, -z])
    for p in poles:
        den *= np.poly1d([1.0, -p])
    return zpk_gain * num, den


def resp(num, den, w):
    s = 1j * w
    h = np.polyval(num, s) / np.polyval(den, s)
    return 20 * np.log10(np.abs(h)), np.rad2deg(np.unwrap(np.angle(h)))


def curve(name, color, w, y):
    return {"name": name, "color": color, "pts": [[round(float(a), 6), round(float(b), 4)] for a, b in zip(w, y)]}


def crossing(num, den, target=0.0, lo=-3, hi=2):
    def f(logw):
        w = 10 ** logw
        h = np.polyval(num, 1j * w) / np.polyval(den, 1j * w)
        return 20 * np.log10(abs(h)) - target
    grid = np.linspace(lo, hi, 1000)
    vals = [f(x) for x in grid]
    for a, b, fa, fb in zip(grid[:-1], grid[1:], vals[:-1], vals[1:]):
        if fa * fb <= 0:
            return float(10 ** optimize.brentq(f, a, b))
    return float("nan")


def at(num, den, w):
    h = np.polyval(num, 1j * w) / np.polyval(den, 1j * w)
    return 20 * np.log10(abs(h)), np.rad2deg(np.angle(h))


def physical_phase(num, den, w):
    """本组最小相位开环系统的连续负相角；避免 np.angle 在 ±180° 处折回。"""
    _, ph = at(num, den, w)
    return ph - 360 if ph > 0 else ph


def phase_margin(num, den, wc):
    ph = physical_phase(num, den, wc)
    return 180 + ph, ph


def phase_cross(num, den, lo=-3, hi=2):
    def f(logw):
        w = 10 ** logw
        return physical_phase(num, den, w) + 180
    grid = np.linspace(lo, hi, 2000)
    vals = [f(x) for x in grid]
    for a, b, fa, fb in zip(grid[:-1], grid[1:], vals[:-1], vals[1:]):
        if fa * fb <= 0:
            return float(10 ** optimize.brentq(f, a, b))
    return float("nan")


def step_data(num, den, tend=8.0, n=801):
    closed_num = np.polymul(num, np.poly1d([1.0]))
    closed_den = np.polyadd(den, num)
    sys = signal.TransferFunction(closed_num, closed_den)
    t = np.linspace(0, tend, n)
    t, y = signal.step(sys, T=t)
    final = 1.0
    overshoot = max(0.0, (float(np.max(y)) - final) * 100)
    settle = float(t[-1])
    for i in range(len(t) - 1, -1, -1):
        if abs(y[i] - final) > 0.05 * final:
            settle = float(t[min(i + 1, len(t) - 1)])
            break
        if i == 0:
            settle = 0.0
    return {"t": [round(float(v), 4) for v in t], "y": [round(float(v), 5) for v in y]}, {"final": final, "overshoot_pct": round(overshoot, 2), "settling_5pct": round(settle, 3)}


def dataset(name, xlim, ylim_mag, ylim_phase, systems, marks, meta, asym=None, step=None):
    w = np.logspace(np.log10(xlim[0]), np.log10(xlim[1]), 321)
    mag_curves, phase_curves = [], []
    for cname, color, (num, den) in systems:
        mag, ph = resp(num, den, w)
        mag_curves.append(curve(cname, color, w, mag))
        phase_curves.append(curve(cname, color, w, ph))
    data = {
        "xlim": xlim,
        "mag": {"ylim": ylim_mag, "curves": mag_curves, "asym": asym or []},
        "phase": {"ylim": ylim_phase, "curves": phase_curves, "asym": []},
        "marks": marks,
        "meta": meta,
    }
    if step:
        data["step"] = step
    path = OUT / f"{name}.js"
    path.write_text(f'BD.data["{name}"]=' + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(name, "written", path.name)


# 例6-1：G0=15/[s(s+1)]，Gc=(0.33s+1)/(0.11s+1)
g0 = (np.poly1d([15.0]), np.poly1d([1.0, 1.0, 0.0]))
gc = (np.poly1d([0.33, 1.0]), np.poly1d([0.11, 1.0]))
g = (np.polymul(g0[0], gc[0]), np.polymul(g0[1], gc[1]))
wc1 = crossing(*g0)
wc2 = crossing(*g)
gm0, ph0 = phase_margin(*g0, wc1)
gm1, ph1 = phase_margin(*g, wc2)
print("ex61 exact", wc1, gm0, wc2, gm1)
before, bm = step_data(*g0, tend=8)
after, am = step_data(*g, tend=8)
step = {"t": before["t"], "before": before["y"], "after": after["y"], "before_meta": bm, "after_meta": am}
marks = [
    {"type": "vline", "w": 3, "label": "1/T≈3", "color": GREEN, "dy": 20},
    {"type": "vline", "w": 9, "label": "1/(αT)≈9", "color": GREEN, "dy": 44},
    {"type": "wc", "w": wc1, "label": "ω_{c1}≈3.9", "dx": 14, "dy": -16},
    {"type": "margin", "w": wc1, "gamma": gm0, "phi": ph0, "label": "γ_{0}≈14°", "dx": 12, "dy": 6},
    {"type": "wc", "w": wc2, "label": "ω_{c2}≈5.2", "dx": 14, "dy": -38},
    {"type": "margin", "w": wc2, "gamma": gm1, "phi": ph1, "label": "γ≈41°", "dx": 12, "dy": 6},
]
meta = {"G0": "15/[s(s+1)]", "Gc": "(0.33s+1)/(0.11s+1)", "wc1": {"val": wc1, "label": "3.9"}, "gamma0": {"val": gm0, "label": "14°"}, "wc2": {"val": wc2, "label": "5.2"}, "gamma": {"val": gm1, "label": "41°"}, "alpha": 1/3, "T": .33, "wm": 1/(.33*np.sqrt(1/3)), "level_db": 10*np.log10(3), "phi_at_wc2": ph1}
asym = [
    {"color": BLUE, "pts": [[.1, 43.5218], [1, 23.5218], [100, -36.4782]]},
    {"color": GREEN, "pts": [[.1, 0], [3, 0], [9, 9.5424], [100, 9.5424]]},
]
dataset("ex61", [.1, 100], [-60, 50], [-200, -40], [("G_{0}", BLUE, g0), ("G_{c}", GREEN, gc), ("G_{c}G_{0}", RED, g)], marks, meta, asym, step)

# 例6-3：G0=10/[s(s+1)(0.5s+1)]，Gc=2(10s+1)/(200s+1)
g0 = (np.poly1d([10.0]), np.polymul([1.0, 1.0, 0.0], [0.5, 1.0]))
gc = (2 * np.poly1d([10.0, 1.0]), np.poly1d([200.0, 1.0]))
g = (np.polymul(g0[0], gc[0]), np.polymul(g0[1], gc[1]))
wc1, wc2 = crossing(*g0), crossing(*g)
gm0, ph0 = phase_margin(*g0, wc1)
gm1, ph1 = phase_margin(*g, wc2)
wg = phase_cross(*g)
kg_db = -at(*g, wg)[0]
print("ex63 exact", wc1, gm0, wc2, gm1, "Kg", kg_db)
marks = [
    {"type": "vline", "w": .005, "label": "1/(βT)=0.005", "color": GREEN, "dy": 20},
    {"type": "vline", "w": .1, "label": "1/T=0.1", "color": GREEN, "dy": 44},
    {"type": "wc", "w": wc1, "label": "ω_{c1}≈2.7", "dx": 14, "dy": -16},
    {"type": "margin", "w": wc1, "gamma": gm0, "phi": ph0, "label": "γ_{0}≈−33°", "dx": 12, "dy": 6},
    {"type": "wc", "w": wc2, "label": "ω_{c2}≈0.56", "dx": 14, "dy": -38},
    {"type": "margin", "w": wc2, "gamma": gm1, "phi": ph1, "label": "γ≈37°", "dx": 12, "dy": 6},
]
meta = {"G0": "10/[s(s+1)(0.5s+1)]", "Gc": "2(10s+1)/(200s+1)", "wc1": {"val": wc1, "label": "2.7"}, "gamma0": {"val": gm0, "label": "−33°"}, "wc2": {"val": wc2, "label": "0.56"}, "gamma": {"val": gm1, "label": "37°"}, "beta": 20, "T": 10, "w_phase_cross": wg, "Kg_db": {"val": kg_db, "label": "≥10 dB"}, "L0_at_wc2": at(*g0, .56)[0], "phi_at_wc2": ph1}
asym = [
    {"color": BLUE, "pts": [[.001, 80], [1, 20], [2, 7.9588], [100, -94.0206]]},
    {"color": GREEN, "pts": [[.001, 6.0206], [.005, 6.0206], [.1, -20], [100, -20]]},
]
dataset("ex63", [.001, 100], [-85, 85], [-285, -50], [("G_{0}", BLUE, g0), ("G_{c}", GREEN, gc), ("G_{c}G_{0}", RED, g)], marks, meta, asym)

# 例6-5：G0=180/[s(0.5s+1)(0.167s+1)]，课本滞后—超前网络
g0 = (np.poly1d([180.0]), np.polymul([1.0, 0.0], np.polymul([0.5, 1.0], [0.167, 1.0])))
# Gc=(1.43s+1)(0.5s+1)/[(73.3s+1)(0.009s+1)]
gc = (np.polymul([1.43, 1], [.5, 1]), np.polymul([73.3, 1], [.009, 1]))
g = (np.polymul(g0[0], gc[0]), np.polymul(g0[1], gc[1]))
wc1, wc2 = crossing(*g0), crossing(*g)
gm0, ph0 = phase_margin(*g0, wc1)
gm1, ph1 = phase_margin(*g, wc2)
print("ex65 exact", wc1, gm0, wc2, gm1)
marks = [
    {"type": "vline", "w": 1/73.3, "label": "1/(βT₁)=0.0136", "color": GREEN, "dy": 20},
    {"type": "vline", "w": .7, "label": "1/T₁=0.7", "color": GREEN, "dy": 44},
    {"type": "vline", "w": 6, "label": "1/(αT₂)=6", "color": GREEN, "dy": 68},
    {"type": "wc", "w": wc1, "label": "ω_{c1}≈12.9", "dx": 14, "dy": -16},
    {"type": "margin", "w": wc1, "gamma": gm0, "phi": ph0, "label": "γ_{0}≈−56°", "dx": 12, "dy": 6},
    {"type": "wc", "w": wc2, "label": "ω_{c2}=3.5", "dx": 14, "dy": -38},
    {"type": "margin", "w": wc2, "gamma": gm1, "phi": ph1, "label": "γ≈46.7°", "dx": 12, "dy": 6},
]
meta = {"G0": "180/[s(0.5s+1)(0.167s+1)]", "Gc": "(1.43s+1)(0.5s+1)/[(73.3s+1)(0.009s+1)]", "wc1": {"val": wc1, "label": "12.9"}, "gamma0": {"val": gm0, "label": "−56°"}, "wc2": {"val": wc2, "label": "3.5"}, "gamma": {"val": gm1, "label": "46.7°"}, "beta": 51.3, "T1": 1.43, "T2": .5, "phi_at_wc2": ph1}
asym = [{"color": BLUE, "pts": [[.001, 105.105], [2, 45.105], [6, 35.563], [100, -53.916]]}]
dataset("ex65", [.001, 100], [-100, 110], [-290, -50], [("G_{0}", BLUE, g0), ("G_{c}", GREEN, gc), ("G_{c}G_{0}", RED, g)], marks, meta, asym)
