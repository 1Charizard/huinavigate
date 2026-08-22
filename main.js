/* ============================================================
   huinavigate — UI logic
   loading / i18n / nav / scroll reveal (Apple-style)
   ============================================================ */
(() => {
  'use strict';

  /* ---------- Loading curtain ---------- */
  const curtain = document.getElementById('curtain');
  const content = document.getElementById('content');

  window.addEventListener('load', () => {
    setTimeout(() => {
      curtain.classList.add('done');
      content.classList.add('entered');
      document.body.classList.add('ready');
    }, 600);
  });

  /* ---------- Nav scrolled state ---------- */
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Scroll reveal (fade-up + scale) ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('visible'));
  }

  /* ---------- i18n (zh / en) ---------- */
  const I18N = {
    zh: {
      'nav.about': '关于', 'nav.works': '作品', 'nav.skills': '技能', 'nav.contact': '联系',
      'hero.sub': '探索、构建、创造。',
      'hero.learn': '了解更多', 'hero.cta': '开始探索',
      'about.eyebrow': '关于我', 'about.title': '把好奇心,变成作品。',
      'about.sub': '我是一名创造者,相信设计与工程结合,能把想法打磨成可用的作品。',
      'about.learn': '了解更多',
      'works.eyebrow': '作品', 'works.title': '正在创造的东西。',
      'works.c1t': 'huinavigate', 'works.c1d': '个人主页 —— 探索设计与交互的边界。', 'works.c1l': '了解更多',
      'works.c2t': '下一个项目', 'works.c2d': '正在酝酿中 —— 敬请期待。', 'works.c2l': '了解更多',
      'skills.eyebrow': '技能', 'skills.title': '我的工具箱。',
      'skills.s1': '前端开发', 'skills.s2': 'UI/UX 设计', 'skills.s3': 'Node.js', 'skills.s4': '创意编程',
      'contact.eyebrow': '联系', 'contact.title': '一起创造点什么?',
      'contact.sub': '无论是合作、交流还是闲聊,欢迎随时找我。',
      'contact.email': '发邮件',
      'footer.nav': '导航', 'footer.links': '链接', 'footer.email': '邮箱',
    },
    en: {
      'nav.about': 'About', 'nav.works': 'Works', 'nav.skills': 'Skills', 'nav.contact': 'Contact',
      'hero.sub': 'Explore. Build. Create.',
      'hero.learn': 'Learn more', 'hero.cta': 'Start Exploring',
      'about.eyebrow': 'About', 'about.title': 'Turn curiosity into creations.',
      'about.sub': 'I\'m a creator who believes design and engineering together can polish ideas into working products.',
      'about.learn': 'Learn more',
      'works.eyebrow': 'Works', 'works.title': 'Things I\'m building.',
      'works.c1t': 'huinavigate', 'works.c1d': 'Personal homepage — exploring the edge of design and interaction.', 'works.c1l': 'Learn more',
      'works.c2t': 'Next Project', 'works.c2d': 'Brewing — stay tuned.', 'works.c2l': 'Learn more',
      'skills.eyebrow': 'Skills', 'skills.title': 'My toolbox.',
      'skills.s1': 'Frontend', 'skills.s2': 'UI/UX Design', 'skills.s3': 'Node.js', 'skills.s4': 'Creative Coding',
      'contact.eyebrow': 'Contact', 'contact.title': 'Let\'s build something together?',
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
      if (I18N[l] && I18N[l][key]) el.textContent = I18N[l][key];
    });
  }
  langBtn.addEventListener('click', () => applyLang(lang === 'zh' ? 'en' : 'zh'));

  /* ---------- Footer year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
