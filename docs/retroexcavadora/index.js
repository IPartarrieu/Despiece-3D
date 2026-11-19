import { construir } from './modelo.js';
import { CAT as D, dims, claveDe, porModelo } from './comun.js';

// Pasos de desarme de cada modelo (data.json -> desarmados): qué piezas salen (quita) y cuáles se resaltan (foco).
const pasos = m => porModelo(D.desarmados, m) || D.desarmado || [];
const porPaso = (m, campo) => Object.fromEntries(pasos(m).map(p => [p.paso, p[campo]]));
const corta = marca => (/cat|caterpillar/i.test(marca) ? 'CAT' : String(marca || '').split(' ')[0]);

// colores de marca: Case serie N naranja tostado con brazos y cucharón gris oscuro (foto del folleto N-Series);
// CAT amarillo con negro; JCB amarillo con cucharón, llantas y cabina negros (folleto 3CX). Aproximados.
const CASE = { cuerpo: '#df8a2b', pluma: '#df8a2b', brazo: '#3a3f44', cucharon: '#34393e', cuchara: '#2c3034', cab: '#1c1e21', chasis: '#2c3034', llanta: '#3e4449', estab: '#30353a', cil: '#2a2d31', texto: '#ffffff' };
const CATY = { cuerpo: '#f2b705', pluma: '#f2b705', brazo: '#f2b705', cucharon: '#f2b705', cuchara: '#f2b705', cab: '#1b1b1b', chasis: '#1f1f1f', llanta: '#f2b705', estab: '#f2b705', cil: '#2a2a2a', texto: '#111111' };
const JCB = { cuerpo: '#f5b400', pluma: '#f5b400', brazo: '#f5b400', cucharon: '#1e1e1e', cuchara: '#1e1e1e', cab: '#151515', chasis: '#1e1e1e', llanta: '#1e1e1e', estab: '#f5b400', cil: '#2a2a2a', texto: '#ffffff' };

const AVISO = 'Modelo 3D procedural y aproximado. Distancia entre ejes, alturas, anchos, trochas, alcances, profundidad de excavación, apertura de estabilizadores y diámetros de cilindros salen de las hojas técnicas (Case 580N y 580 Super N; CAT 420F2). Los largos de pluma, brazo y cuchara, la posición de pivotes y anclajes, las formas, el motor por dentro y los colores son estimados a partir de alcances, carreras y fotos. CAT 420F2 y JCB 3CX son referenciales: misma arquitectura escalada a sus medidas (JCB sin hoja de dimensiones: medidas estimadas).';

function ficha(m) {
  if (m?.ficha) return m.ficha;
  const d = dims(m), est = claveDe(m) === '3CX' ? ' (estimado)' : '';
  return [
    ['Distancia entre ejes', `${(d.wb / 100).toFixed(2)} m${est}`], ['Altura de transporte', `${(d.ht / 100).toFixed(2)} m${est}`],
    ['Altura a la cabina', `${(d.cab / 100).toFixed(2)} m${est}`], ['Ancho', `${(d.ancho / 100).toFixed(2)} m${est}`],
    ['Profundidad de excavación', `${(d.prof / 100).toFixed(2)} m`], ['Alcance desde el pivote', `${(d.alc / 100).toFixed(2)} m${est}`],
    ['Apertura de estabilizadores', `${(d.estab / 100).toFixed(2)} m${est}`], ['Neumáticos', `${d.ftxt} / ${d.rtxt}${est}`],
    ['Motor', `${d.motorL} L${est}`],
  ];
}

export default {
  id: 'retroexcavadora', nombre: 'Retroexcavadora', datos: new URL('data.json', import.meta.url), construir,
  color: { 'Case (CNH)': CASE.cuerpo, Case: CASE.cuerpo, CASE: CASE.cuerpo, Caterpillar: CATY.cuerpo, CAT: CATY.cuerpo, Cat: CATY.cuerpo, JCB: JCB.cuerpo, Genérica: CASE.cuerpo },
  estilos: { 'Case (CNH)': CASE, Case: CASE, CASE, Caterpillar: CATY, CAT: CATY, Cat: CATY, JCB, Genérica: CASE },
  opciones: [], cfg0: {}, deModelo: () => ({}),
  nombreModelo: x => x.nombre || x.modelo,
  ficha,
  resumen: () => '',
  aviso: D.aviso || (typeof D.avisos === 'string' ? D.avisos : D.avisos?.general) || AVISO,
  QUITA: m => porPaso(m, 'quita'),
  FOCO: m => porPaso(m, 'foco'),
  extra: {},
  // vista de 3/4 delantera izquierda; la máquina mide ~7 m con la retro plegada
  vista: { pos: [640, 400, -980], tgt: [70, 125, 0] },
  // vistas por etapa de «Funciona» (data.json -> funcionamiento[].vista) y por paso de desarme
  vistas: {
    general: { pos: [640, 400, -980], tgt: [70, 125, 0] },
    motor: { pos: [420, 260, -330], tgt: [180, 105, 0] },
    transmision: { pos: [330, 40, -420], tgt: [100, 60, 0] },
    ejes: { pos: [330, 40, -420], tgt: [100, 60, 0] },
    hidraulico: { pos: [380, 300, -520], tgt: [40, 100, 0] },
    cargador: { pos: [760, 300, -520], tgt: [260, 150, 0] },
    estab: { pos: [-520, 220, -460], tgt: [-110, 100, 0] },
    giro: { pos: [-300, 760, -520], tgt: [-200, 80, 0] },
    retro: { pos: [-480, 380, -1050], tgt: [-120, 120, 0] },
    direccion: { pos: [520, 200, -380], tgt: [200, 50, 0] },
    // vistas de los pasos de desarme (data.json -> desarmados[].vista): motor en detalle, volante y retenes, mandos finales, cilindro
    motor_det: { pos: [330, 185, -210], tgt: [198, 104, 0] },
    motor_frente: { pos: [430, 150, -170], tgt: [240, 104, 0] },
    motor_atras: { pos: [30, 180, -230], tgt: [150, 104, 0] },
    motor_sup: { pos: [200, 330, -140], tgt: [200, 115, 0] },
    motor_bajo: { pos: [280, 25, -230], tgt: [200, 90, 0] },
    bateria: { pos: [260, 110, 330], tgt: [140, 65, 54] },
    cabina: { pos: [-120, 230, -330], tgt: [40, 160, 0] },
    eje_trasero: { pos: [-60, 80, -340], tgt: [0, 60, -20] },
    mando_final: { pos: [90, 90, -270], tgt: [0, 60, -77] },
    cilindro_pluma: { pos: [-250, 230, -220], tgt: [-70, 167, 0] },
  },
  etiqueta: (marca, m) => (m ? `${corta(marca)} ${m.modelo}` : corta(marca)).toUpperCase(),
};
