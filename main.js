/* ============================================================
   huinavigate — main.js
   ============================================================ */
(() => {
  'use strict';

  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------
     1. Load sequence: curtain -> skeleton -> content reveal
     ---------------------------------------------------------- */
  const curtain = document.getElementById('curtain');
  const skeleton = document.getElementById('skeleton');
  const site = document.getElementById('site');

  // Hide skeleton once "content" is ready (simulated load, then reveal)
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      skeleton.classList.add('hide');
      curtain.classList.add('done'); // curtain already animates via CSS
      site.classList.add('entered');
      // Force hero entrance animations to restart by re-adding class
      document.querySelectorAll('.t-word').forEach((w, i) => {
        w.style.animationDelay = `${i * 0.12 + 0.15}s`;
      });
      document.querySelectorAll('.reveal-stagger').forEach((el, i) => {
        el.style.transitionDelay = `${i * 0.12 + 0.5}s`;
        el.classList.add('visible');
      });
    }, 1400);
  });

  /* ----------------------------------------------------------
     2. Nav: scroll state + mobile burger
     ---------------------------------------------------------- */
  const nav = document.getElementById('nav');
  const burger = document.getElementById('navBurger');
  const navLinks = document.getElementById('navLinks');

  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    burger.classList.remove('open');
    navLinks.classList.remove('open');
  }));

  /* ----------------------------------------------------------
     3. Reveal on scroll (IntersectionObserver)
     ---------------------------------------------------------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ----------------------------------------------------------
     4. Skill bars + counters (trigger on visible)
     ---------------------------------------------------------- */
  const skillObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const bar = e.target.querySelector('.skill-bar i');
      const num = e.target.querySelector('.skill-num');
      const target = +num.dataset.count;
      if (bar) bar.style.width = (num.dataset.w || target) + '%';
      if (num) {
        const start = performance.now();
        const dur = 1400;
        const tick = now => {
          const p = Math.min((now - start) / dur, 1);
          num.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
      skillObserver.unobserve(e.target);
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('.skill').forEach(el => skillObserver.observe(el));

  /* ----------------------------------------------------------
     5. 3D tilt on project cards
     ---------------------------------------------------------- */
  if (!isReduced && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      const MAX = 10;
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          `perspective(900px) rotateY(${x * MAX}deg) rotateX(${-y * MAX}deg) translateY(-6px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(900px) rotateY(0) rotateX(0)';
      });
    });
  }

  /* ----------------------------------------------------------
     6. Mouse parallax glow (hero + aurora)
     ---------------------------------------------------------- */
  const aurora = document.querySelector('.bg-aurora');
  if (!isReduced) {
    let tx = 0, ty = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', e => {
      tx = (e.clientX / window.innerWidth - 0.5) * 30;
      ty = (e.clientY / window.innerHeight - 0.5) * 30;
    }, { passive: true });
    (function loop() {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      if (aurora) aurora.style.transform = `translate3d(${cx}px, ${cy}px, 0) scale(1.05)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ----------------------------------------------------------
     7. Canvas particle background
     ---------------------------------------------------------- */
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  const COLORS = ['0,113,227', '88,86,214', '255,45,85'];
  const COUNT = () => Math.min(90, Math.floor((W * H) / 16000));

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    init();
  }
  function init() {
    particles = Array.from({ length: COUNT() }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.8 + 0.6,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      c: COLORS[(Math.random() * COLORS.length) | 0],
      a: Math.random() * 0.5 + 0.15,
    }));
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.c},${p.a})`;
      ctx.fill();
    }
    // link nearby particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = dx * dx + dy * dy;
        if (d < 120 * 120) {
          const alpha = 0.08 * (1 - Math.sqrt(d) / 120);
          ctx.strokeStyle = `rgba(120,130,255,${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });
  if (!isReduced) draw(); else { ctx.clearRect(0, 0, W, H); }

  /* ----------------------------------------------------------
     8. i18n (zh/en)
     ---------------------------------------------------------- */
  const I18N = {
    zh: {
      'nav.about': '关于', 'nav.projects': '项目', 'nav.skills': '技能', 'nav.contact': '联系',
      'hero.eyebrow': '你好,世界 👋',
      'hero.line1': '我 探 索', 'hero.line2': '我 构 建', 'hero.line3': '我 创 造',
      'hero.sub': '1Charizard · 用代码把想象变成现实',
      'hero.cta': '查看我的作品', 'hero.cta2': '联系我',
      'about.tag': '关于我', 'about.title': '把好奇心,变成作品。',
      'about.c1t': '探索者', 'about.c1d': '对新技术永远保持好奇,喜欢拆解复杂问题,从零开始理解事物的运作方式。',
      'about.c2t': '构建者', 'about.c2d': '相信好的产品源于细节,用设计与工程结合的方式,把想法打磨成可用的作品。',
      'about.c3t': '创造者', 'about.c3d': '不设限,不将就。每次迭代都让作品离「理想」更近一步,持续创造价值。',
      'projects.tag': '精选项目', 'projects.title': '正在创造的东西',
      'projects.p1t': 'huinavigate', 'projects.p1d': '个人主页 —— 一个充满动态与视觉冲击的展示空间,探索设计与交互的边界。',
      'projects.p2t': '即将上线', 'projects.p2d': '下一个项目正在酝酿中 —— 敬请期待。',
      'projects.p3t': '灵感仓库', 'projects.p3d': '收集日常灵感与实验性代码,让每一个念头都有处安放。',
      'skills.tag': '技能', 'skills.title': '我的工具箱',
      'skills.s1': '前端开发', 'skills.s2': 'UI/UX 设计', 'skills.s3': 'Node.js', 'skills.s4': '创意编程',
      'contact.tag': '联系', 'contact.title': '一起创造点什么?',
      'contact.sub': '无论是合作、交流还是闲聊,欢迎随时找我。',
      'contact.email': '发邮件', 'contact.resume': '我的简历',
    },
    en: {
      'nav.about': 'About', 'nav.projects': 'Projects', 'nav.skills': 'Skills', 'nav.contact': 'Contact',
      'hero.eyebrow': 'Hello, World 👋',
      'hero.line1': 'I Explore', 'hero.line2': 'I Build', 'hero.line3': 'I Create',
      'hero.sub': '1Charizard · Turning imagination into reality with code',
      'hero.cta': 'View My Work', 'hero.cta2': 'Get in Touch',
      'about.tag': 'About', 'about.title': 'Turn curiosity into creations.',
      'about.c1t': 'Explorer', 'about.c1d': 'Always curious about new tech, loves deconstructing complex problems and understanding how things work from the ground up.',
      'about.c2t': 'Builder', 'about.c2d': 'Believes great products come from details — blending design and engineering to polish ideas into working creations.',
      'about.c3t': 'Creator', 'about.c3d': 'No limits, no shortcuts. Every iteration brings the work closer to ideal, creating lasting value.',
      'projects.tag': 'Featured Projects', 'projects.title': 'Things I\'m building',
      'projects.p1t': 'huinavigate', 'projects.p1d': 'Personal homepage — a dynamic, visually striking space exploring the boundaries of design and interaction.',
      'projects.p2t': 'Coming Soon', 'projects.p2d': 'The next project is brewing — stay tuned.',
      'projects.p3t': 'Idea Lab', 'projects.p3d': 'Collecting daily inspiration and experimental code — every idea deserves a home.',
      'skills.tag': 'Skills', 'skills.title': 'My toolbox',
      'skills.s1': 'Frontend', 'skills.s2': 'UI/UX Design', 'skills.s3': 'Node.js', 'skills.s4': 'Creative Coding',
      'contact.tag': 'Contact', 'contact.title': 'Let\'s build something together?',
      'contact.sub': 'Whether it\'s collaboration, ideas, or just a chat — I\'m always open.',
      'contact.email': 'Email me', 'contact.resume': 'My Résumé',
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

  /* ----------------------------------------------------------
     9. Footer year
     ---------------------------------------------------------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
