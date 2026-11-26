"use strict";
(() => {
  const {range:R,choices:C,readouts,escape}=IntroWidgets;
  const I={ink:"#233149",soft:"#536d86",grid:"#dce6f0",paper:"#f8fbfe",blue:"#3474af",teal:"#157d72",orange:"#ad542c",violet:"#77519b"};
  const TAU=2*Math.PI;
  const num=(v,d=2)=>String(Number(v.toFixed(d)));
  const text=(x,y,value,opts={})=>`<text x="${x}" y="${y}" font-size="${opts.size??17}" fill="${opts.ink??I.ink}" text-anchor="${opts.anchor??"middle"}" font-weight="600">${escape(value)}</text>`;
  const path=(d,ink=I.grid,width=1,dash="")=>`<path d="${d}" fill="none" stroke="${ink}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${dash?' stroke-dasharray="'+dash+'"':""}/>`;
  const circle=(x,y,r,fill,stroke=fill,width=1)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
  const box=(x,y,w,h,fill=I.paper,stroke=I.grid)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${fill}" stroke="${stroke}"/>`;
  const svg=(label,body,height=290)=>`<svg viewBox="0 0 720 ${height}" role="img" aria-label="${escape(label)}">${body}</svg>`;
  const panel=(head,copy)=>`<section class="text-block"><h3>${escape(head)}</h3><p>${escape(copy)}</p></section>`;
  const page=(objective,lead,sections,lab,math)=>({objective,lead,sections,...(lab?{lab}:{}),...(math?.length?{math}:{})});
  const lab=(title,controls,draw,draggable=controls.find(c=>!c.options)?.id)=>({title,controls,draggable,timed:false,draw(state){
    const {art,head,detail,meters}=draw(state);
    return {art,readouts:meters?readouts(meters):undefined,detail:head?panel(head,detail):undefined};
  }});
  const enumerate=(end,fn,start=0)=>Array.from({length:end-start+1},(_,i)=>fn(start+i));
  const curve=(f,xmin,xmax,steps=180)=>enumerate(steps,i=>{const x=xmin+(xmax-xmin)*i/steps;return [x,f(x)];});
  const samples=(f,T,end)=>enumerate(Math.floor(end/T+1e-8),i=>[i*T,f(i*T)]);
  const mark=(label,color,points,dash="")=>({label,color,points,dash});
  function graph({label,tracks=[],stems=[],xmin=0,xmax=8,low=-1.5,high=1.5,ticks=4,xticks=8,unit="",xlabel="时间 / s",cursor,band,integerX=false}){
    const left=67,right=677,top=34,bottom=228,X=v=>left+(right-left)*(v-xmin)/(xmax-xmin),Y=v=>bottom-(bottom-top)*(v-low)/(high-low);
    let art="<defs><clipPath id='discrete-clip'><rect x='67' y='34' width='610' height='194'/></clipPath></defs>"+box(left,top,right-left,bottom-top);
    if(band)art+=`<rect x="${X(band[0])}" y="${top}" width="${X(band[1])-X(band[0])}" height="${bottom-top}" fill="#eaf3fa"/>`;
    for(let i=0;i<=ticks;i++){
      const y=low+i*(high-low)/ticks;
      art+=path(`M${left} ${Y(y)}H${right}`)+text(58,Y(y)+5,num(y),{size:14,anchor:"end",ink:I.soft});
    }
    for(let i=0;i<=xticks;i++){
      const x=xmin+i*(xmax-xmin)/xticks;
      if(integerX&&Math.abs(x-Math.round(x))>1e-8)continue;
      art+=path(`M${X(x)} ${top}V${bottom}`)+text(X(x),bottom+22,num(x),{size:14,ink:I.soft});
    }
    const base=Y(Math.max(low,Math.min(0,high)));
    art+=path(`M${left} ${base}H${right}`,I.soft,1.2);
    art+='<g clip-path="url(#discrete-clip)">';
    if(Number.isFinite(cursor))art+=path(`M${X(cursor)} ${top}V${bottom}`,I.violet,1.6,"5 4");
    const styles=tracks[0]?.dash?[tracks[0].dash,"","2 4"]:["","8 4","2 4"];
    tracks.forEach((track,index)=>{
      art+=path(track.points.map(([x,y],i)=>(i?"L":"M")+num(X(x))+" "+num(Y(y))).join(""),track.color,2.7,styles[index]);
    });
    const samplePoint=(x,y,color,index)=>index===0?circle(x,y,4.1,"#fff",color,2.2):
      `<rect x="${x-3.3}" y="${y-3.3}" width="6.6" height="6.6" fill="white" stroke="${color}" stroke-width="2"/>`;
    stems.forEach((track,index)=>{
      for(const [x,y] of track.points)art+=path(`M${X(x)} ${base}V${Y(y)}`,track.color,2.25)+samplePoint(X(x),Y(y),track.color,index);
    });
    art+="</g>"+text(right,272,xlabel,{anchor:"end",size:14,ink:I.soft})+text(left,24,unit,{anchor:"start",size:14,ink:I.soft});
    [...tracks,...stems].slice(0,3).forEach((t,i)=>{
      const x=78+i*172;
      const swatch=i<tracks.length?path(`M${x} 267h20`,t.color,2.8,styles[i]):
        path(`M${x+10} 274v-10`,t.color,2)+samplePoint(x+10,264,t.color,i-tracks.length);
      art+=swatch+text(x+29,272,t.label,{anchor:"start",size:14});
    });
    return svg(label,art,285);
  }
  function stepDiagram(steps,active){
    const width=steps.length>4?185:232,gap=23,cols=steps.length>4?3:2;
    const left=(720-cols*width-(cols-1)*gap)/2;
    return svg("推导分步",steps.map(([name],i)=>{
      const x=left+(i%cols)*(width+gap),y=54+Math.floor(i/cols)*87;
      return box(x,y,width,69,i===active?"#e8f2fa":I.paper,i===active?"#a2bdde":I.grid)+
        text(x+17,y+24,String(i+1).padStart(2,"0"),{anchor:"start",size:14,ink:I.blue})+text(x+width/2,y+49,name,{size:17});
    }).join(""),270);
  }
  const stepsLab=(title,steps,draw)=>lab(title,[C("step","步骤",steps.map(([name])=>name))],s=>{
    const [head,detail]=steps[s.step];
    return {art:draw?draw(s.step):title==="选择 z 变换求法"?stepDiagram(steps,s.step):IntroWidgets.stepList(steps.map(([name])=>name),s.step),head,detail,meters:[["进度",`${s.step+1} / ${steps.length}`]]};
  });
  const tRange=R("T","采样周期 T",.5,2.5,.1,1," s");
  const scopeSignal=t=>Math.sin(.9*t)+.2;
  const sinusoid=t=>2*Math.sin(.8*t);
  const slow=t=>1-Math.exp(-t/2);
  const guide=[
    ["采样与保持","把连续时间变成样本，再用零阶或一阶保持生成段间信号。"],
    ["z 域建模","级数、分式或留数求 z 变换，再建立差分方程。"],
    ["系统分析","求脉冲传递函数；用单位圆判断稳定性，并计算稳态误差。"]
  ];
  function furnaceArt(pulse,closed){
    const block=(x,label,w)=>box(x,118,w,48,I.paper,I.grid)+text(x+w/2,148,label,{size:17});
    const wire=(d,col=I.soft)=>path(d,col,2.3)+"";
    let body=box(42,82,637,156)+
      wire("M63 142H122")+circle(139,142,14,"#fff",I.blue,1.7)+text(139,148,"Σ",{size:16})+
      wire("M153 142H205")+circle(205,142,3,I.blue)+circle(255,142,3,I.blue)+
      wire(closed?"M205 142H255":"M205 142l43 -19",I.orange)+wire("M255 142H286")+
      block(286,"电机与阀",114)+wire("M400 142H436")+block(436,"加热炉",108)+wire("M544 142H642")+
      wire("M603 142V209H139V158",I.teal)+text(64,123,"给定",{anchor:"start",size:15})+text(627,124,"炉温",{size:15})+
      text(128,185,"−",{size:15})+text(228,179,pulse?"采样开关":"连续接通",{size:15,ink:I.orange})+
      text(398,229,"炉温反馈",{size:15,ink:I.teal})+text(360,52,pulse?(closed?"闭合：电机转动、调整阀位":"断开：电机暂停、阀位保持"):"误差持续驱动阀门",{size:23});
    return svg("炉温采样控制方框图",body,276);
  }
  const furnace=lab("操作炉温回路的采样开关",[
    C("mode","工作方式",["连续接通","周期采样"],1),C("phase","开关",["闭合瞬间","两次采样之间"],1)
  ],s=>{const pulse=s.mode===1,closed=!pulse||s.phase===0;return {art:furnaceArt(pulse,closed),head:"从误差到阀位",detail:!pulse?"炉温惯性大，连续驱动可能使阀位提前越过需要的位置。":closed?"短时间传递误差信号，电机调节阀位。":"电机停止，阀位保持，炉温继续向新状态变化。",meters:[["开关",closed?"闭合":"断开"],["阀门",closed?"可调":"保持"]]};});
  const switchModes=[
    ["读出连续误差","示意 e(t)=1−e⁻ᵗ⁄²。观察误差逐渐增大。"],
    ["第一次采样","在采样时刻闭合，样本通过，电机转动。"],
    ["断开保持阀位","两次采样之间电机停止，热过程仍在演化。"],
    ["进入下一周期","再次闭合读取新的误差。"]
  ];
  const sampleSwitch=lab("移动时间游标观察 T=2 s 的采样",[
    R("t","时间游标",0,8,.1,2," s"),C("mode","显示",["连续误差","误差与样本"],1)
  ],s=>{
    const n=Math.floor(s.t/2),at=Math.abs(s.t-2*n)<1e-9;
    return {art:graph({label:"误差信号与采样时刻",tracks:[mark("误差 e(t)",I.blue,curve(slow,0,8))],stems:s.mode?[mark("采样值",I.orange,samples(slow,2,8))]:[],cursor:s.t,low:0,high:1,unit:"归一化误差"}),
      head:at?"采样时刻":"两次采样之间",detail:at?"理想开关闭合，采样值等于当前误差。":"误差曲线继续变化；电机暂停，阀位保留上次结果。",
      meters:[["当前误差",num(slow(s.t),3)],["最近一次样本",num(slow(2*n),3)],["采样周期","2 s"]]};
  });
  const forms=[
    ["等周期","每隔固定 T 采样一次。",[.3,1.3,2.3,3.3,4.3,5.3,6.3,7.3]],
    ["多阶","间隔不等，但间隔模式周期性重复。",[.3,.9,2.3,2.9,4.3,4.9,6.3,6.9]],
    ["多速","不同采样器各有周期，同时观察同一信号。",[.3,1.3,2.3,3.3,4.3,5.3,6.3,7.3]],
    ["随机","采样时刻不存在固定的周期规律。",[.3,.8,1.9,2.1,4.1,5.6,5.9,7.4]]
  ];
  const sampleForms=lab("切换四种采样时刻",[C("mode","采样形式",forms.map(row=>row[0]))],s=>{
    const [head,detail,t]=forms[s.mode],stems=[mark(s.mode===2?"采样器 A":"采样时刻",I.blue,t.map(x=>[x,.88]))];
    if(s.mode===2)stems.push(mark("采样器 B",I.orange,[.3,1.85,3.4,4.95,6.5].map(x=>[x,.58])));
    return {art:graph({label:"采样时刻分布",stems,low:0,high:1.1,ticks:2,unit:"采样时刻"}),head,detail};
  });
  const modulation=lab("观察被调制信号、脉冲列和输出",[
    C("mode","观察",["原连续信号","单位脉冲列","脉冲调制输出"],2),tRange
  ],s=>{
    const points=samples(s.mode===1?()=>1:sinusoid,s.T,8);
    return {art:graph({label:"理想脉冲调制",tracks:s.mode===1?[]:[mark("连续 e(t)",I.blue,curve(sinusoid,0,8),s.mode===2?"5 4":"")],
      stems:s.mode?[mark(s.mode===1?"单位脉冲":"加权脉冲",I.orange,points)]:[],low:-2.3,high:2.3,unit:"函数值 / 脉冲强度"}),
      head:["读取连续信号","周期脉冲列","样值就是每根脉冲的强度"][s.mode],
      detail:["采样前 e(t) 在时刻之间也有定义。","每隔 T 出现面积为 1 的单位冲激。","极窄脉冲只用箭头表示其强度和正负，不能按普通函数的高度解释。"][s.mode],
      meters:[["采样周期",num(s.T,2)+" s"],["首个非零时刻样值",num(sinusoid(s.T),3)]]};
  });
  const causal=lab("选择一根脉冲，读其时刻与强度",[R("idx","脉冲索引 n",0,8,1,3)],s=>{
    const e=t=>2*Math.sin(.8*t),t=s.idx;
    return {art:graph({label:"因果信号的理想脉冲列",tracks:[mark("e(t)",I.blue,curve(e,0,8),"6 5")],
        stems:[mark("e(nT)δ(t−nT)",I.orange,samples(e,1,8))],low:-2.4,high:2.4,cursor:t,unit:"脉冲强度"}),
      head:"由抽样性质读出 e(nT)",detail:"冲激位于 t=nT，单位冲激面积为 1，乘上 e(nT) 后的代数面积为 e(nT)。因果情形只取 n≥0。",
      meters:[["脉冲位置",t+" s"],["代数强度",num(e(t),3)]]};
  });
  const bandShape=(w,limit)=>Math.max(0,1-Math.abs(w)/limit);
  const spectrum=lab("拖动采样频率观察副本叠加",[
    R("ratio","ωₛ / ωmax",.8,4,.05,2.6),C("mode","频谱",["单独副本","叠加后的频谱"],1)
  ],s=>{
    const limit=1,rate=s.ratio,period=TAU/rate,span=5,triangle=w=>bandShape(w,limit);
    const nth=n=>w=>triangle(w-n*rate)/period;
    const combined=w=>enumerate(Math.ceil((span+1)/rate),nth,-Math.ceil((span+1)/rate)).reduce((v,f)=>v+f(w),0);
    const overlays=s.mode?[mark("周期叠加",I.orange,curve(combined,-span,span,400))]:[-1,0,1].map((n,i)=>mark(["左侧副本","主频谱","右侧副本"][i],[I.teal,I.blue,I.orange][i],curve(nth(n),-span,span)));
    return {art:graph({label:"零相位三角形谱的周期复制",tracks:overlays,xmin:-span,xmax:span,xticks:10,low:0,high:1.35,unit:"角频谱幅值",xlabel:"ω / ωmax",band:[-1,1]}),
      head:rate<2?"频带发生重叠":"主频谱与相邻副本分离",
      detail:"示意谱取零相位，各项可直接相加。一般信号先叠加复频谱，再取其幅值。",
      meters:[["ωₛ / ωmax",num(rate,2)],["谱副本缩放 1/T",num(1/period,3)],["相邻带边距离",num(rate-2,2)]]};
  });
  const spectrumSteps=[
    ["周期冲激列","傅里叶级数的每个系数都是 1/T，基频 ωₛ=2π/T。"],
    ["时域相乘","连续信号乘冲激列，等价于乘一组复指数再相加。"],
    ["频域平移","每项把 E(s) 按 jnωₛ 平移。求和对全体整数，使用正负号都等价。"],
    ["读出复制","取 s=jω，得到以 ωₛ 为间隔的全部谱副本。"]
  ];
  const recovery=lab("比较采样、理想低通和幅值复原",[
    C("mode","恢复步骤",["采样频谱","理想低通","放大 T 倍"],0),R("ratio","ωₛ / ωmax",1.05,5,.05,4)
  ],s=>{
    const rate=s.ratio,T=TAU/rate;
    const sampled=w=>enumerate(6,n=>bandShape(w-n*rate,1),-6).reduce((a,b)=>a+b,0)/T;
    const restored=w=>(Math.abs(w)<=rate/2?sampled(w):0)*(s.mode===2?T:1);
    const vals=[mark(s.mode===0?"采样频谱":s.mode===1?"理想低通后":"放大 T 倍",I.orange,curve(s.mode?restored:sampled,-5,5,450))];
    if(s.mode===2)vals.push(mark("原频谱",I.blue,curve(w=>bandShape(w,1),-5,5),"6 4"));
    return {art:graph({label:"频谱低通复原",tracks:vals,xmin:-5,xmax:5,xticks:10,low:0,high:1.15,unit:"频谱幅值",xlabel:"ω / ωmax",band:[-rate/2,rate/2]}),
      head:rate<2?"混叠后不能用理想低通分开":"理想低通窗保留主频谱",detail:rate<2?"原频带已经与副本相加，滤波无法撤销混叠。":"截止取 ωₛ/2，保留主频谱后乘 T，恢复原谱的幅值。",meters:[["频率比",num(rate,2)],["理想截止 / ωmax",num(rate/2,2)]]};
  });
  window.SourcePolishCh7??={};
  Object.assign(window.SourcePolishCh7,{
    1:page("在封面给出从采样到判稳的七节路线。","同一个反馈问题，在采样系统中用差分方程和 z 域分析。",[["本章章节",["7.1 离散控制系统概述","7.2 采样与采样定理","7.3 保持器","7.4 z 变换","7.5 线性差分方程","7.6 脉冲传递函数","7.7 离散系统的时域分析"]]]),
    2:page("将学习目标按信号、数学和系统三层展开。","从连续系统出发，把采样与保持、z 域模型、稳定性与误差串起来。",[["目标",guide.map(([head,copy])=>head+"："+copy)],["关注量","ωₛ与ωmax、零阶保持的 T/2 滞后、单位圆与 Kₚ/Kᵥ/Kₐ。"]],stepsLab("沿信号到系统推进",guide)),
    3:page("给采样过程、脉冲调制、频谱复制和采样定理安排本节路线。","每隔 T 秒读取连续信号，会在频域得到周期性复制。",[["本节学习",["认识采样开关。","写出理想脉冲序列。","理解谱复制，检查是否混叠。","应用香农采样定理。"]]]),
    4:page("用炉温回路的连续和采样两种接法重现原案例。","离散控制中至少一处信号以脉冲序列或数码表示。",[["概念","模拟信号在时间和幅值上都连续。数字元件、计算机与脉冲技术使离散控制广泛应用。"],["炉温例","热惯性让炉温落后，阀门持续动作时可能引起反复超调。采样开关放在误差与电机之间，断开时固定阀位，让炉温继续变化；改善与否取决于实际参数。"]],furnace),
    5:page("沿原 T=2 s 误差曲线拖动时间，定位开关闭合、断开和下一次闭合。","连续误差被读取为脉冲样值，执行电机随采样动作。",[["周期过程",switchModes.map(([head,copy])=>head+"："+copy)]],sampleSwitch,[String.raw`T=2\,\mathrm{s},\qquad e(t)=1-e^{-t/2}`]),
    6:page("将四种形式做成同一坐标上的选项，用时刻分布做辨认。","本章无特别说明时使用等周期采样。",[["四种方式",forms.map(([head,copy])=>head+"："+copy)]],sampleForms),
    7:page("把前后两层信号和乘法载波做成切换，并可重新选择周期。","理想采样就是连续信号和周期单位冲激列相乘。",[["过程","真实开关每隔 T 闭合一次，闭合时长 τ≪T。理想化时用冲激表示，输出每根冲激的强度取 e(nT)。"]],modulation,[String.raw`\delta_T(t)=\sum_{n=-\infty}^{\infty}\delta(t-nT),\quad e^*(t)=\sum_{n=-\infty}^{\infty}e(nT)\,\delta(t-nT)`]),
    8:page("把抽象的采样公式落实为一根可选冲激的时间和强度。","控制系统通常把 t<0 的信号取为零，因果冲激列从 n=0 起。",[["抽样性质","e(t)δ(t−nT)=e(nT)δ(t−nT)。单位冲激面积为 1，理想化宽度为零。"]],causal,[String.raw`e^*(t)=\sum_{n=0}^{\infty}e(nT)\,\delta(t-nT)`]),
    9:page("按四步推导傅里叶系数、复指数相乘到谱复制。","采样谱以 ωₛ 为周期重复，单个副本缩放 1/T。",[["四步",spectrumSteps.map(([head,copy])=>head+"："+copy)],["意义","E*(s) 随 s 的虚部以 jωₛ 为周期。副本重叠会丢失可分辨的原信号信息。"]],stepsLab("从冲激列推到频谱副本",spectrumSteps),[String.raw`\omega_s=\frac{2\pi}{T},\quad C_n=\frac1T,\quad E^*(s)=\frac{1}{T}\sum_{n=-\infty}^{\infty}E(s+jn\omega_s)`]),
    10:page("让相邻三角谱实地靠近，观察刚分开和已经重叠的边界。","采样角频率小于两倍最高角频率时，相邻谱副本会混叠。",[["谱模型","原谱假定在 |ω|≤ωmax 的有限频带内。图上以零相位三角谱演示，实际计算按复函数叠加。"],["边界","ωₛ=2ωmax 时两副本恰接于带边。"]],spectrum,[String.raw`E^*(j\omega)=\frac1T\sum_nE\bigl(j(\omega-n\omega_s)\bigr)`]),
    11:page("沿原例 ωₛ=4ωmax 做低通复原，再改变采样频率检验边界。","对带限信号，理论 Nyquist 边界是采样频率等于最高频率的两倍。",[["课件条件","ωₛ≥2ωmax；理论最大周期 T=π/ωmax。若最高频率处含离散谱线，等号需要附加条件，工程应取严格裕量，课件建议 4–10 倍。"],["复原","理想低通截止 ωₛ/2，再乘 T 恢复原幅值。"]],recovery),
    12:{...page("保留四选项，对主频谱比例做一次检验。","回顾理想采样、主频谱及恢复条件。",[["速判依据","采样脉冲强度等于瞬时值。n=0 项是主频谱，缩放因子为 1/T。"]]),
      quiz:{prompt:"关于离散控制系统，以下哪些表述正确？",options:["采样开关可看作脉冲序列发生器","n=0 的谱副本称为主频谱","主频谱幅值是连续谱的 T 倍","采样定理确定最低采样频率与最高信号频率的关系"],answers:[0,1,3],feedback:"主频谱为 E(jω)/T。"}}
  });
  function held(f,T,end,order){
    const segments=[];
    for(let n=0;n*T<=end+1e-9;n++){
      const t=n*T,v=f(t),previous=n?f((n-1)*T):0,dt=Math.min(T,Math.max(0,end-t));
      segments.push([t,v],[t+dt,v+(order?(v-previous)*dt/T:0)]);
    }
    return segments;
  }
  const holdSignal=lab("对比每段保持值和原始信号",[
    tRange,R("t","时间游标",0,8,.1,3," s"),C("view","显示",["只看样本","采样与保持"],1)
  ],s=>{
    const n=Math.floor((s.t+1e-9)/s.T),start=n*s.T;
    return {art:graph({label:"采样与零阶保持",tracks:[mark("连续信号",I.blue,curve(scopeSignal,0,8),"6 5"),...(s.view?[mark("零阶保持",I.teal,held(scopeSignal,s.T,8,0))]:[])],
      stems:[mark("样本",I.orange,samples(scopeSignal,s.T,8))],cursor:s.t,band:[start,Math.min(start+s.T,8)]}),
      head:"一段的高度取左端采样值",detail:"零阶保持把 e(nT) 从 nT 固定到下次采样前。周期越短，对连续信号的阶梯近似通常越细。",
      meters:[["区间起点",num(start,2)+" s"],["该段保持值",num(scopeSignal(start),3)],["真实信号值",num(scopeSignal(s.t),3)]]};
  });
  const rectHold=lab("把两个阶跃相加得到矩形脉冲",[
    tRange,C("view","叠加分量",["1(t)","−1(t−T)","相加结果"],2)
  ],s=>{
    const T=s.T,v=[[[0,1],[4,1]],[[0,0],[T,0],[T,-1],[4,-1]],[[0,1],[T,1],[T,0],[4,0]]][s.view];
    return {art:graph({label:"零阶保持器单位脉冲响应",tracks:[mark(["起始阶跃","反向延迟阶跃","矩形响应"][s.view],I.teal,v)],
      xmax:4,band:[0,T],cursor:T,low:-1.15,high:1.15,unit:"脉冲响应"}),
      head:"输入单位冲激，输出一个周期的矩形",detail:"在 0≤t<T 输出为 1，t≥T 回到 0。跨越零时刻前同为零，响应面积就是 T。",
      meters:[["矩形宽度",num(T)+" s"],["脉冲响应积分",num(T)+" s"]]};
  });
  const sinc=x=>Math.abs(x)<1e-9?1:Math.sin(x)/x;
  const deg=x=>x*180/Math.PI;
  const labHoldFreq=lab("在幅相两图读主瓣、零点和旁瓣",[
    tRange,R("frac","游标 ω / ωₛ",0,2.5,.02,.5),C("view","观察",["幅值","相角"],0)
  ],s=>{
    const amp=q=>Math.abs(sinc(Math.PI*q)),phase=(q,n=0)=>-180*(q+n);
    const q=s.frac,omega=q*TAU/s.T,zero=q>0&&Math.abs(q-Math.round(q))<1e-8;
    const tracks=s.view?enumerate(2,n=>mark(n?"":"主瓣",I.blue,curve(v=>phase(v,n),n,Math.min(n+1,2.5),50))):[mark("|Gₕ| / T",I.blue,curve(amp,0,2.5))];
    const axis=s.view?{low:-900,high:0,ticks:5,unit:"相角 / °"}:{low:0,high:1,ticks:4,unit:"归一化幅值"};
    if(s.view)tracks[0].label="逐瓣展开";
    return {art:graph({label:"零阶保持器频率响应",tracks,xmax:2.5,xticks:5,xlabel:"ω / ωₛ",cursor:q,band:[0,1],...axis}),
      head:s.view?"主瓣相角随频率线性下降":"幅频为 sinc 包络",
      detail:s.view?"主瓣斜率对应时间滞后 T/2。零点处相角未定义，跨瓣时相角因符号改变跳变 π。":"主瓣在 ωₛ 归零，高频旁瓣仍可通过部分分量。",
      meters:[["ω / rad·s⁻¹",num(omega,2)],["|Gₕ|",num(s.T*amp(q),3)],["所示相角",zero?"零点无定义":num(phase(q,Math.floor(q)),1)+"°"],["主瓣等效滞后",num(s.T/2,2)+" s"]]};
  });
  const holdingEffects=lab("从阶梯中点看 T/2 延迟，再比较两个近似",[
    tRange,C("view","观察",["阶梯中点","近似频响"],0),R("omega","频率游标",0,5,.1,.8," rad/s")
  ],s=>{
    const T=s.T;
    if(!s.view){
      const mids=samples(scopeSignal,T,8-T/2).map(([t,v])=>[t+T/2,v]);
      return {art:graph({label:"阶梯中点的 T/2 延迟",tracks:[mark("原信号",I.blue,curve(scopeSignal,0,8),"6 5"),mark("零阶保持",I.teal,held(scopeSignal,T,8,0)),mark("中点连线",I.orange,mids)]}),
        head:"中点晚半个采样周期",detail:"每一段中点位于 nT+T/2，而高度仍是 e(nT)。中点插值近似 e(t−T/2)。",
        meters:[["采样周期",num(T)+" s"],["延迟",num(T/2)+" s"]]};
    }
    const exact=w=>T*Math.abs(sinc(w*T/2));
    const first=w=>T/Math.hypot(1,w*T);
    const second=w=>T*Math.hypot(1,w*T/2)/Math.hypot(1-.5*(w*T)**2,w*T);
    return {art:graph({label:"零阶保持与两个近似幅频",tracks:[mark("精确",I.blue,curve(exact,0,5)),mark("取两项",I.teal,curve(first,0,5),"5 4"),mark("取三项",I.orange,curve(second,0,5),"5 4")],
      xmax:5,xticks:5,low:0,high:T*1.1,xlabel:"ω / rad·s⁻¹",unit:"幅值",cursor:s.omega}),
      head:"取项更多，网络较复杂",detail:"课件两项近似可由放大器与 RC 网络实现，三项近似可用无源网络。保留更多项增加实现复杂度。",
      meters:[["精确",num(exact(s.omega),3)],["取两项",num(first(s.omega),3)],["取三项",num(second(s.omega),3)]]};
  });
  const extrapolator=lab("用同一组样本比较零阶与一阶保持",[
    tRange,C("view","观察",["时域外推","相频比较"]),R("probe","游标 ωT",0,5,.05,1)
  ],s=>{
    const T=s.T,q=s.probe;
    if(s.view){
      const zoh=x=>deg(-x/2),foh=x=>deg(Math.atan(x)-x);
      return {art:graph({label:"零阶、一阶保持主瓣相角",tracks:[mark("零阶保持",I.blue,curve(zoh,0,5)),mark("一阶保持",I.teal,curve(foh,0,5))],
        low:-225,high:0,ticks:5,xmax:5,xticks:5,cursor:q,xlabel:"归一频率 ωT",unit:"相角 / °"}),
        head:"比较实际穿越频率处的延迟",detail:"本页一阶外推模型在低频的相角滞后可以小于零阶，高频区可反过来。稳定裕度由完整回路与实际穿越决定。",
        meters:[["零阶相角",num(zoh(q),1)+"°"],["一阶相角",num(foh(q),1)+"°"]]};
    }
    const first=held(scopeSignal,T,8,1),last=held(scopeSignal,T,8,0),ys=first.map(row=>row[1]);
    return {art:graph({label:"保持输出与原信号",tracks:[mark("原信号",I.blue,curve(scopeSignal,0,8),"6 5"),mark("零阶",I.orange,last),mark("一阶",I.teal,first)],
      low:Math.min(-1.1,...ys)-.15,high:Math.max(1.3,...ys)+.15}),
      head:"按相邻两样本的差值估计斜率",detail:"图上 n≥1 开始用前后样本确定每段斜率。示意信号启动前的样本取 0；外推可能超调。",
      meters:[["周期",num(T,2)+" s"],["首个可用斜率",num((scopeSignal(T)-scopeSignal(0))/T,3)+" s⁻¹"]]};
  });
  const qHold=[
    {prompt:"按本节的工程概括，各阶保持器常引入什么相位影响？",options:["相位滞后","相位超前"],answers:[0],feedback:"典型保持器会引入频率相关的相角变化。零阶在主瓣内产生 −ωT/2。"},
    {prompt:"课件对装置选型的经验表述更常推荐哪种保持器？",options:["零阶保持器","一阶保持器"],answers:[0],feedback:"零阶结构简单、应用广。两者相角随 ωT 变化，相对稳定性须看实际回路和穿越频率。"},
    {prompt:"利用两个相邻样本及其趋势作线性外推的是哪种？",options:["一阶保持器","零阶保持器"],answers:[0],feedback:"一阶外推可改善平滑局部段的恢复，误差还与输入频率及采样周期有关。"}
  ];
  function mapping(zReal,zImag,sigma,omega,T){
    const left=208,right=526,cy=140,scale=57,bound=3.2,zScale=Math.min(57,91/Math.max(1,Math.hypot(zReal,zImag)));
    const sX=left+scale*sigma,sY=cy-((omega*T)/bound)*98,zX=right+zScale*zReal,zY=cy-zScale*zImag;
    let art=box(59,34,296,211)+box(378,34,286,211);
    art+=`<rect x="73" y="53" width="135" height="175" fill="#e8f4f1"/>`;
    for(const x of [left,right])art+=path(`M${x-122} ${cy}h244 M${x} 51v175`,I.soft,1.3);
    art+=circle(right,cy,zScale,"none",I.teal,1.7)+circle(sX,sY,6,I.blue)+circle(zX,zY,6,I.orange)+
      text(left,63,"s 平面主横带",{size:16})+text(right,64,"z 平面单位圆",{size:16})+
      text(left-28,220,"σ < 0",{size:14,ink:I.teal})+text(right+37,223,"|z| = 1",{size:14,ink:I.teal})+
      text(left,265,"纵轴按 ωT 归一化",{size:14,ink:I.soft})+text(right,265,"z = eˢᵀ",{size:15,ink:I.soft});
    return svg("s 平面向 z 平面的指数映射",art,281);
  }
  const zMapping=lab("从 s 的实部和虚部查看 z 位置",[
    R("sigma","s 平面实部 σ",-1,.36,.02,-.4),R("angle","归一相位 ωT",-3.1,3.1,.1,1.2),tRange
  ],s=>{
    const rho=Math.exp(s.sigma*s.T),angle=s.angle,x=rho*Math.cos(angle),y=rho*Math.sin(angle);
    return {art:mapping(x,y,s.sigma,angle/s.T,s.T),head:"指数映射把采样指数换成 z⁻ⁿ",
      detail:"σ 控制距离原点的模；ωT 决定圆周角。主横带内左半部分映到单位圆内，虚轴映到单位圆。",
      meters:[["|z|",num(rho,3)],["∠z",num(deg(angle),1)+"°"],["ω",num(angle/s.T,2)+" rad/s"]]};
  });
  const zMethods=[
    ["级数求和","按采样逐项代入，识别等比级数或其导数。"],
    ["部分分式","有理 F(s) 拆成简单项；A/(s+p) 对应 Az/(z−e⁻ᵖᵀ)。"],
    ["留数法","对 F(s)z/(z−eˢᵀ) 在 F(s) 的极点求留数，重极点用导数。"]
  ];
  const seriesModel=isStep=>lab(isStep?"增加参与求和的阶跃样本":"调整指数衰减与截取项数",[
    R("count","末项索引 n",1,12,1,8),R("absz","实数 z",1.15,4,.05,2),...(isStep?[]:[R("aT","衰减参数 aT",.1,1.6,.05,.5)])
  ],s=>{
    const rho=isStep?1:Math.exp(-s.aT),ratio=rho/s.absz,raw=enumerate(s.count,i=>[i,rho**i]),weighted=enumerate(s.count,i=>[i,ratio**i]);
    return {art:graph({label:"z 变换的样本与有限和",stems:[mark("样本 f(nT)",I.blue,raw),mark("加权项",I.orange,weighted)],xmax:12,xticks:12,integerX:true,low:0,high:1.1,ticks:2,
      xlabel:"采样索引 n",unit:"幅值",cursor:s.count}),
      head:"按同一公比累加",detail:"收敛域在闭合式最外极点的外部。项数越多，有限和越接近 1/(1−公比)。",
      meters:[["公比",num(ratio,3)],["交互有限和",num(weighted.reduce((a,[,v])=>a+v,0),4)],["闭合值",num(1/(1-ratio),4)],["极点 z",num(rho,3)]]};
  });
  const splitReference=()=>IntroWidgets.equationSteps(["拆分部分分式","取样并查表","按线性组合"],
    [String.raw`F(s)=\frac1a\left(\frac1s-\frac1{s+a}\right)`,
     String.raw`1\longleftrightarrow\frac z{z-1},\quad e^{-anT}\longleftrightarrow\frac z{z-e^{-aT}}`,
     String.raw`F(z)=\frac{z(1-e^{-aT})}{a(z-1)(z-e^{-aT})}`],
    "采样周期为 T，a ≠ 0。两项按同一采样周期查表。");
  const rampReference=()=>IntroWidgets.equationSteps(["定位二重极点","消去极点因子","求导并代入"],
    [String.raw`F(s)=\frac1{s^2}`,String.raw`s^2 F(s)\frac{z}{z-e^{sT}}=\frac{z}{z-e^{sT}}`,
     String.raw`F(z)=\left.\frac{d}{ds}\frac{z}{z-e^{sT}}\right|_{s=0}=\frac{Tz}{(z-1)^2}`],
    "单位斜坡在原点有二重极点，求一次导数即可。收敛域为 |z| > 1。");
  const cosineExample=lab("改变 ωT，观察两个共轭 z 极点",[
    R("angle","相邻样本相位差 ωT",.15,3,.05,.8)
  ],s=>{
    const a=s.angle,x=Math.cos(a),y=Math.sin(a),X=v=>497+v*86,Y=v=>142-v*86;
    const graphArt=box(70,45,232,193)+text(186,83,"两项各占 1/2",{size:20})+
      text(186,130,"z/(z−eʲωᵀ)",{size:19,ink:I.blue})+text(186,175,"z/(z−e⁻ʲωᵀ)",{size:19,ink:I.orange})+
      box(343,45,306,193)+path("M385 142H610 M497 50V230",I.soft,1.1)+circle(497,142,86,"none",I.teal,1.7)+circle(X(x),Y(y),6,I.blue)+circle(X(x),Y(-y),6,I.orange);
    return {art:svg("共轭极点在单位圆上",graphArt,281),head:"欧拉关系使系数化为实数",
      detail:"两根乘积为 1，加起来是 2cosωT。ωT 是 π 的整数倍时两根重合，通分后可以约去共同因子。",
      meters:[["cosωT",num(x,3)],["sinωT",num(y,3)],["两根模长","1"]]};
  });
  const linearCheck=lab("改变线性系数观察样本叠加",[
    R("A","第一项系数 a₁",-1.5,1.5,.05,1),R("B","第二项系数 a₂",-1.5,1.5,.05,-.5)
  ],s=>{
    const x=n=>s.A*.83**n,y=n=>s.B*Math.cos(n*.7),sum=n=>x(n)+y(n);
    return {art:graph({label:"样本序列线性组合",stems:[mark("a₁f₁[n]",I.blue,enumerate(11,n=>[n,x(n)])),mark("a₂f₂[n]",I.orange,enumerate(11,n=>[n,y(n)]))],
      tracks:[mark("组合 f[n]",I.teal,enumerate(11,n=>[n,sum(n)]))],xmax:11,xticks:11,integerX:true,low:-3.1,high:3.1,xlabel:"采样索引 n",unit:"幅值"}),
      head:"先相加再变换，与先变换再相加等价",detail:"延迟换元把 z⁻ᵏ 提到求和号外；因果条件令负索引样本为 0。",
      meters:[["组合首样本",num(sum(0),2)],["组合下一样本",num(sum(1),2)]]};
  });
  const delayModel=lab("移动 k 拍，对照左移和右移",[
    C("mode","位移方向",["延迟：右移","超前：左移"]),R("k","位移拍数 k",0,5,1,2)
  ],s=>{
    const raw=[.25,.55,1,.83,.51,.4,.18,.05],f=i=>raw[i]??0,k=s.k,points=enumerate(12,i=>[i,f(i)]);
    const shifted=enumerate(12,i=>[i,f(s.mode?i+k:i-k)]);
    return {art:graph({label:"采样序列的位移",stems:[mark("原序列",I.blue,points),mark("位移后",I.orange,shifted)],xmax:12,xticks:12,integerX:true,low:0,high:1.15,xlabel:"采样索引 n",unit:"幅值",cursor:k}),
      head:s.mode?"左移会删掉序列开头的样本":"延迟在序列开头补零",
      detail:s.mode?"乘 zᵏ 前须扣除前 k 项，单边 z 变换才与图中的左移一致。":"t<0 的样本为零，所以公式只需要在 F(z) 外乘 z⁻ᵏ。",
      meters:[["移位后首样本",num(shifted[0][1],2)],["移位拍数",k]]};
  });

  Object.assign(window.SourcePolishCh7,{
    13:page("以保持器、z 变换和反变换为三段组织路标。","保持器填补采样时刻之间的信号，z 变换把离散序列转成代数式。",[["本节学习",["零阶保持器的传递函数、频率特性和实现。","一阶保持器。","级数求和、部分分式、留数与 z 变换性质。","z 反变换方法。"]]]),
    14:page("在时间图上同时展示离散样本、原信号和每段保持值。","零阶保持器把一个样本保持到下一次采样，生成阶梯波。",[["原示例","e(t)=sin(0.9t)+0.2，原图取 T=1 s；每段高为 e(nT)，段宽 T。"],["含义","信号保持用离散值构造连续时间信号。阶梯波近似原连续波形。"]],holdSignal),
    15:page("把两个阶跃做成三个可选图层，让相减的结果可视。","理想冲激送进零阶保持器，输出幅值 1、宽度 T 的矩形。",[["从脉冲响应到传递函数","gₕ(t)=1(t)−1(t−T)，分别取拉氏变换再相减。"]],rectHold,[String.raw`G_h(s)=\frac{1-e^{-Ts}}s`]),
    16:page("让频率游标在主瓣和旁瓣上移动，开关见到幅相两部分。","零阶保持器呈低通幅频，同时在主瓣内产生 T/2 的等效延迟。",[["三条读图","在采样角频率 ωₛ 第一次归零；主瓣内幅值下降；旁瓣具有泄漏，恢复效果随 T 变化。"],["相角","主瓣内 −ωT/2。跨越幅值零点时按瓣展示相角分支，零点本身相角未定义。"]],labHoldFreq,[String.raw`G_h(j\omega)=T\frac{\sin(\omega T/2)}{\omega T/2}e^{-j\omega T/2}`]),
    17:page("用每段中点表现延迟，再切到两种近似的精确曲线对照。","阶梯中点连线近似 e(t−T/2)，滞后相移可能降低回路稳定裕度。",[["频域近似","展开 eˢᵀ 后截取。两项形式 T/(1+sT) 可用放大器与 RC 网络实现；三项形式可用无源网络。"],["工程取舍","更高阶近似增加网络复杂度。零阶结构简单，应用广；和其他保持器比较稳定裕度，需要看具体频率和回路。"]],holdingEffects,[String.raw`G_h\approx\frac{T}{1+sT},\qquad G_h\approx T\frac{1+sT/2}{1+sT+(sT)^2/2}`]),
    18:page("比较同一采样信号的零阶保持与一阶外推，再按 ωT 检查相角。","一阶保持器用相邻两样本估算斜率，沿该斜率外推下一个采样周期。",[["线性外推","y(nT+Δt)=y(nT)+[y(nT)−y((n−1)T)]Δt/T，0≤Δt<T。"],["两种装置","一阶结构更复杂，对平滑局部波形可能恢复得更好。对比相角须指定频率；实际稳定性要检验完整反馈。"]],extrapolator,[String.raw`G_h(s)=T(1+Ts)\left(\frac{1-e^{-Ts}}{Ts}\right)^2`,String.raw`|G_h(j\omega)|=T\sqrt{1+\omega^2T^2}\left(\frac{\sin(\omega T/2)}{\omega T/2}\right)^2,\quad \angle G_h=\arctan(\omega T)-\omega T`]),
    19:{...page("保留三道选择练习，说明装置比较的频率适用范围。","回顾零阶保持的固定值和一阶保持的线性外推。",[["比较依据","零阶相角主瓣内为 −ωT/2。一阶为 arctan(ωT)−ωT，两者大小关系随 ωT 改变；哪种更准确也取决于具体信号。"]]),
      quiz:{items:qHold}},
    20:page("从同一 s 点的复平面映射看出代换来由，旁边保留定义等式。","令 z=eˢᵀ，把采样脉冲的拉氏变换化为 z 的幂级数。",[["定义路径","采样得到 f*(t)，拉氏变换把 nT 带入每个指数项。代入 eˢᵀ=z 后得到右边 z 变换级数，在收敛域内定义。"],["信息边界","Z[f(t)] 是对采样值序列所作的简写；只取采样时刻的信息，时刻之间的信号须另给假设。"]],zMapping,[String.raw`F^*(s)=\sum_{n=0}^{\infty}f(nT)e^{-nTs},\quad z=e^{Ts},\quad F(z)=\sum_{n=0}^{\infty}f(nT)z^{-n}`]),
    21:page("在方法选择卡中明确每条路线从已知量出发。","典型变换可查表；级数求和、部分分式和留数适合不同已知条件。",[["三条路线",zMethods.map(([head,copy])=>head+"："+copy)],["重极点","q 阶留数先消去极点，再对剩余式求 q−1 阶导数，最后除以 (q−1)!。"]],stepsLab("选择 z 变换求法",zMethods),[String.raw`F(z)=\sum_i\operatorname{Res}_{s=p_i}\left[F(s)\frac{z}{z-e^{sT}}\right]`,String.raw`R_i=\left.\frac{1}{(q-1)!}\frac{d^{q-1}}{ds^{q-1}}\left[(s-p_i)^qF(s)\frac{z}{z-e^{sT}}\right]\right|_{s=p_i}`]),
    22:page("保持样本固定为 1，用项数和 z 改变加权级数的收敛。","例 7-1 从单位阶跃的等比级数求和。",[["推导","n≥0 各次采样均为 1，所以从项 1、z⁻¹、z⁻²… 求和。公比 z⁻¹，收敛域 |z|>1。"]],seriesModel(true),[String.raw`\mathcal Z[1(t)]=\frac{1}{1-z^{-1}}=\frac{z}{z-1},\quad |z|>1`]),
    23:page("让 aT 决定每个样本的衰减，并同步显示极点与有限和。","例 7-2 指数样本本来就在衰减，乘 z⁻ⁿ 后仍组成等比级数。",[["推导","f(nT)=e⁻ᵃⁿᵀ，公比 e⁻ᵃᵀ z⁻¹，收敛域 |z|>e⁻ᵃᵀ；a、T 为正时极点在单位圆内。"],["示意设置","T=1，aT=0.5。"]],seriesModel(false),[String.raw`\mathcal Z[e^{-at}]=\frac1{1-e^{-aT}z^{-1}}=\frac{z}{z-e^{-aT}}`]),
    24:{...page("用拆分、查表、通分三步保留前两页结果的直接复用。","例 7-3 从 F(s) 的两个简单部分分式求 z 变换。",[["连续时域","f(t)=(1−e⁻ᵃᵗ)/a，a≠0。直接复用单位阶跃和指数的变换，对两者作线性组合。"]]),staticBody:splitReference},
    25:{...page("放大二重极点的消去、求导和代值三个动作。","例 7-4 对单位斜坡 f(t)=t 使用留数法。",[["关键","F(s)=1/s² 在原点有二重极点，留数由一阶导数得到。也可通过对等比级数求导推回同一答案。"]]),staticBody:rampReference},
    26:page("把两个共轭极点放到单位圆，旁边按留数相加说明实系数。","例 7-5 余弦的两个一阶复极点各贡献一个留数。",[["原例","F(s)=s/(s²+ω²)，极点 s=±jω。各留数是半个 z/(z−e±ʲωᵀ)。"],["变为实系数","两根相加为 2cosωT，乘积为 1。"]],cosineExample,[String.raw`F(z)=\frac12\left(\frac{z}{z-e^{-j\omega T}}+\frac{z}{z-e^{j\omega T}}\right)=\frac{z^2-z\cos\omega T}{z^2-2z\cos\omega T+1}`]),
    27:page("在线性组合图观察系数，然后以换元过程连到滞后定理。","线性组合可逐项变换；因果序列延迟 k 拍后在 z 域乘 z⁻ᵏ。",[["线性","常系数 aᵢ 可移出变换；原函数求和变成各 Fᵢ(z) 求和。"],["延迟证明","先提出 z⁻ᵏ，以 p=n−k 换元。p<0 的样本全为零，求和重新从 p=0 开始。"]],linearCheck,[String.raw`\mathcal Z\left[\sum_i a_i f_i(t)\right]=\sum_i a_iF_i(z),\qquad \mathcal Z[f(t-kT)]=z^{-k}F(z)`]),
    28:page("拖动位移拍数，前后对照验证右移补零与左移减初值。","因果延迟在 z 域乘 z⁻ᵏ，单边超前须先扣掉被移出的前 k 项。",[["位移定理","原例先显示 k=2 的右移，再与左移对照。时间向右为滞后，向左为超前；都属于位移定理。"]],delayModel,[String.raw`\mathcal Z[f(t-kT)]=z^{-k}F(z),\qquad \mathcal Z[f(t+kT)]=z^k\left[F(z)-\sum_{m=0}^{k-1}f(mT)z^{-m}\right]`])
  });
})();
