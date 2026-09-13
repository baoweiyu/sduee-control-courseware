# 第三章《时域分析法》Lesson Spec

- lesson_id：`lesson03-timedomain`，目录 `lessons/lesson03-timedomain/`
- 素材：`bwy-ori-oldPPT/chapt3-1.pdf`（第一、二节）、`chapt3-2.pdf`（第三、四节）、`chapt3-3.pdf`（第五节 稳定性与代数判据）、`chapt3-4.pdf`（第六节 稳态误差分析及误差系数）
- 分四步交付：3-1（p01–p21）→ 3-2 → 3-3 → 3-4，页码连续，最终合成一个 lesson。
- 通用规范：见 `specs/制作规范与历史问题清单.md`（34 条全适用）。强调色唯一红 #D63A2F；互动题三段式（选项不带 data-step 初始全显示 → 按键高亮绿 #1E9E57+✓ → 解释条）；相加点圆圈+内×；数学曲线一律 SVG 程序绘制；image2 只画工程场景/氛围图。

## 整章结构（四步）

| 步 | 节 | 页码规划 | 重点 |
|---|---|---|---|
| 3-1 | 第一节 时域性能指标 + 第二节 一阶系统 | p01–p21 | 指标图解 L2 逐步标注；一阶 T 滑块 L3 联动 |
| 3-2 | 第三节 二阶系统 + 第四节 高阶系统 | p22–p45 左右 | **ζ/ωn 滑块 → 响应曲线+指标+复平面极点三方联动 L3**；例 3-1/3-2/3-3 |
| 3-3 | 第五节 稳定性与代数判据 | 续编号 | 劳斯表标准推导展示（少动画），表 3-2 根与稳定性关系 |
| 3-4 | 第六节 稳态误差 | 续编号 | 推导+**稳态误差形象表格**（型别×输入信号） |

## 3-1 Page Map（p01–p21，素材 chapt3-1.pdf 共 22 页）

| 页 | 文件 | 内容 | 级别 | legacy_action | 素材来源 | 配图 |
|---|---|---|---|---|---|---|
| p01 | p01-cover | 第三章封面 + 本章四节导览 | L0 | REDESIGN | PDF p1 | image2 `timedomain-cover.png`（新生） |
| p02 | p02-intro | 时域分析法引言：定义/直观准确/适用低阶 | L1 | POLISH | p2 | image2 `car-suspension.png`（新生，过减速带=日常阶跃响应） |
| p03 | p03-signals-why | 典型输入信号：为什么需要（理论分析+性能比较） | L1 | POLISH | p3 | image2 `signal-generator.png`（新生） |
| p04 | p04-signal-step | 阶跃函数：定义、1(t)、L=1/s、SVG 波形 | L1 | REDESIGN | p4 | SVG 波形（程序绘） |
| p05 | p05-signal-ramp | 斜坡函数：t·1(t)、1/s²、SVG 波形 | L1 | REDESIGN | p5 | SVG |
| p06 | p06-signal-parab | 抛物线函数：½t²、1/s³、SVG 波形 | L1 | REDESIGN | p6 | SVG |
| p07 | p07-signal-impulse | 脉冲函数：δε→δ(t)、面积=1、L=1、SVG | L1 | REDESIGN | p7 | SVG |
| p08 | p08-signal-relation | 函数关系链 δ→1(t)→t→½t²（积分→/求导←）+ 正弦函数 | L2 | INTERACTIVE | p8 | L2 分步链条动画 |
| p09 | p09-signal-choice | 选择原则（突变→阶跃/增长→斜坡/周期→正弦）+ 统一单位阶跃 | L1 | POLISH | p9 | 复用 radar-track.png 等 |
| p10 | p10-metrics-def | 阶跃响应指标定义：c(t)=ct+css；td/tr/tp/ts/σ% | L1 | REDESIGN | p10 | 卡片列表 |
| p11 | p11-metrics-figure | **指标图解 L2 重点页**：SVG 阶跃响应曲线 Space 逐步标注 误差带→c(∞)→tr→tp→σ%=A/B→ts | L2 | INTERACTIVE | p11/13 | SVG 程序绘（A=超调高度，B=稳态值，沿用原素材约定） |
| p12 | p12-metrics-noover | 无超调情形：tr=10%–90%、ts 图 | L1 | REDESIGN | p12 | SVG |
| p13 | p13-ess-meaning | 稳态指标 ess=lim[r−c] + 指标意义（td/tr 初始快慢、σ% 振荡、ts 快速性；最常用 σ%/ts/ess） | L1 | REDESIGN | p14 | 卡片 |
| p14 | p14-first-order | 第二节·一阶系统模型：方框图 R→[1/(Ts+1)]→C + Φ(s) | L1 | REDESIGN | p15 | 复用 water-tank-level-control.png + RC 电路 SVG |
| p15 | p15-fo-step | 单位阶跃响应：推导 C(s)=1/s−1/(s+1/T)、h(t)=1−e^(−t/T)、初斜率 1/T、h(T)=0.632、tr=2.2T、ts=3T/4T、ess=0 | L2 | INTERACTIVE | p16/17 | SVG 曲线分步标注 |
| p16 | p16-fo-lab | **一阶 T 联动实验 L3**：T 滑块 → 阶跃响应曲线 + ts=3T/4T 读数联动 | L3 | INTERACTIVE | （新增，基于 p16-17） | ACT.slider + 自绘 SVG |
| p17 | p17-fo-ramp | 单位斜坡响应：c(t)=t−T+Te^(−t/T)、c(∞)=t−T、ess=T | L1 | REDESIGN | p18 | SVG 曲线 |
| p18 | p18-fo-impulse | 单位脉冲响应：g(t)=(1/T)e^(−t/T)、g(0)=1/T、斜率 −1/T² | L1 | REDESIGN | p19 | SVG 曲线 |
| p19 | p19-fo-summary | 三响应关系总结：g=dh/dt=d²c/dt²，三小图对比（K=1,T=0.5），h(T)/h(2T)/h(3T)/h(4T) 特征值；引导"3 图各如何求 T" | L2 | INTERACTIVE | p20/22 | SVG 三小图 |
| p20 | p20-quiz-fo | 课堂互动填空：ts=[3T(5%)/4T(2%)]、ess=[T]（三段式） | L2 | INTERACTIVE | p21 | — |
| p21 | p21-summary | 3-1 小结：指标+一阶系统要点；导数关系适用任何阶线性定常系统，只需一种典型输入 | L1 | REDESIGN | p22 | — |

## 3-1 image2 新图清单

1. `timedomain-cover.png` — 测控实验室氛围（大屏抽象上升曲线，无坐标无刻度）
2. `car-suspension.png` — 汽车过减速带（悬挂弹簧+减震器），日常"阶跃输入→时间响应"
3. `signal-generator.png` — 实验台信号发生器+示波器
复用：`water-tank-level-control.png`（p14）、`radar-track.png`（p09）。

## 3-2 预告（下一步做）

二阶系统：典型结构 G(s)=ωn²/[s(s+2ζωn)]、Φ(s)；四种阻尼（0/临界/欠/过）极点分布与响应；欠阻尼指标推导 tr=(π−β)/ωd、tp=π/ωd、σ%=e^(−πζ/√(1−ζ²))、ts≈4/ζωn(2%)/3/ζωn(5%)、td；例 3-1（Φ=25/(s²+6s+25)）、例 3-2（K=16,T=0.25 随动系统）、例 3-3（速度反馈 τ）；脉冲/斜坡响应；零点二阶；高阶系统（三阶+主导极点思想）。
**核心 L3 页**：ζ、ωn 双滑块 → ACT.SecondOrder 解析解曲线 + ResponsePlot 指标 + 复平面极点图（阻尼角 β、ωn 圆）三方联动。

## 3-2 Page Map（p22–p47，素材 chapt3-2.pdf 共 31 页）

| 页 | 文件 | 内容 | 互动 | 来源 | 配图 |
|---|---|---|---|---|---|
| p22 | p22-so-typical | 第三节开篇：典型二阶系统方框图、开环/闭环传递函数、ζ 与 ωn 定义 | L1 | PDF p1 | SVG 方框图 |
| p23 | p23-so-poles | 特征方程 s²+2ζωn s+ωn²=0；s1,2=−σ±jωd；σ 衰减系数、ωd 阻尼振荡频率、β 阻尼角（复平面标注图） | L1 | p2 | SVG 复平面 |
| p24 | p24-so-polemap | 四种阻尼的闭环极点分布（ζ=0 / 0<ζ<1 / ζ=1 / ζ>1 四宫格复平面） | L2 分步 | p3 | SVG 四宫格 |
| p25 | p25-resp-zero | ζ=0 零阻尼：h(t)=1−cosωnt 等幅振荡 | L1 | p4 | SVG 曲线 |
| p26 | p26-resp-over | ζ>1 过阻尼：两实极点、双指数单调上升；ζ>>1 降阶为一阶 | L1 | p5-6 | SVG 曲线 |
| p27 | p27-resp-crit | ζ=1 临界阻尼：h(t)=1−(1+ωnt)e^(−ωnt)；ts≈5.8/ωn，无超调中最快 | L1 | p7 | SVG 曲线 |
| p28 | p28-resp-under | 0<ζ<1 欠阻尼：包络线 e^(−σt)±、衰减振荡 h(t) 公式推导 | L2 分步 | p8-9 | SVG 包络线图 |
| p29 | p29-so-compare | 四种阻尼响应定性对比（四宫格：极点图+响应曲线+响应式） | L2 分步 | p10 | SVG 四宫格 |
| p30 | p30-quiz-beta | 课堂互动①：在复平面图中指出阻尼角 β（先提问后揭晓角度弧） | L2 互动 | p11 | SVG 复平面 |
| p31 | p31-metrics-tr | 欠阻尼指标推导：上升时间 tr=(π−β)/ωd（令 c(t)=1 推导链） | L2 分步 | p12 | — |
| p32 | p32-metrics-tp | 峰值时间 tp=π/ωd（令 dh/dt=0）；超调量 σ%=e^(−πζ/√(1−ζ²))×100%，只与 ζ 有关 | L2 分步 | p13 | — |
| p33 | p33-metrics-ts | 调节时间 ts≈4/ζωn(2%)/3/ζωn(5%)（包络线进入误差带）；延迟时间 td≈(1+0.6ζ+0.2ζ²)/ωn | L2 分步 | p14 | SVG 包络线误差带图 |
| p34 | p34-so-lab | 【核心 L3】ζ、ωn 双滑块 → 阶跃响应曲线+tr/tp/ts/σ% 读数+复平面极点（ωn 圆、β 角弧）三方联动 | L3 滑块 | 综合 | SVG 双图 |
| p35 | p35-zeta-sigma | ζ–σ% 关系曲线（图3-17 复现）：标注 ζ=0.25→44%、0.5→16%、0.6→9.5%、0.707→4.3% 与例题呼应；工程推荐 ζ=0.4~0.8 | L1 | p13 | SVG 曲线 |
| p36 | p36-ex31 | 例3-1：Φ(s)=25/(s²+6s+25) → ζ=0.6,ωn=5 → tr=0.55/tp=0.785/ts=1.33/σ%=9.5% | L2 分步 | p15-16 | SVG 方框图 |
| p37 | p37-ex32 | 例3-2：随动系统 K=16,T=0.25 → ζ=0.25,ωn=8 → σ%=44%,ts=2s；σ%=16% 要求 → K=4 | L2 分步 | p17-18 | image2 `servo-antenna.png` |
| p38 | p38-velocity-fb | 速度反馈改善阻尼：结构对比、Φ1(s) 推导、ζ1=ζ+τKτ…（ωn 不变，ζ 增大 → σ% 减小） | L2 分步 | p19-20 | SVG 方框图 |
| p39 | p39-ex33 | 例3-3：τ=0.0625 使 ζ1=0.5 → 原系统 vs 速度反馈指标对比表（σ% 44%→16%） | L2 分步 | p21 | act-table |
| p40 | p40-so-impulse | 二阶单位脉冲响应：阶跃求导；ζ≥1 不变号；0<ζ<1 首交点=tp，面积=1+σ% | L1 | p22 | SVG 曲线 |
| p41 | p41-so-ramp | 二阶单位斜坡响应：暂态+稳态；ess=2ζ/ωn | L1 | p22 | SVG 曲线 |
| p42 | p42-so-zero | 具有零点的二阶系统：Φ(s)=ωn²(1+τs)/(…)，附加零点使超调增大 | L1 | p23 | SVG 对比曲线 |
| p43 | p43-ho-third | 第四节开篇：典型三阶系统（二阶+附加实极点 s3），β=|s3|/(ζωn)；附加极点使 σ%↓ ts↑；β→∞ 退化二阶 | L1 | p24-26 | SVG 极点+曲线 |
| p44 | p44-ho-general | 高阶系统单位阶跃响应一般式（留数展开=一阶+二阶分量之和）；两条结论 | L2 分步 | p27-29 | — |
| p45 | p45-ho-dominant | 闭环主导极点：两条件（距虚轴最近且无零点邻近；实部<其他 1/5）；偶极子 | L1 | p30 | SVG 复平面 |
| p46 | p46-quiz-ho | 课堂互动②：给高阶系统阶跃响应曲线，判断离虚轴最近的极点类型（选择三段式） | L2 互动 | p31 | SVG 曲线 |
| p47 | p47-so-summary | 第三、四节小结（指标公式表 + 阻尼→极点→响应链 + 主导极点思想） | L1 | 综合 | act-table |

3-2 image2 新图：`servo-antenna.png`（卫星地面站天线伺服转台，例3-2/3-3 随动系统情境）。
复用：`car-suspension.png`（p28 欠阻尼直观类比，可选）。
