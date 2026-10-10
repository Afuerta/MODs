package com.afuerta.copperwake.domain;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Run with a plain JDK; no game installation, test framework, or -ea flag required. */
public final class DomainTests {
    private static int checks;

    public static void main(String[] args) {
        rankBoundaries();
        selectionAndReachability();
        immutableDefinitions();
        catalogEconomy();
        invalidInputs();
        integerBoundaries();
        System.out.println("Copperwake domain: " + checks + " checks passed.");
    }

    private static void rankBoundaries() {
        int[] completed = {0, 3, 4, 7, 11, 12, 18, 1_000_000};
        int[] ranks = {0, 0, 1, 1, 1, 2, 2, 2};
        int[] next = {4, 4, 12, 12, 12, -1, -1, -1};
        String[] names = {"Scrounger", "Mechanist", "Artificer"};
        for (int i = 0; i < completed.length; i++) {
            equal(ranks[i], ContractCatalog.rankIndex(completed[i]), "rank boundary " + completed[i]);
            equal(next[i], ContractCatalog.nextRankAt(completed[i]), "next rank " + completed[i]);
            equal(names[ranks[i]], ContractCatalog.rankName(completed[i]), "rank label " + completed[i]);
        }
    }

    private static void selectionAndReachability() {
        Set<String> reached = new HashSet<>();
        Set<String> allIds = new HashSet<>();
        for (SalvageContract contract : ContractCatalog.all()) {
            check(allIds.add(contract.id()), "unique contract id " + contract.id());
        }
        equal(22, allIds.size(), "twenty-two contracts");
        List<String> legacy = List.of("broken_survey", "lamplighter_route", "sodden_pump", "moss_registry",
                "wind_chart", "cold_start", "quartz_choir", "drowned_manifest", "wind_chart", "cold_start",
                "quartz_choir", "drowned_manifest", "deep_chime", "storm_array", "furnace_treaty",
                "tide_ledger", "moon_audit", "last_shift");
        for (int completed = 0; completed < legacy.size(); completed++) {
            equal("copperwake:" + legacy.get(completed), ContractCatalog.current(completed).id(),
                    "original progression position preserved " + completed);
        }
        for (int completed = 0; completed < 26; completed++) {
            SalvageContract first = ContractCatalog.current(completed);
            equal(first, ContractCatalog.current(completed), "same persisted count has the same contract");
            reached.add(first.id());
        }
        equal(allIds, reached, "all definitions are reachable before the final loop repeats");
        for (int i = 4; i < 8; i++) {
            equal(ContractCatalog.current(i), ContractCatalog.current(i + 4), "mechanist four-contract loop");
        }
        for (int i = 12; i < 26; i++) {
            equal(ContractCatalog.current(i), ContractCatalog.current(i + 14), "artificer fourteen-contract loop");
        }
        check(!ContractCatalog.current(3).equals(ContractCatalog.current(4)), "rank upgrade changes pool");
        check(!ContractCatalog.current(11).equals(ContractCatalog.current(12)), "final rank changes pool");
    }

    private static void immutableDefinitions() {
        Map<String, Integer> sourceNeeds = new HashMap<>();
        sourceNeeds.put("minecraft:iron_ingot", 2);
        sourceNeeds.put("copperwake:memory_glass", 1);
        Map<String, Integer> sourceRewards = new HashMap<>();
        sourceRewards.put("copperwake:brass_gear", 3);
        SalvageContract original = new SalvageContract("copperwake:immutability", "Immutable", "Test definition.",
                sourceNeeds, sourceRewards);
        sourceNeeds.clear();
        sourceRewards.put("copperwake:charged_core", 64);
        equal(2, original.requirements().size(), "constructor copies requirements");
        equal(1, original.rewards().size(), "constructor copies rewards");
        equal(List.of("copperwake:memory_glass", "minecraft:iron_ingot"),
                new ArrayList<>(original.requirements().keySet()), "registry key display order is stable");
        expect(UnsupportedOperationException.class,
                () -> original.requirements().put("minecraft:diamond", 5), "requirements cannot mutate");
        expect(UnsupportedOperationException.class,
                () -> original.rewards().clear(), "rewards cannot mutate");
        expect(UnsupportedOperationException.class,
                () -> original.requirements().entrySet().iterator().next().setValue(9), "map entries cannot mutate");
        expect(UnsupportedOperationException.class,
                () -> ContractCatalog.all().clear(), "catalog cannot mutate");
        for (SalvageContract contract : ContractCatalog.all()) {
            expect(UnsupportedOperationException.class,
                    () -> contract.requirements().clear(), "catalog requirements are immutable");
            expect(UnsupportedOperationException.class,
                    () -> contract.rewards().clear(), "catalog rewards are immutable");
        }
    }

    private static void catalogEconomy() {
        Set<String> knownCustom = Set.of("copperwake:scrap", "copperwake:memory_glass", "copperwake:brass_gear",
                "copperwake:charged_core", "copperwake:foreman_heart");
        Set<String> knownVanillaInputs = Set.of("minecraft:copper_ingot", "minecraft:flint", "minecraft:coal",
                "minecraft:amethyst_shard", "minecraft:iron_ingot", "minecraft:kelp", "minecraft:moss_block",
                "minecraft:redstone", "minecraft:quartz", "minecraft:feather", "minecraft:packed_ice",
                "minecraft:lapis_lazuli", "minecraft:glowstone_dust", "minecraft:paper", "minecraft:prismarine_shard",
                "minecraft:echo_shard", "minecraft:deepslate", "minecraft:lightning_rod", "minecraft:blaze_powder",
                "minecraft:basalt", "minecraft:prismarine_crystals", "minecraft:nautilus_shell",
                "minecraft:phantom_membrane", "minecraft:ender_pearl", "minecraft:obsidian", "minecraft:diamond",
                "minecraft:honeycomb", "minecraft:copper_block", "minecraft:string", "minecraft:rabbit_hide",
                "minecraft:cactus", "minecraft:glass", "minecraft:rail", "minecraft:magma_cream", "minecraft:blackstone",
                "minecraft:glow_ink_sac", "minecraft:spyglass", "minecraft:end_stone", "minecraft:chorus_fruit",
                "minecraft:sculk", "minecraft:candle");
        for (SalvageContract contract : ContractCatalog.all()) {
            check(contract.requirements().getOrDefault("copperwake:memory_glass", 0) >= 1,
                    "every delivery consumes exploration-only memory glass");
            check(contract.requirements().getOrDefault("copperwake:scrap", 0) >= 8,
                    "every delivery consumes a meaningful amount of scrap");
            check(!contract.requirements().containsKey("copperwake:foreman_heart"), "boss heart is never a repeatable tax");
            equal(4, contract.requirements().size(), "two thematic resources plus the two salvage inputs");
            for (Map.Entry<String, Integer> item : contract.requirements().entrySet()) {
                check(knownCustom.contains(item.getKey()) || knownVanillaInputs.contains(item.getKey()),
                        "known input registry identifier: " + item.getKey());
                check(item.getValue() > 0 && item.getValue() <= 64, "bounded positive requirement");
            }
            check(contract.rewards().containsKey("copperwake:brass_gear"), "all deliveries award gears");
            for (Map.Entry<String, Integer> item : contract.rewards().entrySet()) {
                check(Set.of("copperwake:brass_gear", "copperwake:charged_core").contains(item.getKey()),
                        "rewards never regenerate delivery inputs");
                check(item.getValue() > 0 && item.getValue() <= 16, "bounded positive reward");
                check(!contract.requirements().containsKey(item.getKey()), "no immediate input/reward cycle");
            }
        }
        for (int completed = 0; completed < 26; completed++) {
            Map<String, Integer> rewards = ContractCatalog.current(completed).rewards();
            equal(completed >= 4, rewards.containsKey("copperwake:charged_core"),
                    "charged cores begin at Mechanist rank");
        }
    }

    private static void invalidInputs() {
        for (int value : new int[]{-1, -4, Integer.MIN_VALUE}) {
            expect(IllegalArgumentException.class, () -> ContractCatalog.current(value), "negative current");
            expect(IllegalArgumentException.class, () -> ContractCatalog.rankIndex(value), "negative rank");
            expect(IllegalArgumentException.class, () -> ContractCatalog.rankName(value), "negative rank label");
            expect(IllegalArgumentException.class, () -> ContractCatalog.nextRankAt(value), "negative next rank");
            expect(IllegalArgumentException.class, () -> ContractCatalog.nextCompleted(value), "negative increment");
        }
        for (int count : new int[]{-1, 0, 65, Integer.MAX_VALUE}) {
            expect(IllegalArgumentException.class, () -> sample(Map.of("minecraft:iron_ingot", count)),
                    "invalid requirement quantity " + count);
        }
        expect(IllegalArgumentException.class, () -> sample(Map.of()), "empty requirements");
        expect(IllegalArgumentException.class, () -> sample(Map.of("iron_ingot", 1)), "unqualified item ID");
        expect(IllegalArgumentException.class, () -> sample(Map.of("minecraft:Iron_Ingot", 1)), "invalid item ID case");
        expect(IllegalArgumentException.class, () -> sample(Map.of("copperwake:unknown_part", 1)), "unknown custom item");
        expect(IllegalArgumentException.class, () -> sample(Map.of("copperwake:brass_gear", 1)), "input/reward overlap");
        expect(NullPointerException.class, () -> sample(null), "null requirements");
        Map<String, Integer> nullCount = new HashMap<>();
        nullCount.put("minecraft:iron_ingot", null);
        expect(NullPointerException.class, () -> sample(nullCount), "null quantity");
        Map<String, Integer> nullKey = new HashMap<>();
        nullKey.put(null, 1);
        expect(NullPointerException.class, () -> sample(nullKey), "null registry identifier");
        expect(IllegalArgumentException.class,
                () -> new SalvageContract("bad id", "Title", "Description", Map.of("minecraft:iron_ingot", 1),
                        Map.of("copperwake:brass_gear", 1)), "invalid contract identifier");
        expect(IllegalArgumentException.class,
                () -> new SalvageContract("copperwake:test", " ", "Description", Map.of("minecraft:iron_ingot", 1),
                        Map.of("copperwake:brass_gear", 1)), "blank title");
        expect(IllegalArgumentException.class,
                () -> new SalvageContract("copperwake:test", "Title", "Description", Map.of("minecraft:iron_ingot", 1),
                        Map.of()), "empty rewards");
    }

    private static void integerBoundaries() {
        equal(1, ContractCatalog.nextCompleted(0), "first delivery increment");
        equal(4, ContractCatalog.nextCompleted(3), "increment unlocks Mechanist");
        equal(12, ContractCatalog.nextCompleted(11), "increment unlocks Artificer");
        equal(Integer.MAX_VALUE, ContractCatalog.nextCompleted(Integer.MAX_VALUE - 1), "last safe increment");
        equal(Integer.MAX_VALUE, ContractCatalog.nextCompleted(Integer.MAX_VALUE), "increment saturates");
        for (int completed : new int[]{1_000_000, Integer.MAX_VALUE - 1, Integer.MAX_VALUE}) {
            equal(2, ContractCatalog.rankIndex(completed), "rank caps at Artificer");
            equal(-1, ContractCatalog.nextRankAt(completed), "max rank has no next threshold");
            int equivalent = 12 + (int) (((long) completed - 12L) % 14L);
            equal(ContractCatalog.current(equivalent), ContractCatalog.current(completed),
                    "large count selection matches overflow-safe long arithmetic");
        }
    }

    private static SalvageContract sample(Map<String, Integer> needs) {
        return new SalvageContract("copperwake:test", "Test", "A test contract.", needs,
                Map.of("copperwake:brass_gear", 1));
    }

    private static void check(boolean condition, String label) {
        checks++;
        if (!condition) {
            throw new AssertionError(label);
        }
    }

    private static void equal(Object expected, Object actual, String label) {
        check(expected.equals(actual), label + ": expected " + expected + ", got " + actual);
    }

    private static void expect(Class<? extends Throwable> type, Runnable operation, String label) {
        checks++;
        try {
            operation.run();
        } catch (Throwable exception) {
            if (type.isInstance(exception)) {
                return;
            }
            throw new AssertionError(label + ": wrong exception " + exception, exception);
        }
        throw new AssertionError(label + ": expected " + type.getSimpleName());
    }
}
