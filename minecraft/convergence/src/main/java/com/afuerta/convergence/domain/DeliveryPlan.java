package com.afuerta.convergence.domain;

import java.util.Map;

/** Pure validation before the server mutates any inventory or world-saved progress. */
public final class DeliveryPlan {
    public enum Verdict { ACCEPTED, SURVIVAL_ONLY, RIFT_LOCKED, GUILD_LOCKED, MISSING_ITEMS, MAX_PROGRESS }

    public static Verdict validate(Commission contract, int completed, int riftTier, int guildContracts,
                                   boolean survival, Map<String, Integer> inventory) {
        if (completed < 0 || riftTier < 0 || guildContracts < 0) {
            throw new IllegalArgumentException("Progress counters must be nonnegative");
        }
        if (!survival) return Verdict.SURVIVAL_ONLY;
        if (completed == Integer.MAX_VALUE) return Verdict.MAX_PROGRESS;
        if (riftTier < contract.minimumRiftTier()) return Verdict.RIFT_LOCKED;
        if (guildContracts < contract.minimumGuildContracts()) return Verdict.GUILD_LOCKED;
        if (contract.requirements().entrySet().stream()
                .anyMatch(entry -> inventory.getOrDefault(entry.getKey(), 0) < entry.getValue())) {
            return Verdict.MISSING_ITEMS;
        }
        return Verdict.ACCEPTED;
    }

    private DeliveryPlan() { }
}
