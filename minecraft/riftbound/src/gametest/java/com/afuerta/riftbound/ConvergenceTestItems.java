package com.afuerta.riftbound;

import net.fabricmc.api.ModInitializer;
import net.fabricmc.loader.api.FabricLoader;
import net.minecraft.item.Item;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;

/** Standalone test fixtures only; the released Riftbound jar registers no Convergence IDs. */
public final class ConvergenceTestItems implements ModInitializer {
    @Override
    public void onInitialize() {
        if (FabricLoader.getInstance().isModLoaded("convergence")) return;
        for (String path : new String[]{"attunement_core", "concordance"}) {
            Registry.register(Registries.ITEM, Identifier.of("convergence", path), new Item(new Item.Settings()));
        }
    }
}
