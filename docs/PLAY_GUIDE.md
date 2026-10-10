# Playing Convergence

Install the four Fabric mod jars on the client and server with Minecraft 1.21.1, Java 21, Fabric Loader and Fabric API. The pack's installation notes list the pinned versions. Use a fresh test world for the first alpha playthrough.

## Explore and prepare

Craft Copperwake's **Survey Key**, then use it from the Overworld to enter the **Rustwild**. Explore Oxide Flats, Verdigris Woods and Cinder Works. Salvage yards, relay towers and foundries contain loot and constructs. Take food, armor and a pickaxe. Use the key again, or `/copperwake return`, to return home.

Collect Scrap and Memory Glass, then read `/copperwake contract`. A **Salvage Bench** shows the current delivery; sneak-use it to turn in the complete order. Four completed deliveries unlock Mechanist gadgets. Twelve unlock Artificer rank and the Foundry Foreman challenge. Progress survives relogging and death.

On clear Overworld nights, watch for **Starfall** direction messages and star streaks. Mine the resulting star and crater materials with suitable tools. Turn star shards into **Stardust**, **Starsteel Ingots**, **Wishing Stars** and luminous building blocks. Starsteel tools receive their bonus when their holder is outside under a clear night sky. Stars can damage nearby entities; avoid the landing point.

After your first impact, craft a **Star Compass** with four Star Shards around a Compass. It points to the nearest remembered Fallen Star in your current dimension, helping you find stars after their particle trail fades. Records survive server restarts, with up to 64 per dimension. The needle spins when no target is remembered. Unloaded targets remain remembered without loading their terrain; mining a star makes the compass seek another.

Crater preflight protects block entities, constructed block types, border edges and unloaded terrain. It also records placement columns after installation. It cannot identify an older build made entirely from natural dirt or stone. For an existing world, set `craters.enabled` to `false` in `config/starfall.json` before exploring; stars then land without excavating craters.

## Rift trials

Craft a **Rift Anchor** and place it on clear, flat, dry Overworld ground. Elemental Echoes come from ordinary hostile kills or their fallback crafting recipes. Use an Echo on the anchor to start a trial. Four aspects change the enemy mix: Verdant, Ember, Tidal and Hollow.

Initiate has three waves. Completing it unlocks Adept, and Adept unlocks Exalted. Sneak-use the anchor with an empty main hand to cycle the tier. `/riftbound status` shows your unlock. Up to four players can join: nearby companions must explicitly use `/riftbound ready` before activation. Stay inside the trial boundary; death, withdrawal and escape remove reward eligibility. `/riftbound leave` withdraws.

Earn **Resonance Shards** and craft relics. Hold a relic in the offhand to receive its benefit. Trial enemies do not drop ordinary loot or XP; the completion reward is the payout.

## Connect the rewards

Read `/convergence help`, `/convergence status` and `/convergence contract`. Contracts take materials from salvage, stars and Rift trials. `/convergence turnin` consumes an order only when every requirement and progression gate is satisfied. Later milestones require earned Concordance; the final contract pool repeats.

Craft an **Attunement Core** using a Copperwake Charged Core, four Starfall Star Shards and four Riftbound Resonance Shards. Hold it in the **offhand**, with an Echo in the **main hand**, and activate an **Adept or Exalted** Rift trial. One core is consumed after successful activation.

These Convergence trials add visible warnings before aspect hazards. Move away from marked areas. A successful eligible participant receives extra resonance and one **Concordance**, which unlocks integration gear and later contract milestones. An Initiate trial cannot use an Attunement Core.

Operator kits are for testing and do not grant legitimate guild or trial progression. Use each module's README for exact gadget costs, cooldowns and recipes.
