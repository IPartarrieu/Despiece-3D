// Módulo HIDRÁULICA de la retroexcavadora (propietario: agente hidráulico). Contrato: contrato.json (modulo «hidraulica»); guía: CONTRATO.md.
// Construye las piezas existentes tanque_hid, filtro_hid, bomba_hid, valvula_cargador, valvula_retro, cuchara_cargador, cuchara_retro,
// los 8 ids de cilindros (11 cilindros), mangueras y pasadores, y las piezas nuevas del contrato.
//
// DÓNDE VA CADA PIEZA NUEVA (anclajes de contrato.json; los puntos L/K están en modelo.js y vivo.js):
//  bomba (H1, ya corregida): bomba_hid en L.bomba, coaxial con el cigüeñal; hid_acople entre L.polea y la bomba (L.acople);
//    hid_bomba_engranajes (580N, 3CX) o hid_bomba_pistones (580 Super N, 420F2) dentro de la bomba. Rehacer el recorrido de
//    las mangueras de la bomba (succión desde L.tanqueH, presión a L.valC) ahora que va adelante.
//  hid_colador dentro de tanque_hid; hid_valvulas_alivio sobre valvula_retro (L.valR); hid_traba_pluma junto a K.F (ligar 'sw').
//  cargador: carg_puntal sobre el vástago del cilindro de levante izq. (K.liftA, z = -K.zA, ligar 'arm'); carg_bieletas (ligar 'bkt');
//    carg_cuchilla = la caja «cuchilla» que hoy está en cuchara_cargador (ligar 'bkt').
//  retro: retro_dientes = los 5 conos que hoy están en cuchara_retro (ligar 'bk'); retro_acople_rapido (ligar 'dip').
//  cilindros: por cada id cil_X, 5 piezas cil_X_vastago (hoy el item «vas»), cil_X_piston, cil_X_cabezal, cil_X_sellos, cil_X_bujes.
//    Construirlas en la pose neutra (mismo marco que cilindro(): eje y local de A0 a B0) y registrar sus items en
//    cils[k].vasExtra (vástago, pistón) o cils[k].camExtra (cabezal, sellos, bujes) para que «Funciona» las mueva.
//    Si cil_X_vastago pasa a ser pieza propia, cils[k].vas debe apuntar a su item y cil_X queda solo con la camisa.
//    Extender cilindro() aquí (copia local), no en comun.js.
//  pasadores por articulación (pasador + bujes + perno de retención): pas_carg_cucharon (K.PB, 'bkt'), pas_pie_pluma (K.F, 'boom'),
//    pas_pluma_brazo (K.T, 'dip'), pas_brazo_cuchara (K.Q, 'bk'), pas_bieletas (K.D1/K.J0/K.K0: 'lg'/'J'/'lb'),
//    pas_torre (pivotes de la torre, 'sw'), pas_estab (K.PS(±1), 'fijo'). «pasadores» se queda solo con los del cargador al chasis (K.PL, 'arm').
export default function (ctx) {
  const { THREE, PI, V, mat, mesh, rev, placa, chapa, entre, caja, cajaR, tubo, pasador, fundir, letrero, cilindro, A, D, K, L, s, add, liga, ligar, cils, col, pint, osc, cil3, marcaFondo,
    yT, yD, cabX0, cabX1, cabY0, cw, hw, hx0, hTop, mX0, mX1, yC, lm, xcM, kM } = ctx;
  const { juntas, cuerpos } = ctx;
  // ---------- helpers locales ----------
  const ids = new Set(ctx.piezas.map(e => e.id)), ex = id => V(...ctx.piezas.find(e => e.id === id).explosion);
  // sólido de revolución cerrado tipo anillo: radios ri..ro entre a0 y a1 sobre el eje ax
  const anillo = (ri, ro, a0, a1, ax, m, x = 0, y = 0, z = 0, seg = 24) => rev([[ri, a0], [ro, a0], [ro, a1], [ri, a1], [ri, a0]], ax, m, seg, x, y, z);
  const hex = (p0, p1, r, m) => entre(p0, p1, r, m, 6);
  const grupo = (q, p, ...objs) => { const g = new THREE.Group(); g.add(...objs); g.quaternion.copy(q); g.position.copy(p); return g; };

  // Cilindro hidráulico en piezas (copia local ampliada de cilindro() de comun.js). Mismo marco: eje y local de A0 a B0, pose neutra.
  // Devuelve grupos listos para add(): cam (camisa con base y ojo), vas (vástago con ojo), pis (pistón y tuerca), cab (cabezal),
  // selC (limpiador y sello en U, fijos a la camisa), selP (sello y anillos de desgaste del pistón, van con el vástago),
  // bujC / bujV (bujes de los ojos de camisa y vástago).
  function cilindroX(A0, B0, diam, vast, Lmin, Lmax, mc, mv, mo) {
    const d = B0.clone().sub(A0).normalize(), q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d), seg = 24;
    const rB = diam / 2 + 1.1, ri = rB - 0.6, rV = vast / 2, ojo = Math.max(rB * 0.95, 4), ojoV = Math.max(rV * 1.6, 3.5);
    const ew = rB * 1.5, ewV = rB * 1.4, rh = ojo * 0.62, rhV = ojoV * 0.62;
    const Lb = Math.max(Lmin - ojoV - 0.5, 28), y0 = ojo * 0.9, capT = 2.5, yi0 = y0 + capT, yi1 = Lb - 9;
    const pw = Math.max(rB * 0.9, 4.6), rg = rV + 0.35, r0 = ri - 0.5;
    // largo del vástago: el pistón queda dentro de la camisa en todo el recorrido (si la carrera no cabe, se reparte el exceso)
    const Lr = Math.max((Lmax - yi1 + Lmin - pw - 1.5 - yi0) / 2, 15);
    const mS = mat('#2b2e32', { metalness: 0.2, roughness: 0.9 });
    // --- camisa: ojo trasero con agujero para el buje, cuello, base, tubo de pared fina, racores
    const cam = grupo(q, A0, anillo(rh, ojo, -ew / 2, ew / 2, 'z', mo, 0, 0, 0, 20), entre(V(0, ojo * 0.72, 0), V(0, y0 + 0.2, 0), rB * 0.8, mo, 18),
      rev([[0, y0], [rB * 1.05, y0], [rB * 1.05, yi0], [0, yi0]], 'y', mo, seg), anillo(ri, rB, y0 + 1, Lb - 5, 'y', mc, 0, 0, 0, seg),
      entre(V(rB - 0.3, yi0 + 3, 0), V(rB + 2.8, yi0 + 3, 0), 1.1, mo, 10), entre(V(rB - 0.3, Lb - 12, 0), V(rB + 2.8, Lb - 12, 0), 1.1, mo, 10));
    // --- vástago: ojo delantero y barra cromada; el pistón se une en su extremo (y = -Lr)
    const vas = grupo(q, B0, anillo(rhV, ojoV, -ewV / 2, ewV / 2, 'z', mo, 0, 0, 0, 20), entre(V(0, -ojoV * 0.7, 0), V(0, -Lr, 0), rV, mv, seg));
    // --- cabezal (prensaestopa): brida con tornillos, cuello dentro del tubo, bolsillo del limpiador y alojamiento del sello en U
    const cabP = [[rg, Lb - 9], [ri - 0.05, Lb - 9], [ri - 0.05, Lb - 5], [rB * 1.12, Lb - 5], [rB * 1.12, Lb], [rV + 0.9, Lb], [rV + 0.9, Lb - 0.9], [rg, Lb - 0.9],
      [rg, Lb - 3.4], [rg + 0.7, Lb - 3.4], [rg + 0.7, Lb - 5.4], [rg, Lb - 5.4], [rg, Lb - 9]];
    const rbo = (rB * 1.12 + rV + 0.9) / 2, tor = [];
    for (let i = 0; i < 6; i++) { const a = i * PI / 3 + 0.3; tor.push(hex(V(rbo * Math.cos(a), Lb, rbo * Math.sin(a)), V(rbo * Math.cos(a), Lb + 0.7, rbo * Math.sin(a)), 0.55, mo)); }
    const cab = grupo(q, A0, rev(cabP, 'y', mo, seg), fundir(tor, mo));
    // --- sellos fijos: limpiador (ámbar) en el bolsillo y sello en U (azul) en su alojamiento
    const selC = grupo(q, A0, anillo(rV, rV + 0.9, Lb - 0.9, Lb + 0.25, 'y', mat('#d9a521', { roughness: 0.8 })), anillo(rV, rg + 0.65, Lb - 5.3, Lb - 3.5, 'y', mat('#2f6fb3', { roughness: 0.8 })));
    // --- pistón con tres ranuras (desgaste, sello, desgaste) y tuerca hexagonal; y = -Lr es la cara hacia el vástago
    const yt = -Lr, yb = -Lr - pw, g1 = [0.4, 1.4], g2 = [pw / 2 - 0.9, pw / 2 + 0.9], g3 = [pw - 1.4, pw - 0.4], pp = [[0, yt], [r0, yt]];
    for (const [u, v, r] of [[g1[0], g1[1], 0.35], [g2[0], g2[1], 0.5], [g3[0], g3[1], 0.35]]) pp.push([r0, yt - u], [r0 - r, yt - u], [r0 - r, yt - v], [r0, yt - v]);
    pp.push([r0, yb], [0, yb], [0, yt]);
    const pis = grupo(q, B0, rev(pp, 'y', mat('#6b7076', { metalness: 0.7, roughness: 0.4 }), seg), hex(V(0, yb, 0), V(0, yb - 1.5, 0), rV * 0.75, mat('#4a4f56', { metalness: 0.8, roughness: 0.4 })));
    const selP = grupo(q, B0, anillo(r0 - 0.5, ri - 0.02, yt - g2[1], yt - g2[0], 'y', mat('#2a9d6f', { roughness: 0.8 }), 0, 0, 0, seg),
      ...[g1, g3].map(([u, v]) => anillo(r0 - 0.35, ri - 0.15, yt - v, yt - u, 'y', mat('#c9a66b', { roughness: 0.7 }), 0, 0, 0, seg)));
    // --- bujes de bronce con reborde en cada ojo
    const buje = (rr, w) => rev([[rr * 0.72, -w / 2 - 0.5], [rr * 1.25, -w / 2 - 0.5], [rr * 1.25, -w / 2], [rr, -w / 2], [rr, w / 2], [rr * 1.25, w / 2], [rr * 1.25, w / 2 + 0.5], [rr * 0.72, w / 2 + 0.5], [rr * 0.72, -w / 2 - 0.5]], 'z', mat('#b5813a', { metalness: 0.75, roughness: 0.4 }), 20);
    return { cam, vas, pis, cab, selC, selP, bujC: grupo(q, A0, buje(rh, ew)), bujV: grupo(q, B0, buje(rhV, ewV)) };
  }

  // pasador con cabeza (collar), tapa de retención con perno en el extremo a, y bujes: bu = [[centro, ancho], ...] sobre el eje ax
  function pin(p, ax, a, b, r, bu, mp, mb, mr, o = {}) {
    const pos = t => (ax === 'z' ? V(p.x, p.y, t) : ax === 'x' ? V(t, p.y, p.z) : V(p.x, t, p.z)), sg = Math.sign(b - a) || 1, ro = r + 1.1;
    const out = [entre(pos(a), pos(b), r, mp, 14), entre(pos(b - sg * 1.2), pos(b), r * 1.4, mp, 14)];
    for (const [c, w] of bu) out.push(anillo(r, ro, -w / 2, w / 2, ax, mb, ...(ax === 'z' ? [p.x, p.y, c] : ax === 'x' ? [c, p.y, p.z] : [p.x, c, p.z]), 18));
    if (!o.sinTapa) {
      const w = r * 3.2, h = r * 1.2, t = pos(a - sg * 0.5);
      out.push(ax === 'z' ? caja(w, h, 1, t.x, t.y, t.z, mr) : ax === 'x' ? caja(1, h, w, t.x, t.y, t.z, mr) : caja(w, 1, h, t.x, t.y, t.z, mr), hex(pos(a - sg), pos(a - sg * 2.4), r * 0.5, mr));
    }
    return out;
  }

  // ================= SISTEMA HIDRÁULICO =================
  {
    const t = A.oscuro('#2d3035'), x = 68, xl = Math.min(cabX1 + 2, D.wb - D.fr - 12) - x;
    add('tanque_hid', [[[cajaR(xl, 64, 24, 5, x + xl / 2, 74, cw - 4, t), entre(V(x + 12, 106, cw - 4), V(x + 12, 112, cw - 4), 3.5, mat('#111')), cil3(V(x + xl / 2, 74, cw + 8), V(x + xl / 2, 74, cw + 8.6), 3.4, mat('#d9e2e6', { metalness: 0.2, roughness: 0.1 }), false, 'z'),
      caja(xl - 6, 2, 20, x + xl / 2, 40, cw - 4, mat('#5b6066', { metalness: 0.6 }))], V(0, -20, 120)]]);
    const f = L.filtroH;
    add('filtro_hid', [[[entre(f.clone().add(V(0, -12, 0)), f.clone().add(V(0, 8, 0)), 6, mat('#1f5fa8')), entre(f.clone().add(V(0, 8, 0)), f.clone().add(V(0, 12, 0)), 7, A.fundicion())], V(0, 50, 120)]]);
    bomba();
    const vc = L.valC, va = mat('#5d646b', { metalness: 0.55 }), ro = mat('#a33', {});
    const sec = n => Array.from({ length: n }, (_, i) => i);
    add('valvula_cargador', [[[...sec(3).map(i => caja(9, 20, 18, vc.x - 9 + i * 9.4, vc.y, vc.z, va)), ...sec(3).map(i => entre(V(vc.x - 9 + i * 9.4, vc.y + 10, vc.z), V(vc.x - 9 + i * 9.4, vc.y + 15, vc.z), 1.5, mat('#ddd', { metalness: 0.9 }))), caja(30, 6, 20, vc.x, vc.y - 12, vc.z, ro)], V(40, -40, 60)]]);
    const vr = L.valR;
    add('valvula_retro', [[[...sec(7).map(i => caja(14, 22, 9, vr.x, vr.y, -30 + i * 9.6, va)), ...sec(7).map(i => entre(V(vr.x + 7, vr.y + 6, -30 + i * 9.6), V(vr.x + 12, vr.y + 6, -30 + i * 9.6), 1.4, mat('#ddd', { metalness: 0.9 }))), caja(16, 22, 6, vr.x, vr.y, -38, ro), caja(16, 22, 6, vr.x, vr.y, 39, ro)], V(-40, 30, 0)]]);
  }

  // ================= CARGADOR: CUCHARÓN =================
  {
    const p = A.pintura(col('cucharon')), ac = mat('#8b9096', { metalness: 0.7, roughness: 0.4 }), w = D.bkW, P = (dx, dy) => [K.PB.x + dx, K.PB.y + dy];
    const curva = [[98, -32], [30, -32], [14, -28], [6, -14], [3, 5], [5, 30], [11, 52], [40, 62]].map(([a, b]) => P(a, b));
    const g = [chapa(curva, 1.8, w - 2, p), ...[-1, 1].map(sd => placa([...curva, P(52, 60)], 2, p, sd * (w / 2 - 1))),
      caja(60, 2, w - 6, K.PB.x + 40, K.PB.y - 33, 0, ac), caja(4, 5, w - 2, K.PB.x + 40, K.PB.y + 62, 0, p)];
    for (const sd of [-1, 1]) for (const dz of [-6, 6]) g.push(placa([P(-7, -10), P(10, -14), P(14, 60), P(-9, 60)], 3, p, sd * K.zA + dz), placa([P(-31, 12), P(6, 6), P(10, 30), P(-31, 28)], 3, p, sd * K.zV + dz));
    ligar.push(...add('cuchara_cargador', [[g, V(240, 0, 0)]]).map(it => [it, 'bkt']));
  }

  // ================= RETRO: CUCHARA =================
  {   // cuchara con dientes
    const p = A.pintura(col('cuchara')), ac = mat('#5a5f66', { metalness: 0.7, roughness: 0.4 }), w = 61 * s;
    const P = (a, n) => { const q = K.pK(a, n); return [q.x, q.y]; };
    const curva = [[-8, 34], [16, 40], [50, 33], [80, 14], [96, -10], [102, -34]].map(([a, n]) => P(a, n));
    const g = [chapa(curva, -1.6, w, p), ...[-1, 1].map(sd => placa([...curva, P(86, -30), P(40, -26), P(4, -22), P(-10, -6)], 1.8, p, sd * w / 2)),
      ...[-1, 1].map(sd => placa([P(-12, -4), P(8, -8), P(8, 38), P(-10, 36)], 2.4, p, sd * 8 * s))];
    ligar.push(...add('cuchara_retro', [[g, V(-400, 0, 0)]]).map(it => [it, 'bk']));
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
    const c = cilindroX(A0, B0, di, va, rango[i][0], rango[i][1], A.oscuro(col('cil')), A.cromo(), A.oscuro(col('cil')));
    (porPieza[id] ??= []).push({ cid, c, A0, B0, a, b, dir });
  });
  for (const [id, lst] of Object.entries(porPieza)) {
    // cada subpieza es un item por cilindro; los de «sellos» y «bujes» llevan dos (camisa y vástago) porque se mueven distinto
    const lat = x => V(0, 0, Math.sign(x.dir.z) || 1), ax = x => x.B0.clone().sub(x.A0).normalize();
    const mov = (x, f, g) => x.dir.clone().addScaledVector(ax(x), f).addScaledVector(lat(x), g);
    const cam = add(id, lst.map(x => [x.c.cam, x.dir]));
    const vas = add(id + '_vastago', lst.map(x => [x.c.vas, mov(x, 45, 20)]));
    const pis = add(id + '_piston', lst.map(x => [x.c.pis, mov(x, 80, 45)]));
    const cab = add(id + '_cabezal', lst.map(x => [x.c.cab, mov(x, 30, -35)]));
    const sel = add(id + '_sellos', lst.flatMap(x => [[x.c.selC, mov(x, 55, -50)], [x.c.selP, mov(x, 95, 70)]]));
    const buj = add(id + '_bujes', lst.flatMap(x => [[x.c.bujC, mov(x, -35, -40)], [x.c.bujV, mov(x, 70, -45)]]));
    // camExtra / vasExtra: vivo.js los mueve con la camisa / con el vástago; cils[].vas es el item del vástago (pieza propia)
    lst.forEach((x, k) => cils.push({ id: x.cid, cam: cam[k], vas: vas[k], A0: x.A0, B0: x.B0, a: x.a, b: x.b,
      camExtra: [cab[k], sel[2 * k], buj[2 * k]], vasExtra: [pis[k], sel[2 * k + 1], buj[2 * k + 1]] }));
  }
  K.rango = Object.fromEntries(cilDef.map(([, cid], i) => [cid, rango[i].map(v => +v.toFixed(1))]));


  // ================= BOMBA (H1: adelante, coaxial con el cigüeñal), ACOPLE Y SUS PARTES =================
  function bomba() {
    const b = L.bomba, a = L.acople, fb = A.fundicion('#585e64'), tapa = A.fundicion('#4a5056');
    // cuerpo (shell): brida, carcasa, tapa trasera, espárragos y las dos bocas (aspiración +z, presión -z)
    const esp = [];
    for (const y of [-4.6, 4.6]) for (const z of [-4.8, 4.8]) { esp.push(entre(V(b.x - 4.2, b.y + y, z), V(b.x + 6.4, b.y + y, z), 0.55, fb, 8)); esp.push(hex(V(b.x + 6, b.y + y, z), V(b.x + 6.8, b.y + y, z), 0.9, fb)); }
    add('bomba_hid', [[[caja(1.8, 11.6, 11.6, b.x - 5.1, b.y, 0, fb), caja(6, 11.6, 11.6, b.x - 1.2, b.y, 0, fb), caja(4.2, 11.6, 11.6, b.x + 3.9, b.y, 0, tapa),
      fundir(esp, fb), entre(b.clone().add(V(-1.2, 0, 5.5)), b.clone().add(V(-1.2, 0, 8.6)), 2.5, fb, 16), entre(b.clone().add(V(-1.2, 0, -5.5)), b.clone().add(V(-1.2, 0, -8.6)), 1.8, fb, 16),
      anillo(2.5, 3.4, 8.0, 8.6, 'z', fb, b.x - 1.2, b.y, 0, 16), anillo(1.8, 2.7, -8.6, -8.0, 'z', fb, b.x - 1.2, b.y, 0, 16)], V(90, -60, 60)]], true);
    // acople elástico de garras (jaw): cubo del lado polea, araña de goma (6 lóbulos) y cubo del lado bomba
    const ac = mat('#7d848c', { metalness: 0.7, roughness: 0.4 }), goma = A.goma(), garr = [], lob = [];
    const rad = (o, th, r) => { o.position.y = a.y + Math.cos(th) * r; o.position.z = Math.sin(th) * r; o.rotation.x = -th; return o; };
    for (const k of [0, 2, 4]) garr.push(rad(caja(1.2, 1.7, 1.1, a.x + 0.1, 0, 0, ac), k * PI / 3, 2.9));
    const garB = [1, 3, 5].map(k => rad(caja(1.2, 1.7, 1.1, a.x + 0.3, 0, 0, ac), k * PI / 3, 2.9));
    for (let k = 0; k < 6; k++) lob.push(rad(caja(1.2, 1.5, 0.95, a.x + 0.2, 0, 0, goma), (k + 0.5) * PI / 3, 2.9));
    add('hid_acople', [[[anillo(1.3, 4.4, a.x - 1.5, a.x - 0.4, 'x', ac, 0, a.y, 0, 24), fundir(garr, ac), fundir(lob, goma), anillo(1.3, 4.4, a.x + 0.8, a.x + 2, 'x', ac, 0, a.y, 0, 24), fundir(garB, ac)], ex('hid_acople')]]);
    // interior de la bomba
    const ac2 = mat('#9aa0a6', { metalness: 0.75, roughness: 0.35 }), br = mat('#b5813a', { metalness: 0.75, roughness: 0.4 });
    if (ids.has('hid_bomba_engranajes')) {
      const eng = (x0, x1, y, z, r, n, m) => {   // engranaje: núcleo + n dientes fundidos en una malla
        const o = [rev([[0, 0], [r - 0.3, 0], [r - 0.3, x1 - x0], [0, x1 - x0]], 'x', m, 16, x0, y, z)];
        for (let i = 0; i < n; i++) { const th = i * 2 * PI / n, t = caja(x1 - x0, 0.7, 0.8, (x0 + x1) / 2, y + Math.cos(th) * (r - 0.1), z + Math.sin(th) * (r - 0.1), m); t.rotation.x = -th; o.push(t); }
        return fundir(o, m);
      };
      const tandem = ctx.clave === '3CX', y2 = b.y + 3.7, obj = [
        entre(V(a.x + 0.8, b.y, 0), V(b.x + (tandem ? 5.6 : 1.8), b.y, 0), 1.25, ac2, 14), eng(b.x - 3.7, b.x + 1.3, b.y, 0, 2.05, 9, ac2), eng(b.x - 3.7, b.x + 1.3, y2, 0, 2.05, 9, ac2),
        entre(V(b.x - 4, y2, 0), V(b.x + 1.6, y2, 0), 1, ac2, 12), caja(0.5, 9, 4.6, b.x - 3.95, b.y + 1.85, 0, br), caja(0.5, 9, 4.6, b.x + 1.55, b.y + 1.85, 0, br)];
      if (tandem) obj.push(eng(b.x + 2.4, b.x + 5.2, b.y, 0, 1.85, 8, ac2), eng(b.x + 2.4, b.x + 5.2, y2, 0, 1.85, 8, ac2), caja(0.4, 8, 4.4, b.x + 2.1, b.y + 1.85, 0, br), caja(0.4, 8, 4.4, b.x + 5.5, b.y + 1.85, 0, br));
      add('hid_bomba_engranajes', [[obj, ex('hid_bomba_engranajes')]]);
    }
    if (ids.has('hid_bomba_pistones')) {   // grupo rotativo de pistones axiales: eje, bloque con 7 pistones, plato oscilante inclinado, placa de distribución
      const al = 0.26, xc = b.x + 2.4, n = V(Math.cos(al), Math.sin(al), 0), pis = [], zap = [];
      for (let i = 0; i < 7; i++) {
        const th = i * 2 * PI / 7, dy = Math.cos(th) * 2.2, dz = Math.sin(th) * 2.2, xe = xc - Math.tan(al) * dy - 0.45;
        pis.push(entre(V(b.x + 0.6, b.y + dy, dz), V(xe, b.y + dy, dz), 0.55, ac2, 8)); zap.push(entre(V(xe, b.y + dy, dz), V(xe + 0.35, b.y + dy, dz), 0.85, br, 10));
      }
      add('hid_bomba_pistones', [[[entre(V(a.x + 0.8, b.y, 0), V(b.x + 1.2, b.y, 0), 1.25, ac2, 14), rev([[0, 0], [3.2, 0], [3.2, 4.2], [0, 4.2]], 'x', mat('#6f757b', { metalness: 0.6, roughness: 0.5 }), 24, b.x - 3.6, b.y, 0),
        anillo(1.3, 3.3, b.x - 4.1, b.x - 3.6, 'x', br, 0, b.y, 0, 24), fundir(pis, ac2), fundir(zap, br),
        entre(V(xc, b.y, 0).addScaledVector(n, -0.4), V(xc, b.y, 0).addScaledVector(n, 0.4), 3.8, mat('#8a9096', { metalness: 0.7, roughness: 0.4 }), 24)], ex('hid_bomba_pistones')]]);
    }
  }

  // ================= PIEZAS DEL CONTRATO SOBRE EL TANQUE, LAS VÁLVULAS Y LA PLUMA =================
  if (ids.has('hid_colador')) {   // colador de succión dentro del estanque: marco de latón con rejilla y cuello hacia la bomba
    const c = L.tanqueH.clone().add(V(0, -20, 0)), br = mat('#c9a227', { metalness: 0.8, roughness: 0.4 }), rb = [];
    for (let i = 0; i < 10; i++) { const th = i * PI / 5; rb.push(entre(V(c.x + 3.8 * Math.cos(th), c.y - 5, c.z + 3.8 * Math.sin(th)), V(c.x + 3.8 * Math.cos(th), c.y + 5, c.z + 3.8 * Math.sin(th)), 0.25, br, 6)); }
    add('hid_colador', [[[anillo(2.2, 4.8, c.y + 5, c.y + 6, 'y', br, c.x, 0, c.z), fundir(rb, br), anillo(3.6, 4.1, c.y - 5.4, c.y - 4.6, 'y', br, c.x, 0, c.z), anillo(3.6, 4.1, c.y - 0.2, c.y + 0.6, 'y', br, c.x, 0, c.z),
      rev([[0, c.y - 5.4], [4.1, c.y - 5.4], [4.1, c.y - 5], [0, c.y - 5]], 'y', br, 20, c.x, 0, c.z), entre(V(c.x, c.y + 6, c.z), V(c.x, c.y + 11, c.z), 2.2, br, 14)], ex('hid_colador')]]);
  }
  if (ids.has('hid_valvulas_alivio')) {   // válvulas de alivio (extremos) y antideriva (secciones del brazo) como cartuchos roscados sobre valvula_retro
    const vr = L.valR, yb = vr.y + 11, ac = mat('#8b9096', { metalness: 0.8, roughness: 0.35 });
    const cart = (z, r, h, mb, mt) => [hex(V(vr.x, yb, z), V(vr.x, yb + h * 0.3, z), r * 1.3, ac), entre(V(vr.x, yb + h * 0.3, z), V(vr.x, yb + h * 0.7, z), r, mb, 14),
      entre(V(vr.x, yb + h * 0.7, z), V(vr.x, yb + h, z), r * 0.45, ac, 10), hex(V(vr.x, yb + h * 0.74, z), V(vr.x, yb + h * 0.94, z), r * 0.85, mt)];
    const o = [-38, 39].flatMap(z => cart(z, 2.2, 9, mat('#b7342a', { metalness: 0.4, roughness: 0.5 }), ac)), anti = mat('#c9a227', { metalness: 0.6, roughness: 0.45 });
    for (const i of [1, 2, 4, 5]) o.push(...cart(-30 + i * 9.6, 1.5, 6, anti, ac));
    add('hid_valvulas_alivio', [[o, ex('hid_valvulas_alivio')]]);
  }
  if (ids.has('hid_traba_pluma')) {   // pasador de transporte que une la pluma a las placas de la torre; con argolla, collarín y cadenilla
    const p = K.F.clone().add(V(10, 30, 0)), H = 17.5 * s + 1.5, ac = mat('#c3c8ce', { metalness: 0.85, roughness: 0.25 }), ro = mat('#b7342a', { roughness: 0.6 });
    const o = [entre(V(p.x, p.y, -H), V(p.x, p.y, H), 1.3, ac, 12), entre(V(p.x, p.y, H), V(p.x, p.y, H + 1), 2.4, ac, 12), entre(V(p.x, p.y, H + 1), V(p.x + 6, p.y + 2, H + 1), 0.9, ro, 8),
      mesh(new THREE.TorusGeometry(2.2, 0.35, 8, 20), ac, p.x, p.y, -H - 0.6), tubo([V(p.x, p.y, H + 1.2), V(p.x - 5, p.y - 7, H + 1.2), V(p.x - 10, p.y - 4, H - 0.2)], 0.4, mat('#5b6066', { metalness: 0.6 }))];
    for (const sd of [-1, 1]) o.push(anillo(1.3, 3.2, sd > 0 ? 17.5 * s - 0.2 : -17.5 * s - 1.4, sd > 0 ? 17.5 * s + 1.4 : -17.5 * s + 0.2, 'z', ac, p.x, p.y, 0));
    ligar.push(...add('hid_traba_pluma', [[o, ex('hid_traba_pluma')]]).map(it => [it, 'sw']));
  }

  // ================= CARGADOR: PUNTAL, BIELETAS Y CUCHILLA =================
  if (ids.has('carg_puntal')) {   // puntal de seguridad: barra con bisagra en el ojo del vástago izquierdo, plegada junto al cilindro, con tope y mango
    const c = cilDef[0], d = c[3].clone().sub(c[2]).normalize(), zc = -(K.zA + 10.5), ac = A.pintura('#d63a2f'), ac2 = mat('#c3c8ce', { metalness: 0.85, roughness: 0.25 });
    const pB = c[3].clone().setZ(zc), pT = pB.clone().addScaledVector(d, -0.62 * c[2].distanceTo(c[3]));
    const o = [entre(pB, pT, 1.8, ac, 14), entre(V(pB.x, pB.y, zc), V(pB.x, pB.y, zc + 6.5), 2.6, ac2, 14), entre(pT.clone().addScaledVector(d, -0.5), pT, 2.4, ac2, 14),
      entre(pT.clone().add(V(0, 0, -3)), pT.clone().add(V(0, 0, 3)), 1, ac, 10), anillo(1.9, 3.4, zc, zc + 2.4, 'z', ac2, pB.x, pB.y, 0)];
    ligar.push(...add('carg_puntal', [[o, ex('carg_puntal')]]).map(it => [it, 'arm']));
  }
  if (ids.has('carg_bieletas')) {   // bieletas de volteo: dos placas con ojos y bujes, pasador al ojo del cilindro y barra transversal
    const p1 = K.dumpB.clone(), p2 = K.pC(-8, 44), u = p2.clone().sub(p1).normalize(), n = V(-u.y, u.x, 0), pl = mat('#34393e', { metalness: 0.35, roughness: 0.55 }), ac = mat('#c3c8ce', { metalness: 0.85, roughness: 0.25 }), br = mat('#b5813a', { metalness: 0.75, roughness: 0.4 }), o = [];
    for (const sd of [-1, 1]) {
      const zc = sd * (K.zV - 9.5), q = (p, k) => [p.x + n.x * k, p.y + n.y * k];
      o.push(placa([q(p1, 3.6), q(p2, 3.6), q(p2, -3.6), q(p1, -3.6)], 2.5, pl, zc), rev([[0, -1.25], [3.6, -1.25], [3.6, 1.25], [0, 1.25]], 'z', pl, 20, p1.x, p1.y, zc), rev([[0, -1.25], [3.6, -1.25], [3.6, 1.25], [0, 1.25]], 'z', pl, 20, p2.x, p2.y, zc),
        anillo(1.9, 2.6, zc - 1.8, zc + 1.8, 'z', br, p1.x, p1.y, 0), anillo(1.9, 2.6, zc - 1.8, zc + 1.8, 'z', br, p2.x, p2.y, 0),
        entre(V(p1.x, p1.y, sd * (K.zV - 11.5)), V(p1.x, p1.y, sd * (K.zV + 8.5)), 1.9, ac, 12));
    }
    o.push(entre(V(p2.x, p2.y, -(K.zV - 9.5)), V(p2.x, p2.y, K.zV - 9.5), 1.9, ac, 12));
    ligar.push(...add('carg_bieletas', [[o, ex('carg_bieletas')]]).map(it => [it, 'bkt']));
  }
  if (ids.has('carg_cuchilla')) {   // cuchilla atornillada al labio del cucharón, con cantoneras y tornillos
    const w = D.bkW, ac = mat('#8b9096', { metalness: 0.7, roughness: 0.4 }), tn = mat('#4a4f56', { metalness: 0.8, roughness: 0.4 }), P = (dx, dy) => [K.PB.x + dx, K.PB.y + dy], o = [];
    o.push(placa([P(97, -34.5), P(107, -34.5), P(104.5, -30), P(97, -29.5)], w - 4, ac));
    const tor = []; for (let i = 0; i < Math.floor(w / 20); i++) tor.push(hex(V(K.PB.x + 100, K.PB.y - 29.4, -w / 2 + 12 + i * 20), V(K.PB.x + 100, K.PB.y - 28.4, -w / 2 + 12 + i * 20), 1.1, tn));
    o.push(fundir(tor, tn));
    for (const sd of [-1, 1]) o.push(caja(10, 6.4, 3.4, K.PB.x + 102, K.PB.y - 31.8, sd * (w / 2 - 1.7), ac));
    ligar.push(...add('carg_cuchilla', [[o, ex('carg_cuchilla')]]).map(it => [it, 'bkt']));
  }

  // ================= RETRO: DIENTES Y ACOPLE RÁPIDO =================
  if (ids.has('retro_dientes')) {   // 5 adaptadores con diente (cuña) y pasador de retención, a lo ancho de la cuchara
    const w = 61 * s, ac = mat('#5a5f66', { metalness: 0.7, roughness: 0.4 }), pt = mat('#2e3236', { metalness: 0.6, roughness: 0.5 }), t = K.pK(104, -36), dd = K.dd.clone().multiplyScalar(0.55).add(K.dn.clone().multiplyScalar(-0.83)).normalize(), o = [];
    for (let i = 0; i < 5; i++) {
      const z = -w / 2 + 6 + i * (w - 12) / 4, g = new THREE.Group(), cono = mesh(new THREE.ConeGeometry(3.4, 10, 4), ac, 0, 9.5, 0); cono.rotation.y = PI / 4;
      g.add(caja(7, 9, 6.4, 0, 0, 0, pt), cono, entre(V(-4, 1, 0), V(4, 1, 0), 0.6, ac, 8));
      g.position.set(t.x + dd.x * 1, t.y + dd.y * 1, z); g.quaternion.setFromUnitVectors(V(0, 1, 0), dd); o.push(g);
    }
    ligar.push(...add('retro_dientes', [[o, ex('retro_dientes')]]).map(it => [it, 'bk']));
  }
  if (ids.has('retro_acople_rapido')) {   // acople rápido: dos placas laterales con gancho y garra, bocines y cilindro de bloqueo
    const ac = A.pintura(col('brazo')), ac2 = mat('#5a5f66', { metalness: 0.7, roughness: 0.4 }), br = mat('#b5813a', { metalness: 0.75, roughness: 0.4 }), P = (a, n) => { const q = K.pK(a, n); return [q.x, q.y]; }, o = [];
    for (const sd of [-1, 1]) {
      const z = sd * 17 * s;
      o.push(placa([P(-14, -6), P(8, -8), P(17, -2), P(17, 8), P(8, 6), P(2, 22), P(-14, 20)], 2.5 * s, ac, z), anillo(3.6 * s, 5.5 * s, z - 1.25 * s, z + 1.25 * s, 'z', ac2, K.Q.x, K.Q.y, 0, 20),
        anillo(3.6 * s * 0.8, 3.6 * s, z - 2 * s, z + 2 * s, 'z', br, K.Q.x, K.Q.y, 0, 18));
    }
    const c0 = K.pK(-4, 21), c1 = K.pK(12, 14);
    o.push(entre(V(c0.x, c0.y, -17 * s), V(c0.x, c0.y, 17 * s), 2.4, ac2, 14), entre(V(c1.x, c1.y, -17 * s - 3), V(c1.x, c1.y, -17 * s + 3), 2.2, ac2, 14), entre(V(c1.x, c1.y, 17 * s - 3), V(c1.x, c1.y, 17 * s + 3), 2.2, ac2, 14));
    ligar.push(...add('retro_acople_rapido', [[o, ex('retro_acople_rapido')]]).map(it => [it, 'dip']));
  }

  // ================= MANGUERAS =================
  {
    const m = A.manguera(), r = 1.4, rac = A.fundicion('#8b9096'), b = L.bomba, vc = L.valC, tx1 = Math.min(cabX1 + 2, D.wb - D.fr - 12);
    // H1: la bomba va adelante. Aspiración: sale del frente del estanque, corre por el lado derecho del compartimiento del motor y entra por la boca +z.
    // Presión: sale por la boca -z, sube por el lado izquierdo, cruza sobre la campana y baja a la entrada de la válvula del cargador.
    const asp = tubo([V(tx1 + 0.5, 56, cw - 8), V(tx1 + 16, 54, 40), V(tx1 + 60, 56, 31), V(b.x - 40, 72, 30), V(b.x - 14, 92, 22), V(b.x - 3, b.y + 2, 14), V(b.x - 1.2, b.y, 9.6)], 2.4, m);
    const pre = tubo([V(b.x - 1.2, b.y, -9.6), V(b.x - 3, b.y + 6, -19), V(b.x - 18, 114, -30), V(mX0 + 30, 128, -31), V(mX0 - 6, 142, -28), V(vc.x + 6, 148, -4), V(vc.x + 2, 140, 18), V(vc.x - 4.3, 126, vc.z)], r, m);
    const chas = [asp, pre,
      tubo([vc.clone().add(V(-10, 0, 0)), V(60, 104, 34), V(cabX0 + 10, 112, 30), L.valR.clone().add(V(0, -10, 30))], r, m),
      tubo([L.valR.clone().add(V(0, -12, -30)), V(30, 100, 40), L.filtroH.clone().add(V(0, 12, 0))], r, m),
      ...[-1, 1].map(sd => tubo([vc.clone().add(V(0, 0, 0)), V(cabX1 + 10, 120, sd * 34), K.liftA.clone().setZ(sd * (K.zA - 8))], r, m)),
      // racores en las bocas de la bomba y de la válvula
      hex(V(b.x - 1.2, b.y, 8.6), V(b.x - 1.2, b.y, 10), 3.1, rac), hex(V(b.x - 1.2, b.y, -10), V(b.x - 1.2, b.y, -8.6), 2.3, rac), hex(V(vc.x - 4.3, 123, vc.z), V(vc.x - 4.3, 125, vc.z), 2.1, rac)];
    const brazo = [-1, 1].map(sd => tubo([K.pA(0.1 * K.LA, 8, sd * (K.zA - 6)), K.pA(0.3 * K.LA, 34, sd * (K.zA - 6)), K.dumpA.clone().setZ(sd * (K.zV - 6))], r, m));
    const pl = [-4, 4].map(z => tubo([K.boomA.clone().setZ(z * s), K.pB(40, 30, z * s), K.pB(140, 44, z * s), K.pB(0.5 * 265, -4, z * s), K.dipA.clone().setZ(z * s)], r, m))
      .concat([-3, 3].map(z => tubo([K.pB(140, 44, z * s), K.pB(250, 18, z * s), K.pD(-6, 20, z * s), K.bkA.clone().setZ(z * s)], r, m)));
    const it = add('mangueras', [[chas, V(0, 40, 60)], [brazo, V(120, 70, 0)], [pl, V(-200, 100, 50)]]);
    liga(it, ['fijo', 'arm', 'boom']);
  }

  // ================= PASADORES (pasador + bujes + tapa con perno de retención, uno por articulación) =================
  {
    const mp = () => mat('#c3c8ce', { metalness: 0.85, roughness: 0.25 }), mb = () => mat('#b5813a', { metalness: 0.75, roughness: 0.4 }), mr = () => mat('#2e3236', { metalness: 0.6, roughness: 0.5 });
    const par = (p, ax, H, r, bu, o) => pin(p, ax, -H, H, r, bu, mp(), mb(), mr(), o);
    const lado = (p, r, zi, zo, bu) => pin(p, 'z', zi, zo, r, bu, mp(), mb(), mr());
    // «pasadores» queda solo con los del cargador al chasis (K.PL, cuerpo «arm»)
    const it = add('pasadores', [[[-1, 1].flatMap(sd => lado(K.PL, 4, sd * (K.zA - 19), sd * (K.zA + 7), [[sd * K.zA, 9]])), V(0, 30, 0)]]); liga(it, ['arm']);
    const cuch = (id, p, ax, H, r, bu, c, o) => { if (ids.has(id)) liga(add(id, [[par(p, ax, H, r, bu, o), ex(id)]]), c); };
    if (ids.has('pas_carg_cucharon')) liga(add('pas_carg_cucharon', [[[-1, 1].flatMap(sd => lado(K.PB, 3.6, sd * (K.zA - 8.5), sd * (K.zA + 9), [[sd * K.zA, 9], [sd * K.zA + 6, 3], [sd * K.zA - 6, 3]])), ex('pas_carg_cucharon')]]), 'bkt');
    cuch('pas_pie_pluma', K.F, 'z', 18 * s, 4.5, [[0, 22 * s], [15 * s, 5], [-15 * s, 5]], 'boom');
    cuch('pas_pluma_brazo', K.T, 'z', 14 * s, 4, [[0, 22 * s]], 'dip');
    cuch('pas_brazo_cuchara', K.Q, 'z', 34 * s, 3.6, [[8 * s, 4], [-8 * s, 4], [17 * s, 3], [-17 * s, 3]], 'bk');
    if (ids.has('pas_bieletas')) liga(add('pas_bieletas', [[par(K.D1, 'z', 13 * s, 2.8, [[11 * s, 6], [-11 * s, 6]]), ex('pas_bieletas')], [par(K.J0, 'z', 14 * s, 2.8, [[11 * s, 5], [-11 * s, 5], [6 * s, 5], [-6 * s, 5]]), ex('pas_bieletas').clone().add(V(0, 20, 0))],
      [par(K.K0, 'z', 9 * s, 2.8, [[6 * s, 5], [-6 * s, 5]]), ex('pas_bieletas').clone().add(V(0, 40, 0))]]), ['lg', 'J', 'lb']);
    if (ids.has('pas_estab')) add('pas_estab', [[[-1, 1].flatMap(sd => { const q = K.PS(sd); return pin(q, 'x', q.x - 12, q.x + 12, 3.4, [[q.x, 16]], mp(), mb(), mr()); }), ex('pas_estab')]]);
    if (ids.has('pas_torre')) {   // pivotes alto y bajo de la torre: el pasador sobresale de la columna; cabeza dentro del tramo y tapa con perno en la punta
      const cu = (a, b) => pin(V(D.piv, 0, 0), 'y', a, b, 6, [[(a + b) / 2 + 0.8, 8]], mp(), mb(), mr());
      liga(add('pas_torre', [[[...cu(128, 141), ...cu(42, 29)], ex('pas_torre')]]), 'sw');
    }
  }

  ctx.pendientes();   // placeholders para los ids del contrato que aún no tienen geometría (no borrar)
}
