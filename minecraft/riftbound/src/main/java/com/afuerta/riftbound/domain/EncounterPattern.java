package com.afuerta.riftbound.domain;

/** Authored tactics change deployment, never enemy counts, health or rewards. */
public enum EncounterPattern {
    STANDARD, REINFORCEMENTS, PINCER, STANDARD_BEARER;

    public static final int REINFORCEMENT_DELAY_TICKS = 100;
    public static final int PINCER_RUSH_TICKS = 80;
    public static final int GUARD_REFRESH_TICKS = 20;
    public static final int GUARD_EFFECT_TICKS = 25;
    public static final int GUARD_RADIUS = 8;

    public static EncounterPattern forWave(TrialTier tier, int index) {
        if (index < 0) throw new IllegalArgumentException("Negative wave index");
        if (tier == null) throw new NullPointerException("tier");
        if (tier == TrialTier.INITIATE) return STANDARD;
        return switch (index % 3) {
            case 0 -> REINFORCEMENTS;
            case 1 -> PINCER;
            default -> STANDARD_BEARER;
        };
    }

    public int initialCount(int total) {
        if (total < 1 || total > TrialPlanner.MAX_MOBS_PER_WAVE) {
            throw new IllegalArgumentException("Invalid wave size");
        }
        return this == REINFORCEMENTS ? (total + 1) / 2 : total;
    }

    /** Interleave opposite halves of an angularly ordered ring without duplicate slots. */
    public int spawnSlot(int index, int available) {
        if (available < 1 || index < 0 || index >= available) {
            throw new IllegalArgumentException("Invalid spawn slot");
        }
        if (this != PINCER) return index;
        return index % 2 == 0 ? index / 2 : (available + 1) / 2 + index / 2;
    }
}
