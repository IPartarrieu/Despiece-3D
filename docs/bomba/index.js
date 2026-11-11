import { construir } from './modelo.js';

// Los pasos de desarme de cada modelo (data.json -> desarmados) traen qué piezas salen (quita) y cuáles se resaltan (foco).
const D = await (await fetch(new URL('data.json', import.meta.url))).json();
const porPaso = (m, campo) => Object.fromEntries((D.desarmados[m?.modelo] || D.desarmado).map(p => [p.paso, p[campo]]));

export default {
  id: 'bomba', nombre: 'Bomba', datos: new URL('data.json', import.meta.url), construir,
  // colores aproximados: Redbo naranja y negro según la foto de su ficha; Bercatti y Happy sin foto verificada
  color: { Bercatti: '#bfc5cc', Happy: '#2f6db5', Redbo: '#e8601c', Genérica: '#4f6f8f' },
  estilos: { Bercatti: { fundido: '#3a3f46' }, Happy: { color: '#2f6db5', fundido: '#2f6db5' }, Redbo: { color: '#e8601c' } },
  opciones: [], cfg0: {}, deModelo: () => ({}),
  nombreModelo: x => `${x.modelo} · ${x.tipo}`,
  ficha: m => m.ficha,   // cada dato con su fuente, en data.json
  resumen: () => '',
  aviso: 'Todos los modelos de bomba son REFERENCIALES: no hay despiece oficial con números de pieza de Bercatti, Happy ni Redbo. La arquitectura sale de documentos de equipos equivalentes: ficha del DRE0752 y manual Bercatti/Vielva SCM3 (sumergible), catálogo técnico Pedrollo CP (centrífuga CPm158; «pos. N CP» es la posición en su tabla de componentes, no un número de repuesto) y manual de servicio Loncin 165F/170F con el manual Honda WB30XT (motobomba). Aproximado: medidas internas, formas, colores y el orden de desarme del extremo bomba; cada ficha dice qué dato viene de dónde y lo que no tiene fuente queda «sin dato en las fuentes».',
  QUITA: m => porPaso(m, 'quita'),
  FOCO: m => porPaso(m, 'foco'),
  extra: {},
  vista: { pos: [46, 40, 96], tgt: [2, 16, 0] },
  etiqueta: (marca, m) => (m ? `${marca} ${m.modelo}`.toUpperCase() : marca.toUpperCase()),
};
