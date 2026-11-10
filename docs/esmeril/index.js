import { construir } from './modelo.js';

const GA = 'GA4530';
const n = (v, u) => v == null ? 'sin dato en las fuentes' : `${String(v).replace('.', ',')} ${u}`;

export default {
  id: 'esmeril', nombre: 'Esmeril angular', datos: new URL('data.json', import.meta.url), construir,
  // turquesa Makita: fotos del GA4030K (misma carcasa, guía iFixit); rojo y negro Milwaukee: foto de la página 2 del despiece 2880-20
  color: { Makita: '#1595a0', Milwaukee: '#c8202a', Genérica: '#4f6f8f' },
  estilos: { Makita: { color: '#1595a0' }, Milwaukee: { color: '#c8202a', c2: '#1d1f22' } },
  opciones: [], cfg0: {}, deModelo: () => ({}),   // disco, interruptor y alimentación los define cada modelo
  ficha: m => [['Modelo', `${m.marca} ${m.modelo}`], ['Disco', `${m.disco} mm`], ['Potencia', n(m.potencia, 'W')], ['Velocidad', n(m.rpm, 'rpm')], ['Peso', n(m.peso, 'kg')],
    ['Largo', n(m.largo, 'mm')], ['Rosca', m.rosca ?? 'sin dato'], ['Alimentación', m.bateria ? 'Batería M18 (motor sin escobillas)' : 'Cable (motor con escobillas)'], ['Interruptor', m.interruptor ?? 'sin dato']],
  nombreModelo: x => `${x.modelo} · ${x.disco} mm`,
  resumen: () => '',
  aviso: 'Solo se modelan equipos con despiece oficial completo. Son exactos la lista de piezas, sus números (ref.), cómo se arman y el orden en que salen; las medidas son aproximadas, tomadas a ojo de los dibujos (salvo el largo de 266 mm del GA4530), y los colores salen de fotos, no de los despieces. El orden de desarme es deducido: ningún fabricante lo publica para estos modelos.',
  // pasos reales de cada modelo (data.desarmados) -> piezas que salen y piezas que se resaltan
  QUITA: m => m?.modelo === GA ? {
    2: ['tuerca', 'disco'], 3: ['brida'], 4: ['mango'], 5: ['protector', 't33'],
    6: ['t29', 'cajarod', 'husillo', 'corona', 'rod6201', 'anillo24', 'arandela26', 'oring27', 'laberinto', 'anillo21', 'rod696'],
    8: ['tapa', 't55'], 9: ['t56', 'porta40', 'porta51', 'carbones'], 10: ['t45', 'prensacable', 'interruptor', 'protcable', 'cable'],
    11: ['perilla', 'palanca', 'resorte52'], 12: ['t15'],
    13: ['caja', 'inducido', 'ventilador', 'guia', 'anillo22', 'rod629', 'oring9', 'pinon', 'tuercaM6', 'aislante', 'rod607', 'goma3', 'boton', 'resorte14', 'perno17', 'oring16', 'pasador19'],
    15: ['t37', 'campo', 'deflector'],
  } : {
    1: ['bateria'], 2: ['tuerca18', 'disco', 'brida17'], 3: ['mango47'], 4: ['protector48'],
    5: ['t12', 'cubo53', 'oring8', 'traba20', 'resorte19', 't21'], 7: ['tuerca28', 'pinon29'], 8: ['t24'], 9: ['caja56', 'rod25', 'retenedor26', 't27'],
    10: ['t37', 't35', 'cubierta38'], 11: ['rotor31', 'rod32', 'arandela30'], 12: ['paleta60', 'resorte43', 'polvo45'], 13: ['electronica54'],
  },
  FOCO: m => m?.modelo === GA ? {
    1: ['cable'], 2: ['tuerca', 'disco', 'boton'], 7: ['pinon', 'corona', 'caja'], 13: ['caja', 'inducido', 'pinon', 'tuercaM6', 'anillo22'],
    14: ['boton', 'resorte14', 'perno17', 'oring16', 'pasador19'], 16: ['caja', 'pinon', 'corona'],
  } : { 6: ['pinon29', 'caja56', 'cubo53'], 14: ['caja56', 'pinon29', 'electronica54'] },
  vista: { pos: [12, 13, -36], tgt: [-9, 1, 0] },
  etiqueta: (marca, m) => m ? `${marca} ${m.modelo}`.slice(0, 26).toUpperCase() : '',
};
