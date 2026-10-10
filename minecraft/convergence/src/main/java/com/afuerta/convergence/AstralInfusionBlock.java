package com.afuerta.convergence;

import com.mojang.serialization.MapCodec;
import net.minecraft.block.Block;
import net.minecraft.block.BlockRenderType;
import net.minecraft.block.BlockState;
import net.minecraft.block.BlockWithEntity;
import net.minecraft.block.entity.BlockEntity;
import net.minecraft.block.entity.BlockEntityTicker;
import net.minecraft.block.entity.BlockEntityType;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.state.StateManager;
import net.minecraft.state.property.BooleanProperty;
import net.minecraft.text.Text;
import net.minecraft.util.ActionResult;
import net.minecraft.util.ItemScatterer;
import net.minecraft.util.hit.BlockHitResult;
import net.minecraft.util.math.BlockPos;
import net.minecraft.world.World;

/** The vanilla 3x3 container screen is used, with server-authoritative restricted slots. */
public final class AstralInfusionBlock extends BlockWithEntity {
    public static final MapCodec<AstralInfusionBlock> CODEC = createCodec(AstralInfusionBlock::new);
    public static final BooleanProperty ACTIVE = BooleanProperty.of("active");
    public AstralInfusionBlock(Settings settings) {
        super(settings);
        setDefaultState(getStateManager().getDefaultState().with(ACTIVE, false));
    }
    @Override protected MapCodec<? extends BlockWithEntity> getCodec() { return CODEC; }
    @Override protected BlockRenderType getRenderType(BlockState state) { return BlockRenderType.MODEL; }
    @Override protected void appendProperties(StateManager.Builder<Block, BlockState> builder) { builder.add(ACTIVE); }
    @Override public BlockEntity createBlockEntity(BlockPos pos, BlockState state) { return new AstralInfusionBlockEntity(pos, state); }
    @Override public <T extends BlockEntity> BlockEntityTicker<T> getTicker(World world, BlockState state, BlockEntityType<T> type) {
        return world.isClient ? null : validateTicker(type, ConvergenceMod.INFUSION_ENTITY, AstralInfusionBlockEntity::tick);
    }
    @Override protected ActionResult onUse(BlockState state, World world, BlockPos pos, PlayerEntity player, BlockHitResult hit) {
        if (!world.isClient && world.getBlockEntity(pos) instanceof AstralInfusionBlockEntity station) {
            if (player.isSneaking()) station.showRecipes(player);
            else {
                player.sendMessage(Text.translatable("message.convergence.infusion.layout"), false);
                player.sendMessage(Text.translatable("message.convergence.infusion.hint"), false);
                player.openHandledScreen(station);
            }
        }
        return ActionResult.SUCCESS;
    }
    @Override protected void onStateReplaced(BlockState state, World world, BlockPos pos, BlockState newState, boolean moved) {
        if (!state.isOf(newState.getBlock())) {
            if (world.getBlockEntity(pos) instanceof AstralInfusionBlockEntity station) {
                ItemScatterer.spawn(world, pos, station);
                world.updateComparators(pos, this);
            }
            super.onStateReplaced(state, world, pos, newState, moved);
        }
    }
}
