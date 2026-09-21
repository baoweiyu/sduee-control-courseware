/* ============================================================
 * MathJax 渲染器（STIX2 字体 · XITS/Times 教材风）
 * 用法：元素加 class="tex"，内容写 TeX 源码；
 *       独立成行用 class="tex tex-d"（display 模式）。
 * 必须在 tex-chtml.js 之前以同步脚本引入（负责写入配置）。
 * ========================================================== */
(function () {
  window.MathJax = window.MathJax || {};
  var MJ = window.MathJax;

  // 以当前脚本地址推算 stix2 字体目录的绝对 URL，避免相对页面路径解析
  var me = document.currentScript && document.currentScript.src || '';
  var stix2Base = me ? me.replace(/mathjax-render\.js(\?.*)?$/, 'stix2')
                     : '../../../theme/mathjax/stix2';
  var mjxBase = me ? me.replace(/mathjax-render\.js(\?.*)?$/, 'mjx')
                   : '../../../theme/mathjax/mjx';

  MJ.loader = Object.assign(MJ.loader || {}, {
    paths: { 'mathjax-stix2': stix2Base, 'mathjax': mjxBase }
  });
  MJ.chtml = Object.assign(MJ.chtml || {}, {
    font: 'mathjax-stix2',
    scale: 1,
    matchFontHeight: true
  });
  MJ.tex = Object.assign(MJ.tex || {}, {
    packages: { '[+]': ['ams', 'color'] }
  });
  MJ.options = Object.assign(MJ.options || {}, {
    enableMenu: false,
    menuOptions: { settings: { enrich: false, speech: false, braille: false } }
  });

  var rendered = false;
  var failedEls = [];

  // MathJax 4.1 的 color 宏参数不允许出现 # 字符；
  // 把 \color{#RRGGBB} / \textcolor{#RRGGBB} 预处理为 \color[rgb]{r,g,b}（0~1 归一化）
  function sanitizeTex(src) {
    return src.replace(/\\(color|textcolor)\{#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\}/g,
      function (m, macro, hex) {
        if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
        var f = function (i) { return (Math.round(parseInt(hex.slice(i, i + 2), 16) / 255 * 1000) / 1000).toString(); };
        return '\\' + macro + '[rgb]{' + f(0) + ',' + f(2) + ',' + f(4) + '}';
      });
  }

  // 渲染失败判定：① mjx-merror 错误节点（TeX 语法错误，v4 不抛异常）；
  // ② 未定义宏被 noundefined 渲染成红色字面文本——其 mtext 的 data-latex 是裸宏名
  //    （如 "\color"，无花括号参数；合法的 \text{...} 节点带花括号，用此区分）
  // 注意：CSS 属性选择器里匹配反斜杠必须写两个（\\\\ 在 JS 字符串中是 \\，CSS 中 \\ 表示字面反斜杠）
  function renderErrInfo(node) {
    if (!node || !node.querySelectorAll) return null;
    var m = node.querySelector('mjx-merror,[data-mjx-error]');
    if (m) return m.getAttribute('data-mjx-error') || m.textContent || 'merror';
    var us = node.querySelectorAll('mjx-mtext[data-latex^="\\\\"]');
    for (var i = 0; i < us.length; i++) {
      var d = us[i].getAttribute('data-latex') || '';
      if (/^\\[a-zA-Z]+$/.test(d)) return 'undefined macro: ' + d;
    }
    return null;
  }

  function renderOne(el) {
    // 源码可能被上一次失败渲染覆盖，首次渲染时固化保存
    if (!el.__texSrc) el.__texSrc = sanitizeTex(el.textContent);
    var src = el.__texSrc;
    var disp = el.classList.contains('tex-d');
    try {
      var node = MathJax.tex2chtml(src, { display: disp });
      el.textContent = '';
      el.appendChild(node);
      el.style.color = '';
      var errInfo = renderErrInfo(node);
      if (errInfo) {
        window.__mjxErrs = window.__mjxErrs || [];
        window.__mjxErrs.push(errInfo);
        if (failedEls.indexOf(el) < 0) failedEls.push(el);
        return false;
      }
      return true;
    } catch (e) {
      // 动态组件（如 \mathcal 所需）可能尚未加载完成，先标记待重试
      if (failedEls.indexOf(el) < 0) failedEls.push(el);
      return false;
    }
  }

  function retryFailed() {
    if (!failedEls.length || typeof MathJax.tex2chtml !== 'function') return;
    var list = failedEls.slice();
    failedEls.length = 0;
    list.forEach(function (el) {
      // 尚无成功渲染（无容器，或容器内仍是错误节点/红色未定义宏）才重试
      var c = el.querySelector('mjx-container');
      if (!c || renderErrInfo(c)) renderOne(el);
    });
    if (failedEls.length) {
      // 仍有失败：标红便于排查，稍后继续重试
      failedEls.forEach(function (el) { el.style.color = '#D63A2F'; });
    }
    ensureStylesheet();
  }

  // \mathcal 等花体的字形数据异步加载，首轮可能回退成斜体数学字母（mjx-c1D…）；
  // 字体就绪后对这些元素做一次定向重渲染
  function fixFallbackGlyphs() {
    if (typeof MathJax.tex2chtml !== 'function') return;
    document.querySelectorAll('.tex').forEach(function (el) {
      var m = el.querySelector('mjx-math');
      if (!m) return;
      var src = m.getAttribute('data-latex') || '';
      if (!/\\(mathcal|mathbb|mathscr|mathfrak)/.test(src)) return;
      if (!el.querySelector('[class*="mjx-c1D"]')) return;
      try {
        var node = MathJax.tex2chtml(src, { display: el.classList.contains('tex-d') });
        el.textContent = '';
        el.appendChild(node);
      } catch (e) {}
    });
    ensureStylesheet();
  }

  function ensureStylesheet() {
    // tex2chtml 直接调用时 CHTML 布局样式表不会自动插入，需要手动补上；
    // 样式表内容随已用样式累积，故每次调用都用最新内容刷新
    if (typeof MathJax.chtmlStylesheet !== 'function') return;
    var fresh = MathJax.chtmlStylesheet();
    if (!fresh) return;
    var old = document.getElementById('MJX-CHTML-CSS');
    if (old) {
      if (old.textContent !== fresh.textContent) old.textContent = fresh.textContent;
    } else {
      fresh.id = 'MJX-CHTML-CSS';
      document.head.appendChild(fresh);
    }
  }

  function renderAll() {
    if (rendered) return;
    if (typeof MathJax.tex2chtml !== 'function') return;
    rendered = true;
    var begin = function () {
      document.querySelectorAll('.tex').forEach(function (el) { renderOne(el); });
      ensureStylesheet();                       // 渲染后再取样式表（含全部布局规则）
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { ensureStylesheet(); retryFailed(); });
      }
      setTimeout(ensureStylesheet, 600);        // 动态字体异步加载后再刷新一次
      setTimeout(retryFailed, 900);             // 动态组件加载完成后重试失败项
      setTimeout(retryFailed, 2600);
      setTimeout(fixFallbackGlyphs, 1300);      // 修正花体回退字形
      setTimeout(fixFallbackGlyphs, 3000);
      if (document.body) document.body.setAttribute('data-mjx-done', '1');
    };
    // tex2chtml 可用不代表扩展包已注册：TeX jax 在首次 tex2chtml 时才构造，
    // 包集合在构造瞬间固化——必须先显式等 color 扩展加载注册完毕，再开始首轮渲染
    var P = window.MathJax && MathJax.startup && MathJax.startup.promise;
    var afterStartup = function (fn) {
      if (P && typeof P.then === 'function') P.then(fn); else fn();
    };
    afterStartup(function () {
      var L = window.MathJax && MathJax.loader;
      if (L && typeof L.load === 'function') {
        try {
          var lp = L.load('[tex]/color');
          if (lp && typeof lp.then === 'function') {
            var go = function () { whenDomReady(begin); };
            lp.then(go, go);          // 加载失败也要照常渲染（重试机制兜底）
            return;
          }
        } catch (e) { /* fallthrough */ }
      }
      whenDomReady(begin);
    });
  }

  function whenDomReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  MJ.startup = Object.assign(MJ.startup || {}, {
    typeset: false,
    ready: function () {
      window.__mjxReadyCalled = (window.__mjxReadyCalled || 0) + 1;
      try {
        var S = window.MathJax.startup;            // 实时查找，避免捕获旧对象
        window.__mjxStartupType = typeof (S && S.defaultReady);
        if (S && typeof S.defaultReady === 'function') {
          S.defaultReady();
          S.promise.then(function () { whenDomReady(renderAll); });
        }
      } catch (e) {
        window.__mjxReadyErr = String(e && e.message || e);
      }
    }
  });

  // 动态渲染接口：交互页 JS 更新文字标签时调用
  window.mjxTypeset = function (el, src, display) {
    if (typeof MathJax.tex2chtml !== 'function') return false;
    src = sanitizeTex(src);
    el.__texSrc = src;                 // 覆盖缓存，保证重试用的是最新源码
    try {
      var node = MathJax.tex2chtml(src, { display: !!display });
      el.textContent = '';
      el.appendChild(node);
      ensureStylesheet();
      var errInfo = renderErrInfo(node);
      if (errInfo) {
        window.__mjxErrs = window.__mjxErrs || [];
        window.__mjxErrs.push(errInfo);
        if (failedEls.indexOf(el) < 0) failedEls.push(el);
        setTimeout(retryFailed, 900);
      }
      return true;
    } catch (e) {
      // 组件未就绪：暂存源码并排队重试（返回 true 阻止调用方覆盖）
      el.textContent = src;
      if (failedEls.indexOf(el) < 0) failedEls.push(el);
      setTimeout(retryFailed, 900);
      return true;
    }
  };

  // 兜底：若 ready 钩子未被调用，轮询等待 tex2chtml 就绪后渲染
  whenDomReady(function () {
    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      if (typeof MathJax.tex2chtml === 'function') {
        clearInterval(timer);
        renderAll();
      } else if (tries > 100) {           // 约 10 秒仍未就绪则放弃
        clearInterval(timer);
        if (window.console) console.error('[TeX] MathJax startup timeout');
      }
    }, 100);
  });
})();
