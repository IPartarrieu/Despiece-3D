# PC de torre · plan pedagógico

Objetivo: entender cómo se construye un computador de escritorio desde el sistema completo hasta el silicio, y dejar trazado el camino para diseñar uno propio. El visor recorre cuatro niveles: **sistema** (la torre) → **módulo** (fuente, placa, CPU, GPU, discos) → **componente** (VRM, chipset, zócalo, DIMM) → **subcomponente** (die y sus bloques, MOSFET, bobina, chip DRAM, PMIC, contactos). Cada pieza del contrato trae su `nivel`, su `padre` y sus fuentes.

El modelo es **referencial**: usa una plataforma con documentación pública (Intel LGA1700 + Z690, ATX 2.2 y la guía de fuentes ATX 3) y no copia un producto comercial. Se eligió Intel y no AM5 porque Intel publica el datasheet del CPU (655258), el del chipset (648364) y la guía de fuentes (336521); AMD entrega los equivalentes de AM5 solo bajo NDA.

## 1. Ensamblado paso a paso (orden real de armado)

Está en `contrato.json → recorridos.ensamblado` (15 pasos, cada pieza entra una sola vez). Resumen:

1. **Preparar la caja.** Contar los separadores y compararlos con los 9 agujeros ATX (A C F G H J K L M). Un separador de más hace cortocircuito con el reverso de la placa.
2. **Frontal, filtros, panel E/S y ventiladores.** Frontales como entrada y trasero como salida: presión levemente positiva para que el polvo entre solo por los filtros.
3. **Placa madre sobre la mesa**, sobre su caja de cartón (la bolsa antiestática conduce por fuera).
4. **CPU.** Abrir el ILM, alinear el triángulo dorado y las muescas, apoyar sin deslizar, cerrar. La tapa PnP salta sola. Es el paso donde se dañan zócalos.
5. **SSD NVMe** en el M.2 de la CPU (PCIe 4.0 x4 directo, sin pasar por el chipset). Quitar el film de la almohadilla del disipador.
6. **Memoria** en A2 y B2 (doble canal). En DDR5 cada módulo tiene dos subcanales de 32 bits; con dos módulos el controlador usa 4 subcanales.
7. **Disipador.** Contraplaca, soporte, pasta del tamaño de una arveja, apriete en cruz. Ventilador soplando hacia atrás.
8. **Fuente** con el ventilador hacia abajo; conectar solo los cables modulares que se usarán.
9. **Placa en la caja.** Pasar antes los EPS por el ojal superior; panel E/S en su escudo; 9 tornillos sin forzar.
10. **Alimentación de la placa:** 24 pines y dos EPS de 8 (no confundir un EPS con un PCIe de 8: llevan 12 V en pines distintos).
11. **Panel frontal y ventiladores:** F_PANEL según el manual (PWR, RESET, LED+/−), USB 3, USB-C, audio, ventiladores PWM.
12. **Tarjeta gráfica:** quitar dos tapas, insertar hasta la traba, atornillar, 12V-2x6 hasta el fondo (un 12VHPWR mal insertado es la causa conocida de conectores derretidos).
13. **Almacenamiento SATA:** SSD detrás de la bandeja y disco en la jaula; datos a la placa y poder a la fuente.
14. **Primer encendido con la caja abierta:** monitor en la tarjeta gráfica; los LED de diagnóstico se apagan en orden CPU → DRAM → VGA → BOOT.
15. **Ordenar cables y cerrar.**

El desarme principal (23 pasos en `data.json → desarmados`) es el mismo recorrido al revés, con las precauciones de servicio (desenchufar, descargar estática, girar el disipador antes de levantarlo, no abrir la fuente).

**Pendiente de la app:** hoy el visor solo recorre desarmes (cada paso suma piezas a la lista de «quitadas»). Para mostrar el armado de verdad bastaría un procedimiento con `ensamblar: true` en el que las piezas partan explotadas y cada paso las vaya «poniendo» (complemento de `quitadas()` en app.js, unas tres líneas). Se deja para cuando el coordinador lo autorice; los datos (`pone`) ya están.

Procedimientos secundarios (con `solo`, en `recorridos.procedimientos`): fuente por dentro, disco duro por dentro, tarjeta gráfica por dentro, CPU por dentro (corte didáctico), módulo DDR5 por dentro, VRM y zócalo.

## 2. Etapas de «Funciona»

En `contrato.json → funcionamiento` (11 etapas, copiadas a `data.json`). Capas que arma `vivo.js`: `ac` (red, rojo), `vsb` (standby, violeta), `senal` (PS_ON#, PWR_OK, reset, gris), `dc12` (amarillo), `dc5` (5 V rojo y 3,3 V naranjo, los colores del cable), `vrm` (fases desfasadas), `spi`, `ddr`, `pcie`, `dmi`, `vram`, `calor` (de rojo a azul) y `aire` (flechas).

1. **En reposo: 5VSB.** Red → filtro EMI → puente → flyback del standby → pin 9 (morado) → PCH y Super I/O. Todo lo demás apagado.
2. **Botón y PS_ON#.** El botón cierra un contacto en F_PANEL; la placa baja PS_ON# (pin 16, verde) a tierra. T1 < 200 ms (guía ATX 3, tabla 4-10).
3. **Arranque de la fuente.** PFC (boost) → bulk → medio puente LLC → transformador → rectificación síncrona 12 V → DC-DC 5 V y 3,3 V → supervisor. PWR_OK (pin 8, gris) sube entre 100 y 250 ms después (T3). Hold-up > 11 ms (T5): por eso el bulk.
4. **VRM.** 12 V de los EPS → controlador multifase → 16 DrMOS desfasados → bobinas → condensadores → ~1 V al CPU. El CPU pide el voltaje por SVID. Animación: cada fase se enciende en su turno; en el DrMOS abierto se ve el MOSFET alto conducir, luego el bajo.
5. **Reset y firmware.** Voltajes estables → se libera el reset → el PCH lee la flash SPI → el motor de seguridad verifica el firmware (Boot Guard) → el CPU ejecuta la UEFI. LED CPU.
6. **Entrenamiento de memoria.** Lectura del SPD, habilitación del PMIC, entrenamiento de cada línea DQ (retardos y referencias de voltaje) para DDR5-4800. LED DRAM. Es lo más lento del primer arranque.
7. **Enumeración PCIe y video.** x16 Gen 5 hacia la GPU (que negocia Gen 4), x4 Gen 4 hacia el NVMe, DMI 4.0 x8 hacia el PCH. LED VGA.
8. **Arranque del sistema operativo.** La UEFI carga el gestor de arranque desde el NVMe a la RAM. LED BOOT.
9. **Ruta de datos.** Núcleos ↔ anillo ↔ L3 ↔ controlador de memoria ↔ DDR5; PCIe a GPU y NVMe; DMI a SATA, USB, LAN y audio.
10. **Renderizado.** Comandos por PCIe → SM de la GPU → GDDR6X por 6 canales de 32 bits → salida DisplayPort o HDMI.
11. **Enfriamiento.** Die → STIM → IHS → pasta → base → heatpipes (evaporación y condensación) → aletas → aire de frente a atrás. Giran todos los ventiladores (`giro: true`).

Una etapa 12 posible, «Apagado y estados de suspensión» (S3: la RAM sigue con 5VSB; S5: solo standby), queda para después: necesita textos de la especificación ACPI.

## 3. Manual técnico (esquema de capítulos)

Mismo formato que los manuales de `docs/manuales/` (PDF y epub para el iPad), pero con un objetivo distinto: no reparar una herramienta sino entender y, más adelante, diseñar.

1. **Arquitectura de un PC.** Diagrama de bloques: CPU, memoria, PCIe, chipset, almacenamiento, energía, firmware. Qué hace cada módulo y por qué está donde está (ATX 2.2: zonas, alturas, flujo de aire).
2. **Energía: de la red al núcleo.** Fuente conmutada etapa por etapa (EMI, PFC, LLC, transformador, rectificación síncrona, DC-DC, 5VSB), conectores y pinout (24 pines, EPS, 12V-2x6 con sus señales S1-S4, SATA), secuencia de encendido (T1-T6) y VRM multifase (convertidor buck, MOSFET, driver, bobina, condensadores, control digital).
3. **La placa madre.** PCB multicapa (señal, planos de tierra y poder, impedancia controlada, vías), zócalo LGA e ILM, chipset, zócalos y ranuras, headers, Super I/O, reloj, BIOS/UEFI y CMOS.
4. **El CPU por dentro.** Del transistor (FinFET de Intel 7) a la compuerta lógica, de la compuerta al núcleo: front-end, renombrado, ejecución fuera de orden, cachés L1/L2/L3, anillo, controlador de memoria, PCIe, gráficos integrados, gestión de energía. Encapsulado: die, sustrato, STIM, IHS, contactos.
5. **Memoria.** Celda DRAM (un transistor y un condensador), bancos y grupos de bancos, refresco, DDR5 (subcanales, PMIC en el módulo, SPD hub, ECC en el chip), entrenamiento.
6. **Buses y protocolos.** PCIe (líneas, capas física/enlace/transacción, generaciones), DMI, DDR, NVMe sobre PCIe, SATA/AHCI, USB, SPI, SMBus/I3C, SVID.
7. **Gráficos.** GPU (SM, núcleos, caché, VRAM GDDR6X con PAM4), VRM de la tarjeta, refrigeración, 12V-2x6.
8. **Almacenamiento.** NAND 3D (celda TLC, capas, controlador con FTL, nivelación de desgaste, DRAM o HMB) y disco magnético (platos, cabezales, VCM, servo, SoC).
9. **Térmica y flujo de aire.** Conducción, heatpipes y cámaras de vapor, presión estática y caudal, curvas de ventilador.
10. **Firmware y arranque.** UEFI, POST, entrenamiento, ACPI, gestor de arranque, sistema operativo.
11. **Cómo se diseña una placa y un CPU (alto nivel).** Placa: especificación → esquemático → reglas de diseño → ruteo con impedancia controlada → simulación de integridad de señal y de poder → fabricación → bring-up. CPU: arquitectura (ISA) → microarquitectura → RTL → verificación → síntesis → place & route → tape-out → validación de silicio.
12. **Hacia una computadora propia.** Rutas de aprendizaje (sección 4).
13. **Diagnóstico y mantención** (para el uso en la empresa): LED de diagnóstico, códigos POST, pruebas de memoria y de disco (SMART), temperaturas, limpieza, cambio de pasta, reemplazo de la pila CMOS.

Cada capítulo cita el documento del que sale; lo supuesto se marca igual que en las fichas. Antes de entregar el manual pasa por la skill redaccion-natural.

## 4. Ruta hacia «una gran computadora» propia

Diseñar un PC comercial completo (CPU de 8 núcleos, DDR5, PCIe 5) está fuera del alcance de una persona: requiere fábricas y equipos de cientos de ingenieros. Lo alcanzable, y que enseña lo mismo, es este camino por etapas, todo con herramientas abiertas:

1. **Lógica digital y una computadora mínima.** *Nand2Tetris* (de la compuerta NAND a un computador que corre un juego) y la computadora de 8 bits en protoboard de Ben Eater. Resultado: entender registros, ALU, memoria, bus y unidad de control.
2. **Una ISA real: RISC-V.** Especificación abierta y libre de licencias (riscv.org). Leer el manual de la ISA base RV32I y escribir programas en ensamblador con un simulador (RARS, Spike).
3. **RTL y simulación.** Describir un procesador RV32I de un ciclo y luego segmentado en Verilog o SystemVerilog; simularlo con Verilator o Icarus Verilog y ver las ondas en GTKWave. Libro de referencia: *Computer Organization and Design RISC-V Edition* (Patterson y Hennessy).
4. **FPGA.** Llevar el procesador a una FPGA barata (Lattice iCE40 o ECP5) con la cadena abierta Yosys + nextpnr. Con LiteX se arma un sistema completo (CPU VexRiscv, DRAM, UART, Ethernet) que corre Linux.
5. **Placa propia (PCB).** KiCad: primero una placa sencilla (un microcontrolador RP2040 o un ESP32), luego una placa para la FPGA con su regulación de voltaje (aquí se aplica lo aprendido del VRM y de la fuente). Fabricación en servicios de bajo costo.
6. **Firmware y sistema.** Bootloader, coreboot o U-Boot, kernel Linux en el SoC de la FPGA; drivers sencillos.
7. **Silicio propio (opcional).** Tiny Tapeout y los PDK abiertos (SkyWater 130 nm, GF180) con OpenLane/OpenROAD permiten fabricar un diseño pequeño en un chip real compartido.
8. **Escalar.** Varios núcleos, caché coherente, buses (AXI, TileLink), núcleos abiertos de alto rendimiento (BOOM, CVA6, XiangShan) para estudiar cómo se ve un diseño grande.

Recursos: riscv.org (especificaciones), *Digital Design and Computer Architecture: RISC-V Edition* (Harris y Harris), nand2tetris.org, eater.net, KiCad, Yosys/nextpnr, LiteX, Verilator, Tiny Tapeout, OpenROAD.

## 5. Fuentes y su alcance

Documentado (en `contrato.json → fuentes`): medidas ATX de placa, E/S y ranuras; pinouts y tiempos de la fuente; encapsulado y capacidades del CPU; capacidades del Z690; arquitectura del módulo DDR5; datos de la RTX 4070 FE y del 990 PRO; zócalo LGA1700 (dibujos reproducidos por igor'sLAB, no oficiales).

Supuesto (marcado en cada pieza): medidas y forma de la caja, posición de los componentes en la placa (ATX solo recomienda zonas), distribución interna de la fuente (inspirada en una plataforma CWT como la RM850x), interior de la GPU y de los discos, número de capas del PCB, distribución de bloques en el die (no hay foto anotada oficial), altura del IHS, cristal del PCH y medidas de 2,5"/3,5" (por verificar contra SFF-8201/8301).
