package io.github.afuerta.starfall.event;

import io.github.afuerta.starfall.StarfallConfig;
import io.github.afuerta.starfall.util.StarfallUtil;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.registry.RegistryKey;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.text.Text;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.MathHelper;
import net.minecraft.util.math.Vec3d;
import net.minecraft.world.Heightmap;
import net.minecraft.world.World;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/** Two-second particle meteors and bounded, once-per-night shower events. */
public final class FallingStarManager {
    public static final int FALL_TICKS = 40;
    private static final int MAX_INCOMING = 8;
    private static final List<IncomingStar> INCOMING = new ArrayList<>();
    private static final Map<RegistryKey<World>, NightState> NIGHTS = new HashMap<>();
    public static void tick(ServerWorld world) {
        tickIncoming(world);
        if (!world.getRegistryKey().equals(World.OVERWORLD)) return;
        var config = StarfallConfig.INSTANCE;
        NightState night = state(world);
        long day = Math.floorDiv(world.getTimeOfDay(), 24000);
        if (night.day != day) {
            night.day = day;
            night.checked = false;
            night.shower = false;
            night.launched = 0;
        }
        if (!StarfallUtil.isNight(world)) {
            if (night.shower) {
                night.shower = false;
                announce(world, "message.starfall.shower_ended");
            }
            return;
        }
        if (world.getTime() % 20 != 0 || !config.falling_stars.enabled) return;
        if (config.falling_stars.require_clear_sky && world.isRaining()) return;
        if (!night.checked) {
            night.checked = true;
            if (config.showers.enabled && world.random.nextInt(config.showers.chance_per_night) == 0) startShower(world);
        }
        if (night.launched >= config.showers.max_impacts_per_night) return;
        int chance = Math.max(1, config.falling_stars.chance_per_second / (night.shower ? config.showers.multiplier : 1));
        for (var player : world.getPlayers()) {
            if (night.launched >= config.showers.max_impacts_per_night) break;
            if (!player.isSpectator() && world.random.nextInt(chance) == 0) launchStarNear(world, player.getPos());
        }
    }
    public static boolean startShower(ServerWorld world) {
        if (!world.getRegistryKey().equals(World.OVERWORLD) || !StarfallUtil.isNight(world)
                || world.isRaining() || !StarfallConfig.INSTANCE.falling_stars.enabled || !StarfallConfig.INSTANCE.showers.enabled) return false;
        NightState night = state(world);
        long day = Math.floorDiv(world.getTimeOfDay(), 24000);
        if (night.day != day) { night.day = day; night.launched = 0; }
        if (night.shower) return false;
        night.checked = true;
        night.shower = true;
        announce(world, "message.starfall.shower_started");
        return true;
    }
    private static void announce(ServerWorld world, String key) {
        for (var player : world.getPlayers()) player.sendMessage(Text.translatable(key), false);
    }
    public static boolean launchStarNear(ServerWorld world, Vec3d center) {
        var config = StarfallConfig.INSTANCE.falling_stars;
        for (int attempt = 0; attempt < 6; attempt++) {
            double angle = world.random.nextDouble() * Math.PI * 2;
            double distance = config.min_distance + world.random.nextDouble() * (config.max_distance - config.min_distance);
            if (launchStarAt(world, MathHelper.floor(center.x + Math.cos(angle) * distance),
                    MathHelper.floor(center.z + Math.sin(angle) * distance))) return true;
        }
        return false;
    }
    public static boolean launchStarAt(ServerWorld world, int x, int z) {
        NightState night = state(world);
        if (INCOMING.size() >= MAX_INCOMING || night.launched >= StarfallConfig.INSTANCE.showers.max_impacts_per_night) return false;
        BlockPos ground = findGround(world, x, z);
        int radius = StarImpact.rollRadius(world.random);
        if (ground == null || !StarImpact.canImpact(world, ground, radius)) return false;
        // One impact per column at a time; avoid repeated volleys at the same spot.
        for (var incoming : INCOMING) if (incoming.dimension.equals(world.getRegistryKey())
                && incoming.x == x && incoming.z == z) return false;
        Vec3d end = ground.up().toCenterPos();
        double angle = world.random.nextDouble() * Math.PI * 2;
        Vec3d start = end.add(Math.cos(angle) * 48, 90, Math.sin(angle) * 48);
        INCOMING.add(new IncomingStar(world.getRegistryKey(), x, z, radius, start, end));
        night.launched++;
        for (var player : world.getPlayers()) {
            if (player.squaredDistanceTo(end) < 192 * 192) player.sendMessage(Text.translatable(
                    "message.starfall.star_falling", StarfallUtil.direction(end.x - player.getX(), end.z - player.getZ())), true);
        }
        return true;
    }
    public static BlockPos findGround(ServerWorld world, int x, int z) {
        if (world.getDimension().hasCeiling() || !world.isChunkLoaded(x >> 4, z >> 4)) return null;
        int top = world.getTopY(Heightmap.Type.MOTION_BLOCKING_NO_LEAVES, x, z);
        if (top <= world.getBottomY() + 3) return null;
        BlockPos ground = new BlockPos(x, top - 1, z);
        return StarImpact.canReplace(world, ground) ? ground : null;
    }
    private static void tickIncoming(ServerWorld world) {
        Iterator<IncomingStar> iterator = INCOMING.iterator();
        while (iterator.hasNext()) {
            IncomingStar star = iterator.next();
            if (!star.dimension.equals(world.getRegistryKey())) continue;
            star.age++;
            for (int i = 0; i < 3; i++) {
                Vec3d point = star.start.lerp(star.end, Math.min(1, (star.age - 1 + i / 3.0) / FALL_TICKS));
                for (var player : world.getPlayers()) if (player.squaredDistanceTo(point) < 320 * 320) {
                    world.spawnParticles(player, ParticleTypes.END_ROD, true, point.x, point.y, point.z, 2, .15, .15, .15, .01);
                }
            }
            if (star.age >= FALL_TICKS) {
                iterator.remove();
                BlockPos ground = findGround(world, star.x, star.z);
                if (ground != null) StarImpact.impact(world, ground, star.radius);
            }
        }
    }
    public static int incomingCount() { return INCOMING.size(); }
    public static int launchedCount(ServerWorld world) { return state(world).launched; }
    public static boolean isShower(ServerWorld world) { return state(world).shower; }
    public static void clear() { INCOMING.clear(); NIGHTS.clear(); }
    private static NightState state(ServerWorld world) { return NIGHTS.computeIfAbsent(world.getRegistryKey(), key -> new NightState()); }
    private static final class NightState { long day = Long.MIN_VALUE; boolean checked; boolean shower; int launched; }
    private static final class IncomingStar {
        final RegistryKey<World> dimension;
        final int x, z, radius;
        final Vec3d start, end;
        int age;
        IncomingStar(RegistryKey<World> dimension, int x, int z, int radius, Vec3d start, Vec3d end) {
            this.dimension = dimension; this.x = x; this.z = z; this.radius = radius; this.start = start; this.end = end;
        }
    }
    private FallingStarManager() {}
}
