# VR42 — Dusk Range comfort and playability

| Task | Owner | Status |
| --- | --- | --- |
| Recover the October 17 production baseline and improve direct launch, pause, comfort controls and combat correctness | Codex root + controls / combat / launcher agents | Implemented; 27 regression tests pass and all 39 ordered scripts parse |
| Preserve source history and prepare an isolated review branch | Codex repository agent | Local snapshot verified; isolated draft PR prepared for review |

Branch: `chatgpt/vr42-dusk-range-comfort`.

Owned paths: `webvr/dusk-range/` and this task record only. Preserve Minecraft, Terraria, shared builds, and other agents' branches.

The baseline is Vercel deployment `dpl_EsDZvtv1N85gKEaM8WPHdVL5b9a8`, retrieved October 17, 2026. The existing draft PR #7 contains a different October 13 source lineage and additional Frontier expansion work. This task must preserve that branch and record the divergence; do not merge both versions without reconciling their source and behavior.

Before completion, run the ordered-script check and the gameplay/input regression suite. Record browser and headset verification separately; desktop automation is not a physical Quest playtest.

An attempted Vercel preview deployment was rejected by automatic approval review because the current request did not explicitly authorize publishing this payload and destination. Preview publication remains pending user approval. This task prepares a review branch and draft PR only; it does not merge, change Vercel Git integration, or publish a deployment. Physical headset validation is also pending.
