# Contrato de geometría · PC de torre (`pctorre`)

Guía para los agentes que dibujan las piezas y para el que escribe los datos. La lista de piezas está en `contrato.json`: **240 ids** en cinco módulos (caja 45, fuente 37, placa 66, cpu_memoria 38, gpu_almacenamiento 54). El contrato lo genera `scripts_datos/generar_contrato.py`; **no se edita a mano**. Si falta un id, sobra uno o hay que mover un anclaje, se cambia el generador y se vuelve a correr (o se avisa al coordinador).

Plataforma: torre ATX **referencial** con Core i9-12900K (LGA1700), chipset Z690, 2 × DDR5-4800 de 16 GB, gráfica clase RTX 4070 (AD104, 12 GB GDDR6X, conector 12V-2x6), SSD NVMe clase 990 PRO, SSD SATA de 2,5", disco de 3,5" y fuente ATX 3.x de 850 W modular. Fuentes en `contrato.json → fuentes`; cada pieza dice cuáles usa y si tiene algo supuesto (`supuesto: true`, con `nota`).

## Quién toca qué

La lista exacta de ids de cada módulo está en la cabecera de su archivo `modelo_<módulo>.js`, agrupada por subgrupo, y en `contrato.json` (filtrar `modulo`).

| Módulo | Ids | Archivo (el único que editas) | Qué dibuja | Marco principal |
|---|---|---|---|---|
| caja | 45 | `modelo_caja.js` | chasis, bandeja, separadores, cubierta de la fuente, jaula, paneles, filtros, panel frontal E/S, 4 ventiladores (el trasero despiezado) y los 12 cables | `caja` y `placa` |
| fuente | 37 | `modelo_fuente.js` | fuente completa: carcasa, ventilador, filtro EMI, puente, PFC, bulk, LLC, transformador, 5VSB, secundario, DC-DC, placa modular | `fuente` |
| placa | 66 | `modelo_placa.js` | PCB (con un corte de capas), zócalo e ILM, VRM (con un DrMOS abierto), chipset, zócalos DIMM, ranuras PCIe, M.2, SATA, headers, BIOS, CMOS, Super I/O, LAN, audio y panel E/S | `placa` |
| cpu_memoria | 38 | `modelo_cpu_memoria.js` | CPU (sustrato, contactos, die con 8 bloques y un núcleo P en detalle, STIM, IHS), pasta, disipador de torre y 2 módulos DDR5 | `placa` |
| gpu_almacenamiento | 54 | `modelo_gpu_almacenamiento.js` | tarjeta gráfica, SSD NVMe, SSD SATA y disco duro | `gpu`, `placa`, `ssd`, `hdd` |
| datos y Funciona | — | `data.json`, `vivo.js` | fichas, textos de pasos y etapas, capas animadas | — |

**No edites** `modelo.js`, `comun.js`, `index.js`, `contrato.json`, `../app.js` ni `../lib.js`. Si te falta un punto, defínelo dentro de tu módulo con `en(...)`. Lo que pertenece a otro módulo (por ejemplo, el extremo de un cable que entra en un conector de la placa) se lee del contrato con `pos(id)` o `L.<punto>`, nunca se dibuja dos veces.

## Convenciones

- Unidades en **cm**. +x hacia el frente de la caja, +y arriba, +z hacia el panel de vidrio. Suelo en y = 0; la caja ocupa x −22,5..22,5, y 0..48, z −10,75..10,75 (mid-tower de 45 × 48 × 21,5, supuesto).
- **Marcos locales** (`contrato.json → marcos`; en JS `en(marco, a, b, c)` devuelve un `Vector3` de mundo):
  - `placa`: a = u desde el borde trasero (0..24,38), b = v desde el borde superior (0..30,48), c = altura sobre la cara de componentes (z = −7,4). El PCB va de c = −0,157 a 0. Las ranuras ATX están en v = 17,0 + (k − 1) × 2,032 (k = 1..7, ATX 2.2).
  - `fuente`: a desde la cara trasera (0..16), b a lo ancho (±7,5), c **hacia abajo** desde la cara de componentes del PCB (0..8,3). La fuente va con el ventilador hacia abajo, así que el PCB queda arriba y los componentes cuelgan.
  - `gpu`: a desde el bracket (0..24,4), b desde la punta de los contactos hacia el vidrio (0..11,2), c hacia el lado del disipador (abajo); el backplate queda en c < 0. Los contactos x16 ocupan a = 5,05..13,95.
  - `hdd`: a desde el extremo de los conectores (0..14,7), b a lo ancho (±5,08), c desde la cara inferior (0..2,61). Husillo en a = 9,7, b = 0.
  - `ssd`: a desde el conector (0..10), b a lo alto (±3,49), c alejándose de la bandeja (0..0,7).
  - `caja`: el mundo tal cual.
- `cajaEn(marco, [a0, a1], [b0, b1], [c0, c1], material)` arma una caja alineada que ocupa ese rango local; sirve para casi todos los chips, conectores y PCB. `ejeDe(marco, 'c')` dice a qué eje del mundo apunta un eje local, para orientar `cil()` y `rev()` de `lib.js`.
- **Puntos compartidos** en `L` (`contrato.json → layout`): socket, cpu, dimm_a1..b2, atx24, eps1/eps2, pcie1..4, m2_1/m2_2, pch, sata, fpanel, usb3, usbc, audio_hdr, fan_cpu/fan_sys1/fan_sys2, io_escudo, gpu, gpu_12v, psu, psu_modular, psu_iec, hdd, hdd_conector, ssd, ssd_conector, vent_f1..f3, vent_t, io_frontal y los ojales de la bandeja (ojal_24p, ojal_eps, ojal_inf, ojal_sata) por donde pasan los cables.
- Cada pieza trae `anclaje` (en su marco), `pos` (el mismo punto en mundo, centro aproximado) y `explosion` (absoluta: la suma de la relativa de la pieza y la de sus padres en `padre`). Las explosiones son sugerencias: ajústalas si con la explosión completa una pieza tapa o atraviesa a otra, pero conserva la idea: las piezas hijas se separan poco (2 a 8 cm) de su padre, para que una unidad que sale en un paso de desarme (la GPU, la fuente) se vea agrupada y abierta.
- Las medidas conocidas vienen en las notas y fuentes: CPU 45 × 37,5 mm con sustrato de 1,116 mm y die de 0,37 mm (Intel 655258), zócalo a 2,7 mm de asiento con patrón de montaje de 78 × 78 mm, placa 305 × 244 mm, abertura E/S 158,75 × 44,45 mm a 3,81 mm bajo la cara de la placa, fuente de 150 × 86 mm, DIMM de 133,35 mm, M.2 de 22 × 80 mm, 2,5" de 100 × 69,85 × 7 mm, 3,5" de 147 × 101,6 × 26,1 mm (las dos últimas por verificar).

## Cómo registrar una pieza

```js
export default function (ctx) {
  const { V, cil, cajaEn, en, ejeDe, fundir, A, L, add, giros } = ctx;
  const chips = [0, 1, 2, 3, 4, 5].map(i => cajaEn('gpu', [6 + i * 1.3, 7.1 + i * 1.3], [9.2, 10.6], [0, 0.12], A.encapsulado()));
  const m = A.encapsulado();
  add('gpu_vram', [[fundir(chips, m)]]);                 // sin dirección: usa la explosión del contrato
  const its = add('gpu_vent_1', [[marco], [rotor]]);       // dos ítems: 0 = marco, 1 = rotor
  giros.push({ ids: ['gpu_vent_1:1'], e: V(0, 1, 0), c: en('gpu', 7, 5.6, 3.6), k: 2 });
  ctx.pendientes();                                        // siempre al final
}
```

- `add(id, [[objetos, dirExplosión?], ...], shell?)` registra la pieza; cada ítem explota por separado. Sin dirección usa `explosion` del contrato y sin `shell` usa el del contrato. Cada id usa **sus propios materiales** (`A.pcb()`, `A.oro()`...: llama la función en cada pieza), porque la app cambia la opacidad por pieza.
- `shell = true` en carcasas que tapan piezas (carcasa y tapa de la fuente, IHS, disipadores del VRM y del chipset, cubierta de la GPU, base y tapa del disco, carcasa del SSD, cubierta del panel E/S): con «Rayos X» quedan al 22 %. Ya viene marcado en el contrato.
- **Piezas que se mueven** en «Funciona»: `giros.push({ ids: ['id' o 'id:ítem'], e: eje unitario, c: centro, k: velocidad relativa })`. Llevan rotor como ítem 1: los ventiladores frontales, `cooler_ventilador`, `gpu_vent_1/2` y `psu_ventilador`. En el ventilador trasero el rotor es su propio id (`caja_vent_trasero_rotor`). Los platos del disco giran con `hdd_platos` y el ítem 1 de `hdd_husillo`. Arma todo en la pose de reposo y en coordenadas de mundo.
- Piezas didácticas: `mb_pcb_corte` (bloque de capas del PCB), `mb_vrm_detalle*` (la 16.ª etapa Vcore dibujada abierta: encapsulado, driver, MOSFET alto y bajo), `cpu_die_*` (bloques como baldosas finas sobre el die) y `cpu_pcore_*` (un núcleo P en 4 bloques). Van en su sitio real y se separan con la explosión; no inventes ubicaciones fuera de la caja.

## Recetas y rendimiento

- Helpers en `ctx`: de `lib.js` `cil`, `rev`, `rr`, `tornillo`, `rodamiento`, `lienzo`, `mat`; de `comun.js` `caja`, `cajaR`, `cajaEn`, `entre(p0, p1, r, m)`, `tubo(puntos, r, m)` (cables y heatpipes), `fundir(mallas, m)`, `en`, `ejeDe`, `pos(id)`, `L`, `A`.
- **Presupuesto** (la prueba falla si se pasa): caja 260 mallas, fuente 240, placa 380, cpu_memoria 220, gpu_almacenamiento 300; total 1400 mallas y 600 mil triángulos. Es lo que aguanta un teléfono a unos 30 cuadros por segundo con un material por pieza.
- **Repetidos**: usa `fundir` (una malla por material por ítem): 1700 contactos, aletas, pines de headers, chips de memoria, condensadores. **No uses `InstancedMesh`**: `Box3.expandByObject` de three r160 ignora las instancias, así que fallan la selección, el corte y la prueba. Para miles de detalles diminutos (los 1700 pads, las pistas) usa una textura de `lienzo`.
- Segmentos de cilindro: 24 o menos (12 en piezas de menos de 1 cm). Cables con `tubo` de 8 lados.

## Datos (`data.json`)

- `generar_contrato.py --datos` escribe un **esqueleto** solo si `data.json` no existe; desde ahí el agente de datos es su dueño. Trae el modelo `ATX-Z690`, los 23 pasos de desarme (`desarmados`), 6 procedimientos con `solo` (fuente, disco, GPU, CPU, DDR5, VRM y zócalo) y 11 etapas de `funcionamiento`, todo copiado de `contrato.json → recorridos` y `funcionamiento`.
- La ficha de cada pieza va en `piezas`, con el **nombre** del contrato como clave (la app busca por nombre): `funcion`, `como_se_desgasta`, `prueba`, `valor_esperado`, `cuando_cambiar`, `tip_taller`. Para un PC conviene poner en `tip_taller` cómo diagnosticarla (LED de diagnóstico, BIOS, software).
- Un paso o una etapa puede llevar `vista` (nombre de `index.js → vistas`) y `vidrio` (ids al 30 %). Una etapa con `giro: true` hace girar los ventiladores y los platos. Las `capas` que nombra cada etapa (ac, vsb, senal, dc12, dc5, vrm, spi, ddr, pcie, dmi, vram, calor, aire) las arma `vivo.js`.
- El orden real de **armado** está en `contrato.json → recorridos.ensamblado` (15 pasos, cada id entra una vez). La app hoy solo recorre desarmes; mientras no tenga modo ensamblado, el armado se lee recorriendo el desarme hacia atrás (ver PLAN.md).

## Prueba (obligatoria antes de entregar)

```
THREE_DIR=<paquete three@0.160.0> node docs/pctorre/prueba_modelo.mjs [--detalle] [--umbral 0.5]
```

Arma el modelo sin navegador y revisa: que estén los 240 ids y ninguno más, sin duplicados; que cada pieza tenga mallas con caja finita y quede dentro de la caja del PC (±1 cm; el cable AC está exento); choques groseros (dos piezas cuyas cajas envolventes comparten más del 50 % del volumen de la menor, sin contar placeholders, piezas `disperso`, `envuelve` o `shell`, ni padre con hijo); el presupuesto de mallas y triángulos; que los pasos, procedimientos, etapas y giros solo nombren ids y vistas existentes. Termina con un resumen que incluye los placeholders pendientes por módulo. **Al entregar, tu módulo debe tener 0 placeholders y la prueba debe pasar.**

Si la prueba marca un choque que es real en un PC (una tarjeta que tapa un header, por ejemplo) y no un error de dibujo, avísalo en tu informe en vez de mover la pieza.

Para conseguir three: `npm pack three@0.160.0 && tar xzf three-0.160.0.tgz` en una carpeta fuera del proyecto. Sin `THREE_DIR` la prueba usa la copia del scratchpad de esta sesión.
