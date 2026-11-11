// Happy CYM158: centrífuga eléctrica 1 HP, bocas 1" x 1", un rodete. REFERENCIAL: sin manual ni despiece de Happy.
// Arquitectura del Pedrollo CPm158 (catálogo técnico CP, Salvador Escoda 10047464): posiciones 1-8 de su tabla de componentes,
// corte con el condensador sobre el motor, sello AR-14 (eje 14 mm), rodamientos 6203 ZZ, condensador 20 µF 450 V.
// Unidades: cm. Eje = X (bomba hacia +X), patas en y = 0. Medidas de la tabla CPm158: largo f 286 mm, alto h3 240 mm,
// base n1 190 x n2 160 mm; la altura del eje (92 mm) se toma de h1, interpretación aproximada. Formas y colores aproximados.
import * as THREE from 'three';
import { PI, V, mat, acero, goma, mesh, cil, caja, rev, rodamiento, laminas, alambre, lienzo } from '../lib.js';
import { armador, tubo, resorte, aro } from './comun.js';
import { vivoCYM } from './vivo.js';

export const AY = 9.2;

export function cym158(cfg) {
  const E = cfg.estilo || {};
  const { parts, add } = armador('CYM158');
  const pint = () => mat(E.color || '#2f6db5', { metalness: 0.25, roughness: 0.5 });
  const fierro = () => mat(E.fundido || '#2f6db5', { metalness: 0.35, roughness: 0.62 });
  const inox = () => acero('#c4c9cf', { metalness: 0.75, roughness: 0.3 });
  const alu = () => mat('#a9aeb5', { metalness: 0.65, roughness: 0.45 });
  const neg = () => mat('#1c1d20', { metalness: 0.1, roughness: 0.7 });
  const nucleo = () => new THREE.MeshStandardMaterial({ map: laminas(), metalness: 0.6, roughness: 0.4 });
  const cob = () => new THREE.MeshStandardMaterial({ map: alambre(), metalness: 0.7, roughness: 0.35 });
  const cabeza = (x, m) => { const o = aro('x', 4.7, 1.0, m, x, AY, 0); o.scale.z = 0.8; return o; };

  // ---------- extremo bomba (+X) ----------
  add('cuerpo', [[[rev([[2.2, 11.6], [7.6, 11.6], [9.0, 10.6], [9.0, 5.2], [9.5, 4.7], [9.5, 4.4], [8.7, 4.4], [8.7, 10.3], [7.4, 11.0], [2.2, 11.0], [2.2, 11.6]], 'x', fierro(), 48, 0, AY, 0),
    cil('x', 2.1, 2.1, 3.2, 13.1, AY, 0, fierro(), 28), cil('x', 2.6, 2.6, 0.9, 14.2, AY, 0, fierro(), 6),
    cil('y', 2.1, 2.1, 6.2, 8.3, 19.3, 0, fierro(), 28), cil('y', 2.6, 2.6, 1.0, 8.3, 22.5, 0, fierro(), 6),
    caja(5.5, 2.4, 6, 8.3, 17.2, 0, fierro())], V(20, 0, 0)]], true);
  add('tapones', [[[cil('y', 0.8, 0.8, 0.9, 5.6, 18.5, 0, inox(), 6)], V(16, 8, 0)], [[cil('x', 0.8, 0.8, 0.9, 11.9, 3.6, 0, inox(), 6)], V(26, 0, 0)]]);
  add('pernos', [[Array.from({ length: 6 }, (_, i) => { const a = i / 6 * PI * 2 + PI / 6, y = AY + 8.0 * Math.cos(a), z = 8.0 * Math.sin(a); return [cil('x', 0.32, 0.32, 3.4, 4.3, y, z, inox(), 10), cil('x', 0.6, 0.6, 0.5, 2.4, y, z, inox(), 6)]; }).flat(), V(4, -13, 0)]]);
  add('oring', [[[aro('x', 7.9, 0.16, goma(), 4.45, AY, 0)], V(14, 11, 0)]]);
  add('rodete', [[[cil('x', 8.0, 8.0, 0.3, 7.15, AY, 0, inox(), 48), rev([[2.6, 9.0], [8.0, 9.0], [8.0, 9.3], [2.6, 9.3], [2.6, 9.0]], 'x', inox(), 48, 0, AY, 0),
    cil('x', 1.4, 1.4, 2.4, 8.1, AY, 0, inox(), 20), cil('x', 0.95, 0.95, 0.6, 9.6, AY, 0, inox(), 6),
    ...Array.from({ length: 6 }, (_, i) => { const a = i / 6 * PI * 2; return caja(1.7, 5.2, 0.32, 8.15, AY + 5.2 * Math.cos(a), 5.2 * Math.sin(a), inox()).rotateX(a + 0.3); })], V(13, 0, 0)]]);
  add('sello', [[[cil('x', 1.5, 1.5, 0.5, 5.85, AY, 0, neg(), 28), resorte(V(6.1, AY, 0), V(7.0, AY, 0), 1.0, 4, 0.08, acero('#8d939a')), aro('x', 0.95, 0.2, goma(), 6.3, AY, 0)], V(9, 0, 0)],
    [[cil('x', 1.9, 1.9, 0.45, 5.25, AY, 0, mat('#ecebe4', { metalness: 0, roughness: 0.5 }), 28), aro('x', 1.95, 0.12, goma(), 5.1, AY, 0)], V(6, 0, 0)]]);
  add('tapa', [[[rev([[1.6, 3.7], [7.6, 3.7], [7.6, 4.3], [2.4, 4.3], [2.4, 5.0], [1.6, 5.0], [1.6, 3.7]], 'x', inox(), 48, 0, AY, 0)], V(3, 0, 0)]]);

  // ---------- motor ----------
  add('eje_rotor', [[[cil('x', 0.7, 0.7, 22.7, -1.45, AY, 0, inox(), 20), cil('x', 3.3, 3.3, 8.2, -3.3, AY, 0, nucleo(), 36),
    cil('x', 3.3, 3.3, 0.4, -7.6, AY, 0, alu(), 36), cil('x', 3.3, 3.3, 0.4, 1.0, AY, 0, alu(), 36)], V(0, 0, 16)]]);
  add('rod_del', [[[rodamiento('x', 2.0, 0.85, 1.2, 2.0, AY, 0)], V(2, 0, 16)]]);
  add('rod_tras', [[[rodamiento('x', 2.0, 0.85, 1.2, -9.4, AY, 0)], V(-2, 0, 16)]]);
  add('estator', [[[rev([[3.5, -8.0], [6.0, -8.0], [6.0, 1.4], [3.5, 1.4], [3.5, -8.0]], 'x', nucleo(), 48, 0, AY, 0), cabeza(-8.8, cob()), cabeza(2.2, cob())], V(0, 0, 0)]]);
  const aletas = Array.from({ length: 18 }, (_, i) => { const a = i / 18 * PI * 2; return Math.abs(Math.sin(a / 2)) < 0.3 || Math.abs(Math.cos(a / 2)) < 0.25 ? null : caja(11.8, 0.9, 0.25, -4.0, AY + 7.2 * Math.cos(a), 7.2 * Math.sin(a), pint()).rotateX(a); }).filter(Boolean);
  const placa = lienzo(512, 128, (g, w, h) => { g.fillStyle = '#e9e7df'; g.fillRect(0, 0, w, h); g.fillStyle = '#1b2227'; g.font = 'bold 50px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(cfg.etiqueta || 'CYM158', w / 2, h / 2); });
  add('carcasa_motor', [[[rev([[6.2, -10.2], [7.0, -10.2], [7.0, 2.4], [6.2, 2.4], [6.2, -10.2]], 'x', pint(), 48, 0, AY, 0),
    rev([[2.4, 2.4], [8.6, 2.4], [8.6, 3.6], [2.4, 3.6], [2.4, 2.4]], 'x', pint(), 48, 0, AY, 0), ...aletas,
    caja(17, 1.2, 15, -4, 0.6, 0, pint()), caja(11, 1.6, 6, -4, 1.9, 0, pint()),
    mesh(new THREE.PlaneGeometry(5.5, 1.4), mat('#fff', { map: placa }), -4.5, AY, 7.05)], V(0, 0, -22)]], true);
  add('tapa_trasera', [[[rev([[0.9, -11.2], [7.0, -11.2], [7.0, -10.2], [2.4, -10.2], [2.4, -9.7], [0.9, -9.7], [0.9, -11.2]], 'x', pint(), 48, 0, AY, 0)], V(-5, 0, 0)]]);
  add('ventilador', [[[cil('x', 1.0, 1.0, 0.9, -12.0, AY, 0, neg(), 16),
    ...Array.from({ length: 8 }, (_, i) => { const a = i / 8 * PI * 2; return caja(0.8, 4.6, 0.3, -12.0, AY + 3.3 * Math.cos(a), 3.3 * Math.sin(a), neg()).rotateX(a); })], V(-9, 0, 0)]]);
  add('cubreventilador', [[[rev([[7.0, -11.3], [7.0, -13.6], [6.4, -14.0], [0.2, -14.0]], 'x', pint(), 48, 0, AY, 0),
    ...Array.from({ length: 10 }, (_, i) => { const a = i / 10 * PI * 2; return caja(0.1, 3.6, 0.5, -14.05, AY + 3.8 * Math.cos(a), 3.8 * Math.sin(a), neg()).rotateX(a); })], V(-14, 0, 0)]], true);
  add('caja_conex', [[[caja(3.7, 2.6, 5.6, 1.4, 17.4, 0, pint()), caja(3.9, 0.4, 5.8, 1.4, 18.9, 0, pint())], V(4, 7, 0)]]);
  add('capacitor', [[[cil('x', 2.0, 2.0, 7.6, -4.6, 18.1, 0, mat('#e9e7df', { roughness: 0.5 }), 28), caja(1.2, 1.2, 4.6, -4.6, 16.4, 0, neg()),
    mesh(new THREE.PlaneGeometry(4.4, 1.6), mat('#fff', { map: lienzo(256, 96, g => { g.fillStyle = '#e9e7df'; g.fillRect(0, 0, 256, 96); g.fillStyle = '#222'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.fillText('20 µF 450 V', 128, 62); }) }), -4.6, 18.1, 2.02)], V(0, 10, 0)]]);
  add('prensacable', [[[cil('z', 0.8, 0.8, 1.4, 1.4, 17.2, 3.4, neg(), 16), cil('z', 1.0, 1.0, 0.6, 1.4, 17.2, 4.2, neg(), 6)], V(4, 7, 8)]]);
  add('cable', [[[tubo([V(1.4, 17.2, 4.4), V(1.4, 17.0, 6.2), V(0.5, 14, 9), V(-4, 6, 11), V(-12, 2.5, 12)], 0.45, goma())], V(4, 7, 8)]]);

  return { parts, vivo: vivoCYM(parts) };
}
