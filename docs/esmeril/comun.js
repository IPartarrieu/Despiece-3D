// Helpers comunes de los esmeriles modelados a partir de despieces oficiales. Unidades: cm.
// Eje del motor = X (husillo en x=0, motor hacia -X), eje del husillo = Y (disco abajo), +Z = derecha del operador.
import * as THREE from 'three';
import { PI, V, mat, acero, mesh, cil, caja, rev, tornillo, lienzo, rodamiento } from '../lib.js';

export const YM = 2.3; // altura del eje del motor sobre el plano del disco (aproximada)

// registro de piezas: items = [[objetos, dirección de desmontaje], ...]
export function piezas() {
  const parts = {};
  const add = (id, nombre, grupo, ref, items, shell = false) => {
    const its = items.map(([objs, dir]) => { const g = new THREE.Group(); [].concat(objs).forEach(o => g.add(o)); return { obj: g, dir }; });
    const mats = [];
    its.forEach(i => i.obj.traverse(o => { if (o.material) { o.userData.pid = id; mats.push(o.material); } }));
    parts[id] = { id, nombre, grupo, ref, items: its, mats, shell };
  };
  return { parts, add };
}

export const gris = () => mat('#7d838b', { metalness: 0.75, roughness: 0.4 });
export const alu = () => mat('#b9bec5', { metalness: 0.65, roughness: 0.45 });
export const brillo = () => acero('#cfd3d8', { metalness: 0.8, roughness: 0.3 });

// varios tornillos iguales: lista de [x, y, z], eje de la cabeza
export const tornillos = (ax, pos, r = 0.17) => pos.map(([x, y, z]) => tornillo(ax, x, y, z, r));
// tornillo largo (vástago visible), eje X, cabeza hacia +X
export const perno = (x0, x1, y, z, r = 0.12) => [cil('x', r, r, x1 - x0, (x0 + x1) / 2, y, z, acero('#9aa0a7'), 10), cil('x', r * 2, r * 2, 0.18, x1, y, z, acero('#4a4f56'), 14)];
export const arandela = (ax, ro, ri, w, x, y, z, m = acero('#b3b8bf')) => {
  const s = new THREE.Shape().absarc(0, 0, ro, 0, PI * 2, false); s.holes.push(new THREE.Path().absarc(0, 0, ri, 0, PI * 2, true));
  const g = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false, curveSegments: 36 }); g.translate(0, 0, -w / 2);
  if (ax === 'x') g.rotateY(PI / 2); else if (ax === 'y') g.rotateX(PI / 2);
  return mesh(g, m, x, y, z);
};
export const oring = (ax, r, t, x, y, z) => { const o = mesh(new THREE.TorusGeometry(r, t, 8, 40), mat('#1d1f22', { metalness: 0, roughness: 0.9 }), x, y, z); if (ax === 'x') o.rotation.y = PI / 2; else if (ax === 'y') o.rotation.x = PI / 2; return o; };
export { rodamiento };

// corona cónica (dientes en la cara superior), centrada en el husillo
export function corona(y, R, n, m = gris()) {
  const o = [cil('y', R, R * 0.68, 0.7, 0, y, 0, m, 48), cil('y', 0.5, 0.5, 0.9, 0, y - 0.3, 0, m, 24)];
  for (let i = 0; i < n; i++) { const g = new THREE.Group(); g.rotation.y = i / n * PI * 2 + 0.2; const t = caja(0.14, 0.75, 0.22, R * 0.86, y + 0.05, 0, m); t.rotation.z = -0.71; t.rotation.y = 0.35; g.add(t); o.push(g); }
  return o;
}
// piñón cónico sobre el eje del motor (punta hacia +X)
export function pinon(x0, x1, n, m = gris()) {
  const xc = (x0 + x1) / 2, L = x1 - x0, o = [cil('x', 0.42, 0.72, L, xc, YM, 0, m, 22)];
  for (let i = 0; i < n; i++) { const g = new THREE.Group(); g.rotation.x = i / n * PI * 2; g.position.set(0, YM, 0); const t = caja(L, 0.26, 0.26, xc, 0.6, 0, m); t.rotation.z = -0.17; t.rotation.y = 0.3; g.add(t); o.push(g); }
  return o;
}
// disco de centro deprimido (A04 / accesorio): solo el rótulo con el diámetro
export function disco(R, y, txt) {
  const tex = lienzo(512, 512, (g, w, h) => {
    g.fillStyle = '#34464f'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#dcd6c0'; g.beginPath(); g.arc(256, 256, 170, 0, PI * 2); g.arc(256, 256, 70, 0, PI * 2, true); g.fill('evenodd');
    g.fillStyle = '#1b2227'; g.textAlign = 'center'; g.font = 'bold 34px sans-serif'; g.fillText(txt, 256, 200); g.font = 'bold 30px sans-serif'; g.fillText('DESBASTE', 256, 330);
  });
  const c = mesh(new THREE.CircleGeometry(R - 0.03, 72), mat('#fff', { map: tex, metalness: 0, roughness: 0.85 }), 0, y + 0.31, 0); c.rotation.x = -PI / 2;
  return [rev([[R - 0.03, y], [R, y + 0.03], [R, y + 0.27], [R - 0.03, y + 0.3], [1.6, y + 0.3], [1.3, y + 0.6], [0.8, y + 0.6], [0.8, y + 0.3], [1.1, y], [R - 0.03, y]], 'y', mat('#41575f', { metalness: 0, roughness: 0.9 }), 72), c];
}
// tuerca de brida con dos agujeros para la llave de pernos
export function tuercaBrida(y, R, m = acero('#b3b8bf')) {
  const s = new THREE.Shape().absarc(0, 0, R, 0, PI * 2, false);
  for (const sx of [-R * 0.6, R * 0.6]) s.holes.push(new THREE.Path().absarc(sx, 0, 0.18, 0, PI * 2, true));
  s.holes.push(new THREE.Path().absarc(0, 0, 0.42, 0, PI * 2, true));
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2, curveSegments: 40 }); g.rotateX(PI / 2);
  return [mesh(g, m, 0, y, 0), cil('y', 0.75, 0.75, 0.3, 0, y + 0.12, 0, m, 32, true)];
}
// protector de disco: media falda + tapa + collar; ph = ángulo de inicio de la media vuelta
export function protector(R, y, rCollar, m, ph = PI) {
  return [
    rev([[R, y - 0.75], [R + 0.12, y - 0.65], [R + 0.12, y - 0.35], [R, y - 0.25], [R, y + 0.2]], 'y', m, 72, 0, 0, 0, ph, PI),
    cil('y', R, R, 0.12, 0, y + 0.25, 0, m, 72, false, ph, PI),
    cil('y', rCollar, rCollar, 0.6, 0, y + 0.55, 0, m, 40, true),
  ];
}
// cuadrado de lado 2h con esquinas redondeadas (radio r), en el plano YZ: se extruye a lo largo de X
export function cuadro(h, r = 1.0) {
  const s = new THREE.Shape();
  s.moveTo(-h + r, -h); s.lineTo(h - r, -h); s.quadraticCurveTo(h, -h, h, -h + r); s.lineTo(h, h - r); s.quadraticCurveTo(h, h, h - r, h);
  s.lineTo(-h + r, h); s.quadraticCurveTo(-h, h, -h, h - r); s.lineTo(-h, -h + r); s.quadraticCurveTo(-h, -h, -h + r, -h);
  return s;
}
export { V, PI, mat, acero, mesh, cil, caja, rev, tornillo };
