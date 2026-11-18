// Modelo 3D procedural de la retroexcavadora (Case 580N / 580 Super N; CAT 420F2 y JCB 3CX con la misma arquitectura
// escalada a sus medidas). Unidades cm; ver comun.js para la convención y la tabla de medidas (publicadas vs estimadas).
import * as THREE from 'three';
import { PI, V, mat, mesh } from '../lib.js';
import { NOMBRES, armador, dims, claveDe, placa, chapa, entre, caja, cajaR, tubo, pasador, fundir, letrero, neumatico, llanta, cilindro, acabado as A } from './comun.js';
import { cinematica, juntas, cuerpos, vivo } from './vivo.js';

export function construir(cfg) {
  const D = dims(cfg.m), clave = claveDe(cfg.m), E = cfg.estilo || {}, K = cinematica(D), s = K.s;
  const col = k => E[k] || cfg.color;
  const { parts, add } = armador(cfg.m);
  const ligar = [], cils = [];
  const liga = (its, cuerpos) => its.forEach((it, i) => { const c = [].concat(cuerpos)[i] ?? [].concat(cuerpos)[0]; if (c && c !== 'fijo') ligar.push([it, c]); });
  const [marcaTxt, ...resto] = String(cfg.etiqueta || 'CASE 580N').split(' '), modeloTxt = resto.join(' ');
  const pint = () => A.pintura(col('cuerpo')), osc = (c = col('chasis')) => A.oscuro(c);
  const W = (pts, f) => pts.map(([u, y]) => { const p = K.uy(u, y); return [p.x, p.y]; });   // (u,y) -> (x,y)

  // ---------- distribución general ----------
  const yT = D.rr - 2.5, yD = D.fr - 1.5;                 // centros de ruedas
  const cabX1 = D.grill - 160, cabX0 = cabX1 - 180, cabY0 = D.rr + 66, cw = 56 + (D.ancho - 207) * 0.15;
  const hw = 37 + (D.ancho - 207) * 0.12, hx0 = cabX1, hTop = 168 + (D.cab - 272) * 0.3;
  const mX0 = D.grill - 128, mX1 = D.grill - 36, yC = 104;   // motor y cigüeñal
  const L = {
    cig: V(mX1 - 10, yC, 0), motorX1: mX1, conv: V(mX0 - 8, yC, 0), trIn: V(mX0 - 30, 92, 0), trOutT: V(48, 66, 0), trOutD: V(78, 52, 0),
    tanqueH: V(95, 70, 56), bomba: V(mX0 - 18, 62, 0), valC: V(cabX1 + 6, 112, 26), valR: V(cabX0 - 12, cabY0 + 12, 0), filtroH: V(cabX1 - 8, 116, 58),
    volante: V(cabX1 - 34, cabY0 + 70, 0),
  };
  K.cardD = [L.trOutD, V(D.wb - 26, yD + 2, 0).sub(L.trOutD).normalize(), L.trOutD.clone().lerp(V(D.wb - 26, yD + 2, 0), 0.5)];
  K.cardT = [L.trOutT, V(20, yT, 0).sub(L.trOutT).normalize(), L.trOutT.clone().lerp(V(20, yT, 0), 0.5)];
  K.fanC = V(D.grill - 30, yC + 2, 0); K.seatC = V(cabX0 + 70, cabY0, 0); K.rrT = D.rr / D.fr;

  // ================= MOTOR Y ENFRIAMIENTO =================
  {
    const bl = A.fundicion('#4b5157'), cu = A.fundicion('#3a3e43'), tapa = A.oscuro('#202326'), ac = mat('#8b9198', { metalness: 0.7, roughness: 0.35 }), tur = mat('#9a8f84', { metalness: 0.75, roughness: 0.4 });
    const lm = mX1 - mX0 - 14, xc = (mX0 + mX1) / 2 + 4, k = D.motorL >= 4.4 ? 1.08 : 1;
    const bloque = [cajaR(lm, 42 * k, 46, 3, xc, yC - 6, 0, bl), caja(lm * 0.95, 8, 40, xc, yC - 28 * k, 0, bl)];
    for (let i = 0; i < 4; i++) bloque.push(caja(3, 30, 49, mX0 + 20 + i * lm / 4, yC - 4, 0, bl));   // nervios del bloque
    bloque.push(cil3(V(mX0 + 4, yC, 0), V(mX0 + 14, yC, 0), 30, bl));                                 // carcasa del volante
    bloque.push(cil3(V(mX1 - 6, yC - 4, 0), V(mX1 + 2, yC - 4, 0), 13, ac), cil3(V(mX1 + 2, yC + 22, 18), V(mX1 + 6, yC + 22, 18), 8, ac)); // polea y alternador
    bloque.push(cil3(V(mX1 - 14, yC + 22, 26), V(mX1 - 2, yC + 22, 26), 9, ac));
    const carter = [cajaR(lm * 0.9, 20, 38, 4, xc, yC - 42 * k, 0, cu)];
    const culata = [cajaR(lm, 16, 40, 2, xc, yC + 22 * k, 0, cu), cajaR(lm * 0.92, 10, 32, 4, xc, yC + 34 * k, 0, tapa)];
    for (let i = 0; i < 4; i++) culata.push(entre(V(mX0 + 22 + i * lm / 4.2, yC + 30 * k, -8), V(mX0 + 22 + i * lm / 4.2, yC + 44 * k, -10), 1.6, ac, 8));
    culata.push(tubo([V(mX0 + 16, yC + 40 * k, -12), V(xc, yC + 42 * k, -14), V(mX1 - 18, yC + 40 * k, -12)], 1.2, ac));   // riel común
    culata.push(caja(lm * 0.8, 12, 10, xc, yC + 18, -25, bl));                                                           // múltiple de admisión
    const turbo = [caja(lm * 0.8, 10, 9, xc, yC + 16, 26, A.fundicion('#6d5a4a')), cil3(V(mX0 + 22, yC + 22, 34), V(mX0 + 22, yC + 22, 44), 10, tur), mesh(new THREE.TorusGeometry(9, 4.5, 10, 24), tur, mX0 + 22, yC + 22, 40)];
    const it = add('motor', [[bloque, V(0, 70, 0)], [carter, V(0, -40, 0)], [culata, V(0, 120, 0)], [turbo, V(0, 60, 90)]]);
    void it;
  }
  {
    const nu = mat('#7d8790', { metalness: 0.6, roughness: 0.45 }), ta = A.oscuro('#2b2e33'), al = mat('#a7b0b8', { metalness: 0.7, roughness: 0.4 });
    const rx = D.grill - 14, nucleo = lienzoAletas();
    const core = mesh(new THREE.BoxGeometry(6, 68, 62), mat('#8a949c', { map: nucleo, metalness: 0.5, roughness: 0.5 }), rx, yC + 2, 0);
    add('radiador', [[[core, caja(8, 8, 66, rx, yC + 40, 0, ta), caja(8, 8, 66, rx, yC - 36, 0, ta), caja(4, 24, 58, rx + 6, yC + 26, 0, al), entre(V(rx, yC + 44, 18), V(rx, yC + 54, 18), 2.5, ta),
      tubo([V(rx - 4, yC + 30, -20), V(mX1 - 4, yC + 26, -20)], 2.6, A.goma()), tubo([V(rx - 4, yC - 28, 22), V(mX1 - 8, yC - 18, 18)], 2.6, A.goma()),
      cil3(V(rx - 20, yC + 2, 0), V(rx - 6, yC + 2, 0), 31, ta, true)], V(120, 30, 0)]]);
  }
  {
    const pa = A.oscuro('#1f2226'), c = K.fanC, g = [];
    g.push(cil3(c.clone().add(V(-3, 0, 0)), c.clone().add(V(4, 0, 0)), 7, mat('#7d848c', { metalness: 0.7 })));
    for (let i = 0; i < 7; i++) {   // 7 aspas, 499 mm (P, hoja 580N)
      const a = i / 7 * PI * 2, b = mesh(new THREE.BoxGeometry(1, 19, 8.5), pa, c.x, c.y + Math.cos(a) * 15, c.z + Math.sin(a) * 15);
      b.rotation.x = -a; b.rotateY(0.45); g.push(b);
    }
    ligar.push(...add('ventilador', [[g, V(60, 30, 0)]]).map(it => [it, 'fan']));
  }
  {
    const f = A.oscuro('#2a2c30'), x0 = mX0 + 20;
    add('filtro_aire', [[[cil3(V(x0, yC + 48, -22), V(x0 + 44, yC + 48, -22), 12, f), cil3(V(x0 + 44, yC + 48, -22), V(x0 + 48, yC + 48, -22), 9, mat('#c9a227')),
      tubo([V(x0, yC + 48, -22), V(x0 - 8, yC + 40, 0), V(mX0 + 22, yC + 26, 30)], 3.5, A.goma())], V(0, 110, -70)]]);
  }
  {
    const ac = mat('#7a7f86', { metalness: 0.8, roughness: 0.35 }), ne = A.oscuro('#1c1d20'), ex = cabX1 + 12;
    add('escape', [[[tubo([V(mX0 + 22, yC + 22, 40), V(mX0 + 10, yC + 30, 32), V(ex + 4, yC + 40, 28)], 3.2, ac), cil3(V(ex - 2, yC + 34, 28), V(ex + 42, yC + 34, 28), 11, ac),
      entre(V(ex, yC + 34, 28), V(ex, D.esc - 3, 28), 4.5, ne, 16), cil3(V(ex, D.esc - 3, 28), V(ex, D.esc, 28), 5.4, ne, false, 'y')], V(40, 130, 60)]]);
  }
  {
    const cj = A.oscuro('#202225'), x = cabX1 + 22;
    add('bateria', [[[caja(28, 24, 18, x, 62, 54, cj), caja(30, 2, 20, x, 75, 54, mat('#3b3f44')), entre(V(x - 8, 75, 50), V(x - 8, 79, 50), 1.6, mat('#c0392b')), entre(V(x + 8, 75, 50), V(x + 8, 79, 50), 1.6, mat('#222'))], V(0, -10, 110)]]);
  }
  {
    const t = A.oscuro('#2a2d31'), x = 70, xl = Math.min(cabX1 - 4, D.wb - D.fr - 12) - x;
    add('tanque_comb', [[[cajaR(xl, 54, 26, 5, x + xl / 2, 70, -(cw - 4), t), caja(xl + 6, 3, 30, x + xl / 2, 100, -(cw - 2), mat('#5b6066', { metalness: 0.6 })),
      entre(V(x + 10, 97, -(cw + 2)), V(x + 10, 104, -(cw + 2)), 4.5, mat('#111')), caja(xl - 6, 2, 22, x + xl / 2, 58, -(cw + 10), mat('#5b6066', { metalness: 0.6 }))], V(0, -20, -120)]]);
  }
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

  // ================= TRANSMISIÓN Y EJES =================
  {
    const f = A.fundicion('#4a4f55'), x0 = mX0 - 16, c = L.conv;
    const bell = new THREE.LatheGeometry([[18, 0], [27, 4], [28, 14], [20, 18]].map(([r, a]) => new THREE.Vector2(r, a)), 32); bell.rotateZ(-PI / 2);
    const tor = mesh(new THREE.TorusGeometry(16, 6, 12, 32), mat('#b98e3a', { metalness: 0.7, roughness: 0.35 }), x0 + 9, c.y, 0); tor.rotation.y = PI / 2;
    add('convertidor', [[[mesh(bell, f, x0, c.y, 0), tor], V(40, -70, 0)]]);
  }
  {
    const f = A.fundicion('#53585e'), x0 = 46, x1 = mX0 - 16;
    add('transmision', [[[cajaR(x1 - x0, 46, 44, 8, (x0 + x1) / 2, 76, 0, f), cajaR(x1 - x0 - 20, 18, 30, 6, (x0 + x1) / 2 - 4, 106, 0, f), cil3(V(x0 - 6, 66, 0), V(x0 + 2, 66, 0), 10, f), cil3(V(L.trOutD.x - 6, 52, 0), V(L.trOutD.x + 6, 52, 0), 8, f),
      entre(V((x0 + x1) / 2 + 10, 112, 0), V((x0 + x1) / 2 + 22, 150, 4), 1.4, A.oscuro('#111'))], V(0, -90, 0)]]);
  }
  for (const [id, [p0, , ], p1, cuerpo, dir] of [['cardan_del', K.cardD, V(D.wb - 26, yD + 2, 0), 'cardD', V(0, -120, 0)], ['cardan_tras', K.cardT, V(20, yT, 0), 'cardT', V(-10, -110, 0)]]) {
    const ac = mat('#6f757c', { metalness: 0.75, roughness: 0.35 }), y = A.oscuro('#2c2f33'), d = p1.clone().sub(p0).normalize();
    const g = [entre(p0.clone().addScaledVector(d, 6), p1.clone().addScaledVector(d, -6), 3.6, ac, 16)];
    for (const q of [p0, p1]) { g.push(caja(7, 7, 7, q.x, q.y, q.z, y)); g.push(entre(q.clone().add(V(0, 0, -6)), q.clone().add(V(0, 0, 6)), 1.4, y, 8)); }
    ligar.push(...add(id, [[g, dir]]).map(it => [it, cuerpo]));
  }
  {   // eje delantero: viga, diferencial, manguetas que viran, cilindro de dirección
    const f = A.fundicion('#3f4449'), zc = D.ftr / 2 - 13;
    const viga = [entre(V(D.wb, yD, -zc + 6), V(D.wb, yD, zc - 6), 8, f, 16), mesh(new THREE.SphereGeometry(17, 20, 14), f, D.wb - 8, yD + 1, 0), entre(V(D.wb - 30, yD + 4, 0), V(D.wb - 12, yD + 2, 0), 9, f),
      entre(V(D.wb - 14, yD + 12, 0), V(D.wb + 16, yD + 12, 0), 5, A.oscuro('#222'))];
    const mang = sd => [entre(V(D.wb, yD - 12, sd * zc), V(D.wb, yD + 12, sd * zc), 6, f, 14), entre(V(D.wb, yD, sd * zc), V(D.wb, yD, sd * (zc + 9)), 13, f, 20), caja(18, 4, 6, D.wb + 10, yD - 8, sd * (zc - 2), f)];
    const ac = mat('#596068', { metalness: 0.5 }), cr = A.cromo();
    const camisa = [entre(V(D.wb + 14, yD - 8, -18), V(D.wb + 14, yD - 8, 26), 4.2, ac), caja(6, 10, 6, D.wb + 8, yD - 4, 0, f)];
    const vast = [entre(V(D.wb + 14, yD - 8, -zc + 10), V(D.wb + 14, yD - 8, zc - 10), 1.8, cr), ...[-1, 1].map(sd => entre(V(D.wb + 14, yD - 8, sd * (zc - 10)), V(D.wb + 10, yD - 8, sd * (zc - 2)), 1.6, cr))];
    const its = add('eje_del', [[viga, V(60, -90, 0)], [mang(-1), V(60, -90, -40)], [mang(1), V(60, -90, 40)], [camisa, V(80, -90, 0)], [vast, V(80, -100, 0)]]);
    liga(its, ['fijo', 'knI', 'knD', 'fijo', 'steerRod']);
  }
  {   // eje trasero: diferencial (relación 2,5) y reducción en cubos (6,4), frenos de discos húmedos
    const f = A.fundicion('#3f4449'), z1 = D.rtr / 2 - 16;
    const dif = new THREE.LatheGeometry([[0.1, -24], [16, -22], [23, -12], [24, 0], [23, 12], [16, 22], [0.1, 24]].map(([r, a]) => new THREE.Vector2(r, a)), 28); dif.rotateX(PI / 2);
    add('eje_tras', [[[mesh(dif, f, 0, yT, 0), entre(V(0, yT, -z1), V(0, yT, z1), 9, f, 18), ...[-1, 1].flatMap(sd => [entre(V(0, yT, sd * (z1 - 22)), V(0, yT, sd * (z1 - 10)), 17, f, 24), entre(V(0, yT, sd * (z1 - 4)), V(0, yT, sd * (z1 + 8)), 15, f, 24)]),
      entre(V(4, yT, 0), V(22, yT, 0), 8, f), caja(24, 4, 2 * z1 - 30, -12, yT + 14, 0, f)], V(0, -90, 0)]]);
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

  // ================= SISTEMA HIDRÁULICO =================
  {
    const t = A.oscuro('#2d3035'), x = 68, xl = Math.min(cabX1 + 2, D.wb - D.fr - 12) - x;
    add('tanque_hid', [[[cajaR(xl, 64, 24, 5, x + xl / 2, 74, cw - 4, t), entre(V(x + 12, 106, cw - 4), V(x + 12, 112, cw - 4), 3.5, mat('#111')), cil3(V(x + xl / 2, 74, cw + 8), V(x + xl / 2, 74, cw + 8.6), 3.4, mat('#d9e2e6', { metalness: 0.2, roughness: 0.1 }), false, 'z'),
      caja(xl - 6, 2, 20, x + xl / 2, 40, cw - 4, mat('#5b6066', { metalness: 0.6 }))], V(0, -20, 120)]]);
    const f = L.filtroH;
    add('filtro_hid', [[[entre(f.clone().add(V(0, -12, 0)), f.clone().add(V(0, 8, 0)), 6, mat('#1f5fa8')), entre(f.clone().add(V(0, 8, 0)), f.clone().add(V(0, 12, 0)), 7, A.fundicion())], V(0, 50, 120)]]);
    const b = L.bomba, fb = A.fundicion('#585e64');
    add('bomba_hid', [[[cajaR(22, 18, 18, 3, b.x, b.y, b.z, fb), cil3(V(b.x + 11, b.y, 0), V(b.x + 16, b.y, 0), 8, fb), entre(b.clone().add(V(0, 0, 9)), b.clone().add(V(0, 0, 14)), 4, fb), entre(b.clone().add(V(0, 0, -9)), b.clone().add(V(0, 0, -13)), 3, fb)], V(30, -70, 50)]]);
    const vc = L.valC, va = mat('#5d646b', { metalness: 0.55 }), ro = mat('#a33', {});
    const sec = n => Array.from({ length: n }, (_, i) => i);
    add('valvula_cargador', [[[...sec(3).map(i => caja(9, 20, 18, vc.x - 9 + i * 9.4, vc.y, vc.z, va)), ...sec(3).map(i => entre(V(vc.x - 9 + i * 9.4, vc.y + 10, vc.z), V(vc.x - 9 + i * 9.4, vc.y + 15, vc.z), 1.5, mat('#ddd', { metalness: 0.9 }))), caja(30, 6, 20, vc.x, vc.y - 12, vc.z, ro)], V(40, -40, 60)]]);
    const vr = L.valR;
    add('valvula_retro', [[[...sec(7).map(i => caja(14, 22, 9, vr.x, vr.y, -30 + i * 9.6, va)), ...sec(7).map(i => entre(V(vr.x + 7, vr.y + 6, -30 + i * 9.6), V(vr.x + 12, vr.y + 6, -30 + i * 9.6), 1.4, mat('#ddd', { metalness: 0.9 }))), caja(16, 22, 6, vr.x, vr.y, -38, ro), caja(16, 22, 6, vr.x, vr.y, 39, ro)], V(-40, 30, 0)]]);
  }

  // ================= CHASIS (cáscara) =================
  {
    const p = pint(), o = osc(), ax = mat('#2b2f33', { metalness: 0.4 });
    const g = [];
    for (const sd of [-1, 1]) {
      g.push(caja(D.grill + 10 + 56, 26, 8, (D.grill + 10 - 56) / 2, 84, sd * 31, o));                       // largueros
      g.push(placa([[cabX1 + 8, 70], [cabX1 + 8, K.PL.y + 12], [cabX1 + 30, K.PL.y + 14], [cabX1 + 40, 70]], 14, p, sd * (K.zA - 12)));  // torres del cargador
      g.push(caja(36, 10, K.zA - 30, cabX1 + 22, 76, sd * (30 + (K.zA - 30) / 2), p));
      g.push(placa([[D.piv + 6, 38], [D.piv + 6, 240], [D.piv + 22, 240], [D.piv + 26, 38]], 10, p, sd * 54));   // torres de estabilizadores
      g.push(caja(14, 20, 20, D.piv + 14, 95, sd * 62, p));                                                     // oreja del pivote del estabilizador
    }
    g.push(caja(18, 40, 2 * hw + 6, D.grill + 9, 82, 0, o), caja(12, 12, 2 * hw + 16, D.grill + 16, 64, 0, o));   // contrapeso / parachoques
    g.push(caja(30, 8, 2 * hw, D.grill - 4, 106, 0, o));
    // bastidor de la retro: placas superior e inferior en C alrededor del pivote
    const C = (y) => placa([[-48, -48], [D.piv + 24, -48], [D.piv - 6, -26], [D.piv - 18, 0], [D.piv - 6, 26], [D.piv + 24, 48], [-48, 48]].map(([x, z]) => [x, z]), 8, p, 0);
    for (const y of [36, 134]) { const c = C(); c.rotation.x = PI / 2; c.position.y = y; g.push(c); }
    g.push(caja(14, 98, 96, -36, 85, 0, p), ...[-1, 1].map(sd => caja(-D.piv - 60, 22, 8, (D.piv - 20) / 2, 60, sd * 44, p)));
    // piso y escalones
    g.push(caja(cabX1 - cabX0 - 10, 4, 2 * cw - 30, (cabX0 + cabX1) / 2, cabY0 - 2, 0, ax));
    // ayudante sin color: amplía el plano lejano de la cámara (la app lo deja en 600 cm y la máquina mide ~7 m)
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0, 0, 0, 0], 3));
    const mf = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }); mf.userData.fijo = true;
    const lejos = new THREE.Mesh(geo, mf); lejos.frustumCulled = false;
    lejos.onBeforeRender = (r, sc, cam) => { if (cam.far < 5000) { cam.far = 5000; cam.updateProjectionMatrix(); } };
    g.push(lejos);
    add('chasis', [[g, V(0, 0, 0)]], true);
  }

  // ================= CABINA (cáscara), ASIENTO, MANDOS =================
  {
    const ne = A.oscuro(col('cab')), vi = A.vidrio(), te = A.oscuro('#2a2c2f'), luz = mat('#f4f1e6', { emissive: '#000' });
    const yb = cabY0, yt = D.cab, xa = cabX0, xb = cabX1, z = cw;
    const g = [];
    for (const [x, zz] of [[xa + 4, -z + 4], [xa + 4, z - 4], [xb - 6, -z + 4], [xb - 6, z - 4]]) g.push(caja(7, yt - yb - 8, 7, x, (yb + yt - 8) / 2, zz, ne));
    g.push(cajaR(xb - xa + 16, 10, 2 * z + 12, 4, (xa + xb) / 2, yt - 5, 0, ne), cajaR(xb - xa, 4, 2 * z - 6, 2, (xa + xb) / 2, yt - 12, 0, te));
    for (const sd of [-1, 1]) {
      g.push(caja(xb - xa - 8, 3, 3, (xa + xb) / 2, yb + 52, sd * (z - 3), ne));                                  // travesaño de la puerta
      g.push(mesh(new THREE.PlaneGeometry(xb - xa - 12, yt - yb - 22), vi, (xa + xb) / 2, (yb + yt - 14) / 2, sd * (z - 3.5)).rotateY(sd < 0 ? PI : 0));
      g.push(caja(xb - xa - 10, 34, 2, (xa + xb) / 2, yb + 18, sd * (z - 2), te));                               // panel inferior
      g.push(entre(V(xb + 4, yt - 30, sd * (z + 6)), V(xb + 4, yt - 50, sd * (z + 14)), 0.8, ne), caja(2, 18, 12, xb + 4, yt - 56, sd * (z + 16), te));   // espejos
      for (const x of [xa + 10, xb - 6]) g.push(caja(8, 6, 10, x, yt + 3, sd * (z - 14), luz));                   // focos de trabajo
    }
    g.push(mesh(new THREE.PlaneGeometry(2 * z - 10, yt - yb - 26), vi, xb - 2, (yb + yt - 18) / 2, 0).rotateY(PI / 2));   // parabrisas
    g.push(mesh(new THREE.PlaneGeometry(2 * z - 10, yt - yb - 70), vi, xa + 2, (yb + 60 + yt - 10) / 2, 0).rotateY(-PI / 2));   // luneta trasera
    g.push(caja(6, 50, 2 * z - 10, xa + 2, yb + 26, 0, te), caja(6, 30, 2 * z - 10, xb - 3, yb + 15, 0, te));
    g.push(caja(14, 6, 14, xa + 40, yt + 6, 0, mat('#f39c12', { emissive: '#000' })));   // baliza
    add('cabina', [[g, V(0, 260, 0)]], true);
  }
  {
    const tela = mat('#2c2e31', { roughness: 0.9 }), ac = A.oscuro('#3a3d41'), c = K.seatC;
    const g = [entre(V(c.x, c.y, 0), V(c.x, c.y + 26, 0), 5, ac), cajaR(46, 10, 48, 4, c.x, c.y + 32, 0, tela), cajaR(10, 52, 46, 4, c.x - 24, c.y + 62, 0, tela), cajaR(8, 14, 30, 3, c.x - 28, c.y + 96, 0, tela),
      ...[-1, 1].map(sd => caja(30, 4, 6, c.x - 4, c.y + 48, sd * 26, ac))];
    ligar.push(...add('asiento', [[g, V(0, 120, 0)]]).map(it => [it, 'seat']));
  }
  {
    const ne = A.oscuro('#1a1b1d'), ac = mat('#7a8088', { metalness: 0.7 }), v = L.volante;
    const vol = mesh(new THREE.TorusGeometry(19, 1.6, 10, 32), ne, v.x, v.y, 0); vol.rotation.y = PI / 2; vol.rotateX(0.5);
    const g = [vol, entre(V(v.x + 18, cabY0, 0), V(v.x + 2, v.y, 0), 3, ne), caja(16, 40, 30, v.x + 22, cabY0 + 20, 0, ne),
      entre(V(v.x - 10, cabY0 + 30, 34), V(v.x - 10, cabY0 + 60, 34), 1.2, ac), mesh(new THREE.SphereGeometry(3.4, 12, 10), ne, v.x - 10, cabY0 + 62, 34),   // palanca del cargador
      caja(14, 30, 10, v.x - 10, cabY0 + 15, 34, ne)];
    for (const sd of [-1, 1]) g.push(caja(10, 2, 7, v.x + 12, cabY0 + 6, sd * 9, ac), entre(V(cabX0 + 30, cabY0 + 38, sd * 30), V(cabX0 + 24, cabY0 + 66, sd * 28), 1.2, ac), mesh(new THREE.SphereGeometry(3.4, 12, 10), ne, cabX0 + 24, cabY0 + 68, sd * 28), caja(20, 38, 12, cabX0 + 30, cabY0 + 19, sd * 30, ne));
    g.push(caja(8, 2, 6, v.x + 12, cabY0 + 6, 22, ac));
    add('mandos', [[g, V(30, 100, 0)]]);
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
  {
    const p = A.pintura(col('cucharon')), ac = mat('#8b9096', { metalness: 0.7, roughness: 0.4 }), w = D.bkW, P = (dx, dy) => [K.PB.x + dx, K.PB.y + dy];
    const curva = [[98, -32], [30, -32], [14, -28], [6, -14], [3, 5], [5, 30], [11, 52], [40, 62]].map(([a, b]) => P(a, b));
    const g = [chapa(curva, 1.8, w - 2, p), ...[-1, 1].map(sd => placa([...curva, P(52, 60)], 2, p, sd * (w / 2 - 1))),
      caja(6, 3.2, w, K.PB.x + 99, K.PB.y - 30.5, 0, ac), caja(60, 2, w - 6, K.PB.x + 40, K.PB.y - 33, 0, ac), caja(4, 5, w - 2, K.PB.x + 40, K.PB.y + 62, 0, p)];
    for (const sd of [-1, 1]) for (const dz of [-6, 6]) g.push(placa([P(-7, -10), P(10, -14), P(14, 60), P(-9, 60)], 3, p, sd * K.zA + dz), placa([P(-31, 12), P(6, 6), P(10, 30), P(-31, 28)], 3, p, sd * K.zV + dz));
    ligar.push(...add('cuchara_cargador', [[g, V(240, 0, 0)]]).map(it => [it, 'bkt']));
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
  {   // cuchara con dientes
    const p = A.pintura(col('cuchara')), ac = mat('#5a5f66', { metalness: 0.7, roughness: 0.4 }), w = 61 * s;
    const P = (a, n) => { const q = K.pK(a, n); return [q.x, q.y]; };
    const curva = [[-8, 34], [16, 40], [50, 33], [80, 14], [96, -10], [102, -34]].map(([a, n]) => P(a, n));
    const g = [chapa(curva, -1.6, w, p), ...[-1, 1].map(sd => placa([...curva, P(86, -30), P(40, -26), P(4, -22), P(-10, -6)], 1.8, p, sd * w / 2)),
      ...[-1, 1].map(sd => placa([P(-12, -4), P(8, -8), P(8, 38), P(-10, 36)], 2.4, p, sd * 8 * s))];
    for (let i = 0; i < 5; i++) { const z = -w / 2 + 6 + i * (w - 12) / 4, t = K.pK(104, -36), d = K.dd.clone().multiplyScalar(0.55).add(K.dn.clone().multiplyScalar(-0.83)).normalize();
      const o = mesh(new THREE.ConeGeometry(3.4, 14, 4), ac, t.x + d.x * 5, t.y + d.y * 5, z); o.quaternion.setFromUnitVectors(V(0, 1, 0), d); g.push(o); }
    ligar.push(...add('cuchara_retro', [[g, V(-400, 0, 0)]]).map(it => [it, 'bk']));
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

  // ================= CILINDROS =================
  const cilDef = [
    ['cil_levante', 'levI', K.liftA.clone().setZ(-K.zA), K.liftB.clone().setZ(-K.zA), 'fijo', 'arm', D.cil.lift, V(110, -30, -60)],
    ['cil_levante', 'levD', K.liftA.clone().setZ(K.zA), K.liftB.clone().setZ(K.zA), 'fijo', 'arm', D.cil.lift, V(110, -30, 60)],
    ['cil_volteo', 'volI', K.dumpA.clone().setZ(-K.zV), K.dumpB.clone().setZ(-K.zV), 'arm', 'bkt', D.cil.volteo, V(150, 80, -60)],
    ['cil_volteo', 'volD', K.dumpA.clone().setZ(K.zV), K.dumpB.clone().setZ(K.zV), 'arm', 'bkt', D.cil.volteo, V(150, 80, 60)],
    ['cil_giro', 'swI', K.swA(-1), K.swB(-1), 'fijo', 'sw', D.cil.giro, V(-60, -40, -80)],
    ['cil_giro', 'swD', K.swA(1), K.swB(1), 'fijo', 'sw', D.cil.giro, V(-60, -40, 80)],
    ['cil_pluma', 'pluma', K.boomA, K.boomB, 'sw', 'boom', D.cil.pluma, V(-150, 60, 70)],
    ['cil_brazo', 'brazo', K.dipA, K.dipB, 'boom', 'dip', D.cil.brazo, V(-250, 80, 70)],
    ['cil_cuchara', 'cuchara', K.bkA, K.J0, 'dip', 'J', D.cil.cuchara, V(-330, 80, 70)],
    ['cil_estab_i', 'stI', K.stA(-1), K.stB(-1), 'fijo', 'stI', D.cil.estab, V(-40, 50, -90)],
    ['cil_estab_d', 'stD', K.stA(1), K.stB(1), 'fijo', 'stD', D.cil.estab, V(-40, 50, 90)],
  ];
  // rango de largo de cada cilindro: se muestrea la animación de todas las etapas
  const rango = cilDef.map(() => [1e9, 0]);
  for (const capas of [[], ['cargador'], ['estab'], ['giro'], ['excavacion']]) for (let t = 0; t <= 16; t += 0.1) {
    const B = cuerpos(K, juntas(K, t, capas));
    cilDef.forEach(([, , A0, B0, a, b], i) => { const Lc = A0.clone().applyMatrix4(B[a]).distanceTo(B0.clone().applyMatrix4(B[b])); rango[i][0] = Math.min(rango[i][0], Lc); rango[i][1] = Math.max(rango[i][1], Lc); });
  }
  K._Jprev = null;
  const porPieza = {};
  cilDef.forEach(([id, cid, A0, B0, a, b, [di, va], dir], i) => {
    const mc = A.oscuro(col('cil')), mv = A.cromo(), c = cilindro(A0, B0, di, va, rango[i][0], rango[i][1], mc, mv);
    (porPieza[id] ??= []).push({ cid, c, A0, B0, a, b, dir });
  });
  for (const [id, lst] of Object.entries(porPieza)) {
    // materiales propios por pieza: los dos cilindros de un par comparten (misma pieza)
    const its = add(id, lst.flatMap(({ c, dir }) => [[c.cam, dir], [c.vas, dir.clone().add(V(0, 0, Math.sign(dir.z || 1) * 25))]]));
    lst.forEach((x, k) => cils.push({ id: x.cid, cam: its[2 * k], vas: its[2 * k + 1], A0: x.A0, B0: x.B0, a: x.a, b: x.b }));
  }
  K.rango = Object.fromEntries(cilDef.map(([, cid], i) => [cid, rango[i].map(v => +v.toFixed(1))]));

  // ================= MANGUERAS =================
  {
    const m = A.manguera(), r = 1.4, its = [];
    const chas = [tubo([L.tanqueH.clone().add(V(-20, -20, -6)), V(L.bomba.x - 10, 40, 30), L.bomba.clone().add(V(0, 0, 14))], 2.4, m),
      tubo([L.bomba.clone().add(V(0, 0, -13)), V(L.bomba.x, 90, -20), L.valC.clone().add(V(0, -10, -10))], r, m),
      tubo([L.valC.clone().add(V(-10, 0, 0)), V(60, 104, 34), V(cabX0 + 10, 112, 30), L.valR.clone().add(V(0, -10, 30))], r, m),
      tubo([L.valR.clone().add(V(0, -12, -30)), V(30, 100, 40), L.filtroH.clone().add(V(0, 12, 0))], r, m),
      ...[-1, 1].map(sd => tubo([L.valC.clone().add(V(0, 0, 0)), V(cabX1 + 10, 120, sd * 34), K.liftA.clone().setZ(sd * (K.zA - 8))], r, m))];
    const brazo = [-1, 1].map(sd => tubo([K.pA(0.1 * K.LA, 8, sd * (K.zA - 6)), K.pA(0.3 * K.LA, 34, sd * (K.zA - 6)), K.dumpA.clone().setZ(sd * (K.zV - 6))], r, m));
    const pl = [-4, 4].map(z => tubo([K.boomA.clone().setZ(z * s), K.pB(40, 30, z * s), K.pB(140, 44, z * s), K.pB(0.5 * 265, -4, z * s), K.dipA.clone().setZ(z * s)], r, m))
      .concat([-3, 3].map(z => tubo([K.pB(140, 44, z * s), K.pB(250, 18, z * s), K.pD(-6, 20, z * s), K.bkA.clone().setZ(z * s)], r, m)));
    const it = add('mangueras', [[chas, V(0, 40, 60)], [brazo, V(120, 70, 0)], [pl, V(-200, 100, 50)]]);
    liga(it, ['fijo', 'arm', 'boom']);
  }

  // ================= PASADORES =================
  {
    const ac = mat('#c3c8ce', { metalness: 0.85, roughness: 0.25 });
    const P = (p, w, r, c, dir) => [[pasador(p.x, p.y, -w, w, r, ac)], dir, c];
    const lst = [
      [[-1, 1].map(sd => pasador(K.PL.x, K.PL.y, sd * K.zA - 19 * sd, sd * K.zA + 7 * sd, 4, ac)), V(0, 30, 0), 'arm'],
      [[-1, 1].map(sd => pasador(K.PB.x, K.PB.y, sd * K.zA - 9, sd * K.zA + 9, 3.6, ac)), V(200, 0, 0), 'bkt'],
      P(K.F, 18 * s, 4.5, 'boom', V(-100, 0, 60)), P(K.T, 14 * s, 4, 'dip', V(-200, 60, 60)), P(K.Q, 34 * s, 3.6, 'bk', V(-330, 0, 60)),
      P(K.D1, 13 * s, 2.8, 'lg', V(-330, 30, 60)), P(K.K0, 9 * s, 2.8, 'lb', V(-330, 40, 60)), P(K.J0, 14 * s, 2.8, 'J', V(-330, 50, 60)),
      [[-1, 1].map(sd => { const q = K.PS(sd); return entre(q.clone().add(V(-12, 0, 0)), q.clone().add(V(12, 0, 0)), 3.4, ac, 12); }), V(-40, 0, 0), 'fijo'],
      [[entre(V(D.piv, 128, 0), V(D.piv, 140, 0), 6, ac), entre(V(D.piv, 30, 0), V(D.piv, 42, 0), 6, ac)], V(-100, 0, 0), 'sw'],
    ];
    const it = add('pasadores', lst.map(([o, d]) => [o, d])); liga(it, lst.map(x => x[2]));
  }

  const faltan = Object.keys(NOMBRES).filter(id => !parts[id]);
  if (faltan.length) console.warn('retroexcavadora: faltan piezas del contrato', faltan);
  return { parts, vivo: vivo(D, K, { cuerposItems: ligar, cils, L }), K, D, clave };

  // ---------- auxiliares locales ----------
  function cil3(p0, p1, r, m, abierto = false) { const o = entre(p0, p1, r, m, 28); if (abierto) o.material.side = THREE.DoubleSide; return o; }
  function marcaFondo() { return D.marca === 'jcb' ? { fondo: '#111111' } : {}; }
}

// núcleo del radiador y rejilla (texturas)
function lienzoAletas() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d');
  g.fillStyle = '#6f7880'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#3d444b'; for (let i = 0; i < 64; i += 4) g.fillRect(0, i, 64, 1.5);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 6); return t;
}
function lienzoRejilla() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d');
  g.fillStyle = '#121314'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#3a3d41'; for (let i = 0; i < 64; i += 8) g.fillRect(0, i, 64, 3);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 4); return t;
}
