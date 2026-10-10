package io.github.afuerta.starfall.util;

import net.minecraft.core.BlockPos;
import net.minecraft.network.chat.Component;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.level.Level;

public final class StarfallUtil {
    private static final String[] DIRECTIONS = {
            "north", "north_east", "east", "south_east", "south", "south_west", "west", "north_west"
    };

    /** True between dusk (13000) and dawn (23000) in dimensions with a day/night cycle. */
    public static boolean isNight(Level level) {
        if (level.dimensionType().hasFixedTime()) {
            return false;
        }
        long time = Math.floorMod(level.getDayTime(), 24000L);
        return time >= 13000L && time < 23000L;
    }

    /** "Starlit": night time, clear weather, and the entity can see the sky. */
    public static boolean isStarlit(Entity entity) {
        Level level = entity.level();
        return isNight(level)
                && !level.isRaining()
                && level.canSeeSky(BlockPos.containing(entity.getEyePosition()));
    }

    /**
     * Translatable compass direction ("north", "south-east", ...) for an offset. Minecraft's
     * north is -Z and east is +X.
     */
    public static Component direction(double dx, double dz) {
        double degrees = Math.toDegrees(Math.atan2(dx, -dz));
        int index = Math.floorMod((int) Math.round(degrees / 45.0), DIRECTIONS.length);
        return Component.translatable("direction.starfall." + DIRECTIONS[index]);
    }

    private StarfallUtil() {
    }
}
