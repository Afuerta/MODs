# MODs — Convergence

A Minecraft Java 1.21.1 expansion connecting three original mods: **Riftbound**, **Copperwake**, and **Starfall**. The Convergence integration mod adds a shared route through their rewards and progression.

| Module | Gameplay | Source |
| --- | --- | --- |
| Riftbound | Four elemental aspects, cooperative wave trials, relics, and optional trials with telegraphed hazards | [minecraft/riftbound](minecraft/riftbound) |
| Copperwake | The Rustwild dimension, salvage landmarks, construct enemies, guild deliveries, and field gadgets | [minecraft/copperwake](minecraft/copperwake) |
| Starfall, Fabric | Falling stars, crater resources, wishes, night-powered starsteel tools, and starstone building blocks | [minecraft/starfall](minecraft/starfall) |
| Convergence | Contracts spanning the three mods, attunement cores, and gear earned through Convergence trials | [minecraft/convergence](minecraft/convergence) |

Install the **Fabric** versions together. Both clients and servers need the same four mod jars, Fabric Loader, and Fabric API for Minecraft **1.21.1**, with Java **21**. Build and installation instructions are in [minecraft/README.md](minecraft/README.md).

Start with a Survey Key to explore Copperwake, collect Starfall shards on clear nights, and use elemental Echoes at a Rift Anchor. Combine charged cores, star shards, and resonance to attempt Convergence trials. The [play guide](docs/PLAY_GUIDE.md) explains the route.

The original **NeoForge Starfall** project is preserved at [starfall](starfall). Its jar belongs in a separate NeoForge installation. Its existing task board and artwork remain available to Claude and other contributors.

Work is developed on a task branch and reviewed through a pull request. See [AGENTS.md](AGENTS.md), the [expansion queue](docs/EXPANSION_TASKS.md), and the [Claude handoff](docs/CLAUDE_HANDOFF.md). The [validation record](docs/VALIDATION.md) documents the passing 45-test combined runtime and 10,696 domain checks.

This is an alpha. Headless tests check game logic and content loading; visual quality, exploration pacing, and survival balance still need playtesting.
