/* 课件页面基座 v0.2：等比缩放 + 自动页眉页脚 + 与 Course Player 的分步通信
   用法：<body data-title="页面标题" data-page="5 / 34" data-footno="5">
   可选：data-nochrome="1" 关闭自动页眉页脚（如封面页）。
*/
(function () {
  "use strict";
  const DW = 1448, DH = 1086;

  const CAP_SVG = '<svg class="cap" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="none" stroke="#fff" stroke-width="3"/><path d="M32 16 L52 25 L32 34 L12 25 Z" fill="#fff"/><path d="M22 30 v8 c0 4 20 4 20 0 v-8 l-10 5 z" fill="#fff"/><rect x="48" y="25" width="3" height="12" fill="#F5821F"/><circle cx="49.5" cy="39" r="2.5" fill="#F5821F"/></svg>';

  // ---- 自动页眉页脚（defer 脚本执行时 DOM 已解析）----
  (function chrome() {
    const b = document.body;
    const slide = document.querySelector(".act-slide");
    if (!slide || b.dataset.nochrome === "1") return;
    const title = b.dataset.title || document.title;
    const page = b.dataset.page || "";
    const footno = b.dataset.footno || page.split("/")[0].trim();
    const frag = document.createElement("template");
    frag.innerHTML =
      `<div class="act-badge">${CAP_SVG}《自动控制理论》</div>` +
      `<div class="act-title"${title.length > 17 ? ' style="font-size:37px"' : ""}>${title}</div>` +
      `<div class="act-title-deco"></div>` +
      (page ? `<div class="act-pageno">${page}</div>` : "") +
      `<div class="act-foot"></div>` +
      (footno ? `<div class="act-footno">${footno}</div>` : "");
    const kids = Array.from(frag.content.children);
    slide.prepend(...kids.filter(el =>
      el.classList.contains("act-badge") || el.classList.contains("act-title") || el.classList.contains("act-title-deco") || el.classList.contains("act-pageno")));
    kids.forEach(el => slide.appendChild(el));
    slide.querySelectorAll(".act-badge,.act-title,.act-title-deco,.act-pageno").forEach(el => { el.style.pointerEvents = "none"; });
  })();

  function fit() {
    const w = window.innerWidth, h = window.innerHeight;
    if (!w || !h) return; // 嵌入面板隐藏时窗口尺寸为 0，保持原缩放避免 scale(0)
    const s = Math.min(w / DW, h / DH);
    const tx = Math.max(0, (w - DW * s) / 2), ty = Math.max(0, (h - DH * s) / 2);
    document.querySelectorAll(".act-slide").forEach(el => {
      el.style.transform = `translate(${tx}px,${ty}px) scale(${s})`;
    });
  }
  window.addEventListener("resize", fit);

  // ---- 分步呈现 ----
  const Step = {
    els: [], cur: 0,
    init() {
      this.els = Array.from(document.querySelectorAll("[data-step]"))
        .sort((a, b) => (+a.dataset.step) - (+b.dataset.step));
      this.cur = 0;
      this.els.forEach(e => e.classList.remove("shown"));
      this.report();
    },
    next() {
      if (this.cur < this.els.length) {
        this.els[this.cur].classList.add("shown");
        this.cur++;
      }
      this.report();
      return this.cur >= this.els.length;
    },
    prev() {
      // 页面自定义了 window.prev（重放式回退）时优先用页面逻辑，保证 K/el 状态机一致
      if (typeof window.prev === "function") { window.prev(); this.report(); return this.cur <= 0; }
      if (this.cur > 0) {
        this.cur--;
        this.els[this.cur].classList.remove("shown");
      }
      this.report();
      return this.cur <= 0;
    },
    reset() { this.init(); },
    report() {
      this._post({ type: "act-step-state", current: this.cur, total: this.els.length });
    },
    _post(m) { try { window.parent && window.parent.postMessage(m, "*"); } catch (e) {} }
  };

  window.ACT = window.ACT || {};
  window.ACT.step = Step;
  window.ACT.fit = fit;

  window.addEventListener("message", ev => {
    const m = ev.data || {};
    if (m.type === "act-step") Step.next();
    if (m.type === "act-step-back") Step.prev();
    if (m.type === "act-reset") Step.reset();
  });

  // 嵌入播放器时：把按键/指针活动转发给播放器（解决焦点进入 iframe 后键盘导航失效）
  if (window.parent !== window) {
    window.addEventListener("keydown", e => {
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA")) return;
      Step._post({ type: "act-key", code: e.code, key: e.key });
      if (["Space", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "PageUp", "PageDown"].includes(e.code)) e.preventDefault();
    });
    window.addEventListener("pointerdown", () => Step._post({ type: "act-poke" }));
    let mvTh = null;
    window.addEventListener("mousemove", () => {
      if (mvTh) return;
      mvTh = setTimeout(() => { mvTh = null; }, 500);
      Step._post({ type: "act-poke" });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    fit();
    if (window.parent === window) {
      window.addEventListener("keydown", e => {
        if (e.code === "Space" || e.code === "ArrowRight") { Step.next(); e.preventDefault(); }
        if (e.code === "ArrowLeft") { Step.prev(); e.preventDefault(); }
        if (e.key === "r" || e.key === "R") Step.reset();
      });
    }
    Step.init();
    Step._post({ type: "act-ready", steps: Step.els.length, title: document.title });
  });
})();
