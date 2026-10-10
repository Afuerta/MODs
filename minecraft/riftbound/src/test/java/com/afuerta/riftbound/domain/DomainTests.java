package com.afuerta.riftbound.domain;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Dependency-free verification; throws on failure regardless of JVM assertion flags. */
public final class DomainTests {
    private static int checks;
    private static long nextId = 100;
    private static final UUID ALICE = new UUID(0, 1);
    private static final UUID BOB = new UUID(0, 2);

    public static void main(String[] args) {
        plannerProperties();
        plannerValidation();
        immutablePlans();
        lifecycleAndRewardClaims();
        withdrawalAndFailure();
        invalidSpawnAcknowledgement();
        conversionPreservesOutstandingEnemies();
        timeoutAndClockBoundaries();
        cooldownBoundaries();
        hazardWarningsAndLag();
        hazardGeometry();
        System.out.println("Riftbound domain tests passed (" + checks + " checks).");
    }

    private static void plannerProperties() {
        for (Aspect aspect : Aspect.values()) {
            for (TrialTier tier : TrialTier.values()) {
                for (int party = 1; party <= 4; party++) {
                    for (long seed : new long[]{0, 42, -1, Long.MIN_VALUE}) {
                        TrialPlan plan = TrialPlanner.plan(aspect, tier, party, seed);
                        check(plan.equals(TrialPlanner.plan(aspect, tier, party, seed)), "Seed reproducibility");
                        check(plan.waves().size() == tier.waveCount(), "Tier wave count");
                        check(plan.reward().resonanceShards() == tier.resonanceReward(), "Party-independent reward");
                        int previous = 0;
                        for (int i = 0; i < plan.waves().size(); i++) {
                            WavePlan wave = plan.waves().get(i);
                            int expected = Math.min(24, ((tier.firstWaveMobs() + i) * (party + 1) + 1) / 2);
                            check(wave.mobCount() == expected, "Exact party scaling");
                            check(wave.mobCount() >= previous && wave.mobCount() <= 24, "Escalation and cap");
                            check(wave.index() == i, "Consecutive wave indices");
                            check(wave.mobs().get(0) == signature(aspect), "Aspect signature enemy");
                            previous = wave.mobCount();
                        }
                    }
                }
            }
        }
        Set<List<WavePlan>> variations = new HashSet<>();
        for (int seed = 0; seed < 16; seed++) variations.add(plan(1, seed).waves());
        check(variations.size() > 1, "Different seeds change enemy composition");
        check(plan(1, 42).waves().stream().map(WavePlan::mobCount).toList().equals(List.of(3, 4, 5)), "Solo initiate balance");
    }

    private static MobKind signature(Aspect aspect) {
        return switch (aspect) {
            case VERDANT -> MobKind.ZOMBIE;
            case EMBER -> MobKind.HUSK;
            case TIDAL -> MobKind.DROWNED;
            case HOLLOW -> MobKind.SKELETON;
        };
    }

    private static void plannerValidation() {
        expect(IllegalArgumentException.class, () -> plan(0, 0));
        expect(IllegalArgumentException.class, () -> plan(5, 0));
        expect(NullPointerException.class, () -> TrialPlanner.plan(null, TrialTier.INITIATE, 1, 0));
        expect(NullPointerException.class, () -> TrialPlanner.plan(Aspect.EMBER, null, 1, 0));
        expect(IllegalArgumentException.class, () -> new TrialReward(0));
        expect(IllegalArgumentException.class, () -> new WavePlan(-1, List.of(MobKind.ZOMBIE)));
        expect(IllegalArgumentException.class, () -> new WavePlan(0, List.of()));
        expect(IllegalArgumentException.class, () -> new WavePlan(0, java.util.Collections.nCopies(25, MobKind.ZOMBIE)));
        expect(IllegalArgumentException.class, () -> new TrialSession(plan(2, 0), List.of(ALICE, ALICE), 0));
        expect(IllegalArgumentException.class, () -> new TrialSession(plan(2, 0), List.of(ALICE), 0));
        expect(IllegalArgumentException.class, () -> new TrialSession(plan(1, 0), List.of(ALICE), -1));
        TrialPlan original = plan(1, 0);
        expect(IllegalArgumentException.class, () -> new TrialPlan(original.aspect(), original.tier(), 1, 0,
                original.waves(), original.reward(), 100, 80, 200, 1_200));
        expect(IllegalArgumentException.class, () -> new TrialPlan(original.aspect(), original.tier(), 1, 0,
                List.of(original.waves().get(0)), original.reward(), 100, 80, 4_800, 1_200));
    }

    private static void immutablePlans() {
        List<MobKind> source = new ArrayList<>(List.of(MobKind.ZOMBIE));
        WavePlan wave = new WavePlan(0, source);
        source.clear();
        check(wave.mobCount() == 1, "Wave defensively copies caller data");
        expect(UnsupportedOperationException.class, () -> wave.mobs().clear());
        expect(UnsupportedOperationException.class, () -> plan(1, 0).waves().clear());
        List<UUID> ids = new ArrayList<>(List.of(ALICE));
        TrialSession session = new TrialSession(plan(1, 0), ids, 0);
        ids.clear();
        check(session.participants().equals(Set.of(ALICE)), "Participants are a snapshot");
        expect(UnsupportedOperationException.class, () -> session.participants().clear());
    }

    private static void lifecycleAndRewardClaims() {
        TrialSession session = new TrialSession(plan(2, 0), List.of(ALICE, BOB), 1_000);
        check(session.claimRewards().isEmpty(), "Early claim does not grant rewards");
        check(session.advance(1_099) == TrialSession.Event.NONE, "Full warmup");
        check(session.advance(1_100) == TrialSession.Event.SPAWN_WAVE, "Warmup emits first wave");
        check(session.advance(1_100) == TrialSession.Event.NONE, "No repeated spawn event");
        check(session.state() == TrialSession.State.SPAWNING, "No auto-clear before spawn acknowledgment");
        List<UUID> firstWave = freshMobs(session.nextWave().mobCount());
        session.registerWaveMobs(firstWave);
        check(!session.mobDefeated(new UUID(9, 9)), "Unrelated deaths ignored");
        for (UUID mob : firstWave) {
            check(session.mobDefeated(mob), "Registered death counted");
            check(!session.mobDefeated(mob), "Duplicate death ignored");
        }
        check(session.advance(1_101) == TrialSession.Event.NONE, "Cleared wave begins intermission");
        check(session.state() == TrialSession.State.INTERMISSION, "Intermission state");
        check(session.advance(1_180) == TrialSession.Event.NONE, "Full intermission");
        check(session.advance(1_181) == TrialSession.Event.SPAWN_WAVE, "Intermission emits next wave");
        finishFromRequestedWave(session, 1_181);
        check(session.state() == TrialSession.State.SUCCEEDED, "Completed trial succeeds");
        Map<UUID, TrialReward> rewards = session.claimRewards();
        check(rewards.size() == 2 && rewards.get(ALICE).equals(rewards.get(BOB)), "Equal individual party rewards");
        check(session.claimRewards().isEmpty(), "Exactly-once claim");
        expect(UnsupportedOperationException.class, rewards::clear);
        check(!session.withdraw(ALICE), "Terminal eligibility cannot change");
        check(!session.fail(TrialSession.FailureReason.CANCELLED), "Terminal result cannot change");
        check(session.advance(2_000) == TrialSession.Event.NONE, "Success event delivered only once");
        check(session.remainingTicks(2_000) == 0, "Terminal trial has no remaining clock");
    }

    private static void withdrawalAndFailure() {
        TrialSession session = new TrialSession(plan(2, 0), List.of(ALICE, BOB), 0);
        check(session.withdraw(BOB), "Known player may withdraw");
        check(!session.withdraw(BOB), "Withdrawal is idempotent");
        check(!session.withdraw(new UUID(0, 3)), "Late joiner cannot affect attendance");
        check(session.advance(100) == TrialSession.Event.SPAWN_WAVE, "Remaining player continues");
        check(session.nextWave().mobCount() == 5, "Difficulty retains original party scaling");
        finishFromRequestedWave(session, 100);
        check(session.claimRewards().keySet().equals(Set.of(ALICE)), "Departed participant gets no reward");

        TrialSession deserted = new TrialSession(plan(1, 0), List.of(ALICE), 0);
        deserted.withdraw(ALICE);
        check(deserted.failureReason().orElseThrow() == TrialSession.FailureReason.NO_PARTICIPANTS, "Empty party fails");
        check(deserted.advance(1) == TrialSession.Event.FAILED, "External failure emitted");
        check(deserted.advance(1) == TrialSession.Event.NONE, "Failure emitted once");
        check(deserted.claimRewards().isEmpty(), "No failure rewards");

        TrialSession aborted = new TrialSession(plan(1, 0), List.of(ALICE), 0);
        aborted.fail(TrialSession.FailureReason.WORLD_UNLOADED);
        check(!aborted.fail(TrialSession.FailureReason.CANCELLED), "First failure reason wins");
        check(aborted.failureReason().orElseThrow() == TrialSession.FailureReason.WORLD_UNLOADED, "Abort reason preserved");
    }

    private static void invalidSpawnAcknowledgement() {
        TrialSession session = new TrialSession(plan(1, 0), List.of(ALICE), 0);
        expect(IllegalStateException.class, session::nextWave);
        expect(IllegalStateException.class, () -> session.registerWaveMobs(List.of()));
        session.advance(100);
        expect(IllegalArgumentException.class, () -> session.registerWaveMobs(List.of()));
        expect(IllegalArgumentException.class, () -> session.registerWaveMobs(List.of(ALICE, ALICE, BOB)));
        check(session.state() == TrialSession.State.SPAWNING && session.activeMobs().isEmpty(), "Bad registration is atomic");
        List<UUID> first = freshMobs(3);
        session.registerWaveMobs(first);
        expect(IllegalStateException.class, () -> session.registerWaveMobs(first));
        first.forEach(session::mobDefeated);
        session.advance(101);
        session.advance(181);
        List<UUID> reused = new ArrayList<>(freshMobs(3));
        reused.add(first.get(0));
        expect(IllegalArgumentException.class, () -> session.registerWaveMobs(reused));
        check(session.activeMobs().isEmpty(), "Reused UUID rejection is atomic");
        session.registerWaveMobs(freshMobs(4));
        check(!session.mobDefeated(first.get(0)), "Stale death cannot clear another wave");
    }

    private static void timeoutAndClockBoundaries() {
        TrialSession session = new TrialSession(plan(1, 0), List.of(ALICE), 500);
        check(session.remainingTicks(500) == 4_800, "Timeout relative to start");
        session.advance(600);
        check(session.advance(5_299) == TrialSession.Event.NONE, "Waiting for spawn cannot bypass timeout");
        check(session.advance(5_300) == TrialSession.Event.FAILED, "Exact deadline fails");
        check(session.failureReason().orElseThrow() == TrialSession.FailureReason.TIMEOUT, "Timeout reason");
        check(session.claimRewards().isEmpty(), "Timeout grants nothing");
        expect(IllegalArgumentException.class, () -> session.advance(5_299));
        expect(IllegalArgumentException.class, () -> session.remainingTicks(-1));
        TrialSession nearOverflow = new TrialSession(plan(1, 0), List.of(ALICE), Long.MAX_VALUE - 5);
        check(nearOverflow.deadlineTick() == Long.MAX_VALUE, "Deadline saturates instead of overflowing");
        check(nearOverflow.advance(Long.MAX_VALUE) == TrialSession.Event.FAILED, "Saturated deadline remains finite");
    }

    private static void conversionPreservesOutstandingEnemies() {
        TrialSession session = new TrialSession(plan(1, 0), List.of(ALICE), 0);
        UUID original = new UUID(3, 1);
        UUID replacement = new UUID(3, 2);
        UUID secondReplacement = new UUID(3, 3);
        check(!session.replaceMob(original, replacement), "Conversion outside combat ignored");
        session.advance(100);
        List<UUID> initial = new ArrayList<>(freshMobs(2));
        initial.add(original);
        session.registerWaveMobs(initial);
        check(session.replaceMob(original, replacement), "Registered enemy may convert");
        check(session.activeMobs().size() == 3 && session.activeMobs().contains(replacement)
                && !session.activeMobs().contains(original), "Conversion preserves exact active count");
        check(!session.mobDefeated(original), "Retired entity death is not a defeat");
        check(!session.replaceMob(original, secondReplacement), "Duplicate conversion event ignored");
        check(!session.replaceMob(replacement, replacement), "Identity conversion rejected");
        check(!session.replaceMob(replacement, initial.get(0)), "Cannot merge two active enemies");
        check(!session.replaceMob(replacement, original), "Cannot revive retired UUID");
        check(session.activeMobs().size() == 3, "Rejected conversions leave tracking unchanged");
        check(session.replaceMob(replacement, secondReplacement), "Chained conversion preserves tracking");
        check(!session.mobDefeated(replacement), "Intermediate entity death cannot advance wave");
        session.mobDefeated(initial.get(0));
        session.mobDefeated(initial.get(1));
        check(!session.replaceMob(secondReplacement, initial.get(0)), "Cannot reuse defeated UUID");
        check(session.advance(101) == TrialSession.Event.NONE && session.state() == TrialSession.State.ACTIVE,
                "Wave cannot clear while converted enemy remains");
        check(session.mobDefeated(secondReplacement), "Final converted enemy death counts once");
        check(!session.mobDefeated(secondReplacement), "Converted enemy death cannot count twice");
        session.advance(102);
        check(session.state() == TrialSession.State.INTERMISSION, "Only actual final defeat clears wave");
        check(!session.replaceMob(secondReplacement, new UUID(3, 4)), "Late conversion after wave ignored");
        session.advance(182);
        List<UUID> badNextWave = new ArrayList<>(freshMobs(3));
        badNextWave.add(secondReplacement);
        expect(IllegalArgumentException.class, () -> session.registerWaveMobs(badNextWave));
        finishFromRequestedWave(session, 182);
        check(session.claimRewards().equals(Map.of(ALICE, new TrialReward(3))),
                "Conversions preserve normal reward lifecycle");
        check(session.claimRewards().isEmpty(), "Conversions do not bypass once-only payout");
        check(!session.replaceMob(secondReplacement, new UUID(3, 4)), "Terminal conversion ignored");
    }

    private static void cooldownBoundaries() {
        TrialCooldowns cooldowns = new TrialCooldowns();
        check(cooldowns.isReady(ALICE, 0), "Unknown player ready");
        cooldowns.start(ALICE, 100, 1_200);
        check(cooldowns.remainingTicks(ALICE, 100) == 1_200, "Cooldown begins at full duration");
        check(cooldowns.remainingTicks(ALICE, 1_299) == 1, "Last cooldown tick");
        check(cooldowns.isReady(ALICE, 1_300), "Ready at exact expiry");
        cooldowns.start(ALICE, 2_000, 1_200);
        cooldowns.start(ALICE, 2_100, 1);
        check(cooldowns.remainingTicks(ALICE, 2_100) == 1_100, "Short restart cannot erase cooldown");
        cooldowns.start(ALICE, 2_100, 0);
        check(!cooldowns.isReady(ALICE, 2_100), "Zero duration cannot erase cooldown");
        check(cooldowns.isReady(BOB, 2_100), "Cooldowns isolated per participant");
        cooldowns.prune(3_200);
        check(cooldowns.isReady(ALICE, 3_200), "Prune removes expired entries");
        cooldowns.start(ALICE, Long.MAX_VALUE - 10, 1_200);
        check(cooldowns.remainingTicks(ALICE, Long.MAX_VALUE - 10) == 10, "Overflow saturation");
        check(cooldowns.isReady(ALICE, Long.MAX_VALUE), "Overflow expiry");
        expect(IllegalArgumentException.class, () -> cooldowns.start(ALICE, -1, 1));
        expect(IllegalArgumentException.class, () -> cooldowns.start(ALICE, 0, -1));
        expect(IllegalArgumentException.class, () -> cooldowns.remainingTicks(ALICE, -1));
        cooldowns.start(ALICE, 5_000, 1_200);
        cooldowns.start(BOB, 5_000, 1_200);
        cooldowns.clear();
        check(cooldowns.isReady(ALICE, 0) && cooldowns.isReady(BOB, 0),
                "Lifecycle reset clears every player before a new world's clock starts");
    }

    private static void finishFromRequestedWave(TrialSession session, long now) {
        int remainingWaves = session.plan().waves().size() - session.waveIndex();
        for (int i = 0; i < remainingWaves; i++) {
            List<UUID> ids = freshMobs(session.nextWave().mobCount());
            session.registerWaveMobs(ids);
            ids.forEach(session::mobDefeated);
            TrialSession.Event event = session.advance(++now);
            if (i == remainingWaves - 1) {
                check(event == TrialSession.Event.SUCCEEDED, "Final clear emits success");
            } else {
                check(event == TrialSession.Event.NONE, "Nonfinal clear starts intermission");
                now += session.plan().intermissionTicks();
                check(session.advance(now) == TrialSession.Event.SPAWN_WAVE, "Next wave requested");
            }
        }
    }

    private static TrialPlan plan(int party, long seed) {
        return TrialPlanner.plan(Aspect.VERDANT, TrialTier.INITIATE, party, seed);
    }

    private static void hazardWarningsAndLag() {
        expect(IllegalArgumentException.class, () -> new HazardSchedule(TrialTier.INITIATE));
        for (TrialTier tier : List.of(TrialTier.ADEPT, TrialTier.EXALTED)) {
            HazardSchedule clock = new HazardSchedule(tier);
            check(clock.warningTicks() >= 40, "Every tier provides two seconds warning");
            check(clock.advance(0, 0) == HazardSchedule.Event.NONE, "Combat starts with grace");
            check(clock.advance(59, 0) == HazardSchedule.Event.NONE, "Full initial grace");
            check(clock.advance(1_000, 0) == HazardSchedule.Event.WARNING, "Delayed polling emits warning first");
            check(clock.impactTick() == 1_000 + clock.warningTicks(), "Warning clock begins on actual emission");
            check(clock.advance(1_000, 0) == HazardSchedule.Event.NONE, "No duplicate same-tick warning");
            check(clock.advance(1_039, 0) == HazardSchedule.Event.NONE, "No early impact after lag");
            long firstImpact = 1_000 + clock.warningTicks();
            check(clock.advance(firstImpact, 0) == HazardSchedule.Event.IMPACT, "Impact after full warning");
            check(clock.advance(firstImpact, 0) == HazardSchedule.Event.NONE, "No duplicate same-tick impact");
            long nextWarning = firstImpact + 200 - clock.warningTicks();
            check(clock.advance(nextWarning, 0) == HazardSchedule.Event.WARNING, "Next warning scheduled");
            check(clock.advance(firstImpact + 199, 0) == HazardSchedule.Event.NONE, "Impacts never occur less than 200 ticks apart");
            check(clock.advance(firstImpact + 200, 0) == HazardSchedule.Event.IMPACT, "Exact repeat interval");
            check(clock.advance(firstImpact + 201, -1) == HazardSchedule.Event.NONE, "Intermission suspends");
            check(clock.advance(firstImpact + 202, 1) == HazardSchedule.Event.NONE, "New wave grace");
            check(clock.advance(firstImpact + 262, 1) == HazardSchedule.Event.WARNING, "New wave warning");
            check(clock.impactTick() >= firstImpact + 400, "Wave change cannot bypass impact interval");
            check(clock.advance(firstImpact + 263, -1) == HazardSchedule.Event.NONE, "Intermission cancels pending impact");
            check(!clock.isWarning(), "Cancelled warning has no remaining zone");
            check(clock.advance(firstImpact + 600, -1) == HazardSchedule.Event.NONE, "Cancelled warning cannot strike later");
            clock.advance(firstImpact + 601, 2);
            clock.advance(firstImpact + 661, 2);
            clock.stop();
            check(!clock.isWarning() && clock.advance(firstImpact + 1_000, 2) == HazardSchedule.Event.NONE,
                    "Terminal cleanup permanently stops pending and future hazards");
            expect(IllegalArgumentException.class, () -> clock.advance(0, 2));
        }
        HazardSchedule overflow = new HazardSchedule(TrialTier.EXALTED);
        overflow.advance(Long.MAX_VALUE - 20, 0);
        check(overflow.advance(Long.MAX_VALUE, 0) == HazardSchedule.Event.NONE,
                "Overflow cannot shorten warning into an immediate impact");
    }

    private static void hazardGeometry() {
        for (Aspect aspect : Aspect.values()) {
            HazardZone zone = HazardZone.create(aspect, 42, 1, 4, 6);
            check(zone.equals(HazardZone.create(aspect, 42, 1, 4, 6)), "Zone planning is deterministic");
            check(!zone.markers().isEmpty() && zone.markers().size() <= 625, "Every hazard has bounded visible markers");
            for (HazardZone.Point point : zone.markers()) {
                check(zone.contains(point.x(), point.z()), "Visible markers match damaging geometry");
            }
            check(!zone.contains(25, 0) && !zone.contains(Double.NaN, 0), "Zone cannot affect outside arena or invalid coordinates");
            expect(UnsupportedOperationException.class, () -> zone.markers().clear());
        }
        HazardZone roots = new HazardZone(Aspect.VERDANT, 100, 0, 0);
        check(roots.focusX() == 18 && roots.contains(21, 0) && !roots.contains(21.01, 0), "Root target clamps and has exact radius");
        HazardZone ember = new HazardZone(Aspect.EMBER, 0, 0, 0);
        check(ember.contains(0, 6) && ember.contains(0, -6) && !ember.contains(0, 0), "Ember lanes leave a safe gap");
        HazardZone tidal = new HazardZone(Aspect.TIDAL, 0, 0, 0);
        check(tidal.contains(6, 0) && tidal.contains(18, 0) && !tidal.contains(5.99, 0)
                && !tidal.contains(18.01, 0), "Tidal ring has readable safe inner and outer zones");
        HazardZone hollow = new HazardZone(Aspect.HOLLOW, 0, 0, Math.PI / 2);
        check(hollow.contains(0, 12) && !hollow.contains(5, 0), "Hollow line rotation");
        expect(IllegalArgumentException.class, () -> HazardZone.create(Aspect.EMBER, 0, 0, 0, 0));
        expect(IllegalArgumentException.class, () -> new HazardZone(Aspect.TIDAL, Double.NaN, 0, 0));
    }

    private static List<UUID> freshMobs(int count) {
        List<UUID> ids = new ArrayList<>();
        for (int i = 0; i < count; i++) ids.add(new UUID(0, nextId++));
        return ids;
    }

    private static void check(boolean condition, String message) {
        checks++;
        if (!condition) throw new AssertionError(message);
    }

    private static void expect(Class<? extends Throwable> type, Runnable action) {
        checks++;
        try {
            action.run();
        } catch (Throwable thrown) {
            if (type.isInstance(thrown)) return;
            throw new AssertionError("Expected " + type.getSimpleName() + ", got " + thrown, thrown);
        }
        throw new AssertionError("Expected " + type.getSimpleName());
    }
}
