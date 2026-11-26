(() => {
  "use strict";

  const W = IntroWidgets;
  const { range: R, choices: C, readouts, escape, ink } = W;
  const groups = window.CourseUnits[4].groups;
  const intent = `
1|用可测的正弦稳态响应串起判稳与性能设计。|建立本章从频率特性到闭环指标的阅读路径
2|四次课沿定义、绘图、判稳、性能依次推进。|对照每次课的主题与复习位置
3|先学会把单频响应变成复平面上的一个点，再把这些点连成轨迹。|预览第一部分的定义、图示与绘图任务
4|时域方程难建或难解时，扫频试验给出另一条分析路径。|把工程难题、通信实践与方法形成对应起来
5|对改变量逐个试验的理由来自傅里叶分解和线性叠加。|切换奇次谐波，观察近似方波怎样形成
6|频域法能由试验取得模型，也能用图形处理稳定性和性能问题。|把四项优点和适用边界放在一起比较
7|同一个近方波在时域是一条曲线，在频域有若干频率分量。|联动波形与频谱，完成时域和频域的原题
8|观察暂态退去之后，正弦输入与输出只差幅值和相位。|调节频率和观察时刻，分清同频、缩放和相移
9|一阶响应的指数暂态与受迫正弦稳态来自不同极点。|将一阶解析式与同频波形配对
10|用输入、输出的稳态幅值比和相位差，可以重建这一频率处的复数。|归纳解析求解、复频代换和正弦实测的联系
11|频率特性法直接给出例 4-1 的稳态幅值和相位。|对照时域法的部分分式与固定频率的复数求值
12|一次正弦试验给出两个实数约束，足以辨识这个标准二阶系统的两个参数。|从实测增益 2 和相移 −45° 反推固有频率与阻尼比
13|输出相量除以输入相量，模相除，相角相减。|把复数比的物理含义与频率响应定义对应
14|同一个复数可以从模角坐标或实虚坐标读出。|改变相量，检查极形式、指数形式、三角形式和实虚形式
15|Nyquist 图连成复数轨迹，Bode 图展开同一数据的幅与相。|用同一惯性环节联动两种图的频率
16|比例、积分和微分的极坐标图，先看相角，再看频率增大时的方向。|在三个典型环节间切换并读出相量
17|按课件频率表逐点描图，测点越多越接近完整下半圆。|用 0.5、1 和 5 s 三档时间常数复现逐点描图
18|惯性环节的半圆由消去 ωT 得到，时间常数改变扫过半圆的速率。|比较几个时间常数下相同频率对应的动点
19|一阶微分轨迹的实部恒为 1，从 (1, 0) 向正虚轴平行方向延伸。|扫频验证竖直射线和固定实部
20|振荡环节靠起点、负虚轴交点、收尾方向确定骨架。|在固定阻尼的曲线上辨认三个关键点
21|只有阻尼比在 0 与 1/√2 之间，才有非零频率谐振峰。|切换阻尼区间，观察最大幅值出现在何处
22|同一种窄频放大既可能加剧结构振动，也可用于选频。|把结构共振、收音机调台与扫频现象对应起来
23|阻尼变小，复平面轨迹的鼓包和幅频峰值同时上升。|拖动阻尼比，跟踪交点、峰值与轨迹外形变化
24|二阶微分轨迹向无穷延伸，纯延迟的幅值恒为 1。|比较二阶分子和纯延迟两种不同的极坐标运动
25|比较典型轨迹时，逐个检查起点、终点、方向和象限。|在八种典型环节中扫频验证识图线索
26|沿虚轴移动 jω，就能读出两根极点矢量的模与角。|把两个极点到观测点的几何量转为幅值和相角
27|一般极坐标图先定起点、终点和关键交点，再补出走势。|把相量计算转化成可重复的绘图顺序
28|低频由积分个数主导，高频由分母与分子的阶次差主导。|从尾 1 标准式快速确定首尾相角
29|例 4-4 先由型别和阶差确定方向，再求负实轴交点。|在例题的完整极坐标图中核对三步法
30|从正弦输入、稳态频率特性到极坐标图可以连成一条操作链。|复习定义、典型环节和一般绘图法
31|同一频率特性拆成幅频、相频后，环节之间的乘除可以逐段看清。|预览 Bode 图的标准环节、开环绘图和识别
32|Bode 图的两个纵轴不同，共用对数分度的频率轴。|切换频程位置，观察十倍频率间隔等距
33|对数横轴压缩频率范围，分贝纵轴把模的乘除变为加减。|说明渐近线为什么能逐段求和，以及增益怎样平移曲线
34|比例增益只决定幅频水平线的高度，正增益相角恒为 0°。|调整比例增益，验证幅频线纵向平移与固定相角
35|积分和微分的斜率各为 −20 与 +20 dB/dec，符号相反。|比较频率从 1 到 10 rad/s 时的幅值与相角
36|惯性环节从平坦段转入 −20 dB/dec，在转角处需要修正。|对照例题中精确曲线和两条渐近线
37|改变 T 等于移动转角频率 1/T，惯性 Bode 图沿对数频轴平移。|拖动时间常数，直接观察两条曲线的共同平移
38|在 ω=1/T 处，惯性环节的幅值误差约 −3 dB，相角为 −45°。|用成对的频率点检查误差局部性和相频对称
39|取倒数把幅频与相频关于零轴翻转，一阶分子向上折。|对照一阶微分与惯性环节的相反斜率
40|二阶振荡环节越过 ωn 后，渐近斜率直接变为 −40 dB/dec。|用课件算例读出转角并区分精确峰值
41|渐近骨架不因阻尼变化，阻尼决定转角附近的隆起与相角变化。|固定固有频率，拖动 ζ 比较 Bode 曲线
42|二阶微分的幅相与振荡环节反号，纯延迟只有相位滞后。|切换两个环节，比较幅值和展开相位
43|组合曲线的斜率变化来自各典型因子的贡献。|按统一坐标比较典型环节的转角、斜率和相角
44|先化标准式，再选择逐环节相加、顺序叠斜率或精确描点。|把三种方法放进同一绘图工作流
45|例 4-5 的五个因子按分贝叠加，折线斜率只在相应转角改变。|逐步添加五个因子，核对总幅频曲线
46|把转角按频率从小到大排好，每走到一处就更新总斜率。|追踪含 0.5、2 和 30 rad/s 转角的折线如何逐段生长
47|例 4-6 先从常数项提出总增益，再识别不同因子的转角。|对照标准形与例题的折线生长过程
48|当转角附近的渐近误差会影响读图，代入精确公式重新描点。|用例 4-6 的计算点检查局部偏差
49|开环低频段的斜率识别型别，截距或交点反映稳态误差系数。|切换型别和增益，联系低频幅值与误差常数
50|II 型低频延长线到 0 dB 的频率取加速度误差系数的平方根。|由图或方程解出原题的 0 dB 交点
51|试验用同频参考信号提取幅值与相位，折点再翻译成模型因子。|串联正弦相关测量、实验 Bode 图与参数识别
52|同一幅频骨架可以对应多种相位，例 4-9 用实测相位识别纯延迟。|扫频对照最小相位模型和实测模型
53|最小相位条件约束可由幅频图反推的系统；破坏条件后要查相位。|比较极零点条件、幅频唯一性与实验流程
54|左、右半平面零点可有相同的幅值，却产生方向相反的相位。|扫频比较 1+Ts 与 1−Ts 的分贝和相角
55|高频相角净变化能辅助判断最小相位，但需识别纯延迟并结合全图。|用三个同幅算例核算净相角和可能的右半平面因子
56|看 Bode 图要能拆因子、画渐近线、读低频和验相位。|把绘图、性能读数和实验建模连为复习链
57|标准二阶环节在归一化频率 u=1 处的相角导数等于 −1/ζ。|让切线随阻尼变化，对照数学求导
58|欠阻尼极点越靠近虚轴，扫过邻近频率时矢量方向变得越快。|从两个极点的相角合成理解相频陡变
59|下一步把代数特征方程转换为围线映射和包围计数。|预览映射原理、Nyquist 判据和稳定裕度
60|先在 s 平面选围线，再看它通过复函数映射后的包围关系。|把代数判据的根计数和图解判据对应
61|s 沿圆走一圈，平方映射的像走两圈。|拖动围线位置，观察复数平方把相角加倍
62|s−z 是从固定点 z 指向动点 s 的矢量。|拖动 s，观察矢量平移和像曲线
63|两个复因子相乘时，两个矢量的幅值相乘、相角相加。|同步观察 s 平面双矢量和乘积映射
64|围线内的每个零点贡献一圈同向的相角转动。|查两零点在围线内时像的净圈数
65|围线外的零点在一整圈后的净相角变化为零。|验证外部因子可改变曲线形状而不改变净圈数
66|零点和极点贡献的圈数方向相反。|在一零点、两极点的例子上检查像的净方向
67|顺时针走 s 平面的围线时，像逆时针净圈数是 P−Z。|用典型零极点组合检查幅角原理的符号
68|F=1+GH 的零点对应闭环极点，F 的极点对应开环极点。|把反馈方程、F 和 Z/P/N 的定义连起来
69|从 F 减去 1，相当于把整条像左移 1，计数中心移到 −1。|用平移对照 F 平面和开环平面的计数
70|虚轴上有极点时，围线要用小半圆绕开它。|区分右半平面大圆弧和绕极点的小圆弧
71|完整闭合轨迹的逆时针净圈数 N 与 P 合起来给出 Z=P−N。|分辨不包围、包围与经过临界点三种情况
72|例 4-10 的四段围线各有一段对应的像。|逐段定位原像和像，两端都追踪到
73|拼完例 4-10 的正、负频支路及两段圆弧，再数对 −1 的净包围。|从闭合图检验例题的稳定性
74|正频、实轴镜像、大圆弧像、小圆弧像依次拼成闭环。|明确 ν 型系统低频补弧的方向和角度
75|III 型例题的低频补弧转 540°，K=2 时闭环稳定。|观察三阶系统的实轴交点和四段对应
76|系数实数时，负频支路是正频支路的共轭镜像。|恢复全频轨迹并完成原课件判图题
77|轨迹穿过临界点时，闭环从稳态区域切换到不稳定区域或反过来。|拖 K 越过 4/3，核对交点、绕行和稳定性
78|相角裕度沿单位圆读，幅值裕度沿负实轴读。|用两种穿越频率定位离临界点的余量
79|同一开环轨迹在单位圆和负实轴的交点分别给出两种裕度。|在例题的 Nyquist 图上读出 ωc、ωg、γ 和 Kg
80|把例题移到 Bode 图，分别从 0 dB 和 −180° 的穿越频率读取裕度。|用相同传递函数验证两种图读数一致
81|判稳先查开环右极点和闭合轨迹，之后才读局部裕度。|复习补图、包围方向、条件稳定和工程裕度
82|有了开环曲线，也能直接得到闭环幅相和性能指标。|预览闭环相量、等值线与频域时域关系
83|单位反馈下，闭环响应等于开环相量除以它平移后的相量。|在开环复平面读取到 0 和 −1 的距离与方向
84|固定闭环幅值会得到等 M 圆，M=1 时退化为直线。|从固定距离比的代数式辨认圆心、半径和退化情形
85|等 M 圆与开环轨迹相切时可读到闭环谐振峰。|拖动 M，观察开环轨迹与等值线交、切、离的变化
86|固定闭环相角对应过原点和 −1 的等相角轨迹。|改变相角，检查等 N 圆上有效的圆弧
87|在 Nichols 图上，同样的闭环等值线以开环相角和分贝为坐标。|沿开环幅相曲线直接读取闭环幅值和相角
88|对标准二阶对象，相角裕度随阻尼比增大而增大。|把 ζ 的移动映射到 γ 与阶跃超调
89|标准二阶系统的调节时间还需要截止频率这一时间尺度。|分别拖阻尼和固有频率，对照 γ、ωc 和调节时间
90|闭环幅频曲线上能读出静态值、谐振峰、谐振频率和带宽。|用可调曲线区分不同频域指标与读法
91|二阶模型中阻尼移动时，频域峰值和时域超调会一起变化。|同时观察闭环幅频和阶跃响应，核对适用范围
92|高阶模型没有统一解析换算，常用经验式估算后再校核。|对应经验公式、输入指标、结果和适用条件
93|低频侧重稳态误差，中频侧重速度与裕度，高频侧重噪声抑制。|依次切换三个频段，对应 Bode 曲线上的区域
94|在标准二阶关系中，γ 对应平稳性，ωc 提供速度的频率尺度。|从 Bode 图定位两个指标并完成原课件题
95|描述、绘制、判稳、评性能是本章四个顺次使用的步骤。|汇总极坐标、Bode、Nyquist、闭环指标并衔接根轨迹
`;

  const source = {
    8: ["C(s)=\\varPhi(s)\\cdot\\dfrac{R\\omega}{s^{2}+\\omega^{2}}={\\color{#D63A2F}{\\sum_{i=1}^{n}\\dfrac{a_i}{s-p_i}}}+{\\color{#2B5CE6}{\\dfrac{a}{s-j\\omega}+\\dfrac{\\bar{a}}{s+j\\omega}}}", "c(t)={\\color{#D63A2F}{\\sum_{i=1}^{n}a_i e^{p_i t}}}+{\\color{#2B5CE6}{a e^{j\\omega t}+\\bar{a} e^{-j\\omega t}}}"],
    9: ["G(s)=\\dfrac{1}{Ts+1}", "C(s)=\\dfrac{1}{Ts+1}\\cdot\\dfrac{A\\omega}{s^{2}+\\omega^{2}}=\\dfrac{C_0}{Ts+1}+\\dfrac{C_1 s+C_2}{s^{2}+\\omega^{2}}", "C_0=\\dfrac{A\\,\\omega T^{2}}{1+T^{2}\\omega^{2}},\\qquad C_1=\\dfrac{-A\\,\\omega T}{1+T^{2}\\omega^{2}},\\qquad C_2=\\dfrac{A\\,\\omega}{1+T^{2}\\omega^{2}}", "c(t)=\\dfrac{A\\,\\omega T}{1+T^{2}\\omega^{2}}\\,e^{-t/T}+\\dfrac{A}{\\sqrt{1+T^{2}\\omega^{2}}}\\sin\\!\\big(\\omega t-\\arctan\\omega T\\big)", "\\dfrac{A\\omega T}{1+T^{2}\\omega^{2}}e^{-t/T}", "c_{\\mathrm{ss}}(t)=\\dfrac{A}{\\sqrt{1+T^{2}\\omega^{2}}}\\sin(\\omega t-\\arctan\\omega T)", "\\dfrac{1}{\\sqrt{1+T^{2}\\omega^{2}}}=\\Big|\\dfrac{1}{1+j\\omega T}\\Big|=|G(j\\omega)|", "-\\arctan\\omega T=\\angle G(j\\omega)"],
    10: ["c(t)\\xrightarrow[t\\to\\infty]{}\\;R\\,A(\\omega)\\sin\\big(\\omega t+\\varphi(\\omega)\\big)", "A(\\omega)=|\\varPhi(j\\omega)|", "\\varphi(\\omega)=\\angle\\varPhi(j\\omega)", "\\varPhi(j\\omega)=\\left.\\varPhi(s)\\right|_{s=j\\omega}", "\\varPhi(j\\omega)=\\dfrac{C(j\\omega)}{R(j\\omega)}", "A(\\omega)=\\dfrac{c_{\\max}}{R},\\quad \\varphi(\\omega)=\\angle\\dfrac{c}{r}"],
    11: ["G(s)H(s)=\\dfrac{1}{s+1}", "r(t)=3\\sin(2t+90^{\\circ})", "\\varPhi(s)=\\dfrac{1}{s+2}", "C(s)=\\dfrac{3s}{(s+2)(s^{2}+4)}", "c(t)=-0.75e^{-2t}+0.75\\cos 2t+0.75\\sin 2t", "\\varPhi(j\\omega)=\\dfrac{1}{j\\omega+2}=\\dfrac{1}{\\sqrt{4+\\omega^{2}}}\\angle-\\arctan\\dfrac{\\omega}{2}", "\\omega=2:\\quad \\varPhi(j2)=\\tfrac{1}{\\sqrt{8}}\\angle-45^{\\circ}\\approx0.35\\angle-45^{\\circ}", "c(t)=3\\times0.35\\,\\sin(2t+90^{\\circ}-45^{\\circ})", "c_{\\rm ss}(t)=\\frac{3}{\\sqrt 8}\\sin(2t+45^\\circ)"],
    12: ["c(t)=4\\sin(t-45^{\\circ})", "c(t)=2\\,|\\varPhi(j1)|\\sin\\!\\big(t+\\angle\\varPhi(j1)\\big)", "|\\varPhi(j1)|=2,\\qquad \\angle\\varPhi(j1)=-45^{\\circ}", "\\varPhi(s)=\\dfrac{\\omega_n^{2}}{s^{2}+2\\zeta\\omega_n s+\\omega_n^{2}}", "{\\omega_n^{2}-1}=2\\zeta\\omega_n,\\quad \\dfrac{\\omega_n^{2}}{\\sqrt{(\\omega_n^{2}-1)^{2}+(2\\zeta\\omega_n)^{2}}}=2"],
    13: ["\\varPhi(j\\omega)=\\dfrac{C(j\\omega)}{R(j\\omega)}", "|\\varPhi(j\\omega)|=\\dfrac{|C(j\\omega)|}{|R(j\\omega)|}", "\\angle\\varPhi(j\\omega)=\\angle C(j\\omega)-\\angle R(j\\omega)"],
    14: ["G(j\\omega)=|G(j\\omega)|\\angle G(j\\omega)=A(\\omega)\\angle\\varphi(\\omega)", "G(j\\omega)=A(\\omega)\\,e^{j\\varphi(\\omega)}", "G(j\\omega)=A(\\omega)\\cos\\varphi(\\omega)+j\\,A(\\omega)\\sin\\varphi(\\omega)", "G(j\\omega)=X(\\omega)+j\\,Y(\\omega)", "A=\\sqrt{X^2+Y^2},\\qquad\\varphi=\\operatorname{atan2}(Y,X)"],
    16: ["G(s)=K\\;\\Rightarrow\\;G(j\\omega)=K\\angle 0^{\\circ}", "G(s)=\\dfrac{1}{s}\\;\\Rightarrow\\;G(j\\omega)=\\dfrac{1}{\\omega}\\angle{-90^{\\circ}}", "G(s)=s\\;\\Rightarrow\\;G(j\\omega)=\\omega\\angle{+90^{\\circ}}"],
    17: ["G(s)=\\dfrac{1}{Ts+1}", "A(\\omega)=\\dfrac{1}{\\sqrt{(T\\omega)^{2}+1}},\\quad \\varphi(\\omega)=-\\arctan(T\\omega)"],
    18: ["G(s)H(s)=\\dfrac{1}{1+Ts}", "G(j\\omega)=\\dfrac{1}{1+j\\omega T}=\\dfrac{1-j\\omega T}{1+\\omega^{2}T^{2}}=X(\\omega)+jY(\\omega)", "X=\\dfrac{1}{1+\\omega^{2}T^{2}}", "Y=\\dfrac{-\\omega T}{1+\\omega^{2}T^{2}}", "X-\\dfrac{1}{2}=\\dfrac{1-\\omega^{2}T^{2}}{2\\left(1+\\omega^{2}T^{2}\\right)}\\;\\Rightarrow\\;\\left(X-\\dfrac{1}{2}\\right)^{2}+Y^{2}=\\dfrac{\\left(1-\\omega^{2}T^{2}\\right)^{2}+4\\omega^{2}T^{2}}{4\\left(1+\\omega^{2}T^{2}\\right)^{2}}", "\\left(X-\\dfrac{1}{2}\\right)^{2}+Y^{2}=\\left(\\dfrac{1}{2}\\right)^{2}"],
    19: ["G(s)=1+Ts \\;\\Rightarrow\\; G(j\\omega)=1+j\\omega T", "A(\\omega)=\\sqrt{1+\\omega^{2}T^{2}}", "\\varphi(\\omega)=\\arctan\\omega T", "\\frac{1}{1+j\\omega T}"],
    20: ["G(s)=\\dfrac{1}{T^{2}s^{2}+2\\zeta Ts+1}=\\dfrac{\\omega_n^{2}}{s^{2}+2\\zeta\\omega_n s+\\omega_n^{2}}", "A(\\omega)=\\dfrac{1}{\\sqrt{(1-T^{2}\\omega^{2})^{2}+(2\\zeta T\\omega)^{2}}}", "\\varphi(\\omega)=-\\arctan\\dfrac{2\\zeta T\\omega}{1-T^{2}\\omega^{2}}", "\\omega=\\omega_n=\\frac{1}{T}", "\\frac{1}{2\\zeta}\\angle-90^{\\circ}"],
    21: ["\\dfrac{\\mathrm{d}|G(j\\omega)|}{\\mathrm{d}\\omega}=0", "\\omega_r=\\omega_n\\sqrt{1-2\\zeta^{2}},\\qquad M_r=\\dfrac{1}{2\\zeta\\sqrt{1-\\zeta^{2}}}", "\\omega_r\\to\\omega_n"],
    22: ["M_r=\\dfrac{c_{\\max}}{R}\\Big|_{\\omega=\\omega_r}=\\dfrac{1}{2\\zeta\\sqrt{1-\\zeta^{2}}}"],
    24: ["G(j\\omega)=(1-T^{2}\\omega^{2})+j\\,2\\zeta T\\omega", "G(s)=e^{-T_D s}\\;\\Rightarrow\\;G(j\\omega)=1\\angle-\\omega T_D"],
    25: ["G(s)=\\dfrac{1}{Ts+1}", "G(s)=\\dfrac{1}{T^{2}s^{2}+2\\zeta Ts+1}", "G(s)=T^{2}s^{2}+2\\zeta Ts+1"],
    26: ["G(j\\omega)=\\frac{K}{j\\omega(1+j\\omega T)}", "L_1=\\omega,\\quad L_2=T|j\\omega+1/T|", "|G|=\\frac{K}{L_1L_2},\\qquad \\angle G=-(\\theta_1+\\theta_2)"],
    27: ["G(j\\omega)=\\dfrac{K\\prod_i (j\\omega\\tau_i+1)}{(j\\omega)^{\\nu}\\,\\prod_j (j\\omega T_j+1)}", "\\begin{aligned}|G|&=\\dfrac{K\\prod_i|j\\omega\\tau_i+1|}{\\omega^{\\nu}\\prod_j|j\\omega T_j+1|}\\\\[2pt] \\angle G&=\\sum_i\\arctan\\omega\\tau_i-\\nu\\cdot90^{\\circ}-\\sum_j\\arctan\\omega T_j\\end{aligned}"],
    28: ["G(j\\omega)H(j\\omega)=\\dfrac{K\\prod_i (j\\omega\\tau_i+1)}{(j\\omega)^{\\nu}\\,\\prod_j (j\\omega T_j+1)}", "GH\\approx\\dfrac{K}{(j\\omega)^{\\nu}}=\\infty\\angle-90^{\\circ}\\nu", "GH\\approx\\dfrac{K\\prod\\tau_i}{\\prod T_j}(j\\omega)^{m-n}=0\\angle-90^{\\circ}(n-m)"],
    29: ["\\dfrac{10}{j\\omega(1+j0.2\\omega)(1+j0.05\\omega)}"],
    30: ["\\Phi(j\\omega)=A(\\omega)\\angle\\varphi(\\omega)", "\\omega_r=\\omega_n\\sqrt{1-2\\zeta^{2}}", "M_r=\\dfrac{1}{2\\zeta\\sqrt{1-\\zeta^{2}}}"],
    32: ["L(\\omega)=20\\lg|G(j\\omega)H(j\\omega)|\\;\\;(\\mathrm{dB})", "\\varphi(\\omega)=\\angle G(j\\omega)H(j\\omega)"],
    33: ["20\\lg\\Big|\\prod_i G_i\\Big|=\\sum_i 20\\lg|G_i|"],
    34: ["L(\\omega)=20\\lg K\\;\\;(\\mathrm{dB})", "\\varphi(\\omega)=0^{\\circ}"],
    35: ["L(\\omega)=-20\\lg\\omega", "\\varphi(\\omega)=-90^{\\circ}", "L(\\omega)=+20\\lg\\omega", "\\varphi(\\omega)=+90^{\\circ}"],
    36: ["G(s)=\\dfrac{1}{Ts+1}", "L(\\omega)=-20\\lg\\sqrt{1+\\omega^{2}T^{2}}=-10\\lg\\!\\left(1+\\omega^{2}T^{2}\\right)", "\\varphi(\\omega)=-\\arctan\\,\\omega T", "L(\\omega)\\approx-10\\lg 1=0\\,\\mathrm{dB}", "G(s)=\\dfrac{1}{0.5s+1}"],
    37: ["G(s)=\\dfrac{1}{Ts+1}"],
    38: ["\\alpha=\\arctan\\tfrac{1}{k}"],
    39: ["L(\\omega)=+10\\lg\\!\\left(1+\\omega^{2}T^{2}\\right)", "\\varphi(\\omega)=+\\arctan\\,\\omega T", "L=+3.01\\,\\mathrm{dB}", "\\varphi=+45^{\\circ}"],
    40: ["G(s)=\\dfrac{1}{T^{2}s^{2}+2\\zeta Ts+1}", "L(\\omega)=-20\\lg\\sqrt{(1-T^{2}\\omega^{2})^{2}+(2\\zeta T\\omega)^{2}}", "\\varphi(\\omega)=-\\arctan\\dfrac{2\\zeta T\\omega}{1-T^{2}\\omega^{2}}", "L\\approx-20\\lg 1=0\\,\\mathrm{dB}", "\\varphi(\\omega_n)=-90^{\\circ}", "G(s)=\\dfrac{4}{s^{2}+0.8s+4}"],
    41: ["G(s)=\\dfrac{1}{s^{2}+2\\zeta s+1}"],
    42: ["G(s)=T^{2}s^{2}+2\\zeta Ts+1", "L(\\omega)=20\\lg\\sqrt{(1-T^{2}\\omega^{2})^{2}+(2\\zeta T\\omega)^{2}},\\quad \\varphi(\\omega)=+\\arctan\\dfrac{2\\zeta T\\omega}{1-T^{2}\\omega^{2}}", "L(\\omega)=20\\lg 1=0\\ \\mathrm{dB},\\qquad \\varphi(\\omega)=-\\omega T_{D}\\ \\mathrm{(rad)}=-57.3^{\\circ}\\,\\omega T_{D}"],
    43: ["G(s)=\\dfrac{1}{Ts+1}", "G(s)=\\dfrac{1}{T^{2}s^{2}+2\\zeta Ts+1}", "G(s)=T^{2}s^{2}+2\\zeta Ts+1"],
    45: ["G(s)H(s)=\\dfrac{4\\,(0.5s+1)}{s\\,(2s+1)\\,(s^{2}/64+0.05s+1)}", "L(\\omega)=L_{1}+L_{2}+L_{3}+L_{4}+L_{5}"],
    46: ["L(s)=\\frac{40(1+0.5s)}{s(1+2s)(1+s/30)}", "\\varphi(\\omega)=-90^\\circ+\\arctan(0.5\\omega)-\\arctan(2\\omega)-\\arctan(\\omega/30)"],
    47: ["G(s)H(s)=\\dfrac{10(s+3)}{s(s+2)(s^{2}+s+2)}=\\dfrac{7.5\\left(\\dfrac{s}{3}+1\\right)}{s\\left(\\dfrac{s}{2}+1\\right)\\left(\\dfrac{s^{2}}{2}+\\dfrac{s}{2}+1\\right)}"],
    48: ["G(s)H(s)=\\dfrac{10(s+3)}{s(s+2)(s^{2}+s+2)}=\\dfrac{7.5\\left(\\dfrac{s}{3}+1\\right)}{s\\left(\\dfrac{s}{2}+1\\right)\\left(\\dfrac{s^{2}}{2}+\\dfrac{s}{2}+1\\right)}", "\\begin{gathered}L(\\omega)=20\\lg 7.5+10\\lg\\Bigl(1+\\tfrac{\\omega^{2}}{9}\\Bigr)-20\\lg\\omega\\\\ \\quad-10\\lg\\Bigl(1+\\tfrac{\\omega^{2}}{4}\\Bigr)-10\\lg\\Bigl[\\Bigl(1-\\tfrac{\\omega^{2}}{2}\\Bigr)^{2}+\\tfrac{\\omega^{2}}{4}\\Bigr]\\end{gathered}"],
    49: ["G(j\\omega)H(j\\omega)=\\dfrac{K_{p}}{1+j\\omega T}", "\\Rightarrow\\;L(\\omega)\\Big|_{\\omega\\to 0}\\approx 20\\lg K_{p}", "G(j\\omega)H(j\\omega)=\\dfrac{K_{v}}{j\\omega(1+j\\omega T)}", "G(j\\omega)H(j\\omega)=\\dfrac{K_{a}}{(j\\omega)^{2}(1+j\\omega T)}"],
    50: ["\\omega=\\sqrt{K_{a}}=\\sqrt{8}\\approx 2.8"],
    51: ["20\\lg K=L(\\omega_{1})+20\\nu\\,\\lg\\omega_{1}"],
    52: ["L_1(s)=\\frac{10(1+0.5s)}{s(1+s)(1+s/8)}", "\\Delta\\varphi(\\omega)=-\\omega T_D\\;\\mathrm{rad}", "L(s)=\\frac{10(1+0.5s)e^{-0.2s}}{s(1+s)(1+s/8)}"],
    54: ["|1\\pm j\\omega T|=\\sqrt{1+(\\omega T)^{2}}"],
    55: ["\\varphi(\\infty)=-(n-m)\\times 90^{\\circ}", "G_{1}=\\dfrac{0.5s+1}{s(2s+1)}", "G_{2}=\\dfrac{1-0.5s}{s(2s+1)}", "G_{3}=\\dfrac{e^{-\\tau s}(0.5s+1)}{s(2s+1)}"],
    57: ["\\phi(u)=-\\operatorname{atan2}(2\\zeta u,1-u^2),\\qquad u=\\frac{\\omega}{\\omega_n}", "y=\\dfrac{2\\zeta u}{1-u^{2}}", "\\frac{d\\phi}{du}=\\frac{d\\phi}{dy}\\cdot\\frac{dy}{du}", "\\dfrac{d\\phi}{du}=-\\dfrac{1}{1+y^{2}}\\cdot\\dfrac{2\\zeta\\left(1+u^{2}\\right)}{\\left(1-u^{2}\\right)^{2}}", "\\dfrac{d\\phi}{du}=-\\dfrac{2\\zeta\\left(1+u^{2}\\right)}{\\left(1-u^{2}\\right)^{2}+4\\zeta^{2}u^{2}}", "\\left.\\dfrac{d\\phi}{du}\\right|_{u=1}=-\\dfrac{2\\zeta\\cdot 2}{0+4\\zeta^{2}}=-\\dfrac{1}{\\zeta}"],
    58: ["G(s)=\\dfrac{\\omega_{n}^{2}}{s^{2}+2\\zeta\\omega_{n}s+\\omega_{n}^{2}}"],
    63: ["F(s)=(s-z_{1})(s-z_{2})"],
    64: ["F(s)=(s-z_{1})(s-z_{2})"],
    65: ["F(s)=(s-z_{1})(s-z_{2})(s-z_{3})"],
    66: ["F(s)=\\dfrac{K\\prod(s-z_{i})}{\\prod(s-p_{j})}"],
    67: ["N=\\Delta\\angle F(s)/360^{\\circ}"],
    68: ["G(s)=\\dfrac{N_{G}(s)}{D_{G}(s)}\\qquad H(s)=\\dfrac{N_{H}(s)}{D_{H}(s)}", "G(s)H(s)=\\dfrac{N_{G}(s)N_{H}(s)}{D_{G}(s)D_{H}(s)}", "\\Phi(s)=\\dfrac{G(s)}{1+G(s)H(s)}=\\dfrac{N_{G}(s)D_{H}(s)}{D_{G}(s)D_{H}(s)+N_{G}(s)N_{H}(s)}", "F(s)=1+G(s)H(s)=\\dfrac{D_{G}(s)D_{H}(s)+N_{G}(s)N_{H}(s)}{D_{G}(s)D_{H}(s)}"],
    69: ["\\varPhi(s)=\\dfrac{G(s)}{1+G(s)H(s)},\\qquad F(s)=1+G(s)H(s)"],
    70: ["s=\\varepsilon e^{j\\theta},\\quad \\varepsilon\\to 0,\\quad \\theta:-90^{\\circ}\\to +90^{\\circ}", "G(s)H(s)\\Big|_{s=\\varepsilon e^{j\\theta}}=\\infty\\cdot e^{-j\\nu\\theta}"],
    72: ["G(s)H(s)=\\dfrac{1}{s(s+1)}", "s=\\varepsilon e^{j\\theta}", "\\theta:-90^{\\circ}\\to 90^{\\circ}"],
    73: ["G(j\\omega)H(j\\omega)=\\frac{-KT}{1+\\omega^{2}T^{2}}-j\\,\\frac{K}{\\omega(1+\\omega^{2}T^{2})}"],
    74: ["s=\\varepsilon e^{j\\theta}", "G(s)H(s)\\approx\\dfrac{K}{(\\varepsilon e^{j\\theta})^{\\nu}}=\\infty\\,e^{-j\\nu\\theta}"],
    75: ["G(s)H(s)=\\dfrac{K(s+1)(0.5s+1)}{s^{3}}", "\\omega^{*}=1/\\sqrt{T_{1}T_{2}}=1.41,\\ \\mathrm{Re}^{*}=-K(T_{1}+T_{2})T_{1}T_{2}", "s=\\varepsilon e^{j\\theta}"],
    77: ["K_{\\rm crit}=\\frac{1}{(T_1+T_2)T_1T_2}=\\frac43", "L(s)=\\frac{K(1+s)(1+0.5s)}{s^3}"],
    79: ["|G(j\\omega_{c})|=1,\\qquad \\gamma=180^{\\circ}+\\varphi(\\omega_{c})", "\\varphi(\\omega_{g})=-180^{\\circ},\\qquad K_{g}=\\dfrac{1}{|G(j\\omega_{g})|}", "G(s)=\\dfrac{1.2}{s(s+1)(0.25s+1)}"],
    80: ["\\gamma=180^{\\circ}+\\varphi(\\omega_{c})\\approx 36.3^{\\circ}", "K_{g}(\\mathrm{dB})=-L(\\omega_{g})\\approx 12.4\\,\\mathrm{dB}"],
    81: ["K_{g}=\\dfrac{1}{|G(j\\omega_{g})|}"],
    83: ["\\varPhi(j\\omega)=\\dfrac{G(j\\omega)}{1+G(j\\omega)}\\quad(\\text{单位负反馈})", "M=\\dfrac{|OA|}{|PA|},\\qquad \\alpha=\\angle OA-\\angle PA"],
    84: ["M=\\left|\\dfrac{X+jY}{1+X+jY}\\right|=\\sqrt{\\dfrac{X^{2}+Y^{2}}{(1+X)^{2}+Y^{2}}}", "X^{2}(1-M^{2})-2M^{2}X-M^{2}+(1-M^{2})Y^{2}=0", "\\left(X-\\dfrac{M^{2}}{1-M^{2}}\\right)^{2}+Y^{2}=\\left(\\dfrac{M}{1-M^{2}}\\right)^{2}", "\\left(-\\dfrac{M^{2}}{M^{2}-1},\\,0\\right)", "\\left|\\dfrac{M}{M^{2}-1}\\right|"],
    86: ["N=\\tan\\alpha=\\tan\\!\\left(\\angle\\varPhi\\right)=\\dfrac{Y}{X^{2}+X+Y^{2}}", "\\left(X+\\dfrac{1}{2}\\right)^{2}+\\left(Y-\\dfrac{1}{2N}\\right)^{2}=\\dfrac{1}{4}+\\dfrac{1}{4N^{2}}", "\\left(-\\dfrac{1}{2},\\,\\dfrac{1}{2N}\\right)", "\\sqrt{\\dfrac{1}{4}+\\dfrac{1}{4N^{2}}}"],
    88: ["G(j\\omega)=\\dfrac{\\omega_n^{2}}{j\\omega\\left(j\\omega+2\\zeta\\omega_n\\right)}", "\\omega_c=\\omega_n\\sqrt{\\sqrt{1+4\\zeta^{4}}-2\\zeta^{2}}", "\\gamma=\\arctan\\dfrac{2\\zeta\\omega_n}{\\omega_c}=\\arctan\\dfrac{2\\zeta}{\\sqrt{\\sqrt{1+4\\zeta^{4}}-2\\zeta^{2}}}", "\\gamma\\approx 100\\zeta\\ (\\gamma\\text{ 以度计},\\ \\zeta\\le 0.6)"],
    89: ["t_s\\approx\\dfrac{4}{\\zeta\\omega_n}", "\\omega_c=\\omega_n\\sqrt{\\sqrt{1+4\\zeta^{4}}-2\\zeta^{2}}", "t_s\\approx\\dfrac{4}{\\zeta\\omega_c}\\cdot\\sqrt{\\sqrt{1+4\\zeta^{4}}-2\\zeta^{2}}", "\\tan\\gamma=\\dfrac{2\\zeta}{\\sqrt{\\sqrt{1+4\\zeta^{4}}-2\\zeta^{2}}}", "\\boxed{\\,t_s\\approx\\dfrac{8}{\\omega_c\\,\\tan\\gamma}\\,}", "t_{s}\\cdot\\omega_{c}=8/\\tan\\gamma"],
    90: ["M(\\omega_b)=10^{-3/20}M(0)\\approx 0.707M(0)"],
    91: ["\\varPhi(j\\omega)=\\dfrac{1}{(j\\omega)^{2}+2\\zeta(j\\omega)+1}"],
    92: ["\\sigma\\approx0.16+0.4\\left(\\dfrac{1}{\\sin\\gamma}-1\\right)\\;\\;\\Rightarrow\\;\\text{超调量}\\approx100\\sigma\\%", "t_s\\approx\\dfrac{\\pi}{\\omega_c}\\left[2+1.5\\left(\\dfrac{1}{\\sin\\gamma}-1\\right)+2.5\\left(\\dfrac{1}{\\sin\\gamma}-1\\right)^{2}\\right]", "\\sigma\\approx0.14+0.4\\left(M_r-1\\right)\\;\\;\\Rightarrow\\;\\text{超调量}\\approx100\\sigma\\%", "t_s\\approx\\dfrac{\\pi}{\\omega_c}\\left[2+1.5\\left(M_r-1\\right)+2.5\\left(M_r-1\\right)^{2}\\right]", "M_r\\approx\\dfrac{1}{\\sin\\gamma}"],
    93: ["L(\\omega)\\approx 20\\lg K-20\\nu\\lg\\omega", "t_s\\approx\\frac{8}{\\omega_c\\tan\\gamma}\\quad\\text{（标准欠阻尼二阶，2\\%误差带）}"],
    95: ["G(j\\omega)=A(\\omega)\\angle\\varphi(\\omega)", "L=20\\lg|G|,\\quad \\varphi=\\angle G", "\\varPhi=\\dfrac{G}{1+G}"]
  };

  function fixed(index, overrides, hidden = [], title) {
    const lab = groups[index].lab;
    const defaults = Object.fromEntries(lab.controls.map(({ id, value }) => [id, value]));
    const controls = lab.controls.filter(({ id }) => !hidden.includes(id));
    return {
      ...lab,
      title: title || lab.title,
      controls,
      draggable: controls.some(({ id }) => id === lab.draggable) ? lab.draggable : undefined,
      draw: state => lab.draw({ ...defaults, ...state, ...overrides })
    };
  }
  const polar = (kind, values = {}, extra = [], title) =>
    fixed(1, { ...(kind === undefined ? {} : { kind }), example: 0, ...values }, ["example", ...(kind === undefined ? [] : ["kind"]), ...extra], title);
  const bode = (kind, values = {}, extra = [], title) =>
    fixed(2, { ...(kind === undefined ? {} : { kind }), ...values }, [...(kind === undefined ? [] : ["kind"]), ...extra], title);
  const frequency = (value = 0) => R("logw", "lg ω", -2, 2, .04, value);
  const complex = ([a, b], [c, d]) => [a * c - b * d, a * d + b * c];
  const phase = ([a, b]) => Math.atan2(b, a) * 180 / Math.PI;
  const magnitude = ([a, b]) => Math.hypot(a, b);
  const f = (value, decimals = 2) => Number(value.toFixed(decimals));
  const labSpec = (title, visual, controls, draw, draggable) =>
    ({ title, visual, controls, draw, draggable, timed: false });

  const specimens = `
1|本章六节~从频率特性、极坐标图和对数坐标图出发，进入系统稳定性、闭环频率特性及频域与时域指标。
2|第 1 次~频率特性与极坐标图，课件 P3–P29。|第 2 次~典型 Bode 图与绘法，P30–P55。|第 3 次~Nyquist 判稳和相对稳定性，P56–P80。|第 4 次~闭环频率特性和频域、时域指标，P81–P95。
3|第一部分~通过正弦试验定义频率特性，随后辨认典型环节轨迹、练习一般系统的极坐标画法。
4|时域困难~机械、液压、热力等系统有时难准确建模，三阶以上微分方程常难于解析。|通信工程~长途电话和反馈放大器推动频域方法发展。1932 年提出 Nyquist 判据，20 世纪 40 年代 Bode 的对数方法发展了频域分析与综合。
5|分解、响应、叠加~对可傅里叶表示的信号，分成正弦分量；稳定线性系统对每个分量保持频率，输出按线性叠加。选频试验容易产生和测量正弦信号。
6|四项用途~物理模型难建时可实测；高阶响应可避开解析求解；曲线给出稳定性和相对稳定性；可用来分析性能并设计校正。|适用条件~经典方法面向线性定常系统，近似模型的结论须检查工况和适用频带。
7|两幅视图~同一个信号可同时用时间波形或频率成分描述，正弦和余弦是频率分解的基。
8|定义与推理~稳定线性定常系统受正弦输入后，系统极点相关项衰减，输入在 ±jω 的共轭极点留下稳态正弦项；频率不变，幅值和相位由复数频率响应决定。
9|一阶推导~在零初始条件下写 C(s)，对 s=−1/T 和 s=±jω 的因子部分分式展开。指数项衰减后，两个正弦分量用辅助角公式合并。
10|三条途径~时域取稳态项，传递函数代入 s=jω，或由正弦实验测幅值比和相位差，得到同一个频率特性；复数函数由系统结构参数决定。
11|双解法~G(s)H(s)=1/(s+1)，单位反馈闭环为 1/(s+2)。输入 3sin(2t+90°)，时域逆变换去掉 −0.75e^(−2t)，频域在 ω=2 计算。保留精确幅值 3/√8≈1.061，沿用课件中间值 0.35 时得到 1.05。
12|实测条件~输入 2sin t、输出 4sin(t−45°) 给出闭环 |Φ(j1)|=2、相角 −45°。使用标准二阶闭环可得 ωn≈1.24 rad/s、ζ≈0.22。
13|相量比~以输出、输入正弦的幅值和相角定义 C(jω)、R(jω)。两者的相量比与传递函数 G(s) 在 s=jω 处的值一致。
14|四种形式~幅频—相频、复指数、三角展开、实部加虚部可相互转换。求相角按实虚部的象限使用 atan2。
15|两种图示~Nyquist 图的点到原点长度是幅值，极角是相位；Bode 水平轴用对数频率，上图幅值分贝、下图相角。
16|比例、积分、微分~正比例 K 是实轴上固定点；1/s 相角 −90°、沿负虚轴向原点；s 相角 +90°、沿正虚轴从原点向外。
17|描点顺序~在 0、0.5、1、2、4、5、8、20 rad/s 用模和角描点。时间常数增大，半圆保持，给定 ω 的点更靠近收尾。
18|消元~令 u=ωT，实部 1/(1+u²)，虚部 −u/(1+u²)。两者平方整理为圆心 (1/2,0)、半径 1/2 的下半圆。
19|一阶分子~G(jω)=1+jωT，T=0.5 s 的曲线从 (1,0) 直线上升。每个 T>0 对应同一射线。
20|三个关键点~ω=0 从 (1,0) 出发；ω=ωn 穿负虚轴，纵坐标 −1/(2ζ)；ω→∞ 从负实轴下方回到原点。
21|求幅值极大~令幅值分母平方关于归一化频率的导数为零，得到非零谐振频率和峰值。ζ 在阈值上方时，最大幅值在零频；ζ=0 的理想模型在 ωn 奇异。
22|一个机理，两种用途~激励接近 ωr 时，幅值放大 Mr 倍。结构设计要避免高幅振动，调谐电路利用峰值选台，扫频实验能测出相同的峰。
23|实验边界~固定 ωn=1，比较 ζ 从 1.2 到 0.05 的轨迹。ζ≤1/√2 附近看是否形成非零谐振峰；等于阈值时极大点仍在 ω=0。
24|二阶分子和时延~二阶分子从 (1,0) 出发，在 ωn 处穿正虚轴，高频向负实部无穷远移动；纯延迟沿单位圆顺时针绕行，频率与展开相角满足 φ=−ωTD。
25|识图区分~比例是点；积分、微分是虚轴线；惯性是下半圆；一阶分子是竖直射线；振荡收回原点、二阶微分走向无穷、延迟绕单位圆。
26|两根相量~原点到 jω 的长度 L1=ω、相角 90°；−1/T 到 jω 的物理矢量乘 T，长度成为 L2=|1+jωT|。K>0 时 |G|=K/(L1L2)，相角为两角和取负。
27|三步法~先用标准型判断首尾，再联立实部或虚部为零求轴交点，以 ω 增大方向平滑连接；乘除因子的长度和角可从 s 平面几何读取。
28|尾 1 标准型~低频 ω→0⁺ 的主项是 K/(jω)^ν，高频主项由最高阶项决定，沿 −90°(n−m) 的方向进入原点。方向之外的位置靠进一步计算。
29|例 4-4 的五处读数~m=0、阶差 3、I 型；Re=−2.5 的低频渐近线自下方来；高频从正虚轴方向到原点；ω=10 穿实轴于 −0.4；有限正频率不与虚轴相交。
30|第一部分回看~从稳态同频性定义 G(jω)，用模角或实虚形式计算，再画典型极坐标和一般系统关键点。
31|第二部分~半对数坐标让宽频区间容易阅读；依次学习标准环节、开环绘制、实验辨识和最小相位。
32|两轴读法~幅频纵轴 20lg|G|，相频纵轴 φ，横轴以 rad/s 标频率但按 lgω 分度。0.1→1、1→10、10→100 的横向距离相同。
33|四种便利~扩大低频可读区；幅值乘除和相位乘积变成加减；用渐近折线近似；在 K>0 时改变 K 仅上下平移幅频图。
34|比例算例~示例 K=4，幅频为 20lg4≈12.04 dB，相频 0°，没有转角频率。
35|积分和微分~两条幅频图都过 (1 rad/s,0 dB)；积分相角 −90°，微分 +90°。横跨一个十倍频程分别下降和上升 20 dB。
36|惯性算例~G=1/(0.5s+1)，转角 2 rad/s。两条渐近线分别是低频 0 dB、高频 −20 dB/dec，精确幅值在两线以下。
37|改变时间常数~转角频率 ω=1/T；T 增大，幅频和相频图沿对数频率轴整体左移。
38|修正与对称~转角处实际幅值相对渐近值 −20lg√2≈−3.01 dB；取 ω1ω2=1/T² 的频率对，φ(ω1)+φ(ω2)=−90°，相频关于中心点反对称。
39|一阶分子~G=1+0.5s 与同 T 的惯性环节互为倒数，幅相反号、转角相同。高频斜率 +20 dB/dec，相角趋向 +90°。
40|例题参数~4/(s²+0.8s+4) 给出 ωn=2、ζ=0.2；精确幅值在转角附近因阻尼较小而突起，相频由 0° 过 −90° 到 −180°。
41|两条骨架不变~ωn=1 的振荡环节低频渐近 0 dB，高频 −40 dB/dec，阻尼影响精确曲线的峰值和相变速度。
42|二阶分子与延迟~前者互为倒数，渐近高频斜率 +40 dB/dec；后者幅值始终 0 dB，相位对 ω 线性减少，需用展开相位。
43|典型贡献~正比例因子定高度；积分和微分决定起始斜率；转角上的一阶因子改 ±20，二阶因子改 ±40 dB/dec；纯延迟不改幅频。
44|三种绘法~逐环节曲线相加，按转角顺序更新斜率，或选频率代入后描点。实作依次化尾 1、提 K/ν、排转角、定低频直线、按转角叠斜率。
45|例 4-5~K=4、I 型，二阶因子 ωn=8、ζ=0.2。折线斜率依次 −20、−40、−20、−60，转角为 0.5、2、8 rad/s。
46|顺序叠加算例~K=40、I 型，转角 0.5、2、30 rad/s，段斜率 −20、−40、−20、−40 dB/dec。相频按三项反正切和积分相角逐点求出。
47|例 4-6~把 (s+3)、(s+2) 和二阶项提出常数，K=7.5。转角依次 √2、2、3 rad/s，段斜率 −20、−60、−80、−60 dB/dec，二阶阻尼约 0.35。
48|计算法~用标准形的精确模和展开相角在 0.5、1、1.4、2、3、10 rad/s 描点。1.4 rad/s 的精确值约 16.8 dB，渐近值约 14.6 dB。
49|系数对应~单位负反馈闭环稳定时，0/I/II 型渐近线分别给 Kp、Kv、Ka。低频段斜率 −20ν；取 ω=1 的外推高度 20lgK，或由与 0 dB 的交点换算。相应阶跃、斜坡、抛物输入时读 1/(1+Kp)、1/Kv、1/Ka。
50|低频方程~II 型的低频渐近线为 20lgKa−40lgω；原题 Ka=8，求横轴交点。
51|正弦正交测量~向系统逐频施加已知正弦，稳态输出与参考正弦/余弦分别相关得到正交分量，再换算模和相位。|辨识~低频判型和幅高定增益，转角变化定因子，最后用相频审查是否遗漏时延或镜像零点。
52|例 4-9~I 型、K=10，转角 1、2、8 rad/s 对应一阶极点、一阶零点、一阶极点。实测相位在 ω=10 少约 110°、ω=20 少约 230°，两次估出 TD≈0.2 s。
53|最小相位条件~稳定有理模型的零极点在左半平面，允许按课件惯例单列原点积分因子。标准模型族内可用幅频约束结构；纯时延、右半平面零点及其它额外全通因子需要相位观测。
54|同模反相~ωT 的平方使 |1+jωT|=|1−jωT|，两个相位分别为 +arctan(ωT) 和 −arctan(ωT)，高频相差 180°。
55|高频总账~最小相位因子净相角 −90°(n−m)。jω 左右镜像零点多滞后 180°，纯延迟相位持续下降。示例 n−m=1 时三种高频末相角分别为 −90°、−270°、持续减小；一般结构需结合完整相位和先验条件。
56|第二部分回看~分贝把乘除化加减；按低频、转折、高频画曲线；低频读误差系数，实测幅相共同辨识模型。
57|相频导数~写成连续相位 −atan2(2ζu,1−u²)，对 u 求导后在 u=1 代入，单位为弧度每单位 u。ζ→0⁺ 时过渡趋于 180° 跳变。
58|从极点看相角~两个共轭极点到 jω 的矢量相角求和并取负。阻尼越小，靠近虚轴的极点使邻近 ωn 的矢量方向变化越集中。
59|第三部分~用复映射建立幅角原理，随后从 Nyquist 图判闭环稳定并读取相对稳定性。
60|判据转换~代数法根据特征方程系数查根；图解法让 s 平面围线在 F(s) 平面成像，用绕行方向与圈数判断右半平面根。
61|单向量~以原点为圆心，设 s=re^(jθ)，平方后半径变 r²，角度变 2θ；所以完整一圈的像走两圈。
62|差向量~从固定 z 出发指向 s。F=s−z 的像曲线与 s 的轨迹同形，整体平移 −z。
63|向量乘积~以 z1、z2 为两个尾端，分别作到 s 的矢量；对应复数相乘后，模乘、幅角加。
64|圈内两个零点~从每个圈内零点观察，s 顺时针走一圈，向量各净转 −360°，乘积净转 −720°。
65|圈外零点~该矢量初末方向相同，沿途变动后净转角为零；两内一外的乘积仍是顺时针两圈。
66|零极点混合~圈内一个零点带来顺时针一圈，两个极点各带来逆时针一圈，合成逆时针一圈。
67|计算约定~s 平面围线顺时针，映射曲线逆时针计正 N。围线上不可有零极点；按重数统计 Z、P，得到 N=P−Z。
68|从闭环方程到计数~令 GH=B/A，F=(A+B)/A；在无不当消去的表示下，F 的零点为闭环特征根，F 的极点为开环极点。
69|平移保持净圈数~F(jω) 曲线绕原点的净次数与 L(jω)=F(jω)−1 绕 −1 的净次数相等。
70|四段围线~右半大半圆闭合正、负虚轴。当开环在虚轴有极点，在该点向右挖小半圆，避免围线直接穿过极点。
71|从计数到稳定~P=0 时，N=0 且曲线未经过 −1 对应闭环稳定，N<0 表示有右半根。曲线恰过 −1 时存在闭环虚轴根，要另查根重数。
72|例 4-10 围线~L=K/[s(1+Ts)]。四段从虚轴小半圆、正频、远处大半圆、负频依次映射；标签随观察段切换。
73|例 4-10 全图~正频从 Re=−KT 的竖线附近起步，从负实部方向接近 0；负频为共轭支，低频像在无穷远补半圈。K,T>0 时 P=N=Z=0。
74|四步拼图~先画正频，再补实轴镜像；严格真分式的高频弧在原点附近，原点 ν 重积分极点的绕行像在无穷远顺时针补 180°ν。
75|例 4-12~L=K(1+s)(1+0.5s)/s³，ω*=√2，实轴交点为 −0.75K。K=2 时交点 −1.5，补 540° 后净圈数 N=0。
76|实系数和虚轴补弧~L(−jω) 为 L(jω) 的共轭。有原点积分极点时，正负频支路在无穷远接合，需要加顺时针的低频像弧。
77|条件稳定~III 型例题 K>4/3 稳定、0<K<4/3 有两个闭环右半平面极点，在 K=4/3 有闭环虚轴根。K 越大稳定是这个模型的结果。
78|两种穿越~ωc 使 |L(jωc)|=1，γ 是相角到 −180° 的余量；ωg 使相角 −180°，Kg 是临界单位幅值除当前幅值。
79|同一算例~L=1.2/[s(s+1)(0.25s+1)]。ωc≈0.88 rad/s、γ≈36.3°，ωg=2 rad/s、Kg≈4.17 即 12.4 dB。图上分别看单位圆与负实轴。
80|图形对应~单位圆映射为 0 dB 线，负实轴对应 −180°，临界点对应二者组合。对 P=0、单组交越的本例，ωg>ωc、两裕度皆正；复杂情况用完整 Nyquist 判据。
81|第三部分回看~查 P、补全图、按逆时针为正数 N，求 Z；再看 K 变化和裕度。课程示例常用 γ=30°–60°、幅值裕度大于 6 dB 作为经验范围。
82|第四部分~从开环相量求闭环幅相，学习等值图并把开闭环频域指标对应到时域性能。
83|相量几何~O=(0,0)、P=(−1,0)，OA 是 L，PA 是 1+L。闭环 M 为两长度比，α 为两相角差。
84|等 M 圆~用 x²+y²=M²[(x+1)²+y²] 配方得到圆心和半径；M=1 时 x=−1/2。与开环曲线交点可直接读取同一闭环幅值。
85|实际模型~L=1.2/[s(s+1)(0.25s+1)]。M<1 时下降支通常有一交点；1<M<Mr 有两交点；M=Mr 相切；M>Mr 无交。本例 Mr≈1.625，ωr≈0.935 rad/s。
86|等 N 圆~给定闭环相角，从原点和 −1 指向开环工作点的向量夹角固定。整圆的两段分属不同相角，须按求得的辐角选取一段。
87|Nichols 读法~开环相角和 dB 幅值构成坐标，等 M/N 线标闭环量。相切读谐振，M(0)=1 时与 0.707 等值线的交点给带宽；(−180°,0 dB) 对应 −1。
88|二阶联系~经典单位反馈标准二阶系统中 γ 只由 ζ 决定，而二阶欠阻尼阶跃超调也由 ζ 决定；γ≈100ζ° 属于有限区间的工程近似。
89|调节时间~欠阻尼标准二阶系统按 2% 带近似 ts≈4/(ζωn)，代入交越频率和相角关系可写为 8/(ωc tanγ)。固定 γ 时较大 ωc 代表较快。
90|四个闭环指标~M(0) 是零频增益，Mr 是谐振峰值，ωr 是峰频，ωb 时幅值相对 M(0) 下降 3 dB；区分这些指标与开环的 γ、ωc。
91|模型约束~ωn=1 的标准二阶闭环，ζ<1/√2 才有非零谐振峰；在 1/√2≤ζ<1 的欠阻尼区仍有阶跃超调。按 ωn 缩放，带宽同比例变化。
92|经验式的适用条件~原课件给出的演示范围为 35°≤γ≤90°、1≤Mr≤1.8，系数、适用范围和调节时间的误差带尚待教材核验。固定 ωc 时，两组估算均随阻尼程度改变。课件举出的工程参考区间为 1.1≤Mr≤1.5。|把两组估算代回同一系统~沿用本章第 79 页的单位负反馈算例。开环模型给出 γ≈36.25°、ωc≈0.880 rad/s，闭环扫频给出 Mr≈1.625。分别代入本页两组经验式，超调估计为 43.6% 和 39.0%。|由闭环模型独立核对~该例闭环传递函数为 4.8/(s³+5s²+4s+4.8)。直接求单位阶跃响应，首峰约在 3.392 s，峰值 1.339，稳态值 1，实际模型超调约 33.9%。以 ±2% 为误差带计算，调节时间约 10.84 s。
93|三频段~低频看型别和增益；中频看 ωc、相角裕度和穿越附近斜率；高频看测量噪声传递的衰减。约 −20 dB/dec 穿越是常用经验，满足整体相位条件仍要校核。
94|读图对应~在 0 dB 建立频率坐标读出 ωc，再从相频图量出相角距 −180° 的差。二阶条件下分别联系快慢和平稳程度。
95|四步检查~① 用正弦试验描述幅相；② 用极坐标和 Bode 图画；③ 用 Nyquist 判闭环稳定和读裕度；④ 在适用模型中由频域指标理解时域性能。后续进入根轨迹法。
`;

  const sample = (fn, min, max, count = 150) =>
    Array.from({ length: count + 1 }, (_, i) => fn(min + (max - min) * i / count));
  const svg = (label, body, box = "0 0 640 320") =>
    '<svg viewBox="' + box + '" role="img" aria-label="' + escape(label) + '">' + body + "</svg>";
  const label = (s, x, y, color = "#5e6372", anchor = "middle") =>
    '<text x="' + x + '" y="' + y + '" text-anchor="' + anchor + '" fill="' + color + '" font-size="15">' + escape(s) + "</text>";
  const edge = (a, b, color = "#b6a7c5", width = 1.5) =>
    '<path d="M' + a.join(" ") + "L" + b.join(" ") + '" fill="none" stroke="' + color + '" stroke-width="' + width + '"/>';
  const dot = (p, color = ink.teal, radius = 5) =>
    '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + radius + '" fill="white" stroke="' + color + '" stroke-width="2.8"/>';
  function pane(id, width, height, bounds, traces, markers = [], options = {}) {
    const [left, right, bottom, top] = bounds;
    let a = 47, b = width - 19, c = 20, d = height - 32;
    if (options.equal) {
      const unit = Math.min((b-a)/(right-left), (d-c)/(top-bottom));
      const padX = (b-a-unit*(right-left))/2;
      const padY = (d-c-unit*(top-bottom))/2;
      a += padX;
      b -= padX;
      c += padY;
      d -= padY;
    }
    const x = value => a + (value - left) / (right - left) * (b - a);
    const y = value => d - (value - bottom) / (top - bottom) * (d - c);
    const point = ([u, v]) => [x(u), y(v)].map(v => f(v, 2));
    const ticksX = options.ticksX || sample(v => v, left, right, 4);
    const ticksY = options.ticksY || sample(v => v, bottom, top, 4);
    const axes = ticksX.map(v => edge([x(v), c], [x(v), d], "#e5e0eb", 1) + label(options.xFmt ? options.xFmt(v) : f(v, 1), x(v), d + 20)).join("") +
      ticksY.map(v => edge([a, y(v)], [b, y(v)], "#e5e0eb", 1) + label(f(v, 1), a - 7, y(v) + 4, "#5e6372", "end")).join("") +
      (left < 0 && right > 0 ? edge([x(0), c], [x(0), d]) : "") +
      (bottom < 0 && top > 0 ? edge([a, y(0)], [b, y(0)]) : "");
    const lines = traces.map(([data, color, dash]) => {
      const path = data.filter(p => p.every(Number.isFinite)).map((p, i) => (i ? "L" : "M") + point(p).join(" ")).join("");
      return '<path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"' + (dash ? ' stroke-dasharray="5 4"' : "") + "/>";
    }).join("");
    const points = markers.filter(([u, v]) => u >= left && u <= right && v >= bottom && v <= top).map(([u, v, text, color]) => {
      const p = point([u, v]), reverse = p[0] + 82 > b;
      return dot(p, color) + (text ? label(text, p[0] + (reverse ? -8 : 8), Math.max(c + 16, p[1] - 8), color, reverse ? "end" : "start") : "");
    }).join("");
    return '<defs><clipPath id="' + id + '"><rect x="' + a + '" y="' + c + '" width="' + (b - a) + '" height="' + (d - c) + '"/></clipPath></defs>' +
      axes + '<g clip-path="url(#' + id + ')">' + lines + "</g>" + points + (options.caption ? label(options.caption, 53, 17, "#4c4364", "start") : "");
  }
  const details = (title, prose) => '<div class="selected-result"><strong>' + escape(title) + '</strong><p>' + escape(prose) + '</p></div>';
  const render = (art, rows, title, prose) => ({ art, readouts: readouts(rows), detail: details(title, prose) });
  const shift = (value, offset) => [value[0] + offset, value[1]];
  const minus = ([a, b], [c, d]) => [a - c, b - d];
  const quotient = (a, [c, d]) => {
    const norm = c * c + d * d;
    return complex(a, [c / norm, -d / norm]);
  };
  const db = value => 20 * Math.log10(Math.max(1e-12, value));

  function harmonics(spectrum) {
    return labSpec(spectrum ? "同一信号的波形与频谱" : "叠加基波与奇次谐波", "source-analysis", [
      C("count", "参与叠加", ["基波", "加 3 次谐波", "再加 5 次谐波"])
    ], ({ count }) => {
      const orders = [1, 3, 5].slice(0, count + 1);
      const wave = t => orders.reduce((total, n) => total + 4 * Math.sin(n * t) / (Math.PI * n), 0);
      const body = pane("fqtime", spectrum ? 345 : 640, 320, [0, Math.PI * 2, -1.6, 1.6], [
        [[[0, 0], [0, 1], [Math.PI, 1], [Math.PI, -1], [2 * Math.PI, -1], [2 * Math.PI, 0]], ink.target, true],
        [sample(t => [t, wave(t)], 0, 2 * Math.PI), ink.teal]
      ], [], {caption:"时域 · 近似方波"});
      const bars = orders.map(n => [[ [n, 0], [n, 4 / (Math.PI * n)] ], ink.teal]);
      const next = spectrum ? '<g transform="translate(345 0)">' + pane("fqspec", 295, 320, [0, 6, 0, 1.4], bars,
        orders.map(n => [n, 4 / (Math.PI * n), "", ink.teal]), {ticksX:[0, 1, 3, 5, 6],caption:"频域 · 正弦分量"}) + "</g>" : "";
      return render(svg("傅里叶近似方波", body + next), [["已叠加频率", orders.join("、") + " rad/s"]], "从分量到整体", "橙灰虚线给出理想方波，绿线为当前有限项和。有限项在跳变附近有过冲。");
    });
  }

  function sinLab(kind) {
    const live = kind < 2, fx = kind === 2 ? 2 : 1, fixedT = kind > 1;
    const controls = [
      ...(live ? [frequency(0), R("T","时间常数 T",.2,3,.05,1," s")] : []),
      R("cursor","观察时刻",0,12,.08,3," s")
    ];
    return labSpec(["正弦试验","一阶系统的分量","例 4-1 时域与频域","例 4-2 单频实测"][kind], "source-analysis", controls, state => {
      const w = live ? 10 ** state.logw : fx, T = fixedT ? .5 : state.T;
      const a = [1,1,3,2][kind], phi = kind === 2 ? Math.PI / 2 : 0;
      const gain = kind === 3 ? 2 : kind === 2 ? 1 / Math.sqrt(8) : 1 / Math.hypot(1, w * T);
      const lag = kind >= 2 ? -Math.PI / 4 : -Math.atan(w * T);
      const steady = t => a * gain * Math.sin(w * t + phi + lag);
      const transient = t => -steady(0) * Math.exp(-t / T);
      const full = kind === 1 || kind === 2, limit = kind === 3 ? 4.5 : a * 1.15;
      // Keep individual cycles legible at the upper end of the frequency sweep.
      const windowSeconds = Math.min(12, 6 * 2 * Math.PI / w);
      const start = Math.max(0, Math.min(12-windowSeconds, state.cursor-windowSeconds/2));
      const end = start + windowSeconds;
      const traces = [
        [sample(t => [t, a * Math.sin(w * t + phi)], start, end, 420), ink.blue, true],
        [sample(t => [t, steady(t)], start, end, 420), ink.teal],
        ...(full ? [[sample(t => [t, steady(t) + transient(t)], start, end, 420), ink.orange]] : []),
        [[[state.cursor,-limit],[state.cursor,limit]],ink.target,true]
      ];
      const body = pane("fqsin", 640, 320, [start, end, -limit, limit], traces,
        [[state.cursor, steady(state.cursor), "", ink.teal]], {caption:full ? "蓝：输入  ·  绿：稳态  ·  橙：完整响应" : "蓝：输入  ·  绿：稳态输出"});
      return render(svg("同频输入和输出", body), [["输入频率", f(w,3) + " rad/s"], ["幅值比", f(gain,3)], ["相位差", f(lag * 180 / Math.PI,1) + "°"]],
        full ? "指数暂态衰减" : "输入和输出保持同频", full ? "橙色完整零状态响应逐渐与绿色稳态响应重合。" : "纯稳态曲线用于测量幅值与相位差。");
    }, "cursor");
  }

  function polarSampler() {
    const omega = [0, .5, 1, 2, 4, 5, 8, 20];
    return labSpec("逐点描出惯性半圆", "source-analysis", [
      C("time", "时间常数 T", ["0.5 s", "1 s", "5 s"]), IntroWidgets.stages("step","逐点取样",omega.map(w=>"ω = "+w+" rad/s"),1)
    ], state => {
      const T = [.5, 1, 5][state.time];
      const resp = w => [1 / (1 + (w * T) ** 2), -w * T / (1 + (w * T) ** 2)];
      const values = omega.slice(0, state.step).map(resp), w = omega[state.step - 1], q = values.at(-1);
      const guide = sample(t => [.5+.5*Math.cos(t), .5*Math.sin(t)], 0, -Math.PI);
      const px = pane("fqhalf", 460, 320, [-.05, 1.1, -.57, .12], [[guide, ink.target, true],[values, ink.teal]],
        values.map((p,i) => [...p, i === values.length - 1 ? "ω=" + w : "", ink.teal]),
        {ticksX:[0,.25,.5,.75,1],ticksY:[-.5,-.25,0],equal:true,caption:"理论半圆与已计算测点"});
      const table = omega.map((step,i) => label(step + "  |  " + (i >= state.step ? "—" : f(magnitude(resp(step)),3) + "  |  " + f(phase(resp(step)),1) + "°"),
        475, 44 + i * 29, i === state.step - 1 ? ink.teal : "#544f62", "start")).join("");
      return render(svg("逐点描图", px + label("ω  |  A  |  φ",475,17,"#4c4364","start") + table), [["当前幅值",f(magnitude(q),3)],["当前相角",f(phase(q),1)+"°"]],
        "时间常数只改变点在半圆上的位置", "从首个点 ω=0 开始增加测点；对照虚线理论轨迹。");
    });
  }

  function phasor(kind) {
    return labSpec(["四种写法，同一个复数","两极点向量","闭环频率特性的两根向量"][kind], "source-analysis",
      kind === 0 ? [R("A","幅值 A",.25,2,.05,1), R("phi","相角 φ",-180,180,1,50,"°")] : [frequency(kind === 2 ? -.05 : 0)],
      state => {
        const w = state.logw === undefined ? 0 : 10 ** state.logw;
        const p = kind === 0 ? [state.A * Math.cos(state.phi * Math.PI / 180), state.A * Math.sin(state.phi * Math.PI / 180)] :
          kind === 1 ? [0,w] : openExample(w);
        const tail = kind === 1 ? -2 : -1, a = kind === 0 ? [0,0] : [tail,0];
        const response = kind === 0 ? p : kind === 1 ? quotient([1,0],complex(p,shift([p[0]*.5,p[1]*.5],1))) : quotient(p,shift(p,1));
        const span = Math.max(2.3, Math.abs(p[0]+.4)*1.2, Math.abs(p[1])*1.3);
        const yspan = span*.46;
        const guide = kind === 0 ? [[[p[0],0],p],ink.target,true] :
          kind === 1 ? [[[0,0],[0,span]],ink.target,true] :
          [sample(t => openExample(10 ** t), -2, 2),ink.target,true];
        const body = pane("fqphasor", 640, 320, [-span,span,-yspan,yspan],
          [guide,[[[0,0],p],ink.blue], ...(kind === 0 ? [] : [[[a,p],ink.orange]])],
          [[...p,kind===1?"jω":kind===0?"G(jω)":"A",ink.teal],[0,0,"O",ink.blue], ...(kind ? [[...a,kind===1?"−1/T":"P",ink.orange]] : [])],
          {equal:true,caption:kind===1?"s 平面 · T=0.5 s、K=1":kind===2?"开环频率响应平面":"复平面"});
        return render(svg("复数与相量",body),[["实部",f(response[0],3)],["虚部",f(response[1],3)],["幅值",f(magnitude(response),3)],["相角",f(phase(response),1)+"°"]],
          "按几何量计算",kind===0?"两个投影分别给实部与虚部，角度按所在象限读取。":kind===1?"橙向量先乘 T=0.5，再与蓝向量相乘，传递函数取其倒数。":"蓝向量是 L，橙向量是 1+L。闭环响应是蓝除以橙。");
      }, kind === 0 ? "phi" : "logw");
  }

  const openExample = w => quotient([1.2,0],complex([0,w],complex([1,w],[1,.25*w])));
  const openExamplePhase = w => -90-(Math.atan(w)+Math.atan(.25*w))*180/Math.PI;
  function complexResponse(kind, w, T, z) {
    const u = w * T;
    switch (kind) {
      case 0: return [1,0];
      case 1: return [0,-1/w];
      case 2: return [0,w];
      case 3: return quotient([1,0],[1,u]);
      case 4: return [1,u];
      case 5: return quotient([1,0],[1-u*u,2*z*u]);
      case 6: return [1-u*u,2*z*u];
      default: return [Math.cos(u),-Math.sin(u)];
    }
  }
  function mapping(mode) {
    const roots = [
      { zeros:[0,0], poles:[] },
      { zeros:[.42], poles:[] },
      { zeros:[-.62,.72], poles:[] },
      { zeros:[-.37,.52], poles:[] },
      { zeros:[-.32,.47,1.55], poles:[] },
      { zeros:[-.5], poles:[-.13,.59] }
    ];
    return labSpec(["平方映射","两向量之差","两因子乘积","圈内两零点","还有一个圈外零点","零极点混合"][mode], "source-analysis",
      [R("angle","顺时针走过",0,360,2,100,"°")], ({ angle }) => {
        const { zeros, poles } = roots[mode];
        const route = degrees => [Math.cos(-degrees*Math.PI/180), Math.sin(-degrees*Math.PI/180)];
        const image = s => {
          const product = roots => roots.reduce((total,v) => complex(total,shift(s,-v)),[1,0]);
          return quotient(product(zeros),product(poles));
        };
        const origin = route(angle), dest = image(origin);
        const paths = [sample(w => route(w),0,360,220),sample(w => image(route(w)),0,360,220)];
        const currentPaths = [sample(w => route(w),0,angle,140),sample(w => image(route(w)),0,angle,140)];
        const size = Math.max(1.25, Math.min(5, Math.max(...paths[1].flat().map(Math.abs))*1.08));
        const panels = [
          pane("fqs",330,320,[-1.75,1.75,-1.25,1.25],
            [[paths[0],ink.target,true],[currentPaths[0],ink.blue], ...zeros.map(x => [[[x,0],origin],ink.blue]),
              ...poles.map(x => [[[x,0],origin],ink.orange])],
            [[...origin,"s",ink.blue], ...Array.from(new Set(zeros),x => [x,0,mode===0?"双零点":"零",ink.blue]),
              ...poles.map(x=>[x,0,"极",ink.orange])], {equal:true,caption:"s 平面 · 顺时针围线"}),
          pane("fqimg",310,320,[-size,size,-size,size],
            [[paths[1],ink.target,true],[currentPaths[1],ink.teal]],
            [[0,0,"原点",ink.orange],[...dest,"F(s)",ink.teal]], {equal:true,caption:"F(s) 平面 · 像轨迹"})
        ];
        const Z = zeros.filter(x=>Math.abs(x)<1).length, P = poles.filter(x=>Math.abs(x)<1).length, N = P-Z;
        return render(svg("围线与复映射",panels[0]+'<g transform="translate(330 0)">'+panels[1]+"</g>"),
          [["围线内 Z",Z],["围线内 P",P],["走满一圈后 N",N]],
          "逆时针 N=P−Z", "灰线表示完整轨迹，有色部分显示已走过的路径。圈外点经过一周贡献为零。");
      }, "angle");
  }

  function bPanel(prefix, amp, arg, offset, marksA, marksP, extraA = [], extraP = []) {
    const xLow = -1, xHigh = 2, lx = sample(x=>x,xLow,xHigh,240);
    const band = (fun, extra) => {
      const values = lx.map(fun).concat(extra.flatMap(([series]) => series.map(([x,y])=>y)));
      return [Math.min(...values,0),Math.max(...values,0)];
    };
    const [amin,amax]=band(amp,extraA),[pmin,pmax]=band(arg,extraP);
    const xFmt = n => f(10**n,2);
    const xTicks = [-1,0,1,2];
    const grid = val => [[[offset,val[0]],[offset,val[1]]],ink.target,true];
    return pane(prefix+"a",640,168,[xLow,xHigh,amin-3,amax+3],[[lx.map(x=>[x,amp(x)]),ink.teal],...extraA,grid([amin-3,amax+3])],
      marksA,{ticksX:xTicks,xFmt,caption:"对数幅值 / dB"})+
      '<g transform="translate(0 168)">'+pane(prefix+"p",640,168,[xLow,xHigh,pmin-10,pmax+10],[[lx.map(x=>[x,arg(x)]),ink.teal],...extraP,grid([pmin-10,pmax+10])],
      marksP,{ticksX:xTicks,xFmt,caption:"相角 / ° · 横轴 ω / rad/s"})+"</g>";
  }
  function matchingViews(mode) {
    const labels = ["联动 Nyquist 与 Bode","比例增益水平线","顺序叠加转角","同幅异相","例 4-9 时延辨识","Nyquist 裕度","Bode 裕度"];
    const controls = mode === 1 ? [R("K","比例增益 K",.25,8,.05,4)] :
      mode === 2 ? [C("stage","已过转角",["低频直线","过 0.5","再过 2","再过 30"]),R("logw","lg ω",-1,2,.02,0)] :
      [R("logw","lg ω",-1,2,.02,-.06)];
    return labSpec(labels[mode],"source-analysis",controls,state=>{
      const l = state.logw ?? 0, w = 10**l;
      const K = mode===1 ? state.K : 1, stages = state.stage ?? 3;
      const ld = w => mode===0 ? complexResponse(3,w,1,.4) : mode===1 ? [K,0] :
        mode===3 ? [1,w] :
        mode===4 ? quotient(complex([10,0],[1,.5*w]),complex([0,w],complex([1,w],[1,.125*w]))) : openExample(w);
      const stageRules = [[.5,-20],[2,20],[30,-20]].slice(0,stages);
      const stageA = w => db(40)-20*Math.log10(w)+stageRules.reduce((a,[stop,slope]) => a+slope*Math.max(0,Math.log10(w/stop)),0);
      const exactPhase = w => -90+(Math.atan(.5*w)-Math.atan(2*w)-Math.atan(w/30))*180/Math.PI;
      const a = x => mode===2 ? stageA(10**x) : db(magnitude(ld(10**x)));
      const p = x => {
        const w = 10**x;
        return mode===2 ? exactPhase(w) : mode===4 ? -90+(Math.atan(.5*w)-Math.atan(w)-Math.atan(.125*w))*180/Math.PI :
          mode>=5 ? openExamplePhase(w) : phase(ld(w));
      };
      const span = [-1,2];
      const xs = sample(x=>x,...span,240);
      const wc = (()=>{let min=0,max=2;for(let i=0;i<35;i++){const mid=(min+max)/2;if(magnitude(openExample(mid))>1)min=mid;else max=mid;}return (min+max)/2;})();
      const pc = 180+openExamplePhase(wc), gm=1/magnitude(openExample(2));
      const q=ld(w), rows = mode===1 ? [["增益",f(K,2)],["幅值",f(a(l),2)+" dB"],["相位","0°"]] :
        mode>=5 ? [["ωc",f(wc,3)+" rad/s"],["γ",f(pc,1)+"°"],["ωg","2 rad/s"],["Kg",f(gm,2)+" 倍 · "+f(db(gm),1)+" dB"]] :
        [["ω",f(w,3)+" rad/s"],["当前幅值",f(a(l),2)+" dB"],["当前相角",f(p(l),1)+"°"]];
      const marksA = [[l,a(l),"当前",ink.teal]];
      const marksP = [[l,p(l),"当前",ink.teal]];
      const aExtra = mode===6?[[[[-1,0],[2,0]],ink.orange,true]]:[];
      const pExtra = mode===3 ? [[xs.map(x=>[x,-p(x)]),ink.orange,true]] :
        mode===4 ? [[xs.map(x=>[x,p(x)-.2*(10**x)*180/Math.PI]),ink.orange,true]] :
        mode===6 ? [[[[-1,-180],[2,-180]],ink.orange,true]] : [];
      if(mode===6) {
        marksA.push([Math.log10(wc),0,"ωc",ink.orange],[Math.log10(2),a(Math.log10(2)),"−12.4 dB",ink.orange]);
        marksP.push([Math.log10(wc),p(Math.log10(wc)),"−143.7°",ink.orange],[Math.log10(2),-180,"ωg",ink.orange]);
      }
      const bode = bPanel("fqb",a,p,l,marksA,marksP,aExtra,pExtra);
      let art;
      if(mode===0 || mode===5){
        const data = sample(x=>ld(10**x),-2,2,300);
        const range = mode===0 ? [-.2,1.12,-.57,.12] : [-1.6,.3,-1.2,1.2];
        const traces = [[data,ink.teal]];
        const points = [[...q,"当前 ω",ink.blue]];
        if(mode===5){
          traces.push([sample(t=>[Math.cos(t),Math.sin(t)],0,2*Math.PI),ink.target,true]);
          points.push([-1,0,"−1",ink.orange],[...openExample(wc),"ωc",ink.teal],[...openExample(2),"ωg",ink.violet]);
        }
        art = svg(labels[mode],pane("fqn",mode===0?460:640,320,range,traces,points,{equal:true,caption:"Nyquist · 复平面"}) +
          (mode===0?'<g transform="translate(460 0)">'+bode+"</g>":""),mode===0?"0 0 1100 336":"0 0 640 320");
      }else art=svg(labels[mode],bode,"0 0 640 336");
      const summaries = [
        "同一频点的复数、分贝和相角同步变化。","比例增益抬升或降低幅频水平线，相角保持零。",
        "渐近线按已加入的转角更新。相角始终展示完整系统的精确值。",
        "1+jω 与 1−jω 共用幅频图，橙线为右半平面零点相角。",
        "绿色为模型不带延迟的相角，橙线叠加 TD=0.2 s，幅频不变。",
        "标注点取单位圆和负实轴的交点；临界点是 −1。",
        "0 dB 与 −180° 两条基准线在各自图上确定穿越频率。"
      ];
      return render(art,rows,labels[mode],summaries[mode]);
    }, mode===1 ? "K" : "logw");
  }

  function closedExperiment(mode) {
    return labSpec(["γ 与 ζ","ωc 与 ts","四个闭环频域指标","闭环频域与阶跃"][mode], "source-analysis", [
      R("z","阻尼比 ζ",.12,.98,.01,.34),
      ...(mode===1 || mode===2 ? [R("wn","固有频率 ωn",.4,3,.05,1," rad/s")] : [])
    ], state=>{
      const z=state.z, wn=state.wn || 1, damp=Math.sqrt(1-z*z);
      const wc=wn*Math.sqrt(Math.sqrt(1+4*z**4)-2*z*z);
      const gamma=Math.atan(2*z*wn/wc)*180/Math.PI;
      const ts=4/(z*wn), overshoot=100*Math.exp(-Math.PI*z/damp);
      const wr=z<Math.SQRT1_2?wn*Math.sqrt(1-2*z*z):0;
      const mag=w=>1/Math.hypot(1-(w/wn)**2,2*z*w/wn), Mr=mag(wr);
      const wb=wn*Math.sqrt(1-2*z*z+Math.hypot(1-2*z*z,1));
      const wMax=wn*2.3, cMax=Math.max(1.45,Mr*1.12);
      const measures=[["γ",f(gamma,1)+"°"],["ωc",f(wc,3)],["ts 估算",f(ts,2)+" s"]];
      const read=[["M(0)","1.00"],["ωr",wr===0?"无非零峰":f(wr,3)],["Mr",f(Mr,3)],["ωb",f(wb,3)]];
      const bounds=[0,wMax,0,cMax];
      const magView=(width, height)=>pane("fqmag",width,height,bounds,
        [[sample(w=>[w,mag(w)],0,wMax,240),ink.teal],[[[0,Math.SQRT1_2],[wb,Math.SQRT1_2]],ink.target,true]],
        [[0,1,"M(0)",ink.blue],[wb,mag(wb),"ωb",ink.violet],...(wr>0?[[wr,Mr,"ωr、Mr",ink.orange]]:[])],
        {caption:"闭环幅频 · ω / rad/s"});
      let body;
      if(mode===0){
        const phaseAt = v=>Math.atan(2*v/Math.sqrt(Math.sqrt(1+4*v**4)-2*v*v))*180/Math.PI;
        body=pane("fqg",640,320,[0,1,0,85],[[sample(v=>[v,phaseAt(v)],0,1),ink.teal]],
          [[z,gamma,"当前 ζ 与 γ",ink.orange]],{caption:"标准二阶系统 · γ(ζ) / °"});
        measures.push(["阶跃超调",f(overshoot,1)+"%"]);
      }else if(mode===1){
        const c=4/z*Math.sqrt(Math.sqrt(1+4*z**4)-2*z*z), end=Math.max(3,wc*1.2);
        body=pane("fqts",640,320,[.22,end,0,c/.22*1.08],[[sample(w=>[w,c/w],.22,end),ink.teal]],
          [[wc,ts,"当前交点",ink.orange]],{caption:"固定 ζ 与 γ · 2% 调节时间 / s"});
      }else if (mode===2) body=magView(640,320);
      else{
        const timeEnd=Math.max(12,Math.min(25,ts*1.45)), step=t=>1-Math.exp(-z*wn*t)*Math.sin(wn*damp*t+Math.acos(z))/damp;
        body=magView(340,320)+'<g transform="translate(340 0)">'+pane("fqstep",300,320,[0,timeEnd,0,1.66],
          [[sample(t=>[t,step(t)],0,timeEnd,260),ink.blue],[[[0,1],[timeEnd,1]],ink.target,true]],
          [[Math.PI/(wn*damp),1+overshoot/100,"超调",ink.orange]],{caption:"单位阶跃 · t / s"})+"</g>";
        read.push(["阶跃超调",f(overshoot,1)+"%"]);
      }
      return render(svg("标准二阶性能指标",body),mode<2?measures:read,"适用同一标准二阶模型",mode===3?"阻尼可能消除谐振峰，同时阶跃仍有较小超调。":"拖动阻尼，区分幅值比例、相位与时间尺度。");
    }, "z");
  }
  function equalM() {
    const closed = w => { const q = openExample(w); return quotient(q,shift(q,1)); };
    const peak = .935321;
    return labSpec("等幅圆与谐振峰","source-analysis",
      [R("level","目标闭环幅值 M",.65,1.9,.01,1.36), C("preset","对照",["手动 M","峰值相切"])],
      ({ level,preset })=>{
        const Mr=magnitude(closed(peak)), m=preset?Mr:level, v=m*m-1;
        const circle=Math.abs(v)<1e-9?[[-.5,-2],[-.5,2]]:sample(t=>[-m*m/v+m/Math.abs(v)*Math.cos(t),m/Math.abs(v)*Math.sin(t)],0,2*Math.PI,260);
        const root=(lo,hi)=>{
          const sign=Math.sign(magnitude(closed(lo))-m);
          for(let i=0;i<36;i++){
            const mid=(lo+hi)/2;
            if(Math.sign(magnitude(closed(mid))-m)===sign)lo=mid;
            else hi=mid;
          }
          return (lo+hi)/2;
        };
        const hits=preset?[peak]:m>Mr?[]:m>1?[root(.00001,peak),root(peak,20)]:[root(peak,20)];
        const path=sample(x=>openExample(10**x),-2,2,260);
        const graph=pane("fqeqm",640,320,[-1.7,1,-1.4,1.4],[[path,ink.teal],[circle,ink.orange,true]],
          [[-1,0,"−1",ink.blue],...hits.map(w=>[...openExample(w),f(w,3)+" rad/s",ink.orange])],{equal:true,caption:"绿色 · 开环轨迹    橙色 · 等 M 轨迹"});
        return render(svg("等 M 圆",graph),[["M",f(m,4)],["Mr",f(Mr,3)],["ωr",f(peak,3)+" rad/s"],
          ["交点频率",hits.length?hits.map(w=>f(w,3)).join("、"):"无"]],preset?"等 M 线在峰值处相切":"固定闭环幅值看复平面上的同值点","拖动 M 或切到峰值，比较开环轨迹与等值线的交点。");
      },"level");
  }

  function responseRatio() {
    return labSpec("从输入与输出相量取比","source-analysis",
      [R("gain","幅值比",.25,2,.05,.75),R("lag","输出相位差 (相对输入)",-165,165,5,-40,"°")],
      ({gain,lag})=>{
        const r=[Math.cos(Math.PI/6),Math.sin(Math.PI/6)], phi=(30+lag)*Math.PI/180;
        const c=[gain*Math.cos(phi),gain*Math.sin(phi)];
        const g=quotient(c,r);
        const plane=pane("fqratio",640,320,[-2.2,2.2,-2.05,2.05],
          [[[[0,0],r],ink.blue],[[[0,0],c],ink.teal]],
          [[...r,"R(jω)",ink.blue],[...c,"C(jω)",ink.teal]],{equal:true,caption:"参考输入相角 30° · 输入 R、输出 C"});
        return render(svg("输入与输出的稳态相量",plane),
          [["|C|/|R|",f(magnitude(g),3)],["相角差",f(phase(g),1)+"°"],["复数比",f(g[0],3)+(g[1]>=0?"＋j":"−j")+f(Math.abs(g[1]),3)]],
          "C(jω) ÷ R(jω)","拖幅值比和相位差。相角从输入蓝向量量到输出绿向量。");
      },"lag");
  }

  function typeTwoGraph() {
    return labSpec("沿低频近似线寻找 0 dB 交点","source-analysis",
      [R("logw","lg ω",-1,1,.02,0)],({logw})=>{
        const gain=8, a=x=>db(gain)-40*x;
        const graph=pane("fqtype2",640,320,[-1,1,-25,65],
          [[sample(x=>[x,a(x)],-1,1,120),ink.teal],[[[-1,0],[1,0]],ink.target,true]],
          [[logw,a(logw),"当前频率",ink.orange]],{caption:"低频渐近线 · Kₐ=8 · −40 dB/dec",xFmt:x=>f(10**x,2)});
        return render(svg("II 型低频渐近线",graph),[["读图频率",f(10**logw,2)+" rad/s"],["低频渐近值",f(a(logw),2)+" dB"]],
          "找到横轴交点","横轴每格等宽，但按频率的对数分度。");
      },"logw");
  }

  function threeBands() {
    const table=[
      ["低频段","型别与增益决定低频渐近线，联系闭环稳态误差。"],
      ["中频段","在中频读取 ωc 与 γ，查看 0 dB 附近的穿越斜率。"],
      ["高频段","开环增益越低，经互补灵敏度通道进入输出的高频测量噪声通常越小。"]
    ];
    return labSpec("在同一条 Bode 曲线上切换频段","source-analysis",
      [C("region","读图区间",table.map(row=>row[0]))],({region})=>{
        const levels=[[-2,52],[-.6,24],[.08,11],[.8,-3.4],[1.25,-21.4],[2,-66.4]];
        const sections=[levels.slice(0,2),levels.slice(1,4),levels.slice(3)];
        const graph=pane("fqband",640,320,[-2,2,-75,60],[[levels,ink.target], [sections[region],ink.teal],
          [[[-2,0],[2,0]],ink.orange,true]],[],{caption:"示意开环幅频 · 横轴 ω / rad/s",xFmt:x=>f(10**x,2)});
        return render(svg("开环 Bode 曲线的三个频段",graph),[],...table[region]);
      });
  }

  function phaseSlope(geometry) {
    return labSpec(geometry ? "共轭极点决定相角变化" : "看 u=1 处的切线斜率","source-analysis",[
      R("z","阻尼比 ζ",.05,.98,.01,.35), R("u","归一化频率 u",0,2,.01,1)
    ],({z,u})=>{
      const toDeg = 180/Math.PI;
      const phi = u => -Math.atan2(2*z*u,1-u*u)*toDeg;
      const slope = -1/z, tangent = u => -90 + slope*toDeg*(u-1);
      let art;
      if(geometry){
        const b=Math.sqrt(1-z*z), dq=[0,u], p=[-z,b], q=[-z,-b];
        art=pane("fqpair",640,320,[-1.7,.6,-1.15,2.05],
          [[[[p[0],p[1]],dq],ink.teal],[[[q[0],q[1]],dq],ink.orange]],
          [[...p,"p₁",ink.teal],[...q,"p₂",ink.orange],[...dq,"jω",ink.blue]],
          {equal:true,caption:"固定 ωn=1 · 在 s 平面读取两根矢量"});
      }else{
        art=pane("fqtangent",640,320,[0,2,-180,0],
          [[sample(x=>[x,phi(x)],0,2,240),ink.teal],[[[0,tangent(0)],[2,tangent(2)]],ink.orange,true]],
          [[u,phi(u),"当前 u",ink.blue],[1,-90,"中心切点",ink.orange]],{caption:"相频特性 φ / ° · 归一化频率 u"});
      }
      return render(svg(geometry?"共轭极点矢量":"相频与中心切线",art),[["u",f(u,2)],["当前相位",f(phi(u),1)+"°"],
        ["中心斜率",f(slope,2)+" rad / u"]],"ζ 越小，中心附近相位变化越集中",geometry?"橙、绿两根极点矢量的相角求和后取负。":"橙色切线固定经过 (1,−90°)，显示 dφ/du=−1/ζ（弧度）。");
    },"u");
  }

  function windingCases(shiftOnly) {
    const options=shiftOnly?["F 平面","开环 L 平面"]:["不包围","顺时针包围","经过临界点"];
    return labSpec(shiftOnly?"平移曲线并跟踪计数中心":"临界点的三种相对位置","source-analysis",[
      C("kind",shiftOnly?"坐标平面":"观察情形",options),R("angle","已走角度",0,360,2,140,"°")
    ],({kind,angle})=>{
      const center=shiftOnly?.37-kind:[-.18,-.8,-.37][kind], radius=.63, crit=shiftOnly?-kind:-1;
      const route=x=>[center+radius*Math.cos(-x*Math.PI/180),radius*Math.sin(-x*Math.PI/180)];
      const all=sample(route,0,360,200), part=sample(route,0,angle,150);
      const graph=pane("fqwinding",640,320,[-1.7,1.12,-.8,.8],[[all,ink.target,true],[part,ink.teal]],
        [[crit,0,crit===0?"原点":"−1",ink.orange],[...route(angle),"轨迹动点",ink.teal]],
        {equal:true,caption:shiftOnly?"概念示意 · 计数中心随曲线平移":"示意轨迹 · 开环无右半平面极点"});
      const n=shiftOnly||kind===1?-1:kind===0?0:"边界";
      const rows=[["逆时针记正 N",n],["计数点",crit]];
      if(!shiftOnly)rows.push(["P","0"],["Z",kind===2?"另查虚轴临界根":-n]);
      return render(svg("闭合轨迹包围计数",graph),rows,options[kind],
        shiftOnly?"比较两个坐标平面，曲线和计数中心都平移了 1，绕行净次数不变。":"图示按顺时针走曲线，绕临界点记为负圈数；轨迹通过该点时用边界条件判断。");
    },"angle");
  }

  const labs = {
    5: harmonics(false), 7: harmonics(true),
    8: sinLab(0), 9: sinLab(1), 10: sinLab(0), 11: sinLab(2), 12: sinLab(3),
    13: responseRatio(), 14: phasor(0), 15: matchingViews(0),
    16: (()=>{const base=polar(undefined,{T:1,z:.4},["T","z"]);return {...base,
      title:"比较三根典型极坐标轨迹",controls:[C("kind","典型环节",["比例","积分","微分"]),frequency()]};})(),
    17: polarSampler(), 18: polar(3,{},["z"],"惯性下半圆扫频"),
    19: polar(4,{T:.5},["T","z"],"一阶零点的竖直射线"),
    20: polar(5,{T:1,z:.4},["T","z"],"振荡环节的三个关键点"),
    21: polar(5,{T:1},["T"],"按阻尼观察谐振区间"),
    22: closedExperiment(2), 23: polar(5,{T:1},["T"],"拖动阻尼观察轨迹"),
    24: (()=>{const base=polar(undefined,{T:1,z:.4},["kind","T","z"]);return {...base,
      title:"二阶微分与纯延迟",controls:[C("variant","环节",["二阶微分","纯延迟"]),frequency()],
      draw:state=>base.draw({...state,kind:6+state.variant})};})(),
    25: polar(undefined,{},[],"八种极坐标图"), 26: phasor(1),
    29: fixed(1,{example:1,kind:3,T:1,z:.4},["example","kind","T","z"],"例 4-4 三步绘法"),
    32: matchingViews(0), 33: matchingViews(1), 34: matchingViews(1),
    35: (()=>{const base=bode(undefined,{T:1,z:.4},["kind","T","z"]);return {...base,
      title:"积分与微分的相反斜率",controls:[C("variant","环节",["积分","微分"]),frequency()],
      draw:state=>base.draw({...state,kind:1+state.variant})};})(),
    36: bode(3,{T:.5},["T","z"],"惯性精确线与渐近线"), 37: bode(3,{},["z"],"拖 T 移动转角"),
    38: bode(3,{T:1},["T","z"],"−3 dB 修正与 −45°"),
    39: bode(4,{T:.5},["T","z"],"一阶分子的 Bode 图"),
    40: bode(5,{T:.5,z:.2},["T","z"],"二阶振荡例题的渐近线"),
    41: bode(5,{T:1},["T"],"拖 ζ 比较精确曲线"),
    42: (()=>{const base=bode(undefined,{T:1,z:.4},["kind","T","z"]);return {...base,
      title:"二阶微分与时延的 Bode 图",controls:[C("variant","环节",["二阶微分","纯延迟"]),frequency()],
      draw:state=>base.draw({...state,kind:6+state.variant})};})(),
    43: bode(undefined,{},[],"比较典型 Bode 曲线"),
    45: fixed(3,{mode:0},["mode"],"例 4-5 逐环节合成"),
    46: matchingViews(2), 47: fixed(3,{mode:1},["mode"],"例 4-6 标准式与因子合成"),
    48: fixed(3,{mode:1,stage:5},["mode","stage"],"例 4-6 精确幅相描点"),
    49: fixed(4,{view:0},["view"],"低频幅值、型别和稳态误差"),
    50: typeTwoGraph(),
    52: matchingViews(4), 54: matchingViews(3), 57: phaseSlope(false), 58: phaseSlope(true),
    61: mapping(0), 62: mapping(1), 63: mapping(2), 64: mapping(3), 65: mapping(4), 66: mapping(5), 67: mapping(5), 69: windingCases(true), 71: windingCases(false),
    70: fixed(6,{mode:0,gain:1},["mode","gain"],"四段 Nyquist 围线各段映射"),
    72: fixed(6,{mode:0,gain:1},["mode","gain"],"例 4-10 四段映射"),
    73: fixed(6,{mode:0,gain:1},["mode","gain"],"例 4-10 闭合图"),
    74: fixed(6,{mode:1,gain:2},["mode","gain"],"正频、镜像与补弧"),
    75: fixed(6,{mode:1,gain:2},["mode","gain"],"例 4-12 三型系统"),
    76: fixed(6,{mode:0,gain:1},["mode","gain"],"正负频率的共轭镜像"),
    77: fixed(6,{mode:1},["mode"],"K 改变引起条件稳定"),
    78: matchingViews(5), 79: matchingViews(5), 80: matchingViews(6),
    83: phasor(2), 84: fixed(8,{view:0,N:-60},["view","N"],"等 M 圆与退化直线"),
    85: equalM(), 86: fixed(8,{view:1,M:3},["view","M"],"等 N 圆的相角分支"),
    87: fixed(8,{view:2},["view"],"Nichols 网格和闭环等值"),
    88: closedExperiment(0), 89: closedExperiment(1), 90: closedExperiment(2), 91: closedExperiment(3),
    93: threeBands(), 94: matchingViews(6)
  };

  const quizzes = {
    7: { prompt:"关于时域与频域，哪些说法正确？",
      options:["两者从不同角度分析信号","时域描述信号随时间变化","频域用数学坐标描述频率特征","只有正弦波在频域存在"],
      answers:[0,1,2], feedback:"正弦和余弦是表示的基，方波等非正弦信号也有频域表示。" },
    50: { prompt:"II 型系统的 Ka=8，其低频渐近线与 0 dB 交点的频率是多少？",
      options:["8 rad/s","64 rad/s","约 2.8 rad/s","无法确定"],answers:[2],feedback:"20lg8−40lgω=0，所以 ω=√8≈2.83 rad/s。"},
    76: { prompt:"给出正频率支路，怎样得到全频段 Nyquist 曲线？",
      options:["补实轴镜像；若有 ν 个原点积分因子，再顺时针补 180°ν 的无穷远弧","补虚轴镜像即可","以原点为中心作中心对称","正频段已闭合"],
      answers:[0],feedback:"实系数系统的负频率响应与正频率响应互为共轭，原点小半圆的像补上低频断口。" },
    94: { prompt:"分别最能体现标准二阶闭环的超调和调节时间尺度的开环指标是？",
      options:["γ 和 ωc","Kg 和 ωg","K 和系统型别 ν","各转角和对应斜率"],
      answers:[0],feedback:"该二阶关系中 γ 对应阻尼比和超调；ωc 提供时间尺度，2% 调节时间还依赖 γ。" }
  };

  const points = Object.fromEntries(specimens.trim().split(/\r?\n/).map(line=>{
    const [number,...sections]=line.split(/\|(?=[^|~]+~)/);
    return [number,sections.map(section=>section.split("~"))];
  }));
  points[48].push(["计算点（ω / dB / °）", [
    "0.5 / 24.2 / −110.5", "1 / 20.0 / −143.1", "1.4 / 16.8 / −188.3",
    "2 / 7.1 / −236.3", "3 / −5.8 / −258.1", "10 / −39.7 / −269.6"
  ]]);
  source[67].unshift("N=P-Z");
  source[71] = ["Z=P-N"];
  window.SourcePolishCh4 ??= {};
  for (const line of intent.trim().split(/\r?\n/)) {
    const [number,lead,objective] = line.split("|");
    window.SourcePolishCh4[number] = {
      objective, lead, sections:points[number], math:source[number] ?? [],
      ...(labs[number] ? {lab:labs[number]} : {}),
      ...(quizzes[number] ? {quiz:quizzes[number]} : {})
    };
  }
})();
