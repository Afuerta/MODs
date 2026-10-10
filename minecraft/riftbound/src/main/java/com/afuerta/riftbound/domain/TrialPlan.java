package com.afuerta.riftbound.domain;

import java.util.List;
import java.util.Objects;

/** A complete encounter specification, independent of world state or loader APIs. */
public record TrialPlan(Aspect aspect, TrialTier tier, int participantCount, long seed,
                        List<WavePlan> waves, TrialReward reward,
                        int warmupTicks, int intermissionTicks, int timeoutTicks, int cooldownTicks) {
    public TrialPlan {
        Objects.requireNonNull(aspect, "aspect");
        Objects.requireNonNull(tier, "tier");
        Objects.requireNonNull(reward, "reward");
        TrialPlanner.validateParticipants(participantCount);
        waves = List.copyOf(waves);
        if (waves.size() != tier.waveCount()) throw new IllegalArgumentException("Wrong tier wave count");
        for (int i = 0; i < waves.size(); i++) {
            if (waves.get(i).index() != i) throw new IllegalArgumentException("Waves must be consecutively indexed");
        }
        if (warmupTicks < 0 || intermissionTicks < 0 || cooldownTicks < 0 || timeoutTicks <= 0) {
            throw new IllegalArgumentException("Invalid trial timing");
        }
        if ((long) warmupTicks + (long) intermissionTicks * (waves.size() - 1) >= timeoutTicks) {
            throw new IllegalArgumentException("Timeout must leave time for combat");
        }
    }
}
