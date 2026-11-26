"use strict";
(() => {
  const W=IntroWidgets,M=IntroModels,{range:R,choices:C,readouts,plot,note,ink,escape}=W;
  const span=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
  const f=(v,d=3)=>Number.isFinite(v)?Number(v.toFixed(d)).toString():v===Infinity?"∞":"—";
  const meter=(...entries)=>readouts(entries.map(([k,v])=>[k,typeof v==="number"?f(v):v]));
  const explain=(h,v)=>'<section class="text-block"><h3>'+escape(h)+'</h3><p>'+escape(v)+'</p></section>';
  const rows=draw=>Array.from({length:M.steps+1},(_,i)=>{const t=i*M.dt;return {t,...draw(t)};});
  const graph=(time,opts,...lines)=>plot(lines.map(([series,key,label,color,dash])=>({series,key,label,color,dash})),time,opts);
  const scene=(label,content)=>'<svg viewBox="0 0 640 245" role="img" aria-label="'+escape(label)+'"><rect x="3" y="3" width="634" height="239" rx="12" fill="#f1f7fc"/>'+content+'</svg>';
  const txt=(x,y,label,size=20)=>'<text x="'+x+'" y="'+y+'" font-size="'+size+'" text-anchor="middle" fill="#1c3e59" font-weight="650">'+escape(label)+'</text>';
  const path=(d,color="#577f9d",w=2)=>'<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round"/>';
  const block=(x,y,w,h,label,active)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="8" fill="'+(active?"#dcefe8":"#fff")+'" stroke="#95b4cc"/>'+txt(x+w/2,y+h/2+6,label);
  const chain=(labels,active=-1)=>scene(labels.join(" → "),labels.map((label,i)=>{
    const spacing=479/(labels.length-1),x=12+i*spacing,end=x+spacing;
    return block(x,99,137,51,label,i===active)+(i<labels.length-1?path("M"+(x+137)+" 125H"+(end-5)+"m-7-4 7 4-7 4"):"");
  }).join(""));
  function quadratic(s){
    return {r:-s.z*s.w,im:s.z<1?s.w*Math.sqrt(1-s.z*s.z):0,spread:s.z>1?s.w*Math.sqrt(s.z*s.z-1):0};
  }
  function second(t,w,z){
    if(Math.abs(z-1)<1e-7)return 1-(1+w*t)*Math.exp(-w*t);
    const a=Math.sqrt(Math.abs(z*z-1));
    if(z<1)return 1-Math.exp(-w*z*t)*(Math.cos(w*a*t)+z/a*Math.sin(w*a*t));
    const p=w*(-z+a),q=w*(-z-a);
    return 1+(q*Math.exp(p*t)-p*Math.exp(q*t))/(p-q);
  }
  function poleScene(real,imag,spread=0){
    const xx=r=>Math.max(38,Math.min(588,401+73*r)), yy=i=>Math.max(38,Math.min(210,126-34*i));
    const positions=imag?[[xx(real),yy(imag)],[xx(real),yy(-imag)]]:[[xx(real+spread),126],[xx(real-spread),126]];
    return scene("闭环极点在 s 平面上的位置",path("M21 126H607M401 25V213")+txt(600,114,"Re",15)+txt(419,39,"Im",15)+
      positions.map(([x,y])=>path("M"+(x-6)+" "+(y-6)+"l12 12m0-12-12 12",ink.orange,3.8)).join("")+
      txt(199,205,"左半平面",17)+txt(502,205,"右半平面",17));
  }
  function spectrum(s){const p=quadratic(s);return poleScene(p.r,p.im,p.spread);}
  function wave(code,t,amplitude=.8){
    if(t<0)return 0;
    return code===0?amplitude:code===1?amplitude*t/7:amplitude*t*t/65;
  }
  const groups=[
    {
      title:"如何用标准输入问系统的问题",source:span(1,10),
      points:[["时域方法","用典型输入引起的输出直接观察速度、平稳程度和精度。输入选择由系统实际工况与希望观察的性质决定。"],["五类输入","阶跃模拟突变，斜坡模拟匀速指令，抛物线模拟匀加速，脉冲激发自由模态，正弦反映周期性激励。"],["微积分关系","单位阶跃的分布导数是单位冲激，单位斜坡的导数是阶跃，单位抛物线 t²/2 的导数是斜坡。冲激的矩形近似以保持面积为 1 为准。"]],
      lab:{title:"把同一组信号送进系统",chartTitle:"典型输入与一阶响应",controls:[C("signal","输入",["阶跃","斜坡","抛物线","脉冲","正弦"]),R("amplitude","幅值 / 面积",.3,1.5,.05,1),R("width","脉冲宽度",.24,2,.04,.48," s")],draggable:"amplitude",
        draw(s){
          const T=1.1, onset=1.5, gain=1-Math.exp(-M.dt/T);
          let output=0;
          const data=rows(t=>{
            const a=s.amplitude,u=t-onset,x=u<0?0:[a,a*u/8,a*u*u/90,u<s.width?a/s.width:0,a*Math.sin(1.8*u)][s.signal];
            const y=s.signal===3&&u>=0?a/s.width*(1-Math.exp(-Math.min(u,s.width)/T))*Math.exp(-Math.max(0,u-s.width)/T):output;
            output+=gain*(x-output);
            return {x,y};
          });
          const current=M.at(data,s.time);
          const peak=Math.max(1.3,...data.map(p=>p.x*1.08));
          return {art:chain(["典型输入","一阶惯性","输出响应"],0),chart:graph(s.time,{low:s.signal===4?-peak:0,high:peak,unit:"相对值",event:onset},[data,"x","典型输入",ink.target,true],[data,"y","系统输出",ink.teal]),
            readouts:meter(["当前输入",current.x],["当前输出",current.y],["脉冲面积",s.signal===3?s.amplitude:"—"]),
            detail:explain("用来检验什么",["突然改变给定，看过渡过程。","目标持续变化，看跟踪能力。","目标以恒定加速度变化，看更高阶的跟踪。","输入持续很短，冲激面积保持不变。","目标周期变化，为后续频率响应做准备。"][s.signal]),
            note:note("缩短脉冲宽度时，高度升高而面积不变。")};
        }}
    },
    {
      title:"在一条阶跃曲线上测出性能指标",source:span(11,14),
      points:[["测量基准","上升时间应说明采用 0–100% 还是 10–90%。延迟时间是首次到稳态值 50% 的时间，峰值时间取首个峰值。"],["稳态与超调","超调量是峰值超过稳态值的部分与稳态值之比。调节时间是进入并始终保持在给定误差带内的最早时刻，注明 ±2% 或 ±5%。"],["无超调响应","单调响应没有有限首峰，常用 10–90% 上升时间。跟踪给定还要明确稳态误差。"]],
      lab:{title:"性能标记与允许误差带",chartTitle:"阶跃响应和边界",controls:[R("z","阻尼比",.15,1.5,.05,.48),R("w","固有频率",.65,2.8,.05,1.5," rad/s"),C("tolerance","误差带",["±2%","±5%"])],draggable:"z",
        draw(s){
          const gap=s.tolerance?.05:.02, data=rows(t=>({y:second(t,s.w,s.z),lo:1-gap,hi:1+gap}));
          const cross=v=>data.find(p=>p.y>=v)?.t??Infinity;
          const last=data.findLastIndex(p=>Math.abs(p.y-1)>gap);
          const tp=s.z<1?Math.PI/(s.w*Math.sqrt(1-s.z*s.z)):Infinity;
          const overshoot=s.z<1?100*Math.exp(-s.z*Math.PI/Math.sqrt(1-s.z*s.z)):0;
          return {art:spectrum(s),chart:graph(s.time,{high:1.75,unit:"相对值"},[data,"lo","误差带",ink.target,true],[data,"hi","误差带上界",ink.target,true],[data,"y","阶跃响应",ink.teal]),
            readouts:meter(["tᵣ (10–90%)",f(cross(.9)-cross(.1))+" s"],["tₛ",last+1<data.length?f(data[last+1].t)+" s":"超过图窗"],["超调",f(overshoot,1)+"%"]),
            detail:explain("延迟与峰值","t_d≈"+f(cross(.5))+" s；t_p="+(tp===Infinity?"无有限首峰":f(tp)+" s")+"。图窗内的 tₛ 由采样估计。"),
            note:note("改变误差带只改变合格判定，物理响应曲线保持原样。")};
        }}
    },
    {
      title:"一阶系统如何响应阶跃、斜坡和脉冲",source:span(15,22),
      points:[["模型与阶跃","G(s)=K/(Ts+1)，T>0。单位阶跃时 y=K(1−e⁻ᵗ⁄ᵀ)，t=T 时达到最终值约 63.2%。"],["斜坡和冲激","单位斜坡 y=K[t−T(1−e⁻ᵗ⁄ᵀ)]，单位冲激 y=(K/T)e⁻ᵗ⁄ᵀ。稳定一阶系统的冲激响应积分为 K。"],["各响应的关系","零初值下单位冲激响应等于阶跃响应的导数，斜坡响应是阶跃响应的积分。单调阶跃约在 3T 或 4T 进入 5% 或 2% 带。"]],
      lab:{title:"同一惯性环节换输入",chartTitle:"时间常数改变的效果",controls:[C("mode","输入",["阶跃","斜坡","脉冲"]),R("tau","时间常数 T",.35,3.5,.05,1.35," s"),R("gain","静态增益 K",.3,2,.05,.9)],draggable:"tau",
        draw(s){
          const data=rows(t=>{const e=Math.exp(-t/s.tau);return {y:s.gain*[1-e,t-s.tau*(1-e),e/s.tau][s.mode]};});
          return {art:chain(["输入","K / (Ts + 1)","输出"],1),chart:graph(s.time,{high:1.15*Math.max(1,...data.map(v=>v.y)),unit:"相对值",event:s.tau},[data,"y","当前输出",ink.teal]),
            readouts:meter(["T",f(s.tau)+" s"],["当前 y",M.at(data,s.time).y],["t=T 的阶跃比例","63.2%"]),
            detail:explain("稳态值与速度可分别看","K 决定单位阶跃最终值，T 决定到达最终值的速度。斜坡跟踪若 K=1，则长期滞后为 T。"),
            note:note("把 T 拉大，再把游标移到 T，核对阶跃比例仍为 63.2%。")};
        }}
    },
    {
      title:"从二阶极点看四种阻尼响应",source:span(23,32),
      points:[["标准形式","Φ(s)=ωₙ²/(s²+2ζωₙs+ωₙ²)。ωₙ 为无阻尼自然频率，ζ 为阻尼比。两极点为 −ζωₙ±ωₙ√(ζ²−1)。"],["四类阻尼","ζ=0 时出现等幅振荡；0<ζ<1 是衰减振荡；ζ=1 为负实重根；ζ>1 为两个不同负实根。"],["角度与包络","欠阻尼时从负实轴量到极点连线的阻尼角满足 cos β=ζ，振荡角频率 ωd=ωₙ√(1−ζ²)，包络由指数衰减率 ζωₙ 决定。"]],
      lab:{title:"拖阻尼，极点和输出同步变化",chartTitle:"二阶单位阶跃响应",controls:[R("z","阻尼比 ζ",0,2,.025,.43),R("w","自然频率 ωₙ",.6,2.8,.05,1.4," rad/s")],draggable:"z",
        draw(s){
          const p=quadratic(s), data=rows(t=>({y:second(t,s.w,s.z),ref:1}));
          const tag=s.z===0?"零阻尼":s.z<1?"欠阻尼":s.z===1?"临界阻尼":"过阻尼";
          return {art:spectrum(s),chart:graph(s.time,{high:2.1,unit:"相对值"},[data,"ref","给定",ink.target,true],[data,"y","输出",ink.teal]),
            readouts:meter(["类型",tag],["极点实部",p.spread?f(p.r-p.spread)+" / "+f(p.r+p.spread):p.r],["虚部绝对值",p.im]),
            detail:explain("阻尼角",s.z<1?"从负实轴量起，β≈"+f(Math.acos(s.z)*180/Math.PI,1)+"°。":"此时极点处于实轴，用实根位置判断响应。"),
            note:note("经过 ζ=1 时，一对复根在负实轴相合，再分成两个实根。")};
        }}
    },
    {
      title:"用速度反馈和参数约束设计二阶性能",source:span(33,41),
      points:[["欠阻尼公式","ωd=ωₙ√(1−ζ²)，tₚ=π/ωd，Mₚ=e^(−πζ/√(1−ζ²))。若 tᵣ 定义为首次穿越稳态值，则 tᵣ=(π−β)/ωd，β=arccos ζ。"],["调节时间","欠阻尼模型可用包络估计进入误差带的时刻。常用 3/(ζωₙ) 或 4/(ζωₙ) 分别作 5% 或 2% 工程近似，并注明适用条件。"],["速度反馈","在这里的归一化结构下，负速度反馈增加一次导数项系数，提高等效阻尼，常用来减小超调。算例中的增益与反馈系数由题设结构算出。"]],
      lab:{title:"速度反馈前后的响应",chartTitle:"相同给定和自然频率下的比较",controls:[R("z","初始阻尼",.1,.8,.025,.35),R("w","自然频率",.6,3,.05,1.45," rad/s"),R("velocity","速度反馈量",0,.95,.05,.3)],draggable:"velocity",
        draw(s){
          const z=s.z+s.velocity,data=rows(t=>({initial:second(t,s.w,s.z),updated:second(t,s.w,z),ref:1}));
          const mp=z<1?100*Math.exp(-Math.PI*z/Math.sqrt(1-z*z)):0,tp=z<1?Math.PI/(s.w*Math.sqrt(1-z*z)):Infinity;
          return {art:spectrum({...s,z}),chart:graph(s.time,{high:2.05,unit:"相对值"},[data,"ref","给定",ink.target,true],[data,"initial","未加反馈",ink.orange],[data,"updated","加入速度反馈",ink.teal]),
            readouts:meter(["等效 ζ",z],["超调",f(mp,1)+"%"],["峰值时间",tp===Infinity?"无有限首峰":f(tp)+" s"]),
            detail:explain("明确速度反馈的条件","假设刚度项和自然频率保持不变，速度反馈只增加阻尼项。增大阻尼也可能使系统进入较慢的过阻尼区域。"),
            note:note("在同一固有频率下调速度反馈，同时看超调、速度和闭环极点。")};
        }}
    },
    {
      title:"脉冲、斜坡与附加零极点如何改变响应",source:span(42,49),
      points:[["不同输入","标准二阶系统的冲激响应由阶跃响应求导获得，斜坡响应由阶跃积分获得。"],["增加零极点","若分子乘 (1+Tz s)，阶跃响应可表示为原响应加 Tz 倍原响应导数。附加实极点提高阶次并产生新模态，远左的稳定模态通常衰减快。"],["主导极点","靠近虚轴且留数显著、远离可抵消零点的极点可主导过渡过程。高阶响应是各极点模态的叠加，重根还带多项式时间因子。"]],
      lab:{title:"保持原二阶模型，选不同扩展",chartTitle:"基准与附加环节",controls:[C("mode","比较",["脉冲","斜坡","附加零点","附加极点"],3),R("zero","零点时间参数",-.8,.8,.05,.35," s"),R("pole","附加极点距离",.55,5,.05,2.25)],draggable:"pole",
        draw(s){
          let integ=0,lag=0;
          const data=rows(t=>{const y=second(t,1.55,.52),dy=t<=0?0:(second(t+.002,1.55,.52)-second(t-.002,1.55,.52))/.004;
            const output=[dy,integ,y+s.zero*dy,lag][s.mode];integ+=M.dt*y;lag+=M.dt*s.pole*(y-lag);return {y,output};});
          return {art:poleScene(s.mode===3?-s.pole:-.806,s.mode===3?0:1.32),chart:graph(s.time,{low:Math.min(-.15,...data.map(x=>x.output*1.07)),high:Math.max(1.35,...data.map(x=>x.output*1.08)),unit:"相对值"},[data,"y","原阶跃参考",ink.target,true],[data,"output","当前响应",ink.teal]),
            readouts:meter(["当前输出",M.at(data,s.time).output],["附加极点",s.mode===3?-s.pole:"—"]),
            detail:explain("观察口径","更远的附加稳定极点具有更快的衰减；零点则改变各模态的权重。右半平面零点情形可带来初始反向。"),
            note:note("把附加极点向左拖远，再比较它与基准的差距。")};
        }}
    },
    {
      title:"由特征根判别自由响应是否衰减",source:span(50,55),
      points:[["连续 LTI 稳定性","对内部渐近稳定，全部特征根须严格位于左半平面。右半平面根会发散；虚轴单根可导致不衰减，虚轴重根可出现有界性丧失。"],["模态对应","负实根给衰减指数，正实根给增长指数，共轭根给带指数包络的振荡。单纯看到暂态有振荡不足以判为不稳定。"],["为什么用代数判据","高阶特征方程求根不便，可通过劳斯或赫尔维茨判据从多项式系数得知根的分布。"]],
      lab:{title:"拖根越过虚轴",chartTitle:"自由响应与包络",controls:[R("real","实部 σ",-1.45,.42,.025,-.33),R("imag","虚部 ω",0,3.8,.05,1.65),C("repeat","虚轴根重数",["单根","重根"])],draggable:"real",
        draw(s){
          const data=rows(t=>{const envelope=Math.exp(s.real*t)*(s.repeat?t:1);return {envelope,y:envelope*Math.cos(s.imag*t)};});
          const cap=Math.max(1.2,...data.map(sample=>sample.envelope*1.07));
          return {art:poleScene(s.real,s.imag),chart:graph(s.time,{low:-cap,high:cap,unit:"相对值"},[data,"envelope","包络上界",ink.target,true],[data,"y","自由模态",ink.teal]),
            readouts:meter(["σ",s.real],["ω",s.imag],["趋势",s.real<0?"衰减":s.real>0||s.repeat?"增长 / 发散":"保持幅度"]),
            detail:explain("重根会多出时间因子","示意用 t·e^(σt) 代表二重根的一个广义模态。σ 为负时它仍会衰减。"),
            note:note("把实部拖到零，对比单根和重根，再看虚轴两侧。")};
        }}
    },
    {
      title:"逐行构造劳斯表和稳定裕度检验",source:span(56,66),
      points:[["构造与判据","首两行交替取特征多项式系数。随后由行列式递推填表。满足处理条件时，首列符号变化次数等于右半平面根个数。"],["两种特殊情况","首项为零而整行非零，用 ε>0 替代并取 ε→0⁺。整行为零，用上一行构造辅助多项式，取导数系数补入，另查对称根及虚轴根。"],["赫尔维茨及裕度","赫尔维茨首项系数为正时以各阶主子式为正判稳定。检验极点实部是否都小于 −σ₀，可令 s=z−σ₀ 对新多项式再判稳。"]],
      lab:{title:"移动常数项并读首列符号",timed:false,controls:[C("mode","案例",["三阶参数","首项为零","整行为零"]),R("k","常数项 K",.1,9,.05,2.6),R("shift","最小衰减 σ₀",0,.5,.025,0)],draggable:"k",
        draw(s){
          const x=s.shift, a=3,b=2.5,K=s.k;
          const derived=[1,a-3*x,3*x*x-2*a*x+b,K-b*x+a*x*x-x*x*x];
          const source=s.mode===0?derived:s.mode===1?[1,2,3,6,1]:[1,2,2,2,1];
          const n=source.length-1,count=Math.ceil(source.length/2),table=[];
          const t0=Array.from({length:count},(_,i)=>source[2*i]||0),t1=Array.from({length:count},(_,i)=>source[2*i+1]||0);
          table.push(t0,t1);
          const flags=[];
          function special(row,i){
            if(row.every(v=>Math.abs(v)<1e-9)){
              flags.push("整行为零");
              return row.map((_,j)=>(n-i+1-2*j)*table[i-1][j]);
            }
            if(Math.abs(row[0])<1e-9){row[0]=1e-6;flags.push("首项 ε");}
            return row;
          }
          for(let i=2;i<=n;i++){
            const up=table[i-2],prev=table[i-1];
            const row=Array.from({length:count},(_,j)=>((prev[0]*(up[j+1]||0)-up[0]*(prev[j+1]||0))/prev[0]));
            table.push(special(row,i));
          }
          const changes=table.slice(1).filter((r,i)=>Math.sign(r[0])!==Math.sign(table[i][0])).length;
          const art=scene("劳斯表",table.map((r,i)=>txt(66,47+i*37,"s"+(n-i),18)+r.map((v,j)=>txt(191+143*j,47+i*37,Math.abs(v-1e-6)<1e-12?"ε":f(v,3),19)).join("")).join(""));
          return {art,readouts:meter(["右半平面根数",changes],["特殊处理",flags.join(" / ")||"无"],["三阶等效常数",derived[3]]),
            detail:explain("核对符号和边界",s.mode===2?"辅助多项式 s²+1 给出虚轴根 ±j。首列无变号也达不到严格渐近稳定。":s.mode===1?"首项取正的小 ε，可看符号如何传到下一行。":"本页三阶 p(s)=s³+3s²+2.5s+K。σ₀=0 时稳定区间 0<K<7.5。"),
            note:note("三阶案例把 K 拖过 7.5，再观察首列的两次变号。")};
        }}
    },
    {
      title:"给定和扰动从不同入口进入误差",source:[...span(67,72),80],
      points:[["误差约定","误差信号是比较点给定减反馈。若讨论输出跟踪误差，非单位反馈不能直接拿比较点误差代替。"],["误差传递函数","从给定到比较点误差通常为 1/(1+GH)。从扰动到误差按进入位置取中间通道及负号，不能照抄参考式。"],["终值条件","用 eₛₛ=lim sE(s) 前，须确保 sE(s) 的极点严格在左半平面。扰动引起的稳态误差取决于扰动位置、幅值和前后通道的积分环节。"]],
      lab:{title:"换扰动注入位置",chartTitle:"比较点误差随时间",controls:[C("place","外扰位置",["对象输入端","输出端"]),R("k","反馈前向增益",.2,4,.05,1.5),R("d","扰动幅值",0,1.1,.05,.42)],draggable:"d",
        draw(s){
          let x=0;
          const data=rows(t=>{const n=t>=3?s.d:0,y=x+(s.place?n:0),e=1-y; x+=M.dt*(s.k*e+(s.place?0:n)-x);return {y,e};});
          const p=M.at(data,s.time);
          return {art:chain(["给定","比较点","对象","测量"],s.place?3:2),chart:graph(s.time,{low:-.6,high:1.7,unit:"相对值",event:3},[data,"y","输出",ink.blue],[data,"e","比较偏差",ink.teal]),
            readouts:meter(["当前偏差",p.e],["末端偏差",M.at(data,12).e]),
            detail:explain("简化单位反馈","这里取对象 P=1/(s+1)，其低频增益为 1。两种阶跃扰动的最终误差可能相同，但注入输出端会使输出和误差立即跳变。"),
            note:note("保持同一扰动大小和增益，只切换入口，比较瞬态。")};
        }}
    },
    {
      title:"用系统型别预测稳态误差数量级",source:span(73,79),
      points:[["型别","系统型别是开环环路传递函数中未被消去的原点极点数。Kp=lim L(s)，Kv=lim sL(s)，Ka=lim s²L(s)，三个极限取 s→0。"],["典型输入","单位阶跃误差 1/(1+Kp)，单位斜坡为 1/Kv，单位抛物线 t²/2 为 1/Ka。计算前必须确认闭环稳定和终值条件。"],["如何用总表","型别低于输入阶数时稳态误差发散；同阶时有限；高于输入阶数时为零。0 型阶跃有限但分母仍含 1+Kp。"]],
      lab:{title:"组合系统型别和输入",chartTitle:"单位反馈误差趋势",controls:[C("type","系统型别",["0 型","Ⅰ 型","Ⅱ 型"],1),C("input","输入",["阶跃","斜坡","抛物线"],1),R("k","误差系数尺度",.35,2.8,.05,1.1)],draggable:"k",
        draw(s){
          let out=0,v=0;
          const data=rows(t=>{const u=wave(s.input,t),e=u-out,o=out;
            if(s.type===0)out+=M.dt*(s.k*e-out);
            else if(s.type===1)out+=M.dt*s.k*e;
            else {out+=M.dt*(v+.9*s.k*e);v+=M.dt*s.k*e;}
            return {u,y:o,e};});
          const amplitude=[.8,.8/7,1.6/65][s.input];
          const final=s.type>s.input?0:s.type<s.input?Infinity:s.type===0?amplitude/(1+s.k):amplitude/s.k;
          const cap=1.1*Math.max(1,...data.map(r=>r.u));
          return {art:chain(["典型输入",["K/(s+1)","K/s","K(1+0.9s)/s²"][s.type],"比较偏差"],1),
            chart:graph(s.time,{low:-.3,high:cap,unit:"相对值"},[data,"u","给定",ink.target,true],[data,"y","被控量",ink.blue],[data,"e","误差",ink.teal]),
            readouts:meter(["理论稳态误差",final],["当前误差",M.at(data,s.time).e]),
            detail:explain("Ⅱ 型为何有导前项","该模型用导前项提供闭环阻尼，确保能比较稳定情况下的稳态误差。单纯双积分的单位反馈不能默认渐近稳定。"),
            note:note("保持斜坡，依次切换三种型别，比较误差是增长、趋于常数还是趋于零。")};
        }}
    },
    {
      title:"把多项指标转化为极点可行区域",source:span(81,85),
      points:[["动态误差系数","将 E(s)/R(s) 在 s=0 附近展开，e 可用 r及其导数的加权和近似描述缓慢变化给定。取几项和取值范围要交代清楚。"],["减小稳态差","在稳定裕度允许的条件下提高低频环路增益、提高型别、采用前馈或补偿扰动。改进静态精度时同步复核动态与稳定性。"],["设计复核","从衰减速度、允许超调等指标得到复平面约束；在候选区域挑主导极点，再用全阶模型复核。"]],
      lab:{title:"拖主导极点进入可行区",chartTitle:"主导二阶近似和缓变误差",controls:[R("real","期望衰减 σ",.15,4.5,.05,2),R("imag","振荡频率 ωd",.25,5.5,.05,3.5),C("mode","视角",["阶跃与约束","缓变误差"])],draggable:"real",
        draw(s){
          const w=Math.hypot(s.real,s.imag),z=s.real/w,mp=100*Math.exp(-Math.PI*s.real/s.imag),ts=4/s.real;
          const tr=(Math.PI-Math.atan2(s.imag,s.real))/s.imag;
          const maxAngle=Math.atan(Math.PI/-Math.log(.17)), cx=555, cy=123, x=r=>cx-r*105, ordinate=i=>cy-i*19;
          const angles=Array.from({length:31},(_,i)=>.05+i*(maxAngle-.05)/30);
          const boundary=angles.map(b=>{const r=(Math.PI-b)/(.6*Math.sin(b));return [x(r*Math.cos(b)),ordinate(r*Math.sin(b))];});
          const region='<path d="M18 '+ordinate((cx-18)/105*Math.tan(maxAngle))+'L'+boundary.slice().reverse().map(p=>p.join(' ')).join('L')+'H18Z" fill="#dcefe8" clip-path="url(#pole-area)"/>';
          const mirror='<g transform="translate(0 246) scale(1 -1)">'+region+'</g>';
          const dot=(px,py)=>path("M"+(px-6)+" "+(py-6)+"l12 12m0-12-12 12",ink.orange,3.8);
          const artwork=scene("二阶主导极点的可行区域",'<defs><clipPath id="pole-area"><rect x="18" y="16" width="537" height="214"/></clipPath></defs>'+region+mirror+
            path("M18 "+cy+"H614M"+cx+" 16V231")+path("M"+x(4/9.2)+" 18V230",ink.target,1.2)+
            path("M"+cx+" "+cy+"L"+x(3.2)+" "+ordinate(Math.tan(maxAngle)*3.2)+"M"+cx+" "+cy+"L"+x(3.2)+" "+ordinate(-Math.tan(maxAngle)*3.2),ink.teal,1.7)+
            dot(x(s.real),ordinate(s.imag))+dot(x(s.real),ordinate(-s.imag))+txt(592,113,"Re",15)+txt(581,33,"Im",15)+txt(124,36,"满足设计指标",17));
          let y=0;
          const data=rows(t=>{
            if(!s.mode)return {ref:1,actual:second(t,w,z)};
            const u=.28*Math.sin(.35*t),e=u-y,approx=.28*.35*Math.cos(.35*t)/s.real;y+=M.dt*s.real*e;return {actual:e,ref:approx};
          });
          return {art:s.mode?chain(["缓变给定","低频近似","动态误差"],1):artwork,chart:graph(s.time,{low:s.mode?-.7:0,high:s.mode?.7:1.95,unit:"相对值"},[data,"ref",s.mode?"一阶导数近似":"给定",ink.target,true],[data,"actual",s.mode?"实际误差":"阶跃响应",ink.teal]),
            readouts:meter(["超调",f(mp,1)+"%"],["tₛ / tᵣ",f(ts,2)+" / "+f(tr,2)+" s"],["设计指标",mp<=17&&ts<=9.2&&tr<=.6?"全部满足":"待调整"]),
            detail:explain(s.mode?"缓变误差":"三个设计条件",s.mode?"示例取 E/R=s/(s+σ)，低频首项为 s/σ，比较缓慢正弦给定下的实际误差和导数近似。":"要求 tᵣ≤0.6 s、超调≤17%、tₛ≈4/σ≤9.2 s。绿色表示三者交集。"),
            note:note("极点区域只给出主导二阶近似，最终仍要用全阶模型复核。")};
        }}
    }
  ];
  const lessons=[
    [
      ["按工况选择测试输入","阶跃对应突变指令，斜坡对应匀速，抛物线对应恒加速度，冲激对应瞬时打击，正弦对应周期变化。时域直接观察响应曲线，可以比较速度、平稳和跟踪精度。"],
      ["标准信号的拉氏形式","单位阶跃是 1/s，单位斜坡是 1/s²，单位抛物线 t²/2 是 1/s³，单位冲激是 1，sin ωt 是 ω/(s²+ω²)。后两者分别用来观察自由模态和周期输出。"],
      ["从高度和面积判断","单位阶跃的分布导数是 δ(t)，积分 δ 得阶跃。斜坡积分得抛物线。将矩形冲激近似缩窄时保持面积为 1，脉冲越窄、高度越大。"]
    ],
    [
      ["同一曲线上的指标各回答一个问题","延迟时间 t_d 是首次达到终值 50% 的时间。欠阻尼二阶的 0–100% 上升时间 tᵣ 是首次达到终值的时间，单调系统通常使用 10–90%。tₚ 是首次峰值时间。"],
      ["峰值和持续误差要区别","超调量 Mₚ=(yₚ−y∞)/y∞×100%。调节时间 tₛ 是此后始终留在约定误差带内的最早时刻，课程采用 2% 或 5%。一次进入误差带不足以判定已调节。"],
      ["先判终值是否存在","稳态误差是 e(t) 的极限。非稳定或持续振荡时可能没有有限终值。可调参数改变多项指标时，应先保证稳定，再在快速性、平稳性和精度间取舍。"]
    ],
    [
      ["一阶模型和极点","T y′+y=Ku，对应 G=K/(Ts+1)、极点 −1/T。零初值阶跃 y=K(1−e⁻ᵗ/ᵀ)，冲激响应为 (K/T)e⁻ᵗ/ᵀ。T 越大，极点越靠原点，响应越慢。"],
      ["用三个时间刻度建立直觉","经过 1T，输出为终值 63.2%；5% 带的 tₛ=−T ln(0.05)≈3T，2% 带 tₛ≈3.91T。实际曲线测得 63.2% 时刻，可以反求 T。"],
      ["阶跃与斜坡的误差不同","单位静态增益时，阶跃最终误差为零。单位斜坡的输出 y=t−T+Te⁻ᵗ/ᵀ，因此稳态差为 T，线形轨迹仍可持续跟踪。"]
    ],
    [
      ["从标准方程读极点","Φ=ωₙ²/(s²+2ζωₙs+ωₙ²)。0<ζ<1 时，极点为 −ζωₙ±jωₙ√(1−ζ²)，ωd=ωₙ√(1−ζ²)，β=arccos ζ。ωₙ是极点模，β是与负实轴的夹角。"],
      ["四种响应源于四种极点","ζ=0 时共轭极点落于虚轴并持续振荡；0<ζ<1 时振荡衰减；ζ=1 时得到负实重根；ζ>1 时是两个相异负实根，慢极点支配尾段。"],
      ["从闭环极点读包络","欠阻尼响应 y=1−e⁻ζωₙᵗ sin(ωd t+β)/√(1−ζ²)，包络由实部决定，振荡周期由虚部决定。临界阻尼阶跃 y=1−(1+ωₙt)e⁻ωₙᵗ。"]
    ],
    [
      ["把二阶参数变成四项指标","0<ζ<1 时 tᵣ=(π−β)/ωd、tₚ=π/ωd、Mₚ=exp(−πζ/√(1−ζ²))×100%。课件以 3/(ζωₙ) 或 4/(ζωₙ) 估算 5% 或 2% 调节时间。例 3-1 得 tᵣ≈0.55 s、tₚ≈0.785 s、5% tₛ≈1.0 s、2% tₛ≈1.33 s、超调约 9.5%。"],
      ["拆开看增益与速度反馈","例 3-2 中 K 从 16 改为 4，ζ 增大而 ωₙ 从 8 降至 4，超调从约 44.4% 降到约 16%，ζωₙ未变，工程估计的 tₛ 仍约 2 s。"],
      ["增加阻尼的一种办法","例 3-3 把转速信号负反馈回比较端。取 τ=0.0625 s 后，Φ=64/(s²+8s+64)，ωₙ=8、ζ=0.5、Mₚ约 16%。保持自然频率并增大阻尼，可以减少超调。"]
    ],
    [
      ["从阶跃推出脉冲和斜坡","零初始条件下，阶跃响应的导数是冲激响应，积分是单位斜坡响应。常用二阶单位反馈的单位斜坡稳态误差为 2ζ/ωₙ。"],
      ["零点与极点改变的对象","零点改变模态系数，使上升和峰值改变，右半平面零点还可能造成反向初动。增加极点会引入新的模态。足够远的快极点贡献较早衰减，前提是主导模态没有被邻近零点明显削弱。"],
      ["用曲线反推极点类型","课件自测中的输出先出现交替峰谷、且振幅逐渐缩小，因而最符合左半平面的一对共轭主导极点（B）。高阶近似仍需回到全阶模型核对。"]
    ],
    [
      ["用自由响应判断渐近稳定","连续线性定常模型的自由响应包含 tᵏeˢᵗ (k 由极点重数决定)。所有特征根实部严格为负时自由响应全部衰减，存在右半平面根时发散。"],
      ["严格检查虚轴极点","单实零根或单对纯虚根在其余根严格位于左半平面时可带来持续模态。虚轴重根通常出现 tᵏ 乘振荡，造成幅值增长。虚轴持续振荡系统也不满足常用的 BIBO 稳定要求。"],
      ["内在稳定与外部某条通路","若零极点相消，某条简化后的传递函数可能隐藏不稳定特征模态。核对闭环特征方程及内部可控、可观关系，再判断系统。"]
    ],
    [
      ["劳斯表看第一列的符号","把特征多项式按降幂排列，首两行分别填交替系数。表第一列符号变化次数给出右半平面根数。例 3-5 第一列为 1、2、1、−6、5，符号变化两次。系数同号且非零只是连续严格稳定的必要条件。"],
      ["两种特殊行要分别处理","仅首项为零时，从正的 ε 逼近零并看符号，例中得两个右半平面根。整行全零时以上一行构造辅助多项式，以其导数系数替换零行。例中的辅助式 (s²+1)(s²+2) 给出 ±j、±j√2，因此没有右半平面根也不能判为渐近稳定。"],
      ["赫尔维茨与参数设计","最高项系数为正时，赫尔维茨前导主子式都为正等价于严格稳定。例 3-9 的 Δ₂<0，例 3-11 的范围为 0<K₁<6，对应 K=K₁/2、临界增益 Kc=3。要求极点位于 Re(s)=−1 左侧，可用 s=z−1；例 3-12 移位后首列 2、4、−1/2、−1，说明有一根未达到裕度。"]
    ],
    [
      ["比较点误差和输出误差","一般反馈系统的比较点信号 e=r−Hy。对关心的物理跟踪误差 r−y，只有单位反馈且同量纲时可以直接用 e 代表。"],
      ["给定与扰动分别入式","若 D 由 G₁ 与 G₂ 之间相加进入，被控量 Y=(G₁G₂R+G₂D)/(1+G₁G₂H)，比较误差 E=(R−HG₂D)/(1+G₁G₂H)，扰动取负相加时相应改符号。叠加后可分别看给定、扰动和总误差。"],
      ["终值定理和章内自测","满足终值定理条件后才可算 eₛₛ=limₛ→₀sE(s)。给定电压的稳态差为零仍可能留下负载转矩误差，原自测取 B。"]
    ],
    [
      ["看开环原点极点数判型别","开环环路传递函数的净原点极点数为 ν，对应 0、Ⅰ、Ⅱ 型。设归一化典型输入并有稳定闭环：Kₚ=lim L(s)、Kᵥ=lim sL(s)、Kₐ=lim s²L(s)。"],
      ["给三个公式配三个输入","单位阶跃误差是 1/(1+Kₚ)，单位斜坡是 1/Kᵥ，单位抛物线 t²/2 是 1/Kₐ。有输入幅值时还要乘幅值。型别比输入次数高则误差为零，型别相同则保留有限误差，较低时误差可能发散。"],
      ["用实例检验阶次与归一化","例 3-13 对同一个 t² 给定，Ⅰ 型误差无界，Ⅱ 型误差为 2.4。要使速度误差系数 Kᵥ 无穷大，标准模型至少是Ⅱ型，再检查闭环稳定。"]
    ],
    [
      ["动态误差系数由低频展开得到","设 E/R=c₀+c₁s+c₂s²+⋯，则缓变给定的长期误差近似为 c₀r+c₁r′+c₂r″+⋯，系数里的阶乘已包含在泰勒系数中。例 3-14 的 0 型和Ⅰ型面对同一个二次给定时，前者保留二次项，后者的主项为一次。"],
      ["误差改善需要复核稳定","可以提高低频环路增益，增加低频积分环节，引入给定前馈或补偿可测扰动。改动后同时检查特征根和全阶时域曲线。"],
      ["章末题的三条极点边界","tᵣ≤0.6 s、Mₚ≤17%、tₛ≤9.2 s 给出 β≤atan(π/−ln 0.17)（约 60°）、σ≥4/9.2 和 ωd≥(π−β)/0.6。精确上升时间边界随 β 而变，约 −2±j3.5 是最靠近原点的候选点。若只求上升时间最小而不限制带宽或极点模，沿射线外移可继续缩短 tᵣ，不存在有限最优点。"]
    ]
  ];
  groups.forEach((group,i)=>{group.lesson=lessons[i];});
  window.CourseUnits??={};
  window.CourseUnits[3]={label:"第三章 控制系统的时域分析",groups};
})();
