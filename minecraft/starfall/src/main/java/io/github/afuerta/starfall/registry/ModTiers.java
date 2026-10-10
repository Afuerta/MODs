package io.github.afuerta.starfall.registry;

import net.minecraft.block.Block;
import net.minecraft.item.ToolMaterial;
import net.minecraft.recipe.Ingredient;
import net.minecraft.registry.tag.BlockTags;
import net.minecraft.registry.tag.TagKey;

/** Starsteel trades diamond durability for stronger night-time performance. */
public enum ModTiers implements ToolMaterial {
    STARSTEEL;
    @Override public int getDurability() { return 1200; }
    @Override public float getMiningSpeedMultiplier() { return 8.5F; }
    @Override public float getAttackDamage() { return 3; }
    @Override public int getEnchantability() { return 18; }
    @Override public TagKey<Block> getInverseTag() { return BlockTags.INCORRECT_FOR_DIAMOND_TOOL; }
    @Override public Ingredient getRepairIngredient() { return Ingredient.ofItems(ModItems.STARSTEEL_INGOT); }
}
