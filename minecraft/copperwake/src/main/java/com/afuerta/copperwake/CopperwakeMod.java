package com.afuerta.copperwake;

import com.afuerta.copperwake.entity.ConstructRegistry;
import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback;
import net.fabricmc.fabric.api.event.player.UseBlockCallback;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.util.ActionResult;
import net.minecraft.util.Hand;
import net.minecraft.util.Identifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class CopperwakeMod implements ModInitializer {
    public static final String ID = "copperwake";
    public static final Logger LOGGER = LoggerFactory.getLogger(ID);
    public static Identifier id(String path) { return Identifier.of(ID, path); }

    @Override public void onInitialize() {
        ModContent.initialize();
        ConstructRegistry.initialize();
        CommandRegistrationCallback.EVENT.register((dispatcher, registry, environment) ->
                SalvageGuild.register(dispatcher));
        UseBlockCallback.EVENT.register((player, world, hand, hit) -> {
            if (hand != Hand.MAIN_HAND || !world.getBlockState(hit.getBlockPos()).isOf(ModContent.SALVAGE_BENCH)) {
                return ActionResult.PASS;
            }
            if (!world.isClient && player instanceof ServerPlayerEntity serverPlayer) {
                if (serverPlayer.isSneaking()) SalvageGuild.deliver(serverPlayer);
                else SalvageGuild.showContract(serverPlayer);
            }
            return ActionResult.SUCCESS;
        });
        LOGGER.info("Copperwake: Salvagers of the Rustwild initialized");
    }
}
