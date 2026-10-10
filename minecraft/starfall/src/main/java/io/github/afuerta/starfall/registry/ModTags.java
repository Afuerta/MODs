package io.github.afuerta.starfall.registry;

import io.github.afuerta.starfall.Starfall;
import net.minecraft.item.Item;
import net.minecraft.registry.RegistryKeys;
import net.minecraft.registry.tag.TagKey;

/** Public gameplay tag: datapacks may opt compatible tools into clear-night bonuses. */
public final class ModTags {
    public static final TagKey<Item> STARLIT_TOOLS = TagKey.of(RegistryKeys.ITEM, Starfall.id("starlit_tools"));
    private ModTags() {}
}
