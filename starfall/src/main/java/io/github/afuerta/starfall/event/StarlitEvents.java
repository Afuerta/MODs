package io.github.afuerta.starfall.event;

import io.github.afuerta.starfall.registry.ModTags;
import io.github.afuerta.starfall.util.StarfallUtil;
import net.minecraft.ChatFormatting;
import net.minecraft.network.chat.Component;
import net.minecraft.world.entity.player.Player;
import net.neoforged.neoforge.event.entity.living.LivingIncomingDamageEvent;
import net.neoforged.neoforge.event.entity.player.ItemTooltipEvent;
import net.neoforged.neoforge.event.entity.player.PlayerEvent;

/**
 * The "Starlit" bonus: tools in the {@code starfall:starlit_tools} tag mine 50% faster and hit 25%
 * harder while the wielder stands under a clear night sky.
 */
public final class StarlitEvents {
    public static final float MINING_BONUS = 1.5F;
    public static final float DAMAGE_BONUS = 1.25F;

    public static void onBreakSpeed(PlayerEvent.BreakSpeed event) {
        Player player = event.getEntity();
        if (player.getMainHandItem().is(ModTags.Items.STARLIT_TOOLS) && StarfallUtil.isStarlit(player)) {
            event.setNewSpeed(event.getNewSpeed() * MINING_BONUS);
        }
    }

    public static void onIncomingDamage(LivingIncomingDamageEvent event) {
        if (event.getSource().getDirectEntity() instanceof Player player
                && player.getMainHandItem().is(ModTags.Items.STARLIT_TOOLS)
                && StarfallUtil.isStarlit(player)) {
            event.setAmount(event.getAmount() * DAMAGE_BONUS);
        }
    }

    public static void onItemTooltip(ItemTooltipEvent event) {
        if (event.getItemStack().is(ModTags.Items.STARLIT_TOOLS)) {
            event.getToolTip().add(Component.translatable("tooltip.starfall.starlit").withStyle(ChatFormatting.AQUA));
        }
    }

    private StarlitEvents() {
    }
}
