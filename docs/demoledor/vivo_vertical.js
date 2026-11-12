// Capas animadas del modo "Funcionamiento" de los demoledores verticales (modelo_vertical.js). Coordenadas sin escalar:
// cincel = eje Y hacia -Y, cigüeñal con eje X, motor vertical (eje Y) en x = XM. Todo se corre en OFF y se escala por k.
// Cinemática: el cigüeñal gira th = ang*KC; el pistón sale de la biela (exacto para el dibujo); percutor y pieza de golpeo
// reutilizan las curvas APROXIMADAS del demoledor horizontal (vivo.js): el desfase real depende de la carga.
import * as THREE from 'three';
import { V, PI } from '../lib.js';
import { flujo, flecha, rotulo, mb } from '../vivo.js';
import { th, martillo, golpeo } from './vivo.js';

export const XM = 10, YC = 4.5, R = 1.3, L = 7;        // eje del motor, altura del cigüeñal, excentricidad y largo de la biela
export const YP = YC + R - L;                             // pasador del pistón en la posición dibujada (pistón arriba)
export const OFF = V(3.5, 7, 0);                          // corrimiento para que la vista inicial de la herramienta lo encuadre
const KC = 0.3, KI = -KC * 3.6 / 1.3;                     // piñón cónico 1,3 cm y corona 3,6 cm del dibujo; la reducción real no tiene dato
const EX = V(1, 0, 0), EY = V(0, 1, 0), EZ = V(0, 0, 1), ABAJO = V(0, -1, 0);
const AMARILLO = 0xffc83d, ROJO = 0xff5470, AZUL = 0x5aa0ff, BLANCO = 0xffffff, VERDE = 0x4ade80, NARANJA = 0xff9f43;

export const piston = a => R * Math.cos(a) - Math.sqrt(L * L - (R * Math.sin(a)) ** 2) - R + L; // 0 arriba, -2R abajo
const libreV = a => golpeo(a) > 0 || martillo(a) >= 2.3 - 0.08;
const grupo = (...hijos) => { const g = new THREE.Group(); g.add(...hijos); const t = hijos.filter(o => o.userData.tick).map(o => o.userData.tick); g.userData.tick = c => t.forEach(f => f(c)); return g; };
// arco de giro alrededor del eje Y (en x, z) o del eje X (en y, z)
const arcoY = (x, y, z, r, k, o = {}) => flujo(Array.from({ length: 16 }, (_, i) => { const a = i / 15 * PI * 1.6; return V(x + r * Math.cos(a), y, z - Math.sign(k) * r * Math.sin(a)); }), { color: BLANCO, cono: true, n: 3, vel: 0.03 * Math.abs(k), tam: 0.2, r: 0.05, tension: 0.5, ...o });
const arcoX = (x, y, z, r, k, o = {}) => flujo(Array.from({ length: 16 }, (_, i) => { const a = i / 15 * PI * 1.6; return V(x, y + r * Math.cos(a), z + Math.sign(k) * r * Math.sin(a)); }), { color: BLANCO, cono: true, n: 3, vel: 0.03 * Math.abs(k), tam: 0.2, r: 0.05, tension: 0.5, ...o });

export function vivoVertical(k, antivib) {
  const capas = {};

  // corriente: cable -> mango -> gatillo -> campo (+z) -> escobilla -> colector -> escobilla -> campo (-z) -> vuelta (recorrido APROXIMADO)
  const ida = [V(22, -20, 0.5), V(19, -6, 0.8), V(15.6, 13, 0.6), V(13.5, 16, 0.5), V(11, 19.6, 0.5)];
  const bob = s => [V(XM + 2, -6, s * 3.4), V(XM + 2, -16, s * 3.4), V(XM - 2, -16, s * 3.4)];
  capas.corriente = flujo([
    ...ida, V(13.8, 15, 0.9), V(13.8, 10, 0.9), V(13, 0, 3.4), ...bob(1), V(XM, -18.5, 2.9), V(XM, -18.5, 1.3), V(XM + 0.6, -18.2, 0),
    V(XM, -18.5, -1.3), V(XM, -18.5, -2.9), ...bob(-1).reverse(), V(13, 0, -3.4), V(13.8, 10, -0.9), V(11, 19.6, -0.5),
    ...ida.slice(0, 4).reverse().map(p => V(p.x, p.y, -p.z)),
  ], { color: AMARILLO, n: 50, vel: 0.04, tam: 0.17, r: 0.06 });

  capas.sentido = arcoY(XM, -2.6, 0, 3.0, KI);
  capas.reduccion = grupo(arcoY(XM, -0.6, 0, 1.9, KI, { n: 2 }), arcoX(9.6, YC, 0, 4.3, KC, { vel: 0.08 }),
    rotulo('piñón cónico', V(XM + 5, -1, 3), { esc: 1.8, ancho: 3.4 }), rotulo('corona', V(9.6, YC + 6, 2), { esc: 1.8, ancho: 2.2 }));

  // biela: círculo del pasador del cigüeñal (gira en el plano YZ) y flecha con el sentido del pistón
  const fp = flecha(V(0, 0, 0), EY, 2.2, NARANJA, 0.12), fpg = new THREE.Group(); fpg.add(fp);
  fpg.userData.tick = ({ ang }) => { const a = th(ang), s = piston(a + 0.01) - piston(a - 0.01) >= 0 ? 1 : -1; fp.position.set(-3.6, YP + piston(a) - s * 1.1, 0); fp.quaternion.setFromUnitVectors(EY, EY.clone().multiplyScalar(s)); };
  capas.biela = grupo(flujo(Array.from({ length: 24 }, (_, i) => { const a = i / 24 * PI * 2; return V(-0.9, YC + R * Math.cos(a), R * Math.sin(a)); }), { color: BLANCO, cerrado: true, cono: true, n: 4, vel: 0.05, tam: 0.18, r: 0.04, tension: 0.5 }), fpg);

  // colchón de aire entre la cara del pistón y el percutor: rojo = comprimido, azul = vacío
  const col = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 1, 24), mb(ROJO, { opacity: 0.55 })), cC = new THREE.Color(ROJO), cV = new THREE.Color(AZUL);
  col.renderOrder = 8;
  const rC = rotulo('compresión', V(-7, 0, 0), { color: '#ff9aa9', esc: 1.8, ancho: 2.8 }), rV = rotulo('vacío', V(-7, 0, 0), { color: '#9cc3ff', esc: 1.8, ancho: 1.8 });
  const aire = new THREE.Group(); aire.add(col, rC, rV);
  aire.userData.tick = ({ ang }) => {
    const a = th(ang), y1 = YP - 1.6 + piston(a), y0 = -8.5 - martillo(a), h = y1 - y0, u = Math.max(0, Math.min(1, (h - 3.6) / 3.6));
    col.position.set(0, (y0 + y1) / 2, 0); col.scale.set(1, h, 1); col.material.color.copy(cC).lerp(cV, u);
    rC.visible = u < 0.4; rV.visible = u > 0.6; rC.position.y = rV.position.y = (y0 + y1) / 2;
  };
  capas.aire = aire;

  // golpe: destello en el contacto percutor / pieza de golpeo y flecha hacia el cincel
  const flash = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.22, 8, 32), mb(AMARILLO)); flash.rotation.x = PI / 2; flash.position.set(0, -15.8, 0); flash.renderOrder = 9;
  const fg = flecha(V(-3.2, -17, 0), ABAJO, 8, AMARILLO, 0.14), rg = rotulo('golpe', V(-6.5, -21, 2), { color: '#ffd76a', esc: 1.8, ancho: 1.8 });
  const impacto = new THREE.Group(); impacto.add(flash, fg, rg);
  impacto.userData.tick = ({ ang }) => { flash.visible = fg.visible = rg.visible = libreV(th(ang)); };
  capas.impacto = impacto;

  // cincel de referencia (no es parte del equipo): vástago hexagonal en la boca y punta; baja con la pieza de golpeo
  const util = new THREE.Group(), vas = new THREE.Group(), mu = mb(0x7f8b98, { opacity: 0.6 });
  const v0 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 34, 6), mu); v0.position.y = -26 - 17; v0.renderOrder = 8;
  const punta = new THREE.Mesh(new THREE.ConeGeometry(1.5, 4, 6).rotateZ(PI), mu); punta.position.y = -60 - 2; punta.renderOrder = 8;
  vas.add(v0, punta); util.add(vas, rotulo('cincel (referencia)', V(-6, -50, 0), { esc: 1.8, ancho: 4.2 }));
  util.userData.tick = ({ ang }) => { vas.position.y = -golpeo(th(ang)); };
  capas.util = util;

  if (antivib) { // HK-55: Kothman nombra un "sistema antivibración" sin describirlo; se ilustra como gomas entre mango y cárter (supuesto)
    const fh = new THREE.Group(); fh.add(flecha(V(0, 0, 0), EY, 2.4, ROJO, 0.13));
    const av = new THREE.Group(); av.add(fh, rotulo('cuerpo: vibra', V(21, 4, 0), { color: '#ff9aa9', esc: 1.8, ancho: 3.2 }), rotulo('gomas', V(5.5, 12.5, 5), { color: '#a7f3c0', esc: 1.8, ancho: 2 }),
      rotulo('mango: vibra menos', V(5.5, 27, 0), { color: '#a7f3c0', esc: 1.8, ancho: 4.2 }));
    av.userData.tick = ({ ang }) => { const s = Math.sin(th(ang) * 2) >= 0 ? 1 : -1; fh.position.set(18, 4 - s * 1.2, 0); fh.quaternion.setFromUnitVectors(EY, EY.clone().multiplyScalar(s)); };
    capas.antivib = av;
  }

  for (const c of Object.values(capas)) { c.visible = false; c.scale.setScalar(k); c.position.copy(OFF).multiplyScalar(k); }
  const f = fn => c => k * fn(th(c.ang));
  return {
    capas,
    giros: [
      { ids: ['inducido', 'ventilador'], c: V((XM + OFF.x) * k, 0, 0), e: EY, k: KI },
      { ids: ['ciguenal', 'corona'], c: V(0, (YC + OFF.y) * k, 0), e: EX, k: KC },
    ],
    // la biela se traslada con la muñequilla pero no se inclina (igual que en el demoledor horizontal)
    mover: [
      { ids: ['piston', 'biela'], eje: EY, f: f(piston) },
      { ids: ['biela'], eje: EZ, f: f(a => R * Math.sin(a)) },
      { ids: ['percutor'], eje: ABAJO, f: f(martillo) },
      { ids: ['golpeo'], eje: ABAJO, f: f(golpeo) },
    ],
  };
}
