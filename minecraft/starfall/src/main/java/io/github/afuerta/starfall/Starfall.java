package io.github.afuerta.starfall;

import io.github.afuerta.starfall.event.FallingStarManager;
import io.github.afuerta.starfall.event.ProtectedTerrain;
import io.github.afuerta.starfall.registry.ModBlocks;
import io.github.afuerta.starfall.registry.ModItems;
import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerLifecycleEvents;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents;
import net.fabricmc.fabric.api.event.player.UseBlockCallback;
import net.fabricmc.fabric.api.itemgroup.v1.FabricItemGroup;
import net.minecraft.item.BlockItem;
import net.minecraft.item.ItemStack;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.text.Text;
import net.minecraft.util.ActionResult;
import net.minecraft.util.Identifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Fabric entry point. Existing Starfall IDs are retained for shared datapacks. */
public final class Starfall implements ModInitializer {
    public static final String MOD_ID = "starfall";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);
    public static Identifier id(String path) { return Identifier.of(MOD_ID, path); }

    @Override public void onInitialize() {
        StarfallConfig.load();
        ModBlocks.initialize();
        ModItems.initialize();
        Registry.register(Registries.ITEM_GROUP, id("starfall"), FabricItemGroup.builder()
                .displayName(Text.translatable("itemGroup.starfall"))
                .icon(() -> new ItemStack(ModItems.STAR_SHARD))
                .entries((context, entries) -> ModItems.ALL.forEach(entries::add)).build());
        ServerTickEvents.END_WORLD_TICK.register(FallingStarManager::tick);
        ServerLifecycleEvents.SERVER_STOPPED.register(server -> FallingStarManager.clear());
        CommandRegistrationCallback.EVENT.register((dispatcher, registry, environment) ->
                io.github.afuerta.starfall.command.StarfallCommands.register(dispatcher));
        // Conservative provenance: even an unsuccessful placement protects the clicked area.
        // Persistent marks protect natural-material builds made after installing this mod.
        UseBlockCallback.EVENT.register((player, world, hand, hit) -> {
            if (world instanceof ServerWorld server && player.getStackInHand(hand).getItem() instanceof BlockItem) {
                ProtectedTerrain.get(server).protect(hit.getBlockPos());
                ProtectedTerrain.get(server).protect(hit.getBlockPos().offset(hit.getSide()));
            }
            return ActionResult.PASS;
        });
        LOGGER.info("Starfall Fabric 0.2 initialized");
    }
}
