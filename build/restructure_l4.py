# -*- coding: utf-8 -*-
"""第四章结构性变更：重命名/删除页面文件 + data-page 页码更新 + 生成新 lesson.json
新结构 87 页（见 第四章修改方案-v2-施工稿.md 最终页码地图）"""
import json, re, shutil
from pathlib import Path

BASE = Path(r"H:\D_tools\courseware-system-kimi\lessons\lesson04-freq")
PAGES = BASE / "pages"

# old_name(不含.html) -> new_name(不含.html)；None = 删除
RENAME = {
    "p01-cover": "p01-cover",
    "p02-part1-cover": "p03-part1-cover",
    "p03-history": "p04-history",
    "p04-idea-map": "p05-fourier-idea",
    "p05-features": "p06-features",
    "p06-quiz-tf": "p07-quiz-tf",
    "p07-freqresp-def": "p08-freqresp-def",
    "p08-first-order-deriv": "p09-first-order-deriv",
    "p09-conclusion": "p10-conclusion",
    "p10-ex41-42": None,                      # 拆分为新 p11-ex41 / p12-ex42
    "p11-freqchar-def": "p13-freqchar-def",
    "p12-representations": "p14-representations",
    "p13-elem-pid": "p16-elem-pid",
    "p14-elem-inertial-proof": "p18-elem-inertial-proof",
    "p15-elem-inertial-anim": "p17-elem-inertial-anim",
    "p16-elem-firstdiff": "p19-elem-firstdiff",
    "p17-elem-osc": "p20-elem-osc",
    "p18-elem-osc-resonance": "p21-elem-osc-resonance",
    "p19-resonance-apps": "p22-resonance-apps",
    "p20-osc-lab": "p23-osc-lab",
    "p21-elem-delay": "p24-elem-delay",
    "p22-elem-table": "p25-elem-table",
    "p23-general-method": "p28-general-method",
    "p24-start-end": "p27-start-end",
    "p25-ex44": "p26-ex44",
    "p26-part1-summary": "p29-part1-summary",
    "p27-part2-cover": "p30-part2-cover",
    "p28-bode-intro": "p31-bode-intro",
    "p29-bode-why": "p32-bode-why",
    "p30-elem-k": "p33-elem-k",
    "p31-elem-intdiff": "p34-elem-intdiff",
    "p32-elem-inertial-bode": "p35-elem-inertial-bode",
    "p33-inertial-correct": "p36-inertial-correct",
    "p34-firstdiff-bode": "p37-firstdiff-bode",
    "p35-osc-bode": "p38-osc-bode",
    "p36-osc-bode-lab": "p39-osc-bode-lab",
    "p37-sec-diff-delay": "p40-sec-diff-delay",
    "p38-bode-table": "p41-bode-table",
    "p39-openloop-methods": "p42-openloop-methods",
    "p40-ex45-decompose": None,               # 并入 p43-ex45-superpose
    "p41-ex45-superpose": "p43-ex45-superpose",
    "p42-seq-slope": "p44-seq-slope",
    "p43-ex46": "p45-ex46",
    "p44-calc-method": "p46-calc-method",
    "p45-min-phase": "p47-min-phase",
    "p46-bode-ess": "p48-bode-ess",
    "p47-quiz-ka": "p49-quiz-ka",
    "p48-experiment": "p50-experiment",
    "p49-ex49": "p51-ex49",
    "p50-part2-summary": "p52-part2-summary",
    "p51-part3-cover": "p53-part3-cover",
    "p52-alg-to-freq": "p54-alg-to-freq",
    "p53-map-point": "p55-map-vector",
    "p54-map-contour": None,                  # 映射六图重做
    "p55-map-zp": None,
    "p56-map-conclusion": "p61-map-conclusion",
    "p57-f-to-gh": "p62-f-to-gh",
    "p58-nyquist-contour": "p63-nyquist-contour",
    "p59-nyquist-criterion": "p64-nyquist-criterion",
    "p60-ex410": "p65-ex410",
    "p61-ex410-concl": "p66-ex410-concl",
    "p62-ex412": "p67-ex412",
    "p63-quiz-nyquist": "p68-quiz-nyquist",
    "p64-conditional-stab": "p69-conditional-stab",
    "p65-margin-intro": "p70-margin-intro",
    "p66-margin-nyquist": "p71-margin-nyquist",
    "p67-margin-bode": "p72-margin-bode",
    "p68-notes-summary": "p73-notes-summary",
    "p69-part4-cover": "p74-part4-cover",
    "p70-cl-problem": "p75-cl-problem",
    "p71-mcircle-deriv": "p76-mcircle-deriv",
    "p72-mcircle-plot": "p77-mcircle-plot",
    "p73-ncircle": "p78-ncircle",
    "p74-nichols": "p79-nichols",
    "p75-gamma-zeta": "p80-gamma-zeta",
    "p76-wc-ts": "p81-wc-ts",
    "p77-cl-metrics": "p82-cl-metrics",
    "p78-cl-zeta-lab": "p83-cl-zeta-lab",
    "p79-highorder-empirical": "p84-highorder-empirical",
    "p80-three-band": "p85-three-band",
    "p81-quiz-metrics": "p86-quiz-metrics",
    "p82-ch4-summary": "p87-ch4-summary",
    "p83-rootlocus-preview": None,            # 删除根轨迹预告
}

# 新页码顺序（87 页）：new_name -> (页码, 标题, 复杂度)
ORDER = [
    ("p01-cover", 1, "第四章封面", "L0"),
    ("p02-schedule", 2, "本章课时安排", "L0"),
    ("p03-part1-cover", 3, "第一部分封面 · 频率特性和极坐标图", "L0"),
    ("p04-history", 4, "1.1 历史背景：为什么需要频率响应法", "L1"),
    ("p05-fourier-idea", 5, "1.1 基本思想：傅里叶分解", "L1"),
    ("p06-features", 6, "1.2 频率响应法的特点", "L1"),
    ("p07-quiz-tf", 7, "课堂互动 · 时域与频域", "L2"),
    ("p08-freqresp-def", 8, "1.3 频率响应的定义", "L1"),
    ("p09-first-order-deriv", 9, "1.3 一阶系统频率响应的推导", "L1"),
    ("p10-conclusion", 10, "1.3 推导结论与推广", "L1"),
    ("p11-ex41", 11, "1.3 例 4-1：频率特性法求稳态输出", "L1"),
    ("p12-ex42", 12, "1.3 例 4-2：由频率响应确定系统参数", "L1"),
    ("p13-freqchar-def", 13, "1.4 频率特性的定义", "L1"),
    ("p14-representations", 14, "1.4 频率特性的表示方法（解析式）", "L1"),
    ("p15-graph-rep", 15, "1.4 频率特性的图形表示方法", "L1"),
    ("p16-elem-pid", 16, "1.5 典型环节的极坐标图① 比例·积分·微分", "L1"),
    ("p17-elem-inertial-anim", 17, "1.5 惯性环节：数值表逐点绘图", "L2"),
    ("p18-elem-inertial-proof", 18, "1.5 惯性环节的极坐标图是半圆（例 4-3）", "L1"),
    ("p19-elem-firstdiff", 19, "1.5 一阶微分环节的极坐标图", "L1"),
    ("p20-elem-osc", 20, "1.5 振荡环节的极坐标图", "L1"),
    ("p21-elem-osc-resonance", 21, "1.5 振荡环节的谐振", "L1"),
    ("p22-resonance-apps", 22, "1.5 谐振的危害与利用", "L1"),
    ("p23-osc-lab", 23, "互动实验：ζ 与振荡环节 Nyquist 曲线", "L2"),
    ("p24-elem-delay", 24, "1.5 二阶微分环节与延迟环节", "L1"),
    ("p25-elem-table", 25, "1.5 典型环节极坐标图一览", "L1"),
    ("p26-ex44", 26, "1.5 例 4-4：绘制系统极坐标图", "L1"),
    ("p27-start-end", 27, "1.5 起点与终点的确定", "L1"),
    ("p28-general-method", 28, "1.5 一般系统极坐标图的绘制方法", "L1"),
    ("p29-part1-summary", 29, "第一部分小结", "L1"),
    ("p30-part2-cover", 30, "第二部分封面 · 对数坐标图", "L0"),
    ("p31-bode-intro", 31, "2.1 Bode 图的构成", "L1"),
    ("p32-bode-why", 32, "2.1 为什么用对数坐标——Bode 图的优点", "L1"),
    ("p33-elem-k", 33, "2.2 比例环节的 Bode 图", "L1"),
    ("p34-elem-intdiff", 34, "2.2 积分与微分环节的 Bode 图", "L1"),
    ("p35-elem-inertial-bode", 35, "2.2 惯性环节的 Bode 图：渐近线", "L1"),
    ("p36-inertial-correct", 36, "2.2 惯性环节：误差修正与相频对称性", "L1"),
    ("p37-firstdiff-bode", 37, "2.2 一阶微分环节的 Bode 图", "L1"),
    ("p38-osc-bode", 38, "2.2 二阶振荡环节的 Bode 图：渐近线", "L1"),
    ("p39-osc-bode-lab", 39, "互动实验：ζ 与振荡环节 Bode 图", "L2"),
    ("p40-sec-diff-delay", 40, "2.2 二阶微分环节与延迟环节的 Bode 图", "L1"),
    ("p41-bode-table", 41, "2.2 典型环节 Bode 图一览", "L1"),
    ("p42-openloop-methods", 42, "2.3 开环系统 Bode 图的绘制方法", "L1"),
    ("p43-ex45-superpose", 43, "2.3 例 4-5：五环节渐近线逐条叠加", "L1"),
    ("p44-seq-slope", 44, "2.3 顺序斜率叠加法：折线逐段生长", "L1"),
    ("p45-ex46", 45, "2.3 例 4-6：先化标准式，再顺序叠加", "L1"),
    ("p46-calc-method", 46, "2.3 方法三：计算法（描点连线）", "L1"),
    ("p47-min-phase", 47, "2.4 最小相位系统与非最小相位系统", "L1"),
    ("p48-bode-ess", 48, "2.5 开环对数频率特性与闭环稳态误差", "L1"),
    ("p49-quiz-ka", 49, "课堂互动 · 由低频段读 Ka", "L2"),
    ("p50-experiment", 50, "2.5 用实验法确定系统的传递函数", "L1"),
    ("p51-ex49", 51, "2.5 例 4-9：由实验曲线求传递函数", "L1"),
    ("p52-part2-summary", 52, "第二部分小结", "L1"),
    ("p53-part3-cover", 53, "第三部分封面 · 系统稳定性分析", "L0"),
    ("p54-alg-to-freq", 54, "3.1 从代数判据到图解判据", "L1"),
    ("p55-map-vector", 55, "3.2 映射原理① 单向量的映射", "L2"),
    ("p56-map-diff", 56, "3.2 映射原理② 两向量之差 s−z", "L2"),
    ("p57-map-product", 57, "3.2 映射原理③ 向量的乘积", "L2"),
    ("p58-map-encircle", 58, "3.2 映射原理④ 包围零点的围线", "L2"),
    ("p59-map-outside", 59, "3.2 映射原理⑤ 围线外的零点", "L2"),
    ("p60-map-general", 60, "3.2 映射原理⑥ 一般式：零极点混合", "L2"),
    ("p61-map-conclusion", 61, "3.2 映射原理（幅角原理）总结", "L2"),
    ("p62-f-to-gh", 62, "3.3 从 F(s) 平面到 G(s)H(s) 平面", "L1"),
    ("p63-nyquist-contour", 63, "3.3 Nyquist 轨线与虚轴上的开环极点", "L1"),
    ("p64-nyquist-criterion", 64, "3.3 Nyquist 稳定判据", "L1"),
    ("p65-ex410", 65, "3.3 例 4-10（上）：Nyquist 轨线四段映射", "L2"),
    ("p66-ex410-concl", 66, "3.3 例 4-10（下）：补全曲线并判断稳定性", "L2"),
    ("p67-ex412", 67, "3.3 例 4-12：3 型系统的 Nyquist 判稳", "L1"),
    ("p68-quiz-nyquist", 68, "课堂互动 · 补全 Nyquist 曲线", "L2"),
    ("p69-conditional-stab", 69, "互动实验：条件稳定系统", "L2"),
    ("p70-margin-intro", 70, "3.4 相对稳定性：离临界还有多远", "L1"),
    ("p71-margin-nyquist", 71, "3.4 Nyquist 图上的稳定裕度", "L1"),
    ("p72-margin-bode", 72, "3.4 Bode 图上的稳定裕度", "L1"),
    ("p73-notes-summary", 73, "3.4 Bode 定理与第三部分小结", "L1"),
    ("p74-part4-cover", 74, "第四部分封面 · 闭环频率特性与频域指标", "L0"),
    ("p75-cl-problem", 75, "4.1 单位反馈闭环系统的频率响应：相量法", "L1"),
    ("p76-mcircle-deriv", 76, "4.1 等 M 圆（等幅值轨迹）的推导", "L1"),
    ("p77-mcircle-plot", 77, "互动实验：等 M 圆与谐振峰值", "L2"),
    ("p78-ncircle", 78, "4.1 等 N 圆（等相角轨迹）", "L1"),
    ("p79-nichols", 79, "4.1 Nichols 图（对数幅相图）", "L1"),
    ("p80-gamma-zeta", 80, "4.2 二阶系统：相角裕度 γ 与阻尼比 ζ", "L1"),
    ("p81-wc-ts", 81, "4.2 二阶系统：γ、ωc 与调节时间 ts", "L1"),
    ("p82-cl-metrics", 82, "4.2 闭环频率特性与闭环频域指标", "L1"),
    ("p83-cl-zeta-lab", 83, "互动实验：ζ 与闭环频域/时域指标联动", "L2"),
    ("p84-highorder-empirical", 84, "4.2 高阶系统：频域与时域指标的经验公式", "L1"),
    ("p85-three-band", 85, "4.3 三频段理论：开环 Bode 图的分段解读", "L1"),
    ("p86-quiz-metrics", 86, "课堂互动 · 频域指标的选择", "L2"),
    ("p87-ch4-summary", 87, "第四章小结：频率响应法", "L1"),
]

def main():
    # 1) 先全部改成临时名，再改成目标名（避免冲突）
    deleted, renamed = [], []
    for old, new in RENAME.items():
        src = PAGES / (old + ".html")
        if not src.exists():
            print("!! missing", src.name)
            continue
        if new is None:
            src.unlink()
            deleted.append(old)
        else:
            tmp = PAGES / ("__tmp__" + old + ".html")
            src.rename(tmp)
            renamed.append((old, new))
    for old, new in renamed:
        (PAGES / ("__tmp__" + old + ".html")).rename(PAGES / (new + ".html"))
    print(f"renamed {len(renamed)}, deleted {len(deleted)}: {deleted}")

    # 2) 更新每个文件的 data-page="N / 87" 与硬编码 act-footno
    total = len(ORDER)
    num_of = {name: num for name, num, *_ in ORDER}
    for name, num, *_ in ORDER:
        f = PAGES / (name + ".html")
        if not f.exists():
            continue  # 新页面稍后创建
        t = f.read_text(encoding="utf-8")
        t2 = re.sub(r'data-page="[^"]*"', f'data-page="{num} / {total}"', t)
        t2 = re.sub(r'(<div class="act-footno">)\d+(</div>)', rf"\g<1>{num}\g<2>", t2)
        if t2 != t:
            f.write_text(t2, encoding="utf-8")
    print("data-page updated")

    # 3) 生成新 lesson.json
    lesson = {
        "lesson_id": "lesson04-freq",
        "title": "第四章 频率响应法",
        "source": "bwy-ori-oldPPT/chapt4-1 ~ chapt4-5 五个PDF；手写教案；卢京潮老师课件（局部参考）",
        "pages": [
            {
                "id": f"l4-p{num:02d}",
                "file": f"pages/{name}.html",
                "title": title,
                "complexity": cx,
                "status": "Draft",
                "legacy_action": "REDESIGN",
            }
            for name, num, title, cx in ORDER
        ],
    }
    (BASE / "lesson.json").write_text(
        json.dumps(lesson, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"lesson.json written: {total} pages")

if __name__ == "__main__":
    main()
