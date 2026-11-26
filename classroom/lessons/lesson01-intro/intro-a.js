"use strict";

(() => {
  const { choices, range, escape: esc, readouts, note } = IntroWidgets;
  const { sequenceSpecs } = IntroPages;
  const ink = "#211d35";
  const muted = "#625b76";
  const accent = "#564c96";
  const highlight = "#eeebfb";

  const text = (x, y, value, { size = 20, color = ink, weight = 600, align = "start" } = {}) =>
    '<text x="'+x+'" y="'+y+'" font-size="'+size+'" fill="'+color+'" font-weight="'+weight+'" text-anchor="'+align+'">'+esc(value)+'</text>';
  const panel = (x, y, width, height, fill = "#fff", stroke = "#ded9e9") =>
    '<rect x="'+x+'" y="'+y+'" width="'+width+'" height="'+height+'" rx="14" fill="'+fill+'" stroke="'+stroke+'"/>';
  const diagram = (body, label, box = "0 0 720 290") =>
    '<svg viewBox="'+box+'" role="img" aria-label="'+esc(label)+'" xmlns="http://www.w3.org/2000/svg">'+body+'</svg>';
  const detail = (heading, body) =>
    '<section class="text-block"><h3>'+esc(heading)+'</h3><p>'+esc(body)+'</p></section>';

  const topics = [
    ["自动控制和自动控制技术", "概念、基本方式与典型应用", "概念与方式"],
    ["自动控制系统的组成及分类", "系统组成、常用术语与分类方法", "组成及分类"],
    ["自动控制理论概要", "发展脉络、分析方法与性能要求", "控制理论"],
    ["控制系统的计算机辅助分析与设计", "MATLAB / Simulink 支撑分析与设计", "计算机辅助"]
  ];
  const curriculum = [
    ["基础科学", "高等数学、工程数学、大学物理、物理实验、工程制图。"],
    ["技术科学", "电气工程导论、电路、电磁场、电子技术、电机学、自动控制理论、计算机软硬件技术。"],
    ["工程技术", "信号与系统、电力电子技术、电气工程基础、专业方向及选修课。"],
    ["工程实践", "课程实验、金工实习、电工实训、课程设计、生产实习、岗位实习、毕业设计。"]
  ];
  const disciplines = ["控制科学与工程", "电子科学与技术学科", "信息科学与技术", "管理及其它相关学科"];
  const applications = ["自动化控制", "信息化改造", "现代化管理", "商业化运营", "学科交叉"];
  const phases = [
    ["气动减速", "进入火星大气时速度约 4.8 km/s。气动减速将速度降至约 460 m/s 后，降落伞展开。"],
    ["伞系减速", "降落伞继续减速，速度降至 100 m/s 以下，随后转入动力下降。"],
    ["动力减速", "着陆平台与背罩、降落伞组合体分离，反推发动机工作。"],
    ["着陆缓冲", "离火星表面约 100 m 时悬停并探查障碍，选定落点后缓速下降，由着陆腿缓冲触地。"]
  ];
  const sensors = [
    ["激光雷达", "LiDAR", "三维点云感知、建图和障碍物检测。", "#297568"],
    ["摄像头", "Camera", "识别车道线、目标和交通标志。", "#4b5aa4"],
    ["毫米波雷达", "Radar", "中远距离目标检测、测速和全天候环境感知。", "#7756a5"],
    ["超声波雷达", "USS", "近距障碍物检测，辅助泊车及低速防撞。", "#8a542f"],
    ["GNSS / IMU", "", "提供定位、姿态与速度估计，并解算位置和航向。", "#316a8a"],
    ["车载计算平台", "", "融合多源传感器数据，执行感知算法并为决策提供信息。", "#6a5289"]
  ];

  function topicRoadmap(current) {
    const cards = topics.map(([, , short], i) => {
      const x = 30 + i * 170;
      const selected = i === current;
      return panel(x, 61, 150, 128, selected ? highlight : "#fff", selected ? accent : "#ded9e9") +
        text(x + 18, 97, String(i + 1).padStart(2, "0"), { size: 16, color: accent }) +
        text(x + 75, 139, short, { align: "middle", size: 22 }) +
        '<circle cx="'+(x + 75)+'" cy="189" r="4" fill="'+(selected ? accent : "#c6bfd7")+'"/>';
    }).join("");
    const links = [180, 350, 520].map(x =>
      '<path d="M'+x+' 126h18m-5-5 5 5-5 5" fill="none" stroke="#a79ebf" stroke-width="2"/>'
    ).join("");
    return diagram(cards + links, "第一章四个学习模块，当前 "+topics[current][0], "0 0 720 245");
  }

  function tierMap(current) {
    const rows = curriculum.map(([title], i) => {
      const y = 28 + 62 * i;
      const active = i === current;
      return '<circle cx="74" cy="'+(y+23)+'" r="7" fill="'+(active ? accent : "#c0b7d6")+'"/>' +
        panel(103, y, 548, 48, active ? highlight : "#fff", active ? accent : "#ded9e9") +
        text(124, y+31, "0"+(i+1), { size: 16, color: accent }) +
        text(177, y+32, title, { size: 23 }) +
        (i===1 ? panel(431, y+8, 196, 32, "#f3effb", "#d3c9eb") +
          text(529, y+30, "自动控制理论", { align:"middle", size: 17, color:accent }) : "");
    }).join("");
    return diagram('<path d="M74 51V237" stroke="#c0b7d6" stroke-width="2"/>'+rows, "从基础科学到工程实践，当前 "+curriculum[current][0]);
  }

  function disciplineMap(current) {
    const branches = disciplines.map((title, i) => {
      const y=29 + 62*i;
      const active=i===current;
      return '<path d="M241 142H300V'+(y+23)+'H339" fill="none" stroke="'+(active ? accent : "#cbc4db")+'" stroke-width="'+(active?3:1.5)+'"/>' +
        panel(339, y, 335, 46, active?highlight:"#fff", active?accent:"#ded9e9") +
        text(364, y+30, title, {size:20});
    }).join("");
    return diagram(branches+panel(34, 95, 207, 94, "#f4f0ff", "#b8aed8")+
      text(137, 133, "电气工程", {size:23,align:"middle"})+
      text(137, 162, "及其自动化", {size:23,align:"middle"}), "电气工程及其自动化的四个交叉方向");
  }

  function sensorView({ kind, position, distance }) {
    const [name,, , color] = sensors[kind];
    const vehicleX = 360;
    const vehicleY = 250;
    const targetX = vehicleX + position;
    const hood = 53;
    const targetY = vehicleY - hood - distance;
    const radius = [149, 174, 190, 72][kind];
    const halfAngle = [180, 35, 19, 55][kind];
    const distanceFromSensor = kind === 0 ? distance + hood : distance;
    const angle = Math.atan2(Math.abs(position), distanceFromSensor) * 180 / Math.PI;
    const covered = kind < 4 && Math.hypot(position, distanceFromSensor) <= radius && angle <= halfAngle;


    let field;
    if(kind===0){
      field = '<circle r="'+radius+'" fill="'+color+'" fill-opacity=".13" stroke="'+color+'" stroke-width="2" stroke-dasharray="6 6"/>';
    }else if(kind<4){
      const projectedX = Math.round(radius * Math.sin(halfAngle * Math.PI / 180));
      const projectedY = Math.round(radius * Math.cos(halfAngle * Math.PI / 180));
      field = '<path d="M0 0L'+(-projectedX)+' '+(-projectedY)+' A'+radius+' '+radius+' 0 0 1 '+projectedX+' '+(-projectedY)+'Z" fill="'+color+'" fill-opacity=".15" stroke="'+color+'" stroke-width="2" stroke-dasharray="6 6"/>';
    }else if(kind===4){
      field = '<circle r="55" fill="none" stroke="'+color+'" stroke-dasharray="6 6"/><path d="M0-39V-138m-10 11 10-11 10 11M46 0H82" fill="none" stroke="'+color+'" stroke-width="3"/>';
    }else{
      field = '<path d="M0-28V-104m0 53 -86-67M0-51l86-67" fill="none" stroke="'+color+'" stroke-width="3" stroke-dasharray="5 5"/><path d="M-6-104a6 6 0 1 0 12 0 6 6 0 1 0-12 0m-86-14a6 6 0 1 0 12 0 6 6 0 1 0-12 0m172 0a6 6 0 1 0 12 0 6 6 0 1 0-12 0" fill="'+color+'"/>';
    }
    const objectColor = covered ? "#257863" : "#9c6f44";
    const art = diagram(
      '<rect width="720" height="410" rx="18" fill="#ebe8f1"/><rect x="125" y="0" width="470" height="410" fill="#f6f4f9"/>'+
      '<path d="M164 0v410M556 0v410M360 0v410" fill="none" stroke="#d7d1e4" stroke-width="3" stroke-dasharray="11 14"/>'+
      '<g transform="translate('+vehicleX+' '+vehicleY+')"><g transform="translate(0 '+(kind>0&&kind<4 ? -hood : 0)+')">'+field+'</g>'+
      '<image href="../../../assets/classroom/sensor-car.webp" x="-48" y="-67" width="96" height="134" preserveAspectRatio="xMidYMid meet"/></g>'+
      '<circle cx="'+targetX+'" cy="'+targetY+'" r="10" fill="'+objectColor+'" stroke="white" stroke-width="3"/>'+
      text(targetX+17,targetY+6,"目标", { size:17,color:objectColor })+
      text(32,382,name, { size:20,color }),
      name+"感知示意，目标可移动", "0 0 720 410");
    const status = kind<4 ? (covered?"示意覆盖内":"示意覆盖外") : (kind===4?"定位与姿态":"多源数据融合");
    return { art, readouts:readouts([["当前通道",name],["当前状态",status]]),
      detail:detail(name, sensors[kind][2]), note:note("范围为教学示意，拖动目标比较横向位置和近远变化。") };
  }

  window.SourcePolish ??= {};
  Object.assign(window.SourcePolish, {
    7: {
      objective: "以四段路线呈现老师在本章建立总体认知框架的次序。",
      lead: "从概念和应用出发，依次连到系统组成、控制理论以及计算机辅助分析与设计。",
      sections: topics.map(([title, content])=>[title, content+"。"]),
      lab: {
        title: "本章四个模块", visual: "source-roadmap", timed: false,
        controls: [choices("topic", "学习模块", topics.map(item=>item[2]))],
        draw({topic}){
          const [title, summary] = topics[topic];
          return { art:topicRoadmap(topic), detail:detail(title,summary+"。"), note:note("选择一个模块，先看它在本章的位置。") };
        }
      }
    },
    8: {
      objective: "以四层培养路径定位自动控制理论，解释它怎样由数理基础通向工程实践。",
      lead: "自动控制理论位于技术科学层，上承数理基础，下接工程实践。",
      sections: curriculum,
      lab: {
        title: "电气工程及其自动化培养路径", visual: "source-curriculum", timed: false,
        controls: [choices("tier", "培养层次", curriculum.map(item=>item[0]),1)],
        draw({tier}){
          const [name,courses] = curriculum[tier];
          return { art:tierMap(tier), detail:detail(name,courses), note:note("点选层次，对照本层课程与控制理论的学习位置。") };
        }
      }
    },
    9: {
      objective: "将老师的专业应用链和四个交叉学科拆成两种读法，用分支高亮说明它们如何汇聚。",
      lead: "以控制科学为核心，将电子、信息和管理融入自动化系统。",
      sections: [
        ["应用链", applications],
        ["交叉学科", disciplines],
        ["课程联系", "控制科学组织控制任务。电子技术提供传感、驱动和接口，信息技术支持计算和通信，管理及其它相关学科支撑系统落地。"]
      ],
      lab: {
        title: "交叉学科关系", visual: "source-disciplines", timed: false,
        controls: [choices("link", "交叉方向", ["控制","电子","信息","管理及其它"])],
        draw({link}){
          const branch = ["围绕被控对象建立模型、分析系统并设计控制器。","用传感、信号调理和功率驱动把控制指令桥接到物理对象。","将感知数据转化为状态、通信和计算结果，供控制决策使用。","组织跨岗位协作，把自动化方案接入生产和运营。"][link];
          return { art:disciplineMap(link), detail:detail(disciplines[link],branch),
            note:note(applications.join(" → ")) };
        }
      }
    },
    11: {
      objective: "把给定值和被控量的时间响应并列，用一次可操作的变化落实定义中的三问。",
      lead: "自动控制是指无人直接参与时，由控制器使被控对象按预定规律运行，或使其被控量按预定要求变化。",
      sections: [
        ["谁控制", "控制器是实施自动调节的装置。"],
        ["控制谁", "被控对象可以是生产过程或工作机械。被控量是对象中需要随要求变化的量。"],
        ["按什么控制", "控制任务由预先规定的运行规律或给定要求确定。拖动给定线可比较给定与实际响应。"]
      ],
      lab: {
        ...sequenceSpecs[8],
        title: "调节给定并观察被控量",
        draw(state){
          const model = sequenceSpecs[8].draw(state);
          return { ...model, detail:detail("给定与实际量", "横向移动时间游标，比较同一时刻的给定和被控量。") };
        }
      }
    },
    12: {
      objective: "并列展示无人机飞行与天问一号软着陆，按顺序直接读出四个着陆阶段。",
      lead: "从无人机自主飞行到火星软着陆，机载控制系统持续依据状态作出调节。",
      sections: [
        ["无人机", "阅兵公开亮相的侦察无人机是自动控制在航空系统中的应用实例。机载系统根据测得的状态调节姿态，使无人机沿预定航线飞行。插图展示通用无人机外形。"],
        ["天问一号的全自主着陆", "进入、下降与着陆约持续 9 分钟，其中依次使用气动减速、伞系减速和动力减速，随后缓冲触地。"],
        ...phases
      ],
      gallery: {
        figures: [
          {
            src: "autonomous-flight.webp",
            alt: "一架通用固定翼无人机在地面上空飞行",
            title: "无人机自主飞行",
            description: "机载系统根据测得的状态调节姿态，使无人机沿预定航线飞行。"
          },
          {
            src: "mars-powered-descent.webp",
            alt: "火星着陆平台展开四条着陆腿，正在向火星地面下降",
            title: "天问一号火星软着陆",
            description: "从进入火星大气到软着陆，约 9 分钟全程自主完成。"
          }
        ],
        steps: phases.map(([stage], i)=>[stage,["约 4.8 km/s → 460 m/s","低于 100 m/s","反推发动机减速","着陆腿缓冲触地"][i]])
      }
    },
    13: {
      objective: "把原有的六个感知部件转化为可切换通道，在同一车身和道路上比较它们提供的不同信息。",
      lead: "感知层为控制决策提供环境与车辆状态信息，多源感知覆盖不同任务。",
      sections: sensors.map(([name, english, description])=>[english?name+"（"+english+"）":name,description]),
      lab: {
        title: "智能驾驶感知系统", visual: "source-sensors", timed: false, draggable: "position",
        controls: [
          choices("kind", "感知通道", ["激光雷达","摄像头","毫米波","超声波","GNSS / IMU","计算平台"]),
          range("position","目标横移",-150,150,1,31), range("distance","目标远近",15,157,1,92)
        ],
        draw: sensorView
      }
    },
    14: {
      objective: "保持老师随堂填空的题干和一分规则，在填写后解释术语。",
      lead: "辨认控制器直接作用的对象。",
      sections: [["填空题", "1 分。完成后核对自动控制定义中对象与被控量的区别。"]],
      quiz: {
        prompt: "自动控制是指在无人直接参与的情况下，利用控制器使____自动地按预先规定的规律运行，或使其被控量按预定要求变化的性能或过程。",
        accepted: ["被控对象", "生产过程或工作机械"],
        feedback: "被控对象（生产过程或工作机械）。被控量是对象中需要按要求变化的量。"
      }
    }
  });
})();
