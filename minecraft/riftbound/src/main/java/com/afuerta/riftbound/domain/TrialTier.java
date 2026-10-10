package com.afuerta.riftbound.domain;

public enum TrialTier {
    INITIATE(3, 3, 3, 1, 4_800),
    ADEPT(4, 5, 6, 2, 7_200),
    EXALTED(5, 7, 10, 3, 9_600);

    private final int waves;
    private final int firstWaveMobs;
    private final int resonanceReward;
    private final int echoCost;
    private final int timeoutTicks;

    TrialTier(int waves, int firstWaveMobs, int resonanceReward, int echoCost, int timeoutTicks) {
        this.waves = waves;
        this.firstWaveMobs = firstWaveMobs;
        this.resonanceReward = resonanceReward;
        this.echoCost = echoCost;
        this.timeoutTicks = timeoutTicks;
    }

    public int waveCount() { return waves; }
    public int firstWaveMobs() { return firstWaveMobs; }
    public int resonanceReward() { return resonanceReward; }
    public int echoCost() { return echoCost; }
    public int timeoutTicks() { return timeoutTicks; }
}
