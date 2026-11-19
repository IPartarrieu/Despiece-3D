#!/usr/bin/env python3
"""Genera docs/retroexcavadora/data.json a partir de la copia de respaldo (data.json.bak, fuera del proyecto) y de
contrato.json. Idempotente: siempre parte del respaldo. Agrega fichas, catálogo, desarme y recorridos secundarios.
Uso: python3 generar_datos.py [respaldo.json]   (por defecto el del scratchpad de la sesión)"""
import json, re, sys, copy, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fichas_nuevas import FICHAS, F
import pasos_nuevos as PN

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BAK = sys.argv[1] if len(sys.argv) > 1 else '/tmp/claude-1000/-home-ipartarrieu-Claude/f93734f7-dd3a-43e1-bc4e-2ef0ee28d954/scratchpad/data.json.bak'
d = json.load(open(BAK)); C = json.load(open(f'{R}/contrato.json'))
MODS = [m['modelo'] for m in d['modelos']]
CASE = {'580N', '580 Super N'}

# ---------- contrato expandido: un registro por id real ----------
REF_CIL = {'vastago': 'ref. SK 1341852C2', 'piston': 'ref. SK G108184', 'cabezal': 'ref. SK 1980321C2', 'sellos': 'ref. SK 1543260C1 (kit)', 'bujes': 'ref. SK D144895'}
ID = {}
for e in C['piezas']:
    ids = e.get('ids') or [e['id']]
    for i, pid in enumerate(ids):
        ext = e.get('extrae_de') or ''
        ID[pid] = dict(id=pid, base=e['id'], nombre=(e.get('etiquetas') or [e['nombre']] * len(ids))[i], grupo=e['grupo'], aplica=e['aplica'],
                       supuesto=e.get('supuesto', False), extrae=[x.strip() for x in str(ext).split(',') if x.strip()], sale_con=e.get('sale_con'),
                       ref=REF_CIL.get(e['id'].rsplit('_', 1)[-1]) if re.match(r'cil_.+_(vastago|piston|cabezal|sellos|bujes)$', e['id']) else None)
EXIST = list(C['existentes'])
aplica = lambda pid, m: pid in EXIST or ID[pid]['aplica'] == 'todos' or m in ID[pid]['aplica']
disp = lambda n, ref: f'{n} ({ref})' if ref else n

# ---------- catálogo ----------
GRUPO_NUEVO = {'motor': 'Motor · bloque y tren alternativo', 'pasadores': 'Pasadores y bujes'}
NOM_NUEVO = {'motor': 'Bloque del motor'}
cat0 = copy.deepcopy(d['catalogo'])
for k, (n, r, g) in list(cat0.items()):
    cat0[k] = [NOM_NUEVO.get(k, n), r, GRUPO_NUEVO.get(k, g)]
cat = copy.deepcopy(cat0)
for pid, r in ID.items(): cat[pid] = [r['nombre'], r['ref'], r['grupo']]
d['catalogo'] = cat
d['catalogoPorModelo'] = {m: {k: v for k, v in cat.items() if aplica(k, m)} for m in MODS}

# ---------- fichas ----------
CIL = {  # [Ø camisa, Ø vástago, carrera] mm, 580N (hoja 580N p.4); Super N: solo Ø de camisa (hoja SN p.4)
 'levante': ('de levante', [82.6, 44.5, 733], None), 'volteo': ('de volteo', [76.2, 38.1, 516.5], None), 'giro': ('de giro', [95.3, 50.8, 292], 101.6),
 'pluma': ('de la pluma', [114.3, 57.2, 971.5], 127), 'brazo': ('del brazo', [108, 57.2, 628.5], 120.7), 'cuchara': ('de la cuchara', [82.6, 57.2, 897.9], 88.9),
 'estab_i': ('del estabilizador izquierdo', [108, 57.2, 542.9], 114.3), 'estab_d': ('del estabilizador derecho', [108, 57.2, 542.9], 114.3)}
CIL_USO = {'levante': 'sube los brazos del cargador', 'volteo': 'gira el cucharón para cargar y descargar', 'giro': 'hace girar la torre de la retro (dos en oposición)',
           'pluma': 'sube y baja la pluma', 'brazo': 'acerca y aleja el brazo', 'cuchara': 'cierra y abre la cuchara por las bieletas',
           'estab_i': 'baja y sube la pata del estabilizador', 'estab_d': 'baja y sube la pata del estabilizador'}
num = lambda x: str(x).replace('.', ',')

def f_cil(kind, cy):
    de, (D, V, car), _ = CIL[cy]; uso = CIL_USO[cy]
    if kind == 'vastago':
        return F(f'Barra cromada que sale de la camisa y transmite la fuerza del pistón al mecanismo: en el cilindro {de} {uso}. Se une al pistón por dentro y lleva un buje en el ojo del extremo (SK 8-117).',
                 'Rayas y picaduras del cromo por barro o golpes, curvatura, y cromo que se levanta. Un vástago rayado corta el limpiador y el sello y el cilindro empieza a gotear.',
                 'Con el cilindro extendido, pasa un trapo limpio por la superficie y busca rayas que lo enganchen; revisa que esté recto y que no gotee por el limpiador al retraerlo.',
                 'Se rectifica y recroma o se cambia si hay picaduras profundas o está curvo; siempre con juego de sellos nuevo.',
                 'Protege el vástago al soldar o esmerilar cerca y límpialo antes de retraerlo en terreno barroso.',
                 f'Vástago Ø{num(V)} mm y carrera {num(car)} mm en la 580N (hoja 580N p.4)')
    if kind == 'piston':
        return F(f'Disco unido al vástago con un perno que divide el cilindro {de} en dos cámaras; lleva el sello de pistón, un anillo de respaldo y un anillo de desgaste (SK 8-117: G102287, S109444, S109445).',
                 'El sello de pistón se gasta y el aceite pasa de una cámara a la otra sin salir del cilindro: la carga baja sola (deriva) aunque no haya fuga externa. El anillo de desgaste se marca contra la camisa.',
                 'Marca la posición con la carga levantada y mira si el vástago deriva (MR, tabla de fallas «Cilindro de pluma o…»). Si no hay fuga externa, el sello del pistón es el sospechoso, o el carrete de la válvula.',
                 'Se saca para cambiar el sello y los anillos; el pistón se cambia si está rayado o con el asiento dañado.',
                 'Al armar, aprieta el perno del pistón con su arandela de seguridad; el valor no está en las fuentes (el catálogo de la Super K indica un perno de 3/4 NF).',
                 f'Camisa Ø{num(D)} mm en la 580N (hoja 580N p.4)')
    if kind == 'cabezal':
        return F(f'Prensaestopa en el extremo del cilindro {de}: guía el vástago y aloja el limpiador, el buje, el sello en U del vástago, el sello amortiguador, el O-ring y su anillo de respaldo (SK 8-117: D95143, G102425, G107922, G109094, 238-5233, G32122).',
                 'El buje de guía se gasta y el vástago pierde su centrado; los asientos se rayan y los sellos no cierran. Señal: aceite en el cabezal y fuga alrededor del vástago.',
                 'Mover el vástago de lado a lado con el cilindro sin presión: no debe tener juego. Mira el aceite alrededor del cabezal y el limpiador.',
                 'Se cambia con el kit de sellos si el buje o el asiento están dañados; el cabezal rara vez se cambia entero.',
                 'No rayes el vástago al sacar el cabezal y limpia todo antes de armar: una partícula en el asiento arruina el sello nuevo.')
    if kind == 'sellos':
        return F(f'Juego de sellos del cilindro {de}: limpiador, sello del vástago (en U), sello amortiguador (buffer), sello de pistón y anillos de respaldo y de desgaste (SK 8-117, kit 1543260C1 de la Super K).',
                 'Endurecimiento por calor, cortes por rebabas y extrusión por alta presión. Señales: aceite en el vástago y bajo el cilindro, y deriva con carga.',
                 'Marca la posición bajo carga y observa la deriva; busca aceite que escurre del cabezal y limpia con un cartón, nunca con la mano (MR, tabla 7).',
                 'Es la reparación más común de una retro: se cambian todos los sellos juntos cada vez que se abre el cilindro.',
                 'El número de kit es del catálogo de la 580 Super K, no de la serie N: confirma el kit por modelo antes de comprar. Aceita los sellos antes de montarlos (MR, 4.6).')
    return F(f'Bujes y sellos de los ojos del cilindro {de}, donde entran los pasadores que lo unen a la máquina (SK 8-117: bujes D144895 y sellos de ojo D123655).',
             'Se ovalan por falta de grasa y barro: el cilindro golpetea en el pasador y se come el ojo de la camisa o del vástago.',
             'Con el cilindro sin carga, mueve el pasador a mano y busca juego; el golpe seco al cambiar de sentido lo delata.',
             'Con juego visible; se cambian por juegos completos (MR: cambiar pasador o buje).',
             'Engrasa cada 10 h (manual M, p.167): es la mantención que más alarga estos bujes.')

def f_par(base, m):  # tabla de override por modelo
    return None

pz = {}   # nombre mostrado -> ficha
for pid, r in ID.items():
    name = disp(r['nombre'], r['ref'])
    mm = re.match(r'cil_(.+)_(vastago|piston|cabezal|sellos|bujes)$', r['base'])
    if mm: fi = f_cil(mm.group(2), mm.group(1))
    elif r['base'] in FICHAS: fi = copy.deepcopy(FICHAS[r['base']])
    else: raise SystemExit('falta ficha de ' + r['base'])
    if r['supuesto'] and 'aproximado' not in (fi['funcion'] + fi.get('tip_taller', '')).lower():
        fi['funcion'] += ' Dato aproximado: sin documento propio de estos modelos.'
    pz[name] = fi
piezas = {n: f for n, f in copy.deepcopy(d['piezas']).items() if n != 'Motor diésel'}
piezas.update(pz)

# ficha del bloque (antes «Motor diésel»): una por modelo con su motor
old_m = d['piezas']['Motor diésel']
def f_motor(m):
    mot = dict(next(x for x in d['modelos'] if x['modelo'] == m)['ficha'])['Motor']
    po = d['piezasPorModelo'][m]['Motor diésel']
    return F(f'Bloque de fundición con los cuatro cilindros en línea integrados (sin camisas desmontables) que aloja el cigüeñal, el tren alternativo y la distribución, y sostiene la culata, el cárter y los accesorios. Motor de este modelo: {mot}. Con «Rayos X» se ve su interior.',
             'Cilindros rayados u ovalados por polvo o aceite pobre, fisuras entre cilindros por sobrecalentamiento y asientos de bancada dañados por falta de lubricación. El sobrecalentamiento por radiador sucio es la causa más común de daño mayor. Se repara rectificando el bloque a sobremedida.',
             po['prueba'], po['cuando_cambiar'], po.get('tip_taller'), po.get('valor_esperado'))
for m in MODS: pass
piezas['Bloque del motor'] = f_motor('580N')

# bomba hidráulica: ahora adelante y acoplada a la polea (H1)
PUMP_ADD = ' Va adelante del motor, en el eje del cigüeñal, unida a su polea por un acople (manual M, pdf 215).'
def fix_bomba(f):
    f = copy.deepcopy(f)
    if 'Gira siempre con el motor.' in f['funcion']: f['funcion'] = f['funcion'].replace('Gira siempre con el motor.', 'Gira siempre con el motor.' + PUMP_ADD)
    else: f['funcion'] += PUMP_ADD
    return f
piezas['Bomba hidráulica'] = fix_bomba(piezas['Bomba hidráulica'])
d['piezas'] = piezas

ppm = {}
for m in MODS:
    t = {(k): v for k, v in copy.deepcopy(d['piezasPorModelo'][m]).items() if k != 'Motor diésel'}
    t['Bloque del motor'] = f_motor(m)
    if 'Bomba hidráulica' in t: t['Bomba hidráulica'] = fix_bomba(t['Bomba hidráulica'])
    # cilindros: dimensiones propias del modelo
    for pid, r in ID.items():
        mm = re.match(r'cil_(.+)_(vastago|piston)$', r['base'])
        if not mm or not aplica(pid, m): continue
        nombre = disp(r['nombre'], r['ref']); f = copy.deepcopy(piezas[nombre])
        _, _, dsn = CIL[mm.group(1)]
        if m == '580N': continue
        if m == '580 Super N':
            f['valor_esperado'] = (f'Camisa Ø{num(dsn)} mm en la 580 Super N (hoja SN p.4); vástago y carrera: sin dato en las fuentes' if dsn else 'Medidas de este cilindro: sin dato en las fuentes para la 580 Super N')
        else:
            f['valor_esperado'] = 'Medidas de este cilindro: sin dato en las fuentes para este modelo'
        t[nombre] = f
    ppm[m] = t
d['piezasPorModelo'] = ppm

# ---------- desarme ----------
OLD = {m: d['desarmados'][m] for m in MODS}
VISTA = {
 'maquina': {1: 'general', 2: 'cargador', 3: 'general', 4: 'bateria', 5: 'motor', 6: 'motor', 7: 'motor_frente', 8: 'hidraulico', 9: 'general', 10: 'cabina',
             11: 'retro', 12: 'retro', 13: 'retro', 14: 'giro', 15: 'estab', 16: 'cargador', 17: 'cargador', 18: 'general', 19: 'transmision', 20: 'ejes',
             21: 'motor_det', 22: 'motor_frente', 23: 'motor_det', 24: 'transmision', 25: 'hidraulico', 26: 'general'},
 'motor_banco': {1: 'motor_bajo', 2: 'motor_sup', 3: 'motor_sup', 4: 'motor_sup', 5: 'motor_sup', 6: 'motor_sup', 7: 'motor_frente', 8: 'motor_frente', 9: 'motor_det',
                 10: 'motor_sup', 11: 'motor_det', 12: 'motor_frente', 13: 'motor_frente', 14: 'motor_frente', 15: 'motor_frente', 16: 'motor_atras', 17: 'motor_atras',
                 18: 'motor_bajo', 19: 'motor_atras', 20: 'motor_bajo', 21: 'motor_bajo', 22: 'motor_det'},
 'eje_trasero': {1: 'eje_trasero', 2: 'mando_final', 3: 'mando_final', 4: 'mando_final', 5: 'eje_trasero', 6: 'eje_trasero'},
 'cilindro_pluma': {i: 'cilindro_pluma' for i in range(1, 8)},
}
VIDRIO = {
 'maquina': {20: ['eje_tras', 'eje_del'], 23: ['motor', 'conv_campana'], 24: ['transmision', 'conv_campana']},
 'motor_banco': {i: ['motor'] for i in range(10, 23)},
 'eje_trasero': {i: ['eje_tras'] for i in range(2, 7)},
 'cilindro_pluma': {i: ['cil_pluma'] for i in range(4, 8)},
}
TITULO = {('maquina', 20): 'Ejes', ('maquina', 23): 'Motor fuera de la máquina', ('maquina', 6): 'Filtro de aire, escape y postratamiento',
          ('maquina', 7): 'Correa, acople de la bomba, ventilador y radiador', ('maquina', 22): 'Bomba hidráulica (adelante, desacoplada de la polea)',
          ('maquina', 24): 'Convertidor, placa flexible y transmisión', ('maquina', 25): 'Válvulas, orbitrol y estanques'}
PROC_NOMBRE = {'motor_banco': 'Motor en el banco (22 pasos)', 'eje_trasero': 'Eje trasero (6 pasos)', 'cilindro_pluma': 'Sellos del cilindro de la pluma (7 pasos)'}
OLDIDX = {1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 8: 7, 9: 8, 10: 9, 11: 10, 12: 11, 13: 12, 14: 13, 15: 14, 16: 15, 17: 16, 18: 17, 19: 18, 20: 19, 26: 23}
EXTRA_QUITA = {('eje_trasero', 1): ['rueda_tras_i']}

def pasos(rec, m):
    out = []
    for s in C['recorridos'][rec]:
        n = s['paso']; titulo = TITULO.get((rec, n)) or re.sub(r'^\(s\)\s*', '', s['titulo'])
        quita = [x for x in s.get('quita', []) + EXTRA_QUITA.get((rec, n), []) if aplica(x, m)]
        foco = [x for x in s.get('foco', []) if aplica(x, m)]
        if rec == 'maquina':
            if n in OLDIDX:
                o = OLD[m][OLDIDX[n]]; ins, pre, her = o['instruccion'], o.get('precaucion'), o.get('herramienta')
                ins += PN.EXTRA.get(n, '')
            else:
                a, b, pre, her = PN.MAQUINA[n]; ins = a if (m in CASE or b is None) else b
        else:
            ins, pre, her = {'motor_banco': PN.BANCO, 'eje_trasero': PN.EJE, 'cilindro_pluma': PN.CIL}[rec][n]
            if rec == 'eje_trasero' and m not in CASE and n == 1: ins = ins.replace('(13,6 L en la 580N) ', '').replace('(hoja p.2; manual M, p.156-157)', '(capacidades en la ficha)')
        p = {'paso': n, 'titulo': titulo, 'instruccion': ins, 'precaucion': pre, 'herramienta': her, 'quita': quita}
        if foco: p['foco'] = foco
        elif not quita: p['foco'] = []
        if s.get('foco') is None and quita and OLDIDX.get(n) is not None and rec == 'maquina' and OLD[m][OLDIDX[n]].get('foco'): p['foco'] = OLD[m][OLDIDX[n]]['foco']
        p['vista'] = VISTA[rec][n]
        v = VIDRIO[rec].get(n)
        if v: p['vidrio'] = [x for x in v if aplica(x, m)]
        out.append(p)
    return out

SOLO_EXTRA = {'motor_banco': ['motor'], 'eje_trasero': ['eje_tras', 'rueda_tras_i', 'rueda_tras_d', 'cardan_tras', 'chasis'],
              'cilindro_pluma': ['cil_pluma', 'pluma', 'base_giro', 'mangueras', 'pas_pie_pluma']}
d['desarmados'] = {}; d['procedimientos'] = {}
for m in MODS:
    d['desarmados'][m] = pasos('maquina', m)
    procs = []
    for rec in ('motor_banco', 'eje_trasero', 'cilindro_pluma'):
        ps = pasos(rec, m)
        solo = list(dict.fromkeys(SOLO_EXTRA[rec] + [x for p in ps for x in p['quita'] + p.get('foco', [])]))
        procs.append({'id': rec, 'nombre': PROC_NOMBRE[rec], 'solo': solo, 'pasos': ps})
    d['procedimientos'][m] = procs
d['desarmado'] = d['desarmados']['580N']

# ---------- funcionamiento ----------
EXT = {}
for pid, r in ID.items():
    for e in r['extrae']: EXT.setdefault(e, []).append(pid)
    if r['sale_con']: EXT.setdefault(r['sale_con'], []).append(pid)
MANUAL = {0: ['enf_correa', 'hid_acople', 'adm_elem_primario', 'adm_elem_secundario', 'esc_multiple', 'esc_egr', 'esc_dpf', 'esc_scr', 'esc_urea', 'comb_filtros', 'comb_cebado', 'comb_lineas',
              'enf_enfriador_hid', 'enf_enfriador_trans', 'enf_deposito', 'ele_arranque', 'ele_arnes', 'motor_soportes', 'conv_placa_flex'],
          1: ['conv_placa_flex', 'conv_campana', 'tr_bomba', 'tr_valvula', 'tr_filtro', 'tr_freno_estac', 'tr_embrague_4wd', 'tr_retenes', 'cig_volante'],
          2: ['ed_pivote', 'card_crucetas'],
          3: ['hid_acople', 'cig_polea', 'hid_colador', 'hid_valvulas_alivio'],
          4: ['carg_puntal', 'carg_bieletas', 'pas_carg_cucharon'], 5: ['pas_estab'], 6: ['pas_torre'], 7: ['hid_traba_pluma', 'retro_acople_rapido'],
          8: ['hid_acople', 'cig_polea'], 9: ['dir_orbitrol', 'dir_columna', 'dir_prioridad', 'tr_freno_estac']}
FOCO_ADD = {0: ['cig_ciguenal', 'cig_volante'], 3: ['hid_acople', 'cig_polea'], 9: ['dir_cilindro', 'dir_orbitrol', 'fr_discos_i', 'fr_discos_d']}
VID = {0: ['motor']}
TXT = {
 0: [(' mueve la bomba hidráulica (potencia a las herramientas)', ' mueve la bomba hidráulica, que va adelante unida a la polea del cigüeñal por un acople (potencia a las herramientas)'),
     ('el radiador y el ventilador evacuan el calor.', 'el radiador y el ventilador evacuan el calor. Por dentro, los cuatro pistones empujan el cigüeñal por las bielas; el volante, atrás, entrega el giro por la placa flexible, y la polea, adelante, mueve la correa y el acople de la bomba. La bomba de aceite, adelante, manda aceite por el filtro y el enfriador a las bancadas, las bielas y el árbol de levas.')],
 1: [('Del volante, el par pasa al convertidor:', 'Del volante, el par pasa por la placa flexible al convertidor, dentro de la campana:')],
 3: [(' El aceite sale de la bomba', ' La bomba va adelante, en el eje del cigüeñal: un acople la une a la polea y gira siempre con el motor (manual M, pdf 215). El aceite sale de la bomba')],
 9: [(None, ' El volante gira la unidad de dirección (orbitrol), que manda el aceite al cilindro de dirección; los discos de freno húmedos van en el extremo de cada trompeta, entre el diferencial y el cubo.')],
}
for m in MODS:
    for i, e in enumerate(d['funcionamiento'][m]):
        base = list(e['piezas'])
        extra = list(MANUAL.get(i, []))
        for p in base: extra += EXT.get(p, [])
        for p in extra:
            if p in ID and not aplica(p, m): continue
            if p not in base: base.append(p)
        if i == 4: base = [p for p in base]
        e['piezas'] = base
        if i in FOCO_ADD: e['foco'] = list(dict.fromkeys(e['foco'] + [p for p in FOCO_ADD[i] if aplica(p, m)]))
        if i in VID: e['vidrio'] = VID[i]
        for a, b in TXT.get(i, []):
            if a is None: e['texto'] += b
            else:
                assert a in e['texto'], (m, i, a); e['texto'] = e['texto'].replace(a, b, 1)
        if i == 1 and m == '3CX': e['texto'] += ' Aquí el modelo 3D usa como referencia la caja powershuttle; la 3CX Compact es hidrostática y su interior es distinto.'
        elif i == 1: e['texto'] += ' Dentro de la caja, la bomba de carga que mueve el cubo del convertidor da la presión de los embragues, el filtro limpia el aceite y el freno de estacionamiento va en la misma caja.'

d['avisos'] = [a for a in d['avisos'] if 'ref = null' not in a] + ['Los números «ref. SK» (cilindros) son del catálogo de la Case 580 Super K, de otra serie: sirven de referencia, no son números de pieza de la serie N.',
    'Fichas del motor, ejes, transmisión y cilindros: despiece según catálogos de otras series y manuales de servicio de terceros; lo marcado «aproximado» o «(s)» es práctica de taller sin documento propio de estos modelos. Sin torques ni holguras: no están en las fuentes.']
json.dump(d, open(f'{R}/data.json', 'w'), ensure_ascii=False, indent=1)
print('fichas nuevas', len(pz), '| pasos', {m: len(d['desarmados'][m]) for m in MODS}, '| procedimientos', [len(p['pasos']) for p in d['procedimientos']['580N']])
