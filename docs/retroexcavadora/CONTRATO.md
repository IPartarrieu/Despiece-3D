# Contrato de geometría · retroexcavadora

Guía para los tres agentes que dibujan las piezas nuevas de la auditoría del 2026-11-18. La lista de piezas está en `contrato.json`: 144 entradas, que dan 154 ids (motor 56, transmisión 40, hidráulica 58). Por modelo aplican 148 a 151.

## Quién toca qué

| Módulo | Archivo (único que puedes editar) | Piezas existentes que construye | Piezas nuevas |
|---|---|---|---|
| motor | `modelo_motor.js` | motor, radiador, ventilador, filtro_aire, escape, bateria, tanque_comb | bloque y tren alternativo, culata y distribución, lubricación, enfriamiento, admisión y escape, combustible, alternador, arranque y arnés |
| transmision | `modelo_transmision.js` | convertidor, transmision, cardan_del, cardan_tras, eje_del, eje_tras, chasis, cabina, mandos | convertidor y caja, cardanes, ejes y mandos finales, frenos, dirección, cabina, contrapeso y luces |
| hidraulica | `modelo_hidraulica.js` | tanque_hid, filtro_hid, bomba_hid, valvula_cargador, valvula_retro, cuchara_cargador, cuchara_retro, cil_* (8 ids), mangueras, pasadores | bomba y acople, cilindros con sus sellos, pasadores y bujes, cargador y puntal, dientes |

**No edites** `modelo.js`, `comun.js`, `vivo.js`, `index.js`, `app.js`, `lib.js`, `data.json` ni `contrato.json`. Si te falta un punto del layout, defínelo dentro de tu módulo. Si te falta un id o hay que cambiar un nombre, avísale al coordinador en tu informe. Las piezas existentes conservan su id. Lo que una pieza nueva saca de una existente (campo `extrae_de`) lo quitas de la lista de esa pieza en tu propio archivo; por eso cada pieza existente vive en el módulo que la despieza.

## Convenciones

- Unidades en **cm**. +x apunta hacia el cargador (adelante), +y hacia arriba y +z al lado derecho del operador. El suelo está en y = 0 y el eje trasero en x = 0.
- Motor: el eje del cigüeñal va en `y = yC` (104). El volante queda atrás (`mX0`, `L.volanteM`) y la polea adelante (`mX1`, `L.polea`). Los cilindros van del 1 (adelante) al 4, con paso `lm/4` entre `mX0 + 20` y `mX1 - 14`. `xcM` es el centro del bloque y `kM`, la escala de altura (1,08 en los motores de 4,4 L o más). **No hay camisas**: los cilindros están integrados al bloque.
- Bandas en x a lo largo del eje del cigüeñal (cotas aproximadas, sirven para no chocar entre módulos): placa flexible cerca de `mX0 - 4` (transmisión); volante entre `mX0 - 2` y `mX0 + 4`; caja del volante entre `mX0 + 2` y `mX0 + 14`; polea entre `mX1 - 6` y `mX1 + 2`; acople entre `mX1 + 2` y `mX1 + 5`; bomba hidráulica entre `mX1 + 5` y `mX1 + 17`, con radio de 6 o menos.
- **H1, ya corregido en el layout:** `L.bomba` va adelante, en el eje del cigüeñal (antes estaba atrás, bajo el convertidor). El ventilador subió al eje de la bomba de agua (`K.fanC.y = L.bombaAgua.y = yC + 30`). Pendientes: motor sube el radiador y abre la carcasa del ventilador para que no corte la bomba; transmisión rebaja el travesaño superior delantero del chasis; hidráulica rehace las mangueras de la bomba.
- **H2:** es un tema de datos. `contrato.json → recorridos.maquina` trae el orden real: primero sale el motor (paso 23) y después la transmisión (paso 24).
- Modelo actual: `ctx.m.modelo` («580N», «580 Super N», «420F2», «3CX»), `ctx.clave` («580N», «580SN», «420F2», «3CX») y medidas en `ctx.D` (`D.motorL`, `D.rtr`, `D.wb`…). Una pieza con `aplica` limitado ni siquiera llega a `ctx.piezas` en los otros modelos.

## Cómo registrar una pieza

```js
export default function (ctx) {
  const { V, mat, entre, caja, rev, fundir, A, L, K, D, add, liga, ligar } = ctx;
  const ac = mat('#8b9198', { metalness: 0.7, roughness: 0.35 });          // materiales propios de cada pieza: no compartir entre ids
  const its = add('cig_polea', [[[rev([[3, -4], [13, -4], [13, 4], [3, 4]], 'x', ac, 32, L.polea.x - 2, L.polea.y, 0)], V(90, 0, -60)]]);
  // add(id, [[objetos, dirExplosión], ...], shell): un item por grupo que explota distinto; devuelve los items
  ctx.pendientes();   // siempre al final: cubos magenta para los ids que aún no dibujaste
}
```

- `ctx.piezas` trae las entradas del contrato de tu módulo que aplican al modelo actual (`id`, `nombre`, `anclaje`, `offset`, `explosion`, `extrae_de`, `nota`). `ctx.punto(anclaje, offset)` devuelve el punto de anclaje como `Vector3`.
- Las direcciones de explosión del contrato son una sugerencia: ajústalas para que, con la explosión completa, la pieza quede a la vista y no choque con otra.
- **Shell** (tercer argumento `true`): úsalo en carcasas que tapan piezas internas, como la caja del volante, la campana, las carcasas de la transmisión y de los ejes o el cuerpo de la bomba. Con «Rayos X» la app las deja con opacidad 0,22.
- **Motor transparente:** `motor` (el bloque) ya se registra con `shell = true`. Con «Rayos X» se ve el tren alternativo, y en «Funciona» una etapa puede pedir `vidrio: ["motor"]` (opacidad 0,3). Para verlo así en un paso de desarme hace falta un `vidrio` por paso en app.js. Lo hará el agente de datos y app, no tú.
- **Partes que se mueven en «Funciona»:** con `liga(items, cuerpos)` o `ligar.push([item, 'cuerpo'])`. Los cuerpos son fijo, arm, bkt, sw, boom, dip, bk, lg, lb, J, stI, stD, padI, padD, rTI, rTD, rDI, rDD, knI, knD, steerRod, cardD, cardT, fan y seat (los define `vivo.js → cuerpos`). Arma la geometría en la pose neutra y en coordenadas de mundo.
- **Cilindros (hidráulica):** cada `cils[k]` trae `camExtra` y `vasExtra`, dos listas de items. `vivo.js` mueve los de `camExtra` con la camisa (cabezal, sellos, bujes) y los de `vasExtra` con el vástago (vástago y pistón). Si `cil_X_vastago` pasa a ser una pieza propia, `cils[k].vas` debe apuntar a su item. La copia extendida de `cilindro()` va en tu módulo.

## Recetas (helpers en `ctx`)

- `lib.js`: `cil(ax, rT, rB, h, x, y, z, m)`, `rev(perfil[[r, a]], ax, m, seg, x, y, z)` (sólido de revolución: pistón, polea, volante, retén, cubo, disco), `rodamiento(eje, ro, ri, w, x, y, z)`, `tornillo`, `rr`.
- `comun.js`: `entre(p0, p1, r, m, seg)` (cilindro entre dos puntos: biela, varilla, eje), `caja`, `cajaR` (caja con cantos redondeados), `placa(poly, esp, m, z0)`, `chapa`, `tubo(pts, r, m)` (manguera o tubería), `pasador`, `fundir(mallas, m)` (junta mallas de un mismo material en una sola; úsalo en dientes, aletas, bulones y discos repetidos) y `cilindro()`. Acabados en `A`: `pintura`, `oscuro`, `cromo`, `fundicion`, `goma`, `manguera`, `vidrio`.
- Retén: un anillo con `rev([[ri, -w/2], [ro, -w/2], [ro, w/2], [ri, w/2]], eje, A.goma())`, o un `TorusGeometry` delgado. Engranaje: cilindro más N dientes (`caja`) unidos con `fundir`. Cigüeñal: muñequillas a 180° (1 y 4 arriba, 2 y 3 abajo), contrapesos y bancadas fundidos en 1 o 2 mallas. Planetario: sol, 3 satélites, corona (`rev`) y portasatélites.
- Patrones ya resueltos en el visor: `sonda/gasolina.js` y `bomba/wp30a.js` (pistón, biela, cigüeñal, volante y retenes de un motor de 1 cilindro).
- Presupuesto: segmentos de 24 o menos y alrededor de 600 mallas nuevas por módulo como máximo. Hoy el modelo completo tiene unas 490 mallas.

## Prueba (obligatoria antes de entregar)

```
THREE_DIR=<carpeta del paquete three@0.160.0> node docs/retroexcavadora/prueba_modelo.mjs [--detalle] [--max-dist 150]
```

La prueba arma los 4 modelos sin DOM ni WebGL y revisa cuatro cosas: que estén los 47 ids existentes y todos los del contrato que aplican, que no se registren ids que no aplican ni duplicados, que cada pieza tenga al menos una malla con caja finita y no vacía, y que ninguna pieza nueva quede a más de 150 cm del chasis. Termina con un resumen por modelo que incluye cuántos placeholders siguen pendientes. Al entregar, tu módulo debe tener 0 placeholders propios.

Para conseguir three: `npm pack three@0.160.0 && tar xzf three-0.160.0.tgz` en una carpeta fuera del proyecto, y usar `THREE_DIR=<esa carpeta>/package`. No lo agregues al proyecto.
