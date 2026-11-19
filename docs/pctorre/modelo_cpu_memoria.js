// Módulo «cpu_memoria» del PC de torre: CPU (sustrato, contactos, die con sus bloques y un núcleo P en detalle, STIM, IHS), pasta, disipador de torre y los dos módulos DDR5 (marco 'placa').
// Dueño: un solo agente. Lista, anclajes, explosiones y fuentes en contrato.json (filtra modulo = 'cpu_memoria'); guía en CONTRATO.md.
// 38 piezas:
//   CPU · Encapsulado: cpu_sustrato, cpu_lands, cpu_cond_reverso, cpu_die, cpu_stim, cpu_ihs
//   CPU · Die (bloques funcionales): cpu_die_pcores, cpu_die_ecores, cpu_die_l3, cpu_die_anillo, cpu_die_igpu, cpu_die_imc, cpu_die_pcie, cpu_die_sa
//   CPU · Núcleo P en detalle: cpu_pcore_frontend, cpu_pcore_ejecucion, cpu_pcore_memoria, cpu_pcore_l2
//   CPU · Interfaz térmica: cpu_pasta
//   Disipador del CPU · Disipador de torre: cooler_backplate, cooler_soporte, cooler_aletas, cooler_heatpipes, cooler_base, cooler_ventilador, cooler_clips
//   Memoria RAM · Módulo DDR5 A2: ram_a2_pcb, ram_a2_chips, ram_a2_pmic, ram_a2_spd, ram_a2_contactos, ram_a2_disipador
//   Memoria RAM · Módulo DDR5 B2: ram_b2_pcb, ram_b2_chips, ram_b2_pmic, ram_b2_spd, ram_b2_contactos, ram_b2_disipador
// Ejemplo:
//   add('cpu_ihs', [[cajaEn('placa', [10.6, 14.4], [6.9, 11.1], [0.42, 0.70], A.niquel())]]);
export default function (ctx) {
  const { THREE, V, PI, mat, cil, rev, caja, cajaR, cajaEn, entre, tubo, fundir, en, ejeDe, pos, L, A, add, giros, mover, piezas } = ctx;

  // ---------- helpers locales (marco 'placa': a = x, b = -y desde y = 45, c = z desde z = -7,4) ----------
  const P = (a, b, c) => en('placa', a, b, c);
  const bx = (a, b, c, da, db, dc, m) => cajaEn('placa', [a - da / 2, a + da / 2], [b - db / 2, b + db / 2], [c - dc / 2, c + dc / 2], m);
  const rango = (a0, a1, b0, b1, c0, c1, m) => cajaEn('placa', [a0, a1], [b0, b1], [c0, c1], m);
  const CA = 12.5, CB = 9;                       // centro del zócalo en el marco placa

  // ======================= CPU (Core i9-12900K, FCLGA1700) =======================
  const Z0 = 0.27, ZS = Z0 + 0.1116, ZD = ZS + 0.037;   // base del sustrato, cara superior del sustrato, cara superior del die
  const ZT = ZD + 0.007, ZT2 = ZT + 0.007;               // baldosas de bloques del die, baldosas del núcleo P en detalle

  // sustrato 45 x 37,5 mm (lado largo a lo largo de b) con triángulo de alineación dorado y condensadores en los bordes
  {
    const sus = rango(CA - 1.875, CA + 1.875, CB - 2.25, CB + 2.25, Z0, ZS, A.pcb('#2f6a43'));
    const t = new THREE.Shape();
    const w = P(CA - 1.875 + 0.025, CB - 2.25 + 0.02, 0);
    t.moveTo(w.x, w.y); t.lineTo(w.x + 0.14, w.y); t.lineTo(w.x, w.y - 0.14); t.closePath();
    const tri = new THREE.Mesh(new THREE.ExtrudeGeometry(t, { depth: 0.006, bevelEnabled: false }), A.oro());
    tri.position.z = P(0, 0, ZS).z;
    const caps = [];
    for (const bb of [CB - 2.25 + 0.1, CB + 2.25 - 0.1]) for (const aa of [CA - 1.1, CA - 0.5, CA + 0.1, CA + 0.7, CA + 1.3]) caps.push(bx(aa, bb, ZS + 0.025, 0.09, 0.07, 0.05, mat('#000')));
    add('cpu_sustrato', [[[sus, tri, fundir(caps, mat('#6b5a3c', { metalness: 0.2, roughness: 0.6 }))]]]);
  }

  // 1700 contactos LGA: matriz de 43 x 49 con ventana central (la ocupan los condensadores del reverso)
  {
    const pads = []; const pitch = 0.0735;
    for (let i = 0; i < 43; i++) for (let j = 0; j < 49; j++) {
      const da = (i - 21) * pitch, db = (j - 24) * pitch;
      if (Math.abs(da) < 0.75 && Math.abs(db) < 0.8) continue;
      pads.push(bx(CA + da, CB + db, Z0 - 0.002, 0.05, 0.05, 0.004, A.oro()));
    }
    add('cpu_lands', [[fundir(pads, A.oro())]]);
  }
  // condensadores cerámicos del reverso (en la ventana del centro, entre pads y placa)
  {
    const cuerpo = [], term = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 7; j++) {
      const a = CA + (i - 1.5) * 0.3, b = CB + (j - 3) * 0.2;
      cuerpo.push(bx(a, b, Z0 - 0.035, 0.05, 0.1, 0.07, mat('#000')));
      for (const s of [-1, 1]) term.push(bx(a, b + s * 0.05, Z0 - 0.035, 0.052, 0.022, 0.072, mat('#000')));
    }
    add('cpu_cond_reverso', [[[fundir(cuerpo, mat('#6b5a3c', { metalness: 0.2, roughness: 0.6 })), fundir(term, A.estano())]]]);
  }

  // die 20,5 x 10,5 mm (Alder Lake-S 8P+8E), orientado con el lado largo a lo largo de b
  const DW = 1.05, DL = 2.05, DA0 = CA - DW / 2, DB0 = CB - DL / 2;
  add('cpu_die', [[rango(DA0, DA0 + DW, DB0, DB0 + DL, ZS, ZD, A.silicio())]]);

  // bloques del die: baldosas finas con la distribución supuesta (u a lo ancho, w a lo largo)
  const tile = (u0, u1, w0, w1, c0, c1, m, g = 0.006) => rango(DA0 + u0 + g, DA0 + u1 - g, DB0 + w0 + g, DB0 + w1 - g, c0, c1, m);
  const bloque = (col, rects) => fundir(rects.map(r => tile(...r, ZD, ZT, A.silicio())), mat(col, { metalness: 0.35, roughness: 0.4 }));
  const fila = (n, u0, u1, w0, w1) => Array.from({ length: n }, (_, i) => [u0 + (u1 - u0) * i / n, u0 + (u1 - u0) * (i + 1) / n, w0, w1]);
  const pc = [...fila(4, 0, DW, 0.20, 0.62), ...fila(4, 0, DW, 1.12, 1.54)];
  const ec = [...fila(4, 0, DW / 2, 1.54, 1.80), ...fila(4, DW / 2, DW, 1.54, 1.80)];
  const l3 = [...fila(5, 0, DW, 0.62, 0.82), ...fila(5, 0, DW, 0.92, 1.12)];
  const mk = (id, col, rects) => add(id, [[bloque(col, rects)]]);
  mk('cpu_die_pcores', '#c0392b', pc);
  mk('cpu_die_ecores', '#2c7fb8', ec);
  mk('cpu_die_l3', '#d6a317', l3);
  mk('cpu_die_anillo', '#dcdcdc', [[0, DW, 0.82, 0.92]]);
  mk('cpu_die_igpu', '#27ae60', [[0, 0.62, 1.80, DL]]);
  mk('cpu_die_imc', '#8e44ad', [[0.62, DW, 1.80, DL]]);
  mk('cpu_die_pcie', '#e67e22', [[0, 0.62, 0, 0.20]]);
  mk('cpu_die_sa', '#7f8c8d', [[0.62, DW, 0, 0.20]]);

  // núcleo P en detalle (el primero de la fila superior): 4 bloques apilados a lo largo de w
  {
    const d = (col, w0, w1) => [[tile(0, DW / 4, 0.20 + w0, 0.20 + w1, ZT, ZT2, mat(col, { metalness: 0.35, roughness: 0.4 }), 0.01)]];
    add('cpu_pcore_frontend', [d('#ff6b57', 0, 0.12)]);
    add('cpu_pcore_ejecucion', [d('#ffb02e', 0.12, 0.24)]);
    add('cpu_pcore_memoria', [d('#5ad1a0', 0.24, 0.33)]);
    add('cpu_pcore_l2', [d('#6aa7ff', 0.33, 0.42)]);
  }

  // STIM (soldadura de indio) sobre el die, IHS de cobre niquelado con pedestal, paredes y placa superior
  add('cpu_stim', [[rango(DA0, DA0 + DW, DB0, DB0 + DL, ZT2, 0.44, mat('#9aa3ad', { metalness: 0.9, roughness: 0.25 }))]]);
  {
    const m = A.niquel(), ia = 1.8, ib = 2.05, w = 0.15;
    add('cpu_ihs', [[fundir([
      rango(CA - ia, CA + ia, CB - ib, CB + ib, 0.58, 0.70, m),
      rango(DA0 - 0.05, DA0 + DW + 0.05, DB0 - 0.05, DB0 + DL + 0.05, 0.44, 0.58, m),
      rango(CA - ia, CA + ia, CB - ib, CB - ib + w, ZS, 0.58, m), rango(CA - ia, CA + ia, CB + ib - w, CB + ib, ZS, 0.58, m),
      rango(CA - ia, CA - ia + w, CB - ib, CB + ib, ZS, 0.58, m), rango(CA + ia - w, CA + ia, CB - ib, CB + ib, ZS, 0.58, m),
    ], m)]], true);
  }
  add('cpu_pasta', [[cajaR(3.0, 3.4, 0.02, 0.4, P(CA, CB, 0).x, P(CA, CB, 0).y, P(0, 0, 0.71).z, mat('#9aa0a6', { metalness: 0.5, roughness: 0.4 }))]]);

  // ======================= Disipador de torre =======================
  // contraplaca de acero con 4 espárragos y film aislante
  {
    const m = A.acero('#3a3d42'), st = [];
    const plac = rango(CA - 3.9, CA + 3.9, CB - 3.9, CB + 3.9, -0.40, -0.20, m);
    for (const sa of [-1, 1]) for (const sb of [-1, 1]) st.push(cil('z', 0.2, 0.2, 0.55, P(CA + sa * 3.9, CB + sb * 3.9, 0).x, P(CA + sa * 3.9, CB + sb * 3.9, 0).y, P(0, 0, -0.12).z, m, 12));
    add('cooler_backplate', [[[fundir([plac, ...st], m), rango(CA - 3.6, CA + 3.6, CB - 3.6, CB + 3.6, -0.20, -0.16, A.plastico('#0c0d0f'))]]]);
  }
  // soporte: cuatro barras en cuadro (patrón de 78 x 78 mm) y tornillos de mariposa
  {
    const m = A.niquel(), o = [];
    for (const s of [-1, 1]) {
      o.push(rango(CA + s * 3.9 - 0.45, CA + s * 3.9 + 0.45, CB - 4.35, CB + 4.35, 0.72, 1.0, m));
      o.push(rango(CA - 4.35, CA + 4.35, CB + s * 3.9 - 0.45, CB + s * 3.9 + 0.45, 0.72, 1.0, m));
      for (const t of [-1, 1]) {
        const q = P(CA + s * 3.9, CB + t * 3.9, 0);
        o.push(cil('z', 0.38, 0.38, 0.25, q.x, q.y, P(0, 0, 1.12).z, m, 16), cil('z', 0.17, 0.17, 1.3, q.x, q.y, P(0, 0, 0.35).z, m, 10));
      }
    }
    add('cooler_soporte', [[fundir(o, m)]]);
  }
  // base de contacto 42 x 42 mm
  add('cooler_base', [[rango(CA - 2.1, CA + 2.1, CB - 2.1, CB + 2.1, 0.72, 1.35, A.niquel())]]);
  // heatpipes: 4 tubos en U de 6 mm que cruzan la base y suben por las aletas
  {
    const m = A.cobre(), tubos = [];
    for (const b of [-1.35, -0.45, 0.45, 1.35]) tubos.push(tubo([P(11.1, CB + b, 16), P(11.1, CB + b, 3), P(11.4, CB + b, 1.5), P(12.5, CB + b, 1.05), P(13.6, CB + b, 1.5), P(13.9, CB + b, 3), P(13.9, CB + b, 16)], 0.3, m, 0.4));
    add('cooler_heatpipes', [[fundir(tubos, m)]]);
  }
  // torre de 45 aletas de aluminio con tapa
  {
    const m = A.aluminio('#c3c8ce'), fs = [];
    for (let i = 0; i < 45; i++) fs.push(rango(10.0, 15.0, CB - 5.4, CB + 5.4, 1.9 + i * 0.32 - 0.02, 1.9 + i * 0.32 + 0.02, m));
    add('cooler_aletas', [[[fundir(fs, m), rango(10.0, 15.0, CB - 5.4, CB + 5.4, 16.1, 16.3, A.aluminio('#4a4e55'))]]]);
  }
  // ventilador 120 x 25 mm: marco con aro y radios (fijo) y rotor de 9 palas (ítem 1, gira alrededor de a)
  {
    const fc = P(16.25, CB, 10), mf = A.plastico('#17181b'), mr = A.plastico('#2a2c31');
    const sh = new THREE.Shape(), h = 6, r = 0.6;
    sh.moveTo(-h + r, -h); sh.lineTo(h - r, -h); sh.quadraticCurveTo(h, -h, h, -h + r); sh.lineTo(h, h - r); sh.quadraticCurveTo(h, h, h - r, h);
    sh.lineTo(-h + r, h); sh.quadraticCurveTo(-h, h, -h, h - r); sh.lineTo(-h, -h + r); sh.quadraticCurveTo(-h, -h, -h + r, -h);
    sh.holes.push(new THREE.Path().absarc(0, 0, 5.75, 0, PI * 2, true));
    const g = new THREE.ExtrudeGeometry(sh, { depth: 2.5, bevelEnabled: false, curveSegments: 24 }); g.translate(0, 0, -1.25); g.rotateY(PI / 2);
    const marco = new THREE.Mesh(g, mf); marco.position.copy(fc);
    const fm = [marco, cil('x', 1.7, 1.7, 1.2, fc.x, fc.y, fc.z, mf, 20)];
    for (let k = 0; k < 4; k++) {   // cuatro radios del aro al motor
      const sg = new THREE.BoxGeometry(0.6, 4.2, 0.5); sg.applyMatrix4(new THREE.Matrix4().makeRotationX(PI / 4 + k * PI / 2).multiply(new THREE.Matrix4().makeTranslation(0, 3.8, 0)));
      const s = new THREE.Mesh(sg, mf); s.position.copy(fc); fm.push(s);
    }
    const pal = [];
    for (let k = 0; k < 9; k++) {
      const bg = new THREE.BoxGeometry(1.9, 3.9, 0.1);
      bg.applyMatrix4(new THREE.Matrix4().makeRotationX(k * 2 * PI / 9).multiply(new THREE.Matrix4().makeTranslation(0, 3.75, 0)).multiply(new THREE.Matrix4().makeRotationY(0.55)));
      const o = new THREE.Mesh(bg, mr); o.position.copy(fc); pal.push(o);
    }
    pal.push(cil('x', 1.9, 1.9, 2.0, fc.x, fc.y, fc.z, mr, 20), cil('x', 1.5, 1.5, 0.05, fc.x + 1.02, fc.y, fc.z, mr, 20));
    add('cooler_ventilador', [[fundir(fm, mf)], [fundir(pal, mr)]]);
    giros.push({ ids: ['cooler_ventilador:1'], e: V(1, 0, 0), c: fc, k: 3 });
  }
  // clips de alambre que sujetan el ventilador a la torre (2 por lado)
  {
    const m = A.niquel(), cl = [];
    for (const side of [-1, 1]) for (const c of [6, 14]) {
      const b = CB + side * 6.0, bi = CB + side * 5.2;
      cl.push(tubo([P(14.4, bi, c), P(14.4, b, c), P(17.6, b, c), P(17.6, bi, c)], 0.07, m, 0.1));
    }
    add('cooler_clips', [[fundir(cl, m)]]);
  }

  // ======================= Módulos DDR5-4800 de 16 GB =======================
  const MB = 8.6, LM = 6.6675, MB0 = 0.65, CT0 = 3.75, TP = 0.127, KX = -1.0;   // semilargo, borde de contactos, borde superior, espesor PCB, posición de la muesca
  const mod = (nm, a0) => {
    const yc = P(0, MB, 0).y, xc = P(a0, 0, 0).x, zc = P(0, 0, 0).z;
    const cara = (s, bu, c, db, dc, esp, m, off = 0) => bx(a0 + s * (TP / 2 + esp / 2 + off), MB + bu, c, esp, db, dc, m);
    // PMB con muesca y bordes biselados, extruido a lo ancho (normal en x)
    const pts = [[-LM + 0.12, MB0], [KX - 0.1, MB0], [KX - 0.1, MB0 + 0.28], [KX + 0.1, MB0 + 0.28], [KX + 0.1, MB0], [LM - 0.12, MB0], [LM, MB0 + 0.12], [LM, 2.1], [LM - 0.12, 2.2], [LM, 2.3], [LM, CT0], [-LM, CT0], [-LM, 2.3], [-LM + 0.12, 2.2], [-LM, 2.1], [-LM, MB0 + 0.12]];
    const sh = new THREE.Shape(pts.map(([bu, c]) => new THREE.Vector2(c + zc, yc - bu)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: TP, bevelEnabled: false }); g.rotateY(-PI / 2); g.translate(xc + TP / 2, 0, 0);
    const pcb = new THREE.Mesh(g, A.pcb('#1f3d2b'));
    // pasivos SMD (resistencias y condensadores) en ambas caras
    const pas = [];
    for (const s of [-1, 1]) for (let i = 0; i < 14; i++) pas.push(cara(s, ((i * 7 + (s > 0 ? 3 : 0)) % 17 - 8) * 0.75 + 0.2, 1.3 + ((i * 5) % 3) * 0.12 + (i % 2) * 2.1, 0.1, 0.06, 0.03, mat('#000')));
    const pasv = fundir(pas, mat('#4b4033', { metalness: 0.2, roughness: 0.6 }));
    add(`ram_${nm}_pcb`, [[[pcb, pasv]]]);

    // 8 chips DRAM de 16 Gb: 4 por cara
    const ch = [];
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) ch.push(cara(s, -2.7 + i * 1.7, 2.2, 1.45, 1.1, 0.1, A.encapsulado()));
    add(`ram_${nm}_chips`, [[fundir(ch, A.encapsulado())]]);
    // PMIC (+ dos bobinas y su condensador) en el extremo, cara +
    add(`ram_${nm}_pmic`, [[[cara(1, -5.7, 2.6, 1.0, 0.9, 0.1, A.encapsulado('#101113')), fundir([cara(1, -4.6, 2.5, 0.6, 0.5, 0.1, A.ferrita()), cara(1, -3.9, 2.5, 0.6, 0.5, 0.1, A.ferrita())], A.ferrita())]]]);
    add(`ram_${nm}_spd`, [[cara(1, 4.0, 2.6, 0.6, 0.6, 0.08, A.encapsulado('#101113'))]]);
    // contactos: 144 por cara, con la muesca como hueco
    const ct = [];
    for (const s of [-1, 1]) for (let i = 0; i < 144; i++) {
      let bu = -6.0 + i * 0.0845; if (bu > KX - 0.1) bu += 0.2;
      ct.push(bx(a0 + s * (TP / 2 + 0.004), MB + bu, MB0 + 0.2, 0.01, 0.055, 0.4, A.oro()));
    }
    add(`ram_${nm}_contactos`, [[fundir(ct, A.oro())]]);
    // heatspreader: dos placas de aluminio, puente superior y cresta
    const mh = A.aluminio('#2f3237'), pl = [];
    for (const s of [-1, 1]) pl.push(bx(a0 + s * 0.245, MB, 2.55, 0.12, 12.6, 2.7, mh));
    pl.push(bx(a0, MB, 3.82, 0.62, 12.6, 0.16, mh), bx(a0, MB, 4.02, 0.3, 11.0, 0.24, mh));
    add(`ram_${nm}_disipador`, [[fundir(pl, mh)]], true);
  };
  mod('a2', 18.8);
  mod('b2', 20.4);

  ctx.pendientes();   // siempre al final: cubos magenta para los ids que aún no tienen geometría
}
