// The nine worlds as separate places. Each has its own road, ground shape,
// water and landmarks; js/world.js builds one at a time and the portals in
// each guardian's gate carry you to the next.

// ── deterministic noise ───────────────────────────────────────
export function hash(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
export function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export const fbm = (x, z) => vnoise(x * 0.05, z * 0.05) + vnoise(x * 0.13, z * 0.13) * 0.4 + vnoise(x * 0.31, z * 0.31) * 0.15;
export const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export const R = 64; // half-size of a world
const riverZ = x => Math.sin(x * 0.07) * 4;
const LAKE = { x: 8, z: 4, r: 24 };

// pts: the road from the arrival portal (first) to the guardian's gate (last)
// relief(x, z, d): ground height away from the road (d = distance to the road)
// baseY(x, z): the height the whole world climbs to (roads and all), for worlds on a slope
export const DEFS = [
  { // 0 · Alphabet Hollow: a green bowl of round-doored houses around a pond
    pts: [[0, 50], [-12, 34], [-4, 18], [12, 6], [6, -12], [-10, -26], [-4, -42], [0, -50]],
    relief: (x, z) => (fbm(x, z) - 0.6) * 4 * smooth(3, 10, Math.hypot(x + 24, z - 4)) + 1.5 - 4.2 * smooth(9.5, 3.5, Math.hypot(x + 24, z - 4)), // the pond sits in a bowl deep enough to fill
    water: { kind: 'pond', x: -24, z: 4, r: 8, y: -0.9 },
    trees: { n: 240, kinds: { round: 0.8, pine: 0.2 }, near: 5 },
    ring: 0x6f9a55, critter: 'sheep', flowers: 600,
    build(a) {
      const houses = [[0.1, -1, 13, 0x2f6a3a], [0.2, 1, 14, 0xc9452b], [0.36, -1, 15, 0x2f5f8f], [0.45, 1, 13, 0xe0a526], [0.62, -1, 14, 0x8f3f5f], [0.74, 1, 15, 0x3f5f8f]];
      for (const [t, s, off, col] of houses) { const p = a.along(t, s, off); a.hillHouse(p.x, p.z, col, a.faceAngle(p.x, p.z, p.px, p.pz)); }
      for (let t = 0.03; t < 0.95; t += 0.07) { const p = a.along(t, 1, 3); a.lamp(p.x, p.z); }
      // the Great Oak, ringed by the twenty-four letter stones
      const ox = 26, oz = -20;
      a.bigTree(ox, oz, 2.4, 0x4f8f3a);
      'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ'.split('').forEach((ch, i) => {
        const ang = i / 24 * Math.PI * 2, x = ox + Math.cos(ang) * 9, z = oz + Math.sin(ang) * 9;
        const st = a.mesh(new a.THREE.BoxGeometry(0.9, 1.6, 0.4), 0x9a9488); st.rotation.y = -ang + Math.PI / 2;
        const g = new a.THREE.Group(); g.add(st); st.position.y = 0.6;
        const lt = a.textSprite(ch, { size: 56, bg: null, color: '#ffe9a8', font: `700 56px ${a.GREEK}`, scale: 0.012 }); lt.position.y = 1.9; g.add(lt);
        a.put(g, x, z); a.col(x, z, 0.6);
      });
      a.well(-8, 8); a.sign(a.along(0.03, -1, 3.5), 'Alphabet Hollow');
      for (let i = 0; i < 5; i++) { const p = a.along(0.15 + i * 0.16, -1, 7); a.fence(p.x, p.z, p.a, 5); }
    },
  },
  { // 1 · The Wordwood: a deep forest around the giant Word Tree
    pts: [[-30, 48], [-22, 30], [4, 26], [18, 10], [6, -4], [-16, -14], [-18, -32], [0, -44], [6, -50]],
    relief: (x, z) => (fbm(x, z) - 0.6) * 5 + 2,
    trees: { n: 760, kinds: { round: 0.45, pine: 0.4, tall: 0.15 }, near: 3.6, scale: 1.25 },
    ring: 0x2f5a35, critter: 'deer', flowers: 200,
    build(a) {
      a.wordTree(28, -16);
      for (const [x, z] of [[-30, 10], [30, 30], [-8, -36], [-34, -30]]) a.mushrooms(x, z);
      for (const t of [0.25, 0.55, 0.8]) { const p = a.along(t, t > 0.5 ? 1 : -1, 6); a.log(p.x, p.z, p.a + 0.4); }
      a.arch(a.along(0.04, 0, 0), 0x6a5a3a, true);
      a.sign(a.along(0.06, -1, 3.5), 'The Wordwood');
    },
  },
  { // 2 · Fields of the Article: open golden farmland, a windmill and a barn
    pts: [[0, 50], [6, 30], [-4, 10], [4, -10], [-6, -30], [0, -50]],
    relief: (x, z) => (fbm(x, z) - 0.6) * 2.2 + 0.6,
    trees: { n: 70, kinds: { round: 1 }, near: 8 },
    ring: 0x8a9a4a, critter: 'sheep', wheat: true, flowers: 300,
    build(a) {
      a.windmill(-22, -8);
      a.barn(22, 20);
      for (let i = 0; i < 14; i++) { const p = a.along(0.05 + i * 0.065, i % 2 ? 1 : -1, 9 + (i * 7) % 10); a.hay(p.x, p.z); }
      for (let i = 0; i < 12; i++) { const p = a.along(0.04 + i * 0.08, i % 2 ? 1 : -1, 3.4); a.fence(p.x, p.z, p.a, 6); }
      for (const t of [0.3, 0.7]) { const p = a.along(t, t < 0.5 ? 1 : -1, 16); a.scarecrow(p.x, p.z); }
      a.sign(a.along(0.03, -1, 3.5), 'Fields of the Article');
    },
  },
  { // 3 · Verb River: a winding river, a bridge, a mill and the docks
    pts: [[0, 50], [-10, 30], [0, 12], [0, -12], [12, -30], [0, -50]],
    relief: (x, z) => (fbm(x, z) - 0.6) * 4 + 1.2,
    carve: (x, z) => -3.4 * smooth(6, 3, Math.abs(z - riverZ(x))),
    water: { kind: 'river', y: -1.2, f: riverZ, w: 6.5 },
    bridge: { x: 0, z: 0, half: 7, w: 2.6 },
    trees: { n: 260, kinds: { round: 0.7, pine: 0.3 }, near: 5, avoid: (x, z) => Math.abs(z - riverZ(x)) < 6 },
    ring: 0x5a8a5a, critter: 'duck', flowers: 300,
    build(a) {
      a.bridge(0, 0, 7, 2.6);
      a.mill(16, riverZ(16) + 7);
      a.dock(-18, riverZ(-18) - 4.5, a.rand);
      a.dock(26, riverZ(26) - 4.5, a.rand);
      for (let i = 0; i < 18; i++) { const x = -56 + i * 6.5 + a.rand() * 3, s = i % 2 ? 1 : -1; a.reeds(x, riverZ(x) + s * 5.2); }
      a.sign(a.along(0.03, -1, 3.5), 'Verb River');
    },
  },
  { // 4 · Builders' Ridge: a climbing road past Aquila's tents and half-built walls
    pts: [[-20, 50], [-6, 32], [-14, 14], [0, 0], [12, -16], [4, -34], [0, -50]],
    baseY: (x, z) => (50 - z) * 0.1,
    relief: (x, z) => (fbm(x, z) - 0.5) * 7 + 2.5 + Math.max(0, -x) * 0.12,
    trees: { n: 170, kinds: { pine: 0.8, round: 0.2 }, near: 6 },
    ring: 0x7a8a6a, critter: 'goat', rock: 0.5, flowers: 150,
    build(a) {
      const camp = a.along(0.3, 1, 9);
      for (let i = 0; i < 4; i++) a.tent(camp.x + (i % 2) * 6 - 3, camp.z + Math.floor(i / 2) * 6 - 3, [0xc9452b, 0xe0a526, 0x2f5f8f, 0xf0e6d0][i], a.rand() * 6);
      a.scaffold(a.along(0.55, -1, 10));
      a.crane(a.along(0.62, 1, 12));
      for (let i = 0; i < 6; i++) { const p = a.along(0.12 + i * 0.14, i % 2 ? -1 : 1, 7); a.blocks(p.x, p.z, a.rand); }
      a.arch(a.along(0.82, 0, 0), 0xb8b0a0, false);
      a.sign(a.along(0.03, -1, 3.5), "Builders' Ridge");
    },
  },
  { // 5 · Ruins of Time: broken temples around the Hourglass of Ages
    pts: [[0, 50], [20, 32], [26, 8], [14, -14], [-8, -22], [-20, -36], [-6, -50]],
    relief: (x, z) => (fbm(x, z) - 0.6) * 3 + 0.8,
    trees: { n: 130, kinds: { cypress: 0.6, dead: 0.4 }, near: 6 },
    ring: 0x9a7a5a, critter: 'lizard', sand: 0.55, flowers: 0,
    build(a) {
      a.hourglass(-8, 10);
      a.temple(-26, -6, 0.95, 0.6, true); a.temple(4, 30, 0.9, -2.6, true); a.temple(34, -30, 0.9, -1.2, true);
      for (let i = 0; i < 16; i++) { const p = a.along(0.04 + i * 0.06, i % 2 ? 1 : -1, 5 + a.rand() * 10); a.fallen(p.x, p.z, a.rand); }
      a.sundial(a.along(0.6, 1, 6));
      a.arch(a.along(0.9, 0, 0), 0xe0d6c0, false);
      a.sign(a.along(0.03, -1, 3.5), 'Ruins of Time');
    },
  },
  { // 6 · Mirror Lake: a road around a still lake with a shrine on its island
    pts: [[-40, 46], [-36, 22], [-32, 0], [-26, -20], [-8, -34], [14, -36], [30, -44], [34, -50]],
    relief: (x, z) => (fbm(x, z) - 0.6) * 3 + 1,
    carve: (x, z) => { const r = Math.hypot(x - LAKE.x, z - LAKE.z); return -4.2 * smooth(LAKE.r, LAKE.r * 0.7, r) + 5.6 * smooth(6, 2.5, r); },
    water: { kind: 'lake', x: LAKE.x, z: LAKE.z, r: LAKE.r * 0.98, y: -1.4 },
    trees: { n: 240, kinds: { willow: 0.5, cypress: 0.3, round: 0.2 }, near: 5, avoid: (x, z) => Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + 2 },
    ring: 0x3f6a6a, critter: 'swan', flowers: 300,
    build(a) {
      a.shrine(LAKE.x, LAKE.z);
      a.dock(-17, 2, a.rand, Math.PI / 2);
      a.lanterns(LAKE.x, LAKE.z, LAKE.r * 0.8);
      for (let i = 0; i < 16; i++) { const ang = i / 16 * Math.PI * 2, r = LAKE.r + 0.5; a.reeds(LAKE.x + Math.cos(ang) * r, LAKE.z + Math.sin(ang) * r); }
      a.sign(a.along(0.03, -1, 3.5), 'Mirror Lake');
    },
  },
  { // 7 · Declension Peaks: a switchback climb into the snow
    pts: [[-30, 48], [24, 40], [-24, 26], [24, 12], [-20, -4], [18, -20], [-6, -34], [0, -50]],
    baseY: (x, z) => (50 - z) * 0.22,
    relief: (x, z, d) => (fbm(x, z) - 0.5) * 6 + 3 + Math.max(0, d - 10) * 0.6,
    trees: { n: 220, kinds: { pine: 1 }, near: 4.5, snowy: true },
    ring: 0x8a9aa8, critter: 'goat', snowLine: 12, rock: 0.6, flowers: 0,
    build(a) {
      for (let i = 0; i < 7; i++) { const p = a.along(0.08 + i * 0.13, i % 2 ? 1 : -1, 5); a.cairn(p.x, p.z); }
      for (let i = 0; i < 10; i++) { const p = a.along(0.1 + i * 0.09, i % 2 ? -1 : 1, 12 + a.rand() * 8); a.crystal(p.x, p.z, a.rand); }
      a.flags(a.along(0.97, 1, 5));
      a.farDome(0, -150);
      a.sign(a.along(0.03, -1, 3.5), 'Declension Peaks');
    },
  },
  { // 8 · The Great Library: a colonnaded avenue to the golden dome
    pts: [[0, 50], [0, 10], [0, -30]],
    relief: (x, z) => Math.abs(x) < 13 && z > -46 ? 0 : (fbm(x, z) - 0.5) * 2 + 1.2 * smooth(13, 22, Math.abs(x)),
    trees: { n: 90, kinds: { cypress: 1 }, near: 15 },
    ring: 0x8a9a6a, critter: 'dove', flowers: 200, paved: 11,
    build(a) {
      a.plaza(0, 6, 22, 76);
      for (let z = 44; z > -32; z -= 8) for (const s of [-1, 1]) a.column(s * 9, z);
      a.fountain(-14, 18); a.fountain(14, 18);
      a.statue(-8, -24); a.statue(8, -24);
      a.library(0, -44);
      a.sign({ x: -4, z: 46 }, 'The Great Library');
    },
  },
];
