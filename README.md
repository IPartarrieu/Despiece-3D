# Despiece 3D

Visor 3D desmontable de maquinaria menor, hecho con three.js y sin compilación (carpeta `docs/` lista para GitHub Pages).

**Criterio:** solo se modelan equipos con documentación de servicio completa (despiece oficial o procedimiento de desarme con fotos), para que la recreación del desarme sea fiel. Cada pieza lleva el número del documento (`ref`) y los pasos de desarme siguen el procedimiento publicado. Lo que el documento no da (medidas externas, colores, detalles finos) queda marcado como aproximado en la ficha de cada modelo.

| Herramienta | Modelos | Fuente |
|---|---|---|
| Demoledor | DeWalt D25900K (10 kg), D25940K (12 kg); Kothman HK-17 (referencial, misma arquitectura escalada a 6,5 kg); Makita HM1306 (15 kg) y Kothman HK-55 (17,7 kg), verticales y referenciales, sin despiece (`modelo_vertical.js`) | Procedimientos de desarme ESSG de DeWalt (63 y 59 págs.); catálogo Kothman 2024 (HK-17 y HK-55); manual y ficha Makita HM1306; arquitectura vertical según el folleto Makita HM1317C/HM1307C (motor paralelo al barril con piñón cónico: supuesto) |
| Rotomartillo | Makita HR2600, HR2601 (documentados); HR2470 y Kothman RK26 (referenciales, misma arquitectura) | Makita Technical Information HR2600/HR2601 (13 págs.) y manual del HR2470 |
| Esmeril angular | Makita GA4530, Milwaukee M18 FUEL 2880-20 | Despiece Makita y lista de piezas Milwaukee 54-38-7025 |
| Bomba | Bercatti DRE0753 (sumergible aguas sucias), Happy CYM158 (centrífuga 1 HP), Redbo WP-30A (motobomba bencinera 3") — los tres referenciales | Ficha DRE0752 y manual Bercatti/Vielva SCM3; catálogo técnico Pedrollo CP (CPm158); manual de servicio Loncin 165F/170F y manual Honda WB30XT |
| Sonda vibradora | Gasolina 5,5 HP + sonda 45 mm y + sonda 38 mm (eje flexible); alta frecuencia 45 mm. Todos referenciales (equipos de GMW sin documentación propia) | Wacker M1500/230 EU (cabezal H45 y eje SM1S, con números de pieza), Wacker BV50A-H (embrague, lista de terceros), Honda GX160 y Truper VICO-55 (motor), Enar TAX (mantención), Husqvarna AX36-AX65 (desarme y torques) y Wacker IRFU (convertidor) |

Los modelos referenciales usan la arquitectura de un modelo documentado y lo dicen en su ficha. Las bombas y las sondas vibradoras son todas referenciales: ningún fabricante publica despiece con números para los modelos de GMW, así que sus piezas no llevan `ref` salvo cuando un documento equivalente lo da. Pendientes con documentación hallada: Milwaukee 6130-33 y 6140-30, Makita GA4030K y 9557NB (esmeril); Makita HM1214C y Bosch GSH 10 E (demoledor, parciales).

- Rotar, acercar y mover con el mouse; clic en una pieza para ver su ficha.
- Explosión, corte, rayos X y aislar pieza; desarme paso a paso por modelo.
- Pestaña «Funciona»: el equipo en marcha, etapa por etapa (por dónde pasa la corriente, cómo se forma el campo magnético, qué fuerza mueve el motor, cómo llega el giro al disco). Las piezas que intervienen se destacan, el resto se atenúa, y se pueden pausar y ajustar la velocidad. Las velocidades de la animación son ilustrativas.
- Parámetros en la URL: `?herr=demoledor&modelo=D25940K` (o `&marca=Makita&modelo=HM1306`), `?marca=Makita`, `exp=1`, `corte`, `xray`, `paso=12`, `sel=<id>`, `cam=x,y,z,tx,ty,tz`, `func=1&etapa=3` (modo funcionamiento), `pausa`, `ang=`, `t=`.

Estructura: cada herramienta vive en `docs/<herramienta>/` (`modelo.js`, `data.json`, `index.js`) y se registra en `app.js`; el modo funcionamiento usa las etapas de `data.json` (`funcionamiento`) y las capas animadas del modelo (`vivo`: `capas`, `giros`, `mover`; helpers en `vivo.js`); los helpers 3D comunes están en `lib.js`. Probar en local: `cd docs && python3 -m http.server`. Los modelos son procedurales, no un CAD de fabricante.
