# Convergence collaborator handoff

The implemented bridge is a Fabric 1.21.1 module under `minecraft/convergence`. It has hard
dependencies on Riftbound 0.2.0, Starfall Fabric 0.2.0 and Copperwake. Keep existing item IDs,
scoreboard objective names and the authored circuit order stable for saved worlds.

## Current behavior to preserve

- `attunement_core` is an offhand mode selector consumed when starting Riftbound Adept and Exalted trials.
  Riftbound owns hazard logic and awards one `concordance` per successful participant.
- `CommissionCatalog` has 18 immutable definitions. Completion count picks the next delivery.
  Second and later circuits increase material costs to 2x and then 3x; trophy costs and rewards
  stay fixed. Rewards never appear as commission inputs.
- `convergence_jobs` stores UUID-keyed progress. External `riftbound_progress` and `cw_contracts`
  are read without mutation.
- `DeliveryPlan` validates all gates before `ExpeditionContracts` changes any inventory slot.
  Registry lookup happens for every input and output before consumption.
- Gear recipes all require Concordance. Gadget invalid targets and cooldowns spend no Filament.
- `tools/generate_assets.py` owns generated item textures, models, recipes, advancements and
  English text. Change the definitions there and regenerate, rather than editing generated files.

## Useful next tasks

1. **Configurable costs without changing authored IDs.** Add validated server configuration
   for circuit multipliers and gadget cooldowns; defaults must preserve current balance.
   Reject zero/negative costs. Acceptance: tests cover malformed configuration, 3x scaling
   cap and no input/reward recycling; existing saves load without migrating objective names.
2. **Client Atlas screen.** Build a dedicated screen with current contract requirements,
   inventory amounts and progression gates. Send server-owned immutable summaries rather
   than trusting client-supplied delivery data. Acceptance: `/convergence turnin` remains
   authoritative; stale summaries cannot consume incomplete orders; translate every label.
3. **Multiplayer playtest and balance.** Try two and four-player Convergence parties, shared
   gear and gadget use near Copperwake bosses. Record duration, potion overlap and full-inventory
   reward delivery. Acceptance: no PvP/animal pulse effect, no accidental chunk generation,
   no dropped/duplicated trial trophies, and practical survival acquisition of all recipe inputs.

## Verification

Run the pack root `./gradlew :convergence:build :convergence:runGameTest`. The domain suite has
6,042 rule checks; eight Convergence GameTests include every recipe and advancement, deficient
deliveries, exact rewards, trophy gating, two circuits, gadget costs and real server-tick effects.
The root combined suite also loads each original mod's GameTests. Headless tests do not replace
a desktop check of item rendering, guidance readability and combat feel.

The expansion's final combined run passed all 45 required tests, including all eight Convergence
tests. Resource validation passed for 32 JSON files, eleven sprites/models and seven recipes.
The Mender Coil was verified through real server item-interaction dispatch with an offhand Bow.

This is a handoff for a future collaborator; it does not claim that an external Claude session
has already reviewed or executed the work.
