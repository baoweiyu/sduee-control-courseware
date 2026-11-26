"use strict";
(() => {
  const { choices, range, readouts, note, escape } = IntroWidgets;
  const { clamp } = IntroModels;
  const styles = {ink:"#302c43", muted:"#655b78", line:"#ddd7e7", active:"#634497", pale:"#f0eafd", heat:"#a45225", heatPale:"#f9ede5", green:"#286957", greenPale:"#e7f2ed"};
  const diagram = (body, name, viewBox="0 0 660 250") =>
    `<svg viewBox="${viewBox}" role="img" aria-label="${escape(name)}">${body}</svg>`;
  const label = (x,y,value,size=18,color=styles.ink,align="middle",weight=650) =>
    `<text x="${x}" y="${y}" text-anchor="${align}" font-size="${size}" fill="${color}" font-weight="${weight}">${escape(value)}</text>`;
  const line = (d,color=styles.line,width=3,arrow="") =>
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${arrow?` marker-end="url(#${arrow})"`:""}/>`;
  const card = (x,y,w,h,fill="#fcfbfe",stroke=styles.line,r=8) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
  const circle = (x,y,r,fill,stroke=fill,width=1.5) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
  const textPanel = (title,text) =>
    `<section class="text-block"><h3>${escape(title)}</h3><p>${escape(text)}</p></section>`;

  function governor(speed){
    // Relative dimensions only. Speeds describe the demonstration rather than a historical engine.
    const angle=(28+speed*.32)*Math.PI/180;
    const spread=88*Math.sin(angle);
    const lift=69+88*Math.cos(angle);
    const sleeve=lift+Math.sqrt(80**2-spread**2);
    const left=330-spread,right=330+spread;
    const valveAperture=0.82-0.64*speed/100;
    return diagram(`<defs>
      <linearGradient id="governor-steel"><stop stop-color="#6d7282"/><stop offset=".34" stop-color="#e1e2eb"/><stop offset=".62" stop-color="#959aaa"/><stop offset="1" stop-color="#666b7c"/></linearGradient>
      <linearGradient id="governor-brass" x2="0" y2="1"><stop stop-color="#f2cc81"/><stop offset="1" stop-color="#a47436"/></linearGradient>
      <radialGradient id="governor-ball" cx=".33" cy=".27" r=".73"><stop stop-color="#f7dfa0"/><stop offset=".47" stop-color="#d5a753"/><stop offset="1" stop-color="#795021"/></radialGradient>
    </defs>
    <ellipse cx="330" cy="241" rx="170" ry="7" fill="#ddd6e7" opacity=".55"/>
    ${card(193,224,274,13,"#c8c2cd","#aca4b5",6)}
    ${card(239,218,182,8,"#e1dbe4","#bdb4c4",5)}
    <rect x="323" y="53" width="14" height="164" rx="5" fill="url(#governor-steel)" stroke="#737887"/>
    ${line(`M330 69L${left} ${lift} M330 69L${right} ${lift}`,"#a47639",9)}
    ${line(`M330 69L${left} ${lift} M330 69L${right} ${lift}`,"#ebc580",4)}
    ${line(`M${left} ${lift}L330 ${sleeve}L${right} ${lift}`,"#ad864f",5)}
    <rect x="309" y="${sleeve-8}" width="42" height="19" rx="5" fill="url(#governor-brass)" stroke="#946d3d"/>
    ${circle(left,lift,18,"url(#governor-ball)","#88602c")}
    ${circle(right,lift,18,"url(#governor-ball)","#88602c")}
    ${circle(330,69,10,"url(#governor-brass)","#946d3d")}
    ${circle(330,69,3,"#855d34")}
    ${line(`M${right+15} ${lift-13}L${right+50} 55H570`,styles.muted,1.5)}
    ${label(573,59,"飞球",17,styles.ink,"start")}
    ${line(`M351 ${sleeve}H458`, "#8f785d", 3)}
    ${circle(458,sleeve,5,"#bc9d75","#89745d")}
    ${line(`M458 ${sleeve}V199`, "#94734e", 3)}
    ${line("M435 199H587","#aaa5b3",11)}
    ${line("M435 199H587","#e4dfe5",4)}
    ${card(451,187,31,24,"#d2b790","#937950",4)}
    <rect x="455" y="194" width="${Math.round(valveAperture*23)}" height="10" rx="2" fill="#87509b"/>
    ${label(528,226,"蒸汽阀开度",16,styles.muted)}
    ${line(`M308 ${sleeve}H246L224 188H175`,styles.muted,1.5)}
    ${label(169,193,"滑套",17,styles.ink,"end")}
    ${label(330,27,"瓦特离心调速器",19)}`,
    "调速器示意，转速提高时，两侧飞球外展，滑套随之上移");
  }

  const classical=[
    ["1868","调速器稳定性","麦克斯韦在《On Governors》中研究调速器的稳定性，并把判断联系到特征方程的根。"],
    ["1877 / 1895","代数判据","劳斯与赫尔维茨分别给出多项式稳定性的代数判据。"],
    ["1930s–40s","频率响应","贝尔实验室的奈奎斯特与伯德研究反馈放大器，从频率响应判断反馈系统的特性。"],
    ["二战期间","伺服跟踪","雷达—火炮跟踪推动了伺服机构研究。"],
    ["1948","控制论","维纳出版《控制论》，MIT 的伺服机构研究推动学科形成。"],
    ["1948","根轨迹","伊文思提出根轨迹法，通过极点随参数变化的位置联系分析与设计。"]
  ];
  const modern=[
    ["1950s 后期","极大值原理","庞德里亚金及合作者提出极大值原理，为最优控制给出必要条件。"],
    ["1957","动态规划","贝尔曼的动态规划把多阶段决策分解成递推问题。"],
    ["1960","状态与滤波","卡尔曼发表线性滤波工作。状态空间方法描述内部状态，并支持最优估计与控制。"],
    ["1970s","大系统","大系统理论面向规模大、耦合复杂的系统。"],
    ["1980s 至今","智能控制","模糊、神经与学习方法用于机器人、无人驾驶与智能制造等场景。"]
  ];

  const terms=[
    ["给定量","系统输出量要求达到的值。","输入"],
    ["被控量","被控系统所控制的物理量。","输出"],
    ["反馈量","测量结果由输出经比例或函数变换得到，与给定量有相同量纲、数量级可比较。","反馈"],
    ["偏差量","给定量减去主反馈量。","偏差"],
    ["控制量","执行环节施加到被控对象上的信号。","控制量"],
    ["扰动量","可能使系统输出偏离要求的输入量。","扰动"],
    ["被控对象","接受控制作用的机器、设备或生产过程。","对象"]
  ];
  function loop(focus) {
    const mag = key=>key===focus;
    const block=(x,y,w,text,key)=>{
      const active=mag(key)||(focus==="装置" && key!=="对象");
      return card(x,y,w,45,active?styles.pale:"#fdfbff",active?styles.active:"#bfb4cf",6)+label(x+w/2,y+29,text,18,active?styles.active:styles.ink);
    };
    const arrow=(key,d)=>{
      const color=mag(key)?styles.active:key==="扰动"?styles.heat:key==="反馈"?styles.green:styles.muted;
      const id={ [styles.active]:"source-active",[styles.heat]:"source-load",[styles.green]:"source-feedback",[styles.muted]:"source-flow" }[color];
      return line(d,color,mag(key)?4.1:2.4,id);
    };
    const signal=(key,x,y,name)=>label(x,y,name,17,mag(key)?styles.active:key==="扰动"?styles.heat:key==="反馈"?styles.green:styles.muted);
    const markers=[[styles.active,"source-active"],[styles.heat,"source-load"],[styles.green,"source-feedback"],[styles.muted,"source-flow"]].map(([color,id])=>
      `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="3.4" markerHeight="3.4" orient="auto"><path d="M0 0 10 5 0 10z" fill="${color}"/></marker>`).join("");
    return diagram(`<defs>${markers}</defs>`+
      card(105,43,530,194,"#faf7fd","#dfd6ea")+
      card(665,72,137,100,"#f3f0f7","#dfd6ea")+
      label(121,64,"自动控制装置",15,styles.muted,"start")+
      label(733,91,"过程",14,styles.muted)+
      arrow("输入","M24 131H128")+arrow("偏差","M221 131H273")+arrow("传递","M355 131H381")+
      arrow("传递","M463 131H490")+arrow("控制量","M573 131H677")+arrow("输出","M787 131H865")+
      arrow("扰动","M732 47V107")+arrow("反馈","M830 131V200H426")+
      arrow("反馈","M320 200H175V154")+
      signal("输入",58,115,"给定量")+signal("偏差",245,112,"偏差量")+signal("控制量",626,115,"控制量")+
      signal("输出",847,110,"被控量")+signal("扰动",732,36,"扰动量")+signal("反馈",257,222,"反馈量")+
      block(128,108,93,"比较","比较")+block(273,108,82,"放大","放大")+block(381,108,82,"校正","校正")+
      block(490,108,83,"执行","执行")+block(677,108,110,"被控对象","对象")+block(320,177,106,"测量","反馈")+
      circle(830,131,4,styles.green)+label(114,151,"+",15,styles.muted)+label(188,175,"−",16,styles.green),
    "负反馈回路，控制装置包括比较、放大、校正、执行和测量，扰动进入被控对象","0 0 890 252");
  }
  const components=[
    ["装置","自动控制装置","测量、比较、调节和执行元件共同对被控对象施加控制。"],
    ["对象","被控对象","接受控制作用的机器、设备或生产过程。"],
    ["反馈","测量与反馈","由输出取得反馈量，再送回比较元件形成偏差。"]
  ];
  const objectives=[
    ["概念","理解自动控制的概念","辨认控制器、被控对象与被控量。"],
    ["反馈","理解反馈控制原理","说清楚测量、比较和调节如何形成闭环。"],
    ["方式","了解控制方式及优缺点","比较开环、闭环和复合控制中的信号路径。"],
    ["术语","理解系统常用术语","区分给定量、被控量、反馈量、偏差量、控制量与扰动量。"],
    ["方框图","用方框图说明工作原理","沿着信号箭头说明每个元件及支路的作用。"]
  ];
  function recap(s){
    const connectors = Array.from({length:4},(_,i)=>line(`M${112+116*i} 116h16`,"#bfb2d4",2)).join("");
    const nodes=objectives.map(([short],i)=>{
      const x=19+i*116,active=i===s.item;
      return card(x,85,92,61,active?styles.pale:"#fdfbff",active?styles.active:"#d6cce1",9)+
        label(x+46,122,short,20,active?styles.active:styles.ink);
    }).join("");
    return diagram(connectors+nodes+label(287,190,objectives[s.item][1],21,styles.active),
      objectives.map(row=>row[0]).join("，"),"0 0 575 218");
  }

  window.SourcePolish ??= {};
  Object.assign(window.SourcePolish,{
    27:{
      objective:"以离心调速器作为主画面，拖动转速并观察机械反馈，古代自动装置留在同页讲解中。",
      lead:"从古代自动装置到离心调速器，自动调节先有工程实践，后来才发展为理论。",
      sections:[
        ["古代装置","课件由约三千年前的自动装置讲起，铜壶滴漏用于水钟计时，指南车用于定向，浑天仪用于天文观测。"],
        ["工业革命","1765 年瓦特开始改良蒸汽机，1788 年离心调速器用于工业调节，是早期工业自动控制装置之一。"],
        ["反馈的萌芽","转速升高使飞球外展，滑套通过连杆减小蒸汽阀开度，抑制转速的进一步升高。早期装置主要依靠经验和技艺。"]
      ],
      lab:{
        title:"拖动转速，观察飞球与滑套",timed:false,draggable:"speed",controls:[range("speed","相对转速",0,100,1,50,"%")],
        draw(s){return {art:governor(s.speed),readouts:readouts([["模型转速",s.speed+"%"]]),detail:textPanel("转速改变、阀门纠偏",s.speed>=50?"转速较高时，飞球外展、滑套上移，连杆使蒸汽阀关小。":"转速较低时，飞球收拢、滑套下移，连杆使蒸汽阀开大。"),note:note("相对转速用于观察模型中的机械联动。")};}
      }
    },
    28:{
      objective:"以反馈放大实验设备配图和可扫读的时间线，串联从稳定性研究到反馈分析与设计的方法。",
      lead:"经典控制理论把经验性的反馈调节变成可以计算、分析和设计的工程方法。",
      sections:[
        ["早期判稳",classical.slice(0,2).map(([year,title,body])=>year+" · "+title+"。"+body)],
        ["频域与伺服",classical.slice(2,4).map(([year,title,body])=>year+" · "+title+"。"+body)],
        ["控制学科形成",classical.slice(4).map(([year,title,body])=>year+" · "+title+"。"+body)],
        ["经典控制的范围","典型对象为单输入单输出的线性定常系统。常用数学工具包括拉氏变换和传递函数，主要分析方法有频率法与根轨迹法，服务于 20 世纪四五十年代生产过程的局部自动化。"]
      ],
      gallery:{
        figures:[{
          src:"classical-controls-bench.webp",
          alt:"早期电子实验台上的圆屏示波器和电子管放大设备",
          title:"从反馈实验到频域设计",
          description:"早期反馈放大器是频率响应分析的重要应用。"
        }],
        timeline:classical.map(([date,title],i)=>[date,title,["麦克斯韦用特征根判断稳定性","劳斯、赫尔维茨建立代数判据","奈奎斯特、伯德研究反馈放大器","雷达跟踪推动伺服机构研究","维纳出版《控制论》","伊文思用极点变化指导设计"][i]])
      }
    },
    29:{
      objective:"以工业机器人配图和可扫读的时间线，串联最优决策、状态估计、大系统与智能控制。",
      lead:"研究从系统输出扩展到内部状态、最优估计与决策，控制对象也随之扩展。",
      sections:[
        ["最优决策与状态估计",modern.slice(0,3).map(([year,title,body])=>year+" · "+title+"。"+body)],
        ["复杂系统及产业应用",modern.slice(3).map(([year,title,body])=>year+" · "+title+"。"+body)],
        ["对象、工具与方法","现代控制可以处理多输入多输出、时变或非线性等对象，以状态空间法为重要工具，应用最优控制、最优估计和系统辨识等方法。工业机器人和智能车辆是课件选用的应用例子。"]
      ],
      gallery:{
        figures:[{
          src:"modern-controls-robot.webp",
          alt:"实验台上的多关节工业机械臂，末端装有测量探头",
          title:"多关节机器人",
          description:"机械臂的多关节联动是多变量控制的应用实例。"
        }],
        timeline:modern.map(([date,title],i)=>[date,title,["给出最优控制的必要条件","把多阶段决策写成递推问题","用状态空间描述系统并估计状态","研究大规模、强耦合对象","发展模糊、神经与学习方法"][i]])
      }
    },
    30:{
      objective:"把自动控制装置与被控对象放在明确的不同区块，点选时高亮系统边界、反馈支路和元件。",
      lead:"一个反馈回路包含自动控制装置和被控对象。沿箭头可以区分二者及其连接信号。",
      sections:[
        ["自动控制装置",components[0][2]+" 调节环节可以包含放大器和校正装置。"],
        ["被控对象",components[1][2]],
        ["闭环如何形成","给定量与主反馈量比较得到偏差量。偏差经调节与执行产生控制量，控制量与扰动作用于对象。对象的输出经测量返回比较元件。"],
        ["图中信号",terms.slice(0,6).map(([title,meaning])=>title+"。"+meaning)]
      ],
      lab:{
        title:"定位控制装置、对象与反馈",timed:false,
        controls:[choices("part","查看回路区块",components.map(([,title])=>title))],
        draw(s){const [key,title,body]=components[s.part];return {art:loop(key),detail:textPanel(title,body)};}
      }
    },
    31:{
      objective:"沿用上一页的回路坐标，每次定位一个术语，再显示对应定义，支持课堂辨认。",
      lead:"同一张图中，给定、反馈、偏差、控制、扰动和被控量分别出现在不同位置。",
      sections:terms.map(([title,meaning])=>[title,meaning]),
      lab:{
        title:"点选术语定位信号",timed:false,controls:[choices("term","常用术语",terms.map(([name])=>name))],
        draw(s){const [title,meaning,location]=terms[s.term];return {art:loop(location),detail:textPanel(title,meaning)};}
      }
    },
    32:{
      objective:"同屏陈列四套分类选项，让一张示意图同时反映信号、数学性质、时间与端口。",
      lead:"给定信号、数学描述、时间性质与输入输出数量是四条独立的分类轴。",
      sections:[
        ["给定信号","恒值控制、随动控制、程序控制。"],
        ["数学描述","线性控制、非线性控制。"],
        ["时间性质","连续时间、离散时间。"],
        ["输入输出数量","单输入单输出、多输入多输出。"],
        ["本课程的对象","主要讨论恒值、线性、连续、单输入单输出系统。"]
      ],
      lab:IntroPages.sequenceSpecs[16]
    },
    33:{
      objective:"为稳、快、准分别设置一组可变参数，使三种性能同时有观察量和调节动作。",
      lead:"先判断稳定，再评价过渡过程的速度与稳态跟踪误差。",
      sections:[
        ["稳 · 稳定性","系统必须稳定，并要求动态过程平稳。拖动阻尼，在变化剧烈与平缓的响应之间比较。"],
        ["快 · 动态性能","比较相同给定下的响应速度。调小时间尺度会缩短过渡过程。"],
        ["准 · 稳态性能","用相同的斜坡给定比较跟踪，观察过渡过程结束后响应与给定之间的误差。"]
      ],
      lab:IntroPages.sequenceSpecs[17]
    },
    34:{
      objective:"以四阶段路线配动态验证图，拨动目标或时间参数后检查设计结果。",
      lead:"设计要满足给定的性能要求、跟踪输入并具有一定抗干扰能力。工程工作依次经历分析、设计、仿真、实现。",
      sections:[
        ["系统分析","建立模型，检查稳定性、动态和稳态性能。"],
        ["系统设计","确定系统结构和参数，选择校正方案。"],
        ["实验仿真","用仿真检验设计能否达到预先规定的要求。"],
        ["控制实现","完成工程实现、调试与运行。本课程重点在前三步的理论方法。"]
      ],
      lab:IntroPages.sequenceSpecs[18]
    },
    35:{
      objective:"将原小结的五项目标变成逐项可点选的复习检查表，保留下一章预告。",
      lead:"用五项目标回顾本章，从自动控制的定义到用方框图说明工作原理。",
      sections:[
        ["本章复习目标",objectives.map(([,title])=>title)],
        ["下一章","控制系统的数学模型，包括微分方程与传递函数。"]
      ],
      lab:{
        title:"逐项回顾本章目标",timed:false,controls:[choices("item","复习目标",objectives.map(([name])=>name))],
        draw(s){const [,title,body]=objectives[s.item];return {art:recap(s),detail:textPanel(title,body),note:note("下一章进入控制系统的数学模型。")};}
      }
    }
  });
})();
