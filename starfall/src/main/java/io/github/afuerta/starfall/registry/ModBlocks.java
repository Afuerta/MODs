package io.github.afuerta.starfall.registry;

import io.github.afuerta.starfall.Starfall;
import io.github.afuerta.starfall.block.FallenStarBlock;
import net.minecraft.util.valueproviders.UniformInt;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.DropExperienceBlock;
import net.minecraft.world.level.block.SoundType;
import net.minecraft.world.level.block.state.BlockBehaviour;
import net.minecraft.world.level.block.state.properties.NoteBlockInstrument;
import net.minecraft.world.level.material.MapColor;
import net.neoforged.neoforge.registries.DeferredBlock;
import net.neoforged.neoforge.registries.DeferredRegister;

public final class ModBlocks {
    public static final DeferredRegister.Blocks BLOCKS = DeferredRegister.createBlocks(Starfall.MOD_ID);

    /** Dark crater stone left behind where a star lands. */
    public static final DeferredBlock<Block> STARSTONE = BLOCKS.register("starstone",
            () -> new Block(starstoneProperties()));

    public static final DeferredBlock<Block> STARSTONE_BRICKS = BLOCKS.register("starstone_bricks",
            () -> new Block(starstoneProperties()));

    /** Crater ore that drops star shards. */
    public static final DeferredBlock<DropExperienceBlock> STARSTONE_ORE = BLOCKS.register("starstone_ore",
            () -> new DropExperienceBlock(UniformInt.of(2, 5), BlockBehaviour.Properties.of()
                    .mapColor(MapColor.COLOR_PURPLE)
                    .instrument(NoteBlockInstrument.BASEDRUM)
                    .requiresCorrectToolForDrops()
                    .strength(3.0F, 3.0F)
                    .lightLevel(state -> 4)
                    .sound(SoundType.DEEPSLATE)));

    /** The glowing heart of a crater. */
    public static final DeferredBlock<FallenStarBlock> FALLEN_STAR = BLOCKS.register("fallen_star",
            () -> new FallenStarBlock(BlockBehaviour.Properties.of()
                    .mapColor(MapColor.GOLD)
                    .requiresCorrectToolForDrops()
                    .strength(3.0F, 6.0F)
                    .lightLevel(state -> 15)
                    .emissiveRendering((state, level, pos) -> true)
                    .sound(SoundType.AMETHYST)));

    public static final DeferredBlock<Block> STARSTEEL_BLOCK = BLOCKS.register("starsteel_block",
            () -> new Block(BlockBehaviour.Properties.of()
                    .mapColor(MapColor.COLOR_LIGHT_BLUE)
                    .instrument(NoteBlockInstrument.IRON_XYLOPHONE)
                    .requiresCorrectToolForDrops()
                    .strength(5.0F, 6.0F)
                    .sound(SoundType.METAL)));

    public static final DeferredBlock<Block> STAR_LANTERN = BLOCKS.register("star_lantern",
            () -> new Block(BlockBehaviour.Properties.of()
                    .mapColor(MapColor.COLOR_LIGHT_BLUE)
                    .strength(0.3F)
                    .lightLevel(state -> 15)
                    .sound(SoundType.GLASS)));

    private static BlockBehaviour.Properties starstoneProperties() {
        return BlockBehaviour.Properties.of()
                .mapColor(MapColor.COLOR_PURPLE)
                .instrument(NoteBlockInstrument.BASEDRUM)
                .requiresCorrectToolForDrops()
                .strength(1.8F, 6.0F)
                .sound(SoundType.DEEPSLATE);
    }

    private ModBlocks() {
    }
}
