/* ============================================================
   huinavigate — 背景渐变系统
   全屏粉嫩水晶渐变背景,滚动驱动颜色平滑过渡 + 鼠标金色光斑
   ============================================================ */
(() => {
  'use strict';
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) {
    console.warn('[bg] GSAP not loaded — static background.');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------
     背景层: 每章一组渐变关键色,滚动时 GSAP 驱动 CSS 变量
     ---------------------------------------------------------- */
  const root = document.documentElement;
  const chapters = document.querySelectorAll('.chapter');

  // 每章配色(边缘 / 中心粉白 / 粉肤 / 粉红 / 四角)
  const PALETTES = [
    // ch0 hero: 粉白粉嫩(主)
    { corner: '#2a2030', edge: '#8b9bb2', glow: '#fdf3f5', pink: '#f3d9d3', rose: '#e0b8c8' },
    // ch1 explore: 粉紫
    { corner: '#2a2240', edge: '#8f88b8', glow: '#f5eef7', pink: '#e6d4ef', rose: '#cbaee0' },
    // ch2 works: 深粉
    { corner: '#3a2030', edge: '#b0809a', glow: '#fdeef2', pink: '#f2cdd8', rose: '#d99ab4' },
    // ch3 skills: 桃粉
    { corner: '#3a2a20', edge: '#c09a78', glow: '#fdf6ef', pink: '#f4dcc8', rose: '#e6b890' },
    // ch4 contact: 暖粉 + 金
    { corner: '#302018', edge: '#b89870', glow: '#fdf8f0', pink: '#f6e0cc', rose: '#e8c49c' },
  ];

  // 初始应用 ch0 配色
  function applyPalette(p) {
    root.style.setProperty('--bg-corner', p.corner);
    root.style.setProperty('--bg-edge', p.edge);
    root.style.setProperty('--bg-glow', p.glow);
    root.style.setProperty('--bg-pink', p.pink);
    root.style.setProperty('--bg-rose', p.rose);
  }
  applyPalette(PALETTES[0]);

  // 每章滚动区间: 从上一章配色渐变到本章配色
  PALETTES.forEach((p, i) => {
    if (i === 0) return;
    const prev = PALETTES[i - 1];
    const from = {
      corner: prev.corner, edge: prev.edge, glow: prev.glow, pink: prev.pink, rose: prev.rose,
    };
    gsap.timeline({
      scrollTrigger: {
        trigger: chapters[i], start: 'top bottom', end: 'top top', scrub: 1,
      },
    })
    .fromTo(root, {
      '--bg-corner': from.corner, '--bg-edge': from.edge,
      '--bg-glow': from.glow, '--bg-pink': from.pink, '--bg-rose': from.rose,
    }, {
      '--bg-corner': p.corner, '--bg-edge': p.edge,
      '--bg-glow': p.glow, '--bg-pink': p.pink, '--bg-rose': p.rose,
      ease: 'none',
    }, 0);
  });

  /* ----------------------------------------------------------
     鼠标金色光斑跟随(柔和)
     ---------------------------------------------------------- */
  const spot = document.querySelector('.bg-glow-spot');
  if (spot && !REDUCED) {
    let tx = 0.5, ty = 0.42, cx = 0.5, cy = 0.42;
    window.addEventListener('mousemove', e => {
      tx = e.clientX / window.innerWidth;
      ty = e.clientY / window.innerHeight;
    }, { passive: true });
    (function loop() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      spot.style.setProperty('--mx', (cx * 100).toFixed(2) + '%');
      spot.style.setProperty('--my', (cy * 100).toFixed(2) + '%');
      requestAnimationFrame(loop);
    })();
  }

  window.__sceneReady = true;
  console.log('[bg] gradient background ready');
})();
