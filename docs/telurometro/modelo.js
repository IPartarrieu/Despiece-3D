// Telurómetro (medidor de resistencia de puesta a tierra). Construcción paramétrica compartida por los tres modelos. REFERENCIAL.
// Unidades: cm. Panel frontal mirando a +z, centro del equipo en el origen; el suelo (en la escena del terreno) queda en y = -H/2.
// Medidas exteriores de cada fabricante (data.json -> dim). Disposición del panel según las ilustraciones de los manuales
// (Megger DET3/4 p.11, Fluke 1625-2 p.8 tabla 3, Kyoritsu 4106 p.10). Interior (placa, oscilador, transformador, microcontrolador,
// filtro, zumbador, empaquetadura) y medidas internas: APROXIMADOS, ningún fabricante publica despiece ni esquema.
import * as THREE from 'three';
import { PI, V, mat, acero, goma, mesh, cil, caja, tornillo, lienzo, rr } from '../lib.js';
import { vivoTel } from './vivo.js';

const CAT = await (await fetch(new URL('data.json', import.meta.url))).json();

const losa = (w, h, t, r, m, x = 0, y = 0, z = 0) => { // placa de esquinas redondeadas, espesor t en z, centrada
  const g = new THREE.ExtrudeGeometry(rr(-w / 2, -h / 2, w / 2, h / 2, Math.min(r, w / 2 - 0.01, h / 2 - 0.01)), { depth: t, bevelEnabled: false, curveSegments: 6 });
  g.translate(0, 0, -t / 2); return mesh(g, m, x, y, z);
};
const marco = (w, h, t, e, r, m, z = 0) => { // anillo rectangular redondeado (funda, empaquetadura)
  const s = rr(-w / 2, -h / 2, w / 2, h / 2, r); s.holes.push(rr(-w / 2 + e, -h / 2 + e, w / 2 - e, h / 2 - e, Math.max(r - e, 0.1)));
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 6 }); g.translate(0, 0, -t / 2); return mesh(g, m, 0, 0, z);
};
const plano = (w, h, tex, x, y, z, o = {}) => mesh(new THREE.PlaneGeometry(w, h), mat('#fff', { map: tex, transparent: true, alphaTest: 0.3, roughness: 0.5, metalness: 0, ...o }), x, y, z);
const texto = (txt, { w = 256, h = 96, color = '#fff', px = 60, fondo = null } = {}) => lienzo(w, h, (g) => {
  if (fondo) { g.fillStyle = fondo; g.fillRect(0, 0, w, h); }
  g.fillStyle = color; g.font = `bold ${px}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  while (g.measureText(txt).width > w - 8 && px > 10) g.font = `bold ${--px}px sans-serif`; g.fillText(txt, w / 2, h / 2 + 2);
});

// pantalla digital (lectura de EJEMPLO, no es una medición)
const texLCD = (m, est) => lienzo(512, 256, (g, w, h) => {
  g.fillStyle = est.lcd || '#9fae8f'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1d2418'; g.font = 'bold 120px monospace'; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText('12.40', 400, 130);
  g.font = 'bold 70px sans-serif'; g.textAlign = 'left'; g.fillText('Ω', 410, 135);
  g.font = 'bold 30px sans-serif'; g.fillText(m.lcd_modo || 'RE 3P', 20, 32); g.fillText(m.frec_lcd || '128 Hz', 20, 228);
  g.textAlign = 'right'; g.fillText('ejemplo', 495, 228);
});
// escala del analógico: resistencia (no lineal) arriba, tensión y banda de pilas abajo (Megger DET p.11, aproximada)
const texEscala = () => lienzo(512, 320, (g, w, h) => {
  g.fillStyle = '#f2efe4'; g.fillRect(0, 0, w, h);
  const cx = 256, cy = 330, arc = (r, a0, a1, c, lw) => { g.strokeStyle = c; g.lineWidth = lw; g.beginPath(); g.arc(cx, cy, r, a0, a1); g.stroke(); };
  arc(250, -PI * 0.78, -PI * 0.22, '#222', 3);
  g.fillStyle = '#222'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center';
  [['∞', 0], ['100', 0.15], ['20', 0.35], ['10', 0.5], ['5', 0.65], ['2', 0.82], ['0', 1]].forEach(([t, u]) => {
    const a = -PI * 0.78 + u * PI * 0.56; g.fillText(t, cx + 275 * Math.cos(a), cy + 275 * Math.sin(a));
    g.beginPath(); g.moveTo(cx + 240 * Math.cos(a), cy + 240 * Math.sin(a)); g.lineTo(cx + 258 * Math.cos(a), cy + 258 * Math.sin(a)); g.stroke();
  });
  arc(200, -PI * 0.74, -PI * 0.5, '#3a9a4a', 14); arc(200, -PI * 0.5, -PI * 0.26, '#c9433b', 14);
  g.font = 'bold 18px sans-serif'; g.fillText('Ω', cx, 70); g.fillText('V', cx, 150);
  arc(150, -PI * 0.66, -PI * 0.34, '#222', 8); g.fillText('BATT', cx, 215);
});
// rótulos del frente (marca, modelo, posiciones del selector)
const texFrente = (marca, m, est) => lienzo(1024, 1024, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.fillStyle = est.texto || '#f5f5f5'; g.font = 'bold 64px sans-serif'; g.textAlign = 'left'; g.textBaseline = 'top';
  const [lx, ly] = est.logo || [0.06, 0.04]; g.fillText(marca.toUpperCase(), lx * w, ly * h);
  g.font = 'bold 40px sans-serif'; g.fillText(m.modelo, lx * w, ly * h + 70);
  const [sx, sy, sr] = m.panel.selector; const cx = (sx + 0.5) * w, cy = (0.5 - sy) * h, R = sr * w * 1.55;
  g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  (m.selector_pos || []).forEach((t, i, a) => { const ang = (-0.75 + 1.5 * i / Math.max(a.length - 1, 1)) * PI; g.fillText(t, cx + R * Math.sin(ang), cy - R * Math.cos(ang)); });
});

export function construir(cfg) {
  const m = cfg.m || CAT.modelos[0], est = cfg.estilo || {}, mod = m.modelo;
  const [W, H, D] = m.dim.map(x => x / 10), zf = D / 2, P = m.panel;
  const px = u => u * W, py = v => v * H;     // panel normalizado -> cm
  const parts = {}, pos = {};
  const add = (id, items, shell = false) => {
    const c = CAT.catalogoPorModelo?.[mod]?.[id] || CAT.catalogo[id];
    const its = items.map(([objs, dir]) => { const g = new THREE.Group(); [].concat(objs).forEach(o => g.add(o)); return { obj: g, dir }; });
    const mats = []; its.forEach(i => i.obj.traverse(o => { if (o.material) { o.userData.pid = id; mats.push(o.material); } }));
    parts[id] = { id, nombre: c[0], ref: c[1], grupo: c[2], items: its, mats, shell };
  };
  const O = V(0, 0, 0), negro = () => mat('#1b1c1f', { metalness: 0.3, roughness: 0.6 });
  const brill = () => acero('#d3d7dc', { metalness: 0.85, roughness: 0.25 }), laton = () => mat('#c9a24a', { metalness: 0.85, roughness: 0.3 });
  const zP = zf - D * 0.5;   // placa principal, detrás del frente

  // ================= carcasa =================
  add('funda', [[[marco(W + 1.3, H + 1.3, D + 0.6, 1.0, 1.8, goma(est.funda || '#1f2124')),
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => losa(3.2, 3.2, D + 1.0, 1.2, goma(est.funda || '#1f2124'), sx * (W / 2 + 0.2), sy * (H / 2 + 0.2), 0))], V(0, 0, 9)]], true);
  add('frente', [[[losa(W - 0.3, H - 0.3, D * 0.42, 1.2, mat(est.frente || '#3a3e44', { roughness: 0.7 }), 0, 0, zf - D * 0.21),
    plano(W - 0.6, H - 0.6, texFrente(m.marca, m, est), 0, 0, zf + 0.012)], V(0, 0, 6)]], true);
  add('trasera', [[[losa(W - 0.3, H - 0.3, D * 0.56, 1.2, mat(est.trasera || '#2c2f34', { roughness: 0.75 }), 0, 0, -zf + D * 0.28)], V(0, 0, -6)]], true);
  add('empaquetadura', [[[marco(W - 0.5, H - 0.5, 0.18, 0.35, 1.1, goma('#101113'), zf - D * 0.42)], V(0, 0, 2.5)]]);
  const [tw, th, ty] = m.tapa;     // tapa trasera / de pilas (fracciones del panel)
  add('tapa', [[[losa(px(tw), py(th), 0.35, 0.8, mat(est.trasera || '#2c2f34', { roughness: 0.8 }), 0, py(ty), -zf - 0.18),
    ...(m.marca === 'Kyoritsu' ? [] : [caja(px(tw) * 0.6, 0.15, 0.25, 0, py(ty) + py(th) * 0.3, -zf - 0.42, mat('#444'))])], V(0, 9, -12)]]);
  add('tornillos_tapa', [[(m.tornillos_tapa || [[0, -0.42]]).map(([u, v]) => tornillo('-z', px(u * tw), py(ty) + py(v * th), -zf - 0.36, 0.22)), V(0, 8, -16)]]);
  add('etiqueta', [[[plano(px(tw) * 0.8, 2.6, texto(`${m.marca} ${m.modelo} · ${m.pilas_txt} · ${m.ip}`, { w: 768, h: 96, color: '#222', fondo: '#e9e6dc', px: 40 }),
    0, Math.min(py(ty) + py(th) / 2 + 1.8, H / 2 - 1.6), -zf - 0.02, { side: THREE.DoubleSide })], V(0, 12, -10)]]);

  // ================= panel: pantalla, selector y botones =================
  const [lu, lv, lw, lh] = P.pantalla, Lx = px(lu), Ly = py(lv), Lw = px(lw), Lh = py(lh);
  if (m.analogico) {
    add('escala', [[[plano(Lw * 0.94, Lh * 0.94, texEscala(), Lx, Ly, zf + 0.05)], V(0, 0, 10)]]);
    const piv = new THREE.Group(); piv.position.set(Lx, Ly - Lh * 0.44, zf + 0.12);
    const ag = caja(0.06, Lh * 0.82, 0.03, 0, Lh * 0.41, 0, mat('#111')); piv.add(ag, cil('z', 0.18, 0.18, 0.1, 0, 0, 0, mat('#333'), 12));
    piv.rotation.z = 0.25; pos.aguja = piv;
    add('aguja', [[[piv], V(0, 0, 12)]]);
    add('movimiento', [[[cil('z', Lw * 0.12, Lw * 0.12, 1.4, Lx, Ly - Lh * 0.44, zf - 1.1, mat('#6b6f76', { metalness: 0.6 }), 24),
      caja(Lw * 0.3, Lw * 0.18, 1.0, Lx, Ly - Lh * 0.44, zf - 2.2, mat('#7a3e2b', { metalness: 0.5 })), cil('z', Lw * 0.06, Lw * 0.06, 1.0, Lx, Ly - Lh * 0.44, zf - 0.5, mat('#c07a3e', { metalness: 0.9, roughness: 0.3 }), 16)], V(0, 0, 4)]]);
    add('ventana', [[[losa(Lw, Lh, 0.15, 0.6, mat('#dfe8ee', { transparent: true, opacity: 0.25, metalness: 0, roughness: 0.05 }), Lx, Ly, zf + 0.3),
      marco(Lw + 0.6, Lh + 0.6, 0.4, 0.4, 0.8, negro(), zf + 0.2)].map((o, i) => { if (i === 1) o.position.set(Lx, Ly, zf + 0.2); return o; }), V(0, 0, 15)]]);
  } else {
    add('lcd', [[[plano(Lw * 0.92, Lh * 0.86, texLCD(m, est), Lx, Ly, zf + 0.06), caja(Lw, Lh, 0.9, Lx, Ly, zf - 0.4, mat('#2a2d31'))], V(0, 0, 12)]]);
    add('ventana', [[[losa(Lw, Lh, 0.12, 0.4, mat('#dfe8ee', { transparent: true, opacity: 0.22, metalness: 0, roughness: 0.05 }), Lx, Ly, zf + 0.15)], V(0, 0, 15)]]);
  }
  const [su, sv, sr] = P.selector, Sx = px(su), Sy = py(sv), Sr = px(sr);
  add('selector', [[[cil('z', Sr, Sr * 1.05, 1.6, Sx, Sy, zf + 0.8, mat(est.selector || '#1b1c1f', { roughness: 0.6 }), 32), caja(Sr * 0.35, Sr * 1.9, 1.0, Sx, Sy, zf + 1.9, mat(est.selector || '#1b1c1f', { roughness: 0.6 })),
    caja(0.18, Sr * 0.7, 0.05, Sx, Sy + Sr * 0.55, zf + 2.42, mat('#fff'))], V(0, 0, 14)]]);
  add('contactos_selector', [[[cil('z', Sr * 1.1, Sr * 1.1, 0.3, Sx, Sy, zP + 0.6, mat('#e6e2d3'), 32), cil('z', 0.3, 0.3, 2.2, Sx, Sy, zP + 1.6, brill(), 12),
    ...Array.from({ length: 8 }, (_, i) => { const a = i / 8 * PI * 2; return caja(0.25, 0.6, 0.1, Sx + Sr * 0.85 * Math.cos(a), Sy + Sr * 0.85 * Math.sin(a), zP + 0.45, laton()); })], V(0, 0, 7)]]);
  const [Tu, Tv, Tr] = P.test;
  add('test', [[[cil('z', px(Tr), px(Tr), 0.9, px(Tu), py(Tv), zf + 0.45, mat(est.test || '#c8302b', { roughness: 0.5 }), 24),
    plano(px(Tr) * 1.6, px(Tr) * 0.6, texto('TEST', { color: '#fff' }), px(Tu), py(Tv), zf + 0.91)], V(0, 0, 13)]]);
  add('teclas', [[(P.teclas || []).map(([u, v, w2, h2]) => losa(px(w2), py(h2), 0.6, 0.3, mat(est.tecla || '#3d6fb6', { roughness: 0.5 }), px(u), py(v), zf + 0.3)), V(0, 0, 13)]]);
  if (P.led) add('led', [[[mesh(new THREE.SphereGeometry(0.28, 14, 10), mat('#ff4a3a', { emissive: '#ff4a3a', emissiveIntensity: 0.35 }), px(P.led[0]), py(P.led[1]), zf + 0.05)], V(0, 0, 13)]]);

  // ================= bornes (E, ES, S, H) =================
  const colB = { E: '#2f9e44', ES: '#2f9e44', S: '#e8c21c', H: '#d03a32', X: '#1b1c1f' };
  for (const [id, u, v, rot] of m.bornes) {  // rot: rótulo del borne
    const arriba = m.bornes_arriba, col = mat(colB[rot] || '#1b1c1f', { roughness: 0.5 });
    const x = px(u), y = arriba ? H / 2 : py(v), z = arriba ? (v * D) : zf;
    const objs = arriba
      ? [cil('y', 0.75, 0.85, 1.4, x, y + 0.7, z, col, 24), cil('y', 0.36, 0.36, 1.5, x, y + 0.72, z, mat('#111'), 16), cil('y', 0.2, 0.2, 1.4, x, y + 0.8, z, laton(), 12),
        plano(1.4, 0.9, texto(rot === 'X' ? 'X/Y' : rot, { color: '#fff', fondo: colB[rot] || '#1b1c1f' }), x, y + 0.02, z + 1.3, {}).rotateX(-PI / 2)]
      : [cil('z', 0.75, 0.85, 1.4, x, y, zf + 0.7, col, 24), cil('z', 0.36, 0.36, 1.5, x, y, zf + 0.72, mat('#111'), 16), cil('z', 0.2, 0.2, 1.4, x, y, zf + 0.8, laton(), 12),
        plano(1.6, 0.9, texto(rot, { color: '#fff', fondo: colB[rot] || '#1b1c1f' }), x - 2.0, y, zf + 0.02)];
    pos[id] = arriba ? V(x, y + 1.4, z) : V(x, y, zf + 1.4);
    add(id, [[objs, arriba ? V(0, 6, 0) : V(4, 0, 6)]]);
  }
  if (m.puerto) add('puerto', [[[caja(1.4, 1.2, 0.8, px(m.puerto[0]), py(m.puerto[1]), -zf - 0.1, mat('#555')), caja(0.8, 0.6, 0.85, px(m.puerto[0]), py(m.puerto[1]), -zf - 0.12, mat('#111'))], V(0, 0, -8)]]);

  // ================= interior (REFERENCIAL) =================
  add('placa', [[[caja(W - 2.4, H - 2.4, 0.16, 0, 0, zP, mat('#2e6b3a', { roughness: 0.6 })),
    ...Array.from({ length: 10 }, (_, i) => caja(W * 0.5, 0.04, 0.02, -W * 0.05, -H * 0.35 + i * H * 0.07, zP - 0.09, mat('#c9a24a', { metalness: 0.8 })))], V(0, 0, -3)]]);
  const zc = zP - 0.5, yc = py(0.22);
  add('oscilador', [[[...[0, 1, 2, 3].map(i => caja(0.9, 1.3, 0.35, -px(0.3) + i * 1.2, yc + 0.6, zc - 0.1, negro())),
    caja(4.6, 2.2, 0.25, -px(0.3) + 1.8, yc + 0.6, zc - 0.5, mat('#b9bec5', { metalness: 0.65, roughness: 0.45 })),
    ...[0, 1, 2, 3, 4].map(i => caja(4.6, 0.12, 0.9, -px(0.3) + 1.8, yc - 0.3 + i * 0.45, zc - 1.0, mat('#b9bec5', { metalness: 0.65, roughness: 0.45 })))], V(-4, 3, -10)]]);
  add('transformador', [[[caja(2.2, 2.0, 1.4, px(0.02), yc + 0.4, zc - 0.6, mat('#6c7178', { metalness: 0.6 })),
    cil('z', 0.75, 0.75, 1.5, px(0.02), yc + 0.4, zc - 0.6, mat('#c07a3e', { metalness: 0.9, roughness: 0.3 }), 20)], V(0, 5, -12)]]);
  add('micro', [[[caja(1.5, 1.5, 0.22, px(0.26), yc + 0.6, zc + 0.3, negro()), ...[-1, 1].flatMap(s => Array.from({ length: 6 }, (_, i) => caja(0.06, 0.2, 0.05, px(0.26) + s * 0.8, yc + 0.08 + i * 0.2, zc + 0.3, brill())))], V(4, 4, -10)]]);
  add('filtro', [[[caja(1.0, 0.7, 0.2, px(0.26), yc - 1.4, zc + 0.3, negro()), caja(1.0, 0.7, 0.2, px(0.26) - 1.4, yc - 1.4, zc + 0.3, negro()),
    ...[0, 1, 2].map(i => cil('z', 0.32, 0.32, 1.0, px(0.12) + i * 0.8, yc - 1.4, zc - 0.1, mat('#2b3f8a'), 14))], V(6, 0, -10)]]);
  add('buzzer', [[[cil('z', 0.6, 0.6, 0.6, -px(0.34), py(0.36), zc + 0.1, negro(), 20), cil('z', 0.12, 0.12, 0.62, -px(0.34), py(0.36), zc + 0.1, mat('#555'), 8)], V(-5, 5, -8)]]);

  // pilas AA (Ø 14,5 x 50 mm) en filas de dos, en la mitad inferior, detrás de la placa
  const n = m.pilas, filas = n / 2, zb = -zf + D * 0.28, yb0 = py(m.tapa[2]) - (filas - 1) * 0.8;
  add('portapilas', [[[caja(10.8, filas * 1.6 + 0.4, 1.8, 0, yb0 + (filas - 1) * 0.8, zb + 0.2, mat('#232427', { roughness: 0.8 })),
    ...Array.from({ length: filas }, (_, i) => [-5.3, 5.3].map(x => caja(0.1, 1.0, 1.0, x, yb0 + i * 1.6, zb, brill()))).flat()], V(0, 14, -18)]]);
  add('pilas', [[Array.from({ length: n }, (_, i) => {
    const g = new THREE.Group(), x = (i % 2 ? 2.6 : -2.6), y = yb0 + Math.floor(i / 2) * 1.6, s = (Math.floor(i / 2) + i) % 2 ? 1 : -1;
    g.add(cil('x', 0.72, 0.72, 4.8, x, y, zb - 0.2, mat(est.pila || '#1e1f22', { metalness: 0.4, roughness: 0.4 }), 18), cil('x', 0.73, 0.73, 1.4, x - s * 1.6, y, zb - 0.2, mat(est.pila2 || '#c88a2b', { metalness: 0.6 }), 18),
      cil('x', 0.25, 0.25, 0.2, x + s * 2.5, y, zb - 0.2, brill(), 10));
    return g;
  }), V(0, 19, -24)]]);
  if (m.fusible) {
    const [fu, fv] = m.fusible.pos, fx = px(fu), fy = py(fv), fz = zb - 0.1, L = m.fusible.largo / 10, R = m.fusible.diam / 20;
    add('portafusible', [[[caja(L + 0.6, 1.0, 0.25, fx, fy, fz + 0.75, mat('#232427')), ...[-1, 1].map(s => caja(0.25, 1.0, 1.0, fx + s * (L / 2 - 0.35), fy, fz + 0.3, brill()))], V(0, 0, -9)]]);
    const fus = (x, y, z) => [cil('x', R * 0.95, R * 0.95, L - 1.0, x, y, z, mat('#f1ead8', { roughness: 0.7 }), 18), ...[-1, 1].map(s => cil('x', R, R, 0.6, x + s * (L / 2 - 0.3), y, z, brill(), 18))];
    add('fusible', [[fus(fx, fy, fz), V(0, 16, -20)]]);
    if (m.fusible.repuesto) add('fusible_rep', [[fus(0, py(ty) + py(th) * 0.32, -zf + 0.15), V(0, 11, -13)]]);
  }

  // ================= accesorios del ensayo (largos y diámetros APROXIMADOS) =================
  const y0 = -H / 2, LJ = 30, jab = (x, col) => [cil('y', 0.5, 0.5, LJ - 3, x, y0 + LJ / 2 + 1.5, 0, acero('#9aa0a7'), 14), mesh(new THREE.ConeGeometry(0.5, 3, 14), acero('#9aa0a7'), x, y0 + 1.5, 0).rotateX(PI),
    cil('x', 0.45, 0.45, 7, x, y0 + LJ - 0.4, 0, acero('#9aa0a7'), 12), cil('y', 0.9, 0.9, 0.8, x, y0 + LJ - 3.5, 0, mat(col), 16)];
  const xJ = W / 2 + 7;
  pos.jabC = V(xJ, y0, 0); pos.jabP = V(xJ + 7, y0, 0);
  add('jabalina_c', [[jab(xJ, '#d03a32'), V(6, 0, 0)]]);
  add('jabalina_p', [[jab(xJ + 7, '#e8c21c'), V(10, 0, 0)]]);
  const carrete = (x, col) => [cil('z', 5.5, 5.5, 0.4, x, y0 + 5.6, 1.8, mat('#2a2b2e'), 32), cil('z', 5.5, 5.5, 0.4, x, y0 + 5.6, -1.8, mat('#2a2b2e'), 32),
    cil('z', 4.2, 4.2, 3.2, x, y0 + 5.6, 0, mat(col, { roughness: 0.5 }), 32), cil('z', 0.9, 0.9, 5, x, y0 + 5.6, 0, mat('#555'), 16), caja(0.8, 3.5, 0.8, x + 3.2, y0 + 5.6, 2.6, mat('#2a2b2e'))];
  add('carrete_c', [[carrete(-W / 2 - 8, '#d03a32'), V(-8, 0, 0)]]);
  add('carrete_p', [[carrete(-W / 2 - 21, '#e8c21c'), V(-12, 0, 0)]]);
  const anillo = mesh(new THREE.TorusGeometry(3.6, 0.25, 8, 40), mat('#2f9e44', { roughness: 0.5 }), 0, y0 + 0.3, zf + 8); anillo.rotation.x = PI / 2;
  add('cable_e', [[[anillo, mesh(new THREE.TorusGeometry(3.2, 0.25, 8, 40), mat('#2f9e44', { roughness: 0.5 }), 0, y0 + 0.8, zf + 8).rotateX(PI / 2)], V(0, -2, 8)]]);

  return { parts, vivo: vivoTel(parts, { W, H, D, pos, m, analogico: !!m.analogico }) };
}
