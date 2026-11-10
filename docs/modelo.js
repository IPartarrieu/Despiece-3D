// Modelo procedural del esmeril angular. Unidades: cm. Eje del motor = X (el cabezal en x=0, el motor hacia -X),
// eje del husillo = Y (el disco abajo). Se construye en medidas de un esmeril de 115 mm y se escala con k.
import * as THREE from 'three';

const PI = Math.PI, YM = 2.3; // YM: altura del eje del motor
const V = (x, y, z) => new THREE.Vector3(x, y, z);

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.55, side: THREE.DoubleSide, ...o });
const acero = (c = '#aab0b8') => mat(c, { metalness: 0.55, roughness: 0.4 });
const cobre = () => mat('#c07a3e', { metalness: 0.9, roughness: 0.3 });
const goma = () => mat('#1f2124', { metalness: 0, roughness: 0.9 });
const marfil = () => mat('#e6e2d3', { metalness: 0, roughness: 0.6 });
const mesh = (g, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); return o; };
// cilindro con eje x|y|z; la "tapa" (rT) apunta hacia +eje
function cil(ax, rT, rB, h, x, y, z, m, seg = 40, abierto = false, ts = 0, tl = PI * 2) {
  const o = mesh(new THREE.CylinderGeometry(rT, rB, h, seg, 1, abierto, ts, tl), m, x, y, z);
  if (ax === 'x') o.rotation.z = -PI / 2; else if (ax === 'z') o.rotation.x = PI / 2;
  return o;
}
const caja = (w, h, d, x, y, z, m) => mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z);

// textura de láminas (chapas del núcleo) a lo largo del eje de un cilindro
function laminas() {
  const c = document.createElement('canvas'); c.width = 4; c.height = 16;
  const g = c.getContext('2d'); g.fillStyle = '#a9aeb5'; g.fillRect(0, 0, 4, 16); g.fillStyle = '#4d535a'; g.fillRect(0, 0, 4, 3);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 14); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function rodamiento(eje, ro, ri, w, x, y, z) {
  const g = new THREE.Group();
  const anillo = (a, b, color) => {
    const s = new THREE.Shape().absarc(0, 0, a, 0, PI * 2, false);
    s.holes.push(new THREE.Path().absarc(0, 0, b, 0, PI * 2, true));
    const geo = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false, curveSegments: 32 }); geo.translate(0, 0, -w / 2);
    return mesh(geo, acero(color));
  };
  g.add(anillo(ro, ro - 0.2, '#b9bec4'), anillo(ri + 0.2, ri, '#b9bec4'));
  const rm = (ro + ri) / 2, rb = (ro - ri - 0.4) / 2;
  for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2; g.add(mesh(new THREE.SphereGeometry(rb, 12, 8), mat('#e8eaec', { metalness: 1, roughness: 0.2 }), rm * Math.cos(a), rm * Math.sin(a), 0)); }
  if (eje === 'x') g.rotation.y = PI / 2; else g.rotation.x = -PI / 2;
  g.position.set(x, y, z);
  return g;
}

export function construir(cfg) {
  const k = 1 + 0.4 * (cfg.disco - 115) / 115;   // escala del cuerpo según el diámetro
  const Rb = cfg.disco / 20 / k;                  // radio del disco en medidas base
  const color = cfg.color;
  const parts = {};
  // items: [[objetos, dirección de desmontaje], ...] (varios items = la pieza se separa en trozos)
  const add = (id, nombre, grupo, items, shell = false) => {
    const its = items.map(([objs, dir]) => {
      const g = new THREE.Group(); [].concat(objs).forEach(o => g.add(o)); g.scale.setScalar(k);
      return { obj: g, dir: dir.clone().multiplyScalar(k) };
    });
    const mats = [];
    its.forEach(i => i.obj.traverse(o => { if (o.material) { o.userData.pid = id; mats.push(o.material); } }));
    parts[id] = { id, nombre, grupo, items: its, mats, shell };
  };
  const G1 = 'Cabezal y disco', G2 = 'Motor', G3 = 'Alimentación';

  // ---- cabezal y disco ----
  add('disco', 'Disco abrasivo', G1, [[[
    cil('y', Rb, Rb, 0.3, 0, -2.05, 0, mat('#33454d', { metalness: 0, roughness: 0.9 }), 64),
    (() => { const r = mesh(new THREE.RingGeometry(Rb * 0.6, Rb * 0.9, 64), mat('#b9b49f', { metalness: 0, roughness: 0.8 }), 0, -1.89, 0); r.rotation.x = -PI / 2; return r; })(),
  ], V(0, -8.3, 0)]]);
  add('tuerca', 'Brida exterior o tuerca', G1, [[[
    cil('y', 1.45, 1.45, 0.55, 0, -2.475, 0, acero(), 6),
    cil('y', 0.22, 0.22, 0.06, 0.85, -2.76, 0, mat('#111'), 16), cil('y', 0.22, 0.22, 0.06, -0.85, -2.76, 0, mat('#111'), 16),
  ], V(0, -14, 0)]]);
  add('brida_int', 'Brida interior', G1, [[[
    cil('y', 1.65, 1.65, 0.25, 0, -1.725, 0, acero(), 48), cil('y', 0.8, 0.8, 0.35, 0, -2.025, 0, acero(), 32),
  ], V(0, -5.2, 0)]]);
  add('protector', 'Protector', G1, [[[
    cil('y', Rb + 0.9, Rb + 0.9, 1.2, 0, -1.8, 0, acero('#7c828a'), 64, true, PI, PI),
    cil('y', Rb + 0.9, Rb + 0.9, 0.15, 0, -1.3, 0, acero('#7c828a'), 64, false, PI, PI),
    cil('y', 1.9, 1.9, 0.5, 0, -1.45, 0, acero('#6b7178'), 32),
  ], V(0, -2.2, 0)]], true);
  add('husillo', 'Husillo', G1, [[(() => {
    const o = [cil('y', 0.42, 0.42, 6.8, 0, 0.6, 0, acero('#c4c8cd')), cil('y', 0.85, 0.85, 0.3, 0, 0.9, 0, acero('#c4c8cd'))];
    for (let i = 0; i < 7; i++) { const t = mesh(new THREE.TorusGeometry(0.42, 0.035, 6, 24), acero('#aeb3b9'), 0, -2.7 + i * 0.15, 0); t.rotation.x = PI / 2; o.push(t); }
    return o;
  })(), V(0, -2.5, 0)]]);
  add('corona', 'Corona', G1, [[[cil('y', 1.9, 1.3, 0.7, 0, 1.4, 0, mat('#6a6f76', { metalness: 0.8, roughness: 0.4, flatShading: true }), 28)], V(0, 5.5, 0)]]);
  const cab = acero('#b4bac1');
  add('cabezal', 'Cabezal', G1, [[(() => {
    const o = [cil('y', 2.8, 3.0, 5.7, 0, 1.75, 0, cab, 56), cil('x', 2.6, 2.6, 4.2, -2.1, YM, 0, acero('#b4bac1'), 56), cil('x', 2.8, 2.8, 0.3, -4.25, YM, 0, acero('#7a8087'), 56)];
    for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4; o.push(cil('x', 0.25, 0.25, 0.15, -4.05, YM + 2.4 * Math.cos(a), 2.4 * Math.sin(a), acero('#40454b'), 6)); }
    return o;
  })(), V(0, 0, 0)]], true);
  add('rodamientos', 'Rodamientos', G1, [
    [[rodamiento('x', 0.95, 0.42, 0.55, -13.4, YM, 0)], V(-9.5, -9, 0)],
    [[rodamiento('x', 1.1, 0.42, 0.5, -4.0, YM, 0)], V(0, -9, 0)],
    [[rodamiento('y', 1.0, 0.45, 0.5, 0, 3.0, 0)], V(0, 11, 0)],
    [[rodamiento('y', 1.1, 0.45, 0.5, 0, 0.5, 0)], V(0, 8.6, 0)],
  ]);
  add('boton', 'Botón de bloqueo', G1, [[[cil('y', 0.45, 0.45, 0.6, 0, 4.9, 0, mat('#d63a2f', { metalness: 0.1, roughness: 0.5 }), 24), cil('y', 0.7, 0.7, 0.2, 0, 4.7, 0, acero('#40454b'), 24)], V(0, 14, 0)]]);
  add('mango', 'Empuñadura lateral', G1, [[[
    cil('z', 0.8, 0.8, 10.6, 0, 0.95, 8.5, goma(), 24), cil('z', 0.4, 0.4, 1.0, 0, 0.95, 2.7, acero(), 16), cil('z', 1.0, 1.0, 0.35, 0, 0.95, 3.35, acero('#40454b'), 24),
  ], V(0, 0, 10)]]);

  // ---- motor ----
  const cuerpo = mat(color, { metalness: 0.1, roughness: 0.55 });
  const perfil = [[0.1, -15.7], [1.3, -15.55], [2.1, -15.1], [2.55, -14.4], [2.8, -13.2], [2.9, -11], [2.95, -8], [2.9, -6], [2.85, -4.6], [2.85, -4.0]];
  const pts = [...perfil, ...perfil.slice().reverse().map(([r, y]) => [Math.max(r - 0.22, 0.05), y])].map(([r, y]) => new THREE.Vector2(r, y));
  const mitad = (s) => { const g = new THREE.LatheGeometry(pts, 48, s > 0 ? -PI / 2 : PI / 2, PI); g.rotateZ(-PI / 2); g.translate(0, YM, 0); return mesh(g, s > 0 ? cuerpo : mat(color, { metalness: 0.1, roughness: 0.55 })); };
  add('carcasa', 'Carcasa del motor', G2, [[[mitad(1)], V(0, 0, 7)], [[mitad(-1)], V(0, 0, -7)]], true);

  const lam = laminas();
  add('estator', 'Estator', G2, [[[
    cil('x', 2.4, 2.4, 4, -9.3, YM, 0, mat('#fff', { map: lam, metalness: 0.7, roughness: 0.45 }), 48, true),
    cil('x', 1.5, 1.5, 4, -9.3, YM, 0, mat('#8a9097', { metalness: 0.7, roughness: 0.5 }), 48, true),
    caja(5.0, 1.2, 0.5, -9.3, YM, 1.95, cobre()), caja(5.0, 1.2, 0.5, -9.3, YM, -1.95, cobre()),
  ], V(0, 6.5, 0)]]);
  add('inducido', 'Inducido', G2, [[[
    cil('x', 0.4, 0.4, 10.6, -8.5, YM, 0, acero('#c4c8cd')),
    cil('x', 1.35, 1.35, 3.2, -9.3, YM, 0, mat('#fff', { map: lam, metalness: 0.7, roughness: 0.45 }), 32),
    cil('x', 1.45, 1.45, 0.5, -11.15, YM, 0, cobre(), 32), cil('x', 1.45, 1.45, 0.5, -7.45, YM, 0, cobre(), 32),
  ], V(-4, -9, 0)]]);
  add('ventilador', 'Ventilador', G2, [[(() => {
    const o = [cil('x', 1.7, 1.7, 0.08, -6.5, YM, 0, marfil(), 40), cil('x', 0.5, 0.5, 0.6, -6.6, YM, 0, marfil(), 20)];
    for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; const b = caja(0.5, 0.9, 0.06, -6.25, YM + 1.25 * Math.cos(a), 1.25 * Math.sin(a), marfil()); b.rotation.x = a; o.push(b); }
    return o;
  })(), V(0.8, -9, 0)]]);
  add('pinon', 'Piñón', G2, [[[
    cil('x', 0.5, 0.9, 1.7, -2.4, YM, 0, mat('#6a6f76', { metalness: 0.8, roughness: 0.4, flatShading: true }), 14), cil('x', 0.55, 0.55, 0.65, -3.575, YM, 0, acero(), 20),
  ], V(0, 6.5, 0)]]);
  if (!cfg.bateria) {
    add('colector', 'Colector', G2, [[(() => {
      const o = [cil('x', 0.85, 0.85, 1.0, -12.1, YM, 0, cobre(), 32)];
      for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; const b = caja(1.02, 0.06, 0.2, -12.1, YM + 0.86 * Math.cos(a), 0.86 * Math.sin(a), mat('#1b1b1b')); b.rotation.x = a; o.push(b); }
      return o;
    })(), V(-7, -9, 0)]]);
    const lado = (s) => [[
      cil('z', 0.62, 0.62, 1.3, -12.1, YM, s * 1.65, mat('#b8a05a', { metalness: 0.8, roughness: 0.4 }), 20, true),
      caja(0.7, 0.7, 1.0, -12.1, YM, s * 1.55, mat('#2a2a2a', { metalness: 0.1, roughness: 0.8 })),
      ...[0, 1, 2, 3, 4].map(i => mesh(new THREE.TorusGeometry(0.3, 0.04, 6, 16), acero('#c4c8cd'), -12.1, YM, s * (1.95 + 0.17 * i))),
      cil('z', 0.6, 0.6, 0.6, -12.1, YM, s * 2.95, mat('#222', { metalness: 0, roughness: 0.6 }), 20),
    ], V(0, 0, s * 11)];
    add('escobillas', 'Escobillas y portaescobillas', G2, [lado(1), lado(-1)]);
  }

  // ---- alimentación ----
  const gat = !!cfg.gatillo;
  add('interruptor', 'Interruptor', G3, [[[
    caja(2.0, 0.8, 1.8, -5.6, YM - 2.45, 0, mat('#cfd0d2', { metalness: 0, roughness: 0.6 })),
    caja(0.15, 0.4, 0.3, -4.7, YM - 1.9, 0.5, cobre()), caja(0.15, 0.4, 0.3, -4.7, YM - 1.9, -0.5, cobre()),
    gat ? (() => { const l = caja(1.8, 0.6, 0.9, -6.0, YM - 2.95, 0, mat('#22252a')); l.rotation.z = 0.25; return l; })()
        : caja(3.0, 0.35, 1.1, -5.8, YM - 2.95, 0, mat('#22252a')),
    ...(gat ? [caja(0.6, 0.3, 0.5, -5.0, YM + 2.9, 0, mat('#d63a2f'))] : []),
  ], V(0, -12, 0)]]);
  if (cfg.bateria) {
    add('bateria', 'Batería', G3, [[[
      caja(6.2, 5.6, 5.4, -18.3, YM, 0, mat('#2b2e33', { metalness: 0.1, roughness: 0.6 })),
      caja(6.25, 1.2, 5.45, -18.3, YM + 1.6, 0, mat(color, { metalness: 0.1, roughness: 0.5 })),
    ], V(-9, 0, 0)]]);
  } else {
    const curva = new THREE.CatmullRomCurve3([V(-16.4, YM, 0), V(-19, YM - 0.4, 0.2), V(-22, YM - 2.6, 1.6), V(-26, YM - 7, 0.5)]);
    add('cable', 'Cable', G3, [[[
      mesh(new THREE.TubeGeometry(curva, 40, 0.45, 12), goma()), cil('x', 1.0, 0.5, 1.6, -15.8, YM, 0, goma(), 24),
    ], V(-9, 0, 0)]]);
  }
  return { k, parts };
}
