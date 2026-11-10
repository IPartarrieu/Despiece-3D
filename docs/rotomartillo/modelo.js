// Rotomartillo SDS-plus de 26 mm con plato oscilante, según Makita Technical Information HR2600/HR2601 (13 págs.).
// Unidades: cm. Eje de la broca = X (frente hacia +X), y hacia arriba, +z = lado derecho visto desde atrás.
// EXACTO (del documento): qué piezas hay y su número (Fig. 1), cómo se ordenan (Figs. 1, 10, 15, 17, 18, 22, 24, 26, 27),
// el sentido en que salen y las medidas externas 361 x 77 x 209 mm. APROXIMADO: medidas internas (deducidas de las
// figuras y de las designaciones: rodamientos 6000, 608, 606, 627, 6806; perno ø 9/9,5 mm; arandelas 30), formas finas y colores.
// Las direcciones de explosión llevan cada pieza por donde sale en el desarme y la dejan en tres filas como la Fig. 1.
import * as THREE from 'three';
import { PI, V, mat, acero, goma, mesh, cil, caja, rev, tornillo, rodamiento, laminas, alambre, lienzo } from '../lib.js';

const CAT = await (await fetch(new URL('data.json', import.meta.url))).json();
const YS = -2.45, YM = -3.75; // ejes: intermedio (engranaje 10 + plato oscilante) e inducido, bajo el eje de la broca

const tuboX = (x0, x1, ro, ri, m, y = 0, z = 0, seg = 40) => rev([[ri, x0], [ro, x0], [ro, x1], [ri, x1], [ri, x0]], 'x', m, seg, 0, y, z);
const aroX = (x, r, t, m, y = 0, z = 0) => mesh(new THREE.TorusGeometry(r, t, 8, 40), m, x, y, z).rotateY(PI / 2);
const bola = (r, x, y, z, m) => mesh(new THREE.SphereGeometry(r, 16, 12), m, x, y, z);
function resorteX(x0, x1, r, vueltas, rw, m, y = 0, z = 0) {
  const pts = [], N = vueltas * 16;
  for (let i = 0; i <= N; i++) { const t = i / N, a = t * vueltas * PI * 2; pts.push(V(x0 + (x1 - x0) * t, y + r * Math.cos(a), z + r * Math.sin(a))); }
  return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N * 2, rw, 6), m);
}
function resorteEje(p0, p1, r, vueltas, rw, m) { // resorte entre dos puntos cualesquiera
  const d = p1.clone().sub(p0), L = d.length(), o = resorteX(0, L, r, vueltas, rw, m);
  o.quaternion.setFromUnitVectors(V(1, 0, 0), d.normalize()); o.position.copy(p0); return o;
}
function engranajeX(n, r, x0, x1, y, z, m) { // engranaje recto con eje X
  const s = new THREE.Shape(), p = PI * 2 / n;
  for (let i = 0; i < n; i++) for (const [da, rad] of [[0, r - 0.12], [0.2, r], [0.5, r], [0.7, r - 0.12]]) { const a = (i + da) * p, px = rad * Math.cos(a), py = rad * Math.sin(a); (i || da) ? s.lineTo(px, py) : s.moveTo(px, py); }
  const g = new THREE.ExtrudeGeometry(s, { depth: x1 - x0, bevelEnabled: false }); g.rotateY(PI / 2);
  return mesh(g, m, x0, y, z);
}
const perfil = (pts, z0, z1, m, b = 0.5, bs = 0.3) => { // perfil lateral (XY) extruido en z; b redondea los costados, bs agranda el contorno
  const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth: z1 - z0 - 2 * b, bevelEnabled: true, bevelSize: Math.min(b, bs), bevelThickness: b, bevelSegments: 5, curveSegments: 16 });
  g.translate(0, 0, z0 + b); return mesh(g, m);
};
const placaYZ = (y0, y1, z0, z1, x0, x1, m, huecos = []) => { // placa transversal (plano YZ) con agujeros [y, z, r]
  const s = new THREE.Shape(); s.moveTo(z0, y0); s.lineTo(z1, y0); s.lineTo(z1, y1); s.lineTo(z0, y1); s.closePath();
  huecos.forEach(([y, z, r]) => s.holes.push(new THREE.Path().absarc(z, y, r, 0, PI * 2, true)));
  const g = new THREE.ExtrudeGeometry(s, { depth: x1 - x0, bevelEnabled: false, curveSegments: 24 }); g.rotateY(PI / 2); // (z, y, prof) -> (prof, y, -z)
  return mesh(g, m, x0, 0, 0);
};

export function construir(cfg) {
  const m = cfg.m || {}, E = cfg.estilo || {}, mod = m.modelo || 'HR2600';
  const avt = !!m.avt, tres = m.modos === 3;
  const k = m.largo ? m.largo / 361 : 1; // ponytail: el HR2470 se escala parejo por su largo (370 mm); sin datos internos propios
  const cuerpo = () => mat(E.color || '#1595a0', { metalness: 0.05, roughness: 0.5 });
  const frente = () => mat(E.frente || E.color || '#1595a0', { metalness: 0.05, roughness: 0.5 });
  const negro = () => mat(E.negro || '#1d1f22', { metalness: 0.05, roughness: 0.75 });
  const acento = () => mat(E.acento || E.negro || '#1d1f22', { metalness: 0.05, roughness: 0.6 });
  const ac = (c = '#b4b9c0') => acero(c), brill = () => acero('#cfd3d8', { metalness: 0.85, roughness: 0.28 });
  const alu = () => mat('#a9aeb5', { metalness: 0.65, roughness: 0.45 });
  const tor = () => goma('#121315'), blanco = () => mat('#e9e7df', { metalness: 0, roughness: 0.6 });
  const parts = {};
  const add = (id, items, shell = false) => {
    const c = CAT.catalogoPorModelo?.[mod]?.[id] || CAT.catalogo[id];
    const its = items.map(([objs, dir]) => {
      const g = new THREE.Group(); [].concat(objs).forEach(o => g.add(o)); g.scale.setScalar(k);
      return { obj: g, dir: dir.clone().multiplyScalar(k) };
    });
    const mats = []; its.forEach(i => i.obj.traverse(o => { if (o.material) { o.userData.pid = id; mats.push(o.material); } }));
    parts[id] = { id, nombre: c[1] ? `${c[0]} (${c[1]})` : c[0], ref: c[1], grupo: c[2], items: its, mats, shell };
  };
  // filas de la explosión como en la Fig. 1: arriba carcasa de engranajes, al centro portaherramienta y limitador,
  // abajo pistón, carcasa interior e inducido, y más abajo la sección del plato oscilante
  const R3 = -12, R4 = -19;

  // ================= portabrocas (sale por delante, [3]-1) =================
  add('mango_lateral', [[[
    tuboX(9.6, 11.2, 2.85, 2.5, negro()), caja(1.2, 1.6, 1.6, 10.4, -3.3, 0, negro()),
    cil('y', 1.25, 1.45, 10.5, 10.9, -9.4, 0, negro(), 24), cil('y', 1.7, 1.7, 0.6, 10.9, -4.3, 0, negro(), 24),
    ...[-6.5, -8.5, -10.5, -12.5].map(y => mesh(new THREE.TorusGeometry(1.42, 0.07, 6, 30), mat('#3a3d42'), 10.9, y, 0).rotateX(PI / 2)),
  ], V(14, -7, 0)]]);
  add('tapa35', [[[rev([[0.55, 16.0], [2.0, 16.0], [2.05, 16.6], [1.75, 17.3], [1.2, 17.5], [0.55, 17.5], [0.55, 16.0]], 'x', goma('#202124'), 40)], V(26, 0, 0)]]);
  add('resorte14', [[[aroX(15.9, 1.25, 0.07, goma('#2b2d31')), aroX(15.75, 1.3, 0.05, ac('#9aa0a7'))], V(23, 0, 0)]]);
  add('resorte15', [[[aroX(15.6, 1.3, 0.07, brill())], V(21, 0, 0)]]);
  add('arandela17', [[[tuboX(15.3, 15.42, 1.75, 1.18, ac()), tuboX(15.12, 15.3, 1.75, 1.18, goma('#2a2c30'))], V(19, 0, 0)]]);
  add('cubierta', [[[
    rev([[1.9, 12.4], [2.45, 12.4], [2.55, 12.8], [2.55, 15.0], [2.2, 15.7], [1.8, 15.7], [1.8, 12.4], [1.9, 12.4]], 'x', negro(), 48),
    ...Array.from({ length: 10 }, (_, i) => { const a = i / 10 * PI * 2; return caja(1.8, 0.18, 0.35, 13.9, 2.57 * Math.cos(a), 2.57 * Math.sin(a), mat('#2c2e32')).rotateX(-a); }),
  ], V(16, 0, 0)]], true);
  add('bolas7', [[bola(0.35, 14.2, 0, 1.0, brill()), V(11, 0, 3)], [bola(0.35, 14.2, 0, -1.0, brill()), V(11, 0, -3)]]);
  add('anillo21', [[[tuboX(14.6, 14.85, 1.7, 1.2, ac()), tuboX(13.4, 13.5, 1.75, 1.2, ac('#9aa0a7')),
    rev([[1.25, 12.6], [1.75, 12.6], [1.3, 13.4], [1.2, 13.4]], 'x', ac('#8d939a'), 24)], V(8, 0, 0)]]);

  // ================= portaherramienta y limitador de torque ([3]-5, Fig. 15) =================
  add('portaherramienta', [[[
    rev([[1.15, 2.15], [1.55, 2.15], [1.55, 6.45], [1.3, 6.6], [1.3, 12.2], [1.18, 12.4], [1.18, 16.0], [0.52, 16.0], [0.52, 11.2], [0.62, 10.9], [0.62, 7.0], [1.15, 6.8], [1.15, 2.15]], 'x', ac('#c3c7cc'), 48),
    ...[-1, 1].map(s => caja(0.5, 0.06, 0.3, 7.05, 0, s * 1.29, mat('#2a2c30'))), // agujeros de acceso al resorte 28
    ...[-1, 1].map(s => caja(1.4, 0.3, 0.06, 14.2, 0, s * 1.18, mat('#2a2c30'))), // ranuras de las bolas 7,0
  ], V(2, 0, 0)]]);
  add('bolas4', [0, 1, 2, 3].map(i => { const a = i * PI / 2 + PI / 4, c = Math.cos(a), s = Math.sin(a); return [bola(0.2, 5.2, 1.5 * c, 1.5 * s, brill()), V(-4, 2.5 * c, 2.5 * s)]; }));
  add('brida', [[[tuboX(4.95, 5.45, 1.95, 1.56, ac('#a9aeb5')), ...[0, 1, 2, 3, 4, 5].map(i => caja(0.12, 0.3, 0.3, 4.9, 1.78 * Math.cos(i * PI / 3), 1.78 * Math.sin(i * PI / 3), ac('#a9aeb5')))], V(-5, 0, 0)]]);
  add('engranaje51', [[[engranajeX(51, 2.0, 4.15, 4.9, 0, 0, ac('#b0b6bd')), tuboX(4.14, 4.91, 1.7, 1.56, ac('#9aa0a7'))], V(-6.5, 0, 0)]]);
  add('pines6', [[[0, 1, 2, 3, 4, 5].map(i => cil('x', 0.15, 0.15, 0.6, 4.25, 1.78 * Math.cos(i * PI / 3 + 0.5), 1.78 * Math.sin(i * PI / 3 + 0.5), brill(), 10)), V(-7.5, 0, 0)]]);
  add('arandela32', [[[tuboX(3.95, 4.1, 1.95, 1.56, ac())], V(-8.5, 0, 0)]]);
  add('resorte31', [[[resorteX(2.75, 3.9, 1.72, 3, 0.1, ac('#7d838b'))], V(-10, 0, 0)]]);
  add('spiro', [[[tuboX(2.58, 2.66, 1.9, 1.56, ac()), aroX(2.42, 1.6, 0.06, ac('#6f757c'))], V(-12, 0, 0)]]);
  add('arandela36', [[[tuboX(1.98, 2.1, 1.95, 1.2, ac())], V(-14, 0, 0)]]);

  // ================= percusión: perno de impacto (Figs. 17-18), martillo y cilindro pistón =================
  add('manguito9', [[[tuboX(10.4, 11.1, 0.62, 0.47, ac('#9aa0a7'))], V(-5, 6, 0)]]);
  add('perno', [[[rev([[0.01, 7.4], [0.45, 7.4], [0.47, 8.2], [0.47, 9.1], [0.6, 9.2], [0.6, 9.7], [0.45, 9.8], [0.45, 10.9], [0.01, 10.9]], 'x', brill(), 28)], V(-7.5, 6, 0)]]);
  add('cojin', [[avt
    ? [tuboX(8.75, 8.9, 0.62, 0.48, ac()), resorteX(7.9, 8.75, 0.55, 3, 0.05, ac('#7d838b'))]
    : [tuboX(8.7, 8.9, 0.62, 0.48, ac()), tuboX(7.95, 8.7, 0.62, 0.48, goma('#2a2c30'))], V(-10, 6, 0)]]);
  add('caja_oring', [[[tuboX(7.15, 7.9, 0.62, 0.35, ac('#a3a9b0'))], V(-12.5, 6, 0)]]);
  add('oring9', [[[aroX(7.5, 0.42, 0.06, tor())], V(-14, 6, 0)]]);
  add('resorte28', [[[aroX(7.05, 0.66, 0.05, ac('#6f757c'))], V(-15.5, 6, 0)]]);
  add('piston', [[[
    rev([[0.92, 5.8], [1.12, 5.8], [1.12, -0.6], [0.01, -0.6], [0.01, 0.95], [0.92, 0.95], [0.92, 5.8]], 'x', ac('#bfc4ca'), 40),
    caja(0.6, 0.06, 0.4, 2.0, 1.12, 0, mat('#2a2c30')), // agujero de alivio de aire
  ], V(0, R3, 0)]]);
  add('martillo', [[[rev([[0.01, 3.5], [0.85, 3.5], [0.9, 3.8], [0.9, 4.9], [0.6, 5.1], [0.6, 5.5], [0.01, 5.5]], 'x', brill(), 28)], V(6, R3, 0)]]);
  add('oring175', [[[aroX(4.2, 0.88, 0.06, tor())], V(4.5, R3, 0)]]);
  add('junta_piston', [[[cil('z', 0.32, 0.32, 1.6, 0.3, -0.75, 0, ac('#9aa0a7'), 16)], V(0, R3 - 3, 0)]]);
  add('placa_guia', [[[caja(0.14, 2.0, 2.0, -0.7, 0, 0, ac('#8d939a'))], V(-1.5, R3, 0)]]);
  add('resorte14c', [[[resorteX(-1.9, -0.8, 0.55, 4, 0.06, ac('#7d838b')), tuboX(-2.0, -1.92, 0.7, 0.3, ac())], V(-3, R3, 0)]]);
  if (avt) {
    add('contrapeso', [[[caja(4.4, 0.9, 2.6, 0.6, 2.45, 0, acero('#7c8188')), caja(4.8, 0.12, 3.0, 0.6, 3.05, 0, ac()), caja(0.4, 1.4, 2.2, -1.75, 2.1, 0, mat('#3a3d42')), cil('z', 0.15, 0.15, 3.0, -1.75, 2.6, 0, brill(), 10)], V(-9, -5, 0)]]);
    add('pernos_m412', [[[-1, 1].map(s => tornillo('y', -1.0, 3.12, s * 1.2, 0.18)), V(-9, 4, 0)]]);
  }

  // ================= plato oscilante sobre el eje intermedio (Fig. 24) =================
  add('engranaje10', [[[
    cil('x', 0.28, 0.28, 9.2, 3.2, YS, 0, ac('#c3c7cc'), 16), engranajeX(10, 0.45, 4.15, 4.9, YS, 0, ac('#b0b6bd')),
    ...[0, 1, 2, 3, 4, 5].map(i => caja(1.6, 0.05, 0.05, 1.5, YS + 0.3 * Math.cos(i * PI / 3), 0.3 * Math.sin(i * PI / 3), ac('#9aa0a7'))), // estrías
  ], V(6, R4, 0)]]);
  add('leva', [[[tuboX(1.15, 1.9, 0.75, 0.3, ac('#a3a9b0'), YS), ...[0, 1, 2, 3].map(i => caja(0.2, 0.25, 0.25, 1.08, YS + 0.55 * Math.cos(i * PI / 2), 0.55 * Math.sin(i * PI / 2), ac('#a3a9b0'))),
    aroX(1.6, 0.76, 0.05, mat('#2a2c30'), YS)], V(2.8, R4, 0)]]);
  const osc = new THREE.Group();
  osc.add(tuboX(-0.35, 0.35, 1.0, 0.75, ac('#b9bec4')), tuboX(-0.3, 0.3, 0.7, 0.3, ac('#d0d3d8')));
  osc.add(cil('y', 0.17, 0.17, 2.0, 0, 1.9, 0, brill(), 12)); // poste hacia la unión del pistón
  osc.position.set(0.55, YS, 0); osc.rotation.z = 0.32;
  add('oscilante', [[[osc], V(0.6, R4, 0)]]);
  add('caja_rod', [[[tuboX(0.02, 0.1, 0.6, 0.28, ac(), YS), tuboX(-0.85, -0.05, 1.15, 0.28, mat('#5a5f66', { metalness: 0.5 }), YS),
    caja(0.3, 0.6, 3.6, -0.5, YS, 0, mat('#5a5f66', { metalness: 0.5 })), rodamiento('x', 1.1, 0.4, 0.6, -0.45, YS, 0)], V(-1.5, R4, 0)]]);
  add('reten', [[[caja(0.15, 1.6, 2.4, -0.98, YS - 0.1, 0, ac('#8d939a'))], V(-3.5, R4, 0)]]);
  add('helicoidal', [[[engranajeX(26, 1.04, -1.85, -1.1, YS, 0, ac('#b0b6bd')), cil('x', 0.45, 0.45, 0.85, -1.47, YS, 0, ac('#9aa0a7'), 16)], V(-5.5, R4, 0)]]);
  add('pernos_m4', [[[-1, 1].map(s => { const t = tornillo('x', 0.15, YS, s * 1.55, 0.18); return t; }), V(2, R4 + 4, 0)]]);
  add('rod606', [[[rodamiento('x', 0.85, 0.3, 0.6, 7.6, YS, 0)], V(10, 10, 0)]]);

  // ================= carcasas y selector de modo =================
  const cuello = rev([[1.6, 6.8], [2.75, 6.8], [2.55, 8.2], [2.5, 12.3], [2.15, 12.5], [1.6, 12.5], [1.6, 6.8]], 'x', frente(), 48);
  const tapaCuello = tuboX(9.6, 11.3, 2.62, 2.48, mat('#2c2e32')); // collar de la empuñadura lateral
  add('carcasa_eng', [[[
    perfil([[-2.6, -6.3], [3.8, -6.3], [6.6, -3.4], [7.4, -2.5], [7.4, 2.4], [5.5, 3.3], [-2.6, 3.3]], -3.75, 3.75, frente(), 1.5),
    cuello, tapaCuello, aroX(12.2, 1.55, 0.1, tor()), // retén 25 en el cuello
  ], V(10, 10, 0)]], true);
  add('rod6806', [[[rodamiento('x', 2.1, 1.55, 0.7, 6.05, 0, 0), tuboX(6.45, 7.9, 2.35, 2.15, ac('#9aa0a7'))], V(6, 10, 0)]]);
  // selector: 2 modos = palanca B bajo la carcasa (Fig. 1, eje vertical); 3 modos = perilla al costado (manual HR2470, Figs. 6-8)
  const sel = { p: (d) => (tres ? V(1.8, YS, d) : V(1.8, -d, 0)) };
  const sv = (d) => (tres ? V(0, 0, d) : V(0, -d, 0));
  const cilSel = (r1, r2, h, d, m) => { const p = sel.p(d); return tres ? cil('z', r2, r1, h, p.x, p.y, p.z, m, 24) : cil('y', r1, r2, h, p.x, p.y, p.z, m, 24); }; // punta hacia la leva B
  add('empujador', [[[cilSel(0.12, 0.32, 1.8, tres ? 2.0 : 4.6, ac('#c3c7cc'))], sv(5)]]);
  add('resorte5', [[[resorteEje(sel.p(tres ? 2.9 : 5.5), sel.p(tres ? 3.5 : 6.1), 0.25, 4, 0.04, ac('#7d838b'))], sv(6.5)]]);
  add('oring21', [[[(() => { const p = sel.p(tres ? 3.65 : 6.3), o = mesh(new THREE.TorusGeometry(0.9, 0.07, 8, 30), tor(), p.x, p.y, p.z); if (!tres) o.rotation.x = PI / 2; return o; })()], sv(8)]]);
  add('palanca', [[[cilSel(1.0, 1.0, 0.55, tres ? 3.95 : 6.55, negro()), (() => { const p = sel.p(tres ? 4.3 : 6.9); return tres ? caja(2.4, 0.5, 0.45, p.x, p.y, p.z, mat('#3a3d42')) : caja(2.4, 0.45, 0.5, p.x, p.y, p.z, mat('#3a3d42')); })()], sv(10)]]);
  add('tapa_palanca', [[[(() => { const p = sel.p(tres ? 3.85 : 6.65); const r = rev([[1.05, -0.12], [1.45, -0.12], [1.45, 0.12], [1.05, 0.12]], 'y', negro(), 32, p.x, p.y, p.z); if (tres) r.rotation.x = PI / 2; return r; })()], sv(12)]]);
  add('carcasa_int', [[[
    placaYZ(-6.4, 3.2, -3.4, 3.4, -2.6, -2.0, alu(), [[YM, 0, 1.3], [0, 0, 0.8]]),
    rev([[3.05, -2.0], [3.2, -2.0], [3.2, 2.6], [3.05, 2.6], [3.05, -2.0]], 'x', alu(), 40, 0, -1.6, 0, PI * 0.15, PI * 1.7),
    tuboX(-2.0, -1.4, 0.9, 0.3, alu()), // saliente del resorte 14
  ], V(-9, R3, 0)]], true);
  add('oring68', [[[(() => { const o = mesh(new THREE.TorusGeometry(3.45, 0.09, 8, 48), tor(), -2.3, -1.6, 0); o.rotation.y = PI / 2; o.scale.set(1, 1.4, 1); return o; })()], V(-11, R3, 0)]]);
  add('oring26', [[[aroX(-2.3, 1.32, 0.06, tor(), YM)], V(-12, R3, 0)]]);
  add('reten12', [[[tuboX(-2.0, -1.75, 0.65, 0.32, goma('#2a2c30'), YM), tuboX(-2.5, -2.0, 0.42, 0.3, ac(), YM)], V(-12.8, R3, 0)]]);

  // ================= motor =================
  add('rod6000', [[[rodamiento('x', 1.3, 0.5, 0.8, -2.3, YM, 0)], V(-13.8, R3, 0)]]);
  const nucleo = new THREE.MeshStandardMaterial({ map: laminas(), metalness: 0.6, roughness: 0.4 });
  const cobreB = () => new THREE.MeshStandardMaterial({ map: alambre(), metalness: 0.7, roughness: 0.35 });
  add('inducido', [[[
    cil('x', 0.3, 0.3, 14.6, -8.6, YM, 0, ac('#c9cdd2'), 16), engranajeX(6, 0.26, -2.0, -1.1, YM, 0, ac('#c9cdd2')),
    cil('x', 2.15, 2.15, 5.6, -7.3, YM, 0, nucleo), cil('x', 1.95, 1.95, 0.8, -10.5, YM, 0, cobreB()), cil('x', 1.95, 1.95, 0.8, -4.1, YM, 0, cobreB()),
    cil('x', 1.0, 1.0, 1.8, -12.0, YM, 0, mat('#c07a3e', { metalness: 0.9, roughness: 0.3 })),
    cil('x', 2.5, 2.5, 0.12, -3.0, YM, 0, blanco()), ...Array.from({ length: 14 }, (_, i) => { const a = i / 14 * PI * 2; return caja(0.7, 0.9, 0.08, -3.4, YM + 1.85 * Math.cos(a), 1.85 * Math.sin(a), blanco()).rotateX(-a); }),
  ], V(-16, R3, 0)]]);
  add('rod627', [[[rodamiento('x', 1.1, 0.35, 0.7, -14.1, YM, 0), tuboX(-14.55, -14.45, 1.1, 0.4, mat('#2a2c30'), YM)], V(-19, R3, 0)]]);
  add('estator', [[[tuboX(-10.6, -4.0, 3.1, 2.25, nucleo, YM), tuboX(-11.2, -10.6, 2.9, 2.3, cobreB(), YM), tuboX(-4.0, -3.4, 2.9, 2.3, cobreB(), YM)], V(-26, 0, 0)]]);
  add('portaesc', [[[tuboX(-12.7, -12.3, 2.6, 1.3, mat('#2b2d31'), YM), caja(1.0, 1.3, 1.1, -12.0, YM + 1.85, 0, mat('#3a3d42')), caja(1.0, 1.3, 1.1, -12.0, YM - 1.85, 0, mat('#3a3d42')),
    aroX(-11.4, 0.45, 0.04, ac('#8d939a'), YM + 2.3), aroX(-11.4, 0.45, 0.04, ac('#8d939a'), YM - 2.3)], V(-26, 0, 0)]]);
  add('escobillas', [[caja(0.6, 0.9, 0.6, -12.0, YM + 1.35, 0, mat('#2b2b2b', { roughness: 0.9 })), V(-26, 1.5, 0)], [caja(0.6, 0.9, 0.6, -12.0, YM - 1.35, 0, mat('#2b2b2b', { roughness: 0.9 })), V(-26, -1.5, 0)]]);
  add('arandela_ond', [[[aroX(-14.75, 0.95, 0.05, ac('#8d939a'), YM)], V(-24, 0, 0)]]);
  const logo = lienzo(512, 128, (g, w, h) => { g.fillStyle = '#ffffff'; g.font = `bold ${E.fuente || 'italic 92px'} sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(E.logo || cfg.etiqueta || '', w / 2, h / 2 + 4); });
  const logoMesh = (z) => { const o = mesh(new THREE.PlaneGeometry(4.6, 1.15), mat('#fff', { map: logo, transparent: true, alphaTest: 0.3, metalness: 0, roughness: 0.6 }), -8.6, 1.4, z); if (z < 0) o.rotation.y = PI; return o; };
  add('carcasa_motor', [[[
    perfil([[-2.6, 3.3], [-15.6, 3.3], [-15.6, -6.8], [-3.4, -6.8], [-2.6, -6.1]], -3.8, 3.8, cuerpo(), 1.5),
    perfil([[-15.7, -6.0], [-12.0, -6.5], [-12.1, -7.3], [-12.9, -15.9], [-12.5, -17.3], [-18.5, -17.3], [-18.3, -16.0], [-17.7, -6.0]], -2.05, 2.05, cuerpo(), 0.6),
    perfil([[-13.1, -10.0], [-12.75, -15.6], [-12.9, -16.6], [-18.2, -16.6], [-18.0, -10.0]], -2.15, 2.15, negro(), 0.4), // agarre de goma
    ...[-1, 1].flatMap(s => [0, 1, 2, 3, 4].map(i => caja(0.35, 1.6, 0.1, -14.4 + i * 0.7, 1.5, s * 3.81, mat('#0f1012')))), // ventilación
    logoMesh(3.82), logoMesh(-3.82),
  ], V(-26, 0, 0)]], true);
  add('tornillos30', [[[-1, 1].flatMap(s => [3.0, -6.5].map(y => { const g = new THREE.Group(); g.add(cil('x', 0.12, 0.12, 3.0, -4.1, y, s * 3.2, ac('#9aa0a7'), 10), cil('x', 0.24, 0.24, 0.18, -5.6, y, s * 3.2, ac('#4a4f56'), 14)); return g; })), V(-21, 0, 0)]]);
  add('tapa_mango', [[[perfil([[-15.6, 3.3], [-17.3, 3.1], [-18.0, 2.0], [-18.0, -6.0], [-15.6, -6.0]], -3.5, 3.5, E.acento ? acento() : cuerpo(), 0.7),
    perfil([[-17.7, -6.0], [-18.3, -16.0], [-18.6, -17.0], [-18.45, -6.0]], -1.6, 1.6, E.acento ? acento() : cuerpo(), 0.3)], V(-31, 0, 0)]], true);
  add('tornillos18', [[[[2.6, 0], [-2.4, 0], [-5.4, 0]].map(([y, z]) => tornillo('x', -18.32, y, z, 0.18)).map(t => { t.rotation.z = PI / 2; return t; }), V(-34, 0, 0)]]);
  add('interruptor', [[[caja(2.0, 2.4, 2.0, -13.9, -8.6, 0, mat('#3a3d42')),
    perfil([[-12.6, -7.3], [-11.7, -7.5], [-11.6, -9.6], [-12.4, -10.0]], -0.7, 0.7, negro(), 0.15),
    caja(0.3, 0.5, 1.0, -12.2, -6.75, 2.2, negro()), caja(0.3, 0.5, 1.0, -12.2, -6.75, -2.2, negro())], V(-26, -4, 0)]]);
  const cord = new THREE.CatmullRomCurve3([V(-17.3, -16.5, 0), V(-18.0, -18.0, 0), V(-19.6, -20.0, 0), V(-23.0, -21.5, 0)]);
  add('cable', [[[mesh(new THREE.TubeGeometry(cord, 40, 0.4, 10), goma('#18191c')), rev([[0.45, -19.6], [0.7, -18.6], [0.85, -17.6], [0.95, -17.0]], 'y', goma('#1a1b1e'), 20, -17.3, 0, 0).rotateZ(0.35)], V(-26, -2, 0)]]);
  return { k, parts };
}
