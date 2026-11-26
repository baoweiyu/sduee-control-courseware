"use strict";

(() => {
  const W = IntroWidgets;
  const {range:R, choices:C, readouts, note, ink, escape} = W;
  const groups = window.CourseUnits[5].groups;
  const fmt = (n, digits=3) => Number(n.toFixed(digits)).toString();
  const math = String.raw;
  const page = (objective, lead, sections, options={}) => ({objective, lead, sections, ...options});
  const caption = (title, text) => '<div class="selected-result"><strong>'+escape(title)+'</strong><p>'+escape(text)+'</p></div>';
  const results = (...pairs) => readouts(pairs);
  const list = (n) => Array.from({length:n}, (_,i)=>i);

  // Freeze grouped controls when the original slide treats a single example.
  function lab(source, title, fixed={}, defaults={}) {
    const base = groups.find(group=>group.source.includes(source)).lab;
    const controls = base.controls.filter(control=>!(control.id in fixed)).map(control=>
      control.id in defaults ? {...control,value:defaults[control.id]} : control);
    return {...base, title, controls, draggable:controls.some(control=>control.id===base.draggable)?base.draggable:undefined,
      draw(state) { return base.draw({...state,...fixed}); }};
  }
  function compare(source,title,key,items,gain,footer) {
    const base=lab(source,title,{}, {gain});
    return {...base,controls:[C("mode",key,items.map(item=>item[1])),...base.controls.filter(control=>control.id!=="mode")],
      draw(state){
        const frame=base.draw({...state,mode:items[state.mode][0]});
        return {...frame,note:note(footer)};
      }};
  }
  function sketch(title, poles, zeros, domain, config={}) {
    const {rays=[], curved=[], points=[], controls=[], describe=()=>[], cursor, activeSegments, vectors=()=>[]}=config;
    return {title,timed:false,controls,draggable:cursor?"x":undefined,draw(state){
      const [xmin,xmax,ymax]=domain;
      const unit=Math.min(520/(xmax-xmin),95/ymax);
      const x=real=>304+(real-(xmin+xmax)/2)*unit;
      const y=imag=>125-imag*unit;
      const point=cursor?.(state);
      const seg=activeSegments?.(state)??[];
      const geom=(points,color,w=2,dash="")=>'<polyline points="'+points.map(([a,b])=>fmt(x(a))+","+fmt(y(b))).join(" ")+'" stroke="'+color+'" stroke-width="'+w+'" fill="none" stroke-dasharray="'+dash+'" stroke-linecap="round" stroke-linejoin="round"/>';
      const circle=([a,b],color,fill)=>'<circle cx="'+x(a)+'" cy="'+y(b)+'" r="5.5" stroke="'+color+'" stroke-width="2" fill="'+fill+'"/>';
      const geometry='<svg viewBox="0 0 600 250" role="img" aria-label="'+escape(title)+'"><defs><clipPath id="ch5-sketch"><rect x="44" y="22" width="520" height="207"/></clipPath></defs>'+
        '<rect x="44" y="22" width="520" height="207" fill="#f8fafb" stroke="#dae3ed"/><g clip-path="url(#ch5-sketch)">'+
        list(Math.ceil(xmax)-Math.ceil(xmin)+1).map(i=> Math.ceil(xmin)+i).map(a=>geom([[a,-ymax],[a,ymax]],"#e2e8ef",1)).join("")+
        geom([[xmin,0],[xmax,0]],"#9caec2",1.3)+geom([[0,-ymax],[0,ymax]],"#9caec2",1.3)+
        rays.map(([a,d])=>geom([[a,0],[a+20*Math.cos(d*Math.PI/180),20*Math.sin(d*Math.PI/180)]],"#9caec2",2,"5 4")).join("")+
        curved.map(curve=>geom(curve,ink.teal,3)).join("")+
        seg.map(([a,b])=>geom([[a,0],[b,0]],ink.teal,3)).join("")+
        vectors(state).map(([start,end,color])=>{
          const ex=x(end[0]),ey=y(end[1]),sx=x(start[0]),sy=y(start[1]),a=Math.atan2(ey-sy,ex-sx);
          return geom([start,end],color,2.6)+'<path d="M'+ex+' '+ey+'L'+(ex-11*Math.cos(a-.42))+' '+(ey-11*Math.sin(a-.42))+' L'+(ex-11*Math.cos(a+.42))+' '+(ey-11*Math.sin(a+.42))+'Z" fill="'+color+'"/>';
        }).join("")+
        poles.map(([a,b])=>'<path transform="translate('+x(a)+' '+y(b)+')" d="M-4 -4L4 4M-4 4L4 -4" fill="none" stroke="'+ink.blue+'" stroke-width="2.6"/>').join("")+
        zeros.map(z=>circle(z,ink.violet,"#ffffff")).join("")+
        points.map(([a,b])=>'<path transform="translate('+x(a)+' '+y(b)+')" d="M0 -5L5 0 0 5 -5 0Z" fill="#547391" stroke="white" stroke-width="1.2"/>').join("")+
        (point?circle(point,ink.orange,ink.orange):"")+'</g>'+
        list(Math.ceil(xmax)-Math.ceil(xmin)+1).map(i=>Math.ceil(xmin)+i).filter(a=>x(a)>49&&x(a)<558).map(a=>'<text x="'+x(a)+'" y="245" text-anchor="middle" fill="#53657b" font-size="12">'+escape(a)+'</text>').join("")+
        '<text x="564" y="117" fill="#53657b" font-size="13">σ</text><text x="'+Math.min(554,x(0)+8)+'" y="30" fill="#53657b" font-size="13">jω</text></svg>';
      const [read=[],head="",body=""]=describe(state);
      return {art:geometry,readouts:readouts(read),detail:head?caption(head,body):"",note:note("× 为开环极点，○ 为开环零点，虚线为辅助方向。")};
    }};
  }
  const real = (...roots) => roots.map(r=>[r,0]);
  const ends = sketch("由三个极点出发，终点分两类",real(0,-1,-5),real(-3),[-6,1,2.6],{
    controls:[C("group","观察",["有限零点","无穷远"])],
    curved:follow(k=>cubicRoots(6,5+k,3*k),14),
    vectors:({group})=>group?[[[-1.5,1.5],[-1.5,2.65],ink.orange],[[-1.5,-1.5],[-1.5,-2.65],ink.orange]]:[[[-4.3,0],[-3.07,0],ink.orange]],
    describe:({group})=>[[["分支总数","3"],["所选终点",group?"两条到无穷远":"一条到 −3"]],
      group?"还有两个终点在无穷远":"有限零点接收一条分支","每个开环极点按重数提供起始分支。"]
  });
  const oddCount = sketch("在实轴上点选一个试点",real(-5,-2,0),real(-3),[-6,1.1,1.1],{
    controls:[R("x","试点实部",-6,1,.05,-1)],cursor:s=>[s.x,0],activeSegments:()=>[[-5,-3],[-2,0]],
    describe:({x})=>{
      const endpoints=[-5,-3,-2,0], n=endpoints.filter(p=>p>x).length;
      const text=endpoints.some(p=>Math.abs(p-x)<1e-8)?"开环端点":n%2?"奇数，入轨":"偶数，区段外";
      return [[["试点",fmt(x,2)],["右侧个数",String(n)],["判定",text]],"从试点向右数","重根按重数计，复零极点成对抵消角度。"];
    }
  });
  function cubic(index,title,gain){
    const base=groups.find(item=>item.source.includes(29)).lab;
    const maximum=[10,13,330][index], step=index===2?1:.01;
    return {...base,title,controls:[R("gain","增益 K₁",0,maximum,step,gain)],draggable:"gain",draw(state){
      const frame=base.draw({mode:index,amount:100*state.gain/maximum});
      return {...frame,note:note("拖动增益，橙点是同一增益下的闭环极点。")};
    }};
  }
  const ex3 = (title,gain) => lab(17,title,{},gain===undefined?{}:{gain});
  function rulesCover(page){
    const model=groups.find(group=>group.source.includes(30)).lab;
    const diagram=model.draw({mode:0,amount:60,cover:true}).art;
    const notes=page.sections.map(([title,body])=>'<section><h2>'+escape(title)+'</h2><p>'+escape(body)+'</p></section>').join("");
    return '<div class="locus-cover"><figure>'+diagram+'<figcaption>从 0、−1、−2 三个开环极点出发；橙点标出 K₁ = 6 时的闭环极点。</figcaption></figure><aside>'+notes+'</aside></div>';
  }
  const intro = (title,gain) => lab(5,title,{introZoom:true},gain===undefined?{}:{gain});
  const planeTrial = (title,real,imag) => lab(9,title,{},{real,imag});

  const pages = {
    1:page("认识根轨迹法的四个部分","画出闭环极点随参数改变走过的路径，并从路径判断稳定性及动态性能。",[
      ["5.1 根轨迹及其方程","理解根轨迹由哪些闭环极点组成。"],["5.2 绘制根轨迹","用端点、实轴区段与特征位置构造轨迹。"],
      ["5.3 广义根轨迹","将变化的结构参数或不同反馈符号纳入同一套方法。"],["5.4 根轨迹分析","由极点、零点和闭环增益估计响应。"]]),
    2:page("按三讲掌握根轨迹","三讲依次解决方程、画法和分析。",[
      ["第一讲","根轨迹的定义、方程和两个判定条件。"],["第二讲","七条绘制规则与典型画法。"],["第三讲","广义根轨迹及系统的根轨迹分析。"]]),
    3:page("建立根轨迹的方程","先看二阶开放增益例，再把复数等式拆成相角和幅值。",[
      ["5.1.1 基本概念","观察闭环极点随增益连续变化。"],["5.1.2 根轨迹方程","由特征方程得到相角条件、幅值条件，并在复平面验证候选点。"]]),
    4:page("把离散根值连成轨迹","逐个计算增益只得到离散的根。根轨迹展示所有可取增益下极点的连续去向。",[
      ["如何构图","根据相角条件找可能的位置，再用幅值条件标对应增益。"],["读图精度","草图用于判断趋势，临界值、交点和指定指标应回代方程核对。"]],{lab:lab(5,"从孤立的根值看连续移动",{introZoom:true},{gain:.5})}),
    5:page("推导导入系统的闭环极点","单位负反馈二阶系统的开环极点在 0 和 −2。把开环增益写成 K₁=2K，便于直接读出两闭环根。",[
      ["闭环特征式","由 1+G(s)=0 得到 s²+2s+K₁=0。"],["判别式","1−K₁ 的正、零、负决定两个实根、重根或共轭复根。"]],
      {math:[math`G(s)=\frac{K}{s(0.5s+1)},\quad s_{1,2}=-1\pm\sqrt{1-K_1}`],lab:intro("拖动增益，验证闭环求根式",.5)}),
    6:page("在五个增益处读取闭环根","在 K₁=1 处，运动类型从实轴上的两根变成竖直方向上的共轭对。",[
      ["K₁ 逐级变化",["0：0、−2。","0.5：约 −0.29、−1.71。","1：−1 二重根。","2：−1±j。","趋于 ∞：实部保持 −1，虚部幅度趋于无穷。"]],
      ["稳定范围","K₁>0 时两根严格位于左半平面。K₁=0 时一个根位于原点。"]],{lab:intro("沿特征值样本检查闭环极点",1)}),
    7:page("定义增益根轨迹","增益 K₁ 从 0 连续变到 ∞，闭环特征根在 s 平面上描出的路径称为根轨迹。",[
      ["两个实根","K₁=0 从 0、−2 出发，K₁ 增大后在实轴上相向运动。"],["重根与共轭根","K₁=1 在 −1 会合，K₁>1 沿 Re s=−1 上下分开，虚部绝对值不断增大。"]],
      {lab:intro("看两条分支如何出发、会合和分开",2)}),
    8:page("从增益变化判断性能取舍","K₁ 增大提高系统跟踪斜坡的能力，同时在欠阻尼区增加超调。",[
      ["欠阻尼区 K₁>1","ωₙ=√K₁，ζ=1/√K₁，衰减实部保持 −1。常用 2% 工程近似 tₛ≈4/(ζωₙ) 给出约 4 s。"],
      ["阶跃与斜坡","K₁ 分别为 0.25、1、2、4、10 时，阶跃超调约 0%、0%、4.3%、16.3%、35.1%。速度误差系数 Kᵥ=K₁/2，单位斜坡稳态误差为 2/K₁。"]],
      {lab:intro("移动增益，观察阻尼和极点",4)}),
    9:page("把复数等式拆成两个条件","对于 K₁>0 的标准负反馈，闭环特征方程把开环频域表达式限制在复数 −1。",[
      ["相角条件","∑ 零点向量角减 ∑ 极点向量角为 (2k+1)·180°，决定点是否入轨。"],["幅值条件","该点所需增益等于极点距离乘积除以零点距离乘积，直接用于有限、非开环零极点的候选点。"]],
      {math:[math`1+G(s)H(s)=0\;\Longrightarrow\;|G(s)H(s)|=1,\quad\angle G(s)H(s)=(2k+1)180^{\circ}`],lab:planeTrial("移动候选点，看角度误差和所需增益",-1.5,2.6)}),
    10:page("核对例 5-1 的复数候选点","开环极点为 0、−2、−6.6，零点为 −4。画出这些位置指向候选点 −1.5+j2.55 的向量。",[
      ["原图读数","约 45°−120°−79°−26°=−180°。输入原给候选点后可看到精确角度略有偏差。"],
      ["精确核对","固定实部 −1.5，轨迹交点虚部约 2.598，所需增益为 12.6。"]],{lab:planeTrial("调节候选点虚部，使总相角接近 180°",-1.5,2.55)}),
    11:page("反算例 5-1 在实点的增益","s=−5 的开环总相角等价于 180°，可以直接把各距离代入幅值条件。",[
      ["极点距离","到 0、−2、−6.6 的距离分别为 5、3、1.6。"],["零点距离","到 −4 的距离为 1，所以 K₁=5×3×1.6/1=24。"]],{lab:planeTrial("用向量的长度和方向核对 −5",-5,0)}),
    12:page("辨析根轨迹上的位置与增益","对候选点先做相角判定，对已入轨的点求对应增益。",[
      ["特征根与增益","根轨迹包含随增益变化所有闭环特征根；−5 入轨后才计算对应的 24。"]],{quiz:{prompt:"选择正确的陈述。",options:["根轨迹描出闭环特征根随增益变化的路径。","相角条件可以判定候选位置。","幅值条件单独即可判定是否入轨。","幅值条件给出已入轨点的对应增益。"],answers:[0,1,3],feedback:"相角约束位置，幅值恢复增益。"}}),
    13:page("用七条规则组织草图","先搭实轴与端点，再补无穷远方向和有限增益的特征位置。",[
      ["轨迹骨架","分支数与对称性、起点与终点、实轴区段。"],["轨迹形状","渐近线、分离和会合点、出射和入射角、虚轴交点。"],["作图后检验","将标记点代回特征方程或相角、幅值条件。"]],{staticBody:rulesCover}),
    14:page("数出分支并利用共轭对称","实系数系统有 n 个闭环特征根，按重数计即有 n 条根轨迹分支。",[
      ["连续性","随增益连续改变，每条根以连续路径移动，重根处可会合或分开。"],["对称性","共轭根成对出现，上半平面的分支可沿实轴镜像得到。"]],{lab:intro("用二阶例检查分支数和对称性",1.5)}),
    15:page("给每条轨迹安排起点和终点","标准真分式开环有 n 个极点、m 个有限零点。每条分支从一个开环极点开始。",[
      ["有限终点","m 条分支趋向有限零点，其余 n−m 条趋向无穷远。幅值公式中，K₁→0 时极点距离乘积趋零；K₁→∞ 时可由相邻零点距离趋零，或由 |s|ⁿ⁻ᵐ 增大得到。"],["本页例子","K₁(s+3)/[s(s+1)(s+5)] 有三个起点 0、−1、−5，一个有限终点 −3，以及两个无穷远终点。"]],{lab:ends}),
    16:page("用奇数规则筛选实轴区段","负反馈标准根轨迹在实轴上的候选点右侧，实零点与实极点总数须为奇数。",[
      ["为何向右数","右边因子贡献 180°，左边因子贡献 0°，共轭因子成对合成 0°（模 360°）。"],["本页结果","开环实标记从左到右为 −5、−3、−2、0。实轴区段是 (−5,−3) 与 (−2,0)，端点按极限理解。"]],{lab:oddCount}),
    17:page("例 5-3 从端点和实轴开始","开环 K₁(s+2)/[s(s+1)] 有两个极点和一个有限零点。",[
      ["起止点","起点 0、−1，有限终点 −2，另一支走向无穷远。"],["实轴区段","奇数规则给出 (−1,0) 与 (−∞,−2)。闭环特征式是 s²+(1+K₁)s+2K₁=0。"]],{lab:ex3("从开环端点追踪两条闭环分支",.1)}),
    18:page("求例 5-3 的复根圆","仅在两根共轭时，用韦达公式代入实部和虚部。",[
      ["从韦达开始","2σ=−(1+K₁)，σ²+ω²=2K₁。"],["消去 K₁","(σ+2)²+ω²=2。复根沿圆移动，中心为 −2，半径为 √2。"]],{lab:ex3("观察共轭极点在圆上的位置",2)}),
    19:page("确定无穷远分支的渐近线","n>m 时，无穷远处的 n−m 条渐近线在实轴上有公共交点。",[
      ["交点与方位","交点由极点和减零点和再除以 n−m 得到。各角为 (2q+1)·180°/(n−m)，q=0,…,n−m−1。"],
      ["角度由来","远处各零极点向量近似同向，角度差约为 n−m 倍的方向角。"],["三个极点例","0、−1、−4，无有限零点。交点 −5/3，方位 +60°、180°、−60°。"]],{lab:lab(19,"观察三条渐近线的角度与交点",{mode:2},{gain:6})}),
    20:page("比较两种渐近线分布","从正实轴量角，根轨迹向无穷远的方向只由 n−m 的数目决定。",[
      ["两个极点","0 和 −2，无有限零点。交点 −1，方向 ±90°。"],["三个极点","0、−1、−4，无有限零点。交点 −5/3，方向 ±60°、180°。"]],{lab:compare(19,"切换两个极点和三个极点","开环极点",[[1,"两个极点"],[2,"三个极点"]],8,"两种结构的增益独立取值，虚线只表示远端渐近方向。")})
  };

  const departure3 = sketch("从上半平面复极点量出射方向",[[0,0],[-1,1],[-1,-1]],[],[-3.4,2,2.1],{
    controls:[C("angles","检查",["原点向量","共轭极点向量","出射方向"])],
    vectors:({angles})=>[[[[0,0],[-1,1],ink.orange]],[[[-1,-1],[-1,1],ink.orange]],[[[-1,1],[-.42,.42],ink.orange],[[-1,-1],[-.42,-.42],ink.orange]]][angles],
    describe:({angles})=>[[["所选角度",["135°","90°","−45°"][angles]]],
      ["从 0 指向 −1+j","从 −1−j 指向 −1+j","沿已知角反求未知角"][angles],
      ["相对正实轴逆时针量到 135°。","向上的竖直向量贡献 90°。","180°−135°−90°=−45°，下半平面方向与其镜像。"][angles]]
  });
  const break5 = sketch("筛选驻点，辨认分离点",real(-2,-1,0),[],[-3,1.2,1.1],{
    controls:[C("point","候选点",["−0.423","−1.577"])],
    points:real(-1+1/Math.sqrt(3),-1-1/Math.sqrt(3)),
    cursor:s=>[-1+(s.point?-1:1)/Math.sqrt(3),0],activeSegments:()=>[[-3,-2],[-1,0]],
    describe:({point})=>[[["K₁",point?"−0.385":"+0.385"],["判定",point?"排除":"实轴分离点"]],"驻点需通过增益条件","令 K₁=−s(s+1)(s+2)，在候选点直接计算。"]
  });
  delete break5.draggable;

  // Cubic formula keeps all three branches available even at a repeated root.
  function cubicRoots(a,b,c) {
    const p=b-a*a/3, q=2*a*a*a/27-a*b/3+c, d=q*q/4+p*p*p/27, shift=a/3;
    if(d>1e-10){
      const u=Math.cbrt(-q/2+Math.sqrt(d)),v=Math.cbrt(-q/2-Math.sqrt(d));
      return [[u+v-shift,0],[-(u+v)/2-shift,(u-v)*Math.sqrt(3)/2],[-(u+v)/2-shift,-(u-v)*Math.sqrt(3)/2]];
    }
    if(p>=-1e-10)return [[-shift,0],[-shift,0],[-shift,0]];
    const alpha=Math.acos(Math.max(-1,Math.min(1,-q/(2*Math.sqrt(-(p*p*p)/27)))));
    return list(3).map(i=>[2*Math.sqrt(-p/3)*Math.cos((alpha+2*i*Math.PI)/3)-shift,0]).sort((a,b)=>a[0]-b[0]);
  }
  function follow(solve, upper, steps=120) {
    const order=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
    const curves = solve(0).map(z=>[z]);
    for(let i=1;i<=steps;i++){
      const next=solve(i*upper/steps);
      let best=order[0], min=Infinity;
      for(const candidate of order){
        const distance=candidate.reduce((total,j,branch)=>{
          const [x,y]=curves[branch].at(-1), [nx,ny]=next[j];
          return total+(x-nx)**2+(y-ny)**2;
        },0);
        if(distance<min){min=distance;best=candidate;}
      }
      best.forEach((j,branch)=>curves[branch].push(next[j]));
    }
    return curves;
  }
  const familyGains=[.5,2,10];
  const familyColors=[ink.blue,ink.teal,ink.orange];
  const familyBranches=familyGains.map(k=>follow(a=>cubicRoots(1+a,a,k),16));
  function family(overlay) {
    return {title:overlay?"把三个固定增益的轨迹叠在同一坐标中":"固定 K₁ 后，沿一幅图移动 a",timed:false,
      controls:[C("family","固定 K₁",["0.5","2","10"],1),R("a","变化参数 a",0,8,.01,1)],draggable:"a",
      draw({family:index,a}){
        const k=familyGains[index], boundary=(Math.sqrt(1+4*k)-1)/2, roots=cubicRoots(1+a,a,k);
        const base=sketch("结构参数根轨迹",cubicRoots(1,0,k),real(0,-1),[-4.3,1.5,2.4],{
          rays:[[0,180]]
        });
        const data=base.draw({});
        const xmin=-4.3,xmax=1.5,ymax=2.4, x=a=>44+(a-xmin)*520/(xmax-xmin), y=b=>125-b*95/ymax;
        const visible=overlay?[0,1,2]:[index];
        const paths=visible.flatMap(i=>familyBranches[i].map(curve=>'<polyline points="'+curve.map(([a,b])=>fmt(x(a),2)+","+fmt(y(b),2)).join(" ")+'" stroke="'+familyColors[i]+'" stroke-width="'+(i===index?3:1.6)+'" opacity="'+(i===index?1:.65)+'" fill="none"/>')).join("");
        const locs=roots.map(([a,b])=>'<circle cx="'+x(a)+'" cy="'+y(b)+'" r="4.8" fill="'+ink.orange+'" stroke="white" stroke-width="1.5"/>').join("");
        const svg=data.art.replace('</g>',paths+locs+'</g>');
        return {...data,art:svg,readouts:results(["固定 K₁",fmt(k)],["稳定边界 a*",fmt(boundary)],["当前极点",Math.abs(a-boundary)<1e-8?"有虚轴极点":a>boundary?"实部均为负":"存在右半平面极点"]),
          detail:caption("a = "+fmt(a),"临界交点在虚轴 ±j"+fmt(Math.sqrt(boundary))+"，较大的 K₁ 需要较大的 a 才能稳定。"),
          note:note(overlay?"三种颜色对应 K₁=0.5、2、10，橙点沿所选曲线移动。":"切换选择才会改变固定的 K₁，拖动只改变 a。")};
      }};
  }

  Object.assign(pages,{
    21:page("从重根条件找分离点候选","在有限、非开环零点处，把增益写作 K₁(s)=−D(s)/N(s)，重根处导数为零。",[
      ["求候选解","D=s(s+1)(s+2)，N=1，令 3s²+6s+2=0，得 s=−1±1/√3。"],
      ["等价算法","对 −D/N 取对数导数，可把驻点条件写成 ∑1/(d−zⱼ)=∑1/(d−pᵢ)。"],
      ["再做两次核对","−0.423 位于轨迹实轴段且 K₁≈0.385，保留。−1.577 位于区段外且得负增益，排除。"]],{lab:break5}),
    22:page("例 5-3 求两个重根及增益","含有限零点时同样可在 D/N 可导处计算 K₁ 的驻点。",[
      ["计算","K₁=−s(s+1)/(s+2)，令导数为零得 s²+4s+2=0。"],
      ["一处分离，一处会合","−2+√2 对应 K₁=3−2√2≈0.172，从实轴分离。−2−√2 对应 K₁=3+2√2≈5.828，回到实轴会合。"]],
      {lab:ex3("把增益调到两个临界值的两侧",.18)}),
    23:page("拼合例 5-3 的完整轨迹","两根从 0、−1 出发，在右边重根处分开，在左边重根处重新回到实轴。",[
      ["中段","离开实轴后沿中心 −2、半径 √2 的共轭圆弧移动。"],["末段","会合后，一支向右趋于有限零点 −2，另一支向左趋向无穷远。"]],{lab:ex3("从出发、分离、会合看到分支终点",6.1)}),
    24:page("用相角条件求离开或进入的方向","对候选点趋近单复极点或单复零点取极限，把指向该点附近的方向作为未知角。",[
      ["复极点 p","出射角是 180° 加所有零点向量角，再减其他极点向量角。"],["复零点 z","入射角是 180° 减其他零点向量角，加所有极点向量角。这里的角从零点指向附近轨迹。"],
      ["三极点例","对开环 K₁/[s(s²+2s+2)]，在 −1+j 处用 135°、90° 求得出射角 −45°。"]],{lab:departure3}),
    25:page("为四极点例逐个相加求出射","开环 K₁/[s(s+2)(s²+2s+2)] 的四个极点为 0、−2、−1±j。",[
      ["量三个已知方向","从 0、−2、−1−j 指向 −1+j 的向量角依次为 135°、45°、90°。"],
      ["给出两条方向","上方出射角为 180°−270°=−90°，下方为 +90°。"]],{lab:lab(25,"滑动增益检查两支的竖直出射",{mode:0},{gain:.1})}),
    26:page("例 5-5 求穿越虚轴的增益","闭环特征式为 s³+3s²+2s+K₁。改变增益后，共轭根到达虚轴。",[
      ["令 s=jω","实部 K₁−3ω²=0，虚部 ω(2−ω²)=0。非零频率下 K₁=6，交点 ±j√2。"],
      ["用劳斯判据独立核对","首列是 1、3、(6−K₁)/3、K₁，闭环渐近稳定范围为 0<K₁<6。"]],{lab:cubic(0,"滑动 K₁ 穿过劳斯稳定边界",6)}),
    27:page("按七条规则拼出一张根轨迹图","先用几何结构限定轨迹，再由方程给关键位置和增益。",[
      ["分支与端点",["① 分支数与对称性。按重数计开环极点，实系数系统的轨迹关于实轴对称。","② 起点与终点。标出开环极点、有限零点及趋向无穷远的分支。"]],
      ["实轴与远端",["③ 实轴段。沿试点向右数实零极点，标准负反馈的正增益轨迹取奇数段。","④ 渐近线。求无穷远分支的渐近线交点和方位。"]],
      ["转折与方向",["⑤ 分离点和会合点。由重根条件求候选点，用增益和相角筛选。","⑥ 出射角和入射角。由其余零极点的向量角求复端点附近的方向。"]],
      ["稳定边界",["⑦ 虚轴交点。用特征方程或劳斯表求临界增益与穿越频率。","将图中的关键点及对应增益代回方程，核对草图。"]]]),
    28:page("检查实轴段和渐近线两项计算","讨论 K₁/[s(s+1)(s+4)]，开环极点为 0、−1、−4。",[
      ["题一","从右向左逐段数右侧极点。正确的实轴段为 (−1,0) 及 (−∞,−4)。"],["题二","三条渐近线从 σₐ=−5/3 出发，方向为 ±60°、180°。"]],
      {quiz:{prompt:"实轴段和渐近线，哪一组都正确？",options:["[−1,0] 及 [−4,−1]；两条、±90°。","[−1,0] 及 (−∞,−4]；三条，中心 −5/3，方向 ±60°、180°。","[0,+∞) 及 [−4,−1]；三条，中心 −1。","整条负实轴；四条，方向 ±45°、±135°。"],answers:[1],feedback:"右侧个数为 1 或 3 的有限实轴区段入轨。n−m=3，交点由三个极点的平均值得到。"}}),
    29:page("例 5-5 逐项构造三阶轨迹","开环极点 0、−1、−2，无有限零点，闭环特征式 s³+3s²+2s+K₁。",[
      ["骨架","实轴区段 (−1,0)、(−∞,−2)，渐近中心 −1，渐近角 ±60°、180°。"],
      ["关键点","实轴分离 −1+1/√3≈−0.423，K₁≈0.385。虚轴交点 ±j√2，K₁=6，由劳斯表或 s=jω 均可核对。"]],
      {lab:cubic(0,"沿三条分支检验分离点和稳定边界",.38)}),
    30:page("例 5-5 连续追踪三条分支","三条分支从 0、−1、−2 出发，分别趋向三条渐近线。",[
      ["分支去向","从 −2 出发的分支沿负实轴走向无穷远。另两支先相向运动，再经共轭轨迹穿越虚轴。"],
      ["用增益划分稳定区间","0<K₁<6 时稳定，K₁=6 时有虚轴共轭根和实根 −3，K₁>6 时共轭对进入右半平面。"]],
      {lab:cubic(0,"滑动 K₁，比较越界前后的位置",5.6)}),
    31:page("例 5-6 计算四阶根轨迹的标记点","开环分母为 s(s+3)(s²+2s+2)，极点为 0、−3、−1±j。",[
      ["几何骨架","实轴段 (−3,0)。渐近中心 −1.25，方向 ±45°、±135°。上方复极点出射角约 −71.6°。"],
      ["有限增益的特征点","驻点满足 4s³+15s²+16s+6=0，保留分离点约 −2.289，K₁≈4.33。穿越虚轴时 K₁=8.16，交点 ±j√1.2。"]],
      {lab:cubic(1,"用扫动增益检查四阶系统的标记点",4.33)}),
    32:page("例 5-6 用根轨迹读出四个闭环极点","选择 K₁≈2.62，沿四条分支各读一个点，再用特征式核对。",[
      ["一对共轭根","约 −0.409±j0.709，靠近虚轴。"],["两个实根","约 −1.41、−2.77，在实轴区段上。K₁ 增加到 8.16 时一对共轭根到达虚轴。"]],
      {lab:cubic(1,"同步读取共轭对和另外两条实支路",2.62)}),
    33:page("例 5-7 同时辨认实轴和复平面的重根","开环分母为 s(s+4)(s²+4s+20)，极点 0、−4、−2±4j。",[
      ["几何骨架","实轴段 (−4,0)，中心 −2，方向 ±45°、±135°。上方复极点出射角 −90°。"],
      ["两类重根","在 s=−2、K₁=64 实轴分离。在 s=−2±j√6、K₁=100 出现一对复重根。"],
      ["虚轴边界","K₁=260 时穿越于 ±j√10，稳定区间 0<K₁<260。"]],{lab:cubic(2,"对照 K₁=64、100、260 三个特征位置",100)}),
    34:page("把根轨迹从增益推广到结构参数","特征方程对所选参数呈线性时，可以整理为同样的复数条件。",[
      ["参量根轨迹","选择一个可变参数，从新等效开环读出起点和终点。"],["零度和非最小相位","从特征式确定总符号，再判断沿 0° 或 180° 规则作图。"]]),
    35:page("整理出等效开环零点与极点","把随 A 改变的项归在一起，将特征方程写成 Q(s)+A P(s)=0。",[
      ["归一化","除以 Q 后得到 1+A P(s)/Q(s)=0，等效零点来自 P，等效极点来自 Q。"],["相同闭环根","变形前后要保留同一个特征方程。若 P 和 Q 有公因子，须单独核查固定根。"]]),
    36:page("例 5-8 把结构参量 a 放到增益位置","原开环为 4/[s(s+a)]。固定常数 4，让 a 沿非负实数改变。",[
      ["整理","闭环特征式 s²+as+4=0，改写成 1+a s/(s²+4)=0。"],["等效开环","从等效分式读得极点 ±j2、有限零点 0，分别确定新的起点和终点。"]],
      {lab:lab(36,"以 a 为旋钮，观察两支从 ±j2 出发",{mode:0,gain:3},{a:.4})}),
    37:page("例 5-8 从左半圆过渡到负实轴","0<a<4 时两根为共轭对，乘积为 4，实部为 −a/2。",[
      ["半圆段","a 从 0 增到 4，两支从 ±j2 沿半径 2 的左半圆趋于 −2。"],["实轴段","a=4 在 −2 得二重根。a>4 时一支趋于 0，另一支趋向负无穷。"]],
      {lab:lab(37,"让 a 跨过 4，观察两根从共轭变成实数",{mode:0,gain:3},{a:4})}),
    38:page("例 5-9 固定增益后再改变结构参数","由 s(s+1)(s+a)+K₁=0 得等效开环 a s(s+1)/[s²(s+1)+K₁]。",[
      ["三幅独立的图","分别取 K₁=0.5、2、10，每幅只改变 a。三条支路从分母三个根出发，两支趋向 0、−1，一支沿 180° 趋向无穷远。"],
      ["核查稳定性","对 K₁>0，稳定边界满足 a(a+1)=K₁，稳定一侧为 a>a*。"]],{lab:family(false)}),
    39:page("例 5-9 把三条参量轨迹叠成曲线族","固定 K₁ 沿一条曲线改变 a，改变 K₁ 则切换到曲线族中的另一条。",[
      ["稳定门槛上升","a*=(√(1+4K₁)−1)/2，K₁ 越大，需要越大的 a 才能稳定。"],["虚轴交点","每条曲线自己的交点为 ±j√a*。比较三者的交点高度。"]],{lab:family(true)}),
    40:page("由特征式的总符号判断零度根轨迹","当特征方程为 1−K₁N(s)/D(s)=0，开环乘积等于 +1。正反馈或前向表达式中提取出的负号都可能出现这一形式。",[
      ["零度相角","相角为 2k·180°，仍由幅值 1 算出所需 K₁。"],["作图前检查","整理正的参数与分式符号，结合反馈方程确认零度或 180°。"]],
      {lab:lab(40,"将同一三阶结构切换为正反馈",{mode:1},{gain:1.5})})
  });

  const zeroRule = sketch("同一组极点，切换实轴上的奇偶区段",[[0,0],[-2,0],[-1,1],[-1,-1]],[],[-4,2,1.8],{
    controls:[C("sign","反馈符号",["负反馈 · 180°","正反馈 · 0°"])],
    activeSegments:({sign})=>sign?[[-4,-2],[0,2]]:[[-2,0]],
    describe:({sign})=>[[["右侧实零极点",sign?"偶数":"奇数"]],
      sign?"零度规则选中两侧":"180° 规则选中中间","复极点成对，实轴上净相角为 0°（模 360°）。"]
  });
  const signed = (title, mode, gain) => lab(40,title,{mode},{gain});
  const rhp = (title,gain) => compare(40,title,"分子符号",[[2,"s − 1 · 180°"],[3,"1 − s · 0°"]],gain,
    "极点和零点保留原位，同一个正增益下只比较分子总符号。");

  function stepResponse([a1,a2,a3],[b0,b1=0]) {
    const dt=.04, n=a3==null?2:3;
    let state=Array(n).fill(0);
    const derivative=xs=>n===2?[xs[1],1-a2*xs[0]-a1*xs[1]]:[xs[1],xs[2],1-a3*xs[0]-a2*xs[1]-a1*xs[2]];
    const advance=(xs,dx,h)=>xs.map((x,i)=>x+h*dx[i]);
    return list(301).map(i=>{
      const result={t:i*dt,y:b0*state[0]+b1*state[1]};
      const k1=derivative(state),k2=derivative(advance(state,k1,dt/2)),k3=derivative(advance(state,k2,dt/2)),k4=derivative(advance(state,k3,dt));
      state=state.map((x,i)=>x+dt*(k1[i]+2*k2[i]+2*k3[i]+k4[i])/6);
      return result;
    });
  }
  const trace=(series,label,color,dash)=>({series,key:"y",label,color,dash});
  const overview=intro("调节增益，同步查看极点与阶跃",4);
  pages[8].lab={...overview,timed:true,chartTitle:"闭环单位阶跃响应",draw(state){
    const frame=overview.draw(state),k=state.gain,series=stepResponse([2,k],[k]);
    const zeta=k>0?1/Math.sqrt(k):Infinity;
    const peak=zeta<1?100*Math.exp(-zeta*Math.PI/Math.sqrt(1-zeta*zeta)):0;
    return {...frame,chart:W.plot([trace(series,"单位阶跃输出",ink.teal)],state.time,{low:0,high:1.45}),
      readouts:results(["阻尼比 ζ",Number.isFinite(zeta)?fmt(zeta):"—"],["超调",k>0?fmt(peak)+"%":"—"],["单位斜坡稳态误差",k>0?fmt(2/k):"—"]),
      detail:caption("K₁ = "+fmt(k),"欠阻尼区增益加大，超调增加；速度误差系数 Kᵥ 也随之增加。"),
      note:note("拖动增益对照 s 平面和波形，拖动时间游标读取瞬时响应。")};
  }};
  const dipoleBase=stepResponse([2,5],[5]);
  const dipole={
    title:"拖动零点，观察近似抵消何时有效",chartTitle:"带偶极子与二阶近似的阶跃响应",
    controls:[R("z","零点到原点的距离",.19,.9,.01,.55)],draggable:"z",draw({z,time}){
      const series=stepResponse([2.5,6,2.5],[2.5,2.5/z]);
      const prior=sketch("闭环偶极子的相对位置",[[-1,2],[-1,-2],[-.5,0]],real(-z),[-2.8,1.4,2.6]).draw({});
      return {...prior,chart:W.plot([trace(series,"完整三阶",ink.teal),trace(dipoleBase,"二阶近似",ink.violet,true)],time,{low:0,high:1.65}),
        readouts:results(["内部间距 d",fmt(Math.abs(z-.5))],["外部距离 D",fmt(Math.hypot(.5,2))],["最大波形差",fmt(Math.max(...series.map((point,i)=>Math.abs(point.y-dipoleBase[i].y))))]),
        detail:caption("两组模型均保持单位直流增益","拖动紫色零点对应的距离，比较慢实极点的剩余影响。"),
        note:note("移动零点或拖动时间游标，读出两条曲线的分离程度。")};
    }
  };
  const zeroCases=[null,5,2,.5,0];
  const zeroBranches=zeroCases.map(b=>follow(k=>cubicRoots(2,b==null?0:k,b==null?k:k*b),27));
  const zerosLab={
    title:"固定三个开环极点，移动一个实零点",chartTitle:"所选结构的单位阶跃响应",
    controls:[C("which","零点位置",["无零点","b = 5","b = 2","b = 0.5","b = 0"],3),R("gain","增益 K₁",.1,8,.1,3)],draggable:"gain",
    draw({which,gain,time}){
      const b=zeroCases[which], roots=cubicRoots(2,b==null?0:gain,b==null?gain:gain*b);
      const prior=sketch("左半平面零点位置与闭环轨迹",real(0,-2),b==null?[]:real(-b),[-6,3,4],{curved:zeroBranches[which],points:roots}).draw({});
      const series=b==null?stepResponse([2,0,gain],[gain]):b===0?stepResponse([2,gain],[gain]):stepResponse([2,gain,gain*b],[gain*b,gain]);
      const status=["不稳定","不稳定","临界","渐近稳定","约分后稳定"][which];
      return {...prior,chart:W.plot([trace(series,"闭环输出",ink.teal)],time,{low:Math.min(0,...series.map(x=>x.y)),high:Math.max(1.2,...series.map(x=>x.y))*1.08}),
        readouts:results(["零点",b==null?"无":fmt(-b)],["K₁",fmt(gain)],["闭环判定",status]),
        detail:caption(status,["没有左半平面零点，两支进入右半平面。","零点较远，仍有右半平面根。","可约去 −2，剩余极点 ±j√K₁。","0<b<2，全部闭环极点在左半平面。","输入输出模型可约去原点；原状态模型的原点模态仍须核对。"][which]),
        note:note("原点为二重开环极点，空心圆标记开环零点，实心菱形标记当前闭环根。")};
    }
  };

  Object.assign(pages,{
    41:page("对照七条规则哪些受反馈符号影响","从 180° 改为 0° 后，凡直接使用相角的三条规则都要改。",[
      ["改变的三条","实轴区段由右侧奇数改偶数。渐近角、出射角及入射角的基准角由 (2k+1)·180° 改为 2k·180°。"],
      ["其余照用","分支数与对称性、端点、分离与会合的驻点条件、虚轴交点。渐近线中心也相同。"],
      ["同一开环结构","K₁/[s(s+2)(s²+2s+2)] 的四个开环极点保持原位，只切换相角规则。"]],{lab:zeroRule}),
    42:page("例 5-10 画正反馈的三阶根轨迹","正反馈特征式 s(s+1)(s+2)−K₁=0，由零度规则选区段和方向。",[
      ["实轴和渐近线","实轴上为 (−2,−1) 与 (0,∞)，渐近中心 −1，方向 0°、±120°。"],
      ["分离与稳定","s=−1−1/√3≈−1.577 对应 K₁≈0.385。正实轴自由分支说明所有 K₁>0 都不稳定。"]],
      {lab:signed("移动增益，跟踪正实轴分支",1,.4)}),
    43:page("对照同一三阶结构的正、负反馈","用相同的 K₁ 比较 s(s+1)(s+2)+K₁=0 与 s(s+1)(s+2)−K₁=0。",[
      ["负反馈","两条实轴轨迹为 (−∞,−2) 和 (−1,0)，渐近角 ±60°、180°。"],["正反馈","实轴选段互补，渐近角 0°、±120°。两图在本例中关于 s=−1 镜像，因为平移后分母是奇函数。"]],
      {lab:compare(40,"切换反馈符号，对比同一 K₁ 的轨迹","反馈符号",[[0,"负反馈 · 180°"],[1,"正反馈 · 0°"]],.4,"把 K₁ 跨过 6，观察两种反馈各自的稳定范围。")}),
    44:page("例 5-11 首一化后判 0° 或 180°","按课件采用的术语，开环在右半平面含零点或极点即作为非最小相位情形讨论。",[
      ["相同零极点","两个系统都有极点 0、−1、−2 和零点 +1。"],["分子符号决定判型","s−1 已首一，对应 180°。1−s=−(s−1)，提取负号后对应 0°。"]],
      {lab:rhp("固定零极点位置，只比较分子的符号",1)}),
    45:page("例 5-11 画出两种符号的全部实轴段","先判断首一化带来的符号，再用奇偶规则标出各段。",[
      ["系统（1）","区段 (−2,−1)、(0,1)，分离点约 −1.53，渐近线方向 ±90°。用 (−3−1)/2 得渐近中心 −2。"],
      ["系统（2）","区段 (−∞,−2)、(−1,0)、(1,∞)，渐近方向 0°、180°。K₁=1.5 时一对根穿越虚轴。"]],
      {lab:rhp("分别核对 180° 与 0° 的分支去向",1.5)}),
    46:page("例 5-11 比较两种结构的稳定区间","两种系统的开环零点都在 +1，分子符号改变了各自的闭环轨迹。",[
      ["系统（1）","一支从 0 沿正实轴走向 +1，K₁>0 时始终不稳定。"],["系统（2）","稳定范围 0<K₁<1.5；边界有一对虚轴根。右半平面零点也限制能达到的带宽和响应速度。"]],
      {lab:rhp("调到 K₁=1.5 两侧，对比两种稳定结论",1.5)}),
    47:page("由根轨迹读出系统性能","轨迹给闭环极点，完整响应还需要闭环零点和增益。",[
      ["先读极点","根据目标阻尼选点，代幅值条件确定增益。"],["再看响应形状","补齐闭环分子，判断主导极点，比较零点与偶极子的影响，并由开环结构探索校正。"]]),
    48:page("由反馈结构求闭环零点与增益","前向通道的零点和反馈通道的极点出现在闭环分子中。存在公因子时按约分后的输入输出模型读零点。",[
      ["从结构代入","用 G=KＧNＧ/DＧ、H=KＨNＨ/DＨ 代入 Φ=G/(1+GH)，并通分。"],
      ["闭环零点来自哪里","通分后的分子包含前向通道的分子 NＧ 和反馈通道的分母 DＨ。先检查公因子，再读闭环零点。"],
      ["闭环增益怎样保留","首一多项式表示下，分子系数因子来自 KＧ。对严格真分式开环，首一闭环分母不改变这个因子。"]],
      {math:[math`\Phi(s)=\frac{K_GN_G(s)D_H(s)}{D_G(s)D_H(s)+K_GK_HN_G(s)N_H(s)}`]}),
    49:page("用幅值试探与根之和核对闭环极点","在根轨迹上选试点，按距离乘积求其对应 K₁，逐步逼近期望增益。",[
      ["根之和与积","n−m≥2 时特征方程的 sⁿ⁻¹ 项系数不随 K₁ 变动。可借由根的和求少数未知根，再用根的积回代。"],
      ["例 5-5 校验","K₁=6，已知 ±j√2，第三根为 −3。三根乘积为 −6，与常数项 +6 相符。"]],
      {lab:cubic(0,"在虚轴交点读取第三个实根",6)}),
    50:page("例 5-13 用阻尼比选定增益","取 ζ=0.5，从负实轴量得阻尼角 β=60°。该射线与例 5-6 的上半平面轨迹相交。",[
      ["由相角选根","主导对约 −0.409±j0.709，ωₙ≈0.819 rad/s。"],["由距离求 K₁","将 |s|、|s+3|、|s²+2s+2| 相乘，得 K₁≈2.62。"]],
      {lab:lab(50,"将共轭极点调到目标阻尼射线",{}, {gain:2.62,zeta:.5})}),
    51:page("例 5-13 补齐闭环传递函数","给定 K₁≈2.62，已知一对共轭根，再借根之和与根之积找两个实极点。",[
      ["两个实极点","约 −1.41、−2.77，四根的和约 −5，乘积约 2.62。"],
      ["单位负反馈","分子为 K₁。按课件中间量精度，分母近似为 (s²+0.82s+0.67)(s²+4.18s+3.91)。"],
      ["检验近似","两个实根衰减比约 3.4 与 6.8。若只保留最慢共轭对，需再用完整波形核查。"]],{lab:cubic(1,"核对一对复根和两个实根",2.62)}),
    52:page("把闭环零极点与四项性能相连","先判稳定，再分别读运动形态、平稳性和快速性。",[
      ["稳定性与运动形态","所有闭环极点严格在左半平面时各模态都衰减。实极点产生指数分量，复共轭对产生衰减振荡。"],
      ["平稳性与快速性","复主导对阻尼比越大，典型二阶超调越小；离虚轴越远，包络衰减越快。常用 ζ=0.5～0.707，即 β≈60°～45°。"],
      ["主导极点","没有邻近零点削弱模态时，距虚轴最近的极点通常主导长时响应。"]],
      {lab:lab(52,"比较实部位置与阻尼角对动态的意义",{}, {gain:2.62,zeta:.5})}),
    53:page("判断闭环偶极子能否近似抵消","闭环零点与极点的距离远小于各自到其他零极点的距离时，该极点的响应权重往往较小。",[
      ["量相对距离","本页 p=−0.5、z=−0.55，d=0.05；到 −1±j2 约为 2.06。1/5 是工程经验量级。"],
      ["量波形差","对比同单位直流增益的二阶近似和完整三阶，特别是起始段。闭环偶极子用于响应近似，开环偶极子则涉及低频增益设计。"]],
      {lab:dipole}),
    54:page("例 5-14 比较同轨迹的两种闭环分子","比例微分控制和速度反馈都得到 K(0.8s+1)/[s(5s+1)] 这个开环乘积，闭环极点一致。",[
      ["共同分母","K₁=0.16K，两种闭环模型的 D=s²+(0.2+K₁)s+1.25K₁。"],["不同分子","前向带比例微分时，分子是 K₁(s+1.25)，有零点 −1.25。零点在反馈通道时前向分子为 1.25K₁。"]],
      {lab:lab(54,"调同一个增益，比较两种零点位置",{}, {gain:.8})}),
    55:page("例 5-14 在 K=5 时量峰值与超调","两种系统共有闭环极点 −0.5±j0.866，因此 ωₙ=1、ζ=0.5。",[
      ["前向带零点","分子添加微分分量，峰值提前到约 2.63 s，超调约 24.6%。"],["速度反馈","无闭环零点，峰值约 3.63 s，超调约 16.3%。两个波形同样收敛至 1。"]],
      {lab:lab(55,"沿时间游标对比同极点的两条阶跃曲线",{gain:.8})}),
    56:page("例 5-15 以主导极点近似三阶系统","闭环 2.7/(s³+5s²+4s+2.7) 的极点约为 −4.201、−0.400±j0.695。",[
      ["保留较慢的共轭对","−4.201 的实部绝对值约为共轭对的 10.5 倍。取近似 0.64/(s²+0.8s+0.64) 保持直流增益为 1。"],
      ["指标对比","完整模型约为 16%、4.6 s、10 s，二阶近似约为 16.3%、4.55 s、10 s，依次对应超调、峰值时间和调节时间的课件读数。"]],
      {lab:lab(56,"同轴比较原三阶响应与二阶近似",{mode:0,b:1.3,gain:3})}),
    57:page("例 5-16 选择五种开环零点位置","固定极点 0、0、−2，比较无有限零点和 K₁(s+b)/[s²(s+2)] 的四种零点。",[
      ["无零点、b=5","两者都有分支进入右半平面。"],["b=2、b=0.5","b=2 与 −2 相消并留下虚轴共轭根。b=0.5 位于稳定区间 0<b<2。"],
      ["b=0","原点的一组零极点在输入输出模型中相消，化为二阶；内部原点模态仍应核对。"]],{lab:zerosLab}),
    58:page("从开环零极点配置预判校正方向","在同类负反馈结构中，合适的左半平面零点常使相关分支左偏，加入极点则可能使稳定裕度变小。",[
      ["比较同一例","K₁/[s²(s+2)] 的渐近中心是 −2/3。增加 b=0.5 的零点后，剩下两条渐近线的中心变为 −0.75。"],
      ["运用开环偶极子","近邻因子 (s+zｃ)/(s+pｃ) 在远离两点处近似 1，在低频使增益乘以 zｃ/pｃ。稳态误差改善取决于系统型别和该比值。"]],
      {lab:{...zerosLab,title:"比较加零点前后的两幅轨迹",controls:[C("which","开环配置",["无有限零点","加零点 −0.5"]),R("gain","增益 K₁",.1,8,.1,3)],
        draw(s){return zerosLab.draw({...s,which:s.which?3:0});}}}),
    59:page("从根轨迹定义走到系统设计","理解一条曲线如何连接开环结构、闭环极点和动态性能。",[
      ["定义与方程","K₁ 从 0 到 ∞，闭环根描出路径。相角条件定位置，幅值条件定增益。"],
      ["绘图与推广","按七条规则画常规轨迹，改变参量、反馈符号或首一化符号后沿用相角、幅值框架。"],
      ["分析与设计","用 ζ 射线定点、主导极点和偶极子近似响应，通过开环零极点配置进入系统校正。"]]),
    60:page("综合辨析根轨迹作图与设计","把位置判定、稳定区间和工程配置放在同一题中检验。",[
      ["判断依据","例 5-5 说明 K₁>6 时再增大增益会失稳，有效的左半平面零点配置也须结合结构和位置判断。"]],
      {quiz:{prompt:"选择正确的陈述。",options:["非开环零极点的有限候选点用相角判位置，幅值求对应 K₁。","增大根轨迹增益总会提高闭环稳定性。","同类负反馈结构中，合适的左半平面零点通常使轨迹左偏。","常用主导阻尼比 0.5～0.707 对应从负实轴量起约 60°～45°。"],answers:[0,2,3],feedback:"例 5-5 增益跨过 6 会失稳；零点配置须遵循结构条件，阻尼角 β=arccos ζ。"}})
  });

  window.SourcePolishCh5 ??= {};
  Object.assign(window.SourcePolishCh5,pages);
})();
