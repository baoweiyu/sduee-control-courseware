"use strict";
(() => {
  const W = IntroWidgets, M = IntroModels, G = IntroRigs;
  const {range, choices, readouts, plot, ink, note, escape} = W;
  const format = (value, digits=1) => value.toFixed(digits);
  const pct = value => format(value) + "%";
  const trace = (series, key, label, color, dash=false) => ({series, key, label, color, dash});
  const focus = (title, copy) => '<section class="text-block"><h3>' + escape(title) + '</h3><p>' + escape(copy) + '</p></section>';
  const rig = (body, label, width=760, height=270) => '<svg viewBox="0 0 ' + width + ' ' + height +
    '" role="img" aria-label="' + escape(label) + '">' + body + '</svg>';
  const motorAsset = "../../../assets/classroom/motor-bench.webp";

  // The topology and labels are stage-specific; the plots and readings share the same model samples.
  function signalMap({id, input, control, plant, output, sensor, feed, disturbance, selected}) {
    const main="#243444", feedback="#5551a3", orange="#a75923";
    const arrows = [["flow",main],["back",feedback],["load",orange]].map(([name,color]) =>
      '<marker id="' + id + '-' + name + '" viewBox="0 0 9 8" refX="8" refY="4" markerWidth="6" markerHeight="6" orient="auto">' +
      '<path d="M0 0L9 4 0 8z" fill="' + color + '"/></marker>'
    ).join("");
    const line = (points, branch="flow") => '<path d="' + points + '" fill="none" stroke="' +
      ({flow:main,back:feedback,load:orange})[branch] + '" stroke-width="2.7" stroke-linejoin="round" marker-end="url(#'+id+'-'+branch+')"/>';
    const label = (x,y,text,color=main,anchor="middle") => '<text x="'+x+'" y="'+y+
      '" fill="'+color+'" text-anchor="'+anchor+'" font-size="19" font-weight="590">'+escape(text)+'</text>';
    const block = (x,y,w,title,branch="flow") => {
      const accent = branch==="back"?feedback:branch==="load"?orange:main;
      const active = selected===title;
      return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="45" rx="8" fill="'+
        (active?(branch==="load"?"#fff0db":"#e8e4fa"):"#fbfcfe")+'" stroke="'+accent+'" stroke-width="'+(active?2.5:1.5)+'"/>'+
        label(x+w/2,y+29,title,accent);
    };
    const junction = (x,y) => '<circle cx="'+x+'" cy="'+y+'" r="12" fill="#fbfcfe" stroke="'+main+'" stroke-width="2"/>';
    return rig('<defs>'+arrows+'</defs>'+
      label(20,92,input,main,"start")+line(sensor?"M20 117H126":"M20 117H177")+
      (sensor?junction(141,117)+label(119,105,"+",main)+label(156,145,"−",feedback)+line("M154 117H177"):"")+
      block(178,95,148,control)+line("M327 117H430")+
      (disturbance?junction(445,117)+line("M458 117H490"):"")+
      (disturbance?"":line("M429 117H490"))+block(491,95,150,plant)+line("M641 117H734")+
      label(734,92,output,main,"end")+
      (sensor?'<circle cx="681" cy="117" r="3.7" fill="'+feedback+'"/>'+
        line("M681 117V214H465","back")+block(294,192,170,sensor,"back")+
        line("M294 214H141V131","back")+label(223,201,"反馈",feedback):"")+
      (disturbance?label(438,27,"扰动量 d",orange)+line("M438 36V103","load")+label(421,94,"−",orange):"")+
      (feed?line("M438 42H485","load")+block(486,29,154,feed,"load")+
        line("M640 51H672V73H453V105","load")+label(481,82,"+",orange):""),
      [input,control,plant,output,sensor,feed].filter(Boolean).join(" → "));
  }

  function motorControl(mode, hardware=false) {
    const isClosed = mode==="closed";
    const title = hardware ? "直流电机试验台" : (isClosed ? "负反馈信号回路" : "单向控制信号");
    return {
      title, chartTitle: hardware?"目标与实测转速":"给定、扰动与输出",
      visual: hardware?"motor":"rig", draggable:"load",
      ...(hardware?{backdrop:motorAsset}:{}),
      controls:[range("target",hardware?"给定转速":"给定值",35,95,1,70," %"),
        range("load","施加负载",0,55,1,28," %"),range("when","施加时刻",1,9,.2,3," s")],
      draw(s) {
        const samples = M.drive(s,mode), p = M.at(samples,s.time);
        const path = signalMap({
          id:hardware?"original-motor-path":"original-controller-path",
          input:hardware?(isClosed?"给定电压 u_g":"电位器 u_r"):"给定量 r",
          control:hardware?"功率放大器":"控制器", plant:hardware?"直流电动机":"被控对象",
          output:hardware?"输出转速 n":"输出量 c", sensor:isClosed?(hardware?"测速发电机":"测量元件"):null,
          disturbance:true, selected:isClosed&&(p.error>.25||hardware)?(hardware?"测速发电机":"测量元件"):"控制器"
        });
        return {
          art:hardware?G.motor(p,s.load,s.time):path,
          chart:plot([trace(samples,"target","给定",ink.target,true),trace(samples,"y",isClosed?"闭环输出":"开环输出",ink.teal)],s.time,{minSpan:5,unit:hardware?"相对转速 / %":"相对输出 / %",event:s.when}),
          readouts:readouts([[hardware?"转速":"输出",pct(p.y)],[isClosed?"偏差":"控制量",pct(isClosed?p.error:p.u)],["负载扰动",pct(p.d)]]),
          detail:hardware?'<section class="motor-scheme"><h2>'+(isClosed?"测速负反馈接线":"电位器到电动机")+'</h2>'+path+'</section>':
            focus(isClosed?"负反馈纠偏":"控制量只由给定决定",isClosed?"扰动使测量值降低时，给定与测量之差增大，控制器随即增大控制作用。":"拖动负载，给定和控制量保持，输出曲线改变。"),
          note:note(isClosed?"把游标移到扰动之后，对照偏差与输出。本实验为稳定的教学示意模型。":"用相同给定反复改变负载，观察有无控制量回调。")
        };
      }
    };
  }

  const modeNames = ["开环控制","闭环控制","复合控制"];
  const modes = ["open","closed","compound"];
  const summaries = [
    "输出量不参与控制。信号单向传递，结构简单、成本低。",
    "输出量参与控制。反馈形成闭合回路，在适当设计下可提高精度和抗扰能力。",
    "反馈与前馈结合。可测扰动经前馈通道产生补偿，反馈继续纠偏。"
  ];
  const attributes = [
    ["定义","无反馈","利用反馈信号","前馈与反馈结合"],
    ["优点","结构简单、成本低","精度高、抗扰能力强","抗扰、响应和精度可兼顾"],
    ["缺点","精度低、抗扰差","结构复杂、参数不当可能失稳","设计较复杂、实现成本高"],
    ["抗扰性","★☆☆☆☆","★★★★☆","★★★★★"],
    ["精度","★☆☆☆☆","★★★★☆","★★★★★"],
    ["复杂度","★☆☆☆☆","★★★★☆","★★★★★"]
  ];

  const thermal = {
    ...IntroPages.sequenceSpecs[9],
    draw(s){
      const result=IntroPages.sequenceSpecs[9].draw(s,{low:s.target-15,high:s.target+5});
      const p=M.at(M.thermal(s),s.time);
      return {...result,detail:'<h2>温度负反馈回路</h2>'+signalMap({
        id:"original-thermal-path",input:"设定温度 r",control:"温控器 / 加热器",plant:"恒温箱",
        output:"箱温 y",sensor:"温度传感器",disturbance:true,selected:p.error>.5?"温控器 / 加热器":"温度传感器"
      })};
    }
  };
  const hydraulic = {
    ...IntroPages.sequenceSpecs[10], backdrop:"../../../assets/classroom/tank-bench.webp",
    draw(s){
      const result=IntroPages.sequenceSpecs[10].draw(s);
      const point=M.at(M.hydraulic(s),s.time);
      const response=point.h<.58-.01?"浮子下降，进水阀逐渐开大。":point.h>.58+.01?"浮子上升，进水阀逐渐关小。":"液位接近初始位置，取此刻进出水量作比较。";
      return {...result,art:G.tank(point,100*point.valve),detail:focus("机械反馈",response)};
    }
  };
  const modesLab = {
    title:"沿信号方向读图",timed:false,visual:"rig",controls:[choices("mode","选择控制方式",modeNames)],
    draw(s){
      const mode=modes[s.mode], closed=mode!=="open", compound=mode==="compound";
      return {
        art:signalMap({id:"original-mode-path",input:"给定量 r",control:"控制器",plant:"被控对象",output:"输出量 c",
          sensor:closed?"测量元件":null,feed:compound?"前馈控制器":null,disturbance:compound,selected:compound?"前馈控制器":closed?"测量元件":"控制器"}),
        detail:focus(modeNames[s.mode],summaries[s.mode]),
        note:note("依次选择三种方式，观察反馈支路和前馈支路如何进入主通道。")
      };
    }
  };
  const compoundLab = ({
    title,chartTitle,showPaths=false,chartScale={}
  }) => ({
    title, chartTitle, visual:"rig",draggable:"feed",
    controls:[range("load","可测扰动",0,52,1,28," %"),range("feed","补偿比例",0,135,1,72," %"),range("when","扰动到达时刻",1,9,.2,3," s")],
    draw(s){
      const input={...s,target:75}, simple=M.drive(input,"closed"), compound=M.drive(input,"compound");
      const p=M.at(compound,s.time);
      const detail = showPaths ? focus("前馈先应对扰动，反馈看残余偏差","扰动可以测量；前馈量由扰动直接算出。反馈量取决于输出和给定之差。") :
        focus("增加一条前馈通道","同一对象、同一扰动下，观察补偿比例改变时两条输出曲线的差距。");
      return {
        art:signalMap({id:"original-compound-path",input:"给定量 r",control:"反馈控制器",plant:"被控对象",output:"输出量 c",
          sensor:"测量元件",feed:"前馈控制器",disturbance:true,selected:p.correction>0?"前馈控制器":"测量元件"}),
        chart:plot([trace(simple,"target","目标",ink.target,true),trace(simple,"y","单纯反馈",ink.orange),
          trace(compound,"y","复合控制",ink.teal)],s.time,{...chartScale,minSpan:5,unit:"输出 / %",event:s.when}),
        readouts:readouts([["前馈量",pct(p.correction)],["反馈量",pct(p.returnSignal)],["残余偏差",pct(p.error)]]),
        detail,
        note:note(showPaths?"把补偿比例调至 100%，再转到事件线之后，观察理想模型中的残余偏差。":"在可测扰动的教学模型中，拖动补偿比例可以看到前馈的改善与失配。")
      };
    }
  });

  const compare = {
    title:"按同一指标观察三种结构",chartTitle:"同一负载下的输出",visual:"compare",draggable:"load",
    controls:[choices("metric","比较指标",attributes.map(row=>row[0]),3),range("load","共同扰动",0,55,1,26," %")],
    draw(s){
      const input={target:74,when:3,load:s.load,feed:76};
      const responses=modes.map(mode=>M.drive(input,mode));
      const [row,...items]=attributes[s.metric];
      const topology='<div class="topologies">'+modeNames.map((name,i)=>
        '<section><h3>'+name+'</h3>'+G.topology(modes[i])+'<p>'+items[i]+'</p></section>').join("")+'</div>';
      return {
        art:topology,
        chart:plot(responses.map((series,i)=>trace(series,"y",modeNames[i],[ink.orange,ink.blue,ink.teal][i])),s.time,{minSpan:5,unit:"输出 / %",event:3}),
        readouts:readouts(modeNames.map((name,i)=>[name,pct(M.at(responses[i],s.time).y)])),
        detail:focus(row,row==="复杂度"?"星级越高表示结构越复杂。":"星级是教师课件的定性比较，曲线是同一示意对象下的定量响应。"),
        note:note("切换定义、优缺点或星级指标；拖动共同扰动时，三个系统接受相同输入。")
      };
    }
  };

  window.SourcePolish ??= {};
  Object.assign(window.SourcePolish,{
    15:{
      objective:"先让箱门产生可控散热，再通过右侧温度反馈图定位测量、比较、调节和执行。",
      lead:"箱温下降时，温度反馈通过偏差提高加热功率，使箱温返回设定值附近。",
      sections:[
        ["调节回路","设定温度 r(t) 与传感器反馈的温度相减，得到温度偏差 e(t)。温度控制器产生控制量 u(t)，功率调节器驱动加热器，加热恒温箱。实际箱温 y(t) 由温度传感器测量。"],
        ["三个扰动","环境温度变化、开门散热和负载变化都会改变热量平衡。向右拖动时间游标越过开门时刻，再改变门角与环境温度。"],
        ["控制要素",["设定量：目标温度","被控对象及被控量：恒温箱及实际箱温","测量元件：温度传感器","执行元件：功率调节与加热器"]]
      ],
      lab:thermal
    },
    16:{
      objective:"以水箱装置为主视觉，让液位、浮子、连杆和进水阀随出水扰动连续联动。",
      lead:"液位升高，浮子通过连杆关小进水阀；液位降低时，反馈动作反向。",
      sections:[
        ["水位下降",["浮子下降","连杆使进水阀开大","进水量增加"]],
        ["水位上升",["浮子上升","连杆使进水阀关小","进水量减少"]],
        ["控制要素",["被控对象：水箱","被控量：液位 h","测量元件：浮子","执行元件：进水阀"]],
        ["结论","利用浮子反馈，无需电子控制器也能形成闭环调节。"]
      ],
      lab:hydraulic
    },
    17:{
      objective:"用单一结构视图切换三类控制方式，把分辨依据放在输出回路与扰动支路。",
      lead:"判断控制方式时，先找输出是否返回控制端，再找有无独立的前馈补偿。",
      sections:modeNames.map((name,i)=>[name,summaries[i]]),
      lab:modesLab
    },
    18:{
      objective:"把开环定义落到一条不返回的信号链，固定给定后再改变扰动。",
      lead:"在开环控制中，系统输出量不参与对系统的控制。",
      sections:[
        ["定义","控制器按照给定发出控制量，输出变化不会经反馈改变控制作用。"],
        ["优点",["线路简单","成本低","不引入反馈回路带来的失稳风险；稳定的对象可以稳定工作"]],
        ["缺点",["控制精度较低","无法依据输出误差自动补偿扰动"]],
        ["下一页例子","直流电动机转速开环控制。"]
      ],
      lab:motorControl("open")
    },
    19:{
      objective:"把实验台和电路链并置，单独观察开环中负载变化后转速偏离而电压指令不回调。",
      lead:"电位器、电压放大和直流电机组成单向控制链。",
      sections:[
        ["电机接线","电位器产生给定电压 uᵣ，功率放大器输出电枢电压 uₐ，然后驱动直流电动机。被控量是转速 n。"],
        ["扰动","负载变化或电压波动会影响转速。装置的转速读数在该开环接法中仅用于观察。"],
        ["框图","r(t) 经过控制器和被控对象，得到输出 c(t)。扰动从被控对象一侧进入，信号不回传。"]
      ],
      lab:motorControl("open",true)
    },
    20:{
      objective:"用负反馈的测量回路和可见偏差讲清定义，闭环利弊另列在原页。",
      lead:"闭环控制利用输出的反馈信号和给定比较，按偏差纠正输出。",
      sections:[
        ["定义","如果系统的输出量参与对系统的控制，则称为闭环控制。"],
        ["负反馈闭环",["将输出量引回输入端","将测量信号与给定量比较，形成偏差","根据偏差调节被控对象，使偏差减小或消除"]],
        ["优点","适当设计后抗干扰能力较强，控制精度较高。"],
        ["局限","参数配合不当可能产生振荡甚至失稳。该次演示采用稳定的对象。"]
      ],
      lab:motorControl("closed")
    },
    21:{
      objective:"连接同一试验台的测速反馈，把同轴测速发电机与偏差、控制电压在图上对应起来。",
      lead:"测速发电机的反馈电压送回比较点，电机转速的变化因此会改变控制作用。",
      sections:[
        ["实物信号","给定电位器产生电压 u_g。同轴测速发电机 TG 测得电动机 M 转速并产生反馈电压 u_f。两者相减得到偏差，经放大器生成电枢电压 u_a。"],
        ["方框图","给定输入经比较点得到偏差，放大器输出控制量，作用于电动机。负载扰动作用于电动机；输出转速由测速发电机转换成反馈量。"],
        ["观察","给定和负载与上一例的开环模型相同，反馈能减小由负载造成的转速偏差。"]
      ],
      lab:motorControl("closed",true)
    },
    22:{
      objective:"保留驾驶员设定到轮速反馈的步骤，用上坡扰动触发车速和节气门的共同变化。",
      lead:"车辆上坡后，系统通过轮速反馈发现速度偏差，再调节节气门与变速箱。",
      sections:[
        ["由设定到纠偏",["驾驶员通过定速巡航控制开关设定目标速度。","轮速传感器经 ABS 模块提供车速反馈。","发动机 ECU 与变速箱 ECU 协同，控制节气门和自动变速箱。","车辆调整车速，接近设定速度。"]],
        ["找一找",["被控对象：汽车","被控量：车速","测量元件：轮速传感器","执行元件：节气门等"]]
      ],
      lab:IntroPages.sequenceSpecs[12]
    },
    23:{
      objective:"只在原定义页比较是否添加前馈，先从并行支路和性能差异理解设计取舍。",
      lead:"复合控制在反馈基础上增加按扰动或给定的前馈补偿。",
      sections:[
        ["定义","在反馈控制基础上加入对扰动或输入的前馈补偿通道，结合开环控制与闭环控制。"],
        ["优点","前馈可在扰动造成明显输出偏差以前产生补偿。适当设计可提高抗扰能力、加快响应并兼顾精度。"],
        ["代价","按扰动补偿时须能测量扰动并建立额外通道，结构、设计与实施成本增加。"]
      ],
      lab:compoundLab({title:"开启前馈后会怎样",chartTitle:"加前馈前后的输出",chartScale:{maxYTicks:6}})
    },
    24:{
      objective:"把可测扰动的直接作用与前馈补偿画成两条分开的有符号支路，再用三个实时量校验。",
      lead:"前馈根据扰动直接计算补偿，闭环反馈按输出偏差继续纠偏。",
      sections:[
        ["两条路径","扰动 d 经过扰动通道对输出产生影响，同时送入前馈控制器。前馈补偿由控制输入端施加，方向设计为与扰动效应相反。"],
        ["反馈回路","测量元件把输出转成反馈量。给定减去反馈形成偏差，控制器根据偏差修正前馈之后的残余误差。"],
        ["适用场景","扰动可测、精度要求高。前馈模型失配时，反馈继续起纠偏作用。"]
      ],
      lab:compoundLab({title:"前馈、扰动与负反馈支路",chartTitle:"残余偏差会改变方向吗",showPaths:true})
    },
    25:{
      objective:"保留原多选与得分口径，把判断和反馈安排在同页。",
      lead:"根据上一组开环和闭环实例，判断反馈带来的收益与代价。",
      sections:[["题型与分值","多选题，2 分。展示答案时说明引入反馈的收益与代价。"]],
      quiz:{
        prompt:"与开环控制系统相比，闭环控制系统（　）",
        options:["控制精度高","结构简单","会有不稳定问题","以上都对"],answers:[0,2],
        feedback:"设计适当的闭环可利用反馈提高精度，但参数配合不当可能导致失稳；结构简单属于开环控制的优点。"
      }
    },
    26:{
      objective:"把三种拓扑和同一指标并排，对照定性星级与受同一扰动的模拟输出。",
      lead:"闭环依靠反馈提高精度，复合控制在扰动可测、补偿匹配时可进一步提高抗扰能力。",
      sections:[
        ["开环",["定义：无反馈的控制方式","优点：结构简单、成本低","缺点：精度低、抗扰差","抗扰性、精度、复杂度定性均为 1 星"]],
        ["闭环",["定义：利用反馈信号的控制方式","优点：精度高、抗扰能力强","缺点：结构复杂、参数不当可能失稳","抗扰性、精度、复杂度定性均为 4 星"]],
        ["复合",["定义：前馈与反馈相结合","优点：抗扰、响应与精度可兼顾","缺点：设计与实现较复杂，成本高","抗扰性、精度、复杂度定性均为 5 星"]]
      ],
      lab:compare
    }
  });
})();
