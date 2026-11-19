# Textos de los pasos de desarme nuevos o reescritos (recorridos de contrato.json). Los pasos que ya existían se reutilizan
# de data.json (copia de respaldo) con su texto por modelo. Clave: id de recorrido -> paso -> (instruccion, precaucion, herramienta).
# «(s)» del contrato = orden típico de taller sin documento propio: se dice en el texto.

SUP = 'Orden habitual de taller; el manual de servicio de este motor no está en las fuentes.'

# paso nuevo de la máquina: (instruccion Case, instruccion otros modelos o None si es igual, precaucion, herramienta)
MAQUINA = {
 6: ('Suelta las abrazaderas del conducto y saca primero el elemento primario y luego el secundario del filtro de aire, y después la carcasa (manual M, p.186). Desmonta el silenciador y, según el modelo, el postratamiento: DOC y filtro de partículas (580N), o el catalizador SCR y el estanque de urea de 19 L (420F2). Anota el sentido del flujo para el montaje.',
     'Suelta las abrazaderas del conducto y saca los elementos del filtro de aire y su carcasa. Desmonta el silenciador y, según el modelo, el postratamiento: DOC y filtro de partículas (580N), o el catalizador SCR y el estanque de urea de 19 L (420F2). Anota el sentido del flujo para el montaje (práctica de taller).',
     'Con el motor caliente el silenciador y el postratamiento queman. No dejes entrar polvo al turbo: tapa la boca de admisión.', 'Llave de 13 mm, tapones'),
 7: ('Con el motor frío abre la tapa y drena el refrigerante en un recipiente. Baja el tensor con una barra de 1/2 in y saca la correa poli-V. El acople de la bomba hidráulica va a la polea del cigüeñal con cuatro pernos: suéltalo y córrelo hacia la bomba (manual M, p.215; MR 4.1). Desconecta las mangueras y retira el depósito de expansión, los enfriadores de aceite hidráulico y de transmisión, el contrapeso delantero y por último el radiador con el ventilador.',
     'Con el motor frío abre la tapa y drena el refrigerante en un recipiente. Baja el tensor con una barra de 1/2 in y saca la correa; en este modelo el procedimiento exacto del acople de la bomba hidráulica a la polea no está en las fuentes (en la Case son cuatro pernos). Desconecta las mangueras y retira el depósito, los enfriadores, el contrapeso delantero y el radiador con el ventilador.',
     'Nunca abras la tapa del radiador caliente. El contrapeso es muy pesado: usa grúa.', 'Barra de 1/2 in, llave de torque, grúa'),
 21: ('Desconecta el cable negativo (ya sin batería), luego el alternador y el motor de arranque con sus cables y retira ambos. Desconecta y rotula los conectores del arnés y de la unidad de control del motor (ECU) (SM-T3: «remove the starter»; SM 55.100).',
      None, 'Mantén los cables de batería aislados y marca cada conector: muchos se parecen.', 'Llaves, cinta y marcador'),
 22: ('Con el acople ya suelto de la polea, saca la bomba hidráulica de su soporte, adelante del motor, junto con el acople. Tapa las bocas de la bomba y de las mangueras (manual M, pdf 215). Al montar, la bomba hay que cebarla (manual M, p.202).',
      None, 'Tapa todas las bocas para que no entre suciedad. La bomba es pesada y el soporte puede soltarla de golpe.', 'Llaves, eslinga, tapones'),
 23: ('Con el motor apoyado en la grúa, retira la tapa de acceso de la campana y suelta los cuatro pernos entre el volante y la placa flexible, girando el cigüeñal. Suelta los soportes delanteros y los doce pernos motor-transmisión; el motor sale hacia adelante y arriba, y la placa flexible y el convertidor quedan en la transmisión (SM-T3, procedimiento del 580N). Antes, retira los filtros de combustible, la bomba de cebado y las líneas.',
      'Con el motor apoyado en la grúa, retira la tapa de acceso de la campana y suelta los pernos entre el volante y la placa flexible, los soportes y los pernos motor-transmisión; el motor sale hacia adelante y arriba. El procedimiento de este modelo no está en las fuentes: se usa el de la 580N (SM-T3). Antes, retira filtros de combustible, bomba de cebado y líneas.',
      'El motor es muy pesado: usa grúa de capacidad certificada y no te pongas bajo la carga. Evita llamas cerca del combustible.', 'Grúa, eslinga, llave de torque'),
 24: ('Con el motor ya fuera, drena el aceite de la transmisión, desconecta mangueras y cableado y retira la transmisión con el convertidor, la placa flexible y la campana. La transmisión se desarma por dentro en el banco: bomba de carga, válvula y solenoides, filtro, freno de estacionamiento, embragues y engranajes (SM-T3).',
      None, 'El desarme interno de la transmisión requiere el manual de servicio, que no está en las fuentes. Marca cada manguera y conector.', 'Gato de transmisión, llaves'),
 25: ('Con las mangueras ya retiradas, saca las dos válvulas del cargador y de la retro, las válvulas de alivio, la válvula de prioridad y la unidad de dirección (orbitrol), el estanque hidráulico con su colador y el estanque de combustible (práctica de taller). Drena antes el combustible.',
      None, 'Evita llamas y chispas cerca del combustible. Tapa todas las bocas abiertas.', 'Llaves y eslinga'),
}
# pasos que se reutilizan pero se completan con el recorrido nuevo
EXTRA = {
 8: ' Con el filtro hidráulico ya fuera, revisa el colador de succión al vaciar el estanque.',
 10: ' Retira también la columna de dirección y las bombas de freno de los pedales.',
 20: ' Para el despiece del eje trasero (cubos, retenes, mandos finales, frenos de discos húmedos y diferencial) usa el procedimiento «Eje trasero».',
}

BANCO = {
 1: ('Con el motor en el banco, calienta el aceite unos minutos, quita el tapón magnético del cárter y drénalo en un recipiente. Mira el tapón: las limaduras finas son normales; trozos o virutas, no.', 'Recoge el aceite usado y llévalo a un centro de reciclaje autorizado.', 'Llave del tapón, recipiente'),
 2: ('Suelta las conexiones de aire, escape, aceite de alimentación y retorno del turbo y retira el turbocompresor con su empaquetadura (SK 2-27, 2-29).', 'Tapa las bocas del turbo y de la admisión. No gires la turbina con los dedos si el motor estuvo caliente.', 'Llaves, tapones'),
 3: ('Suelta las tuberías de alta presión y retira el riel común y los cuatro inyectores como juego. Tapa cada boca de inmediato (NEF; SM 10.218).', 'Limpieza absoluta: en un riel común basta una partícula fina para dañar un inyector. Con el motor parado y sin presión.', 'Llaves de tubería, tapones'),
 4: ('Retira la tapa de balancines con su junta; es lo primero que se abre en el reglaje de válvulas (NEF «tappet caps»).', 'Mira el aceite: lodo negro bajo la tapa avisa de mantención descuidada.', 'Llaves'),
 5: ('Suelta el eje de balancines y retira los balancines y las varillas, en orden (NEF). Rotula cada pieza por cilindro y posición.', 'Las varillas deben volver exactamente a su asiento: no las mezcles.', 'Llaves, bandeja con casilleros'),
 6: ('Retira los múltiples de admisión y de escape con sus juntas y, en la 580N Tier 4i, la válvula y el enfriador EGR (SK 2-25; NEF; H-N p.1).', 'Los pernos del escape se cortan fácil: rocía penetrante antes de soltarlos.', 'Llaves, penetrante'),
 7: ('Retira la caja del termostato y el termostato (NEF «thermostat unit»). Revisa que abra: en agua caliente debe moverse.', 'Hay refrigerante residual: ten un paño.', 'Llaves'),
 8: ('Si siguen montados, baja el tensor con una barra de 1/2 in, saca la correa poli-V y retira el tensor, las poleas y el alternador (NEF; MR 4.1).', 'Desconecta el alternador antes de soltar cables.', 'Barra de 1/2 in, llaves'),
 9: ('Retira el filtro de aceite y el intercambiador (enfriador) de aceite, y la varilla de nivel (NEF «heat exchanger»; SK 2-31).', 'El filtro tiene aceite: ponlo en un recipiente.', 'Llave de filtro'),
 10: ('Afloja los tornillos de culata en el orden inverso al de apriete y retira la culata con sus válvulas y la empaquetadura (SK 2-35, 2-37, 2-57). Revisa el alabeo de la cara con regla y galga.', 'No hagas palanca entre la culata y el bloque: marca las caras. El orden de apriete y el valor no están en las fuentes.', 'Llaves, regla y galga'),
 11: ('Retira la bomba de alta presión, que mueve la distribución (SK 3-15; NEF).', 'Tapa todas las bocas.', 'Llaves, tapones'),
 12: ('Retira la bomba de agua, adelante, que mueve la correa (SK 2-21; NEF). Mira el orificio de drenaje: restos de refrigerante indican sello vencido.', 'Cuando la cambies, cambia también la correa y el tensor.', 'Llaves'),
 13: ('Retira la polea con el amortiguador del cigüeñal y luego el retén delantero con su camisa de desgaste (SK 2-49; NEF). La bomba hidráulica y su acople ya deben estar fuera.', 'Cuidado de no rayar la punta del cigüeñal al sacar el retén.', 'Extractor de polea, extractor de retén'),
 14: ('Retira la bomba de aceite, que va adelante, sobre el cigüeñal (SK 2-33; NEF). Revisa los engranajes y la tapa por desgaste.', 'Marca la posición de la bomba para el montaje.', 'Llaves'),
 15: ('Retira la tapa delantera, que aloja el retén delantero y la bomba de aceite (NEF).', 'Retira la junta vieja sin rayar las caras.', 'Llaves, espátula'),
 16: ('Gira el motor para tener a mano los cuatro pernos, suelta el volante con su corona dentada y retíralo (SM-T3; NEF; CAT-SM «Flywheel remove»).', 'El volante es pesado: usa un eslabón o gato y un tornillo guía.', 'Llaves, eslinga'),
 17: ('Retira la caja del volante junto con el retén trasero y su camisa de desgaste (NEF «flywheel cover box»; SK 2-49; CAT-SM; JCB-SM).', 'No rayes la cara del bloque ni el asiento del retén.', 'Llaves, espátula'),
 18: ('Da vuelta el motor sobre el banco y retira el cárter, el chupador con su colador y la placa de refuerzo (NEF «oil suction rose pipe», «stiffening plate»). Revisa el colador por lodo.', 'Sujeta bien el motor antes de girarlo.', 'Llaves, soporte giratorio'),
 19: ('Retira el engranaje del árbol de levas y la caja de distribución, atrás, en el lado del volante (NEF «timing gearbox»). Marca la posición de los engranajes para el montaje.', 'Revisa las marcas de distribución antes de soltar nada.', 'Llaves, pintura de marcar'),
 20: ('Suelta los sombreretes de biela y empuja las bielas con sus pistones hacia arriba, sacándolos por el lado de la culata; marca cada conjunto con el número de cilindro. ' + SUP, 'Protege las muñequillas; no dejes que las bielas rayen el cilindro.', 'Llaves, martillo plástico, bandeja'),
 21: ('Suelta los sombreretes de bancada, retira el cigüeñal y los metales de bancada con el axial. ' + SUP, 'Marca los sombreretes: cada uno va en su bancada y mirando al mismo lado.', 'Llaves, soporte del cigüeñal'),
 22: ('Retira el árbol de levas con sus taqués, por el lado de la distribución. ' + SUP, 'Sácalo recto para no rayar los bujes del bloque.', 'Llaves, ventosa para taqués'),
}
EJE = {
 1: ('Calza la máquina, apóyala en caballetes, drena el aceite del eje trasero (13,6 L en la 580N) y saca la rueda trasera izquierda (hoja p.2; manual M, p.156-157).', 'No trabajes bajo una máquina que solo se apoya en el gato.', 'Caballetes, llave de impacto, recipiente'),
 2: ('Saca el cubo con sus rodamientos y el retén de cubo. Revisa el estado de los rodamientos y la superficie donde corre el retén (SK «SEAL oil, hub»; manual M, p.168).', 'El aceite en el freno de discos húmedos lo daña: limpia antes de armar.', 'Extractor, llaves'),
 3: ('Retira el mando final planetario: sol, satélites, corona y portasatélites (SM 27.120). Mira el juego de los satélites y las limaduras en el aceite.', 'Los satélites se sueltan en cuanto sacas el portasatélites: sujétalos.', 'Llaves, extractor'),
 4: ('Retira los discos de freno húmedos, los separadores y el pistón del lado izquierdo (SM 33.202). Mide el espesor de los discos y revisa el alabeo.', 'Cambia los sellos del pistón al armar.', 'Llaves, calibre'),
 5: ('Saca el semieje de la trompeta y revisa las estrías (SK «SHAFT axle»).', 'El semieje es pesado: sostenlo al sacarlo.', 'Gato, llaves'),
 6: ('Retira el bloqueo del diferencial y el conjunto del diferencial con la corona y el piñón (SM 27.106; SK 6-33). Revisa la huella de contacto y el juego de los rodamientos.', 'El conjunto es pesado: usa gato o grúa. Marca la posición de los rodamientos.', 'Gato, llaves, eslinga'),
}
CIL = {
 1: ('Con la pluma apoyada, retrae el cilindro y apoya el vástago. Con el motor apagado, mueve las palancas para aliviar la presión (MR, tabla 7). Marca la posición del cilindro.', 'El aceite a presión se inyecta bajo la piel (manual M, pdf 199).', 'A mano, caballete'),
 2: ('Desconecta las mangueras del cilindro y tapa las bocas y los terminales de inmediato (MR, tabla 7).', 'Aun sin presión sale aceite: ten paños y recipiente.', 'Llaves de manguera, tapones'),
 3: ('Saca los pasadores de los ojos del cilindro y retíralo con eslinga. Revisa los bujes y los sellos de ojo, que se cambian si tienen juego (SK 8-117: bujes D144895).', 'Sostén el cilindro con eslinga antes de sacar el último pasador.', 'Martillo de bronce, eslinga'),
 4: ('Suelta el cabezal (prensaestopa) de la camisa; algunos se desatornillan y otros llevan seguro. ' + SUP, 'No rayes el vástago con la llave. Limpieza absoluta del banco.', 'Llave de gancho, tornillo de banco con mordazas blandas'),
 5: ('Saca el vástago con el pistón y el cabezal por el lado del cabezal (SK 8-117).', 'Sácalo recto y sin golpes: una raya en el vástago corta los sellos nuevos.', 'Banco de trabajo'),
 6: ('Suelta el perno del pistón del vástago y retira el pistón. ' + SUP, 'El perno del pistón es de 3/4 NF en el catálogo de la Super K (SK 8-117): confirma el del modelo.', 'Llave, tornillo de banco'),
 7: ('Cambia todo el kit de sellos: limpiador, sello del vástago, sello amortiguador, sello y anillos del pistón y O-rings (SK 8-117, kit 1543260C1 de la Super K; el número de la N no se tiene). Aceita los sellos antes de montarlos, arma y prueba el cilindro (MR, tabla 7).', 'Cambia todos los sellos a la vez, nunca solo el que gotea.', 'Kit de sellos, grasa, extractor de sellos'),
}
