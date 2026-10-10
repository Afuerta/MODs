package com.afuerta.riftbound.domain;

import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Server-thread encounter state machine. The adapter owns entities, inventory and persistence.
 * A SPAWN_WAVE event must be acknowledged with registerWaveMobs before any kills count.
 * Call withdraw on death, logout or arena departure; departed players cannot rejoin this run.
 */
public final class TrialSession {
    public enum State { WARMUP, SPAWNING, ACTIVE, INTERMISSION, SUCCEEDED, FAILED }
    public enum Event { NONE, SPAWN_WAVE, SUCCEEDED, FAILED }
    public enum FailureReason {
        TIMEOUT, NO_PARTICIPANTS, ANCHOR_REMOVED, WORLD_UNLOADED, SPAWN_FAILED, SERVER_STOPPED, CANCELLED
    }

    private final TrialPlan plan;
    private final Set<UUID> participants;
    private final Set<UUID> eligible;
    private final Set<UUID> activeMobs = new HashSet<>();
    private final Set<UUID> seenMobs = new HashSet<>();
    private final long deadlineTick;
    private long phaseDeadlineTick;
    private long lastTick;
    private int waveIndex = -1;
    private State state = State.WARMUP;
    private FailureReason failureReason;
    private boolean terminalEventDelivered;
    private boolean rewardsClaimed;

    public TrialSession(TrialPlan plan, Collection<UUID> participants, long startTick) {
        this.plan = Objects.requireNonNull(plan, "plan");
        Objects.requireNonNull(participants, "participants");
        LinkedHashSet<UUID> snapshot = new LinkedHashSet<>();
        for (UUID participant : participants) snapshot.add(Objects.requireNonNull(participant, "participant"));
        if (snapshot.size() != participants.size() || snapshot.size() != plan.participantCount()) {
            throw new IllegalArgumentException("Snapshot must contain exactly the planned number of unique participants");
        }
        this.participants = Collections.unmodifiableSet(snapshot);
        this.eligible = new LinkedHashSet<>(snapshot);
        this.lastTick = startTick;
        this.deadlineTick = TickMath.deadline(startTick, plan.timeoutTicks());
        this.phaseDeadlineTick = TickMath.deadline(startTick, plan.warmupTicks());
    }

    /**
     * Advance with nondecreasing server ticks. Timeout wins at the exact deadline.
     * Each spawn and terminal event is emitted once, even if called repeatedly in one tick.
     */
    public Event advance(long nowTick) {
        if (nowTick < lastTick) throw new IllegalArgumentException("Trial clock moved backwards");
        lastTick = nowTick;
        if (isTerminal()) return terminalEvent();
        if (nowTick >= deadlineTick) {
            fail(FailureReason.TIMEOUT);
            return terminalEvent();
        }
        if ((state == State.WARMUP || state == State.INTERMISSION) && nowTick >= phaseDeadlineTick) {
            waveIndex++;
            state = State.SPAWNING;
            return Event.SPAWN_WAVE;
        }
        if (state == State.ACTIVE && activeMobs.isEmpty()) {
            if (waveIndex == plan.waves().size() - 1) {
                state = State.SUCCEEDED;
                return terminalEvent();
            }
            state = State.INTERMISSION;
            phaseDeadlineTick = TickMath.deadline(nowTick, plan.intermissionTicks());
        }
        return Event.NONE;
    }

    /** The wave requested by the most recent SPAWN_WAVE event. */
    public WavePlan nextWave() {
        if (state != State.SPAWNING) throw new IllegalStateException("No wave is awaiting spawning");
        return plan.waves().get(waveIndex);
    }

    /**
     * Register only after every entity has spawned successfully. On partial spawn, clean up
     * those entities and fail(SPAWN_FAILED); never register a smaller wave as complete.
     */
    public void registerWaveMobs(Collection<UUID> mobIds) {
        WavePlan wave = nextWave();
        Objects.requireNonNull(mobIds, "mobIds");
        Set<UUID> unique = new HashSet<>();
        for (UUID id : mobIds) unique.add(Objects.requireNonNull(id, "mob id"));
        if (unique.size() != mobIds.size() || unique.size() != wave.mobCount()) {
            throw new IllegalArgumentException("Mob IDs must be unique and match the planned wave size");
        }
        if (!Collections.disjoint(unique, seenMobs)) throw new IllegalArgumentException("Mob ID reused across waves");
        seenMobs.addAll(unique);
        activeMobs.addAll(unique);
        state = State.ACTIVE;
    }

    /** Only registered, live trial enemies count; duplicate or unrelated deaths do nothing. */
    public boolean mobDefeated(UUID mobId) {
        Objects.requireNonNull(mobId, "mobId");
        return state == State.ACTIVE && activeMobs.remove(mobId);
    }

    /**
     * Preserve one outstanding enemy through a Minecraft entity conversion. Returns false
     * without mutation for unrelated/late events, identical IDs, or any reused replacement
     * ID. A retired UUID remains in seenMobs so stale conversions and deaths cannot count.
     */
    public boolean replaceMob(UUID previous, UUID replacement) {
        Objects.requireNonNull(previous, "previous");
        Objects.requireNonNull(replacement, "replacement");
        if (state != State.ACTIVE || !activeMobs.contains(previous) || seenMobs.contains(replacement)) {
            return false;
        }
        activeMobs.remove(previous);
        activeMobs.add(replacement);
        seenMobs.add(replacement);
        return true;
    }

    /** Permanent for this run. A smaller surviving party does not reduce its encounter. */
    public boolean withdraw(UUID participant) {
        Objects.requireNonNull(participant, "participant");
        if (isTerminal() || !eligible.remove(participant)) return false;
        if (eligible.isEmpty()) fail(FailureReason.NO_PARTICIPANTS);
        return true;
    }

    /** The first terminal outcome wins. The next advance emits FAILED once. */
    public boolean fail(FailureReason reason) {
        Objects.requireNonNull(reason, "reason");
        if (isTerminal()) return false;
        failureReason = reason;
        state = State.FAILED;
        return true;
    }

    /** Immutable reward preview; inventory delivery belongs to the server adapter. */
    public Map<UUID, TrialReward> eligibleRewards() {
        if (state != State.SUCCEEDED) return Map.of();
        Map<UUID, TrialReward> rewards = new LinkedHashMap<>();
        for (UUID participant : eligible) rewards.put(participant, plan.reward());
        return Collections.unmodifiableMap(rewards);
    }

    /** Prefer this at delivery time to prevent duplicate rewards from repeated callbacks. */
    public Map<UUID, TrialReward> claimRewards() {
        if (state != State.SUCCEEDED || rewardsClaimed) return Map.of();
        rewardsClaimed = true;
        return eligibleRewards();
    }

    public TrialPlan plan() { return plan; }
    public State state() { return state; }
    public Set<UUID> participants() { return participants; }
    public Set<UUID> eligibleParticipants() { return Set.copyOf(eligible); }
    public Set<UUID> activeMobs() { return Set.copyOf(activeMobs); }
    public int waveIndex() { return waveIndex; }
    public long deadlineTick() { return deadlineTick; }
    public long remainingTicks(long nowTick) {
        if (nowTick < 0) throw new IllegalArgumentException("Negative tick");
        return isTerminal() || nowTick >= deadlineTick ? 0 : deadlineTick - nowTick;
    }
    public Optional<FailureReason> failureReason() { return Optional.ofNullable(failureReason); }
    public boolean isTerminal() { return state == State.SUCCEEDED || state == State.FAILED; }

    private Event terminalEvent() {
        if (terminalEventDelivered) return Event.NONE;
        terminalEventDelivered = true;
        return state == State.SUCCEEDED ? Event.SUCCEEDED : Event.FAILED;
    }
}
