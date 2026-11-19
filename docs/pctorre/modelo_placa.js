// Módulo «placa» del PC de torre: placa madre: PCB, zócalo e ILM, VRM (con un DrMOS abierto), chipset, zócalos DIMM, ranuras PCIe, M.2, SATA, headers, firmware y panel E/S (marco 'placa').
// Dueño: un solo agente. Lista, anclajes, explosiones y fuentes en contrato.json (filtra modulo = 'placa'); guía en CONTRATO.md.
// 66 piezas:
//   Placa madre · PCB: mb_pcb, mb_pcb_corte
//   Placa madre · Zócalo y retención: mb_socket, mb_socket_contactos, mb_ilm_marco, mb_ilm_palanca, mb_ilm_backplate, mb_socket_mlcc
//   Placa madre · VRM del CPU: mb_vrm_controlador, mb_vrm_etapas_sup, mb_vrm_etapas_izq, mb_vrm_etapa_gt, mb_vrm_etapa_aux, mb_vrm_bobinas_sup, mb_vrm_bobinas_izq, mb_vrm_cond_sup, mb_vrm_cond_izq, mb_vrm_almohadillas_sup, mb_vrm_almohadillas_izq, mb_vrm_disipador_sup, mb_vrm_disipador_izq, mb_vrm_detalle, mb_vrm_detalle_driver, mb_vrm_detalle_hs, mb_vrm_detalle_ls
//   Placa madre · Conectores de poder: mb_eps1, mb_eps2, mb_atx24
//   Placa madre · Chipset: mb_pch, mb_pch_die, mb_pch_disipador
//   Placa madre · Memoria (zócalos): mb_dimm_a1, mb_dimm_a2, mb_dimm_b1, mb_dimm_b2
//   Placa madre · Ranuras de expansión: mb_pcie1, mb_pcie2, mb_pcie3, mb_pcie4
//   Placa madre · Almacenamiento: mb_m2_1, mb_m2_1_disipador, mb_m2_2, mb_m2_2_disipador, mb_sata
//   Placa madre · Conectores internos: mb_hdr_fpanel, mb_hdr_usb2, mb_hdr_usb3, mb_hdr_usbc, mb_hdr_audio, mb_hdr_ventiladores, mb_hdr_rgb
//   Placa madre · Firmware, reloj y diagnóstico: mb_bios, mb_cmos_bateria, mb_cmos_jumper, mb_cristales, mb_debug_leds
//   Placa madre · Controladores de E/S: mb_superio, mb_lan, mb_audio_codec, mb_audio_cond
//   Placa madre · Panel trasero E/S: mb_io_cubierta, mb_io_escudo, mb_io_video, mb_io_usb, mb_io_rj45, mb_io_audio
// Ejemplo:
//   add('mb_pch', [[cajaEn('placa', [16.9, 19.1], [22.4, 24.6], [0, 0.18], A.encapsulado())]]);
export default function (ctx) {
  const { THREE, V, PI, mat, cil, rev, caja, cajaR, cajaEn, entre, tubo, fundir, en, ejeDe, pos, L, A, add, giros, mover, piezas, lienzo, mesh } = ctx;

  // ---------- helpers locales (todo en el marco «placa»: u desde el borde trasero, v desde el borde superior, c altura) ----------
  const B = (u0, u1, v0, v1, c0, c1, m) => cajaEn('placa', [u0, u1], [v0, v1], [c0, c1], m);
  const Bc = (u, v, w, d, c0, c1, m) => B(u - w / 2, u + w / 2, v - d / 2, v + d / 2, c0, c1, m);   // caja centrada: w a lo largo de u, d a lo largo de v
  const Cz = (u, v, c0, c1, r, m, seg = 14) => { const p = en('placa', u, v, (c0 + c1) / 2); return cil('z', r, r, c1 - c0, p.x, p.y, p.z, m, seg); };   // cilindro vertical
  const Cu = (u, v, c, len, r, m, seg = 10) => { const p = en('placa', u, v, c); return cil('x', r, r, len, p.x, p.y, p.z, m, seg); };            // eje a lo largo de u
  const Cv = (u, v, c, len, r, m, seg = 10) => { const p = en('placa', u, v, c); return cil('y', r, r, len, p.x, p.y, p.z, m, seg); };            // eje a lo largo de v
  const X = u => en('placa', u, 0, 0).x, Y = v => en('placa', 0, v, 0).y, Zc = c => en('placa', 0, 0, c).z;
  const rango = (n, c0, p) => Array.from({ length: n }, (_, i) => c0 + i * p);
  // placa extruida (rectángulo con huecos rectangulares) entre c0 y c1
  function forma(u0, u1, v0, v1, c0, c1, m, huecos = []) {
    const s = new THREE.Shape(); s.moveTo(X(u0), Y(v0)); s.lineTo(X(u1), Y(v0)); s.lineTo(X(u1), Y(v1)); s.lineTo(X(u0), Y(v1)); s.closePath();
    for (const [a0, a1, b0, b1] of huecos) { const h = new THREE.Path(); h.moveTo(X(a0), Y(b0)); h.lineTo(X(a0), Y(b1)); h.lineTo(X(a1), Y(b1)); h.lineTo(X(a1), Y(b0)); h.closePath(); s.holes.push(h); }
    const g = new THREE.ExtrudeGeometry(s, { depth: c1 - c0, bevelEnabled: false }); g.translate(0, 0, Zc(c0));
    return mesh(g, m);
  }
  // chip: cuerpo + patas. tipo: 'qfn' (almohadillas al ras), 'qfp' (patas de gaviota), 'soic'. n = patas por lado.
  function chip(u, v, w, d, h, tipo, n, cuerpo = A.encapsulado()) {
    const pa = [], ext = { qfn: 0.05, qfp: 0.14, soic: 0.16 }[tipo], t = (tipo === 'soic' ? 0.06 : 0.03 + 0.5 * (w / n)) * (tipo === 'qfp' ? 0.45 : 1), cp = tipo === 'qfn' ? h * 0.5 : 0.05;
    const lados = tipo === 'soic' ? [0, 1] : [0, 1, 2, 3];
    for (const s of lados) for (let i = 0; i < n; i++) {
      const sg = s % 2 ? 1 : -1;
      if (s < 2) { const uu = u - w / 2 + (i + 0.5) * w / n; pa.push(Bc(uu, v + sg * (d / 2 + ext / 2), t, ext, 0, cp, A.estano())); }
      else { const vv = v - d / 2 + (i + 0.5) * d / n; pa.push(Bc(u + sg * (w / 2 + ext / 2), vv, ext, t, 0, cp, A.estano())); }
    }
    pa.push(Bc(u - w / 2 + 0.1, v - d / 2 + 0.1, 0.07, 0.07, h, h + 0.006, A.estano()));   // marca del pin 1
    return [B(u - w / 2, u + w / 2, v - d / 2, v + d / 2, 0, h, cuerpo), fundir(pa, A.estano())];
  }
  // cabecera de pines de 2,54 mm. eje 'u': las columnas van a lo largo de u. falta = [[col,fila]] sin pin.
  function cab(u, v, cols, rows, eje, { falta = [], h = 0.85, pin = 0.7, caja: sh = true, paso: p = 0.254 } = {}) {
    const m = 0.1, lu = (eje === 'u' ? cols : rows) * p + 2 * m, lv = (eje === 'u' ? rows : cols) * p + 2 * m;
    const u0 = u - lu / 2, u1 = u + lu / 2, v0 = v - lv / 2, v1 = v + lv / 2, pins = [];
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      if (falta.some(([a, b]) => a === i && b === j)) continue;
      const a = (i - (cols - 1) / 2) * p, b = (j - (rows - 1) / 2) * p;
      pins.push(eje === 'u' ? Bc(u + a, v + b, 0.064, 0.064, 0.08, pin, A.oro()) : Bc(u + b, v + a, 0.064, 0.064, 0.08, pin, A.oro()));
    }
    const o = [];
    if (sh) o.push(fundir([forma(u0, u1, v0, v1, 0, h, A.plastico(), [[u0 + 0.05, u1 - 0.05, v0 + 0.05, v1 - 0.05]]), B(u0, u1, v0, v1, 0, 0.09, A.plastico())], A.plastico('#17181b')));
    else o.push(fundir([B(u0, u1, v0, v1, 0, 0.25, A.plastico())], A.plastico('#17181b')));
    o.push(fundir(pins, A.oro()));
    return { obj: o, u0, u1, v0, v1 };
  }
  const aletas = (u0, u1, v0, v1, c0, c1, n, eje, gr = 0.1) => Array.from({ length: n }, (_, i) => {
    const f = (i + 0.5) / n;
    return eje === 'v' ? B(u0 + f * (u1 - u0) - gr / 2, u0 + f * (u1 - u0) + gr / 2, v0, v1, c0, c1, A.aluminio()) : B(u0, u1, v0 + f * (v1 - v0) - gr / 2, v0 + f * (v1 - v0) + gr / 2, c0, c1, A.aluminio());
  });

  // ---------- PCB ----------
  const HOYOS = [[4.1, 15.3], [4.1, 28.9], [10.4, 25.4], [19.6, 27.2], [22.2, 3.4], [22.2, 28.3], [22.9, 19.2], [20.9, 17.3], [16.9, 16.4]];   // agujeros tipo ATX (supuesto: posiciones A C F G H J K L M aproximadas)
  {
    const s = new THREE.Shape(); s.moveTo(X(0), Y(0)); s.lineTo(X(24.38), Y(0)); s.lineTo(X(24.38), Y(30.48)); s.lineTo(X(0), Y(30.48)); s.closePath();
    for (const [u, v] of HOYOS) { const h = new THREE.Path(); h.absarc(X(u), Y(v), 0.19, 0, PI * 2, true); s.holes.push(h); }
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.157, bevelEnabled: false, curveSegments: 10 }); g.translate(0, 0, Zc(-0.157));
    const base = mesh(g, A.pcb('#14161a'));
    // serigrafía, trazas y vías: una sola textura sobre la cara de componentes
    const S = 84, W = 2048, H = 2560;
    const tex = lienzo(W, H, (g2) => {
      const px = u => u * S, py = v => v * S;
      g2.lineCap = 'round'; g2.lineJoin = 'round';
      g2.fillStyle = 'rgba(40,46,56,0.55)';   // planos de cobre bajo el VRM
      g2.fillRect(px(4.2), py(1.6), px(11.4), py(4)); g2.fillRect(px(4.2), py(4.2), px(2.2), py(9.4));
      const haz = (u0, v0, u1, v1, n, gap, col = '#303741', w = 2) => {
        g2.strokeStyle = col; g2.lineWidth = w;
        for (let k = 0; k < n; k++) {
          const um = (u0 + u1) / 2 + (k - n / 2) * gap * 1.4;
          g2.beginPath(); g2.moveTo(px(u0), py(v0 + k * gap)); g2.lineTo(px(um), py(v0 + k * gap)); g2.lineTo(px(um), py(v1 + k * gap)); g2.lineTo(px(u1), py(v1 + k * gap)); g2.stroke();
        }
      };
      const hazV = (u0, v0, u1, v1, n, gap) => {   // lo mismo girado: primero a lo largo de v
        g2.strokeStyle = '#303741'; g2.lineWidth = 2;
        for (let k = 0; k < n; k++) {
          const vm = (v0 + v1) / 2 + (k - n / 2) * gap * 1.4;
          g2.beginPath(); g2.moveTo(px(u0 + k * gap), py(v0)); g2.lineTo(px(u0 + k * gap), py(vm)); g2.lineTo(px(u1 + k * gap), py(vm)); g2.lineTo(px(u1 + k * gap), py(v1)); g2.stroke();
        }
      };
      haz(16.0, 6.4, 17.5, 3.0, 14, 0.12); haz(16.0, 9.6, 17.5, 11.0, 14, 0.12);          // CPU -> DIMM
      hazV(9.4, 12.4, 6.0, 16.3, 16, 0.1); hazV(12.6, 12.4, 12.6, 16.3, 16, 0.1);          // CPU -> PCIe x16
      hazV(13.4, 12.3, 13.8, 14.1, 8, 0.1);                                                // CPU -> M.2_1
      haz(15.9, 11.6, 18.2, 22.2, 10, 0.1);                                                // DMI CPU -> PCH
      hazV(16.8, 24.6, 13.0, 21.9, 8, 0.1); haz(19.3, 23.0, 22.3, 21.6, 8, 0.1);          // PCH -> M.2_2, SATA
      hazV(18, 21.9, 12.5, 23.1, 8, 0.1); haz(16.8, 23.5, 12.0, 28.4, 6, 0.1);            // PCH -> PCIe x16 (x4)
      haz(3.1, 17.6, 4.2, 18.6, 6, 0.1); haz(3.1, 25.8, 4.0, 24.0, 6, 0.1);               // LAN y audio
      g2.strokeStyle = '#3a414b'; g2.lineWidth = 4;                                         // pistas gruesas de poder
      for (const [a, b, c, d] of [[8, 4.8, 8, 12.7], [8, 2.5, 14.5, 2.5], [14.5, 2.5, 16.8, 3.2], [6.4, 1.2, 6.4, 3.6]]) { g2.beginPath(); g2.moveTo(px(a), py(b)); g2.lineTo(px(c), py(d)); g2.stroke(); }
      // vías
      const via = (u, v) => { g2.fillStyle = '#767c85'; g2.beginPath(); g2.arc(px(u), py(v), 3.2, 0, PI * 2); g2.fill(); g2.fillStyle = '#14161a'; g2.beginPath(); g2.arc(px(u), py(v), 1.2, 0, PI * 2); g2.fill(); };
      let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 380; i++) via(0.6 + rnd() * 23, 0.6 + rnd() * 29);
      for (let u = 8.7; u < 16.4; u += 0.42) { via(u, 5.3); via(u, 12.7); }
      // agujeros de montaje: corona plateada
      for (const [u, v] of HOYOS) { g2.strokeStyle = '#b9bec5'; g2.lineWidth = 7; g2.beginPath(); g2.arc(px(u), py(v), 0.32 * S, 0, PI * 2); g2.stroke(); g2.strokeStyle = 'rgba(235,238,242,0.8)'; g2.lineWidth = 2; g2.beginPath(); g2.arc(px(u), py(v), 0.5 * S, 0, PI * 2); g2.stroke(); }
      // serigrafía
      g2.fillStyle = 'rgba(235,238,242,0.82)'; g2.strokeStyle = 'rgba(235,238,242,0.7)'; g2.lineWidth = 2;
      const txt = (t, u, v, rot = 0, sz = 20) => { g2.save(); g2.translate(px(u), py(v)); g2.rotate(rot); g2.font = `bold ${sz}px sans-serif`; g2.textAlign = 'center'; g2.fillText(t, 0, 0); g2.restore(); };
      const rect = (u0, u1, v0, v1) => g2.strokeRect(px(u0), py(v0), px(u1 - u0), py(v1 - v0));
      rect(8.5, 16.5, 5.2, 12.8); txt('LGA1700', 12.5, 13.3, 0, 22); txt('CPU', 12.5, 4.8, 0, 22);
      ['A1', 'A2', 'B1', 'B2'].forEach((n, i) => txt('DDR5_' + n, 18 + i * 0.8, 15.75, -PI / 2, 16));
      txt('EATX12V', 6.4, 1.75, 0, 16); txt('ATX_PWR', 21.9, 10.6, -PI / 2, 18); txt('CPU_FAN', 14.5, 1.65, 0, 14);
      txt('PCIEX16_1', 3.5, 16.2, 0, 14); txt('PCIEX1_1', 3.5, 18.4, 0, 14); txt('PCIEX16_2', 3.5, 22.3, 0, 14); txt('PCIEX1_2', 3.5, 26.4, 0, 14);
      txt('M.2_1', 5.0, 13.2, 0, 16); txt('M.2_2', 4.8, 20.1, 0, 16);
      txt('SATA 1-4', 21.2, 23.5, -PI / 2, 16); txt('F_PANEL', 20.5, 28.55, 0, 14); txt('USB_2', 16, 28.55, 0, 14); txt('CLR_CMOS', 17.8, 28.55, 0, 12);
      txt('AAFP', 2, 28.55, 0, 14); txt('RGB/ARGB', 12, 28.55, 0, 13); txt('USB3_1', 22.2, 16.2, -PI / 2, 14); txt('USB_C', 22.2, 13.7, -PI / 2, 14);
      txt('CPU', 22.0, 4.6, 0, 11); txt('DRAM', 22.0, 5.3, 0, 11); txt('VGA', 22.0, 6.0, 0, 11); txt('BOOT', 22.0, 6.7, 0, 11);
      txt('Z690 REF · ATX', 17.5, 20.0, 0, 20); txt('DDR5 · PCIe 5.0', 12.5, 29.3, 0, 15); txt('BAT', 14, 27.6, 0, 14);
      g2.beginPath(); g2.moveTo(px(2.7), py(19)); g2.lineTo(px(2.7), py(23.4)); g2.stroke();   // línea de aislamiento analógico
    });
    const tm = mat('#ffffff', { map: tex, transparent: true, metalness: 0, roughness: 0.7, depthWrite: false });
    const sup = mesh(new THREE.PlaneGeometry(24.38, 30.48), tm, X(12.19), Y(15.24), Zc(0.004));
    add('mb_pcb', [[base, sup]]);
  }
  // corte didáctico: cada capa sale por separado
  {
    const caps = [['#1f5c3a', 0.012], ['#c07a3e', 0.018], ['#d9c58a', 0.034], ['#c07a3e', 0.018], ['#b59a4f', 0.02], ['#c07a3e', 0.018], ['#d9c58a', 0.02], ['#c07a3e', 0.018], ['#1f5c3a', 0.012]];
    const tot = caps.reduce((a, [, t]) => a + t, 0), k = 0.157 / tot, dir0 = PIEZAS_EXP('mb_pcb_corte');
    let c = 0;
    add('mb_pcb_corte', caps.map(([col, t], i) => {
      const o = B(1, 2, 29.75, 30.25, c - t * k, c, mat(col, { metalness: col === '#c07a3e' ? 0.9 : 0.1, roughness: 0.5 })); c -= t * k;
      return [[o], dir0.clone().add(V(0, 0, i * 0.6))];
    }));
  }
  function PIEZAS_EXP(id) { return V(...piezas.find(p => p.id === id).explosion); }

  // ---------- zócalo LGA1700 e ILM (centro u 12,5, v 9; patrón de montaje de 78 x 78 mm) ----------
  const SU = 12.5, SV = 9, TORN = [[-3.9, -3.9], [3.9, -3.9], [-3.9, 3.9], [3.9, 3.9]].map(([a, b]) => [SU + a, SV + b]);
  const VENT = [SU - 2.45, SU + 2.45, SV - 2.1, SV + 2.1];   // ventana del CPU (45 x 37,5 mm con holgura)
  {
    const m = A.plastico('#26282c');
    const cuerpo = forma(9.1, 15.9, 5.7, 12.3, 0, 0.27, m, [VENT]);
    const llaves = fundir([Bc(SU - 2.45, SV - 0.9, 0.12, 0.5, 0.1, 0.27, A.plastico()), Bc(SU + 2.45, SV + 1.2, 0.12, 0.3, 0.1, 0.27, A.plastico()), B(9.1, 9.6, 5.7, 6.2, 0.27, 0.3, A.plastico())], m);
    const sold = fundir([B(9.0, 15.9, 5.62, 5.7, 0, 0.1, A.estano()), B(9.0, 15.9, 12.3, 12.38, 0, 0.1, A.estano())], A.estano());
    const marca = B(9.25, 9.55, 11.8, 12.1, 0.27, 0.285, A.oro());   // triángulo dorado del pin 1 (aprox.)
    add('mb_socket', [[cuerpo, llaves, sold, marca]]);
  }
  {
    const S = 10, w = Math.round(4.9 * S * 1.0), h = Math.round(4.2 * S * 1.0);
    const tex = lienzo(490, 420, (g) => {
      g.fillStyle = '#17181a'; g.fillRect(0, 0, 490, 420);
      for (let i = 0; i < 59; i++) for (let j = 0; j < 51; j++) {
        const x = 8 + i * 8.2, y = 8 + j * 8.1;
        if (x > 150 && x < 340 && y > 140 && y < 280) continue;     // zona central sin contactos
        if (x > 340 && y > 20 && y < 60) continue;
        g.fillStyle = '#d4a640'; g.beginPath(); g.arc(x, y, 2.6, 0, PI * 2); g.fill();
        g.fillStyle = '#f2d684'; g.beginPath(); g.arc(x - 0.8, y - 0.8, 1, 0, PI * 2); g.fill();
      }
    });
    const pl = mesh(new THREE.PlaneGeometry(4.8, 4.1), mat('#ffffff', { map: tex, metalness: 0.7, roughness: 0.35 }), X(SU), Y(SV), Zc(0.2));
    const marco = fundir([B(VENT[0], VENT[1], VENT[2] - 0.1, VENT[2], 0.1, 0.2, A.plastico()), B(VENT[0], VENT[1], VENT[3], VENT[3] + 0.1, 0.1, 0.2, A.plastico())], A.plastico('#26282c'));
    add('mb_socket_contactos', [[pl, marco]]);
  }
  {
    const m = A.acero('#aeb4bb'); m.metalness = 0.8;
    const ancho = [VENT[0] + 0.3, VENT[1] - 0.3, VENT[2] + 0.3, VENT[3] - 0.3];
    const placaM = forma(9.4, 15.6, 6.2, 11.8, 0.4, 0.48, m, [ancho]);
    const orejas = fundir(TORN.map(([u, v]) => { const ou = u < SU ? 1 : -1, ov = v < SV ? 1 : -1; return B(Math.min(u, u + ou * 0.9), Math.max(u, u + ou * 0.9), Math.min(v, v + ov * 0.9), Math.max(v, v + ov * 0.9), 0.4, 0.48, m); }), m);
    const bisagra = fundir([B(8.55, 9.4, 6.9, 7.5, 0.4, 0.62, m), B(8.55, 9.4, 10.5, 11.1, 0.4, 0.62, m), B(15.6, 16.15, 8.6, 9.6, 0.4, 0.55, m)], m);
    const tornillos = fundir(TORN.map(([u, v]) => Cz(u, v, 0.48, 0.66, 0.22, A.acero('#6c727a'), 6)), A.acero('#6c727a'));
    add('mb_ilm_marco', [[placaM, orejas, bisagra, tornillos]]);
  }
  {
    const m = A.acero('#c3c8ce'); m.metalness = 0.8;
    const p = [[16.45, 5.9, 0.42], [16.45, 11.9, 0.42], [16.7, 12.55, 0.5], [17.1, 12.9, 0.95], [17.1, 14.0, 1.05]].map(a => en('placa', ...a));
    const segs = p.slice(1).map((q, i) => entre(p[i], q, 0.07, m, 8));
    const gancho = [entre(p[0], en('placa', 16.0, 5.9, 0.44), 0.07, m, 8), entre(en('placa', 16.45, 8.9, 0.42), en('placa', 15.55, 8.9, 0.5), 0.07, m, 8)];
    const mango = B(16.9, 17.3, 13.4, 14.1, 0.98, 1.08, A.plastico('#303338'));
    add('mb_ilm_palanca', [[fundir([...segs, ...gancho], m), mango]]);
  }
  {
    const m = A.acero('#8d939b'); m.metalness = 0.7;
    const marco = forma(8.3, 16.7, 4.8, 13.2, -0.42, -0.3, m, [[9.8, 15.2, 6.4, 11.6]]);
    const postes = fundir(TORN.map(([u, v]) => Cz(u, v, -0.42, 0.34, 0.12, A.acero('#6c727a'), 8)), A.acero('#6c727a'));
    add('mb_ilm_backplate', [[marco, postes]]);
  }
  {   // MLCC de desacoplo en el reverso, bajo el zócalo
    const cu = [], ex = [];
    for (let i = 0; i < 7; i++) for (let j = 0; j < 8; j++) {
      if (i > 1 && i < 5 && j > 1 && j < 6) continue;
      const u = 10.1 + i * 0.4 + (j % 2) * 0.1, v = 7.0 + j * 0.34;
      cu.push(Bc(u, v, 0.09, 0.16, -0.26, -0.157, A.estano())); ex.push(Bc(u - 0.05, v, 0.04, 0.16, -0.26, -0.157, A.estano()), Bc(u + 0.05, v, 0.04, 0.16, -0.26, -0.157, A.estano()));
    }
    add('mb_socket_mlcc', [[fundir(cu, mat('#8a6f4a', { metalness: 0.1, roughness: 0.6 })), fundir(ex, A.estano())]]);
  }

  // ---------- VRM ----------
  const ST_SUP = rango(7, 7.5, 1), ST_IZQ = rango(8, 5.0, 1);   // etapas: fila superior (u) y columna izquierda (v)
  const etapa = (u, v) => ({ cu: Bc(u, v, 0.55, 0.55, 0, 0.09, A.encapsulado()), pads: (() => { const o = []; for (let i = 0; i < 4; i++) { const a = -0.19 + i * 0.127; o.push(Bc(u + a, v - 0.3, 0.07, 0.07, 0, 0.03, A.estano()), Bc(u + a, v + 0.3, 0.07, 0.07, 0, 0.03, A.estano()), Bc(u - 0.3, v + a, 0.07, 0.07, 0, 0.03, A.estano()), Bc(u + 0.3, v + a, 0.07, 0.07, 0, 0.03, A.estano())); } o.push(Bc(u - 0.18, v - 0.18, 0.08, 0.08, 0.09, 0.096, A.estano())); return o; })() });
  const grupoEtapas = (lista) => { const e = lista.map(([u, v]) => etapa(u, v)); return [fundir(e.map(x => x.cu), A.encapsulado()), fundir(e.flatMap(x => x.pads), A.estano())]; };
  {   // controlador PWM digital (QFN 6 x 6) con su encapsulado
    const [c, p] = chip(16.8, 4.0, 0.62, 0.62, 0.08, 'qfn', 12);
    const pasivos = fundir([[16.2, 3.6], [16.2, 4.2], [17.5, 3.5], [17.5, 4.5], [16.5, 4.65], [17.1, 4.65]].map(([u, v]) => Bc(u, v, 0.12, 0.06, 0, 0.05, A.estano())), A.estano());
    add('mb_vrm_controlador', [[c, p, pasivos]]);
  }
  add('mb_vrm_etapas_sup', [grupoEtapas(ST_SUP.map(u => [u, 2.6]))]);
  add('mb_vrm_etapas_izq', [grupoEtapas(ST_IZQ.map(v => [4.9, v]))]);
  add('mb_vrm_etapa_gt', [grupoEtapas([[16.8, 2.6]])]);
  add('mb_vrm_etapa_aux', [grupoEtapas([[4.9, 13.4]])]);
  const bob = (lista) => { const f = lista.map(([u, v]) => Bc(u, v, 0.74, 0.74, 0, 0.5, A.ferrita())), t = lista.flatMap(([u, v]) => [Bc(u - 0.37, v, 0.04, 0.6, 0.02, 0.18, A.estano()), Bc(u + 0.37, v, 0.04, 0.6, 0.02, 0.18, A.estano())]), r = lista.map(([u, v]) => Bc(u, v, 0.5, 0.5, 0.5, 0.53, A.ferrita()));
    return [fundir(f, A.ferrita()), fundir(t, A.estano()), fundir(r, mat('#555a62', { metalness: 0.6, roughness: 0.4 }))]; };
  add('mb_vrm_bobinas_sup', [bob(rango(7, 8.0, 1).map(u => [u, 3.6]))]);
  add('mb_vrm_bobinas_izq', [bob(ST_IZQ.map(v => [6.0, v]))]);
  const cond = (lista) => [fundir(lista.map(([u, v]) => Cz(u, v, 0, 0.8, 0.28, A.aluminio('#b7b9bd'), 14)), A.aluminio('#b7b9bd')), fundir(lista.map(([u, v]) => Cz(u, v, 0.8, 0.82, 0.27, A.goma(), 14)), A.goma()), fundir(lista.map(([u, v]) => Cz(u, v, 0.02, 0.1, 0.3, A.goma(), 14)), A.goma())];
  add('mb_vrm_cond_sup', [cond(rango(8, 7.5, 1).map(u => [u, 4.5]))]);
  add('mb_vrm_cond_izq', [cond(ST_IZQ.map(v => [7.2, v]))]);
  const almo = mat('#9aa3ad', { metalness: 0, roughness: 0.9 });
  add('mb_vrm_almohadillas_sup', [[B(7.1, 14.0, 2.2, 3.0, 0.1, 0.2, almo)]]);
  add('mb_vrm_almohadillas_izq', [[B(4.55, 5.25, 4.5, 12.5, 0.1, 0.2, almo)]]);
  {
    const al = A.aluminio('#3b4048'), f = aletas(6.9, 14.1, 1.75, 3.1, 0.65, 1.6, 14, 'v', 0.14);
    add('mb_vrm_disipador_sup', [[fundir([B(6.8, 14.2, 1.7, 3.15, 0.2, 0.65, al), B(6.8, 14.2, 3.0, 3.15, 0.65, 1.05, al)], al), fundir(f, al), fundir([Cz(6.9, 2.45, 0.2, 0.8, 0.06, A.niquel(), 8), Cz(14.1, 2.45, 0.2, 0.8, 0.06, A.niquel(), 8)], A.niquel())]], true);
  }
  {
    const al = A.aluminio('#3b4048'), f = aletas(4.3, 5.55, 4.15, 12.85, 0.7, 1.8, 14, 'u', 0.14);
    add('mb_vrm_disipador_izq', [[fundir([B(4.3, 5.55, 4.1, 12.9, 0.2, 0.7, al)], al), fundir(f, al)]], true);
  }
  // DrMOS abierto (16.ª etapa): paquete y marco de conexión; los chips van aparte
  {
    const em = A.encapsulado('#1a1b1e');
    const loseta = B(15.1, 16.1, 1.9, 3.2, 0, 0.04, em);
    const paredes = fundir([B(15.1, 15.17, 1.9, 3.2, 0.04, 0.2, em), B(16.03, 16.1, 1.9, 3.2, 0.04, 0.2, em), B(15.1, 16.1, 1.9, 1.97, 0.04, 0.2, em), B(15.1, 16.1, 3.13, 3.2, 0.04, 0.2, em)], em);
    const tapa = B(15.1, 15.6, 1.9, 3.2, 0.2, 0.24, A.encapsulado('#26282c'));   // media tapa: el resto queda abierto
    const marco = fundir([B(15.18, 15.72, 2.5, 3.1, 0.04, 0.07, A.cobre()), B(15.78, 16.02, 2.5, 3.1, 0.04, 0.07, A.cobre()), B(15.3, 15.9, 2.0, 2.42, 0.04, 0.07, A.cobre())], A.cobre());
    const patas = fundir(rango(5, 15.25, 0.18).flatMap(u => [Bc(u, 1.88, 0.09, 0.1, 0, 0.04, A.estano()), Bc(u, 3.22, 0.09, 0.1, 0, 0.04, A.estano())]), A.estano());
    add('mb_vrm_detalle', [[loseta, paredes, tapa, marco, patas]]);
  }
  const pastilla = (u0, u1, v0, v1, col) => { const d = B(u0, u1, v0, v1, 0.07, 0.12, mat(col, { metalness: 0.6, roughness: 0.3 })); const pd = fundir([Bc((u0 + u1) / 2, (v0 + v1) / 2, (u1 - u0) * 0.6, (v1 - v0) * 0.6, 0.12, 0.125, A.oro())], A.oro()); return [d, pd]; };
  add('mb_vrm_detalle_driver', [pastilla(15.4, 15.8, 2.1, 2.42, '#4a4f6a')]);
  add('mb_vrm_detalle_hs', [pastilla(15.28, 15.58, 2.52, 3.05, '#3b3f58')]);
  add('mb_vrm_detalle_ls', [pastilla(15.62, 15.95, 2.52, 3.05, '#3b3f58')]);

  // ---------- conectores de poder Mini-Fit (paso 4,2 mm) ----------
  function minifit(uc, vc, nc, nr, eje, h = 1.1, latchPos = 1) {
    const p = 0.42, lc = nc * p + 0.22, lr = nr * p + 0.36, cu = eje === 'u' ? lc : lr, cv = eje === 'u' ? lr : lc;
    const celdas = [];
    for (let i = 0; i < nc; i++) for (let j = 0; j < nr; j++) { const a = (i - (nc - 1) / 2) * p, b = (j - (nr - 1) / 2) * p; celdas.push(eje === 'u' ? [uc + a, vc + b] : [uc + b, vc + a]); }
    const hu = [uc - cu / 2, uc + cu / 2, vc - cv / 2, vc + cv / 2], m = A.plastico('#e8e6df');
    const huecos = celdas.map(([u, v]) => [u - 0.15, u + 0.15, v - 0.15, v + 0.15]);
    const carc = fundir([forma(hu[0], hu[1], hu[2], hu[3], 0.3, h, m, huecos), B(hu[0], hu[1], hu[2], hu[3], 0, 0.3, m)], m);
    const pines = fundir(celdas.map(([u, v]) => Bc(u, v, 0.1, 0.1, 0.3, h - 0.25, A.oro())), A.oro());
    const lat = eje === 'u' ? B(hu[0] + 0.3, hu[1] - 0.3, hu[3], hu[3] + 0.16 * latchPos, 0.35, h * 0.9, m) : B(hu[0] - 0.16, hu[0], hu[2] + 0.5, hu[3] - 0.5, 0.35, h * 0.9, m);
    return [carc, pines, lat];
  }
  add('mb_eps1', [minifit(5.2, 0.75, 4, 2, 'u')]);
  add('mb_eps2', [minifit(7.6, 0.75, 4, 2, 'u')]);
  add('mb_atx24', [minifit(23.4, 10.6, 12, 2, 'v', 1.2)]);

  // ---------- chipset Z690 ----------
  {
    const sub = B(16.75, 19.25, 22.4, 24.6, 0, 0.12, mat('#23402e', { metalness: 0.2, roughness: 0.6 }));
    const relleno = fundir([B(17.45, 18.55, 23.05, 23.1, 0.12, 0.2, A.plastico('#3a3d40')), B(17.45, 18.55, 23.9, 23.95, 0.12, 0.2, A.plastico('#3a3d40')), B(17.45, 17.5, 23.05, 23.95, 0.12, 0.2, A.plastico('#3a3d40')), B(18.5, 18.55, 23.05, 23.95, 0.12, 0.2, A.plastico('#3a3d40'))], A.plastico('#3a3d40'));
    const smd = fundir([[16.9, 22.55], [19.1, 22.55], [16.9, 24.45], [19.1, 24.45], [17.4, 22.52], [18.6, 24.48]].map(([u, v]) => Bc(u, v, 0.09, 0.05, 0.12, 0.16, A.estano())), A.estano());
    add('mb_pch', [[sub, relleno, smd]]);
    add('mb_pch_die', [[B(17.5, 18.5, 23.1, 23.9, 0.12, 0.2, A.silicio()), fundir([B(17.62, 17.9, 23.2, 23.8, 0.2, 0.205, A.oro()), B(18.1, 18.38, 23.2, 23.8, 0.2, 0.205, A.oro())], A.oro())]]);
  }
  {
    const al = A.aluminio('#3b4048'), base = B(16.2, 19.8, 21.7, 25.3, 0.3, 0.55, al);
    const f = aletas(16.3, 19.7, 21.8, 25.2, 0.55, 0.9, 9, 'v', 0.16);
    const placa2 = B(17.0, 19.0, 22.5, 24.5, 0.55, 0.62, A.aluminio('#d4a640'));
    const pernos = fundir([[16.45, 21.95], [19.55, 21.95], [16.45, 25.05], [19.55, 25.05]].map(([u, v]) => Cz(u, v, 0.1, 0.62, 0.09, A.niquel(), 8)), A.niquel());
    add('mb_pch_disipador', [[base, fundir(f, al), placa2, pernos]], true);
  }

  // ---------- zócalos DIMM DDR5 ----------
  ['a1', 'a2', 'b1', 'b2'].forEach((n, i) => {
    const uc = 18 + i * 0.8, c = i % 2 ? '#2e3238' : '#16181c', m = A.plastico(c), v0 = 1.95, v1 = 15.25;
    const carc = fundir([forma(uc - 0.36, uc + 0.36, v0, v1, 0.15, 0.9, m, [[uc - 0.11, uc + 0.11, v0 + 0.25, v1 - 0.25]]), B(uc - 0.36, uc + 0.36, v0, v1, 0, 0.15, m), B(uc - 0.11, uc + 0.11, v0 + 4.85, v0 + 5.0, 0.15, 0.7, m)], m);
    const seg = [];
    for (let k = 0; k < 2; k++) for (const [a, b] of [[v0 + 0.4, v0 + 4.8], [v0 + 5.05, v1 - 0.4]]) seg.push(B(uc + (k ? 0.1 : -0.115), uc + (k ? 0.115 : -0.1), a, b, 0.2, 0.62, A.oro()));
    const clip = fundir([B(uc - 0.3, uc + 0.3, v1, v1 + 0.28, 0, 0.95, A.plastico('#4a4f56')), B(uc - 0.09, uc + 0.09, v1 - 0.22, v1, 0.55, 0.8, A.plastico('#4a4f56'))], A.plastico('#4a4f56'));
    add('mb_dimm_' + n, [[carc, fundir(seg, A.oro()), clip]]);
  });

  // ---------- ranuras PCIe ----------
  function ranura(v, len, { armor = false, latch = false } = {}) {
    const u0 = 4.3, m = A.plastico('#111214'), key = u0 + 0.8, huecos = [[u0 + 0.15, u0 + len - 0.15, v - 0.09, v + 0.09]];
    const carc = [forma(u0, u0 + len, v - 0.55, v + 0.55, 0.15, 1.1, m, huecos), B(u0, u0 + len, v - 0.55, v + 0.55, 0, 0.15, m), B(key, key + 0.14, v - 0.09, v + 0.09, 0.15, 0.7, m)];
    if (latch) carc.push(B(u0 + len, u0 + len + 0.28, v - 0.4, v + 0.4, 0, 1.0, m), B(u0 + len - 0.2, u0 + len, v - 0.12, v + 0.12, 0.7, 0.9, m));
    const oro = [], sw = len > 3 ? [[u0 + 0.25, key - 0.03], [key + 0.17, u0 + len - 0.25]] : [[u0 + 0.25, key - 0.03], [key + 0.17, u0 + len - 0.25]];
    for (const [a, b] of sw) oro.push(B(a, b, v - 0.095, v - 0.08, 0.2, 0.8, A.oro()), B(a, b, v + 0.08, v + 0.095, 0.2, 0.8, A.oro()));
    const o = [fundir(carc, m), fundir(oro, A.oro())];
    if (armor) { const mm = A.acero('#b9bec5'); mm.metalness = 0.85; o.push(fundir([B(u0 - 0.02, u0 + len + 0.02, v - 0.6, v - 0.55, 0.1, 1.15, mm), B(u0 - 0.02, u0 + len + 0.02, v + 0.55, v + 0.6, 0.1, 1.15, mm), B(u0 - 0.07, u0 - 0.02, v - 0.6, v + 0.6, 0.1, 1.15, mm), B(u0, u0 + len, v - 0.6, v - 0.45, 1.1, 1.15, mm), B(u0, u0 + len, v + 0.45, v + 0.6, 1.1, 1.15, mm)], mm)); }
    return [o];
  }
  add('mb_pcie1', ranura(17, 8.9, { armor: true, latch: true }));
  add('mb_pcie2', ranura(19.032, 2.5));
  add('mb_pcie3', ranura(23.096, 8.9, { latch: true }));
  add('mb_pcie4', ranura(27.16, 2.5));

  // ---------- M.2 y SATA ----------
  function m2(uAnc, vc, uCentro, ancho = 2.2) {
    const m = A.plastico('#1c1e22');
    const carc = fundir([B(uAnc - 0.3, uAnc + 0.3, vc - ancho / 2 - 0.1, vc + ancho / 2 + 0.1, 0, 0.55, m), B(uAnc - 0.4, uAnc - 0.3, vc - ancho / 2 - 0.1, vc - ancho / 2 + 0.1, 0, 0.45, m), B(uAnc - 0.4, uAnc - 0.3, vc + ancho / 2 - 0.1, vc + ancho / 2 + 0.1, 0, 0.45, m)], m);
    const o = [];
    for (const c of [0.18, 0.34]) o.push(B(uAnc - 0.33, uAnc - 0.3, vc - ancho / 2 + 0.1, vc - 0.15, c, c + 0.07, A.oro()), B(uAnc - 0.33, uAnc - 0.3, vc + 0.05, vc + ancho / 2 - 0.1, c, c + 0.07, A.oro()));
    const su = uCentro - 4.0, soporte = fundir([Cz(su, vc, 0, 0.45, 0.14, A.niquel(), 6), Cz(su, vc, 0.45, 0.5, 0.08, A.niquel(), 6), Cz(su, vc, 0.5, 0.58, 0.17, A.niquel(), 12), B(su - 0.12, su + 0.12, vc - 0.025, vc + 0.025, 0.58, 0.6, A.acero('#2b2e33'))], A.niquel());   // tornillo M.2 (cabeza ranurada)
    return [[carc, fundir(o, A.oro()), soporte]];
  }
  add('mb_m2_1', m2(13.8, 14.6, 9.6));
  add('mb_m2_2', m2(13.2, 21.064, 9.0));
  const dis2 = (uc, vc, id) => {
    const al = A.aluminio('#3b4048'), c0 = 1.0;
    add(id, [[B(uc - 4.0, uc + 4.0, vc - 1.1, vc + 1.1, c0, c0 + 0.22, al), fundir(aletas(uc - 3.9, uc + 3.9, vc - 1.0, vc + 1.0, c0 + 0.22, c0 + 0.45, 12, 'v', 0.14), al), B(uc - 3.4, uc - 1.2, vc - 0.7, vc + 0.7, c0 + 0.45, c0 + 0.5, A.aluminio('#d4a640'))]]);
  };
  dis2(9.6, 14.6, 'mb_m2_1_disipador'); dis2(9.0, 21.064, 'mb_m2_2_disipador');
  {   // 4 puertos SATA en ángulo recto
    const vs = rango(4, 21.3, 1.45), g = A.plastico('#17181b');
    add('mb_sata', [[fundir(vs.map(v => B(22.5, 24.3, v - 0.65, v + 0.65, 0, 0.9, g)), g), fundir(vs.map(v => B(24.28, 24.32, v - 0.5, v + 0.5, 0.1, 0.75, A.goma())), A.goma()),
      fundir(vs.flatMap(v => [B(23.4, 24.3, v - 0.5, v + 0.5, 0.1, 0.2, A.plastico('#34383e')), B(23.4, 24.3, v - 0.5, v - 0.4, 0.1, 0.75, A.plastico('#34383e'))]), A.plastico('#34383e')),
      fundir(vs.flatMap(v => rango(7, v - 0.38, 0.127).map(x => B(23.5, 24.2, x - 0.03, x + 0.03, 0.2, 0.23, A.oro()))), A.oro())]]);
  }

  // ---------- headers ----------
  const unir = (hs, mp = A.plastico('#17181b')) => [fundir(hs.map(h => h.obj[0]), mp), fundir(hs.map(h => h.obj[1]), A.oro())];
  add('mb_hdr_fpanel', [cab(20.5, 29.6, 5, 2, 'u', { falta: [[4, 1]] }).obj]);
  add('mb_hdr_usb2', [cab(16, 29.6, 5, 2, 'u', { falta: [[4, 1]] }).obj]);
  add('mb_hdr_usb3', [cab(23.6, 16.65, 10, 2, 'v', { falta: [[9, 1]], h: 0.9 }).obj]);
  add('mb_hdr_usbc', [cab(23.6, 14.3, 10, 2, 'v', { paso: 0.18, h: 0.8 }).obj]);
  add('mb_hdr_audio', [cab(2, 29.6, 5, 2, 'u', { falta: [[4, 1]] }).obj]);
  add('mb_hdr_ventiladores', [unir([cab(14.5, 0.8, 4, 1, 'u', { h: 0.7, pin: 0.6 }), cab(23.4, 2.0, 1, 4, 'v', { h: 0.7, pin: 0.6 }), cab(9.0, 29.6, 4, 1, 'u', { h: 0.7, pin: 0.6 }), cab(5.7, 29.6, 4, 1, 'u', { h: 0.7, pin: 0.6 })])]);
  add('mb_hdr_rgb', [unir([cab(11.3, 29.6, 4, 1, 'u', { h: 0.7, pin: 0.6 }), cab(12.95, 29.6, 4, 1, 'u', { falta: [[2, 0]], h: 0.7, pin: 0.6 })])]);

  // ---------- firmware, reloj y diagnóstico ----------
  add('mb_bios', [[...chip(17.5, 27.5, 0.5, 0.4, 0.15, 'soic', 4), fundir([[17.0, 27.0], [18.1, 27.9]].map(([u, v]) => Bc(u, v, 0.12, 0.06, 0, 0.05, A.estano())), A.estano())]]);
  {
    const base = fundir([Cz(14, 26.2, 0, 0.34, 1.15, A.plastico('#1c1e22'), 28), B(12.7, 13.0, 25.8, 26.6, 0, 0.5, A.plastico('#1c1e22')), B(15.0, 15.3, 25.8, 26.6, 0, 0.5, A.plastico('#1c1e22'))], A.plastico('#1c1e22'));
    const pila = fundir([Cz(14, 26.2, 0.1, 0.42, 1.0, A.niquel(), 28)], A.niquel());
    const clip = fundir([B(12.9, 15.1, 26.05, 26.35, 0.42, 0.47, A.niquel()), B(12.7, 13.0, 26.05, 26.35, 0.1, 0.5, A.niquel()), B(15.0, 15.3, 26.05, 26.35, 0.1, 0.5, A.niquel())], A.niquel());
    add('mb_cmos_bateria', [[base, pila, clip]]);
  }
  {
    const h = cab(17.6, 29.6, 3, 1, 'u', { caja: false, h: 0.7, pin: 0.62 });
    add('mb_cmos_jumper', [[...h.obj, B(17.1, 17.62, 29.4, 29.8, 0.3, 0.62, A.plastico('#8a1f1f'))]]);
  }
  {
    const cer = mat('#cfc9b8', { metalness: 0.1, roughness: 0.6 });
    add('mb_cristales', [[B(16.24, 16.56, 20.87, 21.13, 0, 0.07, cer), fundir([B(16.27, 16.53, 20.9, 21.1, 0.07, 0.1, A.niquel())], A.niquel()), fundir([Cv(15.6, 20.55, 0.1, 0.4, 0.1, A.niquel(), 8), Cv(15.6, 20.55, 0.1, 0.06, 0.11, A.estano(), 8), Bc(15.35, 20.2, 0.08, 0.12, 0, 0.05, A.estano()), Bc(15.85, 20.2, 0.08, 0.12, 0, 0.05, A.estano()), Bc(16.0, 21.4, 0.12, 0.08, 0, 0.05, A.estano())], A.niquel())]]);
  }
  {
    const cols = ['#ff3b30', '#ffb020', '#f0f4ff', '#35d46a'];
    add('mb_debug_leds', [cols.map((c, i) => Bc(22.8, 4.6 + i * 0.7, 0.16, 0.1, 0, 0.06, mat(c, { emissive: c, emissiveIntensity: 0.6, metalness: 0, roughness: 0.4 })))]);
  }

  // ---------- controladores de E/S ----------
  add('mb_superio', [chip(11, 28.4, 1.4, 1.4, 0.16, 'qfp', 24)]);
  add('mb_lan', [chip(2.6, 17.6, 0.6, 0.6, 0.09, 'qfn', 8)]);
  add('mb_audio_codec', [chip(2.6, 25.8, 0.7, 0.7, 0.1, 'qfp', 12)]);
  {
    const pts = [1.3, 2.1].flatMap(u => [21.6, 22.5, 23.4].map(v => [u, v])), oro = mat('#8a6a2f', { metalness: 0.3, roughness: 0.55 });
    add('mb_audio_cond', [[fundir(pts.map(([u, v]) => Cz(u, v, 0, 0.55, 0.25, oro, 12)), oro), fundir(pts.map(([u, v]) => Cz(u, v, 0.55, 0.57, 0.24, A.goma(), 12)), A.goma()), B(2.72, 2.78, 19, 23.4, 0, 0.012, mat('#e8e8e8', { metalness: 0, roughness: 0.8 }))]]);
  }

  // ---------- panel trasero E/S: los conectores salen 0,8 cm del borde para tocar el escudo (u = -0,85) ----------
  const F = -0.8;
  {
    const sh = A.niquel();
    add('mb_io_video', [[fundir([B(F, 2.4, 1.7, 3.3, 0.05, 0.85, sh), B(F, 2.4, 1.7, 3.3, 0.9, 1.55, sh)], sh), fundir([B(F - 0.02, F + 0.03, 1.8, 3.2, 0.12, 0.78, A.goma()), B(F - 0.02, F + 0.03, 1.85, 3.15, 0.95, 1.48, A.goma())], A.goma())]]);
  }
  {
    const sh = A.niquel(), vs = [[4.2, 5.7], [5.8, 7.3], [7.4, 8.9]], goma = A.goma();
    add('mb_io_usb', [[fundir([...vs.map(([a, b]) => B(F, 1.6, a, b, 0, 1.55, sh)), B(F, 1.2, 9.1, 10.0, 0.05, 0.65, sh)], sh),
      fundir(vs.flatMap(([a, b]) => [B(F - 0.02, F + 0.03, a + 0.1, b - 0.1, 0.08, 0.7, goma), B(F - 0.02, F + 0.03, a + 0.1, b - 0.1, 0.85, 1.47, goma)]).concat([B(F - 0.02, F + 0.03, 9.2, 9.9, 0.15, 0.55, goma)]), goma),
      fundir(vs.slice(0, 2).flatMap(([a, b]) => [B(F + 0.03, 0.9, a + 0.15, b - 0.15, 0.3, 0.4, mat('#2b6fe0')), B(F + 0.03, 0.9, a + 0.15, b - 0.15, 1.07, 1.17, mat('#2b6fe0'))]), mat('#2b6fe0')),
      fundir([B(F + 0.03, 0.9, vs[2][0] + 0.15, vs[2][1] - 0.15, 0.3, 0.4, A.plastico('#26282c')), B(F + 0.03, 0.9, vs[2][0] + 0.15, vs[2][1] - 0.15, 1.07, 1.17, A.plastico('#26282c')), B(F + 0.03, 0.8, 9.3, 9.8, 0.3, 0.4, A.plastico('#26282c'))], A.plastico('#26282c'))]]);
  }
  {
    const sh = A.niquel();
    add('mb_io_rj45', [[B(F, 2.2, 10.7, 12.3, 0, 1.45, sh), fundir([B(F - 0.02, F + 0.03, 10.95, 12.05, 0.25, 1.2, A.goma())], A.goma()),
      fundir(rango(8, 10.95 + 0.07, 0.14).map(v => B(F + 0.03, 0.6, v - 0.025, v + 0.025, 0.35, 0.4, A.oro())), A.oro()),
      B(F - 0.02, F + 0.03, 10.78, 10.98, 0.05, 0.2, mat('#35d46a', { emissive: '#35d46a', emissiveIntensity: 0.4 })), B(F - 0.02, F + 0.03, 12.02, 12.22, 0.05, 0.2, mat('#ffb020', { emissive: '#ffb020', emissiveIntensity: 0.4 })),
      fundir([B(2.2, 3.1, 10.75, 12.25, 0, 1.0, A.plastico('#1e2024')), ...rango(8, 10.85, 0.2).map(v => B(3.1, 3.2, v, v + 0.07, 0, 0.1, A.estano()))], A.plastico('#1e2024'))]]);
  }
  {
    const cols = [['#2b6fe0', '#35c46a', '#ff7bb0'], ['#1c1e22', '#ff8c2a', '#9aa0a8']], aros = [], aguj = [], o = [];
    cols.forEach((fila, r) => fila.forEach((col, k) => {
      const v = 13.7 + k, c0 = r * 0.95, cc = c0 + 0.465;
      o.push(B(F, 1.0, v - 0.48, v + 0.48, c0, c0 + 0.93, mat(col, { metalness: 0.1, roughness: 0.55 })));
      aros.push(Cu(F - 0.03, v, cc, 0.08, 0.3, A.niquel(), 14)); aguj.push(Cu(F - 0.04, v, cc, 0.1, 0.2, A.goma(), 12));
    }));
    add('mb_io_audio', [[...o, fundir(aros, A.niquel()), fundir(aguj, A.goma())]]);
  }
  {
    const m = A.plastico('#1b1d21');
    add('mb_io_cubierta', [[fundir([B(0.0, 3.7, 0.45, 15.75, 1.95, 2.15, m), B(3.55, 3.7, 0.45, 15.75, 0, 2.15, m), B(0.0, 3.7, 0.45, 0.55, 0, 2.15, m), B(0.0, 3.7, 15.65, 15.75, 0, 2.15, m)], m), fundir(rango(6, 1.0, 0.5).map(u => B(u, u + 0.12, 4.0, 12.0, 2.15, 2.25, m)), m), B(0.9, 2.9, 12.6, 15.3, 2.15, 2.2, A.aluminio('#c7ccd2'))]], true);
  }
  {   // escudo de E/S: chapa con ventanas para cada grupo de conectores
    const hu = [[1.45, 3.55, -0.05, 1.7], [4.0, 10.3, -0.05, 1.7], [10.5, 12.5, -0.05, 1.6], [13.0, 16.4, -0.05, 2.0]];
    const s = new THREE.Shape(), sx = c => 7.4 - c, sy = v => 45 - v;
    s.moveTo(sx(-1.0), sy(-0.6)); s.lineTo(sx(4.7), sy(-0.6)); s.lineTo(sx(4.7), sy(16.9)); s.lineTo(sx(-1.0), sy(16.9)); s.closePath();
    for (const [v0, v1, c0, c1] of hu) { const h = new THREE.Path(); h.moveTo(sx(c0), sy(v0)); h.lineTo(sx(c0), sy(v1)); h.lineTo(sx(c1), sy(v1)); h.lineTo(sx(c1), sy(v0)); h.closePath(); s.holes.push(h); }
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: false }); g.rotateY(PI / 2); g.translate(-22.475, 0, 0);
    const chapa = mesh(g, A.acero('#9aa1a9'));
    const dedos = [];
    for (const [v0, v1, c0, c1] of hu) for (let k = 0; k < 7; k++) { const v = v0 + 0.2 + k * (v1 - v0 - 0.4) / 6; dedos.push(B(-0.85, -0.6, v - 0.04, v + 0.04, c1, c1 + 0.15, A.niquel()), B(-0.85, -0.6, v - 0.04, v + 0.04, c0 - 0.15, c0, A.niquel())); }
    add('mb_io_escudo', [[chapa, fundir(dedos, A.niquel())]]);
  }

  // @@
  ctx.pendientes();   // siempre al final: cubos magenta para los ids que aún no tienen geometría
}
