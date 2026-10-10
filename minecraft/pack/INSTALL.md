# Install Convergence

This archive contains four authored Fabric mods for Minecraft **1.21.1**:
Riftbound, Copperwake, Starfall, and Convergence. Use **Java 21** and
**Fabric Loader 0.16.14 or newer** compatible with Minecraft 1.21.1.

1. Install the Minecraft 1.21.1 Fabric profile using the [official Fabric installer](https://fabricmc.net/use/installer/).
2. Download **Fabric API 0.116.17+1.21.1** from its [official project listing](https://modrinth.com/mod/fabric-api).
3. Copy all four jars in this archive's `mods/` directory and the Fabric API jar into that profile's `mods/` directory.
4. Launch the Fabric profile. Each mod also belongs on a multiplayer server and its clients.

Fabric Loader, Minecraft, and Fabric API are external requirements and are not
redistributed in this archive. The included Starfall jar is the Fabric port in
`minecraft/starfall/`; the separate NeoForge project in `starfall/` is retained
in the repository and uses a different loader.

Use a fresh test world for this alpha build. Back up an existing world before
adding or upgrading mods. Keep the same four jar versions on the server and all
clients, and remove older copies of these jars when upgrading.

`pack-manifest.json` records the exact mod versions and `SHA256SUMS` records their
checksums. Mod-specific licenses are included in `licenses/`.

## Build from source

From the repository's `minecraft/` directory:

```bash
./gradlew --no-daemon build
./gradlew --no-daemon combinedGameTest
./gradlew --no-daemon modpack
```

The archive is written to `build/distributions/`. Each mod's existing standalone
Gradle build remains available in its own directory. GameTests use a headless
test server and never write `eula=true`. This does not replace a client playtest.
