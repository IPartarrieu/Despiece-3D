import { construir } from './modelo.js';

// Pasos de desarme de cada modelo (data.json -> desarmados): traen qué piezas salen (quita) y cuáles se resaltan (foco).
const D = await (await fetch(new URL('data.json', import.meta.url))).json();
const porPaso = (m, campo) => Object.fromEntries((D.desarmados[m?.modelo] || D.desarmado).map(p => [p.paso, p[campo]]));

export default {
  id: 'telurometro', nombre: 'Telurómetro', datos: new URL('data.json', import.meta.url), construir,
  // colores según las fotos e ilustraciones de los manuales (parte_b -> recomendacion_visor): aproximados
  color: { Genérica: '#f2c200' },
  estilos: {
    Megger: { funda: '#1c1d20', frente: '#c9ccc8', trasera: '#b4b7b3', selector: '#1b1c1f', test: '#2b2c2f', tecla: '#2b2c2f', texto: '#1b1c1f', logo: [0.6, 0.05] },
    Fluke: { funda: '#f2c200', frente: '#3a3e44', trasera: '#45494f', selector: '#2a2c30', test: '#3d78c4', tecla: '#3d78c4', texto: '#f5f5f5', logo: [0.32, 0.03], lcd: '#a9b59a' },
    Kyoritsu: { funda: '#2b2d31', frente: '#c7cacd', trasera: '#a9adb1', selector: '#1b1c1f', test: '#c8302b', tecla: '#3a3d42', texto: '#1b1c1f', logo: [0.08, 0.035], lcd: '#b9c7a8' },
  },
  opciones: [], cfg0: {}, deModelo: () => ({}),
  nombreModelo: x => x.nombre,
  ficha: m => m.ficha,
  resumen: () => '',
  aviso: D.aviso,
  QUITA: m => porPaso(m, 'quita'),
  FOCO: m => porPaso(m, 'foco'),
  extra: {},
  vista: { pos: [52, 34, 74], tgt: [-3, 2, 0] },
  // vistas del modo Funciona (data.json -> funcionamiento[].vista): el terreno es una escena auxiliar a la derecha del equipo
  vistas: { terreno: { pos: [60, 34, 200], tgt: [58, 2, 0] }, equipo: { pos: [12, 16, 62], tgt: [4, 5, 0] }, norma: { pos: [16, 4, 66], tgt: [9, 0, 0] } },
  etiqueta: (marca, m) => (m ? m.modelo : marca),
};
