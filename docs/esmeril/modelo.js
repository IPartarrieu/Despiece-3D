// Modelo procedural del esmeril angular. Unidades: cm. Eje del motor = X (el cabezal en x=0, el motor hacia -X),
// eje del husillo = Y (el disco abajo). Se construye en medidas de un esmeril de 115 mm y se escala con k.
import * as THREE from 'three';
import { PI, V, mat, acero, aluminio, cobre, goma, negro, marfil, mesh, cil, caja, rev, tornillo, lienzo, laminas, alambre, etiquetaDisco, textoEtiqueta, rodamiento, rr } from '../lib.js';

const YM = 2.3; // altura del eje del motor

export function construir(cfg) {
  const k = 1 + 0.4 * (cfg.disco - 115) / 115;   // escala del cuerpo según el diámetro
  const Rb = cfg.disco / 20 / k;                  // radio del disco en medidas base
  const color = cfg.color;
  // estilo de marca (colores y formas) y medidas del modelo (potencia -> grosor del cuerpo)
  const e = { c2: '#2b2e33', cabezal: 'metal', forma: 'redondo', grosor: 1, agarre: 'banda', cola: 'goma', ventilas: 'delanteras', sinllave: false, ...(cfg.estilo || {}) };
  if (/sin herramienta|sin llave|one-touch/i.test(cfg.m?.nota || '')) e.sinllave = true;
  const Pot = Number(cfg.m?.potencia) || { 115: 850, 125: 1200, 180: 2000, 230: 2100 }[cfg.disco] || 1000;
  const rs = Math.min(1.22, Math.max(1, (0.96 + (Pot - 700) / 1800 * 0.3) * e.grosor)), rn = Math.min(rs, 1.08);
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

  // ---- disco y fijación ----
  add('disco', 'Disco abrasivo', G1, [[[
    rev([[Rb - 0.03, -2.2], [Rb, -2.17], [Rb, -1.93], [Rb - 0.03, -1.9], [0.8, -1.9], [0.8, -2.2], [Rb - 0.03, -2.2]], 'y', mat('#41575f', { metalness: 0, roughness: 0.9 }), 72),
    (() => { const c = mesh(new THREE.CircleGeometry(Rb - 0.03, 72), mat('#fff', { map: etiquetaDisco(cfg.disco), metalness: 0, roughness: 0.85 }), 0, -1.895, 0); c.rotation.x = -PI / 2; return c; })(),
  ], V(0, -8.3, 0)]]);
  add('tuerca', 'Brida exterior o tuerca', G1, [[(() => {
    const s = new THREE.Shape().absarc(0, 0, 1.45, 0, PI * 2, false);
    for (const sx of [-0.85, 0.85]) s.holes.push(new THREE.Path().absarc(sx, 0, 0.2, 0, PI * 2, true));
    s.holes.push(new THREE.Path().absarc(0, 0, 0.45, 0, PI * 2, true));
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.4, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 2, curveSegments: 48 });
    g.rotateX(PI / 2); // z -> -y: la tapa queda hacia abajo
    return [mesh(g, acero('#b3b8bf'), 0, -2.25, 0), cil('y', 0.8, 0.8, 0.25, 0, -2.38, 0, acero('#b3b8bf'), 32, true)];
  })(), V(0, -14, 0)]]);
  add('brida_int', 'Brida interior', G1, [[[
    rev([[0.42, -2.22], [0.8, -2.22], [0.8, -1.88], [1.55, -1.85], [1.65, -1.8], [1.65, -1.65], [1.5, -1.6], [0.42, -1.6]], 'y', acero('#b3b8bf'), 48),
  ], V(0, -5.2, 0)]]);
  const prot = acero('#838991', { metalness: 0.5 });
  add('protector', 'Protector', G1, [[(() => {
    const R2 = Rb + 0.9, o = [
      rev([[R2, -2.4], [R2 + 0.12, -2.3], [R2 + 0.12, -2.0], [R2, -1.9], [R2, -1.45]], 'y', prot, 72, 0, 0, 0, PI, PI),      // falda con labio
      cil('y', R2, R2, 0.15, 0, -1.4, 0, prot, 72, false, PI, PI),                                                             // tapa
      cil('y', 2.2, 2.2, 0.55, 0, -1.25, 0, prot, 40, true),                                                                   // collar
      caja(0.8, 0.5, 0.7, 2.45, -1.2, 0, prot), cil('x', 0.17, 0.17, 0.5, 2.9, -1.2, 0, acero('#333'), 12),                    // oreja y tornillo del collar
      ...(e.sinllave ? [caja(1.2, 0.3, 2.6, 2.6, -1.0, 0, mat(e.c2)), caja(0.5, 0.9, 0.5, 3.1, -1.0, 1.1, mat(e.c2))] : []),
      caja(0.4, 0.15, 0.6, -R2 + 0.15, -2.35, 0, mat('#d9a521', { metalness: 0.1 })),                                           // marca de ajuste
    ];
    return o;
  })(), V(0, -2.2, 0)]], true);
  add('husillo', 'Husillo', G1, [[(() => {
    const o = [rev([[0.01, -2.8], [0.38, -2.8], [0.42, -2.7], [0.42, 0.6], [0.85, 0.65], [0.85, 1.0], [0.5, 1.05], [0.42, 1.1], [0.42, 4.0], [0.01, 4.0]], 'y', acero('#cfd3d8', { metalness: 0.8, roughness: 0.3 }), 32)];
    for (let i = 0; i < 12; i++) { const t = mesh(new THREE.TorusGeometry(0.42, 0.04, 6, 24), acero('#aeb3b9'), 0, -2.65 + i * 0.1, 0); t.rotation.x = PI / 2; o.push(t); }
    o.push(caja(0.2, 1.25, 0.2, 0.42, -2.1, 0, acero('#b3b8bf')), caja(0.2, 1.25, 0.2, -0.42, -2.1, 0, acero('#b3b8bf'))); // planos de llave
    return o;
  })(), V(0, -2.5, 0)]]);

  // ---- engranajes con dientes ----
  const gris = () => mat('#7d838b', { metalness: 0.75, roughness: 0.4 });
  add('corona', 'Corona', G1, [[(() => {
    const o = [cil('y', 1.9, 1.3, 0.7, 0, 1.4, 0, gris(), 48), cil('y', 0.85, 0.85, 0.5, 0, 0.9, 0, gris(), 24), cil('y', 1.4, 1.4, 0.06, 0, 1.76, 0, gris(), 48)];
    for (let i = 0; i < 34; i++) { // dientes sobre la cara cónica
      const g = new THREE.Group(); g.rotation.y = i / 34 * PI * 2;
      const t = caja(0.16, 0.8, 0.24, 1.66, 1.45, 0, gris()); t.rotation.z = -0.71; g.add(t); o.push(g);
    }
    return o;
  })(), V(0, 5.5, 0)]]);
  add('pinon', 'Piñón', G2, [[(() => {
    const o = [cil('x', 0.45, 0.78, 1.7, -2.4, YM, 0, gris(), 22), cil('x', 0.55, 0.55, 0.65, -3.575, YM, 0, acero(), 20)];
    for (let i = 0; i < 11; i++) {
      const g = new THREE.Group(); g.rotation.x = i / 11 * PI * 2; g.position.set(0, YM, 0);
      const t = caja(1.7, 0.3, 0.3, -2.4, 0.66, 0, gris()); t.rotation.z = -0.2; g.add(t); o.push(g);
    }
    return o;
  })(), V(0, 6.5, 0)]]);

  // ---- cabezal ----
  const cab = e.cabezal === 'metal' ? aluminio() : mat(e.cabezal === 'color' ? color : e.cabezal, { metalness: 0.25, roughness: 0.45 });
  const cuerpoCabezal = () => {
    if (e.forma === 'cuadrado') { // cabezal prismático de aristas redondeadas
      const g = new THREE.ExtrudeGeometry(rr(-2.95, -2.95, 2.95, 2.95, 1.3), { depth: 4.9, bevelEnabled: true, bevelSize: 0.35, bevelThickness: 0.4, bevelSegments: 3, curveSegments: 14 });
      g.rotateX(-PI / 2); g.translate(0, -0.7, 0);
      return [mesh(g, cab), rev([[2.3, -1.1], [2.0, -1.35], [0.9, -1.35], [0.9, -1.1]], 'y', cab, 40)];
    }
    const sup = e.forma === 'plano' ? [[0.01, 4.9], [2.7, 4.88], [2.95, 4.7], [3.0, 4.3]] : [[0.01, 4.95], [1.6, 4.9], [2.4, 4.7], [2.8, 4.3]];
    return [rev([...sup, [3.0, 3.6], [3.0, 0.2], [2.95, -0.4], [2.6, -0.9], [2.1, -1.1], [2.0, -1.35], [0.9, -1.35], [0.9, -1.1]], 'y', cab, 64)];
  };
  add('cabezal', 'Cabezal', G1, [[(() => {
    const o = [
      ...cuerpoCabezal(),
      rev([[2.55 * rn, 0], [2.6 * rn, -0.5], [2.65 * rn, -2.5], [2.75 * rn, -3.8], [2.9 * rn, -4.3]], 'x', cab, 56, 0, YM, 0),   // cuello del cabezal hacia el motor
      cil('x', 2.95 * rn, 2.95 * rn, 0.3, -4.4, YM, 0, mat('#6f757c', { metalness: 0.5 }), 56),                    // aro de unión con la carcasa
      cil('y', 1.15, 1.15, 0.1, 1.0, 4.95, 0, mat('#6f757c', { metalness: 0.5 }), 32),                   // tapa de grasa superior
      cil('y', 3.02, 3.02, 0.12, 0, 0.0, 0, mat('#6f757c', { metalness: 0.5 }), 64),                     // nervio perimetral
    ];
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; o.push(tornillo('y', 1.0 + 0.85 * Math.cos(a), 5.0, 0.85 * Math.sin(a), 0.12)); }
    return o;
  })(), V(0, 0, 0)]], true);
  add('rodamientos', 'Rodamientos', G1, [
    [[rodamiento('x', 0.95, 0.42, 0.55, -13.4, YM, 0)], V(-9.5, -9, 0)],
    [[rodamiento('x', 1.1, 0.42, 0.5, -4.0, YM, 0)], V(0, -9, 0)],
    [[rodamiento('y', 1.0, 0.45, 0.5, 0, 3.0, 0)], V(0, 11, 0)],
    [[rodamiento('y', 1.1, 0.45, 0.5, 0, 0.5, 0)], V(0, 8.6, 0)],
  ]);
  add('boton', 'Botón de bloqueo', G1, [[[
    rev([[0.01, 0.0], [0.58, 0.0], [0.58, 0.3], [0.46, 0.55], [0.01, 0.6]], 'y', mat('#d63a2f', { metalness: 0.1, roughness: 0.45 }), 28, -1.3, 4.95, 0),
    cil('y', 0.8, 0.8, 0.16, -1.3, 4.97, 0, acero('#40454b'), 28),
    cil('y', 0.12, 0.12, 0.4, -1.3, 4.7, 0, acero('#9aa0a7'), 12),
  ], V(0, 14, 0)]]);
  // empuñadura lateral: agarre estriado con remate redondo
  const estria = []; estria.push([0.01, 0]); for (let i = 0; i <= 34; i++) estria.push([0.78 + (i % 2 ? 0.05 : 0), 0.15 + i * 0.28]);
  estria.push([0.7, 9.9], [0.45, 10.2], [0.01, 10.3]);
  add('mango', 'Empuñadura lateral', G1, [[[
    rev(estria, 'z', goma('#222528'), 24, 0, 0.95, 3.3),
    cil('z', 0.4, 0.4, 1.0, 0, 0.95, 2.8, acero('#c4c8cd'), 16), cil('z', 1.0, 1.0, 0.3, 0, 0.95, 3.35, acero('#5a5f66'), 28),
  ], V(0, 0, 10)]]);

  // ---- carcasa ----
  const cuerpo = () => mat(color, { metalness: 0.08, roughness: 0.5 });
  const perfil = [[0.1, -15.75], [1.2, -15.6], [2.0, -15.2], [2.5, -14.5], [2.75, -13.4], [2.88, -11.5], [2.93, -9], [2.93, -7], [2.88, -5.5], [2.86, -4.6], [2.86, -4.2]].map(([r, y]) => [r * rs, y]);
  const pts = [...perfil, ...perfil.slice().reverse().map(([r, y]) => [Math.max(r - 0.22, 0.05), y])];
  const rAt = x => { for (let i = 0; i < perfil.length - 1; i++) { const [r0, y0] = perfil[i], [r1, y1] = perfil[i + 1]; if (x >= y0 && x <= y1) return r0 + (r1 - r0) * (x - y0) / (y1 - y0); } return perfil.at(-1)[0]; };
  const [g0, g1] = e.agarre === 'total' ? [-14.6, -5.6] : [-12.6, -6.44];   // tramo recubierto de goma
  const ondas = []; for (let x = g0, i = 0; x <= g1; x += 0.14, i++) ondas.push([rAt(x) + 0.045 + (i % 2 ? 0.035 : 0), x]);
  const agarre = [...ondas, ...[...ondas].reverse().map(([r, y]) => [rAt(y) - 0.02, y])];
  const etiq = textoEtiqueta(cfg.etiqueta || '');
  const mitad = (s) => {
    const ph = s > 0 ? -PI / 2 : PI / 2, o = [
      rev(pts, 'x', cuerpo(), 48, 0, YM, 0, ph, PI),
      ...(e.agarre === 'ninguno' ? [] : [rev(agarre, 'x', goma(e.c2), 48, 0, YM, 0, ph, PI)]),
      rev([[2.25 * rs, -15.76], [2.0 * rs, -15.45], [1.3 * rs, -15.65]], 'x', e.cola === 'color' ? cuerpo() : goma(e.c2), 32, 0, YM, 0, ph, PI),
    ];
    for (const [x0, n, paso] of [...(e.ventilas !== 'traseras' ? [[-4.9, 7, -0.2]] : []), ...(e.ventilas !== 'delanteras' ? [[-13.2, 6, -0.2]] : [])]) for (let i = 0; i < n; i++) for (const a of [0.5, -0.5]) { // rejillas de ventilación
      const x = x0 + i * paso, r = rAt(x), v = caja(0.12, 0.8, 0.05, x, YM + r * Math.sin(a), s * r * Math.cos(a), negro()); v.rotation.x = s > 0 ? -a : PI + a; o.push(v);
    }
    for (const [x0, y0] of [[-5.2, 1.9], [-5.2, -1.9], [-14.0, 0.0]]) o.push(tornillo(s > 0 ? 'z' : '-z', x0, YM + y0, s * Math.sqrt(2.9 * 2.9 * rs * rs - y0 * y0)));
    if (cfg.etiqueta) { const p = mesh(new THREE.PlaneGeometry(3.6, 0.68), new THREE.MeshBasicMaterial({ map: etiq, transparent: true, depthWrite: false, side: THREE.FrontSide, polygonOffset: true, polygonOffsetFactor: -2 }), -9.7, YM + 0.2, s * (rAt(-9.7) + 0.08)); if (s < 0) p.rotation.y = PI; o.push(p); }
    return o;
  };
  add('carcasa', 'Carcasa del motor', G2, [[mitad(1), V(0, 0, 7)], [mitad(-1), V(0, 0, -7)]], true);

  const lam = laminas(), wire = alambre();
  const ranuras = (xc, r, largo) => Array.from({ length: 12 }, (_, i) => { const a = i / 12 * PI * 2; const b = caja(largo, 0.05, 0.22, xc, YM + r * Math.cos(a), r * Math.sin(a), mat('#25282c')); b.rotation.x = a; return b; });
  add('estator', 'Estator', G2, [[[
    cil('x', 2.4, 2.4, 4, -9.3, YM, 0, mat('#fff', { map: lam, metalness: 0.7, roughness: 0.45 }), 56, true),
    cil('x', 1.5, 1.5, 4, -9.3, YM, 0, mat('#8a9097', { metalness: 0.7, roughness: 0.5 }), 56, true),
    cil('x', 2.4, 1.5, 0.001, -7.3, YM, 0, acero('#9aa0a8'), 56, true),
    caja(5.2, 1.3, 0.6, -9.3, YM, 1.95, mat('#fff', { map: wire, metalness: 0.9, roughness: 0.35 })), caja(5.2, 1.3, 0.6, -9.3, YM, -1.95, mat('#fff', { map: wire, metalness: 0.9, roughness: 0.35 })),
    caja(0.3, 1.2, 0.3, -11.9, YM, 1.0, mat('#d9a521', { metalness: 0.1 })), caja(0.3, 1.2, 0.3, -11.9, YM, -1.0, mat('#c23a2a', { metalness: 0.1 })), // cables a escobillas
  ], V(0, 6.5, 0)]]);
  add('inducido', 'Inducido', G2, [[[
    cil('x', 0.4, 0.4, 10.6, -8.5, YM, 0, acero('#c4c8cd', { metalness: 0.8 })),
    cil('x', 1.35, 1.35, 3.2, -9.3, YM, 0, mat('#fff', { map: lam, metalness: 0.7, roughness: 0.45 }), 32),
    ...ranuras(-9.3, 1.36, 3.2),
    cil('x', 1.47, 1.47, 0.55, -11.15, YM, 0, mat('#fff', { map: wire, metalness: 0.9, roughness: 0.35 }), 32), cil('x', 1.47, 1.47, 0.55, -7.45, YM, 0, mat('#fff', { map: wire, metalness: 0.9, roughness: 0.35 }), 32),
  ], V(-4, -9, 0)]]);
  add('ventilador', 'Ventilador', G2, [[(() => {
    const o = [cil('x', 1.7, 1.7, 0.08, -6.5, YM, 0, marfil(), 40), cil('x', 0.5, 0.5, 0.6, -6.6, YM, 0, marfil(), 20), cil('x', 0.15, 0.15, 0.7, -6.6, YM, 0, acero(), 12)];
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; const b = caja(0.5, 0.9, 0.05, -6.25, YM + 1.2 * Math.cos(a), 1.2 * Math.sin(a), marfil()); b.rotation.set(a, 0.0, 0.35, 'XYZ'); o.push(b); }
    return o;
  })(), V(0.8, -9, 0)]]);
  if (!cfg.bateria) {
    add('colector', 'Colector', G2, [[(() => {
      const o = [cil('x', 0.85, 0.85, 1.0, -12.1, YM, 0, cobre(), 36), cil('x', 0.9, 0.9, 0.1, -11.55, YM, 0, negro(), 28)];
      for (let i = 0; i < 20; i++) { const a = i / 20 * PI * 2; const b = caja(1.02, 0.05, 0.1, -12.1, YM + 0.86 * Math.cos(a), 0.86 * Math.sin(a), mat('#1b1b1b')); b.rotation.x = a; o.push(b); }
      return o;
    })(), V(-7, -9, 0)]]);
    const lado = (s) => [[
      cil('z', 0.64, 0.64, 1.3, -12.1, YM, s * 1.65, mat('#b8a05a', { metalness: 0.8, roughness: 0.4 }), 4, true),
      caja(0.7, 0.7, 1.1, -12.1, YM, s * 1.45, mat('#2a2a2a', { metalness: 0.1, roughness: 0.8 })),
      caja(0.3, 0.06, 0.8, -11.7, YM + 0.2, s * 2.0, cobre()),
      ...Array.from({ length: 6 }, (_, i) => mesh(new THREE.TorusGeometry(0.3, 0.045, 6, 18), acero('#c4c8cd'), -12.1, YM, s * (1.9 + 0.17 * i))),
      cil('z', 0.62, 0.62, 0.6, -12.1, YM, s * 2.95, mat('#222', { metalness: 0, roughness: 0.6 }), 24), caja(0.9, 0.12, 0.07, -12.1, YM, s * 3.28, mat('#000')),
    ], V(0, 0, s * 11)];
    add('escobillas', 'Escobillas y portaescobillas', G2, [lado(1), lado(-1)]);
  }

  // ---- alimentación ----
  const gat = !!cfg.gatillo;
  add('interruptor', 'Interruptor', G3, [[[
    caja(2.0, 0.8, 1.8, -5.6, YM - 2.45, 0, mat('#cfd0d2', { metalness: 0, roughness: 0.6 })),
    caja(0.15, 0.4, 0.3, -4.7, YM - 1.9, 0.5, cobre()), caja(0.15, 0.4, 0.3, -4.7, YM - 1.9, -0.5, cobre()),
    caja(2.6, 0.12, 1.5, -5.7, YM - 2.78, 0, mat('#2a2d31')),
    gat ? (() => { const l = caja(1.8, 0.6, 0.9, -6.0, YM - 2.95, 0, mat('#22252a')); l.rotation.z = 0.25; return l; })()
        : caja(3.0, 0.3, 1.1, -5.8, YM - 2.98, 0, mat('#22252a')),
    ...(gat ? [caja(0.6, 0.3, 0.5, -5.0, YM - 2.8, 0, mat('#d63a2f'))] : Array.from({ length: 7 }, (_, i) => caja(0.1, 0.12, 1.0, -6.9 + i * 0.3, YM - 3.16, 0, mat('#3a3e44')))),
  ], V(0, -12, 0)]]);
  if (cfg.bateria) {
    add('bateria', 'Batería', G3, [[[
      caja(6.2, 5.6, 5.4, -18.3, YM, 0, mat('#2b2e33', { metalness: 0.1, roughness: 0.6 })),
      caja(6.25, 1.2, 5.45, -18.3, YM + 1.6, 0, mat(color, { metalness: 0.1, roughness: 0.5 })),
      ...[0, 1, 2, 3].map(i => caja(0.08, 0.5, 3.2, -15.17, YM - 1.4 + i * 0.35, 0, mat('#555a60'))),
    ], V(-9, 0, 0)]]);
  } else {
    const curva = new THREE.CatmullRomCurve3([V(-16.4, YM, 0), V(-19, YM - 0.4, 0.2), V(-22, YM - 2.6, 1.6), V(-26, YM - 7, 0.5)]);
    const botas = [[0.45, -0.8], [0.55, -0.95], [0.75, -1.1], [0.9, -1.3], [1.0, -1.5], [0.9, -1.7], [0.95, -1.9], [0.85, -2.1], [0.75, -2.3], [0.6, -2.5], [0.5, -2.7]].map(([r, d]) => [r, -15.0 + d]);
    add('cable', 'Cable', G3, [[[
      mesh(new THREE.TubeGeometry(curva, 48, 0.45, 12), goma('#18191c')), rev(botas, 'x', goma('#1a1b1e'), 24, 0, YM, 0),
    ], V(-9, 0, 0)]]);
  }
  return { k, parts };
}
