/* ============================================================
   huinavigate — PixelSwap 零依赖移植
   核心算法来自 React 版 PixelSwap:
   - 每个像素是一扇窗口,各自承载同一内容、同一坐标原点的克隆
   - 窗口 transform 与内容 counter-transform 恒等,内容永不漂移
   - MAX_PIXELS 上限 + coverScale 让缝隙/圆角收尾闭合
   用法: window.PixelSwap(container, { to, pattern, pixelSize, ... })
   ============================================================ */
(() => {
  'use strict';

  const MAX_PIXELS = 220;
  // 全屏/大容器按面积提高像素预算(小容器保持 220;1080p 开场约 900,2K 封顶 900),
  // 避免 MAX_PIXELS 上限把 PC 大屏的像素强制放大成粗粝马赛克
  const pixelBudget = (width, height) =>
    Math.max(MAX_PIXELS, Math.min(900, Math.round((width * height) / 1800)));
  const KEYFRAME_STEPS = 14;

  const PATTERNS = {
    random: () => null,
    center: (x, y) => Math.hypot(x - 0.5, y - 0.5) / Math.SQRT1_2,
    edges: (x, y) => Math.min(x, 1 - x, y, 1 - y) * 2,
    'left-to-right': x => x,
    'right-to-left': x => 1 - x,
    'top-to-bottom': (_x, y) => y,
    'bottom-to-top': (_x, y) => 1 - y,
    diagonal: (x, y) => (x + y) / 2,
    spiral: (x, y) => {
      const angle = (Math.atan2(y - 0.5, x - 0.5) + Math.PI) / (Math.PI * 2);
      const radius = Math.hypot(x - 0.5, y - 0.5) / Math.SQRT1_2;
      return (angle + radius) % 1;
    }
  };

  const EASINGS = {
    linear: [0, 0, 1, 1],
    ease: [0.25, 0.1, 0.25, 1],
    'ease-in': [0.42, 0, 1, 1],
    'ease-out': [0, 0, 0.58, 1],
    'ease-in-out': [0.42, 0, 0.58, 1]
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const noise = seed => {
    const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return value - Math.floor(value);
  };

  const makeEasing = value => {
    const match = /cubic-bezier\(([^)]+)\)/.exec(value);
    const points = match ? match[1].split(',').map(Number) : EASINGS[value];
    if (!points || points.length !== 4 || points.some(Number.isNaN)) return makeEasing('ease');

    const [x1, y1, x2, y2] = points;
    if (x1 === y1 && x2 === y2) return progress => progress;

    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;

    return progress => {
      let t = progress;
      for (let i = 0; i < 5; i += 1) {
        const slope = (3 * ax * t + 2 * bx) * t + cx;
        if (!slope) break;
        t -= (((ax * t + bx) * t + cx) * t - progress) / slope;
      }
      t = clamp(t, 0, 1);
      return ((ay * t + by) * t + cy) * t;
    };
  };

  const coverScale = (size, gap, radius) => {
    const p = clamp(radius, 0, 50) / 100;
    const corner = Math.SQRT1_2 / (Math.SQRT2 * (0.5 - p) + p);
    return ((size + gap) / size) * Math.max(1, corner);
  };

  const buildGrid = ({ width, height, pixelSize, gap, pattern, randomness }) => {
    let size = pixelSize;
    let columns = Math.max(1, Math.ceil((width + gap) / (size + gap)));
    let rows = Math.max(1, Math.ceil((height + gap) / (size + gap)));

    const budget = pixelBudget(width, height);
    if (columns * rows > budget) {
      size = Math.ceil(size * Math.sqrt((columns * rows) / budget));
      columns = Math.max(1, Math.ceil((width + gap) / (size + gap)));
      rows = Math.max(1, Math.ceil((height + gap) / (size + gap)));
    }

    const stride = size + gap;
    const originX = (width - (columns * stride - gap)) / 2;
    const originY = (height - (rows * stride - gap)) / 2;
    const order = PATTERNS[pattern] || PATTERNS.random;
    const mix = clamp(randomness, 0, 1);
    const pixels = [];

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const index = row * columns + column;
        const x = columns <= 1 ? 0.5 : column / (columns - 1);
        const y = rows <= 1 ? 0.5 : row / (rows - 1);
        const base = order(x, y);
        const random = noise(index + 1);

        pixels.push({
          id: index,
          left: originX + column * stride,
          top: originY + row * stride,
          offset: base === null ? random : base * (1 - mix) + random * mix
        });
      }
    }

    return { pixels, size, gap, width, height };
  };

  const buildKeyframes = ({ ease, startScale, endScale, spin, fade }) => {
    const window = [];
    const content = [];

    for (let step = 0; step <= KEYFRAME_STEPS; step += 1) {
      const progress = step / KEYFRAME_STEPS;
      const eased = ease(progress);
      const scale = startScale + (endScale - startScale) * eased;
      const angle = spin * (1 - eased);

      window.push({
        offset: progress,
        opacity: fade ? Math.min(1, eased * 1.6) : 1,
        transform: `rotate(${angle}deg) scale(${scale})`
      });
      content.push({
        offset: progress,
        transform: `scale(${1 / scale}) rotate(${-angle}deg)`
      });
    }

    return { window, content };
  };

  /**
   * 执行一次像素切换。
   * container 内需有两个 .ps-layer,data-visible 控制当前显示层。
   * opts: { to, pixelSize, gap, radius, spin, scale, fade,
   *         duration, pixelDuration, pattern, randomness, easing, onComplete }
   */
  function pixelSwap(container, opts) {
    const layers = container.querySelectorAll('.ps-layer');
    if (layers.length < 2) return;

    const fromEl = layers[opts.to ? 0 : 1];
    const toEl = layers[opts.to ? 1 : 0];
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height || !toEl) return;

    const total = Math.max(200, opts.duration || 1400);
    const pixelMs = clamp(opts.pixelDuration || 450, 60, total);
    const spread = Math.max(0, total - pixelMs);

    const grid = buildGrid({
      width,
      height,
      pixelSize: Math.max(8, Math.round(opts.pixelSize || 64)),
      gap: Math.max(0, Math.round(opts.gap || 0)),
      pattern: opts.pattern || 'random',
      randomness: opts.randomness || 0
    });

    const endScale = coverScale(grid.size, grid.gap, opts.radius || 0);
    const startScale = clamp(opts.scale || 0.35, 0.05, 1) * endScale;
    const keyframes = buildKeyframes({
      ease: makeEasing(opts.easing || 'ease'),
      startScale,
      endScale,
      spin: opts.spin || 0,
      fade: opts.fade !== false
    });

    const gridEl = document.createElement('div');
    gridEl.className = 'ps-grid';
    const animations = [];
    const pixelEls = [];

    grid.pixels.forEach((pixel, index) => {
      const pixelEl = document.createElement('div');
      pixelEl.className = 'ps-pixel';
      pixelEl.style.left = `${pixel.left}px`;
      pixelEl.style.top = `${pixel.top}px`;
      pixelEl.style.width = `${grid.size}px`;
      pixelEl.style.height = `${grid.size}px`;
      pixelEl.style.borderRadius = `${clamp(opts.radius || 0, 0, 50)}%`;

      const content = document.createElement('div');
      content.className = 'ps-pixel-content';
      content.style.left = `${-pixel.left}px`;
      content.style.top = `${-pixel.top}px`;
      content.style.width = `${grid.width}px`;
      content.style.height = `${grid.height}px`;
      const originX = pixel.left + grid.size / 2;
      const originY = pixel.top + grid.size / 2;
      content.style.transformOrigin = `${originX}px ${originY}px`;

      const clone = toEl.cloneNode(true);
      clone.dataset.visible = 'true';
      clone.removeAttribute('aria-hidden');
      content.appendChild(clone);
      pixelEl.appendChild(content);
      gridEl.appendChild(pixelEl);

      const timing = { duration: pixelMs, delay: pixel.offset * spread, easing: 'linear', fill: 'both' };
      animations.push(pixelEl.animate(keyframes.window, timing));
      animations.push(content.animate(keyframes.content, timing));
      pixelEls.push(pixelEl);
    });

    toEl.dataset.visible = 'false';
    toEl.setAttribute('aria-hidden', 'true');
    container.appendChild(gridEl);

    window.setTimeout(() => {
      animations.forEach(animation => animation.cancel());
      gridEl.remove();
      toEl.dataset.visible = 'true';
      toEl.removeAttribute('aria-hidden');
      fromEl.dataset.visible = 'false';
      fromEl.setAttribute('aria-hidden', 'true');
      if (typeof opts.onComplete === 'function') opts.onComplete();
    }, total + 80);
  }

  window.PixelSwap = pixelSwap;
})();
