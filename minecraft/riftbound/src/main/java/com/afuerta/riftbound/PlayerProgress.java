package com.afuerta.riftbound;

import net.minecraft.scoreboard.Scoreboard;
import net.minecraft.scoreboard.ScoreboardCriterion;
import net.minecraft.scoreboard.ScoreboardObjective;
import net.minecraft.scoreboard.ScoreHolder;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;

/** Vanilla scoreboard storage survives world saves without client synchronization packets. */
final class PlayerProgress {
    private static ScoreboardObjective objective(Scoreboard board) {
        var existing = board.getNullableObjective("riftbound_progress");
        return existing != null ? existing : board.addObjective("riftbound_progress",
                ScoreboardCriterion.DUMMY, Text.literal("Riftbound progression"),
                ScoreboardCriterion.RenderType.INTEGER, false, null);
    }

    static int completedTier(ServerPlayerEntity player) {
        var board = player.getScoreboard();
        return Math.clamp(board.getOrCreateScore(ScoreHolder.fromName(player.getUuid().toString()),
                objective(board)).getScore(), 0, 3);
    }

    static void complete(ServerPlayerEntity player, int tier) {
        var board = player.getScoreboard();
        var score = board.getOrCreateScore(ScoreHolder.fromName(player.getUuid().toString()), objective(board));
        score.setScore(Math.max(score.getScore(), tier));
    }
}
