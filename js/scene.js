import * as THREE from './three.module.min.js';

const MODULES = [
  { id: 'learn', color: 0x4cc9f0, r: 3.1, tilt: 0.25, speed: 0.30, phase: 0.0, icon: '📘' },
  { id: 'think', color: 0xffd166, r: 3.7, tilt: -0.35, speed: 0.24, phase: 1.3, icon: '🧠' },
  { id: 'create', color: 0xf72585, r: 4.3, tilt: 0.12, speed: 0.20, phase: 2.6, icon: '🛠️' },
  { id: 'language', color: 0x06d6a0, r: 4.9, tilt: -0.18, speed: 0.17, phase: 3.9, icon: '🌍' },
  { id: 'career', color: 0xff9f1c, r: 5.5, tilt: 0.30, speed: 0.14, phase: 5.1, icon: '💼' },
  { id: 'world', color: 0x4895ef, r: 6.1, tilt: -0.28, speed: 0.12, phase: 0.7, icon: '🌐' },
  { id: 'grow', color: 0x9b5de5, r: 6.7, tilt: 0.18, speed: 0.10, phase: 4.4, icon: '🌟' },
];

function labelTexture(text, color) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 160;
  const g = c.getContext('2d');
  g.font = '700 64px system-ui, "Segoe UI", Tahoma, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const w = Math.min(480, g.measureText(text).width + 60);
  g.fillStyle = 'rgba(8,10,30,0.72)'; g.strokeStyle = color; g.lineWidth = 4;
  const x = 256 - w / 2, y = 30, h = 100, r = 50;
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  g.fill(); g.stroke();
  g.fillStyle = '#fff'; g.fillText(text, 256, 82, 440);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}

export function createScene(canvas, onPick) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070a1f, 0.02);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
  camera.position.set(0, 1.2, 11);

  scene.add(new THREE.AmbientLight(0x8899ff, 0.7));
  const key = new THREE.PointLight(0xffffff, 60, 40); key.position.set(4, 6, 8); scene.add(key);
  const rim = new THREE.PointLight(0x9b5de5, 40, 40); rim.position.set(-6, -3, -4); scene.add(rim);

  // stars
  const N = 900; const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = 30 + Math.random() * 60, a = Math.random() * 6.283, b = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(b) * Math.cos(a); pos[i * 3 + 1] = r * Math.cos(b); pos[i * 3 + 2] = r * Math.sin(b) * Math.sin(a);
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xbfd0ff, size: 0.18, sizeAttenuation: true, transparent: true, opacity: 0.85 }));
  scene.add(stars);

  // ---- HOME group: core + orbiting modules
  const home = new THREE.Group(); scene.add(home);
  const core = new THREE.Group(); home.add(core);
  const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 3), new THREE.MeshStandardMaterial({ color: 0x2b1a6b, emissive: 0x6a3df0, emissiveIntensity: 1.1, roughness: 0.25, metalness: 0.6, flatShading: true }));
  const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.55, 1), new THREE.MeshBasicMaterial({ color: 0x7ee0ff, wireframe: true, transparent: true, opacity: 0.45 }));
  const halo = new THREE.Mesh(new THREE.SphereGeometry(2.0, 32, 32), new THREE.MeshBasicMaterial({ color: 0x6a3df0, transparent: true, opacity: 0.10, side: THREE.BackSide }));
  core.add(inner, wire, halo);
  inner.userData.id = 'coach';

  const nodes = [];
  const pickables = [inner];
  MODULES.forEach((m) => {
    const pivot = new THREE.Group(); pivot.rotation.x = m.tilt; home.add(pivot);
    const ring = new THREE.Mesh(new THREE.RingGeometry(m.r - 0.012, m.r + 0.012, 128), new THREE.MeshBasicMaterial({ color: m.color, transparent: true, opacity: 0.22, side: THREE.DoubleSide }));
    ring.rotation.x = Math.PI / 2; pivot.add(ring);
    const orb = new THREE.Group(); pivot.add(orb);
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), new THREE.MeshStandardMaterial({ color: m.color, emissive: m.color, emissiveIntensity: 0.55, roughness: 0.3, metalness: 0.3 }));
    sphere.userData.id = m.id; orb.add(sphere); pickables.push(sphere);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.75, 24, 24), new THREE.MeshBasicMaterial({ color: m.color, transparent: true, opacity: 0.16, side: THREE.BackSide })); orb.add(glow);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false })); sprite.scale.set(2.1, 0.66, 1); sprite.position.y = 0.95; sprite.userData.id = m.id; orb.add(sprite); pickables.push(sprite);
    nodes.push({ m, pivot, orb, sphere, sprite, ang: m.phase });
  });

  // ---- GROW group: constellation of skills
  const grow = new THREE.Group(); grow.visible = false; scene.add(grow);
  let growNodes = []; let growLines = null;
  function buildGrow(items) {
    while (grow.children.length) { const c = grow.children.pop(); c.geometry && c.geometry.dispose(); }
    growNodes = []; const pts = [];
    items.forEach((it, i) => {
      const a = (i / items.length) * Math.PI * 2 - Math.PI / 2; const r = 3.4;
      const p = new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * 0.55 + (i % 2 ? 0.5 : -0.3), Math.sin(a * 2) * 1.2);
      const col = new THREE.Color(it.color); const size = 0.35 + it.p * 0.6;
      const s = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 2), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.4 + it.p * 1.0, roughness: 0.35, metalness: 0.4, flatShading: true, transparent: true, opacity: 0.6 + it.p * 0.4 }));
      s.position.copy(p); grow.add(s); growNodes.push(s); pts.push(p);
      const lab = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture(it.label, it.color), transparent: true, depthWrite: false }));
      lab.scale.set(2.2, 0.69, 1); lab.position.copy(p).add(new THREE.Vector3(0, size + 0.6, 0)); grow.add(lab);
    });
    const lp = []; pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; lp.push(p.x, p.y, p.z, q.x, q.y, q.z); if (i + 2 < pts.length) { const q2 = pts[(i + 2) % pts.length]; lp.push(p.x, p.y, p.z, q2.x, q2.y, q2.z); } });
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    growLines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x7ee0ff, transparent: true, opacity: 0.35 })); grow.add(growLines);
  }

  // ---- labels (language dependent)
  function setLabels(map) {
    nodes.forEach((n) => {
      const old = n.sprite.material.map; if (old) old.dispose();
      n.sprite.material.map = labelTexture(n.m.icon + ' ' + (map[n.m.id] || n.m.id), '#' + n.m.color.toString(16).padStart(6, '0'));
      n.sprite.material.needsUpdate = true;
    });
  }

  // ---- state
  let mode = 'home';
  const mouse = { x: 0, y: 0 }; let running = true; let pulseT = 0; let last = performance.now(); let reduce = false;
  function layout() { // where the 3D content sits: upper part of the screen, above the UI cards
    const portrait = camera.aspect < 0.8; const fit = Math.min(1, camera.aspect * 1.4) * 0.88;
    if (mode === 'home') return { z: 12, cy: 1.8, py: portrait ? 3.3 : 2.5, s: fit };
    if (mode === 'grow') return { z: 11, cy: 1.2, py: portrait ? 3.1 : 2.3, s: fit * 0.95 };
    return { z: 14, cy: 2.5, py: portrait ? 3.4 : 2.6, s: fit * 0.8 };
  }
  function setMode(m) { mode = m; home.visible = m === 'home' || m === 'ambient'; grow.visible = m === 'grow'; }
  function resize() {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.fov = w < h ? 70 : 55; // portrait phones need a wider field
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize); resize();

  // pointer parallax + picking
  let down = null;
  window.addEventListener('pointermove', (e) => { mouse.x = (e.clientX / window.innerWidth - 0.5) * 2; mouse.y = (e.clientY / window.innerHeight - 0.5) * 2; });
  const ray = new THREE.Raycaster(); const v2 = new THREE.Vector2();
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', (e) => {
    if (!down || mode !== 'home') return;
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return;
    const r = canvas.getBoundingClientRect(); v2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(v2, camera); const hit = ray.intersectObjects(pickables, false)[0];
    if (hit && onPick) onPick(hit.object.userData.id);
  });

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now; const t = now / 1000;
    const k = reduce ? 0.2 : 1;
    stars.rotation.y += dt * 0.01 * k;
    const L = layout();
    camera.position.x += (mouse.x * 1.2 - camera.position.x) * 0.04;
    camera.position.y += (L.cy - mouse.y * 0.8 - camera.position.y) * 0.04;
    camera.position.z += (L.z - camera.position.z) * 0.05;
    camera.lookAt(0, 0, 0);
    pulseT = Math.max(0, pulseT - dt);
    if (home.visible) {
      const sc = L.s * (1 + pulseT * 0.4); home.scale.lerp(new THREE.Vector3(sc, sc, sc), 0.08); home.position.y += (L.py - home.position.y) * 0.06;
      inner.rotation.y += dt * 0.4 * k; inner.rotation.x += dt * 0.15 * k; wire.rotation.y -= dt * 0.2 * k; wire.rotation.z += dt * 0.1 * k;
      inner.material.emissiveIntensity = 1.0 + Math.sin(t * 2) * 0.25 + pulseT * 2;
      halo.scale.setScalar(1 + Math.sin(t * 1.5) * 0.05);
      nodes.forEach((n) => { n.ang += dt * n.m.speed * k; n.orb.position.set(Math.cos(n.ang) * n.m.r, 0, Math.sin(n.ang) * n.m.r); n.sphere.rotation.y += dt; const s = 1 + Math.sin(t * 2 + n.m.phase) * 0.06; n.sphere.scale.setScalar(s); });
    }
    if (grow.visible) { grow.scale.setScalar(L.s); grow.position.y += (L.py - grow.position.y) * 0.06; grow.rotation.y = Math.sin(t * 0.15) * 0.35; growNodes.forEach((g, i) => { g.rotation.y += dt * 0.5; g.rotation.x += dt * 0.2; g.position.y += Math.sin(t + i) * 0.0015; }); }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => { if (document.hidden) running = false; else if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } });

  return {
    setMode, setLabels, buildGrow, pulse: () => { pulseT = 0.6; },
    setRunning(v) { if (v && !running) { running = true; last = performance.now(); requestAnimationFrame(frame); } else if (!v) running = false; },
    setReduce(v) { reduce = v; },
    resize,
  };
}
