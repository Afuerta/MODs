package io.github.afuerta.starfall.registry;

import io.github.afuerta.starfall.Starfall;
import net.minecraft.core.registries.Registries;
import net.minecraft.tags.TagKey;
import net.minecraft.world.item.Item;

public final class ModTags {
    public static final class Items {
        /** Tools that get the Starlit bonus at night. data/starfall/tags/item/starlit_tools.json */
        public static final TagKey<Item> STARLIT_TOOLS = TagKey.create(Registries.ITEM, Starfall.id("starlit_tools"));

        private Items() {
        }
    }

    private ModTags() {
    }
}
