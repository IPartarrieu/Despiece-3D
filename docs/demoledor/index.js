import { construir } from './modelo.js';

const dato = v => (v == null ? '—' : v);
export default {
  id: 'demoledor', nombre: 'Demoledor', datos: new URL('data.json', import.meta.url), construir,
  // colores referenciales por marca (no son medidas ni fichas oficiales)
  color: { Makita: '#00909e', Bosch: '#1e6fb5', DeWalt: '#f5c518', Milwaukee: '#d71f26', Hilti: '#d2051e', Stanley: '#f9c80e', Kothman: '#e0662a', HiKOKI: '#4a9a3c', Einhell: '#d62c2c', Total: '#3a76c4', Metabo: '#2f8a4a', Genérica: '#4f6f8f' },
  // Estilo por marca. Solo se cambia un rasgo cuando hay evidencia; el resto queda en el valor genérico (ver DEF en modelo.js).
  // Evidencia consultada: fichas web (DeWalt D25911K: cuerpo amarillo y negro, mango en D, mango lateral multiposición; Hilti TE 700-AVR: sistema AVR de reducción de vibración).
  // No se pudo confirmar con fotos la forma de mango, topes ni seguro de las demás marcas: se dejan genéricos y solo cambia el color de marca (referencial).
  estilos: {
    Genérica: {},
    Kothman: { color: '#e0662a' }, // sin evidencia de rasgos propios
    Makita: { color: '#00909e' }, // sin evidencia de rasgos propios
    Bosch: { color: '#1e6fb5', aux: { disco: false } }, // mango auxiliar de abrazadera con empuñadura de polímero (sin disco) según el catálogo 2 602 025 076
    DeWalt: { color: '#f5c518', carter: '#f5c518', mangoCol: '#1c1e21', mango: 'D', aux: { color: '#1c1e21' } }, // cárter pintado amarillo: supuesto, no verificado con foto
    Milwaukee: { color: '#d71f26' }, // sin evidencia de rasgos propios
    Hilti: { color: '#d2051e', mangoCol: '#1c1e21', mango: 'goma' }, // AVR: empuñadura desacoplada con goma (forma exacta no verificada)
    Stanley: { color: '#f9c80e' }, // sin evidencia de rasgos propios
    HiKOKI: { color: '#4a9a3c' }, // sin evidencia de rasgos propios
    Einhell: { color: '#d62c2c' }, // sin evidencia de rasgos propios
    Total: { color: '#3a76c4' }, // sin evidencia de rasgos propios
    Metabo: { color: '#2f8a4a' }, // sin evidencia de rasgos propios
  },
  opciones: [{ k: 'clase', titulo: 'Portaherramienta', ops: [['hex17', 'Hex 17 mm', 'liviano, 5 a 7 kg'], ['sds', 'SDS-max', 'mediano, 10 a 12 kg']] }],
  cfg0: { clase: 'hex17' },
  deModelo: m => ({ clase: m.clase }),
  nombreModelo: x => `${x.modelo} · ${x.porta}`,
  ficha: m => [['Modelo', `${m.marca} ${m.modelo}`], ['Portaherramienta', m.porta || '—'], ['Peso', `${dato(m.peso)} kg`], ['Potencia', `${dato(m.potencia)} W`], ['Energía de impacto', `${dato(m.energia)} J`], ['Golpes por minuto', dato(m.golpes)], ['Vibración', m.vibracion == null ? '—' : `${m.vibracion} m/s²`]],
  resumen: cfg => `Demoledor ${cfg.clase === 'sds' ? 'SDS-max, de clase mediana' : 'hex 17 mm, de clase liviana'}.`,
  aviso: 'El modelo 3D es esquemático y sigue la disposición de los demoledores livianos con motor vertical bajo el cárter, cañón horizontal y mango en D. Es una representación de la clase, no un despiece de un modelo en particular; los colores de marca son referenciales.',
  // pasos del desarme (data.desarmado) -> piezas que salen y piezas que se resaltan
  QUITA: { 1: ['cincel'], 2: ['mango_auxiliar'], 3: ['mango_trasero', 'cable', 'interruptor'], 4: ['escobillas'], 5: ['ventilador'], 6: ['carcasa_motor'], 7: ['inducido', 'colector'], 8: ['portaherramienta'], 9: ['amortiguacion'], 10: ['intermedio'], 11: ['cilindro', 'martillo'], 12: ['piston', 'biela'], 13: ['carcasa_engranajes'], 14: ['eje_intermedio', 'pinon'], 15: ['rodamientos'] },
  FOCO: { 16: ['carcasa_engranajes', 'cilindro', 'piston', 'martillo'] },
  extra: {},
  vista: { pos: [30, 26, 85], tgt: [14, 0, 0] },
  etiqueta: (marca, m) => m ? `${marca} ${m.modelo}`.slice(0, 22).toUpperCase() : marca === 'Genérica' ? '' : marca.toUpperCase(),
};
