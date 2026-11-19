#!/usr/bin/env python3
"""Valida data.json contra contrato.json (pctorre). Sale con código 1 si algo falla."""
import json, re, os, sys
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(f'{R}/data.json')); C = json.load(open(f'{R}/contrato.json'))
err = []
E = lambda m, t: err.append(f'[{m}] {t}')
ID = {p['id']: p for p in C['piezas']}; M = C['modelo']
print('ids del contrato:', len(ID))
vistas = set(re.findall(r'^    (\w+): \{ pos', open(f'{R}/index.js').read(), re.M)) | {'general'}
capas = set(re.findall(r'^\s*C\.(\w+)\s*=', open(f'{R}/vivo.js').read(), re.M))
# fichas
nombres = [p['nombre'] for p in C['piezas']]
if len(set(nombres)) != len(nombres): E('fichas', 'nombres repetidos')
for p in C['piezas']:
    f = d['piezas'].get(p['nombre'])
    if not f: E('fichas', f'sin ficha: {p["id"]}'); continue
    for c in ('funcion', 'como_se_desgasta', 'prueba', 'cuando_cambiar', 'tip_taller'):
        if not f.get(c) or len(f[c]) < 15: E('fichas', f'{p["id"]}: {c} vacío o muy corto')
    if p.get('supuesto') and 'aproximad' not in (f.get('valor_esperado') or ''): E('fichas', f'{p["id"]}: supuesto sin marca «aproximado»')
extra = set(d['piezas']) - set(nombres)
if extra: E('fichas', f'fichas sin pieza: {sorted(extra)[:3]}')
# desarme
P = d['desarmados'][M]
if [p['paso'] for p in P] != list(range(1, len(P) + 1)) or len(P) != 23: E('desarme', 'debe tener 23 pasos numerados')
def pasos(nom, ps, campos):
    for p in ps:
        for c in ('instruccion', 'herramienta', 'vista', 'titulo'):
            if not p.get(c): E(nom, f'paso {p["paso"]} sin {c}')
        if len(p.get('instruccion', '')) < 50: E(nom, f'paso {p["paso"]}: instrucción corta')
        if p.get('vista') not in vistas: E(nom, f'paso {p["paso"]}: vista inexistente {p.get("vista")}')
        for c in campos:
            for x in p.get(c, []):
                if x not in ID: E(nom, f'paso {p["paso"]} {c}: id inexistente {x}')
pasos('desarme', P, ('quita', 'foco'))
quitadas = [x for p in P for x in p['quita']]
if len(quitadas) != len(set(quitadas)) or set(quitadas) != set(ID) - {'caja_chasis'}: E('desarme', f'quita no cubre exactamente el contrato ({len(set(quitadas))}/{len(ID) - 1}; el chasis queda)')
PR = d['procedimientos'][M]
arm = next(x for x in PR if x.get('modo') == 'armado')
if len(arm['pasos']) != 15: E('armado', 'debe tener 15 pasos')
pasos('armado', arm['pasos'], ('pone', 'foco'))
pone = [x for p in arm['pasos'] for x in p['pone']]
if len(pone) != len(set(pone)) or set(pone) != set(ID): E('armado', f'pone no cubre cada id una vez ({len(set(pone))}/{len(ID)})')
if len(PR) != 7: E('procs', 'esperados armado + 6 procedimientos')
for x in PR:
    if x.get('modo') == 'armado': continue
    for s in x['solo']:
        if s not in ID: E(x['id'], f'solo: {s}')
    pasos(x['nombre'], x['pasos'], ('quita', 'foco'))
    for p in x['pasos']:
        for c in ('quita', 'foco'):
            for i in p[c]:
                if i not in x['solo']: E(x['nombre'], f'paso {p["paso"]} {c}: {i} fuera de «solo»')
# funcionamiento
F = d['funcionamiento'][M]
if len(F) != 11: E('funciona', 'deben ser 11 etapas')
for i, e in enumerate(F, 1):
    if len(e['texto']) < 120: E('funciona', f'etapa {i}: texto corto')
    if e['vista'] not in vistas: E('funciona', f'etapa {i}: vista {e["vista"]}')
    for c in e['capas']:
        if c not in capas: E('funciona', f'etapa {i}: capa sin definir {c}')
    for c in ('piezas', 'foco', 'vidrio'):
        for x in e.get(c, []):
            if x not in ID: E('funciona', f'etapa {i} {c}: {x}')
    for x in e.get('vidrio', []):
        if x not in e['piezas']: E('funciona', f'etapa {i}: vidrio {x} fuera de piezas')
# estilo y relleno
tics = re.compile(r'—|–|→|\*\*|No solo|sino también|En resumen|Cabe (destacar|señalar)|es importante|juega un (rol|papel)|robust|de manera (eficiente|efectiva)|en términos de|abordar|\\bTODO\\b|lorem|xxx')
def textos(o, r=''):
    if isinstance(o, str): yield r, o
    elif isinstance(o, dict):
        for k, v in o.items(): yield from textos(v, r + '/' + k)
    elif isinstance(o, list):
        for i, v in enumerate(o): yield from textos(v, r + f'[{i}]')
for r, s in textos({k: d[k] for k in ('piezas', 'desarmados', 'procedimientos', 'funcionamiento')}):
    if tics.search(s) or '·' in s: E('estilo', f'{r}: {s[:60]}')
# fichas duplicadas literales (relleno)
vistos = {}
for n, f in d['piezas'].items():
    for c in ('funcion', 'tip_taller'):
        k = (c, f[c]); 
        if k in vistos: E('relleno', f'{c} idéntico en «{n}» y «{vistos[k]}»')
        vistos[k] = n
print('errores:', len(err)); [print(' ', x) for x in err[:60]]
sys.exit(1 if err else 0)
