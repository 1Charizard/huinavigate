/* ============================================================
   huinavigate — Dark Veil 全屏背景纱幕(原生 WebGL,零依赖)
   重建自导入的 Dark Veil 组件(原文件截断缺失):
   - CPPN 风格流动噪声 + 时间驱动纱幕
   - 颜色适配网站粉金配色:深紫褐底 + 金色/粉嫩流动高光
   - 全屏 fixed 背景层,内容之上纱幕之下
   - WebGL 失败或移动端低性能时静默不渲染
   ============================================================ */
(() => {
  'use strict';

  const container = document.getElementById('darkVeil');
  if (!container) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.className = 'darkveil-canvas';
  container.appendChild(canvas);

  const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false })
    || canvas.getContext('experimental-webgl');
  if (!gl) { container.remove(); return; }

  const VERT = `
  attribute vec2 aPos;
  void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
  `;

  const FRAG = `
  precision mediump float;
  uniform vec2 uRes;
  uniform float uTime;

  // 网站配色(粉金系统)
  const vec3 C_BASE   = vec3(0.93, 0.88, 0.90);  // 深紫褐 #1d1d24
  const vec3 C_PINK   = vec3(0.88, 0.72, 0.78);  // 粉嫩 #e0b8c8
  const vec3 C_GOLD   = vec3(0.94, 0.78, 0.37);  // 金色 #f0c75e
  const vec3 C_CREAM  = vec3(1.00, 0.97, 0.98);  // 粉白 #fdf3f5

  float rand(vec2 c){ return fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = rand(i), b = rand(i + vec2(1.0, 0.0));
    float c = rand(i + vec2(0.0, 1.0)), d = rand(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  // 分形噪声:多层叠加形成纱幕流动
  float fbm(vec2 p){
    float v = 0.0, amp = 0.5;
    for (int i = 0; i < 4; i++){
      v += amp * noise(p);
      p = p * 2.0 + vec2(1.7, 9.2);
      amp *= 0.5;
    }
    return v;
  }

  void main(){
    vec2 uv = gl_FragCoord.xy / uRes.xy;
    vec2 p = uv;
    float t = uTime * 0.08;

    // 纱幕:两层噪声异相流动,制造"布料"褶皱
    float n1 = fbm(p * 3.2 + vec2(t, -t * 0.6));
    float n2 = fbm(p * 4.6 - vec2(t * 0.8, t * 0.5) + 3.7);
    float veil = n1 * 0.62 + n2 * 0.38;

    // 纱幕纵向渐变:上下深、中部略亮(像垂帘)
    float grad = 0.72 + 0.28 * sin(uv.y * 3.14159);

    // 金色高光:噪声锐化形成流动光斑
    float gold = smoothstep(0.62, 0.95, veil) * (0.7 + 0.3 * sin(t * 3.0 + uv.x * 6.0));
    // 粉嫩微光:低频处晕染
    float pink = smoothstep(0.25, 0.6, n2) * 0.55;

    vec3 col = C_BASE * grad;
    col += C_GOLD * gold * 0.55;
    col += C_PINK * pink * 0.42;
    col += C_CREAM * veil * 0.12;

    // 边缘轻微晕影,聚焦中心
    float vig = smoothstep(1.35, 0.45, length(uv - 0.5));
    col *= 0.92 + 0.08 * vig;

    // 透明度:整体偏暗纱,透出网站粉白背景
    float alpha = 0.20 + 0.16 * veil;

    gl_FragColor = vec4(col, alpha);
  }
  `;

  let program, buf, raf = 0;
  const uTime = { v: 0 };

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('[dark-veil] shader error:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  function init() {
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { container.remove(); return; }
    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { container.remove(); return; }
    gl.useProgram(program);

    // 全屏三角形
    buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(1, Math.floor(container.clientWidth * dpr));
    const h = Math.max(1, Math.floor(container.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    return [w, h];
  }

  function tick() {
    if (!program) return;
    const [w, h] = resize();
    uTime.v += 0.016;
    gl.useProgram(program);
    gl.uniform2f(gl.getUniformLocation(program, 'uRes'), w, h);
    gl.uniform1f(gl.getUniformLocation(program, 'uTime'), uTime.v);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(tick);
  }

  init();
  if (program) {
    resize();
    tick();
    window.addEventListener('resize', resize, { passive: true });
  }
  // 开场结束后纱幕淡入(避免遮挡开场动画)
  const reveal = () => {
    container.style.transition = 'opacity 1.2s ease';
    container.style.opacity = '1';
  };
  const checkReady = () => {
    if (document.body.classList.contains('ready')) { reveal(); observer.disconnect(); }
  };
  const observer = new MutationObserver(checkReady);
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  checkReady();
  // 兜底:开场最多 6s 后必定显示
  setTimeout(reveal, 6000);
})();
