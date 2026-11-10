import { construir } from './modelo.js';

export default {
  id: 'esmeril', nombre: 'Esmeril angular', datos: new URL('data.json', import.meta.url), construir,
  // colores referenciales por marca (no son medidas ni fichas oficiales)
  color: { Makita: '#00909e', Bosch: '#1e6fb5', DeWalt: '#f5c518', Milwaukee: '#d71f26', Hilti: '#d2051e', 'Black+Decker': '#f26b21', Stanley: '#f9c80e', Kothman: '#e0662a', Genérica: '#4f6f8f' },
  // Estilo por marca. Solo se fijó lo que las fichas o fotos respaldan (colores de marca, cabezal plano de Bosch GWS 7-115 y DeWalt, cuerpo
  // amarillo de DeWalt, rojo y negro de Milwaukee, ajuste sin llave y mango rotable en Hilti); el resto es una aproximación genérica.
  estilos: {
    Genérica: { color: '#4f6f8f' },
    Makita: { color: '#00909e', c2: '#26292d', cabezal: 'metal', forma: 'redondo', agarre: 'banda', grosor: 0.96 },
    Bosch: { color: '#1e6fb5', c2: '#23272c', cabezal: 'color', forma: 'plano', agarre: 'banda', ventilas: 'ambas' },
    DeWalt: { color: '#f5c518', c2: '#1d1f22', cabezal: 'color', forma: 'plano', agarre: 'total', cola: 'goma' },
    Milwaukee: { color: '#d71f26', c2: '#1d1f22', cabezal: 'metal', forma: 'cuadrado', agarre: 'total', ventilas: 'ambas' },
    Hilti: { color: '#d2051e', c2: '#2b2e33', cabezal: 'color', forma: 'redondo', agarre: 'banda', grosor: 1.1, sinllave: true },
    'Black+Decker': { color: '#f26b21', c2: '#1d1f22', cabezal: 'color', forma: 'redondo', agarre: 'ninguno', cola: 'goma' },
    Stanley: { color: '#f9c80e', c2: '#1d1f22', cabezal: 'metal', forma: 'redondo', agarre: 'ninguno', cola: 'goma' },
    Kothman: { color: '#e0662a', c2: '#26292d', cabezal: 'metal', forma: 'redondo', agarre: 'banda' },
  },
  opciones: [
    { k: 'disco', titulo: 'Diámetro del disco', ops: [[115, '115 mm', '4½"'], [125, '125 mm', '5"'], [180, '180 mm', '7"'], [230, '230 mm', '9"']] },
    { k: 'bateria', titulo: 'Alimentación', ops: [[0, 'Cable', 'con escobillas'], [1, 'Batería', 'sin escobillas']] },
    { k: 'gatillo', titulo: 'Interruptor', ops: [[0, 'Paleta'], [1, 'Gatillo']] },
  ],
  cfg0: { disco: 115, bateria: 0, gatillo: 0 },
  // el interruptor sale de la ficha; estos dos modelos no lo traen en los datos pero las fichas del fabricante los muestran con gatillo
  deModelo: m => ({ disco: m.disco, bateria: m.bateria ? 1 : 0, gatillo: /gatillo/i.test(m.interruptor || '') || ['AG 230-24D', 'DWE4557'].includes(m.modelo) ? 1 : 0 }),
  ficha: m => [['Modelo', `${m.marca} ${m.modelo}`], ['Disco', `${m.disco} mm`], ['Potencia', `${m.potencia ?? '—'} W`], ['Velocidad', `${m.rpm ?? '—'} rpm`], ['Peso', `${m.peso ?? '—'} kg`], ['Rosca', m.rosca ?? '—']],
  nombreModelo: x => `${x.modelo} · ${x.disco} mm`,
  resumen: cfg => `Configuración personalizada de ${cfg.disco} mm.`,
  aviso: 'El modelo 3D es esquemático. El modelo elegido define el diámetro del disco, el interruptor, la alimentación y el grosor del cuerpo (según su potencia); la marca define colores, forma del cabezal y agarres de forma aproximada, no como réplica exacta.',
  // pasos del desarme (data.desarmado) -> piezas que salen y piezas que se resaltan
  QUITA: { 1: ['cable', 'bateria'], 3: ['tuerca', 'disco'], 4: ['brida_int', 'protector'], 5: ['mango'], 6: ['escobillas'], 10: ['carcasa'], 11: ['interruptor', 'estator'], 12: ['inducido', 'ventilador', 'colector'], 13: ['pinon', 'rodamientos'], 15: ['husillo', 'corona', 'boton'] },
  FOCO: { 7: ['escobillas'], 8: ['escobillas', 'interruptor'], 9: ['cabezal'], 14: ['rodamientos'] },
  extra: { bateria: { funcion: 'Entrega la energía; reemplaza al cable y a las escobillas (motor sin escobillas).', como_se_desgasta: 'Pierde capacidad con los ciclos de carga y el calor.', prueba: 'Medir el voltaje en reposo y bajo carga; revisar los contactos.', valor_esperado: null, cuando_cambiar: 'Si se descarga muy rápido, se hincha o se calienta al cargar.', tip_taller: null } },
  vista: { pos: [16, 14, 30], tgt: [-6, 1.5, 0] },
  etiqueta: (marca, m) => m ? `${marca} ${m.modelo}`.slice(0, 26).toUpperCase() : marca === 'Genérica' ? '' : marca.toUpperCase(),
};
