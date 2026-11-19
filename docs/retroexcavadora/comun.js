// Helpers y medidas de la retroexcavadora (unidades: cm; +x hacia el cargador, +y arriba, z a lo ancho, +z = lado derecho
// del operador; suelo en y = 0; centro del eje trasero en x = 0). Nombres, refs y grupos: data.json -> catalogoPorModelo.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PI, V, mat, mesh, lienzo } from '../lib.js';

let datos = {};
try { datos = await (await fetch(new URL('data.json', import.meta.url))).json(); }
catch { console.warn('retroexcavadora: data.json no disponible; se usan los nombres de respaldo del contrato'); }
export const CAT = datos;
// contrato de piezas nuevas (contrato.json, guía en CONTRATO.md): un registro por id real, con su nombre, grupo, módulo y anclaje
let contrato = { piezas: [] };
try { contrato = await (await fetch(new URL('contrato.json', import.meta.url))).json(); }
catch { console.warn('retroexcavadora: contrato.json no disponible'); }
export const CONTRATO = contrato;
export const PIEZAS_CONTRATO = Object.fromEntries(contrato.piezas.flatMap(e => (e.ids || [e.id]).map((id, i) => [id, {
  ...e, id, base: e.id, nombre: e.etiquetas?.[i] ?? e.nombre, anclaje: e.anclajes?.[i] ?? e.anclaje, explosion: e.explosiones?.[i] ?? e.explosion,
}])));
export const aplicaA = (e, m) => e.aplica === 'todos' || !m?.modelo || e.aplica.includes(m.modelo);

// respaldo del CONTRATO (si data.json aún no trae la pieza): [nombre, grupo]
const G = { m: 'Motor y enfriamiento', t: 'Transmisión y ejes', r: 'Ruedas', h: 'Sistema hidráulico', c: 'Cargador frontal', x: 'Retroexcavadora', e: 'Estabilizadores', k: 'Chasis y cabina' };
export const NOMBRES = {
  motor: ['Motor diésel', G.m], radiador: ['Radiador y enfriador', G.m], ventilador: ['Ventilador', G.m], filtro_aire: ['Filtro de aire', G.m], escape: ['Escape', G.m], bateria: ['Batería', G.m], tanque_comb: ['Estanque de combustible', G.m], capot: ['Capó', G.m],
  convertidor: ['Convertidor de par', G.t], transmision: ['Transmisión (powershuttle)', G.t], cardan_del: ['Cardán delantero', G.t], cardan_tras: ['Cardán trasero', G.t], eje_del: ['Eje delantero', G.t], eje_tras: ['Eje trasero y diferencial', G.t],
  rueda_del_i: ['Neumático delantero izq.', G.r], rueda_del_d: ['Neumático delantero der.', G.r], rueda_tras_i: ['Neumático trasero izq.', G.r], rueda_tras_d: ['Neumático trasero der.', G.r],
  tanque_hid: ['Estanque hidráulico', G.h], filtro_hid: ['Filtro hidráulico', G.h], bomba_hid: ['Bomba hidráulica', G.h], valvula_cargador: ['Válvula del cargador', G.h], valvula_retro: ['Válvula de la retro', G.h], mangueras: ['Mangueras y cañerías', G.h],
  brazos_cargador: ['Brazos del cargador', G.c], cuchara_cargador: ['Cucharón del cargador', G.c], cil_levante: ['Cilindros de levante', G.c], cil_volteo: ['Cilindro de volteo del cucharón', G.c],
  base_giro: ['Pivote y torre de giro', G.x], cil_giro: ['Cilindros de giro', G.x], pluma: ['Pluma (boom)', G.x], cil_pluma: ['Cilindro de la pluma', G.x], brazo_retro: ['Brazo (dipper)', G.x], cil_brazo: ['Cilindro del brazo', G.x], cuchara_retro: ['Cuchara de la retro', G.x], cil_cuchara: ['Cilindro de la cuchara', G.x], biela_cuchara: ['Bieletas de la cuchara', G.x],
  estab_i: ['Estabilizador izquierdo', G.e], estab_d: ['Estabilizador derecho', G.e], cil_estab_i: ['Cilindro del estabilizador izq.', G.e], cil_estab_d: ['Cilindro del estabilizador der.', G.e],
  chasis: ['Chasis', G.k], cabina: ['Cabina y ROPS', G.k], asiento: ['Asiento giratorio', G.k], mandos: ['Palancas y pedales', G.k], guardabarros: ['Guardabarros', G.k], pasadores: ['Pasadores y bujes', G.k],
};

// registra piezas: items = [[objetos, dirección de explosión], ...]; cada pieza trae sus propios materiales.
// Los materiales con userData.fijo (vidrios, ayudantes) no entran en mats: la app no les cambia la opacidad.
// datos por modelo: la app busca por m.modelo; se acepta también la clave «Marca modelo» (p. ej. «Case 580N»)
export const porModelo = (tabla, m) => tabla?.[m?.modelo] ?? tabla?.[m?.nombre] ?? Object.entries(tabla || {}).find(([k]) => m?.modelo && k.endsWith(' ' + m.modelo))?.[1];
export function armador(m) {
  const parts = {}, cat = porModelo(CAT.catalogoPorModelo, m) || CAT.catalogo || {};
  const add = (id, items, shell = false) => {
    const c = cat[id], pc = PIEZAS_CONTRATO[id], r = NOMBRES[id] || (pc && [pc.nombre, pc.grupo]);
    if (parts[id]) console.warn(`retroexcavadora: pieza duplicada «${id}»`);
    if (!c && !r) console.warn(`retroexcavadora: ${m?.modelo} sin «${id}» en el catálogo ni en el contrato`);
    const its = items.map(([objs, dir]) => { const g = new THREE.Group(); [].concat(objs).forEach(o => g.add(o)); return { obj: g, dir }; });
    const mats = []; its.forEach(i => i.obj.traverse(o => { if (o.material) { o.userData.pid = id; if (!o.material.userData.fijo) mats.push(o.material); } }));
    const nom = c ? (c[1] ? `${c[0]} (${c[1]})` : c[0]) : r?.[0] || id;
    parts[id] = { id, nombre: nom, ref: c?.[1] ?? null, grupo: c?.[2] || r?.[1] || 'Otras', items: its, mats, shell };
    return its;
  };
  return { parts, add };
}

// ---------- medidas por modelo (cm). P = publicada en la hoja técnica (investigacion.json); E = estimada ----------
// wb distancia entre ejes (P); rr/rw radio y ancho del neumático trasero, fr/fw delantero (E desde la designación);
// rtr/ftr trocha trasera/delantera (P); cab altura a techo de cabina (P); esc altura al escape (P); ht altura de transporte (P);
// ancho sobre neumáticos (P); grill eje trasero a parrilla (P en CAT, E en el resto); alcCarg alcance del cucharón desde el eje delantero (P);
// pinMax altura del pasador del cucharón levantado (P); bkW ancho del cucharón (P Case/JCB, E CAT); piv pivote de giro detrás del eje (derivado de P);
// alc alcance desde el pivote (P); prof profundidad de excavación (P); estab apertura de estabilizadores entre centros (P Case/CAT, E JCB);
// cil [diámetro, vástago] en cm (P Case; E CAT y JCB: se usan los del 580SN). rimT/rimD radio de llanta trasera/delantera (P en pulgadas de la designación).
const C580N = { lift: [8.26, 4.45], volteo: [7.62, 3.81], pluma: [11.43, 5.72], brazo: [10.8, 5.72], cuchara: [8.26, 5.72], giro: [9.53, 5.08], estab: [10.8, 5.72] };
const C580SN = { ...C580N, pluma: [12.7, 6.35], brazo: [12.07, 6.35], cuchara: [8.89, 6.35], giro: [10.16, 5.08], estab: [11.43, 5.72] };
export const DIM = {
  '580N': { marca: 'case', wb: 215, rr: 62.5, rw: 49.5, rimT: 30.5, rtr: 155, fr: 42, fw: 30.5, rimD: 21, ftr: 172, cab: 272, esc: 261, ht: 337, ancho: 207, grill: 278, alcCarg: 208, pinMax: 342, bkW: 209, piv: -111, alc: 557, prof: 450, estab: 287, cil: C580N, motorL: 3.4, rtxt: '19.5L-24', ftxt: '12L-16.5' },
  '580SN': { marca: 'case', wb: 215, rr: 62.5, rw: 49.5, rimT: 30.5, rtr: 155, fr: 42, fw: 30.5, rimD: 21, ftr: 172, cab: 272, esc: 261, ht: 337, ancho: 217, grill: 278, alcCarg: 205, pinMax: 342, bkW: 209, piv: -111, alc: 555, prof: 441, estab: 287, cil: C580SN, motorL: 4.5, rtxt: '19.5L-24', ftxt: '12L-16.5' },
  '420F2': { marca: 'cat', wb: 220, rr: 62.5, rw: 49.5, rimT: 30.5, rtr: 171.4, fr: 48.2, fw: 31.8, rimD: 22.9, ftr: 189.5, cab: 281.9, esc: 274.4, ht: 357.7, ancho: 232.2, grill: 270.5, alcCarg: 205, pinMax: 347.4, bkW: 218, piv: -109, alc: 561.2, prof: 436, estab: 331, cil: C580SN, motorL: 4.4, rtxt: '19.5L-24', ftxt: '12.5/80-18' },
  // JCB: data.json -> geo trae la variante 3CX Compact (hoja AE1296), con neumáticos 340/80 R18 en los cuatro puestos
  '3CX': { marca: 'jcb', wb: 199, rr: 50, rw: 34, rimT: 22.9, rtr: 155, fr: 50, fw: 34, rimD: 22.9, ftr: 158, cab: 260, esc: 262, ht: 320, ancho: 200, grill: 254, alcCarg: 154, pinMax: 318, bkW: 200, piv: -121, alc: 399, prof: 307, estab: 270, cil: C580N, motorL: 3.0, rtxt: '340/80 R18', ftxt: '340/80 R18' },
};
export const claveDe = m => { const s = `${m?.marca || ''} ${m?.modelo || ''}`.toLowerCase();
  return /420/.test(s) ? '420F2' : /3cx|jcb/.test(s) ? '3CX' : /super|580\s*sn|\bsn\b/.test(s) ? '580SN' : '580N'; };
// medidas: tabla de arriba + lo publicado en data.json -> modelos[].geo (fuente compartida con la ficha)
export function dims(m) {
  const d = { ...DIM[claveDe(m)] }, g = m?.geo || {}, c = g.cargador || {}, e = g.estimado || {};
  const pon = (k, v, f = x => x) => { if (typeof v === 'number' && isFinite(v)) d[k] = f(v); };
  pon('wb', g.entre_ejes); pon('ancho', g.ancho); pon('prof', g.prof_excavacion); pon('alc', g.alcance_pivote); pon('piv', g.pivote_tras_eje, v => -v);
  pon('estab', g.estab_apertura ?? e.estab_apertura); pon('ftr', g.trocha_del); pon('rtr', g.trocha_tras);
  pon('pinMax', c.altura_pasador); pon('bkW', c.ancho_cuchilla); pon('alcCarg', c.alcance_eje_del);
  if (typeof g.alto_cabina === 'number') { d.cab = g.alto_cabina; pon('ht', g.alto); } else if (typeof g.alto === 'number') { d.cab = g.alto; d.ht = g.alto + 65; }
  const cm = g.cilindros_mm || {}, cil = { ...d.cil };
  for (const [k, kk] of [['lift', 'levante'], ['volteo', 'volteo'], ['pluma', 'pluma'], ['brazo', 'brazo'], ['cuchara', 'cuchara'], ['giro', 'giro'], ['estab', 'estab']])
    if (Array.isArray(cm[kk]) && cm[kk][0] && cm[kk][1]) cil[k] = [cm[kk][0] / 10, cm[kk][1] / 10];
  d.cil = cil;
  return d;
}

// ---------- geometría ----------
export const R = d => d * PI / 180;
// polígono [x,y] extruido a lo largo de z, centrado en z0
export function placa(pts, esp, m, z0 = 0, bisel = 0) {
  const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth: esp, bevelEnabled: bisel > 0, bevelSize: bisel, bevelThickness: bisel, bevelSegments: 2, curveSegments: 12 });
  g.translate(0, 0, z0 - esp / 2);
  return mesh(g, m);
}
// línea gruesa [x,y] (chapa curva) extruida a lo ancho: espesor e hacia la izquierda de la polilínea
export function chapa(pts, e, ancho, m, z0 = 0) {
  const n = pts.length, izq = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, n - 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    izq.push([pts[i][0] - dy / L * e, pts[i][1] + dx / L * e]);
  }
  return placa([...pts, ...izq.reverse()], ancho, m, z0);
}
// cilindro macizo entre dos puntos
export function entre(p0, p1, r, m, seg = 18, r1 = r) {
  const d = p1.clone().sub(p0), o = mesh(new THREE.CylinderGeometry(r1, r, d.length(), seg), m);
  o.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); o.position.copy(p0).add(p1).multiplyScalar(0.5); return o;
}
export const caja = (w, h, d, x, y, z, m) => mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z);
export const tubo = (pts, r, m, tension = 0.3) => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', tension), pts.length * 12, r, 8), m);
// pasador con eje z (de z0 a z1)
export const pasador = (x, y, z0, z1, r, m) => entre(V(x, y, z0), V(x, y, z1), r, m, 14);
// caja redondeada (cantos con radio r) centrada en (x,y,z)
export function cajaR(w, h, d, r, x, y, z, m) {
  const s = new THREE.Shape(), a = w / 2, b = h / 2;
  s.moveTo(-a + r, -b); s.lineTo(a - r, -b); s.quadraticCurveTo(a, -b, a, -b + r); s.lineTo(a, b - r); s.quadraticCurveTo(a, b, a - r, b);
  s.lineTo(-a + r, b); s.quadraticCurveTo(-a, b, -a, b - r); s.lineTo(-a, -b + r); s.quadraticCurveTo(-a, -b, -a + r, -b);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * Math.min(r, d / 4), bevelEnabled: true, bevelSize: Math.min(r, d / 4), bevelThickness: Math.min(r, d / 4), bevelSegments: 3, curveSegments: 6 });
  g.translate(0, 0, -(d - 2 * Math.min(r, d / 4)) / 2);
  return mesh(g, m, x, y, z);
}
// junta en una sola malla varias mallas que comparten material (menos llamadas de dibujo)
export function fundir(objs, m) {
  const gs = objs.map(o => { o.updateMatrix(); const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g.applyMatrix4(o.matrix); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k); g.clearGroups(); return g; });
  return mesh(mergeGeometries(gs), m);
}
// letrero plano con texto (fondo transparente salvo que se pida), normal hacia +z antes de orientarlo
export function letrero(txt, w, h, color, { fondo = null, negrita = 'bold', borde = null } = {}) {
  const W = 1024, H = Math.max(64, Math.round(W * h / w));
  const t = lienzo(W, H, (g) => {
    g.clearRect(0, 0, W, H);
    if (fondo) { g.fillStyle = fondo; g.fillRect(0, 0, W, H); }
    let px = H * 0.86; g.font = `${negrita} ${px}px Arial Black, Arial, sans-serif`;
    while (g.measureText(txt).width > W * 0.94 && px > 10) g.font = `${negrita} ${--px}px Arial Black, Arial, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (borde) { g.strokeStyle = borde; g.lineWidth = px * 0.08; g.strokeText(txt, W / 2, H * 0.54); }
    g.fillStyle = color; g.fillText(txt, W / 2, H * 0.54);
  });
  return mesh(new THREE.PlaneGeometry(w, h), mat('#ffffff', { map: t, alphaTest: 0.4, metalness: 0, roughness: 0.6 }));
}

// neumático con tacos en V (eje z, centrado en el origen): R radio exterior, W ancho, rl radio de la llanta
export function neumatico(R, W, rl, n, m) {
  const perfil = [[rl, -W * 0.40], [rl + (R - rl) * 0.45, -W * 0.49], [R * 0.93, -W * 0.47], [R - 2.6, -W * 0.38], [R - 2.6, W * 0.38], [R * 0.93, W * 0.47], [rl + (R - rl) * 0.45, W * 0.49], [rl, W * 0.40]];
  const g = new THREE.LatheGeometry(perfil.map(([r, a]) => new THREE.Vector2(r, a)), 64); g.rotateX(PI / 2);
  const piezas = [mesh(g, m)], M4 = new THREE.Matrix4(), Rx = new THREE.Matrix4(), Rz = new THREE.Matrix4(), T = new THREE.Matrix4();
  for (let i = 0; i < n; i++) for (const s of [-1, 1]) {
    const a = (i + (s > 0 ? 0.5 : 0)) / n * PI * 2, L = W * 0.5;
    const b = new THREE.BoxGeometry(3.4, (R - rl) * 0.16 + 3, L);
    T.makeTranslation(0, 0, s * W * 0.22); Rx.makeRotationX(s * 0.55);
    M4.makeRotationZ(a).multiply(new THREE.Matrix4().makeTranslation(R - 1.9, 0, 0)).multiply(T).multiply(Rx);
    b.applyMatrix4(M4); piezas.push(mesh(b, m));
    // hombro del taco que baja por el flanco
    const h = new THREE.BoxGeometry(5, 4, 4); h.applyMatrix4(new THREE.Matrix4().makeRotationZ(a).multiply(new THREE.Matrix4().makeTranslation(R - 4.5, Math.sin(s * 0.55) * L * 0.5, s * W * 0.44)));
    piezas.push(mesh(h, m));
  }
  return fundir(piezas, m);
}
// llanta de acero con disco, cubo y tuercas (eje z); cara exterior hacia +z si lado > 0
export function llanta(rl, W, lado, m, mt) {
  const g = new THREE.Group(), s = lado;
  const aro = new THREE.LatheGeometry([[rl * 0.97, -W * 0.40], [rl + 1.6, -W * 0.43], [rl + 1.6, -W * 0.37], [rl * 0.95, -W * 0.3], [rl * 0.95, W * 0.3], [rl + 1.6, W * 0.37], [rl + 1.6, W * 0.43], [rl * 0.97, W * 0.40]].map(([r, a]) => new THREE.Vector2(r, a)), 48);
  aro.rotateX(PI / 2); g.add(mesh(aro, m));
  const disco = new THREE.LatheGeometry([[rl * 0.95, 0], [rl * 0.7, 1.2], [rl * 0.45, 4], [rl * 0.42, 4], [14, 4.5], [0.1, 4.5]].map(([r, a]) => new THREE.Vector2(r, a)), 48);
  disco.rotateX(PI / 2); const d = mesh(disco, m); d.scale.z = s; d.position.z = s * W * 0.02; g.add(d);
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; g.add(mesh(new THREE.CylinderGeometry(rl * 0.07, rl * 0.07, 1.6, 10), m, Math.cos(a) * rl * 0.6, Math.sin(a) * rl * 0.6, s * W * 0.1).rotateX(PI / 2)); }
  for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * PI * 2; const t = mesh(new THREE.CylinderGeometry(1.3, 1.3, 2.2, 6), mt, Math.cos(a) * 10, Math.sin(a) * 10, s * (W * 0.02 + 5.4)); t.rotation.x = PI / 2; g.add(t); }
  g.add(mesh(new THREE.CylinderGeometry(7, 8, 6, 20), mt, 0, 0, s * (W * 0.02 + 6)).rotateX(PI / 2));
  return g;
}

// cilindro hidráulico entre A0 y B0 (pose neutra): camisa desde A0 y vástago desde B0, dimensionados para la carrera muestreada
export function cilindro(A0, B0, diam, vast, Lmin, Lmax, mc, mv, mo = mc) {
  const d = B0.clone().sub(A0), L0 = d.length(); d.normalize();
  const rB = diam / 2 + 1.1, rV = vast / 2, ojo = Math.max(rB * 0.95, 4);
  const Lb = Math.max(Lmin - ojo - 4, 20), Lr = Math.min(Lmin - 2, Math.max(Lmax - Lb + 12, 25));
  if (Lb + Lr - Lmax < 2) console.warn('retroexcavadora: carrera grande para el cilindro', Lmin.toFixed(0), Lmax.toFixed(0));
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d);
  const cam = new THREE.Group(), vas = new THREE.Group();
  // camisa: ojo trasero, tubo, culata con prensaestopa
  cam.add(mesh(new THREE.CylinderGeometry(ojo, ojo, rB * 1.5, 18), mo).rotateX(PI / 2));
  cam.add(mesh(new THREE.CylinderGeometry(rB * 0.8, rB * 0.8, ojo * 2, 14), mo, 0, ojo * 0.9, 0));
  cam.add(mesh(new THREE.CylinderGeometry(rB, rB, Lb - ojo - 5, 24), mc, 0, ojo + (Lb - ojo - 5) / 2, 0));
  cam.add(mesh(new THREE.CylinderGeometry(rB * 1.12, rB * 1.12, 5, 24), mo, 0, Lb - 2.5, 0));
  cam.add(mesh(new THREE.CylinderGeometry(rB * 1.05, rB * 1.05, 3, 24), mo, 0, ojo + 1.5, 0));
  // racores de entrada de aceite
  cam.add(mesh(new THREE.CylinderGeometry(1.1, 1.1, rB + 2.5, 8), mo, rB * 0.5, ojo + 6, 0).rotateZ(PI / 2));
  cam.add(mesh(new THREE.CylinderGeometry(1.1, 1.1, rB + 2.5, 8), mo, rB * 0.5, Lb - 9, 0).rotateZ(PI / 2));
  cam.quaternion.copy(q); cam.position.copy(A0);
  // vástago cromado: ojo delantero en B0 y barra hacia A
  const ojoV = Math.max(rV * 1.6, 3.5);
  vas.add(mesh(new THREE.CylinderGeometry(ojoV, ojoV, rB * 1.4, 16), mo).rotateX(PI / 2));
  vas.add(mesh(new THREE.CylinderGeometry(rV, rV, Lr, 16), mv, 0, -Lr / 2, 0));
  vas.quaternion.copy(q); vas.position.copy(B0);
  return { cam, vas, L0 };
}

export const acabado = {
  pintura: (c, o = {}) => mat(c, { metalness: 0.25, roughness: 0.42, ...o }),
  oscuro: (c = '#2a2d31', o = {}) => mat(c, { metalness: 0.35, roughness: 0.55, ...o }),
  cromo: () => mat('#dfe4ea', { metalness: 0.95, roughness: 0.12 }),
  fundicion: (c = '#5c6066') => mat(c, { metalness: 0.5, roughness: 0.7 }),
  goma: () => mat('#1b1c1e', { metalness: 0, roughness: 0.95 }),
  manguera: () => mat('#141516', { metalness: 0.1, roughness: 0.7 }),
  vidrio: () => { const m = mat('#a9c9d8', { metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.26, depthWrite: false }); m.userData.fijo = true; return m; },
};
