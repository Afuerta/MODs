package com.afuerta.convergence;

import com.mojang.brigadier.CommandDispatcher;
import net.minecraft.item.ItemStack;
import net.minecraft.server.command.ServerCommandSource;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;
import net.minecraft.util.Formatting;

import static net.minecraft.server.command.CommandManager.literal;

/** Atlas and command guidance share translatable text and never change another mod's progress. */
final class ConvergenceCommands {
    static void register(CommandDispatcher<ServerCommandSource> dispatcher) {
        dispatcher.register(literal("convergence")
                .executes(ctx -> { help(ctx.getSource()); return 1; })
                .then(literal("help").executes(ctx -> { help(ctx.getSource()); return 1; }))
                .then(literal("status").executes(ctx -> { ExpeditionContracts.status(ctx.getSource().getPlayerOrThrow()); return 1; }))
                .then(literal("contract").executes(ctx -> { ExpeditionContracts.show(ctx.getSource().getPlayerOrThrow()); return 1; }))
                .then(literal("turnin").executes(ctx -> {
                    var result = ExpeditionContracts.turnIn(ctx.getSource().getPlayerOrThrow());
                    return result == com.afuerta.convergence.domain.DeliveryPlan.Verdict.ACCEPTED ? 1 : 0;
                }))
                .then(literal("kit").requires(source -> source.hasPermissionLevel(2)).executes(ctx -> {
                    var player = ctx.getSource().getPlayerOrThrow();
                    ExpeditionContracts.give(player, new ItemStack(ConvergenceMod.FIELD_ATLAS));
                    ExpeditionContracts.give(player, new ItemStack(ConvergenceMod.ATTUNEMENT_CORE));
                    ExpeditionContracts.give(player, new ItemStack(ConvergenceMod.ASTRAL_LENS));
                    ExpeditionContracts.give(player, new ItemStack(ConvergenceMod.STORMWARD_SIGIL));
                    ExpeditionContracts.give(player, new ItemStack(ConvergenceMod.EXPEDITION_HARNESS));
                    ExpeditionContracts.give(player, new ItemStack(ConvergenceMod.TRIUNE_PULSE));
                    ExpeditionContracts.give(player, new ItemStack(ConvergenceMod.MENDER_COIL));
                    ExpeditionContracts.give(player, new ItemStack(ConvergenceMod.FILAMENT, 16));
                    player.sendMessage(Text.translatable("message.convergence.kit").formatted(Formatting.AQUA), false);
                    return 1;
                })));
    }

    static void atlas(ServerPlayerEntity player) {
        player.sendMessage(Text.translatable("message.convergence.atlas_title").formatted(Formatting.GOLD), false);
        for (int step = 1; step <= 6; step++) {
            player.sendMessage(Text.translatable("message.convergence.atlas." + step).formatted(Formatting.GRAY), false);
        }
        ExpeditionContracts.status(player);
    }

    private static void help(ServerCommandSource source) {
        source.sendFeedback(() -> Text.translatable("message.convergence.help"), false);
    }

    private ConvergenceCommands() { }
}
