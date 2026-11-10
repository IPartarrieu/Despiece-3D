// Helpers 3D compartidos por los modelos procedurales (unidades: cm).
import * as THREE from 'three';

export const PI = Math.PI;
export const V = (x, y, z) => new THREE.Vector3(x, y, z);

export const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.55, side: THREE.DoubleSide, ...o });
export const acero = (c = '#aab0b8', o = {}) => mat(c, { metalness: 0.6, roughness: 0.38, ...o });
export const aluminio = () => mat('#b9bec5', { metalness: 0.65, roughness: 0.5 });
export const cobre = () => mat('#c07a3e', { metalness: 0.9, roughness: 0.3 });
export const goma = (c = '#1f2124') => mat(c, { metalness: 0, roughness: 0.92 });
export const negro = () => mat('#15171a', { metalness: 0.3, roughness: 0.6 });
export const marfil = () => mat('#e6e2d3', { metalness: 0, roughness: 0.6 });
export const mesh = (g, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); return o; };
// cilindro con eje x|y|z; la "tapa" (rT) apunta hacia +eje
export function cil(ax, rT, rB, h, x, y, z, m, seg = 40, abierto = false, ts = 0, tl = PI * 2) {
  const o = mesh(new THREE.CylinderGeometry(rT, rB, h, seg, 1, abierto, ts, tl), m, x, y, z);
  if (ax === 'x') o.rotation.z = -PI / 2; else if (ax === 'z') o.rotation.x = PI / 2;
  return o;
}
export const caja = (w, h, d, x, y, z, m) => mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z);
// sólido de revolución a partir de [r, eje]; ax: eje de salida
export function rev(pts, ax, m, seg = 48, x = 0, y = 0, z = 0, ph = 0, pl = PI * 2) {
  const g = new THREE.LatheGeometry(pts.map(([r, a]) => new THREE.Vector2(r, a)), seg, ph, pl);
  if (ax === 'x') g.rotateZ(-PI / 2); else if (ax === 'z') g.rotateX(PI / 2);
  return mesh(g, m, x, y, z);
}
// tornillo con cabeza ranurada, normal hacia +eje
export function tornillo(ax, x, y, z, r = 0.17) {
  const g = new THREE.Group();
  g.add(cil('y', r, r, 0.07, 0, 0, 0, acero('#4a4f56', { metalness: 0.8 }), 14));
  g.add(caja(r * 1.7, 0.02, 0.04, 0, 0.04, 0, mat('#111')), caja(0.04, 0.02, r * 1.7, 0, 0.04, 0, mat('#111')));
  if (ax === 'x') g.rotation.z = -PI / 2; else if (ax === 'z') g.rotation.x = PI / 2; else if (ax === '-z') g.rotation.x = -PI / 2;
  g.position.set(x, y, z);
  return g;
}

export function lienzo(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); f(g, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
export function laminas() { // chapas del núcleo
  const t = lienzo(4, 16, (g) => { g.fillStyle = '#a9aeb5'; g.fillRect(0, 0, 4, 16); g.fillStyle = '#4d535a'; g.fillRect(0, 0, 4, 3); });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 14); return t;
}
export function alambre() { // bobinado de cobre
  const t = lienzo(4, 16, (g) => { g.fillStyle = '#c47a3a'; g.fillRect(0, 0, 4, 16); g.fillStyle = '#7d4a20'; g.fillRect(0, 0, 4, 4); g.fillStyle = '#e29a55'; g.fillRect(0, 8, 4, 3); });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 10); return t;
}
export function etiquetaDisco(mm) { // rótulo del disco
  return lienzo(512, 512, (g, w, h) => {
    g.fillStyle = '#34464f'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2a3a42'; g.beginPath(); g.arc(256, 256, 250, 0, PI * 2); g.arc(256, 256, 232, 0, PI * 2, true); g.fill();
    g.fillStyle = '#dcd6c0'; g.beginPath(); g.arc(256, 256, 190, 0, PI * 2); g.arc(256, 256, 70, 0, PI * 2, true); g.fill('evenodd');
    g.fillStyle = '#1b2227'; g.textAlign = 'center';
    g.font = 'bold 34px sans-serif'; g.fillText('DISCO DE CORTE', 256, 200);
    g.font = 'bold 28px sans-serif'; g.fillText(`${mm} × 1,0 × 22,23 mm`, 256, 244);
    g.font = '24px sans-serif'; g.fillText('MÁX 80 m/s · 13.300 rpm', 256, 288);
    g.fillText('INOX · METAL', 256, 322);
  });
}
export function textoEtiqueta(txt, fondoTransp = true) {
  return lienzo(512, 96, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.92)'; let px = 54; g.font = `bold ${px}px sans-serif`; while (g.measureText(txt).width > 488 && px > 16) g.font = `bold ${--px}px sans-serif`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(txt, 12, 52); });
}

export function rodamiento(eje, ro, ri, w, x, y, z) {
  const g = new THREE.Group();
  const anillo = (a, b) => {
    const s = new THREE.Shape().absarc(0, 0, a, 0, PI * 2, false);
    s.holes.push(new THREE.Path().absarc(0, 0, b, 0, PI * 2, true));
    const geo = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1, curveSegments: 40 }); geo.translate(0, 0, -w / 2);
    return mesh(geo, acero('#c3c8ce', { metalness: 0.8, roughness: 0.3 }));
  };
  g.add(anillo(ro, ro - 0.2), anillo(ri + 0.2, ri));
  const rm = (ro + ri) / 2, rb = (ro - ri - 0.4) / 2;
  for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; g.add(mesh(new THREE.SphereGeometry(rb, 14, 10), mat('#eceef0', { metalness: 1, roughness: 0.15 }), rm * Math.cos(a), rm * Math.sin(a), 0)); }
  if (eje === 'x') g.rotation.y = PI / 2; else g.rotation.x = -PI / 2;
  g.position.set(x, y, z);
  return g;
}


// rectángulo redondeado como Shape (plano XY)
export function rr(x0, y0, x1, y1, r) {
  const s = new THREE.Shape();
  s.moveTo(x0 + r, y0); s.lineTo(x1 - r, y0); s.quadraticCurveTo(x1, y0, x1, y0 + r); s.lineTo(x1, y1 - r); s.quadraticCurveTo(x1, y1, x1 - r, y1);
  s.lineTo(x0 + r, y1); s.quadraticCurveTo(x0, y1, x0, y1 - r); s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0);
  return s;
}
