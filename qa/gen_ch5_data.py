# -*- coding: utf-8 -*-
"""第五章根轨迹图形数据生成：lessons/lesson05-root-locus/data/*.js（R1 红线工具输出）

全部曲线由特征方程数值求根扫掠生成，关键点经 rlocus_gen.TF 解析交叉验证。
"""
import json
import sys
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from rlocus_gen import TF, figure_data  # noqa: E402

OUT = Path(__file__).resolve().parent.parent / "lessons" / "lesson05-root-locus" / "data"
OUT.mkdir(parents=True, exist_ok=True)


def emit(name, data):
    p = OUT / f"{name}.js"
    p.write_text("RL.data." + name + "=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";",
                 encoding="utf-8")
    print(name, p.stat().st_size, "bytes")


def fig(tf, mode="180", kmax=50, xlim=None, ylim=None, maxpts=200, **kw):
    d = figure_data(tf, mode=mode, kmax=kmax, xlim=xlim, ylim=ylim, maxpts=maxpts, **kw)
    # 语义化：分支按共轭对同色已在页面端处理；这里只保留数值
    return d


# ---- P6 引例：G=K1/(s(s+2)) → 竖直线 σ=-1 ----
emit("intro", fig(TF([1], [1, 2, 0]), kmax=65, xlim=(-3.0, 1.0), ylim=(-8, 8), maxpts=140))

# ---- P15 法则3示例：G=K1(s+1)/[s(s+2)(s+4)] ----
emit("law3", fig(TF([1, 1], np.polymul([1, 2, 0], [1, 4])), kmax=60,
                 xlim=(-5.2, 1.6), ylim=(-4, 4), maxpts=140))

# ---- P16-19 例5-3：G=K1(s+2)/[s(s+1)] 圆轨迹 ----
d53 = fig(TF([1, 2], [1, 1, 0]), kmax=40, xlim=(-4.8, 1.4), ylim=(-3.2, 3.2), maxpts=160)
d53["circle"] = {"cx": -2.0, "cy": 0.0, "r": 2 ** 0.5}
emit("ex53", d53)

# ---- P21 渐近线示例两个系统 ----
emit("law4a", fig(TF([1], [1, 2, 0]), kmax=60, xlim=(-3.4, 1.2), ylim=(-4.5, 4.5), maxpts=120))
emit("law4b", fig(TF([1], np.polymul([1, 1, 0], [1, 4])), kmax=200,
                  xlim=(-6.4, 1.6), ylim=(-6.5, 6.5), maxpts=140))

# ---- P28-30 / P39-42 / P59-60 例5-4=例5-5/5-6=例5-13 系统：K1/[s(s+3)(s^2+2s+2)] ----
tf54 = TF([1], np.polymul([1, 3, 0], [1, 2, 2]))
d54 = fig(tf54, kmax=900, xlim=(-5.6, 1.6), ylim=(-5.2, 5.2), maxpts=220)
d54["zeta"] = 0.5          # ζ=0.5 射线（页面绘制）
d54["pts_291"] = {"poles": [[-2.735, 0], [-1.543, 0], [-0.361, 0.748], [-0.361, -0.748]], "K": 2.91}
d54["pts_262"] = {"poles": [[-2.772, 0], [-1.411, 0], [-0.409, 0.709], [-0.409, -0.709]], "K": 2.62}
emit("ex54", d54)

# ---- P32-38 例5-2：K1/[s(s+1)(s+2)] ----
tf52 = TF([1], [1, 3, 2, 0])
d52 = fig(tf52, kmax=60, xlim=(-4.2, 1.6), ylim=(-4.4, 4.4), maxpts=200)
# K=1 时极点（例5-2⑦ 求点）：s^3+3s^2+2s+1
r1 = np.roots([1, 3, 2, 1])
d52["pts_k1"] = {"poles": [[round(float(x.real), 3), round(float(x.imag), 3)] for x in sorted(r1, key=lambda z: -z.imag)], "K": 1}
emit("ex52", d52)

# ---- P42 例5-7：K1/[s(s+4)(s^2+4s+20)]，K=260 ----
tf57 = TF([1], np.polymul([1, 4, 0], [1, 4, 20]))
d57 = fig(tf57, kmax=8000, xlim=(-11, 5), ylim=(-11, 11), maxpts=220)
emit("ex57", d57)

# ---- P46-47 例5-8：等效 G*=a·s/[(s+2j)(s-2j)] ----
d58 = fig(TF([1, 0], [1, 0, 4]), kmax=200, xlim=(-6.4, 1.2), ylim=(-4.2, 4.2), maxpts=160)
d58["circle"] = {"cx": 0.0, "cy": 0.0, "r": 2.0}
emit("ex58", d58)

# ---- P48 例5-9：图5-11 K1/[s^2(s+1)] 与根轨迹族 ----
d59a = fig(TF([1], [1, 1, 0, 0]), kmax=12, xlim=(-3.2, 1.4), ylim=(-2.6, 2.6), maxpts=140)
# 标注 K11=0.2 / K12=1.5 时等效系统极点（s²(s+1)+K=0）
marks = {}
for tag, K in (("k11", 0.2), ("k12", 1.5)):
    r = np.roots([1, 1, 0, K])
    marks[tag] = [[round(float(x.real), 3), round(float(x.imag), 3)] for x in sorted(r, key=lambda z: -z.imag)]
d59a["marks"] = marks
emit("ex59a", d59a)

# 族：对 K=0.1/0.35/1.0，等效 GH_a = a·s(s+1)/[s²(s+1)+K]
fam = []
for K in (0.1, 0.35, 1.0):
    den = [1, 1, 0, K]
    dd = fig(TF(np.polymul([1, 0], [1, 1]), den), kmax=40,
             xlim=(-3.4, 1.2), ylim=(-3.2, 3.2), maxpts=120)
    dd["K"] = K
    fam.append(dd)
emit("ex59b", {"loci": fam})

# ---- P51-53 例5-10（零度）：K1/[s(s+1)(s+2)] mode 0 ----
d510 = fig(tf52, mode="0", kmax=60, xlim=(-4.2, 3.2), ylim=(-4.4, 4.4), maxpts=200)
emit("ex510", d510)

# ---- P54 例5-11 两系统：±K1(s+1)/[(s-1)(s+2)] ----
zps = dict(zeros=[-1.0], poles=[1.0, -2.0])
d511a = fig(TF.from_zp(**zps), mode="180", kmax=40, xlim=(-3.4, 2.6), ylim=(-3.4, 3.4), maxpts=120)
d511b = fig(TF.from_zp(**zps), mode="0", kmax=40, xlim=(-3.4, 2.6), ylim=(-3.4, 3.4), maxpts=120)
emit("ex511", {"a": d511a, "b": d511b})

# ---- P55 例5-12：K1(s^2-2s+5)/[(s+2)(s-0.5)] ----
d512 = fig(TF([1, -2, 5], np.polymul([1, 2], [1, -0.5])), kmax=8,
           xlim=(-3.2, 3.4), ylim=(-3.4, 3.4), maxpts=220)
d512["inang"] = 199.0
d512["crit"] = {"seg": [-0.2, 0.75]}   # 稳定区间 0.2<K<0.75
emit("ex512", d512)

# ---- P63-64 例5-14：G=K(0.8s+1)/[s(5s+1)] → K*=0.16K ----
d514 = fig(TF([1, 1.25], [1, 0.2, 0]), kmax=40, xlim=(-3.0, 1.0), ylim=(-2.4, 2.4), maxpts=200)
d514["circle"] = {"cx": -1.25, "cy": 0.0, "r": float(np.sqrt(1.25 * 1.05))}
d514["gain"] = {"scale": 0.16, "note": "K*=0.16K"}
d514["pts_k5"] = {"poles": [[-0.5, 0.866], [-0.5, -0.866]], "K": 5}
d514["pts_k287"] = {"poles": [[-2.396, 0]], "K": 28.7}
emit("ex514", d514)

# ---- P65 例5-15：Φ=2.7/(s^3+5s^2+4s+2.7) 阶跃响应系数 ----
r = np.roots([1, 5, 4, 2.7])
print("例5-15(2.7版) 极点:", np.round(r, 4))
# c(t)=1+A e^{p3 t}+e^{σt}(B cos ωt + C sin ωt)，c(0)=c'(0)=c''(0)=0
p3 = float(np.real(r[np.argmax(np.real(r) < -2)]))
# 明确取实极点
p3 = float([x for x in r if abs(x.imag) < 1e-9][0])
sig = float(np.real([x for x in r if x.imag > 0][0]))
w = float(np.imag([x for x in r if x.imag > 0][0]))
wn2 = sig * sig + w * w
M = np.array([
    [1, 1, 0],
    [p3, sig, w],
    [p3 ** 2, sig ** 2 - w * w, 2 * sig * w],
])
v = np.array([-1.0, 0.0, 0.0])
A, B, C = np.linalg.solve(M, v)
print(f"  p3={p3:.4f} σ={sig:.4f} ω={w:.4f} ωn={np.sqrt(wn2):.4f} ζ={-sig/np.sqrt(wn2):.4f} A={A:.4f} B={B:.4f} C={C:.4f}")
# 二阶近似 0.6427/(s^2+0.7992 s+0.6427) 的阶跃
s2, w2 = sig, w
zn = -sig / np.sqrt(wn2)
print(f"  二阶近似: c2=1-e^({s2:.4f}t)[cos({w2:.4f}t)+{(zn/np.sqrt(1-zn**2)):.4f} sin({w2:.4f}t)]")
emit("ex515", {"poles": [[round(float(x.real), 4), round(float(x.imag), 4)] for x in r],
               "resp3": {"p3": round(p3, 4), "sig": round(sig, 4), "w": round(w, 4),
                          "A": round(float(A), 4), "B": round(float(B), 4), "C": round(float(C), 4)},
               "wn": round(float(np.sqrt(wn2)), 4), "zeta": round(float(zn), 4)})

# ---- P66 例5-16：五种情形（a=1） ----
cases = []
for tag, tf_c, km in [
    ("b_inf", TF([1], [1, 1, 0, 0]), 60),        # b→∞：K1/[s^2(s+1)]
    ("b_gt", TF([1, 2], [1, 1, 0, 0]), 60),      # b=2>a=1
    ("b_eq", TF([1, 1], [1, 1, 0, 0]), 60),      # b=a=1（偶极子对消 → K1/[s(s+1)]·(s+1)/(... ) 实为 (s+1)/[s²(s+1)]）
    ("b_lt", TF([1, 0.5], [1, 1, 0, 0]), 60),    # b=0.5<a=1
    ("b_0", TF([1], np.polymul([1, 0], [1, 1])), 60),  # b=0：K1/[s(s+1)]
]:
    dd = fig(tf_c, kmax=km, xlim=(-3.4, 2.2), ylim=(-3.0, 3.0), maxpts=110)
    sa, angs, q = tf_c.asymptote()
    dd["sig_a"] = round(float(sa), 3) if sa is not None else None
    dd["ang_a"] = [round(a) for a in angs]
    cases.append({"tag": tag, "d": dd})
emit("ex516", {"cases": cases})

# ---- P67 开环极点影响：K1/[s(s+1)] 与 K1/[s(s+1)(s+2)] ----
d67a = fig(TF([1], np.polymul([1, 0], [1, 1])), kmax=60, xlim=(-3.4, 1.2), ylim=(-3.2, 3.2), maxpts=110)
d67b = fig(tf52, kmax=30, xlim=(-3.8, 1.4), ylim=(-3.6, 3.6), maxpts=130)
emit("p67", {"a": d67a, "b": d67b})

print("ALL ch5 data emitted.")

# ---- R4 共轭分支同色：为各图手工指定分支配对（分支顺序=初始根按 (im,re) 排序） ----
PAIRS = {
    "intro": [[0, 1]],
    "law3": [[1, 2]],
    "ex53": [[0, 1]],
    "law4a": [[0, 1]],
    "law4b": [[1, 2]],
    "ex54": [[0, 1], [2, 3]],
    "ex52": [[1, 2]],
    "ex57": [[0, 1], [2, 3]],
    "ex58": [[0, 1]],
    "ex59a": [[1, 2]],
    "ex510": [[1, 2]],
    "ex511a": [[0, 1]],
    "ex511b": [[0, 1]],
    "ex512": [[0, 1]],
    "ex514": [[0, 1]],
    "ex516": [[1, 2]],
    "p67a": [[0, 1]],
    "p67b": [[1, 2]],
}
import json as _json
from pathlib import Path as _P
DATA = _P(__file__).resolve().parent.parent / "lessons" / "lesson05-root-locus" / "data"
for name, pr in PAIRS.items():
    for suffix in ("", ""):
        f = DATA / (name + ".js")
        if f.exists():
            txt = f.read_text(encoding="utf-8")
            tag = "RL.data." + name + "="
            body = txt[len(tag):-1]
            d = _json.loads(body)
            d["pairs"] = pr
            f.write_text(tag + _json.dumps(d, ensure_ascii=False, separators=(",", ":")) + ";", encoding="utf-8")
# ex511 / ex511b 子数据与 ex516 族、p67 子图
f = DATA / "ex511.js"
if f.exists():
    txt = f.read_text(encoding="utf-8")
    d = _json.loads(txt[len("RL.data.ex511="):-1])
    d["a"]["pairs"] = [[0, 1]]
    d["b"]["pairs"] = [[0, 1]]
    f.write_text("RL.data.ex511=" + _json.dumps(d, ensure_ascii=False, separators=(",", ":")) + ";", encoding="utf-8")
f = DATA / "ex516.js"
if f.exists():
    txt = f.read_text(encoding="utf-8")
    d = _json.loads(txt[len("RL.data.ex516="):-1])
    for c in d["cases"]:
        c["d"]["pairs"] = [[1, 2]]
    f.write_text("RL.data.ex516=" + _json.dumps(d, ensure_ascii=False, separators=(",", ":")) + ";", encoding="utf-8")
f = DATA / "p67.js"
if f.exists():
    txt = f.read_text(encoding="utf-8")
    d = _json.loads(txt[len("RL.data.p67="):-1])
    d["a"]["pairs"] = [[0, 1]]
    d["b"]["pairs"] = [[1, 2]]
    f.write_text("RL.data.p67=" + _json.dumps(d, ensure_ascii=False, separators=(",", ":")) + ";", encoding="utf-8")
print("pairs injected")
