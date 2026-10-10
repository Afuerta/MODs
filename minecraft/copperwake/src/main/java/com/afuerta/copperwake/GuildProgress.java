package com.afuerta.copperwake;

import net.minecraft.scoreboard.ScoreHolder;
import net.minecraft.scoreboard.Scoreboard;
import net.minecraft.scoreboard.ScoreboardCriterion;
import net.minecraft.scoreboard.ScoreboardObjective;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;

/** Server scoreboard storage is world-saved, death-safe, and keyed by UUID (not username). */
final class GuildProgress {
    private static ScoreboardObjective objective(Scoreboard board, String key) {
        var existing = board.getNullableObjective(key);
        return existing != null ? existing : board.addObjective(key, ScoreboardCriterion.DUMMY,
                Text.literal(key), ScoreboardCriterion.RenderType.INTEGER, false, null);
    }
    static int get(ServerPlayerEntity player, String key) {
        var board = player.getScoreboard();
        return board.getOrCreateScore(ScoreHolder.fromName(player.getUuidAsString()), objective(board, key)).getScore();
    }
    static void put(ServerPlayerEntity player, String key, int value) {
        var board = player.getScoreboard();
        board.getOrCreateScore(ScoreHolder.fromName(player.getUuidAsString()), objective(board, key)).setScore(value);
    }
    static int completed(ServerPlayerEntity player) { return Math.max(0, get(player, "cw_contracts")); }
    static void complete(ServerPlayerEntity player) {
        int value = completed(player);
        put(player, "cw_contracts", value == Integer.MAX_VALUE ? value : value + 1);
    }
    private GuildProgress() { }
}
