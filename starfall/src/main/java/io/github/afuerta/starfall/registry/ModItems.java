package io.github.afuerta.starfall.registry;

import io.github.afuerta.starfall.Starfall;
import io.github.afuerta.starfall.item.FallenStarItem;
import io.github.afuerta.starfall.item.StardustItem;
import io.github.afuerta.starfall.item.WishingStarItem;
import net.minecraft.world.item.AxeItem;
import net.minecraft.world.item.BlockItem;
import net.minecraft.world.item.DiggerItem;
import net.minecraft.world.item.HoeItem;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.PickaxeItem;
import net.minecraft.world.item.Rarity;
import net.minecraft.world.item.ShovelItem;
import net.minecraft.world.item.SwordItem;
import net.minecraft.world.level.block.Block;
import net.neoforged.neoforge.registries.DeferredBlock;
import net.neoforged.neoforge.registries.DeferredItem;
import net.neoforged.neoforge.registries.DeferredRegister;

/**
 * Every item in the mod. The creative tab lists items in the order they are registered here.
 */
public final class ModItems {
    public static final DeferredRegister.Items ITEMS = DeferredRegister.createItems(Starfall.MOD_ID);

    // Materials
    public static final DeferredItem<Item> STAR_SHARD = ITEMS.register("star_shard",
            () -> new Item(new Item.Properties()));
    public static final DeferredItem<StardustItem> STARDUST = ITEMS.register("stardust",
            () -> new StardustItem(new Item.Properties()));
    public static final DeferredItem<Item> STARSTEEL_INGOT = ITEMS.register("starsteel_ingot",
            () -> new Item(new Item.Properties()));
    public static final DeferredItem<WishingStarItem> WISHING_STAR = ITEMS.register("wishing_star",
            () -> new WishingStarItem(new Item.Properties().stacksTo(16).rarity(Rarity.RARE)));

    // Tools
    public static final DeferredItem<SwordItem> STARSTEEL_SWORD = ITEMS.register("starsteel_sword",
            () -> new SwordItem(ModTiers.STARSTEEL, new Item.Properties()
                    .attributes(SwordItem.createAttributes(ModTiers.STARSTEEL, 3, -2.4F))));
    public static final DeferredItem<PickaxeItem> STARSTEEL_PICKAXE = ITEMS.register("starsteel_pickaxe",
            () -> new PickaxeItem(ModTiers.STARSTEEL, new Item.Properties()
                    .attributes(DiggerItem.createAttributes(ModTiers.STARSTEEL, 1.0F, -2.8F))));
    public static final DeferredItem<AxeItem> STARSTEEL_AXE = ITEMS.register("starsteel_axe",
            () -> new AxeItem(ModTiers.STARSTEEL, new Item.Properties()
                    .attributes(DiggerItem.createAttributes(ModTiers.STARSTEEL, 5.0F, -3.0F))));
    public static final DeferredItem<ShovelItem> STARSTEEL_SHOVEL = ITEMS.register("starsteel_shovel",
            () -> new ShovelItem(ModTiers.STARSTEEL, new Item.Properties()
                    .attributes(DiggerItem.createAttributes(ModTiers.STARSTEEL, 1.5F, -3.0F))));
    public static final DeferredItem<HoeItem> STARSTEEL_HOE = ITEMS.register("starsteel_hoe",
            () -> new HoeItem(ModTiers.STARSTEEL, new Item.Properties()
                    .attributes(DiggerItem.createAttributes(ModTiers.STARSTEEL, -3.0F, 0.0F))));

    // Block items
    public static final DeferredItem<FallenStarItem> FALLEN_STAR = ITEMS.register("fallen_star",
            () -> new FallenStarItem(ModBlocks.FALLEN_STAR.get(), new Item.Properties().rarity(Rarity.UNCOMMON)));
    public static final DeferredItem<BlockItem> STARSTONE = blockItem(ModBlocks.STARSTONE);
    public static final DeferredItem<BlockItem> STARSTONE_BRICKS = blockItem(ModBlocks.STARSTONE_BRICKS);
    public static final DeferredItem<BlockItem> STARSTONE_ORE = blockItem(ModBlocks.STARSTONE_ORE);
    public static final DeferredItem<BlockItem> STARSTEEL_BLOCK = blockItem(ModBlocks.STARSTEEL_BLOCK);
    public static final DeferredItem<BlockItem> STAR_LANTERN = blockItem(ModBlocks.STAR_LANTERN);

    private static DeferredItem<BlockItem> blockItem(DeferredBlock<? extends Block> block) {
        return ITEMS.register(block.getId().getPath(), () -> new BlockItem(block.get(), new Item.Properties()));
    }

    private ModItems() {
    }
}
