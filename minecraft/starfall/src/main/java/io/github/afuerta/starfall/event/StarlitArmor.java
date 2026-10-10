package io.github.afuerta.starfall.event;

import io.github.afuerta.starfall.Starfall;
import io.github.afuerta.starfall.registry.ModItems;
import io.github.afuerta.starfall.util.StarfallUtil;
import net.minecraft.entity.EquipmentSlot;
import net.minecraft.entity.attribute.EntityAttributeInstance;
import net.minecraft.entity.attribute.EntityAttributeModifier;
import net.minecraft.entity.attribute.EntityAttributes;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.util.Identifier;

/** Server-authoritative, non-stacking expedition bonus; never grants elemental damage immunity. */
public final class StarlitArmor {
    public static final Identifier SPEED_ID = Starfall.id("starlit_armor_speed");
    public static final Identifier STEADY_ID = Starfall.id("starlit_armor_steady");
    private static final EntityAttributeModifier SPEED = new EntityAttributeModifier(SPEED_ID, .10,
            EntityAttributeModifier.Operation.ADD_MULTIPLIED_TOTAL);
    private static final EntityAttributeModifier STEADY = new EntityAttributeModifier(STEADY_ID, .10,
            EntityAttributeModifier.Operation.ADD_VALUE);
    public static boolean hasFullSet(PlayerEntity player) {
        return player.getEquippedStack(EquipmentSlot.HEAD).isOf(ModItems.STARSTEEL_HELMET)
                && player.getEquippedStack(EquipmentSlot.CHEST).isOf(ModItems.STARSTEEL_CHESTPLATE)
                && player.getEquippedStack(EquipmentSlot.LEGS).isOf(ModItems.STARSTEEL_LEGGINGS)
                && player.getEquippedStack(EquipmentSlot.FEET).isOf(ModItems.STARSTEEL_BOOTS);
    }
    public static void tick(ServerWorld world) { world.getPlayers().forEach(StarlitArmor::update); }
    public static void update(PlayerEntity player) {
        boolean active = player.isAlive() && !player.isSpectator() && hasFullSet(player)
                && StarfallUtil.isStarlit(player) && !player.getWorld().isThundering();
        updateModifier(player.getAttributeInstance(EntityAttributes.GENERIC_MOVEMENT_SPEED), SPEED, active);
        updateModifier(player.getAttributeInstance(EntityAttributes.GENERIC_KNOCKBACK_RESISTANCE), STEADY, active);
    }
    private static void updateModifier(EntityAttributeInstance attribute, EntityAttributeModifier modifier, boolean active) {
        if (attribute == null) return;
        if (active && !attribute.hasModifier(modifier.id())) attribute.addTemporaryModifier(modifier);
        else if (!active && attribute.hasModifier(modifier.id())) attribute.removeModifier(modifier.id());
    }
    private StarlitArmor() {}
}
