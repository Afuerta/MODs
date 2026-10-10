package io.github.afuerta.starfall;

import com.mojang.authlib.GameProfile;
import io.github.afuerta.starfall.event.StarImpactData;
import io.github.afuerta.starfall.item.StarCompassItem;
import io.github.afuerta.starfall.registry.ModBlocks;
import io.github.afuerta.starfall.registry.ModItems;
import net.fabricmc.fabric.api.gametest.v1.FabricGameTest;
import net.minecraft.block.Blocks;
import net.minecraft.component.DataComponentTypes;
import net.minecraft.component.type.LodestoneTrackerComponent;
import net.minecraft.datafixer.Schemas;
import net.minecraft.item.ItemStack;
import net.minecraft.nbt.NbtCompound;
import net.minecraft.nbt.NbtList;
import net.minecraft.server.network.ConnectedClientData;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.test.GameTest;
import net.minecraft.test.TestContext;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.GlobalPos;
import net.minecraft.world.World;
import net.minecraft.world.PersistentState;
import net.minecraft.world.PersistentStateManager;
import java.util.Optional;
import java.util.UUID;
import java.io.IOException;
import java.nio.file.Files;

/** Engine checks for saved meteor discovery and the real client-facing compass component. */
public final class StarCompassGameTests implements FabricGameTest {
    @GameTest(templateName = EMPTY_STRUCTURE)
    public void nearestSelectionUsesDistanceAndStableCoordinateTies(TestContext context) {
        var impacts = new StarImpactData();
        var origin = new BlockPos(0, 70, 0);
        context.assertTrue(impacts.nearest(origin).isEmpty(), "Empty index returned a target");
        impacts.record(origin.east(4), 10);
        impacts.record(origin.west(4), 20);
        context.assertEquals(Optional.of(origin.west(4)), impacts.nearest(origin),
                "Equal-distance selection must not depend on record order or landing time");
        impacts.record(origin.up(3), 30);
        context.assertEquals(Optional.of(origin.up(3)), impacts.nearest(origin),
                "Nearest discovery ignored vertical distance");
        impacts.record(origin.south(2), 40);
        context.assertEquals(Optional.of(origin.south(2)), impacts.nearest(origin), "Closer star did not replace target");
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void duplicatesAndMutablePositionsCannotBypassRetentionLimit(TestContext context) {
        var impacts = new StarImpactData();
        var mutable = new BlockPos.Mutable(0, 64, 0);
        impacts.record(mutable, 1);
        mutable.set(999, 64, 999);
        context.assertEquals(Optional.of(new BlockPos(0, 64, 0)), impacts.nearest(BlockPos.ORIGIN),
                "Moving the caller's mutable position corrupted remembered data");
        for (int i = 1; i < 64; i++) impacts.record(new BlockPos(i, 64, 0), i + 1);
        impacts.record(new BlockPos(0, 64, 0), 100);
        impacts.record(new BlockPos(0, 64, 0), 0);
        context.assertEquals(64, impacts.size(), "Duplicate impacts consumed index capacity");
        impacts.record(new BlockPos(64, 64, 0), 101);
        context.assertEquals(64, impacts.size(), "Retention exceeded its 64-star limit");
        context.assertFalse(impacts.entries().stream().anyMatch(entry -> entry.position().equals(new BlockPos(1, 64, 0))),
                "Overflow did not evict the oldest landing");
        context.assertTrue(impacts.entries().stream().anyMatch(entry -> entry.position().equals(new BlockPos(0, 64, 0))
                && entry.landedAt() == 100), "An older duplicate undid the refreshed landing time");
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void savedIndexRoundTripsAndRejectsMalformedEntries(TestContext context) throws IOException {
        var impacts = new StarImpactData();
        impacts.record(new BlockPos(-331, -40, 273), 40);
        impacts.record(new BlockPos(800, 100, -213), 12);
        var lookup = context.getWorld().getRegistryManager();
        var directory = Files.createTempDirectory("starfall-impact-gametest-");
        try {
            var manager = new PersistentStateManager(directory.toFile(), Schemas.getFixer(), lookup);
            manager.set("starfall_impacts", impacts);
            manager.save();
            context.assertTrue(Files.isRegularFile(directory.resolve("starfall_impacts.dat")), "World state manager did not write the index");
            var reopened = new PersistentStateManager(directory.toFile(), Schemas.getFixer(), lookup);
            var type = new PersistentState.Type<>(StarImpactData::new, StarImpactData::fromNbt, null);
            var restored = reopened.get(type, "starfall_impacts");
            context.assertTrue(restored != null, "A fresh world state manager could not reopen the saved index");
            context.assertEquals(impacts.entries(), restored.entries(), "Saved positions or landing times changed after disk reload");
        } finally {
            Files.deleteIfExists(directory.resolve("starfall_impacts.dat"));
            Files.deleteIfExists(directory);
        }
        var entries = new NbtList();
        entries.add(new NbtCompound());
        var wrongType = new NbtCompound();
        wrongType.putString("pos", "not-a-position");
        wrongType.putLong("landed_at", 1);
        entries.add(wrongType);
        var missingTime = new NbtCompound();
        missingTime.putLong("pos", new BlockPos(90, 70, 90).asLong());
        entries.add(missingTime);
        var malformed = new NbtCompound();
        malformed.put("stars", entries);
        context.assertEquals(0, StarImpactData.fromNbt(malformed, lookup).size(), "Malformed entries created phantom star targets");
        // Recover a real saved list substantially larger than capacity, without retaining unbounded state.
        for (int i = 0; i < 100; i++) {
            var entry = new NbtCompound();
            entry.putLong("pos", new BlockPos(i, 70, 0).asLong());
            entry.putLong("landed_at", i);
            entries.add(entry);
        }
        var bounded = StarImpactData.fromNbt(malformed, lookup);
        context.assertEquals(64, bounded.size(), "Oversized save did not recover to the bounded retention limit");
        context.assertEquals(new BlockPos(36, 70, 0), bounded.entries().getFirst().position(),
                "Recovery kept older stars in preference to recent ones");
        context.complete();
    }

    @GameTest(templateName = "starfall_test:arena")
    public void minedAndReplacedStarsPruneButUnloadedStarsRemainUnloaded(TestContext context) {
        var world = context.getWorld();
        var impacts = new StarImpactData();
        var mined = context.getAbsolutePos(new BlockPos(4, 3, 4));
        var replaced = mined.east(3);
        var unloaded = new BlockPos(1_400_000, 70, -1_400_000);
        world.setBlockState(mined, ModBlocks.FALLEN_STAR.getDefaultState());
        world.setBlockState(replaced, ModBlocks.FALLEN_STAR.getDefaultState());
        impacts.record(mined, 1);
        impacts.record(replaced, 2);
        impacts.record(unloaded, 3);
        context.assertFalse(world.isChunkLoaded(unloaded), "Unloaded-target fixture is already loaded");
        context.assertEquals(0, impacts.pruneMissing(world), "Existing or unloaded stars were pruned");
        world.breakBlock(mined, false);
        world.setBlockState(replaced, Blocks.STONE.getDefaultState());
        context.assertEquals(Optional.of(unloaded), impacts.nearest(world, mined),
                "Compass selection retained a mined or replaced star");
        context.assertEquals(1, impacts.size(), "Pruning did not remove exactly the two stale loaded targets");
        context.assertFalse(world.isChunkLoaded(unloaded), "Discovery force-loaded a remembered target's chunk");
        context.complete();
    }

    @GameTest(templateName = "starfall_test:arena", tickLimit = 60)
    public void compassRefreshesAfterMiningAndSpinsWhenNoTargetRemains(TestContext context) {
        var world = context.getWorld();
        var near = context.getAbsolutePos(new BlockPos(5, 3, 5));
        var far = near.east(3);
        // Exercise the inventory callback on a real refresh tick rather than bypassing its scheduler.
        context.runAtEveryTick(() -> {
            if (world.getTime() % 20 != 0) return;
            var impacts = StarImpactData.get(world);
            // Preserve other fixtures while isolating this compass's per-world index for this callback.
            var previous = impacts.entries();
            previous.forEach(entry -> impacts.remove(entry.position()));
            try {
                world.setBlockState(near, ModBlocks.FALLEN_STAR.getDefaultState());
                world.setBlockState(far, ModBlocks.FALLEN_STAR.getDefaultState());
                impacts.record(near, 1);
                impacts.record(far, 2);
                var compass = new ItemStack(ModItems.STAR_COMPASS);
                var profile = new GameProfile(UUID.randomUUID(), "compass-refresh");
                var player = new ServerPlayerEntity(world.getServer(), world, profile,
                        ConnectedClientData.createDefault(profile, false).syncedOptions());
                player.refreshPositionAndAngles(near.getX() + .5, near.getY(), near.getZ() + .5, 0, 0);
                ModItems.STAR_COMPASS.inventoryTick(compass, world, player, 0, true);
                assertTarget(context, compass, Optional.of(GlobalPos.create(world.getRegistryKey(), near)));
                world.breakBlock(near, false);
                context.assertEquals(1, impacts.size(), "Mining did not immediately retire its remembered target");
                ModItems.STAR_COMPASS.inventoryTick(compass, world, player, 0, true);
                assertTarget(context, compass, Optional.of(GlobalPos.create(world.getRegistryKey(), far)));
                world.setBlockState(far, Blocks.STONE.getDefaultState());
                ModItems.STAR_COMPASS.inventoryTick(compass, world, player, 0, true);
                assertTarget(context, compass, Optional.empty());
                context.assertEquals(0, impacts.size(), "Finished targets were retained by item refresh");
            } finally {
                impacts.remove(near);
                impacts.remove(far);
                previous.forEach(entry -> impacts.record(entry.position(), entry.landedAt()));
            }
            context.complete();
        });
    }

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void inventoryTickClearsOtherDimensionSignalAndRefreshUsesDestinationIndex(TestContext context) {
        var world = context.getWorld();
        var nether = world.getServer().getWorld(World.NETHER);
        context.assertTrue(nether != null, "Server did not create the Nether fixture");
        var impacts = StarImpactData.get(nether);
        var previous = impacts.entries();
        previous.forEach(entry -> impacts.remove(entry.position()));
        var remembered = new BlockPos(-1_450_000, 70, 1_450_000);
        try {
            impacts.record(remembered, 1);
            context.assertFalse(nether.isChunkLoaded(remembered), "Nether target should begin unloaded");
            var compass = new ItemStack(ModItems.STAR_COMPASS);
            compass.set(DataComponentTypes.LODESTONE_TRACKER,
                    new LodestoneTrackerComponent(Optional.of(GlobalPos.create(world.getRegistryKey(), BlockPos.ORIGIN)), false));
            var profile = new GameProfile(UUID.randomUUID(), "star-compass-test");
            var player = new ServerPlayerEntity(nether.getServer(), nether, profile,
                    ConnectedClientData.createDefault(profile, false).syncedOptions());
            // Call Minecraft's actual item inventory callback with a holder in the destination dimension.
            ModItems.STAR_COMPASS.inventoryTick(compass, nether, player, 0, true);
            assertTarget(context, compass, nether.getTime() % 20 == 0
                    ? Optional.of(GlobalPos.create(World.NETHER, remembered)) : Optional.empty());
            StarCompassItem.updateTarget(compass, nether, player.getBlockPos());
            assertTarget(context, compass, Optional.of(GlobalPos.create(World.NETHER, remembered)));
            context.assertFalse(nether.isChunkLoaded(remembered), "Dimension refresh loaded the target chunk");
        } finally {
            impacts.remove(remembered);
            previous.forEach(entry -> impacts.record(entry.position(), entry.landedAt()));
        }
        context.complete();
    }

    private static void assertTarget(TestContext context, ItemStack compass, Optional<GlobalPos> expected) {
        var tracker = compass.get(DataComponentTypes.LODESTONE_TRACKER);
        context.assertTrue(tracker != null, "Star compass has no client-readable direction component");
        context.assertEquals(expected, tracker.target(), "Compass points to the wrong location or dimension");
        context.assertFalse(tracker.tracked(), "Vanilla lodestone validation would invalidate a fallen-star target");
    }
}
