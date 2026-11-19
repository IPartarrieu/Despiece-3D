// Módulo «fuente» del PC de torre: fuente ATX 3.x y su interior (marco 'fuente': el PCB queda ARRIBA y los componentes cuelgan hacia el ventilador).
// Dueño: un solo agente. Lista, anclajes, explosiones y fuentes en contrato.json (filtra modulo = 'fuente'); guía en CONTRATO.md.
// 37 piezas:
//   Fuente de poder · Carcasa y ventilación: psu_carcasa, psu_tapa, psu_ventilador, psu_aislante
//   Fuente de poder · Entrada y filtro EMI: psu_entrada_iec, psu_fusible, psu_emi_x, psu_emi_y, psu_emi_bobinas, psu_mov, psu_ntc_rele
//   Fuente de poder · Primario: rectificación y PFC: psu_puente, psu_disipador_primario, psu_pfc_bobina, psu_pfc_mosfets, psu_pfc_diodo, psu_pfc_controlador, psu_bulk
//   Fuente de poder · Primario: conversión LLC: psu_llc_mosfets, psu_llc_controlador, psu_llc_bobina, psu_llc_condensador, psu_transformador, psu_optoacopladores
//   Fuente de poder · Standby 5VSB: psu_5vsb_trafo, psu_5vsb_controlador
//   Fuente de poder · Secundario y salida: psu_rect_sinc, psu_disipador_secundario, psu_cond_salida, psu_dcdc, psu_dcdc_mosfets, psu_dcdc_bobinas, psu_dcdc_controlador, psu_supervisor, psu_placa_principal, psu_placa_modular, psu_conectores_modulares
// Marco 'fuente': a = largo desde la cara trasera (0..16), b = ancho (±7,5), c = hacia ABAJO desde la cara de componentes del PCB (0..8,3).
// Distribución (supuesta, inspirada en una plataforma CWT): entrada y EMI atrás, primario al centro (disipador a b≈1, bulk a b≈5), transformador
// y standby a b<0, secundario con su disipador en a≈13,7, DC-DC en una hija vertical a b≈-5 y la placa modular vertical en a≈15,5.
export default function (ctx) {
  const { THREE, V, PI, mat, mesh, cil, caja, cajaEn, entre, tubo, fundir, en, A, add, giros, lienzo, alambre } = ctx;
  const P = (a, b, c) => en('fuente', a, b, c);
  const M0 = mat('#000');                                                  // material comodín: solo se usa la geometría al fundir
  const bx = (a0, a1, b0, b1, c0, c1) => cajaEn('fuente', [a0, a1], [b0, b1], [c0, c1], M0);
  const ce = (a0, b0, c0, a1, b1, c1, r, s = 14) => entre(P(a0, b0, c0), P(a1, b1, c1), r, M0, s);
  const cv = (a, b, c0, c1, r, s = 16) => ce(a, b, c0, a, b, c1, r, s);   // cilindro con eje c
  const ca = (a0, a1, b, c, r, s = 14) => ce(a0, b, c, a1, b, c, r, s);   // eje a
  const cb = (a, b0, b1, c, r, s = 14) => ce(a, b0, c, a, b1, c, r, s);   // eje b
  const F = (...pares) => pares.filter(([, l]) => l.length).map(([m, l]) => fundir(l, m));
  const add1 = (id, objs) => add(id, [[objs]]);
  // lámina rectangular a x b (centro a0,b0) con agujeros [x,y,r] (x a lo largo de a, y = -b), entre c0 y c1
  const lamina = (a0, b0, w, h, c0, c1, agujeros, m) => {
    const s = new THREE.Shape(); s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, h / 2); s.lineTo(-w / 2, h / 2); s.closePath();
    for (const [x, y, r] of agujeros) { const p = new THREE.Path(); p.absarc(x, y, r, 0, PI * 2, true); s.holes.push(p); }
    const g = new THREE.ExtrudeGeometry(s, { depth: Math.abs(c1 - c0), bevelEnabled: false, curveSegments: 20 }); g.rotateX(-PI / 2);
    return mesh(g, m, ...P(a0, b0, Math.max(c0, c1)).toArray());
  };
  // toroide de eje c (vertical) o eje b; arc parcial para el bobinado
  const toro = (a, b, c, R, r, arc = PI * 2, rot = 0, vert = true, tub = 24) => {
    const g = new THREE.TorusGeometry(R, r, 8, tub, arc); g.rotateZ(rot); if (vert) g.rotateX(-PI / 2);
    return mesh(g, M0, ...P(a, b, c).toArray());
  };
  const bobinado = (a, b, c, R, r, n, vert = true) => Array.from({ length: n }, (_, i) => toro(a, b, c, R, r + 0.07, (PI * 2 / n) * 0.62, i * PI * 2 / n, vert, 5));
  const cobreAlambre = () => { const t = alambre(); t.repeat.set(1, 3); return mat('#ffffff', { map: t, metalness: 0.7, roughness: 0.35 }); };
  // chip SOIC/DIP: cuerpo + patas (np patas, mitad por lado) a lo largo de a
  const chip = (a, b, w, d, c0, h, np, pl, me) => {
    pl.push(bx(a - w / 2, a + w / 2, b - d / 2, b + d / 2, c0, c0 + h));
    const k = np / 2; for (let i = 0; i < k; i++) for (const s of [-1, 1]) { const x = a - w / 2 + (i + 0.5) * w / k; me.push(bx(x - 0.04, x + 0.04, b + s * (d / 2 + 0.06) - 0.07, b + s * (d / 2 + 0.06) + 0.07, c0 + h * 0.15, c0 + h * 0.4)); }
  };
  // dispositivo TO-220/TO-247 con tornillo; mp(u, n) -> [a, b]; n crece alejándose del disipador; patas desde cLeg
  const to = (mp, u, n0, cLeg, pl, me) => {
    const B = (u0, u1, n_0, n_1, c0, c1) => { const [a0, b0] = mp(u0, n_0), [a1, b1] = mp(u1, n_1); return bx(a0, a1, b0, b1, c0, c1); };
    const W = 0.85, T = 0.45, HB = 1.7, h = W / 2;
    me.push(B(u - h, u + h, n0, n0 + 0.1, cLeg + 0.9, cLeg + 0.9 + HB));
    pl.push(B(u - h, u + h, n0 + 0.1, n0 + 0.1 + T, cLeg + 0.9, cLeg + 0.9 + HB * 0.72));
    for (const k of [-1, 0, 1]) me.push(B(u + k * 0.3 - 0.04, u + k * 0.3 + 0.04, n0 + 0.2, n0 + 0.28, cLeg, cLeg + 0.9));
    const [a0, b0] = mp(u, n0 + 0.1), [a1, b1] = mp(u, n0 + 0.3), c = cLeg + 0.9 + HB - 0.2;
    me.push(entre(P(a0, b0, c), P(a1, b1, c), 0.2, M0, 10));
  };
  // textura de etiqueta de condensador electrolítico
  const tex = (fondo, tinta, t1, t2, franja) => lienzo(128, 256, (g, w, h) => {
    g.fillStyle = fondo; g.fillRect(0, 0, w, h); g.fillStyle = franja; g.fillRect(w * 0.82, 0, w * 0.18, h);
    g.fillStyle = tinta; g.font = 'bold 30px sans-serif'; g.fillText(t1, 6, h * 0.45); g.font = '22px sans-serif'; g.fillText(t2, 6, h * 0.62);
  });
  const sleeve = (t) => mat('#ffffff', { map: t, metalness: 0.15, roughness: 0.55 });
  const mp0 = (u, n) => [u, 1.35 + n];       // dispositivos del primario: disipador en b 1,0..1,35, hacia +b
  const mpS = (u, n) => [13.65 - n, u];      // dispositivos del secundario: disipador en a 13,65..14,0, hacia -a

  // ---------------- Carcasa y ventilación ----------------
  {
    const l = [];
    l.push(bx(0, 16, -7.5, 7.5, -0.45, -0.2), bx(0, 16, -7.5, -7.4, -0.45, 8.2), bx(0, 16, 7.4, 7.5, -0.45, 8.2));
    // cara trasera: marco, hueco de la entrada IEC y rejilla de listones
    l.push(bx(0, 0.12, 6.2, 7.4, -0.45, 8.2), bx(0, 0.12, 1.9, 6.2, -0.45, 1.7), bx(0, 0.12, 1.9, 6.2, 4.3, 8.2), bx(0, 0.12, -7.4, -7.1, -0.45, 8.2), bx(0, 0.12, 1.6, 1.9, -0.45, 8.2));
    for (let i = 0; i < 7; i++) l.push(bx(0, 0.12, -7.1, 1.6, 0.35 + i * 1.1, 0.35 + i * 1.1 + 0.5));
    // cara frontal con la abertura de la placa modular
    l.push(bx(15.88, 16, -7.4, -6.2, -0.45, 8.2), bx(15.88, 16, 6.2, 7.4, -0.45, 8.2), bx(15.88, 16, -6.2, 6.2, -0.45, 1.8), bx(15.88, 16, -6.2, 6.2, 6.2, 8.2));
    // pestañas de fijación y tornillos de la tapa superior
    for (const [a, b] of [[1.5, -6.6], [1.5, 6.6], [14.5, -6.6], [14.5, 6.6], [8, 6.6], [8, -6.6]]) l.push(cv(a, b, -0.55, -0.45, 0.22, 12));
    for (const b of [-7.2, 7.2]) l.push(bx(0.3, 0.7, b - 0.1, b + 0.1, 8.2, 8.6), bx(15.3, 15.7, b - 0.1, b + 0.1, 8.2, 8.6));
    const t = lienzo(512, 256, (g, w, h) => {
      g.fillStyle = '#e9e6dc'; g.fillRect(0, 0, w, h); g.fillStyle = '#14304f'; g.fillRect(0, 0, w, 54);
      g.fillStyle = '#ffffff'; g.font = 'bold 34px sans-serif'; g.fillText('ATX 3.x  850 W  80 PLUS GOLD', 18, 40);
      g.fillStyle = '#111'; g.font = '20px sans-serif'; g.fillText('INPUT 100-240 V~ 50-60 Hz 12-6 A', 18, 90);
      g.fillText('+3,3 V 24 A  +5 V 20 A  +12 V 70,8 A  +5VSB 3 A', 18, 125); g.fillText('REFERENCIAL - modular - 135 mm FDB', 18, 160); g.fillText('NO ABRIR: tensión peligrosa', 18, 205);
    });
    const et = mesh(new THREE.PlaneGeometry(9, 4.5), mat('#ffffff', { map: t, roughness: 0.7, metalness: 0 }), ...P(8, 0, -0.47).toArray()); et.rotation.x = -PI / 2;
    add('psu_carcasa', [[[...F([A.acero('#2b2e33'), l]), et]]]);
  }
  {
    const m = A.acero('#25282c'), l = [];
    l.push(lamina(8, 0, 15.7, 14.6, 8.2, 8.35, [[0, 0, 6.3]], m));
    const rings = [2.0, 3.4, 4.8, 6.1].map(R => toro(8, 0, 8.28, R, 0.06, PI * 2, 0, true, 40));
    for (let i = 0; i < 8; i++) { const th = i * PI / 4 + 0.2, s = caja(5.1, 0.1, 0.1, ...P(8 + Math.cos(th) * 3.65, Math.sin(th) * 3.65, 8.28).toArray(), M0); s.rotation.y = -th; rings.push(s); }
    rings.push(cv(8, 0, 8.22, 8.34, 1.1, 20));
    for (const [a, b] of [[1.2, -6.6], [1.2, 6.6], [14.8, -6.6], [14.8, 6.6]]) rings.push(cv(a, b, 8.35, 8.42, 0.25, 12));
    add1('psu_tapa', [...F([m, [...l, ...rings]])]);
  }
  {
    // marco 135 mm (item 0) y rotor (item 1)
    const m = A.plastico('#17181b'), c0 = 5.7, c1 = 8.2;
    const f = lamina(8, 0, 13.5, 13.5, c0, c1, [[0, 0, 6.4], ...[[-6.0, -6.0], [6.0, -6.0], [-6.0, 6.0], [6.0, 6.0]].map(([x, y]) => [x, y, 0.32])], m);
    const st = [cv(8, 0, 5.8, 7.0, 1.7, 20)];
    for (let i = 0; i < 4; i++) { const th = i * PI / 2 + PI / 4, s = caja(4.6, 0.1, 0.3, ...P(8 + Math.cos(th) * 4.1, Math.sin(th) * 4.1, 5.9).toArray(), M0); s.rotation.y = -th; st.push(s); }
    const rm = A.plastico('#101113'), bl = [cv(8, 0, 6.2, 8.0, 2.0, 24)];
    for (let i = 0; i < 9; i++) {
      const th = i * PI * 2 / 9, o = caja(3.9, 1.9, 0.09, 0, 0, 0, M0), p = P(8 + Math.cos(th) * 4.0, Math.sin(th) * 4.0, 7.0);
      o.rotation.set(0.5, -th, 0, 'YXZ'); o.position.copy(p); bl.push(o);
    }
    add('psu_ventilador', [[[fundir([f, ...st.slice(1)], m), fundir([st[0]], A.plastico('#22252b'))]], [[fundir(bl, rm)]]]);
    giros.push({ ids: ['psu_ventilador:1'], e: V(0, 1, 0), c: P(8, 0, 7), k: 2 });
  }
  {
    const m = mat('#d8b46a', { transparent: true, opacity: 0.35, depthWrite: false, metalness: 0, roughness: 0.4 });
    add1('psu_aislante', [lamina(8, 0, 14.4, 13.4, 5.5, 5.54, [[0, 0, 2.4]], m)]);
  }

  // ---------------- Entrada y filtro EMI ----------------
  {
    const pl = [], me = [], rj = [];
    pl.push(bx(1.1, 2.6, 3.6, 6.0, 2.0, 4.0), bx(0.12, 1.1, 3.3, 3.6, 1.8, 4.2), bx(0.12, 1.1, 6.0, 6.3, 1.8, 4.2), bx(0.12, 1.1, 3.3, 6.3, 1.7, 2.0), bx(0.12, 1.1, 3.3, 6.3, 4.0, 4.3));
    pl.push(bx(1.0, 1.15, 3.6, 6.0, 2.0, 4.0));                                         // fondo del hueco
    for (const [b, c] of [[4.0, 3.5], [5.6, 3.5], [4.8, 2.3]]) { me.push(bx(0.2, 1.05, b - 0.04, b + 0.04, c - 0.31, c + 0.31)); me.push(bx(2.6, 3.1, b - 0.05, b + 0.05, c - 0.2, c + 0.2)); }
    me.push(bx(0.12, 0.2, 1.9, 3.3, 1.8, 4.2));                                         // placa del interruptor
    pl.push(bx(0.2, 1.5, 2.0, 3.2, 2.1, 3.9));                                          // cuerpo del interruptor
    rj.push(bx(0.0, 0.45, 2.1, 3.1, 2.2, 3.0));                                          // basculante (rojo)
    add1('psu_entrada_iec', F([A.plastico('#111214'), pl], [A.niquel(), me], [A.plastico('#b3262a'), rj]));
  }
  {
    const pl = [], me = [], gl = [];
    gl.push(cb(2.8, 5.35, 6.85, 0.6, 0.26, 12)); me.push(cb(2.8, 5.0, 5.35, 0.6, 0.29, 12), cb(2.8, 6.85, 7.2, 0.6, 0.29, 12), cb(2.8, 5.35, 6.85, 0.6, 0.03, 6));
    for (const b of [5.2, 7.0]) { pl.push(bx(2.55, 3.05, b - 0.3, b + 0.3, 0.2, 0.95)); me.push(bx(2.7, 2.9, b - 0.05, b + 0.05, 0, 0.2)); }
    const g = mat('#cfe3e8', { transparent: true, opacity: 0.45, metalness: 0, roughness: 0.1 });
    add1('psu_fusible', [...F([A.plastico('#1c1d20'), pl], [A.niquel(), me]), ...F([g, gl])]);
  }
  {
    const pl = [], me = [];
    for (const a of [3.2, 4.6]) { pl.push(bx(a - 0.6, a + 0.6, 1.9, 3.3, 0.2, 1.8)); for (const b of [2.1, 3.1]) me.push(bx(a - 0.05, a + 0.05, b - 0.05, b + 0.05, 0, 0.2)); }
    add1('psu_emi_x', F([A.plastico('#c9792b'), pl], [A.niquel(), me]));
  }
  {
    const di = [], me = [];
    for (const [a, b] of [[2.4, -1.0], [2.4, -2.5], [3.4, -3.1]]) { di.push(ca(a - 0.15, a + 0.15, b, 0.9, 0.45, 18)); for (const s of [-1, 1]) me.push(cb(a, b + s * 0.2 - 0.02, b + s * 0.2 + 0.02, 0.3, 0.03, 6), bx(a - 0.02, a + 0.02, b + s * 0.2 - 0.02, b + s * 0.2 + 0.02, 0.1, 0.5)); }
    add1('psu_emi_y', F([A.plastico('#2f6ec2'), di], [A.niquel(), me]));
  }
  {
    const fe = [], cu = [], pl = [], R = 0.7, r = 0.4;
    for (const b of [3.5, 6.1]) { fe.push(toro(3.8, b, 1.3, R, r)); cu.push(...bobinado(3.8, b, 1.3, R, r, 12)); pl.push(bx(3.8 - 0.1, 3.8 + 0.1, b - 0.1, b + 0.1, 0, 0.3)); }
    add1('psu_emi_bobinas', [...F([A.ferrita(), fe], [cobreAlambre(), cu], [A.estano(), pl])]);
  }
  {
    const d = [ca(1.75, 2.2, 6.6, 0.9, 0.7, 20)], me = [bx(1.9, 2.0, 6.0, 6.1, 0, 0.3), bx(1.9, 2.0, 7.1, 7.2, 0, 0.3)];
    add1('psu_mov', F([A.plastico('#e0883a'), d], [A.niquel(), me]));
  }
  {
    const pl = [bx(5.9, 7.5, 6.15, 7.35, 0.25, 2.0)], me = [], di = [ca(5.2, 5.5, 6.8, 0.9, 0.45, 18)];
    for (const [a, b] of [[5.9, 6.4], [6.4, 6.4], [6.9, 6.4], [5.9, 7.1], [6.9, 7.1]]) me.push(bx(a - 0.04, a + 0.04, b - 0.04, b + 0.04, 0, 0.25));
    me.push(bx(5.3, 5.4, 6.5, 6.6, 0, 0.45), bx(5.3, 5.4, 7.0, 7.1, 0, 0.45));
    add1('psu_ntc_rele', [...F([A.plastico('#e5e1d5'), pl], [A.plastico('#262629'), di], [A.niquel(), me])]);
  }

  // ---------------- Primario: rectificación y PFC ----------------
  {
    const pl = [bx(4.1, 6.3, 1.5, 1.85, 0.5, 2.3)], me = [];
    for (const a of [4.4, 5.0, 5.6, 6.1]) me.push(bx(a - 0.05, a + 0.05, 1.6, 1.75, 0, 0.5));
    me.push(cb(5.2, 1.4, 1.5, 1.9, 0.2, 10), cb(5.2, 1.85, 1.95, 1.9, 0.2, 10));
    add1('psu_puente', F([A.plastico('#1a1b1e'), pl], [A.niquel(), me]));
  }
  {
    const al = [bx(7.6, 13.0, 1.0, 1.35, 0.3, 3.6)], me = [];
    for (let i = 0; i < 10; i++) { const a = 7.75 + i * 0.57; al.push(bx(a - 0.05, a + 0.05, 0.25, 1.0, 0.3, 3.6)); }
    al.push(bx(7.6, 7.9, 0.9, 1.4, 0, 0.3), bx(12.7, 13.0, 0.9, 1.4, 0, 0.3));
    add1('psu_disipador_primario', F([A.aluminio('#b9bec5'), al]));
  }
  {
    const fe = [toro(6.8, 4.8, 1.0, 1.1, 0.5, PI * 2, 0, true, 28)], cu = bobinado(6.8, 4.8, 1.0, 1.1, 0.5, 18), pl = [];
    for (const s of [-1, 1]) pl.push(bx(6.8 - 0.1 + s * 0.0, 6.9, 4.8 + s * 1.9 - 0.05, 4.8 + s * 1.9 + 0.05, 0, 0.5), cv(6.8 + s * 1.7, 4.8, 0, 0.35, 0.07, 6));
    add1('psu_pfc_bobina', [...F([mat('#d9cfa0', { metalness: 0.2, roughness: 0.7 }), fe], [cobreAlambre(), cu])]);
  }
  {
    const pl = [], me = []; for (const u of [8.5, 9.45]) to(mp0, u, 0, 0, pl, me);
    add1('psu_pfc_mosfets', F([A.plastico('#15161a'), pl], [A.niquel(), me]));
  }
  {
    const pl = [], me = []; to(mp0, 10.6, 0, 0, pl, me);
    add1('psu_pfc_diodo', F([A.plastico('#15161a'), pl], [A.niquel(), me]));
  }
  {
    const pl = [], me = []; chip(5, -2.6, 0.9, 0.65, 0, 0.3, 8, pl, me);
    add1('psu_pfc_controlador', F([A.encapsulado(), pl], [A.estano(), me]));
  }
  {
    const cap = (a, b) => {
      const s = [cv(a, b, 0.25, 4.55, 1.6, 20)], tp = [cv(a, b, 4.55, 4.62, 1.55, 20), bx(a - 1.0, a + 1.0, b - 0.03, b + 0.03, 4.62, 4.64), bx(a - 0.03, a + 0.03, b - 1.0, b + 1.0, 4.62, 4.64)];
      return { s, tp, g: [cv(a, b, 0.1, 0.25, 1.4, 20)], me: [cv(a, b + 0.6, 0, 0.2, 0.08, 6), cv(a, b - 0.6, 0, 0.2, 0.08, 6)] };
    };
    const cs = [cap(8.9, 5.2), cap(12.2, 5.2)];
    const t = tex('#1f4e9c', '#f2f2f2', '560µF 420V', 'BULK  105°C', '#d9d9d9');
    add1('psu_bulk', F([sleeve(t), cs.flatMap(c => c.s)], [A.aluminio('#c9ccd0'), cs.flatMap(c => c.tp)], [A.goma(), cs.flatMap(c => c.g)], [A.estano(), cs.flatMap(c => c.me)]));
  }

  // ---------------- Primario: conversión LLC ----------------
  {
    const pl = [], me = []; for (const u of [11.5, 12.45]) to(mp0, u, 0, 0, pl, me);
    add1('psu_llc_mosfets', F([A.plastico('#15161a'), pl], [A.niquel(), me]));
  }
  {
    const pl = [], me = []; chip(5, -4, 1.1, 0.7, 0, 0.3, 16, pl, me);
    add1('psu_llc_controlador', F([A.encapsulado(), pl], [A.estano(), me]));
  }
  {
    const fe = [toro(8, -1.5, 1.2, 0.65, 0.38)], cu = bobinado(8, -1.5, 1.2, 0.65, 0.38, 12), me = [];
    for (const s of [-1, 1]) me.push(cv(8 + s * 0.65, -1.5, 0, 0.8, 0.05, 6));
    add1('psu_llc_bobina', F([A.ferrita(), fe], [cobreAlambre(), cu], [A.estano(), me]));
  }
  {
    const pl = [bx(6.0, 7.2, -1.7, -0.7, 0.1, 1.6)], me = [bx(6.2, 6.3, -1.5, -1.4, 0, 0.1), bx(6.9, 7.0, -1.5, -1.4, 0, 0.1)];
    add1('psu_llc_condensador', F([A.plastico('#d6a02e'), pl], [A.niquel(), me]));
  }
  {
    // transformador principal: núcleo EE con el eje del bobinado sobre a
    const a0 = 9.2, a1 = 12.8, bc = -1.65, cc = 1.9, W = 3.3, D = 2.4, y = 0.45, rw = 1.0, fe = [], bo = [], cu = [], tp = [], pin = [];
    fe.push(bx(a0, a0 + y, bc - W / 2, bc + W / 2, cc - D / 2, cc + D / 2), bx(a1 - y, a1, bc - W / 2, bc + W / 2, cc - D / 2, cc + D / 2));
    for (const s of [-1, 1]) fe.push(bx(a0, a1, bc + s * (W / 2 - 0.25) - 0.25, bc + s * (W / 2 - 0.25) + 0.25, cc - D * 0.3, cc + D * 0.3));
    fe.push(ca(a0, a1, bc, cc, 0.5, 16));
    const f0 = a0 + y + 0.05, f1 = a1 - y - 0.05, mid = (f0 + f1) / 2;
    bo.push(ca(f0, f0 + 0.15, bc, cc, rw + 0.2, 20), ca(f1 - 0.15, f1, bc, cc, rw + 0.2, 20));
    cu.push(ca(f0 + 0.15, mid - 0.15, bc, cc, rw, 20), ca(mid + 0.15, f1 - 0.15, bc, cc, rw * 0.92, 20));
    tp.push(ca(mid - 0.15, mid + 0.15, bc, cc, rw + 0.05, 20));
    for (const a of [f0 + 0.1, f1 - 0.1]) for (const b of [bc - 0.9, bc - 0.3, bc + 0.3, bc + 0.9]) pin.push(cv(a, b, 0, cc - rw - 0.1, 0.06, 6));
    add1('psu_transformador', F([A.ferrita(), fe], [A.plastico('#b78a3a'), bo], [cobreAlambre(), cu], [A.plastico('#d8a02a'), tp], [A.estano(), pin]));
  }
  {
    const pl = [], me = []; for (const b of [-4.45, -4.75]) chip(8.6, b, 0.9, 0.2, 0, 0.35, 4, pl, me);
    add1('psu_optoacopladores', F([A.plastico('#e8e8e8'), pl], [A.estano(), me]));
  }

  // ---------------- Standby 5VSB ----------------
  {
    const a0 = 3.3, a1 = 5.5, bc = -5.6, cc = 1.2, W = 1.8, D = 1.9, y = 0.3, rw = 0.55, fe = [], bo = [], cu = [], pin = [];
    fe.push(bx(a0, a0 + y, bc - W / 2, bc + W / 2, cc - D / 2, cc + D / 2), bx(a1 - y, a1, bc - W / 2, bc + W / 2, cc - D / 2, cc + D / 2));
    for (const s of [-1, 1]) fe.push(bx(a0, a1, bc + s * (W / 2 - 0.15) - 0.15, bc + s * (W / 2 - 0.15) + 0.15, cc - D * 0.3, cc + D * 0.3));
    fe.push(ca(a0, a1, bc, cc, 0.3, 12));
    bo.push(ca(a0 + y, a1 - y, bc, cc, rw + 0.1, 16)); cu.push(ca(a0 + y + 0.1, a1 - y - 0.1, bc, cc, rw, 16));
    for (const a of [a0 + y + 0.15, a1 - y - 0.15]) for (const b of [bc - 0.45, bc, bc + 0.45]) pin.push(cv(a, b, 0, cc - rw, 0.05, 6));
    add1('psu_5vsb_trafo', F([A.ferrita(), fe], [A.plastico('#b78a3a'), bo], [cobreAlambre(), cu], [A.estano(), pin]));
  }
  {
    const pl = [], me = []; chip(2.8, -5.2, 0.9, 0.65, 0, 0.3, 8, pl, me);
    add1('psu_5vsb_controlador', F([A.encapsulado(), pl], [A.estano(), me]));
  }

  // ---------------- Secundario y salida ----------------
  {
    const pl = [], me = []; for (let i = 0; i < 5; i++) to(mpS, -3.6 + i, 0, 0, pl, me);
    add1('psu_rect_sinc', F([A.plastico('#15161a'), pl], [A.niquel(), me]));
  }
  {
    const al = [bx(13.65, 14.0, -4.2, 1.2, 0.3, 3.6)];
    for (let i = 0; i < 11; i++) { const b = -4.0 + i * 0.5; al.push(bx(14.0, 14.9, b - 0.05, b + 0.05, 0.3, 3.6)); }
    al.push(bx(13.6, 14.05, -4.2, -3.9, 0, 0.3), bx(13.6, 14.05, 0.9, 1.2, 0, 0.3));
    add1('psu_disipador_secundario', F([A.aluminio('#aeb4bb'), al]));
  }
  {
    const e = [], tp = [], g = [], me = [], p = [], pt = [];
    [2.2, 3.35, 4.5, 5.65, 6.8].forEach(b => { e.push(cv(14.3, b, 0.25, 2.6, 0.55, 16)); tp.push(cv(14.3, b, 2.6, 2.65, 0.52, 16)); g.push(cv(14.3, b, 0.1, 0.25, 0.45, 14)); me.push(cv(14.3, b + 0.25, 0, 0.2, 0.05, 6), cv(14.3, b - 0.25, 0, 0.2, 0.05, 6)); });
    [2.2, 3.35, 4.5, 5.65, 6.8].forEach(b => { p.push(cv(15.1, b, 0.15, 1.6, 0.25, 12)); pt.push(cv(15.1, b, 1.6, 1.64, 0.22, 12)); me.push(cv(15.1, b + 0.12, 0, 0.15, 0.04, 6), cv(15.1, b - 0.12, 0, 0.15, 0.04, 6)); });
    add1('psu_cond_salida', F([sleeve(tex('#2b2b2e', '#d9b24a', '2200µF 16V', 'LOW ESR', '#d9b24a')), e], [A.aluminio('#b5b8bc'), [...tp]], [A.goma(), g], [A.estano(), me], [A.plastico('#101012'), p], [A.oro(), pt]));
  }
  {
    const pc = [bx(12.4, 15.4, -5.12, -4.96, 0.2, 4.2)], me = [];
    for (let i = 0; i < 7; i++) me.push(bx(12.6 + i * 0.4, 12.7 + i * 0.4, -5.1, -4.98, 0, 0.2));
    pc.push(bx(12.45, 15.35, -4.96, -4.955, 0.25, 4.15));
    add1('psu_dcdc', F([A.pcb('#1d3b2c'), pc], [A.estano(), me]));
  }
  {
    const pl = [], me = []; [2.2, 2.9].forEach(c => [12.9, 13.55, 14.2].forEach(a => { pl.push(bx(a - 0.28, a + 0.28, -4.96, -4.84, c, c + 0.5)); me.push(bx(a - 0.28, a + 0.28, -4.96, -4.94, c + 0.05, c + 0.45)); }));
    add1('psu_dcdc_mosfets', F([A.encapsulado(), pl], [A.estano(), me]));
  }
  {
    const fe = [], cu = []; [13.1, 14.1, 15.0].forEach(a => { fe.push(toro(a, -4.65, 1.4, 0.5, 0.25, PI * 2, 0, false)); cu.push(...bobinado(a, -4.65, 1.4, 0.5, 0.25, 10, false)); });
    add1('psu_dcdc_bobinas', F([mat('#d9cfa0', { metalness: 0.2, roughness: 0.7 }), fe], [cobreAlambre(), cu]));
  }
  {
    const pl = [], me = []; chip(14.0, -4.78, 1.0, 0.25, 3.2, 0.6, 16, pl, me);
    add1('psu_dcdc_controlador', F([A.encapsulado(), pl.map(o => o)], [A.estano(), me]));
  }
  {
    const pl = [], me = []; chip(12.0, -5.9, 1.1, 0.7, 0, 0.3, 16, pl, me);
    for (const a of [10.7, 11.0]) pl.push(bx(a - 0.12, a + 0.12, -6.1, -5.7, 0, 0.2));
    add1('psu_supervisor', F([A.encapsulado(), pl], [A.estano(), me]));
  }
  {
    // PCB principal con 6 agujeros de montaje, serigrafía en la cara de componentes y separadores hacia la tapa superior
    const holes = [[-6.5, -6.3], [6.5, -6.3], [-6.5, 6.3], [6.5, 6.3], [0, 6.6], [0, -6.6]].map(([x, y]) => [x, y, 0.22]);
    const pc = lamina(7.85, 0, 15.0, 14.4, -0.16, 0, holes, A.pcb('#1d3b2c'));
    const t = lienzo(512, 512, (g, w, h) => {
      const X = a => (a - 0.35) / 15 * w, Y = b => (7.2 - b) / 14.4 * h;
      g.strokeStyle = '#f2f2f2'; g.lineWidth = 3; g.fillStyle = '#f2f2f2'; g.font = '16px sans-serif';
      g.setLineDash && g.setLineDash([10, 6]); g.beginPath(); g.moveTo(X(12.9), Y(-7.0)); g.lineTo(X(12.9), Y(7.0)); g.stroke(); g.setLineDash && g.setLineDash([]);
      g.fillText('PRIMARIO (AC / 400 V)', X(1.2), Y(7.0)); g.fillText('SECUNDARIO', X(13.2), Y(7.0));
      for (const [a0, a1, b0, b1, n] of [[9.2, 12.8, -3.3, 0, 'T1'], [3.3, 5.5, -6.5, -4.7, 'T2'], [6.4, 13.9, 3.6, 6.8, 'C1 C2'], [7.6, 13.0, 0.25, 1.4, 'HS1'], [13.1, 14.9, -4.2, 1.2, 'HS2']]) { g.strokeRect(X(a0), Y(b1), X(a1) - X(a0), Y(b0) - Y(b1)); g.fillText(n, X(a0) + 4, Y(b1) + 16); }
      g.fillText('CWT-850-REF  REV A', X(5.0), Y(-7.0)); g.fillText('L N PE', X(0.6), Y(1.0));
    });
    const sm = mesh(new THREE.PlaneGeometry(15.0, 14.4), mat('#ffffff', { map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, metalness: 0, roughness: 0.8 }), ...P(7.85, 0, 0.004).toArray()); sm.rotation.x = PI / 2;
    const sp = [], sc = [];
    for (const [x, y] of [[-6.5, -6.3], [6.5, -6.3], [-6.5, 6.3], [6.5, 6.3], [0, 6.6], [0, -6.6]]) { sp.push(cv(7.85 + x, -y, -0.45, -0.16, 0.3, 10)); sc.push(cv(7.85 + x, -y, 0, 0.12, 0.2, 10)); }
    add1('psu_placa_principal', [pc, sm, ...F([A.plastico('#d9d2b8'), sp], [A.niquel(), sc])]);
  }
  {
    // placa modular vertical (a ≈ 15,5) con barras de 12 V y GND, condensadores de polímero y SMD
    const pc = [bx(15.4, 15.56, -6.1, 6.1, 1.9, 6.1)], cu = [bx(15.2, 15.4, -5.6, 5.6, 2.2, 2.55), bx(15.2, 15.4, -5.6, 5.6, 5.45, 5.8), bx(15.1, 15.4, -6.0, -5.6, 0.5, 1.9), bx(15.1, 15.4, 5.6, 6.0, 0.5, 1.9)];
    const ic = [], pol = [];
    for (let i = 0; i < 8; i++) { const b = -5.3 + i * 1.5; ic.push(bx(15.2, 15.4, b - 0.25, b + 0.25, 3.2, 3.6)); pol.push(ca(14.95, 15.4, b + 0.5, 4.3, 0.25, 12)); }
    add1('psu_placa_modular', F([A.pcb('#1d3b2c'), pc], [A.cobre(), cu], [A.encapsulado(), ic], [A.plastico('#101012'), pol]));
  }
  {
    // 24 pines (20+4), 12V-2x6, 4+4 EPS/PCIe, SATA; carcasa negra y terminales dorados
    const pl = [], oro = [], k = [];
    const bloque = (b0, b1, c0, c1, cols, rows) => {
      pl.push(bx(15.6, 16.0, b0, b1, c0, c1));
      const pb = (b1 - b0) / cols, pc = (c1 - c0) / rows;
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) oro.push(bx(15.97, 16.02, b0 + (i + 0.5) * pb - 0.1, b0 + (i + 0.5) * pb + 0.1, c0 + (j + 0.5) * pc - 0.1, c0 + (j + 0.5) * pc + 0.1));
      k.push(bx(15.97, 16.02, b0 + 0.1, b0 + 0.35, c0 - 0.02, c0 + 0.1));
    };
    bloque(-5.9, -0.6, 4.1, 5.9, 12, 2);                       // 24 pines
    bloque(-0.2, 2.9, 4.1, 5.9, 6, 2);                         // 12V-2x6 (12 + 4 de señal)
    bloque(3.3, 5.9, 4.1, 5.9, 4, 2);                          // EPS/PCIe 4+4
    bloque(-5.9, -3.2, 2.0, 3.8, 4, 2); bloque(-2.9, -0.2, 2.0, 3.8, 4, 2); bloque(0.1, 2.8, 2.0, 3.8, 4, 2);
    pl.push(bx(15.6, 16.0, 3.2, 5.9, 2.0, 3.8));              // bloque SATA / periféricos
    for (const b of [3.7, 4.5, 5.3]) { oro.push(bx(15.97, 16.02, b - 0.2, b + 0.2, 2.6, 3.2)); }
    add1('psu_conectores_modulares', F([A.plastico('#0f1012'), pl], [A.oro(), oro], [A.plastico('#b8b8b8'), k]));
  }
  ctx.pendientes();   // siempre al final: cubos magenta para los ids que aún no tienen geometría
}
