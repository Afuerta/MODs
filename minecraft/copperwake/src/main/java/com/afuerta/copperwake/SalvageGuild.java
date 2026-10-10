package com.afuerta.copperwake;

import com.afuerta.copperwake.domain.ContractCatalog;
import com.mojang.brigadier.CommandDispatcher;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.registry.Registries;
import net.minecraft.server.command.ServerCommandSource;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.sound.SoundCategory;
import net.minecraft.sound.SoundEvents;
import net.minecraft.text.Text;
import net.minecraft.util.Formatting;
import net.minecraft.util.Identifier;

import java.util.LinkedHashMap;
import java.util.Map;

import static net.minecraft.server.command.CommandManager.literal;

public final class SalvageGuild {
    static void register(CommandDispatcher<ServerCommandSource> dispatcher) {
        dispatcher.register(literal("copperwake")
                .executes(ctx -> { journal(ctx.getSource().getPlayerOrThrow()); return 1; })
                .then(literal("journal").executes(ctx -> { journal(ctx.getSource().getPlayerOrThrow()); return 1; }))
                .then(literal("contract").executes(ctx -> { showContract(ctx.getSource().getPlayerOrThrow()); return 1; }))
                .then(literal("status").executes(ctx -> { status(ctx.getSource().getPlayerOrThrow()); return 1; }))
                .then(literal("return").executes(ctx -> RustwildTravel.returnHome(ctx.getSource().getPlayerOrThrow()) ? 1 : 0))
                .then(literal("kit").requires(source -> source.hasPermissionLevel(2)).executes(ctx -> {
                    var player = ctx.getSource().getPlayerOrThrow();
                    give(player, new ItemStack(ModContent.FIELD_JOURNAL));
                    give(player, new ItemStack(ModContent.SURVEY_KEY));
                    give(player, new ItemStack(ModContent.SALVAGE_BENCH));
                    give(player, new ItemStack(ModContent.PATCH_KIT, 4));
                    player.sendMessage(Text.literal("Copperwake exploration kit. Guild rank still needs salvage contracts."), false);
                    return 1;
                })));
    }

    static void journal(ServerPlayerEntity player) {
        say(player, "COPPERWAKE • Field Journal", Formatting.GOLD);
        say(player, "1. Craft a Survey Key with copper, a compass, redstone and amethyst. Use it in the Overworld to enter the Rustwild.", Formatting.GRAY);
        say(player, "2. Search the Oxide Flats, Verdigris Woods and Cinder Works for workshops, relay towers and foundries. Barrels and constructs hold salvage.", Formatting.GRAY);
        say(player, "3. Right-click a Salvage Bench to read your contract. Sneak-click to deliver its supplies. Deliveries earn gears, cores and guild rank.", Formatting.GRAY);
        say(player, "4. Four deliveries unlock Mechanist gadgets: the Arc Gauntlet and Spring Boots. Each use burns one Scrap. Boots are a handheld jump device.", Formatting.GRAY);
        say(player, "5. Twelve deliveries unlock Artificer rank. Use a Foreman Seal on open Rustwild ground to wake the Foundry Foreman.", Formatting.GRAY);
        say(player, "Use the Key again to return. Lost your key? /copperwake return is always available in the Rustwild. /copperwake contract and status show your next goal.", Formatting.AQUA);
        say(player, "Death and inventory drops follow normal Minecraft rules. Prepare food, armor and torches before your first expedition.", Formatting.DARK_GRAY);
        player.sendMessage(Text.translatable("journal.copperwake.field_devices").formatted(Formatting.AQUA), false);
        player.sendMessage(Text.translatable("journal.copperwake.expanded_contracts").formatted(Formatting.GRAY), false);
    }

    static void status(ServerPlayerEntity player) {
        int completed = GuildProgress.completed(player);
        int next = ContractCatalog.nextRankAt(completed);
        say(player, "Salvage Guild • " + ContractCatalog.rankName(completed) + " • " + completed + " deliveries", Formatting.GOLD);
        say(player, next < 0 ? "All guild ranks unlocked. Keep fulfilling contracts to fuel your next build."
                : (next - completed) + " deliveries until the next guild rank.", Formatting.GRAY);
    }

    static void showContract(ServerPlayerEntity player) {
        status(player);
        var contract = ContractCatalog.current(GuildProgress.completed(player));
        String contractName = contract.id().substring("copperwake:".length());
        player.sendMessage(Text.translatable("message.copperwake.contract_title",
                Text.translatable("contract.copperwake." + contractName + ".title")).formatted(Formatting.YELLOW), false);
        player.sendMessage(Text.translatable("contract.copperwake." + contractName + ".description")
                .formatted(Formatting.GRAY), false);
        contract.requirements().forEach((id, amount) -> {
            Item item = requiredItem(id);
            int present = count(player, item);
            player.sendMessage(Text.literal("  " + Math.min(present, amount) + "/" + amount + " ")
                    .append(item.getName()).formatted(present >= amount ? Formatting.GREEN : Formatting.GRAY), false);
        });
        player.sendMessage(Text.literal("Reward: ").formatted(Formatting.AQUA).append(describe(contract.rewards())), false);
        say(player, "Sneak + right-click a Salvage Bench to deliver. Supplies are consumed only when you have the entire order.", Formatting.DARK_GRAY);
    }

    /** Validate the entire order first; no partial payment, tick reroll, or client-side mutation. */
    static void deliver(ServerPlayerEntity player) {
        if (player.isSpectator()) return;
        var contract = ContractCatalog.current(GuildProgress.completed(player));
        Map<Item, Integer> requirements = new LinkedHashMap<>();
        Map<Item, Integer> rewards = new LinkedHashMap<>();
        contract.requirements().forEach((id, amount) -> requirements.put(requiredItem(id), amount));
        contract.rewards().forEach((id, amount) -> rewards.put(requiredItem(id), amount));
        if (requirements.entrySet().stream().anyMatch(entry -> count(player, entry.getKey()) < entry.getValue())) {
            say(player, "The order is incomplete. Nothing was consumed.", Formatting.YELLOW);
            showContract(player);
            return;
        }
        int before = ContractCatalog.rankIndex(GuildProgress.completed(player));
        requirements.forEach((item, amount) -> consume(player, item, amount));
        GuildProgress.complete(player);
        rewards.forEach((item, amount) -> give(player, new ItemStack(item, amount)));
        player.getInventory().markDirty();
        player.getServerWorld().playSound(null, player.getBlockPos(), SoundEvents.BLOCK_SMITHING_TABLE_USE, SoundCategory.PLAYERS, 0.8f, 1.2f);
        player.sendMessage(Text.translatable("message.copperwake.contract_delivered",
                Text.translatable("contract.copperwake." + contract.id().substring("copperwake:".length()) + ".title"))
                .formatted(Formatting.GREEN), false);
        if (ContractCatalog.rankIndex(GuildProgress.completed(player)) > before) {
            say(player, "Guild promotion! You are now a " + ContractCatalog.rankName(GuildProgress.completed(player)) + ".", Formatting.GOLD);
        }
        showContract(player);
    }

    static boolean rankAtLeast(ServerPlayerEntity player, int rank) {
        return ContractCatalog.rankIndex(GuildProgress.completed(player)) >= rank;
    }
    static Item requiredItem(String id) {
        Identifier identifier = Identifier.of(id);
        if (!Registries.ITEM.containsId(identifier)) throw new IllegalStateException("Unknown contract item " + id);
        return Registries.ITEM.get(identifier);
    }
    static int count(ServerPlayerEntity player, Item item) {
        int result = 0;
        for (int slot = 0; slot < player.getInventory().size(); slot++) {
            var stack = player.getInventory().getStack(slot);
            if (stack.isOf(item)) result += stack.getCount();
        }
        return result;
    }
    static boolean consume(ServerPlayerEntity player, Item item, int amount) {
        if (amount < 0 || count(player, item) < amount) return false;
        for (int slot = 0; slot < player.getInventory().size() && amount > 0; slot++) {
            var stack = player.getInventory().getStack(slot);
            if (!stack.isOf(item)) continue;
            int taken = Math.min(amount, stack.getCount());
            stack.decrement(taken);
            amount -= taken;
        }
        player.getInventory().markDirty();
        return true;
    }
    static void give(ServerPlayerEntity player, ItemStack stack) {
        if (!player.getInventory().insertStack(stack)) {
            var entity = player.dropItem(stack, false);
            if (entity != null) { entity.setOwner(player.getUuid()); entity.resetPickupDelay(); }
        }
    }
    private static Text describe(Map<String, Integer> stacks) {
        var text = Text.empty();
        int index = 0;
        for (var entry : stacks.entrySet()) {
            if (index++ > 0) text.append(", ");
            text.append(entry.getValue() + " ").append(requiredItem(entry.getKey()).getName());
        }
        return text;
    }
    static void say(ServerPlayerEntity player, String message, Formatting color) {
        player.sendMessage(Text.literal(message).formatted(color), false);
    }
    private SalvageGuild() { }
}
