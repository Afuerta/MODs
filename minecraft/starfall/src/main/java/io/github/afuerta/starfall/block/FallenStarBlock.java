package io.github.afuerta.starfall.block;

import com.mojang.serialization.MapCodec;
import io.github.afuerta.starfall.event.StarImpactData;
import net.minecraft.block.Block;
import net.minecraft.block.BlockState;
import net.minecraft.entity.Entity;
import net.minecraft.entity.LivingEntity;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.random.Random;
import net.minecraft.world.World;

/** Glowing crater heart: sneak across safely; mine it for fortune-aware loot or silk-touch it. */
public final class FallenStarBlock extends Block {
    public static final MapCodec<FallenStarBlock> CODEC = createCodec(FallenStarBlock::new);
    public FallenStarBlock(Settings settings) { super(settings); }
    @Override protected MapCodec<? extends Block> getCodec() { return CODEC; }
    @Override protected void onStateReplaced(BlockState state, World world, BlockPos pos, BlockState newState, boolean moved) {
        if (world instanceof ServerWorld server && !newState.isOf(this)) StarImpactData.get(server).remove(pos);
        super.onStateReplaced(state, world, pos, newState, moved);
    }
    @Override public void onSteppedOn(World world, BlockPos pos, BlockState state, Entity entity) {
        if (!world.isClient && !entity.isSneaking() && entity instanceof LivingEntity) {
            entity.damage(world.getDamageSources().hotFloor(), 1);
        }
        super.onSteppedOn(world, pos, state, entity);
    }
    @Override public void randomDisplayTick(BlockState state, World world, BlockPos pos, Random random) {
        world.addParticle(ParticleTypes.END_ROD, pos.getX() + random.nextDouble(), pos.getY() + 1.1,
                pos.getZ() + random.nextDouble(), 0, .025, 0);
    }
}
