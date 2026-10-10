package com.afuerta.copperwake.entity;

import net.minecraft.entity.EntityType;
import net.minecraft.entity.attribute.DefaultAttributeContainer;
import net.minecraft.entity.attribute.EntityAttributes;
import net.minecraft.entity.mob.HostileEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.sound.SoundEvents;
import net.minecraft.util.math.Vec3d;
import net.minecraft.world.World;

/** The rattle and crouch precede a committed leap; sidestepping makes the mite miss. */
public final class RustMiteEntity extends TelegraphConstructEntity {
    private Vec3d pounceDirection = Vec3d.ZERO;
    private int pounceTicks;

    public RustMiteEntity(EntityType<? extends HostileEntity> type, World world) {
        super(type, world);
        experiencePoints = 5;
    }

    public static DefaultAttributeContainer.Builder createAttributes() {
        return HostileEntity.createHostileAttributes()
                .add(EntityAttributes.GENERIC_MAX_HEALTH, 18.0)
                .add(EntityAttributes.GENERIC_MOVEMENT_SPEED, 0.29)
                .add(EntityAttributes.GENERIC_ATTACK_DAMAGE, 4.0)
                .add(EntityAttributes.GENERIC_FOLLOW_RANGE, 24.0);
    }

    @Override
    protected boolean mayPursue() {
        return super.mayPursue() && pounceTicks == 0;
    }

    @Override
    protected void onCombatCancelled() {
        pounceTicks = 0;
    }

    @Override
    protected void combatTick(ServerWorld world, PlayerEntity target) {
        if (pounceTicks > 0) {
            pounceTicks--;
            for (PlayerEntity player : world.getEntitiesByClass(PlayerEntity.class,
                    getBoundingBox().expand(0.25), TelegraphConstructEntity::isSurvivalTarget)) {
                if (canSee(player)) {
                    tryAttack(player);
                    pounceTicks = 0; // At most one contact hit for the entire leap.
                    break;
                }
            }
            return;
        }
        int windup = getAttackWindup();
        if (windup > 0) {
            getNavigation().stop();
            setAttackWindup(windup - 1);
            if (windup % 3 == 0) {
                world.spawnParticles(ParticleTypes.ELECTRIC_SPARK, getX(), getY() + 0.5,
                        getZ(), 3, 0.2, 0.05, 0.2, 0.01);
            }
            if (windup == 1) {
                setVelocity(pounceDirection.multiply(0.62).add(0.0, 0.34, 0.0));
                velocityModified = true;
                pounceTicks = 12;
                attackCooldown = 42;
                playSound(SoundEvents.BLOCK_CHAIN_BREAK, 0.6F, 1.6F);
            }
        } else if (attackCooldown == 0 && isOnGround()
                && squaredDistanceTo(target) <= 4.5 * 4.5 && canSee(target)) {
            pounceDirection = target.getPos().subtract(getPos()).multiply(1.0, 0.0, 1.0).normalize();
            setAttackWindup(12);
            getNavigation().stop();
            playSound(SoundEvents.BLOCK_CHAIN_HIT, 0.8F, 1.7F);
        }
    }
}
