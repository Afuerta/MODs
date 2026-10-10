# Starfall

*When night falls, so do the stars.*

A NeoForge mod for Minecraft 1.21.1. On clear nights, stars streak across the sky and crash
somewhere near you. Chase them down to find a glowing crater with a **Fallen Star** at its heart.

## Features (v0.1.0)

- **Falling stars**: about one per player per night. The game tells you which direction it fell.
- **Craters** lined with **Starstone** and **Starstone Ore**. Careful, the Fallen Star is still hot.
- **Star Shards → Stardust** (super bone meal) and **Starsteel Ingots** (iron + 4 shards).
- **Starsteel tools** with the **Starlit** bonus: +50% mining speed and +25% damage under a clear night sky.
- **Wishing Stars**: make a wish for a random 3-minute blessing.
- **Star Lanterns** and **Blocks of Starsteel** (beacon-compatible).
- `/starfall summon [pos]` (ops) drops a star on demand.

## Recipes

| Result | Recipe |
|---|---|
| 2 Stardust | 1 Star Shard (shapeless) |
| Starsteel Ingot | 1 Iron Ingot + 4 Star Shards (shapeless) |
| Starsteel tools | Vanilla tool shapes with Starsteel Ingots and sticks |
| Wishing Star | 8 Stardust around 1 Gold Ingot |
| 2 Star Lanterns | 4 Glass around 1 Stardust (plus shape) |
| 4 Starstone Bricks | 4 Starstone (2×2) |
| Star Shard | Smelt or blast Starstone Ore |

## Config

`<world>/serverconfig/starfall-server.toml` controls whether stars fall, how often, how far away,
whether rain stops them, and the crater size.

## Building

See [`../AGENTS.md`](../AGENTS.md). In short: JDK 21, then `gradle build` (or `./gradlew build`) in
this folder. The jar lands in `build/libs/`.
