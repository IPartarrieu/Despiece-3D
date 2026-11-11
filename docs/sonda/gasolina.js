// Sistema de eje flexible a gasolina: unidad motriz 5,5 HP + eje flexible + cabezal de 45 o 38 mm. REFERENCIAL.
// Unidades: cm. Cigüeñal = eje X (toma de fuerza hacia +X), y hacia arriba; cilindro inclinado 25° hacia +Z (enCil).
// Arquitectura: motor tipo Honda GX160 (163 cc, 68 x 45 mm, manual del propietario 00X37-Z4F8-100) y Truper VICO-55;
// embrague centrífugo y tapa según la lista de piezas del Wacker BV50A-H (tabla de terceros, sin verificar);
// eje flexible (SM-S) y cabezal H45 según el catálogo Wacker M1500/230 EU (págs. 17-25 y 44-47); rosca del cabezal a izquierdas (Enar).
// APROXIMADO: medidas externas del motor, formas, colores, largo de biela; el eje de 6 m se dibuja acortado (~0,6 m).
import * as THREE from 'three';
import { vivoGas, A, U, W, XH, YH, MAN, DB, cilW } from './vivo.js';
import { PI, V, mat, acero, goma, mesh, cil, caja, rev, rodamiento, rr, lienzo } from '../lib.js';

const CAT = await (await fetch(new URL('data.json', import.meta.url))).json();
const enCil = (...o) => { const g = new THREE.Group(); g.rotation.x = A; g.add(...o); return g; };   // marco del cilindro: y local = U
const tubo = (pts, r, m, seg = 64, t = 0.3) => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', t), seg, r, 12), m);
function aleta(y, w, rh, m) { // aleta de enfriamiento cuadrada (plano XZ) con agujero
  const s = rr(-w / 2, -w / 2, w / 2, w / 2, 0.8); s.holes.push(new THREE.Path().absarc(0, 0, rh, 0, PI * 2, true));
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.22, bevelEnabled: false, curveSegments: 20 }); g.rotateX(-PI / 2); return mesh(g, m, 0, y, 0);
}
const anilloY = (x, y0, y1, ro, ri, m, seg = 40) => rev([[ri, y0], [ro, y0], [ro, y1], [ri, y1], [ri, y0]], 'y', m, seg, x, 0, 0);

export function gasolina(cfg) {
  const m = cfg.m || {}, mod = m.modelo || 'EF45';
  const Rh = (m.diametro || 45) / 20, Lh = (m.largo_cabezal || 385) / 10, ys = s => YH - s;
  const parts = {};
  const add = (id, items, shell = false) => {
    const c = CAT.catalogoPorModelo?.[mod]?.[id] || CAT.catalogo[id];
    const its = items.map(([objs, dir]) => { const g = new THREE.Group(); [].concat(objs).forEach(o => g.add(o)); return { obj: g, dir }; });
    const mats = []; its.forEach(i => i.obj.traverse(o => { if (o.material) { o.userData.pid = id; mats.push(o.material); } }));
    parts[id] = { id, nombre: c[1] ? `${c[0]} (${c[1]})` : c[0], ref: c[1], grupo: c[2], items: its, mats, shell };
  };
  const pint = () => mat(cfg.color || '#c8452f', { metalness: 0.15, roughness: 0.45 });
  const negro = () => mat('#1b1c1f', { metalness: 0.3, roughness: 0.6 });
  const fund = () => mat('#8e9399', { metalness: 0.5, roughness: 0.6 });
  const alu = () => mat('#b9bec5', { metalness: 0.65, roughness: 0.45 });
  const ac = (c = '#b4b9c0') => acero(c), brill = () => acero('#d3d7dc', { metalness: 0.85, roughness: 0.25 });
  const uw = (u, w = 0) => U.clone().multiplyScalar(u).addScaledVector(W, w);
  const O = V(0, 0, 0);

  // ================= chasis y combustible =================
  const marco = x => tubo([V(x, -11, -13), V(x, 24, -13), V(x, 29, -7), V(x, 29, 7), V(x, 24, 13), V(x, -11, 13)], 1.0, negro(), 48, 0.2);
  add('chasis', [[[marco(-18), marco(17), ...[-13, 13].map(z => tubo([V(-19, -11, z), V(21, -11, z)], 1.0, negro(), 4, 0)),
    ...[-7, 7].map(z => tubo([V(-18, 29, z), V(17, 29, z)], 1.0, negro(), 4, 0)), caja(26, 0.8, 22, 0, -10.4, 0, negro())], O]]);
  const rotHP = lienzo(512, 128, g => { g.fillStyle = '#fff'; g.font = 'bold 84px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('5,5 HP', 256, 68); });
  add('tanque', [[[caja(20, 6.5, 16, -3, 24.5, 1, pint()), cil('y', 1.8, 1.8, 1.0, -9, 28.2, 4, negro(), 24), cil('x', 0.5, 0.5, 2, -13.5, 22, 4, ac(), 12),
    mesh(new THREE.PlaneGeometry(8, 2), mat('#fff', { map: rotHP, transparent: true, alphaTest: 0.3 }), 0, 24.5, 9.03)], V(0, 12, 0)]]);
  add('filtro', [[[enCil(caja(5.2, 8, 8.4, -11.9, 16.6, 0, negro()), caja(1, 6.6, 7, -14.6, 16.6, 0, mat('#e8d9a8', { roughness: 0.9 })))], V(-14, 6, -2)]]);

  // ================= motor (tipo GX160) =================
  add('carter', [[[cil('x', 6.4, 6.4, 15, 0, 0, 0, fund(), 40), caja(17, 5, 16, 0, -6.6, 0, fund()), caja(20, 0.8, 18, 0, -9.6, 0, fund()),
    cil('x', 3.2, 3.2, 1.6, 8.3, 0, 0, fund(), 32), cil('y', 0.8, 0.8, 1.6, 6, -3.6, 8.2, pint(), 16)], O]], true);
  add('cilindro', [[[enCil(rev([[3.4, 5.6], [4.6, 5.6], [4.6, 14], [3.4, 14], [3.4, 5.6]], 'y', fund(), 40), ...[7, 8.2, 9.4, 10.6, 11.8, 13].map(y => aleta(y, 11, 4.5, fund())))], O]], true);
  add('culata', [[[enCil(caja(11.5, 4.2, 11.5, 0, 16.2, 0, alu()), ...[14.8, 15.8, 16.8, 17.8].map(y => aleta(y, 12.4, 0.01, alu())), caja(7.5, 2.6, 6.5, 0, 19.6, 0, pint()))], uw(14)]], true);
  const valv = x => enCil(cil('y', 1.25, 1.25, 0.25, x, 14.25, 0, ac('#9aa0a7'), 24), cil('y', 0.28, 0.28, 5.4, x, 17.0, 0, brill(), 10), cil('y', 0.7, 0.7, 0.15, x, 19.3, 0, ac(), 16));
  add('valvulas', [[[valv(-1.6)], uw(24).add(V(-4, 0, 0))], [[valv(1.6)], uw(24).add(V(4, 0, 0))]]);   // 0: admisión, 1: escape
  const aroP = y => { const o = mesh(new THREE.TorusGeometry(3.36, 0.07, 6, 40), ac('#6f757c'), 0, y, 0); o.rotation.x = PI / 2; return o; };
  add('piston', [[[enCil(cil('y', 3.35, 3.35, 4.6, 0, 11.3, 0, alu(), 40), aroP(13.1), aroP(12.6), aroP(12.0), cil('x', 0.75, 0.75, 6.2, 0, 10.25, 0, brill(), 16))], uw(9, 1)]]);
  add('biela', [[[enCil(caja(1.2, 6.2, 0.9, 0, 6.25, 0, alu()), cil('x', 1.55, 1.55, 1.3, 0, 2.25, 0, alu(), 24), cil('x', 1.0, 1.0, 1.3, 0, 10.25, 0, alu(), 20), caja(4.4, 0.7, 1.3, 0, 0.6, 0, alu()))], uw(3, -12)]]);
  add('cigueñal', [[[enCil(cil('x', 1.25, 1.25, 27, 0.5, 0, 0, brill(), 24), ...[-1.25, 1.25].flatMap(x => [caja(0.9, 4.6, 3.2, x, 1.0, 0, ac('#8d939a')), cil('x', 3.2, 3.2, 0.9, x, 0, 0, ac('#8d939a'), 24, false, 0, PI)]),
    cil('x', 0.9, 0.9, 2.6, 0, 2.25, 0, brill(), 20))], V(0, -4, -24)]]);
  add('carburador', [[[enCil(caja(3.2, 3.4, 3.4, -7.4, 16.2, 0, alu()), cil('y', 1.5, 1.5, 1.8, -7.4, 13.8, 0, alu(), 24), cil('x', 0.9, 0.9, 2.2, -4.9, 16.2, 0, alu(), 16), cil('z', 0.25, 0.25, 2.4, -7.4, 16.8, 2.4, ac(), 8))], uw(6, 2).add(V(-6, 0, 0))]]);
  add('silenciador', [[[enCil(cil('x', 0.9, 0.9, 2.6, 6.8, 15.6, 0, ac('#6f757c'), 16), caja(5.6, 6.4, 8.4, 10.6, 16.2, 0, mat('#3b3e43', { metalness: 0.5 })), ...[0, 1, 2, 3, 4].map(i => caja(5.8, 0.25, 8.6, 10.6, 13.6 + i * 1.3, 0, negro())))], V(12, 8, 0)]]);
  add('arrancador', [[[rev([[0.01, -16.6], [5.5, -16.6], [8.6, -16.0], [9.2, -14.6], [9.2, -13.4], [8.9, -13.4], [8.9, -14.5], [0.01, -14.5]], 'x', pint(), 48), cil('x', 2.2, 2.2, 0.8, -17.0, 0, 0, negro(), 24),
    tubo([V(-16.8, -2, 6.5), V(-17.6, -4, 8.5), V(-18.4, -5, 9.5)], 0.12, mat('#ddd'), 12), caja(1.4, 1.4, 4.4, -18.6, -5.2, 10.4, negro())], V(-12, 0, 0)]], true);

  // ================= encendido =================
  const xv = -11.2;
  add('volante', [[[cil('x', 8.6, 8.6, 1.4, xv, 0, 0, fund(), 48), cil('x', 2.2, 2.2, 2.6, xv + 0.4, 0, 0, ac(), 24),
    ...Array.from({ length: 14 }, (_, i) => { const a = i / 14 * PI * 2; return caja(1.4, 4.2, 0.35, xv - 1.3, 5.6 * Math.cos(a), 5.6 * Math.sin(a), fund()).rotateX(a); }),
    caja(1.5, 2.8, 1.0, xv, DB.y * 8.2, DB.z * 8.2, mat('#3a3d42', { metalness: 0.6 }))], V(-8, 0, 0)]]);   // imán en el borde, frente a la bobina en el PMS
  const pb = V(xv, DB.y * 9.95, DB.z * 9.95);
  add('bobina', [[[caja(2.4, 3.0, 1.6, pb.x, pb.y, pb.z, negro()), caja(1.6, 0.6, 1.0, pb.x, pb.y + 1.2, pb.z + 1.0, ac('#8d939a')), caja(1.6, 0.6, 1.0, pb.x, pb.y - 1.2, pb.z + 1.0, ac('#8d939a')),
    tubo([pb.clone().add(V(0.8, 1.2, -0.6)), V(-10, 4, -11.5), V(-7, 12, -10), V(-3, 18, -6.5), cilW(0, 16.2, -11.6)], 0.28, goma('#222'), 40),
    enCil(cil('z', 0.75, 0.75, 2.2, 0, 16.2, -11.6, goma('#222'), 16))], V(-4, 4, -8)]]);
  add('bujia', [[[enCil(cil('z', 0.55, 0.55, 1.6, 0, 16.2, -6.3, brill(), 16), cil('z', 0.8, 0.8, 1.0, 0, 16.2, -7.5, ac('#9aa0a7'), 6), cil('z', 0.45, 0.5, 2.2, 0, 16.2, -9.1, mat('#eeeae0'), 16), cil('z', 0.2, 0.2, 0.8, 0, 16.2, -10.6, brill(), 8))], uw(0, -9)]]);

  // ================= embrague centrífugo y acople (BV50A-H / Wacker SM-S) =================
  add('carcasa_embrague', [[[rev([[4.4, 9.4], [4.9, 9.4], [4.9, 14.6], [2.4, 15.4], [1.0, 15.4], [1.0, 15.0], [2.2, 14.9], [4.4, 14.3], [4.4, 9.4]], 'x', pint(), 48),
    ...[0, 1, 2, 3].map(i => cil('x', 0.35, 0.35, 0.6, 9.6, 5.3 * Math.cos(i * PI / 2 + 0.6), 5.3 * Math.sin(i * PI / 2 + 0.6), ac('#4a4f56'), 6))], V(0, 0, 22)]], true);
  const zapata = ph => rev([[2.75, 11.2], [3.35, 11.2], [3.35, 12.8], [2.75, 12.8], [2.75, 11.2]], 'x', mat('#6b5a4a', { roughness: 0.85 }), 24, 0, 0, 0, ph, PI - 0.5);
  add('zapatas', [[[zapata(0.25)], V(0, -4, 7)], [[zapata(PI + 0.25)], V(0, 4, 7)],
    [[cil('x', 1.5, 1.5, 1.6, 12, 0, 0, ac(), 24), ...[-1, 1].map(s => { const o = mesh(new THREE.TorusGeometry(2.2, 0.08, 6, 24, PI * 0.6), ac('#7d838b'), 11.2, 0, 0); o.rotation.y = PI / 2; o.rotation.x = s > 0 ? PI * 0.2 : PI * 1.2; return o; })], V(0, 0, 7)]]);
  add('campana', [[[rev([[3.45, 10.9], [3.9, 10.9], [3.9, 13.9], [0.9, 14.3], [0.6, 14.3], [0.6, 13.9], [3.45, 13.5], [3.45, 10.9]], 'x', ac('#7d838b'), 48),
    cil('x', 0.7, 0.7, 3.2, 15.9, 0, 0, brill(), 16), caja(0.5, 0.5, 2.2, 17.2, 0, 0, ac('#4a4f56'))], V(0, 0, 14)]]);
  add('acople', [[[rev([[0.8, 15.4], [1.9, 15.4], [1.9, 18.6], [0.8, 18.6], [0.8, 15.4]], 'x', ac('#9aa0a7'), 32), caja(0.8, 1.2, 0.8, 17, 2.3, 0, negro()), cil('y', 0.25, 0.25, 1.6, 17, 2.0, 0, brill(), 8)], V(4, 9, 0)]]);
  add('conexion_motor', [[[rev([[0.9, 18.6], [1.75, 18.6], [1.75, 20.2], [1.55, 21.5], [0.9, 21.5], [0.9, 18.6]], 'x', ac('#a3a9b0'), 32)], V(8, 9, 0)]]);

  // ================= eje flexible (acortado en el dibujo) =================
  add('funda', [[[tubo(MAN, 1.5, goma('#1d1e21'), 80)], O]], true);
  add('alma', [[[tubo([V(16.5, 0, 0), ...MAN, V(XH, YH - 2, 0)], 0.5, acero('#8d939a', { metalness: 0.8 }), 120)], V(0, 10, -8)]]);
  add('conexion_cabezal', [[[rev([[1.2, ys(0)], [Rh * 0.95, ys(0)], [Rh * 0.95, ys(-2)], [1.7, ys(-3.5)], [1.2, ys(-3.5)], [1.2, ys(0)]], 'y', ac('#a3a9b0'), 32, XH, 0, 0)], V(-6, 8, 0)]]);

  // ================= cabezal (Wacker H45: pos. 2-8) =================
  add('adaptador', [[[rev([[0.7, ys(7)], [Rh - 0.15, ys(7)], [Rh, ys(6.6)], [Rh, ys(0.4)], [Rh - 0.3, ys(0)], [0.7, ys(0)], [0.7, ys(7)]], 'y', ac('#9aa0a7'), 40, XH, 0, 0),
    ...[1.5, 2.1, 2.7].map(s => { const o = mesh(new THREE.TorusGeometry(Rh, 0.05, 6, 40), ac('#6f757c'), XH, ys(s), 0); o.rotation.x = PI / 2; return o; })], O]], true);
  add('adaptador_alma', [[[cil('y', 0.45, 0.45, 8.9, XH, ys(3.95), 0, brill(), 16), caja(0.9, 0.6, 0.9, XH, ys(8.1), 0, brill())], V(-24, 8, 0)]]);
  add('retenes', [[[anilloY(XH, ys(7.65), ys(7.15), Rh - 0.45, 0.65, goma('#2a2c30')), anilloY(XH, ys(8.25), ys(7.75), Rh - 0.45, 0.65, goma('#2a2c30'))], V(-21, 4, 0)]]);
  add('rod_sup', [[[rodamiento('y', Rh - 0.45, 0.6, 0.75, XH, ys(8.9), 0), rodamiento('y', Rh - 0.45, 0.6, 0.75, XH, ys(9.7), 0)], V(-16, 3, 0)]]);
  add('masa', [[[cil('y', 0.6, 0.6, Lh - 12.3, XH, ys((8.3 + Lh - 4) / 2), 0, brill(), 16), cil('y', Rh - 0.6, Rh - 0.6, Lh - 16.5, XH, ys((10.5 + Lh - 6) / 2), 0, ac('#7d838b'), 32, false, 0, PI)], V(-10, -4, 0)]]);
  add('rod_inf', [[[rodamiento('y', Rh - 0.45, 0.6, 0.75, XH, ys(Lh - 5.2), 0), rodamiento('y', Rh - 0.45, 0.6, 0.75, XH, ys(Lh - 4.4), 0)], V(-16, -9, 0)]]);
  add('carcasa', [[[rev([[Rh - 0.35, ys(6.6)], [Rh, ys(6.6)], [Rh, ys(Lh - 3)], [Rh - 0.35, ys(Lh - 3)], [Rh - 0.35, ys(6.6)]], 'y', ac('#b8bdc3'), 48, XH, 0, 0)], V(14, -4, 0)]], true);
  add('tapa', [[[rev([[0.01, ys(Lh)], [Rh * 0.55, ys(Lh - 0.15)], [Rh * 0.88, ys(Lh - 0.8)], [Rh, ys(Lh - 1.8)], [Rh, ys(Lh - 3)], [Rh - 0.8, ys(Lh - 3.6)], [0.01, ys(Lh - 3.6)]], 'y', ac('#6f757c'), 40, XH, 0, 0)], V(14, -10, 0)]]);

  return { parts, vivo: vivoGas(parts, { Rh, Lh }) };
}
