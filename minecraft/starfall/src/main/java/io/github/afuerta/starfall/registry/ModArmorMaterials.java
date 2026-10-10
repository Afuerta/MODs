package io.github.afuerta.starfall.registry;

import io.github.afuerta.starfall.Starfall;
import net.minecraft.item.ArmorItem;
import net.minecraft.item.ArmorMaterial;
import net.minecraft.recipe.Ingredient;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.registry.entry.RegistryEntry;
import net.minecraft.sound.SoundEvents;
import java.util.List;
import java.util.Map;

/** Nineteen armor points and strong enchantability with less durability and toughness than diamond. */
public final class ModArmorMaterials {
    public static final int DURABILITY_MULTIPLIER = 30;
    public static final RegistryEntry<ArmorMaterial> STARSTEEL = Registry.registerReference(
            Registries.ARMOR_MATERIAL, Starfall.id("starsteel"), new ArmorMaterial(
                    Map.of(ArmorItem.Type.HELMET, 3, ArmorItem.Type.CHESTPLATE, 7,
                            ArmorItem.Type.LEGGINGS, 6, ArmorItem.Type.BOOTS, 3),
                    18, SoundEvents.ITEM_ARMOR_EQUIP_IRON,
                    () -> Ingredient.ofItems(ModItems.STARSTEEL_INGOT),
                    List.of(new ArmorMaterial.Layer(Starfall.id("starsteel"))), 1F, 0F));
    private ModArmorMaterials() {}
}
