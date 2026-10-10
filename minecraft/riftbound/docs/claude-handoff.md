# Claude implementation handoff

This is a prepared external work assignment. Claude has not been run or consulted in this session. Paste the prompt below into Claude Code with access to the `Afuerta/MODs` repository, or into a Claude session with the listed project files attached. Keep Claude's proposed changes reviewable on a feature branch.

## Copyable assignment

```text
You are developing Riftbound: Wild Resonance, an original Minecraft survival
mod in the Afuerta/MODs repository at minecraft/riftbound. Implement a substantial
next iteration, with complete vertical slices and evidence for every claim.

FIRST READ
- minecraft/riftbound/README.md
- minecraft/riftbound/docs/design.md
- minecraft/riftbound/docs/roadmap.md
- minecraft/riftbound/build.gradle, gradle.properties, settings.gradle
- minecraft/riftbound/src/main/resources/fabric.mod.json
- minecraft/riftbound/src/main/java/com/afuerta/riftbound/RiftboundMod.java
- minecraft/riftbound/src/main/java/com/afuerta/riftbound/TrialManager.java
- minecraft/riftbound/src/main/java/com/afuerta/riftbound/PlayerProgress.java
- minecraft/riftbound/src/main/java/com/afuerta/riftbound/RiftboundCommands.java
- All files in minecraft/riftbound/src/main/java/com/afuerta/riftbound/domain/
- minecraft/riftbound/src/test/java/com/afuerta/riftbound/domain/DomainTests.java
- All resource recipes, advancements, models, loot tables, and translations
- minecraft/riftbound/tools/generate_textures.py and validate_resources.py
- Any existing AGENTS.md instructions at the repository/project levels

Use the pinned Minecraft Java 1.21.1, Fabric, Yarn mappings, and Java 21. Do not
upgrade the Minecraft version or loader to sidestep an API problem. Read the
actual source signatures or official Fabric versioned docs for uncertain APIs.
Do not edit another mod in this multi-project repository.

PRODUCT DIRECTION
Explore -> collect four biome Echo aspects -> build an Overworld Rift Anchor ->
choose a tier -> survive a cooperative encounter -> earn Resonance Shards ->
choose a mutually exclusive offhand relic. Make positioning and player choices
matter before adding more flat stat bonuses. Keep the four-color visual language:
Verdant green, Ember orange, Tidal cyan, Hollow violet, with copper/obsidian anchors.

CURRENT CONTRACT TO PRESERVE
- Ten registered item IDs: verdant_echo, ember_echo, tidal_echo, hollow_echo,
  resonance_shard, dormant_relic, wayfarer_relic, bulwark_relic, harvester_relic,
  rift_anchor. rift_anchor is also a block. Namespace is riftbound.
- Ordinary player-attributed hostile kills drop a local Echo with an 18% chance.
  Classification priority is Nether=Ember; otherwise Y<0=Hollow; then ocean/river
  =Tidal; desert/badlands=Ember; otherwise Verdant. Trial mobs never drop Echoes.
- Fallback recipes make every Echo obtainable with vanilla inputs. Shards are
  earned by completing trials, not manufactured with a new cheap recipe.
- Initiate/Adept/Exalted use the exact tier costs, timings, waves, and rewards in
  TrialTier.java. All participants must have unlocked the selected tier.
- The initiating player starts the run. Up to three nearest eligible players
  explicitly opt in using /riftbound ready, valid for five minutes, and stand
  within 12 blocks. The initial participant snapshot determines scaling.
- Only Survival/Adventure participants; no Peaceful encounters. Trials run in
  the Overworld, within the 24-block arena, and exclude unrelated bystanders.
- Death, disconnect, dimension change, and leaving the arena forfeit that run's
  personal reward. Rejoining does not restore eligibility. Rewards cannot be
  claimed twice, and nonparticipant kills cannot fabricate wave completion.
- No destructive terrain effects or global gamerule changes. Trial entities
  must not yield ordinary loot, equipment, XP, or repeatable farm rewards.
- Anchor removal, world/chunk unload, partial spawn failure, player withdrawal,
  and shutdown must remove owned mobs and release arena/player ownership.
- Persistent unlocks survive a restart. Active encounters do not resume;
  stale tagged trial mobs are removed when their chunks next load.
- The domain package is pure Java: no Minecraft/Fabric/world/IO imports. Keep
  deterministic plans and timing there, and world mutation in the server adapter.
- Use the 1.21.1 resource schema: singular recipe/advancement/loot_table/tag-type
  directories; recipe ingredient objects with item/tag; recipe result id/count.
  Preserve reproducible original pixel textures and complete English labels.

WORK ORDER: finish Tasks 1-4 first. Then finish 5-7. Treat 8-10 as separately
reviewable follow-on slices; do not replace completed work with broad scaffolds.

TASK 1 — Audit and harden the playable baseline
Trace every lifecycle from accepted offering to cleanup. Reproduce and fix any
remaining duplication, loot farming, partial-spawn, concurrency, clock, or restart
defect. Verify normal loot, equipment, and XP are suppressed for owned trial mobs
without suppressing ordinary world mobs. Keep the original participant snapshot
even after withdrawals. Preserve stronger vanilla potion effects when relics
refresh theirs. Check collisions, dry ground, roofed arenas, spiders' width,
daylight enemies, and anchor obstruction. Add regression tests for actual bugs.
Deliver a short issue/fix/evidence table; avoid changing balance without reason.

TASK 2 — Implement bounded hazard planning
Add a pure domain hazard schedule with deterministic aspect/seed inputs and
immutable telegraph/active/recovery timings. Keep a small per-trial list of active
hazards and a hard cap. Hazard damage/movement applies only to eligible players
in that trial, on the logical server, with a shared clock and explicit cleanup.
Tests must cover exact timing boundaries, cancellation, withdrawal, no repeated
hit on one pulse, and no hazard after terminal state. Integrate one rule before
adding the remaining three; avoid a client packet becoming authority for damage.

TASK 3 — Finish four distinct aspect mechanics
Verdant: mark a small root zone, warn before a brief slowing pulse, leave routes.
Ember: show alternating safe/heated sectors; heat is an effect, not placed fire.
Tidal: visibly signal an inward current before a modest push toward the anchor.
Hollow: mark the next ranged lane, then resolve it with line-of-sight counterplay.
Use vanilla particles/sounds first. Every cue needs both a visual and textual
signal; avoid color-only or audio-only information. Tune for recoverable mistakes,
not unavoidable damage. No off-arena victims, infinite force, or block damage.
Deliver one solo and one co-op demonstration per aspect, plus tests for schedules.

TASK 4 — Configuration and readable encounter feedback
Add a small per-world server configuration with validated bounds for echo drop
rate, enemy caps, arena radius, and cooldown. Default to the current values.
Store a schema version and handle absent/invalid fields with an explicit fallback.
Snapshot effective values into the accepted trial; edits cannot mutate a running
plan. Let operators inspect the effective config; ordinary players must not be
able to change it. Improve the bossbar/actionbar with wave, time, party eligibility,
and hazard tell. Keep UI work in client code if a custom HUD is necessary, so a
dedicated server never loads rendering classes. Tests cover invalid config,
save/reload, and unchanged running plans.

TASK 5 — Build the first Echo Cairns
Create two authored destinations: an overgrown surface cairn and a drowned river
ruin. Each needs a clue, one small traversal/combat decision, and guaranteed
aspect loot. Start with vanilla blocks and compact original structure templates;
use biome/dimension tags and restrained placement frequency. Add correct
structure/template pool/placement resources only if needed for the chosen method.
Prevent repeated generation in the same chunk and avoid replacing existing
player builds. New-world generation must not make old saves dependent on new
chunks. Record locate/generation tests for several seeds and prove loot contents.
Do not add a custom dimension. Expand Ember/Hollow destinations after the first
two are demonstrated and enjoyable.

TASK 6 — Create one custom enemy: the Echo Warden
An original slow sentinel announces a directional strike. Dodging the strike
exposes its core for a short counterattack window. It is not the vanilla Warden
with inflated health. Implement entity registration, attributes, goals/state
machine, spawn integration, synced visual state, renderer/model, original texture,
death/reset behavior, and dedicated-server-safe class separation. Teach its tell
in Adept encounters before using it in Exalted fights. Never change blocks or
target spectators/bystanders. Add state transition tests and actual server/client
combat verification; report timing, reach, health, and co-op scaling choices.

TASK 7 — Add discoverable guidance and relic sidegrades
Add a concise in-game field guide or advancements that explain Echo origins,
the /riftbound ready opt-in, tier selection, arena withdrawal, and actual recipes.
Ensure a fresh survival player discovers initial recipes before crafting outputs.
Prototype meaningful relic reattunement between Wayfarer/Bulwark/Harvester, with
a documented cost, preserving the single-offhand tradeoff. If adding sidegrades,
make each one sacrifice something; do not stack passive buffs in inventory or
add a redundant flat-stat ladder. Keep IDs and save migration explicit. Update
models, textures, tooltips, recipes, validator coverage, and design documentation.

TASK 8 — Prototype the Fractured Heart, after the Warden is complete
A stationary arena core reuses taught cues in three phases: Listen (aspect weak
points under light enemy pressure); Answer (repeat a warned pulse sequence to
open a damage window); Resonate (choose an aspect to suppress, trading safety for
a different final reward). Implement one complete boss reset/reward lifecycle
before expanding the roster. Reward a sidegrade or cosmetic, not mandatory power
that trivializes the earlier loop. Scale mechanics for co-op, not only health.
All wipe, logout, unload, anchor-removal, and restart paths must clean up the boss.

TASK 9 — Improve reproducible QA and performance evidence
Keep existing domain/resource tests. Add Minecraft GameTests or a similarly
repeatable server harness for spawn ownership, reward overflow, loot/XP suppression,
hazard targeting, and simultaneous anchors. Measure work at four active party
trials. Use bounded queries and per-trial collections instead of scanning all
entities every tick. Demonstrate no leftover entities after twenty abort/retry
cycles. Document the exact commands, versions, seeds, logs, and failures.

TASK 10 — Prepare a reviewable release
Run the existing build/check commands with Java 21 and the pinned toolchain:
  ./gradlew build domainTest
  python3 tools/validate_resources.py
  python3 tools/generate_textures.py --check
Adjust only if the project README documents an equivalent authoritative command.
Launch a dedicated server and an actual client when available. Verify assets,
recipes, tool requirements, and translations load without resource errors.
Update README/design/roadmap to distinguish implemented, tested, and proposed
features. Provide a changed-file summary, functional release notes, checks that
passed, blocked checks with exact reasons, and remaining manual playtests.
Do not assert a successful build or playtest without its observed evidence.
Commit completed slices on a feature branch; open a reviewable PR if your session
is authorized. Do not force push, overwrite unrelated work, or merge unrevised
changes. Ask for missing access only after completing useful independent work.

DEFINITION OF DONE FOR EACH SLICE
1. The feature can be used end-to-end in survival or has a precise blocked check.
2. Java compiles against the pinned APIs; resources pass the project validator.
3. Regression tests cover its timing/lifecycle/failure behavior, not getters.
4. Dedicated server separation is intact; no client rendering imports in common.
5. No reward/loot duplication, enrollment of bystanders, or lingering owned mobs.
6. Documentation names real behavior and real verification, with no fake review.

Begin by reporting the baseline findings, choose the smallest complete first
slice, then implement it. Continue across the ordered work instead of stopping
after an idea list. If budget expires, leave completed code and a precise
continuation checklist with file paths and the next command to run.
```

## Reference sources for the pinned resource format

- [Fabric recipes: 1.21 through 1.21.1](https://wiki.fabricmc.net/tutorial:recipes)
- [Fabric's versioned 1.21.1 documentation source](https://github.com/FabricMC/fabric-docs/tree/main/versions/1.21.1)
- [Minecraft Java 1.21 technical changes](https://www.minecraft.net/en-us/article/minecraft-java-edition-1-21)

An external collaborator should return actual diffs and test output. A planned assignment, model name, or generated design document does not establish that a collaborator reviewed or executed the code.
