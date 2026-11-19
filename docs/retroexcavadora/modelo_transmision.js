// Módulo TRANSMISIÓN de la retroexcavadora (propietario: agente de transmisión). Contrato: contrato.json (modulo «transmision»); guía: CONTRATO.md.
// Construye las piezas existentes convertidor, transmision, cardan_del, cardan_tras, eje_del, eje_tras, chasis, cabina y mandos,
// y las piezas nuevas del contrato (convertidor y caja, cardanes, ejes y mandos finales, frenos, dirección, cabina y chasis).
// Todo va en cm y en coordenadas de mundo; las medidas salen de D (escalas kT = D.rr/62.5 para el eje trasero, kf = D.fr/42 para el delantero).
// Lo que una pieza nueva saca de una existente («extrae_de») ya no está en la existente.
// Chasis: el travesaño superior delantero (que chocaba con la bomba hidráulica, H1) se rebajó: queda abierto en |z| < 14 y se agrega un tirante bajo.
export default function (ctx) {
  const { THREE, PI, V, mat, mesh, placa, chapa, entre, caja, cajaR, tubo, pasador, fundir, letrero, cilindro, A, D, K, L, s, add, liga, ligar, cils, col, pint, osc, cil3, marcaFondo,
    yT, yD, cabX0, cabX1, cabY0, cw, hw, hx0, hTop, mX0, mX1, yC, lm, xcM, kM, rev, cil } = ctx;

  // ---------- helpers locales ----------
  const st = (c = '#9aa1a8') => mat(c, { metalness: 0.75, roughness: 0.35 });          // acero
  const bro = () => mat('#b08d57', { metalness: 0.6, roughness: 0.4 });                 // bronce
  const fri = () => mat('#7a5a34', { metalness: 0.1, roughness: 0.9 });                 // material de fricción
  const eje3 = ax => (ax === 'x' ? V(1, 0, 0) : ax === 'y' ? V(0, 1, 0) : V(0, 0, 1));
  const poner = (o, ax, x, y, z) => { o.quaternion.setFromUnitVectors(V(0, 0, 1), typeof ax === 'string' ? eje3(ax) : ax); o.position.set(x, y, z); return o; };
  const aro = (ax, r0, r1, w, x, y, z, m, seg = 24) => rev([[r0, -w / 2], [r1, -w / 2], [r1, w / 2], [r0, w / 2]], ax, m, seg, x, y, z);
  const hue = (ax, r0, r1, a0, a1, x, y, z, m, seg = 28) => rev([[r0, a0], [r1, a0], [r1, a1], [r0, a1]], ax, m, seg, x, y, z);   // anillo entre a0 y a1
  const pernos = (n, R, r, h, ax, x, y, z, m, a0 = 0) => poner(fundir(Array.from({ length: n }, (_, i) => { const a = a0 + i / n * 2 * PI; return cil('z', r, r, h, Math.cos(a) * R, Math.sin(a) * R, 0, m, 6); }), m), ax, x, y, z);
  // engranaje (o corona interna si int) de eje ax; dientes fundidos en una malla
  const engr = (ax, r, w, n, x, y, z, m, ri = 0, int = false) => {
    const th = Math.max(r * 0.16, 0.7), tw = PI * r / n * 0.85, o = [];
    o.push(int ? rev([[r, -w / 2], [r + th + 1.6, -w / 2], [r + th + 1.6, w / 2], [r, w / 2]], 'z', m, 28) : rev([[ri, -w / 2], [r, -w / 2], [r, w / 2], [ri, w / 2]], 'z', m, 28));
    const rt = int ? r - th / 2 + 0.1 : r + th / 2 - 0.1;
    for (let i = 0; i < n; i++) { const a = i / n * 2 * PI, t = caja(th, tw, w, Math.cos(a) * rt, Math.sin(a) * rt, 0, m); t.rotation.z = a; o.push(t); }
    return poner(fundir(o, m), ax, x, y, z);
  };
  const resorte = (p0, p1, r, vueltas, rh, m) => {
    const d = p1.clone().sub(p0), Lg = d.length(), q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), d.normalize()), n = vueltas * 8, pts = [];
    for (let i = 0; i <= n; i++) { const a = i / 8 * 2 * PI; pts.push(V(Math.cos(a) * r, Math.sin(a) * r, Lg * i / n).applyQuaternion(q).add(p0)); }
    return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, rh, 5), m);
  };
  // rodamiento simple (eje z/x): dos aros y una pista de bolas fundida
  const rod = (ax, ro, ri, w, x, y, z, m) => poner(fundir([hue('z', ro - 0.8, ro, -w / 2, w / 2, 0, 0, 0, m, 24), hue('z', ri, ri + 0.8, -w / 2, w / 2, 0, 0, 0, m, 24), hue('z', ri + 0.8, ro - 0.8, -w / 4, w / 4, 0, 0, 0, m, 24)], m), ax, x, y, z);
  // juego de discos en el eje z local de un grupo: tambor, discos de acero y de fricción alternados, pistón y resortes
  const paquete = (len, rD, ax, x, y, z, { nf = 4, nr = 4 } = {}) => {
    const g = new THREE.Group(), sm = st(), fm = fri(), cl = A.fundicion('#4b5057');
    g.add(hue('z', rD - 1.2, rD, 0, len, 0, 0, 0, cl), aro('z', 2.6, rD - 1.2, 1.1, 0, 0, 0.55, cl), aro('z', 2.4, 4.2, len, 0, 0, len / 2, sm, 16));
    const n = nf * 2, pas = (len - 3.2) / n, ac = [], fr = [];
    for (let i = 0; i < n; i++) { const zz = 1.6 + pas * (i + 0.5); if (i % 2) fr.push(aro('z', 4.4, rD - 2.6, 0.35, 0, 0, zz, fm)); else ac.push(aro('z', 4.4, rD - 1.3, 0.35, 0, 0, zz, sm)); }
    g.add(fundir(ac, sm), fundir(fr, fm), aro('z', 4.6, rD - 1.8, 1.1, 0, 0, len - 1.4, sm));
    for (let i = 0; i < nr; i++) { const a = i / nr * 2 * PI + 0.4, rr_ = (rD + 4.4) / 2; g.add(resorte(V(Math.cos(a) * rr_, Math.sin(a) * rr_, len - 2.2), V(Math.cos(a) * rr_, Math.sin(a) * rr_, len - 0.1), 0.7, 2, 0.14, sm)); }
    return poner(g, ax, x, y, z);
  };
  // mando final planetario de eje z: sol, 3 satélites, corona y portasatélites; r = radio interior de la corona
  const planetario = (r, w, x, y, z, sd, ligadura) => {
    const rs = r * 0.28, rp = r * 0.36, sm = st(), cm = st('#7e858c'), pm = A.fundicion('#4b5057'), o = [];
    o.push(engr('z', rs, w, 12, x, y, z, sm, rs * 0.4), engr('z', r, w, 36, x, y, z, cm, 0, true));
    for (let i = 0; i < 3; i++) { const a = i / 3 * 2 * PI + 0.5, px = x + Math.cos(a) * (rs + rp), py = y + Math.sin(a) * (rs + rp); o.push(engr('z', rp, w, 14, px, py, z, sm, rp * 0.3), entre(V(px, py, z - w / 2 - 0.2), V(px, py, z + w / 2 + 1.6), rp * 0.28, pm, 10)); }
    o.push(aro('z', rs * 0.5, r * 0.88, 1.1, x, y, z + sd * (w / 2 + 1.2), pm));
    return o;
  };

  // ================= CONVERTIDOR Y CAMPANA =================
  const cC = mX0 - 10.2;   // centro axial del convertidor
  {   // convertidor de par: tapa, rodete (bomba), turbina, estator, cubos y eje de la turbina
    const a = 4.8, Rm = 15.5, f = st('#8b9198'), tb = mat('#b98e3a', { metalness: 0.7, roughness: 0.35 }), ve = A.fundicion('#5a6068'), g = new THREE.Group();
    const arco = (t0, t1, n = 10) => Array.from({ length: n + 1 }, (_, i) => { const t = t0 + (t1 - t0) * i / n; return [Rm + a * Math.cos(t), a * Math.sin(t)]; });
    g.add(rev([[3, 5], [3, 6.2], [21.5, 6.2], [21.5, -5], [20.5, -5], [20.5, 5]], 'z', f, 32));          // tapa soldada
    g.add(rev(arco(PI, 2 * PI), 'z', ve, 28), rev(arco(0, PI), 'z', tb, 28));                          // rodete y turbina
    const bl = (z0, off, n, c) => fundir(Array.from({ length: n }, (_, i) => { const t = i / n * 2 * PI + off, b = caja(8, 0.35, 3.2, Math.cos(t) * Rm, Math.sin(t) * Rm, z0, c); b.rotation.z = t; return b; }), c);
    g.add(bl(-2.2, 0, 24, ve), bl(2.2, 0.13, 24, tb));
    g.add(aro('z', 8.4, 11, 2.2, 0, 0, 0, st('#6d747b')), bl(0, 0, 12, st('#6d747b')));                // estator
    g.add(hue('z', 3.9, 6.3, -15.8, -5, 0, 0, 0, f), aro('z', 3.4, 9.5, 1.6, 0, 0, 2.2, tb));            // cubo del rodete y de la turbina
    g.add(entre(V(0, 0, 3.5), V(0, 0, cC - (mX0 - 30) > 0 ? -(cC - (mX0 - 30)) : -19.8), 3.4, st('#c3c8ce'), 16));   // eje de la turbina hacia la caja
    g.add(pernos(6, 12, 0.55, 2.6, 'z', 0, 0, 7.4, st('#c3c8ce')));                                     // espárragos de la placa flexible
    add('convertidor', [[[poner(g, 'x', cC, yC, 0)], V(40, -70, 0)]], true);
  }
  {   // placa flexible: disco delgado con cubo y dos coronas de pernos
    const rp = 23 * kM, sm = st('#a4aab0'), xp = mX0 - 3.4;
    const disco = rev([[5, -1.2], [11, -1.2], [11, -0.6], [rp - 4, -0.6], [rp, -0.6], [rp, 0.6], [11, 0.6], [11, 1.2], [5, 1.2]], 'x', sm, 36, xp, yC, 0);
    const boca = pernos(8, rp - 3, 0.9, 1.4, 'x', xp + 1.6, yC, 0, st('#5d636a')), cub = pernos(6, 12, 0.7, 1.4, 'x', xp - 1.6, yC, 0, st('#5d636a'));
    add('conv_placa_flex', [[[disco, boca, cub], V(-20, -70, -60)]]);
  }
  {   // campana (cubre convertidor y placa) con tapa de acceso
    const x0 = mX0 - 17, x1 = mX0 + 1.5, f = A.fundicion('#4a4f55'), tp = A.fundicion('#5b6168');
    const cam = rev([[12, x0], [27, x0], [27, x1 - 1.5], [31, x1 - 1.5], [31, x1], [25, x1], [25, x0 + 2], [12, x0 + 2]], 'x', f, 36, 0, yC, 0);
    const cc = (x0 + x1) / 2;
    const tapa = [caja(10, 1.6, 12, cc, yC + 27.8, 0, tp), pernos(4, 4.6, 0.6, 1, 'y', cc, yC + 28.9, 0, st('#c3c8ce'), PI / 4)];
    const arr = caja(8, 4, 8, mX0 - 6, yC - 22, -20, f);   // alojamiento del motor de arranque
    add('conv_campana', [[[cam, ...tapa, arr, pernos(10, 29, 0.9, 1.8, 'x', x1 - 0.2, yC, 0, st('#5d636a'))], V(0, -80, 0)]], true);
  }
  {   // bomba de carga: cuerpo, engranaje motriz (en el cubo del rodete) y engranaje conducido
    const x = mX0 - 23, f = A.fundicion('#585e64'), sm = st();
    add('tr_bomba', [[[cajaR(7, 26, 15, 1.5, x, yC - 6, 0, f), engr('x', 5.7, 5, 14, x, yC, 0, sm, 2.5), engr('x', 5.7, 5, 14, x, yC - 12, 0, sm, 1.5), entre(V(x - 3.5, yC - 12, 0), V(x + 3.5, yC - 12, 0), 1.4, st('#c3c8ce'), 10),
      cil3(V(x - 6, yC - 12, 6), V(x - 3.5, yC - 12, 6), 2, f), pernos(4, 5.5, 0.6, 1, 'x', x - 3.8, yC - 6, 6.4, st('#c3c8ce'))], V(-30, -90, -50)]]);
  }

  // ================= CAJA DE LA TRANSMISIÓN =================
  const x0 = 46, x1 = mX0 - 17, Y1 = 86, Y2 = 66, YI = yC, xm = (x0 + x1) / 2;
  {
    const f = A.fundicion('#53585e');
    add('transmision', [[[cajaR(x1 - x0, 46, 44, 8, xm, 76, 0, f), cajaR(x1 - 52, 18, 30, 6, (52 + x1) / 2, 106, 0, f), cajaR(26, 16, 22, 4, 92, 50, 0, f),
      hue('x', 7, 10.5, x0 - 7, x0 + 2, 0, Y2, 0, f, 24), hue('x', 6, 8.5, 75, 82, 0, 52, 0, f, 24),
      entre(V(xm + 10, 112, 0), V(xm + 22, 150, 4), 1.4, A.oscuro('#111'))], V(0, -90, 0)]], true);   // carcasa + varilla del respiradero
  }
  {   // inversor: paquete de avance, de retroceso, pistones y resortes
    const yb = Y1;
    add('tr_embragues', [[[paquete(9, 12.5, 'x', 99.5, yb, 0, { nf: 4, nr: 6 }), aro('x', 3.3, 4.8, 4, 112, yb, 0, st())], V(20, -100, -80)], [[paquete(9, 12.5, 'x', 85, yb, 0, { nf: 4, nr: 6 })], V(-20, -100, -80)]]);
  }
  {   // ejes, engranajes y sincronizadores
    const sm = st(), cm = st('#8a9198'), g = [];
    const eje = (y, a, b, r) => entre(V(a, y, 0), V(b, y, 0), r, st('#c3c8ce'), 16);
    g.push(eje(YI, 96, mX0 - 30, 3.4), eje(Y1, 52, 120, 3.2), eje(Y2, x0 - 4, 100, 3.6));
    g.push(engr('x', 7.5, 5, 18, 112, YI, 0, sm, 3.4), engr('x', 10.5, 5, 24, 112, Y1, 0, sm, 3.2));                  // toma desde el convertidor
    g.push(engr('x', 9, 4, 20, 97, Y1, 0, cm, 3.2), engr('x', 11, 4, 24, 97, Y2, 0, cm, 3.6));                          // salida del inversor a la caja
    for (const [x, ra, rb] of [[62, 8, 12], [72, 10, 10], [82, 11, 9]]) g.push(engr('x', ra, 5, 18, x, Y1, 0, sm, 3.2), engr('x', rb, 5, 18, x, Y2, 0, cm, 3.6));
    for (const x of [67, 77]) {   // sincronizadores: manguito con dientes, anillos cónicos y horquilla
      const br = bro();
      g.push(aro('x', 3.6, 8, 5, x, Y2, 0, st('#7e858c'), 24), engr('x', 8, 1.6, 18, x, Y2, 0, sm, 6), hue('x', 6, 7, x - 3, x - 2.4, 0, Y2, 0, br), hue('x', 6, 7, x + 2.4, x + 3, 0, Y2, 0, br), entre(V(x, Y2 + 8.6, 0), V(x, Y2 + 12, 0), 0.9, sm, 8), caja(1.6, 1.4, 4, x, Y2 + 12, 0, sm));
    }
    g.push(engr('x', 7, 4, 16, 93, Y2, 0, cm, 3.6));   // piñón de toma del 4WD
    g.push(rod('x', 6.2, 3.2, 2.4, 55, Y1, 0, st('#c3c8ce')), rod('x', 6.6, 3.6, 2.4, x0 + 2, Y2, 0, st('#c3c8ce')), rod('x', 6.6, 3.6, 2.4, 106, Y2, 0, st('#c3c8ce')));
    add('tr_engranajes', [[g, V(0, -100, 80)]]);
  }
  {   // válvula e inversor con solenoides, en el costado izquierdo
    const f = A.fundicion('#6d747b'), z = -27, so = mat('#2c3036', { metalness: 0.3, roughness: 0.6 }), cn = A.oscuro('#d0a020');
    const g = [cajaR(28, 14, 8, 2, 90, 96, z, f), ...[0, 1, 2].map(i => cil('z', 3, 3, 6, 82 + i * 8, 96, z - 6, so, 14)), ...[0, 1, 2].map(i => caja(2, 2, 1.5, 82 + i * 8, 96, z - 9.8, cn)), pernos(6, 4, 0.5, 1, 'z', 98, 96, z - 4, st('#c3c8ce')), caja(8, 3, 3, 76, 100, z - 2, A.oscuro('#222'))];
    add('tr_valvula', [[g, V(0, 40, -90)]]);
  }
  {   // filtro de aceite de la transmisión: cabeza y cartucho enroscable
    const az = mat('#2f5d8a', { metalness: 0.4, roughness: 0.5 }), f = A.fundicion('#6d747b');
    add('tr_filtro', [[[cajaR(16, 12, 6, 2, 100, 66, -25.5, f), cil('z', 6, 6, 17, 100, 66, -37, az, 24), cil('z', 6.4, 6.4, 1, 100, 66, -28.5, st('#9aa1a8'), 24), cil('z', 4.4, 4.4, 1, 100, 66, -45.8, st('#cdd2d8'), 18)], V(0, -30, -110)]]);
  }
  {   // freno de estacionamiento SAHR: placa de resortes, discos, pistón y carcasa
    const x = 52;
    add('tr_freno_estac', [[[paquete(9, 10.5, 'x', x - 5, Y2, 0, { nf: 3, nr: 6 }), aro('x', 3.9, 10.8, 1.2, x - 5.8, Y2, 0, A.fundicion('#4b5057'), 28), pernos(6, 10, 0.6, 2, 'x', x - 6, Y2, 0, st('#c3c8ce'))], V(-30, -80, -60)]]);
  }
  {   // embrague de la tracción 4WD, bajo la caja
    const x = 83;
    add('tr_embrague_4wd', [[[paquete(6, 6.5, 'x', x, 52, 0, { nf: 2, nr: 4 }), engr('x', 7, 4, 16, 93, 52, 0, st('#8a9198'), 2.6), entre(V(78, 52, 0), V(96, 52, 0), 2.6, st('#c3c8ce'), 14)], V(30, -90, -60)]]);
  }
  {   // retenes de salida (trasera y delantera)
    const g = A.goma(), me = st('#7e858c');
    add('tr_retenes', [[[hue('x', 3.7, 5.6, x0 - 4.8, x0 - 2.6, 0, Y2, 0, g, 20), hue('x', 5.6, 6.5, x0 - 4.8, x0 - 4.2, 0, Y2, 0, me, 20), hue('x', 2.7, 4.2, 76.5, 78.5, 0, 52, 0, g, 20), hue('x', 4.2, 5, 76.5, 77.1, 0, 52, 0, me, 20)], V(-20, -60, 60)]]);
  }

  // ================= CARDANES (y crucetas) =================
  const cruces = [];
  for (const [id, [p0], p1, cuerpo, dir] of [['cardan_del', K.cardD, V(D.wb - 26, yD + 2, 0), 'cardD', V(0, -120, 0)], ['cardan_tras', K.cardT, V(20, yT, 0), 'cardT', V(-10, -110, 0)]]) {
    const ac = mat('#6f757c', { metalness: 0.75, roughness: 0.35 }), y = A.oscuro('#2c2f33'), d = p1.clone().sub(p0).normalize(), cr = st('#b0b6bd');
    const g = [entre(p0.clone().addScaledVector(d, 7), p1.clone().addScaledVector(d, -7), 3.6, ac, 16), entre(p0.clone().addScaledVector(d, 7), p0.clone().addScaledVector(d, 18), 2.4, ac, 12), entre(p1.clone().addScaledVector(d, -7), p1.clone().addScaledVector(d, -18), 2.4, ac, 12)];
    for (const [q, sg] of [[p0, 1], [p1, -1]]) {
      g.push(entre(q.clone().addScaledVector(d, sg * 2), q.clone().addScaledVector(d, sg * 8), 3.6, y, 14));                 // cuerpo de la horquilla
      for (const zz of [-6.6, 6.6]) g.push(caja(7, 7, 2.4, q.x, q.y, q.z + zz, y));                                          // brazos
      const per = V(-d.y, d.x, 0), a = [q.clone().add(V(0, 0, -6)), q.clone().add(V(0, 0, 6))], b = [q.clone().addScaledVector(per, -5), q.clone().addScaledVector(per, 5)];
      const c = [entre(a[0], a[1], 1.3, cr, 8), entre(b[0], b[1], 1.3, cr, 8), mesh(new THREE.SphereGeometry(2, 10, 8), cr, q.x, q.y, q.z)];
      for (const e of [...a, ...b]) c.push(cil3(e.clone().addScaledVector(e.clone().sub(q).normalize(), -1), e.clone().addScaledVector(e.clone().sub(q).normalize(), 0.8), 1.9, cr));
      cruces.push([c, cuerpo]);
    }
    ligar.push(...add(id, [[g, dir]]).map(it => [it, cuerpo]));
  }
  {
    const its = add('card_crucetas', [...cruces.map(([c]) => [c, V(0, -130, -40)])]);
    its.forEach((it, i) => ligar.push([it, cruces[i][1]]));
  }

  // ================= EJE DELANTERO =================
  const kf = D.fr / 42, zc = D.ftr / 2 - 13, wb = D.wb, xd = wb - 8, yd1 = yD + 1, f4 = A.fundicion('#3f4449');
  const mang = sd => [   // mangueta: carcasa del mando final (hueca), pivote, brazo y brida del cubo
    hue('z', 10.5 * kf, 12.5 * kf, sd * (zc + 1), sd * (zc + 9), wb, yD, 0, f4, 24), aro('z', 3 * kf, 12.5 * kf, 1.2, wb, yD, sd * (zc + 9.6), f4), aro('z', 3 * kf, 12.5 * kf, 1.2, wb, yD, sd * (zc + 0.6), f4),
    entre(V(wb, yD - 12 * kf, sd * zc), V(wb, yD + 12 * kf, sd * zc), 4.5 * kf, f4, 14), caja(18, 4, 6, wb + 10, yD - 8, sd * (zc - 2), f4),
    aro('z', 3 * kf, 10.5 * kf, 3.8, wb, yD, sd * (D.ftr / 2 - 1.9), f4), pernos(6, 9 * kf * 1.0, 0.7, 6.2, 'z', wb, yD, sd * (D.ftr / 2 + 1.2), st('#c3c8ce'))];
  {   // eje (carcasa): tubo hueco con diferencial central, rótulas y soporte del pivote
    const rp = [[8 * kf, -(zc - 6)], [8 * kf, -17 * kf], [15 * kf, -11 * kf], [15 * kf, 11 * kf], [8 * kf, 17 * kf], [8 * kf, zc - 6]];
    const viga = rev([...rp, ...rp.map(([r, a]) => [r - 1.4, a]).reverse()], 'z', f4, 28, xd, yd1, 0);
    const g = [viga, ...[-1, 1].map(sd => mesh(new THREE.SphereGeometry(9.5 * kf, 18, 12), f4, wb, yD, sd * (zc - 4))),
      hue('x', 7.5 * kf, 9 * kf, wb - 31, wb - 15, 0, yD + 3, 0, f4, 20), caja(2, 9 * kf, 20 * kf, xd + 12 * kf, yd1, 0, f4)];
    add('eje_del', [[g, V(60, -90, 0)]], true);
  }
  {   // manguetas: viran con la dirección
    const its = add('ed_manguetas', [[mang(-1), V(60, -90, -40)], [mang(1), V(60, -90, 40)]], true);
    liga(its, ['knI', 'knD']);
  }
  {   // diferencial delantero (4WD): corona, caja, satélites, piñón y semiejes
    const sm = st(), cm = st('#7e858c'), R = 12 * kf, o = [];
    o.push(hue('z', 0.1, 6.5 * kf, -6, 6, xd, yd1, 0, cm), engr('z', R, 2, 30, xd, yd1, 3.6, sm, 6.5 * kf));
    o.push(entre(V(xd - 5, yd1, 0), V(xd + 5, yd1, 0), 1, st('#c3c8ce'), 8));
    for (const sg of [-1, 1]) { o.push(rev([[0.1, 0], [3.4 * kf, 0], [2.2 * kf, 3]], 'z', sm, 16, xd, yd1, sg * 3)); o.push(rev([[0.1, 0], [2.2 * kf, 0], [1.4 * kf, 2.4]], 'x', sm, 14, xd + sg * 4, yd1, 0)); }
    const pin = [engr('x', 3.6 * kf, 5, 12, xd - R + 1.4, yD + 3, 0, sm, 1), entre(V(xd - R - 3, yD + 3, 0), V(xd - R + 5, yD + 3, 0), 3 * kf, sm, 14), entre(V(wb - 25, yD + 2, 0), V(xd - R - 3, yD + 3, 0), 2.8 * kf, st('#c3c8ce'), 14), rod('x', 5.4 * kf, 3 * kf, 2.4, wb - 21, yD + 3, 0, st('#c3c8ce'))];
    add('ed_diferencial', [[[...o, ...pin], V(60, -80, 0)]]);
  }
  {   // mando final planetario delantero (en la carcasa de la mangueta; vira con ella)
    const its = add('ed_planetario_i', [[planetario(10.5 * kf, 6, wb, yD, -(zc + 5), -1), V(60, -30, -110)]]); liga(its, ['knI']);
    const itd = add('ed_planetario_d', [[planetario(10.5 * kf, 6, wb, yD, zc + 5, 1), V(60, -30, 110)]]); liga(itd, ['knD']);
  }
  {   // retenes de semieje y de cubo (uno por lado, a cada extremo)
    const g = A.goma(), me = st('#7e858c'), lado = sd => [hue('z', 5.2 * kf, 7.4 * kf, sd * (zc - 14), sd * (zc - 12.4), wb, yD, 0, g, 20), hue('z', 7.4 * kf, 8.2 * kf, sd * (zc - 14), sd * (zc - 13.4), wb, yD, 0, me, 20), hue('z', 9 * kf, 11 * kf, sd * (zc + 8), sd * (zc + 9.2), wb, yD, 0, g, 24)];
    add('ed_retenes', [[lado(-1), V(60, -60, -60)], [lado(1), V(60, -60, 60)]]);
  }
  {   // pivote de oscilación del eje: perno, bujes y soportes
    const br = bro(), xp = wb - 31, yp = yD + 24 * kf;
    add('ed_pivote', [[[entre(V(xp - 8, yp, 0), V(xp + 10, yp, 0), 2.6, st('#c3c8ce'), 14), hue('x', 2.7, 4.6, xp - 5, xp - 1.5, 0, yp, 0, br), hue('x', 2.7, 4.6, xp + 3.5, xp + 7, 0, yp, 0, br),
      caja(3, yp - yD - 7, 12, xp - 4, (yp + yD + 7) / 2, 0, f4), caja(3, yp - yD - 7, 12, xp + 5, (yp + yD + 7) / 2, 0, f4), aro('x', 0.1, 5.2, 1.2, xp - 8.6, yp, 0, st('#7e858c'))], V(80, -70, 0)]]);
  }
  {   // cilindro de dirección: camisa, cabezales, vástago con pistón; sellos aparte
    const ac = mat('#596068', { metalness: 0.5 }), cr = A.cromo(), xs = wb + 14, ys = yD - 8, zh = 22;
    const camisa = [entre(V(xs, ys, -zh), V(xs, ys, zh), 4.2, ac, 20), ...[-1, 1].map(sd => hue('z', 0, 5, sd * (zh - 3), sd * (zh + 0.5), xs, ys, 0, f4, 20)), caja(6, 10, 6, wb + 8, yD - 4, 0, f4),
      cil('x', 1.1, 1.1, 5, xs + 4, ys, -zh + 6, ac, 8), cil('x', 1.1, 1.1, 5, xs + 4, ys, zh - 6, ac, 8)];
    const vast = [entre(V(xs, ys, -zc + 10), V(xs, ys, zc - 10), 1.8, cr), aro('z', 0.1, 3.9, 4.6, xs, ys, 0, st('#8a9198'), 20),
      ...[-1, 1].flatMap(sd => [entre(V(xs, ys, sd * (zc - 10)), V(wb + 10, ys, sd * (zc - 2)), 1.6, cr), mesh(new THREE.SphereGeometry(2.6, 12, 8), cr, wb + 10, ys, sd * (zc - 2))])];
    const its = add('dir_cilindro', [[camisa, V(80, -90, 0)], [vast, V(80, -100, 0)]]);
    liga(its, ['fijo', 'steerRod']);
    const vd = mat('#2f8f5b', { roughness: 0.8 }), az = mat('#2f5d8a', { roughness: 0.8 });
    const fijos = [-1, 1].flatMap(sd => [hue('z', 1.9, 3.6, sd * (zh - 1.8), sd * (zh - 0.6), xs, ys, 0, vd, 20), hue('z', 1.9, 3.1, sd * (zh + 0.6), sd * (zh + 1.6), xs, ys, 0, A.goma(), 20), hue('z', 3.6, 4.5, sd * (zh - 3.4), sd * (zh - 2.8), xs, ys, 0, az, 20)]);
    const pist = [hue('z', 3.7, 4.1, -2.5, -1.4, xs, ys, 0, vd, 20), hue('z', 3.7, 4.1, 1.4, 2.5, xs, ys, 0, vd, 20), hue('z', 1.8, 2.4, -0.6, 0.6, xs, ys, 0, az, 16)];
    const si = add('dir_cil_sellos', [[fijos, V(80, -110, 30)], [pist, V(80, -110, -30)]]); liga(si, ['fijo', 'steerRod']);
  }

  // ================= EJE TRASERO =================
  const kT = D.rr / 62.5, z1 = D.rtr / 2 - 16, yDif = yT, Rc = 15 * kT;
  {   // carcasa hueca: banjo central, tubos, cajas de freno y de mando final
    const f = A.fundicion('#3f4449');
    const rp = [[15 * kT, z1 + 8], [15 * kT, z1 - 14], [17 * kT, z1 - 14], [17 * kT, z1 - 32], [10 * kT, z1 - 32], [10 * kT, 20 * kT], [19 * kT, 14 * kT]];
    const perfil = [...rp.map(([r, a]) => [r, -a]), ...rp.slice().reverse()];   // de -z a +z
    const cuerpo = rev([...perfil, ...perfil.map(([r, a]) => [Math.max(r - 1.6, 0.5), a]).reverse()], 'z', f, 28, 0, yT, 0);
    const g = [cuerpo, hue('x', 6.5 * kT, 8.2 * kT, 2, 19 * kT, 0, yDif, 0, f, 20), aro('x', 0.1, 8.8 * kT, 1.6, 20 * kT, yDif, 0, f, 20),
      cil('x', 13 * kT, 13 * kT, 1.8, -17 * kT, yDif, 0, f, 24), pernos(10, 11.5 * kT, 0.8, 1.2, 'x', -18.4 * kT, yDif, 0, st('#c3c8ce'))];
    add('eje_tras', [[g, V(0, -90, 0)]], true);
  }
  {   // corona, piñón y caja del diferencial
    const sm = st(), cm = st('#7e858c'), o = [], pin = [];
    o.push(hue('z', 0.1, 7 * kT, -7, 7, 0, yDif, 0, cm), engr('z', Rc, 3.4, 40, 0, yDif, 4.3, sm, 7 * kT));
    o.push(entre(V(-5.5 * kT, yDif, 0), V(5.5 * kT, yDif, 0), 1.2, st('#c3c8ce'), 8));
    for (const sg of [-1, 1]) { o.push(rev([[0.1, 0], [4.5 * kT, 0], [2.6 * kT, 3]], 'z', sm, 16, 0, yDif, sg * 4)); o.push(rev([[0.1, 0], [2.6 * kT, 0], [1.6 * kT, 2.4]], 'x', sm, 14, sg * 4.4 * kT, yDif, 0)); }
    pin.push(rev([[0.1, 0], [3.4 * kT, 0], [3.4 * kT, 3], [2.4 * kT, 7 * kT]], 'x', sm, 20, Rc - 7 * kT, yDif, 0), entre(V(Rc, yDif, 0), V(17 * kT, yDif, 0), 2.9 * kT, st('#c3c8ce'), 14), rod('x', 5.8 * kT, 3 * kT, 2.6, 12 * kT, yDif, 0, st('#c3c8ce')), aro('x', 3.1 * kT, 5.4 * kT, 1.4, 17.4 * kT, yDif, 0, sm, 20));
    add('et_diferencial', [[o, V(0, -60, 0)], [pin, V(50, -40, 0)]]);
  }
  {   // bloqueo del diferencial: collar con dientes, horquilla y vástago de accionamiento
    const sm = st(), br = bro(), zl = 18 * kT;
    add('et_bloqueo', [[[aro('z', 4 * kT, 7.4 * kT, 3.6, 0, yDif, zl, sm, 24), engr('z', 7.4 * kT, 1.4, 12, 0, yDif, zl + 2.5, sm, 5 * kT), mesh(new THREE.TorusGeometry(8.4 * kT, 0.7, 6, 16, PI), br, 0, yDif, zl).rotateZ(0),
      entre(V(0, yDif + 8.4 * kT, zl), V(0, yDif + 9.4 * kT, zl - 1), 0.8, sm, 8), cil('y', 1.3, 1.3, 7, 0, yDif + 12 * kT, zl, sm, 10), cil('y', 2.3, 2.3, 2.4, 0, yDif + 16 * kT, zl, A.oscuro('#222'), 12)], V(20, -70, 30)]]);
  }
  {   // semiejes: eje con estrías en los dos extremos (uno por lado)
    const sm = st('#aeb4ba'), lado = sd => [entre(V(0, yDif, sd * 5), V(0, yDif, sd * (z1 + 4)), 3.2 * kT, sm, 16), hue('z', 0.1, 3.9 * kT, sd * 3, sd * 8, 0, yDif, 0, st('#7e858c'), 16).translateZ(0), hue('z', 0.1, 3.9 * kT, sd * (z1 - 2), sd * (z1 + 5), 0, yDif, 0, st('#7e858c'), 16)];
    add('et_semiejes', [[lado(-1), V(0, -40, -60)], [lado(1), V(0, -40, 60)]]);
  }
  for (const [sd, sf] of [[-1, 'i'], [1, 'd']]) {
    const zp = sd * z1;
    add('et_planetario_' + sf, [[planetario(11 * kT, 8, 0, yT, zp, sd), V(0, -30, sd * 110)]]);
    // cubo con rodamientos y brida; espárragos hacia la llanta
    const cz = sd * D.rtr / 2, sm = st(), me = st('#7e858c');
    add('et_cubo_' + sf, [[[hue('z', 7 * kT, 11 * kT, sd * (D.rtr / 2 - 11), sd * (D.rtr / 2 - 4), 0, yT, 0, me, 24), aro('z', 7 * kT, 14 * kT, 3.6, 0, yT, cz - sd * 2.2, me), rod('z', 10 * kT, 6.5 * kT, 3, 0, yT, sd * (D.rtr / 2 - 9), sm), rod('z', 10 * kT, 6.5 * kT, 3, 0, yT, sd * (D.rtr / 2 - 5), sm),
      pernos(8, 10, 0.75, 9, 'z', 0, yT, cz + sd * 1.8, sm)], V(0, -20, sd * 150)]]);
    // freno de discos húmedos: separadores, discos de fricción, placa de apoyo y pistón (z = ±(rtr/2 - 40))
    const zb = sd * (D.rtr / 2 - 40), fm = fri(), pl = [], fr = [];
    for (let i = 0; i < 5; i++) { const zz = zb + sd * (-4 + i * 2); (i % 2 ? fr : pl).push(aro('z', 5.2 * kT, i % 2 ? 11.5 * kT : 13 * kT, 0.5, 0, yT, zz, i % 2 ? fm : sm)); }
    add('fr_discos_' + sf, [[[fundir(pl, sm), fundir(fr, fm), aro('z', 5 * kT, 12 * kT, 1.2, 0, yT, zb - sd * 6, me), aro('z', 5 * kT, 11.6 * kT, 2.2, 0, yT, zb + sd * 6.6, mat('#a4aab0', { metalness: 0.7, roughness: 0.4 })), cil('y', 0.9, 0.9, 5, 0, yT + 17 * kT, zb + sd * 6.6, st('#c3c8ce'), 8)], V(0, -40, sd * 90)]]);
  }
  {   // retenes de cubo (un item por lado)
    const g = A.goma(), me = st('#7e858c'), lado = sd => [hue('z', 6.4 * kT, 9 * kT, sd * (D.rtr / 2 - 13), sd * (D.rtr / 2 - 11.4), 0, yT, 0, g, 24), hue('z', 9 * kT, 10 * kT, sd * (D.rtr / 2 - 13), sd * (D.rtr / 2 - 12.4), 0, yT, 0, me, 24), hue('z', 6.4 * kT, 8 * kT, sd * (z1 + 5.5), sd * (z1 + 6.8), 0, yT, 0, g, 24)];
    add('et_reten_cubo', [[lado(-1), V(0, -50, -60)], [lado(1), V(0, -50, 60)]]);
  }
  {   // respiradero del eje: base, codo y tapa
    const y0 = yT + 10 * kT, me = st('#7e858c');
    add('et_respiradero', [[[cil('y', 1.8, 1.8, 3, 0, y0 + 0.5, 20, me, 8), cil('y', 1, 1, 8, 0, y0 + 6, 20, me, 8), tubo([V(0, y0 + 9, 20), V(0, y0 + 12, 20), V(4, y0 + 13, 20), V(6, y0 + 11, 20)], 0.6, A.goma()), mesh(new THREE.SphereGeometry(1.6, 10, 8), bro(), 0, y0 + 10, 20)], V(0, 50, 0)]]);
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
    // travesaño superior delantero rebajado: abierto en |z| < 14 para la bomba hidráulica (L.bomba) y con tirante bajo a y = 80
    const zb0 = 14, zb1 = hw;
    for (const sd of [-1, 1]) { g.push(caja(30, 8, zb1 - zb0, D.grill - 4, 106, sd * (zb0 + zb1) / 2, o)); g.push(caja(8, 30, 6, D.grill - 12, 92, sd * zb0, o)); }
    g.push(caja(18, 8, 2 * hw, D.grill - 10, 80, 0, o));
    // bastidor de la retro: placas superior e inferior en C alrededor del pivote
    const C = () => placa([[-48, -48], [D.piv + 24, -48], [D.piv - 6, -26], [D.piv - 18, 0], [D.piv - 6, 26], [D.piv + 24, 48], [-48, 48]].map(([x, z]) => [x, z]), 8, p, 0);
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
  {   // contrapeso delantero: bloque, barra inferior, pernos, ojales de izaje y gancho de remolque
    const o = osc('#2c3034'), sm = st('#7e858c'), bx = D.grill + 9;
    add('chasis_contrapeso', [[[cajaR(18, 40, 2 * hw + 6, 3, bx, 82, 0, o), cajaR(12, 12, 2 * hw + 16, 2, D.grill + 16, 64, 0, o),
      ...[-1, 1].map(sd => caja(2, 28, 22, D.grill + 18.6, 84, sd * (hw - 14), A.oscuro('#3a3f44'))), pernos(8, 0, 0.1, 0.1, 'x', bx, 82, 0, sm),
      ...[-1, 1].map(sd => mesh(new THREE.TorusGeometry(4, 1, 6, 14), sm, bx, 104, sd * (hw - 10)).rotateY(PI / 2)), mesh(new THREE.TorusGeometry(5, 1.2, 6, 14, PI * 1.5), sm, D.grill + 24, 64, 0).rotateX(0),
      ...[-1, 1].flatMap(sd => [0, 1, 2].map(i => cil('x', 1.4, 1.4, 1.2, D.grill + 19, 68 + i * 14, sd * (hw - 3), sm, 6)))], V(120, 0, 0)]]);
  }

  // ================= CABINA Y SUS PIEZAS =================
  {
    const ne = A.oscuro(col('cab')), vi = A.vidrio(), te = A.oscuro('#2a2c2f');
    const yb = cabY0, yt = D.cab, xa = cabX0, xb = cabX1, z = cw;
    const g = [];
    for (const [x, zz] of [[xa + 4, -z + 4], [xa + 4, z - 4], [xb - 6, -z + 4], [xb - 6, z - 4]]) g.push(caja(7, yt - yb - 8, 7, x, (yb + yt - 8) / 2, zz, ne));
    g.push(cajaR(xb - xa + 16, 10, 2 * z + 12, 4, (xa + xb) / 2, yt - 5, 0, ne), cajaR(xb - xa, 4, 2 * z - 6, 2, (xa + xb) / 2, yt - 12, 0, te));
    for (const sd of [-1, 1]) g.push(caja(xb - xa - 10, 34, 2, (xa + xb) / 2, yb + 18, sd * (z - 2), te));      // panel inferior
    g.push(caja(6, 50, 2 * z - 10, xa + 2, yb + 26, 0, te), caja(6, 30, 2 * z - 10, xb - 3, yb + 15, 0, te));
    add('cabina', [[g, V(0, 260, 0)]], true);

    // puertas (una por lado, con marco, vidrio, manilla, bisagras, espejo) y vidrios fijos
    const marco = A.oscuro(col('cab')), mn = A.oscuro('#14161a'), ac = st('#8b9198');
    const dx0 = xb - 86, dx1 = xb - 8, dy0 = yb + 34, dy1 = yt - 12, dm = (dx0 + dx1) / 2;
    const puerta = sd => {
      const zz = sd * (z - 2.4), o = [caja(dx1 - dx0, 3, 3, dm, dy0 + 1.5, zz, marco), caja(dx1 - dx0, 3, 3, dm, dy1 - 1.5, zz, marco), caja(3, dy1 - dy0, 3, dx0 + 1.5, (dy0 + dy1) / 2, zz, marco), caja(3, dy1 - dy0, 3, dx1 - 1.5, (dy0 + dy1) / 2, zz, marco),
        caja(dx1 - dx0 - 4, 3, 2.4, dm, dy0 + 26, zz, marco), mesh(new THREE.PlaneGeometry(dx1 - dx0 - 4, dy1 - dy0 - 33), vi, dm, (dy0 + 28 + dy1) / 2, zz - sd * 0.2).rotateY(sd < 0 ? PI : 0),
        caja(dx1 - dx0 - 4, 24, 1.4, dm, dy0 + 13, zz, te), caja(10, 2.4, 3.2, dx0 + 8, dy0 + 34, zz + sd * 2.4, mn), caja(2, 2.4, 3, dx0 + 3, dy0 + 34, zz + sd * 1.6, mn)];
      for (const y of [dy0 + 8, dy1 - 8]) o.push(cil('y', 1, 1, 7, dx1 - 1, y, zz + sd * 1.6, ac, 8));
      o.push(entre(V(dx1 - 2, dy1 - 18, zz + sd * 2), V(dx1 - 2, dy1 - 38, sd * (z + 14)), 0.8, marco), caja(2, 18, 12, dx1 - 2, dy1 - 44, sd * (z + 16), te));   // espejo
      return o;
    };
    const fijos = [-1, 1].map(sd => mesh(new THREE.PlaneGeometry(dx0 - xa - 10, yt - yb - 56), vi, (xa + dx0 + 2) / 2, (yb + 44 + yt - 12) / 2, sd * (z - 3.5)).rotateY(sd < 0 ? PI : 0));
    fijos.push(mesh(new THREE.PlaneGeometry(2 * z - 10, yt - yb - 26), vi, xb - 2, (yb + yt - 18) / 2, 0).rotateY(PI / 2));                      // parabrisas
    fijos.push(mesh(new THREE.PlaneGeometry(2 * z - 10, yt - yb - 70), vi, xa + 2, (yb + 60 + yt - 10) / 2, 0).rotateY(-PI / 2));                // luneta
    add('cab_puertas', [[puerta(-1), V(0, 200, -200)], [puerta(1), V(0, 200, 200)], [fijos, V(0, 260, 0)]]);
  }
  {   // peldaños: dos escalones y pasamanos al lado izquierdo, delante de la rueda trasera
    const ne = A.oscuro('#222629'), ac = st('#8b9198'), xs = cabX1 - 30, zl = -(cw + 12);
    const y1 = cabY0 * 0.38, y2 = cabY0 * 0.72, g = [];
    for (const y of [y1, y2]) g.push(caja(34, 3, 24, xs, y, zl, ne), caja(34, 1.2, 1.2, xs, y + 1.6, zl - 12, ac));
    g.push(caja(3, cabY0 - y1 + 6, 3, xs - 14, (cabY0 + y1) / 2 - 2, -cw - 2, ne), caja(3, cabY0 - y1 + 6, 3, xs + 14, (cabY0 + y1) / 2 - 2, -cw - 2, ne), caja(30, 2, 12, xs, cabY0 - 4, -cw - 6, ne));
    g.push(entre(V(xs + 17, y1 + 8, zl - 6), V(xs + 17, cabY0 + 54, -cw - 6), 1.4, ac, 10));       // pasamanos
    add('cab_peldanos', [[g, V(0, -40, -160)]]);
  }
  {   // filtro de aire de la cabina: caja bajo el techo con cartucho plisado y rejilla de toma
    const yt = D.cab, cx = L.cab.x - 60, cy = yt - 22, f = A.oscuro('#2a2c2f'), pa = mat('#e6e2d3', { roughness: 0.9 });
    add('cab_filtro_aire', [[[cajaR(30, 12, 22, 2, cx, cy, 0, f), fundir(Array.from({ length: 12 }, (_, i) => caja(1, 8, 17, cx - 12 + i * 2.2, cy - 0.2, 0, pa)), pa), cajaR(30, 1.2, 22, 0.5, cx, cy - 6.6, 0, A.oscuro('#14161a')),
      pernos(4, 0, 0.1, 0.1, 'y', cx, cy, 0, f), ...[-1, 1].map(sd => cil('x', 0.9, 0.9, 6, cx, cy + 6.5, sd * 8, f, 8))], V(0, 200, -60)]]);
  }
  {   // luces de trabajo (4) y baliza
    const hs = A.oscuro('#1a1b1d'), luz = mat('#f4f1e6', { emissive: '#000' }), amb = mat('#f39c12', { emissive: '#000' }), yt = D.cab, xa = cabX0, xb = cabX1, z = cw;
    const g = [];
    for (const sd of [-1, 1]) for (const x of [xa + 10, xb - 6]) g.push(cajaR(8, 6, 10, 1, x, yt + 3, sd * (z - 14), hs), caja(1, 4.2, 7.4, x + 4.2, yt + 3, sd * (z - 14), luz), entre(V(x - 2, yt, sd * (z - 14)), V(x - 2, yt + 6, sd * (z - 14)), 0.7, hs, 6));
    const bz = [cil('y', 5, 6, 2, xa + 40, yt + 1, 0, hs, 18), mesh(new THREE.SphereGeometry(5, 14, 10, 0, PI * 2, 0, PI / 2), amb, xa + 40, yt + 2, 0), cil('y', 1.4, 1.4, 5, xa + 40, yt + 4, 0, hs, 8)];
    add('ele_luces', [[g, V(0, 260, 0)], [bz, V(0, 280, 0)]]);
  }

  // ================= PUESTO DE MANDO =================
  const ne = A.oscuro('#1a1b1d'), ac = mat('#7a8088', { metalness: 0.7 }), v = L.volante;
  const pcol = V(v.x + 2, v.y, 0), pbase = L.orbitrol.clone(), dcol = pcol.clone().sub(pbase).normalize();
  {   // dash: base de consola con tablero de instrumentos
    const g = [cajaR(16, 40, 30, 2, v.x + 22, cabY0 + 20, 0, ne), cajaR(14, 16, 36, 2, v.x + 22, cabY0 + 52, 0, ne), caja(0.8, 12, 30, v.x + 14.6, cabY0 + 52, 0, mat('#0e1013', { metalness: 0.2, roughness: 0.3 }))];
    for (const zz of [-10, 0, 10]) g.push(cil('x', 3.4, 3.4, 0.8, v.x + 14.4, cabY0 + 54, zz, mat('#2a3138', { metalness: 0.5, roughness: 0.3 }), 20));
    for (let i = 0; i < 6; i++) g.push(caja(0.8, 1.6, 3, v.x + 14.4, cabY0 + 47, -12 + i * 4.8, mat(i % 3 ? '#d0a020' : '#c0392b', { emissive: '#000' })));
    for (let i = 0; i < 5; i++) g.push(caja(1.4, 2, 3, v.x + 14.4, cabY0 + 36, -10 + i * 5, ac));
    add('cab_tablero', [[g, V(40, 140, 0)]]);
  }
  {   // columna y volante de dirección
    const vg = new THREE.Group(), pm = A.oscuro('#2a2c2f');
    vg.add(mesh(new THREE.TorusGeometry(19, 1.6, 10, 32), ne));
    for (let i = 0; i < 3; i++) { const a = i * 2 * PI / 3 + PI / 2; vg.add(entre(V(0, 0, 0), V(Math.cos(a) * 18, Math.sin(a) * 18, 0), 1, ne, 8)); }
    vg.add(cil('z', 3.8, 3.8, 3.5, 0, 0, 0, ne, 14), cil('z', 2.8, 2.8, 1, 0, 0, 2, pm, 14));
    poner(vg, dcol, v.x, v.y, 0);
    const g = [vg, entre(pbase.clone().addScaledVector(dcol, 8), pcol.clone().addScaledVector(dcol, -4), 2.2, st('#8b9198'), 12), entre(pbase.clone().addScaledVector(dcol, 22), pcol.clone().addScaledVector(dcol, -14), 3.8, pm, 14),
      cil3(pbase.clone().addScaledVector(dcol, 30).add(V(0, 0, 0)), pbase.clone().addScaledVector(dcol, 32), 4.4, ac), entre(pcol.clone().addScaledVector(dcol, -16).add(V(0, 0, 3)), pcol.clone().addScaledVector(dcol, -16).add(V(-8, 0, 12)), 0.8, ac, 6)];
    add('dir_columna', [[g, V(40, 120, 0)]]);
  }
  {   // orbitrol: cuerpo, tapa del gerotor, pernos y cuatro conexiones
    const f = A.fundicion('#4f565d'), sm = st('#c3c8ce'), g = new THREE.Group();
    g.add(cil('z', 6, 6, 12, 0, 0, 0, f, 24), cil('z', 6.6, 6.6, 3, 0, 0, 7, A.fundicion('#5d636a'), 24), cil('z', 5.6, 5.6, 2, 0, 0, -7, f, 24), pernos(6, 5.2, 0.55, 1.4, 'z', 0, 0, 8.8, sm), cil('z', 1.8, 1.8, 6, 0, 0, -10, sm, 12));
    for (let i = 0; i < 4; i++) { const a = i * PI / 2 + 0.4, p = cil('x', 1.3, 1.3, 4, 0, 0, 0, st('#7e858c'), 8); p.position.set(Math.cos(a) * 7.6, Math.sin(a) * 7.6, -2 + (i % 2) * 3); p.rotation.z = a; g.add(p); }
    poner(g, dcol, pbase.x, pbase.y, 0);
    add('dir_orbitrol', [[[g], V(50, 100, 0)]]);
  }
  {   // válvula de prioridad de la dirección
    const c = V(cabX1 + 6, 92, -14), f = A.fundicion('#5d636a'), sm = st('#c3c8ce');
    add('dir_prioridad', [[[cajaR(16, 10, 10, 1.5, c.x, c.y, c.z, f), cil('x', 3.2, 3.2, 5, c.x - 10, c.y, c.z, A.oscuro('#2a2c2f'), 14), cil('x', 3.2, 3.2, 5, c.x + 10, c.y, c.z, A.oscuro('#2a2c2f'), 14), entre(V(c.x - 14, c.y, c.z), V(c.x - 12.6, c.y, c.z), 2.4, sm, 10),
      ...[-4, 0, 4].map(dx => cil('y', 1.4, 1.4, 4, c.x + dx, c.y + 6.5, c.z, sm, 8)), cil('z', 1.3, 1.3, 4, c.x + 4, c.y, c.z - 6.5, sm, 8), cil('z', 1.3, 1.3, 4, c.x - 4, c.y, c.z - 6.5, sm, 8)], V(40, -40, -60)]]);
  }
  {   // bombas de freno y pedales (dos pedales de freno con trabador, bomba en tándem, depósito)
    const pm = A.oscuro('#2a2c2f'), f = A.fundicion('#5d636a'), dep = mat('#d0b060', { transparent: true, opacity: 0.8 }), g = [];
    for (const sd of [-1, 1]) {
      const zz = sd * 9;
      g.push(caja(10, 2, 7, v.x + 12, cabY0 + 6, zz, ac), entre(V(v.x + 11, cabY0 + 6, zz), V(v.x + 8, cabY0 + 36, zz), 1.3, pm, 8), entre(V(v.x + 9, cabY0 + 24, zz), V(v.x + 13, cabY0 + 24, zz), 0.7, st('#c3c8ce'), 6),
        cil('x', 2.2, 2.2, 10, v.x + 18, cabY0 + 24, zz, f, 14), cil('y', 2.4, 2.4, 6, v.x + 20, cabY0 + 28, zz, dep, 12));
    }
    g.push(caja(3, 2, 22, v.x + 9, cabY0 + 12, 0, ac));
    add('fr_bombas', [[g, V(40, 80, 0)]]);
  }
  {   // mandos que quedan: palanca del cargador, palancas de la retro y pedal del acelerador
    const g = [entre(V(v.x - 10, cabY0 + 30, 34), V(v.x - 10, cabY0 + 60, 34), 1.2, ac), mesh(new THREE.SphereGeometry(3.4, 12, 10), ne, v.x - 10, cabY0 + 62, 34), caja(14, 30, 10, v.x - 10, cabY0 + 15, 34, ne)];
    for (const sd of [-1, 1]) g.push(entre(V(cabX0 + 30, cabY0 + 38, sd * 30), V(cabX0 + 24, cabY0 + 66, sd * 28), 1.2, ac), mesh(new THREE.SphereGeometry(3.4, 12, 10), ne, cabX0 + 24, cabY0 + 68, sd * 28), caja(20, 38, 12, cabX0 + 30, cabY0 + 19, sd * 30, ne));
    g.push(caja(8, 2, 6, v.x + 12, cabY0 + 6, 22, ac));
    add('mandos', [[g, V(30, 100, 0)]]);
  }

  ctx.pendientes();   // placeholders para los ids del contrato que aún no tienen geometría (no borrar)
}
