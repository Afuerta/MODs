package io.github.afuerta.starfall;

import com.mojang.logging.LogUtils;
import io.github.afuerta.starfall.command.StarfallCommands;
import io.github.afuerta.starfall.event.FallingStarManager;
import io.github.afuerta.starfall.event.StarlitEvents;
import io.github.afuerta.starfall.registry.ModBlocks;
import io.github.afuerta.starfall.registry.ModCreativeTabs;
import io.github.afuerta.starfall.registry.ModItems;
import net.minecraft.resources.ResourceLocation;
import net.neoforged.api.distmarker.Dist;
import net.neoforged.bus.api.IEventBus;
import net.neoforged.fml.ModContainer;
import net.neoforged.fml.common.Mod;
import net.neoforged.fml.config.ModConfig;
import net.neoforged.fml.loading.FMLEnvironment;
import net.neoforged.neoforge.common.NeoForge;
import org.slf4j.Logger;

/**
 * Starfall: when night falls, so do the stars.
 *
 * <p>Entry point. Registers content (blocks, items, creative tab), the server config and the
 * game-event listeners. See DESIGN.md for the feature roadmap.
 */
@Mod(Starfall.MOD_ID)
public final class Starfall {
    public static final String MOD_ID = "starfall";
    public static final Logger LOGGER = LogUtils.getLogger();

    public Starfall(IEventBus modBus, ModContainer container) {
        ModBlocks.BLOCKS.register(modBus);
        ModItems.ITEMS.register(modBus);
        ModCreativeTabs.TABS.register(modBus);

        container.registerConfig(ModConfig.Type.SERVER, StarfallConfig.SPEC);

        NeoForge.EVENT_BUS.addListener(FallingStarManager::onLevelTick);
        NeoForge.EVENT_BUS.addListener(FallingStarManager::onServerStopped);
        NeoForge.EVENT_BUS.addListener(StarlitEvents::onBreakSpeed);
        NeoForge.EVENT_BUS.addListener(StarlitEvents::onIncomingDamage);
        NeoForge.EVENT_BUS.addListener(StarfallCommands::onRegisterCommands);
        if (FMLEnvironment.dist == Dist.CLIENT) {
            // Tooltips only exist on the client.
            NeoForge.EVENT_BUS.addListener(StarlitEvents::onItemTooltip);
        }

        LOGGER.info("Starfall loaded. Keep watching the sky.");
    }

    /** Shorthand for a {@code starfall:<path>} resource location. */
    public static ResourceLocation id(String path) {
        return ResourceLocation.fromNamespaceAndPath(MOD_ID, path);
    }
}
