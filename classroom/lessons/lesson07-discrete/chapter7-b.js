"use strict";

(() => {
  const W=IntroWidgets;
  const {range:R,choices:C,readouts,escape,ink,note}=W;
  const groups=window.CourseUnits[7].groups;
  const page=(objective,lead,sections,lab,math)=>({objective,lead,sections,...(lab?{lab}:{}),...(math?.length?{math}:{})});
  const fmt=(value,d=3)=>Number(value.toFixed(d)).toString();
  const steps=(count,fn)=>Array.from({length:count},(_,i)=>fn(i));
  const title=(x,y,value,size=16,color="#435974")=>'<text x="'+x+'" y="'+y+'" fill="'+color+'" text-anchor="middle" font-size="'+size+'" font-weight="600">'+escape(value)+'</text>';
  const path=(d,color="#a1b1c5",width=1.3,dash="")=>'<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="'+width+'" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="'+dash+'"/>';
  const rect=(x,y,w,h,fill="#f7fafc",stroke="#cbd8e4")=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="6" fill="'+fill+'" stroke="'+stroke+'"/>';
  const svg=(label,geometry)=>'<svg viewBox="0 0 650 260" role="img" aria-label="'+escape(label)+'">'+geometry+'</svg>';
  const detail=(heading,copy)=>'<div class="selected-result"><strong>'+escape(heading)+'</strong><p>'+escape(copy)+'</p></div>';
  const frame=(art,meters,heading,copy,footer="")=>({art,readouts:readouts(meters),detail:detail(heading,copy),note:footer?note(footer):""});
  const lab=(title,controls,draw,draggable=controls.find(c=>!c.options)?.id)=>({title,controls,timed:false,draw,draggable});
  function prior(number,title,fixed={},defaults={},footer) {
    const base=groups.find(group=>group.source.includes(number)).lab;
    const controls=base.controls.filter(c=>!(c.id in fixed)).map(c=>c.id in defaults?{...c,value:defaults[c.id]}:c);
    return {...base,title,controls,draggable:controls.find(c=>c.id===base.draggable&&!c.options)?.id??controls.find(c=>!c.options)?.id,
      draw(state){const output=base.draw({...state,...fixed});return footer?{...output,note:note(footer)}:output;}};
  }
  function graph(label,series,config={}) {
    const {cursor,continuous=[],unit="样本 n",window}=config;
    const points=series.flatMap(s=>s.values).concat(continuous.flatMap(s=>s.values));
    const xmax=window??Math.max(1,...points.map(([x])=>x));
    const low=Math.min(0,...points.map(([,y])=>y)),high=Math.max(1,...points.map(([,y])=>y));
    const x0=57,x1=614,y0=23,y1=210,lo=low-(high-low)*.08,hi=high+(high-low)*.08;
    const X=x=>x0+(x1-x0)*x/xmax, Y=y=>y1-(y1-y0)*(y-lo)/(hi-lo);
    const radius=3.2;
    let geometry=rect(x0,y0,x1-x0,y1-y0);
    geometry+=steps(5,i=>{const y=lo+(hi-lo)*i/4, py=Y(y);return path("M"+x0+" "+py+"H"+x1,"#e4ebf0")+title(x0-23,py+4,fmt(y,1),12);}).join("");
    geometry+=steps(5,i=>{const x=Math.round(xmax*i/4);return path("M"+X(x)+" "+y0+"V"+y1,"#e4ebf0")+title(X(x),y1+18,x,12);}).join("");
    geometry+=path("M"+x0+" "+Y(0)+"H"+x1);
    if(Number.isFinite(cursor))geometry+=path("M"+X(cursor)+" "+y0+"V"+y1,ink.orange,1.3,"4 4");
    for(const {values,color,dash} of continuous)geometry+=path(values.map(([x,y],i)=>(i?"L":"M")+fmt(X(x),2)+" "+fmt(Y(y),2)).join(""),color,2.5,dash);
    for(const {values,color} of series)for(const [x,y] of values){
      geometry+=path("M"+X(x)+" "+Y(0)+"V"+Y(y),color,1.8)+'<circle cx="'+X(x)+'" cy="'+Y(y)+'" r="'+radius+'" fill="white" stroke="'+color+'" stroke-width="1.8"/>';
    }
    geometry+=title(x1-26,249,unit,13);
    [...continuous,...series].slice(0,3).forEach((item,i)=>{
      const x=72+i*148;
      geometry+=path("M"+x+" 244h16",item.color,2.5)+title(x+74,249,item.label,13);
    });
    return svg(label,geometry);
  }
  const curve=(n,f,max=1)=>steps(n+1,i=>[i*max/n,f(i*max/n)]);
  const stem=(label,color,n,fn)=>({label,color,values:steps(n+1,i=>[i,fn(i)])});
  const line=(label,color,values,dash)=>({label,color,values,dash});
  const sampleMeter=(n,v)=>[["样本索引","n = "+n],["幅值",fmt(v)]];
  function signalDiagram(titleText,elements,{selected=-1,feedback="none",outputVirtual=false,feedbackSelected=false,feedbackLabel="H(s)"}={}) {
    const refY=105, n=elements.length, step=490/n, x=i=>90+(i+.5)*step;
    const leadArrow=(start,end,y)=>path("M"+start+" "+y+"H"+end)+path("M"+(end-7)+" "+(y-4)+"L"+end+" "+y+"L"+(end-7)+" "+(y+4),"#738ca7",1.55);
    let geometry=title(40,refY-15,"r(t)",15)+leadArrow(29,feedback==="none"?90:75,refY)+title(616,refY-15,"c(t)",15);
    if(feedback!=="none"){
      geometry+='<circle cx="79" cy="105" r="10" fill="#f8fafc" stroke="#8ba2bb"/>'+title(79,111,"Σ",14);
      geometry+=leadArrow(89,90,refY);
    }
    elements.forEach(({label,type},i)=>{
      const at=x(i), active=selected===i;
      geometry+=leadArrow(90+i*step,at-33,refY);
      if(type==="switch"){
        const virtual=outputVirtual&&i===n-1;
        geometry+=path("M"+(at-33)+" 105h17m32 0h17m-43 0 26 -16",active?ink.orange:ink.teal,2.2,virtual?"4 4":"")+
          '<circle cx="'+(at-16)+'" cy="105" r="3.6" fill="#f8fafc" stroke="'+ink.teal+'"/><circle cx="'+(at+16)+'" cy="105" r="3.6" fill="#f8fafc" stroke="'+ink.teal+'"/>'+
          title(at,148,label,14,active?ink.orange:ink.teal);
      } else {
        geometry+=rect(at-33,83,66,44,active?"#e2f1eb":"#f7fafc",active?ink.teal:"#9eb4ca")+title(at,111,label,15,active?ink.teal:"#425b74");
      }
      geometry+=path("M"+(at+33)+" 105H"+(90+(i+1)*step),"#738ca7",1.65);
    });
    geometry+=leadArrow(580,620,refY);
    if(feedback!=="none"){
      const sample=feedback==="sample";
      geometry+=path("M590 105V197H"+(sample?"422":"360"),"#698aa7",1.7);
      if(sample)geometry+=path("M422 197h-15m-30 0h-17m47 0-26-16",feedbackSelected?ink.orange:ink.teal,2)+title(395,227,"反馈采样",13,feedbackSelected?ink.orange:ink.teal);
      geometry+=rect(290,176,70,42,"#f7fafc","#9eb4ca")+title(325,202,feedbackLabel,15)+path("M290 197H79V116","#698aa7",1.7)+path("M75 124l4-8 4 8","#698aa7",1.7)+title(64,131,"−",14);
    }
    return svg(titleText,geometry);
  }
  const b=label=>({label,type:"block"}), sw=label=>({label,type:"switch"});
  function topology(titleText,options,cases) {
    return lab(titleText,[C("which","选择结构",options)],({which})=>{
      const design=cases[which];
      return frame(signalDiagram(titleText,design.blocks,design),design.meters,design.heading,design.copy,design.footer);
    });
  }
  const ex6=lab("用长除递推逐项读取样本",[R("n","观察样本",0,10,1,3)],({n})=>{
    const terms=[0,10];
    for(let i=2;i<=10;i++)terms.push(3*terms[i-1]-2*terms[i-2]);
    return frame(graph("长除系数逐拍生成的序列",[stem("长除系数 c[n]",ink.teal,10,i=>terms[i])],{cursor:n}),
      sampleMeter(n,terms[n]),"指数是延迟拍数","从 n=2 起，每个新系数等于前一项的三倍减去前二项的两倍。");
  });
  const ex7=prior(31,"沿两项之差读取采样序列",{kind:1,T:1},{order:3},"在 n=0、1 代入闭式，再观察后续样本趋向 1。");
  const residueBase=prior(32,"切换例 7-8 和例 7-9",{kind:2},{order:4});
  const ex89={...residueBase,controls:[C("which","选留数算例",["二重极点","两个负实极点"]),...residueBase.controls],draw(state){
    const base=groups.find(group=>group.source.includes(32)).lab;
    return {...base.draw({...state,kind:state.which+2}),note:note("周期 T 作用于例 7-8，例 7-9 的序列由两个固定实极点决定。")};
  }};
  const nearby=lab("从同一序列计算前向和后向差分",[C("side","取样方向",["前向差分","后向差分"]),R("n","观察索引 n",2,7,1,4)],({side,n})=>{
    const sample=k=>k*k*.1, p=side?n-1:n, q=side?n-2:n+2;
    return frame(graph("前后向差分的样本位置",[stem("序列 y[n]",ink.teal,9,sample)],{cursor:n}),
      [["一阶差分",fmt(side?sample(n)-sample(p):sample(n+1)-sample(n))],["二阶差分",fmt(sample(q)-2*sample(side?p:n+1)+sample(n))]],
      side?"向过去取两拍":"向未来取两拍","示例 y[n]=0.1n²，一阶差分随时刻变化，二阶差分恒为 0.2。");
  });
  const holdIntegral=lab("在每个采样区间保持误差并积分",[R("T","采样周期 T",.2,1.2,.1,1," s"),R("K","积分增益 K",.3,1.8,.1,.7),R("n","观察拍数",0,9,1,2)],({T,K,n})=>{
    const period=1-K*T, state=i=>1-period**i;
    const out=curve(180,t=>{const k=Math.floor(t);return state(k)+(t-k)*K*T*(1-state(k));},10);
    const hold=steps(10,i=>[[i,1-state(i)],[i+1,1-state(i)]]).flat();
    return frame(graph("阶梯误差与分段线性积分",[],{window:10,cursor:n,continuous:[line("保持误差",ink.orange,hold),line("积分输出",ink.teal,out)]}),
      [["e[n]",fmt(1-state(n))],["区间斜率 Ke[n]",fmt(K*(1-state(n)))],["下一拍 c[n+1]",fmt(state(n+1))]],
      "误差保持，输出逐段积分","图的横轴以采样拍为单位。斜率读数对应物理时间，区间增量等于斜率乘 T。");
  });
  const ex12=lab("从初值逐拍生成例 7-12 的输出",[R("n","观察索引 n",0,11,1,3)],({n})=>{
    const a=[0,1];for(let i=2;i<=11;i++)a[i]=1-3*a[i-1]-2*a[i-2];
    return frame(graph("二阶差分序列",[stem("y[n]",ink.teal,11,i=>a[i])],{cursor:n}),sampleMeter(n,a[n]),"递推与 z 反变换吻合",
      "初值是 0、1，随后为 −2、5、−10、21。中间的 (−2)ⁿ 成分导致交替发散。");
  });
  const pulse=lab("从一串输入脉冲构造输出样本",[R("n","观察索引 k",0,9,1,3),R("a","示例衰减比",.25,.9,.05,.65)],({n,a})=>{
    const r=i=>i===0||i===2||i===3?1:0,g=i=>a**i,y=i=>steps(i+1,j=>r(j)*g(i-j)).reduce((v,q)=>v+q,0);
    return frame(graph("输入脉冲与卷积响应",[stem("输入 r[n]",ink.blue,9,r),stem("输出 c[n]",ink.teal,9,y)],{cursor:n}),
      [["r[k]",fmt(r(n))],["c[k]",fmt(y(n))]],"输出是已到达脉冲响应的叠加","每个输入样本作为权重，把延迟的单位脉冲响应加到输出上。图用示例 g[n]=aⁿ。");
  });
  const noSwitch=topology("沿输入端到输出端查采样边界",["连续中段","整体离散"],[
    {blocks:[sw("输入采样"),b("G₁(s)"),b("G₂(s)"),sw("虚拟采样")],selected:1,outputVirtual:true,
      meters:[["中段信号","连续 x(t)"]],heading:"中间没有采样",copy:"G₁(s) 和 G₂(s) 属于同一个连续段。"},
    {blocks:[sw("输入采样"),b("G₁(s)G₂(s)"),sw("虚拟采样")],selected:1,outputVirtual:true,
      meters:[["离散对象","G₁G₂(z)"]],heading:"先乘后变",copy:"只对两个连续环节的乘积整体做一次 z 变换。"}
  ]);
  const zHold=lab("改变采样周期，查看保持器怎样移动分子和极点",[R("a","连续极点参数 a",.3,2,.05,1),R("T","周期 T",.2,1.5,.05,1," s")],({a,T})=>{
    const pole=Math.exp(-a*T),k=(1-pole)/a;
    return frame(signalDiagram("保持器和对象属于同一连续段",[sw("输入采样"),b("Gₕ(s)"),b("G₀(s)"),sw("虚拟采样")],{selected:1,outputVirtual:true}),
      [["z 极点",fmt(pole)],["分子常数",fmt(k)]],"先构造一步延迟差","零阶保持与连续对象之间没有开关。移位因子 1−z⁻¹ 作用于 Z[G₀(s)/s]。");
  });
  const errorTap=topology("检查误差采样前后能否提出离散量",["误差采样","前向传递","反馈回路"],[
    {blocks:[sw("误差采样"),b("G(s)"),sw("虚拟采样")],selected:0,feedback:"continuous",outputVirtual:true,meters:[["同步输入","E*(s)"]],heading:"在误差节点之后采样",copy:"R(s) 与反馈信号先相减，误差再经过实际采样开关。"},
    {blocks:[sw("误差采样"),b("G(s)"),sw("虚拟采样")],selected:1,feedback:"continuous",outputVirtual:true,meters:[["前向因子","G(z)"]],heading:"输出采样用于描述 C(z)",copy:"C(s)=G(s)E*(s)，所以 C(z)=G(z)E(z)。"},
    {blocks:[sw("误差采样"),b("G(s)"),sw("虚拟采样")],selected:2,feedback:"continuous",outputVirtual:true,meters:[["回路因子","GH(z)"]],heading:"反馈连续段整体取样",copy:"从误差开关绕一圈才遇到下一次实际采样，因此回路用 Z[G(s)H(s)]。"}
  ]);
  const pages={
    29:page("用极限、指数乘子和卷积读 z 变换","先判断终值定理的极点条件，再由 z 域直接提取序列的初值与终值。",[
      ["初值与终值","f(0)=lim 当 z→∞ 的 F(z)。若 (1−z⁻¹)F(z) 的全部极点严格位于单位圆内，f(∞)=lim 当 z→1 的 (1−z⁻¹)F(z)，等价于有限终值时的 (z−1)F(z)。"],
      ["复数位移","乘 exp(±anT)，对应 F(z) 的变量替换为 z exp(∓aT)。"],
      ["卷积","c[k]=Σₙ₌₀ᵏ g[k−n]r[n] 对应 C(z)=G(z)R(z)。可与拉氏变换的移位、卷积定理对照。"]],{...pulse,title:"用脉冲和验证 z 变换的卷积性质"}),
    30:page("例 7-6 用长除逐拍恢复序列","把分子分母按 z 降幂排列，整体除去最高次后以 z⁻¹ 为变量逐项长除。",[
      ["初始系数","F(z)=10z/(z²−3z+2)，得到 c₀=0、c₁=10。"],
      ["后续递推","cₙ=3cₙ₋₁−2cₙ₋₂，从 n=2 得 30、70、150。cₙ 是 δ(t−nT) 的权重。长除直接给样本，通常不直接给闭式。"]],ex6),
    31:page("例 7-7 先分解 F(z)/z，再查表","将 F(z)=0.5z/[(z−1)(z−0.5)] 除以 z 后分解。",[
      ["先拆分后乘回","F(z)/z=1/(z−1)−1/(z−0.5)。乘回 z，匹配标准变换对 z/(z−a) ↔ aⁿ。"],
      ["闭式序列","f(nT)=1−0.5ⁿ，脉冲列各权重从 0 开始并逐步趋向 1。"]],ex7),
    32:page("例 7-8 和 7-9 用留数恢复样本","计算 F(z)zⁿ⁻¹ 的留数之和，围线包住其全部极点，也须检查原点。",[
      ["单极点与重极点","单极点乘去一阶因子后取极限。q 重极点先乘去 q 阶因子，再求 q−1 阶导数并除以 (q−1)!。"],
      ["例 7-8","F(z)=Tz/(z−1)²。对 Tzⁿ 求一次导数并令 z=1，得 f[n]=nT。"],
      ["例 7-9","F(z)=z/[(z+1)(z+2)]。两留数为 (−1)ⁿ 与 −(−2)ⁿ，相加得 0、1、−3、7、…。"]],ex89,
      [String.raw`f[n]=\frac{1}{2\pi j}\oint F(z)z^{n-1}\,dz=\sum_i\operatorname{Res}_{z=p_i}\bigl[F(z)z^{n-1}\bigr]`]),
    33:page("把差分方程和脉冲传递函数连起来","先用相邻采样值列方程，再用 z 变换把关系变成代数式。",[
      ["7.5 差分方程","建立并求解线性差分方程。"],["7.6 脉冲传递函数","理解输入输出关系，按开关位置区分开环和闭环结构。"]]),
    34:page("把前向与后向差分写成相邻样本之差","k 阶线性差分方程联系 c[n] 到 c[n+k]，输入 r[n] 至 r[n+m]，其中 m≤k。",[
      ["前向差分","Δy[n]=y[n+1]−y[n]，Δ²y[n]=y[n+2]−2y[n+1]+y[n]。"],
      ["后向差分","∇y[n]=y[n]−y[n−1]，∇²y[n]=y[n]−2y[n−1]+y[n−2]。继续重复同一操作即可求更高阶。"]],nearby,
      [String.raw`c[n+k]+\sum_{i=0}^{k-1}a_ic[n+i]=\sum_{j=0}^{m}b_jr[n+j],\quad m\le k`]),
    35:page("例 7-10 用前向差分近似导数","原单位负反馈一阶系统满足 ċ(t)+Kc(t)=Kr(t)。",[
      ["用割线代替切线","t=nT 处的导数用 (c[n+1]−c[n])/T 近似。T 越小，光滑解上的近似通常越精确。"],
      ["得到递推","c[n+1]+(KT−1)c[n]=KT r[n]。比较同一 K 下不同 T 的离散点和连续阶跃。"]],
      prior(35,"拖动采样周期，对比连续解和前向近似",{},{T:.4,K:1.45},"蓝线表示连续精确解，绿点表示前向差分近似。")),
    36:page("例 7-11 在每个采样区间积分","采样开关、零阶保持器和 K/s 依次串联，采用单位负反馈。",[
      ["保持区间","nT≤t<(n+1)T 时，保持输出 eₕ(t)=e(nT)，所以 c(t)=c(nT)+Ke(nT)(t−nT)。"],
      ["用下一拍收口","取 t=(n+1)T，并代入 e[n]=r[n]−c[n]，得到 c[n+1]+(KT−1)c[n]=KT r[n]。这个结构中由积分严格得到。"]],holdIntegral),
    37:page("例 7-12 把初始条件一起带进 z 变换","y[n+2]+3y[n+1]+2y[n]=1，且 y[0]=0、y[1]=1。",[
      ["超前扣除初值","左边为 (z²+3z+2)Y(z)−z。代入 R(z)=z/(z−1)，解得 Y(z)=z²/[(z−1)(z+1)(z+2)]。"],
      ["展开并求逆","Y(z)/z=1/[6(z−1)]+1/[2(z+1)]−2/[3(z+2)]，故 y[n]=1/6+(−1)ⁿ/2−2(−2)ⁿ/3。初值和逐拍递推均可复核。"]],ex12),
    38:page("从零初始输入输出定义脉冲传递函数","在输入脉冲列作用下，连续对象产生移位的脉冲响应。输出可设置虚拟同步采样。",[
      ["采样形成卷积","t=kT 时 c[k]=Σₙ₌₀ᵏ r[n]g[k−n]。因此 C(z)=G(z)R(z)，零初始条件下 G(z)=C(z)/R(z)=Z[g(nT)]。"],
      ["连续域与离散域","G(s) 表示连续对象，G(z) 表示对象和采样的组合。通常写 Z[G(s)] 作为先反拉氏再取样的缩写。"]],pulse),
    39:page("先合并没有中间采样的连续环节","若 G₁(s)、G₂(s) 之间没有采样开关，中间信号 x(t) 保持连续。",[
      ["先乘再变","G(z)=Z[G₁(s)G₂(s)]，记作 G₁G₂(z)。"],
      ["推广","n 个连续串联环节全部合成后，再对整个传递表达式取样和 z 变换。"]],noSwitch),
    40:page("例 7-13 由中间采样拆分离散环节","中间同步开关让后一环节的输入进入可单独描述的脉冲序列，故 C/R=G₁(z)G₂(z)。",[
      ["两个一阶环节","G₁(s)=1/(s+a)，G₂(s)=1/(s+b)。置 A=e⁻ᵃᵀ、B=e⁻ᵇᵀ。a≠b 时两种结构都含分母 (z−A)(z−B)。"],
      ["分子不同","无中间开关的分子是 z(A−B)/(b−a)，有开关的分子是 z²。a=b 时前者取极限。"],
      ["推广","每相邻环节间均同步采样时，分别求各脉冲传递函数再相乘。"]],prior(40,"直接对比同一对象的两个中间结构",{},{T:.54,a:.85,mode:0})),
    41:page("例 7-14 用延迟差处理零阶保持器","保持器与 G₀(s)=1/(s+a) 无中间开关，先组合为 (1−e⁻ᵀˢ)G₀(s)/s。",[
      ["移位对应","因果时间延迟 T 对应乘 z⁻¹，所以 G(z)=(1−z⁻¹)Z[G₀(s)/s]。"],
      ["求出一阶离散形式","G(z)=(1−e⁻ᵃᵀ)/[a(z−e⁻ᵃᵀ)]。与直接采样的一阶对象相比，本例保持同一有限极点，分子和增益改变。"]],zHold),
    42:page("由误差通道采样求闭环脉冲传递函数","连续反馈的输入误差先经采样，再通过 G(s)。从开关沿回路追踪连续乘积。",[
      ["两条连续方程","E(s)=R(s)−H(s)C(s)，C(s)=G(s)E*(s)。采样后 E*(s)=R*(s)−(GH)*(s)E*(s)。"],
      ["解出两个比值","C(z)/R(z)=G(z)/[1+GH(z)]，E(z)/R(z)=1/[1+GH(z)]。GH(z)=Z[G(s)H(s)]，1+GH(z)=0 为特征方程。"]],errorTap)
  };

  const digital=topology("观察独立的数字控制器在哪里分出",["单位反馈","加数字控制器"],[
    {blocks:[sw("误差采样"),b("G(s)"),sw("虚拟采样")],selected:1,feedback:"continuous",feedbackLabel:"1",outputVirtual:true,
      meters:[["单位反馈","H(s)=1"]],heading:"把 GH(z) 化为 G(z)",copy:"闭环 C/R=G/(1+G)，误差 E/R=1/(1+G)。"},
    {blocks:[sw("误差采样"),b("D(s)"),sw("同步开关"),b("G(s)"),sw("虚拟采样")],selected:1,feedback:"continuous",outputVirtual:true,
      meters:[["独立因子","D(z)"],["特征方程","1+GH(z)D(z)=0"]],heading:"D 的两侧均是采样边界",copy:"X*(s)=D*(s)E*(s)，因此在分子及闭环回路都保留 D(z)。"}
  ]);
  const matrix=[
    {blocks:[sw("误差采样"),b("G(s)")],selected:0,feedback:"continuous",meters:[["闭环特征式","1+GH(z)"]],heading:"仅误差采样",copy:"C(z)=G(z)R(z)/[1+GH(z)]。从实际采样器绕一圈时 G(s)H(s) 在同一连续段。"},
    {blocks:[sw("误差采样"),b("G(s)"),sw("输出采样")],selected:2,feedback:"continuous",meters:[["闭环特征式","1+G(z)H(z)"]],heading:"误差与输出均采样",copy:"C(z)=G(z)R(z)/[1+G(z)H(z)]。输出开关位于回路内，能分别形成 G(z) 和 H(z)。"},
    {blocks:[b("G(s)")],feedback:"sample",feedbackSelected:true,meters:[["输入 R(z)","不能独立分出"]],heading:"仅反馈通道采样",copy:"C(z)=RG(z)/[1+GH(z)]，RG(z)=Z[R(s)G(s)]。输入连续，不能用任意 R(z) 独立描述。"},
    {blocks:[sw("误差采样"),b("G₁(s)"),sw("中间采样"),b("G₂(s)")],selected:2,feedback:"continuous",meters:[["闭环特征式","1+G₁(z)HG₂(z)"]],heading:"误差和两环节之间均采样",copy:"分子为 G₁(z)G₂(z)R(z)。回路中的 H 和 G₂ 位于同一连续段，合成 HG₂(z)。"}
  ];
  const positionTable=topology("切换课件表 7-1 的四种接线",["误差采样","误差与输出","仅反馈","误差与中间"],matrix);
  const aa=Math.exp(-1);
  const exactStep=[0];
  for(let i=1;i<=18;i++)exactStep[i]=(exactStep[i-1]??0)-(1-aa)*(exactStep[i-2]??0)+aa+(i>=2?1-2*aa:0);
  const transient=lab("按拍读取二阶闭环的阶跃响应",[R("n","观察索引 n",0,18,1,3)],({n})=>{
    const markers=stem("阶跃输出",ink.teal,18,i=>exactStep[i]);
    return frame(graph("例题输出采样序列",[markers],{cursor:n,continuous:[line("长除系数连线",ink.blue,markers.values,"4 5")]}),
      [["c[n]",fmt(exactStep[n],4)],["超调",fmt((Math.max(...exactStep)-1)*100,2)+"%"],["采样周期","1 s"]],
      "逐拍系数由闭环分母递推","随索引移动，读出采样值。图中虚线用于辅助读数，峰值和调节时间基于采样点。");
  });
  const between=lab("对照平滑响应和采样处的跳变",[C("case","连续输出",["平滑响应","跳变示意"]),R("T","观察采样间隔",.25,1.5,.05,.5," s")],({case:kind,T})=>{
    const smooth=t=>1-Math.exp(-.6*t)*(Math.cos(1.7*t)+.35*Math.sin(1.7*t));
    const decay=i=>1-Math.exp(-.4*i);
    const samples=(n,step,f)=>steps(n+1,i=>[i*step,f(i)]);
    const n=Math.floor(8/T), sampled=kind?samples(n,T,decay):samples(n,T,i=>smooth(i*T));
    const continuous=kind?steps(n,i=>line("实际区间",ink.blue,curve(24,u=>decay(i)-.34*(1-Math.exp(-3*u)),.999).map(([u,y])=>[(i+u)*T,y]))):
      [line("连续响应",ink.blue,curve(220,smooth,8))];
    return frame(graph("采样点与区间内连续行为",[{label:"采样点",color:ink.orange,values:sampled}],{window:8,unit:"时间 / s",continuous:[...continuous,line("采样点连线",ink.teal,sampled,"4 4")]}),
      [["采样间隔",fmt(T)+" s"],["区间行为",kind?"分段变化并跳变":"平滑变化"]],
      kind?"折线会隐去区间变化":"采样点取自同一条光滑曲线",kind?"图示在每个采样时刻前后存在跳变，折线无法恢复输出的真实区间运动。":"平滑性避免瞬时跳变，缩短 T 可看到更多响应细节。");
  });
  const axes=(center,zero,extent)=>path("M"+(center-extent-12)+" "+zero+"H"+(center+extent+12)+"M"+center+" "+(zero-extent-12)+"V"+(zero+extent+12),"#9caec3");
  const dot=(x,y,color)=>path("M"+(x-5)+" "+(y-5)+"l10 10m0 -10 -10 10",color,2.6);
  const circle=(x,y,r,fill="#e3f2eb",stroke=ink.teal)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="1.7"/>';
  const zPlane=(points,label="z 平面")=>{
    const cx=325,cy=125,r=65;
    return svg(label,circle(cx,cy,r)+axes(cx,cy,r+32)+title(cx+107,cy-9,"Re",13)+title(cx+17,cy-r-38,"Im",13)+
      title(cx+r,cy+21,"1",13)+title(cx-r,cy+21,"−1",13)+points.map(([x,y])=>dot(cx+r*x,cy-r*y,Math.hypot(x,y)<1?ink.teal:ink.orange)).join(""));
  };
  const poleMode=lab("切换六种极点位置，观察其时域形态",[
    C("kind","实际类型",["正实衰减","正实发散","负实衰减","负实发散","共轭衰减","共轭发散"]),R("n","观察索引 n",0,14,1,4)
  ],({kind,n})=>{
    const radius=kind%2?1.14:.72, angle=[0,Math.PI,Math.PI*.32][Math.floor(kind/2)], real=radius*Math.cos(angle),imag=radius*Math.sin(angle);
    const y=i=>radius**i*Math.cos(angle*i), points=Math.abs(imag)<1e-8?[[real,0]]:[[real,imag],[real,-imag]];
    const fLabel=["同号衰减","同号发散","交替衰减","交替发散","衰减振荡","发散振荡"][kind];
    const transientGraph=graph("极点产生的暂态序列",[stem("暂态分量",ink.teal,14,y)],{cursor:n});
    const art=svg("极点与模态联动",'<svg x="1" y="7" width="218" height="243" viewBox="205 22 240 212">'+zPlane(points).replace(/^<svg[^>]*>|<\/svg>$/g,"")+'</svg>'+
      '<svg x="215" y="4" width="429" height="251" viewBox="0 0 650 260">'+transientGraph.replace(/^<svg[^>]*>|<\/svg>$/g,"")+'</svg>');
    return frame(art,[["极点模长",fmt(radius)],["暂态样本",fmt(y(n))],["离散幅角",fmt(angle/Math.PI)+"π"]],fLabel,
      "极点模长决定幅值包络，幅角决定逐拍相位。负实极点的相位为 π。");
  });
  const stableUnit=lab("沿固定方向拖动一对闭环极点",[R("rho","极点模长",.2,1.48,.01,.78),R("theta","极点辐角",5,160,1,40,"°")],({rho,theta})=>{
    const x=rho*Math.cos(theta*Math.PI/180),y=rho*Math.sin(theta*Math.PI/180);
    return frame(zPlane([[x,y],[x,-y]]),[["最大模长",fmt(rho)],["单位圆判定",rho===1?"落在圆上":rho<1?"严格圆内":"存在圆外极点"]],
      rho<1?"此极点对衰减":"此极点对不渐近衰减","对全部闭环模态应用相同的模长检查，才能给出系统稳定结论。");
  });
  const bilinear=lab("拖动 z 点，看单位圆如何变成虚轴",[R("rho","z 点模长",.25,1.6,.01,.82),R("theta","z 点幅角",0,180,1,62,"°")],({rho,theta})=>{
    const x=rho*Math.cos(theta*Math.PI/180),y=rho*Math.sin(theta*Math.PI/180),d=(x+1)**2+y*y;
    const u=d<1e-12?null:(rho*rho-1)/d, v=d<1e-12?null:2*y/d;
    const clip=(num,min,max)=>Math.min(max,Math.max(min,num));
    const grid=rect(69,33,223,183)+rect(358,33,223,183)+rect(358,33,114,183,"#e3f2eb","#cbd8e4")+
      circle(180,124,55)+axes(180,124,75)+axes(472,124,75)+title(180,24,"z 平面",16)+title(472,24,"w 平面",16)+
      path("M302 124h47m-7-4 7 4-7 4","#778ba2",1.8)+
      dot(180+55*x,124-55*y,rho<1?ink.teal:ink.orange)+(u==null?title(539,195,"对应无穷远",13,ink.orange):dot(472+clip(45*u,-105,105),124-clip(45*v,-85,85),ink.blue));
    return frame(svg("z 平面和 w 平面双线性映射",grid),[["|z|",fmt(rho)],["Re w",u===null?"无穷远":fmt(u)],["Im w",v===null?"无穷远":fmt(v)]],
      u===null?"z=−1 映到无穷远":u<0?"圆内映到左半平面":u>0?"圆外映到右半平面":"单位圆映到虚轴",
      "图仅在右侧画框范围内定位。接近 z=−1 时 w 点可超出显示范围，实部和虚部读数仍按公式计算。");
  });
  const example15=prior(53,"拖动 K，让一根穿过 z=−1",{kind:1,sigma:-.28,omega:1.3},{gain:2.3},
    "保持 T=0.1 s，检查 K 约 4.328 的两侧。");
  example15.controls=[R("gain","例题增益 K",0,6,.001,2.3)];
  const errorResults=[
    ["1/Kₚ","无有限稳态误差","无有限稳态误差"],
    ["0","1/Kᵥ","无有限稳态误差"],
    ["0","0","1/Kₐ"]
  ];
  const types=["0 型","Ⅰ 型","Ⅱ 型"], inputs=["阶跃","斜坡","抛物线"];
  const errorMatrix=lab("选系统型别和给定输入，读取误差表",[C("type","系统型别",types),C("input","给定输入",inputs)],({type,input})=>{
    const rows=types.map((name,i)=>title(91,91+i*50,name,17));
    const headers=inputs.map((name,i)=>title(240+i*141,48,name,17));
    const cells=errorResults.flatMap((row,i)=>row.map((value,j)=>{
      const active=type===i&&input===j;
      return rect(170+j*141,65+i*50,137,43,active?"#e2f1eb":"#f7fafc",active?ink.teal:"#cbd8e4")+
        title(238+j*141,91+i*50,value==="无有限稳态误差"?"∞":value,18,active?ink.teal:"#435974");
    })).join("");
    return frame(svg("不同型别与给定的稳态误差矩阵",rows.join("")+headers.join("")+cells),
      [["所选输入",inputs[input]],["所选系统",types[type]],["稳态误差",errorResults[type][input]]],
      "终值定理以稳定性为前提","系统型别是开环 G(z) 在 z=1 的净极点重数。当闭环稳定时，本表可直接读出响应误差类型。");
  });

  Object.assign(pages,{
    43:page("从单位反馈推广到带数字控制器的系统","单位反馈是 H=1 的特例。数字控制器位于两个同步开关之间，由独立离散因子 D(z) 描述。",[
      ["单位反馈","C/R=G/(1+G)，E/R=1/(1+G)。"],
      ["形成控制器因子","E*=R*−(GH)*X*，X*=D*E*。消去离散的 E* 和 X*，得到 C/R=G(z)D(z)/[1+GH(z)D(z)]。"]],digital),
    44:page("按四种开关位置查闭环输出","找真正参与反馈回路的开关。若没有可独立的输入采样，连续输入会和前向环节合并在同一个采样变换中。",
      [["误差通道与误差／输出同步","① C=G(z)R(z)/[1+GH(z)]。② C=G(z)R(z)/[1+G(z)H(z)]。"],
      ["反馈采样与误差／中间采样","③ C=RG(z)/[1+GH(z)]，其中 RG(z)=Z[R(s)G(s)]。④ C=G₁(z)G₂(z)R(z)/[1+G₁(z)HG₂(z)]。"],
      ["为何分母不同","同步开关将路径划成不同的连续段。段内先连乘连续传递函数，段与段可在 z 域相乘。"]],positionTable),
    45:{...page("根据采样位置判断传递函数","回顾定义、串联系统、零阶保持器和误差通道采样各自的结论。",[
      ["速判","环节间无开关，先乘后变；有开关，先各自变换再相乘。零阶保持器可用一步延迟差处理。"]]),
      quiz:{prompt:"关于离散脉冲传递函数，哪些说法成立？",options:["脉冲传递函数反映零初始条件下的离散输入输出特征。","两个环节之间有无采样开关，脉冲传递函数通常不同。","例 7-14 加入零阶保持器后仍有同一有限极点。","误差通道采样且反馈连续时，闭环特征方程为 1+GH(z)=0。"],answers:[0,1,2,3],feedback:"四项成立。公式中的 GH(z) 是同一连续段 G(s)H(s) 的采样变换。"}},
    46:page("用单位圆分析离散时域性能","主要任务依次是读暂态、判断稳定性和计算稳态误差。",[
      ["暂态与稳定性","用闭环极点的模长和相位识别运动形态；由单位圆或 w 变换判稳定。"],
      ["稳态误差","验证终值条件后，用静态误差系数比较阶跃、斜坡和抛物线给定。"]]),
    47:page("由二阶闭环传递函数生成阶跃样本","图 7-26 是 T=1 s 的单位反馈系统，含零阶保持器和连续广义对象。令 A=e⁻¹。",[
      ["开环与闭环","保持器与对象的连续乘积为 (1−e⁻ˢ)/[s²(s+1)]，采样后 G(z)=[Az+(1−2A)]/[(z−1)(z−A)]。闭环分母为 z²−z+(1−A)，分子不变。"],
      ["长除或递推","乘单位阶跃 z/(z−1)，展开得 c[0]=0，后续按课件精度约 0.368、1、1.400、1.400、1.147、0.895、0.802。"],
      ["读时域指标","由采样点估计 Mₚ、tₛ。二阶模式仍可振荡和衰减，读数受采样间隔限制。"]],transient),
    48:page("区别采样时刻和连续区间内的响应","z 变换直接给出 c(nT)，区间中真实波形还取决于连续对象和施加的输入。",[
      ["用相对阶次判断光滑性","若 lim 当 s→∞ 的 sG(s)=0，即相对阶次至少为 2，理想冲激激励没有瞬时输出跳变，曲线可平滑连贯。"],
      ["条件不满足时","输出可能出现瞬时变化，采样点连线可能与真实轨迹明显不同。原采样值依然正确。"]],between),
    49:page("把闭环极点变成离散暂态形状","单极点模态为 Aᵢλᵢⁿ。以单位阶跃为例，输出还含由输入 z=1 对应的稳态分量。",[
      ["正实与负实","正实极点序列同号，负实极点逐拍翻号，对应角频率 π/T。"],
      ["共轭复极点","暂态为 Aρⁿcos(nθ+φ)，其中 ρ=|λ|，ω=θ/T。ρ<1 衰减，ρ>1 发散。"],
      ["工程读图","单位圆内越靠近原点通常衰减越快，负实极点容易导致样本交替。重根模态还可能有关于 n 的多项式因子。"]],poleMode),
    50:page("用指数映射把 s 平面变成 z 平面","z=eᵀˢ，令 s=σ+jω，可取 |z|=eᵀσ、arg z=Tω 模 2π。",[
      ["实部决定圆内外","σ<0 对应单位圆内，σ=0 对应单位圆周，σ>0 对应圆外。"],
      ["两类直线","等 σ 映成同心圆，等 ω 映成射线。−π/T<ω≤π/T 给出一组无重复角度，原点只能作为 σ→−∞ 的极限。"]],
      prior(50,"改变 σ 与 ω，看模长和幅角同步变化",{kind:0,gain:2.3},{sigma:-.28,omega:1.3},"当前 T=1 s，改变实部控制半径，改变虚部控制角度。")),
    51:page("用全部闭环极点的模长判稳定","从 1+GH(z)=0 或等价的闭环特征多项式求根，全部闭环模态须严格满足 |λᵢ|<1。",[
      ["连续与离散的边界","连续系统取左半 s 平面，离散系统取单位圆内。虚轴映到单位圆周。"],
      ["主导极点","稳定系统中，模长最大且响应中有显著贡献的闭环极点模态通常衰减最慢。考虑内部稳定时也要核查相消隐藏的模态。"]],stableUnit),
    52:page("把单位圆稳定条件改写为 w 平面判据","取 w=(z−1)/(z+1)，反变换为 z=(1+w)/(1−w)。它把单位圆内映到开左半平面。",[
      ["由实部判断","z=x+jy 时，Re w=(x²+y²−1)/[(x+1)²+y²]，Im w=2y/[(x+1)²+y²]。z=−1 对应无穷远。"],
      ["应用劳斯判据","用反变换代入闭环特征方程，并清去分母形成 w 多项式。检查首列同号、退化边界及 z=−1。"]],bilinear,
      [String.raw`w=\frac{z-1}{z+1},\qquad z=\frac{1+w}{1-w}`]),
    53:page("例 7-15 用劳斯判据求稳定增益范围","给定 G(s)=K/[s(0.1s+1)]、T=0.1 s，置 A=e⁻¹。先求单位反馈系统的离散特征方程。",[
      ["离散化","G(z)=K(1−A)z/[(z−1)(z−A)]，闭环特征式 z²+[K(1−A)−1−A]z+A=0。"],
      ["改写为 w 多项式","w² 项为 2(1+A)−K(1−A)，w 项为 2(1−A)，常数项为 K(1−A)。三式依次也是二阶劳斯表首列。"],
      ["稳定范围","0<K<2(1+A)/(1−A)≈4.328。边界处有 z=−1。对应连续闭环对 K>0 稳定，采样改变了本例的增益上限。"],
      ["采样频率的取舍","提高采样频率常使数字闭环更接近连续设计，也会增加运算负担。可改善稳定性与否还须按实际系统验证。"]],example15),
    54:page("先验稳定，再按型别求稳态误差","单位负反馈下 E(z)=R(z)/[1+G(z)]，以终值定理求 eₛₛ。系统型别由 G(z) 在 z=1 的极点阶数 ν 决定。",[
      ["位置误差系数","采用课件定义 Kₚ=lim[z→1](1+G(z))，单位阶跃误差为 1/Kₚ。其他资料也常把 Kₚ 定为 lim G(z)，使用时须匹配公式。"],
      ["速度和加速度系数","Kᵥ=(1/T)lim[z→1](z−1)G(z)；Kₐ=(1/T²)lim[z→1](z−1)²G(z)。对单位斜坡、单位抛物线分别取倒数。"],
      ["0／Ⅰ／Ⅱ 型","0 型仅阶跃误差有限。Ⅰ 型阶跃零差，斜坡有限。Ⅱ 型阶跃和斜坡零差，抛物线误差有限。"]],errorMatrix,
      [String.raw`e_{\mathrm{ss}}=\lim_{z\to1}(1-z^{-1})\frac{R(z)}{1+G(z)}`]),
    55:page("例 7-16 核对极点后读三个误差系数","T=1 s，G(z)=(1−e⁻¹)z/[(z−1)(z−e⁻¹)]，在 z=1 有一个净极点，为Ⅰ型。",[
      ["先验稳定","误差分母是 z²−2e⁻¹z+e⁻¹，极点约 0.368±j0.482，模长约 0.607。"],
      ["再取极限","Kₚ=∞、Kᵥ=1、Kₐ=0。阶跃稳态误差为 0，单位斜坡误差为 1，单位抛物线误差无有限终值。"]],
      prior(55,"在同一系统中切换三类给定",{T:1,K:1},{kind:1},"T 和 K 均固定为 1，曲线由原例的误差递推逐拍生成。")),
    56:page("把采样、z 变换和稳定分析串成解题路线","先标采样与保持的位置，再写离散模型，由极点和终值条件读出性能。",[
      ["7.1–7.3 采样与复现","理想采样是连续信号与脉冲列相乘。采样频率高于两倍最高频率可避免混叠，等号处须注意带边分量。零阶保持 Gₕ(s)=(1−e⁻ᵀˢ)/s，基带近似引入 T/2 延迟。"],
      ["7.4–7.6 变换与模型","z=eᵀˢ。正变换可用级数、部分分式或留数，反变换可用长除、部分分式或留数。运用线性、移位、卷积和初终值等性质，按开关位置求零初始条件的 G=C/R。"],
      ["7.7 时域性能","闭环极点全在单位圆内才渐近稳定。例 7-15 用 w 变换和劳斯表得 0<K<4.328。例 7-16 先验稳定，再得 Kᵥ=1。"]])
  });

  window.SourcePolishCh7??={};
  Object.assign(window.SourcePolishCh7,pages);
})();
