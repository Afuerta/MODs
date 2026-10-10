package io.github.afuerta.starfall.item;

import io.github.afuerta.starfall.registry.ModArmorMaterials;
import net.minecraft.item.ArmorItem;
import net.minecraft.item.ItemStack;
import net.minecraft.item.tooltip.TooltipType;
import net.minecraft.text.Text;
import net.minecraft.util.Formatting;
import java.util.List;

/** Vanilla armor, repair and equipping behavior with a shared explanation of the full-set bonus. */
public final class StarsteelArmorItem extends ArmorItem {
    public StarsteelArmorItem(Type type, Settings settings) {
        super(ModArmorMaterials.STARSTEEL, type,
                settings.maxDamage(type.getMaxDamage(ModArmorMaterials.STARSTEEL_DURABILITY_MULTIPLIER)));
    }

    @Override public void appendTooltip(ItemStack stack, TooltipContext context, List<Text> tooltip, TooltipType type) {
        super.appendTooltip(stack, context, tooltip, type);
        tooltip.add(Text.translatable("item.starfall.starsteel_armor.bonus").formatted(Formatting.AQUA));
        tooltip.add(Text.translatable("item.starfall.starsteel_armor.tooltip").formatted(Formatting.GRAY));
    }
}
