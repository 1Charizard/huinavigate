/* ============================================================
   huinavigate — 3D 粒子 + 背景渐变系统
   three.js 粒子悬浮/聚散 + 发光圆环 + GSAP 滚动驱动变色
   ============================================================ */
import * as THREE from './vendor/three.module.min.js';
const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger);

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.innerWidth < 768;

/* ----------------------------------------------------------
   WebGL 检测(优雅降级)
   ---------------------------------------------------------- */
const webglOk = (() => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch (e) { return false; }
})();
if (!webglOk) {
  document.body.classList.add('no-scene');
  window.__sceneFailed = true;
}

/* ----------------------------------------------------------
   Renderer / Scene / Camera
   ---------------------------------------------------------- */
const canvas = document.getElementById('scene-canvas');
let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({
    canvas, antialias: !isMobile, alpha: true, powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
} catch (e) {
  console.warn('[scene] WebGL unavailable:', e.message);
  document.body.classList.add('no-scene');
  window.__sceneFailed = true;
}

if (renderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 9);

  /* ----------------------------------------------------------
     粒子系统(粉/金/紫 混合,缓慢漂移)
     ---------------------------------------------------------- */
  const N = isMobile ? 550 : 1100;
  const COLORS = [
    new THREE.Color('#e7c3d0'),  // 粉
    new THREE.Color('#f0c75e'),  // 金
    new THREE.Color('#b8a7e0'),  // 紫
    new THREE.Color('#8e9bd8'),  // 蓝紫
  ];

  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = 1.8 + Math.random() * 1.6;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i*3]   = r * Math.sin(ph) * Math.cos(th);
    pos[i*3+1] = r * Math.sin(ph) * Math.sin(th);
    pos[i*3+2] = r * Math.cos(ph);
    const c = COLORS[(Math.random() * COLORS.length) | 0];
    col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

  const mat = new THREE.PointsMaterial({
    size: isMobile ? 0.07 : 0.06,
    vertexColors: true, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  const particles = new THREE.Points(geo, mat);
  scene.add(particles);

  /* ----------------------------------------------------------
     发光圆环(hero 主视觉)
     ---------------------------------------------------------- */
  const ringGroup = new THREE.Group();
  scene.add(ringGroup);
  const ringGeo = new THREE.TorusGeometry(2.1, 0.02, 8, 140);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xf0c75e, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2.2;
  ringGroup.add(ring);
  // 第二圈(粉, 反向旋转)
  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(2.5, 0.012, 8, 140),
    new THREE.MeshBasicMaterial({ color: 0xe7c3d0, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending })
  );
  ring2.rotation.x = Math.PI / 2.2 + 0.2;
  ringGroup.add(ring2);

  /* ----------------------------------------------------------
     ScrollTrigger: 滚动时粒子颜色过渡 + 圆环缩放 + 渐变变色
     ---------------------------------------------------------- */
  const root = document.documentElement;
  const chapters = document.querySelectorAll('.chapter');

  // 每章粒子主色调(滚动 lerp)
  const PARTICLE_TINTS = ['#e7c3d0', '#c9b8f0', '#f0a0c0', '#f0cfa0', '#f0c75e'];
  const curTint = new THREE.Color(PARTICLE_TINTS[0]);

  // 每章背景渐变配色
  const PALETTES = [
    { corner: '#2a2030', edge: '#8b9bb2', glow: '#fdf3f5', pink: '#f3d9d3', rose: '#e0b8c8' },
    { corner: '#2a2240', edge: '#8f88b8', glow: '#f5eef7', pink: '#e6d4ef', rose: '#cbaee0' },
    { corner: '#3a2030', edge: '#b0809a', glow: '#fdeef2', pink: '#f2cdd8', rose: '#d99ab4' },
    { corner: '#3a2a20', edge: '#c09a78', glow: '#fdf6ef', pink: '#f4dcc8', rose: '#e6b890' },
    { corner: '#302018', edge: '#b89870', glow: '#fdf8f0', pink: '#f6e0cc', rose: '#e8c49c' },
  ];
  const applyPalette = p => {
    root.style.setProperty('--bg-corner', p.corner);
    root.style.setProperty('--bg-edge', p.edge);
    root.style.setProperty('--bg-glow', p.glow);
    root.style.setProperty('--bg-pink', p.pink);
    root.style.setProperty('--bg-rose', p.rose);
  };
  applyPalette(PALETTES[0]);

  PALETTES.forEach((p, i) => {
    if (i === 0) return;
    const prev = PALETTES[i - 1];
    gsap.timeline({
      scrollTrigger: { trigger: chapters[i], start: 'top bottom', end: 'top top', scrub: 1,
        onUpdate: self => {
          const t = self.progress;
          // 粒子色调 lerp
          const from = new THREE.Color(PARTICLE_TINTS[i - 1]);
          const to = new THREE.Color(PARTICLE_TINTS[i]);
          curTint.lerpColors(from, to, t);
        } }
    })
    .fromTo(root, {
      '--bg-corner': prev.corner, '--bg-edge': prev.edge,
      '--bg-glow': prev.glow, '--bg-pink': prev.pink, '--bg-rose': prev.rose,
    }, {
      '--bg-corner': p.corner, '--bg-edge': p.edge,
      '--bg-glow': p.glow, '--bg-pink': p.pink, '--bg-rose': p.rose,
      ease: 'none',
    }, 0);
  });

  // hero 滚动: 圆环缩小淡出, 粒子聚拢
  gsap.timeline({
    scrollTrigger: { trigger: chapters[0], start: 'top top', end: 'bottom top', scrub: 1 }
  })
  .to(ringGroup.scale, { x: 0.3, y: 0.3, z: 0.3, ease: 'none' }, 0)
  .to(ringMat, { opacity: 0, ease: 'none' }, 0)
  .to(ring2.material, { opacity: 0, ease: 'none' }, 0.1);

  /* ----------------------------------------------------------
     鼠标/触摸视差
     ---------------------------------------------------------- */
  let mx = 0, my = 0, tx = 0, ty = 0;
  if (!REDUCED) {
    window.addEventListener('mousemove', e => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
    window.addEventListener('touchmove', e => {
      const t = e.touches[0];
      tx = (t.clientX / window.innerWidth - 0.5) * 2;
      ty = (t.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  /* ----------------------------------------------------------
     Resize
     ---------------------------------------------------------- */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, { passive: true });

  /* ----------------------------------------------------------
     渲染循环
     ---------------------------------------------------------- */
  const clock = new THREE.Clock();
  const cAttr = geo.attributes.color;

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    // 粒子缓慢旋转 + 轻微上下浮动
    particles.rotation.y = t * 0.06;
    particles.position.y = Math.sin(t * 0.4) * 0.15;

    // 粒子颜色向章节主色调过渡(缓慢)
    const k = 1 - Math.pow(0.002, dt);
    const arr = cAttr.array;
    for (let i = 0; i < N; i++) {
      arr[i*3]   += (curTint.r - arr[i*3]) * k;
      arr[i*3+1] += (curTint.g - arr[i*3+1]) * k;
      arr[i*3+2] += (curTint.b - arr[i*3+2]) * k;
    }
    cAttr.needsUpdate = true;

    // 圆环旋转
    ring.rotation.z += dt * 0.35;
    ring2.rotation.z -= dt * 0.25;

    // 相机视差(缓动)
    mx += (tx - mx) * 0.05;
    my += (ty - my) * 0.05;
    camera.position.x = mx * 0.5;
    camera.position.y = -my * 0.35;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  animate();

  window.__sceneReady = true;
  console.log('[scene] 3D ready, particles=', N);
} else {
  // GSAP 渐变仍可用(即使无 WebGL)
  const root = document.documentElement;
  const chapters = document.querySelectorAll('.chapter');
  const PALETTES = [
    { corner: '#2a2030', edge: '#8b9bb2', glow: '#fdf3f5', pink: '#f3d9d3', rose: '#e0b8c8' },
    { corner: '#2a2240', edge: '#8f88b8', glow: '#f5eef7', pink: '#e6d4ef', rose: '#cbaee0' },
    { corner: '#3a2030', edge: '#b0809a', glow: '#fdeef2', pink: '#f2cdd8', rose: '#d99ab4' },
    { corner: '#3a2a20', edge: '#c09a78', glow: '#fdf6ef', pink: '#f4dcc8', rose: '#e6b890' },
    { corner: '#302018', edge: '#b89870', glow: '#fdf8f0', pink: '#f6e0cc', rose: '#e8c49c' },
  ];
  const apply = p => {
    root.style.setProperty('--bg-corner', p.corner);
    root.style.setProperty('--bg-edge', p.edge);
    root.style.setProperty('--bg-glow', p.glow);
    root.style.setProperty('--bg-pink', p.pink);
    root.style.setProperty('--bg-rose', p.rose);
  };
  apply(PALETTES[0]);
  PALETTES.forEach((p, i) => {
    if (i === 0) return;
    const prev = PALETTES[i - 1];
    gsap.timeline({ scrollTrigger: { trigger: chapters[i], start: 'top bottom', end: 'top top', scrub: 1 } })
      .fromTo(root, {
        '--bg-corner': prev.corner, '--bg-edge': prev.edge,
        '--bg-glow': prev.glow, '--bg-pink': prev.pink, '--bg-rose': prev.rose,
      }, {
        '--bg-corner': p.corner, '--bg-edge': p.edge,
        '--bg-glow': p.glow, '--bg-pink': p.pink, '--bg-rose': p.rose,
        ease: 'none',
      }, 0);
  });
  window.__sceneReady = true;
  console.log('[scene] fallback gradient ready');
}
