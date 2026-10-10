package com.afuerta.riftbound.domain;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

/** Server-thread ledger using the same monotonic tick source as trial sessions. */
public final class TrialCooldowns {
    private final Map<UUID, Long> deadlines = new HashMap<>();

    /** Reapplying a shorter cooldown never shortens an existing one. */
    public void start(UUID participant, long nowTick, long durationTicks) {
        Objects.requireNonNull(participant, "participant");
        long deadline = TickMath.deadline(nowTick, durationTicks);
        if (durationTicks > 0) deadlines.merge(participant, deadline, Math::max);
    }

    public long remainingTicks(UUID participant, long nowTick) {
        Objects.requireNonNull(participant, "participant");
        if (nowTick < 0) throw new IllegalArgumentException("Negative tick");
        Long deadline = deadlines.get(participant);
        if (deadline == null) return 0;
        if (nowTick >= deadline) {
            deadlines.remove(participant);
            return 0;
        }
        return deadline - nowTick;
    }

    public boolean isReady(UUID participant, long nowTick) {
        return remainingTicks(participant, nowTick) == 0;
    }

    public void prune(long nowTick) {
        if (nowTick < 0) throw new IllegalArgumentException("Negative tick");
        deadlines.values().removeIf(deadline -> nowTick >= deadline);
    }

    /** Reset at server/world lifecycle boundaries when the tick clock also resets. */
    public void clear() {
        deadlines.clear();
    }
}
