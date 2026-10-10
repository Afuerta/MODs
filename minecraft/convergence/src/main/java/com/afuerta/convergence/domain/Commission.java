package com.afuerta.convergence.domain;

import java.util.Map;

/** Immutable authored commission; inputs and rewards are registry IDs rather than mod classes. */
public record Commission(String id, int minimumRiftTier, int minimumGuildContracts,
                         Map<String, Integer> requirements, Map<String, Integer> rewards) {
    public Commission {
        if (!id.matches("[a-z_]+") || minimumRiftTier < 1 || minimumRiftTier > 3
                || minimumGuildContracts < 0 || requirements.isEmpty() || rewards.isEmpty()) {
            throw new IllegalArgumentException("Invalid commission definition: " + id);
        }
        requirements = Map.copyOf(requirements);
        rewards = Map.copyOf(rewards);
        validate(requirements);
        validate(rewards);
        if (requirements.keySet().stream().anyMatch(rewards::containsKey)) {
            throw new IllegalArgumentException("Commission rewards cannot replace its inputs: " + id);
        }
    }

    private static void validate(Map<String, Integer> items) {
        items.forEach((id, count) -> {
            if (!id.matches("[a-z0-9_]+:[a-z0-9_/]+") || count <= 0 || count > 4096) {
                throw new IllegalArgumentException("Invalid item amount: " + id + " x" + count);
            }
        });
    }
}
