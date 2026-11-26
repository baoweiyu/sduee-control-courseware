"use strict";
(() => {
  const W = IntroWidgets;
  const {range:R, choices:C, ink, readouts, note} = W;
  const sum = ([a,b],[c,d]) => [a+c,b+d];
  const sub = ([a,b],[c,d]) => [a-c,b-d];
  const mul = ([a,b],[c,d]) => [a*c-b*d,a*d+b*c];
  const mag = z => Math.hypot(...z);
  const div = ([a,b],[c,d]) => [(a*c+b*d)/(c*c+d*d),(b*c-a*d)/(c*c+d*d)];
  const arg = z => Math.atan2(z[1],z[0])*180/Math.PI;
  const angle = x => ((x%360)+360)%360;
  const fmt = (x,n=2) => Number.isFinite(x) ? Number(x.toFixed(n)).toString() : "—";
  const roundZ = z => Math.abs(z[1])<.004 ? fmt(z[0]) : fmt(z[0])+(z[1]>0?" + j":" − j")+fmt(Math.abs(z[1]));
  const evaluate = (coeffs,s) => coeffs.reduce((value,coeff)=>sum(mul(value,s),[coeff,0]),[0,0]);
  const span = (a,b) => Array.from({length:b-a+1},(_,i)=>a+i);
  const uniform = (a,b,n) => Array.from({length:n+1},(_,i)=>a+(b-a)*i/n);
  const G = (max=10,value=2,min=0,step=.05) => R("gain","根轨迹增益 K",min,max,step,value);
  const detail = (head,body) => `<div class="selected-result"><strong>${W.escape(head)}</strong><p>${W.escape(body)}</p></div>`;
  const V = (label,x,unit="") => [label,fmt(x)+unit];

  function solve(coeffs) {
    const n=coeffs.length-1;
    const c=coeffs.map(x=>x/coeffs[0]);
    if(n===1) return [[-c[1],0]];
    if(n===2) {
      const x=-c[1]/2, d=x*x-c[2];
      return d>=0 ? [[x-Math.sqrt(d),0],[x+Math.sqrt(d),0]] : [[x,-Math.sqrt(-d)],[x,Math.sqrt(-d)]];
    }
    if(Math.abs(c[n])<1e-13) return [...solve(c.slice(0,-1)),[0,0]];
    const radius=1.4*Math.max(1,...c.slice(1).map((v,i)=>Math.abs(v)**(1/(i+1))));
    let roots=uniform(0,n-1,n-1).map(i=>{
      const theta=2*Math.PI*(i+.157)/n;
      return [radius*Math.cos(theta),radius*Math.sin(theta)];
    });
    for(let j=0;j<110;j++) {
      let limit=0;
      roots=roots.map((r,i)=>{
        const p=roots.reduce((value,w,k)=>i===k?value:mul(value,sub(r,w)),[1,0]);
        if(mag(p)<1e-21) return [r[0]+1e-8*(i+1),r[1]+1e-8];
        const d=div(evaluate(c,r),p);
        limit=Math.max(limit,mag(d));
        return sub(r,d);
      });
      if(limit<1e-10) break;
    }
    return roots.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  }
  const permutations = n => n===1?[[0]]:permutations(n-1).flatMap(list=>[...list,n-1].map((_,i)=>[...list.slice(0,i),n-1,...list.slice(i)]));
  const orders = [null,null,permutations(2),permutations(3),permutations(4)];
  const tracks=new Map();
  function locus(key,poly,min,max) {
    if(tracks.has(key)) return tracks.get(key);
    const values=uniform(min,max,96).map(k=>solve(poly(k)));
    const branches=values[0].map(z=>[z]);
    for(let i=1;i<values.length;i++) {
      let best, limit=Infinity;
      for(const ids of orders[branches.length]) {
        const distance=ids.reduce((d,id,k)=>d+mag(sub(values[i-1][k],values[i][id]))**2,0);
        if(distance<limit) { limit=distance;best=ids; }
      }
      values[i]=best.map((id,k)=>{const z=values[i][id];branches[k].push(z);return z;});
    }
    if(tracks.size>=42) tracks.delete(tracks.keys().next().value);
    tracks.set(key,branches);
    return branches;
  }
  function axis({paths=[],poles=[],zeros=[],now=[],arrows=[],guides=[],signals=[],dots=[],tall=false,center=-1,xHalfSpan,yMax=3,caption="s 平面",plotId="locus"}) {
    // On narrow loci, use the panel height for the trajectory while preserving geometric angles.
    if(paths.length && !xHalfSpan && !tall){
      const features=[...paths.flat(),...poles,...zeros,...dots,...now,...arrows.flat()];
      const xs=features.map(p=>p[0]), ys=features.map(p=>Math.abs(p[1]));
      const left=Math.min(0,...xs),right=Math.max(0,...xs);
      if(right-left < 2.25*yMax){
        tall=true;
        center=(left+right)/2;
        const halfHeight=Math.max(.5,Math.max(...ys)*1.13,(right-left)*.36);
        yMax=Math.ceil(halfHeight*2)/2;
      }
    }
    const x0=47,x1=617,y0=25,y1=tall?375:256,w=x1-x0,h=y1-y0;
    const boundary=xHalfSpan ?? w*yMax/h;
    const X=x=>(x0+x1)/2+(x-center)*w/(2*boundary), Y=y=>(y0+y1)/2-y*h/(2*yMax);
    const min=center-boundary,max=center+boundary;
    const xStep=[.5,1,2,3,4,5,10].find(step=>step>=(max-min)/8)||20;
    const xTicks=span(Math.ceil(min/xStep),Math.floor(max/xStep)).map(t=>t*xStep);
    const yTicks=uniform(-yMax,yMax,4);
    const grid=xTicks.map(x=>`<path d="M${X(x)} ${y0}V${y1}" stroke="#e4eaf0"/><text x="${X(x)}" y="${y1+17}" text-anchor="middle">${fmt(x)}</text>`).join("")
      +yTicks.map(y=>`<path d="M${x0} ${Y(y)}H${x1}" stroke="#e4eaf0"/><text x="${x0-8}" y="${Y(y)+4}" text-anchor="end">${fmt(y)}</text>`).join("");
    const line=(curve,color,width=2,dash="")=>`<polyline points="${curve.map(([x,y])=>fmt(X(x),2)+","+fmt(Y(y),2)).join(" ")}" fill="none" stroke="${color}" stroke-width="${width}" ${dash?'stroke-dasharray="'+dash+'"':""} stroke-linecap="round" stroke-linejoin="round"/>`;
    const mark=(z,type)=>{
      const x=X(z[0]),y=Y(z[1]);
      if(type==="×") return `<path d="M${x-4} ${y-4}L${x+4} ${y+4}M${x+4} ${y-4}L${x-4} ${y+4}" fill="none" stroke="${ink.blue}" stroke-width="2.4" stroke-linecap="round"/>`;
      if(type==="○") return `<circle cx="${x}" cy="${y}" r="4.8" fill="#fff" stroke="${ink.violet}" stroke-width="2.4"/>`;
      return `<circle cx="${x}" cy="${y}" r="${type==="●"?5:3}" fill="${type==="●"?ink.orange:ink.target}" stroke="#fff" stroke-width="1.4"/>`;
    };
    const labels=[poles.length?["× 开环极点",ink.blue]:null,zeros.length?["○ 开环零点",ink.violet]:null,paths.length?["— 根轨迹",ink.teal]:null,now.length?["● 当前点",ink.orange]:null].filter(Boolean);
    return `<svg class="course-diagram locus-plot" viewBox="0 0 640 ${y1+45}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${W.escape(caption)}">
      <defs><clipPath id="${plotId}-clip"><rect x="${x0}" y="${y0}" width="${w}" height="${h}"/></clipPath><marker id="${plotId}-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0L5 2.5L0 5Z" fill="${ink.target}"/></marker></defs>
      <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#fbfdfe" stroke="#e2eaf1"/>
      <g class="locus-labels" fill="#435c71" font-family="system-ui,sans-serif" font-size="11">${grid}<text class="locus-axis-title" x="${x0}" y="16" font-size="12" font-weight="600">${W.escape(caption)}</text><text x="${x1}" y="16" text-anchor="end">Im / Re</text>
        ${labels.map(([t,c],i)=>`<text x="${54+i*133}" y="${y1+36}" fill="${c}" font-weight="600">${t}</text>`).join("")}</g>
      <g clip-path="url(#${plotId}-clip)">
        <path d="M${x0} ${Y(0)}H${x1}M${X(0)} ${y0}V${y1}" stroke="#899cb1" stroke-width="1.25" fill="none"/>
        ${guides.map(p=>line(p,ink.target,1.2,"5 5")).join("")}
        ${paths.map(p=>line(p,ink.teal,2.3)).join("")}
        ${signals.map((p,i)=>line(p,i?ink.violet:ink.blue,3)).join("")}
        ${arrows.map(([from,to])=>`<path d="M${X(from[0])} ${Y(from[1])}L${X(to[0])} ${Y(to[1])}" fill="none" stroke="${ink.target}" stroke-width="1.6" marker-end="url(#${plotId}-arrow)"/>`).join("")}
        ${dots.map(z=>mark(z,"·")).join("")}${poles.map(z=>mark(z,"×")).join("")}${zeros.map(z=>mark(z,"○")).join("")}${now.map(z=>mark(z,"●")).join("")}
      </g></svg>`;
  }
  const complexRoots = roots => roots.filter(z=>z[1]>=-1e-5).map(roundZ).join("，");
  function status(roots) {
    const right=Math.max(...roots.map(z=>z[0]));
    return right>1e-5?"存在右半平面极点":right< -1e-5?"全部位于左半平面":"有极点位于虚轴";
  }
  const p0=[[0,0],[-1,0],[-2,0]];
  const p3=[[0,0],[-1,0]];
  const z3=[[-2,0]];
  const poly1=k=>[1,2,k];
  const poly3=k=>[1,1+k,2*k];
  const poly5=k=>[1,3,2,k];
  const polyTrial=k=>[1,8.6,13.2+k,4*k];
  const trialPoles=[[0,0],[-2,0],[-6.6,0]], trialZero=[[-4,0]];
  const poly6=k=>[1,5,8,6,k];
  const poly7=k=>[1,8,36,80,k];
  const cubicCases=[
    {name:"例 5-5", poly:poly5, p:p0, max:10, critical:6, freq:Math.sqrt(2), def:4, y:3.0, center:-1.2},
    {name:"例 5-6", poly:poly6, p:[[0,0],[-3,0],[-1,1],[-1,-1]], max:13, critical:8.16, freq:Math.sqrt(1.2), def:5, y:2.6, center:-1.65},
    {name:"例 5-7", poly:poly7, p:[[0,0],[-4,0],[-2,4],[-2,-4]], max:330, critical:260, freq:Math.sqrt(10), def:100, y:4.6, center:-2}
  ];
  function rays(center,angles,length) {
    return angles.map(a=>[[center,0],[center+length*Math.cos(a*Math.PI/180),length*Math.sin(a*Math.PI/180)]]);
  }
  function selectedGain(state,spec) {
    return (state.amount/100)*spec.max;
  }
  const off = {timed:false};
  const amount = (value=40)=>R("amount","增益占扫描上限",0,100,1,value,"%");
  const damping = ([x,y]) => -x/Math.hypot(x,y);
  const radiusCurve = (center,r) => uniform(0,2*Math.PI,100).map(a=>[center+r*Math.cos(a),r*Math.sin(a)]);
  const oscModel = k=>[1,1,0,k];
  function response(coeffs,numerator) {
    const n=coeffs.length-1, a=coeffs.slice(1), dt=.04;
    const diff=x=>[...x.slice(1),1-a.reduce((v,c,i)=>v+c*x[n-1-i],0)];
    const advance=(x,v,k)=>x.map((y,i)=>y+k*v[i]);
    let state=Array(n).fill(0);
    return uniform(0,12,300).map(t=>{
      const y=numerator.reduce((v,c,i)=>v+c*state[i],0);
      const v1=diff(state),v2=diff(advance(state,v1,dt/2)),v3=diff(advance(state,v2,dt/2)),v4=diff(advance(state,v3,dt));
      state=state.map((v,i)=>v+dt*(v1[i]+2*v2[i]+2*v3[i]+v4[i])/6);
      return {t,y};
    });
  }
  const groups=[
    {
      title:"调增益时，闭环极点怎样移动",
      source:span(1,8),
      points:[
        ["从特征方程入手","闭环极点是 1+G(s)H(s)=0 的根。参数连续变化时，每个极点的行迹在 s 平面上组成一条分支。"],
        ["用二阶模型建立直觉","单位反馈下取 G(s)=K/[s(0.5s+1)]。令 K₁=2K，闭环特征式为 s²+2s+K₁=0，根是 −1±√(1−K₁)。"],
        ["辨认三个阶段","K₁ 从 0 到 1 时，两根沿实轴由 0、−2 向 −1 相向运动。K₁=1 出现重根。继续增大时，两根在 Re s=−1 上形成共轭对。"],
        ["联系时域","当 K₁>1，ωₙ=√K₁，ζ=1/√K₁，振荡角频率 ωd=√(K₁−1)。增益改变振荡频率和超调趋势。"]
      ],
      lab:{...off,title:"从两个实极点到共轭极点",controls:[R("gain","归一化增益 K₁",0,10,.02,2)],draggable:"gain",
        draw(s){const roots=solve(poly1(s.gain));return {art:axis({paths:[[[-2,0],[0,0]],[[-1,-3],[-1,3]]],poles:[[0,0],[-2,0]],now:roots,center:-1,yMax:3.2,xHalfSpan:s.introZoom?1.5:undefined,caption:s.introZoom?"s 平面（横轴 Re，纵轴 Im，刻度不同）":"s 平面"}),
          readouts:readouts([V("K₁",s.gain),["闭环极点",complexRoots(roots)],V("阻尼比 ζ",s.gain>0?1/Math.sqrt(s.gain):NaN)]),
          detail:detail("在 K₁=1 观察转折","橙点重合后沿穿过 −1 的竖线分开，实部保持为 −1。"),note:note("拖动 K₁，同时观察实部与虚部。")};}}
    },
    {
      title:"用幅值和相角检验轨迹上的点",
      source:span(9,12),
      points:[
        ["写成根轨迹方程","令 L(s)=K N(s)/D(s)，K≥0。闭环极点满足 D(s)+KN(s)=0。对非开环零极点，K N(s)/D(s)=−1。"],
        ["先判断位置，再求增益","∑arg(s−zᵢ)−∑arg(s−pᵢ)=(2k+1)·180°，K=∏|s−pᵢ|/∏|s−zᵢ|。相角条件确定位置，幅值条件给出该点的增益。"],
        ["例 5-1 的复点","L=K(s+4)/[s(s+2)(s+6.6)]。课件试点 −1.5+j2.55 的实际总相角约 −180.37°，图解可读为约 −180°。在相同实部上，精确交点是 −1.5+j√6.75，K=12.6。"],
        ["例 5-1 的实点","候选点 s=−5 的代数相角为 −180°；幅值条件给出 K=5×3×1.6/1=24。幅值条件可为许多试点给出正数，是否入轨由相角条件判定。"],
        ["角度统一取向","从零点或极点向候选点作向量，以正实轴为参考。重复零点和重复极点按重数计入。"]
      ],
      lab:{...off,title:"移动候选点，检查相角残差",controls:[R("real","候选点实部 σ",-7,1,.01,-1.5),R("imag","候选点虚部 ω",0,4,.01,2.6)],draggable:"real",
        draw(s){const z=[s.real,s.imag], d=evaluate(polyTrial(0),z), n=sum(z,[4,0]), a=angle(arg(n)-arg(d)), error=Math.abs(a-180), isEndpoint=mag(d)<1e-8||mag(n)<1e-8;return {
          art:axis({paths:locus("trial",polyTrial,0,35),poles:trialPoles,zeros:trialZero,now:[z],arrows:[...trialPoles,...trialZero].map(p=>[p,z]),center:-3.2,yMax:4,caption:"候选点与开环零极点的向量"}),
          readouts:readouts([["候选点",roundZ(z)],V("总相角",isEndpoint?NaN:a,"°"),V("幅值条件所得 K",isEndpoint?NaN:mag(d)/mag(n))]),
          detail:detail(isEndpoint?"轨迹端点":"相角偏差 "+fmt(error)+"°",isEndpoint?"极点对应 K=0，零点对应 K→∞。":"相角达到 180° 时，幅值读数给出对应的正增益。"),note:note("把虚部调成 0、实部调成 −5，核对增益 24。")};}}
    },
    {
      title:"分支的起点、终点和实轴区段",
      source:span(13,18),
      points:[
        ["数分支和端点","典型真分式开环有 n 个极点、m 个有限零点。每条分支由开环极点出发。m 条到有限零点，其余 n−m 条伸向无穷远，实系数使轨迹关于实轴对称。"],
        ["在实轴上用奇数规则","实轴点右侧的实零点、实极点总数为奇数，该点属于 K≥0 的负反馈根轨迹。成对复零极点对实轴的总相角为 0° 模 360°。"],
        ["例 5-3","L(s)=K(s+2)/[s(s+1)]。起点 0、−1，有限终点 −2，实轴区段为 (−1,0) 与 (−∞,−2)。"],
        ["验证复根的圆弧","令 s=x+jy 且 y≠0，在 s²+(1+K)s+2K=0 中消去 K，得 (x+2)²+y²=2。"]
      ],
      lab:{...off,title:"实轴区段与共轭圆弧",controls:[G(9,2)],draggable:"gain",
        draw(s){const roots=solve(poly3(s.gain));return {art:axis({paths:locus("arc",poly3,0,9),poles:p3,zeros:z3,now:roots,guides:[radiusCurve(-2,Math.sqrt(2))],signals:[[[-1,0],[0,0]],[[-10,0],[-2,0]]],center:-3,yMax:2.4}),
          readouts:readouts([["起点","0，−1"],["有限终点","−2"],["当前闭环极点",complexRoots(roots)]]),
          detail:detail("圆的中心是开环零点","虚线圆的半径为 √2，圆上的分支与左右两个实轴区段在实轴交会。"),note:note("比较 K=0、K=2 和较大 K 的极点位置。")};}}
    },
    {
      title:"找渐近线和分离、会合点",
      source:span(19,23),
      points:[
        ["渐近线给出无穷远方向","n>m 时，交点 σa=(∑pᵢ−∑zᵢ)/(n−m)，方向 θq=(2q+1)·180°/(n−m)，q=0,…,n−m−1。"],
        ["用两个结构核对","开环极点 0、−2 给出交点 −1、方向 ±90°。极点 0、−1、−4 给出交点 −5/3、方向 ±60°、180°，实轴区段是 (−∞,−4) 与 (−1,0)。"],
        ["由重根求候选点","在可写 K(s)=−D(s)/N(s) 且 N(s)≠0 的位置，重根满足 dK/ds=0。再用相角条件、非负增益和根的重数筛选。"],
        ["例 5-3 的两处重根","dK/ds=0 化为 s²+4s+2=0。分离点 −2+√2 对应 K=3−2√2，会合点 −2−√2 对应 K=3+2√2。"],
        ["区分实际轨迹和辅助线","渐近线描述增益趋于无穷大的分支方向，分离与会合点是有限增益下的闭环重根。"]
      ],
      lab:{...off,title:"同一张图定位重根与渐近方向",controls:[C("mode","开环结构",["例 5-3  有限零点","两个极点","三个极点"]),G(10,2)],draggable:"gain",
        draw(s){const first=s.mode===0, b=[-2,-1,-5/3][s.mode], a=[[180],[90,270],[60,180,300]][s.mode], p=[poly3,poly1,k=>[1,5,4,k]][s.mode];
          const breaks=[[[-2+Math.SQRT2,0],[-2-Math.SQRT2,0]],[[-1,0]],[[(Math.sqrt(13)-5)/3,0]]][s.mode];
          return {art:axis({paths:locus("asym-"+s.mode,p,0,10),poles:solve(p(0)),zeros:first?z3:[],now:solve(p(s.gain)),guides:rays(b,a,15),dots:[[b,0],...breaks],center:first?-3:-1.5,yMax:first?3:2.6}),
            readouts:readouts([V("渐近线交点",b),["渐近角",a.join("°，")+"°"],["候选位置",breaks.map(z=>roundZ(z)).join(" / ")]]),
            detail:detail("先画实轴区段，再筛驻点","灰色虚线表示渐近方向，灰点标出交点与保留的实轴重根。"),note:note("切换开环结构，对比 n−m 改变时的渐近角。")};}}
    },
    {
      title:"用出射角、入射角和虚轴交点补齐草图",
      source:span(24,28),
      points:[
        ["复极点的出射角","单复极点 p 的出射角为 180°+∑arg(p−zᵢ)−∑arg(p−pᵢ)，极点求和排除 p 本身，角度取模 360°。"],
        ["复零点的入射角","单复零点 z 的入射角为 180°−∑arg(z−zᵢ)+∑arg(z−pᵢ)，零点求和排除 z 本身。这里用从 z 指向附近轨迹点的角度。"],
        ["出射练习","L=K/[s(s+2)(s²+2s+2)] 的上半平面极点为 −1+j。其余三个极点向量角 135°、45°、90°，出射角是 −90°；下半平面分支关于实轴对称。"],
        ["求穿越虚轴的增益","把 s=jω 代入闭环特征方程，分别令实部和虚部为零。也可列劳斯表，由整行零和辅助多项式求交点。"],
        ["判断左右半平面","劳斯首列符号变化数给出右半平面根数。用交点划分增益区间，再检查各区间的稳定性。"]
      ],
      lab:{...off,title:"出射方向与虚轴交点",controls:[C("mode","考察位置",["复极点出射","复零点入射"]),G(12,3)],draggable:"gain",
        draw(s){
          const first=s.mode===0, p=[[0,0],[-2,0],[-1,1],[-1,-1]], z=first?[]:[[-1,1],[-1,-1]];
          const poly=first?k=>[1,4,6,4,k]:k=>[1,3+k,2+2*k,2*k];
          const poles=first?p:p0, anchor=[-1,1];
          const deg=first?angle(180-p.filter(q=>q!==p[2]).reduce((v,q)=>v+arg(sub(anchor,q)),0))
            :angle(180-arg(sub(anchor,z[1]))+p0.reduce((v,q)=>v+arg(sub(anchor,q)),0));
          const end=[anchor[0]+Math.cos(deg*Math.PI/180),anchor[1]+Math.sin(deg*Math.PI/180)];
          const roots=solve(poly(s.gain));
          return {art:axis({paths:locus("local-"+s.mode,poly,0,12),poles,zeros:z,now:roots,arrows:[[anchor,end]],dots:first?[[0,1],[0,-1]]:[],center:-2,yMax:2.65}),
            readouts:readouts([["当前考察点",roundZ(anchor)],V(first?"出射角":"入射角",deg,"°"),["稳定性",status(roots)]]),
            detail:detail("用去掉自身的向量和求方向",first?"该四阶例在 K=5 穿过虚轴，交点是 ±j。":"灰箭头从有限零点指向附近轨迹，分支沿相反的速度方向到达零点。"),note:note("切换复极点与复零点，观察角度由哪个因子提供。")};}}
    },
    {
      title:"用三组特征方程练习完整画法",
      source:span(29,33),
      points:[
        ["例 5-5","D(s)=s(s+1)(s+2)。闭环为 s³+3s²+2s+K，稳定区间 0<K<6，K=6 时过 ±j√2。"],
        ["例 5-6","D(s)=s(s+3)(s²+2s+2)。闭环为 s⁴+5s³+8s²+6s+K，稳定区间 0<K<8.16，交点 ±j√1.2。"],
        ["例 5-7","D(s)=s(s+4)(s²+4s+20)。闭环为 s⁴+8s³+36s²+80s+K，稳定区间 0<K<260，交点 ±j√10。"],
        ["辨认多个重根","例 5-7 在 s=−2、K=64 发生实轴分离。在 s=−2±j√6、K=100，各有一对支路相遇。用 D′(s)=0 和增益反算一起核对。"]
      ],
      lab:{...off,title:"比对三阶与两种四阶根轨迹",controls:[C("mode","题例",cubicCases.map(t=>t.name)),amount()],draggable:"amount",
        draw(s){const c=cubicCases[s.mode], k=selectedGain(s,c), roots=solve(c.poly(k));
          return {art:axis({paths:locus("case-"+s.mode,c.poly,0,c.max),poles:c.p,now:roots,dots:[[0,c.freq],[0,-c.freq]],center:s.cover?-1.5:c.center,yMax:s.cover?2:c.y,tall:s.cover}),
            readouts:readouts([V("当前增益 K",k),V("稳定边界 K",c.critical),["闭环判定",status(roots)]]),
            detail:detail("穿越位置 "+roundZ([0,c.freq]),"把 K 推过稳定边界，直接观察成对极点越过虚轴。"),note:note("不同题例使用不同的扫描上限，橙点对应当前 K。")};}}
    },
    {
      title:"把结构参数变成根轨迹参数",
      source:span(34,39),
      points:[
        ["按变化参数整理","把特征多项式写成 D₀(s)+aD₁(s)=0，等效开环为 aD₁(s)/D₀(s)，然后用同样的幅角、幅值和几何规则。固定下来的系统参数仍留在 D₀ 或 D₁。"],
        ["例 5-8","s²+as+4=0 化为 1+as/(s²+4)=0。a 从 0 到 4，极点由 ±j2 沿 |s|=2 移到 −2；a>4 后沿负实轴分开。"],
        ["例 5-9","s(s+1)(s+a)+K=s³+(1+a)s²+as+K。固定 K 后，D₀=s³+s²+K，D₁=s(s+1)；稳定条件为 a>0、K>0 及 a(a+1)>K。"],
        ["参数与物理含义","等效零极点从整理后的表达式读取。模型的原开环零极点随结构参数变化时，可以另画不同取值的轨迹族。"]
      ],
      lab:{...off,title:"参数 a 改变时的等效零极点",controls:[C("mode","题例",["例 5-8  二阶","例 5-9  三阶"]),R("a","变化参数 a",0,8,.04,2),G(8,3,.2,.2)],draggable:"a",
        draw(s){
          const first=s.mode===0, poly=first?a=>[1,a,4]:a=>[1,1+a,a,s.gain], roots=solve(poly(s.a));
          const threshold=first?4:(Math.sqrt(1+4*s.gain)-1)/2;
          return {art:axis({paths:locus("general-"+s.mode+"-"+(first?0:s.gain),poly,0,8),poles:solve(poly(0)),zeros:first?[[0,0]]:[[0,0],[-1,0]],now:roots,center:-3.1,yMax:3.4}),
            readouts:readouts([V("a",s.a),[first?"实轴重根参数":"稳定边界 a",fmt(threshold)],["当前闭环极点",complexRoots(roots)]]),
            detail:detail(first?"圆弧由 a 消元得到":status(roots),first?"共轭根的乘积是 4，所以它们在圆 |s|=2 上。":"使 a(a+1) 刚好超过 K，观察共轭极点的实部。"),note:note("第二个题例可先用 K 设定轨迹族，再拖动 a。")};}}
    },
    {
      title:"识别零度根轨迹和非最小相位项",
      source:span(40,46),
      points:[
        ["反馈符号变了，角度规则随之改变","1−K N/D=0 时 K N/D=1。相角为 2k·180°，幅值仍按向量长度之比计算。实轴右方实零极点总数为偶数的区段入轨。"],
        ["零度的渐近方向","交点仍用 σa，方向改为 2q·180°/(n−m)。含负常数的开环或特定非最小相位因子可导致等效的总符号变化。"],
        ["例 5-10 的正反馈","D=s(s+1)(s+2)，沿 0° 规则画 D−K=0。正实轴有一根，K>0 时系统存在右半平面极点。s=−1−1/√3 对应 K=2/(3√3)。"],
        ["例 5-11 的符号辨别","L=K(s−1)/D 时走 180° 规则，实轴段为 (−2,−1) 和 (0,1)，K>0 时有右半平面极点。L=K(1−s)/D 时提出负号，改用 0° 规则，实轴段为 (−∞,−2)、(−1,0)、(1,+∞)，稳定区间为 0<K<1.5。"],
        ["先做符号归一化","保留右半平面零点或极点的位置，以及标准化所引入的负号。用变形后的特征方程判断采用哪一套角度规则。"]
      ],
      lab:{...off,title:"比较四种符号与零点组合",controls:[C("mode","角度条件",["180°","0°","s−1","1−s"]),G(10,2)],draggable:"gain",
        draw(s){
          const spec=[
            {poly:poly5,zero:[],r:[60,180,300],c:-1},
            {poly:k=>[1,3,2,-k],zero:[],r:[0,120,240],c:-1},
            {poly:k=>[1,3,2+k,-k],zero:[[1,0]],r:[90,270],c:-2},
            {poly:k=>[1,3,2-k,k],zero:[[1,0]],r:[0,180],c:-2}
          ][s.mode],roots=solve(spec.poly(s.gain));
          return {art:axis({paths:locus("sign-"+s.mode,spec.poly,0,10),poles:p0,zeros:spec.zero,now:roots,guides:rays(spec.c,spec.r,10),center:-1.2,yMax:3.35}),
            readouts:readouts([["渐近角",spec.r.join("°，")+"°"],["当前闭环极点",complexRoots(roots)],["闭环判定",status(roots)]]),
            detail:detail("用特征式核对增益项",["s(s+1)(s+2)+K=0","s(s+1)(s+2)−K=0","s(s+1)(s+2)+K(s−1)=0","s(s+1)(s+2)+K(1−s)=0"][s.mode]),note:note("保持相同的 K，切换反馈符号或加入右半平面零点。")};}}
    },
    {
      title:"从根轨迹推回闭环增益和性能",
      source:span(47,53),
      points:[
        ["闭环零点要从闭环分子求","若 G=N_G/D_G，H=N_H/D_H，负反馈传递函数为 N_GD_H/(D_GD_H+N_GN_H)。先写闭环分子，再检查可能的零极点消去。"],
        ["把位置换成动态指标","共轭极点 s=σ±jωd 的 ωₙ=√(σ²+ωd²)、ζ=−σ/ωₙ。在典型二阶响应中，σ 控制指数包络，ωd 控制振荡频率。"],
        ["用指标射线找增益","给定 ζ 时，在 s 平面画与负实轴夹角 arccos ζ 的射线。与根轨迹的交点满足相角条件，再由幅值条件求 K。"],
        ["例 5-13 按 ζ=0.5 设计","沿离负实轴 60° 的射线与例 5-6 相交，取主导极点 −0.409±j0.709，按幅值条件得 K≈2.62。其余极点约 −1.41、−2.77，单位反馈闭环传递函数分子为 K。"],
        ["检查衰减速度与消去","同一结构中，实部越负，指数衰减越快。阻尼比、振荡频率与闭环分子共同影响瞬态。靠得很近的零极点可使某模态残差较小，内部稳定性仍取决于全部模态。"],
        ["韦达与静态增益","当 n−m≥2 时，增益项不改变特征多项式的次高项，闭环极点之和固定。稳定闭环的单位阶跃稳态值是 Φ(0)，可据此核对闭环增益。"]
      ],
      lab:{...off,title:"沿轨迹读出阻尼、频率和极点之和",controls:[G(9,2.62,.02,.02),R("zeta","目标阻尼比 ζ",.15,.95,.01,.5)],draggable:"gain",
        draw(s){
          const poly=poly6, poles=cubicCases[1].p, roots=solve(poly(s.gain)), z=roots.reduce((a,b)=>b[0]>a[0]+1e-8||Math.abs(a[0]-b[0])<=1e-8&&b[1]>a[1]?b:a,roots[0]);
          const theta=Math.acos(s.zeta)*180/Math.PI;
          return {art:axis({paths:locus("metric",poly,0,9),poles,now:roots,guides:rays(0,[180-theta,180+theta],8),center:-1.5,yMax:2.8}),
            readouts:readouts([["当前极点",roundZ(z)],V("阻尼比 ζ",damping(z)),V("自然角频率 ωₙ",mag(z)," rad/s")]),
            detail:detail("极点实部之和为 "+fmt(roots.reduce((sum,z)=>sum+z[0],0)),"虚线表示目标阻尼比。移动增益，使共轭极点落在射线上。"),note:note("需要同时核对阻尼、衰减速度与其他极点的位置。")};}}
    },
    {
      title:"区分开环零点位置与闭环输出",
      source:span(54,55),
      points:[
        ["相同开环乘积给出相同闭环极点","L=K₁(s+1.25)/[s(s+0.2)]，K₁=0.16K。特征多项式为 s²+(0.2+K₁)s+1.25K₁。"],
        ["零点放在前向通道","当 H=1，Φ₁(s)=K₁(s+1.25)/Dcl(s)。分子带闭环零点，阶跃初值处的斜率为 K₁，稳态值为 1。"],
        ["零点放在反馈通道","将 0.8s+1 放在反馈通道，前向 G=K/[s(5s+1)]。有 Φ₂(s)=1.25K₁/Dcl(s)，初始斜率为 0，单位阶跃稳态值同样为 1。"],
        ["对照两条阶跃曲线","K=5 时 K₁=0.8，公共极点为 −0.5±j0.866。反馈零点方案是标准二阶响应，峰值时间约 3.63 s，超调约 16.3%。前向零点使峰值提前，超调加大。"]
      ],
      lab:{timed:true,title:"等极点的两种闭环输出",chartTitle:"两种零点布置的阶跃响应",controls:[R("gain","归一化增益 K₁",.05,3,.05,.8)],draggable:"gain",
        draw(s){const k=s.gain,p=x=>[1,.2+x,1.25*x],poly=p(k),roots=solve(poly);
          const a=response(poly,[1.25*k,k]),b=response(poly,[1.25*k]);
          const peak=series=>100*(Math.max(...series.map(q=>q.y))-1);
          return {art:axis({paths:locus("placement",p,0,4),poles:[[0,0],[-.2,0]],zeros:[[-1.25,0]],now:roots,center:-.9,yMax:1.6}),
            chart:W.plot([{series:a,key:"y",label:"零点在前向通道",color:ink.teal},{series:b,key:"y",label:"零点在反馈通道",color:ink.violet}],s.time,{low:0,high:Math.max(1.25,...a.map(q=>q.y))*1.06}),
            readouts:readouts([["闭环极点",complexRoots(roots)],V("前向峰值高于稳态",Math.max(0,peak(a)),"%"),V("反馈峰值高于稳态",Math.max(0,peak(b)),"%")]),
            detail:detail("两条曲线共享特征方程","两组输出的稳态值都是 1。改变增益，比较起始斜率和 12 s 观察窗内的峰值。"),note:note("播放查看时域响应，拖动增益改变闭环极点。")};}}
    },
    {
      title:"用主导极点和零极点配置塑造响应",
      source:span(56,60),
      points:[
        ["主导极点与偶极子","在稳定系统且附近没有抵消零点时，距虚轴较近的极点往往主导长时响应。靠得很近的零极点可只产生较小残差，高频和初期响应仍须核对。"],
        ["例 5-15 的二阶近似","Φ(s)=2.7/(s³+5s²+4s+2.7) 的实极点约 −4.20，共轭对约 −0.40±j0.69。二阶近似 0.64/(s²+0.8s+0.64) 便于估算主要瞬态。"],
        ["例 5-16 的零点配置","L=K(s+b)/[s²(s+2)] 的闭环为 s³+2s²+Ks+Kb。对 K>0，劳斯表给出稳定区间 0<b<2。"],
        ["辨析三种配置","在同类负反馈结构中，位置合适的左半平面零点常使轨迹左偏，增加的开环极点可能压低稳定裕度。紧邻的零极点对 (s+zc)/(s+pc) 可近似保留远离偶极子区域的轨迹，同时让低频增益乘以 zc/pc。"],
        ["看清边界情形","b=2 时，分母成为 (s+2)(s²+K)，共轭极点落在虚轴。零极点相消简化了外部传递式，内部模态仍要核对。"],
        ["综合判断","相角确定位置，幅值给出增益。增益提高可导致失稳。常用主导阻尼比 0.5 至 0.707，对应从负实轴量起约 60° 至 45°。"]
      ],
      lab:{timed:true,title:"快极点的二阶近似与零点稳定边界",chartTitle:"阶跃响应及近似",controls:[C("mode","模型",["例 5-15  三阶近似","例 5-16  零点配置"]),R("b","零点到原点距离 b",.1,3,.025,1.3),G(8,3,.2,.1)],draggable:"b",
        draw(s){
          const first=s.mode===0, poly=k=>[1,2,k,k*s.b], c=first?[1,5,4,2.7]:poly(s.gain), roots=solve(c);
          const series=response(c,first?[2.7]:[s.gain*s.b,s.gain]), baseline=first?response([1,.8,.64],[.64]):null;
          const label=first?"完整三阶":"闭环输出", traces=[{series,key:"y",label,color:ink.teal}];
          if(baseline) traces.push({series:baseline,key:"y",label:"二阶近似",color:ink.violet,dash:true});
          return {art:axis({paths:first?[]:locus("dominant-"+s.b,poly,0,8),poles:first?[]:[[0,0],[-2,0]],zeros:first?[]:[[-s.b,0]],now:roots,center:-2.4,yMax:3.5}),
            chart:W.plot(traces,s.time,{low:Math.min(-.2,...series.map(r=>r.y))-.08,high:Math.max(1.2,...series.map(r=>r.y))+.15}),
            readouts:readouts([["主导极点",roundZ(roots.reduce((z,w)=>w[0]>z[0]?w:z,roots[0]))],["闭环判定",status(roots)],["参考",first?"二阶近似":"0<b<2"]]),
            detail:detail(first?"比较近似与完整模型":status(roots),first?"虚线是忽略快极点所得的二阶模型，观察起始段和峰值的差异。":"移动零点到 b=2 的两侧，观察极点实部与振荡包络。"),note:note("拖动零点距离时，根轨迹与响应同步重算。")};}}
    }
  ];
  window.CourseUnits ??= {};
  window.CourseUnits[5]={label:"第五章 根轨迹法",groups};
})();
