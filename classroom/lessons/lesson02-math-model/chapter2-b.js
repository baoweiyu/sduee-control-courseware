"use strict";
(() => {
  const W=IntroWidgets,M=IntroModels,{range:R,choices:C,ink,readouts,plot,note,escape}=W;
  const base=window.CourseUnits?.[2];
  const legacy=number=>base?.groups.find(group=>group.source.includes(number))?.lab;
  const fmt=(value,digits=3)=>Number(value.toFixed(digits)).toString();
  const rows=fn=>Array.from({length:M.steps+1},(_,i)=>{const t=i*M.dt;return {t,...fn(t)};});
  const line=(series,key,label,color,dash=false)=>({series,key,label,color,dash});
  const panel=(title,body)=>'<section class="text-block"><h3>'+escape(title)+'</h3><p>'+escape(body)+'</p></section>';
  const svg=(label,body,viewBox="0 0 660 235")=>'<svg viewBox="'+viewBox+'" role="img" aria-label="'+escape(label)+'">'+body+'</svg>';
  const text=(x,y,label,color="#273747",size=20)=>'<text x="'+x+'" y="'+y+'" fill="'+color+'" text-anchor="middle" font-size="'+size+'" font-weight="620">'+escape(label)+'</text>';
  const block=(x,y,width,height,label,active=false)=>'<rect x="'+x+'" y="'+y+'" width="'+width+'" height="'+height+
    '" rx="8" fill="'+(active?"#e7e2f7":"#fafbfe")+'" stroke="'+(active?"#5c4c9b":"#91a0b6")+'"/>'+text(x+width/2,y+height/2+7,label);
  const path=(d,color="#435978",width=2.6)=>'<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="'+width+'" stroke-linecap="round" stroke-linejoin="round"/>';
  const arrow=(x,y,color="#435978")=>'<path d="M'+x+' '+y+'l-9 -5v10z" fill="'+color+'"/>';
  const dot=(x,y)=>'<circle cx="'+x+'" cy="'+y+'" r="4" fill="#435978"/>';
  const sum=(x,y)=>'<circle cx="'+x+'" cy="'+y+'" r="13" fill="#fff" stroke="#435978" stroke-width="2"/>'+text(x,y+6,"Σ","#435978",16);
  const rowGraphic=(labels,active=-1)=>{
    const width=labels.length>4?105:136,gap=(614-labels.length*width)/(labels.length-1);
    return svg(labels.join(" → "),labels.map((name,i)=>{
      const x=23+i*(width+gap);
      return block(x,88,width,52,name,i===active)+(i<labels.length-1?path("M"+(x+width)+" 114h"+gap)+arrow(x+width+gap,114):"");
    }).join(""));
  };
  function secondStep(t,w,z){
    if(Math.abs(z-1)<1e-6)return 1-(1+w*t)*Math.exp(-w*t);
    const d=Math.sqrt(Math.abs(1-z*z));
    if(z<1)return 1-Math.exp(-z*w*t)*(Math.cos(w*d*t)+z/d*Math.sin(w*d*t));
    const p=-w*(z-d),q=-w*(z+d);
    return 1-(q*Math.exp(p*t)-p*Math.exp(q*t))/(q-p);
  }

  const impulseProperties={
    title:"G(s) 的时间域指纹",chartTitle:"同一惯性环节的两种响应",
    controls:[C("mode","输入类型",["单位脉冲","单位阶跃"]),R("tau","时间常数 T",.45,3,.05,1," s"),R("gain","传递增益 K",.5,2.5,.05,1)],
    draggable:"tau",
    draw(s){
      const data=rows(t=>({y:s.mode?s.gain*(1-Math.exp(-t/s.tau)):s.gain/s.tau*Math.exp(-t/s.tau)}));
      return {art:rowGraphic([s.mode?"R(s)=1/s":"R(s)=1","K/(Ts+1)","C(s)"],1),
        chart:plot([line(data,"y",s.mode?"单位阶跃响应":"脉冲响应 g(t)",ink.teal)],s.time,{high:(s.mode?s.gain:s.gain/s.tau)*1.13,unit:"响应"}),
        readouts:readouts([["当前输出",fmt(M.at(data,s.time).y)],["环节极点",fmt(-1/s.tau)]]),
        detail:panel(s.mode?"C(s) = G(s)/s":"C(s) = G(s)","传递函数由系统自身确定，同一系统的不同输入只改变 C(s)。"),
        note:note("脉冲响应取 G(s) 的拉氏反变换；阶跃响应取 G(s)/s 的拉氏反变换。")};
    }
  };
  const formLab={
    ...legacy(19),title:"同一模型的两种写法",
    draw(s){
      const view=legacy(19).draw(s);
      const k=s.zero?s.gain*s.zero/s.tau:s.gain/s.tau;
      return {...view,detail:panel("零极点写法",s.zero?
        "G(s) = "+fmt(k)+"(s + "+fmt(1/s.zero)+")/(s + "+fmt(1/s.tau)+")。时间常数式 K = "+fmt(s.gain)+"。":
        "G(s) = "+fmt(k)+"/(s + "+fmt(1/s.tau)+")。此时分子没有有限零点。")};
    }
  };
  const stepPair=kind=>{
    const first=kind==="first";
    return {
      title:first?"立即复制与逐渐接近":"累加增长与衰减振荡",chartTitle:"同一单位阶跃下的输出",
      controls:[R("K","增益 K",.4,2,.05,1),R("T","时间常数 T",.4,2.6,.05,1," s"),
        ...(!first?[R("zeta","阻尼比 ζ",0,.95,.01,.35)]:[])],
      draggable:first?"T":"zeta",
      draw(s){
        const data=rows(t=>({u:1,a:first?s.K:s.K*t,b:first?s.K*(1-Math.exp(-t/s.T)):s.K*secondStep(t,1/s.T,s.zeta)}));
        const at=M.at(data,s.time);
        const names=first?["比例","惯性"]:["积分","振荡"];
        // For this pair the ramp can dominate the y range. The two actual values stay visible beside the plot.
        const maximum=(first?Math.max(1,s.K):Math.max(1,s.K*M.duration))*1.08;
        return {art:rowGraphic(["单位阶跃",first?"比例 / 惯性":"积分 / 振荡","输出"],1),
          chart:plot([line(data,"u","输入",ink.target,true),line(data,"a",names[0],ink.blue),line(data,"b",names[1],ink.teal)],s.time,{high:maximum,unit:"输出"}),
          readouts:readouts([[names[0],fmt(at.a)],[names[1],fmt(at.b)]]),
          detail:first?panel("三项对照","比例输出即 K；惯性输出在 t=T 时达到最终值的 63.2%。") :
            panel("留意阻尼 ζ",s.zeta===0?"ζ=0 会保持等幅振荡。":"0<ζ<1 的振荡逐步衰减。积分输出的斜率为 K。"),
          note:note(first?"保持 K 不变，拖动时间常数看惯性响应速度。":"试把 ζ 调到零：振荡不再衰减。")};
      }
    };
  };
  const derivativeLab={
    title:"辨认导数项和纯延迟",chartTitle:"阶跃与普通函数部分",
    controls:[C("kind","环节",["理想微分","一阶微分","二阶微分","纯延迟"]),R("tau","时间参数 τ",.3,3,.05,1," s"),R("gain","比例系数 K",.5,2,.05,1)],
    draggable:"tau",
    draw(s){
      const delay=s.kind===3, pure=s.kind===0, second=s.kind===2;
      const data=rows(t=>({u:1,y:delay?Number(t>=s.tau):pure?0:s.gain}));
      const expression=["Ks","K(τs+1)","K(τ²s²+2ζτs+1)","e^(−τs)"][s.kind];
      const regular=delay?"原波形向右平移":pure?"t>0 时为零":"t>0 时等于 K";
      const impulse=delay?"无脉冲":second?"δ 系数 "+fmt(s.gain*s.tau)+"，δ′ 系数 "+fmt(s.gain*s.tau**2):
        "δ 面积 "+fmt(s.gain*(pure?1:s.tau));
      const art=delay?rowGraphic(["输入 r(t)","延迟 τ","r(t−τ)"],1):
        svg("冲激项在跃变时刻",path("M76 163H610 M145 176V56")+arrow(613,163)+
          path("M162 161V57",ink.teal,4)+text(222,55,pure?"Kδ(t)":second?"δ(t) 与 δ′(t)":"Kτδ(t)",ink.teal,19)+
          (!pure?path("M166 108H601",ink.blue,2)+text(495,94,"普通阶跃项",ink.blue,18):"")+
          text(146,196,"跃变时刻")+" "+text(615,194,"t"));
      return {art,chart:plot([line(data,"u","输入",ink.target,true),line(data,"y",delay?"延迟输出":"普通函数部分",ink.teal)],s.time,
        {high:Math.max(1,s.gain)*1.13,unit:"幅值",...(delay?{event:s.tau}:{})}),
        readouts:readouts([["环节",delay?"e^(−τs)":expression],["跃变项",impulse]]),
        detail:panel(regular,delay?"延迟保留波形和幅值。":"箭头标识冲激项，普通坐标曲线只画 t>0 的函数；二阶演示取 ζ=0.5。"),
        activeRows:delay?["tau"]:pure?["gain"]:["tau","gain"],
        note:note("切换环节，区分阶跃跃变处的集中项与波形平移。")};
    }
  };
  const quiz24=[
    ["1）传递函数完全由系统结构和参数确定；2）传递函数与输入和初始条件有关。",["1 正确、2 不正确","1 不正确、2 正确","两项都正确","两项都不正确"]],
    ["传递函数只表明输入与输出的动态联系，不能反映内部信息。",["对","不对"]]
  ];
  const rlcLab={
    title:"串联 RLC 取电容端输出",chartTitle:"零初值下的电容电压",
    controls:[R("r","电阻 R",.35,3,.05,1," Ω"),R("l","电感 L",.5,2,.05,1," H"),R("c","电容 C",.3,1.2,.05,.5," F")],
    draggable:"r",
    draw(s){
      const z=s.r*.5*Math.sqrt(s.c/s.l),w=1/Math.sqrt(s.l*s.c);
      const data=rows(t=>({u:1,y:secondStep(t,w,z)}));
      const art=svg("串联电阻、电感和电容，电容两端为输出",path("M72 111H163 M165 111l12 -13 12 26 12 -26 12 26 12 -26 12 26 12 -13 H304")+
        path("M304 111q12 -28 24 0q12 -28 24 0q12 -28 24 0q12 -28 24 0 H529 V136 M510 136H548 M510 149H548 M529 149V195H72 V111")+
        dot(529,111)+dot(529,195)+path("M529 111H603 M529 195H603","#6154a0",2)+
        text(104,157,"uᵢ",ink.blue,18)+text(207,83,"R",ink.target,19)+text(353,83,"L",ink.target,19)+
        text(496,151,"C",ink.target,19)+text(598,162,"uₒ","#6154a0",19));
      return {art,chart:plot([line(data,"u","输入",ink.target,true),line(data,"y","电容输出",ink.teal)],s.time,{high:1.93,unit:"V"}),
        readouts:readouts([["LC",fmt(s.l*s.c)],["RC",fmt(s.r*s.c)],["阻尼比",fmt(z)]]),
        detail:panel("分压比","电容阻抗 1/(Cs) 除以总阻抗 R+Ls+1/(Cs)，与零初值微分方程所得结果一致。"),
        note:note("提高串联电阻或改变电感、电容，观察同一单位阶跃下的阻尼变化。")};
    }
  };
  const opampLab={
    title:"反相输入与并联反馈阻抗",chartTitle:"反相输出的阶跃响应",
    controls:[R("r1","输入电阻 R₁",.5,3,.1,1," kΩ"),R("r2","反馈电阻 R₂",.5,3,.1,1.4," kΩ"),R("c","反馈电容 C",.2,2,.05,.6," mF")],
    draggable:"r2",
    draw(s){
      const k=s.r2/s.r1,tau=s.r2*s.c;
      const data=rows(t=>({u:1,y:-k*(1-Math.exp(-t/tau))}));
      const gray="#415571",accent="#6154a0";
      const art=svg("反相运放，电阻 R₂ 与电容 C 并联反馈",path("M42 125H110 M110 125l12 -11 12 22 12 -22 12 22 12 -22 12 22 12 -11 H273 M273 125H330 M273 125V39H363 M273 79H382")+
        path("M330 107L330 187 427 147z M427 147H596 M330 164H303 V188 M289 188H317 M294 195H312 M299 202H307")+
        path("M363 39l12 -10 12 20 12 -20 12 20 12 -20 12 20 12 -10 H514 V147 M382 79H405 M405 64V94 M420 64V94 M420 79H514",accent)+
        dot(273,125)+dot(514,147)+arrow(593,147)+text(50,107,"uᵢ",gray,19)+text(151,103,"R₁",gray,19)+
        text(402,25,"R₂",accent,18)+text(412,110,"C",accent,18)+text(346,131,"−",gray,17)+
        text(345,171,"+",gray,17)+text(595,132,"uₒ",gray,19));
      return {art,chart:plot([line(data,"u","输入",ink.target,true),line(data,"y","反相输出",ink.teal)],s.time,{low:-k*1.11,high:1.13,unit:"V"}),
        readouts:readouts([["直流增益",fmt(-k)],["时间常数",fmt(tau)+" s"],["当前输出",fmt(M.at(data,s.time).y)+" V"]]),
        detail:panel("反相与虚地","理想负反馈工作区内 u₊≈u₋=0，输入脚电流为零。因此 i₁=i₂，G(s)=−Z₂/Z₁。"),
        note:note("增加 R₂ 会同时增大直流增益的绝对值和反馈时间常数。")};
    }
  };
  const speedLabels=["给定 uᵣ","运放Ⅰ","运放Ⅱ","功率放大","直流电机","测速机"];
  function speedFrame(stage=-1,symbol=false){
    const names=symbol?["G₁","G₂","G₃","Gᵤ"]:speedLabels.slice(1,5);
    const x=[117,237,357,477], y=94, w=92, h=47;
    const top=x.map((left,i)=>block(left,y,w,h,names[i],stage===i+1)).join("");
    const lines=[25,93,209,329,449,569,606].map((from,i)=>{
      const dest=[66,117,237,357,477,583,638][i];
      return path("M"+from+" 118H"+dest)+arrow(dest,118);
    }).join("");
    const hold=stage===0?"#6154a0":"#435978",branch="#6154a0",dist="#a85e30";
    return svg("给定、负反馈与电机的两路输入",lines+top+sum(80,118)+sum(594,118)+dot(623,118)+
      text(32,101,"uᵣ",hold,18)+text(97,152,"−",branch,15)+text(631,101,"n",hold,18)+
      path("M623 118V205H455 M280 205H80V132",branch)+block(280,185,175,39,symbol?"G𝒇":"测速发电机",stage===5)+
      text(173,192,"u_f",branch,16)+
      text(303,41,"负载 m𝒸",dist,17)+path("M359 53H394 M543 53H594V104",dist)+arrow(394,53,dist)+
      block(394,33,149,40,symbol?"Gₘ":"电机扰动通道",stage===4),"0 0 660 238");
  }
  function speedOverview(){
    const relation=window.katex.renderToString(String.raw`T_e=K_t i_a`,{throwOnError:true});
    const feedback="#6154a0",load="#a85e30";
    const compact=svg("速度负反馈回路",text(150,20,"给定电压 uᵣ")+path("M150 26v20")+sum(150,60)+
      path("M150 74v15 M150 124v16 M150 175v16 M150 226v16 M150 277v21 M150 325v24")+
      ["运放Ⅰ","运放Ⅱ","功率放大","直流电机"].map((name,i)=>block(80,89+i*51,140,35,name,i===3)).join("")+
      sum(150,312)+text(149,370,"转速 n")+path("M150 337H37V60H136",feedback)+
      block(2,180,70,34,"测速机")+text(112,51,"−",feedback)+
      text(266,233,"负载力矩",load,15)+path("M266 239v16 M266 289v23H164",load)+block(222,255,88,34,"扰动通道")+
      '<path d="M145 344l5 9 5-9z" fill="#435978"/>'+arrow(136,60,feedback)+
      '<path d="M173 307l-9 5 9 5z" fill="#a85e30"/>',"0 0 316 378");
    return '<div class="speed-sheet"><figure><figcaption>速度负反馈回路</figcaption><div class="speed-wide">'+speedFrame(4)+'</div><div class="speed-narrow">'+compact+'</div></figure>'+
      '<section><h2>电流怎样产生转矩？</h2><div class="torque-relation">'+relation+'</div><p>磁通恒定时，电枢电流产生与其成正比的电磁转矩。电磁转矩克服负载后，净转矩决定转速怎样变化。</p>'+
      '<h3>沿反馈支路读图</h3><p>测速发电机把转速变为反馈电压，与给定电压相减，形成送入运放的误差。</p></section></div>';
  }
  const speedTf={
    title:"在选定频率核对两种闭环入口",timed:false,draggable:"frequency",
    controls:[C("channel","选择输入",["给定电压","负载力矩"]),R("frequency","角频率 ω",.1,5,.1,1," rad/s")],
    draw(s){
      const w=s.frequency,ta=.35,tm=1.1,T=.8,tau=.55,k0=2.5,kf=.8,km=.7;
      const real=k0*kf-tm*T*w*w, imag=(T+k0*kf*tau)*w-ta*tm*T*w**3;
      const den=Math.hypot(real,imag);
      const value=s.channel?km*T*w*Math.hypot(1,ta*w)/den:k0*Math.hypot(1,tau*w)/den;
      return {art:speedFrame(s.channel?4:0,true),readouts:readouts([["作用入口",s.channel?"负载":"给定"],["分母模值",fmt(den)],["幅值比",fmt(value)]]),
        detail:panel(s.channel?"扰动传递函数":"给定传递函数",s.channel?"分子含 −KₘTs(Tₐs+1)，出自把 Gₘ/(1+G₁G₂G₃GᵤG𝒇) 通分。":"分子为 K₀(τs+1)。调频率时两种入口继续共享同一分母。"),
        note:note("交替切换入口。两种输入分别求闭环响应后，可按叠加原理求总输出。")};
    }
  };
  const symbols=["方框","信号线","相加点","分支点"];
  const elementsLab={
    title:"给同一个数，比较四种图元",timed:false,draggable:"value",
    controls:[C("kind","四种图元",symbols),R("value","输入 X₁",.2,3,.1,1.4)],
    draw(s){
      const x=s.value,b=.8;
      const base=path("M52 111H290 M331 111H611")+arrow(611,111)+text(78,94,"X₁",ink.blue,19);
      const bodies=[
        rowGraphic(["X(s)","G(s)","Y(s)"],1),
        svg("信号沿箭头传输",base+path("M290 111H331")+text(544,94,"X₁")),
        svg("相加点输出 X₁−X₂",base+sum(311,111)+path("M311 182V125",ink.orange)+text(311,215,"X₂",ink.orange,18)+
          text(286,94,"+",ink.blue,17)+text(333,149,"−",ink.orange,17)+text(537,94,"X₁−X₂")),
        svg("分支复制同一信号",base+path("M290 111H331 M311 111V185H611",ink.teal)+dot(311,111)+
          arrow(611,185,ink.teal)+text(541,94,"X₁")+text(541,169,"X₁",ink.teal))
      ];
      const values=[2*x,x,x-b,x], explanations=[
        "示意中取 G=2，输出为 2X₁。","箭头表方向，同一信号线上的数值相同。",
        "图示负号对应第二路输入，输出为 X₁−0.8。","两路均为 X₁，分支点只引出信号。"
      ];
      return {art:bodies[s.kind],readouts:readouts([["输入 X₁",fmt(x)],["输出",fmt(values[s.kind])]]),detail:panel(symbols[s.kind],explanations[s.kind]),
        note:note("切换图元，重点比较相加点的代数运算与分支点的信号复制。")};
    }
  };
  const construction={
    title:"逐步画成同一系统方框图",timed:false,
    controls:[C("step","绘图步骤",["画各部分","按信号连接","用环节符号简记"])],
    draw(s){
      const components=speedLabels.slice(1,5).map((name,i)=>block(38+155*i,48,131,47,name,true)).join("");
      const art=s.step?speedFrame(-1,s.step===2):svg("各部分方框，与下面两路分组",components+
        block(116,145,174,47,"负载通道 Gₘ",true)+block(370,145,174,47,"反馈通道 G𝒇",true));
      return {art,readouts:readouts([["阶段",(s.step+1)+" / 3"]]),
        detail:panel(["先列各环节","按信号关系连接","改成标准环节符号"][s.step],
          ["确定比较、校正、放大、电机的电压通道和负载通道，以及测速反馈。","Gₘ 的输出在电机电压通道的输出端前相加，测速信号从转速引回。","G₁、G₂、G₃、Gᵤ、Gₘ、G𝒇 分别代替各传递函数；连接关系一致。"][s.step]),
        note:note("切换到第二步，检查同一电机的扰动从哪一点进入。")};
    }
  };
  const rulesLab={
    ...legacy(31),title:"两类等效变换共用同一核对口径",draggable:"gain",
    controls:[C("node","变换方式",["环节的合并","信号点的移动"]),R("gain","环节 G",.2,4,.05,1.7),R("x","输入信号",.2,3,.05,1)],
    draw(s){
      const a=s.gain*s.x,b=a/s.gain;
      return {art:s.node?rowGraphic(["原信号 x","Gx","补 1/G","仍取 x"],2):rowGraphic(["输入 x","环节 G","环节 H","合并 GH"],3),
        readouts:readouts(s.node?[["移动前",fmt(s.x)],["移动后",fmt(b)]]:[["环节 1",fmt(s.gain)],["环节 2","2"],["乘积",fmt(2*s.gain)]]),
        detail:panel(s.node?"节点移动":"环节合并",s.node?"支路必须继续得到原信号。这里沿信号方向跨过 G，补入 1/G。":"图示为串联，令 H=2。并联和反馈也可用它们各自的等效规则合并。"),
        note:note("任何合法变换都要保持前向通道、回路中的传递函数乘积。")};
    }
  };
  const connectionLab={
    ...legacy(32),title:"合并串联、并联与反馈联接",
    controls:[C("topology","连接",["串联","并联","负反馈"]),C("merge","呈现",["原结构","合并成一个环节"]),
      R("a","前向环节 G",.1,3,.05,1.2),R("b","另一环节 H",.1,3,.05,.6)],
    draw(s){
      const original=legacy(32).draw(s);
      const value=[s.a*s.b,s.a+s.b,s.a/(1+s.a*s.b)][s.topology],form=["GH","G+H","G/(1+GH)"][s.topology];
      return {...original,art:s.merge?rowGraphic(["R",form,"C"],1):original.art,
        detail:panel(s.merge?"等效结构":"原结构","单位输入下的示意输出为 "+fmt(value)+"。"+
          ["串联须无级间负载效应。","并联支路应按相加点标记作代数和。","正反馈时分母改为 1−GH。"][s.topology])};
    }
  };
  const rules33={
    title:"用数字检验换位是否等效",timed:false,draggable:"value",
    controls:[C("kind","节点组合",["相邻相加点","相邻分支点","相加点与分支点"]),C("move","观察",["移动前","直接互换"]),R("value","原信号 x",.4,4,.1,2)],
    draw(s){
      const x=s.value;const a=[x+1-.4,x,s.move?x+1:x][s.kind];
      const order=s.kind===0?(s.move?["x","−0.4","＋1","输出"]:["x","＋1","−0.4","输出"]):
        s.kind===1?(s.move?["x","分支 b","分支 a","输出"]:["x","分支 a","分支 b","输出"]):
          (s.move?["x","加入 1","分支取值","输出"]:["x","分支取值","加入 1","输出"]);
      return {art:rowGraphic(order,2),readouts:readouts([["检验值",fmt(a)]]),
        detail:panel(s.kind===2?"异类直接换位会改变关系":"同类相邻可以合并或换序",
          ["加减同为代数运算，换序后总和相同。","相邻分支在同一信号线上取得相同的 x。","分支从相加点之前移到之后时，直接取得了 x+1；必须加补偿才能仍取 x。"][s.kind]),
        note:note("对照移动前后的加入量或引出量是否相同。")};
    }
  };
  const rules34={
    title:"把 H₂ 的引出点移过 G₄",timed:false,draggable:"gain",
    controls:[C("state","分支位置",["原图 · a","移动到 b","省略补偿的反例"]),R("gain","环节 G₄",.3,3,.05,1.8),R("x","框前信号 a",.2,4,.05,1.4)],
    draw(s){
      const before=s.x,after=s.x*s.gain,branch=s.state===2?after:before;
      const ctrl="#5d499b", pass="#435978", target=s.state===0?384:538;
      const boxes=[["G₁",83],["G₂",197],["G₃",311],["G₄",425]].map(([name,x])=>block(x,77,64,42,name,name==="G₄")).join("");
      const art=svg("三反馈支路中仅移动 H₂ 的引出点",path("M30 98H613",pass)+arrow(613,98)+boxes+
        text(33,80,"R")+text(613,80,"C")+dot(384,98)+dot(538,98)+text(384,75,"a",ctrl)+text(538,75,"b",ctrl)+
        path("M538 98V246H48 V98 M538 214H183 V98",pass,2)+block(281,230,87,31,"H₁")+block(321,198,87,31,"H₃")+
        path("M"+target+" 98V164H266 V98",ctrl,3)+dot(target,98)+block(279,147,69,33,"H₂",true)+
        (s.state===1?block(389,147,82,33,"1/G₄",true):""),"0 0 660 270");
      return {art,readouts:readouts([["a",fmt(before)],["b=G₄a",fmt(after)],["进入 H₂",fmt(branch)]]),
        detail:panel(["引出点在 G₄ 前","前移后补 1/G₄","核对反例"][s.state],
          ["H₂ 取 a；H₁、H₃ 仍从输出端取信号。","移动到 b 后先乘 1/G₄，进入 H₂ 的信号还等于 a。","省略补偿，进入 H₂ 的是 b=G₄a，通常与 a 不同。"][s.state]),
        note:note("沿信号方向跨过 G，支路串 1/G；逆向跨过 G，支路串 G。")};
    }
  };

  const pages={
    18:{
      objective:"以六项性质为阅读区，用同一一阶环节切换脉冲与阶跃验证第六条。",
      lead:"传递函数反映线性定常系统的零状态输入输出特性。",
      sections:[
        ["适用条件",["按课件讨论线性定常系统，定义以零初始状态为前提。","只描述所选输入输出，无法唯一反映系统内部。"]],
        ["由系统决定",["由系统结构和参数确定，与外部输入以及实际运行的初值无关。","常规的有限维可实现集中参数模型可写成有理真分式，严格真分式 n>m，同阶允许直接通道。理想微分和纯延迟属于本章另行列出的理想环节。"]],
        ["脉冲验证","输入取单位脉冲时 R(s)=1，于是 C(s)=G(s)，输出即脉冲响应 g(t)。"]
      ],
      math:[String.raw`G(s)=\mathcal{L}\{g(t)\},\quad g(t)=\mathcal{L}^{-1}\{G(s)\}`],
      lab:impulseProperties
    },
    19:{
      objective:"并列展示同一参数在两种表示中的含义，再拖动零点对照等效表达。",
      lead:"零极点式强调根的位置，时间常数式把每个一阶因子整理成常数项为 1 的形式。",
      sections:[
        ["零极点表示","zⱼ 为分子零点，pᵢ 为分母极点，K₁=b₀/a₀ 为传递系数。"],
        ["时间常数表示","对非零实根，Tᵢ=−1/pᵢ，τⱼ=−1/zⱼ。提取常数项后，放大系数 K=K₁∏(−zⱼ)/∏(−pᵢ)。"],
        ["一般因子","原点极点单独写作 1/s^ν，共轭复根成对写作实系数二次因子，其余实根用一阶因子。"]
      ],
      math:[String.raw`G(s)=K_1\frac{\prod_j(s-z_j)}{\prod_i(s-p_i)}=K\frac{\prod_j(\tau_js+1)}{\prod_i(T_is+1)}`,
        String.raw`G(s)=\frac{K}{s^\nu}\frac{\prod_j(\tau_js+1)\prod_k(\tau_k^2s^2+2\zeta_k\tau_k s+1)}{\prod_i(T_is+1)\prod_l(T_l^2s^2+2\zeta_lT_ls+1)}`],
      lab:formLab
    },
    20:{
      objective:"保留判断题；答后用 RLC、机械和电机三种端口模型解释固定系数下可同构。",
      lead:"物理参数可以不同，归一化后的输入输出方程可以等效。",
      sections:[["解释","RLC、电机和弹簧质量阻尼装置可出现同型二阶模型。只有归一化后的对应系数和输入输出定义匹配时，传递函数才相同。"]],
      quiz:{prompt:"物理性质不同的系统，完全可以有相同的传递函数。（　）",options:["对","不对"],answers:[0],
        feedback:"匹配输入输出关系后，不同物理系统可以具有完全相同的传递函数。"}
    },
    21:{
      objective:"同一给定下并置两条阶跃曲线，直观显示比例变化与惯性滞后。",
      lead:"比例环节立即改变幅值，惯性环节需要时间趋向相同的稳态值。",
      sections:[["比例","c(t)=Kr(t)，G(s)=K。单位阶跃输出立即为 K。"],["惯性","T·dc/dt+c=Kr(t)，G(s)=K/(Ts+1)。单位阶跃输出为 K(1−e^(−t/T))。"]],
      math:[String.raw`G_1(s)=K,\quad G_2(s)=\frac{K}{Ts+1},\quad c_2(t)=K\left(1-e^{-t/T}\right)`],lab:stepPair("first")
    },
    22:{
      objective:"同步比较积分斜坡与欠阻尼响应，单独调阻尼让衰减条件可见。",
      lead:"积分会持续累加阶跃输入，振荡环节的衰减取决于阻尼比。",
      sections:[
        ["积分","零初值下，c(t)=K∫r(t)dt，G(s)=K/s。单位阶跃产生斜坡 Kt。"],
        ["振荡","二阶方程为 T²c″+2ζTc′+c=Kr。自然频率 ωₙ=1/T。0<ζ<1 欠阻尼，单位阶跃波形衰减并趋近 K；ζ=0 产生等幅振荡。"],
        ["极点","p₁,₂=−ζωₙ±jωₙ√(1−ζ²)，虚部给出振荡频率。"]
      ],
      math:[String.raw`G_I(s)=\frac{K}{s},\quad G_2(s)=\frac{K}{T^2s^2+2\zeta Ts+1}=\frac{K\omega_n^2}{s^2+2\zeta\omega_ns+\omega_n^2}`],lab:stepPair("second")
    },
    23:{
      objective:"把分布量与可画出的阶跃响应分开，切换比较理想微分、含微分项和纯迟延。",
      lead:"微分描述输入变化，迟延使全部波形向右平移。",
      sections:[
        ["三种微分",["理想 c=Kr′，G=Ks。阶跃产生 Kδ(t)。","一阶 c=K(τr′+r)，G=K(τs+1)。阶跃包含面积 Kτ 的脉冲和 K 的阶跃。","二阶 c=K(τ²r″+2ζτr′+r)，G=K(τ²s²+2ζτs+1)。阶跃含 Kτ²δ′、2Kζτδ 和 K 的阶跃。"]],
        ["纯延迟","c(t)=r(t−τ)，G(s)=e^(−τs)。波形保持，整体滞后 τ。"],
        ["六种典型模型","比例、惯性、积分、振荡、微分和延迟。"]
      ],
      math:[String.raw`G_D(s)=Ks,\quad G_{D1}(s)=K(\tau s+1),\quad G_{D2}(s)=K(\tau^2s^2+2\zeta\tau s+1),\quad G_\tau(s)=e^{-\tau s}`],lab:derivativeLab
    },
    24:{
      objective:"保留原页的一道单选和一道判断，学生可独立核对每道题。",
      lead:"检查传递函数的决定因素，以及它所能描述的系统信息。",
      sections:[["① 单选题",quiz24[0][0]],["② 判断题",quiz24[1][0]],["计分","每题 1 分。第一题四选一，第二题判断正误。"]],
      quiz:{items:quiz24.map(([prompt,options],i)=>({prompt,options,answers:[0],feedback:i?"传递函数描述外部输入输出关系。":"传递函数按零初始条件定义，由给定端口的系统结构和参数决定。"}))}
    },
    25:{
      objective:"以电容分压电路为可操作主图，分别呈现微分方程和复阻抗两条推导链。",
      lead:"串联 RLC 取电容两端为输出，复阻抗法和微分方程法得到同一传递函数。",
      sections:[
        ["复阻抗对照",["电阻：交流阻抗和复阻抗均为 R。","电感：交流阻抗 jωL，拉氏域复阻抗 sL。","电容：交流阻抗 1/(jωC)，拉氏域复阻抗 1/(sC)。"]],
        ["方法一","从 LCuₒ″+RCuₒ′+uₒ=uᵢ 出发，零初值拉氏变换后解出 Uₒ/Uᵢ。"],
        ["方法二","按分压关系，Z₁=R+Ls，Z₂=1/(Cs)，G=Z₂/(Z₁+Z₂)。乘上 Cs 就回到同一个分母。"]
      ],
      math:[String.raw`G(s)=\frac{U_o(s)}{U_i(s)}=\frac{1/(Cs)}{R+Ls+1/(Cs)}=\frac{1}{LCs^2+RCs+1}`],lab:rlcLab
    },
    26:{
      objective:"将反相运放的电流路径和 R₂∥C 画成电路，调反馈参数对照负阶跃和时间常数。",
      lead:"反相端近似虚地，输入阻抗和并联反馈阻抗决定输出的符号与动态。",
      sections:[
        ["理想条件","理想运放处于负反馈线性工作区，同相端接地，u₊≈u₋≈0，输入端电流为零。于是 i₁=i₂。"],
        ["阻抗","Z₁=R₁，Z₂=R₂∥1/(Cs)=R₂/(R₂Cs+1)。"],
        ["结论","G=−Z₂/Z₁，其中 K=R₂/R₁、τ=R₂C。负号表示反相。"]
      ],
      math:[String.raw`G(s)=-\frac{R_2/R_1}{R_2Cs+1}=-\frac{K}{\tau s+1}`],lab:opampLab
    },
    27:{
      objective:"从速度闭环图辨认电流到转矩的转换、测速反馈和负载入口。",
      lead:"测速机将转速换成反馈电压；给定电压和负载力矩分别进入不同通道。",
      sections:[
        ["给定与放大",["电位器输出给定电压 uᵣ。","运放Ⅰ G₁ 比例放大误差，运放Ⅱ G₂ 作校正，功率放大器 G₃ 驱动电枢。"]],
        ["对象与反馈",["直流电动机的电压通道 Gᵤ 输出转速 n；负载力矩 m𝒸 单独作用于电机。","测速发电机 G𝒇 以反馈电压 u_f 闭合速度回路。"]]
      ],staticBody:speedOverview
    },
    28:{
      objective:"用测速闭环的双入口作为主图，对照五个环节的表达式和两路共享分母的来源。",
      lead:"给定和负载是两个输入。分别固定另一输入为零后求传递函数，两条通道共享闭环特征多项式。",
      sections:[
        ["五个环节",["G₁=U₁/Uₑ=−R₁/R₀=K₁，Uₑ=Uᵣ−U_f。","运放Ⅱ的 PI 校正为 G₂=(τs+1)/(Ts)。","功率放大器 G₃=K₂，测速反馈 G𝒇=K_f。","电机的电压通道 Gᵤ=Kᵤ/Dₘ，负载通道 Gₘ=−Kₘ(Tₐs+1)/Dₘ，Dₘ=TₐTₘs²+Tₘs+1。"]],
        ["合成", "K₀=K₁K₂Kᵤ。给定通道分子为 K₀(τs+1)，负载通道分子为 −KₘTs(Tₐs+1)，共同分母 D=TsDₘ+K₀K_f(τs+1)。"],
        ["公式校核", "由 Φₘ=Gₘ/(1+G₁G₂G₃GᵤG𝒇) 同乘 TsDₘ，负载分子须带 Ts。"]
      ],
      math:[String.raw`D(s)=T_aT_mTs^3+T_mTs^2+(T+K_0K_f\tau)s+K_0K_f`,
        String.raw`\Phi_u(s)=\frac{K_0(\tau s+1)}{D(s)},\qquad\Phi_m(s)=\frac{-K_mTs(T_as+1)}{D(s)}`],lab:speedTf
    },
    29:{
      objective:"四种图元逐个切换，同一个输入验证方框乘法、相加点运算和分支复制。",
      lead:"方框图用函数关系和箭头组织信号流；相加点和分支点承担不同的运算职责。",
      sections:[
        ["方框与信号线",["方框表示环节，框内写传递函数。","箭头表示信号方向，线上标注信号。"]],
        ["相加点", "输入按进入侧的正负号作代数和，例如 X₁−X₂。"],
        ["分支点", "从同一处引出多路，各路取得相同原信号。"]
      ],lab:elementsLab
    },
    30:{
      objective:"按例 2-9 的三步依次展示元件、连接和标准符号，定位电机两输入的合成点。",
      lead:"先画各部分，再按信号关系连接，最后以 G₁、G₂、G₃、Gᵤ、Gₘ、G𝒇 简记。",
      sections:[
        ["第一步","列出两个运放、功率放大器、电机电压与扰动通道、测速发电机的传递函数。"],
        ["第二步","将 Uᵣ 与 U_f 相减得到 Uₑ，依次得到 U₁、U₂、Uₐ，电机从两输入得到 N。M𝒸 经 Gₘ 在电机输出端前的相加点注入。"],
        ["第三步","保持连线，换成标准环节符号。方框图本身也是模型，可继续变换求传递函数。"]
      ],lab:construction
    },
    31:{
      objective:"把两类变换放在操作开关上，用数值验证变换前后的数学关系。",
      lead:"等效化简包括环节合并和信号点移动，前向通道及回路的乘积必须对应相等。",
      sections:[
        ["两类变换",["将串联、并联和反馈环节合为一个环节。","移动引出点或相加点，使方框图便于继续合并。"]],
        ["保持两项乘积",["前向通道中传递函数的乘积保持不变。","回路中传递函数的乘积保持不变。"]],
        ["目标","将复杂图化为一个等效环节，读出 Φ(s)=C(s)/R(s)。"]
      ],lab:rulesLab
    },
    32:{
      objective:"三种连接分别可切换为单一等效框，实时核对示意数值和反馈正负号。",
      lead:"串联相乘，并联按符号相加，负反馈分母为 1+GH。",
      sections:[
        ["串联与并联",["无级间负载效应时，串联 n 个环节的传递函数为各项之积。","并联各支路按汇合点的正负号代数相加。"]],
        ["负反馈和正反馈","负反馈 Φ=G/(1+GH)，正反馈 Φ=G/(1−GH)。嵌套结构先处理内环。"],
        ["反馈术语","负反馈时 E=R−B，正反馈时 E=R+B，H=1 为单位反馈。GH=B/E 是回路传递函数；G=C/E 是前向通道。"]
      ],
      math:[String.raw`C=EG=(R-CH)G\quad\Longrightarrow\quad\Phi(s)=\frac{C(s)}{R(s)}=\frac{G(s)}{1+G(s)H(s)}`],lab:connectionLab
    },
    33:{
      objective:"提供同类与异类节点的换位动作，让相同或变化的支路数值直接可比较。",
      lead:"相邻同类节点可换序或合并；异类节点跨越时需要补偿。",
      sections:[
        ["相邻相加点","按代数符号求和，可交换次序或合并成一个相加点。"],
        ["相邻分支点","同一信号线上的分支取出同一信号，因此可交换次序或合并。"],
        ["异类换位","直接互换可能改变加入或引出的信号；需要补等效环节让移动前后的实际信号相同。"]
      ],lab:rules33
    },
    34:{
      objective:"只移动原图中的 H₂ 引出点，跟踪 a、b 与 H₂ 输入，加入省略补偿的对照。",
      lead:"分支点顺信号方向跨过 G₄ 后，支路要串 1/G₄ 才能继续取得原信号 a。",
      sections:[
        ["原图","G₁ 至 G₄ 串联。H₂ 从 G₄ 前方 a 取出，H₁ 和 H₃ 仍取自输出端。"],
        ["前移","引出点移动到 G₄ 后的 b，b=aG₄。将 1/G₄ 串在新支路，进入 H₂ 的信号仍为 a。"],
        ["反向规则","逆信号方向跨过 G 时，支路串 G；任何情况下，原支路的实际输入需要保持相同。"]
      ],
      math:[String.raw`b=aG_4,\qquad b\frac{1}{G_4}=a`],lab:rules34
    }
  };
  window.SourcePolishCh2 ??= {};
  Object.assign(window.SourcePolishCh2,pages);
})();
