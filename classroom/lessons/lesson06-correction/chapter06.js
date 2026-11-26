(() => {
  "use strict";
  const W=IntroWidgets,M=IntroModels;
  const R=W.range,C=W.choices,rad=180/Math.PI;
  const indices=(first,last)=>Array.from({length:last-first+1},(_,i)=>first+i);
  const num=(n,d=2)=>n.toFixed(d);
  const db=n=>20*Math.log10(n);
  const a=w=>Math.atan(w)*rad;
  const first=w=>db(Math.hypot(1,w));
  const series=(...parts)=>w=>parts.reduce(([m,p],part)=>{const [g,q]=part(w);return [m+g,p+q];},[0,0]);
  const plant=(k,...taus)=>w=>taus.reduce(([m,p],t)=>[m-first(w*t),p-a(w*t)],[db(k/w),-90]);
  const rc=(z,p,k=1)=>w=>[db(k)+first(w*z)-first(w*p),a(w*z)-a(w*p)];
  const range=(values,min,max)=>Math.max(min,Math.min(max,values));
  const legend=items=>items.map(([color,label])=>'<span style="color:'+color+'">━ '+label+'</span>').join('　');
  const text=(heading,body)=>'<div class="text-block"><h3>'+heading+'</h3><p>'+body+'</p></div>';
  function dominantCross(model,index,target){
    let lo=.001;
    for(let i=1;i<=180;i++){
      const hi=.001*10**(i/30);
      if(model(lo)[index]>=target&&model(hi)[index]<=target){
        let l=lo,h=hi;
        for(let j=0;j<30;j++){
          const m=Math.sqrt(l*h);
          if(model(m)[index]>target)l=m;else h=m;
        }
        return Math.sqrt(l*h);
      }
      lo=hi;
    }
    return NaN;
  }
  function bode(models,probe) {
    const slots=[{y:37,h:103,k:0,unit:"dB"},{y:185,h:103,k:1,unit:"°"}];
    const x=w=>62+(Math.log10(w)+2.5)/5*558;
    const frequencies=Array.from({length:125},(_,i)=>10**(-2.5+5*i/124));
    const rows=models.map(([response,color])=>({values:frequencies.map(response),probe:response(probe),color}));
    let out='<svg class="bode-sheet" viewBox="0 0 650 334" role="img" aria-label="开环或校正装置的幅频与相频曲线"><rect width="650" height="334" rx="8" fill="#f4f8fe"/>';
    for(const {y,h,k,unit} of slots){
      const vals=rows.flatMap(row=>[...row.values.map(value=>value[k]),row.probe[k]]);
      const steps=k?[45,90,180]:[10,20,25,40,50,100,200];
      const minimum=Math.min(-steps[0],...vals),maximum=Math.max(steps[0],...vals);
      const step=steps.find(step=>Math.ceil(maximum/step)-Math.floor(minimum/step)<=5)??steps.at(-1);
      const low=Math.floor(minimum/step)*step,high=Math.ceil(maximum/step)*step;
      const yp=value=>y+h*(1-(value-low)/(high-low));
      out+='<text class="graph-label" x="64" y="'+(y-12)+'" fill="#345270" font-size="13">'+(k?"相角":"幅值")+' / '+unit+'</text>';
      for(let i=-2;i<=2;i++){
        const px=x(10**i);
        out+='<path d="M'+px+' '+y+'v'+h+'" stroke="#d7e4f0"/><text class="graph-tick" x="'+px+'" y="'+(y+h+16)+'" text-anchor="middle" fill="#496987" font-size="12">'+10**i+'</text>';
      }
      for(let value=low;value<=high;value+=step){
        const py=yp(value);
        out+='<path d="M62 '+py+'H620" stroke="#d7e4f0"/><text class="graph-tick" x="53" y="'+(py+4)+'" text-anchor="end" fill="#496987" font-size="12">'+value+'</text>';
      }
      out+='<path d="M62 '+yp(0)+'H620" stroke="#86a2bd" stroke-dasharray="4 4"/>';
      for(const {values,color} of rows){
        const points=values.map((value,i)=>x(frequencies[i]).toFixed(1)+','+yp(value[k]).toFixed(1)).join(' ');
        out+='<polyline points="'+points+'" fill="none" stroke="'+color+'" stroke-width="2.5"/>';
      }
      const active=rows.at(-1),px=x(probe),py=yp(active.probe[k]);
      out+='<path d="M'+px+' '+y+'v'+h+'" stroke="#376d87" stroke-dasharray="4 4"/><circle cx="'+px+'" cy="'+py+'" r="3.5" fill="#fff" stroke="'+active.color+'" stroke-width="2"/>';
    }
    return out+'<text class="graph-label" x="620" y="327" text-anchor="end" fill="#496987" font-size="12">ω / rad·s⁻¹（对数轴）</text></svg>';
  }
  const freq=R("probe","频率游标 lgω",-2.4,2.4,.02,0);
  function frequencyLab(title,controls,draw){
    return {title,timed:false,controls:[...controls,freq],draggable:"probe",draw(s){
      const result=draw(s),w=10**s.probe;
      const readings=result.curves.at(-1)[0](w);
      return {art:bode(result.curves,w),readouts:W.readouts([["ω",num(w)+" rad/s"],["幅值",num(readings[0],1)+" dB"],["相角",num(readings[1],1)+"°"],...(result.meters||[])]),
        detail:text(result.heading,legend(result.curves.map(([,color,name])=>[color,name]))+'<br>'+result.explain),note:W.note(result.note)};
    }};
  }
  const compare=(base,part)=>[[base,W.ink.blue,"固有部分"],[series(base,part),W.ink.teal,"接入校正"]];
  const margin=loop=>{
    const wc=dominantCross(loop,0,0),wp=dominantCross(loop,1,-180);
    return [["ωc",Number.isFinite(wc)?num(wc)+" rad/s":"区间无交越"],["相角裕度",Number.isFinite(wc)?num(180+loop(wc)[1],1)+"°":"—"],["增益裕度",Number.isFinite(wp)?num(-loop(wp)[0],1)+" dB":"区间无交越"]];
  };
  function topology(variant,gain,disturbance){
    const connector=(d,color="#587c98",width=2.5,arrow=true)=>
      '<path d="'+d+'" stroke="'+color+'" stroke-width="'+width+'" fill="none" '+(arrow?'marker-end="url(#correction-arrow)"':'')+'/>';
    const label=(x,y,value,color="#305878",size=16)=>
      '<text x="'+x+'" y="'+y+'" fill="'+color+'" text-anchor="middle" font-size="'+size+'">'+value+'</text>';
    const block=(x,y,w,value,color="#305878",fill="#dbeaf6")=>
      '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="38" rx="6" fill="'+fill+'" stroke="'+color+'"/>'+label(x+w/2,y+25,value,color);
    const junction=(x,y,sign,color="#587c98")=>
      '<circle cx="'+x+'" cy="'+y+'" r="13" fill="white" stroke="'+color+'" stroke-width="2"/>'+label(x,y+5,sign,color);
    const teal="#087967",orange="#bc5b2d";
    const signalWidth=1.6+Math.min(gain,1.3)*2;
    let art='<svg viewBox="0 0 650 250" role="img" aria-label="'+(variant==="local"?"局部反馈修正控制对象的内回路":"从输入或扰动引出的前馈支路")+'"><defs><marker id="correction-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0l7 3.5L0 7z" fill="context-stroke"/></marker></defs><rect width="650" height="250" rx="8" fill="#f1f7fc"/>';
    art+=label(43,100,"R(s)")+label(605,100,"C(s)")+
      connector("M29 120H90")+junction(105,120,"+")+connector("M118 120H165")+block(168,101,93,"G₁")+
      connector("M262 120H308")+junction(323,120,"+")+connector("M336 120H382")+block(385,101,93,"G₂")+
      connector("M479 120H620")+connector("M558 120V222H105V135")+label(326,241,"单位负反馈","#587c98",13)+label(121,151,"−");
    if(variant==="local"){
      art+=connector("M515 120V172H463",teal,signalWidth)+block(380,153,81,"Gᴄ",teal,"#e0f0eb")+
        connector("M380 172H323V135",teal,signalWidth)+label(340,151,"−",teal)+label(421,207,"局部反馈",teal,13);
    } else if(disturbance){
      art+=label(323,26,"N(s)",orange)+connector("M323 33V105",orange,2.4)+
        connector("M323 53H257",teal,signalWidth)+block(165,34,90,"Fₙ",teal,"#e0f0eb")+
        connector("M164 53H105V104",teal,signalWidth)+label(123,98,"−",teal);
    } else {
      art+=connector("M59 120V53H165",teal,signalWidth)+block(168,34,90,"Fᵣ",teal,"#e0f0eb")+
        connector("M259 53H323V104",teal,signalWidth);
    }
    return art+"</svg>";
  }
  function timeChart(title,controls,variant,draw){
    return {title,chartTitle:"输出轨迹对照",controls,draggable:controls[0].id,draw(s){
      const {rows,meters,heading,explain,note}=draw(s);
      const chart=W.plot(rows.map(([t,y,color,label])=>({series:t,key:y,color,label})),s.time,{low:-.15,high:1.65,unit:"相对值",event:2});
      return {art:topology(variant,variant==="local"?s.feedback/4:s.feed/100,s.kind===1),
        chart,readouts:W.readouts(meters),detail:text(heading,explain),note:W.note(note)};
    }};
  }
  const sample=f=>Array.from({length:M.steps+1},(_,i)=>({t:i*M.dt,y:f(i*M.dt)}));

  window.CourseUnits??={};
  window.CourseUnits[6]={label:"第六章 控制系统的校正",groups:[
    {title:"为什么要加校正装置",source:indices(1,6),points:[
      ["固有部分与辅助装置","用额外的装置改善固有对象在稳定裕度、响应速度或稳态精度上的表现。校正须从性能指标出发，选择可实现的结构并检验。"],
      ["三种接入位置","串联接在前向通道，局部反馈包围部分固有环节，复合控制另开按输入或按扰动补偿的前馈通路。接入位置决定分析方式。"],
      ["设计方法","可由频域指标整形，也可用根轨迹进行极点配置与校验。不同方法描述的是同一个闭环系统。"]
    ],lab:frequencyLab("串联、局部反馈与复合控制",[C("topology","接入位置",["串联","局部反馈","复合"]),R("gain","辅助通道增益",.2,4,.1,1.5)],s=>{
      const base=plant(4,1),aug=s.topology===0?plant(4*s.gain,1):s.topology===1?series(plant(4/(1+s.gain),1/(1+s.gain))):base;
      return {curves:[[base,W.ink.blue,"原开环"],[aug,W.ink.teal,"配置后的反馈开环"]],meters:margin(aug),heading:["串联改变前向增益","局部反馈改变被包围环节","纯外部前馈保留反馈特征式"][s.topology],explain:["将补偿器与对象相乘后检验新交越。","以一阶环节与静态负反馈为例，局部增益与时间常数一起下降。","结构上前馈位于反馈环外，所以这两条开环曲线重合。输出对给定和可测扰动的响应仍可改变。"][s.topology],note:"相角裕度按实际的 0 dB 交越计算。"};
    })},
    {title:"超前网络的零点、极点与峰值",source:indices(7,10),points:[
      ["无源 RC 分压","由 R₁∥C 和 R₂ 的分压得到 α(1+Ts)/(1+αTs)，α=R₂/(R₁+R₂)，T=R₁C。补偿无源衰减后使用归一化形。"],
      ["最大超前相角","ωm=1/(T√α)，φm=arcsin[(1−α)/(1+α)]。峰值位于两转折频率的几何中心。"],
      ["代价","归一化超前高频增益上升，需检查噪声放大、饱和与新交越处的裕度。"]
    ],lab:frequencyLab("拖动零、极点间距",[R("alpha","α",.07,.9,.01,.33),R("T","T",.1,3,.05,.5," s"),C("passive","实现",["归一化","无源 RC"])],s=>{
      const lead=rc(s.T,s.alpha*s.T,s.passive?s.alpha:1),wm=1/(s.T*Math.sqrt(s.alpha));
      return {curves:[[lead,W.ink.teal,"超前网络"]],meters:[["ωm",num(wm)],["φm",num(Math.asin((1-s.alpha)/(1+s.alpha))*rad,1)+"°"]],heading:"零点先到，极点后到",explain:"ωz="+num(1/s.T)+"，ωp="+num(1/(s.alpha*s.T))+" rad/s。改变 T 让相位峰平移，改变 α 同时改变峰高和间距。",note:"无源形低频增益为 α，高频增益趋于 1。"};
    })},
    {title:"滞后与滞后—超前网络",source:indices(11,14),points:[
      ["滞后 RC 阻抗","串入 R₁，输出跨 R₂ 与 C 的串联支路，得到 (1+Ts)/(1+βTs)，其中 T=R₂C、β=(R₁+R₂)/R₂。"],
      ["滞后的用途","极点先于零点产生负相角。归一化网络直流单位增益，高频衰减 20lgβ，可用来移动交越。"],
      ["组合网络","低频滞后支路负责分离低频与交越附近的增益，高频超前支路提供相位。两支路的 Bode 幅值和相角相加。"]
    ],lab:frequencyLab("观察两段网络的合成",[R("beta","滞后比 β",1.2,20,.2,6),R("T","滞后时间常数",.4,8,.2,2," s"),C("kind","网络",["滞后","滞后—超前"])],s=>{
      const lag=rc(s.T,s.beta*s.T),lead=rc(.15,.15/s.beta),total=series(lag,lead);
      return {curves:s.kind?[[lag,W.ink.blue,"滞后支路"],[lead,W.ink.orange,"超前支路"],[total,W.ink.teal,"总网络"]]:[[lag,W.ink.teal,"滞后网络"]],
        meters:[["低端转折",num(1/(s.beta*s.T))],["高端转折",num(1/s.T)]],heading:s.kind?"相乘对应两条 Bode 曲线相加":"负相位与高频衰减",
        explain:s.kind?"互为倒数的高频倍率让总网络高频回到 0 dB。":"拖大 β，极点左移，高频增益下降，直流增益保持 1。",note:"两段网络的工作频带可以分开，实际交越须重新求解。"};
    })},
    {title:"P、I、D 怎样组合",source:indices(15,20),points:[
      ["有源回路","反相运放的输入阻抗 Z₁ 与反馈阻抗 Z₂ 形成 −Z₂/Z₁。控制器符号需和框图的负反馈符号一同核对。"],
      ["基本规律","P 为比例，I 累积偏差并可提高开环型别，D 随输入变化率作用。PI、PD 与 PID 分别组合这些规律。"],
      ["工程实现","积分可改善稳态但会增加相位滞后。理想微分抬升高频增益，常以有滤波的微分实现。增益与时间尺度都要结合对象和裕度。"],
      ["控制规律","P=Kₚ，PI=Kₚ+Kᵢ/s，PD=Kₚ+Kᴅs，PID=Kₚ+Kᵢ/s+Kᴅs。PID 的积分引入原点极点，系数合适时零点可改善动态。"],
      ["自测","高频衰减是滞后校正压低交越频率的主要机制，也有助于限制高频噪声。常见单段超前角设计量级在 60°以内，最大角的理论上限为 90°。"]
    ],lab:frequencyLab("直接比较 P / I / D 的频响",[C("kind","控制规律",["P","PI","PD","PID"],3),R("p","比例 Kp",.5,6,.1,2),R("i","积分 Ki",.2,7,.1,2),R("d","微分 Kd",.2,5,.1,1)],s=>{
      const hasI=s.kind===1||s.kind===3,hasD=s.kind>=2;
      const ctl=w=>{const im=(hasD?s.d*w:0)-(hasI?s.i/w:0);return [db(Math.hypot(s.p,im)),Math.atan2(im,s.p)*rad];};
      return {curves:[[w=>[db(s.p),0],W.ink.blue,"比例基线"],[ctl,W.ink.teal,"当前控制器"]],heading:["比例","比例与积分","比例与微分","比例、积分与微分"][s.kind],explain:"低频处积分分量大，高频处理想微分分量大。比例项为实部。",note:"当前模型使用理想连续控制器，未串接对象。"};
    })},
    {title:"在频域把稳态、速度和裕度分开",source:indices(21,25),points:[
      ["低、中、高三频段","低频增益和型别联系稳态精度。交越附近的相位与交越频率影响稳定裕度和响应速度。高频衰减影响高频噪声通过量。"],
      ["为什么常希望 −20 dB/dec","交越周围更宽的单积分近似区通常带来更好的裕度。幅值斜率和相位由同一零极点分布共同决定，斜率本身并不唯一给出相位。"],
      ["时域转频域","稳定的单位负反馈Ⅰ型系统对单位斜坡 eₛₛ=1/Kv。阻尼近似不变时，提高交越频率通常加快动态。标准二阶近似下，10% 超调对应 ζ≈0.59，相角裕度约 59°。响应速度还要结合具体的调节时间要求选取 ωc。"]
    ],lab:frequencyLab("把交越锁定在 1 rad/s",[R("spread","间距参数 a",1.2,12,.2,3)],s=>{
      const loop=series(w=>[-db(s.spread)-40*Math.log10(w),-180],rc(s.spread,1/s.spread));
      const slope=-40+20*(s.spread**2/(1+s.spread**2)-1/(1+s.spread**2));
      return {curves:[[loop,W.ink.teal,"La(jω)"]],meters:[["γ",num(180+loop(1)[1],1)+"°"],["局部斜率",num(slope,1)+" dB/dec"]],heading:"固定截止频率，改变零极点间距",explain:"零点 "+num(1/s.spread)+" 与极点 "+num(s.spread)+" rad/s；幅值在 ω=1 恰为 0 dB。",note:"通过 ωc=1 对照相角裕度，绕开只看斜率的误判。"};
    })},
    {title:"例 6-1 的串联超前设计闭环",source:indices(26,32),points:[
      ["先定增益","按稳态要求得到 K=15，对 G₀=K/[s(s+1)] 计算未校交越和相角裕度，需求为 γ≥35°。"],
      ["用目标裕度反推","留余量估算所需峰值 φm，取 α=(1−sinφm)/(1+sinφm)，在未校曲线上找 L₀=10lgα，令该处为 ωm 并算 T。"],
      ["重算再比较","网络增益改动会推移交越，需按 GcG₀ 的实际频响检验，另外核对带宽、噪声与工程可实现性。"]
    ],lab:frequencyLab("选相角，再校验交越",[R("goal","目标相角裕度",25,75,1,35,"°"),R("reserve","预留相角",3,18,1,9,"°")],s=>{
      const base=plant(15,1),wc=dominantCross(base,0,0),phi=range(s.goal-(180+base(wc)[1])+s.reserve,6,68);
      const alpha=(1-Math.sin(phi/rad))/(1+Math.sin(phi/rad)),target=dominantCross(base,0,10*Math.log10(alpha));
      const T=1/(target*Math.sqrt(alpha)),comp=rc(T,alpha*T),loop=series(base,comp);
      return {curves:compare(base,comp),meters:margin(loop),heading:"按目标设计并回读校后指标",
        explain:"α="+num(alpha,3)+"，T="+num(T,3)+" s；未校相角裕度 "+num(180+base(wc)[1],1)+"°。校后与目标的差来自实际新交越。",note:"例题为单位反馈，直流归一化校正保持 Kv=15。"};
    })},
    {title:"例 6-3 的滞后校正与精确验证",source:indices(33,38),points:[
      ["选新交越","按稳态要求定 K，再从原相频曲线选较低交越，预留滞后网络额外的负相角。"],
      ["用幅值定 β","要求校正后的幅值在选定频率为 0 dB。转折频率通常放在交越以下，避免超出相角余量。"],
      ["例题核验","以 K=10、两惯性时间常数 1 和 0.5 s 的Ⅰ型对象为起点。归一化网络保持 Kv=10。默认 ωc=0.56、交越与零点频率比取 5 时，精确相角裕度约 34.5°，把频率比增至 6 后即可超过 35°。"],
      ["直流增益","若给归一化滞后网络再乘整体增益 2，速度误差系数 Kv 随之翻倍。应同时复核 Kv、两项裕度与实际交越。"]
    ],lab:frequencyLab("拉低交越以换取裕度",[R("target","设计交越",.25,.92,.01,.56," rad/s"),R("ratio","交越与零点频率比",3,12,.2,5)],s=>{
      const base=plant(10,1,.5),T=s.ratio/s.target,mag=10**(base(s.target)[0]/20);
      const beta=Math.sqrt(Math.max(1,(mag*mag*(1+s.ratio*s.ratio)-1)/(s.ratio*s.ratio)));
      const comp=rc(T,beta*T),loop=series(base,comp);
      return {curves:compare(base,comp),meters:margin(loop),heading:"归一化滞后网络",
        explain:"β="+num(beta,2)+"，T="+num(T,2)+" s，Kv 保持 10。取实际开环频响计算与检测设计验收值。",note:"例题的验收目标是相角裕度不小于 35°，增益裕度不小于 10 dB。"};
    })},
    {title:"例 6-5 与三参数滞后—超前",source:[...indices(39,43),53],points:[
      ["验收三个条件","例 6-5 检验 Kv≥180、相角裕度至少 40°、实际截止频率在 3 至 5 rad/s。先由稳态要求选择增益。"],
      ["两组零、极点与耦合比例","使用 (1+Tlag s)/(1+βTlag s) × (1+Tlead s)/(1+Tlead s/β)。Tlag 负责低频，Tlead 决定超前峰的位置，β 同时改变两段的频带和倍率。"],
      ["两个频域约束","将待选 ωc 处的开环幅值调为 1，并使相角为目标相角裕度减去 180°。三个参数通常需结合布局和硬件约束迭代，再由实际总开环核验。"],
      ["图解初值","由渐近图在设计频率 3.5 rad/s 得 Tlag≈1.43 s、Tlead=0.5 s、β≈51.3。先用该初值读出精确交越，再拖动 β 调整实际交越。"]
    ],lab:frequencyLab("同一页面联调三参数",[R("beta","β",4,65,.1,51.3),R("lag","Tlag",.6,3,.01,1.43," s"),R("lead","Tlead",.12,.8,.01,.5," s")],s=>{
      const base=plant(180,.5,1/6),comp=series(rc(s.lag,s.lag*s.beta),rc(s.lead,s.lead/s.beta)),loop=series(base,comp),wc=dominantCross(loop,0,0);
      return {curves:compare(base,comp),meters:margin(loop),heading:"保留低频增益，同时整形中频",
        explain:"Kv=180。以真实交越 "+num(wc)+" rad/s 验证带宽和相角裕度。改变任一参数后，都要重读两个指标。",note:"目标区间 3–5 rad/s，相角裕度至少 40°。"};
    })},
    {title:"局部反馈如何削弱参数波动",source:indices(44,45),points:[
      ["内回路等效","G₂c=G₂/(1+G₂Gc)，再与 G₁ 串联。当内部环路复增益的模很大，G₂c≈1/Gc；模很小时近似 G₂。"],
      ["影响范围","局部反馈可减弱被包围环节参数变化和非线性影响。内部与整个系统都要检查稳定性，尤其在环路相位接近 −180° 时。"]
    ],lab:timeChart("固定反馈增益，改变被包围对象",[R("feedback","局部反馈增益",0,7,.1,1.5),R("plant","对象增益变化",.5,1.5,.05,1.2)],"local",s=>{
      const response=g=>sample(t=>g/(1+g*s.feedback)*(1-Math.exp(-(1+g*s.feedback)*t/2)));
      return {rows:[[response(1),"y",W.ink.blue,"名义对象"],[response(s.plant),"y",W.ink.teal,"参数变化"]],
        meters:[["名义静态增益",num(1/(1+s.feedback),3)],["变化后",num(s.plant/(1+s.feedback*s.plant),3)]],
        heading:"内回路的灵敏度变化",explain:"被包围对象取一阶模型。增大局部回路增益，比较两条响应的静态值偏差。",note:"局部反馈的实际效果取决于频段内的复增益及内部稳定性。"};
    })},
    {title:"按输入或扰动补偿的复合校正",source:indices(46,52),points:[
      ["输入前馈","教材结构中 C/R=(Fr+G₁)G₂/(1+G₁G₂)。令 Fr=1/G₂ 可理想跟踪，但逆模型可能不适定或物理不可实现。例 6-8 以部分微分前馈抵消斜坡误差的低频项。"],
      ["扰动前馈","扰动在 G₁ 与 G₂ 之间注入时，C/N=G₂(1−G₁Fn)/(1+G₁G₂)。扰动可测且方案可实现时，Fn=1/G₁ 可实现理想全补偿。"],
      ["特征式与响应","外加前馈不进入反馈特征方程，反馈闭环的极点不随此前馈增益变动。特定给定或扰动通道的瞬态输出仍会改变。"],
      ["自测","完美输入跟踪或扰动消除都使用不变性原理。扰动前馈要求取得扰动的测量值或可用估计。"],
      ["例 6-8 核验","G₂=K₂(T₄s+1)/[s(T₃s+1)]，部分补偿取 Fr=s/[K₂(T₄s+1)]。此时 E/R 在原点有二阶零点，闭环稳定时斜坡 At 的稳态误差为零，抛物线 At²/2 的稳态误差为 T₃A/(K₁K₂)。"],
      ["误差阶次","给定通道的低频误差阶次由一阶提高至二阶。实际反馈环路 G₁G₂ 的原点极点数保持为一。"]
    ],lab:timeChart("改变前馈补偿量",[R("feed","前馈补偿比例",0,130,1,75," %"),C("kind","测试工况",["输入补偿","扰动补偿"],1)],"compound",s=>{
      const gain=s.feed/100,blend=t=>1-Math.exp(-Math.max(0,t-2)/.9);
      const base=sample(t=>s.kind ? .58*blend(t) : .63*blend(t));
      const feed=sample(t=>s.kind ? .58*(1-gain)*blend(t) : (.63+.37*gain)*blend(t));
      return {rows:[[base,"y",W.ink.orange,"纯反馈"],[feed,"y",W.ink.teal,"加前馈"]],
        meters:[[s.kind?"施加扰动后残差":"跟踪误差",num(s.kind ? .58*(1-gain) : 1-.63-.37*gain,2)]],
        heading:s.kind?"按可测扰动补偿":"按给定输入补偿",explain:"用同一支稳定的一阶动态响应比较前馈比例，时间常数保持不变。",note:"该模型演示前馈改变输出通道而不移动反馈极点。"};
    })}
  ]};
})();
