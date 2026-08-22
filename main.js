/* ============================================================
   huinavigate — UI logic (loading progress, i18n, nav)
   Plain script: runs in every browser even without ESM.
   ============================================================ */
(() => {
  'use strict';

  /* ---------- 3D scene readiness (graceful fallback) ---------- */
  // scene.js is a plain script; if it failed (no GSAP), show static gradient
  (function checkScene() {
    if (window.__sceneReady) return;
    if (window.__sceneFailed) return;
    setTimeout(() => {
      // gradient bg works via CSS defaults even without scene.js
      console.warn('[ui] scene.js not ready — CSS gradient background remains.');
    }, 2500);
  })();

  /* ---------- Loading curtain with progress ---------- */
  const curtain = document.getElementById('curtain');
  const pctEl = document.getElementById('curtainPct');
  const content = document.getElementById('content');

  let pct = 0;
  const timer = setInterval(() => {
    pct = Math.min(pct + Math.random() * 18 + 10, 100);
    pctEl.textContent = Math.round(pct) + '%';
    if (pct >= 100) {
      clearInterval(timer);
      // small delay so the user sees 100%, then lift the curtain
      setTimeout(() => {
        curtain.classList.add('done');
        content.classList.add('entered');
        document.body.classList.add('ready');
      }, 350);
    }
  }, 100);

  /* ---------- Nav scrolled state ---------- */
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- i18n (zh / en) ---------- */
  const I18N = {
    zh: {
      'nav.home': '首页', 'nav.explore': '探索', 'nav.works': '作品', 'nav.skills': '技能', 'nav.contact': '联系',
      'hero.eyebrow': '你好,世界 👋',
      'hero.line1': '我 探 索', 'hero.line2': '我 构 建', 'hero.line3': '我 创 造',
      'hero.sub': '1Charizard · 用代码把想象变成现实',
      'hero.cta': '开始探索',
      'ch2.tag': '01 · 探索', 'ch2.title': '好奇心驱动的旅程',
      'ch2.desc': '对新技术永远保持好奇,喜欢拆解复杂问题,从零开始理解事物的运作方式。',
      'ch3.tag': '02 · 作品', 'ch3.title': '正在创造的东西',
      'ch3.desc': '每一个项目都是一次探索 —— 设计与工程的边界,代码与艺术的交汇。',
      'ch4.tag': '03 · 技能', 'ch4.title': '我的工具箱',
      'skills.s1': '前端开发', 'skills.s2': 'UI/UX 设计', 'skills.s3': 'Node.js', 'skills.s4': '创意编程',
      'ch5.tag': '04 · 联系', 'ch5.title': '一起创造点什么?',
      'ch5.desc': '无论是合作、交流还是闲聊,欢迎随时找我。',
      'ch5.email': '发邮件',
    },
    en: {
      'nav.home': 'Home', 'nav.explore': 'Explore', 'nav.works': 'Works', 'nav.skills': 'Skills', 'nav.contact': 'Contact',
      'hero.eyebrow': 'Hello, World 👋',
      'hero.line1': 'I Explore', 'hero.line2': 'I Build', 'hero.line3': 'I Create',
      'hero.sub': '1Charizard · Turning imagination into reality with code',
      'hero.cta': 'Start Exploring',
      'ch2.tag': '01 · Explore', 'ch2.title': 'A journey driven by curiosity',
      'ch2.desc': 'Always curious about new tech, deconstructing complex problems to understand how things work from the ground up.',
      'ch3.tag': '02 · Works', 'ch3.title': 'Things I\'m building',
      'ch3.desc': 'Every project is an exploration — where design meets engineering, and code meets art.',
      'ch4.tag': '03 · Skills', 'ch4.title': 'My toolbox',
      'skills.s1': 'Frontend', 'skills.s2': 'UI/UX Design', 'skills.s3': 'Node.js', 'skills.s4': 'Creative Coding',
      'ch5.tag': '04 · Contact', 'ch5.title': 'Let\'s build something together?',
      'ch5.desc': 'Whether it\'s collaboration, ideas, or just a chat — I\'m always open.',
      'ch5.email': 'Email me',
    }
  };

  let lang = 'zh';
  const langBtn = document.getElementById('langToggle');

  function applyLang(l) {
    lang = l;
    document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en';
    langBtn.textContent = l === 'zh' ? 'EN' : '中';
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (I18N[l] && I18N[l][key]) el.textContent = I18N[l][key];
    });
  }
  langBtn.addEventListener('click', () => applyLang(lang === 'zh' ? 'en' : 'zh'));

  /* ---------- Footer year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
