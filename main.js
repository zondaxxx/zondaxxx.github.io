import * as THREE from './vendor/three.module.min.js';

/* =========================================================
   CONFIG — правь тут
   ========================================================= */
const CONFIG = {
  name: 'ZONDAXXX',
  about: 'A BMTSU student · Junior FullStack Developer · Moscow',
  tagline: "> WHAT'S YOUR FAVORITE SCARY MOVIE?",
  contacts: [
    { label: 'GITHUB',   value: '@zondaxxx',          href: 'https://github.com/zondaxxx' },
    { label: 'TELEGRAM', value: '@nyanzondaxxx',       href: 'https://t.me/nyanzondaxxx' },
    { label: 'EMAIL',    value: 'appledev071@gmail.com', href: 'mailto:appledev071@gmail.com' },
    { label: 'LINKS',    value: 'guns.lol/zondaxxx',  href: 'https://guns.lol/zondaxxx' },
  ],
  // рендер-разрешение «PS1» (короткая сторона), меньше = грубее
  ps1Short: 240,
  // сила дрожания вершин (1 = сетка пикселей, >1 грубее)
  jitter: 1.6,
};

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = matchMedia('(pointer: coarse)').matches;

/* =========================================================
   Текстуры (рисуем в canvas — никаких ассетов)
   ========================================================= */
function canvasTex(w, h, draw, repeat = 1) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  return t;
}
function noise(g, w, h, base, amp, seed = 1) {
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const img = g.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * amp;
    d[i] = Math.max(0, Math.min(255, base[0] + n));
    d[i + 1] = Math.max(0, Math.min(255, base[1] + n));
    d[i + 2] = Math.max(0, Math.min(255, base[2] + n));
    d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
}

// Маска Ghostface (прозрачный фон → alpha-discard)
const maskTex = canvasTex(64, 96, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  // тень/обводка
  g.fillStyle = '#9c9581';
  ellipseFace(g, 32, 50, 24, 41);
  // лицо
  g.fillStyle = '#ece5d1';
  ellipseFace(g, 32, 48, 22, 39);
  // блик
  g.fillStyle = '#f7f2e3';
  g.beginPath(); g.ellipse(26, 30, 6, 11, 0, 0, Math.PI * 2); g.fill();
  // глаза — вытянутые капли, «грустные»
  g.fillStyle = '#050505';
  drop(g, 22, 33, 5.5, 11, -0.35);
  drop(g, 42, 33, 5.5, 11, 0.35);
  // нос
  g.beginPath(); g.moveTo(32, 46); g.lineTo(28.5, 56); g.lineTo(35.5, 56); g.closePath(); g.fill();
  // рот — длинный крик
  g.beginPath();
  g.moveTo(32, 58);
  g.bezierCurveTo(40, 60, 42, 76, 32, 86);
  g.bezierCurveTo(22, 76, 24, 60, 32, 58);
  g.fill();
  // серые тени вокруг рта/глаз
  g.strokeStyle = 'rgba(80,75,60,.55)'; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(32, 58); g.bezierCurveTo(41, 60, 43, 76, 32, 87); g.stroke();
  function ellipseFace(g, cx, cy, rx, ry) {
    g.beginPath();
    g.moveTo(cx, cy - ry);
    g.bezierCurveTo(cx + rx * 1.15, cy - ry, cx + rx * 1.05, cy + ry * 0.55, cx, cy + ry);
    g.bezierCurveTo(cx - rx * 1.05, cy + ry * 0.55, cx - rx * 1.15, cy - ry, cx, cy - ry);
    g.fill();
  }
  function drop(g, x, y, rx, ry, rot) {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.beginPath();
    g.moveTo(0, -ry);
    g.bezierCurveTo(rx * 1.4, -ry * 0.4, rx * 1.1, ry, 0, ry);
    g.bezierCurveTo(-rx * 1.1, ry, -rx * 1.4, -ry * 0.4, 0, -ry);
    g.fill(); g.restore();
  }
});

// Чёрная ткань с шумом и складками
const clothTex = canvasTex(32, 32, (g, w, h) => {
  noise(g, w, h, [22, 21, 25], 26, 7);
  g.fillStyle = 'rgba(0,0,0,.35)';
  for (let x = 3; x < w; x += 9) g.fillRect(x, 0, 2, h);
  g.fillStyle = 'rgba(70,68,80,.25)';
  for (let x = 6; x < w; x += 9) g.fillRect(x, 0, 1, h);
});

// Плитка пола
const floorTex = canvasTex(32, 32, (g, w, h) => {
  noise(g, w, h, [46, 50, 52], 22, 3);
  g.fillStyle = '#17181c';
  g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h);
  g.fillStyle = 'rgba(0,0,0,.35)';
  g.fillRect(14, 16, 6, 1); g.fillRect(20, 8, 1, 7); g.fillRect(6, 24, 9, 1);
}, 24);

// Металл ножа
const metalTex = canvasTex(8, 32, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, 0);
  gr.addColorStop(0, '#6b6f78'); gr.addColorStop(0.45, '#e6eaf0'); gr.addColorStop(0.55, '#f4f7fb'); gr.addColorStop(1, '#585c66');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});

const flatTex = canvasTex(2, 2, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 2, 2); });

/* =========================================================
   PS1-материал: снап вершин + аффинные UV + гуро + туман
   ========================================================= */
const FOG = new THREE.Color('#070709');
const shared = {
  uSnap: { value: new THREE.Vector2(160, 120) },
  uLight: { value: new THREE.Vector3(0.5, 0.9, 0.7).normalize() },
  uFog: { value: FOG },
  uFogNear: { value: 5 },
  uFogFar: { value: 24 },
};

const VERT = /* glsl */`
  uniform vec2 uSnap;
  uniform vec3 uLight;
  varying vec3 vUvW;
  varying float vLight;
  varying float vDepth;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec4 clip = projectionMatrix * mv;
    // снап на сетку низкого разрешения — фирменное дрожание PS1
    vec2 ndc = clip.xy / clip.w;
    ndc = floor(ndc * uSnap) / uSnap;
    clip.xy = ndc * clip.w;
    vec3 n = normalize(normalMatrix * normal);
    float d = max(dot(n, uLight), 0.0);
    vLight = 0.32 + 0.85 * d;
    // uv * w → в фрагменте делим на интерполированный w = аффинное текстурирование
    vUvW = vec3(uv * clip.w, clip.w);
    vDepth = -mv.z;
    gl_Position = clip;
  }
`;
const FRAG = /* glsl */`
  uniform sampler2D uMap;
  uniform vec3 uColor;
  uniform vec3 uFog;
  uniform float uFogNear, uFogFar;
  uniform float uAlphaTest;
  varying vec3 vUvW;
  varying float vLight;
  varying float vDepth;
  void main() {
    vec2 uv = vUvW.xy / vUvW.z;
    vec4 t = texture2D(uMap, uv);
    if (t.a < uAlphaTest) discard;
    vec3 c = t.rgb * uColor * vLight;
    float f = smoothstep(uFogNear, uFogFar, vDepth);
    c = mix(c, uFog, f);
    gl_FragColor = vec4(c, 1.0);
  }
`;
function ps1(map, color = '#ffffff', opts = {}) {
  const m = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG,
    uniforms: {
      ...shared,
      uMap: { value: map },
      uColor: { value: new THREE.Color(color) },
      uAlphaTest: { value: opts.alphaTest ?? 0.0 },
    },
    side: opts.side ?? THREE.FrontSide,
  });
  return m;
}
const MAT = {
  cloth: ps1(clothTex, '#ffffff'),
  clothDS: ps1(clothTex, '#ffffff', { side: THREE.DoubleSide }),
  black: ps1(flatTex, '#050506'),
  mask: ps1(maskTex, '#ffffff', { alphaTest: 0.5, side: THREE.DoubleSide }),
  metal: ps1(metalTex, '#ffffff'),
  floor: ps1(floorTex, '#ffffff'),
  mount: ps1(flatTex, '#141a33'),
};

/* =========================================================
   Сцена
   ========================================================= */
const canvas = document.getElementById('gl');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' });
} catch (e) {
  canvas.remove();
}

const scene = new THREE.Scene();
scene.background = FOG;
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 60);

// пол
const floor = new THREE.Mesh(new THREE.PlaneGeometry(48, 48, 12, 12), MAT.floor);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// горы вдали (как на референсе, только ночью)
{
  let s = 11;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rnd() * 0.4;
    const r = 15 + rnd() * 6;
    const h = 4 + rnd() * 6;
    const m = new THREE.Mesh(new THREE.ConeGeometry(3 + rnd() * 4, h, 5 + Math.floor(rnd() * 3)), MAT.mount);
    m.position.set(Math.cos(a) * r, h / 2 - 0.2, Math.sin(a) * r);
    m.rotation.y = rnd() * Math.PI;
    scene.add(m);
  }
}

/* ---------- Ghostface ---------- */
const char = new THREE.Group();
scene.add(char);

// балахон
const robeGeo = new THREE.CylinderGeometry(0.42, 0.8, 1.72, 9, 4);
{
  // рваный подол
  const p = robeGeo.attributes.position;
  let s = 5; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < p.count; i++) {
    if (p.getY(i) < -0.85) {
      p.setY(i, -0.86 + rnd() * 0.16);
      const x = p.getX(i), z = p.getZ(i), k = 1 + (rnd() - 0.5) * 0.12;
      p.setX(i, x * k); p.setZ(i, z * k);
    }
  }
  robeGeo.computeVertexNormals();
}
const robe = new THREE.Mesh(robeGeo, MAT.cloth);
robe.position.y = 0.86;
char.add(robe);

// плечи
const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 5), MAT.cloth);
shoulders.scale.set(1, 0.4, 0.78);
shoulders.position.y = 1.68;
char.add(shoulders);

// голова
const head = new THREE.Group();
head.position.y = 2.2;
char.add(head);
const headVoid = new THREE.Mesh(new THREE.SphereGeometry(0.27, 8, 6), MAT.black);
headVoid.scale.set(1, 1.2, 1);
head.add(headVoid);
const mask = new THREE.Mesh(
  new THREE.SphereGeometry(0.29, 10, 8, Math.PI / 2 - 1.05, 2.1, 0.35, 2.3), MAT.mask);
mask.scale.set(1, 1.25, 1);
head.add(mask);
const hood = new THREE.Mesh(
  new THREE.SphereGeometry(0.42, 10, 8, Math.PI / 2 + 0.95, Math.PI * 2 - 1.9), MAT.clothDS);
hood.scale.set(1, 1.25, 1.05);
hood.position.set(0, 0.07, -0.04);
head.add(hood);
// острие капюшона
const tip = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.35, 6), MAT.cloth);
tip.position.set(0, 0.62, -0.12);
tip.rotation.x = -0.5;
head.add(tip);

// руки
function arm(side) {
  const pivot = new THREE.Group();
  pivot.position.set(0.44 * side, 1.62, 0);
  const geo = new THREE.CylinderGeometry(0.11, 0.15, 0.78, 6);
  geo.translate(0, -0.39, 0);
  const sleeve = new THREE.Mesh(geo, MAT.cloth);
  pivot.add(sleeve);
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.15, 0.14), MAT.black);
  hand.position.y = -0.82;
  pivot.add(hand);
  char.add(pivot);
  return { pivot, hand };
}
const armL = arm(1);
const armR = arm(-1);
armL.pivot.rotation.set(0.12, 0, 0.28);
const ARM_R_BASE = { x: -1.35, z: -0.25 };
armR.pivot.rotation.set(ARM_R_BASE.x, 0, ARM_R_BASE.z);

// нож
{
  const knife = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.06), MAT.black);
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.05), MAT.metal);
  guard.position.y = -0.11;
  const bladeGeo = new THREE.BoxGeometry(0.045, 0.6, 0.012);
  {
    const p = bladeGeo.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getY(i) < 0) p.setX(i, p.getX(i) * 0.15); // сужение к острию
    bladeGeo.computeVertexNormals();
  }
  const blade = new THREE.Mesh(bladeGeo, MAT.metal);
  blade.position.y = -0.42;
  knife.add(handle, guard, blade);
  knife.position.set(0, -0.82, 0.02);
  knife.rotation.set(0.15, 0, 0);
  armR.pivot.add(knife);
}

/* =========================================================
   Пост-обработка: низкое разрешение + дизеринг
   ========================================================= */
const rt = new THREE.WebGLRenderTarget(320, 240, {
  minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true,
});
const postScene = new THREE.Scene();
const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const postMat = new THREE.ShaderMaterial({
  uniforms: { tDiffuse: { value: rt.texture }, uRes: { value: new THREE.Vector2(320, 240) }, uTime: { value: 0 } },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uTime;
    varying vec2 vUv;
    float d2(vec2 p){ return mod(2.0*mod(p.x,2.0) + 3.0*mod(p.y,2.0), 4.0); }
    float bayer(vec2 p){ p = floor(p); return (4.0*d2(mod(p,2.0)) + d2(floor(p/2.0)) + 0.5) / 16.0; }
    void main(){
      vec2 px = floor(vUv * uRes);
      vec3 c = texture2D(tDiffuse, (px + 0.5) / uRes).rgb;
      float d = bayer(px) - 0.5;
      // 5 бит на канал + упорядоченный дизеринг
      c = floor(c * 31.0 + d * 0.9 + 0.5) / 31.0;
      gl_FragColor = vec4(c, 1.0);
    }`,
  depthTest: false, depthWrite: false,
});
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));

/* =========================================================
   Размер / раскладка
   ========================================================= */
let W = 1, H = 1, mobile = false;
function resize() {
  W = innerWidth; H = innerHeight;
  mobile = W < 720;
  const aspect = W / H;
  const short = CONFIG.ps1Short;
  const rw = aspect >= 1 ? Math.round(short * aspect) : short;
  const rh = aspect >= 1 ? short : Math.round(short / aspect);
  rt.setSize(rw, rh);
  postMat.uniforms.uRes.value.set(rw, rh);
  shared.uSnap.value.set(rw / 2 / CONFIG.jitter, rh / 2 / CONFIG.jitter);
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  // персонаж справа на десктопе, по центру и дальше на мобиле
  char.position.x = mobile ? 0 : 1.0;
  camera.position.set(mobile ? 0 : 0.35, 1.5, mobile ? 6.4 : 4.6);
}

/* =========================================================
   Анимация
   ========================================================= */
const mouse = new THREE.Vector2(0, 0);
const look = new THREE.Vector2(0, 0);
addEventListener('pointermove', (e) => {
  mouse.set((e.clientX / W) * 2 - 1, (e.clientY / H) * 2 - 1);
});
let stabT = -1;
addEventListener('pointerdown', (e) => {
  if (e.target.closest('.item, button, a')) return;
  stabT = 0;
  glitchName();
});

const clock = new THREE.Clock();
let started = false;
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // взгляд за курсором (на тачах — сам оглядывается)
  const tx = isTouch ? Math.sin(t * 0.5) * 0.5 : mouse.x;
  const ty = isTouch ? Math.sin(t * 0.33) * 0.3 : mouse.y;
  look.x += (tx - look.x) * Math.min(1, dt * 5);
  look.y += (ty - look.y) * Math.min(1, dt * 5);
  head.rotation.y = look.x * 0.55;
  head.rotation.x = look.y * 0.32;
  char.rotation.y = look.x * 0.18 + (mobile ? 0 : -0.25);

  // дыхание / покачивание
  const breathe = reduceMotion ? 0 : 1;
  char.position.y = Math.sin(t * 1.4) * 0.015 * breathe;
  shoulders.scale.y = 0.4 + Math.sin(t * 1.4) * 0.012 * breathe;
  armL.pivot.rotation.z = 0.28 + Math.sin(t * 0.9) * 0.03 * breathe;

  // удар ножом
  let ax = ARM_R_BASE.x + Math.sin(t * 1.1) * 0.04 * breathe;
  let az = ARM_R_BASE.z;
  if (stabT >= 0) {
    stabT += dt / 0.5;
    const k = stabT < 0.35 ? stabT / 0.35 : Math.max(0, 1 - (stabT - 0.35) / 0.65);
    const e = k * k;
    ax = ARM_R_BASE.x - 0.95 * e + 0.55 * (stabT < 0.35 ? 0 : 0) ;
    az = ARM_R_BASE.z - 0.35 * e;
    head.rotation.x -= 0.25 * e;
    char.position.z = 0.25 * e;
    if (stabT >= 1) { stabT = -1; char.position.z = 0; }
  }
  armR.pivot.rotation.x = ax;
  armR.pivot.rotation.z = az;

  // камера чуть плывёт
  const camDrift = reduceMotion ? 0 : 1;
  camera.position.x += ((mobile ? 0 : 0.35) + Math.sin(t * 0.25) * 0.12 * camDrift - camera.position.x) * 0.05;
  camera.position.y = 1.5 + Math.sin(t * 0.4) * 0.05 * camDrift;
  camera.lookAt(char.position.x, 1.3, 0);

  postMat.uniforms.uTime.value = t;
  renderer.setRenderTarget(rt);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  renderer.render(postScene, postCam);
}

/* =========================================================
   UI
   ========================================================= */
const $ = (id) => document.getElementById(id);
$('year').textContent = new Date().getFullYear();
$('name').textContent = CONFIG.name;
$('name').dataset.text = CONFIG.name;
$('about').textContent = CONFIG.about;
document.title = CONFIG.name;

const menu = $('menu');
CONFIG.contacts.forEach((c) => {
  const a = document.createElement('a');
  a.className = 'item';
  a.href = c.href;
  if (!c.href.startsWith('mailto:')) { a.target = '_blank'; a.rel = 'noopener'; }
  a.innerHTML = `<span class="cur">&#9654;</span><span class="lbl">${c.label}</span><span class="val">${c.value}</span>`;
  a.addEventListener('mouseenter', () => selectItem(a));
  menu.appendChild(a);
});
const items = [...menu.children];
let selIdx = -1;
function selectItem(el) {
  items.forEach((i) => i.classList.remove('sel'));
  selIdx = items.indexOf(el);
  if (el) el.classList.add('sel');
}
addEventListener('keydown', (e) => {
  if (!started) { if (e.key === 'Enter' || e.key === ' ') start(); return; }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    const n = items.length;
    selIdx = e.key === 'ArrowDown' ? (selIdx + 1) % n : (selIdx - 1 + n) % n;
    selectItem(items[selIdx]);
    items[selIdx].focus();
  }
  if (e.key === 'Enter' && selIdx >= 0) items[selIdx].click();
});

let glitchTimer;
function glitchName() {
  const n = $('name');
  n.classList.remove('glitch');
  void n.offsetWidth;
  n.classList.add('glitch');
  n.addEventListener('animationend', () => n.classList.remove('glitch'), { once: true });
}
function scheduleGlitch() {
  glitchTimer = setTimeout(() => { if (!reduceMotion) glitchName(); scheduleGlitch(); }, 3500 + Math.random() * 4000);
}

function typewriter(el, text, speed = 38) {
  el.textContent = '';
  let i = 0;
  const tick = () => {
    el.textContent = text.slice(0, ++i) + (i < text.length ? '█' : '');
    if (i < text.length) setTimeout(tick, speed + (text[i - 1] === ' ' ? 60 : 0));
  };
  tick();
}

/* ---------- boot ---------- */
const bootSteps = [
  [0.18, 'CHECKING MEMORY CARD'],
  [0.42, 'LOADING GHOSTFACE.TMD'],
  [0.66, 'LOADING TEXTURES (64x96)'],
  [0.88, 'DITHERING'],
  [1.00, 'OK'],
];
function boot() {
  const fill = $('boot-fill'), status = $('boot-status');
  let i = 0;
  const next = () => {
    if (i >= bootSteps.length) {
      $('boot-start').hidden = false;
      $('boot').addEventListener('pointerdown', start);
      setTimeout(() => { if (!started) start(); }, 4000);
      return;
    }
    const [p, msg] = bootSteps[i++];
    fill.style.width = (p * 100) + '%';
    status.textContent = msg + (p < 1 ? '…' : '');
    setTimeout(next, 260 + Math.random() * 260);
  };
  setTimeout(next, 500);
}
function start() {
  if (started) return;
  started = true;
  $('boot').classList.add('out');
  $('ui').classList.add('in');
  $('hint').classList.add('in');
  typewriter($('tag'), CONFIG.tagline);
  items.forEach((it, i) => setTimeout(() => it.classList.add('in'), 500 + i * 110));
  setTimeout(glitchName, 900);
  scheduleGlitch();
}

/* ---------- go ---------- */
if (renderer) {
  resize();
  addEventListener('resize', resize);
  frame();
} else {
  document.body.classList.add('nogl');
}
boot();
