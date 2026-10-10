package com.afuerta.riftbound.domain;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/** Stable, seed-driven encounter planning. No global RNG and no world access. */
public final class TrialPlanner {
    public static final int MAX_PARTICIPANTS = 4;
    public static final int MAX_MOBS_PER_WAVE = 24;
    public static final int WARMUP_TICKS = 100;
    public static final int INTERMISSION_TICKS = 80;
    public static final int COOLDOWN_TICKS = 1_200;

    private TrialPlanner() {}

    public static TrialPlan plan(Aspect aspect, TrialTier tier, int participants, long seed) {
        Objects.requireNonNull(aspect, "aspect");
        Objects.requireNonNull(tier, "tier");
        validateParticipants(participants);
        List<MobKind> pool = switch (aspect) {
            case VERDANT -> List.of(MobKind.ZOMBIE, MobKind.ZOMBIE, MobKind.SPIDER, MobKind.SPIDER, MobKind.SKELETON);
            case EMBER -> List.of(MobKind.HUSK, MobKind.HUSK, MobKind.HUSK, MobKind.ZOMBIE, MobKind.SKELETON);
            case TIDAL -> List.of(MobKind.DROWNED, MobKind.DROWNED, MobKind.DROWNED, MobKind.ZOMBIE, MobKind.SKELETON);
            case HOLLOW -> List.of(MobKind.SKELETON, MobKind.SKELETON, MobKind.STRAY, MobKind.ZOMBIE, MobKind.SPIDER);
        };
        List<WavePlan> waves = new ArrayList<>();
        long state = seed ^ ((long) aspect.ordinal() << 32) ^ tier.ordinal();
        for (int wave = 0; wave < tier.waveCount(); wave++) {
            int soloCount = tier.firstWaveMobs() + wave;
            int count = Math.min(MAX_MOBS_PER_WAVE, (soloCount * (participants + 1) + 1) / 2);
            List<MobKind> mobs = new ArrayList<>();
            // Always lead with a signature enemy; the seed varies the remaining composition.
            mobs.add(pool.get(0));
            for (int mob = 1; mob < count; mob++) {
                state += 0x9E3779B97F4A7C15L;
                long mixed = mix(state);
                mobs.add(pool.get((int) Long.remainderUnsigned(mixed, pool.size())));
            }
            waves.add(new WavePlan(wave, mobs));
        }
        return new TrialPlan(aspect, tier, participants, seed, waves,
                new TrialReward(tier.resonanceReward()), WARMUP_TICKS, INTERMISSION_TICKS,
                tier.timeoutTicks(), COOLDOWN_TICKS);
    }

    static void validateParticipants(int count) {
        if (count < 1 || count > MAX_PARTICIPANTS) {
            throw new IllegalArgumentException("Participant count must be between 1 and " + MAX_PARTICIPANTS);
        }
    }

    private static long mix(long value) {
        value = (value ^ (value >>> 30)) * 0xBF58476D1CE4E5B9L;
        value = (value ^ (value >>> 27)) * 0x94D049BB133111EBL;
        return value ^ (value >>> 31);
    }
}
