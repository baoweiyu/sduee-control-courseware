"use strict";
(() => {
  const W=IntroWidgets,M=IntroModels,{range:R,choices:C,readouts,plot,note,ink,escape}=W;
  const span=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
  const fmt=(n,d=3)=>Number(n.toFixed(d)).toString();
  const vars=(...entries)=>readouts(entries.map(([k,v])=>[k,typeof v==="number"?fmt(v):v]));
  const detail=(h,t)=>'<section class="text-block"><h3>'+escape(h)+'</h3><p>'+escape(t)+'</p></section>';
  const traces=(time,axes,...rows)=>plot(rows.map(([series,key,label,color,dash])=>({series,key,label,color,dash})),time,axes);
  const row=(evaluate)=>Array.from({length:M.steps+1},(_,i)=>{const t=i*M.dt;return {t,...evaluate(t)};});
  const stage=(label,body)=>'<svg viewBox="0 0 660 255" role="img" aria-label="'+escape(label)+'"><rect x="4" y="3" width="652" height="246" rx="13" fill="#f0f6fc"/>'+body+'</svg>';
  const line=(x0,y0,x1,y1,color="#376b8e",width=3)=>'<path d="M'+x0+' '+y0+'L'+x1+' '+y1+'" fill="none" stroke="'+color+'" stroke-width="'+width+'" stroke-linecap="round"/>';
  const txt=(x,y,text,size=19)=>'<text x="'+x+'" y="'+y+'" font-size="'+size+'" fill="#173955" font-weight="650" text-anchor="middle">'+escape(text)+'</text>';
  const block=(x,y,w,h,label,active=false)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="8" fill="'+(active?"#dcefe8":"#fff")+'" stroke="#7fa9c5" stroke-width="1.4"/>'+txt(x+w/2,y+h/2+6,label);
  function chain(nodes,active=-1){
    const w=nodes.length>3?100:132, delta=(620-w)/(nodes.length-1), y=104,h=49;
    return stage(nodes.join(" → "),nodes.map((n,i)=>{
      const x=20+delta*i;
      return block(x,y,w,h,n,i===active)+(i<nodes.length-1?line(x+w,129,x+delta,129)+txt(x+delta-10,133,"›",21):"");
    }).join(""));
  }
  function step(t,tau){
    return 1-Math.exp(-t/tau);
  }
  function secondOrder(t,wn,z){
    if(Math.abs(z-1)<1e-7)return 1-(1+wn*t)*Math.exp(-wn*t);
    const a=Math.sqrt(Math.abs(z*z-1));
    if(z<1)return 1-Math.exp(-wn*z*t)*(Math.cos(wn*a*t)+z/a*Math.sin(wn*a*t));
    const r1=wn*(-z+a),r2=wn*(-z-a);
    return 1+(r2*Math.exp(r1*t)-r1*Math.exp(r2*t))/(r1-r2);
  }
  function curves(samples, min, max, curves){
    const y=v=>217-(v-min)*175/(max-min);
    return stage("随参数变化的曲线",line(43,219,619,219)+line(43,34,43,219)+curves.map(([key,color])=>{
      const d=samples.map((v,i)=>(i?"L":"M")+fmt(43+i*575/(samples.length-1),1)+" "+fmt(y(v[key]),1)).join("");
      return '<path d="'+d+'" stroke="'+color+'" stroke-width="3.5" stroke-linecap="round" fill="none"/>';
    }).join(""));
  }
  const groups=[
    {
      title:"从元件和受力建立运动方程",source:span(1,8),
      points:[
        ["建模四步","确定系统边界及输入输出，依据物理定律列元件与连接方程，消去中间量，整理为标准微分方程。机理分析和实验辨识是获得数学模型的两条常用途径。"],
        ["三个物理原型","RLC 用基尔霍夫电压定律，弹簧质量阻尼用牛顿第二定律，他励直流电机联立电枢电压平衡与轴的转矩平衡。"],
        ["共同形式","不同系统可以得到同型常系数线性微分方程。再分别使用传递函数、框图或信号流图表达。初始条件仍用于求实际响应。"]
      ],
      lab:{title:"同型二阶装置",visual:"mechanism",chartTitle:"阶跃输入与装置运动",controls:[C("kind","对象",["RLC 电路","弹簧装置","直流电机"],1),R("damp","阻尼比",.12,1.7,.02,.48),R("wn","固有频率",.5,3,.05,1.35," rad/s")],draggable:"damp",
        draw(s){
          const kinds=[["电源电压","串联 RLC","电容电压"],["外力","质量与弹簧","位移"],["电枢电压","直流电动机","转速"]];
          const names=kinds[s.kind], y=secondOrder(s.time,s.wn,s.damp), data=row(t=>({u:1,y:secondOrder(t,s.wn,s.damp)}));
          const x=190+Math.max(0,Math.min(1.8,y))*153;
          const diagram=s.kind===1 ? stage("弹簧、阻尼和质量块",line(62,188,602,188)+line(72,73,72,188)+
            '<path d="M72 122L93 122'+Array.from({length:12},(_,i)=>"L"+fmt(93+(x-93)*(i+1)/12,1)+" "+(i%2?114:130)).join("")+'" fill="none" stroke="#427290" stroke-width="3"/>'+
            line(72,153,x,153,"#927049",5)+block(x,101,99,73,"质量 m",true)+txt(Math.min(x+52,545),219,"位移 "+fmt(y))) : chain(names,1);
          const art=s.kind===1?'<div class="mechanism-figure"><img src="../../../assets/classroom/spring-bench.webp" alt="实物示意：带弹簧、质量块和阻尼器的试验台">'+diagram+'</div>':diagram;
          return {art,chart:traces(s.time,{high:1.8,unit:"相对值"},[data,"u","输入",ink.target,true],[data,"y",names[2],ink.teal]),
            readouts:vars(["被控量",y],["一次项系数",2*s.damp*s.wn],["常数项系数",s.wn**2]),
            detail:detail("归一化方程","y″ + 2ζωₙ y′ + ωₙ² y = ωₙ²u。示意系数可改变，物理对象仍各自遵循原来的定律。"),
            note:note("拖动阻尼，比较同一微分方程怎样刻画不同装置。")};
        }}
    },
    {
      title:"拉氏变换、初值与响应分解",source:span(9,14),
      points:[
        ["运算规则","L{f(t)} = ∫₀∞ f(t)e⁻ˢᵗdt。阶跃、斜坡与指数在 s 域分别对应 1/s、1/s² 与 1/(s+a)。微分会带来初始值，积分、平移与卷积也有各自规则。"],
        ["反变换","先解出代数式，再作部分分式分解。重复极点系数使用 dʲ/dsʲ，其中 j 是求导阶数。"],
        ["解的组成","总响应可分为零输入和零状态响应。暂态随稳定系统的模态衰减，稳态由持续输入和系统共同决定。这两种分解的划分依据不同。"]
      ],
      lab:{title:"从 Y(s) 还原时域解",chartTitle:"零输入、零状态与总响应",controls:[R("a","衰减系数 a",.15,2,.05,.7),R("initial","初值 y(0)",0,2,.05,.55),R("input","阶跃幅值",0,2,.05,1)],draggable:"initial",
        draw(s){
          const data=row(t=>{const e=Math.exp(-s.a*t),natural=s.initial*e,forced=s.input*(1-e);return {natural,forced,y:natural+forced};});
          const p=M.at(data,s.time);
          return {art:chain(["微分方程","s 域代数式","部分分式","时域解"],2),chart:traces(s.time,{high:2.1,unit:"相对值"},[data,"natural","零输入",ink.orange],[data,"forced","零状态",ink.blue],[data,"y","总响应",ink.teal]),
            readouts:vars(["y(0)",s.initial],["零输入",p.natural],["当前 y",p.y]),
            detail:detail("Y(s)","Y(s) = y(0)/(s+a) + aU/[s(s+a)]。零输入分量携带初值，零状态分量来自阶跃 U。"),
            note:note("把输入幅值拖到零，只剩初值的自然响应。")};
        }}
    },
    {
      title:"在工作点附近把曲线换成切线",source:[15],
      points:[["工作点","选定平衡附近的工作点 x₀，令 Δx=x−x₀。输出增量的一阶近似为 Δy≈f′(x₀)Δx。"],["适用范围","忽略二阶及更高次项，离工作点远时误差通常增大。换工作点会改变局部增量模型。"]],
      lab:{title:"非线性曲线、切线与预测偏差",timed:false,controls:[R("x","工作点 x₀",-1.2,1.2,.05,.45),R("dx","输入增量 Δx",-.75,.75,.05,.35)],draggable:"x",
        draw(s){
          const f=x=>x*x+.19*x+.15,m=2*s.x+.19, x=s.x+s.dx, tangent=z=>f(s.x)+m*(z-s.x);
          const items=Array.from({length:101},(_,i)=>{const q=-2+i*.04;return {true:f(q),tangent:tangent(q)};});
          return {art:curves(items,-4,5,[["true",ink.teal],["tangent",ink.orange]]),readouts:vars(["局部斜率",m],["实值",f(x)],["线性化误差",f(x)-tangent(x)]),
            detail:detail("青线：f(x)   橙线：工作点切线","切点上的值与斜率相同。本例二次项的误差恰为 Δx²。"),note:note("拖动工作点，再把增量缩小，看近似误差怎样减小。")};
        }}
    },
    {
      title:"传递函数、极点与零点",source:[...span(16,20),24],
      points:[["定义和条件","零初始条件下，线性时不变系统的传递函数是输出与输入的拉氏变换之比。它与所选输入输出以及系统参数有关。"],["两种形式","由微分方程变换得到分子分母多项式形式，也可写成零极点增益形式。分子根是零点，分母根是极点。"],["表征范围","相同传递函数可来自不同物理系统。稳定性和响应的推理要交代是否有极零消去与内部模态。"]],
      lab:{title:"调零点、极点和增益",chartTitle:"零初值阶跃响应",controls:[R("tau","极点时间常数",.4,3,.05,1.3," s"),R("zero","零点时间常数",0,2.5,.05,.6," s"),R("gain","静态增益",.3,2,.05,1)],draggable:"zero",
        draw(s){
          const data=row(t=>({y:s.gain*(1+(s.zero/s.tau-1)*Math.exp(-t/s.tau)),u:1}));
          const p=M.at(data,s.time);
          return {art:chain(["输入 U(s)","G(s)","输出 Y(s)"],1),chart:traces(s.time,{minSpan:.4,unit:"相对值"},[data,"u","输入",ink.target,true],[data,"y","输出",ink.teal]),
            readouts:vars(["极点",-1/s.tau],["零点",s.zero>0?fmt(-1/s.zero):"无"],["当前 y",p.y]),
            detail:detail("G(s) = K(1+Tz·s)/(1+T·s)","当 Tz = T 时，输入输出模型化为比例环节。若分子分母同阶，允许输出在阶跃输入处出现直接项。"),
            note:note("拖动零点靠近极点，观察可见瞬态如何缩小。")};
        }}
    },
    {
      title:"六种典型环节对相同正弦的作用",source:span(21,23),
      points:[["比例、惯性和积分","比例 K 仅改变幅值。惯性 K/(1+Ts) 带来滞后及高频衰减。积分 K/s 对零初值积分，对正弦输入相位落后 90°。"],["振荡、微分和延迟","欠阻尼二阶环节可出现振荡。理想微分 Ks 加强高频，工程可用带滤波近似。纯延迟 e⁻ˢτ 不改变正弦稳态幅值，相位滞后 ωτ。"]],
      lab:{title:"选择同一输入下的典型环节",chartTitle:"正弦输入与特解",controls:[C("kind","环节",["比例","惯性","积分","振荡","微分","延迟"]),R("omega","角频率",.55,3,.05,1.2," rad/s"),R("tau","时间参数",.26,2,.02,.8," s")],draggable:"omega",
        draw(s){
          const w=s.omega,T=s.tau,l=w*T,z=.55;
          const [[A,P],name]=[[[1,0],"比例"],[[1/Math.hypot(1,l),-Math.atan(l)],"惯性"],[[1/w,-Math.PI/2],"积分"],
            [[1/Math.hypot(1-l*l,2*z*l),-Math.atan2(2*z*l,1-l*l)],"振荡"],[[w,Math.PI/2],"微分"],[[1,-l],"延迟"]][s.kind];
          const data=row(t=>({u:Math.sin(w*t),y:A*Math.sin(w*t+P)})),cap=Math.max(1.15,A*1.12);
          return {art:chain(["正弦输入",name+"环节","响应"],1),chart:traces(s.time,{low:-cap,high:cap,unit:"相对值"},[data,"u","输入",ink.target,true],[data,"y","输出",ink.teal]),
            readouts:vars(["幅值比",A],["相位差",fmt(P*180/Math.PI,1)+"°"]),
            detail:detail("观察口径","比较选定频率的正弦特解。积分环节的常量项取零，惯性及振荡环节的起始暂态省略。"),
            note:note("调高频率，比较惯性与理想微分对高频的不同作用。")};
        }}
    },
    {
      title:"从 RLC、运放与测速系统求 G(s)",source:span(25,28),
      points:[["RLC","复阻抗法在零初值下用 R、Ls、1/(Cs) 代替元件，按端口选取输出并用分压比得到传递函数。"],["反相运放","理想负反馈运放输入电流为零，两输入端电压近似相等。输入端为 R₁，反馈为 R₂ 与 C 并联时，G(s)=−(R₂/R₁)/(1+R₂Cs)。"],["测速闭环","把放大、电机、测速元件逐一建模，明确输入、输出和反馈极性。串联相乘，负反馈等效的分母带 1+GH。"]],
      lab:{title:"改元件参数后看端口响应",chartTitle:"三种电工装置的阶跃响应",controls:[C("example","对象",["RLC 电容输出","反相运放","测速闭环"]),R("res","电阻 / 反馈尺度",.3,3,.05,1.2),R("gain","放大倍数",.4,2.5,.05,1.05)],draggable:"res",
        draw(s){
          const names=["RLC","反相运放","测速闭环"], L=1,Cv=.5,T=s.res*Cv,A=s.gain, wn=1/Math.sqrt(L*Cv);
          const dc=[1,-A,s.gain/(1+s.gain*s.res)][s.example];
          const data=row(t=>({y:s.example===0?secondOrder(t,wn,s.res*.5*Math.sqrt(Cv/L)):s.example===1?dc*step(t,T):dc*step(t,1.4/(1+s.gain*s.res))}));
          return {art:chain(["输入",names[s.example],"输出"],1),chart:traces(s.time,{low:Math.min(-.1,dc*1.15),high:1.8,unit:"相对值"},[data,"y","端口输出",ink.teal]),
            readouts:vars(["直流增益",dc],["当前输出",M.at(data,s.time).y]),
            detail:detail("输出有方向",s.example===1?"反相输出为负。变化快慢由反馈阻容决定。":s.example===0?"同一串联电路在不同元件取输出，传递函数会随之改变。":"这组尺度下反馈既影响低频增益，也影响等效时间常数。"),note:note("调整参数，并比较波形的方向、幅值和速度。")};
        }}
    },
    {
      title:"用成组运算读方框图",source:[...span(29,32),39],
      points:[["四种符号","信号线给方向与变量；方框表输入输出比；相加点作代数和；分支点复制同一信号。一般先列各要素方程再连成图。"],["三类合并","串联的传递函数相乘，并联按符号相加；负反馈 G/(1+GH)，正反馈 G/(1−GH)。两种结构等效要求所关心的输入输出关系相同。"],["闭环入口","参考和扰动同时存在时用叠加；每个入口的等效分子取决于信号注入位置。"]],
      lab:{title:"拖动环节增益并核对等效值",timed:false,controls:[C("topology","连接",["串联","并联","负反馈"]),R("a","环节 G",.1,3,.05,1.2),R("b","环节 H",.1,3,.05,.6)],draggable:"a",
        draw(s){
          const expressions=["G × H","G + H","G / (1 + GH)"],eq=[s.a*s.b,s.a+s.b,s.a/(1+s.a*s.b)][s.topology];
          const G="G = "+fmt(s.a),H="H = "+fmt(s.b),x="输入",y="输出";
          const wires=(...segments)=>segments.map(p=>line(...p)).join("");
          const parallel=()=>stage("并联方框图",wires([80,128,155,128],[155,75,155,180],[155,75,243,75],[397,75,490,75],[155,180,243,180],[397,180,490,180],[490,75,490,180],[490,128,582,128])+block(243,52,154,46,G,true)+block(243,157,154,46,H,true)+
            '<circle cx="490" cy="128" r="16" fill="#fff" stroke="#376b8e" stroke-width="3"/>'+txt(490,134,"+",22)+txt(65,112,x)+txt(598,112,y)+txt(568,133,"›",22));
          const feedback=()=>stage("负反馈方框图",wires([80,85,565,85],[518,85,518,186],[518,186,397,186],[243,186,160,186],[160,186,160,85])+block(243,61,154,48,G,true)+block(243,162,154,48,H)+
            '<circle cx="160" cy="85" r="15" fill="#fff" stroke="#376b8e" stroke-width="3"/>'+txt(160,92,"∑")+txt(131,72,"+",15)+txt(178,128,"−",17)+txt(65,68,x)+txt(592,68,y)+txt(552,89,"›",22)+txt(210,190,"‹",22));
          const art=s.topology===0?chain([x,G,H,y],2):s.topology===1?parallel():feedback();
          return {art,
            readouts:vars(["等效增益",eq],["标准式",expressions[s.topology]]),
            detail:detail("本实验取静态增益","传递函数也按同样代数规则组合。实际化简时要检查正负号和支路连接位置。"),
            note:note("固定两环节参数，切换连接结构，比较等效输入输出。")};
        }}
    },
    {
      title:"移动相加点和分支点",source:span(33,36),
      points:[["相加点","跨方框移动时让被移动的旁路乘 G 或 1/G，选择依据是移动前后的每项系数一致。"],["分支点","移动后仍应从支路取出原来的信号。由框前移到框后时支路乘 1/G，反向移动时乘 G。"],["复杂图","向同类点移动可简化拓扑，但不越过未经处理的异类节点。交叉反馈可用作用分解或逐式消元，框图等效要保持各输入输出作用。"]],
      lab:{title:"前后移动时旁路补一个什么块",timed:false,controls:[C("node","节点",["相加点","分支点"]),C("direction","方向",["框前 → 框后","框后 → 框前"]),R("gain","环节 G",.2,4,.05,1.7),R("x","主通道信号",.2,3,.05,1)],draggable:"gain",
        draw(s){
          const multiply=s.node===s.direction,K=multiply?s.gain:1/s.gain;
          const a=s.node===0?(s.direction===0?s.gain*(s.x+1):s.gain*s.x+1):(s.direction===0?s.x:s.gain*s.x);
          const b=s.node===0?(s.direction===0?s.gain*s.x+K:s.gain*(s.x+K)):(s.direction===0?s.gain*s.x*K:s.x*K);
          return {art:chain([s.node?"分支":"相加","G = "+fmt(s.gain),multiply?"补 G":"补 1/G","核对信号"],2),
            readouts:vars(["补偿",K],["移动前",a],["移动后",b]),
            detail:detail("判断规则","先写移动前的信号表达式，再写移动后的表达式，两式必须得到同一结果。示意中旁路输入固定为 1。"),
            note:note("拖动 G 后两边仍相等，才说明移动规则用对了。")};
        }}
    },
    {
      title:"按依赖关系化简双回路与 RC 网络",source:[37,38],
      points:[["例 2-10 化简顺序","G₂G₃ 先串联，G₄ 和 G₅ 并联构成内反馈。闭合内环后再乘 G₁，最后闭合 G₆ 外环。"],["两级 RC","直接对两节点写电流平衡或等效方框图。第二级会加载第一级，两个有负载的实际网络不能直接当作两个独立 RC 环节。"]],
      lab:{title:"RC 级联中负载如何改变响应",chartTitle:"直接连接与理想缓冲",controls:[R("r","第二级电阻",.35,3.5,.05,1.1),R("c","第二级电容",.2,1.8,.05,.65)],draggable:"r",
        draw(s){
          let x=0,y=0,z=0,v=0;
          const data=row(t=>{const p={actual:y,buffered:v},transfer=(x-y)/s.r; x+=M.dt*((1-x)-transfer);y+=M.dt*transfer/s.c;
            const lag=(z-v)/s.r;z+=M.dt*(1-z);v+=M.dt*lag/s.c;return p;});
          return {art:chain(["输入","R₁C₁","R₂C₂","输出"],2),chart:traces(s.time,{high:1.05,unit:"相对值"},[data,"actual","直接相连",ink.blue],[data,"buffered","理想缓冲",ink.teal]),
            readouts:vars(["实际输出",M.at(data,s.time).actual],["有缓冲输出",M.at(data,s.time).buffered]),
            detail:detail("例 2-10 的最终结构","G₁G₂G₃ / [1+G₂G₃(G₄+G₅)+G₁G₂G₃G₆]。这一化简与节点方程消元的结果等效。"),
            note:note("拖第二级电阻或电容，看级间负载何时更重要。")};
        }}
    },
    {
      title:"从方框图迁移到有向信号流图",source:span(40,45),
      points:[["节点和支路","节点代表变量，支路只沿箭头传输，支路增益将源节点变量乘后传到目标节点。目标节点是所有流入项之和。"],["关键术语","源点、阱点、混合节点；前向通路不重复经过节点；闭合通路是回路；互不接触回路没有共同节点。"],["转换与变换","先以方框图中的独立变量建节点，再按方程写有向边。画法不同可等价，合并时保持节点方程及输入输出不变。"]],
      lab:{title:"从支路增益回读节点方程",timed:false,controls:[R("a","前向增益 a",.2,2.5,.05,1.3),R("b","旁路增益 b",0,2,.05,.45),R("h","反馈增益 h",0,1.8,.05,.6)],draggable:"b",
        draw(s){
          const X0=1,X1=X0/(1+s.a*s.h),X2=s.a*X1,X3=X2+s.b*X0;
          const graphic=stage("四节点与两条前向路径",line(65,132,595,132)+line(65,132,65,58)+line(65,58,595,58)+line(595,58,595,132)+
            line(235,177,405,177,"#b56536")+line(235,130,235,177,"#b56536")+line(405,131,405,177,"#b56536")+
            [[65,"X₀"],[235,"X₁"],[405,"X₂"],[595,"X₃"]].map(([x,t])=>block(x-19,115,40,35,t,true)).join("")+
            txt(320,44,"b = "+fmt(s.b))+txt(321,112,"→ a = "+fmt(s.a))+txt(319,202,"← −h = "+fmt(-s.h)));
          return {art:graphic,readouts:vars(["X₁",X1],["X₂",X2],["X₃",X3]),
            detail:detail("节点方程","X₀ = 1，X₁ = X₀−hX₂，X₂ = aX₁，X₃ = X₂+bX₀。并联旁路 b 不经过内反馈回路。"),
            note:note("把旁路加大，观察 X₃ 改变而 X₁ 和 X₂ 保持原值。")};
        }}
    },
    {
      title:"逐项算出梅逊增益并回代",source:[...span(46,50),51],
      points:[["梅逊公式","T = Σ PₖΔₖ/Δ。Δ = 1 − 各回路增益和 + 两个互不接触回路的增益乘积和 − 三个互不接触回路的增益乘积和 + …。Δₖ 只使用与第 k 条前向通路不接触的回路。"],["计算路径","例 2-14 从前向通路开始，逐项找出回路和互不接触的组合。R-C 例和 X₄/X₁ 练习按同一流程求解，再用节点方程消元复核。"],["章末自测","加热炉同时利用进料流量测量和出口温度测量：FT→FFC 是前馈，TT→TC 是反馈，两者一起调节燃料阀，因此属于复合控制（D）。"]],
      lab:{title:"两环路与旁路的 Δ、Δₖ",visual:"mason",timed:false,controls:[R("a","前向 a",.2,2.8,.05,1.35),R("h","内反馈 h",.05,1.6,.05,.7),R("b","旁路 b",.1,2,.05,.45),R("j","外段独立回路 k",.05,1.3,.05,.25),C("stage","步骤",["前向通路","互不接触回路","计算 T"])],draggable:"h",
        draw(s){
          const da=1+s.a*s.h, db=1+s.j, delta=da*db, top=s.a+s.b*da, T=top/delta;
          const forward=s.stage===0?ink.teal:"#172744",loop=s.stage===1?ink.orange:"#172744";
          const centers=[62,178,309,453,592];
          const marker=(id,color)=>'<marker id="'+id+'" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 10 5 0 10z" fill="'+color+'"/></marker>';
          const wire=(d,id,color)=>'<path d="'+d+'" stroke="'+color+'" fill="none" stroke-width="2" marker-end="url(#'+id+')"/>';
          const f=d=>wire(d,"mason-forward",forward), b=d=>wire(d,"mason-return",loop);
          const symbol=(x,y,value,color)=>'<text x="'+x+'" y="'+y+'" fill="'+color+'" text-anchor="middle">'+escape(value)+'</text>';
          const nodes=centers.map((x,i)=>'<circle cx="'+x+'" cy="118" r="9" fill="#fbfdff" stroke="#172744" stroke-width="2"/>'+
            symbol(x+[0,-12,12,-12,12][i],146,"X"+["₀","₁","₂","₃","₄"][i],"#172744")).join("");
          const artwork='<svg viewBox="0 0 655 255" role="img" aria-label="梅逊公式实验的两条前向通路与两个回路">'+
            '<defs>'+marker("mason-forward",forward)+marker("mason-return",loop)+'</defs>'+
            '<g class="model-math">'+f("M72 118H168")+f("M188 118H299")+f("M319 118H443")+f("M463 118H582")+
            f("M65 108C148 14 360 14 449 108")+b("M304 127C286 219 202 219 182 128")+b("M589 127C565 219 483 219 457 128")+nodes+
            symbol(243,102,"a = "+fmt(s.a),forward)+symbol(249,31,"b = "+fmt(s.b),forward)+symbol(523,102,"1",forward)+
            symbol(246,226,"−h = "+fmt(-s.h),loop)+symbol(524,226,"−k = "+fmt(-s.j),loop)+'</g></svg>';
          return {art:artwork,
            readouts:vars(["Δ",delta],["ΣPₖΔₖ",top],["总增益",T]),
            detail:detail(["前向增益 P₁=a，P₂=b","回路 L₁=−ah，L₂=−k","用节点方程复核"][s.stage],["完整前向路径都经过输出段。旁路 b 绕过内反馈环。","两回路互不接触，Δ=1−L₁−L₂+L₁L₂。P₁ 接触两回路，Δ₁=1；P₂ 绕开 L₁，Δ₂=1−L₁。","T=[a/(1+ah)+b]/(1+k)，与梅逊公式的结果相同。"][s.stage]),
            note:note("拖反馈增益，观察互不接触乘积项与每条前向通路各自相关的余子式。")};
        }}
    }
  ];
  const lessons=[
    [
      ["把设备变成方程","围绕需要控制的输出，先确定输入、输出、扰动、储能状态和正方向，再用电压、电流或力矩平衡消掉辅助量。可用微分方程、传递函数、方框图、信号流图表达同一个系统。"],
      ["RLC 与质量—弹簧—阻尼","电容电压满足 LC uₒ″+RC uₒ′+uₒ=uᵢ，特征参数可写 T₁=L/R、T₂=RC。位移满足 m x″+f x′+kx=F。对照二阶惯性项、阻尼项、恢复项，可以把两种不同装置写成同类标准方程。"],
      ["电机有两个输入通道","直流电机转速 n 满足 TₐTₘn″+Tₘn′+n=Kᵤuₐ−Kₘ(Tₐm꜀′+m꜀)，其中 Tₐ=Lₐ/Rₐ，Tₘ=JRₐ/(CₑCₘ)，Kᵤ=1/Cₑ，Kₘ=Tₘ/J。电压是控制输入，负载转矩是独立扰动。固定扰动观察主输入时，三个例子都可按二阶线性主通道比较。"]
    ],
    [
      ["用拉普拉斯变换保留初值","单边变换 F(s)=∫₀^∞ f(t)e⁻ˢᵗdt，L{f′}=sF−f(0⁻)，L{f″}=s²F−sf(0⁻)−f′(0⁻)。线性、积分、时移和卷积性质用于把微分方程改写成代数关系。"],
      ["把 Y(s) 拆成能反变换的项","例中输入 2e⁻²ᵗ、初值为零，(s²+5s+4)Y=2/(s+2)。逆变换得 y=(2/3)e⁻ᵗ−e⁻²ᵗ+(1/3)e⁻⁴ᵗ。若出现 m 重极点 s₁，(s−s₁)⁻⁽ᵐ⁻ʲ⁾ 的系数是把 F(s)(s−s₁)ᵐ 求 j 阶导、代入 s₁，再除以 j!。"],
      ["区分两种分解","初值与外部输入把响应分成零输入、零状态两部分。暂态和稳态则按长期行为划分。此题的零状态响应也含暂态，而且这些指数项都衰减，故稳态解为零。终值定理需先检查 sY 在闭右半平面无极点。"]
    ],
    [
      ["先找静态运行点","若稳态变量满足 y₀=f(x₀)，就以 Δx=x−x₀、Δy=y−y₀ 为建模变量。一阶泰勒式给出 Δy≈f′(x₀)Δx，多变量时把各偏导乘增量相加。"],
      ["用液位说明条件","若平衡点附近的出口流量与 √h 成正比，工作点 h₀>0，切线增益为 k/(2√h₀)。工作点变化会改变增益，扰动变大时二阶及更高阶余项变重要。实验中同时比较原曲线、切线与相对误差。"]
    ],
    [
      ["哪一个比值叫传递函数","在零初始条件下，线性定常系统的某输出与某输入的拉氏变换比值为 G(s)。多输入系统计算其中一条通路时，把其余输入设为零。冲激响应的拉氏变换就是 G。"],
      ["从因式识别动力学","分子根是零点，分母根是极点，约去的因子可能遮住内部模态。按原点因子、实一阶因子和共轭二阶因子分解，就能看出积分阶次和各环节来源。"],
      ["从例和自测读边界","RLC 与机械装置可以具有相同归一化 G。相同的 G 给出相同输入输出响应，但可以由不同硬件实现，也无法从外部比值唯一确定内部结构或初始状态。"]
    ],
    [
      ["从不改变形状的环节开始","比例 G=K 只缩放信号，惯性 G=K/(Ts+1) 会平滑输入，积分 G=K/s 会因恒定输入形成斜坡。"],
      ["不同环节作用于哪部分","理想微分 G=Ks 的输出与输入斜率成正比，阶跃将产生冲激，实际通常加高频滤波。振荡环节 G=Kωₙ²/(s²+2ζωₙs+ωₙ²)，ζ 决定振铃。纯延迟 G=e⁻ᵀˢ 只令响应向后平移 T。"],
      ["用阶跃辨认","常量、指数上升、匀速爬升、窄脉冲、衰减振铃和延时跳变分别是线索。先看最终趋势，再看是否存在等待时间、超调和长期斜率。"]
    ],
    [
      ["串联 RLC 和理想运放","RLC 以电容电压为输出时 G=1/(LCs²+RCs+1)。反相运放在理想稳定负反馈下，输入端电流为零、两端电压相等。取 Z₁=R₁，Z₂=R₂/(1+R₂Cs)，得 G=−(R₂/R₁)/(1+R₂Cs)。"],
      ["沿真实调速装置逐段建模","给定电位器→比例运放→校正运放→功率放大→电机，测速信号回到比较端。每一块由物理方程导出，信号标记与连接方向一起保留。"],
      ["给定和负载各走一条路","多输入输出写成 C=GᵣR+G_dD。两条通路由同一闭环特征方程决定，共享未约分的闭环特征多项式，但分子不同，个别模态还可能在某通路中被抵消。"]
    ],
    [
      ["先标信号，再接方框","实例的闭环方程可写 E=R−B、C=GE、B=HC。因此前向通道 C/E=G，环路增益 B/E=GH，闭环 C/R=G/(1+GH)，H=1 时为单位反馈。"],
      ["把串、并、反馈还原成方程","串联沿路径相乘，平行支路在同一汇合点带符号相加。负反馈分母为 1+GH，正反馈为 1−GH。求某一输入的通路时，先把其他独立输入置零。"],
      ["检查操作是否改了信号","方框图只允许保持外部输入输出关系的变换。反馈符号属于汇合点，变换一段支路时还要复查分支上用到的是哪一个变量。"]
    ],
    [
      ["同类节点可以合并或交换","相邻比较点用带符号的代数加法合并，重复分支点可合并为同一节点。提取点与比较点混合时，移动必须补偿所提取的变量。"],
      ["比较点跨方框","把 G 前的加法移到 G 后，旁支输入要乘 G，因为 G(x+d)=Gx+Gd。从后向前移动则乘 1/G。"],
      ["取样点跨方框","把 G 前的取样线移到 G 后，取样支路补 1/G；从后移到前则补 G。等效变换先验证主路，再验证旁路。"]
    ],
    [
      ["交叉反馈优先从内环入手","例 2-10 先调整交叉的取样点、合并同向支路，再化成反馈嵌套。最终 C/R=G₁G₂G₃/[1+G₂G₃(G₄+G₅)+G₁G₂G₃G₆]。"],
      ["两级 RC 的级间负载","实际直接相连的分母为 R₁R₂C₁C₂s²+(R₁C₁+R₁C₂+R₂C₂)s+1，分子为 1。按孤立级串联只会得到 (1+R₁C₁s)(1+R₂C₂s)，缺少 R₁C₂s。放入理想缓冲级，前级才不承担后级电流。"]
    ],
    [
      ["把每个节点写成入流和","源点只有出支路，阱点只有入支路，混合点兼有两者。可以加一条增益为 1 的支路复制输出变量，得到独立阱点。电流等物理量的守恒仍由原节点方程负责。"],
      ["数路径和回路","前向通路从输入到输出，每个节点至多经过一次；回路沿支路回到起点；回路增益沿途相乘。互不接触必须没有公共节点。"],
      ["整理网络","串联的边增益相乘，并联的边带符号相加。消去自转移回路 L 时，其他入流乘 1/(1−L)。节点顺序和图形可变，保留节点方程即可。"]
    ],
    [
      ["梅逊公式的三张清单","先列前向通路 Pₖ、回路 Lᵢ、互不接触回路的组合。Δ=1−ΣLᵢ+ΣLᵢLⱼ−…，Δₖ只保留与 Pₖ不接触的回路，输出比为 ΣPₖΔₖ/Δ。"],
      ["从两个实例看余子式","例 2-14 有三条路 P₁=G₁G₂G₃G₄G₅、P₂=G₁G₆G₄G₅、P₃=G₁G₂G₇。四环中只有 −G₄H₁ 与 −G₂G₇H₂ 互不接触，故 Δ₁=Δ₂=1、Δ₃=1+G₄H₁。R-C 练习中 P₁=G₁G₂G₃、P₂=G₄G₃，Δ₁=1、Δ₂=1+G₁H₁，Δ=(1+G₁H₁)(1+G₃H₃+G₃G₄)+G₁G₂G₃(1+H₁H₃)。"],
      ["从自回路到复合控制","X₄/X₁ 练习得到 [aef(1+d)+abcf]/[1+d+eg+bcg+deg]，其中 −d 是自回路，唯一互不接触对贡献 deg。炉温控制题取 D：前馈控制器由 FT 流量信号补偿负载，反馈控制器由 TT 温度信号矫正出口温度，两个作用汇入燃料阀。"]
    ]
  ];
  groups.forEach((group,i)=>{group.lesson=lessons[i];});
  window.CourseUnits??={};
  window.CourseUnits[2]={label:"第二章 控制系统的数学模型",groups};
})();
