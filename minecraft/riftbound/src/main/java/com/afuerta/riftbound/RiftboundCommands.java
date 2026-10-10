package com.afuerta.riftbound;

import com.mojang.brigadier.CommandDispatcher;
import net.minecraft.item.ItemStack;
import net.minecraft.server.command.ServerCommandSource;
import net.minecraft.text.Text;
import static net.minecraft.server.command.CommandManager.literal;

final class RiftboundCommands {
    static void register(CommandDispatcher<ServerCommandSource> dispatcher) {
        dispatcher.register(literal("riftbound")
                .executes(ctx -> { help(ctx.getSource()); return 1; })
                .then(literal("help").executes(ctx -> { help(ctx.getSource()); return 1; }))
                .then(literal("status").executes(ctx -> {
                    RiftboundMod.TRIALS.status(ctx.getSource().getPlayerOrThrow()); return 1;
                }))
                .then(literal("ready").executes(ctx -> {
                    RiftboundMod.TRIALS.ready(ctx.getSource().getPlayerOrThrow()); return 1;
                }))
                .then(literal("leave").executes(ctx -> {
                    RiftboundMod.TRIALS.cancel(ctx.getSource().getPlayerOrThrow()); return 1;
                }))
                .then(literal("kit").requires(source -> source.hasPermissionLevel(2)).executes(ctx -> {
                    var player = ctx.getSource().getPlayerOrThrow();
                    give(player, new ItemStack(RiftboundMod.ANCHOR_ITEM));
                    RiftboundMod.ECHOES.values().forEach(item -> give(player, new ItemStack(item, 8)));
                    ctx.getSource().sendFeedback(() -> Text.literal("Riftbound testing kit granted. Use Survival mode for trials."), false);
                    return 1;
                })));
    }

    private static void give(net.minecraft.server.network.ServerPlayerEntity player, ItemStack stack) {
        if (!player.getInventory().insertStack(stack)) player.dropItem(stack, false);
    }
    private static void help(ServerCommandSource source) {
        source.sendFeedback(() -> Text.literal("Riftbound: collect or craft four Echoes, build a Rift Anchor on flat, dry Overworld ground, then right-click with an Echo. Clear all waves without dying or leaving the 24-block arena. Sneak-click with an empty hand to cycle unlocked tiers. Craft relics with a Dormant Relic and 8 Resonance Shards; hold one in your offhand. /riftbound ready opts into a nearby friend's next trial for 5 minutes; /riftbound leave withdraws; /riftbound status shows progression. Operators: /riftbound kit."), false);
    }
}
