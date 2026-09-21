#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""第六章 滞后—超前校正装置数据生成器（p14 用，图不撒谎）
生成 lessons/lesson06-correction/data/laglead.js（BD.data["laglead"]）。

口径：
  滞后—超前 = 滞后段 × 超前段，T=1 归一化，β=10、α=1/β=0.1（无源网络 α·β=1 约束）。
    滞后段  G1(s) = (Ts+1)/(βTs+1)         极点 1/(βT)=0.1、零点 1/T=1
    超前段  G2(s) = (Ts+1)/(αTs+1)         零点 1/T=1、极点 1/(αT)=10
    合成    Gc(s) = (Ts+1)^2 / [(βTs+1)(αTs+1)]
  与 PDF 无源滞后—超前网络 Gc=(T1s+1)(T2s+1)/[(βT1s+1)(T2/β·s+1)] 同构（取 T1=T2=T）。
  数据仅新增 laglead.js，不改动 gen_ch6_data.py 与已有 data 文件。
"""
import json
import os
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "lessons", "lesson06-correction", "data"))
os.makedirs(OUT, exist_ok=True)

PAL = ["#1D3FA0", "#0E7A36", "#C02A20", "#7B21C8", "#C2410C"]
ASY = "#F5821F"
T, BETA = 1.0, 10.0
ALPHA = 1.0 / BETA

def tf_eval(w, num, den):
    s = 1j * np.asarray(w, dtype=float)
    H = np.polyval(num, s) / np.polyval(den, s)
    return 20 * np.log10(np.abs(H)), np.degrees(np.angle(H))

def bode_pts(w, num, den, nd=4):
    m, p = tf_eval(w, num, den)
    return ([[round(float(wi), 5), round(float(mi), nd)] for wi, mi in zip(w, m)],
            [[round(float(wi), 5), round(float(pi), nd)] for wi, pi in zip(w, p)])

def first_order_asym_phase(wpts, wc, sign):
    """一阶环节相频渐近线：0 → ±45°/dec（wc/10 到 10wc）→ ±90°"""
    out = []
    for w in wpts:
        if w <= wc / 10: out.append(0.0)
        elif w >= 10 * wc: out.append(90.0 * sign)
        else: out.append(45.0 * sign * np.log10(w / (wc / 10)))
    return np.array(out)

print("== 生成 laglead（滞后—超前，T=1，β=%g，α=%g）==" % (BETA, ALPHA))

w = np.logspace(-2, 2, 400)
w1, w2, w3 = 1.0 / BETA, 1.0, 1.0 / ALPHA          # 0.1 / 1 / 10
LVL = -20 * np.log10(BETA)                          # −20lgβ = −20 dB（中段渐近线电平）

# 滞后段 (Ts+1)/(βTs+1)
Nlag, Dlag = [T, 1.0], [BETA * T, 1.0]
# 合成 (Ts+1)^2 / [(βTs+1)(αTs+1)]
Nll = np.polymul([T, 1.0], [T, 1.0])
Dll = np.polymul([BETA * T, 1.0], [ALPHA * T, 1.0])

m_lag, p_lag = bode_pts(w, Nlag, Dlag)
m_ll, p_ll = bode_pts(w, Nll, Dll)

# 相频渐近线：滞后段 = 零点(1/T) − 极点(1/(βT))；合成再 +零点(1/T) −极点(1/(αT))
bk = sorted({w1 / 10, 10 * w1, w2 / 10, 10 * w2, w3 / 10, 10 * w3, 0.01, 100})
pa_lag = first_order_asym_phase(np.array(bk), w2, +1) - first_order_asym_phase(np.array(bk), w1, +1)
pa_ll = pa_lag + first_order_asym_phase(np.array(bk), w2, +1) - first_order_asym_phase(np.array(bk), w3, +1)

data = {
    "xlim": [0.01, 100],
    "mag": {"ylim": [-24, 4], "curves": [
        {"name": "滞后部分", "color": PAL[0], "pts": m_lag},
        {"name": "滞后—超前", "color": PAL[2], "pts": m_ll}],
      "asym": [
        {"color": PAL[0], "pts": [[0.01, 0], [w1, 0], [w2, round(float(LVL), 3)], [100, round(float(LVL), 3)]]},
        {"color": ASY, "pts": [[0.01, 0], [w1, 0], [w2, round(float(LVL), 3)], [w3, 0], [100, 0]]}]},
    "phase": {"ylim": [-62, 45], "curves": [
        {"name": "滞后部分", "color": PAL[0], "pts": p_lag},
        {"name": "滞后—超前", "color": PAL[2], "pts": p_ll}],
      "asym": [
        {"color": PAL[0], "pts": [[round(float(b), 5), round(float(v), 3)] for b, v in zip(bk, pa_lag)]},
        {"color": ASY, "pts": [[round(float(b), 5), round(float(v), 3)] for b, v in zip(bk, pa_ll)]}]},
    "marks": [
        {"type": "vline", "w": w1, "label": "1/(βT)=0.1", "color": "#5B6B8C", "dy": 20},
        {"type": "vline", "w": w2, "label": "1/T=1", "color": "#5B6B8C", "dy": 44},
        {"type": "vline", "w": w3, "label": "1/(αT)=10", "color": "#5B6B8C", "dy": 22},
        {"type": "hlevel", "y": round(float(LVL), 3), "w0": w2, "w1": w3,
         "label": "−20lgβ=−20 dB", "color": ASY, "dy": -12},
    ],
    "meta": {"T": T, "beta": BETA, "alpha": ALPHA,
             "w_lag_pole": w1, "w_zero": w2, "w_lead_pole": w3,
             "level_mid_db": round(float(LVL), 3),
             "note": "Gc=(Ts+1)^2/[(βTs+1)(αTs+1)]，T=1，β=10，α=1/β；低频滞后衰减、高频超前补偿"}}

path = os.path.join(OUT, "laglead.js")
with open(path, "w", encoding="utf-8") as f:
    f.write('BD.data["laglead"]=%s;\n' % json.dumps(data, ensure_ascii=False, separators=(",", ":")))
print("  written %s (%d bytes)" % (os.path.relpath(path, HERE), os.path.getsize(path)))

# ---------- assert 自检 ----------
mm, pp = tf_eval(1.0, Nll, Dll)
print("  合成 ω=1：L=%.4f dB，φ=%.4f°" % (mm, pp))
assert abs(mm - (-14.0658)) < 0.01, "合成 L(1) 应≈−14.07 dB"
assert abs(pp) < 0.01, "合成 φ(1) 应=0°（0.1 与 10 的几何中心）"
mm_lo, _ = tf_eval(0.01, Nll, Dll); mm_hi, _ = tf_eval(100.0, Nll, Dll)
print("  合成端点：L(0.01)=%.4f dB，L(100)=%.4f dB" % (mm_lo, mm_hi))
assert abs(mm_lo) < 0.1 and abs(mm_hi) < 0.1, "合成曲线低频/高频应回到 0 dB 附近"
ph = np.array([p[1] for p in p_ll])
print("  合成相角范围：%.2f° ~ %.2f°" % (ph.min(), ph.max()))
assert 41.5 < -ph.min() < 42.5 and 41.5 < ph.max() < 42.5, "合成相角极值应约 ±42°"
ph_lag = np.array([p[1] for p in p_lag])
assert abs(ph_lag.min() - (-54.9)) < 0.05, "滞后段 φm 应与 lag12 β=10 口径 −54.9° 一致"
assert abs(LVL - (-20.0)) < 1e-9, "−20lgβ 应为 −20 dB"
print("全部自检通过。")
