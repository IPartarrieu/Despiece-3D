// Bercatti DRE0753: sumergible de aguas sucias 1 HP, 3". REFERENCIAL: no hay despiece ni manual del DRE0753 ni del DRE0752.
// Unidades: cm. Eje del motor = Y (vertical), base en y = 0, descarga hacia +X.
// De fuentes: medidas externas 45 x 27 x 26 cm y doble sello mecánico (ficha del DRE0752, modelo hermano); boca 3", rodete
// semivórtice y agitador (resumen de búsqueda de easy.cl, sin verificar). APROXIMADO: todo lo interno, formas y colores.
import * as THREE from 'three';
import { PI, V, mat, acero, goma, mesh, cil, caja, rev, rodamiento, laminas, alambre, lienzo } from '../lib.js';
import { armador, tubo, resorte, aro } from './comun.js';
import { vivoDRE } from './vivo.js';

export function dre0753(cfg) {
  const E = cfg.estilo || {};
  const { parts, add } = armador('DRE0753');
  const inox = () => acero('#bfc5cc', { metalness: 0.7, roughness: 0.32 });
  const fund = () => mat(E.fundido || '#3a3f46', { metalness: 0.35, roughness: 0.6 });
  const neg = () => mat('#1c1d20', { metalness: 0.1, roughness: 0.7 });
  const nucleo = () => new THREE.MeshStandardMaterial({ map: laminas(), metalness: 0.6, roughness: 0.4 });
  const cob = () => new THREE.MeshStandardMaterial({ map: alambre(), metalness: 0.7, roughness: 0.35 });
  const blanco = () => mat('#ecebe4', { metalness: 0, roughness: 0.5 });

  // ---------- extremo bomba (abajo) ----------
  const barras = Array.from({ length: 30 }, (_, i) => { const a = i / 30 * PI * 2; return caja(1.2, 3.4, 0.6, 11.4 * Math.cos(a), 2.8, 11.4 * Math.sin(a), fund()).rotateY(-a - PI / 2); });
  add('base', [[[rev([[0, 0], [12.2, 0], [12.2, 1.1], [0, 1.1]], 'y', fund(), 48), ...barras, rev([[10.9, 4.5], [12.2, 4.5], [12.2, 5.1], [10.9, 5.1]], 'y', fund(), 48),
    ...[0, 1, 2].map(i => caja(3, 0.6, 3, 9.5 * Math.cos(i * 2.09), -0.3, 9.5 * Math.sin(i * 2.09), goma()))], V(-20, -14, 0)]]);
  add('tuerca', [[[cil('y', 1.15, 1.15, 0.7, 0, 3.3, 0, inox(), 6)], V(0, -22, 0)]]);
  add('agitador', [[[cil('y', 1.0, 1.0, 2.2, 0, 4.8, 0, inox(), 20),
    ...[0, 1, 2].map(i => caja(3.4, 0.9, 0.5, 2.1 * Math.cos(i * 2.09), 4.6, -2.1 * Math.sin(i * 2.09), inox()).rotateY(i * 2.09).rotateX(0.5))], V(0, -17, 0)]]);
  add('rodete', [[[cil('y', 8.0, 8.0, 0.5, 0, 9.9, 0, fund(), 48), cil('y', 1.7, 1.9, 4.2, 0, 8.0, 0, fund(), 24),
    ...Array.from({ length: 6 }, (_, i) => { const a = i / 6 * PI * 2; return caja(6.0, 3.6, 0.45, 4.8 * Math.cos(a), 7.9, -4.8 * Math.sin(a), fund()).rotateY(a + 0.35); })], V(0, -12, 0)]]);
  add('voluta', [[[rev([[4.6, 5.1], [10.6, 5.1], [10.6, 11], [2.4, 11], [2.4, 10.4], [10, 10.4], [10, 5.7], [4.6, 5.7], [4.6, 5.1]], 'y', fund(), 48),
    caja(6.5, 5.0, 4.4, 7.4, 8.0, 8.5, fund()), cil('x', 4.3, 4.3, 0.7, 10.6, 8.0, 8.5, fund(), 24)], V(16, -9, 0)]], true);
  add('descarga', [[[tubo([V(10.6, 8, 8.5), V(12.2, 8.3, 8.5), V(12.8, 10, 8.5), V(12.8, 20, 8.5), V(12.8, 33, 8.5)], 3.8, fund()),
    cil('y', 4.3, 4.3, 3.2, 12.8, 34.4, 8.5, inox(), 24), ...[0, 1, 2, 3].map(i => aro('y', 4.32, 0.06, mat('#7d838b'), 12.8, 33.4 + i * 0.6, 8.5))], V(22, -6, 0)]]);

  // ---------- cámara de aceite con doble sello mecánico ----------
  add('camara', [[[rev([[1.6, 11], [10.4, 11], [10.4, 11.6], [9.7, 11.9], [9.7, 16.7], [10.4, 17.0], [10.4, 17.4], [1.6, 17.4], [1.6, 16.9], [3.1, 16.9], [3.1, 11.7], [1.6, 11.7], [1.6, 11]], 'y', fund(), 48)], V(-18, 0, 0)]], true);
  add('tapon_aceite', [[[cil('x', 0.95, 0.95, 1.0, -10.2, 14.3, 0, inox(), 6), aro('x', 0.85, 0.12, goma(), -9.7, 14.3, 0)], V(-27, 0, 0)]]);
  const sello = (y, s) => [cil('y', 2.5, 2.5, 0.45, 0, y, 0, blanco(), 32), cil('y', 2.1, 2.1, 0.55, 0, y + s * 0.5, 0, neg(), 32),
    resorte(V(0, y + s * 0.8, 0), V(0, y + s * 1.9, 0), 1.7, 4, 0.1, acero('#8d939a')), aro('y', 1.25, 0.18, goma(), 0, y + s * 0.5, 0)];
  add('sello_inf', [[sello(12.0, 1), V(0, -6, 0)]]);
  add('sello_sup', [[sello(16.4, -1), V(0, -2, 0)]]);

  // ---------- motor ----------
  add('rod_inf', [[[rodamiento('y', 2.6, 0.9, 1.4, 0, 18.3, 0)], V(18, 2, 0)]]);
  add('rotor', [[[cil('y', 0.9, 0.9, 35, 0, 21.1, 0, inox(), 20), cil('y', 5.1, 5.1, 11.4, 0, 27, 0, nucleo(), 40),
    cil('y', 5.1, 5.1, 0.6, 0, 21.0, 0, mat('#a9aeb5', { metalness: 0.6 }), 40), cil('y', 5.1, 5.1, 0.6, 0, 33.0, 0, mat('#a9aeb5', { metalness: 0.6 }), 40)], V(18, 4, 0)]]);
  add('rod_sup', [[[rodamiento('y', 2.6, 0.9, 1.4, 0, 36.8, 0)], V(18, 5.5, 0)]]);
  add('estator', [[[rev([[5.4, 21], [9.5, 21], [9.5, 33], [5.4, 33], [5.4, 21]], 'y', nucleo(), 48),
    (() => { const o = aro('y', 7.4, 1.2, cob(), 0, 20.1, 0); o.scale.z = 0.8; return o; })(), (() => { const o = aro('y', 7.4, 1.2, cob(), 0, 33.9, 0); o.scale.z = 0.8; return o; })()], V(0, 0, 0)]]);
  add('termico', [[[cil('y', 0.75, 0.75, 0.45, 6.6, 35.1, 0, mat('#d8d4c4'), 20), tubo([V(6.4, 35.3, 0.3), V(3, 36, 1), V(-4, 36.4, 0.8)], 0.08, mat('#e33'))], V(-6, 9, 6)]]);
  add('capacitor', [[[cil('z', 1.7, 1.7, 5.0, -5.6, 36.6, 0, mat('#23262b', { roughness: 0.4 }), 28), cil('z', 0.5, 0.5, 0.6, -5.6, 36.6, 2.8, mat('#cfd3d8'), 10),
    mesh(new THREE.PlaneGeometry(3.2, 2.4), mat('#e9e7df', { map: lienzo(256, 192, g => { g.fillStyle = '#e9e7df'; g.fillRect(0, 0, 256, 192); g.fillStyle = '#222'; g.font = 'bold 44px sans-serif'; g.textAlign = 'center'; g.fillText('CBB', 128, 70); g.font = '34px sans-serif'; g.fillText('µF: s/d', 128, 130); }) }), -5.6, 38.31, 0).rotateX(-PI / 2)], V(-14, 6, 0)]]);
  const rot = lienzo(512, 128, (g, w, h) => { g.fillStyle = '#1d2a3a'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = 'bold 54px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(cfg.etiqueta || 'DRE0753', w / 2, h / 2); });
  add('carcasa', [[[rev([[9.65, 17.4], [10.35, 17.4], [10.35, 38.6], [9.65, 38.6], [9.65, 17.4]], 'y', inox(), 56),
    mesh(new THREE.CylinderGeometry(10.4, 10.4, 3, 40, 1, true, -0.55, 1.1), mat('#fff', { map: rot }), 0, 30, 0)], V(-34, 10, -6)]], true);
  add('tapa_motor', [[[rev([[0, 38.6], [10.4, 38.6], [10.4, 39.4], [9.4, 40.8], [6, 41.6], [0, 41.8]], 'y', fund(), 48)], V(0, 12, 0)]], true);
  add('prensacable', [[[cil('y', 1.3, 1.3, 1.8, 0, 42.3, -5.5, neg(), 20), cil('y', 1.55, 1.55, 0.8, 0, 43.4, -5.5, neg(), 6)], V(0, 15, 0)]]);
  add('cable', [[[tubo([V(0, 43.6, -5.5), V(0, 45.5, -5.8), V(-4, 48, -9), V(-12, 47.5, -12.5), V(-20, 44, -14)], 0.6, goma())], V(0, 15, -4)]]);
  add('asa', [[[tubo([V(-7, 40.8, 0), V(-6.6, 44.6, 0), V(0, 47, 0), V(6.6, 44.6, 0), V(7, 40.8, 0)], 0.9, neg(), false, 0.5)], V(0, 20, 0)]]);

  return { parts, vivo: vivoDRE(parts) };
}
