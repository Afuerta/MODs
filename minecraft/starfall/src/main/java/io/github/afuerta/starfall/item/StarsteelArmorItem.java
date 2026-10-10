package io.github.afuerta.starfall.item;

import io.github.afuerta.starfall.registry.ModArmorMaterials;
import net.minecraft.item.ArmorItem;
import net.minecraft.item.ItemStack;
import net.minecraft.item.tooltip.TooltipType;
import net.minecraft.text.Text;
import java.util.List;

public final class StarsteelArmorItem extends ArmorItem {
    public StarsteelArmorItem(Type type) {
        super(ModArmorMaterials.STARSTEEL, type,
                new Settings().maxDamage(type.getMaxDamage(ModArmorMaterials.DURABILITY_MULTIPLIER)));
    }
    @Override public void appendTooltip(ItemStack stack, TooltipContext context, List<Text> tooltip, TooltipType type) {
        tooltip.add(Text.translatable("tooltip.starfall.starsteel_armor"));
        tooltip.add(Text.translatable("tooltip.starfall.starsteel_armor_conditions"));
    }
}
