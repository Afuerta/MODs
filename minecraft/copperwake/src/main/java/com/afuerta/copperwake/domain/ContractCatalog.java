package com.afuerta.copperwake.domain;

import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

/** Pure progression rules, shared by server gameplay and dependency-free checks. */
public final class ContractCatalog {
    public static final int MECHANIST_AT = 4;
    public static final int ARTIFICER_AT = 12;

    private static final List<SalvageContract> SCROUNGER = List.of(
            contract("broken_survey", "The Broken Survey",
                    "The surveyors lost their compass teeth. Salvage a memory pane and rebuild their bearings.",
                    needs(8, 1, "minecraft:copper_ingot", 12, "minecraft:flint", 4), pays(3, 0)),
            contract("lamplighter_route", "The Lamplighter's Route",
                    "Someone still lights the abandoned platforms. Bring fuel and a lens before the lamps go dark.",
                    needs(10, 1, "minecraft:coal", 8, "minecraft:amethyst_shard", 4), pays(4, 0)),
            contract("sodden_pump", "A Very Sodden Pump",
                    "The depot pump is full of kelp. The mechanics insist this is a materials shortage, not a design flaw.",
                    needs(12, 1, "minecraft:iron_ingot", 8, "minecraft:kelp", 8), pays(4, 0)),
            contract("moss_registry", "Register the Moss",
                    "The overgrown archive has started filing its own plants. Recover samples and fresh circuit dust.",
                    needs(10, 2, "minecraft:moss_block", 8, "minecraft:redstone", 4), pays(5, 0)));

    private static final List<SalvageContract> MECHANIST = List.of(
            contract("wind_chart", "A Chart of Missing Winds",
                    "The weather engine remembers a sky that no longer exists. Its vanes need quartz, feathers, and patience.",
                    needs(14, 2, "minecraft:quartz", 12, "minecraft:feather", 4), pays(6, 1)),
            contract("cold_start", "Cold Start Protocol",
                    "An old boiler only wakes below freezing. Retrieve packed ice and blue calibration powder.",
                    needs(16, 2, "minecraft:packed_ice", 12, "minecraft:lapis_lazuli", 4), pays(7, 1)),
            contract("quartz_choir", "The Quartz Choir",
                    "The tunnel bells have fallen out of tune. Nether-grown crystal can restore their warning song.",
                    needs(18, 3, "minecraft:quartz", 12, "minecraft:glowstone_dust", 4), pays(8, 1)),
            contract("drowned_manifest", "The Drowned Manifest",
                    "A submerged freight office owes us a century of receipts. Waterproof the replacement ledger.",
                    needs(16, 3, "minecraft:paper", 8, "minecraft:prismarine_shard", 8), pays(8, 2)));

    private static final List<SalvageContract> ARTIFICER = List.of(
            contract("deep_chime", "The Chime Below",
                    "Far below the mines, something answers the depot bell. Bring back the stone that carries its echo.",
                    needs(24, 4, "minecraft:echo_shard", 2, "minecraft:deepslate", 16), pays(10, 3)),
            contract("storm_array", "Bottle the Next Storm",
                    "The lightning collectors are empty. Assemble an array that can teach the machines to dream again.",
                    needs(28, 4, "minecraft:amethyst_shard", 16, "minecraft:lightning_rod", 4), pays(12, 3)),
            contract("furnace_treaty", "The Furnace Treaty",
                    "The old foundry accepts no visitors, only offerings. Deliver heatproof stone and stolen fire.",
                    needs(24, 5, "minecraft:blaze_powder", 8, "minecraft:basalt", 12), pays(12, 3)),
            contract("tide_ledger", "Audit the Tides",
                    "Every tide leaves a different total. The dockmaster needs sea crystal and shells to settle the account.",
                    needs(30, 5, "minecraft:prismarine_crystals", 12, "minecraft:nautilus_shell", 2), pays(14, 4)),
            contract("moon_audit", "The Midnight Inspector",
                    "An inspector arrives only when nobody sleeps. Collect proof from the night sky and the space between.",
                    needs(26, 5, "minecraft:phantom_membrane", 4, "minecraft:ender_pearl", 4), pays(14, 3)),
            contract("last_shift", "One More Shift",
                    "The foreman's old time clock still punches in. Rebuild its indestructible casing and let the depot rest.",
                    needs(32, 6, "minecraft:obsidian", 12, "minecraft:diamond", 2), pays(16, 4)),
            // Append only: the original six Artificer definitions and first 18
            // completed-count positions remain stable across this expansion.
            contract("apiary_exchange", "The Apiary Heat Exchange",
                    "Bees have occupied the cooling ducts. Replace the seals without evicting the new engineers.",
                    needs(24, 4, "minecraft:honeycomb", 8, "minecraft:copper_block", 2), pays(10, 2)),
            contract("silk_insulation", "Insulate the Switchyard",
                    "Rain keeps shorting the freight switches. We need flexible thread and tough hide for their sleeves.",
                    needs(20, 4, "minecraft:string", 16, "minecraft:rabbit_hide", 4), pays(10, 2)),
            contract("greenhouse_pressure", "Greenhouse Pressure Test",
                    "The old conservatory stores sunlight under pressure. Replace its panes and living pressure gauges.",
                    needs(26, 4, "minecraft:cactus", 12, "minecraft:glass", 8), pays(12, 3)),
            contract("rail_restoration", "Rails for the Return Shift",
                    "The depot's return line stops halfway across the flats. Lay fresh track and reconnect its signals.",
                    needs(28, 5, "minecraft:rail", 24, "minecraft:redstone", 8), pays(12, 3)),
            contract("ashen_regulator", "The Ashen Regulator",
                    "A furnace valve glows long after the fire is out. Bring a heatproof housing and elastic coolant seals.",
                    needs(30, 5, "minecraft:magma_cream", 6, "minecraft:blackstone", 16), pays(14, 3)),
            contract("observatory_ink", "Write the Invisible Sky",
                    "The relay astronomer charts stars through factory smoke. Deliver a telescope and luminous recording ink.",
                    needs(24, 4, "minecraft:glow_ink_sac", 8, "minecraft:spyglass", 1), pays(12, 3)),
            contract("end_platform", "Freight Beyond the Horizon",
                    "An impossible destination appeared on the departure board. Test its stone and its strange purple cargo.",
                    needs(32, 6, "minecraft:end_stone", 24, "minecraft:chorus_fruit", 8), pays(16, 4)),
            contract("silent_archive", "The Silent Archive",
                    "The archive listens better than it speaks. Bring quiet-growth samples and lights that do not buzz.",
                    needs(28, 6, "minecraft:sculk", 4, "minecraft:candle", 8), pays(14, 4)));

    private static final List<SalvageContract> ALL = Stream.of(SCROUNGER, MECHANIST, ARTIFICER)
            .flatMap(List::stream).toList();

    private ContractCatalog() {
    }

    /** Current delivery is fixed by persisted completion count; reopening cannot reroll it. */
    public static SalvageContract current(int completed) {
        int rank = rankIndex(completed);
        List<SalvageContract> pool = switch (rank) {
            case 0 -> SCROUNGER;
            case 1 -> MECHANIST;
            default -> ARTIFICER;
        };
        int start = switch (rank) {
            case 0 -> 0;
            case 1 -> MECHANIST_AT;
            default -> ARTIFICER_AT;
        };
        return pool.get((completed - start) % pool.size());
    }

    public static String rankName(int completed) {
        return switch (rankIndex(completed)) {
            case 0 -> "Scrounger";
            case 1 -> "Mechanist";
            default -> "Artificer";
        };
    }

    /** Rank is always in [0, 2], suitable for a bounded rank display. */
    public static int rankIndex(int completed) {
        requireNonNegative(completed);
        return completed >= ARTIFICER_AT ? 2 : completed >= MECHANIST_AT ? 1 : 0;
    }

    /** Returns the absolute completion threshold, or -1 when already at the highest rank. */
    public static int nextRankAt(int completed) {
        return switch (rankIndex(completed)) {
            case 0 -> MECHANIST_AT;
            case 1 -> ARTIFICER_AT;
            default -> -1;
        };
    }

    /** Saturates instead of wrapping; only call after the adapter commits the full delivery. */
    public static int nextCompleted(int completed) {
        requireNonNegative(completed);
        return completed == Integer.MAX_VALUE ? Integer.MAX_VALUE : completed + 1;
    }

    /** Immutable definitions, ordered by rank and then delivery order. */
    public static List<SalvageContract> all() {
        return ALL;
    }

    private static void requireNonNegative(int completed) {
        if (completed < 0) {
            throw new IllegalArgumentException("Completed deliveries must be nonnegative");
        }
    }

    private static SalvageContract contract(String id, String title, String description,
                                            Map<String, Integer> requirements, Map<String, Integer> rewards) {
        return new SalvageContract("copperwake:" + id, title, description, requirements, rewards);
    }

    private static Map<String, Integer> needs(int scrap, int glass, String first, int firstCount,
                                             String second, int secondCount) {
        return Map.of("copperwake:scrap", scrap, "copperwake:memory_glass", glass,
                first, firstCount, second, secondCount);
    }

    private static Map<String, Integer> pays(int gears, int cores) {
        return cores == 0 ? Map.of("copperwake:brass_gear", gears)
                : Map.of("copperwake:brass_gear", gears, "copperwake:charged_core", cores);
    }
}
