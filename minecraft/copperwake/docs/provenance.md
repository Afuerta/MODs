# Provenance

- Original Copperwake Java source, entity models, item/block voxel models,
  progression writing and structure generator were authored for this repository.
- World-generation JSON references vanilla Minecraft features and noise settings.
  Models reference vanilla texture paths; the Minecraft assets are not copied.
- Structure templates are reproducible outputs of `tools/generate_structures.py`.
  They are not copied player builds. No external mod source is bundled.
- The Siphon Gardens and Switchyard Depot architecture, names and expedition loot
  are original work for this repository. Their geometry preview is rendered from
  committed NBT by `tools/render_expedition_landmarks.py`, using an authored solid
  color palette with Pillow. It contains no extracted Minecraft textures.
- Fabric Loader, Fabric API, Fabric Loom, Yarn and Minecraft are resolved as build
  dependencies and keep their own licensing. Copperwake pins a single supported
  Minecraft version rather than implying cross-version compatibility.
- The Gradle 8.12.1 wrapper files use Apache License 2.0, reproduced alongside them
  as `gradle/LICENSE`. Official source: https://github.com/gradle/gradle.
- Build settings follow the existing repository's Fabric toolchain to allow both
  independent mods to develop in parallel. Copperwake imports no Riftbound classes.
