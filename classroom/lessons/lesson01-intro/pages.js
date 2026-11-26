"use strict";
const IntroPages = (() => {
  const M=IntroModels, W=IntroWidgets, G=IntroRigs;
  const {range:R,choices:C,ink,readouts,note,plot,escape} = W;
  const data = window.introSourceData;
  const round=(value,n=1)=>value.toFixed(n);
  const trace=(series,key,label,color,dash=false)=>({series,key,label,color,dash});
  const traceResponse=(a,s,unit="%", high=100, event)=>plot(a,s.time,{high,unit,event});
  const arr = (entries)=>'<ol class="path-list">'+entries.map((text,i)=>'<li><span>'+String(i+1).padStart(2,"0")+'</span>'+escape(text)+'</li>').join("")+'</ol>';
  function text(heading,copy,emphasis){
    const body=emphasis ? copy.split(emphasis).map((part,index)=>index%2
      ? '<strong class="definition-emphasis">'+escape(part)+'</strong>' : escape(part)).join("") : escape(copy);
    return '<section class="text-block"><h3>'+escape(heading)+'</h3><p>'+body+'</p></section>';
  }
  const selected = (label,text)=>'<div class="selected-result"><strong>'+escape(label)+'</strong><p>'+escape(text)+'</p></div>';
  const driver = (target=70)=>[R("target","目标转速",35,95,1,target," %"),R("load","负载扰动",0,55,1,28," %"),R("when","施加时刻",0.8,9,.2,3," s")];
  const timings = [
    ["气动减速","约 4.7 km/s 进入火星大气，依靠气动阻力大幅降速。"],
    ["伞系减速","打开降落伞继续减速，速度降到约 100 m/s 量级后进入动力段。"],
    ["动力减速","反推发动机工作，进入动力减速段。"],
    ["着陆缓冲","约 100 m 高度悬停避障，随后缓速下降，由着陆腿缓冲触地。"]
  ];
  const sensors = [
    ["激光雷达（LiDAR）","三维点云感知、精确建图与障碍物检测"],
    ["摄像头（Camera）","车道线识别、目标检测、交通标志识别"],
    ["毫米波雷达（Radar）","中远距离目标检测、测速、全天候环境感知"],
    ["超声波雷达（USS）","近距障碍物检测、泊车辅助与低速防撞"],
    ["GNSS / IMU","高精度定位、姿态与速度估计，位置与航向解算"],
    ["车载计算平台","多传感器融合、感知算法处理与决策支持"]
  ];
  const words = [
    ["给定量","系统输出量的要求值。","比较"],["被控量","被控系统所控制的物理量。","被控对象"],
    ["反馈量","与输出成正比或成某种函数关系，与给定量有相同量纲和数量级的信号。","测量"],
    ["偏差量","给定量与主反馈量之差。","比较"],["控制量","作用于被控对象的信号。","执行"],
    ["扰动量","对系统输出量有不利影响的输入量。","扰动"],["被控对象","被控制的机器、设备或生产过程。","被控对象"]
  ];

  function steps(items,index=0) {
    return '<ol class="steps">'+items.map((item,i)=>'<li class="'+(i===index?"active":"")+'"><i>'+String(i+1).padStart(2,"0")+'</i><span>'+escape(item)+'</span></li>').join("")+'</ol>';
  }
  const plotShape=(x,y,w,h,stroke)=>'<path d="M'+x+' '+(y+h)+'V'+y+'M'+x+' '+(y+h)+'h'+w+'" fill="none" stroke="'+stroke+'" stroke-width="1.4"/>';
  function classroomGoal(s) {
    const x0=53,x1=328,y0=193,y1=27;
    const y=value=>y0-(y0-y1)*value/100;
    const ticks=[0,25,50,75,100].map(value=>
      '<path d="M'+x0+' '+y(value)+'H'+x1+'" stroke="#d1dfed"/>'+
      '<text x="44" y="'+(y(value)+4)+'" text-anchor="end" fill="#496682" font-size="12">'+value+'</text>'
    ).join("");
    return '<svg viewBox="0 0 352 217" role="img" aria-label="垂直拖动给定线调整目标值">'+
      '<rect x="2" y="2" width="348" height="213" rx="8" fill="#edf6fc"/>'+
      ticks+'<path d="M'+x0+' '+y1+'V'+y0+'H'+x1+'" fill="none" stroke="#91abc2" stroke-width="1.4"/>'+
      '<text x="328" y="19" text-anchor="end" fill="#496682" font-size="12">%</text>'+
      '<path d="M'+x0+' '+y(s.target)+'H'+x1+'" stroke="#087764" stroke-width="2.4" stroke-dasharray="6 4"/>'+
      '<circle cx="288" cy="'+y(s.target)+'" r="9" fill="#fbfdff" stroke="#087764" stroke-width="2.5"/></svg>';
  }
  function classification(s) {
    const {command,type,sample,ports}=s;
    let shape=["M44 129h42V65h143","M44 97q23-47 46 0t46 0t46 0t47 0","M44 130h45v-31h45v-35h48v-25h47"][command];
    const inCount=ports?2:1, y=sample?["20","48","78","106","133"]:null;
    if (y) shape=y.map((_,i)=>"M"+(59+i*34)+" 147v-"+(command===0?(i<1?18:86):command===1?[41,70,30,86,48][i]:20+i*25)).join("");
    return '<svg viewBox="0 0 560 205" role="img" aria-label="随给定类型、数学性质、采样和通道改变的结构图">'+plotShape(44,37,190,110,"#96aac2")+
      '<path d="'+shape+'" fill="none" stroke="#19796b" stroke-width="3"/><rect x="279" y="53" width="130" height="93" rx="8" fill="#e1eef8" stroke="#537a9e"/>'+
      '<text x="344" y="81" text-anchor="middle" font-size="20" fill="#204d77">'+(type?"非线性":"线性")+'</text>'+
      '<path d="M313 131v-35m0 35h65" fill="none" stroke="#7e9ab1"/><path d="'+(type?"M313 131l27-24h38":"M313 131l62-34")+'" fill="none" stroke="#167f70" stroke-width="2.5"/>'+
      Array.from({length:inCount},(_,i)=>'<path d="M238 '+(88+i*28)+'h39m133 0h88" stroke="#417c9d" stroke-width="3"/><circle cx="501" cy="'+(88+i*28)+'" r="4" fill="#417c9d"/>').join("")+
      '<text x="342" y="176" text-anchor="middle" font-size="16" fill="#526d86">'+(sample?"离散时间":"连续时间")+'</text></svg>';
  }
  function illustrative(svg,caption){
    return '<figure class="course-image"><svg viewBox="0 0 320 120" role="img" aria-label="'+escape(caption)+'" fill="none" stroke="#46819a" stroke-width="3">'+svg+'</svg><figcaption>'+escape(caption)+'</figcaption></figure>';
  }
  const aircraft=()=>illustrative('<rect x="13" y="10" width="294" height="101" rx="9" fill="#ecf5fa" stroke="none"/><path d="M45 85q111-115 232 0" stroke-dasharray="5 5"/><path d="M143 62 68 86l-5-11 77-29 12-27 16 0 14 27 71 29-5 10-72-22-7 23h-18z" fill="#d7e8f2"/><circle cx="161" cy="40" r="4" fill="#438295"/>',"无人机 · 自主飞行场景");
  const erasGraphics=[
    '<path d="M30 101h260M160 18v79M142 34h36M160 35l-64 56m64-56 64 56M137 82h46"/><circle cx="94" cy="85" r="14" fill="#d8ad76"/><circle cx="226" cy="85" r="14" fill="#d8ad76"/><path d="M112 30q48-24 96 0" stroke-dasharray="4 4"/>',
    '<path d="M26 91h267M36 98V22M40 82C70 82 81 24 109 43s54 27 77 12 33-7 58-7h45"/><path d="M40 50h248" stroke-dasharray="5 4" stroke="#ae6c4c"/>',
    '<path d="M29 102h254M78 102V79h44v23M101 78l64-43 58 20 28 21m-28-21 33-16m-5 37 19 5m-14-42 17-5" stroke-width="8"/><circle cx="165" cy="35" r="9" fill="#daf0eb"/><circle cx="223" cy="55" r="8" fill="#daf0eb"/>'
  ];
  function motorScheme(closed){
    const id="motor-signal", y=82;
    const lead=(x0,y0,x1,y1,feedback=false)=>'<path d="M'+x0+' '+y0+'L'+x1+' '+y1+'" fill="none" stroke="'+
      (feedback?"#087c67":"#131d3b")+'" stroke-width="2.4" marker-end="url(#'+id+(feedback?"-return":"-forward")+')"/>';
    const block=(x,y,w,name,active=false)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="56" rx="1" fill="'+
      (active?"#e4f2ee":"#f7f9fd")+'" stroke="'+(active?"#087c67":"#131d3b")+'" stroke-width="'+(active?3:2)+'"/>'+
      '<text x="'+(x+w/2)+'" y="'+(y+37)+'" text-anchor="middle">'+name+'</text>';
    return '<section class="motor-scheme"><h2>'+(closed?"闭环":"开环")+'控制系统结构图</h2>'+
      '<svg viewBox="14 24 620 180" role="img" aria-label="'+(closed?"带测速负反馈的控制结构":"没有测速反馈的控制结构")+'">'+
      '<defs><marker id="'+id+'-forward" viewBox="0 0 10 10" markerWidth="5" markerHeight="5" refX="9" refY="5" orient="auto"><path d="M0 0 10 5 0 10z" fill="#131d3b"/></marker>'+
      '<marker id="'+id+'-return" viewBox="0 0 10 10" markerWidth="5" markerHeight="5" refX="9" refY="5" orient="auto"><path d="M0 0 10 5 0 10z" fill="#087c67"/></marker></defs>'+
      '<g class="model-math">'+lead(27,y,closed?99:207,y)+(closed?lead(127,y,207,y):"")+lead(313,y,377,y)+lead(483,y,618,y)+
      '<text x="33" y="68">r</text><text x="605" y="68">y</text>'+
      (closed?'<circle cx="113" cy="82" r="16" fill="#f7f9fd" stroke="#131d3b" stroke-width="2"/><text x="80" y="67">+</text><text x="88" y="116">−</text><text x="153" y="68">e</text>'+
        '<path d="M534 82V167H113V101" fill="none" stroke="#087c67" stroke-width="3" marker-end="url(#'+id+'-return)"/>'+block(270,139,106,"H(s)"):"")+
      block(207,54,106,"C(s)",true)+block(377,54,106,"G(s)")+'</g></svg></section>';
  }
  const motorPage={
    title:"直流电机与测速装置",chartTitle:"转速响应对比",visual:"motor",draggable:"load",backdrop:"../../../assets/classroom/motor-bench.webp",
    controls:[...driver(),C("loop","观察路径",["开环","闭环"],1)],
    draw(s) {
      const a=M.drive(s,"open"),b=M.drive(s,"closed"),reading=M.at(s.loop?b:a,s.time);
      return {
        art:G.motor(reading,s.load,s.time),
        chart:traceResponse([trace(a,"target","目标",ink.target,true),trace(a,"y","开环",ink.orange),trace(b,"y","闭环",ink.teal)],s,"转速 / %",100,s.when),
        readouts:readouts([["开环",round(M.at(a,s.time).y)+"%"],["闭环",round(M.at(b,s.time).y)+"%"],["负载扰动",s.time>=s.when?"已施加":"未施加"]]),
        detail:motorScheme(s.loop),
        note:note(s.loop?"测速反馈把转速偏差送回控制器，抵消一部分负载影响。":"开环的输入只随给定变化，负载改变后没有转速反馈。")
      };
    }
  };
  const topologyMetrics=[
    ["定义","无反馈的控制方式","利用反馈信号的控制方式","前馈与反馈相结合"],
    ["优点","结构简单、成本低","精度高、抗扰能力强","抗扰强、响应快、性能优"],
    ["缺点","精度低、抗扰差","结构复杂、可能不稳定","设计较复杂、实现成本高"],
    ["抗扰性","★","★★★★","★★★★★"],["精度","★","★★★★","★★★★★"],["复杂度","★","★★★★","★★★★★"]
  ];
  const classificationControls=[
    C("command","给定信号",["恒值","随动","程序控制"]),
    C("type","数学描述",["线性","非线性"]),
    C("sample","时间信号",["连续","离散"]),
    C("ports","输入输出数量",["单输入单输出","多输入多输出"])
  ];
  const sequenceSpecs = {
    8:{
      title:"拖动给定线",chartTitle:"从给定到输出",visual:"setpoint",controls:[R("target","给定",15,100,1,69," %")],
      draggable:{id:"target",vertical:true},
      draw(s){
        const x=M.command(s),state=M.at(x,s.time);
        return {art:classroomGoal(s),chart:traceResponse([trace(x,"r","给定",ink.target,true),trace(x,"y","被控量",ink.teal)],s),
          readouts:readouts([["给定",round(state.r)+"%"],["被控量",round(state.y)+"%"]]),
          detail:text("控制器 · 被控对象 · 被控量",data.definition,/(无人直接参与|控制器|被控对象|预先规定的规律|被控量|预定要求)/)+'<details class="lesson-outline"><summary>本章主要内容</summary>'+arr(data.outline)+'</details>',
          note:note("给定变化后，观察被控量什么时候开始变、怎样接近给定。")};
      }
    },
    9:{
      title:"恒温箱与加热器",chartTitle:"设定与实际温度",visual:"thermal",draggable:"door",
      controls:[R("target","设定温度",35,65,1,50," °C"),R("door","开门角度",0,90,1,35,"°"),
        R("ambient","环境温度",14,34,1,22," °C"),R("thermalLoad","负载散热",0,12,1,3)],
      draw(s,{low=15,high=70}={}){
        const samples=M.thermal(s),point=M.at(samples,s.time);
        return {art:G.incubator(point,point.angle),chart:plot([trace(samples,"target","设定",ink.target,true),trace(samples,"temperature","实测",ink.teal)],s.time,{low,high,minSpan:4,unit:"°C",event:2,compact:true}),
          readouts:readouts([["实测",round(point.temperature)+" °C"],["偏差",round(point.error)+" °C"],["加热功率",round(point.power/3.1*100,0)+"%"]]),
          detail:'<h2>闭环控制方框图</h2>'+G.feedback("closed","测量","0 44 659 147"),
          note:note("拖动箱门比较散热。环境温度、开门散热和负载变化都可能造成偏差。")};
      }
    },
    10:{
      title:"浮子、连杆与阀门",chartTitle:"液位与流量响应",visual:"water",draggable:"outlet",backdrop:"../../../assets/classroom/tank-bench.webp",
      controls:[R("outlet","出水阀开度",5,95,1,62," %")],
      draw(s){
        const samples=M.hydraulic(s),point=M.at(samples,s.time);
        const levels=samples.map(r=>r.h*100);
        const low=Math.floor((Math.min(...levels)-4)/5)*5,high=Math.ceil((Math.max(...levels)+4)/5)*5;
        const flows=samples.flatMap(r=>[r.qIn,r.qOut]);
        const flowMin=Math.max(0,Math.floor((Math.min(...flows)-.015)/.025)*.025);
        const flowMax=Math.ceil((Math.max(...flows)+.015)/.025)*.025;
        const onLeftAxis=q=>low+(q-flowMin)*(high-low)/(flowMax-flowMin);
        const chart=samples.map(r=>({...r,h:r.h*100,inletPosition:onLeftAxis(r.qIn),outletPosition:onLeftAxis(r.qOut)}));
        const traces=[trace(chart,"h","液位（左轴）",ink.teal),trace(chart,"inletPosition","进水（右轴）",ink.orange),trace(chart,"outletPosition","出水（右轴）",ink.blue)];
        return {art:G.tank(point,s.outlet),chart:plot(traces,s.time,{low,high,unit:"液位 / %",event:2,rightAxis:{low:flowMin,high:flowMax,unit:"流量 / L/s"}}),
          readouts:readouts([["液位",round(point.h*100)+"%","level"],["进水",round(point.qIn,3)+" L/s","inlet"],["出水",round(point.qOut,3)+" L/s","outlet"]]),
          detail:"",note:note("液位下降 → 浮子下降 → 进水阀开大。出水阀施加的变化与浮子反馈相互作用。")};
      }
    },
    11:motorPage,
    12:{
      title:"坡度 · 节气门 · 轮速",chartTitle:"上坡前后车速",visual:"cruise",draggable:"angle",
      controls:[R("target","设定车速",45,110,1,83," km/h"),R("angle","道路坡度",0,16,1,8,"°")],
      draw(s){
        const x=M.drive({target:s.target,load:s.angle*2.25,when:3},"closed"),p=M.at(x,s.time);
        return {art:G.road({angle:s.angle,t:s.time,y:p.y,u:Math.min(200,p.u)}),chart:plot([trace(x,"target","设定车速",ink.target,true),trace(x,"y","实测车速",ink.teal)],s.time,{minSpan:5,unit:"km/h",event:3}),
          readouts:readouts([["轮速换算",round(p.y)+" km/h"],["速度偏差",round(p.error)+" km/h"]]),
          detail:steps(["设定目标速度","轮速传感器与 ABS 模块向 ECU 提供反馈","ECU 控制节气门和自动变速箱","调整车辆速度"],s.time<3?0:p.error>.8?2:3),
          note:note("找一找车辆、车速、轮速传感器和节气门分别在回路的哪里。")};
      }
    },
    13:{
      title:"扰动补偿与反馈路径",chartTitle:"残余偏差",draggable:"feed",
      controls:[R("load","可测扰动",0,50,1,26," %"),R("feed","前馈补偿比例",0,135,1,70," %"),R("when","施加时刻",1,9,.2,2.6," s")],
      draw(s){
        const input={...s,target:75},a=M.drive(input,"closed"),b=M.drive(input,"compound"),p=M.at(b,s.time);
        return {art:G.feedback("compound",p.correction?"执行":"测量"),chart:traceResponse([trace(a,"target","目标",ink.target,true),trace(a,"y","单纯反馈",ink.orange),trace(b,"y","复合控制",ink.teal)],s,"输出 / %",100,s.when),
          readouts:readouts([["前馈量",round(p.correction)],["反馈量",round(p.returnSignal)],["剩余偏差",round(p.error)]]),
          detail:text("先补偿，再纠偏","前馈及时抵消可测扰动，反馈继续调节残余偏差。代价是增加测量和前馈通道。"),note:note("把补偿比例拖到匹配点，再继续拉过匹配点，观察偏差大小和方向。")};
      }
    },
    14:{
      title:"按同一维度比较",chartTitle:"同工况三类响应",visual:"compare",
      controls:[R("metric","比较指标",0,5,1,3),R("load","共享扰动",0,55,1,26," %")],
      draw(s){
        const input={target:74,when:3,load:s.load,feed:76};
        const a=M.drive(input,"open"),b=M.drive(input,"closed"),c=M.drive(input,"compound");
        const [metric,...contents]=topologyMetrics[s.metric];
        const topology = '<div class="topologies">'+["开环","闭环","复合"].map((name,i)=>'<section><h3>'+name+'</h3>'+G.topology(["open","closed","compound"][i])+'<p>'+escape(contents[i])+'</p></section>').join("")+'</div>';
        return {art:topology, chart:traceResponse([trace(a,"y","开环",ink.orange),trace(b,"y","闭环",ink.blue),trace(c,"y","复合",ink.teal)],s,"输出 / %",100,3),
          readouts:readouts([["正在比较",metric]]),note:note("星级表示定性比较。响应来自同一个示意对象和同一次外扰。")};
      }
    },
    15:{
      title:"按节点读完整回路",chartTitle:"给定与被控量",visual:"signals",draggable:"signal",
      controls:[R("signal","信号节点",0,6,1,0),R("target","给定量",30,90,1,70," %"),R("load","扰动量",0,55,1,22," %")],
      draw(s){
        const a=M.drive({...s,when:3},"closed"),p=M.at(a,s.time),[name,meaning,node]=words[s.signal];
        const values=[p.target,p.y,p.y,p.error,p.u,p.d,p.y];
        return {art:G.feedback("closed",node),chart:traceResponse([trace(a,"target","给定量",ink.target,true),trace(a,"y","被控量",ink.teal)],s,"输出 / %",100,3),
          readouts:readouts([[name,s.signal===6?"受控装置":round(values[s.signal])+"%"]]),detail:selected(name,meaning),
          note:note("同一回路中，给定量与主反馈量可相减，控制量作用在被控对象上。")};
      }
    },
    16:{
      title:"当前系统示意",visual:"classify",timed:false,
      controls:classificationControls,
      draw(s){
        const labels=classificationControls.map(({id,label,options})=>[label,options[s[id]]]);
        return {art:classification(s),readouts:readouts(labels),
          detail:testClassification(s),note:note("同一个系统可以在四个维度各占一个位置。本课程主要研究恒值、线性、连续、单输入单输出系统。")};
      }
    },
    17:{
      title:"性能试验",chartTitle:"同一时刻的响应比较",visual:"performance",topControls:true,hideArt:true,
      controls:[C("mode","性能",["稳","快","准"],1),R("damping","阻尼",-.35,1.2,.01,.42),R("speed","时间尺度",.45,5,.05,1.05," s"),R("tracking","跟踪能力",.35,2.5,.05,1.3)],
      draw(s){
        const x=M.performance(s),p=M.at(x,s.time);
        const desc=["系统必须稳定，动态过程平稳。","响应动作快，过渡过程短。","跟踪值准确，稳态误差小。"][s.mode];
        const annotations=s.mode===1?[
          {series:x,key:"y",t:1.6,label:s.speed<3.2?"响应较快":s.speed>3.2?"响应较慢":"响应重合",color:ink.teal,offset:[38,-47]},
          ...(s.speed===3.2?[]:[{series:x,key:"baseline",t:3.85,label:s.speed<3.2?"参照较慢":"参照较快",color:ink.blue,offset:[76,44]}])
        ]:[];
        return {chart:plot([trace(x,"r","给定",ink.target,true),trace(x,"y",s.mode===1?"可调响应":"可调系统",ink.teal),trace(x,"baseline","参照响应",ink.blue)],s.time,
          {low:s.mode===0?-1:0,high:s.mode===0?3:s.mode===1?1.2:3.3,unit:"相对值",annotations}),
          readouts:readouts([["响应",round(p.y,2)],["跟踪误差",round(p.r-p.y,2)]]),
          detail:'<p class="performance-condition">'+(s.mode===2?"同一斜坡输入":"同一目标")+'<span aria-hidden="true">✓</span></p><p class="performance-verdict">'+escape(desc)+'</p>',
          activeRows:["damping","speed","tracking"].slice(s.mode,s.mode+1),
          note:note(s.mode===0?"把阻尼拖到零附近，并观察正负两侧的差别。":s.mode===1?"保持目标不变，只调时间尺度来比较响应快慢。":"两条曲线跟随相同斜坡，比较和给定之间的持续距离。")};
      }
    },
    18:{
      title:"设计过程",chartTitle:"以验证结果回看设计",
      controls:[IntroWidgets.stages("phase","工程阶段",["系统分析","系统设计","实验仿真","控制实现"]),R("target","目标水平",40,90,1,74," %"),R("gain","待选时间参数",.4,3.5,.1,1.3," s")],
      draw(s){
        const shape=M.performance({mode:1,speed:s.gain}).map(r=>({...r,r:s.target,y:r.y*s.target}));
        const v=M.at(shape,s.time);
        return {art:IntroWidgets.stepList(["系统分析","系统设计","实验仿真","控制实现"],s.phase),chart:traceResponse([trace(shape,"r","要求",ink.target,true),trace(shape,"y","响应",ink.teal)],s),
          readouts:readouts([["检测时刻",round(s.time)+" s"],["实际值",round(v.y)+"%"],["达目标的九成",v.y>=.9*s.target?"已达到":"尚未达到"]]),
          detail:selected(["系统分析","系统设计","实验仿真","控制实现"][s.phase],["建立模型，分析稳定性、动态与稳态性能。","确定结构与参数，选择校正方案。","仿真验证设计结果。","工程实现与调试运行。"][s.phase]),
          note:note("在满足给定性能要求的基础上跟踪输入信号，并具有一定抗干扰能力。")};
      }
    },
    19:{
      title:"天问一号 · 全自主着陆",visual:"landing",timed:false,draggable:"phase",
      controls:[R("phase","着陆阶段",0,3,1,0)],
      draw(s){const [stage,detail]=timings[s.phase];return {art:G.landing(s.phase),readouts:readouts([["当前阶段",stage]]),
        detail:steps(timings.map(x=>x[0]),s.phase)+selected(stage,detail)+aircraft(),
        note:note("阶段游标为离散示意。约九分钟的进入、下降和着陆过程由机载系统自主完成。")};}
    },
    20:{
      title:"目标与车载感知",visual:"sensors",timed:false,draggable:"position",
      controls:[R("kind","传感器 / 平台",0,5,1,0),R("position","目标相对位置",-90,90,1,31),R("heading","车辆姿态",-42,42,1,0,"°")],
      draw(s){const [id,meaning]=sensors[s.kind];return {art:G.sensor(s),readouts:readouts([["当前",id]]),
        detail:selected(id,meaning)+arr(sensors.map(x=>x[0])),note:note("扇形和方向为示意，用来观察目标位置与各类感知功能的关系。")};}
    },
    21:{
      title:"自动控制的发展时间轴",visual:"history",timed:false,draggable:"event",
      controls:[R("event","历史节点",0,12,1,0)],
      draw(s){
        const [phase,date,...body]=data.history[s.event];
        const tag=["自动控制思想的萌芽","反馈与频域分析","现代控制的工程应用"][phase];
        return {art:'<div class="history-view">'+steps(["思想萌芽","经典控制理论","现代与智能控制"],phase)+illustrative(erasGraphics[phase],tag)+'</div>',readouts:readouts([["时间",date]]),
          detail:selected(date,body.join(" · "))+text("阶段要点",data.eras[phase]),
          note:note("拖时间轴定位人物、年代和方法。")};
      }
    },
    22:{
      title:"从基础科学到工程实践",visual:"curriculum",timed:false,draggable:"layer",
      controls:[R("layer","培养层次",0,3,1,1),C("branch","学科交叉",["控制","电子","信息","管理及其他"])],
      draw(s){
        const names=["基础科学","技术科学","工程技术","工程实践"];
        return {art:steps(names,s.layer),readouts:readouts([["当前培养层",names[s.layer]]]),
          detail:selected(names[s.layer],data.tiers[s.layer])+text("电气工程及其自动化",["控制科学与工程","电子科学与技术学科","信息科学与技术","管理及其它相关学科"][s.branch])+arr(["自动化控制","信息化改造","现代化管理","商业化运营","学科交叉"]),
          note:note("自动控制理论位于技术科学层，上承数理基础，下接工程实践。")};
      }
    },
    24:{
      title:"复习路径",visual:"summary",timed:false,draggable:"item",
      controls:[R("item","学习路径",0,4,1,0)],
      draw(s){
        const labels=["理解自动控制的概念","理解反馈控制原理","了解各种控制方式及其优缺点","理解控制系统的常用术语","掌握用方框图描述工作原理"];
        return {art:steps(labels,s.item),detail:selected("当前复习",labels[s.item])+'<button type="button" data-goto="'+[8,10,14,15,15][s.item]+'">回到本章教学页</button>',
          note:note("下章预告 · 控制系统的数学模型，包括微分方程与传递函数。")};
      }
    }
  };
  function testClassification(s){
    const main=!s.command&&!s.type&&!s.sample&&!s.ports;
    return selected("四个维度同时成立",main?"当前组合是本课程的主要研究对象。":"切换任一选项，观察对应的给定波形、对象特性、采样形式或端口数量。");
  }
  const names=[
    "课程封面","教学团队","教学安排","考核方式","慕课登录","课程教材","教学日历",
    "第一次让系统自己调节","恒温箱怎样纠偏","没有电子控制器的闭环","同一台电机的开环与闭环","为什么上坡时车速会先降","前馈能提前补偿什么","如何选择控制方式","一张图读懂七个术语","同一个系统怎么分类","什么叫稳、快、准","从要求走到实现","无人机与天问一号","六种信息怎样支持智能驾驶","三阶段控制史","这门课连接哪些知识","课堂自测","本章收束与下章入口"
  ];
  const sources=[[1],[2],[3],[4],[5],[6],[10],[7,11],[15],[16],[18,19,20,21],[22],[23,24],[17,26],[30,31],[32],[33],[34],[12],[13],[27,28,29],[8,9],[14,25],[35]];
  return {sequenceSpecs,names,sources};
})();
