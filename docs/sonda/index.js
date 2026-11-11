import { construir } from './modelo.js';

// Pasos de desarme de cada modelo (data.json -> desarmados): traen qué piezas salen (quita) y cuáles se resaltan (foco).
const D = await (await fetch(new URL('data.json', import.meta.url))).json();
const porPaso = (m, campo) => Object.fromEntries((D.desarmados[m?.modelo] || D.desarmado).map(p => [p.paso, p[campo]]));

export default {
  id: 'sonda', nombre: 'Sonda vibradora', datos: new URL('data.json', import.meta.url), construir,
  // colores sin fuente (no hay fotos ni fichas de los equipos de GMW): aproximados
  color: { 'GMW (referencial)': '#c8452f', Genérica: '#c8452f' },
  estilos: {},
  opciones: [], cfg0: {}, deModelo: () => ({}),
  nombreModelo: x => x.nombre,
  ficha: m => m.ficha,
  resumen: () => '',
  aviso: D.aviso,
  QUITA: m => porPaso(m, 'quita'),
  FOCO: m => porPaso(m, 'foco'),
  extra: {},
  vista: { pos: [34, 30, 132], tgt: [16, -12, 0] },
  etiqueta: (marca, m) => (m ? m.modelo : marca),
};
