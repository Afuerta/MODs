# Convergence Fabric suite

This root build compiles Riftbound, Copperwake, the Fabric Starfall port, and the Convergence bridge together. All four target Minecraft 1.21.1, Java 21, Fabric Loader 0.16.14, Fabric API 0.116.17+1.21.1, Yarn 1.21.1+build.3, and Loom 1.10.5. Use the checked-in Gradle 8.12.1 wrapper.

From this directory:

```sh
./gradlew build
./gradlew combinedGameTest
./gradlew modpack
```

On Windows, use `gradlew.bat` instead. `build` runs the four modules' checks, builds their release and source jars, runs the combined headless GameTests, and creates the pack. `combinedGameTest` runs the engine tests without repeating packaging. `modpack` builds and packages the release jars; it does not independently run verification. Run `build` before distributing a pack.

The archive is `build/distributions/convergence-0.2.0-fabric-1.21.1.zip`. It contains exactly the four authored release jars, installation instructions, licenses, a version manifest, and SHA-256 checksums. Fabric Loader and Fabric API remain external requirements; see [pack/INSTALL.md](pack/INSTALL.md). The original NeoForge project at `../starfall/` remains a separate project and is excluded from this Fabric pack.

## Verification

Root `check` runs each module's `check` task and `combinedGameTest`. Module checks include their pure Java domain harnesses; resource validators are available in each module's `tools/` directory and also run in CI. Convergence's module check runs its resource validator directly.

The combined run uses Convergence's GameTest server with all four production mods. Each sibling's separate `gametest` source set is registered as an additional test mod and built before launch. This tests cross-mod registries, recipes, mixins, and gameplay in one Minecraft runtime. Test classes, test metadata, and arena fixtures are excluded from release jars.

The latest combined server log is `convergence/build/run/gameTest/logs/latest.log`. CI also captures the complete Gradle and server output in `build/verification.log` and uploads it with the diagnostic logs. A passing run prints the completed test count and exits successfully. The headless GameTest harness does not accept the dedicated-server EULA: all test configurations retain `eula = false`. Engine tests do not substitute for a human client playtest of rendering, sound, UI, controls, or balancing.

Individual modules retain their own wrapper, settings, and properties. For focused standalone verification, enter the relevant module directory:

```sh
./gradlew build runGameTest
```

Standalone Riftbound, Copperwake, and Starfall load only their own production mod and tests. Convergence is a bridge: its standalone runtime needs the sibling release jars supplied with `-PpackModsDir=/absolute/path/to/mods`. Prefer the root combined run for integration verification.

See [the play guide](../docs/PLAY_GUIDE.md) for the intended progression and [the expansion task board](../docs/EXPANSION_TASKS.md) for scope and review status.
