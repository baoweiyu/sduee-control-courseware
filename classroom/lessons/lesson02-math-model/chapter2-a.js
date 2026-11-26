"use strict";

(() => {
  const { choices, range, escape: esc, readouts, plot, note, ink } = IntroWidgets;
  const M = IntroModels;
  const { motor } = IntroRigs;
  const modern = window.CourseUnits[2].groups;
  const T = String.raw;
  const purple = "#574b96";
  const muted = "#5b536d";
  const label = (value,x,y,{size=22,align="middle",color="#231f35"}={}) =>
    '<text x="'+x+'" y="'+y+'" text-anchor="'+align+'" font-size="'+size+'" font-weight="650" fill="'+color+'">'+esc(value)+'</text>';
  const svg = (description,body,viewBox="0 0 720 280") =>
    '<svg viewBox="'+viewBox+'" role="img" aria-label="'+esc(description)+'" xmlns="http://www.w3.org/2000/svg">'+body+'</svg>';
  const line = (path,color="#625682",width=3) => '<path d="'+path+'" fill="none" stroke="'+color+'" stroke-width="'+width+'" stroke-linecap="round" stroke-linejoin="round"/>';
  const box = (x,y,width,height,active=false) =>
    '<rect x="'+x+'" y="'+y+'" width="'+width+'" height="'+height+'" rx="13" fill="'+(active?"#eeebfb":"#fbfafc")+'" stroke="'+(active?purple:"#dbd5e7")+'"/>';
  const detail = (heading,body) => '<section class="text-block"><h3>'+esc(heading)+'</h3><p>'+esc(body)+'</p></section>';
  const fmt = (value,digits=2) => Number(value.toFixed(digits)).toString();
  const rows = (evaluate) => Array.from({length:M.steps+1},(_,i)=>({t:i*M.dt,...evaluate(i*M.dt)}));
  const traces = (time,options,...series) =>
    plot(series.map(([series,key,label,color,dash])=>({series,key,label,color,dash})),time,options);

  function flow(nodes,active=0){
    const width=(680-16*(nodes.length-1))/nodes.length;
    return svg(nodes.join("，"),nodes.map((name,i)=>{
      const x=20+i*(width+16);
      return box(x,83,width,82,i===active)+label(name,x+width/2,133,{size:21})+
        (i<nodes.length-1?line("M"+(x+width)+" 125h15m-5-5 5 5-5 5",purple,2):"");
    }).join(""),"0 0 720 240");
  }

  function tabs(title,names,entries,overview=names){
    return {
      title, visual:"source-concept", timed:false, controls:[choices("section","当前步骤",names)],
      draw({section}){
        const [heading,content]=entries[section];
        return {art:title==="建立微分方程"?IntroWidgets.stepList(overview,section):flow(overview,section),detail:detail(heading,content)};
      }
    };
  }

  // Fixed-step Runge–Kutta for the two-state teaching models. The step input is
  // held across each update so it cannot leak into the previous sample.
  function simulate(initial,input,derive,read){
    let state=initial;
    const advance=(v,slope,factor)=>v.map((component,i)=>component+factor*slope[i]);
    return rows(t=>{
      const command=input(t);
      const snap=read(state,command);
      const k1=derive(state,command);
      const k2=derive(advance(state,k1,M.dt/2),command);
      const k3=derive(advance(state,k2,M.dt/2),command);
      const k4=derive(advance(state,k3,M.dt),command);
      state=state.map((v,i)=>v+M.dt*(k1[i]+2*k2[i]+2*k3[i]+k4[i])/6);
      return snap;
    });
  }

  const modeling = [
    ["微分方程", "描述输入、输出和内部变量的时域关系。"],
    ["传递函数", "在零初始条件下描述系统的输入和输出，属于外部描述。"],
    ["状态空间", "用状态变量描述系统内部关系。"]
  ];
  const map = [
    ["线性系统的微分方程", "从物理定律建模，再用拉氏变换求解，讨论工作点附近的线性化。"],
    ["控制系统的传递函数", "学习定义、性质、典型环节及传递函数的求取。"],
    ["控制系统的方框图", "学习方框图的组成、绘制及等效化简。"],
    ["信号流图及梅逊公式", "学习信号流图的绘制和化简，用梅逊公式求总传递关系。"]
  ];
  const build = [
    ["确定输入和输出", "先确定系统边界和各元件的输入量、输出量。输入可包括给定和扰动，输出是被控制量。"],
    ["列写局部方程", "按各部分的物理定律或已知特性列写微分方程。"],
    ["消去中间变量", "联立各方程，保留输入和输出变量。"],
    ["整理成标准形式", "输出项放在左边，输入项放在右边，各项按导数阶次降序排列。"]
  ];

  function rlcGraphic(point,state){
    const glow=Math.abs(point.i)>.04?purple:"#8d849e";
    return svg("RLC 串联电路原理图，输出取在电容两端",
      box(23,30,674,213)+
      line("M128 130V77H199l9 -11 12 22 12 -22 12 22 12 -22 12 22 12 -11h28",glow)+
      line("M308 77h17a10 10 0 0 1 20 0 10 10 0 0 1 20 0 10 10 0 0 1 20 0 10 10 0 0 1 20 0H550V129M529 129h42m-42 17h42M550 146v56H128v-38",glow)+
      '<circle cx="128" cy="147" r="17" fill="#f0ecfb" stroke="#6f6194" stroke-width="2"/>'+
      line("M120 142h16m-8-7v14M122 156h12",purple,1.5)+
      label("uᵢ",88,151,{size:24})+label("R = "+fmt(state.r)+" Ω",243,55,{size:18})+
      label("L = "+fmt(state.l)+" H",368,55,{size:18})+label("C = "+fmt(state.c)+" F",617,136,{size:18})+
      label("uₒ",608,167,{size:21,color:purple})+label("i = "+fmt(point.i)+" A",342,226,{size:18,color:muted}));
  }

  const rlc = {
    title:"电容电压如何随参数改变", chartTitle:"单位电压阶跃",visual:"source-circuit",draggable:"r",
    controls:[range("r","电阻 R",.4,4,.1,1.2," Ω"),range("l","电感 L",.5,2,.05,1," H"),range("c","电容 C",.5,2,.05,1," F")],
    draw(state){
      const {r,l,c,time}=state;
      const data=simulate([0,0],()=>1,([v,i],u)=>[i/c,(u-r*i-v)/l],([v,i],u)=>({v,i,u}));
      return {art:rlcGraphic(M.at(data,time),state),
        chart:traces(time,{high:2,unit:"V"},[data,"u","输入电压",ink.target,true],[data,"v","电容电压",ink.teal]),
        readouts:readouts([["T₁",fmt(l/r)+" s"],["T₂",fmt(r*c)+" s"],["LC",fmt(l*c)+" s²"]]),
        detail:detail("从电流到电容电压","i(t) = C·duₒ/dt。改变电阻观察阻尼，改变电感或电容观察响应快慢。")};
    }
  };

  function springGraphic(position,velocity,state){
    const x=315+position*82;
    const spring=Array.from({length:13},(_,i)=>
      "L"+(155+i*(x-156)/12)+" "+(i===0||i===12?86:i%2?72:100)).join("");
    const graphic=svg("弹簧、阻尼器和随时间移动的质量块",
      line("M112 49V213H647M91 62l21-13m-21 46 21-13m-21 46 21-13m-21 46 21-13m-21 46 21-13",muted,2)+
      line("M112 86H155"+spring,purple)+line("M113 166H204v-19m0 19v19m0-38H258v38H204m17-19H"+x,"#936a45")+
      box(x,104,86,88,true)+label("m",x+43,157,{size:30,color:purple})+
      '<circle cx="'+(x+18)+'" cy="201" r="9" fill="white" stroke="#827492"/><circle cx="'+(x+68)+'" cy="201" r="9" fill="white" stroke="#827492"/>'+
      line("M"+(x+86)+" 148h62m-8-7 8 7-8 7",purple,2)+label("F = 1 N",x+98,129,{size:18})+
      label("弹性力 "+fmt(-state.k*position)+" N",237,47,{size:18})+ label("阻尼力 "+fmt(-state.f*velocity)+" N",222,244,{size:18}),
      "0 0 720 265");
    return '<div class="mechanism-figure hardware-pair"><img src="../../../assets/classroom/spring-bench.webp" alt="弹簧、质量块与阻尼器试验台的实物示意">'+graphic+'</div>';
  }

  const spring = {
    title:"拖动阻尼，观察质量块位移",chartTitle:"恒定外力下的位移",visual:"mechanism",draggable:"f",
    controls:[range("m","质量 m",.6,2,.05,1," kg"),range("k","刚度 k",.8,3,.05,1.5," N/m"),
      range("f","阻尼 f",.15,3,.05,.55," N·s/m")],
    draw(state){
      const {m,k,f,time}=state;
      const data=simulate([0,0],()=>1,([x,v],force)=>[v,(force-f*v-k*x)/m],([x,v])=>({x,v,target:1/k}));
      const {x,v}=M.at(data,time);
      return {art:springGraphic(x,v,state),
        chart:traces(time,{high:2.5,unit:"m"},[data,"target","平衡位移",ink.target,true],[data,"x","实时位移",ink.teal]),
        readouts:readouts([["位移",fmt(x)+" m"],["速度",fmt(v)+" m/s"],["平衡位移",fmt(1/k)+" m"]]),
        detail:detail("受力与运动","弹簧力为 −kx，阻尼力为 −f·dx/dt，二者与外力共同决定加速度。")};
    }
  };

  const dcMotor = {
    title:"电枢电压与负载转矩共同决定转速",chartTitle:"电动机的转速响应",visual:"motor",
    backdrop:"../../../assets/classroom/motor-bench.webp",draggable:"load",
    controls:[range("voltage","电枢电压",.55,1.35,.02,1),range("load","负载转矩",0,.65,.01,.3),
      range("inertia","转动惯量 J",.65,2.3,.05,1.3)],
    draw({voltage,load,inertia,time}){
      const current=([i,n],{u,mc})=>[(u-i-n)/.45,(i-mc)/inertia];
      const data=simulate([0,0],t=>({u:voltage,mc:t>=3?load:0}),current,([i,n],u)=>({i,n,u:u.u}));
      const p=M.at(data,time);
      return {art:motor({y:100*p.n},100*load,time),
        chart:traces(time,{low:-.3,high:1.55,unit:"相对转速",event:3},[data,"n","转速 n",ink.teal]),
        readouts:readouts([["转速",fmt(p.n)],["电枢电流",fmt(p.i)],["Tₘ",fmt(inertia)+" s"]]),
        detail:detail("给定与扰动同时进入模型","图中量采用教学归一化，取 Cₑ = Cₘ = Rₐ = 1、Lₐ = 0.45。负载从第 3 秒施加。")};
    }
  };

  window.SourcePolishCh2 ??= {};
  Object.assign(window.SourcePolishCh2,{
    1:{
      objective:"用一条方法路线预告本章如何从系统方程走到方框图和信号流图。",
      lead:"第二章　控制系统的数学模型",
      sections:[["本章方法","微分方程、传递函数、方框图、信号流图与梅逊公式。"]],
      lab:tabs("本章方法",["微分方程","传递函数","方框图","信号流图"],map)
    },
    2:{
      objective:"把三种模型和两种获得模型的途径分开排，突出本章由微分方程到传递函数的主线。",
      lead:"数学模型是描述系统输入、输出和内部各变量关系的数学表达式。",
      sections:[...modeling,["机理建模法","依据基尔霍夫定律、牛顿定律等物理定律列写方程。"],
        ["实验辨识法","根据实验得到的输入、输出数据拟合模型。"]],
      lab:formulaLookup("同一一阶系统的三种表示","数学模型",modeling,[
        [T`T\dot y(t)+y(t)=u(t),\quad T>0`],
        [T`G(s)=\frac{Y(s)}{U(s)}=\frac1{Ts+1},\quad y(0)=0`],
        [T`x=y,\qquad \dot x=-\frac1T x+\frac1T u`,T`y=x`]
      ])
    },
    3:{
      objective:"保留老师的四节目录，各节的推导与操作内容并列供快速定位。",
      lead:"先建立微分方程与传递函数，再用方框图和信号流图表示系统。",
      sections:map,
      lab:tabs("本章四节",["微分方程","传递函数","方框图","信号流图"],map)
    },
    4:{
      objective:"把建模四步排成可选的流程，通式和符号解释跟在步骤之后。",
      lead:"找到边界、列方程、消元、标准化，最后得到连接输入和输出的微分方程。",
      sections:[...build,["符号","r(t) 表示给定输入，c(t) 表示被控制量，aᵢ、bⱼ 由系统结构和参数确定。n、m 分别是输出、输入的最高导数阶次，一般 n≥m。"]],
      math:[T`\sum_{i=0}^{n}a_i\frac{d^i c(t)}{dt^i}=\sum_{j=0}^{m}b_j\frac{d^j r(t)}{dt^j}\quad(n\ge m)`],
      lab:tabs("建立微分方程",["确定边界","列写方程","消元","标准化"],build)
    },
    5:{
      objective:"把串联电路的元件和实际电容电压曲线放在同页，拖动 R、L、C 核对系数来源。",
      lead:"以电源电压 uᵢ 为输入，以电容两端电压 uₒ 为输出。",
      sections:[["输入与输出","R、L、C 串联，共用电流 i(t)。输出 uₒ 取电容电压。"],
        ["列写局部方程","沿回路应用基尔霍夫定律。电阻压降为 Ri，电感压降为 L·di/dt，电容支路满足 i=C·duₒ/dt。"],
        ["消元","消去电流 i，得到二阶微分方程。T₁=L/R、T₂=RC 时，二阶项系数为 T₁T₂。"]],
      math:[T`u_R+u_L+u_C=u_i,\quad i=C\frac{du_o}{dt}`,T`LC\ddot u_o+RC\dot u_o+u_o=u_i`,T`T_1T_2\ddot u_o+T_2\dot u_o+u_o=u_i`],
      lab:rlc
    },
    6:{
      objective:"让质量块随计算位移移动，帮助区分惯性、弹簧恢复力和阻尼力。",
      lead:"外力 F 是输入，质量块位移 x 是输出。牛顿第二定律把三种力联系起来。",
      sections:[["输入与输出","外力 F 作用于质量块 m，输出位移 x 以示意图所选正方向为准。"],
        ["列力方程","弹簧力与位移反向，阻尼力与速度反向，加速度由合力除以质量得到。"],
        ["消元","代入 a=d²x/dt²，整理成输入在右、位移各阶导数在左的二阶方程。"]],
      math:[T`F_{\text{弹}}=-kx,\quad F_{\text{阻}}=-f\dot x`,T`m\ddot x+f\dot x+kx=F`],
      lab:spring
    },
    7:{
      objective:"单独讲清电压输入、转矩扰动和转速输出，用机电联动解释二阶项。",
      lead:"他励电机有给定输入 uₐ 与扰动输入 m꜀，输出是转速 n。",
      sections:[["电枢回路","电枢电压抵消电阻、电感和反电动势带来的电压降。"],
        ["机电关系","反电动势 eₐ=Cₑn，电磁转矩 m=Cₘiₐ，净转矩为 m−m꜀。"],
        ["标准化","Tₐ=Lₐ/Rₐ，Tₘ=JRₐ/(CₑCₘ)，Kᵤ=1/Cₑ，Kₘ=Tₘ/J。负载转矩和其导数是扰动项。"]],
      math:[T`L_a\dot i_a+R_ai_a+e_a=u_a`,T`e_a=C_en,\quad m=C_mi_a,\quad J\dot n=m-m_c`,
        T`T_aT_m\ddot n+T_m\dot n+n=K_u u_a-K_m(T_a\dot m_c+m_c)`],
      lab:dcMotor
    },
    8:{
      objective:"沿用原题检验三个系统的共同模型，并明确他励电机的扰动口径。",
      lead:"电路、机械和机电系统可以写成相同阶次的线性方程。",
      sections:[["关于输入数","RLC 和弹簧装置的两个原例各给一个输入。电机例同时写有电枢电压和负载转矩。固定负载扰动后，可以只研究电压到转速的一条输入通道。"]],
      quiz:{
        prompt:"前述 RLC 电路、弹簧-质量-阻尼器、直流电动机三个算例系统的共同点是什么？",
        options:["都是二阶系统","都是单输入的","都是线性系统","以上都对"],
        answers:[0,2],
        feedback:"按前三页所列模型，三例均为二阶线性系统。原课件的 D 采用固定负载转矩、只考虑给定输入的简化口径。若把负载转矩也作为独立输入，应选 A、C。"
      }
    }
  });

  const transformRules = [
    ["线性定理","线性组合逐项变换，常系数保留。"],
    ["微分定理","每微分一阶，在 s 域乘以 s，再减去相应初值项。"],
    ["积分定理","每积分一阶，在 s 域除以 s。积分起点的初值另行计入。"],
    ["位移定理","延时 τ 得到 e^(−τs)F(s)，乘以 e⁻ᵃᵗ 得到 F(s+a)。延时前信号按零处理。"],
    ["终值定理","sF(s) 的全部极点在左半平面时，可用 s→0 时 sF(s) 的极限求终值。"],
    ["初值定理","在满足初值定理条件且初值有限时，可用 s→∞ 时 sF(s) 的极限求 f(0⁺)。"]
  ];
  // Each row is an independent lookup, not a step in a derivation.
  function formulaLookup(title, controlLabel, entries, equations, examples) {
    return {
      title, visual:"source-concept", timed:false,
      controls:[choices("section",controlLabel,entries.map(([heading])=>heading))],
      draw({section}) {
        const [heading,body]=entries[section];
        const expressions=equations[section].map(expression=>{
          const math=window.katex?.renderToString(expression,{displayMode:false,throwOnError:true}) ?? esc(expression);
          return '<div>'+math+'</div>';
        }).join("");
        const art='<div style="width:100%;display:grid;align-content:center;justify-items:center;gap:clamp(5px,1.2vh,14px);font-size:clamp(15px,2.2vw,32px);padding:4px;color:#283a49">'+expressions+'</div>';
        const example=examples?.[section];
        const explanation=example ? '<article class="theorem-card"><h2>'+esc(heading)+'</h2><p>'+esc(body)+'</p><h3>例</h3><p>'+esc(example[0])+'</p><div class="theorem-example">'+tex(example[1])+'</div></article>' : detail(heading,body);
        return {art,detail:explanation};
      }
    };
  }
  const tex=source=>window.katex.renderToString(source,{throwOnError:true});
  const pairs=[
    ["单位脉冲",T`\delta(t)`,"1"],["单位阶跃","1(t)",T`\frac1s`],
    ["单位斜坡","t",T`\frac1{s^2}`],["单位抛物线",T`\frac{t^2}{2}`,T`\frac1{s^3}`],
    ["一般幂函数","t^n",T`\frac{n!}{s^{n+1}}`],["指数函数","e^{-at}",T`\frac1{s+a}`],
    ["正弦",T`\sin\omega t`,T`\frac{\omega}{s^2+\omega^2}`],["余弦",T`\cos\omega t`,T`\frac{s}{s^2+\omega^2}`]
  ];
  function lookupTable(){
    function table(entries){
      return '<table><thead><tr><th>信号</th><th>时域 '+tex('f(t)')+'</th><th>变换域 '+tex('F(s)')+'</th></tr></thead><tbody>'+
        entries.map(([name,f,F])=>'<tr><th scope="row">'+name+'</th><td>'+tex(f)+'</td><td>'+tex(T`\displaystyle `+F)+'</td></tr>').join('')+'</tbody></table>';
    }
    return '<div class="transform-sheet"><header><strong>单边拉氏变换</strong>'+tex(T`F(s)=\int_{0^-}^{\infty}f(t)e^{-st}\,dt`)+'</header><div class="transform-tables">'+table(pairs.slice(0,4))+table(pairs.slice(4))+'</div><p>表中信号按因果信号处理，在各自收敛域内取值。幂次 n 为非负整数。</p></div>';
  }
  function derivation(page){
    return IntroWidgets.equationSteps(["时域微分方程","零初值拉氏变换","整理传递函数"],page.math,"输出端系数 aᵢ 构成分母，输入端系数 bⱼ 构成分子。");
  }
  const rulePrompts=["线性组合变到 s 域后，两个常系数怎样处理？","把一阶导数变到 s 域，初值不为零时还要保留什么？","已知积分器的初值，怎样写出它的输出变换？","信号延迟与信号乘指数，在 s 域各怎样变化？","用终值定理之前，应先检查哪些极点？","已知 F(s)，怎样求信号在起始时刻的右极限？"];
  const ruleExamples=[
    ["把阶跃与斜坡分别变换，再乘回系数。",T`2+3t\;\longleftrightarrow\;\frac2s+\frac3{s^2}`],
    ["取 f(t)=exp(−2t)，初值为 1。",T`\mathcal L\{f'\}=\frac{s}{s+2}-1=-\frac{2}{s+2}`],
    ["若输入为单位阶跃，积分器初值为 2。",T`g(t)=2+t\;\longleftrightarrow\;G(s)=\frac2s+\frac1{s^2}`],
    ["把单位阶跃延迟 2 秒。",T`1(t-2)\;\longleftrightarrow\;\frac{e^{-2s}}s`],
    ["sF(s) 只有极点 −2，满足终值条件。",T`F(s)=\frac1{s(s+2)}\;\Rightarrow\; f(\infty)=\frac12`],
    ["取连续的指数衰减信号，起始处无脉冲。",T`F(s)=\frac1{s+2}\;\Rightarrow\; f(0^+)=\lim_{s\to\infty}\frac{s}{s+2}=1`]
  ];
  const ruleEquations=[
    [T`\mathcal L\{af_1+bf_2\}=aF_1+bF_2`],
    [T`\mathcal L\{f'\}=sF(s)-f(0^+)`,T`\mathcal L\{f''\}=s^2F(s)-sf(0^+)-f'(0^+)`],
    [T`g'=f\quad\Longrightarrow\quad G(s)=\frac{F(s)+g(0^+)}{s}`],
    [T`1(t-\tau)f(t-\tau)\;\longleftrightarrow\;e^{-\tau s}F(s)`,T`e^{-at}f(t)\;\longleftrightarrow\;F(s+a)`],
    [T`\lim_{t\to\infty} f(t)=\lim_{s\to0}sF(s)`],
    [T`f(0^+)=\lim_{s\to\infty}sF(s)`]
  ];
  const solve = [
    ["取拉氏变换","两边分别取单边拉氏变换，将微分写为 s 域运算并计入初值。"],
    ["代入初值和输入","分别代入 y(0)、ẏ(0)、x(0) 和输入 X(s)。"],
    ["整理 Y(s)","把含 Y(s) 的项合并，分离零状态项和由初值产生的项。"],
    ["拉氏反变换","逐项回到时域，零状态响应与零输入响应相加得到总响应。"]
  ];
  const worked = [
    ["拉氏变换","零初始条件下，二阶项直接变成 s²Y(s)，将输入 2e⁻²ᵗ 变为 2/(s+2)。"],
    ["求 Y(s)","分母分解为 (s+1)(s+2)(s+4)，对应留数 2/3、−1、1/3。"],
    ["反变换","三项指数成分相加，得到随时间衰减至零的响应。"],
    ["MATLAB 核对","令 num=2，den=poly([-2;-1;-4])，再用 [r,p,k]=residue(num,den)。按极点对应留数，直项为空。"]
  ];
  const derive = [
    ["时域方程","写出输出、输入的各阶导数，系数由系统结构与参数决定。"],
    ["零初值变换","两边分别取拉氏变换。零初始条件下，k 阶导数对应乘上 sᵏ。"],
    ["整理传递函数","合并 C(s) 和 R(s)，得到分子对应输入系数、分母对应输出系数的有理式。"]
  ];

  const inverse = {
    title:"重数决定时间解的多项式因子",chartTitle:"单极点与重极点的时域响应",visual:"source-concept",draggable:"pole",
    controls:[choices("order","极点重数",["单极点","二重极点","三重极点"]),range("pole","衰减率 a",.2,2,.05,.8)],
    draw({order,pole,time}){
      const m=order+1, factorial=[1,1,2][order];
      const data=rows(t=>({y:t**order*Math.exp(-pole*t)/factorial}));
      const ymax=Math.max(...data.map(s=>s.y));
      return {art:IntroWidgets.stepList(["变换域","极点与重数","时域响应"],1,[tex(T`F(s)=\frac{1}{(s+`+fmt(pole)+`)^{`+m+"}}"),"s = −"+fmt(pole)+"　·　"+m+" 重",tex("f(t)="+["","t",T`\frac{t^2}{2}`][order]+"e^{-"+fmt(pole)+"t}")]),
        chart:traces(time,{high:Math.max(1.05,1.12*ymax),unit:"f(t)"},[data,"y","时域响应",ink.teal]),
        readouts:readouts([["极点",fmt(-pole)],["重数",m],["当前值",fmt(M.at(data,time).y)]]),
        detail:detail("本模型","F(s) = 1/(s+a)"+["","²","³"][order]+"，反变换是 "+["e⁻ᵃᵗ","t·e⁻ᵃᵗ","(t²/2!)·e⁻ᵃᵗ"][order]+"。")};
    }
  };

  const separation = {
    title:"区分零状态、零输入和总响应",chartTitle:"相同二阶系统的三种响应",visual:"source-concept",draggable:"initial",
    controls:[range("initial","初值 y(0)",0,1.8,.05,.55),range("input","阶跃幅值",0,1.8,.05,1)],
    draw({initial,input,time}){
      const dynamics=([y,v],u)=>[v,u-1.6*v-y];
      const natural=simulate([initial,0],()=>0,dynamics,([n])=>({n}));
      const forced=simulate([0,0],()=>input,dynamics,([f])=>({f}));
      const data=natural.map(({t,n},i)=>({t,n,f:forced[i].f,total:n+forced[i].f}));
      const view=M.at(data,time);
      return {art:IntroWidgets.stepList(["微分方程","分离零输入与零状态响应","时域叠加"],2,[tex(T`y^{\prime\prime}+1.6y^{\prime}+y=u`),tex(T`Y(s)=Y_{\rm zi}(s)+Y_{\rm zs}(s)`),tex(T`y(t)=y_{\rm zi}(t)+y_{\rm zs}(t)`)]),
        chart:traces(time,{high:2.2,unit:"y(t)"},[data,"n","零输入",ink.orange],[data,"f","零状态",ink.blue],[data,"total","总响应",ink.teal]),
        readouts:readouts([["零输入",fmt(view.n)],["零状态",fmt(view.f)],["总响应",fmt(view.total)]]),
        detail:detail("单独保留一项","令初值为零，零输入分量消失。令阶跃幅值为零，只剩由初值产生的响应。")};
    }
  };

  const exampleSolution = {
    title:"按步核对时域解与 MATLAB 留数",chartTitle:"三个指数成分与总响应",visual:"source-concept",
    controls:[choices("step","求解步骤",["拉氏变换","部分分式","反变换","MATLAB 核对"],2)],
    draw({step,time}){
      const data=rows(t=>{
        const first=2*Math.exp(-t)/3,second=-Math.exp(-2*t),third=Math.exp(-4*t)/3;
        return { first,second,third,y:first+second+third };
      });
      const [heading,body]=worked[step];
      return {art:IntroWidgets.stepList(["拉氏变换","部分分式展开","逐项反变换","MATLAB 留数核对"],step),
        chart:traces(time,{low:-1.06,high:.75,unit:"y(t)"},[data,"first","极点 −1",ink.blue],[data,"second","极点 −2",ink.orange],
          [data,"third","极点 −4",ink.violet],[data,"y","总响应",ink.teal]),
        readouts:readouts([["当前总响应",fmt(M.at(data,time).y,4)],["稳态解",0]]),
        detail:detail(heading,body)};
    }
  };

  const transfer = {
    title:"初值为零时才直接取输出输入之比",chartTitle:"同一 G(s) 在两种初值下的响应",visual:"source-concept",draggable:"initial",
    controls:[range("initial","额外初始量 c(0)",0,2,.05,1.2),range("tau","时间常数 T",.35,3,.05,1," s")],
    draw({initial,tau,time}){
      const data=rows(t=>{
        const e=Math.exp(-t/tau),reference=1-e;
        return {reference,actual:reference+initial*e,input:1};
      });
      const p=M.at(data,time);
      return {art:flow(["输入 R(s)","G(s)","输出 C(s)"],1),
        chart:traces(time,{high:2.1,unit:"相对值"},[data,"input","单位阶跃",ink.target,true],[data,"reference","零初值",ink.blue],[data,"actual","含初值",ink.teal]),
        readouts:readouts([["当前差值",fmt(p.actual-p.reference)],["G(s)","1/(1+"+fmt(tau)+"s)"]]),
        detail:detail("初值项单列","传递函数描述系统的外部输入输出关系。额外的初值项改变总输出。")};
    }
  };

  Object.assign(window.SourcePolishCh2,{
    9:{
      objective:"把拉氏变换表保留为按函数类别可查看的参考表，突出从时域到 s 域的对应关系。",
      lead:"拉氏变换把时域信号映射成 s 域函数，为将微分方程化为代数方程作准备。",
      sections:[],staticBody:lookupTable
    },
    10:{
      objective:"把六条定理解耦，每次聚焦一个公式族，并保留定理成立条件。",
      lead:"零初始条件下，微分定理把时域微分替换成 s 的幂次。这是后续建模的关键。",
      sections:transformRules,theorems:ruleEquations,prompts:rulePrompts,
      math:[T`\mathcal L[af_1+bf_2]=aF_1+bF_2`,
        T`\mathcal L[f^{(n)}]=s^nF-\sum_{k=1}^ns^{n-k}f^{(k-1)}(0^+)`,
        T`\mathcal L[g]=\frac{F+g(0^+)}s\ (g'=f),\quad\mathcal L[h]=\frac{F+s h(0^+)+h'(0^+)}{s^2}\ (h''=f)`,
        T`\mathcal L[1(t-\tau)f(t-\tau)]=e^{-\tau s}F(s),\quad \mathcal L[e^{-at}f]=F(s+a)`,
        T`\lim_{t\to\infty}f(t)=\lim_{s\to0}sF(s),\quad f(0^+)=\lim_{s\to\infty}sF(s)`],
      lab:formulaLookup("拉氏变换基本定理","选择定理",transformRules,ruleEquations,ruleExamples)
    },
    11:{
      objective:"区分单根和重根展开，用曲线看重数怎样改变时域项。",
      lead:"先对有理真分式作部分分式展开，再逐项反变换。",
      sections:[
        ["单根","每个单根 sᵢ 对应一项 cᵢ/(s−sᵢ)，反变换时得到 cᵢeˢⁱᵗ。系数由乘以 s−sᵢ 后取极限求出。"],
        ["重根","m 阶重根对应该因式一到 m 阶的各项。其系数可由 F(s)(s−s₁)ᵐ 的逐阶导数得到。"],
        ["时域因子","分母的第 k 次幂对应 tᵏ⁻¹/(k−1)! 乘以指数，重根的次数决定时间因子。"]
      ],
      math:[T`c_i=\lim_{s\to s_i}(s-s_i)F(s),\quad f(t)=\sum_i c_ie^{s_it}`,
        T`c_{m-j}=\left.\frac{1}{j!}\frac{d^j}{ds^j}\left[(s-s_1)^m F(s)\right]\right|_{s=s_1}\quad (0\le j<m)`,
        T`\mathcal L^{-1}\left[\frac{1}{(s-s_1)^k}\right]=\frac{t^{k-1}e^{s_1 t}}{(k-1)!}`],
      lab:inverse
    },
    12:{
      objective:"保留取变换、代入、求 Y(s)、反变换四步，用颜色区分零状态、零输入与总响应。",
      lead:"将初始状态和输入信号分别跟踪，最后把两种响应相加。",
      sections:[...solve,
        ["另一种分解","对稳定系统，也可按稳态解和暂态解分析响应。稳态解关乎最终精度，暂态解描述过渡过程。这个划分与按零输入、零状态划分分别回答不同问题。"]],
      math:[T`a_0\ddot y+a_1\dot y+a_2y=b_0\dot x+b_1x`,
        T`a_0(s^2Y-sy(0)-\dot y(0))+a_1(sY-y(0))+a_2Y=b_0(sX-x(0))+b_1X`,
        T`Y(s)=\frac{(b_0s+b_1)X(s)+a_0sy(0)+a_0\dot y(0)+a_1y(0)-b_0x(0)}{a_0s^2+a_1s+a_2}`],
      lab:separation
    },
    13:{
      objective:"保留原算例的方程、分式和 MATLAB 对应关系，并标出三个留数在时域产生的分量。",
      lead:"求解 ÿ+5ẏ+4y=2e⁻²ᵗ，初值 y(0)=ẏ(0)=0。",
      sections:worked,
      math:[T`(s^2+5s+4)Y(s)=\frac{2}{s+2}`,
        T`Y(s)=\frac{2}{(s+1)(s+2)(s+4)}=\frac{2/3}{s+1}-\frac1{s+2}+\frac{1/3}{s+4}`,
        T`y(t)=\frac23e^{-t}-e^{-2t}+\frac13e^{-4t}`],
      lab:exampleSolution
    },
    14:{
      objective:"沿用原课堂单选，答后解释两种响应分解为何不能混用。",
      lead:"稳态精度、暂态过程与初始状态各回答一个不同的问题。",
      sections:[["单选题","1 分。"]],
      quiz:{
        prompt:"以下说法正确的是哪一项？",
        options:["系统微分方程的稳态解反映系统响应输入信号作用的稳态精度","系统微分方程的暂态解仅与给定初始条件有关",
          "系统微分方程的零初始状态响应是其稳态解","以上都不对"],
        answers:[0],
        feedback:"改变输入也会产生暂态。零初始条件下，输入引起的响应仍可分为稳态和暂态两部分。"
      }
    },
    15:{
      objective:"让工作点、切线和输入偏差同屏调整，观察小偏差近似的范围。",
      lead:"在工作点附近，用切线代替原曲线，得到输出增量与输入增量的线性近似。",
      sections:[
        ["线性、近似线性和非线性","线性系统可使用线性控制理论。近似线性系统在合适工作点附近采用小偏差法。若关键非线性效应在所需工况内不能由局部近似解释，应使用非线性方法。"],
        ["切线法","在 A(x₀,y₀) 处展开 y=f(x)，保留关于 Δx 的一次项。"],
        ["适用条件","工作点附近要求特性连续可微。切线的斜率随工作点改变。结果是增量方程，小偏差下有效。"]
      ],
      math:[T`y=f(x_0)+f'(x_0)(x-x_0)+\tfrac12 f''(x_0)(x-x_0)^2+\cdots`,
        T`\Delta y\approx k\Delta x,\quad k=f'(x_0)`],
      lab:modern[2].lab
    },
    16:{
      objective:"以输入、方框和输出突出外部关系，对比初值改变后的实际输出。",
      lead:"在线性时不变系统的零初始条件下，输出与输入的拉氏变换之比是传递函数。",
      sections:[
        ["定义","令输入为 r(t)、输出为 c(t)，其拉氏变换分别为 R(s)、C(s)。传递函数 G(s) 或 Φ(s) 等于 C(s)/R(s)。"],
        ["外部关系","相同的外部输入输出关系可由不同物理系统实现。"]
      ],
      math:[T`G(s)=\frac{C(s)}{R(s)}\quad(\text{零初始条件})`],
      lab:transfer
    },
    17:{
      objective:"按原页的三步对照微分方程、s 域方程与有理式，突出分子分母来源。",
      lead:"零初始条件下，把 k 阶导数映射为 sᵏ，输出和输入的系数分别组成分母和分子。",
      sections:derive,
      math:[T`\sum_{i=0}^{n}a_i c^{(i)}(t)=\sum_{j=0}^{m}b_j r^{(j)}(t)`,
        T`\left(\sum_{i=0}^{n}a_i s^i\right)C(s)=\left(\sum_{j=0}^{m}b_j s^j\right)R(s)`,
        T`G(s)=\frac{C(s)}{R(s)}=\frac{b_m s^m+\cdots+b_0}{a_n s^n+\cdots+a_0}\quad(n\ge m)`],
      staticBody:derivation
    }
  });
})();
