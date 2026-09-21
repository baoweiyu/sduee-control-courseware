#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""第六章《控制系统的校正》补充数据生成器：PD / PI / PID 及滞后-超前装置（图不撒谎）
生成 lessons/lesson06-correction/data/pid.js（BD.data["pid"] 与 BD.data["pid_ll"]），并打印核对表。

口径说明（重要）：
  全部曲线、关键点均以【精确计算】为准，时间常数归一化：
    PD   Gc(s)=1+Td·s，Td=1            零点 s=−1/Td=−1
    PI   Gc(s)=1+1/(Ti·s)=(Ti·s+1)/(Ti·s)，Ti=1   原点极点 + 零点 s=−1/Ti=−1
    PID  Gc(s)=(Td·Ti·s²+Ti·s+1)/(Ti·s)，Ti=1，Td=0.2
         两零点为相异负实根（要求 Ti²−4·Td·Ti>0）：s=−1.382、−3.618
         幅频最小值恰为 0 dB（ω=√5 处，解析可证）
    滞后-超前 Gc(s)=(s+1)²/((10s+1)(0.1s+1))（β=10，T1=T2=1）
  只新增本文件与 data/pid.js，不改动任何已有数据。
"""
import json
import os
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "lessons", "lesson06-correction", "data"))
os.makedirs(OUT, exist_ok=True)

def tf_eval(w, num, den):
    s = 1j * np.asarray(w, dtype=float)
    H = np.polyval(num, s) / np.polyval(den, s)
    return 20 * np.log10(np.abs(H)), np.degrees(np.angle(H))

def bode_pts(w, num, den):
    m, p = tf_eval(w, num, den)
    pts_m = [[round(float(wi), 5), round(float(mi), 4)] for wi, mi in zip(w, m)]
    pts_p = [[round(float(wi), 5), round(float(pi), 4)] for wi, pi in zip(w, p)]
    return pts_m, pts_p

PAL = ["#1D3FA0", "#0E7A36", "#C02A20", "#7B21C8"]

def dump(name, obj):
    path = os.path.join(OUT, name + ".js")
    with open(path, "w", encoding="utf-8") as f:
        f.write('BD.data["%s"]=%s;\n' % (name, json.dumps(obj, ensure_ascii=False, separators=(",", ":"))))
    print("  written %s (%d bytes)" % (os.path.relpath(path, HERE), os.path.getsize(path)))

CHECKS = []
def chk(label, val, target, tol):
    CHECKS.append((label, val, target, tol))

print("== 生成 PID / 滞后-超前 数据 ==")

w = np.logspace(-2, 2, 400)

# ---------------- PD：Gc=1+Td·s，Td=1 ----------------
Npd, Dpd = [1.0, 1.0], [1.0]
pd_m, pd_p = bode_pts(w, Npd, Dpd)
# ---------------- PI：Gc=(Ti·s+1)/(Ti·s)，Ti=1 ----------------
Npi, Dpi = [1.0, 1.0], [1.0, 0.0]
pi_m, pi_p = bode_pts(w, Npi, Dpi)
# ---------------- PID：Gc=(0.2s²+s+1)/s（Ti=1，Td=0.2） ----------------
Ti, Td = 1.0, 0.2
Npid, Dpid = [Td * Ti, Ti, 1.0], [Ti, 0.0]
pid_m, pid_p = bode_pts(w, Npid, Dpid)
zeros = np.roots(Npid)                       # 两个相异负实零点
assert np.all(np.isreal(zeros)) and np.all(zeros < 0), "PID 零点须为相异负实根: %s" % zeros
wz = sorted(float(-z) for z in zeros)        # 零点转折频率 1.382、3.618

pid = {"xlim": [0.01, 100],
       "mag": {"ylim": [-5, 44], "curves": [
           {"name": "PD", "color": PAL[0], "pts": pd_m},
           {"name": "PI", "color": PAL[1], "pts": pi_m},
           {"name": "PID", "color": PAL[2], "pts": pid_m}]},
       "phase": {"ylim": [-95, 95], "curves": [
           {"name": "PD", "color": PAL[0], "pts": pd_p},
           {"name": "PI", "color": PAL[1], "pts": pi_p},
           {"name": "PID", "color": PAL[2], "pts": pid_p}]},
       "marks": [
           {"type": "vline", "w": 1, "label": "1/T_{d}=1", "color": PAL[0], "dy": 20, "curve": "PD"},
           {"type": "vline", "w": 1, "label": "1/T_{i}=1", "color": PAL[1], "dy": 20, "curve": "PI"},
           {"type": "vline", "w": round(wz[0], 3), "label": "ω_{z1}=%.2f" % wz[0], "color": PAL[2], "dy": 20, "curve": "PID"},
           {"type": "vline", "w": round(wz[1], 3), "label": "ω_{z2}=%.2f" % wz[1], "color": PAL[2], "dy": 44, "curve": "PID"},
       ],
       "meta": {
           "PD": {"Gc": "1+Td·s", "Td": 1, "zero": -1,
                  "note": "相位 0°→+90° 超前；幅频 +20dB/dec"},
           "PI": {"Gc": "(Ti·s+1)/(Ti·s)", "Ti": 1, "zero": -1,
                  "note": "相位 −90°→0°；低频增益大、高频增益趋于 1"},
           "PID": {"Gc": "(Td·Ti·s²+Ti·s+1)/(Ti·s)", "Ti": Ti, "Td": Td,
                   "zeros": [round(float(z), 4) for z in zeros],
                   "wz": [round(wz[0], 4), round(wz[1], 4)],
                   "note": "相位 −90°→+90°；幅频最小 0dB（ω=√5）"},
       }}
dump("pid", pid)

# 解析自检
m1, p1 = tf_eval(1.0, Npd, Dpd)
chk("PD ω=1 相位", float(p1), 45.0, 0.05)
chk("PD ω=1 幅值", float(m1), 3.0103, 0.01)
m2, p2 = tf_eval(1.0, Npi, Dpi)
chk("PI ω=1 相位", float(p2), -45.0, 0.05)
chk("PI ω=1 幅值", float(m2), 3.0103, 0.01)
_, p_lo = tf_eval(1e-3, Npid, Dpid)
_, p_hi = tf_eval(1e3, Npid, Dpid)
chk("PID 低频相位→−90°", float(p_lo), -90.0, 0.5)
chk("PID 高频相位→+90°", float(p_hi), 90.0, 0.5)
m_min, _ = tf_eval(np.sqrt(5.0), Npid, Dpid)
chk("PID 幅频最小值（ω=√5）", float(m_min), 0.0, 0.01)
chk("PID 零点频率 ωz1", wz[0], 1.3820, 0.001)
chk("PID 零点频率 ωz2", wz[1], 3.6180, 0.001)

# ---------------- 滞后-超前：Gc=(s+1)²/((10s+1)(0.1s+1))（β=10） ----------------
# 并入 pid.js 输出（BD.data["pid_ll"]，p19 一览表专用）；
# 注意：data/laglead.js 为其它批次的数据文件，本生成器不写该文件。
Nll = np.polymul([1.0, 1.0], [1.0, 1.0])
Dll = np.polymul([10.0, 1.0], [0.1, 1.0])
ll_m, ll_p = bode_pts(w, Nll, Dll)
laglead = {"xlim": [0.01, 100],
           "mag": {"ylim": [-18, 6], "curves": [
               {"name": "滞后-超前", "color": PAL[3], "pts": ll_m}]},
           "phase": {"ylim": [-62, 62], "curves": [
               {"name": "滞后-超前", "color": PAL[3], "pts": ll_p}]},
           "marks": [
               {"type": "vline", "w": 0.1, "label": "1/(βT)=0.1", "color": PAL[3], "dy": 20},
               {"type": "vline", "w": 1, "label": "1/T=1", "color": "#5B6B8C", "dy": 44},
               {"type": "vline", "w": 10, "label": "β/T=10", "color": PAL[3], "dy": 20},
           ],
           "meta": {"Gc": "(s+1)²/((10s+1)(0.1s+1))", "beta": 10,
                    "note": "低频段滞后衰减、高频段超前补偿"}}

mll, pll = tf_eval(1.0, Nll, Dll)
# 解析值：|Gc(j)| = |1+j|²/(|1+10j|·|1+0.1j|) = 2/(√101·√1.01)
chk("滞后-超前 ω=1 幅值(解析)", float(mll), float(20 * np.log10(2.0 / (np.sqrt(101) * np.sqrt(1.01)))), 1e-6)
chk("滞后-超前 ω=1 相位(解析)", float(pll), float(np.degrees(2 * np.arctan(1.0) - np.arctan(10.0) - np.arctan(0.1))), 1e-6)
mll0, _ = tf_eval(1e-4, Nll, Dll)
mllh, _ = tf_eval(1e4, Nll, Dll)
chk("滞后-超前 低频增益→0dB", float(mll0), 0.0, 0.01)
chk("滞后-超前 高频增益→0dB", float(mllh), 0.0, 0.05)

# 滞后-超前数据集追加写入 pid.js（与 PD/PI/PID 同文件，p19 一览表按名引用）
_path = os.path.join(OUT, "pid.js")
with open(_path, "a", encoding="utf-8") as _f:
    _f.write('BD.data["pid_ll"]=%s;\n' % json.dumps(laglead, ensure_ascii=False, separators=(",", ":")))
print("  appended BD.data[\"pid_ll\"] -> %s" % os.path.relpath(_path, HERE))

print("\n== assert 口径核对 ==")
fails = 0
for label, val, target, tol in CHECKS:
    ok = abs(val - target) <= tol
    print("  [%-2s] %-30s val=%9.4f 口径=%9.4f |Δ|=%.4f (tol=%.2f)" %
          ("OK" if ok else "NG", label, val, target, abs(val - target), tol))
    fails += 0 if ok else 1
assert fails == 0, "%d 项口径核对失败" % fails
print("\n全部核对通过（%d 项）。" % len(CHECKS))
