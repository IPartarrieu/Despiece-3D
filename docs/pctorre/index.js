import { construir } from './modelo.js';

// PC de torre ATX referencial. Pasos de desarme por modelo (data.json -> desarmados): qué sale (quita) y qué se resalta (foco).
const D = await (await fetch(new URL('data.json', import.meta.url))).json();
const pasos = m => D.desarmados?.[m?.modelo] || D.desarmado || [];
const porPaso = (m, campo) => Object.fromEntries(pasos(m).map(p => [p.paso, p[campo]]));
const VISTA = { pos: [55, 40, 70], tgt: [0, 24, 0] };   // 3/4 delantera desde el lado del vidrio; la distancia fija el zoom mínimo (≈ 11 cm)

export default {
  id: 'pctorre', nombre: 'PC de torre', datos: new URL('data.json', import.meta.url), construir,
  color: { Genérica: '#2b2e33', Referencial: '#2b2e33' },
  estilos: {},
  opciones: [], cfg0: {}, deModelo: () => ({}),
  nombreModelo: x => x.nombre || x.modelo,
  ficha: m => m.ficha || [],
  resumen: () => '',
  aviso: D.aviso,
  QUITA: m => porPaso(m, 'quita'),
  FOCO: m => porPaso(m, 'foco'),
  extra: {},
  vista: VISTA,
  zoomMin: 2.5,   // se puede acercar hasta el die (2 cm)
  // vistas de pasos (data.json -> desarmados[].vista) y de etapas de «Funciona» (funcionamiento[].vista); objetivos en cm de mundo
  vistas: {
    general: VISTA,
    interior: { pos: [20, 34, 62], tgt: [-8, 28, -5] },
    trasera: { pos: [-80, 35, 40], tgt: [-20, 24, 0] },
    trasera_bandeja: { pos: [20, 32, -55], tgt: [12, 30, -9] },
    frontal: { pos: [70, 60, 40], tgt: [18, 42, 0] },
    fuente: { pos: [-2, -14, 42], tgt: [-14, 6, 0] },
    placa: { pos: [10, 34, 55], tgt: [-9.4, 30, -7] },
    placa_inferior: { pos: [5, 8, 40], tgt: [-5, 17, -7] },
    vrm: { pos: [2, 50, 24], tgt: [-11, 38, -7] },
    socket: { pos: [-3, 44, 16], tgt: [-9.1, 36, -6.8] },
    cpu: { pos: [-3, 44, 16], tgt: [-9.1, 36, -6.8] },
    ram: { pos: [10, 44, 22], tgt: [-2, 36.4, -5] },
    m2: { pos: [-4, 38, 16], tgt: [-12, 30.4, -6.8] },
    gpu: { pos: [12, 8, 50], tgt: [-10, 26, -2] },
    almacenamiento: { pos: [30, 14, 50], tgt: [10.8, 4, 1] },
  },
  etiqueta: (marca, m) => (m ? m.modelo : marca),
};
