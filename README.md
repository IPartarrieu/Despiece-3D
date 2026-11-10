# Despiece 3D

Visor 3D de herramientas de maquinaria menor, hecho con three.js y sin compilación (carpeta `docs/` lista para GitHub Pages).
Herramientas: esmeril angular (19 piezas) y demoledor eléctrico (22 piezas, clase hex 17 mm y SDS-max). Cada una vive en su carpeta de `docs/` (`modelo.js`, `data.json`, `index.js`) y se registra en `app.js`; los helpers 3D comunes están en `lib.js`. Los datos salen de los manuales técnicos de maquinaria (`IGDO/Manuales/`).

- Rotar, acercar y mover con el mouse o el dedo; clic en una pieza para ver su ficha.
- Explosión, corte, rayos X y aislar pieza; desarme paso a paso (15 pasos).
- Equipo: marca, modelo, diámetro (115/125/180/230 mm), cable o batería, paleta o gatillo.
- Parámetros en la URL: `?herr=demoledor&marca=Kothman&modelo=HK-17` o `?marca=Makita&disco=230&exp=1&corte&xray&paso=12&sel=estator`.

Probar en local: `cd docs && python3 -m http.server`. El modelo es procedural (`modelo.js`), no un CAD de fabricante.
