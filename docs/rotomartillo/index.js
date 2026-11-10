import { construir } from './modelo.js';

// Los pasos de desarme de cada modelo (data.json -> desarmados) traen qué piezas salen (quita) y cuáles se resaltan (foco):
// QUITA y FOCO se arman desde ahí, así quedan alineados con los pasos por construcción.
const D = await (await fetch(new URL('data.json', import.meta.url))).json();
const porPaso = (m, campo) => Object.fromEntries((D.desarmados[m?.modelo] || D.desarmado).map(p => [p.paso, p[campo]]));
const n = (v, u) => (v == null ? 'sin dato en las fuentes' : `${String(v).replace('.', ',')}${u ? ' ' + u : ''}`);

export default {
  id: 'rotomartillo', nombre: 'Rotomartillo', datos: new URL('data.json', import.meta.url), construir,
  // turquesa Makita: color de marca (el documento de servicio y el manual son en blanco y negro; mismo tono que el esmeril GA4530);
  // Kothman RK-26: negro con el respaldo del mango rojo, según las fotos de kothman.cl
  color: { Makita: '#1595a0', Kothman: '#26282b', Genérica: '#4f6f8f' },
  estilos: {
    Makita: { color: '#1595a0', negro: '#1d1f22', logo: 'makita' },
    Kothman: { color: '#26282b', negro: '#121315', acento: '#c8202a', logo: 'KOTHMAN', fuente: '84px' },
  },
  opciones: [], cfg0: {}, deModelo: () => ({}),
  nombreModelo: x => `${x.modelo} · ${x.modos} modos${x.avt ? ' · AVT' : ''}`,
  ficha: m => [['Modelo', `${m.marca} ${m.modelo}`], ['Portaherramienta', m.porta], ['Capacidad en concreto', n(m.capacidad, 'mm')], ['Potencia', n(m.potencia, 'W')],
    ['Velocidad', n(m.rpm, 'rpm')], ['Golpes', n(m.golpes, '/min')], ['Energía de impacto', n(m.energia, 'J')], ['Peso', n(m.peso, 'kg')], ['Largo', n(m.largo, 'mm')],
    ['Modos', m.modos], ['Antivibración', m.avt ? 'AVT (contrapeso)' : 'No']],
  resumen: () => '',
  aviso: 'HR2600 y HR2601: exactos según el Technical Information de Makita (13 págs.): piezas y números de la vista explosionada Fig. 1, orden y sentido del desarme ([3]-1 a [3]-9), herramientas 1R y medidas externas 361 x 77 x 209 mm. Aproximado: medidas internas, formas finas y colores. Las piezas sin número en la Fig. 1 llevan el nombre del texto. HR2470 y Kothman RK26 son referenciales: se dibujan con la arquitectura del HR2600 y sus números de pieza; solo los datos de su ficha vienen de sus propias fuentes.',
  QUITA: m => porPaso(m, 'quita'),
  FOCO: m => porPaso(m, 'foco'),
  extra: {},
  vista: { pos: [-6, 6, 62], tgt: [-1, -6, 0] },
  etiqueta: (marca, m) => (m ? `${marca} ${m.modelo}`.toUpperCase() : marca.toUpperCase()),
};
