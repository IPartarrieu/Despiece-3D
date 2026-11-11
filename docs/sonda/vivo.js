// Capas animadas del modo "Funcionamiento" de la sonda vibradora (REFERENCIAL) y constantes compartidas por los modelos.
// Unidad a gasolina (gasolina.js): cigüeñal = eje X, cilindro inclinado A hacia +Z (U = eje del cilindro, W = perpendicular).
// Ciclo: θ = ángulo del cigüeñal (0 = PMS al empezar la admisión); ψ = θ mód 4π: admisión, compresión, explosión, escape.
// Velocidades ILUSTRATIVAS: motor, eje y cabezal giran igual (sin multiplicador, Truper VICO-55); la alta frecuencia, más rápido.
// Amplitud de vibración EXAGERADA (AVIB) para que se vea: la real es de alrededor de 1 mm (fichas AX48/IRFU).
import * as THREE from 'three';
import { V, PI } from '../lib.js';
import { flujo, flecha, rotulo as rotulo0, mb } from '../vivo.js';

// los rótulos de vivo.js están pensados para equipos de ~40 cm: aquí la escena mide ~1 m
const rotulo = (t, p, o = {}) => rotulo0(t, p, { ...o, esc: (o.esc || 1.5) * 2.2 });

export const A = 25 * PI / 180, U = V(0, Math.cos(A), Math.sin(A)), W = V(0, -Math.sin(A), Math.cos(A));
export const RM = 2.25, LB = 8;            // radio de manivela (carrera 45 mm, Honda GX160) y largo de biela (sin dato: aproximado)
export const XH = 58, YH = -22;            // eje (vertical) y borde superior del cabezal, sistema a gasolina
export const MAN = [V(21, 0, 0), V(32, 0, 0), V(45, -2, 0), V(54, -7, 0), V(58, -13, 0), V(58, -19, 0)]; // eje de la manguera (acortada)
export const DB = U.clone().multiplyScalar(Math.cos(-1.9)).addScaledVector(W, Math.sin(-1.9)); // imán y bobina alineados en el PMS
export const XA = 40, YA = -10;            // eje y borde superior de la sonda de alta frecuencia
export const MAA = [V(7, 0, 0), V(16, 0, 0), V(28, -1, 0), V(36, -4, 0), V(40, -7, 0), V(40, -9.5, 0)];
export const cilW = (x, y, z) => V(x, y * U.y + z * W.y, y * U.z + z * W.z);   // marco del cilindro (y = eje U, z = W) -> mundo

const EX = V(1, 0, 0), EY = V(0, 1, 0), EZ = V(0, 0, 1);
const KM = 1, KR = 3, AVIB = 0.6;
const AMARILLO = 0xffc83d, NARANJA = 0xff9f43, CELESTE = 0x4dd0ff, ROJO = 0xff5470, AIRE = 0x7dd3fc, VERDE = 0x4ade80, AZUL = 0x6aa9ff, GRIS = 0xb8c0cc;

export const dPiston = t => RM * Math.cos(t) + Math.sqrt(LB * LB - (RM * Math.sin(t)) ** 2) - (RM + LB);   // <= 0 (biela-manivela)
const psi = t => ((t % (4 * PI)) + 4 * PI) % (4 * PI);
const alzaAdm = t => { const p = psi(t); return p < PI ? 0.7 * Math.sin(p) : 0; };
const alzaEsc = t => { const p = psi(t); return p > 3 * PI ? 0.7 * Math.sin(p - 3 * PI) : 0; };

const juntar = g => { const f = g.children.filter(o => o.userData.tick).map(o => o.userData.tick); g.userData.tick = c => f.forEach(t => t(c)); return g; };
// arco de flechas alrededor del eje X local, en el sentido de un giro positivo
const arcoEn = (r, n = 3, color = VERDE, tam = 0.22, vel = 0.15) => flujo(Array.from({ length: 16 }, (_, i) => { const a = i / 15 * PI * 1.6; return V(0, r * Math.cos(a), r * Math.sin(a)); }), { color, cono: true, n, vel, tam, r: 0.05, tension: 0.5 });
const arcoX = (x, r, n, color) => { const g = new THREE.Group(); g.position.x = x; g.add(arcoEn(r, n, color)); return juntar(g); };
const arcoY = (x, y, r, color = VERDE, n = 3) => { const g = new THREE.Group(); g.position.set(x, y, 0); g.rotation.z = PI / 2; g.add(arcoEn(r, n, color)); return juntar(g); };

// vibración radial: flecha de la fuerza centrífuga que gira con la masa y círculo del movimiento
function vibracion(xc, yc, Rh, fase) {
  const g = new THREE.Group(), fl = new THREE.Group();
  fl.add(flecha(V(0, 0, 0), EX, Rh + 4.5, ROJO, 0.16));
  g.add(arcoY(xc, yc, Rh + 2.4, 0xffffff, 4), fl,
    rotulo('fuerza centrífuga', V(xc + Rh + 9, yc + 4, 0), { esc: 1.5, ancho: 4.6, color: '#ff9aa9' }),
    rotulo('vibración radial (amplitud exagerada)', V(xc + 2, yc - 9, 9), { esc: 1.5, ancho: 9 }));
  const f = g.children.filter(o => o.userData.tick).map(o => o.userData.tick);
  g.userData.tick = c => { f.forEach(t => t(c)); const p = fase(c.ang); fl.rotation.y = p; fl.position.set(xc + AVIB * Math.cos(p), yc, -AVIB * Math.sin(p)); };
  return g;
}

// hormigón fresco (fantasma): ondas que se alejan de la sonda y burbujas de aire que suben
function hormigon(xc, y0, y1, r = 15) {
  const g = new THREE.Group();
  const bloque = new THREE.Mesh(new THREE.BoxGeometry(2 * r, y0 - y1, 2 * r), mb(0x9aa0a6, { opacity: 0.14 })); bloque.position.set(xc, (y0 + y1) / 2, 0); bloque.renderOrder = 6;
  const sup = new THREE.Mesh(new THREE.PlaneGeometry(2 * r, 2 * r), mb(0xc0c4c8, { opacity: 0.25, side: THREE.DoubleSide })); sup.rotation.x = -PI / 2; sup.position.set(xc, y0, 0); sup.renderOrder = 6;
  g.add(bloque, sup);
  const ondas = [0, 1, 2, 3].map(i => { const o = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 6, 48), mb(CELESTE, { opacity: 0.6 })); o.rotation.x = PI / 2; o.renderOrder = 9; g.add(o); return o; });
  const burb = Array.from({ length: 24 }, (_, i) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.3 + 0.12 * (i % 3), 10, 8), mb(0xffffff, { opacity: 0.85 })); b.renderOrder = 9; g.add(b);
    return { b, a: i * 2.39996, rr: 3.5 + ((i * 37) % 100) / 100 * (r - 5), f: ((i * 53) % 100) / 100 };
  });
  g.add(rotulo('ondas de presión', V(xc + r + 2, y1 + (y0 - y1) * 0.55, 0), { esc: 1.4, ancho: 4.6, color: '#9fe7ff' }),
    rotulo('el aire sube y sale', V(xc - r - 2, y0 + 3, 0), { esc: 1.4, ancho: 5 }));
  g.userData.tick = ({ t }) => {
    ondas.forEach((o, i) => { const u = (t * 0.45 + i / 4) % 1, rad = 2.6 + u * (r - 3); o.scale.set(rad, rad, 1 / rad); o.position.set(xc, y1 + 4 + (i % 2 ? 0.55 : 0.25) * (y0 - y1), 0); o.material.opacity = 0.75 * (1 - u); });
    burb.forEach(({ b, a, rr, f }) => { const u = (t * 0.1 + f) % 1; b.position.set(xc + rr * Math.cos(a), y1 + 1 + u * (y0 - y1 - 1), rr * Math.sin(a)); b.material.opacity = 0.85 * Math.min(1, (1 - u) * 5); });
  };
  return g;
}

// ===================== sistema de eje flexible a gasolina =====================
export function vivoGas(parts, { Rh, Lh }) {
  const capas = {}, ys = s => YH - s;
  const eng = () => ['embrague', 'alma', 'vibracion', 'hormigon'].some(n => capas[n]?.visible);   // embrague enganchado
  const th = ang => KM * ang, fH = ang => (eng() ? KM * ang : 0);

  // ---------- combustible y aire ----------
  const carb = cilW(-7.4, 16.2, 0), filtro = cilW(-11.9, 16.6, 0), puerto = cilW(-1.6, 15.0, 0);
  const comb = new THREE.Group();
  comb.add(flujo([V(-7.4, 21.3, carb.z), V(-7.4, 18.6, carb.z), carb.clone().add(V(0, 1.6, 0)), carb], { color: NARANJA, n: 10, vel: 0.12, tam: 0.24, r: 0.08 }),
    flujo([filtro.clone().add(V(-4, 3, 0)), filtro, carb, puerto, cilW(-1.6, 13.4, 0)], { color: AIRE, cono: true, n: 12, vel: 0.1, tam: 0.22, r: 0.06 }),
    rotulo('bencina', V(-7.4, 23.5, carb.z + 4), { esc: 1.5, ancho: 2.6 }), rotulo('aire', filtro.clone().add(V(-6, 5, 0)), { esc: 1.5, ancho: 1.6 }),
    rotulo('carburador: mezcla', carb.clone().add(V(-4, -4, 5)), { esc: 1.5, ancho: 4.6 }));
  capas.combustible = juntar(comb);

  // ---------- ciclo de 4 tiempos: gases en la cámara, válvulas y rótulo del tiempo ----------
  const ciclo = new THREE.Group(), gc = new THREE.Group(); gc.rotation.x = A;
  const gas = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, 1, 32), mb(AIRE, { opacity: 0.6 })); gas.renderOrder = 8; gc.add(gas);
  const rots = ['1 · admisión', '2 · compresión', '3 · explosión', '4 · escape'].map(n => rotulo(n, cilW(0, 24, 10), { esc: 1.6, ancho: 4.4 }));
  const fAdm = flujo([filtro, carb, puerto, cilW(-1.6, 12.6, 0)], { color: AIRE, cono: true, n: 8, vel: 0.25, tam: 0.22, r: 0.06 });
  const fEsc = flujo([cilW(1.6, 12.6, 0), cilW(3, 15.4, 0), cilW(8.5, 16.2, 0), cilW(13.5, 16.2, 0)], { color: GRIS, cono: true, n: 8, vel: 0.25, tam: 0.22, r: 0.06 });
  ciclo.add(gc, fAdm, fEsc, ...rots);
  const cols = [0x7dd3fc, 0x4f8cff, 0xff6a2b, 0x9aa0a6].map(c => new THREE.Color(c)), tmp = new THREE.Color();
  ciclo.userData.tick = c => {
    fAdm.userData.tick(c); fEsc.userData.tick(c);
    const t = th(c.ang), p = psi(t), k = Math.min(3, Math.floor(p / PI)), y0 = 13.6 + dPiston(t);
    gas.position.y = (y0 + 14) / 2; gas.scale.y = 14 - y0;
    rots.forEach((r, i) => { r.visible = i === k; });
    fAdm.visible = k === 0; fEsc.visible = k === 3;
    const u = p / PI - k;
    gas.material.color.copy(k === 1 ? tmp.copy(cols[0]).lerp(cols[1], u) : k === 2 ? tmp.copy(cols[2]).lerp(cols[3], u) : cols[k]);
  };
  capas.ciclo = ciclo;

  // ---------- encendido: imán del volante frente a la bobina -> chispa al final de la compresión ----------
  const ch = new THREE.Group(), pb = V(-11.2, DB.y * 9.95, DB.z * 9.95), pc = cilW(0, 14.7, -2.2);
  const flash = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 0), mb(0xfff3b0)); flash.position.copy(pc); flash.renderOrder = 10;
  const alta = flujo([pb, V(-10, 4, -11.5), V(-7, 12, -10), V(-3, 18, -6.5), cilW(0, 16.2, -11.6), cilW(0, 16.2, -6), pc], { color: AMARILLO, n: 10, vel: 0.6, tam: 0.24, r: 0.07 });
  ch.add(flash, alta, rotulo('bobina', pb.clone().add(V(-3, -4, -4)), { esc: 1.5, ancho: 2.4 }), rotulo('imán del volante', V(-15, -10, -6), { esc: 1.5, ancho: 4.2 }),
    rotulo('chispa', pc.clone().add(V(4, 6, -6)), { esc: 1.5, ancho: 2.2, color: '#fff3b0' }));
  ch.userData.tick = c => { const d = Math.abs(psi(th(c.ang)) - 2 * PI); flash.visible = d < 0.3; alta.visible = d < 0.9; alta.userData.tick(c); flash.scale.setScalar(0.7 + 0.6 * Math.abs(Math.sin(c.t * 40))); };
  capas.chispa = ch;

  // ---------- embrague centrífugo: suelto en ralentí, engancha al acelerar ----------
  const ral = new THREE.Group();
  ral.add(arcoX(11.9, 4.4, 3, 0xffffff), rotulo('ralentí: zapatas recogidas', V(12, 9.5, 8), { esc: 1.5, ancho: 6.4 }), rotulo('campana quieta', V(15, -8, 8), { esc: 1.5, ancho: 3.8, color: '#8ab8ff' }));
  capas.ralenti = juntar(ral);
  const emb = new THREE.Group(), rz = new THREE.Group(); rz.position.x = 12;
  rz.add(flecha(V(0, 3.5, 0), EY, 1.9, ROJO, 0.12), flecha(V(0, -3.5, 0), EY.clone().negate(), 1.9, ROJO, 0.12));
  emb.add(rz, arcoX(12.6, 5.8, 4, VERDE), rotulo('fuerza centrífuga', V(12, 10, 8), { esc: 1.5, ancho: 4.6, color: '#ff9aa9' }), rotulo('la campana gira con el motor', V(16, -8.5, 8), { esc: 1.5, ancho: 6.6 }));
  const fe = emb.children.filter(o => o.userData.tick).map(o => o.userData.tick);
  emb.userData.tick = c => { fe.forEach(t => t(c)); rz.rotation.x = th(c.ang); };
  capas.embrague = emb;

  // ---------- eje flexible: el alma gira dentro de la funda ----------
  const curva = new THREE.CatmullRomCurve3([V(16.5, 0, 0), ...MAN, V(XH, YH - 2, 0)], false, 'catmullrom', 0.3), al = new THREE.Group();
  for (const u of [0.15, 0.4, 0.65, 0.88]) { const g = new THREE.Group(); g.position.copy(curva.getPointAt(u)); g.quaternion.setFromUnitVectors(EX, curva.getTangentAt(u)); g.add(arcoEn(2.8, 4, VERDE, 0.4, 0.5)); al.add(juntar(g)); }
  al.add(rotulo('el alma gira dentro de la funda', V(38, 9, 0), { esc: 1.6, ancho: 7.4 }), rotulo('≈3.600 rpm = ≈3.600 vpm', V(38, 5, 0), { esc: 1.5, ancho: 6 }));
  capas.alma = juntar(al);

  capas.vibracion = vibracion(XH, ys(Lh * 0.62), Rh, fH);
  capas.hormigon = hormigon(XH, -27, ys(Lh) - 4);

  // ---------- piezas que se mueven ----------
  const P0 = U.clone().multiplyScalar(RM), qb = new THREE.Quaternion(), biela = parts.biela.items[0].obj;
  const fBiela = ({ ang }) => {   // la biela cabecea alrededor del muñón: se orienta a mano (la app la deja en identidad antes de llamar)
    const t = th(ang), s = RM * Math.sin(t), a = Math.atan2(-s, Math.sqrt(LB * LB - s * s));
    qb.setFromAxisAngle(EX, a); biela.quaternion.copy(qb);
    biela.position.add(U.clone().multiplyScalar(RM * Math.cos(t)).addScaledVector(W, s).sub(P0.clone().applyQuaternion(qb)));
    return 0;
  };
  const zap = parts.zapatas.items;   // 0: zapata abajo (-Y), 1: arriba (+Y), dibujadas enganchadas; en ralentí se recogen 3 mm
  const fZap = i => () => { if (!eng()) zap[i].obj.position.addScaledVector(V(0, i ? 1 : -1, 0).applyQuaternion(zap[i].obj.quaternion), -0.3); return 0; };
  const CAB = ['adaptador', 'retenes', 'rod_sup', 'masa', 'rod_inf', 'carcasa', 'tapa', 'adaptador_alma', 'conexion_cabezal'];
  return {
    capas,
    giros: [
      { ids: ['cigueñal', 'volante', 'zapatas'], c: V(0, 0, 0), e: EX, k: KM },
      { ids: ['campana'], c: V(0, 0, 0), e: EX, get k() { return eng() ? KM : 0; } },
      { ids: ['masa', 'adaptador_alma'], c: V(XH, 0, 0), e: EY, get k() { return eng() ? KM : 0; } },
    ],
    mover: [
      { ids: ['piston'], eje: U, f: ({ ang }) => dPiston(th(ang)) },
      { ids: ['biela'], eje: EX, f: fBiela },
      { ids: ['valvulas:0'], eje: U, f: ({ ang }) => -alzaAdm(th(ang)) },
      { ids: ['valvulas:1'], eje: U, f: ({ ang }) => -alzaEsc(th(ang)) },
      { ids: ['zapatas:0'], eje: EX, f: fZap(0) },
      { ids: ['zapatas:1'], eje: EX, f: fZap(1) },
      { ids: CAB, eje: EX, f: ({ ang }) => (eng() ? AVIB * Math.cos(KM * ang) : 0) },
      { ids: CAB, eje: EZ, f: ({ ang }) => (eng() ? -AVIB * Math.sin(KM * ang) : 0) },
    ],
  };
}

// ===================== alta frecuencia: convertidor + motor dentro de la sonda =====================
export function vivoAF(parts, { Rh, Lh }) {
  const capas = {}, ys = s => YA - s, fR = ang => KR * ang;

  const red = new THREE.Group(), CR = [V(-50, -16, 4), V(-46, -12, 2), V(-40, -6, 0), V(-34, -4, 0), V(-28, -4, 0)];
  red.add(flujo(CR.map(p => p.clone().add(V(0, 0.35, 0))), { color: AMARILLO, n: 10, vel: 0.1, tam: 0.22, r: 0.06 }),
    flujo(CR.map(p => p.clone().add(V(0, -0.35, 0))).reverse(), { color: AMARILLO, n: 10, vel: 0.1, tam: 0.22, r: 0.06 }),
    rotulo('red 220-240 V · 1 fase', V(-46, -4, 6), { esc: 1.6, ancho: 6 }), rotulo('rectificador: CC', V(-23, 12, 9), { esc: 1.6, ancho: 4.4 }));
  capas.red = juntar(red);

  const P3 = [V(-12, -2, 0), V(-6, -2, 0), V(0, 0, 0), ...MAA, V(XA, ys(2), 0), V(XA, ys(6), 0)], tri = new THREE.Group();
  [[ROJO, -0.45], [AMARILLO, 0], [AZUL, 0.45]].forEach(([c, dz], i) => tri.add(flujo(P3.map(p => p.clone().add(V(0, 0, dz))), { color: c, n: 16, vel: 0.08, tam: 0.3, r: 0.08 })));
  tri.add(rotulo('inversor: 42 V · 3 fases · 200 Hz', V(-23, 12, 9), { esc: 1.6, ancho: 8 }), rotulo('interruptor', V(3.5, 5, 0), { esc: 1.4, ancho: 3 }));
  capas.trifasica = juntar(tri);

  // campo giratorio: tres pares de polos (uno por fase) se encienden en secuencia y el campo resultante gira
  const cg = new THREE.Group(), fl = new THREE.Group(); cg.position.set(XA, ys(13.6), 0);
  fl.add(flecha(V(-1.7, 0, 0), EX, 3.4, AZUL, 0.14)); cg.add(fl);
  const polos = [ROJO, AMARILLO, AZUL].flatMap((c, k) => [1, -1].map(s => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.6, 12, 0.6), mb(c)), a = k * 2 * PI / 3; b.position.set(s * 2.9 * Math.cos(a), 0, -s * 2.9 * Math.sin(a)); b.renderOrder = 9; cg.add(b); return { b, k, s };
  }));
  const campo = new THREE.Group(); campo.add(cg, rotulo('campo giratorio', V(XA + 10, ys(9), 0), { esc: 1.5, ancho: 4.4 }));
  campo.userData.tick = ({ ang }) => { const w = KR * 1.08 * ang; fl.rotation.y = w; polos.forEach(({ b, k, s }) => { b.material.opacity = 0.12 + 0.88 * Math.max(0, s * Math.cos(w - k * 2 * PI / 3)); }); };
  capas.campo = campo;

  const ro = new THREE.Group();
  ro.add(arcoY(XA, ys(13.6), 3.4), arcoY(XA, ys(26.5), 3.6, 0xffffff), rotulo('rotor ≈12.000 rpm', V(XA + 10, ys(12), 0), { esc: 1.5, ancho: 4.6 }),
    rotulo('excéntrico', V(XA + 9, ys(26.5), 0), { esc: 1.5, ancho: 3 }));
  capas.rotor = juntar(ro);

  capas.vibracion = vibracion(XA, ys(26.5), Rh, fR);
  capas.hormigon = hormigon(XA, ys(8), ys(Lh) - 4);

  const cal = new THREE.Group();
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2, y = ys(12 + (i % 4) * 6); cal.add(flujo([V(XA + 2.6 * Math.cos(a), y, 2.6 * Math.sin(a)), V(XA + 7 * Math.cos(a), y + 1, 7 * Math.sin(a))], { color: NARANJA, cono: true, n: 3, vel: 0.3, tam: 0.22, r: 0.04 })); }
  cal.add(rotulo('el hormigón enfría la sonda', V(XA - 12, ys(4), 0), { esc: 1.5, ancho: 6.4 }), rotulo('fuera del hormigón se recalienta', V(XA - 12, ys(Lh) - 2, 0), { esc: 1.5, ancho: 7, color: '#ff9aa9' }));
  capas.calor = juntar(cal);

  const CAB = ['niple', 'tuerca', 'tubo', 'portarrod', 'estator', 'rotor', 'excentrico', 'tornillos_j', 'rod_k', 'aceite', 'orings', 'tapa_ext'];
  return {
    capas,
    giros: [{ ids: ['rotor', 'excentrico', 'tornillos_j'], c: V(XA, 0, 0), e: EY, k: KR }],
    mover: [
      { ids: CAB, eje: EX, f: ({ ang }) => AVIB * Math.cos(fR(ang)) },
      { ids: CAB, eje: EZ, f: ({ ang }) => -AVIB * Math.sin(fR(ang)) },
    ],
  };
}
