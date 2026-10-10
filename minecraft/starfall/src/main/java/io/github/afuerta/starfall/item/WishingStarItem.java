package io.github.afuerta.starfall.item;

import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.effect.StatusEffect;
import net.minecraft.entity.effect.StatusEffectInstance;
import net.minecraft.entity.effect.StatusEffects;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.item.tooltip.TooltipType;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.registry.entry.RegistryEntry;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.sound.SoundCategory;
import net.minecraft.sound.SoundEvents;
import net.minecraft.stat.Stats;
import net.minecraft.text.Text;
import net.minecraft.util.Hand;
import net.minecraft.util.TypedActionResult;
import net.minecraft.util.math.random.Random;
import net.minecraft.world.World;
import java.util.List;

/** Consumable wish: twelve helpful outcomes, three minutes, ten percent stronger. */
public final class WishingStarItem extends Item {
    public static final int WISH_DURATION_TICKS = 3600;
    public static final List<RegistryEntry<StatusEffect>> WISHES = List.of(StatusEffects.SPEED, StatusEffects.HASTE,
            StatusEffects.STRENGTH, StatusEffects.JUMP_BOOST, StatusEffects.REGENERATION, StatusEffects.RESISTANCE,
            StatusEffects.FIRE_RESISTANCE, StatusEffects.WATER_BREATHING, StatusEffects.NIGHT_VISION,
            StatusEffects.ABSORPTION, StatusEffects.LUCK, StatusEffects.SLOW_FALLING);
    public WishingStarItem(Settings settings) { super(settings); }
    @Override public TypedActionResult<ItemStack> use(World world, PlayerEntity player, Hand hand) {
        ItemStack stack = player.getStackInHand(hand);
        if (stack.isEmpty() || player.getItemCooldownManager().isCoolingDown(this)) return TypedActionResult.fail(stack);
        if (world instanceof ServerWorld server) {
            var effect = grantWish(player, server.random);
            player.sendMessage(Text.translatable("message.starfall.wish_granted", effect.value().getName()), true);
            server.playSound(null, player.getBlockPos(), SoundEvents.BLOCK_AMETHYST_BLOCK_CHIME,
                    SoundCategory.PLAYERS, 1, 1.2F);
            server.spawnParticles(ParticleTypes.TOTEM_OF_UNDYING, player.getX(), player.getY() + 1, player.getZ(),
                    30, .5, .8, .5, .2);
            player.incrementStat(Stats.USED.getOrCreateStat(this));
            if (!player.isCreative()) stack.decrement(1);
            player.getItemCooldownManager().set(this, 20);
        }
        return TypedActionResult.success(stack, world.isClient);
    }
    public static RegistryEntry<StatusEffect> grantWish(LivingEntity entity, Random random) {
        var effect = WISHES.get(random.nextInt(WISHES.size()));
        entity.addStatusEffect(new StatusEffectInstance(effect, WISH_DURATION_TICKS, random.nextInt(10) == 0 ? 1 : 0));
        return effect;
    }
    @Override public boolean hasGlint(ItemStack stack) { return true; }
    @Override public void appendTooltip(ItemStack stack, TooltipContext context, List<Text> tooltip, TooltipType type) {
        tooltip.add(Text.translatable("tooltip.starfall.wishing_star"));
    }
}
