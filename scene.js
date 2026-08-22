/* ============================================================
   huinavigate — 背景渐变系统
   粉嫩水晶渐变,滚动驱动颜色平滑过渡(苹果式极简,无 3D)
   ============================================================ */
(() => {
  'use strict';
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) {
    console.warn('[bg] GSAP not loaded — static background.');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  const root = document.documentElement;
  const chapters = document.querySelectorAll('.section, .hero');

  // 每章渐变配色(边缘 / 中心粉白 / 粉肤 / 粉红 / 四角)
  const PALETTES = [
    // hero: 粉白粉嫩
    { corner: '#2a2030', edge: '#8b9bb2', glow: '#fdf3f5', pink: '#f3d9d3', rose: '#e0b8c8' },
    // about: 粉紫
    { corner: '#2a2240', edge: '#8f88b8', glow: '#f5eef7', pink: '#e6d4ef', rose: '#cbaee0' },
    // works: 深粉
    { corner: '#3a2030', edge: '#b0809a', glow: '#fdeef2', pink: '#f2cdd8', rose: '#d99ab4' },
    // skills: 桃粉
    { corner: '#3a2a20', edge: '#c09a78', glow: '#fdf6ef', pink: '#f4dcc8', rose: '#e6b890' },
    // contact: 暖粉 + 金
    { corner: '#302018', edge: '#b89870', glow: '#fdf8f0', pink: '#f6e0cc', rose: '#e8c49c' },
  ];

  function applyPalette(p) {
    root.style.setProperty('--bg-corner', p.corner);
    root.style.setProperty('--bg-edge', p.edge);
    root.style.setProperty('--bg-glow', p.glow);
    root.style.setProperty('--bg-pink', p.pink);
    root.style.setProperty('--bg-rose', p.rose);
  }
  applyPalette(PALETTES[0]);

  // 每章滚动: 从上一章配色渐变到本章
  PALETTES.forEach((p, i) => {
    if (i === 0) return;
    const prev = PALETTES[i - 1];
    gsap.timeline({
      scrollTrigger: { trigger: chapters[i], start: 'top bottom', end: 'top top', scrub: 1 },
    })
    .fromTo(root, {
      '--bg-corner': prev.corner, '--bg-edge': prev.edge,
      '--bg-glow': prev.glow, '--bg-pink': prev.pink, '--bg-rose': prev.rose,
    }, {
      '--bg-corner': p.corner, '--bg-edge': p.edge,
      '--bg-glow': p.glow, '--bg-pink': p.pink, '--bg-rose': p.rose,
      ease: 'none',
    }, 0);
  });

  window.__sceneReady = true;
  console.log('[bg] gradient background ready');
})();
