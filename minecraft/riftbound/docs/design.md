# Riftbound: Wild Resonance

An original survival progression mod for Minecraft Java 1.21.1, Fabric, and Java 21.

## The promise

The world leaves echoes in the things that live there. Collect those echoes, build a Rift Anchor, and spend them to challenge increasingly dangerous manifestations. Survive with your friends to earn resonance, then decide whether your next expedition needs mobility, protection, or faster mining.

The anchor makes the player's choice of location matter: a clearing is easy to navigate but exposed; a fortified arena takes work but makes future attempts safer. The mod rewards preparation without generating destructive terrain changes around an established base. Its identity comes from an exploration-to-encounter loop and mutually exclusive offhand choices, rather than a second ladder of vanilla tools.

## Base survival loop

1. Explore and defeat ordinary hostile mobs. A player-attributed hostile kill has an 18% chance to drop the local aspect's echo. Trial enemies do not drop echoes. Resource recipes provide a dependable alternative when a needed biome is far away.
2. Obtain all four echo aspects, amethyst, and obsidian to craft a Rift Anchor. Place it in a clear, reasonably level Overworld area with room to fight.
3. Choose an unlocked tier by sneaking and using the anchor with an empty hand. Use an echo on it to offer that aspect and start a trial. The initiating player pays the tier's echo cost.
4. Friends explicitly opt in with `/riftbound ready`. Readiness lasts five minutes. Up to three ready players within 12 blocks may join the caller, for a maximum party of four; every participant must have unlocked the selected tier.
5. Survive a five-second warmup, then clear three to five waves. Four-second intermissions allow repositioning. Stay within the 24-block arena radius. Death, disconnecting, or leaving the arena removes that participant's reward eligibility for the rest of the attempt.
6. Each participant still eligible at completion receives the full tier reward and progression credit. Initiate unlocks Adept; Adept unlocks Exalted. Progress is saved in the world's scoreboard.
7. Spend resonance on an offhand relic. A stronger tier yields more shards per successful run and requires a longer, more difficult fight; Exalted also has the best shards-per-echo return. Relics can be swapped between expeditions, but the single offhand slot makes their sustained benefits mutually exclusive. Effects refresh once per second and may linger briefly after a swap.

Failure consumes the offered echoes and grants no resonance. Existing relics and progression remain; ordinary Minecraft death and inventory rules apply. A participant cooldown prevents immediate restarts after an attempt.

## Echo origins and enemies

Classification uses the defeated mob's location, in the order below. Nether kills yield Ember; underground kills below Y=0 yield Hollow before the biome rules are considered.

| Aspect | Source after the priority rules | Encounter identity |
| --- | --- | --- |
| Ember | Nether; aboveground desert or badlands | Husk-heavy attrition, with zombies and skeletons |
| Hollow | Below Y=0 outside the Nether | Skeleton-heavy ranged pressure, with strays, zombies, and spiders |
| Tidal | Aboveground ocean or river | Drowned-heavy pursuit, with zombies and skeletons |
| Verdant | Remaining locations | Zombies and spiders, with skeleton support |

Every wave starts with a signature mob. A stable seeded planner selects the remaining enemies from a weighted aspect roster. The seed changes composition, not reward value. v0.1 uses existing Minecraft enemies; custom combat behavior is a later milestone.

## Initial roster

| Content | Role |
| --- | --- |
| Verdant, Ember, Tidal, Hollow Echo | Exploration drops, craftable fallback, anchor components, and trial offerings |
| Rift Anchor | Placed encounter controller and tier selection point |
| Resonance Shard | Trial-only progression currency |
| Dormant Relic | Inexpensive base for one attunement |
| Wayfarer Relic | Offhand Speed and Jump Boost |
| Bulwark Relic | Offhand Resistance |
| Harvester Relic | Offhand Haste |

The nine standalone items and one placeable block stay understandable in the vanilla inventory. Relics occupy the same hand a shield or totem would otherwise use, making even a passive benefit a meaningful loadout choice.

## Crafting specification

All recipes below produce one item. The shaped rows are top / middle / bottom of a crafting table; spaces are empty slots. The JSON recipes in `src/main/resources/data/riftbound/recipe/` are authoritative.

| Output | Recipe |
| --- | --- |
| Verdant Echo | Shapeless: amethyst shard + any leaves + wheat seeds |
| Ember Echo | Shapeless: amethyst shard + coal + gunpowder |
| Tidal Echo | Shapeless: amethyst shard + kelp + clay ball |
| Hollow Echo | Shapeless: amethyst shard + flint + rotten flesh |
| Rift Anchor | `OVE` / `OAO` / `OTH`; O=obsidian, A=amethyst shard, V/E/T/H=the four corresponding echoes |
| Dormant Relic | ` C ` / `CAC` / ` C `; C=copper ingot, A=amethyst shard |
| Wayfarer Relic | `SSS` / `SDS` / `SSS`; S=resonance shard, D=dormant relic |
| Bulwark Relic | `SSD` / `SSS` / `SSS`; same symbols |
| Harvester Relic | `SSS` / `SSS` / `DSS`; same symbols |

Each attunement costs eight resonance shards and one dormant relic. The recipe positions distinguish the three choices without introducing more currencies. Vanilla horizontal recipe mirroring is allowed. The first relic takes three successful Initiate trials; after unlocking higher tiers, players can prioritize a difficult trial or a safer sequence of attempts.

## Trial balance

| Tier | Unlock | Echo cost | Waves | Solo enemies by wave | Shards per eligible player | Total deadline |
| --- | --- | ---: | ---: | --- | ---: | ---: |
| Initiate | Available immediately | 1 | 3 | 3, 4, 5 | 3 | 4 minutes |
| Adept | Complete Initiate | 2 | 4 | 5, 6, 7, 8 | 6 | 6 minutes |
| Exalted | Complete Adept | 3 | 5 | 7, 8, 9, 10, 11 | 10 | 8 minutes |

For a party of size P, a wave contains `ceil(solo enemies × (P + 1) / 2)`, capped at 24. Scaling is calculated from the initial participant snapshot and does not shrink when someone leaves. Rewards are not split, which encourages cooperation without making an individual friend compete for the last hit. Players who protect or support teammates remain eligible without a damage quota.

All durations use server ticks at the nominal rate of 20 ticks per second. Deadlines include warmup, intermissions, and time spent waiting for spawn acknowledgment. A timeout takes precedence at the exact deadline. The standard cooldown is 1,200 ticks, or one minute.

These values are a first playable baseline. Balance acceptance requires actual survival playtests: one undergeared solo run, one appropriately prepared solo run, and a two- to four-player run at each tier. Automated checks verify the rules, not whether combat feels fair.

## Multiplayer and world safety

- Explicit readiness and a bounded participant snapshot prevent enrolling bystanders or joining only for the final reward.
- Only registered trial mob UUIDs can advance a wave. Unknown, duplicate, and stale death events have no effect.
- Death, logout, or leaving the arena permanently withdraws a player for that run. Remaining players can finish at the original difficulty; a fully withdrawn party fails.
- Every planned enemy must spawn before a wave becomes active. Partial spawning fails and the adapter must remove any enemies it created.
- The encounter roster excludes creepers and endermen. The server adapter must suppress trial mob loot, equipment drops, and XP so the anchor cannot become a free resource farm, and prevent trial mobs from breaking doors or picking up equipment.
- Concurrent encounters must be sufficiently separated to avoid shared targets and overlapping arenas. Each participant may belong to only one active trial.
- Anchor removal, unloaded arenas, shutdown, and irrecoverable spawn failures terminate the encounter and clean up its mobs. Active sessions do not resume after a server restart; persistent tagged trial mobs are removed as their chunks load.
- Success is emitted once. `claimRewards()` supplies the reward map only once so repeated server callbacks cannot duplicate a payout. Inventory insertion and overflow handling remain the Minecraft adapter's responsibility.

## Architecture and integration contract

The `com.afuerta.riftbound.domain` package has no Minecraft, Fabric, filesystem, or network imports. The adapter owns entity spawning, collision checks, mobs' combat behavior, player presence, inventory changes, saved unlocks, particles, and chat. All domain mutation occurs on the server thread.

`TrialPlanner.plan(aspect, tier, participantCount, seed)` returns an immutable `TrialPlan`. `WavePlan.mobs()` is an ordered list of `MobKind` values for the adapter to map to entity types. Plans store their complete timing and individual reward, so a running trial does not change when other configuration is edited.

Create `TrialSession(plan, participantUUIDs, startTick)` only after validating arena, progression, cooldowns, and participant consent. Once the world interaction is accepted, consume the caller's offering and begin ticking the session with a nondecreasing server clock.

| Session operation | Adapter responsibility |
| --- | --- |
| `advance(nowTick)` returns `SPAWN_WAVE` | Read `nextWave()`, spawn all planned enemies, then call `registerWaveMobs(ids)`; failure requires cleanup and `fail(SPAWN_FAILED)` |
| A registered trial enemy dies | Call `mobDefeated(uuid)` once; duplicate calls are harmless |
| A registered enemy converts into another entity | Call `replaceMob(oldUuid, newUuid)` and transfer adapter tags/ownership before entity loading; a successful replacement preserves the outstanding enemy count |
| A participant dies, logs out, or exits the arena | Call `withdraw(uuid)` before handling a possible success that tick |
| An environmental abort occurs | Call `fail(reason)`; retain and clean up `activeMobs()` |
| `advance(nowTick)` returns `SUCCEEDED` | Deliver `claimRewards()`, record tier completion, apply cooldown, and release arena ownership |
| `advance(nowTick)` returns `FAILED` | Remove remaining trial entities, apply cooldown, and release arena ownership |

The lifecycle is `WARMUP → SPAWNING → ACTIVE → INTERMISSION`, repeating spawn and combat until the last wave succeeds. Any nonterminal state can fail. A spawn request remains pending until acknowledged, preventing an empty or delayed spawn from becoming an automatic victory. External failures set the state immediately and emit a single `FAILED` event on the next `advance` call. Terminal states are immutable.

`TrialCooldowns` stores per-player expiry ticks. Exact expiry is ready; a shorter reapplication cannot shorten an existing cooldown. Deadline arithmetic saturates at `Long.MAX_VALUE` rather than wrapping. This ledger is an in-memory primitive; persistence, if added, belongs in the adapter and must use a clock that remains meaningful across restarts.

Run `./gradlew domainTest` to execute the dependency-free `DomainTests` harness. It covers all aspect/tier/party combinations over several seeds, deterministic planning, immutability, lifecycle transitions, malformed spawn acknowledgment, stale mob events, withdrawal, reward claims, timeout boundaries, and cooldown boundaries. The harness throws on failed checks without requiring JVM assertions.

## v0.2 Convergence integration

The optional bridge adds one deliberate activation choice without changing existing Riftbound registry IDs or ordinary trial behavior. An initiator holding `convergence:attunement_core` in the offhand may begin an unlocked Adept or Exalted trial. Riftbound resolves both the core and reward by registry ID, without importing bridge classes or declaring a required bridge dependency. Missing Concordance registration rejects activation. Consume one core and the ordinary tier Echo cost only after all eligibility, cooldown, and arena preflights pass. A later combat/spawn failure is a failed paid attempt.

Each eligible completion awards the original individual reward plus two shards on Adept or three on Exalted and one `convergence:concordance`. All deliveries use the same once-only `claimRewards()` result. Trial mobs still suppress normal loot/XP and cannot directly drop bridge rewards. The item roster and nine base recipes are unchanged.

### Hazard contract

`HazardSchedule` is a separate deterministic server-thread clock. It is constructed only for Convergence sessions and only for Adept/Exalted. Pass the active wave index during combat and -1 in other phases. A new wave has 60 ticks of grace. A `WARNING` creates a fixed `HazardZone` and emits its particles/message immediately; the impact deadline begins at that emission tick. Adept grants 60 warning ticks and Exalted 40. Successive impacts are separated by at least 200 ticks, including across wave changes. Delayed server polling never catches up missed attacks in a burst or skips a warning.

Intermission cancels the current warning; it is never resumed in a later wave. `stop()` is permanent and cleanup removes the stored zone. Previously applied status effects expire after at most three seconds; cleanup does not remove unrelated potion effects. No hazard places fire, water, roots, or other blocks.

`HazardZone` uses immutable anchor-relative geometry for both particle markers and impact checks. Zones are clipped to the 24-block arena. Verdant takes a participant position snapshot at warning time and clamps its center to 18 blocks from the anchor, then marks a three-block radius patch. Ember uses two parallel lanes three blocks wide, offset six blocks either side of the anchor. Tidal marks an annulus from six to eighteen blocks. Hollow marks one three-block-wide lane. Seed and pulse number select lane rotation. Participants can leave the marked area throughout the entire warning; marks do not follow them.

The server adapter checks current eligibility, living state, dimension, game mode, and arena distance before each impact. Verdant applies Slowness II for 60 ticks, Hollow applies Weakness I for 60 ticks, Tidal applies 0.55 horizontal velocity inward plus a small upward lift, and Ember deals three/four HP of magic damage. Fire Resistance does not negate the resonance pulse. Any death caused by a pulse follows the ordinary withdrawal rules. Bystanders, mobs, and departed players are not affected.

### Cross-mod progression boundary

Copperwake salvage and Starfall exploration supply the bridge's crafting chain; Riftbound supplies a repeatable cooperative finale and Concordance. The bridge owns its item recipes and downstream equipment, avoiding circular class dependencies or duplicated registrations. Preserve base relic recipes and tier unlock storage so existing worlds can adopt the expansion incrementally. No imported worldgen or new dimension is required to start an ordinary trial.
