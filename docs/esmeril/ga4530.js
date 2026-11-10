// Makita GA4530 (GA4530K, 115 mm, cable). Piezas y números del despiece oficial Makita (GA4530K, 09-2010, lista 2025).
// Largo total 266 mm según el manual GA4030/GA4530/GA5030: cabezal en x = +3,4 y tapa trasera en x = -23,2.
// El resto de las medidas (diámetros, posiciones internas) son aproximadas a partir del dibujo.
import * as THREE from 'three';
import { YM, cuadro, piezas, gris, alu, brillo, tornillos, perno, arandela, oring, rodamiento, corona, pinon, disco, tuercaBrida, protector, V, PI, mat, acero, mesh, cil, caja, rev, tornillo } from './comun.js';
import { goma, negro, cobre, laminas, alambre, textoEtiqueta } from '../lib.js';

export function ga4530(cfg) {
  const { parts, add } = piezas();
  const teal = () => mat(cfg.color, { metalness: 0.08, roughness: 0.5 });
  const G1 = 'Disco y protector', G2 = 'Cabezal (caja de engranajes)', G3 = 'Motor', G4 = 'Carcasa, interruptor y cable';
  const R = 5.75; // disco de 115 mm
  const abajo = (o) => { o.rotation.x = PI; return o; };

  // ---------- disco y protector ----------
  add('disco', 'Disco de desbaste', G1, 'A04', [[disco(R, -2.45, '115 mm'), V(0, -15.5, 0)]]);
  add('tuerca', 'Tuerca de fijación 5/8"', G1, 'A07', [[tuercaBrida(-2.2, 1.45), V(0, -16.8, 0)]]);
  add('brida', 'Brida interior', G1, 'A06', [[[rev([[0.4, -1.8], [0.78, -1.8], [0.78, -1.62], [1.5, -1.6], [1.6, -1.5], [1.6, -1.42], [0.4, -1.42]], 'y', acero('#b3b8bf'), 48)], V(0, -14.5, 0)]]);
  const prot = mat('#2a2d31', { metalness: 0.45, roughness: 0.5 }); // foto GA4030K: protector negro
  add('protector', 'Protector del disco', G1, 'A05', [[[...protector(R + 0.8, -1.45, 2.05, prot), caja(0.7, 0.5, 0.9, 2.3, -0.9, 0, prot)], V(0, -13, 0)]]);
  add('t33', 'Tornillo del protector M5x16', G1, '33', [[[tornillo('x', 2.68, -0.9, 0, 0.22), cil('x', 0.12, 0.12, 1.4, 2.0, -0.9, 0, acero('#9aa0a7'), 10)], V(2.5, -13, 0)]]);
  const estria = [[0.01, -3.1]]; for (let i = 0; i <= 26; i++) estria.push([0.72 + (i % 2 ? 0.05 : 0), -3.6 - i * 0.3]); estria.push([0.66, -11.6], [0.4, -11.9], [0.01, -12.0]);
  add('mango', 'Empuñadura lateral 36', G1, 'A01', [[[rev(estria, 'z', goma('#222528'), 24, 0.3, 1.6, 0), cil('z', 0.4, 0.4, 0.8, 0.3, 1.6, -3.3, acero('#c4c8cd'), 16)], V(0, 0, -7)]]);

  // ---------- cabezal ----------
  const cab = alu();
  const flange = (h, x0, d) => { const g = new THREE.ExtrudeGeometry(cuadro(h), { depth: d, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 2, curveSegments: 10 }); g.rotateY(PI / 2); return mesh(g, cab, x0, YM, 0); };
  add('caja', 'Caja de engranajes', G2, '18', [[[
    rev([[0.01, 4.9], [1.8, 4.85], [2.6, 4.5], [3.05, 3.8], [3.15, 1.0], [3.05, 0.0], [2.9, -0.2], [1.95, -0.2]], 'y', cab, 64),
    flange(3.05, -3.3, 0.9), flange(2.75, -2.4, 1.9),
    cil('y', 0.62, 0.62, 0.12, 1.0, 4.88, 0, mat('#6f757c', { metalness: 0.5 }), 24),
  ], V(24.5, 0, 0)]], true);
  add('t15', 'Tornillos de la caja 4x22 (4)', G2, '15', [[[[2.4, 2.4], [2.4, -2.4], [-2.4, 2.4], [-2.4, -2.4]].map(([y, z]) => tornillo('x', -2.2, YM + y, z, 0.2)), V(22.25, 0, 0)]]);
  add('boton', 'Botón de bloqueo del husillo (tapa)', G2, '13', [[[rev([[0.01, 4.95], [0.55, 4.95], [0.55, 5.2], [0.4, 5.4], [0.01, 5.42]], 'y', negro(), 28, 1.0, 0, 0)], V(24.5, 4, 0)]]);
  add('resorte14', 'Resorte de compresión 8', G2, '14', [[Array.from({ length: 6 }, (_, i) => oring('y', 0.3, 0.035, 1.0, 4.3 + i * 0.1, 0)).map(o => { o.material = acero('#c4c8cd'); return o; }), V(24.5, 2.4, 0)]]);
  add('perno17', 'Perno con resalte 4', G2, '17', [[[cil('y', 0.2, 0.2, 2.2, 1.0, 3.3, 0, brillo(), 14), cil('y', 0.3, 0.3, 0.15, 1.0, 4.2, 0, brillo(), 14)], V(24.5, -5, 0)]]);
  add('oring16', 'Junta tórica 5', G2, '16', [[[oring('y', 0.22, 0.05, 1.0, 3.7, 0)], V(24.5, -4.6, 0)]]);
  add('pasador19', 'Pasador de goma 4', G2, '19', [[[cil('y', 0.2, 0.2, 0.5, -1.6, 0.0, 1.6, goma('#333'), 12)], V(24.5, -2.5, 0)]]);
  add('rod696', 'Rodamiento 696ZZ', G2, '20', [[[rodamiento('y', 0.75, 0.3, 0.5, 0, 2.85, 0)], V(0, -3.6, 0)]]);
  add('anillo21', 'Anillo elástico 11', G2, '21', [[[arandela('y', 0.55, 0.3, 0.06, 0, 2.45, 0, acero('#40454b'))], V(0, -3.9, 0)]]);
  add('corona', 'Engranaje cónico espiral 37 (corona)', G2, '23', [[corona(1.4, 1.9, 37), V(0, -4.4, 0)]]);
  add('anillo24', 'Anillo de retención R-32', G2, '24', [[[arandela('y', 1.65, 1.45, 0.07, 0, -0.15, 0, acero('#40454b'))], V(0, -4.6, 0)]]);
  add('rod6201', 'Rodamiento 6201DDW', G2, '25', [[[rodamiento('y', 1.6, 0.6, 1.0, 0, -0.8, 0)], V(0, -4.8, 0)]]);
  add('arandela26', 'Arandela plana 12', G2, '26', [[[arandela('y', 0.95, 0.6, 0.08, 0, -1.35, 0)], V(0, -5.3, 0)]]);
  add('oring27', 'Junta tórica 42', G2, '27', [[[oring('y', 2.1, 0.07, 0, -0.2, 0)], V(0, -6.9, 0)]]);
  const cr = alu();
  add('cajarod', 'Caja de rodamiento', G2, '28', [[[
    rev([[1.65, -1.25], [1.95, -1.25], [2.0, -0.62], [2.4, -0.6], [2.4, -0.25], [1.65, -0.25]], 'y', cr, 48),
    ...[[1.85, 1.85], [1.85, -1.85], [-1.85, 1.85], [-1.85, -1.85]].map(([x, z]) => cil('y', 0.42, 0.42, 0.3, x, -0.42, z, cr, 16)),
    caja(0.3, 0.25, 0.25, -1.98, -1.0, 0, cr), // saliente donde calza la banda del protector (muesca)
  ], V(0, -7.2, 0)]]);
  add('t29', 'Tornillos M4x14 de la caja de rodamiento (4)', G2, '29', [[[[1.85, 1.85], [1.85, -1.85], [-1.85, 1.85], [-1.85, -1.85]].map(([x, z]) => abajo(tornillo('y', x, -0.6, z, 0.17))), V(0, -7.9, 0)]]);
  add('laberinto', 'Anillo laberinto', G2, '30', [[[arandela('y', 1.25, 0.62, 0.18, 0, -1.4, 0, acero('#9aa0a7'))], V(0, -7.7, 0)]]);
  add('husillo', 'Husillo', G2, '32', [[(() => {
    const o = [rev([[0.01, -2.75], [0.76, -2.75], [0.79, -2.65], [0.79, -1.5], [0.6, -1.45], [0.6, 1.0], [0.45, 1.05], [0.45, 2.5], [0.3, 2.55], [0.3, 3.1], [0.01, 3.1]], 'y', brillo(), 32)];
    for (let i = 0; i < 10; i++) { const t = mesh(new THREE.TorusGeometry(0.79, 0.035, 6, 24), acero('#aeb3b9'), 0, -2.6 + i * 0.11, 0); t.rotation.x = PI / 2; o.push(t); }
    return o;
  })(), V(0, -12.6, 0)]]);

  // ---------- motor ----------
  const lam = laminas(), wire = alambre();
  const lamM = () => mat('#fff', { map: lam, metalness: 0.7, roughness: 0.45 }), wireM = () => mat('#fff', { map: wire, metalness: 0.9, roughness: 0.35 });
  add('campo', 'Campo (estator)', G3, '1', [[[
    cil('x', 2.5, 2.5, 5.2, -10.0, YM, 0, lamM(), 56, true), cil('x', 1.5, 1.5, 5.2, -10.0, YM, 0, mat('#8a9097', { metalness: 0.7 }), 56, true),
    cil('x', 2.5, 1.5, 0.001, -7.4, YM, 0, acero('#9aa0a8'), 56, true), cil('x', 2.5, 1.5, 0.001, -12.6, YM, 0, acero('#9aa0a8'), 56, true),
    caja(6.0, 1.3, 0.55, -10.0, YM, 1.95, wireM()), caja(6.0, 1.3, 0.55, -10.0, YM, -1.95, wireM()),
    caja(1.6, 0.12, 0.12, -13.4, YM + 0.6, 2.1, mat('#d9a521')), caja(1.6, 0.12, 0.12, -13.4, YM - 0.6, 2.1, mat('#222')),
  ], V(8, 0, 0)]]);
  add('t37', 'Tornillos del campo 4x70 (2)', G3, '37', [[[...perno(-14.2, -7.2, YM + 1.55, 1.55, 0.13), ...perno(-14.2, -7.2, YM - 1.55, -1.55, 0.13)], V(8, 0, 0)]]);
  add('deflector', 'Placa deflectora', G3, '2', [[[arandela('x', 2.65, 1.6, 0.1, -7.1, YM, 0, mat('#2b2e33', { metalness: 0.1 })), ...[0, 1, 2].map(i => { const a = i / 3 * PI * 2; return caja(0.9, 0.3, 0.3, -7.6, YM + 2.35 * Math.cos(a), 2.35 * Math.sin(a), mat('#2b2e33')); })], V(9.5, 0, 0)]]);
  const ranuras = Array.from({ length: 12 }, (_, i) => { const a = i / 12 * PI * 2; const b = caja(4.4, 0.05, 0.2, -10.0, YM + 1.36 * Math.cos(a), 1.36 * Math.sin(a), mat('#25282c')); b.rotation.x = a; return b; });
  add('inducido', 'Inducido (con colector)', G3, '6', [[[
    cil('x', 0.4, 0.4, 13.8, -7.9, YM, 0, acero('#c4c8cd', { metalness: 0.8 }), 16),
    cil('x', 1.35, 1.35, 4.4, -10.0, YM, 0, lamM(), 32), ...ranuras,
    cil('x', 1.45, 1.45, 0.55, -12.5, YM, 0, wireM(), 32), cil('x', 1.45, 1.45, 0.55, -7.5, YM, 0, wireM(), 32),
    cil('x', 0.8, 0.8, 1.0, -13.5, YM, 0, cobre(), 36),
    ...Array.from({ length: 18 }, (_, i) => { const a = i / 18 * PI * 2; const b = caja(1.02, 0.05, 0.08, -13.5, YM + 0.81 * Math.cos(a), 0.81 * Math.sin(a), mat('#1b1b1b')); b.rotation.x = a; return b; }),
  ], V(18, 0, 0)]]);
  const marfil = () => mat('#e6e2d3', { metalness: 0, roughness: 0.6 });
  add('ventilador', 'Ventilador 56', G3, '7', [[(() => {
    const o = [cil('x', 2.1, 2.1, 0.08, -6.3, YM, 0, marfil(), 40), cil('x', 0.55, 0.55, 0.7, -6.0, YM, 0, marfil(), 20)];
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; const b = caja(0.6, 1.2, 0.05, -5.95, YM + 1.35 * Math.cos(a), 1.35 * Math.sin(a), marfil()); b.rotation.set(a, 0, 0.3, 'XYZ'); o.push(b); }
    return o;
  })(), V(18, 0, 0)]]);
  add('guia', 'Placa guía', G3, '8', [[[arandela('x', 2.75, 1.0, 0.1, -4.3, YM, 0, mat('#2b2e33', { metalness: 0.1 }))], V(18, 0, 0)]]);
  add('anillo22', 'Anillo de retención R-26', G3, '22', [[[arandela('x', 1.35, 1.15, 0.07, -3.45, YM, 0, acero('#40454b'))], V(18.65, 0, 0)]]);
  add('rod629', 'Rodamiento 629DDW', G3, '10', [[[rodamiento('x', 1.3, 0.45, 0.7, -2.95, YM, 0)], V(18.95, 0, 0)]]);
  add('oring9', 'Junta tórica 26', G3, '9', [[[oring('x', 1.32, 0.05, -2.95, YM, 0)], V(19.4, 0, 0)]]);
  add('pinon', 'Engranaje cónico espiral 10 (piñón)', G3, '11', [[pinon(-2.6, -1.3, 10), V(19.95, 0, 0)]]);
  add('tuercaM6', 'Tuerca hexagonal M6', G3, '12', [[[cil('x', 0.48, 0.48, 0.45, -1.05, YM, 0, acero('#9aa0a7'), 6)], V(20.45, 0, 0)]]);
  add('aislante', 'Arandela aislante', G3, '5', [[[arandela('x', 0.55, 0.36, 0.08, -14.35, YM, 0, mat('#d9c9a0'))], V(17, 0, 0)]]);
  add('rod607', 'Rodamiento 607LLB', G3, '4', [[[rodamiento('x', 0.95, 0.35, 0.6, -14.75, YM, 0)], V(16.2, 0, 0)]]);
  add('goma3', 'Anillo laberinto de goma 19', G3, '3', [[[arandela('x', 1.05, 0.9, 0.35, -14.75, YM, 0, goma())], V(15.6, 0, 0)]]);
  const porta = (s) => [caja(0.75, 1.1, 0.95, -13.5, YM + s * 1.45, 0, mat('#b8a05a', { metalness: 0.8, roughness: 0.4 })), caja(0.9, 0.12, 1.5, -13.5, YM + s * 2.0, 0, mat('#2a2a2a'))];
  add('porta40', 'Portaescobillas 6x9 (superior)', G3, '40', [[porta(1), V(0, 5, 0)]]);
  add('porta51', 'Portaescobillas 6x9 (inferior)', G3, '51', [[porta(-1), V(0, -5, 0)]]);
  const carbon = (s) => [caja(0.6, 0.9, 0.9, -13.5, YM + s * 1.25, 0, mat('#2a2a2a', { metalness: 0.1, roughness: 0.85 })), caja(0.15, 0.4, 0.12, -13.5, YM + s * 1.85, 0.3, cobre())];
  add('carbones', 'Carbones CB-458 (par)', G3, '41', [[carbon(1), V(0, 6.6, 0)], [carbon(-1), V(0, -6.6, 0)]]);
  add('t56', 'Tornillos 3x8 de los portaescobillas (2)', G3, '56', [[[tornillo('y', -13.5, YM + 2.08, 0.55, 0.13)], V(0, 7.3, 0)], [[abajo(tornillo('y', -13.5, YM - 2.08, 0.55, 0.13))], V(0, -7.3, 0)]]);

  // ---------- carcasa, interruptor y cable ----------
  const perfil = [[3.0, -3.3], [3.0, -5], [2.95, -8], [2.9, -12], [2.85, -15.5]];
  const pts = [...perfil, ...perfil.slice().reverse().map(([r, y]) => [r - 0.2, y])];
  const etq = textoEtiqueta(cfg.etiqueta || '');
  const label = (x, z, s) => { const p = mesh(new THREE.PlaneGeometry(3.4, 0.64), new THREE.MeshBasicMaterial({ map: etq, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), x, YM + 0.3, z); if (s < 0) p.rotation.y = PI; return p; };
  const rendijas = [];
  for (const s of [1, -1]) for (let i = 0; i < 4; i++) { const v = caja(0.18, 1.1, 0.08, -4.2 - i * 0.45, YM - 0.4, s * 3.0, negro()); rendijas.push(v); }
  add('carcasa', 'Carcasa del motor (una pieza)', G4, '50', [[[rev(pts, 'x', teal(), 56, 0, YM, 0), ...rendijas, label(-10.5, 3.02, 1), label(-10.5, -3.02, -1)], V(0, 0, 0)]], true);
  const tp = [[2.85, -15.5], [2.8, -17], [2.6, -20], [2.3, -22.3], [1.6, -23.0], [0.75, -23.2], [0.75, -22.9], [1.4, -22.7], [2.1, -22.0], [2.4, -20], [2.6, -17], [2.65, -15.5]];
  const nerv = Array.from({ length: 16 }, (_, i) => { const a = i / 16 * PI * 2; const b = caja(3.0, 0.08, 0.16, -17.4, YM + 2.62 * Math.cos(a), 2.62 * Math.sin(a), mat('#0d6f77')); b.rotation.x = a; return b; });
  add('tapa', 'Tapa trasera', G4, '54', [[[rev(tp, 'x', teal(), 48, 0, YM, 0), ...nerv], V(-9, 0, 0)]], true);
  add('t55', 'Tornillo de la tapa 4x18', G4, '55', [[[tornillo('x', -23.0, YM + 1.1, 0, 0.17)].map(o => { o.rotation.z = PI / 2; return o; }), V(-11, 0, 0)]]);
  // interruptor deslizante: perilla (49) en el costado izquierdo, palanca larga (53) por dentro hasta el interruptor (43)
  add('perilla', 'Perilla del interruptor', G4, '49', [[[caja(1.5, 0.75, 0.45, -6.4, YM + 1.0, -3.1, negro()), caja(1.2, 0.1, 0.1, -6.4, YM + 1.4, -3.25, mat('#3a3e44'))], V(0, 0, -3)]]);
  add('palanca', 'Palanca del interruptor', G4, '53', [[[caja(12.6, 0.12, 0.45, -12.4, YM + 1.0, -2.25, mat('#3a3d42')), caja(0.3, 0.9, 0.45, -18.6, YM + 0.6, -2.05, mat('#3a3d42'))], V(0, -7, 0)]]);
  add('resorte52', 'Resorte de compresión 4', G4, '52', [[Array.from({ length: 7 }, (_, i) => oring('x', 0.16, 0.03, -17.4 - i * 0.12, YM + 1.0, -2.0)), V(0, -6.5, 0)]]);
  add('interruptor', 'Interruptor PS10', G4, '43', [[[caja(1.6, 1.3, 1.4, -19.2, YM - 0.2, 0, mat('#2b2e33', { metalness: 0.1 })), caja(0.2, 0.4, 0.3, -18.3, YM - 0.2, 0.4, cobre()), caja(0.2, 0.4, 0.3, -18.3, YM - 0.2, -0.4, cobre())], V(-2.5, -5, 0)]]);
  add('prensacable', 'Prensacable', G4, '44', [[[caja(0.5, 0.25, 1.4, -21.4, YM - 0.75, 0, acero('#9aa0a7'))], V(0, -3.5, 0)]]);
  add('t45', 'Tornillo del prensacable 4x18', G4, '45', [[[abajo(tornillo('y', -21.4, YM - 0.9, 0.5, 0.15))], V(0, -4.2, 0)]]);
  add('protcable', 'Protector del cable', G4, '47', [[[rev([[0.95, -23.0], [0.9, -24.5], [0.75, -27.5], [0.62, -30.3], [0.5, -30.3]], 'x', goma('#1d1f22'), 24, 0, YM, 0)], V(-9.5, 0, 0)]]);
  const curva = new THREE.CatmullRomCurve3([V(-21.4, YM - 0.5, 0), V(-25, YM, 0), V(-30.3, YM, 0), V(-33, YM - 0.8, 0.4), V(-36, YM - 4, 0.8)]);
  add('cable', 'Cable con enchufe 2,5 m', G4, '48', [[[mesh(new THREE.TubeGeometry(curva, 48, 0.4, 12), goma('#18191c'))], V(-9.5, 0, 0)]]);
  return { k: 1, parts };
}

