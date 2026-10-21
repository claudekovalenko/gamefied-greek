// Landmarks and props for the worlds, built from simple low-poly shapes.
// makeProps(ctx) returns the builder API used by the world definitions.
export function makeProps(ctx) {
  const { THREE, mesh, put, add, col, ground, textSprite, glyphSprite, anim, waterMat, GREEK } = ctx;
  const G = () => new THREE.Group();
  const box = (w, h, d, c, o) => mesh(new THREE.BoxGeometry(w, h, d), c, o);
  const cyl = (rt, rb, h, c, seg = 8, o) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), c, o);
  const a = {};

  a.hillHouse = (x, z, door = 0x2f6a3a, face = 0) => {
    const g = G();
    const hill = mesh(new THREE.SphereGeometry(4.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), 0x5f9a45);
    hill.scale.set(1, 0.7, 1); g.add(hill);
    const frame = mesh(new THREE.TorusGeometry(1.15, 0.18, 6, 20), 0x7a5a3a); frame.position.set(0, 1.1, 3.75); g.add(frame);
    const d = mesh(new THREE.CircleGeometry(1.05, 20), door); d.position.set(0, 1.1, 3.8); g.add(d);
    const knob = mesh(new THREE.SphereGeometry(0.1, 6, 6), 0xffd166, { metalness: 0.8, roughness: 0.3 }); knob.position.set(0, 1.1, 3.88); g.add(knob);
    for (const s of [-1, 1]) { const w = mesh(new THREE.CircleGeometry(0.5, 14), 0xffe9a8, { emissive: 0x6a5020 }); w.position.set(s * 2.2, 1.3, 3.25); w.rotation.y = s * 0.45; g.add(w); }
    const chim = cyl(0.3, 0.35, 1.4, 0x8a7a6a, 6); chim.position.set(1.4, 3, -0.8); g.add(chim);
    g.rotation.y = face; put(g, x, z, -0.3); col(x, z, 4.2);
    return g;
  };
  a.temple = (x, z, s = 1, face = 0, ruined = false, rand = Math.random) => {
    const g = G(), stone = 0xe8dfcc;
    const base = box(9, 0.8, 6.5, stone); base.position.y = 0.4; g.add(base);
    const step = box(10, 0.4, 7.5, 0xd8cfbc); step.position.y = 0.2; g.add(step);
    let k = 0;
    for (let i = 0; i < 4; i++) for (const zz of [-2.6, 2.6]) {
      if (ruined && (k++ % 3 === 1)) continue;
      const h = ruined && rand() < 0.4 ? 2 + rand() * 2 : 4.4;
      const c = cyl(0.38, 0.45, h, stone, 10); c.position.set(-3.6 + i * 2.4, 0.8 + h / 2, zz); g.add(c);
    }
    if (!ruined) {
      const roof = box(9.6, 0.6, 7, stone); roof.position.y = 5.5; g.add(roof);
      const ped = cyl(4.2, 4.2, 9.6, 0xc9452b, 3); ped.rotation.z = Math.PI / 2; ped.scale.set(1, 1, 0.26); ped.position.y = 6.4; g.add(ped);
    } else for (let i = 0; i < 4; i++) { const b = cyl(0.4, 0.4, 1.4, stone); b.rotation.z = Math.PI / 2; b.position.set(-4 + rand() * 8, 1.1, -4 + rand() * 8); g.add(b); }
    g.scale.setScalar(s); g.rotation.y = face;
    put(g, x, z, -0.2); col(x, z, 4.8 * s);
    return g;
  };
  a.lamp = (x, z) => {
    const g = G();
    const p = cyl(0.08, 0.1, 2.4, 0x3a3a3a, 6); p.position.y = 1.2; g.add(p);
    const l = mesh(new THREE.SphereGeometry(0.22, 8, 8), 0xffe9a8, { emissive: 0xffc04a, emissiveIntensity: 1.2 }); l.position.y = 2.5; g.add(l);
    put(g, x, z); col(x, z, 0.25);
  };
  a.sign = (p, text) => {
    const g = G();
    const post = cyl(0.1, 0.1, 2.2, 0x6a4a2a, 6); post.position.y = 1.1; g.add(post);
    const b = box(2.4, 0.6, 0.12, 0x8a6a3a); b.position.y = 2; g.add(b);
    const t = textSprite(text, { size: 30, bg: null, color: '#ffe9a8', scale: 0.008 }); t.position.y = 2.75; g.add(t);
    put(g, p.x, p.z); col(p.x, p.z, 0.3);
  };
  a.fence = (x, z, ang, len = 5) => {
    const g = G();
    for (let i = 0; i <= len; i += 1.25) { const p = box(0.14, 1, 0.14, 0x7a5a3a); p.position.set(0, 0.5, i - len / 2); g.add(p); }
    for (const y of [0.4, 0.8]) { const r = box(0.08, 0.1, len, 0x8a6a40); r.position.y = y; g.add(r); }
    g.rotation.y = ang; put(g, x, z);
  };
  a.well = (x, z) => {
    const g = G();
    const ring = cyl(1.1, 1.2, 0.9, 0x9a9488, 12); ring.position.y = 0.45; g.add(ring);
    const water = new THREE.Mesh(new THREE.CircleGeometry(0.9, 16), waterMat); water.rotation.x = -Math.PI / 2; water.position.y = 0.7; g.add(water);
    for (const s of [-1, 1]) { const p = box(0.15, 2, 0.15, 0x6a4a2a); p.position.set(s * 1, 1.4, 0); g.add(p); }
    const roof = cyl(0, 1.6, 0.9, 0xa0522d, 4); roof.position.y = 2.7; roof.rotation.y = Math.PI / 4; g.add(roof);
    put(g, x, z); col(x, z, 1.3);
  };
  // one large single tree for squares and clearings
  a.bigTree = (x, z, s, leaf) => {
    const g = G();
    const trunk = cyl(0.5 * s, 0.8 * s, 4 * s, 0x6a4a2a, 8); trunk.position.y = 2 * s; g.add(trunk);
    for (let i = 0; i < 6; i++) { const b = mesh(new THREE.IcosahedronGeometry(1.8 * s, 0), leaf); b.position.set(Math.cos(i) * 1.6 * s, 4.6 * s + (i % 2) * 0.8 * s, Math.sin(i) * 1.6 * s); g.add(b); }
    const top = mesh(new THREE.IcosahedronGeometry(2.2 * s, 0), leaf); top.position.y = 5.8 * s; g.add(top);
    put(g, x, z); col(x, z, 0.9 * s);
    return g;
  };
  a.wordTree = (x, z) => {
    const g = a.bigTree(x, z, 3.2, 0x2f7a3a);
    const letters = 'λόγοςἀγάπηζωήφῶςχάριςπίστις'.replace(/[^\p{L}]/gu, '');
    for (let i = 0; i < 14; i++) {
      const s = glyphSprite(letters[i % letters.length]);
      const ang = i / 14 * Math.PI * 2, r = 6 + (i % 3);
      s.position.set(Math.cos(ang) * r, 12 + (i % 4) * 2.2, Math.sin(ang) * r); g.add(s);
      s.userData.ang = ang; s.userData.r = r; s.userData.y = s.position.y;
    }
    anim((dt, t) => { for (const c of g.children) if (c.isSprite) { const an = c.userData.ang + t * 0.15; c.position.set(Math.cos(an) * c.userData.r, c.userData.y + Math.sin(t + c.userData.ang * 3) * 0.4, Math.sin(an) * c.userData.r); } });
  };
  a.mushrooms = (x, z) => {
    for (let i = 0; i < 9; i++) {
      const ang = i / 9 * Math.PI * 2, mx = x + Math.cos(ang) * 2.4, mz = z + Math.sin(ang) * 2.4, g = G(), s = 0.6 + (i % 3) * 0.25;
      const st = cyl(0.12 * s, 0.16 * s, 0.6 * s, 0xf0e6d0, 6); st.position.y = 0.3 * s; g.add(st);
      const cap = mesh(new THREE.SphereGeometry(0.4 * s, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0xc9352b); cap.position.y = 0.55 * s; g.add(cap);
      put(g, mx, mz);
    }
  };
  a.log = (x, z, ang) => { const l = cyl(0.5, 0.55, 6, 0x6a4a2a, 8); l.rotation.set(0, ang, Math.PI / 2); put(l, x, z, 0.4); col(x, z, 1.2); };
  a.arch = (p, color, wood) => {
    const g = G();
    for (const s of [-1, 1]) { const c = wood ? cyl(0.35, 0.45, 5, color, 7) : box(1, 5, 1, color); c.position.set(s * 3.4, 2.5, 0); g.add(c); }
    const top = box(8, 0.8, 1.1, color); top.position.y = 5.2; g.add(top);
    if (wood) for (let i = 0; i < 5; i++) { const lf = mesh(new THREE.IcosahedronGeometry(0.9, 0), 0x3d7d34); lf.position.set(-3 + i * 1.5, 5.8, 0); g.add(lf); }
    g.rotation.y = p.a; put(g, p.x, p.z);
    for (const s of [-1, 1]) col(p.x + Math.cos(p.a) * s * 3.4, p.z - Math.sin(p.a) * s * 3.4, 0.7);
  };
  a.windmill = (x, z) => {
    const g = G();
    const tower = cyl(1.6, 2.4, 8, 0xe8dfcc, 10); tower.position.y = 4; g.add(tower);
    const cap = cyl(0, 2.1, 2, 0x8a4a2a, 10); cap.position.y = 9; g.add(cap);
    const door = box(1, 1.8, 0.2, 0x6a4a2a); door.position.set(0, 0.9, 2.2); g.add(door);
    const hub = G(); hub.position.set(0, 7.6, 2.1); g.add(hub);
    for (let i = 0; i < 4; i++) { const arm = G(); arm.rotation.z = i * Math.PI / 2; const s = box(0.25, 6, 0.1, 0x6a4a2a); s.position.y = 3; arm.add(s); const sail = box(1.2, 4.6, 0.05, 0xf5ecd0); sail.position.set(0.7, 3.4, 0.05); arm.add(sail); hub.add(arm); }
    g.rotation.y = 0.6; put(g, x, z); col(x, z, 2.6);
    anim(dt => { hub.rotation.z += dt * 0.6; });
  };
  a.barn = (x, z) => {
    const g = G();
    const b = box(8, 4, 6, 0xa0322a); b.position.y = 2; g.add(b);
    const roof = cyl(4.5, 4.5, 8.4, 0x5a3a2a, 3); roof.rotation.z = Math.PI / 2; roof.scale.set(1, 1, 0.75); roof.position.y = 5; g.add(roof);
    const door = box(2.4, 3, 0.1, 0xf0e6d0); door.position.set(0, 1.5, 3.05); g.add(door);
    g.rotation.y = -2.2; put(g, x, z); col(x, z, 5);
  };
  a.hay = (x, z) => { const h = cyl(0.9, 0.9, 1.2, 0xe0c060, 12); h.rotation.z = Math.PI / 2; h.rotation.y = x; put(h, x, z, 0.85); col(x, z, 0.9); };
  a.scarecrow = (x, z) => {
    const g = G();
    const p = box(0.15, 3, 0.15, 0x6a4a2a); p.position.y = 1.5; g.add(p);
    const arm = box(2.4, 0.12, 0.12, 0x6a4a2a); arm.position.y = 2.3; g.add(arm);
    const shirt = box(1, 1.1, 0.5, 0x4a6aa0); shirt.position.y = 2.1; g.add(shirt);
    const head = mesh(new THREE.SphereGeometry(0.35, 8, 6), 0xe8d8a0); head.position.y = 3.05; g.add(head);
    const hat = cyl(0.25, 0.6, 0.45, 0x8a6a30, 8); hat.position.y = 3.45; g.add(hat);
    put(g, x, z); col(x, z, 0.4);
  };
  a.bridge = (x, z, half, w) => {
    const g = G(), top = ctx.bridgeTop;
    const deck = box(w * 2, 0.4, half * 2 + 1, 0x8a5a2a); deck.position.y = top - 0.2; g.add(deck);
    for (const s of [-1, 1]) {
      for (let k = -3; k <= 3; k++) { const post = cyl(0.12, 0.12, 1.2, 0x6a4020, 6); post.position.set(s * w, top + 0.5, k * 2.2); g.add(post); }
      const rail = box(0.15, 0.15, half * 2, 0x6a4020); rail.position.set(s * w, top + 1.05, 0); g.add(rail);
    }
    g.position.set(x, 0, z); add(g);
  };
  a.mill = (x, z) => {
    const g = G();
    const h = box(6, 4.4, 5, 0xd8c8a8); h.position.y = 2.2; g.add(h);
    const roof = cyl(4, 4, 6.4, 0x7a3a2a, 3); roof.rotation.z = Math.PI / 2; roof.scale.set(1, 1, 0.7); roof.position.y = 5.2; g.add(roof);
    const wheel = G(); wheel.position.set(0, 2, -3.2); g.add(wheel);
    const rim = mesh(new THREE.TorusGeometry(2.4, 0.18, 6, 20), 0x6a4a2a); wheel.add(rim);
    for (let i = 0; i < 8; i++) { const sp = box(0.5, 4.8, 0.2, 0x7a5a3a); sp.rotation.z = i * Math.PI / 8; wheel.add(sp); }
    wheel.rotation.y = Math.PI / 2;
    put(g, x, z, -0.2); col(x, z, 4);
    anim(dt => { wheel.rotation.x += dt * 0.8; });
  };
  a.dock = (x, z, rand, rot = 0) => {
    const g = G(), y = ctx.waterY + 0.3;
    const deck = box(2.4, 0.2, 7, 0x8a6a3a); deck.position.y = y; g.add(deck);
    for (const s of [-1, 1]) for (const k of [-3, 0, 3]) { const p = cyl(0.12, 0.12, 2.4, 0x5a3a20, 6); p.position.set(s * 1.1, y - 0.6, k); g.add(p); }
    const boat = G(); boat.position.set(2.6, ctx.waterY + 0.1, 1);
    const hull = cyl(0.9, 0.5, 3.6, 0x8a4a2a, 6, {}); hull.rotation.x = Math.PI / 2; hull.scale.set(1, 1, 0.5); boat.add(hull);
    g.add(boat); g.rotation.y = rot;
    g.position.set(x, 0, z); add(g);
    const ph = rand() * 6;
    anim((dt, t) => { boat.position.y = ctx.waterY + 0.1 + Math.sin(t * 1.4 + ph) * 0.08; boat.rotation.z = Math.sin(t + ph) * 0.05; });
  };
  a.reeds = (x, z) => {
    const g = G();
    for (let i = 0; i < 6; i++) { const r = cyl(0.03, 0.04, 1.6 + (i % 3) * 0.4, 0x6a8a3a, 4); r.position.set((i % 3 - 1) * 0.25, 0.8, (i > 2 ? 1 : -1) * 0.15); r.rotation.z = (i - 3) * 0.06; g.add(r); const top = cyl(0.07, 0.07, 0.35, 0x6a4a2a, 5); top.position.set(r.position.x, 1.75 + (i % 3) * 0.2, r.position.z); g.add(top); }
    put(g, x, z, -0.1);
  };
  a.tent = (x, z, color, rot) => {
    const g = G();
    const t = cyl(0, 2.4, 2.8, color, 4); t.position.y = 1.4; t.rotation.y = Math.PI / 4; g.add(t);
    const pole = cyl(0.05, 0.05, 3.4, 0x6a4a2a, 4); pole.position.y = 1.7; g.add(pole);
    const flap = box(0.9, 1.3, 0.05, 0x3a2a1a); flap.position.set(0, 0.65, 1.2); g.add(flap);
    g.rotation.y = rot; put(g, x, z); col(x, z, 1.9);
  };
  a.scaffold = p => {
    const g = G();
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const post = box(0.16, 8, 0.16, 0x8a6a3a); post.position.set(i * 2.2 - 2.2, 4, j * 2.2 - 1.1); g.add(post); }
    for (let k = 1; k < 4; k++) { const plank = box(5, 0.15, 2.6, 0x9a7a4a); plank.position.y = k * 2.2; g.add(plank); }
    const wall = box(6, 5, 1.2, 0xc8b898); wall.position.set(0, 2.5, -2.2); g.add(wall);
    g.rotation.y = p.a; put(g, p.x, p.z); col(p.x, p.z, 3.4);
  };
  a.crane = p => {
    const g = G();
    const mast = box(0.4, 10, 0.4, 0x6a4a2a); mast.position.y = 5; g.add(mast);
    const arm = G(); arm.position.y = 10; g.add(arm);
    const jib = box(8, 0.3, 0.3, 0x7a5a3a); jib.position.x = 2.5; arm.add(jib);
    const rope = box(0.04, 4, 0.04, 0x3a2a1a); rope.position.set(6, -2, 0); arm.add(rope);
    const load = box(1, 0.8, 1, 0xb8b0a0); load.position.set(6, -4.2, 0); arm.add(load);
    put(g, p.x, p.z); col(p.x, p.z, 0.6);
    anim((dt, t) => { arm.rotation.y = Math.sin(t * 0.25) * 1.2; });
  };
  a.blocks = (x, z, rand) => {
    const g = G();
    for (let i = 0; i < 5; i++) { const b = box(1.4, 0.8, 0.9, i % 2 ? 0xc8b898 : 0xb8a888); b.position.set((i % 3) * 1.45 - 1.45, 0.4 + Math.floor(i / 3) * 0.8, 0); g.add(b); }
    g.rotation.y = rand() * 6; put(g, x, z); col(x, z, 1.8);
  };
  a.hourglass = (x, z) => {
    const g = G();
    const base = cyl(4, 4.4, 1, 0xd8cfbc, 12); base.position.y = 0.5; g.add(base);
    const glass = new THREE.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.35, roughness: 0.1, metalness: 0.2 });
    const top = new THREE.Mesh(new THREE.ConeGeometry(2.4, 4, 16, 1, true), glass); top.rotation.x = Math.PI; top.position.y = 7; g.add(top);
    const bot = new THREE.Mesh(new THREE.ConeGeometry(2.4, 4, 16, 1, true), glass); bot.position.y = 3; g.add(bot);
    const sandT = mesh(new THREE.ConeGeometry(1.6, 1.6, 12), 0xe8c070); sandT.rotation.x = Math.PI; sandT.position.y = 6.4; g.add(sandT);
    const sandB = mesh(new THREE.ConeGeometry(2.1, 1.6, 12), 0xe8c070); sandB.position.y = 1.8; g.add(sandB);
    const stream = cyl(0.05, 0.05, 3.6, 0xe8c070, 4); stream.position.y = 3.6; g.add(stream);
    const capT = cyl(2.8, 2.8, 0.5, 0xb08a4a, 12); capT.position.y = 9.2; g.add(capT);
    for (let i = 0; i < 4; i++) { const r = cyl(0.18, 0.18, 8, 0xb08a4a, 6); const an = i * Math.PI / 2 + 0.785; r.position.set(Math.cos(an) * 2.7, 5.1, Math.sin(an) * 2.7); g.add(r); }
    put(g, x, z); col(x, z, 4.2);
    anim((dt, t) => { const k = (t * 0.05) % 1; sandT.scale.setScalar(Math.max(0.05, 1 - k)); sandB.scale.setScalar(0.3 + k * 0.7); g.rotation.y += dt * 0.05; });
  };
  a.fallen = (x, z, rand) => {
    const c = cyl(0.42, 0.45, 2 + rand() * 2.5, 0xe0d6c0, 10); c.rotation.set(0, rand() * 6, Math.PI / 2 + (rand() - 0.5) * 0.2); put(c, x, z, 0.35); col(x, z, 1);
  };
  a.sundial = p => {
    const g = G();
    const d = cyl(1.8, 2, 0.6, 0xd8cfbc, 16); d.position.y = 0.3; g.add(d);
    const gn = cyl(0, 0.9, 1.4, 0x8a6a3a, 3); gn.rotation.z = 0.6; gn.position.y = 1; g.add(gn);
    put(g, p.x, p.z); col(p.x, p.z, 2);
  };
  a.shrine = (x, z) => {
    const g = G();
    for (let i = 0; i < 6; i++) { const an = i / 6 * Math.PI * 2, c = cyl(0.25, 0.3, 3.2, 0xf0ece0, 8); c.position.set(Math.cos(an) * 2.2, 1.6, Math.sin(an) * 2.2); g.add(c); }
    const roof = mesh(new THREE.SphereGeometry(2.7, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0x4a9a9a, { metalness: 0.4, roughness: 0.4 }); roof.position.y = 3.2; g.add(roof);
    const orb = mesh(new THREE.IcosahedronGeometry(0.6, 1), 0xcff8ff, { emissive: 0x6fe0ff, emissiveIntensity: 1.4 }); orb.position.y = 1.8; g.add(orb);
    put(g, x, z);
    anim((dt, t) => { orb.position.y = 1.8 + Math.sin(t * 1.5) * 0.2; orb.rotation.y += dt; });
  };
  a.lanterns = (x, z, r) => {
    const ls = [];
    for (let i = 0; i < 10; i++) {
      const s = glyphSprite('✦', '#ffe9a8'); s.scale.set(1.2, 1.2, 1);
      const an = i / 10 * Math.PI * 2; s.position.set(x + Math.cos(an) * r * (0.6 + (i % 3) * 0.15), ctx.waterY + 0.6, z + Math.sin(an) * r * (0.6 + (i % 3) * 0.15));
      add(s); ls.push(s);
    }
    anim((dt, t) => ls.forEach((s, i) => { s.position.y = ctx.waterY + 0.6 + Math.sin(t * 1.2 + i) * 0.12; }));
  };
  a.cairn = (x, z) => {
    const g = G();
    for (let i = 0; i < 4; i++) { const s = mesh(new THREE.DodecahedronGeometry(0.6 - i * 0.12, 0), 0x9a9aa0); s.position.y = 0.4 + i * 0.75; s.rotation.y = i; g.add(s); }
    put(g, x, z); col(x, z, 0.6);
  };
  a.crystal = (x, z, rand) => {
    const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.8 + rand() * 0.8, 0), new THREE.MeshStandardMaterial({ color: 0xbfe8ff, emissive: 0x3a8ac0, emissiveIntensity: 0.5, transparent: true, opacity: 0.8, roughness: 0.1, flatShading: true }));
    c.scale.y = 1.8; c.rotation.set(rand() * 0.4, rand() * 6, rand() * 0.4); put(c, x, z, 0.8); col(x, z, 0.8);
  };
  a.flags = p => {
    const g = G();
    const pole = cyl(0.06, 0.06, 4, 0x6a4a2a, 5); pole.position.y = 2; g.add(pole);
    const cols = [0xc9452b, 0xe0a526, 0x2f5f8f, 0x3f7d5a, 0xf0f0f0];
    cols.forEach((c, i) => { const f = box(0.7, 0.45, 0.03, c); f.position.set(0.4 + i * 0.75, 3.5 - i * 0.35, 0); g.add(f); });
    put(g, p.x, p.z);
  };
  // the golden dome of the Library, far away on the horizon
  a.farDome = (x, z) => {
    const g = G();
    const m = (geo, c) => new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: c, fog: false }));
    const base = m(new THREE.BoxGeometry(30, 10, 20), 0xd8c8a0); base.position.y = 5; g.add(base);
    const dome = m(new THREE.SphereGeometry(10, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), 0xe0a526); dome.position.y = 10; g.add(dome);
    g.position.set(x, 4, z); add(g);
  };
  a.plaza = (x, z, w, l) => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const k = c.getContext('2d');
    k.fillStyle = '#d8ccb0'; k.fillRect(0, 0, 128, 128); k.strokeStyle = '#b8a888'; k.lineWidth = 3;
    for (let i = 0; i <= 128; i += 32) { k.beginPath(); k.moveTo(i, 0); k.lineTo(i, 128); k.stroke(); k.beginPath(); k.moveTo(0, i); k.lineTo(128, i); k.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 4, l / 4); t.colorSpace = THREE.SRGBColorSpace;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, l), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }));
    p.rotation.x = -Math.PI / 2; p.position.set(x, 0.05, z); p.receiveShadow = true; add(p);
  };
  a.column = (x, z) => {
    const g = G();
    const c = cyl(0.45, 0.55, 6, 0xf0ece0, 10); c.position.y = 3; g.add(c);
    const cap = box(1.3, 0.35, 1.3, 0xe0d6c0); cap.position.y = 6.15; g.add(cap);
    put(g, x, z); col(x, z, 0.6);
  };
  a.fountain = (x, z) => {
    const g = G();
    const basin = cyl(2.6, 2.8, 0.8, 0xe0d6c0, 16); basin.position.y = 0.4; g.add(basin);
    const w = new THREE.Mesh(new THREE.CircleGeometry(2.4, 20), waterMat); w.rotation.x = -Math.PI / 2; w.position.y = 0.75; g.add(w);
    const p = cyl(0.3, 0.4, 2, 0xe0d6c0, 8); p.position.y = 1.4; g.add(p);
    const bowl = cyl(1, 0.4, 0.4, 0xe0d6c0, 12); bowl.position.y = 2.4; g.add(bowl);
    const jet = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.4, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xcfefff, transparent: true, opacity: 0.55 })); jet.position.y = 3.2; g.add(jet);
    put(g, x, z); col(x, z, 2.8);
    anim((dt, t) => { jet.scale.y = 1 + Math.sin(t * 6) * 0.1; });
  };
  a.statue = (x, z) => {
    const g = G();
    const ped = box(1.6, 1.6, 1.6, 0xe0d6c0); ped.position.y = 0.8; g.add(ped);
    const body = cyl(0.35, 0.6, 2, 0xf0ece0, 10); body.position.y = 2.6; g.add(body);
    const head = mesh(new THREE.SphereGeometry(0.32, 10, 8), 0xf0ece0); head.position.y = 3.85; g.add(head);
    const book = box(0.7, 0.5, 0.15, 0xf0ece0); book.position.set(0, 2.9, 0.5); book.rotation.x = -0.5; g.add(book);
    put(g, x, z); col(x, z, 1.1);
  };
  a.library = (x, z) => {
    const g = a.temple(x, z, 2.4, 0, false);
    const dome = mesh(new THREE.SphereGeometry(3.2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), 0xe0a526, { metalness: 0.6, roughness: 0.35 });
    dome.position.y = 7.4; g.add(dome);
    const door = mesh(new THREE.PlaneGeometry(2.2, 3.4), 0x6a3a1a, { emissive: 0x000000 }); door.position.set(0, 2.5, 2.62); g.add(door);
    ctx.libraryDoor = door;
    return g;
  };
  return a;
}
