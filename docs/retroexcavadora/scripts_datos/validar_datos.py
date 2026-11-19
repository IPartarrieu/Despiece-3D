#!/usr/bin/env python3
"""Valida data.json contra contrato.json (retroexcavadora). Sale con código 1 si algo falla."""
import json, re, os, sys
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(f'{R}/data.json')); C = json.load(open(f'{R}/contrato.json'))
err = []
def E(m, t): err.append(f'[{m}] {t}')
ID = {}
for e in C['piezas']:
    for pid in (e.get('ids') or [e['id']]): ID[pid] = e
EX = set(C['existentes']); ALL = EX | set(ID)
ap = lambda pid, m: pid in EX or ID[pid]['aplica'] == 'todos' or m in ID[pid]['aplica']
disp = lambda n, r: f'{n} ({r})' if r else n
MODS = [m['modelo'] for m in d['modelos']]
print('ids: contrato', len(ID), '+ existentes', len(EX))
for m in MODS:
    cat = d['catalogoPorModelo'][m]
    esperados = {p for p in ALL if ap(p, m)}
    if set(cat) != esperados: E(m, f'catálogo difiere: faltan {sorted(esperados - set(cat))[:5]} sobran {sorted(set(cat) - esperados)[:5]}')
    # fichas: toda pieza aplicable tiene ficha (por modelo o general) con los 4 campos obligatorios
    for pid in esperados:
        n, r, g = cat[pid]; k = disp(n, r)
        f = d['piezasPorModelo'][m].get(k) or d['piezas'].get(k)
        if not f: E(m, f'sin ficha: {pid} ({k})'); continue
        for c in ('funcion', 'como_se_desgasta', 'prueba', 'cuando_cambiar'):
            if not f.get(c): E(m, f'ficha «{k}» sin {c}')
        if r and not r.startswith('ref. SK'): E(m, f'ref de otra serie sin marcar: {pid} {r}')
    # nombres únicos (la ficha usa el nombre como clave)
    nombres = [disp(v[0], v[1]) for v in cat.values()]
    if len(nombres) != len(set(nombres)): E(m, 'nombres de pieza repetidos')
    # desarme principal y secundarios
    P = d['desarmados'][m]
    if [p['paso'] for p in P] != list(range(1, len(P) + 1)): E(m, 'pasos principales sin numeración continua')
    t = {p['titulo']: p['paso'] for p in P}
    ti = lambda s: next(p['paso'] for p in P if p['titulo'].startswith(s))
    if not ti('Motor fuera') < ti('Convertidor'): E(m, 'H2: el motor debe salir antes que la transmisión')
    en_pasos = set()
    todos = [('principal', P)] + [(x['id'], x['pasos']) for x in d['procedimientos'][m]]
    for nom, ps in todos:
        for p in ps:
            for campo in ('quita', 'foco', 'vidrio'):
                for x in p.get(campo, []):
                    if x not in ALL: E(m, f'{nom} paso {p["paso"]} {campo}: id inexistente {x}')
                    elif not ap(x, m): E(m, f'{nom} paso {p["paso"]} {campo}: {x} no aplica')
                    en_pasos.add(x)
            for c in ('instruccion', 'precaucion', 'herramienta', 'vista'):
                if c not in p: E(m, f'{nom} paso {p["paso"]} sin {c}')
    for x in d['procedimientos'][m]:
        for s in x['solo']:
            if s not in ALL or not ap(s, m): E(m, f'solo de {x["id"]}: {s}')
    for pid in ID:
        if ap(pid, m) and pid not in en_pasos and (disp(*cat[pid][:2]) not in d['piezas'] and disp(*cat[pid][:2]) not in d['piezasPorModelo'][m]): E(m, f'{pid} sin paso ni ficha')
    # funcionamiento
    for i, e in enumerate(d['funcionamiento'][m]):
        for campo in ('piezas', 'foco', 'vidrio'):
            for x in e.get(campo, []):
                if x not in ALL or not ap(x, m): E(m, f'etapa {i + 1} {campo}: {x}')
    # vistas usadas
vistas = set(re.findall(r'^    (\w+): \{ pos', open(f'{R}/index.js').read(), re.M))
for m in MODS:
    for x in d['desarmados'][m] + [p for q in d['procedimientos'][m] for p in q['pasos']]:
        if x['vista'] not in vistas: E(m, f'vista inexistente {x["vista"]}')
    for e in d['funcionamiento'][m]:
        if e['vista'] not in vistas: E(m, f'vista de etapa inexistente {e["vista"]}')
# estilo: sin rayas largas ni separadores · fuera de unidades
tics = re.compile(r'—|–|→|\*\*|No solo|sino también|En resumen|Cabe (destacar|señalar)|es importante|juega un (rol|papel)|robust|de manera (eficiente|efectiva)|en términos de|abordar')
def textos(o, ruta=''):
    if isinstance(o, str): yield ruta, o
    elif isinstance(o, dict):
        for k, v in o.items(): yield from textos(v, ruta + '/' + k)
    elif isinstance(o, list):
        for i, v in enumerate(o): yield from textos(v, ruta + f'[{i}]')
for ruta, s in textos({'piezas': d['piezas'], 'des': d['desarmados']['580N'], 'proc': d['procedimientos']['580N']}):
    if tics.search(s) or re.search(r'(?<!N)·', s): E('estilo', f'{ruta}: {s[:60]}')
print('errores:', len(err)); [print(' ', x) for x in err[:40]]
sys.exit(1 if err else 0)
