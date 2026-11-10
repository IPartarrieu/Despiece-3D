// Modelo procedural del demoledor eléctrico liviano (tipo Makita HM0810 / Kothman HK17). Unidades: cm.
// Eje del cincel y del cañón = X (el cincel hacia +X, y=0, z=0). Motor vertical bajo el cárter (eje en x=-5.2),
// eje intermedio vertical en x=-1.2, mango en D atrás (-X). Se construye en medidas de 5-6 kg y se escala con k.
import * as THREE from 'three';
import { PI, V, mat, acero, aluminio, cobre, goma, negro, marfil, mesh, cil, caja, rev, tornillo, laminas, alambre, textoEtiqueta, rodamiento } from '../lib.js';

const XM = -5.2, XG = -1.2; // ejes del motor y del eje intermedio

function rr(x0, y0, x1, y1, r) { // rectángulo redondeado como Shape
  const s = new THREE.Shape();
  s.moveTo(x0 + r, y0); s.lineTo(x1 - r, y0); s.quadraticCurveTo(x1, y0, x1, y0 + r); s.lineTo(x1, y1 - r); s.quadraticCurveTo(x1, y1, x1 - r, y1);
  s.lineTo(x0 + r, y1); s.quadraticCurveTo(x0, y1, x0, y1 - r); s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0);
  return s;
}
function engranaje(n, r, h, y0, x, z, m) { // engranaje recto con eje Y
  const s = new THREE.Shape(), p = PI * 2 / n, pt = (a, rad) => [rad * Math.cos(a), rad * Math.sin(a)];
  for (let i = 0; i < n; i++) {
    const a = i * p;
    for (const [da, rad] of [[0, r - 0.3], [0.2, r], [0.5, r], [0.7, r - 0.3]]) { const [px, py] = pt(a + da * p, rad); (i === 0 && da === 0) ? s.moveTo(px, py) : s.lineTo(px, py); }
  }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false }); g.rotateX(-PI / 2); g.translate(0, y0, 0);
  return mesh(g, m, x, 0, z);
}
const estriasY = (r, largo, y0) => { // agarre estriado con eje Y, base en y0
  const o = [[0.01, 0]]; for (let i = 0; i <= Math.floor(largo / 0.3); i++) o.push([r + (i % 2 ? 0.05 : 0), 0.15 + i * 0.3]);
  o.push([r - 0.1, largo + 0.3], [r * 0.6, largo + 0.55], [0.01, largo + 0.65]);
  return o.map(([a, b]) => [a, b + y0]);
};

export function construir(cfg) {
  const k = cfg.clase === 'sds' ? 1.3 : 1;
  const color = cfg.color;
  const parts = {};
  const add = (id, nombre, grupo, items, shell = false) => {
    const its = items.map(([objs, dir]) => {
      const g = new THREE.Group(); [].concat(objs).forEach(o => g.add(o)); g.scale.setScalar(k);
      return { obj: g, dir: dir.clone().multiplyScalar(k) };
    });
    const mats = [];
    its.forEach(i => i.obj.traverse(o => { if (o.material) { o.userData.pid = id; mats.push(o.material); } }));
    parts[id] = { id, nombre, grupo, items: its, mats, shell };
  };
  const G1 = 'Percusión', G2 = 'Transmisión', G3 = 'Motor', G4 = 'Carcasas y mangos';
  const cuerpo = () => mat(color, { metalness: 0.08, roughness: 0.5 });
  const plastico = () => goma('#2b2e33');
  const gris = () => mat('#7d838b', { metalness: 0.75, roughness: 0.4 });
  const cromo = () => acero('#cfd3d8', { metalness: 0.8, roughness: 0.28 });

  // ---------- percusión (eje X) ----------
  add('cincel', 'Cincel o puntero', G1, [[(() => {
    const o = [];
    if (cfg.clase === 'sds') o.push(cil('x', 0.9, 0.9, 27.5, 35.25, 0, 0, cromo(), 28)); else o.push(cil('x', 0.98, 0.98, 27.5, 35.25, 0, 0, cromo(), 6));
    o.push(cil('x', 0.12, 0.98, 8, 53, 0, 0, acero('#9ea4ab'), 6), cil('x', 1.1, 1.1, 0.35, 28.5, 0, 0, acero('#7d838b'), 6)); // cono de la punta y resalto
    o.push(mesh(new THREE.TorusGeometry(1.0, 0.05, 6, 20), mat('#2a2d31'), 22.6, 0, 0).rotateY(PI / 2)); // ranura de retención
    return o;
  })(), V(30, 0, 0)]]);
  add('portaherramienta', 'Portaherramienta y retenedor', G1, [[[
    rev([[2.55, 22], [2.55, 26], [2.35, 26.2], [2.35, 30]], 'x', acero('#6f757c', { metalness: 0.6 }), 40),
    rev([[1.05, 22], [1.05, 30]], 'x', acero('#4a4f56'), 6, 0, 0, 0),
    cil('x', 3.0, 3.0, 1.4, 26.6, 0, 0, acero('#8b9198'), 40, true),
    caja(1.4, 0.7, 1.4, 26.6, 3.2, 0, acero('#40454b')), cil('y', 0.35, 0.35, 0.5, 26.6, 3.7, 0, acero('#c4c8cd'), 12),
  ], V(16, 0, 0)]]);
  add('intermedio', 'Percutor intermedio', G1, [[[
    cil('x', 0.98, 0.98, 8.5, 19.75, 0, 0, cromo(), 6), cil('x', 1.5, 1.5, 0.6, 16, 0, 0, cromo(), 32), cil('x', 1.15, 1.15, 0.5, 23.5, 0, 0, cromo(), 6),
  ], V(9, 0, 0)]]);
  add('martillo', 'Martillo', G1, [[[
    cil('x', 1.55, 1.55, 5, 13, 0, 0, cromo(), 32),
    ...[11.0, 15.0].map(x => mesh(new THREE.TorusGeometry(1.55, 0.06, 6, 28), acero('#7d838b'), x, 0, 0).rotateY(PI / 2)),
  ], V(4, 9, 0)]]);
  add('piston', 'Pistón', G1, [[[
    rev([[0.01, 4], [1.8, 4], [1.8, 10.5], [1.6, 10.5], [1.6, 6], [0.01, 6]], 'x', acero('#b9bec5'), 40),
    ...[9.4, 8.7].map(x => mesh(new THREE.TorusGeometry(1.8, 0.07, 6, 28), negro(), x, 0, 0).rotateY(PI / 2)),
    cil('y', 0.45, 0.45, 3.2, 5.0, 0, 0, cromo(), 16),
  ], V(0, 9, 0)]]);
  add('cilindro', 'Cilindro o cañón guía', G1, [-1, 1].map(s => [(() => {
    const ph = s > 0 ? -PI / 2 : PI / 2, o = [
      rev([[2.7, 5], [2.7, 20], [3.2, 20.1], [3.2, 22], [2.95, 22], [2.45, 22], [2.45, 5], [2.7, 5]], 'x', plastico(), 48, 0, 0, 0, ph, PI),
      rev([[2.78, 8], [2.78, 8.4], [2.78, 12], [2.78, 12.4]], 'x', goma('#1c1e21'), 40, 0, 0, 0, ph, PI),
    ];
    for (let i = 0; i < 4; i++) o.push(caja(0.18, 1.5, 0.05, 9 + i * 0.8, 0, s * 2.74, negro())); // ranuras de ventilación
    return o;
  })(), V(0, 0, s * 7)]), true);
  add('amortiguacion', 'Amortiguación y sellos', G1, [
    [[rev([[2.9, 4.6], [3.1, 4.9], [3.1, 6.3], [2.8, 6.6]], 'x', goma('#1c1e21'), 40), ...[6.8, 7.3].map(x => mesh(new THREE.TorusGeometry(2.75, 0.1, 8, 36), goma('#d9a521'), x, 0, 0).rotateY(PI / 2))], V(6, 6, 0)],
    [[rev([[2.2, 29.6], [1.9, 30.6], [1.4, 31.6]], 'x', goma('#1c1e21'), 32)], V(22, 7, 0)],
  ]);

  // ---------- transmisión ----------
  add('biela', 'Biela y excéntrico', G2, [[(() => {
    const s = new THREE.Shape(); s.absarc(-0.3, 0, 1.3, 0, PI * 2, false); s.holes.push(new THREE.Path().absarc(-0.3, 0, 0.6, 0, PI * 2, true));
    const brazo = new THREE.Shape(); brazo.moveTo(-0.3, 0.55); brazo.lineTo(5, 0.4); brazo.lineTo(5, -0.4); brazo.lineTo(-0.3, -0.55);
    const g1 = new THREE.ExtrudeGeometry(s, { depth: 0.8, bevelEnabled: false, curveSegments: 28 }), g2 = new THREE.ExtrudeGeometry(brazo, { depth: 0.8, bevelEnabled: false });
    const peq = new THREE.Shape(); peq.absarc(5, 0, 0.9, 0, PI * 2, false); peq.holes.push(new THREE.Path().absarc(5, 0, 0.45, 0, PI * 2, true));
    const g3 = new THREE.ExtrudeGeometry(peq, { depth: 0.8, bevelEnabled: false, curveSegments: 24 });
    return [g1, g2, g3].map(g => { g.rotateX(PI / 2); g.translate(0, 0.4, 0); return mesh(g, acero('#9aa0a8', { metalness: 0.7 })); })
      .concat([cil('y', 0.55, 0.55, 2.2, XG + 0.9, 0.2, 0, cromo(), 20), cil('y', 1.4, 1.4, 0.25, XG, 1.3, 0, acero('#6f757c'), 32)]);
  })(), V(0, 9, 0)]]);
  const diente = () => mat('#8b9198', { metalness: 0.8, roughness: 0.35 });
  add('eje_intermedio', 'Eje intermedio y engranaje', G2, [[[
    cil('y', 0.6, 0.6, 5.6, XG, 0.7, 0, cromo(), 20),
    engranaje(36, 3.0, 1.0, -2.2, XG, 0, diente()), cil('y', 1.4, 1.4, 0.4, XG, -1.0, 0, acero('#6f757c'), 28),
  ], V(0, 5, 0)]]);
  add('pinon', 'Piñón del inducido', G2, [[[
    engranaje(12, 1.05, 1.0, -2.2, XM, 0, diente()), cil('y', 0.6, 0.6, 0.5, XM, -0.9, 0, acero('#9aa0a8'), 20),
  ], V(0, 13, 0)]]);

  // ---------- motor (eje Y, en x = XM) ----------
  const lam = laminas(), wire = alambre();
  add('estator', 'Estator', G3, [[[
    cil('y', 3.3, 3.3, 4.2, XM, -7.6, 0, mat('#fff', { map: lam, metalness: 0.7, roughness: 0.45 }), 48, true),
    cil('y', 2.65, 2.65, 4.2, XM, -7.6, 0, mat('#8a9097', { metalness: 0.7, roughness: 0.5 }), 48, true),
    caja(0.7, 5.4, 1.8, XM + 2.9, -7.6, 0, mat('#fff', { map: wire, metalness: 0.9, roughness: 0.35 })), caja(0.7, 5.4, 1.8, XM - 2.9, -7.6, 0, mat('#fff', { map: wire, metalness: 0.9, roughness: 0.35 })),
  ], V(9, -2, 0)]]);
  const bob = () => mat('#fff', { map: wire, metalness: 0.9, roughness: 0.35 });
  add('inducido', 'Inducido (rotor)', G3, [[[
    cil('y', 0.5, 0.5, 13, XM, -6.9, 0, acero('#c4c8cd', { metalness: 0.8 }), 20),
    cil('y', 2.5, 2.5, 3.6, XM, -7.6, 0, mat('#fff', { map: lam, metalness: 0.7, roughness: 0.45 }), 40),
    cil('y', 2.58, 2.58, 0.6, XM, -9.7, 0, bob(), 36), cil('y', 2.58, 2.58, 0.6, XM, -5.5, 0, bob(), 36),
    ...Array.from({ length: 12 }, (_, i) => { const a = i / 12 * PI * 2; const b = caja(0.22, 3.6, 0.06, XM + 2.5 * Math.cos(a), -7.6, 2.5 * Math.sin(a), mat('#25282c')); b.rotation.y = -a; return b; }),
  ], V(0, -12, 0)]]);
  add('colector', 'Colector', G3, [[(() => {
    const o = [cil('y', 1.1, 1.1, 1.2, XM, -11.3, 0, cobre(), 36)];
    for (let i = 0; i < 24; i++) { const a = i / 24 * PI * 2; const b = caja(0.06, 1.22, 0.12, XM + 1.12 * Math.cos(a), -11.3, 1.12 * Math.sin(a), mat('#1b1b1b')); b.rotation.y = -a; o.push(b); }
    return o;
  })(), V(0, -17, 0)]]);
  add('ventilador', 'Ventilador', G3, [[(() => {
    const o = [cil('y', 2.7, 2.7, 0.1, XM, -4.6, 0, marfil(), 40), cil('y', 0.8, 0.8, 0.6, XM, -4.5, 0, marfil(), 20)];
    for (let i = 0; i < 12; i++) { const g = new THREE.Group(); g.rotation.y = i / 12 * PI * 2; g.position.set(XM, -4.2, 0); const b = caja(1.0, 0.7, 0.06, 1.8, 0, 0, marfil()); b.rotation.x = 0.4; g.add(b); o.push(g); }
    return o;
  })(), V(0, -8, 0)]]);
  const lado = (s) => [[
    cil('z', 0.7, 0.7, 1.4, XM, -11.3, s * 1.9, mat('#b8a05a', { metalness: 0.8, roughness: 0.4 }), 4, true),
    caja(0.8, 0.8, 1.2, XM, -11.3, s * 1.75, mat('#2a2a2a', { metalness: 0.1, roughness: 0.8 })),
    ...Array.from({ length: 6 }, (_, i) => mesh(new THREE.TorusGeometry(0.33, 0.05, 6, 18), acero('#c4c8cd'), XM, -11.3, s * (2.2 + 0.18 * i))),
    cil('z', 0.7, 0.7, 0.6, XM, -11.3, s * 3.7, mat('#222', { metalness: 0, roughness: 0.6 }), 24), caja(1.0, 0.12, 0.07, XM, -11.3, s * 4.03, mat('#000')),
  ], V(0, 0, s * 12)];
  add('escobillas', 'Escobillas y portaescobillas', G3, [lado(1), lado(-1)]);
  add('rodamientos', 'Rodamientos', G3, [
    [[rodamiento('y', 1.2, 0.6, 0.6, XG, 1.9, 0)], V(0, 26, 0)],
    [[rodamiento('y', 1.2, 0.6, 0.6, XG, -3.0, 0)], V(0, 10.5, 0)],
    [[rodamiento('y', 1.3, 0.5, 0.6, XM, -2.9, 0)], V(0, -6, 0)],
    [[rodamiento('y', 1.3, 0.5, 0.6, XM, -13.3, 0)], V(0, -22, 0)],
  ]);

  // ---------- carcasas y mangos ----------
  const aluc = aluminio();
  add('carcasa_engranajes', 'Carcasa de engranajes', G4, [
    [(() => { // cuerpo del cárter y nariz de unión con el cañón
      const g = new THREE.ExtrudeGeometry(rr(-9, -3.2, 5, 2.2, 1.0), { depth: 7.4, bevelEnabled: true, bevelSize: 0.4, bevelThickness: 0.4, bevelSegments: 3, curveSegments: 12 }); g.translate(0, 0, -3.7);
      return [mesh(g, aluc), cil('x', 3.3, 3.3, 3, 4.2, 0, 0, aluc, 48, true), cil('x', 3.45, 3.45, 0.5, 5.0, 0, 0, mat('#6f757c', { metalness: 0.5 }), 48),
        ...[[-8, 1.0], [-8, -2.0], [4, 1.8], [4, -2.6]].flatMap(([x, y]) => [tornillo('z', x, y, 4.15, 0.22), tornillo('-z', x, y, -4.15, 0.22)])];
    })(), V(0, 0, 0)],
    [(() => { // tapa superior con el tapón de la manivela
      const g = new THREE.ExtrudeGeometry(rr(-9, 2.2, 5, 4.2, 0.8), { depth: 7.4, bevelEnabled: true, bevelSize: 0.4, bevelThickness: 0.4, bevelSegments: 3, curveSegments: 12 }); g.translate(0, 0, -3.7);
      const o = [mesh(g, aluc), cil('y', 2.5, 2.5, 0.3, XG, 4.9, 0, negro(), 40), cil('y', 1.9, 1.9, 0.05, XG, 5.08, 0, mat('#f2c230', { metalness: 0, roughness: 0.6 }), 36)];
      for (let i = 0; i < 6; i++) o.push(tornillo('y', -7.5 + i * 2.6, 4.9, i % 2 ? 3.1 : -3.1, 0.2));
      return o;
    })(), V(0, 17, 0)],
  ], true);
  const motorEt = textoEtiqueta(cfg.etiqueta || '');
  const perfilM = [[4.2, -3.2], [4.25, -4], [4.15, -9], [4.0, -13.5], [3.2, -14.6], [1.5, -15.0], [0.1, -15.1]];
  const ptsM = [...perfilM, ...perfilM.slice().reverse().map(([r, y]) => [Math.max(r - 0.25, 0.05), y])];
  add('carcasa_motor', 'Carcasa del motor', G3, [-1, 1].map(s => [(() => {
    const ph = s > 0 ? -PI / 2 : PI / 2, o = [rev(ptsM, 'y', cuerpo(), 48, XM, 0, 0, ph, PI)];
    for (let i = 0; i < 5; i++) for (const a of [0.45, -0.45]) { const v = caja(0.12, 0.9, 0.05, XM + 4.1 * Math.sin(a) * 0 + (i - 2) * 0.35, -13.6, 0, negro()); v.visible = false; }
    for (let i = 0; i < 6; i++) { const v = caja(0.9, 0.12, 0.05, XM + (i - 2.5) * 0.0, -4.4 - i * 0.3, s * 4.2, negro()); o.push(v); } // rejillas de aire bajo el cárter
    for (const [x, y] of [[XM + 2.4, -4.2], [XM - 2.4, -4.2], [XM, -12.6]]) o.push(tornillo(s > 0 ? 'z' : '-z', x, y, s * Math.sqrt(Math.max(4.1 * 4.1 - (x - XM) ** 2, 1)), 0.2));
    if (cfg.etiqueta) { const p = mesh(new THREE.PlaneGeometry(5.2, 0.98), new THREE.MeshBasicMaterial({ map: motorEt, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), XM, -8.4, s * 4.28); if (s < 0) p.rotation.y = PI; o.push(p); }
    return o;
  })(), V(0, 0, s * 8)]), true);
  const asa = rr(-17.6, -3.2, -8.6, 6.4, 2.6), hueco = new THREE.Path(rr(-15.0, -1.6, -10.9, 4.4, 1.3).getPoints(16).reverse());
  asa.holes.push(hueco);
  add('mango_trasero', 'Mango trasero', G4, [-1, 1].map(s => [(() => {
    const g = new THREE.ExtrudeGeometry(asa, { depth: 2.5, bevelEnabled: true, bevelSize: 0.35, bevelThickness: 0.35, bevelSegments: 3, curveSegments: 20 }); g.translate(0, 0, s > 0 ? 0.05 : -2.55);
    return [mesh(g, plastico()), ...[0.9, 2.2, 3.5].map(y => caja(0.12, 0.2, 5.2, -16.7, -1 + y, 0, goma('#3a3e44'))), tornillo('z', -16.2, 5.2, s * 3.25, 0.2), tornillo('z', -10.0, 5.2, s * 3.25, 0.2)];
  })(), V(0, 0, s * 7)]), true);
  add('interruptor', 'Interruptor', G3, [[[
    caja(4.0, 1.2, 2.2, -12.8, 5.5, 0, mat('#cfd0d2', { metalness: 0, roughness: 0.6 })),
    caja(1.5, 2.2, 1.6, -12.4, 3.6, 0, mat('#22252a')), caja(0.5, 0.9, 1.7, -12.4, 3.2, 0, mat('#f26b21', { metalness: 0.1, roughness: 0.5 })),
    cil('x', 0.4, 0.4, 0.6, -10.8, 4.6, 0, mat('#d63a2f', { metalness: 0.1 }), 16),
    caja(0.15, 0.4, 0.3, -10.5, 5.9, 0.6, cobre()), caja(0.15, 0.4, 0.3, -10.5, 5.9, -0.6, cobre()),
  ], V(-3, -9, 0)]]);
  const curva = new THREE.CatmullRomCurve3([V(-18.5, 0.5, 0), V(-21, 0.2, 0.3), V(-24, -2.4, 1.8), V(-28, -6.5, 0.6)]);
  add('cable', 'Cable', G3, [[[
    mesh(new THREE.TubeGeometry(curva, 48, 0.5, 12), goma('#18191c')),
    rev([[0.5, -19.7], [0.7, -19.4], [0.9, -19.0], [1.1, -18.5], [1.2, -18.0], [1.4, -17.5]], 'x', goma('#1a1b1e'), 24, 0, 0.5, 0),
  ], V(-12, -4, 0)]]);
  add('mango_auxiliar', 'Mango auxiliar', G4, [[[
    rev([[2.95, 17], [2.95, 20.5], [2.7, 20.5], [2.7, 17]], 'x', acero('#40454b'), 40, 0, 0, 0),
    caja(1.8, 1.4, 1.6, 18.8, 3.2, 0, acero('#40454b')), cil('z', 0.4, 0.4, 2.2, 18.8, 3.2, 0, acero('#c4c8cd'), 12),
    cil('y', 3.2, 3.2, 0.3, 18.8, 4.2, 0, goma('#222528'), 36),
    rev(estriasY(1.3, 10, 4.35), 'y', goma('#222528'), 24, 18.8, 0, 0),
  ], V(0, 0, 12)]]);

  return { k, parts };
}
