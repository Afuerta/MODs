# Convergence: Threefold Expeditions

Convergence joins **Riftbound 0.2.0**, **Copperwake** and the **Starfall Fabric 0.2.0 port**
on Minecraft Java **1.21.1**, Fabric Loader **0.16.14+**, Fabric API **0.116.17+1.21.1**
and Java **21**. Install all four Fabric mod jars and Fabric API on clients and servers.
The original NeoForge Starfall jar does not belong in this Fabric installation.

## Start an expedition

1. Clear a Riftbound Initiate trial, explore Copperwake's Rustwild, and collect Starfall meteor loot.
2. Craft a Field Atlas with a book, compass, Verdant Echo, Scrap and Star Shard.
   Right-click it for the route; sneak and right-click for the current commission.
3. Deliver `/convergence contract` orders with `/convergence turnin`. You keep every item
   until the full order and its progression gates are satisfied.
4. Craft an Attunement Core with **four Resonance Shards, four Star Shards and one Charged Core**:

   | Resonance | Star Shard | Resonance |
   |---|---|---|
   | Star Shard | Charged Core | Star Shard |
   | Resonance | Star Shard | Resonance |

5. Hold a Core in your **offhand** when opening an unlocked **Adept or Exalted**
   Riftbound trial. One Core is consumed when the trial starts. Each surviving participant in a successful Convergence trial receives
   one Concordance. The Riftbound module owns the combat, party checks, hazards and reward.
6. Spend commission catalysts and Concordance on equipment. Reach all 18 commissions,
   then repeat the circuit for fresh catalysts and equipment for friends.

## Commission circuit

Every order needs items from all three original mods. Your saved completion count fixes the next
commission; reopening the Atlas cannot reroll it. Contracts consume listed materials.

| # | Commission | Rift tier | Guild deliveries | Additional goal |
|---|---|---:|---:|---|
| 1 | The First Signal | 1 | 0 | Amethyst calibration |
| 2 | A Copper Constellation | 1 | 0 | Starstone observatory |
| 3 | Remember the Tides | 1 | 0 | Prismarine survey |
| 4 | The Verdant Observatory | 1 | 4 | Verdant Echoes; first Focus |
| 5 | The Buried Star Chart | 1 | 4 | Starsteel and deepslate |
| 6 | The Adept Concord | 2 | 4 | One Concordance |
| 7 | Carry the Ember Relay | 2 | 4 | Ember Echoes |
| 8 | The Frost Clock | 2 | 4 | Packed ice |
| 9 | Salvage the Storm | 2 | 4 | Lightning rods |
| 10 | Navigation in the Hollow | 2 | 12 | Hollow Echoes |
| 11 | The Artificer's Lantern | 2 | 12 | Glowstone |
| 12 | The Exalted Concord | 3 | 12 | One Concordance; first Matrix |
| 13 | Archive the Tides | 3 | 12 | Tidal Echoes |
| 14 | The Sky Foundry | 3 | 12 | Blaze rods |
| 15 | A Beacon Beyond the Void | 3 | 12 | Ender pearls |
| 16 | The Threefold Map | 3 | 12 | Ancient-city Echo Shards |
| 17 | The Foreman's Eclipse | 3 | 12 | Foundry Foreman Heart |
| 18 | The Harmonic Horizon | 3 | 12 | Two Concordances; two Matrices |

Rift tiers are highest **completed** tier: Initiate = 1, Adept = 2, Exalted = 3.
Copperwake Mechanist starts after 4 deliveries; Artificer after 12. Convergence reads those
existing counters without changing them. A trophy from either Adept or Exalted Convergence
can satisfy any trophy requirement; commission 12 also requires saved Exalted completion.

Second-circuit material costs are doubled; third and later circuits cost triple.
Concordance costs and catalyst rewards stay fixed. No commission reward is an input to any
commission, so rewards cannot manufacture the next order.

## Equipment and catalysts

| Item | Use |
|---|---|
| Confluence Filament | Every commission awards these; powers gadgets and equipment recipes |
| Tempered Focus | Milestone catalyst for advanced equipment |
| Harmonic Matrix | Earned at commissions 12 and 18; used in the strongest gear |
| Astral Lens | Offhand Night Vision |
| Stormward Sigil | Offhand Fire Resistance and Water Breathing |
| Expedition Harness | Offhand Speed I, Jump Boost II and Slow Falling |
| Triune Pulse | Right-click to repel and slow up to six visible hostiles within six blocks |
| Mender Coil | Put it in your main hand and damaged equipment in your offhand; right-click to restore up to 64 durability |

Every advanced equipment recipe requires Concordance. The Pulse spends one Filament and has
a 15-second cooldown; the Coil spends one Filament and has a 20-second cooldown. Invalid targets,
missing fuel and cooldown retries spend nothing. Pulse never damages terrain, players or animals.
All equipment is transferable; acquiring the item is its access requirement.

The recipe book discovers the Atlas when you obtain a book, the Core when you obtain Resonance,
and all five equipment recipes when you obtain your first Filament. It shows the exact assembly
patterns and their cross-mod materials.

Passive equipment works for living Survival and Adventure players. Effects fade within two seconds
after swapping offhand items, except Night Vision fades within 13 seconds to avoid the vanilla
short-duration flicker. Brief overlap when swapping is normal. The Stormward Sigil protects against
ordinary fire but Convergence hazards can still deal other damage.

## Commands and persistence

- `/convergence help` — commands and guide entry point.
- `/convergence status` — commission count and external progression.
- `/convergence contract` — exact requirements, current inventory amounts and rewards.
- `/convergence turnin` — validates and consumes the whole order in one server-thread transaction.
- `/convergence kit` — permission level 2; gear and fuel for operator testing. Does not grant
  guild rank, Rift completion, Concordance or commission completion.

Commission completion uses the vanilla `convergence_jobs` scoreboard objective, with a **UUID**
score holder. It survives normal world saves, reconnects, death and username changes. Commands do
not write the `riftbound_progress` or `cw_contracts` objectives. Inventories and dropped rewards
follow normal Minecraft save and death rules. Full inventories receive owner-marked reward drops.

## Build and verify

Build the whole Fabric pack from `minecraft/` so sibling mod dependencies are available:

```sh
./gradlew :convergence:build
./gradlew :convergence:runGameTest
```

Standalone compilation also works in this module. To run its GameTests standalone, point
`-PpackModsDir=/absolute/path/to/pack/jars` at the other three built Fabric mod jars.

```sh
./gradlew build
./gradlew -PpackModsDir=/absolute/path/to/pack/jars runGameTest
python3 tools/validate_resources.py
```

`build` runs the pure `domainTest` rules and resource validation. Domain tests cover circuit order,
material scaling, trophy gates, counter saturation and reward economy. Eight headless GameTests
cover the loaded four-mod registries, recipes and advancements; failed delivery atomicity; accepted
delivery reward/progress; hardmode milestone linkage; two full circuits; gadget fuel/cooldowns;
and passive effects through real server ticks. Client rendering and in-game feel need a desktop
play session. The tests use their own Fabric test source set and do not ship in the release jar.

Verified for this expansion: **6,042 domain checks**, resource validation of **32 JSON files,
11 sprites/models and 7 recipes**, and **all 8 Convergence GameTests** passed. The combined
four-mod server suite passed **all 45 required tests**. The Mender Coil check uses actual
`ServerPlayerInteractionManager.interactItem` dispatch with the Coil in the main hand and a
damaged Bow in the offhand, including invalid-target, fuel and cooldown checks.

Sprites are authored as explicit pixel primitives in `tools/generate_assets.py`, which writes
the eleven 16×16 textures and their models alongside recipes, translations and advancements.
Run that script after editing those definitions.
