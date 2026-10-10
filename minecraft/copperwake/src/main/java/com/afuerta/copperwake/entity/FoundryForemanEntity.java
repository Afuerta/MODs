package com.afuerta.copperwake.entity;

import net.minecraft.entity.Entity;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.attribute.DefaultAttributeContainer;
import net.minecraft.entity.attribute.EntityAttributes;
import net.minecraft.entity.boss.BossBar;
import net.minecraft.entity.boss.ServerBossBar;
import net.minecraft.entity.damage.DamageSource;
import net.minecraft.entity.mob.HostileEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.sound.SoundEvents;
import net.minecraft.text.Text;
import net.minecraft.util.Hand;
import net.minecraft.util.math.Vec3d;
import net.minecraft.world.World;

/** A summon-only, persistent boss with a jumpable shockwave and a faster second phase. */
public final class FoundryForemanEntity extends TelegraphConstructEntity {
    private final ServerBossBar bossBar = new ServerBossBar(
            Text.translatable("entity.copperwake.foundry_foreman"),
            BossBar.Color.YELLOW, BossBar.Style.PROGRESS);
    private Vec3d stompCenter = Vec3d.ZERO;
    private double stompRadius;
    private boolean announcedEnrage;

    public FoundryForemanEntity(EntityType<? extends HostileEntity> type, World world) {
        super(type, world);
        experiencePoints = 100;
        setPersistent();
    }

    public static DefaultAttributeContainer.Builder createAttributes() {
        return HostileEntity.createHostileAttributes()
                .add(EntityAttributes.GENERIC_MAX_HEALTH, 280.0)
                .add(EntityAttributes.GENERIC_MOVEMENT_SPEED, 0.24)
                .add(EntityAttributes.GENERIC_ATTACK_DAMAGE, 9.0)
                .add(EntityAttributes.GENERIC_ARMOR, 7.0)
                .add(EntityAttributes.GENERIC_KNOCKBACK_RESISTANCE, 0.85)
                .add(EntityAttributes.GENERIC_FOLLOW_RANGE, 36.0)
                .add(EntityAttributes.GENERIC_STEP_HEIGHT, 1.0);
    }

    public boolean isEnraged() {
        return getHealth() <= getMaxHealth() * 0.5F;
    }

    @Override
    public void tick() {
        super.tick();
        if (getWorld().isClient) return;
        bossBar.setPercent(Math.max(0.0F, getHealth() / getMaxHealth()));
        bossBar.setColor(isEnraged() ? BossBar.Color.RED : BossBar.Color.YELLOW);
        bossBar.setVisible(isAlive());
        // Tracking events alone do not catch a player switching to creative or spectator.
        for (ServerPlayerEntity player : java.util.List.copyOf(bossBar.getPlayers())) {
            if (!isSurvivalTarget(player)) bossBar.removePlayer(player);
        }
        if (isAlive() && isEnraged() && !announcedEnrage) {
            announcedEnrage = true;
            playSound(SoundEvents.ENTITY_IRON_GOLEM_REPAIR, 1.5F, 0.6F);
            if (getWorld() instanceof ServerWorld server) {
                server.spawnParticles(ParticleTypes.LAVA, getX(), getY() + 1.8, getZ(),
                        20, 0.7, 0.6, 0.7, 0.0);
            }
        }
    }

    @Override
    protected double pursuitSpeed() {
        return isEnraged() ? 1.2 : 1.0;
    }

    @Override
    protected double desiredDistance() {
        return 2.6;
    }

    @Override
    protected void combatTick(ServerWorld world, PlayerEntity target) {
        int windup = getAttackWindup();
        if (windup > 0) {
            getNavigation().stop();
            setAttackWindup(windup - 1);
            if (windup % 4 == 0) {
                particleRing(world, ParticleTypes.FLAME, stompCenter, stompRadius, 36);
                particleRing(world, ParticleTypes.SMOKE, stompCenter, 1.1, 12);
            }
            if (windup == 1) {
                stomp(world);
                attackCooldown = isEnraged() ? 38 : 60;
            }
        } else if (attackCooldown == 0 && isOnGround()
                && squaredDistanceTo(target) <= 7.0 * 7.0 && canSee(target)) {
            stompCenter = getPos();
            stompRadius = isEnraged() ? 6.0 : 5.0;
            setAttackWindup(isEnraged() ? 23 : 32);
            getNavigation().stop();
            playSound(SoundEvents.BLOCK_CHAIN_BREAK, 1.7F, 0.5F);
            particleRing(world, ParticleTypes.FLAME, stompCenter, stompRadius, 36);
        }
    }

    private void stomp(ServerWorld world) {
        // Visual particles and sound only: this attack never edits blocks or makes explosions.
        swingHand(Hand.MAIN_HAND);
        for (double radius = 1.0; radius <= stompRadius; radius += 1.0) {
            particleRing(world, ParticleTypes.CLOUD, stompCenter, radius, 24);
        }
        world.spawnParticles(ParticleTypes.FLAME, stompCenter.x, stompCenter.y + 0.2,
                stompCenter.z, 30, stompRadius * 0.5, 0.03, stompRadius * 0.5, 0.02);
        playSound(SoundEvents.ENTITY_IRON_GOLEM_ATTACK, 2.0F, 0.6F);
        for (PlayerEntity player : world.getEntitiesByClass(PlayerEntity.class,
                getBoundingBox().expand(stompRadius, 1.0, stompRadius),
                TelegraphConstructEntity::isSurvivalTarget)) {
            double dx = player.getX() - stompCenter.x;
            double dz = player.getZ() - stompCenter.z;
            // Jump the impact, leave the clearly marked circle, or use solid cover.
            if (dx * dx + dz * dz > stompRadius * stompRadius
                    || !player.isOnGround() || Math.abs(player.getY() - stompCenter.y) > 1.3
                    || !canSee(player)) continue;
            if (player.damage(getDamageSources().mobAttack(this), isEnraged() ? 11.0F : 9.0F)) {
                player.takeKnockback(0.8, -dx, -dz);
            }
        }
    }

    @Override
    public void onStartedTrackingBy(ServerPlayerEntity player) {
        super.onStartedTrackingBy(player);
        if (isSurvivalTarget(player)) bossBar.addPlayer(player);
    }

    @Override
    public void onStoppedTrackingBy(ServerPlayerEntity player) {
        super.onStoppedTrackingBy(player);
        bossBar.removePlayer(player);
    }

    @Override
    public void onDeath(DamageSource source) {
        bossBar.clearPlayers();
        super.onDeath(source);
    }

    @Override
    public void remove(Entity.RemovalReason reason) {
        bossBar.clearPlayers();
        super.remove(reason);
    }

    @Override
    protected net.minecraft.sound.SoundEvent getDeathSound() {
        return SoundEvents.ENTITY_IRON_GOLEM_DEATH;
    }
}
