package com.afuerta.convergence;

import com.afuerta.convergence.domain.Commission;
import com.afuerta.convergence.domain.CommissionCatalog;
import com.afuerta.convergence.domain.DeliveryPlan;
import com.mojang.authlib.GameProfile;
import io.netty.channel.embedded.EmbeddedChannel;
import net.fabricmc.fabric.api.gametest.v1.FabricGameTest;
import net.minecraft.block.Blocks;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.effect.StatusEffects;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.network.ClientConnection;
import net.minecraft.network.NetworkSide;
import net.minecraft.registry.Registries;
import net.minecraft.scoreboard.ScoreHolder;
import net.minecraft.scoreboard.ScoreboardCriterion;
import net.minecraft.server.network.ConnectedClientData;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.test.GameTest;
import net.minecraft.test.TestContext;
import net.minecraft.text.Text;
import net.minecraft.util.Hand;
import net.minecraft.util.Identifier;
import net.minecraft.util.math.BlockPos;
import net.minecraft.world.GameMode;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Real multiplayer-server checks load all four mods; no test fixtures are shipped in the jar. */
public final class ConvergenceGameTests implements FabricGameTest {
    private static final Map<UUID, EmbeddedChannel> TEST_CONNECTIONS = new HashMap<>();

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void crossModRegistriesRecipesAndAdvancementsLoad(TestContext context) {
        for (Commission commission : CommissionCatalog.all()) {
            for (String item : commission.requirements().keySet()) {
                context.assertTrue(Registries.ITEM.containsId(Identifier.of(item)), "Missing cross-mod ingredient: " + item);
            }
            for (String item : commission.rewards().keySet()) {
                context.assertTrue(Registries.ITEM.containsId(Identifier.of(item)), "Missing commission reward: " + item);
            }
        }
        var recipes = context.getWorld().getRecipeManager();
        context.assertFalse(recipes.isErrored(), "One of the four mods has an invalid recipe");
        for (String name : List.of("field_atlas", "attunement_core", "astral_lens", "stormward_sigil",
                "expedition_harness", "triune_pulse", "mender_coil")) {
            var recipe = recipes.get(ConvergenceMod.id(name));
            context.assertTrue(recipe.isPresent(), "Cross-mod recipe did not decode: " + name);
            context.assertTrue(recipe.orElseThrow().value().getResult(context.getWorld().getRegistryManager())
                    .isOf(Registries.ITEM.get(ConvergenceMod.id(name))), "Recipe produces wrong item: " + name);
            context.assertTrue(context.getWorld().getServer().getAdvancementLoader().get(ConvergenceMod.id("recipes/" + name)) != null,
                    "Recipe-book discovery advancement did not decode: " + name);
        }
        for (String name : List.of("root", "attunement", "concord", "focus", "matrix")) {
            context.assertTrue(context.getWorld().getServer().getAdvancementLoader().get(ConvergenceMod.id(name)) != null,
                    "Advancement did not decode: " + name);
        }
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void deficientDeliveriesAndGatesConsumeNothing(TestContext context) {
        ServerPlayerEntity player = player(context);
        try {
            Commission contract = CommissionCatalog.current(0);
            setExternalProgress(player, 1, 0);
            giveRequirements(player, contract);
            Item starShard = ExpeditionContracts.requiredItem("starfall:star_shard");
            ExpeditionContracts.consume(player, starShard, 1);
            int resonanceBefore = count(player, "riftbound:resonance_shard");
            context.assertEquals(DeliveryPlan.Verdict.MISSING_ITEMS, ExpeditionContracts.turnIn(player), "Partial delivery accepted");
            context.assertEquals(resonanceBefore, count(player, "riftbound:resonance_shard"), "Partial delivery consumed Rift material");
            context.assertEquals(8, count(player, "copperwake:scrap"), "Partial delivery consumed Copperwake material");
            context.assertEquals(0, ConvergenceProgress.completed(player), "Rejected delivery advanced progress");
            context.assertEquals(0, count(player, "convergence:confluence_filament"), "Rejected delivery granted a reward");
            ExpeditionContracts.give(player, new ItemStack(starShard));
            setExternalProgress(player, 0, 0);
            context.assertEquals(DeliveryPlan.Verdict.RIFT_LOCKED, ExpeditionContracts.turnIn(player), "Missing Rift completion accepted");
            context.assertEquals(2, count(player, "starfall:star_shard"), "Rift gate consumed Starfall materials");
            setExternalProgress(player, 1, 0);
            player.changeGameMode(GameMode.CREATIVE);
            context.assertEquals(DeliveryPlan.Verdict.SURVIVAL_ONLY, ExpeditionContracts.turnIn(player), "Creative delivery accepted");
            context.assertEquals(8, count(player, "copperwake:scrap"), "Creative delivery consumed an input");
        } finally { remove(context, player); }
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void acceptedDeliveryConsumesAllInputsAndRewardsOnce(TestContext context) {
        ServerPlayerEntity player = player(context);
        try {
            setExternalProgress(player, 1, 0);
            Commission first = CommissionCatalog.current(0);
            giveRequirements(player, first);
            // Use distinct slots rather than insertStack, which merges matching stacks.
            Item resonance = ExpeditionContracts.requiredItem("riftbound:resonance_shard");
            ExpeditionContracts.consume(player, resonance, 2);
            player.getInventory().setStack(18, new ItemStack(resonance));
            player.getInventory().setStack(19, new ItemStack(resonance));
            player.getInventory().setStack(20, new ItemStack(Items.DIAMOND, 7));
            context.assertEquals(DeliveryPlan.Verdict.ACCEPTED, ExpeditionContracts.turnIn(player), "Complete delivery rejected");
            for (String id : first.requirements().keySet()) context.assertEquals(0, count(player, id), "Input remains after accepted order: " + id);
            context.assertEquals(1, ConvergenceProgress.completed(player), "Delivery did not persist exactly one completion");
            context.assertEquals(2, count(player, "convergence:confluence_filament"), "First delivery paid wrong reward");
            context.assertEquals(7, ExpeditionContracts.count(player, Items.DIAMOND), "Unrelated inventory changed");
            context.assertEquals(DeliveryPlan.Verdict.MISSING_ITEMS, ExpeditionContracts.turnIn(player), "Empty next order accepted");
            context.assertEquals(2, count(player, "convergence:confluence_filament"), "Repeated command duplicated reward");
            context.assertEquals(1, ConvergenceProgress.completed(player), "Rejected retry changed saved progress");
            var objective = player.getScoreboard().getNullableObjective(ConvergenceProgress.OBJECTIVE);
            var uuidScore = player.getScoreboard().getScore(ScoreHolder.fromName(player.getUuidAsString()), objective);
            context.assertEquals(1, uuidScore.getScore(), "Progress was not saved under player UUID");
        } finally { remove(context, player); }
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void fullCircuitAndScaledRepeatRemainPlayable(TestContext context) {
        ServerPlayerEntity player = player(context);
        try {
            setExternalProgress(player, 3, 12);
            int expectedFilaments = 0;
            int expectedFocuses = 0;
            int expectedMatrices = 0;
            for (int completed = 0; completed < 36; completed++) {
                Commission commission = CommissionCatalog.current(completed);
                giveRequirements(player, commission);
                context.assertEquals(DeliveryPlan.Verdict.ACCEPTED, ExpeditionContracts.turnIn(player),
                        "Full circuit could not deliver commission " + completed + ": " + commission.id());
                expectedFilaments += commission.rewards().getOrDefault(CommissionCatalog.FILAMENT, 0);
                expectedFocuses += commission.rewards().getOrDefault(CommissionCatalog.FOCUS, 0);
                expectedMatrices += commission.rewards().getOrDefault(CommissionCatalog.MATRIX, 0);
                context.assertEquals(completed + 1, ConvergenceProgress.completed(player), "Circuit step advanced incorrectly");
                context.assertEquals(expectedFilaments, ExpeditionContracts.count(player, ConvergenceMod.FILAMENT), "Circuit filament total wrong");
                context.assertEquals(expectedFocuses, ExpeditionContracts.count(player, ConvergenceMod.FOCUS), "Circuit focus total wrong");
                context.assertEquals(expectedMatrices, ExpeditionContracts.count(player, ConvergenceMod.MATRIX), "Circuit matrix total wrong");
            }
            context.assertEquals(36, ConvergenceProgress.completed(player), "Two circuits did not complete");
            context.assertEquals(6, CommissionCatalog.current(36).requirements().get("riftbound:resonance_shard").intValue(),
                    "Third circuit did not cap scaling at triple materials");
        } finally { remove(context, player); }
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void hardmodeMilestoneNeedsAndConsumesFreshConcordance(TestContext context) {
        ServerPlayerEntity player = player(context);
        try {
            ConvergenceProgress.setCompleted(player, 5);
            setExternalProgress(player, 2, 4);
            Commission milestone = CommissionCatalog.current(5);
            giveRequirements(player, milestone);
            ExpeditionContracts.consume(player, ConvergenceMod.CONCORDANCE, 1);
            context.assertEquals(DeliveryPlan.Verdict.MISSING_ITEMS, ExpeditionContracts.turnIn(player), "Milestone bypassed a Convergence win");
            context.assertEquals(6, count(player, "riftbound:resonance_shard"), "Missing trophy consumed other ingredients");
            ExpeditionContracts.give(player, new ItemStack(ConvergenceMod.CONCORDANCE));
            setExternalProgress(player, 2, 3);
            context.assertEquals(DeliveryPlan.Verdict.GUILD_LOCKED, ExpeditionContracts.turnIn(player), "Mechanist gate not enforced");
            context.assertEquals(1, count(player, "convergence:concordance"), "Guild gate consumed the trial trophy");
            setExternalProgress(player, 2, 4);
            context.assertEquals(DeliveryPlan.Verdict.ACCEPTED, ExpeditionContracts.turnIn(player), "Earned trophy failed milestone");
            context.assertEquals(0, count(player, "convergence:concordance"), "Milestone did not consume trophy");
            context.assertEquals(6, ConvergenceProgress.completed(player), "Milestone did not advance commission");
            context.assertEquals(4, count(player, "convergence:confluence_filament"), "Milestone filament reward wrong");
            context.assertEquals(2, count(player, "convergence:tempered_focus"), "Milestone focus reward wrong");
            context.assertEquals(2, ConvergenceProgress.riftTier(player), "Bridge modified Riftbound progression");
            context.assertEquals(4, ConvergenceProgress.guildContracts(player), "Bridge modified Copperwake progression");
        } finally { remove(context, player); }
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void menderCoilValidatesTargetFuelAndCooldown(TestContext context) {
        ServerPlayerEntity player = player(context);
        try {
            player.setStackInHand(Hand.MAIN_HAND, new ItemStack(ConvergenceMod.MENDER_COIL));
            // A bow blocks vanilla offhand use when held in the main hand; holding the coil
            // there instead makes the device reachable for bows, shields and tridents too.
            player.setStackInHand(Hand.OFF_HAND, new ItemStack(Items.BOW));
            ExpeditionContracts.give(player, new ItemStack(ConvergenceMod.FILAMENT, 2));
            player.interactionManager.interactItem(player, context.getWorld(), player.getMainHandStack(), Hand.MAIN_HAND);
            context.assertEquals(2, ExpeditionContracts.count(player, ConvergenceMod.FILAMENT), "Undamaged target spent fuel");
            player.getOffHandStack().setDamage(100);
            player.interactionManager.interactItem(player, context.getWorld(), player.getMainHandStack(), Hand.MAIN_HAND);
            context.assertEquals(36, player.getOffHandStack().getDamage(), "Mender did not restore exactly 64 durability");
            context.assertEquals(1, ExpeditionContracts.count(player, ConvergenceMod.FILAMENT), "Mender consumed wrong filament count");
            player.interactionManager.interactItem(player, context.getWorld(), player.getMainHandStack(), Hand.MAIN_HAND);
            context.assertEquals(36, player.getOffHandStack().getDamage(), "Cooldown allowed a second repair");
            context.assertEquals(1, ExpeditionContracts.count(player, ConvergenceMod.FILAMENT), "Cooldown spent another filament");
        } finally { remove(context, player); }
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void triunePulseOnlyControlsVisibleHostiles(TestContext context) {
        ServerPlayerEntity player = player(context);
        try {
            player.setStackInHand(Hand.MAIN_HAND, new ItemStack(ConvergenceMod.TRIUNE_PULSE));
            ExpeditionContracts.give(player, new ItemStack(ConvergenceMod.FILAMENT, 2));
            ConvergenceMod.TRIUNE_PULSE.use(context.getWorld(), player, Hand.MAIN_HAND);
            context.assertEquals(2, ExpeditionContracts.count(player, ConvergenceMod.FILAMENT), "Empty pulse spent a filament");
            var zombie = context.spawnMob(EntityType.ZOMBIE, new BlockPos(3, 2, 2));
            var cow = context.spawnMob(EntityType.COW, new BlockPos(3, 2, 3));
            zombie.setAiDisabled(true);
            cow.setAiDisabled(true);
            float health = zombie.getHealth();
            ConvergenceMod.TRIUNE_PULSE.use(context.getWorld(), player, Hand.MAIN_HAND);
            context.assertTrue(zombie.hasStatusEffect(StatusEffects.SLOWNESS), "Visible hostile was not slowed");
            context.assertFalse(cow.hasStatusEffect(StatusEffects.SLOWNESS), "Friendly animal was affected");
            context.assertEquals(health, zombie.getHealth(), "Defensive pulse unexpectedly deals damage");
            context.assertEquals(1, ExpeditionContracts.count(player, ConvergenceMod.FILAMENT), "Pulse spent wrong filament count");
            ConvergenceMod.TRIUNE_PULSE.use(context.getWorld(), player, Hand.MAIN_HAND);
            context.assertEquals(1, ExpeditionContracts.count(player, ConvergenceMod.FILAMENT), "Pulse cooldown spent more fuel");
        } finally { remove(context, player); }
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE, tickLimit = 80)
    public void expeditionOffhandEffectsRunOnServerTick(TestContext context) {
        ServerPlayerEntity player = player(context);
        player.setStackInHand(Hand.OFF_HAND, new ItemStack(ConvergenceMod.EXPEDITION_HARNESS));
        context.waitAndRun(25, () -> {
            try {
                context.assertTrue(player.hasStatusEffect(StatusEffects.SPEED), "Harness speed did not apply");
                context.assertTrue(player.hasStatusEffect(StatusEffects.SLOW_FALLING), "Harness slow falling did not apply");
                context.assertEquals(1, player.getStatusEffect(StatusEffects.JUMP_BOOST).getAmplifier(), "Harness jump boost was not level II");
                player.setStackInHand(Hand.OFF_HAND, new ItemStack(ConvergenceMod.STORMWARD_SIGIL));
                ConvergenceMod.applyOffhand(player);
                context.assertTrue(player.hasStatusEffect(StatusEffects.FIRE_RESISTANCE), "Stormward fire resistance missing");
                context.assertTrue(player.hasStatusEffect(StatusEffects.WATER_BREATHING), "Stormward water breathing missing");
                player.setStackInHand(Hand.OFF_HAND, new ItemStack(ConvergenceMod.ASTRAL_LENS));
                ConvergenceMod.applyOffhand(player);
                context.assertTrue(player.hasStatusEffect(StatusEffects.NIGHT_VISION), "Lens night vision missing");
                player.setStackInHand(Hand.OFF_HAND, ItemStack.EMPTY);
            } finally { remove(context, player); }
            context.complete();
        });
    }

    private static void giveRequirements(ServerPlayerEntity player, Commission commission) {
        commission.requirements().forEach((id, amount) -> ExpeditionContracts.give(player,
                new ItemStack(ExpeditionContracts.requiredItem(id), amount)));
    }

    private static int count(ServerPlayerEntity player, String id) {
        return ExpeditionContracts.count(player, ExpeditionContracts.requiredItem(id));
    }

    private static void setExternalProgress(ServerPlayerEntity player, int riftTier, int guildCount) {
        setScore(player, "riftbound_progress", riftTier);
        setScore(player, "cw_contracts", guildCount);
    }

    private static void setScore(ServerPlayerEntity player, String name, int value) {
        var board = player.getScoreboard();
        var objective = board.getNullableObjective(name);
        if (objective == null) objective = board.addObjective(name, ScoreboardCriterion.DUMMY, Text.literal(name),
                ScoreboardCriterion.RenderType.INTEGER, false, null);
        board.getOrCreateScore(ScoreHolder.fromName(player.getUuidAsString()), objective).setScore(value);
    }

    private static ServerPlayerEntity player(TestContext context) {
        // The vanilla creative mock hard-codes isCreative=true; a real server player is necessary.
        UUID id = UUID.randomUUID();
        var profile = new GameProfile(id, "conv-" + id.toString().substring(0, 8));
        var data = ConnectedClientData.createDefault(profile, false);
        var world = context.getWorld();
        var player = new ServerPlayerEntity(world.getServer(), world, profile, data.syncedOptions());
        var connection = new ClientConnection(NetworkSide.SERVERBOUND);
        var channel = new EmbeddedChannel(connection);
        TEST_CONNECTIONS.put(id, channel);
        world.getServer().getPlayerManager().onPlayerConnect(connection, player, data);
        player.changeGameMode(GameMode.SURVIVAL);
        player.getAbilities().invulnerable = true;
        for (int x = 1; x <= 4; x++) for (int z = 1; z <= 4; z++) {
            context.setBlockState(new BlockPos(x, 1, z), Blocks.STONE);
        }
        BlockPos pos = context.getAbsolutePos(new BlockPos(2, 2, 2));
        player.refreshPositionAndAngles(pos.getX() + .5, pos.getY(), pos.getZ() + .5, 0, 0);
        return player;
    }

    private static void remove(TestContext context, ServerPlayerEntity player) {
        context.getWorld().getServer().getPlayerManager().remove(player);
        player.discard();
        var channel = TEST_CONNECTIONS.remove(player.getUuid());
        if (channel != null) channel.finishAndReleaseAll();
    }
}
