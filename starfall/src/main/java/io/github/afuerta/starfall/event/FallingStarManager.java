package io.github.afuerta.starfall.event;

import io.github.afuerta.starfall.StarfallConfig;
import io.github.afuerta.starfall.util.StarfallUtil;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import net.minecraft.core.BlockPos;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.ResourceKey;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.util.Mth;
import net.minecraft.util.RandomSource;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.levelgen.Heightmap;
import net.minecraft.world.phys.Vec3;
import net.neoforged.neoforge.event.server.ServerStoppedEvent;
import net.neoforged.neoforge.event.tick.LevelTickEvent;

/**
 * Drives the falling-star night event.
 *
 * <p>Every second of night, each player has a configurable chance of a star being launched toward
 * the ground somewhere 24-64 blocks away. The star streaks down over two seconds (drawn with
 * long-distance particles so it is visible from far away) and then {@link StarImpact} carves a
 * crater with a {@code fallen_star} block at its heart.
 *
 * <p>Backlog: replace the particle streak with a real FallingStarEntity + renderer, and persist
 * in-flight stars and recent impacts in SavedData (for the Star Compass).
 */
public final class FallingStarManager {
    /** How long a star takes to fall, in ticks. */
    public static final int FALL_TICKS = 40;
    private static final double NOTIFY_RANGE = 192.0;
    private static final double PARTICLE_RANGE = 320.0;

    private static final List<IncomingStar> INCOMING = new ArrayList<>();

    public static void onLevelTick(LevelTickEvent.Post event) {
        if (!(event.getLevel() instanceof ServerLevel level)) {
            return;
        }
        tickIncoming(level);

        if (!StarfallConfig.FALLING_STARS_ENABLED.get() || !Level.OVERWORLD.equals(level.dimension())) {
            return;
        }
        if (level.getGameTime() % 20L != 0L || !StarfallUtil.isNight(level)) {
            return;
        }
        if (StarfallConfig.REQUIRE_CLEAR_SKY.get() && level.isRaining()) {
            return;
        }
        int chance = StarfallConfig.STAR_CHANCE.get();
        for (ServerPlayer player : level.players()) {
            if (!player.isSpectator() && level.random.nextInt(chance) == 0) {
                launchStarNear(level, player.position());
            }
        }
    }

    public static void onServerStopped(ServerStoppedEvent event) {
        INCOMING.clear();
    }

    /** Launches a star at a random spot 24-64 blocks (configurable) from {@code center}. */
    public static boolean launchStarNear(ServerLevel level, Vec3 center) {
        RandomSource random = level.random;
        int min = StarfallConfig.MIN_DISTANCE.get();
        int max = Math.max(min, StarfallConfig.MAX_DISTANCE.get());
        double angle = random.nextDouble() * Math.PI * 2.0;
        double distance = min + random.nextDouble() * (max - min);
        int x = Mth.floor(center.x + Math.cos(angle) * distance);
        int z = Mth.floor(center.z + Math.sin(angle) * distance);
        return launchStarAt(level, x, z);
    }

    /**
     * Launches a star that will land on the surface at column (x, z).
     *
     * @return false if the column is unloaded or the surface is water/lava
     */
    public static boolean launchStarAt(ServerLevel level, int x, int z) {
        BlockPos ground = findGround(level, x, z);
        if (ground == null) {
            return false;
        }
        double angle = level.random.nextDouble() * Math.PI * 2.0;
        Vec3 end = Vec3.atCenterOf(ground.above());
        Vec3 start = end.add(Math.cos(angle) * 48.0, 90.0, Math.sin(angle) * 48.0);
        INCOMING.add(new IncomingStar(level.dimension(), x, z, start, end));

        for (ServerPlayer player : level.players()) {
            if (player.distanceToSqr(end) < NOTIFY_RANGE * NOTIFY_RANGE) {
                Component direction = StarfallUtil.direction(end.x - player.getX(), end.z - player.getZ());
                player.displayClientMessage(Component.translatable("message.starfall.star_falling", direction), true);
            }
        }
        return true;
    }

    /**
     * The top solid block of column (x, z), or null if the column is not loaded or the surface is
     * a fluid (stars that hit water fizzle out).
     */
    public static BlockPos findGround(ServerLevel level, int x, int z) {
        if (level.dimensionType().hasCeiling()) {
            return null; // e.g. the Nether: the heightmap would hit the bedrock roof
        }
        BlockPos column = new BlockPos(x, level.getMinBuildHeight(), z);
        if (!level.isLoaded(column)) {
            return null;
        }
        int surface = level.getHeight(Heightmap.Types.MOTION_BLOCKING_NO_LEAVES, x, z);
        if (surface <= level.getMinBuildHeight() + 2) {
            return null;
        }
        BlockPos ground = new BlockPos(x, surface - 1, z);
        if (!level.getFluidState(ground).isEmpty()) {
            return null;
        }
        return ground;
    }

    /** Number of stars currently in flight (all dimensions). */
    public static int incomingCount() {
        return INCOMING.size();
    }

    private static void tickIncoming(ServerLevel level) {
        if (INCOMING.isEmpty()) {
            return;
        }
        Iterator<IncomingStar> iterator = INCOMING.iterator();
        while (iterator.hasNext()) {
            IncomingStar star = iterator.next();
            if (!star.dimension.equals(level.dimension())) {
                continue;
            }
            star.age++;
            drawStreak(level, star);
            if (star.age >= FALL_TICKS) {
                iterator.remove();
                BlockPos ground = findGround(level, star.x, star.z);
                if (ground != null) {
                    StarImpact.impact(level, ground, StarImpact.rollRadius(level.random));
                }
            }
        }
    }

    private static void drawStreak(ServerLevel level, IncomingStar star) {
        // Three interpolated points per tick keep the streak continuous at ~2 blocks/tick.
        for (int i = 0; i < 3; i++) {
            double t = Math.min(1.0, (star.age - 1 + i / 3.0) / FALL_TICKS);
            Vec3 p = star.start.lerp(star.end, t);
            for (ServerPlayer player : level.players()) {
                if (player.distanceToSqr(p) < PARTICLE_RANGE * PARTICLE_RANGE) {
                    level.sendParticles(player, ParticleTypes.END_ROD, true, p.x, p.y, p.z, 2, 0.15, 0.15, 0.15, 0.01);
                    if (i == 0) {
                        level.sendParticles(player, ParticleTypes.FIREWORK, true, p.x, p.y, p.z, 1, 0.1, 0.1, 0.1, 0.0);
                    }
                }
            }
        }
    }

    private static final class IncomingStar {
        final ResourceKey<Level> dimension;
        final int x;
        final int z;
        final Vec3 start;
        final Vec3 end;
        int age;

        IncomingStar(ResourceKey<Level> dimension, int x, int z, Vec3 start, Vec3 end) {
            this.dimension = dimension;
            this.x = x;
            this.z = z;
            this.start = start;
            this.end = end;
        }
    }

    private FallingStarManager() {
    }
}
