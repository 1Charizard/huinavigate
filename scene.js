/* ============================================================
   huinavigate — 滚动编舞
   纯色背景(粉白 #fdf3f5),滚动动效全部基于 GSAP ScrollTrigger
   ============================================================ */
(() => {
  'use strict';
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) {
    console.warn('[bg] GSAP not loaded — static page.');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     HERO:标题视差 + 滚动渐隐
     ============================================================ */
  const heroTitle = document.querySelector('#hero .hero-title');
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
     WORKS:由 CardSwap 组件自管理(GSAP 堆叠轮换)
     ============================================================ */

  /* ============================================================
     SHOWCASE:mockup 入场 + 特性列表交错
     ============================================================ */
  const showcaseMedia = document.querySelector('.showcase-media');
  if (!reduceMotion && showcaseMedia) {
    gsap.from(showcaseMedia, {
      x: -50, opacity: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: '#showcase', start: 'top 80%' },
    });
  }
  const feats = document.querySelectorAll('#showcase .feat');
  if (feats.length) {
    if (reduceMotion) {
      gsap.set(feats, { opacity: 1, x: 0 });
    } else {
      gsap.from(feats, {
        x: 40, opacity: 0, duration: 0.7, stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: '#showcase .feats', start: 'top 82%' },
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
  console.log('[bg] scroll choreography ready');
})();
