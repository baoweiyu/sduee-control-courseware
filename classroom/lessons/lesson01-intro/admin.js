"use strict";
const IntroAdmin=(()=>{
  const data=window.introSourceData.admin;
  const {escape:e,note}=IntroWidgets;
  const list=items=>'<ul>'+items.map(item=>'<li>'+e(item)+'</li>').join("")+'</ul>';
  const card=(title,body)=>'<section class="admin-card"><h2>'+e(title)+'</h2>'+body+'</section>';
  const grid=items=>'<div class="admin-grid">'+items.join("")+'</div>';
  function table(rows){
    return '<table><thead><tr>'+rows[0].map(c=>"<th>"+e(c)+"</th>").join("")+'</tr></thead><tbody>'+
      rows.slice(1).map(row=>'<tr>'+row.map(cell=>"<td>"+e(cell)+"</td>").join("")+'</tr>').join("")+'</tbody></table>';
  }
  const coverDiagram=()=>`<svg viewBox="0 0 520 275" role="img" aria-label="负反馈控制系统方框图">
    <defs><marker id="cover-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" viewBox="0 0 8 8"><path d="M0 0l8 4-8 4z" fill="currentColor"/></marker></defs>
    <g fill="none" stroke="currentColor" stroke-width="3">
      <path d="M27 86H92" marker-end="url(#cover-arrow)"/><path d="M138 86H229" marker-end="url(#cover-arrow)"/>
      <path d="M384 86h114" marker-end="url(#cover-arrow)"/><path d="M453 86v135h-66" marker-end="url(#cover-arrow)"/>
      <path d="M232 221H116V111" marker-end="url(#cover-arrow)"/>
      <circle cx="116" cy="86" r="22"/>
      <rect x="232" y="44" width="152" height="84"/>
      <rect x="232" y="179" width="152" height="84"/>
    </g>
    <g fill="currentColor" font-family="Cambria Math, STIX Two Math, serif" font-size="38" font-style="italic" text-anchor="middle">
      <text x="311" y="99">G(s)</text><text x="311" y="234">H(s)</text>
    </g>
    <g fill="currentColor" font-size="24"><text x="77" y="78">+</text><text x="86" y="122">−</text></g>
  </svg>`;
  const pages={
    1:()=>'<div class="intro-cover"><div><h1>'+e(data.cover[0])+'</h1><i></i><h2>'+e(data.cover[1])+'</h2><p>'+e(data.cover[2])+'</p></div>'+coverDiagram()+'</div>',
    2:()=>'<p class="affiliation">'+e(data.team[0])+'</p>'+grid(data.team[1].map(([name,...contacts])=>card(name,list(contacts)))),
    3:()=>'<div class="hours-total" aria-hidden="true"><i></i><i></i></div>'+grid(data.hours.map(([title,...items])=>card(title,list(items))))+note(data.hoursNote),
    4:()=>'<p class="grade-total">'+e(data.grading[0])+'</p>'+grid([card("考核评价方式",list(data.grading[1])),card("考核评价标准",list(data.grading[2]))])+note(data.gradingNote),
    5:()=>grid([card(data.mooc[0][0],'<p>'+e(data.mooc[0][1])+'</p>'),card(data.mooc[1][0],'<p>'+e(data.mooc[1][1])+'</p><figure><img src="../../../assets/legacy/chapt1/qr-zhidao-2026.png" alt="知到学生端二维码"><figcaption>知到学生端 APP</figcaption></figure>')]),
    6:()=>'<div class="admin-book"><img src="../../../assets/legacy/chapt1/textbook-4th.png" alt="课程教材封面"><div><p>'+e(data.book[0])+'</p><h2>'+e(data.book[1])+'</h2>'+list(data.book.slice(2))+'</div></div>',
    7:()=>'<div class="calendar-grid">'+data.schedule.map(table).join("")+'</div>'+note(data.scheduleNote)
  };
  function render(host,page){
    host.className="lesson administration";
    host.dataset.adminPage=page;
    host.innerHTML=pages[page]();
  }
  return {titles:data.titles,render};
})();
