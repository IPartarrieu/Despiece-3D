// Sonda de alta frecuencia 45 mm: convertidor de frecuencia + motor eléctrico trifásico dentro de la sonda. REFERENCIAL.
// Unidades: cm. Sonda vertical en x = XA, borde superior en y = YA. Arquitectura del cabezal según el manual Husqvarna AX36-AX65
// (1006-004, págs. 8-9: tuerca C, niple F, rotor G, portarrodamiento H, elemento excéntrico I, tornillos J, rodamiento K, tapa de extremo);
// medidas de la sonda según Wacker IRFU 45 (45 x 382 mm); convertidor según IRFU (rectificador + inversor a 42 V trifásico 200 Hz).
// APROXIMADO: el orden axial (excéntrico hacia la punta) se dedujo de la secuencia de desarme; medidas internas, formas y colores.
import * as THREE from 'three';
import { vivoAF, XA, YA, MAA } from './vivo.js';
import { PI, V, mat, acero, goma, mesh, cil, caja, rev, rodamiento, tornillo, laminas, alambre, lienzo } from '../lib.js';

const CAT = await (await fetch(new URL('data.json', import.meta.url))).json();
const tubo = (pts, r, m, seg = 64) => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.3), seg, r, 12), m);

export function alta(cfg) {
  const m = cfg.m || {}, mod = m.modelo || 'AF45';
  const Rh = (m.diametro || 45) / 20, Lh = (m.largo_cabezal || 382) / 10, ys = s => YA - s;
  const parts = {};
  const add = (id, items, shell = false) => {
    const c = CAT.catalogoPorModelo?.[mod]?.[id] || CAT.catalogo[id];
    const its = items.map(([objs, dir]) => { const g = new THREE.Group(); [].concat(objs).forEach(o => g.add(o)); return { obj: g, dir }; });
    const mats = []; its.forEach(i => i.obj.traverse(o => { if (o.material) { o.userData.pid = id; mats.push(o.material); } }));
    parts[id] = { id, nombre: c[1] ? `${c[0]} (${c[1]})` : c[0], ref: c[1], grupo: c[2], items: its, mats, shell };
  };
  const negro = () => mat('#1b1c1f', { metalness: 0.3, roughness: 0.6 });
  const ac = (c = '#b4b9c0') => acero(c), brill = () => acero('#d3d7dc', { metalness: 0.85, roughness: 0.25 });
  const alu = () => mat('#b9bec5', { metalness: 0.65, roughness: 0.45 });
  const O = V(0, 0, 0);

  // ================= convertidor =================
  const rot = lienzo(512, 128, g => { g.fillStyle = '#fff'; g.font = 'bold 54px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CONVERTIDOR', 256, 36); g.font = 'bold 44px sans-serif'; g.fillText('42 V · 3~ · 200 Hz', 256, 96); });
  add('convertidor', [[[caja(22, 16, 16, -23, -1, 0, mat('#2f4858', { metalness: 0.2, roughness: 0.5 })), tubo([V(-31, 7, 0), V(-31, 11, 0), V(-15, 11, 0), V(-15, 7, 0)], 0.8, negro(), 24),
    ...[0, 1, 2, 3, 4, 5].map(i => caja(0.4, 6, 0.1, -32 + i * 1.2, -4, 8.05, negro())),
    mesh(new THREE.SphereGeometry(0.6, 16, 12), mat('#ff3b3b', { emissive: '#ff3b3b', emissiveIntensity: 0.3 }), -14.5, 4, 8.1),
    mesh(new THREE.PlaneGeometry(11, 2.75), mat('#fff', { map: rot, transparent: true, alphaTest: 0.3 }), -21, 3, 8.04)], O]], true);
  add('electronica', [[[caja(17, 0.3, 12, -23, -7.5, 0, mat('#2e6b3a')), ...[-1, 1].map(s => cil('y', 1.0, 1.0, 3, -28, -5.6, s * 3, mat('#2b3f8a'), 20)),
    caja(6, 4, 8, -17, -5.4, 0, alu()), ...[0, 1, 2, 3].map(i => caja(6, 0.2, 8, -17, -3.2 + i * 0.5 - 0.6, 0, alu())), caja(3, 1, 3, -23, -6.8, 3, negro())], V(0, -4, 22)]]);
  add('cable_red', [[[tubo([V(-34, -4, 0), V(-40, -6, 0), V(-46, -12, 2), V(-50, -16, 4)], 0.45, goma('#18191c')), caja(3, 2.4, 2.6, -51.5, -17.5, 4.6, negro()),
    ...[-1, 1].map(s => cil('x', 0.2, 0.2, 1.6, -53.6, -17.5, 4.6 + s * 0.6, brill(), 8))], V(-6, -4, 0)]]);

  // ================= cable, interruptor y manguera =================
  add('cable_salida', [[[tubo([V(-12, -2, 0), V(-6, -2, 0), V(-1, 0, 0)], 0.5, goma('#26282b'), 16)], V(0, -5, 4)]]);
  add('interruptor', [[[caja(7, 4, 4, 3.5, 0, 0, negro()), caja(2, 1, 2, 3.5, 2.3, 0, mat('#d33', { roughness: 0.5 })), cil('x', 1.3, 1.3, 1, 7.4, 0, 0, negro(), 20)], V(0, 9, 0)]]);
  add('manguera', [[[tubo(MAA, 1.4, goma('#1d1e21'), 80)], V(0, 6, -8)]]);

  // ================= sonda (Husqvarna AX: letras del manual) =================
  add('niple', [[[rev([[0.7, ys(3)], [1.4, ys(3)], [1.4, ys(1.5)], [1.55, ys(1.2)], [1.2, ys(0.6)], [1.45, ys(0.3)], [1.0, ys(-0.5)], [0.7, ys(-0.5)], [0.7, ys(3)]], 'y', ac('#a3a9b0'), 32, XA, 0, 0)], V(0, 16, 0)]]);
  add('tuerca', [[[cil('y', 2.15, 2.15, 1.6, XA, ys(3.8), 0, ac('#8d939a'), 6)], V(8, 12, 0)]]);
  add('tubo', [[[rev([[Rh - 0.3, ys(4.6)], [Rh, ys(4.6)], [Rh, ys(Lh - 3)], [Rh - 0.3, ys(Lh - 3)], [Rh - 0.3, ys(4.6)]], 'y', ac('#b8bdc3'), 48, XA, 0, 0)], O]], true);
  add('portarrod', [[[rev([[1.2, ys(6.6)], [Rh - 0.3, ys(6.6)], [Rh - 0.3, ys(5)], [1.2, ys(5)], [1.2, ys(6.6)]], 'y', ac('#8d939a'), 32, XA, 0, 0), rodamiento('y', 1.2, 0.42, 0.8, XA, ys(5.8), 0)], V(-12, 8, 0)]]);
  const nucleo = new THREE.MeshStandardMaterial({ map: laminas(), metalness: 0.6, roughness: 0.4 });
  const cobreB = () => new THREE.MeshStandardMaterial({ map: alambre(), metalness: 0.7, roughness: 0.35 });
  add('estator', [[[rev([[1.3, ys(20.5)], [Rh - 0.3, ys(20.5)], [Rh - 0.3, ys(6.8)], [1.3, ys(6.8)], [1.3, ys(20.5)]], 'y', nucleo, 40, XA, 0, 0),
    rev([[1.3, ys(7.4)], [1.85, ys(7.4)], [1.85, ys(6.7)], [1.3, ys(6.7)]], 'y', cobreB(), 32, XA, 0, 0), rev([[1.3, ys(20.6)], [1.85, ys(20.6)], [1.85, ys(19.9)], [1.3, ys(19.9)]], 'y', cobreB(), 32, XA, 0, 0)], V(-24, 0, 0)]]);
  add('rotor', [[[cil('y', 0.42, 0.42, Lh - 9.6, XA, ys((5 + Lh - 4.6) / 2), 0, brill(), 16), cil('y', 1.2, 1.2, 12.9, XA, ys(13.65), 0, nucleo, 32),
    cil('y', 1.22, 1.22, 0.3, XA, ys(7.2), 0, alu(), 32), cil('y', 1.22, 1.22, 0.3, XA, ys(20.1), 0, alu(), 32)], V(-14, -3, 0)]]);
  add('excentrico', [[[cil('y', Rh - 0.55, Rh - 0.55, 9.5, XA, ys(26.75), 0, ac('#7d838b'), 32, false, 0, PI), cil('y', 0.8, 0.8, 9.5, XA, ys(26.75), 0, ac('#7d838b'), 20)], V(12, -6, 0)]]);
  add('tornillos_j', [[[tornillo('x', XA + Rh - 0.6, ys(24), 0, 0.22), tornillo('x', XA + Rh - 0.6, ys(29.5), 0, 0.22)], V(16, -6, 0)]]);
  add('rod_k', [[[rodamiento('y', 1.3, 0.42, 0.9, XA, ys(Lh - 5.2), 0)], V(-14, -12, 0)]]);
  add('aceite', [[[cil('y', Rh - 0.32, Rh - 0.32, 1.6, XA, ys(Lh - 3.9), 0, mat('#d9a441', { metalness: 0, roughness: 0.2 }), 32)], V(10, -14, 0)]]);
  const oring = s => { const o = mesh(new THREE.TorusGeometry(Rh - 0.3, 0.09, 8, 40), goma('#121315'), XA, ys(s), 0); o.rotation.x = PI / 2; return o; };
  add('orings', [[[oring(4.7), oring(Lh - 3.1)], V(6, -18, 0)]]);
  add('tapa_ext', [[[rev([[0.01, ys(Lh)], [Rh * 0.55, ys(Lh - 0.15)], [Rh * 0.88, ys(Lh - 0.8)], [Rh, ys(Lh - 1.8)], [Rh, ys(Lh - 3)], [Rh - 0.4, ys(Lh - 3)], [Rh - 0.4, ys(Lh - 4.2)], [0.01, ys(Lh - 4.2)]], 'y', ac('#6f757c'), 40, XA, 0, 0)], V(0, -12, 0)]]);

  return { parts, vivo: vivoAF(parts, { Rh, Lh }) };
}
