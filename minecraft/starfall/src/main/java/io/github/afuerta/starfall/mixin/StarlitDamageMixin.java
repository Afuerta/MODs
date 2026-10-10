package io.github.afuerta.starfall.mixin;

import io.github.afuerta.starfall.registry.ModTags;
import io.github.afuerta.starfall.util.StarfallUtil;
import net.minecraft.entity.player.PlayerEntity;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.ModifyArg;

/** Apply only to the primary vanilla melee strike, never arbitrary player-attributed mod damage. */
@Mixin(PlayerEntity.class)
public abstract class StarlitDamageMixin {
    @ModifyArg(method = "attack", at = @At(value = "INVOKE",
            target = "Lnet/minecraft/entity/Entity;damage(Lnet/minecraft/entity/damage/DamageSource;F)Z"), index = 1)
    private float starfall$melee(float amount) {
        PlayerEntity player = (PlayerEntity) (Object) this;
        return player.getMainHandStack().isIn(ModTags.STARLIT_TOOLS) && StarfallUtil.isStarlit(player)
                ? amount * 1.25F : amount;
    }
}
