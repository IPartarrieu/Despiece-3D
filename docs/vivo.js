// Capas animadas del modo "Funcionamiento": flujos (corriente, aire), líneas de campo, flechas y rótulos.
// Cada capa es un THREE.Group; si trae userData.tick({t, ang}) la app lo llama en cada cuadro mientras la capa está visible.
// Todo se dibuja encima del modelo (depthTest apagado) para verse a través de las piezas.
import * as THREE from 'three';
import { lienzo } from './lib.js';

const Y = new THREE.Vector3(0, 1, 0);
export const mb = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, transparent: true, depthTest: false, depthWrite: false, ...o });
const ro = (o, n) => { o.renderOrder = n; return o; };

// camino por puntos con partículas que lo recorren; cono = puntas de flecha orientadas por el camino
export function flujo(pts, { color = 0xffc83d, r = 0.07, n = 14, vel = 0.1, tam = 0.2, cono = false, cerrado = false, sentido = 1, tension = 0.1 } = {}) {
  const curva = new THREE.CatmullRomCurve3(pts, cerrado, 'catmullrom', tension), g = new THREE.Group();
  g.add(ro(new THREE.Mesh(new THREE.TubeGeometry(curva, pts.length * 14, r, 6, cerrado), mb(color, { opacity: 0.3 })), 8));
  const geo = cono ? new THREE.ConeGeometry(tam * 0.8, tam * 2.6, 10) : new THREE.SphereGeometry(tam, 10, 8);
  const bolas = Array.from({ length: n }, () => { const m = ro(new THREE.Mesh(geo, mb(color)), 9); g.add(m); return m; });
  g.userData.tick = ({ t }) => bolas.forEach((m, i) => {
    const u = (((sentido * t * vel + i / n) % 1) + 1) % 1;
    curva.getPointAt(u, m.position);
    if (cono) m.quaternion.setFromUnitVectors(Y, curva.getTangentAt(u).multiplyScalar(sentido));
  });
  return g;
}

// flecha maciza desde o en la dirección d, de largo `largo`
export function flecha(o, d, largo, color, r = 0.1) {
  const g = new THREE.Group(), L = Math.max(largo - r * 5, 0.01);
  const eje = ro(new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 8), mb(color)), 9); eje.position.y = L / 2;
  const punta = ro(new THREE.Mesh(new THREE.ConeGeometry(r * 2.4, r * 5, 12), mb(color)), 9); punta.position.y = L + r * 2.5;
  g.add(eje, punta); g.position.copy(o); g.quaternion.setFromUnitVectors(Y, d.clone().normalize());
  return g;
}

// rótulo siempre de frente a la cámara
export function rotulo(txt, pos, { color = '#fff', fondo = 'rgba(20,24,30,.82)', esc = 1.5, ancho = 1 } = {}) {
  const w = 128 * ancho, t = lienzo(w, 96, (g) => {
    g.fillStyle = fondo; g.beginPath(); g.roundRect(4, 4, w - 8, 88, 22); g.fill();
    g.fillStyle = color; g.font = 'bold 54px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, 52);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }));
  s.position.copy(pos); s.scale.set(esc * ancho * 1.33, esc, 1); s.renderOrder = 10;
  return s;
}
