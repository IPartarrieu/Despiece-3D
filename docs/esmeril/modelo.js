// Despacha al modelo 3D del equipo elegido. Solo se modelan equipos con despiece oficial completo.
import { ga4530 } from './ga4530.js';
import { m18fuel } from './m18fuel.js';

const MODELOS = { GA4530: ga4530, 'M18 FUEL 2880-20': m18fuel };
export const construir = cfg => (MODELOS[cfg.m?.modelo] || ga4530)(cfg);
