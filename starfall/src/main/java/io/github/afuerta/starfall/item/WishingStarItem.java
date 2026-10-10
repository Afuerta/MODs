package io.github.afuerta.starfall.item;

import java.util.List;
import net.minecraft.ChatFormatting;
import net.minecraft.core.Holder;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.stats.Stats;
import net.minecraft.util.RandomSource;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResultHolder;
import net.minecraft.world.effect.MobEffect;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.effect.MobEffects;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.TooltipFlag;
import net.minecraft.world.level.Level;

/**
 * Right-click to make a wish: grants one random helpful effect for three minutes (10% chance of
 * level II). Found in fallen stars or crafted from stardust and gold.
 */
public class WishingStarItem extends Item {
    public static final int WISH_DURATION_TICKS = 20 * 180;

    /** Possible wishes. Issue backlog: make this a data-driven JSON table. */
    public static final List<Holder<MobEffect>> WISHES = List.of(
            MobEffects.MOVEMENT_SPEED,
            MobEffects.DIG_SPEED,
            MobEffects.DAMAGE_BOOST,
            MobEffects.JUMP,
            MobEffects.REGENERATION,
            MobEffects.DAMAGE_RESISTANCE,
            MobEffects.FIRE_RESISTANCE,
            MobEffects.WATER_BREATHING,
            MobEffects.NIGHT_VISION,
            MobEffects.ABSORPTION,
            MobEffects.LUCK,
            MobEffects.SLOW_FALLING);

    public WishingStarItem(Properties properties) {
        super(properties);
    }

    @Override
    public InteractionResultHolder<ItemStack> use(Level level, Player player, InteractionHand hand) {
        ItemStack stack = player.getItemInHand(hand);
        if (level instanceof ServerLevel serverLevel) {
            Holder<MobEffect> wish = grantWish(player, serverLevel.getRandom());
            player.displayClientMessage(
                    Component.translatable("message.starfall.wish_granted", wish.value().getDisplayName())
                            .withStyle(ChatFormatting.GOLD),
                    true);
            serverLevel.playSound(null, player.blockPosition(), SoundEvents.AMETHYST_BLOCK_CHIME,
                    SoundSource.PLAYERS, 1.0F, 1.2F);
            serverLevel.sendParticles(ParticleTypes.TOTEM_OF_UNDYING, player.getX(), player.getY() + 1.0, player.getZ(),
                    30, 0.5, 0.8, 0.5, 0.2);
            player.awardStat(Stats.ITEM_USED.get(this));
            if (!player.getAbilities().instabuild) {
                stack.shrink(1);
            }
        }
        player.getCooldowns().addCooldown(this, 20);
        return InteractionResultHolder.sidedSuccess(stack, level.isClientSide());
    }

    /** Applies a random wish to {@code entity} and returns the effect that was granted. */
    public static Holder<MobEffect> grantWish(LivingEntity entity, RandomSource random) {
        Holder<MobEffect> effect = WISHES.get(random.nextInt(WISHES.size()));
        int amplifier = random.nextInt(10) == 0 ? 1 : 0;
        entity.addEffect(new MobEffectInstance(effect, WISH_DURATION_TICKS, amplifier));
        return effect;
    }

    @Override
    public boolean isFoil(ItemStack stack) {
        return true;
    }

    @Override
    public void appendHoverText(ItemStack stack, TooltipContext context, List<Component> tooltip, TooltipFlag flag) {
        tooltip.add(Component.translatable("tooltip.starfall.wishing_star").withStyle(ChatFormatting.GRAY));
        super.appendHoverText(stack, context, tooltip, flag);
    }
}
