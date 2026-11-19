// Prueba sin navegador del modelo de la retroexcavadora: construye los 4 modelos (580N, 580 Super N, 420F2, 3CX) y verifica
// el contrato (contrato.json). Uso:
//   THREE_DIR=/ruta/a/three node docs/retroexcavadora/prueba_modelo.mjs [--max-dist 200] [--detalle]
// THREE_DIR = carpeta del paquete npm three@0.160.0 (la misma versión del import map de docs/index.html), con build/ y examples/.
// Para bajarlo (fuera del proyecto): mkdir -p /tmp/three && cd /tmp/three && npm pack three@0.160.0 && tar xzf three-0.160.0.tgz
//   -> THREE_DIR=/tmp/three/package
// Sale con código 1 si algo falla. Los placeholders (cubos magenta de modelo.js -> pendientes) cuentan como piezas válidas,
// pero se informan como pendientes.
import { registerHooks } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const args = process.argv.slice(2), opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const MAX_DIST = +(opt('--max-dist') ?? 200), DETALLE = args.includes('--detalle');
const THREE_DIR = process.env.THREE_DIR || '/tmp/claude-1000/-home-ipartarrieu-Claude/f93734f7-dd3a-43e1-bc4e-2ef0ee28d954/scratchpad/three0160/package';
if (!existsSync(path.join(THREE_DIR, 'build/three.module.js'))) { console.error(`No encuentro three en THREE_DIR=${THREE_DIR} (ver cabecera del script)`); process.exit(2); }

// import map equivalente al de docs/index.html
registerHooks({
  resolve(spec, ctx, next) {
    if (spec === 'three') return { url: pathToFileURL(path.join(THREE_DIR, 'build/three.module.js')).href, shortCircuit: true };
    if (spec.startsWith('three/addons/')) return { url: pathToFileURL(path.join(THREE_DIR, 'examples/jsm', spec.slice(13))).href, shortCircuit: true };
    return next(spec, ctx);
  },
});
// fetch de archivos locales (comun.js carga data.json y contrato.json con fetch) y un canvas falso (texturas de letreros)
const fetch0 = globalThis.fetch;
globalThis.fetch = async u => String(u).startsWith('file:') ? { json: async () => JSON.parse(readFileSync(fileURLToPath(u), 'utf8')) } : fetch0(u);
const ctx2d = new Proxy({}, { get: (t, k) => (k in t ? t[k] : k === 'measureText' ? () => ({ width: 10 }) : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d, style: {} }) };

// avisos del modelo: se cuentan (duplicados, anclajes, piezas faltantes)
const avisos = [], warn0 = console.warn;
console.warn = (...a) => { avisos.push(a.map(String).join(' ')); };

const THREE = await import('three');
const herr = (await import('./index.js')).default;
const { CAT, CONTRATO, PIEZAS_CONTRATO, aplicaA } = await import('./comun.js');
const EXIST = Object.keys(CONTRATO.existentes || {});

let fallas = 0;
const falla = (m, txt) => { fallas++; console.log(`  FALLA [${m}] ${txt}`); };
const distCajas = (a, b) => { const d = new THREE.Vector3(); for (const k of ['x', 'y', 'z']) d[k] = Math.max(0, a.min[k] - b.max[k], b.min[k] - a.max[k]); return d.length(); };

if (EXIST.length !== 47) falla('contrato', `existentes = ${EXIST.length}, se esperaban 47`);
for (const m of CAT.modelos) {
  avisos.length = 0;
  const estilo = herr.estilos?.[m.marca] || herr.estilos.Genérica;
  let mod;
  try { mod = herr.construir({ ...herr.cfg0, estilo, m, color: herr.color[m.marca] || herr.color.Genérica, etiqueta: herr.etiqueta(m.marca, m) }); }
  catch (e) { falla(m.modelo, 'construir() lanzó: ' + (e.stack || e)); continue; }
  const P = mod.parts, nuevos = Object.values(PIEZAS_CONTRATO).filter(e => aplicaA(e, m)), noAplica = Object.values(PIEZAS_CONTRATO).filter(e => !aplicaA(e, m));
  for (const id of EXIST) if (!P[id]) falla(m.modelo, `falta la pieza existente «${id}»`);
  for (const e of nuevos) if (!P[e.id]) falla(m.modelo, `falta «${e.id}» del contrato`);
  for (const e of noAplica) if (P[e.id]) falla(m.modelo, `«${e.id}» no aplica a este modelo y está registrada`);
  for (const a of avisos) if (/duplicada|anclaje|faltan piezas|ni en el contrato/.test(a)) falla(m.modelo, a);
  // cada pieza: al menos una malla y caja finita no vacía
  const cajas = {};
  let placeholders = 0, mallas = 0;
  for (const p of Object.values(P)) {
    const b = new THREE.Box3(); let n = 0, ph = false;
    for (const it of p.items) { it.obj.updateMatrixWorld(true); it.obj.traverse(o => { if (o.isMesh) { n++; if (o.userData.placeholder) ph = true; } }); b.expandByObject(it.obj); }
    mallas += n; if (ph) placeholders++;
    const fin = ['x', 'y', 'z'].every(k => isFinite(b.min[k]) && isFinite(b.max[k]));
    if (!n) falla(m.modelo, `«${p.id}» sin mallas`);
    else if (b.isEmpty() || !fin) falla(m.modelo, `«${p.id}» con caja vacía o no finita`);
    cajas[p.id] = b;
  }
  // piezas nuevas: distancia (caja a caja) al chasis
  const ch = cajas.chasis, lejos = [];
  let dmax = 0, idmax = '';
  for (const e of nuevos) if (cajas[e.id] && ch) {
    const d = distCajas(cajas[e.id], ch); if (d > dmax) { dmax = d; idmax = e.id; }
    if (d > MAX_DIST) lejos.push(`${e.id} (${d.toFixed(0)} cm)`);
  }
  if (lejos.length) falla(m.modelo, `piezas nuevas a más de ${MAX_DIST} cm del chasis: ${lejos.join(', ')}`);
  const porMod = {}; for (const e of nuevos) porMod[e.modulo] = (porMod[e.modulo] || 0) + 1;
  console.log(`${m.modelo.padEnd(12)} piezas ${Object.keys(P).length} (47 existentes + ${nuevos.length} nuevas: ${Object.entries(porMod).map(([k, v]) => `${k} ${v}`).join(', ')}), ` +
    `mallas ${mallas}, placeholders pendientes ${placeholders}, máx. distancia al chasis ${dmax.toFixed(0)} cm (${idmax}), shell motor: ${!!P.motor?.shell}`);
  if (DETALLE) for (const a of avisos) console.log('   aviso:', a);
}
console.warn = warn0;
console.log(fallas ? `\n${fallas} falla(s)` : '\nOK: todos los modelos cumplen el contrato');
process.exit(fallas ? 1 : 0);
