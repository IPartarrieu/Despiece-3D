import { construir } from './modelo.js';

const dato = v => (v == null ? '—' : v);
// Pasos del desarme -> piezas que salen. Los números de paso siguen data.json (desarmado del D25900K y desarmados.D25940K).
// En ambos documentos los pasos 1-11 (portaherramienta) y 17-33 (mango, motor y engranajes) coinciden; cambia el orden de la
// cubierta 66: el D25900K la saca antes de soltar la unidad antivibración (pág. 16) y el D25940K después (pág. 15).
const TH = ['tornillos_porta', 'brida', 'manga_giratoria', 'bloqueo', 'amortiguador_th', 'manguito', 'anillo_elastico', 'sello_frontal', 'husillo', 'sellos_th', 'rodamiento_golpeo'];
const COMUN = {
  1: ['mango_lateral'], 2: TH, 3: ['buje72'], 4: ['pieza_golpeo', 'buje_golpeo'],
  14: ['antivibracion'], 15: ['cilindro'], 16: ['martillo', 'juntas_cil'],
  17: ['tapa_mango'], 18: ['interruptor', 'cable'], 19: ['gatillo'], 20: ['tapa_motor', 'electronica'], 21: ['ventilador'],
  23: ['escobillas'], 24: ['portaescobillas', 'rodamiento5'], 25: ['estator'], 26: ['tapa_sa'], 27: ['piston', 'biela'],
  28: ['tapa_engranajes', 'tapa21'], 29: ['inducido'], 30: ['engranaje_cig'], 31: ['engranaje_doble'], 32: ['cigueñal'], 33: ['rodamiento_inducido'],
};
const AV = ['tornillos65', 'carcasa_delantera', 'junta79'];

export default {
  id: 'demoledor', nombre: 'Demoledor', datos: new URL('data.json', import.meta.url), construir,
  color: { DeWalt: '#f2b200', Kothman: '#3a3d42' },
  // colores tomados de las fotos del documento de servicio: tapa del motor, tapa de engranajes y mango amarillos;
  // carcasa principal y alojamiento delantero de metal gris plateado; portaherramienta, cubierta 66, gatillo y agarre negros
  estilos: { DeWalt: { color: '#f2b200', carter: '#b7bbc0', negro: '#1c1d20' }, Kothman: { color: '#3a3d42', carter: '#b7bbc0', negro: '#1c1d20' } }, // Kothman HK-17: la tapa y el mango van en gris oscuro (el catálogo muestra gris, negro y rojo)
  opciones: [],
  cfg0: {},
  deModelo: () => ({}),
  nombreModelo: x => `${x.modelo} · ${x.clase}`,
  ficha: m => [['Modelo', `${m.marca} ${m.modelo}`], ['Clase', m.clase], ['Portaherramienta', m.porta || '—'], ['Peso', `${dato(m.peso)} kg`], ['Potencia', `${dato(m.potencia)} W`], ['Energía de impacto', `${dato(m.energia)} J`], ['Golpes por minuto', dato(m.golpes)], ['Vibración', m.vibracion == null ? '—' : `${m.vibracion} m/s²`]],
  resumen: () => 'Demoledor DeWalt con documento de servicio completo; Kothman HK-17 referencial.',
  aviso: 'DeWalt D25900K y D25940K: exacto, según el procedimiento de servicio DeWalt/ESSG de cada modelo: qué piezas hay, sus números, cómo van dispuestas (cincel horizontal, unidad antivibración, cárter con biela y cigüeñal, motor vertical atrás con el ventilador arriba y la caja de engranajes abajo, mango en D) y el orden y sentido en que se desarman. Aproximado: las medidas externas y los detalles finos. El documento no trae medidas; la escala sale de la foto de corte y de las juntas tóricas que sí tienen medida, y el D25940K se escaló por peso. Kothman HK-17: referencial; usa esta misma arquitectura escalada a 6,5 kg, y sus datos salen del catálogo Kothman 2024.',
  QUITA: m => (m?.modelo === 'D25940K' ? { ...COMUN, 12: [...AV, 'cubierta'] } : { ...COMUN, 12: ['cubierta'], 13: AV }),
  FOCO: m => ({
    5: ['rodamiento_golpeo', 'sellos_th'], 6: ['sello_frontal'], 7: ['manguito', 'anillo_elastico'], 8: ['anillo_elastico', 'manguito', 'amortiguador_th'],
    9: ['bloqueo'], 10: ['manga_giratoria', 'brida', 'husillo', 'sellos_th'], 11: ['manga_giratoria', 'sellos_th', 'husillo'],
    13: m?.modelo === 'D25940K' ? ['cubierta', 'carcasa_delantera'] : ['tornillos65', 'carcasa_delantera', 'junta79'],
    22: ['portaescobillas', 'interruptor'], 25: ['estator', 'carcasa_principal'],
  }),
  extra: {},
  vista: { pos: [2, 16, 92], tgt: [9, -1, 0] },
  etiqueta: (marca, m) => (m ? `${marca} ${m.modelo}`.toUpperCase() : marca.toUpperCase()),
};
