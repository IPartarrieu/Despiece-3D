// Capas animadas del modo «Funciona» de las bombas. Las velocidades son ilustrativas (no las reales: 2 polos a 50 Hz
// darían cerca de 2.900 rpm y el 170F gira a 3.650 rpm sin carga según Loncin). Los recorridos del agua, del aire y de
// la corriente son esquemáticos.
import * as THREE from 'three';
import { V, PI } from '../lib.js';
import { flujo, flecha, rotulo, mb } from '../vivo.js';
import { AY } from './cym158.js';
import { Y0, TILT, RC, LB, D } from './wp30a.js';

const AMARILLO = 0xffc83d, NARANJA = 0xff9f43, AZUL = 0x6aa9ff, AGUA = 0x38bdf8, AIRE = 0xf1f5f9, ROJO = 0xff5470, VERDE = 0x4ade80, ACEITE = 0xf5b942;
const EX = V(1, 0, 0), EY = V(0, 1, 0);
const KR = 0.6;   // rotor de las eléctricas respecto al reloj de la app (ilustrativo)
const CAMPO = 0.7; // giro del campo respecto a anim.t: algo más rápido que el rotor (deslizamiento, ilustrativo)

const juntar = (...objs) => { const g = new THREE.Group(); g.add(...objs); const f = objs.filter(o => o.userData.tick).map(o => o.userData.tick); g.userData.tick = c => f.forEach(t => t(c)); return g; };
// punto a la distancia r del eje, en la posición l a lo largo del eje y en el ángulo a (a crece en el sentido de giro positivo)
const P = (ax, c, l, r, a) => (ax === 'y' ? V(c.x + r * Math.cos(a), l, c.z - r * Math.sin(a)) : V(l, c.y + r * Math.cos(a), c.z + r * Math.sin(a)));
const arco = (ax, c, l, r, k, color = VERDE, tam = 0.3) => flujo(Array.from({ length: 16 }, (_, i) => P(ax, c, l, r, Math.sign(k) * i / 15 * PI * 1.6)), { color, cono: true, n: 3, vel: 0.12, tam, r: 0.06, tension: 0.5 });
// espira de una bobina: baja por una ranura en a0, cruza por la cabeza, vuelve por la ranura opuesta y cierra por la otra cabeza
function espira(ax, c, r, a0, l0, l1) {
  const p = [];
  for (let i = 0; i <= 4; i++) p.push(P(ax, c, l1 + (l0 - l1) * i / 4, r, a0));
  for (let i = 1; i < 8; i++) p.push(P(ax, c, l0, r, a0 + PI * i / 8));
  for (let i = 0; i <= 4; i++) p.push(P(ax, c, l0 + (l1 - l0) * i / 4, r, a0 + PI));
  for (let i = 1; i < 8; i++) p.push(P(ax, c, l1, r, a0 + PI + PI * i / 8));
  return p;
}
// campo giratorio: flecha S -> N que gira con anim.t
function campoGiro(ax, c, r) {
  const g = new THREE.Group(), u = ax === 'y' ? V(1, 0, 0) : V(0, 1, 0); g.position.copy(c);
  g.add(flecha(u.clone().multiplyScalar(-r), u, 2 * r, AZUL, 0.22), rotulo('N', u.clone().multiplyScalar(r + 1.8), { color: '#ff8a8a', esc: 1.8 }), rotulo('S', u.clone().multiplyScalar(-r - 1.8), { color: '#8ab8ff', esc: 1.8 }));
  g.userData.tick = ({ t }) => { g.rotation[ax] = t * CAMPO * 4; };
  return g;
}
// espirales del agua dentro del rodete: de r0 a r1, terminando tangente hacia la salida (a = -π/2)
function espirales(ax, c, l, r0, r1, n, cola) {
  return Array.from({ length: n }, (_, i) => {
    const a0 = i / n * PI * 2, aF = -PI / 2 + PI * 2 * Math.ceil((a0 + PI) / (PI * 2));
    const p = Array.from({ length: 13 }, (_, j) => P(ax, c, l, r0 + (r1 - r0) * j / 12, a0 + (aF - a0) * j / 12));
    return flujo([...p, ...cola], { color: AGUA, n: 22, vel: 0.05, tam: 0.3, r: 0.07 });
  });
}
const lbl = (t, p, o = {}) => rotulo(t, p, { esc: 1.7, ancho: Math.max(1.6, t.length * 0.33), ...o });
function solido(geo, color, op, pos, rot) { const m = new THREE.Mesh(geo, mb(color, { opacity: op })); m.renderOrder = 7; m.position.copy(pos); if (rot) m.rotation.set(...rot); return m; }

// =================== Bercatti DRE0753 (eje vertical Y) ===================
export function vivoDRE() {
  const capas = {}, C = V(0, 0, 0);
  capas.corriente = juntar(
    flujo([V(-20, 44, -14), V(-12, 47.5, -12.5), V(-4, 48, -9), V(0, 45.5, -5.8), V(0, 42, -5.5), V(-1.5, 39.4, -3.5), V(-5, 36, 0), V(-7.4, 34.2, 0)], { color: AMARILLO, n: 18, vel: 0.08, tam: 0.3, r: 0.08 }),
    flujo(espira('y', C, 7.4, 0, 20.3, 33.7), { color: AMARILLO, cerrado: true, n: 34, vel: 0.04, tam: 0.28, r: 0.08 }),
    lbl('220 V', V(-20, 46.5, -14)), lbl('bobinado principal', V(13, 27, 0)));
  capas.capacitor = juntar(
    flujo(espira('y', C, 7.4, -PI / 2, 20.3, 33.7), { color: NARANJA, cerrado: true, n: 34, vel: 0.04, tam: 0.28, r: 0.08 }),
    flujo([V(-5.2, 33.9, -5.2), V(-5.6, 36.6, -2.9), V(-5.6, 37.4, 0), V(-5.6, 36.6, 2.9), V(-5.2, 33.9, 5.2)], { color: NARANJA, n: 8, vel: 0.08, tam: 0.3, r: 0.08 }),
    lbl('capacitor', V(-14, 40, 0)), lbl('bobinado auxiliar', V(0, 24, 12)));
  capas.campo = campoGiro('y', V(0, 27, 0), 4.4);
  capas.sentido = arco('y', C, 36.2, 3.6, 1, VERDE, 0.35);
  capas.aguaEntra = juntar(...Array.from({ length: 8 }, (_, i) => { const a = i / 8 * PI * 2, c = Math.cos(a), s = Math.sin(a);
    return flujo([V(16 * c, 2.8, 16 * s), V(11.6 * c, 2.8, 11.6 * s), V(7 * c, 2.4, 7 * s), V(3.2 * c, 3.4, 3.2 * s), V(1.2 * c, 5.4, 1.2 * s), V(1.6 * c, 7.2, 1.6 * s)], { color: AGUA, n: 8, vel: 0.08, tam: 0.3, r: 0.06 }); }),
    lbl('rejilla', V(-16, 6.5, 6)));
  const salida = [V(5, 8, 8.8), V(10.5, 8.1, 8.5), V(12.6, 10, 8.5), V(12.8, 20, 8.5), V(12.8, 31, 8.5), V(12.8, 38, 8.5)];
  capas.aguaSale = juntar(...espirales('y', C, 8, 1.6, 9.4, 4, salida), lbl('semivórtice', V(-15, 8, 4)), lbl('voluta', V(18, 4, 8)));
  capas.descarga = juntar(flecha(V(12.8, 36, 8.5), EY, 5, AGUA, 0.3), lbl('descarga 3"', V(12.8, 43, 8.5)));
  capas.aceite = juntar(solido(new THREE.CylinderGeometry(3.0, 3.0, 5.0, 32, 1, true), ACEITE, 0.45, V(0, 14.3, 0)), solido(new THREE.CylinderGeometry(2.9, 2.9, 5.0, 32), ACEITE, 0.25, V(0, 14.3, 0)),
    arco('y', C, 12.6, 2.9, 1, VERDE, 0.25), arco('y', C, 15.9, 2.9, 1, VERDE, 0.25),
    lbl('cámara de aceite', V(-17, 14.3, 0)), lbl('sello superior', V(15, 16.6, -4)), lbl('sello inferior (lado agua)', V(16, 12, -4)), lbl('tapón de aceite', V(-17, 11.2, 0)));
  capas.refrigeracion = juntar(...Array.from({ length: 10 }, (_, i) => { const a = i / 10 * PI * 2; return flujo([V(11.4 * Math.cos(a), 18, 11.4 * Math.sin(a)), V(11.4 * Math.cos(a), 39, 11.4 * Math.sin(a))], { color: AGUA, cono: true, n: 4, vel: 0.06, tam: 0.25, r: 0.04 }); }),
    ...[0, 1, 2, 3, 4, 5].map(i => { const a = i / 6 * PI * 2; return flecha(V(9.8 * Math.cos(a), 27, 9.8 * Math.sin(a)), V(Math.cos(a), 0, Math.sin(a)), 2.6, ROJO, 0.14); }),
    lbl('calor al agua', V(-17, 30, 0)), lbl('protector térmico', V(12, 38.5, -3)));
  return { capas, giros: [{ ids: ['rotor', 'rodete', 'agitador', 'tuerca'], c: V(0, 0, 0), e: EY, k: KR }], mover: [] };
}

// =================== Happy CYM158 (eje horizontal X, en y = AY) ===================
export function vivoCYM() {
  const capas = {}, C = V(0, AY, 0);
  capas.cebado = juntar(solido(new THREE.CylinderGeometry(8.6, 8.6, 6.8, 40), AGUA, 0.3, V(8.0, AY, 0), [0, 0, -PI / 2]), solido(new THREE.CylinderGeometry(1.7, 1.7, 3.4, 20), AGUA, 0.35, V(13.1, AY, 0), [0, 0, -PI / 2]),
    solido(new THREE.CylinderGeometry(1.7, 1.7, 6, 20), AGUA, 0.35, V(8.3, 19.3, 0)),
    flujo([V(5.6, 27, 0), V(5.6, 22, 0), V(5.6, 18.6, 0), V(5.6, 15, 0)], { color: AGUA, cono: true, n: 6, vel: 0.1, tam: 0.3, r: 0.06 }), lbl('tapón de cebado', V(4, 29, 0)), lbl('cuerpo lleno de agua', V(10, -1.5, 6)));
  capas.corriente = juntar(
    flujo([V(-12, 2.5, 12), V(-4, 6, 11), V(0.5, 14, 9), V(1.4, 17, 6.2), V(1.4, 17.2, 3.4), V(1.4, 17.4, 0), V(2.4, 14.4, 0)], { color: AMARILLO, n: 16, vel: 0.08, tam: 0.25, r: 0.07 }),
    flujo(espira('x', C, 4.7, 0, -8.6, 2.0), { color: AMARILLO, cerrado: true, n: 30, vel: 0.04, tam: 0.24, r: 0.07 }),
    flujo(espira('x', C, 4.7, PI / 2, -8.6, 2.0), { color: NARANJA, cerrado: true, n: 30, vel: 0.04, tam: 0.24, r: 0.07 }),
    flujo([V(1.0, AY + 3.2, 3.2), V(-0.3, 17.6, 1.8), V(-4.6, 20.4, 0), V(-8.6, 17.6, 1.8)], { color: NARANJA, n: 8, vel: 0.08, tam: 0.26, r: 0.07 }),
    lbl('220 V', V(-13, 5, 13)), lbl('capacitor 20 µF', V(-4.6, 24, 0)), lbl('principal', V(-3, AY + 8.5, 6), { color: '#ffe08a' }), lbl('auxiliar', V(-3, AY - 1, 9.5), { color: '#ffc58a' }));
  capas.campo = campoGiro('x', V(-3.3, AY, 0), 4.0);
  capas.sentido = arco('x', C, -12.9, 4.6, 1, VERDE, 0.3);
  capas.aguaEntra = juntar(...Array.from({ length: 6 }, (_, i) => { const a = i / 6 * PI * 2, c = Math.cos(a), s = Math.sin(a);
    return flujo([V(22, AY + 0.6 * c, 0.6 * s), V(14, AY + 0.9 * c, 0.9 * s), V(10.4, AY + 1.1 * c, 1.1 * s), V(8.7, AY + 2.2 * c, 2.2 * s)], { color: AGUA, n: 8, vel: 0.08, tam: 0.26, r: 0.06 }); }),
    lbl('succión 1"', V(20, AY + 3.5, 0)), lbl('depresión en el centro', V(11, AY - 5, 6)));
  capas.aguaSale = juntar(...espirales('x', C, 8.2, 2.2, 7.6, 4, [V(8.2, AY + 4.5, -6.6), V(8.3, AY + 8, -2.4), V(8.3, 18.5, 0), V(8.3, 23, 0), V(8.3, 27, 0)]),
    lbl('voluta', V(14, AY + 7, -6)), lbl('descarga 1"', V(8.3, 29, 0)));
  capas.sello = juntar(solido(new THREE.CylinderGeometry(1.85, 1.85, 0.12, 28), AGUA, 0.8, V(5.55, AY, 0), [0, 0, -PI / 2]), arco('x', C, 5.9, 2.0, 1, VERDE, 0.22),
    lbl('asiento cerámico (fijo)', V(4.6, AY - 4.2, 3)), lbl('anillo de grafito (gira)', V(6.4, AY + 4.4, 3)), lbl('película de agua', V(5.5, AY - 7, 6)));
  capas.aire = juntar(...Array.from({ length: 8 }, (_, i) => { const a = i / 8 * PI * 2 + 0.4, c = Math.cos(a), s = Math.sin(a);
    return flujo([V(-16.5, AY + 3 * c, 3 * s), V(-13.4, AY + 3.6 * c, 3.6 * s), V(-11.6, AY + 6.4 * c, 6.4 * s), V(-9.6, AY + 7.9 * c, 7.9 * s), V(1.5, AY + 7.9 * c, 7.9 * s), V(3.5, AY + 9.2 * c, 9.2 * s)], { color: 0x7dd3fc, cono: true, n: 6, vel: 0.07, tam: 0.22, r: 0.04 }); }),
    lbl('ventilador', V(-15, AY + 9, 0)));
  return { capas, giros: [{ ids: ['eje_rotor', 'rodete', 'ventilador', 'sello:0'], c: C, e: EX, k: KR }], mover: [] };
}

// =================== Redbo WP-30A: motor 170F de 4 tiempos y bomba autocebante ===================
export function vivoWP(parts) {
  const capas = {}, KC = 1, c0 = V(0, Y0, 0);
  const W = (x, y, z) => V(x, y, z).applyAxisAngle(EX, TILT).add(c0);   // coordenadas del cilindro inclinado -> mundo
  const s = a => RC * Math.cos(a) + Math.sqrt(LB * LB - (RC * Math.sin(a)) ** 2);   // distancia del pasador del pistón al eje del cigüeñal
  const fase = a => ((a % (4 * PI)) + 4 * PI) % (4 * PI);                          // 0 = PMS al empezar la admisión; ciclo de 720°
  const vuelta = a => { const r = ((a % (2 * PI)) + 2 * PI) % (2 * PI); return r > PI ? r - 2 * PI : r; };
  const alzaAd = c => (c < PI ? Math.sin(c) : 0), alzaEs = c => (c > 3 * PI ? Math.sin(c - 3 * PI) : 0);
  const ALZA = 0.5;   // alzada de las válvulas en el dibujo (ilustrativa)

  capas.combustible = juntar(flujo([V(-11, 33.2, 0), V(-9, 31, -1), V(-5, 30.5, -2.5), V(-0.5, 29.8, -2.0), V(1.8, 28.4, -2.0), V(1.8, 30.6, -2.0)], { color: 0xd9f99d, n: 12, vel: 0.06, tam: 0.26, r: 0.07 }),
    lbl('bencina', V(-14, 30, 4)), lbl('carburador', V(6.5, 34.5, -3)));
  capas.aire = juntar(flujo([V(1.5, 31.5, -16), V(1.5, 31.5, -11), V(1.5, 31.5, -7.4), V(1.8, 31.3, -4.2), V(1.8, 31.3, -1), W(1.8, 16.8, -7.8), W(1.8, 16.8, -5.2), W(1.8, 15.6, -1.5)], { color: AIRE, n: 16, vel: 0.06, tam: 0.26, r: 0.07 }),
    lbl('aire', V(1.5, 35, -16)), lbl('filtro de aire', V(-4, 38, -11)));

  // ciclo de 4 tiempos: gas en la cámara, rótulo del tiempo, flujos de admisión y escape, fuerza sobre el pistón
  const G = new THREE.Group(); G.rotation.x = TILT; G.position.copy(c0);
  const gas = new THREE.Mesh(new THREE.CylinderGeometry(3.45, 3.45, 1, 32), mb(0x7dd3fc, { opacity: 0.6 })); gas.renderOrder = 8; G.add(gas);
  const tiempos = ['1. Admisión', '2. Compresión', '3. Explosión', '4. Escape'].map(t => lbl(t, V(9, 41, 10), { ancho: 4.6, esc: 2 }));
  const adm = flujo([W(1.8, 16.8, -7.8), W(1.8, 16.8, -5.2), W(1.8, 15.6, -1.5), W(0, 14.4, 0)], { color: AIRE, n: 8, vel: 0.12, tam: 0.26, r: 0.06 });
  const esc = flujo([W(-1.8, 15.6, 1.5), W(-1.8, 16.8, 5.2), W(-1.8, 16.8, 7.8), V(-1.5, 25, 16), V(4, 23.5, 17.2), V(9, 23, 17.2)], { color: 0x9ca3af, n: 10, vel: 0.1, tam: 0.3, r: 0.07 });
  const fuerza = flecha(V(0, 0, 0), D.clone().negate(), 4, ROJO, 0.2);
  const cAd = new THREE.Color(0x7dd3fc), cCo = new THREE.Color(0xa78bfa), cEx = new THREE.Color(0xff7a2f), cEs = new THREE.Color(0x9ca3af);
  const ciclo = juntar(G, ...tiempos, adm, esc, fuerza);
  ciclo.userData.tick = (k) => {
    const a = KC * k.ang, c = fase(a), i = Math.floor(c / PI), crown = 13.75 + s(a) - (RC + LB), h = Math.max(15.2 - crown, 0.05);
    gas.scale.y = h; gas.position.y = crown + h / 2;
    gas.material.color.copy([cAd, cCo, cEx, cEs][i]); if (i === 2) gas.material.color.lerp(cEs, (c - 2 * PI) / PI * 0.7);
    tiempos.forEach((t, j) => { t.visible = j === i; });
    adm.visible = i === 0; esc.visible = i === 3; fuerza.visible = i === 2;
    fuerza.position.copy(W(0, crown + 3.6, 0));
    adm.userData.tick(k); esc.userData.tick(k);
  };
  capas.ciclo = ciclo;

  // encendido: el imán del volante pasa frente a la bobina una vez por vuelta y salta la chispa (cerca del PMS)
  const chispa = juntar(solido(new THREE.SphereGeometry(0.45, 14, 10), 0xfff59d, 1, W(-3.0, 15.0, 0)), solido(new THREE.SphereGeometry(1.1, 14, 10), 0xfde047, 0.35, W(-3.0, 15.0, 0)));
  const alta = flujo([W(-10.6, 11.8, 1.2), W(-10.2, 14.2, 2.0), W(-9.6, 16.4, 0.6), W(-8.6, 16.8, 0), W(-5.5, 16.8, 0), W(-3.0, 15.0, 0)], { color: AMARILLO, n: 10, vel: 0.2, tam: 0.25, r: 0.06 });
  const pulso = solido(new THREE.SphereGeometry(1.6, 14, 10), 0xfde047, 0.35, W(-10.6, 10.8, 0));
  const lImán = lbl('imán', V(0, 0, 0), { color: '#ffb4b4' }), lChispa = lbl('chispa', W(-3, 21, -2), { color: '#fff59d' }), lPerdida = lbl('chispa en el escape (sin efecto)', W(-3, 21, -2), { ancho: 8, color: '#d1d5db' });
  const encendido = juntar(chispa, alta, pulso, lImán, lChispa, lPerdida, lbl('bobina', W(-16, 12.5, 0)), lbl('bujía', W(-9.5, 19.5, 0)), arco('x', c0, -14.6, 9.6, KC, VERDE, 0.35));
  encendido.userData.tick = (k) => {
    const a = KC * k.ang, v = vuelta(a), on = v > -0.45 && v < 0.2, real = fase(a) > PI;
    chispa.visible = alta.visible = on; pulso.visible = Math.abs(v) < 0.5;
    lChispa.visible = on && real; lPerdida.visible = on && !real;
    lImán.position.copy(W(-16, 9.2 * Math.cos(a), 9.2 * Math.sin(a)));
    alta.userData.tick(k); encendido.children.at(-1).userData.tick(k);
  };
  capas.encendido = encendido;

  capas.arranque = juntar(flujo([V(-15.3, Y0 + 3.5, 6.7), V(-15.5, Y0 + 5, 9), V(-15.6, Y0 + 6.1, 10.4), V(-15.6, Y0 + 7, 14), V(-15.6, Y0 + 7.6, 17)], { color: 0xfef3c7, cono: true, n: 6, vel: 0.12, tam: 0.3, r: 0.06 }),
    arco('x', c0, -17.4, 5.5, KC, VERDE, 0.35), lbl('tirar de la cuerda', V(-16, Y0 + 10.5, 17)), lbl('arrancador retráctil', V(-22, Y0 - 9, 4)));
  capas.distribucion = juntar(arco('x', c0, 7.2, 2.6, KC, VERDE, 0.25), arco('x', W(0, 3.4, -4.6), 7.2, 4.3, -KC, 0xfacc15, 0.3),
    lbl('admisión', W(6.5, 22.5, -1)), lbl('escape', W(-6.5, 22.5, -1)), lbl('levas: media vuelta por vuelta', W(9, 1.5, -12), { ancho: 7.6 }), lbl('balancines', W(0, 25.5, -3)), lbl('varillas', W(-7.5, 9, -7)));

  // bomba autocebante
  capas.cebado = juntar(solido(new THREE.BoxGeometry(7.4, 9.3, 14.6), AGUA, 0.3, V(15.8, Y0 + 8.8, 0)), solido(new THREE.CylinderGeometry(10.2, 10.2, 6.8, 40), AGUA, 0.3, V(16.2, Y0, 0), [0, 0, -PI / 2]),
    flujo([V(15.8, 37, 5.5), V(15.8, 32, 5.5), V(15.8, 27.6, 5.5), V(15.8, 22, 5)], { color: AGUA, cono: true, n: 6, vel: 0.1, tam: 0.3, r: 0.06 }),
    lbl('agua de cebado', V(15.8, 39, 5.5)), lbl('tapón de drenaje', V(26, Y0 - 9, 0)));
  const subida = [V(15.4, Y0 + 5.5, -6.4), V(15.6, 22, -3.5), V(15.8, 26.5, -1), V(15.8, 31.5, 0), V(15.8, 37, 0)];
  capas.agua = juntar(flujo([V(34, 19.5, 0), V(27, 19.5, 0), V(21, 19.5, 0), V(18.6, 19, 0), V(17.4, 16, 0), V(16.6, Y0 + 0.5, 0)], { color: AGUA, n: 14, vel: 0.06, tam: 0.32, r: 0.08 }),
    ...espirales('x', c0, 15.2, 1.8, 7.0, 4, subida), lbl('succión 3"', V(31, 23.5, 0)), lbl('descarga 3"', V(15.8, 39, 0)), lbl('voluta', V(22, Y0 - 8, 6)));
  capas.autocebado = juntar(flujo([V(34, 19.5, 0.6), V(21, 19.5, 0.6), V(17.5, 20.5, 3), V(15.4, Y0 + 3.5, 5), V(15.3, Y0 + 7, -3.5), V(15.8, 26, 0), V(15.8, 37, 0)], { color: AIRE, n: 16, vel: 0.07, tam: 0.35, r: 0.05 }),
    lbl('aire expulsado', V(15.8, 39, 0)), lbl('válvula de retención', V(25, 27, 0), { ancho: 6.4 }));
  capas.sello = juntar(arco('x', c0, 13.1, 2.4, KC, VERDE, 0.22), lbl('asiento fijo (en el soporte)', V(10, Y0 - 5.5, 4), { ancho: 7 }), lbl('anillo que gira con el rodete', V(13.5, Y0 + 5, 4), { ancho: 7.4 }),
    lbl('soporte', V(8, Y0 - 10.5, 6)));

  // biela: gira y se traslada; la app solo traslada (mover) o gira en torno a un eje fijo (giros), así que este mover
  // la reorienta a mano (la app le deja la rotación en identidad justo antes) y devuelve 0
  const biela = parts.biela.items[0].obj, q = new THREE.Quaternion(), Pold = W(0, RC, 0);
  const moverBiela = ({ ang }) => {
    const a = KC * ang, psi = Math.atan2(-RC * Math.sin(a), s(a) - RC * Math.cos(a));
    q.setFromAxisAngle(EX, psi);
    biela.quaternion.copy(q); biela.position.add(W(0, RC * Math.cos(a), RC * Math.sin(a)).sub(Pold.clone().applyQuaternion(q)));
    return 0;
  };
  const menosD = D.clone().negate();
  return {
    capas,
    giros: [{ ids: ['ciguenal', 'volante', 'rodete_b', 'sello_b:0'], c: c0, e: EX, k: KC }, { ids: ['arbol_levas'], c: W(0, 3.4, -4.6), e: EX, k: -KC / 2 }],
    mover: [
      { ids: ['piston'], eje: D, f: ({ ang }) => s(KC * ang) - (RC + LB) },
      { ids: ['biela'], eje: D, f: moverBiela },
      { ids: ['valvulas:0'], eje: menosD, f: ({ ang }) => ALZA * alzaAd(fase(KC * ang)) },
      { ids: ['valvulas:1'], eje: menosD, f: ({ ang }) => ALZA * alzaEs(fase(KC * ang)) },
      { ids: ['varillas:0'], eje: D, f: ({ ang }) => ALZA * alzaAd(fase(KC * ang)) },
      { ids: ['varillas:1'], eje: D, f: ({ ang }) => ALZA * alzaEs(fase(KC * ang)) },
    ],
  };
}
