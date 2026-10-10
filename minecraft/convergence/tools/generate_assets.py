#!/usr/bin/env python3
"""Create the authored 16x16 item sprites, recipes, models and English translations.

No external imaging dependency: pixel primitives are encoded to PNG with stdlib zlib.
Only this mod's assets are written. Run again after editing the definitions below.
"""
import json
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESOURCES = ROOT / 'src/main/resources'
PALETTE = {'o': (26, 24, 56, 255), 'c': (199, 126, 76, 255), 'g': (242, 204, 108, 255),
           'v': (123, 98, 207, 255), 'b': (124, 216, 239, 255), 'w': (236, 250, 255, 255)}
NAMES = {'field_atlas': 'Threefold Field Atlas', 'attunement_core': 'Attunement Core',
         'concordance': 'Concordance', 'confluence_filament': 'Confluence Filament',
         'tempered_focus': 'Tempered Focus', 'harmonic_matrix': 'Harmonic Matrix',
         'astral_lens': 'Astral Lens', 'stormward_sigil': 'Stormward Sigil',
         'expedition_harness': 'Expedition Harness', 'triune_pulse': 'Triune Pulse', 'mender_coil': 'Mender Coil'}


def put_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n')


def sprite(name):
    cells = [['.' for _ in range(16)] for _ in range(16)]
    def point(x, y, color):
        if 0 <= x < 16 and 0 <= y < 16:
            cells[y][x] = color
    def rect(left, top, right, bottom, color):
        for y in range(top, bottom + 1):
            for x in range(left, right + 1):
                point(x, y, color)
    def line(x1, y1, x2, y2, color):
        steps = max(abs(x2 - x1), abs(y2 - y1), 1)
        for step in range(steps + 1):
            point(round(x1 + (x2 - x1) * step / steps), round(y1 + (y2 - y1) * step / steps), color)
    def diamond(cx, cy, radius, color):
        for y in range(cy - radius, cy + radius + 1):
            for x in range(cx - radius, cx + radius + 1):
                if abs(cx - x) + abs(cy - y) <= radius:
                    point(x, y, color)
    def ring(cx, cy, radius, color):
        for y in range(16):
            for x in range(16):
                distance = (x-cx)**2 + (y-cy)**2
                if (radius-1)**2 <= distance <= radius**2:
                    point(x, y, color)
    if name == 'field_atlas':
        rect(2, 2, 13, 13, 'o'); rect(3, 3, 12, 12, 'v'); rect(3, 3, 4, 12, 'c')
        diamond(9, 7, 3, 'b'); line(9, 4, 9, 10, 'w'); line(6, 7, 12, 7, 'g')
    elif name == 'attunement_core':
        ring(7, 7, 6, 'o'); ring(7, 7, 5, 'c'); diamond(7, 7, 3, 'v')
        for x, y, color in [(7, 2, 'b'), (2, 10, 'g'), (12, 10, 'w')]:
            diamond(x, y, 2, color)
    elif name == 'concordance':
        for x, y, color in [(7, 4, 'b'), (4, 10, 'c'), (11, 10, 'v')]:
            diamond(x, y, 4, 'o'); diamond(x, y, 3, color); diamond(x, y, 1, 'w')
        diamond(7, 8, 2, 'g')
    elif name == 'confluence_filament':
        for offset, color in [(0, 'c'), (2, 'v'), (4, 'b')]:
            line(3+offset, 2, 8+offset, 7, 'o'); line(8+offset, 7, 3+offset, 13, 'o')
            line(3+offset, 3, 7+offset, 7, color); line(7+offset, 7, 3+offset, 12, color)
        rect(2, 1, 9, 2, 'g'); rect(2, 13, 9, 14, 'g')
    elif name == 'tempered_focus':
        diamond(7, 7, 7, 'o'); diamond(7, 7, 6, 'c'); diamond(7, 7, 4, 'v'); diamond(7, 7, 2, 'b')
        point(7, 6, 'w'); point(7, 3, 'g')
    elif name == 'harmonic_matrix':
        rect(2, 2, 13, 13, 'o'); rect(3, 3, 12, 12, 'v')
        for x in (4, 7, 10):
            line(x, 3, x, 12, 'b')
        for y in (4, 7, 10):
            line(3, y, 12, y, 'c')
        diamond(7, 7, 2, 'g'); point(7, 6, 'w')
    elif name == 'astral_lens':
        ring(7, 7, 6, 'o'); ring(7, 7, 5, 'g'); diamond(7, 7, 4, 'v'); diamond(7, 7, 2, 'b')
        line(10, 10, 13, 13, 'o'); line(11, 10, 14, 13, 'c'); point(6, 6, 'w')
    elif name == 'stormward_sigil':
        line(3, 2, 12, 2, 'o'); rect(2, 3, 13, 8, 'o'); diamond(7, 9, 5, 'o')
        rect(3, 3, 12, 8, 'c'); diamond(7, 9, 4, 'v')
        line(8, 4, 6, 8, 'b'); line(6, 8, 9, 8, 'b'); line(9, 8, 7, 12, 'w')
    elif name == 'expedition_harness':
        rect(2, 2, 5, 12, 'o'); rect(10, 2, 13, 12, 'o'); rect(3, 3, 4, 11, 'c'); rect(11, 3, 12, 11, 'c')
        rect(2, 7, 13, 10, 'o'); rect(3, 8, 12, 9, 'v'); diamond(7, 8, 2, 'g'); point(7, 8, 'b')
    elif name == 'triune_pulse':
        line(4, 13, 11, 4, 'o'); line(5, 13, 12, 4, 'c'); ring(10, 5, 4, 'o'); ring(10, 5, 3, 'v')
        diamond(10, 5, 2, 'b'); point(10, 4, 'w'); line(2, 12, 5, 14, 'g')
    elif name == 'mender_coil':
        line(3, 13, 11, 5, 'o'); line(4, 13, 12, 5, 'c'); ring(10, 4, 4, 'o'); ring(10, 4, 3, 'b')
        rect(9, 0, 11, 3, '.'); line(6, 7, 9, 10, 'v'); line(5, 8, 8, 11, 'g')
    pixels = [PALETTE.get(cell, (0, 0, 0, 0)) for row in cells for cell in row]
    def chunk(kind, body):
        return struct.pack('!I', len(body)) + kind + body + struct.pack('!I', zlib.crc32(kind + body) & 0xffffffff)
    rows = b''.join(b'\0' + bytes(value for pixel in pixels[y*16:(y+1)*16] for value in pixel) for y in range(16))
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('!2I5B', 16, 16, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(rows)) + chunk(b'IEND', b'')
    target = RESOURCES / f'assets/convergence/textures/item/{name}.png'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(png)


for name in NAMES:
    sprite(name)
    put_json(RESOURCES / f'assets/convergence/models/item/{name}.json',
             {'parent': 'minecraft:item/generated', 'textures': {'layer0': f'convergence:item/{name}'}})


def shaped(name, pattern, key):
    put_json(RESOURCES / f'data/convergence/recipe/{name}.json',
             {'type': 'minecraft:crafting_shaped', 'category': 'equipment', 'pattern': pattern,
              'key': {symbol: {'item': item} for symbol, item in key.items()},
              'result': {'id': f'convergence:{name}', 'count': 1}})


shaped('attunement_core', ['RSR', 'SCS', 'RSR'],
       {'R': 'riftbound:resonance_shard', 'S': 'starfall:star_shard', 'C': 'copperwake:charged_core'})
shaped('astral_lens', ['FSF', 'LCL', 'FTF'],
       {'F': 'convergence:confluence_filament', 'S': 'starfall:starsteel_ingot', 'L': 'copperwake:memory_glass',
        'C': 'convergence:concordance', 'T': 'convergence:tempered_focus'})
shaped('stormward_sigil', ['SFS', 'CMC', 'RFR'],
       {'S': 'starfall:starsteel_ingot', 'F': 'convergence:confluence_filament', 'C': 'convergence:concordance',
        'M': 'convergence:harmonic_matrix', 'R': 'copperwake:charged_core'})
shaped('expedition_harness', ['FLF', 'SCS', 'LML'],
       {'F': 'convergence:tempered_focus', 'L': 'convergence:confluence_filament', 'S': 'starfall:starsteel_ingot',
        'C': 'convergence:concordance', 'M': 'convergence:harmonic_matrix'})
shaped('triune_pulse', ['SFS', 'LCL', 'TMT'],
       {'S': 'starfall:starsteel_ingot', 'F': 'convergence:tempered_focus', 'L': 'convergence:confluence_filament',
        'C': 'convergence:concordance', 'T': 'copperwake:charged_core', 'M': 'convergence:harmonic_matrix'})
shaped('mender_coil', ['FGF', 'TCT', 'FMF'],
       {'F': 'convergence:confluence_filament', 'G': 'convergence:tempered_focus', 'T': 'copperwake:brass_gear',
        'C': 'convergence:concordance', 'M': 'copperwake:charged_core'})
put_json(RESOURCES / 'data/convergence/recipe/field_atlas.json',
         {'type': 'minecraft:crafting_shapeless', 'category': 'equipment',
          'ingredients': [{'item': item} for item in ['minecraft:book', 'minecraft:compass',
              'riftbound:verdant_echo', 'copperwake:scrap', 'starfall:star_shard']],
          'result': {'id': 'convergence:field_atlas', 'count': 1}})

for recipe in ['field_atlas', 'attunement_core', 'astral_lens', 'stormward_sigil',
               'expedition_harness', 'triune_pulse', 'mender_coil']:
    discovery = 'minecraft:book' if recipe == 'field_atlas' else (
        'riftbound:resonance_shard' if recipe == 'attunement_core' else 'convergence:confluence_filament')
    put_json(RESOURCES / f'data/convergence/advancement/recipes/{recipe}.json', {
        'parent': 'minecraft:recipes/root',
        'criteria': {
            'has_material': {'trigger': 'minecraft:inventory_changed',
                             'conditions': {'items': [{'items': [discovery]}]}},
            'has_recipe': {'trigger': 'minecraft:recipe_unlocked', 'conditions': {'recipe': f'convergence:{recipe}'}}
        },
        'requirements': [['has_material', 'has_recipe']],
        'rewards': {'recipes': [f'convergence:{recipe}']}
    })

LANG = {f'item.convergence.{name}': display for name, display in NAMES.items()}
LANG.update({
    'itemGroup.convergence': 'Convergence: Threefold Expeditions',
    'scoreboard.convergence.progress': 'Threefold Commissions',
    'tooltip.convergence.field_atlas': 'Right-click for expedition guidance. Sneak + right-click for your current commission.',
    'tooltip.convergence.attunement_core': 'Hold in your offhand when opening an Adept or Exalted Rift to enter Convergence mode. One core is consumed on activation.',
    'tooltip.convergence.concordance': 'One trophy per surviving participant after a successful Adept or Exalted Convergence trial.',
    'tooltip.convergence.confluence_filament': 'Earned from threefold commissions. Powers Triune Pulses and Mender Coils; used in expedition equipment.',
    'tooltip.convergence.tempered_focus': 'A commission milestone catalyst. Combine with Concordance to assemble advanced equipment.',
    'tooltip.convergence.harmonic_matrix': 'Earned at commissions 12 and 18. A lattice for the strongest expedition devices.',
    'tooltip.convergence.astral_lens': 'Offhand: Night Vision. Its glow fades up to 13 seconds after removing the lens.',
    'tooltip.convergence.stormward_sigil': 'Offhand: Fire Resistance and Water Breathing. Convergence damage can still harm you.',
    'tooltip.convergence.expedition_harness': 'Offhand: Speed I, Jump Boost II and Slow Falling. Effects fade within two seconds.',
    'tooltip.convergence.triune_pulse': 'Right-click: repel and slow up to six visible hostiles within six blocks. Costs one Filament; 15-second cooldown.',
    'tooltip.convergence.mender_coil': 'Main hand + right-click: repair the damaged item in your offhand by up to 64 durability. Costs one Filament; 20-second cooldown.',
    'message.convergence.status': 'Threefold commissions: %s complete | circuit %s, commission %s/18 | Rift tier %s/3 | guild deliveries %s',
    'message.convergence.contract': 'Commission: %s',
    'message.convergence.gates': 'Requires Rift completion tier %s and %s Copperwake guild deliveries.',
    'message.convergence.requirement': '  %s/%s %s',
    'message.convergence.reward': 'Reward: %s',
    'message.convergence.amount': '%s %s',
    'message.convergence.separator': ', ',
    'message.convergence.turnin_hint': 'Use /convergence turnin with the entire order in your inventory. All listed supplies are consumed together.',
    'message.convergence.delivered': 'Commission delivered: %s',
    'message.convergence.circuit_complete': 'Harmonic horizon reached! The next circuit repeats these expeditions with more materials and the same rewards.',
    'message.convergence.failure.survival_only': 'Use Survival or Adventure mode while alive to deliver commissions or power expedition devices.',
    'message.convergence.failure.rift_locked': 'Complete the required Riftbound tier first. Nothing was consumed.',
    'message.convergence.failure.guild_locked': 'Complete the required Copperwake guild deliveries first. Nothing was consumed.',
    'message.convergence.failure.missing_items': 'The order is incomplete. Nothing was consumed. Use /convergence contract to see missing supplies.',
    'message.convergence.failure.max_progress': 'Your commission counter has reached its limit. Nothing was consumed.',
    'message.convergence.pulse_empty': 'No visible hostile within six blocks. No Filament was consumed.',
    'message.convergence.pulse_result': 'Triune pulse repelled and slowed %s hostile(s).',
    'message.convergence.repair_mainhand': 'Put the Mender Coil in your main hand and the damaged equipment in your offhand.',
    'message.convergence.repair_target': 'Your offhand item has no durability damage. No Filament was consumed.',
    'message.convergence.repair_result': 'Mender Coil restored %s durability.',
    'message.convergence.filament_needed': 'You need one Confluence Filament from commissions to power this device.',
    'message.convergence.kit': 'Operator expedition equipment granted. Rift and guild progression are unchanged; trial trophies still require victories.',
    'message.convergence.help': '/convergence status: saved progress; /convergence contract: current fixed delivery; /convergence turnin: deliver all supplies atomically. Craft a Field Atlas for the route. Operators: /convergence kit.',
    'message.convergence.atlas_title': 'CONVERGENCE • Threefold Field Atlas',
    'message.convergence.atlas.1': '1. Explore Copperwake\'s Rustwild for Scrap and Memory Glass. Complete four guild deliveries to reach Mechanist, then twelve to reach Artificer.',
    'message.convergence.atlas.2': '2. Hunt Starfall meteor craters at night. Gather Star Shards and Stardust, then forge Starsteel for advanced commissions and equipment.',
    'message.convergence.atlas.3': '3. Clear Riftbound Initiate trials for Resonance Shards. Craft an Attunement Core from four Resonance Shards, four Star Shards and one Charged Core.',
    'message.convergence.atlas.4': '4. Hold an Attunement Core in your offhand when opening an unlocked Adept or Exalted Rift. One Core is consumed. Clear the Convergence trial to earn Concordance.',
    'message.convergence.atlas.5': '5. Deliver the 18 fixed commissions with /convergence turnin. Commissions 6, 12 and 18 need fresh Convergence trophies; 17 needs a Foundry Foreman Heart.',
    'message.convergence.atlas.6': '6. Spend Filaments, Focuses, Matrices and Concordance on offhand relics or expedition gadgets. Later circuits need 2x then 3x materials; trophy costs and rewards stay fixed.'
})
STORIES = [
    ('first_signal', 'The First Signal', 'A copper relay hears a note inside the fallen stars. Bring resonance, salvage and sky crystal to prove the worlds share a frequency.'),
    ('copper_constellation', 'A Copper Constellation', 'Mount a ring of starstone on gears. The new observatory must follow both the sky and the forgotten machines.'),
    ('remember_the_tides', 'Remember the Tides', 'Memory glass refuses to remember rain. Prismarine and stardust might teach the rifts how to chart an ocean.'),
    ('verdant_observatory', 'The Verdant Observatory', 'The Mechanists want a living lens. Stabilize their salvaged frame with verdant echoes and meteoric shards.'),
    ('buried_star_chart', 'The Buried Star Chart', 'A deepslate chart records an eclipse that has not happened. Starsteel teeth can turn its silent calendar.'),
    ('adept_concord', 'The Adept Concord', 'Return from an Adept or Exalted Convergence trial with Concordance. Only a hard-won agreement can lock this charged relay into tune.'),
    ('ember_relay', 'Carry the Ember Relay', 'The cinder works need a heat memory. Seal ember echoes behind glass and use stardust to keep their message alive.'),
    ('frost_clock', 'The Frost Clock', 'A frozen clock skips every third hour. Fit sky-forged hands to the copper movement before the ice forgets winter.'),
    ('storm_salvage', 'Salvage the Storm', 'Build lightning rods for an array fed by charged cores, star shards and the dangerous hum of a stronger rift.'),
    ('hollow_navigation', 'Navigation in the Hollow', 'The Artificers found a route without a sky. Hollow echoes and memory glass will carry a map where compasses fail.'),
    ('artificer_lantern', 'The Artificer\'s Lantern', 'A lantern that shines across dimensions needs starsteel shutters, glowstone and a mechanism that never loses its rhythm.'),
    ('exalted_concord', 'The Exalted Concord', 'Complete Exalted Rift progression and return with another Convergence trophy. The first Harmonic Matrix will connect all three worlds.'),
    ('tide_archive', 'Archive the Tides', 'Record every shore in tidal echoes. Glass, stardust and resonance will keep the archive from being washed away.'),
    ('sky_foundry', 'The Sky Foundry', 'Fire from the Nether must meet steel from the stars. Fit the foundry with copper gears and rift-tempered calibration.'),
    ('void_beacon', 'A Beacon Beyond the Void', 'Ender pearls bend its beam toward impossible destinations. Feed the beacon a fresh charge from all three expeditions.'),
    ('threefold_map', 'The Threefold Map', 'The ancient city left a final echo. Combine it with glass memories and sky dust to chart the spaces between worlds.'),
    ('foreman_eclipse', 'The Foreman\'s Eclipse', 'Defeat a Foundry Foreman in the Rustwild and bring its Heart. The sky foundry cannot wake until its old master rests.'),
    ('harmonic_horizon', 'The Harmonic Horizon', 'Bring two fresh Concordances and a full triune offering. The horizon answers, completing the circuit and opening the next expedition.')
]
for name, title, story in STORIES:
    LANG[f'contract.convergence.{name}.title'] = title
    LANG[f'contract.convergence.{name}.description'] = story

ADVANCEMENTS = [('root', 'field_atlas', None, 'Three Worlds, One Route', 'Craft a Field Atlas and begin the Threefold Expeditions.'),
                ('attunement', 'attunement_core', 'root', 'A Shared Frequency', 'Assemble an Attunement Core from all three mods.'),
                ('concord', 'concordance', 'attunement', 'A Hard-Won Concord', 'Survive a Convergence trial and receive Concordance.'),
                ('focus', 'tempered_focus', 'root', 'Focus the Expedition', 'Earn a Tempered Focus from an authored commission.'),
                ('matrix', 'harmonic_matrix', 'concord', 'Across the Harmonic Horizon', 'Reach a late commission milestone and earn a Harmonic Matrix.')]
for name, item, parent, title, description in ADVANCEMENTS:
    LANG[f'advancement.convergence.{name}.title'] = title
    LANG[f'advancement.convergence.{name}.description'] = description
    advancement = {'display': {'icon': {'id': f'convergence:{item}'},
                    'title': {'translate': f'advancement.convergence.{name}.title'},
                    'description': {'translate': f'advancement.convergence.{name}.description'},
                    'frame': 'challenge' if name == 'matrix' else 'task', 'show_toast': True, 'announce_to_chat': False},
                   'criteria': {'obtained': {'trigger': 'minecraft:inventory_changed',
                     'conditions': {'items': [{'items': [f'convergence:{item}']}]}}},
                   'requirements': [['obtained']]}
    if parent:
        advancement['parent'] = f'convergence:{parent}'
    else:
        advancement['display']['background'] = 'minecraft:textures/block/deepslate_tiles.png'
    put_json(RESOURCES / f'data/convergence/advancement/{name}.json', advancement)
put_json(RESOURCES / 'assets/convergence/lang/en_us.json', LANG)
print(f'Generated {len(NAMES)} sprites/models, 7 recipes, {len(ADVANCEMENTS)} visible + 7 recipe advancements, {len(LANG)} translations.')
