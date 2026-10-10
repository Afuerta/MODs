package com.afuerta.riftbound.domain;

import java.util.List;

/** Immutable spawn order; index is zero-based. */
public record WavePlan(int index, List<MobKind> mobs) {
    public WavePlan {
        if (index < 0) throw new IllegalArgumentException("Negative wave index");
        mobs = List.copyOf(mobs);
        if (mobs.isEmpty() || mobs.size() > TrialPlanner.MAX_MOBS_PER_WAVE) {
            throw new IllegalArgumentException("Wave size must be between 1 and " + TrialPlanner.MAX_MOBS_PER_WAVE);
        }
    }

    public int mobCount() { return mobs.size(); }
}
