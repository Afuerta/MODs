package com.afuerta.riftbound.mixin;

import com.afuerta.riftbound.RiftboundMod;
import net.minecraft.entity.mob.HostileEntity;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

/** HostileEntity overrides LivingEntity's XP predicate, so its override needs its own guard. */
@Mixin(HostileEntity.class)
abstract class TrialHostileXpMixin {
    @Inject(method = "shouldDropXp", at = @At("HEAD"), cancellable = true)
    private void riftbound$noHostileTrialXp(CallbackInfoReturnable<Boolean> cir) {
        if (((HostileEntity) (Object) this).getCommandTags().contains(RiftboundMod.TRIAL_MOB_TAG)) {
            cir.setReturnValue(false);
        }
    }
}
