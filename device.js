/* ============================================================
  huinavigate — 设备检测模块(零依赖,最先加载)
  - 自动区分 desktop / tablet / phone
  - 暴露 window.__device = { type, touch, dpr, w, h, orientation }
  - 在 <body> 写入 data-device / data-touch 属性 → CSS 分级适配
  判定规则:
    desktop: 精细指针 + hover 能力(鼠标)且宽度 > 1024
    tablet : 触屏且宽度 > 720,或精细指针但宽度 ≤ 1024(触屏平板横屏/小笔记本)
    phone  : 其余(触屏 + 宽度 ≤ 720)
  ============================================================ */
(() => {
  'use strict';

  const detect = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const fine = window.matchMedia('(pointer: fine)').matches;
    const hover = window.matchMedia('(hover: hover)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const touch = coarse || ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

    let type = 'desktop';
    if (fine && hover && w > 1024) type = 'desktop';
    else if (w > 720 && (coarse || touch)) type = 'tablet';
    else if (fine && hover && w > 720 && w <= 1024) type = 'tablet'; // 小屏笔记本/平板横屏
    else type = 'phone';

    return {
      type,
      touch,
      fine,
      dpr,
      w,
      h,
      orientation: h > w ? 'portrait' : 'landscape'
    };
  };

  const apply = () => {
    const d = detect();
    window.__device = d;
    const body = document.body;
    if (!body) return;
    body.dataset.device = d.type;
    body.dataset.touch = d.touch ? 'true' : 'false';
    body.dataset.orientation = d.orientation;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }

  // resize / 旋转时更新(节流)
  let timer = 0;
  const onResize = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      apply();
      // 通知其他模块(three-scene 等可监听)
      window.dispatchEvent(new CustomEvent('devicechange', { detail: window.__device }));
    }, 150);
  };
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onResize);
})();
