package io.github.afuerta.starfall;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import net.fabricmc.loader.api.FabricLoader;
import java.io.IOException;
import java.nio.file.Files;

/** Bounded server JSON settings. Original falling_stars/craters key names remain stable. */
public final class StarfallConfig {
    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
    public static StarfallConfig INSTANCE = new StarfallConfig();
    public FallingStars falling_stars = new FallingStars();
    public Craters craters = new Craters();
    public Showers showers = new Showers();

    public static final class FallingStars {
        public boolean enabled = true;
        public int chance_per_second = 400;
        public int min_distance = 24;
        public int max_distance = 64;
        public boolean require_clear_sky = true;
    }
    public static final class Craters {
        public boolean enabled = true;
        public int max_radius = 3;
    }
    public static final class Showers {
        public boolean enabled = true;
        public int chance_per_night = 10;
        public int multiplier = 8;
        public int max_impacts_per_night = 24;
    }
    /** Normalizes incomplete or out-of-range user input before any game event uses it. */
    public void normalize() {
        if (falling_stars == null) falling_stars = new FallingStars();
        if (craters == null) craters = new Craters();
        if (showers == null) showers = new Showers();
        falling_stars.chance_per_second = clamp(falling_stars.chance_per_second, 1, 1_000_000);
        falling_stars.min_distance = clamp(falling_stars.min_distance, 4, 256);
        falling_stars.max_distance = clamp(falling_stars.max_distance, falling_stars.min_distance, 256);
        craters.max_radius = clamp(craters.max_radius, 1, 5);
        showers.chance_per_night = clamp(showers.chance_per_night, 1, 10_000);
        showers.multiplier = clamp(showers.multiplier, 1, 16);
        showers.max_impacts_per_night = clamp(showers.max_impacts_per_night, 1, 64);
    }
    private static int clamp(int value, int min, int max) { return Math.max(min, Math.min(max, value)); }
    public static void load() {
        var path = FabricLoader.getInstance().getConfigDir().resolve("starfall.json");
        try {
            if (Files.exists(path)) {
                StarfallConfig loaded = GSON.fromJson(Files.readString(path), StarfallConfig.class);
                if (loaded != null) INSTANCE = loaded;
            }
            INSTANCE.normalize();
            if (!Files.exists(path)) {
                Files.createDirectories(path.getParent());
                Files.writeString(path, GSON.toJson(INSTANCE));
            }
        } catch (IOException | RuntimeException exception) {
            INSTANCE = new StarfallConfig();
            Starfall.LOGGER.warn("Could not read Starfall config; using bounded defaults", exception);
        }
    }
}
