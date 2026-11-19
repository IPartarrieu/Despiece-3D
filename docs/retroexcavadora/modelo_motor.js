// Módulo MOTOR de la retroexcavadora (propietario: agente de motor). Contrato: contrato.json (modulo «motor»); guía: CONTRATO.md.
// Unidades cm; +x hacia el cargador (adelante), +y arriba, +z lado derecho del operador. Cilindros 1..4 de adelante hacia atrás.
// Eje del cigüeñal en y = yC. Pila trasera (x relativo a mX0): volante -1,5..2,5; brida del cigüeñal 2,5..4,5; caja del volante 2,5..12,8;
// retén trasero 8,4..11,4; caja de engranajes 12,8..16; bloque desde 16. Pila delantera (x relativo a mX1): bloque hasta -9; bomba de aceite -9..-6;
// tapa delantera -6..-4; retén -4..-2,4; polea -1,5..2; acople y bomba hidráulica desde +2 (volumen libre |y - yC| < 6, |z| < 6).
// Simplificaciones: 2 válvulas por cilindro (NEF F4GE) en los 4 modelos; bielas dibujadas en PMS/PMI (verticales); engranaje de la bomba de AP sobre un tren de 3.
// Pendiente de layout (no es de este módulo): K.fanC.y = yC + 30 deja las aspas (R 24,5) unos 4 cm sobre el techo del capó.
import * as THREE from 'three';

export default function (ctx) {
  const { THREE, PI, V, mat, mesh, rev, entre, caja, cajaR, tubo, fundir, A, D, K, L, add, ligar, col, pint, cil3, cabX1, cw, mX0, mX1, yC, xcM, kM, piezas, punto } = ctx;
  const has = id => piezas.some(e => e.id === id), exp = Object.fromEntries(piezas.map(e => [e.id, V(...e.explosion)]));
  const reg = (id, objs, shell = false) => add(id, [[objs, exp[id] || V(0, 50, 0)]], shell);
  // ---------- helpers locales ----------
  const cx = (x0, x1, y, z, r, m, sg = 20) => entre(V(x0, y, z), V(x1, y, z), r, m, sg);
  const cy = (y0, y1, x, z, r, m, sg = 20) => entre(V(x, y0, z), V(x, y1, z), r, m, sg);
  const cz = (z0, z1, x, y, r, m, sg = 20) => entre(V(x, y, z0), V(x, y, z1), r, m, sg);
  const anX = (ri, ro, x0, x1, y, z, m, sg = 32) => rev([[ri, 0], [ro, 0], [ro, x1 - x0], [ri, x1 - x0], [ri, 0]], 'x', m, sg, x0, y, z);
  const anY = (ri, ro, y0, y1, x, z, m, sg = 32) => rev([[ri, 0], [ro, 0], [ro, y1 - y0], [ri, y1 - y0], [ri, 0]], 'y', m, sg, x, y0, z);
  const gear = (x0, x1, y, z, r, n, m) => {
    const o = [cx(x0, x1, y, z, r - 0.45, m, 24)], tw = PI * r / n * 0.9;
    for (let i = 0; i < n; i++) { const a = i / n * PI * 2, t = caja(x1 - x0, 0.9, tw, (x0 + x1) / 2, y + r * Math.cos(a), z + r * Math.sin(a), m); t.rotation.x = a; o.push(t); }
    return fundir(o, m);
  };
  const ac = (c = '#8b9198') => mat(c, { metalness: 0.7, roughness: 0.35 }), fu = (c = '#4b5157') => A.fundicion(c), os = (c = '#202326') => A.oscuro(c);
  const alu = () => mat('#b9bec5', { metalness: 0.65, roughness: 0.5 }), bro = () => mat('#b0793a', { metalness: 0.8, roughness: 0.35 }), gom = () => A.goma();
  const papel = c => mat(c, { metalness: 0, roughness: 0.9 });

  // ---------- medidas del motor (comparten los 4 modelos; escalan con kM, mX0, mX1) ----------
  const k = kM, p = (mX1 - 14 - (mX0 + 21)) / 3, xi = i => mX1 - 14 - i * p, sg = [1, -1, -1, 1];
  const rC = 3.2, rodL = 11, deck = yC + 17.5 * k, T0 = deck + 14.6, zB = 19.5, yMid = deck + 7.6;
  const bx0 = mX0 + 16, bx1 = mX1 - 9, bxc = (bx0 + bx1) / 2, bL = bx1 - bx0;
  const mains = [[mX0 + 16.9, 2], ...[0, 1, 2].map(i => [(xi(i) + xi(i + 1)) / 2, 3.4]), [mX1 - 9.4, 2.6]];
  const pinY = i => yC + sg[i] * rC, smY = i => pinY(i) + rodL, crownY = i => smY(i) + 2.6;
  const tapaL = bL * 0.8, tapaT = T0 + 9, cabV = D.grill - 14;

  // ================= BLOQUE (motor, shell) =================
  {
    const bl = fu(), b = [cajaR(bL, 47.5 * k, 2 * zB, 3, bxc, yC - 6.25 * k, 0, bl)];
    for (const [x] of mains) b.push(caja(3, 12, 2 * zB + 2, x, yC - 24 * k, 0, bl));
    for (let i = 0; i < 4; i++) b.push(anY(4.3, 5.7, deck, deck + 0.8, xi(i), 0, bl, 24));   // collares de los cilindros (integrados al bloque)
    b.push(caja(bL * 0.7, 5, 3, bxc, yC + 4, zB + 1.2, bl), caja(bL * 0.7, 5, 3, bxc, yC + 4, -zB - 1.2, bl));   // refuerzos laterales
    add('motor', [[b, V(0, 70, 0)]], true);
  }
  // ================= CARTER, CHUPADOR, SOPORTES =================
  {
    const c = fu('#3a3e43'), yT = yC - 30 * k, yB = yC - 52 * k, xcc = bxc, lc = bL * 0.9, o = [];
    o.push(caja(lc + 3, 1.6, 2 * 16.5 + 3, xcc, yT - 0.8, 0, c), caja(lc, 1.6, 33, xcc, yB + 0.8, 0, c));
    o.push(caja(lc, yT - yB, 1.4, xcc, (yT + yB) / 2, 16.5, c), caja(lc, yT - yB, 1.4, xcc, (yT + yB) / 2, -16.5, c), caja(1.4, yT - yB, 33, xcc - lc / 2, (yT + yB) / 2, 0, c), caja(1.4, yT - yB, 33, xcc + lc / 2, (yT + yB) / 2, 0, c));
    o.push(cy(yB - 1.8, yB, xcc - 10, 0, 1.7, os('#2a2d31'), 6), cy(yB, yB + 0.1, xcc - 10, 0, 0.1, ac()));
    reg('motor_carter', o);
    if (has('lub_chupador')) {
      const m = ac('#9aa0a7');
      reg('lub_chupador', [tubo([V(xcc + 12, yT, 0), V(xcc + 14, yT - 6 * k, 0), V(xcc + 8, yB + 5, 0)], 1.1, m), cy(yB + 3.2, yB + 5, xcc + 8, 0, 4, m, 20), cy(yB + 2.4, yB + 3.2, xcc + 8, 0, 4.4, os('#5b6066'), 20),
        caja(lc * 0.7, 0.8, 24, xcc, yB + 9, 0, m), caja(4, 4, 3, xcc + 12, yT - 2, 0, m)]);
    }
    if (has('motor_soportes')) {
      const g = gom(), s = fu('#3a3e43'), o2 = [];
      for (const dx of [-24, 24]) for (const sd of [-1, 1]) { const x = bxc + dx;
        o2.push(caja(14, 5, 8, x, yC - 27 * k, sd * 23.5, s), cy(yC - 33 * k, yC - 29.5 * k, x, sd * 24, 3.2, g, 14), caja(16, 2.4, 12, x, yC - 34.2 * k, sd * 24, ac('#6b7077'))); }
      reg('motor_soportes', o2);
    }
  }
  // ================= CIGÜEÑAL, COJINETES, BIELAS, PISTONES =================
  {
    const m = ac('#9aa0a7'), o = [cx(mX0 + 2.5, mX1 + 1.2, yC, 0, 2.65, m, 20), anX(0, 7.2, mX0 + 2.5, mX0 + 4.5, yC, 0, m, 32), cx(mX0 + 4.5, mX0 + 16, yC, 0, 3.6, m, 20)];
    for (let i = 0; i < 4; i++) { const x = xi(i), s = sg[i];
      o.push(cx(x - 1.5, x + 1.5, yC + s * rC, 0, 2.2, m, 18));
      for (const dx of [-2.2, 2.2]) o.push(caja(1.4, 9.2, 5.2, x + dx, yC + s * 0.9, 0, m), cx(x + dx - 0.7, x + dx + 0.7, yC - s * 1.5, 0, 3.5, m, 18)); }
    reg('cig_ciguenal', [fundir(o, m)]);
    const b = bro(), q = ac('#7d8790'), r = [], r2 = [];
    for (const [x, w] of mains) { r.push(anX(2.65, 3.4, x - w / 2, x + w / 2, yC, 0, b, 28), caja(w + 2.2, 4, 8, x, yC - 5.4, 0, q));
      for (const z of [-3, 3]) r2.push(cy(yC - 8.4, yC - 7.4, x, z, 0.9, q, 6)); }
    const [xa, wa] = mains[2]; for (const s of [-1, 1]) r.push(anX(2.65, 4.6, xa + s * (wa / 2 + 0.25) - 0.25, xa + s * (wa / 2 + 0.25) + 0.25, yC, 0, b, 28));
    reg('cig_cojinetes_bancada', [fundir(r, b), fundir(r2, q)]);
    reg('cig_cojinetes_biela', [fundir([0, 1, 2, 3].map(i => anX(2.2, 2.7, xi(i) - 1.4, xi(i) + 1.4, pinY(i), 0, b, 24)), b)]);
    for (let i = 0; i < 4; i++) {
      const x = xi(i), yb = pinY(i), ys = smY(i), mr = ac('#7d8790'), mp = alu(), cr = crownY(i);
      const rod = [anX(2.7, 3.8, x - 1.5, x + 1.5, yb, 0, mr, 24), anX(1.3, 2.1, x - 1.4, x + 1.4, ys, 0, mr, 18), caja(2, ys - yb - 4.2, 3, x, (yb + ys) / 2 + 0.3, 0, mr), caja(2.8, 1.2, 4.6, x, yb + 3.4, 0, mr),
        cy(yb - 4.6, yb - 2.2, x, 2.2, 0.5, mr, 6), cy(yb - 4.6, yb - 2.2, x, -2.2, 0.5, mr, 6)];
      reg('cig_biela_' + (i + 1), [fundir(rod, mr)]);
      const body = rev([[0, 0], [4.3, 0], [4.3, -5.6], [3.7, -5.6], [3.7, -2], [0, -2]], 'y', mp, 24, x, cr, 0);
      const rings = fundir([-0.7, -1.3, -1.9].map(d => { const t = mesh(new THREE.TorusGeometry(4.3, 0.26, 5, 24), mr, x, cr + d, 0); t.rotation.x = PI / 2; return t; }), ac('#6f757c'));
      reg('cig_piston_' + (i + 1), [body, rings, cx(x - 3.8, x + 3.8, ys, 0, 1.3, ac('#d3d7dc'), 14)]);
    }
  }
  // ================= VOLANTE, CAJA DEL VOLANTE, RETÉN TRASERO, ENGRANAJES =================
  {
    const m = fu('#5c6066'), x0 = mX0 - 1.5, o = [rev([[3.6, 0], [25, 0], [25, 4], [20, 4], [20, 2.2], [8, 2.2], [8, 4], [3.6, 4], [3.6, 0]], 'x', m, 40, x0, yC, 0)], t = [];
    for (let i = 0; i < 72; i++) { const a = i / 72 * PI * 2, d = caja(2.4, 1.3, 0.9, x0 + 1.4, yC + 25.6 * Math.cos(a), 25.6 * Math.sin(a), m); d.rotation.x = a; t.push(d); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; t.push(cx(x0 - 0.5, x0 + 1, yC + 6 * Math.cos(a), 6 * Math.sin(a), 0.6, m, 6)); }
    if (has('cig_volante')) reg('cig_volante', [...o, fundir(t, m)]);
    if (has('motor_caja_volante')) {
      const c = fu('#454a50'), xa = mX0 + 2.5;
      reg('motor_caja_volante', [anX(28, 31, xa, mX0 + 12.8, yC, 0, c, 40), anX(8.6, 31, mX0 + 11.4, mX0 + 12.8, yC, 0, c, 40), cx(mX0 + 11.4, mX0 + 12.8, yC - 14, -24, 5.5, c, 18), caja(8, 3, 14, mX0 + 8, yC - 31, 0, c)], true);
    }
    const mm = ac('#9aa0a7'), g = os('#1b1c1e'), sl = ac('#c0c5cb'), xs = mX0 + 8.4;
    reg('reten_cig_tras', [anX(3.6, 4.1, mX0 + 5.5, mX0 + 10.2, yC, 0, sl, 28), anX(4.1, 5.4, xs, xs + 2, yC, 0, g, 28), anX(5.4, 8.4, xs, xs + 3, yC, 0, mm, 32),
      fundir([0, 1, 2, 3, 4, 5].map(i => { const a = i / 6 * PI * 2; return cx(xs, xs + 3.6, yC + 7 * Math.cos(a), 7 * Math.sin(a), 0.5, mm, 6); }), mm)]);
    // engranajes: cigüeñal (r 4,7) -> intermedio -> bomba de AP, y cigüeñal -> árbol de levas (2:1); caja con tapa trasera y reborde
    const yP = -4, zP = -26.5, d = Math.hypot(yP, zP), r1 = 4.7 + 8.5, r2 = 8.5 + 6.5, a = (d * d + r1 * r1 - r2 * r2) / (2 * d), h = Math.sqrt(r1 * r1 - a * a), ux = [yP / d, zP / d];
    const iy = a * ux[0] + h * ux[1] * -1, iz = a * ux[1] + h * ux[0];
    const gm = ac('#8b9198'), gx0 = mX0 + 13.2, gx1 = mX0 + 15.6;
    const gs = [gear(gx0, gx1, yC, 0, 4.7, 14, gm), gear(gx0, gx1, yC + 10, -10, 9.4, 28, gm), gear(gx0, gx1, yC + iy, iz, 8.5, 26, gm), gear(gx0, gx1, yC + yP, zP, 6.5, 20, gm)];
    const cc = fu('#454a50'), y0 = yC - 17, y1 = yC + 20.5, z0 = -34.5, z1 = zB, xr = mX0 + 12.8, xe = mX0 + 16;
    const cs = [caja(1.2, y1 - y0, z1 - z0, xr + 0.6, (y0 + y1) / 2, (z0 + z1) / 2, cc), caja(xe - xr, 1.2, z1 - z0, (xr + xe) / 2, y0, (z0 + z1) / 2, cc), caja(xe - xr, 1.2, z1 - z0, (xr + xe) / 2, y1, (z0 + z1) / 2, cc),
      caja(xe - xr, y1 - y0, 1.2, (xr + xe) / 2, (y0 + y1) / 2, z0, cc), caja(xe - xr, y1 - y0, 1.2, (xr + xe) / 2, (y0 + y1) / 2, z1, cc)];
    if (has('dist_engranajes')) reg('dist_engranajes', [...gs, ...cs]);
  }
  // ================= FRENTE: TAPA, RETÉN, BOMBA DE ACEITE, POLEA =================
  {
    const m = fu('#454a50'), xt = mX1 - 6, yB = yC - 30 * k, yTop = yC + 18;
    if (has('motor_tapa_del')) reg('motor_tapa_del', [caja(2, yTop - yB, 2 * zB, xt + 1, (yTop + yB) / 2, 0, m), anX(4.8, 6.3, mX1 - 4, mX1 - 2.4, yC, 0, m, 28), anX(0.1, 7.5, xt, xt + 2, yC, 0, m, 28),
      fundir([-1, 1].flatMap(s => [-1, 1].map(t => cx(xt + 2, xt + 3.2, yC + s * 14, t * 15, 0.7, m, 6))), m)]);
    if (has('reten_cig_del')) reg('reten_cig_del', [anX(2.7, 3.3, mX1 - 4.5, mX1 - 1.2, yC, 0, ac('#c0c5cb'), 28), anX(3.3, 4.8, mX1 - 4, mX1 - 2.4, yC, 0, os('#1b1c1e'), 28), anX(4.8, 5.1, mX1 - 4, mX1 - 2.4, yC, 0, ac('#6f757c'), 28)]);
    if (has('lub_bomba_aceite')) {
      const b = fu('#5c6066'), r = ac('#b9bec5'), o = [anX(5.6, 7.5, mX1 - 9, mX1 - 6, yC, 0, b, 28), anX(4.2, 5.6, mX1 - 8.6, mX1 - 6.4, yC, 0, r, 28), anX(0, 3.4, mX1 - 8.6, mX1 - 6.4, yC, 0, bro(), 24),
        ...[0, 1, 2, 3, 4, 5].map(i => { const a = i / 6 * PI * 2; return cx(mX1 - 8.6, mX1 - 6.4, yC + 3.4 * Math.cos(a), 3.4 * Math.sin(a), 0.9, r, 8); }), tubo([V(mX1 - 7.5, yC - 7, 0), V(mX1 - 8, yC - 14, 0), V(mX1 - 8, yC - 26 * k, 0)], 1.1, b), cy(yC + 7.5, yC + 11, mX1 - 7.5, 0, 1.2, b, 8)];
      reg('lub_bomba_aceite', o);
    }
    const hub = ac('#8b9198'), rub = gom(), ring = os('#2a2d31'), x0 = mX1 - 1.5, rib = [[10.8, 0]]; for (let i = 0; i < 6; i++) rib.push([13, i * 0.5833], [12.6, i * 0.5833 + 0.29]); rib.push([13, 3.5], [10.8, 3.5], [10.8, 0]);
    reg('cig_polea', [rev([[2.7, 0], [4.8, 0], [4.8, 3.5], [2.7, 3.5], [2.7, 0]], 'x', hub, 28, x0, yC, 0), anX(4.8, 9.2, x0, x0 + 1.2, yC, 0, hub, 32), anX(9.2, 10.8, x0, x0 + 3.5, yC, 0, rub, 32), rev(rib, 'x', ring, 48, x0, yC, 0)]);
  }
  // ================= CULATA Y DISTRIBUCIÓN =================
  {
    const cu = fu('#3a3e43'), yc0 = deck + 0.6, pa = pint();
    const cul = [cajaR(bL, 14, 2 * zB, 2, bxc, yMid, 0, cu)];
    for (let i = 0; i < 4; i++) cul.push(cz(zB - 0.1, zB + 2, xi(i), yMid, 3.4, cu, 12), cz(-zB - 2, -zB + 0.1, xi(i), yMid, 3.4, cu, 12));
    const pern = []; for (let j = 0; j < 5; j++) for (const s of [-1, 1]) pern.push(cy(T0, T0 + 0.7, mX0 + 20 + j * (bL - 8) / 4, s * 17, 0.9, cu, 6));
    cul.push(fundir(pern, cu));
    reg('motor_culata', cul);
    if (has('motor_junta_culata')) {
      const s = new THREE.Shape(); s.moveTo(-bL / 2, -zB); s.lineTo(bL / 2, -zB); s.lineTo(bL / 2, zB); s.lineTo(-bL / 2, zB); s.closePath();
      for (let i = 0; i < 4; i++) { const h = new THREE.Path(); h.absarc(xi(i) - bxc, 0, 4.3, 0, PI * 2, true); s.holes.push(h); }
      const g = new THREE.ExtrudeGeometry(s, { depth: 0.6, bevelEnabled: false, curveSegments: 20 }); g.rotateX(-PI / 2);
      reg('motor_junta_culata', [mesh(g, os('#6b5f3a'), bxc, deck, 0)]);
    }
    if (has('motor_tapa_valvulas')) {
      const t = pa, x = bxc, w = tapaL, o = [caja(w, 1.2, 30, x, tapaT, 0, t), caja(w, 9, 1.2, x, T0 + 4.5 + 0.5, 15, t), caja(w, 9, 1.2, x, T0 + 5, -15, t), caja(1.2, 9, 30, x - w / 2, T0 + 5, 0, t), caja(1.2, 9, 30, x + w / 2, T0 + 5, 0, t)];
      o.push(cy(tapaT, tapaT + 3, x + w / 2 - 8, 8, 2.8, os('#202326'), 16), anY(2.8, 3.2, tapaT + 3, tapaT + 3.6, x + w / 2 - 8, 8, os('#202326'), 16), cy(tapaT, tapaT + 3.5, x - w / 2 + 6, -9, 1.4, os('#202326'), 10));
      for (const s of [-1, 1]) for (let j = 0; j < 5; j++) o.push(cy(T0 + 5, T0 + 7, x - w / 2 + 3 + j * (w - 6) / 4, s * 16.2, 0.8, os('#202326'), 6));
      reg('motor_tapa_valvulas', o);
    }
    // válvulas (2 por cilindro: admisión z -6,5, escape z +6,5)
    const st = [], hd = [], rs = [], rt = [];
    for (let i = 0; i < 4; i++) for (const [dx, z] of [[-2.6, -6.5], [2.6, 6.5]]) {
      const x = xi(i) + dx; st.push(cy(yc0 + 1.2, T0 + 4.3, x, z, 0.45, ac(), 8));
      hd.push(cy(yc0 + 0.7, yc0 + 1.3, x, z, 2.1, ac('#c0c5cb'), 14)); rt.push(cy(T0 + 3.2, T0 + 3.7, x, z, 1.4, ac(), 10));
      for (let q = 0; q < 5; q++) { const t = mesh(new THREE.TorusGeometry(1.45, 0.22, 5, 12), ac(), x, T0 + 0.5 + q * 0.6, z); t.rotation.x = PI / 2; rs.push(t); }
    }
    if (has('dist_valvulas')) reg('dist_valvulas', [fundir(st, ac()), fundir(hd, ac('#c0c5cb')), fundir(rt, ac('#6f757c')), fundir(rs, ac('#c9a227'))]);
    // balancines: eje (z -8,2), brazos y varillas desde los taqués del árbol de levas (z -10)
    if (has('dist_balancines')) {
      const m = ac('#6f757c'), ar = [], vr = [], yA = T0 + 4.8;
      ar.push(cx(bxc - tapaL / 2 + 2, bxc + tapaL / 2 - 2, yA, -8.2, 1.1, m, 10));
      for (let i = 0; i < 4; i++) {
        ar.push(caja(1.6, 1.6, 3.6, xi(i) - 2.6, yA, -8.2, m)); ar.push(caja(1.6, 1.6, 15, xi(i) + 2.6, yA, -1.7, m));
        vr.push(cy(yC + 16.7, yA - 0.2, xi(i) - 2.6, -10, 0.45, m, 6), cy(yC + 16.7, yA - 0.2, xi(i) + 2.6, -10, 0.45, m, 6));
      }
      reg('dist_balancines', [fundir(ar, m), fundir(vr, ac('#8b9198'))]);
    }
    // árbol de levas y taqués (y yC+10, z -10)
    if (has('dist_arbol_levas')) {
      const m = ac('#8b9198'), ll = [], tq = [], cy0 = yC + 10, o = [cx(mX0 + 13.2, bx1 - 1, cy0, -10, 1.5, m, 14), anX(0, 2.4, mX0 + 13.2, mX0 + 15.6, cy0, -10, m, 14)];
      for (let i = 0; i < 4; i++) for (const dx of [-2.6, 2.6]) { const l = cx(xi(i) + dx - 0.9, xi(i) + dx + 0.9, cy0 + 0.5, -10, 2.0, m, 16); l.scale.set(1, 1, 1); ll.push(l); tq.push(cy(cy0 + 2.4, yC + 16.7, xi(i) + dx, -10, 0.9, ac('#6f757c'), 8)); }
      for (let j = 0; j < 4; j++) o.push(anX(1.5, 2.1, mX0 + 20 + j * 19.3 - 4.5, mX0 + 20 + j * 19.3 - 2.9, cy0, -10, bro(), 12));
      reg('dist_arbol_levas', [...o, fundir(ll, m), fundir(tq, ac('#6f757c'))]);
    }
  }
  // ================= INYECTORES, RIEL, HAZ =================
  {
    const yi = T0 + 10.5, ba = ac('#9aa0a7'), cn = os('#17191b'), o = [], t = [], cl = [];
    for (let i = 0; i < 4; i++) { const x = xi(i); o.push(cy(deck + 1.2, yi - 3, x, 0, 1.2, ba, 12), cy(yi - 3, yi, x, 0, 1.7, cn, 12), caja(5, 1.2, 2.2, x, T0 + 2, 0, ba), cy(deck + 0.4, deck + 1.2, x, 0, 0.6, ac('#c0c5cb'), 8)); }
    if (has('comb_inyectores')) reg('comb_inyectores', [fundir(o.filter((_, n) => n % 4 !== 1), ba), fundir(o.filter((_, n) => n % 4 === 1), cn)]);
    if (has('comb_riel')) {
      const m = ac('#8b9198'), yr = yi + 3, r = [cx(xi(3) - 3, xi(0) + 4, yr, -6, 1.6, m, 14), caja(3, 3, 3, xi(0) + 5.5, yr, -6, os('#202326'))];
      for (let i = 0; i < 4; i++) r.push(tubo([V(xi(i), yr, -6), V(xi(i), yr - 1.2, -3.5), V(xi(i), yi + 0.8, -0.8)], 0.5, m));
      r.push(tubo([V(xi(3) - 3, yr, -6), V(mX0 + 13.5, T0 + 9, -20), V(mX0 + 13.2, yMid, -37), V(mX0 + 20, yC + 8, -33), V(mX0 + 27, yC + 1, -30)], 0.55, m));
      reg('comb_riel', r);
    }
    if (has('ele_arnes')) {
      const g = gom(), e = [caja(16, 11, 4.5, xcM, yC + 8, 22, os('#2b2e33')), caja(14, 2, 5, xcM, yC + 14, 22, ac('#6f757c'))], zl = 5, yh = yi - 1;
      const lz = tubo([V(xcM, yC + 14, 22), V(xcM + 5, yC + 18, 20.8), V(xcM + 5, T0 + 2, 20.8), V(xcM + 5, T0 + 9, 16), V(xcM + 5, yh, 8)], 1.0, g);
      e.push(lz, tubo([V(xi(3), yh, zl), V(xcM + 5, yh, 8), V(xi(0), yh, zl)], 0.8, g));
      for (let i = 0; i < 4; i++) e.push(tubo([V(xi(i), yh, zl), V(xi(i), yi - 0.6, 0.8)], 0.35, g));
      e.push(tubo([V(xcM, yC + 4, 22), V(mX1 - 18, yC + 12, 21), V(mX1 - 14, yC + 8, 26)], 0.9, g), tubo([V(xcM, yC + 4, 22), V(mX0 + 20, yC + 3, 21), V(mX0 + 28, yC - 8, -18)], 0.7, g));
      reg('ele_arnes', e);
    }
  }
  // ================= ADMISIÓN, MÚLTIPLES, TURBO =================
  const tx = mX0 + 19.5, ty = yMid, tz = 40, xch = mX0 + 28;
  {
    const m = fu('#4b5157'), pl = [caja(bL * 0.8, 9.5, 1.2, bxc, yMid, -22.1, m), cx(xi(3) - 4, xi(0) + 4, yMid, -27, 5.5, m, 20), cx(xi(3) - 4.3, xi(3) - 3.4, yMid, -27, 6.4, ac('#6f757c'), 20)];
    for (let i = 0; i < 4; i++) pl.push(cz(-26, -21.5, xi(i), yMid, 2.6, m, 12));
    pl.push(tubo([V(xch, yC + 31, 40), V(xch, yC + 40, 40), V(xch, yC + 50, 34), V(xch, yC + 53, 20), V(xch, yC + 53, -10), V(xch, yC + 48, -18), V(xch, yC + 36, -24), V(xch, yMid + 5, -27)], 3, A.goma()));
    if (has('adm_multiple')) reg('adm_multiple', pl);
    const em = ac('#6d5a4a'), ex = [caja(bL * 0.8, 9.5, 1.2, bxc, yMid, 22.1, em), cx(tx - 5, xi(0) + 3, yMid, 27, 4.5, em, 18)];
    for (let i = 0; i < 4; i++) ex.push(cz(21.5, 26, xi(i), yMid, 2.4, em, 12));
    ex.push(tubo([V(tx, yMid, 27), V(tx, yMid, 33), V(tx, ty, 36)], 3.4, em));
    if (has('esc_multiple')) reg('esc_multiple', ex);
    if (has('esc_egr')) {
      const x0 = xcM + 6, c = ac('#7d8790'), egr = [cx(x0 - 14, x0 + 16, yMid + 9, 27, 3.5, c, 16), anX(3.5, 4, x0 - 8, x0 - 7, yMid + 9, 27, c, 16), caja(8, 7, 8, x0 + 20, yMid + 9, 27, os('#2b2e33')), cy(yMid + 12, yMid + 17, x0 + 20, 27, 1.8, ac('#9aa0a7'), 10),
        tubo([V(x0 + 14, yMid + 9, 27), V(x0 + 20, yMid + 3.5, 27), V(x0 + 22, yMid + 3, 24)], 1.2, ac('#9aa0a7'))];
      for (let i = 0; i < 9; i++) egr.push(anX(3.5, 4.1, x0 - 12 + i * 3, x0 - 11.4 + i * 3, yMid + 9, 27, c, 16));
      reg('esc_egr', egr);
    }
    if (has('adm_turbo')) {
      const tc = fu('#6d5a4a'), cc = ac('#9aa0a7'), cm = alu(), o = [], vo = rev([[0, 0], [8.2, 0], [8.2, 6], [0, 6]], 'x', tc, 28, tx - 3, ty, tz);
      o.push(vo, rev([[0, 0], [8.2, 0], [4, -5], [3.2, -8], [0, -8]], 'x', tc, 24, tx - 3, ty, tz), anX(3.2, 3.9, tx - 11, tx - 8, ty, tz, tc, 16), cx(tx + 3, tx + 8, ty, tz, 4.2, cc, 18), anX(0, 4.6, tx + 3, tx + 3.6, ty, tz, cc, 18));
      o.push(rev([[0, 0], [8.8, 0], [8.8, 5.5], [0, 5.5]], 'x', cm, 28, tx + 8, ty, tz), rev([[0, 0], [8.8, 0], [4.6, 5.5], [4.6, 9], [0, 9]], 'x', cm, 24, tx + 13.5, ty, tz), anX(4.2, 4.9, tx + 21, tx + 23, ty, tz, cm, 16));
      o.push(cy(ty + 8.3, ty + 11, xch, tz, 3.4, cm, 14), caja(4, 4, 4, tx + 9, ty - 6.5, tz + 5, os('#2b2e33')), cx(tx + 9, tx + 15, ty - 6.5, tz + 5, 1, ac(), 8), tubo([V(tx + 5, ty + 4, tz), V(tx + 8, ty + 10, 30), V(tx + 12, yC + 14, 21)], 0.5, ac('#c0c5cb')));
      reg('adm_turbo', o);
    }
  }
  // ================= LUBRICACIÓN Y COMBUSTIBLE (costado izquierdo) =================
  {
    const xo = xcM;
    if (has('lub_filtro_aceite')) { const f = pint(), b = ac('#6f757c');
      reg('lub_filtro_aceite', [cz(-20, -21.8, xo, yC - 14, 6.2, b, 20), cz(-21.8, -35.4, xo, yC - 14, 5.5, f, 24), cz(-35.4, -36, xo, yC - 14, 4.8, os('#2a2d31'), 20), fundir([0, 1, 2, 3, 4, 5].map(i => { const a = i / 6 * PI * 2; return cz(-33.5, -35.4, xo + 5.5 * Math.cos(a), yC - 14 + 5.5 * Math.sin(a), 0.35, f, 4); }), f)]); }
    if (has('lub_enfriador')) { const m = ac('#7d8790'), o = [caja(24, 8, 1.2, xo, yC - 4, -22, m), caja(24, 8, 1.2, xo, yC - 4, -30, m)];
      for (let i = 0; i < 9; i++) o.push(caja(1.4, 8, 6.8, xo - 10 + i * 2.5, yC - 4, -26, ac('#a7b0b8')));
      o.push(cz(-30, -31.5, xo - 9, yC - 4, 1.4, m, 8), cz(-30, -31.5, xo + 9, yC - 4, 1.4, m, 8)); reg('lub_enfriador', o); }
    if (has('lub_varilla')) { const m = ac('#c0c5cb'), xv = xo - 10;
      reg('lub_varilla', [tubo([V(xv, yC - 30 * k, -17), V(xv, yC - 22, -20.8), V(xv, yC + 12, -20.8)], 0.9, m), cy(yC - 20, yC + 14.5, xv, -20.8, 0.25, ac('#6f757c'), 6), (() => { const t = mesh(new THREE.TorusGeometry(1.2, 0.3, 6, 14), os('#c9a227'), xv, yC + 16, -20.8); t.rotation.y = PI / 2; return t; })()]); }
    if (has('comb_bomba_ap')) { const m = ac('#8b9198'); const x0 = mX0 + 16, y = yC - 4, z = -26.5;
      reg('comb_bomba_ap', [cx(x0, x0 + 15, y, z, 4.8, m, 20), cx(x0 + 15, x0 + 17, y, z, 3.5, ac('#6f757c'), 16), anX(2, 3.5, x0, x0 + 1.4, y, z, os('#202326'), 16), cy(y + 4.8, y + 7, x0 + 12, z, 1.4, m, 8), cy(y + 4.8, y + 6, x0 + 8, z, 1.8, os('#2b2e33'), 10), cz(z - 4.8, z - 7, x0 + 12, y, 1.3, m, 8)]); }
    const yh = yC + 9.5, zf = -34.5;
    if (has('comb_filtros')) { const f = pint(), b = ac('#6f757c'), xs = mX0 + 37, xf = mX0 + 47.5;
      reg('comb_filtros', [caja(24, 3, 12, (xs + xf) / 2, yh, zf + 1, b), caja(8, 3, 17, xs - 3, yh, zf + 8, b), cy(yC - 7, yh - 1.5, xs, zf, 4.2, f, 20), cy(yC - 7, yh - 1.5, xf, zf, 4.2, f, 20), cy(yC - 9, yC - 7, xs, zf, 3, ac('#a9c9d8'), 14),
        cy(yC - 9.8, yC - 9, xs, zf, 1.2, os('#2b2e33'), 8), cy(yh + 1.5, yh + 4, xs, zf, 1.2, b, 8), cy(yh + 1.5, yh + 4, xf, zf, 1.2, b, 8), caja(3, 2, 2, xs + 4.5, yC + 2, zf, os('#2b2e33'))]); }
    if (has('comb_cebado')) { const m = ac('#9aa0a7'), x = mX0 + 28;
      reg('comb_cebado', [cy(yC + 4, yC + 9, x, -26, 2.4, m, 12), cy(yC + 9, yC + 12.5, x, -26, 1.2, os('#2b2e33'), 10), cy(yC + 12.5, yC + 14, x, -26, 2, os('#2b2e33'), 12), caja(3, 3, 3, x + 2, yC + 6, -28.5, m)]); }
    if (has('comb_lineas')) {
      const tc = punto('L.tanqueC'), g = A.manguera(), m = ac('#9aa0a7'), x0 = tc.x + 20, y0 = 84;
      reg('comb_lineas', [tubo([V(x0, y0, tc.z), V(x0 + 18, y0 + 4, tc.z + 6), V(mX0 + 20, y0 + 18, -44), V(mX0 + 34, yh + 4, -38), V(mX0 + 37, yh + 1.8, zf)], 0.9, g),
        tubo([V(x0, y0 + 6, tc.z + 4), V(x0 + 20, y0 + 10, tc.z + 8), V(mX0 + 22, y0 + 24, -46), V(mX0 + 30, yC + 18, -42), V(mX0 + 36, yh + 1, -26)], 0.8, g),
        tubo([V(mX0 + 37, yh + 1.8, zf + 4), V(mX0 + 36, yC + 4, -30), V(mX0 + 32, yC - 2, -28)], 0.7, m), tubo([V(mX0 + 47.5, yh + 1.8, zf), V(mX0 + 40, yC + 20, -42), V(mX0 + 24, yC + 12, -36)], 0.7, g)]);
    }
    if (has('ele_arranque')) {
      const m = ac('#6f757c'), y = yC - 14, z = -24, o = [cx(mX0 - 0.5, mX0 + 13, y, z, 2.8, m, 14), cx(mX0 - 0.5, mX0 + 2.5, y, z, 1.4, ac('#c0c5cb'), 10), cx(mX0 + 12.8, mX0 + 14.3, y, z, 5.4, m, 20), cx(mX0 + 14.3, mX0 + 30, y, z, 4.8, os('#2b2e33'), 20), cx(mX0 + 16, mX0 + 30, y - 7.4, z, 3.2, m, 14), cx(mX0 + 30, mX0 + 31.5, y, z, 4.8, m, 20), cy(y - 10, y - 8.5, mX0 + 28, z, 1, ac('#c9a227'), 6)];
      reg('ele_arranque', o);
    }
  }
  // ================= FRENTE: BOMBA DE AGUA, ALTERNADOR, CORREA, TERMOSTATO =================
  {
    const wy = yC + 30, ay = yC + 8, az = 28, xp = mX1 + 0.25, pm = ac('#8b9198');
    const cuerpo = fu('#5c6066'), pp = [cx(mX1 - 9, mX1 - 3.2, wy, 0, 6.5, cuerpo, 24), cx(mX1 - 3.2, mX1 - 1.8, wy, 0, 3, cuerpo, 16), cx(mX1 - 3.2, mX1 + 3, wy, 0, 1.2, pm, 10),
      rev([[0, 0], [5.5, 0], [5.5, 0.4], [5.1, 0.7], [5.5, 1.0], [5.1, 1.3], [5.5, 1.6], [5.1, 1.9], [5.5, 2.2], [5.1, 2.5], [5.5, 3.5], [0, 3.5]], 'x', pm, 28, mX1 - 1.5, wy, 0), cx(mX1 + 2, mX1 + 3, wy, 0, 3.5, pm, 14),
      cy(wy - 6.5, wy - 10, mX1 - 7, 0, 2.6, cuerpo, 14), anY(2.6, 3.4, wy - 10.4, wy - 10, mX1 - 7, 0, cuerpo, 14), cz(0, 7, mX1 - 6, wy + 4, 2.4, cuerpo, 12)];
    reg('enf_bomba_agua', pp);
    if (has('ele_alternador')) {
      const al = ac('#7d8790'), o = [cx(mX1 - 15, mX1 - 11, ay, az, 7.2, os('#2b2e33'), 24), cx(mX1 - 11, mX1 - 6, ay, az, 7.5, al, 28), cx(mX1 - 6, mX1 - 2, ay, az, 7.2, os('#2b2e33'), 24), cx(mX1 - 2, mX1 - 1.5, ay, az, 2.2, pm, 10),
        rev([[0, 0], [4.2, 0], [4.2, 3.5], [0, 3.5]], 'x', pm, 24, mX1 - 1.5, ay, az), caja(4, 3, 4, mX1 - 13, ay + 7.6, az + 2, os('#202326')), caja(8, 2, 6, mX1 - 8, ay + 5, az - 8, ac('#6f757c')), caja(8, 2, 6, mX1 - 8, ay + 8, az + 6, ac('#6f757c'))];
      for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; o.push(cx(mX1 - 11, mX1 - 6, ay + 7.6 * Math.cos(a), az + 7.6 * Math.sin(a), 0.4, ac('#4b5157'), 5)); }
      reg('ele_alternador', o);
    }
    if (has('enf_termostato')) {
      const m = ac('#9aa0a7'), xt = xcM + 30.5, yy = T0 + 3;
      reg('enf_termostato', [caja(6.4, 6, 10, xt, yy, 0, m), cy(yy + 3, yy + 5.5, xt + 0.5, 0, 3.2, m, 14), cx(xt - 1, xt + 3.2, yy + 5, 0, 0.1, m, 4), cz(0, -5, xt, yy + 2, 2.6, m, 12), caja(1, 6, 6, xt + 3.4, yy - 3.5, 2, m), cy(yy + 3, yy + 6, xt - 1.8, 3, 0.7, ac('#c9a227'), 6)]);
    }
    if (has('enf_correa')) {
      // correa: envolvente convexa de los 4 círculos (cigüeñal, bomba de agua, tensor, alternador) en el plano (y, z)
      const ten = [yC + 26, 20], pul = [[yC, 0, 12.7], [wy, 0, 5.7], [ten[0], ten[1], 4.2], [ay, az, 4.4]], pts = [];
      for (const [y, z, r] of pul) for (let a = 0; a < 48; a++) { const t = a / 48 * PI * 2; pts.push([y + r * Math.cos(t), z + r * Math.sin(t)]); }
      const hull = (P) => { const s = [...P].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), h = [];
        for (const q of s) { while (h.length >= 2 && cr(h[h.length - 2], h[h.length - 1], q) <= 0) h.pop(); h.push(q); }
        const lo = h.length + 1; for (let i = s.length - 2; i >= 0; i--) { const q = s[i]; while (h.length >= lo && cr(h[h.length - 2], h[h.length - 1], q) <= 0) h.pop(); h.push(q); } h.pop(); return h; };
      const ho = hull(pts.map(([y, z]) => [y, z])), cxm = pul.reduce((s, q) => s + q[0], 0) / 4, czm = pul.reduce((s, q) => s + q[1], 0) / 4;
      const hi = ho.map(([y, z]) => { const d = Math.hypot(y - cxm, z - czm); return [y - (y - cxm) / d * 0.5, z - (z - czm) / d * 0.5]; });
      const sh = new THREE.Shape(ho.map(([y, z]) => new THREE.Vector2(-z, y))), hl = new THREE.Path(hi.map(([y, z]) => new THREE.Vector2(-z, y))); sh.holes.push(hl);
      const g = new THREE.ExtrudeGeometry(sh, { depth: 3, bevelEnabled: false }); g.rotateY(PI / 2);
      const o = [mesh(g, gom(), xp - 1.5, 0, 0)];
      // tensor: brazo, resorte y polea; polea guía sobre la caja
      o.push(rev([[0, 0], [4.2, 0], [4.2, 3.2], [0, 3.2]], 'x', pm, 24, xp - 1.6, ten[0], ten[1]), caja(2, 4, 4, xp - 4.4, ten[0] - 2, ten[1] + 1, os('#2b2e33')), caja(3, 3, 10, mX1 - 6.5, ten[0] - 4, ten[1] - 1, os('#2b2e33')),
        cy(ten[0] - 6, ten[0] - 16, mX1 - 6.5, ten[1] - 4, 1.6, ac('#c9a227'), 10), cx(xp - 5, xp - 1.5, ten[0], ten[1], 1.2, pm, 8));
      reg('enf_correa', o);
    }
  }
  // ================= RADIADOR, VENTILADOR, ENFRIADORES, DEPÓSITO, MANGUERAS =================
  {
    const nu = mat('#7d8790', { metalness: 0.6, roughness: 0.45 }), ta = os('#2b2e33'), al = mat('#a7b0b8', { metalness: 0.7, roughness: 0.4 }), nucleo = lienzoAletas();
    const rx = cabV, c = K.fanC, cy0 = yC + 12, ch = 68, core = mesh(new THREE.BoxGeometry(6, ch, 62), mat('#8a949c', { map: nucleo, metalness: 0.5, roughness: 0.5 }), rx, cy0, 0);
    // carcasa del ventilador: tubo abierto en el arco inferior (180° - 74°) para dejar paso al acople y la bomba hidráulica (H1)
    const rs = 26, ab = 1.3, sg0 = new THREE.CylinderGeometry(rs, rs, 14, 32, 1, true, PI / 2 + ab, PI * 2 - 2 * ab); sg0.rotateZ(-PI / 2);
    const shroud = mesh(sg0, ta, rx - 13, c.y, c.z);
    add('radiador', [[[core, caja(8, 8, 66, rx, cy0 + ch / 2 + 4, 0, ta), caja(8, 8, 66, rx, cy0 - ch / 2 - 4, 0, ta), caja(2.5, 52, 58, rx + 4.5, cy0 - 2, 0, al), cy(cy0 + ch / 2 + 8, cy0 + ch / 2 + 11.5, rx, 18, 2.6, ta, 14), cy(cy0 + ch / 2 + 11.5, cy0 + ch / 2 + 12.5, rx, 18, 3.2, al, 14),
      shroud, caja(1.6, 6, 62, rx - 6.8, cy0 - ch / 2 + 2, 0, ta)], V(120, 30, 0)]]);
    const ex = 4.5;   // sin colisión con la carcasa (x < rx - 6)
    if (has('enf_enfriador_hid')) { const m = mat('#8a949c', { metalness: 0.5, roughness: 0.5 }), o = [caja(0.8, 22, 18, rx - 4.4, yC + 2, -20, m), caja(0.8, 22, 18, rx - 6.8, yC + 2, -20, m)];
      for (let i = 0; i < 8; i++) o.push(caja(1.6, 0.5, 18, rx - 5.6, yC - 8 + i * 2.8, -20, ac('#a7b0b8')));
      o.push(cz(-29, -33, rx - 5.6, yC + 8, 1.2, ac(), 8), cz(-29, -33, rx - 5.6, yC - 4, 1.2, ac(), 8)); reg('enf_enfriador_hid', o); }
    if (has('enf_enfriador_trans')) { const o = [caja(1.2, 11, 24, rx - 4.6, yC - 17.5, 0, mat('#8a949c', { metalness: 0.5, roughness: 0.5 })), caja(1.2, 11, 24, rx - 6.6, yC - 17.5, 0, mat('#8a949c', { metalness: 0.5, roughness: 0.5 }))];
      for (let i = 0; i < 5; i++) o.push(caja(1.6, 0.5, 24, rx - 5.6, yC - 21 + i * 2.2, 0, ac('#a7b0b8')));
      o.push(cz(12, 16, rx - 5.6, yC - 15, 1.2, ac(), 8), cz(12, 16, rx - 5.6, yC - 20, 1.2, ac(), 8)); reg('enf_enfriador_trans', o); }
    if (has('enf_deposito')) { const m = mat('#cbd2d8', { metalness: 0.05, roughness: 0.4 }), z = 31, x = D.grill - 26, y = yC + 36;
      reg('enf_deposito', [caja(12, 18, 8, x, y, z, m), caja(12.4, 1.5, 8.4, x, y + 9.5, z, os('#2b2e33')), cy(y + 10.3, y + 12, x, z, 1.6, os('#c9a227'), 10), caja(12.2, 0.4, 8.2, x, y - 3, z, A.oscuro('#a14a2f')), tubo([V(x + 4, y - 7, z - 3), V(rx - 4, y - 14, z - 4), V(rx - 4, cy0 + ch / 2 + 2, 22)], 0.9, A.manguera())]); }
    if (has('enf_mangueras')) { const g = A.goma();
      reg('enf_mangueras', [tubo([V(xcM + 30.5, T0 + 6, -2), V(mX1 - 6, yC + 40, -14), V(mX1 + 4, yC + 44, -26), V(rx - 7, yC + 46, -26), V(rx, cy0 + ch / 2 + 2, -20)], 2.6, g),
        tubo([V(rx - 2, cy0 - ch / 2 - 2, -16), V(mX1 + 8, yC - 10, -16), V(mX1 - 5, yC + 14, -16), V(mX1 - 7.5, yC + 22, -6), V(mX1 - 7, yC + 24, 0)], 2.6, g)]);
    }
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
  // ================= FILTRO DE AIRE (carcasa + elementos), ESCAPE, POSTRATAMIENTO =================
  {
    const hy = yC + 46, hz = -26, x0 = mX0 + 34, x1 = mX0 + 74, f = os('#2a2d31'), tp = mat('#c9a227');
    const sg0 = new THREE.CylinderGeometry(8.5, 8.5, x1 - x0 - 6, 28, 1, true); sg0.rotateZ(-PI / 2);
    const o = [mesh(sg0, f, (x0 + x1 - 6) / 2 - 0, hy, hz), anX(0.1, 8.5, x0 - 2, x0, hy, hz, f, 28), anX(0, 9.2, x1 - 6, x1 - 4, hy, hz, f, 28), anX(4.4, 9.4, x1 - 4, x1 - 2.4, hy, hz, tp, 28), cx(x1 - 2.4, x1 - 1, hy, hz, 5, f, 20),
      cy(hy - 8.5, hy - 12, x0 + 12, hz, 1.8, A.goma(), 10), caja(5, 2, 3, x0 + 24, hy + 9.5, hz, mat('#c0392b')), tubo([V(x0 + 8, hy + 8, hz), V(x0 + 6, hy + 14, hz)], 1.2, f)];
    for (const dz of [-6, 6]) o.push(caja(10, 2, 5, x0 + 10, hy - 9.4, hz + dz * 1.2, f));
    o.push(tubo([V(x1 - 1, hy, hz), V(mX0 + 80, yC + 48, -14), V(mX0 + 82, yC + 46, 14), V(mX0 + 66, yC + 44, 36), V(mX0 + 50, yC + 30, 40), V(tx + 22, ty, tz)], 3.2, A.goma()));
    add('filtro_aire', [[o, V(0, 110, -70)]]);
    const xe0 = x0 + 1.5, le = 32, ep = [], mp = papel('#d9c9a3'), cp = os('#17191b');
    if (has('adm_elem_primario')) {
      ep.push(anX(3.2, 8.0, xe0, xe0 + le, hy, hz, mp, 28), anX(3.2, 8.2, xe0 - 0.4, xe0, hy, hz, cp, 28), anX(3.2, 8.2, xe0 + le, xe0 + le + 0.4, hy, hz, cp, 28));
      for (let i = 0; i < 28; i++) { const a = i / 28 * PI * 2, t = caja(le, 1.2, 0.3, xe0 + le / 2, hy + 8.4 * Math.cos(a), hz + 8.4 * Math.sin(a), mp); t.rotation.x = a; ep.push(t); }
      reg('adm_elem_primario', [fundir(ep.slice(0, 1).concat(ep.slice(3)), mp), fundir(ep.slice(1, 3), cp)]);
    }
    if (has('adm_elem_secundario')) { const ms = papel('#ece8de'); reg('adm_elem_secundario', [anX(1.4, 2.9, xe0 + 3, xe0 + 3 + 26, hy, hz, ms, 24), anX(1.4, 3.1, xe0 + 2.6, xe0 + 3, hy, hz, cp, 24), anX(1.4, 3.1, xe0 + 29, xe0 + 29.4, hy, hz, cp, 24)]); }
  }
  {
    const ac1 = mat('#7a7f86', { metalness: 0.8, roughness: 0.35 }), ne = os('#1c1d20'), ex = mX0 - 22, ey = yC + 45, ez = 26;
    const dpf = has('esc_dpf') || has('esc_scr'), xr = mX0 + 8, xf = mX0 - 14, o = [];
    o.push(tubo([V(tx - 10, ty, tz), V(tx - 12, yC + 34, 36), V(xr + 2, yC + 44, ez + 2), V(xr, ey, ez)], 3.2, ac1));
    if (!dpf) o.push(cx(xf, xr, ey, ez, 3.2, ac1, 14));
    o.push(cx(ex - 0.5, xf, ey, ez, 3.2, ac1, 14), cy(ey - 8, ey + 2, ex, ez, 8, ac1, 24), anY(0.1, 8, ey + 2, ey + 2.6, ex, ez, ac1, 24), cy(ey + 2, D.esc - 3, ex, ez, 4.5, ne, 16), cy(D.esc - 3, D.esc, ex, ez, 5.4, ne, 16));
    for (let i = 0; i < 3; i++) o.push(anY(8, 8.5, ey - 7 + i * 4, ey - 6.4 + i * 4, ex, ez, ac1, 24));
    add('escape', [[o, V(40, 130, 60)]]);
    if (has('esc_dpf') || has('esc_scr')) {
      const id = has('esc_dpf') ? 'esc_dpf' : 'esc_scr', c = ac('#9aa0a7'), cb = os('#2b2e33'), q = [cx(xf, xr, ey, ez, 7.4, c, 24), anX(7.4, 8, xf + 8, xf + 8.6, ey, ez, cb, 24), anX(7.4, 8, xf + 16, xf + 16.6, ey, ez, cb, 24), cx(xf - 1, xf, ey, ez, 5, c, 16), cx(xr, xr + 2, ey, ez, 5, c, 16)];
      q.push(cy(ey + 7.4, ey + 10, xf + 12, ez, 1.1, ac('#c0c5cb'), 8), tubo([V(xf + 4, ey - 7, ez + 2), V(xf + 3, ey - 14, ez + 5), V(xf - 2, yC + 30, 34)], 0.5, ac()));
      if (id === 'esc_scr') q.push(caja(5, 5, 5, xf + 4, ey + 8.4, ez, cb), tubo([V(xf + 4, ey + 8.4, ez), V(xf + 2, ey + 12, 12)], 0.7, A.manguera()));
      reg(id, q);
    }
    if (has('esc_urea')) { const tc = punto('L.tanqueC'), m = mat('#1f4f8a', { metalness: 0.1, roughness: 0.6 });
      reg('esc_urea', [cajaR(26, 28, 22, 4, tc.x, tc.y + 40, tc.z, m), cy(tc.y + 54, tc.y + 57, tc.x - 6, tc.z, 3, mat('#1d6fd1'), 14), caja(6, 1.5, 6, tc.x + 6, tc.y + 54.8, tc.z, ac()), tubo([V(tc.x + 6, tc.y + 40, tc.z + 11), V(tc.x + 12, tc.y + 40, tc.z + 16), V(mX0 - 10, yC + 38, 20)], 0.8, A.manguera())]); }
  }
  // ================= BATERÍA Y ESTANQUE (existentes) =================
  {
    const cj = os('#202225'), x = cabX1 + 22;
    add('bateria', [[[caja(28, 24, 18, x, 62, 54, cj), caja(30, 2, 20, x, 75, 54, mat('#3b3f44')), entre(V(x - 8, 75, 50), V(x - 8, 79, 50), 1.6, mat('#c0392b')), entre(V(x + 8, 75, 50), V(x + 8, 79, 50), 1.6, mat('#222'))], V(0, -10, 110)]]);
  }
  {
    const t = os('#2a2d31'), x = 70, xl = Math.min(cabX1 - 4, D.wb - D.fr - 12) - x;
    add('tanque_comb', [[[cajaR(xl, 54, 26, 5, x + xl / 2, 70, -(cw - 4), t), caja(xl + 6, 3, 30, x + xl / 2, 100, -(cw - 2), mat('#5b6066', { metalness: 0.6 })),
      entre(V(x + 10, 97, -(cw + 2)), V(x + 10, 104, -(cw + 2)), 4.5, mat('#111')), caja(xl - 6, 2, 22, x + xl / 2, 58, -(cw + 10), mat('#5b6066', { metalness: 0.6 }))], V(0, -20, -120)]]);
  }

  ctx.pendientes();   // placeholders para los ids del contrato que aún no tienen geometría (no borrar)
}

function lienzoAletas() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d');
  g.fillStyle = '#6f7880'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#3d444b'; for (let i = 0; i < 64; i += 4) g.fillRect(0, i, 64, 1.5);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 6); return t;
}
