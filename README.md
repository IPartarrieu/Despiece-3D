# Despiece 3D

Visor 3D de herramientas de maquinaria menor, hecho con three.js y sin compilación (carpeta `docs/` lista para GitHub Pages).
Primera herramienta: esmeril angular (19 piezas). Datos de piezas, modelos y desarme tomados del manual `IGDO/Manuales/Manual_Esmeril_Angular.pdf`.

- Rotar, acercar y mover con el mouse o el dedo; clic en una pieza para ver su ficha.
- Explosión, corte, rayos X y aislar pieza; desarme paso a paso (15 pasos).
- Equipo: marca, modelo, diámetro (115/125/180/230 mm), cable o batería, paleta o gatillo.
- Parámetros en la URL: `?marca=Makita&disco=230&exp=1&corte&xray&paso=12&sel=estator`.

Probar en local: `cd docs && python3 -m http.server`. El modelo es procedural (`modelo.js`), no un CAD de fabricante.
