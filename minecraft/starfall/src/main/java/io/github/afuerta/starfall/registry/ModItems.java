package io.github.afuerta.starfall.registry;

import io.github.afuerta.starfall.Starfall;
import io.github.afuerta.starfall.item.StardustItem;
import io.github.afuerta.starfall.item.WishingStarItem;
import net.minecraft.item.AxeItem;
import net.minecraft.item.BlockItem;
import net.minecraft.item.HoeItem;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.item.MiningToolItem;
import net.minecraft.item.PickaxeItem;
import net.minecraft.item.ShovelItem;
import net.minecraft.item.SwordItem;
import net.minecraft.item.tooltip.TooltipType;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.text.Text;
import net.minecraft.util.Rarity;
import java.util.ArrayList;
import java.util.List;

/** Original registry IDs and block items; every tool retains vanilla interaction behavior. */
public final class ModItems {
    public static final List<Item> ALL = new ArrayList<>();
    public static final Item STAR_SHARD = item("star_shard", new Item(new Item.Settings()));
    public static final Item STARDUST = item("stardust", new StardustItem(new Item.Settings()));
    public static final Item STARSTEEL_INGOT = item("starsteel_ingot", new Item(new Item.Settings()));
    public static final Item WISHING_STAR = item("wishing_star", new WishingStarItem(
            new Item.Settings().maxCount(16).rarity(Rarity.RARE)));
    public static final SwordItem STARSTEEL_SWORD = item("starsteel_sword", new SwordItem(ModTiers.STARSTEEL,
            new Item.Settings().attributeModifiers(SwordItem.createAttributeModifiers(ModTiers.STARSTEEL, 3, -2.4F))));
    public static final PickaxeItem STARSTEEL_PICKAXE = item("starsteel_pickaxe", new PickaxeItem(ModTiers.STARSTEEL,
            new Item.Settings().attributeModifiers(MiningToolItem.createAttributeModifiers(ModTiers.STARSTEEL, 1, -2.8F))));
    public static final AxeItem STARSTEEL_AXE = item("starsteel_axe", new AxeItem(ModTiers.STARSTEEL,
            new Item.Settings().attributeModifiers(MiningToolItem.createAttributeModifiers(ModTiers.STARSTEEL, 5, -3F))));
    public static final ShovelItem STARSTEEL_SHOVEL = item("starsteel_shovel", new ShovelItem(ModTiers.STARSTEEL,
            new Item.Settings().attributeModifiers(MiningToolItem.createAttributeModifiers(ModTiers.STARSTEEL, 1.5F, -3F))));
    public static final HoeItem STARSTEEL_HOE = item("starsteel_hoe", new HoeItem(ModTiers.STARSTEEL,
            new Item.Settings().attributeModifiers(MiningToolItem.createAttributeModifiers(ModTiers.STARSTEEL, -3, 0))));
    static {
        ModBlocks.ALL.forEach((path, block) -> item(path, new BlockItem(block, new Item.Settings())));
    }
    private static <T extends Item> T item(String path, T item) {
        Registry.register(Registries.ITEM, Starfall.id(path), item);
        ALL.add(item);
        return item;
    }
    public static void initialize() {}
    private ModItems() {}
}
