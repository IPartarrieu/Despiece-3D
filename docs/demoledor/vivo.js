// Capas animadas del modo "Funcionamiento" del demoledor. Coordenadas de modelo.js (sin escalar): cincel = X hacia +X,
// motor y cigüeñal verticales (Y). Todo se escala por k al final, igual que las piezas.
// Cinemática: el cigüeñal gira th = ang*KC; el pistón sale de la biela (exacto); el martillo y el contrapeso son APROXIMADOS:
// el martillo vuela libre sobre el aire y su desfase con el pistón depende de la carga, aquí es un desfase fijo ilustrativo.
import * as THREE from 'three';
import { V, PI } from '../lib.js';
import { flujo, flecha, rotulo, mb } from '../vivo.js';

const XM = -4.4, XC = 3.7, XG = -0.75;                  // ejes del inducido, cigüeñal y engranaje doble (modelo.js)
const R = 1.3, L = 5.4;                                   // excentricidad del cigüeñal y largo de la biela del dibujo
const KC = 0.3;                                           // vueltas del cigüeñal por radián de ang (un golpe cada ~5 s a velocidad 1)
const KD = -KC * 40 / 12, KI = -KD * 2.9 / 0.75;          // engranaje doble y motor, por los dientes y radios dibujados (≈ 1:13)
const G = 2.3, FI = 1.6;                                  // hueco martillo -> pieza de golpeo; desfase del martillo (aprox.)
const EX = V(1, 0, 0), EY = V(0, 1, 0), EZ = V(0, 0, 1);
const AMARILLO = 0xffc83d, ROJO = 0xff5470, AZUL = 0x5aa0ff, BLANCO = 0xffffff, VERDE = 0x4ade80, NARANJA = 0xff9f43;

export const th = ang => ang * KC;
export const piston = a => R * Math.cos(a) + Math.sqrt(L * L - (R * Math.sin(a)) ** 2) - R - L;   // 0 adelante, -2R atrás
const libre = a => -0.6 + 3.3 * (0.5 + 0.5 * Math.cos(a - FI));      // recorrido del martillo si no hubiera tope
export const martillo = a => Math.min(libre(a), G);
export const golpeo = a => Math.max(0, libre(a) - G);                   // avance de la pieza de golpeo (exagerado)
export const contrapeso = a => 0.3 * Math.sin(a - FI / 2);              // exagerado, desfase ilustrativo
const d = (f, a) => f(a + 0.01) - f(a - 0.01);                          // sentido del movimiento
const grupo = (...hijos) => { const g = new THREE.Group(); g.add(...hijos); const t = hijos.filter(o => o.userData.tick).map(o => o.userData.tick); g.userData.tick = c => t.forEach(f => f(c)); return g; };
// arco alrededor de un eje vertical que sigue el sentido de un giro de factor k (giro positivo sobre +Y: z = -sen)
const arco = (x, y, z, r, k, o = {}) => flujo(Array.from({ length: 16 }, (_, i) => { const a = i / 15 * PI * 1.6; return V(x + r * Math.cos(a), y, z - Math.sign(k) * r * Math.sin(a)); }), { color: BLANCO, cono: true, n: 3, vel: 0.03 * Math.abs(k), tam: 0.2, r: 0.05, tension: 0.5, ...o });

export function vivoDemoledor(k) {
  const capas = {};

  // corriente: cable -> mango -> interruptor -> módulo electrónico -> campo (+z) -> escobilla -> colector -> escobilla -> campo (-z) -> vuelta
  // recorrido de los cables APROXIMADO: el manual no trae el esquema eléctrico
  const bob = s => [V(XM + 1.6, 2.2, s * 3.3), V(XM + 1.6, -3.6, s * 3.3), V(XM - 1.6, -3.6, s * 3.3), V(XM - 1.6, 2.2, s * 3.3)];
  capas.corriente = flujo([
    V(-16.5, -19, 0.5), V(-13, -16, 1.2), V(-11.2, -12.5, 0.4), V(-10.4, -9.5, 0.3), V(-9.7, -5, 0.3), V(-9.6, 1, 0.3), V(-10, 6, 0.4), V(-11.3, 7.9, 0.6), V(-13, 7.9, 0.6),
    V(-11.2, 7.9, 0.9), V(-9.6, 6.5, 1.5), V(-7, 6.8, 1.5), V(-2, 7.3, 1.3), V(1.2, 7.3, 1.4), V(0.4, 5.5, 2.4), V(-2, 3.4, 3.3),
    ...bob(1), V(XM - 3.2, 2.9, 1.2), V(XM - 2.4, 2.75, 0.2), V(XM - 1.3, 2.75, 0.2), V(XM, 2.3, 0.6), V(XM + 1.3, 2.75, 0.2), V(XM + 2.4, 2.75, 0.2), V(XM + 3.2, 2.9, -1.2),
    ...bob(-1), V(XM - 3.2, 3.6, -2.2), V(-9.0, 5.0, -1.4), V(-11.3, 7.9, -0.6), V(-13, 7.9, -0.6), V(-10, 6, -0.4), V(-9.6, 1, -0.3), V(-9.7, -5, -0.3), V(-10.4, -9.5, -0.3),
    V(-11.2, -12.5, 0.1), V(-13, -16, 0.9), V(-16.5, -19.2, 0.2),
  ], { color: AMARILLO, n: 54, vel: 0.04, tam: 0.17, r: 0.06 });

  // sentido de giro del inducido (arco sobre el ventilador)
  capas.sentido = arco(XM, 6.4, 0, 3.0, KI);

  // anillo magnético del ventilador (documentado) y lectura de velocidad por el módulo (ubicación del sensor NO documentada)
  const imanes = Array.from({ length: 8 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), mb(i % 2 ? AZUL : ROJO)); m.renderOrder = 9; return m; });
  const sensor = new THREE.Group(); sensor.add(...imanes, flecha(V(-1.0, 5.6, 0), V(1, 0.75, 0), 2.6, VERDE, 0.09), rotulo('anillo magnético', V(XM - 3, 8.6, 2), { esc: 1.8, ancho: 3.4 }), rotulo('módulo', V(3.6, 10.2, 0), { esc: 1.8, ancho: 2.2 }));
  sensor.userData.tick = ({ ang }) => imanes.forEach((m, i) => { const a = i / 8 * PI * 2 + ang * KI; m.position.set(XM + 2.9 * Math.cos(a), 5.0, -2.9 * Math.sin(a)); });
  capas.sensor = sensor;

  // reducción: sentido de cada engranaje
  capas.reduccion = grupo(arco(XM, -6.0, 0, 1.4, KI, { n: 2 }), arco(XG, -6.2, 0, 3.4, KD), arco(XC, -10.0, 0, 4.0, KC, { vel: 0.08 }),
    rotulo('motor', V(XM - 2, -11.5, 3), { esc: 1.8, ancho: 2 }), rotulo('doble', V(XG + 1, -5.2, 5), { esc: 1.8, ancho: 2 }), rotulo('cigüeñal', V(XC + 2, -12.5, 0), { esc: 1.8, ancho: 2.6 }));

  // biela: círculo del pasador del cigüeñal y flecha con el sentido del pistón
  const fp = flecha(V(0, 0, 0), EX, 2.2, NARANJA, 0.12), fpg = new THREE.Group(); fpg.add(fp);
  fpg.userData.tick = ({ ang }) => { const a = th(ang), s = d(piston, a) >= 0 ? 1 : -1; fp.position.set(10.4 + piston(a) - s * 1.1, 2.9, 0); fp.quaternion.setFromUnitVectors(EY, EX.clone().multiplyScalar(s)); };
  capas.biela = grupo(flujo(Array.from({ length: 24 }, (_, i) => { const a = i / 24 * PI * 2; return V(XC + R * Math.cos(a), 1.0, -R * Math.sin(a)); }), { color: BLANCO, cerrado: true, cono: true, n: 4, vel: 0.05, tam: 0.18, r: 0.04, tension: 0.5 }), fpg);

  // colchón de aire entre el pistón y el martillo: rojo = comprimido, azul = vacío (por el largo del hueco)
  const geo = new THREE.CylinderGeometry(2.05, 2.05, 1, 24); geo.rotateZ(PI / 2);
  const col = new THREE.Mesh(geo, mb(ROJO, { opacity: 0.55 })), cC = new THREE.Color(ROJO), cV = new THREE.Color(AZUL);
  col.renderOrder = 8;
  const rC = rotulo('compresión', V(0, 4.6, 0), { color: '#ff9aa9', esc: 1.8, ancho: 2.8 }), rV = rotulo('vacío', V(0, 4.6, 0), { color: '#9cc3ff', esc: 1.8, ancho: 1.8 });
  const aire = new THREE.Group(); aire.add(col, rC, rV);
  aire.userData.tick = ({ ang }) => {
    const a = th(ang), x0 = 11.6 + piston(a), x1 = 15 + martillo(a), h = x1 - x0, u = Math.max(0, Math.min(1, (h - 3.6) / 3.6));
    col.position.set((x0 + x1) / 2, 0, 0); col.scale.set(h, 1, 1); col.material.color.copy(cC).lerp(cV, u);
    rC.visible = u < 0.4; rV.visible = u > 0.6; rC.position.x = rV.position.x = (x0 + x1) / 2;
  };
  capas.aire = aire;

  // golpe: destello en el contacto martillo / pieza de golpeo y flecha del golpe hacia la herramienta
  const flash = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.22, 8, 32), mb(AMARILLO)); flash.rotation.y = PI / 2; flash.position.set(21.6, 0, 0); flash.renderOrder = 9;
  const fg = flecha(V(22.4, 0, 3.0), EX, 8, AMARILLO, 0.14), rg = rotulo('golpe', V(26, 2.6, 4.6), { color: '#ffd76a', esc: 1.8, ancho: 1.8 });
  const impacto = new THREE.Group(); impacto.add(flash, fg, rg);
  impacto.userData.tick = ({ ang }) => { const v = libre(th(ang)) > G - 0.08; flash.visible = fg.visible = rg.visible = v; };
  capas.impacto = impacto;

  // herramienta de referencia (no viene en el despiece): vástago en el husillo y punta; avanza con la pieza de golpeo
  const util = new THREE.Group(), vas = new THREE.Group(), mu = mb(0x7f8b98, { opacity: 0.6 });
  vas.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 18, 6).rotateZ(PI / 2), mu), { renderOrder: 8 }));
  vas.children[0].position.x = 29.7 + 9;
  const punta = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3, 6).rotateZ(-PI / 2), mu); punta.position.x = 47.7 + 1.5; punta.renderOrder = 8; vas.add(punta);
  util.add(vas, rotulo('cincel (referencia)', V(40, 2.4, 0), { esc: 1.8, ancho: 4.2 }));
  util.userData.tick = ({ ang }) => { vas.position.x = golpeo(th(ang)); };
  capas.util = util;

  // antivibración: el contrapeso se mueve contra la carcasa (flechas opuestas; amplitud y desfase ilustrativos)
  const fc = new THREE.Group(), fh = new THREE.Group(); fc.add(flecha(V(0, 0, 0), EY, 2.4, VERDE, 0.13)); fh.add(flecha(V(0, 0, 0), EY, 2.4, ROJO, 0.13));
  const antivib = new THREE.Group(); antivib.add(fc, fh, rotulo('contrapeso', V(16.2, 7.6, 0), { color: '#a7f3c0', esc: 1.8, ancho: 2.8 }), rotulo('carcasa', V(-1, 12.6, 0), { color: '#ff9aa9', esc: 1.8, ancho: 2.2 }));
  antivib.userData.tick = ({ ang }) => {
    const s = d(contrapeso, th(ang)) >= 0 ? 1 : -1;
    fc.position.set(16.2 - s * 1.2, 5.8, 0); fc.quaternion.setFromUnitVectors(EY, EX.clone().multiplyScalar(s));
    fh.position.set(-1 + s * 1.2, 10.8, 0); fh.quaternion.setFromUnitVectors(EY, EX.clone().multiplyScalar(-s));
  };
  capas.antivib = antivib;

  for (const c of Object.values(capas)) { c.visible = false; c.scale.setScalar(k); }
  const f = fn => c => k * fn(th(c.ang));
  return {
    capas,
    giros: [
      { ids: ['inducido', 'ventilador'], c: V(XM * k, 0, 0), e: EY, k: KI },
      { ids: ['engranaje_doble'], c: V(XG * k, 0, 0), e: EY, k: KD },
      { ids: ['cigueñal', 'engranaje_cig'], c: V(XC * k, 0, 0), e: EY, k: KC },
    ],
    // la biela se traslada con el pasador del cigüeñal pero no se inclina (falta un giro oscilante en la app): el ojo chico resbala por el pasador del pistón
    mover: [
      { ids: ['piston', 'biela'], eje: EX, f: f(piston) },
      { ids: ['biela'], eje: EZ, f: f(a => -R * Math.sin(a)) },
      { ids: ['martillo'], eje: EX, f: f(martillo) },
      { ids: ['pieza_golpeo'], eje: EX, f: f(golpeo) },
      { ids: ['antivibracion:1'], eje: EX, f: f(contrapeso) },
    ],
  };
}
