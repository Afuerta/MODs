package com.afuerta.copperwake;

import net.fabricmc.fabric.api.itemgroup.v1.FabricItemGroup;
import net.minecraft.block.AbstractBlock;
import net.minecraft.block.Block;
import net.minecraft.block.BlockState;
import net.minecraft.block.ShapeContext;
import net.minecraft.item.BlockItem;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.item.tooltip.TooltipType;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.sound.BlockSoundGroup;
import net.minecraft.text.Text;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.shape.VoxelShape;
import net.minecraft.util.shape.VoxelShapes;
import net.minecraft.world.BlockView;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class ModContent {
    private static final Map<String, Item> ITEMS = new LinkedHashMap<>();
    public static final Item SCRAP = item("scrap", 64);
    public static final Item BRASS_GEAR = item("brass_gear", 64);
    public static final Item MEMORY_GLASS = item("memory_glass", 64);
    public static final Item CHARGED_CORE = item("charged_core", 64);
    public static final Item FOREMAN_HEART = item("foreman_heart", 16);
    public static final Item FIELD_JOURNAL = gadget("field_journal", GadgetItem.Action.JOURNAL, 1);
    public static final Item SURVEY_KEY = gadget("survey_key", GadgetItem.Action.TRAVEL, 1);
    public static final Item ARC_GAUNTLET = gadget("arc_gauntlet", GadgetItem.Action.ARC, 1);
    public static final Item SPRING_BOOTS = gadget("spring_boots", GadgetItem.Action.SPRING, 1);
    public static final Item PATCH_KIT = gadget("patch_kit", GadgetItem.Action.HEAL, 16);
    public static final Item FOREMAN_SEAL = gadget("foreman_seal", GadgetItem.Action.SUMMON, 16);
    public static final Block SALVAGE_BENCH = block("salvage_bench", new Block(AbstractBlock.Settings.create()
            .strength(3.0f).nonOpaque().sounds(BlockSoundGroup.COPPER)) {
        private final VoxelShape shape = VoxelShapes.union(
                Block.createCuboidShape(0, 9, 0, 16, 12, 16),
                Block.createCuboidShape(1, 0, 1, 4, 9, 4),
                Block.createCuboidShape(12, 0, 1, 15, 9, 4),
                Block.createCuboidShape(1, 0, 12, 4, 9, 15),
                Block.createCuboidShape(12, 0, 12, 15, 9, 15));
        @Override public VoxelShape getOutlineShape(BlockState state, BlockView world, BlockPos pos, ShapeContext context) {
            return shape;
        }
    });
    public static final Block RIVETED_COPPER = block("riveted_copper", new Block(AbstractBlock.Settings.create()
            .strength(3.0f, 6.0f).requiresTool().sounds(BlockSoundGroup.COPPER)));
    public static final Block LUMEN_GLASS = block("lumen_glass", new Block(AbstractBlock.Settings.create()
            .strength(0.8f).nonOpaque().sounds(BlockSoundGroup.GLASS).luminance(state -> 15)));

    private static Item item(String id, int count) {
        return register(id, new Item(new Item.Settings().maxCount(count)) {
            @Override public void appendTooltip(ItemStack stack, TooltipContext context, List<Text> tooltip, TooltipType type) {
                tooltip.add(Text.translatable("tooltip.copperwake." + id));
            }
        });
    }
    private static Item gadget(String id, GadgetItem.Action action, int count) {
        return register(id, new GadgetItem(new Item.Settings().maxCount(count), id, action));
    }
    private static Item register(String id, Item item) {
        ITEMS.put(id, item);
        return Registry.register(Registries.ITEM, CopperwakeMod.id(id), item);
    }
    private static Block block(String id, Block block) {
        Registry.register(Registries.BLOCK, CopperwakeMod.id(id), block);
        register(id, new BlockItem(block, new Item.Settings()));
        return block;
    }
    public static void initialize() {
        Registry.register(Registries.ITEM_GROUP, CopperwakeMod.id("salvagers"), FabricItemGroup.builder()
                .displayName(Text.translatable("itemGroup.copperwake"))
                .icon(() -> new ItemStack(SURVEY_KEY))
                .entries((context, entries) -> ITEMS.values().forEach(entries::add)).build());
    }
    private ModContent() { }
}
