package io.github.afuerta.starfall.item;

import io.github.afuerta.starfall.event.StarImpactData;
import net.minecraft.component.DataComponentTypes;
import net.minecraft.component.type.LodestoneTrackerComponent;
import net.minecraft.entity.Entity;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.item.tooltip.TooltipType;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.text.Text;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.GlobalPos;
import net.minecraft.world.World;
import java.util.List;
import java.util.Optional;

/** A celestial compass whose target comes from impacts, never from right-clicking a lodestone. */
public final class StarCompassItem extends Item {
    private static final LodestoneTrackerComponent UNBOUND = new LodestoneTrackerComponent(Optional.empty(), false);

    public StarCompassItem(Settings settings) {
        // Keeping an empty tracker is intentional: the vanilla compass renderer spins instead of
        // falling back to world spawn. tracked=false avoids vanilla lodestone validation/chunk access.
        super(settings.component(DataComponentTypes.LODESTONE_TRACKER, UNBOUND));
    }

    @Override public void inventoryTick(ItemStack stack, World world, Entity entity, int slot, boolean selected) {
        if (!(world instanceof ServerWorld server)) return;
        LodestoneTrackerComponent tracker = stack.get(DataComponentTypes.LODESTONE_TRACKER);
        // A portal must immediately stop the previous dimension's signal, even between refresh ticks.
        if (tracker == null || tracker.tracked() || tracker.target()
                .filter(target -> !target.dimension().equals(world.getRegistryKey())).isPresent()) {
            stack.set(DataComponentTypes.LODESTONE_TRACKER, UNBOUND);
        }
        if (world.getTime() % 20 == 0) updateTarget(stack, server, entity.getBlockPos());
    }

    public static void updateTarget(ItemStack stack, ServerWorld world, BlockPos origin) {
        Optional<GlobalPos> target = StarImpactData.get(world).nearest(world, origin)
                .map(pos -> GlobalPos.create(world.getRegistryKey(), pos));
        LodestoneTrackerComponent next = new LodestoneTrackerComponent(target, false);
        // Avoid dirty inventory synchronization when the selected star has not changed.
        if (!next.equals(stack.get(DataComponentTypes.LODESTONE_TRACKER))) {
            stack.set(DataComponentTypes.LODESTONE_TRACKER, next);
        }
    }

    @Override public void appendTooltip(ItemStack stack, TooltipContext context, List<Text> tooltip, TooltipType type) {
        tooltip.add(Text.translatable("item.starfall.star_compass.tooltip"));
        LodestoneTrackerComponent tracker = stack.get(DataComponentTypes.LODESTONE_TRACKER);
        Optional<GlobalPos> target = tracker == null ? Optional.empty() : tracker.target();
        if (target.isPresent()) {
            BlockPos pos = target.get().pos();
            tooltip.add(Text.translatable("item.starfall.star_compass.target", pos.getX(), pos.getY(), pos.getZ()));
        } else {
            tooltip.add(Text.translatable("item.starfall.star_compass.unbound"));
        }
    }
}
