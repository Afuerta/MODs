package com.afuerta.convergence;

import com.afuerta.convergence.domain.Commission;
import com.afuerta.convergence.domain.CommissionCatalog;
import com.afuerta.convergence.domain.DeliveryPlan;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.registry.Registries;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.sound.SoundCategory;
import net.minecraft.sound.SoundEvents;
import net.minecraft.text.Text;
import net.minecraft.util.Formatting;
import net.minecraft.util.Identifier;

import java.util.LinkedHashMap;
import java.util.Map;

/** Server-thread delivery commits only after validating every input, reward and progression gate. */
public final class ExpeditionContracts {
    static void status(ServerPlayerEntity player) {
        int completed = ConvergenceProgress.completed(player);
        player.sendMessage(Text.translatable("message.convergence.status", completed,
                1 + completed / CommissionCatalog.CIRCUIT_LENGTH,
                1 + completed % CommissionCatalog.CIRCUIT_LENGTH,
                ConvergenceProgress.riftTier(player), ConvergenceProgress.guildContracts(player))
                .formatted(Formatting.GOLD), false);
    }

    static void show(ServerPlayerEntity player) {
        status(player);
        var commission = CommissionCatalog.current(ConvergenceProgress.completed(player));
        player.sendMessage(Text.translatable("message.convergence.contract",
                Text.translatable("contract.convergence." + commission.id() + ".title")).formatted(Formatting.YELLOW), false);
        player.sendMessage(Text.translatable("contract.convergence." + commission.id() + ".description")
                .formatted(Formatting.GRAY), false);
        player.sendMessage(Text.translatable("message.convergence.gates", commission.minimumRiftTier(),
                commission.minimumGuildContracts()).formatted(Formatting.AQUA), false);
        commission.requirements().entrySet().stream().sorted(Map.Entry.comparingByKey()).forEach(entry -> {
            Item item = requiredItem(entry.getKey());
            int present = count(player, item);
            player.sendMessage(Text.translatable("message.convergence.requirement", Math.min(present, entry.getValue()),
                    entry.getValue(), item.getName()).formatted(present >= entry.getValue() ? Formatting.GREEN : Formatting.GRAY), false);
        });
        player.sendMessage(Text.translatable("message.convergence.reward", describe(commission.rewards()))
                .formatted(Formatting.AQUA), false);
        player.sendMessage(Text.translatable("message.convergence.turnin_hint").formatted(Formatting.DARK_GRAY), false);
    }

    /** The whole transaction executes synchronously; incomplete orders leave all inventory slots untouched. */
    static DeliveryPlan.Verdict turnIn(ServerPlayerEntity player) {
        int completed = ConvergenceProgress.completed(player);
        Commission commission = CommissionCatalog.current(completed);
        Map<Item, Integer> requirements = resolve(commission.requirements());
        Map<Item, Integer> rewards = resolve(commission.rewards());
        Map<String, Integer> inventory = new LinkedHashMap<>();
        commission.requirements().keySet().forEach(id -> inventory.put(id, count(player, requiredItem(id))));
        DeliveryPlan.Verdict verdict = DeliveryPlan.validate(commission, completed,
                ConvergenceProgress.riftTier(player), ConvergenceProgress.guildContracts(player),
                player.isAlive() && !player.isCreative() && !player.isSpectator(), inventory);
        if (verdict != DeliveryPlan.Verdict.ACCEPTED) {
            player.sendMessage(Text.translatable("message.convergence.failure." + verdict.name().toLowerCase(java.util.Locale.ROOT))
                    .formatted(Formatting.YELLOW), false);
            return verdict;
        }
        // Count and consume on the same server thread, with no callbacks between validation and mutation.
        requirements.forEach((item, amount) -> {
            if (!consume(player, item, amount)) throw new IllegalStateException("Validated delivery changed mid-transaction");
        });
        ConvergenceProgress.setCompleted(player, CommissionCatalog.nextCompleted(completed));
        rewards.forEach((item, amount) -> give(player, new ItemStack(item, amount)));
        player.getInventory().markDirty();
        player.getServerWorld().playSound(null, player.getBlockPos(), SoundEvents.BLOCK_AMETHYST_BLOCK_RESONATE,
                SoundCategory.PLAYERS, .8f, 1.2f);
        player.sendMessage(Text.translatable("message.convergence.delivered",
                Text.translatable("contract.convergence." + commission.id() + ".title")).formatted(Formatting.GREEN), false);
        if ((completed + 1) % CommissionCatalog.CIRCUIT_LENGTH == 0) {
            player.sendMessage(Text.translatable("message.convergence.circuit_complete").formatted(Formatting.LIGHT_PURPLE), false);
        }
        return verdict;
    }

    static Item requiredItem(String value) {
        Identifier id = Identifier.of(value);
        if (!Registries.ITEM.containsId(id)) throw new IllegalStateException("Unknown expedition item: " + value);
        return Registries.ITEM.get(id);
    }

    static int count(ServerPlayerEntity player, Item item) {
        int present = 0;
        for (int slot = 0; slot < player.getInventory().size(); slot++) {
            ItemStack stack = player.getInventory().getStack(slot);
            if (stack.isOf(item)) present += stack.getCount();
        }
        return present;
    }

    static boolean consume(ServerPlayerEntity player, Item item, int amount) {
        if (amount <= 0 || count(player, item) < amount) return false;
        int remaining = amount;
        for (int slot = 0; slot < player.getInventory().size() && remaining > 0; slot++) {
            ItemStack stack = player.getInventory().getStack(slot);
            if (!stack.isOf(item)) continue;
            int taken = Math.min(remaining, stack.getCount());
            stack.decrement(taken);
            remaining -= taken;
        }
        player.getInventory().markDirty();
        return true;
    }

    static void give(ServerPlayerEntity player, ItemStack stack) {
        if (player.getInventory().insertStack(stack)) return;
        var dropped = player.dropItem(stack, false);
        if (dropped != null) { dropped.setOwner(player.getUuid()); dropped.resetPickupDelay(); }
    }

    private static Map<Item, Integer> resolve(Map<String, Integer> definition) {
        Map<Item, Integer> result = new LinkedHashMap<>();
        definition.forEach((id, amount) -> result.put(requiredItem(id), amount));
        return result;
    }

    private static Text describe(Map<String, Integer> definition) {
        var text = Text.empty();
        definition.entrySet().stream().sorted(Map.Entry.comparingByKey()).forEach(entry -> {
            if (!text.getSiblings().isEmpty()) text.append(Text.translatable("message.convergence.separator"));
            text.append(Text.translatable("message.convergence.amount", entry.getValue(), requiredItem(entry.getKey()).getName()));
        });
        return text;
    }

    private ExpeditionContracts() { }
}
