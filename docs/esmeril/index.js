import { construir } from './modelo.js';

export default {
  id: 'esmeril', nombre: 'Esmeril angular', datos: new URL('data.json', import.meta.url), construir,
  // colores referenciales por marca (no son medidas ni fichas oficiales)
  color: { Makita: '#00909e', Bosch: '#1e6fb5', DeWalt: '#f5c518', Milwaukee: '#d71f26', Hilti: '#d2051e', 'Black+Decker': '#f26b21', Stanley: '#f9c80e', Kothman: '#e0662a', Genérica: '#4f6f8f' },
  opciones: [
    { k: 'disco', titulo: 'Diámetro del disco', ops: [[115, '115 mm', '4½"'], [125, '125 mm', '5"'], [180, '180 mm', '7"'], [230, '230 mm', '9"']] },
    { k: 'bateria', titulo: 'Alimentación', ops: [[0, 'Cable', 'con escobillas'], [1, 'Batería', 'sin escobillas']] },
    { k: 'gatillo', titulo: 'Interruptor', ops: [[0, 'Paleta'], [1, 'Gatillo']] },
  ],
  cfg0: { disco: 115, bateria: 0, gatillo: 0 },
  deModelo: m => ({ disco: m.disco, bateria: m.bateria ? 1 : 0, gatillo: /gatillo/i.test(m.interruptor || '') ? 1 : 0 }),
  ficha: m => [['Modelo', `${m.marca} ${m.modelo}`], ['Disco', `${m.disco} mm`], ['Potencia', `${m.potencia ?? '—'} W`], ['Velocidad', `${m.rpm ?? '—'} rpm`], ['Peso', `${m.peso ?? '—'} kg`], ['Rosca', m.rosca ?? '—']],
  nombreModelo: x => `${x.modelo} · ${x.disco} mm`,
  resumen: cfg => `Configuración personalizada de ${cfg.disco} mm.`,
  aviso: 'El modelo 3D es esquemático: las piezas y su disposición son las del esmeril angular típico; las proporciones se escalan con el diámetro y los colores de marca son referenciales.',
  // pasos del desarme (data.desarmado) -> piezas que salen y piezas que se resaltan
  QUITA: { 1: ['cable', 'bateria'], 3: ['tuerca', 'disco'], 4: ['brida_int', 'protector'], 5: ['mango'], 6: ['escobillas'], 10: ['carcasa'], 11: ['interruptor', 'estator'], 12: ['inducido', 'ventilador', 'colector'], 13: ['pinon', 'rodamientos'], 15: ['husillo', 'corona', 'boton'] },
  FOCO: { 7: ['escobillas'], 8: ['escobillas', 'interruptor'], 9: ['cabezal'], 14: ['rodamientos'] },
  extra: { bateria: { funcion: 'Entrega la energía; reemplaza al cable y a las escobillas (motor sin escobillas).', como_se_desgasta: 'Pierde capacidad con los ciclos de carga y el calor.', prueba: 'Medir el voltaje en reposo y bajo carga; revisar los contactos.', valor_esperado: null, cuando_cambiar: 'Si se descarga muy rápido, se hincha o se calienta al cargar.', tip_taller: null } },
  vista: { pos: [16, 14, 30], tgt: [-6, 1.5, 0] },
  etiqueta: (marca, m) => m ? `${marca} ${m.modelo}`.slice(0, 26).toUpperCase() : marca === 'Genérica' ? '' : marca.toUpperCase(),
};
