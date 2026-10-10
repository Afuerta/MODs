package com.afuerta.convergence;

import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.entity.player.PlayerInventory;
import net.minecraft.item.ItemStack;
import net.minecraft.screen.ScreenHandler;
import net.minecraft.screen.ScreenHandlerType;
import net.minecraft.screen.slot.Slot;
import net.minecraft.server.network.ServerPlayerEntity;

/** Matches the vanilla dispenser client layout; all insertion restrictions are enforced on the server. */
final class AstralInfusionScreenHandler extends ScreenHandler {
    private final AstralInfusionBlockEntity station;
    private final PlayerEntity player;
    private long lastStatusTick = Long.MIN_VALUE;
    AstralInfusionScreenHandler(int syncId, PlayerInventory inventory, AstralInfusionBlockEntity station, PlayerEntity player) {
        super(ScreenHandlerType.GENERIC_3X3, syncId);
        this.station = station; this.player = player;
        for (int row = 0; row < 3; row++) for (int column = 0; column < 3; column++) {
            int index = column + row * 3;
            addSlot(new Slot(station, index, 62 + column * 18, 17 + row * 18) {
                @Override public boolean canInsert(ItemStack stack) { return station.isValid(index, stack); }
            });
        }
        for (int row = 0; row < 3; row++) for (int column = 0; column < 9; column++)
            addSlot(new Slot(inventory, column + row * 9 + 9, 8 + column * 18, 84 + row * 18));
        for (int column = 0; column < 9; column++) addSlot(new Slot(inventory, column, 8 + column * 18, 142));
    }
    @Override public boolean canUse(PlayerEntity player) { return station.canPlayerUse(player); }
    @Override public ItemStack quickMove(PlayerEntity player, int index) {
        if (index < 0 || index >= slots.size()) return ItemStack.EMPTY;
        Slot slot = slots.get(index);
        if (!slot.hasStack()) return ItemStack.EMPTY;
        ItemStack stack = slot.getStack();
        ItemStack original = stack.copy();
        if (index < 9) {
            if (!insertItem(stack, 9, slots.size(), true)) return ItemStack.EMPTY;
        } else if (!insertItem(stack, 0, AstralInfusionBlockEntity.FIRST_OUTPUT, false)) return ItemStack.EMPTY;
        if (stack.isEmpty()) slot.setStack(ItemStack.EMPTY); else slot.markDirty();
        slot.onTakeItem(player, stack);
        return original;
    }
    @Override public void sendContentUpdates() {
        super.sendContentUpdates();
        if (player instanceof ServerPlayerEntity serverPlayer) {
            long tick = serverPlayer.getServerWorld().getTime();
            if (tick != lastStatusTick && tick % 20 == 0) {
                lastStatusTick = tick;
                serverPlayer.sendMessage(station.statusText(), true);
            }
        }
    }
}
