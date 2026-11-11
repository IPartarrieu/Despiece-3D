// Despacha al modelo 3D elegido. Todos son REFERENCIALES (ver aviso en index.js).
import { gasolina } from './gasolina.js';
import { alta } from './alta.js';

export const construir = cfg => (cfg.m?.modelo === 'AF45' ? alta : gasolina)(cfg);
