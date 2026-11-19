// Módulo «gpu_almacenamiento» del PC de torre: tarjeta gráfica (marco 'gpu'), SSD NVMe (marco 'placa'), SSD SATA (marco 'ssd') y disco duro (marco 'hdd').
// Dueño: un solo agente. Lista, anclajes, explosiones y fuentes en contrato.json (filtra modulo = 'gpu_almacenamiento'); guía en CONTRATO.md.
// 54 piezas:
//   Tarjeta gráfica · PCB y componentes: gpu_pcb, gpu_contactos, gpu_bracket, gpu_salidas, gpu_die, gpu_die_gpcs, gpu_die_l2, gpu_die_mem, gpu_vram, gpu_vrm_etapas, gpu_vrm_bobinas, gpu_vrm_controlador, gpu_condensadores, gpu_conector_12v, gpu_bios
//   Tarjeta gráfica · Refrigeración y carcasa: gpu_backplate, gpu_almohadillas, gpu_pasta, gpu_camara_vapor, gpu_aletas, gpu_heatpipes, gpu_cubierta, gpu_vent_1, gpu_vent_2
//   SSD NVMe · SSD NVMe M.2 2280: nvme_pcb, nvme_controlador, nvme_dram, nvme_nand, nvme_pmic, nvme_conector, nvme_etiqueta
//   SSD SATA · SSD SATA 2,5": ssd_carcasa_inf, ssd_carcasa_sup, ssd_pcb, ssd_controlador, ssd_nand, ssd_dram, ssd_conector
//   Disco duro · Disco duro 3,5": hdd_base, hdd_tapa, hdd_filtro, hdd_husillo, hdd_platos, hdd_actuador, hdd_cabezales, hdd_vcm_bobina, hdd_vcm_imanes, hdd_rampa, hdd_flex, hdd_pcb, hdd_soc, hdd_cache, hdd_driver_motor, hdd_conectores
// Ejemplo:
//   add('hdd_platos', [[platos]]);
//     giros.push({ ids: ['hdd_platos', 'hdd_husillo:1'], e: V(0, 1, 0), c: en('hdd', 9.7, 0, 0), k: 3 });
export default function (ctx) {
  const { THREE, V, PI, mat, cil, rev, rr, lienzo, cajaEn, fundir, en, ejeDe, tubo, A, add, giros } = ctx;
  const G = 'gpu', N = 'placa', S = 'ssd', H = 'hdd';

  // ---------- helpers locales (todo en coordenadas del marco local; cajaEn/en llevan a mundo) ----------
  const C = cajaEn;
  const mapG = (g, M, f) => {   // geometría en coordenadas locales (a,b,c) -> mundo; f reordena ejes si hace falta
    g = g.index ? g.toNonIndexed() : g; const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); if (f) [x, y, z] = f(x, y, z); const w = en(M, x, y, z); p.setXYZ(i, w.x, w.y, w.z); }
    g.computeVertexNormals(); return g;
  };
  const mm = (g, M, m, f) => new THREE.Mesh(mapG(g, M, f), m);
  const bx = (M, [la, lb, lc], [a, b, c], ang, m) => { const g = new THREE.BoxGeometry(la, lb, lc); g.rotateZ(ang); g.translate(a, b, c); return mm(g, M, m); };
  // forma plana (a,b) extruida de c0 a c1; o.ang/o.t giran y trasladan antes de mapear; o.f reordena ejes (formas en otro plano)
  const ex = (M, shape, d0, d1, m, o = {}) => {
    const g = new THREE.ExtrudeGeometry(shape, { depth: d1 - d0, bevelEnabled: false, curveSegments: 10 }); g.translate(0, 0, d0);
    if (o.ang) g.rotateZ(o.ang); if (o.t) g.translate(o.t[0], o.t[1], 0); return mm(g, M, m, o.f);
  };
  const poli = pts => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); return s; };
  const hueco = (x0, y0, x1, y1) => { const p = new THREE.Path(); p.moveTo(x0, y0); p.lineTo(x0, y1); p.lineTo(x1, y1); p.lineTo(x1, y0); p.lineTo(x0, y0); return p; };
  const circ = (x, y, r) => { const p = new THREE.Path(); p.absarc(x, y, r, 0, PI * 2, true); return p; };
  const cyl = (M, r, a, b, c0, c1, m, seg = 16) => { const p = en(M, a, b, (c0 + c1) / 2); return cil(ejeDe(M, 'c'), r, r, Math.abs(c1 - c0), p.x, p.y, p.z, m, seg); };
  const ann = (M, ri, ro, a, b, c0, c1, m, seg = 24) => {   // anillo con eje en c
    const p0 = en(M, a, b, c0), p1 = en(M, a, b, c1), h = Math.abs(c1 - c0);
    return rev([[ri, 0], [ro, 0], [ro, h], [ri, h], [ri, 0]], ejeDe(M, 'c'), m, seg, Math.min(p0.x, p1.x), Math.min(p0.y, p1.y), Math.min(p0.z, p1.z));
  };
  let sd = 11; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const pasivos = (M, n, [a0, a1], [b0, b1], c0, [la, lb, lc], m) => {   // componentes SMD repartidos al azar (semilla fija)
    const o = []; for (let i = 0; i < n; i++) { const a = a0 + rnd() * (a1 - a0), b = b0 + rnd() * (b1 - b0), t = rnd() < 0.5; o.push(C(M, [a, a + (t ? la : lb)], [b, b + (t ? lb : la)], [c0, c0 + lc], m)); }
    return fundir(o, m);
  };
  const rotulo = (w, h, bg, fg, lineas) => lienzo(w, h, (g, W, Hh) => { g.fillStyle = bg; g.fillRect(0, 0, W, Hh); g.fillStyle = fg; lineas.forEach(([t, px, y, x = 24]) => { g.font = `bold ${px}px sans-serif`; g.fillText(t, x, y); }); });
  // conector SATA (7 de datos + 15 de poder con la muesca en L): base, paredes y contactos dorados
  const sata = (M, a0, b0, c0, alto, prof = 0.5) => {
    const pl = A.plastico('#1a1b1e'), o = [C(M, [a0, a0 + prof], [b0, b0 + 3.54], [c0, c0 + 0.1], pl), C(M, [a0, a0 + prof], [b0, b0 + 0.08], [c0, c0 + alto], pl), C(M, [a0, a0 + prof], [b0 + 3.46, b0 + 3.54], [c0, c0 + alto], pl),
      C(M, [a0 + prof - 0.08, a0 + prof], [b0, b0 + 3.54], [c0, c0 + alto], pl), C(M, [a0, a0 + prof], [b0 + 1.1, b0 + 1.34], [c0, c0 + alto * 0.7], pl)], pins = [];
    const p = (b) => pins.push(C(M, [a0 + 0.02, a0 + prof - 0.1], [b, b + 0.06], [c0 + 0.1, c0 + 0.17], A.oro()));
    for (let i = 0; i < 7; i++) p(b0 + 0.18 + i * 0.127);
    for (let i = 0; i < 15; i++) p(b0 + 1.45 + i * 0.127);
    return [fundir(o, pl), fundir(pins, A.oro())];
  };

  // ================= TARJETA GRÁFICA (marco gpu: a desde el bracket, b desde la punta de los contactos, c hacia el disipador) =================
  const cV = [[7, 5.6], [18.5, 5.6]];          // centros de los dos ventiladores (a, b)
  {  // PCB con orificios de montaje y componentes pasivos de la cara inferior
    const s = rr(0.3, 0, 20.9, 10.6, 0.3); [[2.2, 2.0], [2.8, 9.4], [6.2, 1.4], [13.6, 1.4], [17.8, 9.5], [20.3, 5.4], [4.6, 5.8]].forEach(([a, b]) => s.holes.push(circ(a, b, 0.14)));
    const pcb = ex(G, s, -0.08, 0.08, A.pcb('#16301f'));
    const pas = [pasivos(G, 34, [1.0, 4.2], [1.5, 9.2], 0.08, [0.18, 0.1, 0.06], A.estano()), pasivos(G, 26, [17.8, 20.4], [1.0, 9.0], 0.08, [0.18, 0.1, 0.06], A.estano())];
    add('gpu_pcb', [[pcb, ...pas]]);
  }
  {  // contactos x16 en las dos caras, con la muesca de llave entre el 11.º y 12.º contacto
    const d = [], m0 = A.oro();
    for (const [x0, x1] of [[5.1, 6.2], [6.55, 13.9]]) for (let a = x0; a < x1 - 0.05; a += 0.1) for (const s of [-1, 1]) d.push(C(G, [a, a + 0.07], [0, 0.85], s < 0 ? [-0.1, -0.07] : [0.07, 0.1], m0));
    add('gpu_contactos', [[fundir(d, A.oro())]]);
  }
  {  // bracket de 2 ranuras: chapa con ventanas de puertos y rejilla, pestaña de fijación
    const s = poli([[0.1, -0.45], [11.2, -0.45], [11.2, 3.65], [0.1, 3.65]]);   // x = b, y = c
    [[3.6, 5.3], [5.5, 7.2], [7.4, 9.1], [9.3, 11.0]].forEach(([b0, b1]) => s.holes.push(hueco(b0, 1.0, b1, 1.8)));
    for (let i = 0; i < 8; i++) s.holes.push(hueco(0.7 + i * 1.3, 2.35, 1.5 + i * 1.3, 3.35));
    const m = A.niquel(), pl = ex(G, s, 0, 0.2, m, { f: (x, y, z) => [z, x, y] });
    add('gpu_bracket', [[pl, fundir([C(G, [-0.7, 0.2], [11.05, 11.2], [0.2, 3.4], m), C(G, [-0.7, -0.5], [10.2, 11.2], [0.2, 3.4], m)], m)]]);
  }
  {  // 3 DisplayPort y 1 HDMI: carcasa metálica detrás de las ventanas e insertos negros
    const sh = [], ne = [], m = A.niquel(), n = A.plastico('#0c0d0f'), pins = [];
    [[3.6, 5.3], [5.5, 7.2], [7.4, 9.1], [9.3, 11.0]].forEach(([b0, b1], i) => {
      sh.push(C(G, [0.2, 1.8], [b0 - 0.05, b1 + 0.05], [0.9, 1.9], m)); ne.push(C(G, [0, 0.9], [b0 + 0.08, b1 - 0.08], [1.08, 1.72], n));
      for (let k = 0; k < 10; k++) pins.push(C(G, [0.5, 0.95], [b0 + 0.22 + k * ((b1 - b0 - 0.44) / 9) - 0.02, b0 + 0.22 + k * ((b1 - b0 - 0.44) / 9) + 0.02], [1.35, 1.45], A.oro()));
    });
    add('gpu_salidas', [[fundir(sh, m), fundir(ne, n), fundir(pins, A.oro())]]);
  }
  {  // GPU AD104: sustrato, die, marco de retención y tornillos
    const sus = C(G, [7.5, 11.5], [4.0, 8.0], [0.08, 0.2], A.pcb('#2c4a3a')), die = C(G, [8.6, 10.4], [5.2, 6.8], [0.2, 0.29], A.silicio()), ac = A.niquel(), f = [];
    f.push(C(G, [7.3, 11.7], [3.8, 4.0], [0.08, 0.24], ac), C(G, [7.3, 11.7], [8.0, 8.2], [0.08, 0.24], ac), C(G, [7.3, 7.5], [4.0, 8.0], [0.08, 0.24], ac), C(G, [11.5, 11.7], [4.0, 8.0], [0.08, 0.24], ac));
    const sc = [[7.4, 3.9], [11.6, 3.9], [7.4, 8.1], [11.6, 8.1]].map(([a, b]) => cyl(G, 0.1, a, b, 0.24, 0.3, A.acero('#40454c'), 10));
    add('gpu_die', [[sus, die, fundir(f, ac), fundir(sc, A.acero('#40454c'))]]);
  }
  {  // bloques del die (baldosas finas sobre el die): GPC con sus SM, caché L2 central y 6 controladores de memoria
    const g = [], l2 = [], mc = [], m = A.silicio(), z = [0.29, 0.3];
    const gpcs = [[8.9, 9.4, 5.5, 5.98], [8.9, 9.4, 6.02, 6.5], [9.85, 10.38, 5.5, 5.82], [9.85, 10.38, 5.85, 6.17], [9.85, 10.38, 6.2, 6.5]];
    for (const [a0, a1, b0, b1] of gpcs) for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) {
      const da = (a1 - a0) / 2, db = (b1 - b0) / 3; g.push(C(G, [a0 + i * da + 0.01, a0 + (i + 1) * da - 0.01], [b0 + j * db + 0.01, b0 + (j + 1) * db - 0.01], z, m));
    }
    for (let i = 0; i < 8; i++) l2.push(C(G, [9.45, 9.8], [5.5 + i * 0.125 + 0.01, 5.5 + (i + 1) * 0.125 - 0.01], z, m));
    [[8.62, 8.86, 5.25, 5.75], [8.62, 8.86, 5.78, 6.22], [8.62, 8.86, 6.25, 6.75], [8.9, 9.4, 6.52, 6.76], [9.6, 10.1, 6.52, 6.76], [9.2, 9.8, 5.24, 5.48]].forEach(([a0, a1, b0, b1]) => mc.push(C(G, [a0, a1], [b0, b1], z, m)));
    add('gpu_die_gpcs', [[fundir(g, mat('#3f8f6f', { metalness: 0.5, roughness: 0.3 }))]]);
    add('gpu_die_l2', [[fundir(l2, mat('#c79a3c', { metalness: 0.5, roughness: 0.3 }))]]);
    add('gpu_die_mem', [[fundir(mc, mat('#4a78b8', { metalness: 0.5, roughness: 0.3 }))]]);
  }
  // chips de memoria GDDR6X (3 a la izquierda, 2 arriba, 1 abajo) y sus pastillas térmicas
  const chipsV = [[5.8, 7.0, 3.7, 5.1], [5.8, 7.0, 5.3, 6.7], [5.8, 7.0, 6.9, 8.3], [7.9, 9.3, 8.5, 9.7], [9.7, 11.1, 8.5, 9.7], [8.8, 10.2, 2.3, 3.5]];
  const stB = Array.from({ length: 8 }, (_, i) => 2.6 + i * 0.8);   // b de las 8 etapas de potencia
  {
    const m = A.encapsulado('#17181b'); add('gpu_vram', [[fundir(chipsV.map(([a0, a1, b0, b1]) => C(G, [a0, a1], [b0, b1], [0.08, 0.2], m)), m)]]);
    const m2 = A.encapsulado('#202226'); add('gpu_vrm_etapas', [[fundir(stB.map(b => C(G, [14.0, 14.6], [b, b + 0.6], [0.08, 0.18], m2)), m2)]]);
    const fe = A.ferrita(); add('gpu_vrm_bobinas', [[fundir(stB.map(b => C(G, [14.8, 15.8], [b - 0.05, b + 0.65], [0.08, 0.5], fe)), fe)]]);
    add('gpu_vrm_controlador', [[C(G, [12.2, 12.8], [9.5, 10.1], [0.08, 0.16], A.encapsulado()), C(G, [12.3, 12.7], [9.6, 10.0], [0.16, 0.17], A.niquel())]]);
    const pol = A.plastico('#3a3326'), ml = mat('#a5895f', { metalness: 0.3, roughness: 0.6 }), el = A.aluminio('#7e848c');
    const p = [], q = [], e = [];
    for (let i = 0; i < 6; i++) p.push(C(G, [16.2, 16.9], [2.6 + i * 1.0, 3.5 + i * 1.0], [0.08, 0.5], pol));
    for (let i = 0; i < 8; i++) for (const a of [11.9, 12.3, 12.8, 13.2]) q.push(C(G, [a, a + 0.22], [4.0 + i * 0.5, 4.12 + i * 0.5], [0.08, 0.16], ml));
    for (let i = 0; i < 3; i++) e.push(cyl(G, 0.3, 17.8, 2.4 + i * 1.0, 0.08, 0.7, el, 14));
    add('gpu_condensadores', [[fundir(p, pol), fundir(q, ml), fundir(e, el)]]);
    const pad = mat('#8fa6b8', { metalness: 0, roughness: 0.9 });
    add('gpu_almohadillas', [[fundir([...chipsV.map(([a0, a1, b0, b1]) => C(G, [a0, a1], [b0, b1], [0.2, 0.34], pad)), ...stB.map(b => C(G, [14.0, 14.6], [b, b + 0.6], [0.18, 0.34], pad))], pad)]]);
  }
  {  // conector 12V-2x6: carcasa, 12 pines de potencia y 4 de señal (sidebands)
    const pl = A.plastico('#2a2c30'), c0 = 0.08, c1 = 1.1, o = [C(G, [14.55, 17.45], [9.7, 9.85], [c0, c1], pl), C(G, [14.55, 14.67], [9.7, 11.0], [c0, c1], pl), C(G, [17.33, 17.45], [9.7, 11.0], [c0, c1], pl), C(G, [14.55, 17.45], [9.7, 11.0], [c0, c0 + 0.1], pl), C(G, [14.55, 17.45], [9.7, 11.0], [c1 - 0.1, c1], pl), C(G, [15.4, 16.6], [10.0, 11.05], [c1, c1 + 0.08], pl)];
    const pn = [], sn = [];
    for (let i = 0; i < 6; i++) for (const c of [0.25, 0.57]) pn.push(C(G, [15.25 + i * 0.3 - 0.07, 15.25 + i * 0.3 + 0.07], [9.85, 10.9], [c - 0.07, c + 0.07], A.oro()));
    for (let i = 0; i < 4; i++) sn.push(C(G, [15.4 + i * 0.25 - 0.04, 15.4 + i * 0.25 + 0.04], [9.85, 10.7], [0.84, 0.92], A.estano()));
    add('gpu_conector_12v', [[fundir(o, pl), fundir(pn, A.oro()), fundir(sn, A.estano())]]);
  }
  {  // BIOS: flash SPI SOIC-8
    const m = A.encapsulado(), l = []; for (let i = 0; i < 4; i++) for (const s of [-1, 1]) l.push(C(G, [4.28 + i * 0.13, 4.34 + i * 0.13], s < 0 ? [9.22, 9.3] : [9.7, 9.78], [0.08, 0.1], A.estano()));
    add('gpu_bios', [[C(G, [4.25, 4.75], [9.3, 9.7], [0.08, 0.17], m), fundir(l, A.estano())]]);
  }
  {  // backplate con ventana de flujo y tornillos
    const s = rr(0.8, 0.5, 20.4, 10.2, 0.4); s.holes.push(hueco(14.2, 2.0, 19.0, 6.4), circ(4.0, 7.5, 0.5), circ(4.0, 5.6, 0.5), circ(4.0, 3.7, 0.5));
    const pl = ex(G, s, -0.45, -0.25, A.aluminio('#4b5058')), sc = [[9.5, 3.9], [9.5, 8.1], [7.4, 6.0], [11.6, 6.0], [2.0, 2.0], [2.6, 9.4], [17.6, 9.2], [20.1, 1.4]].map(([a, b]) => cyl(G, 0.13, a, b, -0.55, -0.45, A.acero('#40454c'), 10));
    add('gpu_backplate', [[pl, fundir(sc, A.acero('#40454c'))]]);
  }
  add('gpu_pasta', [[C(G, [8.55, 10.45], [5.15, 6.85], [0.29, 0.34], mat('#9aa0a6', { metalness: 0.7, roughness: 0.4 })), C(G, [8.3, 10.7], [4.9, 7.1], [0.3, 0.335], mat('#9aa0a6', { metalness: 0.7, roughness: 0.4 }))]]);
  {  // cámara de vapor: placa de cobre y 4 tornillos con resorte alrededor del die
    const cu = A.cobre(), pl = ex(G, rr(4.8, 0.9, 14.9, 10.3, 0.5), 0.34, 0.74, cu), sc = [], rs = [];
    [[7.0, 3.4], [12.0, 3.4], [7.0, 8.6], [12.0, 8.6]].forEach(([a, b]) => { sc.push(cyl(G, 0.2, a, b, 0.74, 0.86, A.acero('#40454c'), 10)); rs.push(ann(G, 0.22, 0.4, a, b, 0.74, 0.8, A.acero('#b9bec5'), 12)); });
    add('gpu_camara_vapor', [[pl, fundir(sc, A.acero('#40454c')), fundir(rs, A.acero('#b9bec5'))]]);
  }
  {  // aletas: 70 láminas de aluminio perpendiculares a la tarjeta; heatpipes de cobre que las cruzan
    const m = A.aluminio('#aeb3ba'), f = []; for (let a = 3.8; a < 22.6; a += 0.27) f.push(C(G, [a, a + 0.05], [1.0, 9.6], [0.75, 3.0], m));
    add('gpu_aletas', [[fundir(f, m)]]);
    const hp = [3.6, 4.8, 6.0, 7.2, 8.4].map(b0 => tubo([en(G, 6.2, b0, 1.05), en(G, 10.0, b0, 1.05), en(G, 15.0, b0 + (b0 - 6) * 0.25, 1.1), en(G, 21.8, 6 + (b0 - 6) * 1.0, 1.1)], 0.28, A.cobre()));
    add('gpu_heatpipes', [[fundir(hp, A.cobre())]]);
  }
  {  // cubierta: bisel con dos aberturas para los ventiladores y paredes laterales
    const s = rr(0.25, 0, 24.4, 11.2, 0.6); cV.forEach(([a, b]) => s.holes.push(circ(a, b, 4.55)));
    const pl = A.plastico('#202226'), top = ex(G, s, 3.95, 4.1, pl), w = [C(G, [24.2, 24.4], [0, 11.2], [2.9, 4.1], pl), C(G, [0.25, 24.4], [0, 0.15], [2.9, 4.1], pl), C(G, [0.25, 24.4], [11.05, 11.2], [2.9, 4.1], pl), C(G, [0.25, 0.4], [0, 11.2], [2.9, 4.1], pl)];
    add('gpu_cubierta', [[top, fundir(w, pl)]]);
  }
  cV.forEach(([a, b], k) => {   // ventiladores: ítem 0 marco (anillo, 3 puntales y base del motor), ítem 1 rotor (cubo, 9 aspas y aro)
    const pl = A.plastico('#1c1e22'), fr = [ann(G, 4.3, 4.6, a, b, 3.05, 4.0, pl, 24), cyl(G, 0.8, a, b, 3.1, 3.35, pl, 14)];
    for (let i = 0; i < 3; i++) { const t = i * 2 * PI / 3 + 0.4; fr.push(bx(G, [3.5, 0.28, 0.12], [a + 2.5 * Math.cos(t), b + 2.5 * Math.sin(t), 3.2], t, pl)); }
    const rp = A.plastico('#0f1012'), ro = [cyl(G, 1.0, a, b, 3.3, 3.95, rp, 20), ann(G, 4.15, 4.25, a, b, 3.4, 3.7, rp, 24)];
    for (let i = 0; i < 9; i++) { const t = i * 2 * PI / 9, g = new THREE.BoxGeometry(3.3, 0.95, 0.05); g.rotateX(0.5); g.rotateZ(t); g.translate(a + 2.55 * Math.cos(t), b + 2.55 * Math.sin(t), 3.55); ro.push(mm(g, G, rp)); }
    const id = `gpu_vent_${k + 1}`; add(id, [[fundir(fr, pl)], [fundir(ro, rp)]]);
    giros.push({ ids: [`${id}:1`], e: V(0, 1, 0), c: en(G, a, b, 3.6), k: 2 });
  });

  // ================= SSD NVMe M.2 2280 (marco placa: a hacia el conector, b a lo ancho de la tarjeta, c sobre la cara de componentes) =================
  {
    const s = new THREE.Shape(); s.moveTo(5.6, 13.5); s.lineTo(13.6, 13.5); s.lineTo(13.6, 15.7); s.lineTo(5.6, 15.7); s.lineTo(5.6, 14.85); s.absarc(5.6, 14.6, 0.25, PI / 2, -PI / 2, true); s.lineTo(5.6, 13.5);
    const pcb = ex(N, s, 0.46, 0.54, A.pcb('#14171b')), tan = mat('#a5895f', { metalness: 0.3, roughness: 0.6 });
    add('nvme_pcb', [[pcb, pasivos(N, 40, [6.0, 13.0], [13.6, 15.5], 0.54, [0.16, 0.08, 0.05], tan)]]);
    add('nvme_controlador', [[C(N, [11.1, 12.5], [14.0, 15.2], [0.54, 0.64], A.encapsulado('#202226'))]]);
    add('nvme_dram', [[C(N, [9.8, 10.9], [14.0, 15.2], [0.54, 0.64], A.encapsulado('#15161a'))]]);
    const na = A.encapsulado('#111215'); add('nvme_nand', [[C(N, [6.1, 7.3], [13.85, 15.25], [0.54, 0.65], na), C(N, [7.6, 8.8], [13.85, 15.25], [0.54, 0.65], na)]]);
    add('nvme_pmic', [[C(N, [12.65, 13.15], [14.3, 14.9], [0.54, 0.6], A.encapsulado('#26282c'))]]);
    const d = [], m0 = A.oro();
    for (const [i0, i1] of [[0, 12], [17, 38]]) for (let i = i0; i < i1; i++) for (const t of [0.44, 0.54]) d.push(C(N, [13.25, 13.6], [13.55 + i * 0.05, 13.55 + i * 0.05 + 0.03], [t, t + 0.025], m0));
    add('nvme_conector', [[fundir(d, A.oro())]]);
    const tx = rotulo(512, 256, '#b8723a', '#2a1608', [['SSD NVMe PCIe 4.0 x4', 44, 96], ['M.2 2280 · 1 TB', 36, 150], ['REFERENCIAL', 28, 210]]);
    add('nvme_etiqueta', [[C(N, [5.9, 12.45], [13.55, 15.65], [0.64, 0.67], mat('#c07a3e', { map: tx, metalness: 0.7, roughness: 0.35 }))]]);
  }

  // ================= SSD SATA 2,5" (marco ssd: a desde el conector, b a lo alto, c alejándose de la bandeja) =================
  {
    const m = A.aluminio('#a9aeb5'), i = [C(S, [0, 10], [-3.49, 3.49], [0, 0.1], m), C(S, [0, 10], [-3.49, -3.39], [0, 0.6], m), C(S, [0, 10], [3.39, 3.49], [0, 0.6], m), C(S, [9.9, 10], [-3.49, 3.49], [0, 0.6], m),
      C(S, [0, 0.1], [-3.49, -1.9], [0, 0.6], m), C(S, [0, 0.1], [1.84, 3.49], [0, 0.6], m), C(S, [0, 0.1], [-1.9, 1.84], [0, 0.2], m)];
    const sc = [[0.8, -3.0], [0.8, 3.0], [9.2, -3.0], [9.2, 3.0]].map(([a, b]) => cyl(S, 0.18, a, b, 0.1, 0.16, A.acero('#40454c'), 10));   // bases de los tornillos de la tapa
    add('ssd_carcasa_inf', [[fundir(i, m), fundir(sc, A.acero('#40454c'))]]);
    const ms = A.aluminio('#c3c7cc'), tx = rotulo(512, 256, '#d9dce0', '#1d1f23', [['SSD SATA 2,5"', 46, 92], ['6 Gb/s · 500 GB', 36, 148], ['REFERENCIAL', 28, 208]]);
    const hd = [[0.8, -3.0], [0.8, 3.0], [9.2, -3.0], [9.2, 3.0]].map(([a, b]) => cyl(S, 0.2, a, b, 0.7, 0.74, A.acero('#2b2e33'), 10));
    add('ssd_carcasa_sup', [[C(S, [0, 10], [-3.49, 3.49], [0.6, 0.7], ms), C(S, [2.2, 9.0], [-2.7, 2.7], [0.7, 0.704], mat('#ffffff', { map: tx, metalness: 0, roughness: 0.8 })), fundir(hd, A.acero('#2b2e33'))]]);
    add('ssd_pcb', [[ex(S, rr(0.5, -3.15, 8.8, 3.15, 0.2), 0.28, 0.36, A.pcb('#14301f')), pasivos(S, 22, [1.2, 8.4], [-3.0, 2.9], 0.36, [0.16, 0.08, 0.05], mat('#a5895f', { metalness: 0.3, roughness: 0.6 }))]]);
    add('ssd_controlador', [[C(S, [2.65, 3.35], [-0.35, 0.35], [0.36, 0.46], A.encapsulado('#202226'))]]);
    add('ssd_dram', [[C(S, [2.6, 3.4], [1.5, 2.5], [0.36, 0.45], A.encapsulado('#15161a'))]]);
    const na = A.encapsulado('#111215'); add('ssd_nand', [[C(S, [4.4, 5.6], [-0.9, 0.9], [0.36, 0.47], na), C(S, [5.9, 7.1], [-0.9, 0.9], [0.36, 0.47], na)]]);
    add('ssd_conector', [sata(S, 0, -1.8, 0.2, 0.4)]);
  }

  // ================= DISCO DURO 3,5" (marco hdd: a desde los conectores, b a lo ancho, c desde la cara inferior; husillo en a = 9,7) =================
  const HA = 9.7, P = [3.3, 3.4], Hd = [6.6, 1.2];                 // husillo, pivote del actuador, posición de lectura
  const th = Math.atan2(Hd[1] - P[1], Hd[0] - P[0]), Lh = Math.hypot(Hd[0] - P[0], Hd[1] - P[1]);
  const Cc = [1.6, 3.9], ph = Math.atan2(Cc[1] - P[1], Cc[0] - P[0]);   // centro de la bobina y dirección de la cola del actuador
  {  // base de aluminio fundido: piso, paredes, bosa del motor, bosas de los tornillos y nervios
    const m = A.aluminio('#9ea3aa'), o = [C(H, [0.55, 14.7], [-5.08, 5.08], [0.24, 0.4], m), C(H, [0.55, 14.7], [-5.08, -4.83], [0.24, 2.45], m), C(H, [0.55, 14.7], [4.83, 5.08], [0.24, 2.45], m),
      C(H, [14.45, 14.7], [-5.08, 5.08], [0.24, 2.45], m), C(H, [0.55, 0.8], [-5.08, 5.08], [0.24, 2.45], m), cyl(H, 2.2, HA, 0, 0.4, 0.55, m, 24)];
    [[1.3, -4.4], [1.3, 4.4], [14.0, -4.4], [14.0, 4.4], [7.6, -4.5], [7.6, 4.5]].forEach(([a, b]) => o.push(cyl(H, 0.35, a, b, 2.0, 2.45, m, 10)));
    [[3.0, -4.6, 0.3], [11.0, -4.6, 0.3], [14.2, -1.5, 1.5], [14.2, 1.5, 1.5]].forEach(([a, b, l]) => o.push(C(H, [a, a + (b < -4 ? 1.5 : 0.25)], [b, b + (b < -4 ? 0.25 : l)], [0.4, 0.62], m)));
    add('hdd_base', [[fundir(o, m)]]);
  }
  {  // tapa sellada con etiqueta y 7 tornillos
    const m = A.aluminio('#b4b9bf'), tx = rotulo(768, 512, '#e8eaee', '#14181e', [['DISCO DURO 3,5"', 58, 96], ['SATA 6 Gb/s · 7200 rpm', 40, 168], ['4 TB · 2 platos', 40, 226], ['REFERENCIAL', 30, 290]]);
    const sc = [[1.3, -4.4], [1.3, 4.4], [14.0, -4.4], [14.0, 4.4], [7.6, -4.5], [7.6, 4.5], [HA, 0]].map(([a, b]) => cyl(H, a === HA ? 0.45 : 0.25, a, b, 2.58, 2.63, A.acero('#40454c'), 12));
    add('hdd_tapa', [[C(H, [0.55, 14.7], [-5.08, 5.08], [2.45, 2.58], m), C(H, [2.4, 13.8], [-4.0, 4.0], [2.58, 2.605], mat('#ffffff', { map: tx, metalness: 0, roughness: 0.8 })), fundir(sc, A.acero('#40454c'))]]);
  }
  add('hdd_filtro', [[C(H, [12.2, 13.6], [-4.7, -3.6], [0.4, 1.3], mat('#d4d7d2', { metalness: 0, roughness: 0.95 })), C(H, [11.5, 12.1], [-4.6, -3.8], [0.4, 0.85], mat('#2f5a58', { metalness: 0, roughness: 0.9 }))]]);
  {  // husillo: ítem 0 estator y bobinas; ítem 1 cubo (gira con los platos)
    const st = A.acero('#4a4f56'), cu = A.cobre(), po = [];
    for (let i = 0; i < 9; i++) { const t = i * 2 * PI / 9; po.push(bx(H, [0.9, 0.35, 0.14], [HA + 1.55 * Math.cos(t), 1.55 * Math.sin(t), 0.49], t, cu)); }
    add('hdd_husillo', [[ann(H, 0.9, 1.95, HA, 0, 0.55, 0.58, st), fundir(po, cu)], [fundir([cyl(H, 1.25, HA, 0, 0.55, 1.2, A.acero('#6b7077'), 24), cyl(H, 1.9, HA, 0, 0.55, 0.72, A.acero('#6b7077'), 24)], A.acero('#6b7077'))]]);
    giros.push({ ids: ['hdd_platos', 'hdd_husillo:1'], e: V(0, 1, 0), c: en(H, HA, 0, 0), k: 3 });
  }
  {  // 2 platos con zona de datos, separador, abrazadera y 6 tornillos
    const pm = mat('#c9ccd4', { metalness: 0.9, roughness: 0.2 }), bm = mat('#7b7f8c', { metalness: 0.9, roughness: 0.3 }), hw = A.acero('#6b7077'), p = [], b = [], h = [];
    for (const [c0, c1] of [[0.72, 0.77], [0.98, 1.03]]) { p.push(ann(H, 1.25, 4.5, HA, 0, c0, c1, pm, 32)); b.push(ann(H, 1.9, 4.3, HA, 0, c1, c1 + 0.004, bm, 32)); }
    h.push(ann(H, 1.25, 1.9, HA, 0, 0.77, 0.98, hw, 24), ann(H, 1.25, 1.75, HA, 0, 1.03, 1.12, hw, 24));
    for (let i = 0; i < 6; i++) { const t = i * PI / 3; h.push(cyl(H, 0.09, HA + 1.5 * Math.cos(t), 1.5 * Math.sin(t), 1.12, 1.16, hw, 8)); }
    add('hdd_platos', [[fundir(p, pm), fundir(b, bm), fundir(h, hw)]]);
  }
  {  // actuador (E-block): 3 brazos, cilindro del pivote, cola de plástico y tapa
    const al = A.aluminio('#b9bec5'), arm = poli([[0, -0.5], [1.2, -0.4], [3.3, -0.16], [Lh + 0.15, -0.1], [Lh + 0.15, 0.1], [3.3, 0.16], [1.2, 0.4], [0, 0.5], [0, -0.5]]);
    const ar = [[0.56, 0.62], [0.84, 0.9], [1.1, 1.16]].map(([c0, c1]) => ex(H, arm, c0, c1, al, { ang: th, t: P }));
    const cola = poli([[0, -0.5], [1.0, -0.5], [1.3, -0.25], [2.3, -0.25], [2.3, 0.25], [1.3, 0.25], [1.0, 0.5], [0, 0.5], [0, -0.5]]);
    add('hdd_actuador', [[fundir([...ar, cyl(H, 0.55, P[0], P[1], 0.46, 1.28, al, 20)], al), ex(H, cola, 0.8, 0.96, A.plastico('#26282c'), { ang: ph, t: P }), cyl(H, 0.3, P[0], P[1], 1.28, 1.35, A.acero('#40454c'), 12)]]);
    const sl = A.acero('#5a5f66');   // 4 sliders (uno por cara de plato)
    add('hdd_cabezales', [[fundir([0.65, 0.81, 0.93, 1.07].map(c => bx(H, [0.24, 0.18, 0.06], [Hd[0], Hd[1], c], th, sl)), sl)]]);
  }
  {  // bobina VCM (cobre, racetrack alrededor de la cola) y sus imanes de neodimio con el yugo de acero
    const s = rr(-0.8, -0.55, 0.8, 0.55, 0.35); s.holes.push(hueco(-0.525, -0.25, 0.525, 0.25));
    add('hdd_vcm_bobina', [[ex(H, s, 0.8, 1.0, mat('#b8662e', { metalness: 0.85, roughness: 0.35 }), { ang: ph, t: Cc })]]);
    const im = mat('#b6bbc2', { metalness: 0.85, roughness: 0.3 }), yu = A.acero('#4a4f56');
    add('hdd_vcm_imanes', [[C(H, [0.55, 2.65], [3.0, 4.75], [0.4, 0.78], im), C(H, [0.55, 2.65], [3.0, 4.75], [1.02, 1.4], im)], [C(H, [0.45, 2.75], [2.9, 4.8], [1.4, 1.52], yu), C(H, [0.45, 0.7], [2.9, 4.8], [0.4, 1.4], yu)]]);
  }
  {  // rampa de estacionamiento con 4 labios
    const pl = A.plastico('#34373c'), d = [Math.sin(0.27), 0], dir = Math.atan2(-0.963, 0.266), o = [C(H, [7.9, 8.9], [4.15, 4.75], [0.4, 1.45], pl)];
    [0.65, 0.82, 0.95, 1.08].forEach(c => o.push(bx(H, [0.9, 0.25, 0.05], [8.4 + 0.266 * 0.5, 4.5 - 0.963 * 0.5, c], dir, pl)));
    add('hdd_rampa', [[fundir(o, pl)]]);
  }
  {  // cable flexible (cinta de poliimida del pivote al conector del piso) y preamplificador sobre el brazo central
    const fl = mat('#c98a2a', { metalness: 0.2, roughness: 0.6 }), r = [[[3.0, 2.8], [2.6, 2.2]], [[2.6, 2.2], [2.2, 1.6]], [[2.2, 1.6], [2.2, 1.0]]].map(([p0, p1]) => bx(H, [Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + 0.1, 0.7, 0.02], [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, 0.43], Math.atan2(p1[1] - p0[1], p1[0] - p0[0]), fl));
    const cs = Math.cos(th), sn = Math.sin(th); r.push(bx(H, [Lh, 0.14, 0.012], [P[0] + cs * Lh / 2, P[1] + sn * Lh / 2, 0.906], th, fl));
    add('hdd_flex', [[fundir(r, fl), bx(H, [0.5, 0.45, 0.08], [P[0] + cs * 1.1, P[1] + sn * 1.1, 0.94], th, A.encapsulado('#17181b'))]]);
  }
  {  // placa controladora (cara inferior) con sus componentes hacia la base
    add('hdd_pcb', [[ex(H, rr(0, -4.9, 11.5, 4.9, 0.3), 0.04, 0.12, A.pcb('#1a4a2c')), pasivos(H, 36, [1.4, 11.0], [-4.6, 4.5], 0.12, [0.16, 0.08, 0.05], mat('#a5895f', { metalness: 0.3, roughness: 0.6 }))]]);
    add('hdd_soc', [[C(H, [5.2, 6.8], [-2.3, -0.7], [0.12, 0.22], A.encapsulado('#202226'))]]);
    add('hdd_cache', [[C(H, [7.4, 8.6], [-2.2, -0.8], [0.12, 0.2], A.encapsulado('#15161a'))]]);
    add('hdd_driver_motor', [[C(H, [9.2, 10.2], [1.1, 2.1], [0.12, 0.21], A.encapsulado('#26282c'))]]);
    add('hdd_conectores', [sata(H, 0, -1.8, 0.12, 0.7)]);
  }

  ctx.pendientes();   // siempre al final: cubos magenta para los ids que aún no tienen geometría
}
