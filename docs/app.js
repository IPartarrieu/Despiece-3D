import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { construir } from './modelo.js';

const $ = s => document.querySelector(s);
const DATA = await (await fetch('data.json')).json();
// colores referenciales por marca (no son medidas ni fichas oficiales)
const COLOR = { Makita: '#00909e', Bosch: '#1e6fb5', DeWalt: '#f5c518', Milwaukee: '#d71f26', Hilti: '#d2051e', 'Black+Decker': '#f26b21', Stanley: '#f9c80e', Kothman: '#e0662a', Genérica: '#4f6f8f' };
const DISCOS = [[115, '4½"'], [125, '5"'], [180, '7"'], [230, '9"']];
// pasos del desarme (data.desarmado) -> piezas que salen y piezas que se resaltan
const QUITA = { 1: ['cable', 'bateria'], 3: ['tuerca', 'disco'], 4: ['brida_int', 'protector'], 5: ['mango'], 6: ['escobillas'], 10: ['carcasa'], 11: ['interruptor', 'estator'], 12: ['inducido', 'ventilador', 'colector'], 13: ['pinon', 'rodamientos'], 15: ['husillo', 'corona', 'boton'] };
const FOCO = { 7: ['escobillas'], 8: ['escobillas', 'interruptor'], 9: ['cabezal'], 14: ['rodamientos'] };

// ---------- escena ----------
const cv = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.localClippingEnabled = true;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
const sol = new THREE.DirectionalLight(0xffffff, 1.4); sol.position.set(10, 25, 15); scene.add(sol);
const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 400);
const ctl = new OrbitControls(cam, cv); ctl.enableDamping = true;
const VISTA0 = { pos: new THREE.Vector3(16, 14, 30), tgt: new THREE.Vector3(-6, 1.5, 0) };
const plano = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
function vistaInicial() { cam.position.copy(VISTA0.pos); ctl.target.copy(VISTA0.tgt); tgtGoal = null; }
let tgtGoal = null;
vistaInicial();
function ajustar() { const r = $('#vista').getBoundingClientRect(); renderer.setSize(r.width, r.height, false); cam.aspect = r.width / r.height; cam.updateProjectionMatrix(); }
addEventListener('resize', ajustar); ajustar();

// ---------- estado ----------
const st = { marca: 'Genérica', modelo: null, disco: 115, bateria: false, gatillo: false, exp: 0, corte: false, xray: false, aislar: false, sel: null, oculta: new Set(), paso: -1, tab: 'eq' };
let modelo = null, grupo = null;
const monto = {};       // fracción de explosión actual por pieza
let hover = null;

const num = v => (v == null ? '—' : v);
function aplicarModelo(m) {
  st.modelo = m;
  if (m) {
    st.disco = m.disco; st.bateria = m.bateria;
    st.gatillo = /gatillo/i.test(m.interruptor || '');
  }
}

function reconstruir() {
  if (grupo) scene.remove(grupo);
  modelo = construir({ disco: st.disco, color: COLOR[st.marca] || COLOR.Genérica, bateria: st.bateria, gatillo: st.gatillo, etiqueta: st.modelo ? `${st.marca} ${st.modelo.modelo}`.slice(0, 26).toUpperCase() : st.marca === 'Genérica' ? '' : st.marca.toUpperCase() });
  grupo = new THREE.Group(); scene.add(grupo);
  for (const p of Object.values(modelo.parts)) { monto[p.id] ??= 0; p.items.forEach(i => grupo.add(i.obj)); p.mats.forEach(m => { m.userData.op = 1; }); }
  if (st.sel && !modelo.parts[st.sel]) st.sel = null;
  aparienciaPiezas(); ui();
}

// ---------- apariencia: rayos X, aislar, selección, hover, foco de paso ----------
function aparienciaPiezas() {
  const foco = new Set(st.paso >= 0 ? (FOCO[DATA.desarmado[st.paso].paso] || QUITA[DATA.desarmado[st.paso].paso] || []) : []);
  for (const p of Object.values(modelo.parts)) {
    let op = 1;
    if (st.xray && p.shell) op = 0.22;
    if (st.aislar && st.sel && p.id !== st.sel) op = Math.min(op, 0.12);
    const brillo = p.id === st.sel ? [0x3b82f6, 0.55] : foco.has(p.id) ? [0xf5a524, 0.5] : p.id === hover ? [0x3b82f6, 0.25] : [0, 0];
    for (const m of p.mats) { m.transparent = op < 1; m.opacity = op; if (m.emissive) { m.depthWrite = op >= 1; m.emissive.setHex(brillo[0]); m.emissiveIntensity = brillo[1]; } }
  }
  renderer.clippingPlanes = st.corte ? [plano] : [];
}

// ---------- interfaz ----------
function ui() { uiEquipo(); uiPiezas(); uiDesarme(); }
const seg = (id, ops, val) => `<div class="seg" id="${id}">${ops.map(([v, t, s]) => `<button data-v="${v}" class="${String(v) === String(val) ? 'on' : ''}">${t}${s ? `<small>${s}</small>` : ''}</button>`).join('')}</div>`;

function uiEquipo() {
  const marcas = ['Genérica', ...new Set(DATA.modelos.map(m => m.marca))];
  const mods = DATA.modelos.filter(m => m.marca === st.marca);
  const m = st.modelo;
  $('#eq').innerHTML = `
   <h3>Marca</h3><select id="marca">${marcas.map(x => `<option ${x === st.marca ? 'selected' : ''}>${x}</option>`).join('')}</select>
   ${st.marca === 'Genérica' ? '' : `<h3>Modelo</h3><select id="mod"><option value="">Personalizado</option>${mods.map((x, i) => `<option value="${i}" ${x === m ? 'selected' : ''}>${x.modelo} · ${x.disco} mm</option>`).join('')}</select>`}
   <h3>Diámetro del disco</h3>${seg('sdisco', DISCOS.map(([mm, p]) => [mm, mm + ' mm', p]), st.disco)}
   <h3>Alimentación</h3>${seg('sbat', [[0, 'Cable', 'con escobillas'], [1, 'Batería', 'sin escobillas']], st.bateria ? 1 : 0)}
   <h3>Interruptor</h3>${seg('sgat', [[0, 'Paleta'], [1, 'Gatillo']], st.gatillo ? 1 : 0)}
   <h3>Ficha</h3>
   ${m ? `<dl><dt>Modelo</dt><dd>${m.marca} ${m.modelo}</dd><dt>Disco</dt><dd>${m.disco} mm</dd><dt>Potencia</dt><dd>${num(m.potencia)} W</dd><dt>Velocidad</dt><dd>${num(m.rpm)} rpm</dd><dt>Peso</dt><dd>${num(m.peso)} kg</dd><dt>Rosca</dt><dd>${num(m.rosca)}</dd></dl><p class="nota">${m.nota || ''}</p>`
        : `<p class="nota">Configuración personalizada de ${st.disco} mm. Elige una marca y un modelo para ver su ficha.</p>`}
   <p class="nota">El modelo 3D es esquemático: las piezas y su disposición son las del esmeril angular típico; las proporciones se escalan con el diámetro y los colores de marca son referenciales.</p>`;
  $('#marca').onchange = e => { st.marca = e.target.value; st.modelo = null; reconstruir(); };
  if ($('#mod')) $('#mod').onchange = e => { aplicarModelo(e.target.value === '' ? null : mods[+e.target.value]); reconstruir(); };
  $('#sdisco').onclick = e => { const v = e.target.closest('button')?.dataset.v; if (v) { st.disco = +v; st.modelo = null; reconstruir(); } };
  $('#sbat').onclick = e => { const v = e.target.closest('button')?.dataset.v; if (v != null) { st.bateria = v === '1'; st.modelo = null; reconstruir(); } };
  $('#sgat').onclick = e => { const v = e.target.closest('button')?.dataset.v; if (v != null) { st.gatillo = v === '1'; st.modelo = null; reconstruir(); } };
}

function uiPiezas() {
  const grupos = {};
  for (const p of Object.values(modelo.parts)) (grupos[p.grupo] ??= []).push(p);
  const s = st.sel && modelo.parts[st.sel], d = s && (DATA.piezas[s.nombre] || BATERIA[s.id]);
  $('#pz').innerHTML = Object.entries(grupos).map(([g, ps]) => `<h3>${g}</h3>` + ps.map(p =>
    `<div class="fila ${p.id === st.sel ? 'sel' : ''}" data-id="${p.id}"><button class="ojo" data-ojo="${p.id}" title="Mostrar u ocultar">${st.oculta.has(p.id) ? '◌' : '●'}</button><span>${p.nombre}</span></div>`).join('')).join('') +
    (d ? `<div class="ficha"><h4>${s.nombre}</h4><p><b>Función.</b> ${d.funcion}</p><p><b>Cómo se desgasta.</b> ${d.como_se_desgasta}</p><p><b>Cómo probarla.</b> ${d.prueba}${d.valor_esperado ? ` (${d.valor_esperado})` : ''}</p><p><b>Cuándo cambiarla.</b> ${d.cuando_cambiar}</p>${d.tip_taller ? `<p><b>Tip de taller.</b> ${d.tip_taller}</p>` : ''}</div>` : '<p class="nota">Toca una pieza en la lista o en el modelo para ver su ficha.</p>');
  $('#pz').onclick = e => {
    const o = e.target.closest('[data-ojo]');
    if (o) { const id = o.dataset.ojo; st.oculta.has(id) ? st.oculta.delete(id) : st.oculta.add(id); return uiPiezas(); }
    const f = e.target.closest('[data-id]'); if (f) seleccionar(f.dataset.id);
  };
}
const BATERIA = { bateria: { funcion: 'Entrega la energía; reemplaza al cable y a las escobillas (motor sin escobillas).', como_se_desgasta: 'Pierde capacidad con los ciclos de carga y el calor.', prueba: 'Medir el voltaje en reposo y bajo carga; revisar los contactos.', valor_esperado: null, cuando_cambiar: 'Si se descarga muy rápido, se hincha o se calienta al cargar.', tip_taller: null } };

function uiDesarme() {
  const P = DATA.desarmado, i = st.paso, p = P[i];
  $('#ds').innerHTML = `<div class="nav"><button class="b" id="ant" ${i < 0 ? 'disabled' : ''}>◀ Anterior</button><button class="b" id="sig" ${i >= P.length - 1 ? 'disabled' : ''}>${i < 0 ? 'Empezar' : 'Siguiente'} ▶</button><button class="b" id="fin" ${i < 0 ? 'disabled' : ''}>Salir</button></div>
   <div class="prog"><i style="width:${(i + 1) / P.length * 100}%"></i></div>
   ${p ? `<div class="paso"><b>Paso ${p.paso} de ${P.length} · ${p.titulo}</b><p>${p.instruccion}</p>${p.precaucion ? `<p class="adv">⚠ ${p.precaucion}</p>` : ''}<p class="nota">Herramienta: ${p.herramienta}</p></div>` : '<p class="nota">Recorre el desarme paso a paso: las piezas se van separando en el modelo y se resaltan las que intervienen en cada paso. Las instrucciones vienen del manual del esmeril angular.</p>'}
   <h3>Todos los pasos</h3>${P.map((x, j) => `<div class="fila ${j === i ? 'sel' : ''}" data-p="${j}"><span>${x.paso}. ${x.titulo}</span></div>`).join('')}`;
  $('#ant').onclick = () => irPaso(i - 1); $('#sig').onclick = () => irPaso(i + 1); $('#fin').onclick = () => irPaso(-1);
  $('#ds').onclick = e => { const f = e.target.closest('[data-p]'); if (f) irPaso(+f.dataset.p); };
  $('#exp').disabled = i >= 0;
}
function irPaso(i) { st.paso = i; aparienciaPiezas(); uiDesarme(); }

function seleccionar(id) {
  st.sel = st.sel === id ? null : id;
  if (st.sel) { // centrar la cámara en la pieza
    const b = new THREE.Box3(); modelo.parts[id].items.forEach(i => b.expandByObject(i.obj));
    tgtGoal = b.getCenter(new THREE.Vector3());
  }
  aparienciaPiezas(); uiPiezas();
}
document.querySelector('.tabs').onclick = e => {
  const t = e.target.dataset.t; if (!t) return; st.tab = t;
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  document.querySelectorAll('.pg').forEach(p => p.classList.toggle('on', p.id === t));
};
const verTab = t => document.querySelector(`.tabs [data-t=${t}]`).click();

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
function pasoFin() { // piezas desmontadas hasta el paso actual
  const s = new Set();
  for (let j = 0; j <= st.paso; j++) (QUITA[DATA.desarmado[j].paso] || []).forEach(x => s.add(x));
  return s;
}
function bucle() {
  const quitadas = st.paso >= 0 ? pasoFin() : null;
  for (const p of Object.values(modelo.parts)) {
    const meta = quitadas ? (quitadas.has(p.id) ? 1 : 0) : st.exp;
    monto[p.id] += (meta - monto[p.id]) * 0.12;
    p.items.forEach(i => { i.obj.position.copy(i.dir).multiplyScalar(monto[p.id]); i.obj.visible = !st.oculta.has(p.id); });
  }
  if (tgtGoal) { ctl.target.lerp(tgtGoal, 0.1); if (ctl.target.distanceTo(tgtGoal) < 0.02) tgtGoal = null; }
  ctl.update(); renderer.render(scene, cam);
  requestAnimationFrame(bucle);
}
const q = new URLSearchParams(location.search);   // ?disco=230&marca=Makita&exp=1&corte=1&xray=1&paso=11&sel=estator
if (q.get('marca')) st.marca = q.get('marca');
if (q.get('disco')) st.disco = +q.get('disco');
if (q.get('bateria')) st.bateria = true;
st.exp = +(q.get('exp') || 0); st.corte = q.has('corte'); st.xray = q.has('xray');
if (q.get('paso')) st.paso = +q.get('paso') - 1;
if (q.get('sel')) st.sel = q.get('sel');
$('#exp').value = st.exp; $('#corte').checked = st.corte; $('#xray').checked = st.xray;
if (q.get('cam')) { const c = q.get('cam').split(',').map(Number); cam.position.set(c[0], c[1], c[2]); ctl.target.set(c[3], c[4], c[5]); }
reconstruir();
if (q.has('rapido')) for (const id in monto) monto[id] = 1;
bucle();
