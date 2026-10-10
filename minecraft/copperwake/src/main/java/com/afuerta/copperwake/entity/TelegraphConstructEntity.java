package com.afuerta.copperwake.entity;

import java.util.EnumSet;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.ai.goal.ActiveTargetGoal;
import net.minecraft.entity.ai.goal.Goal;
import net.minecraft.entity.ai.goal.LookAroundGoal;
import net.minecraft.entity.ai.goal.LookAtEntityGoal;
import net.minecraft.entity.ai.goal.SwimGoal;
import net.minecraft.entity.ai.goal.WanderAroundFarGoal;
import net.minecraft.entity.damage.DamageSource;
import net.minecraft.entity.data.DataTracker;
import net.minecraft.entity.data.TrackedData;
import net.minecraft.entity.data.TrackedDataHandlerRegistry;
import net.minecraft.entity.mob.HostileEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.particle.ParticleEffect;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.sound.SoundEvent;
import net.minecraft.sound.SoundEvents;
import net.minecraft.util.math.Vec3d;
import net.minecraft.world.World;

/** Shared targeting and synchronized windup. Damage is only performed by server combat ticks. */
public abstract class TelegraphConstructEntity extends HostileEntity {
    private static final TrackedData<Integer> ATTACK_WINDUP = DataTracker.registerData(
            TelegraphConstructEntity.class, TrackedDataHandlerRegistry.INTEGER);
    protected int attackCooldown = 30;

    protected TelegraphConstructEntity(EntityType<? extends HostileEntity> type, World world) {
        super(type, world);
    }

    @Override
    protected void initDataTracker(DataTracker.Builder builder) {
        super.initDataTracker(builder);
        builder.add(ATTACK_WINDUP, 0);
    }

    public final int getAttackWindup() {
        return dataTracker.get(ATTACK_WINDUP);
    }

    protected final void setAttackWindup(int ticks) {
        dataTracker.set(ATTACK_WINDUP, Math.max(0, ticks));
    }

    public static boolean isSurvivalTarget(LivingEntity target) {
        return target instanceof PlayerEntity player && player.isAlive()
                && !player.isCreative() && !player.isSpectator();
    }

    @Override
    protected void initGoals() {
        goalSelector.add(0, new SwimGoal(this));
        goalSelector.add(1, new ApproachTargetGoal());
        goalSelector.add(3, new WanderAroundFarGoal(this, 0.65));
        goalSelector.add(4, new LookAtEntityGoal(this, PlayerEntity.class, 10.0F));
        goalSelector.add(5, new LookAroundGoal(this));
        targetSelector.add(1, new ActiveTargetGoal<>(this, PlayerEntity.class,
                10, true, false, TelegraphConstructEntity::isSurvivalTarget));
    }

    @Override
    public void tick() {
        super.tick();
        if (!(getWorld() instanceof ServerWorld server) || !isAlive()) return;
        if (attackCooldown > 0) attackCooldown--;
        LivingEntity target = getTarget();
        if (!isSurvivalTarget(target) || squaredDistanceTo(target) > 48.0 * 48.0) {
            if (target != null) setTarget(null);
            setAttackWindup(0);
            onCombatCancelled();
            return;
        }
        combatTick(server, (PlayerEntity) target);
    }

    protected abstract void combatTick(ServerWorld world, PlayerEntity target);

    protected void onCombatCancelled() {}

    protected double pursuitSpeed() {
        return 1.0;
    }

    protected double desiredDistance() {
        return 1.2;
    }

    protected boolean mayPursue() {
        return getAttackWindup() == 0;
    }

    protected static void particleRing(ServerWorld world, ParticleEffect effect,
                                       Vec3d center, double radius, int points) {
        for (int i = 0; i < points; i++) {
            double angle = i * Math.PI * 2.0 / points;
            world.spawnParticles(effect, center.x + Math.cos(angle) * radius,
                    center.y + 0.12, center.z + Math.sin(angle) * radius,
                    1, 0.0, 0.02, 0.0, 0.0);
        }
    }

    @Override
    protected SoundEvent getHurtSound(DamageSource source) {
        return SoundEvents.ENTITY_IRON_GOLEM_HURT;
    }

    @Override
    protected SoundEvent getDeathSound() {
        return SoundEvents.BLOCK_CHAIN_BREAK;
    }

    private final class ApproachTargetGoal extends Goal {
        private int repathTicks;

        private ApproachTargetGoal() {
            setControls(EnumSet.of(Control.MOVE, Control.LOOK));
        }

        @Override
        public boolean canStart() {
            return isSurvivalTarget(getTarget());
        }

        @Override
        public boolean shouldContinue() {
            return canStart();
        }

        @Override
        public boolean shouldRunEveryTick() {
            return true;
        }

        @Override
        public void tick() {
            LivingEntity target = getTarget();
            if (!isSurvivalTarget(target)) return;
            getLookControl().lookAt(target, 30.0F, 30.0F);
            if (!mayPursue() || squaredDistanceTo(target) <= desiredDistance() * desiredDistance()) {
                getNavigation().stop();
                return;
            }
            if (--repathTicks <= 0) {
                repathTicks = 10;
                getNavigation().startMovingTo(target, pursuitSpeed());
            }
        }

        @Override
        public void stop() {
            getNavigation().stop();
            repathTicks = 0;
        }
    }
}
