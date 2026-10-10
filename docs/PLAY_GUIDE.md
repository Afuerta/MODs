# Playing Convergence

Install the four Fabric mod jars on the client and server with Minecraft 1.21.1, Java 21, Fabric Loader and Fabric API. The pack's installation notes list the pinned versions. Use a fresh test world for the first alpha playthrough.

## Explore and prepare

Craft Copperwake's **Survey Key**, then use it from the Overworld to enter the **Rustwild**. Explore Oxide Flats, Verdigris Woods and Cinder Works. Salvage yards, relay towers and foundries contain loot and constructs. Take food, armor and a pickaxe. Use the key again, or `/copperwake return`, to return home.

New Rustwild terrain can also contain **Siphon Gardens**, an aqueduct and pump hall in Verdigris Woods, and **Switchyard Depots**, rail yards with a dispatch office in Oxide Flats or Cinder Works. Explore their entrances, cisterns, catwalks and signal bridges. Each has three finite salvage caches and construct guards. These additions generate in newly explored chunks; they do not replace older landmarks.

Collect Scrap and Memory Glass, then read `/copperwake contract`. A **Salvage Bench** shows the current delivery; sneak-use it to turn in the complete order. Four completed deliveries unlock Mechanist gadgets. Twelve unlock Artificer rank and the Foundry Foreman challenge. Progress survives relogging and death.

On clear Overworld nights, watch for **Starfall** direction messages and star streaks. Mine the resulting star and crater materials with suitable tools. Turn star shards into **Stardust**, **Starsteel Ingots**, **Wishing Stars** and luminous building blocks. Starsteel tools receive their bonus when their holder is outside under a clear night sky. Stars can damage nearby entities; avoid the landing point.

Combine a vanilla Compass, two Starsteel Ingots and two Star Shards into a **Star Compass**. Use it to select the nearest recorded fallen star; held compasses refresh once each second. Its chart keeps the newest 64 successful impacts and survives saving. An unloaded target is remembered without loading its terrain; a mined or missing star is removed once its location is loaded. The chart starts recording when this version is installed.

Craft all four **Starsteel armor** pieces with the standard armor patterns. Starsteel Ingots repair them. The set gives 19 armor points and grants +10% movement speed and +0.10 knockback resistance outdoors under a clear Overworld night. The bonus ends when the sky, weather, time or equipment no longer qualifies.

Crater preflight protects block entities, constructed block types, border edges and unloaded terrain. It also records placement columns after installation. It cannot identify an older build made entirely from natural dirt or stone. For an existing world, set `craters.enabled` to `false` in `config/starfall.json` before exploring; stars then land without excavating craters.

## Rift trials

Craft a **Rift Anchor** and place it on clear, flat, dry Overworld ground. Elemental Echoes come from ordinary hostile kills or their fallback crafting recipes. Use an Echo on the anchor to start a trial. Four aspects change the enemy mix: Verdant, Ember, Tidal and Hollow.

Initiate has three waves. Completing it unlocks Adept, and Adept unlocks Exalted. Sneak-use the anchor with an empty main hand to cycle the tier. `/riftbound status` shows your unlock. Up to four players can join: nearby companions must explicitly use `/riftbound ready` before activation. Stay inside the trial boundary; death, withdrawal and escape remove reward eligibility. `/riftbound leave` withdraws.

Adept and Exalted waves rotate three warned encounter patterns: **staggered reinforcements** release a second group after five seconds; **pincer formations** rush from opposing sides; **standard-bearers** briefly guard nearby allies until defeated. Clearing the first reinforcement group does not finish the wave. These patterns keep the original total enemy counts and payouts, and also appear during attuned trials.

Earn **Resonance Shards** and craft relics. Hold a relic in the offhand to receive its benefit. Trial enemies do not drop ordinary loot or XP; the completion reward is the payout.

## Connect the rewards

Read `/convergence help`, `/convergence status` and `/convergence contract`. Contracts take materials from salvage, stars and Rift trials. `/convergence turnin` consumes an order only when every requirement and progression gate is satisfied. Later milestones require earned Concordance; the final contract pool repeats.

Craft an **Attunement Core** using a Copperwake Charged Core, four Starfall Star Shards and four Riftbound Resonance Shards. Hold it in the **offhand**, with an Echo in the **main hand**, and activate an **Adept or Exalted** Rift trial. One core is consumed after successful activation.

These Convergence trials add visible warnings before aspect hazards. Move away from marked areas. A successful eligible participant receives extra resonance and one **Concordance**, which unlocks integration gear and later contract milestones. An Initiate trial cannot use an Attunement Core.

## Astral infusion

Craft an **Astral Infuser** and place it outdoors in the Overworld. Use it to open its nine-slot inventory; sneak-use it to read all four formulas and the current status. Fill the first seven slots with the displayed materials, including earned Concordance and the appropriate Focus or Matrix. The last two slots hold finished gear.

The station offers alternate Lens, Sigil, Harness and Mender Coil formulas. It uses fewer Filaments while also requiring elemental Echoes and Starsteel. Mender infusion trades the ordinary recipe's Charged Core for Starsteel and Ember Echoes. Every formula retains its original trophy and catalyst gates. Exact counts and slot order are in the station's guidance and [Convergence README](../minecraft/convergence/README.md).

A complete formula takes ten seconds of clear night with open sky. Daylight, rain, thunder or a roof pauses progress. Changed inputs reset it; full output slots pause payment. Materials are consumed together only when a finished item fits. Hoppers above or at the sides insert valid inputs; hoppers below extract finished outputs. Inventory and unfinished progress survive chunk unloading and saving.

Operator kits are for testing and do not grant legitimate guild or trial progression. Use each module's README for exact gadget costs, cooldowns and recipes.
