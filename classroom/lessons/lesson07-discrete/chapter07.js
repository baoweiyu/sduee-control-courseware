(() => {
  "use strict";
  const W=IntroWidgets,R=W.range,C=W.choices,TAU=2*Math.PI;
  const indices=(first,last)=>Array.from({length:last-first+1},(_,i)=>first+i);
  const num=(n,d=2)=>Number.isFinite(n)?n.toFixed(d):"∞";
  const tick=n=>Math.abs(n)>=10000?n.toExponential(1):num(n,Math.abs(n%1)>.001?1:0);
  const clamp=(n,low,high)=>Math.max(low,Math.min(high,n));
  const text=(heading,body)=>'<div class="text-block"><h3>'+heading+'</h3><p>'+body+'</p></div>';
  function canvas(body,label) {
    return '<svg class="discrete-sheet" viewBox="0 0 650 310" role="img" aria-label="'+label+'"><rect width="650" height="310" rx="8" fill="#f3f8fe"/>'+body+'</svg>';
  }
  function graph({lines=[],stems=[],xmax=12,xmin=0,high=1.5,low=-1.5,xlabel="时间 / s",unit="相对量",cursor,integerX=false}) {
    const x=v=>76+535*(v-xmin)/(xmax-xmin),y=v=>258-210*(clamp(v,low,high)-low)/(high-low);
    const y0=y(0);
    let out='<path d="M76 48v210h535" fill="none" stroke="#789ab5" stroke-width="1.5"/><text class="graph-label" x="76" y="32" font-size="14" fill="#486784">'+unit+'</text>';
    const xTicks=new Set(Array.from({length:5},(_,i)=>{
      const position=xmin+(xmax-xmin)*i/4;
      return integerX?Math.round(position):position;
    }));
    for(const xv of xTicks){
      out+='<path d="M'+x(xv)+' 48V258" fill="none" stroke="#d5e3ef"/><text class="graph-tick" x="'+x(xv)+'" y="277" font-size="13" text-anchor="middle" fill="#496987">'+tick(xv)+'</text>';
    }
    for(let i=0;i<=4;i++){
      const yv=low+(high-low)*i/4;
      out+='<path d="M76 '+y(yv)+'H611" fill="none" stroke="#d5e3ef"/><text class="graph-tick" x="66" y="'+(y(yv)+4)+'" font-size="12" text-anchor="end" fill="#496987">'+tick(yv)+'</text>';
    }
    for(const [coords,color,dash] of lines){
      out+='<polyline points="'+coords.map(([a,b])=>num(x(a),2)+','+num(y(b),2)).join(' ')+'" fill="none" stroke="'+color+'" stroke-width="2.4" '+(dash?'stroke-dasharray="5 4"':'')+'/>';
    }
    for(const [coords,color] of stems){
      for(const [a,b] of coords){
        out+='<path d="M'+x(a)+' '+y0+'V'+y(b)+'" stroke="'+color+'" stroke-width="1.6"/><circle cx="'+x(a)+'" cy="'+y(b)+'" r="3.4" fill="'+color+'"/>';
      }
    }
    if(cursor!==undefined)out+='<path d="M'+x(cursor)+' 48v210" fill="none" stroke="#2d647c" stroke-dasharray="5 3"/><circle cx="'+x(cursor)+'" cy="258" r="5" fill="#fff" stroke="#2d647c" stroke-width="2"/>';
    return canvas(out+'<text class="graph-label" x="609" y="301" text-anchor="end" font-size="13" fill="#486784">'+xlabel+'</text>',"可调离散系统轨迹");
  }
  const sample=(n,fn)=>Array.from({length:n+1},(_,i)=>[i,fn(i)]);
  const curve=(end,fn)=>sample(250,i=>fn(i/250*end)).map(([i,y])=>[i/250*end,y]);
  const adapt=(pairs,floor=-1.5,ceil=1.5)=>{
    const vals=pairs.flatMap(pair=>pair.map(([,y])=>y));
    return {high:Math.max(ceil,...vals)*1.035,low:Math.min(floor,...vals)*1.035};
  };
  const sinc=x=>Math.abs(x)<1e-10?1:Math.sin(x)/x;
  function lab(title,controls,draw,draggable=controls.find(x=>!x.options)?.id){
    return {title,controls,draggable,timed:false,draw(s){
      const r=draw(s);
      return {art:r.art,readouts:W.readouts(r.meters),detail:text(r.heading,r.explain),note:W.note(r.note)};
    }};
  }
  function polePair(b,c) {
    const d=b*b-4*c;
    if(d<0)return [[-b/2,Math.sqrt(-d)/2],[-b/2,-Math.sqrt(-d)/2]];
    return [[(-b+Math.sqrt(d))/2,0],[(-b-Math.sqrt(d))/2,0]];
  }
  const radius=([a,b])=>Math.hypot(a,b);
  const format=([re,im])=>num(re,3)+(Math.abs(im)<1e-6?"":(im>=0?" + ":" − ")+num(Math.abs(im),3)+"j");
  function pairedPlanes(layout,z,w,regions=false){
    const screen=(cx,cy,scale,p)=>[cx+clamp(p[0]*scale,-126,126),cy-clamp(p[1]*scale,-118,118)];
    const axis=(x,cy=158)=>'<path d="M'+(x-134)+' '+cy+'H'+(x+134)+' M'+x+' 41V277" stroke="#7c9bb8" fill="none"/>';
    const dot=([x,y],color)=>'<path d="M'+(x-5)+' '+(y-5)+'l10 10m-10 0 10-10" fill="none" stroke="'+color+'" stroke-width="3"/>';
    let out=(regions?'<path d="M336 43H470V277H336Z" fill="#dbeee8"/>':"")+axis(172)+axis(470);
    out+='<circle cx="172" cy="158" r="76" fill="#dfeee8" fill-opacity=".65" stroke="#267d69" stroke-width="2"/><text x="172" y="26" text-anchor="middle" font-size="17" fill="#244e77">z 平面</text><text x="470" y="26" text-anchor="middle" font-size="17" fill="#244e77">'+layout+' 平面</text>';
    for(const p of z)out+=dot(screen(172,158,76,p),radius(p)<1?"#14796b":"#bc5c2b");
    for(const p of w)out+=dot(screen(470,158,55,p),"#396f9e");
    return canvas(out,"单位圆与复平面映射");
  }

  window.CourseUnits??={};
  window.CourseUnits[7]={label:"第七章 离散控制系统",groups:[
    {title:"从连续信号到采样序列",source:indices(1,8),points:[
      ["开关把时间离散化","开关每隔 T 闭合一次，数字控制器按序列计算，保持器给连续对象施加作用。离散时间与幅值量化是两个概念。"],
      ["不同采样形式","等周期采样的间隔恒定。多阶采样按周期重复不等间隔；多速采样并行使用不同采样周期；随机采样时刻没有固定规律。"],
      ["脉冲调制表述","理想采样 f*(t)=Σ f(nT)δ(t−nT)，脉冲权重由原信号在各采样时刻的值决定。有限脉宽为实际采样的一种示意。"]
    ],lab:lab("拖动采样周期，观察采样点",[R("T","采样周期 T",.14,1.4,.02,.46," s"),R("f","信号频率",.2,1.6,.02,.54," Hz"),C("kind","采样波形",["理想采样","有限脉宽"])],s=>{
      const f=t=>Math.sin(TAU*s.f*t);
      const n=Math.floor(6/s.T),points=sample(n,i=>f(i*s.T)).map(([i,y])=>[i*s.T,y]);
      const pulses=points.flatMap(([t,y])=>[[t,0],[t,y],[Math.min(t+s.T*.18,6),y],[Math.min(t+s.T*.18,6),0]]);
      return {art:graph({lines:[[curve(6,f),W.ink.blue],...(s.kind?[[pulses,W.ink.orange]]:[])],stems:s.kind?[]:[[points,W.ink.teal]],xmax:6}),
        meters:[["采样频率",num(1/s.T)+" Hz"],["观察段采样点",String(points.length)]],heading:"同一条连续波形，观察离散读数",
        explain:"减小 T 会在相同观察时间内取到更多点。图上理想脉冲的杆高表示权重。",note:"本章的计算默认同步等周期采样。"};
    })},
    {title:"频谱为什么会混叠",source:indices(9,12),points:[
      ["采样拉氏关系","F*(s)=Σ f(nT)e⁻ⁿᵀˢ，沿虚轴以 ωs=2π/T 周期重复。频域可看成原信号频谱平移并叠加，理想冲激采样下系数为 1/T。"],
      ["香农重建条件","对于带限信号，fs 大于最高频率的两倍可避开频谱副本重叠。等号处对奈奎斯特频率成分的相位敏感，工程实现须留裕量并在采样前限带。"],
      ["混叠是歧义","单音可折回 [0,fs/2] 内，采样点不能唯一判明原频率。采样之后的滤波无法区分已经重合的谱线。"],
      ["自测","理想等周期采样由加权冲激序列表示。第 0 个副本是主频谱，幅值为原频谱的 1/T 倍。"]
    ],lab:lab("拉近频谱副本",[R("fs","采样频率",1,12,.1,5," Hz"),R("tone","原信号频率",.2,5,.1,2," Hz")],s=>{
      const folded=Math.abs(s.tone-s.fs*Math.round(s.tone/s.fs));
      const copies=[],base=[[-s.tone,1],[s.tone,1]],span=15;
      for(let k=-20;k<=20;k++)if(k)for(const f of [-s.tone,s.tone]){const hz=k*s.fs+f;if(Math.abs(hz)<=span)copies.push([hz,.63]);}
      return {art:graph({stems:[[copies,W.ink.orange],[base,W.ink.blue]],xmin:-span,xmax:span,high:1.2,low:0,xlabel:"频率 / Hz",unit:"归一化谱线",cursor:folded}),
        meters:[["fs/2",num(s.fs/2)+" Hz"],["折叠频率",num(folded)+" Hz"],["状态",s.tone<s.fs/2?"副本可分离":s.tone===s.fs/2?"临界":"已混叠"]],
        heading:"原谱线、副本与折叠",explain:"蓝线是原单音，橙线表示周期平移的副本，竖线在基带折叠位置。",note:"当 f 越过 fs/2，观察折叠频率向回移动。"};
    })},
    {title:"零阶与一阶保持",source:indices(13,19),points:[
      ["零阶保持","整段维持最近一次采样值。冲激响应为宽 T 的单位矩形，Gₕ(s)=(1−e⁻ˢᵀ)/s；直流值为 T。频响为 T sinc(ωT/2)e⁻ʲωᵀ⁄²，低频相位等效延迟为 T/2。"],
      ["近似实现","展开分母 eˢᵀ 保留 sT 的一次项，得到 T/(1+sT)；保留二次项，得到 T(1+sT/2)/[1+sT+(sT)²/2]。这两式适用于低频的有理近似，可用相应的 RC 环节表示。"],
      ["一阶保持","该章采用因果外推：最近两次采样值给出斜率。Gₕ(s)=T(1+Ts)[(1−e⁻ˢᵀ)/(Ts)]²。它更贴近某些缓变信号，相位与带宽仍需校验。"],
      ["设计影响","保持器无法补回采样间丢失的所有细节。频率接近采样频率时，保持器的幅值衰减和相位特征必须计入整个系统。"],
      ["自测","在低频处，零阶保持的相位比此处一阶外推的相位更滞后。一阶外推的相位为 arctan(ωT)−ωT，在较高频率可能更滞后，两者可以用交互模型核对。"]
    ],lab:lab("从点恢复为可施加的输入",[R("T","采样周期 T",.12,1.5,.02,.5," s"),R("f","信号频率",.15,1.1,.01,.35," Hz"),C("kind","保持方式",["零阶保持","一阶外推"])],s=>{
      const f=t=>Math.sin(TAU*s.f*t),n=Math.floor(6/s.T),out=[];
      for(let i=0;i<=n;i++){
        const t=i*s.T,dt=Math.min(s.T,6-t),val=f(t);
        out.push([t,val],[t+dt,val+(s.kind?(val-f(t-s.T))*dt/s.T:0)]);
      }
      const x=TAU*s.f*s.T,envelope=sinc(x/2),mag=s.kind?Math.hypot(1,x)*envelope**2:Math.abs(envelope);
      const phase=(s.kind?Math.atan(x)-x:-x/2+(envelope<0?Math.PI:0))*180/Math.PI;
      return {art:graph({lines:[[curve(6,f),W.ink.blue,true],[out,W.ink.teal]],xmax:6,...adapt([out])}),meters:[["归一化幅值",num(mag)],["相角",mag<1e-9?"零点处未定义":num(phase,1)+"°"]],
        heading:s.kind?"相邻两次样本决定斜率":"样本的值保持一段周期",explain:"蓝虚线为原信号，绿线为保持输出。频响幅值以该保持器的直流幅值归一化。",note:"一阶保持采用因果外推。"};
    })},
    {title:"从采样序列得到 z 变换",source:indices(20,26),points:[
      ["定义与收敛","单边 F(z)=Σ f(nT)z⁻ⁿ，并有 z=eˢᵀ。闭式有理表达式需要与序列和收敛区域一起使用。"],
      ["三种计算思路","级数法写出每项再求和；部分分式法将 F(s) 拆成基础变换对；留数法对 F(s)·z/(z−eˢᵀ) 的 F(s) 极点求留数，q 重极点用 q−1 阶导数。"],
      ["例 7-1 至 7-5","u[n] ↔ z/(z−1)，e⁻ᵃⁿᵀ ↔ z/(z−e⁻ᵃᵀ)，(1−e⁻ᵃⁿᵀ)/a 用前两对相减。nT ↔ Tz/(z−1)²，cos(ωnT) ↔ z[z−cos(ωT)]/[z²−2zcos(ωT)+1]。"]
    ],lab:lab("看逐项加权与收敛",[C("kind","选择序列",["单位阶跃","指数","指数差","斜坡","余弦"]),R("a","指数参数或角频率",.15,2,.05,.7),R("z","实轴上的 z",.5,3,.01,1.32),R("order","累加项上限",3,24,1,10)],s=>{
      const a=s.a,ratio=Math.exp(-a),z=s.z,k=s.kind,n=s.order;
      const f=[()=>1,i=>ratio**i,i=>(1-ratio**i)/a,i=>i,i=>Math.cos(a*i)][k];
      const weights=sample(n,i=>f(i)/z**i),terms=weights.map(([i,y])=>[i,y]);
      const roc=k===1?ratio:1,inside=z>roc;
      const exact=inside?[()=>z/(z-1),()=>z/(z-ratio),()=>(z/(z-1)-z/(z-ratio))/a,()=>z/(z-1)**2,()=>z*(z-Math.cos(a))/(z*z-2*z*Math.cos(a)+1)][k]():NaN;
      return {art:graph({stems:[[terms,W.ink.teal]],xmax:n,integerX:true,xlabel:"样本索引 n",unit:"加权系数",...adapt([terms])}),
        meters:[["部分和",num(weights.reduce((sum,[,y])=>sum+y,0),3)],["闭式",inside?num(exact,3):"收敛域外"],["收敛边界",num(roc)]],
        heading:"固定 T=1 s，沿 z 实轴试验",explain:"每杆表示 f[n]·z⁻ⁿ。把 z 移到收敛区域外，有限部分和仍可计算，不能当作变换的收敛值。",note:"拖动 z，然后增大项数比较部分和与闭式。"};
    },"z")},
    {title:"z 变换性质和逐拍延迟",source:indices(27,29),points:[
      ["线性与移位","因果序列的 k 拍延迟对应乘 z⁻ᵏ。单边超前需要扣除越出求和范围的初始项，超前一拍为 z[F(z)−f(0)]。"],
      ["初值、终值和指数乘子","f[0]=lim(z→∞)F(z)。当 (1−z⁻¹)F(z) 的极点均严格在单位圆内时，f[∞]=lim(z→1)(1−z⁻¹)F(z)。乘 eᵃⁿᵀ 对应 z 变为 ze⁻ᵃᵀ。"],
      ["卷积","采样序列的离散卷积对应 z 域相乘。不能把连续采样间轨迹当成离散卷积已经恢复的信息。"]
    ],lab:lab("拖动延迟拍数",[R("lag","延迟拍数 k",0,10,1,3),R("a","衰减比",.2,.97,.01,.72)],s=>{
      const original=sample(19,i=>s.a**i),delayed=sample(19,i=>i>=s.lag?s.a**(i-s.lag):0);
      return {art:graph({stems:[[original,W.ink.blue],[delayed,W.ink.teal]],xmax:19,low:-.05,high:1.12,integerX:true,xlabel:"样本索引 n",unit:"幅值",cursor:s.lag}),
        meters:[["延迟后首个非零点","n = "+s.lag],["z 域乘因子","z⁻ᵏ，k="+s.lag]],heading:"从哪里开始，形状就从哪里复制",explain:"蓝为原序列，绿为延迟序列。延迟补零后并不改变后续各项的幅值。",note:"有非零负时间样本时，单边移位必须另外处理。"};
    })},
    {title:"用算例掌握三种 z 反变换方法",source:indices(30,32),points:[
      ["长除法","按 z⁻¹ 展开，系数就是逐拍样本。例 7-6：10z/(z²−3z+2) 的样本为 10(2ⁿ−1)，以 0、10、30、70 开头。"],
      ["部分分式","先处理 F(z)/z 再乘回 z，对照 z/(z−a) ↔ aⁿ。例 7-7 得到 1−0.5ⁿ。"],
      ["留数法","f[n] 是 F(z)zⁿ⁻¹ 在反演围线内的留数和，注意原点也可能出现极点。二重极点例 7-8 得 nT，负实根例 7-9 得 (−1)ⁿ−(−2)ⁿ。"]
    ],lab:lab("切换例题并拖动样本",[C("kind","反变换例题",["长除","部分分式","二重极点","负实极点"]),R("order","观察样本",0,12,1,4),R("T","采样周期",.2,2,.1,1," s")],s=>{
      const f=[i=>10*(2**i-1),i=>1-.5**i,i=>i*s.T,i=>(-1)**i-(-2)**i][s.kind];
      const seq=sample(12,f);
      return {art:graph({stems:[[seq,W.ink.teal]],xmax:12,integerX:true,xlabel:"样本索引 n",unit:"f[n]",cursor:s.order,...adapt([seq])}),
        meters:[["n",String(s.order)],["f[n]",num(f(s.order),3)]],heading:["例 7-6 长除","例 7-7 部分分式","例 7-8 二重极点","例 7-9 负实极点"][s.kind],
        explain:["10(2ⁿ−1)，可以用长除递推验证。","1−0.5ⁿ，来自两个简单分式之差。","nT，由二重极点的一阶导数得到。","(−1)ⁿ−(−2)ⁿ，逐拍交替并发散。"][s.kind],note:"图的纵轴随具体例题调整。"};
    },"order")},
    {title:"差分方程把相邻样本连起来",source:indices(33,37),points:[
      ["差分与近似","一阶前向差分 Δy[n]=y[n+1]−y[n]，二阶差分 Δ²y[n]=y[n+2]−2y[n+1]+y[n]。后向差分相应使用过去样本。Δy[n]/T 近似连续导数。"],
      ["同一递推的两种来历","例 7-10 一阶连续对象前向欧拉得到 c[n+1]=(1−KT)c[n]+KTr[n]；例 7-11 对 ZOH 后积分器逐区间积分得到同形的精确递推。"],
      ["初值不能漏","例 7-12 用 y[0]=0、y[1]=1、单位阶跃输入求解二阶差分，得 y[n]=1/6+(−1)ⁿ/2−2(−2)ⁿ/3。代入初值可查正负号。"]
    ],lab:lab("比较前向近似和精确采样",[R("T","采样周期 T",.1,1.4,.02,.4," s"),R("K","对象增益 K",.25,2.4,.05,1.45)],s=>{
      const exact=curve(6,t=>1-Math.exp(-s.K*t)),q=1-s.K*s.T,n=Math.floor(6/s.T);
      const estimate=sample(n,i=>1-q**i).map(([i,y])=>[i*s.T,y]);
      return {art:graph({lines:[[exact,W.ink.blue]],stems:[[estimate,W.ink.teal]],xmax:6,...adapt([estimate],-.15,1.25)}),
        meters:[["递推极点",num(q,3)],["近似状态",Math.abs(q)<1?"衰减":Math.abs(q)===1?"边界":"发散"]],
        heading:"采样步长会影响前向欧拉",explain:"蓝线为连续一阶对象精确阶跃，绿色是前向近似。倍乘系数 1−KT 决定近似递推是否衰减。",note:"同一公式作为实际采样积分系统时，稳定性判据作用于实际离散闭环。"};
    })},
    {title:"采样开关位置与脉冲传递函数",source:indices(38,45),points:[
      ["定义和卷积","零初始条件下 G(z)=C(z)/R(z)=Σg(nT)z⁻ⁿ。出口可设虚拟同步采样。输入脉冲列与对象脉冲响应卷积，得到输出。"],
      ["串联与保持器","中间无开关时先作连续乘积再取 z 变换；中间有开关时先分别离散化再相乘。ZOH 串联对象可用 (1−z⁻¹)Z[G₀(s)/s]，例 7-14 的一阶对象得到 (1−e⁻ᵃᵀ)/[a(z−e⁻ᵃᵀ)]。"],
      ["反馈结构与控制器","误差通道采样且反馈连续时 C/R=G/(1+GH)，其中 GH 是连续乘积的采样变换。反馈输出也采样时用独立 G·H；仅反馈采样时，输入的连续影响通常不能独立写作 R(z)。数字控制器两侧独立采样时可分离 D(z)。"],
      ["自测","例 7-14 增加保持器后，原一阶极点的位置保持，同时响应模型的增益和分子形式改变。列特征方程前，先确定开关位置并清去分母。"]
    ],lab:lab("给串联的一阶对象加开关",[R("T","采样周期",.22,1.5,.02,.54," s"),R("a","第一环节衰减率",.35,2,.05,.85),C("mode","串联观察",["双结构并列","只看有开关","只看无开关"])],s=>{
      const a=s.a,b=1.5,n=17,f=i=>Math.abs(a-b)<1e-9?i*s.T*Math.exp(-a*i*s.T):(Math.exp(-a*i*s.T)-Math.exp(-b*i*s.T))/(b-a);
      const g=i=>Array.from({length:i+1},(_,j)=>Math.exp(-a*j*s.T-b*(i-j)*s.T)).reduce((x,y)=>x+y,0);
      const continuous=sample(n,f),separated=sample(n,g),mode=s.mode;
      const stems=mode===1?[[separated,W.ink.teal]]:mode===2?[[continuous,W.ink.blue]]:[[continuous,W.ink.blue],[separated,W.ink.teal]];
      return {art:graph({stems,xmax:n,low:0,high:Math.max(1.2,...separated.map(([,y])=>y))*1.07,integerX:true,xlabel:"采样索引",unit:"脉冲序列样本"}),
        meters:[["无开关 g[1]",num(f(1),3)],["有开关 g[1]",num(g(1),3)]],heading:"先乘后变与各变后乘",
        explain:"蓝色是两个连续一阶环节级联后的采样脉冲响应。绿色是两个单独采样环节的离散卷积。",note:"两种采样约定所得单位序列响应不可直接互换。"};
    })},
    {title:"闭环暂态由 z 极点决定",source:indices(46,49),points:[
      ["二阶例题","图 7-26 的例题使用 G(z)≈(0.368z+0.264)/[(z−1)(z−0.368)]，单位反馈后为 (0.368z+0.264)/(z²−z+0.632)。单位阶跃序列由递推得到。"],
      ["采样时刻与采样间","z 变换只保留采样时刻的值。对于严格真对象，若 lim(s→∞)sG(s)=0，理想冲激激励不引入瞬时跳变。曲线可连续，采样间的真实行为仍需对象和输入假设。"],
      ["极点模式","单根模态为 λⁿ，实正极点不交替，实负逐拍反号，共轭复根为 ρⁿcos(nθ+φ)，重极点另带多项式因子。ρ<1 衰减，ρ>1 发散。"]
    ],lab:lab("移动极点，查看暂态样本",[C("kind","模式",["正实","负实","共轭","教材二阶例"]),R("rho","极点模长",.25,1.26,.01,.78),R("theta","共轭幅角",10,170,1,58,"°")],s=>{
      let f;
      if(s.kind===3){
        const values=[0];
        for(let n=1;n<=22;n++)values[n]=(values[n-1]??0)-.632*(values[n-2]??0)+.368+(n>=2 ? .264 : 0);
        f=i=>values[i];
      }else f=i=>s.rho**i*Math.cos(i*(s.kind===0?0:s.kind===1?Math.PI:s.theta*Math.PI/180));
      const coords=sample(22,f);
      return {art:graph({stems:[[coords,W.ink.teal]],xmax:22,integerX:true,xlabel:"样本索引",unit:"暂态样本",...adapt([coords])}),
        meters:[["模式",["同号","交替","振荡","闭环阶跃"][s.kind]],["模长",num(s.kind===3?Math.sqrt(.632):s.rho,3)]],
        heading:"时间走向随着单位圆内外切换",explain:"拖动模长跨过 1 比较衰减与发散。负实根每拍反号。教材二阶例直接用分母系数递推。",note:"曲线仅包含采样时刻的信息。"};
    })},
    {title:"稳定条件与 w 变换",source:indices(50,53),points:[
      ["指数映射","z=eˢᵀ，所以 |z|=e^(σT)，幅角为 ωT（模 2π）。左半 s 平面映到单位圆内，虚轴映到单位圆周；主频带给出一组无重复角度。"],
      ["稳定和主导极点","线性定常系统的内部渐近稳定要求全部闭环模态严格在单位圆内。若用传递函数的极点检验内部稳定，应先排除零极点相消所隐藏的模态。稳定系统中模长最大的显著极点主导慢暂态。"],
      ["w 变换与例 7-15","w=(z−1)/(z+1) 把单位圆内映到左半平面，z=−1 对应无穷远。例 7-15 令 a=e⁻¹，采样后的特征式为 z²+[K(1−a)−1−a]z+a，对 w 多项式应用劳斯判据，得 0<K<2(1+a)/(1−a)≈4.328。"]
    ],lab:lab("跨单位圆试验稳定边界",[C("kind","映射方式",["s→z","例 7-15 的 z→w"],1),R("sigma","连续实部 σ",-.8,.6,.02,-.28),R("omega","连续角频率",.1,3.1,.1,1.3," rad/s"),R("gain","例题增益 K",.1,6,.05,2.3)],s=>{
      const a=Math.exp(-1),limit=2*(1+a)/(1-a),rho=Math.exp(s.sigma);
      const z=s.kind?polePair(s.gain*(1-a)-1-a,a):[[rho*Math.cos(s.omega),rho*Math.sin(s.omega)]];
      const transform=([x,y])=>{const d=(x+1)**2+y*y;return d>1e-14?[(x*x+y*y-1)/d,2*y/d]:[Infinity,0];};
      const w=s.kind?z.map(transform):[[s.sigma,s.omega]];
      return {art:pairedPlanes(s.kind?"w":"s",z,w,true),meters:[["最大 |z|",num(Math.max(...z.map(radius)),3)],["例题上限",num(limit,3)],["状态",z.every(p=>radius(p)<1)?"单位圆内":"达到或越过边界"]],
        heading:s.kind?"例 7-15 中 K 移动两个闭环极点":"固定 T=1 s 的指数映射",explain:"左图 z 极点为 "+z.map(format).join("；")+"。右图放大边界附近，超出观察范围的点显示在边缘。",note:"单位圆的位置与左半平面的对应关系由所选映射给出。"};
    },"gain")},
    {title:"先验稳定，再算稳态误差",source:indices(54,56),points:[
      ["先验稳定","单位负反馈 E/R=1/(1+G)。满足终值定理条件时，eₛₛ=lim(z→1)(1−z⁻¹)R/(1+G)。失稳时不能用代入极限冒充稳态结果。"],
      ["三类给定和系统型别","型别由 G 在 z=1 的极点阶数决定。采用 Kp=lim G，则单位阶跃误差为 1/(1+Kp)。Kv=lim[(z−1)G]/T，Ka=lim[(z−1)²G]/T²，分别对应单位斜坡与单位抛物线误差 1/Kv 和 1/Ka。"],
      ["例 7-16","T=1、K=1 对象为Ⅰ型，a=e⁻¹。闭环极点为 0.368±0.482j，模长约 0.607。Kp 为无穷大，Kv=1，Ka=0。阶跃稳态零差，单位斜坡误差为 1。"]
    ],lab:lab("用同一对象比较三类给定",[R("T","采样周期 T",.22,1.45,.02,1," s"),R("K","开环增益",.3,3.4,.1,1),C("kind","输入类型",["单位阶跃","单位斜坡","单位抛物线"],1)],s=>{
      const a=Math.exp(-s.T),b=s.K*(1-a)-1-a,poles=polePair(b,a),stable=poles.every(p=>radius(p)<1);
      const r=i=>i<0?0:[()=>1,i=>i*s.T,i=>.5*(i*s.T)**2][s.kind](i),errors=[];
      for(let i=0;i<=25;i++)errors.push(r(i)-(1+a)*r(i-1)+a*r(i-2)-b*(errors[i-1]??0)-a*(errors[i-2]??0));
      const points=sample(25,i=>errors[i]);
      const final=stable?[0,s.T/s.K,Infinity][s.kind]:NaN;
      return {art:graph({stems:[[points,W.ink.teal]],xmax:25,integerX:true,xlabel:"样本索引 n",unit:"误差 e[n]",...adapt([points])}),
        meters:[["主极点模长",num(Math.max(...poles.map(radius)),3)],["Kv",num(s.K/s.T,2)],["稳态误差",stable?num(final,3):"无稳态"]],
        heading:"Ⅰ型系统的误差递推",explain:"调采样周期、增益和输入类型。稳定时斜坡误差趋向 T/K，抛物线误差不收敛。",note:"终值建立在闭环稳定的前提下。"};
    })}
  ]};
})();
