// Capas del modo "Funciona" del telurómetro y escena auxiliar del terreno (REFERENCIAL, esquemática).
// Método de caída de potencial de 3 polos: E al electrodo bajo prueba, jabalina de potencial P (S) al 62 % y de corriente C (H) al 100 %
// de la distancia E-C (Megger DET p.23: A = 0,62 x B). Distancias DIBUJADAS SIN ESCALA: 1 m real = 1 cm en la escena (D = 100 cm
// representa 100 m de ejemplo; Fluke pide > 20 m entre electrodos, Kyoritsu 5-10 m para electrodos pequeños).
// Curva del potencial: teoría de electrodos semiesféricos en suelo homogéneo, R(x)/Rt = 1 - a/D - a/x + a/(D-x) (a/D = 0,03): ilustrativa.
import * as THREE from 'three';
import { V, PI, mat } from '../lib.js';
import { flujo, flecha, rotulo as rotulo0, mb } from '../vivo.js';

const AMARILLO = 0xffc83d, CELESTE = 0x4dd0ff, ROJO = 0xff5470, VERDE = 0x4ade80, GRIS = 0xb8c0cc, BLANCO = 0xffffff;
export const DIST = 100, LJ = 30, HUNDE = 12;   // distancia E-C dibujada, largo y profundidad de las jabalinas (aproximados)
const juntar = g => { const f = []; g.traverse(o => { if (o !== g && o.userData.tick) f.push(o.userData.tick); }); g.userData.tick = c => f.forEach(t => t(c)); return g; };
const tubo = (pts, r, m) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.2), pts.length * 16, r, 8), m);

export function vivoTel(parts, { W, H, D, pos, m, analogico }) {
  const y0 = -H / 2, xE = W / 2 + 6, xP = xE + 0.62 * DIST, xC = xE + DIST;
  const rt = (t, p, o = {}) => rotulo0(t, p, { ...o, esc: (o.esc || 1.5) * 3.0 });      // rótulos de la escena del terreno
  const re = (t, p, o = {}) => rotulo0(t, p, { ...o, esc: (o.esc || 1.5) * 0.8 });      // rótulos junto al equipo
  const topJ = x => V(x, y0 + LJ - HUNDE - 3.5, 0);                                       // anillo de color de la jabalina clavada
  const salida = b => { const p = pos[b]; return m.bornes_arriba ? [p, p.clone().add(V(0, 3, 0)), V(W / 2 + 2, y0 + 0.4, p.z + 2)] : [p, p.clone().add(V(2, 0, 1.5)), V(W / 2 + 2, y0 + 0.4, D / 2 + 1)]; };
  const camino = (b, x, alto) => [...salida(b), V(x - 3, y0 + 0.4, 0.5), alto];
  const capas = {};

  // ---------- terreno: suelo en corte, electrodo E, cables a E, P y C ----------
  {
    const g = new THREE.Group(), x0 = -W / 2 - 30, x1 = xC + 16, prof = 34;
    const suelo = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, prof, 32), new THREE.MeshStandardMaterial({ color: 0x8a6a48, transparent: true, opacity: 0.3, depthWrite: false, roughness: 1 }));
    suelo.position.set((x0 + x1) / 2, y0 - prof / 2 - 0.05, 0);
    const pasto = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, 32), new THREE.MeshStandardMaterial({ color: 0x7c9a5a, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide }));
    pasto.rotation.x = -PI / 2; pasto.position.set((x0 + x1) / 2, y0 - 0.04, 0);
    const capaS = [0.35, 0.7].map(f => { const l = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.25, 0.1), new THREE.MeshBasicMaterial({ color: 0x5b4330 })); l.position.set((x0 + x1) / 2, y0 - prof * f, 16); return l; });
    const cobre = mat('#c07a3e', { metalness: 0.9, roughness: 0.3 });
    const electrodo = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 30, 16), cobre); electrodo.position.set(xE, y0 - 13, 0);
    const camarilla = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 2.4, 24, 1, true), mat('#9a9a96', { roughness: 0.9 })); camarilla.position.set(xE, y0 - 0.8, 0);
    const cab = (b, x, alto, col) => tubo(camino(b, x, alto), 0.22, mat(col, { roughness: 0.5 }));
    g.add(suelo, pasto, ...capaS, electrodo, camarilla,
      cab('borne_e', xE, V(xE, y0 + 1.2, 0), '#2f9e44'), cab('borne_s', xP, topJ(xP), '#e8c21c'), cab('borne_h', xC, topJ(xC), '#d03a32'),
      rt('E · electrodo bajo prueba', V(xE + 4, y0 - 31, 0), { ancho: 6.4, color: '#9ff0b4' }),
      rt('P (S) · 62 %', V(xP, y0 + 23, 0), { ancho: 3.8, color: '#ffe680' }), rt('C (H) · 100 %', V(xC, y0 + 23, 0), { ancho: 3.8, color: '#ff9aa9' }),
      rt('distancias sin escala', V((xE + xC) / 2, y0 - 31, 0), { ancho: 5.4, color: '#cbd5e1' }));
    // cota E-P-C
    for (const [a, b, t] of [[xE, xP, '0,62·d'], [xE, xC, 'd']]) {
      const yy = y0 + (t === 'd' ? 33 : 28.5), l = new THREE.Mesh(new THREE.BoxGeometry(b - a, 0.2, 0.2), mb(BLANCO, { opacity: 0.8 })); l.position.set((a + b) / 2, yy, 0); l.renderOrder = 9;
      g.add(l, rt(t, V((a + b) / 2, yy + 2.6, 0), { esc: 1.1, ancho: 2.6 }));
    }
    capas.terreno = g;
  }

  // ---------- corriente de ensayo: oscilador -> H -> C -> suelo -> E -> borne E ----------
  {
    const g = new THREE.Group(), fondoC = V(xC, y0 - HUNDE + 1, 0), fondoE = V(xE, y0 - 22, 0);
    g.add(flujo([...camino('borne_h', xC, topJ(xC)), fondoC], { color: AMARILLO, cono: true, n: 26, vel: 0.06, tam: 0.7, r: 0.25 }));
    for (const k of [6, 13, 21]) g.add(flujo([fondoC, V(xC - 25, y0 - HUNDE - k, 0), V(xE + 30, y0 - HUNDE - k * 1.1, 0), fondoE.clone().add(V(1, 4 - k / 3, 0))], { color: AMARILLO, cono: true, n: 12, vel: 0.06, tam: 0.6, r: 0.18, tension: 0.5 }));
    g.add(flujo([V(xE, y0 - 20, 0), V(xE, y0 + 1.2, 0), ...camino('borne_e', xE, V(xE, y0 + 1.2, 0)).reverse().slice(1)], { color: AMARILLO, cono: true, n: 14, vel: 0.06, tam: 0.6, r: 0.2 }));
    g.add(rt('corriente de ensayo (alterna; se dibuja en un sentido)', V((xE + xC) / 2, y0 - 25, 0), { ancho: 13, color: '#ffe08a' }));
    capas.corriente = juntar(g);
  }

  // ---------- potencial: curva R medida según la posición de P, meseta y lectura de P hacia S ----------
  {
    const g = new THREE.Group(), base = y0 + 40, esc = 11, a = 0.03, R = u => Math.min(1 - a - a / u + a / (1 - u), 1.75);
    const pts = []; for (let i = 0; i <= 80; i++) { const u = 0.035 + i / 80 * 0.935; pts.push(V(xE + u * DIST, base + Math.max(R(u), 0) * esc, -4)); }
    const eje = new THREE.Mesh(new THREE.BoxGeometry(DIST, 0.2, 0.2), mb(BLANCO, { opacity: 0.6 })); eje.position.set(xE + DIST / 2, base, -4); eje.renderOrder = 9;
    const curva = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, 0.35, 8), mb(VERDE)); curva.renderOrder = 9;
    const meseta = new THREE.Mesh(new THREE.BoxGeometry(0.34 * DIST, esc * 0.35, 0.3), mb(VERDE, { opacity: 0.18 })); meseta.position.set(xE + 0.57 * DIST, base + esc, -4.2); meseta.renderOrder = 8;
    const marca = new THREE.Mesh(new THREE.SphereGeometry(1.0, 16, 12), mb(BLANCO)); marca.renderOrder = 10;
    g.add(eje, curva, meseta, marca,
      ...[0.52, 0.62, 0.72].map(u => { const t = new THREE.Mesh(new THREE.BoxGeometry(0.2, esc * 1.1, 0.2), mb(u === 0.62 ? 0xffe680 : BLANCO, { opacity: 0.7 })); t.position.set(xE + u * DIST, base + esc * 0.55, -4); t.renderOrder = 9; return t; }),
      rt('R medida según dónde se clava P', V(xE + 0.3 * DIST, base + esc * 1.9, -4), { ancho: 8.4, color: '#9ff0b4' }),
      rt('meseta: lectura correcta', V(xE + 0.6 * DIST, base + esc * 1.45, -4), { ancho: 6.2, esc: 1.2, color: '#9ff0b4' }),
      rt('52 · 62 · 72 %', V(xE + 0.62 * DIST, base - 3, -4), { ancho: 4.2, esc: 1.1 }));
    g.add(flujo([topJ(xP), ...camino('borne_s', xP, topJ(xP)).reverse().slice(1)], { color: CELESTE, cono: true, n: 16, vel: 0.07, tam: 0.6, r: 0.2 }));
    g.userData.tick = ({ t }) => { const u = 0.08 + 0.84 * (0.5 - 0.5 * Math.cos(t * 0.5)); marca.position.set(xE + u * DIST, base + Math.max(R(u), 0) * esc, -4); };
    capas.potencial = juntar(g);
  }

  // ---------- cálculo R = V / I en el equipo (aguja o pantalla) ----------
  const zP = D / 2 - D * 0.5, yc = 0.22 * H, mic = V(0.26 * W, yc + 0.6, zP - 0.3), osc = V(-0.3 * W + 1.8, yc + 0.6, zP - 0.8), pan = V(m.panel.pantalla[0] * W, m.panel.pantalla[1] * H, D / 2 + 0.5);
  {
    const g = new THREE.Group();
    g.add(flujo([pos.borne_s, mic], { color: CELESTE, cono: true, n: 8, vel: 0.12, tam: 0.3, r: 0.08 }),
      flujo([osc, pos.borne_h], { color: AMARILLO, cono: true, n: 8, vel: 0.12, tam: 0.3, r: 0.08 }),
      flujo([mic, pan], { color: BLANCO, cono: true, n: 6, vel: 0.12, tam: 0.3, r: 0.08 }),
      re('R = V / I', V(0, H / 2 + 6, D / 2 + 2), { ancho: 3.4, esc: 2.2, color: '#ffe08a' }),
      re(analogico ? 'la aguja indica R en la escala' : 'lectura de ejemplo, no medida', V(pan.x, pan.y - H * 0.32, D / 2 + 3), { ancho: 7.5, esc: 1.3 }));
    if (analogico && pos.aguja) g.userData.tick = ({ t }) => { const k = Math.min((t % 6) / 2.5, 1); pos.aguja.rotation.z = 0.95 - (0.95 - 0.25) * (1 - (1 - k) ** 3) + 0.03 * Math.sin(t * 9) * (1 - k); };
    capas.calculo = juntar(g);
  }

  // ---------- ruido: tensión de la red (50 Hz) frente a la señal de ensayo (otra frecuencia) ----------
  {
    const g = new THREE.Group(), x0 = -W / 2, L = W, N = 200, z = D / 2 + 5;
    const onda = (y, amp, ciclos, color) => {
      const geo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
      const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, depthTest: false, transparent: true })); l.renderOrder = 9;
      l.userData.tick = ({ t }) => { const p = geo.attributes.position; for (let i = 0; i < N; i++) { const u = i / (N - 1); p.setXYZ(i, x0 + u * L, y + amp * Math.sin(2 * PI * ciclos * u - t * 3), z); } p.needsUpdate = true; };
      return l;
    };
    g.add(onda(H / 2 + 5, 1.6, 5, GRIS), onda(H / 2 + 10, 1.2, 12.8, VERDE),
      re('red 50 Hz: se filtra', V(W / 2 + 7, H / 2 + 5, z), { ancho: 5.4, color: '#e2e8f0' }),
      re(`ensayo ${m.frec_corta || '128 Hz'}`, V(W / 2 + 7, H / 2 + 10, z), { ancho: 5.4, color: '#9ff0b4' }),
      flecha(V(0.26 * W, H / 2 + 3, z), V(0, -1, 0.15), 6, CELESTE, 0.15));
    capas.ruido = juntar(g);
  }

  // ---------- jabalinas auxiliares: su resistencia de contacto ----------
  {
    const g = new THREE.Group();
    for (const [x, c, t] of [[xC, ROJO, 'Rc / Rh: resistencia de la jabalina C'], [xP, AMARILLO, 'Rp / Rs: resistencia de la jabalina P']]) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(7, 24, 12, 0, PI * 2, PI / 2, PI / 2), mb(c, { opacity: 0.22, side: THREE.DoubleSide })); s.position.set(x, y0, 0); s.renderOrder = 8;
      const r = new THREE.Mesh(new THREE.TorusGeometry(7, 0.25, 6, 40), mb(c, { opacity: 0.8 })); r.rotation.x = PI / 2; r.position.set(x, y0 + 0.1, 0); r.renderOrder = 9;
      r.userData.tick = ({ t: tt }) => r.scale.setScalar(1 + 0.08 * Math.sin(tt * 3));
      g.add(s, r, rt(t, V(x, y0 - (c === ROJO ? 25 : 17), 0), { ancho: 9, esc: 1.1, color: c === ROJO ? '#ff9aa9' : '#ffe680' }));
    }
    g.add(rt('suelo seco: regar el punto (Kyoritsu)', V(xP - 30, y0 + 12, 0), { ancho: 8.6, esc: 1.1 }));
    capas.auxiliares = juntar(g);
  }

  // ---------- valor aceptable según la RIC N°06 (lectura de ejemplo: 12,4 Ω) ----------
  {
    const g = new THREE.Group(), x = W / 2 + 5, k = 0.18, z = 2;   // 1 Ω = 0,18 cm
    for (const [a, b, c] of [[0, 20, VERDE], [20, 80, AMARILLO], [80, 100, ROJO]]) { const s = new THREE.Mesh(new THREE.BoxGeometry(2.4, (b - a) * k, 0.6), mb(c, { opacity: 0.75 })); s.position.set(x, y0 + (a + b) / 2 * k, z); s.renderOrder = 9; g.add(s); }
    const mk = flecha(V(x - 4.5, y0 + 12.4 * k, z), V(1, 0, 0), 3, BLANCO, 0.12);
    g.add(mk, re('≤ 20 Ω tierra de servicio (RIC N°06 6.1)', V(x + 11, y0 + 20 * k, z), { ancho: 11, color: '#9ff0b4' }),
      re('≤ 80 Ω solo casos 6.2.1 y 6.2.2', V(x + 9.5, y0 + 80 * k, z), { ancho: 9, color: '#ffe08a' }),
      re('ejemplo: 12,4 Ω', V(x - 7, y0 + 12.4 * k + 2.2, z), { ancho: 4.6 }));
    capas.norma = g;
  }

  // ---------- seguridad: tormenta y zonas con potencial durante el ensayo ----------
  {
    const g = new THREE.Group(), s = new THREE.Shape();
    [[0, 0], [5, 0], [2, 7], [7, 7], [-3, 22], [0, 11], [-5, 11]].forEach(([a, b], i) => (i ? s.lineTo(a, b) : s.moveTo(a, b)));
    const rayo = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false }), mb(0xffe14d)); rayo.position.set((xE + xC) / 2, y0 + 30, 0); rayo.rotation.z = PI; rayo.renderOrder = 10;
    rayo.userData.tick = ({ t }) => { rayo.material.opacity = (t * 2 % 3) < 0.25 ? 1 : 0.35; };
    g.add(rayo);
    for (const x of [xE, xC]) { const d = new THREE.Mesh(new THREE.CircleGeometry(9, 32), mb(ROJO, { opacity: 0.3, side: THREE.DoubleSide })); d.rotation.x = -PI / 2; d.position.set(x, y0 + 0.15, 0); d.renderOrder = 8; g.add(d); }
    g.add(rt('con tormenta en el área: no medir', V((xE + xC) / 2, y0 + 36, 0), { ancho: 8.4, color: '#ffe14d' }),
      rt('suelo con potencial junto a E y C', V(xE + 22, y0 - 22, 0), { ancho: 8.2, color: '#ff9aa9' }));
    capas.seguridad = juntar(g);
  }

  // las jabalinas pasan del maletín al terreno mientras dura el modo Funciona
  const mover = [['jabalina_c', pos.jabC, xC], ['jabalina_p', pos.jabP, xP]].map(([id, p, x]) => ({ ids: [id], eje: V(x - p.x, -HUNDE, 0), f: () => 1 }));
  return { capas, mover };
}
