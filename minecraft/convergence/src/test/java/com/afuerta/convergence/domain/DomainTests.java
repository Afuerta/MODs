package com.afuerta.convergence.domain;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/** Executable pure rule checks: order, late-game gates, bounded loops and non-recycling rewards. */
public final class DomainTests {
    private static int checks;

    public static void main(String[] args) {
        check(CommissionCatalog.all().size() == CommissionCatalog.CIRCUIT_LENGTH, "Eighteen authored commissions");
        Set<String> ids = new HashSet<>();
        Set<String> allInputs = new HashSet<>();
        Set<String> allRewards = new HashSet<>();
        int previousRift = 0;
        int previousGuild = 0;
        for (Commission commission : CommissionCatalog.all()) {
            check(ids.add(commission.id()), "Unique commission IDs");
            check(commission.minimumRiftTier() >= previousRift, "Rift gates cannot reverse");
            check(commission.minimumGuildContracts() >= previousGuild, "Guild gates cannot reverse");
            previousRift = commission.minimumRiftTier();
            previousGuild = commission.minimumGuildContracts();
            for (String namespace : new String[]{"riftbound:", "copperwake:", "starfall:"}) {
                check(commission.requirements().keySet().stream().anyMatch(id -> id.startsWith(namespace)),
                        "Each commission includes all three worlds");
            }
            allInputs.addAll(commission.requirements().keySet());
            allRewards.addAll(commission.rewards().keySet());
            check(DeliveryPlan.validate(commission, 0, 3, 12, true, commission.requirements()) == DeliveryPlan.Verdict.ACCEPTED,
                    "Full delivery accepted");
            check(DeliveryPlan.validate(commission, 0, 3, 12, false, commission.requirements()) == DeliveryPlan.Verdict.SURVIVAL_ONLY,
                    "Creative/spectator delivery rejected");
            check(DeliveryPlan.validate(commission, 0, 0, 12, true, commission.requirements()) == DeliveryPlan.Verdict.RIFT_LOCKED,
                    "Rift gate enforced before payment");
            if (commission.minimumGuildContracts() > 0) {
                check(DeliveryPlan.validate(commission, 0, 3, 0, true, commission.requirements()) == DeliveryPlan.Verdict.GUILD_LOCKED,
                        "Guild gate enforced before payment");
            }
            for (String item : commission.requirements().keySet()) {
                Map<String, Integer> inventory = new HashMap<>(commission.requirements());
                inventory.put(item, inventory.get(item) - 1);
                check(DeliveryPlan.validate(commission, 0, 3, 12, true, inventory) == DeliveryPlan.Verdict.MISSING_ITEMS,
                        "One missing unit of any ingredient rejects entire delivery");
            }
            check(DeliveryPlan.validate(commission, Integer.MAX_VALUE, 3, 12, true, commission.requirements()) == DeliveryPlan.Verdict.MAX_PROGRESS,
                    "Saturated counter cannot farm repeated identical deliveries");
        }
        check(allRewards.stream().noneMatch(allInputs::contains), "No commission reward can fund any commission input");
        for (int completed = 0; completed < 720; completed++) {
            Commission actual = CommissionCatalog.current(completed);
            Commission base = CommissionCatalog.all().get(completed % CommissionCatalog.CIRCUIT_LENGTH);
            int multiplier = Math.min(3, 1 + completed / CommissionCatalog.CIRCUIT_LENGTH);
            check(actual.id().equals(base.id()), "Fixed order repeats exactly");
            check(actual.equals(CommissionCatalog.current(completed)), "Opening contracts never rerolls");
            check(actual.rewards().equals(base.rewards()), "Loop rewards do not inflate");
            for (var entry : base.requirements().entrySet()) {
                int expected = entry.getKey().equals("convergence:concordance") ? entry.getValue() : entry.getValue() * multiplier;
                check(actual.requirements().get(entry.getKey()) == expected, "Costs scale to 3x; trophies stay fixed");
            }
            check(CommissionCatalog.nextCompleted(completed) == completed + 1, "Exactly one completion per delivery");
        }
        for (int step : new int[]{5, 11, 17}) {
            Commission milestone = CommissionCatalog.current(step);
            check(milestone.requirements().containsKey("convergence:concordance"), "Late checkpoints require Convergence victories");
        }
        check(CommissionCatalog.current(16).requirements().get("copperwake:foreman_heart") == 1,
                "Penultimate commission requires the real Copperwake boss");
        check(CommissionCatalog.nextCompleted(Integer.MAX_VALUE) == Integer.MAX_VALUE, "Count saturates safely");
        check(CommissionCatalog.current(Integer.MAX_VALUE).requirements().values().stream().allMatch(n -> n > 0 && n <= 4096),
                "Highest counter preserves valid bounded amounts");
        expectIllegal(() -> CommissionCatalog.current(-1));
        expectIllegal(() -> CommissionCatalog.nextCompleted(-1));
        expectIllegal(() -> new Commission("invalid", 0, 0, Map.of("x:a", 1), Map.of("y:b", 1)));
        expectIllegal(() -> new Commission("recycling", 1, 0, Map.of("x:a", 1), Map.of("x:a", 2)));
        expectIllegal(() -> new Commission("negative", 1, 0, Map.of("x:a", -1), Map.of("y:b", 1)));
        expectIllegal(() -> DeliveryPlan.validate(CommissionCatalog.current(0), -1, 3, 12, true, Map.of()));
        try {
            CommissionCatalog.current(0).requirements().put("x:a", 1);
            throw new AssertionError("Requirements must be immutable");
        } catch (UnsupportedOperationException expected) { checks++; }
        System.out.println("Convergence domain checks passed: " + checks);
    }

    private static void expectIllegal(Runnable action) {
        try { action.run(); throw new AssertionError("Expected invalid input rejection"); }
        catch (IllegalArgumentException expected) { checks++; }
    }

    private static void check(boolean success, String description) {
        if (!success) throw new AssertionError(description);
        checks++;
    }

    private DomainTests() { }
}
