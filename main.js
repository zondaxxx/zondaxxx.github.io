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
  // жесты: пауза между ними, сек
  gestureEvery: [4, 9],
  // смена модели (оружие / маска / балахон): пауза, сек
  swapEvery: [18, 34],
  // ивенты (корова, чизбургер, без маски, вверх ногами…): пауза, сек
  eventEvery: [9, 20],
};

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = matchMedia('(pointer: coarse)').matches;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr, not) => { let v; do v = arr[Math.floor(Math.random() * arr.length)]; while (arr.length > 1 && v === not); return v; };

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

// Маска Ghostface (прозрачный фон → alpha-discard). variant: classic | bloody | dark
function maskTexture(variant) {
  return canvasTex(64, 96, (g, w, h) => {
    const dark = variant === 'dark';
    g.clearRect(0, 0, w, h);
    g.fillStyle = dark ? '#3a3a40' : '#9c9581';
    ellipseFace(g, 32, 50, 24, 41);
    g.fillStyle = dark ? '#0b0b0e' : '#ece5d1';
    ellipseFace(g, 32, 48, 22, 39);
    if (!dark) { g.fillStyle = '#f7f2e3'; g.beginPath(); g.ellipse(26, 30, 6, 11, 0, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = dark ? '#f2eee0' : '#050505';
    drop(g, 22, 33, 5.5, 11, -0.35);
    drop(g, 42, 33, 5.5, 11, 0.35);
    g.beginPath(); g.moveTo(32, 46); g.lineTo(28.5, 56); g.lineTo(35.5, 56); g.closePath(); g.fill();
    g.beginPath();
    g.moveTo(32, 58);
    g.bezierCurveTo(40, 60, 42, 76, 32, 86);
    g.bezierCurveTo(22, 76, 24, 60, 32, 58);
    g.fill();
    g.strokeStyle = dark ? 'rgba(255,255,255,.25)' : 'rgba(80,75,60,.55)'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(32, 58); g.bezierCurveTo(41, 60, 43, 76, 32, 87); g.stroke();
    if (variant === 'bloody') {
      g.fillStyle = '#8e0f16';
      // подтёки из глаз
      g.fillRect(20, 40, 2, 14); g.fillRect(23, 42, 1, 8); g.fillRect(43, 41, 2, 18); g.fillRect(41, 44, 1, 6);
      // брызги
      [[12, 22], [48, 18], [52, 60], [10, 58], [36, 12], [16, 70]].forEach(([x, y]) => {
        g.fillRect(x, y, 3, 3); g.fillRect(x + 3, y + 1, 1, 1); g.fillRect(x - 1, y + 3, 1, 2);
      });
      g.fillStyle = '#b3161f';
      g.fillRect(46, 30, 4, 2); g.fillRect(49, 32, 2, 9);
    }
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
}
const MASKS = { classic: maskTexture('classic'), bloody: maskTexture('bloody'), dark: maskTexture('dark') };

// Ткань с шумом и складками
function clothTexture(base, seed) {
  return canvasTex(32, 32, (g, w, h) => {
    noise(g, w, h, base, 26, seed);
    g.fillStyle = 'rgba(0,0,0,.35)';
    for (let x = 3; x < w; x += 9) g.fillRect(x, 0, 2, h);
    g.fillStyle = 'rgba(255,255,255,.08)';
    for (let x = 6; x < w; x += 9) g.fillRect(x, 0, 1, h);
  });
}
const CLOTHS = {
  black: clothTexture([22, 21, 25], 7),
  blood: clothTexture([74, 12, 18], 9),
  bone: clothTexture([150, 144, 132], 13),
};

const floorTex = canvasTex(32, 32, (g, w, h) => {
  noise(g, w, h, [46, 50, 52], 22, 3);
  g.fillStyle = '#17181c';
  g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h);
  g.fillStyle = 'rgba(0,0,0,.35)';
  g.fillRect(14, 16, 6, 1); g.fillRect(20, 8, 1, 7); g.fillRect(6, 24, 9, 1);
}, 24);

const metalTex = canvasTex(8, 32, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, 0);
  gr.addColorStop(0, '#6b6f78'); gr.addColorStop(0.45, '#e6eaf0'); gr.addColorStop(0.55, '#f4f7fb'); gr.addColorStop(1, '#585c66');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
const woodTex = canvasTex(16, 16, (g, w, h) => {
  noise(g, w, h, [122, 70, 32], 44, 21);
  g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(0, 4, w, 1); g.fillRect(0, 11, w, 1);
});
const gunTex = canvasTex(16, 16, (g, w, h) => { noise(g, w, h, [50, 52, 58], 22, 5); });
const flashTex = canvasTex(16, 16, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#ffd35a';
  g.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, r = i % 2 ? 3 : 8;
    g.lineTo(8 + Math.cos(a) * r, 8 + Math.sin(a) * r);
  }
  g.closePath(); g.fill();
  g.fillStyle = '#fff6d0'; g.fillRect(6, 6, 4, 4);
});
const phoneTex = canvasTex(8, 16, (g, w, h) => {
  g.fillStyle = '#101014'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#7fb6a0'; g.fillRect(1, 2, w - 2, h - 5);
  g.fillStyle = '#28302c'; g.fillRect(2, 4, 4, 1); g.fillRect(2, 6, 3, 1);
});
const flatTex = canvasTex(2, 2, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 2, 2); });
const cowTex = canvasTex(32, 32, (g, w, h) => {
  g.fillStyle = '#efeae0'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#141216';
  [[3, 4, 9, 7], [18, 2, 11, 9], [6, 18, 12, 10], [22, 16, 8, 6], [14, 26, 7, 5], [0, 12, 4, 5]].forEach(([x, y, a, b]) => {
    g.fillRect(x, y, a, b); g.fillRect(x + 2, y - 2, a - 4, 2); g.fillRect(x - 2, y + 2, 2, b - 4);
  });
}, 2);
const bunTex = canvasTex(16, 16, (g, w, h) => {
  noise(g, w, h, [214, 150, 80], 26, 31);
  g.fillStyle = '#f5e6c0'; [[2, 3], [9, 2], [13, 7], [5, 9], [10, 12], [3, 14]].forEach(([x, y]) => g.fillRect(x, y, 2, 1));
}, 3);
const skinTex = canvasTex(16, 16, (g, w, h) => { noise(g, w, h, [216, 168, 132], 18, 41); });
const grayTex = canvasTex(16, 16, (g, w, h) => { noise(g, w, h, [190, 188, 178], 14, 51); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 7, w, 1); });

/* =========================================================
   PS1-материал: снап вершин + аффинные UV + гуро + туман + глитч
   ========================================================= */
const FOG = new THREE.Color('#070709');
const shared = {
  uSnap: { value: new THREE.Vector2(160, 120) },
  uLight: { value: new THREE.Vector3(0.5, 0.9, 0.7).normalize() },
  uFog: { value: FOG },
  uFogNear: { value: 5 },
  uFogFar: { value: 24 },
  uTime: { value: 0 },
  uGlitch: { value: 0 },
};

const VERT = /* glsl */`
  uniform vec2 uSnap;
  uniform vec3 uLight;
  uniform float uTime, uGlitch;
  varying vec3 vUvW;
  varying float vLight;
  varying float vDepth;
  float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec4 clip = projectionMatrix * mv;
    vec2 ndc = clip.xy / clip.w;
    if (uGlitch > 0.0) {
      float h = hash(position + floor(uTime * 24.0));
      ndc += (vec2(h, fract(h * 7.31)) - 0.5) * uGlitch * 0.3;
    }
    // снап на сетку низкого разрешения — фирменное дрожание PS1
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
  uniform float uEmissive;
  varying vec3 vUvW;
  varying float vLight;
  varying float vDepth;
  void main() {
    vec2 uv = vUvW.xy / vUvW.z;
    vec4 t = texture2D(uMap, uv);
    if (t.a < uAlphaTest) discard;
    vec3 c = t.rgb * uColor * mix(vLight, 1.0, uEmissive);
    float f = smoothstep(uFogNear, uFogFar, vDepth);
    c = mix(c, uFog, f);
    gl_FragColor = vec4(c, 1.0);
  }
`;
function ps1(map, color = '#ffffff', opts = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG,
    uniforms: {
      ...shared,
      uMap: { value: map },
      uColor: { value: new THREE.Color(color) },
      uAlphaTest: { value: opts.alphaTest ?? 0.0 },
      uEmissive: { value: opts.emissive ?? 0.0 },
    },
    side: opts.side ?? THREE.FrontSide,
  });
}
const MAT = {
  cloth: ps1(CLOTHS.black),
  clothDS: ps1(CLOTHS.black, '#ffffff', { side: THREE.DoubleSide }),
  black: ps1(flatTex, '#050506'),
  mask: ps1(MASKS.classic, '#ffffff', { alphaTest: 0.5, side: THREE.DoubleSide }),
  metal: ps1(metalTex),
  wood: ps1(woodTex),
  gun: ps1(gunTex),
  flash: ps1(flashTex, '#ffffff', { alphaTest: 0.5, side: THREE.DoubleSide, emissive: 1 }),
  phone: ps1(phoneTex, '#ffffff', { emissive: 0.6 }),
  floor: ps1(floorTex),
  mount: ps1(flatTex, '#141a33'),
  cow: ps1(cowTex),
  pink: ps1(flatTex, '#e6a0b4'),
  bun: ps1(bunTex),
  patty: ps1(flatTex, '#5a3218'),
  cheese: ps1(flatTex, '#f2b632'),
  lettuce: ps1(flatTex, '#4f9a3a'),
  tomato: ps1(flatTex, '#c8332b'),
  gray: ps1(grayTex),
  skin: ps1(skinTex),
  eye: ps1(flatTex, '#ff2a2a', { emissive: 1 }),
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

const robeGeo = new THREE.CylinderGeometry(0.42, 0.8, 1.72, 9, 4);
{
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

const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 5), MAT.cloth);
shoulders.scale.set(1, 0.4, 0.78);
shoulders.position.y = 1.68;
char.add(shoulders);

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
const tip = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.35, 6), MAT.cloth);
tip.position.set(0, 0.62, -0.12);
tip.rotation.x = -0.5;
head.add(tip);
// лысая башка (видна, когда снят капюшон) + уши
const headSkin = new THREE.Group();
const skull = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), MAT.skin);
skull.scale.set(1, 1.18, 1);
headSkin.add(skull);
[-1, 1].forEach((sd) => { const ear = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.08), MAT.skin); ear.position.set(0.3 * sd, 0.02, 0); headSkin.add(ear); });
headSkin.visible = false;
head.add(headSkin);
// красные глаза в пустоте капюшона (когда нет маски)
const eyes = new THREE.Group();
[-1, 1].forEach((sd) => { const e = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), MAT.eye); e.position.set(0.1 * sd, 0.06, 0.24); eyes.add(e); });
eyes.visible = false;
head.add(eyes);

function arm(side) {
  const pivot = new THREE.Group();
  pivot.position.set(0.44 * side, 1.62, 0);
  const geo = new THREE.CylinderGeometry(0.11, 0.15, 0.78, 6);
  geo.translate(0, -0.39, 0);
  pivot.add(new THREE.Mesh(geo, MAT.cloth));
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.15, 0.14), MAT.black);
  hand.position.y = -0.82;
  pivot.add(hand);
  char.add(pivot);
  return { pivot, hand };
}
const armL = arm(1);
const armR = arm(-1);

/* ---------- Пропсы в правой руке (forward = -y, up = +z) ---------- */
const PROPS = {};
{
  // нож
  const knife = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.06), MAT.black);
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.05), MAT.metal);
  guard.position.y = -0.11;
  const bladeGeo = new THREE.BoxGeometry(0.045, 0.6, 0.012);
  {
    const p = bladeGeo.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getY(i) < 0) p.setX(i, p.getX(i) * 0.15);
    bladeGeo.computeVertexNormals();
  }
  const blade = new THREE.Mesh(bladeGeo, MAT.metal);
  blade.position.y = -0.42;
  knife.add(handle, guard, blade);
  knife.position.set(0, -0.82, 0.02);
  knife.rotation.set(0.15, 0, 0);
  PROPS.knife = knife;

  // AK — как на референсе. Строим в «оружейном» пространстве (z вперёд, y вверх), потом поворачиваем
  const gun = new THREE.Group();
  const add = (geo, mat, x, y, z, rx = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.x = rx; gun.add(m); return m; };
  add(new THREE.BoxGeometry(0.07, 0.09, 0.42), MAT.gun, 0, 0.06, 0.15);                    // ствольная коробка
  add(new THREE.BoxGeometry(0.06, 0.07, 0.22), MAT.wood, 0, 0.05, 0.42);                   // цевьё
  add(new THREE.CylinderGeometry(0.018, 0.018, 0.4, 6), MAT.gun, 0, 0.085, 0.6, Math.PI / 2); // ствол
  add(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 5), MAT.gun, 0, 0.115, 0.5, Math.PI / 2); // газовая трубка
  add(new THREE.BoxGeometry(0.05, 0.2, 0.08), MAT.gun, 0, -0.08, 0.2, 0.35);               // магазин
  add(new THREE.BoxGeometry(0.05, 0.08, 0.3), MAT.wood, 0, 0.04, -0.28);                   // приклад
  add(new THREE.BoxGeometry(0.05, 0.12, 0.05), MAT.wood, 0, -0.05, 0.0, -0.3);             // рукоять
  const flash = new THREE.Group();
  [0, Math.PI / 2].forEach((ry) => { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), MAT.flash); f.rotation.y = ry; flash.add(f); });
  flash.position.set(0, 0.085, 0.86);
  flash.visible = false;
  gun.add(flash);
  gun.rotation.set(Math.PI / 2, 1.15, 0);   // поперёк тела, стволом влево-вперёд
  gun.position.set(0, -0.82, 0.06);
  PROPS.ak = gun;
  PROPS.ak.flash = flash;

  // телефон
  const phone = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.13, 0.02), MAT.phone);
  phone.position.set(-0.03, -0.86, 0.08);
  phone.rotation.set(0.3, 0.2, 0.3);
  PROPS.phone = phone;

  for (const k in PROPS) { PROPS[k].visible = false; armR.pivot.add(PROPS[k]); }
}

/* ---------- Альтернативные тела: корова, чизбургер, приставка ---------- */
const ALT = {};
{
  const box = (w, h, d, mat, x, y, z, parent) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };
  // корова (профилем к камере)
  const cow = new THREE.Group();
  box(1.5, 0.72, 0.7, MAT.cow, 0, 0.98, 0, cow);
  const legs = [];
  [[-0.55, 0.22], [-0.55, -0.22], [0.55, 0.22], [0.55, -0.22]].forEach(([x, z]) => legs.push(box(0.18, 0.64, 0.18, MAT.cow, x, 0.32, z, cow)));
  const cowHead = new THREE.Group(); cowHead.position.set(0.95, 1.18, 0); cow.add(cowHead);
  box(0.46, 0.42, 0.42, MAT.cow, 0, 0, 0, cowHead);
  box(0.22, 0.22, 0.34, MAT.pink, 0.3, -0.1, 0, cowHead);
  [-1, 1].forEach((sd) => {
    box(0.14, 0.08, 0.2, MAT.cow, -0.05, 0.12, 0.3 * sd, cowHead);
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 5), MAT.bun); horn.position.set(-0.08, 0.3, 0.16 * sd); horn.rotation.z = 0.3; cowHead.add(horn);
  });
  const udder = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 5), MAT.pink); udder.position.set(-0.25, 0.6, 0); udder.scale.set(1, 0.6, 0.9); cow.add(udder);
  const tail = box(0.05, 0.5, 0.05, MAT.cow, -0.78, 0.9, 0, cow); tail.rotation.z = 0.35;
  cow.rotation.y = -0.35;
  cow.userData = { legs, head: cowHead, tail };
  ALT.cow = cow;

  // чизбургер
  const burger = new THREE.Group();
  const layer = (geo, mat, y, ry = 0) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; m.rotation.y = ry; burger.add(m); return m; };
  layer(new THREE.CylinderGeometry(0.74, 0.68, 0.3, 10), MAT.bun, 0.15);
  layer(new THREE.CylinderGeometry(0.8, 0.8, 0.18, 10), MAT.patty, 0.39);
  layer(new THREE.BoxGeometry(1.5, 0.05, 1.5), MAT.cheese, 0.5, 0.4);
  const let_ = layer(new THREE.CylinderGeometry(0.9, 0.86, 0.09, 12), MAT.lettuce, 0.57);
  { const p = let_.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + (i % 3) * 0.03); let_.geometry.computeVertexNormals(); }
  layer(new THREE.CylinderGeometry(0.72, 0.72, 0.07, 10), MAT.tomato, 0.65);
  layer(new THREE.SphereGeometry(0.8, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), MAT.bun, 0.66);
  burger.scale.setScalar(1.3);
  ALT.burger = burger;

  // приставка
  const con = new THREE.Group();
  box(1.4, 0.26, 1.1, MAT.gray, 0, 0.13, 0, con);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 12), MAT.gray); lid.position.set(-0.15, 0.28, 0.05); con.add(lid);
  box(0.16, 0.05, 0.08, MAT.gray, 0.5, 0.28, -0.3, con);
  box(0.16, 0.05, 0.08, MAT.gray, 0.5, 0.28, -0.1, con);
  box(0.12, 0.03, 0.05, MAT.gun, 0.5, 0.29, 0.25, con);
  [-0.45, -0.2].forEach((x) => box(0.18, 0.1, 0.04, MAT.gun, x, 0.1, 0.56, con));
  box(0.9, 0.04, 0.02, MAT.gun, 0.1, 0.24, 0.56, con);
  con.rotation.set(0.25, -0.5, 0);
  con.position.y = 0.9;
  ALT.console = con;

  for (const k in ALT) { ALT[k].visible = false; scene.add(ALT[k]); }
}

/* ---------- Гуманоиды из боксов: CJ, Стив, Стэтхэм ---------- */
function pixTex(w, h, rows, pal) {
  // rows: строки символов, pal: символ → цвет ('.' = прозрачно не нужно, всё непрозрачно)
  return canvasTex(w, h, (g) => {
    rows.forEach((row, y) => { [...row].forEach((ch, x) => { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); }); });
  });
}
const flat = (hex) => canvasTex(2, 2, (g) => { g.fillStyle = hex; g.fillRect(0, 0, 2, 2); });
const HUMANS = {};
{
  // ---- Стив (8×8 лицо как в оригинале)
  const sp = { h: '#4a2f1b', s: '#c89264', w: '#ffffff', p: '#4c3fa0', n: '#a06a43', m: '#5a3b23' };
  const steveFace = pixTex(8, 8, ['hhhhhhhh', 'hhhhhhhh', 'hssssssh', 'ssssssss', 'swpsspws', 'sssnnsss', 'ssmmmmss', 'ssssssss'], sp);
  const steveSide = pixTex(8, 8, ['hhhhhhhh', 'hhhhhhhh', 'hhhhhhhh', 'ssssssss', 'ssssssss', 'ssssssss', 'ssssssss', 'ssssssss'], sp);
  HUMANS.steve = humanoid({
    dims: { head: [0.5, 0.5, 0.5], torso: [0.5, 0.75, 0.25], arm: [0.25, 0.75, 0.25], leg: [0.25, 0.75, 0.25] },
    face: steveFace, side: steveSide, top: flat(sp.h), skin: flat(sp.s),
    torso: flat('#00a8a8'), arm: flat(sp.s), hand: flat(sp.s), leg: flat('#3c3c8a'), shoe: flat('#6a6a6a'),
  });

  // ---- CJ (16×16 лицо)
  const cp = { h: '#111111', s: '#6b4423', w: '#f3efe6', k: '#0a0a0a', d: '#4d2f16' };
  const cjFace = pixTex(16, 16, [
    'hhhhhhhhhhhhhhhh', 'hhhhhhhhhhhhhhhh', 'hhhhhhhhhhhhhhhh', 'hhhhhhhhhhhhhhhh',
    'ssssssssssssssss', 'sshhhssssshhhsss', 'sswwkssssskwwsss', 'ssssssssssssssss',
    'ssssssdssdssssss', 'sssssssddsssssss', 'ssssssssssssssss', 'ssssshhhhhhsssss',
    'ssssssssssssssss', 'ssssssshhsssssss', 'sssssshhhhhhssss', 'ssssssshhhhsssss',
  ], cp);
  const cjSide = pixTex(16, 16, ['h'.repeat(16), 'h'.repeat(16), 'h'.repeat(16), 'h'.repeat(16), 'h'.repeat(16)].concat(Array(11).fill('s'.repeat(16))), cp);
  const tank = canvasTex(16, 16, (g) => { g.fillStyle = cp.s; g.fillRect(0, 0, 16, 16); g.fillStyle = '#f3efe6'; g.fillRect(0, 2, 16, 14); g.fillRect(2, 0, 3, 2); g.fillRect(11, 0, 3, 2); });
  const jeans = canvasTex(16, 16, (g, w, h) => { noise(g, w, h, [58, 79, 138], 24, 61); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(7, 0, 2, h); });
  HUMANS.cj = humanoid({
    dims: { head: [0.36, 0.42, 0.36], torso: [0.62, 0.72, 0.32], arm: [0.17, 0.72, 0.17], leg: [0.22, 0.86, 0.22] },
    face: cjFace, side: cjSide, top: flat(cp.h), skin: flat(cp.s),
    torso: tank, arm: flat(cp.s), hand: flat(cp.s), leg: jeans, shoe: flat('#e8e8e8'), neck: 0.04,
  });

  // ---- Стэтхэм (16×16 лицо, лысый, щетина, прищур)
  const tp = { s: '#d8ab8c', t: '#a58a78', k: '#141414', b: '#2a2622', m: '#a06a5a', e: '#ede6dc' };
  const stFace = pixTex(16, 16, [
    'tsssssssssssssst', 'ssssssssssssssss', 'ssssssssssssssss', 'ssssssssssssssss',
    'ssbbbbssssbbbbss', 'ssssssssssssssss', 'sskkksssssskkkss', 'ssssssssssssssss',
    'sssssssmmsssssss', 'ssssssssssssssss', 'tsssssssssssssst', 'ttsssmmmmmmsssst',
    'ttssssssssssssst', 'tttssssssssssstt', 'ttttsssssssstttt', 'tttttttttttttttt',
  ], tp);
  const stSide = canvasTex(16, 16, (g, w, h) => { noise(g, w, h, [216, 171, 140], 12, 71); g.fillStyle = 'rgba(60,50,45,.35)'; g.fillRect(0, 10, w, 6); });
  const suit = canvasTex(16, 16, (g) => {
    g.fillStyle = '#141416'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = tp.e; g.beginPath(); g.moveTo(5, 0); g.lineTo(11, 0); g.lineTo(8, 7); g.closePath(); g.fill();
    g.fillStyle = '#5a1520'; g.fillRect(7, 0, 2, 9); g.fillRect(6, 8, 4, 2);
    g.fillStyle = '#26262a'; g.fillRect(4, 0, 1, 16); g.fillRect(11, 0, 1, 16);
  });
  HUMANS.statham = humanoid({
    dims: { head: [0.36, 0.42, 0.36], torso: [0.66, 0.72, 0.34], arm: [0.18, 0.72, 0.18], leg: [0.22, 0.86, 0.22] },
    face: stFace, side: stSide, top: stSide, skin: flat(tp.s),
    torso: suit, arm: flat('#141416'), hand: flat(tp.s), leg: flat('#111114'), shoe: flat('#0a0a0a'), neck: 0.04,
  });

  for (const k in HUMANS) { HUMANS[k].visible = false; scene.add(HUMANS[k]); }
}
function humanoid(o) {
  const g = new THREE.Group();
  const d = o.dims, legH = d.leg[1], torsoH = d.torso[1];
  const M = (tex) => ps1(tex);
  const mesh = (geo, mat) => new THREE.Mesh(geo, mat);
  // ноги (пивот в бедре)
  const legs = [-1, 1].map((sd) => {
    const p = new THREE.Group(); p.position.set(sd * d.leg[0] / 2, legH, 0);
    const geo = new THREE.BoxGeometry(...d.leg); geo.translate(0, -legH / 2, 0);
    p.add(mesh(geo, M(o.leg)));
    const shoe = mesh(new THREE.BoxGeometry(d.leg[0] * 1.08, legH * 0.14, d.leg[2] * 1.35), M(o.shoe));
    shoe.position.set(0, -legH + legH * 0.07, d.leg[2] * 0.12); p.add(shoe);
    g.add(p); return p;
  });
  const torso = mesh(new THREE.BoxGeometry(...d.torso), M(o.torso));
  torso.position.y = legH + torsoH / 2; g.add(torso);
  // руки (пивот в плече)
  const arms = [-1, 1].map((sd) => {
    const p = new THREE.Group(); p.position.set(sd * (d.torso[0] / 2 + d.arm[0] / 2), legH + torsoH - d.arm[0] / 2, 0);
    const geo = new THREE.BoxGeometry(d.arm[0], d.arm[1] - d.arm[0] * 0.7, d.arm[2]); geo.translate(0, -(d.arm[1] - d.arm[0] * 0.7) / 2 + d.arm[0] / 2, 0);
    p.add(mesh(geo, M(o.arm)));
    const hand = mesh(new THREE.BoxGeometry(d.arm[0], d.arm[0] * 0.7, d.arm[2]), M(o.hand));
    hand.position.y = -d.arm[1] + d.arm[0] / 2 + d.arm[0] * 0.35; p.add(hand);
    g.add(p); return p;
  });
  // голова: [+x, -x, +y, -y, +z(лицо), -z]
  const head = new THREE.Group(); head.position.y = legH + torsoH + (o.neck || 0); g.add(head);
  const hm = mesh(new THREE.BoxGeometry(...d.head), [M(o.side), M(o.side), M(o.top), M(o.skin), M(o.face), M(o.side)]);
  hm.position.y = d.head[1] / 2; head.add(hm);
  g.userData = { legs, arms, head, torso, punchT: -1 };
  return g;
}
// idle-анимации гуманоидов
const HUMAN_ANIM = {
  cj(h, t, dt) { // походка на месте, покачивание
    const u = h.userData, w = t * 4.5;
    u.legs[0].rotation.x = Math.sin(w) * 0.5; u.legs[1].rotation.x = -Math.sin(w) * 0.5;
    u.arms[0].rotation.x = -Math.sin(w) * 0.45; u.arms[1].rotation.x = Math.sin(w) * 0.45;
    u.arms[0].rotation.z = 0.12; u.arms[1].rotation.z = -0.12;
    h.position.y = Math.abs(Math.sin(w)) * 0.05;
    u.torso.rotation.z = Math.sin(w) * 0.04;
    u.head.rotation.z = Math.sin(t * 1.3) * 0.08;
  },
  steve(h, t, dt) { // майнкрафт: прямые руки, резкий шаг, иногда прыгает
    const u = h.userData, w = t * 6;
    u.legs[0].rotation.x = Math.sin(w) * 0.75; u.legs[1].rotation.x = -Math.sin(w) * 0.75;
    u.arms[0].rotation.x = -Math.sin(w) * 0.75; u.arms[1].rotation.x = Math.sin(w) * 0.75;
    const j = (t % 2.6) / 2.6;
    h.position.y = j < 0.25 ? Math.sin(j * Math.PI * 4) * 0.45 : 0;
    u.head.rotation.z = 0;
  },
  statham(h, t, dt) { // стоит, руки скрещены, хрустит шеей, медленно наступает
    const u = h.userData;
    u.arms[0].rotation.set(-1.25, 0, 0.55); u.arms[1].rotation.set(-1.25, 0, -0.55);
    u.arms[0].position.z = 0.1; u.arms[1].position.z = 0.1;
    u.legs[0].rotation.x = 0; u.legs[1].rotation.x = 0;
    const c = (t % 3.2) / 3.2;
    u.head.rotation.z = c < 0.12 ? -0.3 * bell(c / 0.12) : c > 0.5 && c < 0.62 ? 0.3 * bell((c - 0.5) / 0.12) : 0;
    h.position.y = 0;
  },
};

/* =========================================================
   Варианты модели
   ========================================================= */
const VARIANTS = {
  weapon: ['knife', 'ak', 'phone', 'none'],
  mask: ['classic', 'bloody', 'dark'],
  robe: ['black', 'blood', 'bone'],
  body: ['ghostface', 'cj', 'steve', 'statham'],
};
const current = { weapon: 'knife', mask: 'classic', robe: 'black', body: 'ghostface' };
const ACTORS = { ghostface: char, ...HUMANS };
const actor = () => ACTORS[current.body];
function applyVariant() {
  for (const k in ACTORS) ACTORS[k].visible = (k === current.body);
  for (const k in PROPS) PROPS[k].visible = (k === current.weapon);
  MAT.mask.uniforms.uMap.value = MASKS[current.mask];
  MAT.cloth.uniforms.uMap.value = CLOTHS[current.robe];
  MAT.clothDS.uniforms.uMap.value = CLOTHS[current.robe];
}
applyVariant();

/* =========================================================
   Пост-обработка: низкое разрешение + дизеринг + глитч
   ========================================================= */
const rt = new THREE.WebGLRenderTarget(320, 240, {
  minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true,
});
const postScene = new THREE.Scene();
const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const postMat = new THREE.ShaderMaterial({
  uniforms: { tDiffuse: { value: rt.texture }, uRes: { value: new THREE.Vector2(320, 240) }, uTime: shared.uTime, uGlitch: shared.uGlitch, uInvert: { value: 0 }, uStatic: { value: 0 }, uTint: { value: new THREE.Vector3(1, 1, 1) } },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uTime, uGlitch, uInvert, uStatic; uniform vec3 uTint;
    varying vec2 vUv;
    float d2(vec2 p){ return mod(2.0*mod(p.x,2.0) + 3.0*mod(p.y,2.0), 4.0); }
    float bayer(vec2 p){ p = floor(p); return (4.0*d2(mod(p,2.0)) + d2(floor(p/2.0)) + 0.5) / 16.0; }
    float hash(float n){ return fract(sin(n) * 43758.5453); }
    void main(){
      vec2 uv = vUv;
      vec3 c;
      if (uGlitch > 0.0) {
        float line = floor(uv.y * uRes.y / 4.0);
        float r = hash(line + floor(uTime * 20.0));
        if (r < uGlitch * 0.5) uv.x += (r - 0.25) * 0.3 * uGlitch;
        vec2 px = floor(uv * uRes);
        float sh = uGlitch * 3.0 / uRes.x;
        c.r = texture2D(tDiffuse, (px + 0.5) / uRes + vec2(sh, 0.0)).r;
        c.g = texture2D(tDiffuse, (px + 0.5) / uRes).g;
        c.b = texture2D(tDiffuse, (px + 0.5) / uRes - vec2(sh, 0.0)).b;
        float d = bayer(px) - 0.5;
        c = floor(c * 31.0 + d * 0.9 + 0.5) / 31.0;
        // редкие белые полосы
        if (hash(line * 3.1 + floor(uTime * 30.0)) > 0.985) c = vec3(0.9);
      } else {
        vec2 px = floor(uv * uRes);
        c = texture2D(tDiffuse, (px + 0.5) / uRes).rgb;
        float d = bayer(px) - 0.5;
        // 5 бит на канал + упорядоченный дизеринг
        c = floor(c * 31.0 + d * 0.9 + 0.5) / 31.0;
      }
      c = mix(c, 1.0 - c, uInvert) * uTint;
      if (uStatic > 0.0) {
        vec2 px = floor(vUv * uRes);
        float n = hash(px.x * 13.1 + px.y * 7.7 + floor(uTime * 60.0));
        c = mix(c, vec3(step(0.5, n)) * 0.85, uStatic);
      }
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
  char.position.x = mobile ? 0 : 1.0;
  camera.position.set(mobile ? 0 : 0.35, 1.5, mobile ? 6.4 : 4.6);
}

/* =========================================================
   Позы, жесты, действия
   ========================================================= */
// поза = углы рук + добавки к голове/телу. Текущая плавно догоняет целевую.
const P0 = () => ({ lx: 0.12, ly: 0, lz: 0.28, rx: -1.35, ry: 0, rz: -0.25, hx: 0, hy: 0, hz: 0, by: 0, bz: 0, yaw: 0, look: 1 });
const pose = P0();

// базовая поза зависит от того, что в руке
const BASE = {
  knife: { rx: -1.35, rz: -0.25, lx: 0.12, lz: 0.28 },
  ak:    { rx: -1.2, rz: -0.15, lx: -1.0, lz: -0.6 },
  phone: { rx: -2.55, rz: -0.15, lx: 0.12, lz: 0.28, hz: 0.18, hy: -0.15 },
  none:  { rx: 0.12, rz: -0.28, lx: 0.12, lz: 0.28 },
};

// жесты: fn(k, T) пишет в T (k = 0..1 прогресс). dur в секундах
const bell = (k) => Math.sin(Math.PI * Math.min(1, Math.max(0, k)));       // 0→1→0
const ease = (k) => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
const GESTURES = {
  wave:   { dur: 2.4, fn: (k, T) => { const e = bell(k); T.lz = 0.28 + e * 2.5 + Math.sin(k * Math.PI * 7) * 0.35 * e; T.hz = 0.15 * e; } },
  shrug:  { dur: 1.8, fn: (k, T) => { const e = bell(k); T.lz = 0.28 + 0.75 * e; T.rz = T.rz - 0.7 * e; T.lx = -0.4 * e; T.rx = T.rx * (1 - e) - 0.4 * e; T.hz = 0.22 * e; T.by = 0.04 * e; } },
  look:   { dur: 2.8, fn: (k, T) => { T.look = 0; T.hy = Math.sin(k * Math.PI * 2) * 0.9; T.hx = 0.05; } },
  inspect:{ dur: 2.6, fn: (k, T) => { const e = bell(k); T.rx = T.rx * (1 - e) - 2.15 * e; T.rz = T.rz * (1 - e) + 0.4 * e; T.hx = 0.35 * e; T.hy = -0.25 * e; T.look = 1 - e; } },
  point:  { dur: 1.8, fn: (k, T) => { const e = bell(k); T.rx = T.rx * (1 - e) - 1.62 * e; T.rz = T.rz * (1 - e) - 0.05 * e; T.hx = -0.1 * e; } },
  nod:    { dur: 1.6, fn: (k, T) => { T.hx = Math.sin(k * Math.PI * 4) * 0.22 * bell(k); } },
  no:     { dur: 1.6, fn: (k, T) => { T.hy = Math.sin(k * Math.PI * 5) * 0.35 * bell(k); T.look = 0.3; } },
  tpose:  { dur: 2.2, fn: (k, T) => { const e = bell(k); T.lz = 0.28 + (1.57 - 0.28) * e; T.rz = T.rz * (1 - e) - 1.57 * e; T.lx = T.lx * (1 - e); T.rx = T.rx * (1 - e); T.hx = 0; } },
  spin:   { dur: 1.3, fn: (k, T) => { T.yaw = ease(k) * Math.PI * 2; T.by = 0.06 * bell(k); T.look = 0; } },
  crouch: { dur: 2.0, fn: (k, T) => { const e = bell(k); T.by = -0.22 * e; T.hx = -0.2 * e; T.lz = 0.28 + 0.3 * e; } },
  dance:  { dur: 3.0, fn: (k, T) => { const e = bell(k); const w = k * Math.PI * 6; T.by = Math.abs(Math.sin(w)) * 0.06 * e; T.hz = Math.sin(w) * 0.2 * e; T.lz = 0.28 + (0.6 + Math.sin(w) * 0.5) * e; T.rz = T.rz - (0.6 - Math.sin(w) * 0.5) * e; T.yaw = Math.sin(w / 2) * 0.35 * e; } },
};
// жесты, которые не сочетаются с тем, что в руке
const GESTURE_BLOCK = { ak: ['inspect', 'point', 'tpose', 'dance'], phone: ['inspect', 'point', 'tpose', 'shrug', 'dance'] };

let gesture = null;        // { name, t }
let action = null;         // { name, t, shot } — по клику
let nextGestureAt = 1e9;
let nextSwapAt = 1e9;
let glitchUntil = 0, swapAt = 0, pendingSwap = null;
let camShake = 0;

function startGesture(name) {
  if (reduceMotion) return;
  const block = GESTURE_BLOCK[current.weapon] || [];
  if (!name || block.includes(name)) name = pick(Object.keys(GESTURES).filter((n) => !block.includes(n)), gesture?.name);
  gesture = { name, t: 0 };
}

// клик: действие зависит от оружия
function attack() {
  if (current.body !== 'ghostface') { actor().userData.punchT = 0; glitchName(); return; }
  if (action) return;
  const map = { knife: 'stab', ak: 'fire', phone: 'hangup', none: 'punch' };
  action = { name: map[current.weapon], t: 0, shot: -1 };
  glitchName();
}
const ACTIONS = {
  stab:   { dur: 0.5, fn: (k, T) => { const e = (k < 0.35 ? k / 0.35 : Math.max(0, 1 - (k - 0.35) / 0.65)) ** 2; T.rx = -1.35 - 0.95 * e; T.rz = -0.25 - 0.35 * e; T.hx = -0.25 * e; T.bz = 0.25 * e; } },
  fire:   { dur: 0.55, fn: (k, T, A) => {
    const shot = Math.floor(k * 4), ph = (k * 4) % 1, rec = Math.max(0, 1 - ph * 3);
    T.rx = -1.2 + 0.12 * rec; T.lx = -1.0 + 0.1 * rec; T.hx = 0.08 * rec; T.bz = -0.06 * rec;
    PROPS.ak.flash.visible = ph < 0.35 && shot < 3;
    PROPS.ak.flash.rotation.z = shot * 1.1;
    if (shot !== A.shot && shot < 3) { A.shot = shot; camShake = 0.07; }
  } },
  hangup: { dur: 1.2, fn: (k, T) => { const e = bell(k); T.rx = -2.55 + 1.3 * e; T.rz = -0.15 - 0.5 * e; T.hz = 0.18 - 0.4 * e; T.hx = 0.2 * e; } },
  punch:  { dur: 0.45, fn: (k, T) => { const e = bell(k) ** 1.5; T.rx = 0.12 - 1.75 * e; T.rz = -0.28 + 0.2 * e; T.bz = 0.2 * e; T.hx = -0.15 * e; } },
};

function swapVariant(kind, value) {
  if (pendingSwap) return;
  // если на сцене не Ghostface — чаще меняем тело обратно; тело само по себе выпадает реже
  if (!kind) kind = current.body !== 'ghostface' ? (Math.random() < 0.7 ? 'body' : pick(['weapon', 'mask', 'robe'])) : pick(['weapon', 'mask', 'robe', 'body', 'weapon', 'mask', 'robe']);
  if (!VARIANTS[kind].includes(value)) value = kind === 'body' ? pick(['ghostface', 'ghostface', 'cj', 'steve', 'statham'].filter((v) => v !== current.body)) : pick(VARIANTS[kind], current[kind]);
  pendingSwap = { kind, value };
  const now = shared.uTime.value;
  glitchUntil = now + 0.45;
  swapAt = now + 0.2;
  glitchName();
}
const LOG_NAMES = {
  weapon: { knife: 'KNIFE', ak: 'AK47', phone: 'PHONE', none: 'HANDS' },
  mask: { classic: 'MASK_A', bloody: 'MASK_BLOOD', dark: 'MASK_NEG' },
  robe: { black: 'ROBE_BLK', blood: 'ROBE_RED', bone: 'ROBE_BONE' },
};
function logSwap() {
  const el = document.getElementById('log');
  if (!el) return;
  const bodies = { cj: 'CJ.DFF', steve: 'STEVE.PNG', statham: 'STATHAM.TMD' };
  const nm = current.body !== 'ghostface' ? bodies[current.body] : `GHOSTFACE_${LOG_NAMES.mask[current.mask]}_${LOG_NAMES.robe[current.robe]}_${LOG_NAMES.weapon[current.weapon]}.TMD`;
  typewriter(el, `> LOADED ${nm}`, 14);
}

/* =========================================================
   Ивенты — редкие приколы поверх всего
   ========================================================= */
// E = дополнительная трансформация персонажа, плавно догоняет цель
const E0 = () => ({ rx: 0, rz: 0, y: 0, z: 0, scale: 1, headScale: 1, headSpin: 0, yaw: 0 });
const evt = E0();
let evtRate = 7;
let clones = [];
const EVENTS = {
  nomask:    { dur: 4, glitch: true, start() { mask.visible = false; eyes.visible = true; }, end() { mask.visible = true; eyes.visible = false; } },
  hoodoff:   { dur: 4.5, glitch: true, start() { hood.visible = tip.visible = headVoid.visible = false; headSkin.visible = true; }, end() { hood.visible = tip.visible = headVoid.visible = true; headSkin.visible = false; } },
  upsidedown:{ dur: 4, solo: true, frame(k, T) { T.rz = Math.PI; T.y = 2.75; } },
  cow:       { dur: 5.5, solo: true, alt: 'cow', frame(k, t) { const c = ALT.cow.userData; c.legs.forEach((l, i) => { l.rotation.z = Math.sin(t * 7 + (i % 2) * Math.PI) * 0.35; }); c.head.rotation.z = Math.sin(t * 2) * 0.15; c.tail.rotation.x = Math.sin(t * 5) * 0.4; ALT.cow.position.y = Math.abs(Math.sin(t * 7)) * 0.04; } },
  burger:    { dur: 5, solo: true, alt: 'burger', frame(k, t) { ALT.burger.rotation.y = t * 0.8; ALT.burger.position.y = 0.4 + Math.sin(t * 2) * 0.1; } },
  console:   { dur: 5, solo: true, alt: 'console', frame(k, t) { ALT.console.rotation.y = -0.5 + Math.sin(t * 0.7) * 0.6; ALT.console.position.y = 0.9 + Math.sin(t * 1.5) * 0.08; } },
  giant:     { dur: 3.5, frame(k, T) { T.scale = 1.9; T.z = -2.4; } },
  tiny:      { dur: 3.5, frame(k, T) { T.scale = 0.35; T.headScale = 1; } },
  bighead:   { dur: 3.5, frame(k, T) { T.headScale = 2.2; } },
  wireframe: { dur: 2.5, start() { Object.values(MAT).forEach((m) => { m.wireframe = true; }); }, end() { Object.values(MAT).forEach((m) => { m.wireframe = false; }); } },
  invert:    { dur: 1.6, start() { postMat.uniforms.uInvert.value = 1; }, end() { postMat.uniforms.uInvert.value = 0; } },
  static:    { dur: 0.9, solo: true, start() { postMat.uniforms.uStatic.value = 1; }, end() { postMat.uniforms.uStatic.value = 0; swapVariant(); } },
  clones:    { dur: 4.5, glitch: true,
    start() { [[-1.7, 0.6], [1.7, 0.4], [-0.9, -1.6], [1.1, -1.8]].forEach(([dx, dz]) => { const a = actor(); const c = a.clone(true); c.position.set(a.position.x + dx, 0, dz); c.rotation.y = a.rotation.y + rand(-0.6, 0.6); scene.add(c); clones.push(c); }); },
    frame(k, T, t) { clones.forEach((c, i) => { c.position.y = Math.sin(t * 1.4 + i) * 0.02; }); },
    end() { clones.forEach((c) => scene.remove(c)); clones = []; } },
  float:     { dur: 4.5, frame(k, T) { T.y = 0.9 + Math.sin(k * Math.PI * 3) * 0.15; T.yaw = ease(k) * Math.PI * 2; } },
  fall:      { dur: 3.2, solo: true, frame(k, T) { T.rx = k < 0.75 ? Math.PI / 2 : 0; evtRate = k < 0.15 ? 12 : 5; } },
  spinhead:  { dur: 2.2, solo: true, frame(k, T) { T.headSpin = ease(k) * Math.PI * 4; } },
  sink:      { dur: 3.2, solo: true, frame(k, T) { T.y = -2.0 * bell(k); } },
  disco:     { dur: 4.5, start() { startGesture('dance'); }, frame(k, T, t) { const h = (t * 1.5) % 1; postMat.uniforms.uTint.value.set(0.7 + 0.6 * Math.abs(Math.sin(h * Math.PI * 2)), 0.7 + 0.6 * Math.abs(Math.sin(h * Math.PI * 2 + 2.1)), 0.7 + 0.6 * Math.abs(Math.sin(h * Math.PI * 2 + 4.2))); }, end() { postMat.uniforms.uTint.value.set(1, 1, 1); } },
  jumpscare: { dur: 1.1, solo: true, frame(k, T) { const e = k < 0.7 ? 1 : 0; T.z = 2.6 * e; T.scale = 1 + 0.3 * e; T.headScale = 1 + 0.5 * e; evtRate = 30; if (k < 0.7) camShake = 0.08; } },
};
const EVENT_LOG = { nomask: 'MASK_NULL', hoodoff: 'HOOD_OFF', upsidedown: 'GRAVITY_INV', cow: 'COW.TMD', burger: 'CHEESEBURGER.TMD', console: 'CONSOLE.TMD', giant: 'SCALE_230', tiny: 'SCALE_035', bighead: 'BIGHEAD_MODE', wireframe: 'DEBUG_WIRE', invert: 'PALETTE_INV', static: 'NO SIGNAL', clones: 'INSTANCES_5', float: 'NOCLIP', fall: 'RAGDOLL', spinhead: 'EXORCIST', sink: 'FLOOR_CLIP', disco: 'DISCO', jumpscare: 'BOO' };
let event = null;           // { name, t, started }
let nextEventAt = 1e9;
let lastEvent = null;
function startEvent(name) {
  if (reduceMotion || event) return;
  const onlyGhost = ['nomask', 'hoodoff'];
  const okNames = Object.keys(EVENTS).filter((n) => current.body === 'ghostface' || !onlyGhost.includes(n));
  if (!EVENTS[name] || !okNames.includes(name)) name = pick(okNames, lastEvent);
  lastEvent = name;
  const ev = EVENTS[name];
  event = { name, t: 0, started: false };
  if (ev.solo) gesture = null;
  if (ev.alt || ev.glitch) glitchUntil = shared.uTime.value + 0.45;
  const el = document.getElementById('log');
  if (el) typewriter(el, `> EVENT ${EVENT_LOG[name]}`, 14);
}
function tickEvent(dt, t, T) {
  if (!event) { evtRate = 7; return; }
  const ev = EVENTS[event.name];
  const delay = (ev.alt || ev.glitch) ? 0.2 : 0;
  event.t += dt;
  if (!event.started && event.t >= delay) {
    event.started = true;
    ev.start?.();
    if (ev.alt) { actor().visible = false; ALT[ev.alt].visible = true; ALT[ev.alt].position.x = char.position.x; }
  }
  if (event.started) {
    const k = Math.min(1, (event.t - delay) / ev.dur);
    if (ev.alt) ev.frame?.(k, t); else ev.frame?.(k, T, t);
    if ((ev.alt || ev.glitch) && event.t >= delay + ev.dur - 0.25 && t > glitchUntil) glitchUntil = t + 0.4;
    if (event.t >= delay + ev.dur) {
      ev.end?.();
      if (ev.alt) { actor().visible = true; ALT[ev.alt].visible = false; }
      event = null;
      nextEventAt = t + rand(...CONFIG.eventEvery);
    }
  }
}

const mouse = new THREE.Vector2(0, 0);
const look = new THREE.Vector2(0, 0);
addEventListener('pointermove', (e) => { mouse.set((e.clientX / W) * 2 - 1, (e.clientY / H) * 2 - 1); });
addEventListener('pointerdown', (e) => {
  if (!started || e.target.closest('.item, button, a')) return;
  attack();
});
addEventListener('dblclick', (e) => {
  if (!started || e.target.closest('.item, button, a')) return;
  swapVariant();
});

const clock = new THREE.Clock();
let started = false;
// консольные рычаги: GF.swap('weapon','ak'), GF.gesture('wave'), GF.attack()
window.GF = { swap: swapVariant, gesture: startGesture, event: startEvent, attack, current, props: PROPS, gestures: Object.keys(GESTURES), events: Object.keys(EVENTS), variants: VARIANTS };
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  shared.uTime.value = t;

  /* ---- планировщик ---- */
  if (started && !reduceMotion) {
    const solo = event && EVENTS[event.name].solo;
    if (!gesture && !action && !solo && current.body === 'ghostface' && t > nextGestureAt) startGesture();
    if (!event && t > nextSwapAt) { swapVariant(); nextSwapAt = t + rand(...CONFIG.swapEvery); }
    if (!event && !action && t > nextEventAt) startEvent();
  }
  if (pendingSwap && t >= swapAt) {
    current[pendingSwap.kind] = pendingSwap.value;
    applyVariant();
    logSwap();
    pendingSwap = null;
    if (gesture && (GESTURE_BLOCK[current.weapon] || []).includes(gesture.name)) gesture = null;
  }
  shared.uGlitch.value = t < glitchUntil ? 0.6 + 0.4 * Math.sin(t * 60) : 0;

  /* ---- целевая поза ---- */
  const T = P0();
  Object.assign(T, BASE[current.weapon]);
  if (gesture) {
    gesture.t += dt;
    const g = GESTURES[gesture.name];
    g.fn(Math.min(1, gesture.t / g.dur), T);
    if (gesture.t >= g.dur) { gesture = null; nextGestureAt = t + rand(...CONFIG.gestureEvery); }
  }
  if (action) {
    action.t += dt;
    const a = ACTIONS[action.name];
    a.fn(Math.min(1, action.t / a.dur), T, action);
    if (action.t >= a.dur) { action = null; PROPS.ak.flash.visible = false; }
  }
  // действия резкие, жесты плавные
  const rate = action ? 22 : 7;
  for (const k in pose) pose[k] += (T[k] - pose[k]) * Math.min(1, dt * rate);
  // ивенты
  const ET = E0();
  tickEvent(dt, t, ET);
  for (const k in evt) evt[k] += (ET[k] - evt[k]) * Math.min(1, dt * evtRate);

  /* ---- взгляд за курсором (на тачах — сам оглядывается) ---- */
  const tx = isTouch ? Math.sin(t * 0.5) * 0.5 : mouse.x;
  const ty = isTouch ? Math.sin(t * 0.33) * 0.3 : mouse.y;
  look.x += (tx - look.x) * Math.min(1, dt * 5);
  look.y += (ty - look.y) * Math.min(1, dt * 5);
  const breathe = reduceMotion ? 0 : 1;
  if (current.body === 'ghostface') {
    head.rotation.set(look.y * 0.32 * pose.look + pose.hx, look.x * 0.55 * pose.look + pose.hy + evt.headSpin, pose.hz);
    head.scale.setScalar(evt.headScale);
    char.rotation.set(evt.rx, look.x * 0.18 + (mobile ? 0 : -0.25) + pose.yaw + evt.yaw, evt.rz);
    char.scale.setScalar(evt.scale);
    char.position.y = Math.sin(t * 1.4) * 0.015 * breathe + pose.by + evt.y;
    char.position.z = pose.bz + evt.z;
  } else {
    const h = actor(), u = h.userData;
    HUMAN_ANIM[current.body](h, reduceMotion ? 0 : t, dt);
    if (u.punchT >= 0) { u.punchT += dt; const e = bell(u.punchT / 0.4); u.arms[1].rotation.x = -1.7 * e; u.arms[1].rotation.z = -0.2 * e; u.torso.rotation.y = -0.3 * e; if (u.punchT > 0.4) { u.punchT = -1; u.torso.rotation.y = 0; } }
    u.head.rotation.x = look.y * 0.3; u.head.rotation.y = look.x * 0.5 + evt.headSpin;
    u.head.scale.setScalar(evt.headScale);
    h.rotation.set(evt.rx, look.x * 0.18 + (mobile ? 0 : -0.25) + evt.yaw, evt.rz);
    h.scale.setScalar(evt.scale);
    h.position.x = char.position.x; h.position.y += evt.y; h.position.z = evt.z;
  }

  /* ---- дыхание ---- */
  shoulders.scale.y = 0.4 + Math.sin(t * 1.4) * 0.012 * breathe;
  armL.pivot.rotation.set(pose.lx, pose.ly, pose.lz + Math.sin(t * 0.9) * 0.03 * breathe);
  armR.pivot.rotation.set(pose.rx + Math.sin(t * 1.1) * 0.04 * breathe, pose.ry, pose.rz);

  /* ---- камера ---- */
  const camDrift = reduceMotion ? 0 : 1;
  camShake = Math.max(0, camShake - dt * 0.4);
  camera.position.x += ((mobile ? 0 : 0.35) + Math.sin(t * 0.25) * 0.12 * camDrift - camera.position.x) * 0.05;
  camera.position.y = 1.5 + Math.sin(t * 0.4) * 0.05 * camDrift + (Math.random() - 0.5) * camShake;
  camera.lookAt(char.position.x + (Math.random() - 0.5) * camShake, 1.3, 0);

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
  // секретки: G — жест, S — смена чего-нибудь, W — смена оружия
  if (e.key === 'g') startGesture();
  if (e.key === 's') swapVariant();
  if (e.key === 'w') swapVariant('weapon');
  if (e.key === 'e') startEvent();
  if (e.key === 'b') swapVariant('body');
});

function glitchName() {
  const n = $('name');
  n.classList.remove('glitch');
  void n.offsetWidth;
  n.classList.add('glitch');
  n.addEventListener('animationend', () => n.classList.remove('glitch'), { once: true });
}
function scheduleGlitch() {
  setTimeout(() => { if (!reduceMotion) glitchName(); scheduleGlitch(); }, 6000 + Math.random() * 6000);
}

function typewriter(el, text, speed = 38) {
  if (el._tw) clearTimeout(el._tw);
  el.textContent = '';
  let i = 0;
  const tick = () => {
    el.textContent = text.slice(0, ++i) + (i < text.length ? '█' : '');
    if (i < text.length) el._tw = setTimeout(tick, speed + (text[i - 1] === ' ' ? 60 : 0));
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
  nextGestureAt = clock.elapsedTime + rand(2.5, 5);
  nextSwapAt = clock.elapsedTime + rand(...CONFIG.swapEvery);
  nextEventAt = clock.elapsedTime + rand(6, 12);
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
