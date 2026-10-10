package com.afuerta.riftbound;

import com.afuerta.riftbound.domain.Aspect;
import com.mojang.authlib.GameProfile;
import io.netty.channel.embedded.EmbeddedChannel;
import net.fabricmc.fabric.api.event.player.UseBlockCallback;
import net.fabricmc.fabric.api.gametest.v1.FabricGameTest;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.EquipmentSlot;
import net.minecraft.entity.mob.MobEntity;
import net.minecraft.entity.mob.ZombieEntity;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.registry.Registries;
import net.minecraft.network.ClientConnection;
import net.minecraft.network.NetworkSide;
import net.minecraft.server.network.ConnectedClientData;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.test.GameTest;
import net.minecraft.test.TestContext;
import net.minecraft.util.ActionResult;
import net.minecraft.util.Hand;
import net.minecraft.util.Identifier;
import net.minecraft.util.TypeFilter;
import net.minecraft.util.hit.BlockHitResult;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.Direction;
import net.minecraft.world.Difficulty;
import net.minecraft.world.GameMode;

import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Predicate;

/** Real headless Minecraft tests; this source set is excluded from the released mod jar. */
public final class RiftboundGameTests implements FabricGameTest {
    private static final Map<UUID, EmbeddedChannel> TEST_CONNECTIONS = new HashMap<>();
    @GameTest(templateName = EMPTY_STRUCTURE)
    public void registeredItemsAndRecipesLoad(TestContext context) {
        var expected = List.of("rift_anchor", "resonance_shard", "dormant_relic", "wayfarer_relic",
                "bulwark_relic", "harvester_relic", "verdant_echo", "ember_echo", "tidal_echo", "hollow_echo");
        for (String name : expected) {
            context.assertTrue(Registries.ITEM.containsId(RiftboundMod.id(name)), "Missing runtime item: " + name);
        }
        context.assertTrue(Registries.BLOCK.containsId(RiftboundMod.id("rift_anchor")), "Anchor block not registered");
        var recipes = context.getWorld().getRecipeManager();
        context.assertFalse(recipes.isErrored(), "Minecraft reported a recipe decoding error");
        for (String name : expected) {
            if (name.equals("resonance_shard")) continue;
            var entry = recipes.get(RiftboundMod.id(name));
            context.assertTrue(entry.isPresent(), "Recipe did not load: " + name);
            var output = entry.orElseThrow().value().getResult(context.getWorld().getRegistryManager());
            context.assertTrue(output.isOf(Registries.ITEM.get(RiftboundMod.id(name))), "Wrong crafted output: " + name);
        }
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void lootMixinOnlySuppressesTaggedEnemies(TestContext context) {
        var ordinary = context.spawnMob(EntityType.ZOMBIE, new BlockPos(2, 2, 2));
        var trial = context.spawnMob(EntityType.ZOMBIE, new BlockPos(5, 2, 5));
        ordinary.equipStack(EquipmentSlot.MAINHAND, new ItemStack(Items.DIAMOND));
        trial.equipStack(EquipmentSlot.MAINHAND, new ItemStack(Items.EMERALD));
        ordinary.setEquipmentDropChance(EquipmentSlot.MAINHAND, 2.0f);
        trial.setEquipmentDropChance(EquipmentSlot.MAINHAND, 2.0f);
        // Tag after spawn for this isolated drop test; orphan cleanup is tested separately.
        trial.addCommandTag(RiftboundMod.TRIAL_MOB_TAG);
        context.assertTrue(ordinary.shouldDropXp(), "Vanilla zombie XP was suppressed");
        context.assertFalse(trial.shouldDropXp(), "Tagged zombie can drop XP");
        ordinary.damage(context.getWorld().getDamageSources().generic(), 1000.0f);
        trial.damage(context.getWorld().getDamageSources().generic(), 1000.0f);
        context.waitAndRun(2, () -> {
            context.expectItem(Items.DIAMOND);
            context.dontExpectItem(Items.EMERALD);
            context.complete();
        });
    }

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void orphanTrialEnemiesAreRemovedOnEntityLoad(TestContext context) {
        var orphan = EntityType.ZOMBIE.create(context.getWorld());
        context.assertTrue(orphan != null, "Zombie factory failed");
        var position = context.getAbsolutePos(new BlockPos(2, 2, 2));
        orphan.refreshPositionAndAngles(position.getX(), position.getY(), position.getZ(), 0, 0);
        orphan.addCommandTag(RiftboundMod.TRIAL_MOB_TAG);
        context.getWorld().spawnEntity(orphan);
        var ordinary = context.spawnMob(EntityType.ZOMBIE, new BlockPos(5, 2, 5));
        context.waitAndRun(1, () -> {
            context.assertTrue(orphan.isRemoved(), "Restart orphan remained in the world");
            context.assertFalse(ordinary.isRemoved(), "Entity-load cleanup removed an ordinary enemy");
            context.complete();
        });
    }

    @GameTest(templateName = EMPTY_STRUCTURE, tickLimit = 80)
    public void offhandRelicAppliesThroughServerTick(TestContext context) {
        var player = createSurvivalServerPlayer(context);
        player.setStackInHand(Hand.OFF_HAND, new ItemStack(RiftboundMod.HARVESTER));
        context.waitAndRun(25, () -> {
            try {
                context.assertTrue(player.hasStatusEffect(net.minecraft.entity.effect.StatusEffects.HASTE),
                        "Offhand Harvester did not receive its server tick effect");
                player.setStackInHand(Hand.OFF_HAND, ItemStack.EMPTY);
            } finally {
                removePlayer(context, player);
            }
            context.complete();
        });
    }

    @GameTest(templateName = "riftbound_test:arena", batchId = "riftbound_trial", tickLimit = 180)
    public void insufficientEchoesAndOffhandCannotStartTrial(TestContext context) {
        var player = survivalPlayerAtAnchor(context);
        var anchor = context.getAbsolutePos(new BlockPos(15, 1, 15));
        PlayerProgress.complete(player, 1);
        player.setSneaking(true);
        RiftboundMod.TRIALS.useAnchor(player, anchor); // Select the now-unlocked Adept tier.
        player.setSneaking(false);
        player.setStackInHand(Hand.MAIN_HAND, new ItemStack(RiftboundMod.ECHOES.get(Aspect.VERDANT), 1));
        var hit = new BlockHitResult(anchor.toCenterPos(), Direction.UP, anchor, false);
        var offhand = UseBlockCallback.EVENT.invoker().interact(player, context.getWorld(), Hand.OFF_HAND, hit);
        context.assertEquals(ActionResult.PASS, offhand, "Offhand callback must pass through");
        UseBlockCallback.EVENT.invoker().interact(player, context.getWorld(), Hand.MAIN_HAND, hit);
        context.assertEquals(1, player.getMainHandStack().getCount(), "Rejected offer was consumed");
        context.waitAndRun(110, () -> {
            try {
                context.assertEquals(0, trialMobs(context, anchor).size(), "Rejected offer spawned a wave");
                context.assertEquals(0, count(player, RiftboundMod.RESONANCE), "Rejected offer awarded shards");
            } finally {
                removePlayer(context, player);
            }
            context.complete();
        });
    }

    @GameTest(templateName = "riftbound_test:arena", batchId = "riftbound_completion", tickLimit = 700)
    public void threeRealWavesConvertCleanlyAndRewardOnlyOnce(TestContext context) {
        var player = survivalPlayerAtAnchor(context);
        var anchor = context.getAbsolutePos(new BlockPos(15, 1, 15));
        player.setStackInHand(Hand.MAIN_HAND, new ItemStack(RiftboundMod.ECHOES.get(Aspect.VERDANT), 2));
        var hit = new BlockHitResult(anchor.toCenterPos(), Direction.UP, anchor, false);
        UseBlockCallback.EVENT.invoker().interact(player, context.getWorld(), Hand.MAIN_HAND, hit);
        context.assertEquals(1, player.getMainHandStack().getCount(), "Accepted trial must consume one Echo");
        AtomicBoolean converted = new AtomicBoolean();
        AtomicBoolean finished = new AtomicBoolean();
        AtomicInteger defeated = new AtomicInteger();
        context.runAtEveryTick(() -> {
            if (finished.get()) return;
            for (MobEntity enemy : trialMobs(context, anchor)) {
                if (!enemy.isAlive()) continue;
                if (!converted.get() && enemy instanceof ZombieEntity) {
                    var replacement = enemy.convertTo(EntityType.DROWNED, true);
                    context.assertTrue(replacement != null, "Vanilla conversion returned no replacement");
                    context.assertTrue(replacement.getCommandTags().contains(RiftboundMod.TRIAL_MOB_TAG),
                            "Conversion lost the trial tag");
                    context.assertTrue(RiftboundMod.TRIALS.isManagedMob(replacement.getUuid()),
                            "Replacement was not reserved before its entity-load callback");
                    context.assertFalse(replacement.isRemoved(), "Orphan cleanup removed a managed replacement");
                    context.assertFalse(replacement.shouldDropXp(), "Conversion restored ordinary XP drops");
                    enemy = replacement;
                    converted.set(true);
                }
                enemy.setAiDisabled(true);
                if (enemy.damage(context.getWorld().getDamageSources().generic(), 1000.0f)) defeated.incrementAndGet();
            }
            if (PlayerProgress.completedTier(player) != 1) return;
            finished.set(true);
            context.assertTrue(converted.get(), "No real trial zombie conversion was exercised");
            context.assertEquals(12, defeated.get(), "Trial did not require all 3 + 4 + 5 enemies");
            context.assertEquals(3, count(player, RiftboundMod.RESONANCE), "Initiate reward was not exactly three shards");
            // Retry immediately: cooldown and old death callbacks cannot duplicate the reward.
            RiftboundMod.TRIALS.useAnchor(player, anchor);
            context.waitAndRun(25, () -> {
                try {
                    context.assertEquals(3, count(player, RiftboundMod.RESONANCE), "Terminal ticks duplicated the reward");
                    context.assertEquals(1, player.getMainHandStack().getCount(), "Cooldown consumed another Echo");
                    context.assertEquals(0, trialMobs(context, anchor).size(), "Completed trial left enemies behind");
                } finally {
                    removePlayer(context, player);
                }
                context.complete();
            });
        });
    }

    @GameTest(templateName = "riftbound_test:arena", batchId = "riftbound_convergence_rejected", tickLimit = 180)
    public void rejectedConvergenceActivationConsumesNeitherOffering(TestContext context) {
        var player = survivalPlayerAtAnchor(context);
        var anchor = context.getAbsolutePos(new BlockPos(15, 1, 15));
        Item core = convergenceItem("attunement_core");
        player.setStackInHand(Hand.OFF_HAND, new ItemStack(core, 2));
        player.setStackInHand(Hand.MAIN_HAND, new ItemStack(RiftboundMod.ECHOES.get(Aspect.EMBER), 3));
        RiftboundMod.TRIALS.useAnchor(player, anchor); // Initiate is explicitly unsupported.
        context.assertEquals(3, player.getMainHandStack().getCount(), "Unsupported tier consumed echoes");
        context.assertEquals(2, player.getOffHandStack().getCount(), "Unsupported tier consumed a core");
        selectTier(player, anchor, 1);
        player.setStackInHand(Hand.MAIN_HAND, new ItemStack(RiftboundMod.ECHOES.get(Aspect.EMBER), 1));
        RiftboundMod.TRIALS.useAnchor(player, anchor);
        context.assertEquals(1, player.getMainHandStack().getCount(), "Insufficient offer consumed echo");
        context.assertEquals(2, player.getOffHandStack().getCount(), "Insufficient offer consumed core");
        // Remove support under the spawn ring to exercise a failed spatial preflight.
        for (int x = -12; x <= 12; x++) for (int z = -12; z <= 12; z++) {
            if (Math.abs(x) < 4 && Math.abs(z) < 4) continue;
            for (int y = -5; y <= 5; y++) {
                context.getWorld().setBlockState(anchor.add(x, y, z), net.minecraft.block.Blocks.AIR.getDefaultState());
            }
        }
        player.setStackInHand(Hand.MAIN_HAND, new ItemStack(RiftboundMod.ECHOES.get(Aspect.EMBER), 2));
        RiftboundMod.TRIALS.useAnchor(player, anchor);
        context.assertEquals(2, player.getMainHandStack().getCount(), "Failed arena preflight consumed echoes");
        context.assertEquals(2, player.getOffHandStack().getCount(), "Failed arena preflight consumed a core");
        context.waitAndRun(110, () -> {
            try {
                context.assertEquals(0, trialMobs(context, anchor).size(), "Rejected Convergence spawned enemies");
                context.assertEquals(0, count(player, convergenceItem("concordance")), "Rejected Convergence granted reward");
            } finally { removePlayer(context, player); }
            context.complete();
        });
    }

    @GameTest(templateName = "riftbound_test:arena", batchId = "riftbound_convergence_reward", tickLimit = 900)
    public void adeptConvergenceAwardsBonusAndConcordanceOnce(TestContext context) {
        var player = survivalPlayerAtAnchor(context);
        var anchor = context.getAbsolutePos(new BlockPos(15, 1, 15));
        selectTier(player, anchor, 1);
        player.setStackInHand(Hand.OFF_HAND, new ItemStack(convergenceItem("attunement_core"), 2));
        player.setStackInHand(Hand.MAIN_HAND, new ItemStack(RiftboundMod.ECHOES.get(Aspect.VERDANT), 4));
        RiftboundMod.TRIALS.useAnchor(player, anchor);
        context.assertEquals(2, player.getMainHandStack().getCount(), "Adept did not consume exactly two echoes");
        context.assertEquals(1, player.getOffHandStack().getCount(), "Convergence did not consume exactly one core");
        AtomicInteger defeated = new AtomicInteger();
        AtomicBoolean finished = new AtomicBoolean();
        context.runAtEveryTick(() -> {
            if (finished.get()) return;
            for (MobEntity enemy : trialMobs(context, anchor)) {
                if (!enemy.isAlive()) continue;
                enemy.setAiDisabled(true);
                if (enemy.damage(context.getWorld().getDamageSources().generic(), 1000.0f)) defeated.incrementAndGet();
            }
            if (PlayerProgress.completedTier(player) != 2) return;
            finished.set(true);
            context.assertEquals(26, defeated.get(), "Adept Convergence did not require all four waves");
            context.assertEquals(8, count(player, RiftboundMod.RESONANCE), "Adept must award six base plus two bonus shards");
            context.assertEquals(1, count(player, convergenceItem("concordance")), "Success must award exactly one Concordance");
            RiftboundMod.TRIALS.useAnchor(player, anchor);
            context.waitAndRun(30, () -> {
                try {
                    context.assertEquals(8, count(player, RiftboundMod.RESONANCE), "Repeated terminal ticks duplicated bonus");
                    context.assertEquals(1, count(player, convergenceItem("concordance")), "Repeated ticks duplicated Concordance");
                    context.assertEquals(1, player.getOffHandStack().getCount(), "Cooldown consumed another core");
                    context.assertEquals(0, trialMobs(context, anchor).size(), "Convergence left enemies after completion");
                } finally { removePlayer(context, player); }
                context.complete();
            });
        });
    }

    @GameTest(templateName = "riftbound_test:arena", batchId = "riftbound_convergence_warning", tickLimit = 500)
    public void hollowWarningPrecedesImpactAndNeverAffectsBystanders(TestContext context) {
        var player = survivalPlayerAtAnchor(context);
        var anchor = context.getAbsolutePos(new BlockPos(15, 1, 15));
        var bystander = createSurvivalServerPlayer(context);
        bystander.getAbilities().invulnerable = true;
        bystander.refreshPositionAndAngles(player.getX(), player.getY(), player.getZ(), 0, 0);
        selectTier(player, anchor, 2);
        player.setStackInHand(Hand.OFF_HAND, new ItemStack(convergenceItem("attunement_core")));
        player.setStackInHand(Hand.MAIN_HAND, new ItemStack(RiftboundMod.ECHOES.get(Aspect.HOLLOW), 3));
        RiftboundMod.TRIALS.useAnchor(player, anchor);
        AtomicLong firstCombatTick = new AtomicLong(-1);
        AtomicBoolean finished = new AtomicBoolean();
        context.runAtEveryTick(() -> {
            if (finished.get()) return;
            long now = context.getWorld().getTime();
            for (MobEntity mob : trialMobs(context, anchor)) {
                mob.setAiDisabled(true);
                firstCombatTick.compareAndSet(-1, now);
            }
            if (firstCombatTick.get() < 0) return;
            long elapsed = now - firstCombatTick.get();
            boolean weakened = player.hasStatusEffect(net.minecraft.entity.effect.StatusEffects.WEAKNESS);
            context.assertFalse(bystander.hasStatusEffect(net.minecraft.entity.effect.StatusEffects.WEAKNESS),
                    "Unenrolled bystander was affected by Convergence");
            if (elapsed < 99) context.assertFalse(weakened, "Hazard struck before grace plus its full warning");
            if (!weakened) return;
            finished.set(true);
            context.assertTrue(elapsed >= 99, "Warning interval was shorter than forty ticks");
            RiftboundMod.TRIALS.cancel(player);
            context.waitAndRun(80, () -> {
                try {
                    context.assertFalse(player.hasStatusEffect(net.minecraft.entity.effect.StatusEffects.WEAKNESS),
                            "Aborted trial emitted another hazard or retained an expired effect");
                    context.assertEquals(0, count(player, convergenceItem("concordance")), "Withdrawn player received Concordance");
                    context.assertEquals(0, trialMobs(context, anchor).size(), "Abort left Convergence enemies");
                } finally { removePlayer(context, player); removePlayer(context, bystander); }
                context.complete();
            });
        });
    }

    private static Item convergenceItem(String path) {
        return Registries.ITEM.get(Identifier.of("convergence", path));
    }

    @GameTest(templateName = "riftbound_test:arena", batchId = "riftbound_convergence_roots", tickLimit = 500)
    public void verdantWarningAppliesRootSlowdown(TestContext context) {
        runSingleHazard(context, Aspect.VERDANT, player ->
                player.hasStatusEffect(net.minecraft.entity.effect.StatusEffects.SLOWNESS)
                        && player.getStatusEffect(net.minecraft.entity.effect.StatusEffects.SLOWNESS).getAmplifier() == 1);
    }

    @GameTest(templateName = "riftbound_test:arena", batchId = "riftbound_convergence_current", tickLimit = 500)
    public void tidalRingPushesEligiblePlayerInward(TestContext context) {
        runSingleHazard(context, Aspect.TIDAL, player -> player.getVelocity().x < -.2);
    }

    private static void runSingleHazard(TestContext context, Aspect aspect, Predicate<ServerPlayerEntity> impacted) {
        var player = survivalPlayerAtAnchor(context);
        var anchor = context.getAbsolutePos(new BlockPos(15, 1, 15));
        selectTier(player, anchor, 1);
        if (aspect == Aspect.TIDAL) {
            player.refreshPositionAndAngles(anchor.getX() + 10.5, anchor.getY(), anchor.getZ() + .5, 0, 0);
        }
        player.setStackInHand(Hand.OFF_HAND, new ItemStack(convergenceItem("attunement_core")));
        player.setStackInHand(Hand.MAIN_HAND, new ItemStack(RiftboundMod.ECHOES.get(aspect), 2));
        RiftboundMod.TRIALS.useAnchor(player, anchor);
        AtomicLong firstCombatTick = new AtomicLong(-1);
        AtomicBoolean finished = new AtomicBoolean();
        context.runAtEveryTick(() -> {
            if (finished.get()) return;
            long now = context.getWorld().getTime();
            for (MobEntity mob : trialMobs(context, anchor)) {
                mob.setAiDisabled(true);
                firstCombatTick.compareAndSet(-1, now);
            }
            if (firstCombatTick.get() < 0) return;
            long elapsed = now - firstCombatTick.get();
            if (elapsed < 119) context.assertFalse(impacted.test(player), "Adept hazard ignored its full warning");
            if (!impacted.test(player)) return;
            finished.set(true);
            RiftboundMod.TRIALS.cancel(player);
            context.waitAndRun(3, () -> {
                try {
                    context.assertEquals(0, trialMobs(context, anchor).size(), "Hazard encounter did not clean up");
                    context.assertEquals(0, count(player, convergenceItem("concordance")), "Cancelled hazard encounter gave rewards");
                } finally { removePlayer(context, player); }
                context.complete();
            });
        });
    }

    @GameTest(templateName = "riftbound_test:arena", batchId = "riftbound_convergence_ember", tickLimit = 500)
    public void emberLanesDealMagicDamageThroughFireResistance(TestContext context) {
        var first = survivalPlayerAtAnchor(context);
        var anchor = context.getAbsolutePos(new BlockPos(15, 1, 15));
        var second = createSurvivalServerPlayer(context);
        first.getAbilities().invulnerable = false;
        second.refreshPositionAndAngles(first.getX(), first.getY(), first.getZ(), 0, 0);
        // At every lane rotation, at least one of these perpendicular seven-block offsets is marked.
        for (var player : List.of(first, second)) {
            player.addStatusEffect(new net.minecraft.entity.effect.StatusEffectInstance(
                    net.minecraft.entity.effect.StatusEffects.FIRE_RESISTANCE, 500, 0));
        }
        selectTier(first, anchor, 1);
        PlayerProgress.complete(second, 1);
        RiftboundMod.TRIALS.ready(second);
        first.setStackInHand(Hand.OFF_HAND, new ItemStack(convergenceItem("attunement_core")));
        first.setStackInHand(Hand.MAIN_HAND, new ItemStack(RiftboundMod.ECHOES.get(Aspect.EMBER), 2));
        RiftboundMod.TRIALS.useAnchor(first, anchor);
        AtomicLong firstCombatTick = new AtomicLong(-1);
        AtomicBoolean finished = new AtomicBoolean();
        context.runAtEveryTick(() -> {
            if (finished.get()) return;
            long now = context.getWorld().getTime();
            // Other modules' tests can leave ordinary mobs in the shared test world.
            // Isolate this damage assertion from their AI as well as trial enemy attacks.
            context.getWorld().getEntitiesByType(TypeFilter.instanceOf(MobEntity.class), mob ->
                    mob.squaredDistanceTo(anchor.toCenterPos()) < 40 * 40).forEach(mob -> mob.setAiDisabled(true));
            for (MobEntity mob : trialMobs(context, anchor)) {
                mob.setAiDisabled(true);
                if (firstCombatTick.compareAndSet(-1, now)) {
                    // Position after the first wave is frozen so a newly spawned husk
                    // cannot take a melee swing before the test's first AI-disable tick.
                    first.refreshPositionAndAngles(anchor.getX() + 7.5, anchor.getY(), anchor.getZ() + .5, 0, 0);
                    second.refreshPositionAndAngles(anchor.getX() + .5, anchor.getY(), anchor.getZ() + 7.5, 0, 0);
                }
            }
            if (firstCombatTick.get() < 0) return;
            float health = first.getHealth() + second.getHealth();
            long elapsed = now - firstCombatTick.get();
            if (elapsed < 119) context.assertTrue(health == 40, "Ember damaged players before its full warning");
            if (health == 40) return;
            finished.set(true);
            context.assertTrue(health == 37 || health == 34, "Adept Ember pulse did not deal exactly three HP per marked participant");
            context.assertTrue(first.hasStatusEffect(net.minecraft.entity.effect.StatusEffects.FIRE_RESISTANCE),
                    "Test lost Fire Resistance before the impact");
            RiftboundMod.TRIALS.cancel(first);
            RiftboundMod.TRIALS.cancel(second);
            context.waitAndRun(3, () -> {
                try {
                    context.assertEquals(0, trialMobs(context, anchor).size(), "Ember party did not clean up after withdrawal");
                } finally { removePlayer(context, first); removePlayer(context, second); }
                context.complete();
            });
        });
    }

    private static void selectTier(ServerPlayerEntity player, BlockPos anchor, int ordinal) {
        PlayerProgress.complete(player, ordinal);
        player.setStackInHand(Hand.MAIN_HAND, ItemStack.EMPTY);
        player.setSneaking(true);
        for (int i = 0; i < ordinal; i++) RiftboundMod.TRIALS.useAnchor(player, anchor);
        player.setSneaking(false);
    }

    private static ServerPlayerEntity survivalPlayerAtAnchor(TestContext context) {
        var world = context.getWorld();
        world.getServer().setDifficulty(Difficulty.NORMAL, true);
        context.setBlockState(new BlockPos(15, 1, 15), RiftboundMod.ANCHOR);
        var player = createSurvivalServerPlayer(context);
        player.getAbilities().invulnerable = true; // The test damages enemies, never the player.
        var anchor = context.getAbsolutePos(new BlockPos(15, 1, 15));
        player.refreshPositionAndAngles(anchor.getX() + .5, anchor.getY() + 1, anchor.getZ() + .5, 0, 0);
        return player;
    }

    private static List<? extends MobEntity> trialMobs(TestContext context, BlockPos anchor) {
        return context.getWorld().getEntitiesByType(TypeFilter.instanceOf(MobEntity.class), entity ->
                entity.getCommandTags().contains(RiftboundMod.TRIAL_MOB_TAG)
                        && entity.squaredDistanceTo(anchor.toCenterPos()) < 40 * 40);
    }

    private static int count(ServerPlayerEntity player, Item item) {
        int count = 0;
        for (int slot = 0; slot < player.getInventory().size(); slot++) {
            var stack = player.getInventory().getStack(slot);
            if (stack.isOf(item)) count += stack.getCount();
        }
        return count;
    }

    private static ServerPlayerEntity createSurvivalServerPlayer(TestContext context) {
        // Vanilla's deprecated creative mock hard-codes isCreative() to true even after
        // changeGameMode. Use a real server player with an in-memory network connection.
        var id = UUID.randomUUID();
        var profile = new GameProfile(id, "rift-" + id.toString().substring(0, 8));
        var data = ConnectedClientData.createDefault(profile, false);
        var world = context.getWorld();
        var player = new ServerPlayerEntity(world.getServer(), world, profile, data.syncedOptions());
        var connection = new ClientConnection(NetworkSide.SERVERBOUND);
        var channel = new EmbeddedChannel(connection);
        TEST_CONNECTIONS.put(id, channel);
        world.getServer().getPlayerManager().onPlayerConnect(connection, player, data);
        player.changeGameMode(GameMode.SURVIVAL);
        context.assertFalse(player.isCreative(), "Test fixture must be an actual survival player");
        // EmbeddedChannel is not registered in ServerNetworkIo's connection list. Real
        // connections call playerTick through their network handler; supply that missing
        // callback so status durations, movement and other living-player state advance.
        context.runAtEveryTick(() -> {
            if (!player.isRemoved()) player.playerTick();
        });
        return player;
    }

    private static void removePlayer(TestContext context, ServerPlayerEntity player) {
        context.getWorld().getServer().getPlayerManager().remove(player);
        player.discard();
        var channel = TEST_CONNECTIONS.remove(player.getUuid());
        if (channel != null) channel.finishAndReleaseAll();
    }
}
