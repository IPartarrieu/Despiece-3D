// Prueba sin navegador del PC de torre: arma el modelo y lo compara con contrato.json y data.json. Uso:
//   THREE_DIR=/ruta/three/package node docs/pctorre/prueba_modelo.mjs [--detalle] [--umbral 0.5]
// THREE_DIR = paquete npm three@0.160.0 (la versión del import map de docs/index.html). Para bajarlo fuera del proyecto:
//   mkdir -p /tmp/three && cd /tmp/three && npm pack three@0.160.0 && tar xzf three-0.160.0.tgz  -> THREE_DIR=/tmp/three/package
// Revisa: ids (todos los del contrato, ninguno extra, sin duplicados), que cada pieza tenga mallas con caja finita, que quede
// dentro de la caja del PC, choques groseros entre piezas, presupuesto de mallas y triángulos, y que data.json solo nombre ids
// existentes. Los placeholders (cubos magenta) cuentan como piezas válidas pero se informan y no entran a choques.
// Sale con código 1 si algo falla.
import { registerHooks } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const args = process.argv.slice(2), opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const DETALLE = args.includes('--detalle'), UMBRAL = +(opt('--umbral') ?? 0.5);
const THREE_DIR = process.env.THREE_DIR || '/tmp/claude-1000/-home-ipartarrieu-Claude/f93734f7-dd3a-43e1-bc4e-2ef0ee28d954/scratchpad/three0160/package';
if (!existsSync(path.join(THREE_DIR, 'build/three.module.js'))) { console.error(`No encuentro three en THREE_DIR=${THREE_DIR} (ver cabecera)`); process.exit(2); }

registerHooks({   // import map equivalente al de docs/index.html
  resolve(spec, ctx, next) {
    if (spec === 'three') return { url: pathToFileURL(path.join(THREE_DIR, 'build/three.module.js')).href, shortCircuit: true };
    if (spec.startsWith('three/addons/')) return { url: pathToFileURL(path.join(THREE_DIR, 'examples/jsm', spec.slice(13))).href, shortCircuit: true };
    return next(spec, ctx);
  },
});
const fetch0 = globalThis.fetch;   // fetch de archivos locales y canvas falso (texturas de rótulos)
globalThis.fetch = async u => String(u).startsWith('file:') ? { json: async () => JSON.parse(readFileSync(fileURLToPath(u), 'utf8')) } : fetch0(u);
const ctx2d = new Proxy({}, { get: (t, k) => (k in t ? t[k] : k === 'measureText' ? () => ({ width: 10 }) : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d, style: {} }) };
const avisos = [], warn0 = console.warn;
console.warn = (...a) => { avisos.push(a.map(String).join(' ')); };

const THREE = await import('three');
const herr = (await import('./index.js')).default;
const { CONTRATO, PIEZAS } = await import('./comun.js');
const DATA = JSON.parse(readFileSync(new URL('data.json', import.meta.url), 'utf8'));

let fallas = 0;
const falla = txt => { fallas++; console.log('  FALLA ' + txt); };
for (const m of DATA.modelos) {
  avisos.length = 0;
  let mod;
  try { mod = herr.construir({ ...herr.cfg0, estilo: {}, m, color: herr.color.Genérica, etiqueta: herr.etiqueta(m.marca, m) }); }
  catch (e) { falla(`construir() lanzó: ${e.stack || e}`); continue; }
  const P = mod.parts;
  for (const id of Object.keys(PIEZAS)) if (!P[id]) falla(`falta «${id}» del contrato`);
  for (const id of Object.keys(P)) if (!PIEZAS[id]) falla(`«${id}» no está en el contrato`);
  for (const a of avisos) if (/duplicada|no está en el contrato|marco desconocido/.test(a)) falla(a);

  // mallas, cajas, placeholders y presupuesto
  const cajas = {}, ph = new Set(), porMod = {}, C = CONTRATO.caja, lim = new THREE.Box3(new THREE.Vector3(...C.min).subScalar(1), new THREE.Vector3(...C.max).addScalar(1));
  let mallas = 0, tris = 0;
  for (const p of Object.values(P)) {
    const b = new THREE.Box3(), mod_ = PIEZAS[p.id]?.modulo || '?'; let n = 0;
    for (const it of p.items) { it.obj.updateMatrixWorld(true); it.obj.traverse(o => { if (!o.isMesh) return; n++; if (o.userData.placeholder) ph.add(p.id); const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; }); b.expandByObject(it.obj); }
    mallas += n; porMod[mod_] = (porMod[mod_] || 0) + n;
    if (!n) falla(`«${p.id}» sin mallas`);
    else if (b.isEmpty() || ![b.min, b.max].every(v => [v.x, v.y, v.z].every(isFinite))) falla(`«${p.id}» con caja vacía o no finita`);
    else if (!PIEZAS[p.id]?.fuera && !lim.containsBox(b)) falla(`«${p.id}» sale de la caja del PC: ${b.min.toArray().map(v => v.toFixed(1))} .. ${b.max.toArray().map(v => v.toFixed(1))}`);
    cajas[p.id] = b;
  }
  const PR = CONTRATO.presupuesto;
  for (const [k, v] of Object.entries(porMod)) if (PR[k] && v > PR[k]) falla(`módulo ${k}: ${v} mallas, presupuesto ${PR[k]}`);
  if (mallas > PR.total_mallas) falla(`total ${mallas} mallas, presupuesto ${PR.total_mallas}`);
  if (tris > PR.total_triangulos) falla(`total ${Math.round(tris)} triángulos, presupuesto ${PR.total_triangulos}`);

  // choques groseros: volumen común > UMBRAL del menor de los dos, sin contar placeholders, piezas «disperso»,
  // piezas que «envuelven» o son carcasa (shell), ni pares ancestro/descendiente
  const anc = id => { const s = new Set(); for (let q = PIEZAS[id]?.padre; q; q = PIEZAS[q]?.padre) s.add(q); return s; };
  const ANC = Object.fromEntries(Object.keys(P).map(id => [id, anc(id)]));
  const vol = b => { const s = b.getSize(new THREE.Vector3()); return s.x * s.y * s.z; };
  const ids = Object.keys(P).filter(id => { const c = PIEZAS[id]; return c && !ph.has(id) && !c.disperso && !c.envuelve && !c.shell && !P[id].shell; });
  const choques = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const a = ids[i], b = ids[j];
    if (ANC[a].has(b) || ANC[b].has(a)) continue;
    const I = cajas[a].clone().intersect(cajas[b]); if (I.isEmpty()) continue;
    const r = vol(I) / Math.max(1e-6, Math.min(vol(cajas[a]), vol(cajas[b])));
    if (r > UMBRAL) choques.push(`${a} ↔ ${b} (${Math.round(r * 100)} %)`);
  }
  choques.forEach(c => falla('choque ' + c));

  // data.json: ids de pasos, procedimientos y etapas
  const M = m.modelo, existe = id => !!P[id];
  const revisa = (donde, lista) => (lista || []).forEach(id => existe(id) || falla(`${donde}: id desconocido «${id}»`));
  (DATA.desarmados?.[M] || DATA.desarmado || []).forEach(p => { revisa(`desarme paso ${p.paso}`, p.quita); revisa(`desarme paso ${p.paso}`, p.foco); if (p.vista && !herr.vistas[p.vista]) falla(`desarme paso ${p.paso}: vista «${p.vista}» no está en index.js`); });
  (DATA.procedimientos?.[M] || []).forEach(x => { revisa(x.nombre, x.solo); x.pasos.forEach(p => { revisa(`${x.nombre} ${p.paso}`, p.quita); revisa(`${x.nombre} ${p.paso}`, p.foco); }); });
  (DATA.funcionamiento?.[M] || []).forEach((e, i) => { revisa(`etapa ${i + 1}`, e.piezas); revisa(`etapa ${i + 1}`, e.foco); if (e.vista && !herr.vistas[e.vista]) falla(`etapa ${i + 1}: vista «${e.vista}» no está en index.js`); });
  for (const g of mod.vivo.giros) for (const s of g.ids) { const [id, k] = s.split(':'); if (!P[id] || (k != null && !P[id].items[+k])) falla(`giro sobre «${s}» inexistente`); }

  const phMod = {}; for (const id of ph) { const k = PIEZAS[id].modulo; phMod[k] = (phMod[k] || 0) + 1; }
  console.log(`${M}: piezas ${Object.keys(P).length}/${Object.keys(PIEZAS).length}, mallas ${mallas} (${Object.entries(porMod).map(([k, v]) => `${k} ${v}/${PR[k]}`).join(', ')}), ` +
    `triángulos ${Math.round(tris)}, placeholders ${ph.size} (${Object.entries(phMod).map(([k, v]) => `${k} ${v}`).join(', ') || 'ninguno'}), choques revisados entre ${ids.length} piezas`);
  if (DETALLE) for (const a of avisos) console.log('   aviso:', a);
}
console.warn = warn0;
console.log(fallas ? `\n${fallas} falla(s)` : '\nOK: el modelo cumple el contrato');
process.exit(fallas ? 1 : 0);
