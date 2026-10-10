package io.github.afuerta.starfall.event;

import io.github.afuerta.starfall.registry.ModItems;
import io.github.afuerta.starfall.util.StarfallUtil;
import net.minecraft.entity.EquipmentSlot;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.damage.DamageSource;
import net.minecraft.entity.effect.StatusEffectInstance;
import net.minecraft.entity.effect.StatusEffects;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.registry.tag.DamageTypeTags;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.server.world.ServerWorld;

/** Server-owned full-set effects; fall protection is evaluated at the moment of damage. */
public final class StarlitArmor {
    public static final int NIGHT_VISION_TICKS = 260;
    public static final int REFRESH_INTERVAL = 20;

    public static boolean hasFullSet(PlayerEntity player) {
        return player.getEquippedStack(EquipmentSlot.HEAD).isOf(ModItems.STARSTEEL_HELMET)
                && player.getEquippedStack(EquipmentSlot.CHEST).isOf(ModItems.STARSTEEL_CHESTPLATE)
                && player.getEquippedStack(EquipmentSlot.LEGS).isOf(ModItems.STARSTEEL_LEGGINGS)
                && player.getEquippedStack(EquipmentSlot.FEET).isOf(ModItems.STARSTEEL_BOOTS);
    }

    public static boolean isEligible(PlayerEntity player) {
        return hasFullSet(player) && StarfallUtil.isStarlit(player);
    }

    public static void tick(ServerWorld world) {
        if (world.getTime() % REFRESH_INTERVAL != 0) return;
        for (ServerPlayerEntity player : world.getPlayers()) refreshNightVision(player);
    }

    public static void refreshNightVision(ServerPlayerEntity player) {
        if (!isEligible(player)) return;
        StatusEffectInstance current = player.getStatusEffect(StatusEffects.NIGHT_VISION);
        // Keep potion/beacon/mod effects intact, including stronger short effects and infinity.
        // No weaker hidden effect is queued behind them. Refresh above vanilla's flashing window.
        if (current != null && (current.isInfinite() || current.getAmplifier() > 0
                || current.getDuration() > NIGHT_VISION_TICKS - REFRESH_INTERVAL)) return;
        player.addStatusEffect(new StatusEffectInstance(StatusEffects.NIGHT_VISION,
                NIGHT_VISION_TICKS, 0, true, false, true));
        // Do not remove an effect when eligibility ends: it may belong to a potion or another mod.
        // The armor's own effect naturally expires within thirteen seconds.
    }

    public static boolean allowsDamage(LivingEntity entity, DamageSource source, float amount) {
        // Preserve accumulated fall distance. Removing a piece, moving under cover or dawn must
        // immediately restore ordinary fall damage, regardless of the last Night Vision refresh.
        return !(source.isIn(DamageTypeTags.IS_FALL)
                && entity instanceof PlayerEntity player && isEligible(player));
    }

    private StarlitArmor() {}
}
