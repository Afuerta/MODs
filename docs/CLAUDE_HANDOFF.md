# Claude handoff: Convergence expeditions

The owner asked for a large Minecraft mod project developed with Astra and Claude. This change builds on the supplied Claude-authored Starfall foundation. There is no live Claude execution endpoint in this session; this document is the concrete handoff for continued collaboration.

## Check out the integration

Start with the latest merged `main`, the T24 expedition change and root [AGENTS.md](../AGENTS.md). Use an isolated worktree. Do not replace or reset an agent's existing worktree, and do not overwrite the original `starfall/` NeoForge source when working on its Fabric port at `minecraft/starfall/`.

The Fabric suite uses Minecraft 1.21.1 and Java 21. `minecraft/README.md` lists build and combined GameTest commands. Tests must run with all three content mods plus Convergence installed, because standalone tests cannot detect cross-mod load-order and reward integration failures.

## Review priorities

1. Check that the port preserves Starfall's existing IDs and `.px` textures while using Fabric events and Yarn names.
2. Try to reproduce invalid meteor impact paths: constructed blocks anywhere in the footprint, a block entity, a fluid, an unloaded neighbor, border edges, and repeated impacts. No partial crater may be written when preflight fails.
3. Check failed trial activation and incomplete delivery costs. Repeating a completion or command must never award a second reward for the same action.
4. Play an ordinary Rift trial and an attuned Adept/Exalted trial in a party. Verify warnings, late entrants, withdrawal, death, cleanup and progress.
5. Audit every contract requirement against obtainable survival items and prior progression. Rewards must not reproduce the full materials needed for their own repeating delivery.
6. Test the Star Compass with a mined target, an unloaded target, a dimension change and a normal restart. The index keeps 64 records per dimension and never loads remote terrain.
7. Try the Astral Infuser's actual UI, input changes, full outputs, side insertion, bottom extraction, roof/weather pauses and ordinary restart. All four formulas retain earned Concordance and catalyst gates.
8. Play the two new Rustwild landmarks and locate all five naturally. Their templates are one-piece structures with positive jigsaw depth; the previous zero-depth settings decoded without producing natural pieces.

## First independent implementation

Take **C11: EMI / JEI recipe browsing** from [the expansion queue](EXPANSION_TASKS.md). C02–C05 and C07 now have implementations in the Fabric suite. A viewer should display ordinary crafting plus all four Astral infusion formulas, including exact fixed slots, earned trophy/catalyst costs and clear-night processing. Keep the viewer optional, choose a verified Minecraft 1.21.1-compatible dependency, and prove both present and absent loader runs succeed.

After that, C14 accessibility and C01/C06/C17 measured playtests provide substantial parallel work. Inspect the actual client visuals and interaction predictions of the vanilla three-by-three station menu; headless tests cannot assess its clarity. Astra's next implementation assignments are C08 party expeditions and C09 constellation charting.

## Astra's next party expedition plan

C08 starts with a shared delivery of one existing commission. Require explicit invitations/acceptance, at most four UUIDs, matching immutable commission/circuit definitions, and each member's existing Rift/guild gates. Preserve the catalog's full material costs and payout per eligible UUID; pooling materials must not manufacture trophies, catalysts or rank progress. Lock the roster, costs and deadline when the job becomes active. Block overlapping party jobs and personal turn-ins for active members. Death, departure and disconnect permanently forfeit that job's eligibility.

Persist a bounded ledger with states `FORMING`, `ACTIVE`, `COMPLETED`, `CLOSED` and terminal `FAILED`, plus schema version, job UUID, locked member states, snapshotted commission/counters/costs, deadline, terminal reason and reward entitlements. Normal restart fails unfinished jobs without consuming materials or paying; completed entitlements survive. Keep full-inventory rewards in a mailbox. A future claim protocol must save a receipt with the player's inventory and acknowledge it in the world ledger; two separate vanilla save files are not an atomic transaction.

If the implementation promises process-crash recovery during multi-player payment, add `COMMITTING`: first persist the frozen commit roster/costs, then save each payer's inventory debit and receipt together, replay missing receipts, and complete only after all receipts exist. Record expected-before/expected-after progression counters rather than blindly incrementing on replay. A simpler first pass may support normal restarts without claiming crash-atomic payment.

Test fifth/duplicate/late joins, mismatched gates/circuits, deficient payment, repeated turn-in, withdrawal costs, death/disconnect/timeout, overlapping personal delivery, full inventory, all persisted states, normal restart and replay at each claim-save boundary. Preserve the current objective IDs and numerical thresholds. Record the Exalted reinforcement release and first attuned hazard impact occurring together at combat tick 100 as a measured combat-playtest target rather than changing timing without evidence.

## Evidence to provide

Include exact build/test outcomes and survival playtest findings in each PR. Do not mark visual behavior tested when only a headless server ran. The original NeoForge project remains a separate build profile; the Fabric pack contains its Fabric port only.
