"use strict";
(() => {
  const W=IntroWidgets,M=IntroModels;
  const {range:R,choices:C,plot,readouts,note,ink,escape}=W;
  const inherited=window.CourseUnits[8].groups.map(item=>item.lab);
  const val=(value,n=3)=>Number(value.toFixed(n));
  const rows=fn=>Array.from({length:M.steps+1},(_,i)=>{const t=i*M.dt;return {t,...fn(t)};});
  const series=(data,key,label,color,dash=false)=>({series:data,key,label,color,dash});
  const panel=(title,text)=>'<section class="text-block"><h3>'+escape(title)+'</h3><p>'+escape(text)+'</p></section>';
  const svg=(body,label)=>'<svg viewBox="0 0 640 253" role="img" aria-label="'+escape(label)+'">'+body+'</svg>';
  const label=(x,y,text,color="#272a43")=>'<text x="'+x+'" y="'+y+'" fill="'+color+'" font-size="18" font-weight="650">'+escape(text)+'</text>';
  function focus(index,title,locked={},ids=null,defaults={}){
    const base=inherited[index], initial=Object.fromEntries(base.controls.map(control=>[control.id,control.value]));
    const controls=base.controls.filter(control=>ids?ids.includes(control.id):!Object.hasOwn(locked,control.id))
      .map(control=>Object.hasOwn(defaults,control.id)?{...control,value:defaults[control.id]}:control);
    const drag=controls.some(control=>control.id===base.draggable)?base.draggable:controls.find(control=>!control.options)?.id;
    return {...base,title,controls,draggable:drag,draw:s=>base.draw({...initial,...s,...locked})};
  }
  const read=(objective,lead,sections,math)=>({objective,lead,sections,math});
  const lab=(objective,lead,sections,lab,math)=>({objective,lead,sections,lab,math});
  const quiz=(objective,lead,sections,prompt,options,answers,feedback)=>({objective,lead,sections,quiz:{prompt,options,answers,feedback}});
  const quizList=(objective,lead,sections,items)=>({objective,lead,sections,quiz:{items}});
  const bridge=(selected)=>svg(
    '<path d="M32 98H598M541 98V194H112V112" fill="none" stroke="#777395" stroke-width="3"/>'+
    '<circle cx="112" cy="98" r="13" fill="white" stroke="#272a43" stroke-width="2"/>'+
    ['N(X)','G(s)'].map((item,i)=>'<rect x="'+(198+i*172)+'" y="71" width="125" height="54" rx="6" fill="'+(i===selected?"#e5e0fc":"#f2f2f8")+'" stroke="#676092"/>'+label(216+i*172,104,item)).join("")+
    label(34,82,"r(t)")+label(129,81,"e(t)")+label(547,82,"c(t)")+label(322,185,"单位反馈"),"非线性单环结构");
  const pendulum={
    title:"在平衡点附近轻推单摆",chartTitle:"相对所选平衡点的角位移",draggable:"kick",
    controls:[C("position","起始平衡",["下垂","倒立"]),R("kick","初始偏移",0,16,1,5,"°"),R("damping","阻尼",.1,.8,.05,.25)],
    draw(s){
      const start=s.position*Math.PI;
      let theta=start+s.kick*Math.PI/180,w=0;
      const data=rows(()=>{const y=(theta-start)*180/Math.PI;w+=M.dt*(-3.8*Math.sin(theta)-s.damping*w);theta+=M.dt*w;return {y};});
      const y=M.at(data,s.time).y,t=start+y*Math.PI/180,x=322+85*Math.sin(t),z=125+85*Math.cos(t);
      return {art:svg('<path d="M257 125H382" stroke="#8790a0" stroke-width="7"/><circle cx="322" cy="125" r="8" fill="#50586d"/>'+
        '<path d="M322 125L'+x+' '+z+'" fill="none" stroke="#56528c" stroke-width="6"/><circle cx="'+x+'" cy="'+z+'" r="18" fill="#dce0ea" stroke="#575785" stroke-width="2"/>'+
        label(34,60,s.position?"倒立平衡":"下垂平衡"),"受初始偏移的单摆"),
        chart:plot([series(data,"y","角位移",ink.teal)],s.time,{minSpan:s.position?30:5,unit:"角度 / °"}),
        readouts:readouts([["相对角位移",val(y,1)+"°"],["平衡点",s.position?"倒立":"下垂"]]),
        detail:panel("同一个摆的两个平衡点",s.position?"倒立的微小偏离会增长。":"下垂点附近的偏离在阻尼下衰减。"),
        note:note("用同一偏移对照两种初态，观察局部结论。")};
    }
  };
  const distortion={
    title:"让同一正弦通过两种关系",chartTitle:"输入与稳态输出",draggable:"amplitude",
    controls:[C("mode","关系",["线性","平方"],1),R("amplitude","输入振幅 X",.3,2,.05,1),R("frequency","角频率 ω",.6,4,.05,1.8," rad/s")],
    draw(s){
      const data=rows(t=>{const x=s.amplitude*Math.sin(s.frequency*t);return {x,y:s.mode?x*x:.72*x};});
      return {art:svg('<rect x="192" y="91" width="252" height="64" rx="7" fill="#ebe9f9" stroke="#6a6397"/>'+
        '<path d="M48 123H181M446 123H578" fill="none" stroke="#5f6480" stroke-width="3"/>'+label(222,132,s.mode?"y = x²":"y = 0.72x")+label(55,102,"正弦输入")+label(484,102,"输出"),"输入与非线性运算"),
        chart:plot([series(data,"x","输入",ink.target,true),series(data,"y","输出",ink.teal)],s.time,{low:-s.amplitude,high:Math.max(s.amplitude,s.amplitude**2),unit:"幅值"}),
        readouts:readouts([["直流",s.mode?val(s.amplitude**2/2):"0"],["输出频率",s.mode?"2ω":"ω"]]),
        detail:panel(s.mode?"产生了新频率":"频率保持",s.mode?"平方后的波形含直流分量；每个输入周期出现两个峰。":"线性关系把幅值缩放为输入的 0.72 倍，周期与输入相同。")};
    }
  };
  function relayN(X,a,m){
    if(X<a)return [0,0];
    const z=a/X, q=m*z;
    return [2/(Math.PI*X)*(Math.sqrt(Math.max(0,1-z*z))+Math.sqrt(Math.max(0,1-q*q))),
      2*a*(m-1)/(Math.PI*X*X)];
  }
  function relayLab(title,variant){
    const controls=[R("amplitude","正弦幅值 X",.4,3,.02,1.75)];
    if(variant==="special")controls.unshift(C("mode","继电器类型",["死区","滞环","理想"]));
    else controls.push(R("m","返回系数 m",-1,1,.05,.5));
    return {title,chartTitle:"正弦输入与继电器输出",controls,draggable:"amplitude",draw(s){
      const a=variant==="special"&&s.mode===2?0:1;
      const m=variant==="special"?[1,-1,0][s.mode]:s.m;
      const active=s.amplitude>=a, turns=2*Math.PI;
      const on=active?Math.asin(a/s.amplitude):0, off=active?Math.PI-Math.asin(m*a/s.amplitude):0;
      const impulse=angle=>angle>=on&&angle<off;
      const data=rows(t=>{
        const phase=(2.7*t)%turns, x=s.amplitude*Math.sin(phase);
        const opposite=(phase+Math.PI)%turns;
        const y=active?Number(impulse(phase))-Number(impulse(opposite)):0;
        return {x,y};
      });
      const px=x=>318+88*x,py=y=>125-65*y;
      const loop=data.filter(r=>r.t>=9).map((r,i)=>(i?"L":"M")+val(px(r.x),1)+" "+val(py(r.y),1)).join("");
      const [re,im]=relayN(s.amplitude,a,m);
      return {art:svg('<path d="M35 125H605M318 26V220" fill="none" stroke="#a7adc1" stroke-width="2"/>'+
        '<path d="'+loop+'" fill="none" stroke="#565092" stroke-width="3"/>'+
        label(556,151,"输入")+label(334,31,"输出"),"继电器在一个周期中的开关回线"),
        chart:plot([series(data,"x","输入",ink.target,true),series(data,"y","继电器",ink.teal)],s.time,{low:-Math.max(1,s.amplitude)-.2,high:Math.max(1,s.amplitude)+.2}),
        readouts:readouts(variant==="general"?[["吸合 a",a],["释放 ma",val(m*a)]]:[["Re N",val(re)],["Im N",val(im)]]),
        detail:panel(variant==="general"?"沿回线看吸合与释放":"观察复增益",s.amplitude<a?"输入幅值还未达到吸合阈值。":"切换阈值或返回系数，观察回线和输出相位。")};
    }};
  }
  const root=Math.sqrt(50), discriminant=8*Math.sqrt(16-Math.PI**2);
  const critical=[-discriminant,discriminant].map(d=>Math.sqrt((32+d)/Math.PI**2));
  const gainCurve="#226287", inverseCurve="#694e9a", highlight="#aa571b";
  const tx=x=>483+77*x, ty=y=>122-77*y;
  const sample=(fn,start,end,segments=160)=>Array.from({length:segments+1},(_,i)=>fn(start+(end-start)*i/segments));
  const pathData=points=>points.map(([x,y],i)=>(i?"L":"M")+val(tx(x),2)+" "+val(ty(y),2)).join("");
  const path=(points,color,width=2.7,dash=false)=>
    '<path d="'+pathData(points)+'" fill="none" stroke="'+color+'" stroke-width="'+width+'" stroke-linecap="round"'+(dash?' stroke-dasharray="5 4"':'')+'/>';
  const point=([x,y],color,r=6)=>
    '<circle cx="'+tx(x)+'" cy="'+ty(y)+'" r="'+r+'" fill="white" stroke="'+color+'" stroke-width="2.6"/>';
  const axisLabel=([x,y],text,color,dx=8,dy=-10)=>label(tx(x)+dx,ty(y)+dy,text,color);
  const graphic=(id,content,legend,alt)=>svg(
    '<defs><clipPath id="'+id+'"><rect x="45" y="27" width="563" height="191"/></clipPath></defs>'+
    '<rect x="45" y="27" width="563" height="191" rx="7" fill="#f7f7fc" stroke="#dedbea"/>'+
    '<path d="M45 122H608M483 27V218" stroke="#acacc2"/>'+
    [-5,-4,-3,-2,-1,0,1].map(x=>'<path d="M'+tx(x)+' 118v8" stroke="#acacc2"/>'+axisLabel([x,0],x,"#676783",-6,22)).join("")+
    '<g clip-path="url(#'+id+')">'+content+'</g>'+
    label(579,110,"Re","#64657d")+label(496,47,"Im","#64657d")+
    legend,alt);
  const inverseRelay=(X,a,m)=>{
    const [re,im]=relayN(X,a,m), d=re*re+im*im;
    return [-re/d,im/d];
  };
  const negativeInverse=kind=>({title:"沿负倒轨迹标出 X",timed:false,draggable:"amplitude",
    controls:[C("mode","元件",["理想继电器","死区继电器","滞环继电器"],kind),R("amplitude","振幅 X",1.005,5.005,.02,1.805)],
    draw(s){
      const a=s.mode===0?0:1,m=s.mode===2?-1:1;
      const inverse=X=>s.mode===0?[-Math.PI*X/4,0]:inverseRelay(X,a,m);
      const q=inverse(s.amplitude), fold=inverse(Math.SQRT2,1,1);
      const start=s.mode===0?0:s.mode===2?1:1.002;
      const full=sample(inverse,start,8), travelled=sample(inverse,start,s.amplitude);
      const [re,im]=relayN(s.amplitude,a,m);
      const lines=path(full,"#b6a7ca",3)+path(travelled,inverseCurve,3)+point(q,highlight)+
        (s.mode===1?point(fold,gainCurve,4):"");
      const marks=s.mode===1?axisLabel(fold,"折返点 X=√2",gainCurve,-103,42):"";
      const lead=s.mode===1?"X=√2 处分两支":s.mode===2?"整条轨迹的虚部都等于 −π/4":"沿负实轴向左";
      return {art:graphic("nl-relay",lines,marks+label(48,243,"紫线：由小振幅扫至当前 X",inverseCurve),"负倒描述函数轨迹和当前振幅点"),
        readouts:readouts([["Re",val(q[0])],["Im",val(q[1])],["|N(X)|",val(Math.hypot(re,im))]]),
        detail:panel(lead,s.mode===1?"先沿实轴向右，到极值 −π/2 后沿原来的实轴向左。":"拖振幅读取负倒值和描述函数自身的模。")};
    }});
  function linearResponse(K,w){
    const re=-.3*w*w, im=w*(1-.02*w*w), d=re*re+im*im;
    return [K*re/d,-K*im/d];
  }
  function nyquistLens(K){
    const at=w=>linearResponse(K,w);
    const positive=sample(r=>at(10**r),Math.log10(.7),2.5,380);
    const mirror=series=>series.map(([x,y])=>[x,-y]);
    const upper=sample(r=>at(root*10**r),0,2.4,260);
    const region=[...upper,[0,0],...mirror(upper).reverse()];
    return '<path d="'+pathData(region)+'Z" fill="#e5edf7"/>'+
      path(mirror(positive),gainCurve,2,true)+path(positive,gainCurve,3);
  }

  const evaluateCases={title:"定位包围区与两个交点",timed:false,draggable:"amplitude",
    controls:[C("case","相对位置",["不包围","被包围","两交点"],2),R("amplitude","振幅或示意参数 X",1.02,3.4,.02,1.58)],
    draw(s){
      const K=s.case===2?30:15, crossing=-K/15, inside=s.case===1;
      const bounded=t=>[-.5+.12*Math.cos(t),.05*Math.sin(t)];
      const position=inside?bounded((s.amplitude-1.02)/(3.4-1.02)*2*Math.PI):
        inverseRelay(s.amplitude,1,1);
      const locus=inside?path(sample(bounded,0,2*Math.PI),inverseCurve,3):
        path([[-5.8,0],[-Math.PI/2,0]],inverseCurve,3.5);
      const mark=[crossing,0], inRegion=position[0]>crossing;
      const isCrossing=Math.abs(position[0]-crossing)<1e-8;
      const activePoint=point(position,highlight);
      const inLabel=inside?"有界负倒轨迹（示意）":"死区继电器的负倒折返";
      const curveLabel=label(46,242,"蓝线：G(jω)（虚线为负频镜像）",gainCurve)+label(349,242,"紫线："+inLabel,inverseCurve);
      const graph=graphic("nl-cases",nyquistLens(K)+locus+point(mark,gainCurve,8)+activePoint,
        curveLabel+axisLabel(mark,"过实轴 "+crossing,gainCurve,18,-13),
        ["负倒轨迹位于包围区外","有界负倒轨迹位于包围区内","负倒轨迹穿过包围区边缘"][s.case]);
      const caption=inside?"有界示意曲线整体落入右侧蓝色包围区。":
        s.case===0?"折返最右到 −π/2，仍在交点 −1 左侧。":
        "两种振幅对应同一个复点：去程 Xᵦ≈"+critical[0].toFixed(3)+"，回程 Xₐ≈"+critical[1].toFixed(3)+"。在交点右侧，近似振幅增长，左侧衰减。";
      return {art:graph,
        readouts:readouts([["当前点实部",val(position[0])],["G 过负轴",crossing],["当前关系",isCrossing?"交点":inside||inRegion?"在包围区内":"在包围区外"],
          ...(s.case===2?[["候选角频率",val(root)+" rad/s"]]:[])]),
        detail:panel(["不包围：平衡稳定","被包围：等效闭环不稳定","一个复点，两种振幅"][s.case],caption)};
    }};

  const cycleCases={
    ...evaluateCases,title:"比较两种振幅的局部稳定性",
    controls:[C("point","振幅定位",["拖动振幅","较小候选 Xᵦ","较大候选 Xₐ"]),...evaluateCases.controls.slice(1)],
    draw(s){
      const x=s.point?critical[s.point-1]:s.amplitude;
      const base=evaluateCases.draw({amplitude:x,case:2});
      const description=s.point===1?"振幅减小使负倒点向左、在包围区外，振幅继续衰减；振幅增大使负倒点向右、进入包围区，振幅继续增大。":
        s.point===2?"振幅减小后负倒点进入包围区，振幅回升；振幅增大后负倒点离开包围区，振幅回落。":
        "两个候选的复平面坐标相同，但位于负倒折返的不同分支。可分别定位候选，检查增大和减小振幅时的趋向。";
      return {...base,detail:panel(s.point===1?"较小候选：局部不稳定":s.point===2?"较大候选：局部稳定":"一处复点，两种振幅",description)};
    }
  };
  const saturationN=X=>{
    if(X<=1)return 2;
    const r=1/X;
    return 4/Math.PI*(Math.asin(r)+r*Math.sqrt(1-r*r));
  };
  function saturationAmplitude(K){
    let lo=1,hi=K;
    for(let i=0;i<48;i++){
      const mid=(lo+hi)/2;
      if(saturationN(mid)>15/K)lo=mid;
      else hi=mid;
    }
    return (lo+hi)/2;
  }
  function saturationExperiment(page){
    const boundary=page===30;
    const controls = boundary?[R("K","增益 K",3,25,.05,7.5)]:[
      ...(page===29?[C("point","探针",["手动定位","理论交点"],1)]:[]),R("w","蓝点角频率 ω",2,16,.01,7.07," rad/s"),R("X","橙点振幅 X",.4,6,.01,page===28?1:2.48)
    ];
    return {title:{25:"按两条轨迹检查复数等式",28:"按已知结构建立两条轨迹",29:"用探针读出 X、ω",30:"移动 K 观察稳定性边界"}[page],
      timed:false,controls,draggable:boundary?"K":page===29?undefined:"X",draw(s){
        const K=boundary?s.K:15, w=boundary||s.point?root:s.w;
        const amp=boundary?(K>7.5?saturationAmplitude(K):1):s.point?saturationAmplitude(K):s.X;
        const crossing=-K/15, cut=[crossing,0], q=linearResponse(K,w), z=[-1/saturationN(amp),0];
        const exactBoundary=Math.abs(K-7.5)<1e-8, hasCycle=K>7.5&&!exactBoundary;
        const graph=graphic("nl-example",nyquistLens(K)+path([[-5.8,0],[-.5,0]],inverseCurve,3.5)+point([-.5,0],inverseCurve,4)+
          point(cut,gainCurve,9)+point(q,gainCurve,5)+point(z,highlight),
          axisLabel(cut,"交负实轴 "+val(crossing),gainCurve,-68,-15)+
          label(46,242,"蓝线：G(jω)",gainCurve)+label(329,242,"紫线：饱和负倒特性",inverseCurve),
          "线性部分 Nyquist 曲线与饱和负倒特性");
        const status=hasCycle?"相交：存在稳定周期候选":exactBoundary?"射线端点相交：小信号临界":"无交点：小信号平衡渐近稳定";
        const result=exactBoundary?"X≤1 时饱和元件处于线性区，等效增益均为 2。":hasCycle?"较大振幅扰动使负倒点左移到包围区外，较小扰动使点右移到包围区内。":"当前 G 实轴交点在负倒射线端点 −0.5 的右侧。";
        const values=boundary?[
          ["实轴交点",val(crossing,3)],["边界 K",7.5],["自振候选",hasCycle?"X≈"+val(amp,4):"—"]
        ]:[
          ["选中 ω",val(w,3)+" rad/s"],["选中 X",val(amp,3)],["两点间距",val(Math.hypot(q[0]-z[0],q[1]),4)]
        ];
        const activeRows=page===29?(s.point?["point"]:["point","w","X"]):undefined;
        return {art:graph,readouts:readouts(values),detail:panel(status,result),activeRows};
      }};
  }
  const relayFormula="N(X)=\\frac{2M}{\\pi X}\\left(\\sqrt{1-(a/X)^2}+\\sqrt{1-(ma/X)^2}\\right)+j\\frac{2Ma}{\\pi X^2}(m-1)";
  const saturationFormula="N(X)=\\frac{2k}{\\pi}\\left[\\arcsin(a/X)+(a/X)\\sqrt{1-(a/X)^2}\\right],\\quad X\\ge a";
  const theory=[
    ["稳定性","稳定性可能依赖初始状态与所处平衡点。"],
    ["频率畸变","非线性可能产生新的频率分量。"],
    ["自激振荡","无周期外激励时也可能出现由系统参数决定的周期运动。"]
  ];
  const method=[
    ["结构","可归并成线性部分和一个非线性部分串联的单回路。"],
    ["奇对称","保证正弦作用下的直流分量为零。"],
    ["低通","线性部分对高次谐波有足够衰减，基波近似才有用。"]
  ];
  const problem=[
    ["题设","单位负反馈。G(s)=K/[s(0.1s+1)(0.2s+1)]。饱和斜率 k=2，阈值 a=1。"],
    ["频率","虚部为零给出 ω=√50≈7.071 rad/s。交负实轴处 Re G=−K/15。"],
    ["振幅","K=15 时 N(X)=1，X≈2.4754。稍减 X，负倒点向右进入包围区，振幅增大；稍增 X，负倒点向左离开包围区，振幅衰减。由此得到局部稳定的自振候选。"],
    ["增益边界","K<7.5 无交点且小信号平衡渐近稳定；K=7.5 临界；K>7.5 有有限振幅候选。"]
  ];
  window.SourcePolishCh8={
    1:read("给第八章三个主题一个入口","从非线性特征出发，过渡到典型元件和描述函数。",[["本章顺序",["8.1 非线性系统概述","8.2 典型非线性环节","8.3 描述函数法"]]]),
    2:read("用导学区分识别、建模与求解任务","先辨认现象，再挑选模型，最后从交点求振幅和频率。",[["学习目标",theory.map(([a,b])=>a+"："+b)],["建模与判稳","读出死区、饱和、间隙和继电器的特性，检验描述函数法的使用条件，再用两条频率曲线分析。"],["课时","概述、典型环节各 1 学时，描述函数及稳定性分析 2 学时。"]]),
    3:read("标出概述小节的四步路线","认识非线性的三种后果。",[["客观存在","线性描述通常只对应一个有限工作区间。"],...theory]),
    4:lab("用幅值扫描看出小信号线性化的限度","同一饱和元件在小幅值下近似线性，越过阈值后叠加不成立。",[["常见来源",["死区、饱和、摩擦、磁滞、传动间隙。","含明显非线性而不能用单一局部线性模型时，选用非线性分析方法。"]]],focus(0,"拖振幅跨过饱和阈值")),
    5:lab("用同一装置的两种平衡点区分局部稳定性","相同的小扰动加在下垂点和倒立点，运动会怎样？",[["线性与非线性","线性定常系统的稳定性由结构和参数决定。非线性系统可能有多个平衡点，初态改变也可能改变长期行为。"],["单摆","下垂点局部稳定，有阻尼时回复；倒立点不稳定。"]],pendulum),
    6:lab("并列展示同频输出和平方后的二倍频","正弦输入的平方给出直流和 2ω 分量。",[["线性响应","正弦稳态输出保持频率，增益和相角由 G(jω) 决定。"],["非线性响应","平方是最简反例。频率成分增加，不能直接用线性传递函数描述。"]],distortion,["X^2\\sin^2\\omega t=\\frac{X^2}{2}(1-\\cos 2\\omega t)"]),
    7:lab("改变初始振幅以辨认稳定自振","在无周期外激励时，附近运动可能自发收敛到同一振幅。",[["自激","稳定的自持振荡由结构和参数决定；理想线性零阻尼振荡的振幅依赖初值。"],["工程应用","精密设备常需抑制；时钟和振荡器可利用。"]],focus(1,"自振与初幅",{mode:2})),
    8:quiz("用原四项检验非线性系统的特征","判断哪些现象是非线性允许的。",theory,"关于非线性系统的特征，下列说法正确的是？",
      ["可能存在多个平衡状态","稳定性只与结构参数有关，与初始条件无关","稳态输出只含与输入同频的分量","可能产生频率与振幅由自身决定的自激振荡"],[0,3],"非线性还可能产生直流或高次谐波，稳定性须结合平衡点与初态讨论。"),
    9:lab("让四种环节在同一输入下按特性对照","移动输入振幅，再换元件。",[["四类环节",["死区：阈值内无响应。","饱和：超过线性区后封顶。","间隙：换向先保持，再重新啮合。","继电器：按吸合和释放阈值切换。"]]],focus(2,"用同一正弦输入扫描四类特性")),
    10:lab("在死区边缘标出开始调节的阈值","|x₁|≤Δ 时没有输出，超过才以斜率 k 变化。",[["工程影响","死区可能扩大稳态误差；适当引入死区可以抑制小幅高频振荡和磨损。"]],focus(2,"输入穿越死区",{type:0}),["x_2=\\begin{cases}0,&|x_1|\\le\\Delta\\\\ k(x_1-\\Delta\\operatorname{sign}x_1),&|x_1|>\\Delta\\end{cases}"]),
    11:lab("把阈值 a 对到输出饱和值 ka","放大输入，观察超过 a 后输出不再升高。",[["影响","进入饱和后等效放大倍数降低，灵敏度和过渡速度会下降；限幅也可用来保护系统。"]],focus(2,"调阈值观察削顶",{type:1}),["x_2=k\\,\\min(a,\\max(-a,x_1))"]),
    12:lab("追踪换向时从动端停住的区段","输入从一个方向转向另一个方向，须经过 2b 才重新接合。",[["两种运动","啮合时 ẋ₂=kẋ₁，穿越间隙时 ẋ₂=0。"],["工程影响","间隙会恶化动态性能，增加振荡和静差。"]],focus(2,"观察间隙记忆回线",{type:2})),
    13:lab("让吸合与返回阈值随 m 改变","吸合阈值 a 与释放阈值 ma 决定开关回线。",[["返回系数","m=i₂/i₁，本章 m∈[−1,1]。一般 0<m<1，同时有死区和滞环；输出极值为±M。"]],relayLab("改变返回系数","general"),["m=\\frac{i_2}{i_1}"]),
    14:lab("切换三种特例并比对开关区间","m=1、m=−1 和 a=0 产生三种不同的回线。",[["三种特例",["m=1：只有死区，单值。","m=−1：非单值滞环。","a=0：过零即翻转，±M。"]]],relayLab("对照三种继电器","special")),
    15:read("标出描述函数小节的预备知识和计算路线","从基波投影到稳定性分析。",[["路线",["基波及谐波分析","典型描述函数表","使用条件","稳定性与自激振荡","例 8-1"]]]),
    16:lab("让同一输入同时显示完整波形与基波","保留输出的同频基波，把元件近似为随振幅变化的复增益。",[["信号链","给定经比较产生偏差，通过非线性环节与线性部分得到输出，单位反馈回到比较点。"]],{...focus(3,"保留基波"),draw(s){const out=inherited[3].draw(s);return {...out,art:bridge(0)};}}),
    17:lab("用输出波形、基波和复系数串起傅里叶计算","正弦投影 B₁ 和余弦投影 A₁ 分别给出同相与正交成分。",[["积分","奇对称特性时 A₀=0。Aₙ、Bₙ分别由 cos(nωt) 与 sin(nωt) 投影。"],["复增益","Y₁=√(A₁²+B₁²)，相位由 atan2(A₁,B₁) 决定。"]],focus(3,"测量基波系数"),["y_1=A_1\\cos\\theta+B_1\\sin\\theta,\\qquad N(X)=\\frac{B_1+jA_1}{X}"]),
    18:lab("在削顶波形上定位积分分界","X>a 时在 φ₁=arcsin(a/X) 之前线性，之后输出为 ka。",[["未饱和","X≤a 时 N(X)=k。"],["正弦投影","奇对称饱和的 A₁=0，在四分之一周期分段求 B₁。"]],focus(3,"饱和输出和它的基波",{type:1}),[saturationFormula]),
    19:lab("跟随继电器吸合和返回计算复描述函数","进入输出 M 的区间由 a 和 ma 两道阈值决定。",[["积分区间","0≤m≤1 时 φ₁=arcsin(a/X)，φ₂=π−arcsin(ma/X)。m<0 时保持跨过 π，按实际开关区间积分。"]],relayLab("读取继电器的实部和虚部","formula"),[relayFormula]),
    20:lab("将三个特例条件直接代入通式","死区与理想继电器给出实增益，滞环引入相位滞后。",[["三个取值","m=1 时虚部零；m=−1 时虚部 −4Ma/(πX²)；a=0 时 N=4M/(πX)。"]],relayLab("切换三个特例的 N(X)","special"),[relayFormula]),
    21:lab("区分负实轴折返和恒虚部轨迹","不要把 N(X) 和 −1/N(X) 的增减关系混在一起。",[["理想、死区、滞环","理想继电器沿负实轴；死区继电器在 X=√2a 折返；滞环轨迹的虚部为 −πa/(4M)。"]],negativeInverse(1),[
      "-\\frac{1}{N(X)}=-\\frac{\\pi X}{4M}\\quad\\text{（理想继电器）}",
      "-\\frac{1}{N(X)}=-\\frac{\\pi X}{4M\\sqrt{1-(a/X)^2}}\\quad\\text{（死区继电器，}X>a\\text{）}",
      "-\\frac{1}{N(X)}=-\\frac{\\pi X}{4M}\\sqrt{1-(a/X)^2}-j\\frac{\\pi a}{4M}\\quad\\text{（滞环继电器，}X\\ge a\\text{）}"
    ]),
    22:read("按元件类型检索表 8-1 并保留各自公式","先判元件的输入输出关系，再按有效振幅区间取式。",[["死区与饱和","死区在 X≥Δ 时 N=(2k/π)[π/2−arcsin(Δ/X)−(Δ/X)√(1−(Δ/X)²)]。饱和与之互补，使用 a 作为转折。"],["三种继电器","理想式 N=4M/(πX)；死区继电器取 m=1；滞环取 m=−1。一般情况下用通式，X≥a。"],["间隙","令 q=b/X。N=(k/π)[π/2+arcsin(1−2q)+2(1−2q)√(q(1−q))]+j(4kq/π)(q−1)，X≥b。"]],[saturationFormula,relayFormula]),
    23:read("以三条具体假设检查是否可用描述函数法","结构、直流和高次谐波分别检查。",method),
    24:quizList("检查串联、对称性和滤波三个条件","把三个条件一起带回结构图。",method,[
      {prompt:"线性部分 G(s) 与非线性部分 N(X) 怎样连接？",options:["并联","串联"],answers:[1],
        feedback:"两部分串联后组成单回路。"},
      {prompt:"哪种输入输出对称性可使正弦作用下的输出没有直流分量？",options:["奇对称","偶对称"],answers:[0],
        feedback:"奇对称时两半个周期的积分相互抵消，A₀=0。"},
      {prompt:"线性部分应具有哪种滤波效应，使描述函数近似更准确？",options:["低通滤波","高通滤波"],answers:[0],
        feedback:"线性部分对高次谐波充分衰减，闭环中便可主要考虑基波。"}
    ]),
    25:lab("把闭环特征式转化为复平面交点","两个曲线相同的位置只给周期解候选。",[["特征条件","1+N(X)G(jω)=0，等价于 G(jω)=−1/N(X)。"],["候选","振幅与角频率分别由两条轨迹的参数给出，随后检查振幅扰动方向。"]],saturationExperiment(25)),
    26:lab("对照不包围、包围、相交三种图解","相交说明可能有周期解，稳定性须接着讨论。",[["原例","K=30 时死区继电器的两种振幅同在复平面 (−2,j0)；Xᵦ≈1.11，Xₐ≈2.29，ω≈7.07 rad/s。"],["判稳前提","线性部分无右半平面极点，按完整 Nyquist 围线判断包围，且低通足以支持基波近似。"]],evaluateCases),
    27:lab("沿死区继电器折返两支检查扰动方向","较大振幅附近的两侧轨迹趋向候选，较小振幅附近相反。",[["几何与数值","G=30/[s(0.1s+1)(0.2s+1)]，交负轴 −2；负倒特性在 X=√2 处取最大值 −π/2。"],["稳定性","较大振幅约 2.29112 为局部稳定候选；较小振幅约 1.11146 为局部不稳定候选。近似判据不提供全局保证。"]],cycleCases,["\\pi^2 X^4-64X^2+64=0"]),
    28:lab("按例 8-1 的每个已知量建立两条轨迹","先画图，下一页再按频率与振幅分别求值。",[problem[0],["题目","K=15 时是否有自振？求振幅和角频率，再确定无自振的 K 范围。"]],saturationExperiment(28),[saturationFormula]),
    29:lab("从虚部过零与实部相等求两个参数","先令虚部为零得到 ω≈7.07，再求振幅。",problem.slice(1,3),saturationExperiment(29),["G(j\\omega)=\\frac{K}{-0.3\\omega^2+j\\omega(1-0.02\\omega^2)}"]),
    30:lab("拖动 K 越过射线端点","K=7.5 是临界，越过后才出现有限振幅候选。",[problem[3],["工程措施","减小 K 或实施串联校正，使两条轨迹分离。"]],saturationExperiment(30),["-K/15\\le-0.5\\iff K\\ge7.5"]),
    31:read("串起五条小结并保留例题数值","认识非线性、写特性、求基波、看相交、检查振幅扰动。",[...theory,["元件与判据","死区、饱和、间隙和继电器。用串联结构、奇对称和低通条件筛选后再画图。"],problem[2],problem[3]]),
    32:quizList("核对描述函数的自变量与自振性质","先判断描述函数以什么为自变量，再判断自振的性质。",[
      ["描述函数","本章典型元件的描述函数随输入幅值变化。动态非线性的描述函数也可能依赖频率。"]
    ],[
      {prompt:"本章典型非线性元件的描述函数 N(X) 是输入正弦信号哪个量的函数？",
        options:["振幅","频率","相位","初相"],answers:[0],feedback:"X 是输入振幅。对于本章典型元件，基波系数按 X 参数化。"},
      {prompt:"关于自激振荡，下列哪些说法正确？",
        options:["线性系统的零阻尼等幅振荡就是稳定自激振荡","振幅、频率由系统自身结构参数决定","自激振荡对系统总是有害的","自激振荡可能是稳定的极限环"],
        answers:[1,3],feedback:"理想线性零阻尼振荡的幅值由初态决定。时钟、振荡器等可利用由自身参数决定的稳定极限环。"}
    ]),
    33:read("把作业与方法步骤放在章末","从输入输出描述走向内部状态描述。",[["作业","写描述函数的定义及使用条件，列稳定性分析步骤，完成习题 8-4。"],["五步","求 N(X)，画两条曲线，判包围与相交，求 X 与 ω，判断自振稳定性。"],["后续","线性系统的状态空间分析。"]])
  };
})();
