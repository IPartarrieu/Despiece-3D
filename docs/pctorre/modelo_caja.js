// Módulo «caja» del PC de torre: caja, paneles y filtros, panel frontal E/S, ventiladores de caja (con el trasero despiezado) y TODOS los cables.
// Dueño: un solo agente. Lista, anclajes, explosiones y fuentes en contrato.json (filtra modulo = 'caja'); guía en CONTRATO.md.
// 45 piezas:
//   Caja · Estructura: caja_chasis, caja_bandeja, caja_separadores, caja_tornillos_placa, caja_cubierta_fuente, caja_jaula_hdd, caja_soporte_ssd, caja_tapas_slots, caja_patas, caja_ojales, caja_bridas
//   Caja · Paneles y filtros: caja_panel_vidrio, caja_panel_derecho, caja_panel_superior, caja_filtro_superior, caja_frontal, caja_filtro_frontal, caja_filtro_inferior
//   Caja · Panel frontal E/S: caja_io_placa, caja_boton_power, caja_boton_reset, caja_leds, caja_usb_a_frontal, caja_usb_c_frontal, caja_jack_audio
//   Caja · Ventiladores: caja_vent_frontal_1, caja_vent_frontal_2, caja_vent_frontal_3, caja_vent_trasero, caja_vent_trasero_rotor, caja_vent_trasero_estator, caja_vent_trasero_placa, caja_vent_trasero_rodamiento
//   Cables · Cables: cable_ac, cable_atx24, cable_eps1, cable_eps2, cable_12v2x6, cable_sata_poder, cable_sata_datos, cable_panel_frontal, cable_usb3_frontal, cable_usbc_frontal, cable_audio_frontal, cable_ventiladores
// Todo en cm. Las piezas repetidas se funden con «lote» (una malla por material) para respetar el presupuesto de mallas.
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const PI = Math.PI;
const V = (x, y, z) => new T.Vector3(x, y, z);

// ---------- helpers locales ----------
// lote: acumula geometrías y las funde en una sola malla por material
function lt() {
  const gs = [];
  const o = {
    add(g, M) {
      g = g.index ? g.toNonIndexed() : g;
      if (M) g.applyMatrix4(M);
      for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
      if (!g.attributes.uv) g.setAttribute('uv', new T.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      g.clearGroups(); gs.push(g); return o;
    },
    caja(w, h, d, x, y, z, M) { const g = new T.BoxGeometry(w, h, d); g.translate(x, y, z); return o.add(g, M); },
    bb(x0, x1, y0, y1, z0, z1) { return o.caja(x1 - x0, y1 - y0, z1 - z0, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); },
    cil(ax, r1, r2, h, x, y, z, seg = 16, M) {
      const g = new T.CylinderGeometry(r1, r2, h, seg);
      if (ax === 'x') g.rotateZ(-PI / 2); else if (ax === 'z') g.rotateX(PI / 2);
      g.translate(x, y, z); return o.add(g, M);
    },
    mesh(m) { return new T.Mesh(mergeGeometries(gs), m); },
  };
  return o;
}
// base de cada plano de chapa: (s, t, n) -> mundo. x: s=y t=z n=x · y: s=z t=x n=y · z: s=x t=y n=z
const BAS = { x: new T.Matrix4().makeBasis(V(0, 1, 0), V(0, 0, 1), V(1, 0, 0)), y: new T.Matrix4().makeBasis(V(0, 0, 1), V(1, 0, 0), V(0, 1, 0)), z: new T.Matrix4() };
const ST = { x: (s, t, n) => [n, s, t], y: (s, t, n) => [t, n, s], z: (s, t, n) => [s, t, n] };
const rrp = (p, x0, y0, x1, y1, r = 0) => {
  r = Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2);
  if (r <= 0.001) { p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y1); p.lineTo(x0, y1); p.closePath(); return p; }
  p.moveTo(x0 + r, y0); p.lineTo(x1 - r, y0); p.absarc(x1 - r, y0 + r, r, -PI / 2, 0, false); p.lineTo(x1, y1 - r); p.absarc(x1 - r, y1 - r, r, 0, PI / 2, false);
  p.lineTo(x0 + r, y1); p.absarc(x0 + r, y1 - r, r, PI / 2, PI, false); p.lineTo(x0, y0 + r); p.absarc(x0 + r, y0 + r, r, PI, PI * 1.5, false); p.closePath(); return p;
};
// chapa extruida en el plano de «eje»: coordenada c0, espesor esp, contorno [s0,s1]x[t0,t1] redondeado r y huecos
// (hueco = [s,t,radio] círculo o [s0,s1,t0,t1,r?] rectángulo)
function chapa(eje, c0, esp, [s0, s1], [t0, t1], huecos = [], r = 0, seg = 6) {
  const sh = rrp(new T.Shape(), s0, t0, s1, t1, r);
  for (const h of huecos) {
    const p = new T.Path();
    if (h.length === 3) p.absarc(h[0], h[1], h[2], 0, PI * 2, true); else rrp(p, h[0], h[2], h[1], h[3], h[4] || 0);
    sh.holes.push(p);
  }
  const g = new T.ExtrudeGeometry(sh, { depth: esp, bevelEnabled: false, curveSegments: seg });
  const M = BAS[eje].clone(); M.setPosition(eje === 'x' ? c0 : 0, eje === 'y' ? c0 : 0, eje === 'z' ? c0 : 0);
  g.applyMatrix4(M); return g;
}
// disco o anillo extruido (círculo en el plano s,t)
function disco(eje, c0, esp, s, t, r, rin = 0, seg = 20) {
  const sh = new T.Shape(); sh.absarc(s, t, r, 0, PI * 2, false);
  if (rin) { const p = new T.Path(); p.absarc(s, t, rin, 0, PI * 2, true); sh.holes.push(p); }
  const g = new T.ExtrudeGeometry(sh, { depth: esp, bevelEnabled: false, curveSegments: seg });
  const M = BAS[eje].clone(); M.setPosition(eje === 'x' ? c0 : 0, eje === 'y' ? c0 : 0, eje === 'z' ? c0 : 0);
  g.applyMatrix4(M); return g;
}
// caja alineada dada en coordenadas (s,t,n) del plano
function barra(L, e, [s0, s1], [t0, t1], [n0, n1]) {
  const p = ST[e](s0, t0, n0), q = ST[e](s1, t1, n1);
  L.bb(Math.min(p[0], q[0]), Math.max(p[0], q[0]), Math.min(p[1], q[1]), Math.max(p[1], q[1]), Math.min(p[2], q[2]), Math.max(p[2], q[2]));
}
// malla de barritas cruzadas (filtros de polvo, frente de malla)
function reja(L, e, [s0, s1], [t0, t1], [n0, n1], paso, gr) {
  const e1 = (n1 - n0) * 0.2;
  for (let s = s0 + paso / 2; s < s1; s += paso) barra(L, e, [s - gr / 2, s + gr / 2], [t0, t1], [n0, n1]);
  for (let t = t0 + paso / 2; t < t1; t += paso) barra(L, e, [s0, s1], [t - gr / 2, t + gr / 2], [n0 + e1, n1 - e1]);
}
const ranuras = (s0, s1, t0, paso, n, anch, r = 0.15) => Array.from({ length: n }, (_, i) => [s0, s1, t0 + i * paso, t0 + i * paso + anch, r]);

export default function (ctx) {
  const { en, L: LY, A, add, giros, mat } = ctx;
  const latón = () => mat('#b5893a', { metalness: 0.8, roughness: 0.35 });
  const negro = () => A.plastico('#0c0d0f');
  const Ace = () => A.acero('#2b2e33');

  // ================= ESTRUCTURA =================
  {   // chasis
    const m = lt();
    const ran = Array.from({ length: 7 }, (_, k) => { const y = 28 - k * 2.032; return [y - 0.7, y + 0.7, -7.0, 4.3, 0.3]; });
    m.add(chapa('x', -22.5, 0.1, [1.0, 47.9], [-10.7, 10.7], [[29.3, 45.1, -7.78, -3.34, 0.2], [37, 3.6, 5.7], [42, 8.6, 0.2], [32, 8.6, 0.2], [42, -1.4, 0.2], [32, -1.4, 0.2], [1.4, 10.05, -7.6, 7.6, 0.4], ...ran]));
    m.add(chapa('y', 1.0, 0.1, [-10.7, 10.7], [-22.4, 22.4], [[-6.5, 6.5, -21.0, -7.5, 0.6]]));
    m.add(chapa('x', 21.1, 0.1, [1.0, 47.9], [-10.7, 10.7], [[8, 1.2, 5.7], [20.5, 1.2, 5.7], [33, 1.2, 5.7]]));
    m.add(chapa('y', 47.5, 0.1, [-10.7, 10.7], [-22.4, 22.4], [[-8.3, 8.3, -17, 10, 0.5], [-5.2, 6.8, 15.8, 21.0, 0.3]]));
    for (const x of [-22.0, 20.9]) for (const z of [-10.4, 10.4]) m.bb(x - 0.3, x + 0.3, 1.1, 47.5, z - 0.3, z + 0.3);
    for (const z of [-10.4, 10.4]) for (const y of [1.1, 47.2]) m.bb(-22.3, 21.2, y - 0.2, y + 0.2, z - 0.3, z + 0.3);
    for (const x of [-22.0, 20.9]) for (const y of [1.1, 47.2]) m.bb(x - 0.3, x + 0.3, y - 0.2, y + 0.2, -10.7, 10.7);
    add('caja_chasis', [[m.mesh(Ace())]]);
  }
  {   // bandeja de la placa madre
    const m = lt();
    const hu = [[-14.0, -4.2, 31.0, 41.0, 0.4], [3.2, 5.2, 30.5, 37.5, 0.5], [-20.5, -13.5, 45.6, 47.0, 0.5], [-7.5, -0.5, 11.5, 13.7, 0.5], [3.2, 5.2, 17.75, 22.25, 0.5],
      [18.0, 19.0, 3.0, 42.0, 0.5], [15, 20, 43.5, 46, 0.6]];
    for (const y of [14.8, 25.2, 28.8, 17.0, 23.0]) hu.push([-0.1, 0.4, y - 0.5, y + 0.5, 0.15], [4.5, 5.0, y - 0.5, y + 0.5, 0.15]);
    for (const [x, y] of [[7.7, 26.7], [16.3, 26.7], [7.7, 33.3], [16.3, 33.3]]) hu.push([x, y, 0.18]);
    for (let i = 0; i < 6; i++) hu.push([-20 + i * 1.6, -19 + i * 1.6, 8.0, 10.0, 0.3]);
    m.add(chapa('z', -8.3, 0.1, [-22.3, 20.9], [1.1, 47.4], hu, 0.4));
    add('caja_bandeja', [[m.mesh(A.acero('#34373d'))]]);
  }
  const AGU = [[4.1, 15.3], [4.1, 28.9], [10.4, 25.4], [19.6, 27.2], [22.2, 3.4], [22.2, 28.3], [22.9, 19.2], [20.9, 17.3], [16.9, 16.4]];   // agujeros ATX de la placa (u, v) en cm
  {   // separadores M3 (latón hexagonal)
    const c = lt(), r = lt();
    for (const [u, v] of AGU) { const p = en('placa', u, v, 0); c.cil('z', 0.31, 0.31, 0.635, p.x, p.y, -7.878, 6); r.cil('z', 0.14, 0.14, 0.17, p.x, p.y, -7.475, 10); }
    add('caja_separadores', [[c.mesh(latón()), r.mesh(A.niquel())]]);
  }
  {   // tornillos de la placa
    const h = lt(), s = lt();
    for (const [u, v] of AGU) {
      const p = en('placa', u, v, 0);
      h.cil('z', 0.27, 0.27, 0.12, p.x, p.y, -7.34, 14); h.cil('z', 0.33, 0.33, 0.03, p.x, p.y, -7.415, 14); h.cil('z', 0.12, 0.12, 0.15, p.x, p.y, -7.47, 8);
      s.bb(p.x - 0.2, p.x + 0.2, p.y - 0.025, p.y + 0.025, -7.282, -7.276); s.bb(p.x - 0.025, p.x + 0.025, p.y - 0.2, p.y + 0.2, -7.282, -7.276);
    }
    add('caja_tornillos_placa', [[h.mesh(A.acero('#4a4f56')), s.mesh(negro())]]);
  }
  {   // cubierta de la fuente (shroud)
    const m = lt(), a = lt();
    m.add(chapa('y', 11.5, 0.1, [-8.1, 10.4], [-22.3, -1.4], [[-8.05, -3.5, -7.5, -0.5, 0.4], [3.0, 8.0, -8.0, -2.0, 0.4], ...ranuras(-6, 8, -21.5, 1.2, 6, 0.5)]));
    m.add(chapa('x', -1.5, 0.1, [1.1, 11.6], [-8.1, 10.4], [[2.0, 8.0, -5.0, 5.0, 0.5], [6.0, 11.0, 3.0, 8.0, 0.4]]));
    m.add(chapa('z', 10.2, 0.1, [-22.3, -1.4], [1.1, 11.6], [...ranuras(-19.5, -4.0, 2.4, 1.0, 6, 0.5), [-3.8, -2.2, 3.0, 8.5, 0.3]]));
    a.bb(-22.3, -1.4, 11.45, 11.65, 10.15, 10.45); a.bb(-1.55, -1.35, 11.45, 11.65, -8.1, 10.4);
    add('caja_cubierta_fuente', [[m.mesh(A.acero('#1e2024')), a.mesh(A.aluminio('#8e949b'))]]);
  }
  {   // jaula de discos de 3,5"
    const m = lt(), g = lt();
    m.add(chapa('y', 1.9, 0.1, [-5.7, 5.7], [3.0, 19.0], [[-4.5, 4.5, 6.0, 9.5, 0.4], [-4.5, 4.5, 11.5, 15.5, 0.4]]));
    m.add(chapa('y', 6.4, 0.1, [-5.7, 5.7], [3.0, 19.0], [[-4.5, 4.5, 5.0, 8.5, 0.4], [-4.5, 4.5, 11.0, 16.0, 0.4]]));
    m.add(chapa('y', 11.7, 0.1, [-5.7, 5.7], [3.0, 19.0], [[-4.5, 4.5, 6.0, 16.0, 0.6]]));
    for (const z of [-5.75, 5.6]) m.add(chapa('z', z, 0.15, [3.0, 19.0], [1.9, 11.8], [...ranuras(5.0, 17.0, 4.5, 2.0, 3, 0.6, 0.25), ...[0, 1, 2].map(i => [3.5 + 2.86 + i * 4.4, 3.0, 0.2])]));
    for (const z of [-5.34, 5.34]) for (const a of [2.86, 7.62, 10.16]) g.cil('z', 0.22, 0.22, 0.52, 3.5 + a, 2.82, z, 10);
    add('caja_jaula_hdd', [[m.mesh(A.acero('#34373d')), g.mesh(A.goma())]]);
  }
  {   // soporte de SSD 2,5" detrás de la bandeja
    const m = lt(), s = lt();
    m.add(chapa('z', -9.1, 0.1, [6.6, 17.4], [25.8, 34.2], [[9.0, 15.0, 28.0, 32.0, 0.8]], 0.3));
    for (const x of [7.0, 17.0]) for (const y of [26.1, 33.9]) { m.cil('z', 0.22, 0.22, 0.8, x, y, -8.7, 10); s.cil('z', 0.3, 0.3, 0.12, x, y, -9.22, 12); }
    add('caja_soporte_ssd', [[m.mesh(A.acero('#34373d')), s.mesh(A.acero('#4a4f56'))]]);
  }
  {   // tapas de ranuras PCIe (5 de las 7)
    const m = lt(), s = lt();
    for (let k = 2; k < 7; k++) {
      const y = 28 - k * 2.032;
      m.add(chapa('x', -22.47, 0.09, [y - 0.65, y + 0.65], [-7.0, 4.3], [[y - 0.2, y + 0.2, -5.5, -3.0, 0.2], [y - 0.2, y + 0.2, -2.0, 0.5, 0.2], [y - 0.2, y + 0.2, 1.5, 3.5, 0.2]]));
      m.bb(-22.47, -22.28, y - 0.5, y + 0.5, 4.3, 5.1); s.cil('x', 0.25, 0.25, 0.1, -22.52, y, 4.7, 10);
    }
    add('caja_tapas_slots', [[m.mesh(A.acero('#3a3d43')), s.mesh(A.niquel())]]);
  }
  {   // patas
    const g = lt(), p = lt();
    for (const x of [-19, 19]) for (const z of [-8.8, 8.8]) { g.cil('y', 1.5, 1.5, 0.45, x, 0.225, z, 20); p.cil('y', 1.2, 1.4, 0.55, x, 0.725, z, 20); }
    add('caja_patas', [[g.mesh(A.goma()), p.mesh(A.plastico('#1c1d20'))]]);
  }
  {   // pasacables de goma
    const m = lt();
    for (const h of [[3.2, 5.2, 30.5, 37.5], [-20.5, -13.5, 45.6, 47.0], [-7.5, -0.5, 11.5, 13.7], [3.2, 5.2, 17.75, 22.25]])
      m.add(chapa('z', -8.38, 0.3, [h[0] - 0.3, h[1] + 0.3], [h[2] - 0.3, h[3] + 0.3], [[h[0] + 0.12, h[1] - 0.12, h[2] + 0.12, h[3] - 0.12, 0.3]], 0.5));
    add('caja_ojales', [[m.mesh(A.goma())]]);
  }
  {   // bridas y velcro
    const v = lt(), z = lt();
    const anillo = (L, y, w, x0, x1, z0, z1, t) => { L.bb(x0, x1, y - w / 2, y + w / 2, z0, z0 + t); L.bb(x0, x1, y - w / 2, y + w / 2, z1 - t, z1); L.bb(x0, x0 + t, y - w / 2, y + w / 2, z0, z1); L.bb(x1 - t, x1, y - w / 2, y + w / 2, z0, z1); };
    for (const y of [14.8, 25.2, 28.8]) anillo(v, y, 1.0, 0.2, 4.6, -10.15, -8.35, 0.1);
    for (const y of [17.0, 23.0]) { anillo(z, y, 0.25, 0.4, 4.4, -10.0, -8.4, 0.05); z.bb(4.3, 4.7, y - 0.15, y + 0.15, -9.0, -8.7); }
    add('caja_bridas', [[v.mesh(A.plastico('#101113')), z.mesh(A.plastico('#d8d6cf'))]]);
  }

  // ================= PANELES Y FILTROS =================
  {   // vidrio templado
    const sc = [[-21.0, 2.2, 0.35], [21.0, 2.2, 0.35], [-21.0, 46.6, 0.35], [21.0, 46.6, 0.35]];
    const v = chapa('z', 10.48, 0.4, [-21.9, 21.9], [1.3, 47.5], sc, 1.0);
    const f = chapa('z', 10.43, 0.05, [-21.9, 21.9], [1.3, 47.5], [[-20.9, 20.9, 2.3, 46.5, 0.6], ...sc], 1.0);
    const k = lt(), w = lt();
    for (const [x, y] of sc) { k.cil('z', 0.5, 0.5, 0.45, x, y, 11.1, 16); w.cil('z', 0.42, 0.42, 0.06, x, y, 10.9, 14); }
    add('caja_panel_vidrio', [[new T.Mesh(v, A.vidrio()), new T.Mesh(f, A.plastico('#050506')), k.mesh(A.acero('#25272b')), w.mesh(A.goma())]]);
  }
  {   // panel derecho
    const m = lt(), t = lt();
    m.add(chapa('z', -10.73, 0.1, [-21.9, 21.9], [1.3, 47.9], [[-21.0, 5, 0.35], [-21.0, 43, 0.35]], 0.8));
    m.bb(-21.9, 21.9, 1.3, 1.65, -10.63, -10.3); m.bb(-21.9, 21.9, 47.55, 47.9, -10.63, -10.3); m.bb(-21.9, -21.55, 1.3, 47.9, -10.63, -10.3); m.bb(21.55, 21.9, 1.3, 47.9, -10.63, -10.3);
    for (const x of [-15, 0, 15]) m.bb(x - 0.3, x + 0.3, 3, 46, -10.65, -10.55);
    for (const y of [5, 43]) t.cil('z', 0.45, 0.45, 0.4, -21.0, y, -10.95, 16);
    add('caja_panel_derecho', [[m.mesh(Ace()), t.mesh(A.acero('#3c3f45'))]]);
  }
  const IOX = 18.5;   // x del panel frontal E/S
  {   // panel superior
    const hu = [...ranuras(-7.4, 7.4, -17.5, 1.0, 28, 0.45, 0.22), [-2.16, -0.64, 17.67, 18.43, 0.2], [-2.16, -0.64, 18.67, 19.43, 0.2], [-4.15, -3.05, IOX - 0.26, IOX + 0.26, 0.2],
      [0.55, IOX, 0.2], [1.25, IOX, 0.2], [2.0, IOX, 0.33], [3.4, IOX, 0.85], [5.0, IOX, 0.55]];
    const m = chapa('y', 47.85, 0.1, [-10.4, 10.4], [-21.9, 21.9], hu, 0.6);
    const b = lt(); b.bb(20.6, 21.8, 47.85, 47.97, -9.6, 9.6);
    add('caja_panel_superior', [[new T.Mesh(m, Ace()), b.mesh(A.plastico('#1a1b1e'))]]);
  }
  {   // filtro superior magnético
    const f = lt(), r = lt();
    f.add(chapa('y', 47.98, 0.14, [-7.5, 9.5], [-17, 11], [[-7.1, 9.1, -16.6, 10.6, 0.2]], 0.3));
    reja(r, 'y', [-7.1, 9.1], [-16.6, 10.6], [48.03, 48.07], 0.25, 0.04);
    add('caja_filtro_superior', [[f.mesh(A.acero('#3a3d43')), r.mesh(A.plastico('#202226'))]]);
  }
  {   // frontal de malla
    const f = lt(), r = lt(), a = lt();
    f.add(chapa('x', 21.5, 0.8, [1.2, 47.9], [-10.5, 10.5], [[2.2, 46.0, -9.4, 9.4, 0.6]], 1.0));
    reja(r, 'z', [-9.4, 9.4], [2.2, 46.0], [0, 0], 0.5, 0.08);
    const rr_ = lt(); reja(rr_, 'x', [2.2, 46.0], [-9.4, 9.4], [21.78, 21.98], 0.5, 0.08);
    a.bb(21.9, 22.3, 46.4, 46.55, -9.0, 9.0);
    add('caja_frontal', [[f.mesh(A.plastico('#1a1b1e')), rr_.mesh(A.plastico('#0f1012')), a.mesh(A.aluminio('#8e949b'))]]);
  }
  {   // filtro frontal
    const f = lt(), r = lt();
    f.add(chapa('x', 21.2, 0.1, [2.0, 46.5], [-9.4, 9.4], [[2.2, 46.3, -9.2, 9.2, 0.3]], 0.4));
    reja(r, 'x', [2.2, 46.3], [-9.2, 9.2], [21.22, 21.28], 0.3, 0.05);
    add('caja_filtro_frontal', [[f.mesh(A.plastico('#26282c')), r.mesh(A.plastico('#3a3d42'))]]);
  }
  {   // filtro inferior (extraíble)
    const f = lt(), r = lt(), t = lt();
    f.add(chapa('y', 0.85, 0.1, [-7.0, 7.0], [-20.5, -7.5], [[-6.6, 6.6, -20.1, -7.9, 0.2]], 0.2));
    reja(r, 'y', [-6.6, 6.6], [-20.1, -7.9], [0.88, 0.92], 0.3, 0.05);
    t.bb(-21.4, -20.5, 0.75, 0.95, -3, 3); t.bb(-21.4, -21.2, 0.3, 0.95, -3, 3);
    add('caja_filtro_inferior', [[f.mesh(A.plastico('#26282c')), r.mesh(A.plastico('#3a3d42')), t.mesh(A.plastico('#141518'))]]);
  }

  // ================= PANEL FRONTAL E/S =================
  const PY = 47.0, PT = 47.16, TOP = 47.92;   // PCB del panel E/S: y 47,0..47,16; bocas de puertos a ras del panel superior
  {   // placa del panel E/S
    const p = lt(), c = lt(), h = lt(), n = lt();
    p.add(chapa('y', PY, 0.16, [-4.6, 6.4], [16.5, 20.5], [[-4.2, 16.9, 0.15], [-4.2, 20.1, 0.15], [6.0, 16.9, 0.15], [6.0, 20.1, 0.15]], 0.25));
    c.bb(16.6, 17.3, PT, PT + 0.12, 4.8, 5.5);
    for (let i = 0; i < 6; i++) c.bb(19.0 + (i % 3) * 0.4, 19.25 + (i % 3) * 0.4, PT, PT + 0.08, 4.0 + Math.floor(i / 3) * 0.4, 4.2 + Math.floor(i / 3) * 0.4);
    for (const [x, z, l] of [[17.1, -2.4, 2.74], [18.4, -2.4, 2.2], [17.1, 1.25, 1.5]]) {   // cabezales USB 3, USB-C y audio, bajo la placa
      h.bb(x - 0.35, x + 0.35, PY - 0.14, PY, z - l / 2, z + l / 2);
      const nn = Math.round((l - 0.2) / (l > 2.5 ? 0.254 : l > 2 ? 0.2 : 0.254));
      for (let i = 0; i < nn; i++) for (const dx of [-0.1, 0.1]) n.bb(x + dx - 0.03, x + dx + 0.03, PY - 0.4, PY - 0.14, z + (i - (nn - 1) / 2) * (l > 2.5 ? 0.254 : l > 2 ? 0.2 : 0.254) - 0.03, z + (i - (nn - 1) / 2) * (l > 2.5 ? 0.254 : l > 2 ? 0.2 : 0.254) + 0.03);
    }
    add('caja_io_placa', [[p.mesh(A.pcb('#1d3a2a')), c.mesh(A.encapsulado()), h.mesh(A.plastico('#101113')), n.mesh(A.oro())]]);
  }
  {   // botón de encendido
    const r = lt(), c = lt(), s = lt();
    r.add(disco('y', 47.95, 0.15, 3.4, IOX, 0.8, 0.6, 24)); c.cil('y', 0.58, 0.58, 0.32, IOX, 48.06, 3.4, 20);
    s.cil('y', 0.22, 0.22, 0.75, IOX, 47.55, 3.4, 10); s.bb(IOX - 0.3, IOX + 0.3, PT, 47.4, 3.1, 3.7);
    add('caja_boton_power', [[r.mesh(A.aluminio('#aeb4bb')), c.mesh(A.plastico('#303236')), s.mesh(A.plastico('#101113'))]]);
  }
  {   // botón de reinicio
    const c = lt(), s = lt();
    c.cil('y', 0.27, 0.27, 0.14, IOX, 47.77, 2.0, 14); s.cil('y', 0.12, 0.12, 0.6, IOX, 47.5, 2.0, 8); s.bb(IOX - 0.25, IOX + 0.25, PT, 47.3, 1.75, 2.25);
    add('caja_boton_reset', [[c.mesh(A.acero('#6a6f76')), s.mesh(A.plastico('#101113'))]]);
  }
  {   // LED de encendido (blanco) y de disco (ámbar)
    const b = lt(), w = lt(), a = lt();
    for (const z of [0.55, 1.25]) b.cil('y', 0.17, 0.17, 0.25, IOX, PT + 0.125, z, 10);
    w.cil('y', 0.14, 0.14, 0.5, IOX, 47.62, 0.55, 10); a.cil('y', 0.14, 0.14, 0.5, IOX, 47.62, 1.25, 10);
    add('caja_leds', [[b.mesh(A.plastico('#101113')), w.mesh(mat('#e8f4ff', { emissive: '#bcd8ff', emissiveIntensity: 0.7 })), a.mesh(mat('#ffb030', { emissive: '#ff8a10', emissiveIntensity: 0.7 }))]]);
  }
  {   // USB-A ×2 (USB 3, lengüeta azul)
    const c = lt(), t = lt(), o = lt();
    for (const x of [18.05, 19.05]) {
      c.add(chapa('y', PT, TOP - PT, [-2.13, -0.67], [x - 0.35, x + 0.35], [[-2.06, -0.74, x - 0.28, x + 0.28, 0.05]]));
      t.bb(x - 0.07, x + 0.07, PT, TOP - 0.25, -2.0, -0.8);
      for (let i = 0; i < 4; i++) o.bb(x + 0.07, x + 0.085, PT, TOP - 0.3, -1.9 + i * 0.28, -1.78 + i * 0.28);
    }
    add('caja_usb_a_frontal', [[c.mesh(A.niquel()), t.mesh(A.plastico('#1f4fb0')), o.mesh(A.oro())]]);
  }
  {   // USB-C
    const c = lt(), t = lt(), o = lt();
    c.add(chapa('y', PT, TOP - PT, [-4.12, -3.08], [IOX - 0.24, IOX + 0.24], [[-4.05, -3.15, IOX - 0.17, IOX + 0.17, 0.15]], 0.2));
    t.bb(IOX - 0.05, IOX + 0.05, PT, TOP - 0.25, -3.95, -3.25);
    for (let i = 0; i < 6; i++) for (const d of [-1, 1]) o.bb(IOX + d * 0.055 - 0.01, IOX + d * 0.055 + 0.01, PT, TOP - 0.3, -3.9 + i * 0.13, -3.85 + i * 0.13);
    add('caja_usb_c_frontal', [[c.mesh(A.niquel()), t.mesh(A.plastico('#0c0d0f')), o.mesh(A.oro())]]);
  }
  {   // jack de audio 3,5 mm
    const b = lt(), h = lt(), o = lt();
    b.cil('y', 0.5, 0.5, TOP - PT, IOX, (PT + TOP) / 2, 5.0, 20); h.cil('y', 0.2, 0.2, 0.12, IOX, TOP + 0.005, 5.0, 14);
    o.bb(IOX - 0.4, IOX - 0.2, PT, PT + 0.3, 5.5, 5.8);
    add('caja_jack_audio', [[b.mesh(A.niquel()), h.mesh(negro()), o.mesh(A.oro())]]);
  }

  // ================= VENTILADORES (eje del ventilador = x del mundo) =================
  // geometría local: z local = x mundo (frente), x local = y mundo, y local = z mundo
  const MF = (cx, cy, cz) => new T.Matrix4().makeBasis(V(0, 1, 0), V(0, 0, 1), V(1, 0, 0)).setPosition(cx, cy, cz);
  const marco = (Lf, Lg, M, esp = 2.5) => {   // marco cuadrado de 120 mm, travesaños y base del motor
    const sh = rrp(new T.Shape(), -6, -6, 6, 6, 0.9); const bo = new T.Path(); bo.absarc(0, 0, 5.75, 0, PI * 2, true); sh.holes.push(bo);
    for (const [x, y] of [[5, 5], [-5, 5], [5, -5], [-5, -5]]) { const q = new T.Path(); q.absarc(x, y, 0.22, 0, PI * 2, true); sh.holes.push(q); Lg.cil('z', 0.45, 0.45, 0.15, x, y, esp / 2 - 0.1, 10, M); }
    Lf.add(new T.ExtrudeGeometry(sh, { depth: esp, bevelEnabled: false, curveSegments: 8 }).translate(0, 0, -esp / 2), M);
    for (let k = 0; k < 3; k++) { const a = k * 2 * PI / 3 + 0.5; Lf.caja(4.2, 0.35, 0.4, Math.cos(a) * 3.8, Math.sin(a) * 3.8, -esp / 2 + 0.2, new T.Matrix4().multiplyMatrices(M, new T.Matrix4().makeRotationZ(a))); /* travesaño radial */ }
    Lf.cil('z', 2.0, 2.0, 0.6, 0, 0, -esp / 2 + 0.3, 20, M);
  };
  const aspas = (Lr, M, n, r0, r1, z0) => {   // aspas inclinadas
    const sh = new T.Shape(); sh.moveTo(r0, -0.3); sh.lineTo(r0 + 1.1, -0.55); sh.lineTo(r0 + 2.5, -0.95); sh.lineTo(r1, -1.05); sh.lineTo(r1, -0.5); sh.lineTo(r1 - 0.9, 0.15); sh.lineTo(r0 + 1.5, 0.45); sh.lineTo(r0, 0.35); sh.closePath();
    for (let k = 0; k < n; k++) {
      const g = new T.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: false }); g.rotateX(0.5); g.rotateZ(k * 2 * PI / n); g.translate(0, 0, z0); Lr.add(g, M);
    }
  };
  for (const [i, y] of [[1, 8], [2, 20.5], [3, 33]]) {
    const M = MF(19.85, y, 1.2), f = lt(), g = lt(), r = lt(), h = lt();
    marco(f, g, M);
    aspas(r, M, 9, 1.75, 5.55, 0.1); r.cil('z', 1.75, 1.75, 0.7, 0, 0, 0.1, 24, M);
    h.cil('z', 1.0, 1.0, 0.04, 0, 0, 0.46, 20, M);
    const it = add('caja_vent_frontal_' + i, [[f.mesh(A.plastico('#17181b')), g.mesh(A.goma())], [r.mesh(A.plastico('#202226')), h.mesh(A.aluminio('#8e949b'))]]);
    giros.push({ ids: ['caja_vent_frontal_' + i + ':1'], e: V(1, 0, 0), c: LY['vent_f' + i].clone(), k: 1 });
  }
  {   // ventilador trasero despiezado (centro x -21,05; z local 0 = x mundo -21,05)
    const M = MF(-21.05, 37, 3.6);
    const f = lt(), g = lt(); marco(f, g, M);
    add('caja_vent_trasero', [[f.mesh(A.plastico('#17181b')), g.mesh(A.goma())]]);
    const r = lt(), mg = lt(), s = lt();   // rotor: copa, aspas, imán anular
    r.cil('z', 1.95, 1.95, 1.2, 0, 0, 0.15, 24, M); r.cil('z', 1.9, 1.9, 0.2, 0, 0, 0.65, 24, M); aspas(r, M, 7, 1.95, 5.55, 0.1);
    mg.add(disco('z', -0.3, 0.5, 0, 0, 1.85, 1.55, 24), M); s.cil('z', 0.9, 0.9, 0.03, 0, 0, 0.76, 18, M);
    add('caja_vent_trasero_rotor', [[r.mesh(A.plastico('#202226')), mg.mesh(A.ferrita()), s.mesh(A.aluminio('#8e949b'))]]);
    giros.push({ ids: ['caja_vent_trasero_rotor'], e: V(1, 0, 0), c: V(-20.6, 37, 3.6), k: 1 });
    const n = lt(), cu = lt();   // estator: núcleo en estrella con 6 bobinas
    n.add(disco('z', -0.3, 0.5, 0, 0, 0.75, 0.5, 18), M);
    for (let k = 0; k < 6; k++) {
      const R = new T.Matrix4().multiplyMatrices(M, new T.Matrix4().makeRotationZ(k * PI / 3));
      n.caja(0.7, 0.4, 0.5, 1.05, 0, -0.05, R); n.caja(0.5, 0.9, 0.5, 1.35, 0, -0.05, R); cu.caja(0.55, 0.85, 0.7, 1.05, 0, -0.05, R);
    }
    add('caja_vent_trasero_estator', [[n.mesh(A.acero('#4a4d52')), cu.mesh(A.cobre())]]);
    const p = lt(), ch = lt(), pa = lt();   // placa del motor
    p.add(disco('z', -0.5, 0.1, 0, 0, 1.75, 0, 20), M);
    ch.caja(0.5, 0.5, 0.15, 0.9, 0.5, -0.33, M); ch.caja(0.4, 0.4, 0.12, -0.8, -0.7, -0.33, M); ch.caja(0.3, 0.2, 0.1, -0.5, 1.0, -0.33, M);
    for (let k = 0; k < 6; k++) pa.cil('z', 0.1, 0.1, 0.03, Math.cos(k * PI / 3) * 1.4, Math.sin(k * PI / 3) * 1.4, -0.38, 8, M);
    add('caja_vent_trasero_placa', [[p.mesh(A.pcb('#1d3a2a')), ch.mesh(A.encapsulado()), pa.mesh(A.estano())]]);
    const bu = lt(), ej = lt();   // buje de bronce y eje
    bu.cil('z', 0.4, 0.4, 1.25, 0, 0, -0.025, 14, M); bu.cil('z', 0.55, 0.55, 0.06, 0, 0, -0.62, 14, M); ej.cil('z', 0.13, 0.13, 1.5, 0, 0, 0.05, 8, M);
    add('caja_vent_trasero_rodamiento', [[bu.mesh(latón()), ej.mesh(A.niquel())]]);
  }

  // ================= CABLES =================
  const P = a => a.map(p => V(...p));
  // conector hembra: c = centro de la cara de acople, n = hacia el conector que recibe, u = fila larga. Devuelve el punto de salida del cable.
  const enchufe = (Lh, Lp, c, n, u, o = {}) => {
    const { nu = 2, nv = 1, pu = 0.254, pv = 0.254, fondo = 1.0, falta = -1, pw = 0.07, largo = 0.3 } = o;
    c = V(...c); n = V(...n).normalize(); u = V(...u).normalize();
    const M = new T.Matrix4().makeBasis(u, n.clone().cross(u), n).setPosition(c);
    const W = nu * pu + 0.2, H = nv * pv + 0.2;
    Lh.caja(W, H, fondo, 0, 0, -fondo / 2, M); Lh.caja(W * 0.35, 0.1, fondo * 0.6, 0, H / 2 + 0.05, -fondo * 0.5, M);
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) if (i + j * nu !== falta) Lp.caja(pw, pw, largo, (i - (nu - 1) / 2) * pu, (j - (nv - 1) / 2) * pv, 0.05, M);
    return c.clone().addScaledVector(n, -fondo);
  };
  // cinta plana (cable con funda) con ancho controlado por vectores clave sk
  const cinta = (pts, w, t, sk, n = pts.length * 10) => {
    const cv = new T.CatmullRomCurve3(pts, false, 'catmullrom', 0.4), pos = [], idx = [], p = V(0, 0, 0), tg = V(0, 0, 0);
    for (let i = 0; i <= n; i++) {
      const u = i / n; cv.getPoint(u, p); cv.getTangent(u, tg);
      const f = Math.min(u * (sk.length - 1), sk.length - 1.0001), i0 = Math.floor(f), s = sk[i0].clone().lerp(sk[i0 + 1], f - i0);
      s.addScaledVector(tg, -s.dot(tg)); if (s.lengthSq() < 1e-6) s.set(1, 0, 0); s.normalize();
      const b = tg.clone().cross(s);
      for (const [a, c] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) pos.push(p.x + s.x * a * w / 2 + b.x * c * t / 2, p.y + s.y * a * w / 2 + b.y * c * t / 2, p.z + s.z * a * w / 2 + b.z * c * t / 2);
    }
    for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) { const a = i * 4 + k, b = i * 4 + (k + 1) % 4, c = (i + 1) * 4 + k, d = (i + 1) * 4 + (k + 1) % 4; idx.push(a, b, c, b, d, c); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
  };
  const hilo = (pts, r) => new T.TubeGeometry(new T.CatmullRomCurve3(pts, false, 'catmullrom', 0.4), pts.length * 10, r, 8);
  const X = V(1, 0, 0), Y = V(0, 1, 0), Z = V(0, 0, 1);
  const funda = () => A.plastico('#101113');
  // conectores de la fuente (cara modular x = -6,4; cara de acople hacia -x) y salida del cable en x = -4,8
  const PS = { atx: [7.6, -3.6], eps1: [7.6, 1.2], eps2: [7.6, 3.8], gpu: [4.6, 2.5], sata: [4.6, -3.4] };
  const psu = (Lh, Lp, k, o) => enchufe(Lh, Lp, [-6.4, PS[k][0], PS[k][1]], [-1, 0, 0], [0, 0, 1], { fondo: 1.6, ...o });
  // tramo común: de la fuente por el hueco del shroud hasta el ojal inferior y detrás de la bandeja
  const bajo = (y, z) => [[-4.8, y, z], [-3.3, y + 0.8, z - 0.6], [-3.2, 10.5, -6.0], [-3.6, 12.1, -7.4], [-4.0, 12.8, -8.4]];

  {   // cable AC con conector C13 y enchufe de pared
    const h = lt(), c = lt(), m = lt();
    h.add(new T.ExtrudeGeometry(rrp(new T.Shape(), -1.2, -0.9, 1.2, 0.9, 0.3), { depth: 3.4, bevelEnabled: false, curveSegments: 4 }), new T.Matrix4().makeBasis(Z.clone().negate(), Y, X).setPosition(-22.4, 6.9 - 0, 4.8).multiply(new T.Matrix4().makeTranslation(0, 0, -3.4)));
    for (const dz of [-0.5, 0, 0.5]) m.bb(-22.5, -22.35, 6.9 - 0.3, 6.9 + 0.3, 4.8 + dz - 0.08, 4.8 + dz + 0.08);
    c.add(hilo(P([[-25.8, 6.9, 4.8], [-28, 6.9, 4.8], [-31, 5.5, 3.0], [-33, 2.5, -2], [-34.5, 1.5, -8], [-37, 1.5, -9]]), 0.45));
    h.bb(-39.5, -37.0, 0.6, 2.4, -10.0, -8.0); m.cil('x', 0.15, 0.15, 1.8, -40.4, 1.5, -9.4, 8); m.cil('x', 0.15, 0.15, 1.8, -40.4, 1.5, -8.6, 8);
    add('cable_ac', [[c.mesh(A.goma()), h.mesh(funda()), m.mesh(A.niquel())]]);
  }
  const cab = (id, sets) => add(id, [sets]);
  {   // ATX 24 pines
    const h = lt(), p = lt();
    const a = enchufe(h, p, [1.8, 34.4, -6.3], [0, 0, -1], [0, 1, 0], { nu: 12, nv: 2, pu: 0.42, pv: 0.42, fondo: 1.6, pw: 0.12 });
    const b = psu(h, p, 'atx', { nu: 12, nv: 2, pu: 0.42, pv: 0.42, pw: 0.12 });
    const ruta = [[-4.8, 7.6, -3.6], [-3.3, 8.4, -4.2], [-3.2, 10.5, -6.0], [-3.6, 12.1, -7.4], [-4.0, 12.8, -8.4], [-3.8, 14, -9.2], [-3.0, 18, -9.2], [0.5, 24, -9.1], [2.5, 30, -9.0], [3.6, 33.8, -8.7], [4.2, 34.2, -8.2], [4.0, 34.5, -6.6], [3.2, 34.6, -5.4], [a.x, a.y, a.z]];
    const sk = [Z, X, X, X, X, X, X, X, X, Y, Y, Y, Y, Y];
    add('cable_atx24', [[new T.Mesh(cinta(P(ruta), 4.0, 0.3, sk), funda()), h.mesh(A.plastico('#202226')), p.mesh(A.estano())]]);
  }
  for (const [id, k, x, dz, ez] of [['cable_eps1', 'eps1', -16.4, -9.7, -8.2], ['cable_eps2', 'eps2', -14.0, -10.1, -8.2]]) {
    const h = lt(), p = lt(), q = id === 'cable_eps1' ? 0 : 0.5;
    const a = enchufe(h, p, [x, 44.25, -6.3], [0, 0, -1], [1, 0, 0], { nu: 4, nv: 2, pu: 0.42, pv: 0.42, fondo: 1.6, pw: 0.12 });
    psu(h, p, k, { nu: 4, nv: 2, pu: 0.42, pv: 0.42, pw: 0.12 });
    const z0 = PS[k][1];
    const ruta = [[-4.8, 7.6, z0], [-3.2, 8.5, -1.0], [-3.0 + q * 0.4, 10.2, -4.5], [-4.0 + q * 0.5, 11.9, -7.0], [-4.6, 12.9, -8.6], [-4.6, 14.5, dz], [-7, 20, dz], [-11, 28, dz], [-15, 38, dz], [-17 + q, 44.5, -9.2], [-17 + q, 46.0, -8.5], [-16.8 + q, 46.4, -6.9], [-16.7 + q, 45.6, -5.8], [a.x, a.y + 0.2, a.z]];
    add(id, [[new T.Mesh(cinta(P(ruta), 1.6, 0.25, [Z, X, X, X, X, X, X, X, X, X, Y, Y, X, X]), funda()), h.mesh(A.plastico('#202226')), p.mesh(A.estano())]]);
  }
  {   // 12V-2x6 de la gráfica
    const h = lt(), p = lt(), s = lt();
    const a = enchufe(h, p, [-6.35, 27.5, 3.9], [0, 0, -1], [1, 0, 0], { nu: 6, nv: 2, pu: 0.3, pv: 0.3, fondo: 1.6, pw: 0.15 });
    for (let i = 0; i < 4; i++) s.bb(-6.35 + (i - 1.5) * 0.25 - 0.025, -6.35 + (i - 1.5) * 0.25 + 0.025, 27.5 - 0.5 - 0.025, 27.5 - 0.5 + 0.025, 3.7, 4.05);
    psu(h, p, 'gpu', { nu: 6, nv: 2, pu: 0.3, pv: 0.3, pw: 0.15 });
    const ruta = [[-4.8, 4.6, 2.5], [-3.4, 5.6, 3.4], [-3.0, 8.0, 4.5], [-3.6, 10.8, 5.5], [-4.2, 12.5, 6.4], [-4.5, 16, 7.2], [-4.8, 21, 7.4], [-5.6, 25, 6.8], [-6.1, 27.0, 6.0], [a.x, a.y, a.z + 0.1]];
    add('cable_12v2x6', [[new T.Mesh(cinta(P(ruta), 1.8, 0.3, [Z, X, X, X, X, X, X, X, X, X]), funda()), h.mesh(A.plastico('#202226')), p.mesh(A.oro()), s.mesh(A.niquel())]]);
  }
  {   // poder SATA: fuente -> HDD -> SSD
    const h = lt(), p = lt(), c = lt();
    psu(h, p, 'sata', { nu: 4, nv: 2, pu: 0.42, pv: 0.42, pw: 0.12 });
    enchufe(h, p, [3.6, 2.8, 1.65], [1, 0, 0], [0, 0, 1], { nu: 15, nv: 1, pu: 0.127, pv: 0.3, fondo: 1.0, pw: 0.05, largo: 0.25 });
    enchufe(h, p, [7.1, 30.65, -8.65], [1, 0, 0], [0, 1, 0], { nu: 15, nv: 1, pu: 0.127, pv: 0.3, fondo: 1.0, pw: 0.05, largo: 0.25 });
    const tronco = [[-4.8, 4.6, -3.4], [-3.0, 4.3, -3.0], [-1.0, 4.0, -1.0], [0.5, 3.5, 0.5], [2.0, 3.0, 1.4], [2.6, 2.8, 1.65]];
    const rama = [[0.5, 3.5, 0.5], [1.2, 5, -1.5], [3.0, 8, -5.6], [3.2, 14, -6.8], [3.4, 18.0, -7.4], [4.2, 18.8, -8.2], [4.2, 19.0, -8.9], [4.0, 22, -9.3], [5.5, 28, -9.4], [5.3, 29.6, -9.3], [6.1, 30.65, -8.65]];
    c.add(cinta(P(tronco), 0.9, 0.2, [Z, Z, Z, Z, Z, Z])); c.add(cinta(P(rama), 0.9, 0.2, [Z, X, X, X, X, X, X, X, X, X, X]));
    add('cable_sata_poder', [[c.mesh(funda()), h.mesh(A.plastico('#202226')), p.mesh(A.oro())]]);
  }
  {   // datos SATA ×2 (placa -> SSD y placa -> HDD)
    const h = lt(), p = lt(), c = lt(), o = { nu: 7, nv: 1, pu: 0.127, pv: 0.3, fondo: 1.0, pw: 0.05, largo: 0.25 };
    enchufe(h, p, [2.6, 22.1, -6.9], [-1, 0, 0], [0, 1, 0], o); enchufe(h, p, [2.6, 20.9, -6.9], [-1, 0, 0], [0, 1, 0], o);
    enchufe(h, p, [7.1, 28.75, -8.65], [1, 0, 0], [0, 1, 0], o); enchufe(h, p, [3.6, 2.8, -0.25], [1, 0, 0], [0, 0, 1], o);
    c.add(cinta(P([[3.6, 22.1, -6.9], [4.4, 22.0, -7.6], [4.3, 21.8, -8.5], [4.0, 22.5, -9.2], [5.0, 26, -9.4], [5.4, 28.2, -9.0], [6.1, 28.75, -8.65]]), 0.7, 0.12, [X, X, Y, X, X, X, X]));
    c.add(cinta(P([[3.6, 20.9, -6.9], [4.0, 19.5, -6.6], [3.8, 14, -6.3], [3.5, 8, -4.5], [2.0, 5, -3.0], [1.2, 3.5, -1.0], [2.6, 2.8, -0.25]]), 0.7, 0.12, [Z, Z, Z, Z, Z, Z, Z]));
    add('cable_sata_datos', [[c.mesh(A.plastico('#b01818')), h.mesh(A.plastico('#202226')), p.mesh(A.niquel())]]);
  }
  // salida por detrás de la bandeja hasta la muesca del frente (comienzo y fin comunes de los cables del panel frontal)
  const subida = (d, x0) => [[x0 + 0, 0, 0], [0, 0, 0]];
  {   // panel frontal (4 hilos con conectores de 2 pines)
    const h = lt(), p = lt(), c = lt(), s = lt();
    const col = [-1.608, -1.354, -1.1, -0.846, -0.592];
    const pl = [[col[0] + 0.127, 15.527], [col[2] + 0.127, 15.527], [col[0] + 0.127, 15.273], [col[2] + 0.127, 15.273]];
    pl.forEach(([x, y], i) => {
      const e = enchufe(h, p, [x, y, -6.6], [0, 0, -1], [1, 0, 0], { nu: 2, nv: 1, fondo: 1.0, pw: 0.06 });
      const dz = -9.6 - i * 0.12, dd = i * 0.25;
      c.add(hilo(P([[e.x, e.y, e.z], [-2.5 - dd * 0.3, 14.0, -6.6], [-4.0 + dd * 0.2, 12.8, -8.2], [-3, 14, dz], [4, 18, dz], [10, 26, dz], [14, 36, dz], [16.8 + dd * 0.2, 43.0, -9.5], [17.6 + dd * 0.2, 44.7, -7.5], [18.2, 46, -4.5], [19.0, 46.6, -1.5], [19.4 + dd * 0.1, 46.85, 0.3 + i * 0.4]]), 0.07));
      s.cil('y', 0.1, 0.1, 0.1, 19.4 + dd * 0.1, 46.9, 0.3 + i * 0.4, 8);
    });
    add('cable_panel_frontal', [[c.mesh(funda()), h.mesh(A.plastico('#202226')), p.mesh(A.oro()), s.mesh(A.estano())]]);
  }
  const frontal = (dz, x, z, dx) => [[x, 12.8, -8.2], [-3, 14, dz], [4, 18, dz], [10, 26, dz], [14, 36, dz], [16.5 + dx, 43.0, -9.5], [17.0 + dx, 44.8, -8.2], [17.0 + dx, 45.6, -5.0]];
  {   // USB 3 frontal
    const h = lt(), p = lt(), c = lt();
    const a = enchufe(h, p, [2.0, 28.5, -6.4], [0, 0, -1], [0, 1, 0], { nu: 10, nv: 2, pu: 0.254, pv: 0.254, fondo: 1.6, falta: 9, pw: 0.06 });
    const b = enchufe(h, p, [17.1, PY - 0.14, -2.4], [0, 1, 0], [0, 0, 1], { nu: 10, nv: 2, pu: 0.254, pv: 0.254, fondo: 1.0, falta: 9, pw: 0.06 });
    c.add(hilo(P([[a.x, a.y, a.z], [3.2, 30.5, -5.8], [4.0, 32.5, -6.9], [4.6, 33.0, -8.25], [5, 34, -9.7], [10, 38, -10.0], [14, 42, -9.9], [16.5, 44.0, -9.5], [17.0, 44.8, -8.2], [17.0, 45.6, -5.0], [b.x, b.y - 0.2, b.z - 0.1]]), 0.35));
    add('cable_usb3_frontal', [[c.mesh(funda()), h.mesh(A.plastico('#202226')), p.mesh(A.niquel())]]);
  }
  {   // USB-C frontal
    const h = lt(), p = lt(), c = lt();
    const a = enchufe(h, p, [2.0, 30.7, -6.4], [0, 0, -1], [0, 1, 0], { nu: 10, nv: 2, pu: 0.2, pv: 0.2, fondo: 1.6, pw: 0.05 });
    const b = enchufe(h, p, [18.4, PY - 0.14, -2.4], [0, 1, 0], [0, 0, 1], { nu: 10, nv: 2, pu: 0.2, pv: 0.2, fondo: 1.0, pw: 0.05 });
    c.add(hilo(P([[a.x, a.y, a.z], [3.2, 31.5, -5.8], [4.0, 33.0, -6.9], [4.4, 34.0, -8.25], [5.5, 35, -9.8], [10, 39, -10.1], [14, 43, -10.0], [17.2, 44.9, -8.2], [18.0, 45.6, -5.0], [b.x, b.y - 0.2, b.z - 0.1]]), 0.28));
    add('cable_usbc_frontal', [[c.mesh(funda()), h.mesh(A.plastico('#202226')), p.mesh(A.niquel())]]);
  }
  {   // audio HD frontal
    const h = lt(), p = lt(), c = lt();
    const a = enchufe(h, p, [-19.6, 15.4, -6.4], [0, 0, -1], [1, 0, 0], { nu: 5, nv: 2, fondo: 1.0, falta: 9, pw: 0.06 });
    const b = enchufe(h, p, [17.1, PY - 0.14, 1.25], [0, 1, 0], [0, 0, 1], { nu: 5, nv: 2, fondo: 1.0, falta: 9, pw: 0.06 });
    c.add(hilo(P([[a.x, a.y, a.z], [-19.2, 14.0, -5.6], [-17, 13.2, -6.3], [-10, 13.0, -6.5], [-6, 12.8, -7.4], [-4.6, 12.7, -8.2], [-3, 14, -9.9], [4, 18, -10.0], [10, 26, -10.0], [14, 36, -10.0], [16, 43.0, -9.9], [17.2, 44.9, -8.3], [17.3, 45.4, -5.0], [17.2, 45.4, -0.5], [b.x, b.y - 0.2, b.z]]), 0.2));
    add('cable_audio_frontal', [[c.mesh(funda()), h.mesh(A.plastico('#202226')), p.mesh(A.niquel())]]);
  }
  {   // ventiladores PWM de 4 pines: trasero -> SYS_FAN1; frontales -> concentrador -> SYS_FAN2
    const h = lt(), p = lt(), c = lt(), o = { nu: 4, nv: 1, fondo: 1.0, pw: 0.06 };
    const a = enchufe(h, p, [1.8, 43.0, -6.4], [0, 0, -1], [1, 0, 0], o), b = enchufe(h, p, [-12.6, 15.4, -6.4], [0, 0, -1], [1, 0, 0], o);
    c.add(hilo(P([[-20.8, 42.8, -2.0], [-20.4, 44.0, -3.8], [-19, 45.5, -5.5], [-15, 46.1, -6.1], [-6, 46.3, -6.2], [0, 45.5, -5.8], [a.x - 0.6, 44.2, -5.6], [a.x, a.y, a.z]]), 0.12));
    for (const fy of [8, 20.5, 33]) c.add(hilo(P([[19.0, fy, -4.8], [18.6, fy, -7.0], [18.5, fy, -8.3], [18.5, fy + (21.5 - fy) * 0.5, -9.2], [18.5, 21.5, -9.4]]), 0.12));
    h.bb(17.9, 19.1, 20.4, 22.6, -9.75, -9.25);
    c.add(hilo(P([[18.5, 21.5, -9.7], [14, 19.5, -10.0], [8, 16.0, -10.1], [2, 14.5, -10.0], [-3.0, 13.2, -9.4], [-4.2, 12.8, -8.2], [-6, 13.0, -7.0], [-9.5, 13.6, -6.1], [-12, 14.4, -5.6], [b.x, b.y, b.z]]), 0.12));
    add('cable_ventiladores', [[c.mesh(funda()), h.mesh(A.plastico('#202226')), p.mesh(A.niquel())]]);
  }

  ctx.pendientes();   // siempre al final: cubos magenta para los ids que aún no tienen geometría
}
