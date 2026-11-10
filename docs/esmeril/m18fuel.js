// Milwaukee M18 FUEL 2880-20 (batería, sin escobillas, paleta con traba). Piezas y números de la lista oficial
// Service Parts List 54-38-7025 (abril 2021) y su página 2 (cableado del conjunto electrónico en la mitad izquierda).
// La lista no trae medidas: todas las dimensiones son aproximadas a partir del dibujo y de la foto de la página 2.
import * as THREE from 'three';
import { YM, cuadro, piezas, alu, brillo, tornillos, perno, arandela, oring, rodamiento, corona, pinon, disco, tuercaBrida, protector, V, PI, mat, acero, mesh, cil, caja, rev, tornillo } from './comun.js';
import { goma, negro, laminas, alambre, textoEtiqueta } from '../lib.js';

export function m18fuel(cfg) {
  const { parts, add } = piezas();
  const rojo = () => mat(cfg.color, { metalness: 0.08, roughness: 0.5 }), c2 = () => goma(cfg.estilo?.c2 || '#1d1f22');
  const G1 = 'Disco y protector', G2 = 'Cabezal (caja de engranajes)', G3 = 'Motor y electrónica', G4 = 'Carcasa, paleta y batería';
  const R = 6.25; // disco de 125 mm (el protector estándar del despiece es de 5")
  const abajo = (o) => { o.rotation.x = PI; return o; };

  // ---------- disco y protector ----------
  add('disco', 'Disco (accesorio, no incluido)', G1, '—', [[disco(R, -2.45, '125 mm'), V(0, -15.5, 0)]]);
  add('tuerca18', 'Tuerca de brida 5/8"', G1, '18', [[tuercaBrida(-2.2, 1.45), V(0, -16.8, 0)]]);
  add('brida17', 'Brida de apoyo', G1, '17', [[[rev([[0.4, -1.8], [0.78, -1.8], [0.78, -1.62], [1.6, -1.6], [1.7, -1.5], [1.7, -1.42], [0.4, -1.42]], 'y', acero('#b3b8bf'), 48)], V(0, -14.2, 0)]]);
  const pm = mat('#3a3d42', { metalness: 0.5, roughness: 0.45 });
  add('protector48', 'Protector tipo 27 de 5"', G1, '48', [[[...protector(R + 0.75, -1.45, 2.2, pm), caja(1.2, 0.35, 0.6, 2.6, -0.95, 0.9, mat('#c9252c'))], V(0, -12.8, 0)]]);
  const agarre = [[0.01, -3.2], [0.75, -3.25], [1.25, -3.6], [1.25, -4.3], [0.95, -4.6]];
  for (let i = 0; i <= 14; i++) agarre.push([0.95 + (i % 2 ? 0.06 : 0), -4.8 - i * 0.38]);
  agarre.push([1.3, -10.4], [1.35, -11.1], [1.0, -11.4], [0.01, -11.45]);
  add('mango47', 'Empuñadura lateral antivibración', G1, '47', [[[rev(agarre, 'z', goma('#222528'), 28, 0.3, 1.8, 0), cil('z', 1.0, 1.0, 0.9, 0.3, 1.8, -4.05, mat(cfg.color), 28)], V(0, 0, -7)]]);

  // ---------- cabezal ----------
  const cab = alu();
  const g = new THREE.ExtrudeGeometry(cuadro(3.1, 1.2), { depth: 2.4, bevelEnabled: true, bevelSize: 0.15, bevelThickness: 0.15, bevelSegments: 2, curveSegments: 10 }); g.rotateY(PI / 2);
  add('caja56', 'Caja de engranajes (con botón de bloqueo)', G2, '56', [[[
    rev([[0.01, 5.0], [2.2, 4.95], [2.9, 4.6], [3.25, 3.8], [3.3, 0.6], [3.1, -0.25], [2.0, -0.25]], 'y', cab, 64),
    mesh(g, cab, -3.5, YM, 0),
    rev([[0.01, 5.0], [0.6, 5.0], [0.6, 5.3], [0.45, 5.45], [0.01, 5.47]], 'y', mat('#2b2e33'), 24, 1.0, 0, 0),
    cil('z', 0.75, 0.75, 6.8, 0.3, 1.8, 0, mat('#8f959c', { metalness: 0.6 }), 24, true), // tetones roscados de la empuñadura
  ], V(19.5, 0, 0)]], true);
  add('t24', 'Tornillos M4x22 T-20 de la caja (4)', G2, '24', [[[[2.5, 2.5], [2.5, -2.5], [-2.5, 2.5], [-2.5, -2.5]].map(([y, z]) => tornillo('x', -2.35, YM + y, z, 0.2)), V(17.25, 0, 0)]]);
  add('rod25', 'Rodamiento delantero del rotor', G2, '25', [[[rodamiento('x', 1.2, 0.45, 0.7, -2.95, YM, 0)], V(18.7, 0, 0)]]);
  add('retenedor26', 'Retenedor del rodamiento', G2, '26', [[[arandela('x', 1.6, 0.6, 0.12, -3.45, YM, 0, acero('#8f959c'))], V(18.2, 0, 0)]]);
  add('t27', 'Tornillos M4x10 T-20 del retenedor, con arandela elástica (2)', G2, '27 + 11', [[[tornillo('x', -3.3, YM + 1.2, 0.6, 0.14), tornillo('x', -3.3, YM - 1.2, -0.6, 0.14)].map(o => { o.rotation.z = PI / 2; return o; }), V(17.4, 0, 0)]]);
  add('pinon29', 'Piñón cónico', G2, '29', [[pinon(-2.5, -1.25, 11), V(14.95, 0, 0)]]);
  add('tuerca28', 'Tuerca hexagonal', G2, '28', [[[cil('x', 0.45, 0.45, 0.4, -1.0, YM, 0, acero('#9aa0a7'), 6)], V(15.45, 0, 0)]]);
  add('cubo53', 'Conjunto cubo del husillo (husillo, corona y rodamiento)', G2, '53', [[[
    rev([[1.0, -1.25], [2.05, -1.25], [2.1, -0.62], [2.6, -0.6], [2.6, -0.25], [1.0, -0.25]], 'y', mat('#a7adb4', { metalness: 0.6 }), 48),
    ...[[1.95, 1.95], [1.95, -1.95], [-1.95, 1.95], [-1.95, -1.95]].map(([x, z]) => cil('y', 0.42, 0.42, 0.3, x, -0.42, z, alu(), 16)),
    rodamiento('y', 1.6, 0.6, 1.0, 0, -0.8, 0),
    rev([[0.01, -2.75], [0.76, -2.75], [0.79, -2.65], [0.79, -1.5], [0.6, -1.45], [0.6, 1.0], [0.45, 1.05], [0.45, 2.9], [0.01, 2.9]], 'y', brillo(), 32),
    ...corona(1.4, 1.95, 30),
  ], V(0, -9, 0)]]);
  add('oring8', 'Junta tórica', G2, '8', [[[oring('y', 2.25, 0.07, 0, -0.25, 0)], V(0, -4.5, 0)]]);
  add('traba20', 'Traba del protector', G2, '20', [[[arandela('y', 2.45, 2.15, 0.25, 0, -0.95, 0, acero('#6f757c')), caja(0.9, 0.25, 0.6, -2.6, -0.95, 0, acero('#6f757c'))], V(0, -9.8, 0)]]);
  add('resorte19', 'Resorte de la traba', G2, '19', [[Array.from({ length: 6 }, (_, i) => oring('x', 0.15, 0.03, -2.65 - i * 0.1, -0.55, 0)), V(0, -9.6, 0)]]);
  add('t21', 'Tornillo con resalte de la traba', G2, '21', [[[abajo(tornillo('y', -2.6, -1.15, 0.5, 0.15))], V(0, -10.2, 0)]]);
  add('t12', 'Tornillos M4x14 T-20 del cubo, con arandela elástica (4)', G2, '12 + 11', [[[[1.95, 1.95], [1.95, -1.95], [-1.95, 1.95], [-1.95, -1.95]].map(([x, z]) => abajo(tornillo('y', x, -0.6, z, 0.17))), V(0, -12.5, 0)]]);

  // ---------- motor y electrónica ----------
  const lam = laminas(), wire = alambre();
  add('rotor31', 'Rotor con ventilador', G3, '31', [[(() => {
    const o = [cil('x', 0.38, 0.38, 11.2, -6.6, YM, 0, acero('#c4c8cd', { metalness: 0.8 }), 16), cil('x', 1.45, 1.45, 4.4, -9.3, YM, 0, mat('#fff', { map: lam, metalness: 0.7, roughness: 0.45 }), 32)];
    for (let i = 0; i < 4; i++) { const a = i / 4 * PI * 2; const b = caja(4.4, 0.06, 1.0, -9.3, YM + 1.46 * Math.cos(a), 1.46 * Math.sin(a), mat('#40454b')); b.rotation.x = a; o.push(b); } // imanes (aprox.)
    const ven = mat('#2b2e33', { metalness: 0.2 });
    o.push(cil('x', 2.45, 2.45, 0.1, -6.2, YM, 0, ven, 48), cil('x', 0.8, 0.8, 0.7, -5.9, YM, 0, ven, 24));
    for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; const b = caja(0.55, 1.4, 0.06, -5.9, YM + 1.65 * Math.cos(a), 1.65 * Math.sin(a), ven); b.rotation.set(a, 0, 0.35, 'XYZ'); o.push(b); }
    return o;
  })(), V(13, 0, 0)]]);
  add('arandela30', 'Arandela', G3, '30', [[[arandela('x', 0.6, 0.4, 0.06, -3.7, YM, 0)], V(16.2, 0, 0)]]);
  add('rod32', 'Rodamiento trasero del rotor', G3, '32', [[[rodamiento('x', 0.85, 0.35, 0.55, -12.0, YM, 0)], V(10.5, 0, 0)]]);
  add('electronica54', 'Conjunto electrónico (estator, placas, interruptor y bloque de terminales)', G3, '54', [[[
    cil('x', 2.6, 2.6, 5.0, -9.3, YM, 0, mat('#fff', { map: lam, metalness: 0.7, roughness: 0.45 }), 56, true), cil('x', 1.55, 1.55, 5.0, -9.3, YM, 0, mat('#8a9097', { metalness: 0.7 }), 56, true),
    cil('x', 2.4, 2.4, 0.45, -6.55, YM, 0, mat('#fff', { map: wire, metalness: 0.9, roughness: 0.35 }), 40, true), cil('x', 2.4, 2.4, 0.45, -12.05, YM, 0, mat('#fff', { map: wire, metalness: 0.9, roughness: 0.35 }), 40, true),
    arandela('x', 2.3, 1.0, 0.12, -12.6, YM, 0, mat('#1f7a3a', { metalness: 0.2 })),                       // placa Hall (verde en la foto)
    caja(7.5, 0.9, 1.6, -17.0, YM - 0.9, 0, negro()), caja(7.3, 0.35, 1.5, -17.0, YM - 0.27, 0, mat('#c9ced4', { metalness: 0.7 })), // placa de potencia con disipador
    caja(0.8, 0.7, 0.6, -14.0, YM + 0.6, 0, negro()),                                                     // interruptor
    (() => { const t = caja(1.6, 1.4, 2.0, -24.0, YM - 2.0, 0, mat('#2a3550', { metalness: 0.2 })); t.rotation.z = 0.5; return t; })(), // bloque de terminales
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-12.6, YM + 1.2, 0.5), V(-15, YM + 0.4, 0.4), V(-20.5, YM - 0.4, 0.3), V(-23.5, YM - 1.3, 0.2)]), 30, 0.12, 8), mat('#c23a2a')),
  ], V(0, 0, 3)]]);

  // ---------- carcasa en dos mitades ----------
  const perfil = [[3.15, -3.5], [3.15, -6], [3.1, -12], [2.7, -14], [2.25, -15.5], [2.2, -20.5], [2.3, -22.5], [2.35, -24.5], [2.1, -26], [1.4, -26.6], [0.01, -26.7]];
  const pts = [...perfil, ...perfil.slice().reverse().map(([r, y]) => [Math.max(r - 0.2, 0.01), y])];
  const ondas = []; for (let x = -20.4, i = 0; x <= -15.6; x += 0.16, i++) ondas.push([2.26 + (i % 2 ? 0.05 : 0), x]);
  const sobre = [...ondas, ...[...ondas].reverse().map(([r, y]) => [2.15, y])];
  const etq = textoEtiqueta(cfg.etiqueta || '');
  const mitad = (s) => {
    const ph = s > 0 ? -PI / 2 : PI / 2, o = [
      rev(pts, 'x', rojo(), 56, 0, YM, 0, ph, PI), rev(sobre, 'x', c2(), 48, 0, YM, 0, ph, PI),
      caja(7.2, 1.1, 2.6, -23.0, YM - 2.65, s * 1.3, rojo()),                  // pie trasero donde engancha la batería (aprox.)
      caja(7.0, 0.25, 2.6, -23.0, YM - 3.3, s * 1.3, c2()),
    ];
    for (let i = 0; i < 6; i++) o.push(caja(0.18, 1.2, 0.08, -4.3 - i * 0.45, YM + 0.3, s * 3.12, negro())); // rejillas
    if (cfg.etiqueta) { const p = mesh(new THREE.PlaneGeometry(3.8, 0.7), new THREE.MeshBasicMaterial({ map: etq, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), -9.3, YM + 0.6, s * 3.12); if (s < 0) p.rotation.y = PI; o.push(p); }
    return o;
  };
  add('soporte39', 'Mitad izquierda de la carcasa (soporte)', G4, '39', [[mitad(-1), V(0, 0, -6)]], true);
  add('cubierta38', 'Mitad derecha de la carcasa (cubierta)', G4, '38', [[mitad(1), V(0, 0, 6)]], true);
  const tz = (x, y, z) => tornillo('z', x, YM + y, z, 0.15); // sobre la superficie de la mitad derecha
  add('t37', 'Tornillos M3.5x16 T-10 de la carcasa (5)', G4, '37', [[[tz(-4.5, 2.6, 1.8), tz(-4.5, -2.6, 1.8), tz(-13.5, -1.9, 2.05), tz(-21.5, 1.7, 1.5), tz(-25.2, -1.2, 1.95)], V(0, 0, 9)]]);
  add('t35', 'Tornillo M3x12 T-10', G4, '35', [[[tornillo('z', -18.5, YM - 1.9, 1.15, 0.13)], V(0, 0, 9)]]);
  add('paleta60', 'Gatillo de paleta con traba', G4, '60', [[[
    caja(12.0, 0.45, 1.6, -15.0, YM - 2.55, 0, negro()),
    (() => { const l = caja(1.6, 0.25, 0.9, -8.6, YM - 2.95, 0, mat('#3a3e44')); l.rotation.z = -0.35; return l; })(),         // traba (lock-off)
    ...Array.from({ length: 10 }, (_, i) => caja(0.12, 0.1, 1.3, -19.5 + i * 0.9, YM - 2.8, 0, mat('#30343a'))),
  ], V(0, -5, 0)]]);
  add('resorte43', 'Resorte de la paleta', G4, '43', [[Array.from({ length: 6 }, (_, i) => oring('y', 0.22, 0.035, -19.0, YM - 2.2 + i * 0.12, 0)), V(0, -4, 0)]]);
  add('polvo45', 'Cubierta antipolvo', G4, '45', [[[rev([[3.3, -13.0], [3.25, -10.8]], 'x', mat('#2b2e33'), 32, 0, YM, 0, PI * 0.75, PI * 0.5)], V(0, -3.5, 0)]]);
  add('bateria', 'Batería M18 (no incluida)', G4, '—', [[[
    caja(8.2, 3.8, 7.4, -23.0, YM - 5.3, 0, mat('#1d1f22', { metalness: 0.1, roughness: 0.6 })), caja(8.25, 1.0, 7.45, -23.0, YM - 6.7, 0, mat(cfg.color)),
    caja(0.08, 1.2, 4.0, -27.13, YM - 5.0, 0, mat('#555a60')),
  ], V(-9, 0, 0)]]);
  return { k: 1, parts };
}

