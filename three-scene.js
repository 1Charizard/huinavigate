/* ============================================================
   huinavigate — 3D 粒子层(轻量)
   默认自动(桌面启用/移动端关闭),?3d=full 增密度,?3d=off 关闭
   WebGL 失败时降级为 2D canvas 漂移粒子
   ============================================================ */
(async () => {
  'use strict';

  const container = document.getElementById('fx');
  if (!container) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const params = new URLSearchParams(location.search);
  const mode = params.get('3d') || 'auto';

  const want3D = mode !== 'off'
    && !reduceMotion
    && (mode === 'full' || (finePointer && innerWidth > 720));

  if (!want3D) {
    if (mode === 'off') console.log('[fx] 3D disabled by ?3d=off');
    else if (reduceMotion) console.log('[fx] 3D disabled (reduced motion)');
    else console.log('[fx] 3D disabled (mobile/coarse pointer)');
    return;
  }

  const colors = ['#f3d9d3', '#e0b8c8', '#f0c75e', '#d4a017', '#fdf3f5'];
  const count = mode === 'full' ? 520 : 240;

  /* ---------- 2D canvas 降级 ---------- */
  function fallback2D() {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w, h, parts = [];
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.width = container.clientWidth * dpr;
      h = canvas.height = container.clientHeight * dpr;
      canvas.style.width = container.clientWidth + 'px';
      canvas.style.height = container.clientHeight + 'px';
      parts = Array.from({ length: Math.min(count, 160) }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: (Math.random() * 2.4 + 0.6) * dpr,
        vx: (Math.random() - 0.5) * 0.35 * dpr,
        vy: (-Math.random() * 0.4 - 0.1) * dpr,
        c: colors[Math.floor(Math.random() * colors.length)],
        a: Math.random() * 0.5 + 0.25,
      }));
    };
    resize();
    window.addEventListener('resize', resize);

    let mx = 0, my = 0;
    if (finePointer) {
      window.addEventListener('pointermove', e => {
        mx = (e.clientX / innerWidth - 0.5);
        my = (e.clientY / innerHeight - 0.5);
      }, { passive: true });
    }

    let introFade = 0;
    function tick() {
      ctx.clearRect(0, 0, w, h);
      const target = document.body.classList.contains('ready') ? 1 : 0;
      introFade += (target - introFade) * 0.04;
      for (const p of parts) {
        p.x += p.vx + mx * 0.4;
        p.y += p.vy + my * 0.2;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
        ctx.globalAlpha = p.a * introFade;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    tick();
    console.log('[fx] 2D canvas particle fallback active');
  }

  /* ---------- Three.js ---------- */
  let THREE;
  try {
    THREE = await import('./vendor/three.module.min.js');
  } catch (e) {
    console.warn('[fx] three.module import failed, falling back to 2D', e);
    fallback2D();
    return;
  }

  try {
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.z = 14;

    /* 柔和圆点贴图 */
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 64;
    const sctx = sprite.getContext('2d');
    const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.85)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 64, 64);
    const spriteTex = new THREE.CanvasTexture(sprite);

    const positions = new Float32Array(count * 3);
    const colorArr = new Float32Array(count * 3);
    const tmp = new THREE.Color();
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 26;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
      tmp.set(colors[Math.floor(Math.random() * colors.length)]);
      colorArr[i * 3] = tmp.r;
      colorArr[i * 3 + 1] = tmp.g;
      colorArr[i * 3 + 2] = tmp.b;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colorArr, 3));

    const material = new THREE.PointsMaterial({
      size: 0.28, map: spriteTex, vertexColors: true,
      transparent: true, opacity: 0.85, depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let mx = 0, my = 0, tx = 0, ty = 0;
    if (finePointer) {
      window.addEventListener('pointermove', e => {
        mx = (e.clientX / innerWidth - 0.5);
        my = (e.clientY / innerHeight - 0.5);
      }, { passive: true });
    }

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let introFade = 0;
    function animate() {
      const t = clock.getElapsedTime();
      points.rotation.y = t * 0.05;
      points.rotation.x = Math.sin(t * 0.12) * 0.08;
      tx += (mx * 2.2 - tx) * 0.05;
      ty += (-my * 1.4 - ty) * 0.05;
      camera.position.x = tx;
      camera.position.y = ty;
      camera.lookAt(0, 0, 0);
      // 开场序幕期间隐藏,结束后淡入
      const target = document.body.classList.contains('ready') ? 1 : 0;
      introFade += (target - introFade) * 0.04;
      material.opacity = 0.85 * introFade;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();
    console.log(`[fx] three.js particles ready (${count} points)`);
  } catch (e) {
    console.warn('[fx] WebGL init failed, falling back to 2D', e);
    container.innerHTML = '';
    fallback2D();
  }
})();
