// Modelo 3D procedural de la retroexcavadora (Case 580N / 580 Super N; CAT 420F2 y JCB 3CX con la misma arquitectura
// escalada a sus medidas). Unidades cm; ver comun.js para la convención y la tabla de medidas (publicadas vs estimadas).
// Este archivo arma el layout (L, K) y las piezas sin módulo; motor, transmisión e hidráulica viven en modelo_<modulo>.js
// (uno por agente, ver CONTRATO.md) y se invocan con un ctx común. Las piezas nuevas salen de contrato.json.
import * as THREE from 'three';
import * as lib from '../lib.js';
import { PI, V, mat, mesh } from '../lib.js';
import * as comun from './comun.js';
import { NOMBRES, PIEZAS_CONTRATO, aplicaA, armador, dims, claveDe, placa, chapa, entre, caja, cajaR, tubo, letrero, neumatico, llanta, acabado as A } from './comun.js';
import { cinematica, juntas, cuerpos, vivo } from './vivo.js';
import motor from './modelo_motor.js';
import transmision from './modelo_transmision.js';
import hidraulica from './modelo_hidraulica.js';

export function construir(cfg) {
  const D = dims(cfg.m), clave = claveDe(cfg.m), E = cfg.estilo || {}, K = cinematica(D), s = K.s;
  const col = k => E[k] || cfg.color;
  const { parts, add } = armador(cfg.m);
  const ligar = [], cils = [];
  const liga = (its, cuerpos) => its.forEach((it, i) => { const c = [].concat(cuerpos)[i] ?? [].concat(cuerpos)[0]; if (c && c !== 'fijo') ligar.push([it, c]); });
  const [marcaTxt, ...resto] = String(cfg.etiqueta || 'CASE 580N').split(' '), modeloTxt = resto.join(' ');
  const pint = () => A.pintura(col('cuerpo')), osc = (c = col('chasis')) => A.oscuro(c);
  const W = (pts, f) => pts.map(([u, y]) => { const p = K.uy(u, y); return [p.x, p.y]; });   // (u,y) -> (x,y)


  // ---------- distribución general (L: puntos compartidos con los módulos; no moverlos sin avisar en CONTRATO.md) ----------
  const yT = D.rr - 2.5, yD = D.fr - 1.5;                 // centros de ruedas
  const cabX1 = D.grill - 160, cabX0 = cabX1 - 180, cabY0 = D.rr + 66, cw = 56 + (D.ancho - 207) * 0.15;
  const hw = 43 + (D.ancho - 207) * 0.12, hx0 = cabX1, hTop = 175 + (D.cab - 272) * 0.3;
  const mX0 = D.grill - 128, mX1 = D.grill - 36, yC = 104;   // motor y cigüeñal
  const lm = mX1 - mX0 - 14, xcM = (mX0 + mX1) / 2 + 4, kM = D.motorL >= 4.4 ? 1.08 : 1;   // largo útil, centro y escala del bloque
  const xlC = Math.min(cabX1 - 4, D.wb - D.fr - 12) - 70;                                  // largo del estanque de combustible
  const L = {
    cig: V(mX1 - 10, yC, 0), motorX1: mX1, conv: V(mX0 - 8, yC, 0), trIn: V(mX0 - 30, 92, 0), trOutT: V(48, 66, 0), trOutD: V(78, 52, 0),
    tanqueH: V(95, 70, 56), valC: V(cabX1 + 6, 112, 26), valR: V(cabX0 - 12, cabY0 + 12, 0), filtroH: V(cabX1 - 8, 116, 58),
    volante: V(cabX1 - 34, cabY0 + 70, 0),
    // motor: eje del cigüeñal en y = yC, volante atrás (mX0), polea adelante (mX1); cilindro 1 adelante
    motorC: V(xcM, yC, 0), culata: V(xcM, yC + 22 * kM, 0), carter: V(xcM, yC - 42 * kM, 0), volanteM: V(mX0 + 9, yC, 0),
    polea: V(mX1 - 2, yC, 0), bombaAgua: V(mX1 - 2, yC + 30, 0), alternador: V(mX1 - 8, yC + 22, 24), arranque: V(mX0 + 10, yC - 14, -24),
    turbo: V(mX0 + 22, yC + 22, 40), filtroAire: V(mX0 + 42, yC + 48, -22), escape: V(cabX1 + 32, yC + 34, 28), radiador: V(D.grill - 14, yC + 2, 0),
    // H1 (M pdf 215): bomba hidráulica ADELANTE, coaxial con el cigüeñal, unida a su polea por el acople (antes: V(mX0 - 18, 62, 0))
    acople: V(mX1 + 3, yC, 0), bomba: V(mX1 + 11, yC, 0),
    tanqueC: V(70 + xlC / 2, 70, -(cw - 4)), trC: V((46 + mX0 - 16) / 2, 76, 0),
    ejeT: V(0, yT, 0), ejeD: V(D.wb, yD, 0), difD: V(D.wb - 8, yD + 1, 0), cab: V((cabX0 + cabX1) / 2, (cabY0 + D.cab) / 2, 0),
  };
  L.orbitrol = V(L.volante.x + 22, cabY0 + 10, 0);
  K.cardD = [L.trOutD, V(D.wb - 26, yD + 2, 0).sub(L.trOutD).normalize(), L.trOutD.clone().lerp(V(D.wb - 26, yD + 2, 0), 0.5)];
  K.cardT = [L.trOutT, V(20, yT, 0).sub(L.trOutT).normalize(), L.trOutT.clone().lerp(V(20, yT, 0), 0.5)];
  // el ventilador va en el eje de la bomba de agua (sobre el cigüeñal), así deja paso al acople y la bomba hidráulica (H1)
  K.fanC = V(D.grill - 30, L.bombaAgua.y, 0); K.seatC = V(cabX0 + 70, cabY0, 0); K.rrT = D.rr / D.fr;

  {   // capó (cáscara): costados, techo inclinado, parrilla y focos
    const p = pint(), ne = A.oscuro('#17191b'), vi = mat('#e8eef2', { metalness: 0.2, roughness: 0.1, emissive: '#000' });
    const perf = [[hx0, 92], [hx0, hTop], [hx0 + 70, hTop], [D.grill - 10, hTop - 14], [D.grill, hTop - 24], [D.grill, 92]];
    const lados = [-1, 1].map(sd => placa(perf, 1.4, p, sd * hw));
    const techo = chapa([[hx0, hTop], [hx0 + 70, hTop], [D.grill - 10, hTop - 14], [D.grill, hTop - 24]], -1.6, 2 * hw, p);
    const parrilla = caja(2, hTop - 26 - 96, 2 * hw - 4, D.grill + 0.5, (hTop - 24 + 94) / 2, 0, mat('#1a1c1e', { map: lienzoRejilla() }));
    const focos = [-1, 1].map(sd => cil3(V(D.grill - 2, hTop - 32, sd * (hw - 10)), V(D.grill + 2, hTop - 32, sd * (hw - 10)), 5, vi));
    const rejillas = [-1, 1].flatMap(sd => [0, 1, 2, 3].map(i => caja(28, 1.6, 0.6, D.grill - 40, hTop - 30 - i * 6, sd * (hw + 0.8), ne)));
    const txt = [-1, 1].flatMap(sd => {
      const c = letrero(marcaTxt, 44, 12, col('texto'), marcaFondo()), m = letrero(modeloTxt, 30, 8, col('texto'), marcaFondo());
      c.position.set(hx0 + 62, hTop - 22, sd * (hw + 1)); m.position.set(hx0 + 22, hTop - 38, sd * (hw + 1));
      if (sd < 0) { c.rotation.y = PI; m.rotation.y = PI; } return [c, m];
    });
    add('capot', [[[...lados, techo, parrilla, ...focos, ...rejillas, ...txt], V(0, 150, 0)]], true);
  }

  // ================= RUEDAS =================
  for (const [id, sd, tras] of [['rueda_tras_i', -1, 1], ['rueda_tras_d', 1, 1], ['rueda_del_i', -1, 0], ['rueda_del_d', 1, 0]]) {
    const c = tras ? K.CT(sd) : K.CD(sd), Rr = tras ? D.rr : D.fr, Wr = tras ? D.rw : D.fw, rl = tras ? D.rimT : D.rimD;
    const gm = mat('#1d1e20', { metalness: 0, roughness: 0.93 }), ll = A.pintura(col('llanta')), tu = mat('#7c8288', { metalness: 0.7 });
    const neu = neumatico(Rr, Wr, rl, tras ? 22 : 18, gm); neu.position.copy(c);
    const lt = llanta(rl, Wr, sd, ll, tu); lt.position.copy(c);
    const txt = letrero(tras ? D.rtxt : D.ftxt, 26, 5, '#9a9da1'); txt.position.set(c.x, c.y + (rl + Rr) / 2 + 2, c.z + sd * (Wr * 0.49 + 0.3)); if (sd < 0) txt.rotation.y = PI;
    const its = add(id, [[[neu, txt], V(tras ? 0 : 50, 0, sd * 140)], [lt, V(tras ? 0 : 50, 0, sd * 80)]]);
    liga(its, (tras ? 'rT' : 'rD') + (sd < 0 ? 'I' : 'D'));
  }

  // ================= ASIENTO Y GUARDABARROS =================
  {
    const tela = mat('#2c2e31', { roughness: 0.9 }), ac = A.oscuro('#3a3d41'), c = K.seatC;
    const g = [entre(V(c.x, c.y, 0), V(c.x, c.y + 26, 0), 5, ac), cajaR(46, 10, 48, 4, c.x, c.y + 32, 0, tela), cajaR(10, 52, 46, 4, c.x - 24, c.y + 62, 0, tela), cajaR(8, 14, 30, 3, c.x - 28, c.y + 96, 0, tela),
      ...[-1, 1].map(sd => caja(30, 4, 6, c.x - 4, c.y + 48, sd * 26, ac))];
    ligar.push(...add('asiento', [[g, V(0, 120, 0)]]).map(it => [it, 'seat']));
  }
  {   // guardabarros: traseros fijos, delanteros viran con las manguetas
    const p = pint(), its = [];
    const arco = (c, Rr, Wr, a0, a1, sd) => { const g = new THREE.CylinderGeometry(Rr + 7, Rr + 7, Wr + 6, 32, 1, true, a0, a1 - a0); g.rotateX(PI / 2); const m = mesh(g, p, c.x, c.y, c.z + sd * 1); return m; };
    const tr = sd => { const c = K.CT(sd); const a = arco(c, D.rr, D.rw, PI * 0.5, PI * 1.45, sd); return [a, caja(4, 30, D.rw + 6, c.x - D.rr - 6, c.y + 6, c.z, p)]; };
    const de = sd => { const c = K.CD(sd); return [arco(c, D.fr, D.fw, PI * 0.7, PI * 1.35, sd), caja(10, 4, 12, c.x, c.y + D.fr * 0.5, c.z - sd * (D.fw / 2 + 4), p)]; };
    const it = add('guardabarros', [[tr(-1), V(0, 60, -90)], [tr(1), V(0, 60, 90)], [de(-1), V(60, 50, -90)], [de(1), V(60, 50, 90)]]);
    liga(it, ['fijo', 'fijo', 'knI', 'knD']);
  }

  // ================= CARGADOR FRONTAL =================
  {
    const p = A.pintura(col('brazo')), LA = K.LA / 240, its = [];
    const prof = [[-14, 10], [0.45 * K.LA, 54], [K.LA + 6, 9], [K.LA + 9, -4], [K.LA - 4, -12], [0.45 * K.LA + 6, 31], [12, -14], [-12, -10]];
    const g = [];
    for (const sd of [-1, 1]) {
      const pts = prof.map(([sv, nv]) => { const q = K.pA(sv, nv); return [q.x, q.y]; });
      g.push(placa(pts, 9, p, sd * K.zA, 0.8));
      const lug = K.liftB, la = K.dumpA;
      g.push(placa([[lug.x - 8, lug.y - 6], [lug.x + 8, lug.y - 6], [lug.x + 14, lug.y + 18], [lug.x - 14, lug.y + 18]], 3, p, sd * (K.zA) + 6), placa([[lug.x - 8, lug.y - 6], [lug.x + 8, lug.y - 6], [lug.x + 14, lug.y + 18], [lug.x - 14, lug.y + 18]], 3, p, sd * (K.zA) - 6));
      g.push(caja(16, 16, 18, la.x, la.y, sd * (K.zA - 11), p));   // soporte del cilindro de volteo
    }
    const tc = K.pA(0.56 * K.LA, 30); g.push(entre(V(tc.x, tc.y, -K.zA), V(tc.x, tc.y, K.zA), 7, p, 20));
    ligar.push(...add('brazos_cargador', [[g, V(120, 50, 0)]]).map(it => [it, 'arm']));
  }

  // ================= RETROEXCAVADORA =================
  {   // torre de giro (gira con el giro)
    const p = pint(), f = A.fundicion('#4d5258');
    const pf = [[-16, 40], [30, 40], [36, K.Fy + 8], [12, 132], [-26, K.Fy + 74], [-28, K.Fy + 54], [-18, 92]].map(([u, y]) => [u * s, y]);
    const g = [entre(V(D.piv, 42, 0), V(D.piv, 128, 0), 13, f, 24), ...[-1, 1].map(sd => placa(W(pf), 5, p, sd * 15 * s)),
      ...[-1, 1].map(sd => { const b = K.swB(sd); return placa([[D.piv - 4, -8 * sd], [b.x + 4, b.z - 5], [b.x + 4, b.z + 5], [D.piv + 4, 8 * sd]].map(([x, z]) => [x, z]), 6, p, 0); })];
    g.slice(-2).forEach(o => { o.rotation.x = PI / 2; o.position.y = 89; });
    ligar.push(...add('base_giro', [[g, V(-120, 0, 0)]]).map(it => [it, 'sw']));
  }
  {   // pluma acodada (tipo S) con letrero
    const p = A.pintura(col('pluma')), e = 0.6 * 265;
    const prof = [[-16, 10], [40, 26], [e, 40], [265 + 4, 13], [265 + 13, 2], [265 + 8, -12], [e + 8, 10], [60, -6], [14, -15], [-12, -12]].map(([b, m]) => { const q = K.pB(b, m); return [q.x, q.y]; });
    const g = [placa(prof, 22 * s, p, 0, 1.2)];
    const lug = (q, z) => placa([[q.x - 7, q.y - 7], [q.x + 7, q.y - 7], [q.x + 7, q.y + 7], [q.x - 7, q.y + 7]], 3, p, z);
    for (const z of [-8, 8]) g.push(lug(K.dipA, z * s), lug(K.boomB, z * s));
    const ang = Math.atan2(K.bd.y, K.bd.x), mid = K.pB(0.36 * 265, 18);
    for (const sd of [-1, 1]) { const t = letrero(marcaTxt, 70 * s, 16 * s, col('texto'), marcaFondo()); t.position.set(mid.x, mid.y, sd * (11 * s + 1.4)); t.rotation.set(0, sd < 0 ? PI : 0, sd < 0 ? -ang + PI : ang + PI); g.push(t); }
    ligar.push(...add('pluma', [[g, V(-190, 90, 0)]]).map(it => [it, 'boom']));
  }
  {   // brazo (dipper)
    const p = A.pintura(col('pluma')), Ld = 195;
    const prof = [[-14, 14], [Ld * 0.5, 13], [Ld - 10, 10], [Ld + 5, 4], [Ld + 6, -6], [Ld - 20, -10], [Ld * 0.5, -13], [10, -14], [-22, -34], [-40, -30], [-34, -6]].map(([a, n]) => { const q = K.pD(a, n); return [q.x, q.y]; });
    const g = [placa(prof, 18 * s, p, 0, 1)];
    for (const z of [-7, 7]) g.push(placa([[K.bkA.x - 7, K.bkA.y - 7], [K.bkA.x + 7, K.bkA.y - 7], [K.bkA.x + 7, K.bkA.y + 7], [K.bkA.x - 7, K.bkA.y + 7]], 3, p, z * s));
    ligar.push(...add('brazo_retro', [[g, V(-300, 60, 0)]]).map(it => [it, 'dip']));
  }
  {   // bieletas: guía (brazo -> J) y de la cuchara (J -> K)
    const ac = A.oscuro('#2e3236'), its = [];
    const barra = (p0, p1, z) => entre(V(p0.x, p0.y, z), V(p1.x, p1.y, z), 3.2, ac, 10);
    const lg = [-1, 1].map(sd => barra(K.D1, K.J0, sd * 11 * s)), lb = [-1, 1].map(sd => barra(K.J0, K.K0, sd * 6 * s));
    const it = add('biela_cuchara', [[lg, V(-360, 40, 0)], [lb, V(-380, 50, 0)]]); liga(it, ['lg', 'lb']);
  }

  // ================= ESTABILIZADORES =================
  for (const [id, sd] of [['estab_i', -1], ['estab_d', 1]]) {
    const p = A.pintura(col('estab')), ac = A.oscuro('#2a2c2f');
    const pts = [[-8, -6], [K.Ls * 0.55, -9], [K.Ls + 2, -6], [K.Ls + 2, 7], [K.Ls * 0.55, 13], [-8, 9]].map(([a, b]) => K.pS(sd, a, b));
    // pata: polígono en el plano (z, y) extruido a lo largo de x
    const pata = placa(pts.map(q => [q.z, q.y]), 16, p, 0, 1); pata.rotation.y = -PI / 2; pata.position.x = D.piv + 14;
    const ear = K.stB(sd), lug = placa([[ear.z - 6, ear.y - 6], [ear.z + 6, ear.y - 6], [ear.z + 6, ear.y + 6], [ear.z - 6, ear.y + 6]], 18, p, 0); lug.rotation.y = -PI / 2; lug.position.x = D.piv + 14;
    const t = K.pS(sd, K.Ls, 0), pad = [caja(34, 4, 40, t.x, t.y + 5, t.z, ac), caja(24, 8, 10, t.x, t.y + 9, t.z, ac)];
    // la zapata se arma plana sobre la punta y baja paralela al suelo
    const its = add(id, [[[pata, lug], V(-30, 20, sd * 120)], [pad, V(-30, 50, sd * 160)]]);
    liga(its, ['st' + (sd < 0 ? 'I' : 'D'), 'pad' + (sd < 0 ? 'I' : 'D')]);
  }

  // ================= MÓDULOS (motor, transmisión, hidráulica) =================
  // ctx: todo lo que usan los módulos. add(id, [[objetos, dirExplosión], ...], shell) es el mismo armador de arriba.
  const ctx = { THREE, ...lib, ...comun, A, D, K, L, s, m: cfg.m, clave, cfg, estilo: E, col, pint, osc, add, liga, ligar, cils, parts, cil3, marcaFondo, punto,
    yT, yD, cabX0, cabX1, cabY0, cw, hw, hx0, hTop, mX0, mX1, yC, lm, xcM, kM, juntas, cuerpos, W };
  for (const [modulo, f] of [['motor', motor], ['transmision', transmision], ['hidraulica', hidraulica]]) {
    const piezas = Object.values(PIEZAS_CONTRATO).filter(e => e.modulo === modulo && aplicaA(e, cfg.m));
    f({ ...ctx, modulo, piezas, pendientes: () => pendientes(piezas) });
  }

  const faltan = [...Object.keys(NOMBRES), ...Object.values(PIEZAS_CONTRATO).filter(e => aplicaA(e, cfg.m)).map(e => e.id)].filter(id => !parts[id]);
  if (faltan.length) console.warn('retroexcavadora: faltan piezas del contrato', faltan);
  return { parts, vivo: vivo(D, K, { cuerposItems: ligar, cils, L }), K, D, clave };

  // ---------- auxiliares locales ----------
  function cil3(p0, p1, r, m, abierto = false) { const o = entre(p0, p1, r, m, 28); if (abierto) o.material.side = THREE.DoubleSide; return o; }
  function marcaFondo() { return D.marca === 'jcb' ? { fondo: '#111111' } : {}; }
  // punto de anclaje del contrato: «L.x», «K.x», «K.fn(±1)» o «pieza:id» (centro de su caja), más el offset [x,y,z]
  function punto(a, off) {
    let p;
    if (a.startsWith('pieza:')) { const b = new THREE.Box3(); parts[a.slice(6)]?.items.forEach(i => b.expandByObject(i.obj)); p = b.isEmpty() ? null : b.getCenter(V(0, 0, 0)); }
    else { const [, o, k, arg] = a.match(/^([LK])\.(\w+)(?:\((-?\d+)\))?$/) || [], v = (o === 'L' ? L : K)[k]; p = typeof v === 'function' ? v(+arg) : v?.isVector3 ? v.clone() : null; }
    if (!p) throw new Error(`retroexcavadora: anclaje desconocido «${a}»`);
    return off ? p.add(V(...off)) : p;
  }
  // placeholder: cubo magenta de 2 cm en el anclaje, para los ids del contrato sin geometría todavía
  function pendientes(piezas) {
    for (const e of piezas) if (!parts[e.id]) {
      const p = punto(e.anclaje, e.offset), o = caja(2, 2, 2, p.x, p.y, p.z, mat('#ff00ff')); o.userData.placeholder = true;
      add(e.id, [[o, V(...e.explosion)]]);
    }
  }
}

function lienzoRejilla() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d');
  g.fillStyle = '#121314'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#3a3d41'; for (let i = 0; i < 64; i += 8) g.fillRect(0, i, 64, 3);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 4); return t;
}
