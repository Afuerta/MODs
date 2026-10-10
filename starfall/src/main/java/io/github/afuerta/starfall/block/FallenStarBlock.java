package io.github.afuerta.starfall.block;

import com.mojang.serialization.MapCodec;
import net.minecraft.core.BlockPos;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.util.RandomSource;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.state.BlockState;

/**
 * The glowing star left at the bottom of a crater. Still hot: it burns anything that walks on it
 * (sneak to cross safely), shimmers with particles and drops star shards, stardust and sometimes a
 * Wishing Star when mined (see data/starfall/loot_table/blocks/fallen_star.json).
 */
public class FallenStarBlock extends Block {
    public static final MapCodec<FallenStarBlock> CODEC = simpleCodec(FallenStarBlock::new);

    public FallenStarBlock(Properties properties) {
        super(properties);
    }

    @Override
    protected MapCodec<? extends Block> codec() {
        return CODEC;
    }

    @Override
    public void stepOn(Level level, BlockPos pos, BlockState state, Entity entity) {
        if (!entity.isSteppingCarefully() && entity instanceof LivingEntity) {
            entity.hurt(level.damageSources().hotFloor(), 1.0F);
        }
        super.stepOn(level, pos, state, entity);
    }

    @Override
    public void animateTick(BlockState state, Level level, BlockPos pos, RandomSource random) {
        for (int i = 0; i < 2; i++) {
            double x = pos.getX() + random.nextDouble();
            double y = pos.getY() + 0.5 + random.nextDouble() * 0.7;
            double z = pos.getZ() + random.nextDouble();
            level.addParticle(ParticleTypes.END_ROD, x, y, z,
                    (random.nextDouble() - 0.5) * 0.02, 0.02 + random.nextDouble() * 0.03, (random.nextDouble() - 0.5) * 0.02);
        }
        if (random.nextInt(5) == 0) {
            level.addParticle(ParticleTypes.SMALL_FLAME, pos.getX() + random.nextDouble(), pos.getY() + 1.02,
                    pos.getZ() + random.nextDouble(), 0.0, 0.01, 0.0);
        }
    }
}
