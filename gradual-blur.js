/* ============================================================
   huinavigate — Gradual Blur 顶部渐晕(零依赖)
   重建自导入的 Gradual Blur 组件(原文件截断缺失):
   - 在导航下方生成多层 backdrop-filter 渐变条
   - 从导航底部向下逐渐减弱模糊,形成苹果式毛玻璃过渡
   - 参数: strength / height / divCount / curve / exponential / opacity
   ============================================================ */
(() => {
  'use strict';

  const mount = document.getElementById('gradualBlur');
  if (!mount) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const config = {
    position: 'top',
    strength: 2,
    height: '7rem',
    divCount: 6,
    exponential: false,
    curve: 'ease-out',
    opacity: 1,
    zIndex: 900
  };

  // 曲线函数
  const CURVES = {
    linear: p => p,
    'ease-out': p => 1 - Math.pow(1 - p, 3),
    'ease-in': p => p * p * p,
    bezier: p => p * p * (3 - 2 * p)
  };
  const curve = CURVES[config.curve] || CURVES['ease-out'];

  const supportsBackdrop = 'backdropFilter' in document.documentElement.style
    || '-webkit-backdrop-filter' in document.documentElement.style;

  const el = document.createElement('div');
  el.className = 'gradual-blur';
  el.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0;
    height: ${config.height};
    z-index: ${config.zIndex};
    pointer-events: none;
    opacity: ${config.opacity};
  `;

  const inner = document.createElement('div');
  inner.className = 'gradual-blur-inner';
  inner.style.cssText = 'position:relative;width:100%;height:100%';

  const N = config.divCount;
  const increment = 100 / N;

  for (let i = 1; i <= N; i++) {
    let progress = i / N;
    progress = curve(progress);

    let blurValue;
    if (config.exponential) {
      blurValue = Math.pow(2, progress * 4) * 0.0625 * config.strength;
    } else {
      blurValue = 0.0625 * (progress * N + 1) * config.strength;
    }

    const p1 = Math.round((increment * i - increment) * 10) / 10;
    const p2 = Math.round(increment * i * 10) / 10;
    const p3 = Math.round((increment * i + increment) * 10) / 10;
    const p4 = Math.round((increment * i + increment * 2) * 10) / 10;

    let gradient = `transparent ${p1}%, rgba(0,0,0,0.55) ${p2}%`;
    if (p3 <= 100) gradient += `, rgba(0,0,0,0.55) ${p3}%`;
    if (p4 <= 100) gradient += `, transparent ${p4}%`;

    const bar = document.createElement('div');
    bar.style.cssText = `
      position: absolute; inset: 0;
      -webkit-mask-image: linear-gradient(to bottom, ${gradient});
      mask-image: linear-gradient(to bottom, ${gradient});
      -webkit-backdrop-filter: blur(${blurValue.toFixed(2)}px);
      backdrop-filter: blur(${blurValue.toFixed(2)}px);
    `;
    inner.appendChild(bar);
  }

  el.appendChild(inner);
  mount.appendChild(el);

  // 不支持 backdrop-filter 时降级为半透明暗色渐变(不模糊)
  if (!supportsBackdrop) {
    el.style.background = 'linear-gradient(to bottom, rgba(0,0,0,0.18), transparent)';
    inner.style.display = 'none';
  }

  // 开场期间隐藏,结束后淡入
  const show = () => {
    el.style.transition = 'opacity 1s ease 0.3s';
    el.style.opacity = String(config.opacity);
  };
  const checkReady = () => {
    if (document.body.classList.contains('ready')) { show(); observer.disconnect(); }
  };
  const observer = new MutationObserver(checkReady);
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  checkReady();
  setTimeout(show, 6000);

  // 减少动效:纯静态模糊,无动画,无需额外处理
  void reduceMotion;
})();
