"use strict";
(function(){
  const W=IntroWidgets,M=IntroModels,{range:R,choices:C,note,readouts,ink}=W;
  const span=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
  const n=(x,d=2)=>Number.isFinite(x)?x.toFixed(d):"—";
  const series=fn=>Array.from({length:M.steps+1},(_,i)=>{const t=i*M.dt;return {t,...fn(t,i)};});
  const trace=(series,key,label,color,dash=false)=>({series,key,label,color,dash});
  const block=(title,text)=>'<section class="selected-result"><strong>'+W.escape(title)+'</strong><p>'+W.escape(text)+'</p></section>';
  const names=["死区","饱和","间隙","继电器"];
  function nonlinearity(u,type,k,a,old){
    if(type===0)return Math.sign(u)*Math.max(0,Math.abs(u)-a)*k;
    if(type===1)return M.clamp(u,-a,a)*k;
    if(type===2)return M.clamp(old,u-a,u+a);
    return u>a?k:u<-a?-k:old;
  }
  function waveform(s){
    let old=0;
    return series(t=>{
      const x=s.amplitude*Math.sin(2*Math.PI*t/4);
      const y=nonlinearity(x,s.type,1,s.threshold,old);
      old=y;return {x,y};
    });
  }
  function phaseLoop(s){
    const x=[],y=[];
    let previous=0;
    for(let i=0;i<=180;i++){
      const u=s.amplitude*Math.sin(4*Math.PI*i/180);
      previous=nonlinearity(u,s.type,1,s.threshold,previous);
      if(i>=90){x.push(u);y.push(previous);}
    }
    const lim=Math.max(1.4,s.amplitude*1.08), tx=u=>260+u*154/lim,ty=v=>131-v*90/lim;
    const d=x.map((v,i)=>(i?"L":"M")+n(tx(v),1)+" "+n(ty(y[i]),1)).join("");
    return graphic(d,"输入 x","输出 y",260,131);
  }
  function graphic(d,xText,yText,x=258,y=131){
    return '<svg viewBox="0 0 520 260" role="img" aria-label="'+W.escape(xText)+" 与 "+W.escape(yText)+'"><rect x="43" y="18" width="433" height="218" rx="7" fill="#edf5fb"/>'+
      '<path d="M51 '+y+'H469M'+x+' 23V231" stroke="#829bb5" stroke-width="1.4"/><path d="'+d+'" fill="none" stroke="#167968" stroke-width="3"/>'+
      '<text x="454" y="'+(y+21)+'" text-anchor="end" fill="#254a6c" font-size="16">'+W.escape(xText)+'</text><text x="60" y="47" fill="#254a6c" font-size="16">'+W.escape(yText)+'</text></svg>';
  }
  function harmonic(type,a,b){
    let y=0,re=0,im=0,third=0;
    const count=900;
    for(let i=0;i<2*count;i++){
      const phi=i/count*2*Math.PI;
      y=nonlinearity(a*Math.sin(phi),type,1,b,y);
      if(i>=count){re+=y*Math.sin(phi);im+=y*Math.cos(phi);third+=y*Math.sin(3*phi);}
    }
    return {re:2*re/count/a,im:2*im/count/a,third:2*third/count};
  }
  function saturationN(amplitude){
    if(amplitude<=1)return 2;
    const v=1/amplitude;
    return 4/Math.PI*(Math.asin(v)+v*Math.sqrt(1-v*v));
  }
  function lining(K,w){
    const a=-.3*w*w,b=w*(1-.02*w*w),d=a*a+b*b;
    return [K*a/d,-K*b/d];
  }
  function cycleAmplitude(K){
    if(K<7.5)return null;
    let a=1,b=K;
    for(let i=0;i<55;i++){
      const c=(a+b)/2;
      if(saturationN(c)>15/K)a=c;else b=c;
    }
    return (a+b)/2;
  }
  function complexPlot(K,amp,w){
    const tx=x=>400+52*x,ty=y=>94-41*y;
    const path=Array.from({length:260},(_,i)=>{
      const v=1.8+16*i/259,[x,y]=lining(K,v);
      return (i?"L":"M")+n(tx(x),2)+" "+n(ty(y),2);
    }).join("");
    const [x,y]=lining(K,w), b=tx(-1/saturationN(amp));
    return '<svg viewBox="0 0 520 260" role="img" aria-label="正频率曲线和负倒描述函数射线"><defs><clipPath id="nl-plot"><rect x="34" y="13" width="467" height="225"/></clipPath></defs>'+
      '<rect x="34" y="13" width="467" height="225" rx="6" fill="#edf5fb"/><path d="M35 94H499M400 14V238" stroke="#91a6ba" fill="none"/>'+
      '<g clip-path="url(#nl-plot)"><path d="M36 94H374" stroke="#cc7137" stroke-width="3" stroke-dasharray="6 3"/><path d="'+path+'" stroke="#0b7f6b" fill="none" stroke-width="3"/><circle cx="'+tx(x)+'" cy="'+ty(y)+'" r="8" fill="#fff" stroke="#0b7f6b" stroke-width="3"/><path d="M'+b+' 89l5 5-5 5-5-5z" fill="#fff" stroke="#c16a35" stroke-width="2.2"/></g>'+
      '<text x="453" y="85" font-size="16">Re</text><text x="410" y="30" font-size="16">Im</text><text x="56" y="77" fill="#a4512c" font-size="16">−1/N(A)</text><text x="56" y="220" fill="#167968" font-size="16">G(jω)</text></svg>';
  }

  const overview = {
    title:"观察非线性实物的约束",chartTitle:"同一正弦输入的进出变化",visual:"nonlinear",draggable:"amplitude",
    controls:[R("amplitude","输入振幅",.2,3,.02,1.8),R("threshold","饱和阈值",.25,2,.02,.84)],
    draw(s){
      const a={...s,type:1},x=waveform(a),p=M.at(x,s.time);
      return {art:phaseLoop(a),chart:W.plot([trace(x,"x","输入",ink.target,true),trace(x,"y","饱和输出",ink.teal)],s.time,{low:-3.2,high:3.2,unit:"相对值"}),readouts:readouts([["输入",n(p.x)],["输出",n(p.y)]]),
        detail:block("先判断约束是否激活","振幅低于阈值时，在这一段内近似成线性。跨过阈值后输出受到限制，比例关系改变。"),note:note("非线性来自元件结构和运动约束。即使小信号近似线性，换一个工作范围也可能失效。")};
    }
  };
  const properties = {
    title:"初值、谐波与自激振荡",chartTitle:"振幅随时间变化",visual:"nonlinear",draggable:"initial",
    controls:[C("mode","现象",["初值与稳定","谐波","自激振荡"],2),R("initial","初始幅值",.08,2.5,.02,.55),R("threshold","限制幅值",.35,1.8,.01,1)],
    draw(s){
      let a=s.initial;
      const input={type:1,threshold:s.threshold,amplitude:s.initial};
      const x=s.mode===1?waveform(input):series(t=>{
        const t0=a;
        a+=M.dt*(s.mode===2?.72*a*(1-(a/s.threshold)**2):-.45*a);
        return {y:t0*Math.sin(2.2*t),x:t0};
      });
      const p=M.at(x,s.time), h=harmonic(1,s.initial,s.threshold);
      const limit=Math.max(.5,s.initial,s.threshold);
      const phasePath=s.mode===1?"":x.map(({t,x:amplitude,y},i)=>
        (i?"L":"M")+n(258+y*141/limit,1)+" "+n(131-amplitude*Math.cos(2.2*t)*91/limit,1)).join("");
      return {art:s.mode===1?phaseLoop(input):graphic(phasePath,"状态 x₁","状态 x₂"),
        chart:W.plot([trace(x,"y",s.mode===1?"饱和输出":"状态",ink.teal),trace(x,"x",s.mode===1?"输入":"振幅包络",ink.orange,true)],s.time,{low:-2.7,high:2.7,unit:"相对值"}),
        readouts:readouts(s.mode===1?[["基波实部",n(h.re)],["第 3 谐波",n(Math.abs(h.third))]]:[["振幅包络",n(p.x)],["观察时刻",n(s.time,1)+" s"]]),
        detail:block(["初值影响轨迹","非线性改变频谱","振幅趋向固定值"][s.mode],["非线性稳定性可能依赖初值、振幅和工作区间。","饱和削尖后产生新的谐波成分。","此示意中，从不同非零振幅出发，响应趋向同一个极限环。"][s.mode]),
        note:note("零阻尼线性系统的等幅振荡幅度由初值决定；稳定极限环会吸引附近轨迹。")};
    }
  };
  const elements = {
    title:"元件输入输出轨迹",chartTitle:"同一输入扫过不同元件",visual:"nonlinear",draggable:"threshold",
    controls:[C("type","典型环节",names,1),R("amplitude","输入幅值",.25,2.8,.01,1.8),R("threshold","阈值或半间隙",.05,1.8,.01,.61)],
    draw(s){
      const x=waveform(s),p=M.at(x,s.time);
      return {art:phaseLoop(s),chart:W.plot([trace(x,"x","输入",ink.target,true),trace(x,"y","实际输出",ink.teal)],s.time,{low:-3,high:3,unit:"相对值"}),readouts:readouts([["输入",n(p.x)],["输出",n(p.y)]]),
        detail:block(names[s.type],["输入落在不灵敏区内时输出为零。","输出达到上、下极限后不再按比例增长。","输入反向后先消除空程，输出对输入历史敏感。","越过上、下切换阈值时改变状态；中间保留先前状态。"][s.type]),
        note:note("在间隙和带滞环继电器上，同一输入值可能对应不同输出。")};
    }
  };
  const describing = {
    title:"提取基波分量",chartTitle:"完整波形与一阶谐波",visual:"nonlinear",draggable:"amplitude",
    controls:[C("type","非线性",names,1),R("amplitude","正弦输入振幅",.15,2.8,.01,1.7),R("threshold","阈值",.05,1.6,.01,.56)],
    draw(s){
      const H=harmonic(s.type,s.amplitude,s.threshold),x=waveform(s).map(row=>({...row,first:s.amplitude*(H.re*Math.sin(2*Math.PI*row.t/4)+H.im*Math.cos(2*Math.PI*row.t/4))}));
      const peak=Math.max(.2,...x.map(({y,first})=>Math.max(Math.abs(y),Math.abs(first))));
      const bound=Math.ceil(peak*12)/10;
      return {art:phaseLoop(s),chart:W.plot([trace(x,"y","完整输出",ink.blue),trace(x,"first","基波近似",ink.teal)],s.time,{low:-bound,high:bound,unit:"相对值"}),
        readouts:readouts([["Re N",n(H.re,3)],["Im N",n(H.im,3)],["三次谐波正弦分量",n(H.third,3)]]),
        detail:block("N(A) 的含义","用输出基波相对输入正弦的幅值比和相位差表示。基波系数来自一个周期的投影。"),
        note:note("拖振幅或阈值，基波估计与实际输出随之改变。高次谐波被忽略，这是一种近似。")};
    }
  };
  const reciprocal = {
    title:"在复平面上分清两个参数",visual:"nonlinear",timed:false,draggable:"amp",
    controls:[R("amp","非线性输入振幅",.3,5,.02,2.15),R("w","角频率 ω",2,16,.02,7," rad/s"),R("K","线性部分增益",4,22,.1,15)],
    draw(s){
      const f=saturationN(s.amp),[x,y]=lining(s.K,s.w);
      return {art:complexPlot(s.K,s.amp,s.w),readouts:readouts([["N(A)",n(f,3)],["−1/N(A)",n(-1/f,3)],["两点距离",n(Math.hypot(x+1/f,y),3)]]),
        detail:block("两条曲线各扫什么","橙点随振幅移动，绿点随角频率移动。只有复平面位置重合时才满足基波平衡条件。"),
        note:note("N(A)=0 时负倒数没有有限值；可见交点本身也不能证明全局稳定。")};
    }
  };
  const stability = {
    title:"候选振幅附近的演化",chartTitle:"不同初始振幅的比较",visual:"nonlinear",draggable:"gain",
    controls:[R("gain","幅值增长系数",-.8,.8,.01,.45),R("initial","初始振幅",.08,2.8,.01,.62)],
    draw(s){
      let v=s.initial;
      const x=series(t=>{const a=v;v+=M.dt*v*(s.gain-.42*v*v);return {y:a*Math.sin(2.4*t),a};});
      const limit=Math.sqrt(Math.max(0,s.gain)/.42),p=M.at(x,s.time);
      const d=Array.from({length:101},(_,i)=>{const q=i/100*Math.PI*2;return (i?"L":"M")+n(258+82*limit*Math.cos(q),1)+" "+n(131+67*limit*Math.sin(q),1);}).join("");
      return {art:graphic(d,"状态 x₁","状态 x₂"),chart:W.plot([trace(x,"y","振荡",ink.teal),trace(x,"a","包络",ink.orange,true)],s.time,{low:-3,high:3,unit:"相对值"}),
        readouts:readouts([["当前幅值",n(p.a)],["候选平衡幅值",n(limit)]]),detail:block("怎样判断极限环稳定","候选幅值内侧的轨迹应向外靠近，外侧的轨迹应向内靠近，两边的扰动都衰减才是稳定。"),
        note:note("本页用独立幅值方程展示吸引性。描述函数交点是求候选的近似条件。")};
    }
  };
  const example = {
    title:"例 8-1 · 饱和与三个线性环节",visual:"nonlinear",timed:false,draggable:"K",
    controls:[R("K","增益 K",3,25,.05,15),R("w","绿点频率",2,16,.01,7.07," rad/s"),R("amp","橙点振幅",.4,6,.01,2.48)],
    draw(s){
      const a=cycleAmplitude(s.K);
      return {art:complexPlot(s.K,s.amp,s.w),readouts:readouts([["边界 K","7.50"],["候选振幅",a===null?"无交点":n(a,3)],["候选角频率",a===null?"—":"7.071 rad/s"]]),
        detail:block(s.K<7.5?"没有相交":s.K===7.5?"射线端点相交":"有限幅值候选","G(s)=K/[s(0.1s+1)(0.2s+1)]，饱和斜率 2，阈值 1。先令虚部为零求频率，再令实部等于负倒描述函数求振幅。"),
        note:note("K=7.5 是小信号等幅临界。K=15 时振幅约为 2.4754，结论属于描述函数近似预测。")};
    }
  };
  const wrapup = {
    title:"先判断条件，再检查结论",visual:"nonlinear",timed:false,draggable:"question",
    controls:[R("question","复习问题",0,2,1,0),C("show","核对",["先判断","查看结论"])],
    draw(s){
      const q=["振幅改变后，描述函数一般会怎样？","线性系统等幅振荡能否视作稳定极限环？","例 8-1 中 K=7.5 处于什么状态？"][s.question];
      const a=["描述函数一般随输入振幅而变。","零阻尼线性系统的等幅振荡由初值决定，不能视作孤立的稳定极限环。","小信号等幅临界，此时交点是负倒描述函数射线的端点。"][s.question];
      return {art:block("先预测",q),detail:block(s.show?"核对结论":"依据",s.show?a:"可以回到本章的元件、基波和极限环实验，通过拖动印证判断。"),note:note("复习时按典型特性、基波近似、相交条件、候选稳定性四步检查。")};
    }
  };
  function group(title,a,b,lab,points,lesson=points){return {title,source:span(a,b),points,lesson,lab};}
  window.CourseUnits??={};
  window.CourseUnits[8]={label:"第八章 非线性系统分析",groups:[
    group("为什么要研究非线性",1,4,overview,[
      ["非线性客观存在","限制、摩擦、间隙、饱和等现实因素可能破坏叠加性。可以先判断工作区间能否用线性近似。"],
      ["本章路线","先辨认典型非线性，再用描述函数在满足条件时近似研究系统响应与自振。"]
    ]),
    group("非线性改变了哪些现象",5,8,properties,[
      ["稳定性更复杂","状态可能随初值变化。同一系统可以有不同运动形式，局部结论不能自动推广。"],
      ["波形与频谱","正弦经非线性后可能产生直流或谐波，奇对称情形的典型输出以奇次谐波为主。"],
      ["自激振荡","振幅与频率由系统本身决定，系统在没有周期性外激励时也可能形成稳定的周期运动。"]
    ]),
    group("四类典型非线性元件",9,14,elements,[
      ["死区和饱和","死区是小输入没有响应；饱和是响应达到边界后不再增加。可通过阈值对照两个区间。"],
      ["间隙","换向后的空程使输入与输出存在回线，当前位置还和历史状态有关。"],
      ["继电器类型","理想继电器按输入符号切换，带死区时中间可能为零，带滞环时在上下不同阈值切换。"]
    ]),
    group("只保留基波，怎样得到 N(A)",15,20,describing,[
      ["展开与投影","输入 A sin(ωt)，在稳态周期内求输出同相正弦系数 b₁ 与正交余弦系数 a₁。采用 sin 为基准时 N(A)=(b₁+j a₁)/A。"],
      ["饱和","若 A≤a，N=k。若 A>a，N=(2k/π)[arcsin(a/A)+(a/A)√(1−(a/A)²)]。"],
      ["继电器","理想输出 ±M 时 N=4M/(πA)。有死区的对称继电器按导通区间积分；带滞环的继电器有负相位，N 为复数。"],
      ["哪些成分被舍去","傅里叶分析可列出其他谐波。描述函数用基波响应代替整个输出，适用于高次谐波能被充分衰减的情形。"]
    ]),
    group("负倒描述函数与近似条件",21,24,reciprocal,[
      ["两种参数","G(jω) 由频率扫描得到，−1/N(A) 由振幅扫描得到。饱和环节的负倒描述函数在负实轴上。"],
      ["使用条件","通常可按一个典型非线性加线性部分分解；线性部分有低通特性，使基波主导；适合考察近似正弦的周期运动。"],
      ["闭环原理","可行基波周期运动需要 1+G(jω)N(A)=0，也就是两条曲线在同一复数点重合。"]
    ]),
    group("用交点和幅值扰动判断自振",25,27,stability,[
      ["三类情况","找不到交点时，这种近似没有给出自振候选；临界相接时须单独分析；存在交点时还须判断附近运动。"],
      ["稳定极限环","从略小幅值扰动应向外回到候选值，略大幅值应向内靠拢。同向经过候选或向两侧离开均不具备双侧吸引性。"],
      ["判据的范围","描述函数是谐波近似。局部周期判据不提供全局稳定性保证，可结合时域仿真验证。"]
    ]),
    group("例 8-1 · 算出自振边界",28,30,example,[
      ["建立条件","G(s)=K/[s(0.1s+1)(0.2s+1)]，饱和斜率 k=2、阈值 a=1，单位反馈。"],
      ["先求频率","分母为 −0.3ω²+jω(1−0.02ω²)。正频率虚部过零得到 ω=√50≈7.07 rad/s，交点横坐标为 −K/15。"],
      ["再求振幅与边界","N(A)≤2，负倒数从 −0.5 向左延伸。K<7.5 无交点，K=7.5 为临界，K>7.5 有有限振幅候选。K=15 时 A≈2.4754。"]
    ]),
    group("复习、自测与作业",31,33,wrapup,[
      ["随堂测","描述函数的自变量通常是振幅。自振振幅、频率取决于系统自身参数，自激振荡可能是稳定极限环，也可用于振荡器。"],
      ["解题顺序","写出非线性特性和 G(s)，算 N(A) 后比较两条轨迹，再根据交点和邻近幅值判断，最后明确近似条件。"],
      ["课后练习","写出描述函数定义及使用条件，列出用描述函数法分析稳定性的步骤，并完成习题 8-4。"],
      ["后续主题","线性系统的状态空间分析，从传递函数的输入输出描述转向内部状态描述。"]
    ])
  ]};
})();
