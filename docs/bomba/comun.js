// Helpers comunes de los modelos de bomba (unidades: cm). El catálogo de piezas de cada modelo está en data.json -> catalogoPorModelo.
import * as THREE from 'three';
import { PI, V, mesh } from '../lib.js';

export const CAT = await (await fetch(new URL('data.json', import.meta.url))).json();

// registra piezas: items = [[objetos, dirección de explosión], ...]; cada pieza debe traer sus propios materiales
export function armador(mod) {
  const parts = {};
  const add = (id, items, shell = false) => {
    const c = CAT.catalogoPorModelo[mod]?.[id];
    if (!c) console.warn(`bomba: ${mod} sin «${id}» en el catálogo`);
    const its = items.map(([objs, dir]) => { const g = new THREE.Group(); [].concat(objs).forEach(o => g.add(o)); return { obj: g, dir }; });
    const mats = []; its.forEach(i => i.obj.traverse(o => { if (o.material) { o.userData.pid = id; mats.push(o.material); } }));
    parts[id] = { id, nombre: c?.[1] ? `${c[0]} (${c[1]})` : c?.[0] || id, ref: c?.[1] ?? null, grupo: c?.[2] || 'Otras', items: its, mats, shell };
  };
  return { parts, add };
}

// tubo por puntos (cables, cañerías, chasis)
export const tubo = (pts, r, m, cerrado = false, tension = 0.2) =>
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, cerrado, 'catmullrom', tension), pts.length * 14, r, 12, cerrado), m);

// resorte helicoidal entre p0 y p1
export function resorte(p0, p1, r, vueltas, rw, m) {
  const d = p1.clone().sub(p0), L = d.length(), pts = [], N = vueltas * 16;
  for (let i = 0; i <= N; i++) { const t = i / N, a = t * vueltas * PI * 2; pts.push(V(r * Math.cos(a), t * L, r * Math.sin(a))); }
  const o = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N * 2, rw, 6), m);
  o.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); o.position.copy(p0); return o;
}

// anillo (toro) con su eje en x | y | z
export function aro(ax, r, t, m, x, y, z) {
  const o = mesh(new THREE.TorusGeometry(r, t, 10, 48), m, x, y, z);
  if (ax === 'x') o.rotation.y = PI / 2; else if (ax === 'y') o.rotation.x = PI / 2;
  return o;
}

// aleta cuadrada con agujero redondo, en el plano XZ, espesor t (para el cilindro del motor)
export function aleta(w, d, rh, t, m, y) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, -d / 2); s.lineTo(w / 2, -d / 2); s.lineTo(w / 2, d / 2); s.lineTo(-w / 2, d / 2); s.closePath();
  s.holes.push(new THREE.Path().absarc(0, 0, rh, 0, PI * 2, true));
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 24 }); g.rotateX(-PI / 2);
  return mesh(g, m, 0, y, 0);
}

// grupo inclinado alrededor de X (cilindro del motor 170F)
export function inclinado(ang, y0, ...objs) { const g = new THREE.Group(); g.rotation.x = ang; g.position.y = y0; g.add(...objs); return g; }
