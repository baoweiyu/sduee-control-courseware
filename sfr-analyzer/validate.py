#!/usr/bin/env python3
"""SFR Lab 独立数值验证。

Python 使用 numpy.roots 与状态方程 RK4 积分，不调用网页的解析响应公式；
随后通过 js_bridge.js 调用网页实际 core.js，对极点、零点、特征量、响应和指标交叉核对。
运行：python validate.py
"""
from __future__ import annotations

import json
import math
import os
import shutil
import subprocess
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent
LOAD_STEP = 0.1
RATED_FREQUENCY = 50.0


def independent_parameters(test: dict) -> dict[str, float]:
    if "parameters" in test:
        return {k: float(v) for k, v in test["parameters"].items()}
    config = test["config"]
    p = {k: float(v) for k, v in config["base"].items()}
    scan = config["scan"]
    value = float(test["scanValue"])
    variable, path = scan["variable"], scan["path"]
    if variable in p:
        p[variable] = value
    elif variable == "T1":
        if path == "fixedD":
            p["H"] = value * p["D"] / 2.0
        else:
            p["D"] = 2.0 * p["H"] / value
    elif variable == "lambda":
        t1 = 2.0 * p["H"] / p["D"]
        t2 = p["TR"]
        if path == "A":
            p["TR"] = t1 / value
        elif path == "B":
            p["H"] = value * t2 * p["D"] / 2.0
        else:
            tm = math.sqrt(t1 * t2)
            p["H"] = tm * math.sqrt(value) * p["D"] / 2.0
            p["TR"] = tm / math.sqrt(value)
    return p


def independent_characteristic(p: dict[str, float]) -> dict:
    a2 = 2.0 * p["H"] * p["TR"]
    a1 = 2.0 * p["H"] + (p["D"] + p["KF"] * p["FH"]) * p["TR"]
    a0 = p["D"] + p["KF"]
    reduced = math.isclose(p["FH"], 1.0, abs_tol=1e-10)
    if reduced:
        roots = np.array([complex(-a0 / (2.0 * p["H"]), 0.0)])
        wn, zeta = None, None
        zero = None
    else:
        roots = np.roots([a2, a1, a0])
        roots = np.array(sorted(roots, key=lambda x: (x.real, x.imag)))
        wn = math.sqrt(a0 / a2)
        zeta = a1 / (2.0 * math.sqrt(a0 * a2))
        zero = -1.0 / p["TR"]
    return {
        "poles": roots,
        "wn": wn,
        "zeta": zeta,
        "zero": zero,
        "reduced": reduced,
        "a2": a2,
        "a1": a1,
        "a0": a0,
    }


def derivatives(p: dict[str, float], state: np.ndarray, reduced: bool) -> np.ndarray:
    """完整模型采用能控标准形；输入为 -ΔP 的恒定负荷扰动。"""
    u = -LOAD_STEP
    if reduced:
        return np.array([-p["D"] / (2 * p["H"]) * state[0] - p["KF"] / (2 * p["H"]) * state[0] + u / (2 * p["H"])])
    a2 = 2.0 * p["H"] * p["TR"]
    a1 = 2.0 * p["H"] + (p["D"] + p["KF"] * p["FH"]) * p["TR"]
    a0 = p["D"] + p["KF"]
    return np.array([state[1], -(a0 / a2) * state[0] - (a1 / a2) * state[1] + u / a2])


def output(p: dict[str, float], state: np.ndarray, reduced: bool) -> float:
    return float(state[0] if reduced else state[0] + p["TR"] * state[1])


def independent_response(p: dict[str, float], duration: float, steps: int = 20000) -> dict:
    ch = independent_characteristic(p)
    reduced = ch["reduced"]
    dt = duration / steps
    state = np.zeros(1 if reduced else 2)
    times = np.linspace(0.0, duration, steps + 1)
    deviations = np.empty(steps + 1)
    deviations[0] = output(p, state, reduced)
    for i in range(steps):
        k1 = derivatives(p, state, reduced)
        k2 = derivatives(p, state + dt * k1 / 2.0, reduced)
        k3 = derivatives(p, state + dt * k2 / 2.0, reduced)
        k4 = derivatives(p, state + dt * k3, reduced)
        state = state + dt * (k1 + 2 * k2 + 2 * k3 + k4) / 6.0
        deviations[i + 1] = output(p, state, reduced)
    steady = -LOAD_STEP / (p["D"] + p["KF"])
    # 一阶单调响应的理论最低点位于仿真末端，避免指数衰减至机器精度后受舍入影响。
    nadir_index = steps if reduced else int(np.argmin(deviations))
    tolerance = abs(steady) * 0.02
    outside = np.flatnonzero(np.abs(deviations - steady) > tolerance)
    settled = len(outside) == 0 or int(outside[-1]) < steps
    settling_time = None if not settled else (0.0 if len(outside) == 0 else float(times[int(outside[-1]) + 1]))
    min_deviation = float(deviations[nadir_index])
    return {
        "times": times,
        "deviations": deviations,
        "fMin": RATED_FREQUENCY + min_deviation,
        "tNadir": float(times[nadir_index]),
        "overshoot": max(0.0, abs(min_deviation / steady) - 1.0) * 100.0,
        "settlingTime": settling_time,
        "settled": settled,
        "steadyDeviation": steady,
        "finalFrequency": RATED_FREQUENCY + steady,
        "initialRocofHz": -LOAD_STEP / (2.0 * p["H"]) * RATED_FREQUENCY,
    }


def max_pole_error(py_poles: np.ndarray, js_poles: list[dict]) -> float:
    js = np.array(sorted([complex(p["re"], p["im"]) for p in js_poles], key=lambda x: (x.real, x.imag)))
    if len(js) != len(py_poles):
        return math.inf
    return float(np.max(np.abs(py_poles - js))) if len(js) else 0.0


def none_or_close(a, b, tolerance) -> bool:
    if a is None or b is None:
        return a is None and b is None
    return math.isclose(float(a), float(b), rel_tol=1e-7, abs_tol=tolerance)


def main() -> int:
    source = json.loads((ROOT / "test-cases.json").read_text(encoding="utf-8"))
    node = shutil.which("node") or "node"
    completed = subprocess.run(
        [node, str(ROOT / "js_bridge.js"), str(ROOT / "test-cases.json")],
        check=True, capture_output=True, text=True, encoding="utf-8", shell=os.name == "nt"
    )
    js_results = {item["name"]: item for item in json.loads(completed.stdout)}
    records = []
    all_passed = True

    for test in source["cases"]:
        name = test["name"]
        js = js_results[name]
        p = independent_parameters(test)
        parameter_error = max(abs(p[k] - js["parameters"][k]) for k in p)
        ch = independent_characteristic(p)
        response = independent_response(p, float(test.get("duration", 100.0)))
        pole_error = max_pole_error(ch["poles"], js["characteristic"]["poles"])
        zero_error = 0.0 if ch["zero"] is None and js["characteristic"]["zero"] is None else abs(ch["zero"] - js["characteristic"]["zero"])
        response_errors = []
        for sample in js["samples"]:
            py_y = float(np.interp(sample["t"], response["times"], response["deviations"]))
            response_errors.append(abs(py_y - sample["deviation"]))
        response_error = max(response_errors)
        steady_error = abs(response["steadyDeviation"] - js["response"]["steadyDeviation"])
        rocof_error = abs(response["initialRocofHz"] - js["response"]["initialRocofHz"])
        nadir_error = abs(response["fMin"] - js["response"]["fMin"])
        tn_error = abs(response["tNadir"] - js["response"]["tNadir"])
        overshoot_error = abs(response["overshoot"] - js["response"]["overshoot"])
        ts_ok = none_or_close(response["settlingTime"], js["response"]["settlingTime"], 0.03)
        wn_ok = none_or_close(ch["wn"], js["characteristic"]["wn"], 1e-10)
        zeta_ok = none_or_close(ch["zeta"], js["characteristic"]["zeta"], 1e-10)
        checks = [
            parameter_error < 1e-10, pole_error < 1e-9, zero_error < 1e-10,
            response_error < 2e-7, steady_error < 1e-12, rocof_error < 1e-12,
            nadir_error < 2e-6, tn_error <= 0.03, overshoot_error < 1e-3,
            ts_ok, wn_ok, zeta_ok,
        ]
        passed = all(checks)
        all_passed &= passed
        records.append({
            "name": name, "passed": passed, "parameter_error": parameter_error,
            "pole_error": pole_error, "zero_error": zero_error,
            "response_error": response_error, "nadir_error": nadir_error,
            "nadir_time_error": tn_error, "overshoot_error": overshoot_error,
            "settling_time_matches": ts_ok, "natural_frequency_matches": wn_ok,
            "damping_ratio_matches": zeta_ok, "steady_state_error": steady_error,
            "initial_rocof_error": rocof_error,
        })

    report = {
        "method": "Python numpy.roots + 状态方程 RK4（20000 步）对照浏览器 core.js 解析计算",
        "case_count": len(records), "passed": all_passed,
        "max_pole_error": max(r["pole_error"] for r in records),
        "max_response_error": max(r["response_error"] for r in records),
        "records": records,
    }
    (ROOT / "validation-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    lines = [
        "# SFR Lab 计算正确性测试记录", "",
        "验证方法：Python 独立使用 `numpy.roots` 求根，并以完整状态方程进行 20000 步 RK4 积分；网页端直接运行实际 `core.js` 解析计算。二者不共用响应公式。", "",
        f"- 测试工况：{len(records)} 个", f"- 总体结果：{'全部通过' if all_passed else '存在失败项'}",
        f"- 最大极点误差：{report['max_pole_error']:.3e}", f"- 最大响应采样误差：{report['max_response_error']:.3e}", "",
        "覆盖 T₁=T₂/T₁≠T₂、三种 λ 路径、两种 T₁ 路径、F_H=0/中间值/1、欠阻尼/临界阻尼/过阻尼、物理参数单独变化、D=0、零点移动与极零相消。", "",
        "| 工况 | 结果 | 极点误差 | 响应误差 | 最低频率误差 | 整定时间一致 |", "|---|---:|---:|---:|---:|---:|",
    ]
    for r in records:
        lines.append(f"| {r['name']} | {'通过' if r['passed'] else '失败'} | {r['pole_error']:.2e} | {r['response_error']:.2e} | {r['nadir_error']:.2e} | {'是' if r['settling_time_matches'] else '否'} |")
    lines += ["", "同时核对自然频率、阻尼比、闭环零点、准稳态频差和初始 RoCoF；详细误差见 `validation-report.json`。", ""]
    (ROOT / "TEST-RECORD.md").write_text("\n".join(lines), encoding="utf-8")
    print(json.dumps({"passed": all_passed, "cases": len(records), "max_pole_error": report["max_pole_error"], "max_response_error": report["max_response_error"]}, ensure_ascii=False, indent=2))
    if not all_passed:
        for record in records:
            if not record["passed"]:
                print("FAILED", json.dumps(record, ensure_ascii=False))
    return 0 if all_passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
