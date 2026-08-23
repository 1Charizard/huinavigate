/* ============================================================
   huinavigate — 组件预览页逻辑
   14 个效果全部纯 JS/CSS 移植(复用 vendor/gsap.js 与 pixel-swap.js)
   ============================================================ */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     1. Gradient Text — hover 暂停
     ============================================================ */
  const gradientText = document.querySelector('.gradient-text');
  if (gradientText) {
    gradientText.addEventListener('mouseenter', () => gradientText.classList.add('paused'));
    gradientText.addEventListener('mouseleave', () => gradientText.classList.remove('paused'));
  }

  /* ============================================================
     2. Click Spark — canvas 放射火花
     ============================================================ */
  const sparkStage = document.querySelector('.spark-stage');
  if (sparkStage) {
    const canvas = document.createElement('canvas');
    sparkStage.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let sparks = [];
    let raf = 0;
    const COLORS = ['#d4a017', '#f0c75e', '#e0b8c8'];

    const resize = () => {
      canvas.width = sparkStage.clientWidth;
      canvas.height = sparkStage.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const draw = ts => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      sparks = sparks.filter(s => ts - s.start < s.duration);
      sparks.forEach(s => {
        const p = (ts - s.start) / s.duration;
        const e = easeOut(p);
        const dist = e * s.radius;
        const len = s.size * (1 - e);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1 - p;
        ctx.beginPath();
        ctx.moveTo(s.x + dist * Math.cos(s.angle), s.y + dist * Math.sin(s.angle));
        ctx.lineTo(s.x + (dist + len) * Math.cos(s.angle), s.y + (dist + len) * Math.sin(s.angle));
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    sparkStage.addEventListener('click', e => {
      const rect = sparkStage.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const count = 10;
      const now = performance.now();
      for (let i = 0; i < count; i++) {
        sparks.push({
          x, y,
          angle: (Math.PI * 2 * i) / count + Math.random() * 0.4,
          radius: 34 + Math.random() * 26,
          size: 8 + Math.random() * 6,
          start: now,
          duration: 420 + Math.random() * 160,
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
        });
      }
    });
  }

  /* ============================================================
     3. Blur Text — IO 逐词模糊入场
     ============================================================ */
  const blurText = document.querySelector('[data-blur-text]');
  if (blurText) {
    const words = blurText.textContent.trim().split(/\s+/);
    blurText.textContent = '';
    words.forEach((w, i) => {
      const span = document.createElement('span');
      span.className = 'bt-word';
      span.textContent = w;
      span.style.transitionDelay = `${i * 0.14}s`;
      blurText.appendChild(span);
    });
    if (reduceMotion) {
      blurText.classList.add('in');
    } else {
      const io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          blurText.classList.add('in');
          io.disconnect();
        }
      }, { threshold: 0.4 });
      io.observe(blurText);
    }
  }

  /* ============================================================
     4. Decrypted Text — 乱码逐个还原
     ============================================================ */
  const decrypted = document.querySelector('[data-decrypted]');
  if (decrypted) {
    const target = decrypted.dataset.decrypted;
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+0123456789';
    let revealed = new Set();
    let timer = 0;
    let animating = false;

    const render = () => {
      let html = '';
      for (let i = 0; i < target.length; i++) {
        const ch = target[i];
        if (ch === ' ') { html += ' '; continue; }
        const ok = revealed.has(i);
        const display = ok ? ch : CHARS[Math.floor(Math.random() * CHARS.length)];
        html += `<span class="${ok ? 'dc-ok' : 'dc-encrypted'}">${display}</span>`;
      }
      decrypted.innerHTML = html;
    };

    const start = () => {
      if (animating || reduceMotion) { revealed = new Set(); for (let i = 0; i < target.length; i++) revealed.add(i); render(); return; }
      animating = true;
      revealed = new Set();
      let next = 0;
      timer = setInterval(() => {
        revealed.add(next++);
        render();
        if (next >= target.length) {
          clearInterval(timer);
          animating = false;
        }
      }, 55);
    };
    const reset = () => {
      if (animating) { clearInterval(timer); animating = false; }
      revealed = new Set();
      render();
    };

    render();
    decrypted.addEventListener('mouseenter', start);
    decrypted.addEventListener('mouseleave', reset);
    decrypted.addEventListener('click', () => { if (animating || revealed.size === target.length) reset(); else start(); });
  }

  /* ============================================================
     5. Curved Loop — SVG textPath 跑马灯 + 拖拽
     ============================================================ */
  const curvedStage = document.getElementById('curvedStage');
  if (curvedStage) {
    const text = 'huinavigate · 探索 构建 创造 · ';
    const uid = 'curve-path';
    const jacket = document.createElement('div');
    jacket.className = 'curved-loop-jacket';
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'curved-loop-svg');
    svg.setAttribute('viewBox', '0 0 1440 140');
    const defs = document.createElementNS(svgNS, 'defs');
    const grad = document.createElementNS(svgNS, 'linearGradient');
    grad.id = 'curvedGrad';
    grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0');
    grad.setAttribute('x2', '1'); grad.setAttribute('y2', '0');
    const st1 = document.createElementNS(svgNS, 'stop'); st1.setAttribute('offset', '0'); st1.setAttribute('stop-color', '#d4a017');
    const st2 = document.createElementNS(svgNS, 'stop'); st2.setAttribute('offset', '1'); st2.setAttribute('stop-color', '#e0b8c8');
    grad.appendChild(st1); grad.appendChild(st2); defs.appendChild(grad);
    svg.appendChild(defs);
    const path = document.createElementNS(svgNS, 'path');
    path.id = uid;
    path.setAttribute('d', 'M-100,40 Q500,140 1540,40');
    path.setAttribute('fill', 'none'); path.setAttribute('stroke', 'transparent');
    svg.appendChild(path);
    const measure = document.createElementNS(svgNS, 'text');
    measure.textContent = text;
    measure.style.visibility = 'hidden'; measure.style.opacity = '0';
    svg.appendChild(measure);
    const tpText = document.createElementNS(svgNS, 'text');
    tpText.setAttribute('class', 'curved-loop-text');
    const tp = document.createElementNS(svgNS, 'textPath');
    tp.setAttribute('href', `#${uid}`);
    tp.setAttribute('startOffset', '0px');
    tp.textContent = text.repeat(12);
    tpText.appendChild(tp);
    svg.appendChild(tpText);
    jacket.appendChild(svg);
    curvedStage.appendChild(jacket);

    let spacing = 0;
    let offset = 0;
    let speed = 2;
    let dragging = false;
    let lastX = 0;
    let vel = 0;
    let rafLoop = 0;

    const wrap = v => {
      if (spacing <= 0) return 0;
      if (v <= -spacing) v += spacing;
      if (v > 0) v -= spacing;
      return v;
    };
    const step = () => {
      if (!dragging) {
        offset = wrap(offset - speed);
        tp.setAttribute('startOffset', `${offset}px`);
      }
      rafLoop = requestAnimationFrame(step);
    };
    setTimeout(() => {
      spacing = measure.getComputedTextLength();
      rafLoop = requestAnimationFrame(step);
    }, 60);

    jacket.addEventListener('pointerdown', e => {
      dragging = true; lastX = e.clientX; vel = 0;
      jacket.setPointerCapture(e.pointerId);
    });
    jacket.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      vel = dx;
      offset = wrap(offset + dx);
      tp.setAttribute('startOffset', `${offset}px`);
    });
    const endDrag = () => {
      dragging = false;
      speed = vel > 0 ? 3 : 2;
    };
    jacket.addEventListener('pointerup', endDrag);
    jacket.addEventListener('pointerleave', endDrag);
  }

  /* ============================================================
     6. Dock — rAF 弹性放大
     ============================================================ */
  const dockPanel = document.getElementById('dockPanel');
  if (dockPanel && !reduceMotion) {
    const items = [...dockPanel.querySelectorAll('.dock-item')];
    const BASE = 46, MAX = 78;
    const centerX = () => dockPanel.getBoundingClientRect().left + dockPanel.clientWidth / 2;
    let mouseX = -9999;
    let rafDock = 0;

    const tickDock = () => {
      items.forEach(item => {
        const r = item.getBoundingClientRect();
        const c = r.left + r.width / 2;
        const dist = Math.abs(mouseX - c);
        const t = Math.max(0, 1 - dist / 160);
        const size = BASE + (MAX - BASE) * (t * t * (3 - 2 * t));
        item.style.width = `${size}px`;
        item.style.height = `${size}px`;
        item.style.fontSize = `${14 + size * 0.2}px`;
      });
      rafDock = requestAnimationFrame(tickDock);
    };
    rafDock = requestAnimationFrame(tickDock);

    dockPanel.addEventListener('pointermove', e => {
      mouseX = e.clientX;
    });
    dockPanel.addEventListener('pointerleave', () => { mouseX = -9999; });
  }

  /* ============================================================
     7. Border Glow — 指针驱动锥形辉光
     ============================================================ */
  const glowCard = document.querySelector('[data-glow]');
  if (glowCard) {
    const onMove = e => {
      const rect = glowCard.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2, cy = rect.height / 2;
      // 边缘接近度
      const dx = Math.abs(x - cx), dy = Math.abs(y - cy);
      let kx = Infinity, ky = Infinity;
      if (dx !== 0) kx = cx / dx;
      if (dy !== 0) ky = cy / dy;
      const edge = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
      // 指针角度
      let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;
      glowCard.style.setProperty('--edge-proximity', `${(edge * 100).toFixed(2)}`);
      glowCard.style.setProperty('--cursor-angle', `${angle.toFixed(2)}deg`);
    };
    glowCard.addEventListener('pointermove', onMove);
    glowCard.addEventListener('pointerleave', () => {
      glowCard.style.setProperty('--edge-proximity', '0');
    });
  }

  /* ============================================================
     8. Line Sidebar — rAF 指数平滑
     ============================================================ */
  const sidebar = document.querySelector('[data-sidebar]');
  if (sidebar) {
    const list = sidebar.querySelector('.line-sidebar__list');
    const items = [...sidebar.querySelectorAll('.line-sidebar__item')];
    const targets = items.map(() => 0);
    const currents = items.map(() => 0);
    let last = performance.now();
    let rafSide = 0;

    const runSide = now => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const k = 1 - Math.exp(-dt / 0.09);
      let moving = false;
      items.forEach((el, i) => {
        const next = currents[i] + (targets[i] - currents[i]) * k;
        const settled = Math.abs(targets[i] - next) < 0.002;
        currents[i] = settled ? targets[i] : next;
        el.style.setProperty('--effect', currents[i].toFixed(4));
        if (!settled) moving = true;
      });
      rafSide = moving ? requestAnimationFrame(runSide) : 0;
    };

    list.addEventListener('pointermove', e => {
      const rect = list.getBoundingClientRect();
      const py = e.clientY - rect.top;
      items.forEach((el, i) => {
        const center = el.offsetTop + el.offsetHeight / 2;
        const dist = Math.abs(py - center);
        const t = Math.max(0, 1 - dist / 90);
        targets[i] = t * t * (3 - 2 * t);
      });
      if (!rafSide) { last = performance.now(); rafSide = requestAnimationFrame(runSide); }
    });
    list.addEventListener('pointerleave', () => {
      targets.forEach((_, i) => { targets[i] = 0; });
      if (!rafSide) { last = performance.now(); rafSide = requestAnimationFrame(runSide); }
    });
  }

  /* ============================================================
     9. Scroll Expand — 内部滚动 + clip-path 展开
     ============================================================ */
  const scrollExpand = document.querySelector('[data-scroll-expand]');
  if (scrollExpand) {
    const track = scrollExpand.querySelector('.scroll-expand__track');
    const frame = scrollExpand.querySelector('.scroll-expand__frame');
    const media = scrollExpand.querySelector('.scroll-expand__media');
    const scrim = scrollExpand.querySelector('.scroll-expand__scrim');
    const title = scrollExpand.querySelector('.scroll-expand__title');
    const hint = scrollExpand.querySelector('.scroll-expand__hint');
    const STAGE_H = 360;
    const SPAN = 360 * 1.1;

    const apply = p => {
      const e = Math.min(Math.max(p, 0), 1);
      const smooth = e * e * (3 - 2 * e);
      const inset = 42 - 42 * smooth;
      frame.style.clipPath = `inset(${inset}% 29% ${inset}% 29% round ${24 - 24 * smooth}px)`;
      media.style.transform = `scale(${1.35 - 0.35 * smooth})`;
      scrim.style.opacity = `${0.45 * smooth}`;
      title.style.opacity = `${1 - smooth}`;
      title.style.transform = `translateY(${-30 * smooth}px) scale(${1 + 0.06 * smooth})`;
      hint.style.opacity = `${1 - Math.min(e / 0.12, 1)}`;
    };
    const onScroll = () => {
      const top = track.getBoundingClientRect().top - scrollExpand.getBoundingClientRect().top;
      apply(top / SPAN);
    };
    scrollExpand.addEventListener('scroll', onScroll, { passive: true });
    apply(0);
  }

  /* ============================================================
     9b. Scroll Expand Opening — 合并开场演示
     ============================================================ */
  const seoBox = document.getElementById('seoOpenBox');
  const seoReplay = document.getElementById('seoOpenReplay');
  if (seoBox && window.ScrollExpandOpening) {
    const runSeo = () => {
      if (reduceMotion) return;
      seoBox.querySelector('.seo-window')?.remove();
      seoBox.querySelectorAll('.ps-layer').forEach((layer, i) => {
        layer.dataset.visible = i === 0 ? 'true' : 'false';
        if (i === 0) layer.removeAttribute('aria-hidden');
        else layer.setAttribute('aria-hidden', 'true');
      });
      window.ScrollExpandOpening(seoBox, {
        brand: 'huinavigate',
        tag: '探索 · 构建 · 创造',
        hold: 900,
        expand: 1500
      });
    };
    seoReplay.addEventListener('click', runSeo);
    if ('IntersectionObserver' in window) {
      const seoObs = new IntersectionObserver(entries => {
        if (entries.some(e => e.isIntersecting)) { runSeo(); seoObs.disconnect(); }
      }, { threshold: 0.4 });
      seoObs.observe(seoBox);
    } else {
      runSeo();
    }
  }

  /* ============================================================
     10. Card Swap — GSAP 弹性轮换
     ============================================================ */
  const cardSwap = document.getElementById('cardSwap');
  if (cardSwap && window.gsap) {
    const cards = [...cardSwap.querySelectorAll('.swap-card')];
    const distX = 64, distY = 56;
    const slots = cards.map((_, i) => ({ x: i * distX, y: -i * distY, zIndex: cards.length - i }));
    const place = (el, slot) => {
      gsap.set(el, { x: slot.x, y: slot.y, z: -slot.x * 1.5, xPercent: -50, yPercent: -50, zIndex: slot.zIndex, force3D: true });
    };
    let order = cards.map((_, i) => i);
    cards.forEach((el, i) => place(el, slots[i]));

    const swap = () => {
      const [front, ...rest] = order;
      const elFront = cards[front];
      const tl = gsap.timeline();
      tl.to(elFront, { y: '+=420', duration: 1.1, ease: 'elastic.out(0.6,0.4)' });
      rest.forEach((idx, i) => {
        const slot = slots[i];
        tl.set(cards[idx], { zIndex: slot.zIndex }, '-=0.5');
        tl.to(cards[idx], { x: slot.x, y: slot.y, z: -slot.x * 1.5, duration: 0.9, ease: 'power2.inOut' }, '-=0.5');
      });
      const backSlot = slots[cards.length - 1];
      tl.call(() => gsap.set(elFront, { zIndex: backSlot.zIndex }), undefined, '-=0.3');
      tl.to(elFront, { x: backSlot.x, y: backSlot.y, z: -backSlot.x * 1.5, duration: 0.9, ease: 'elastic.out(0.6,0.4)' }, '-=0.4');
      tl.call(() => { order = [...rest, front]; });
    };
    swap();
    setInterval(swap, 4200);
  }

  /* ============================================================
     11. Pixel Swap — 复用 window.PixelSwap
     ============================================================ */
  const psDemo = document.getElementById('pixelSwapDemo');
  if (psDemo && window.PixelSwap && !reduceMotion) {
    let psBusy = false;
    const swapTo = (pattern) => {
      if (psBusy) return;
      const to = psDemo.querySelector('.ps-layer[data-visible="true"]') === psDemo.children[0] ? 1 : 0;
      psBusy = true;
      window.PixelSwap(psDemo, {
        to,
        pattern,
        pixelSize: 56, gap: 5, radius: 14, spin: 90, scale: 0.3,
        duration: 1100, pixelDuration: 400,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        onComplete: () => { psBusy = false; }
      });
    };
    document.querySelectorAll('[data-ps-pattern]').forEach(btn => {
      btn.addEventListener('click', () => swapTo(btn.dataset.psPattern));
    });
  }

  /* ============================================================
     12. Elastic Slider — pointer 拖动 + 弹性回弹
     ============================================================ */
  const slider = document.querySelector('[data-slider]');
  if (slider) {
    const root = slider.querySelector('.es-root');
    const track = slider.querySelector('.es-track');
    const range = slider.querySelector('.es-range');
    const valueEl = slider.querySelector('.es-value');
    const lIcon = slider.querySelector('.es-l');
    const rIcon = slider.querySelector('.es-r');
    const MAX_OVERFLOW = 50;
    let value = 50;
    let overflow = 0;
    let overflowTarget = 0;
    let region = 'middle';
    let dragging = false;
    let rafEl = 0;

    const decay = v => {
      if (v === 0) return 0;
      const sigmoid = 2 * (1 / (1 + Math.exp(-v / MAX_OVERFLOW)) - 0.5);
      return sigmoid * MAX_OVERFLOW;
    };

    const tickEl = () => {
      overflow += (overflowTarget - overflow) * 0.12;
      const w = track.getBoundingClientRect().width || 1;
      const scaleX = 1 + overflow / w;
      track.style.transform = `scaleX(${scaleX})`;
      track.style.transformOrigin = region === 'left' ? 'right' : 'left';
      track.style.height = `${8 - overflow * 0.03}px`;
      lIcon.style.transform = `scale(${region === 'left' ? 1 + overflow * 0.008 : 1}) translateX(${region === 'left' ? -overflow * 0.4 : 0}px)`;
      rIcon.style.transform = `scale(${region === 'right' ? 1 + overflow * 0.008 : 1}) translateX(${region === 'right' ? overflow * 0.4 : 0}px)`;
      if (Math.abs(overflow - overflowTarget) > 0.05 || overflow > 0.05) {
        rafEl = requestAnimationFrame(tickEl);
      } else {
        rafEl = 0;
        track.style.transform = '';
        track.style.height = '8px';
        lIcon.style.transform = ''; rIcon.style.transform = '';
      }
    };
    const kickEl = () => { if (!rafEl) rafEl = requestAnimationFrame(tickEl); };

    const update = (clientX) => {
      const rect = root.getBoundingClientRect();
      let v = ((clientX - rect.left) / rect.width) * 100;
      v = Math.min(Math.max(v, 0), 100);
      value = v;
      range.style.width = `${v}%`;
      valueEl.textContent = Math.round(v);
      // overflow
      let over = 0;
      if (clientX < rect.left) { region = 'left'; over = rect.left - clientX; }
      else if (clientX > rect.right) { region = 'right'; over = clientX - rect.right; }
      else { region = 'middle'; over = 0; }
      overflowTarget = decay(over);
      kickEl();
    };

    root.addEventListener('pointerdown', e => {
      dragging = true;
      update(e.clientX);
      root.setPointerCapture(e.pointerId);
    });
    root.addEventListener('pointermove', e => {
      if (dragging) update(e.clientX);
    });
    const up = () => {
      dragging = false;
      overflowTarget = 0;
      region = 'middle';
      kickEl();
    };
    root.addEventListener('pointerup', up);
    root.addEventListener('pointercancel', up);
    root.addEventListener('lostpointercapture', up);
    range.style.width = '50%';
  }

  /* ============================================================
     13. Antigravity (2D) — 粒子磁场
     ============================================================ */
  const agStage = document.getElementById('antigravityStage');
  if (agStage && !reduceMotion) {
    const canvas = document.createElement('canvas');
    agStage.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const resizeAg = () => {
      canvas.width = agStage.clientWidth;
      canvas.height = agStage.clientHeight;
    };
    resizeAg();
    window.addEventListener('resize', resizeAg);

    const N = 160;
    const parts = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      cx: 0, cy: 0,
      t: Math.random() * 100,
      speed: 0.01 + Math.random() / 160,
      r: 1.5 + Math.random() * 2,
      off: (Math.random() - 0.5) * 6
    }));

    let mx = -9999, my = -9999;
    let vmx = 0, vmy = 0;
    agStage.addEventListener('pointermove', e => {
      const rect = agStage.getBoundingClientRect();
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
    });
    agStage.addEventListener('pointerleave', () => { mx = -9999; my = -9999; });

    let rafAg = 0;
    const tickAg = () => {
      vmx += (mx - vmx) * 0.06;
      vmy += (my - vmy) * 0.06;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      parts.forEach(p => {
        p.t += p.speed;
        const dx = p.x - vmx, dy = p.y - vmy;
        const dist = Math.hypot(dx, dy);
        let tx = p.x, ty = p.y;
        if (dist < 120) {
          const angle = Math.atan2(dy, dx);
          const wave = Math.sin(p.t * 1.6 + angle) * 3;
          const ringR = 26 + p.off + wave;
          tx = vmx + ringR * Math.cos(angle);
          ty = vmy + ringR * Math.sin(angle);
        }
        p.cx += (tx - p.cx) * 0.08;
        p.cy += (ty - p.cy) * 0.08;
        const a = Math.max(0.15, 0.9 - dist / 400);
        ctx.globalAlpha = a;
        ctx.fillStyle = dist < 120 ? '#f0c75e' : '#e0b8c8';
        ctx.beginPath();
        ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      rafAg = requestAnimationFrame(tickAg);
    };
    rafAg = requestAnimationFrame(tickAg);
  }

  /* ============================================================
     14. Specular Button (CSS) — 光带随指针旋转
     ============================================================ */
  const specularBtn = document.querySelector('[data-specular]');
  if (specularBtn && !reduceMotion) {
    specularBtn.addEventListener('pointermove', e => {
      const rect = specularBtn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI) + 90;
      specularBtn.style.setProperty('--sb-angle', `${angle}deg`);
    });
  }

})();
