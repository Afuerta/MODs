package com.afuerta.copperwake;

import net.minecraft.block.BlockState;
import net.minecraft.block.Blocks;
import net.minecraft.registry.RegistryKey;
import net.minecraft.registry.RegistryKeys;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.util.Formatting;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.Box;
import net.minecraft.world.Heightmap;
import net.minecraft.world.World;

/** Bounded, non-destructive travel. No portal platform overwrites player builds. */
final class RustwildTravel {
    static final RegistryKey<World> RUSTWILD = RegistryKey.of(RegistryKeys.WORLD, CopperwakeMod.id("rustwild"));

    static boolean useKey(ServerPlayerEntity player) {
        if (player.getWorld().getRegistryKey().equals(RUSTWILD)) return returnHome(player);
        if (!player.getWorld().getRegistryKey().equals(World.OVERWORLD)) {
            tell(player, "The Survey Key works from the Overworld or Rustwild.");
            return false;
        }
        if (!canTravel(player)) return false;
        var target = player.getServer().getWorld(RUSTWILD);
        if (target == null) { tell(player, "The Rustwild is unavailable. Check the server's data-pack errors."); return false; }
        BlockPos destination = findSafeSurface(target, player.getBlockPos());
        if (destination == null) {
            tell(player, "No safe landing nearby. Move at least 128 blocks in the Overworld and try again.");
            return false;
        }
        BlockPos origin = player.getBlockPos();
        if (!teleport(player, target, destination)) return false;
        GuildProgress.put(player, "cw_home_x", origin.getX());
        GuildProgress.put(player, "cw_home_y", origin.getY());
        GuildProgress.put(player, "cw_home_z", origin.getZ());
        GuildProgress.put(player, "cw_has_home", 1);
        SalvageGuild.say(player, "The Rustwild wakes. Find salvage, watch for constructs, and bring your discoveries home.", Formatting.GOLD);
        return true;
    }

    static boolean returnHome(ServerPlayerEntity player) {
        if (!player.getWorld().getRegistryKey().equals(RUSTWILD)) {
            tell(player, "You are already outside the Rustwild."); return false;
        }
        if (!canTravel(player)) return false;
        ServerWorld target = player.getServer().getOverworld();
        BlockPos home = GuildProgress.get(player, "cw_has_home") == 1
                ? new BlockPos(GuildProgress.get(player, "cw_home_x"), GuildProgress.get(player, "cw_home_y"), GuildProgress.get(player, "cw_home_z"))
                : target.getSpawnPos();
        target.getChunk(home);
        BlockPos destination = safe(target, home) ? home : findSafeSurface(target, home);
        if (destination == null) destination = findSafeSurface(target, target.getSpawnPos());
        if (destination == null) { tell(player, "No safe Overworld landing found. Clear space near world spawn and retry."); return false; }
        boolean success = teleport(player, target, destination);
        if (success) SalvageGuild.say(player, "Expedition complete. Your guild progress is saved; deliver salvage at a bench.", Formatting.AQUA);
        return success;
    }

    private static boolean canTravel(ServerPlayerEntity player) {
        if (!player.isAlive() || player.isSpectator() || player.hasVehicle()) {
            tell(player, "Dismount before opening a passage."); return false;
        }
        if (player.getItemCooldownManager().isCoolingDown(ModContent.SURVEY_KEY)) {
            tell(player, "The Survey Key is cooling down. Wait a few seconds."); return false;
        }
        return true;
    }
    private static boolean teleport(ServerPlayerEntity player, ServerWorld world, BlockPos pos) {
        boolean success = player.teleport(world, pos.getX() + 0.5, pos.getY(), pos.getZ() + 0.5,
                java.util.Set.of(), player.getYaw(), player.getPitch());
        if (success) {
            player.fallDistance = 0;
            player.setVelocity(0, 0, 0);
            player.getItemCooldownManager().set(ModContent.SURVEY_KEY, 200);
        }
        return success;
    }
    private static BlockPos findSafeSurface(ServerWorld world, BlockPos around) {
        // Nine rings * eight directions; a fixed maximum of 65 sampled columns.
        for (int radius = 0; radius <= 64; radius += 8) {
            for (int direction = 0; direction < (radius == 0 ? 1 : 8); direction++) {
                double angle = direction * Math.PI / 4;
                int x = around.getX() + (int) Math.round(Math.cos(angle) * radius);
                int z = around.getZ() + (int) Math.round(Math.sin(angle) * radius);
                BlockPos column = new BlockPos(x, world.getSeaLevel(), z);
                if (!world.getWorldBorder().contains(column)) continue;
                world.getChunk(column);
                BlockPos candidate = world.getTopPosition(Heightmap.Type.MOTION_BLOCKING_NO_LEAVES, column);
                if (safe(world, candidate)) return candidate;
            }
        }
        return null;
    }
    static boolean safe(ServerWorld world, BlockPos pos) {
        if (pos.getY() <= world.getBottomY() || pos.getY() + 2 >= world.getTopY() || !world.getWorldBorder().contains(pos)) return false;
        BlockState ground = world.getBlockState(pos.down());
        if (!ground.isSolidBlock(world, pos.down()) || dangerous(ground)) return false;
        if (!world.getFluidState(pos).isEmpty() || !world.getFluidState(pos.up()).isEmpty()) return false;
        if (dangerous(world.getBlockState(pos)) || dangerous(world.getBlockState(pos.up()))) return false;
        Box landing = new Box(pos.getX() + 0.15, pos.getY(), pos.getZ() + 0.15,
                pos.getX() + 0.85, pos.getY() + 1.85, pos.getZ() + 0.85);
        return world.getWorldBorder().contains(landing) && world.isSpaceEmpty(null, landing);
    }
    private static boolean dangerous(BlockState state) {
        return state.isOf(Blocks.MAGMA_BLOCK) || state.isOf(Blocks.CAMPFIRE) || state.isOf(Blocks.SOUL_CAMPFIRE)
                || state.isOf(Blocks.CACTUS) || state.isOf(Blocks.FIRE) || state.isOf(Blocks.SOUL_FIRE)
                || state.isOf(Blocks.POWDER_SNOW) || state.isOf(Blocks.SWEET_BERRY_BUSH);
    }
    private static void tell(ServerPlayerEntity player, String text) { SalvageGuild.say(player, text, Formatting.YELLOW); }
    private RustwildTravel() { }
}
