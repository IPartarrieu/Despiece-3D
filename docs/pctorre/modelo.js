// PC de torre ATX REFERENCIAL (Core i9-12900K / Z690 / DDR5 / RTX 4070 / NVMe / SATA / HDD / fuente ATX 3.x).
// Orquestador: arma el ctx común y llama a los cinco módulos (uno por agente, ver CONTRATO.md). No dibuja piezas.
import * as THREE from 'three';
import * as lib from '../lib.js';
import * as comun from './comun.js';
import { capas as capasVivo } from './vivo.js';
import caja from './modelo_caja.js';
import fuente from './modelo_fuente.js';
import placa from './modelo_placa.js';
import cpu_memoria from './modelo_cpu_memoria.js';
import gpu_almacenamiento from './modelo_gpu_almacenamiento.js';

const MODULOS = { caja, fuente, placa, cpu_memoria, gpu_almacenamiento };

export function construir(cfg) {
  const { parts, add } = comun.armador();
  // vivo: giros [{ids:['id' | 'id:item'], e: eje Vector3 unitario, c: centro Vector3, k: velocidad relativa}],
  // mover [{ids, eje: Vector3, f: anim => desplazamiento}], capas {nombre: Group} (las arma vivo.js)
  const giros = [], mover = [];
  const ctx = { THREE, ...lib, ...comun, cfg, m: cfg.m, add, parts, giros, mover };
  for (const [modulo, f] of Object.entries(MODULOS)) {
    const piezas = comun.CONTRATO.piezas.filter(p => p.modulo === modulo);
    f({ ...ctx, modulo, piezas, pendientes: () => pendientes(piezas) });
  }
  return { parts, vivo: { capas: capasVivo(ctx), giros, mover } };

  // placeholder: cubo magenta de 0,6 cm en el anclaje de cada id del módulo que aún no tiene geometría
  function pendientes(piezas) {
    for (const e of piezas) if (!parts[e.id]) {
      const o = comun.caja(0.6, 0.6, 0.6, ...e.pos, lib.mat('#ff00ff')); o.userData.placeholder = true;
      add(e.id, [[o]]);
    }
  }
}
