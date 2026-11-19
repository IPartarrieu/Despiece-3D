// Helpers y datos compartidos del PC de torre (unidades: cm; +x frente, +y arriba, +z panel de vidrio; suelo en y = 0).
// Todo sale de contrato.json (generado por scripts_datos/generar_contrato.py): piezas, marcos locales y puntos L.
// Los helpers geométricos (entre, cajaR, tubo, fundir) son copia de retroexcavadora/comun.js, para no depender de esa carpeta.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { V, mat, mesh } from '../lib.js';

export const CONTRATO = await (await fetch(new URL('contrato.json', import.meta.url))).json();
export const PIEZAS = Object.fromEntries(CONTRATO.piezas.map(p => [p.id, p]));
export const L = Object.fromEntries(Object.entries(CONTRATO.layout).map(([k, p]) => [k, V(...p)]));
export const MARCOS = CONTRATO.marcos;

// punto de un marco local -> mundo: en('placa', u, v, h), en('fuente', a, b, c), en('gpu', ...), en('hdd', ...), en('ssd', ...), en('caja', x, y, z)
export function en(marco, a, b, c) {
  const M = MARCOS[marco];
  if (!M) throw new Error(`pctorre: marco desconocido «${marco}»`);
  return V(M.o[0] + a * M.a[0] + b * M.b[0] + c * M.c[0], M.o[1] + a * M.a[1] + b * M.b[1] + c * M.c[1], M.o[2] + a * M.a[2] + b * M.b[2] + c * M.c[2]);
}
// caja alineada a los ejes que ocupa [a0,a1] x [b0,b1] x [c0,c1] en un marco local (los marcos solo permutan y reflejan ejes)
export function cajaEn(marco, [a0, a1], [b0, b1], [c0, c1], m) {
  const p = en(marco, a0, b0, c0), q = en(marco, a1, b1, c1);
  return caja(Math.abs(q.x - p.x), Math.abs(q.y - p.y), Math.abs(q.z - p.z), (p.x + q.x) / 2, (p.y + q.y) / 2, (p.z + q.z) / 2, m);
}
// eje del mundo ('x' | 'y' | 'z') al que apunta un eje local ('a' | 'b' | 'c') de un marco; para orientar cil()/rev() de lib.js
export const ejeDe = (marco, k) => 'xyz'[MARCOS[marco][k].findIndex(v => v !== 0)];
export const pos = id => V(...PIEZAS[id].pos);

// registra piezas: items = [[objetos, dirExplosión?], ...]. Sin dirección se usa la del contrato.
// Cada pieza trae sus propios materiales (la app cambia su opacidad); material.userData.fijo = no tocar (vidrios).
export function armador() {
  const parts = {};
  const add = (id, items, shell) => {
    const c = PIEZAS[id];
    if (!c) console.warn(`pctorre: «${id}» no está en el contrato`);
    if (parts[id]) console.warn(`pctorre: pieza duplicada «${id}»`);
    // tolera [[objetos], dir?], [objeto, dir?] y listas planas [a, b, c]: todo Object3D entra a la pieza; el único Vector3 es la dirección
    const its = items.map(it => { const f = [].concat(it).flat(Infinity), g = new THREE.Group(); f.filter(o => o && o.isObject3D).forEach(o => g.add(o)); return { obj: g, dir: f.find(o => o && o.isVector3) || V(...(c?.explosion || [0, 0, 0])) }; });
    const mats = []; its.forEach(i => i.obj.traverse(o => { if (o.material) { o.userData.pid = id; if (!o.material.userData.fijo) mats.push(o.material); } }));
    parts[id] = { id, nombre: c?.nombre || id, ref: null, grupo: c?.grupo || 'Otras', items: its, mats, shell: shell ?? !!c?.shell };
    return its;
  };
  return { parts, add };
}

// ---------- geometría (copia de retroexcavadora/comun.js) ----------
export const caja = (w, h, d, x, y, z, m) => mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z);
export function entre(p0, p1, r, m, seg = 18, r1 = r) {   // cilindro macizo entre dos puntos
  const d = p1.clone().sub(p0), o = mesh(new THREE.CylinderGeometry(r1, r, d.length(), seg), m);
  o.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); o.position.copy(p0).add(p1).multiplyScalar(0.5); return o;
}
export const tubo = (pts, r, m, tension = 0.3) => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', tension), pts.length * 12, r, 8), m);
export function cajaR(w, h, d, r, x, y, z, m) {           // caja con cantos redondeados (radio r) centrada en (x,y,z)
  const s = new THREE.Shape(), a = w / 2, b = h / 2, e = Math.min(r, d / 4);
  s.moveTo(-a + r, -b); s.lineTo(a - r, -b); s.quadraticCurveTo(a, -b, a, -b + r); s.lineTo(a, b - r); s.quadraticCurveTo(a, b, a - r, b);
  s.lineTo(-a + r, b); s.quadraticCurveTo(-a, b, -a, b - r); s.lineTo(-a, -b + r); s.quadraticCurveTo(-a, -b, -a + r, -b);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * e, bevelEnabled: true, bevelSize: e, bevelThickness: e, bevelSegments: 3, curveSegments: 6 });
  g.translate(0, 0, -(d - 2 * e) / 2);
  return mesh(g, m, x, y, z);
}
// junta en una sola malla varias mallas del mismo material (patas, aletas, chips, pines repetidos): menos llamadas de dibujo.
// Úsalo en vez de InstancedMesh: Box3.expandByObject de three r160 ignora las instancias (fallan selección, corte y prueba).
export function fundir(objs, m) {
  const gs = objs.map(o => { o.updateMatrix(); const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g.applyMatrix4(o.matrix); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k); g.clearGroups(); return g; });
  return mesh(mergeGeometries(gs), m);
}

// acabados: llamar a la función en cada pieza (materiales propios por id)
export const A = {
  pcb: (c = '#1d2a22') => mat(c, { metalness: 0.15, roughness: 0.6 }),          // máscara de soldadura
  silicio: () => mat('#3b3f58', { metalness: 0.6, roughness: 0.25 }),
  encapsulado: (c = '#1a1b1e') => mat(c, { metalness: 0.1, roughness: 0.7 }),  // epoxi negro de chips
  oro: () => mat('#d4a640', { metalness: 1, roughness: 0.3 }),
  cobre: () => mat('#c07a3e', { metalness: 0.9, roughness: 0.3 }),
  niquel: () => mat('#c9cdd2', { metalness: 0.85, roughness: 0.25 }),
  aluminio: (c = '#b9bec5') => mat(c, { metalness: 0.65, roughness: 0.45 }),
  acero: (c = '#2b2e33') => mat(c, { metalness: 0.5, roughness: 0.5 }),       // chapa pintada de la caja
  plastico: (c = '#141518') => mat(c, { metalness: 0, roughness: 0.65 }),
  ferrita: () => mat('#3a3a3c', { metalness: 0.3, roughness: 0.7 }),           // bobinas y chokes
  estano: () => mat('#b8bcc0', { metalness: 0.8, roughness: 0.35 }),
  goma: () => mat('#1b1c1e', { metalness: 0, roughness: 0.95 }),
  vidrio: () => { const m = mat('#9fb7c4', { metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.18, depthWrite: false }); m.userData.fijo = true; return m; },
};
