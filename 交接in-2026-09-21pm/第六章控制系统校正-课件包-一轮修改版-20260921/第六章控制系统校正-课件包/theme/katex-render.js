/* KaTeX 本地渲染助手 —— 扫描 .tex 元素，把其文本内容作为 TeX 源码渲染为专业公式。
   用法：行内公式 <span class="tex">G_1(s)</span>；独立成行 <div class="tex tex-d">...</div>。
   依赖同目录 katex.min.js（须在 katex-render.js 之前以 defer 引入）。 */
document.addEventListener("DOMContentLoaded", function () {
  if (typeof katex === "undefined") return;
  document.querySelectorAll(".tex").forEach(function (el) {
    var src = el.textContent;
    var display = el.classList.contains("tex-d");
    try {
      katex.render(src, el, {
        displayMode: display,
        throwOnError: false,
        strict: false,
        trust: true
      });
    } catch (e) { /* 渲染失败时保留原始文本 */ }
  });
});
