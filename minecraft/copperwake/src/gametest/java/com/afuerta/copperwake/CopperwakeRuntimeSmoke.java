package com.afuerta.copperwake;

import com.afuerta.copperwake.entity.ConstructRegistry;
import com.mojang.authlib.GameProfile;
import io.netty.channel.embedded.EmbeddedChannel;
import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerLifecycleEvents;
import net.minecraft.block.Blocks;
import net.minecraft.entity.ItemEntity;
import net.minecraft.item.ItemStack;
import net.minecraft.network.ClientConnection;
import net.minecraft.network.NetworkSide;
import net.minecraft.registry.RegistryKeys;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ConnectedClientData;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.util.ActionResult;
import net.minecraft.util.Hand;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.Vec3d;
import net.minecraft.world.Difficulty;
import net.minecraft.world.GameMode;
import net.minecraft.world.World;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

/** Optional real dedicated-server checks: vanilla GameTest intentionally drops custom dimensions. */
public final class CopperwakeRuntimeSmoke implements ModInitializer {
    @Override public void onInitialize() {
        if (!Boolean.getBoolean("copperwake.runtimeSmoke")) return;
        ServerLifecycleEvents.SERVER_STARTED.register(server -> {
            try {
                verify(server);
                Files.writeString(Path.of("copperwake-smoke.ok"), "Copperwake dedicated-server smoke: PASS\n");
                CopperwakeMod.LOGGER.info("COPPERWAKE_RUNTIME_SMOKE_PASS: dimension generation, travel, combat, boss reward");
            } catch (Throwable failure) {
                CopperwakeMod.LOGGER.error("COPPERWAKE_RUNTIME_SMOKE_FAILED", failure);
            } finally {
                server.stop(false);
            }
        });
    }

    private static void verify(MinecraftServer server) {
        var rustwild = server.getWorld(RustwildTravel.RUSTWILD);
        require(rustwild != null, "Actual dedicated server did not create the Rustwild");
        require(server.getWorldRegistryKeys().contains(RustwildTravel.RUSTWILD), "Missing custom world key");
        for (String id : List.of("oxide_flats", "verdigris_woods", "cinder_works")) {
            require(server.getRegistryManager().get(RegistryKeys.BIOME).containsId(CopperwakeMod.id(id)), "Missing biome " + id);
        }
        // FULL terrain generation executes decoration ordering and real feature codecs, not just parsing.
        rustwild.getChunk(0, 0);
        rustwild.getChunk(1, 0);
        rustwild.getChunk(0, 1);
        server.setDifficulty(Difficulty.NORMAL, true);
        BlockPos home = new BlockPos(8, 222, 8);
        pad(server.getOverworld(), home, 3);
        pad(rustwild, home, 15);

        var data = ConnectedClientData.createDefault(new GameProfile(UUID.randomUUID(), "copperwake-smoke"), false);
        var player = new ServerPlayerEntity(server, server.getOverworld(), data.gameProfile(), data.syncedOptions());
        var connection = new ClientConnection(NetworkSide.SERVERBOUND);
        var channel = new EmbeddedChannel(connection);
        server.getPlayerManager().onPlayerConnect(connection, player, data);
        player.changeGameMode(GameMode.SURVIVAL);
        player.getAbilities().invulnerable = true;
        player.getInventory().clear();
        try {
            require(player.teleport(server.getOverworld(), home.getX() + .5, home.getY(), home.getZ() + .5,
                    java.util.Set.of(), 0, 0), "Could not position smoke player");
            player.setStackInHand(Hand.MAIN_HAND, new ItemStack(ModContent.SURVEY_KEY));
            player.getInventory().insertStack(new ItemStack(ModContent.MEMORY_GLASS, 5));
            require(RustwildTravel.useKey(player), "Key failed to enter real Rustwild");
            require(player.getWorld().getRegistryKey().equals(RustwildTravel.RUSTWILD), "Key did not transfer dimensions");
            require(GuildProgress.get(player, "cw_home_x") == home.getX()
                    && GuildProgress.get(player, "cw_home_y") == home.getY(), "Key did not save departure position");
            require(player.getItemCooldownManager().isCoolingDown(ModContent.SURVEY_KEY), "Entry lacked cooldown");
            require(!RustwildTravel.returnHome(player), "Return ignored travel cooldown");

            GuildProgress.put(player, "cw_contracts", 12);
            player.setStackInHand(Hand.MAIN_HAND, new ItemStack(ModContent.FOREMAN_SEAL, 2));
            require(ModContent.FOREMAN_SEAL.use(rustwild, player, Hand.MAIN_HAND).getResult() == ActionResult.SUCCESS,
                    "Valid Artificer summon failed");
            require(player.getMainHandStack().getCount() == 1, "Summon did not consume exactly one seal");
            var bosses = rustwild.getEntitiesByType(ConstructRegistry.FOUNDRY_FOREMAN,
                    player.getBoundingBox().expand(96), entity -> entity.isAlive());
            require(bosses.size() == 1, "Expected exactly one summoned boss");
            player.getItemCooldownManager().remove(ModContent.FOREMAN_SEAL);
            require(ModContent.FOREMAN_SEAL.use(rustwild, player, Hand.MAIN_HAND).getResult() == ActionResult.FAIL,
                    "Duplicate nearby boss was allowed");
            require(player.getMainHandStack().getCount() == 1, "Rejected duplicate consumed seal");
            var boss = bosses.getFirst();
            boss.damage(rustwild.getDamageSources().playerAttack(player), 10000);
            require(rustwild.getEntitiesByClass(ItemEntity.class, boss.getBoundingBox().expand(8),
                    entity -> entity.getStack().isOf(ModContent.FOREMAN_HEART)).size() == 1,
                    "Boss did not drop its guaranteed heart");

            var sentry = ConstructRegistry.COIL_SENTRY.create(rustwild);
            require(sentry != null, "Sentry factory failed");
            sentry.refreshPositionAndAngles(player.getX() + 3, player.getY(), player.getZ(), 0, 0);
            require(rustwild.spawnEntity(sentry), "Sentry spawn failed");
            player.setStackInHand(Hand.MAIN_HAND, new ItemStack(ModContent.ARC_GAUNTLET));
            player.getInventory().insertStack(new ItemStack(ModContent.SCRAP, 2));
            float health = sentry.getHealth();
            require(ModContent.ARC_GAUNTLET.use(rustwild, player, Hand.MAIN_HAND).getResult() == ActionResult.SUCCESS,
                    "Fueled gauntlet failed against visible hostile");
            require(sentry.getHealth() < health, "Gauntlet caused no actual entity damage");
            require(SalvageGuild.count(player, ModContent.SCRAP) == 1, "Gauntlet fuel count incorrect");
            require(ModContent.ARC_GAUNTLET.use(rustwild, player, Hand.MAIN_HAND).getResult() == ActionResult.FAIL,
                    "Gauntlet cooldown bypassed");
            require(SalvageGuild.count(player, ModContent.SCRAP) == 1, "Cooldown consumed extra fuel");
            sentry.discard();
            boss.discard();

            // Emergency return works with no survey key anywhere in the inventory.
            SalvageGuild.consume(player, ModContent.SURVEY_KEY, SalvageGuild.count(player, ModContent.SURVEY_KEY));
            player.getItemCooldownManager().remove(ModContent.SURVEY_KEY);
            player.setVelocity(.5, -1, .5);
            player.fallDistance = 30;
            require(RustwildTravel.returnHome(player), "Keyless return failed");
            require(player.getWorld().getRegistryKey().equals(World.OVERWORLD), "Return did not leave Rustwild");
            require(player.getBlockPos().equals(home), "Return ignored saved home");
            require(player.getVelocity().equals(Vec3d.ZERO) && player.fallDistance == 0, "Return retained dangerous momentum");
            require(SalvageGuild.count(player, ModContent.MEMORY_GLASS) == 5, "Travel lost expedition loot");
            require(GuildProgress.completed(player) == 12, "Travel lost guild rank");
        } finally {
            server.getPlayerManager().remove(player);
            player.discard();
            channel.finishAndReleaseAll();
        }
    }

    private static void pad(ServerWorld world, BlockPos feet, int radius) {
        for (int x = -radius; x <= radius; x++) for (int z = -radius; z <= radius; z++) {
            BlockPos column = feet.add(x, 0, z);
            world.setBlockState(column.down(), Blocks.STONE.getDefaultState());
            for (int y = 0; y < 5; y++) world.setBlockState(column.up(y), Blocks.AIR.getDefaultState());
        }
    }
    private static void require(boolean valid, String message) {
        if (!valid) throw new AssertionError(message);
    }
}
