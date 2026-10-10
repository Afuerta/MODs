package io.github.afuerta.starfall.item;

import net.minecraft.block.BlockState;
import net.minecraft.block.Fertilizable;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.item.ItemUsageContext;
import net.minecraft.item.tooltip.TooltipType;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.text.Text;
import net.minecraft.util.ActionResult;
import net.minecraft.util.math.BlockPos;
import net.minecraft.world.World;
import java.util.List;

/** Two guaranteed growth pulses, consuming one dust only when a plant can grow. */
public final class StardustItem extends Item {
    public static final int GROWTH_PULSES = 2;
    public StardustItem(Settings settings) { super(settings); }
    @Override public ActionResult useOnBlock(ItemUsageContext context) {
        return applyStardust(context.getStack(), context.getWorld(), context.getBlockPos(),
                context.getPlayer() != null && context.getPlayer().isCreative())
                ? ActionResult.success(context.getWorld().isClient) : ActionResult.PASS;
    }
    public static boolean applyStardust(ItemStack stack, World world, BlockPos pos, boolean creative) {
        if (stack.isEmpty()) return false;
        BlockState state = world.getBlockState(pos);
        if (!(state.getBlock() instanceof Fertilizable plant) || !plant.isFertilizable(world, pos, state)) return false;
        if (world instanceof ServerWorld server) {
            for (int pulse = 0; pulse < GROWTH_PULSES; pulse++) {
                BlockState current = world.getBlockState(pos);
                if (current.getBlock() instanceof Fertilizable target && target.isFertilizable(world, pos, current)) {
                    target.grow(server, server.random, pos, current);
                }
            }
            server.syncWorldEvent(1505, pos, 15);
            server.spawnParticles(ParticleTypes.END_ROD, pos.getX() + .5, pos.getY() + .6, pos.getZ() + .5,
                    8, .3, .3, .3, .02);
            if (!creative) stack.decrement(1);
        }
        return true;
    }
    @Override public void appendTooltip(ItemStack stack, TooltipContext context, List<Text> tooltip, TooltipType type) {
        tooltip.add(Text.translatable("tooltip.starfall.stardust"));
    }
}
