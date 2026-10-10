# Expansion task queue

The previous implementation is **T23: Convergence integration**, owned by Codex with Astra. It imports Copperwake, preserves the original Claude-authored Starfall source, ports Starfall to Fabric, expands each mod, and adds shared progression. Status: **done**. Implementation, full build, 45 combined GameTests and 10,696 domain checks pass locally and in GitHub CI. The original NeoForge build and the individual Fabric checks also pass. See [PR #3](https://github.com/Afuerta/MODs/pull/3) and the [0.2.0 validation record](VALIDATION-0.2.0.md).

The current implementation is **T24: Expedition expansion**, owned by Codex with Astra. Status: **done**. This coordinated pass combines the canonical C02 Star Compass and C03 Starsteel armor contributions with C04 Astral infusion, C05 Rustwild landmarks and C07 varied trial encounters. It preserves the published `starfall_impacts` save format and the upstream C02/C03 ancestry. C13 regression fixtures cover saved progress and original items. The reconciled build passes 80 combined GameTests, 61 standalone tests, 11,501 domain checks and 470 production JSON validations; the [validation record](VALIDATION.md) records the observed final outcomes and [C02/C03 history](VALIDATION-C02-C03.md) preserves the earlier contributions.

Future tasks are scoped so several contributors can work independently. Claim a row and coordinate its owned paths before starting. Each task needs survival-obtainable recipes, translated guidance, applicable engine tests, and a focused pull request.

| ID | Task | Suggested owner | Acceptance criteria | Status |
| --- | --- | --- | --- | --- |
| C01 | Multiplayer balance playtest | Claude + human | Record a 1-player and 4-player session through all tiers; measure costs, deaths and rewards; propose specific balance edits | ready |
| C02 | Persistent Star Compass | Upstream C02 + Codex integration | Record at most 64 impacts per world; remove mined stars; compass uses vanilla lodestone component and persists across restart; test stale and unloaded targets | done |
| C03 | Starsteel armor | Upstream C03 + Codex integration | Four armor pieces, repair/enchantment tags and recipes; bounded clear-night set bonus; test equipment changes, daylight and dedicated server loading | done |
| C04 | Astral infusion station | Codex infusion agent | Four authored recipes using all three mods; atomic input consumption and output; hopper rules; pause outside clear-night conditions; save/load and overflow tests | done |
| C05 | Rustwild expedition landmarks | Codex landmark agent | Two original structures with walkable entrances and documented placement frequency; protect registry IDs; validate NBT, loot and terrain placement | done |
| C06 | Construct combat playtest | Claude + human | Verify every telegraph at normal latency; tune boss phase timing and cover behavior; record minimum viable gear and accessibility issues | ready |
| C07 | Additional trial encounter types | Astra | At least three distinct wave patterns rather than health inflation; preserve eligible-player rewards, cleanup, conversions and ordinary trial loot rules | done |
| C08 | Party expedition contracts | Astra | Explicit opt-in roster capped at four; complete one shared objective; one reward per eligible UUID; handle death, leave, disconnect, timeout and restart | ready |
| C09 | Constellation charting | Astra | Six discoverable clear-night observations with translated clues; persisted per-player discoveries; no repeated claim reward; test angular/time boundaries | ready |
| C10 | Data-driven Convergence contracts | Codex or Claude | Reloadable validated definitions; reject unknown IDs, impossible counts and unsafe reward loops; deterministic ordering and stable saved progress | ready |
| C11 | EMI / JEI recipe browsing | Claude | Optional loader-compatible dependency; show integration recipes and costs; boot and test with the viewer present and absent | ready |
| C12 | Jade information panels | Claude | Optional tooltips for trial mode, machine progress and star state; no client-class reference in common entry points | ready |
| C13 | Pack upgrade migration tests | Codex root | Load a save with pre-expansion guild/rift progress and original IDs; prove no score reset, missing content or renamed registry entries | done |
| C14 | Accessibility pass | Claude | Every danger has readable text/sound plus visible indication; test low particles, color blindness and subtitle use | ready |
| C15 | Configuration and server limits | Codex | Bound every added event rate and radius; document caps; malformed config falls back safely; test reload/restart behavior | ready |
| C16 | Tagged release pipeline | Codex | Publish verified pack ZIP, manifest and checksums for an explicit tag; exclude sources/test jars from installable pack; document exact runtime dependencies | ready |
| C17 | Longer survival economy review | Astra + human | Trace every reward to a source, identify bottlenecks and self-funding deliveries, measure expected milestones, and revise only evidence-backed values | ready |

The original NeoForge tasks T00–T22 remain in [Starfall's board](../starfall/TASKS.md). Completing a Fabric equivalent does not imply that its NeoForge version is complete. New tasks must state which loader they target.
