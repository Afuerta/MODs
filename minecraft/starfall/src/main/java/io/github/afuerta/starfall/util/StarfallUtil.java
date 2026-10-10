package io.github.afuerta.starfall.util;

import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.text.Text;
import net.minecraft.world.World;
import net.minecraft.world.Heightmap;

/** Sky checks shared by server combat and client mining prediction. */
public final class StarfallUtil {
    public static boolean isNight(World world) {
        long time = Math.floorMod(world.getTimeOfDay(), 24000);
        return time >= 13000 && time < 23000;
    }
    public static boolean isStarlit(PlayerEntity player) {
        World world = player.getWorld();
        return world.getRegistryKey().equals(World.OVERWORLD) && isNight(world)
                && !world.isRaining() && world.isSkyVisible(player.getBlockPos())
                && world.getTopY(Heightmap.Type.MOTION_BLOCKING, player.getBlockX(), player.getBlockZ()) <= player.getBlockY();
    }
    public static Text direction(double dx, double dz) {
        int index = Math.floorMod((int) Math.round(Math.atan2(dx, -dz) / (Math.PI / 4)), 8);
        String[] names = {"north", "north_east", "east", "south_east", "south", "south_west", "west", "north_west"};
        return Text.translatable("direction.starfall." + names[index]);
    }
    private StarfallUtil() {}
}
