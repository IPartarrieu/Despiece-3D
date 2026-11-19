// Cinemática y modo «Funciona» de la retroexcavadora. Cada cuerpo rígido (brazos del cargador, cucharón, torre de giro,
// pluma, brazo, cuchara, bieletas, estabilizadores, ruedas...) tiene una matriz «delta» respecto de la pose neutra
// (cucharón en el suelo, retro plegada para transporte, estabilizadores arriba). Los cilindros se orientan entre sus
// dos anclajes: la camisa sigue al anclaje A y el vástago al B, así la carrera se ve. Ángulos de la retro en el plano
// (u, y): u = distancia hacia atrás desde el pivote de giro, ángulo medido desde la horizontal hacia arriba.
// Velocidades y ciclos ilustrativos (los tiempos reales del cargador están en data.json).
import * as THREE from 'three';
import { V, PI } from '../lib.js';
import { flujo, flecha, rotulo } from '../vivo.js';

const R = d => d * PI / 180, M4 = () => new THREE.Matrix4();
const rot = (ax, p, a) => M4().makeTranslation(p.x, p.y, p.z).multiply(M4()['makeRotation' + ax](a)).multiply(M4().makeTranslation(-p.x, -p.y, -p.z));
const rotEje = (p, d, a) => M4().makeTranslation(p.x, p.y, p.z).multiply(M4().makeRotationAxis(d, a)).multiply(M4().makeTranslation(-p.x, -p.y, -p.z));
const tras = v => M4().makeTranslation(v.x, v.y, v.z);

// ---------------- geometría de articulaciones (pose neutra, coordenadas de mundo) ----------------
export function cinematica(D) {
  const s = D.alc / 557, K = { s };
  const uy = K.uy = (u, y, z = 0) => V(D.piv - u, y, z);
  // cargador: pivote en la torre, pasador del cucharón en el suelo y altura máxima del pasador (P)
  K.zA = D.bkW / 2 - 50;
  K.PL = V(D.grill - 138, 185 + (D.pinMax - 342) * 0.5, 0);
  K.PB = V(D.wb + D.alcCarg - 98, 32, 0);
  K.LA = Math.hypot(K.PB.x - K.PL.x, K.PB.y - K.PL.y); K.a0 = Math.atan2(K.PB.y - K.PL.y, K.PB.x - K.PL.x);
  K.aMax = Math.asin(Math.min(0.97, (D.pinMax - K.PL.y) / K.LA)) - K.a0;
  // puntos sobre el brazo del cargador en su propio marco (s a lo largo de la cuerda pivote->pasador, n normal hacia arriba)
  const ca = Math.cos(K.a0), sa = Math.sin(K.a0);
  K.pA = (sv, nv, z = 0) => V(K.PL.x + ca * sv - sa * nv, K.PL.y + sa * sv + ca * nv, z);
  K.pC = (dx, dy, z = 0) => V(K.PB.x + dx, K.PB.y + dy, z);   // marco del cucharón (neutro: horizontal)
  K.liftA = V(K.PL.x - 10, 100, 0); K.liftB = K.pA(0.42 * K.LA, 18);
  K.zV = K.zA - 14; K.dumpA = K.pA(0.55 * K.LA, 10); K.dumpB = K.pC(-25, 20);   // anclajes buscados para la carrera publicada (77-129 cm)
  // retro (largos estimados: pluma 265, brazo 195, cuchara 100 cm escalados con el alcance publicado)
  K.Lb = 265 * s; K.Ld = 195 * s; K.Lk = 100 * s;
  K.Fu = 22 * s; K.Fy = Math.max(50, D.ht - 279 * s); K.F = uy(K.Fu, K.Fy);
  K.PV = V(D.piv, 0, 0);
  K.tb0 = 105; K.td0 = -32.7;
  const T2 = [K.Fu + K.Lb * Math.cos(R(K.tb0)), K.Fy + K.Lb * Math.sin(R(K.tb0))]; K.T = uy(...T2);
  K.Q = uy(T2[0] + K.Ld * Math.cos(R(K.td0)), T2[1] + K.Ld * Math.sin(R(K.td0)));
  const bd = V(-Math.cos(R(K.tb0)), Math.sin(R(K.tb0)), 0), bm = V(Math.sin(R(K.tb0)), Math.cos(R(K.tb0)), 0);
  const dd = V(-Math.cos(R(K.td0)), Math.sin(R(K.td0)), 0), dn = V(Math.sin(R(K.td0)), Math.cos(R(K.td0)), 0);
  K.bd = bd; K.bm = bm; K.dd = dd; K.dn = dn;
  K.pB = (b, m, z = 0) => K.F.clone().addScaledVector(bd, b * s).addScaledVector(bm, m * s).setZ(z);   // pluma (b desde el pie, m hacia la joroba)
  K.pD = (a, n, z = 0) => K.T.clone().addScaledVector(dd, a * s).addScaledVector(dn, n * s).setZ(z);   // brazo (a desde T hacia la cuchara, n exterior)
  K.pK = (a, n, z = 0) => K.Q.clone().addScaledVector(dd, a * s).addScaledVector(dn, n * s).setZ(z);   // cuchara (marco neutro alineado al brazo)
  K.boomA = uy(-24 * s, K.Fy + 46 * s); K.boomB = K.pB(190, 35);   // carrera 134-230 cm (P: 134,2 + 97,2)
  K.dipA = K.pB(0.5 * 265, -16); K.dipB = K.pD(-32, -24);
  K.D1 = K.pK(-32, 6); K.K0 = K.pK(0, 30); K.J0 = K.pK(-20, 44); K.bkA = K.pD(26, 17);
  K.l1 = K.J0.distanceTo(K.D1); K.l2 = K.J0.distanceTo(K.K0);
  // estabilizadores: pivote bajo, pata de largo Ls que llega al suelo con la apertura publicada
  K.PS = sd => V(D.piv + 14, 95, sd * 70);
  const dz = D.estab / 2 - 70, dy = 7 - 95; K.Ls = Math.hypot(dz, dy); K.thUp = R(18); K.thDep = Math.atan2(dz, dy);
  K.pS = (sd, sv, nv) => { const a = K.thUp; return V(D.piv + 14, 95 + Math.cos(a) * sv - Math.sin(a) * nv, sd * (70 + Math.sin(a) * sv + Math.cos(a) * nv)); };
  K.stA = sd => V(D.piv + 14, 232, sd * 54); K.stB = sd => K.pS(sd, 46, 9);
  // giro: orejas de la torre a 24 cm del eje y anclajes en el bastidor
  K.swA = sd => V(D.piv + 62 * s, 86, sd * 40); K.swB = sd => V(D.piv + 12, 86, sd * 20.8);
  // ruedas y dirección
  K.CT = sd => V(0, D.rr - 2.5, sd * D.rtr / 2); K.CD = sd => V(D.wb, D.fr - 1.5, sd * D.ftr / 2);
  K.KP = sd => V(D.wb, D.fr - 1.5, sd * (D.ftr / 2 - 13));
  return K;
}

// ---------------- poses por etapa ----------------
const ss = x => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
function tramo(keys, t) {
  const T = keys[keys.length - 1][0], u = ((t % T) + T) % T;
  for (let i = 0; i < keys.length - 1; i++) if (u <= keys[i + 1][0]) {
    const [t0, a] = keys[i], [t1, b] = keys[i + 1], f = ss((u - t0) / (t1 - t0)), o = {};
    for (const k in a) o[k] = a[k] + (b[k] - a[k]) * f;
    return o;
  }
  return keys[0][1];
}
const CARGA = [[0, { a: 0, phi: 0 }], [1.2, { a: 0, phi: 30 }], [4.6, { a: 1, phi: 30 }], [5.7, { a: 1, phi: -47 }], [6.7, { a: 1, phi: 0 }], [9.3, { a: 0, phi: 0 }], [10.3, { a: 0, phi: 0 }]];
const ESTAB = [[0, { st: 0 }], [2.2, { st: 1 }], [3.6, { st: 1 }], [5.8, { st: 0 }], [7, { st: 0 }]];
const EXC0 = { tb: 38, td: -62, c: -30, psi: 0 };
const EXCAVA = [[0, EXC0], [2.4, { tb: 14, td: -72, c: -40, psi: 0 }], [4.8, { tb: 10, td: -122, c: 15, psi: 0 }], [6.2, { tb: 12, td: -128, c: 70, psi: 0 }],
  [8.2, { tb: 44, td: -100, c: 75, psi: 0 }], [9.8, { tb: 44, td: -100, c: 75, psi: 78 }], [11.3, { tb: 42, td: -72, c: -35, psi: 78 }], [13.5, EXC0], [14.3, EXC0]];
export const NEUTRA = K => ({ a: 0, phi: 0, st: 0, psi: 0, tb: K.tb0, td: K.td0, c: 0, steer: 0, roll: 0, spin: 0, fan: 0, seat: 0 });

export function juntas(K, t, capas = []) {
  const j = NEUTRA(K), has = c => capas.includes(c);
  if (has('energia')) { j.roll = -t * 1.3; j.spin = t * 9; j.fan = t * 14; }
  if (has('cargador')) { const c = tramo(CARGA, t); j.a = c.a * K.aMax; j.phi = R(c.phi); }
  if (has('estab')) j.st = tramo(ESTAB, t).st;
  if (has('giro')) { Object.assign(j, { st: 1, tb: 30, td: -68, c: R(-25) }); j.psi = R(80) * Math.sin(t * PI * 2 / 8); }
  if (has('excavacion')) { const e = tramo(EXCAVA, t); Object.assign(j, { st: 1, tb: e.tb, td: e.td, c: R(e.c) }); j.psi = R(e.psi); }
  if (has('direccion')) { j.steer = R(26) * Math.sin(t * 0.9); j.roll = -t * 0.7; j.fan = t * 14; }
  if (has('estab') || has('giro') || has('excavacion')) j.seat = PI;   // el operador gira el asiento hacia la retro
  return j;
}

// intersección de dos circunferencias en el plano xy (z del primer centro); lado = signo deseado del producto cruz
function circ(c1, r1, c2, r2, lado) {
  const d = Math.hypot(c2.x - c1.x, c2.y - c1.y); if (d > r1 + r2 || d < Math.abs(r1 - r2) || d < 1e-6) return null;
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d), h = Math.sqrt(Math.max(r1 * r1 - a * a, 0));
  const ex = (c2.x - c1.x) / d, ey = (c2.y - c1.y) / d, mx = c1.x + a * ex, my = c1.y + a * ey;
  return V(mx - lado * h * ey, my + lado * h * ex, c1.z);
}

// matrices delta de cada cuerpo para una pose j
export function cuerpos(K, j) {
  const B = { fijo: M4() };
  B.arm = rot('Z', K.PL, j.a);
  B.bkt = B.arm.clone().multiply(rot('Z', K.PB, j.phi - j.a));
  for (const [n, sd] of [['I', -1], ['D', 1]]) {
    const th = (K.thDep - K.thUp) * j.st;
    B['st' + n] = rot('X', K.PS(sd), sd * th);
    const p0 = K.pS(sd, K.Ls, 0); B['pad' + n] = tras(p0.clone().applyMatrix4(B['st' + n]).sub(p0));
    B['rT' + n] = rot('Z', K.CT(sd), j.roll);
    B['kn' + n] = rot('Y', K.KP(sd), j.steer);
    B['rD' + n] = B['kn' + n].clone().multiply(rot('Z', K.CD(sd), j.roll * (K.rrT || 1)));
  }
  B.sw = rot('Y', K.PV, j.psi);
  B.boom = B.sw.clone().multiply(rot('Z', K.F, R(K.tb0 - j.tb)));
  B.dip = B.boom.clone().multiply(rot('Z', K.T, R(K.td0 - j.td) - R(K.tb0 - j.tb)));
  B.bk = B.dip.clone().multiply(rot('Z', K.Q, j.c));
  // bieletas en el marco neutro del brazo
  const Kc = K.K0.clone().applyMatrix4(rot('Z', K.Q, j.c));
  const J = circ(K.D1, K.l1, Kc, K.l2, -1) || K._Jprev || K.J0; K._Jprev = J;
  const ang = (p, q) => Math.atan2(q.y - p.y, q.x - p.x);
  B.lg = B.dip.clone().multiply(rot('Z', K.D1, ang(K.D1, J) - ang(K.D1, K.J0)));
  B.lb = B.dip.clone().multiply(tras(J.clone().sub(K.J0))).multiply(rot('Z', K.J0, ang(J, Kc) - ang(K.J0, K.K0)));
  B.J = B.dip.clone().multiply(tras(J.clone().sub(K.J0)));
  B.steerRod = tras(V(0, 0, j.steer * 9));
  B.cardD = rotEje(K.cardD[0], K.cardD[1], j.spin); B.cardT = rotEje(K.cardT[0], K.cardT[1], j.spin);
  B.fan = rot('X', K.fanC, j.fan);
  B.seat = rot('Y', K.seatC, j.seat);
  return B;
}

// ---------------- modo Funciona: pose + capas ----------------
const AMAR = 0xffc83d, ROJO = 0xff5a5a, AZUL = 0x5aa9ff, VERDE = 0x4ade80, NAR = 0xff9f43, CIAN = 0x67e8f9, VIOL = 0xc084fc;
const juntar = (...objs) => { const g = new THREE.Group(); g.add(...objs); const f = []; g.traverse(o => o !== g && o.userData.tick && f.push(o.userData.tick)); g.userData.tick = c => f.forEach(t => t(c)); return g; };
const lbl = (t, p, o = {}) => rotulo(t, p, { esc: 18, ancho: Math.max(1.6, t.length * 0.36), ...o });
const fl = (pts, color, o = {}) => flujo(pts, { color, r: 1.1, tam: 2.6, n: 16, vel: 0.12, cono: true, ...o });

// ctx: { cuerposItems: [[item, nombreCuerpo]], cils: [{id, cam, vas, A0, B0, a, b, camExtra?, vasExtra?}], L: puntos de referencia }
export function vivo(D, K, ctx) {
  const { L } = ctx, ligas = [], est = {};
  const ligado = (cuerpo, ...objs) => { const g = juntar(...objs); ligas.push([g, cuerpo]); return g; };
  // flecha que sigue a un cilindro: sale del vástago en el sentido en que se mueve (naranja: extiende; celeste: recoge)
  const flechaCil = (id, txt) => {
    const ext = flecha(V(0, 0, 0), V(0, 1, 0), 34, NAR, 2.2), ret = flecha(V(0, 0, 0), V(0, 1, 0), 34, CIAN, 2.2), r = txt ? lbl(txt, V()) : null;
    const g = new THREE.Group(); g.add(ext, ret); if (r) g.add(r);
    g.userData.tick = () => {
      const e = est[id]; if (!e) return;
      const d = e.B.clone().sub(e.A).normalize(), on = Math.abs(e.v) > 0.02;
      ext.visible = on && e.v > 0; ret.visible = on && e.v < 0;
      ext.position.copy(e.B).addScaledVector(d, 6); ext.quaternion.setFromUnitVectors(V(0, 1, 0), d);
      ret.position.copy(e.B).addScaledVector(d, 40); ret.quaternion.setFromUnitVectors(V(0, 1, 0), d.clone().negate());
      if (r) r.position.copy(e.A).add(e.B).multiplyScalar(0.5).add(V(0, 22, 0));
    };
    return g;
  };
  const capas = {};
  // 1) energía: motor -> convertidor -> transmisión -> cardanes -> diferenciales -> ruedas
  const rT = [-1, 1].map(sd => K.CT(sd)), rD = [-1, 1].map(sd => K.CD(sd));
  capas.energia = juntar(
    fl([L.cig.clone().setX(L.motorX1), L.cig, L.conv], AMAR),
    fl([L.conv, L.trIn, L.trOutT], AMAR),
    fl([L.trOutT, K.cardT[2], V(0, rT[0].y, 0)], AMAR), fl([L.trOutD, K.cardD[2], V(D.wb - 12, rD[0].y, 0)], AMAR),
    ...rT.map(c => fl([V(0, c.y, 0), V(0, c.y, c.z * 0.6), c], AMAR, { n: 8 })), ...rD.map(c => fl([V(D.wb - 12, c.y, 0), V(D.wb, c.y, c.z * 0.5), c], AMAR, { n: 8 })),
    lbl('motor', L.cig.clone().add(V(20, 60, 0))), lbl('convertidor', L.conv.clone().add(V(0, 45, -30))), lbl('transmisión', L.trIn.clone().add(V(-30, 50, 0))),
    lbl('diferencial', V(0, rT[0].y + 30, 0)), lbl('eje delantero', V(D.wb, rD[0].y + 40, 0)));
  // 2) circuito: estanque -> filtro de succión -> bomba -> válvulas -> cilindros; retorno por el filtro
  const vC = L.valC, vR = L.valR;
  capas.circuito = juntar(
    fl([L.tanqueH, L.tanqueH.clone().setY(40), L.bomba.clone().add(V(0, -6, 30)), L.bomba], VERDE),
    fl([L.bomba, L.bomba.clone().add(V(-10, 30, 25)), vC], ROJO), fl([vC, vC.clone().add(V(-40, 10, 0)), V(30, 105, 30), vR.clone().add(V(20, -10, 0)), vR], ROJO),
    ligado('arm', fl([vC, K.liftA.clone().setZ(K.zA), K.pA(0.6 * K.LA, 18, K.zA), K.dumpA.clone().setZ(K.zV)], ROJO, { n: 12 })),
    ligado('boom', fl([vR, K.boomA.clone().setZ(14), K.pB(70, 26, 14), K.dipA.clone().setZ(14), K.pB(250, 22, 14)], ROJO, { n: 12 })),
    ligado('dip', fl([K.pD(-10, 18, 10), K.bkA.clone().setZ(10)], ROJO, { n: 6 })),
    fl([vR.clone().add(V(0, 0, -20)), L.filtroH, L.tanqueH.clone().add(V(0, 30, 0))], AZUL), fl([vC.clone().add(V(0, -10, -15)), L.filtroH], AZUL),
    lbl('estanque', L.tanqueH.clone().add(V(0, 55, 40))), lbl('bomba', L.bomba.clone().add(V(0, -30, 40))), lbl('válvula cargador', vC.clone().add(V(0, 45, 40))),
    lbl('válvula retro', vR.clone().add(V(-10, 60, 0))), lbl('filtro', L.filtroH.clone().add(V(0, 30, 40))));
  // 3) cargador, 4) estabilizadores, 5) giro, 6) excavación: flechas sobre los cilindros que actúan
  capas.cargador = juntar(flechaCil('levD', 'levante'), flechaCil('levI'), flechaCil('volD', 'volteo'), flechaCil('volI'));
  capas.estab = juntar(flechaCil('stI', 'estabilizador'), flechaCil('stD', 'estabilizador'));
  const arco = Array.from({ length: 19 }, (_, i) => { const a = R(-80 + i * 160 / 18); return V(D.piv - Math.cos(a) * 120, 30, Math.sin(a) * 120); });
  capas.giro = juntar(flechaCil('swI', 'giro'), flechaCil('swD'), flujo(arco, { color: VIOL, r: 1, tam: 3, n: 6, vel: 0.15, cono: true }), lbl('giro 180°', V(D.piv - 140, 60, 0)));
  capas.excavacion = juntar(flechaCil('pluma', 'pluma'), flechaCil('brazo', 'brazo'), flechaCil('cuchara', 'cuchara'));
  // 7) dirección: bomba de dirección -> orbitrol -> cilindro de dirección; frenos de discos húmedos en el eje trasero
  capas.direccion = juntar(
    fl([L.bomba, L.bomba.clone().add(V(-20, 50, 10)), L.volante.clone().add(V(0, -40, 0)), L.volante.clone().add(V(10, -10, 0))], ROJO, { n: 10 }),
    fl([L.volante.clone().add(V(10, -10, 0)), V(L.volante.x + 60, 80, 20), V(D.wb + 14, D.fr - 8, 20), V(D.wb + 14, D.fr - 8, 40)], ROJO, { n: 10 }),
    lbl('orbitrol', L.volante.clone().add(V(0, 30, 0))), lbl('cilindro de dirección', V(D.wb + 20, D.fr + 40, 0)),
    lbl('frenos de discos', V(0, D.rr + 50, 0)), flecha(V(0, D.rr + 30, 40), V(0, -1, 0), 22, ROJO, 2), flecha(V(0, D.rr + 30, -40), V(0, -1, 0), 22, ROJO, 2));

  // gancho de pose: articulación jerárquica + cilindros + capas ligadas
  const q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3();
  const aplicar = (obj, m) => { m.decompose(p, q, sc); obj.position.copy(p); obj.quaternion.copy(q); };
  let prev = null;
  function pose(anim, et) {
    const j = juntas(K, anim.t, et?.capas || []), B = cuerpos(K, j);
    for (const [it, c] of ctx.cuerposItems) aplicar(it.obj, B[c]);
    for (const c of ctx.cils) {
      const A = c.A0.clone().applyMatrix4(B[c.a]), Bp = c.B0.clone().applyMatrix4(B[c.b]);
      B[c.a].decompose(p, q, sc);
      const d0 = c.B0.clone().sub(c.A0).normalize().applyQuaternion(q), d1 = Bp.clone().sub(A).normalize();
      const qq = new THREE.Quaternion().setFromUnitVectors(d0, d1).multiply(q);
      c.cam.obj.quaternion.copy(qq); c.cam.obj.position.copy(A).sub(c.A0.clone().applyQuaternion(qq));
      c.vas.obj.quaternion.copy(qq); c.vas.obj.position.copy(Bp).sub(c.B0.clone().applyQuaternion(qq));
      // subpiezas del cilindro (contrato): pistón y vástago siguen al vástago; cabezal, sellos y bujes, a la camisa
      for (const [lst, ref] of [[c.camExtra, c.cam], [c.vasExtra, c.vas]]) for (const it of lst || []) { it.obj.quaternion.copy(ref.obj.quaternion); it.obj.position.copy(ref.obj.position); }
      const Lc = A.distanceTo(Bp), e = est[c.id] || (est[c.id] = {});
      e.v = prev != null && anim.t !== prev ? (Lc - e.L) / Math.max(anim.t - prev, 1e-3) / 30 : e.v || 0; e.L = Lc; e.A = A; e.B = Bp;
    }
    for (const [g, c] of ligas) aplicar(g, B[c]);
    prev = anim.t;
  }
  return { capas, pose };
}
