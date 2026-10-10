package com.afuerta.convergence;

import net.minecraft.entity.effect.StatusEffectInstance;
import net.minecraft.entity.effect.StatusEffects;
import net.minecraft.entity.mob.HostileEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.item.tooltip.TooltipType;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.sound.SoundCategory;
import net.minecraft.sound.SoundEvents;
import net.minecraft.text.Text;
import net.minecraft.util.Formatting;
import net.minecraft.util.Hand;
import net.minecraft.util.TypedActionResult;
import net.minecraft.world.World;

import java.util.Comparator;
import java.util.List;

/** Charged expedition tools reject invalid targets before spending a commission filament. */
final class ExpeditionGadget extends Item {
    enum Action { ATLAS, PULSE, REPAIR }
    static final int PULSE_RADIUS = 6;
    static final int PULSE_TARGET_CAP = 6;
    static final int PULSE_COOLDOWN = 300;
    static final int REPAIR_AMOUNT = 64;
    static final int REPAIR_COOLDOWN = 400;
    private final String id;
    private final Action action;

    ExpeditionGadget(Settings settings, String id, Action action) {
        super(settings);
        this.id = id;
        this.action = action;
    }

    @Override public void appendTooltip(ItemStack stack, TooltipContext context, List<Text> tooltip, TooltipType type) {
        tooltip.add(Text.translatable("tooltip.convergence." + id));
    }

    @Override public TypedActionResult<ItemStack> use(World world, PlayerEntity user, Hand hand) {
        ItemStack stack = user.getStackInHand(hand);
        if (world.isClient) return TypedActionResult.success(stack);
        if (!(user instanceof ServerPlayerEntity player) || !player.isAlive() || player.isSpectator()) {
            return TypedActionResult.fail(stack);
        }
        if (action == Action.ATLAS) {
            if (player.isSneaking()) ExpeditionContracts.show(player);
            else ConvergenceCommands.atlas(player);
            return TypedActionResult.success(stack);
        }
        if (player.isCreative()) {
            player.sendMessage(Text.translatable("message.convergence.failure.survival_only").formatted(Formatting.YELLOW), false);
            return TypedActionResult.fail(stack);
        }
        if (player.getItemCooldownManager().isCoolingDown(this)) return TypedActionResult.fail(stack);
        boolean used = action == Action.PULSE ? pulse(player) : repair(player, hand);
        return used ? TypedActionResult.success(stack) : TypedActionResult.fail(stack);
    }

    private boolean pulse(ServerPlayerEntity player) {
        var world = player.getServerWorld();
        var targets = world.getEntitiesByClass(HostileEntity.class, player.getBoundingBox().expand(PULSE_RADIUS),
                target -> target.isAlive() && player.squaredDistanceTo(target) <= PULSE_RADIUS * PULSE_RADIUS && player.canSee(target));
        if (targets.isEmpty()) {
            player.sendMessage(Text.translatable("message.convergence.pulse_empty").formatted(Formatting.GRAY), false);
            return false;
        }
        if (!fuel(player)) return false;
        targets.sort(Comparator.comparingDouble(player::squaredDistanceTo));
        for (var target : targets.stream().limit(PULSE_TARGET_CAP).toList()) {
            target.takeKnockback(.9, player.getX() - target.getX(), player.getZ() - target.getZ());
            target.velocityModified = true;
            target.addStatusEffect(new StatusEffectInstance(StatusEffects.SLOWNESS, 100, 1, false, true, true));
        }
        player.getItemCooldownManager().set(this, PULSE_COOLDOWN);
        world.spawnParticles(ParticleTypes.ELECTRIC_SPARK, player.getX(), player.getY() + 1, player.getZ(), 48, 2, .5, 2, .06);
        world.playSound(null, player.getBlockPos(), SoundEvents.BLOCK_RESPAWN_ANCHOR_CHARGE, SoundCategory.PLAYERS, .7f, 1.4f);
        player.sendMessage(Text.translatable("message.convergence.pulse_result", Math.min(targets.size(), PULSE_TARGET_CAP))
                .formatted(Formatting.AQUA), false);
        return true;
    }

    private boolean repair(ServerPlayerEntity player, Hand hand) {
        if (hand != Hand.MAIN_HAND) {
            player.sendMessage(Text.translatable("message.convergence.repair_mainhand").formatted(Formatting.YELLOW), false);
            return false;
        }
        ItemStack equipment = player.getOffHandStack();
        if (!equipment.isDamageable() || !equipment.isDamaged()) {
            player.sendMessage(Text.translatable("message.convergence.repair_target").formatted(Formatting.GRAY), false);
            return false;
        }
        if (!fuel(player)) return false;
        int restored = Math.min(REPAIR_AMOUNT, equipment.getDamage());
        equipment.setDamage(equipment.getDamage() - restored);
        player.getInventory().markDirty();
        player.getItemCooldownManager().set(this, REPAIR_COOLDOWN);
        player.getServerWorld().playSound(null, player.getBlockPos(), SoundEvents.BLOCK_SMITHING_TABLE_USE,
                SoundCategory.PLAYERS, .8f, 1.4f);
        player.sendMessage(Text.translatable("message.convergence.repair_result", restored).formatted(Formatting.GREEN), false);
        return true;
    }

    private boolean fuel(ServerPlayerEntity player) {
        if (ExpeditionContracts.consume(player, ConvergenceMod.FILAMENT, 1)) return true;
        player.sendMessage(Text.translatable("message.convergence.filament_needed").formatted(Formatting.YELLOW), false);
        return false;
    }
}
