#!/usr/bin/env python3
"""Genera docs/pctorre/contrato.json (fuente única de piezas, marcos, layout y recorridos del PC de torre).

Uso:  python3 docs/pctorre/scripts_datos/generar_contrato.py [--datos]
  --datos  escribe también un data.json ESQUELETO (solo si no existe; no pisa el trabajo del agente de datos).

Convención (cm): +x hacia el frente de la caja, +y arriba, +z hacia el panel de vidrio. Suelo en y = 0, centro de la
huella de la caja en x = z = 0. Cada pieza se ancla en un MARCO local (placa, fuente, gpu, hdd, ssd o caja) con
coordenadas (a, b, c); el marco las pasa a mundo: p = o + a*A + b*B + c*C (ejes alineados, sin rotación libre).
La explosión del contrato es la ABSOLUTA: suma de la relativa de la pieza y la de todos sus padres.
"""
import json, os, sys, fnmatch

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------- marcos locales ----------------
MARCOS = {
    'caja':   {'o': [0, 0, 0],          'a': [1, 0, 0], 'b': [0, 1, 0], 'c': [0, 0, 1],
               'txt': 'mundo: a = x (frente), b = y (arriba), c = z (vidrio)'},
    'placa':  {'o': [-21.6, 45.0, -7.4], 'a': [1, 0, 0], 'b': [0, -1, 0], 'c': [0, 0, 1],
               'txt': 'placa madre ATX 30,48 x 24,38: a = u desde el borde trasero (0..24,38), b = v desde el borde superior (0..30,48), c = altura sobre la cara de componentes (la cara está en z = -7,4; el PCB va de c = -0,157 a 0)'},
    'fuente': {'o': [-22.3, 9.9, 0],     'a': [1, 0, 0], 'b': [0, 0, 1], 'c': [0, -1, 0],
               'txt': 'fuente ATX 16 x 8,6 x 15 instalada con el ventilador hacia abajo: a desde la cara trasera (0..16), b a lo ancho (-7,5..7,5), c hacia ABAJO desde la cara de componentes del PCB (0..8,3); el PCB queda arriba y los componentes cuelgan'},
    'gpu':    {'o': [-22.35, 28.0, -7.1], 'a': [1, 0, 0], 'b': [0, 0, 1], 'c': [0, -1, 0],
               'txt': 'tarjeta gráfica en la ranura 1: a desde el bracket (0..24,4), b altura desde la punta de los contactos (0..11,2), c hacia el lado del disipador (abajo, 0..4); el backplate queda en c < 0'},
    'hdd':    {'o': [3.5, 2.2, 1.0],     'a': [1, 0, 0], 'b': [0, 0, 1], 'c': [0, 1, 0],
               'txt': 'disco de 3,5" acostado en la jaula: a desde el extremo de los conectores (0..14,7), b a lo ancho (-5,08..5,08), c desde la cara inferior (0..2,61)'},
    'ssd':    {'o': [7.0, 30.0, -8.3],   'a': [1, 0, 0], 'b': [0, 1, 0], 'c': [0, 0, -1],
               'txt': 'SSD SATA 2,5" en la cara trasera de la bandeja: a desde el conector (0..10), b a lo alto (-3,49..3,49), c alejándose de la bandeja (0..0,7)'},
}

def en(marco, a, b, c):
    M = MARCOS[marco]
    return [round(M['o'][i] + a * M['a'][i] + b * M['b'][i] + c * M['c'][i], 3) for i in range(3)]

# ---------------- puntos compartidos (L en JS) ----------------
pc = lambda k: 17.0 + (k - 1) * 2.032          # ranura ATX k (1 arriba): v de su eje, paso 0,8" (ATX 2.2 §3.3.1)
LAYOUT = {
    'caja': [0, 24, 0], 'bandeja': [0, 26, -8.2], 'trasero': [-22.45, 24, 0], 'frente': [21.9, 24, 0], 'techo': [0, 47.9, 0],
    'mb': en('placa', 0, 0, 0), 'socket': en('placa', 12.5, 9.0, 0), 'cpu': en('placa', 12.5, 9.0, 0.33),
    'dimm_a1': en('placa', 18.0, 8.6, 0), 'dimm_a2': en('placa', 18.8, 8.6, 0), 'dimm_b1': en('placa', 19.6, 8.6, 0), 'dimm_b2': en('placa', 20.4, 8.6, 0),
    'atx24': en('placa', 23.4, 10.6, 0), 'eps1': en('placa', 5.2, 0.75, 0), 'eps2': en('placa', 7.6, 0.75, 0),
    'pcie1': en('placa', 8.75, pc(1), 0), 'pcie2': en('placa', 5.55, pc(2), 0), 'pcie3': en('placa', 8.75, pc(4), 0), 'pcie4': en('placa', 5.55, pc(6), 0),
    'm2_1': en('placa', 9.6, 14.6, 0), 'm2_2': en('placa', 9.0, pc(3), 0), 'pch': en('placa', 18.0, 23.5, 0), 'sata': en('placa', 23.6, 23.5, 0),
    'fpanel': en('placa', 20.5, 29.6, 0), 'usb3': en('placa', 23.6, 16.2, 0), 'usbc': en('placa', 23.6, 14.3, 0), 'audio_hdr': en('placa', 2.0, 29.6, 0),
    'fan_cpu': en('placa', 14.5, 0.8, 0), 'fan_sys1': en('placa', 23.4, 2.0, 0), 'fan_sys2': en('placa', 9.0, 29.6, 0),
    'io_escudo': [-22.45, 37.2, -5.56], 'gpu': en('gpu', 12.2, 5.6, 1.5), 'gpu_12v': en('gpu', 16.0, 10.9, 0.5),
    'psu': en('fuente', 8, 0, 4.0), 'psu_modular': en('fuente', 16.0, 0, 4.0), 'psu_iec': en('fuente', 0.0, 4.8, 3.0),
    'hdd': en('hdd', 7.35, 0, 1.3), 'hdd_conector': en('hdd', 0, 0, 0.6), 'ssd': en('ssd', 5, 0, 0.35), 'ssd_conector': en('ssd', 0, 0, 0.35),
    'vent_f1': [19.85, 8.0, 1.2], 'vent_f2': [19.85, 20.5, 1.2], 'vent_f3': [19.85, 33.0, 1.2], 'vent_t': [-21.05, 37.0, 3.6],
    'io_frontal': [17.5, 47.4, 1.0],
    # pasacables de la bandeja (los cables cruzan por aquí hacia la cara trasera)
    'ojal_24p': [4.2, 34.0, -8.2], 'ojal_eps': [-17.0, 46.5, -8.2], 'ojal_inf': [-4.0, 12.6, -8.2], 'ojal_sata': [4.2, 20.0, -8.2],
}

# ---------------- fuentes ----------------
FUENTES = {
    'ATX22': 'Intel, ATX Specification v2.2 (2004): placa 305 x 244 mm, abertura E/S 158,75 x 44,45 mm a 3,81 mm bajo la cara de la placa, 7 ranuras a 0,8" (20,32 mm), agujeros A C F G H J K L M, altura libre 3,0" sobre el área A. https://xdevs.com/doc/_PC_HW/Form_factors/atx2_2.pdf',
    'PSUDG': 'Intel, ATX Version 3 Multi Rail Desktop Platform Power Supply Design Guide, doc. 336521 rev. 2.1a (nov. 2023): tabla 4-10 (T1 < 200 ms, T3 PWR_OK 100-250 ms, T5 > 11 ms), tablas 5-1 (24 pines), 5-7 (12V-2x6, 600 W, S1-S4), 5-9 (EPS 8 pines), 5-10 (SATA). https://cdrdv2-public.intel.com/336521/336521_Rev2p1a.pdf',
    'INTEL12': 'Intel, 12th Generation Intel Core Processors Datasheet Vol. 1, doc. 655258 rev. 011 (may. 2025): LGA1700 45 x 37,5 mm, sustrato 1,116 mm y die 0,37 mm; PCIe 5.0 x16 + 4.0 x4; DDR5-4800 / DDR4-3200, 2 canales; anillo; LLC hasta 3 MB por núcleo P. https://cdrdv2-public.intel.com/655258/655258-011.pdf',
    'PCH600': 'Intel 600 Series Chipset Family PCH Datasheet, doc. 648364, e Intel ARK Z690: DMI 4.0 x8, hasta 12 líneas PCIe 4.0 y 16 PCIe 3.0, 8 SATA 6 Gb/s, 14 USB 2.0, USB 3.2 Gen 2x2. https://cdrdv2.intel.com/v1/dl/getContent/648364 ; https://www.intel.com/content/www/us/en/products/sku/218833/intel-z690-chipset.html',
    'ADL': 'TechPowerUp, review Core i9-12900K (8 Golden Cove + 8 Gracemont, 1,25 MB L2 por núcleo P, 30 MB L3, die ~215 mm²); WikiChip i9-12900K; medida de un die sin IHS 20,4 x 10,2 mm (HotHardware). https://www.techpowerup.com/review/intel-core-i9-12900k-alder-lake-12th-gen/ ; https://en.wikichip.org/wiki/intel/core_i9/i9-12900k',
    'LGA1700': 'Wikipedia LGA 1700 (1700 contactos, ZIF/LGA, 7,5 mm más largo que LGA1200) e igor\'sLAB, dibujos del zócalo (patrón de montaje 78 x 78 mm, plano de asiento 2,7 mm, carga estática mín. 534 N). https://en.wikipedia.org/wiki/LGA_1700 ; https://igorslab.de/en/intel-socket-lga-1700-and-lga-1800-in-detail-exclusive-data-and-drawings-for-the-new-cpus-ab-alder-lake/2',
    'VRM': 'Placas Z690 de referencia: Gigabyte Z690 Gaming X (16+1+2 fases, DrMOS 60 A, ficha del fabricante) y TechPowerUp, VRM de Z690 con controlador Renesas RAA229131 y etapas RAA22010540 de 105 A. https://www.gigabyte.com/Motherboard/Z690-GAMING-X-rev-10 ; https://www.techpowerup.com/review/gigabyte-z690-aorus-tachyon/4.html',
    'DDR5': 'Micron, DDR5 Key Module Features (PMIC en el módulo, SPD hub) y Kingston, DDR5 Overview (2 subcanales de 32 bits por módulo, ECC en el chip). https://www.mouser.lt/pdfDocs/ddr5_key_module_features_tech_brief2.pdf ; https://media.kingston.com/kingston/articles/MKF_954-DDR5-Collateral_us.pdf',
    'PSUANAT': 'Etapas de una fuente conmutada: TechSpot «Anatomy of a PSU», Tom\'s Hardware «PSUs 101» y PC Gamer «How PC power supplies work» (filtro EMI, puente, PFC activo, conmutación, transformador, rectificación, DC-DC 5 V/3,3 V, 5VSB). https://www.techspot.com/article/1967-anatomy-psu/ ; https://www.tomshardware.com/reviews/power-supplies-101,4193-10.html',
    'RM850X': 'Corsair RM850x (2021), plataforma CWT: PFC activo, totalmente modular, ventilador de levitación magnética (TechPowerUp y Tom\'s Hardware). Se usa como referencia de distribución, no como copia. https://www.techpowerup.com/review/corsair-rmx-series-850-w-2021/',
    'RTX4070': 'TechPowerUp, review RTX 4070 Founders Edition (AD104 recortado, 12 GB GDDR6X, 192 bits, conector 16 pines 12VHPWR) e igor\'sLAB, desarme (6 fases reales NVVDD). https://www.techpowerup.com/review/nvidia-geforce-rtx-4070-founders-edition/ ; https://igorslab.de/en/will-ada-be-suitable-for-the-masses-geforce-rtx-4070-founders-edition-12-gb-review-with-200-and-220-watt-power-limit/3',
    '990PRO': 'Samsung 990 PRO: hoja de datos y TechPowerUp (controlador Pascal S4LV008 de 8 nm, LPDDR4 de 1-2 GB, V-NAND TLC de 176 capas, M.2 2280, PCIe 4.0 x4). https://download.semiconductor.samsung.com/resources/data-sheet/Samsung_NVMe_SSD_990_PRO_Datasheet_Rev.1.0_10129514072296.pdf',
    'M2SATA': 'PCI-SIG M.2 (2280 = 22 x 80 mm, llave M) y SATA-IO (datos de 7 contactos, poder de 15 contactos; pinout de poder en PSUDG tabla 5-10). Medidas del 2,5" (100 x 69,85 x 7 mm) y del 3,5" (147 x 101,6 x 26,1 mm) según SFF-8201/8301: POR VERIFICAR contra la norma.',
    'sup': 'Supuesto: no hay documento público que lo fije; se eligió un valor típico y se marca en la ficha.',
}

# ---------------- piezas ----------------
# P(id, nombre, padre, sistema, subgrupo, (marco, a, b, c), explosión relativa [x, y, z], 'FUENTE[,FUENTE]', **opciones)
# opciones: shell (carcasa que tapa piezas: rayos X), envuelve (su caja envolvente puede contener a otras piezas),
# disperso (son varias partes separadas: la caja envolvente no sirve para medir choques), nota.
PZ = []
def P(id, nombre, padre, sis, sub, anc, rel, fte, **k):
    PZ.append(dict(id=id, nombre=nombre, padre=padre, sistema=sis, subgrupo=sub, anc=anc, rel=rel, fte=fte, **k))

# ===== CAJA =====
C, S = 'Caja', 'Estructura'
P('caja_chasis', 'Chasis de acero (mid-tower ATX)', None, C, S, ('caja', 0, 24, 0), [0, 0, 0], 'sup', shell=True, envuelve=True, disperso=True, nota='45 x 48 x 21,5 cm, típico de una mid-tower; ATX 2.2 solo fija la abertura E/S, las ranuras y los agujeros de la placa.')
P('caja_bandeja', 'Bandeja de la placa madre', 'caja_chasis', C, S, ('caja', 0, 26, -8.25), [0, 0, -4], 'sup', nota='Con recorte para la contraplaca del CPU y ojales para cables.')
P('caja_separadores', 'Separadores (standoffs) M3 de la placa (×9)', 'caja_bandeja', C, S, ('placa', 12.2, 15.2, -0.45), [0, 0, -3], 'ATX22', disperso=True, nota='Posiciones A C F G H J K L M de ATX 2.2; altura 6,35 mm (supuesto típico).')
P('caja_tornillos_placa', 'Tornillos de la placa madre (×9)', None, C, S, ('placa', 12.2, 15.2, 0.1), [0, 0, 26], 'ATX22', disperso=True)
P('caja_cubierta_fuente', 'Cubierta de la fuente (shroud)', 'caja_chasis', C, S, ('caja', -2, 12.0, 1.2), [0, -6, 10], 'sup', envuelve=True)
P('caja_jaula_hdd', 'Jaula de discos de 3,5"', 'caja_chasis', C, S, ('caja', 10.7, 6.6, 1.0), [8, 0, 12], 'sup', envuelve=True)
P('caja_soporte_ssd', 'Soporte de SSD 2,5" (detrás de la bandeja)', 'caja_chasis', C, S, ('caja', 12, 30, -8.35), [0, 0, -10], 'sup', envuelve=True)
P('caja_tapas_slots', 'Tapas de las ranuras de expansión (×5)', 'caja_chasis', C, S, ('caja', -22.45, 16.0, -1.5), [-8, 0, 0], 'ATX22', disperso=True, nota='7 ranuras a 20,32 mm; la GPU de 2 ranuras usa las dos primeras.')
P('caja_patas', 'Patas de goma', 'caja_chasis', C, S, ('caja', 0, 0.6, 0), [0, -5, 0], 'sup', disperso=True)
P('caja_ojales', 'Pasacables de goma (ojales)', 'caja_bandeja', C, S, ('caja', 0, 30, -8.2), [0, 0, -2], 'sup', disperso=True)
P('caja_bridas', 'Bridas y velcro de cables', 'caja_bandeja', C, S, ('caja', 2, 25, -9.6), [0, 0, -6], 'sup', disperso=True)
S = 'Paneles y filtros'
P('caja_panel_vidrio', 'Panel lateral de vidrio templado', None, C, S, ('caja', 0, 24.6, 10.68), [0, 0, 45], 'sup')
P('caja_panel_derecho', 'Panel lateral derecho (acero)', None, C, S, ('caja', 0, 24.6, -10.68), [0, 0, -45], 'sup')
P('caja_panel_superior', 'Panel superior', None, C, S, ('caja', 0, 47.9, 0), [0, 26, 0], 'sup')
P('caja_filtro_superior', 'Filtro de polvo magnético superior', 'caja_panel_superior', C, S, ('caja', -3, 48.05, 1.0), [0, 5, 0], 'sup')
P('caja_frontal', 'Frontal (bisel) de malla', None, C, S, ('caja', 21.9, 24.6, 0), [40, 0, 0], 'sup')
P('caja_filtro_frontal', 'Filtro de polvo frontal', 'caja_frontal', C, S, ('caja', 21.25, 24.6, 1.2), [-8, 0, 0], 'sup')
P('caja_filtro_inferior', 'Filtro de polvo inferior (fuente)', None, C, S, ('caja', -14, 0.9, 0), [0, -12, 0], 'sup')
S = 'Panel frontal E/S'
P('caja_io_placa', 'Placa del panel frontal E/S', None, C, S, ('caja', 17.5, 47.4, 1.0), [10, 22, 0], 'sup')
for i, (id, nom, z, fte) in enumerate([('caja_boton_power', 'Botón de encendido', 3.4, 'sup'), ('caja_boton_reset', 'Botón de reinicio', 2.0, 'sup'),
                                       ('caja_leds', 'LED de encendido y de actividad de disco', 0.9, 'sup'), ('caja_usb_a_frontal', 'Puertos USB-A frontales (USB 3.2 Gen 1, ×2)', -1.4, 'sup'),
                                       ('caja_usb_c_frontal', 'Puerto USB-C frontal (USB 3.2 Gen 2)', -3.6, 'sup'), ('caja_jack_audio', 'Jack de audio combinado 3,5 mm', 5.0, 'sup')]):
    P(id, nom, 'caja_io_placa', C, S, ('caja', 18.5, 47.95, z), [0, 3, 0], fte)
S = 'Ventiladores'
for i, y in enumerate([8.0, 20.5, 33.0], 1):
    P(f'caja_vent_frontal_{i}', f'Ventilador frontal de 120 mm ({i})', None, C, S, ('caja', 19.85, y, 1.2), [28, (i - 2) * 6, 0], 'sup', nota='Toma de aire. Ítem 0: marco; ítem 1: rotor (gira en «Funciona»).')
P('caja_vent_trasero', 'Ventilador trasero de 120 mm (marco)', None, C, S, ('caja', -21.05, 37.0, 3.6), [-26, 0, 0], 'sup', nota='Extracción. Se despieza en rotor, estator, placa y rodamiento.')
P('caja_vent_trasero_rotor', 'Rotor del ventilador con imán anular', 'caja_vent_trasero', C, S, ('caja', -20.6, 37.0, 3.6), [8, 0, 0], 'sup', envuelve=True)
P('caja_vent_trasero_estator', 'Estator (bobinas) del ventilador', 'caja_vent_trasero', C, S, ('caja', -21.0, 37.0, 3.6), [4, 0, 0], 'sup')
P('caja_vent_trasero_placa', 'Placa del motor con sensor Hall y driver PWM', 'caja_vent_trasero', C, S, ('caja', -21.4, 37.0, 3.6), [2, 0, 0], 'sup')
P('caja_vent_trasero_rodamiento', 'Rodamiento (buje fluido) y eje', 'caja_vent_trasero', C, S, ('caja', -20.9, 37.0, 3.6), [6, 0, 0], 'sup')
C, S = 'Cables', 'Cables'
P('cable_ac', 'Cable de poder AC (IEC C13)', None, C, S, ('caja', -25, 6.5, 4.8), [-25, 0, 0], 'sup', disperso=True, fuera=True)
P('cable_atx24', 'Cable ATX de 24 pines', None, C, S, ('caja', 0, 24, -8.6), [14, 0, 18], 'PSUDG', disperso=True)
P('cable_eps1', 'Cable EPS 12 V de 8 pines (CPU1)', None, C, S, ('placa', 5.2, 0.6, 1.4), [0, 14, 12], 'PSUDG', disperso=True)
P('cable_eps2', 'Cable EPS 12 V de 4+4 pines (CPU2)', None, C, S, ('placa', 7.6, 0.6, 1.4), [0, 16, 12], 'PSUDG', disperso=True)
P('cable_12v2x6', 'Cable 12V-2x6 de la tarjeta gráfica (16 pines)', None, C, S, ('gpu', 16, 11.8, 0.5), [0, 0, 26], 'PSUDG', disperso=True)
P('cable_sata_poder', 'Cable de poder SATA', None, C, S, ('caja', 2, 6, -6), [0, 0, 22], 'PSUDG', disperso=True)
P('cable_sata_datos', 'Cables de datos SATA (×2)', None, C, S, ('caja', 5, 18, -6), [0, 0, 24], 'M2SATA', disperso=True)
P('cable_panel_frontal', 'Cable del panel frontal (F_PANEL)', None, C, S, ('caja', 12, 30, -6), [0, 0, 20], 'sup', disperso=True)
P('cable_usb3_frontal', 'Cable USB 3.2 Gen 1 frontal (19 pines)', None, C, S, ('caja', 12, 36, -6), [0, 0, 21], 'sup', disperso=True)
P('cable_usbc_frontal', 'Cable USB-C frontal (Key-A, tipo E)', None, C, S, ('caja', 12, 40, -6), [0, 0, 22], 'sup', disperso=True)
P('cable_audio_frontal', 'Cable de audio HD frontal', None, C, S, ('caja', 0, 14, -6), [0, 0, 20], 'sup', disperso=True)
P('cable_ventiladores', 'Cables de los ventiladores (PWM de 4 pines)', None, C, S, ('caja', 0, 30, -6), [0, 0, 19], 'sup', disperso=True)

# ===== FUENTE =====
C = 'Fuente de poder'
S = 'Carcasa y ventilación'
P('psu_carcasa', 'Carcasa de la fuente ATX 850 W', None, C, S, ('fuente', 8, 0, 1.8), [-8, -2, 34], 'PSUDG,RM850X', shell=True, envuelve=True, nota='ATX12V: 150 mm de ancho y 86 mm de alto; 160 mm de fondo como la RM850x.')
P('psu_tapa', 'Tapa con rejilla del ventilador', 'psu_carcasa', C, S, ('fuente', 8, 0, 6.6), [0, -16, 0], 'sup', shell=True, envuelve=True)
P('psu_ventilador', 'Ventilador de 135 mm', 'psu_tapa', C, S, ('fuente', 8, 0, 7.0), [0, 5, 0], 'RM850X', nota='Ítem 0: marco; ítem 1: rotor.')
P('psu_aislante', 'Lámina aislante (mylar)', 'psu_carcasa', C, S, ('fuente', 8, 0, 5.6), [0, -8, 0], 'sup')
S = 'Entrada y filtro EMI'
P('psu_entrada_iec', 'Entrada IEC C14 con interruptor', 'psu_carcasa', C, S, ('fuente', 1.0, 4.8, 3.0), [-6, 0, 0], 'PSUANAT')
P('psu_fusible', 'Fusible de entrada', 'psu_carcasa', C, S, ('fuente', 2.8, 6.2, 0.6), [0, -4, 2], 'PSUANAT')
P('psu_emi_x', 'Condensadores X del filtro EMI', 'psu_carcasa', C, S, ('fuente', 3.0, 2.6, 1.0), [0, -5, 1], 'PSUANAT', disperso=True)
P('psu_emi_y', 'Condensadores Y del filtro EMI', 'psu_carcasa', C, S, ('fuente', 2.2, -1.0, 0.6), [0, -5, 0], 'PSUANAT', disperso=True)
P('psu_emi_bobinas', 'Bobinas de modo común (×2)', 'psu_carcasa', C, S, ('fuente', 3.8, 4.8, 1.3), [0, -6, 2], 'PSUANAT', disperso=True)
P('psu_mov', 'Varistor (MOV)', 'psu_carcasa', C, S, ('fuente', 2.0, 6.6, 0.6), [0, -4, 3], 'PSUANAT')
P('psu_ntc_rele', 'Termistor NTC y relé de bypass', 'psu_carcasa', C, S, ('fuente', 5.6, 6.7, 0.8), [0, -5, 3], 'RM850X')
S = 'Primario: rectificación y PFC'
P('psu_puente', 'Puente rectificador', 'psu_carcasa', C, S, ('fuente', 5.2, 1.7, 1.4), [0, -7, 0], 'PSUANAT')
P('psu_disipador_primario', 'Disipador del primario', 'psu_carcasa', C, S, ('fuente', 8.5, 1.2, 1.8), [0, -9, -1], 'sup')
P('psu_pfc_bobina', 'Bobina del PFC activo', 'psu_carcasa', C, S, ('fuente', 6.8, 4.8, 1.0), [0, -8, 2], 'PSUANAT')
P('psu_pfc_mosfets', 'MOSFET del PFC', 'psu_carcasa', C, S, ('fuente', 9.4, 1.7, 1.5), [0, -7, 0], 'PSUANAT', disperso=True)
P('psu_pfc_diodo', 'Diodo de refuerzo (boost) del PFC', 'psu_carcasa', C, S, ('fuente', 10.6, 1.7, 1.5), [0, -7, 0], 'PSUANAT')
P('psu_pfc_controlador', 'Controlador del PFC', 'psu_carcasa', C, S, ('fuente', 5.0, -2.6, 0.15), [0, -4, 0], 'PSUANAT')
P('psu_bulk', 'Condensador de bulk (~400 V)', 'psu_carcasa', C, S, ('fuente', 10.0, 5.2, 2.0), [0, -10, 3], 'PSUANAT', nota='Guarda energía para el tiempo de sostén T5 (> 11 ms, PSUDG tabla 4-10). Queda cargado con la fuente desenchufada.')
S = 'Primario: conversión LLC'
P('psu_llc_mosfets', 'MOSFET del medio puente LLC', 'psu_carcasa', C, S, ('fuente', 11.8, 1.7, 1.5), [0, -7, 0], 'PSUANAT', disperso=True)
P('psu_llc_controlador', 'Controlador resonante LLC', 'psu_carcasa', C, S, ('fuente', 5.0, -4.0, 0.15), [0, -4, 0], 'PSUANAT')
P('psu_llc_bobina', 'Bobina resonante', 'psu_carcasa', C, S, ('fuente', 8.0, -1.5, 1.2), [0, -8, 0], 'PSUANAT')
P('psu_llc_condensador', 'Condensador resonante', 'psu_carcasa', C, S, ('fuente', 6.6, -1.2, 0.8), [0, -6, 0], 'PSUANAT')
P('psu_transformador', 'Transformador principal', 'psu_carcasa', C, S, ('fuente', 11.0, -1.6, 1.8), [0, -11, -2], 'PSUANAT')
P('psu_optoacopladores', 'Optoacopladores (realimentación aislada)', 'psu_carcasa', C, S, ('fuente', 8.6, -4.6, 0.2), [0, -4, -1], 'PSUANAT', disperso=True)
S = 'Standby 5VSB'
P('psu_5vsb_trafo', 'Transformador del standby (5VSB)', 'psu_carcasa', C, S, ('fuente', 4.4, -5.6, 1.0), [0, -6, -2], 'PSUANAT')
P('psu_5vsb_controlador', 'Controlador flyback del 5VSB', 'psu_carcasa', C, S, ('fuente', 2.8, -5.2, 0.2), [0, -4, -2], 'PSUANAT')
S = 'Secundario y salida'
P('psu_rect_sinc', 'MOSFET de rectificación síncrona 12 V', 'psu_carcasa', C, S, ('fuente', 13.4, -1.6, 0.5), [0, -6, -2], 'PSUANAT', disperso=True)
P('psu_disipador_secundario', 'Disipador del secundario', 'psu_carcasa', C, S, ('fuente', 13.4, 1.0, 1.4), [0, -8, 1], 'sup')
P('psu_cond_salida', 'Condensadores de salida (electrolíticos y de polímero)', 'psu_carcasa', C, S, ('fuente', 14.4, 4.0, 0.9), [0, -7, 3], 'PSUANAT', disperso=True)
P('psu_dcdc', 'Placa DC-DC de 5 V y 3,3 V', 'psu_carcasa', C, S, ('fuente', 14.0, -5.0, 2.0), [0, -9, -3], 'PSUANAT')
P('psu_dcdc_mosfets', 'MOSFET de los conversores DC-DC', 'psu_dcdc', C, S, ('fuente', 13.6, -4.7, 2.2), [0, 0, 2], 'PSUANAT', disperso=True)
P('psu_dcdc_bobinas', 'Bobinas de los conversores DC-DC', 'psu_dcdc', C, S, ('fuente', 14.4, -4.6, 1.4), [0, 0, 3], 'PSUANAT', disperso=True)
P('psu_dcdc_controlador', 'Controlador PWM de los DC-DC', 'psu_dcdc', C, S, ('fuente', 14.0, -4.8, 3.2), [0, 0, 2.5], 'PSUANAT')
P('psu_supervisor', 'Supervisor (OVP, UVP, OCP, OTP y PWR_OK)', 'psu_carcasa', C, S, ('fuente', 12.0, -5.9, 0.2), [0, -5, -2], 'PSUDG')
P('psu_placa_principal', 'Placa principal (PCB) de la fuente', 'psu_carcasa', C, S, ('fuente', 8.0, 0, -0.08), [0, 3, 0], 'sup')
P('psu_placa_modular', 'Placa modular', 'psu_carcasa', C, S, ('fuente', 15.6, 0, 4.0), [6, 0, 0], 'RM850X')
P('psu_conectores_modulares', 'Zócalos modulares (24 pines, EPS, PCIe/12V-2x6, SATA)', 'psu_placa_modular', C, S, ('fuente', 15.9, 0, 4.0), [3, 0, 0], 'PSUDG,RM850X', disperso=True)

# ===== PLACA MADRE =====
C = 'Placa madre'
S = 'PCB'
P('mb_pcb', 'Placa madre ATX Z690 (PCB de 6-8 capas)', None, C, S, ('placa', 12.19, 15.24, -0.08), [0, 0, 8], 'ATX22', nota='305 x 244 mm (ATX 2.2 §3.1). Número de capas: supuesto típico de una Z690 de gama media.')
P('mb_pcb_corte', 'Corte didáctico de las capas del PCB', 'mb_pcb', C, S, ('placa', 1.5, 30.0, -0.08), [-6, -4, 6], 'sup', nota='Bloque de 1 x 0,5 cm en la esquina inferior trasera, con las capas separadas: señal, tierra, potencia, núcleo y prepreg.')
S = 'Zócalo y retención'
P('mb_socket', 'Zócalo LGA1700 (cuerpo)', 'mb_pcb', C, S, ('placa', 12.5, 9.0, 0.13), [0, 0, 3], 'LGA1700', envuelve=True)
P('mb_socket_contactos', 'Contactos del zócalo (1700 resortes)', 'mb_socket', C, S, ('placa', 12.5, 9.0, 0.2), [0, 0, 1.5], 'LGA1700')
P('mb_ilm_marco', 'Placa de carga del ILM', 'mb_socket', C, S, ('placa', 12.5, 9.0, 0.5), [0, 0, 6], 'LGA1700', envuelve=True)
P('mb_ilm_palanca', 'Palanca del ILM', 'mb_ilm_marco', C, S, ('placa', 16.0, 9.0, 0.4), [3, 0, 1], 'LGA1700')
P('mb_ilm_backplate', 'Contraplaca del ILM (reverso)', 'mb_socket', C, S, ('placa', 12.5, 9.0, -0.3), [0, 0, -9], 'LGA1700', envuelve=True)
P('mb_socket_mlcc', 'Condensadores MLCC bajo el zócalo (reverso)', 'mb_socket', C, S, ('placa', 12.5, 9.0, -0.2), [0, 0, -6], 'sup', disperso=True)
S = 'VRM del CPU'
P('mb_vrm_controlador', 'Controlador PWM digital multifase', 'mb_pcb', C, S, ('placa', 16.8, 4.0, 0.05), [0, 0, 4], 'VRM')
P('mb_vrm_etapas_sup', 'Etapas de potencia Vcore, fila superior (7 DrMOS)', 'mb_pcb', C, S, ('placa', 10.5, 2.6, 0.05), [0, 0, 4], 'VRM', disperso=True)
P('mb_vrm_etapas_izq', 'Etapas de potencia Vcore, columna izquierda (8 DrMOS)', 'mb_pcb', C, S, ('placa', 4.9, 8.5, 0.05), [0, 0, 4], 'VRM', disperso=True)
P('mb_vrm_etapa_gt', 'Etapa de potencia VccGT (gráficos integrados)', 'mb_pcb', C, S, ('placa', 16.8, 2.6, 0.05), [0, 0, 4], 'VRM')
P('mb_vrm_etapa_aux', 'Etapa de potencia VccIN_AUX', 'mb_pcb', C, S, ('placa', 4.9, 13.4, 0.05), [0, 0, 4], 'VRM')
P('mb_vrm_bobinas_sup', 'Bobinas (chokes) del VRM, fila superior', 'mb_pcb', C, S, ('placa', 11.0, 3.6, 0.5), [0, 0, 6], 'VRM', disperso=True)
P('mb_vrm_bobinas_izq', 'Bobinas (chokes) del VRM, columna izquierda', 'mb_pcb', C, S, ('placa', 6.0, 8.5, 0.5), [0, 0, 6], 'VRM', disperso=True)
P('mb_vrm_cond_sup', 'Condensadores de polímero del VRM, fila superior', 'mb_pcb', C, S, ('placa', 11.0, 4.5, 0.4), [0, 0, 7], 'VRM', disperso=True)
P('mb_vrm_cond_izq', 'Condensadores de polímero del VRM, columna izquierda', 'mb_pcb', C, S, ('placa', 7.2, 8.5, 0.4), [0, 0, 7], 'VRM', disperso=True)
P('mb_vrm_almohadillas_sup', 'Almohadilla térmica del VRM superior', 'mb_pcb', C, S, ('placa', 11.0, 2.6, 0.17), [0, 0, 9], 'sup')
P('mb_vrm_almohadillas_izq', 'Almohadilla térmica del VRM izquierdo', 'mb_pcb', C, S, ('placa', 4.9, 8.5, 0.17), [0, 0, 9], 'sup')
P('mb_vrm_disipador_sup', 'Disipador del VRM superior', 'mb_pcb', C, S, ('placa', 11.0, 2.3, 1.6), [0, 0, 12], 'sup', shell=True)
P('mb_vrm_disipador_izq', 'Disipador del VRM izquierdo', 'mb_pcb', C, S, ('placa', 4.9, 8.5, 1.8), [0, 0, 12], 'sup', shell=True)
P('mb_vrm_detalle', 'DrMOS en corte: encapsulado QFN y lead frame', 'mb_pcb', C, S, ('placa', 15.6, 2.6, 0.05), [0, 0, 5], 'VRM', nota='Es la 16.ª etapa Vcore, dibujada abierta para ver sus tres chips.')
P('mb_vrm_detalle_driver', 'DrMOS: driver de compuerta', 'mb_vrm_detalle', C, S, ('placa', 15.6, 2.45, 0.08), [0, 0, 2], 'VRM')
P('mb_vrm_detalle_hs', 'DrMOS: MOSFET del lado alto (high-side)', 'mb_vrm_detalle', C, S, ('placa', 15.45, 2.75, 0.08), [0, 0, 3], 'VRM')
P('mb_vrm_detalle_ls', 'DrMOS: MOSFET del lado bajo (low-side)', 'mb_vrm_detalle', C, S, ('placa', 15.75, 2.75, 0.08), [0, 0, 4], 'VRM')
S = 'Conectores de poder'
P('mb_eps1', 'Conector EPS 12 V de 8 pines (CPU1)', 'mb_pcb', C, S, ('placa', 5.2, 0.75, 0.55), [0, 0, 3], 'PSUDG', envuelve=True)
P('mb_eps2', 'Conector EPS 12 V de 8 pines (CPU2)', 'mb_pcb', C, S, ('placa', 7.6, 0.75, 0.55), [0, 0, 3], 'PSUDG', envuelve=True)
P('mb_atx24', 'Conector ATX de 24 pines', 'mb_pcb', C, S, ('placa', 23.4, 10.6, 0.6), [0, 0, 3], 'PSUDG', envuelve=True)
S = 'Chipset'
P('mb_pch', 'Chipset Z690 (PCH)', 'mb_pcb', C, S, ('placa', 18.0, 23.5, 0.1), [0, 0, 3], 'PCH600')
P('mb_pch_die', 'Die del PCH', 'mb_pch', C, S, ('placa', 18.0, 23.5, 0.22), [0, 0, 2], 'PCH600')
P('mb_pch_disipador', 'Disipador del chipset', 'mb_pcb', C, S, ('placa', 18.0, 23.5, 0.6), [0, 0, 9], 'sup', shell=True)
S = 'Memoria (zócalos)'
for k, u in [('a1', 18.0), ('a2', 18.8), ('b1', 19.6), ('b2', 20.4)]:
    P(f'mb_dimm_{k}', f'Zócalo DIMM DDR5 {k.upper()}', 'mb_pcb', C, S, ('placa', u, 8.6, 0.45), [0, 0, 2], 'INTEL12', envuelve=True)
S = 'Ranuras de expansión'
P('mb_pcie1', 'Ranura PCIe 5.0 x16 (CPU) con refuerzo metálico', 'mb_pcb', C, S, ('placa', 8.75, pc(1), 0.55), [0, 0, 2], 'INTEL12,ATX22', envuelve=True)
P('mb_pcie2', 'Ranura PCIe 3.0 x1 (PCH)', 'mb_pcb', C, S, ('placa', 5.55, pc(2), 0.55), [0, 0, 2], 'PCH600,ATX22', envuelve=True)
P('mb_pcie3', 'Ranura PCIe 4.0 x16 (eléctrica x4, PCH)', 'mb_pcb', C, S, ('placa', 8.75, pc(4), 0.55), [0, 0, 2], 'PCH600,ATX22', envuelve=True)
P('mb_pcie4', 'Ranura PCIe 3.0 x1 (PCH), inferior', 'mb_pcb', C, S, ('placa', 5.55, pc(6), 0.55), [0, 0, 2], 'PCH600,ATX22', envuelve=True)
S = 'Almacenamiento'
P('mb_m2_1', 'Zócalo M.2 llave M (CPU, PCIe 4.0 x4)', 'mb_pcb', C, S, ('placa', 13.8, 14.6, 0.3), [0, 0, 2], 'INTEL12,M2SATA', envuelve=True)
P('mb_m2_1_disipador', 'Disipador del M.2 (CPU)', 'mb_pcb', C, S, ('placa', 9.6, 14.6, 1.1), [0, 0, 16], 'sup')
P('mb_m2_2', 'Zócalo M.2 llave M (PCH, PCIe 4.0 x4)', 'mb_pcb', C, S, ('placa', 13.2, pc(3), 0.3), [0, 0, 2], 'PCH600,M2SATA', envuelve=True)
P('mb_m2_2_disipador', 'Disipador del M.2 (PCH)', 'mb_pcb', C, S, ('placa', 9.0, pc(3), 0.9), [0, 0, 10], 'sup')
P('mb_sata', 'Puertos SATA 6 Gb/s (×4, en ángulo recto)', 'mb_pcb', C, S, ('placa', 23.6, 23.5, 0.5), [4, 0, 2], 'PCH600,M2SATA', envuelve=True)
S = 'Conectores internos'
P('mb_hdr_fpanel', 'Header del panel frontal (F_PANEL)', 'mb_pcb', C, S, ('placa', 20.5, 29.6, 0.4), [0, -2, 2], 'sup', envuelve=True)
P('mb_hdr_usb2', 'Header USB 2.0 (9 pines)', 'mb_pcb', C, S, ('placa', 16.0, 29.6, 0.4), [0, -2, 2], 'sup', envuelve=True)
P('mb_hdr_usb3', 'Header USB 3.2 Gen 1 (19 pines)', 'mb_pcb', C, S, ('placa', 23.6, 16.2, 0.5), [3, 0, 2], 'sup', envuelve=True)
P('mb_hdr_usbc', 'Header USB-C frontal (Key-A)', 'mb_pcb', C, S, ('placa', 23.6, 14.3, 0.4), [3, 0, 2], 'sup', envuelve=True)
P('mb_hdr_audio', 'Header de audio HD (AAFP)', 'mb_pcb', C, S, ('placa', 2.0, 29.6, 0.4), [0, -2, 2], 'sup', envuelve=True)
P('mb_hdr_ventiladores', 'Headers de ventiladores (CPU_FAN y SYS_FAN, 4 pines)', 'mb_pcb', C, S, ('placa', 14.5, 0.8, 0.4), [0, 0, 2], 'sup', disperso=True, envuelve=True, nota='CPU_FAN en (14,5; 0,8), SYS_FAN1 en (23,4; 2,0), SYS_FAN2 en (9,0; 29,6), en coordenadas de la placa.')
P('mb_hdr_rgb', 'Headers RGB y ARGB', 'mb_pcb', C, S, ('placa', 12.0, 29.6, 0.4), [0, -2, 2], 'sup', envuelve=True)
S = 'Firmware, reloj y diagnóstico'
P('mb_bios', 'Chip de BIOS/UEFI (flash SPI)', 'mb_pcb', C, S, ('placa', 17.5, 27.5, 0.08), [0, 0, 3], 'sup', nota='Flash SPI de 256 Mbit (32 MB), tamaño habitual en Z690: supuesto.')
P('mb_cmos_bateria', 'Pila CMOS CR2032 y su zócalo', 'mb_pcb', C, S, ('placa', 14.0, 26.2, 0.3), [0, 0, 4], 'sup')
P('mb_cmos_jumper', 'Jumper de borrado de CMOS', 'mb_pcb', C, S, ('placa', 17.6, 29.6, 0.3), [0, -2, 2], 'sup')
P('mb_cristales', 'Cristales de cuarzo (reloj del sistema y RTC de 32,768 kHz)', 'mb_pcb', C, S, ('placa', 16.4, 21.0, 0.1), [0, 0, 3], 'sup', disperso=True, nota='Frecuencia del cristal principal del PCH: por verificar en el datasheet 648364.')
P('mb_debug_leds', 'LED de diagnóstico (CPU, DRAM, VGA, BOOT)', 'mb_pcb', C, S, ('placa', 22.4, 5.5, 0.08), [0, 0, 3], 'sup')
S = 'Controladores de E/S'
P('mb_superio', 'Super I/O / controlador embebido (sensores y ventiladores)', 'mb_pcb', C, S, ('placa', 11.0, 28.4, 0.08), [0, 0, 3], 'sup')
P('mb_lan', 'Controlador LAN 2,5 GbE', 'mb_pcb', C, S, ('placa', 2.6, 17.6, 0.08), [0, 0, 3], 'sup')
P('mb_audio_codec', 'Códec de audio HD', 'mb_pcb', C, S, ('placa', 2.6, 25.8, 0.08), [0, 0, 3], 'sup')
P('mb_audio_cond', 'Condensadores de audio y línea de aislamiento', 'mb_pcb', C, S, ('placa', 2.2, 22.5, 0.4), [0, 0, 4], 'sup', disperso=True)
S = 'Panel trasero E/S'
P('mb_io_cubierta', 'Cubierta del panel trasero E/S', 'mb_pcb', C, S, ('placa', 2.0, 8.1, 2.1), [0, 0, 10], 'sup', shell=True, envuelve=True)
P('mb_io_escudo', 'Escudo de E/S (I/O shield)', 'mb_pcb', C, S, ('caja', -22.45, 37.2, -5.56), [-12, 0, 0], 'ATX22')
P('mb_io_video', 'Salidas de video del iGPU (HDMI y DisplayPort)', 'mb_pcb', C, S, ('placa', 1.2, 2.5, 1.2), [-4, 0, 2], 'INTEL12')
P('mb_io_usb', 'Puertos USB traseros', 'mb_pcb', C, S, ('placa', 1.2, 6.5, 1.4), [-4, 0, 2], 'PCH600', disperso=True)
P('mb_io_rj45', 'Conector RJ-45 con transformadores (magnetics)', 'mb_pcb', C, S, ('placa', 1.2, 11.5, 1.4), [-4, 0, 2], 'sup')
P('mb_io_audio', 'Jacks de audio traseros', 'mb_pcb', C, S, ('placa', 1.2, 14.6, 1.6), [-4, 0, 2], 'sup')

# ===== CPU, DISIPADOR Y RAM =====
C, S = 'CPU', 'Encapsulado'
P('cpu_sustrato', 'Sustrato del CPU (encapsulado FCLGA1700)', None, C, S, ('placa', 12.5, 9.0, 0.326), [0, 0, 24], 'INTEL12', nota='45 x 37,5 mm, 1,116 mm de espesor (lado largo vertical: supuesto de orientación).')
P('cpu_lands', 'Contactos LGA del CPU (1700 pads dorados)', 'cpu_sustrato', C, S, ('placa', 12.5, 9.0, 0.268), [0, 0, -3], 'INTEL12,LGA1700')
P('cpu_cond_reverso', 'Condensadores del lado de los contactos', 'cpu_sustrato', C, S, ('placa', 12.5, 9.0, 0.25), [0, 0, -2], 'sup', disperso=True)
P('cpu_die', 'Die del CPU (Alder Lake-S 8P+8E, Intel 7)', 'cpu_sustrato', C, S, ('placa', 12.5, 9.0, 0.40), [0, 0, 3], 'INTEL12,ADL', nota='~20,5 x 10,5 mm, 0,37 mm de espesor; centrado en el sustrato: supuesto.')
P('cpu_stim', 'Soldadura térmica (STIM) entre die e IHS', 'cpu_sustrato', C, S, ('placa', 12.5, 9.0, 0.425), [0, 0, 6], 'ADL')
P('cpu_ihs', 'Disipador integrado (IHS) de cobre niquelado', 'cpu_sustrato', C, S, ('placa', 12.5, 9.0, 0.55), [0, 0, 9], 'sup', shell=True, envuelve=True, nota='Altura del IHS: supuesto (encapsulado de ~4,3 mm sobre el plano de asiento).')
S = 'Die (bloques funcionales)'
for id, nom, fte in [('cpu_die_pcores', 'Núcleos P (Golden Cove ×8)', 'ADL'), ('cpu_die_ecores', 'Núcleos E (Gracemont, 2 grupos de 4)', 'ADL'),
                     ('cpu_die_l3', 'Caché L3 compartida (30 MB en 10 bloques)', 'ADL,INTEL12'), ('cpu_die_anillo', 'Bus de anillo (ring interconnect)', 'INTEL12'),
                     ('cpu_die_igpu', 'Gráficos integrados UHD 770 (32 EU)', 'INTEL12'), ('cpu_die_imc', 'Controlador de memoria y PHY DDR5/DDR4', 'INTEL12'),
                     ('cpu_die_pcie', 'Controlador PCIe 5.0/4.0 y DMI 4.0', 'INTEL12'), ('cpu_die_sa', 'Agente de sistema (display, energía y E/S)', 'INTEL12')]:
    P(id, nom, 'cpu_die', C, S, ('placa', 12.5, 9.0, 0.42), [0, 0, 2], fte, disperso=True, nota='Distribución de bloques sobre el die: aproximada (fotos del die sin anotación oficial).')
S = 'Núcleo P en detalle'
for i, (id, nom) in enumerate([('cpu_pcore_frontend', 'Núcleo P: front-end (búsqueda, decodificación y caché de µops)'), ('cpu_pcore_ejecucion', 'Núcleo P: motor de ejecución (ALU, FPU, vectores)'),
                               ('cpu_pcore_memoria', 'Núcleo P: carga/almacenamiento y caché L1'), ('cpu_pcore_l2', 'Núcleo P: caché L2 (1,25 MB)')]):
    P(id, nom, 'cpu_die_pcores', C, S, ('placa', 12.5 - 0.6 + i * 0.4, 7.0, 0.425), [0, 0, 1.5 + i * 0.6], 'ADL', nota='Bloques internos del núcleo: esquema didáctico, proporciones aproximadas.')
C, S = 'CPU', 'Interfaz térmica'
P('cpu_pasta', 'Pasta térmica', None, C, S, ('placa', 12.5, 9.0, 0.71), [0, 0, 30], 'sup')
C, S = 'Disipador del CPU', 'Disipador de torre'
P('cooler_backplate', 'Contraplaca del disipador', None, C, S, ('placa', 12.5, 9.0, -0.45), [0, 0, -20], 'LGA1700', disperso=True)
P('cooler_soporte', 'Soporte y barras de montaje (78 x 78 mm)', None, C, S, ('placa', 12.5, 9.0, 1.0), [0, 0, 34], 'LGA1700', disperso=True)
P('cooler_aletas', 'Torre de aletas de aluminio', None, C, S, ('placa', 12.5, 9.0, 10.0), [-4, 0, 44], 'sup', envuelve=True)
P('cooler_heatpipes', 'Heatpipes de cobre (×4, 6 mm)', 'cooler_aletas', C, S, ('placa', 12.5, 9.0, 4.0), [0, 0, -3], 'sup', disperso=True)
P('cooler_base', 'Base de contacto de cobre niquelado', 'cooler_aletas', C, S, ('placa', 12.5, 9.0, 1.0), [0, 0, -6], 'sup')
P('cooler_ventilador', 'Ventilador del disipador de 120 mm', None, C, S, ('placa', 16.25, 9.0, 10.0), [14, 0, 40], 'sup', nota='Ítem 0: marco; ítem 1: rotor.')
P('cooler_clips', 'Clips del ventilador', 'cooler_ventilador', C, S, ('placa', 15.1, 9.0, 10.0), [2, 0, 0], 'sup', disperso=True)
C = 'Memoria RAM'
for k, u, ex in [('a2', 18.8, 6), ('b2', 20.4, 11)]:
    S = f'Módulo DDR5 {k.upper()}'
    K = k.upper()
    P(f'ram_{k}_pcb', f'PCB del módulo DDR5-4800 16 GB ({K})', None, C, S, ('placa', u, 8.6, 2.2), [ex, 0, 22], 'DDR5', nota='133,35 mm de largo; 288 contactos (JEDEC).')
    P(f'ram_{k}_chips', f'Chips DRAM DDR5 de 16 Gb (×8, {K})', f'ram_{k}_pcb', C, S, ('placa', u + 0.15, 8.6, 2.4), [2, 0, 0], 'DDR5', disperso=True, nota='16 GB en un rango de 8 chips x8: supuesto típico.')
    P(f'ram_{k}_pmic', f'PMIC del módulo ({K})', f'ram_{k}_pcb', C, S, ('placa', u + 0.15, 1.9, 3.2), [2, 0, 1], 'DDR5')
    P(f'ram_{k}_spd', f'SPD hub con sensor de temperatura ({K})', f'ram_{k}_pcb', C, S, ('placa', u + 0.15, 8.6, 3.4), [2, 0, 1.5], 'DDR5')
    P(f'ram_{k}_contactos', f'Contactos dorados (288 pines, {K})', f'ram_{k}_pcb', C, S, ('placa', u, 8.6, 0.85), [0, 0, -2], 'DDR5')
    P(f'ram_{k}_disipador', f'Disipador del módulo (heatspreader, {K})', f'ram_{k}_pcb', C, S, ('placa', u, 8.6, 2.5), [5, 0, 0], 'sup', shell=True, envuelve=True)

# ===== GPU Y ALMACENAMIENTO =====
C = 'Tarjeta gráfica'
S = 'PCB y componentes'
P('gpu_pcb', 'PCB de la tarjeta gráfica', None, C, S, ('gpu', 9.0, 5.8, 0), [0, -14, 30], 'RTX4070', nota='Tarjeta de 2 ranuras, 24,4 cm de largo (referencial RTX 4070 FE).')
P('gpu_contactos', 'Conector de borde PCIe x16 (contactos dorados)', 'gpu_pcb', C, S, ('gpu', 9.5, 0.4, 0), [0, 0, -3], 'RTX4070')
P('gpu_bracket', 'Soporte trasero (bracket)', 'gpu_pcb', C, S, ('gpu', 0.05, 5.5, 1.5), [-5, 0, 0], 'sup')
P('gpu_salidas', 'Salidas de video (3 DisplayPort y 1 HDMI)', 'gpu_pcb', C, S, ('gpu', 0.9, 6.0, 1.0), [-3, 0, 0], 'RTX4070')
P('gpu_die', 'GPU AD104 (encapsulado y die)', 'gpu_pcb', C, S, ('gpu', 9.5, 6.0, 0.15), [0, -3, 0], 'RTX4070')
for id, nom in [('gpu_die_gpcs', 'Clústeres de procesamiento (GPC y SM)'), ('gpu_die_l2', 'Caché L2 de la GPU'), ('gpu_die_mem', 'Controladores de memoria (6 × 32 bits)')]:
    P(id, nom, 'gpu_die', C, S, ('gpu', 9.5, 6.0, 0.25), [0, -1.5, 0], 'RTX4070', disperso=True, nota='Distribución aproximada; tamaño de la L2 del RTX 4070: por verificar.')
P('gpu_vram', 'Memoria GDDR6X (6 chips de 2 GB, 192 bits)', 'gpu_pcb', C, S, ('gpu', 9.5, 6.0, 0.1), [0, -2, 0], 'RTX4070', disperso=True)
P('gpu_vrm_etapas', 'Etapas de potencia del VRM de la GPU', 'gpu_pcb', C, S, ('gpu', 14.5, 6.0, 0.1), [0, -2, 0], 'RTX4070', disperso=True)
P('gpu_vrm_bobinas', 'Bobinas del VRM de la GPU', 'gpu_pcb', C, S, ('gpu', 15.5, 6.0, 0.4), [0, -2.5, 0], 'RTX4070', disperso=True)
P('gpu_vrm_controlador', 'Controlador PWM de la GPU', 'gpu_pcb', C, S, ('gpu', 12.5, 9.8, 0.1), [0, -2, 0], 'sup')
P('gpu_condensadores', 'Condensadores de la GPU (polímero y MLCC)', 'gpu_pcb', C, S, ('gpu', 16.6, 6.0, 0.4), [0, -2.5, 0], 'sup', disperso=True)
P('gpu_conector_12v', 'Conector 12V-2x6 (16 pines)', 'gpu_pcb', C, S, ('gpu', 16.0, 10.6, 0.5), [0, 0, 2], 'RTX4070,PSUDG', envuelve=True)
P('gpu_bios', 'BIOS de la GPU (flash SPI)', 'gpu_pcb', C, S, ('gpu', 4.5, 9.5, 0.05), [0, -2, 0], 'sup')
S = 'Refrigeración y carcasa'
P('gpu_backplate', 'Placa trasera (backplate)', 'gpu_pcb', C, S, ('gpu', 12.2, 5.6, -0.35), [0, 6, 0], 'RTX4070')
P('gpu_almohadillas', 'Almohadillas térmicas (VRAM y VRM)', 'gpu_pcb', C, S, ('gpu', 12.0, 6.0, 0.3), [0, -4, 0], 'sup', disperso=True)
P('gpu_pasta', 'Pasta térmica de la GPU', 'gpu_pcb', C, S, ('gpu', 9.5, 6.0, 0.32), [0, -5, 0], 'sup')
P('gpu_camara_vapor', 'Cámara de vapor', 'gpu_pcb', C, S, ('gpu', 11.0, 5.6, 0.6), [0, -7, 0], 'RTX4070')
P('gpu_aletas', 'Aletas de aluminio de la GPU', 'gpu_pcb', C, S, ('gpu', 12.5, 5.6, 2.0), [0, -11, 0], 'RTX4070', envuelve=True)
P('gpu_heatpipes', 'Heatpipes de la GPU', 'gpu_aletas', C, S, ('gpu', 12.0, 5.6, 1.5), [0, 2, 0], 'RTX4070', disperso=True)
P('gpu_cubierta', 'Cubierta (shroud) de la GPU', 'gpu_pcb', C, S, ('gpu', 12.2, 5.6, 3.3), [0, -14, 0], 'RTX4070', shell=True, envuelve=True)
P('gpu_vent_1', 'Ventilador de la GPU (1)', 'gpu_pcb', C, S, ('gpu', 7.0, 5.6, 3.6), [0, -18, 0], 'RTX4070', nota='Ítem 0: marco; ítem 1: rotor.')
P('gpu_vent_2', 'Ventilador de la GPU (2)', 'gpu_pcb', C, S, ('gpu', 18.5, 5.6, 3.6), [0, -18, 0], 'RTX4070', nota='Ítem 0: marco; ítem 1: rotor.')
C, S = 'SSD NVMe', 'SSD NVMe M.2 2280'
P('nvme_pcb', 'PCB del SSD NVMe M.2 2280', None, C, S, ('placa', 9.6, 14.6, 0.5), [0, 0, 16], '990PRO,M2SATA')
P('nvme_controlador', 'Controlador NVMe (ARM, 8 nm, PCIe 4.0 x4)', 'nvme_pcb', C, S, ('placa', 11.8, 14.6, 0.6), [0, 0, 2], '990PRO')
P('nvme_dram', 'Caché DRAM LPDDR4 del SSD', 'nvme_pcb', C, S, ('placa', 10.4, 14.6, 0.6), [0, 0, 2.5], '990PRO')
P('nvme_nand', 'Memoria flash NAND 3D TLC (×2 encapsulados)', 'nvme_pcb', C, S, ('placa', 7.7, 14.6, 0.6), [0, 0, 3], '990PRO', disperso=True)
P('nvme_pmic', 'PMIC del SSD', 'nvme_pcb', C, S, ('placa', 12.9, 14.6, 0.58), [0, 0, 2], 'sup')
P('nvme_conector', 'Conector de borde M.2 llave M', 'nvme_pcb', C, S, ('placa', 13.45, 14.6, 0.5), [2, 0, 0], 'M2SATA')
P('nvme_etiqueta', 'Etiqueta disipadora (cobre)', 'nvme_pcb', C, S, ('placa', 9.6, 14.6, 0.68), [0, 0, 4], '990PRO')
C, S = 'SSD SATA', 'SSD SATA 2,5"'
P('ssd_carcasa_inf', 'Carcasa inferior del SSD SATA', None, C, S, ('ssd', 5, 0, 0.2), [0, 0, -22], 'M2SATA', envuelve=True)
P('ssd_carcasa_sup', 'Carcasa superior del SSD SATA', 'ssd_carcasa_inf', C, S, ('ssd', 5, 0, 0.6), [0, 0, -7], 'M2SATA', shell=True, envuelve=True)
P('ssd_pcb', 'PCB del SSD SATA', 'ssd_carcasa_inf', C, S, ('ssd', 4, 0, 0.3), [0, 0, -3], 'sup')
P('ssd_controlador', 'Controlador SATA del SSD', 'ssd_pcb', C, S, ('ssd', 3.0, 0, 0.38), [0, 0, -1.5], 'sup')
P('ssd_nand', 'Memoria flash NAND del SSD SATA', 'ssd_pcb', C, S, ('ssd', 5.5, 0, 0.38), [0, 0, -2], 'sup', disperso=True)
P('ssd_dram', 'Caché DRAM del SSD SATA', 'ssd_pcb', C, S, ('ssd', 3.0, 2.0, 0.38), [0, 0, -1.5], 'sup')
P('ssd_conector', 'Conector SATA (datos 7 + poder 15 contactos)', 'ssd_pcb', C, S, ('ssd', 0.2, 0, 0.35), [-3, 0, 0], 'M2SATA')
C, S = 'Disco duro', 'Disco duro 3,5"'
P('hdd_base', 'Base de aluminio fundido del disco', None, C, S, ('hdd', 7.35, 0, 1.2), [6, 0, 32], 'M2SATA', shell=True, envuelve=True)
P('hdd_tapa', 'Tapa superior sellada', 'hdd_base', C, S, ('hdd', 7.35, 0, 2.45), [0, 10, 0], 'sup', shell=True)
P('hdd_filtro', 'Filtro de recirculación y desecante', 'hdd_base', C, S, ('hdd', 12.8, -4.3, 1.4), [0, 4, -4], 'sup')
P('hdd_husillo', 'Motor del husillo (spindle)', 'hdd_base', C, S, ('hdd', 9.7, 0, 1.2), [0, 4, 0], 'sup', nota='Ítem 0: estator y base; ítem 1: cubo (gira con los platos).')
P('hdd_platos', 'Platos magnéticos (×2) y abrazadera', 'hdd_husillo', C, S, ('hdd', 9.7, 0, 1.4), [0, 4, 0], 'sup', envuelve=True)
P('hdd_actuador', 'Brazo actuador (E-block) y pivote', 'hdd_base', C, S, ('hdd', 3.0, 3.6, 1.4), [-3, 6, 3], 'sup', disperso=True)
P('hdd_cabezales', 'Cabezales de lectura/escritura (sliders)', 'hdd_actuador', C, S, ('hdd', 6.6, 1.2, 1.4), [2, 1, 0], 'sup', disperso=True)
P('hdd_vcm_bobina', 'Bobina del motor de voz (VCM)', 'hdd_actuador', C, S, ('hdd', 1.6, 4.4, 1.4), [-2, 0, 0], 'sup')
P('hdd_vcm_imanes', 'Imanes de neodimio del VCM', 'hdd_base', C, S, ('hdd', 1.6, 4.4, 1.4), [-5, 3, 0], 'sup', envuelve=True)
P('hdd_rampa', 'Rampa de estacionamiento de los cabezales', 'hdd_base', C, S, ('hdd', 8.4, 4.7, 1.4), [0, 3, 3], 'sup')
P('hdd_flex', 'Cable flexible y preamplificador', 'hdd_base', C, S, ('hdd', 2.0, 1.5, 1.0), [-3, 2, 0], 'sup', disperso=True)
P('hdd_pcb', 'Placa controladora del disco (cara inferior)', 'hdd_base', C, S, ('hdd', 7.35, 0, 0.1), [0, -6, 0], 'sup')
P('hdd_soc', 'Controlador (SoC) del disco', 'hdd_pcb', C, S, ('hdd', 6.0, -1.5, 0.17), [0, -2, 0], 'sup')
P('hdd_cache', 'Caché DRAM del disco', 'hdd_pcb', C, S, ('hdd', 8.0, -1.5, 0.17), [0, -2, 0], 'sup')
P('hdd_driver_motor', 'Driver del husillo y del VCM', 'hdd_pcb', C, S, ('hdd', 9.7, 1.6, 0.17), [0, -2, 0], 'sup')
P('hdd_conectores', 'Conectores SATA de datos y poder del disco', 'hdd_base', C, S, ('hdd', 0.25, 0, 0.6), [-4, 0, 0], 'M2SATA')

MODULO = {'Caja': 'caja', 'Cables': 'caja', 'Fuente de poder': 'fuente', 'Placa madre': 'placa', 'CPU': 'cpu_memoria', 'Disipador del CPU': 'cpu_memoria',
          'Memoria RAM': 'cpu_memoria', 'Tarjeta gráfica': 'gpu_almacenamiento', 'SSD NVMe': 'gpu_almacenamiento', 'SSD SATA': 'gpu_almacenamiento', 'Disco duro': 'gpu_almacenamiento'}
PRESUPUESTO = {'caja': 260, 'fuente': 240, 'placa': 380, 'cpu_memoria': 220, 'gpu_almacenamiento': 300, 'total_mallas': 1400, 'total_triangulos': 600000}

# ---------------- recorridos ----------------
# quita/pone: ids o comodines (fnmatch); «!patrón» excluye. Cada id sale (o entra) una sola vez: el comodín toma solo lo que queda.
DESARME = [
    ('Apagar y desconectar', ['cable_ac'], ['psu_entrada_iec', 'caja_boton_power'], 'trasera', 'A mano',
     'Apagar desde el sistema operativo, poner el interruptor de la fuente en O y desenchufar el cable de poder. Mantener presionado el botón de encendido unos segundos para descargar lo que quede en los circuitos de standby.', 'Con el cable conectado la fuente sigue entregando 5VSB a la placa aunque el equipo esté apagado.'),
    ('Descargar la electricidad estática', [], ['caja_chasis'], 'general', 'Pulsera antiestática',
     'Trabajar sobre una mesa sin alfombra, tocar una parte metálica sin pintura del chasis o usar una pulsera antiestática conectada al chasis.', None),
    ('Retirar el panel de vidrio', ['caja_panel_vidrio'], [], 'general', 'A mano (tornillos moleteados)', 'Soltar los tornillos moleteados traseros y retirar el vidrio sujetándolo por los bordes; dejarlo acostado sobre un paño.', 'El vidrio templado se rompe entero si recibe un golpe en el canto.'),
    ('Retirar el panel derecho', ['caja_panel_derecho'], [], 'general', 'A mano', 'Retirar el panel derecho para tener acceso a la cara trasera de la bandeja, donde pasan los cables.', None),
    ('Desconectar el cable 12V-2x6 de la tarjeta gráfica', ['cable_12v2x6'], ['gpu_conector_12v'], 'gpu', 'A mano', 'Presionar la traba del conector de 16 pines y tirar recto, sin balancearlo.', None),
    ('Retirar la tarjeta gráfica', ['gpu_*'], ['mb_pcie1', 'caja_tapas_slots'], 'gpu', 'Destornillador Phillips n.º 2', 'Sacar los tornillos del bracket, liberar la traba de la ranura PCIe x16 y retirar la tarjeta tomándola por los bordes.', 'No tirar de la tarjeta sin soltar la traba: se dañan la ranura y los contactos.'),
    ('Retirar el SSD SATA', ['cable_sata_datos', 'ssd_*'], ['caja_soporte_ssd'], 'trasera_bandeja', 'Destornillador Phillips n.º 1', 'Desconectar los cables de datos y de poder SATA y soltar el SSD de su soporte detrás de la bandeja.', None),
    ('Retirar el disco duro', ['cable_sata_poder', 'hdd_*'], ['caja_jaula_hdd'], 'almacenamiento', 'A mano', 'Desconectar el disco y deslizarlo fuera de la jaula. Tomarlo por los costados, nunca por la placa.', 'Un golpe con el disco funcionando o recién detenido puede dañar platos y cabezales.'),
    ('Desconectar el panel frontal', ['cable_panel_frontal', 'cable_usb3_frontal', 'cable_usbc_frontal', 'cable_audio_frontal'], ['mb_hdr_fpanel', 'mb_hdr_usb3', 'mb_hdr_usbc', 'mb_hdr_audio'], 'placa_inferior', 'A mano', 'Anotar o fotografiar la posición de los cables del panel frontal antes de soltarlos. El cable USB 3 se saca tirando del conector, no del cable.', None),
    ('Desconectar los ventiladores', ['cable_ventiladores'], ['mb_hdr_ventiladores'], 'interior', 'A mano', 'Soltar los conectores de 4 pines de los ventiladores de la caja y del disipador.', None),
    ('Desconectar la alimentación de la placa', ['cable_atx24', 'cable_eps1', 'cable_eps2'], ['mb_atx24', 'mb_eps1', 'mb_eps2'], 'interior', 'A mano', 'Apretar la traba y sacar el conector de 24 pines y los dos EPS de 8 pines del CPU.', None),
    ('Retirar los módulos de memoria', ['ram_*'], ['mb_dimm_a2', 'mb_dimm_b2'], 'ram', 'A mano', 'Abrir las trabas de los zócalos A2 y B2 y retirar cada módulo recto hacia afuera.', None),
    ('Retirar el ventilador del disipador', ['cooler_ventilador', 'cooler_clips'], [], 'cpu', 'A mano', 'Soltar los clips y retirar el ventilador de 120 mm.', None),
    ('Retirar el disipador y su contraplaca', ['cooler_aletas', 'cooler_heatpipes', 'cooler_base', 'cooler_soporte', 'cooler_backplate'], [], 'cpu', 'Destornillador Phillips n.º 2', 'Aflojar los tornillos del soporte en cruz, media vuelta cada uno, y girar suavemente el disipador antes de levantarlo para despegar la pasta.', 'Levantarlo sin girar puede arrancar el CPU del zócalo.'),
    ('Limpiar la pasta térmica', ['cpu_pasta'], ['cpu_ihs'], 'cpu', 'Alcohol isopropílico y paño sin pelusa', 'Limpiar la pasta del IHS y de la base del disipador.', None),
    ('Abrir el ILM y retirar el CPU', ['cpu_*'], ['mb_ilm_palanca', 'mb_ilm_marco', 'mb_socket'], 'socket', 'A mano', 'Bajar y destrabar la palanca, abrir la placa de carga y sacar el CPU vertical, sujeto por los bordes. Poner la tapa protectora PnP en el zócalo.', 'Los 1700 contactos del zócalo son resortes muy finos: no tocarlos ni dejar caer nada sobre ellos.'),
    ('Retirar el SSD NVMe', ['mb_m2_1_disipador', 'nvme_*'], ['mb_m2_1'], 'm2', 'Destornillador Phillips n.º 0', 'Retirar el disipador del M.2, soltar el tornillo o la traba del extremo y sacar el SSD en ángulo de unos 30°.', None),
    ('Retirar la placa madre', ['caja_tornillos_placa', 'mb_*'], ['caja_separadores'], 'interior', 'Destornillador Phillips n.º 2', 'Sacar los 9 tornillos y levantar la placa desde los bordes, inclinándola para que el panel de E/S salga del escudo.', None),
    ('Retirar la fuente', ['psu_*'], ['caja_cubierta_fuente'], 'fuente', 'Destornillador Phillips n.º 2', 'Sacar los 4 tornillos de la cara trasera y deslizar la fuente fuera de la cubierta.', 'No abrir la fuente: el condensador de bulk puede quedar cargado a unos 400 V.'),
    ('Retirar los ventiladores de la caja', ['caja_vent_*'], [], 'general', 'Destornillador Phillips n.º 2', 'Sacar los 4 tornillos de cada ventilador.', None),
    ('Retirar el frontal y los filtros', ['caja_frontal', 'caja_filtro_*'], [], 'frontal', 'A mano', 'Tirar del frontal desde abajo para soltar sus clips y retirar los filtros de polvo.', None),
    ('Retirar el panel superior y el panel E/S frontal', ['caja_panel_superior', 'caja_io_placa', 'caja_boton_*', 'caja_leds', 'caja_usb_*', 'caja_jack_audio'], [], 'frontal', 'Destornillador Phillips n.º 1', 'Soltar el panel superior y la placa del panel frontal con sus botones y puertos.', None),
    ('Desarmar la estructura', ['caja_*', '!caja_chasis'], ['caja_chasis'], 'general', 'Destornillador Phillips n.º 2', 'Retirar la cubierta de la fuente, la jaula de discos, el soporte del SSD, las tapas de las ranuras, los separadores y las patas. Queda el chasis.', None),
]
ENSAMBLADO = [
    ('Preparar la caja', ['caja_chasis', 'caja_bandeja', 'caja_separadores', 'caja_cubierta_fuente', 'caja_jaula_hdd', 'caja_soporte_ssd', 'caja_tapas_slots', 'caja_patas', 'caja_ojales'], 'Revisar que los separadores coincidan con los agujeros ATX de la placa (9) y que no sobre ninguno: un separador sin agujero hace cortocircuito con el reverso de la placa.'),
    ('Frontal, filtros, panel E/S y ventiladores', ['caja_frontal', 'caja_filtro_*', 'caja_panel_superior', 'caja_io_placa', 'caja_boton_*', 'caja_leds', 'caja_usb_*', 'caja_jack_audio', 'caja_vent_*'], 'Ventiladores frontales como entrada y el trasero como salida (la flecha del marco indica el sentido del aire).'),
    ('Placa madre sobre la mesa', ['mb_*', '!mb_m2_1_disipador'], 'Sobre su caja de cartón, nunca sobre la bolsa antiestática (su cara exterior conduce).'),
    ('Instalar el CPU', ['cpu_*', '!cpu_pasta'], 'Alinear el triángulo dorado y las muescas con el zócalo, apoyarlo sin deslizar y cerrar el ILM; la tapa PnP salta sola.'),
    ('Instalar el SSD NVMe', ['nvme_*', 'mb_m2_1_disipador'], 'Insertar en ángulo en el zócalo M.2 de la CPU, bajarlo y fijarlo; quitar el film de la almohadilla del disipador.'),
    ('Instalar la memoria', ['ram_*'], 'En A2 y B2 para trabajar en doble canal (ver el manual de la placa); presionar hasta que las trabas cierren.'),
    ('Montar el disipador', ['cooler_backplate', 'cooler_soporte', 'cpu_pasta', 'cooler_base', 'cooler_heatpipes', 'cooler_aletas', 'cooler_ventilador', 'cooler_clips'], 'Contraplaca, soporte, una gota de pasta del tamaño de una arveja y apriete en cruz. El ventilador sopla hacia la parte trasera.'),
    ('Instalar la fuente', ['psu_*'], 'Con el ventilador hacia abajo, sobre el filtro inferior; conectar a la fuente solo los cables modulares que se van a usar.'),
    ('Montar la placa en la caja', ['caja_tornillos_placa'], 'Pasar los cables EPS por el ojal superior antes de bajar la placa; calzar el panel E/S en su escudo y atornillar los 9 tornillos sin forzar.'),
    ('Conectar la alimentación de la placa', ['cable_atx24', 'cable_eps1', 'cable_eps2'], 'Conector de 24 pines y los dos EPS de 8 pines del CPU (no confundir con un PCIe de 8 pines: tienen otro pinout).'),
    ('Conectar el panel frontal y los ventiladores', ['cable_panel_frontal', 'cable_usb3_frontal', 'cable_usbc_frontal', 'cable_audio_frontal', 'cable_ventiladores'], 'Seguir el diagrama del header F_PANEL del manual (PWR, RESET, LED+/-).'),
    ('Instalar la tarjeta gráfica', ['gpu_*', 'cable_12v2x6'], 'Quitar las dos tapas de ranura, insertar hasta que cierre la traba, atornillar el bracket y enchufar el 12V-2x6 hasta el fondo.'),
    ('Instalar el almacenamiento SATA', ['ssd_*', 'hdd_*', 'cable_sata_*'], 'SSD detrás de la bandeja y disco en la jaula; datos SATA a la placa y poder SATA a la fuente.'),
    ('Primer encendido con la caja abierta', ['cable_ac'], 'Conectar el monitor a la tarjeta gráfica, enchufar y encender: los LED de diagnóstico se apagan uno a uno (CPU, DRAM, VGA, BOOT) hasta entrar a la UEFI.'),
    ('Ordenar cables y cerrar', ['caja_bridas', 'caja_panel_derecho', 'caja_panel_vidrio'], 'Fijar los cables con bridas detrás de la bandeja y cerrar los paneles.'),
]
# procedimientos secundarios (solo: piezas visibles)
PROCS = [
    ('Fuente por dentro (didáctico)', ['psu_*'], [
        ('Advertencia: no abrir una fuente real', [], ['psu_bulk'], 'Este recorrido es solo para aprender. El condensador de bulk puede retener unos 400 V después de desenchufar y la garantía se pierde al abrir.'),
        ('Tapa y ventilador', ['psu_tapa', 'psu_ventilador'], [], 'El ventilador de 135 mm aspira aire del interior de la caja (o del filtro inferior) y lo saca por la rejilla trasera.'),
        ('Lámina aislante', ['psu_aislante'], [], 'Separa los componentes de alta tensión de la carcasa metálica.'),
        ('Placa modular', ['psu_placa_modular', 'psu_conectores_modulares'], [], 'Lleva los zócalos de los cables modulares y une los rieles de salida de la placa principal.'),
        ('Placa DC-DC', ['psu_dcdc*'], [], 'Dos conversores reductores (buck) síncronos que sacan 5 V y 3,3 V a partir de los 12 V.'),
        ('Secundario', ['psu_rect_sinc', 'psu_disipador_secundario', 'psu_cond_salida', 'psu_supervisor'], [], 'Rectificación síncrona de 12 V con MOSFET, filtrado y el supervisor que vigila los voltajes y entrega PWR_OK.'),
        ('Transformador y etapa LLC', ['psu_transformador', 'psu_llc_*', 'psu_optoacopladores'], [], 'El medio puente LLC conmuta el bus de ~400 V a alta frecuencia; el transformador baja el voltaje y aísla la salida de la red; los optoacopladores llevan la realimentación cruzando la aislación.'),
        ('Standby 5VSB', ['psu_5vsb_*'], [], 'Una pequeña fuente flyback independiente que funciona siempre que haya red: alimenta el encendido.'),
        ('PFC activo y bulk', ['psu_pfc_*', 'psu_bulk'], [], 'Convertidor elevador (boost) que hace que la corriente siga a la sinusoide de la red (factor de potencia cercano a 1) y carga el bulk.'),
        ('Puente rectificador y disipador primario', ['psu_puente', 'psu_disipador_primario'], [], 'El puente rectifica la red; el disipador evacua el calor del puente y de los MOSFET del PFC y del LLC.'),
        ('Entrada y filtro EMI', ['psu_emi_*', 'psu_mov', 'psu_ntc_rele', 'psu_fusible', 'psu_entrada_iec'], [], 'Fusible, varistor, condensadores X e Y y bobinas de modo común: protegen y evitan que el ruido de conmutación vuelva a la red. El NTC limita la corriente de arranque y el relé lo puentea después.'),
    ]),
    ('Disco duro por dentro', ['hdd_*'], [
        ('Tapa sellada', ['hdd_tapa'], [], 'Abrir un disco fuera de una sala limpia lo inutiliza: el polvo es más grande que la altura de vuelo del cabezal.'),
        ('Filtro', ['hdd_filtro'], [], 'Atrapa partículas del aire que mueven los platos y la humedad.'),
        ('Actuador y cabezales', ['hdd_actuador', 'hdd_cabezales', 'hdd_vcm_bobina', 'hdd_rampa'], [], 'El motor de voz (bobina entre imanes) gira el brazo; los cabezales vuelan sobre un colchón de aire de pocos nanómetros y se estacionan en la rampa.'),
        ('Imanes del VCM', ['hdd_vcm_imanes'], [], 'Imanes de neodimio arriba y abajo de la bobina.'),
        ('Platos y husillo', ['hdd_platos', 'hdd_husillo'], [], 'Platos de aluminio o vidrio con capa magnética, girando a 5400-7200 rpm sobre un motor trifásico sin escobillas.'),
        ('Flex y placa controladora', ['hdd_flex', 'hdd_pcb', 'hdd_soc', 'hdd_cache', 'hdd_driver_motor', 'hdd_conectores'], [], 'El SoC codifica los datos y controla los motores; el preamplificador del flex lleva la señal de los cabezales.'),
    ]),
    ('Tarjeta gráfica por dentro', ['gpu_*'], [
        ('Backplate', ['gpu_backplate'], [], 'Rigidiza la tarjeta y disipa algo de calor de la cara trasera.'),
        ('Cubierta y ventiladores', ['gpu_cubierta', 'gpu_vent_1', 'gpu_vent_2'], [], ''),
        ('Aletas, heatpipes y cámara de vapor', ['gpu_aletas', 'gpu_heatpipes', 'gpu_camara_vapor'], [], 'La cámara de vapor toma el calor del die y lo reparte a las aletas.'),
        ('Pasta y almohadillas', ['gpu_pasta', 'gpu_almohadillas'], [], ''),
        ('Bracket y salidas', ['gpu_bracket', 'gpu_salidas'], [], ''),
        ('PCB: GPU, VRAM y VRM', [], ['gpu_die', 'gpu_vram', 'gpu_vrm_etapas', 'gpu_vrm_bobinas', 'gpu_vrm_controlador', 'gpu_conector_12v'], 'Mismo esquema que la placa madre en pequeño: el VRM baja 12 V a ~1 V para el die y la VRAM rodea a la GPU con pistas de igual largo.'),
        ('Die de la GPU', ['gpu_die_*'], [], 'Bloques del AD104: GPC con sus SM, caché L2 y controladores de memoria.'),
    ]),
    ('CPU por dentro (corte didáctico)', ['cpu_*'], [
        ('Pasta', ['cpu_pasta'], [], ''),
        ('IHS', ['cpu_ihs'], [], 'Quitar el IHS (delid) es irreversible y anula la garantía; aquí solo se muestra.'),
        ('Soldadura térmica', ['cpu_stim'], [], 'Une el die con el IHS y conduce el calor mucho mejor que una pasta.'),
        ('Bloques del die', ['cpu_die_*'], [], 'Núcleos P y E, caché L3 y anillo, gráficos, controlador de memoria y PCIe.'),
        ('Un núcleo P por dentro', ['cpu_pcore_*'], [], 'Front-end, ejecución, carga/almacenamiento con L1 y la L2 propia.'),
        ('Sustrato y contactos', [], ['cpu_sustrato', 'cpu_lands', 'cpu_cond_reverso'], 'El sustrato es un PCB de muchas capas que abre las conexiones del die hacia los 1700 contactos.'),
    ]),
    ('Módulo DDR5 por dentro', ['ram_a2_*'], [
        ('Disipador', ['ram_a2_disipador'], [], ''),
        ('Chips, PMIC y SPD', [], ['ram_a2_chips', 'ram_a2_pmic', 'ram_a2_spd'], 'En DDR5 el regulador (PMIC) va en el módulo; el SPD hub guarda los perfiles y mide la temperatura.'),
    ]),
    ('VRM y zócalo del CPU', ['mb_pcb', 'mb_vrm_*', 'mb_socket*', 'mb_ilm_*', 'mb_eps*'], [
        ('Disipadores del VRM', ['mb_vrm_disipador_*', 'mb_vrm_almohadillas_*'], [], ''),
        ('DrMOS abierto', ['mb_vrm_detalle', 'mb_vrm_detalle_*'], [], 'Cada etapa integra el driver y dos MOSFET: el del lado alto conecta a 12 V, el del lado bajo a tierra; juntos con la bobina forman un convertidor buck.'),
        ('Zócalo y retención', ['mb_ilm_*'], ['mb_socket', 'mb_socket_contactos'], ''),
    ]),
]

FUNCIONA = [
    ('En reposo: 5VSB', ['psu_entrada_iec', 'psu_emi_x', 'psu_emi_bobinas', 'psu_puente', 'psu_5vsb_trafo', 'psu_5vsb_controlador', 'cable_atx24', 'mb_superio', 'mb_pch'], ['ac', 'vsb'], 'fuente', False,
     'Con el cable enchufado y el interruptor en I, la red pasa por el filtro EMI y el puente, y la pequeña fuente flyback del standby entrega 5VSB (pin 9 del conector de 24 pines). Con eso viven el PCH, el Super I/O y el circuito del botón; el resto está apagado.'),
    ('Botón de encendido y PS_ON#', ['caja_boton_power', 'cable_panel_frontal', 'mb_hdr_fpanel', 'mb_superio', 'mb_pch', 'cable_atx24'], ['senal'], 'frontal', False,
     'El botón cierra un contacto en el header F_PANEL; la lógica de la placa lleva a tierra PS_ON# (pin 16, verde). La fuente debe tener sus salidas en regulación en menos de 200 ms (T1, guía ATX 3).'),
    ('La fuente arranca: PFC, LLC y PWR_OK', ['psu_pfc_bobina', 'psu_pfc_mosfets', 'psu_bulk', 'psu_llc_mosfets', 'psu_transformador', 'psu_rect_sinc', 'psu_dcdc', 'psu_supervisor', 'psu_conectores_modulares', 'cable_atx24'], ['ac', 'dc12', 'dc5', 'senal'], 'fuente', True,
     'El PFC eleva y estabiliza el bus del bulk; el medio puente LLC conmuta, el transformador baja el voltaje y la rectificación síncrona entrega 12 V; los DC-DC sacan 5 V y 3,3 V. Entre 100 y 250 ms después el supervisor sube PWR_OK (pin 8, gris) (T3).'),
    ('VRM: de 12 V a ~1 V para el CPU', ['cable_eps1', 'cable_eps2', 'mb_eps1', 'mb_eps2', 'mb_vrm_controlador', 'mb_vrm_etapas_sup', 'mb_vrm_etapas_izq', 'mb_vrm_detalle', 'mb_vrm_bobinas_sup', 'mb_vrm_bobinas_izq', 'mb_vrm_cond_sup', 'mb_vrm_cond_izq', 'cpu_sustrato'], ['dc12', 'vrm'], 'vrm', False,
     'Los 12 V de los EPS llegan al VRM. El controlador digital dispara las 16 etapas desfasadas entre sí; cada DrMOS conmuta su bobina como un convertidor buck y la suma de fases entrega la corriente del núcleo, con el voltaje que el CPU pide por SVID.'),
    ('Reset y firmware', ['mb_pch', 'mb_bios', 'mb_debug_leds', 'cpu_die', 'mb_cristales'], ['spi', 'senal'], 'placa', False,
     'Con los voltajes estables se libera el reset. El PCH lee la flash SPI; el motor de seguridad verifica el firmware y el CPU ejecuta las primeras instrucciones de la UEFI. El LED «CPU» se apaga si todo va bien.'),
    ('Entrenamiento de la memoria', ['cpu_die_imc', 'mb_dimm_a2', 'mb_dimm_b2', 'ram_a2_spd', 'ram_a2_pmic', 'ram_a2_chips', 'ram_b2_chips', 'mb_debug_leds'], ['ddr', 'senal'], 'ram', False,
     'El firmware lee el SPD de cada módulo, habilita el PMIC y entrena cada línea de datos (retardos y referencias) para DDR5-4800. Es el paso más largo del primer arranque; el LED «DRAM» se apaga al terminar.'),
    ('Enumeración PCIe y video', ['cpu_die_pcie', 'mb_pcie1', 'gpu_contactos', 'gpu_die', 'mb_m2_1', 'nvme_controlador', 'mb_pch', 'mb_debug_leds'], ['pcie', 'dmi'], 'gpu', False,
     'La UEFI recorre los buses PCIe: tarjeta gráfica en x16 Gen 5 (la tarjeta negocia Gen 4), SSD NVMe en x4 Gen 4 de la CPU y, por el DMI 4.0 x8, lo que cuelga del PCH. El LED «VGA» se apaga cuando hay video.'),
    ('Arranque del sistema operativo', ['nvme_nand', 'nvme_controlador', 'nvme_dram', 'cpu_die', 'ram_a2_chips', 'mb_debug_leds'], ['pcie', 'ddr'], 'm2', False,
     'La UEFI busca el gestor de arranque en el SSD, lo copia a la RAM y le entrega el control. El LED «BOOT» se apaga.'),
    ('Ruta de datos en operación', ['cpu_die_pcores', 'cpu_die_l3', 'cpu_die_anillo', 'cpu_die_imc', 'ram_a2_chips', 'ram_b2_chips', 'cpu_die_pcie', 'gpu_die', 'nvme_controlador', 'mb_pch', 'mb_sata', 'mb_lan'], ['ddr', 'pcie', 'dmi'], 'interior', False,
     'Núcleos y caché se hablan por el anillo; el controlador de memoria usa 2 canales (4 subcanales de 32 bits); la GPU tiene x16 directo a la CPU; el PCH reúne SATA, USB, red y audio por el DMI.'),
    ('Renderizado en la GPU', ['gpu_die', 'gpu_die_gpcs', 'gpu_die_l2', 'gpu_vram', 'gpu_vrm_etapas', 'gpu_salidas'], ['pcie', 'vram'], 'gpu', False,
     'La CPU envía comandos y datos por PCIe; los SM procesan vértices y píxeles leyendo la GDDR6X por 6 canales de 32 bits, y el resultado sale por DisplayPort o HDMI.'),
    ('Enfriamiento', ['cpu_die', 'cpu_stim', 'cpu_ihs', 'cpu_pasta', 'cooler_base', 'cooler_heatpipes', 'cooler_aletas', 'cooler_ventilador', 'caja_vent_frontal_1', 'caja_vent_frontal_2', 'caja_vent_frontal_3', 'caja_vent_trasero', 'gpu_vent_1', 'gpu_vent_2', 'psu_ventilador'], ['calor', 'aire'], 'general', True,
     'El calor del die pasa por la soldadura, el IHS y la pasta a la base; los heatpipes lo llevan por evaporación y condensación a las aletas. El aire entra por el frente, cruza el disipador y sale por atrás.'),
]

# ---------------- generación ----------------
def main():
    ids = [p['id'] for p in PZ]
    dup = {i for i in ids if ids.count(i) > 1}
    assert not dup, f'ids repetidos: {dup}'
    por_id = {p['id']: p for p in PZ}
    for p in PZ:
        assert p['padre'] is None or p['padre'] in por_id, f"{p['id']}: padre desconocido {p['padre']}"
        for f in p['fte'].split(','):
            assert f in FUENTES, f"{p['id']}: fuente desconocida {f}"
    nombres = [p['nombre'] for p in PZ]
    assert len(nombres) == len(set(nombres)), 'nombres repetidos (data.json usa el nombre como clave de la ficha)'

    def nivel(p):
        d, q = 0, p
        while q['padre']: d, q = d + 1, por_id[q['padre']]
        return ['modulo', 'componente', 'subcomponente', 'subcomponente'][min(d, 3)]
    def explosion(p):
        e, q = [0, 0, 0], p
        while q:
            e = [e[i] + q['rel'][i] for i in range(3)]
            q = por_id.get(q['padre'])
        return [round(v, 2) for v in e]

    def expandir(pats, usados, orden):
        neg = [x[1:] for x in pats if x.startswith('!')]
        out = []
        for pat in [x for x in pats if not x.startswith('!')]:
            for i in orden:
                if i not in usados and i not in out and fnmatch.fnmatch(i, pat) and not any(fnmatch.fnmatch(i, n) for n in neg):
                    out.append(i)
            assert any(fnmatch.fnmatch(i, pat) for i in orden), f'comodín sin piezas: {pat}'
        return out

    usados, des = set(), []
    for n, (tit, quita, foco, vista, herr, instr, prec) in enumerate(DESARME, 1):
        q = expandir(quita, usados, ids); usados |= set(q)
        for f in foco: assert f in por_id, f'foco desconocido {f}'
        des.append(dict(paso=n, titulo=tit, quita=q, foco=foco, vista=vista, herramienta=herr, instruccion=instr, precaucion=prec))
    faltan = set(ids) - usados - {'caja_chasis'}
    assert not faltan, f'piezas que nunca salen en el desarme: {sorted(faltan)}'
    puestos, ens = set(), []
    for n, (tit, pone, instr) in enumerate(ENSAMBLADO, 1):
        q = expandir(pone, puestos, ids); puestos |= set(q)
        ens.append(dict(paso=n, titulo=tit, pone=q, instruccion=instr))
    assert puestos == set(ids), f'piezas sin paso de ensamblado: {sorted(set(ids) - puestos)}'
    procs = []
    for nom, solo, pasos in PROCS:
        S_ = expandir(solo, set(), ids); us, ps = set(), []
        for n, (tit, quita, foco, txt) in enumerate(pasos, 1):
            q = expandir(quita, us, S_); us |= set(q)
            f = expandir(foco, set(), S_) if foco else q
            ps.append(dict(paso=n, titulo=tit, quita=q, foco=f, instruccion=txt or tit + '.', herramienta='Solo observación', precaucion=None))
        procs.append(dict(nombre=nom, solo=S_, pasos=ps))
    etapas = []
    for tit, piezas, capas, vista, giro, txt in FUNCIONA:
        for i in piezas: assert i in por_id, f'etapa «{tit}»: pieza desconocida {i}'
        etapas.append(dict(titulo=tit, piezas=piezas, foco=piezas[:4], capas=capas, vista=vista, giro=giro, texto=txt))

    paso_des = {i: d['paso'] for d in des for i in d['quita']}
    paso_ens = {i: e['paso'] for e in ens for i in e['pone']}
    caja = [[-22.5, 0, -10.75], [22.5, 48.0, 10.75]]
    piezas = []
    for p in PZ:
        m, a, b, c = p['anc']
        pos = en(m, a, b, c)
        if not p.get('fuera'):
            assert all(caja[0][i] - 1 <= pos[i] <= caja[1][i] + 1 for i in range(3)), f"{p['id']}: anclaje {pos} fuera de la caja"
        e = dict(id=p['id'], nombre=p['nombre'], grupo=f"{p['sistema']} · {p['subgrupo']}", sistema=p['sistema'], subgrupo=p['subgrupo'],
                 modulo=MODULO[p['sistema']], padre=p['padre'], nivel=nivel(p), anclaje=f'{m}({a:g}, {b:g}, {c:g})', pos=pos,
                 explosion=explosion(p), explosion_rel=p['rel'], desarme_paso=paso_des.get(p['id']), ensamblado_paso=paso_ens[p['id']],
                 fuente=p['fte'].split(','), supuesto='sup' in p['fte'].split(','))
        for k in ('shell', 'envuelve', 'disperso', 'fuera', 'nota'):
            if p.get(k): e[k] = p[k]
        piezas.append(e)

    por_mod = {}
    for e in piezas: por_mod[e['modulo']] = por_mod.get(e['modulo'], 0) + 1
    contrato = dict(
        version=1, fecha='2026-11-19',
        descripcion='Contrato de piezas del PC de torre (pctorre). Generado por scripts_datos/generar_contrato.py: NO editar a mano. Lo leen comun.js, los módulos modelo_*.js y prueba_modelo.mjs. Guía: CONTRATO.md.',
        plataforma='Torre ATX referencial: Intel Core i9-12900K (LGA1700) + chipset Z690 + 2 x DDR5-4800 16 GB + tarjeta gráfica clase RTX 4070 (AD104, 12 GB GDDR6X, 12V-2x6) + SSD NVMe clase 990 PRO + SSD SATA 2,5" + HDD 3,5" + fuente ATX 3.x 850 W modular.',
        modelo='ATX-Z690', unidades='cm', ejes='+x frente, +y arriba, +z panel de vidrio; suelo y = 0; centro de la huella x = z = 0',
        caja=dict(min=caja[0], max=caja[1]), marcos=MARCOS, layout=LAYOUT, fuentes=FUENTES, presupuesto=PRESUPUESTO,
        modulos={k: dict(archivo=f'modelo_{k}.js', piezas=v) for k, v in por_mod.items()},
        campos={'anclaje': 'marco(a, b, c) en cm, ver «marcos»', 'pos': 'mismo punto en coordenadas de mundo', 'explosion': 'absoluta (suma de explosion_rel de la pieza y sus padres)',
                'nivel': 'modulo | componente | subcomponente (según la profundidad en «padre»)', 'shell': 'carcasa: con «Rayos X» queda al 22 %', 'envuelve': 'su caja envolvente puede contener otras piezas (la prueba no la cuenta como choque)',
                'disperso': 'varias partes separadas: la prueba no mide choques con su caja envolvente', 'fuera': 'puede quedar fuera de la caja (cable de poder)', 'supuesto': 'true si alguna medida o forma no está documentada'},
        piezas=piezas,
        recorridos=dict(desarme=des, ensamblado=ens, procedimientos=procs),
        funcionamiento=etapas,
    )
    with open(f'{R}/contrato.json', 'w') as f: json.dump(contrato, f, ensure_ascii=False, indent=1)
    print(f'contrato.json: {len(piezas)} piezas', por_mod, f'desarme {len(des)} pasos, ensamblado {len(ens)}, procedimientos {len(procs)}, etapas {len(etapas)}')

    if '--datos' in sys.argv and not os.path.exists(f'{R}/data.json'):
        M = 'ATX-Z690'
        datos = dict(
            aviso='Modelo 3D procedural y REFERENCIAL de un PC de torre ATX: plataforma Intel LGA1700/Z690 documentada (ATX 2.2, guía de fuentes ATX 3, datasheets Intel). Las medidas de la caja, la posición de los componentes en la placa y el interior de la fuente, la GPU y los discos son aproximados; ver la ficha de cada pieza.',
            modelos=[dict(marca='Referencial', modelo=M, nombre='Torre ATX · Core i9-12900K · Z690 · DDR5 · RTX 4070 (referencial)', nota='Arquitectura de un PC de escritorio actual; no copia un producto comercial.',
                          ficha=[['Formato', 'Mid-tower ATX (45 x 48 x 21,5 cm, supuesto)'], ['Placa', 'ATX 305 x 244 mm, chipset Z690'], ['CPU', 'Core i9-12900K, 8P + 8E, LGA1700'],
                                 ['Memoria', '2 x 16 GB DDR5-4800 (doble canal)'], ['Gráfica', 'Clase RTX 4070, 12 GB GDDR6X, PCIe 4.0 x16'], ['Almacenamiento', 'NVMe PCIe 4.0 x4 + SSD SATA + HDD 3,5"'],
                                 ['Fuente', 'ATX 3.x 850 W modular, 12V-2x6']])],
            piezas={},
            desarmados={M: [{k: v for k, v in d.items()} for d in des]},
            procedimientos={M: [dict(nombre=p['nombre'], solo=p['solo'], pasos=p['pasos']) for p in procs]},
            funcionamiento={M: etapas},
        )
        with open(f'{R}/data.json', 'w') as f: json.dump(datos, f, ensure_ascii=False, indent=1)
        print('data.json: esqueleto escrito')

if __name__ == '__main__':
    main()
