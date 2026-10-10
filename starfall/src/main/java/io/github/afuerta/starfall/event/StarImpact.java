package io.github.afuerta.starfall.event;

import io.github.afuerta.starfall.Starfall;
import io.github.afuerta.starfall.StarfallConfig;
import io.github.afuerta.starfall.registry.ModBlocks;
import net.minecraft.core.BlockPos;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.core.registries.Registries;
import net.minecraft.resources.ResourceKey;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.util.Mth;
import net.minecraft.util.RandomSource;
import net.minecraft.world.damagesource.DamageSource;
import net.minecraft.world.damagesource.DamageType;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.Blocks;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.phys.AABB;
import net.minecraft.world.phys.Vec3;

/**
 * What happens when a star hits the ground: a bowl-shaped crater lined with starstone (and some
 * starstone ore), a fallen star at the centre, an explosion of light and a damaging shockwave.
 */
public final class StarImpact {
    public static final ResourceKey<DamageType> FALLING_STAR_DAMAGE =
            ResourceKey.create(Registries.DAMAGE_TYPE, Starfall.id("falling_star"));
    public static final float IMPACT_DAMAGE = 6.0F;

    /** Picks a crater radius from the config (0 = no crater). */
    public static int rollRadius(RandomSource random) {
        if (!StarfallConfig.CRATERS_ENABLED.get()) {
            return 0;
        }
        int max = StarfallConfig.CRATER_RADIUS.get();
        return Mth.nextInt(random, Math.min(2, max), max);
    }

    /**
     * Creates an impact on top of {@code ground} (the surface block).
     *
     * @param radius crater radius; 0 places the star on the surface without carving
     * @return position of the placed fallen star
     */
    public static BlockPos impact(ServerLevel level, BlockPos ground, int radius) {
        RandomSource random = level.random;
        BlockPos starPos;
        if (radius > 0) {
            carveCrater(level, ground, radius, random);
            starPos = ground.below(depthAt(0.0, radius) - 1);
            BlockPos under = starPos.below();
            if (level.getBlockState(under).isAir() && canReplace(level, under)) {
                level.setBlock(under, ModBlocks.STARSTONE.get().defaultBlockState(), Block.UPDATE_ALL);
            }
        } else {
            starPos = ground.above();
        }
        if (canReplace(level, starPos)) {
            level.setBlock(starPos, ModBlocks.FALLEN_STAR.get().defaultBlockState(), Block.UPDATE_ALL);
        }
        shockwave(level, starPos, radius);
        effects(level, starPos);
        return starPos;
    }

    private static void carveCrater(ServerLevel level, BlockPos ground, int radius, RandomSource random) {
        for (int dx = -radius; dx <= radius; dx++) {
            for (int dz = -radius; dz <= radius; dz++) {
                double dist = Math.sqrt(dx * dx + dz * dz);
                if (dist > radius + 0.3) {
                    continue;
                }
                int depth = depthAt(dist, radius);
                for (int dy = 3; dy > -depth; dy--) {
                    BlockPos pos = ground.offset(dx, dy, dz);
                    if (!level.getBlockState(pos).isAir() && canReplace(level, pos)) {
                        level.setBlock(pos, Blocks.AIR.defaultBlockState(), Block.UPDATE_ALL);
                    }
                }
                BlockPos floor = ground.offset(dx, -depth, dz);
                BlockState lining = liningFor(random, dist / radius);
                if (lining != null && canReplace(level, floor)) {
                    level.setBlock(floor, lining, Block.UPDATE_ALL);
                }
            }
        }
    }

    /** Crater depth at a horizontal distance from the centre: deepest in the middle. */
    static int depthAt(double dist, int radius) {
        return Math.max(0, (int) Math.round((radius - dist) * 0.75));
    }

    private static BlockState liningFor(RandomSource random, double normalizedDistance) {
        float roll = random.nextFloat();
        BlockState ore = ModBlocks.STARSTONE_ORE.get().defaultBlockState();
        BlockState stone = ModBlocks.STARSTONE.get().defaultBlockState();
        if (normalizedDistance < 0.5) {
            return roll < 0.35F ? ore : stone;
        }
        if (normalizedDistance < 0.9) {
            return roll < 0.15F ? ore : roll < 0.8F ? stone : null;
        }
        return roll < 0.5F ? stone : null;
    }

    /** Never touch unloaded chunks, unbreakable blocks (bedrock...) or block entities (chests...). */
    private static boolean canReplace(ServerLevel level, BlockPos pos) {
        if (level.isOutsideBuildHeight(pos) || !level.isLoaded(pos)) {
            return false;
        }
        BlockState state = level.getBlockState(pos);
        if (state.isAir()) {
            return true;
        }
        if (!state.getFluidState().isEmpty()) {
            return false; // leave water and lava alone so crater rims don't flood
        }
        return !state.hasBlockEntity() && state.getDestroySpeed(level, pos) >= 0.0F;
    }

    private static void shockwave(ServerLevel level, BlockPos center, int radius) {
        // Giving the source a position makes knockback push mobs away from the crater.
        DamageSource source = new DamageSource(
                level.registryAccess().registryOrThrow(Registries.DAMAGE_TYPE).getHolderOrThrow(FALLING_STAR_DAMAGE),
                Vec3.atCenterOf(center));
        AABB area = new AABB(center).inflate(radius + 1.5);
        for (LivingEntity entity : level.getEntitiesOfClass(LivingEntity.class, area)) {
            entity.hurt(source, IMPACT_DAMAGE);
        }
    }

    private static void effects(ServerLevel level, BlockPos pos) {
        double x = pos.getX() + 0.5;
        double y = pos.getY() + 0.5;
        double z = pos.getZ() + 0.5;
        level.sendParticles(ParticleTypes.EXPLOSION_EMITTER, x, y, z, 1, 0.0, 0.0, 0.0, 0.0);
        level.sendParticles(ParticleTypes.FIREWORK, x, y + 0.5, z, 60, 1.5, 1.0, 1.5, 0.15);
        level.sendParticles(ParticleTypes.END_ROD, x, y + 0.5, z, 40, 2.0, 1.5, 2.0, 0.05);
        level.playSound(null, pos, SoundEvents.LIGHTNING_BOLT_IMPACT, SoundSource.WEATHER, 3.0F, 1.6F);
        level.playSound(null, pos, SoundEvents.FIREWORK_ROCKET_LARGE_BLAST, SoundSource.WEATHER, 4.0F, 0.7F);
    }

    private StarImpact() {
    }
}
