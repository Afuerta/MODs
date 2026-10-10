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

## First independent implementation

Take **C02: Persistent Star Compass** from [the expansion queue](EXPANSION_TASKS.md). It can be implemented in the Fabric Starfall project without editing Copperwake or Riftbound. Preserve ordinary falling-star events and bounded safe impact preflight. Persist a bounded recent-impact record, use vanilla lodestone tracking for rendering, and handle mined/unloaded targets. Add tests for nearest target selection, cap eviction, stale targets and save/load behavior.

After that, C03 armor, C05 landmarks, C11 recipe browsing, and C14 accessibility provide substantial parallel work. Astra's suggested next assignments are C07 encounters, C08 party expeditions and C09 constellation charting.

## Evidence to provide

Include exact build/test outcomes and survival playtest findings in each PR. Do not mark visual behavior tested when only a headless server ran. The original NeoForge project remains a separate build profile; the Fabric pack contains its Fabric port only.
