package io.github.afuerta.starfall.event;

import io.github.afuerta.starfall.Starfall;
import io.github.afuerta.starfall.StarfallConfig;
import io.github.afuerta.starfall.registry.ModBlocks;
import net.minecraft.block.Block;
import net.minecraft.block.BlockState;
import net.minecraft.block.Blocks;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.damage.DamageSource;
import net.minecraft.entity.damage.DamageType;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.registry.RegistryKey;
import net.minecraft.registry.RegistryKeys;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.sound.SoundCategory;
import net.minecraft.sound.SoundEvents;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.Box;
import net.minecraft.util.math.random.Random;
import java.util.Set;

/** Atomic conservative crater creation: reject the whole footprint before changing any block. */
public final class StarImpact {
    public static final RegistryKey<DamageType> FALLING_STAR_DAMAGE = RegistryKey.of(
            RegistryKeys.DAMAGE_TYPE, Starfall.id("falling_star"));
    public static final float IMPACT_DAMAGE = 6;
    // Deliberately exclude logs/leaves, cobble, bricks, farmland, ores, fluids and every modded block.
    private static final Set<Block> NATURAL = Set.of(Blocks.GRASS_BLOCK, Blocks.DIRT, Blocks.COARSE_DIRT,
            Blocks.ROOTED_DIRT, Blocks.MUD, Blocks.STONE, Blocks.DEEPSLATE, Blocks.TUFF, Blocks.GRAVEL,
            Blocks.SAND, Blocks.RED_SAND, Blocks.CLAY, Blocks.ANDESITE, Blocks.DIORITE, Blocks.GRANITE,
            Blocks.SNOW_BLOCK, Blocks.SNOW, Blocks.SHORT_GRASS, Blocks.TALL_GRASS, Blocks.FERN,
            Blocks.LARGE_FERN, Blocks.DEAD_BUSH, Blocks.PODZOL, Blocks.MYCELIUM);
    public static int rollRadius(Random random) {
        var config = StarfallConfig.INSTANCE.craters;
        return config.enabled ? Math.min(2, config.max_radius) + random.nextInt(
                config.max_radius - Math.min(2, config.max_radius) + 1) : 0;
    }
    public static boolean canReplace(ServerWorld world, BlockPos pos) {
        if (!world.isInBuildLimit(pos) || !world.getWorldBorder().contains(pos) || !world.isChunkLoaded(pos.getX() >> 4, pos.getZ() >> 4)) return false;
        BlockState state = world.getBlockState(pos);
        return !ProtectedTerrain.get(world).isProtected(pos) && !state.hasBlockEntity()
                && state.getFluidState().isEmpty() && (state.isAir() || NATURAL.contains(state.getBlock()));
    }
    /** Returns false for unloaded, protected or constructed terrain. No chunk is force-loaded. */
    public static boolean canImpact(ServerWorld world, BlockPos ground, int radius) {
        if (radius < 0 || radius > 5) return false;
        int scan = Math.max(2, radius);
        int depth = depthAt(0, radius);
        for (int dx = -scan; dx <= scan; dx++) {
            for (int dz = -scan; dz <= scan; dz++) {
                for (int dy = -depth - 1; dy <= 3; dy++) {
                    if (!canReplace(world, ground.add(dx, dy, dz))) return false;
                }
            }
        }
        var state = world.getBlockState(ground);
        return NATURAL.contains(state.getBlock()) && !state.isReplaceable();
    }
    /** Null means the safe preflight rejected the impact, with no terrain or entity damage. */
    public static BlockPos impact(ServerWorld world, BlockPos ground, int radius) {
        if (!canImpact(world, ground, radius)) return null;
        BlockPos starPos = radius == 0 ? ground.up() : ground.down(depthAt(0, radius) - 1);
        if (radius > 0) {
            for (int dx = -radius; dx <= radius; dx++) {
                for (int dz = -radius; dz <= radius; dz++) {
                    double distance = Math.sqrt(dx * dx + dz * dz);
                    if (distance > radius + .3) continue;
                    int depth = depthAt(distance, radius);
                    for (int dy = 3; dy > -depth; dy--) {
                        world.setBlockState(ground.add(dx, dy, dz), Blocks.AIR.getDefaultState(), Block.NOTIFY_ALL);
                    }
                    Block floor = world.random.nextFloat() < (distance < radius * .5 ? .35F : .15F)
                            ? ModBlocks.STARSTONE_ORE : ModBlocks.STARSTONE;
                    world.setBlockState(ground.add(dx, -depth, dz), floor.getDefaultState(), Block.NOTIFY_ALL);
                }
            }
        }
        world.setBlockState(starPos, ModBlocks.FALLEN_STAR.getDefaultState(), Block.NOTIFY_ALL);
        DamageSource source = new DamageSource(world.getRegistryManager().get(RegistryKeys.DAMAGE_TYPE)
                .entryOf(FALLING_STAR_DAMAGE), starPos.toCenterPos());
        for (LivingEntity entity : world.getEntitiesByClass(LivingEntity.class, new Box(starPos).expand(radius + 1.5),
                entity -> true)) entity.damage(source, IMPACT_DAMAGE);
        world.spawnParticles(ParticleTypes.EXPLOSION_EMITTER, starPos.getX() + .5, starPos.getY() + .5,
                starPos.getZ() + .5, 1, 0, 0, 0, 0);
        world.spawnParticles(ParticleTypes.FIREWORK, starPos.getX() + .5, starPos.getY() + 1,
                starPos.getZ() + .5, 60, 1.5, 1, 1.5, .15);
        world.playSound(null, starPos, SoundEvents.ENTITY_LIGHTNING_BOLT_IMPACT, SoundCategory.WEATHER, 3, 1.6F);
        return starPos;
    }
    private static int depthAt(double distance, int radius) {
        return Math.max(0, (int) Math.round((radius - distance) * .75));
    }
    private StarImpact() {}
}
