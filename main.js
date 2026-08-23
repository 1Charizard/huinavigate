/* ============================================================
   huinavigate — UI logic
   光标 / 磁吸 / ripple / 3D tilt / i18n / 骨架屏 / 开场
   ============================================================ */
(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- 开场:拆分 hero 标题为逐字 ---------- */
  const heroTitle = document.getElementById('heroTitle');
  if (heroTitle) {
    const text = heroTitle.textContent.trim();
    const chars = text.split('').map((ch, i) => {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = ch;
      span.style.transitionDelay = `${0.35 + i * 0.045}s`;
      return span;
    });
    heroTitle.textContent = '';
    chars.forEach(c => heroTitle.appendChild(c));
  }

  /* ---------- 加载幕布 ---------- */
  const curtain = document.getElementById('curtain');
  const content = document.getElementById('content');
  const ready = () => {
    curtain.classList.add('done');
    content.classList.add('entered');
    document.body.classList.add('ready');
  };
  if (reduceMotion) {
    ready();
  } else {
    window.addEventListener('load', () => setTimeout(ready, 300));
  }

  /* ---------- 骨架屏生命周期(作品卡片) ---------- */
  const cards = document.querySelectorAll('.card');
  const revealCards = () => {
    cards.forEach((card, i) => {
      setTimeout(() => {
        card.classList.remove('is-loading');
        card.classList.add('is-ready');
      }, 250 + i * 160);
    });
  };
  if (reduceMotion) {
    cards.forEach(c => { c.classList.remove('is-loading'); c.classList.add('is-ready'); });
  } else {
    window.addEventListener('load', () => setTimeout(revealCards, 500));
  }

  /* ---------- 导航滚动状态 ---------- */
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 滚动渐入(兜底,GSAP 编舞之上) ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-in'));
  }

  /* ============================================================
     自定义光标 + ripple + 磁吸 + 卡片 tilt(仅桌面)
     ============================================================ */
  const cursorDot = document.getElementById('cursorDot');
  const cursorRing = document.getElementById('cursorRing');
  const interactive = 'a, button, .card, .chip';

  if (finePointer && !reduceMotion) {
    document.body.classList.add('js-cursor');

    let mx = innerWidth / 2, my = innerHeight / 2;
    let rx = mx, ry = my;
    let raf = null;

    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      cursorDot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      cursorRing.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener('pointermove', e => {
      mx = e.clientX; my = e.clientY;
    }, { passive: true });

    document.addEventListener('pointerover', e => {
      if (e.target.closest(interactive)) cursorRing.classList.add('is-hover');
      else cursorRing.classList.remove('is-hover');
    });
    document.addEventListener('pointerdown', () => cursorRing.classList.add('is-down'));
    document.addEventListener('pointerup', () => cursorRing.classList.remove('is-down'));

    /* 点击 ripple */
    document.addEventListener('click', e => {
      const target = e.target.closest(interactive);
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.4;
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      ripple.style.width = ripple.style.height = `${size}px`;
      document.body.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });

    /* 磁吸(排除卡片/按钮,避免与 tilt/hover 缩放争用 transform) */
    document.querySelectorAll('[data-magnetic]:not(.card):not(.btn)').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * 0.16}px, ${dy * 0.16}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });

    /* 卡片 3D tilt */
    cards.forEach(card => {
      card.addEventListener('pointermove', e => {
        if (card.classList.contains('is-loading')) return;
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          `perspective(900px) rotateX(${-py * 8}deg) rotateY(${px * 10}deg) translateY(-4px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });

    window.addEventListener('beforeunload', () => { if (raf) cancelAnimationFrame(raf); });
  } else {
    cursorDot.remove();
    cursorRing.remove();
  }

  /* ============================================================
     i18n(zh / en)
     ============================================================ */
  const I18N = {
    zh: {
      'nav.about': '关于', 'nav.works': '作品', 'nav.skills': '技能', 'nav.contact': '联系',
      'hero.sub': '探索、构建、创造。',
      'hero.learn': '了解更多', 'hero.cta': '开始探索',
      'about.title': '把好奇心，变成作品。',
      'about.sub': '我是一名创造者，相信设计与工程结合，能把想法打磨成可用的作品。',
      'about.learn': '了解更多',
      'works.eyebrow': '作品', 'works.title': '正在创造的东西。',
      'works.c1t': 'huinavigate', 'works.c1d': '个人主页 —— 探索设计与交互的边界。', 'works.c1l': '查看项目',
      'works.c2t': '下一个项目', 'works.c2d': '正在酝酿中 —— 敬请期待。', 'works.c2l': '关注更新',
      'skills.title': '我的工具箱。',
      'skills.s1': '前端开发', 'skills.s2': 'UI/UX 设计', 'skills.s3': 'Node.js', 'skills.s4': '创意编程',
      'contact.title': '一起创造点什么？',
      'contact.sub': '无论是合作、交流还是闲聊，欢迎随时找我。',
      'contact.email': '发邮件',
      'footer.nav': '导航', 'footer.links': '链接', 'footer.email': '邮箱',
    },
    en: {
      'nav.about': 'About', 'nav.works': 'Works', 'nav.skills': 'Skills', 'nav.contact': 'Contact',
      'hero.sub': 'Explore. Build. Create.',
      'hero.learn': 'Learn more', 'hero.cta': 'Start Exploring',
      'about.title': 'Turn curiosity into creations.',
      'about.sub': 'I\'m a creator who believes design and engineering together can polish ideas into working products.',
      'about.learn': 'Learn more',
      'works.eyebrow': 'Works', 'works.title': 'Things I\'m building.',
      'works.c1t': 'huinavigate', 'works.c1d': 'Personal homepage — exploring the edge of design and interaction.', 'works.c1l': 'View project',
      'works.c2t': 'Next Project', 'works.c2d': 'Brewing — stay tuned.', 'works.c2l': 'Follow updates',
      'skills.title': 'My toolbox.',
      'skills.s1': 'Frontend', 'skills.s2': 'UI/UX Design', 'skills.s3': 'Node.js', 'skills.s4': 'Creative Coding',
      'contact.title': 'Let\'s build something together?',
      'contact.sub': 'Whether it\'s collaboration, ideas, or just a chat — I\'m always open.',
      'contact.email': 'Email me',
      'footer.nav': 'Navigation', 'footer.links': 'Links', 'footer.email': 'Email',
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
      const text = I18N[l] && I18N[l][key];
      if (!text) return;
      const arrow = el.querySelector('.arrow');
      if (arrow) {
        const clone = arrow.cloneNode(true);
        el.textContent = text;
        el.appendChild(clone);
      } else {
        el.textContent = text;
      }
    });
  }
  langBtn.addEventListener('click', () => applyLang(lang === 'zh' ? 'en' : 'zh'));

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
