"use strict";
(() => {
  const get=id=>document.getElementById(id);
  const chapterNumber=Number(document.body.dataset.chapter);
  const pageNumber=Number(document.body.dataset.page);
  const stage=get("source-stage"),formulaDialog=get("formula-dialog");
  let sequence=null;
  const adminPages=new Map([[1,1],[2,2],[3,3],[4,4],[5,5],[6,6],[10,7]]);
  const pageState=(parent!==window && document.referrer && new URL(document.referrer).origin===location.origin && parent.coursewarePageState) || new Map();
  // Fixed teaching examples for chapter introductions and section openings.
  const overviewFigures={
    "3/50":[27,"chart","等幅振荡的阶跃响应，可用于讨论渐近稳定性。"],
    "4/1":[15,"art","同一个惯性环节在频域中的两种表示。"],
    "4/3":[18,"art","实频率变化时，一阶惯性环节在复平面上扫出半圆。"],
    "4/4":["classical-controls-bench.webp","photo","早期反馈放大实验台。AI 示意图。"],
    "4/31":[36,"art","一阶惯性环节的对数幅频曲线与相频曲线。"],
    "4/59":[71,"art","从完整的频率轨迹判断它相对临界点 −1 的绕行。"],
    "4/82":[85,"art","开环轨迹与等 M 线。"],
    "5/1":[5,"art","增益改变时，闭环极点沿根轨迹移动。"],
    "5/3":[5,"art","两条分支在实轴上会合，再离开实轴。"],
    "5/34":[39,"art","改变结构参数，观察闭环极点轨迹。"],
    "5/47":[8,"chart","闭环极点的位置影响阶跃响应。"],
    "6/1":[30,"art","从频率响应比较校正前后的系统。"],
    "6/3":[4,"art","校正装置在控制回路中的连接位置。"],
    "6/6":[8,"art","校正网络在不同频率处有不同的幅值和相位。"],
    "6/21":[22,"art","校正设计从开环频率响应入手。"],
    "7/1":[5,"art","连续信号在采样时刻的取值构成离散序列。"],
    "7/3":[7,"art","按相等时间间隔读取连续信号。"],
    "7/13":[14,"art","保持器根据离散样本生成连续时间输出。"],
    "7/33":[36,"art","差分方程递推得到的离散响应。"],
    "7/46":[49,"art","从 z 平面上的极点位置判断响应趋势。"],
    "8/1":[9,"art","通过输入输出特性认识非线性环节。"],
    "8/15":[17,"chart","比较非线性输出及其基波分量。"]
  };
  function overviewFigure(config,bank){
    const [source,kind,caption]=config;
    const figure=create("figure","reading-figure");
    const visual=create("div","reading-visual");
    if(kind==="photo"){
      const image=create("img");
      image.src="../../../assets/classroom/"+source;
      image.alt=caption;visual.append(image);
    }else{
      const model=bank[source].lab;
      const state=Object.fromEntries(model.controls.map(control=>[control.id,control.value]));
      const frame=model.draw({...state,time:5});
      const graphic=frame[kind];
      visual.innerHTML=typeof graphic==="function"?graphic({width:540,height:275}):graphic||"";
      if(!visual.childElementCount)return null;
    }
    figure.append(visual,create("figcaption","",caption));
    return figure;
  }
  const pageTitle=title=>title.replace(/^[★\s]+/,"").replace(/^(?:旗舰)?交互[:：]\s*/,"");
  let dispose=()=>{},emphasis="";

  function highlight(element,term){
    if(!term)return;
    const at=element.textContent.indexOf(term);
    if(at<0)return;
    const copy=element.textContent;
    element.replaceChildren(copy.slice(0,at),create("mark","key-term",term),copy.slice(at+term.length));
  }

  function create(tag,className,text){
    const element=document.createElement(tag);
    if(className)element.className=className;
    if(text)element.textContent=text;
    return element;
  }
  function action(label,fn){
    const button=create("button","",label);
    button.type="button";
    button.addEventListener("click",fn);
    return button;
  }
  function content([title,description]){
    const article=create("section","reading-section");
    article.append(create("h3","",title));
    if(Array.isArray(description)){
      const list=create("ul");
      for(const item of description)list.append(create("li","",item));
      article.append(list);
    }else if(description?.math){
      const formulas=create("div","formula-list");
      for(const formula of description.math){
        const line=create("div");
        if(window.katex)window.katex.render(formula,line,{displayMode:true,throwOnError:false});
        else line.textContent=formula;
        formulas.append(line);
      }
      article.append(formulas);
    }else{
      const paragraph=create("p","",description);
      highlight(paragraph,emphasis);
      article.append(paragraph);
    }
    return article;
  }
  function renderQuiz(host, quiz) {
    host.className="teacher-quiz";
    const questions=quiz.items || [quiz];
    const tabs=create("nav","reading-tabs");
    tabs.setAttribute("aria-label","切换小题");
    const paper=create("section","projection-paper");
    const text=create("div","projection-text");
    const toggle=action("显示答案",()=>showAnswer(!shown));
    let shown=false, currentQuiz, answer, picture, choices;
    function showAnswer(open) {
      shown=open;
      answer.hidden=!open;
      choices.forEach((row,i)=>row.classList.toggle("supported",open && currentQuiz.answers.includes(i)));
      if(picture && currentQuiz.answerArt)picture.innerHTML=open?currentQuiz.answerArt:currentQuiz.art;
      toggle.textContent=open?"收起答案":"显示答案";
      toggle.setAttribute("aria-expanded",String(open));
      requestAnimationFrame(()=>{if(open && answer.isConnected)text.scrollTop=Math.min(answer.offsetTop-text.offsetTop,text.scrollHeight-text.clientHeight);else text.scrollTop=0;});
    }
    function choose(index) {
      currentQuiz=questions[index];
      const q=currentQuiz;
      text.replaceChildren(create("h2","",q.prompt));
      picture=null;
      if(q.art){
        picture=create("div","projection-figure");
        picture.innerHTML=q.art;
        text.append(picture);
      }
      choices=[];
      if(q.options){
        const list=create("ol","projection-choices");
        choices=q.options.map((option,i)=>{
          const row=create("li");
          row.append(create("b","",String.fromCharCode(65+i)),create("span","",option));
          return row;
        });
        list.append(...choices);
        text.append(list);
      }
      answer=create("section","projected-answer");
      answer.id="projected-answer";
      const value=q.options?q.answers.map(i=>String.fromCharCode(65+i)).join("、"):q.accepted[0];
      answer.append(create("strong","","参考答案　"+value),create("p","",q.feedback));
      text.append(answer);
      [...tabs.children].forEach((button,i)=>button.setAttribute("aria-pressed",String(i===index)));
      showAnswer(false);
    }
    if(questions.length>1){
      questions.forEach((_,i)=>tabs.append(action("第 "+(i+1)+" 题",()=>choose(i))));
      host.append(tabs);
    }
    toggle.className="reveal-answer";
    toggle.setAttribute("aria-controls","projected-answer");
    paper.append(text,toggle);
    host.append(paper);
    choose(0);
  }

  function renderGallery(host,{figures,steps,timeline}){
    host.classList.add("gallery-layout",timeline?"gallery-history":"gallery-cases");
    for(const {src,alt,title,description} of figures){
      const figure=create("figure","gallery-card");
      const art=create("img","gallery-art");
      art.width=1200;
      art.height=800;
      art.src="../../../assets/classroom/"+src;
      art.alt=alt;
      const caption=create("figcaption","gallery-caption");
      const heading=create("div","gallery-title");
      heading.append(create("h2","",title),create("small","gallery-credit","AI 示意图"));
      caption.append(heading,create("p","",description));
      figure.append(art,caption);
      host.append(figure);
    }
    if(steps){
      const list=create("ol","gallery-steps");
      list.setAttribute("aria-label","着陆阶段");
      for(const [name,meaning] of steps){
        const row=create("li");
        row.append(create("strong","",name),create("span","",meaning));
        list.append(row);
      }
      host.append(list);
    }
    if(timeline){
      const list=create("ol","gallery-timeline");
      list.setAttribute("aria-label","发展时间线");
      for(const [date,title,meaning] of timeline){
        const row=create("li");
        const event=create("div","gallery-event");
        event.append(create("strong","",title),create("span","",meaning));
        row.append(create("span","gallery-date",date),event);
        list.append(row);
      }
      host.append(list);
    }
  }

  function overshootComparison() {
    const figure=create("figure","reading-figure overshoot-comparison");
    figure.append(create("figcaption","","同一闭环模型的阶跃超调量"));
    const bars=create("div","overshoot-bars");
    const measure=action("用阶跃响应核对",()=>{measured.hidden=false;measure.hidden=true;});
    function bar(label,value) {
      const row=create("div","overshoot-row");
      row.append(create("span","",label),create("strong","",value+"%"));
      const track=create("div","overshoot-track");
      const fill=create("i");
      fill.style.width=(100*value/50)+"%";
      track.append(fill);
      row.append(track);
      return row;
    }
    const measured=bar("模型阶跃响应",33.9);
    measured.classList.add("measured");
    measured.hidden=true;
    bars.append(bar("由相角裕度估算",43.6),bar("由谐振峰值估算",39.0),measured);
    figure.append(bars,measure,create("small","","统一刻度 0–50%。经验系数与适用条件待核。"));
    return figure;
  }

  function thermalArt(point){
    const image='../../../assets/classroom/thermostatic-chamber.webp';
    const angle=point.angle;
    // Register the moving photo layer to the visible hinge axis.
    const fraction=Math.min(1,angle/65);
    const width=-2.05+3.05*fraction+Math.max(0,angle-65)*.0015;
    const slope=.2*(1-fraction);
    const hinge=472;
    const transform="matrix("+[width,slope,0,1,hinge*(1-width),-hinge*slope].map(n=>n.toFixed(4)).join(" ")+")";
    return '<svg class="chamber-photo" viewBox="0 0 1536 1024" role="img" aria-label="可操作恒温箱，箱门和加热功率与温度响应联动">'+
      '<defs><clipPath id="source-chamber-body"><path d="M418 94 667 24 1414 24 1420 960 358 1008 381 874 471 842 477 223 419 231Z"/></clipPath>'+
      '<clipPath id="source-chamber-door"><path d="M475 219 150 285 144 467 113 477 111 715 144 724 177 967 194 979 472 852Z"/></clipPath></defs>'+
      '<rect width="1536" height="1024" rx="20" fill="#eff1f4"/>'+
      '<image href="'+image+'" width="1536" height="1024" clip-path="url(#source-chamber-body)"/>'+
      '<path d="M655 757Q676 735 712 735H1080Q1110 737 1115 757" fill="none" stroke="#ff9e58" stroke-width="16" stroke-linecap="round" opacity="'+Math.min(.9,point.power/3.1).toFixed(3)+'"/>'+
      '<g transform="'+transform+'"><image href="'+image+'" width="1536" height="1024" clip-path="url(#source-chamber-door)"/></g>'+
      '<path d="M462 232 468 848" stroke="#64686b" stroke-width="7" opacity=".75"/>'+
      '<text x="1013" y="177" text-anchor="middle" font-family="monospace" font-size="34" fill="#d7f4e7">'+point.temperature.toFixed(1)+'°C</text>'+
      '</svg>';
  }

  function labFor(number,lab){
    if(chapterNumber===2&&[37,47,48,50].includes(number)&&lab.timed===false)return {...lab,visual:"mason"};
    if(chapterNumber!==1||number!==15)return lab;
    return {...lab,draw(state){
      const frame=lab.draw(state);
      const point=IntroModels.at(IntroModels.thermal(state),state.time);
      return {...frame,art:thermalArt(point)};
    }};
  }

  function showSideNotes(host,entries){
    const panel=host.querySelector(".analysis-panel");
    const space=create("div","diagram-notes");
    const notes=entries.filter(([,body])=>typeof body==="string"||Array.isArray(body)).map(content);
    space.append(...notes);
    panel.append(space);
    // Measure at the actual column width. Keep only complete notes in the available space.
    function fit(){
      if(!space.clientWidth||!space.clientHeight)return;
      let available=space.clientHeight;
      const detail=panel.querySelector("[data-detail]")?.textContent||"";
      for(const item of notes){
        item.hidden=false;
        const copy=item.lastElementChild.textContent;
        const size=item.offsetHeight+8;
        if(size>available||detail.includes(copy))item.hidden=true;
        else available-=size;
      }
    }
    const observer=new ResizeObserver(fit);
    observer.observe(space);
    const detail=panel.querySelector("[data-detail]");
    const changes=new MutationObserver(fit);
    if(detail)changes.observe(detail,{childList:true});
    return ()=>{observer.disconnect();changes.disconnect();};
  }

  function show(number,model=false){
    if(formulaDialog.open)formulaDialog.close();
    dispose();
    dispose=()=>{};
    sequence=null;
    const pageBank=chapterNumber===1?window.SourcePolish:window["SourcePolishCh"+chapterNumber];
    const page=pageBank?.[number];
    const admin=chapterNumber===1?adminPages.get(number):null;
    const screen=create("article","source-page");
    screen.dataset.chapter=chapterNumber;screen.dataset.page=number;
    const heading=create("header","reader-heading");
    const title=create("h1","",pageTitle(document.body.dataset.title));
    const headingRow=create("div","reader-title");
    headingRow.append(title);
    heading.append(headingRow);
    const host=create("div","source-content");
    screen.append(heading,host);
    stage.replaceChildren(screen);
    if(admin){
      screen.classList.add("source-admin");
      if(admin===1)heading.hidden=true;
      else title.textContent=IntroAdmin.titles[admin-1];
      IntroAdmin.render(host,admin);
      return;
    }
    if(!page){
      host.append(create("p","load-message","这一页正在精修。"));
      return;
    }
    const edition=window.SourceEdition?.[chapterNumber+"/"+number];
    emphasis=edition?.emphasis||"";
    screen.dataset.format=page.gallery?"gallery":page.quiz?"quiz":page.lab?(page.lab.timed===false?"diagram":"response"):"reading";
    const key=chapterNumber+"/"+number;
    const focus=ClassroomQuestions[key];
    screen.dataset.primary=page.gallery?"gallery":page.lab?(page.lab.timed===false?"diagram":"curve"):page.quiz?"quiz":"reading";
    if(page.quiz && !model) {
      screen.dataset.lesson="active";
      screen.dataset.primary="quiz";
      if(page.lab)headingRow.append(action("查看模型",()=>show(number,true)));
      renderQuiz(host,page.quiz);
      return;
    }
    screen.dataset.lesson="active";
    if(focus){
      const guide=create("p","page-lead",focus);
      highlight(guide,emphasis);
      heading.append(guide);
    }
    const readingSections=[...page.sections];
    if(page.math?.length && !page.staticBody){
      const formula=["本页公式",{math:page.math}];
      readingSections.push(formula);
      const formulaButton=action("公式",()=>{
        get("formula-body").replaceChildren(content(page.theorems ? ["", {math:page.theorems[state.section||0]}] : formula).lastElementChild);
        formulaDialog.showModal();
      });
      formulaButton.setAttribute("aria-label","查看本页公式");
      headingRow.append(formulaButton);
    }
    if(page.staticBody){
      host.className="static-lesson";
      host.innerHTML=page.staticBody(page);
      return;
    }
    if(page.gallery){
      renderGallery(host,page.gallery);
      return;
    }
    const stateKey=chapterNumber+"/"+number;
    if(!pageState.has(stateKey))pageState.set(stateKey,{});
    const state=pageState.get(stateKey);
    if(page.lab){
        if(page.quiz)headingRow.append(action("返回题目",()=>show(number,false)));
        const lab={...labFor(number,page.lab)};
        if(page.theorems){
          const draw=lab.draw;
          lab.draw=settings=>{
            const question=page.prompts[settings.section];
            heading.querySelector(".page-lead").textContent=question;
            return draw(settings);
          };
        }
        sequence=lab.controls.find(control=>control.sequential);
        dispose=IntroWidgets.lab(host,lab,state);
        const draggableArt=host.querySelector(".model-art[data-drag-label]");
        if(draggableArt){
          host.querySelector(".rig-panel h2")?.append(create("small","drag-hint","可拖动 · "+draggableArt.dataset.dragLabel));
        }
        const switchesTopic=lab.controls.some(control=>control.options) && !!host.querySelector("[data-detail]")?.textContent;
        if(switchesTopic && host.classList.contains("diagram-only"))host.classList.add("current-topic");
        if(!switchesTopic&&page.math?.length&&host.classList.contains("diagram-only")){
          const sample=create("div","diagram-formula");
          window.katex.render(page.math[({"2/11":1,"3/15":2,"3/25":0,"4/9":3,"4/21":1,"4/84":2})[key] || 0],sample,{displayMode:true,throwOnError:false});
          host.querySelector(".analysis-panel").append(sample);
        }
        if(!switchesTopic&&host.matches(".diagram-only:not(.performance,.classify,.thermal,.setpoint,.water,.motor)")){
          const stopModel=dispose;
          const stopNotes=showSideNotes(host,page.sections);
          dispose=()=>{stopModel();stopNotes();};
        }
      return;
    }
    host.classList.add("source-reading");
    if(stateKey==="4/92")host.append(overshootComparison());
    const illustration=overviewFigures[stateKey];
    if(illustration){
      const figure=overviewFigure(illustration,pageBank);
      if(figure)host.append(figure);
    }
    if(readingSections.length===1){
      host.append(content(readingSections[0]));
      return;
    }
    const tabs=create("div","reading-tabs");
    tabs.setAttribute("aria-label","本页分节");
    const panel=create("div","source-reading-panel");
    function select(index){
      state.section=index;
      tabs.querySelectorAll("button").forEach((item,i)=>item.setAttribute("aria-pressed",String(i===index)));
      panel.replaceChildren(content(readingSections[index]));
    }
    readingSections.forEach(([label],index)=>tabs.append(action(label,()=>select(index))));
    const overview=create("div","reading-overview");
    const allowOverview=readingSections.length<=4;
    if(allowOverview)overview.append(...readingSections.map(content));
    overview.hidden=true;
    const reader=create("div","reading-flow");
    reader.append(tabs,panel);
    host.append(reader,overview);
    select(state.section||0);
    if(allowOverview){
      const arrange=()=>{
        if(host.clientWidth<660||host.clientHeight<320){
          overview.hidden=true;
          reader.hidden=false;
          return;
        }
        overview.hidden=false;
        reader.hidden=true;
        if(overview.scrollHeight>overview.clientHeight+2){
          overview.hidden=true;
          reader.hidden=false;
        }
      };
      const observer=new ResizeObserver(arrange);
      observer.observe(host);
      arrange();
      document.fonts.ready.then(()=>{if(host.isConnected)arrange();});
      dispose=()=>observer.disconnect();
    }
  }

  formulaDialog.querySelector("[data-close]").onclick=()=>formulaDialog.close();
  show(pageNumber);
// Runs after the page renderer has mounted its initial state.
  const pageId = document.body.dataset.id;
  const notify = detail => {
    if (parent !== window) parent.postMessage({pageId,...detail},location.origin);
  };
  // The upstream player hides its controls until a page reports pointer activity.
  let lastPoke=-Infinity;
  document.addEventListener("pointermove",()=>{
    const now=performance.now();
    if(now-lastPoke>350){lastPoke=now;notify({type:"act-poke"});}
  },{passive:true});
  let lastState = "";
  function stepState() {
    const reveal = stage.querySelector('[aria-controls="projected-answer"]');
    if (reveal) return {current:Number(reveal.getAttribute("aria-expanded")==="true"),total:1,reveal};
    const lab = stage.querySelector("[data-state]");
    if (sequence && lab) {
      const value = JSON.parse(lab.dataset.state)[sequence.id];
      return {current:value-sequence.min,total:sequence.max-sequence.min,lab,value};
    }
    return {current:0,total:0};
  }
  function signal() {
    const {current,total}=stepState(), signature=current+"/"+total;
    if(signature!==lastState){lastState=signature;notify({type:"act-step-state",current,total});}
  }
  function step(dir) {
    const s=stepState(), next=s.current+dir;
    if(next<0||next>s.total)return;
    if(s.reveal)s.reveal.click();
    else if(s.lab){
      const pick=Array.from(s.lab.querySelectorAll("[data-pick]")).find(el=>
        el.dataset.pick===sequence.id && Number(el.dataset.value)===s.value+dir);
      pick?.click();
    }
  }
  window.addEventListener("message",e=>{
    if(e.origin!==location.origin||e.source!==parent||!e.data)return;
    if(e.data.type==="act-step")step(1);
    if(e.data.type==="act-step-back")step(-1);
    if(e.data.type==="act-reset"){
      pageState.delete(chapterNumber+"/"+pageNumber);
      show(pageNumber);
    }
  });
  document.addEventListener("keydown",e=>{
    if(parent===window||e.defaultPrevented||e.ctrlKey||e.altKey||e.metaKey||document.querySelector("dialog[open]")||
       e.target.closest("input,select,textarea")||(e.code==="Space"&&e.target.closest("button")))return;
    if (["ArrowDown","ArrowRight","PageDown","Space","ArrowUp","ArrowLeft","PageUp","KeyN","KeyF","KeyR","Home","End"].includes(e.code)){
      e.preventDefault();notify({type:"act-key",code:e.code,key:e.key});
    }
  });
  const changes=new MutationObserver(signal);
  changes.observe(stage,{subtree:true,childList:true,attributes:true,attributeFilter:["aria-expanded","data-state"]});
  notify({type:"act-ready",steps:stepState().total});
  signal();
  window.addEventListener("pagehide",()=>{changes.disconnect();dispose();});
})();
