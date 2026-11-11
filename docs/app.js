import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import esmeril from './esmeril/index.js';
import demoledor from './demoledor/index.js';
import rotomartillo from './rotomartillo/index.js';
import bomba from './bomba/index.js';
import sonda from './sonda/index.js';

const $ = s => document.querySelector(s);
const HERR = [esmeril, demoledor, rotomartillo, bomba, sonda];
const PROXIMAS = ['Taladro'];
const q = new URLSearchParams(location.search);   // ?herr=demoledor&marca=Makita&exp=1&corte&xray&paso=12&sel=estator&cam=x,y,z,tx,ty,tz&rapido
const datos = {};                                  // data.json por herramienta, cargado una vez

// ---------- escena ----------
const cv = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.localClippingEnabled = true;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
const sol = new THREE.DirectionalLight(0xffffff, 1.2); sol.position.set(10, 25, 15); scene.add(sol);
scene.add(new THREE.HemisphereLight(0xffffff, 0xb4bcc8, 1.5));                  // relleno desde arriba y desde abajo: nada queda negro
const luzCam = new THREE.DirectionalLight(0xffffff, 0.9); scene.add(luzCam);    // luz que sigue a la cámara
const luzBajo = new THREE.DirectionalLight(0xdfe6f2, 0.7); luzBajo.position.set(-8, -30, 12); scene.add(luzBajo);
const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 600);
const ctl = new OrbitControls(cam, cv); ctl.enableDamping = true;
const plano = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
let tgtGoal = null;
function vistaInicial() { cam.position.fromArray(herr.vista.pos); ctl.target.fromArray(herr.vista.tgt); tgtGoal = null; }
function ajustar() { const r = $('#vista').getBoundingClientRect(); renderer.setSize(r.width, r.height, false); cam.aspect = r.width / r.height; cam.updateProjectionMatrix(); }
addEventListener('resize', ajustar); ajustar();

// ---------- estado ----------
let herr = HERR.find(h => h.id === q.get('herr')) || esmeril, DATA;
const st = { marca: 'Genérica', modelo: null, cfg: {}, exp: 0, corte: false, xray: false, aislar: false, sel: null, oculta: new Set(), paso: -1, func: false, fp: 0, play: true, vel: 1, tenue: true };
let modelo = null, grupo = null, hover = null;
const monto = {};       // fracción de explosión actual por pieza
const anim = { t: 0, ang: 0 };   // reloj del modo funcionamiento (t: flujos; ang: giro de referencia)
let giroDe = {}, moverDe = {};   // id de pieza -> giros (modelo.vivo.giros) y vaivenes (modelo.vivo.mover) que la mueven
const qg = new THREE.Quaternion(), dg = new THREE.Vector3();

async function elegirHerramienta(h) {
  herr = h; DATA = datos[h.id] ??= await (await fetch(h.datos)).json();
  Object.assign(st, { marca: '', modelo: null, cfg: { ...h.cfg0 }, sel: null, paso: -1, func: false, fp: 0 }); st.oculta.clear();
  cambiarMarca(DATA.modelos[0].marca);
  for (const k in monto) delete monto[k];
  vistaInicial(); reconstruir();
  document.querySelectorAll('.herr .chip[data-h]').forEach(c => c.classList.toggle('on', c.dataset.h === h.id));
}

// pasos de desarme, piezas que salen y fichas propios de cada modelo (si los trae), o los generales de la herramienta
const pasosDe = () => DATA.desarmados?.[st.modelo?.modelo] || DATA.desarmado;
const quitaDe = () => (typeof herr.QUITA === 'function' ? herr.QUITA(st.modelo) : herr.QUITA);
const focoDe = () => (typeof herr.FOCO === 'function' ? herr.FOCO(st.modelo) : herr.FOCO);
const etapasDe = () => DATA.funcionamiento?.[st.modelo?.modelo];
const etapaAct = () => (st.func ? etapasDe()?.[st.fp] : null);
const fichaPieza = nombre => DATA.piezasPorModelo?.[st.modelo?.modelo]?.[nombre] || DATA.piezas[nombre];
function aplicarModelo(m) { st.modelo = m; if (m) Object.assign(st.cfg, herr.deModelo(m)); }
function cambiarMarca(marca) { // una marca trae solo sus modelos: se parte por el primero
  st.marca = marca;
  if (marca === 'Genérica') { st.modelo = null; st.cfg = { ...herr.cfg0 }; } else aplicarModelo(DATA.modelos.find(x => x.marca === marca));
}

function reconstruir() {
  if (grupo) scene.remove(grupo);
  // la marca define el estilo (colores, formas, proporciones) y el modelo, las medidas y características
  const estilo = herr.estilos?.[st.marca] || herr.estilos?.Genérica || {};
  modelo = herr.construir({ ...st.cfg, estilo, m: st.modelo, color: estilo.color || herr.color[st.marca] || herr.color.Genérica, etiqueta: herr.etiqueta(st.marca, st.modelo) });
  grupo = new THREE.Group(); scene.add(grupo);
  for (const p of Object.values(modelo.parts)) { monto[p.id] ??= 0; p.items.forEach(i => grupo.add(i.obj)); }
  giroDe = {}; moverDe = {};
  for (const [lista, mapa] of [[modelo.vivo?.giros, giroDe], [modelo.vivo?.mover, moverDe]]) for (const g of lista || []) for (const s of g.ids) { const [id, i] = s.split(':'); (mapa[id] ??= []).push({ g, i: i == null ? null : +i }); }
  for (const c of Object.values(modelo.vivo?.capas || {})) { c.visible = false; grupo.add(c); }
  if (st.func && !etapasDe()) st.func = false;
  st.fp = Math.min(st.fp, (etapasDe()?.length || 1) - 1);
  if (st.sel && !modelo.parts[st.sel]) st.sel = null;
  aparienciaPiezas(); ui();
}

// ---------- apariencia: rayos X, aislar, selección, hover, foco de paso ----------
function aparienciaPiezas() {
  const pasoN = st.paso >= 0 ? pasosDe()[st.paso].paso : 0;
  const et = etapaAct(), activas = et?.piezas && new Set(et.piezas), vidrio = new Set(et?.vidrio || []);
  const foco = new Set(st.paso >= 0 ? (focoDe()[pasoN] || quitaDe()[pasoN] || []) : et?.foco || []);
  for (const p of Object.values(modelo.parts)) {
    let op = 1;
    if (st.xray && p.shell) op = 0.22;
    if (activas && st.tenue) op = activas.has(p.id) ? (vidrio.has(p.id) ? 0.3 : 1) : p.shell ? 0.05 : 0.1;
    if (st.aislar && st.sel && p.id !== st.sel) op = Math.min(op, 0.12);
    const brillo = p.id === st.sel ? [0x3b82f6, 0.55] : foco.has(p.id) ? [0xf5a524, 0.5] : p.id === hover ? [0x3b82f6, 0.25] : [0, 0];
    for (const m of p.mats) { m.transparent = op < 1; m.opacity = op; if (m.emissive) { m.depthWrite = op >= 1; m.emissive.setHex(brillo[0]); m.emissiveIntensity = brillo[1]; } }
  }
  renderer.clippingPlanes = st.corte ? [plano] : [];
}

// ---------- interfaz ----------
function ui() { uiEquipo(); uiPiezas(); uiDesarme(); uiFuncion(); }
const seg = (id, ops, val) => `<div class="seg" id="${id}">${ops.map(([v, t, s]) => `<button data-v="${v}" class="${String(v) === String(val) ? 'on' : ''}">${t}${s ? `<small>${s}</small>` : ''}</button>`).join('')}</div>`;

function uiEquipo() {
  const marcas = [...new Set(DATA.modelos.map(m => m.marca))];
  const mods = DATA.modelos.filter(m => m.marca === st.marca);
  const m = st.modelo;
  $('#eq').innerHTML = `
   <h3>Marca</h3><select id="marca">${marcas.map(x => `<option ${x === st.marca ? 'selected' : ''}>${x}</option>`).join('')}</select>
   ${st.marca === 'Genérica' ? '' : `<h3>Modelo de ${st.marca}</h3><select id="mod">${mods.map((x, i) => `<option value="${i}" ${x === m ? 'selected' : ''}>${herr.nombreModelo(x)}</option>`).join('')}</select>`}
   ${herr.opciones.map(o => `<h3>${o.titulo}</h3>${seg('op_' + o.k, o.ops.filter(([v]) => st.marca === 'Genérica' || mods.some(x => String(herr.deModelo(x)[o.k]) === String(v))), st.cfg[o.k])}`).join('')}
   <h3>Ficha</h3>
   ${m ? `<dl>${herr.ficha(m).map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl><p class="nota">${m.nota || ''}</p>`
        : `<p class="nota">${herr.resumen(st.cfg)} Elige una marca y un modelo para ver su ficha.</p>`}
   <p class="nota">${herr.aviso}</p>`;
  $('#marca').onchange = e => { cambiarMarca(e.target.value); reconstruir(); };
  if ($('#mod')) $('#mod').onchange = e => { aplicarModelo(mods[+e.target.value]); reconstruir(); };
  for (const o of herr.opciones) $('#op_' + o.k).onclick = e => {
    const v = e.target.closest('button')?.dataset.v; if (v == null) return;
    if (st.marca === 'Genérica') { st.cfg[o.k] = typeof herr.cfg0[o.k] === 'number' ? +v : v; st.modelo = null; }
    else { // con una marca elegida solo valen los modelos de esa marca: se elige el que más se parece a la configuración actual
      const c = mods.filter(x => String(herr.deModelo(x)[o.k]) === v);
      const afin = x => Object.entries(herr.deModelo(x)).filter(([k, val]) => String(st.cfg[k]) === String(val)).length;
      aplicarModelo(c.sort((a, b) => afin(b) - afin(a))[0]);
    }
    reconstruir();
  };
}

function uiPiezas() {
  const grupos = {};
  for (const p of Object.values(modelo.parts)) (grupos[p.grupo] ??= []).push(p);
  const s = st.sel && modelo.parts[st.sel], d = s && (fichaPieza(s.nombre) || herr.extra?.[s.id]);
  $('#pz').innerHTML = Object.entries(grupos).map(([g, ps]) => `<h3>${g}</h3>` + ps.map(p =>
    `<div class="fila ${p.id === st.sel ? 'sel' : ''}" data-id="${p.id}"><button class="ojo" data-ojo="${p.id}" title="Mostrar u ocultar">${st.oculta.has(p.id) ? '◌' : '●'}</button><span>${p.nombre}</span></div>`).join('')).join('') +
    (d ? `<div class="ficha"><h4>${s.nombre}</h4><p><b>Función.</b> ${d.funcion}</p><p><b>Cómo se desgasta.</b> ${d.como_se_desgasta}</p><p><b>Cómo probarla.</b> ${d.prueba}${d.valor_esperado ? ` (${d.valor_esperado})` : ''}</p><p><b>Cuándo cambiarla.</b> ${d.cuando_cambiar}</p>${d.tip_taller ? `<p><b>Tip de taller.</b> ${d.tip_taller}</p>` : ''}</div>` : '<p class="nota">Toca una pieza en la lista o en el modelo para ver su ficha.</p>');
  $('#pz').onclick = e => {
    const o = e.target.closest('[data-ojo]');
    if (o) { const id = o.dataset.ojo; st.oculta.has(id) ? st.oculta.delete(id) : st.oculta.add(id); return uiPiezas(); }
    const f = e.target.closest('[data-id]'); if (f) seleccionar(f.dataset.id);
  };
}

function uiDesarme() {
  const P = pasosDe(), i = st.paso, p = P[i];
  $('#ds').innerHTML = `<div class="nav"><button class="b" id="ant" ${i < 0 ? 'disabled' : ''}>◀ Anterior</button><button class="b" id="sig" ${i >= P.length - 1 ? 'disabled' : ''}>${i < 0 ? 'Empezar' : 'Siguiente'} ▶</button><button class="b" id="fin" ${i < 0 ? 'disabled' : ''}>Salir</button></div>
   <div class="prog"><i style="width:${(i + 1) / P.length * 100}%"></i></div>
   ${p ? `<div class="paso"><b>Paso ${p.paso} de ${P.length} · ${p.titulo}</b><p>${p.instruccion}</p>${p.precaucion ? `<p class="adv">⚠ ${p.precaucion}</p>` : ''}<p class="nota">Herramienta: ${p.herramienta}</p></div>` : `<p class="nota">Recorre el desarme paso a paso: las piezas se van separando en el modelo y se resaltan las que intervienen en cada paso. Las instrucciones vienen del manual de ${herr.nombre.toLowerCase()}.</p>`}
   <h3>Todos los pasos</h3>${P.map((x, j) => `<div class="fila ${j === i ? 'sel' : ''}" data-p="${j}"><span>${x.paso}. ${x.titulo}</span></div>`).join('')}`;
  $('#ant').onclick = () => irPaso(i - 1); $('#sig').onclick = () => irPaso(i + 1); $('#fin').onclick = () => irPaso(-1);
  $('#ds').onclick = e => { const f = e.target.closest('[data-p]'); if (f) irPaso(+f.dataset.p); };
  $('#exp').disabled = i >= 0 || st.func;
}
function irPaso(i) { if (i >= 0 && st.func) { st.func = false; uiFuncion(); } st.paso = i; aparienciaPiezas(); uiDesarme(); }

// ---------- funcionamiento: etapas con capas animadas (corriente, campo, fuerza, giro de las piezas) ----------
function setFunc(on) {
  st.func = on;
  if (on) { st.paso = -1; st.exp = 0; $('#exp').value = 0; }
  aparienciaPiezas(); uiFuncion(); uiDesarme();
}
function irEtapa(i) { st.fp = Math.max(0, Math.min(i, etapasDe().length - 1)); aparienciaPiezas(); uiFuncion(); }
function uiFuncion() {
  const E = etapasDe(), e = E?.[st.fp], p = $('#fn');
  if (!E) { p.innerHTML = '<p class="nota">Este modelo aún no tiene la animación de funcionamiento.</p>'; return; }
  p.innerHTML = `<button class="b grande" id="fnOn">${st.func ? '■ Salir del funcionamiento' : '▶ Ver cómo funciona'}</button>` + (st.func ? `
   <div class="nav"><button class="b" id="fnAnt" ${st.fp <= 0 ? 'disabled' : ''}>◀ Anterior</button><button class="b" id="fnSig" ${st.fp >= E.length - 1 ? 'disabled' : ''}>Siguiente ▶</button></div>
   <div class="prog"><i style="width:${(st.fp + 1) / E.length * 100}%"></i></div>
   <div class="paso"><b>Etapa ${st.fp + 1} de ${E.length} · ${e.titulo}</b><p>${e.texto}</p>
    ${(e.leyenda || []).map(([c, t]) => `<div class="ley"><i style="background:${c}"></i>${t}</div>`).join('')}</div>
   <div class="ctrl"><button class="b" id="fnPlay">${st.play ? '❚❚ Pausa' : '▶ Seguir'}</button><label>Velocidad <input id="fnVel" type="range" min="0.2" max="2.5" step="0.1" value="${st.vel}"></label></div>
   <label class="ctrl"><input id="fnTen" type="checkbox" ${st.tenue ? 'checked' : ''}> Atenuar las piezas que no intervienen</label>
   <p class="nota">La velocidad de giro es solo ilustrativa. Arrastra para rotar el modelo mientras corre la animación.</p>
   <h3>Todas las etapas</h3>${E.map((x, j) => `<div class="fila ${j === st.fp ? 'sel' : ''}" data-e="${j}"><span>${j + 1}. ${x.titulo}</span></div>`).join('')}`
   : `<p class="nota">Recorre, etapa por etapa, cómo funciona el equipo: por dónde pasa la corriente, cómo se forma el campo magnético, qué fuerza mueve el motor y cómo llega el giro al disco. Las piezas que intervienen se destacan y el resto queda atenuado.</p>
      <h3>Etapas</h3>${E.map((x, j) => `<div class="fila" data-e="${j}"><span>${j + 1}. ${x.titulo}</span></div>`).join('')}`);
  $('#fnOn').onclick = () => setFunc(!st.func);
  p.onclick = ev => { const f = ev.target.closest('[data-e]'); if (f) { if (!st.func) setFunc(true); irEtapa(+f.dataset.e); } };
  if (!st.func) return;
  $('#fnAnt').onclick = () => irEtapa(st.fp - 1); $('#fnSig').onclick = () => irEtapa(st.fp + 1);
  $('#fnPlay').onclick = ev => { st.play = !st.play; ev.target.textContent = st.play ? '❚❚ Pausa' : '▶ Seguir'; };
  $('#fnVel').oninput = ev => { st.vel = +ev.target.value; };
  $('#fnTen').onchange = ev => { st.tenue = ev.target.checked; aparienciaPiezas(); };
}

function seleccionar(id) {
  st.sel = st.sel === id ? null : id;
  if (st.sel) { // centrar la cámara en la pieza
    const b = new THREE.Box3(); modelo.parts[id].items.forEach(i => b.expandByObject(i.obj));
    tgtGoal = b.getCenter(new THREE.Vector3());
  }
  aparienciaPiezas(); uiPiezas();
}
document.querySelector('.tabs').onclick = e => {
  const t = e.target.dataset.t; if (!t) return;
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  document.querySelectorAll('.pg').forEach(p => p.classList.toggle('on', p.id === t));
};
const verTab = t => document.querySelector(`.tabs [data-t=${t}]`).click();

$('.herr').innerHTML = HERR.map(h => `<button class="chip ${h === herr ? 'on' : ''}" data-h="${h.id}">${h.nombre}</button>`).join('') + PROXIMAS.map(n => `<span class="chip" title="Próximamente">${n}</span>`).join('');
$('.herr').onclick = e => { const h = HERR.find(x => x.id === e.target.dataset.h); if (h && h !== herr) elegirHerramienta(h); };
$('#exp').oninput = e => { st.exp = +e.target.value; };
$('#corte').onchange = e => { st.corte = e.target.checked; aparienciaPiezas(); };
$('#cortePos').oninput = e => { plano.constant = +e.target.value; };
$('#xray').onchange = e => { st.xray = e.target.checked; aparienciaPiezas(); };
$('#aislar').onchange = e => { st.aislar = e.target.checked; aparienciaPiezas(); };
$('#reset').onclick = () => { vistaInicial(); };

// ---------- puntero: clic selecciona, hover resalta ----------
const ray = new THREE.Raycaster(), pt = new THREE.Vector2();
function pieza(e) {
  const r = cv.getBoundingClientRect();
  pt.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(pt, cam);
  const vis = [];
  for (const p of Object.values(modelo.parts)) if (!st.oculta.has(p.id)) p.items.forEach(i => vis.push(i.obj));
  for (const h of ray.intersectObjects(vis, true)) {
    if (st.corte && h.point.z > plano.constant) continue;
    const id = h.object.userData.pid; if (id && !(st.aislar && st.sel && id !== st.sel)) return id;
  }
  return null;
}
let down = null;
cv.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
cv.addEventListener('pointerup', e => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
  const id = pieza(e); if (id) { seleccionar(id); verTab('pz'); }
});
cv.addEventListener('pointermove', e => {
  if (e.buttons) return;
  const id = pieza(e), tip = $('#tip');
  if (id !== hover) { hover = id; aparienciaPiezas(); }
  tip.style.display = id ? 'block' : 'none';
  if (id) { const r = $('#vista').getBoundingClientRect(); tip.style.left = e.clientX - r.left + 12 + 'px'; tip.style.top = e.clientY - r.top + 12 + 'px'; tip.textContent = modelo.parts[id].nombre; }
});

// ---------- bucle ----------
function quitadas() { // piezas desmontadas hasta el paso actual
  const s = new Set();
  const P = pasosDe(), Q = quitaDe();
  for (let j = 0; j <= st.paso; j++) (Q[P[j].paso] || []).forEach(x => s.add(x));
  return s;
}
let ultimo = performance.now();
function bucle() {
  const ahora = performance.now(), dt = Math.min((ahora - ultimo) / 1000, 0.1); ultimo = ahora;
  const et = etapaAct();
  if (st.func && st.play) { anim.t += dt * st.vel; if (et?.giro) anim.ang += dt * st.vel * 4; }
  const qs = st.paso >= 0 ? quitadas() : null;
  for (const p of Object.values(modelo.parts)) {
    const meta = st.func ? 0 : qs ? (qs.has(p.id) ? 1 : 0) : st.exp;
    monto[p.id] += (meta - monto[p.id]) * 0.12;
    p.items.forEach((i, j) => {
      i.obj.position.copy(i.dir).multiplyScalar(monto[p.id]); i.obj.visible = !st.oculta.has(p.id);
      const G = st.func && giroDe[p.id]?.find(x => x.i == null || x.i === j);
      if (G) { qg.setFromAxisAngle(G.g.e, anim.ang * G.g.k); dg.copy(G.g.c).applyQuaternion(qg).negate().add(G.g.c); i.obj.quaternion.copy(qg); i.obj.position.add(dg); }
      else i.obj.quaternion.identity();
      if (st.func) for (const M of moverDe[p.id] || []) if (M.i == null || M.i === j) i.obj.position.addScaledVector(M.g.eje, M.g.f(anim));
    });
  }
  for (const [n, c] of Object.entries(modelo.vivo?.capas || {})) { c.visible = !!et?.capas?.includes(n); if (c.visible) c.userData.tick?.(anim); }
  if (tgtGoal) { ctl.target.lerp(tgtGoal, 0.1); if (ctl.target.distanceTo(tgtGoal) < 0.02) tgtGoal = null; }
  ctl.update(); luzCam.position.copy(cam.position); renderer.render(scene, cam);
  requestAnimationFrame(bucle);
}

// ---------- arranque (con parámetros de la URL para pruebas) ----------
await elegirHerramienta(herr);
if (q.get('marca')) cambiarMarca(q.get('marca'));
for (const o of herr.opciones) if (q.has(o.k)) st.cfg[o.k] = typeof herr.cfg0[o.k] === 'number' ? +q.get(o.k) : q.get(o.k);
if (q.get('modelo')) { const m = DATA.modelos.find(x => x.marca === st.marca && x.modelo === q.get('modelo')); if (m) aplicarModelo(m); }
st.exp = +(q.get('exp') || 0); st.corte = q.has('corte'); st.xray = q.has('xray');
if (q.get('paso')) st.paso = +q.get('paso') - 1;
if (q.has('func') && etapasDe()) { st.func = true; st.paso = -1; st.fp = (+q.get('etapa') || 1) - 1; st.exp = 0; }
if (q.has('pausa')) st.play = false;
anim.t = +q.get('t') || 0; anim.ang = +q.get('ang') || 0;
if (q.get('sel')) st.sel = q.get('sel');
$('#exp').value = st.exp; $('#corte').checked = st.corte; $('#xray').checked = st.xray;
if (q.get('cam')) { const c = q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); ctl.target.set(c[3], c[4], c[5]); }
reconstruir();
if (st.func) verTab('fn');
if (q.has('rapido')) for (const id in monto) monto[id] = 1;
bucle();
