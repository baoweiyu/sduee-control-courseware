"use strict";
(() => {
  const {range:R,choices:C,ink,plot,readouts,note,escape}=IntroWidgets;
  const M=IntroModels;
  const purple="#68479c",grey="#746987",warm="#a54d28",green="#296958";
  const text=(x,y,value,size=19,fill="#392d51",align="middle")=>
    `<text x="${x}" y="${y}" fill="${fill}" text-anchor="${align}" font-size="${size}" font-weight="650">${escape(value)}</text>`;
  const box=(x,y,w,h,fill="#fbf9fe",stroke="#d9d1e5",r=7)=>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
  const line=(d,stroke=grey,width=2.4,marker="")=>
    `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${marker?` marker-end="url(#${marker})"`:""}/>`;
  const figure=(body,name,height=285)=>
    `<svg viewBox="0 0 720 ${height}" aria-label="${escape(name)}" role="img">${body}</svg>`;
  const panel=(title,body)=>`<section class="text-block"><h3>${escape(title)}</h3><p>${escape(body)}</p></section>`;
  const number=(value,digits=3)=>Number.isFinite(value)?Number(value.toFixed(digits)).toString():"∞";
  const formula=(title,body)=>[title,body];
  const stage=(title,labels,draw)=>({title,timed:false,controls:[IntroWidgets.stages("step","当前步骤",labels.map(([name])=>name))],
    draw(s){const result=draw(s.step);return {...result,detail:panel(...labels[s.step]),readouts:readouts([["步骤",`${s.step+1} / ${labels.length}`]])};}});

  function table(head,rows,active=-1,reveal=rows.length,corner=0){
    const w=630,x=45,cy=50,h=Math.min(39,224/(rows.length+1)),columns=head.length,col=w/columns;
    let art=box(x,cy,w,h*(rows.length+1),"#fdfbff","#d8cee6",8);
    art+=box(x,cy,w,h,"#eae4f4","#e2d9ec",8);
    art+=head.map((label,i)=>text(x+(i+.5)*col,cy+h*.65,label,18)).join("");
    rows.forEach((row,index)=>{
      const y=cy+h*(index+1);
      if(index===active)art+=box(x+1,y,w-2,h,"#efe8fb","#e3d7f1",4);
      art+=line(`M${x+1} ${y}H${x+w-1}`,"#e8e2ef",1);
      row.forEach((value,i)=>{
        const s=index<reveal?value:(i===0?value:"—");
        const ink=i===1&&/^[−-]/.test(s)?warm:index===active?purple:"#392d51";
        art+=text(x+(i+.5)*col,y+h*.64,s,s.length>22?14:18,ink);
      });
    });
    if(corner>0)art+=`<rect x="${x+2}" y="${cy+h+2}" width="${corner*col-4}" height="${corner*h-4}" rx="5" fill="none" stroke="${purple}" stroke-width="3"/>`;
    return figure(art,"推导表逐行查看");
  }
  const routhHeader=["幂次","首列","第 2 列","第 3 列"];
  const table59=[["s⁴","1","3","5"],["s³","2","4","0"],["s²","1","5","0"],["s¹","−6","0",""],["s⁰","5","",""]];
  const guide59=[
    ["先排 s⁴ 行","取隔项系数 1、3、5。"],["再排 s³ 行","另取 2、4，空项补 0。"],
    ["计算 s² 行","(2×3−1×4)/2=1，(2×5−1×0)/2=5。"],
    ["计算 s¹ 行","(1×4−2×5)/1=−6，已经不能渐近稳定。"],
    ["顺序数变号","末项为 5。首列 1、2、1、−6、5 共两次变号，两个正实部根。"]
  ];
  const guide62=[
    ["首两行","s⁵ 与 s⁴ 行都是 1、3、2。"],["发现全零行","s³ 行全零，对应关于原点对称的一组特征根。"],
    ["建立辅助方程","用 s⁴ 行形成 Q(s)=s⁴+3s²+2。"],["以导数代替全零行","Q′(s)=4s³+6s；将 s³ 行改为 4、6、0。"],
    ["继续向下计算","s² 行为 3/2、2，可将整行乘 2 得 3、4；s¹ 首项 2/3，s⁰ 首项 4。"],
    ["区分无右半平面根与渐近稳定","首列无变号。Q=(s²+1)(s²+2)，有 ±j、±j√2，简单纯虚根带来等幅分量。"]
  ];
  function routh62(i){
    const rows=[["s⁵","1","3","2"],["s⁴","1","3","2"],[i>=3?"s³′":"s³",...(i>=3?["4","6","0"]:["0","0","0"])],["s²","3","4","0"],["s¹","2/3","0",""],["s⁰","4","",""]];
    return table(routhHeader,rows,[1,2,1,2,4,5][i],[2,3,3,3,6,6][i]);
  }
  const gutter=[-4.4,-3,-1];
  const f=s=>((2*s+10)*s+13)*s+4;
  const poles65=gutter.map((lo,i)=>{
    let hi=[-3,-1,0][i],sign=Math.sign(f(lo));
    for(let j=0;j<50;j++){
      const mid=(hi+lo)/2;
      if(Math.sign(f(mid))===sign)lo=mid;else hi=mid;
    }
    return (hi+lo)/2;
  });
  function marginDiagram(shift){
    const x=s=>590+118*s,cut=x(-shift);
    const area=box(58,61,cut-58,152,"#f0eaf8","#e5def0",1);
    const marks=[-4,-3,-2,-1,0].map(p=>line(`M${x(p)} 152v8`,grey,1)+text(x(p),187,p,16)).join("");
    return figure(area+line("M60 151H669",grey,2.8)+line("M590 61V215","#bfb6cf",1.5)+
      line(`M${cut} 61V215`,purple,3)+marks+text(cut,46,"−σ",19,purple)+text(661,137,"实部",17)+
      poles65.map(p=>line(`M${x(p)-5} 146l10 10m0-10-10 10`,p>=-shift?warm:green,3.1)).join("")+
      text(340,244,"叉号为原特征根，阴影为裕度要求的区域",16),
    "左移后的虚轴和三个实际特征根");
  }
  function tiles(names,active,title){
    const columns=names.length>4?3:2, n=198,gap=16;
    const start=(720-columns*n-(columns-1)*gap)/2,y0=62;
    return figure(names.map((name,i)=>{
      const x=start+(i%columns)*(n+gap),y=y0+Math.floor(i/columns)*77;
      const ink=i===active?purple:grey;
      return box(x,y,n,58,i===active?"#f0e7fa":"#fcfafd",i===active?"#b89bd6":"#e2daeb")+text(x+n/2,y+35,name,18,ink);
    }).join(""),title);
  }

  function signals(focus,labelH="H(s)",disturbance=false,feed="") {
    const edge=(d,key)=>line(d,focus.includes(key)?purple:grey,focus.includes(key)?3.4:2.2,focus.includes(key)?"ess-highlight":"ess-arrow");
    const marker=(id,fill)=>`<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 10 5 0 10z" fill="${fill}"/></marker>`;
    const compensation=feed==="ref"?edge("M67 138V67H211","r")+edge("M307 67H394V126","r")+
      box(211,49,96,36,"#f1e7f9","#b6a1ce")+text(259,73,"Gᵣ",17,purple):
      feed==="net"?edge("M394 74H307","n")+edge("M211 74H113V124","n")+
      box(211,56,96,36,"#f1e7f9","#b6a1ce")+text(259,80,"Gₙ",17,purple):"";
    return figure("<defs>"+marker("ess-arrow",grey)+marker("ess-highlight",purple)+"</defs>"+compensation+
      edge("M39 139H98","r")+edge("M128 139H213","e")+edge("M337 139H382","e")+edge("M406 139H450","n")+
      edge("M574 139H668","c")+edge("M628 139V214H429","b")+edge("M297 214H113V155","b")+
      (disturbance?edge("M394 73V126","n")+text(394,58,"N(s)",19,purple):"")+
      `<circle cx="113" cy="139" r="14" fill="#fff" stroke="#aa94c3" stroke-width="2"/><circle cx="394" cy="139" r="12" fill="#fff" stroke="#aa94c3" stroke-width="2"/>`+
      box(213,118,124,42,"#faf6fd","#b6a1ce")+box(450,118,124,42,"#faf6fd","#b6a1ce")+box(297,193,132,42,"#faf6fd","#b6a1ce")+
      text(46,124,"R(s)")+text(112,146,"±")+text(173,123,"E(s)")+text(275,146,"G₁(s)")+text(394,145,"+")+
      text(509,146,"G₂(s)")+text(668,123,"C(s)")+text(361,221,labelH)+text(204,203,"B(s)"),
      "带给定、偏差信号和反馈支路的系统");
  }
  const trace=(series,key,label,color,dash=false)=>({series,key,label,color,dash});
  const timeline=fn=>Array.from({length:M.steps+1},(_,i)=>({t:i*M.dt,...fn(i*M.dt)}));
  const rangeK=R("k","前向增益 K",.25,3.25,.05,1.5);

  window.SourcePolishCh3??={};
  Object.assign(window.SourcePolishCh3,{
    58:{
      objective:"用三个原方程让学生先做系数筛查，再区分是否需要列表和数变号。",
      lead:"对首项系数为正的特征多项式，系数全部为正只是必要条件。劳斯表首列才决定判稳。",
      sections:[
        formula("两条判据",["通常情况下，劳斯首列全正对应严格渐近稳定。特殊零项须先按规则处理，并留意虚轴根。","首列符号改变次数等于右半平面根数。"]),
        formula("三个方程",["s³+2s²−s+4=0 有负系数，可直接排除渐近稳定。","s⁴+2s³+3s²+4s+5=0，见例 3-5。","s⁴+2s³+s²+2s+1=0，见例 3-7。两式全正，仍需列表。"])
      ],
      lab:{
        title:"必要条件先过筛",timed:false,controls:[C("example","选择原例",["有负项","例 3-5","例 3-7"])],
        draw(s){
          const values=[["1","2","−1","4"],["1","2","3","4","5"],["1","2","1","2","1"]][s.example];
          return {art:tiles(values,s.example?0:2,"原特征多项式的系数"),detail:panel("系数筛查",s.example?"全为正，必须继续列劳斯表。":"存在负系数，不能渐近稳定。")};
        }
      }
    },
    59:{
      objective:"定位例 3-5 劳斯表每一行的来源；算到 −6 后继续到底并验证两次变号。",
      lead:"判断稳定性与计算右半平面根数是两个任务。前者出现负项可停，后者须排完首列。",
      math:[String.raw`D(s)=s^4+2s^3+3s^2+4s+5=0`],
      sections:[...guide59,formula("归一化","将劳斯表的一行乘或除以正数，首列符号与稳定性结论不变。")],
      lab:stage("例 3-5 逐行列表",guide59,i=>({art:table(routhHeader,table59,i,i+1)}))
    },
    60:{
      objective:"保留原单选，将缺项、负项与系数全正的三组情况放到答后说明。",
      lead:"先检查判稳必要条件，再决定要不要计算劳斯表。",
      sections:[formula("三个对照",["s³+2s²+3=0 缺 s 项。","s⁴+3s³−2s²+s+5=0 有负系数。","s³+s²+2s+8=0 全正，需继续判稳。"])],
      quiz:{prompt:"a₀s⁴+a₁s³+a₂s²+a₃s+a₄=0，a₀>0。若有一项系数为 0，系统严格渐近稳定吗？",options:["系统一定是稳定的","系统一定是不稳定的","系统可能稳定，也可能不稳定"],answers:[1],feedback:"系数为 0 破坏了严格渐近稳定的必要条件，因此可直接排除渐近稳定。"}
    },
    61:{
      objective:"直接拖 ε，看到原劳斯表首项为零时替换值和下一行怎样变化。",
      lead:"某行首项为零而该行并非全零时，先填 ε>0，再取 ε→0⁺ 判断符号。",
      sections:[
        formula("例 3-7","D=s⁴+2s³+s²+2s+1。首两行为 1、1、1 和 2、2、0。"),
        formula("用 ε 代替首项","s² 行为 ε、1、0；s¹ 首项 2−2/ε；s⁰ 首项 1。"),
        formula("取极限","ε 趋于零时，s¹ 首项趋于负无穷，首列两次变号，两个右半平面根。")
      ],
      lab:{
        title:"看 ε 法的极限",timed:false,draggable:"eps",controls:[R("eps","正数 ε",.01,.51,.01,.10)],
        draw(s){return {art:table(routhHeader,[["s⁴","1","1","1"],["s³","2","2","0"],["s²",number(s.eps),"1","0"],
          ["s¹",number(2-2/s.eps),"0",""],["s⁰","1","",""]],3),
          detail:panel("极限符号","ε→0⁺ 时，2−2/ε 为负。首列从正转负，再从负转正。"),readouts:readouts([["右半平面根","2"]])};}
      }
    },
    62:{
      objective:"将全零行、辅助多项式、求导替代和临界状态分别揭示，保留原例每一行数值。",
      lead:"全零行提示关于原点对称的特征根。辅助多项式的根须另行检查。",
      sections:guide62,
      math:[String.raw`D(s)=s^5+s^4+3s^3+3s^2+2s+2,quad Q(s)=(s^2+1)(s^2+2)`],
      lab:stage("例 3-8 辅助方程",guide62,i=>({art:routh62(i)}))
    },
    63:{
      objective:"用例 3-9 在同一矩阵内依次框出一阶、二阶首主子式，强调负子式时即可停止。",
      lead:"在 a₀>0 的条件下，赫尔维茨矩阵各阶顺序主子式都必须严格为正。",
      sections:[
        formula("行列式由系数排列","奇数项、偶数项分别作首两行，其后逐列右移，不存在的系数填零。与劳斯判据等价。"),
        formula("例 3-9","2s⁴+s³+3s²+5s+10=0。D₁=1>0，D₂=1×3−5×2=−7<0。已经不稳定，后两阶无须再算。")
      ],
      math:[String.raw`D_2=\begin{vmatrix}1&5\\2&3\end{vmatrix}=-7`],
      lab:stage("查看赫尔维茨首主子式",[
        ["检查一阶","D₁=a₁=1，第一关通过。"],["检查二阶","D₂=3−10=−7，能直接排除渐近稳定。"]
      ],i=>({art:table(["第 1 列","第 2 列","第 3 列","第 4 列"],[["1","5","0","0"],["2","3","10","0"],["0","1","5","0"],["0","2","3","10"]],-1,4,i+1)}))
    },
    64:{
      objective:"扫过例 3-11 的两个临界值，读取首列、判稳结论和 K=K₁/2。",
      lead:"将判稳条件写成参数不等式，可以直接读出稳定区间和临界增益。",
      sections:[
        formula("判据的三种用途",["直接判别稳定性。","反推参数范围和临界值。","通过 s=z−σ 的代换检验衰减裕度。"]),
        formula("例 3-11","单位负反馈，前向 K₁/[s(s+1)(s+2)]。闭环特征方程为 s³+3s²+2s+K₁=0。"),
        formula("结论","首列正要求 0<K₁<6。上边界为 K₁=6，开环放大倍数 K=K₁/2，故 Kc=3。")
      ],
      lab:{
        title:"拖动增益穿过稳定边界",timed:false,draggable:"k",controls:[R("k","分子增益 K₁",0,9,.1,3)],
        draw(s){
          const c=(6-s.k)/3,limit=s.k===6||s.k===0;
          return {art:table(["幂次","首列","第 2 列"],[["s³","1","2"],["s²","3",number(s.k)],["s¹",number(c),"0"],["s⁰",number(s.k),""]],2),
            readouts:readouts([["K",number(s.k/2)],["结论",limit?"临界":s.k<6?"稳定":"不稳定"]]),
            detail:panel(limit?"边界上的极点":"用首列判稳",s.k===6?"D=(s+3)(s²+2)，出现一对简单纯虚根。":s.k===0?"D=s(s+1)(s+2)，出现原点根。":"末行 K₁>0，第三行 (6−K₁)/3>0，严格稳定区间为 0<K₁<6。")};
        }
      }
    },
    65:{
      objective:"拖动新的判定线，标出例 3-12 的实际特征根；在 σ=1 时能直接数出一个越界根。",
      lead:"s=z−σ 等价于把判稳虚轴左移 σ。原系统稳定也可能达不到指定衰减裕度。",
      sections:[
        formula("原方程","2s³+10s²+13s+4=0，10×13−2×4=122>0，原系统稳定。"),
        formula("代入 σ=1","得到 2z³+4z²−z−1=0，首列 2、4、−1/2、−1 变号一次。"),
        formula("结论","一个根落在 s=−1 右侧，衰减裕量达不到 1。")
      ],
      lab:{
        title:"移动虚轴，观察根的位置",timed:false,draggable:"shift",controls:[R("shift","检验值 σ",0,2,.025,1)],
        draw(s){
          const failed=poles65.filter(p=>p>=-s.shift).length;
          return {art:marginDiagram(s.shift),readouts:readouts([["越界根数",failed],["最慢衰减",number(-poles65[2])]]),
            detail:panel("读图",failed?"有特征根达到或落在新判定线右侧，未通过严格衰减要求。":"所有根严格位于新判定线左侧。")};
        }
      }
    },
    66:{
      objective:"把原判稳流程逐节点点亮，让学生按相同判断顺序核对特殊情况。",
      lead:"先筛系数，再排劳斯表或算赫尔维茨主子式。含虚轴根时须单独辨别。",
      sections:[
        formula("必要条件","D(s) 首项系数规范为正。若存在非正系数，可排除渐近稳定。"),
        formula("劳斯处理","首项零用 ε 法，全零行用辅助方程的导数替换。变号次数给出正实部根数量。"),
        formula("最后核对","首列全正且无虚轴根才能判定严格渐近稳定。下一节进入稳态误差。")
      ],
      lab:stage("从特征方程到结论",[
        ["写出特征方程","确认最高次项和其余系数。"],["查系数","系数全部严格为正时才继续。"],
        ["列劳斯表","区分首项为零与整行全零。"],["判读","数首列变号，再核查有无虚轴根。"]
      ],i=>({art:tiles(["特征方程","系数筛查","构造劳斯表","判读结论"],i,"稳定性判别顺序")}))
    },
    67:{
      objective:"保留原第四部分分隔封面，标出误差系数、系统型别和精度措施的三段阅读路线。",
      lead:"稳定性回答能否保持有界与收敛，稳态误差进一步衡量追踪精度。",
      sections:[formula("第四部分","稳态误差分析。依次看误差定义、型别与静态误差系数、减小误差的措施。")]
    },
    68:{
      objective:"以地面站天线追踪为情境，拖动误差水平并同时查看收敛速度与最终差值。",
      lead:"暂态响应衡量系统如何过渡，稳态响应决定在过渡结束后还剩多少误差。",
      sections:[
        formula("区分两个问题","暂态反映动态性能；稳态误差反映长期精度。"),
        formula("本节主线","误差定义 → 误差传递函数 → 系统型别 → 静态误差系数 → 减小误差。"),
        formula("工程情境","地面站天线持续跟踪卫星，长期角度偏差应足够小。")
      ],
      lab:{
        title:"地面站跟踪的最终偏差",chartTitle:"观测误差是否收敛到零",draggable:"bias",
        controls:[R("bias","最终角度偏差",0,.8,.02,.20,"°")],
        draw(s){
          const y=timeline(t=>({ref:2,actual:(2-s.bias)*(1-Math.exp(-t/1.5)),error:s.bias+(2-s.bias)*Math.exp(-t/1.5)}));
          return {art:tiles(["指令角度","天线响应","比较偏差","稳态精度"],s.time<3?1:3,"地面站跟踪环节"),
            chart:plot([trace(y,"ref","给定角度",ink.target,true),trace(y,"actual","实际角度",ink.teal),trace(y,"error","角度误差",ink.orange)],s.time,{unit:"°",high:2.2}),
            readouts:readouts([["瞬时误差",number(M.at(y,s.time).error)+"°"],["稳态偏差",number(s.bias)+"°"]])};
        }
      }
    },
    69:{
      objective:"让 H 在单位反馈与有比例反馈间切换，分别显示 e(t) 和 ε(t)，避免把两者当成同一量。",
      lead:"真实误差用希望值减被控量；偏差信号用给定量减反馈量。只有在相应标定下两者才相同。",
      sections:[
        formula("误差定义","ε(t)=c₀(t)−c(t)。如果极限存在，eₛₛ=limₜ→∞ ε(t)。"),
        formula("单位反馈","H=1 且希望值等于给定时，ε=e=r−c。"),
        formula("非单位反馈","E(s)=R(s)−H(s)C(s)。工程上常用比较点偏差研究稳态精度，但须交代量纲与反馈标定。")
      ],
      lab:{
        title:"比较误差与偏差",chartTitle:"两种信号的时间走势",draggable:"h",
        controls:[R("h","反馈比例 H",.45,1.55,.05,1),rangeK],
        draw(s){
          const y=timeline(t=>{
            const out=s.k/(1+s.k*s.h)*(1-Math.exp(-(1+s.k*s.h)*t));
            return {physical:1-out,comparator:1-s.h*out};
          });
          return {art:signals(["e","b"],"H = "+number(s.h)),
            chart:plot([trace(y,"physical","真实误差 ε",ink.orange),trace(y,"comparator","偏差 e",ink.teal)],s.time,{low:-.5,high:1.15,unit:"相对量"}),
            readouts:readouts([["ε",number(M.at(y,s.time).physical)],["e",number(M.at(y,s.time).comparator)]])};
        }
      }
    },
    70:{
      objective:"通过同一反馈结构改变前向增益，读取误差传递函数与阶跃误差终值。",
      lead:"误差由给定和开环环路传递函数共同决定。使用终值定理前要确认终值存在。",
      sections:[
        formula("误差传递函数","Φₑ=E/R=1/(1+GH)。由 E=R−GHE 消去反馈项。"),
        formula("终值定理","若 sE(s) 在闭右半平面没有极点，则 eₛₛ=limₛ→0 sE(s)。含持续振荡或发散的响应不能直接套用。")
      ],
      math:[String.raw`e_{ss}=\lim_{s\to0}\frac{sR(s)}{1+G(s)H(s)}`],
      lab:{
        title:"增益与低频误差",timed:false,draggable:"k",controls:[rangeK],
        draw(s){return {art:signals(["r","e","b"],"H = 1"),readouts:readouts([["单位阶跃终值",number(1/(1+s.k))]]),
          detail:panel("该示意",`取 G(s)=${number(s.k)}/(s+1)，误差传递为 (s+1)/(s+${number(1+s.k)})。`)};}
      }
    },
    71:{
      objective:"单独切换给定、扰动两条箭头，再并列读出误差的两部分。",
      lead:"扰动进入的位置改变分子；给定与扰动合并计算时使用线性叠加。",
      sections:[
        formula("扰动单独作用","R=0，E=−HC，C/N=G₂/(1+G₁G₂H)，故 Φₑₙ=−G₂H/(1+G₁G₂H)。"),
        formula("叠加","E=ΦₑR+ΦₑₙN，若各终值存在，eₛₛ=eₛₛᵣ+eₛₛₙ。"),
        formula("应用重点","随动系统考察跟踪误差；恒值调节系统重点考察扰动引起的误差。")
      ],
      lab:{
        title:"选择误差来源",timed:false,controls:[C("source","对照通道",["给定 R","扰动 N","共同作用"])],
        draw(s){
          const key=[["r","e"],["n","b"],["r","e","n","b"]][s.source];
          const result=["E/R=1/(1+G₁G₂H)","E/N=−G₂H/(1+G₁G₂H)","E=ΦₑR+ΦₑₙN"][s.source];
          return {art:signals(key,"H(s)",true),detail:panel("当前通道",result)};
        }
      }
    },
    72:{
      objective:"将原判断题保留为答后反馈，图中仍能区分扰动注入点与给定输入。",
      lead:"两种误差通道的分母相同、分子不同。观察一下扰动是在什么位置注入的。",
      sections:[formula("误差通道","Φₑ=1/(1+G₁G₂H)，Φₑₙ=−G₂H/(1+G₁G₂H)。系统稳定条件下，增大扰动注入前的前向增益 G₁ 可以减小扰动误差。")],
      quiz:{prompt:"系统对某种形式的给定输入作用稳态误差为零。对同一形式的扰动作用，稳态误差是否一定为零？",options:["是，一定为零","否，不一定为零"],answers:[1],feedback:"扰动误差还取决于扰动位置及 G₂H。不同分子造成的低频增益可以不同。",art:signals(["n"],"H(s)",true)}
    }
  });
  const kind=["0 型","Ⅰ 型","Ⅱ 型","Ⅲ 型"];
  const inputs=["阶跃","斜坡","抛物线"];
  const coefficients=["Kₚ","Kᵥ","Kₐ"];
  const factor=(type,p,k)=>type>p?Infinity:type<p?0:k;
  const errorLimit=(type,p,k,a)=>p===0?a/(1+factor(type,p,k)):a/factor(type,p,k);
  const valueAt=(i,t,a)=>i===0?a:i===1?a*t:a*t*t/2;
  function follow(type,form,k,a){
    const h=M.dt,lambda=type===2?Math.sqrt(k):Math.cbrt(k);
    let y=0,dy=0,ddy=0;
    return timeline(t=>{
      const ref=valueAt(form,t,a),error=ref-y,output=y;
      if(type===0)y+=h*(k*error-y);
      else if(type===1)y+=h*k*error;
      else if(type===2){y+=h*(2*lambda*error+dy);dy+=h*k*error;}
      else {y+=h*(3*lambda*error+dy);dy+=h*(3*lambda*lambda*error+ddy);ddy+=h*k*error;}
      return {ref,error,output};
    });
  }
  function trackingLab(order,maxType){
    return {
      title:"保持输入类型，切换系统型别",chartTitle:"给定与误差的时间变化",draggable:"k",
      controls:[C("type","开环型别",kind.slice(0,maxType+1),Math.min(order,maxType)),rangeK,R("a","给定幅值系数 A",.2,2,.05,1)],
      draw(s){
        const y=follow(s.type,order,s.k,s.a),values=y.flatMap(row=>[row.ref,row.error,row.output]);
        const high=Math.max(1,...values)*1.08,low=Math.min(-.15,...values)*1.08;
        const columns=kind.slice(0,maxType+1).map((name,t)=>[name,number(factor(t,order,s.k)),number(errorLimit(t,order,s.k,s.a))]);
        return {art:table(["型别",coefficients[order],"eₛₛ"],columns,s.type),
          chart:plot([trace(y,"ref","给定",ink.target,true),trace(y,"output","输出",ink.teal),trace(y,"error","误差",ink.orange)],s.time,{low,high,unit:"相对量"}),
          readouts:readouts([["理论稳态误差",number(errorLimit(s.type,order,s.k,s.a))]]),
          note:note("图中各型别采用稳定的示意实现，表项依据低频极限计算。")};
      }
    };
  }

  const ex313=[
    ["分解复合输入","2·1(t)+4t+6(t²/2)。静态误差分别由位置、速度、加速度系数确定。"],
    ["系统 1","G₁=10/[s(s+4)]，1 型，K=2.5。三项误差为 0、1.6、∞，总误差发散。"],
    ["系统 2","G₂=10(s+1)/[s²(s+4)]，2 型，K=2.5。三项误差为 0、0、2.4，总误差为 2.4。"]
  ];
  const ex314=[
    ["系统 1（0 型）",[1/11,10/121,-10/1331]],
    ["系统 2（1 型）",[0,.1,.49]]
  ];
  function compensation(s){
    const g1=2,g2=1.4,gr=s.amount/g2,gn=-s.amount/g1;
    const fromReference=(1-gr*g2)/(1+g1*g2);
    const fromLoad=-g2*(1+gn*g1)/(1+g1*g2);
    return {coefficient:s.path?gn:gr,error:s.path?fromLoad:fromReference};
  }
  const recap84=[
    ["时域响应","一阶、二阶响应可用拉氏变换求解。欠阻尼二阶指标 tᵣ=(π−β)/ωd，2% 调节时间常估 tₛ≈4/(ζωₙ)，超调为 exp[−πζ/√(1−ζ²)]×100%。"],
    ["高阶近似","考察主导极点。较快模态可用实部约 5 倍作粗略筛选；近邻零极点可作偶极子近似，但须复核。"],
    ["稳定性","运用劳斯与赫尔维茨判据，分析参数临界值；使用 s=z−σ 检验衰减裕度。"],
    ["稳态误差","掌握型别与 Kₚ/Kᵥ/Kₐ、扰动注入点、动态误差系数、复合控制与不变性原理。"]
  ];
  const boundary85=Math.atan(Math.PI/-Math.log(.17));
  const minimum85=(Math.PI-boundary85)/(.6*Math.sin(boundary85));
  const nearest85=[minimum85*Math.cos(boundary85),minimum85*Math.sin(boundary85)].map(value=>number(value,2));
  const design85=window.CourseUnits?.[3]?.groups?.[10]?.lab;
  const exact85={
    ...design85, title:"拖动主导极点检验三个约束",chartTitle:"主导二阶阶跃响应",
    controls:design85?.controls?.filter(c=>c.id!=="mode")||[],
    draw(s){return design85.draw({...s,mode:0});}
  };

  Object.assign(window.SourcePolishCh3,{
    73:{
      objective:"让学员先在开环式中辨认 1/s，再观察积分数和增益如何改变低频形式。",
      lead:"型别是开环环路传递函数中未被约掉的原点极点个数。",
      sections:[
        formula("型别对应","ν=0、1、2 分别称为 0、Ⅰ、Ⅱ 型。型别越高，无差跟踪能力通常越强，稳定性仍须单独检查。"),
        formula("低频化简","各 (τs+1)、(Ts+1) 趋于 1，GH≈K/sᵛ。稳态误差由型别、K 和输入幅值及形式共同决定。")
      ],
      math:[String.raw`e_{ss}=\lim_{s\to0}\frac{s^{\nu+1}R(s)}{s^\nu+K}`],
      lab:{
        title:"从表达式找积分数",timed:false,draggable:"k",controls:[C("type","系统型别",kind.slice(0,3)),rangeK],
        draw(s){
          const low=["K","K/s","K/s²"][s.type];
          return {art:table(["型别","积分环节","低频近似"],kind.slice(0,3).map((name,i)=>[name,String(i),["K","K/s","K/s²"][i]]),s.type),
            readouts:readouts([["当前 K",number(s.k)],["积分数",s.type]]),
            detail:panel("当前低频形式",`GH≈${low}，型别由积分环节而定。`)};
        }
      }
    },
    74:{
      objective:"固定原页阶跃输入，只换系统型别和 K、A，使位置误差系数和终值一一对应。",
      lead:"阶跃误差由静态位置误差系数 Kₚ 决定。0 型的终值仍含分母 1+Kₚ。",
      sections:[
        formula("阶跃输入","r(t)=A·1(t)，R=A/s，Kₚ=limₛ→0 GH，eₛₛ=A/(1+Kₚ)。"),
        formula("按型别","0 型 Kₚ=K，误差 A/(1+K)；1 型、2 型 Kₚ=∞，稳态误差为零。")
      ],
      math:[String.raw`K_p=\lim_{s\to0}G(s)H(s),\qquad e_{ss}=\frac{A}{1+K_p}`],
      lab:trackingLab(0,2)
    },
    75:{
      objective:"固定原题斜坡，切换 0、Ⅰ、Ⅱ 型，比较误差发散、趋于常数与趋于零。",
      lead:"斜坡输入通过静态速度误差系数 Kᵥ 判精度。",
      sections:[
        formula("斜坡输入","r(t)=At，R=A/s²，Kᵥ=limₛ→0 sGH，eₛₛ=A/Kᵥ。"),
        formula("按型别","0 型 Kᵥ=0，误差发散；1 型 Kᵥ=K，恒定误差 A/K；2 型及以上 Kᵥ=∞，误差为零。")
      ],
      lab:trackingLab(1,2)
    },
    76:{
      objective:"在同一个抛物线输入下增设 Ⅲ 型，保留原页四行 Kₐ 结论。",
      lead:"抛物线输入对应恒定加速度，计算时保留 r(t)=At²/2 这一幅值口径。",
      sections:[
        formula("抛物线输入","r(t)=At²/2，R=A/s³，Kₐ=limₛ→0 s²GH，eₛₛ=A/Kₐ。"),
        formula("按型别","0 型、1 型 Kₐ=0，误差发散；2 型 Kₐ=K，恒定误差 A/K；3 型及以上 Kₐ=∞，误差为零。")
      ],
      lab:trackingLab(2,3)
    },
    77:{
      objective:"保留原总表的三个型别和三种输入，切换查看系数表或误差表，并突出当前一行。",
      lead:"先根据开环型别找系数，再根据输入形式选误差表达式。",
      sections:[
        formula("系数表",["0 型：Kₚ=K，Kᵥ=0，Kₐ=0。","Ⅰ 型：Kₚ=∞，Kᵥ=K，Kₐ=0。","Ⅱ 型：Kₚ=∞，Kᵥ=∞，Kₐ=K。"]),
        formula("误差表",["0 型：阶跃 A/(1+K)，斜坡与抛物线发散。","Ⅰ 型：阶跃无差，斜坡 A/K，抛物线发散。","Ⅱ 型：阶跃、斜坡无差，抛物线 A/K。"]),
        formula("记忆方式","设输入阶次分别为 0、1、2，则型别高于阶次时无差，等阶时有恒定误差，低于时发散。0 型阶跃分母为 1+K。")
      ],
      lab:{
        title:"对照静态系数和稳态误差",timed:false,draggable:"k",
        controls:[C("view","查看",["静态系数","稳态误差"]),C("type","突出型别",kind.slice(0,3)),rangeK,R("a","幅值 A",.2,2,.05,1)],
        draw(s){
          const cells=kind.slice(0,3).map((title,i)=>[title,...[0,1,2].map(p=>number(s.view?errorLimit(i,p,s.k,s.a):factor(i,p,s.k)))]);
          return {art:table(["型别",...(s.view?inputs:coefficients)],cells,s.type),detail:panel("按行查找",s.view?"同一型别下，变化更快的输入通常要求更高的跟踪能力。":"三种静态系数在这些型别下只取零、有限 K 与无穷大。")};
        }
      }
    },
    78:{
      objective:"逐项分解原例 3-13 的多项式输入，再高亮两种型别的误差贡献。",
      lead:"2+4t+3t² 按阶跃、斜坡与 t²/2 分解。相同的低频增益下，两种型别对抛物线的结果不同。",
      sections:[
        ...ex313,
        formula("原系统",["G₁=10/[s(s+4)]","G₂=10(s+1)/[s²(s+4)]。均为单位负反馈。"])
      ],
      math:[String.raw`e_{ss}=\frac{2}{1+K_p}+\frac{4}{K_v}+\frac{6}{K_a}`],
      lab:stage("例 3-13 先分解，再比较",ex313,i=>({art:table(["系统","阶跃","斜坡","抛物线","总误差"],[["1 型","0","1.6","∞","∞"],["2 型","0","0","2.4","2.4"]],i-1,i===0?0:i)}))
    },
    79:{
      objective:"保留老师的原选择题和四个选项，答后强调“至少”的含义。",
      lead:"Kᵥ 的低频极限由开环环路里原点极点的个数决定。",
      sections:[formula("三个定义",["Kₚ=limₛ→0 GH","Kᵥ=limₛ→0 sGH","Kₐ=limₛ→0 s²GH"])],
      quiz:{prompt:"若某系统的静态速度误差系数 Kᵥ=∞，该系统至少为几型？",options:kind,answers:[2],
        feedback:"至少 Ⅱ 型。0 型 Kᵥ=0，Ⅰ 型 Kᵥ=K 有限；积分数达到 2 才有 Kᵥ=∞。"}
    },
    80:{
      objective:"固定阶跃扰动并保持注入点，在比例与积分之间切换，定量比较误差终值。",
      lead:"减小扰动误差要看积分环节放在哪里。对阶跃扰动，关键是扰动点之前的低频通道。",
      sections:[
        formula("精确公式","eₛₛₙ=−A·G₂(0)H(0)/[1+G₁(0)G₂(0)H(0)]；适用前提是相关终值存在。"),
        formula("高低频增益意义","若 G₁(0)G₂(0)H(0)≫1，比例场景的误差近似为 −A/G₁(0)。位置在上游的积分环节可令阶跃扰动误差趋零。"),
        formula("情境与推广","无人机抵消侧风以保持悬停位置。同样的低频条件下，完全抑制斜坡扰动至少需要扰动作用点之前有两个积分环节。加入积分后还须复核稳定性。")
      ],
      lab:{
        title:"让一个阶跃扰动进入对象",chartTitle:"扰动误差随时间",draggable:"a",
        controls:[C("mode","扰动前通道",["比例 K₁","积分 K₁/s"]),R("a","扰动幅值 A",.2,2,.05,1),rangeK],
        draw(s){
          const g=1.2,h=M.dt;let y=0,u=0;
          const data=timeline(t=>{
            const d=t>=1?s.a:0,e=-y;
            if(s.mode){y+=h*(g*(u+d)-y);u+=h*s.k*e;}
            else y+=h*(g*(s.k*e+d)-y);
            return {d,e};
          });
          const limit=s.mode?0:-s.a*g/(1+s.k*g);
          return {art:signals(["n","b"],"H = 1",true),chart:plot([trace(data,"d","扰动",ink.target,true),trace(data,"e","偏差",ink.teal)],s.time,{event:1,minSpan:.5}),
            readouts:readouts([["理论扰动误差",number(limit)]]),detail:panel("扰动前的控制环节",s.mode?"积分作用使稳定后的阶跃扰动偏差趋零。":"比例控制可降低扰动偏差，一般没有消除恒值扰动后的最终差值。")};
        }
      }
    },
    81:{
      objective:"把附加误差项和缓变给定放在同一张图上，切换近似阶次观察泰勒截断的影响。",
      lead:"静态误差系数给出终值；动态误差系数从低频展开中读出误差与给定导数的关系。",
      sections:[
        formula("求系数","将 Φₑ(s) 在 s=0 附近作泰勒展开，cᵢ=Φₑ⁽ⁱ⁾(0)/i!。系数 c₀、c₁、c₂ 分别称位置、速度、加速度误差系数。"),
        formula("回到时域","eₛₛ(t) 可用 c₀r+c₁r′+c₂r″+⋯ 描述。截断级数用于低频、缓变给定；初值和暂态须另行考虑。")
      ],
      math:[String.raw`e_{ss}(t)\approx c_0r(t)+c_1\dot r(t)+c_2\ddot r(t),\qquad c_i=\frac{\Phi_e^{(i)}(0)}{i!}`],
      lab:{
        title:"一阶与二阶低频近似",chartTitle:"实际误差和导数近似",draggable:"omega",
        controls:[C("order","保留阶次",["一阶","二阶"]),R("omega","正弦频率",.12,1.15,.01,.36," rad/s")],
        draw(s){
          const a=1.3;let y=0;
          const data=timeline(t=>{
            const arg=s.omega*t,ref=Math.sin(arg),exact=ref-y;
            y+=M.dt*a*exact;
            return {exact,approx:s.omega*Math.cos(arg)/a+(s.order?s.omega*s.omega*Math.sin(arg)/(a*a):0)};
          });
          return {art:IntroWidgets.stepList(["泰勒展开","取给定导数","系数加权","比较真实误差"],s.order+1),
            chart:plot([trace(data,"exact","真实误差",ink.teal),trace(data,"approx","近似误差",ink.blue,true)],s.time,{minSpan:.35}),
            detail:panel("示意 Φₑ=s/(s+a)","低频展开为 s/a−s²/a²+⋯。频率升高时截断误差增大，起始时还会叠加暂态。")};
        }
      }
    },
    82:{
      objective:"对照原例两个单位反馈系统的精确 c₀、c₁、c₂，再调输入常值、斜率与加速度观察误差走势。",
      lead:"利用误差传递函数在原点附近的升幂展开，逐项恢复复合输入的稳态误差。",
      sections:[
        formula("系统与误差传递函数",["系统 1：GH=10/(s+1)，Φₑ=(s+1)/(s+11)。","系统 2：GH=10/[s(5s+1)]，Φₑ=s(5s+1)/(5s²+s+10)。"]),
        formula("准确系数",["系统 1：c₀=1/11，c₁=10/121，c₂=−10/1331。","系统 2：c₀=0，c₁=1/10，c₂=49/100。"]),
        formula("输入与结论","r=A₀+A₁t+A₂t²/2；r′=A₁+A₂t、r″=A₂。系统 1 在 A₂ 非零时误差含 t²，系统 2 的误差至多含 t。")
      ],
      lab:{
        title:"例 3-14 动态误差系数对比",chartTitle:"多项式输入的稳态误差表达式",draggable:"a2",
        controls:[R("a0","常值 A₀",0,2,.1,1),R("a1","斜率 A₁",0,2,.1,.9),R("a2","加速度 A₂",0,1.3,.1,.5)],
        draw(s){
          const data=timeline(t=>{
            const r=s.a0+s.a1*t+s.a2*t*t/2,dr=s.a1+s.a2*t;
            const values=ex314.map(([,c])=>c[0]*r+c[1]*dr+c[2]*s.a2);
            return {one:values[0],two:values[1]};
          });
          return {art:table(["系统","c₀","c₁","c₂"],[["0 型","1/11","10/121","−10/1331"],["1 型","0","1/10","49/100"]]),
            chart:plot([trace(data,"one","系统 1",ink.orange),trace(data,"two","系统 2",ink.teal)],s.time,{low:-.08,high:Math.max(1,...data.flatMap(x=>[x.one,x.two]))*1.1}),
            detail:panel("保留稳态项","图中使用三个精确系数。两种系统的高次项差别决定长期误差规律。")};
        }
      }
    },
    83:{
      objective:"把提高增益、提高型别与补偿三种方法放回稳定性前提，再操作两种补偿模型。",
      lead:"稳定性与低频误差要一起检查。前馈补偿可改善对给定或扰动的精度。",
      sections:[
        formula("三类措施",["增大开环放大倍数 K，同时附加校正以保证稳定。","增加前向积分环节，校核动态性能。","复合控制同时采用反馈与前馈。"]),
        formula("按给定补偿","E/R=(1−GᵣG₂)/(1+G₁G₂)，理想补偿取 Gᵣ=1/G₂。"),
        formula("按扰动补偿","E/N=−G₂(1+GₙG₁)/(1+G₁G₂)，理想补偿取 Gₙ=−1/G₁。理想补偿可能要求纯微分等难以实现的环节，实际常采用部分补偿。")
      ],
      lab:{
        title:"按给定或按扰动补偿",timed:false,draggable:"amount",
        controls:[C("path","补偿来源",["按给定","按扰动"]),R("amount","理想补偿比例",0,1.4,.025,.65)],
        draw(s){
          const out=compensation(s);
          return {art:signals(s.path?["n","b"]:["r","e"],"H = 1",s.path===1,s.path===1?"net":"ref"),
            readouts:readouts([[s.path?"Gₙ":"Gᵣ",number(out.coefficient)],["单位输入误差",number(out.error)]]),
            detail:panel("观察补偿效果",s.amount===1?"该示例达到理想值，补偿后的单位输入误差为零。":"拖动比例，看部分补偿和过补偿如何改变偏差。")};
        }
      }
    },
    84:{
      objective:"原小结保持四组，以可切换高清索引关联时域指标、高阶、判稳和稳态误差。",
      lead:"本章沿着动态响应、近似分析、稳定性和稳态精度四条线收束。",
      sections:recap84,
      lab:{
        title:"选一个主题复习",timed:false,controls:[C("item","本章主题",recap84.map(([title])=>title))],
        draw(s){return {art:tiles(recap84.map(([title])=>title),s.item,"第三章的四组学习要点"),detail:panel(...recap84[s.item])};}
      }
    },
    85:{
      objective:"保留三项原设计要求，在复平面上拖极点验证其交集，并区分最小极点模与最短上升时间。",
      lead:"要求 tᵣ≤0.6 s、超调≤17%、tₛ≤9.2 s。把每项指标分别换成极点约束，再取交集。",
      sections:[
        formula("超调和调节时间","负实轴夹角 β 满足 exp(−πcotβ)≤0.17，约束边界接近 ±60°；2% 近似 tₛ≈4/σ，因此 σ≥4/9.2。"),
        formula("上升时间约束","tᵣ=(π−β)/ωd=(π−β)/(ωₙsinβ)。因此不同阻尼角处的最小模不同，ωₙ=4 的圆只可用于接近 β=60° 的边界示意。"),
        formula("核对建议点",`按 17% 精确超调边界，距原点最近的是 −${nearest85[0]}±j${nearest85[1]}，与课件约 −2±j3.5 接近。若仅追求最短上升时间，沿可行射线外移可继续降低 tᵣ，题设未给出带宽上限。`)
      ],
      math:[String.raw`\sigma\ge\frac4{9.2},\qquad \omega_n\ge\frac{\pi-\beta}{0.6\sin\beta},\qquad e^{-\pi\cot\beta}\le0.17`],
      lab:exact85
    }
  });
})();
