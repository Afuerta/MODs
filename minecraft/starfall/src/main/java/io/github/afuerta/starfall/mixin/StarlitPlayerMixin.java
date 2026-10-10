package io.github.afuerta.starfall.mixin;

import io.github.afuerta.starfall.registry.ModTags;
import io.github.afuerta.starfall.util.StarfallUtil;
import net.minecraft.block.BlockState;
import net.minecraft.entity.player.PlayerEntity;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

/** Clear-night mining multiplier; no potion effect leaks when changing equipment. */
@Mixin(PlayerEntity.class)
public abstract class StarlitPlayerMixin {
    @Inject(method = "getBlockBreakingSpeed", at = @At("RETURN"), cancellable = true)
    private void starfall$mining(BlockState state, CallbackInfoReturnable<Float> callback) {
        PlayerEntity player = (PlayerEntity) (Object) this;
        if (player.getMainHandStack().isIn(ModTags.STARLIT_TOOLS) && StarfallUtil.isStarlit(player)) {
            callback.setReturnValue(callback.getReturnValueF() * 1.5F);
        }
    }
}
