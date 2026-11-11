// Redbo WP-30A: motobomba bencinera 3" x 3" con motor 170F de 212 cc. REFERENCIAL: sin manual ni despiece de Redbo.
// Motor: arquitectura del manual de servicio Loncin 165F/170F (OHV monocilíndrico, 70 x 55 mm, encendido TCI por volante
// con imán, arranque retráctil, levas por engranaje a media vuelta). Extremo bomba: concepto autocebante del manual Honda
// WB30XT (cámara de cebado, tapón de cebado y de drenaje); sin despiece del extremo bomba.
// Unidades: cm. Cigüeñal = eje X (bomba hacia +X, volante hacia -X), cilindro inclinado 25° hacia +Z. Diámetro 7,0 cm y
// carrera 5,5 cm del manual Loncin; biela, inclinación, chasis y demás medidas: aproximadas (no hay medidas externas del WP-30A).
import * as THREE from 'three';
import { PI, V, mat, acero, goma, mesh, cil, caja, rev, lienzo } from '../lib.js';
import { armador, tubo, resorte, aro, aleta, inclinado } from './comun.js';
import { vivoWP } from './vivo.js';

export const Y0 = 13, TILT = 25 * PI / 180, RC = 2.75, LB = 8.5;   // eje del cigüeñal, inclinación, radio de la manivela (carrera/2), largo de biela (aprox.)
export const D = V(0, Math.cos(TILT), Math.sin(TILT)), ZL = V(0, -Math.sin(TILT), Math.cos(TILT)); // eje del cilindro y su normal

export function wp30a(cfg) {
  const E = cfg.estilo || {};
  const { parts, add } = armador('WP-30A');
  const nar = () => mat(E.color || '#e8601c', { metalness: 0.15, roughness: 0.5 });
  const neg = () => mat('#1d1e21', { metalness: 0.2, roughness: 0.65 });
  const alu = () => mat('#b9bec5', { metalness: 0.6, roughness: 0.45 });
  const ac = (c = '#b4b9c0') => acero(c);
  const L = (...o) => inclinado(TILT, Y0, ...o);
  const d = (k, z = 0, x = 0) => D.clone().multiplyScalar(k).addScaledVector(ZL, z).add(V(x, 0, 0));

  // ---------- chasis tubular ----------
  const lado = z => tubo([V(-24, 1.2, z), V(24, 1.2, z), V(27, 3.6, z), V(27, 38, z), V(24, 42, z), V(-23, 42, z), V(-26, 38, z), V(-26, 3.6, z)], 1.2, neg(), true, 0.3);
  add('chasis', [[[lado(20), lado(-20), ...[-19, 4, 18].map(x => cil('z', 1.1, 1.1, 40, x, 1.2, 0, neg(), 16)), ...[-21, 23].map(x => cil('z', 1.1, 1.1, 40, x, 42, 0, neg(), 16)),
    caja(20, 0.5, 18, -2, 2.6, 0, neg())], V(0, -20, 0)]]);

  // ---------- extremo bomba (+X) ----------
  add('soporte', [[[rev([[2.2, 9.0], [7.2, 9.0], [10.0, 11.6], [10.0, 12.0], [2.2, 12.0], [2.2, 9.0]], 'x', alu(), 48, 0, Y0, 0)], V(0, -15, 0)]]);
  add('sello_b', [[[cil('x', 1.6, 1.6, 0.5, 12.75, Y0, 0, neg(), 28), resorte(V(13.0, Y0, 0), V(13.9, Y0, 0), 1.1, 4, 0.08, ac('#8d939a'))], V(3, 0, 0)],
    [[cil('x', 2.0, 2.0, 0.45, 12.25, Y0, 0, mat('#ecebe4', { metalness: 0 }), 28), aro('x', 2.05, 0.12, goma(), 12.1, Y0, 0)], V(1.5, 0, 0)]]);
  add('rodete_b', [[[cil('x', 7.5, 7.5, 0.45, 14.1, Y0, 0, ac('#9aa0a7'), 48), cil('x', 1.6, 1.6, 2.6, 15.1, Y0, 0, ac('#9aa0a7'), 20),
    ...[0, 1, 2, 3].map(i => { const a = i * PI / 2; return caja(1.8, 6.0, 0.5, 15.25, Y0 + 4.4 * Math.cos(a), 4.4 * Math.sin(a), ac('#9aa0a7')).rotateX(a + 0.4); })], V(5, 0, 0)]]);
  add('cuerpo_bomba', [[[rev([[9.0, 12.0], [11.0, 12.0], [11.0, 19.6], [10.2, 19.6], [10.2, 12.8], [9.0, 12.8], [9.0, 12.0]], 'x', alu(), 48, 0, Y0, 0),
    caja(7.6, 9.5, 15, 15.8, Y0 + 8.8, 0, alu()), cil('y', 4.3, 4.3, 5.0, 15.8, 29.0, 0, alu(), 32), cil('y', 4.6, 4.6, 1.0, 15.8, 31.0, 0, alu(), 6),
    caja(7, 1.0, 14, 15.8, 2.4, 0, alu())], V(10, 0, 0)]], true);
  add('tapones', [[[cil('y', 1.4, 1.4, 1.0, 15.8, 27.0, 5.5, neg(), 6), caja(3, 0.5, 0.6, 15.8, 27.7, 5.5, neg())], V(0, 10, 0)],
    [[cil('x', 1.1, 1.1, 1.0, 21.7, Y0 - 7.5, 0, neg(), 6)], V(22, -4, 0)]]);
  add('tapa_bomba', [[[rev([[0, 19.6], [11.0, 19.6], [11.0, 21.2], [0, 21.2]], 'x', alu(), 48, 0, Y0, 0), caja(1.6, 9.5, 15, 20.4, Y0 + 8.8, 0, alu()),
    cil('x', 4.3, 4.3, 6.0, 24.2, 19.5, 0, alu(), 32), cil('x', 4.6, 4.6, 1.0, 26.7, 19.5, 0, alu(), 6),
    ...[0, 1, 2, 3, 4, 5].map(i => { const a = i * PI / 3; return cil('x', 0.45, 0.45, 0.4, 21.4, Y0 + 9.6 * Math.cos(a), 9.6 * Math.sin(a), ac(), 6); })], V(16, 0, 0)]], true);
  add('valvula_ret', [[[cil('x', 3.7, 3.7, 0.4, 20.9, 19.5, 0, goma(), 28), cil('x', 2.2, 2.2, 0.4, 20.5, 19.5, 0, ac(), 24), caja(0.4, 1.6, 3, 20.9, 23.6, 0, goma())], V(12, 12, 0)]]);

  // ---------- motor 170F ----------
  const aletas = [8.0, 9.3, 10.6, 11.9, 13.2, 14.5].map(y => aleta(11, 11, 4.4, 0.35, alu(), y));
  add('bloque', [[[caja(15, 14.5, 18, -0.75, Y0 - 0.75, 0, alu()), caja(16, 2.4, 17, -0.75, 3.8, 0, alu()),
    L(rev([[3.55, 6.5], [4.6, 6.5], [4.6, 15.2], [3.55, 15.2], [3.55, 6.5]], 'y', alu(), 40), ...aletas)], V(0, 0, 0)]], true);
  add('tapa_carter', [[[caja(2, 13.5, 16.5, 7.75, Y0 - 0.75, 0, alu()), cil('x', 2.2, 2.2, 0.8, 9.15, Y0, 0, alu(), 24)], V(4, -6, 0)]], true);
  add('ciguenal', [[[L(cil('x', 1.1, 1.1, 26.5, -0.25, 0, 0, ac('#c3c7cc'), 24), ...[-1.45, 1.45].map(x => caja(0.9, 7.6, 5.0, x, -0.2, 0, ac('#8d939a'))),
    cil('x', 0.8, 0.8, 2.0, 0, RC, 0, ac('#d0d3d8'), 16), cil('x', 1.9, 1.9, 0.8, 4.4, 0, 0, ac('#b0b6bd'), 18))], V(0, -6, 22)]]);
  add('biela', [[[L(cil('x', 1.35, 1.35, 1.4, 0, RC, 0, alu(), 24), caja(0.9, LB - 2.2, 1.0, 0, RC + LB / 2, 0, alu()), cil('x', 0.95, 0.95, 1.4, 0, RC + LB, 0, alu(), 20))], d(-1, 10)]]);
  add('piston', [[[L(cil('y', 3.5, 3.5, 3.75, 0, 11.875, 0, alu(), 40), cil('x', 0.7, 0.7, 6.4, 0, RC + LB, 0, ac(), 14),
    ...[13.4, 12.95, 12.4].map(y => aro('y', 3.5, 0.07, mat('#3a3d42'), 0, y, 0)))], d(4, 10)]]);
  add('arbol_levas', [[[L(cil('x', 0.5, 0.5, 9, 0.3, 3.4, -4.6, ac(), 14), cil('x', 3.8, 3.8, 0.6, 4.4, 3.4, -4.6, ac('#b0b6bd'), 30),
    ...[[1.8, PI / 4], [-1.8, -PI / 4]].map(([x, f]) => cil('x', 0.9, 0.9, 0.8, x, 3.4 + 0.35 * Math.cos(f), -4.6 + 0.35 * Math.sin(f), ac('#d0d3d8'), 20)))], V(0, -6, -22)]]);
  add('varillas', [1.8, -1.8].map(x => [[L(cil('y', 0.2, 0.2, 16.6, x, 12.4, -4.6, ac('#9aa0a7'), 10))], d(4, -4)]));
  add('culata', [[[L(caja(11, 4.0, 11, 0, 17.2, 0, alu()), ...[15.9, 16.7, 17.5, 18.3].map(y => caja(12.2, 0.25, 12.2, 0, y, 0, alu())),
    cil('z', 1.3, 1.3, 2.4, 1.8, 16.8, -6.6, alu(), 20), cil('z', 1.3, 1.3, 2.4, -1.8, 16.8, 6.6, alu(), 20))], d(5)]], true);
  add('valvulas', [[1.8, 6], [-1.8, -6]].map(([x, dx]) => [[L(cil('y', 1.35, 1.35, 0.25, x, 15.35, 0, ac('#d0d3d8'), 24), cil('y', 0.28, 0.28, 5.4, x, 18.1, 0, ac('#d0d3d8'), 10),
    resorte(V(x, 19.3, 0), V(x, 20.4, 0), 0.65, 4, 0.06, ac('#7d838b')))], d(3.5, 0, dx)]));
  add('balancines', [[[L(...[1.8, -1.8].flatMap(x => [caja(0.8, 0.5, 5.0, x, 21.0, -2.3, ac('#9aa0a7')), cil('y', 0.3, 0.3, 1.2, x, 20.4, -2.3, ac(), 10)]))], d(9)]]);
  add('tapa_culata', [[[L(caja(9, 2.6, 10.4, 0, 20.6, -0.4, nar()))], d(12)]], true);
  add('bujia', [[[L(cil('x', 1.05, 1.05, 1.0, -6.3, 16.8, 0, ac(), 6), cil('x', 0.55, 0.55, 2.0, -7.8, 16.8, 0, mat('#f1efe6', { metalness: 0 }), 16), cil('x', 0.25, 0.25, 0.6, -9.0, 16.8, 0, ac(), 8))], V(-8, 4, 0)]]);
  add('volante', [[[L(cil('x', 8.0, 8.0, 1.6, -10.6, 0, 0, alu(), 48), cil('x', 2.2, 2.2, 1.5, -12.1, 0, 0, alu(), 20), cil('x', 2.4, 2.4, 0.8, -13.3, 0, 0, ac(), 6),
    ...Array.from({ length: 12 }, (_, i) => { const a = i / 12 * PI * 2; return caja(1.2, 4.4, 0.3, -12.0, 5.3 * Math.cos(a), 5.3 * Math.sin(a), alu()).rotateX(a); }),
    caja(1.6, 0.7, 2.6, -10.6, 7.75, 0, mat('#3a3d42', { metalness: 0.6 })))], V(-4, 0, 0)]]);
  add('bobina', [[[L(...[-1.1, 1.1].map(z => caja(1.4, 1.4, 0.9, -10.6, 8.9, z, mat('#5a5f66', { metalness: 0.5 }))), caja(2.0, 2.4, 3.4, -10.6, 10.8, 0, neg()),
    tubo([V(-10.6, 11.8, 1.2), V(-10.2, 14.2, 2.0), V(-9.6, 16.4, 0.6), V(-9.6, 16.8, 0)], 0.25, neg()), cil('x', 0.75, 0.75, 1.3, -9.6, 16.8, 0, neg(), 14))], V(-3, 7, 0)]]);
  add('cubierta_vent', [[[rev([[12.6, -9.2], [12.6, -13.6], [12, -14.1], [3.0, -14.1]], 'x', nar(), 48, 0, Y0, 0)], V(-9, 0, 0)]], true);
  add('arrancador', [[[rev([[0.2, -16.8], [5.5, -16.8], [7.2, -16.0], [7.6, -14.1], [0.2, -14.1]], 'x', neg(), 40, 0, Y0, 0),
    tubo([V(-15.3, Y0 + 3.5, 6.7), V(-15.5, Y0 + 5, 9), V(-15.6, Y0 + 6.1, 10.4)], 0.18, mat('#e8e2c8')), caja(1.6, 1.4, 4.4, -15.6, Y0 + 6.4, 10.6, neg())], V(-14, 0, 0)]]);
  add('carburador', [[[caja(3.8, 3.4, 3.6, 1.8, 31.3, -2.0, alu()), cil('y', 1.7, 1.7, 2.0, 1.8, 28.7, -2.0, alu(), 20), caja(0.3, 0.3, 2.4, 0.2, 32.4, -2.4, neg()),
    cil('y', 0.3, 0.3, 1.2, 1.8, 27.2, -2.0, ac(), 6)], V(0, 6, -8)]]);
  add('filtro_aire', [[[caja(9, 9, 6.5, 1.5, 31.5, -7.3, neg())], V(0, 4, -14)], [[cil('z', 3.2, 3.2, 3.2, 1.5, 31.5, -7.4, mat('#e3d8a8', { metalness: 0, roughness: 0.9 }), 24)], V(0, 4, -24)]], true);
  const marca = lienzo(512, 128, (g, w, h) => { g.fillStyle = '#e8601c'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = 'bold 64px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(cfg.etiqueta || 'WP-30A', w / 2, h / 2); });
  add('tanque', [[[caja(15.5, 6.5, 15, -14.25, 36.2, -1.5, nar()), cil('y', 1.8, 1.8, 1.2, -10, 40, 1.5, neg(), 20),
    ...[-13, -10].map(x => caja(0.6, 7.6, 10, x, 29.2, -1.5, neg())), mesh(new THREE.PlaneGeometry(10, 2.5), mat('#fff', { map: marca }), -14.25, 36.2, 6.02)], V(0, 14, 0)]]);
  add('silenciador', [[[caja(11, 7, 5.5, -1.5, 25, 17.2, neg()), caja(11.6, 7.6, 0.4, -1.5, 25, 20.3, mat('#55595f', { metalness: 0.6 })), cil('x', 0.8, 0.8, 3, 5.5, 23, 17.2, ac('#6f757c'), 12)], V(0, 2, 14)]]);

  return { parts, vivo: vivoWP(parts) };
}
