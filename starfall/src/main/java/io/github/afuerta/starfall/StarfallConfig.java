package io.github.afuerta.starfall;

import net.neoforged.neoforge.common.ModConfigSpec;

/**
 * Server config, stored per world in {@code serverconfig/starfall-server.toml}.
 */
public final class StarfallConfig {
    public static final ModConfigSpec SPEC;

    public static final ModConfigSpec.BooleanValue FALLING_STARS_ENABLED;
    public static final ModConfigSpec.IntValue STAR_CHANCE;
    public static final ModConfigSpec.IntValue MIN_DISTANCE;
    public static final ModConfigSpec.IntValue MAX_DISTANCE;
    public static final ModConfigSpec.BooleanValue REQUIRE_CLEAR_SKY;
    public static final ModConfigSpec.BooleanValue CRATERS_ENABLED;
    public static final ModConfigSpec.IntValue CRATER_RADIUS;

    static {
        ModConfigSpec.Builder builder = new ModConfigSpec.Builder();

        builder.comment("Falling stars that streak across the night sky and crash near players.")
                .push("falling_stars");
        FALLING_STARS_ENABLED = builder
                .comment("Whether stars fall at night in the Overworld.")
                .define("enabled", true);
        STAR_CHANCE = builder
                .comment("Each second of night, every player has a 1-in-N chance of a star falling near them.",
                        "400 works out to roughly one star per player per night.")
                .defineInRange("chance_per_second", 400, 1, 1_000_000);
        MIN_DISTANCE = builder
                .comment("Closest a star will land to the player it fell for, in blocks.")
                .defineInRange("min_distance", 24, 4, 256);
        MAX_DISTANCE = builder
                .comment("Furthest a star will land from the player it fell for, in blocks.")
                .defineInRange("max_distance", 64, 4, 256);
        REQUIRE_CLEAR_SKY = builder
                .comment("If true, stars only fall when it is not raining.")
                .define("require_clear_sky", true);
        builder.pop();

        builder.comment("The crater a star leaves behind.").push("craters");
        CRATERS_ENABLED = builder
                .comment("If false, stars land gently on the surface without changing the terrain.")
                .define("enabled", true);
        CRATER_RADIUS = builder
                .comment("Largest crater radius in blocks.")
                .defineInRange("max_radius", 3, 1, 5);
        builder.pop();

        SPEC = builder.build();
    }

    private StarfallConfig() {
    }
}
