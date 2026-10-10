# Copperwake delivery progression

Copperwake's salvage loop is **explore ruins → recover memory glass → gather a themed shipment → deliver it → earn gears and charged cores**. The current delivery always comes from the player's persisted number of completed deliveries. Reopening a depot, relogging, or asking again does not reroll its requirements.

## Ranks and rotation

| Completed deliveries | Rank | Delivery pool | Next rank |
| --- | --- | --- | --- |
| 0–3 | Scrounger | Four introductory shipments, in order | 4 total deliveries |
| 4–11 | Mechanist | Four shipments, repeated twice | 12 total deliveries |
| 12 onward | Artificer | Fourteen shipments, repeating indefinitely | Highest rank |

Only the current rank's pool is selected. Every one of the 22 contracts is reachable during the first 26 completed-count positions (0 through 25). At a rank transition, selection starts at the first contract of the new pool. No random state or world clock participates in selection. Version 0.2 appends eight Artificer orders after the original six: it preserves the original 14 definitions, thresholds, completion counts, and the first 18 positions. Returning Artificers beyond those positions may see a different next order under the longer rotation; no rank or completed delivery is reset.

## Contract economy

All quantities below are per delivery. Each shipment requires both **scrap** and **memory glass**, plus the two listed vanilla resources.

| Rank | Contract | Scrap | Glass | Other resources | Reward |
| --- | --- | ---: | ---: | --- | --- |
| Scrounger | The Broken Survey | 8 | 1 | 12 copper ingots + 4 flint | 3 gears |
| Scrounger | The Lamplighter's Route | 10 | 1 | 8 coal + 4 amethyst shards | 4 gears |
| Scrounger | A Very Sodden Pump | 12 | 1 | 8 iron ingots + 8 kelp | 4 gears |
| Scrounger | Register the Moss | 10 | 2 | 8 moss blocks + 4 redstone | 5 gears |
| Mechanist | A Chart of Missing Winds | 14 | 2 | 12 quartz + 4 feathers | 6 gears + 1 core |
| Mechanist | Cold Start Protocol | 16 | 2 | 12 packed ice + 4 lapis | 7 gears + 1 core |
| Mechanist | The Quartz Choir | 18 | 3 | 12 quartz + 4 glowstone dust | 8 gears + 1 core |
| Mechanist | The Drowned Manifest | 16 | 3 | 8 paper + 8 prismarine shards | 8 gears + 2 cores |
| Artificer | The Chime Below | 24 | 4 | 2 echo shards + 16 deepslate | 10 gears + 3 cores |
| Artificer | Bottle the Next Storm | 28 | 4 | 16 amethyst shards + 4 lightning rods | 12 gears + 3 cores |
| Artificer | The Furnace Treaty | 24 | 5 | 8 blaze powder + 12 basalt | 12 gears + 3 cores |
| Artificer | Audit the Tides | 30 | 5 | 12 prismarine crystals + 2 nautilus shells | 14 gears + 4 cores |
| Artificer | The Midnight Inspector | 26 | 5 | 4 phantom membranes + 4 ender pearls | 14 gears + 3 cores |
| Artificer | One More Shift | 32 | 6 | 12 obsidian + 2 diamonds | 16 gears + 4 cores |
| Artificer | The Apiary Heat Exchange | 24 | 4 | 8 honeycomb + 2 copper blocks | 10 gears + 2 cores |
| Artificer | Insulate the Switchyard | 20 | 4 | 16 string + 4 rabbit hides | 10 gears + 2 cores |
| Artificer | Greenhouse Pressure Test | 26 | 4 | 12 cactus + 8 glass | 12 gears + 3 cores |
| Artificer | Rails for the Return Shift | 28 | 5 | 24 rails + 8 redstone | 12 gears + 3 cores |
| Artificer | The Ashen Regulator | 30 | 5 | 6 magma cream + 16 blackstone | 14 gears + 3 cores |
| Artificer | Write the Invisible Sky | 24 | 4 | 8 glow ink sacs + 1 spyglass | 12 gears + 3 cores |
| Artificer | Freight Beyond the Horizon | 32 | 6 | 24 end stone + 8 chorus fruit | 16 gears + 4 cores |
| Artificer | The Silent Archive | 28 | 6 | 4 sculk + 8 candles | 14 gears + 4 cores |

Gears are `copperwake:brass_gear`; cores are `copperwake:charged_core`. The boss's `copperwake:foreman_heart` is never a repeatable contract requirement. Equipment and boss progression are the Minecraft adapter's responsibility; this catalog does not lock equipment behind a delivery count.

These costs are an initial balance pass. Later contracts deliberately send the player to the Nether, oceans, the Deep Dark, and nighttime encounters. Echo shards and packed ice can be expedition bottlenecks; delivery rank is an optional rewards path, and future playtesting should measure time-to-deliver before making equipment dependent on it.

## Field devices

Both new devices require Mechanist rank (four deliveries). Their recipes require guild gears and a charged core, while each activation consumes ordinary Scrap. Survey Flare reveals at most eight nearest hostiles inside a true 16-block sphere for 160 ticks; its cooldown is 200 ticks. An empty scan consumes nothing. It neither damages enemies nor marks passive creatures. Field Repairer restores at most 32 missing durability to the exact offhand stack for two Scrap, with a 100-tick cooldown; its own device must be in the main hand. Metadata and enchantments remain on that stack. Invalid targets, incomplete payment, and cooldown retries do not consume supplies. Durability is clamped to zero damage.

These are utility choices rather than stronger weapons. The existing Arc Gauntlet remains six base damage against at most five visible hostiles within six blocks, at one Scrap and a 60-tick cooldown. No existing construct's combat behavior changes in this expansion.

### Preventing a closed crafting loop

- Memory glass must remain an exploration or combat drop. Every contract consumes it and no contract pays it back.
- Scrap may be crafted from copper and iron nuggets. The extra glass cost prevents a self-contained craft-and-deliver reward loop.
- Rewarded gears and cores must not have disassembly recipes that recover memory glass or a closed crafting chain back into it.
- All contract input and reward item sets are disjoint. Rewards contain only gears and cores; neither scrap nor glass is regenerated.
- Costs and rewards fit within one ordinary stack per item type. This is a bounded initial economy, not a measured claim about minutes of effort or equivalent material value.

If recipes change, review their full input/output graph. The domain tests validate the catalog's sink, not arbitrary recipes added elsewhere.

## Adapter contract

`ContractCatalog.current(completed)` provides an immutable `SalvageContract`, with `id()`, `title()`, `description()`, `requirements()`, and `rewards()`. Keys are namespaced registry item identifiers. Requirement and reward maps are defensive copies with stable alphabetical registry-key ordering.

- `rankIndex(completed)` returns 0–2, suitable for bounded rank UI.
- `rankName(completed)` returns the displayed rank.
- `nextRankAt(completed)` returns an absolute count (4 or 12), or **-1** at the cap. Display “Highest rank” for -1, never a negative progress target.
- `nextCompleted(completed)` increments safely and saturates at `Integer.MAX_VALUE`. At saturation, the same final-pool contract remains repeatable without wrapping to a negative count.
- Every count-based entry point rejects negative counts. Sanitize corrupt persisted data in the loading adapter before passing it to these APIs.

The server adapter must count the full eligible inventory first, reject an incomplete delivery without consuming anything, consume the full payment, award the rewards, and only then update persistent completion. Handle reward overflow explicitly. The domain package intentionally has no Minecraft inventory implementation or side effects.

## Dependency-free verification

From this mod directory, with JDK 21 on `PATH`:

```bash
mkdir -p build/domain-tests
javac -d build/domain-tests src/main/java/com/afuerta/copperwake/domain/*.java src/test/java/com/afuerta/copperwake/domain/*.java
java -cp build/domain-tests com.afuerta.copperwake.domain.DomainTests
```

The executable checks cover rank transitions, every contract's reachability, fixed rotation, immutability, registry input allowlists, quantity and economy invariants, negative or malformed input, and integer saturation. It uses explicit assertions and does not require `-ea` or a test dependency.
