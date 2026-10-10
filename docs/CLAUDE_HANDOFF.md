# Claude handoff: Convergence

The owner asked for a large Minecraft mod project developed with Astra and Claude. This change builds on the supplied Claude-authored Starfall foundation. There is no live Claude execution endpoint in this session; this document is the concrete handoff for continued collaboration.

## Check out the integration

Start with the T23 pull request and root [AGENTS.md](../AGENTS.md). Use an isolated worktree from the latest repository branch. Do not replace or reset an agent's existing worktree, and do not overwrite the original `starfall/` NeoForge source when working on its Fabric port at `minecraft/starfall/`.

The Fabric suite uses Minecraft 1.21.1 and Java 21. `minecraft/README.md` lists build and combined GameTest commands. Tests must run with all three content mods plus Convergence installed, because standalone tests cannot detect cross-mod load-order and reward integration failures.

## Review priorities

1. Check that the port preserves Starfall's existing IDs and `.px` textures while using Fabric events and Yarn names.
2. Try to reproduce invalid meteor impact paths: constructed blocks anywhere in the footprint, a block entity, a fluid, an unloaded neighbor, border edges, and repeated impacts. No partial crater may be written when preflight fails.
3. Check failed trial activation and incomplete delivery costs. Repeating a completion or command must never award a second reward for the same action.
4. Play an ordinary Rift trial and an attuned Adept/Exalted trial in a party. Verify warnings, late entrants, withdrawal, death, cleanup and progress.
5. Audit every contract requirement against obtainable survival items and prior progression. Rewards must not reproduce the full materials needed for their own repeating delivery.

## Completed follow-ups and next independent implementation

**C02: Persistent Star Compass** is merged in [PR #4](https://github.com/Afuerta/MODs/pull/4).
It remembers up to 64 impacts per dimension, retires mined targets, preserves unloaded targets
without loading terrain, and includes save/reload tests and independent recipe discovery.

**C03: Starsteel armor** is implemented in [PR #5](https://github.com/Afuerta/MODs/pull/5).
It adds four pieces, original item and humanoid textures, recipes, repair/enchantment/trim support,
and a clear-night full-set bonus. The full pack build passed 59 combined GameTests and 26 standalone Starfall tests.
Check the PR's current merge status before overlapping work.

Take **C04: Astral infusion station** from [the expansion queue](EXPANSION_TASKS.md) next.
Implement it in the Fabric suite and preserve the separate original NeoForge project. Ship four
authored recipes connecting all three content mods, with atomic ingredient consumption and output.
Specify hopper insertion/extraction rules, pause outside clear-night conditions, persist progress
across save/load, and test partial inputs, output overflow and multiplayer use.

C05 landmarks, C11 recipe browsing, and C14 accessibility remain substantial parallel tasks.
Astra's suggested assignments are C07 encounters, C08 party expeditions and C09 constellation charting.

## Evidence to provide

Include exact build/test outcomes and survival playtest findings in each PR. Do not mark visual behavior tested when only a headless server ran. The original NeoForge project remains a separate build profile; the Fabric pack contains its Fabric port only.
