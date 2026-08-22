/* ============================================================
   huinavigate — immersive 3D scene (Three.js + GSAP ScrollTrigger)
   Every scroll range morphs the particle field + chapter objects.
   ============================================================ */
import * as THREE from 'three';
// GSAP ships UMD only; in a module context it attaches to `window`.
import './vendor/gsap.js';
import './vendor/ScrollTrigger.js';
const { gsap } = window;
const { ScrollTrigger } = window;

gsap.registerPlugin(ScrollTrigger);

/* ----------------------------------------------------------
   Config / adaptive quality
   ---------------------------------------------------------- */
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.innerWidth < 768;
const DPR = Math.min(window.devicePixelRatio || 1, 2);
const N = isMobile ? 900 : 2200;            // particle count
const CHAPTER_COLORS = [                     // per-chapter base colors
  new THREE.Color(0x3a7bd5),                 // ch0 hero   blue
  new THREE.Color(0x8e2de2),                 // ch1 explore purple
  new THREE.Color(0x00c6ff),                 // ch2 works  cyan
  new THREE.Color(0xff9a3c),                 // ch3 skills orange
  new THREE.Color(0xff4d8d),                 // ch4 contact pink
];

/* ----------------------------------------------------------
   Renderer / Scene / Camera
   ---------------------------------------------------------- */
const canvas = document.getElementById('scene-canvas');
const renderer = new THREE.WebGLRenderer({
  canvas, antialias: !isMobile, alpha: true, powerPreference: 'high-performance',
});
renderer.setPixelRatio(DPR);
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05060a, 0.045);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 9);

/* ----------------------------------------------------------
   Particle system (shared, morphs between chapter shapes)
   ---------------------------------------------------------- */
const geo = new THREE.BufferGeometry();
const pos = new Float32Array(N * 3);
const col = new Float32Array(N * 3);

// initial cloud = sphere
for (let i = 0; i < N; i++) {
  const r = 1.6 + Math.random() * 1.1;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
  pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
  pos[i*3+2] = r * Math.cos(phi);
  col[i*3] = col[i*3+1] = col[i*3+2] = 1;
}
geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

const mat = new THREE.PointsMaterial({
  size: isMobile ? 0.055 : 0.05,
  vertexColors: true, transparent: true, opacity: 1,
  blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
});
const particles = new THREE.Points(geo, mat);
scene.add(particles);

/* ----------------------------------------------------------
   Shape samplers (target positions for the particle field)
   ---------------------------------------------------------- */
const TAU = Math.PI * 2;
function shapeSphere(n) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = 1.5 + Math.random() * 0.5;
    const th = Math.random() * TAU, ph = Math.acos(2 * Math.random() - 1);
    out[i*3]   = r * Math.sin(ph) * Math.cos(th);
    out[i*3+1] = r * Math.sin(ph) * Math.sin(th);
    out[i*3+2] = r * Math.cos(ph);
  }
  return out;
}
function shapeTorusKnot(n) {
  const out = new Float32Array(n * 3);
  const p = 2, q = 3, R = 1.35, r = 0.42;
  for (let i = 0; i < n; i++) {
    const t = Math.random() * TAU;
    const rr = r * (0.6 + Math.random() * 0.8);
    const x = (R + rr * Math.cos(q * t)) * Math.cos(p * t);
    const y = (R + rr * Math.cos(q * t)) * Math.sin(p * t);
    const z = rr * Math.sin(q * t);
    out[i*3] = x; out[i*3+1] = y; out[i*3+2] = z;
  }
  return out;
}
function shapeGrid(n) {
  const out = new Float32Array(n * 3);
  const cols = 4, rows = 2, layers = 3;          // 24 cells
  const sx = 1.1, sy = 0.9, sz = 0.9;
  for (let i = 0; i < n; i++) {
    const c = i % cols, r = Math.floor(i / cols) % rows, l = Math.floor(i / (cols * rows)) % layers;
    // jitter so particles form a cloud around each cube instead of piling up
    const j = 0.14;
    out[i*3]   = (c - (cols-1)/2) * sx + (Math.random() - 0.5) * 2 * j;
    out[i*3+1] = (r - (rows-1)/2) * sy + (Math.random() - 0.5) * 2 * j;
    out[i*3+2] = (l - (layers-1)/2) * sz + (Math.random() - 0.5) * 2 * j;
  }
  return out;
}
function shapeBars(n) {
  const out = new Float32Array(n * 3);
  const bars = 4, rad = 0.42, gap = 1.15, baseY = -0.6;
  const heights = [2.0, 1.7, 1.35, 1.5];         // skill levels
  for (let i = 0; i < n; i++) {
    const b = i % bars;
    const x = (b - (bars-1)/2) * gap;
    const h = heights[b];
    const ang = Math.random() * TAU;
    const rr = rad * Math.sqrt(Math.random());
    const y = baseY + Math.random() * h;
    out[i*3] = x + rr * Math.cos(ang);
    out[i*3+1] = y;
    out[i*3+2] = rr * Math.sin(ang);
  }
  return out;
}
function shapeHeart(n) {
  const out = new Float32Array(n * 3);
  const S = 1 / 15.5;
  for (let i = 0; i < n; i++) {
    const t = Math.random() * TAU;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
    const jx = (Math.random() - 0.5) * 0.25, jy = (Math.random() - 0.5) * 0.25, jz = (Math.random() - 0.5) * 0.25;
    out[i*3]   = x * S * 0.14 + jx;
    out[i*3+1] = y * S * 0.14 + jy;
    out[i*3+2] = jz * 0.5;
  }
  return out;
}

// All 5 target shapes, normalized center
const shapes = [
  shapeSphere(N), shapeTorusKnot(N), shapeGrid(N), shapeBars(N), shapeHeart(N),
];
// center each shape at origin
for (const s of shapes) {
  let cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < N; i++) { cx += s[i*3]; cy += s[i*3+1]; cz += s[i*3+2]; }
  cx /= N; cy /= N; cz /= N;
  for (let i = 0; i < N; i++) { s[i*3] -= cx; s[i*3+1] -= cy; s[i*3+2] -= cz; }
}

const weights = [1, 0, 0, 0, 0];   // current chapter blend
const cur = new Float32Array(N * 3); // current blended target
const curColor = new THREE.Color(CHAPTER_COLORS[0]);
const tmpColor = new THREE.Color();

function setWeights(w) {
  for (let i = 0; i < 5; i++) weights[i] = w[i];
  // recompute blended target
  for (let i = 0; i < N * 3; i++) {
    let v = 0;
    for (let c = 0; c < 5; c++) v += weights[c] * shapes[c][i];
    cur[i] = v;
  }
  tmpColor.setRGB(0, 0, 0);
  for (let c = 0; c < 5; c++) tmpColor.addScaledColor(CHAPTER_COLORS[c], weights[c]);
  curColor.copy(tmpColor);
}

/* ----------------------------------------------------------
   Chapter anchor objects
   ---------------------------------------------------------- */
// glowing ring (hero) — spin lives on a wrapper so GSAP and idle rotation don't fight
const ringSpin = new THREE.Group();
scene.add(ringSpin);
const ringGeo = new THREE.TorusGeometry(1.7, 0.015, 8, 120);
const ringMat = new THREE.MeshBasicMaterial({ color: 0x4a9eff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
const ring = new THREE.Mesh(ringGeo, ringMat);
ring.rotation.x = Math.PI / 2.2;
ringSpin.add(ring);

// torus knot (explore)
const knotGeo = new THREE.TorusKnotGeometry(1.15, 0.26, 180, 24, 2, 3);
const knotMat = new THREE.MeshBasicMaterial({ color: 0x8e2de2, wireframe: true, transparent: true, opacity: 0 });
const knot = new THREE.Mesh(knotGeo, knotMat);
scene.add(knot);

// cube array (works)
const cubes = [];
for (let i = 0; i < 24; i++) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.62, 0.62),
    new THREE.MeshBasicMaterial({ color: 0x00c6ff, wireframe: true, transparent: true, opacity: 0 })
  );
  m.position.set(0, 0, 0);
  m.scale.setScalar(0.01);
  cubes.push(m);
  scene.add(m);
}

// skill bars (skills)
const bars = [];
const barH = [2.0, 1.7, 1.35, 1.5];
for (let i = 0; i < 4; i++) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 1, 0.34),
    new THREE.MeshBasicMaterial({ color: 0xff9a3c, transparent: true, opacity: 0 })
  );
  m.position.set((i - 1.5) * 1.15, -1.6, 0);
  m.scale.y = 0.01;
  bars.push(m);
  scene.add(m);
}

/* ----------------------------------------------------------
   Scroll-driven per-chapter timelines
   ---------------------------------------------------------- */
const chapters = document.querySelectorAll('.chapter');

// ch0: hero — camera push-in, ring rotates, title fades out
gsap.timeline({
  scrollTrigger: { trigger: chapters[0], start: 'top top', end: 'bottom top', scrub: 1 }
})
.to(camera.position, { z: 6.2, ease: 'none' }, 0)
.to(ring.rotation, { z: 1.4, x: Math.PI / 2, ease: 'none' }, 0)
.to(ring.material, { opacity: 0.25, ease: 'none' }, 0)
.to(chapters[0].querySelector('.ch-inner'), { opacity: 0, y: -60, ease: 'none' }, 0);

// ch1: explore — particles → torus knot, ring fades, knot appears
gsap.timeline({
  scrollTrigger: { trigger: chapters[1], start: 'top bottom', end: 'bottom top', scrub: 1,
    onUpdate: self => { const p = self.progress; setWeights([1 - p, p, 0, 0, 0]); } }
})
.to(ring.material, { opacity: 0, ease: 'none' }, 0)
.to(ring.scale, { x: 0.4, y: 0.4, z: 0.4, ease: 'none' }, 0)
.fromTo(knot.material, { opacity: 0 }, { opacity: 0.75, ease: 'none' }, 0)
.fromTo(knot.scale, { x: 0.6, y: 0.6, z: 0.6 }, { x: 1, y: 1, z: 1, ease: 'none' }, 0);

// ch2: works — particles → grid, knot fades, cubes pop in
const tlWorks = gsap.timeline({
  scrollTrigger: { trigger: chapters[2], start: 'top bottom', end: 'bottom top', scrub: 1,
    onUpdate: self => { const p = self.progress; setWeights([0, 1 - p, p, 0, 0]); } }
});
tlWorks.to(knot.material, { opacity: 0, ease: 'none' }, 0)
       .to(knot.scale, { x: 1.6, y: 1.6, z: 1.6, ease: 'none' }, 0);
cubes.forEach((c, i) => {
  const col = i % 4, row = Math.floor(i / 4) % 2, lay = Math.floor(i / 8);
  tlWorks.fromTo(c.material, { opacity: 0 }, {
    opacity: 0.85, duration: 0.4, ease: 'power2.out'
  }, (i % 8) * 0.06)
  .fromTo(c.scale, { x: 0.01, y: 0.01, z: 0.01 }, {
    x: 1, y: 1, z: 1, duration: 0.4, ease: 'back.out(2)'
  }, (i % 8) * 0.06)
  .fromTo(c.rotation, { x: 0, y: 0 }, {
    x: Math.PI / 4, y: Math.PI / 4, duration: 0.4, ease: 'none'
  }, (i % 8) * 0.06)
  .to(c.position, {
    x: (col - 1.5) * 1.05, y: (row - 0.5) * 1.0, z: (lay - 1) * 0.9,
    duration: 0.4, ease: 'power2.out'
  }, (i % 8) * 0.06);
});

// ch3: skills — particles → bars, cubes out, bars rise
const tlSkills = gsap.timeline({
  scrollTrigger: { trigger: chapters[3], start: 'top bottom', end: 'bottom top', scrub: 1,
    onUpdate: self => { const p = self.progress; setWeights([0, 0, 1 - p, p, 0]); } }
});
tlSkills.to(cubes, { opacity: 0, duration: 0.3, ease: 'none' }, 0)
       .to(cubes, { scale: 0.01, duration: 0.3, ease: 'none' }, 0);
bars.forEach((b, i) => {
  tlSkills.fromTo(b.material, { opacity: 0 }, { opacity: 0.9, duration: 0.5, ease: 'none' }, i * 0.1)
          .fromTo(b.scale, { y: 0.01 }, { y: barH[i], duration: 0.5, ease: 'power2.out' }, i * 0.1);
});

// ch4: contact — particles → heart, bars out, pulse
gsap.timeline({
  scrollTrigger: { trigger: chapters[4], start: 'top bottom', end: 'bottom top', scrub: 1,
    onUpdate: self => { const p = self.progress; setWeights([0, 0, 0, 1 - p, p]); } }
})
.to(bars, { opacity: 0, duration: 0.3, ease: 'none' }, 0)
.to(bars, { scaleY: 0.01, duration: 0.3, ease: 'none' }, 0);

/* ----------------------------------------------------------
   Mouse / touch parallax
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
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize, { passive: true });

/* ----------------------------------------------------------
   Render loop
   ---------------------------------------------------------- */
const clock = new THREE.Clock();
const pAttr = geo.attributes.position;
const cAttr = geo.attributes.color;
const tmp = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // ease particle positions toward blended target (smooth morph)
  const k = 1 - Math.pow(0.0018, dt);   // frame-rate independent smoothing
  const arr = pAttr.array;
  for (let i = 0; i < N * 3; i++) arr[i] += (cur[i] - arr[i]) * k;
  pAttr.needsUpdate = true;

  // color morph
  const cArr = cAttr.array;
  tmp.copy(curColor);
  for (let i = 0; i < N; i++) {
    cArr[i*3]   += (tmp.r - cArr[i*3]) * k;
    cArr[i*3+1] += (tmp.g - cArr[i*3+1]) * k;
    cArr[i*3+2] += (tmp.b - cArr[i*3+2]) * k;
  }
  cAttr.needsUpdate = true;

  // ambient rotation + idle motion
  particles.rotation.y = t * 0.05;
  ringSpin.rotation.z += dt * 0.4;
  knot.rotation.x = t * 0.25;
  knot.rotation.y = t * 0.35;
  bars.forEach(b => { b.rotation.y += dt * 0.3; });

  // camera parallax (eased)
  mx += (tx - mx) * 0.05;
  my += (ty - my) * 0.05;
  camera.position.x = mx * 0.6;
  camera.position.y = -my * 0.4;

  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
}
animate();

// export for main.js to signal "scene ready"
window.__sceneReady = true;
console.log('[scene] ready, particles=', N, REDUCED ? '(reduced motion)' : '');
