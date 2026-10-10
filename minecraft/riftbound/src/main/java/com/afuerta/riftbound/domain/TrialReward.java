package com.afuerta.riftbound.domain;

/** The full individual reward, never divided by party size. */
public record TrialReward(int resonanceShards) {
    public TrialReward {
        if (resonanceShards <= 0) throw new IllegalArgumentException("Reward must be positive");
    }
}
