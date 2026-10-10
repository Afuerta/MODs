# Working on MODs

This repository contains a Fabric 1.21.1 mod suite and the original NeoForge Starfall source. Preserve both projects and the work of other agents.

| Path | Owner during T23 | Purpose |
| --- | --- | --- |
| `minecraft/riftbound/` | Astra | Elemental trials, progression, Convergence hazard mode |
| `minecraft/copperwake/` | Codex resources agent | Rustwild, constructs, guild and field gadgets |
| `minecraft/starfall/` | Codex port agent | Fabric Starfall port and building set |
| `minecraft/convergence/` | Codex integration agent | Cross-mod contracts, components and earned gear |
| `minecraft/build.gradle`, root docs and CI | Codex root/build agent | Combined verification and pack |
| `starfall/` | Original Claude foundation | Preserved NeoForge project; read its `AGENTS.md` before changing it |

## Collaboration

- Work on a task branch from `main`, using `chatgpt/<task-id>-<slug>` or `claude/<task-id>-<slug>`.
- Claim the task in a task board. T23 is the owner's requested combined expansion, tracked in `starfall/TASKS.md` and `docs/EXPANSION_TASKS.md`.
- Use a focused pull request for each task. Build and applicable GameTests must pass before a task is done.
- Do not change a different agent's owned files without coordinating. Do not reset, clean or stash another worktree.
- Preserve registry IDs, configuration keys, saved scoreboard objectives, and existing progression thresholds. Never rename an existing ID to fit a new theme.
- Do not commit build directories, run worlds, toolchain installations or personal credentials.

## Fabric build

Use JDK 21 and the checked-in Gradle 8.12.1 wrapper. The four Fabric modules share Minecraft 1.21.1, Yarn 1.21.1+build.3, Fabric Loader 0.16.14, Fabric API 0.116.17+1.21.1, and Loom 1.10.5.

Run the combined build from `minecraft/`; individual modules retain independent builds. See `minecraft/README.md` for exact tasks. Keep the original NeoForge project out of the Fabric pack.

- Resource folders in 1.21.1 are singular: `recipe`, `loot_table`, `advancement`, `structure`, `tags/item`, and `tags/block`.
- Recipe results use `id`. Prefer actual mapped sources and version-pinned documentation when APIs are uncertain.
- Dedicated servers must never load client renderer classes through a common entry point.
- GameTests belong in a separate test source set and must not ship in release jars. Add engine tests for new gameplay and pure tests for state/progression rules.
- Do not silently accept a Minecraft server EULA in automation. Use the headless GameTest harness.
- Put new player-facing text in translations. Prefer bounded work, atomic inventory transactions, explicit party eligibility and once-only rewards.
- Never damage terrain or force-load arbitrary areas for combat abilities. Meteor impacts must preflight their entire footprint before changing blocks.

## Assets and provenance

Keep original assets and source attribution. Starfall stores pixel art as text `.px` files and generates PNGs during the build. Edit those text sources rather than generated textures. Do not bundle unrelated third-party mods; record explicit dependencies in metadata and installation instructions.

## Reviews

Check multiplayer ownership, disconnects, invalid activation costs, duplicate rewards, restart persistence and progression deadlocks. Report what was actually tested and distinguish headless verification from visual or human playtesting.
