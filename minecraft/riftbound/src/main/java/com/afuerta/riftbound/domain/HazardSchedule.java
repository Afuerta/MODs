package com.afuerta.riftbound.domain;

import java.util.Objects;

/** A lag-safe warning/impact clock. Every impact requires its own emitted warning. */
public final class HazardSchedule {
    public static final int FIRST_WARNING_DELAY = 60;
    public static final int MIN_IMPACT_INTERVAL = 200;
    public enum Event { NONE, WARNING, IMPACT }

    private final int warningTicks;
    private long lastTick = -1;
    private long nextWarningTick;
    private long impactTick;
    private long lastImpactTick = -1;
    private int wave = -1;
    private int pulse;
    private boolean warning;
    private boolean stopped;

    public HazardSchedule(TrialTier tier) {
        Objects.requireNonNull(tier, "tier");
        if (tier == TrialTier.INITIATE) throw new IllegalArgumentException("Convergence requires Adept or Exalted");
        warningTicks = tier == TrialTier.ADEPT ? 60 : 40;
    }

    /** Pass -1 outside active combat. Intermissions cancel warnings rather than defer damage. */
    public Event advance(long nowTick, int activeWave) {
        if (nowTick < 0 || nowTick < lastTick) throw new IllegalArgumentException("Invalid hazard clock");
        if (activeWave < -1) throw new IllegalArgumentException("Invalid wave index");
        lastTick = nowTick;
        if (stopped) return Event.NONE;
        if (activeWave < 0) {
            wave = -1;
            warning = false;
            return Event.NONE;
        }
        if (wave != activeWave) {
            wave = activeWave;
            warning = false;
            nextWarningTick = TickMath.deadline(nowTick, FIRST_WARNING_DELAY);
            return Event.NONE;
        }
        if (warning) {
            if (nowTick < impactTick) return Event.NONE;
            warning = false;
            lastImpactTick = nowTick;
            nextWarningTick = TickMath.deadline(nowTick, MIN_IMPACT_INTERVAL - warningTicks);
            return Event.IMPACT;
        }
        if (nowTick < nextWarningTick || nowTick > Long.MAX_VALUE - warningTicks) return Event.NONE;
        warning = true;
        pulse++;
        // Delayed polling must still give players the entire warning interval from NOW.
        impactTick = TickMath.deadline(nowTick, warningTicks);
        if (lastImpactTick >= 0) impactTick = Math.max(impactTick, TickMath.deadline(lastImpactTick, MIN_IMPACT_INTERVAL));
        return Event.WARNING;
    }

    /** Terminal cleanup is permanent; a stopped clock cannot emit later impacts. */
    public void stop() { stopped = true; warning = false; }
    public boolean isWarning() { return warning; }
    public int warningTicks() { return warningTicks; }
    public int pulse() { return pulse; }
    public long impactTick() { return warning ? impactTick : -1; }
}
