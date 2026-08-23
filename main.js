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

    // 深色品牌底停留片刻后,Scroll Expand 式粉金媒体窗口从中心展开揭幕
    setTimeout(() => {
      if (typeof window.ScrollExpandOpening !== 'function') { finishIntro(); return; }
      const dict = I18N[lang] || I18N.zh;
      window.ScrollExpandOpening(intro, {
        brand: 'huinavigate',
        tag: dict['hero.sub'],
        hold: 900,
        expand: 1500,
        onComplete: finishIntro
      });
    }, 300);
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

  /* ---------- 骨架屏生命周期(works 卡片堆叠) ---------- */
  const worksSkeleton = document.getElementById('worksSkeleton');
  const revealWorks = () => {
    if (worksSkeleton) worksSkeleton.classList.add('hidden');
  };
  if (reduceMotion) {
    revealWorks();
  } else {
    window.addEventListener('load', () => setTimeout(revealWorks, 800));
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

    /* 卡片 3D tilt 已由 CardSwap(GSAP) 接管,不再单独 tilt */

    window.addEventListener('beforeunload', () => { if (raf) cancelAnimationFrame(raf); });
  } else {
    if (cursorDot) cursorDot.remove();
    if (cursorRing) cursorRing.remove();
  }

  /* ============================================================
     集成组件(Border Glow / CardSwap / ScrollExpand / Line Sidebar / ClickSpark)
     ============================================================ */

  /* ---------- Border Glow(锥形描边辉光,随指针) ---------- */
  if (!reduceMotion) {
    document.querySelectorAll('[data-glow]').forEach(card => {
      const onGlowMove = e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2, cy = rect.height / 2;
        const dx = Math.abs(x - cx), dy = Math.abs(y - cy);
        let kx = Infinity, ky = Infinity;
        if (dx !== 0) kx = cx / dx;
        if (dy !== 0) ky = cy / dy;
        const edge = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
        let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        if (angle < 0) angle += 360;
        card.style.setProperty('--edge-proximity', `${(edge * 100).toFixed(2)}`);
        card.style.setProperty('--cursor-angle', `${angle.toFixed(2)}deg`);
      };
      const onGlowLeave = () => card.style.setProperty('--edge-proximity', '0');
      card.addEventListener('pointermove', onGlowMove);
      card.addEventListener('pointerleave', onGlowLeave);
    });
  }

  /* ---------- Card Swap(GSAP 弹性落牌轮换) ---------- */
  const worksSwap = document.getElementById('worksSwap');
  if (worksSwap && window.gsap && !reduceMotion) {
    const swapCards = [...worksSwap.querySelectorAll('.swap-card')];
    const distX = 66, distY = 58;
    const slots = swapCards.map((_, i) => ({ x: i * distX, y: -i * distY, zIndex: swapCards.length - i }));
    const place = (el, slot) => {
      gsap.set(el, { x: slot.x, y: slot.y, z: -slot.x * 1.5, xPercent: -50, yPercent: -50, zIndex: slot.zIndex, force3D: true });
    };
    let order = swapCards.map((_, i) => i);
    swapCards.forEach((el, i) => place(el, slots[i]));

    let swapTimer = 0;
    let paused = false;
    const swap = () => {
      if (paused || order.length < 2) return;
      const [front, ...rest] = order;
      const elFront = swapCards[front];
      const tl = gsap.timeline();
      tl.to(elFront, { y: '+=430', duration: 1.1, ease: 'elastic.out(0.6,0.4)' });
      rest.forEach((idx, i) => {
        const slot = slots[i];
        tl.set(swapCards[idx], { zIndex: slot.zIndex }, '-=0.5');
        tl.to(swapCards[idx], { x: slot.x, y: slot.y, z: -slot.x * 1.5, duration: 0.9, ease: 'power2.inOut' }, '-=0.5');
      });
      const backSlot = slots[swapCards.length - 1];
      tl.call(() => gsap.set(elFront, { zIndex: backSlot.zIndex }), undefined, '-=0.3');
      tl.to(elFront, { x: backSlot.x, y: backSlot.y, z: -backSlot.x * 1.5, duration: 0.9, ease: 'elastic.out(0.6,0.4)' }, '-=0.4');
      tl.call(() => { order = [...rest, front]; });
    };
    setTimeout(() => { swap(); swapTimer = setInterval(swap, 4600); }, 1100);
    worksSwap.addEventListener('pointerenter', () => { paused = true; });
    worksSwap.addEventListener('pointerleave', () => { paused = false; });
  } else if (worksSwap && window.gsap) {
    // reduce-motion: 静态叠放,展示第一张
    const c0 = worksSwap.querySelector('.swap-card');
    if (c0) gsap.set(c0, { xPercent: -50, yPercent: -50 });
  }

  /* ---------- Scroll Expand(窗口滚动驱动画面展开) ---------- */
  const seEl = document.querySelector('[data-scroll-expand]');
  if (seEl) {
    const seTrack = seEl.querySelector('.scroll-expand__track');
    const seFrame = seEl.querySelector('.scroll-expand__frame');
    const seMedia = seEl.querySelector('.scroll-expand__media');
    const seScrim = seEl.querySelector('.scroll-expand__scrim');
    const seTitle = seEl.querySelector('.scroll-expand__title');
    const seHint = seEl.querySelector('.scroll-expand__hint');
    const seOverlay = seEl.querySelector('.scroll-expand__overlay');
    const DIST = 1.1, HOLD = 0.3;
    let stageH = 0, stageW = 0;
    let winInsetTop = 0, winInsetSide = 0;

    const measureSe = () => {
      stageH = window.innerHeight;
      stageW = window.innerWidth;
      seTrack.style.height = `${stageH * (1 + DIST + HOLD)}px`;
      /* 像素级"视频窗口":宽 min(680px, 78vw),按 1.6:1 高,再受 42vh 限制。
         任何分辨率都保持 1.6:1 比例,PC 宽屏不再被百分比裁剪压成扁条 */
      const RATIO = 1.6;
      let winW = Math.min(680, stageW * 0.78);
      let winH = winW / RATIO;
      if (winH > stageH * 0.42) {
        winH = stageH * 0.42;
        winW = winH * RATIO;
      }
      winInsetTop = (stageH - winH) / 2;
      winInsetSide = (stageW - winW) / 2;
    };
    const smooth = t => t * t * (3 - 2 * t);
    const applySe = p => {
      const e = Math.min(Math.max(p, 0), 1);
      const s = smooth(e);
      const it = winInsetTop * (1 - s);
      const is = winInsetSide * (1 - s);
      seFrame.style.clipPath = `inset(${it}px ${is}px ${it}px ${is}px round ${24 * (1 - s)}px)`;
      seMedia.style.transform = `scale(${1.35 - 0.35 * s})`;
      seScrim.style.opacity = `${0.45 * s}`;
      seTitle.style.opacity = `${1 - smooth(Math.min(e / 0.5, 1))}`;
      seTitle.style.transform = `translateY(${-40 * s}px) scale(${1 + 0.06 * s})`;
      seHint.style.opacity = `${1 - Math.min(e / 0.12, 1)}`;
      seOverlay.style.opacity = `${smooth(Math.max(0, (e - 0.55) / 0.45))}`;
      seOverlay.style.transform = `translateY(${20 * (1 - smooth(Math.max(0, (e - 0.55) / 0.45)))}px)`;
    };
    const readSe = () => {
      const top = seTrack.getBoundingClientRect().top;
      const span = stageH * DIST;
      return -top / span;
    };
    const onSeScroll = () => applySe(readSe());
    measureSe();
    applySe(readSe());
    window.addEventListener('scroll', onSeScroll, { passive: true });
    window.addEventListener('resize', () => { measureSe(); onSeScroll(); });
  }

  /* ---------- Line Sidebar(章节导航 + 指针平滑 + 滚动高亮) ---------- */
  const sideNav = document.getElementById('sideNav');
  if (sideNav) {
    const sideItems = [...sideNav.querySelectorAll('li')];
    const lsTargets = sideItems.map(() => 0);
    const lsCurrents = sideItems.map(() => 0);
    let lsLast = performance.now();
    let lsRaf = 0;
    const lsRun = now => {
      const dt = Math.min((now - lsLast) / 1000, 0.05);
      lsLast = now;
      const k = 1 - Math.exp(-dt / 0.09);
      let moving = false;
      sideItems.forEach((el, i) => {
        const next = lsCurrents[i] + (lsTargets[i] - lsCurrents[i]) * k;
        const settled = Math.abs(lsTargets[i] - next) < 0.002;
        lsCurrents[i] = settled ? lsTargets[i] : next;
        el.style.setProperty('--effect', lsCurrents[i].toFixed(4));
        if (!settled) moving = true;
      });
      lsRaf = moving ? requestAnimationFrame(lsRun) : 0;
    };
    const lsKick = () => { if (!lsRaf) { lsLast = performance.now(); lsRaf = requestAnimationFrame(lsRun); } };

    sideNav.addEventListener('pointermove', e => {
      const rect = sideNav.getBoundingClientRect();
      const py = e.clientY - rect.top;
      sideItems.forEach((el, i) => {
        const center = el.offsetTop + el.offsetHeight / 2;
        const d = Math.abs(py - center);
        const t = Math.max(0, 1 - d / 70);
        lsTargets[i] = t * t * (3 - 2 * t);
      });
      lsKick();
    });
    sideNav.addEventListener('pointerleave', () => {
      lsTargets.forEach((_, i) => { lsTargets[i] = 0; });
      lsKick();
    });

    // 滚动高亮当前章节
    const seTargets = sideItems.map(li => document.getElementById(li.dataset.sec));
    const onSideScroll = () => {
      let active = 0;
      seTargets.forEach((sec, i) => {
        if (sec && sec.getBoundingClientRect().top < window.innerHeight * 0.45) active = i;
      });
      sideItems.forEach((el, i) => el.classList.toggle('active', i === active));
    };
    window.addEventListener('scroll', onSideScroll, { passive: true });
    onSideScroll();

    sideItems.forEach(li => {
      li.addEventListener('click', () => {
        const sec = document.getElementById(li.dataset.sec);
        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  /* ---------- Click Spark(全页点击火花) ---------- */
  if (!reduceMotion) {
    const sparkCanvas = document.createElement('canvas');
    sparkCanvas.id = 'sparkCanvas';
    document.body.appendChild(sparkCanvas);
    const sctx = sparkCanvas.getContext('2d');
    const SCOLORS = ['#d4a017', '#f0c75e', '#e0b8c8'];
    let sparks = [];
    let sRaf = 0;
    const sResize = () => {
      sparkCanvas.width = innerWidth;
      sparkCanvas.height = innerHeight;
    };
    sResize();
    window.addEventListener('resize', sResize);
    const easeOutS = t => 1 - Math.pow(1 - t, 3);
    const sDraw = ts => {
      sctx.clearRect(0, 0, sparkCanvas.width, sparkCanvas.height);
      sparks = sparks.filter(s => ts - s.start < s.duration);
      sparks.forEach(s => {
        const p = (ts - s.start) / s.duration;
        const e = easeOutS(p);
        const dist = e * s.radius;
        const len = s.size * (1 - e);
        sctx.strokeStyle = s.color;
        sctx.lineWidth = 2;
        sctx.globalAlpha = 1 - p;
        sctx.beginPath();
        sctx.moveTo(s.x + dist * Math.cos(s.angle), s.y + dist * Math.sin(s.angle));
        sctx.lineTo(s.x + (dist + len) * Math.cos(s.angle), s.y + (dist + len) * Math.sin(s.angle));
        sctx.stroke();
      });
      sctx.globalAlpha = 1;
      sRaf = requestAnimationFrame(sDraw);
    };
    sRaf = requestAnimationFrame(sDraw);
    document.addEventListener('pointerdown', e => {
      const now = performance.now();
      for (let i = 0; i < 9; i++) {
        sparks.push({
          x: e.clientX, y: e.clientY,
          angle: (Math.PI * 2 * i) / 9 + Math.random() * 0.4,
          radius: 26 + Math.random() * 20,
          size: 7 + Math.random() * 5,
          start: now,
          duration: 380 + Math.random() * 140,
          color: SCOLORS[Math.floor(Math.random() * SCOLORS.length)]
        });
      }
    });
  }

  /* ============================================================
     i18n(zh / en)
     ============================================================ */
  const I18N = {
    zh: {
      'nav.about': '关于', 'nav.works': '作品', 'nav.showcase': '介绍', 'nav.se': '产品',
      'nav.skills': '技能', 'nav.contact': '联系',
      'hero.sub': '探索、构建、创造。',
      'hero.learn': '了解更多', 'hero.cta': '开始探索',
      'about.title': '把好奇心，变成作品。',
      'about.sub': '我是一名创造者，相信设计与工程结合，能把想法打磨成可用的作品。',
      'about.learn': '了解更多',
      'works.title': '正在创造的东西。',
      'works.c1t': 'huinavigate', 'works.c1d': '个人主页 —— 探索设计与交互的边界。', 'works.c1l': '查看项目',
      'works.c2t': '下一个项目', 'works.c2d': '正在酝酿中 —— 敬请期待。', 'works.c2l': '关注更新',
      'works.c3t': 'GitHub', 'works.c3d': '我的开源主页与全部仓库。', 'works.c3l': '访问 GitHub',
      'se.title': '探索、构建、创造。', 'se.hint': '继续向下滚动',
      'se.subtitle': '一个会讲故事的主页', 'se.cta': '看看它是怎么做的',
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
      'nav.about': 'About', 'nav.works': 'Works', 'nav.showcase': 'Showcase', 'nav.se': 'Product',
      'nav.skills': 'Skills', 'nav.contact': 'Contact',
      'hero.sub': 'Explore. Build. Create.',
      'hero.learn': 'Learn more', 'hero.cta': 'Start Exploring',
      'about.title': 'Turn curiosity into creations.',
      'about.sub': 'I\'m a creator who believes design and engineering together can polish ideas into working products.',
      'about.learn': 'Learn more',
      'works.title': 'Things I\'m building.',
      'works.c1t': 'huinavigate', 'works.c1d': 'Personal homepage — exploring the edge of design and interaction.', 'works.c1l': 'View project',
      'works.c2t': 'Next Project', 'works.c2d': 'Brewing — stay tuned.', 'works.c2l': 'Follow updates',
      'works.c3t': 'GitHub', 'works.c3d': 'My open-source homepage and repositories.', 'works.c3l': 'Visit GitHub',
      'se.title': 'Explore. Build. Create.', 'se.hint': 'Keep scrolling',
      'se.subtitle': 'A homepage that tells a story', 'se.cta': 'See how it works',
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
