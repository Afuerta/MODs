package io.github.afuerta.starfall.item;

import io.github.afuerta.starfall.event.StarChart;
import net.minecraft.component.DataComponentTypes;
import net.minecraft.component.type.LodestoneTrackerComponent;
import net.minecraft.entity.Entity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.CompassItem;
import net.minecraft.item.ItemStack;
import net.minecraft.item.ItemUsageContext;
import net.minecraft.item.tooltip.TooltipType;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.text.Text;
import net.minecraft.util.Hand;
import net.minecraft.util.ActionResult;
import net.minecraft.util.TypedActionResult;
import net.minecraft.util.math.GlobalPos;
import net.minecraft.world.World;
import java.util.List;
import java.util.Optional;

/** Uses vanilla's persisted compass target; tracked=false prevents lodestone-only invalidation. */
public final class StarCompassItem extends CompassItem {
    public StarCompassItem(Settings settings) { super(settings); }
    @Override public String getTranslationKey(ItemStack stack) { return getTranslationKey(); }
    @Override public ActionResult useOnBlock(ItemUsageContext context) { return ActionResult.PASS; }
    @Override public TypedActionResult<ItemStack> use(World world, PlayerEntity user, Hand hand) {
        ItemStack stack = user.getStackInHand(hand);
        if (user.getItemCooldownManager().isCoolingDown(this)) return TypedActionResult.fail(stack);
        if (world instanceof ServerWorld server) {
            var pos = updateTarget(stack, server, user);
            if (pos == null) user.sendMessage(Text.translatable("message.starfall.compass_empty"), true);
            else {
                boolean loaded = server.isChunkLoaded(pos.getX() >> 4, pos.getZ() >> 4);
                int distance = (int) Math.ceil(Math.sqrt(pos.getSquaredDistance(user.getBlockPos())));
                user.sendMessage(Text.translatable(loaded ? "message.starfall.compass_target"
                        : "message.starfall.compass_memory", pos.getX(), pos.getY(), pos.getZ(), distance), true);
            }
            user.getItemCooldownManager().set(this, 20);
        }
        return TypedActionResult.success(stack, world.isClient);
    }
    @Override public void inventoryTick(ItemStack stack, World world, Entity entity, int slot, boolean selected) {
        super.inventoryTick(stack, world, entity, slot, selected);
        // Held compasses refresh at most once each second. Stored stacks retain their last target.
        if (world instanceof ServerWorld server && entity instanceof PlayerEntity player
                && (selected || player.getOffHandStack() == stack) && Math.floorMod(player.age, 20) == 0) {
            updateTarget(stack, server, player);
        }
    }
    public static net.minecraft.util.math.BlockPos updateTarget(ItemStack stack, ServerWorld world, PlayerEntity player) {
        var target = StarChart.get(world).nearest(world, player.getBlockPos());
        var component = new LodestoneTrackerComponent(target == null ? Optional.empty()
                : Optional.of(GlobalPos.create(world.getRegistryKey(), target)), false);
        if (!component.equals(stack.get(DataComponentTypes.LODESTONE_TRACKER))) {
            stack.set(DataComponentTypes.LODESTONE_TRACKER, component);
        }
        return target;
    }
    @Override public void appendTooltip(ItemStack stack, TooltipContext context, List<Text> tooltip, TooltipType type) {
        tooltip.add(Text.translatable("tooltip.starfall.star_compass"));
        tooltip.add(Text.translatable("tooltip.starfall.star_compass_memory"));
    }
}
