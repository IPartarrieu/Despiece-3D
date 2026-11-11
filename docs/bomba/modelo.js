// Despacha al modelo 3D de la bomba elegida. Los tres son REFERENCIALES (sin despiece oficial con números de pieza).
import { dre0753 } from './dre0753.js';
import { cym158 } from './cym158.js';
import { wp30a } from './wp30a.js';

const MODELOS = { DRE0753: dre0753, CYM158: cym158, 'WP-30A': wp30a };
export const construir = cfg => (MODELOS[cfg.m?.modelo] || dre0753)(cfg);
