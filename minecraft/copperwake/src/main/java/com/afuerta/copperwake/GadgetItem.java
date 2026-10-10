package com.afuerta.copperwake;

import com.afuerta.copperwake.entity.ConstructRegistry;
import net.minecraft.entity.SpawnReason;
import net.minecraft.entity.mob.HostileEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.item.tooltip.TooltipType;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.sound.SoundCategory;
import net.minecraft.sound.SoundEvents;
import net.minecraft.text.Text;
import net.minecraft.util.Formatting;
import net.minecraft.util.Hand;
import net.minecraft.util.TypedActionResult;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.Vec3d;
import net.minecraft.world.Difficulty;
import net.minecraft.world.World;

import java.util.List;

final class GadgetItem extends Item {
    enum Action { JOURNAL, TRAVEL, ARC, SPRING, HEAL, SUMMON }
    private final String id;
    private final Action action;

    GadgetItem(Settings settings, String id, Action action) { super(settings); this.id = id; this.action = action; }

    @Override public void appendTooltip(ItemStack stack, TooltipContext context, List<Text> tooltip, TooltipType type) {
        tooltip.add(Text.translatable("tooltip.copperwake." + id));
    }

    @Override public TypedActionResult<ItemStack> use(World world, PlayerEntity user, Hand hand) {
        ItemStack stack = user.getStackInHand(hand);
        if (world.isClient) return TypedActionResult.success(stack);
        if (!(user instanceof ServerPlayerEntity player) || player.isSpectator() || !player.isAlive()
                || player.getItemCooldownManager().isCoolingDown(this)) return TypedActionResult.fail(stack);
        boolean success = switch (action) {
            case JOURNAL -> { SalvageGuild.journal(player); yield true; }
            case TRAVEL -> RustwildTravel.useKey(player);
            case ARC -> arc(player);
            case SPRING -> spring(player);
            case HEAL -> heal(player, stack);
            case SUMMON -> summon(player, stack);
        };
        return success ? TypedActionResult.success(stack) : TypedActionResult.fail(stack);
    }

    private boolean requireRank(ServerPlayerEntity player, int rank) {
        if (SalvageGuild.rankAtLeast(player, rank)) return true;
        SalvageGuild.say(player, rank == 1 ? "Mechanist rank required: complete 4 guild contracts."
                : "Artificer rank required: complete 12 guild contracts.", Formatting.YELLOW);
        return false;
    }

    private boolean fuel(ServerPlayerEntity player) {
        if (SalvageGuild.consume(player, ModContent.SCRAP, 1)) return true;
        SalvageGuild.say(player, "You need one Scrap to power this device.", Formatting.YELLOW);
        return false;
    }

    private boolean arc(ServerPlayerEntity player) {
        if (!requireRank(player, 1)) return false;
        ServerWorld world = player.getServerWorld();
        var targets = world.getEntitiesByClass(HostileEntity.class, player.getBoundingBox().expand(6),
                target -> target.isAlive() && player.squaredDistanceTo(target) <= 36 && player.canSee(target));
        if (targets.isEmpty()) { SalvageGuild.say(player, "No visible hostile within six blocks.", Formatting.GRAY); return false; }
        if (!fuel(player)) return false;
        targets.sort(java.util.Comparator.comparingDouble(player::squaredDistanceTo));
        for (var target : targets.stream().limit(5).toList()) {
            target.damage(world.getDamageSources().playerAttack(player), 6.0f);
            Vec3d from = player.getEyePos();
            Vec3d ray = target.getPos().add(0, target.getHeight() * 0.5, 0).subtract(from);
            for (int step = 0; step <= 12; step++) {
                Vec3d point = from.add(ray.multiply(step / 12.0));
                world.spawnParticles(ParticleTypes.ELECTRIC_SPARK, point.x, point.y, point.z, 2, 0.04, 0.04, 0.04, 0);
            }
        }
        player.getItemCooldownManager().set(this, 60);
        world.playSound(null, player.getBlockPos(), SoundEvents.BLOCK_RESPAWN_ANCHOR_CHARGE, SoundCategory.PLAYERS, 0.7f, 1.7f);
        return true;
    }

    private boolean spring(ServerPlayerEntity player) {
        if (!requireRank(player, 1)) return false;
        if (!player.isOnGround() || player.hasVehicle() || player.isFallFlying()) {
            SalvageGuild.say(player, "Stand on the ground before firing the springs.", Formatting.GRAY); return false;
        }
        if (!fuel(player)) return false;
        Vec3d facing = player.getRotationVec(1);
        Vec3d flat = new Vec3d(facing.x, 0, facing.z).normalize().multiply(1.05);
        player.setVelocity(flat.x, 0.55, flat.z);
        player.velocityModified = true;
        player.getItemCooldownManager().set(this, 80);
        player.getServerWorld().spawnParticles(ParticleTypes.CLOUD, player.getX(), player.getY(), player.getZ(), 12, 0.3, 0.1, 0.3, 0.02);
        player.getServerWorld().playSound(null, player.getBlockPos(), SoundEvents.BLOCK_PISTON_EXTEND, SoundCategory.PLAYERS, 0.8f, 1.4f);
        return true;
    }

    private boolean heal(ServerPlayerEntity player, ItemStack stack) {
        if (player.getHealth() >= player.getMaxHealth()) return false;
        player.heal(4.0f);
        if (!player.isCreative()) stack.decrement(1);
        player.getItemCooldownManager().set(this, 100);
        player.getServerWorld().spawnParticles(ParticleTypes.HAPPY_VILLAGER, player.getX(), player.getY() + 1, player.getZ(), 8, 0.3, 0.3, 0.3, 0);
        return true;
    }

    private boolean summon(ServerPlayerEntity player, ItemStack stack) {
        if (!requireRank(player, 2)) return false;
        ServerWorld world = player.getServerWorld();
        if (!world.getRegistryKey().equals(RustwildTravel.RUSTWILD) || world.getDifficulty() == Difficulty.PEACEFUL) {
            SalvageGuild.say(player, "Use the seal in the Rustwild on Easy, Normal or Hard difficulty.", Formatting.YELLOW); return false;
        }
        if (!world.getEntitiesByType(ConstructRegistry.FOUNDRY_FOREMAN, player.getBoundingBox().expand(96), entity -> entity.isAlive()).isEmpty()) {
            SalvageGuild.say(player, "A Foundry Foreman is already awake nearby.", Formatting.YELLOW); return false;
        }
        var boss = ConstructRegistry.FOUNDRY_FOREMAN.create(world);
        if (boss == null) return false;
        BlockPos spawn = null;
        for (int direction = 0; direction < 8; direction++) {
            double angle = direction * Math.PI / 4;
            BlockPos candidate = player.getBlockPos().add((int) Math.round(Math.cos(angle) * 7), 0,
                    (int) Math.round(Math.sin(angle) * 7));
            boss.refreshPositionAndAngles(candidate.getX() + 0.5, candidate.getY(), candidate.getZ() + 0.5, player.getYaw(), 0);
            if (world.getWorldBorder().contains(candidate) && flatFooting(world, candidate)
                    && world.isSpaceEmpty(boss) && !world.containsFluid(boss.getBoundingBox())) { spawn = candidate; break; }
        }
        if (spawn == null) {
            boss.discard();
            SalvageGuild.say(player, "Find a flat clearing: the Foreman needs a solid 3×3 floor and four blocks of headroom, seven blocks away.", Formatting.YELLOW);
            return false;
        }
        boss.initialize(world, world.getLocalDifficulty(spawn), SpawnReason.TRIGGERED, null);
        boss.setPersistent();
        boss.setTarget(player);
        if (!world.spawnEntity(boss)) { boss.discard(); return false; }
        if (!player.isCreative()) stack.decrement(1);
        player.getItemCooldownManager().set(this, 200);
        world.spawnParticles(ParticleTypes.CAMPFIRE_COSY_SMOKE, boss.getX(), boss.getY() + 1, boss.getZ(), 24, 0.8, 1.2, 0.8, 0.04);
        SalvageGuild.say(player, "The Foundry Foreman wakes. Watch its windup, leave the marked ground, then strike during recovery.", Formatting.GOLD);
        return true;
    }

    private static boolean flatFooting(ServerWorld world, BlockPos center) {
        for (int x = -1; x <= 1; x++) for (int z = -1; z <= 1; z++) {
            BlockPos below = center.add(x, -1, z);
            if (!world.getBlockState(below).isSolidBlock(world, below)) return false;
        }
        return true;
    }
}
