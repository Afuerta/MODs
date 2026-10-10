package com.afuerta.copperwake.entity;

import net.minecraft.entity.EntityType;
import net.minecraft.entity.attribute.DefaultAttributeContainer;
import net.minecraft.entity.attribute.EntityAttributes;
import net.minecraft.entity.mob.HostileEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.sound.SoundEvents;
import net.minecraft.util.math.Box;
import net.minecraft.util.math.Vec3d;
import net.minecraft.world.World;

/** Locks a location, draws its danger ring for 1.4 seconds, then discharges once. */
public final class CoilSentryEntity extends TelegraphConstructEntity {
    private static final double PULSE_RADIUS = 1.5;
    private Vec3d pulsePosition = Vec3d.ZERO;

    public CoilSentryEntity(EntityType<? extends HostileEntity> type, World world) {
        super(type, world);
        experiencePoints = 9;
    }

    public static DefaultAttributeContainer.Builder createAttributes() {
        return HostileEntity.createHostileAttributes()
                .add(EntityAttributes.GENERIC_MAX_HEALTH, 34.0)
                .add(EntityAttributes.GENERIC_MOVEMENT_SPEED, 0.22)
                .add(EntityAttributes.GENERIC_ATTACK_DAMAGE, 5.0)
                .add(EntityAttributes.GENERIC_ARMOR, 3.0)
                .add(EntityAttributes.GENERIC_FOLLOW_RANGE, 28.0);
    }

    @Override
    protected double desiredDistance() {
        return 8.0;
    }

    @Override
    protected void combatTick(ServerWorld world, PlayerEntity target) {
        int windup = getAttackWindup();
        if (windup > 0) {
            getNavigation().stop();
            setAttackWindup(windup - 1);
            if (windup % 4 == 0) {
                particleRing(world, ParticleTypes.ELECTRIC_SPARK, pulsePosition, PULSE_RADIUS, 18);
                world.spawnParticles(ParticleTypes.END_ROD, getX(), getY() + 1.3, getZ(),
                        2, 0.1, 0.1, 0.1, 0.0);
            }
            if (windup == 1) {
                firePulse(world);
                attackCooldown = 70;
            }
        } else if (attackCooldown == 0 && squaredDistanceTo(target) <= 14.0 * 14.0 && canSee(target)) {
            pulsePosition = target.getPos(); // Intentionally does not home after the warning starts.
            setAttackWindup(28);
            getNavigation().stop();
            particleRing(world, ParticleTypes.ELECTRIC_SPARK, pulsePosition, PULSE_RADIUS, 18);
            playSound(SoundEvents.BLOCK_AMETHYST_BLOCK_RESONATE, 1.1F, 1.35F);
        }
    }

    private void firePulse(ServerWorld world) {
        Vec3d origin = getPos().add(0.0, 1.3, 0.0);
        Vec3d end = pulsePosition.add(0.0, 0.6, 0.0);
        for (int i = 0; i <= 16; i++) {
            Vec3d point = origin.lerp(end, i / 16.0);
            world.spawnParticles(ParticleTypes.ELECTRIC_SPARK, point.x, point.y, point.z,
                    1, 0.03, 0.03, 0.03, 0.0);
        }
        world.spawnParticles(ParticleTypes.ELECTRIC_SPARK, end.x, end.y, end.z,
                22, 0.7, 0.45, 0.7, 0.03);
        playSound(SoundEvents.BLOCK_BEACON_DEACTIVATE, 0.8F, 1.8F);
        Box area = new Box(pulsePosition.add(-PULSE_RADIUS, -0.3, -PULSE_RADIUS),
                pulsePosition.add(PULSE_RADIUS, 2.0, PULSE_RADIUS));
        for (PlayerEntity player : world.getEntitiesByClass(PlayerEntity.class, area,
                TelegraphConstructEntity::isSurvivalTarget)) {
            double dx = player.getX() - pulsePosition.x;
            double dz = player.getZ() - pulsePosition.z;
            if (dx * dx + dz * dz <= PULSE_RADIUS * PULSE_RADIUS && canSee(player)) {
                player.damage(getDamageSources().mobAttack(this), 5.0F);
            }
        }
    }
}
