package io.github.afuerta.starfall.registry;

import io.github.afuerta.starfall.Starfall;
import net.minecraft.core.registries.Registries;
import net.minecraft.network.chat.Component;
import net.minecraft.world.item.CreativeModeTab;
import net.minecraft.world.item.ItemStack;
import net.neoforged.neoforge.registries.DeferredHolder;
import net.neoforged.neoforge.registries.DeferredRegister;

public final class ModCreativeTabs {
    public static final DeferredRegister<CreativeModeTab> TABS =
            DeferredRegister.create(Registries.CREATIVE_MODE_TAB, Starfall.MOD_ID);

    /** Lists every Starfall item, in registration order. */
    public static final DeferredHolder<CreativeModeTab, CreativeModeTab> STARFALL = TABS.register("starfall",
            () -> CreativeModeTab.builder()
                    .title(Component.translatable("itemGroup.starfall"))
                    .icon(() -> new ItemStack(ModItems.WISHING_STAR.get()))
                    .displayItems((parameters, output) ->
                            ModItems.ITEMS.getEntries().forEach(item -> output.accept(item.get())))
                    .build());

    private ModCreativeTabs() {
    }
}
