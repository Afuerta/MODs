package io.github.afuerta.starfall.item;

import java.util.List;
import net.minecraft.ChatFormatting;
import net.minecraft.core.BlockPos;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.TooltipFlag;
import net.minecraft.world.item.context.UseOnContext;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.BonemealableBlock;
import net.minecraft.world.level.block.state.BlockState;

/**
 * Stardust: a crafting material that doubles as super bone meal. One use applies two growth
 * pulses and always succeeds.
 */
public class StardustItem extends Item {
    /** Level event id for the vanilla "bone meal used" particles and sound. */
    private static final int PLANT_GROWTH_EVENT = 1505;
    public static final int GROWTH_PULSES = 2;

    public StardustItem(Properties properties) {
        super(properties);
    }

    @Override
    public InteractionResult useOn(UseOnContext context) {
        Level level = context.getLevel();
        BlockPos pos = context.getClickedPos();
        if (applyStardust(context.getItemInHand(), level, pos)) {
            if (!level.isClientSide()) {
                level.levelEvent(PLANT_GROWTH_EVENT, pos, 15);
            }
            return InteractionResult.sidedSuccess(level.isClientSide());
        }
        return InteractionResult.PASS;
    }

    /**
     * Tries to grow the plant at {@code pos}. On the server this grows the plant and uses up one
     * stardust from {@code stack}.
     *
     * @return true if the block can be grown (on both client and server)
     */
    public static boolean applyStardust(ItemStack stack, Level level, BlockPos pos) {
        BlockState state = level.getBlockState(pos);
        if (!(state.getBlock() instanceof BonemealableBlock growable) || !growable.isValidBonemealTarget(level, pos, state)) {
            return false;
        }
        if (level instanceof ServerLevel serverLevel) {
            for (int i = 0; i < GROWTH_PULSES; i++) {
                BlockState current = serverLevel.getBlockState(pos);
                if (current.getBlock() instanceof BonemealableBlock plant && plant.isValidBonemealTarget(serverLevel, pos, current)) {
                    plant.performBonemeal(serverLevel, serverLevel.random, pos, current);
                }
            }
            serverLevel.sendParticles(ParticleTypes.END_ROD, pos.getX() + 0.5, pos.getY() + 0.6, pos.getZ() + 0.5,
                    8, 0.3, 0.3, 0.3, 0.02);
            stack.shrink(1);
        }
        return true;
    }

    @Override
    public void appendHoverText(ItemStack stack, TooltipContext context, List<Component> tooltip, TooltipFlag flag) {
        tooltip.add(Component.translatable("tooltip.starfall.stardust").withStyle(ChatFormatting.GRAY));
        super.appendHoverText(stack, context, tooltip, flag);
    }
}
