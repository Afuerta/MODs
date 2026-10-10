# Copperwake development roadmap

The first implementation provides the expedition → salvage → contract → gadget
loop, a complete new realm, three authored landmarks and three combat silhouettes.
The next passes should add reasons to revisit these systems, without splitting the
mod into disconnected feature lists.

## Next playable pass

- Playtest a fresh survival character from the journal to first gadget. Measure
  time spent finding a first ruin and obtaining the four early contract orders.
- Add selectable contract alternatives with a real cost for abandoning an order,
  so a hard-to-find vanilla biome cannot stall a player's preferred activity.
- Give Foreman Hearts a choice of two utility upgrades beyond decorative blocks.
- Add a salvage bench screen that compares held supplies and upcoming rewards.
- Add encounter-level accessibility options for windup particles and sounds.
- Tune structure spacing with sampled worlds; ensure paths remain usable on slopes.

## Exploration expansion

Build a derailed cargo train, a flooded pump station and an underground records
vault. Each should teach one navigation/combat rule, have different routes to its
loot, and use its own recognizable silhouette. Add noncombat discoveries: machine
messages, salvage maps, cosmetic nameplates, and a rare friendly maintenance bot.
Keep all builds authored and reproducible; record the license and provenance if
external assets are introduced later.

## Machines and settlements

Prototype a repairable depot: recover parts on expeditions, rebuild individual
stations, and choose which services unlock first. Make each machine solve a real
survival problem, such as sorting salvage, mapping ruins, or automating lantern
maintenance. Local logistics and construction should complement combat progression.

## Combat expansion

Add a shielded Rivet Guard and a fragile repair drone with clearly different
counterplay. Extend the Foreman with a repair phase and arena machinery only after
the current telegraphs are readable with several players. Scale cooperation
through roles and mechanics rather than multiplying health alone.

## Release gates

Keep server tests for save/load behavior, inventory overflow and failed actions.
Verify model textures on a real client, summon/despawn/return with multiple players,
and generate several seeds before adding more worldgen. Preserve namespaced IDs
and migrate saved progression if contract storage changes. No unfinished milestone
in this file should be described as already implemented.
