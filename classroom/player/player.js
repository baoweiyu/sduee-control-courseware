"use strict";
(async () => {
  const get = id => document.getElementById(id);
  const frame = get("frame"), outline = get("outline-dialog"), list = get("compact-list");
  const menu = get("outline"), choice = get("chapter-choice");
  const manifests = new Map();
  window.coursewarePageState = new Map();
  let catalog, lesson, index = 0, request = 0, ready = false, position = 0, steps = 0;
  const origin = location.origin;

  async function read(path) {
    const res = await fetch("../lessons/" + path, {cache:"no-cache"});
    if (!res.ok) throw Error("无法载入 " + path);
    return res.json();
  }
  function entry() {
    const q = new URLSearchParams(location.search);
    const row = catalog.find(row => row.lesson_id === q.get("lesson")) || catalog[Number(q.get("c"))-1] || catalog[0];
    return open(row, Number(q.get("p")) || 1, false);
  }
  async function open(row, page, push) {
    const ticket = ++request;
    try {
      const next = manifests.get(row.lesson_id) || await read(row.path);
      if (ticket !== request) return;
      manifests.set(row.lesson_id,next);
      if (lesson !== next) {
        list.replaceChildren(...next.pages.map((item,i) => {
          const button = document.createElement("button"), number = document.createElement("span");
          number.className = "page-index"; number.textContent = String(i+1).padStart(2,"0");
          button.append(number, document.createTextNode(item.title));
          button.onclick = () => go(i+1,true);
          return button;
        }));
      }
      lesson = next;
      choice.value = lesson.lesson_id;
      go(page,push);
      get("load-error").hidden = true;
    } catch (error) {
      if (ticket !== request) return;
      if (lesson) choice.value = lesson.lesson_id;
      get("load-error").hidden = false;
      console.error(error);
    }
  }
  function go(page, push) {
    if (!lesson) return;
    if (outline.open) outline.close();
    index = Math.max(0, Math.min(lesson.pages.length-1, Math.trunc(page)-1));
    const item = lesson.pages[index];
    if (push) {
      const url = new URL(location.href);
      url.searchParams.delete("c"); url.searchParams.set("lesson",lesson.lesson_id); url.searchParams.set("p",index+1);
      if (url.href !== location.href) history.pushState(null,"",url);
    }
    get("previous").disabled = index === 0;
    get("next").disabled = index === lesson.pages.length-1;
    get("folio").textContent = (index+1) + " / " + lesson.pages.length;
    document.body.style.setProperty("--chapter-progress",(index+1)*100/lesson.pages.length+"%");
    Array.from(list.children).forEach((el,i)=>el.setAttribute("aria-current",i===index?"page":"false"));
    frame.title = item.title; document.title = item.title+" · 自动控制理论";
    ready=false; position=0; steps=0;
    const row=catalog.find(row=>row.lesson_id===lesson.lesson_id);
    const src=new URL(item.file,new URL("../lessons/"+row.path,location.href));
    // Replace the iframe document without adding a second browser history entry.
    frame.contentWindow.location.replace(src.href);
  }
  function send(type){if (ready) frame.contentWindow.postMessage({type},origin);}
  function advance(dir){
    if (!ready) return;
    if ((dir>0 && position<steps)||(dir<0 && position>0)) send(dir>0?"act-step":"act-step-back");
    else if (index+dir>=0 && index+dir<lesson.pages.length) go(index+1+dir,true);
  }
  function openMenu(){
    if (!lesson || outline.open) return;
    outline.showModal(); menu.setAttribute("aria-expanded","true");
    list.querySelector('[aria-current="page"]')?.focus();
  }
  function fullscreen(){
    (document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen())?.catch(()=>{});
  }
  function key(code){
    if (outline.open || !lesson) return false;
    if (["ArrowDown","ArrowRight","PageDown","Space"].includes(code)) advance(1);
    else if (["ArrowUp","ArrowLeft","PageUp"].includes(code)) advance(-1);
    else if(code==="KeyN") openMenu();
    else if(code==="KeyF") fullscreen();
    else if(code==="KeyR") send("act-reset");
    else if(code==="Home" || code==="End") go(code==="Home"?1:lesson.pages.length,true);
    else return false;
    return true;
  }
  window.addEventListener("message",e=>{
    const m=e.data;
    if(e.origin!==origin || e.source!==frame.contentWindow || !m || !lesson || m.pageId!==lesson.pages[index].id) return;
    if(m.type==="act-ready"){ready=true;steps=m.steps;position=0;}
    if(m.type==="act-step-state"){steps=m.total;position=m.current;}
    if(m.type==="act-key") key(m.code);
  });
  document.addEventListener("keydown",e=>{
    if(e.defaultPrevented||e.ctrlKey||e.altKey||e.metaKey||e.target.closest("input,select,textarea")||(e.code==="Space"&&e.target.closest("button")))return;
    if(key(e.code))e.preventDefault();
  });
  get("previous").onclick=()=>go(index,true);
  get("next").onclick=()=>go(index+2,true);
  get("fullscreen").onclick=fullscreen;
  menu.onclick=openMenu;
  outline.addEventListener("close",()=>menu.setAttribute("aria-expanded","false"));
  outline.querySelector("[data-close]").onclick=()=>outline.close();
  outline.onclick=e=>{if(e.target===outline&&e.clientX>outline.getBoundingClientRect().right)outline.close();};
  try {
    catalog=await read("index.json");
    choice.replaceChildren(...catalog.map(row=>new Option(row.title,row.lesson_id)));
    choice.onchange=()=>open(catalog.find(row=>row.lesson_id===choice.value),1,true);
    window.addEventListener("popstate",entry);
    await entry();
  } catch(error){get("load-error").hidden=false;console.error(error);}
})();
