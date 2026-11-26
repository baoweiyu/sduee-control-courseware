"use strict";
const IntroRigs = (() => {
  const {clamp} = IntroModels;
  function art(body, label, viewBox="0 0 700 340") {
    return '<svg viewBox="'+viewBox+'" role="img" aria-label="'+label+'">'+body+'</svg>';
  }
  const label = (x,y,value,color="#17375a") =>
    '<text x="'+x+'" y="'+y+'" text-anchor="middle" fill="'+color+'" font-size="20" font-weight="680">'+value+'</text>';
  const box = (x,y,w,h,fill="#fff",color="#274d73") =>
    '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="5" fill="'+fill+'" stroke="'+color+'"/>';
  function path(d,stroke="#274d73",w=3) {
    return '<path d="'+d+'" fill="none" stroke="'+stroke+'" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  function feedback(type="closed", focus="", viewBox="0 0 659 198") {
    const names = ["比较","放大","校正","执行","被控对象"];
    const xs = [108,206,287,368,475];
    const active = name => name===focus ? "#d7eee6" : "#f9fcff";
    const id = "loop-" + type;
    const arrow=(name,color)=>'<marker id="'+id+'-'+name+'" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0l8 4-8 4z" fill="'+color+'"/></marker>';
    const wire=(d,name,color,w)=>'<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="'+w+'" marker-end="url(#'+id+'-'+name+')"/>';
    let body = '<defs>'+arrow("forward","#285577")+arrow("return","#087667")+arrow("disturbance","#c35d29")+'</defs>';
    body += wire("M24 99H620","forward","#285577",2.5);
    body += label(45,82,"给定量")+label(620,82,"被控量");
    names.forEach((name,i) => {
      if (type === "open" && !i) return;
      const w = i===4 ? 108 : 66;
      body+=box(xs[i]-w/2,77,w,44,active(name))+label(xs[i],106,name);
    });
    if (type !== "open") {
      body += wire("M577 99V165H108V122","return","#087667",3);
      body+=box(311,146,90,38,active("测量"))+label(356,171,"测量");
      body+=label(127,74,"−","#087667");
    }
    if (type === "compound") {
      body += wire("M535 26H475V74","disturbance","#c35d29",2.2);
      body += wire("M535 26H396","disturbance","#c35d29",2.2);
      body += wire("M318 26H299V55H411V89","disturbance","#c35d29",2.2);
      body += box(318,12,76,28,"#fff3e9","#c35d29")+label(356,33,"前馈","#a44a22");
      body += '<circle cx="411" cy="99" r="9" fill="white" stroke="#365a78"/>'+label(411,104,"+","#274d73")+label(569,33,"扰动","#a44a22");
    } else if (focus==="扰动") body+=wire("M475 25V74","disturbance","#c35d29",2.2);
    return art(body,"控制系统的信号与反馈路径",viewBox);
  }
  function topology(type) {
    const forward="#285577", measured="#087667", disturbance="#a95021";
    const closed=type!=="open", compound=type==="compound";
    const marker=(name,color)=>`<marker id="mini-${type}-${name}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="3.2" markerHeight="3.2" orient="auto"><path d="M0 0l8 4-8 4z" fill="${color}"/></marker>`;
    const wire=(d,name,color)=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="2.7" stroke-linejoin="round" marker-end="url(#mini-${type}-${name})"/>`;
    const block=(x,y,width,height,name,color,fill)=>`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="4" fill="${fill}" stroke="${color}" stroke-width="1.5"/>`+
      `<text x="${x+width/2}" y="${y+height/2+6}" text-anchor="middle" font-size="19" font-weight="700" fill="${color}">${name}</text>`;
    let body="<defs>"+marker("next",forward)+(closed?marker("back",measured):"")+(compound?marker("load",disturbance):"")+"</defs>";
    body+=wire(closed?"M10 53H24":"M10 53H49","next",forward);
    if(closed)body+=wire("M40 53H49","next",forward)+`<circle cx="32" cy="53" r="8" stroke="${forward}" stroke-width="1.8" fill="#f9fcff"/>`;
    body+=wire(compound?"M97 53H110":"M97 53H137","next",forward);
    if(compound)body+=wire("M124 53H137","next",forward)+`<circle cx="117" cy="53" r="7" stroke="${forward}" stroke-width="1.8" fill="#f9fcff"/>`;
    body+=wire("M185 53H206","next",forward);
    if(closed)body+=wire("M197 53V87H32V62","back",measured)+`<circle cx="197" cy="53" r="2.5" fill="${measured}"/>`;
    if(compound){
      body+=wire("M192 19H117","load",disturbance)+wire("M158 19V38","load",disturbance)+wire("M70 19H62V33H117V45","load",disturbance);
      body+=`<text x="196" y="24" font-size="18" font-style="italic" fill="${disturbance}">d</text>`;
      body+=block(70,6,47,26,"前馈",disturbance,"#fff5ec");
    }
    body+=block(49,39,48,28,"控制",forward,"#f4f8fc")+block(137,39,48,28,"对象",forward,"#edf4fa");
    return art(body,{open:"控制信号由控制端传到对象",closed:"被控输出经负反馈返回输入",compound:"扰动经前馈进入控制量，被控输出经负反馈返回输入"}[type],"0 0 216 102");
  }
  const benchView = "0 0 1536 1024";
  const rigInk = "#12223e";
  function rigTag(name, x, y, anchorX, anchorY, pointX, pointY, width = 156) {
    return `<g class="rig-callout">
      <path d="M${anchorX} ${anchorY}L${pointX} ${pointY}" fill="none" stroke="${rigInk}" stroke-width="3.5"/>
      <circle cx="${pointX}" cy="${pointY}" r="6.5" fill="${rigInk}" stroke="#f9fbfe" stroke-width="2.6"/>
      <rect x="${x-width/2}" y="${y-27}" width="${width}" height="53" rx="10" fill="#f8fafc" stroke="${rigInk}" stroke-width="2.8"/>
      <text x="${x}" y="${y+11}" text-anchor="middle" font-size="32" font-weight="750" fill="${rigInk}">${name}</text>
    </g>`;
  }
  function flowArrow(name, x, y, ratio) {
    return `<g transform="translate(${x} ${y})" fill="#135fba">
      <text x="40" y="-16" text-anchor="middle" font-size="33" font-weight="760">${name}</text>
      <path d="M0 0H64V-9L83 3L64 15V6H0Z" opacity="${.54+.46*clamp(ratio)}"/>
    </g>`;
  }
  function motionTank(read, outlet) {
    // The empty acrylic vessel and its pipe hardware are aligned to the backdrop.
    const front = 718-350*clamp(read.h);
    const back = front-48;
    const floatY = Math.min(644, back+17);
    const armX = 519, armY = 158, length = 330;
    const floatRod = 305, rise = floatY-floatRod-armY;
    const armDX = Math.sqrt(length*length-rise*rise);
    const floatX = armX+armDX;
    const jointY = armY+rise;
    const leverX = armX-armDX*60/length, leverY = armY-rise*60/length;
    const middleX = armX+armDX*.44, middleY = armY+rise*.44;
    const stemTop = 203-17*clamp(read.inlet);

    const frontFace = `M478 ${front}Q640 ${front-5} 803 ${front}T1070 ${front}L1070 716Q1055 721 1026 722H483Z`;
    const surface = `M478 ${front}L532 ${back}Q790 ${back-3} 1052 ${back}L1070 ${front}Q916 ${front+4} 803 ${front}T478 ${front}Z`;
    const floatShade = `M480 ${back+31}H1071V721H480Z`;
    const handleAngle = -29+outlet*.57;
    const handleRadian = handleAngle*Math.PI/180;
    const gripX = 1199+137*Math.cos(handleRadian);
    const gripY = 600+.61*137*Math.sin(handleRadian);
    const ripple = Math.min(15, 9+read.qIn*20);
    return art(`<defs>
      <linearGradient id="tank-water-depth" x2="0" y2="1">
        <stop offset="0" stop-color="#61bde7" stop-opacity=".62"/><stop offset=".39" stop-color="#339cce" stop-opacity=".72"/>
        <stop offset="1" stop-color="#1576ad" stop-opacity=".79"/>
      </linearGradient>
      <linearGradient id="tank-water-top" x2=".42" y2="1">
        <stop offset="0" stop-color="#a9dbec" stop-opacity=".72"/><stop offset=".55" stop-color="#76c2e2" stop-opacity=".65"/>
        <stop offset="1" stop-color="#2ba8d3" stop-opacity=".86"/>
      </linearGradient>
      <linearGradient id="tank-handle" x2="0" y2="1">
        <stop offset="0" stop-color="#6ab4f6"/><stop offset=".26" stop-color="#357bbf"/><stop offset=".59" stop-color="#1b4c8d"/><stop offset="1" stop-color="#0c285a"/>
      </linearGradient>
      <radialGradient id="tank-float" cx=".31" cy=".24" r=".76">
        <stop offset="0" stop-color="#fff8cf"/><stop offset=".22" stop-color="#eac579"/><stop offset=".52" stop-color="#c99643"/>
        <stop offset=".81" stop-color="#9c682f"/><stop offset="1" stop-color="#593a27"/>
      </radialGradient>
      <linearGradient id="tank-brass-plate" x2="1" y2="1">
        <stop offset="0" stop-color="#f0cb82"/><stop offset=".5" stop-color="#b67d37"/><stop offset="1" stop-color="#74461f"/>
      </linearGradient>
      <clipPath id="tank-front-pane"><path d="${frontFace}"/></clipPath>
      <clipPath id="tank-float-water"><path d="${floatShade}"/></clipPath>
      <marker id="tank-level-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
        <path d="M2 1L7 5L2 9" fill="none" stroke="#165c91" stroke-width="1.5"/>
      </marker>
    </defs>
    <path d="M478 ${front}L532 ${back}V668L478 716Z" fill="#287aa6" opacity=".42"/>
    <path d="${frontFace}" fill="url(#tank-water-depth)"/>
    <g clip-path="url(#tank-front-pane)">
      <path d="M491 370H508V721H491Z M1052 370H1057V721H1052Z" fill="#b9e8fb" opacity=".45"/>
      <path d="M489 372V721M1061 372V721" fill="none" stroke="#ecf9ff" stroke-width="4" opacity=".60"/>
      <path d="M515 689Q732 708 1055 683M512 701Q744 685 1054 698" fill="none" stroke="#b9e5f9" stroke-width="5" opacity=".33"/>
      <path d="M491 714H1058" stroke="#0e699f" stroke-width="7" opacity=".4"/>
    </g>
    <path d="${surface}" fill="url(#tank-water-top)" stroke="#317ca2" stroke-opacity=".48" stroke-width="2.5"/>
    <path d="M483 ${front}Q640 ${front-8} 803 ${front}T1068 ${front}M536 ${back+2}Q723 ${back-3} 1049 ${back+3}" fill="none" stroke="#c8f0fb" stroke-width="3.5" opacity=".9"/>
    <path d="M529 ${front-9}q103 -14 204 -3m158 -10q74 -7 151 5M573 ${back+14}q59 -11 141 -4m194 3q54 -6 102 -1" fill="none" stroke="#ebfaff" stroke-width="3" opacity=".74"/>
    <ellipse cx="${floatX}" cy="${floatY+15}" rx="${52+ripple}" ry="18" fill="#186385" opacity=".22"/>
    <path d="M477 224h37l15-59-17-10-18 54-17 5z" fill="url(#tank-brass-plate)" stroke="#794922" stroke-width="3"/>
    <path d="M497 214L515 164" stroke="#f0ca7e" stroke-width="4" stroke-linecap="round"/>
    <path d="M458 ${stemTop+7}L${leverX} ${leverY}" fill="none" stroke="#845527" stroke-width="17" stroke-linecap="round"/>
    <path d="M455 ${stemTop+5}L${leverX-2} ${leverY-2}" fill="none" stroke="#e2b868" stroke-width="7" stroke-linecap="round"/>
    <ellipse cx="456" cy="${stemTop+6}" rx="19" ry="7" fill="url(#tank-brass-plate)" stroke="#6d4d29" stroke-width="2"/>
    <path d="M${leverX} ${leverY}L${floatX} ${jointY}L${floatX} ${floatY-34}" fill="none" stroke="#775026" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${leverX} ${leverY-3}L${floatX} ${jointY-3}L${floatX} ${floatY-34}" fill="none" stroke="#d2a35a" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${leverX} ${leverY-7}L${floatX-4} ${jointY-7}V${floatY-36}" fill="none" stroke="#f4d698" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    ${[[leverX,leverY],[armX,armY],[floatX,jointY]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="15" fill="url(#tank-brass-plate)" stroke="#744622" stroke-width="3.5"/><circle cx="${x}" cy="${y}" r="5.7" fill="#9c773d" stroke="#f0d297" stroke-width="2.5"/><path d="M${x-4} ${y+3}l8-6" stroke="#77552d" stroke-width="2"/>`).join("")}
    <circle cx="${floatX}" cy="${floatY}" r="47" fill="url(#tank-float)" stroke="#90602b" stroke-width="2.5"/>
    <ellipse cx="${floatX}" cy="${floatY}" rx="47" ry="47" fill="#1f83a6" opacity=".32" clip-path="url(#tank-float-water)"/>
    <path d="M${floatX-58} ${floatY+15}Q${floatX-2} ${floatY+38} ${floatX+55} ${floatY+15}" fill="none" stroke="#e5f6fc" stroke-width="3" opacity=".62"/>
    <path d="M${floatX-43} ${floatY+12}Q${floatX} ${floatY+25} ${floatX+42} ${floatY+12}" fill="none" stroke="#edd395" stroke-width="2.5" opacity=".57"/>
    <g transform="translate(1199 600)"><title>拖动出水阀手柄</title>
      <ellipse rx="25" ry="12" cy="4" fill="#996627" stroke="#63441d" stroke-width="3"/>
      <g transform="scale(1 .61) rotate(${handleAngle})">
        <path d="M-8 0H152" stroke="#102d60" stroke-width="34" stroke-linecap="round"/>
        <path d="M-8 -4H150" stroke="url(#tank-handle)" stroke-width="29" stroke-linecap="round"/>
        <path d="M18 -12H146" stroke="#78baf2" stroke-opacity=".76" stroke-width="3.5" stroke-linecap="round"/>
      </g>
      <ellipse rx="9" ry="6" cy="-1" fill="#e5b565" stroke="#775326" stroke-width="2"/>
    </g>
    <path d="M1101 ${front}H1136M1101 715H1136" stroke="#165c91" stroke-width="2.6"/>
    <path d="M1127 ${front+4}V711" stroke="#165c91" stroke-width="2.6" marker-start="url(#tank-level-arrow)" marker-end="url(#tank-level-arrow)"/>
    ${rigTag("进水阀",345,98,345,124,435,246)}
    ${rigTag("连杆机构",722,59,675,85,middleX,middleY)}
    ${rigTag("浮球",1107,255,1058,278,floatX+22,floatY-26,128)}
    ${rigTag("水箱",344,510,414,510,477,542,140)}
    ${rigTag("液位",1179,Math.max(386,front-39),1116,Math.max(403,front-19),1069,front,126)}
    ${rigTag("手柄",1363,492,1363,518,gripX,gripY,125)}
    ${rigTag("出水阀",1138,775,1166,750,1199,685)}
    ${flowArrow("进水",124,323,read.qIn/.25)}
    ${flowArrow("出水",1393,728,read.qOut/.25)}
    `,"浮球、连杆、进水阀与可调出水阀。水位和浮球随液位联动",benchView);
  }
  function incubator(read,door) {
    // The artwork gives the projected door-edge vectors at 0 and 90 degrees.
    // Their cosine/sine combination keeps the full vertical hinge line fixed.
    const radians=clamp(door/90)*Math.PI/2, hingeX=202.8;
    const horizontal=119.7*Math.cos(radians)-176.6*Math.sin(radians);
    const slope=59.9*Math.cos(radians)-1.9*Math.sin(radians);
    const a=horizontal/119.7,b=(slope-59.9)/119.7;
    const matrix=[a,b,0,1,hingeX*(1-a),-hingeX*b].map(x=>Number(x.toFixed(5))).join(" ");
    const energy=clamp(read.power/3.1);
    const model=chapter01Incubator
      .replace('<g class="ch1-door-closed">','<g class="ch1-door-closed" transform="matrix('+matrix+')">')
      .replace('class="iso-line ch1-heater"','class="iso-line ch1-heater" style="stroke-width:'+(2.8+energy*2.1)+';opacity:'+(0.48+energy*.52)+'"');
    return model.replace("</svg>",'<circle cx="362" cy="148" r="'+(4+energy*7)+'" fill="#ce672f" opacity=".74"/><path d="M344 148H322" stroke="#c6632b" stroke-width="2"/>'+label(376,181,"加热功率","#a34d23")+'</svg>');
  }
  function motor(read, load, t) {
    const angle = -110+load*4.0;
    const shaftMark = 552+15*Math.sin(t*read.y*.095);
    const speed = read.y.toFixed(1)+"%";
    const knurl = Array.from({length:13}, (_,i)=>{
      const x = 969+i*5.5;
      const rim = Math.sqrt(1-((x-1002)/39)**2);
      return `<path d="M${x} ${410+10*rim}v24.5" fill="none" stroke="#ffe09c" stroke-opacity=".62" stroke-width="1.9"/>`;
    }).join("");
    return art(`<defs>
      <linearGradient id="motor-knob-side">
        <stop offset="0" stop-color="#9a4516"/><stop offset=".22" stop-color="#ee842e"/><stop offset=".45" stop-color="#f39648"/>
        <stop offset=".7" stop-color="#c9611b"/><stop offset="1" stop-color="#813810"/>
      </linearGradient>
      <linearGradient id="motor-knob-top" x2="0" y2="1">
        <stop offset="0" stop-color="#ffd799"/><stop offset=".56" stop-color="#ef9b42"/><stop offset="1" stop-color="#bc611c"/>
      </linearGradient>
      <linearGradient id="motor-nameplate" x2="0" y2="1">
        <stop offset="0" stop-color="#f4f6f9"/><stop offset=".34" stop-color="#d5dce4"/><stop offset="1" stop-color="#a9b3c0"/>
      </linearGradient>
      <clipPath id="motor-shaft-band"><rect x="866" y="532" width="39" height="40" rx="5"/></clipPath>
      <marker id="motor-load-arrow" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
        <path d="M0 0L12 6L0 12L3.5 6Z" fill="#ef771c"/>
      </marker>
    </defs>
    <g fill="${rigInk}" text-anchor="middle">
      <text x="245" y="446" font-size="34" font-weight="740">直流电机实验台</text>
      <text x="233" y="519" font-size="26" font-weight="670">调速驱动器</text>
      <path d="M109 466H382" fill="none" stroke="#677784" stroke-opacity=".5" stroke-width="2"/>
      <rect x="549" y="515" width="215" height="95" rx="5" fill="url(#motor-nameplate)" stroke="#415364" stroke-width="3"/>
      <path d="M557 521H754" stroke="#eef2f6" stroke-width="2.5"/>
      <circle cx="560" cy="527" r="2.7" fill="#4e5e6e"/><circle cx="753" cy="527" r="2.7" fill="#4e5e6e"/>
      <circle cx="560" cy="599" r="2.7" fill="#4e5e6e"/><circle cx="753" cy="599" r="2.7" fill="#4e5e6e"/>
      <text x="657" y="575" font-size="32" font-weight="760">直流电机</text>
      <text x="1295" y="527" font-size="33" font-weight="740">转速计</text>
      <text x="1295" y="581" font-size="29" font-weight="720" fill="#087663">${speed}</text>
      <path d="M1212 543H1380" fill="none" stroke="#687887" stroke-opacity=".5" stroke-width="2"/>
    </g>
    <g clip-path="url(#motor-shaft-band)" fill="none">
      <path d="M867 ${shaftMark}Q886 ${shaftMark+4} 904 ${shaftMark}" stroke="#263847" stroke-width="4" opacity=".65"/>
      <path d="M867 ${shaftMark-3}Q886 ${shaftMark+1} 904 ${shaftMark-3}" stroke="#f4f7f9" stroke-width="2.5" opacity=".9"/>
    </g>
    <g><title>拖动负载控制旋钮</title>
      <ellipse cx="1003" cy="470" rx="43" ry="9" fill="#4a3e33" fill-opacity=".55"/>
      <path d="M982 439v22c0 10 40 10 40 0v-22" fill="#9a4e1f" stroke="#723913" stroke-width="2"/>
      <path d="M963 411L963 437Q1002 462 1041 437V411Z" fill="url(#motor-knob-side)" stroke="#8a4018" stroke-width="3"/>
      ${knurl}
      <ellipse cx="1002" cy="410" rx="39" ry="12" fill="url(#motor-knob-top)" stroke="#ac631f" stroke-width="2.5"/>
      <ellipse cx="1002" cy="410" rx="30" ry="8" fill="none" stroke="#ffdb9e" stroke-width="2"/>
      <g transform="translate(1002 410) scale(1 .30) rotate(${angle})">
        <path d="M0 -7V-27" stroke="#702c0e" stroke-width="5" stroke-linecap="round"/>
        <path d="M0 -10V-25" stroke="#fff2c1" stroke-width="2.4" stroke-linecap="round"/>
      </g>
      <path d="M927 388Q1003 333 1078 388" fill="none" stroke="#ef771c" stroke-width="4" marker-start="url(#motor-load-arrow)" marker-end="url(#motor-load-arrow)"/>
    </g>
    ${rigTag("负载控制",1003,294,1003,321,1002,379,212)}
    `,"直流电机试验台、可拖动负载旋钮与实时转速计",benchView);
  }
  function road({angle,t,y,u}) {
    const hill=140-angle*4, x=82+(t/12)*444, carY=232-(x/700)*(232-hill);
    return art('<rect x="0" y="0" width="700" height="340" rx="12" fill="#edf5fb"/><path d="M0 205 136 162 260 193 395 122 700 165V340H0z" fill="#d4e6ef"/>'+
      '<path d="M0 248 L700 '+hill+'" stroke="#8ca2b5" stroke-width="72"/><path d="M0 248 L700 '+hill+'" stroke="#f8fbff" stroke-width="3" stroke-dasharray="18 12"/>'+
      '<g transform="translate('+x+' '+carY+') rotate('+(-angle)+' 0 0)"><path d="M0 0l13-17 40-3 22 16 21 5v23H0z" fill="#305e8e" stroke="#1a3b67" stroke-width="3"/><path d="M17-13l31-3 15 13H11z" fill="#c8e6f3"/><circle cx="21" cy="24" r="10" fill="#233a54"/><circle cx="75" cy="24" r="10" fill="#233a54"/></g>'+
      label(126,58,"车速 "+y.toFixed(1)+" km/h")+label(522,60,"节气门 "+Math.round(u/2)+"%","#087367"),"定速巡航车辆与坡度");
  }
  function landing(stage) {
    const y=64+stage*55;
    return art('<rect width="700" height="340" rx="10" fill="#fbefe4"/><path d="M0 314l100-24 125 25 97-14 100 16 95-22 183 20v25H0z" fill="#df9360"/>'+
      '<path d="M105 38C207 54 273 156 350 289" fill="none" stroke="#b76f40" stroke-width="2" stroke-dasharray="7 7"/>'+
      '<g transform="translate('+ (175+stage*55)+' '+y+')">'+(stage===1?'<path d="M-62-25a62 39 0 0 1 124 0z" fill="#f7c479" stroke="#986440"/><path d="M-59-25L-9 13m69-38L9 13m-11-38v38" stroke="#896541" fill="none"/>':"")+
      (stage===2?'<path d="M-16 28l-8 27 15-12 8 20 9-19 10 8-6-24" fill="#e57c46"/>':"")+
      (stage===3?'<path d="M-22 18l-32 37m70-37 32 37m-33-36-8 37m-25-36 8 37" fill="none" stroke="#73879a" stroke-width="4"/><path d="M-63 55h21m79 0h21m-72 3H7m-18 0h28" stroke="#536b80" stroke-width="5"/>':"")+
      '<path d="M-34 19Q-25-12 0-15q25 3 34 34L22 29h-44z" fill="#dce5eb" stroke="#4f6f87" stroke-width="2"/><path d="M-18 13H18M0-9v18" stroke="#7895ae"/></g>',"天问一号着陆阶段示意");
  }
  function sensor({position,heading,kind}) {
    const x=340+position*2.45, y=165-Math.abs(position)*.21;
    const spread=[62,38,28,76,10,10][kind];
    const visible=kind<4 ? '<path d="M0 -35L-'+spread+' -195H'+spread+'z" fill="#37a88b32" stroke="#3e9e83" stroke-dasharray="6 3"/>' : "";
    return art('<rect width="700" height="340" rx="10" fill="#edf4fa"/><path d="M168 0v340M530 0v340" stroke="#aabfd1" stroke-width="5"/><path d="M350 0v340" stroke="#fff" stroke-width="3" stroke-dasharray="14 12"/>'+
      '<g transform="translate(350 263) rotate('+heading+')">'+visible+'<rect x="-32" y="-48" width="64" height="98" rx="21" fill="#316290" stroke="#17395c" stroke-width="2"/><rect x="-23" y="-26" width="46" height="36" rx="9" fill="#d0e4f1"/><circle cx="0" cy="-41" r="7" fill="#ffd8a5"/></g>'+
      '<circle cx="'+x+'" cy="'+y+'" r="13" fill="#cb7344" stroke="#8e4d30" stroke-width="2"/>'+label(x,y-23,"目标","#a4532b"),"车辆传感器方向与目标位置示意");
  }
  return {feedback,topology,tank:motionTank,incubator,motor,road,landing,sensor};
})();
