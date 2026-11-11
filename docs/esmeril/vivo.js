// Capas animadas del modo "Funcionamiento" de los esmeriles. Coordenadas del modelo: eje del motor = X (cabezal en +X), husillo = Y.
// Sentidos: el inducido gira con signo -1 sobre +X y el husillo con +relación sobre +Y (los dientes cónicos del piñón y la corona lo exigen).
import * as THREE from 'three';
import { V, PI } from '../lib.js';
import { YM } from './comun.js';
import { flujo, flecha, rotulo, mb } from '../vivo.js';

const Y = YM, EX = V(1, 0, 0), EY = V(0, 1, 0), C = V(0, Y, 0);
const NARANJA = 0xff9f43, CELESTE = 0x4dd0ff, ROJO = 0xff5470, AMARILLO = 0xffc83d, AIRE = 0x7dd3fc;

// vueltas de una bobina alrededor de un polo (eje Z), de z0 a z1; el sentido horario visto desde +Z crea campo hacia -Z
const bobina = (z0, z1, vueltas = 3) => {
  const c = [[-13, 0.65], [-7.2, 0.65], [-7.2, -0.65], [-13, -0.65]], p = [];
  for (let i = 0; i <= vueltas * 4; i++) { const [x, y] = c[i % 4]; p.push(V(x, Y + y, z0 + (z1 - z0) * i / (vueltas * 4))); }
  return p;
};

// lazo de campo en un plano YZ a la altura x: cruza el inducido de +Z a -Z y vuelve por el núcleo del campo
const lazo = (x, s) => [[1.5, .55], [0, .55], [-1.5, .55], [-2, .8], [-2.25, 1.35], [-1.6, 2], [0, 2.2], [1.6, 2], [2.25, 1.35], [2, .8]].map(([z, y]) => V(x, Y + s * y, z));

export function vivoGA4530() {
  const capas = {};

  // corriente: enchufe -> interruptor -> bobina del campo A -> bobina B -> carbón superior -> inducido -> carbón inferior -> neutro
  capas.corriente = flujo([
    V(-36, Y - 4, 0.8), V(-33, Y - 0.8, 0.4), V(-30.3, Y, 0.1), V(-24, Y, 0.15), V(-21.4, Y - 0.5, 0.2), V(-19.2, Y - 0.2, 0.4), V(-17.5, Y + 0.2, 1.2), V(-15, Y + 0.4, 2.0),
    ...bobina(2.3, 1.7),
    V(-14.6, Y + 0.9, 1.4), V(-14.9, Y + 1.0, 0), V(-14.6, Y + 0.9, -1.4),
    ...bobina(-1.7, -2.3),
    V(-14.2, Y + 1.5, -1.0), V(-13.8, Y + 1.9, 0.3), V(-13.5, Y + 1.25, 0), V(-13.5, Y + 0.85, 0),
    V(-13, Y + 1.2, 0.8), V(-12.3, Y + 0.5, 1.3), V(-7.9, Y + 0.5, 1.3), V(-7.6, Y, 0), V(-7.9, Y - 0.5, -1.3), V(-12.3, Y - 0.5, -1.3), V(-13, Y - 1.2, -0.8), V(-13.5, Y - 0.85, -0.1),
    V(-13.5, Y - 1.25, 0), V(-13.5, Y - 2.0, 0.3), V(-16, Y - 1.6, -1.0), V(-20, Y - 0.9, -0.9), V(-21.4, Y - 0.6, -0.4), V(-25, Y - 0.2, -0.3), V(-30.3, Y - 0.2, -0.2), V(-33, Y - 0.9, 0), V(-36.2, Y - 4, 0.1),
  ], { color: AMARILLO, n: 46, vel: 0.05, tam: 0.17, r: 0.06 });

  // campo magnético: seis lazos cerrados (tres posiciones x dos alturas), con puntas de flecha que indican el sentido
  const campo = new THREE.Group();
  for (const x of [-11.6, -10, -8.4]) for (const s of [1, -1]) campo.add(flujo(lazo(x, s), { color: 0x6aa9ff, cerrado: true, cono: true, n: 8, vel: 0.07, tam: 0.2, r: 0.05, tension: 0.5 }));
  campo.add(rotulo('N', V(-10, Y, 4), { color: '#ff8a8a', esc: 1.1 }), rotulo('S', V(-10, Y, -4), { color: '#8ab8ff', esc: 1.1 }));
  const tickCampo = campo.children.filter(o => o.userData.tick).map(o => o.userData.tick);
  campo.userData.tick = c => tickCampo.forEach(f => f(c));
  capas.campo = campo;

  // conductores del inducido: 12 lados de bobina que giran; la corriente cambia de sentido al cruzar la línea de los carbones
  const cond = new THREE.Group(), lados = [];
  for (let i = 0; i < 12; i++) {
    const g = new THREE.Group(), ada = flecha(V(-12.3, 0, 0), EX, 4.4, NARANJA, 0.09), atr = flecha(V(-7.9, 0, 0), EX.clone().negate(), 4.4, CELESTE, 0.09);
    g.add(ada, atr); cond.add(g); lados.push({ g, ada, atr });
  }
  cond.userData.tick = ({ ang }) => lados.forEach(({ g, ada, atr }, i) => {
    const a = i / 12 * PI * 2 - ang, s = Math.sin(a);   // posición angular del lado (el inducido gira con signo -1)
    g.position.set(0, Y + 1.36 * Math.cos(a), 1.36 * s);
    ada.visible = s > 0.3; atr.visible = s < -0.3;
  });
  capas.conductores = cond;

  // fuerza sobre los conductores bajo cada polo
  const fuerza = new THREE.Group();
  fuerza.add(flecha(V(-10, Y, 1.5), EY, 2.6, ROJO, 0.12), flecha(V(-10, Y, -1.5), EY.clone().negate(), 2.6, ROJO, 0.12));
  fuerza.add(rotulo('F', V(-10, Y + 3.1, 1.5), { color: '#ff9aa9', esc: 1.1 }), rotulo('F', V(-10, Y - 3.1, -1.5), { color: '#ff9aa9', esc: 1.1 }));
  capas.fuerza = fuerza;

  // sentido de giro del inducido (arco alrededor del eje, visto desde el ventilador)
  capas.sentido = flujo(Array.from({ length: 16 }, (_, i) => { const a = -i / 15 * PI * 1.6; return V(-5.2, Y + 2.9 * Math.cos(a), 2.9 * Math.sin(a)); }), { color: 0xffffff, cono: true, n: 3, vel: 0.1, tam: 0.2, r: 0.05, tension: 0.5 });

  // aire de enfriamiento: entra por la tapa trasera, pasa por colector, inducido y campo, y sale por las rendijas junto al ventilador (ruta típica, no dibujada en el despiece)
  const aire = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * PI * 2 + 0.3, c = Math.cos(a), s = Math.sin(a);
    aire.add(flujo([V(-22.5, Y + 2.3 * c, 2.3 * s), V(-17, Y + 1.9 * c, 1.9 * s), V(-10, Y + 1.9 * c, 1.9 * s), V(-6.8, Y + 2.1 * c, 2.1 * s), V(-5.2, Y + 3.5 * c, 3.5 * s)], { color: AIRE, cono: true, n: 6, vel: 0.07, tam: 0.2, r: 0.05, tension: 0.4 }));
  }
  const tickAire = aire.children.map(o => o.userData.tick);
  aire.userData.tick = c => tickAire.forEach(f => f(c));
  capas.aire = aire;

  for (const c of Object.values(capas)) c.visible = false;
  return {
    capas,
    giros: [
      { ids: ['inducido', 'ventilador', 'pinon', 'tuercaM6', 'aislante'], c: C, e: EX, k: -1 },
      { ids: ['corona', 'husillo', 'brida', 'tuerca', 'disco'], c: V(0, 0, 0), e: EY, k: 10 / 37 },
    ],
  };
}

// ---------- Milwaukee M18 FUEL (sin escobillas) ----------
// El rotor lleva 4 imanes y el estator se dibuja con 6 dientes: es un esquema ilustrativo; la lista de piezas no da el número de polos ni de dientes.
const ROJO_N = 0xff6b6b, AZUL_S = 0x5aa0ff, APAGADO = 0x59616b, VERDE = 0x4ade80;
const esfera = (r, c) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mb(c)); m.renderOrder = 9; return m; };

export function vivoM18() {
  const capas = {}, XR = -9.3;

  // batería -> terminales -> interruptor -> placa de potencia -> devanados del estator
  const anillo = Array.from({ length: 17 }, (_, i) => { const a = -i / 16 * PI * 2; return V(-12.05, Y + 2.4 * Math.cos(a), 2.4 * Math.sin(a)); });
  capas.corriente = flujo([V(-27.1, Y - 5, 0.5), V(-26, Y - 3.4, 0.5), V(-24, Y - 2, 0.4), V(-20, Y - 1.2, 0.35), V(-17, Y - 0.7, 0.3), V(-14, Y + 0.6, 0.2), V(-12.6, Y + 1.4, 0.4), ...anillo],
    { color: AMARILLO, n: 40, vel: 0.05, tam: 0.17, r: 0.06 });

  // imanes del rotor (4, alternando N y S) que giran con él; cada capa lleva su propio juego
  const ang0 = ang => -ang;   // el rotor gira con signo -1 sobre +X
  const juegoImanes = () => {
    const g = new THREE.Group(), ms = Array.from({ length: 4 }, (_, i) => { const m = esfera(0.3, i % 2 ? AZUL_S : ROJO_N); g.add(m); return m; });
    g.userData.tick = ({ ang }) => ms.forEach((m, i) => { const a = i * PI / 2 + ang0(ang); m.position.set(XR, Y + 1.46 * Math.cos(a), 1.46 * Math.sin(a)); });
    return g;
  };

  // sensores Hall sobre la placa: se encienden cuando pasa un imán (color según el polo)
  const hall = new THREE.Group(), sens = [0, 1, 2].map(i => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mb(APAGADO)); s.renderOrder = 9; s.userData.a = i * PI * 2 / 3 + 0.5; hall.add(s); s.position.set(-12.6, Y + 1.75 * Math.cos(s.userData.a), 1.75 * Math.sin(s.userData.a)); return s; });
  hall.add(rotulo('Hall', V(-12.6, Y + 3.3, 0), { esc: 0.8, ancho: 1.3 }));
  hall.userData.tick = ({ ang }) => {
    mh.userData.tick({ ang });
    sens.forEach(s => {
      let mejor = 9, pol = 0;
      [0, 1, 2, 3].forEach(i => { let d = Math.atan2(Math.sin(i * PI / 2 + ang0(ang) - s.userData.a), Math.cos(i * PI / 2 + ang0(ang) - s.userData.a)); if (Math.abs(d) < Math.abs(mejor)) { mejor = d; pol = i % 2; } });
      s.material.color.setHex(Math.abs(mejor) < 0.45 ? (pol ? AZUL_S : ROJO_N) : APAGADO);
    });
  };
  const mh = juegoImanes(); hall.add(mh);
  capas.hall = hall;

  // campo giratorio: la electrónica activa en secuencia pares de dientes del estator; el rotor sigue ese campo
  const fase = new THREE.Group(), dientes = Array.from({ length: 6 }, (_, k) => { const m = esfera(0.4, APAGADO); m.position.set(XR, Y + 2.05 * Math.cos(k * PI / 3), 2.05 * Math.sin(k * PI / 3)); fase.add(m); return m; });
  const eje = flecha(V(XR, Y, 0), EY, 3.6, 0xffffff, 0.1); fase.add(eje);
  fase.userData.tick = ({ ang }) => {
    const paso = Math.floor(ang0(ang) / (PI / 3)), n = (((paso + 1) % 6) + 6) % 6, s = (n + 3) % 6;
    dientes.forEach((m, k) => m.material.color.setHex(k === n ? ROJO_N : k === s ? AZUL_S : APAGADO));
    const a = n * PI / 3; eje.position.set(XR, Y - 1.8 * Math.cos(a), -1.8 * Math.sin(a));
    eje.quaternion.setFromUnitVectors(EY, V(0, Math.cos(a), Math.sin(a)));
    mf.userData.tick({ ang });
  };
  const mf = juegoImanes(); fase.add(mf);
  capas.fase = fase;

  for (const c of Object.values(capas)) c.visible = false;
  return {
    capas,
    giros: [
      { ids: ['rotor31', 'pinon29', 'tuerca28'], c: C, e: EX, k: -1 },
      { ids: ['cubo53:1', 'brida17', 'tuerca18', 'disco'], c: V(0, 0, 0), e: EY, k: 11 / 30 },
    ],
  };
}
