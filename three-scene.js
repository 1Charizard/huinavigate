/* ============================================================
  huinavigate — 3D 粒子层(全维度混合版)
  方案 ABCDE 混合:每次跳转,形态/配色/相机运镜/旋转动力学/粒子质感
  全部同时丝滑变化 → 每一次切换都是不同的视觉体验
  - 7 形态:球体/圆环/螺旋/星云/立方/波浪/散点
  - 7 配色:粉金/蓝紫/青绿/暖橙/玫红/白金/森林
  - 7 运镜:正对/环绕/俯视/推近/拉远/侧摆/斜旋(相机位置+视角 lerp)
  - 7 旋转:各轴速度/方向/摆动幅度不同
  - 7 质感:粒子大小/透明度/旋转速度不同
  - 暴露 window.__fx.setScene(i) → main.js 跳转时调用
  默认自动(桌面启用/移动端关闭),?3d=full 增密度,?3d=off 关闭
  WebGL 失败时降级为 2D canvas 漂移粒子
  ============================================================ */
(async () => {
  'use strict';

  const container = document.getElementById('fx');
  if (!container) return;

  const params = new URLSearchParams(location.search);
  const mode = params.get('3d') || 'auto';

  // 只要不是显式 ?3d=off 就启用背景(手机/触屏/小窗/reduce-motion 不再禁用)
  const want3D = mode !== 'off';

  if (!want3D) {
    console.log('[fx] 3D disabled by ?3d=off');
    return;
  }

  // 按设备分级粒子密度:桌面 260 / 平板 200 / 手机 130(full 模式翻倍)
  const dev = window.__device?.type ||
    (innerWidth > 1024 ? 'desktop' : (innerWidth > 720 ? 'tablet' : 'phone'));
  const base = dev === 'desktop' ? 260 : dev === 'tablet' ? 200 : 130;
  const count = mode === 'full' ? base * 2 : base;

  /* ---------- 2D canvas 降级(保持原有,色随场景切换) ---------- */
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
        c: '#f0c75e',
        a: Math.random() * 0.5 + 0.25,
      }));
    };
    resize();
    window.addEventListener('resize', resize);

    let mx = 0, my = 0;
    window.addEventListener('pointermove', e => {
      mx = (e.clientX / innerWidth - 0.5);
      my = (e.clientY / innerHeight - 0.5);
    }, { passive: true });

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

    /* ============================================================
       7 形态 × 7 配色 × 7 运镜 × 7 旋转 × 7 质感(全维度混合)
       ============================================================ */
    const SCENES = [
      { // hero 粉金球 · 正对 · 缓旋
        shape: 'sphere', pal: ['#e8a7b8','#d98aa6','#f0c75e','#c98d9e'],
        cam: { x: 0, y: 0, z: 14 }, fov: 60,
        rot: { y: 0.05, x: 0.02, z: 0 }, sway: 0.05,
        size: 0.28, opacity: 0.85,
      },
      { // about 蓝紫环 · 环绕俯视 · 反向缓旋
        shape: 'ring', pal: ['#7d8ff0','#5f6fe0','#f0c75e','#a3aef5'],
        cam: { x: 3.2, y: 2.4, z: 13 }, fov: 58,
        rot: { y: -0.08, x: 0.03, z: 0.01 }, sway: 0.1,
        size: 0.3, opacity: 0.8,
      },
      { // works 青绿螺旋 · 推近 · 快旋
        shape: 'spiral', pal: ['#2fb59e','#1f9c86','#f0c75e','#6fd4c0'],
        cam: { x: 0, y: 0.8, z: 11.5 }, fov: 64,
        rot: { y: 0.12, x: 0.04, z: 0.02 }, sway: 0.15,
        size: 0.26, opacity: 0.9,
      },
      { // showcase 暖橙星云 · 侧摆 · 大粒子
        shape: 'nebula', pal: ['#ff8a4a','#f26a3c','#ffd9a0','#e08a4a'],
        cam: { x: 4.6, y: 0, z: 14.5 }, fov: 56,
        rot: { y: 0.07, x: -0.05, z: 0.03 }, sway: 0.2,
        size: 0.34, opacity: 0.9,
      },
      { // skills 玫红立方 · 拉远 · 横摆
        shape: 'cube', pal: ['#ff5c8a','#e83868','#f0c75e','#ff9db8'],
        cam: { x: -3.4, y: 1.2, z: 15.5 }, fov: 52,
        rot: { y: 0.09, x: 0.08, z: 0.04 }, sway: 0.12,
        size: 0.24, opacity: 0.85,
      },
      { // contact 白金波浪 · 俯冲 · 缓摆
        shape: 'wave', pal: ['#b8b8d0','#9a9ab8','#f0c75e','#d4d4ea'],
        cam: { x: 0, y: -2.8, z: 13 }, fov: 66,
        rot: { y: 0.03, x: 0.06, z: 0.01 }, sway: 0.08,
        size: 0.22, opacity: 0.75,
      },
      { // footer 森林散点 · 斜旋 · 细粒子
        shape: 'cluster', pal: ['#5ec45c','#3da33f','#f0c75e','#8fd98a'],
        cam: { x: 2.8, y: -1.6, z: 16 }, fov: 60,
        rot: { y: 0.1, x: 0.02, z: 0.05 }, sway: 0.1,
        size: 0.2, opacity: 0.8,
      },
    ];

    /* 生成形态坐标 */
    function shapePositions(kind, n, seed) {
      const pos = new Float32Array(n * 3);
      const rand = () => { seed = (seed * 16807) % 2147483647; return (seed / 2147483647) * 2 - 1; };
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n;
        let x = 0, y = 0, z = 0;
        switch (kind) {
          case 'sphere': {
            const phi = Math.acos(1 - 2 * u);
            const theta = 2 * Math.PI * i * 0.618;
            const r = 6.5;
            x = r * Math.sin(phi) * Math.cos(theta);
            y = r * Math.sin(phi) * Math.sin(theta);
            z = r * Math.cos(phi);
            break;
          }
          case 'ring': {
            const theta = 2 * Math.PI * u;
            const r = 7 + 0.8 * rand();
            x = r * Math.cos(theta);
            z = r * Math.sin(theta);
            y = (rand() * 1.2);
            break;
          }
          case 'spiral': {
            const t = u * 6 * Math.PI;
            const r = 0.6 + 6.2 * (u);
            x = r * Math.cos(t);
            z = r * Math.sin(t);
            y = (u - 0.5) * 10;
            break;
          }
          case 'nebula': {
            const phi = Math.acos(1 - 2 * u);
            const theta = 2 * Math.PI * i * 0.618;
            const r = 5 + 2.6 * rand();
            x = r * Math.sin(phi) * Math.cos(theta) * (0.7 + 0.6 * rand());
            y = r * Math.cos(phi) * (0.8 + 0.4 * rand());
            z = r * Math.sin(phi) * Math.sin(theta) * (0.7 + 0.6 * rand());
            break;
          }
          case 'cube': {
            const edge = Math.floor(rand() * 3); // 0:x 1:y 2:z 面
            const s = 6.2;
            if (edge === 0) { x = s * (rand() < 0.5 ? -1 : 1); y = rand() * s; z = rand() * s; }
            else if (edge === 1) { y = s * (rand() < 0.5 ? -1 : 1); x = rand() * s; z = rand() * s; }
            else { z = s * (rand() < 0.5 ? -1 : 1); x = rand() * s; y = rand() * s; }
            break;
          }
          case 'wave': {
            x = (u - 0.5) * 16;
            z = (rand() * 4 - 2);
            y = Math.sin(x * 0.9 + 1.2) * 1.8 + (rand() * 0.8);
            break;
          }
          default: { // cluster 散点
            x = (rand() * 2 - 1) * 13;
            y = (rand() * 2 - 1) * 8;
            z = (rand() * 2 - 1) * 8;
          }
        }
        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;
      }
      return pos;
    }

    /* 预生成所有形态坐标 */
    const shapeCache = SCENES.map((s, idx) => shapePositions(s.shape, count, 1234 + idx * 77));

    /* 颜色解析 */
    const hexToRgb = h => {
      const n = parseInt(h.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => v / 255);
    };

    const positions = new Float32Array(count * 3);
    const colorArr = new Float32Array(count * 3);
    positions.set(shapeCache[0]);
    // 初始配色:场景0
    const initPal = SCENES[0].pal.map(hexToRgb);
    for (let i = 0; i < count; i++) {
      const c = initPal[i % initPal.length];
      colorArr[i * 3] = c[0]; colorArr[i * 3 + 1] = c[1]; colorArr[i * 3 + 2] = c[2];
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colorArr, 3));

    const material = new THREE.PointsMaterial({
      size: SCENES[0].size, map: spriteTex, vertexColors: true,
      transparent: true, opacity: SCENES[0].opacity, depthWrite: false,
      // NormalBlending:粒子直接以顶点色显示(Additive 在浅粉背景上不可见)
      blending: THREE.NormalBlending,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    /* 目标状态(用于 lerp 过渡) */
    let targetPos = new Float32Array(shapeCache[0]);
    let targetColors = new Float32Array(count * 3);
    let sceneIdx = 0;
    // 当前相机/旋转/质感(从场景0 起步)
    let camPos = { ...SCENES[0].cam };
    let camFov = SCENES[0].fov;
    let rotSpeed = { ...SCENES[0].rot };
    let swayAmp = SCENES[0].sway;
    let pSize = SCENES[0].size;
    let pOpacity = SCENES[0].opacity;

    const applyTarget = idx => {
      sceneIdx = idx;
      targetPos = shapeCache[idx];
      const pal = SCENES[idx].pal.map(hexToRgb);
      for (let i = 0; i < count; i++) {
        const c = pal[i % pal.length];
        targetColors[i * 3] = c[0];
        targetColors[i * 3 + 1] = c[1];
        targetColors[i * 3 + 2] = c[2];
      }
    };
    applyTarget(0);

    /* 暴露接口:main.js 跳转时调用 __fx.setScene(i) */
    window.__fx = {
      setScene(idx) {
        const i = Math.max(0, Math.min(idx, SCENES.length - 1));
        if (i === sceneIdx) return;
        applyTarget(i);
        // 运镜/旋转/质感目标随跳转更新(动画循环里 lerp)
        const s = SCENES[i];
        camPos = { x: s.cam.x, y: s.cam.y, z: s.cam.z };
        camFov = s.fov;
        rotSpeed = { x: s.rot.x, y: s.rot.y, z: s.rot.z };
        swayAmp = s.sway;
        pSize = s.size;
        pOpacity = s.opacity;
      }
    };

    let mx = 0, my = 0, tx = 0, ty = 0;

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let introFade = 0;
    // 兜底:即使开场动画异常未加 body.ready,4s 后粒子也强制淡入
    const forceRevealAt = performance.now() + 4000;
    const posAttr = geometry.attributes.position;
    const colAttr = geometry.attributes.color;

    /* 相机/旋转/质感当前值(过渡 lerp 用) */
    let curCam = { ...SCENES[0].cam };
    let curFov = SCENES[0].fov;
    let curRot = { ...SCENES[0].rot };
    let curSway = SCENES[0].sway;
    let curSize = SCENES[0].size;
    let curOpacity = SCENES[0].opacity;

    function animate() {
      const t = clock.getElapsedTime();
      // 形态过渡 lerp
      const pa = posAttr.array, ta = targetPos;
      for (let i = 0; i < pa.length; i++) pa[i] += (ta[i] - pa[i]) * 0.055;
      posAttr.needsUpdate = true;
      // 颜色过渡 lerp
      const ca = colAttr.array;
      for (let i = 0; i < ca.length; i++) ca[i] += (targetColors[i] - ca[i]) * 0.045;
      colAttr.needsUpdate = true;

      // 相机运镜 lerp(位置 + fov)
      curCam.x += (camPos.x - curCam.x) * 0.045;
      curCam.y += (camPos.y - curCam.y) * 0.045;
      curCam.z += (camPos.z - curCam.z) * 0.045;
      curFov += (camFov - curFov) * 0.045;
      camera.position.set(curCam.x, curCam.y, curCam.z);
      if (Math.abs(camera.fov - curFov) > 0.01) {
        camera.fov = curFov;
        camera.updateProjectionMatrix();
      }

      // 旋转动力学 lerp(各轴速度 + 摆动幅度)
      curRot.x += (rotSpeed.x - curRot.x) * 0.045;
      curRot.y += (rotSpeed.y - curRot.y) * 0.045;
      curRot.z += (rotSpeed.z - curRot.z) * 0.045;
      curSway += (swayAmp - curSway) * 0.045;
      points.rotation.y = t * curRot.y;
      points.rotation.x = Math.sin(t * 0.15 + sceneIdx) * curSway + t * curRot.x * 0.3;
      points.rotation.z = t * curRot.z * 0.2;

      // 质感 lerp(大小 + 透明度)
      curSize += (pSize - curSize) * 0.045;
      curOpacity += (pOpacity - curOpacity) * 0.045;
      material.size = curSize;
      material.opacity = curOpacity;

      // 指针微动
      tx += (mx * 2.2 - tx) * 0.05;
      ty += (-my * 1.4 - ty) * 0.05;
      camera.position.x += tx;
      camera.position.y += ty;
      camera.lookAt(0, 0, 0);

      // 开场序幕期间隐藏,结束后淡入(4s 兜底保证一定可见)
      const target = (document.body.classList.contains('ready') || performance.now() > forceRevealAt) ? 1 : 0;
      introFade += (target - introFade) * 0.04;
      material.opacity = curOpacity * introFade;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();
    console.log(`[fx] three.js mixed scenes ready (${count} points, ${SCENES.length} scenes)`);
  } catch (e) {
    console.warn('[fx] WebGL init failed, falling back to 2D', e);
    container.innerHTML = '';
    fallback2D();
  }
})();
