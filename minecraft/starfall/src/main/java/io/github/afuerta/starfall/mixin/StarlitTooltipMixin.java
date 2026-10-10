package io.github.afuerta.starfall.mixin;

import io.github.afuerta.starfall.registry.ModBlocks;
import io.github.afuerta.starfall.registry.ModTags;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.item.tooltip.TooltipType;
import net.minecraft.text.Text;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;
import java.util.List;

/** Shared item tooltip hook without loading any client-only class on a dedicated server. */
@Mixin(Item.class)
public abstract class StarlitTooltipMixin {
    @Inject(method = "appendTooltip", at = @At("TAIL"))
    private void starfall$tooltip(ItemStack stack, Item.TooltipContext context, List<Text> tooltip,
                                 TooltipType type, CallbackInfo callback) {
        if (stack.isIn(ModTags.STARLIT_TOOLS)) tooltip.add(Text.translatable("tooltip.starfall.starlit"));
        if (stack.isOf(ModBlocks.FALLEN_STAR.asItem())) tooltip.add(Text.translatable("tooltip.starfall.fallen_star"));
    }
}
