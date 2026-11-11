// Capas animadas del modo "Funcionamiento" del rotomartillo (arquitectura Makita HR2600/HR2601).
// Coordenadas del modelo (modelo.js): eje de la broca = X (frente +X), inducido en y = YM, eje intermedio en y = YS.
// Sentidos: la broca gira hacia la derecha vista desde atrás (+ sobre +X); el eje intermedio, al revés; el inducido, igual que la broca.
// Relaciones: eje intermedio / portaherramienta = 4.600 golpes / 1.200 rpm = 3,83 (ficha: un golpe por vuelta del plato oscilante).
// La relación piñón / engranaje helicoidal 26 no está en las fuentes: se usan los 6 dientes dibujados en el piñón (ilustrativo).
import * as THREE from 'three';
import { V, PI } from '../lib.js';
import { flujo, flecha, rotulo, mb } from '../vivo.js';

const YS = -2.45, YM = -3.75, EX = V(1, 0, 0), EY = V(0, 1, 0);
const AMARILLO = 0xffc83d, NARANJA = 0xff9f43, CELESTE = 0x4dd0ff, ROJO = 0xff5470, AIRE = 0x7dd3fc, VERDE = 0x4ade80, AZUL = 0x6aa9ff;
const KM = 4, KI = -KM * 6 / 26, KS = -KI / 3.83;   // inducido, eje intermedio (plato oscilante) y portaherramienta, respecto a ctx.ang
const ALFA = 0.32, PIV = [0.55, YS], D = 1.72;     // inclinación del rodamiento oscilante (modelo.js), su centro y la distancia a la unión del pistón
const LAG = 1.3;                                   // atraso del martillo respecto al pistón (colchón de aire): aproximado

// rodamiento oscilante: el aro interior gira inclinado con el eje; el aro exterior y su poste solo cabecean (el pistón no los deja girar).
// eje del aro a la fase φ: n = (cos α, sen α cos φ, sen α sen φ); el poste queda en la dirección p = Y sin su componente sobre n.
const ejes = (phi) => {
  const n = V(Math.cos(ALFA), Math.sin(ALFA) * Math.cos(phi), Math.sin(ALFA) * Math.sin(phi));
  const p = EY.clone().addScaledVector(n, -n.y).normalize();
  return [n, p, n.clone().cross(p)];
};
const R0inv = new THREE.Matrix4().makeBasis(...ejes(0)).invert(), mR = new THREE.Matrix4();
const px0 = ejes(0)[1].x;
const dxPiston = phi => D * (ejes(phi)[1].x - px0);             // 0 (atrás, como está dibujado) a ~1,1 cm
const sMart = phi => 0.3 + 0.9 * (1 - Math.cos(phi - LAG));     // martillo: 0,3 a 2,1 cm, atrasado respecto al pistón
const bPerno = phi => Math.max(0, sMart(phi) - 1.9);            // el martillo alcanza al perno (7,4) y lo empuja ~2 mm

// arco de giro alrededor del eje X, inclinado 35° hacia la vista lateral para que no se vea de canto
const arco = (x, yc, r, k, color = VERDE, tam = 0.18) => flujo(Array.from({ length: 16 }, (_, i) => { const a = Math.sign(k) * i / 15 * PI * 1.6, z = r * Math.sin(a); return V(x - z * 0.57, yc + r * Math.cos(a), z * 0.82); }),
  { color, cono: true, n: 3, vel: 0.12, tam, r: 0.045, tension: 0.5 });
const juntar = (g) => { const f = g.children.filter(o => o.userData.tick).map(o => o.userData.tick); g.userData.tick = c => f.forEach(t => t(c)); return g; };

// vueltas de una bobina de campo alrededor de un polo en ±Z, de z0 a z1 (antihorario visto desde +Z: campo hacia +Z)
const bobina = (z0, z1, vueltas = 3) => {
  const c = [[-10.9, 0.9], [-10.9, -0.9], [-3.7, -0.9], [-3.7, 0.9]], p = [];
  for (let i = 0; i <= vueltas * 4; i++) { const [x, y] = c[i % 4]; p.push(V(x, YM + y, z0 + (z1 - z0) * i / (vueltas * 4))); }
  return p;
};
// lazo de campo en el plano YZ: cruza el inducido de -Z (norte) a +Z (sur) y vuelve por la corona del estator
const lazo = (x, s) => [[1.9, .7], [0, .7], [-1.9, .7], [-2.45, 1.0], [-2.55, 1.6], [-1.85, 2.3], [0, 2.65], [1.85, 2.3], [2.55, 1.6], [2.45, 1.0]].map(([z, y]) => V(x, YM + s * y, -z));

export function vivoRoto(parts, k, m) {
  const capas = {}, kv = v => v.clone().multiplyScalar(k);
  const tres = m?.modos === 3, avt = !!m?.avt;

  // ---------- alimentación: cable -> interruptor -> campo (en serie) -> carbón superior -> inducido -> carbón inferior -> interruptor -> cable ----------
  const ida = [V(-23, -21.5, 0.25), V(-19.6, -20, 0.25), V(-18, -18, 0.25), V(-17.2, -16.3, 0.25), V(-16.2, -13, 0.3), V(-15, -10.5, 0.35), V(-14.2, -9.2, 0.45), V(-13.6, -7.6, 0.6), V(-12.2, -6.2, 1.8), V(-11.2, YM - 0.9, 2.85)];
  const vuelta = ida.map(p => V(p.x, p.y, -p.z)).reverse();
  capas.corriente = flujo([
    ...ida, ...bobina(2.85, 2.35),
    V(-11.3, YM + 2.0, 1.3), V(-11.4, YM + 2.7, 0), V(-11.3, YM + 2.0, -1.3),
    ...bobina(-2.35, -2.85),
    V(-11.6, YM + 1.6, -2.4), V(-12, YM + 2.3, -0.6), V(-12, YM + 1.9, 0), V(-12, YM + 1.05, 0),
    V(-11.4, YM + 0.9, 0.9), V(-10.1, YM + 0.6, 1.4), V(-4.5, YM + 0.6, 1.4), V(-4.1, YM, 0), V(-4.5, YM - 0.6, -1.4), V(-10.1, YM - 0.6, -1.4), V(-11.4, YM - 0.9, -0.9),
    V(-12, YM - 1.05, 0), V(-12, YM - 1.9, 0), V(-12.6, YM - 2.6, -0.4), V(-13.2, -6.9, -0.6), ...vuelta.slice(2),
  ], { color: AMARILLO, n: 56, vel: 0.04, tam: 0.17, r: 0.06 });

  // campo: seis lazos (tres posiciones a lo largo del núcleo x dos mitades)
  const campo = new THREE.Group();
  for (const x of [-9, -7.3, -5.6]) for (const s of [1, -1]) campo.add(flujo(lazo(x, s), { color: AZUL, cerrado: true, cono: true, n: 8, vel: 0.07, tam: 0.2, r: 0.05, tension: 0.5 }));
  campo.add(rotulo('N', V(-8.3, YM, -4.4), { color: '#ff8a8a', esc: 1.1 }), rotulo('S', V(-6.3, YM, 4.4), { color: '#8ab8ff', esc: 1.1 }));
  capas.campo = juntar(campo);

  // conductores del inducido: 12 lados que giran; la corriente cambia de sentido al pasar por la línea de los carbones (arriba y abajo)
  const cond = new THREE.Group(), lados = [];
  for (let i = 0; i < 12; i++) {
    const g = new THREE.Group(), ada = flecha(V(-10.1, 0, 0), EX, 5.6, NARANJA, 0.09), atr = flecha(V(-4.5, 0, 0), EX.clone().negate(), 5.6, CELESTE, 0.09);
    g.add(ada, atr); cond.add(g); lados.push({ g, ada, atr });
  }
  cond.userData.tick = ({ ang }) => lados.forEach(({ g, ada, atr }, i) => {
    const a = i / 12 * PI * 2 + KM * ang, s = Math.sin(a);
    g.position.set(0, YM + 1.75 * Math.cos(a), 1.75 * s);
    ada.visible = s > 0.3; atr.visible = s < -0.3;
  });
  capas.conductores = cond;

  // fuerza: corriente +X bajo el polo sur (+Z) con campo +Z -> fuerza hacia -Y; al otro lado, hacia +Y: par a la derecha visto desde atrás
  const fuerza = new THREE.Group();
  fuerza.add(flecha(V(-7.3, YM, 1.8), EY.clone().negate(), 2.6, ROJO, 0.12), flecha(V(-7.3, YM, -1.8), EY, 2.6, ROJO, 0.12));
  fuerza.add(rotulo('F', V(-7.3, YM - 3.1, 1.8), { color: '#ff9aa9', esc: 1.1 }), rotulo('F', V(-7.3, YM + 3.1, -1.8), { color: '#ff9aa9', esc: 1.1 }));
  capas.fuerza = fuerza;

  capas.sentido = arco(-2.6, YM, 3.0, KM, 0xffffff, 0.2);

  // aire de enfriamiento: entra por las rendijas traseras, recorre colector, inducido y campo, y lo expulsa el ventilador (ruta típica, no documentada)
  const aire = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * PI * 2 + 0.3, c = Math.cos(a), s = Math.sin(a);
    aire.add(flujo([V(-14.6, YM + 2.7 * c, 2.7 * s), V(-12.5, YM + 2.3 * c, 2.3 * s), V(-7.3, YM + 2.25 * c, 2.25 * s), V(-4.0, YM + 2.4 * c, 2.4 * s), V(-2.6, YM + 3.6 * c, 3.6 * s)], { color: AIRE, cono: true, n: 6, vel: 0.07, tam: 0.14, r: 0.04, tension: 0.4 }));
  }
  capas.aire = juntar(aire);

  // ---------- transmisión: piñón -> helicoidal 26 -> eje intermedio -> engranaje 10 -> engranaje 51 ----------
  const tr = new THREE.Group();
  tr.add(arco(-2.4, YM, 0.6, KM, 0xffffff, 0.14), arco(-0.8, YS, 1.4, KI), arco(4.5, YS, 0.85, KI), arco(4.5, 0, 2.5, KS, VERDE, 0.2));
  tr.add(rotulo('piñón', V(-3.2, YM - 1.8, 0), { esc: 1, ancho: 1.8 }), rotulo('helicoidal 26', V(-1.2, YS + 2.4, 0), { esc: 1, ancho: 3 }),
    rotulo('engranaje 10', V(4.2, YS - 2.0, 0), { esc: 1, ancho: 3 }), rotulo('engranaje 51', V(4.8, 3.6, 0), { esc: 1, ancho: 3 }));
  capas.transmision = juntar(tr);

  // ---------- limitador de torque: el resorte 31 aprieta el engranaje 51 contra la brida por los pines 6 ----------
  const lim = new THREE.Group();
  for (const a of [0, PI / 2, PI, PI * 1.5]) lim.add(flecha(V(2.7, 1.75 * Math.cos(a), 1.75 * Math.sin(a)), EX, 1.4, ROJO, 0.08));
  lim.add(arco(5.2, 0, 2.3, KS, VERDE, 0.2));
  lim.add(rotulo('resorte 31', V(2.4, 3.3, 0), { esc: 1, ancho: 2.6 }), rotulo('pines 6', V(4.4, -3.4, 0), { esc: 1, ancho: 2 }), rotulo('bolas 4', V(6.2, 2.9, 0), { esc: 1, ancho: 2 }));
  capas.limitador = juntar(lim);

  // ---------- broca (fantasma: no es pieza del modelo): gira con el portaherramienta y avanza con el perno de impacto ----------
  const broca = new THREE.Group(), cuerpo = new THREE.Group();
  const cilX = (r, x0, x1, c, op) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, x1 - x0, 20), mb(c, { opacity: op })); o.rotation.z = -PI / 2; o.position.x = (x0 + x1) / 2; o.renderOrder = 7; return o; };
  cuerpo.add(cilX(0.5, 10.9, 17.5, 0x9aa3ad, 0.5), cilX(0.4, 17.5, 23.2, 0x9aa3ad, 0.5));
  const hel = Array.from({ length: 60 }, (_, i) => { const a = i / 59 * PI * 6; return V(17.5 + i / 59 * 5.6, 0.42 * Math.cos(a), 0.42 * Math.sin(a)); });
  const espiral = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hel), 120, 0.06, 6), mb(0xffffff, { opacity: 0.8 })); espiral.renderOrder = 8;
  const punta = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.9, 4), mb(0xb0b6bd, { opacity: 0.6 })); punta.rotation.z = -PI / 2; punta.position.x = 23.6; punta.renderOrder = 8;
  cuerpo.add(espiral, punta); broca.add(cuerpo);
  const golpe = flecha(V(23.9, 0, 0), EX, 2.2, ROJO, 0.16); broca.add(golpe);
  broca.userData.tick = ({ ang }) => { const ph = fase(ang); cuerpo.rotation.x = kPorta() * ang; cuerpo.position.x = bPerno(ph); golpe.visible = bPerno(ph) > 0.05; };
  capas.broca = broca;

  // ---------- rodamiento oscilante: giro del aro interior y vaivén del poste ----------
  const osc = new THREE.Group();
  osc.add(arco(0.55, YS, 1.35, KI, VERDE, 0.16), flecha(V(0.9, 1.9, 0), EX, 1.6, 0xffffff, 0.08), flecha(V(0.7, 1.9, 0), EX.clone().negate(), 1.6, 0xffffff, 0.08));
  osc.add(rotulo('vaivén', V(0.8, 3.1, 0), { esc: 1, ancho: 2 }), rotulo('rodamiento oscilante', V(0.4, YS - 2.3, 0), { esc: 1, ancho: 4.2 }));
  capas.oscilante = juntar(osc);

  // ---------- colchón de aire entre el fondo del cilindro pistón y el martillo ----------
  const col = new THREE.Group(), G0 = 3.2;
  const aireM = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 1, 24), mb(AIRE, { opacity: 0.55 })); aireM.rotation.z = -PI / 2; aireM.renderOrder = 8;
  const empuja = flecha(V(0, 1.45, 0), EX, 1.4, ROJO, 0.1), tira = flecha(V(0, 1.45, 0), EX.clone().negate(), 1.4, AZUL, 0.1);
  const rp = rotulo('presión', V(0, 2.4, 0), { esc: 0.9, ancho: 2.2, color: '#ff9aa9' }), rv = rotulo('vacío', V(0, 2.4, 0), { esc: 0.9, ancho: 2, color: '#8ab8ff' });
  col.add(aireM, empuja, tira, rp, rv);
  const cA = new THREE.Color(0x5aa0ff), cB = new THREE.Color(0xff7a45);
  col.userData.tick = ({ ang }) => {
    const ph = fase(ang), x0 = 0.95 + dxPiston(ph), x1 = 3.5 + sMart(ph), g = x1 - x0, u = THREE.MathUtils.clamp((G0 - g) / 1.2, -1, 1);
    aireM.position.x = (x0 + x1) / 2; aireM.scale.set(1, g, 1);
    aireM.material.color.copy(cA).lerp(cB, (u + 1) / 2);
    empuja.visible = rp.visible = u > 0.25; tira.visible = rv.visible = u < -0.25;
    empuja.position.x = x1 - 0.4; tira.position.x = x1 + 0.6; rp.position.x = rv.position.x = x1;
  };
  capas.colchon = col;

  // ---------- selector de modo: con la leva de embrague B desacoplada el plato oscilante no recibe giro ----------
  const modo = new THREE.Group();
  modo.add(flecha(V(1.2, YS - 1.2, 0), EX, 1.4, 0xffffff, 0.08), rotulo('leva B se separa', V(1.8, YS - 2.4, 0), { esc: 1, ancho: 3.6 }), rotulo('sin golpe', V(3, 2.2, 0), { esc: 1, ancho: 2.4, color: '#8ab8ff' }));
  capas.soloGiro = modo;
  const soloGiro = () => capas.soloGiro.visible;   // la app fija la visibilidad de las capas después de mover las piezas: va un cuadro atrasado, sin efecto visible
  if (tres) { capas.soloPercusion = new THREE.Group(); capas.soloPercusion.add(rotulo('broca sin giro', V(8, 3.4, 0), { esc: 1, ancho: 3.4, color: '#8ab8ff' })); }
  const soloPerc = () => !!capas.soloPercusion?.visible;
  const fase = ang => (soloGiro() ? 0 : KI * ang);
  const kPorta = () => (soloPerc() ? 0 : KS);

  // ---------- AVT (HR2601): el contrapeso oscila contra la percusión (fase ilustrativa) ----------
  if (avt) {
    const g = new THREE.Group();
    g.add(flecha(V(0.9, 3.9, 0), EX, 1.4, 0xffffff, 0.08), flecha(V(0.3, 3.9, 0), EX.clone().negate(), 1.4, 0xffffff, 0.08), rotulo('contrapeso AVT', V(0.6, 5.1, 0), { esc: 1, ancho: 3.4 }));
    capas.avt = g;
  }

  for (const c of Object.values(capas)) { c.visible = false; c.scale.multiplyScalar(k); }   // el HR2470 se escala por su largo (modelo.js)

  // aro exterior y poste del rodamiento oscilante: cabeceo alrededor de su centro. La app solo traslada (mover) y gira en un sentido (giros):
  // este mover reorienta el item a mano (la app le deja la rotación en identidad justo antes de llamarlo) y devuelve 0.
  const aroExt = parts.oscilante.items[1].obj, piv = V(PIV[0] * k, PIV[1] * k, 0), q = new THREE.Quaternion();
  const cabeceo = ({ ang }) => {
    q.setFromRotationMatrix(mR.makeBasis(...ejes(fase(ang))).multiply(R0inv));
    aroExt.quaternion.copy(q); aroExt.position.add(piv.clone().sub(piv.clone().applyQuaternion(q)));
    return 0;
  };

  return {
    capas,
    giros: [
      { ids: ['inducido'], c: kv(V(0, YM, 0)), e: EX, k: KM },
      { ids: ['helicoidal', 'engranaje10', 'leva'], c: kv(V(0, YS, 0)), e: EX, k: KI },
      { ids: ['oscilante:0'], c: kv(V(0, YS, 0)), e: EX, get k() { return soloGiro() ? 0 : KI; } },
      { ids: ['engranaje51', 'pines6', 'brida', 'bolas4', 'arandela32', 'resorte31', 'spiro', 'portaherramienta', 'cubierta', 'bolas7', 'anillo21', 'arandela17', 'resorte15', 'resorte14', 'tapa35'],
        c: V(0, 0, 0), e: EX, get k() { return kPorta(); } },
    ],
    mover: [
      { ids: ['oscilante:1'], eje: EX, f: cabeceo },
      { ids: ['piston', 'junta_piston', 'placa_guia'], eje: EX, f: ({ ang }) => k * dxPiston(fase(ang)) },
      { ids: ['martillo', 'oring175'], eje: EX, f: ({ ang }) => k * sMart(fase(ang)) },
      { ids: ['perno'], eje: EX, f: ({ ang }) => k * bPerno(fase(ang)) },
      { ids: ['leva', 'empujador'], eje: EX, f: () => (soloGiro() ? 0.35 * k : 0) },
      ...(avt ? [{ ids: ['contrapeso'], eje: EX, f: ({ ang }) => k * 0.25 * Math.cos(fase(ang)) }] : []),
    ],
  };
}
