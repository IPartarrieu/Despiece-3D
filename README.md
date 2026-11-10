# Despiece 3D

Visor 3D desmontable de maquinaria menor, hecho con three.js y sin compilación (carpeta `docs/` lista para GitHub Pages).

**Criterio:** solo se modelan equipos con documentación de servicio completa (despiece oficial o procedimiento de desarme con fotos), para que la recreación del desarme sea fiel. Cada pieza lleva el número del documento (`ref`) y los pasos de desarme siguen el procedimiento publicado. Lo que el documento no da (medidas externas, colores, detalles finos) queda marcado como aproximado en la ficha de cada modelo.

| Herramienta | Modelos | Fuente |
|---|---|---|
| Demoledor | DeWalt D25900K (10 kg), D25940K (12 kg) | Procedimientos de desarme ESSG de DeWalt (63 y 59 págs.) |
| Esmeril angular | Makita GA4530, Milwaukee M18 FUEL 2880-20 | Despiece Makita y lista de piezas Milwaukee 54-38-7025 |

Pendientes con documentación hallada: Milwaukee 6130-33 y 6140-30, Makita GA4030K y 9557NB (esmeril); Makita HM1214C y Bosch GSH 10 E (demoledor, parciales).

- Rotar, acercar y mover con el mouse; clic en una pieza para ver su ficha.
- Explosión, corte, rayos X y aislar pieza; desarme paso a paso por modelo.
- Parámetros en la URL: `?herr=demoledor&modelo=D25940K`, `?marca=Makita`, `exp=1`, `corte`, `xray`, `paso=12`, `sel=<id>`, `cam=x,y,z,tx,ty,tz`.

Estructura: cada herramienta vive en `docs/<herramienta>/` (`modelo.js`, `data.json`, `index.js`) y se registra en `app.js`; los helpers 3D comunes están en `lib.js`. Probar en local: `cd docs && python3 -m http.server`. Los modelos son procedurales, no un CAD de fabricante.
