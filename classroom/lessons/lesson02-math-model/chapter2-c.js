"use strict";
(() => {
  const { choices, range, readouts, escape } = IntroWidgets;
  const color={ink:"#31284a",soft:"#766b8e",line:"#cec5e0",paper:"#fbf9ff",active:"#69499d",accent:"#985226"};
  const text=(x,y,value,size=19,fill=color.ink,align="middle")=>
    `<text x="${x}" y="${y}" text-anchor="${align}" fill="${fill}" font-size="${size}" font-weight="650">${escape(value)}</text>`;
  const path=(d,ink=color.soft,w=2.4,marker="")=>
    `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${marker?` marker-end="url(#${marker})"`:""}/>`;
  const frame=(body,name)=>`<svg viewBox="0 0 760 310" role="img" aria-label="${escape(name)}">${body}</svg>`;
  const detail=(title,body)=>`<section class="text-block"><h3>${escape(title)}</h3><p>${escape(body)}</p></section>`;
  const box=(x,y,w,h,fill="#fcfbfe",stroke=color.line)=>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${fill}" stroke="${stroke}"/>`;
  const marker=(id,ink)=>`<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 10 5 0 10z" fill="${ink}"/></marker>`;
  const point=(label,x,y,type="node",w=92)=>({label,x,y,type,w});
  const rail=(labels,y=150)=>labels.map((name,i)=>point(name,59+i*642/(labels.length-1),y));
  const edge=(id,a,b,name="",bend=0)=>({id,a,b,name,bend});
  function flow(nodes,edges,focus,title){
    const defs="<defs>"+marker("graph-edge",color.soft)+marker("graph-focus",color.active)+marker("graph-accent",color.accent)+"</defs>";
    const [first,second]=Array.isArray(focus[0])?focus:[focus,[]];
    const wires=edges.map(({id,a,b,name,bend})=>{
      const start=nodes[a],end=nodes[b];
      const index=first.includes(id)?0:second.includes(id)?1:-1;
      const ink=index===0?color.active:index>0?color.accent:color.soft;
      const klass=index===0?"graph-focus":index>0?"graph-accent":"graph-edge";
      const left=start.x,right=end.x,dir=right>=left?1:-1;
      const dx=p=>p.type==="block"?p.w/2:p.type==="port"?0:10;
      const dy=p=>p.type==="block"?18:p.type==="port"?0:10;
      let d,x,y;
      if(a===b){
        d=`M${left-8} ${start.y-5}C${left-60} ${start.y-88} ${left+60} ${start.y-88} ${left+8} ${start.y-5}`;
        x=left;y=start.y-74;
      }else if(bend){
        const offset=Math.sign(bend);
        const p=start.y+offset*dy(start),q=end.y+offset*dy(end);
        d=`M${left} ${p}Q${(left+right)/2} ${(p+q)/2+bend} ${right} ${q}`;
        x=(left+right)/2;y=(p+q+bend)/2+(bend<0?-9:20);
      }else{
        d=`M${left+dir*dx(start)} ${start.y}L${right-dir*dx(end)} ${end.y}`;
        x=(left+right)/2;y=(start.y+end.y)/2-14;
      }
      return path(d,ink,index>=0?3.5:2,klass)+(name?text(x,y,name,20,ink):"");
    }).join("");
    const points=nodes.map(({label,x,y,type,w},i)=>{
      if(type==="port")return text(x,y-13,label,19);
      if(type==="block")return box(x-w/2,y-18,w,36,color.paper,"#9b8dba")+text(x,y+6,label,19);
      return `<circle cx="${x}" cy="${y}" r="${type==="sum"?14:9}" fill="${first.includes("node-"+i)?"#d5eee2":"#fff"}" stroke="${first.includes("node-"+i)?"#17684d":"#8f7aaa"}" stroke-width="${first.includes("node-"+i)?4:2}"/>`+
        text(x,y+(type==="sum"?6:30),label,type==="sum"?18:17);
    }).join("");
    return frame(defs+wires+points,title);
  }
  function walk(title,stages,picture){
    return {
      title,timed:false,
      controls:[IntroWidgets.stages("step","查看步骤",stages.map(([name])=>name))],
      draw({step}){
        const [name,reason,focus=[]]=stages[step];
        return {art:picture(step,focus),detail:detail(name,reason),readouts:readouts([["步骤",`${step+1} / ${stages.length}`]])};
      }
    };
  }
  const port=(name,x)=>point(name,x,150,"port");
  const block=(name,x,w)=>point(name,x,150,"block",w);
  const sum=(name,x)=>point(name,x,150,"sum");
  const chainEdges=names=>names.map((name,i)=>edge(i,i,i+1,name));
  const formula=(title,copy)=>[title,copy];

  function mergePicture(i,focus,revealed=false){
    const lines=[
      {nodes:[port("R",24),sum("±",104),block("G₁",226),sum("+",343),block("G₂",478),port("C",715)],hi:edge("b",0,3,"G₃",-173),lo:edge("h",5,1,"−H₁",205)},
      {nodes:[port("R",24),sum("±",104),block("G₁",226),block("G₂",347),sum("+",523),port("C",715)],hi:edge("b",0,4,i===1&&!revealed?"G₃ · ?":"G₃G₂",-173),lo:edge("h",5,1,"−H₁",205)},
      {nodes:[port("R",24),block("G₁",146),sum("+",320),sum("±",398),block("G₂",551),port("C",715)],hi:edge("b",0,2,"G₃",-173),lo:edge("h",5,3,"−G₁H₁",205)}
    ];
    const row=lines[i===0?0:i<3?1:2];
    return flow(row.nodes,[...chainEdges(["","","","",""]),row.hi,row.lo],focus,"相加点移动前后结构");
  }
  function decomposePicture(i,focus){
    const nodes=[port("R",28),sum("±",104),block("G₁",191,60),block("G₂",319,60),sum("±",427),block("G₃",511,60),block("G₄",612,60),port("C",726),point("汇合点",264,65)];
    const before=[edge("from",2,8,"1"),edge("couple",7,8,"H₃",-98),edge("return",8,1,"−H₁")];
    const after=[edge("inside",2,1,"−H₁",119),edge("outer",7,1,"−H₃H₁",215)];
    return flow(i<2?nodes:nodes.slice(0,8),[...chainEdges(["","","","","","",""]),edge("inner",7,4,"−H₃",81),...(i<2?before:after)],focus,"交叉反馈与作用分解");
  }

  const reduce37=[
    ["观察原图","G₄ 和 G₅ 并联回到内环相加点，G₆ 反馈到外环相加点。",[]],
    ["并联反馈","G₄ 与 G₅ 同向并联，先合为 G₄+G₅。",["inner","parallel"]],
    ["化为等效内环","G₂G₃ 与 G₄+G₅ 形成负反馈。等效为 G₂G₃/[1+G₂G₃(G₄+G₅)]。",[2]],
    ["连接 G₁","G₁ 与内环等效块串联，分子乘 G₁。",[1]],
    ["闭合外环","Φ=C/R，分子 G₁G₂G₃；分母 1+G₂G₃(G₄+G₅)+G₁G₂G₃G₆。",[0,1]]
  ];
  function reducePicture(step,focus){
    if(step>=4)return flow([port("R(s)",64),block("Φ(s)",380,132),port("C(s)",696)],chainEdges(["",""]),focus,"逐环化简后的等效传递函数");
    if(step>=2){
      const nodes=step===2?[port("R(s)",37),sum("±",131),block("G₁",257),block("等效内环",491,144),port("C(s)",712)]
        :[port("R(s)",37),sum("±",131),block("G₁ × 等效内环",418,213),port("C(s)",712)];
      return flow(nodes,[...chainEdges(step===2?["","","",""]:["","",""]),edge("outer",nodes.length-1,1,"−G₆",203)],focus,"保留外环的化简结果");
    }
    const nodes=[port("R(s)",35),sum("±",114),block("G₁",225,65),sum("±",334),block("G₂",449,65),block("G₃",550,65),port("C(s)",707)];
    const backs=step===0?[edge("inner",6,3,"−G₄",118),edge("parallel",6,3,"−G₅",175)]:[edge("inner",6,3,"−(G₄+G₅)",145)];
    return flow(nodes,[...chainEdges(["","","","","",""]),...backs,edge("outer",6,1,"−G₆",239)],focus,"例二之十多环结构");
  }

  function rcPicture(step,focus){
    if(step===0){
      return frame(path("M47 126H150 M226 126H408 M484 126H714 M337 126V179 M337 193V248 M606 126V179 M606 193V248 M47 248H714","#706385")+
        path("M317 178H357 M317 193H357 M586 178H626 M586 193H626","#706385")+
        box(150,105,76,42)+box(408,105,76,42)+text(188,134,"R₁")+text(446,134,"R₂")+
        text(69,103,"Uᵢ")+text(337,103,"U")+text(706,103,"Uₒ")+text(293,192,"C₁")+text(563,192,"C₂"),
      "两级 RC 梯型电路");
    }
    if(step===3)return flow([port("Uᵢ",72),block("Φ(s)",380,122),port("Uₒ",686)],chainEdges(["",""]),focus,"两级 RC 整体传递函数");
    const nodes=[port("Uᵢ",29),sum("±",99),block("1/R₁",188,70),sum("±",271),block("1/(C₁s)",376,95),sum("±",478),block("1/R₂",567,70),block("1/(C₂s)",649,78),port("Uₒ",728)];
    const returns=step===1?[edge("first",4,1,"−1",-151),edge("load",6,3,"−1",173),edge("second",8,5,"−1",-104)]
      :[edge("first",4,1,"−1",-151),edge("load",8,1,"−R₁C₂s",207),edge("second",8,5,"−1",-104)];
    return flow(nodes,[...chainEdges(["","","","","","","",""]),...returns],focus,"两级 RC 网络的信号与反馈");
  }

  const closedBase=[port("R(s)",37),sum("±",149),block("G₁",294),sum("+",426),block("G₂",561),port("C(s)",714),point("N(s)",426,62,"port")];
  const closedEdges=[...chainEdges(["","E(s)","","",""]),edge("disturb",6,3),edge("feedback",5,1,"−H",190)];
  const mode40=[
    ["原方程组","a x₀−x₁+b x₂=0；c x₀+d x₁−x₂=0。",[]],
    ["因果式 (a)","x₁=a x₀+b x₂；x₂=c x₀+d x₁。",["a","b","c","d"]],
    ["因果式 (b)","d、b 非零时，x₁=−(c/d)x₀+(1/d)x₂；x₂=−(a/b)x₀+(1/b)x₁。",["a","b","c","d"]]
  ];
  function flow40(step,focus){
    const names=step===2?["−c/d","1/d","−a/b","1/b"]:["a","b","c","d"];
    return flow(rail(["x₀","x₁","x₂"]),[edge("a",0,1,names[0]),edge("b",2,1,names[1],-150),edge("c",0,2,names[2],177),edge("d",1,2,names[3])],focus,"同一方程组的信号流图");
  }

  const terms41=[
    ["源 / 汇","x₀ 只有出支路，是源节点。x₄ 只有入支路，是汇节点。",["node-0","node-4"]],
    ["混合节点","x₁、x₂、x₃ 都有入支路和出支路。节点值等于各入支路贡献之和。",["node-1","node-2","node-3"]],
    ["出 / 入支路","以 x₁ 为例，a 指向 x₁，是入支路。b 离开 x₁，是出支路。",[["a","node-1"],["b"]]],
    ["开通道 / 前向通道","从 x₀ 经 a、b、c、d 到 x₄，各节点只经过一次。这条开通道从源到汇，是前向通道。",["a","b","c","d"]],
    ["闭通道 / 自回环","e 从 x₂ 出发又回到 x₂，只经过这一个节点，是自回环。",["e","node-2"]],
    ["互不接触","e 只经过 x₂，f 只经过 x₃。两个回环没有公共节点，互不接触。",[["e","node-2"],["f","node-3"]]],
    ["传输（增益）","沿前向通道将支路增益相乘，得到 abcd。自回环 e 的回环增益就是 e。",["a","b","c","d"]]
  ];
  const path43=chainEdges(["a","b","c","d","e","j"]);
  const loops43=[
    edge("bi",2,1,"i",-100),edge("ch",3,2,"h",-100),edge("dg",4,3,"g",-100),edge("ef",5,4,"f",-100)
  ];
  const modes43=[
    ["先定位节点","x₀ 是源节点，x₆ 是汇节点，x₁…x₅ 为混合节点。",[]],
    ["前向通道","只有一条从源到汇且节点不重复的通道，P=abcdej。",[0,1,2,3,4,5]],
    ["闭通道","四个相邻小环的传输为 bi、ch、dg、ef。",["bi","ch","dg","ef"]],
    ["互不接触组合","bi 与 dg、bi 与 ef、ch 与 ef 互不接触。dg 与 ef 共用 x₄。",[["bi",1],["dg",3]]],
    ["普通通道辨析","abcde 只到 x₅；fghi 沿回支路向左，也不是源→汇。",[0,1,2,3,4]]
  ];

  const rules44=[
    ["串联合并","同一条路径的接续支路，其传输相乘；得到 ab。"],
    ["并联合并","相同起点、终点的两支路，其传输相加；得到 a+b。"],
    ["混合节点消除","将输入 a、b 与输出 c 分别配对，得到 ac、bc。"],
    ["回路消除","通道 ab 与增益 ±bc 的回环等效为 ab/(1∓bc)。"],
    ["自回路消除","通道 a 和增益 ±b 的自回环等效为 a/(1∓b)。"]
  ];
  function rulePicture(rule,after) {
    if(after){
      if(rule===2)return flow([point("x₁",112,91),point("x₂",112,207),point("y",648,151)],[edge("a",0,2,"ac"),edge("b",1,2,"bc")],["a","b"],"混合节点消除后");
      return flow(rail(["输入","输出"]),[edge("result",0,1,["ab","a+b","ac、bc","ab/(1∓bc)","a/(1∓b)"][rule])],["result"],"等效合并后的支路");
    }
    if(rule===0)return flow(rail(["输入","中间","输出"]),chainEdges(["a","b"]),[0],"串联合并前");
    if(rule===1)return flow(rail(["输入","输出"]),[edge("a",0,1,"a",-133),edge("b",0,1,"b",133)],["a","b"],"并联合并前");
    if(rule===2)return flow([point("x₁",65,94),point("x₂",65,209),point("混合节点",359,151),point("y",678,151)],[edge("a",0,2,"a"),edge("b",1,2,"b"),edge("c",2,3,"c")],["c"],"混合节点消除前");
    if(rule===3)return flow(rail(["输入","中间","输出"]),[...chainEdges(["a","b"]),edge("loop",2,1,"±c",160)],["loop"],"回路消除前");
    return flow(rail(["输入","输出"]),[edge("a",0,1,"a"),edge("self",1,1,"±b")],["self"],"自回环消除前");
  }

  function convert45(step,focus){
    if(step===0){
      const nodes=[port("R",22),sum("±",100),sum("+",176),block("G₁",283,78),sum("±",391),block("G₂",478,75),block("G₃",595,75),port("C",734)];
      return flow(nodes,[...chainEdges(["","","","","","",""]),edge("h1",5,2,"+H₁",125),edge("h2",7,4,"−H₂",-168),edge("one",7,1,"−1",217)],focus,"例二之十三方框图");
    }
    const nodes=rail(["1","2","3","5","6","7","C(s)"]);
    return flow(nodes,[...(step>=2?chainEdges(["1","1","G₁","G₂","G₃","1"]):[]),
      ...(step>=3?[edge("h1",4,2,"+H₁",-152),edge("h2",5,3,"−H₂",112),edge("one",5,1,"−1",208)]:[])],focus,"例二之十三信号流图");
  }
  const m47Nodes=rail(["R(s)","n₁","n₂","n₃","n₄","C(s)"]);
  const m47Edges=[
    ...chainEdges(["G₁","G₂","G₃","G₄","G₅"]),
    edge("g6",1,3,"G₆",-116),edge("g7",2,5,"G₇",-218),
    edge("h1",4,3,"−H₁",116),edge("h2",5,1,"−H₂",237)
  ];
  const p471=[0,1,2,3,4],p472=[0,"g6",3,4],p473=[0,1,"g7"];
  const l471=[3,"h1"],l472=[1,"g7","h2"],l473=["g6",3,4,"h2"],l474=[1,2,3,4,"h2"];
  const formula47="Φ=[G₁G₂G₃G₄G₅+G₁G₆G₄G₅+G₁G₂G₇(1+G₄H₁)]/[1+G₄H₁+G₂G₇H₂+G₆G₄G₅H₂+G₂G₃G₄G₅H₂+G₄H₁G₂G₇H₂]";
  const mason47=[
    ["先观察图","由 R(s) 到 C(s)，依次寻找前向通道和回环。"],
    ["前向 P₁","P₁=G₁G₂G₃G₄G₅。",p471],["前向 P₂","P₂=G₁G₆G₄G₅。",p472],["前向 P₃","P₃=G₁G₂G₇。",p473],
    ["汇总前向通道","共有三条。每条传输等于其支路增益相乘。",p471],
    ["回环 L₁","L₁=−G₄H₁。",l471],["回环 L₂","L₂=−G₂G₇H₂。",l472],
    ["回环 L₃","L₃=−G₆G₄G₅H₂。",l473],["回环 L₄","L₄=−G₂G₃G₄G₅H₂。",l474],
    ["互不接触组合","仅 L₁ 与 L₂ 互不接触，乘积 G₄H₁G₂G₇H₂。",[l471,l472]],
    ["组装特征式","Δ=1−(L₁+L₂+L₃+L₄)+L₁L₂。",[l471,l472]],
    ["各前向通道的余子式","Δ₁=Δ₂=1，P₃ 仅保留 L₁，Δ₃=1+G₄H₁。",[p473,l471]],
    ["组装分子","分子为 P₁+P₂+P₃(1+G₄H₁)。",p473],
    ["最终传输","Φ=[P₁+P₂+P₃(1+G₄H₁)]/Δ。展开式在本页推导中。",p471]
  ];

  const m48Nodes=[port("R(s)",24),sum("±",103),sum("±",190),block("G₁",264,56),block("G₂",352,56),sum("±",461),block("G₃",573,81),port("C(s)",724),point("●",320,229)];
  const m48Edges=[
    ...chainEdges(["","","","","","",""]),edge("g4",1,5,"G₄",-224),edge("h1a",3,8,"1"),edge("h1b",8,2,"−H₁",53),
    edge("h3",7,8,"+H₃",50),edge("hLocal",7,5,"−H₃",118),edge("return",7,1,"−1",232)
  ];
  const p481=[0,1,2,3,4,5,6],p482=[0,"g4",5,6];
  const l481=[2,"h1a","h1b"],l482=[5,6,"hLocal"],l483=[2,3,4,5,6,"h3","h1b"],l484=["g4",5,6,"return"],l485=[1,2,3,4,5,6,"return"];
  const formula48="Φ=[G₁G₂G₃+G₄G₃(1+G₁H₁)]/[1+G₁H₁+G₃H₃+G₁G₂G₃H₃H₁+G₄G₃+G₁G₂G₃+G₁G₃H₁H₃+G₁G₃G₄H₁]";
  const mason48=[
    ["先在图上找路径","先数前向通道，再查回环与公共节点。"],
    ["主链 P₁","P₁=G₁G₂G₃。",p481],["上支路 P₂","P₂=G₄G₃。",p482],
    ["汇总前向通道","两条路径均经下游环节 G₃ 到达输出。",p482],
    ["回环 L₁","L₁=−G₁H₁。",l481],["回环 L₂","L₂=−G₃H₃。",l482],
    ["回环 L₃","L₃=−G₁G₂G₃H₃H₁。",l483],["回环 L₄","L₄=−G₄G₃。",l484],
    ["回环 L₅","L₅=−G₁G₂G₃。",l485],
    ["互不接触 L₁L₂","G₁G₃H₁H₃。",[l481,l482]],["互不接触 L₁L₄","G₁G₃G₄H₁。",[l481,l484]],
    ["余子式","Δ₁=1；Δ₂=1+G₁H₁。",[p482,l481]],
    ["总传输","分子 P₁Δ₁+P₂Δ₂；分母为全图 Δ。展开式在本页推导中。",p481]
  ];

  const nodes50=[point("X₁",55,174),point("X₂",221,174),point("X₃",533,174),point("X₄",705,174),point("X₅",378,102)];
  const edges50=[edge("a",0,1,"a"),edge("e",1,2,"e"),edge("f",2,3,"f"),edge("b",1,4,"b"),edge("c",4,2,"c"),
    edge("g",2,1,"−g",152),edge("d",4,4,"−d")];
  const mason50=[
    ["观察图","由 X₁ 求到 X₄ 的总传输。"],
    ["前向 P₁","P₁=aef。",["a","e","f"]],["前向 P₂","P₂=abcf。",["a","b","c","f"]],
    ["自回环 L₁","L₁=−d。",["d"]],["回环 L₂","L₂=−eg。",["e","g"]],["回环 L₃","L₃=−bcg。",["b","c","g"]],
    ["互不接触","只有 L₁L₂ 互不接触，乘积 deg。",["d","e","g"]],
    ["余子式","P₁ 避开 X₅ 的自回环，Δ₁=1+d；Δ₂=1。",["a","e","f","d"]],
    ["核对结果","X₄/X₁=[aef(1+d)+abcf]/[1+d+eg+bcg+deg]。",["a","e","f"]]
  ];
  function furnace() {
    const nodes=[
      point("加热炉",551,148,"block",124),
      point("Σ",417,148,"sum"),
      point("温度给定",47,242,"port"),
      point("TC",214,242,"block",72),
      point("温度输出",715,148,"port"),
      point("TT",611,243,"block",67),
      point("FT",203,65,"block",68),
      point("FFC",347,65,"block",72),
      point("物料流量",51,65,"port")
    ];
    return flow(nodes,[
      edge("fuel",1,0,"燃料阀"),edge("out",0,4),edge("give",2,3),
      edge("tc",3,1),edge("tt",4,5,"测温"),edge("ttc",5,3,"反馈"),
      edge("ft",8,6),edge("ffc",6,7),edge("ff",7,1)
    ],["ft","ffc","ff","tt","ttc","tc"],"温度反馈和物料流量前馈在加热炉燃料阀前汇合");
  }
  const checklist=[
    ["物理系统","辨明受控对象与输入输出，再选取物理定律。"],
    ["微分方程","按物理关系列微分方程，考察动态特性，并可利用拉氏变换求解。"],
    ["传递函数","零初始条件下求输出与输入拉氏变换之比，结合典型环节理解物理意义。"],
    ["方框图 / 流图","用结构图表达内部关系，经等效化简或梅逊公式求总传输。"],
    ["等效模型","在相应假设下，微分方程、传递函数、结构图表达同一对象；第三章用它们分析时域响应。"]
  ];

  window.SourcePolishCh2??={};
  Object.assign(window.SourcePolishCh2,{
    35:{
      objective:"保留原页课堂判断，把“保持等效”与“能否继续化简”拆成两个连续观察动作。",
      lead:"相加点移过一个环节后，即使补偿正确，也要检查移动是否使下一步化简更容易。",
      sections:[
        formula("课堂投票","第二个相加点越过 G₂ 后，能否帮助继续化简？答案 B，不能。"),
        formula("等效但不便化简","跨过 G₂ 后，G₃ 支路串入 G₂ 保持等效。G₂ 重复，仍无法继续逐环化简。"),
        formula("向同类移动","把第一个相加点前移跨过 G₁；H₁ 支路乘 G₁，随后把两个相邻相加点合并。分支点也以向其他分支点靠拢为宜。")
      ],
      quiz:{prompt:"把第二个相加点从 G₂ 前移到 G₂ 后，并给支路作等效补偿，能否继续逐环化简？",art:mergePicture(0,["b"]),answerArt:mergePicture(2,["b"]),options:["能","不能"],answers:[1],feedback:"补入 G₂ 可保证等效，但会使 G₂ 重复。把相加点向另一个相加点靠拢，才便于合并。"},
      lab:{
        title:"相加点移动对照",timed:false,
        controls:[IntroWidgets.stages("step","查看步骤",["原图","判断右移","核对等效","相加点靠拢"])],
        draw(s){
          const stages=[
            ["原图","第二个相加点位于 G₂ 前，G₃ 接入这里。",["b"]],
            ["先判断右移方案","将第二个点移到 G₂ 后，G₃ 支路要补什么？能否继续化简？",["b"]],
            ["核对等效与化简","补 G₂ 确实等效，但结构仍难逐环合并。",["b"]],
            ["相加点靠拢","把第一个点移动过 G₁，在 H₁ 支路补 G₁，再合并相邻相加点。",["h","b"]]
          ];
          const step=s.step;
          const [title,body,ids]=stages[step];
          return {art:mergePicture(step,ids),detail:detail(title,body),readouts:readouts([["步骤",(step+1)+" / 4"]])};
        }
      }
    },
    36:{
      objective:"在同一个信号图上追踪共用支路，通过切换前后看清两个来源怎样拆开。",
      lead:"交叉反馈先按信号来源分解。分解后可以从内环向外环依次化简。",
      sections:[
        formula("原结构","H₃ 的输出进入 H₁ 的引出支路，两环共用一段通道，不能把其中一环单独合并。"),
        formula("反馈量分解","H₁×(G₁ 后信号)+H₃H₁ C。若画到第一个相加点的输入端，分别作为 −H₁ 和 −H₃H₁ 进入负端。"),
        formula("等效结果","局部 H₁ 环、局部 H₃ 环、外部 H₃H₁ 环可由内向外逐环处理。")
      ],
      lab:walk("拆分共用反馈支路",[
        ["交叉反馈","G₁ 后的信号进入汇合点。H₃ 的输出也进入同一个汇合点。",["from","couple"]],
        ["按来源写式","设 G₁ 后的信号为 x，汇合点为 x + H₃C。经 H₁ 返回的反馈量为 H₁x + H₁H₃C。",["return","couple"]],
        ["分成两条支路","H₁ 取自 G₁ 后；H₃H₁ 取自输出 C。两个位置分别送回第一个相加点。",["inside","outer"]]
      ],decomposePicture)
    },
    37:{
      objective:"保留例 2-10 四步顺序，以高亮待合并支路和即时等效块串起推导。",
      lead:"先并联合并，再闭合内环，接上 G₁，最后闭合外环。",
      sections:reduce37.slice(1).map(([title,body])=>[title,body]),
      math:[String.raw`\Phi(s)=\frac{G_1G_2G_3}{1+G_2G_3(G_4+G_5)+G_1G_2G_3G_6}`],
      lab:walk("例 2-10 逐环化简",reduce37,reducePicture)
    },
    38:{
      objective:"在电路、直接方框图和等效方框图间逐步切换，保留 R₁、C₂s 所表达的负载耦合。",
      lead:"第二级 RC 会从第一级取电流。级间负载必须保留在等效模型中。",
      sections:[
        formula("电路方程",["I₁=(Uᵢ−U)/R₁","I=I₁−I₂","U=I/(C₁s)","I₂=(U−Uₒ)/R₂","Uₒ=I₂/(C₂s)"]),
        formula("等效移动","相加点靠向相加点，分支点靠向分支点。移动引入 R₁、C₂s 补偿环节，保留两级之间的负载。"),
        formula("整体传输","Φ=1/[R₁R₂C₁C₂s²+(R₁C₁+R₂C₂+R₁C₂)s+1]。也可用复阻抗法验证。")
      ],
      math:[String.raw`\frac{U_o(s)}{U_i(s)}=\frac{1}{R_1R_2C_1C_2s^2+(R_1C_1+R_2C_2+R_1C_2)s+1}`],
      lab:walk("例 2-11 两级 RC",[
        ["先读原电路","两个电阻串在主支路上，电容分别从级间节点和输出节点接地。"],
        ["从方程画方框图","级间相加点计算 I=I₁−I₂。I₂ 是跨级耦合的来源。",["load"]],
        ["按同类节点移动","在跨级负载路径上补偿 R₁ 与 C₂s，得到等效图。",["load"]],
        ["逐环化简","分母的一次项还包含额外的 R₁C₂，体现第二级负载。"]
      ],rcPicture)
    },
    39:{
      objective:"以同一闭环结构分别高亮给定路径和扰动路径，显出四种传递函数的公共分母。",
      lead:"从给定或扰动看系统，分子不同，负反馈闭环决定共同分母。",
      sections:[
        formula("给定 R 作用","N=0 时，C/R=G₁G₂/(1+G₁G₂H)，E/R=1/(1+G₁G₂H)。单位反馈下 E/R=1−C/R。"),
        formula("扰动 N 作用","R=0 时，C/N=G₂/(1+G₁G₂H)，E/N=−G₂H/(1+G₁G₂H)。"),
        formula("两个输入同时作用","C=[G₁G₂·R+G₂·N]/(1+G₁G₂H)。特征方程与外部输入无关，环路含分母时应整理为闭环特征多项式。")
      ],
      math:[String.raw`C(s)=\frac{G_1G_2}{1+G_1G_2H}R(s)+\frac{G_2}{1+G_1G_2H}N(s)`],
      lab:{
        title:"切换给定和扰动",timed:false,controls:[choices("mode","输入信号",["仅给定 R","仅扰动 N","两个输入"])],
        draw(s){
          const names=["给定通道","扰动通道","线性叠加"];
          const effects=["C/R=G₁G₂/(1+G₁G₂H)；E/R=1/(1+G₁G₂H)。","C/N=G₂/(1+G₁G₂H)；E/N=−G₂H/(1+G₁G₂H)。","C=(G₁G₂R+G₂N)/(1+G₁G₂H)。"];
          return {art:flow(closedBase,closedEdges,[[0,1,2,3,4],["disturb",3,4],[0,1,2,3,4,"disturb"]][s.mode],"给定与扰动输入进入同一负反馈系统"),detail:detail(names[s.mode],effects[s.mode])};
        }
      }
    },
    40:{
      objective:"在原方程与两种因果式之间切换，直接对照同一变量节点的四条支路。",
      lead:"信号流图用有向支路表达线性代数关系，改写因果式可以得到不同图形。",
      sections:[
        ...mode40.map(([title,body])=>[title,body]),
        formula("读图规则","圆表示变量节点，箭头表示支路，在线上标注传输。节点值等于各入支路起始信号乘传输后的和。")
      ],
      lab:walk("方程怎么变成流图",mode40,flow40)
    },
    41:{
      objective:"把术语表关联到流图中的例子，用同一张图依次定位节点类型、路径和回环。",
      lead:"读懂节点与有向支路，是辨认前向通道和回环的基础。",
      sections:terms41.map(([name,content])=>[name,content]),
      lab:walk("在流图上定位术语",terms41,(i,ids)=>flow(rail(["x₀","x₁","x₂","x₃","x₄"]),
        [edge("a",0,1,"a"),edge("b",1,2,"b"),edge("c",2,3,"c"),edge("d",3,4,"d"),edge("e",2,2,"e"),...(i===5?[edge("f",3,3,"f")]:[])],ids,"五节点流图的术语位置"))
    },
    42:{
      objective:"选中一类元素，再用方框图和信号流图的并排小图说明映射关系。",
      lead:"输入、输出、相加与引出、传递环节，在信号流图中分别有对应表示。",
      sections:[
        formula("端点","R(s) 对应仅有出支路的源节点；C(s) 对应仅有入支路的汇节点。"),
        formula("相加点＋引出点","在信号流图中合成一个混合节点，先求代数和再引向各输出支路。"),
        formula("环节","G(s) 对应一条支路的传输，原相加点的正负作用由相应入支路增益携带。")
      ],
      lab:{
        title:"四类结构对应",timed:false,controls:[choices("mode","对应元素",["输入","输出","混合节点","传递环节"])],
        draw(s){
          const nodes=[
            point("方框图",185,58,"port"),point("信号流图",572,58,"port"),
            point("R(s)",s.mode===0?68:52,150,"port"),point(s.mode===2?"Σ":"G(s)",180,150,s.mode===2?"sum":"block"),
            point("C(s)",302,150,"port"),point("x₀",418,150),point("x₁",554,150),point("xₙ",701,150)
          ];
          const ids=[["in","si"],["out","so"],["in","out","si","so"],["in","so"]][s.mode];
          const definition=["只有出支路","只有入支路","入支路信号先相加，再从节点引出。","环节转成有向支路，传递函数是支路增益。"][s.mode];
          return {art:flow(nodes,[edge("in",2,3),edge("out",3,4),edge("si",5,6,s.mode===3?"":"1"),edge("so",6,7,s.mode===3?"G(s)":"1"),
            ...(s.mode===2?[edge("branch",4,3,"−H",156),edge("feedback",7,6,"−H",156)]:[])],ids,"同一元素在方框图与信号流图中的位置"),
            detail:detail(["输入 → 源节点","输出 → 汇节点","相加与引出 → 混合节点","环节 → 支路增益"][s.mode],definition)};
        }
      }
    },
    43:{
      objective:"允许逐项追踪 X₀ 到 X₆ 的真实主链与四条回支路，检查回环是否共用节点。",
      lead:"同一张图里，前向路径只有一条；判断两个回环能否相乘时，要逐个核对公共节点。",
      sections:modes43.map(([title,body])=>[title,body]),
      lab:walk("在 X₀…X₆ 流图上找路径",modes43,(i,ids)=>flow(rail(["x₀","x₁","x₂","x₃","x₄","x₅","x₆"]),[...path43,...loops43],ids,"七节点流图，四条局部回支路"))
    },
    44:{
      objective:"把表 2-2 变成五种可选的局部变换，用同一位置对照化简前后。",
      lead:"用节点代数方程验证每条规则。回环增益带符号，因此分母统一按 1 减去回环增益。",
      sections:[
        formula("绘制四步","物理方程 → 拉氏变换后的代数方程 → 因果式 → 局部图与系统图。"),
        formula("四条基本性质",["节点表示变量，混合节点为入支路贡献的代数和。","支路表示变量传输与变换。","增加单位传输支路可由混合节点引出汇节点。","同一系统的流图可以有不同画法。"]),
        ...rules44.map(([title,body])=>[title,body])
      ],
      lab:{
        title:"选择规则，对照等效",timed:false,
        controls:[choices("rule","等效规则",rules44.map(([title])=>title)),choices("after","查看结构",["化简前","化简后"])],
        draw(s){return {art:rulePicture(s.rule,s.after),detail:detail(...rules44[s.rule])};}
      }
    },
    45:{
      objective:"按例 2-13 的信号点、节点、前向支路、反馈支路逐层转换，明确点 4 如何并入点 5。",
      lead:"端口与信号点确定后，环节变为支路，正负反馈的符号附到支路增益上。",
      sections:[
        formula("四步转换","标信号点，点变节点，环节变为前向支路，反馈变成有符号支路。点 4 不独立，先相加再引出，并入节点 5。"),
        formula("三条反馈","H₁：6→3 为正；−H₂：7→5 为负；−1：7→2 为单位负反馈。"),
        formula("总传输","Φ=G₁G₂G₃/[1−G₁G₂H₁+G₂G₃H₂+G₁G₂G₃]。")
      ],
      math:[String.raw`\Phi(s)=\frac{G_1G_2G_3}{1-G_1G_2H_1+G_2G_3H_2+G_1G_2G_3}`],
      lab:walk("例 2-13 方框图到流图",[
        ["先画信号点","依次从输入向输出读方框图，辨认三个相加点和极性。"],
        ["建立节点","点 4 并入节点 5。相加完成后的量才从混合节点引出。"],
        ["接入前向支路","把 1、1、G₁、G₂、G₃、1 接成前向链。",[0,1,2,3,4,5]],
        ["接入反馈支路","标上 +H₁、−H₂、−1；符号来自原比较点。",["h1","h2","one"]]
      ],convert45)
    },
    46:{
      objective:"把公式分子、全图特征式和通道余子式各放到一个可选状态，在小图上说明取舍。",
      lead:"梅逊公式直接用路径和回环求总传输。Δ 和 Δₖ 的关键差别是保留哪些回环。",
      sections:[
        formula("总传输与前向路径","G=(ΣPₖΔₖ)/Δ。n 为前向通道条数，Pₖ 是第 k 条通道上支路增益的乘积。"),
        formula("全图特征式 Δ","1−Σ各单个回环传输+Σ两两互不接触回环增益乘积−Σ三组互不接触回环增益乘积+⋯。回环传输包含自己的符号。"),
        formula("通道余子式 Δₖ","从全图删去与第 k 条通道相接触的回环，再用同一规则计算剩余回环的特征式。")
      ],
      math:[String.raw`G(s)=\frac{\sum_{k=1}^{n}P_k\Delta_k}{\Delta}`],
      lab:{
        title:"看公式里的三类量",timed:false,controls:[choices("mode","公式项",["Pₖ","Δ","Δₖ"])],
        draw(s){
          const nodes=[point("R",40,154),point("x₁",188,154),point("x₂",344,154),point("C",716,154),point("x₃",526,70)];
          const edges=[...chainEdges(["a","b","c"]),edge("l1",2,1,"−h₁",124),edge("l2",4,4,"−h₂"),
            edge("p2",0,4,"d"),edge("last",4,3,"e")];
          const modes=["前向通道传输","全图特征式","对应通道的余子式"];
          const bodies=["示意 P₁=abc，P₂=de。","两个回环互不接触，Δ=1−L₁−L₂+L₁L₂。","P₁ 接触 L₁，仅留 L₂，故 Δ₁=1−L₂。"];
          return {art:flow(nodes,edges,[[0,1,2],["l1","l2"],["l2"]][s.mode],"梅逊公式变量与图中通道"),detail:detail(modes[s.mode],bodies[s.mode])};
        }
      }
    }
  });
  Object.assign(window.SourcePolishCh2,{
    47:{
      objective:"按例 2-14 原有 13 步揭示，在真实分支上逐步高亮三条通道、四个回环及唯一不接触组合。",
      lead:"先逐条描路径，再计算 Δ 和通道余子式，最后将三项分子合成总传输。",
      sections:[
        formula("三条前向通道",["P₁=G₁G₂G₃G₄G₅","P₂=G₁G₆G₄G₅","P₃=G₁G₂G₇"]),
        formula("四个回环",["L₁=−G₄H₁","L₂=−G₂G₇H₂","L₃=−G₆G₄G₅H₂","L₄=−G₂G₃G₄G₅H₂"]),
        formula("特征式与余子式","只有 L₁L₂ 互不接触。Δ=1−(L₁+L₂+L₃+L₄)+L₁L₂；Δ₁=Δ₂=1，Δ₃=1+G₄H₁。"),
        formula("合成总传输",formula47)
      ],
      math:[
        String.raw`\Delta=1+G_4H_1+G_2G_7H_2+G_6G_4G_5H_2+G_2G_3G_4G_5H_2+G_4H_1G_2G_7H_2`,
        String.raw`\Phi(s)=\frac{G_1G_2G_3G_4G_5+G_1G_6G_4G_5+G_1G_2G_7(1+G_4H_1)}{\Delta}`
      ],
      lab:walk("例 2-14 逐步高亮",mason47,(i,ids)=>flow(m47Nodes,m47Edges,ids,"例二之十四信号流图"))
    },
    48:{
      objective:"保留原 R-C 练习的先数后验，逐步揭示两条前向通道、五个回环和两组互不接触回环。",
      lead:"先从上支路与主链找出两条前向通道，再核对最外层单位负反馈与两个局部反馈。",
      sections:[
        formula("前向通道",["P₁=G₁G₂G₃","P₂=G₄G₃"]),
        formula("五个回环",["L₁=−G₁H₁","L₂=−G₃H₃","L₃=−G₁G₂G₃H₃H₁","L₄=−G₄G₃","L₅=−G₁G₂G₃"]),
        formula("不接触与余子式","L₁L₂=G₁G₃H₁H₃，L₁L₄=G₁G₃G₄H₁。Δ₁=1，Δ₂=1+G₁H₁。"),
        formula("合成总传输",formula48)
      ],
      math:[
        String.raw`\Delta=1+G_1H_1+G_3H_3+G_1G_2G_3H_3H_1+G_4G_3+G_1G_2G_3+G_1G_3H_1H_3+G_1G_3G_4H_1`,
        String.raw`\Phi(s)=\frac{G_1G_2G_3+G_4G_3(1+G_1H_1)}{\Delta}`
      ],
      lab:walk("R-C 练习逐步核对",mason48,(i,ids)=>flow(m48Nodes,m48Edges,ids,"包含两个局部反馈与单位外环的 R-C 练习"))
    },
    49:{
      objective:"从本章三种数学表示法回到建模过程，点选时说明当前表示保留什么信息。",
      lead:"本章从物理系统出发，经微分方程、传递函数与结构图，得到需要的输入输出关系。",
      sections:[
        formula("微分方程建模","掌握从物理系统建立微分方程的步骤、动态特性和用拉氏变换求解的方法。"),
        formula("传递函数","由微分方程求传递函数，掌握不同表示形式，并将典型环节的传递函数与物理意义对应。"),
        formula("结构图等效变换","理解方框图与信号流图，能通过方框图化简或梅逊公式求输入输出传递函数。"),
        formula("下章","使用这些模型分析系统的时域响应。")
      ],
      lab:{
        title:"选择本章的一种表示",timed:false,controls:[choices("item","建模路径",["物理系统","微分方程","传递函数","结构图","总传输"])],
        draw(s){
          const nodes=checklist.map(([name],i)=>point(i===4?"C(s)/R(s)":name,81+i*147,150,"block",i===3?120:106));
          return {art:flow(nodes,chainEdges(["","","",""]),s.item===0?[0]:[s.item-1],"本章建模与表示主线"),detail:detail(...checklist[s.item])};
        }
      }
    },
    50:{
      objective:"保留五分主观练习，让学生先看原变量连接，再逐步揭示两条路径、三个回环和答案。",
      lead:"用梅逊公式求 X₄/X₁。先数前向通道和回环，核对哪一条前向通道避开自回环。",
      sections:[
        formula("题目","使用图中的 a、b、c、d、e、f、g，求 G(s)=X₄/X₁。5 分。"),
        formula("路径与回环",["P₁=aef，P₂=abcf","L₁=−d，L₂=−eg，L₃=−bcg"]),
        formula("不接触组合与余子式","仅 L₁L₂ 互不接触，乘积为 deg。Δ₁=1+d，Δ₂=1。"),
        formula("结果","X₄/X₁=[aef(1+d)+abcf]/[1+d+eg+bcg+deg]。")
      ],
      math:[String.raw`\frac{X_4}{X_1}=\frac{aef(1+d)+abcf}{1+d+eg+bcg+deg}`],
      lab:walk("主观题 · 逐项验算",mason50,(i,ids)=>flow(nodes50,edges50,ids,"五节点自回环练习"))
    },
    51:{
      objective:"保留原单选的四个选项，用独立重绘的加热炉图让学员同时辨认两个信号来源。",
      lead:"先寻找物料和温度的测量点，再沿线看它们会在什么位置共同作用。",
      sections:[formula("单选题 · 2 分","结合图示判断控制方式。FFC 表示前馈调节器，FT 测流量；TT、TC 分别表示温度测量和温度调节。")],
      quiz:{
        prompt:"图示加热炉温度自动控制系统，采用了何种控制方式？",
        options:["开环控制","闭环控制","前馈控制","复合控制"],
        answers:[3],
        feedback:"复合控制。FT 检测物料流量并送到 FFC 做前馈补偿；TT 测出温度，TC 按偏差调节。两路进入 Σ，再共同驱动燃料阀。",
        art:furnace()
      }
    }
  });
})();
