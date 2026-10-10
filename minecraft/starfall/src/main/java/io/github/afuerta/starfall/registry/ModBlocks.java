package io.github.afuerta.starfall.registry;

import io.github.afuerta.starfall.Starfall;
import io.github.afuerta.starfall.block.FallenStarBlock;
import net.minecraft.block.AbstractBlock;
import net.minecraft.block.Block;
import net.minecraft.block.ExperienceDroppingBlock;
import net.minecraft.block.SlabBlock;
import net.minecraft.block.StairsBlock;
import net.minecraft.block.WallBlock;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.sound.BlockSoundGroup;
import net.minecraft.util.math.intprovider.UniformIntProvider;
import java.util.LinkedHashMap;
import java.util.Map;

/** Original blocks and a complete stairs/slabs/walls building expansion. */
public final class ModBlocks {
    public static final Map<String, Block> ALL = new LinkedHashMap<>();
    public static final Block STARSTONE = block("starstone", new Block(stone()));
    public static final Block STARSTONE_BRICKS = block("starstone_bricks", new Block(stone()));
    public static final Block POLISHED_STARSTONE = block("polished_starstone", new Block(stone()));
    public static final Block CHISELED_STARSTONE = block("chiseled_starstone", new Block(stone()));
    public static final Block STARSTONE_ORE = block("starstone_ore", new ExperienceDroppingBlock(
            UniformIntProvider.create(2, 5), stone().strength(3, 3).luminance(state -> 4)));
    public static final Block FALLEN_STAR = block("fallen_star", new FallenStarBlock(AbstractBlock.Settings.create()
            .strength(3, 6).requiresTool().luminance(state -> 15)
            .emissiveLighting((state, world, pos) -> true).sounds(BlockSoundGroup.AMETHYST_BLOCK)));
    public static final Block STARSTEEL_BLOCK = block("starsteel_block", new Block(AbstractBlock.Settings.create()
            .strength(5, 6).requiresTool().sounds(BlockSoundGroup.METAL)));
    public static final Block STAR_LANTERN = block("star_lantern", new Block(AbstractBlock.Settings.create()
            .strength(.3F).luminance(state -> 15).sounds(BlockSoundGroup.GLASS)));
    static {
        family("starstone", STARSTONE);
        family("starstone_brick", STARSTONE_BRICKS);
        family("polished_starstone", POLISHED_STARSTONE);
    }
    private static AbstractBlock.Settings stone() {
        return AbstractBlock.Settings.create().strength(1.8F, 6).requiresTool().sounds(BlockSoundGroup.DEEPSLATE);
    }
    private static Block block(String path, Block block) {
        ALL.put(path, Registry.register(Registries.BLOCK, Starfall.id(path), block));
        return block;
    }
    private static void family(String path, Block base) {
        block(path + "_stairs", new StairsBlock(base.getDefaultState(), stone()) {});
        block(path + "_slab", new SlabBlock(stone()));
        block(path + "_wall", new WallBlock(stone()));
    }
    public static void initialize() {}
    private ModBlocks() {}
}
