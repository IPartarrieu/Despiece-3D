// Demoledores verticales de ~15-18 kg: Makita HM1306 (15,1 kg) y Kothman HK-55 (17,7 kg). AMBOS REFERENCIALES: no hay despiece.
// Unidades: cm. Cincel = eje Y hacia -Y (abajo), cigüeñal con eje X, frente (lado del barril) hacia -X, lado del logo hacia +z.
// Fuente de la arquitectura: folleto oficial Makita HM1317C/HM1307C (familia sucesora del HM1306, misma potencia 1.510 W,
// 1.450 golpes/min y hexagonal 30 mm): cigüeñal perpendicular al barril con biela, pistón y percutor, barril de aluminio,
// portaherramienta de acero, engranajes y escobillas largas. Del manual del HM1306: aceite con varilla de nivel, escobillas con
// tapas y placas, punta aislante, mango lateral giratorio, retenedor que gira 180°, largo 652 mm y ancho 121 mm.
// SUPUESTO (no confirmado con despiece; los sitios de despiece no se pudieron leer): motor paralelo al barril y detrás de él, con un
// piñón cónico que mueve una corona en el cigüeñal; formas, medidas internas y la unidad antivibración del HK-55.
import * as THREE from 'three';
import { vivoVertical, XM, YC, YP, R, L, OFF } from './vivo_vertical.js';
import { PI, V, mat, acero, cobre, goma, mesh, cil, caja, rev, tornillo, laminas, alambre, lienzo, rr } from '../lib.js';
import { tuboY, aroY, planta } from './modelo.js';

const anillo = (x0, x1, ro, ri, m, y, z) => rev([[ri, x0], [ro, x0], [ro, x1], [ri, x1], [ri, x0]], 'x', m, 32, 0, y, z); // tubo de eje X

export function construirVertical(cfg) {
  const m = cfg.m || {}, E = cfg.estilo || {};
  const kot = m.marca === 'Kothman';
  const k = Math.cbrt((m.peso || 15.1) / 15.1); // ponytail: escala pareja por peso (HK-55 ≈ +5 %); sin medidas propias del HK-55
  // HM1306: carcasas teal, mango y retenedor negros (foto de la ficha). HK-55: motor y mango rojos, caja intermedia gris, barril y agarre negros (catálogo).
  const C = kot ? { motor: '#c62828', carter: '#8e9297', barril: '#232427', mango: '#c62828' } : { motor: E.color || '#1595a0', carter: E.color || '#1595a0', barril: E.color || '#1595a0', mango: '#1c1d20' };
  const pint = c => mat(c, { metalness: 0.1, roughness: 0.45 });
  const negro = () => mat(E.negro || '#1c1d20', { metalness: 0.1, roughness: 0.7 });
  const blanco = () => mat('#ecebe4', { metalness: 0, roughness: 0.6 });
  const ac = (c = '#b4b9c0') => acero(c);
  const tor = () => goma('#121315');
  const parts = {};
  const add = (id, nombre, grupo, items, shell = false) => {
    const its = items.map(([objs, dir]) => {
      const g = new THREE.Group(), h = new THREE.Group(); [].concat(objs).forEach(o => h.add(o)); h.position.copy(OFF); g.add(h); g.scale.setScalar(k);
      return { obj: g, dir: dir.clone().multiplyScalar(k) };
    });
    const mats = [];
    its.forEach(i => i.obj.traverse(o => { if (o.material) { o.userData.pid = id; mats.push(o.material); } }));
    parts[id] = { id, nombre, ref: null, grupo, items: its, mats, shell }; // sin números de pieza: no hay despiece del HM1306 ni del HK-55
  };
  const G1 = 'Portaherramienta', G2 = 'Barril y percusión', G3 = 'Cárter y transmisión', G4 = 'Motor', G5 = 'Mango e interruptor';

  // ================= portaherramienta (boca hexagonal, abajo) =================
  add('porta_herr', 'Portaherramienta (boca hexagonal)', G1, [[[
    rev([[1.6, -41], [3.3, -41], [3.6, -39.5], [3.6, -31.2], [4.4, -30.7], [4.4, -30], [1.6, -30], [1.6, -41]], 'y', acero('#55595f', { metalness: 0.7, roughness: 0.4 }), 48),
    cil('y', 1.62, 1.62, 10.8, 0, -35.5, 0, mat('#0d0e10'), 6, true), // boca hexagonal
  ], V(0, -24, 0)]], true);
  add('tornillos_porta', 'Pernos del portaherramienta', G1, [[[0, 1, 2, 3].map(i => { const a = (i + 0.5) * PI / 2, t = tornillo('y', 3.95 * Math.cos(a), -30.75, 3.95 * Math.sin(a), 0.3); t.rotation.x = PI; return t; }), V(0, -19, 0)]]);
  add('retenedor', 'Retenedor del útil', G1, [[[
    cil('z', 0.45, 0.45, 9.0, -2.6, -34.5, 0, ac('#8d939a')),
    ...[-1, 1].map(s => caja(4.2, 0.9, 0.6, -4.4, -35.6, s * 4.2, negro()).rotateZ(0.5)),
    cil('z', 0.65, 0.65, 9.0, -6.2, -36.7, 0, negro()),
  ], V(-11, -26, 0)]]);
  add('golpeo', 'Pieza de golpeo (perno de impacto)', G1, [[[
    rev([[0.01, -26], [1.45, -26], [1.45, -21], [2.0, -20.6], [2.0, -19.4], [1.6, -19], [1.6, -15.8], [0.01, -15.8]], 'y', acero('#c3c7cc', { metalness: 0.8 }), 32),
  ], V(-15, -17, 0)]]);
  add('goma_golpeo', 'Anillo de goma y junta de la pieza de golpeo', G1, [[[tuboY(-18.9, -18.1, 2.25, 1.62, goma('#2a2c30')), aroY(0, -22.5, 0, 1.47, 0.1, tor())], V(-11, -13, 0)]]);

  // ================= barril y percusión =================
  add('barril', 'Barril', G2, [[[
    rev([[2.8, -30], [4.1, -30], [4.1, -29], [3.9, -27], [3.9, -6], [4.6, -3], [5.3, -1], [2.8, -1], [2.8, -30]], 'y', pint(C.barril), 48),
    ...[-26, -10, -6].map(y => aroY(0, y, 0, 3.93, 0.12, mat('#2c2e32'))),
  ], V(0, -12, 0)]], true);
  add('cilindro', 'Cilindro', G2, [[[rev([[2.2, -16], [2.75, -16], [2.75, -1.6], [3.3, -1.2], [3.3, -0.5], [2.2, -0.5], [2.2, -16]], 'y', acero('#c5c9ce', { metalness: 0.75 }), 40)], V(-13, -6, 0)]]);
  add('percutor', 'Percutor con junta tórica', G2, [[[
    rev([[0.01, -13.5], [1.4, -13.5], [1.6, -13], [1.6, -11.5], [2.18, -11.2], [2.18, -9], [2.0, -8.5], [0.01, -8.5]], 'y', acero('#d2d5da', { metalness: 0.8 }), 32),
    aroY(0, -10.1, 0, 2.15, 0.1, tor()),
  ], V(-19, -8, 0)]]);
  add('piston', 'Pistón con pasador y junta', G2, [[[
    rev([[0.01, YP - 1.6], [2.18, YP - 1.6], [2.18, YP + 1.3], [1.7, YP + 1.3], [1.7, YP - 1.1], [0.01, YP - 1.1]], 'y', acero('#a9aeb5'), 32),
    aroY(0, YP - 1.2, 0, 2.15, 0.11, tor()), cil('x', 0.42, 0.42, 4.1, 0, YP, 0, acero('#d0d3d8'), 16),
  ], V(-16, 2, 8)]]);
  add('biela', 'Biela', G2, [[[
    anillo(-0.4, 0.4, 1.05, 0.55, acero('#8f959c'), YC + R, 0), anillo(-0.35, 0.35, 0.65, 0.42, acero('#8f959c'), YP, 0),
    caja(0.6, L - 1.6, 0.8, 0, (YC + R + YP) / 2, 0, acero('#8f959c')),
  ], V(-16, 2, 8)]]);
  add('mango_lateral', 'Mango lateral giratorio', G2, [[[
    tuboY(-22.6, -20.6, 4.6, 3.95, negro()), caja(2.2, 2.0, 2.0, 0, -21.6, 5.4, negro()),
    cil('z', 1.4, 1.5, 12, 0, -21.6, 12.2, goma('#232427'), 24), cil('z', 1.6, 1.6, 0.8, 0, -21.6, 18.4, negro(), 24),
  ], V(0, 0, 14)]]);

  // ================= cárter (caja del cigüeñal con aceite) y transmisión =================
  add('carter', 'Cárter (caja del cigüeñal, con aceite)', G3, [[[
    planta(-5.2, 16.5, -6.0, 6.0, 2.4, -1, 11, pint(C.carter)),
    ...[2, 4, 6, 8].map(y => caja(0.4, 0.35, 10.6, -5.25, y, 0, mat('#2c2e32'))), // nervios frontales
  ], V(0, 0, 0)]], true);
  add('tapa_carter', 'Tapa del cárter', G3, [[[cil('z', 4.0, 4.0, 0.6, 0, YC, 6.25, pint(C.carter)), ...[0, 1, 2, 3].map(i => tornillo('z', 3.3 * Math.cos(i * PI / 2 + PI / 4), YC + 3.3 * Math.sin(i * PI / 2 + PI / 4), 6.56, 0.22))], V(0, 0, 10)]]);
  add('varilla_aceite', 'Varilla de nivel de aceite', G3, [[[cil('y', 1.2, 1.2, 0.9, 5, 10.45, 0, ac('#3a3d42'), 6), cil('y', 0.25, 0.25, 6, 5, 7.3, 0, ac()), aroY(5, 9.95, 0, 0.9, 0.1, tor())], V(0, 10, 0)]]);
  add('ciguenal', 'Cigüeñal con muñequilla', G3, [[[
    cil('x', 0.9, 0.9, 11.4, 7.3, YC, 0, acero('#b9bec4')), cil('x', 2.6, 2.6, 0.8, 1.2, YC, 0, acero('#9da3aa')),
    cil('x', 0.52, 0.52, 1.6, 0.1, YC + R, 0, acero('#cfd3d8')), caja(0.8, 1.6, 3.4, 1.2, YC - 1.5, 0, acero('#9da3aa')), // contrapeso
  ], V(0, 0, 18)]]);
  const dientes = Array.from({ length: 30 }, (_, i) => { const a = i / 30 * PI * 2; return caja(0.5, 0.35, 0.25, 9.0, YC + 3.45 * Math.cos(a), 3.45 * Math.sin(a), acero('#a7adb4')).rotateX(a); });
  add('corona', 'Corona cónica del cigüeñal', G3, [[[cil('x', 3.3, 2.4, 1.2, 8.4, YC, 0, acero('#a7adb4')), ...dientes], V(0, 5, 18)]]);
  add('rodamientos_cig', 'Rodamientos del cigüeñal', G3, [[[anillo(2.0, 3.0, 1.8, 0.9, ac('#c3c8ce'), YC, 0), anillo(12.0, 13.0, 1.8, 0.9, ac('#c3c8ce'), YC, 0)], V(0, -3, 22)]]);

  // ================= motor (vertical, paralelo al barril y detrás) =================
  const logo = lienzo(512, 96, (g, w, h) => { g.fillStyle = '#ffffff'; g.font = `${kot ? 'bold' : 'italic bold'} ${kot ? 70 : 84}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(kot ? 'KOTHMAN' : 'makita', w / 2, h / 2 + 4); });
  const rotuloMotor = mesh(new THREE.PlaneGeometry(14, 2.8), mat('#ffffff', { map: logo, alphaTest: 0.5, metalness: 0.2, roughness: 0.5 }), 10, -9.6, 5.83); rotuloMotor.rotation.z = PI / 2;
  add('carcasa_motor', 'Carcasa del motor', G4, [[[planta(4.6, 15.6, -5.8, 5.8, 2.6, -24, 23, pint(C.motor)), rotuloMotor,
    ...[-22, -21, -20].map(y => caja(0.3, 0.35, 8, 15.62, y, 0, mat('#151618'))), // ranuras de ventilación (aprox.)
  ], V(12, -8, 0)]], true);
  add('estator', 'Estator (campo)', G4, [[[tuboY(-17, -7, 4.1, 2.6, acero('#8c9299', { metalness: 0.6 }), XM, 0), tuboY(-8, -7, 3.6, 2.6, cobre(), XM, 0), tuboY(-17, -16, 3.6, 2.6, cobre(), XM, 0)], V(22, -4, 0)]], true);
  const alam = () => new THREE.MeshStandardMaterial({ map: alambre(), metalness: 0.7, roughness: 0.35 });
  add('inducido', 'Inducido con piñón cónico', G4, [[[
    cil('y', 0.45, 0.45, 21, XM, -10.5, 0, acero('#c9cdd2')), cil('y', 2.45, 2.45, 8, XM, -12, 0, new THREE.MeshStandardMaterial({ map: laminas(), metalness: 0.6, roughness: 0.4 })),
    cil('y', 2.2, 2.2, 0.8, XM, -16.5, 0, alam()), cil('y', 2.2, 2.2, 0.8, XM, -7.5, 0, alam()),
    cil('y', 1.3, 1.3, 2, XM, -18.6, 0, cobre()), cil('y', 1.0, 1.6, 1.0, XM, 0.4, 0, acero('#9aa0a7'), 16),
  ], V(28, -2, 0)]]);
  add('ventilador', 'Ventilador', G4, [[[
    cil('y', 3.6, 3.6, 0.15, XM, -4.6, 0, negro()), cil('y', 1.0, 1.0, 1.1, XM, -4.1, 0, negro()),
    ...Array.from({ length: 12 }, (_, i) => caja(2.5, 1.0, 0.12, XM + 2.25 * Math.cos(i * PI / 6), -4.1, 2.25 * Math.sin(i * PI / 6), negro()).rotateY(-i * PI / 6)),
  ], V(28, -2, 0)]]);
  add('rodamientos_ind', 'Rodamientos del inducido', G4, [[[tuboY(-21, -20.2, 1.2, 0.46, ac('#c3c8ce'), XM, 0), tuboY(-2.4, -1.6, 1.2, 0.46, ac('#c3c8ce'), XM, 0)], V(28, -2, 0)]]);
  add('portaescobillas', 'Portaescobillas', G4, [[[-1, 1].map(s => cil('z', 0.95, 0.95, 2.6, XM, -18.6, s * 3.6, blanco(), 16)), V(22, -12, 0)]]);
  add('escobillas', 'Escobillas con punta aislante', G4, [[caja(0.8, 0.8, 1.8, XM, -18.6, 3.2, mat('#2b2b2b', { roughness: 0.9 })), V(0, 0, 12)], [caja(0.8, 0.8, 1.8, XM, -18.6, -3.2, mat('#2b2b2b', { roughness: 0.9 })), V(0, 0, -12)]]);
  const tapa = s => [cil('z', 1.3, 1.3, 0.5, XM, -18.6, s * 5.95, negro(), 24), caja(3.6, 3.6, 0.2, XM, -18.6, s * 6.3, negro()), tornillo(s > 0 ? 'z' : '-z', XM + 1.4, -17.2, s * 6.42, 0.2), tornillo(s > 0 ? 'z' : '-z', XM - 1.4, -20, s * 6.42, 0.2)];
  add('tapas_escobillas', 'Tapas y placas de las escobillas', G4, [[tapa(1), V(0, 0, 9)], [tapa(-1), V(0, 0, -9)]]);

  // ================= mango superior en lazo e interruptor =================
  const asa = rr(-4.2, 9.6, 15.2, 24.2, 3.0); asa.holes.push(rr(-1.8, 11.2, 12.8, 20.8, 1.5));
  const gAsa = new THREE.ExtrudeGeometry(asa, { depth: 2.9, bevelEnabled: true, bevelSize: 0.35, bevelThickness: 0.35, bevelSegments: 3, curveSegments: 16 }); gAsa.translate(0, 0, -1.8);
  add('mango', 'Mango superior (lazo)', G5, [[[mesh(gAsa, pint(C.mango))], V(0, 12, 0)]], true);
  add('agarre', 'Agarre de goma', G5, [[[cil('x', 1.95, 1.95, 10, 5.5, 22.5, 0, goma('#202124'), 24), ...[1.5, 3.5, 5.5, 7.5, 9.5].map(x => anillo(x - 0.15, x + 0.15, 2.0, 1.9, mat('#2c2e32'), 22.5, 0))], V(0, 15, 0)]]);
  add('interruptor', 'Interruptor con gatillo y botón de bloqueo', G5, [[[
    caja(1.0, 1.9, 1.2, 10.6, 19.9, 0, negro()), caja(2.4, 1.2, 1.8, 10.6, 21.6, 0, mat('#cfd0d2', { roughness: 0.6 })), caja(0.8, 0.7, 0.8, 12.4, 21.0, 1.2, mat('#c0392b')),
  ], V(0, 6, 10)]]);
  const cord = new THREE.CatmullRomCurve3([V(15.4, 13, 0), V(17.5, 6, 0.4), V(19.5, -6, 0.6), V(22, -20, 0.5), V(23, -28, 0)]);
  add('cable', 'Cable de alimentación con protector', G5, [[[mesh(new THREE.TubeGeometry(cord, 40, 0.45, 10), goma('#18191c')), cil('y', 0.9, 0.55, 4, 16.0, 11.5, 0, goma('#1a1b1e'), 16).rotateZ(0.25)], V(8, -4, 0)]]);
  if (kot) add('amort_mango', 'Amortiguadores del mango (referencial)', G5, [[[-3, 14].map(x => tuboY(9.0, 9.9, 1.3, 0.01, goma('#3a3c40'), x, 0, 20)), V(0, 6, 9)]]);

  return { k, parts, vivo: vivoVertical(k, kot) };
}
