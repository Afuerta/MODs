package com.afuerta.convergence;

import com.afuerta.convergence.domain.CommissionCatalog;
import io.github.afuerta.starfall.event.ProtectedTerrain;
import net.fabricmc.fabric.api.gametest.v1.FabricGameTest;
import net.minecraft.item.ItemStack;
import net.minecraft.nbt.NbtCompound;
import net.minecraft.nbt.NbtElement;
import net.minecraft.nbt.StringNbtReader;
import net.minecraft.registry.Registries;
import net.minecraft.scoreboard.ScoreHolder;
import net.minecraft.scoreboard.Scoreboard;
import net.minecraft.scoreboard.ScoreboardState;
import net.minecraft.test.GameTest;
import net.minecraft.test.TestContext;
import net.minecraft.util.Identifier;
import net.minecraft.util.math.BlockPos;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/** Reads authored T23-format input rather than generating a fixture with the new writer. */
public final class PackUpgradeGameTests implements FabricGameTest {
    private static final String VETERAN = "00000000-0000-0000-0000-000000000001";
    private static final String ADEPT = "00000000-0000-0000-0000-000000000002";
    private static final String TRAVELER = "00000000-0000-0000-0000-000000000003";

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void legacyUuidProgressRetainsUnlocksAndCircuitPosition(TestContext context) {
        Scoreboard board = new Scoreboard();
        new ScoreboardState(board).readNbt(fixture().getCompound("scoreboard"),
                context.getWorld().getRegistryManager());
        context.assertTrue(board.getObjectives().size() == 3, "All original objective IDs load");
        context.assertTrue(score(context, board, VETERAN, "riftbound_progress") == 3,
                "Veteran retains Exalted unlock");
        context.assertTrue(score(context, board, VETERAN, "cw_contracts") == 12,
                "Veteran retains Artificer rank");
        var secondCircuit = CommissionCatalog.current(score(context, board, VETERAN, "convergence_jobs"));
        context.assertTrue(secondCircuit.id().equals("first_signal"), "Completed circuit resumes at original first job");
        context.assertTrue(secondCircuit.requirements().get("copperwake:scrap") == 16
                        && secondCircuit.requirements().get("riftbound:resonance_shard") == 4,
                "Saved circuit retains doubled material costs");

        context.assertTrue(score(context, board, ADEPT, "riftbound_progress") == 2
                        && score(context, board, ADEPT, "cw_contracts") == 4,
                "Adept and Mechanist gates retain original values");
        var trophyJob = CommissionCatalog.current(score(context, board, ADEPT, "convergence_jobs"));
        context.assertTrue(trophyJob.id().equals("adept_concord")
                        && trophyJob.requirements().get("convergence:concordance") == 1,
                "Saved fifth completion still requires the earned trophy");

        var lockedJob = CommissionCatalog.current(score(context, board, TRAVELER, "convergence_jobs"));
        context.assertTrue(lockedJob.id().equals("hollow_navigation"), "Saved job ordering is unchanged");
        context.assertTrue(score(context, board, TRAVELER, "cw_contracts") == 11
                        && lockedJob.minimumGuildContracts() == 12,
                "An existing near-Artificer save remains below its delivery gate");
        context.assertTrue(score(context, board, TRAVELER, "riftbound_progress") == 1
                        && lockedJob.minimumRiftTier() == 2,
                "New encounters do not promote legacy Initiate progress");
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void legacyInventoryIdsCountsAndToolComponentsDecode(TestContext context) {
        var inventory = fixture().getList("inventory", NbtElement.COMPOUND_TYPE);
        String[] ids = {"riftbound:resonance_shard", "copperwake:memory_glass",
                "starfall:starsteel_pickaxe", "convergence:concordance"};
        int[] counts = {64, 12, 1, 5};
        context.assertTrue(inventory.size() == ids.length, "Fixture covers all four authored namespaces");
        for (int i = 0; i < ids.length; i++) {
            ItemStack stack = ItemStack.fromNbt(context.getWorld().getRegistryManager(), inventory.getCompound(i))
                    .orElseThrow(() -> new AssertionError("Legacy stack failed vanilla decoding"));
            Identifier id = Identifier.of(ids[i]);
            context.assertTrue(Registries.ITEM.containsId(id) && stack.isOf(Registries.ITEM.get(id)),
                    "Original item identity survives: " + id);
            context.assertTrue(stack.getCount() == counts[i], "Existing stack count survives: " + id);
            if (i == 2) {
                context.assertTrue(stack.getDamage() == 202, "Legacy Starsteel durability is retained");
                context.assertTrue(stack.getName().getString().equals("Old Starsteel Pick"),
                        "Legacy tool custom name is retained");
            }
        }
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void legacyProtectedColumnsRetainNegativeAndBitBoundaryPositions(TestContext context) {
        ProtectedTerrain protection = ProtectedTerrain.read(fixture().getCompound("protected_terrain"),
                context.getWorld().getRegistryManager());
        for (BlockPos position : new BlockPos[] {new BlockPos(-1, 64, -1), new BlockPos(0, 64, 0),
                new BlockPos(15, 64, 3), new BlockPos(0, 64, 4)}) {
            context.assertTrue(protection.isProtected(position), "Legacy protected column survives: " + position);
            context.assertTrue(protection.isProtected(position.withY(200)), "Protection remains column-wide");
        }
        context.assertFalse(protection.isProtected(new BlockPos(-2, 64, -1)), "Adjacent negative column remains unclaimed");
        context.assertFalse(protection.isProtected(new BlockPos(1, 64, 0)), "Adjacent origin column remains unclaimed");
        context.assertFalse(protection.isProtected(new BlockPos(16, 64, 4)), "Other chunk does not inherit bit mask");
        context.complete();
    }

    private static int score(TestContext context, Scoreboard board, String uuid, String name) {
        var objective = board.getNullableObjective(name);
        context.assertTrue(objective != null, "Legacy objective exists: " + name);
        var value = board.getScore(ScoreHolder.fromName(uuid), objective);
        context.assertTrue(value != null, "Legacy UUID score exists: " + name);
        return value.getScore();
    }

    private static NbtCompound fixture() {
        try (InputStream input = PackUpgradeGameTests.class.getResourceAsStream("/fixtures/convergence-v0.2.0.snbt")) {
            if (input == null) throw new AssertionError("Missing committed legacy-format fixture");
            return StringNbtReader.parse(new String(input.readAllBytes(), StandardCharsets.UTF_8));
        } catch (Exception exception) {
            throw new AssertionError("Cannot decode committed legacy-format fixture", exception);
        }
    }
}
