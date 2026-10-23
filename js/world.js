// The 3D adventure: nine separate worlds (one per unit), joined by portals.
// Each world has its own road, landmarks, weather and creatures. Mentors give
// lessons as quests, scroll pedestals hold NT readings, a guardian holds each
// world's gate until the unit's boss is beaten, and wandering Shades of
// Forgetting are fought by answering vocabulary questions (spaced review).
import * as THREE from './vendor/three.module.min.js';
import { createStage } from './stage.js';
import { DEFS, R, fbm, vnoise, smooth, hash, rng } from './worlds.js';
import { makeProps } from './props.js';
import { makeFX } from './fx.js';
import { makeSideQuests } from './sidequests.js';
import { makeVenues, venueOrder, moodAtmos, moodMotes, MOODS } from './venues.js';
import { tallyRaiders, raiderMesh, animateRaider } from './raiders.js';

const KG = window.KG, E = KG.engine, U = KG.util;
const W = KG.world = { ok: false, show() {}, hide() {}, onLessonDone() {} };
const esc = U.esc;
const NZ = KG.units.length; // 9 worlds

const ZONES = [
  { name: 'Alphabet Hollow', grass: 0x6fae4f, leaf: [0x4f8f3a, 0x6aa84a], mentor: ['Ἀλφαῖος', 'Alphaeus', 'the village elder'], robe: 0x7a5230, guard: 'Stone Warden of the Hollow', greet: ['Χαῖρε, μαθητά!', 'Greetings, student!'] },
  { name: 'The Wordwood', grass: 0x3f7f3a, leaf: [0x2f6a2f, 0x3d7d34], mentor: ['Σοφία', 'Sophia', 'keeper of the Wordwood'], robe: 0x2f6a5a, guard: 'The Bramble Troll', greet: ['Εἰρήνη σοι.', 'Peace to you.'] },
  { name: 'Fields of the Article', grass: 0xb4a24a, leaf: [0x8f8a3a, 0xa89a40], mentor: ['Βαρναβᾶς', 'Barnabas', 'the field-steward'], robe: 0x8a6a2a, guard: 'The Golden Sentinel', greet: ['Χαῖρε!', 'Hello!'] },
  { name: 'Verb River', grass: 0x5fa060, leaf: [0x3f8a5a, 0x5a9a4a], mentor: ['Λυδία', 'Lydia', 'the river merchant'], robe: 0x7a2f6a, guard: 'The River Colossus', greet: ['Καλῶς ἦλθες.', 'Welcome.'] },
  { name: "Builders' Ridge", grass: 0x889a58, leaf: [0x5f7a3a, 0x7a8a4a], mentor: ['Ἀκύλας', 'Aquila', 'the tent-maker'], robe: 0x5a4a8a, guard: 'The Iron Gatekeeper', greet: ['Χαῖρε, φίλε.', 'Hello, friend.'] },
  { name: 'Ruins of Time', grass: 0xa08a5a, leaf: [0x7a6a3a, 0x8a7a4a], mentor: ['Τιμόθεος', 'Timothy', 'the young chronicler'], robe: 0xa0522d, guard: 'The Hourglass Titan', greet: ['Ἡ χάρις μετὰ σοῦ.', 'Grace be with you.'] },
  { name: 'Mirror Lake', grass: 0x5f9f7f, leaf: [0x2f7a6a, 0x4a8a6a], mentor: ['Πρίσκιλλα', 'Priscilla', 'the lake-dweller'], robe: 0x2e7d7d, guard: 'The Mirror Knight', greet: ['Εἰρήνη ὑμῖν.', 'Peace to you all.'] },
  { name: 'Declension Peaks', grass: 0x93a39b, leaf: [0x4a6a5a, 0x5a7a6a], mentor: ['Σίλας', 'Silas', 'the mountain guide'], robe: 0x6a5a2e, guard: 'The Frost Giant', greet: ['Χαίρετε!', 'Rejoice!'] },
  { name: 'The Great Library', grass: 0x7fae5f, leaf: [0x5a8a3a, 0x7a9a4a], mentor: ['Λουκᾶς', 'Luke', 'the librarian'], robe: 0x9a3f3f, guard: 'The Guardian of the Library', greet: ['Κράτιστε Θεόφιλε!', 'Most excellent Theophilus!'] },
];
const GOLEM_COL = [0x8a8a8a, 0x5a7a3a, 0xc9a43a, 0x4a7aa8, 0x5a5a66, 0xa08060, 0xc0c8d8, 0xcfe0ff, 0xe0c060];

// ── state ─────────────────────────────────────────────────────
function ws() {
  const S = E.state;
  if (!S.world) S.world = { zone: 0, x: null, z: null, letters: [], coins: { day: '', got: [] }, intro: false, wisps: 0 };
  const w = S.world;
  // saves from the single-valley world: move to the start of the same world
  if (w.zone === undefined) { w.zone = Math.max(0, Math.min(NZ - 1, Math.floor(-(w.z || 0) / 90))); w.x = w.z = null; }
  if (w.coins.day !== U.day()) w.coins = { day: U.day(), got: [] };
  w.cine = w.cine || [];
  return w;
}
const gateOpen = i => E.state.settings.unlockAll || E.stars(KG.units[i].nodes[KG.units[i].nodes.length - 1].id) > 0;
const reachable = i => i === 0 || gateOpen(i - 1);

// ── renderer, scene, camera ──────────────────────────────────
let renderer, scene, camera, sun, clock;
const root = document.getElementById('world');
root.insertAdjacentHTML('beforeend', '<div class="wvig"></div>');
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  document.dispatchEvent(new Event('world-failed'));
  throw e;
}
const mobile = matchMedia('(pointer: coarse)').matches;
// "Low" graphics (Profile → Settings) trades grass, shadows and effects for smoothness on older phones
const LOW = (E.state.settings || {}).gfx === 'low';
const MAXPR = Math.min(devicePixelRatio, LOW ? 1 : mobile ? 1.5 : 2);
let pixelRatio = MAXPR;
renderer.setPixelRatio(pixelRatio);
renderer.shadowMap.enabled = !LOW;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
root.prepend(renderer.domElement);
renderer.domElement.className = 'world-canvas';

scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xa9d4f0, 60, 230);
camera = new THREE.PerspectiveCamera(60, 1, 0.1, 600);
clock = new THREE.Clock();

// painted sky with sun, clouds and stars (js/fx.js), set for each world
const FX = makeFX(THREE, { LOW });
const sky = FX.sky(500);
scene.add(sky);
// sparkles and dust
const SPK = FX.sparks(scene), DUST = FX.sparks(scene, LOW ? 80 : 200, { additive: false });
const CRIT = FX.critters(scene); // birds overhead, butterflies by the path
const ENV = FX.skyEnv(renderer, scene); // soft reflections of the sky on metal and gems
// a soft glow around bright lights; switched off on low graphics, and dropped if frames run slow
const BLOOM = FX.bloom(renderer); BLOOM.enabled = BLOOM.enabled && !LOW;
const bloomPerf = { acc: 0, n: 0, t: 0 };
const ARENA = FX.arena(scene); // the rune circle of a shade battle
const BURSTS = FX.bursts(scene); // light pillars when a foe is banished
const HILLS = FX.farHills(scene); // far mountain ranges on the horizon
const STARS = FX.shootingStars(scene); // a shooting star now and then at night
const SHAFTS = FX.sunShafts(scene); // sunbeams slanting down among the trees
// at night the hero's wand gives a soft warm glow (always in the scene, so switching it on costs nothing)
const heroLight = new THREE.PointLight(0xffcf8a, 0, 10, 1.6); scene.add(heroLight);
const POND = FX.pondLife(scene, () => { const L = []; WG.traverse(o => { if (o.isMesh && o.material === waterMat) L.push(o); }); return L; }); // ripples and leaping fish
const hemi = new THREE.HemisphereLight(0xdff0ff, 0x5a6a3a, 1.1);
scene.add(hemi);
const ATMOS = [
  { top: 0x3f7fd0, mid: 0xaad8f4, bot: 0xe8e0c8, sun: 0xfff1d6, sunI: 2.2, hemi: 1.1, fog: [60, 200], clouds: 0.45, water: [0x1f6a9a, 0x5ac0e0] },   // Alphabet Hollow: bright morning
  { top: 0x2f5a4a, mid: 0x8fbfa4, bot: 0xd8e8d0, sun: 0xe8ffd8, sunI: 1.5, hemi: 1.0, fog: [18, 110], clouds: 0.7 },   // Wordwood: green mist
  { top: 0x5a7ab8, mid: 0xf0d8a0, bot: 0xf8e8c0, sun: 0xffd890, sunI: 2.4, hemi: 1.1, fog: [60, 220], clouds: 0.4, sunDir: [0.5, 0.18, -0.85] },   // Fields: golden hour
  { top: 0x2a78d8, mid: 0x9ad0f8, bot: 0xe0f0f8, sun: 0xffffff, sunI: 2.4, hemi: 1.2, fog: [70, 230], clouds: 0.35, water: [0x14648f, 0x4ac8d8] },   // Verb River: clear blue
  { top: 0x6a7888, mid: 0xc0c8d0, bot: 0xe0e0e0, sun: 0xf0f0f0, sunI: 1.6, hemi: 1.2, fog: [40, 170], clouds: 0.85 },   // Builders' Ridge: overcast
  { top: 0x3a2a6a, mid: 0xf0a070, bot: 0xf8d0a0, sun: 0xffa060, sunI: 2.0, hemi: 0.9, fog: [45, 190], clouds: 0.45, stars: 0.4, sunDir: [-0.3, 0.08, -0.95] },   // Ruins of Time: dusk
  { top: 0x101a46, mid: 0x5a70b0, bot: 0xb0c0e0, sun: 0xc0d0ff, sunI: 1.3, hemi: 0.85, fog: [40, 190], clouds: 0.3, stars: 1, sunDir: [0.2, 0.3, -0.9], water: [0x18285a, 0x4a6aa8] },  // Mirror Lake: twilight, moonlit
  { top: 0x7a98c8, mid: 0xe0e8f0, bot: 0xffffff, sun: 0xffffff, sunI: 2.0, hemi: 1.3, fog: [30, 170], clouds: 0.6 },   // Peaks: cold white
  { top: 0x4a3a8a, mid: 0xf8c070, bot: 0xfff0c8, sun: 0xffc860, sunI: 2.3, hemi: 1.1, fog: [60, 220], clouds: 0.4, stars: 0.15, sunDir: [0.1, 0.12, -0.99] },   // Great Library: golden sunset
];
// MOOD: how far the day has moved on (each cottage you step out of moves it on); INDOOR: inside a room
let MOOD = 0, INDOOR = null, DOOR = null, EXPO = 1, FLASH = 0, SHAFT = { k: 1 };
function setAtmosphere(i) {
  const A = moodAtmos(ATMOS[i], MOOD), mid = new THREE.Color(A.mid);
  sky.userData.set(A);
  FX.cloudShade.value = Math.min(1, 0.3 + (A.clouds || 0) * 1.2) * ((A.stars || 0) > 0.5 ? 0.3 : 1);
  HILLS.setColors(A.mid, A.top, A.stars || 0);
  ENV.set(A.top, A.mid, new THREE.Color(A.mid).lerp(new THREE.Color(0x4a5a3a), 0.6));
  FX.setNight(INDOOR ? 0 : (A.stars || 0) > 0.5 ? 1 : (A.stars || 0) > 0.15 || A.sunI < 2.1 ? 0.4 : 0);
  FX.setLight(A);
  SHAFT = { k: (A.stars || 0) > 0.5 || (A.clouds || 0) > 0.8 ? 0 : 1, dir: A.sunDir };
  try { VEN.setDaylight((A.stars || 0) > 0.5 ? 0.35 : Math.min(1, A.sunI / 2.2), (A.stars || 0) > 0.5 ? 0x8aa8ff : 0xffffff); } catch (e) { /* the venues aren't made yet */ }
  waterMat.userData.setColors(...(A.water || [0x1f6a9a, 0x5ac0e0]), A.mid);
  scene.fog.color.copy(mid); scene.fog.near = A.fog[0]; scene.fog.far = A.fog[1];
  sun.color.setHex(A.sun); sun.intensity = A.sunI; hemi.intensity = A.hemi;
  hemi.color.setHex(A.hemiSky || 0xdff0ff); hemi.groundColor.setHex(A.hemiGround || 0x5a6a3a); EXPO = A.exposure || 1;
  // indoors: warm lamplight, the sun only through the windows
  if (INDOOR) { sun.intensity *= 0.25; hemi.color.setHex(0xffdcb0); hemi.groundColor.setHex(0x7a5a3a); hemi.intensity = 1.25; EXPO = 1; }
  root.style.background = '#' + mid.getHexString();
}
// stepping through a cottage door: a quick fade, and you're in a room of your own;
// step back out and the day outside has moved on
function doorway(v) {
  root.classList.remove('doorfx'); void root.offsetWidth; root.classList.add('doorfx');
  // the day moves on only after a real visit, not a step back over the threshold
  const leaving = !v, moveOn = leaving && performance.now() - (doorway.at || 0) > 2500;
  if (v) doorway.at = performance.now();
  DOOR = v;
  setTimeout(() => {
    INDOOR = v;
    if (moveOn) MOOD = (MOOD + 1) % MOODS.length;
    setAtmosphere(WI);
    cam.snap = true;
    if (moveOn && MOODS[MOOD]) KG.app.toast(MOODS[MOOD].say);
  }, 220);
  setTimeout(() => root.classList.remove('doorfx'), 800);
}
sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
sun.castShadow = true;
sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 160 });
sun.shadow.bias = -0.0008;
scene.add(sun, sun.target);

// ── materials & helpers ──────────────────────────────────────
const mats = {};
const mat = (color, opts = {}) => {
  const k = color + JSON.stringify(opts);
  return mats[k] || (mats[k] = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.85, flatShading: true }, opts)));
};
function mesh(geo, color, opts) { const m = new THREE.Mesh(geo, color instanceof THREE.Material ? color : mat(color, opts)); m.castShadow = !LOW; m.receiveShadow = !LOW; return m; }
let WG = new THREE.Group(); // everything that belongs to the current world
scene.add(WG);
function put(obj, x, z, yOff = 0) { obj.position.set(x, groundAt(x, z) + yOff, z); WG.add(obj); return obj; }
const GREEK_FONT = '"Gentium Plus", "Noto Serif", Georgia, serif';
function textSprite(text, { size = 40, color = '#fff', bg = 'rgba(24,32,48,.78)', font = '800 ' + size + 'px Nunito, sans-serif', scale = 0.011 } = {}) {
  const c = document.createElement('canvas'), x = c.getContext('2d');
  x.font = font;
  const w = Math.ceil(x.measureText(text).width) + size, h = Math.ceil(size * 1.6);
  c.width = w; c.height = h;
  x.font = font;
  if (bg) { x.fillStyle = bg; x.beginPath(); x.roundRect(0, 0, w, h, h / 2.4); x.fill(); }
  x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, w / 2, h / 2 + 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false, fog: false }));
  s.scale.set(w * scale, h * scale, 1);
  s.renderOrder = 10;
  return s;
}
function glyphSprite(ch, color = '#ffd166') {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(255,230,150,.9)'); g.addColorStop(0.45, 'rgba(255,200,80,.35)'); g.addColorStop(1, 'rgba(255,200,80,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  x.font = `700 76px ${GREEK_FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.lineWidth = 6; x.strokeStyle = '#6a4a10'; x.strokeText(ch, 64, 70);
  x.fillStyle = color; x.fillText(ch, 64, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false }));
  s.scale.set(1.6, 1.6, 1);
  return s;
}

// ── the current world's layout ───────────────────────────────
let WI = -1, D = null, LY = null, HG = null, BR = null; // index, definition, road, height grid, bridge
const colliders = [], anims = [], keepOut = []; // keepOut: open ground saved for side quests (no trees)
let waters = [];
function makeRoad(def) {
  const segs = []; let len = 0;
  for (let i = 0; i < def.pts.length - 1; i++) {
    const [x0, z0] = def.pts[i], [x1, z1] = def.pts[i + 1], l = Math.hypot(x1 - x0, z1 - z0);
    segs.push({ x0, z0, dx: x1 - x0, dz: z1 - z0, l, s: len }); len += l;
  }
  return { segs, len };
}
// distance to the road and how far along it the nearest point is (0…1)
function roadInfo(x, z) {
  let best = 1e9, t = 0;
  for (const s of LY.segs) {
    const u = Math.max(0, Math.min(1, ((x - s.x0) * s.dx + (z - s.z0) * s.dz) / (s.l * s.l)));
    const d = Math.hypot(x - s.x0 - s.dx * u, z - s.z0 - s.dz * u);
    if (d < best) { best = d; t = (s.s + u * s.l) / LY.len; }
  }
  return { d: best, t };
}
// a point t of the way along the road, pushed sideways by off
function along(t, side = 0, off = 0) {
  const L = Math.max(0, Math.min(1, t)) * LY.len;
  const s = LY.segs.find(s => L <= s.s + s.l) || LY.segs[LY.segs.length - 1];
  const u = Math.min(1, (L - s.s) / s.l), px = s.x0 + s.dx * u, pz = s.z0 + s.dz * u;
  const nx = s.dz / s.l, nz = -s.dx / s.l;
  return { x: px + nx * side * off, z: pz + nz * side * off, px, pz, a: Math.atan2(s.dx, s.dz) };
}
function rawHeight(x, z) {
  const { d } = roadInfo(x, z);
  const paved = D.paved && Math.abs(x) < D.paved + 3 && z > -48;
  let h = (D.baseY ? D.baseY(x, z) : 0) + D.relief(x, z, d) * smooth(2.6, 12, d) + (paved ? 0 : (vnoise(x * 0.4, z * 0.4) - 0.5) * 0.15);
  if (D.carve) h += D.carve(x, z);
  const e = Math.max(Math.abs(x), Math.abs(z)), wall = smooth(R - 18, R - 2, e);
  return h + wall * wall * 28 + wall * fbm(x * 2, z * 2) * 6;
}
// heights are computed once per world on a grid; the ground mesh uses the same triangles
function buildHeights() {
  const cell = LOW ? 1.8 : mobile ? 1.45 : 1.1, n = Math.ceil(2 * R / cell) + 1, h = new Float32Array(n * n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) h[i * n + j] = rawHeight(-R + j * cell, -R + i * cell);
  HG = { cell, n, h };
}
// floors, decks and stepping stones of the teachers' places stand on the ground
const groundAt = (x, z) => VEN.ground(x, z, groundBase(x, z));
function groundBase(x, z) {
  const { cell, n, h } = HG;
  const fx0 = Math.max(0, Math.min(n - 1.001, (x + R) / cell)), fz0 = Math.max(0, Math.min(n - 1.001, (z + R) / cell));
  const j = Math.floor(fx0), i = Math.floor(fz0), fx = fx0 - j, fz = fz0 - i;
  const h00 = h[i * n + j], h10 = h[i * n + j + 1], h01 = h[(i + 1) * n + j], h11 = h[(i + 1) * n + j + 1];
  const y = fx + fz <= 1 ? h00 + (h10 - h00) * fx + (h01 - h00) * fz : h11 + (h01 - h11) * (1 - fx) + (h10 - h11) * (1 - fz);
  if (BR && Math.abs(z - BR.z) < BR.half && Math.abs(x - BR.x) < BR.w) return Math.max(y, BR.top);
  return y;
}

function buildTerrain() {
  const { cell, n, h } = HG, pos = new Float32Array(n * n * 3), cols = new Float32Array(n * n * 3), idx = [];
  const grass = new THREE.Color(ZONES[WI].grass), dirt = new THREE.Color(WI === 8 ? 0xd8ccb0 : WI === 5 ? 0xc8a878 : WI === 7 ? 0xa89a88 : 0xb8925a);
  const rock = new THREE.Color(WI === 5 ? 0xb09070 : 0x8a8378), snow = new THREE.Color(0xf2f4f6), sand = new THREE.Color(0xd8c48a), c = new THREE.Color(), ring = new THREE.Color(D.ring), ringC = new THREE.Color();
  const wy = D.water ? D.water.y : -99;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const k = i * n + j, x = -R + j * cell, z = -R + i * cell, y = h[k];
    pos.set([x, y, z], k * 3);
    const gx = (h[i * n + Math.min(n - 1, j + 1)] - h[i * n + Math.max(0, j - 1)]) / (2 * cell), gz = (h[Math.min(n - 1, i + 1) * n + j] - h[Math.max(0, i - 1) * n + j]) / (2 * cell);
    const slope = Math.hypot(gx, gz), { d } = roadInfo(x, z);
    c.copy(grass).offsetHSL(0, 0, (fbm(x * 3, z * 3) - 0.8) * 0.08);
    if (D.sand) c.lerp(sand, D.sand * fbm(x * 0.7, z * 0.7));
    c.lerp(rock, Math.min(1, smooth(0.55, 1.1, slope) + (D.rock || 0) * smooth(0.3, 0.7, slope)));
    if (D.snowLine !== undefined) c.lerp(snow, smooth(D.snowLine, D.snowLine + 8, y) * (slope < 1.2 ? 0.95 : 0.2));
    else if (y > 16) c.lerp(snow, smooth(16, 26, y) * 0.5);
    // the valley walls wear the colour of the hills beyond, so they read as distant slopes, not bare cliffs
    const wl = smooth(R - 20, R - 4, Math.max(Math.abs(x), Math.abs(z)));
    if (wl > 0) c.lerp(ringC.copy(ring).offsetHSL(0, 0, (fbm(x * 4, z * 4) - 0.8) * 0.12), wl * (D.snowLine !== undefined ? 0.4 : 0.85));
    c.lerp(dirt, (1 - smooth(1.7, 3.2 + vnoise(x, z) * 0.8, d)) * 0.88);
    if (y < wy + 0.6) c.lerp(sand, 0.6);
    // soft shading: hollows a little darker, crests a little lighter
    const lap = (h[i * n + Math.min(n - 1, j + 1)] + h[i * n + Math.max(0, j - 1)] + h[Math.min(n - 1, i + 1) * n + j] + h[Math.max(0, i - 1) * n + j]) / 4 - y;
    c.multiplyScalar(1 - Math.max(-0.07, Math.min(0.16, lap * 0.35)));
    cols.set([c.r, c.g, c.b], k * 3);
    if (i < n - 1 && j < n - 1) { const a = k, b = k + 1, d2 = k + n, e = k + n + 1; idx.push(a, d2, b, b, d2, e); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const t = new THREE.Mesh(g, FX.groundDetail(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 })));
  t.receiveShadow = !LOW; WG.add(t);
}

// water: pond, river or lake
const waterMat = FX.water();
function buildWater() {
  waters = [];
  const Wd = D.water; if (!Wd) return;
  let g;
  if (Wd.kind === 'river') {
    g = new THREE.PlaneGeometry(2 * R + 10, Wd.w * 2, LOW ? 40 : 80, 4); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + Wd.f(p.getX(i)));
  } else { g = new THREE.CircleGeometry(Wd.r, LOW ? 24 : 48); g.rotateX(-Math.PI / 2); }
  const m = new THREE.Mesh(g, waterMat);
  m.position.set(Wd.kind === 'river' ? 0 : Wd.x, Wd.y, Wd.kind === 'river' ? 0 : Wd.z);
  WG.add(m); waters.push(m);
}

// instanced trees: round, pine, tall pine, cypress, dead and willow
function scatterTrees() {
  const T = D.trees, N = Math.round(T.n * (LOW ? 0.45 : mobile ? 0.7 : 1)), rand = rng(WI * 977 + 13), sc0 = T.scale || 1;
  const parts = {
    trunk: new THREE.InstancedMesh(new THREE.CylinderGeometry(0.18, 0.28, 1.6, 6), mat(0x6a4a2a), N),
    round: new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.3, 0), FX.windify(new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.9 }), { amp: 0.06, base: -1.3, shade: [-1.3, 1.3] }), N * 2),
    cone: new THREE.InstancedMesh(new THREE.ConeGeometry(1.2, 3.2, 7), FX.windify(new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.9 }), { amp: 0.035, base: -1.6, freq: 1.1, shade: [-1.6, 1.6] }), N * 2),
    snowcap: new THREE.InstancedMesh(new THREE.ConeGeometry(0.62, 1.1, 7), mat(0xf4f8fb), T.snowy ? N : 1),
  };
  const cnt = { trunk: 0, round: 0, cone: 0, snowcap: 0 };
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3(), col = new THREE.Color(), up = new THREE.Vector3(0, 1, 0);
  const addI = (part, x, y, z, sx, sy, sz, c) => { const im = parts[part]; if (cnt[part] >= im.count) return; m.compose(p3.set(x, y, z), q, s3.set(sx, sy, sz)); im.setMatrixAt(cnt[part], m); if (c) im.setColorAt(cnt[part], c); cnt[part]++; };
  const kinds = Object.entries(T.kinds), wy = D.water ? D.water.y : -99;
  for (let i = 0; i < N * 4 && cnt.trunk < N; i++) {
    const x = (rand() * 2 - 1) * (R - 3), z = (rand() * 2 - 1) * (R - 3), { d } = roadInfo(x, z);
    if (d < T.near || (T.avoid && T.avoid(x, z))) continue;
    if (colliders.some(c => Math.hypot(c.x - x, c.z - z) < c.r + 1.6) || keepOut.some(c => Math.hypot(c.x - x, c.z - z) < c.r)) continue;
    const y = groundAt(x, z); if (y < wy + 0.4) continue;
    let r = rand(), kind = kinds[0][0]; for (const [k, w] of kinds) { if ((r -= w) <= 0) { kind = k; break; } }
    const s = (0.7 + rand() * 0.9) * sc0;
    q.setFromAxisAngle(up, rand() * 6.28);
    const leaf = col.setHex(U.pick(ZONES[WI].leaf)).offsetHSL(0, 0, (rand() - 0.5) * 0.08);
    if (kind === 'dead') { addI('trunk', x, y + 1.6 * s, z, s * 0.8, s * 2, s * 0.8); continue; }
    addI('trunk', x, y + 0.8 * s, z, s, s, s);
    if (kind === 'pine' || kind === 'tall') {
      const k = kind === 'tall' ? 1.6 : 1;
      addI('cone', x, y + 2.6 * s * k, z, s, s * 1.1 * k, s, leaf);
      if (T.snowy) addI('snowcap', x, y + (2.6 * k + 1.2) * s, z, s, s, s);
    } else if (kind === 'cypress') addI('cone', x, y + 3 * s, z, s * 0.45, s * 1.5, s * 0.45, col.setHex(0x2f4a2a).offsetHSL(0, 0, (rand() - 0.5) * 0.05));
    else if (kind === 'willow') { addI('round', x, y + 2.4 * s, z, s * 1.5, s * 1.1, s * 1.5, col.setHex(0x7aa84a)); addI('round', x, y + 1.6 * s, z, s * 1.3, s * 0.9, s * 1.3, col.setHex(0x6a983a)); }
    else { addI('round', x, y + 2.3 * s, z, s * 1.1, s, s * 1.1, leaf); addI('round', x + 0.5 * s, y + 3.1 * s, z - 0.3 * s, s * 0.75, s * 0.7, s * 0.75, leaf.offsetHSL(0, 0, 0.05)); }
    if (d < 9) colliders.push({ x, z, r: 0.4 * s });
  }
  for (const [k, im] of Object.entries(parts)) { im.count = cnt[k]; im.castShadow = !LOW && k !== 'snowcap'; im.receiveShadow = !LOW; if (cnt[k]) WG.add(im); }
}

// wind-blown grass (or wheat) near the road, drawn in one call with a swaying shader
function grass() {
  if (LOW) return;
  const wheat = !!D.wheat, N = Math.round((wheat ? 16000 : 9000) * (mobile ? 0.55 : 1)), rand = rng(WI * 31 + 5);
  const blade = new THREE.BufferGeometry();
  blade.setAttribute('position', new THREE.Float32BufferAttribute([-0.05, 0, 0, 0.05, 0, 0, 0, wheat ? 1.0 : 0.42, 0], 3));
  blade.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  blade.setAttribute('color', new THREE.Float32BufferAttribute([0.62, 0.62, 0.62, 0.62, 0.62, 0.62, 1.1, 1.1, 1.0], 3));
  const gm = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, vertexColors: true });
  FX.windify(gm, { amp: 0.24, freq: 1.8, push: true });
  const im = new THREE.InstancedMesh(blade, gm, N);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color(), up = new THREE.Vector3(0, 1, 0);
  const wy = D.water ? D.water.y : -99, base = wheat ? 0xe0c060 : ZONES[WI].grass;
  let n = 0;
  for (let i = 0; i < N * 3 && n < N; i++) {
    let x, z;
    if (wheat) { x = (rand() * 2 - 1) * (R - 12); z = (rand() * 2 - 1) * (R - 12); const { d } = roadInfo(x, z); if (d < 4.5) continue; }
    else { const a = along(rand(), rand() < 0.5 ? -1 : 1, 2.4 + Math.pow(rand(), 1.8) * 14); x = a.x + (rand() - 0.5) * 3; z = a.z + (rand() - 0.5) * 3; }
    if (Math.abs(x) > R - 6 || Math.abs(z) > R - 6) continue;
    const y = groundAt(x, z); if (y < wy + 0.3) continue;
    if (wheat && colliders.some(cl => Math.abs(cl.x - x) < cl.r + 1 && Math.abs(cl.z - z) < cl.r + 1)) continue;
    if (keepOut.some(c => Math.hypot(c.x - x, c.z - z) < c.r - 0.5)) continue;
    const s = 0.6 + rand() * 0.9;
    q.setFromAxisAngle(up, rand() * 6.28);
    m.compose(p.set(x, y - 0.02, z), q, sc.set(s, s * (0.7 + rand() * 0.8), s));
    im.setMatrixAt(n, m);
    im.setColorAt(n++, c.setHex(base).offsetHSL(0, 0.05, (rand() - 0.3) * 0.12));
  }
  im.count = n; WG.add(im);
}
function flowers() {
  const N = Math.round((D.flowers || 0) * (LOW ? 0.4 : 1)); if (!N) return;
  const rand = rng(WI * 7 + 1), fl = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.12, 0), new THREE.MeshStandardMaterial({ roughness: 1 }), N);
  const m = new THREE.Matrix4(), c = new THREE.Color(), fcols = [0xffe066, 0xff8fab, 0xffffff, 0xb197fc, 0xff6b6b];
  const wy = D.water ? D.water.y : -99;
  let n = 0;
  for (let i = 0; i < N * 2 && n < N; i++) {
    const a = along(rand(), rand() < 0.5 ? -1 : 1, 3 + rand() * 16), y = groundAt(a.x, a.z);
    if (keepOut.some(c => Math.hypot(c.x - a.x, c.z - a.z) < c.r)) continue;
    if (y < wy + 0.3) continue;
    m.makeTranslation(a.x, y + 0.18, a.z); fl.setMatrixAt(n, m); fl.setColorAt(n++, c.setHex(U.pick(fcols)));
  }
  fl.count = n; WG.add(fl);
}
// distant hills ring every world, so each feels like its own valley
function horizon() {
  const rand = rng(WI * 13 + 3), cm = mat(D.ring), snowM = mat(0xf2f4f6);
  for (let i = 0; i < 20; i++) {
    const an = i / 20 * Math.PI * 2 + rand() * 0.2, r = 100 + rand() * 30, h = (WI === 7 ? 50 : WI === 2 || WI === 8 ? 16 : 30) + rand() * 25;
    const w = Math.min(h * 0.9 + 10, r - 66); // the hills stay outside the world's walls
    const m = new THREE.Mesh(new THREE.ConeGeometry(w, h, 7), cm); m.position.set(Math.cos(an) * r, h / 2 - 6, Math.sin(an) * r); WG.add(m);
    if (WI === 7 || h > 48) { const c = new THREE.Mesh(new THREE.ConeGeometry(w * 0.3, h * 0.3, 7), snowM); c.position.set(m.position.x, h - 6 - h * 0.15 + 0.5, m.position.z); WG.add(c); }
  }
}
// per-world ambience: pollen, leaves, embers, fireflies, snow…
const AMB = [
  { color: 0xfff0a0, size: 0.12, vy: 0.15, drift: 0.4, n: 160 },   // Hollow: pollen
  { color: 0x8ac04a, size: 0.22, vy: -0.6, drift: 1.0, n: 220 },   // Wordwood: falling leaves
  { color: 0xffe08a, size: 0.12, vy: 0.1, drift: 0.6, n: 180 },    // Fields: pollen
  { color: 0xd0f0ff, size: 0.1, vy: 0.05, drift: 0.3, n: 120 },    // River: mist sparkles
  { color: 0xd8d0c0, size: 0.1, vy: -0.05, drift: 0.8, n: 160 },   // Ridge: dust
  { color: 0xff9040, size: 0.14, vy: 0.7, drift: 0.4, n: 200 },    // Ruins: embers
  { color: 0xd8ff70, size: 0.16, vy: 0.05, drift: 0.5, n: 160, blink: true }, // Lake: fireflies
  { color: 0xffffff, size: 0.18, vy: -1.2, drift: 0.5, n: 420 },   // Peaks: snow
  { color: 0xffd166, size: 0.13, vy: 0.25, drift: 0.3, n: 200 },   // Library: golden motes
];
let amb = null, dotTex = null;
function dotTexture() {
  if (dotTex) return dotTex;
  const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d');
  const g = x.createRadialGradient(16, 16, 1, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 32, 32);
  return (dotTex = new THREE.CanvasTexture(c));
}
function setAmbience(zi) {
  if (amb) { scene.remove(amb.pts); amb.pts.geometry.dispose(); amb.pts.material.dispose(); }
  const A = AMB[zi], n = LOW ? Math.round(A.n * 0.3) : mobile ? Math.round(A.n * 0.6) : A.n, arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) arr.set([(Math.random() - 0.5) * 50, Math.random() * 16, (Math.random() - 0.5) * 50], i * 3);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: A.color, size: A.size * 2.2, map: dotTexture(), alphaTest: 0.05, transparent: true, opacity: 0.85, depthWrite: false, blending: A.blink ? THREE.AdditiveBlending : THREE.NormalBlending }));
  pts.frustumCulled = false;
  scene.add(pts); amb = { pts, A, zi };
}
function updateAmbience(dt, t, pos) {
  const A = amb.A, p = amb.pts.geometry.attributes.position;
  amb.pts.position.set(pos.x, groundAt(pos.x, pos.z), pos.z);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + Math.sin(t * 0.7 + i) * A.drift * dt, z = p.getZ(i) + Math.cos(t * 0.6 + i * 1.3) * A.drift * dt;
    let y = p.getY(i) + A.vy * dt;
    if (y > 16) y = 0; if (y < 0) y = 16;
    p.setXYZ(i, x, y, z);
  }
  p.needsUpdate = true;
  if (A.blink) amb.pts.material.opacity = 0.55 + Math.sin(t * 3) * 0.35;
}
// ── characters ────────────────────────────────────────────────
// Storybook characters: soft cel shading, ink outlines and simple faces.
const toonRamp = (() => { const t = new THREE.DataTexture(new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]), 3, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toonCache = {};
function tmat(color, opts = {}) {
  const k = color + JSON.stringify(opts);
  return toonCache[k] || (toonCache[k] = FX.rim(new THREE.MeshToonMaterial(Object.assign({ color, gradientMap: toonRamp }, opts))));
}
const inkMat = new THREE.MeshBasicMaterial({ color: 0x2a1a0e, side: THREE.BackSide });
function tmesh(geo, color, opts, ink = 1.06) {
  const m = new THREE.Mesh(geo, tmat(color, opts)); m.castShadow = true; m.receiveShadow = true;
  if (ink && !LOW) { const o = new THREE.Mesh(geo, inkMat); o.scale.setScalar(ink); m.add(o); }
  return m;
}
function person({ skin = 0xf0c8a0, robe = 0x3f7d3a, hair = 0x6a3e1e, hood = false, beard = false, staff = false, long = false, scale = 1 } = {}) {
  const g = new THREE.Group(), body = new THREE.Group(), eyes = [];
  g.add(body);
  const robeDark = new THREE.Color(robe).multiplyScalar(0.7).getHex();
  const torso = tmesh(new THREE.CylinderGeometry(0.32, 0.56, 1.05, 18), robe); torso.position.y = 1.05; body.add(torso);
  const hem = tmesh(new THREE.TorusGeometry(0.54, 0.05, 6, 20), robeDark, {}, 0); hem.rotation.x = Math.PI / 2; hem.position.y = 0.54; body.add(hem);
  const collar = tmesh(new THREE.TorusGeometry(0.27, 0.07, 6, 18), robeDark, {}, 0); collar.rotation.x = Math.PI / 2; collar.position.y = 1.56; body.add(collar);
  const belt = tmesh(new THREE.CylinderGeometry(0.42, 0.44, 0.1, 16), 0x5a3a1a, {}, 0); belt.position.y = 0.98; body.add(belt);
  const buckle = tmesh(new THREE.BoxGeometry(0.14, 0.12, 0.04), 0xe0b030, {}, 0); buckle.position.set(0, 0.98, 0.43); body.add(buckle);
  // head and face
  const head = tmesh(new THREE.SphereGeometry(0.32, 20, 16), skin); head.position.y = 1.86; body.add(head);
  const hairM = tmesh(new THREE.SphereGeometry(0.345, 18, 10, 0, Math.PI * 2, 0, Math.PI / 1.9), hair); hairM.position.y = 1.9; hairM.rotation.x = -0.28; body.add(hairM);
  for (const sd of [-1, 1]) {
    const tuft = tmesh(new THREE.SphereGeometry(0.11, 8, 6), hair, {}, 0); tuft.position.set(sd * 0.29, 1.82, -0.04); body.add(tuft);
    const eye = tmesh(new THREE.SphereGeometry(0.062, 10, 8), 0xffffff, {}, 0); eye.position.set(sd * 0.115, 1.89, 0.27); body.add(eye); eyes.push(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 6), new THREE.MeshBasicMaterial({ color: 0x1a1208 })); pupil.position.set(sd * 0.115, 1.89, 0.322); body.add(pupil); eyes.push(pupil);
    const brow = tmesh(new THREE.BoxGeometry(0.11, 0.025, 0.03), hair === 0xdddddd ? 0xbbbbbb : hair, {}, 0); brow.position.set(sd * 0.115, 1.98, 0.29); brow.rotation.z = sd * -0.12; body.add(brow);
    const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.045, 10), new THREE.MeshBasicMaterial({ color: 0xff9a8a, transparent: true, opacity: 0.45 })); cheek.position.set(sd * 0.19, 1.8, 0.285); cheek.rotation.y = sd * 0.5; body.add(cheek);
  }
  const nose = tmesh(new THREE.SphereGeometry(0.05, 8, 6), skin, {}, 0); nose.position.set(0, 1.83, 0.32); body.add(nose);
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.013, 4, 10, Math.PI), new THREE.MeshBasicMaterial({ color: 0x5a2a1a })); mouth.position.set(0, 1.74, 0.3); mouth.rotation.z = Math.PI; body.add(mouth);
  if (hood) {
    const h = tmesh(new THREE.ConeGeometry(0.44, 0.66, 14), robe); h.position.set(0, 2.18, -0.1); h.rotation.x = -0.4; body.add(h);
  }
  if (long) { const lh = tmesh(new THREE.CylinderGeometry(0.3, 0.36, 0.75, 14, 1, true, Math.PI * 0.6, Math.PI * 1.8), hair, { side: THREE.DoubleSide }, 0); lh.position.set(0, 1.62, -0.06); body.add(lh); }
  if (beard) { const b = tmesh(new THREE.ConeGeometry(0.24, 0.66, 10), 0xeeeeee); b.position.set(0, 1.55, 0.2); b.rotation.x = Math.PI + 0.25; body.add(b); }
  const cloak = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.35, 16, 1, true), tmat(robeDark, { side: THREE.DoubleSide })); cloak.castShadow = true; cloak.position.set(0, 1.0, -0.13); body.add(cloak);
  const legs = [], arms = [];
  for (const sd of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(sd * 0.17, 0.6, 0);
    const leg = tmesh(new THREE.CylinderGeometry(0.11, 0.1, 0.55, 8), 0x5a4030, {}, 0); leg.position.y = -0.27; hip.add(leg);
    const foot = tmesh(new THREE.SphereGeometry(0.17, 10, 8), skin); foot.scale.set(1, 0.55, 1.5); foot.position.set(0, -0.56, 0.08); hip.add(foot);
    g.add(hip); legs.push(hip);
    const sh = new THREE.Group(); sh.position.set(sd * 0.45, 1.45, 0);
    const arm = tmesh(new THREE.CylinderGeometry(0.09, 0.15, 0.66, 10), robe); arm.position.y = -0.31; sh.add(arm);
    const hand = tmesh(new THREE.SphereGeometry(0.095, 10, 8), skin); hand.position.y = -0.7; sh.add(hand);
    body.add(sh); arms.push(sh);
  }
  if (staff) { const st = tmesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 8), 0x6a4a2a, {}, 0); st.position.set(0.55, 1.2, 0.15); body.add(st); const gem = mesh(new THREE.OctahedronGeometry(0.15), 0x7fd0ff, { emissive: 0x3fa0ff }); gem.position.set(0.55, 2.45, 0.15); body.add(gem); }
  g.scale.setScalar(scale);
  g.userData = { body, legs, arms, eyes, cloak, phase: 0 };
  return g;
}
function animatePerson(p, speed, dt) {
  const u = p.userData, amt = Math.min(1, speed / 6);
  u.phase += dt * (4 + speed * 1.6);
  const sw = Math.sin(u.phase) * 0.8 * amt;
  u.legs[0].rotation.x = sw; u.legs[1].rotation.x = -sw;
  u.arms[0].rotation.x = -sw * 0.8; u.arms[1].rotation.x = sw * 0.8;
  u.body.position.y = Math.abs(Math.cos(u.phase)) * 0.08 * amt + Math.sin(u.phase * 0.35) * 0.015;
  if (u.orb) { u.orb.rotation.y += dt * 0.8; u.orb.children.forEach((c, k) => { c.rotation.y += dt * 2; c.position.y = Math.sin(u.phase * 0.5 + k * 2) * 0.25; }); u.rune.material.opacity = 0.7 + Math.sin(u.phase * 0.8) * 0.3; }
  // the cloak streams back as you run and sways as you walk
  if (u.cloak) { u.cloak.rotation.x += ((amt * 0.35 + Math.sin(u.phase * 2) * 0.05 * amt) - u.cloak.rotation.x) * Math.min(1, dt * 8); u.cloak.position.z = -0.13 - amt * 0.12; }
  // a blink every few seconds
  if (u.eyes) {
    u.blink = (u.blink ?? Math.random() * 4) - dt;
    const shut = u.blink < 0 && u.blink > -0.13;
    if (shut !== u.shut) { u.shut = shut; for (const e of u.eyes) e.scale.y = shut ? 0.12 : 1; }
    if (u.blink <= -0.13) u.blink = 2 + Math.random() * 4;
  }
}
// Guardians: one stone body, dressed for each world
function golem(color = 0x8a8a8a, style = 0) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const metal = style === 2 || style === 4 || style === 6 || style === 8;
  const o = metal ? { metalness: 0.6, roughness: 0.35 } : style === 7 ? { emissive: 0x3a6a9a, emissiveIntensity: 0.25 } : {};
  const torso = mesh(new THREE.BoxGeometry(1.8, 1.8, 1.1), color, o); torso.position.y = 2.2; body.add(torso);
  const head = mesh(new THREE.BoxGeometry(0.9, 0.8, 0.8), color, o); head.position.y = 3.5; body.add(head);
  const eyeC = [0xffb000, 0x9aff4a, 0xffffff, 0x4af0ff, 0xff5a2a, 0xffd166, 0x9ad0ff, 0x7fe8ff, 0xffd166][style];
  for (const s of [-1, 1]) { const e = mesh(new THREE.BoxGeometry(0.18, 0.1, 0.05), eyeC, { emissive: eyeC, emissiveIntensity: 2 }); e.position.set(s * 0.2, 3.55, 0.41); body.add(e); }
  const legs = [], arms = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * 0.5, 1.3, 0);
    const l = mesh(new THREE.BoxGeometry(0.6, 1.3, 0.6), color, o); l.position.y = -0.65; hip.add(l); g.add(hip); legs.push(hip);
    const sh = new THREE.Group(); sh.position.set(s * 1.2, 2.9, 0);
    const a = mesh(new THREE.BoxGeometry(0.5, 1.6, 0.5), color, o); a.position.y = -0.8; sh.add(a); body.add(sh); arms.push(sh);
  }
  const add = (geo, c, x, y, z, op) => { const m = mesh(geo, c, op); m.position.set(x, y, z); body.add(m); return m; };
  if (style === 0) for (let i = 0; i < 5; i++) add(new THREE.IcosahedronGeometry(0.28, 0), 0x5f8f45, -0.7 + i * 0.35, 3.05 + (i % 2) * 0.1, 0.45);
  if (style === 1) for (let i = 0; i < 7; i++) { const t = add(new THREE.ConeGeometry(0.16, 0.7, 5), 0x3a5a2a, -0.9 + i * 0.3, 3.2 + (i % 2) * 0.2, -0.3); t.rotation.x = -0.5; }
  if (style === 2) for (let i = 0; i < 5; i++) add(new THREE.ConeGeometry(0.1, 0.4, 5), 0xffe080, -0.32 + i * 0.16, 4.1, 0, { metalness: 0.8, roughness: 0.3 });
  if (style === 3) { const f = add(new THREE.ConeGeometry(0.4, 1.2, 4), 0x2a6a9a, 0, 4.2, -0.1); f.scale.z = 0.3; }
  if (style === 4) { add(new THREE.BoxGeometry(1, 0.25, 0.9), 0x2a2a30, 0, 3.95, 0, { metalness: 0.8, roughness: 0.3 }); for (let i = 0; i < 4; i++) add(new THREE.SphereGeometry(0.07, 6, 4), 0x9a9aa0, -0.6 + i * 0.4, 2.8, 0.56); }
  if (style === 5) { const h = add(new THREE.ConeGeometry(0.35, 0.5, 8), 0xe8c070, 0, 4.25, 0); h.rotation.x = Math.PI; add(new THREE.ConeGeometry(0.35, 0.5, 8), 0xe8c070, 0, 4.7, 0).rotation.x = 0; }
  if (style === 6) { add(new THREE.BoxGeometry(0.15, 1.6, 1.2), 0xe8eef8, -1.55, 2.2, 0.4, { metalness: 0.9, roughness: 0.1 }); add(new THREE.ConeGeometry(0.5, 0.6, 4), 0xe8eef8, 0, 4.2, 0, { metalness: 0.9, roughness: 0.1 }); }
  if (style === 7) for (let i = 0; i < 6; i++) { const s = add(new THREE.OctahedronGeometry(0.25, 0), 0xdff4ff, -1 + i * 0.4, 3.3 + (i % 2) * 0.3, -0.4); s.scale.y = 2; }
  if (style === 8) { const b = add(new THREE.BoxGeometry(1.4, 0.2, 1), 0x7a2f3a, 1.2, 1.7, 0.6); b.rotation.z = 0.3; add(new THREE.BoxGeometry(1.3, 0.15, 0.9), 0xf5ecd0, 1.2, 1.78, 0.6).rotation.z = 0.3; }
  const rune = textSprite('ΑΒΓΔΕΖΗΘΙ'[style] || 'Ω', { size: 60, bg: null, color: '#ffd166', font: `700 60px ${GREEK_FONT}`, scale: 0.012 });
  rune.position.set(0, 2.3, 0.6); body.add(rune);
  // three runestones circle the guardian's head, and its chest rune pulses
  const orb = new THREE.Group(); orb.position.y = 3.6; body.add(orb);
  for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2, st = mesh(new THREE.OctahedronGeometry(0.17, 0), color, { emissive: eyeC, emissiveIntensity: 0.6 }); st.position.set(Math.cos(a) * 1.5, Math.sin(a * 2) * 0.2, Math.sin(a) * 1.5); orb.add(st); }
  g.userData = { body, legs, arms, phase: 0, orb, rune };
  return g;
}

// small creatures that make each world feel alive
function critterMesh(kind) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const T = (geo, c, x, y, z) => { const m = mesh(geo, c); m.position.set(x, y, z); body.add(m); return m; };
  const legs = [];
  const fourLegs = (c, h, w, l) => { for (const [x, z] of [[-w, -l], [w, -l], [-w, l], [w, l]]) { const leg = T(new THREE.CylinderGeometry(0.05, 0.05, h, 4), c, x, h / 2, z); legs.push(leg); } };
  if (kind === 'sheep' || kind === 'goat') {
    const wool = kind === 'sheep' ? 0xf4f0e8 : 0x8a7a6a;
    T(new THREE.IcosahedronGeometry(0.45, 1), wool, 0, 0.65, 0).scale.set(1, 0.8, 1.3);
    T(new THREE.SphereGeometry(0.18, 8, 6), kind === 'sheep' ? 0x2a2a2a : 0x6a5a4a, 0, 0.8, 0.55);
    if (kind === 'goat') for (const s of [-1, 1]) { const h = T(new THREE.ConeGeometry(0.05, 0.3, 5), 0xd8d0c0, s * 0.08, 1.02, 0.5); h.rotation.x = -0.5; }
    fourLegs(0x2a2a2a, 0.4, 0.18, 0.25);
  } else if (kind === 'deer') {
    T(new THREE.CylinderGeometry(0.22, 0.22, 0.9, 8), 0x9a6a3a, 0, 0.9, 0).rotation.x = Math.PI / 2;
    const n = T(new THREE.CylinderGeometry(0.08, 0.12, 0.6, 6), 0x9a6a3a, 0, 1.25, 0.45); n.rotation.x = 0.5;
    T(new THREE.SphereGeometry(0.15, 8, 6), 0x9a6a3a, 0, 1.55, 0.6);
    for (const s of [-1, 1]) { const a = T(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 4), 0xe8dcc0, s * 0.1, 1.8, 0.55); a.rotation.z = s * 0.4; }
    fourLegs(0x7a5a3a, 0.7, 0.12, 0.32);
  } else if (kind === 'duck' || kind === 'swan') {
    const c = kind === 'swan' ? 0xffffff : 0x8a6a4a;
    T(new THREE.SphereGeometry(0.3, 10, 8), c, 0, 0.15, 0).scale.set(1, 0.6, 1.4);
    if (kind === 'swan') { const n = T(new THREE.CylinderGeometry(0.05, 0.07, 0.6, 6), c, 0, 0.5, 0.3); n.rotation.x = -0.25; T(new THREE.SphereGeometry(0.09, 8, 6), c, 0, 0.82, 0.38); T(new THREE.ConeGeometry(0.04, 0.14, 5), 0xff8a2a, 0, 0.8, 0.5).rotation.x = Math.PI / 2; }
    else { T(new THREE.SphereGeometry(0.13, 8, 6), 0x2a6a3a, 0, 0.38, 0.32); T(new THREE.ConeGeometry(0.04, 0.12, 5), 0xffa040, 0, 0.36, 0.48).rotation.x = Math.PI / 2; }
    g.userData.swim = true;
  } else if (kind === 'lizard') {
    T(new THREE.BoxGeometry(0.18, 0.08, 0.5), 0x6a9a3a, 0, 0.05, 0);
    T(new THREE.ConeGeometry(0.06, 0.5, 5), 0x6a9a3a, 0, 0.05, -0.45).rotation.x = -Math.PI / 2;
    T(new THREE.SphereGeometry(0.08, 6, 4), 0x6a9a3a, 0, 0.06, 0.3);
    g.userData.dart = true;
  } else if (kind === 'dove') {
    T(new THREE.SphereGeometry(0.16, 8, 6), 0xffffff, 0, 0, 0).scale.z = 1.4;
    for (const s of [-1, 1]) { const w = T(new THREE.BoxGeometry(0.4, 0.03, 0.18), 0xf0f0f8, s * 0.25, 0.03, 0); w.userData.wing = s; }
    g.userData.fly = true;
  }
  g.userData.body = body; g.userData.legs = legs;
  return g;
}
const critters = [];
function buildCritters() {
  critters.length = 0;
  const kind = D.critter; if (!kind) return;
  const rand = rng(WI * 3 + 77), n = LOW ? 3 : 6;
  for (let i = 0; i < n; i++) {
    const c = { obj: critterMesh(kind), t: rand() * 10, kind };
    let x, z;
    if (kind === 'duck' || kind === 'swan') {
      const Wd = D.water;
      if (Wd.kind === 'river') { x = -40 + rand() * 80; z = Wd.f(x) + (rand() - 0.5) * 3; } else { const a = rand() * 6.28, r = rand() * Wd.r * 0.7 + 7; x = Wd.x + Math.cos(a) * r; z = Wd.z + Math.sin(a) * r; }
    } else { const a = along(0.1 + rand() * 0.8, rand() < 0.5 ? -1 : 1, 7 + rand() * 12); x = a.x; z = a.z; }
    c.home = { x, z }; c.obj.position.set(x, 0, z);
    WG.add(c.obj); critters.push(c);
  }
}
function critterTarget(c) {
  let x = c.home.x + (Math.random() - 0.5) * 10, z = c.home.z + (Math.random() - 0.5) * 10;
  if (c.obj.userData.swim) {
    if (D.water.kind === 'river') z = D.water.f(x) + (Math.random() - 0.5) * 3;
    else if (Math.hypot(x - D.water.x, z - D.water.z) > D.water.r - 2) { x = c.home.x; z = c.home.z; }
  }
  return { x, z };
}
function updateCritters(dt, t, pos) {
  for (const c of critters) {
    const o = c.obj.position, u = c.obj.userData;
    c.t += dt;
    if (u.fly) {
      const an = c.t * 0.4 + c.home.x; o.set(c.home.x + Math.cos(an) * 10, groundAt(c.home.x, c.home.z) + 8 + Math.sin(c.t) * 1.5, c.home.z + Math.sin(an) * 10);
      c.obj.rotation.y = -an; for (const ch of u.body.children) if (ch.userData.wing) ch.rotation.z = ch.userData.wing * Math.sin(t * 12) * 0.6;
      continue;
    }
    if (!c.target) c.target = critterTarget(c);
    const dT = Math.hypot(c.target.x - o.x, c.target.z - o.z);
    if (dT < 0.4 && (c.wait = (c.wait || 0) - dt) <= 0) { c.target = critterTarget(c); c.wait = 1 + Math.random() * 4; }
    // shy creatures keep their distance from the hero
    const dp = Math.hypot(pos.x - o.x, pos.z - o.z), flee = dp < 3.5 && !u.swim;
    const tx = flee ? o.x + (o.x - pos.x) : c.target.x, tz = flee ? o.z + (o.z - pos.z) : c.target.z;
    const dx = tx - o.x, dz = tz - o.z, dl = Math.hypot(dx, dz) || 1;
    const moving = flee || dT >= 0.4;
    const sp = (u.dart ? 3 : flee ? 2.4 : 0.8) * (moving ? 1 : 0);
    if (moving) { o.x += dx / dl * sp * dt; o.z += dz / dl * sp * dt; c.obj.rotation.y = Math.atan2(dx, dz); }
    o.y = u.swim ? D.water.y + Math.sin(c.t * 2) * 0.03 : groundAt(o.x, o.z);
    u.body.position.y = moving && !u.swim ? Math.abs(Math.sin(c.t * 10)) * 0.06 : 0;
  }
}
// ── wisps: Shades of Forgetting ──────────────────────────────
const wisps = [];
function wispMesh(elite = false) {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 1), new THREE.MeshStandardMaterial({ color: elite ? 0x8a1a2a : 0x5a2a8a, emissive: elite ? 0xff3a3a : 0x7a3aff, emissiveIntensity: 1.2, flatShading: true }));
  g.add(core);
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const gr = x.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, elite ? 'rgba(255,120,120,.9)' : 'rgba(180,120,255,.9)'); gr.addColorStop(1, elite ? 'rgba(255,60,60,0)' : 'rgba(120,60,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.set(2.4, 2.4, 1); g.add(halo);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })); e.position.set(s * 0.15, 0.08, 0.4); g.add(e); }
  // a ghostly tail that streams out behind and below, and a sad little mouth
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.4, 10, 1, true), new THREE.MeshBasicMaterial({ color: elite ? 0xff5a5a : 0x9a6aff, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  tail.rotation.x = Math.PI * 0.82; tail.position.set(0, -0.45, -0.35); g.add(tail);
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 4, 8, Math.PI), new THREE.MeshBasicMaterial({ color: 0xffffff })); mouth.position.set(0, -0.12, 0.42); g.add(mouth);
  g.userData.tail = tail;
  return g;
}
function spawnWisp(w) {
  const a = along(0.15 + Math.random() * 0.75, Math.random() < 0.5 ? -1 : 1, Math.random() * 12);
  w.obj.position.set(a.x, groundAt(a.x, a.z) + 1.4, a.z);
  w.home = new THREE.Vector3(a.x, 0, a.z); w.target = null; w.obj.visible = true; w.dead = false;
}

// ── entities: mentor, pedestals, guardian, gate and portals ──
const ents = []; // {kind, zone, obj, x, z, r, node?, label}
let gate = null, backPortal = null;
function marker(text, color) { return textSprite(text, { size: 64, bg: null, color, font: `900 64px Nunito, sans-serif`, scale: 0.016 }); }
function addEnt(e) {
  const nameTag = textSprite(e.label, { size: 30 });
  nameTag.position.y = e.tagY || 2.7; e.obj.add(nameTag); e.tag = nameTag;
  e.mark = marker('!', '#ffd166'); e.mark.position.y = (e.tagY || 2.7) + 0.9; e.mark.visible = false; e.obj.add(e.mark);
  ents.push(e); colliders.push({ x: e.x, z: e.z, r: e.r || 0.8 });
  return e;
}
const portalMat = FX.portalMaterial();
function portalDisc(r) { return new THREE.Mesh(new THREE.CircleGeometry(r, 40), portalMat); }
// the teachers of each world (js/data/story.js) and how they look
const teacherOf = (i, k) => KG.story.teachers[i][k] || KG.story.teachers[i][0];
const LONG_HAIR = ['Sophia', 'Rhoda', 'Dorcas', 'Joanna', 'Lydia', 'Phoebe', 'Lois', 'Eunice', 'Priscilla', 'Damaris', 'Junia'];
function teacherLook(i, k) {
  const T = teacherOf(i, k), long = LONG_HAIR.includes(T[1]);
  if (k === 0) return { robe: ZONES[i].robe, hair: long ? 0x6a3e1e : 0xdddddd, beard: !long && i % 3 === 0, staff: true, hood: i % 2 === 1, long, skin: [0xf0c8a0, 0xd8a878, 0xb07850][i % 3] };
  const robes = [0x3f6a9a, 0x9a5a2a, 0x5a8a4a, 0x8a3a5a, 0x4a4a7a, 0xa08030, 0x2f7a7a, 0x7a5a9a];
  return { robe: robes[(i * 2 + k) % robes.length], hair: [0x2a1a10, 0x8a5a2a, 0xbbbbbb, 0x4a2a1a][(i + k) % 4], beard: !long && (i + k) % 2 === 0, staff: k === 2, long, skin: [0xf0c8a0, 0xd8a878, 0xb07850, 0xe8b890][(i + k * 2) % 4] };
}
// which of a world's teachers gives a lesson (the same split as buildEntities)
function teacherIndex(i, nodeId) {
  const taught = KG.units[i].nodes.filter(n => n.type !== 'boss' && n.type !== 'reading'), per = Math.ceil(taught.length / Math.min(3, taught.length));
  const j = taught.findIndex(n => n.id === nodeId);
  return j < 0 ? 0 : Math.floor(j / per);
}
// a teacher's spot: a rug, a bench and a slate with the lesson on it
function teachingSpot(p, sd, k, title) {
  const nx = Math.cos(p.a) * sd, nz = -Math.sin(p.a) * sd, x = p.x + nx * 2.4, z = p.z + nz * 2.4;
  const rug = new THREE.Mesh(new THREE.CircleGeometry(2.6, 20), mat([0x9a2a2a, 0x2a5a8a, 0x6a2a7a][k]));
  rug.rotation.x = -Math.PI / 2; rug.position.set(p.x + nx * 0.6, groundAt(p.x + nx * 0.6, p.z + nz * 0.6) + 0.04, p.z + nz * 0.6); WG.add(rug);
  const trim = new THREE.Mesh(new THREE.RingGeometry(2.25, 2.45, 32), mat(0xe0b040)); trim.rotation.x = -Math.PI / 2; trim.position.copy(rug.position).y += 0.01; WG.add(trim);
  const inner = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.32, 24), mat(0xf0d8a0)); inner.rotation.x = -Math.PI / 2; inner.position.copy(rug.position).y += 0.01; WG.add(inner);
  const g = new THREE.Group();
  for (const s of [-1, 1]) { const post = mesh(new THREE.CylinderGeometry(0.07, 0.07, 2, 6), 0x6a4a2a); post.position.set(s * 1.1, 1, 0); g.add(post); }
  const slate = mesh(new THREE.BoxGeometry(2.5, 1.3, 0.1), 0x2a3a2a); slate.position.y = 1.6; g.add(slate);
  const txt = textSprite(title, { size: 34, bg: null, color: '#f5f0dc', scale: 0.0075 }); txt.position.set(0, 1.6, 0.2); g.add(txt);
  const bench = mesh(new THREE.BoxGeometry(2, 0.15, 0.5), 0x8a6a3a); bench.position.set(0, 0.45, 1.4); g.add(bench);
  for (const s of [-1, 1]) { const l = mesh(new THREE.BoxGeometry(0.12, 0.45, 0.4), 0x6a4a2a); l.position.set(s * 0.8, 0.22, 1.4); g.add(l); }
  g.rotation.y = Math.atan2(-nx, -nz);
  put(g, x, z); colliders.push({ x, z, r: 1.2 });
}
// the places the teachers live (js/venues.js)
const VEN = makeVenues({
  THREE, add: o => WG.add(o), mesh, rawGround: (x, z) => groundBase(x, z), textSprite, glow: (c, sz) => FX.glow(c, sz, ATMOS[WI].stars ? 0.85 : 0.55),
  col: (x, z, r) => { const c = { x, z, r }; colliders.push(c); return c; }, keep: (x, z, r) => keepOut.push({ x, z, r }),
  free: (x, z, r, tol) => openGround(x, z, r, tol), SPK, water: () => waterMat,
  smoke: p => DUST.emit(p, { color: 0xd8d4d0, n: 1, speed: 0.25, up: 1.2, gravity: 0.6, drag: 0.6, size: 0.6, size1: 2.2, life: 3.2, spread: 0.2 }),
  splash: (x, z, face) => {
    player.position.set(x, groundAt(x, z), z); P.vel.set(0, 0, 0); player.rotation.y = face; cam.yaw = face + Math.PI;
    KG.app.sfx('splash');
    if (!P.splashTip || clock.elapsedTime - P.splashTip > 20) { P.splashTip = clock.elapsedTime; KG.app.toast('💦 <b>Splash!</b> Hop from stone to stone: jump with Space or ⤒.'); }
  },
});
// a spot clear of the teachers' places: things that would land inside one move out past its edge
function clearSpot(x, z) {
  for (const c of keepOut) { const d = Math.hypot(x - c.x, z - c.z); if (d < c.r + 0.6) { const k = (c.r + 0.8) / (d || 1); x = c.x + (x - c.x || 0.01) * k; z = c.z + (z - c.z) * k; } }
  return { x, z };
}
function besideMentor(m) { return m.venue ? { x: m.venue.entryX, z: m.venue.entryZ } : { x: m.x - 2, z: m.z + 2 }; }
function openGate(e, now) {
  e.vgate.unlock(now);
  const i = ents.indexOf(e); if (i >= 0) ents.splice(i, 1);
  e.obj.visible = false;
  if (!now) { const w = ws(); (w.gates = w.gates || []).push(e.vgate.id); E.gainXP(5); E.save(); refreshMarkers(); }
}
function buildEntities() {
  ents.length = 0;
  const i = WI, u = KG.units[i], Z = ZONES[i], side = i % 2 ? -1 : 1;
  // three teachers along the road, each with their own lessons and their own spot;
  // the road follows the curriculum, so walking on means learning on
  const seq = u.nodes.filter(n => n.type !== 'boss'), taught = seq.filter(n => n.type !== 'reading');
  const tOf = n => 0.1 + 0.72 * seq.indexOf(n) / Math.max(1, seq.length - 1);
  const k3 = Math.min(3, taught.length), per = Math.ceil(taught.length / k3);
  for (let k = 0; k < k3; k++) {
    const mine = taught.slice(k * per, (k + 1) * per); if (!mine.length) continue;
    const T = teacherOf(i, k), sd = (i + k) % 2 ? -1 : 1, mp = along(tOf(mine[0]), sd, 4.5);
    // the master teaches by the road; the others each have a place of their own to visit
    const v = k > 0 ? VEN.place(venueOrder(k === 1 ? 1 : [2, 4, 5, 0][i % 4]), { rx: mp.px, rz: mp.pz, nx: (mp.x - mp.px) / 4.5, nz: (mp.z - mp.pz) / 4.5, title: mine[0].title, name: T[1], id: i * 10 + k }) : null;
    const m = person(teacherLook(i, k)), x = v ? v.tx : mp.x, z = v ? v.tz : mp.z;
    m.rotation.y = v ? v.tFace : Math.atan2(mp.px - mp.x, mp.pz - mp.z);
    put(m, x, z);
    if (!v) teachingSpot(mp, sd, k, mine[0].title);
    const e = addEnt({ kind: 'mentor', zone: i, teacher: k, T, nodes: mine.map(n => n.id), obj: m, x, z, label: `${T[0]} · ${T[1]}`, venue: v, tagY: v && v.room ? 2.3 : undefined });
    if (v && v.gate) {
      const g = addEnt({ kind: 'vgate', zone: i, obj: v.gate.obj, x: v.gate.x, z: v.gate.z, label: '🔒 Word Gate', tagY: 2.4, r: 0.01, vgate: v.gate });
      e.gateEnt = g;
      if ((ws().gates || []).includes(v.gate.id)) openGate(g, true);
    }
  }
  // reading pedestals, where the road reaches each reading
  seq.filter(n => n.type === 'reading').forEach((n, k) => {
    const p = along(tOf(n) + 0.02, k % 2 ? -1 : 1, 6.5);
    const g = new THREE.Group();
    const col = mesh(new THREE.CylinderGeometry(0.4, 0.55, 1.1, 8), 0xe8dfcc); col.position.y = 0.55; g.add(col);
    const top = mesh(new THREE.BoxGeometry(1.1, 0.15, 0.8), 0xd8cfbc); top.position.y = 1.15; g.add(top);
    const scroll = new THREE.Group();
    const roll = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.9, 10), 0xf5e6c0, { emissive: 0x8a6a20, emissiveIntensity: 0.4 }); roll.rotation.z = Math.PI / 2; scroll.add(roll);
    for (const s of [-1, 1]) { const knob = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 6), 0x6a4a2a); knob.rotation.z = Math.PI / 2; knob.position.x = s * 0.55; scroll.add(knob); }
    scroll.position.y = 1.7; g.add(scroll);
    const glow = glyphSprite('✝'); glow.position.y = 1.7; glow.scale.set(2.2, 2.2, 1); g.add(glow);
    put(g, p.x, p.z);
    addEnt({ kind: 'pedestal', zone: i, obj: g, x: p.x, z: p.z, node: n, label: KG.readings[n.reading].ref, tagY: 2.6, spin: scroll, glow });
  });
  // the gate at the end of the road; its portal leads to the next world
  const gp = along(1);
  gate = new THREE.Group();
  const last = i === NZ - 1;
  for (const s of [-1, 1]) {
    const p = mesh(new THREE.BoxGeometry(1.4, 7, 1.4), 0xcfc6b0); p.position.set(s * 4, 3.5, 0); gate.add(p);
    const cap = mesh(new THREE.BoxGeometry(1.8, 0.5, 1.8), 0xbfb6a0); cap.position.set(s * 4, 7.2, 0); gate.add(cap);
    colliders.push({ x: gp.x + Math.cos(gp.a) * s * 4, z: gp.z - Math.sin(gp.a) * s * 4, r: 1 });
  }
  const lintel = mesh(new THREE.BoxGeometry(10, 1, 1.4), 0xcfc6b0); lintel.position.y = 7.6; gate.add(lintel);
  const title = textSprite(`${'ΑΒΓΔΕΖΗΘΙ'[i]}′ · ${KG.units[i].title}`, { size: 34, bg: null, color: '#3a2a10', scale: 0.012 });
  title.position.set(0, 7.6, -0.75); gate.add(title);
  const barrier = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 7), new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false }));
  barrier.position.y = 3.5; gate.add(barrier);
  const portal = new THREE.Group(); portal.position.y = 3.6;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3, 0.25, 10, 48), new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffb020, emissiveIntensity: 1.2, metalness: 0.6, roughness: 0.3 }));
  portal.add(ring);
  const disc = portalDisc(2.8); portal.add(disc); portal.userData.disc = disc;
  const vx = FX.vortex(3); portal.add(vx); portal.userData.vortex = vx; const vx2 = FX.vortex(3); vx2.rotation.y = Math.PI; portal.add(vx2); portal.userData.vortex2 = vx2;
  gate.add(portal);
  if (!last) { const dest = textSprite(`→ ${ZONES[i + 1].name}`, { size: 30 }); dest.position.y = 3.6 + 3.8; portal.add(dest); }
  gate.rotation.y = gp.a;
  put(gate, gp.x, gp.z);
  gate.userData = { portal, barrier, x: gp.x, z: gp.z, last };
  if (last) { portal.visible = false; gate.visible = false; }
  // the guardian waits just before the gate
  const gd = along(0.955, 1, 3.2);
  const gol = golem(GOLEM_COL[i], i);
  gol.rotation.y = gp.a + Math.PI;
  put(gol, gd.x, gd.z);
  addEnt({ kind: 'guardian', zone: i, obj: gol, x: gd.x, z: gd.z, node: u.nodes[u.nodes.length - 1], label: Z.guard, tagY: 4.6, r: 1.4 });
  // the portal you arrived through leads back to the world before
  backPortal = null;
  if (i > 0) {
    const bp = along(0), g = new THREE.Group();
    for (const s of [-1, 1]) { const st = mesh(new THREE.BoxGeometry(0.9, 4.6, 0.9), 0xb8b0a0); st.position.set(s * 2.4, 2.3, 0); g.add(st); }
    const top = mesh(new THREE.BoxGeometry(5.6, 0.6, 1), 0xb8b0a0); top.position.y = 4.8; g.add(top);
    const d = portalDisc(1.9); d.position.y = 2.3; g.add(d); g.userData.disc = d;
    const tag = textSprite(`← ${ZONES[i - 1].name}`, { size: 28 }); tag.position.y = 5.7; g.add(tag);
    g.rotation.y = bp.a; put(g, bp.x, bp.z);
    for (const s of [-1, 1]) colliders.push({ x: bp.x + Math.cos(bp.a) * s * 2.4, z: bp.z - Math.sin(bp.a) * s * 2.4, r: 0.6 });
    backPortal = { g, x: bp.x, z: bp.z, armed: false };
  }
  if (last) W.libraryPos = new THREE.Vector3(0, groundAt(0, -32), -32);
}

// ── side quests (js/sidequests.js): fishing, the rune circle and a courier ──
const COURIERS = ['Old Demas', 'Woodcutter Jason', 'Farmer Clopas', 'Ferryman Alexander', 'Mason Erastus', 'Keeper Hermas', 'Boatwoman Chloe', 'Shepherd Carpus', 'Scribe Tertius'];
// open, fairly flat ground of radius r that no prop or person stands on
function openGround(x, z, r, tol = 1.6) {
  if (Math.abs(x) > R - 10 - r * 0.5 || Math.abs(z) > R - 10 - r * 0.5) return false;
  if (colliders.some(c => Math.hypot(c.x - x, c.z - z) < c.r + r) || keepOut.some(c => Math.hypot(c.x - x, c.z - z) < c.r + r)) return false;
  const y = groundAt(x, z), wy = D.water ? D.water.y : -99;
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, h = groundAt(x + Math.cos(a) * r, z + Math.sin(a) * r); if (Math.abs(h - y) > tol || h < wy + 0.4) return false; }
  if (roadInfo(x, z).d < r * 0.6) return false;
  return true;
}
function findSpot(ts, offs, r) {
  for (const off of offs) for (const t of ts) for (const sd of [1, -1]) { const p = along(t, sd, off); if (openGround(p.x, p.z, r)) return p; }
  return null;
}
function buildSideQuests() {
  const add = e => {
    addEnt(e); keepOut.push({ x: e.x, z: e.z, r: e.sq === 'runes' ? 7.5 : 2.5 });
    // keep the jetty's view of the water clear too
    if (e.water) keepOut.push({ x: (e.x + e.water.x) / 2, z: (e.z + e.water.z) / 2, r: 3.5 });
  };
  const rc = findSpot([0.45, 0.55, 0.35, 0.65, 0.25, 0.75, 0.15, 0.85], [13, 16, 10, 19, 22, 8], 5.8) || findSpot([0.4, 0.6, 0.3, 0.7], [12, 15, 18], 5);
  if (rc) add(SQ.runes({ x: rc.x, z: rc.z }));
  const cp = findSpot([0.2, 0.7, 0.3, 0.8, 0.6], [7, 9, 11], 1.6);
  if (cp) add(SQ.courier({ x: cp.x, z: cp.z, name: COURIERS[WI], look: { robe: [0x8a6a4a, 0x4a6a3a, 0xa08a4a, 0x3a5a7a, 0x6a5a4a, 0x8a5a3a, 0x3a6a6a, 0x6a6a5a, 0x7a3a3a][WI], hair: 0x5a4030, beard: WI % 2 === 0 } }));
  const Wd = D.water; if (!Wd) return;
  const wy = Wd.y;
  for (let k = 0; k < 24; k++) {
    let x, z, wx, wz;
    if (Wd.kind === 'river') { x = (k % 2 ? 1 : -1) * (14 + k * 2.5); const sd = k % 4 < 2 ? 1 : -1; z = Wd.f(x) + sd * 7.5; wx = x; wz = Wd.f(x) - sd; }
    else { const a = k / 24 * Math.PI * 2 + 0.4, r = Wd.r + 1.8; x = Wd.x + Math.cos(a) * r; z = Wd.z + Math.sin(a) * r; wx = Wd.x + Math.cos(a) * Wd.r * 0.3; wz = Wd.z + Math.sin(a) * Wd.r * 0.3; }
    if (Math.abs(x) > R - 12 || Math.abs(z) > R - 12 || groundAt(x, z) < wy + 0.3 || groundAt(x, z) > wy + 4) continue;
    if (colliders.some(c => Math.hypot(c.x - x, c.z - z) < c.r + 2) || roadInfo(x, z).d < 2) continue;
    if (BR && Math.abs(x - BR.x) < 10) continue;
    add(SQ.fishing({ x, z, wx, wz, waterY: wy }));
    break;
  }
}
// the review queue, due words first: what the side quests and shades ask about
function reviewPool(n) {
  const t = U.day();
  const studied = Object.entries(E.state.vocab).map(([g, r]) => ({ w: E.word(g), r })).filter(x => x.w && x.w.en);
  if (studied.length < 4) return U.shuffle(KG.readWords).slice(0, n).map(w => ({ g: w[0], en: w[2], nosrs: true }));
  const score = x => (x.r.due <= t ? 0 : 100 + U.diffDays(t, x.r.due) * 10) + x.r.box * 3 - x.r.miss + Math.random() * 6;
  return studied.sort((a, b) => score(a) - score(b)).slice(0, n).map(x => ({ g: x.w.g, en: x.w.en, box: x.r.box }));
}

// ── collectibles ──────────────────────────────────────────────
const letters = [], coins = [], scrolls = [];
function buildCollectibles() {
  letters.length = coins.length = scrolls.length = 0;
  const w = ws();
  if (WI === 0) KG.alphabet.forEach((Lt, i) => {
    const p0 = along(0.03 + i * 0.022, i % 2 ? 1 : -1, 4.5 + (i * 7 % 5)), p = clearSpot(p0.x, p0.z);
    const s = glyphSprite(Lt.l);
    s.position.set(p.x, groundAt(p.x, p.z) + 1.3, p.z); WG.add(s);
    s.visible = !w.letters.includes(i);
    letters.push({ i, s, x: p.x, z: p.z });
  });
  // lost scrolls: NT passages to collect for the Reading Room
  const found = (E.state.scrolls || {});
  KG.passages.filter(p => p.unit === WI).forEach((p, k) => {
    const a0 = along(0.33 + k * 0.13, k % 2 ? 1 : -1, 9 + (k * 3) % 5), a = clearSpot(a0.x, a0.z);
    const g = new THREE.Group();
    const roll = mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.1, 12), 0xf5e6c0, { emissive: 0xa07a20, emissiveIntensity: 0.6 }); roll.rotation.z = Math.PI / 2; g.add(roll);
    for (const sd of [-1, 1]) { const kn = mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.25, 8), 0x8a5a2a); kn.rotation.z = Math.PI / 2; kn.position.x = sd * 0.65; g.add(kn); }
    const seal = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 10), 0xc9452b); seal.rotation.x = Math.PI / 2; seal.position.z = 0.22; g.add(seal);
    const halo = glyphSprite('📜'); halo.scale.set(2.4, 2.4, 1); g.add(halo);
    g.position.set(a.x, groundAt(a.x, a.z) + 1.2, a.z); WG.add(g);
    g.visible = !found[p.id];
    scrolls.push({ p, g, x: a.x, z: a.z });
  });
  const coinG = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 16);
  const coinM = new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.35, roughness: 0.3, emissive: 0xc08a10, emissiveIntensity: 0.55 }); // bright gold even with nothing to reflect
  for (let k = 0; k < 14; k++) {
    const i = WI * 14 + k, a0 = along(0.04 + k * 0.066 + hash(i, 3) * 0.02, hash(i, 5) < 0.5 ? -1 : 1, hash(i, 7) * 9), a = clearSpot(a0.x, a0.z);
    const c = new THREE.Mesh(coinG, coinM); c.rotation.x = Math.PI / 2; c.castShadow = !LOW;
    c.position.set(a.x, groundAt(a.x, a.z) + 0.8, a.z); WG.add(c);
    c.visible = !w.coins.got.includes(i);
    coins.push({ i, c, x: a.x, z: a.z });
  }
}
function buildWisps() {
  for (const w of wisps) scene.remove(w.obj);
  wisps.length = 0;
  // a banished shade stays away for a while, even if you close the game
  const calm = ws().calm || {}, now = Date.now();
  if (WI > 0) for (let k = 0; k < 3; k++) {
    // one elite shade per world hunts your weakest words
    const elite = k === 2;
    const w = { zone: WI, obj: wispMesh(elite), t: Math.random() * 10, elite, key: `${WI}:${k}` };
    if (elite) w.obj.scale.setScalar(1.45);
    WG.add(w.obj); spawnWisp(w); wisps.push(w);
    if (calm[w.key] > now) { w.dead = true; w.obj.visible = false; w.respawn = (calm[w.key] - now) / 1000; }
  }
  // raiders who came while you were away wait on the road ahead
  const n = Math.min(5, (E.state.raiders || {}).count || 0);
  for (let k = 0; k < n; k++) {
    const r = { zone: WI, obj: raiderMesh(THREE, mesh, k), t: 0, raider: true };
    const a = along(0.18 + k * 0.15, k % 2 ? 1 : -1, 3 + (k * 5) % 6);
    r.obj.position.set(a.x, groundAt(a.x, a.z), a.z); r.home = new THREE.Vector3(a.x, 0, a.z); r.obj.scale.setScalar(1.1);
    WG.add(r.obj); wisps.push(r);
  }
}

// ── building and leaving a world ─────────────────────────────
function disposeWorld() {
  scene.remove(WG);
  WG.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) for (const m of [].concat(o.material)) { if (m.map && m.map !== dotTex) m.map.dispose(); if (!Object.values(mats).includes(m) && m !== waterMat && m !== portalMat && !Object.values(toonCache).includes(m) && m !== inkMat) m.dispose(); }
  });
  WG = new THREE.Group(); scene.add(WG);
  SQ.clear(); VEN.clear();
  colliders.length = 0; anims.length = 0; keepOut.length = 0; waters = []; beacon = null; BR = null;
}
function buildWorld(i) {
  if (WI >= 0) disposeWorld();
  WI = i; D = DEFS[i]; LY = makeRoad(D);
  buildHeights();
  if (D.bridge) BR = Object.assign({}, D.bridge, { top: Math.max(rawHeight(D.bridge.x, D.bridge.z - D.bridge.half), rawHeight(D.bridge.x, D.bridge.z + D.bridge.half)) + 0.35 });
  MOOD = 0; INDOOR = DOOR = null;
  setAtmosphere(i);
  buildTerrain(); buildWater();
  const col = (x, z, r) => colliders.push({ x, z, r });
  const pctx = { glow: (c, sz) => FX.glow(c, sz, ATMOS[WI].stars ? 0.85 : 0.5), THREE, mesh, put, add: o => WG.add(o), col, ground: groundAt, textSprite, glyphSprite, anim: fn => anims.push(fn), waterMat, GREEK: GREEK_FONT, waterY: D.water ? D.water.y : 0, bridgeTop: BR ? BR.top : 0 };
  const api = Object.assign(makeProps(pctx), { THREE, mesh, put, col, along, textSprite, rand: rng(i * 101 + 9), GREEK: GREEK_FONT, faceAngle: (x, z, tx, tz) => Math.atan2(tx - x, tz - z) });
  D.build(api);
  W.libraryDoor = pctx.libraryDoor || null;
  buildEntities(); buildSideQuests();
  scatterTrees(); grass(); flowers(); horizon();
  buildCollectibles(); buildWisps(); buildCritters();
  setAmbience(i);
  P.zone = i;
  refreshMarkers();
}
// ── the hero's look: robe, hat, staff and companion from the wardrobe ──
function addHat(body, hat) {
  if (hat === 'wizard') {
    const c = mesh(new THREE.ConeGeometry(0.36, 1.0, 12), 0x3a2a7a); c.position.y = 2.55; c.rotation.z = 0.12; body.add(c);
    const b = mesh(new THREE.TorusGeometry(0.4, 0.07, 6, 20), 0x2a1a5a); b.rotation.x = Math.PI / 2; b.position.y = 2.08; body.add(b);
    const st = mesh(new THREE.OctahedronGeometry(0.08), 0xffd166, { emissive: 0xffb000, emissiveIntensity: 1 }); st.position.set(0.12, 2.6, 0.22); body.add(st);
  } else if (hat === 'apprentice') {
    // a soft, slightly bent apprentice's hat
    const brim = mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.05, 16), 0x5a3a7a); brim.position.y = 2.06; body.add(brim);
    const c1 = mesh(new THREE.ConeGeometry(0.33, 0.6, 12), 0x6a4a9a); c1.position.y = 2.36; body.add(c1);
    const tip = mesh(new THREE.ConeGeometry(0.16, 0.42, 10), 0x6a4a9a); tip.position.set(0.1, 2.72, -0.06); tip.rotation.z = -0.7; body.add(tip);
    const band = mesh(new THREE.TorusGeometry(0.31, 0.04, 6, 18), 0xe0b030); band.rotation.x = Math.PI / 2; band.position.y = 2.12; body.add(band);
  } else if (hat === 'laurel') {
    const t = mesh(new THREE.TorusGeometry(0.31, 0.06, 6, 18), 0x4f8f3a); t.rotation.x = Math.PI / 2; t.position.y = 2.02; body.add(t);
  } else if (hat === 'crown') {
    const c = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12, 1, true), 0xe0b030, { metalness: 0.8, roughness: 0.3, side: THREE.DoubleSide }); c.position.y = 2.12; body.add(c);
    for (let k = 0; k < 6; k++) { const sp = mesh(new THREE.ConeGeometry(0.06, 0.18, 5), 0xe0b030, { metalness: 0.8, roughness: 0.3 }); const a = k / 6 * Math.PI * 2; sp.position.set(Math.cos(a) * 0.28, 2.3, Math.sin(a) * 0.28); body.add(sp); }
  }
}
function addStaff(body, staff, arm) {
  if (staff === 'none') return;
  if (staff === 'wand') {
    // held in the hand, so it follows every swing and spell
    const w = mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.75, 6), 0x6a4a2a); w.position.set(0, -0.82, 0.25); w.rotation.x = 1.25; arm.add(w);
    const st = mesh(new THREE.OctahedronGeometry(0.08), 0xffe9a8, { emissive: 0xffc04a, emissiveIntensity: 1.5 }); st.position.set(0, -0.9, 0.62); arm.add(st);
    return;
  }
  const col = { oak: 0x6a4a2a, crystal: 0x8a8aa0, lightning: 0xd0a030 }[staff], gem = { oak: [0x5ab04a, 0x2a8020], crystal: [0x7fd0ff, 0x3fa0ff], lightning: [0xffee66, 0xffcc00] }[staff];
  const st = mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6), col); st.position.set(0.55, 1.15, 0.15); body.add(st);
  const g = mesh(new THREE.OctahedronGeometry(0.16), gem[0], { emissive: gem[1], emissiveIntensity: 1.2 }); g.position.set(0.55, 2.35, 0.15); body.add(g);
}
function applyLook(g) {
  const L = E.look();
  while (g.children.length) g.remove(g.children[0]);
  const robe = (KG.wardrobe.robe.find(r => r.id === L.robe) || KG.wardrobe.robe[0]).color;
  const m = person({ robe, hair: 0x7a4a1e, hood: L.hat === 'hood' });
  for (const c of [...m.children]) g.add(c);
  g.userData = m.userData;
  addHat(g.userData.body, L.hat); addStaff(g.userData.body, L.staff, g.userData.arms[1]);
  return g;
}
function buildPet(type) {
  if (!type || type === 'none') return null;
  const p = new THREE.Group();
  if (type === 'owl') {
    const b = mesh(new THREE.SphereGeometry(0.28, 12, 10), 0x8a6a4a); b.scale.y = 1.2; p.add(b);
    for (const sd of [-1, 1]) {
      const e = mesh(new THREE.SphereGeometry(0.09, 8, 8), 0xffffff); e.position.set(sd * 0.11, 0.1, 0.22); p.add(e);
      const pu = mesh(new THREE.SphereGeometry(0.045, 6, 6), 0x111111); pu.position.set(sd * 0.11, 0.1, 0.3); p.add(pu);
      const ear = mesh(new THREE.ConeGeometry(0.06, 0.16, 5), 0x6a4a2a); ear.position.set(sd * 0.15, 0.36, 0); p.add(ear);
      const w = mesh(new THREE.SphereGeometry(0.2, 8, 6), 0x6a4a2a); w.scale.set(0.3, 0.8, 0.9); w.position.set(sd * 0.28, 0, 0); p.add(w); w.userData.wing = sd;
    }
    p.userData.fly = 2.4;
  } else if (type === 'dove') {
    const b = mesh(new THREE.SphereGeometry(0.22, 12, 10), 0xffffff); b.scale.z = 1.4; p.add(b);
    const h = mesh(new THREE.SphereGeometry(0.13, 10, 8), 0xffffff); h.position.set(0, 0.12, 0.26); p.add(h);
    const bk = mesh(new THREE.ConeGeometry(0.04, 0.1, 5), 0xffb040); bk.rotation.x = Math.PI / 2; bk.position.set(0, 0.1, 0.4); p.add(bk);
    for (const sd of [-1, 1]) { const w = mesh(new THREE.BoxGeometry(0.4, 0.04, 0.22), 0xf0f0f8); w.position.set(sd * 0.3, 0.05, 0); p.add(w); w.userData.wing = sd; }
    p.userData.fly = 2.6;
  } else if (type === 'lamb') {
    for (let k = 0; k < 7; k++) { const f = mesh(new THREE.SphereGeometry(0.2, 8, 6), 0xf4f0e8); f.position.set((k % 3 - 1) * 0.16, 0.42 + (k > 3 ? 0.1 : 0), (Math.floor(k / 3) - 1) * 0.16); p.add(f); }
    const h = mesh(new THREE.SphereGeometry(0.16, 10, 8), 0x2a2a2a); h.position.set(0, 0.52, 0.34); p.add(h);
    for (const [x, z] of [[-0.14, -0.15], [0.14, -0.15], [-0.14, 0.15], [0.14, 0.15]]) { const l = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 5), 0x2a2a2a); l.position.set(x, 0.15, z); p.add(l); }
    p.userData.hop = true;
  }
  return p;
}
function animatePet(p, t, dt) {
  if (!p) return;
  for (const c of p.children) if (c.userData.wing) c.rotation.z = c.userData.wing * Math.sin(t * 14) * 0.6;
}
const player = new THREE.Group();
applyLook(player);
scene.add(player);
let pet = null;
function setPet() {
  if (pet) scene.remove(pet);
  pet = buildPet(E.look().pet);
  if (pet) { pet.position.copy(player.position).add(new THREE.Vector3(1, 1, 1)); scene.add(pet); }
}
E.on(t => { if (t === 'look') { applyLook(player); setPet(); } });
const P = { turn: 0, vel: new THREE.Vector3(), onGround: true, hearts: 5, maxHearts: 5, hurtT: 0, regen: 0, zone: -1 };
const cam = { yaw: Math.PI, pitch: 0.42, dist: 8.5, auto: 0 };
const input = { f: 0, r: 0, run: false, jump: false, keys: {}, joy: null, drag: null };
const stickRight = () => (E.state.settings.stick || 'right') === 'right';

// ── HUD & overlays ────────────────────────────────────────────
const hud = document.getElementById('whud');
hud.innerHTML = `
  <div class="wtop">
    <div class="wstat"><div class="whearts" id="whearts"></div><div class="wlv"><b id="wlv">1</b><span class="wxp"><i id="wxp"></i></span></div><div class="wcoins">🪙 <b id="wcoins">0</b></div></div>
    <div class="wbtns"><button class="wb" id="wmapbtn" title="World map">🗺</button><button class="wb" data-act="go" data-arg="codex" title="Library">📖</button><button class="wb" data-act="go" data-arg="review" title="Review">🔁<span id="wdue" class="wbadge"></span></button><button class="wb" data-act="go" data-arg="path" title="Journal">📜</button><button class="wb" data-act="go" data-arg="profile" title="Profile">👤</button></div>
  </div>
  <div class="wquest" id="wquest"><div class="wq-arrow" id="wqarrow">▲</div><div><div class="wq-k">Quest</div><div id="wqtext"></div></div></div>
  <div class="wpowers" id="wpowers"></div>
  <div class="wbanner" id="wbanner"></div>
  <div class="wprompt" id="wprompt"></div>
  <div class="wjoy-rest" id="wjoyrest"></div>
  <div class="wjoy" id="wjoy"><div class="wjoy-knob" id="wknob"></div></div>
  <div class="wact"><button class="wbig" id="wtalk">💬</button><button class="wbig wjump" id="wjump">⤒</button></div>
  <div class="whelp" id="whelp">WASD / arrows to move · Shift to run · Space to jump · E to talk · drag to look</div>
  <div class="wdlg" id="wdlg"></div>
  <div class="wbattle" id="wbattle"></div>
  <div class="wcine" id="wcine"></div>`;
const $ = id => document.getElementById(id);
const SQ = makeSideQuests({
  THREE, add: o => WG.add(o), groundAt: (x, z) => groundAt(x, z), mesh, textSprite, GREEK: GREEK_FONT, player,
  person: look => person(look), animatePerson, SPK, DUST, hud,
  pool: n => reviewPool(n),
  others: (w, n) => U.sample(U.uniq(KG.vocab.map(v => v.en).concat(KG.readWords.map(r => r[2]))).filter(en => en !== w.en), n),
  record: (w, ok) => {
    const st = E.state.stats; st.answered++; if (ok) { st.correct++; E.questProgress('correct'); }
    if (!w.nosrs) { E.srsAnswer(w.g, ok); st.reviews++; E.questProgress('reviews'); }
    E.save(); updateHUD();
  },
  reward: (xp, coins, q) => { const st = E.state.stats; st[q] = (st[q] || 0) + 1; E.gainXP(xp, coins); E.questProgress(q); E.checkAchievements(); updateHUD(); },
  sfx: k => KG.app.sfx(k), speak: g => KG.app.speak(g), toast: (h, c) => KG.app.toast(h, c),
  dialog: (n, h, b) => dialog(n, h, b), free: (x, z) => openGround(x, z, 1.2),
  face: (x, z, tx, tz) => { player.position.set(x, groundAt(x, z), z); player.rotation.y = Math.atan2(tx - x, tz - z); cam.yaw = player.rotation.y + Math.PI; cam.pitch = 0.32; },
});

function updateHUD() {
  const s = E.state, lv = E.levelInfo();
  $('whearts').innerHTML = '❤'.repeat(P.hearts) + `<span class="lost">${'❤'.repeat(P.maxHearts - P.hearts)}</span>` + (P.shield ? '<span class="wshield">🛡</span>' : '');
  $('wlv').textContent = lv.level; $('wxp').style.width = (lv.cur / lv.need) * 100 + '%';
  $('wcoins').textContent = s.coins;
  const due = E.dueWords().length + E.dueSpells().length; $('wdue').textContent = due || ''; $('wdue').style.display = due ? '' : 'none';
  const pw = E.powers();
  $('wpowers').innerHTML = `<span title="Hints">💡${pw.hint}</span><span title="Shields">🛡${pw.shield}</span><span title="Slow Time">⏳${pw.slow}</span>`;
}

// quest target: whoever offers the next lesson on the path
function questTarget() {
  const n = E.nextNode();
  if (!n) return { done: true };
  if (n.unit !== WI) return { node: n, away: true };
  let e;
  if (n.type === 'boss') e = ents.find(x => x.kind === 'guardian');
  else if (n.type === 'reading') e = ents.find(x => x.kind === 'pedestal' && x.node.id === n.id);
  else e = ents.find(x => x.kind === 'mentor' && x.nodes.includes(n.id)) || ents.find(x => x.kind === 'mentor');
  return { node: n, ent: e };
}
let beacon = null;
function refreshMarkers() {
  const t = questTarget();
  for (const e of ents) {
    e.mark.visible = !!(t.ent === e);
    if (e.kind === 'pedestal') {
      const done = E.stars(e.node.id) > 0;
      e.glow.material.opacity = done ? 1 : E.unlocked(e.node) ? 0.8 : 0.25;
    }
  }
  const open = gateOpen(WI);
  gate.userData.barrier.visible = !open && !gate.userData.last;
  gate.userData.portal.visible = open && !gate.userData.last;
  if (W.libraryDoor) W.libraryDoor.material = mat(open ? 0xffe9a8 : 0x6a3a1a, open ? { emissive: 0xffc04a, emissiveIntensity: 1 } : {});
  // a portal back toward where the quest continues when it lies in another world
  // a closed word gate stands between you and the next teacher: it is the target first
  const gateE = t.ent && t.ent.gateEnt && ents.includes(t.ent.gateEnt) ? t.ent.gateEnt : null;
  for (const e of ents) if (e.kind === 'vgate') e.mark.visible = e === gateE;
  let target = gateE || t.ent;
  if (t.away) target = t.node.unit > WI ? { x: gate.userData.x, z: gate.userData.z, portal: true } : backPortal ? { x: backPortal.x, z: backPortal.z, portal: true } : null;
  if (!beacon) {
    beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 60, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    WG.add(beacon);
  }
  beacon.visible = !!target;
  if (target) beacon.position.set(target.x, groundAt(target.x, target.z) + 30, target.z);
  let txt;
  if (t.done) txt = WI === NZ - 1 ? 'All quests complete! Enter the Great Library.' : 'All quests complete! Travel on to the Great Library.';
  else if (t.away) txt = `${t.node.unit > WI ? 'Go through the portal to' : 'Return to'} <b>${esc(ZONES[t.node.unit].name)}</b>: ${esc(t.node.title)}`;
  else {
    const who = t.ent.kind === 'mentor' ? `Visit ${t.ent.T[1]}${t.ent.venue ? ` ${t.ent.venue.where}` : ''}` : t.ent.kind === 'pedestal' ? 'Restore the lost scroll' : `Challenge ${t.ent.label}`;
    txt = `${who}: <b>${esc(t.node.title)}</b>`;
  }
  const raiders = (E.state.raiders || {}).count || 0;
  if (raiders) txt += `<div class="wq-side">⚔️ ${raiders} Raider${raiders > 1 ? 's' : ''} of Forgetting in the valley</div>`;
  $('wqtext').innerHTML = txt;
  W.target = target;
  updateHUD();
}

let bannerT = 0;
function showBanner(i) {
  const u = KG.units[i];
  $('wbanner').innerHTML = `<div class="wb-k">World ${i + 1} · ${esc(u.title)}</div><div class="wb-t">${esc(ZONES[i].name)}</div><div class="wb-s">${esc(u.sub)}</div>`;
  $('wbanner').classList.add('on'); bannerT = 3;
}

// ── travel between worlds ────────────────────────────────────
let traveling = false;
function placeAt(where) {
  let p, face;
  if (where === 'gate') { p = along(0.92); face = p.a + Math.PI; }
  else if (where === 'mentor') {
    const m = (questTarget().ent && questTarget().ent.kind === 'mentor' ? questTarget().ent : ents.find(e => e.kind === 'mentor')), r = m.obj.rotation.y;
    p = m.venue ? { x: m.venue.entryX, z: m.venue.entryZ } : { x: m.x + Math.sin(r) * 4 + Math.cos(r) * 1.6, z: m.z + Math.cos(r) * 4 - Math.sin(r) * 1.6 }; face = Math.atan2(m.x - p.x, m.z - p.z);
  }
  else if (where && where.x !== undefined) { p = where; face = where.yaw !== undefined ? where.yaw - Math.PI : 0; }
  else { p = along(0.1); face = p.a; } // far enough from the arrival portal that the camera stays clear of it
  player.position.set(p.x, groundAt(p.x, p.z), p.z);
  player.rotation.y = face; cam.yaw = face + Math.PI;
  P.vel.set(0, 0, 0);
  if (backPortal) backPortal.armed = false;
  if (pet) pet.position.copy(player.position).add(new THREE.Vector3(1, 1, 1));
}
function travel(to, where) {
  if (traveling || to === WI) return;
  traveling = true; closeDialog();
  root.classList.add('portalfx'); KG.app.sfx('level');
  setTimeout(() => {
    buildWorld(to); placeAt(where); snapCamera();
    const w = ws(); w.zone = to; savePos();
    showBanner(to); traveling = false;
    setTimeout(arrive, 500);
  }, 320);
  setTimeout(() => root.classList.remove('portalfx'), 1000);
}
function worldMap() {
  dialog('🗺 World Map', `<div class="wmap">${ZONES.map((Z, i) => `<button class="wm ${reachable(i) ? '' : 'locked'} ${i === WI ? 'here' : ''}" data-wm="${i}" ${reachable(i) ? '' : 'disabled'}>
      <b>${i + 1}. ${esc(Z.name)}</b><span>${reachable(i) ? esc(KG.units[i].title) + (i === WI ? ' · you are here' : '') : '🔒 Beat the guardian before it'}</span></button>`).join('')}</div>`, [{ label: 'Close' }]);
  document.querySelectorAll('[data-wm]').forEach(b => b.onclick = () => { const i = +b.dataset.wm; closeDialog(); if (i !== WI) travel(i, 'mentor'); });
}

// ── cutscenes: the camera moves and characters speak ─────────
let cine = null;
const camLook = new THREE.Vector3();
function cutscene(shots, onDone) {
  if (cine) return;
  closeDialog();
  cine = { shots, i: -1, onDone, t: 0 };
  root.classList.add('cine');
  nextShot();
}
function nextShot() {
  if (!cine) return;
  if (cine.shot && cine.shot.speaker) cine.shot.speaker.userData.arms && (cine.shot.speaker.userData.arms[1].rotation.x = 0);
  const s = cine.shot = cine.shots[++cine.i];
  if (!s) return endCutscene();
  cine.t = 0;
  if (s.do) s.do();
  const len = s.text ? s.text.replace(/<[^>]+>/g, '').length : 0;
  cine.dur = s.dur || Math.max(2.6, 1.2 + len * 0.055);
  $('wcine').innerHTML = `<button class="wc-skip" id="wcskip">Skip ⏭</button>${s.text ? `<div class="wc-box"><div class="wc-who">${s.who || ''}</div><div class="wc-text">${s.text}</div><div class="wc-tap">▸</div></div>` : ''}`;
  $('wcine').classList.add('on');
  $('wcskip').onclick = e => { e.stopPropagation(); endCutscene(); };
  if (s.speak && E.state.settings.speech) KG.app.speak(s.speak);
}
function endCutscene() {
  if (!cine) return;
  const cb = cine.onDone;
  if (cine.shot && cine.shot.speaker && cine.shot.speaker.userData.arms) cine.shot.speaker.userData.arms[1].rotation.x = 0;
  cine = null;
  root.classList.remove('cine'); $('wcine').classList.remove('on'); $('wcine').innerHTML = '';
  snapCamera();
  if (cb) cb();
}
$('wcine').addEventListener('click', () => { if (cine && cine.t > 0.4) nextShot(); });
function updateCine(dt, t) {
  const s = cine.shot; cine.t += dt;
  const k = Math.min(1, cine.t / cine.dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const want = s.cam(e), look = s.look(e);
  if (cine.t <= dt * 1.01 && s.cut !== false) { camera.position.copy(want); camLook.copy(look); }
  camera.position.lerp(want, Math.min(1, dt * 4)); camLook.lerp(look, Math.min(1, dt * 4));
  camera.lookAt(camLook);
  if (s.speaker && s.speaker.userData.arms) s.speaker.userData.arms[1].rotation.x = -1.6 + Math.sin(t * 5) * 0.35;
  if (cine.t > cine.dur + (s.text ? 1.6 : 0)) nextShot();
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const headOf = o => V(o.position.x, o.position.y + 1.8, o.position.z);
// an orbit around a point, high above the world
const orbitShot = (cx, cz, r, h, a0, a1) => e => { const a = a0 + (a1 - a0) * e; return V(cx + Math.cos(a) * r, groundAt(cx, cz) + h, cz + Math.sin(a) * r); };
// a close shot from in front of a character
function faceShot(o, dist = 4, h = 1.2, side = 0.6) {
  const fy = o.rotation.y, fx = Math.sin(fy), fz = Math.cos(fy), x = o.position.x + fx * dist + fz * side, z = o.position.z + fz * dist - fx * side;
  return () => V(x, Math.max(o.position.y + h + 0.4, groundAt(x, z) + 1), z);
}
function behindPlayer() { const pos = player.position; return () => V(pos.x - Math.sin(player.rotation.y) * 7, pos.y + 3.4, pos.z - Math.cos(player.rotation.y) * 7); }
function arrivalShots(i) {
  const Z = ZONES[i], me = ents.find(e => e.kind === 'mentor'), m = me.obj, T = me.T, mid = along(0.5);
  const others = ents.filter(e => e.kind === 'mentor' && e !== me).map(e => `${esc(e.T[1])}, ${esc(e.T[2])}${e.venue ? ` (${esc(e.venue.where)})` : ''}`).join(', and ');
  const shots = [];
  if (i === 0) {
    shots.push({ cam: orbitShot(mid.px, mid.pz, 46, 26, 0.6, 1.5), look: () => V(mid.px, groundAt(mid.px, mid.pz), mid.pz), who: '📜 The Apprentice’s Journey', text: 'You are <b>Θεόφιλος</b> (Theophilus), an apprentice Koine wizard in Alphabet Hollow. The scrolls of the Great Library lie scattered across nine worlds, and their words are fading into forgetfulness.' });
    shots.push({ cam: orbitShot(mid.px, mid.pz, 40, 18, 1.5, 2.3), look: () => V(mid.px, groundAt(mid.px, mid.pz) + 2, mid.pz), who: '📜 The Apprentice’s Journey', text: 'In Greek, every rule you master is a <b>spell</b>. Learn them from the masters, restore the lost scrolls, banish the Shades of Forgetting, and win your way through the portals to the Library.' });
    shots.push({ cam: faceShot(m), look: () => headOf(m), who: `${esc(T[0])} · ${esc(T[1])}`, speaker: m, speak: T[3], text: `<span class="gk">${esc(T[3])}</span> <i>(${esc(T[4])})</i> Welcome, young wizard! Every spell begins with letters. Gather the glowing letters along the road and come to me. Later, ${others} will teach you more.` });
  } else {
    const lm = D.pts[Math.floor(D.pts.length / 2)];
    shots.push({ cam: orbitShot(lm[0], lm[1], 44, 24, 0.4, 1.3), look: () => V(lm[0], groundAt(lm[0], lm[1]), lm[1]), who: `📖 ${esc(Z.name)}`, text: esc(KG.story.arrive[i]) });
    shots.push({ cam: faceShot(m), look: () => headOf(m), who: `${esc(T[0])} · ${esc(T[1])}, ${esc(T[2])}`, speaker: m, speak: T[3], text: `<span class="gk">${esc(T[3])}</span> <i>(${esc(T[4])})</i> ${esc(KG.story.mentor[i])}${others ? ` Further along the road, ${others} will teach you too.` : ''}` });
  }
  shots.push({ cam: behindPlayer(), look: () => V(player.position.x, player.position.y + 1.4, player.position.z), dur: 1.2, cut: false });
  return shots;
}
function arrive() {
  const w = ws();
  if (!active || mode !== 'world' || w.cine.includes(WI) || dlgOpen || battle) return;
  w.cine.push(WI); w.intro = true; E.save();
  cutscene(arrivalShots(WI));
}
function guardianShots(i) {
  const g = ents.find(e => e.kind === 'guardian'), go = g.obj, gu = gate.userData, last = i === NZ - 1;
  const portalPos = V(gu.x, groundAt(gu.x, gu.z) + 3.6, gu.z);
  return [
    { cam: faceShot(go, 7, 3, 1.5), look: () => V(go.position.x, go.position.y + 3, go.position.z), who: `⚔ ${esc(g.label)}`, speaker: go, text: `“${esc(KG.story.guardian[i])}”`,
      do: () => { const b = go.userData.body; let k = 0; anims.push(dt => { k = Math.min(1, k + dt); b.rotation.x = k * 0.5; b.position.y = -k * 0.6; return k < 1; }); } },
    { cam: orbitShot(gu.x, gu.z, 13, 6, gate.rotation.y + 2.2, gate.rotation.y + 1.2), look: () => portalPos, who: last ? '🏛 The Great Library' : '✨ The gate opens',
      text: last ? 'The great doors of the Library swing open. Every scroll inside waits for a reader.' : `A portal blazes to life in the gate. Step through it to reach <b>${esc(ZONES[i + 1].name)}</b>.`,
      do: () => { refreshMarkers(); burst(portalPos, 0xffd166); KG.app.sfx('level'); } },
    { cam: behindPlayer(), look: () => V(player.position.x, player.position.y + 1.4, player.position.z), dur: 1.2, cut: false },
  ];
}

// dialogue
let dlgOpen = false;
function dialog(name, html, buttons) {
  dlgOpen = true;
  const d = $('wdlg');
  d.innerHTML = `<div class="wd-box"><div class="wd-name">${name}</div><div class="wd-text">${html}</div><div class="wd-btns">${buttons.map((b, i) => `<button class="btn ${b.cls || 'ghost'}" data-wb="${i}">${b.label}</button>`).join('')}</div></div>`;
  d.classList.add('on');
  d.querySelectorAll('[data-wb]').forEach(el => el.onclick = () => { const b = buttons[+el.dataset.wb]; if (b.keep !== true) closeDialog(); if (b.fn) b.fn(); });
}
function closeDialog() { dlgOpen = false; $('wdlg').classList.remove('on'); $('wdlg').innerHTML = ''; }
function launch(id) { savePos(); closeDialog(); KG.app.startNode(id); }

function talk(e) {
  const Z = ZONES[e.zone], app = KG.app;
  app.sfx('tap');
  if (e.kind === 'side') return SQ.start(e);
  if (e.kind === 'vgate') return SQ.quiz('🔒 The Word Gate', ok => { if (ok) openGate(e); });
  if (e.kind === 'mentor') {
    const t = questTarget(), T = e.T, mine = KG.units[e.zone].nodes.filter(n => e.nodes.includes(n.id));
    const greet = `<p><span class="gk">${esc(T[3])}</span> <i>(${esc(T[4])})</i></p>`;
    let html = greet, btns = [];
    const left = mine.filter(n => !E.stars(n.id));
    if (t.done) html += '<p>You have learned every spell I can teach. Go to the Great Library, wizard!</p>';
    else if (t.ent === e) {
      if (e.venue) html += `<p>${esc(e.venue.hello)}</p>`;
      html += `<p>I am ${esc(T[1])}, ${esc(T[2])}. ${esc(T[5])}</p><p>Your lesson: <b>${esc(t.node.title)}</b> <span class="muted small">(${mine.length - left.length + 1} of ${mine.length} with me)</span></p>`;
      btns.push({ label: `Begin: ${esc(t.node.title)} ▶`, cls: 'primary', fn: () => launch(t.node.id) });
    } else if (t.node.unit === e.zone) {
      const who = t.ent.kind === 'mentor' ? `${esc(t.ent.T[1])}, ${esc(t.ent.T[2])}</b>${t.ent.venue ? ` ${esc(t.ent.venue.where)}` : ''}<b>` : null;
      if (left.length && !E.unlocked(left[0])) html += `<p>Not yet, apprentice. Finish your lesson${who ? ` with ${who}` : ''} first, then come back to me.</p>`;
      else html += `<p>${who ? `Your next lesson is with <b>${who}</b>. Follow the golden light along the road.` : t.ent.kind === 'pedestal' ? `A lost scroll lies nearby: <b>${esc(t.ent.label)}</b>. Restore it at its pedestal (follow the golden light).` : `You are ready, apprentice! Face <b>${esc(t.ent.label)}</b> at the gate to prove your spells.`}</p>`;
    }
    else if (t.node.unit > e.zone) html += `<p>You have finished my lessons. Your path lies onward through the portal to ${esc(ZONES[t.node.unit].name)}.</p>`;
    else html += `<p>You are not ready for my lessons yet. Return to ${esc(ZONES[t.node.unit].name)} first.</p>`;
    const done = mine.filter(n => E.stars(n.id) > 0);
    if (done.length) {
      html += `<p class="muted small">Practice a lesson again:</p>`;
      done.slice(-4).forEach(n => btns.push({ label: `↺ ${esc(n.title)}`, fn: () => launch(n.id) }));
    }
    btns.push({ label: 'Farewell' });
    dialog(`${esc(T[0])} <span class="muted">· ${esc(T[1])}, ${esc(T[2])}</span>`, html, btns);
  } else if (e.kind === 'pedestal') {
    const n = e.node, R = KG.readings[n.reading], done = E.stars(n.id) > 0;
    if (!E.unlocked(n)) return dialog(`📜 ${esc(R.ref)}`, '<p>The scroll is sealed with a strange light. Learn more spells from your master first.</p>', [{ label: 'Leave' }]);
    dialog(`📜 ${esc(R.ref)}`, done ? `<p>You restored this scroll. Its words shine again:</p><p class="gk wd-verse">${esc(R.words.map(w => w.w + w.p).join(' '))}</p>` :
      `<p>A lost scroll of the Scriptures! Its letters are fading. Read it and translate it to restore it.</p>`,
      [{ label: done ? 'Read & translate again' : 'Restore the scroll ▶', cls: 'primary', fn: () => launch(n.id) }, { label: 'Leave' }]);
  } else if (e.kind === 'guardian') {
    const n = e.node;
    if (gateOpen(e.zone)) return dialog(esc(e.label), `<p><span class="gk">Πάρελθε.</span> <i>(Pass by.)</i> You have proven yourself, wizard. ${e.zone < NZ - 1 ? 'The portal is open.' : 'The Library is open.'}</p>`, [{ label: 'Rematch ⚔', fn: () => launch(n.id) }, { label: 'Onward' }]);
    if (!E.unlocked(n)) return dialog(esc(e.label), '<p><b>NONE SHALL PASS</b> who have not mastered the spells of this land! Return when your master has taught you all.</p>', [{ label: 'Leave' }]);
    dialog(esc(e.label), `<p><b>So, little apprentice, you would pass my gate?</b> Answer my riddles. Fail three times and you are cast back!</p><p class="muted small">Boss battle: 15 questions from all of ${esc(KG.units[e.zone].title)}, 3 hearts.</p>`,
      [{ label: 'Fight ⚔', cls: 'primary', fn: () => launch(n.id) }, { label: 'Not yet' }]);
  }
}

// battles against the Shades of Forgetting: spaced review out in the world.
// A shade asks for a word from your review queue; an elite one hunts your weakest
// words and takes three right answers in a row to banish. Each right answer is a
// bolt of light from your wand.
let battle = null;
function shadeQuestion(w, word) {
  if (word.spell) return E.spellQuestions(word.spell, 1)[0];
  const studied = Object.keys(E.state.vocab).map(g => E.vocabByGreek[g]).filter(Boolean);
  const pool = studied.length >= 4 ? studied : E.vocabSet(0).concat(E.vocabSet(1));
  // well-known words come back the harder way round: English → Greek
  const rec = E.state.vocab[word.g], hard = w.elite || (rec && rec.box >= 3);
  return E.vocabQ(word, pool.length > 8 ? pool : KG.vocab, hard ? 'e2g' : 'g2e');
}
function shadeWords(w) {
  const studied = Object.keys(E.state.vocab).map(g => E.vocabByGreek[g]).filter(Boolean);
  const pool = studied.length >= 4 ? studied : E.vocabSet(0).concat(E.vocabSet(1));
  if (w.raider) { const due = E.reviewOrder(pool).slice(0, 8); return U.sample(due.length >= 3 ? due : pool, 3); }
  if (w.elite) { const weak = E.weakWords(8); return U.sample(weak.length >= 3 ? weak : pool, 3); }
  // a fading spell sometimes takes shape as a shade too
  const spells = E.dueSpells();
  if (spells.length && Math.random() < 0.4) return [{ spell: U.pick(spells) }];
  const due = reviewPool(6).map(x => E.word(x.g)).filter(x => x && E.vocabByGreek[x.g]);
  return [due.length ? U.pick(due.slice(0, 3)) : U.pick(pool)];
}
function startBattle(w) {
  battle = { w, words: shadeWords(w), i: 0, hp: 0, done: false };
  battle.hp = battle.words.length;
  KG.app.sfx('bad'); S_SHAKE = 0.25;
  // a rune circle glows on the ground around you and the foe
  const fp = w.obj.position, pp = player.position;
  ARENA.show({ x: (fp.x + pp.x) / 2, y: Math.min(fp.y, pp.y), z: (fp.z + pp.z) / 2 }, Math.max(3, Math.hypot(fp.x - pp.x, fp.z - pp.z) / 2 + 1.6), w.raider ? 0xff6a3a : w.elite ? 0xff4a5a : 0x9a6aff);
  battleQ();
}
function battleQ() {
  const { w } = battle, word = battle.words[battle.i], q = battle.q = shadeQuestion(w, word);
  battle.done = false; battle.hinted = false;
  const b = $('wbattle'), pw = E.powers();
  const hp = battle.words.length > 1 ? `<div class="wbt-hp">${battle.words.map((_, k) => `<i class="${k < battle.hp ? 'on' : ''}"></i>`).join('')}</div>` : '';
  b.innerHTML = `<div class="wbt-box ${w.elite || w.raider ? 'elite' : ''}"><div class="wbt-h">${w.raider ? '⚔️ A Raider of Forgetting! It came while you were away and carries off the words you haven\'t reviewed…' : w.elite ? '🔥 An ELITE Shade! It feeds on your weakest words…' : '👻 A Shade of Forgetting!'}</div>${hp}<div class="muted small">${battle.words.length > 1 ? `Three right answers in a row banish it.` : word.spell ? `It is made of a fading spell: <b>${esc(KG.teach[word.spell].spell.name)}</b>. Recast it!` : 'Remember the word to banish it.'}</div>
    <div class="wbt-q">${q.prompt}</div><div class="wbt-big gk">${esc(q.big || '')}</div>
    <div class="wbt-opts">${q.options.map((o, i) => `<button class="wbt-opt ${q.greekOpts ? 'gk' : ''}" data-bo="${i}"><span class="k">${i + 1}</span>${q.greekOpts ? esc(o) : o}</button>`).join('')}</div>
    <div class="wbt-pw"><button class="pw" id="wbthint" ${pw.hint ? '' : 'disabled'}>💡 Hint <b>${pw.hint}</b></button><button class="pw" id="wbtshield" ${pw.shield && !P.shield ? '' : 'disabled'}>🛡 Shield <b>${pw.shield}</b></button></div><div id="wbtfb"></div></div>`;
  b.classList.add('on');
  b.querySelectorAll('[data-bo]').forEach(el => el.onclick = () => answerBattle(+el.dataset.bo, el));
  $('wbthint').onclick = () => {
    if (battle.done || battle.hinted || !E.usePower('hint')) return;
    battle.hinted = true; $('wbthint').disabled = true;
    U.sample(q.options.map((_, i) => i).filter(i => i !== q.answer), 2).forEach(i => { const el = b.querySelector(`[data-bo="${i}"]`); el.disabled = true; el.classList.add('gone'); });
    updateHUD();
  };
  $('wbtshield').onclick = () => { if (battle.done || P.shield || !E.usePower('shield')) return; P.shield = true; $('wbtshield').disabled = true; KG.app.sfx('combo'); updateHUD(); };
  if (q.speak) KG.app.speak(q.speak);
}
// a bolt of light from the wand to a target
function bolt(to, color, onHit) {
  const from = player.userData.arms[1].localToWorld(new THREE.Vector3(0, -0.8, 0.4)), dest = to.clone();
  const arm = player.userData.arms[1]; let k = 0;
  anims.push(dt => {
    k = Math.min(1, k + dt / 0.28);
    arm.rotation.x = -Math.sin(Math.min(1, k * 1.5) * Math.PI) * 2;
    const p = from.clone().lerp(dest, k); p.y += Math.sin(k * Math.PI) * 0.8;
    SPK.emit(p, { color, n: 3, speed: 0.6, up: 0.2, gravity: 0, size: 0.45, life: 0.35 });
    if (k >= 1) { SPK.emit(dest, { color, n: 40, speed: 6, up: 0.6, gravity: -2, size: 0.5 }); SPK.emit(dest, { color: 0xffffff, n: 12, speed: 2, size: 0.9, life: 0.4 }); if (onHit) onHit(); return false; }
  });
}
function answerBattle(i, el) {
  if (!battle || battle.done) return;
  const { q, w } = battle, ok = i === q.answer, last = ok && battle.hp <= 1;
  battle.done = true;
  E.recordAnswer(q, ok, true);
  $('wbattle').querySelectorAll('.wbt-opt, .pw').forEach((b, k) => { b.disabled = true; if (k === q.answer) b.classList.add('right'); });
  if (!ok) el.classList.add('wrong');
  let blocked = false;
  const xp = w.raider ? 20 : w.elite ? 16 : 8;
  if (ok) {
    KG.app.sfx('good'); battle.hp--;
    const core = w.raider ? null : w.obj.children[0], base = w.raider ? 1.1 : w.elite ? 1.45 : 1;
    bolt(w.raider ? w.obj.position.clone().setY(w.obj.position.y + 1.6) : w.obj.position, w.elite || w.raider ? 0xffb040 : 0xffd166, () => {
      KG.app.sfx('hit'); S_SHAKE = 0.2;
      if (core) core.material.emissive.setHex(0xffffff);
      // a shade swells; a raider staggers back
      let f = 0; anims.push(dt => { f += dt / 0.3; const k = Math.sin(Math.min(1, f) * Math.PI); if (w.raider) { w.obj.userData.body.rotation.x = -k * 0.5; } else w.obj.scale.setScalar(base * (1 + k * 0.3)); if (f >= 1) { if (core) core.material.emissive.setHex(w.elite ? 0xff3a3a : 0x7a3aff); return false; } });
      if (last) {
        // the shade bursts into motes of light that fly home to you
        w.dead = true; w.obj.visible = false; w.respawn = 90; burst(w.obj.position, w.raider ? 0xffd166 : 0xb388ff, 60); BURSTS.fire({ x: w.obj.position.x, y: groundAt(w.obj.position.x, w.obj.position.z), z: w.obj.position.z }, w.raider ? 0xffc870 : 0xc8b0ff);
        for (let k = 0; k < 14; k++) { const p = w.obj.position.clone(); setTimeout(() => SPK.emit(p.lerp(player.position.clone().setY(player.position.y + 1.4), 0.15), { color: 0xe0d0ff, n: 2, speed: 1, size: 0.5, life: 0.5 }), k * 40); }
      }
    });
    if (last) {
      const W0 = ws();
      if (w.raider) { const R = E.state.raiders; R.count = Math.max(0, R.count - 1); R.beaten = (R.beaten || 0) + 1; if (!R.count) setTimeout(() => KG.app.toast('🏰 <b>The valley is safe again.</b> Every raider has been driven off!', 'gold'), 1500); }
      else { W0.wisps++; (W0.calm = W0.calm || {})[w.key] = Date.now() + 90000; }
      E.gainXP(xp, w.raider ? 5 : w.elite ? 3 : 1); E.checkAchievements(); E.questProgress('shades'); refreshMarkers();
    }
    else battle.i++;
  } else {
    KG.app.sfx('bad');
    if (P.shield) { P.shield = false; blocked = true; } else { P.hearts = Math.max(0, P.hearts - 1); P.hurtT = 1; }
    S_SHAKE = 0.4;
    const away = player.position.clone().sub(w.obj.position).setY(0).normalize(); P.vel.addScaledVector(away, 9); w.cool = 4;
    SPK.emit(player.position.clone().setY(player.position.y + 1.2), { color: 0x8a3aff, n: 30, speed: 4, size: 0.4 });
  }
  const more = ok && !last;
  $('wbtfb').innerHTML = `<div class="wbt-fb ${ok ? 'ok' : 'no'}">${more ? `⚡ A hit! ${battle.hp} more to banish it.` : ok ? `✨ The shade dissolves into light! +${xp} XP` : `${blocked ? '🛡 Your shield takes the blow!' : '💔 It strikes you!'} ${q.explain || ''}`}</div><button class="btn ${ok ? 'good' : 'bad'} wide" id="wbtgo">${more ? 'Next ⚡' : 'Continue'}</button>`;
  updateHUD();
  $('wbtgo').onclick = more ? battleQ : endBattle; $('wbtgo').focus();
  if (more) { const at = battle.i; setTimeout(() => { if (battle && battle.i === at && battle.done) battleQ(); }, 1400); }
}
function endBattle() {
  $('wbattle').classList.remove('on'); $('wbattle').innerHTML = '';
  battle = null; ARENA.hide();
  if (P.hearts <= 0) {
    const m = ents.filter(e => e.kind === 'mentor').sort((a, b) => Math.hypot(a.x - player.position.x, a.z - player.position.z) - Math.hypot(b.x - player.position.x, b.z - player.position.z))[0];
    dialog('😵 You fainted…', `<p>The shades overwhelmed you. You wake beside ${esc(m.T[1])}, who gives you some bread and water.</p><p class="muted small">Tip: review your words in 🔁 Review to make the shades easier.</p>`, [{ label: 'Get up', cls: 'primary' }]);
    P.hearts = P.maxHearts;
    { const p = besideMentor(m); player.position.set(p.x, groundAt(p.x, p.z), p.z); }
    updateHUD();
  }
}
let S_SHAKE = 0;
// sparkles and dust (js/fx.js)
function burst(pos, color, n = 36) {
  SPK.emit(pos, { color, n, speed: 5, up: 0.8, gravity: -5, size: 0.42 });
  SPK.emit(pos, { color: 0xffffff, n: Math.round(n / 3), speed: 2, up: 0.5, gravity: 0, size: 0.7, life: 0.5 });
}

// ── input ─────────────────────────────────────────────────────
addEventListener('keydown', e => {
  if (!active) return;
  if (mode === 'stage') { if (stage.key(e)) e.preventDefault(); return; }
  if (cine) { if (e.key === 'Escape') endCutscene(); else if (e.key === 'Enter' || e.code === 'Space') { if (cine.t > 0.4) nextShot(); e.preventDefault(); } return; }
  if (SQ.active() && SQ.key(e)) { e.preventDefault(); return; }
  if (battle) { if (/^[1-4]$/.test(e.key)) { const b = document.querySelector(`[data-bo="${+e.key - 1}"]`); if (b) b.click(); } else if (e.key === 'Enter') { const g = $('wbtgo'); if (g) g.click(); } return; }
  if (dlgOpen) { if (e.key === 'Escape') closeDialog(); return; }
  input.keys[e.code] = true;
  if (e.code === 'Space') { input.jump = true; e.preventDefault(); }
  if (e.code === 'KeyE' || e.code === 'Enter') tryTalk();
  $('whelp').classList.add('gone');
});
addEventListener('keyup', e => { input.keys[e.code] = false; });
const canvas = renderer.domElement;
canvas.addEventListener('pointerdown', e => {
  if (mode === 'stage') { stage.pointer(e); return; }
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* pointer already gone */ }
  // the walking stick sits on the side the player chooses (Profile → Settings), right by default
  const right = stickRight();
  if (e.pointerType === 'touch' && (right ? e.clientX > innerWidth * 0.5 : e.clientX < innerWidth * 0.5) && !input.joy) {
    input.joy = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0 };
    const j = $('wjoy'); j.style.left = (e.clientX - 60) + 'px'; j.style.top = (e.clientY - 60) + 'px'; j.classList.add('on');
  } else input.drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
});
canvas.addEventListener('pointermove', e => {
  if (input.joy && e.pointerId === input.joy.id) {
    let dx = e.clientX - input.joy.x0, dy = e.clientY - input.joy.y0; const m = Math.hypot(dx, dy), max = 55;
    // the stick follows a finger that slides past its edge, so it never feels stuck
    if (m > max * 1.6) { input.joy.x0 += dx * (1 - max * 1.6 / m); input.joy.y0 += dy * (1 - max * 1.6 / m); const j = $('wjoy'); j.style.left = (input.joy.x0 - 60) + 'px'; j.style.top = (input.joy.y0 - 60) + 'px'; dx = e.clientX - input.joy.x0; dy = e.clientY - input.joy.y0; }
    const m2 = Math.hypot(dx, dy); if (m2 > max) { dx *= max / m2; dy *= max / m2; }
    input.joy.dx = dx / max; input.joy.dy = dy / max;
    $('wknob').style.transform = `translate(${dx}px, ${dy}px)`;
  } else if (input.drag && e.pointerId === input.drag.id) {
    cam.yaw -= (e.clientX - input.drag.x) * 0.006; cam.pitch = Math.min(1.25, Math.max(0.08, cam.pitch + (e.clientY - input.drag.y) * 0.004));
    input.drag.x = e.clientX; input.drag.y = e.clientY; cam.auto = 1.5;
  }
});
const endPtr = e => {
  if (input.joy && e.pointerId === input.joy.id) { input.joy = null; $('wjoy').classList.remove('on'); $('wknob').style.transform = ''; }
  if (input.drag && e.pointerId === input.drag.id) input.drag = null;
};
canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr);
canvas.addEventListener('wheel', e => { cam.dist = Math.min(16, Math.max(4, cam.dist + e.deltaY * 0.01)); e.preventDefault(); }, { passive: false });
$('wjump').addEventListener('pointerdown', e => { input.jump = true; e.preventDefault(); });
$('wtalk').addEventListener('click', () => tryTalk());
$('wmapbtn').addEventListener('click', () => { if (!battle && !cine) worldMap(); });

let nearEnt = null;
function tryTalk() { if (nearEnt && !dlgOpen && !battle && !cine) talk(nearEnt); }

// ── update loop ───────────────────────────────────────────────
let active = false, raf = 0, saveT = 0;
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
function step(dt) {
  const t = clock.elapsedTime, pos = player.position;
  const busy = dlgOpen || battle || cine || traveling || SQ.busy();
  // input → movement
  let f = 0, r = 0;
  if (!busy) {
    const k = input.keys;
    if (k.KeyW || k.ArrowUp) f += 1; if (k.KeyS || k.ArrowDown) f -= 1;
    if (k.KeyA || k.ArrowLeft) r -= 1; if (k.KeyD || k.ArrowRight) r += 1;
    if (input.joy) { const jm = Math.hypot(input.joy.dx, input.joy.dy); if (jm > 0.12) { const k = (jm - 0.12) / 0.88 / jm; f -= input.joy.dy * k; r += input.joy.dx * k; } }
  }
  const mag = Math.min(1, Math.hypot(f, r));
  const run = input.keys.ShiftLeft || input.keys.ShiftRight;
  // on a stick, speed follows how far you push: a gentle walk, then a run at the edge
  const speed = input.joy ? (mag < 0.8 ? mag * 6.5 : 5.2 + (mag - 0.8) * 22) : mag * (run ? 9.5 : 5.5);
  const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
  let mx = fx * f + rx * r, mz = fz * f + rz * r; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
  if (mag > 0.05) {
    const want = Math.atan2(mx, mz);
    let dr = want - player.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr));
    player.rotation.y += dr * Math.min(1, dt * 12);
    P.turn += (Math.max(-1, Math.min(1, dr * 2)) - P.turn) * Math.min(1, dt * 8);
  } else P.turn *= Math.max(0, 1 - dt * 8);
  P.vel.x += (mx * speed - P.vel.x) * Math.min(1, dt * 10);
  P.vel.z += (mz * speed - P.vel.z) * Math.min(1, dt * 10);
  if (mag <= 0.05) { P.vel.x *= Math.max(0, 1 - dt * 10); P.vel.z *= Math.max(0, 1 - dt * 10); }
  // forgiving jumps: a tap just before landing still counts, and so does one just after stepping off an edge
  if (input.jump) P.jumpBuf = 0.15; P.jumpBuf = Math.max(0, (P.jumpBuf || 0) - dt); P.coyote = P.onGround ? 0.12 : Math.max(0, (P.coyote || 0) - dt);
  if (P.jumpBuf > 0 && P.coyote > 0 && P.vel.y <= 0.5 && !busy) { P.jumpBuf = P.coyote = 0; P.vel.y = 7.5; P.onGround = false; DUST.emit(pos, { color: 0xd8c8a8, n: 6, speed: 1.5, up: 0.2, gravity: 0, size: 0.5, size1: 1.1, life: 0.5 }); }
  input.jump = false;
  P.vel.y -= 22 * dt;
  const ox = pos.x, oz = pos.z, g0 = groundAt(ox, oz);
  pos.x += P.vel.x * dt; pos.z += P.vel.z * dt; pos.y += P.vel.y * dt;
  // stay inside the world, and don't walk up cliffs
  const lim = R - 7;
  pos.x = Math.max(-lim, Math.min(lim, pos.x)); pos.z = Math.max(-lim, Math.min(lim, pos.z));
  for (const c of colliders) {
    const dx = pos.x - c.x, dz = pos.z - c.z;
    if (Math.abs(dx) > c.r + 0.5 || Math.abs(dz) > c.r + 0.5) continue;
    const d = Math.hypot(dx, dz), r2 = c.r + 0.45;
    if (d < r2 && d > 0.001) { pos.x = c.x + dx / d * r2; pos.z = c.z + dz / d * r2; }
  }
  const moved = Math.hypot(pos.x - ox, pos.z - oz), g1 = groundAt(pos.x, pos.z);
  if (moved > 0 && g1 - g0 > Math.max(0.4, moved * 1.3 + 0.02) && pos.y < g1 - 0.05) { pos.x = ox; pos.z = oz; }
  if (D.water && groundAt(pos.x, pos.z) < D.water.y - 0.5) { pos.x = ox; pos.z = oz; } // no swimming
  const gy = groundAt(pos.x, pos.z);
  const wasAir = !P.onGround, fall = P.vel.y;
  if (pos.y <= gy) { pos.y = gy; P.vel.y = 0; P.onGround = true; }
  const hs = Math.hypot(P.vel.x, P.vel.z);
  // a puff of dust on landing and from running feet; sparkles trail from the wand
  if (wasAir && P.onGround && fall < -4) { P.landT = 0.18; DUST.emit(pos, { color: 0xd8c8a8, n: 10, speed: 2.4, up: 0.15, gravity: 0, drag: 3, size: 0.5, size1: 1.3, life: 0.6 }); }
  P.landT = Math.max(0, (P.landT || 0) - dt);
  if (P.onGround && hs > 6.5 && (P.dustT = (P.dustT || 0) - dt) <= 0) { P.dustT = 0.11; DUST.emit(pos, { color: 0xcdbb98, n: 2, speed: 0.8, up: 0.3, gravity: 0.3, drag: 2, size: 0.35, size1: 0.9, life: 0.55 }); }
  if (!LOW && hs > 2 && (P.wandT = (P.wandT || 0) - dt) <= 0) { P.wandT = 0.06; SPK.emit(player.userData.arms[1].localToWorld(tmp2.set(0, -0.8, 0.4)), { color: 0xffe08a, n: 1, speed: 0.3, up: 0.3, gravity: 0.4, size: 0.18, life: 0.6 }); }
  animatePerson(player, P.onGround ? hs : 0, dt);
  FX.heroPose(player, { speed: P.onGround ? hs : 0, onGround: P.onGround, vy: P.vel.y, landed: P.landT, t, turn: P.turn });
  if (pet) {
    const back = player.rotation.y + Math.PI * 0.75, tx = pos.x + Math.sin(back) * 1.4, tz = pos.z + Math.cos(back) * 1.4;
    pet.position.x += (tx - pet.position.x) * Math.min(1, dt * 3); pet.position.z += (tz - pet.position.z) * Math.min(1, dt * 3);
    const py = groundAt(pet.position.x, pet.position.z);
    pet.position.y = py + (pet.userData.fly ? pet.userData.fly + Math.sin(t * 2.5) * 0.25 : Math.abs(Math.sin(t * 6)) * (Math.hypot(P.vel.x, P.vel.z) > 0.5 ? 0.25 : 0.03));
    pet.rotation.y = Math.atan2(pos.x - pet.position.x, pos.z - pet.position.z);
    animatePet(pet, t, dt);
  }

  // camera: a cutscene, or follow and gently swing behind the player while walking
  if (cine) updateCine(dt, t);
  else {
    cam.auto = Math.max(0, cam.auto - dt);
    // the camera swings round behind the hero as you walk (more readily on a phone stick)
    if (mag > 0.3 && cam.auto <= 0 && (f > 0.2 || (input.joy && f > -0.4))) {
      let d = (player.rotation.y + Math.PI) - cam.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      cam.yaw += d * dt * (input.joy ? 2.2 : 1.2) * Math.min(1, mag);
    }
    // pull the camera in when a hill or wall stands between it and the hero
    // through a cottage door: the camera comes inside with you
    const room = VEN.room(pos);
    if (room !== DOOR) doorway(room);
    const cDist = INDOOR ? Math.min(cam.dist, 4.6) : cam.dist, cPitch = INDOOR ? Math.max(0.55, Math.min(0.8, cam.pitch)) : cam.pitch;
    let cd = cDist;
    for (let k = 1; k <= 6; k++) {
      const f = k / 6, cx = pos.x + Math.sin(cam.yaw) * Math.cos(cPitch) * cDist * f, cz = pos.z + Math.cos(cam.yaw) * Math.cos(cPitch) * cDist * f;
      if (groundAt(cx, cz) + 0.6 > pos.y + 1.4 + Math.sin(cPitch) * cDist * f) { cd = Math.max(2.5, cDist * (f - 1 / 6)); break; }
    }
    const cy = Math.sin(cPitch) * cd, ch = Math.cos(cPitch) * cd;
    tmp.set(pos.x + Math.sin(cam.yaw) * ch, pos.y + 1.4 + cy, pos.z + Math.cos(cam.yaw) * ch);
    tmp.y = Math.max(tmp.y, groundAt(tmp.x, tmp.z) + 0.8);
    // in a shade battle the camera looks over the hero's shoulder at the shade;
    // while fishing it looks out towards the bobber
    const foe = battle && battle.w.obj.position, focus = foe || SQ.focus(), aim = foe || (SQ.busy() && focus);
    if (aim) {
      const dx = aim.x - pos.x, dz = aim.z - pos.z, dl = Math.hypot(dx, dz) || 1, sd = foe ? 1.8 : 1.2;
      tmp.set(pos.x - dx / dl * 5.5 - dz / dl * sd, Math.max(pos.y, aim.y) + (foe ? 5 : 4), pos.z - dz / dl * 5.5 + dx / dl * sd);
      tmp.y = Math.max(tmp.y, groundAt(tmp.x, tmp.z) + 1);
    }
    if (INDOOR && !aim) { INDOOR.roomCam(pos, tmp); let dy = INDOOR.face - cam.yaw; cam.yaw += Math.atan2(Math.sin(dy), Math.cos(dy)) * Math.min(1, dt * 3); }
    if (INDOOR) INDOOR.clampCam(tmp);
    camera.position.lerp(tmp, cam.snap ? 1 : Math.min(1, dt * (aim ? 4 : 8))); cam.snap = false;
    camLook.lerp(tmp2.set(pos.x, pos.y + 1.4, pos.z).lerp(focus || tmp2, focus ? (foe ? 0.45 : 0.7) : 0), Math.min(1, dt * 6));
    camera.lookAt(camLook);
    if (S_SHAKE > 0) { S_SHAKE = Math.max(0, S_SHAKE - dt); camera.position.x += (Math.random() - 0.5) * S_SHAKE; camera.position.y += (Math.random() - 0.5) * S_SHAKE; }
  }
  sun.position.set(pos.x + 30, pos.y + 60, pos.z + 20); sun.target.position.set(pos.x, pos.y, pos.z);
  sky.position.copy(camera.position); HILLS.update(camera.position);

  // portals
  const gu = gate.userData;
  if (gu.portal.visible) { gu.portal.userData.disc.rotation.z -= dt * 1.5; gu.portal.children[0].rotation.z += dt * 0.4; gu.portal.userData.vortex.userData.update(dt); gu.portal.userData.vortex2.userData.update(dt); }
  if (backPortal) {
    backPortal.g.userData.disc.rotation.z += dt;
    const bd = Math.hypot(pos.x - backPortal.x, pos.z - backPortal.z);
    if (bd > 5) backPortal.armed = true;
    else if (bd < 1.6 && backPortal.armed && !busy) travel(WI - 1, 'gate');
  }
  if (!busy && gu.portal.visible && Math.hypot(pos.x - gu.x, pos.z - gu.z) < 2.2) travel(WI + 1, 'spawn');
  if (bannerT > 0 && (bannerT -= dt) <= 0) $('wbanner').classList.remove('on');

  // NPCs idle & interaction
  nearEnt = null; let best = 3.6;
  for (const e of ents) {
    const d = Math.hypot(pos.x - e.x, pos.z - e.z);
    e.mark.position.y = (e.tagY || 2.7) + 0.9 + Math.sin(t * 3) * 0.12;
    if (e.tag) e.tag.visible = !INDOOR || camera.position.distanceTo(e.obj.position) > 3.2; // no giant name in your face in a small room
    if (e.kind === 'side' || e.kind === 'vgate') { if (d < best) { best = d; nearEnt = e; } continue; }
    if (e.kind === 'pedestal') { e.spin.rotation.y += dt; e.spin.position.y = 1.7 + Math.sin(t * 2) * 0.1; }
    else if (d < 12 && !cine) { const want = Math.atan2(pos.x - e.x, pos.z - e.z); let dr = want - e.obj.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); e.obj.rotation.y += dr * Math.min(1, dt * 3); }
    if (e.kind !== 'pedestal') animatePerson(e.obj, 0, dt);
    if (d < best) { best = d; nearEnt = e; }
  }
  const pr = $('wprompt');
  if (nearEnt && !busy && !(SQ.active() && nearEnt.kind === 'side')) { pr.innerHTML = `<b>E</b> / 💬 ${nearEnt.kind === 'pedestal' ? 'Examine' : nearEnt.kind === 'guardian' ? 'Confront' : nearEnt.kind === 'side' ? (nearEnt.sq === 'courier' ? 'Help' : 'Play at') : nearEnt.kind === 'vgate' ? 'Open' : 'Talk to'} ${esc(nearEnt.label)}`; pr.classList.add('on'); $('wtalk').classList.add('on'); }
  else { pr.classList.remove('on'); $('wtalk').classList.remove('on'); }

  // quest arrow
  if (W.target) {
    const a = Math.atan2(W.target.x - pos.x, W.target.z - pos.z) - (cam.yaw + Math.PI);
    $('wqarrow').style.transform = `rotate(${-a}rad)`;
  }
  if (beacon) beacon.material.opacity = 0.14 + Math.sin(t * 2) * 0.06;

  // collectibles
  const w = ws();
  for (const l of letters) {
    if (!l.s.visible) continue;
    l.s.position.y = groundAt(l.x, l.z) + 1.3 + Math.sin(t * 2 + l.i) * 0.2;
    if (Math.hypot(pos.x - l.x, pos.z - l.z) < 1.3 && Math.abs(pos.y + 1 - l.s.position.y) < 2) {
      l.s.visible = false; w.letters.push(l.i);
      const A = KG.alphabet[l.i];
      KG.app.sfx('combo'); burst(l.s.position, 0xffd166);
      E.gainXP(5);
      KG.app.toast(`<span class="gk big">${A.U} ${A.l}</span> <b>${A.name}</b> · ${esc(A.say)} <span class="muted">(${w.letters.length}/24 letters)</span>`, 'gold');
      if (w.letters.length === 24) { KG.app.confetti(); E.checkAchievements(); }
    }
  }
  for (const sc of scrolls) {
    if (!sc.g.visible) continue;
    sc.g.rotation.y += dt * 1.5; sc.g.position.y = groundAt(sc.x, sc.z) + 1.2 + Math.sin(t * 2 + sc.x) * 0.15;
    if (Math.hypot(pos.x - sc.x, pos.z - sc.z) < 1.4) {
      sc.g.visible = false; burst(sc.g.position, 0xffe9a8);
      if (KG.reader) KG.reader.unlockScroll(sc.p.id); E.gainXP(10, 2);
    }
  }
  for (const c of coins) {
    if (!c.c.visible) continue;
    c.c.rotation.z += dt * 3;
    // coins bob gently and catch the light now and then
    c.y0 ??= c.c.position.y; c.c.position.y = c.y0 + Math.sin(t * 2.2 + c.i) * 0.12;
    if (!LOW && Math.random() < dt * 0.7 && Math.abs(pos.x - c.x) + Math.abs(pos.z - c.z) < 40) SPK.emit(c.c.position, { color: 0xfff4c0, n: 1, speed: 0, up: 0, gravity: 0, size: 0.7, size1: 0, life: 0.35, spread: 0.4 });
    if (Math.hypot(pos.x - c.x, pos.z - c.z) < 1.1 && Math.abs(pos.y + 0.8 - c.c.position.y) < 1.6) {
      c.c.visible = false; w.coins.got.push(c.i); E.state.coins++; KG.app.sfx('coin'); E.questProgress('coins');
      SPK.emit(c.c.position, { color: 0xffd166, n: 10, speed: 2.5, size: 0.3, life: 0.5 });
      FX.flyToHUD(camera, renderer, c.c.position, $('wcoins'), '🪙'); setTimeout(updateHUD, 700);
    }
  }

  // wisps
  for (const wi of wisps) {
    if (wi.dead) { if (!wi.raider && (wi.respawn -= dt) <= 0) spawnWisp(wi); continue; }
    wi.t += dt; wi.cool = Math.max(0, (wi.cool || 0) - dt);
    const o = wi.obj.position, d = Math.hypot(pos.x - o.x, pos.z - o.z);
    const safe = SQ.active() || ents.some(e => (e.kind === 'mentor' || e.kind === 'side') && Math.hypot(pos.x - e.x, pos.z - e.z) < 9) || (backPortal && Math.hypot(pos.x - backPortal.x, pos.z - backPortal.z) < 8);
    let tx, tz, sp;
    const charge = d < (wi.raider ? 14 : 10) && !safe && !busy && wi.cool <= 0;
    if (charge) { tx = pos.x; tz = pos.z; sp = wi.raider ? 4.2 : 3.6; }
    else { if (!wi.target || Math.hypot(wi.target.x - o.x, wi.target.z - o.z) < 1) wi.target = { x: wi.home.x + (Math.random() - 0.5) * 16, z: wi.home.z + (Math.random() - 0.5) * 16 }; tx = wi.target.x; tz = wi.target.z; sp = wi.raider ? 1.1 : 1.4; }
    const dx = tx - o.x, dz = tz - o.z, dl = Math.hypot(dx, dz) || 1;
    o.x += dx / dl * sp * dt; o.z += dz / dl * sp * dt;
    if (wi.raider) {
      // raiders stomp along the ground, club raised when they charge
      o.y = groundAt(o.x, o.z);
      if (busy && battle && battle.w === wi) wi.obj.rotation.y = Math.atan2(pos.x - o.x, pos.z - o.z);
      else wi.obj.rotation.y = Math.atan2(dx, dz);
      animateRaider(wi.obj, sp, dt, charge);
      if (!LOW && (wi.emberT = (wi.emberT || 0) - dt) <= 0 && d < 40) { wi.emberT = 0.15; SPK.emit(wi.obj.userData.flame[0].getWorldPosition(tmp2), { colors: [0xffb04a, 0xff6a2a], n: 1, speed: 0.4, up: 1.2, gravity: 1.2, drag: 0.8, size: 0.2, life: 0.9 }); }
      if (charge && (wi.dustT = (wi.dustT || 0) - dt) <= 0) { wi.dustT = 0.15; DUST.emit(o, { color: 0xb8a888, n: 1, speed: 0.6, up: 0.3, gravity: 0.3, size: 0.4, size1: 1, life: 0.5 }); }
      if (d < 1.6 && !busy && wi.cool <= 0 && P.hearts > 0) startBattle(wi);
      continue;
    }
    o.y = groundAt(o.x, o.z) + 1.3 + Math.sin(wi.t * 3) * 0.25;
    wi.obj.rotation.y = Math.atan2(pos.x - o.x, pos.z - o.z);
    wi.obj.children[0].rotation.x += dt;
    if (wi.obj.userData.tail) { const tl = wi.obj.userData.tail; tl.rotation.z = Math.sin(wi.t * 4) * 0.25; tl.scale.set(1 + Math.sin(wi.t * 6) * 0.1, 1 + Math.sin(wi.t * 5) * 0.15, 1); }
    if (!LOW && (wi.trailT = (wi.trailT || 0) - dt) <= 0) { wi.trailT = 0.09; SPK.emit(o, { color: wi.elite ? 0xff5a5a : 0x9a6aff, n: 1, speed: 0.4, up: 0.6, gravity: 0.6, size: wi.elite ? 0.5 : 0.35, life: 0.9 }); }
    if (d < 1.3 && !busy && wi.cool <= 0 && P.hearts > 0) startBattle(wi);
  }

  // hearts regenerate slowly
  if (P.hearts < P.maxHearts && (P.regen += dt) > 25) { P.regen = 0; P.hearts++; updateHUD(); }
  P.hurtT = Math.max(0, P.hurtT - dt);
  root.classList.toggle('hurt', P.hurtT > 0);

  // reaching the library
  if (W.libraryPos && WI === NZ - 1 && !w.finale && !busy && Math.hypot(pos.x - W.libraryPos.x, pos.z - W.libraryPos.z) < 5 && gateOpen(NZ - 1)) {
    w.finale = true; E.save(); KG.app.confetti(250); KG.app.sfx('level');
    const lib = V(0, groundAt(0, -40) + 8, -40);
    cutscene([
      { cam: orbitShot(0, -36, 22, 10, 0.9, 2.2), look: () => lib, who: '🏛 The Great Library', text: 'The doors swing open. Shelves of scrolls glow with every word you have restored. <b>You can read the New Testament in Greek.</b>' },
      { cam: faceShot(ents.find(e => e.kind === 'mentor').obj, 5), look: () => headOf(ents.find(e => e.kind === 'mentor').obj), who: 'Λουκᾶς · Luke', speaker: ents.find(e => e.kind === 'mentor').obj, speak: 'Τετέλεσται', text: '<span class="gk">Τετέλεσται.</span> <i>It is finished</i>, but the reading has only begun, Master Theophilus. Keep your words fresh in Review, and keep reading!' },
      { cam: behindPlayer(), look: () => V(pos.x, pos.y + 1.4, pos.z), dur: 1.2, cut: false },
    ]);
  }

  SPK.update(dt); DUST.update(dt); ARENA.update(dt); BURSTS.update(dt); if (!INDOOR) POND.update(dt, pos); STARS.update(dt, camera.position, INDOOR ? 0 : ((MOODS[MOOD] || ATMOS[WI]).stars || 0));
  { const want = !LOW && !INDOOR && ((MOODS[MOOD] || ATMOS[WI]).stars || 0) > 0.5 ? 7 : 0; heroLight.intensity += (want - heroLight.intensity) * Math.min(1, dt * 2); heroLight.position.set(pos.x, pos.y + 2.2, pos.z); }
  FX.hero.value.copy(pos);
  SHAFTS.update(dt, pos, camera.position, groundAt, INDOOR ? 0 : SHAFT.k, SHAFT.dir);
  CRIT.update(dt, t, pos, groundAt, INDOOR ? 0 : ((MOODS[MOOD] || ATMOS[WI]).stars || 0) < 0.5 ? 1 : 0);
  for (let i = anims.length - 1; i >= 0; i--) if (anims[i](dt, t) === false) anims.splice(i, 1);
  updateCritters(dt, t, pos);
  SQ.update(dt, t, pos, P.onGround);
  VEN.update(dt, t, pos, P.onGround);
  if (!INDOOR) moodMotes(MOOD, SPK, pos, dt);
  // lightning in the storm: the whole valley flickers bright for a moment
  if (MOODS[MOOD] && MOODS[MOOD].name === 'storm' && !INDOOR && (P.boltT = (P.boltT ?? 4) - dt) <= 0) {
    P.boltT = 5 + Math.random() * 9; FLASH = 1.3; setTimeout(() => { FLASH = 1.0; }, 160);
  }
  FLASH = Math.max(0, FLASH - dt * 3.5);
  updateAmbience(dt, t, pos);

  if ((saveT += dt) > 5) { saveT = 0; savePos(); }
}
function snapCamera() {
  const pos = player.position, cd = cam.dist, ch = Math.cos(cam.pitch) * cd;
  camera.position.set(pos.x + Math.sin(cam.yaw) * ch, pos.y + 1.4 + Math.sin(cam.pitch) * cd, pos.z + Math.cos(cam.yaw) * ch);
  camLook.set(pos.x, pos.y + 1.4, pos.z); camera.lookAt(camLook);
}
function savePos() { const w = ws(); w.hearts = P.hearts; w.zone = WI; w.x = +player.position.x.toFixed(2); w.z = +player.position.z.toFixed(2); w.yaw = +cam.yaw.toFixed(3); E.save(); }

// Phones: if frames run slow, lower the resolution a little (and raise it again when there is headroom)
const perf = { acc: 0, n: 0, t: 0 };
function adaptQuality(dt) {
  perf.acc += dt; perf.n++;
  if ((perf.t += dt) < 2) return;
  const avg = perf.acc / perf.n; perf.acc = perf.n = perf.t = 0;
  let pr = pixelRatio;
  if (avg > 1 / 40 && pr > 0.75) pr = Math.max(0.75, pr - 0.25);
  else if (avg < 1 / 57 && pr < MAXPR) pr = Math.min(MAXPR, pr + 0.25);
  if (pr !== pixelRatio) { pixelRatio = pr; renderer.setPixelRatio(pr); renderer.setSize(innerWidth, innerHeight); }
}
let mode = 'world', worldShown = false, stage;
function loop() {
  if (!active) return;
  raf = requestAnimationFrame(loop);
  const dt = Math.min(0.05, clock.getDelta());
  FX.tick(clock.elapsedTime);
  if (mode === 'stage') { renderer.toneMappingExposure = 1; stage.update(dt, clock.elapsedTime); stage.render(renderer); }
  else { step(dt); renderer.toneMappingExposure = EXPO + FLASH; BLOOM.render(scene, camera);
    if (BLOOM.enabled) { bloomPerf.acc += dt; bloomPerf.n++; if ((bloomPerf.t += dt) > 3) { if (bloomPerf.acc / bloomPerf.n > 1 / 38) BLOOM.enabled = false; bloomPerf.acc = bloomPerf.n = bloomPerf.t = 0; } } }
  adaptQuality(dt);
}
function startLoop() { if (!active) { active = true; clock.getDelta(); loop(); } }
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h); camera.aspect = w / h;
  // portrait phones get a wider view so the hero doesn't fill the screen
  camera.fov = w / h < 0.8 ? 74 : 60; cam.dist = Math.max(cam.dist, w / h < 0.8 ? 10 : 8.5);
  camera.updateProjectionMatrix();
  if (stage) { stage.camera.aspect = w / h; stage.resize(); }
}
addEventListener('resize', resize);

// ── public API ────────────────────────────────────────────────
let pending = [];
W.show = () => {
  if (stage) stage.exit();
  mode = 'world'; worldShown = true;
  root.classList.remove('staging');
  root.classList.add('on');
  root.classList.toggle('stick-right', stickRight());
  resize();
  refreshMarkers();
  for (const sc of scrolls) sc.g.visible = !(E.state.scrolls || {})[sc.p.id];
  snapCamera();
  startLoop();
  const todo = pending; pending = [];
  if (todo.length) todo.forEach(p => p());
  else setTimeout(arrive, 400);
};
W.hide = () => {
  if (mode === 'world' && worldShown) savePos();
  if (cine) endCutscene();
  worldShown = false; mode = 'world'; if (stage) stage.exit(); SQ.stop();
  active = false; cancelAnimationFrame(raf); root.classList.remove('on', 'staging'); closeDialog();
};
// The 3D trial stage used by every lesson, boss, review and arcade game.
W.stage = {
  get ok() { return !!stage; },
  enter(kind, unit, nodeId) { if (mode === 'world' && worldShown) savePos(); if (cine) endCutscene(); closeDialog(); mode = 'stage'; root.classList.add('on', 'staging'); resize(); stage.enter(kind, unit, nodeId); startLoop(); },
  ask: (q, h) => stage.ask(q, h), reveal: (ok, c, r) => stage.reveal(ok, c, r), result: ok => stage.result(ok),
  teach: item => stage.teach(item), trial: foe => stage.trial(foe), mini: (q, done) => stage.mini(q, done),
  hp: f => stage.hp(f), combo: n => stage.combo(n), celebrate: w => stage.celebrate(w), orderLine: () => stage.orderLine(), lock: () => stage.lock(),
  hint: idx => stage.hint(idx), slow: s => stage.slow(s), shield: on => stage.shield(on), stopMini: () => stage.stopMini(),
  get active() { return mode === 'stage'; },
};
W.onLessonDone = (node, r) => {
  if (node.type === 'boss' && r.passed && r.firstClear) pending.push(() => {
    if (WI !== node.unit) { buildWorld(node.unit); placeAt('gate'); snapCamera(); }
    setTimeout(() => cutscene(guardianShots(node.unit)), 300);
  });
  if (node.type === 'reading' && r.passed && r.firstClear) pending.push(() => {
    const e = ents.find(x => x.kind === 'pedestal' && x.node.id === node.id);
    if (e) burst(new THREE.Vector3(e.x, groundAt(e.x, e.z) + 2, e.z), 0xffffff);
  });
};
W.travel = (i, where) => travel(i, where);
W.debug = { BLOOM, BURSTS, ARENA, get moodNow() { return MOOD; }, get indoor() { return !!INDOOR; }, mood: m => { MOOD = m; setAtmosphere(WI); }, sim: (n, dt = 1 / 60) => { for (let i = 0; i < n; i++) step(dt); }, VEN, startBattle: w => startBattle(w), SQ, scene, camera, player, cam, P, ents, wisps, questTarget, get world() { return WI; }, groundAt: (x, z) => groundAt(x, z), along: (t, s, o) => along(t, s, o), travel, cutscene, endCutscene, get cine() { return cine; }, gate: () => gate,
  teleport: (x, z) => { player.position.set(x, groundAt(x, z), z); snapCamera(); } };

// ── build ─────────────────────────────────────────────────────
(async () => {
  try { await Promise.race([document.fonts.load(`700 40px "Gentium Plus"`), new Promise(r => setTimeout(r, 2500))]); } catch (e) { /* fall back to serif */ }
  const w = ws();
  // raiders who came while you were away; the hearts you had when you left
  const raided = tallyRaiders(E, U);
  if (raided) setTimeout(() => KG.app.toast(`⚔️ <b>While you were away, ${raided} Raider${raided > 1 ? 's' : ''} of Forgetting crept into the valley!</b> Drive them off by remembering your words.`, 'gold'), 2500);
  if (typeof w.hearts === 'number') P.hearts = Math.max(1, Math.min(P.maxHearts, w.hearts));
  const start = reachable(w.zone) ? w.zone : 0;
  buildWorld(start);
  if (typeof w.x === 'number' && start === w.zone) placeAt({ x: Math.max(-R + 8, Math.min(R - 8, w.x)), z: Math.max(-R + 8, Math.min(R - 8, w.z)), yaw: w.yaw });
  else placeAt('spawn');
  if (typeof w.yaw === 'number' && start === w.zone) cam.yaw = w.yaw;
  if (backPortal && Math.hypot(player.position.x - backPortal.x, player.position.z - backPortal.z) > 5) backPortal.armed = true;
  snapCamera();
  setPet();
  stage = createStage({ FX, renderer, person, golem, wispMesh, ZONES, KG, animatePerson, applyLook, buildPet, animatePet, GOLEM_COL, teacherLook: (i, nodeId) => teacherLook(i, teacherIndex(i, nodeId)) });
  W.debug.stage = stage;
  W.ok = true;
  document.dispatchEvent(new Event('world-ready'));
})().catch(err => { console.error(err); document.dispatchEvent(new Event('world-failed')); });
