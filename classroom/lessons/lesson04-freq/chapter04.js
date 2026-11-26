"use strict";
(() => {
  const W=IntroWidgets, {range:R,choices:C,ink,escape,readouts,note}=W;
  const add=([a,b],[c,d])=>[a+c,b+d];
  const mul=([a,b],[c,d])=>[a*c-b*d,a*d+b*c];
  const inv=([a,b])=>{const z=a*a+b*b;return [a/z,-b/z];};
  const div=(a,b)=>mul(a,inv(b));
  const magnitude=([a,b])=>Math.hypot(a,b);
  const arg=([a,b])=>Math.atan2(b,a);
  const deg=r=>r*180/Math.PI;
  const db=x=>20*Math.log10(Math.max(1e-12,x));
  const wAt=x=>10**x;
  const f= (x,n=2) => Number.isFinite(x)?Number(x.toFixed(n)).toString():"—";
  const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
  const samples=(fn,a,b,n=160)=>Array.from({length:n+1},(_,i)=>fn(a+(b-a)*i/n,i));
  const detail=(heading,copy)=>'<div class="selected-result"><strong>'+escape(heading)+'</strong><p>'+escape(copy)+'</p></div>';
  const fmt=z=>f(z[0])+(z[1]>=0?" + j":" − j")+f(Math.abs(z[1]));
  const frequency=()=>R("logw","lg ω", -2,2,.04,0);
  const time=()=>R("cursor","观察时刻",0,12,.08,3," s");
  const rules=[
    ["比例","K",w=>[1,0], _=>[0,0]],
    ["积分","1 / s",w=>[0,-1/w],w=>[-db(w),-90]],
    ["微分","s",w=>[0,w],w=>[db(w),90]],
    ["惯性","1 / (1+Ts)",(w,t)=>inv([1,t*w]),(w,t)=>[-db(Math.max(1,t*w)),-90*clamp((Math.log10(t*w)+1)/2)]],
    ["一阶微分","1+Ts",(w,t)=>[1,t*w],(w,t)=>[db(Math.max(1,t*w)),90*clamp((Math.log10(t*w)+1)/2)]],
    ["二阶振荡","1 / (1+2ζTs+T²s²)",(w,t,z)=>inv([1-(t*w)**2,2*z*t*w]),(w,t)=>[-2*db(Math.max(1,t*w)),-180*clamp((Math.log10(t*w)+1)/2)]],
    ["二阶微分","1+2ζTs+T²s²",(w,t,z)=>[1-(t*w)**2,2*z*t*w],(w,t)=>[2*db(Math.max(1,t*w)),180*clamp((Math.log10(t*w)+1)/2)]],
    ["纯延迟","e^(−Ts)",(w,t)=>[Math.cos(t*w),-Math.sin(t*w)],(w,t)=>[0,-deg(w*t)]]
  ];
  const clamp=x=>Math.max(0,Math.min(1,x));
  const sweep=() => [C("kind","典型环节",rules.map(x=>x[0]),3),frequency(),R("T","时间参数 T",.3,3,.05,1," s"),R("z","阻尼比 ζ",.08,1.4,.02,.35)];
  function panel({lines,marks=[],domain,cursor,xTitle,yTitle,id="g"}, dims={width:620,height:310,top:0}) {
    const {width,height,top}=dims,[a,b,c,d]=domain;
    const x0=51,x1=width-18,y0=top+24,y1=top+height-37;
    const x=n=>x0+(x1-x0)*(n-a)/(b-a),y=n=>y1-(y1-y0)*(n-c)/(d-c);
    let grid="";
    for(let i=0;i<=4;i++){
      const xx=a+(b-a)*i/4,yy=c+(d-c)*i/4;
      grid+='<path d="M'+x(xx)+' '+y0+'V'+y1+'M'+x0+' '+y(yy)+'H'+x1+'" stroke="#dae6f0"/>'+
        '<text x="'+x(xx)+'" y="'+(y1+14)+'" text-anchor="middle">'+escape(f(xx,1))+'</text><text x="'+(x0-7)+'" y="'+(y(yy)+4)+'" text-anchor="end">'+escape(f(yy,1))+'</text>';
    }
    if(a<0&&b>0)grid+='<path d="M'+x(0)+' '+y0+'V'+y1+'" stroke="#8ca5bd"/>';
    if(c<0&&d>0)grid+='<path d="M'+x0+' '+y(0)+'H'+x1+'" stroke="#8ca5bd"/>';
    const traces=lines.map(({data,color,dash})=>{
      let start=true,d="";
      for(const [u,v] of data){
        if(!Number.isFinite(u)||!Number.isFinite(v)){start=true;continue;}
        d+=(start?"M":"L")+f(x(u),2)+" "+f(y(v),2);start=false;
      }
      return '<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="2.25"'+(dash?' stroke-dasharray="5 4"':'')+'/>';
    }).join("");
    const visibleMarks=marks.filter(([u,v])=>Number.isFinite(u)&&Number.isFinite(v)&&u>=a&&u<=b&&v>=c&&v<=d);
    const pointers=visibleMarks.map(([u,v,,color=ink.teal,{shape}={}])=>{
      const px=x(u),py=y(v);
      if(shape==="diamond")return '<path d="M'+px+' '+(py-5)+'l5 5-5 5-5-5z" fill="#fff" stroke="'+color+'" stroke-width="2.2"/>';
      return '<circle cx="'+px+'" cy="'+py+'" r="4.5" fill="#fff" stroke-width="2.2" stroke="'+color+'"/>';
    }).join("");
    const markLabels=visibleMarks.map(([u,v,label,color=ink.teal,{dx=8,dy=-7}={}])=>{
      if(!label)return "";
      const px=x(u),py=y(v),textWidth=16*String(label).length;
      const side=dx<0||px+dx+textWidth>x1?"end":"start";
      const lx=side==="end"?Math.max(x0+textWidth,px-Math.abs(dx)):Math.max(x0,px+dx);
      const ly=Math.min(y1-5,Math.max(y0+14,py+dy));
      return '<text class="freq-mark-label" x="'+lx+'" y="'+ly+'" text-anchor="'+side+'" fill="'+color+'">'+escape(label)+'</text>';
    }).join("");
    const cross=cursor===undefined?"":'<path d="M'+x(cursor)+' '+y0+'V'+y1+'" stroke="#0b7767" stroke-dasharray="4 4"/>';
    return '<defs><clipPath id="freq-'+id+'"><rect x="'+x0+'" y="'+y0+'" width="'+(x1-x0)+'" height="'+(y1-y0)+'"/></clipPath></defs>'+
      grid+'<text x="'+x0+'" y="'+(y0-8)+'">'+escape(yTitle)+'</text><text x="'+x1+'" y="'+(top+height-5)+'" text-anchor="end">'+escape(xTitle)+'</text>'+
      '<g clip-path="url(#freq-'+id+')">'+cross+traces+pointers+'</g>'+markLabels;
  }
  function svg(body,label,height=310){return '<svg class="frequency-plot" viewBox="0 0 620 '+height+'" role="img" aria-label="'+escape(label)+'" fill="#385875" font-size="12" font-family="system-ui">'+body+'</svg>';}
  function plane(lines,marks,span=2,fit=false){
    let cx=0,cy=0;
    if(fit){
      const points=[[0,0],...lines.flatMap(line=>line.data),...marks];
      const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
      const left=Math.min(...xs),right=Math.max(...xs),bottom=Math.min(...ys),top=Math.max(...ys);
      cx=(left+right)/2;cy=(bottom+top)/2;
      span=1.24*Math.max(.1,(top-bottom)/2,(right-left)*249/(2*551));
    }
    const sx=span*(620-51-18)/(310-24-37);
    return svg(panel({lines,marks,domain:[cx-sx,cx+sx,cy-span,cy+span],xTitle:"实部 Re",yTitle:"虚部 Im"}),"复平面轨迹");
  }
  function bodes(response,x,{asym,compare,markZero=false,phase,phase2}={}) {
    const data=samples(l=>{const w=wAt(l),z=response(w);return [l,db(magnitude(z)),phase?phase(w):deg(arg(z))];},-2,2);
    const extra=asym?samples(l=>[l,...asym(wAt(l))],-2,2):compare?samples(l=>{const w=wAt(l),z=compare(w);return [l,db(magnitude(z)),phase2?phase2(w):deg(arg(z))];},-2,2):[];
    const [amp,ang]=[1,2].map(i=>{
      const values=[...data,...extra].map(x=>x[i]).filter(Number.isFinite);
      const step=i===1?20:45,min=Math.floor(Math.min(...values,-1)/step)*step,max=Math.ceil(Math.max(...values,1)/step)*step;
      const lines=[{data:data.map(row=>[row[0],row[i]]),color:ink.teal}];
      if(extra.length)lines.push({data:extra.map(row=>[row[0],row[i]]),color:ink.orange,dash:Boolean(asym)});
      if(markZero&&i===1)lines.push({data:[[-2,0],[2,0]],color:"#7391a9",dash:true});
      return panel({lines,domain:[-2,2,min,max],cursor:x,xTitle:"lg ω",yTitle:i===1?"幅值 / dB":"相位 / °",id:i},{width:620,height:187,top:(i-1)*187});
    });
    return svg(amp+ang,"同一频率游标下的精确幅频与相频",374);
  }
  function group(title,source,points,lab){return {title,source,points,lab:{title,timed:false, ...lab}};}
  const first=(w,t)=>inv([1,w*t]);
  const normalized=(kind,w,t,z)=>rules[kind][2](w,t,z);
  function simple(target,items,text){return {art:target,readouts:readouts(items),detail:detail(...text)};}
  const product=items=>items.reduce(mul,[1,0]);
  function staged(w,mode,count){
    const jw=[0,w];
    const arrays=mode===0?[[4,0],inv(jw),[1,.5*w],first(w,2),inv([1-w*w/64,.05*w])]:
      [[7.5,0],inv(jw),inv([1-.5*w*w,.5*w]),first(w,.5),[1,w/3]];
    return product(arrays.slice(0,count));
  }
  function stagePhase(w,mode,count){
    const angles=mode===0?[0,-90,deg(Math.atan(.5*w)),-deg(Math.atan(2*w)),-deg(Math.atan2(.05*w,1-w*w/64))]:
      [0,-90,-deg(Math.atan2(.5*w,1-.5*w*w)),-deg(Math.atan(.5*w)),deg(Math.atan(w/3))];
    return angles.slice(0,count).reduce((a,b)=>a+b,0);
  }
  function crossover(K,T){return K>1?Math.sqrt(K**(2/3)-1)/T:null;}
  function nyquistForward(s,k,mode) {
    return mode===0?div([k,0],mul(s,add([1,0],s))):
      div(mul([k,0],mul(add([1,0],s),add([1,0],mul([.5,0],s)))),mul(s,mul(s,s)));
  }
  function nyquistContour(){
    const e=.23,R=30,a=samples(x=>[0,-(10**x)],Math.log10(R),Math.log10(e)),b=samples(a=>[e*Math.cos(a),e*Math.sin(a)],-Math.PI/2,Math.PI/2,150),
      c=samples(x=>[0,10**x],Math.log10(e),Math.log10(R)),d=samples(a=>[R*Math.cos(a),R*Math.sin(a)],Math.PI/2,-Math.PI/2,150);
    return [a,b,c,d];
  }
  const chapter=[
    group("从正弦试验到频率特性",range(1,15),[
      ["频率响应","稳定线性定常系统对正弦输入的稳态输出保持同频，仅幅值和相位变化。瞬态由极点决定，傅里叶分解允许按频率逐项分析。频率法常用于实验、稳定性、性能分析和校正设计。"],
      ["复数和三种图","G(jω)=A(ω)e^{jφ(ω)}=U(ω)+jV(ω)。A=|G|，φ=arg G；极坐标看复平面，对数坐标分开看 20lg A 与 φ，对数幅相图将两者组合。"],
      ["时域与频域的关系","与傅里叶表示相适应的信号可在时域和频域之间换算。正弦、余弦是分解基函数，任意叠加后的波形仍由其频率成分共同构成。"],
      ["两类例题","例4-1 单位反馈下 Φ=1/(s+2)，输入 3sin(2t+90°)，稳态输出为 (3/√8)sin(2t+45°)。例4-2 测得 ω=1 时 A=2、φ=−45°，在标准二阶模型下得到 ωn≈1.24 rad/s、ζ≈0.22。"]
    ],{controls:[C("case","实验",["一阶稳态","例4-1","二阶辨识"],0),R("logw","lg ω",-1,.9,.01,0),R("T","时间常数",.2,3,.05,1," s"),time()],draggable:"cursor",draw(s){
      const w=wAt(s.logw),q=Math.sqrt(8);
      const r=s.case===1?inv([2,w]):s.case===2?div([q,0],[q-(q-1)*w*w,w]):first(w,s.T);
      const A=s.case===1?3:1,phi=s.case===1?Math.PI/2:0;
      const input=samples(t=>[t,A*Math.sin(w*t+phi)],0,12,530);
      const output=samples(t=>[t,A*magnitude(r)*Math.sin(w*t+phi+arg(r))],0,12,530);
      return simple(svg(panel({lines:[{data:input,color:ink.blue,dash:true},{data:output,color:ink.teal}],domain:[0,12,-2*A,2*A],cursor:s.cursor,xTitle:"时间 / s",yTitle:"同频正弦"}),"输入与稳态输出"),
        [["ω",f(w)+" rad/s"],["A",f(magnitude(r),3)],["相位",f(deg(arg(r)),1)+"°"],["输出幅值",f(A*magnitude(r),3)]],
        [s.case===2?"幅值和相位一起约束参数":"频率不变，幅相改变","蓝色为输入，绿色为稳态输出。拖频率，观察相位与幅值如何变化。"]);
    }}),
    group("沿频率描出典型极坐标轨迹",[...range(16,30),57,58],[
      ["典型环节","比例是实轴定点；积分与微分沿负、正虚轴；惯性沿下半圆，圆心 1/2、半径 1/2；一阶微分沿直线 Re=1。二阶微分与对应振荡环节互为倒数；延迟的模为 1，相位为 −ωT。"],
      ["振荡与谐振","0<ζ<1/√2 时存在非零谐振频率 ωr=ωn√(1−2ζ²)，Mr=1/[2ζ√(1−ζ²)]。在 ωn 附近 ζ 越小相位变化越快。谐振可用于选频，也会放大振动。"],
      ["一般方法","归一化并分解，定 ω→0 与 ω→∞ 的极限，求实虚轴交点，再按频率加密描点。模相乘除用向量长度，幅角加减。例4-3 的惯性半圆可由 (Re−0.5)²+Im²=0.25 验证；例4-4 含一个积分和两个惯性环节。"]
    ],{controls:[...sweep(),C("example","轨迹对象",["典型环节","例4-4"],0)],draggable:"logw",draw(s){
      const response=s.example?w=>product([[10,0],[0,-1/w],first(w,.2),first(w,.05)]):w=>normalized(s.kind,w,s.T,s.z);
      const w=wAt(s.logw),z=response(w),span=s.example?4:s.kind===5?4:1.6;
      const resonance=s.z<Math.SQRT1_2?Math.sqrt(1-2*s.z*s.z)/s.T:null;
      return simple(plane([{data:samples(x=>response(wAt(x)),-2,2),color:ink.teal}],[[...z,"当前 ω"]],span,!s.example&&[3,5,7].includes(s.kind)),
        [["ω",f(w)+" rad/s"],["G(jω)",fmt(z)],["幅值",f(magnitude(z),3)]],
        [s.example?"例4-4：10/[s(1+0.2s)(1+0.05s)]":rules[s.kind][1],s.kind===5&&!s.example?(resonance===null?"当前阻尼下没有非零谐振峰。":"谐振频率约 "+f(resonance)+" rad/s。"):"拖频率沿轨迹读点。越出坐标范围时仍可在读数区查看数值。"]);
    }}),
    group("把转折频率翻译成 Bode 图",range(31,43),[
      ["对数坐标的用途","横轴用 lg ω，幅值用 20lg|G(jω)|，乘积各因子的 dB 值和相位可以相加。比例移高度，积分和微分分别给 −20、+20 dB/dec。"],
      ["转折与修正","惯性和一阶零点在 ω=1/T 改变斜率，分别为 −20 和 +20 dB/dec。在转折处，惯性真实幅值比渐近值低约 3 dB，零点高约 3 dB；惯性相位是 −45°。"],
      ["二阶环节和时延","二阶极点高频 −40 dB/dec，二阶零点 +40 dB/dec。二阶峰值取决于阻尼；纯时延幅值不变，相位随 ω 线性下降，不能靠外推斜率读出时延。"]
    ],{controls:sweep(),draggable:"logw",draw(s){
      const rule=rules[s.kind],resp=w=>normalized(s.kind,w,s.T,s.z),w=wAt(s.logw),z=resp(w),phase=s.kind===7?w=>-deg(s.T*w):undefined;
      return simple(bodes(resp,s.logw,{asym:w=>rule[3](w,s.T,s.z),phase}),
        [["ω",f(w)],["幅值",f(db(magnitude(z)),1)+" dB"],["相位",f(phase?phase(w):deg(arg(z)),1)+"°"]],[rule[0],"绿线为精确值，橙色虚线为分段近似。相位近似只用于读图，判断时以精确值为准。"]);
    }}),
    group("逐个累加因子画开环 Bode 图",range(44,48),[
      ["三种绘法","可逐条画因子再叠加，也可从低频起按转折顺序累加斜率；计算法直接在选定 ω 代入描点。比较同一频率下的幅值和，避免将各自的转折处误差重复计入。"],
      ["例4-5","L(s)=4(1+0.5s)/[s(1+2s)(1+0.05s+s²/64)]。从比例 K=4 的 12.04 dB 和积分 −20 dB/dec 开始，按 0.5、2、8 rad/s 处理转折，传递函数分母二阶项取负相位。"],
      ["例4-6","先把 10(s+3)/[s(s+2)(s²+s+2)] 化为标准式，提出 K=7.5。转折顺序 √2、2、3 rad/s；积分型别为 1，高频净斜率 −60 dB/dec。"]
    ],{controls:[C("mode","例题",["例4-5","例4-6"]),W.stages("stage","已叠加因子",["1 个因子","2 个因子","3 个因子","4 个因子","5 个因子"],1),frequency()],draw(s){
      const r=w=>staged(w,s.mode,s.stage),all=w=>staged(w,s.mode,5),w=wAt(s.logw),p=stagePhase(w,s.mode,s.stage);
      return simple(bodes(r,s.logw,{compare:all,phase:w=>stagePhase(w,s.mode,s.stage),phase2:w=>stagePhase(w,s.mode,5)}),
        [["因子",s.stage+" / 5"],["当前频点",f(db(magnitude(r(w))),1)+" dB"],["当前相位",f(p,1)+"°"]],
        ["每次加入一个因子","绿线为当前累加，橙线为完整系统。逐步叠加因子，观察斜率与拐点逐步形成。"]);
    }}),
    group("从频率曲线读型别、辨识和最小相位",range(49,56),[
      ["低频误差系数","ν 个原点积分决定低频斜率 −20ν dB/dec，外推到 ω=1 的幅值是 20lg Kp、20lg Kv 或 20lg Ka。单位负反馈、闭环稳定时阶跃 0 型误差 1/(1+Kp)，斜坡 I 型为 1/Kv，单位抛物 II 型为 1/Ka；更低型别发散，更高型别为零。II 型且 Ka=8 时，低频渐近线与 0 dB 的交点为 ω=√8≈2.83 rad/s。"],
      ["实验辨识","对系统逐频施加低幅正弦，等稳态后测幅值比及相位差。例4-9 低频 −20 定为 I 型、外推 20 dB 得 K=10；转折 1、2、8 给出 10(1+0.5s)/[s(1+s)(1+0.125s)]，再按相差估计纯延迟 0.2 s。"],
      ["最小相位辨别","在稳定有理模型中，零点都在左半平面才是最小相位。右半平面零点与其镜像可有同幅异相；纯延迟也是同幅附相位的典型例子。幅值加高频相位总账能提出判断线索，已知结构和拟合条件仍须核对。"]
    ],{controls:[C("view","观测",["低频与型别","例4-9","同幅异相"]),C("type","系统型别 ν",["0 型","Ⅰ 型","Ⅱ 型"],1),R("gain","低频增益",.5,15,.25,10),frequency()],draggable:"logw",draw(s){
      const type=s.type,low=w=>mul([s.gain,0],mul(first(w,1),product(Array.from({length:type},()=>[0,-1/w]))));
      const identified=w=>mul([10,0],product([[1,.5*w],[0,-1/w],first(w,1),first(w,.125),[Math.cos(.2*w),-Math.sin(.2*w)]]));
      const phaseId=w=>-90+deg(Math.atan(.5*w))-deg(Math.atan(w))-deg(Math.atan(.125*w))-deg(.2*w);
      const min=w=>mul([1,w],first(w,.4)),non=w=>mul([1,-w],first(w,.4)),resp=s.view===0?low:s.view===1?identified:min;
      const w=wAt(s.logw),phi=s.view===0?w=>-90*type-deg(Math.atan(w)):s.view===1?phaseId:undefined;
      return simple(bodes(resp,s.logw,{compare:s.view===2?non:undefined,phase:phi}),
        [["幅值",f(db(magnitude(resp(w))),1)+" dB"],["相位",f(phi?phi(w):deg(arg(resp(w))),1)+"°"],["低频斜率",s.view===0?-20*type+" dB/dec":s.view===1?"−20 dB/dec":"同幅"]],
        [s.view===2?"左半平面与右半平面镜像零点":"从 Bode 曲线认结构","斜率、增益、时延以及非最小相位是不同的可观测特征。"]);
    }}),
    group("沿围线走一圈，看清零极点映射",range(59,69),[
      ["向量法","s−z 是从 z 到 s 的向量。乘积的长度相乘、幅角相加，相除时幅角相减。闭合曲线绕零点一圈引入一个净相角变化，极点的贡献相反。"],
      ["幅角原理","用逆时针正方向的闭合围线时，映射绕原点的逆时针净圈数等于圈内零点数减极点数，计重数。围线上不可正好碰到零极点。"],
      ["闭环方程","F(s)=1+L(s)，F 的零点为闭环特征根，极点来自开环（先排查消去及内部稳定性）。从 F 平面移到 L 平面后，用 −1+j0 替代原点。"]
    ],{controls:[R("zero","零点实坐标",-2,2,.05,.35),R("pole","极点实坐标",-2,2,.05,-1.45),R("cursor","围线角度",0,360,2,65,"°")],draggable:"cursor",draw(s){
      const route=t=>[Math.cos(t),Math.sin(t)],mapper=z=>div(add(z,[-s.zero,0]),add(z,[-s.pole,0]));
      const q=route(s.cursor*Math.PI/180),singular=Math.abs(Math.abs(s.pole)-1)<1e-8||Math.abs(Math.abs(s.zero)-1)<1e-8;
      const image=samples(t=>mapper(route(t)),0,2*Math.PI);
      const get=(lines,marks,id,span)=>panel({lines,marks,domain:[-span,span,-1.03*span,1.03*span],xTitle:"实部",yTitle:id===1?"s 平面":"F(s) 平面",id},{width:310,height:310,top:0});
      const art=svg(get([{data:samples(route,0,2*Math.PI),color:ink.blue}],[[s.zero,0,"零"],[s.pole,0,"极"],[...q,"s"]],1,2.15)+
        '<g transform="translate(310 0)">'+get([{data:image,color:ink.teal}],[[...mapper(q),"F(s)"]],2,2.8)+'</g>',"圆形围线及零极点映射");
      return simple(art,[["围线内零点",Math.abs(s.zero)<1?1:0],["围线内极点",Math.abs(s.pole)<1?1:0],["绕原点逆时针",singular?"临界":(Math.abs(s.zero)<1?1:0)-(Math.abs(s.pole)<1?1:0)]],
        [singular?"零点或极点位于围线上":"F(s)=(s−z)/(s−p)",singular?"移开临界零、极点，才能应用幅角原理。":"拖观察点比较同一时刻两个平面上的位置。"]);
    }}),
    group("补全 Nyquist 围线，再判断闭环稳定",range(70,77),[
      ["四段必须合拢","正频率支、负频率共轭支、无穷大圆弧映射和虚轴极点小凹弧共同构成闭合 Nyquist 像。虚轴极点用向右绕开的小半圆排除在区域外，禁止只看正频率支。"],
      ["判稳约定","右半平面围线按顺时针方向时，令 N 是 L 像绕 −1 的顺时针净次数，P 是区域内开环右半平面极点数，则 Z=P+N。判稳定要求 Z=0，且没有虚轴闭环极点。"],
      ["临界和条件稳定","例4-10 的 K/[s(1+Ts)] 在正 K、T 时闭环稳定。例4-12 的 K(1+s)(1+0.5s)/s³ 可由劳斯判据交叉校核，K>4/3 稳定，0<K<4/3 有两个右半平面根。"]
    ],{controls:[C("mode","系统",["例4-10","例4-12"]),R("gain","增益 K",.2,4,.02,1.8),C("piece","围线分段",["负频支","虚轴小凹弧","正频支","无穷大回弧"],2)],draggable:"gain",draw(s){
      const segments=nyquistContour(),lines=segments.map((row,i)=>({data:row.map(z=>nyquistForward(z,s.gain,s.mode)),color:i===s.piece?ink.teal:"#a8bdd0"}));
      const c=-.75*s.gain,end=lines[s.piece].data.at(Math.floor(lines[s.piece].data.length*.52));
      const critical=s.mode===1&&Math.abs(s.gain-4/3)<1e-5;
      const Z=s.mode===0?0:s.gain>4/3?0:2;
      const marks=[
        [-1,0,"临界点","#a74d22",{shape:"diamond",dx:-11,dy:-13}],
        [...end,"当前段",ink.teal,{dx:11,dy:19}],
        ...(s.mode?[[c,0,"实轴交点","#385875",{dx:11,dy:-37}]]:[])
      ];
      return simple(plane(lines,marks,3),
        [["P",0],["Z",critical?"临界":Z],["闭环",critical?"虚轴有根":Z?"不稳定":"稳定"]],
        [s.mode?"三型条件稳定：临界 K=4/3":"K/[s(1+s)]",["负频支","虚轴小凹弧","正频支","无穷大回弧"][s.piece]+"高亮。远处围线映射可超出视窗。"]);
    }}),
    group("裕度量出离临界还有多远",range(78,81),[
      ["相角裕度","在 |L|=1 的增益交越频率上，按连续展开相位与 −180° 的距离读 γ=180°+φ(ωc)。"],
      ["幅值裕度","在 φ=−180° 的相位交越频率上，h=1/|L(jωg)|，其对数值为 −20lg|L(jωg)|。Nyquist 图上分别在单位圆、负实轴读取。"],
      ["读图边界","有多重交越、开环不稳定或条件稳定时，应结合同完整 Nyquist 围线判断。Bode 增益相位关系依赖最小相位等条件。"]
    ],{controls:[R("gain","增益 K",.5,16,.1,4),R("T","时间常数 T",.3,3,.05,1," s"),frequency()],draggable:"gain",draw(s){
      const w=wAt(s.logw),wc=crossover(s.gain,s.T),wg=Math.sqrt(3)/s.T,toPhase=w=>-3*deg(Math.atan(w*s.T));
      const resp=w=>mul([s.gain,0],product(Array.from({length:3},()=>first(w,s.T))));
      return simple(bodes(resp,s.logw,{phase:toPhase,markZero:true}),
        [["ωc",wc===null?"无正频交越":f(wc)+" rad/s"],["相角裕度",wc===null?"—":f(180+toPhase(wc),1)+"°"],["幅值裕度",f(db(8/s.gain),1)+" dB"]],
        ["用同一个简单例验证", "本例 L=K/(1+Ts)³，ωg="+f(wg)+" rad/s。在游标处相位为 "+f(toPhase(w),1)+"°。"]);
    }}),
    group("由开环相量读闭环幅值和相位",range(82,87),[
      ["闭环相量","单位负反馈 Φ=L/(1+L)。闭环幅值 M=|L|/|1+L|；复平面以原点和 −1 为两个定点。M≠1 时等幅值线为阿波罗尼斯圆，M=1 时为 Re L=−1/2。"],
      ["等相角网格","闭环相位为 arg L−arg(1+L)。等 N 圆来自固定该角，两段圆弧可能对应相差 180° 的角；作图时按实际相角选择分支。"],
      ["Nichols 表达","横轴为开环相位，纵轴为开环 dB。开环曲线叠加闭环等幅等相网格，交点读闭环幅相，便于观察谐振峰。"]
    ],{controls:[C("view","图形",["等 M","等相角","Nichols"]),R("M","等幅值水平",-12,12,.5,3," dB"),R("N","等相角",-165,-15,5,-60,"°"),frequency()],draggable:"logw",draw(s){
      const resp=w=>div([2.1,0],mul([0,w],[1,w])),w=wAt(s.logw),z=resp(w),closed=div(z,add([1,0],z));
      const openCurve=samples(l=>resp(wAt(l)),-2,2);
      const m=10**(s.M/20),h=1/(2*Math.tan(s.N*Math.PI/180));let planeArt;
      if(s.view===2){
        const phase=w=>-90-deg(Math.atan(w));
        const data=samples(l=>[phase(wAt(l)),db(magnitude(resp(wAt(l))))],-2,2);
        const inverse=(r,p)=>{
          const q=[r*Math.cos(p),r*Math.sin(p)], o=div(q,add([1,0],[-q[0],-q[1]]));
          return [deg(arg(o)),db(magnitude(o))];
        };
        const level=mb=>samples(p=>inverse(10**(mb/20),p),-Math.PI,-.001);
        const latitude=alpha=>samples(d=>inverse(10**d,alpha*Math.PI/180),-2,1.8);
        const grid=[-8,-4,0,2,6].map(mb=>({data:level(mb),color:"#b6cbd9",dash:true})).concat([-135,-90,-45].map(alpha=>({data:latitude(alpha),color:"#d2c3d7",dash:true})));
        planeArt=svg(panel({lines:[...grid,{data:level(s.M),color:ink.orange,dash:true},{data:latitude(s.N),color:ink.violet,dash:true},{data,color:ink.teal}],marks:[[phase(w),db(magnitude(z)),"当前频点"]],domain:[-180,-90,-48,37],xTitle:"开环相位 / °",yTitle:"开环幅值 / dB"}),"Nichols 开环曲线及闭环等幅、等相网格");
      }else{
        let loci;
        if(s.view===0){
          const a=m*m-1;
          loci=Math.abs(a)<1e-10?[[-.5,-3],[-.5,3]]:samples(t=>[-m*m/a+m/Math.abs(a)*Math.cos(t),m/Math.abs(a)*Math.sin(t)],0,2*Math.PI);
        }else loci=samples(t=>{const p=[-.5+Math.hypot(.5,h)*Math.cos(t),h+Math.hypot(.5,h)*Math.sin(t)];return Math.abs(deg(arg(div(p,add([1,0],p))))-s.N)<1?p:[NaN,NaN];},0,2*Math.PI,400);
        planeArt=plane([{data:openCurve,color:ink.teal},{data:loci,color:ink.orange,dash:true}],[[-1,0,"−1"],[...z,"L"]],2.8);
      }
      return simple(planeArt,[["闭环幅值",f(magnitude(closed),3)],["闭环相位",f(deg(arg(closed)),1)+"°"]],
        [ ["等 M 轨迹","等相角轨迹","开环 Nichols 曲线"][s.view],s.view===2?"橙色是选中的闭环等幅线，紫色是选中的闭环等相线。拖动频率定位开环工作点。":"拖频率读取同一个工作点的闭环幅值和相角。"]);
    }}),
    group("把频域指标读回稳、快、准",range(88,95),[
      ["标准二阶关系","单位负反馈 L=ωn²/[s(s+2ζωn)]。γ 与 ζ 一一对应，ωc 定时间尺度。欠阻尼、2% 误差带有 ts≈4/(ζωn)=8/(ωc tan γ)；γ≈100ζ 属于工程近似。"],
      ["闭环频域指标","低频读静态增益；谐振频率、谐振峰值描述共振；相对零频幅值下降约 3 dB 时的频率为带宽。只有 ζ<1/√2 才有非零谐振峰。"],
      ["高阶经验关系","在适合的开环交越形状下，经验式用 Mr≈1/sin γ 把相角裕度与闭环峰值联系起来。令 q=1/sin γ−1，可估峰值超调比例 0.16+0.4q，调节时间约 (π/ωc)(2+1.5q+2.5q²)。"],
      ["三频段与经验式","开环低频增益关系到稳态精度，中频交越关系到速度和裕度，高频衰减限制测量噪声通过。高阶经验关系是有条件的拟合，需用时域计算、仿真或实验核对。课堂题按速度选带宽/交越、按相对稳定性选裕度。"]
    ],{controls:[R("z","阻尼比 ζ",.18,.92,.02,.4),R("wn","固有频率 ωn",.5,4,.1,1.5," rad/s"),frequency()],draggable:"z",draw(s){
      const w=wAt(s.logw),p=s.z,n=s.wn,d=Math.sqrt(Math.sqrt(1+4*p**4)-2*p*p),wc=n*d,phase=deg(Math.atan2(2*p*n,wc));
      const wb=n*Math.sqrt(1-2*p*p+Math.hypot(1-2*p*p,1));
      const closed=w=>div([n*n,0],[n*n-w*w,2*p*n*w]),ol=w=>div([n*n,0],mul([0,w],[2*p*n,w]));
      const mp=100*Math.exp(-Math.PI*p/Math.sqrt(1-p*p)),res=p<Math.SQRT1_2?f(1/(2*p*Math.sqrt(1-p*p)),2):"无峰";
      return simple(bodes(closed,s.logw,{compare:ol,phase2:w=>-90-deg(Math.atan(w/(2*p*n)))}),
        [["γ",f(phase,1)+"°"],["ωc",f(wc)],["ωb",f(wb)],["Mr",res]],
        ["绿为闭环，橙为开环","闭环当前幅值 "+f(magnitude(closed(w)))+"；二阶阶跃超调 "+f(mp,1)+"%，调节时间估算 "+f(4/(p*n))+" s。"]);
    }})
  ];
  window.CourseUnits??={};
  window.CourseUnits[4]={label:"第四章 频率响应法",groups:chapter};
})();
