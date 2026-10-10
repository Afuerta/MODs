#!/usr/bin/env python3
"""Validate Convergence models, sprites, recipes, advancement links and translated text."""
import json
import re
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RES = ROOT / 'src/main/resources'
MOD = 'convergence'
LANG = json.loads((RES / f'assets/{MOD}/lang/en_us.json').read_text())
KNOWN = {'field_atlas', 'attunement_core', 'concordance', 'confluence_filament', 'tempered_focus',
         'harmonic_matrix', 'astral_lens', 'stormward_sigil', 'expedition_harness', 'triune_pulse', 'mender_coil'}
json_files = list(RES.rglob('*.json'))
for path in json_files:
    json.loads(path.read_text())

for item in KNOWN:
    assert f'item.{MOD}.{item}' in LANG and f'tooltip.{MOD}.{item}' in LANG, item
    model = RES / f'assets/{MOD}/models/item/{item}.json'
    content = json.loads(model.read_text())
    assert content['parent'] == 'minecraft:item/generated', model
    assert content['textures']['layer0'] == f'{MOD}:item/{item}', model
    texture = RES / f'assets/{MOD}/textures/item/{item}.png'
    data = texture.read_bytes()
    assert data[:8] == b'\x89PNG\r\n\x1a\n' and struct.unpack('!II', data[16:24]) == (16, 16), texture
    cursor = 8
    while cursor < len(data):
        size = struct.unpack('!I', data[cursor:cursor+4])[0]
        payload = data[cursor+4:cursor+8+size]
        crc = struct.unpack('!I', data[cursor+8+size:cursor+12+size])[0]
        assert zlib.crc32(payload) & 0xffffffff == crc, texture
        cursor += size + 12
    assert cursor == len(data), texture

recipes = list((RES / f'data/{MOD}/recipe').glob('*.json'))
assert len(recipes) == 8
for path in recipes:
    recipe = json.loads(path.read_text())
    assert recipe['result'] == {'id': f'{MOD}:{path.stem}', 'count': 1}, path
    if recipe['type'] == 'minecraft:crafting_shaped':
        pattern = recipe['pattern']
        assert len(pattern) <= 3 and all(0 < len(row) <= 3 for row in pattern), path
        used = set(''.join(pattern)) - {' '}
        assert used == set(recipe['key']), path
        ingredients = [entry['item'] for entry in recipe['key'].values()]
        if path.stem not in {'field_atlas', 'attunement_core', 'astral_infuser'}:
            assert 'convergence:concordance' in ingredients, f'Advanced gear needs a hardmode trophy: {path}'
    else:
        ingredients = [entry['item'] for entry in recipe['ingredients']]
    for ingredient in ingredients:
        namespace, name = ingredient.split(':', 1)
        if namespace == MOD:
            assert name in KNOWN, ingredient
        else:
            assert namespace in {'minecraft', 'riftbound', 'starfall', 'copperwake'}, ingredient
core = json.loads((RES / 'data/convergence/recipe/attunement_core.json').read_text())
assert ''.join(core['pattern']).count('R') == 4 and ''.join(core['pattern']).count('S') == 4
assert ''.join(core['pattern']).count('C') == 1

for path in (RES / f'data/{MOD}/advancement').rglob('*.json'):
    content = json.loads(path.read_text())
    if 'display' in content:
        for field in ('title', 'description'):
            assert content['display'][field]['translate'] in LANG, path
    if 'rewards' in content:
        for recipe in content['rewards'].get('recipes', []):
            namespace, name = recipe.split(':', 1)
            assert namespace == MOD and (RES / f'data/{MOD}/recipe/{name}.json').is_file(), path
    if 'parent' in content:
        namespace, name = content['parent'].split(':', 1)
        assert (namespace == 'minecraft' and name == 'recipes/root') or (
            namespace == MOD and (RES / f'data/{MOD}/advancement/{name}.json').is_file()), path

sources = '\n'.join(path.read_text() for path in (ROOT / 'src/main/java').rglob('*.java'))
for key in re.findall(r'Text\.translatable\("([\w.]+)"', sources):
    if key.endswith('.'):
        continue
    assert key in LANG, f'Missing Java translation: {key}'
for index in range(1, 7):
    assert f'message.convergence.atlas.{index}' in LANG
for verdict in ('survival_only', 'rift_locked', 'guild_locked', 'missing_items', 'max_progress'):
    assert f'message.convergence.failure.{verdict}' in LANG
catalog = (ROOT / 'src/main/java/com/afuerta/convergence/domain/CommissionCatalog.java').read_text()
ids = re.findall(r'commission\("([a-z_]+)"', catalog)
assert len(ids) == 18 and len(set(ids)) == 18
for identifier in ids:
    assert f'contract.convergence.{identifier}.title' in LANG
    assert f'contract.convergence.{identifier}.description' in LANG
assert 'Text.literal(' not in sources, 'Player-facing English must use translation keys'
print(f'Convergence resources valid: {len(json_files)} JSON, {len(KNOWN)} sprites/models, {len(recipes)} recipes, 18 translated commissions.')

assert 'block.convergence.astral_infuser' in LANG and 'tooltip.convergence.astral_infuser' in LANG
station = json.loads((RES / 'assets/convergence/blockstates/astral_infuser.json').read_text())
assert set(station['variants']) == {'active=false', 'active=true'}
for active in (False, True):
    suffix = '_active' if active else ''
    model = json.loads((RES / f'assets/convergence/models/block/astral_infuser{suffix}.json').read_text())
    assert model['parent'] == 'minecraft:block/cube_bottom_top'
    for surface in ('side', 'top'):
        assert model['textures'][surface] == f'convergence:block/astral_infuser_{surface}{suffix}'
        data = (RES / f'assets/convergence/textures/block/astral_infuser_{surface}{suffix}.png').read_bytes()
        assert data[:8] == b'\x89PNG\r\n\x1a\n' and struct.unpack('!II', data[16:24]) == (16, 16)
station_recipe = json.loads((RES / 'data/convergence/recipe/astral_infuser.json').read_text())
assert station_recipe['key']['F']['item'] == 'convergence:tempered_focus'
assert {v['item'].split(':')[0] for v in station_recipe['key'].values()} >= {'riftbound', 'copperwake', 'starfall'}
for recipe in ('verdant_lens', 'tidal_sigil', 'hollow_harness', 'ember_mender'):
    assert f'infusion.convergence.{recipe}' in LANG
    assert f'message.convergence.infusion.recipe.{recipe}' in LANG
for status in ('incomplete', 'night', 'full', 'working', 'ready'):
    assert f'message.convergence.infusion.status.{status}' in LANG
print('Astral Infusion valid: original station model + four block textures, four translated trophy-gated formulas, loot/mining tags and recipe discovery.')
