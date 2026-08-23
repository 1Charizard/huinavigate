/* ============================================================
   huinavigate — UI logic
   像素开场 / 光标 / 磁吸 / ripple / 3D tilt / i18n / 骨架屏
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
      span.style.transitionDelay = `${0.3 + i * 0.045}s`;
      return span;
    });
    heroTitle.textContent = '';
    chars.forEach(c => heroTitle.appendChild(c));
  }

  /* ============================================================
     像素开场(直接开场:无幕布)
     ============================================================ */
  const intro = document.getElementById('intro');
  let introDone = false;

  const finishIntro = () => {
    if (introDone) return;
    introDone = true;
    document.body.classList.add('ready');
    document.body.classList.remove('intro-active');
    root.classList.remove('intro-lock');
    if (intro) {
      intro.classList.add('done');
      setTimeout(() => intro && intro.remove(), 800);
    }
  };

  const startIntro = () => {
    if (!intro) { finishIntro(); return; }
    root.classList.add('intro-lock');
    document.body.classList.add('intro-active');
    applyLang(lang); // 同步序幕内克隆文案

    if (reduceMotion) { finishIntro(); return; }

    // 序幕品牌停留 1.3s 后触发像素揭幕
    setTimeout(() => {
      if (typeof window.PixelSwap !== 'function') { finishIntro(); return; }
      window.PixelSwap(intro, {
        to: 1,
        pattern: 'center',
        pixelSize: 64,
        gap: 6,
        radius: 16,
        spin: 120,
        scale: 0.3,
        fade: true,
        duration: 2800,
        pixelDuration: 540,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        onComplete: finishIntro
      });
    }, 1300);
  };

  /* ---------- 开场启动:移到 IIFE 末尾执行(确保 i18n 已初始化) ---------- */
  const bootIntro = () => {
    if (document.readyState === 'complete') {
      startIntro();
    } else {
      let started = false;
      const go = () => { if (!started) { started = true; startIntro(); } };
      window.addEventListener('load', go);
      setTimeout(go, 2000);
    }
  };
  let _boot = bootIntro; // 占位,实际在文件末尾调用
  void _boot;

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
    window.addEventListener('load', () => setTimeout(revealCards, 900));
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
     PixelSwap 展示区 mockup hover 切换
     ============================================================ */
  const mockup = document.getElementById('mockup');
  if (mockup && window.PixelSwap && !reduceMotion) {
    let busy = false;
    const swapTo = (to, pattern, easing) => {
      if (busy) return;
      busy = true;
      window.PixelSwap(mockup, {
        to,
        pattern,
        pixelSize: 40,
        gap: 4,
        radius: 12,
        spin: 90,
        scale: 0.3,
        fade: true,
        duration: 900,
        pixelDuration: 320,
        easing,
        onComplete: () => { busy = false; }
      });
    };
    mockup.addEventListener('pointerenter', () => swapTo(1, 'left-to-right', 'cubic-bezier(0.22, 1, 0.36, 1)'));
    mockup.addEventListener('pointerleave', () => swapTo(0, 'right-to-left', 'cubic-bezier(0.22, 1, 0.36, 1)'));
    mockup.addEventListener('click', () => {
      if (mockup.querySelector('.ps-layer[data-visible="true"]') === mockup.children[0]) {
        swapTo(1, 'center', 'cubic-bezier(0.22, 1, 0.36, 1)');
      } else {
        swapTo(0, 'center', 'cubic-bezier(0.22, 1, 0.36, 1)');
      }
    });
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
    if (cursorDot) cursorDot.remove();
    if (cursorRing) cursorRing.remove();
  }

  /* ============================================================
     i18n(zh / en)
     ============================================================ */
  const I18N = {
    zh: {
      'nav.about': '关于', 'nav.works': '作品', 'nav.showcase': '介绍',
      'nav.skills': '技能', 'nav.contact': '联系',
      'hero.sub': '探索、构建、创造。',
      'hero.learn': '了解更多', 'hero.cta': '开始探索',
      'about.title': '把好奇心，变成作品。',
      'about.sub': '我是一名创造者，相信设计与工程结合，能把想法打磨成可用的作品。',
      'about.learn': '了解更多',
      'works.title': '正在创造的东西。',
      'works.c1t': 'huinavigate', 'works.c1d': '个人主页 —— 探索设计与交互的边界。', 'works.c1l': '查看项目',
      'works.c2t': '下一个项目', 'works.c2d': '正在酝酿中 —— 敬请期待。', 'works.c2l': '关注更新',
      'showcase.title': '这个主页本身就是作品。',
      'showcase.d1t': '像素马赛克开场',
      'showcase.d1d': '加载完成即触发 PixelSwap 中心扩散揭幕，每一像素都是一扇通往内容的窗口。',
      'showcase.d2t': '3D 粒子背景',
      'showcase.d2d': '轻量 Three.js 粒子层，随光标与滚动响应，移动端自动降级。',
      'showcase.d3t': '骨架屏加载',
      'showcase.d3d': '内容就绪前以形状匹配的骨架占位，绝不白屏。',
      'showcase.d4t': '中英双语',
      'showcase.d4d': '一键切换语言，苹果式 SF Pro 排版与粉嫩金色系统。',
      'showcase.cta': '访问项目', 'showcase.hint': '悬停查看像素切换',
      'skills.title': '我的工具箱。',
      'skills.s1': '前端开发', 'skills.s2': 'UI/UX 设计', 'skills.s3': 'Node.js', 'skills.s4': '创意编程',
      'contact.title': '一起创造点什么？',
      'contact.sub': '无论是合作、交流还是闲聊，欢迎随时找我。',
      'contact.email': '发邮件',
      'footer.nav': '导航', 'footer.links': '链接', 'footer.email': '邮箱',
    },
    en: {
      'nav.about': 'About', 'nav.works': 'Works', 'nav.showcase': 'Showcase',
      'nav.skills': 'Skills', 'nav.contact': 'Contact',
      'hero.sub': 'Explore. Build. Create.',
      'hero.learn': 'Learn more', 'hero.cta': 'Start Exploring',
      'about.title': 'Turn curiosity into creations.',
      'about.sub': 'I\'m a creator who believes design and engineering together can polish ideas into working products.',
      'about.learn': 'Learn more',
      'works.title': 'Things I\'m building.',
      'works.c1t': 'huinavigate', 'works.c1d': 'Personal homepage — exploring the edge of design and interaction.', 'works.c1l': 'View project',
      'works.c2t': 'Next Project', 'works.c2d': 'Brewing — stay tuned.', 'works.c2l': 'Follow updates',
      'showcase.title': 'This homepage is the product.',
      'showcase.d1t': 'Pixel-mosaic opening',
      'showcase.d1d': 'A PixelSwap center-burst reveal plays the moment the page finishes loading — every pixel is a window into the content.',
      'showcase.d2t': '3D particle background',
      'showcase.d2d': 'A lightweight Three.js particle layer responds to cursor and scroll, with automatic downgrade on mobile.',
      'showcase.d3t': 'Skeleton loading',
      'showcase.d3d': 'Shape-matched skeleton placeholders keep the page from ever feeling blank.',
      'showcase.d4t': 'Bilingual',
      'showcase.d4d': 'One-click language toggle with Apple-style SF Pro typography and a pink-gold system.',
      'showcase.cta': 'Visit project', 'showcase.hint': 'Hover to pixel-swap',
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
    if (langBtn) langBtn.textContent = l === 'zh' ? 'EN' : '中';
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
  if (langBtn) langBtn.addEventListener('click', () => applyLang(lang === 'zh' ? 'en' : 'zh'));

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 真正启动开场(i18n 与 DOM 均已就绪) ---------- */
  bootIntro();
})();
