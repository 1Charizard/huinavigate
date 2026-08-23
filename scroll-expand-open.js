/* ============================================================
   huinavigate — Scroll Expand 合并开场动画(零依赖)
   把产品区的"媒体窗口展开"视觉搬进开场:
   1. 深色底上,一个粉金媒体小窗(1.6:1,圆角,金边光效)居中停留
   2. 窗口从中心平滑展开填满全屏(媒体 scale 1.35→1,scrim 加深)
   3. 品牌文字随展开上移淡出
   4. onComplete 后由调用方淡出容器(如 intro.done)揭幕 hero

   用法: window.ScrollExpandOpening(container, {
     brand, tag, hold, expand, onComplete
   })
   container 内需有两个 .ps-layer(会被隐藏,由窗口接管视觉)
   ============================================================ */
(() => {
  'use strict';

  function ScrollExpandOpening(container, opts = {}) {
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    if (!cw || !ch) return;

    const hold = opts.hold ?? 900;
    const expand = opts.expand ?? 1500;
    const brand = opts.brand || 'huinavigate';
    const tag = opts.tag || '';

    /* 隐藏原层(深色品牌层等),视觉由媒体窗口接管 */
    container.querySelectorAll('.ps-layer').forEach(layer => {
      layer.dataset.visible = 'false';
      layer.setAttribute('aria-hidden', 'true');
    });
    container.classList.add('seo-running');

    /* 窗口初始尺寸:宽 min(660px, 78%),1.6:1,高上限 42% —— 与产品区一致 */
    const RATIO = 1.6;
    let winW = Math.min(660, cw * 0.78);
    let winH = winW / RATIO;
    if (winH > ch * 0.42) { winH = ch * 0.42; winW = winH * RATIO; }
    const insetTop = (ch - winH) / 2;
    const insetSide = (cw - winW) / 2;

    const windowEl = document.createElement('div');
    windowEl.className = 'seo-window';
    windowEl.setAttribute('aria-hidden', 'true');
    windowEl.innerHTML =
      '<div class="seo-media"></div>' +
      '<div class="seo-scrim"></div>' +
      '<div class="seo-content">' +
        '<span class="seo-brand"></span>' +
        (tag ? '<span class="seo-tag"></span>' : '') +
      '</div>';
    windowEl.querySelector('.seo-brand').textContent = brand;
    if (tag) windowEl.querySelector('.seo-tag').textContent = tag;
    container.appendChild(windowEl);

    const mediaEl = windowEl.querySelector('.seo-media');
    const scrimEl = windowEl.querySelector('.seo-scrim');
    const contentEl = windowEl.querySelector('.seo-content');

    const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
    const clipFrom = `inset(${insetTop}px ${insetSide}px ${insetTop}px ${insetSide}px round 26px)`;
    const clipTo = 'inset(0px 0px 0px 0px round 0px)';

    /* 初始状态:小窗 + 媒体放大 + 无 scrim */
    windowEl.style.clipPath = clipFrom;
    mediaEl.style.transform = 'scale(1.35)';
    scrimEl.style.opacity = '0';

    const run = () => {
      windowEl.animate(
        [{ clipPath: clipFrom }, { clipPath: clipTo }],
        { duration: expand, easing: ease, fill: 'forwards' }
      );
      mediaEl.animate(
        [{ transform: 'scale(1.35)' }, { transform: 'scale(1)' }],
        { duration: expand, easing: ease, fill: 'forwards' }
      );
      scrimEl.animate(
        [{ opacity: 0 }, { opacity: 0.45 }],
        { duration: expand, easing: ease, fill: 'forwards' }
      );
      contentEl.animate(
        [
          { opacity: 1, transform: 'translateY(0) scale(1)' },
          { opacity: 0, transform: 'translateY(-26px) scale(1.05)' }
        ],
        { duration: Math.round(expand * 0.85), delay: Math.round(expand * 0.15), easing: ease, fill: 'forwards' }
      );
      window.setTimeout(() => {
        container.classList.remove('seo-running');
        if (typeof opts.onComplete === 'function') opts.onComplete();
      }, expand + 60);
    };

    window.setTimeout(run, hold);
  }

  window.ScrollExpandOpening = ScrollExpandOpening;
})();
