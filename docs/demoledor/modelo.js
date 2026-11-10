// Demoledor DeWalt D25900K (10 kg) y D25940K (12 kg), según los procedimientos de servicio ESSG
// "Full Strip down and Re-assembly" (63 y 59 páginas). Unidades: cm. Eje del cincel = X (frente hacia +X), y hacia arriba,
// lado del logo hacia +z.
// EXACTO (del documento): qué piezas hay, cómo se ordenan (foto de corte de la pág. 1 y fotos del desarme) y el sentido y orden
// en que salen. APROXIMADO: las medidas. El documento no trae medidas externas: la escala sale de la foto de la pág. 1 y de las
// juntas tóricas que sí tienen medida (brida 58 x 2 mm, husillo 38 x 2,5 mm, buje 43 x 5,5 mm); el D25940K se escala por peso.
import * as THREE from 'three';
import { PI, V, mat, acero, cobre, goma, mesh, cil, caja, rev, tornillo, laminas, alambre, lienzo, rr } from '../lib.js';

const XM = -4.4, XC = 3.7, XG = -0.75; // ejes verticales: inducido, cigüeñal, engranaje doble

// números de pieza de cada modelo [D25900K, D25940K] (el D25940K renumera el portaherramienta y la antivibración)
const REF = {"mango_lateral":["59","59"],"tornillos_porta":["102 ×6","102 ×9"],"brida":["103","97"],"manga_giratoria":["98, 99, 100, 101","99, 100"],"bloqueo":["93, 94, 95, 96, 97","101, 102, 103, 106"],"amortiguador_th":["90, 92","105, 108"],"manguito":["91","107"],"anillo_elastico":["88, 89","109, 110"],"sello_frontal":["87","111"],"husillo":["107","94"],"sellos_th":["74, 104, 108, 109","77, 92, 93, 95, 96"],"rodamiento_golpeo":["110","90"],"buje_golpeo":["68, 69, 70","68, 69, 70"],"pieza_golpeo":["67","67"],"buje72":["71, 72","71, 72"],"cubierta":["66","66"],"tornillos65":["65 ×4","65 ×4"],"carcasa_delantera":["78","78/80"],"junta79":["79","79"],"antivibracion":["80, 81, 82, 83, 86","80/84, 81, 82, 83"],"cilindro":["75","75"],"martillo":["76","76"],"juntas_cil":["73, 74, 77","71, 74, 77"],"tapa_mango":["19","19"],"mango":[null,null],"interruptor":["15, 18, 22, 24","15, 18, 22, 24"],"gatillo":["12, 13, 14, 17","12, 13, 14, 17"],"cable":["23, 25, 29","23, 25, 29"],"tapa_motor":["57","57"],"electronica":["54","54"],"ventilador":["10, 11","10, 11"],"portaescobillas":["3, 58","3, 58"],"escobillas":["8","8"],"rodamiento5":["4, 5","4, 5"],"estator":["2, 33","2, 33"],"inducido":["1, 16","1, 16"],"tapa_sa":["52, 53","52, 53"],"piston":["47, 48, 49, 51","47, 48, 49, 51"],"biela":["38","38"],"cigueñal":["45, 46","45, 46"],"tapa_engranajes":["30, 32","30, 32"],"tapa21":["21","21"],"engranaje_cig":["43","43"],"engranaje_doble":["37, 39, 40, 41, 42","37, 39, 40, 41, 42"],"rodamiento_inducido":["34, 35, 36","34, 35, 36"],"carcasa_principal":["44","44"]};

function engranaje(n, r, h, y0, x, z, m) { // engranaje recto con eje Y
  const s = new THREE.Shape(), p = PI * 2 / n, pt = (a, rad) => [rad * Math.cos(a), rad * Math.sin(a)];
  for (let i = 0; i < n; i++) for (const [da, rad] of [[0, r - 0.25], [0.2, r], [0.5, r], [0.7, r - 0.25]]) { const [px, py] = pt((i + da) * p, rad); (i === 0 && da === 0) ? s.moveTo(px, py) : s.lineTo(px, py); }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false }); g.rotateX(-PI / 2); g.translate(0, y0, 0);
  return mesh(g, m, x, 0, z);
}
const tuboX = (x0, x1, ro, ri, m, seg = 40) => rev([[ri, x0], [ro, x0], [ro, x1], [ri, x1], [ri, x0]], 'x', m, seg);
const tuboY = (y0, y1, ro, ri, m, x, z, seg = 40) => rev([[ri, y0], [ro, y0], [ro, y1], [ri, y1], [ri, y0]], 'y', m, seg, x, 0, z);
const aroX = (x, r, t, m) => mesh(new THREE.TorusGeometry(r, t, 8, 40), m, x, 0, 0).rotateY(PI / 2);
const aroY = (x, y, z, r, t, m) => mesh(new THREE.TorusGeometry(r, t, 8, 40), m, x, y, z).rotateX(PI / 2);
function resorteX(x0, x1, r, vueltas, rw, m) { // resorte helicoidal con eje X
  const pts = [], N = vueltas * 16;
  for (let i = 0; i <= N; i++) { const t = i / N, a = t * vueltas * PI * 2; pts.push(V(x0 + (x1 - x0) * t, r * Math.cos(a), r * Math.sin(a))); }
  return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N * 2, rw, 6), m);
}
const perfil = (pts, prof, z0, m, bisel = 0.5) => { // perfil lateral (plano XY) extruido en z, con canto redondeado
  const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth: prof - 2 * bisel, bevelEnabled: true, bevelSize: bisel, bevelThickness: bisel, bevelSegments: 4, curveSegments: 16 });
  g.translate(0, 0, z0 + bisel); return mesh(g, m);
};
const planta = (x0, x1, z0, z1, r, y0, h, m) => { // rectángulo redondeado en planta (XZ) con alto h desde y0
  const g = new THREE.ExtrudeGeometry(rr(x0, z0, x1, z1, r), { depth: h, bevelEnabled: false, curveSegments: 10 }); g.rotateX(PI / 2); g.translate(0, y0 + h, 0);
  return mesh(g, m);
};

export function construir(cfg) {
  const m = cfg.m || {}, E = cfg.estilo || {};
  const d40 = m.modelo === 'D25940K', iR = d40 ? 1 : 0;
  const k = d40 ? Math.cbrt(12 / 10) : 1; // ponytail: el 12 kg se escala parejo por peso (≈ +6 %); el documento no da sus medidas
  const amarillo = () => mat(E.color || '#f2b200', { metalness: 0.05, roughness: 0.45 });
  const negro = () => mat(E.negro || '#1c1d20', { metalness: 0.1, roughness: 0.7 });
  const fundicion = () => mat(E.carter || '#b7bbc0', { metalness: 0.7, roughness: 0.42 });
  const blanco = () => mat('#ecebe4', { metalness: 0, roughness: 0.6 });
  const laton = () => acero('#c9a24a', { metalness: 0.85, roughness: 0.32 });
  const ac = () => acero('#b4b9c0');
  const tor = () => goma('#121315');
  const parts = {};
  const add = (id, base, grupo, items, shell = false) => {
    const its = items.map(([objs, dir]) => {
      const g = new THREE.Group(); [].concat(objs).forEach(o => g.add(o)); g.scale.setScalar(k);
      return { obj: g, dir: dir.clone().multiplyScalar(k) };
    });
    const mats = [];
    its.forEach(i => i.obj.traverse(o => { if (o.material) { o.userData.pid = id; mats.push(o.material); } }));
    const ref = REF[id]?.[iR] ?? null;
    parts[id] = { id, nombre: ref ? `${base} (${ref})` : base, ref, grupo, items: its, mats, shell };
  };
  const G1 = 'Portaherramienta', G2 = 'Percusión y antivibración', G3 = 'Cárter y transmisión', G4 = 'Motor', G5 = 'Mango e interruptor';

  // ================= portaherramienta (sale entero hacia +X al soltar sus tornillos) =================
  add('brida', 'Carcasa o brida del portaherramienta', G1, [[[
    rev([[2.95, 23.6], [4.45, 23.6], [4.45, 24.4], [4.15, 24.6], [3.95, 26.7], [2.95, 26.7], [2.95, 23.6]], 'x', fundicion(), 48),
    ...Array.from({ length: 12 }, (_, i) => { const a = i / 12 * PI * 2; return caja(2.0, 0.35, 0.25, 25.5, 4.05 * Math.cos(a), 4.05 * Math.sin(a), fundicion()).rotateX(-a); }),
  ], V(14, 0, 0)]], true);
  const nT = d40 ? 9 : 6;
  add('tornillos_porta', 'Tornillos del portaherramienta', G1, [[Array.from({ length: nT }, (_, i) => { const a = (i + 0.5) / nT * PI * 2; return tornillo('x', 24.45, 3.75 * Math.cos(a), 3.75 * Math.sin(a), 0.22); }), V(17, 0, 0)]]);
  add('manga_giratoria', 'Manga giratoria con manga de bloqueo, resorte y guía', G1, [[[
    rev([[3.0, 26.7], [4.3, 26.7], [4.35, 27.2], [4.35, 30.4], [4.1, 30.9], [3.0, 30.9], [3.0, 26.7]], 'x', negro(), 48),
    ...Array.from({ length: 8 }, (_, i) => { const a = i / 8 * PI * 2; return caja(1.8, 0.7, 0.4, 28.8, 4.32 * Math.cos(a), 4.32 * Math.sin(a), mat('#3a3c40')).rotateX(-a); }),
    resorteX(27.2, 28.6, 2.75, 3, 0.07, acero('#8d939a')), tuboX(28.6, 30.4, 2.7, 2.25, blanco()),
  ], V(17, 0, 0)]], true);
  add('bloqueo', 'Bloqueo del útil (resortes, bujes y piezas de bloqueo)', G1, [[[
    resorteX(30.9, 32.2, 2.0, 4, 0.06, acero('#8d939a')), tuboX(32.2, 32.6, 2.3, 1.55, ac()), tuboX(32.6, 33.3, 2.2, 1.55, goma('#2a2c30')),
    caja(1.0, 0.45, 0.5, 31.5, 0, 1.5, ac()), caja(1.0, 0.45, 0.5, 31.5, 0, -1.5, ac()),
  ], V(19, -5.5, 0)]]);
  add('amortiguador_th', 'Amortiguador y anillo de bloqueo', G1, [[[tuboX(33.4, 34.2, 2.6, 1.3, goma('#2a2c30')), tuboX(34.2, 34.7, 2.5, 1.3, ac())], V(21, 5.5, 0)]]);
  add('manguito', 'Manguito deslizante', G1, [[[
    rev([[2.7, 30.9], [4.15, 30.9], [4.15, 33.5], [3.85, 35.2], [2.7, 35.2], [2.7, 30.9]], 'x', negro(), 48),
    ...[31.6, 32.3, 33.0].map(x => aroX(x, 4.15, 0.12, mat('#2c2e32'))),
  ], V(21, 0, 0)]], true);
  add('anillo_elastico', 'Anillo elástico y arandela', G1, [[[tuboX(34.8, 35.05, 1.95, 1.25, ac()), aroX(35.15, 1.6, 0.09, acero('#6f757c'))], V(23, -5, 0)]]);
  add('sello_frontal', 'Sello de goma frontal', G1, [[[rev([[1.25, 35.2], [3.75, 35.2], [3.3, 36.3], [2.4, 36.6], [1.25, 36.6], [1.25, 35.2]], 'x', goma('#202124'), 40)], V(25, 0, 0)]]);
  add('husillo', 'Husillo SDS', G1, [[[
    rev([[2.1, 23.7], [2.9, 23.7], [2.9, 26.2], [2.4, 26.6], [2.4, 29.0], [2.0, 29.4], [2.0, 35.9], [0.95, 35.9], [0.95, 27.0], [2.1, 26.4], [2.1, 23.7]], 'x', acero('#c8ccd1', { metalness: 0.8, roughness: 0.28 }), 48),
    cil('x', 2.55, 2.55, 2.0, 27.9, 0, 0, acero('#aeb3ba'), 6), // hexágono exterior
    caja(4.0, 0.25, 0.5, 33.0, 0, 1.9, mat('#3a3d42')), caja(4.0, 0.25, 0.5, 33.0, 0, -1.9, mat('#3a3d42')), // ranuras
  ], V(24, -15, 0)]]);
  add('sellos_th', 'Sellos y juntas tóricas del portaherramienta', G1, [[[aroX(24.5, 4.15, 0.1, tor()), aroX(29.2, 2.45, 0.12, tor()), aroX(27.4, 1.1, 0.25, tor()), aroX(26.6, 1.6, 0.25, tor())], V(20, 6.5, 0)]]);
  add('rodamiento_golpeo', 'Buje rodamiento de la pieza de golpeo', G1, [[[tuboX(25.9, 27.0, 2.05, 1.15, acero('#9aa0a7'))], V(16, -15, 0)]]);
  add('buje_golpeo', 'Buje, amortiguador y arandela de la pieza de golpeo', G1, [[[tuboX(23.8, 25.9, 2.05, 1.6, ac()), tuboX(24.2, 25.4, 1.6, 1.15, goma('#2a2c30')), tuboX(23.8, 24.2, 1.6, 1.15, ac())], V(4, -15, 0)]]);
  add('pieza_golpeo', 'Pieza de golpeo', G1, [[[
    rev([[0.01, 21.6], [1.35, 21.6], [1.45, 22.2], [1.45, 23.2], [1.1, 23.5], [1.1, 29.4], [0.9, 29.7], [0.01, 29.7]], 'x', acero('#c3c7cc', { metalness: 0.8 }), 32),
    aroX(24.8, 1.12, 0.06, acero('#7b8188')),
  ], V(9, -15, 0)]]);

  // ================= unidad antivibración (alojamiento delantero 78) =================
  add('buje72', 'Buje del alojamiento delantero con junta', G2, [[[tuboX(22.2, 23.55, 2.6, 1.55, mat('#2b2d31', { roughness: 0.5 })), aroX(23.3, 2.35, 0.2, tor())], V(16, 7, 0)]]);
  add('cubierta', 'Cubierta plástica antivibración', G2, [[[
    rev([[5.45, 11.6], [5.45, 18.5], [4.95, 21.4], [4.6, 21.4], [5.1, 18.5], [5.1, 11.6], [5.45, 11.6]], 'x', negro(), 48, 0, 0, 0, 0.12, PI * 2 - 0.24),
    ...[13.0, 14.6, 16.2].map(x => aroX(x, 5.47, 0.1, mat('#2c2e32'))),
  ], V(2, -13, 0)]], true);
  const scuad = s => s.map(([a, b]) => [a, b]); // (solo legibilidad)
  add('carcasa_delantera', 'Alojamiento delantero de la unidad antivibración', G2, [[[
    rev(scuad([[2.95, 23.6], [3.55, 23.6], [3.95, 22.6], [4.6, 20.5], [4.95, 18], [5.05, 11.6], [5.05, 10.6], [4.45, 10.6], [4.45, 12], [4.3, 20], [2.95, 22.8], [2.95, 23.6]]), 'x', fundicion(), 48),
    perfil([[9.6, -5.3], [10.6, -5.3], [10.6, 5.3], [9.6, 5.3]], 10.6, -5.3, fundicion(), 0.4), // brida cuadrada de 4 agujeros
    ...[-1, 1].flatMap(s => [caja(6.5, 0.5, 0.35, 15.5, s * 4.95, 0, mat('#2a2c30')), caja(6.5, 0.35, 0.5, 15.5, 0, s * 4.95, mat('#2a2c30'))]), // ranuras
  ], V(12, 0, 0)]], true);
  add('tornillos65', 'Tornillos de la unidad antivibración', G2, [[[-1, 1].flatMap(a => [-1, 1].map(b => tornillo('x', 10.65, a * 4.4, b * 4.4, 0.3))), V(17, 0, 0)]]);
  add('junta79', 'Junta tórica de la carcasa principal', G2, [[[aroX(9.7, 3.4, 0.16, tor())], V(5, 0, 0)]]);
  add('antivibracion', 'Componentes antivibración (contrapeso, resortes, guías)', G2, [[[
    tuboX(11.2, 11.7, 4.3, 3.0, blanco()), resorteX(11.7, 14.4, 3.65, 3, 0.2, acero('#7d838b')),
    tuboX(14.4, 18.0, 4.2, 3.05, laton()), tuboX(14.2, 14.6, 3.05, 2.75, blanco()), tuboX(17.8, 18.2, 3.05, 2.75, blanco()),
    resorteX(18.0, 20.4, 3.55, 3, 0.2, acero('#7d838b')), tuboX(20.4, 20.9, 4.0, 2.9, blanco()),
  ], V(12, 10.5, 0)]]);
  add('cilindro', 'Cilindro', G2, [[[
    rev([[2.15, 8.2], [3.0, 8.2], [3.0, 11.0], [2.65, 11.4], [2.65, 22.2], [2.15, 22.2], [2.15, 8.2]], 'x', acero('#c5c9ce', { metalness: 0.75 }), 40),
    ...[13, 16.5, 19.5].flatMap(x => [1, -1].map(s => cil('z', 0.22, 0.22, 0.1, x, s * 2.66, 0, mat('#2a2c30'), 12).rotateX(0))),
  ], V(16, -8, 0)]]);
  add('martillo', 'Martillo (ariete)', G2, [[[rev([[0.01, 15.0], [2.1, 15.0], [2.1, 16.0], [1.95, 16.2], [1.95, 16.6], [2.1, 16.8], [2.1, 19.0], [1.6, 19.3], [0.01, 19.3]], 'x', acero('#d2d5da', { metalness: 0.8 }), 32)], V(26, -8, 0)]]);
  add('juntas_cil', 'Juntas tóricas del cilindro y del martillo', G2, [[[aroX(9.0, 3.0, 0.14, tor()), aroX(21.0, 2.15, 0.1, tor()), aroX(16.4, 2.0, 0.12, tor())], V(16, -8, 0)]]);
  add('mango_lateral', 'Mango lateral', G2, [[[
    tuboX(19.0, 20.8, 5.25, 4.95, acero('#40454b')), caja(1.8, 1.6, 1.8, 19.9, 0, 5.7, acero('#40454b')),
    cil('z', 1.4, 1.5, 11, 19.9, 0, 11.8, negro(), 24), cil('z', 1.6, 1.6, 0.8, 19.9, 0, 17.6, negro(), 24),
  ], V(0, 0, 14)]]);

  // ================= cárter, cigüeñal y caja de engranajes =================
  const logo = lienzo(512, 128, (g, w, h) => { g.fillStyle = '#1c1d20'; g.font = 'italic bold 104px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('DEWALT', w / 2, h / 2 + 4); });
  add('carcasa_principal', 'Carcasa principal metálica (cárter y caja de engranajes)', G3, [[[
    perfil([[-9.3, -7.0], [8.0, -7.0], [8.0, 3.0], [-9.3, 3.0]], 9.8, -4.9, fundicion(), 0.8),
    perfil([[8.0, -5.2], [9.6, -5.2], [9.6, 5.0], [8.0, 5.0]], 10.4, -5.2, fundicion(), 0.3), // asiento de la unidad antivibración
    tuboY(3.0, 3.5, 3.9, 3.3, fundicion(), XC, 0), // boca del cárter
    ...[-5.6, -4.6, -3.6, -2.6].flatMap(y => [1, -1].map(s => caja(13.5, 0.45, 0.35, -0.6, y, s * 4.95, fundicion()))), // aletas
    mesh(new THREE.PlaneGeometry(7.6, 1.9), mat('#ffffff', { map: logo, alphaTest: 0.5, metalness: 0.3, roughness: 0.5 }), -0.4, 1.4, 4.92),
  ], V(0, 0, 0)]], true);
  add('tapa_sa', 'Tapa del cárter y junta tórica', G3, [[[cil('y', 3.75, 3.75, 0.55, XC, 3.75, 0, acero('#9ea3aa')), aroY(XC, 3.4, 0, 3.3, 0.12, tor()), ...[0, 1, 2].map(i => tornillo('y', XC + 3.1 * Math.cos(i * 2.1 + 0.5), 4.05, 3.1 * Math.sin(i * 2.1 + 0.5), 0.2))], V(0, 14, 0)]]);
  add('piston', 'Pistón con pasador, botones y junta', G3, [[[
    rev([[0.01, 9.0], [2.12, 9.0], [2.12, 11.6], [1.7, 11.6], [1.7, 9.5], [0.01, 9.5]], 'x', acero('#a9aeb5'), 32),
    aroX(9.4, 2.1, 0.11, tor()), cil('z', 0.42, 0.42, 4.1, 10.4, 0, 0, acero('#d0d3d8'), 16),
    cil('z', 0.45, 0.45, 0.25, 10.4, 0, 2.08, blanco(), 16), cil('z', 0.45, 0.45, 0.25, 10.4, 0, -2.08, blanco(), 16),
  ], V(8, 0, 0)]]);
  add('biela', 'Biela', G3, [[[
    tuboY(-0.4, 0.4, 1.05, 0.55, acero('#8f959c'), XC + 1.3, 0), tuboY(-0.35, 0.35, 0.65, 0.42, acero('#8f959c'), 10.4, 0),
    caja(4.3, 0.6, 0.8, (XC + 1.3 + 10.4) / 2 + 0.1, 0, 0, acero('#8f959c')),
  ], V(8, 0, 0)]]);
  add('cigueñal', 'Cigüeñal con sello', G3, [[[
    cil('y', 0.85, 0.85, 8.6, XC, -5.3, 0, acero('#b9bec4')), cil('y', 2.4, 2.4, 0.7, XC, -0.85, 0, acero('#9da3aa')),
    cil('y', 0.52, 0.52, 1.3, XC + 1.3, 0.1, 0, acero('#cfd3d8')), aroY(XC, -2.4, 0, 1.0, 0.15, tor()),
  ], V(0, 9, 0)]]);
  add('engranaje_cig', 'Engranaje del cigüeñal', G3, [[[engranaje(40, 3.35, 1.0, -9.0, XC, 0, acero('#a7adb4')), cil('y', 0.9, 0.9, 1.1, XC, -8.5, 0, acero('#6d737a'), 6)], V(0, -5, 0)]]);
  add('engranaje_doble', 'Engranaje doble con rodamientos, espaciadores y anillo', G3, [[[
    engranaje(36, 2.9, 0.95, -7.65, XG, 0, acero('#b0b6bd')), engranaje(12, 1.05, 1.35, -9.0, XG, 0, acero('#9aa0a7')),
    tuboY(-7.7, -6.6, 0.9, 0.45, mat('#2f6a3a', { metalness: 0.3 }), XG, 0),
  ], V(-2.5, -2.5, 0)]]);
  add('tapa21', 'Tapa interior ventilada', G3, [[[planta(-9.0, 1.4, -4.3, 4.3, 1.0, -9.6, 0.25, negro()), ...[-6, -4.5, -3, -1.5].map(x => caja(0.6, 0.05, 5.2, x, -9.33, 0, mat('#0c0d0f')))], V(0, -6, 0)]]);
  add('tapa_engranajes', 'Tapa de la caja de engranajes y sello', G3, [[[
    planta(-9.3, 8.0, -5.0, 5.0, 2.0, -12.0, 5.0, amarillo()), aroY(-0.6, -7.05, 0, 4.6, 0.1, tor()),
    ...[[-8.3, 4], [-8.3, -4], [7.0, 4], [7.0, -4], [-0.6, 4.3], [-0.6, -4.3]].map(([x, z]) => { const t = tornillo('y', x, -12.02, z, 0.22); t.rotation.x = PI; return t; }),
  ], V(0, -12, 0)]], true);

  // ================= motor (vertical, detrás del cárter) =================
  add('rodamiento_inducido', 'Rodamiento inferior del inducido con anillo y sello', G4, [[[tuboY(-5.4, -4.6, 1.2, 0.48, acero('#c3c8ce', { metalness: 0.8 }), XM, 0), aroY(XM, -4.5, 0, 1.0, 0.07, acero('#6f757c')), aroY(XM, -5.55, 0, 0.8, 0.12, tor())], V(-3.5, -6, 0)]]);
  const nucleo = new THREE.MeshStandardMaterial({ map: laminas(), metalness: 0.6, roughness: 0.4 });
  add('inducido', 'Inducido con anillo elástico', G4, [[[
    cil('y', 0.45, 0.45, 13.2, XM, -1.0, 0, acero('#c9cdd2')), cil('y', 2.5, 2.5, 5.0, XM, -1.1, 0, nucleo),
    cil('y', 2.25, 2.25, 0.8, XM, -4.0, 0, new THREE.MeshStandardMaterial({ map: alambre(), metalness: 0.7, roughness: 0.35 })), cil('y', 2.25, 2.25, 0.8, XM, 1.8, 0, new THREE.MeshStandardMaterial({ map: alambre(), metalness: 0.7, roughness: 0.35 })),
    cil('y', 1.3, 1.3, 1.4, XM, 2.75, 0, cobre()), cil('y', 0.75, 0.75, 1.6, XM, -6.8, 0, acero('#9aa0a7'), 10), aroY(XM, -5.9, 0, 0.5, 0.06, acero('#5d636a')),
  ], V(0, 4, 0)]]);
  add('estator', 'Estator y carcasa del motor con sello', G4, [[[
    tuboY(-4.2, 2.6, 3.9, 2.6, acero('#8c9299', { metalness: 0.6 }), XM, 0), tuboY(1.6, 2.5, 3.2, 2.6, cobre(), XM, 0), aroY(XM, -4.25, 0, 3.6, 0.12, tor()),
  ], V(0, 12, 0)]], true);
  add('portaescobillas', 'Portaescobillas con tornillos', G4, [[[
    tuboY(2.6, 3.9, 3.9, 1.5, blanco(), XM, 0), caja(1.7, 1.1, 1.4, XM + 2.3, 3.2, 0, blanco()), caja(1.7, 1.1, 1.4, XM - 2.3, 3.2, 0, blanco()),
    ...[0, 1, 2, 3].map(i => tornillo('y', XM + 3.2 * Math.cos(i * PI / 2 + PI / 4), 3.93, 3.2 * Math.sin(i * PI / 2 + PI / 4), 0.2)),
  ], V(0, 16, 0)]]);
  add('escobillas', 'Escobillas', G4, [[caja(1.0, 0.7, 0.8, XM + 1.9, 2.75, 0, mat('#2b2b2b', { roughness: 0.9 })), V(3.5, 16, 0)], [caja(1.0, 0.7, 0.8, XM - 1.9, 2.75, 0, mat('#2b2b2b', { roughness: 0.9 })), V(-3.5, 16, 0)]]);
  add('rodamiento5', 'Rodamiento superior y aislante', G4, [[[tuboY(3.9, 4.6, 1.45, 0.5, blanco(), XM, 0), tuboY(3.95, 4.55, 1.05, 0.45, acero('#c3c8ce', { metalness: 0.8 }), XM, 0)], V(0, 17.5, 0)]]);
  add('ventilador', 'Ventilador con tornillo', G4, [[[
    cil('y', 3.6, 3.6, 0.15, XM, 4.75, 0, negro()), cil('y', 1.0, 1.0, 1.1, XM, 5.3, 0, negro()),
    ...Array.from({ length: 12 }, (_, i) => caja(2.5, 1.0, 0.12, XM + 2.25 * Math.cos(i * PI / 6), 5.3, 2.25 * Math.sin(i * PI / 6), negro()).rotateY(-i * PI / 6)),
    tornillo('y', XM, 5.88, 0, 0.32),
  ], V(0, 19, 0)]]);
  add('tapa_motor', 'Tapa superior del motor', G4, [[[
    perfil([[-9.3, 3.0], [-9.3, 8.4], [-8.4, 9.3], [0.4, 9.3], [2.6, 8.5], [9.2, 4.6], [9.6, 3.0]], 9.8, -4.9, amarillo(), 0.9),
    ...[[-8.2, 3.4], [-8.2, -3.4], [-1.0, 4.0], [-1.0, -4.0], [5.5, 0]].map(([x, z]) => tornillo('y', x, x > 3 ? 7.05 : 9.32, z, 0.22)),
  ], V(0, 23, 0)]], true);
  add('electronica', 'Módulo electrónico', G4, [[[caja(3.6, 1.6, 3.0, 1.2, 7.3, 0, mat('#25272b')), cil('y', 0.35, 0.35, 0.6, 1.2, 8.3, 0, blanco(), 12)], V(0, 23, 8)]]);

  // ================= mango trasero e interruptor =================
  const asa = rr(-16.9, -10.0, -8.9, 9.3, 1.9); asa.holes.push(rr(-13.7, -7.3, -10.4, 6.8, 1.3));
  const medio = (z0, prof, m) => { const g = new THREE.ExtrudeGeometry(asa, { depth: prof - 0.7, bevelEnabled: true, bevelSize: 0.35, bevelThickness: 0.35, bevelSegments: 3, curveSegments: 16 }); g.translate(0, 0, z0 + 0.35); return mesh(g, m); };
  const agarre = (z0) => { const g = new THREE.ExtrudeGeometry(rr(-17.1, -6.6, -13.5, 6.0, 1.5), { depth: 2.15, bevelEnabled: true, bevelSize: 0.3, bevelThickness: 0.3, bevelSegments: 3 }); g.translate(0, 0, z0); return mesh(g, negro()); };
  add('mango', 'Mango trasero (mitad fija)', G5, [[[medio(-2.5, 2.5, amarillo()), agarre(-2.45)], V(0, 0, 0)]], true);
  add('tapa_mango', 'Tapa del mango con interruptor', G5, [[[medio(0, 2.5, amarillo()), agarre(0.3), ...[[-15.5, 8.2], [-11.2, 8.2], [-15.5, -8.8], [-11.2, -8.8], [-15.8, 0], [-9.7, 5], [-9.7, -5], [-9.7, 0]].map(([x, y]) => tornillo('z', x, y, 2.5, 0.2))], V(0, 0, 9)]], true);
  add('interruptor', 'Interruptor con adaptador y abrazadera', G5, [[[
    caja(3.2, 1.6, 2.6, -13.0, 7.75, 0, mat('#cfd0d2', { roughness: 0.6 })), caja(0.8, 0.8, 1.2, -13.6, 6.95, 0, mat('#3d3f44')),
    caja(3.6, 0.25, 2.9, -13.0, 8.65, 0, acero('#6d737a')), caja(0.2, 0.5, 0.3, -11.3, 7.9, 0.6, cobre()), caja(0.2, 0.5, 0.3, -11.3, 7.9, -0.6, cobre()),
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-11.2, 7.9, 0.5), V(-9.6, 6.5, 1.5), V(-8.6, 4.2, 2.0)]), 16, 0.18, 8), mat('#1f4ea8')),
  ], V(-2, 0, 6)]]);
  add('gatillo', 'Gatillo con pasador, varilla y pines', G5, [[[
    perfil([[-13.75, 5.6], [-13.0, 5.4], [-12.85, 3.0], [-13.2, 1.6], [-13.75, 1.6]], 1.2, -0.6, negro(), 0.15),
    cil('z', 0.14, 0.14, 1.6, -13.4, 5.2, 0, acero('#c9cdd2'), 10), cil('y', 0.12, 0.12, 1.5, -13.5, 6.1, 0, acero('#9aa0a7'), 8),
  ], V(-3, -2, 4)]]);
  const cord = new THREE.CatmullRomCurve3([V(-10.6, -9.5, 0), V(-11.2, -12.5, 0.3), V(-13, -16, 1.2), V(-16.5, -19, 0.5)]);
  add('cable', 'Cable de alimentación con sujetacable', G5, [[[
    mesh(new THREE.TubeGeometry(cord, 40, 0.45, 10), goma('#18191c')),
    rev([[0.5, -13.0], [0.75, -12.4], [0.95, -11.5], [1.1, -10.6], [1.2, -10.0]], 'y', goma('#1a1b1e'), 20, -10.6, 0, 0),
    caja(1.8, 0.5, 2.6, -10.9, -9.2, 0, mat('#3d3f44')),
  ], V(-6, -6, 0)]]);

  return { k, parts };
}
