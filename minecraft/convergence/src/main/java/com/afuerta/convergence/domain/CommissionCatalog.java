package com.afuerta.convergence.domain;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Eighteen fixed expeditions form a repeatable circuit with capped material scaling. */
public final class CommissionCatalog {
    public static final int CIRCUIT_LENGTH = 18;
    public static final String FILAMENT = "convergence:confluence_filament";
    public static final String FOCUS = "convergence:tempered_focus";
    public static final String MATRIX = "convergence:harmonic_matrix";
    private static final List<Commission> ALL = List.of(
            commission("first_signal", 1, 0, needs(2, "copperwake:scrap", 8, "starfall:star_shard", 2,
                    "minecraft:amethyst_shard", 4), pays(2, 0, 0)),
            commission("copper_constellation", 1, 0, needs(2, "copperwake:brass_gear", 4, "starfall:starstone", 12,
                    "minecraft:copper_ingot", 16), pays(2, 0, 0)),
            commission("remember_the_tides", 1, 0, needs(3, "copperwake:memory_glass", 2, "starfall:stardust", 4,
                    "minecraft:prismarine_shard", 8), pays(3, 0, 0)),
            commission("verdant_observatory", 1, 4, needs(3, "copperwake:scrap", 16, "starfall:star_shard", 4,
                    "riftbound:verdant_echo", 4), pays(3, 1, 0)),
            commission("buried_star_chart", 1, 4, needs(4, "copperwake:brass_gear", 6, "starfall:starsteel_ingot", 2,
                    "minecraft:deepslate", 32), pays(3, 0, 0)),
            commission("adept_concord", 2, 4, needs(6, "copperwake:charged_core", 2, "starfall:star_shard", 6,
                    "convergence:concordance", 1), pays(4, 2, 0)),
            commission("ember_relay", 2, 4, needs(5, "copperwake:memory_glass", 4, "starfall:stardust", 8,
                    "riftbound:ember_echo", 4), pays(4, 0, 0)),
            commission("frost_clock", 2, 4, needs(5, "copperwake:brass_gear", 8, "starfall:starsteel_ingot", 3,
                    "minecraft:packed_ice", 16), pays(4, 1, 0)),
            commission("storm_salvage", 2, 4, needs(6, "copperwake:charged_core", 3, "starfall:star_shard", 8,
                    "minecraft:lightning_rod", 3), pays(5, 0, 0)),
            commission("hollow_navigation", 2, 12, needs(6, "copperwake:memory_glass", 6, "starfall:stardust", 12,
                    "riftbound:hollow_echo", 4), pays(5, 1, 0)),
            commission("artificer_lantern", 2, 12, needs(7, "copperwake:brass_gear", 12, "starfall:starsteel_ingot", 4,
                    "minecraft:glowstone_dust", 16), pays(5, 0, 0)),
            commission("exalted_concord", 3, 12, needs(8, "copperwake:charged_core", 4, "starfall:star_shard", 10,
                    "convergence:concordance", 1), pays(6, 2, 1)),
            commission("tide_archive", 3, 12, needs(8, "copperwake:memory_glass", 8, "starfall:stardust", 16,
                    "riftbound:tidal_echo", 6), pays(6, 0, 0)),
            commission("sky_foundry", 3, 12, needs(9, "copperwake:brass_gear", 16, "starfall:starsteel_ingot", 6,
                    "minecraft:blaze_rod", 6), pays(6, 1, 0)),
            commission("void_beacon", 3, 12, needs(10, "copperwake:charged_core", 5, "starfall:star_shard", 12,
                    "minecraft:ender_pearl", 8), pays(7, 0, 0)),
            commission("threefold_map", 3, 12, needs(10, "copperwake:memory_glass", 10, "starfall:stardust", 20,
                    "minecraft:echo_shard", 2), pays(7, 2, 0)),
            commission("foreman_eclipse", 3, 12, needs(12, "copperwake:foreman_heart", 1, "starfall:starsteel_ingot", 8,
                    "minecraft:obsidian", 24), pays(8, 1, 0)),
            commission("harmonic_horizon", 3, 12, needs(16, "copperwake:charged_core", 6, "starfall:star_shard", 16,
                    "convergence:concordance", 2), pays(10, 3, 2)));

    private CommissionCatalog() { }

    /** Same completion count always yields the same delivery; reopening cannot reroll it. */
    public static Commission current(int completed) {
        requireNonnegative(completed);
        Commission base = ALL.get(completed % CIRCUIT_LENGTH);
        int multiplier = Math.min(3, 1 + completed / CIRCUIT_LENGTH);
        if (multiplier == 1) return base;
        Map<String, Integer> scaled = new LinkedHashMap<>();
        base.requirements().forEach((id, amount) -> {
            // Trial trophies remain fixed; second and later circuits still need fresh victories.
            scaled.put(id, id.equals("convergence:concordance") ? amount : amount * multiplier);
        });
        return new Commission(base.id(), base.minimumRiftTier(), base.minimumGuildContracts(), scaled, base.rewards());
    }

    public static List<Commission> all() { return ALL; }
    public static int nextCompleted(int completed) {
        requireNonnegative(completed);
        return completed == Integer.MAX_VALUE ? completed : completed + 1;
    }

    private static Commission commission(String id, int rift, int guild, Map<String, Integer> needs,
                                         Map<String, Integer> rewards) {
        return new Commission(id, rift, guild, needs, rewards);
    }

    private static Map<String, Integer> needs(int resonance, String guildItem, int guildAmount,
                                            String starItem, int starAmount, String fourth, int fourthAmount) {
        return Map.of("riftbound:resonance_shard", resonance, guildItem, guildAmount,
                starItem, starAmount, fourth, fourthAmount);
    }

    private static Map<String, Integer> pays(int filaments, int focuses, int matrices) {
        Map<String, Integer> rewards = new LinkedHashMap<>();
        rewards.put(FILAMENT, filaments);
        if (focuses > 0) rewards.put(FOCUS, focuses);
        if (matrices > 0) rewards.put(MATRIX, matrices);
        return rewards;
    }

    private static void requireNonnegative(int completed) {
        if (completed < 0) throw new IllegalArgumentException("Completion count must be nonnegative");
    }
}
