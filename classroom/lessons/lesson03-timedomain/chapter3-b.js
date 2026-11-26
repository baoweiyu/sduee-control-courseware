"use strict";
(() => {
  const W=IntroWidgets,M=IntroModels,{range:R,choices:C,ink,plot,readouts,note,escape}=W;
  const fmt=(x,n=3)=>Number.isFinite(x)?Number(x.toFixed(n)).toString():"—";
  const values=(...items)=>readouts(items.map(([label,value])=>[label,typeof value==="number"?fmt(value):value]));
  const panel=(title,copy)=>'<section class="text-block"><h3>'+escape(title)+'</h3><p>'+escape(copy)+'</p></section>';
  const line=(d,color="#6f8197",w=2)=>'<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="'+w+'" stroke-linejoin="round" stroke-linecap="round"/>';
  const text=(x,y,label,color="#37465a",size=17)=>'<text x="'+x+'" y="'+y+'" text-anchor="middle" fill="'+color+'" font-size="'+size+'" font-weight="640">'+escape(label)+'</text>';
  const art=(label,body)=>'<svg viewBox="0 0 650 250" role="img" aria-label="'+escape(label)+'">'+body+'</svg>';
  const rows=fn=>Array.from({length:M.steps+1},(_,i)=>{const t=i*M.dt;return {t,...fn(t)};});
  const trace=(series,key,label,color,dash=false)=>({series,key,label,color,dash});
  const typ=(w,z)=>({w,z,wd:w*Math.sqrt(Math.max(0,1-z*z)),sigma:w*z,beta:Math.acos(Math.min(1,z))});
  function step(t,w,z){
    if(Math.abs(z-1)<1e-7)return 1-(1+w*t)*Math.exp(-w*t);
    const d=Math.sqrt(Math.abs(1-z*z));
    if(z<1)return 1-Math.exp(-z*w*t)*(Math.cos(w*d*t)+z/d*Math.sin(w*d*t));
    const p=w*(-z+d),q=w*(-z-d);
    return 1-(q*Math.exp(p*t)-p*Math.exp(q*t))/(q-p);
  }
  function impulse(t,w,z){
    if(Math.abs(z-1)<1e-7)return w*w*t*Math.exp(-w*t);
    const d=Math.sqrt(Math.abs(1-z*z));
    if(z<1)return w/d*Math.exp(-z*w*t)*Math.sin(w*d*t);
    return w/d*(Math.exp(w*(-z+d)*t)-Math.exp(w*(-z-d)*t))/2;
  }
  const overshoot=z=>z>=1?0:100*Math.exp(-Math.PI*z/Math.sqrt(1-z*z));
  const estimates=(w,z,d=.02)=>{
    const {wd,beta,sigma}=typ(w,z);
    return {
      tr:wd?(Math.PI-beta)/wd:Infinity,
      tp:wd?Math.PI/wd:Infinity,
      ts:z===1?(d===.02?5.834:4.744)/w:z>0&&z<1?Math.log(1/(d*Math.sqrt(1-z*z)))/sigma:Infinity,
      approx:d===.02?4/sigma:3/sigma,
      td:(1+.6*z+.2*z*z)/w
    };
  };
  function plane(points,showAngle=false){
    const horizontal=Math.max(2,...points.map(([r])=>Math.abs(r)))*1.18;
    const vertical=Math.max(1.5,...points.map(([,i])=>Math.abs(i)))*1.32;
    const scale=Math.min(250/horizontal,89/vertical);
    const x=r=>340+r*scale,y=i=>122-i*scale;
    const mark=([r,i,name,kind])=>{
      const a=x(r),b=y(i);
      const symbol=kind==="zero"?'<circle cx="'+a+'" cy="'+b+'" r="7" fill="none" stroke="#8c612a" stroke-width="2"/>':
        line("M"+(a-6)+" "+(b-6)+"l12 12m0-12-12 12",ink.teal,3);
      return symbol+(name?text(a-5,b-13,name,ink.teal,15):"");
    };
    let geometry="";
    if(showAngle&&points[0]?.[1]>0){
      const [r,i]=points[0],angle=Math.atan2(i,-r);
      geometry=line("M340 122L"+x(r)+" "+y(i),"#69579e",2)+
        line("M306 122A34 34 0 0 1 "+(340-34*Math.cos(angle))+" "+(122-34*Math.sin(angle)),"#69579e",2)+
        text(340-54*Math.cos(angle/2),127-54*Math.sin(angle/2),"β","#69579e",18);
    }
    return art("极点在 s 平面的位置",line("M37 122H613 M340 30V217")+text(615,143,"Re")+text(363,31,"Im")+
      text(353,144,"0")+geometry+points.map(mark).join(""));
  }
  function poles(w,z){
    if(z===1)return [[-w,0,"二重根"]];
    if(z<1){
      const {wd,sigma}=typ(w,z);
      return [[-sigma,wd,"s₁"],[-sigma,-wd,"s₂"]];
    }
    const d=w*Math.sqrt(z*z-1);
    return [[-w*z+d,0],[-w*z-d,0]];
  }
  const Wn=(value=1)=>R("w","自然频率 ωₙ",.65,8,.05,value," rad/s");
  const Zeta=(value=.5)=>R("z","阻尼比 ζ",.08,.93,.01,value);
  function response(kind,setup={}){
    const title={
      critical:"重极点和单调阶跃",under:"衰减振荡及包络线",rise:"标出第一次到达终值",peak:"把峰值位置和超调分开",
      settling:"移动误差带检查调节时间",metrics:"极点与性能一起变",summary:"由指标回看二阶响应",example:"例题原始参数",
      impulse:"阶跃导数与脉冲响应",ramp:"观察斜坡稳态误差",zero:"调零点，观察微分项权重",third:"调附加极点与原二阶对照"
    }[kind];
    const zDefault=setup.z??.5,wDefault=setup.w??1;
    const controls=[
      ...(!setup.fixed?[Wn(wDefault)]:[]),
      ...(!setup.fixed&&kind!=="critical"?[kind==="impulse"?R("z","阻尼比 ζ",0,1.6,.05,zDefault):Zeta(zDefault)]:[]),
      ...(["settling","summary"].includes(kind)?[C("band","允许误差",["±2%","±5%"])]:[]),
      ...(kind==="zero"?[R("tau","零点时间常数 τ",0,2,.05,.8," s")]:[]),
      ...(kind==="third"?[R("relative","相对位置 β",.5,15,.1,3)]:[])
    ];
    return {
      title,chartTitle:kind==="impulse"?"脉冲响应 k(t)":kind==="ramp"?"单位斜坡与系统输出":"单位阶跃响应 h(t)",
      controls,...(controls.length?{draggable:kind==="zero"?"tau":kind==="third"?"relative":kind==="critical"?"w":setup.fixed?undefined:"z"}:{}),
      draw(s){
        const w=setup.fixed?wDefault:s.w,z=kind==="critical"?1:setup.fixed?zDefault:s.z;
        const gap=s.band?.05:.02,m=estimates(w,z,gap),{wd,sigma,beta}=typ(w,z);
        let lagged=0;
        const l=s.relative*s.z*s.w;
        const data=rows(t=>{
          const h=step(t,w,z), k=impulse(t,w,z), env=z<1?Math.exp(-sigma*t)/Math.sqrt(1-z*z):0;
          const r=kind==="ramp"?t-2*z/w+Math.exp(-sigma*t)*Math.sin(wd*t+2*beta)/wd:0;
          const currentLag=lagged;
          if(kind==="third")lagged+=(-Math.expm1(-l*M.dt))*(h-lagged);
          return {h,k,r,ref:kind==="ramp"?t:1,enhanced:h+(s.tau||0)*k,lag:currentLag,
            upper:kind==="settling"?1+gap:1+env,lower:kind==="settling"?1-gap:1-env};
        });
        const moment=M.at(data,s.time);
        const traces=kind==="impulse"?[trace(data,"k","脉冲响应",ink.teal)]:kind==="ramp"?
          [trace(data,"ref","斜坡输入",ink.target,true),trace(data,"r","斜坡输出",ink.teal)]:
          [trace(data,"ref","稳态值",ink.target,true),trace(data,"h","标准响应",ink.teal)];
        if(["under","settling"].includes(kind))traces.push(trace(data,"upper",kind==="under"?"包络上界":"允许上界",ink.blue,true),trace(data,"lower",kind==="under"?"包络下界":"允许下界",ink.blue,true));
        if(kind==="zero")traces.push(trace(data,"enhanced","附加零点",ink.orange));
        if(kind==="third")traces.push(trace(data,"lag","附加极点",ink.orange));
        const event=({critical:m.ts,rise:m.tr,peak:m.tp,settling:m.ts,impulse:m.tp,example:m.tp})[kind];
        const keyList=traces.map(x=>x.key),range= data.flatMap(row=>keyList.map(key=>row[key]));
        const label=({critical:"2% 带",under:"阻尼角 β",rise:"首次穿越稳态值",peak:"首个峰值",settling:"包络进入误差带",
          metrics:"ζ、ωₙ、极点与响应",example:"按闭环标准式代入",impulse:"脉冲响应零点",ramp:"长时间后的固定误差",
          zero:"零点调权，极点保持",third:"附加极点等效为一阶惯性",summary:"欠阻尼系统的常用指标"})[kind];
        const copy=({critical:"ζ=1。负实二重根使响应含 t·e^(−ωₙt) 项。",
          under:"指数包络由 σ 决定，振荡角频率为 ω_d。",
          rise:"第一次到达 1 时，ω_dt+β=π，故 tᵣ=(π−β)/ω_d。",
          peak:"tₚ=π/ω_d，超调量只依赖 ζ。",
          settling:"包络线进入误差带可保证响应进入，得到的调节时间偏保守。课件 4/σ 与 3/σ 是常用工程近似。",
          metrics:"固定 ζ 再调 ωₙ，比较时间尺度。固定 ωₙ 再调 ζ，观察超调量。",
          example:"例 3-1 取 ωₙ=5、ζ=0.6。调节时间采用课件 4/(ζωₙ) 近似。",
          impulse:"0<ζ<1 时，脉冲响应首次过零对应阶跃峰值；首波面积为 1+超调量的小数值。",
          ramp:"稳定时，误差趋近 2ζ/ωₙ。增大阻尼有利于减振，却会增加斜坡误差。",
          zero:"c(t)=h(t)+τk(t)。τ=0 时与标准响应重合。",
          third:"β=s₀/(ζωₙ)。s₀ 越大，附加极点离虚轴越远，响应越接近原二阶模型。",
          summary:"ζ 固定时，时间指标与 ωₙ 成反比，超调量不随 ωₙ 变。"
        })[kind];
        const picks=({
          critical:[["tₛ（2%）/s",m.ts],["h(t)",moment.h]],
          under:[["σ",sigma],["ω_d",wd],["β / °",beta*180/Math.PI]],
          rise:[["tᵣ / s",m.tr],["ω_d",wd],["β / °",beta*180/Math.PI]],
          peak:[["tₚ / s",m.tp],["超调量 / %",overshoot(z)]],
          settling:[["包络法 / s",m.ts],["工程近似 / s",m.approx],["t_d / s",m.td]],
          metrics:[["tᵣ / s",m.tr],["tₚ / s",m.tp],["tₛ / s",m.approx],["超调 / %",overshoot(z)]],
          example:[["tᵣ / s",m.tr],["tₚ / s",m.tp],["tₛ / s",m.approx],["超调 / %",overshoot(z)]],
          impulse:[["k(t)",moment.k],["首波面积",z<1?1+overshoot(z)/100:"—"]],
          ramp:[["当前误差",s.time-moment.r],["稳态误差",2*z/w]],
          zero:[["标准 h(t)",moment.h],["含零点 c(t)",moment.enhanced]],
          third:[["标准 h(t)",moment.h],["三阶输出",moment.lag],["附加极点",-l]],
          summary:[["tᵣ / s",m.tr],["tₚ / s",m.tp],["tₛ / s",m.approx],["超调 / %",overshoot(z)],["斜坡 eₛₛ",2*z/w]]
        })[kind];
        const points=[...poles(w,z),...(kind==="third"?[[-l,0,"附加极点"]]:[])];
        return {art:plane(points,["under","rise","metrics"].includes(kind)),chart:plot(traces,s.time,
          {low:Math.min(0,...range)*1.07,high:Math.max(.025,...range)*1.09,unit:"幅值",...(Number.isFinite(event)&&event<M.duration?{event}:{})}),
          readouts:values(...picks),detail:panel(label,copy)};
      }
    };
  }
  const names=["零阻尼","欠阻尼","临界阻尼","过阻尼"];
  const comparison={
    title:"四组极点，四种阶跃波形",chartTitle:"四种阻尼对同一单位阶跃的响应",
    controls:[C("mode","高亮",names,1),Wn()],draggable:"w",
    draw(s){
      const ratios=[0,.48,1,1.6],keys=["a","b","c","d"];
      const data=rows(t=>Object.fromEntries(keys.map((k,i)=>[k,step(t,s.w,ratios[i])])));
      return {art:plane(poles(s.w,ratios[s.mode]),s.mode===1),chart:plot(keys.map((key,i)=>
        trace(data,key,names[i],[ink.orange,ink.teal,ink.blue,ink.violet][i],i!==s.mode)),s.time,{high:2.14,unit:"幅值"}),
        readouts:values(["阻尼比 ζ",ratios[s.mode]],["当前幅值",M.at(data,s.time)[keys[s.mode]]]),
        detail:panel(names[s.mode],["纯虚根产生等幅振荡。","左半平面的一对共轭复根产生衰减振荡。","负实二重根，单调上升。","两个负实根，较慢实根主导后段。"][s.mode])};
    }
  };
  const sigmaLab={
    title:"从 ζ 读超调量",timed:false,
    controls:[R("z","阻尼比 ζ",0,1.2,.001,.5)],draggable:"z",
    draw(s){
      const X=z=>53+z*455,Y=mp=>195-mp*1.4;
      const curve=Array.from({length:121},(_,i)=>[X(i/100),Y(overshoot(i/100))]).map((p,i)=>(i?"L":"M")+p.join(" ")).join(" ");
      const x=X(s.z),y=Y(overshoot(s.z));
      return {art:art("超调量随阻尼比减小",line("M53 195H624 M53 195V29")+
        [0,.4,.8,1.2].map(v=>text(X(v),222,fmt(v),undefined,14)).join("")+
        [0,25,50,75,100].map(v=>text(34,Y(v)+4,fmt(v),undefined,14)).join("")+
        text(29,26,"σ%",undefined,14)+text(622,224,"ζ")+line(curve,ink.teal,3)+
        line("M"+x+" "+y+"V195",ink.blue,1.4)+'<circle cx="'+x+'" cy="'+y+'" r="5" fill="'+ink.teal+'"/>'),
        readouts:values(["阻尼比",s.z],["超调量 / %",overshoot(s.z)]),
        detail:panel("已知超调量，反求阻尼比","推荐区间 ζ≈0.4～0.8 是工程上的折中。ζ≈0.707 对应超调约 4.3%。")};
    }
  };
  function antenna(angle){
    const clamped=Math.max(-25,Math.min(55,angle*31-13));
    return art("地面站天线伺服机构",'<defs><linearGradient id="dish-tone" x2="1" y2="1"><stop offset="0" stop-color="#fbfcff"/><stop offset=".58" stop-color="#d4ddea"/><stop offset="1" stop-color="#8c9db2"/></linearGradient></defs>'+
      '<ellipse cx="323" cy="214" rx="155" ry="17" fill="#e3e8f0"/><path d="M226 206 247 184H407L431 206Z" fill="#a7b5c7" stroke="#586d85"/>'+
      '<rect x="292" y="129" width="62" height="58" rx="7" fill="url(#dish-tone)" stroke="#586d85"/>'+
      '<g transform="rotate('+clamped+' 324 125)"><path d="M222 87Q325 169 426 87Q422 162 325 168Q228 162 222 87Z" fill="url(#dish-tone)" stroke="#506783" stroke-width="2"/>'+
      line("M222 87Q324 117 426 87 M325 116V62 M287 103L325 62 364 103","#405a7a",2)+
      '<circle cx="325" cy="61" r="6" fill="#7464ab"/><path d="M320 51h10" stroke="#7464ab" stroke-width="3"/></g>'+
      '<circle cx="324" cy="128" r="8" fill="#7464ab"/>'+text(324,234,"输出转角 n(t) · 示意",undefined,16));
  }
  function servo(kind){
    const gain=kind==="gain",design=kind==="design",T=.25;
    return {
      title:gain?"通过增益改变天线转角响应":design?"原系统和设计后的测速反馈":"增大阻尼，保持自然频率",
      chartTitle:"原系统与调整后的单位阶跃",
      controls:[
        ...(gain?[R("k","开环增益 K",2,24,.1,16)]:[]),
        ...(design?[C("designed","强调",["原系统","设计后"],1)]:!gain?[R("tau","速度反馈系数 τ",0,.125,.0025,.0625," s")]:[])
      ],
      ...(!design?{draggable:gain?"k":"tau"}:{}),
      draw(s){
        const k=gain?s.k:16,tau=gain?0:design?.0625:s.tau;
        const z=(1+k*tau)/(2*Math.sqrt(k*T)),w=Math.sqrt(k/T),origin=.25;
        const selected=design&&s.designed===0?"original":"current";
        const data=rows(t=>({original:step(t,8,origin),current:step(t,w,z),ref:1}));
        const duration=estimates(w,z);
        const m=M.at(data,s.time);
        return {art:antenna(m[selected]),chart:plot([trace(data,"ref","给定",ink.target,true),
          trace(data,"original","K=16，未校正",ink.blue,selected==="current"),trace(data,"current",gain?"调整 K":"速度反馈",ink.teal,selected==="original")],s.time,{high:1.58,unit:"相对转角"}),
          readouts:values(["自然频率",w],["阻尼比",z],["超调 / %",overshoot(z)],["近似 tₛ / s",duration.approx]),
          detail:panel(gain?"以超调换速度":"一阶系数改变，常数项保持",
            gain?"K=4 时 ζ=0.5，课件将 16.3% 近似记为 16%；若限值严格为 16%，须把 K 略降到 4 以下。":
            "固定 K=16、T=0.25。τ=0.0625 s 时，ζ 由 0.25 变为 0.5，ωₙ 保持 8 rad/s。"),
          note:note(gain?"拖动 K 到 4，再核对由超调得到的 ζ。":"比较超调和调节时间；当前取近似 tₛ=4/(ζωₙ)。")};
      }
    };
  }
  const decomposition={
    title:"把高阶响应拆成指数与振荡分量",chartTitle:"各模态分量与总响应",
    controls:[R("real","实根衰减率",.25,3,.05,.75),R("weight","实根分量权重",.1,.9,.02,.46)],draggable:"real",
    draw(s){
      const data=rows(t=>{
        const real=-s.weight*Math.exp(-s.real*t),complex=-(1-s.weight)*Math.exp(-.45*t)*Math.cos(2.2*t);
        return {real,complex,total:1+real+complex};
      });
      return {art:plane([[-s.real,0,"实极点"],[-.45,2.2,"复极点"],[-.45,-2.2,"复极点"]]),
        chart:plot([trace(data,"real","实根分量",ink.orange),trace(data,"complex","共轭分量",ink.blue),
          trace(data,"total","总响应",ink.teal)],s.time,{low:-1.05,high:1.65,unit:"幅值"}),
        readouts:values(["实根分量",M.at(data,s.time).real],["共轭分量",M.at(data,s.time).complex]),
        detail:panel("由模态叠加而来","固定极点后改变权重，可以改变曲线形状；留数由完整零极点决定。")};
    }
  };
  const dominance={
    title:"远极点与近似零极点抵消",chartTitle:"低阶近似与带附加模态的示意",
    controls:[R("ratio","远极点/主极点衰减比",1.2,10,.1,5),R("gap","零极点间距",.025,.8,.025,.125)],
    draggable:"ratio",
    draw(s){
      const rate=.45*s.ratio,residue=s.gap/(rate+s.gap);
      const data=rows(t=>{
        const base=step(t,1.3,.45/1.3);
        return {base,full:base+residue*(Math.exp(-rate*t)-Math.exp(-.45*t))};
      });
      const points=[[-rate,0,"远极点"],[-rate-s.gap,0,"","zero"],[-.45,1.22,"主导对"],[-.45,-1.22]];
      return {art:plane(points),chart:plot([trace(data,"base","主导二阶",ink.target,true),trace(data,"full","含附加模态",ink.teal)],s.time,{high:1.65,unit:"幅值"}),
        readouts:values(["衰减率之比",s.ratio],["近消去权重",residue]),
        detail:panel("看极点位置，也看附近零点","圆圈是附加零点，叉号是极点。该波形是模态权重示意，用以观察近邻零点的影响。")};
    }
  };
  const dominantTrace=rows(t=>({y:step(t,1.55,.39)+.12*(Math.exp(-4*t)-Math.exp(-6*t))}));
  const ballLab={
    title:"撤去推力后，谷底和坡顶",chartTitle:"局部平衡的扰动后响应",
    controls:[C("terrain","平衡位置",["谷底","坡顶"]),R("off","初始偏离",.05,.65,.05,.25)],
    draggable:"off",
    draw(s){
      const a=s.terrain?.42:-.7,data=rows(t=>({y:s.off*Math.exp(a*t)})),p=M.at(data,s.time);
      const x=319+Math.min(225,p.y*110), q=(x-319)/237;
      const y=s.terrain?91+65*q*q:181-68*q*q;
      return {art:art("小球在稳定或不稳定平衡附近运动",'<defs><radialGradient id="stability-sphere" cx=".34" cy=".28"><stop offset="0" stop-color="#f9f7ff"/><stop offset=".43" stop-color="#9b8cc3"/><stop offset="1" stop-color="#524685"/></radialGradient></defs>'+
        line(s.terrain?"M82 156Q319 26 556 156":"M82 113Q319 249 556 113","#698196",5)+
        '<circle cx="'+x+'" cy="'+(y-19)+'" r="18" fill="url(#stability-sphere)" stroke="#514386"/>'+text(319,224,s.terrain?"坡顶 · 偏离扩大":"谷底 · 回到原处",undefined,16)),
        chart:plot([trace(data,"y","偏离量",ink.teal)],s.time,{high:Math.max(.1,s.off*1.12,data.at(-1).y*1.12),unit:"相对偏离"}),
        readouts:values(["初始偏离",s.off],["当前偏离",p.y]),
        detail:panel(s.terrain?"扰动撤去后继续偏离":"扰动撤去后偏离衰减","只用局部运动示意回归或逃离的方向。")};
    }
  };
  const modeLab=(kind)=>{
    const predefined=kind==="table";
    return {
      title:predefined?"按根选取响应形状":kind==="general"?"重根给暂态带来时间因子":"把零输入暂态单独画出来",
      chartTitle:"由特征根决定的自由响应",
      controls:predefined?[C("mode","根型",["负实根","正实根","左半平面共轭对","右半平面共轭对","纯虚共轭对"])]:
        [R("rate","根的实部 σ",-1.3,.32,.01,-.4),R("omega","虚部 ω",0,3,.05,1.7),...(kind==="general"?[C("order","根的阶数",["单根","二重根","三重根"])]:[])],
      ...(!predefined?{draggable:"rate"}:{}),
      draw(s){
        const [rate,omega]=predefined?[[-.45,0],[.26,0],[-.42,1.7],[.17,1.7],[0,1.7]][s.mode]:[s.rate,s.omega];
        const exp=s.order||0, data=rows(t=>{const bound=Math.exp(rate*t)*(exp?t**exp:1);return {y:bound*Math.cos(omega*t),upper:bound,lower:-bound};});
        const max=Math.max(1,...data.map(d=>d.upper))*1.08;
        const tag=rate<0?"暂态衰减":rate>0?"暂态发散":exp?"重复虚轴模态增长":"暂态不衰减";
        return {art:plane([[rate,omega,"根"],...(omega?[[rate,-omega]]:[])]),
          chart:plot([trace(data,"upper","上包络",ink.target,true),trace(data,"lower","下包络",ink.target,true),trace(data,"y","自由响应",ink.teal)],s.time,
            {low:omega?-max:0,high:max,unit:"幅值"}),
          readouts:values(["实部 σ",rate],["虚部绝对值",omega],["当前幅值",M.at(data,s.time).y]),
          detail:panel(tag,exp?"重复极点增加 t、t² 等因子。实部为负时，带有限阶因子的指数项最终仍衰减。":
            "自然模态由特征方程决定。虚轴单根可保持振幅，所有根实部为负才是渐近稳定。")};
      }
    };
  };
  const motivation={
    title:"比较求根与按系数判稳",timed:false,
    controls:[R("r","实根位置 γ",-.8,.8,.05,-.35)],draggable:"r",
    draw(s){
      const r=s.r;
      return {art:plane([[-2,0,"−2"],[-1,0,"−1"],[r,0,"γ"]]),
        readouts:values(["s² 系数",3-r],["s 系数",2-3*r],["常数项",-2*r]),
        detail:panel(r<0?"本例全部在左半平面":"本例不满足渐近稳定","示例特征式为 (s+2)(s+1)(s−γ)。下一页改从系数表直接分析。")};
    }
  };
  function routh(coefficients){
    const columns=Math.ceil(coefficients.length/2);
    const rows=[Array.from({length:columns},(_,i)=>coefficients[2*i]??0),Array.from({length:columns},(_,i)=>coefficients[2*i+1]??0)];
    for(let i=2;i<coefficients.length;i++){
      const upper=rows[i-2],lower=rows[i-1];
      if(lower[0]===0){rows.push(Array(columns).fill(0));continue;}
      rows.push(Array.from({length:columns},(_,j)=>(lower[0]*(upper[j+1]||0)-upper[0]*(lower[j+1]||0))/lower[0]));
    }
    return rows;
  }
  const rootCoefficients=[1,6,15,20,15,6,1];
  function routhPicture(table,count=28,band=-1){
    let data=0;
    const body=table.map((row,i)=>{
      const y=54+i*29;
      return (i===band?'<rect x="86" y="'+(y-17)+'" width="506" height="25" rx="5" fill="#eeeaf9"/>':"")+
        text(68,y,"s"+["⁶","⁵","⁴","³","²","¹","⁰"][i],undefined,17)+row.map((value,j)=>
          text(171+j*127,y,data++<count?fmt(value):"·",j===0?"#5d4d9f":"#37465a",17)).join("");
    }).join("");
    return art("劳斯表 · 第一列突出",line("M105 37V233 M104 38H592","#bdc9d8",1.5)+
      [1,2,3,4].map((n,j)=>text(171+j*127,26,"第 "+n+" 列",undefined,15)).join("")+body);
  }
  const tableLab={
    title:"从前两行开始逐步填表",timed:false,
    controls:[IntroWidgets.stages("progress","填表步骤",["写行号","填第一行","填第二行","计算 b₁","计算 b₂","完成第三行","以 b₁ 为分母","完成第四行","递推余行","检查第一列"])],
    draw(s){
      const masks=[0,4,8,9,10,12,13,16,20,28];
      const desc=["先写出行号。","第一行取偶数下标 a₀,a₂,a₄,a₆。","第二行取奇数下标，空位填 0。","首个交叉差除以 a₁。","右列向后移动，计算 b₂。","算完第三行。","改用 b₁ 作分母。","算完第四行。","继续用相邻两行。","填到 s⁰ 后查看第一列。"];
      return {art:routhPicture(routh(rootCoefficients),masks[s.progress]),
        readouts:values(["填表步骤",(s.progress+1)+" / 10"]),
        detail:panel("P(s)=(s+1)⁶ 的数字示例",desc[s.progress])};
    }
  };
  const productsLab={
    title:"看交叉相乘的两项",timed:false,
    controls:[C("which","计算位置",["b₁","b₂","b₃","c₁","c₂"]),
      R("a","a₁ 系数（示例）",4,8,.1,6)],draggable:"a",
    draw(s){
      const a=[...rootCoefficients]; a[1]=s.a;
      const table=routh(a),isB=s.which<3,j=isB?s.which:s.which-3;
      const top=table[isB?0:1],bottom=table[isB?1:2];
      const term1=bottom[0]*(top[j+1]??0),term2=top[0]*(bottom[j+1]??0);
      return {art:routhPicture(table,28,isB?2:3),
        readouts:values(["下首×上右",term1],["上首×下右",term2],["减后除以下首",(term1-term2)/bottom[0]]),
        detail:panel("先乘、后减、再除","分母是参与计算的两行中靠下一行的首项。选择不同系数时，右侧一个位置一个位置移动；空位作 0。")};
    }
  };

  const pages={
    29:{objective:"固定为临界阻尼，拖动自然频率观察重根位置、单调曲线与 2% 带。",
      lead:"ζ=1 时出现负实二重根，响应单调且无超调。固定自然频率时，它是标准二阶无超调响应中最快的一种结构。",
      sections:[["闭环极点","s₁=s₂=−ωₙ，位于负实轴。部分分式的二重极点项使反变换含 t·e^(−ωₙ t)。"],["2% 调节时间","由 (1+ωₙt)e^(−ωₙt)=0.02 得 tₛ≈5.8/ωₙ。"]],
      math:[String.raw`C(s)=\frac{\omega_n^2}{s(s+\omega_n)^2}=\frac1s-\frac1{s+\omega_n}-\frac{\omega_n}{(s+\omega_n)^2}`,
        String.raw`h(t)=1-(1+\omega_n t)e^{-\omega_n t}`],lab:response("critical")},
    30:{objective:"让欠阻尼极点和双侧包络同屏，并分别读 σ 与 ω_d。",
      lead:"欠阻尼响应在指数包络内围绕 1 衰减振荡。",
      sections:[["极点位置","s₁,₂=−σ±jω_d，其中 σ=ζωₙ、ω_d=ωₙ√(1−ζ²)。β=arccos ζ。"],
        ["响应与包络","稳态值为 1。上下包络为 1±e^(−σt)/√(1−ζ²)，σ 决定指数包络的衰减率，ω_d 决定振荡角频率。"]],
      math:[String.raw`C(s)=\frac1s-\frac{s+2\zeta\omega_n}{s^2+2\zeta\omega_n s+\omega_n^2}`,
        String.raw`h(t)=1-\frac{e^{-\sigma t}}{\sqrt{1-\zeta^2}}\sin(\omega_dt+\beta),\qquad \beta=\arccos\zeta`],lab:response("under")},
    31:{objective:"用同一时间尺度并置四条响应，选择一种阻尼高亮相应极点。",
      lead:"零阻尼等幅振荡，欠阻尼衰减振荡，临界和过阻尼都单调。",
      sections:[["对照",["ζ=0：纯虚极点、等幅振荡。","0<ζ<1：左半平面复极点、衰减振荡。","ζ=1：负实二重根，单调上升且快。","ζ>1：两个负实极点，过渡较慢。"]],
        ["观察","在其他条件相近时，极点实部越靠左，其模态衰减越快。固定 ωₙ 而 β 增大时，ζ 降低，欠阻尼振荡更明显。"]],lab:comparison},
    32:{objective:"将原识图题和可切换的答案留在同页，核对阻尼角定义及两个极限。",
      lead:"阻尼角由极点向量与负实轴确定。",
      sections:[["原题","阻尼角 β 对应 A：极点向量与负实轴；B：极点向量与正虚轴；C：极点向量与正实轴。"],
        ["答案","A。cos β=ζ。β=0 为临界阻尼，β=90° 为零阻尼。固定 ωₙ 时，β 仍会影响 tᵣ 与 tₚ，ωₙ 只设定共同的自然时间尺度。"]],quiz:{prompt:"图中阻尼角 β 是上半平面极点向量与哪一条轴的夹角？",options:["负实轴","正虚轴","正实轴"],answers:[0],art:plane([[-1.5,1.6,"s₁"],[-1.5,-1.6,"s₂"]]),answerArt:plane([[-1.5,1.6,"s₁"],[-1.5,-1.6,"s₂"]],true),feedback:"从负实轴量到极点向量，cos β = ζ。"}},
    33:{objective:"在波形上标出首次到达 1 的游标，并联动显示阻尼角和阻尼振荡角频率。",
      lead:"欠阻尼响应的上升时间，按课件定义为首次到达终值的时刻。",
      sections:[["定义","令 h(tᵣ)=1。由欠阻尼响应得 sin(ω_dtᵣ+β)=0，第一次到达取相角 π。"],
        ["变化关系","ω_d 固定时，ζ 增大使 β 减小、tᵣ 增大；ζ 固定时，ωₙ 增大使 tᵣ 缩短。"]],
      math:[String.raw`t_r=\frac{\pi-\beta}{\omega_d}`],lab:response("rise")},
    34:{objective:"把峰值位置和超调高度分别记录，检验 ωₙ 与 ζ 的影响。",
      lead:"首峰出现在半个阻尼振荡周期处。超调量由阻尼比决定。",
      sections:[["峰值时间","令 dh/dt=0，取第一个非零极大值得 ω_dtₚ=π。"],
        ["超调量","把 tₚ 代入阶跃公式，终值归一化为 1 时 σ%=100%·[h(tₚ)−1]。固定 ζ 改变 ωₙ 会改变峰值时刻。"]],
      math:[String.raw`t_p=\frac\pi{\omega_d},\qquad \sigma\%=e^{-\pi\zeta/\sqrt{1-\zeta^2}}\times100\%`],lab:response("peak")},
    35:{objective:"切换两种允许误差带，并排核对包络法、工程近似和延迟时间。",
      lead:"误差包络第一次进入允许带后，后续响应一定保持在带内。",
      sections:[["调节时间","让指数包络等于允许偏差 Δ。包络法给出保守估计；ζ 不太大时，2% 带用 4/(ζωₙ)，5% 带用 3/(ζωₙ)。"],["延迟时间","首次达到终值的一半，课件近似式为 (1+0.6ζ+0.2ζ²)/ωₙ。"]],
      math:[String.raw`t_s^{\rm env}=\frac{\ln(1/\Delta)+\ln(1/\sqrt{1-\zeta^2})}{\zeta\omega_n},\qquad t_d\approx\frac{1+0.6\zeta+0.2\zeta^2}{\omega_n}`],lab:response("settling")},
    36:{objective:"把可调 ζ、ωₙ 对照极点位置、同一阶跃和四项性能读数。",
      lead:"先固定一个参数，再调整另一个，识别超调和时间尺度分别怎样变化。",
      sections:[["操作","ζ 改变共轭极点的阻尼角并改变超调量。固定 ζ 提高 ωₙ 时，极点沿径向远移，响应整体提速。"],["读数","上升、峰值与超调由解析式给出。2% 调节时间采用 4/(ζωₙ) 的课件近似。"]],lab:response("metrics",{w:2})},
    37:{objective:"让阻尼比滑杆直接驱动曲线读点，保留工程推荐区间的含义。",
      lead:"阻尼比从 0 增至 1 时，超调量由 100% 单调减至 0。",
      sections:[["规律","ζ=0 对应等幅振荡超调 100%，ζ≥1 时无超调。0<ζ<1 时由指数公式给出。"],
        ["工程折中","课件推荐 ζ≈0.4～0.8，超调约 25%～1.5%；ζ≈0.707 对应约 4.3%。具体选择取决于性能目标。"],
        ["设计用法","先从超调限值反求 ζ，再用调节时间约束确定 ωₙ。"]],lab:sigmaLab},
    38:{objective:"用例 3-1 的原闭环系数锁定模型，再通过时间游标读四个计算结果。",
      lead:"从 25/(s²+6s+25) 比对标准式，得到 ωₙ=5 rad/s，ζ=0.6。",
      sections:[["导出量","ω_d=4 rad/s，β=arccos 0.6≈0.927 rad。"],["快速性","tᵣ≈0.554 s，tₚ≈0.785 s。课件用 4/(ζωₙ) 估计 2% 调节时间，得到约 1.33 s。"],
        ["平稳性","超调量约 9.48%。"]],lab:response("example",{w:5,z:.6,fixed:true})},
    39:{objective:"用原天线随动系统 K、T 及开环结构计算，调增益观察超调、自然频率和近似 tₛ。",
      lead:"固定 T=0.25 s，降低 K 可减小超调，但会降低 ωₙ。",
      sections:[["原题","单位负反馈，G(s)=K/[s(Ts+1)]，T=0.25 s、K=16。闭环为 K/(Ts²+s+K)。"],
        ["原系统","ωₙ=8 rad/s，ζ=0.25，超调≈44.4%，按 4/(ζωₙ) 得 2% 调节时间约 2 s。"],
        ["设计","课件取 ζ≈0.5、K≈4，ωₙ 降为 4 rad/s；工程近似 tₛ 不变。ζ=0.5 的超调约 16.3%，若把 16% 当精确上限，ζ 略增且 K 略降。"]],
      math:[String.raw`\Phi(s)=\frac{K}{Ts^2+s+K},\qquad \omega_n=\sqrt{K/T},\qquad \zeta=\frac1{2\sqrt{KT}}`],lab:servo("gain")},
    40:{objective:"保留测速反馈路径，调 τ 直接对比相同 ωₙ 下的阻尼和超调。",
      lead:"速度反馈在原例中增加一次项系数，改变阻尼比，保留自然频率。",
      sections:[["闭环式","分母变为 Ts²+(1+Kτ)s+K；ωₙ=√(K/T)，新阻尼比 ζ₁=(1+Kτ)/(2√KT)。"],
        ["近似比较","从原例 ζ=0.25 增至 0.5 时，超调显著下降，按欠阻尼工程近似计算的调节时间缩短。"]],
      math:[String.raw`\Phi(s)=\frac{K}{Ts^2+(1+K\tau)s+K},\qquad \zeta_1=\zeta+\frac{\tau\omega_n}{2}`],lab:servo("velocity")},
    41:{objective:"锁定例 3-3 的 K、T 与反馈系数，对照原系统和设计后的各项性能。",
      lead:"例 3-3 保持 K=16，选测速反馈 τ=0.0625 s，令 ζ 提高到 0.5。",
      sections:[["设计","取课件近似 ζ₁=0.5，由 τ=(2ζ₁√KT−1)/K 得 0.0625 s。闭环为 64/(s²+8s+64)。"],
        ["计算","自然频率保持 8 rad/s，ω_d≈6.93 rad/s、β=60°。tᵣ≈0.30 s、tₚ≈0.45 s、近似 tₛ≈1.0 s、超调约 16.3%。"],
        ["原系统对照","原 ζ=0.25 的超调≈44.4%，近似 tₛ≈2 s，tᵣ≈0.24 s，tₚ≈0.41 s。平均过渡更快的同时，首次到达和首峰略晚。"]],
      math:[String.raw`\tau=\frac{2\zeta_1\sqrt{KT}-1}{K}=0.0625\,\mathrm{s},\qquad \Phi_1(s)=\frac{64}{s^2+8s+64}`],lab:servo("design")},
    42:{objective:"把导数曲线的首个过零和首波面积与阶跃首峰联系起来。",
      lead:"单位脉冲响应等于单位阶跃响应的导数。",
      sections:[["欠阻尼","对阶跃解析式求导。首次由正变负的过零点为阶跃首峰，0 到 tₚ 的面积为 1+σ（超调用小数表示）。"],
        ["临界与过阻尼","阶跃单调，所以脉冲响应不变号。"]],
      math:[String.raw`k(t)=\frac{dh}{dt}=\frac{\omega_n}{\sqrt{1-\zeta^2}}e^{-\zeta\omega_n t}\sin(\omega_dt),\qquad 0<\zeta<1`],lab:response("impulse")},
    43:{objective:"并列斜坡输入和系统输出，用实时差值与终值预测展示阻尼权衡。",
      lead:"系统稳定时，标准二阶模型跟踪单位斜坡留下固定稳态误差。",
      sections:[["单位斜坡","输入 r(t)=t。欠阻尼下输出由斜坡、常值偏置和衰减振荡组成。"],
        ["稳态误差","终值定理给 eₛₛ=2ζ/ωₙ。固定 ωₙ 增大 ζ 有利减振，却会加大斜坡跟踪误差。提高 ωₙ 或提高型别可改善跟踪。"]],
      math:[String.raw`c(t)=t-\frac{2\zeta}{\omega_n}+\frac{e^{-\zeta\omega_n t}}{\omega_d}\sin(\omega_dt+2\beta),\qquad e_{ss}=\frac{2\zeta}{\omega_n}`],lab:response("ramp")},
    44:{objective:"保留标准二阶曲线和含零点曲线，拖 τ 读出微分附加项的权重。",
      lead:"附加左半平面零点改变响应中各模态的权重，极点配置保持。",
      sections:[["传递函数","分子乘以 1+τs，零点在 −1/τ。阶跃输出成为标准响应 h(t) 加 τ 倍的导数。"],
        ["规律","τ 越大，零点越靠近虚轴，早期上升通常更快，超调会增大。τ 趋零时零点影响消失。"]],
      math:[String.raw`\Phi(s)=\frac{\omega_n^2(1+\tau s)}{s^2+2\zeta\omega_ns+\omega_n^2},\qquad c(t)=h(t)+\tau k(t)`],lab:response("zero")},
    45:{objective:"以 β 调附加实极点远近，查看原二阶与串联一阶惯性的三阶阶跃响应。",
      lead:"附加负实极点越靠近虚轴，相当于额外引入越慢的惯性。",
      sections:[["模型","第三个极点 −s₀ 相当于串联 s₀/(s+s₀)。定义 β=s₀/(ζωₙ)，即其衰减率与原共轭极点衰减率之比。"],
        ["影响","β 小时上升更慢、峰值通常较低、调节拖长。β 很大时，新增惯性的影响变小，响应趋近原二阶。"]],
      math:[String.raw`\Phi(s)=\frac{\omega_n^2s_0}{(s^2+2\zeta\omega_ns+\omega_n^2)(s+s_0)},\qquad \beta=\frac{s_0}{\zeta\omega_n}`],lab:response("third")},
    46:{objective:"拆出实根、复根与稳态分量，调一项衰减率和权重再观察合成曲线。",
      lead:"无重极点的高阶阶跃响应可拆成稳态项、实根的指数项和共轭极点的衰减振荡项。",
      sections:[["数学形态","若特征式由一阶因子和共轭二阶因子组成，部分分式反变换给出各自的指数或指数乘三角函数。"],
        ["留数","a₀ 是稳态分量，aᵢ、bₖ、cₖ 为各模态权重，由系统全部零、极点共同确定。"],
        ["看图判断","极点决定运动类型及其指数衰减率，零点还影响叠加后的幅度和形状。"]],
      math:[String.raw`c(t)=a_0+\sum_{i=1}^{q}a_ie^{-s_it}+\sum_{k=1}^{r}e^{-\zeta_k\omega_k t}(b_k\cos\omega_{dk}t+c_k\sin\omega_{dk}t)`],lab:decomposition},
    47:{objective:"调附加极点衰减比与近消去权重，识别什么时候可按低阶主导模态近似。",
      lead:"靠近虚轴且附近没有零点的极点更可能主导长时间响应。",
      sections:[["工程判据","若其余极点衰减率约为主导极点的 5 倍以上，且主导极点附近没有闭环零点，可尝试一阶或二阶近似。5 倍是工程经验。"],
        ["偶极子","一对闭环零极点间距远小于到原点距离时，该极点对应留数可能很小，影响近似互相抵消。仍需核对误差与所关心的时间段。"]],lab:dominance},
    48:{objective:"以原题的衰减振荡形态为线索作答，核对时再显示对应根的位置。",
      lead:"判断最靠近虚轴的闭环极点类型。须同时解释为什么有振荡、为什么会衰减。",
      sections:[["原题","选项：A 一个负实数极点；B 一对共轭复数极点；C 一对纯虚极点；D 两个正实数极点。"],
        ["核对","B。虚部带来振荡，负实部带来衰减。纯虚对保持振幅，实根本身不产生正弦振荡。"]],quiz:{prompt:"观察图中的阶跃响应，闭环主导极点属于哪一种？",options:["一个负实数极点","一对共轭复数极点","一对纯虚极点","两个正实数极点"],answers:[1],art:plot([trace(dominantTrace,"y","阶跃响应",ink.teal)],5,{high:1.55,unit:"幅值"})({width:600,height:195}),answerArt:plane([[-.6,1.43,"主导"],[-.6,-1.43],[-4,0],[-6,0]]),feedback:"衰减振荡说明主导极点有负实部和非零虚部。"}},
    49:{objective:"按课件指标表整理公式，并保留一个可调 ζ、ωₙ 的联动核对。",
      lead:"用 ζ 与 ωₙ 两个参数组织欠阻尼指标，再带入速度反馈与高阶近似。",
      sections:[["快速性","tᵣ=(π−β)/ω_d，tₚ=π/ω_d，课件对 2% 带用 tₛ≈4/(ζωₙ)。固定 ζ 时，这些时间和 ωₙ 反比。"],
        ["平稳与精度","超调 100%·exp(−πζ/√(1−ζ²)) 只由 ζ 决定。斜坡稳态误差为 2ζ/ωₙ。速度反馈可保持 ωₙ 并提高 ζ。"],
        ["高阶响应","由实根与共轭对分量叠加。衰减率差异明显时，用主导极点近似降阶；近零极点可形成偶极子。"]],lab:response("summary")},
    50:{objective:"保留原主题分隔页，让问题引导从根的位置进入判据。",
      lead:"不直接求特征根，怎样判定一个系统稳定？",
      sections:[["第三部分 · 稳定性分析",["稳定的概念","稳定的充要条件","劳斯—赫尔维茨判据及应用"]]]},
    51:{objective:"以谷底和坡顶的可动小球示意扰动撤去后的不同平衡行为。",
      lead:"从受扰偏离开始，观察扰动撤去后是否回到原平衡点。",
      sections:[["直观定义","扰动消失后，偏离随时间消失并恢复平衡，对应渐近稳定。谷底可回复；坡顶的微小偏离会扩大。"],
        ["范围","一般系统可区分局部与大范围稳定。在线性模型适用的状态空间内，渐近稳定不依赖所选扰动幅度。"]],lab:ballLab},
    52:{objective:"把实部和虚部的变化映射到自由响应，说明判稳为何可单看齐次方程。",
      lead:"稳定性由系统结构参数决定。研究特征根，等价于研究齐次暂态是否衰减。",
      sections:[["齐次微分式","c⁽ⁿ⁾+a₁c⁽ⁿ⁻¹⁾+⋯+aₙ₋₁c′+aₙc=0。用 e^(st) 代入得到对应特征方程 D(s)=0。"],
        ["两部分","由输入决定的稳态部分与齐次方程决定的暂态部分叠加。判断渐近稳定要看所有自由模态是否衰减。"]],
      math:[String.raw`D(s)=s^n+a_1s^{n-1}+\cdots+a_{n-1}s+a_n=0,\qquad c(t)=c_{ss}(t)+c_1(t)`],lab:modeLab("free")},
    53:{objective:"将原表五行改为可切换的根型、复平面点和暂态波形。",
      lead:"实部决定包络随时间衰减还是增长，虚部决定是否出现振荡。",
      sections:[["五类根型",["负实根：指数衰减。","正实根：指数发散。","左半平面共轭对：衰减振荡。","右半平面共轭对：发散振荡。","一对纯虚单根：对应等幅振荡，临界而非渐近稳定。"]]],
      math:[String.raw`A e^{\sigma t},\qquad B e^{\sigma t}\sin(\omega t+\varphi)`],lab:modeLab("table")},
    54:{objective:"切换根的阶数并拖动实部，比较指数项和重根出现的多项式因子。",
      lead:"连续线性定常系统渐近稳定的充要条件是全部特征根实部为负。",
      sections:[["单根和共轭对","各模态可写成指数项或指数乘正弦项。指数包络取决于对应特征根实部。"],
        ["重根","ℓ 重特征根引入 1,t,…,t^(ℓ−1) 乘指数。实部严格为负时，有限阶多项式不会阻止最终衰减。"],
        ["判稳原则","右半平面根产生可增长的自由模态。虚轴根也不能满足渐近稳定要求。"]],
      math:[String.raw`e^{s_jt},\quad t e^{s_jt},\quad\ldots,\quad t^{\ell-1}e^{s_jt},\qquad \forall j\;\operatorname{Re}s_j<0`],lab:modeLab("general")},
    55:{objective:"用一个根可动的已知多项式示例，把直接求根和系数判稳并列衔接。",
      lead:"知道所有特征根实部的符号即可判稳，所以高阶系统常转向系数判据。",
      sections:[["动机","低阶多项式可显式求根；次数不低于五时，没有由根式表达的通用代数公式。仍可数值求根或按系数直接判断。"],
        ["代数路径","从 D(s) 的系数列劳斯表。判据由劳斯（1877 年）和赫尔维茨（1895 年）分别提出。"],
        ["下面的顺序","先构造劳斯表，再读判据，最后讨论首项或整行为零等特殊情形。"]],lab:motivation},
    56:{objective:"按原步进方式填写劳斯表，从偶奇交替到第一列；用一套数字演算。",
      lead:"前两行隔项排列，其余行用上一行和上上行做交叉乘积差。",
      sections:[["首两行","sⁿ 行填 a₀,a₂,a₄…，sⁿ⁻¹ 行填 a₁,a₃,a₅…，空处添 0。"],
        ["计算","b₁=(a₁a₂−a₀a₃)/a₁，b₂=(a₁a₄−a₀a₅)/a₁，b₃=(a₁a₆−a₀a₇)/a₁。接下来以 b₁ 作分母。"],
        ["完成","一直填到 s⁰，一共 n+1 行。下一页核对交叉项，随后用第一列判稳。"]],lab:tableLab},
    57:{objective:"让学生逐个选择 b、c 行的项，显示交叉相乘的两项和实时结果。",
      lead:"用参与计算的较下一行首项作分母，分子取两组交叉乘积之差。",
      sections:[["第三行","bⱼ=(a₁a₂ⱼ−a₀a₂ⱼ₊₁)/a₁。右列向右平移，逐个计算。"],
        ["第四行","c₁=(b₁a₃−a₁b₂)/b₁，c₂=(b₁a₅−a₁b₃)/b₁。"],
        ["规则","下首×上右 − 上首×下右，再除以下首。缺项补 0，分母为零的特殊情形另行处理。"]],
      math:[String.raw`b_1=\frac{a_1a_2-a_0a_3}{a_1},\quad b_2=\frac{a_1a_4-a_0a_5}{a_1},\quad b_3=\frac{a_1a_6-a_0a_7}{a_1}`,
        String.raw`c_1=\frac{b_1a_3-a_1b_2}{b_1},\qquad c_2=\frac{b_1a_5-a_1b_3}{b_1}`],lab:productsLab}
  };

  window.SourcePolishCh3 ??= {};
  Object.assign(window.SourcePolishCh3,pages);
})();
