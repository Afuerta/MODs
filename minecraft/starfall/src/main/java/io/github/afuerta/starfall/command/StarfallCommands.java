package io.github.afuerta.starfall.command;

import com.mojang.brigadier.CommandDispatcher;
import io.github.afuerta.starfall.StarfallConfig;
import io.github.afuerta.starfall.event.FallingStarManager;
import net.minecraft.command.argument.BlockPosArgumentType;
import net.minecraft.server.command.CommandManager;
import net.minecraft.server.command.ServerCommandSource;
import net.minecraft.text.Text;

/** Public status plus op-only summon/shower commands, all using safe event preflight. */
public final class StarfallCommands {
    public static void register(CommandDispatcher<ServerCommandSource> dispatcher) {
        dispatcher.register(CommandManager.literal("starfall")
                .then(CommandManager.literal("status").executes(context -> {
                    var source = context.getSource();
                    source.sendFeedback(() -> Text.translatable("command.starfall.status",
                            StarfallConfig.INSTANCE.falling_stars.enabled, FallingStarManager.isShower(source.getWorld()),
                            FallingStarManager.launchedCount(source.getWorld()), StarfallConfig.INSTANCE.showers.max_impacts_per_night), false);
                    return 1;
                }))
                .then(CommandManager.literal("summon").requires(source -> source.hasPermissionLevel(2))
                        .executes(context -> summon(context.getSource(), (int) Math.floor(context.getSource().getPosition().x) + 12,
                                (int) Math.floor(context.getSource().getPosition().z)))
                        .then(CommandManager.argument("pos", BlockPosArgumentType.blockPos()).executes(context -> {
                            var pos = BlockPosArgumentType.getBlockPos(context, "pos");
                            return summon(context.getSource(), pos.getX(), pos.getZ());
                        })))
                .then(CommandManager.literal("shower").requires(source -> source.hasPermissionLevel(2)).executes(context -> {
                    var source = context.getSource();
                    boolean started = FallingStarManager.startShower(source.getWorld());
                    if (started) source.sendFeedback(() -> Text.translatable("command.starfall.shower_started"), true);
                    else source.sendError(Text.translatable("command.starfall.shower_unavailable"));
                    return started ? 1 : 0;
                })));
    }
    private static int summon(ServerCommandSource source, int x, int z) {
        boolean launched = FallingStarManager.launchStarAt(source.getWorld(), x, z);
        if (launched) source.sendFeedback(() -> Text.translatable("command.starfall.summoned", x, z), true);
        else source.sendError(Text.translatable("command.starfall.failed"));
        return launched ? 1 : 0;
    }
    private StarfallCommands() {}
}
