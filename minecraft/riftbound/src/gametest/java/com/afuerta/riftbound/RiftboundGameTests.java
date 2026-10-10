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
        return player;
    }

    private static void removePlayer(TestContext context, ServerPlayerEntity player) {
        context.getWorld().getServer().getPlayerManager().remove(player);
        player.discard();
        var channel = TEST_CONNECTIONS.remove(player.getUuid());
        if (channel != null) channel.finishAndReleaseAll();
    }
}
