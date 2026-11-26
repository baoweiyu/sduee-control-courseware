"use strict";
const IntroWidgets = (() => {
  const {clamp,duration} = IntroModels;
  const ink = {blue:"#3276b8", teal:"#087967", orange:"#d45f25", target:"#60748d", violet:"#875f95"};
  const escape = text => String(text).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const range = (id,label,min,max,step,value,unit="") => ({id,label,min,max,step,value,unit});
  const choices = (id,label,options,value=0) => ({id,label,options,value,min:0,max:options.length-1,step:1});
  const stages=(id,label,options,first=0,value=first)=>({
    ...choices(id,label,options,value),min:first,max:first+options.length-1,sequential:true
  });
  const note = text => "<p class='note'>"+escape(text)+"</p>";
  const marks={level:"M3 13c3-7 7-7 10-2s7 5 9-1",inlet:"M4 20 20 4M11 4h9v9",outlet:"M3 12h18m-7-7 7 7-7 7"};
  const readouts = entries => "<dl class='meter'>"+entries.map(([k,v,mark])=>{
    const icon=marks[mark]?'<svg class="meter-symbol" viewBox="0 0 24 24" aria-hidden="true"><path d="'+marks[mark]+'"/></svg>':"";
    return "<div><dt>"+escape(k)+"</dt><dd>"+icon+escape(v)+"</dd></div>";
  }).join("")+"</dl>";
  function settings(controls, showChoiceLabels=false) {
    return controls.map(control => {
      if(control.sequential && control.options.length>4){
        const key=escape(control.id);
        return '<div class="step-pager" role="group" aria-label="'+escape(control.label)+'"><button type="button" data-change="-1" data-pick="'+key+'">上一步</button><output data-stage="'+key+'" aria-live="polite"></output><button type="button" data-change="1" data-pick="'+key+'">下一步</button></div>';
      }
      if (control.options) {
        const buttons = '<div class="toggle-row" role="group" aria-label="'+escape(control.label)+'">'+control.options.map((choice,index)=>
          '<button type="button" data-pick="'+control.id+'" data-value="'+(index+control.min)+'">'+escape(choice)+'</button>').join("")+'</div>';
        return showChoiceLabels ? '<div class="choice-field"><span aria-hidden="true">'+escape(control.label)+'</span>'+buttons+'</div>' : buttons;
      }
      return '<label class="range-row" data-row="'+control.id+'"><span>'+escape(control.label)+'</span><input type="range" data-key="'+control.id+'" min="'+control.min+'" max="'+control.max+'" step="'+control.step+'"><output data-value-for="'+control.id+'"></output></label>';
    }).join("");
  }
  function plot(traces,time,{low=0,high=100,minSpan,maxYTicks=4,unit="",event,compact=false,rightAxis,annotations=[]}={}) {
    if(minSpan){
      let bottom=Infinity,top=-Infinity;
      for(const {series,key} of traces)for(const row of series){
        bottom=Math.min(bottom,row[key]);top=Math.max(top,row[key]);
      }
      const span=Math.max(minSpan,(top-bottom)*1.25);
      const quantum=10**Math.floor(Math.log10(span/4));
      low=Math.floor(((top+bottom-span)/2)/quantum)*quantum;
      high=Math.ceil(((top+bottom+span)/2)/quantum)*quantum;
    }
    return ({width,height})=>{
      const short=height<(compact?114:107);
      const W=Math.max(235,width),H=Math.max(short?46:85,height);
      const x0=W<350?36:47,x1=W-(rightAxis?42:17),y0=short?10:21,y1=H-(short?17:31);
      const yTicks=Math.max(1,Math.min(maxYTicks,Math.floor((y1-y0)/18))),xTicks=short?2:4;
      const tx=t=>x0+(x1-x0)*t/duration;
      const ty=y=>y1-(y1-y0)*(y-low)/(high-low);
      const point=(x,y)=>x.toFixed(2)+" "+y.toFixed(2);
      const rect=(x,y,width,height)=>'x="'+x+'" y="'+y+'" width="'+width+'" height="'+height+'"';
      const text=(x,y,value,anchor="start")=>'<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'">'+escape(value)+'</text>';
      let grid="",paper="";
      for(let i=0;i<=yTicks;i++){
        const ratio=i/yTicks,y=y1-(y1-y0)*ratio;
        grid+='<path d="M'+point(x0,y)+'H'+x1+'"/>'+text(x0-7,y+4,Number((low+(high-low)*ratio).toFixed(1)),"end");
        if(rightAxis){
          const {low:flowLow,high:flowHigh}=rightAxis;
          grid+=text(x1+6,y+4,Number((flowLow+(flowHigh-flowLow)*ratio).toFixed(2)));
        }
      }
      for(let i=0;i<=xTicks;i++){
        const t=duration*i/xTicks,x=tx(t);
        grid+='<path d="M'+point(x,y0)+'V'+y1+'"/>'+text(x,y1+(short?11:14),t,"middle");
      }
      const xDiv=Math.max(2,Math.ceil((x1-x0)/(xTicks*22)));
      const yDiv=Math.max(1,Math.ceil((y1-y0)/(yTicks*21)));
      for(let i=1;i<xTicks*xDiv;i++){
        if(i%xDiv)paper+='M'+point(x0+(x1-x0)*i/(xTicks*xDiv),y0)+'V'+y1;
      }
      for(let i=1;i<yTicks*yDiv;i++){
        if(i%yDiv)paper+='M'+point(x0,y0+(y1-y0)*i/(yTicks*yDiv))+'H'+x1;
      }
      const curves=traces.map(({series,key,color,dash})=>'<path d="'+series.map((row,i)=>(i?"L":"M")+point(tx(row.t),ty(row[key]))).join("")+
        '" fill="none" stroke="'+color+'" stroke-width="'+(dash?1.55:2.8)+'" stroke-linecap="round" stroke-linejoin="round"'+(dash?' stroke-dasharray="6 5"':'')+'/>').join("");
      const dots=traces.filter(trace=>!trace.dash).map(({series,key,color})=>'<circle cx="'+tx(time)+'" cy="'+ty(IntroModels.at(series,time)[key])+
        '" r="'+(short?3.2:4.7)+'" fill="white" stroke="'+color+'" stroke-width="2.25"/>').join("");
      const eventMark=event===undefined?"":'<path d="M'+point(tx(event),y0)+'V'+y1+'" stroke="#a46e48" opacity=".72" stroke-dasharray="4 5"/>';
      const legend='<div class="legend">'+traces.map(trace=>'<span><i'+(trace.dash?' class="dashed"':'')+' style="--trace:'+trace.color+'"></i>'+escape(trace.label)+'</span>').join("")+'</div>';

      const tags=W>=335&&y1-y0>=100?annotations.map(({series,key,t,label,color,offset=[40,-30]})=>{
        const px=tx(t),py=ty(IntroModels.at(series,t)[key]);
        if(px<x0||px>x1||py<y0||py>y1)return "";
        const size=Math.min(21,Math.max(11,W*.018)),tagW=Array.from(label).length*size+size*1.25,tagH=size*1.65;
        const left=clamp(px+offset[0]-tagW/2,x0+4,x1-4-tagW);
        const top=clamp(py+offset[1]-tagH/2,y0+4,y1-4-tagH);
        const edgeX=clamp(px,left,left+tagW),edgeY=clamp(py,top,top+tagH);
        return '<g class="curve-tag" color="'+color+'"><path d="M'+point(px,py)+'L'+point(edgeX,edgeY)+'"/>'+
          '<rect '+rect(left,top,tagW,tagH)+' rx="8"/><text x="'+(left+tagW/2)+'" y="'+(top+tagH/2)+'" font-size="'+size+
          '" dominant-baseline="central" text-anchor="middle">'+escape(label)+'</text></g>';
      }).join(""):"";
      const axisRight=rightAxis?'<path class="axis" d="M'+point(x1,y0)+'V'+y1+'"/>':"";
      const labels='<g class="response-labels">'+text(short?x0+10:x0,short?12:13,unit)+
        (rightAxis?text(short?x1-5:W-3,short?12:13,rightAxis.unit,"end"):"")+
        text(short?x1-20:x1,H-2,"时间 / s","end")+'</g>';
      return '<svg class="response-plot'+(short?' compact-plot':'')+'" viewBox="0 0 '+W+' '+H+'" data-x0="'+x0+'" data-x1="'+x1+
        '" aria-label="随参数变化的响应曲线" role="img"><defs><clipPath id="trace-clip"><rect '+rect(x0,y0,x1-x0,y1-y0)+'/></clipPath></defs>'+
        '<rect class="plot-paper" '+rect(x0,y0,x1-x0,y1-y0)+'/><path class="plot-paper-minor" d="'+paper+'"/><g class="plot-grid">'+grid+'</g>'+
        '<path class="axis" d="M'+point(x0,y0)+'V'+y1+'H'+x1+'"/>'+axisRight+
        '<path class="plot-arrow" d="M'+point(x0,y0-5)+'l-4 7h8z M'+point(x1+5,y1)+'l-7 -4v8z"/>'+
        '<g clip-path="url(#trace-clip)">'+eventMark+curves+'<path class="plot-cursor" d="M'+point(tx(time),y0)+'V'+y1+'"/>'+dots+'</g>'+
        '<circle class="plot-handle" cx="'+tx(time)+'" cy="'+y1+'" r="'+(short?3.4:5.5)+'"/>'+tags+labels+'</svg>'+legend;
    };
  }
  function pointerRange(surface, startValue, update, {absolute=false,vertical=false,span=1,spanStart=.09,spanEnd=.966}={}) {
    let pointer=null, origin=0, initial=0;
    function move(event) {
      if(event.pointerId!==pointer)return;
      const bounds=surface.getBoundingClientRect();
      let value;
      if (absolute) {
        const svg=surface.querySelector("svg");
        const frame=svg?.getScreenCTM();
        if(frame){
          const point=new DOMPoint(event.clientX,event.clientY).matrixTransform(frame.inverse());
          const vb=svg.viewBox.baseVal;
          const ratio=(vertical ? 1-(point.y-vb.y)/vb.height : (point.x-vb.x)/vb.width);
          const xStart=svg.dataset.x0 ? Number(svg.dataset.x0)/vb.width : spanStart;
          const xEnd=svg.dataset.x1 ? Number(svg.dataset.x1)/vb.width : spanEnd;
          value=clamp((ratio-xStart)/(xEnd-xStart))*span;
        } else value=clamp((event.clientX-bounds.left)/bounds.width)*span;
      } else value=initial+(vertical?origin-event.clientY:event.clientX-origin)*span/Math.max(120, (vertical?bounds.height:bounds.width)*.61);
      update(value);
    }
    surface.addEventListener("pointerdown",event=>{
      if(event.button!==0 || pointer!==null)return;
      pointer=event.pointerId; origin=vertical ? event.clientY : event.clientX; initial=startValue();
      surface.setPointerCapture(pointer);
      if(absolute)move(event);
    });
    surface.addEventListener("pointermove",move);
    const stop=event=>{if(pointer===event.pointerId)pointer=null;};
    surface.addEventListener("pointerup",stop);
    surface.addEventListener("pointercancel",stop);
    surface.addEventListener("lostpointercapture",stop);
  }

  function lab(host, specification, state) {
    const {controls,title,chartTitle="响应曲线",draw,draggable,backdrop,visual="rig",timed=true} = specification;
    const timeControl = range("time","时间游标",0,duration,.04,5," s");
    const all = timed ? [...controls,timeControl] : controls;
    const presets=Object.fromEntries(all.map(item=>[item.id,item.value]));
    for (const [key,value] of Object.entries(presets)) if (!(key in state)) state[key]=value;
    host.className="lesson lesson-lab "+visual+(timed?"":" diagram-only");
    host.innerHTML='<section class="rig-panel"><h2>'+escape(title)+'</h2><div class="model-art" data-art></div><div class="settings">'+settings(controls,visual==="classify")+'</div></section>'+
      '<section class="analysis-panel"><div class="readouts" data-readouts></div>'+
      (timed?'<div class="chart-panel"><h2>'+escape(chartTitle)+'</h2><div class="chart" data-chart></div><div class="time-controls">'+settings([timeControl])+'<button type="button" data-play aria-label="播放时间">播放</button></div></div>':'')+
      '<div class="explanation" data-detail></div></section><div class="lab-footer"><div data-note></div><button type="button" data-reset>重置</button></div>';
    const find=selector=>host.querySelector(selector);
    const read=find("[data-readouts]"), detail=find("[data-detail]"), art=find("[data-art]"), chart=find("[data-chart]"), foot=find("[data-note]"), playback=find("[data-play]");
    if(backdrop){
      art.classList.add("photo-backdrop");
      art.style.setProperty("--rig-photo",'url("'+new URL(backdrop,document.baseURI).href+'")');
    }
    if(specification.topControls){
      const group=find(".toggle-row");
      if(group){group.classList.add("lab-tabs");host.prepend(group);}
      find(".rig-panel").append(read,detail);
    }
    if(visual==="water"||visual==="mason")find(".analysis-panel").prepend(find(".settings"));
    if(visual==="classify"){
      const heading=document.createElement("h2");
      heading.textContent="四个分类维度";
      find(".analysis-panel").prepend(heading,find(".settings"));
      find(".rig-panel").append(read);
    }
    if(visual==="thermal")find(".analysis-panel").prepend(detail);
    if(visual==="thermal"||visual==="motor")find(".chart-panel h2").after(read);
    if(visual==="setpoint"){
      host.prepend(find(".analysis-panel"));
      find(".rig-panel").append(read);
    }
    const controlsById=new Map(all.map(item=>[item.id,item]));
    let renderFrame=0, playFrame=0, last=0, playing=false;
    let lastArt,lastChart,lastDetail,lastRead,lastFoot;
    function render() {
      renderFrame=0;
      for(const ctrl of all){
        const val=state[ctrl.id];
        if(ctrl.options){
          for(const button of host.querySelectorAll('[data-pick="'+ctrl.id+'"]')){
            if(button.dataset.change){
              const next=val+Number(button.dataset.change);
              button.dataset.value=String(next);
              button.disabled=next<ctrl.min||next>ctrl.max;
            }else button.setAttribute("aria-pressed",String(Number(button.dataset.value)===val));
          }
          const indicator=find('[data-stage="'+ctrl.id+'"]');
          if(indicator)indicator.textContent=(val-ctrl.min+1)+" / "+ctrl.options.length+"　"+ctrl.options[val-ctrl.min];
        } else {
          const input=find('[data-key="'+ctrl.id+'"]');
          input.value=val;
          input.style.setProperty("--range-progress",clamp((val-ctrl.min)/(ctrl.max-ctrl.min||1))*100+"%");
          find('[data-value-for="'+ctrl.id+'"]').textContent=Number(val.toFixed(2))+ctrl.unit;
        }
      }
      const content=draw(state);
      if(content.activeRows)for(const row of host.querySelectorAll(".settings [data-row]"))row.hidden=!content.activeRows.includes(row.dataset.row);
      if(content.art!==lastArt){art.innerHTML=lastArt=content.art||"";}
      if(chart){
        const sideLegend=visual==="motor"&&chart.clientWidth>=395&&chart.clientHeight>=122;
        chart.classList.toggle("side-legend",sideLegend);
        const box={width:chart.clientWidth-(sideLegend?118:0),height:chart.clientHeight-(sideLegend?0:18)};
        const markup=typeof content.chart==="function"?content.chart(box):content.chart||"";
        if(markup!==lastChart)chart.innerHTML=lastChart=markup;
      }
      if(content.detail!==lastDetail){detail.innerHTML=lastDetail=content.detail||"";}
      if(content.readouts!==lastRead){read.innerHTML=lastRead=content.readouts||"";}
      if(content.note!==lastFoot){foot.innerHTML=lastFoot=content.note||"";}
      host.dataset.state=JSON.stringify(state);
      if (specification.hideArt) art.hidden=true;
      detail.hidden=!content.detail;
      read.hidden=!content.readouts;
    }
    function schedule(){if(!renderFrame)renderFrame=requestAnimationFrame(render);}
    function set(id,value){
      const {min,max,step}=controlsById.get(id);
      state[id]=Number(clamp(Math.round((value-min)/step)*step+min,min,max).toFixed(5));
      schedule();
    }
    host.addEventListener("input",event=>{
      if(event.target.dataset.key){
        if (event.target.dataset.key==="time")stopPlayback();
        set(event.target.dataset.key,Number(event.target.value));
      }
    });
    host.addEventListener("click",event=>{
      const button=event.target.closest("button[data-pick]");
      if(button)set(button.dataset.pick,Number(button.dataset.value));
    });
    if (draggable) {
      const drag=typeof draggable==="string"?{id:draggable}:draggable;
      const ctrl=controlsById.get(drag.id);
      art.classList.add("draggable");
      const input=find('[data-key="'+drag.id+'"]');
      if(input){
        art.setAttribute("title","拖动模型 · "+ctrl.label);
        art.setAttribute("data-drag-label",ctrl.label);
        pointerRange(art,()=>state[drag.id],value=>set(drag.id,value),{span:ctrl.max-ctrl.min,vertical:drag.vertical});
      }
    }
    if(chart){
      chart.classList.add("draggable");
      chart.setAttribute("title","拖动曲线游标");
      pointerRange(chart,()=>state.time,value=>{stopPlayback();set("time",value);},{absolute:true,span:duration});
    }
    const plotResize=chart?new ResizeObserver(schedule):null;
    plotResize?.observe(chart);
    function stopPlayback(){
      playing=false;cancelAnimationFrame(playFrame);
      if(playback){playback.textContent="播放";playback.setAttribute("aria-label","播放时间");}
    }
    function tick(now) {
      if(!playing)return;
      if(last){state.time=clamp(state.time+Math.min((now-last)/1000,.05)*2,0,duration);schedule();}
      last=now;
      if(state.time>=duration || document.hidden)stopPlayback();
      else playFrame=requestAnimationFrame(tick);
    }
    if(playback)playback.onclick=()=>{
      if(playing){stopPlayback();return;}
      if(state.time>=duration)state.time=0;
      playing=true;last=0;playback.textContent="暂停";playback.setAttribute("aria-label","暂停时间");
      playFrame=requestAnimationFrame(tick);
    };
    find("[data-reset]").onclick=()=>{stopPlayback();Object.assign(state,presets);schedule();};
    render();
    return ()=>{stopPlayback();cancelAnimationFrame(renderFrame);plotResize?.disconnect();};
  }
  function stepList(labels,active=-1,values=[]){
    return '<ol class="lesson-steps">'+labels.map((label,i)=>
      '<li'+(i===active?' aria-current="step"':'')+'><span>'+escape(label)+'</span>'+
      (values[i]?'<strong>'+values[i]+'</strong>':'')+'</li>').join('')+'</ol>';
  }
  function equationSteps(labels,equations,conclusion){
    const lines=equations.map((eq,i)=>'<div class="derive-line"><strong>'+escape(labels[i])+'</strong><div>'+
      window.katex.renderToString(String.raw`\displaystyle `+eq,{throwOnError:true})+'</div></div>').join('');
    return '<div class="derive-sheet"><aside>'+stepList(labels)+'</aside><section class="derive-equations">'+lines+'<p>'+escape(conclusion)+'</p></section></div>';
  }
  return {ink,escape,range,choices,stages,note,readouts,plot,lab,pointerRange,stepList,equationSteps};
})();
