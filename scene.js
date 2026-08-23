/* ============================================================
   huinavigate — 背景渐变 + 滚动编舞
   粉嫩 + 金色单一色温渐变,每 section 差异化响应
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
  const bg = document.querySelector('.bg-scene');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 单一色温 palette(粉→金,不跳向紫/蓝) */
  const PALETTES = [
    // hero: 粉白粉嫩
    { corner: '#2a1a22', edge: '#d9a9c0', glow: '#fdf3f5', pink: '#f3d9d3', rose: '#e0b8c8' },
    // about: 微深粉
    { corner: '#2a1c24', edge: '#cf9db6', glow: '#fdf0f3', pink: '#f0d2ce', rose: '#d9aec2' },
    // works: 粉金
    { corner: '#2e1e1a', edge: '#d3a98a', glow: '#fdf4ec', pink: '#f5ddc6', rose: '#e6c39e' },
    // skills: 桃粉
    { corner: '#2a1e1c', edge: '#d8ab86', glow: '#fdf5ea', pink: '#f6dfc8', rose: '#ecc7a0' },
    // contact: 暖粉金
    { corner: '#322014', edge: '#cfa468', glow: '#fdf6e8', pink: '#f7e3c4', rose: '#eccb96' },
  ];

  function applyPalette(p) {
    root.style.setProperty('--bg-corner', p.corner);
    root.style.setProperty('--bg-edge', p.edge);
    root.style.setProperty('--bg-glow', p.glow);
    root.style.setProperty('--bg-pink', p.pink);
    root.style.setProperty('--bg-rose', p.rose);
  }
  applyPalette(PALETTES[0]);

  const sections = ['.hero', '#about', '#works', '#skills', '#contact'];

  /* 背景:每章滚动从上一配色渐变到本章(scrub) */
  PALETTES.forEach((p, i) => {
    if (i === 0) return;
    const prev = PALETTES[i - 1];
    gsap.timeline({
      scrollTrigger: { trigger: sections[i], start: 'top bottom', end: 'top top', scrub: 1 },
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

  /* 背景:极慢的 aurora 漂移(渐变动画) */
  if (!reduceMotion && bg) {
    gsap.to(bg, {
      scale: 1.08, rotate: 1.2, duration: 18,
      ease: 'sine.inOut', yoyo: true, repeat: -1,
    });
  }

  /* ============================================================
     HERO:标题视差 + 滚动渐隐
     ============================================================ */
  const heroTitle = document.querySelector('.hero-title');
  if (!reduceMotion && heroTitle) {
    gsap.to(heroTitle, {
      yPercent: -18, opacity: 0.25, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to('.hero-scroll', {
      opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: '25% top', scrub: true },
    });
  }

  /* ============================================================
     ABOUT:水晶视觉随滚动旋转/浮动
     ============================================================ */
  const aboutVisual = document.querySelector('.about-visual');
  if (!reduceMotion && aboutVisual) {
    gsap.fromTo(aboutVisual, { rotate: -4, y: 30 }, {
      rotate: 4, y: -30, ease: 'none',
      scrollTrigger: { trigger: '#about', start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }

  /* ============================================================
     WORKS:卡片交错入场 + 轻微视差
     ============================================================ */
  const workCards = document.querySelectorAll('#works .card');
  if (workCards.length) {
    if (reduceMotion) {
      gsap.set(workCards, { y: 0 });
    } else {
      gsap.from(workCards, {
        y: 60, duration: 0.9, stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: { trigger: '#works .cards', start: 'top 85%' },
      });
      workCards.forEach((card, i) => {
        gsap.to(card, {
          y: i % 2 === 0 ? -18 : 18, ease: 'none',
          scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });
    }
  }

  /* ============================================================
     SKILLS:chips 弹性 pop
     ============================================================ */
  const chips = document.querySelectorAll('#skills .chip');
  if (chips.length) {
    if (reduceMotion) {
      gsap.set(chips, { opacity: 1, scale: 1 });
    } else {
      gsap.from(chips, {
        opacity: 0, scale: 0.6, y: 20, duration: 0.6, stagger: 0.1,
        ease: 'back.out(2.4)',
        scrollTrigger: { trigger: '#skills .chips', start: 'top 82%' },
      });
    }
  }

  /* ============================================================
     CONTACT:标题扫光 + 缩放
     ============================================================ */
  const contactTitle = document.querySelector('#contact .section-title');
  if (!reduceMotion && contactTitle) {
    gsap.fromTo(contactTitle, { scale: 0.9, opacity: 0 }, {
      scale: 1, opacity: 1, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: '#contact', start: 'top 75%' },
    });
  }

  window.__sceneReady = true;
  console.log('[bg] gradient + scroll choreography ready');
})();
