package com.afuerta.riftbound.mixin;

import com.afuerta.riftbound.RiftboundMod;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.damage.DamageSource;
import net.minecraft.server.world.ServerWorld;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

/** Only rift-managed enemies lose ordinary loot/XP; all vanilla mobs retain normal drops. */
@Mixin(LivingEntity.class)
abstract class TrialLootMixin {
    @Inject(method = "drop", at = @At("HEAD"), cancellable = true)
    private void riftbound$noTrialLoot(ServerWorld world, DamageSource source, CallbackInfo ci) {
        if (((LivingEntity) (Object) this).getCommandTags().contains(RiftboundMod.TRIAL_MOB_TAG)) ci.cancel();
    }

    @Inject(method = "shouldDropXp", at = @At("HEAD"), cancellable = true)
    private void riftbound$noTrialXp(CallbackInfoReturnable<Boolean> cir) {
        if (((LivingEntity) (Object) this).getCommandTags().contains(RiftboundMod.TRIAL_MOB_TAG)) cir.setReturnValue(false);
    }
}
