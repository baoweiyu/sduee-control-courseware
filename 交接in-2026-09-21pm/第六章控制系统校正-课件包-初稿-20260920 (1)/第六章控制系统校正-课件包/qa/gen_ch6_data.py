#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""第六章《控制系统的校正》数据生成器（图不撒谎）
生成 lessons/lesson06-correction/data/*.js（BD.data["name"]={...}），并打印核对表。

口径说明（重要）：
  全部曲线、关键点均以【精确计算】为准（val）；
  PDF 教材的近似读数（如由渐近线读出的 ωc1≈2.2）同时存为 label / meta.pdf，供页面标注沿用。
  已确认的差异：
    例6-1  ωc1 精确 3.393（PDF 3.5），γ0 精确 16.4°（PDF 16°），
            ωc2 精确 4.526（PDF 4.6），γ 精确 43.8°（PDF 42.6°）；
    例6-3  ωc1 精确 1.802、γ0 精确 −13.0°；
            PDF 口径 ωc1≈2.2 来自渐近线交点 10^(1/3)≈2.15，γ0(2.2)=−23.3°≈−23°，
            ωc2 精确 0.535（PDF 0.56），γ 精确 41.7°（PDF 40.2°），Kg=12.97dB≥10dB。
"""
import json
import os
import numpy as np
from scipy.optimize import brentq
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "lessons", "lesson06-correction", "data"))
os.makedirs(OUT, exist_ok=True)

# ---------- 频域基础 ----------
def tf_eval(w, num, den):
    """num/den: 多项式系数（高次在前），返回 (|G|dB, ∠G°)，w 可为数组"""
    s = 1j * np.asarray(w, dtype=float)
    H = np.polyval(num, s) / np.polyval(den, s)
    return 20 * np.log10(np.abs(H)), np.degrees(np.angle(H))

def bode_pts(w, num, den, nd=4):
    m, p = tf_eval(w, num, den)
    r = lambda v: [round(float(a), 5) for a in v]
    pts_m = [[round(float(wi), 5), round(float(mi), nd)] for wi, mi in zip(w, m)]
    pts_p = [[round(float(wi), 5), round(float(pi), nd)] for wi, pi in zip(w, p)]
    return pts_m, pts_p

def find_wc(num, den, lo=1e-4, hi=1e4):
    f = lambda w: 20 * np.log10(abs(np.polyval(num, 1j * w) / np.polyval(den, 1j * w)))
    return brentq(f, lo, hi)

def phase_at(num, den, w):
    """连续（展开）相位，从低频参考点沿对数网格展开到 w，防 ±180° 缠绕"""
    ws = np.logspace(np.log10(1e-4), np.log10(w), 400)
    H = np.polyval(num, 1j * ws) / np.polyval(den, 1j * ws)
    return float(np.degrees(np.unwrap(np.angle(H)))[-1])

def gamma_at(num, den, w):
    return 180.0 + phase_at(num, den, w)

def gain_margin(num, den):
    """相位穿越频率处的增益裕度 dB（相位唯一穿越 −180° 时有效；需展开相位防 ±180° 缠绕）"""
    ws = np.logspace(-4, 4, 8000)
    s = 1j * ws
    H = np.polyval(num, s) / np.polyval(den, s)
    ph = np.degrees(np.unwrap(np.angle(H)))
    xs = ph + 180.0
    cross = [ws[i] for i in range(len(ws) - 1) if xs[i] * xs[i + 1] < 0]
    if not cross:
        return None, None
    lo, hi = cross[0], cross[0] * (ws[1] / ws[0])
    f = lambda w: float(np.degrees(np.angle(np.polyval(num, 1j * w) / np.polyval(den, 1j * w))))
    fu = lambda w: np.degrees(np.unwrap([np.angle(np.polyval(num, 1j * lo) / np.polyval(den, 1j * lo)),
                                         np.angle(np.polyval(num, 1j * w) / np.polyval(den, 1j * w))]))[1] + 180.0
    wpc = brentq(fu, lo, hi)
    m, _ = tf_eval(wpc, num, den)
    return float(wpc), float(-m)

def first_order_asym_phase(wpts, wc, sign):
    """一阶环节相频渐近线：0 → ±45°/dec（wc/10 到 10wc）→ ±90°"""
    out = []
    for w in wpts:
        if w <= wc / 10: out.append(0.0)
        elif w >= 10 * wc: out.append(90.0 * sign)
        else: out.append(45.0 * sign * (np.log10(w / (wc / 10))))
    return np.array(out)

def step_response(num_cl, den_cl, t):
    """单位阶跃响应（闭环保真：直接对闭环传函仿真）"""
    sys = signal.TransferFunction(num_cl, den_cl)
    _, y = signal.step(sys, T=t)
    return y

def step_meta(t, y):
    ys = y[-1]
    os_pct = (float(np.max(y)) - ys) / ys * 100 if ys > 0 else 0.0
    band = 0.05 * ys
    ts = float(t[-1])
    for i in range(len(t) - 1, -1, -1):
        if abs(y[i] - ys) > band:
            ts = float(t[min(i + 1, len(t) - 1)])
            break
    return {"final": round(float(ys), 4), "overshoot_pct": round(os_pct, 2),
            "settling_5pct": round(ts, 3)}

PAL = ["#1D3FA0", "#0E7A36", "#C02A20", "#7B21C8", "#C2410C"]
FOCUS = "#D63A2F"
ASY = "#F5821F"

def dump(name, obj):
    path = os.path.join(OUT, name + ".js")
    with open(path, "w", encoding="utf-8") as f:
        f.write('BD.data["%s"]=%s;\n' % (name, json.dumps(obj, ensure_ascii=False, separators=(",", ":"))))
    print("  written %s (%d bytes)" % (os.path.relpath(path, HERE), os.path.getsize(path)))

CHECKS = []  # (label, val, target, tol)
def chk(label, val, target, tol):
    CHECKS.append((label, val, target, tol))

print("== 生成第六章数据 ==")

# ============================================================
# lead08：超前装置 Gc=(Ts+1)/(αTs+1)，T=1，α=0.5/0.2/0.1/0.05
# ============================================================
w = np.logspace(-2, 2, 400)
lead = {"xlim": [0.01, 100],
        "mag": {"ylim": [-3, 28], "curves": [], "asym": []},
        "phase": {"ylim": [-3, 66], "curves": [], "asym": []},
        "marks": [],
        "meta": {"T": 1, "alphas": [], "note": "Gc=(Ts+1)/(αTs+1), T=1；ωm=1/(T√α)，φm=asin((1−α)/(1+α))，L(ωm)=−10lgα"}}
for i, al in enumerate([0.5, 0.2, 0.1, 0.05]):
    num, den = [1.0, 1.0], [al, 1.0]          # (s+1)/(αs+1)，T=1
    pm, pp = bode_pts(w, num, den)
    cname = "α=%g" % al
    lead["mag"]["curves"].append({"name": cname, "color": PAL[i], "pts": pm})
    lead["phase"]["curves"].append({"name": cname, "color": PAL[i], "pts": pp})
    w1, w2 = 1.0, 1.0 / al
    lvl = -10 * np.log10(al)                  # −10lgα（= L(ωm) 精确值，亦高频渐近线电平的一半口径）
    hi_lvl = -20 * np.log10(al)               # 高频渐近线电平 −20lgα
    wm, phim = 1 / np.sqrt(al), float(np.degrees(np.arcsin((1 - al) / (1 + al))))
    lead["mag"]["asym"].append({"color": PAL[i], "pts": [
        [0.01, 0], [w1, 0], [w2, round(float(hi_lvl), 3)], [100, round(float(hi_lvl), 3)]]})
    # 相频渐近线 = 零点渐近线 − 极点渐近线（折点处取值）
    bk = sorted({w1 / 10, 10 * w1, w2 / 10, 10 * w2, 0.01, 100})
    pa = first_order_asym_phase(np.array(bk), w1, +1) - first_order_asym_phase(np.array(bk), w2, +1)
    lead["phase"]["asym"].append({"color": PAL[i],
        "pts": [[round(float(b), 5), round(float(v), 3)] for b, v in zip(bk, pa)]})
    lead["marks"] += [
        {"type": "vline", "w": round(w2, 4), "label": "1/(αT)=%g" % w2, "color": PAL[i], "dy": 44 + 24 * i},
        {"type": "hlevel", "y": round(float(lvl), 3), "w0": round(float(wm), 4), "w1": 100,
         "label": "−10lgα=%.1f" % lvl, "color": PAL[i], "dy": -10},
    ]
    lead["meta"]["alphas"].append({"alpha": al, "w1": w1, "w2": round(w2, 4),
        "wm": round(float(wm), 4), "phim": round(phim, 2),
        "level_wm_db": round(float(lvl), 3), "level_hi_db": round(float(hi_lvl), 3)})
lead["marks"].insert(0, {"type": "vline", "w": 1, "label": "1/T=1", "color": "#5B6B8C", "dy": 20})
dump("lead08", lead)

# ============================================================
# lag12：滞后装置 Gc=(Ts+1)/(βTs+1)，T=1，β=2/5/10/20
# ============================================================
w = np.logspace(-3, 1, 400)
lag = {"xlim": [0.001, 10],
       "mag": {"ylim": [-30, 3], "curves": [], "asym": []},
       "phase": {"ylim": [-62, 3], "curves": [], "asym": []},
       "marks": [],
       "meta": {"T": 1, "betas": [], "note": "Gc=(Ts+1)/(βTs+1), T=1；高频衰减 −20lgβ"}}
for i, be in enumerate([2, 5, 10, 20]):
    num, den = [1.0, 1.0], [be, 1.0]
    pm, pp = bode_pts(w, num, den)
    cname = "β=%g" % be
    lag["mag"]["curves"].append({"name": cname, "color": PAL[i], "pts": pm})
    lag["phase"]["curves"].append({"name": cname, "color": PAL[i], "pts": pp})
    w2, w1 = 1.0 / be, 1.0                    # 极点在前（w2=1/(βT)），零点在后（w1=1/T）
    lvl = -20 * np.log10(be)
    wm = 1 / np.sqrt(be)
    phim = float(np.degrees(np.arctan(wm) - np.arctan(be * wm)))   # 负
    lag["mag"]["asym"].append({"color": PAL[i], "pts": [
        [0.001, 0], [w2, 0], [w1, round(float(lvl), 3)], [10, round(float(lvl), 3)]]})
    bk = sorted({w2 / 10, 10 * w2, w1 / 10, 10 * w1, 0.001, 10})
    pa = first_order_asym_phase(np.array(bk), w1, +1) - first_order_asym_phase(np.array(bk), w2, +1)
    lag["phase"]["asym"].append({"color": PAL[i],
        "pts": [[round(float(b), 5), round(float(v), 3)] for b, v in zip(bk, pa)]})
    lag["marks"] += [
        {"type": "vline", "w": round(w2, 4), "label": "1/(βT)=%g" % w2, "color": PAL[i], "dy": 44 + 24 * i},
        {"type": "hlevel", "y": round(float(lvl), 3), "w0": round(w1, 4), "w1": 10,
         "label": "−20lgβ=%.1f" % (-lvl) if False else "−20lgβ", "color": PAL[i], "dy": -8},
    ]
    lag["meta"]["betas"].append({"beta": be, "w1": w1, "w2": round(w2, 4),
        "wm": round(float(wm), 4), "phim": round(phim, 2), "level_hi_db": round(float(lvl), 3)})
lag["marks"].insert(0, {"type": "vline", "w": 1, "label": "1/T=1", "color": "#5B6B8C", "dy": 20})
dump("lag12", lag)

# ============================================================
# ex61：例6-1  G0=12/[s(s+1)]；Gc=(0.38s+1)/(0.12s+1)；校后 G=Gc·G0
# ============================================================
w = np.logspace(-1, 2, 400)
N0, D0 = [12.0], [1.0, 1.0, 0.0]                      # 12/[s(s+1)]
Nc, Dc = [0.38, 1.0], [0.12, 1.0]
N1 = np.polymul(Nc, N0); D1 = np.polymul(Dc, D0)      # 校后开环
wc1 = find_wc(N0, D0); g0 = gamma_at(N0, D0, wc1)
wc2 = find_wc(N1, D1); g1 = gamma_at(N1, D1, wc2)
phi_at_wc2 = phase_at(N1, D1, wc2)
phi0_at_wc1 = phase_at(N0, D0, wc1)
m0m, m0p = bode_pts(w, N0, D0)
mcm, mcp = bode_pts(w, Nc, Dc)
m1m, m1p = bode_pts(w, N1, D1)
# 渐近线
L0 = 20 * np.log10(12)
asym0 = [[0.1, round(float(L0 + 20), 3)], [1, round(float(L0), 3)], [100, round(float(L0 - 80), 3)]]
w1c, w2c = 1 / 0.38, 1 / 0.12
lc_hi = 20 * np.log10(0.38 / 0.12)
asymc = [[0.1, 0], [round(w1c, 3), 0], [round(w2c, 3), round(float(lc_hi), 3)], [100, round(float(lc_hi), 3)]]
ex61 = {"xlim": [0.1, 100],
        "mag": {"ylim": [-60, 45], "curves": [
            {"name": "G_{0}", "color": PAL[0], "pts": m0m},
            {"name": "G_{c}", "color": PAL[1], "pts": mcm},
            {"name": "G_{c}G_{0}", "color": PAL[2], "pts": m1m}],
          "asym": [{"color": PAL[0], "pts": asym0}, {"color": PAL[1], "pts": asymc}]},
        "phase": {"ylim": [-200, -60], "curves": [
            {"name": "G_{0}", "color": PAL[0], "pts": m0p},
            {"name": "G_{c}", "color": PAL[1], "pts": mcp},
            {"name": "G_{c}G_{0}", "color": PAL[2], "pts": m1p}],
          "asym": []},
        "marks": [
            {"type": "vline", "w": round(w1c, 3), "label": "1/T=%.2f" % w1c, "color": PAL[1], "dy": 20},
            {"type": "vline", "w": round(w2c, 3), "label": "1/(αT)=%.2f" % w2c, "color": PAL[1], "dy": 42},
            {"type": "wc", "w": round(float(wc1), 4), "label": "ω_{c1}=%.2f" % wc1, "dx": 14, "dy": -16},
            {"type": "margin", "w": round(float(wc1), 4), "gamma": round(g0, 1),
             "phi": round(phi0_at_wc1, 2), "label": "γ_{0}=%.1f°" % g0, "dx": 12, "dy": 6},
            {"type": "wc", "w": round(float(wc2), 4), "label": "ω_{c2}=%.2f" % wc2, "dx": 14, "dy": -38},
            {"type": "margin", "w": round(float(wc2), 4), "gamma": round(g1, 1),
             "phi": round(phi_at_wc2, 2), "label": "γ=%.1f°" % g1, "dx": 12, "dy": 6},
        ],
        "meta": {
            "G0": "12/[s(s+1)]", "Gc": "(0.38s+1)/(0.12s+1)",
            "wc1": {"val": round(float(wc1), 4), "label": "3.5"},
            "gamma0": {"val": round(float(g0), 2), "label": "16°"},
            "wc2": {"val": round(float(wc2), 4), "label": "4.6"},
            "gamma": {"val": round(float(g1), 2), "label": "42.6°"},
            "alpha": round(0.12 / 0.38, 4), "T": 0.38,
            "wm": round(1 / (0.38 * np.sqrt(0.12 / 0.38)), 4),
        }}
# 校正前后单位阶跃响应（闭环）
t = np.linspace(0, 8, 800)
Nb0, Db0 = N0, np.polyadd(D0, [0] * (len(D0) - len(N0)) + list(N0))
Nb1, Db1 = N1, np.polyadd(D1, [0] * (len(D1) - len(N1)) + list(N1))
y0 = step_response(Nb0, Db0, t)
y1 = step_response(Nb1, Db1, t)
ex61["step"] = {"t": [round(float(v), 4) for v in t],
                "before": [round(float(v), 4) for v in y0],
                "after": [round(float(v), 4) for v in y1],
                "before_meta": step_meta(t, y0), "after_meta": step_meta(t, y1)}
dump("ex61", ex61)
chk("例6-1 ωc1", wc1, 3.5, 0.15)
chk("例6-1 γ0", g0, 16.0, 0.6)
chk("例6-1 ωc2", wc2, 4.6, 0.10)
chk("例6-1 γ", g1, 42.6, 1.5)

# ============================================================
# ex63：例6-3  G0=5/[s(s+1)(0.5s+1)]；Gc=(17.86s+1)/(143s+1)
# ============================================================
w = np.logspace(-3, 2, 500)
N0, D0 = [5.0], [0.5, 1.5, 1.0, 0.0]                  # 5/[s(s+1)(0.5s+1)]
Nc, Dc = [17.86, 1.0], [143.0, 1.0]
N1 = np.polymul(Nc, N0); D1 = np.polymul(Dc, D0)
wc1 = find_wc(N0, D0); g0 = gamma_at(N0, D0, wc1)
wc2 = find_wc(N1, D1); g1 = gamma_at(N1, D1, wc2)
phi0_at_wc1 = phase_at(N0, D0, wc1)
phi_at_wc2 = phase_at(N1, D1, wc2)
wpc, Kg = gain_margin(N1, D1)
wc1_asym = 10 ** (1 / 3)                              # PDF 口径：渐近线交点 5·2/w³=1
g0_at_pdf = gamma_at(N0, D0, 2.2)                     # PDF 口径：γ0(ωc1=2.2)
m0m, m0p = bode_pts(w, N0, D0)
mcm, mcp = bode_pts(w, Nc, Dc)
m1m, m1p = bode_pts(w, N1, D1)
L0 = 20 * np.log10(5)
asym0 = [[0.001, round(float(L0 + 60), 3)], [1, round(float(L0), 3)],
         [2, round(float(L0 - 20 * np.log10(2) - 20 * np.log10(2)), 3)],
         [100, round(float(L0 - 20 * np.log10(100) - 20 * np.log10(100) - 20 * np.log10(50)), 3)]]
w2c, w1c = 1 / 143.0, 1 / 17.86
lc_lo = 20 * np.log10(17.86 / 143.0)
asymc = [[0.001, 0], [round(w2c, 5), 0], [round(w1c, 4), round(float(lc_lo), 3)], [100, round(float(lc_lo), 3)]]
ex63 = {"xlim": [0.001, 100],
        "mag": {"ylim": [-70, 85], "curves": [
            {"name": "G_{0}", "color": PAL[0], "pts": m0m},
            {"name": "G_{c}", "color": PAL[1], "pts": mcm},
            {"name": "G_{c}G_{0}", "color": PAL[2], "pts": m1m}],
          "asym": [{"color": PAL[0], "pts": asym0}, {"color": PAL[1], "pts": asymc}]},
        "phase": {"ylim": [-275, -60], "curves": [
            {"name": "G_{0}", "color": PAL[0], "pts": m0p},
            {"name": "G_{c}", "color": PAL[1], "pts": mcp},
            {"name": "G_{c}G_{0}", "color": PAL[2], "pts": m1p}],
          "asym": []},
        "marks": [
            {"type": "vline", "w": round(w2c, 5), "label": "1/(βT)=%.4f" % w2c, "color": PAL[1], "dy": 20},
            {"type": "vline", "w": round(w1c, 4), "label": "1/T=%.3f" % w1c, "color": PAL[1], "dy": 42},
            {"type": "wc", "w": round(float(wc1), 4), "label": "ω_{c1}=%.2f" % wc1, "dx": 14, "dy": -16},
            {"type": "margin", "w": round(float(wc1), 4), "gamma": round(g0, 1),
             "phi": round(phi0_at_wc1, 2), "label": "γ_{0}=%.1f°" % g0, "dx": 12, "dy": 6},
            {"type": "wc", "w": round(float(wc2), 4), "label": "ω_{c2}=%.2f" % wc2, "dx": 14, "dy": -38},
            {"type": "margin", "w": round(float(wc2), 4), "gamma": round(g1, 1),
             "phi": round(phi_at_wc2, 2), "label": "γ=%.1f°" % g1, "dx": 12, "dy": 6},
        ],
        "meta": {
            "G0": "5/[s(s+1)(0.5s+1)]", "Gc": "(17.86s+1)/(143s+1)",
            "wc1": {"val": round(float(wc1), 4), "label": "2.2",
                    "note": "PDF 口径 2.2 为渐近线读数；精确穿越 1.80"},
            "gamma0": {"val": round(float(g0), 2), "label": "−23°",
                       "note": "−23° 为 γ0(2.2)；精确 ωc1 处 γ0=−13.0°"},
            "wc1_asym": round(float(wc1_asym), 4),
            "gamma0_at_2.2": round(float(g0_at_pdf), 2),
            "wc2": {"val": round(float(wc2), 4), "label": "0.56"},
            "gamma": {"val": round(float(g1), 2), "label": "40.2°"},
            "beta": round(143.0 / 17.86, 4), "T": 17.86,
            "w_phase_cross": round(float(wpc), 4),
            "Kg_db": {"val": round(float(Kg), 2), "label": "≥10dB"},
        }}
dump("ex63", ex63)
chk("例6-3 ωc1(精确基准)", wc1, 1.80, 0.05)
chk("例6-3 γ0(精确基准)", g0, -13.0, 0.5)
chk("例6-3 ωc1(PDF渐近线口径)", wc1_asym, 2.2, 0.1)
chk("例6-3 γ0(PDF口径γ(2.2))", g0_at_pdf, -23.0, 1.0)
chk("例6-3 ωc2", wc2, 0.56, 0.05)
chk("例6-3 γ", g1, 40.2, 1.6)
assert Kg is not None and Kg >= 10, "例6-3 增益裕度检验失败: Kg=%s" % Kg
CHECKS.append(("例6-3 Kg≥10dB", Kg, ">=10", 0))

# ============================================================
# phi_alpha：φm–α 关系曲线  φm=asin((1−α)/(1+α))
# ============================================================
a = np.logspace(-2, 0, 300)
phim = np.degrees(np.arcsin((1 - a) / (1 + a)))
phi_alpha = {"xlim": [0.01, 1],
    "mag": {"name": "φ_{m}/°", "ylim": [0, 92], "curves": [
        {"name": "φ_{m}(α)", "color": PAL[0],
         "pts": [[round(float(ai), 5), round(float(pi), 4)] for ai, pi in zip(a, phim)]}],
      "asym": []},
    "marks": [
        {"type": "vline", "w": 0.1, "label": "α=0.1 → φ_{m}=54.9°", "color": PAL[2], "dy": 20},
    ],
    "meta": {"formula": "φm=asin((1−α)/(1+α))",
             "samples": {"0.5": 19.47, "0.2": 41.81, "0.1": 54.9, "0.05": 64.79}}}
# 与 lead08 各 α 的 φm 互验
for al, ref in zip([0.5, 0.2, 0.1, 0.05], [19.47, 41.81, 54.9, 64.79]):
    v = float(np.degrees(np.arcsin((1 - al) / (1 + al))))
    chk("φm(α=%g)" % al, v, ref, 0.05)
dump("phi_alpha", phi_alpha)

# ============================================================
# 核对表 + assert
# ============================================================
print("\n== 核对表（val=精确计算；label/口径=PDF 近似值）==")
for tag, meta in [("例6-1", ex61["meta"]), ("例6-3", ex63["meta"])]:
    for k in ["wc1", "gamma0", "wc2", "gamma"]:
        print("  %s %-7s val=%-10s label(PDF)=%s" % (tag, k, meta[k]["val"], meta[k]["label"]))
print("  例6-3 Kg = %.2f dB（要求 ≥10dB）  w_pc=%.3f" % (Kg, wpc))
print("  例6-1 阶跃：校前 σ%%=%.1f ts=%.2fs；校后 σ%%=%.1f ts=%.2fs" % (
    ex61["step"]["before_meta"]["overshoot_pct"], ex61["step"]["before_meta"]["settling_5pct"],
    ex61["step"]["after_meta"]["overshoot_pct"], ex61["step"]["after_meta"]["settling_5pct"]))

print("\n== assert 口径核对 ==")
fails = 0
for label, val, target, tol in CHECKS:
    if isinstance(target, str):
        ok = val >= 10
        print("  [%-2s] %-28s val=%.4f 要求 %s" % ("OK" if ok else "NG", label, val, target))
    else:
        ok = abs(val - target) <= tol
        print("  [%-2s] %-28s val=%9.4f 口径=%9.4f |Δ|=%.4f (tol=%.2f)" %
              ("OK" if ok else "NG", label, val, target, abs(val - target), tol))
    fails += 0 if ok else 1
assert fails == 0, "%d 项口径核对失败" % fails
print("\n全部核对通过（%d 项）。" % len(CHECKS))
