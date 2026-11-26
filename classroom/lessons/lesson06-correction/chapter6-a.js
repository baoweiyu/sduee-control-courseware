"use strict";
(() => {
  const {range:R,choices:C,escape,readouts}=IntroWidgets;
  const M=IntroModels;
  const colors={ink:"#362b50",soft:"#706483",frame:"#ded5e9",paper:"#fcfaff",violet:"#6d479c",violetPaper:"#efe7f8",blue:"#356d9a",green:"#267262",hot:"#a04e2d"};
  const svg=(name,body,h=290)=>`<svg viewBox="0 0 720 ${h}" role="img" aria-label="${escape(name)}">${body}</svg>`;
  const text=(x,y,a,size=18,col=colors.ink,align="middle")=>`<text x="${x}" y="${y}" font-size="${size}" fill="${col}" text-anchor="${align}" font-weight="620">${escape(a)}</text>`;
  const box=(x,y,w,h,bg=colors.paper,stroke=colors.frame)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${bg}" stroke="${stroke}"/>`;
  const line=(d,c=colors.soft,w=2.25,id="")=>`<path d="${d}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"${id?` marker-end="url(#${id})"`:""}/>`;
  const node=(x,y,content,w=99,active=false)=>box(x-w/2,y-19,w,38,active?colors.violetPaper:colors.paper,active?colors.violet:colors.frame)+text(x,y+6,content,17,active?colors.violet:colors.ink);
  const junction=(x,y)=>`<circle cx="${x}" cy="${y}" r="13" fill="#fff" stroke="#ad98c8"/>`+text(x,y+6,"Σ",16);
  const panel=(head,copy)=>`<section class="text-block"><h3>${escape(head)}</h3><p>${escape(copy)}</p></section>`;
  const arrowDef=()=>`<defs><marker id="correction-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 10 5 0 10z" fill="${colors.soft}"/></marker></defs>`;
  const wire=(d,c=colors.soft)=>line(d,c,2.35,"correction-arrow");
  const degree=n=>n*180/Math.PI;
  const radians=n=>n*Math.PI/180;
  const n=(v,d=2)=>Number.isFinite(v)?String(Number(v.toFixed(d))):"—";
  const f=(v,d=2)=>Number.isFinite(v)?v.toFixed(d):"—";
  const entry=(objective,lead,sections,lab,math)=>({objective,lead,sections,...(lab?{lab}:{}),...(math?.length?{math}:{})});

  function sequence(selected,items,title="设计顺序"){
    const columns=items.length>4?3:2;
    const width=columns===3?187:232, gap=20, left=(720-columns*width-(columns-1)*gap)/2;
    return svg(title,items.map((name,i)=>{
      const x=left+(i%columns)*(width+gap),y=52+Math.floor(i/columns)*91;
      return box(x,y,width,71,i===selected?colors.violetPaper:colors.paper,i===selected?"#b9a2d4":colors.frame)+
        text(x+17,y+24,String(i+1).padStart(2,"0"),14,colors.violet,"start")+text(x+width/2,y+49,name,17);
    }).join(""));
  }
  function walkthrough(title,steps,picture){
    return {
      title,timed:false,controls:[C("step","查看阶段",steps.map(([name])=>name))],
      draw(s){
        const [heading,copy]=steps[s.step], art=picture?picture(s.step):title.startsWith("逐步设计")?IntroWidgets.stepList(steps.map(([name])=>name),s.step):sequence(s.step,steps.map(([name])=>name));
        return {art,detail:panel(heading,copy),readouts:readouts([["进度",`${s.step+1} / ${steps.length}`]])};
      }
    };
  }

  const cascade=(K,z=[],p=[],integrators=0)=>w=>{
    let magnitude=20*Math.log10(K)-20*integrators*Math.log10(w), phase=-90*integrators;
    for(const t of z){magnitude+=10*Math.log10(1+(w*t)**2);phase+=degree(Math.atan(w*t));}
    for(const t of p){magnitude-=10*Math.log10(1+(w*t)**2);phase-=degree(Math.atan(w*t));}
    return [magnitude,phase];
  };
  const combine=(a,b)=>w=>{const u=a(w),v=b(w);return [u[0]+v[0],u[1]+v[1]];};
  const tracesFor=(net,base)=>[{sample:net,ink:colors.green,label:"校正装置"},...(base?[{sample:base,ink:colors.blue,label:"未校正"}]:[])];
  function crossing(sample,index,target,min=-3,max=3){
    const match=w=>sample(10**w)[index]-target;
    let left=min,before=match(left);
    for(let i=1;i<=144;i++){
      const right=min+(max-min)*i/144,current=match(right);
      if(before>=0&&current<=0){
        let a=left,b=right;
        for(let k=0;k<24;k++){
          const t=(a+b)/2;
          if(match(t)>=0)a=t;else b=t;
        }
        return 10**((a+b)/2);
      }
      left=right;before=current;
    }
    return NaN;
  }
  function measures(sample){
    const freq=crossing(sample,0,0),phaseCross=crossing(sample,1,-180);
    return {freq,margin:Number.isFinite(freq)?180+sample(freq)[1]:NaN,gm:Number.isFinite(phaseCross)?-sample(phaseCross)[0]:Infinity};
  }
  function bode(series,omega=1,min=-2,max=2){
    const sampleCount=96;
    const x=e=>62+(e-min)/(max-min)*614;
    const data=series.map(({sample,...rest})=>({...rest,samples:Array.from({length:sampleCount+1},(_,i)=>{
      const exponent=min+(max-min)*i/sampleCount;
      return [x(exponent),...sample(10**exponent)];
    })}));
    const valueBounds=index=>{
      const values=data.flatMap(item=>item.samples.map(row=>row[index]));
      let lo=Math.min(0,...values),hi=Math.max(0,...values);
      const step=index===1?Math.max(5,Math.ceil((hi-lo)/50)*10):Math.max(10,Math.ceil((hi-lo)/200)*50);
      lo=Math.floor(lo/step)*step;hi=Math.ceil(hi/step)*step;
      if(hi===lo)hi=lo+step;
      return [lo,hi,step];
    };
    const probeExponent=M.clamp(Math.log10(omega),min,max);
    const probeFrequency=10**probeExponent;
    const probeValues=series.map(trace=>trace.sample(probeFrequency));
    const dashes=series.length===3?["6 4","2 4",""]:series.map((_,i)=>i?"":"6 4");
    if(series.length===1)dashes[0]="";
    const traceLine=(path,trace,i,width)=>`<g stroke-dasharray="${dashes[i]||"none"}">${line(path,trace.ink,width)}</g>`;
    let art="";
    for(const [index,top,title] of [[1,36,"幅值 / dB"],[2,156,"相角 / °"]]){
      const [lo,hi,spacing]=valueBounds(index),height=86,y=v=>top+height*(hi-v)/(hi-lo);
      art+=box(62,top,614,height,"#faf7fe","#e3dbea")+text(64,top-9,title,15,colors.soft,"start");
      for(let e=Math.ceil(min);e<=max;e++){
        art+=line(`M${x(e)} ${top}v${height}`,"#e6dfef",1);
        if(index===2)art+=text(x(e),top+height+20,n(10**e,3),15,colors.soft);
      }
      for(let v=lo;v<=hi;v+=spacing)art+=line(`M62 ${y(v)}H676`,v===0?"#cabcd9":"#e6dfef",v===0?1.5:1)+text(51,y(v)+4,v,14,colors.soft,"end");
      art+=line(`M${x(probeExponent)} ${top}v${height}`,"#9b7ebe",1.4);
      data.forEach((trace,i)=>{
        const path=trace.samples.map((r,j)=>(j?"L":"M")+n(r[0],2)+" "+n(y(r[index]),2)).join("");
        art+=traceLine(path,trace,i,2.8)+`<circle cx="${x(probeExponent)}" cy="${y(probeValues[i][index-1])}" r="3.8" fill="white" stroke="${trace.ink}" stroke-width="2"/>`;
      });
    }
    art+=text(676,147,"横轴 ω (rad/s)",13,colors.soft,"end");
    series.forEach((trace,i)=>{
      const left=65+i*209,[db,phase]=probeValues[i];
      art+=traceLine(`M${left} 279h25`,trace,i,3)+text(left+32,284,trace.label,15,colors.ink,"start")+
        text(left+32,305,`${f(db,1)} dB · ${f(phase,1)}°`,14,colors.soft,"start");
    });
    art+=text(705,20,`游标 ω = ${n(probeFrequency,3)} rad/s`,14,colors.soft,"end");
    return svg("幅频和相频对数曲线",art,317);
  }
  const probe=R("probe","频率游标 lg ω",-2,2,.05,0);
  const guideNet=(title,controls,get,body)=>{
    return {title,timed:false,draggable:controls.find(c=>!c.options)?.id||"probe",controls:[...controls,probe],
      draw(s){
        const {series,info}=get(s),omega=10**s.probe;
        return {art:bode(series,omega),readouts:readouts(info),detail:body?panel(...body(s)):undefined};
      }};
  };
  const alphas=[.05,.1,.2,.5];
  const betas=[2,5,10,20];
  const aRange=R("alpha","α",.05,.65,.01,.10);
  const bRange=R("beta","β",1.25,24,.25,10);
  const leadPhase=a=>degree(Math.asin((1-a)/(1+a)));
  function simpleNet(mode,discrete=false){
    const isLead=mode==="lead", name=isLead?"超前":"滞后", key=isLead?"alpha":"beta";
    const options=isLead?alphas:betas;
    return guideNet(name+"网络的零、极点和 Bode 图",
      [discrete?C(key,isLead?"α":"β",options.map(value=>String(value)),isLead?1:2):isLead?aRange:bRange],
      s=>{
        const k=discrete?options[s[key]]:s[key],w=1/Math.sqrt(k),phase=isLead?leadPhase(k):-leadPhase(1/k);
        return {series:[{sample:cascade(1,[1],[k]),label:name+"网络",ink:isLead?colors.violet:colors.green}],
          info:[["几何中心 rad/s",f(w)],["峰值相角",f(phase,1)+"°"],["高频幅值",f(-20*Math.log10(k),1)+" dB"]]};
      },()=>[isLead?"利用正相角":"利用高频衰减",isLead?"两个转折频率之间相角为正。最大点处的实际幅值为 −10 lg α。":"两转折频率间相角为负。把高端转折放在远低于新穿越频率处，尽量避开滞后相角。"]);
  }
  function divider(lead){
    return svg(lead?"无源超前 RC 分压网络":"无源滞后 RC 分压网络",arrowDef()+
      wire("M72 125H214")+line("M214 125H262 M345 125H577 M72 242H577")+
      node(304,125,"R₁",83,true)+line("M476 125H541")+
      (lead?line("M214 125V62H277 M330 62H390V125 M277 44V80 M330 44V80")+text(303,43,"C"):
        line("M490 203V222 M469 219H511 M469 228H511 M490 228V242")+text(528,225,"C"))+
      line(lead?"M490 125V157 M490 195V242":"M490 125V157 M490 195V203")+node(490,176,"R₂",71,true)+
      text(71,99,"uᵣ")+text(577,99,"u꜀")+text(569,229,"参考端",15)+text(131,170,"输入端",15,colors.soft),265);
  }
  function circuitLab(lead){
    const label=lead?"超前":"滞后", key=lead?"alpha":"beta";
    return {title:label+"分压阻抗",timed:false,draggable:key,controls:[lead?aRange:bRange],
      draw(s){const k=s[key];return {art:divider(lead),readouts:readouts([[lead?"α":"β",n(k)],["ωz (T=1)",1],["ωp (T=1)",f(1/k)]]),
        detail:panel("阻抗分压确定传递函数",lead?`补偿直流衰减 α 后，归一式为 (s+1)/(${n(k)}s+1)。`:`直流不衰减，归一式为 (s+1)/(${n(k)}s+1)。`)};}
    };
  }
  function structure(mode){
    const base=arrowDef()+wire("M44 124H103")+junction(118,124)+node(243,124,mode===0?"G꜀(s)":"G₁(s)",108,mode===0)+node(484,124,mode===0?"G₀(s)":"G₂(s)",120)+
      wire("M134 124H189")+wire("M297 124H"+(mode===1?382:423))+wire("M544 124H674")+wire("M631 124V232H119V140")+
      text(53,107,"R(s)")+text(665,107,"C(s)")+text(368,256,"主负反馈",17,colors.soft);
    const local=junction(397,124)+wire("M411 124H423")+wire("M557 125V179H534",colors.violet)+node(483,179,"H꜀(s)",102,true)+wire("M432 179H397V140",colors.violet)+text(373,153,"−",16);
    const feed=wire("M64 124V51H350V124",colors.violet)+node(213,51,"F(s)",102,true)+junction(351,124);
    return svg("校正装置接入位置",base+(mode===1?local:mode===2?feed:""));
  }
  const placement=[
    ["串联","G꜀ 串在固有部分 G₀ 前向通道。结构简单，应用广。"],
    ["局部反馈","H꜀ 包围局部环节，可减小被包围部分的参数变化和非线性影响。"],
    ["复合","外加前馈作用于给定或可测扰动。主反馈设计与补偿设计分别考虑。"]
  ];
  const selectPlacement={title:"选择一种接入方式",timed:false,controls:[C("mode","接入位置",placement.map(item=>item[0]))],
    draw(s){return {art:structure(s.mode),detail:panel(...placement[s.mode])};}};

  const devices=["超前","滞后","滞后—超前","PD","PI","PID"];
  const deviceNotes=[
    "具有正相角，通常兼顾提高穿越频率和相角裕度；高频增益上升。",
    "用高频幅值衰减换裕度，通常降低穿越频率；设计时应避开额外滞后。",
    "低频滞后段和高频超前段分工；既改变中频电平，也补相角。",
    "在 −1/Td 加零点，理想微分高频增益上升；实际控制器需滤波。",
    "原点极点提高型别，零点在 −1/Ti；低频积分提高稳态精度。",
    "结合比例、积分、微分。低频由积分主导，高频由微分主导。"
  ];
  const deviceParameters=["(Ts+1)/(αTs+1)，α<1","(Ts+1)/(βTs+1)，β>1","[(T₁s+1)/(βT₁s+1)]·[(T₂s+1)/(T₂s/β+1)]","Kₚ(1+Tds)","Kₚ(1+1/(Tis))","Kₚ+Kᵢ/s+Kᴅs"];
  const pid=(kind,k,a,b)=>w=>{
    const real=kind==="I"||kind==="D"?0:k;
    const imaginary=(["I","PI","PID"].includes(kind)?-a/w:0)+(["D","PD","PID"].includes(kind)?b*w:0);
    return [20*Math.log10(Math.max(1e-13,Math.hypot(real,imaginary))),degree(Math.atan2(imaginary,real))];
  };
  function device(kind,beta=10){
    const modes=[cascade(1,[1],[.1]),cascade(1,[1],[beta]),cascade(1,[8,.38],[8*beta,.38/beta]),
      pid("PD",1,0,.8),pid("PI",1,.7,0),pid("PID",1,.8,.65)];
    return modes[kind];
  }
  function deviceLab(fixed){
    const selectable=fixed===undefined,control=selectable?[C("device","装置",devices)]:fixed===2?[bRange]:[
      R("k","比例增益 Kₚ",.4,3,.05,1),...(fixed>=4?[R("i","积分增益 Kᵢ",.2,2,.05,.8)]:[]),...(fixed===3||fixed===5?[R("d","微分增益 Kᴅ",.2,2,.05,.8)]:[])
    ];
    return guideNet("读取装置的幅值与相角",control,s=>{
      const mode=selectable?s.device:fixed;
      const sample=selectable||fixed<=2?device(mode,s.beta):pid(devices[mode],s.k,s.i??0,s.d??0);
      const value=sample(10**s.probe);
      return {series:[{sample,ink:colors.violet,label:devices[mode]}],info:[["幅值",f(value[0],1)+" dB"],["相角",f(value[1],1)+"°"]]};
    },s=>["工程作用",deviceNotes[selectable?s.device:fixed]]);
  }

  window.SourcePolishCh6??={};
  Object.assign(window.SourcePolishCh6,{
    1:entry("保留章节封面，以五项内容形成清晰阅读路线。","通过增加校正装置，改变频率特性、穿越频率和稳定裕度。",[["本章章节",["6.1 概述","6.2 校正方式和装置","6.3 频率特性法","6.4 局部反馈","6.5 复合校正"]]]),
    2:entry("把导学图拆为方式、装置、方法三步，点亮当前学习线。","当性能不满足要求时，从目标指标倒推校正方式和装置。",[["学习目标",["区分串联、反馈、复合校正。","理解超前、滞后、滞后—超前、PID 的频率特性。","掌握用频率特性法设计超前、滞后，理解局部反馈与复合校正。"]]],walkthrough("本章知识地图",[["选择方式","先定校正装置接入的位置。"],["识别装置","看零极点分布和幅相特性。"],["设计和验证","频率特性法是本章主线。根轨迹法与复合校正各有适用场合。"]])),
    3:entry("保留 6.1 节标题与三个待学主题，留出讲解视线。","本节先定义校正，再区分接入方式，最后选择分析方法。",[["本节目标",["说出校正的概念。","辨认串联、反馈、复合的接入位置。","列举常用校正方法。"]]]),
    4:entry("在同一背景结构上改变新增装置的位置，以差异解释三种方式。","校正是增加辅助装置以改善性能，固有部分 G₀ 给定，校正装置 G꜀ 可以设计。",[["三种方式",placement.map(([name,copy])=>name+"。"+copy)]],selectPlacement),
    5:entry("将原三种方法的适用目标做成选读示意，保留频域为主线。","同一个系统可以从频域、复域或前馈补偿条件审视。",[["三种方法",["频率特性法在 Bode 图上按三频段重塑环路，以 ωc、γ 等为目标。","根轨迹法配置零极点，适合以时域指标为主的设计。","复合校正法沿给定或扰动增加前馈；在独立主反馈结构中，特征方程不变。"]]],walkthrough("比较校正方法",[["频率特性法","本章通过例 6-1 与例 6-3 演练串联设计。"],["根轨迹法","使闭环极点进入响应期望区域。"],["复合校正法","用可实现前馈补足精度或针对可测扰动补偿。"]])),
    6:entry("保留 6.2 段落标题和装置清单。","用零、极点位置理解超前、滞后、滞后—超前与 PID。",[["本节路线",["无源超前与滞后。","滞后—超前网络。","有源 P、I、D 及其组合。","装置比较和课堂互动。"]]]),
    7:entry("在 RC 原理图上明确输入与 R₂ 输出，调 α 查看实际与标准形。","R₁ 与 C 并联作串联臂，R₂ 作输出臂。",[["分压","Z₁=R₁/(1+R₁Cs)，Z₂=R₂，Gc=α(Ts+1)/(αTs+1)。α=R₂/(R₁+R₂)<1，T=R₁C。"],["归一化","提高放大器增益 1/α 倍以补偿低频衰减。零点转折 1/T，极点转折 1/(αT)。"]],circuitLab(true),[String.raw`G_c(s)=\alpha\frac{Ts+1}{\alpha Ts+1}`]),
    8:entry("保留 T=1 与 α 档位，用游标读几何中心、最大相角和高频平台。","幅频从 0 dB 经 +20 dB/dec 到 −20 lgα；相频在两转折间拱起。",[["几何中心","ωm=1/(T√α)，有 L(ωm)=−10 lgα，φ(ωm)=φm。"],["原示例","α=.1、T=1 时，转折 1 与 10，ωm≈3.16、φm≈54.9°、中点约 10 dB。"]],simpleNet("lead",true)),
    9:entry("从所需相角向回查 α，再设置转折中心，并显示减小 α 的高频代价。","φm 与 α 可以互相反查，常见单级设计把 φm 限制在约 60° 以内。",[["推导","φc=arctan(ωT)−arctan(αωT)。令导数为零得 ωm=1/(T√α)。"],["反查","φm=arcsin[(1−α)/(1+α)]；α=(1−sinφm)/(1+sinφm)。将 ωm 对准设计 ωc 反求 T。"]],{
      title:"由目标角度反定 α",timed:false,draggable:"degrees",controls:[R("degrees","目标超前角",10,65,.5,55,"°")],
      draw(s){
        const v=Math.sin(radians(s.degrees)),a=(1-v)/(1+v);
        return {art:bode([{sample:cascade(1,[1],[a]),ink:colors.violet,label:"超前网络"}],1/Math.sqrt(a)),
          readouts:readouts([["α",f(a,3)],["高频增益",f(-20*Math.log10(a),1)+" dB"]]),
          detail:panel("相角与噪声的折中","α 越小，相角收益越大。高频增益也会升高，放大高频噪声。")};
      }
    }),
    10:entry("并看相角峰和高频平台，直接显示 α 的三项影响。","超前装置提供正相角，并以更高的高频增益为代价。",[["特点",["高频平台 −20 lgα，工程中常取 α>0.07。","α=0.1 时最大相角约 55°，不宜一味降低。","在 ωm 获得 −10 lgα，可把未校幅值 10 lgα 的点抬到 0 dB。"]]],simpleNet("lead")),
    11:entry("在滞后 RC 场景中标出整个串联 R₂+C 输出臂，与超前分压对照。","滞后网络低频不衰减，高频衰减。",[["阻抗分压","Z₁=R₁，Z₂=R₂+1/(Cs)。Gc=(Ts+1)/(βTs+1)，β=(R₁+R₂)/R₂>1，T=R₂C。"],["零极点次序","极点转折 1/(βT) 在前，零点转折 1/T 在后。相角滞后，高频 −20 lgβ。"]],circuitLab(false),[String.raw`G_c(s)=\frac{Ts+1}{\beta Ts+1}`]),
    12:entry("保留 β 档位与归一频响，分开标出滞后峰与高频衰减。","幅频 0 dB 起步，随后 −20 dB/dec 到低平台，相频两折点间下凹。",[["β=10，T=1","转折 0.1 与 1，ωm≈0.316，φm≈−54.9°，高频衰减 −20 dB。"],["设计用法","把 1/T 置于远低于 ωc，取幅值衰减而尽量避免相角损失。"]],simpleNet("lag",true)),
    13:entry("让 β 改变，直接观察高频平台和相角损失两个读数。","利用滞后高频衰减将穿越点左移，同时把滞后相角避开新穿越。",[["三要点",["β 越大则高频衰减越多，抗高频噪声越强。","β=10 造成 −20 dB 的高频平台。","常取 1/T≈0.1ωc，使相角最低点远离校正后穿越频率。"]]],simpleNet("lag")),
    14:entry("可分别看滞后段、超前段和两者合成，保留 RC 分压及分段推导。","一个装置的两个频段各有任务。滞后降低中频幅值，超前补相角。",[["阻抗形式","Z₁=R₁∥1/(C₁s)，Z₂=R₂+1/(C₂s)，Gc=Z₂/(Z₁+Z₂)。"],["两段","(T₁s+1)/(βT₁s+1) 为滞后，(T₂s+1)/(1+T₂s/β) 为超前。对实际 RC 参数，分母系数应与分压式匹配。"]],guideNet("观察两个频段", [C("mode","查看",["滞后段","超前段","乘积"],2),bRange],s=>{
      const l=cascade(1,[8],[8*s.beta]),a=cascade(1,[.38],[.38/s.beta]),modes=[l,a,combine(l,a)];
      return {series:[{sample:modes[s.mode],ink:colors.violet,label:["滞后","超前","乘积"][s.mode]}],info:[["β",n(s.beta)],["低频增益","1"]]};
    }),[String.raw`G_c(s)=\frac{(1+T_1s)(1+T_2s)}{(1+\beta T_1s)(1+T_2s/\beta)}`]),
    15:entry("把运放阻抗比与 P、I、D 传递函数对应，切换频域幅相。","选不同的输入与反馈阻抗可实现不同控制规律。反相运放由 −Z₂/Z₁ 决定传递。",[["三项规律",["P 取幅值增益 Kₚ=R₂/R₁。","I：1/(Tᵢs) 提高系统型别。","D：Tds 对输入变化率作出响应。换算时区分反相级极性和控制律方向。"]]],guideNet("选择 P、I、D", [C("item","控制规律",["P","I","D"]),R("gain","系数",.3,3,.05,1)],s=>{
      const title=["P","I","D"][s.item],sample=pid(title,s.gain,s.gain,s.gain),value=sample(10**s.probe);
      return {series:[{sample,ink:colors.violet,label:title}],info:[["幅值",f(value[0],1)+" dB"],["相角",f(value[1],1)+"°"]]};
    })),
    16:entry("把 PD 公式、实零点和相频曲线联动，让原有源网络讲解回到控制作用。","PD 追加变动率作用，在 −1/Td 加零点。",[["反馈与网络","图 6-14 有源网络由 R、C 与运放构成。G꜀=Kₚ(1+Tds)=Kₚ+Kᴅs。"],["频响","相角由 0°趋向 +90°。过 1/Td 的幅频渐近斜率为 +20 dB/dec；实际微分通常加滤波。"]],deviceLab(3),[String.raw`u_2=K_pu_1+K_pT_d\frac{du_1}{dt}`]),
    17:entry("调积分参数观察低频增益，关联 PI 的原点极点和有限零点。","积分改善稳态精度，PI 的零点有助于减轻积分对中频的影响。",[["表达式","G꜀=Kₚ(1+1/(Tis))=Kₚ(Tis+1)/(Tis)。"],["频响","相角由 −90°趋向 0°。低频积分占主导，过 1/Ti 后趋于 Kₚ。"]],deviceLab(4),[String.raw`u_2(t)=K_pu_1(t)+\frac{K_p}{T_i}\int_0^t u_1(\tau)\,d\tau`]),
    18:entry("独立调比例、积分、微分，呈现 PID 从低频积分到高频微分的全貌。","PID 一并调整精度、动态与稳定性，具体效果取决于参数和对象。",[["控制律","G꜀=Kₚ+Kᵢ/s+Kᴅs=Kₚ(Td Ti s²+Ti s+1)/(Ti s)。增加一个原点极点和两个零点。"],["频响","低频 I 主导、高频 D 主导，理想相角从 −90° 到 +90°。中段幅值较低。"]],deviceLab(5)),
    19:entry("把原表六种装置从单排变成可切换的条目，每次展开一种实际幅相。","根据目标、现有裕度与噪声限制，从六类装置初选。",[["表 6-1",devices.map((name,i)=>name+"。"+deviceParameters[i]+"；"+deviceNotes[i])]],deviceLab()),
    20:{
      ...entry("保留有六项填空与原多选的课堂核对内容，用按钮提交多选。","区分使用相角的超前与使用幅值衰减的滞后。",[["原页填空",["校正方式：串联、反馈、复合。","常用方法：频率特性法、根轨迹法、复合校正。","校正实质：加入参数可调的辅助装置改变性能。"]]]),
      quiz:{prompt:"关于校正装置，哪些说法正确？",options:["ωc 和 γ 都不足时可采用超前校正","单级超前一般不超过 60°，峰值频率幅值为 −10 lgα","滞后主要利用相频特性","滞后可加强抗高频噪声能力","PID 可提高型别并经设计改善动态与稳定性"],answers:[0,1,3,4],feedback:"滞后利用的是高频幅值衰减，附加滞后相角应避开设计穿越。"}
    }
  });
  const exLead=cascade(15,[],[1],1), leadNetwork=cascade(1,[.33],[.11]);
  const exLag=cascade(10,[],[1,.5],1), lagNetwork=(K,T=10,beta=20)=>cascade(K,[T],[T*beta]);
  const exBoth=cascade(180,[],[.5,.167],1), bothNetwork=cascade(1,[1.43,.5],[73.3,.009]);
  const responseInfo=(sample,extra=[])=>{
    const {freq,margin,gm}=measures(sample);
    return [["ωc / rad·s⁻¹",f(freq)],["相角裕度",f(margin,1)+"°"],["幅值裕度",Number.isFinite(gm)?f(gm,1)+" dB":"无有限穿越"],...extra];
  };
  const verification=(title,base,net,extra=[],labels=["未校正","校正装置","校正后"])=>{
    const total=combine(base,net);
    return guideNet(title,[C("mode","曲线",["未校正","装置","逐点叠加","校正后"],2)],s=>{
      const all=[{sample:base,ink:colors.blue,label:labels[0]},{sample:net,ink:colors.green,label:labels[1]},{sample:total,ink:colors.hot,label:labels[2]}];
      const series=s.mode===2?all:[all[s.mode===3?2:s.mode]];
      return {series,info:s.mode===1?[["ω / rad·s⁻¹",f(10**s.probe)],["校正幅值",f(net(10**s.probe)[0],1)+" dB"],["校正相角",f(net(10**s.probe)[1],1)+"°"]]:responseInfo(s.mode===0?base:total,extra)};
    },()=>["精确 Bode 叠加","仪表按传递函数计算。先在 0 dB 处找穿越频率，再由相频读相角裕度。"]);
  };
  const baseline=(title,base,kv)=>guideNet(title,[],s=>{
    const omega=10**s.probe,[gain,phase]=base(omega);
    return {series:[{sample:base,ink:colors.blue,label:"未校正"}],info:[["Kᵥ",kv],["游标读数",f(gain,1)+" dB"],["游标相角",f(phase,1)+"°"],...responseInfo(base).slice(0,2)]};
  });
  const leadSteps=[
    ["稳态定 K","从系统型别和允许稳态误差定开环增益。"],
    ["画未校 Bode","读 ωc₁、γ₀ 和 Kg₀，检查原系统。"],
    ["计算超前角","φm=γ*−γ₀+ε，ε 常取 5°–10°；由 sinφm 求 α。"],
    ["配置穿越","在 L₀=10 lgα 读出 ωc₂，令 ωm=ωc₂；T=1/(ωm√α)。"],
    ["写系统模型","Gc=(Ts+1)/(αTs+1)，开环 L=GcG₀。"],
    ["检验裕度","用校后曲线查 γ≥γ*。不满足则调整 ε 和装置，再验证闭环。"]
  ];
  const lagSteps=[
    ["稳态定 K","从静态误差系数定开环增益。"],
    ["画未校 Bode","读 ωc₁、γ₀，观察穿越附近的幅相。"],
    ["相频选穿越","找 γ₀(ωc₂)=γ*+ε，常留 5°–14°抵消附加滞后。"],
    ["幅频定 β","令 20 lgβ=L₀(ωc₂)，估计需要衰减量。"],
    ["安排转折","取 1/T 为 0.1–0.25 倍 ωc₂，尽量避开滞后相角。"],
    ["检验两项裕度","校核 γ、Kg；若未满足，调整 ωc₂、T 或 β，复核器件可实现性。"]
  ];
  const fixedCross=guideNet("保持 0 dB 穿越点不动",[R("a","距离系数 a",1.25,12,.05,3)],s=>{
    const a=s.a,phase=degree(Math.atan(a)-Math.atan(1/a)),slope=-40+20*(a*a-1)/(a*a+1);
    return {series:[{sample:cascade(1/a,[a],[1/a],2),ink:colors.violet,label:"Lₐ(jω)"}],
      info:[["ωc","1 rad/s"],["零点 / 极点转折",f(1/a,3)+" / "+f(a,3)],["相角裕度",f(phase,1)+"°"],["实际局部斜率",f(slope,1)+" dB/dec"]]};
  },s=>["分别数相角贡献",`两个积分环节贡献 −180°，零点超前 +${f(degree(Math.atan(s.a)),1)}°，有限极点滞后 −${f(degree(Math.atan(1/s.a)),1)}°。`]);
  const timeTargets=guideNet("由超调和调节时间估算频域目标",[
    R("overshoot","最大超调 / %",4,28,1,10),R("settle","调节时间 / s",1,5,.1,2)
  ],s=>{
    const x=-Math.log(s.overshoot/100),z=x/Math.hypot(Math.PI,x),wn=4/(z*s.settle);
    const wc=wn*Math.sqrt(Math.sqrt(1+4*z**4)-2*z*z);
    const exact=w=>[20*Math.log10(wn*wn/(w*Math.hypot(w,2*z*wn))),-90-degree(Math.atan(w/(2*z*wn)))];
    const phase=180+exact(wc)[1];
    return {series:[{sample:exact,ink:colors.violet,label:"标准二阶开环"}],
      info:[["ζ",f(z,2)],["目标 γ",f(phase,1)+"°"],["估算 ωc",f(wc,2)+" rad/s"]]};
  },()=>["目标是设计起点","该估算使用单位负反馈、标准二阶与 2% 调节时间近似。用实际闭环阶跃再验收。"]);
  function leadStepResponse(a,T){
    const direct=1/a,substep=M.dt/10;
    const derivatives=([filter,velocity,y])=>{
      const e=1-y,u=direct*e+(1-direct)*filter;
      return [(e-filter)/(a*T),u-velocity,15*velocity];
    };
    const advance=(values,slope,step)=>values.map((v,i)=>v+step*slope[i]);
    let state=[0,0,0];
    return Array.from({length:M.steps+1},(_,i)=>{
      const sample={t:i*M.dt,y:state[2],r:1};
      for(let j=0;j<10;j++){
        const k1=derivatives(state),k2=derivatives(advance(state,k1,substep/2));
        const k3=derivatives(advance(state,k2,substep/2)),k4=derivatives(advance(state,k3,substep));
        state=state.map((v,k)=>v+substep*(k1[k]+2*k2[k]+2*k3[k]+k4[k])/6);
      }
      return sample;
    });
  }
  const uncLeadStep=leadStepResponse(1,1),corrLeadStep=leadStepResponse(1/3,.33);
  const stat=rows=>{
    const max=Math.max(...rows.map(d=>d.y)),last=rows.findLastIndex(d=>Math.abs(d.y-1)>.02);
    return {overshoot:100*(max-1),settle:Math.min(rows.length-1,last+1)*M.dt};
  };
  const stepStats=[uncLeadStep,corrLeadStep].map(stat);
  const leadCompare={
    title:"时间游标比较同一阶跃",timed:true,controls:[C("mode","响应曲线",["前后对照","只看校正前","只看校正后"])],
    draw(s){
      const rows=[uncLeadStep,corrLeadStep],stats=stepStats;
      const traces=rows.map((series,i)=>({series,key:"y",label:i?"校正后":"未校正",color:i?colors.hot:colors.blue}));
      const selected=s.mode?[traces[s.mode-1]]:traces;
      return {chart:IntroWidgets.plot([{series:uncLeadStep,key:"r",label:"给定",color:colors.soft,dash:true},...selected],s.time,{low:0,high:1.85}),
        art:svg("例 6-1 单位阶跃与稳态带",box(67,58,586,130)+text(360,100,"同一单位阶跃",26)+text(360,142,"用时间游标比较给定与两条输出",19,colors.soft),245),
        readouts:readouts([["未校输出",f(M.at(rows[0],s.time).y,3)],["校后输出",f(M.at(rows[1],s.time).y,3)],["超调（仿真）",f(stats[0].overshoot,1)+"% → "+f(stats[1].overshoot,1)+"%"],["2% 调节时间",f(stats[0].settle,2)+" → "+f(stats[1].settle,2)+" s"]]),
        detail:panel("按同一模型与判据比较","本页课程示例读数和下一页有所不同。这里统一传递函数、阶跃幅值和 2% 误差带重新计算。")};
    }
  };
  const firstBands=[
    ["低频","型别 ν 与低频增益 K 决定稳态。本例 I 型，起始斜率 −20 dB/dec。",.10],
    ["中频","0 dB 穿越附近决定稳定裕度，也常反映响应速度。本例渐近斜率 −40 dB/dec。",3.9],
    ["高频","较强的高频衰减有利于抑制测量噪声。",25]
  ];
  const threeBands={title:"定位低、中、高频",timed:false,controls:[C("band","频段",firstBands.map(row=>row[0]),1)],
    draw(s){const [title,copy,w]=firstBands[s.band];return {art:bode([{sample:exLead,ink:colors.blue,label:"未校正"}],w),detail:panel(title,copy)};}};
  const leadRole=guideNet("比较三种开环形状",[C("mode","曲线",["K=3","K=15","K=15 ＋超前"],2)],s=>{
    const sample=[cascade(3,[],[1],1),exLead,combine(exLead,leadNetwork)][s.mode],kv=s.mode===0?3:15;
    return {series:[{sample,ink:[colors.green,colors.blue,colors.hot][s.mode],label:["K=3","K=15","K=15 ＋超前"][s.mode]}],info:responseInfo(sample,[["Kᵥ",kv]])};
  },s=>[["低增益取舍","稳态达标、裕度不足","保留低频增益、补中频相角"][s.mode],["K=3 裕度较高，低频精度有限。","把 K 提到 15 时，整条幅频上移，穿越处相角更滞后。","Kᵥ 保持 15，校正后穿越频率和相角裕度提高。"][s.mode]]);
  const setLead=guideNet("从相角要求同时求三个参数",[R("epsilon","修正角 ε / °",5,15,.5,9)],s=>{
    const phase=35-14+s.epsilon,alpha=(1-Math.sin(radians(phase)))/(1+Math.sin(radians(phase)));
    const wc=crossing(exLead,0,10*Math.log10(alpha)),T=1/(wc*Math.sqrt(alpha)),net=cascade(1,[T],[alpha*T]);
    return {series:[...tracesFor(net,exLead),{sample:combine(exLead,net),ink:colors.hot,label:"校正后"}],
      info:[["φm",f(phase,1)+"°"],["α",f(alpha,3)],["新 ωc",f(wc,2)],["T / s",f(T,3)]]};
  },()=>["找装置的中心点","ε 改变时，α 与新穿越频率一并改变。课本渐近线读 5.2 rad/s，仪表计算精确交点。"]);
  const lagChosen=guideNet("移动设计穿越点，重算幅值衰减",[
    R("wc","目标 ωc / rad·s⁻¹",.35,1.1,.01,.56),R("ratio","穿越 / 高端转折之比",4,12,.25,5.6)
  ],s=>{
    const T=s.ratio/s.wc,[before,phase]=exLag(s.wc);
    const beta=Math.sqrt(10**(before/10)*(1+s.ratio**2)-1)/s.ratio,net=lagNetwork(1,T,beta);
    return {series:[...tracesFor(net,exLag),{sample:combine(exLag,net),ink:colors.hot,label:"校正后"}],
      info:[["未校相角",f(phase,1)+"°"],["未校幅值",f(before,1)+" dB"],["精确 β",f(beta,1)],["T / s",f(T,1)]]};
  },()=>["按幅频配平求 β","计算保持 Kᵥ=10 的归一化网络，使所选频率恰好成为穿越点。调节转折距离还能影响附加相角。"]);
  const checkLag=guideNet("直接检验两种直流增益",[C("gain","直流增益",["K꜀=1，保持 Kᵥ","K꜀=2，课件列式"])],s=>{
    const gain=s.gain+1,net=lagNetwork(gain),total=combine(exLag,net);
    return {series:[...tracesFor(net,exLag),{sample:total,ink:colors.hot,label:"校正后"}],info:responseInfo(total,[["Kᵥ",10*gain]])};
  },s=>["检查约束是否一致",s.gain?"按列式逐点相乘时，Kᵥ 变成 20，不能同时代表题设 Kᵥ=10 与图解穿越点。":"K꜀=1 保留 Kᵥ=10；精确穿越点和相角裕度均与课件图解读数不同。请按题设三项指标验收。"]);

  Object.assign(window.SourcePolishCh6,{
    21:entry("本节以一个开环的三频段为路线，依次学习三种串联设计。","把稳态、稳定裕度和暂态指标转成 Bode 图中的设计约束。",[["本节顺序",["串联校正的作用与低、中、高频段。","超前例 6-1、滞后例 6-3、滞后—超前例 6-5。","对照校正目标、主要机制和代价。"]]]),
    22:entry("比较原来只调 K 的两条曲线，再加入实际超前网络。","改一个 K 会同时改变稳态与穿越位置；串联网络允许按频段塑形。",[["例 6-1","I 型系统 K=3 稳态精度不足。K=15 时课件读 ωc≈3.9、γ≈14°；超前后图读约 5.2、41°。"],["频域指标","开环 γ、ωc、Kg；闭环峰值 Mr、谐振频率 ωr 和带宽 ωb。"]],leadRole,[String.raw`G_0(s)=\frac{K}{s(s+1)}`]),
    23:entry("点选三个频段，把每段对性能的职责与实际曲线位置配对。","低频定精度，中频观察裕度与速度，高频反映抗噪。",[["K=15 的典型系统",firstBands.map(([name,copy])=>name+"："+copy)],["设计启发","希望在适中的穿越频率附近有一段宽的 −20 dB/dec 渐近斜率。"]],threeBands),
    24:entry("固定 ωc=1，只改零极点距离，量化斜率与相角的共同变化。","穿越附近越接近单积分特性，通常越容易获得较大的相角裕度。",[["两曲线有共同来源","零、极点分布同时决定幅相。在 a=3 时，局部斜率 −24 dB/dec，裕度约 53.1°。"]],fixedCross,[String.raw`L_a=\frac{1+as}{as^2(1+s/a)},\quad \omega_c=1,\quad \gamma=\arctan a-\arctan(1/a)`]),
    25:entry("把超调、调节时间做成输入，让 Bode 目标随要求变化。","用时域性能提出频域目标，最终仍校验实际闭环。",[["三组关系",["单位负反馈 I 型、单位斜坡：eₛₛ=1/Kᵥ。","阻尼相近时，ωc 提高通常响应更快。","标准二阶：10% 超调对应 ζ≈0.59、γ≈59°；tₛ≤2 s 时目标 ωc 约 2.4 rad/s。"]]],timeTargets),
    26:entry("分看未校相频与网络超前，再看相加后的新穿越点。","把超前角的峰值放在新穿越附近，直接给中频相位留余量。",[["三个相角","未校约 −165.3°（ωc≈3.9）；网络最大超前约 30°（α≈0.334）；合成后在新穿越附近约有 41° 裕度。"]],verification("未校相角加网络相角",exLead,leadNetwork),[String.raw`\varphi(\omega)=\varphi_0(\omega)+\varphi_c(\omega)`]),
    27:entry("六步可回退推演，检查每一个中间量由哪条曲线得到。","先定稳态增益，按频域裕度配置超前网络。",[["六步",leadSteps.map(([name,copy])=>name+"："+copy)]],walkthrough("逐步设计超前网络",leadSteps),[String.raw`\alpha=\frac{1-\sin\varphi_m}{1+\sin\varphi_m},\quad T=\frac1{\omega_m\sqrt{\alpha}}`]),
    28:entry("给例题立约束卡，先用未校曲线回答为何必须校正。","单位负反馈，K=15，要求 γ≥35°。",[["开环诊断","本例为 I 型，Kᵥ=15，增益项 23.5 dB。课件渐近线给出 ωc₁≈3.9，γ₀≈14°。"]],baseline("例 6-1 未校开环",exLead,15),[String.raw`G_0(s)=\frac{15}{s(s+1)}`]),
    29:entry("用 ε 带动 α、ωc、T 联动，标明课件的读图近似。","例 6-1 先算相角，再由幅值平衡找新穿越，最后放置两个转折。",[["原例参数","ε=9°、φm=30°、α≈0.334。在未校曲线上找 −4.77 dB，渐近线读 ωc₂≈5.2；T≈0.33 s。"],["转折","1/T≈3，1/(αT)≈9 rad/s。"]],setLead,[String.raw`G_c(s)=\frac{1+0.33s}{1+0.11s}`]),
    30:entry("切换未校、装置、合成曲线，再在合成曲线上验收。","例 6-1 超前后穿越向右移动，课件图读相角裕度约 41°。",[["对照","课件图读 ωc 约 3.9→5.2、γ约 14°→41°。α≈1/3 时，中心频率抬升 4.77 dB，高频平台为约 9.54 dB。"],["低频","G꜀(0)=1，Kᵥ 原样保持。"]],verification("例 6-1 逐点叠加 Bode 图",exLead,leadNetwork,[["Kᵥ","15"]])),
    31:entry("同步时间游标对比真实闭环阶跃，统一 2% 调节时间判据。","校正后响应更快，超调显著减小。",[["课件本页读数","超调 66.4%→32.5%，调节时间 5.86→0.98 s。下页读数不同，交互图按同一传递函数重新积分。"],["对应","穿越右移使典型速度提高；裕度增加时超调通常下降。"]],leadCompare),
    32:entry("把收益与代价放在同一参数拨尺上，便于判断适用条件。","超前同时换取更大的裕度与带宽，高频抗扰需要重新核验。",[["适用","稳态精度够、欲减少超调和调节时间、且穿越附近相位下降缓慢；高频干扰较小时优先。"],["代价","高频增益上升，单级超前一般不超过 60°。更大相角需求可考虑多级或滞后—超前。"],["课件本页比较","本页另列 5.70→1.08 s 和 63.2%→29.2%，与例题上一页读数口径不同。"]],simpleNet("lead")),
    33:entry("切换滞后网络直流增益，分辨穿越左移与稳态约束。","用中高频衰减换裕度，低频增益按稳态要求配置。",[["例 6-3 图解","原曲线课件读约 2.7 rad/s、−33°；β=20 提供相对直流平台约 26 dB 高频衰减。课件的新设计点约 0.56 rad/s、裕度约 +37°。"]],checkLag,[String.raw`G_c(s)=K_c\frac{Ts+1}{\beta Ts+1},\quad \beta>1`]),
    34:entry("和超前六步对照，强调滞后先在相频曲线上选穿越。","从相角裕度找目标穿越，再用幅值衰减把穿越移过去。",[["六步",lagSteps.map(([name,copy])=>name+"："+copy)]],walkthrough("逐步设计滞后网络",lagSteps),[String.raw`L_0(\omega_{c2})\approx20\lg\beta,\quad \omega_z=1/T,\quad \omega_p=1/(\beta T)`]),
    35:entry("先检验例 6-3 的未校稳定裕度与稳态误差系数。","给定 Kᵥ=10、γ≥35°、Kg≥10 dB，需设计串联滞后。",[["取 K","Kᵥ=K=10，增益项 20 dB。两个有限转折是 1、2 rad/s。"],["原课件图读","ωc₁≈2.7，γ₀≈−33°，单位负反馈未校系统不稳定。"]],baseline("例 6-3 精确未校 Bode",exLag,10),[String.raw`G_0(s)=\frac{10}{s(s+1)(0.5s+1)}`]),
    36:entry("把原题三次读数串成一个可操作设计：相角定位置，幅值定衰减，转折定时间常数。","例 6-3 预留滞后损失约 10°，课件选 ωc₂≈0.56 rad/s。",[["课件选择","在相角约 −135°处读频率，未校幅值约 26 dB，取 β=20，高端转折约 0.1，取 T=10 s。"],["直流系数","课件列出 2(10s+1)/(200s+1)，其直流系数是 2；保持原 Kᵥ=10 则应令 K꜀=1。"]],lagChosen),
    37:entry("让图解设计点和公式验算并列，用 K꜀ 切换暴露差异。","例 6-3 课件图解读 0.56 rad/s、约 37°、Kg≥10 dB。",[["代入课件列式","分子 20(10s+1) 对应 Kᵥ=20。保持 Kᵥ=10 时分子系数应为 10。两模式显示实际穿越与裕度；完整设计需复核三项约束。"]],checkLag,[String.raw`L(s)=\frac{10K_c(10s+1)}{s(s+1)(0.5s+1)(200s+1)}`]),
    38:entry("把 β 从小调大，对照带宽、裕度、高频衰减与 RC 的代价。","滞后适用于允许降低速度、穿越相位下降快、而抗高频噪声要求高的系统。",[["收益与代价","穿越左移通常提高裕度，高频也更衰减；带宽减小，响应趋慢。较大的 βT 需要较大 RC，本例 β=20 与 T=10 对应 200 s。"],["稳态","归一化装置保留直流系数，为满足精度而独立选 K。课件图解裕度约 −33°→+37°。"]],simpleNet("lag")),
    39:entry("先针对单个环节的限制做选择，再观察滞后与超前在不同频段分工。","当单独超前或滞后很难兼顾速度、稳定与精度时，把两个频段一起设计。",[["何时使用",["只超前：原穿越偏低、相位下降缓慢；许可提高带宽。","只滞后：原穿越偏高、可牺牲带宽；希望加强高频衰减。","滞后—超前：由滞后降低中频幅值，超前在新穿越附近补相角。"]]],deviceLab(2),[String.raw`G_c=\frac{1+T_1s}{1+\beta T_1s}\frac{1+T_2s}{1+T_2s/\beta}`])
  });
  const bothDesign=guideNet("试选目标穿越与两组转折",[R("target","设计 ωc / rad·s⁻¹",3.05,4.95,.05,3.5),R("relative","ωc / 滞后高端转折",3,10,.25,5)],s=>{
    const T1=s.relative/s.target,T2=.5,beta=180/s.target,net=cascade(1,[T1,T2],[beta*T1,T2/beta]);
    return {series:[...tracesFor(net,exBoth),{sample:combine(exBoth,net),ink:colors.hot,label:"校正后"}],
      info:[["T₁ / s",f(T1,2)],["T₂ / s",f(T2,2)],["β",f(beta,1)],["实际 ωc",f(measures(combine(exBoth,net)).freq,2)]]};
  },()=>["渐近线给初值","保持超前零点 2 rad/s，抵消对象 0.5s+1；用目标频率估计 β，再由精确曲线验收。"]);
  function localArt(kind){
    return svg("局部负反馈包围 G₂",arrowDef()+wire("M46 103H102")+junction(118,103)+wire("M131 103H182")+node(233,103,"G₁(s)",103)+
      wire("M285 103H331")+junction(346,103)+wire("M360 103H419")+node(475,103,"G₂(s)",110,true)+wire("M530 103H668")+
      wire("M564 103V178H527",colors.violet)+node(472,178,"G꜀(s)",109,true)+wire("M417 178H346V118",colors.violet)+wire("M632 103V223H118V119")+text(97,141,"−",16)+
      text(49,85,"R(s)")+text(661,85,"C(s)")+text(347,141,"−",16)+text(431,247,kind?"局部反馈改变被包围环节的灵敏度":"主回路设计前，先将局部负反馈合并",16,colors.soft),258);
  }
  const localLoop={
    title:"改变局部环路增益",timed:false,draggable:"g2",controls:[R("g2","对象 G₂ 幅值",.1,20,.1,5),R("gc","反馈 G꜀ 幅值",.05,9,.05,2)],
    draw(s){
      const gain=s.g2*s.gc,closed=s.g2/(1+gain);
      return {art:localArt(false),readouts:readouts([["局部环路增益",f(gain,2)],["闭环等效",f(closed,3)],["强反馈近似",f(1/s.gc,3)],["相对近似误差",f(100/(1+gain),1)+"%"]]),
        detail:panel("同相正实增益示例","环路增益为 10 时幅值误差为 9.1%。一般频域计算要用复数 G₂G꜀，包含相角影响。")};
    }
  };
  const localVariation={
    title:"改变被包围环节的增益",timed:false,draggable:"change",controls:[R("change","G₂ 参数变化 / %",-60,60,1,25),C("setting","局部反馈",["不接","弱反馈","强反馈"],2)],
    draw(s){
      const feedback=[0,.03,2][s.setting],before=5/(1+5*feedback),g2=5*(1+s.change/100),after=g2/(1+g2*feedback);
      return {art:localArt(true),readouts:readouts([["G₂ 变化",s.change+"%"],["等效变化",f(100*(after/before-1),1)+"%"],["名义灵敏度",f(1/(1+5*feedback),3)]]),
        detail:panel("灵敏度 = 1/(1+G₂G꜀)","在局部反馈具有足够稳定裕度的频段，强反馈能减少被包围环节参数摄动的影响。")};
    }
  };
  function feedArt(mode,level=1){
    const showInput=mode===1,showDisturbance=mode===2;
    const feedback=wire("M607 136V248H106V151")+text(356,272,"主负反馈",16,colors.soft);
    const main=arrowDef()+wire("M44 136H91")+junction(106,136)+wire("M119 136H178")+node(235,136,"G₁(s)",110,showDisturbance)+
      wire("M290 136H358")+junction(373,136)+wire("M386 136H451")+node(508,136,"G₂(s)",111,showInput)+
      wire("M564 136H675")+text(50,116,"R(s)")+text(662,116,"C(s)")+text(77,165,"−",16,colors.soft)+feedback;
    const input=wire("M58 136V55H186",colors.violet)+node(244,55,"Fᵣ(s)",112,true)+wire("M300 55H373V120",colors.violet)+text(396,111,"+",17,colors.violet);
    const disturb=wire("M373 59V120",colors.green)+text(373,42,"N(s)",18,colors.green)+text(396,111,"+",17,colors.green);
    const cancel=wire("M373 63H302",colors.violet)+node(244,63,"Fₙ(s)",112,true)+wire("M188 63H106V121",colors.violet)+text(128,107,"−",17,colors.violet);
    return svg(showInput?"按输入前馈":showDisturbance?"按扰动前馈":"主反馈",main+(showInput?input:showDisturbance?disturb+(level?cancel:""):""),286);
  }
  const feedModes=[["仅反馈","反馈回路决定特征方程与基本抗扰。"],["按输入","输入可直接测取，补偿接到 G₂ 前的正相加点。"],["按扰动","扰动沿直接通路进入对象，另外引出负号前馈，抵消这条影响。"]];
  const feedChoice={title:"选择前馈接入端",timed:false,controls:[C("mode","结构",feedModes.map(([label])=>label))],
    draw(s){return {art:feedArt(s.mode),detail:panel(...feedModes[s.mode])};}};
  function feedGain(isInput){
    return {title:isInput?"逐步补全给定通道":"用第二条通路抵消扰动",timed:false,draggable:"gain",controls:[R("gain","补偿比例 / %",0,125,1,100)],
      draw(s){
        const ratio=s.gain/100,residual=1-ratio;
        const rows=isInput?[["补偿乘积 FᵣG₂",f(ratio)],["误差通道分子",f(residual)]]:[["直接通路",f(1)],["前馈通路",f(-ratio)],["扰动通道分子因子",f(residual)]];
        return {art:feedArt(isInput?1:2,s.gain>0),readouts:readouts(rows),detail:panel(isInput?"误差来自 1−FᵣG₂":"扰动前馈带负号",s.gain===100?"两项配平，理想模型下实现全补偿。":"示意指定频点、两通路同相时的幅值配平；设计还需考虑相位与可实现性。")};
      }};
  }
  const partial=[
    ["未补偿","开环 G₁G₂ 含一个积分，斜坡误差为 A/(K₁K₂)。"],
    ["选出前馈","全补偿分子二阶、分母一阶。采用可实现的部分补偿 s/[K₂(T₄s+1)]。"],
    ["提取残差","1−FᵣG₂=T₃s/(T₃s+1)，与反馈误差传递相乘后分子含 s²。"],
    ["查稳态误差","斜坡误差为 0；抛物线输入 At²/2 时为 T₃A/(K₁K₂)。输入—输出等效 2 型。"]
  ];
  const coupled={
    title:"同时调整两个频段的四个转折",timed:false,draggable:"beta",
    controls:[R("beta","共同 β",1.5,14,.25,4),R("early","滞后 T₂ / s",5,20,.25,10),R("late","超前 T₁ / s",.4,4,.1,2)],
    draw(s){
      const net=cascade(1,[s.early,s.late],[s.beta*s.early,s.late/s.beta]),[amp,phase]=net(1),d=180-155+phase;
      const positions=[1/(s.beta*s.early),1/s.early,1/s.late,s.beta/s.late];
      return {art:bode([{sample:net,ink:colors.violet,label:"耦合校正装置"}],1,-3,2),
        readouts:readouts([["滞后转折",f(positions[0],3)+" / "+f(positions[1],3)],["超前转折",f(positions[2],3)+" / "+f(positions[3],3)],["ω*=1 的幅值",f(6+amp,2)+" dB"],["ω*=1 的 180°+相角",f(d,1)+"°"]]),
        detail:panel("两个约束用同一组 β、T₁",`装置在设计点提供 ${f(amp,2)} dB 和 ${f(phase,1)}°。只有在该点幅值为 0 dB 时，相角读数才是穿越处的裕度。`)};
    }
  };
  const finalReview=[
    ["概念和接法","增加辅助装置以改善性能：串联、局部反馈、复合。设计可用频率特性、根轨迹或复合补偿。"],
    ["校正装置","超前提供正相角，滞后高频衰减 −20 lgβ；滞后—超前与 PID 兼顾多目标。"],
    ["频率法","超前补相角；滞后通过衰减把穿越左移；滞后—超前在两段联合配置。"],
    ["局部反馈","强反馈频段 G₂c 近似 1/G꜀，弱反馈频段接近 G₂。"],
    ["两类前馈","按不变性原理，输入 Fᵣ=1/G₂，扰动 Fₙ=1/G₁。部分补偿也能提高等效型别。"]
  ];

  Object.assign(window.SourcePolishCh6,{
    40:entry("用三项指标卡固定例 6-5 条件，先检查未校对象的真实 Bode 曲线。","单位负反馈，要求 Kᵥ≥180、γ≥40°、3<ωc<5 rad/s。",[["课件诊断","Kᵥ=K，取 180；转折 2、约 6 rad/s。渐近线读未校 ωc₁≈12.9、γ₀≈−56°，保住低频增益，并调节穿越位置与相角。"]],baseline("例 6-5 未校开环",exBoth,180),[String.raw`G_0(s)=\frac{180}{s(0.5s+1)(0.167s+1)}`]),
    41:entry("把期望 ωc 与实际穿越放在同一图，拖动后使两段参数随设计联动。","先压中频幅值，再用 0.5s+1 抵消原对象的对应环节。",[["课件参数","设计点取 3.5 rad/s；滞后转折约 0.7 rad/s，T₁≈1.43 s；超前零点 2 rad/s，T₂=0.5 s；对象另一转折约 6 rad/s。"],["渐近值与列式","β≈51.3；原列式的超前分母系数约写成 0.009，按 T₂/β 则约 0.00975。"]],bothDesign,[String.raw`G_c(s)\approx\frac{(1.43s+1)(0.5s+1)}{(73.3s+1)(0.009s+1)}`]),
    42:entry("原图解设计点与列式求得的 0 dB 穿越并排，逐项核对约束。","例 6-5 校正后 Kᵥ=180、穿越在 3–5 rad/s，裕度达到 40°。",[["图解与验算","课件设计点 3.5 rad/s、约 46.7°；按印出的近似系数实际穿越约 3.18 rad/s、裕度约 48.3°，同样满足。"],["合成","抵消 0.5s+1，保留分子低频常数 180。"]],verification("例 6-5 逐点叠加 Bode 图",exBoth,bothNetwork,[["Kᵥ","180"]]),[String.raw`L(s)=\frac{180(1.43s+1)}{s(73.3s+1)(0.167s+1)(0.009s+1)}`]),
    43:entry("对照装置实际曲线，把三种设计各自的适用条件与代价放在旁边。","先看穿越点该左移还是右移，再判断相角和抗噪的取舍。",[["三种取舍",["超前：幅值增加、相角超前；原穿越偏低、相位变化慢时合适。带宽提升，高频抗噪变弱。","滞后：幅值衰减、相角滞后；响应速度要求不高、相位下降快时合适。穿越左移，高频抗噪变强。","滞后—超前：独立手段难兼顾时采用，分段调幅和补角；可兼顾稳态与暂态。"]]],guideNet("比较串联装置",[C("method","校正方法",["超前","滞后","滞后—超前"])],s=>{
      const [label,k]=[["超前",.10],["滞后",10],["滞后—超前",10]][s.method];
      const sample=s.method<2?cascade(1,[1],[k]):cascade(1,[8,.38],[80,.038]);
      return {series:[{sample,label,ink:colors.violet}],info:[["直流增益","1"],["游标幅值",f(sample(10**s.probe)[0],1)+" dB"],["游标相角",f(sample(10**s.probe)[1],1)+"°"]]};
    })),
    44:entry("用局部框图和即时数值直接比较 G₂c、G₂ 与 1/G꜀。","用 G꜀ 包围 G₂，强反馈频段可依照 1/G꜀塑形。",[["合并次序","先合局部负反馈，再把等效环节和 G₁ 串联。局部环路增益远小于 1 时，G₂c≈G₂。"],["量级","局部环路幅值达到 10（20 dB）时近似较好；具体误差还取决于环路相角。"]],localLoop,[String.raw`G_{2c}=\frac{G_2}{1+G_2G_c},\quad G=G_1G_{2c}`]),
    45:entry("用三档局部反馈和同一对象参数变化突出灵敏度差异。","校正器包围妨碍动态性能的环节，也能削弱其参数摄动与非线性影响。",[["校正原则","强反馈频段依校正器塑形，弱反馈频段接近原对象。先确认局部回路稳定，再选择 G꜀ 形式和参数。"],["对照串联","除获得相近的性能校正外，局部反馈可抑制被包围环节的参数变化与局部非线性。"]],localVariation),
    46:entry("切换同一个框图的三种路径，先确认前馈信号取自哪里。","为强可测扰动或精度要求加入前馈，反馈和前馈协同工作。",[["不变性原理","给定补偿令输出跟随给定；按扰动补偿令输出对该扰动不变。主反馈仍满足稳定和基本动态要求。"],["应用动机","低频强扰动单靠反馈可能抑制不足；能测到它时可另设前馈。"]],feedChoice),
    47:entry("保留两条通路的同一加点，拖动补偿比例看到误差分子到零。","按输入全补偿应让前馈经 G₂ 后成为单位通路。",[["全补偿","C≡R 要求 FᵣG₂=1，故 Fᵣ=1/G₂。对象严格真有理时，直接求逆通常不可物理实现。"],["工程处理","使用带限制的近似或部分补偿；例 6-8 采用微分型前馈。"]],feedGain(true),[String.raw`\frac{C}{R}=\frac{(G_1+F_r)G_2}{1+G_1G_2},\qquad \frac{E}{R}=\frac{1-F_rG_2}{1+G_1G_2}`]),
    48:entry("四步翻阅 G₁G₂、前馈、残差与输入类型，保留原例完整演算变量。","例 6-8 的部分补偿使给定通道等效从 1 型升至 2 型。",[["原例条件","G₁=K₁(T₂s+1)/(T₁s+1)，G₂=K₂(T₄s+1)/[s(T₃s+1)]，输入 r=At。"],["精度改变","补偿前斜坡误差 A/(K₁K₂)。补偿后斜坡误差为零，抛物线输入 At²/2 的误差为 T₃A/(K₁K₂)，以上假定闭环稳定。"]],walkthrough("例 6-8 逐步核算",partial,step=>step===0?feedArt(0):feedArt(1)),[String.raw`F_r=\frac{s}{K_2(T_4s+1)},\quad \frac{E}{R}=\frac{s^2T_3(T_1s+1)}{s(T_1s+1)(T_3s+1)+K_1K_2(T_2s+1)(T_4s+1)}`,String.raw`G^{*}=\frac{G_2(G_1+F_r)}{1-G_2F_r}`]),
    49:entry("突出扰动的正向注入和负向前馈，用比例拖动展示两路抵消。","设给定为零。扰动从 G₁、G₂ 之间进入，测得后由 Fₙ 以负号送到 G₁ 前。",[["完全对消","令 G₁Fₙ=1，因此 Fₙ=1/G₁。可测扰动沿两条通路等值反号时，输出对该扰动为零。"]],feedGain(false),[String.raw`\frac{C}{N}=\frac{G_2(1-G_1F_n)}{1+G_1G_2}`]),
    50:entry("把特征方程、测量、实现性、配合四项做成可切换说明。","前馈与反馈分工：反馈稳住回路，前馈改善特定给定或扰动通道。",[["四项判断",["前馈加在反馈回路外，主回路特征方程不变；给定或扰动通道的分子可变，响应也可随之改变。","扰动前馈需要可测扰动。","全补偿结构常受阶次约束，可用近似全补偿或稳态补偿。","主要可测扰动交给前馈，次要与不可测扰动由反馈抑制；微分型前馈有时可拓宽给定通道频带。"]]],walkthrough("前馈方案的四项复核",[["特征方程","反馈极点由反馈回路决定；新增前馈本身也应稳定可实现。"],["测量","测得到主要扰动，才能由其引出前馈。"],["物理可实现","不宜直接使用不适当的高阶逆，必要时只能部分补偿。"],["配合","允许主反馈设计得更平稳，再通过输入前馈改善给定通道速度。"]])),
    51:entry("以本章五节为索引回顾，与原课件主题顺序对应。","从性能指标选校正结构，再验证校正后模型。",[["五节要点",finalReview.map(([name,copy])=>name+"："+copy)]],walkthrough("沿五节回看设计思路",finalReview),[String.raw`\varphi_m=\arcsin\!\left(\frac{1-\alpha}{1+\alpha}\right),\qquad G_{2c}\approx 1/G_c\ (|G_2G_c|\gg 1)`]),
    52:{...entry("把原课堂判断改成可提交多选，填空答案留在知识核对区。","判定串联、局部反馈与复合校正的作用。",[["填空核对",["前馈按不变性原理设计。","按输入全补偿 Fᵣ=1/G₂，按扰动全补偿 Fₙ=1/G₁。","例 6-8 从 1 型升至等效 2 型。","强局部反馈 G₂c≈1/G꜀。"]]]),
      quiz:{prompt:"关于校正方法，哪些说法正确？",options:["超前利用正相角，可提升穿越频率与相角裕度","加前馈后主反馈闭环特征方程一定改变","滞后利用高频衰减，把穿越左移以换裕度","复合校正按不变性原理，可按输入或扰动补偿","按扰动前馈不要求扰动可测"],answers:[0,2,3],feedback:"前馈位于主反馈外，按扰动前馈需要可获知扰动信号。"}},
    53:entry("改变 T₂、T₁ 和共同 β，同时观察两段转折与设计点误差。","先满足稳态，再用两个设计约束联合求 β 和 T₁，T₂先按滞后位置选定。",[["五步","定 K；定目标 ωc*、γ*；用原系统在目标点的幅相求补偿；先取 1/T₂=ωc*/10；联合解 β、T₁并验证全系统。"],["数值示例","ωc*=1，T₂=10、β=4、T₁=2。原系统 +6 dB、−155°；装置约 −6 dB、+32.6°；合成约 0 dB、−122.4°，目标裕度约 57.6°。"],["耦合","β 改变两组折点间距，不能分给两段独立选择。G꜀(0)=1。"]],coupled,[String.raw`G_c(s)=\frac{1+T_2s}{1+\beta T_2s}\frac{1+T_1s}{1+T_1s/\beta},\quad \beta>1,\ T_2>T_1>0`,String.raw`|L(j\omega_c^*)|=1,\qquad 180^\circ+\angle L(j\omega_c^*)=\gamma^*`])
  });
})();
