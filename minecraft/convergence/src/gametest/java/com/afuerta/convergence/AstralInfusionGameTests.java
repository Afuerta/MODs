package com.afuerta.convergence;

import com.afuerta.convergence.domain.InfusionCatalog;
import net.fabricmc.fabric.api.gametest.v1.FabricGameTest;
import net.minecraft.block.Block;
import net.minecraft.block.Blocks;
import net.minecraft.block.entity.HopperBlockEntity;
import net.minecraft.inventory.SimpleInventory;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.nbt.NbtCompound;
import net.minecraft.registry.Registries;
import net.minecraft.screen.ScreenHandlerType;
import net.minecraft.screen.slot.SlotActionType;
import net.minecraft.test.GameTest;
import net.minecraft.test.TestContext;
import net.minecraft.util.Identifier;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.Direction;
import net.minecraft.world.GameMode;

/** Actual block entities, vanilla inventory clicks/hopper routing and registry-aware NBT. */
public final class AstralInfusionGameTests implements FabricGameTest {
    private static final BlockPos RELATIVE = new BlockPos(2, 2, 2);

    @GameTest(templateName = EMPTY_STRUCTURE, batchId = "infusion")
    public void allFourInfusionsConsumeExactlyOnceAndPreserveUnusedCatalysts(TestContext context) {
        withNight(context, () -> {
            var station = station(context);
            for (var recipe : InfusionCatalog.all()) {
                station.clear(); fill(station, recipe, 1);
                if (recipe.ingredients().get(5) == null) station.setStack(5, new ItemStack(ConvergenceMod.MATRIX, 3));
                steps(station, 9);
                context.assertTrue(station.getStack(7).isEmpty(), "Infusion completed before ten processing seconds");
                context.assertEquals(180, station.progress(), "In-flight time did not advance in bounded steps");
                for (int slot = 0; slot < InfusionCatalog.INPUTS; slot++) {
                    var ingredient = recipe.ingredients().get(slot);
                    if (ingredient != null) context.assertEquals(ingredient.count(), station.getStack(slot).getCount(), "In-flight payment happened early");
                }
                station.processStep();
                context.assertTrue(station.getStack(7).isOf(Registries.ITEM.get(Identifier.of(recipe.output()))), "Wrong infused relic");
                context.assertEquals(1, station.getStack(7).getCount(), "Wrong result count");
                for (int slot = 0; slot < InfusionCatalog.INPUTS; slot++) {
                    var ingredient = recipe.ingredients().get(slot);
                    if (ingredient != null) context.assertTrue(station.getStack(slot).isEmpty(), "Consumed incorrect input amount");
                }
                if (recipe.ingredients().get(5) == null) context.assertEquals(3, station.getStack(5).getCount(), "Unused Matrix catalyst was consumed");
                steps(station, 20);
                context.assertTrue(station.getStack(8).isEmpty(), "Unfunded retry duplicated the result");
            }
        });
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE, batchId = "infusion")
    public void everyMissingIngredientRejectsWholeTransactionIncludingEarnedTrophy(TestContext context) {
        withNight(context, () -> {
            var station = station(context);
            for (var recipe : InfusionCatalog.all()) for (int missing = 0; missing < InfusionCatalog.INPUTS; missing++) {
                var ingredient = recipe.ingredients().get(missing);
                if (ingredient == null) continue;
                station.clear(); fill(station, recipe, 1);
                station.getStack(missing).decrement(1);
                int[] before = counts(station);
                steps(station, 12);
                for (int slot = 0; slot < 9; slot++) context.assertEquals(before[slot], station.getStack(slot).getCount(), "Missing input spent unrelated materials");
                context.assertEquals(0, station.progress(), "Incomplete inputs accrued infusion time");
            }
            station.clear(); fill(station, InfusionCatalog.all().getFirst(), 1);
            station.setStack(0, new ItemStack(Items.DIRT, 2));
            steps(station, 12);
            context.assertTrue(station.getStack(7).isEmpty(), "Invalid Rift material was accepted");
            context.assertEquals(1, station.getStack(3).getCount(), "Invalid material spent the earned Concordance");
        });
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE, batchId = "infusion")
    public void daylightWeatherAndInstantRoofPauseWithoutPaymentOrLostProgress(TestContext context) {
        withNight(context, () -> {
            var station = station(context); fill(station, InfusionCatalog.all().getFirst(), 1);
            steps(station, 4);
            context.getWorld().setTimeOfDay(6000); steps(station, 15);
            context.assertEquals(80, station.progress(), "Daylight did not preserve paused progress");
            context.assertEquals("night", station.status(), "Daylight status was not understandable");
            context.getWorld().setTimeOfDay(18000); weather(context, true, false);
            steps(station, 15); context.assertEquals(80, station.progress(), "Rain did not pause infusion");
            weather(context, true, true);
            steps(station, 15); context.assertEquals(80, station.progress(), "Thunder did not pause infusion");
            weather(context, false, false);
            context.getWorld().setBlockState(station.getPos().up(), Blocks.STONE.getDefaultState(), Block.NOTIFY_LISTENERS);
            // No intervening light-engine tick: the motion-blocking heightmap must reject a newly placed roof immediately.
            station.processStep(); context.assertEquals(80, station.progress(), "A newly built roof was ignored");
            context.assertEquals(1, station.getStack(3).getCount(), "Paused station consumed Concordance");
            context.getWorld().setBlockState(station.getPos().up(), Blocks.AIR.getDefaultState(), Block.NOTIFY_LISTENERS);
            steps(station, 6); context.assertTrue(station.getStack(7).isOf(ConvergenceMod.ASTRAL_LENS), "Night did not resume a paused recipe");
        });
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE, batchId = "infusion")
    public void outputCapacityOverflowAndRecipeChangesRemainAtomic(TestContext context) {
        withNight(context, () -> {
            var station = station(context); fill(station, InfusionCatalog.all().getFirst(), 1); steps(station, 8);
            station.setStack(7, new ItemStack(ConvergenceMod.ASTRAL_LENS));
            station.setStack(8, new ItemStack(ConvergenceMod.STORMWARD_SIGIL));
            station.getStack(7).setCount(64); // Edited/corrupt nonstackable output must block payment, never merge or vanish.
            int[] before = counts(station); steps(station, 10);
            for (int slot = 0; slot < 9; slot++) context.assertEquals(before[slot], station.getStack(slot).getCount(), "Full output consumed or discarded items");
            context.assertEquals(160, station.progress(), "Full output lost saved processing time");
            context.assertEquals("full", station.status(), "Overflow status was not full");
            station.removeStack(8); steps(station, 2);
            context.assertTrue(station.getStack(8).isOf(ConvergenceMod.ASTRAL_LENS), "Restored capacity did not finish in the second output slot");
            context.assertEquals(64, station.getStack(7).getCount(), "Existing overflow output was silently changed");
            station.clear(); fill(station, InfusionCatalog.all().getFirst(), 1); steps(station, 8);
            fill(station, InfusionCatalog.all().get(3), 1); station.processStep();
            context.assertEquals(20, station.progress(), "Changing the recipe reused prior infusion time");
            station.getStack(0).setCount(65); steps(station, 20);
            context.assertTrue(station.getStack(7).isEmpty(), "Oversized corrupted input was processed");
            context.assertEquals(1, station.getStack(3).getCount(), "Oversized input spent Concordance");
        });
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE, batchId = "infusion")
    public void registryAwareSaveLoadRetainsInventoryProgressAndRejectsUnknownRecipe(TestContext context) {
        withNight(context, () -> {
            var original = station(context); fill(original, InfusionCatalog.all().get(2), 1); steps(original, 7);
            NbtCompound saved = original.createNbt(context.getWorld().getRegistryManager());
            var restored = new AstralInfusionBlockEntity(original.getPos(), original.getCachedState());
            restored.setWorld(context.getWorld()); restored.readNbt(saved, context.getWorld().getRegistryManager());
            context.assertEquals(140, restored.progress(), "Save/load lost in-flight recipe time");
            for (int slot = 0; slot < 9; slot++) context.assertTrue(ItemStack.areEqual(original.getStack(slot), restored.getStack(slot)), "Save/load changed item components/counts");
            context.getWorld().setTimeOfDay(6000); steps(restored, 3);
            context.assertEquals(140, restored.progress(), "A restored station ignored daylight pause");
            context.getWorld().setTimeOfDay(18000); steps(restored, 3);
            context.assertTrue(restored.getStack(7).isOf(ConvergenceMod.EXPEDITION_HARNESS), "Restored recipe did not finish normally");
            context.assertTrue(restored.getStack(3).isEmpty(), "Restored recipe did not consume exactly one trophy");
            saved.putString("InfusionRecipe", "removed_unknown_recipe"); saved.putInt("InfusionProgress", Integer.MAX_VALUE);
            restored.readNbt(saved, context.getWorld().getRegistryManager());
            context.assertEquals(0, restored.progress(), "Unknown persisted recipe retained progress");
            saved.putString("InfusionRecipe", "hollow_harness"); saved.putInt("InfusionProgress", -400);
            restored.readNbt(saved, context.getWorld().getRegistryManager()); context.assertEquals(0, restored.progress(), "Negative saved progress survived");
            saved.putInt("InfusionProgress", Integer.MAX_VALUE); restored.readNbt(saved, context.getWorld().getRegistryManager());
            context.assertEquals(180, restored.progress(), "Saturated saved progress was not bounded below completion");
        });
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE, batchId = "infusion")
    public void realHandlerNormalClicksAndShiftClicksCannotInsertOutputs(TestContext context) {
        var station = station(context);
        var player = context.createMockPlayer(GameMode.SURVIVAL);
        player.refreshPositionAndAngles(station.getPos().getX() + .5, station.getPos().getY(), station.getPos().getZ() + .5, 0, 0);
        var handler = station.createMenu(1, player.getInventory(), player);
        context.assertEquals(ScreenHandlerType.GENERIC_3X3, handler.getType(), "Station requires a missing custom client renderer");
        context.assertTrue(handler.canUse(player), "Nearby station menu was inaccessible");
        handler.setCursorStack(new ItemStack(Items.DIAMOND, 3));
        handler.onSlotClick(7, 0, SlotActionType.PICKUP, player);
        context.assertEquals(3, handler.getCursorStack().getCount(), "Normal output click accepted an arbitrary input");
        context.assertTrue(station.getStack(7).isEmpty(), "Normal click wrote to output");
        handler.onSlotClick(0, 0, SlotActionType.PICKUP, player);
        context.assertTrue(station.getStack(0).isEmpty(), "Normal click accepted unrelated input in Rift slot");
        handler.setCursorStack(ItemStack.EMPTY);
        player.getInventory().setStack(9, new ItemStack(ConvergenceMod.CONCORDANCE, 2));
        handler.onSlotClick(9, 0, SlotActionType.QUICK_MOVE, player);
        context.assertEquals(2, station.getStack(3).getCount(), "Shift-click did not route earned trophy to its input");
        player.getInventory().setStack(9, new ItemStack(ConvergenceMod.ASTRAL_LENS));
        handler.onSlotClick(9, 0, SlotActionType.QUICK_MOVE, player);
        context.assertTrue(player.getInventory().getStack(9).isOf(ConvergenceMod.ASTRAL_LENS), "Shift-click moved a relic into station outputs");
        context.assertTrue(station.getStack(7).isEmpty() && station.getStack(8).isEmpty(), "Shift-click bypassed output insertion restriction");
        station.setStack(7, new ItemStack(ConvergenceMod.MENDER_COIL));
        handler.onSlotClick(7, 0, SlotActionType.QUICK_MOVE, player);
        context.assertTrue(station.getStack(7).isEmpty(), "Shift-click could not retrieve finished output");
        context.getWorld().setBlockState(station.getPos(), Blocks.AIR.getDefaultState(), Block.NOTIFY_LISTENERS);
        context.assertFalse(handler.canUse(player), "Menu remained usable after station destruction");
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE, batchId = "infusion")
    public void actualHopperTransferRoutesInputsAndBottomExtractsOnlyResults(TestContext context) {
        var station = station(context);
        var source = new SimpleInventory(1);
        ItemStack remainder = HopperBlockEntity.transfer(source, station, new ItemStack(ConvergenceMod.CONCORDANCE, 3), Direction.UP);
        context.assertTrue(remainder.isEmpty(), "Top hopper could not insert trophy into correct input");
        context.assertEquals(3, station.getStack(3).getCount(), "Hopper inserted trophy into wrong slot");
        remainder = HopperBlockEntity.transfer(source, station, new ItemStack(ConvergenceMod.FILAMENT, 2), Direction.NORTH);
        context.assertTrue(remainder.isEmpty(), "Side hopper could not insert fuel");
        context.assertEquals(2, station.getStack(6).getCount(), "Hopper fuel route was wrong");
        remainder = HopperBlockEntity.transfer(source, station, new ItemStack(ConvergenceMod.ASTRAL_LENS), Direction.DOWN);
        context.assertEquals(1, remainder.getCount(), "Bottom hopper inserted into output");
        remainder = HopperBlockEntity.transfer(source, station, new ItemStack(Items.DIRT, 5), Direction.UP);
        context.assertEquals(5, remainder.getCount(), "Invalid hopper ingredient was accepted");
        context.setBlockState(RELATIVE.down(), Blocks.HOPPER);
        var below = (HopperBlockEntity) context.getWorld().getBlockEntity(station.getPos().down());
        context.assertFalse(HopperBlockEntity.extract(context.getWorld(), below), "Bottom hopper stole earned input trophies");
        station.setStack(8, new ItemStack(ConvergenceMod.MENDER_COIL));
        context.assertTrue(HopperBlockEntity.extract(context.getWorld(), below), "Bottom hopper could not retrieve result");
        context.assertTrue(station.getStack(8).isEmpty(), "Output extraction duplicated result");
        context.assertTrue(below.getStack(0).isOf(ConvergenceMod.MENDER_COIL), "Bottom hopper retrieved wrong item");
        context.assertEquals(3, station.getStack(3).getCount(), "Output extraction consumed trophies");
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE, batchId = "infusion_tick", tickLimit = 260)
    public void realServerTickerFinishesRecipeUnderOpenNightSky(TestContext context) {
        var world = context.getWorld(); long previousTime = world.getTimeOfDay();
        Weather previousWeather = Weather.capture(context);
        weather(context, false, false); world.setTimeOfDay(18000);
        var station = station(context); clearSky(context, station); fill(station, InfusionCatalog.all().getFirst(), 1);
        context.waitAndRun(40, () -> {
            try {
                context.assertTrue(station.progress() >= 20 && station.progress() <= 60, "Real server ticker did not process at one-second intervals");
                context.assertEquals(1, station.getStack(3).getCount(), "Real ticker spent trophy before completion");
            } catch (RuntimeException | Error failure) {
                world.setTimeOfDay(previousTime); previousWeather.restore(context); throw failure;
            }
        });
        context.waitAndRun(220, () -> {
            try {
                context.assertTrue(station.getStack(7).isOf(ConvergenceMod.ASTRAL_LENS), "Actual block-entity server ticker never completed infusion");
                context.assertTrue(station.getStack(3).isEmpty(), "Actual ticker did not consume Concordance once");
            } finally { world.setTimeOfDay(previousTime); previousWeather.restore(context); }
            context.complete();
        });
    }

    private static AstralInfusionBlockEntity station(TestContext context) {
        context.setBlockState(RELATIVE, ConvergenceMod.ASTRAL_INFUSER);
        return (AstralInfusionBlockEntity) context.getWorld().getBlockEntity(context.getAbsolutePos(RELATIVE));
    }
    private static void fill(AstralInfusionBlockEntity station, InfusionCatalog.Infusion recipe, int batches) {
        for (int slot = 0; slot < InfusionCatalog.INPUTS; slot++) {
            var ingredient = recipe.ingredients().get(slot);
            station.setStack(slot, ingredient == null ? ItemStack.EMPTY : new ItemStack(Registries.ITEM.get(Identifier.of(ingredient.item())), ingredient.count() * batches));
        }
    }
    private static void steps(AstralInfusionBlockEntity station, int count) { for (int i = 0; i < count; i++) station.processStep(); }
    private static int[] counts(AstralInfusionBlockEntity station) { int[] counts = new int[9]; for (int i = 0; i < 9; i++) counts[i] = station.getStack(i).getCount(); return counts; }
    private static void clearSky(TestContext context, AstralInfusionBlockEntity station) {
        // Vanilla GameTest seals templates with an invisible barrier ceiling; remove the fixture
        // column instead of weakening the real station's roof/sky protections.
        var world = context.getWorld();
        for (int y = station.getPos().getY() + 1; y < world.getTopY(); y++)
            world.setBlockState(new BlockPos(station.getPos().getX(), y, station.getPos().getZ()), Blocks.AIR.getDefaultState(), Block.NOTIFY_LISTENERS);
    }
    private record Weather(boolean raining, boolean thundering, float rainGradient, float thunderGradient) {
        static Weather capture(TestContext context) {
            var world = context.getWorld();
            float rain = world.getRainGradient(1);
            boolean thunder = world.getLevelProperties().isThundering();
            return new Weather(world.getLevelProperties().isRaining(), thunder, rain,
                    rain > 0 ? world.getThunderGradient(1) / rain : (thunder ? 1 : 0));
        }
        void restore(TestContext context) {
            var world = context.getWorld(); world.setWeather(0, 0, raining, thundering);
            world.setRainGradient(rainGradient); world.setThunderGradient(thunderGradient);
        }
    }
    private static void weather(TestContext context, boolean raining, boolean thundering) {
        var world = context.getWorld(); world.setWeather(0, raining ? 1000 : 0, raining, thundering);
        // Weather flags interpolate gradually in the engine. Synchronous fixture checks need
        // explicit real gradients rather than assuming setWeather immediately changes isRaining.
        world.setRainGradient(raining ? 1 : 0); world.setThunderGradient(thundering ? 1 : 0);
    }
    private static void withNight(TestContext context, Runnable check) {
        var world = context.getWorld(); long previousTime = world.getTimeOfDay();
        Weather previousWeather = Weather.capture(context);
        weather(context, false, false); world.setTimeOfDay(18000);
        var station = station(context); clearSky(context, station);
        try { check.run(); }
        finally { world.setTimeOfDay(previousTime); previousWeather.restore(context); }
    }
}
