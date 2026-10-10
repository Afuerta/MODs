package com.afuerta.convergence;

import net.minecraft.scoreboard.ScoreHolder;
import net.minecraft.scoreboard.ScoreboardCriterion;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;

/** UUID-based vanilla scores persist across world saves, reconnects, death and name changes. */
final class ConvergenceProgress {
    static final String OBJECTIVE = "convergence_jobs";

    static int read(ServerPlayerEntity player, String objectiveName) {
        var board = player.getScoreboard();
        var objective = board.getNullableObjective(objectiveName);
        if (objective == null) return 0;
        var score = board.getScore(ScoreHolder.fromName(player.getUuidAsString()), objective);
        return score == null ? 0 : Math.max(0, score.getScore());
    }

    static int completed(ServerPlayerEntity player) { return read(player, OBJECTIVE); }
    static int riftTier(ServerPlayerEntity player) { return Math.min(3, read(player, "riftbound_progress")); }
    static int guildContracts(ServerPlayerEntity player) { return read(player, "cw_contracts"); }

    static void setCompleted(ServerPlayerEntity player, int value) {
        if (value < 0) throw new IllegalArgumentException("Negative commission completion");
        var board = player.getScoreboard();
        var objective = board.getNullableObjective(OBJECTIVE);
        if (objective == null) objective = board.addObjective(OBJECTIVE, ScoreboardCriterion.DUMMY,
                Text.translatable("scoreboard.convergence.progress"), ScoreboardCriterion.RenderType.INTEGER, false, null);
        board.getOrCreateScore(ScoreHolder.fromName(player.getUuidAsString()), objective).setScore(value);
    }

    private ConvergenceProgress() { }
}
