package io.github.afuerta.starfall.command;

import io.github.afuerta.starfall.event.FallingStarManager;
import net.minecraft.commands.CommandSourceStack;
import net.minecraft.commands.Commands;
import net.minecraft.commands.arguments.coordinates.BlockPosArgument;
import net.minecraft.core.BlockPos;
import net.minecraft.network.chat.Component;
import net.neoforged.neoforge.event.RegisterCommandsEvent;

/**
 * {@code /starfall summon [pos]} (permission level 2) drops a star on demand. Handy for testing
 * craters and loot without waiting for night.
 */
public final class StarfallCommands {
    public static void onRegisterCommands(RegisterCommandsEvent event) {
        event.getDispatcher().register(Commands.literal("starfall")
                .requires(source -> source.hasPermission(2))
                .then(Commands.literal("summon")
                        .executes(context -> summon(context.getSource(),
                                BlockPos.containing(context.getSource().getPosition()).offset(12, 0, 0)))
                        .then(Commands.argument("pos", BlockPosArgument.blockPos())
                                .executes(context -> summon(context.getSource(),
                                        BlockPosArgument.getLoadedBlockPos(context, "pos"))))));
    }

    private static int summon(CommandSourceStack source, BlockPos target) {
        if (FallingStarManager.launchStarAt(source.getLevel(), target.getX(), target.getZ())) {
            source.sendSuccess(() -> Component.translatable("commands.starfall.summon.success",
                    target.getX(), target.getZ()), true);
            return 1;
        }
        source.sendFailure(Component.translatable("commands.starfall.summon.failed"));
        return 0;
    }

    private StarfallCommands() {
    }
}
