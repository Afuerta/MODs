# Riftbound roadmap

This is a proposed sequence, not a statement that future features already ship. The first release should be judged as a playable loop: collect echoes, run an anchor, choose an offhand relic, and advance through three tiers.

## v0.1 — Establish a reliable survival loop

Deliver the four aspects, one anchor, three trial tiers, resonance currency, and three relic choices. Keep terrain unchanged and use existing enemy entities. Support explicit co-op enrollment, saved player unlocks, bounded arena participation, cleanup on interruption, and reproducible domain tests.

Before treating the release as stable, verify the Fabric build, dedicated-server startup, recipe loading, and actual solo/co-op play. Exercise death, disconnect, dimension change, inventory-full rewards, chunk unload, anchor removal, server restart, and simultaneous attempts. Confirm that no trial mob yields ordinary loot or XP and that all terminal paths release players and remove leftover enemies.

Release criteria:

- A new survival player can discover or craft every input without operator commands.
- Each aspect produces a recognizably different enemy mix.
- A completed run visibly grants the correct personal reward and unlock.
- A failed run cannot grant rewards or leave an immortal or unmanaged enemy behind.
- Multiplayer participants opt in and cannot claim rewards after withdrawing.
- The README accurately distinguishes checks that ran from manual playtests still needed.

## v0.2 — Optional Convergence hazards implemented

The Convergence bridge can now opt Adept/Exalted trials into four original telegraphed hazards. These rules are implemented with bounded participant-only effects, a lag-safe warning clock, once-only bonus rewards, and cancellation on wave/encounter transitions. See `design.md` for exact shipped values. Client readability and balance still need playtesting.

| Aspect | Implemented rule | Player response |
| --- | --- | --- |
| Verdant | Telegraph a small area where roots briefly slow players | Keep a route open and pull enemies around roots |
| Ember | Mark alternating safe and heated sectors without placing fire blocks | Move on the pulse instead of standing still |
| Tidal | A marked ring periodically pushes toward the anchor | Use terrain and time ranged attacks between pulses |
| Hollow | Purple marks reveal a lane that briefly inflicts Weakness | Read the tell and break line of sight |

Later tuning: introduce a per-world configuration for drop rate, enemy caps, arena radius, and cooldown once playtest data identifies necessary tuning. Add a compact trial HUD with wave, time, participant count, and clear withdrawal feedback. Any persistent cooldown format needs save/load migration and restart tests.

## v0.3 — Give exploration authored destinations

Add a small family of biome-aware Echo Cairns rather than a new dimension. Each cairn should contain a short environmental clue, one traversal or combat challenge, and a guaranteed aspect reward. Structure placement must respect dimension and biome tags, avoid excessive frequency, and be tested against world-generation datapacks.

Start with two templates that share a readable visual language: an overgrown surface cairn and a drowned river ruin. Expand to an Ember scar and a buried Hollow chamber only after the first two are enjoyable and reliably generated. Structures should give a reason to travel beyond the recipe fallback, such as cosmetic relic variants or an optional trial modifier, without making older worlds unusable.

Add advancements or a small in-game field guide for echo sources, trial rules, and relic recipes. A returning player should be able to discover the loop without reading external documentation.

## v0.4 — One enemy, then one boss

First build a single original enemy, the **Echo Warden**: a slow sentinel that announces a directional strike and exposes its core after missing. Reuse its visual and audio vocabulary in the later boss so players learn counterplay before a high-stakes fight.

Then prototype the **Fractured Heart**, a stationary arena core with three short phases:

1. **Listen:** aspect-marked weak points appear while small groups of existing enemies press the party.
2. **Answer:** the core repeats a clearly telegraphed sequence of arena pulses; correct positioning opens a damage window.
3. **Resonate:** the party chooses one active aspect to suppress, trading a safer hazard pattern for a different final reward.

The boss should test learned rules, avoid unavoidable damage, and scale mechanics as well as health for multiplayer. Completion rewards a sidegrade or a cosmetic achievement before introducing stronger equipment. Build one complete boss with a clean reset path before planning a roster.

## Longer-term choices

Consider relic specializations, optional team roles, and curated modifier combinations only after the base choices remain useful across several sessions. Offer a way to reattune at a meaningful cost instead of requiring permanent irreversible character choices. Evaluate server administration and accessibility needs before adding effects that affect visibility, movement, or sound cues.

Defer a custom dimension, large technology tree, dozens of bosses, and extensive world generation until the smaller loop proves worth returning to. Preserve compatibility through namespaced IDs, documented save formats, restrained mixin use, and a narrow separation between deterministic encounter rules and Minecraft integration.

## Collaboration and review

Keep design and balance decisions in `design.md`; keep implementation truth in code and acceptance evidence in the README or release notes. Use the pure Java core to reproduce reported encounter bugs from aspect, tier, party size, seed, and event sequence. Minecraft integration changes need server-level verification, and combat changes need playtests in addition to unit checks.

Useful review tasks for another collaborator include adversarial lifecycle analysis, loot-farming checks, spawn-space edge cases, accessibility critique, and recipe/progression clarity. Record who actually performed each review and what evidence they returned; an intended collaborator is not a completed review.
