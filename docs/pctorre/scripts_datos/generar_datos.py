#!/usr/bin/env python3
"""Genera docs/pctorre/data.json desde contrato.json + fichas_*.py + pasos.py. Idempotente (no lee data.json salvo aviso y modelos,
que no cambia). Uso: python3 generar_datos.py"""
import json, os, sys
AQUI = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(AQUI); sys.path.insert(0, AQUI)
import fichas_caja, fichas_fuente, fichas_placa, fichas_cpu, fichas_gpu, pasos
C = json.load(open(f'{R}/contrato.json')); old = json.load(open(f'{R}/data.json'))
M = C['modelo']
NOTA = 'forma y medidas aproximadas en el modelo (sin documento público que las fije)'
fich = {}
for m in (fichas_caja, fichas_fuente, fichas_placa, fichas_cpu, fichas_gpu): fich.update(m.D)
piezas = {}
for p in C['piezas']:
    f = fich.get(p['id'])
    if not f: continue
    fu, de, pr, va, cu, ti = f
    if len(cu) < 40:
        m = p['modulo']; nd = 'No aplica: pieza didáctica del modelo; en un equipo real forma parte de la unidad y no se cambia por separado.' if cu.startswith('No aplica') else None
        cu = nd or {'placa': 'No se cambia por separado en uso doméstico: si falla, se cambia la placa madre completa o se repara con soldadura especializada.',
            'fuente': 'No se cambia por separado en uso doméstico: si falla, se reemplaza la fuente completa.',
            'cpu_memoria': 'Se cambia junto con el conjunto al que pertenece (CPU, disipador o módulo de memoria); no se repone por separado.',
            'gpu_almacenamiento': 'No se cambia por separado: si falla, se reemplaza la tarjeta o la unidad de almacenamiento completa.'}.get(m) or (cu if len(cu) >= 40 else cu.rstrip('.') + '; en uso normal se cambia solo cuando está dañada o deformada.')
    if p.get('supuesto') and 'aproximad' not in (va or ''): va = f'{va}; {NOTA}' if va else NOTA[0].upper() + NOTA[1:]
    piezas[p['nombre']] = dict(funcion=fu, como_se_desgasta=de, prueba=pr, valor_esperado=va, cuando_cambiar=cu, tip_taller=ti)
R_ = C['recorridos']
des = []
for s, (ins, pre) in zip(R_['desarme'], pasos.DESARME):
    des.append({**{k: s[k] for k in ('paso', 'titulo', 'quita', 'foco', 'vista', 'herramienta')}, 'instruccion': ins, 'precaucion': pre})
arm = [dict(paso=s['paso'], titulo=s['titulo'], pone=s['pone'], foco=f, vista=v, herramienta=h, instruccion=i, precaucion=pr)
       for s, (f, v, h, i, pr) in zip(R_['ensamblado'], pasos.ARMADO)]
procs = [dict(id='armado', nombre='Armado paso a paso', modo='armado', pasos=arm)]
for k, (pc, tx) in enumerate(zip(R_['procedimientos'], pasos.PROC)):
    ps = []
    for s, (h, i, pr) in zip(pc['pasos'], tx):
        ps.append(dict(paso=s['paso'], titulo=s['titulo'], quita=s['quita'], foco=s['foco'], vista=pasos.VISTA_PROC[k], herramienta=h, instruccion=i, precaucion=pr))
    procs.append(dict(id=f'proc{k + 1}', nombre=pc['nombre'], solo=pc['solo'], pasos=ps))
fn = []
for e, (t, tx, ley, extra, vid) in zip(C['funcionamiento'], pasos.FUNC):
    pz = list(e['piezas']) + [x for x in vid if x not in e['piezas']]
    fn.append(dict(titulo=t, texto=tx, piezas=pz, foco=e['foco'], capas=list(e['capas']) + extra, vista=e['vista'], giro=e['giro'], leyenda=ley, vidrio=vid))
d = dict(aviso=old['aviso'], modelos=old['modelos'], piezas=piezas, desarmados={M: des}, procedimientos={M: procs}, funcionamiento={M: fn})
json.dump(d, open(f'{R}/data.json', 'w'), ensure_ascii=False, indent=1)
print('piezas', len(piezas), 'desarme', len(des), 'armado', len(arm), 'procs', len(procs) - 1, 'etapas', len(fn))
