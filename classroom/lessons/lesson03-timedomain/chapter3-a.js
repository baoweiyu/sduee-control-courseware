"use strict";

(() => {
  const {choices:C,range:R,escape:esc,plot,readouts,note,ink}=IntroWidgets;
  const M=IntroModels, T=String.raw;
  const royal="#544691", pale="#eeebf8", grey="#655b79";
  const fmt=(v,places=2)=>Number.isFinite(v)?Number(v.toFixed(places)).toString():"—";
  const s=(label,body,viewBox="0 0 720 280")=>'<svg viewBox="'+viewBox+'" role="img" aria-label="'+esc(label)+'">'+body+'</svg>';
  const tag=(v,x,y,size=20,color="#2c2440",align="middle")=>
    '<text x="'+x+'" y="'+y+'" fill="'+color+'" font-size="'+size+'" font-weight="620" text-anchor="'+align+'">'+esc(v)+'</text>';
  const rect=(x,y,w,h,fill="#fff",stroke="#ddd7e8")=>
    '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="10" fill="'+fill+'" stroke="'+stroke+'"/>';
  const line=(d,stroke=royal,width=2)=>
    '<path d="'+d+'" fill="none" stroke="'+stroke+'" stroke-width="'+width+'" stroke-linejoin="round" stroke-linecap="round"/>';
  const circle=(x,y,color=royal,r=4)=>
    '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="white" stroke="'+color+'" stroke-width="2"/>';
  const detail=(heading,text)=>'<section class="text-block"><h3>'+esc(heading)+'</h3><p>'+esc(text)+'</p></section>';
  const human=(name,value)=>[name,value];
  const rows=draw=>Array.from({length:M.steps+1},(_,i)=>({t:i*M.dt,...draw(i*M.dt)}));
  const chart=(time,options,...data)=>plot(data.map(([series,key,label,color,dash])=>({series,key,label,color,dash})),time,options);

  function steps(labels,active){
    const cols=labels.length>4?3:labels.length, count=Math.ceil(labels.length/cols);
    const w=(680-(cols-1)*18)/cols;
    return s(labels.join("，"),labels.map((title,i)=>{
      const x=20+(i%cols)*(w+18),y=48+Math.floor(i/cols)*86,on=i===active;
      const arrow=i%cols<cols-1&&i<labels.length-1?line("M"+(x+w)+" "+(y+31)+"h17m-5-5 5 5-5 5","#9b8db7",1.6):"";
      return rect(x,y,w,62,on?pale:"#fdfcfe",on?royal:"#ddd7e8")+tag(title,x+w/2,y+39,20,on?royal:grey)+arrow;
    }).join(""),"0 0 720 "+(count*88+70));
  }
  function stage(title,entries,labels=entries.map(([name])=>name)){
    return {title,visual:"source-concept",timed:false,controls:[C("focus","阅读步骤",labels)],
      draw({focus}){return {art:IntroWidgets.stepList(labels,focus),detail:detail(...entries[focus])};}};
  }

  const outline = [
    ["时域性能指标","从超调量、调节时间与稳态误差读出控制系统的性能。"],
    ["一阶系统","考察时间常数对阶跃、斜坡和脉冲响应的影响。"],
    ["二阶系统","用阻尼比和无阻尼自然频率分析响应。"],
    ["高阶系统","识别主要模态和可用的一、二阶近似。"],
    ["稳定性","建立稳定性概念并学习代数判据。"],
    ["稳态误差","用系统型别和误差系数判断跟踪精度。"]
  ];
  const inputs = [
    ["阶跃函数","位置函数","突发给定变化，例如开关突然合闸。"],
    ["斜坡函数","等速度函数","等速运动的目标，或数控机床等速进给。"],
    ["抛物线函数","等加速度函数","跟踪目标以恒定加速度运动。"],
    ["脉冲函数","瞬时冲击","一次敲击、碰撞或电网瞬时扰动。"],
    ["正弦函数","周期函数","等幅周期输入用于分析频率响应。"]
  ];

  function signalValue(kind,t,a,width,omega){
    if(t<0)return 0;
    switch(kind){
      case 0:return a;
      case 1:return a*t;
      case 2:return .5*a*t*t;
      case 3:return t>0&&t<width?a/width:0;
      default:return a*Math.sin(omega*t);
    }
  }
  function waveArt({kind,amplitude,width=.7,omega=1.8,probe}){
    const tx=t=>130+t*89, h=kind===4?102:164, mid=kind===4?136:218;
    const peak=kind===1?6*amplitude:kind===2?18*amplitude:kind===3?amplitude/width:amplitude;
    const yLimit=[2.2,13.2,39.6,Math.max(2.4,Math.ceil(peak/4)*4),2.2][kind];
    const y=v=>mid-h*v/yLimit;
    const value=t=>signalValue(kind,t,amplitude,width,omega);
    const point=([t,v])=>tx(t).toFixed(1)+" "+y(v).toFixed(1);
    let coords;
    if(kind===0)coords=[[-1.05,0],[0,0],[0,amplitude],[6,amplitude]];
    else if(kind===3)coords=[[-1.05,0],[0,0],[0,peak],[width,peak],[width,0],[6,0]];
    else coords=Array.from({length:142},(_,i)=>{const t=-1.05+.05*i;return [t,value(t)];});
    const axis=line("M36 "+mid+"H675m-8-6 8 6-8 6M130 239V19m-5 8 5-8 5 8","#86779d",1.5);
    const ticks=[0,1,2,3,4,5,6].map(t=>line("M"+tx(t)+" "+(mid-4)+"v8","#9b8dad",1)+tag(t,tx(t),mid+26,15,grey)).join("");
    const cursor=line("M"+tx(probe)+" 22V235","#ad93b3",1.4)+circle(tx(probe),y(value(probe)),royal,6);
    const fill=kind===3?'<path fill="#dcd3f2" d="M'+point([0,0])+'L'+point([0,peak])+'L'+point([width,peak])+'L'+point([width,0])+'Z"/>':"";
    const levels=kind===4?tag("＋A",82,y(amplitude)+5,15,grey)+tag("−A",82,y(-amplitude)+5,15,grey):
      kind===3?tag("A / ε",85,y(peak)+4,16,grey):kind===0?tag("A",93,y(peak)+5,17,grey):"";
    const signalScale=line("M126 "+y(yLimit)+"h8","#9b8dad",1)+tag(fmt(yLimit),116,y(yLimit)+4,14,grey,"end");
    return s(inputs[kind][0]+"波形",rect(18,12,682,246,"#fcfbfd")+fill+axis+ticks+levels+signalScale+
      tag("r(t)",104,25,17,grey)+tag("t / s",675,mid+24,17,grey)+
      line("M"+coords.map(point).join("L"),royal,3.5)+cursor);
  }
  function signal(kind){
    const isChooser=kind===undefined, isImpulse=kind===3||isChooser, isSine=kind===4||isChooser;
    const controls=[
      ...(isChooser?[C("kind","信号",["阶跃","斜坡","抛物线","脉冲","正弦"])]:[]),
      R("amplitude",kind===3?"脉冲面积 A":isChooser?"系数 / 面积 A":"系数 A",.3,2,.05,1),
      ...(isImpulse?[R("width","脉冲宽度 ε",.1,1.8,.05,.6," s")]:[]),
      ...(isSine?[R("omega","角频率 ω",.65,3.5,.05,1.8," rad/s")]:[]),
      R("probe","观察时刻",-.75,6,.05,1.3," s")
    ];
    return {title:isChooser?"选择标准输入":inputs[kind][0]+"波形",visual:"source-signal",timed:false,draggable:"probe",controls,
      draw(st){
        const k=kind??st.kind, point=signalValue(k,st.probe,st.amplitude,st.width,st.omega);
        const extras=k===3?[["面积 A",fmt(st.amplitude)],["脉冲高度",fmt(st.amplitude/st.width)]]:
          k===4?[["周期 T",fmt(2*Math.PI/st.omega)+" s"]]:
          k===1?[["斜率",fmt(st.amplitude)]]:k===2?[["加速度",fmt(st.amplitude)]]:[["跃变量",fmt(st.amplitude)]];
        return {art:waveArt({...st,kind:k}),activeRows:["amplitude","probe",...k===3?["width"]:k===4?["omega"]:[]],
          readouts:readouts([["当前 r(t)",fmt(point)],...extras]),detail:detail(inputs[k][1],inputs[k][2])};
      }};
  }

  const metrics = [
    ["稳态值与误差带","以 c(∞) 为中心画出允许的相对误差范围。"],
    ["延迟时间 t_d","输出首次达到稳态值 50% 所需时间。"],
    ["上升时间 t_r","有超调时从起点量到首次达到稳态值；无超调时取 10% 到 90% 的间隔。"],
    ["峰值时间 t_p","输出到达第一个超调峰值的时间。"],
    ["超调量 σ%","峰值相对稳态值的超出量除以稳态值，转为百分数。"],
    ["调节时间 t_s","从输入施加到响应进入并一直保持在允许误差带内的时间。"]
  ];
  function second(t,w,z){
    if(z===1)return 1-(1+w*t)*Math.exp(-w*t);
    const k=Math.sqrt(Math.abs(z*z-1));
    if(z<1)return 1-Math.exp(-z*w*t)*(Math.cos(w*k*t)+z/k*Math.sin(w*k*t));
    const slow=-w/(z+k), fast=-w*(z+k);
    return 1+(fast*Math.exp(slow*t)-slow*Math.exp(fast*t))/(slow-fast);
  }
  function crossing(target,f){
    let lo=0,hi=0;
    for(let t=0;t<=30;t+=.02){if(f(t)>=target){lo=Math.max(0,t-.02);hi=t;break;}}
    for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(f(mid)>=target)hi=mid;else lo=mid;}
    return hi;
  }
  function metricsLab(focusable){
    return {title:focusable?"逐项定位响应指标":"暂态与稳态的读法",chartTitle:"欠阻尼阶跃响应",visual:"source-analysis",
      controls:[C("band","误差带",["±5%","±2%"]),
        C("focus","指标",["稳态","延迟","上升","峰值","超调","调节"],focusable?0:2)],
      draw({band,focus,time}){
        const w=1.5,z=.48,gap=band?.02:.05, wn=w*Math.sqrt(1-z*z);
        const d=rows(t=>({y:second(t,w,z),lower:1-gap,upper:1+gap,ref:1}));
        const td=crossing(.5,t=>second(t,w,z)),tr=(Math.PI-Math.acos(z))/wn,tp=Math.PI/wn;
        const mp=100*Math.exp(-Math.PI*z/Math.sqrt(1-z*z));
        const tail=Math.log(1/(gap*Math.sqrt(1-z*z)))/(z*w);
        let last=0;
        for(let t=0;t<=tail;t+=.01){if(Math.abs(second(t,w,z)-1)>gap)last=t;}
        let lo=last,hi=last+.011;
        for(let i=0;i<18;i++){const mid=(lo+hi)/2;if(Math.abs(second(mid,w,z)-1)>gap)lo=mid;else hi=mid;}
        const where=[undefined,td,tr,tp,tp,hi][focus];
        const names=["稳态值","t_d","t_r","t_p","σ","t_s"];
        const result=["1",fmt(td)+" s",fmt(tr)+" s",fmt(tp)+" s",fmt(mp)+"%",fmt(hi)+" s"][focus];
        const marked=where===undefined?[]:[{series:d,key:"y",t:where,label:names[focus],color:royal}];
        return {art:IntroWidgets.stepList(["找稳态","读曲线","判性能"],focus===0?0:focus===5?2:1),
          chart:chart(time,{high:1.35,unit:"c(t)",event:where,annotations:marked},
            [d,"lower","误差带下限",ink.orange,true],[d,"upper","误差带上限",ink.orange,true],
            [d,"ref","稳态值",ink.target,true],[d,"y","阶跃响应",ink.teal]),
          readouts:readouts([[names[focus],result],["允许误差带",fmt(gap*100)+"%"]]),
          detail:detail(...metrics[focus])};
      }};
  }

  const firstPoint=(mode,t,tau)=>{
    const e=Math.exp(-t/tau);
    return [1-e,t-tau+tau*e,e/tau][mode];
  };
  const firstNames=["阶跃","斜坡","脉冲"];
  function firstLab(mode,theme={}){
    return {title:theme.title||"时间常数 T 决定响应快慢",chartTitle:theme.chartTitle||"一阶系统的单位输入响应",visual:"source-analysis",draggable:"tau",
      controls:[...(mode===undefined?[C("mode","输入",firstNames)]:[]),R("tau","时间常数 T",.25,2.8,.05,1," s"),
        ...(theme.band?[C("band","误差带",["±5%","±2%"])]:[])],
      draw(st){
        const m=mode??st.mode, {time,tau}=st, gap=st.band?.02:.05;
        const d=rows(t=>({r:m===1?t:1,y:firstPoint(m,t,tau),lower:1-gap,ten:.1,ninety:.9}));
        const isStep=m===0, settle=-tau*Math.log(gap);
        const indicators=m===0?[["上升时间",fmt(tau*Math.log(9))+" s"],["调节时间",fmt(settle)+" s"],["h(T)","0.632"]]:
          m===1?[["稳态误差",fmt(tau)],["等效滞后",fmt(tau)+" s"],["c(T)",fmt(tau/Math.E)]]:
          [["g(0)",fmt(1/tau)],["初始斜率",fmt(-1/(tau*tau))],["g(T)",fmt(1/(Math.E*tau))]];
        if(theme.fullMeasures)indicators.splice(1,1,["调节时间（5%）",fmt(-tau*Math.log(.05))+" s"],["调节时间（2%）",fmt(-tau*Math.log(.02))+" s"]);
        const ymax=m===0?1.21:m===1?12.6:Math.max(1.15,1.15/tau);
        const pl=[d,"y","输出",ink.teal];
        const baseline=m===2?[]:[[d,"r","输入",ink.target,true]];
        if(theme.band&&isStep)baseline.push([d,"lower","误差下界",ink.orange,true]);
        const marks=theme.thresholds?[
          {series:d,key:"y",t:-tau*Math.log(.9),label:"10%",color:ink.blue,offset:[40,-24]},
          {series:d,key:"y",t:-tau*Math.log(.1),label:"90%",color:ink.blue,offset:[25,-28]}
        ]:[{series:d,key:"y",t:tau,label:"t = T",color:royal}];
        if(theme.thresholds)baseline.push([d,"ten","10%",ink.blue,true],[d,"ninety","90%",ink.blue,true]);
        return {art:theme.art?theme.art(st):steps([firstNames[m]+"输入","1/(Ts+1)","输出响应"],1),
          chart:chart(time,{high:ymax,unit:m===2?"g(t)":"归一化",event:theme.band&&isStep?settle:undefined,annotations:marks},...baseline,pl),
          readouts:readouts(indicators),
          detail:detail(firstNames[m]+"响应",["在 t=T 时达到约 63.2% 的稳态值。","长期输出趋近 t−T，误差趋于 T。","衰减时间仍由 T 决定。T 小时曲线更尖。"][m])};
      }};
  }

  window.SourcePolishCh3 ??= {};
  Object.assign(window.SourcePolishCh3,{
    1:{
      objective:"用六节路线展开第三章的分析次序，保留章节的三项性能目标。",
      lead:"根据系统的时间响应，分析稳定性、暂态性能与稳态精度。",
      sections:outline,lab:stage("第三章的学习顺序",outline,["时域指标","一阶系统","二阶系统","高阶系统","稳定性","稳态误差"])
    },
    2:{
      objective:"让建模、读曲线、算指标与改设计按原页次序排成可选择的完整路径。",
      lead:"时域分析直接研究响应 c(t)，用曲线判断动态性能和稳态精度。",
      sections:[
        ["时域分析法","根据系统的时间响应分析和设计，特别适合低阶系统。它使响应可直接观察，也可以在模型给出后通过求解微分方程得到结果。"],
        ["生活实例","汽车驶过减速带，路面突起使悬架受到突变输入，车身高度在随后的时间内变化。"],
        ["分析路径","建模 → 求响应 → 算指标 → 评价并改进设计。"]
      ],
      lab:stage("从减速带场景到时域分析",[
        ["建模","以悬架为研究对象，识别路面输入与车身高度输出，然后列写微分方程。"],
        ["求响应","得到车身高度随时间变化的曲线。"],
        ["计算指标","从曲线读出超调量、调节时间及稳态偏差。"],
        ["评价改进","结合快速性、平稳性和准确性的要求改进设计。"]],["建模","求响应","算指标","改设计"])
    },
    3:{
      objective:"在同一坐标上切换五类典型输入，说明标准条件为何有利于横向比较。",
      lead:"实际输入复杂且常有随机性。选用典型输入便于分析，也让系统性能有共同的比较条件。",
      sections:[...inputs.map(([name,type,example])=>[name,type+"。"+example]),["信号发生器","实验室设备可产生阶跃、斜坡、脉冲和正弦等标准信号。"]],
      lab:signal()
    },
    4:{
      objective:"拖动幅值和时刻，读出 t=0 前后瞬间跳变的阶跃信号。",
      lead:"阶跃表示给定值或开关在 t=0 的突然变化。",
      sections:[["定义","t<0 时为零，t≥0 时保持 A。A=1 时记作单位阶跃 1(t)。"],["常见输入","例如给定值突然改变，或开关突然合闸。"]],
      math:[T`r(t)=A\cdot 1(t),\qquad\mathcal L[1(t)]=\frac1s`],lab:signal(0)
    },
    5:{
      objective:"用实际斜率 A 改变波形，配合时间探针读出等速度输入的含义。",
      lead:"斜坡函数从零开始按固定速度增长，曲线的斜率等于系数 A。",
      sections:[["定义","t<0 时 r=0，t≥0 时 r=At；A=1 时为单位斜坡。"],["应用","用它描述匀速目标的跟踪输入或数控机床等速进给。"]],
      math:[T`r(t)=At\cdot 1(t),\qquad\mathcal L[t\cdot 1(t)]=\frac1{s^2}`],lab:signal(1)
    },
    6:{
      objective:"改变加速度与观察时刻，在同一条曲线上说明位移增长和斜率的变化。",
      lead:"抛物线表示恒加速度输入，斜率（速度）随时间线性增加。",
      sections:[["定义","t<0 时 r=0，t≥0 时 r=At²/2；A=1 时为单位抛物线。"],["应用","例如目标由静止开始匀加速移动。"]],
      math:[T`r(t)=\tfrac12 At^2\cdot 1(t),\qquad\mathcal L[\tfrac12t^2\cdot 1(t)]=\frac1{s^3}`],lab:signal(2)
    },
    7:{
      objective:"缩窄脉冲并提高峰值，突出保持面积而非保持峰值的极限关系。",
      lead:"宽度为 ε 的矩形脉冲高度为 A/ε，面积为 A。让 ε 逐步趋于零得到冲激。",
      sections:[["有限宽脉冲","在 0<t<ε 内为 A/ε，其余时刻为零。"],["理想冲激","持续时间趋于零且面积为 A 时，极限为 Aδ(t)。A=1 是单位冲激。"],["应用","敲击、碰撞和短时电网扰动可用冲激近似。"]],
      math:[T`\int_{-\infty}^{\infty}\delta(t)\,dt=1,\qquad\mathcal L[\delta(t)]=1`],lab:signal(3)
    },
    8:{
      objective:"分别控制幅值和角频率，在波形上核对周期与等幅振荡。",
      lead:"正弦输入的幅值为 A，角频率为 ω，周期为 2π/ω。",
      sections:[["定义","t≥0 时 r=A sin(ωt)，此前为零。"],["应用","系统对不同频率正弦输入的稳态响应称为频率响应，后续频域分析将用到。"]],
      math:[T`r(t)=A\sin(\omega t)\cdot 1(t),\quad T=2\pi/\omega,\quad\mathcal L[r]=\frac{A\omega}{s^2+\omega^2}`],lab:signal(4)
    },
    9:{
      objective:"保留输入与响应两列关系，把向右积分、向左求导和适用条件放在同一页。",
      lead:"在线性时不变系统中，以零初始条件研究时，输入之间的积分或求导关系也适用于相应输出。",
      sections:[["从冲激到抛物线","冲激 → 阶跃 → 斜坡 → 抛物线，逐次积分；逆向逐次求导。"],
        ["从一条响应恢复其它响应","冲激响应等于阶跃响应的导数。斜坡响应等于阶跃响应从零到 t 的积分。"]],
      math:[T`k(t)=\frac{d h(t)}{dt},\qquad c(t)=\int_0^t h(\tau)\,d\tau`],
      lab:stage("输入积分与相应输出",[
        ["冲激响应","瞬时冲击的响应，积分一次得到阶跃响应。"],["阶跃响应","最常用的测量响应。求导得到冲激响应，积分得到斜坡响应。"],
        ["斜坡响应","用于观察对等速信号的跟踪性能。"],["抛物线响应","用于观察对等加速信号的跟踪性能。"]],["冲激","阶跃","斜坡","抛物线"])
    },
    10:{
      objective:"让学生先根据运动或扰动的形态选择信号，再看老师的选用原则。",
      lead:"选择与实际输入主导特征相似的标准信号。跨系统比较时通常统一用单位阶跃。",
      sections:[["给定突然变","使用阶跃函数。"],["随时间匀速增长","使用斜坡函数。匀速目标跟踪示例把天线转角近似为随时间线性增长。"],
        ["输入具有周期性","振动或交流信号等用正弦函数。"]],
      lab:{
        title:"用波形表示实际给定",visual:"source-signal",timed:false,draggable:"probe",
        controls:[C("scenario","给定情形",["设定值突变","匀速目标","周期振动"]),R("probe","观察时刻",-.75,6,.05,1.3," s")],
        draw({scenario,probe}){
          const kind=[0,1,4][scenario], amplitude=1, omega=1.8;
          return {
            art:waveArt({kind,amplitude,omega,probe}),
            readouts:readouts([["选用信号",inputs[kind][0]],["当前 r(t)",fmt(signalValue(kind,probe,amplitude,.7,omega))]]),
            detail:detail(inputs[kind][1],inputs[kind][2])
          };
        }
      }
    },
    11:{
      objective:"从时间响应的两部分切入，逐个定义五个暂态指标。",
      lead:"时间响应可分为暂态与稳态两部分。暂态指标取自阶跃响应曲线。",
      sections:metrics,math:[T`c(t)=c_t(t)+c_{ss}(t)`,T`\sigma\%=\frac{c_{\max}-c(\infty)}{c(\infty)}\times100\%`],
      lab:metricsLab(false)
    },
    12:{
      objective:"用六步走读保留老师的曲线标注顺序，使指标在同一条欠阻尼响应上对应到实际时刻。",
      lead:"先确定稳态值与误差带，再从曲线上定位延迟、上升、峰值、超调和调节时间。",
      sections:metrics,math:[T`\sigma\%=\frac{A}{B}\times100\%,\quad A=c_{\max}-c(\infty),\quad B=c(\infty)`],
      lab:metricsLab(true)
    },
    13:{
      objective:"以单调阶跃响应突出 10% 到 90% 的上升间隔与误差带。",
      lead:"无超调时，用从稳态值 10% 上升到 90% 的时间定义 t_r。",
      sections:[["上升时间","两个阈值首次到达时刻之差称为上升时间。"],["调节时间","进入并持续留在 ±5% 或 ±2% 误差带的首个时刻。"],
        ["峰值","单调趋近稳态时没有有限的峰值时刻，按百分比定义超调量为零。"]],
      lab:firstLab(0,{title:"把阈值放在单调响应上",band:true,thresholds:true})
    }
  });

  const accuracyLab = {
    title:"改静态增益读稳态误差",chartTitle:"给定与实际响应",visual:"source-analysis",draggable:"gain",
    controls:[R("gain","静态增益 K",.25,1.25,.05,.75)],
    draw({gain,time}){
      const d=rows(t=>({r:1,y:gain*(1-Math.exp(-t/1.2)),ss:gain}));
      return {art:steps(["期望 r","实际 c","误差 r−c"],2),
        chart:chart(time,{high:1.4,unit:"相对值"},[d,"r","期望值",ink.target,true],[d,"ss","c(∞)",ink.orange,true],[d,"y","实际响应",ink.teal]),
        readouts:readouts([["c(∞)",fmt(gain)],["稳态误差",fmt(1-gain)],["当前误差",fmt(1-M.at(d,time).y)]]),
        detail:detail("持续偏差","使 K 接近 1，观察稳态输出与单位给定值之间的间隔缩小。")};
    }
  };

  function processArt(rc,output){
    if(rc)return s("RC 电路的电容电压",rect(25,24,670,232,"#fbf9fd")+
      line("M147 102H247l10-12 13 24 13-24 13 24 13-24 13 24 13-12H496V136M471 136h50m-50 19h50M496 155v55H147v-57",royal,3)+
      '<circle cx="147" cy="128" r="25" fill="#eee7f6" stroke="#6b5d91" stroke-width="2"/>'+
      line("M138 122h18m-9-9v18M138 139h18",grey)+tag("uᵢ",107,134,23)+tag("R",291,71,24)+
      tag("C",547,148,23)+tag("u꜀ = "+fmt(output),576,191,19));
    const waterY=190-66*output;
    return s("水箱的液位与进出水",rect(25,24,670,232,"#fbf9fd")+
      '<rect x="265" y="'+waterY+'" width="201" height="'+(212-waterY)+'" fill="#c7d7ec"/>'+
      line("M264 84v129h203V84M148 61h166v38m-9-9 9 9 9-9M467 191h103m-10-8 10 8-10 8",royal,3)+
      line("M265 "+waterY+"H467","#3a6691",2)+
      tag("进水 qᵢ",193,48,20)+tag("液位 h",367,169,20)+tag("出水 h/R",568,230,19));
  }
  const prototypes = {
    title:"同一惯性结构，两种物理对象",chartTitle:"单位给定下输出如何趋于平衡",visual:"source-analysis",draggable:"resistance",
    controls:[C("kind","物理对象",["水箱","RC 电路"]),R("storage","截面积 / 电容",.5,1.6,.05,1),
      R("resistance","液阻 / 电阻",.45,1.75,.05,1)],
    draw({kind,storage,resistance,time}){
      const tau=storage*resistance, gain=kind?1:resistance;
      const d=rows(t=>({y:gain*(1-Math.exp(-t/tau)),ss:gain}));
      const p=M.at(d,time);
      return {art:processArt(kind,p.y),
        chart:chart(time,{high:1.95,unit:"输出（相对值）"},[d,"ss","平衡值",ink.target,true],[d,"y",kind?"电容电压":"液位",ink.teal]),
        readouts:readouts([["时间常数",fmt(tau)+" s"],["平衡值",fmt(gain)]]),
        detail:detail(kind?"RC 电路":"水箱物料平衡",kind?"电阻与电容乘积 RC 决定响应速度，单位给定的终值为 1。":"截面积与液阻乘积 AR 决定响应速度。单位流量增量下最终液位增量为 R。")};
    }
  };

  function poles(z,w){
    if(z<1)return {a:-z*w,b:-z*w,imag:w*Math.sqrt(1-z*z)};
    const root=Math.sqrt(z*z-1);
    return {a:-w/(z+root),b:-w*(z+root),imag:0};
  }
  function polesArt({a,b,imag},mark="闭环极点"){
    const scale=Math.min(355/(Math.max(1.2,Math.abs(a),Math.abs(b))*1.12), 97/(Math.max(1,imag)*1.11));
    const px=r=>533+r*scale,py=j=>135-j*scale;
    const direction=imag&&a<0?line("M533 135L"+px(a)+" "+py(imag),"#b1a1c4",1.4):"";
    return s(mark,rect(20,18,680,232,"#fbfafc")+
      line("M45 135h621m-8-6 8 6-8 6M533 230V41m-6 8 6-8 6 8","#9e94b0",1.8)+
      tag("Re",661,160,17,grey)+tag("Im",559,48,17,grey)+direction+
      [[a,imag],[b,-imag]].map(([r,j],i)=>{
        const x=px(r),y=py(j);
        return line("M"+(x-7)+" "+(y-7)+"l14 14m-14 0l14-14",i?ink.blue:royal,3);
      }).join("")+
      tag(a===b&&!imag?"重根 "+fmt(a):"根示意",112,225,17,grey));
  }

  function secondLab(type){
    const fixed=type==="zero", over=type==="over", presets=type==="presets", mathOnly=type==="poles"||presets;
    const select=presets?[C("damping","阻尼状态",["零阻尼","欠阻尼","临界阻尼","过阻尼"])]:[];
    const zControl=fixed||presets?[]:[R("z","阻尼比 ζ",over?1.05:type==="poles"?0:.15,over?3:2.5,.05,over?1.5:.45)];
    return {title:mathOnly?"闭环根在复平面的位置":"阻尼比与自然频率塑造响应",chartTitle:over?"过阻尼与临界阻尼对照":"二阶系统阶跃响应",
      timed:!mathOnly,visual:"source-analysis",draggable:fixed||presets?"w":"z",
      controls:[...select,...zControl,R("w","自然角频率 ωₙ",.7,3.4,.05,1.35," rad/s")],
      draw(st){
        const z=fixed?0:presets?[0,.45,1,1.5][st.damping]:st.z,w=st.w;
        const root=poles(z,w),d=rows(t=>({y:second(t,w,z),c:second(t,w,1),ref:1}));
        const status=z===0?"等幅振荡":z<1?"衰减振荡":z===1?"临界阻尼":"单调缓慢趋稳";
        const rp=fmt(root.a), bp=fmt(root.b);
        const roots=root.imag?rp+" ± j"+fmt(root.imag):rp+(root.a===root.b?"（重根）":" / "+bp);
        const meter=[["闭环极点",roots],["响应",status]];
        if(fixed)meter.push(["振荡周期",fmt(2*Math.PI/w)+" s"]);
        if(type==="poles"&&z<1)meter.push(["阻尼角 β",fmt(Math.acos(z)*180/Math.PI)+"°"]);
        const art=polesArt(root,mathOnly?"闭环极点位置":"阶跃响应对应的闭环极点");
        const current=[d,"y",fixed?"零阻尼":over?"过阻尼":"阶跃响应",ink.teal];
        const ref=over?[d,"c","临界阻尼",ink.blue,true]:[d,"ref","单位给定",ink.target,true];
        return {art,chart:mathOnly?undefined:chart(st.time,{high:2.1,unit:"相对值"},ref,current),readouts:readouts(meter),
          detail:detail("极点与响应",z===0?"纯虚极点使振荡持续。":z<1?"极点实部控制衰减，虚部决定振荡频率。":z===1?"两个实极点重合。":"较近原点的一根衰减慢，在响应后段占主导。")};
      }};
  }

  const stepMath=T`h(t)=1-e^{-t/T}\quad(t\ge0)`;
  const rampMath=T`c(t)=t-T+Te^{-t/T},\qquad e_{ss}=\lim_{t\to\infty}[t-c(t)]=T`;
  const impulseMath=T`g(t)=\frac{1}{T}e^{-t/T}=\frac{dh(t)}{dt}\quad(t\ge0)`;
  const tfMath=T`\Phi(s)=\frac{1}{Ts+1}`;
  const relation=T`g(t)=\frac{dh(t)}{dt}=\frac{d^2 c(t)}{dt^2}`;
  const secondMath=T`\Phi(s)=\frac{\omega_n^2}{s^2+2\zeta\omega_n s+\omega_n^2}`;
  const firstOverview=[
    ["单位脉冲响应","g(0)=1/T，初始斜率 −1/T²。"],
    ["单位阶跃响应","h(T)=1−e⁻¹≈0.632，误差带 ±5% 时调节时间约为 3T。"],
    ["单位斜坡响应","输出的渐近线为 t−T，稳态误差为 T。"]
  ];

  Object.assign(window.SourcePolishCh3,{
    14:{
      objective:"以给定值与响应终值的垂直间隔表示稳态误差，并归纳平稳性、快速性和精度。",
      lead:"对单位负反馈系统，稳态误差是期望输入减实际输出的极限。",
      sections:[
        ["稳态精度","稳态误差反映系统复现输入的精度。单位负反馈下 e_ss=lim[r(t)−c(t)]。"],
        ["各指标意义","t_d、t_r、t_p 描述初始阶段快慢；超调量描述振荡程度；调节时间描述动态过程速度；稳态误差描述准确性。"],
        ["常用三项","超调量 σ%、调节时间 t_s、稳态误差 e_ss。"]
      ],
      math:[T`e_{ss}=\lim_{t\to\infty}[r(t)-c(t)]`],lab:accuracyLab
    },
    15:{
      objective:"把水箱的物料平衡和 RC 回路的电压平衡分别绘出，验证二者都归结为一阶结构。",
      lead:"水箱和 RC 电路的物理对象不同，但均可归结为带有时间常数 T 的一阶方程。",
      sections:[
        ["水箱液位","输入为进水流量增量 qᵢ，输出为液位增量 h，液阻 R 表示线性化出水关系。物料平衡给出 T=AR。"],
        ["RC 电路","输入为 uᵢ，输出为电容电压 u꜀。回路方程给出 T=RC。"],
        ["通用式","当经过单位增益归一化，得到 T·dc/dt+c=r；水箱未归一化时右侧仍为 Rqᵢ。"]
      ],
      math:[T`A\dot h=q_i-h/R,\quad AR\dot h+h=Rq_i`,T`Ri+u_C=u_i,\quad i=C\dot u_C,\quad RC\dot u_C+u_C=u_i`,tfMath],
      lab:prototypes
    },
    16:{
      objective:"从分式展开建立阶跃公式，再顺曲线读出开始斜率和最终跟踪。",
      lead:"一阶单位阶跃响应由稳态分量 1 和衰减分量 −e⁻ᵗᐟᵀ 相加。",
      sections:[
        ["阶跃变换","令 R(s)=1/s，与传递函数相乘后拆成两项并反变换。"],
        ["三个指标","上升时间约 2.2T，±5% 调节时间约 3T，±2% 约 4T。单位阶跃的稳态误差为零。"],
        ["曲线特征","起点斜率最大，为 1/T。t=4T 时响应约为 98.2%。"]
      ],
      math:[T`C(s)=\frac{1}{s(Ts+1)}=\frac1s-\frac1{s+1/T}`,stepMath],lab:firstLab(0)
    },
    17:{
      objective:"保留老师的 T 滑块和四项数值，用指数模型让曲线与性能读数同步。",
      lead:"拖动 T，同一单位阶跃的响应速度随系统惯性变化。",
      sections:[
        ["上升时间","从 10% 到 90% 的间隔为 T·ln 9，约 2.2T。"],
        ["调节时间","±5% 的精确阈值时间为 −T·ln 0.05，约 3T。±2% 的精确值约 3.91T，常取 4T。"],
        ["特征点","对所有 T，h(T)=1−e⁻¹≈0.632。"]
      ],
      math:[stepMath,T`t_r=T\ln9,\quad t_s=-T\ln\Delta`],lab:firstLab(0,{title:"时间常数与响应速度实验",band:true,fullMeasures:true})
    },
    18:{
      objective:"让原页斜坡随同一 T 变化，用输入与输出间隔观察恒定的长期跟踪误差。",
      lead:"一阶系统跟踪单位斜坡时，长期输出沿输入直线平行落后一个时间常数。",
      sections:[
        ["反变换","R(s)=1/s²，响应由线性稳态分量 t−T 和指数暂态分量组成。"],
        ["起步和长期误差","起点斜率为零。长期误差趋于 T，等效滞后时间为 T。"],
        ["特征点","到 t=T 时，c(T)=T/e≈0.368T。"]
      ],
      math:[T`C(s)=\frac1{s^2(Ts+1)}=\frac1{s^2}-\frac T s+\frac{T}{s+1/T}`,rampMath],
      lab:firstLab(1,{title:"拖动 T 比较跟踪间隔"})
    },
    19:{
      objective:"用不同 T 值的准确脉冲响应读出峰值、初始斜率及指数衰减。",
      lead:"一阶单位脉冲响应从 1/T 开始，按 e⁻ᵗᐟᵀ 衰减至零。",
      sections:[
        ["反变换","单位脉冲的 R(s)=1，输出的拉氏变换等于 1/(Ts+1)。"],
        ["读数","g(0)=1/T，g′(0)=−1/T²，g(T)=1/(eT)。"],
        ["联系","脉冲响应是阶跃响应的导数。T 小时峰值更高而且衰减更快。"]
      ],
      math:[impulseMath],lab:firstLab(2,{title:"拖动 T 比较冲激响应的峰与尾"})
    },
    20:{
      objective:"沿输入的积分链对照三种一阶响应，避免在不同量纲的纵轴上硬叠曲线。",
      lead:"由脉冲到阶跃再到斜坡的积分链，也连接对应的一阶响应。",
      sections:[...firstOverview,
        ["自检","从特征点或初始斜率反推 T。再比较 ±5% 与 ±2% 的调节时间，以及 r(t)=t 时的稳态误差。"]],
      math:[impulseMath,stepMath,rampMath,relation],lab:firstLab(undefined)
    },
    21:{
      objective:"在同一原页保留两道一阶系统题，每题选择后分别核对理由。",
      lead:"单位负反馈的一阶系统 Φ(s)=1/(Ts+1)，静态增益 K=1。",
      sections:[
        ["题 1（±5% 调节时间）","选项 T、2.2T、3T、T²。工程取 3T；±2% 工程取 4T。"],
        ["题 2（单位斜坡稳态误差）","选项 0、T、2T、∞。单位斜坡输入下误差趋于 T，单位阶跃输入下趋于零。"]
      ],
      quiz:{items:[
        {prompt:"时间常数为 T 的标准一阶系统，单位阶跃响应进入 ±5% 误差带的调节时间约为多少？",options:["T","2.2T","3T","T²"],answers:[2],feedback:"由 exp(−t/T) ≤ 0.05 得 t ≥ −T ln(0.05)，约为 3T。"},
        {prompt:"单位增益、时间常数为 T 的一阶系统跟踪单位斜坡时，稳态误差为多少？",options:["0","T","2T","∞"],answers:[1],feedback:"输入与输出之差趋于 T。"}
      ]}
    },
    22:{
      objective:"保留一阶模型和三种响应的表式回顾，用可切换图形核对公式与 T 的识别。",
      lead:"一阶系统的核心是时间常数 T，三种标准响应由积分与求导相连。",
      sections:[
        ["模型", "单位静态增益下，传递函数 Φ(s)=1/(Ts+1)。"],
        ...firstOverview,
        ["图解 T","初始斜率切线到 h=1 的横坐标为 T，也可直接读 h(T)=0.632。"],
        ["复习指标与预告","最常用的指标为超调量、调节时间和稳态误差。下一节引入阻尼比与自然角频率。"]
      ],
      math:[tfMath,stepMath,rampMath,impulseMath,relation],lab:firstLab(undefined,{title:"第一、二节小结",band:true})
    },
    23:{
      objective:"从悬架物理原型引出二阶响应，再把高阶系统的主导极点安排到下一站。",
      lead:"第二部分讨论阻尼比 ζ 与自然角频率 ωₙ 如何塑造时间响应。",
      sections:[
        ["二阶系统","分析二阶系统的暂态响应和性能指标计算。"],
        ["高阶系统","用主导极点去识别高阶系统的主要动态并作近似。"]
      ],
      lab:{
        title:"从二阶原型到高阶近似",visual:"source-concept",timed:false,controls:[C("part","内容",["二阶系统","高阶近似"])],
        draw({part}){
          const sketch=steps(["二阶分析","高阶近似"],part);
          const art='<div class="hardware-pair"><img src="../../../assets/classroom/spring-bench.webp" alt="弹簧与阻尼装置的实物示意">'+sketch+'</div>';
          return {art,detail:part?detail("高阶系统","选取主导极点，检查近似是否保留重要动态。"):
            detail("二阶系统","弹簧、质量、阻尼装置可用于观察振荡、衰减和响应速度。")};
        }
      }
    },
    24:{
      objective:"把统一的标准二阶形式同物理原型联系起来，分别观察两个特征参数。",
      lead:"典型二阶系统由阻尼比 ζ 和无阻尼自然角频率 ωₙ 表征。",
      sections:[
        ["物理原型","汽车悬架的弹簧、质量和阻尼装置是典型例子。随动系统和 RLC 电路也可得到二阶模型。"],
        ["参数作用","阻尼比决定振荡程度，无阻尼自然角频率决定响应时间尺度。"]
      ],
      math:[T`G(s)=\frac{\omega_n^2}{s(s+2\zeta\omega_n)}`,secondMath],
      lab:secondLab("prototype")
    },
    25:{
      objective:"在可变化的 s 平面上同步读出共轭根、实根及阻尼角。",
      lead:"特征方程的两个根决定衰减快慢和振荡频率。",
      sections:[
        ["欠阻尼根","复共轭根的实部为 −σ，虚部为 ±ω_d。两根到原点的距离均为 ωₙ。"],
        ["阻尼角","极点矢量与负实轴的夹角 β=arccos ζ。ζ 越小，极点方向越靠近虚轴。"],
        ["实根","ζ≥1 时为实根，ζ=1 处重合。"]
      ],
      math:[T`s^2+2\zeta\omega_ns+\omega_n^2=0`,
        T`s_{1,2}=-\zeta\omega_n\pm j\omega_n\sqrt{1-\zeta^2}\quad(0\le\zeta<1)`,
        T`s_{1,2}=-\zeta\omega_n\pm\omega_n\sqrt{\zeta^2-1}\quad(\zeta\ge1)`],
      lab:secondLab("poles")
    },
    26:{
      objective:"用四个原阻尼工况切换极点图，使虚轴、复根、重根与两个实根清楚对照。",
      lead:"ζ 从零增大时，极点从虚轴进入左半平面，在临界阻尼处重合后沿负实轴分开。",
      sections:[
        ["零阻尼 ζ=0","s₁,₂=±jωₙ，极点在虚轴上，属于临界稳定。"],
        ["欠阻尼 0<ζ<1","s₁,₂=−ζωₙ±jω_d，为左半平面的共轭复根。"],
        ["临界阻尼 ζ=1","两个极点都等于 −ωₙ。"],
        ["过阻尼 ζ>1","两个互异负实根。ζ>0 的这四类中除零阻尼外均渐近稳定。"]
      ],
      lab:secondLab("presets")
    },
    27:{
      objective:"只改变自然频率，说明零阻尼的恒幅振荡不会因周期缩短而衰减。",
      lead:"零阻尼时，单位阶跃响应在 0 与 2 之间持续等幅振荡。",
      sections:[
        ["闭环极点","纯虚根 ±jωₙ，系统处于临界稳定。"],
        ["曲线读法","暂态分量是无衰减的余弦，振荡角频率为 ωₙ，周期为 2π/ωₙ。"],
        ["物理图像","理想无耗散的弹簧与质量之间持续交换能量。"]
      ],
      math:[T`C(s)=\frac{\omega_n^2}{s(s^2+\omega_n^2)}=\frac1s-\frac{s}{s^2+\omega_n^2}`,
        T`h(t)=1-\cos\omega_nt\quad(t\ge0)`],
      lab:secondLab("zero")
    },
    28:{
      objective:"在同一自然频率下对照过阻尼与临界阻尼，观察慢极点如何主导后段。",
      lead:"过阻尼阶跃响应单调上升且无超调，较靠近原点的极点通常决定慢尾。",
      sections:[
        ["两个实根","ζ>1 有两个相异负实极点。两个指数暂态项的衰减速度不同。"],
        ["降阶条件","当两极点的时间尺度充分分离且慢项保留时，可忽略快项作一阶近似。"],
        ["工程权衡","在过阻尼范围内，进一步增大阻尼会使响应变慢。"]
      ],
      math:[T`s_{1,2}=-(\zeta\mp\sqrt{\zeta^2-1})\omega_n`,
        T`h(t)=1+A_1e^{s_1t}+A_2e^{s_2t}`],
      lab:secondLab("over")
    }
  });
})();
