package io.github.afuerta.starfall;

import com.mojang.authlib.GameProfile;
import io.github.afuerta.starfall.event.StarChart;
import io.github.afuerta.starfall.event.StarImpact;
import io.github.afuerta.starfall.event.StarlitArmor;
import io.github.afuerta.starfall.item.StarCompassItem;
import io.github.afuerta.starfall.registry.ModArmorMaterials;
import io.github.afuerta.starfall.registry.ModBlocks;
import io.github.afuerta.starfall.registry.ModItems;
import io.netty.channel.embedded.EmbeddedChannel;
import net.fabricmc.fabric.api.gametest.v1.FabricGameTest;
import net.minecraft.block.Block;
import net.minecraft.block.Blocks;
import net.minecraft.component.DataComponentTypes;
import net.minecraft.enchantment.Enchantments;
import net.minecraft.entity.EquipmentSlot;
import net.minecraft.entity.attribute.EntityAttributes;
import net.minecraft.item.ArmorItem;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.nbt.NbtCompound;
import net.minecraft.network.ClientConnection;
import net.minecraft.network.NetworkSide;
import net.minecraft.registry.RegistryKeys;
import net.minecraft.registry.tag.ItemTags;
import net.minecraft.server.network.ConnectedClientData;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.test.GameTest;
import net.minecraft.test.TestContext;
import net.minecraft.util.Hand;
import net.minecraft.util.math.BlockPos;
import net.minecraft.world.GameMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** New exploration persistence and equipment behavior, exercised in a dedicated Minecraft server. */
public final class StarfallExpeditionGameTests implements FabricGameTest {
    private static final Map<UUID, EmbeddedChannel> CONNECTIONS = new HashMap<>();

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void chartRoundTripKeepsNewest64UniqueImpacts(TestContext context) {
        var state = new StarChart();
        for (int index = 0; index < 100; index++) state.record(new BlockPos(-1000 + index, 65, -500));
        context.assertEquals(64, state.positions().size(), "Star chart grew beyond its world cap");
        context.assertEquals(new BlockPos(-964, 65, -500), state.positions().getFirst(), "Oldest impacts were not evicted");
        state.record(state.positions().getFirst());
        context.assertEquals(64, state.positions().size(), "Repeated impact duplicated a position");
        var nbt = state.writeNbt(new NbtCompound(), context.getWorld().getRegistryManager());
        context.assertEquals(64, nbt.getLongArray("stars").length, "Persistent state used unbounded record data");
        var restored = StarChart.read(nbt, context.getWorld().getRegistryManager());
        context.assertEquals(state.positions(), restored.positions(), "Restart NBT lost impact order or negative coordinates");
        long[] oversized = new long[200];
        for (int index = 0; index < oversized.length; index++) oversized[index] = new BlockPos(index, 70, 0).asLong();
        nbt.putLongArray("stars", oversized);
        var bounded = StarChart.read(nbt, context.getWorld().getRegistryManager());
        context.assertEquals(64, bounded.positions().size(), "Oversized save data bypassed the cap");
        context.assertEquals(new BlockPos(136, 70, 0), bounded.positions().getFirst(), "Oversized save retained wrong entries");
        context.complete();
    }

    @GameTest(templateName = "starfall_test:arena")
    public void chartPrunesLoadedStaleTargetsAndRetainsUnloadedMemories(TestContext context) {
        var world = context.getWorld();
        var state = new StarChart();
        var stale = context.getAbsolutePos(new BlockPos(3, 7, 3));
        var valid = context.getAbsolutePos(new BlockPos(9, 7, 9));
        var far = new BlockPos(1_000_000, 70, 1_000_000);
        world.setBlockState(stale, Blocks.STONE.getDefaultState());
        world.setBlockState(valid, ModBlocks.FALLEN_STAR.getDefaultState());
        context.assertTrue(state.nearest(world, valid) == null, "Unrecorded legacy or player-placed star was added by a terrain scan");
        state.record(stale); state.record(far); state.record(valid);
        context.assertFalse(world.isChunkLoaded(far), "Far fixture must remain unloaded");
        context.assertEquals(valid, state.nearest(world, stale), "Loaded stale target blocked reselection");
        context.assertEquals(2, state.positions().size(), "Stale pruning removed an unloaded memory");
        world.setBlockState(valid, Blocks.AIR.getDefaultState());
        context.assertEquals(far, state.nearest(world, stale), "Unloaded saved target was erased");
        context.assertFalse(world.isChunkLoaded(far), "Compass lookup force-loaded a far target");
        context.assertEquals(1, state.positions().size(), "Missing loaded star was retained");
        state.record(new BlockPos(30_000_000, 70, 0));
        state.record(new BlockPos(0, world.getTopY() + 20, 0));
        context.assertEquals(far, state.nearest(world, stale), "Invalid border/build-limit record was selected");
        context.assertEquals(1, state.positions().size(), "Invalid saved records were not removed");
        context.complete();
    }

    @GameTest(templateName = "starfall_test:arena")
    public void safeImpactRecordsAndMinedStarsRetargetVanillaCompass(TestContext context) {
        var world = context.getWorld();
        var player = player(context);
        var chart = StarChart.get(world);
        var ground = naturalGround(context);
        var secondary = context.getAbsolutePos(new BlockPos(12, 8, 12));
        BlockPos landed = null;
        try {
            int before = chart.positions().size();
            world.setBlockState(ground.up(), Blocks.CHEST.getDefaultState());
            context.assertTrue(StarImpact.impact(world, ground, 0) == null, "Unsafe impact was accepted");
            context.assertEquals(before, chart.positions().size(), "Rejected impact added a compass target");
            world.setBlockState(ground.up(), Blocks.AIR.getDefaultState());
            landed = StarImpact.impact(world, ground, 0);
            context.assertTrue(landed != null && chart.positions().contains(landed), "Successful impact was not recorded");
            world.setBlockState(secondary, ModBlocks.FALLEN_STAR.getDefaultState());
            chart.record(secondary);
            player.refreshPositionAndAngles(landed.getX() + .5, landed.getY() + 2, landed.getZ() + .5, 0, 0);
            var stack = new ItemStack(ModItems.STAR_COMPASS);
            player.setStackInHand(Hand.MAIN_HAND, stack);
            ModItems.STAR_COMPASS.use(world, player, Hand.MAIN_HAND);
            var tracker = stack.get(DataComponentTypes.LODESTONE_TRACKER);
            context.assertTrue(tracker != null && !tracker.tracked(), "Star compass enabled lodestone-only target checks");
            context.assertEquals(landed, tracker.target().orElseThrow().pos(), "Compass did not bind the nearest impact");
            context.assertEquals(world.getRegistryKey(), tracker.target().orElseThrow().dimension(), "Compass lost target dimension");
            context.assertEquals("item.starfall.star_compass", ModItems.STAR_COMPASS.getTranslationKey(stack), "Bound compass lost its translated item name");
            ModItems.STAR_COMPASS.inventoryTick(stack, world, player, 0, true);
            context.assertEquals(landed, stack.get(DataComponentTypes.LODESTONE_TRACKER).target().orElseThrow().pos(),
                    "A real compass inventory tick cleared its non-lodestone Fallen Star target");
            var saved = stack.encode(world.getRegistryManager());
            var restored = ItemStack.fromNbt(world.getRegistryManager(), saved).orElseThrow();
            context.assertEquals(tracker, restored.get(DataComponentTypes.LODESTONE_TRACKER), "Saved compass lost vanilla target component");
            context.assertTrue(world.breakBlock(landed, false, player), "Real block break did not mine star");
            context.assertFalse(chart.positions().contains(landed), "Mined star remained in persistent state");
            player.age = 20;
            ModItems.STAR_COMPASS.inventoryTick(stack, world, player, 0, true);
            context.assertEquals(secondary, stack.get(DataComponentTypes.LODESTONE_TRACKER).target().orElseThrow().pos(),
                    "Held compass inventory tick did not retarget after mining");
            world.setBlockState(secondary, Blocks.AIR.getDefaultState());
            context.assertFalse(chart.positions().contains(secondary), "Replaced star remained recorded");
        } finally {
            if (landed != null) { world.setBlockState(landed, Blocks.AIR.getDefaultState()); chart.remove(landed); }
            world.setBlockState(secondary, Blocks.AIR.getDefaultState()); chart.remove(secondary);
            removePlayer(context, player);
        }
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void armorLoadsRepairEnchantmentsAndRecipesOnDedicatedServer(TestContext context) {
        var world = context.getWorld();
        var protection = world.getRegistryManager().get(RegistryKeys.ENCHANTMENT).entryOf(Enchantments.PROTECTION);
        int armor = 0;
        for (var item : List.of(ModItems.STARSTEEL_HELMET, ModItems.STARSTEEL_CHESTPLATE,
                ModItems.STARSTEEL_LEGGINGS, ModItems.STARSTEEL_BOOTS)) {
            var stack = new ItemStack(item);
            armor += item.getProtection();
            context.assertTrue(item.getMaterial().equals(ModArmorMaterials.STARSTEEL), "Armor used an unregistered material");
            context.assertTrue(stack.isIn(ItemTags.ARMOR_ENCHANTABLE), "Armor is missing its vanilla enchantment tag");
            context.assertTrue(protection.value().isSupportedItem(stack), "Protection enchantment rejected Starsteel armor");
            context.assertTrue(item.canRepair(stack, new ItemStack(ModItems.STARSTEEL_INGOT)), "Starsteel ingot cannot repair armor");
            context.assertFalse(item.canRepair(stack, new ItemStack(Items.IRON_INGOT)), "Armor accepted the wrong repair material");
            context.assertEquals(item.getType().getMaxDamage(30), stack.getMaxDamage(), "Armor durability was incorrect");
            context.assertEquals(18, item.getEnchantability(), "Armor enchantability was lost");
        }
        context.assertEquals(19, armor, "Starsteel protection budget changed");
        for (String name : List.of("star_compass", "starsteel_helmet", "starsteel_chestplate", "starsteel_leggings", "starsteel_boots")) {
            var recipe = world.getRecipeManager().get(Starfall.id(name));
            context.assertTrue(recipe.isPresent(), "Missing survival recipe " + name);
            context.assertEquals(1, recipe.orElseThrow().value().getResult(world.getRegistryManager()).getCount(), "Recipe duplicates gear");
            context.assertTrue(world.getServer().getAdvancementLoader().get(Starfall.id("recipes/equipment/" + name)) != null,
                    "Missing recipe discovery " + name);
        }
        context.complete();
    }

    @GameTest(templateName = "starfall_test:arena", batchId = "starfall_armor_sky")
    public void clearNightSetBonusIsBoundedAndClearsOnEquipmentWeatherAndSkyChanges(TestContext context) {
        var world = context.getWorld();
        long previousTime = world.getTimeOfDay();
        boolean previousRain = world.isRaining(), previousThunder = world.isThundering();
        var player = player(context);
        try {
            clearFixtureSky(context);
            equipSet(player);
            world.setTimeOfDay(18000); world.setWeather(0, 0, false, false);
            world.setRainGradient(0); world.setThunderGradient(0);
            double baseSpeed = player.getAttributeValue(EntityAttributes.GENERIC_MOVEMENT_SPEED);
            StarlitArmor.update(player);
            context.assertTrue(Math.abs(player.getAttributeValue(EntityAttributes.GENERIC_MOVEMENT_SPEED) - baseSpeed * 1.1) < .00001,
                    "Full-set clear-night speed bonus was missing");
            context.assertTrue(Math.abs(player.getAttributeValue(EntityAttributes.GENERIC_KNOCKBACK_RESISTANCE) - .10) < .00001,
                    "Full-set knockback bonus was missing");
            for (int tick = 0; tick < 200; tick++) StarlitArmor.update(player);
            context.assertEquals(1L, player.getAttributeInstance(EntityAttributes.GENERIC_MOVEMENT_SPEED).getModifiers().stream()
                    .filter(modifier -> modifier.id().equals(StarlitArmor.SPEED_ID)).count(), "Repeated ticks stacked set bonuses");
            context.assertFalse(player.hasStatusEffect(net.minecraft.entity.effect.StatusEffects.FIRE_RESISTANCE), "Armor bypassed Ember hazards");
            player.equipStack(EquipmentSlot.FEET, ItemStack.EMPTY); StarlitArmor.update(player); assertInactive(context, player, baseSpeed);
            player.equipStack(EquipmentSlot.FEET, new ItemStack(ModItems.STARSTEEL_BOOTS)); StarlitArmor.update(player);
            context.assertTrue(player.getAttributeInstance(EntityAttributes.GENERIC_MOVEMENT_SPEED).hasModifier(StarlitArmor.SPEED_ID), "Re-equipped set did not reactivate");
            world.setTimeOfDay(6000); StarlitArmor.update(player); assertInactive(context, player, baseSpeed);
            world.setTimeOfDay(18000); world.setRainGradient(1); world.setWeather(0, 1000, true, false);
            StarlitArmor.update(player); assertInactive(context, player, baseSpeed);
            world.setWeather(0, 0, false, false); world.setRainGradient(0);
            world.setRainGradient(1); world.setThunderGradient(1); world.setWeather(0, 1000, true, true);
            StarlitArmor.update(player); assertInactive(context, player, baseSpeed);
            world.setWeather(0, 0, false, false); world.setRainGradient(0); world.setThunderGradient(0);
            var roof = player.getBlockPos().up(2); world.setBlockState(roof, Blocks.STONE.getDefaultState());
            StarlitArmor.update(player); assertInactive(context, player, baseSpeed);
            world.setBlockState(roof, Blocks.AIR.getDefaultState()); StarlitArmor.update(player);
            context.assertTrue(player.getAttributeInstance(EntityAttributes.GENERIC_MOVEMENT_SPEED).hasModifier(StarlitArmor.SPEED_ID), "Open sky did not restore bonus");
            player.changeGameMode(GameMode.SPECTATOR); StarlitArmor.update(player); assertInactive(context, player, baseSpeed);
            player.changeGameMode(GameMode.SURVIVAL); StarlitArmor.update(player);
            player.setHealth(0); StarlitArmor.update(player); assertInactive(context, player, baseSpeed);
        } finally {
            removePlayer(context, player);
            world.setTimeOfDay(previousTime); world.setWeather(0, 0, previousRain, previousThunder);
            world.setRainGradient(previousRain ? 1 : 0); world.setThunderGradient(previousThunder ? 1 : 0);
        }
        context.complete();
    }
    @GameTest(templateName = EMPTY_STRUCTURE)
    public void compassSwitchesDimensionAndClearsEmptyChartWithoutLoadingTargets(TestContext context) {
        var world = context.getWorld();
        var otherWorld = world.getServer().getWorld(net.minecraft.world.World.NETHER);
        context.assertTrue(otherWorld != null, "Dedicated server did not load Nether dimension registry");
        var player = player(context);
        var stack = new ItemStack(ModItems.STAR_COMPASS);
        var target = new BlockPos(1_500_000, 70, -1_500_000);
        var chart = StarChart.get(otherWorld);
        var saved = chart.positions();
        try {
            for (var pos : saved) chart.remove(pos);
            chart.record(target);
            context.assertFalse(otherWorld.isChunkLoaded(target), "Dimension target fixture must start unloaded");
            StarCompassItem.updateTarget(stack, otherWorld, player);
            var tracker = stack.get(DataComponentTypes.LODESTONE_TRACKER);
            context.assertEquals(net.minecraft.world.World.NETHER, tracker.target().orElseThrow().dimension(), "Compass retained previous target dimension");
            context.assertEquals(target, tracker.target().orElseThrow().pos(), "Unloaded dimensional memory was not targeted");
            context.assertFalse(otherWorld.isChunkLoaded(target), "Dimension reselection force-loaded target terrain");
            chart.remove(target); StarCompassItem.updateTarget(stack, otherWorld, player);
            context.assertTrue(stack.get(DataComponentTypes.LODESTONE_TRACKER).target().isEmpty(), "Empty dimension retained an old target");
            ModItems.STAR_COMPASS.inventoryTick(stack, otherWorld, player, 0, true);
            context.assertTrue(stack.get(DataComponentTypes.LODESTONE_TRACKER).target().isEmpty(), "Empty compass fell back to world spawn");
        } finally {
            chart.remove(target); for (var pos : saved) chart.record(pos);
            removePlayer(context, player);
        }
        context.complete();
    }
    private static void assertInactive(TestContext context, ServerPlayerEntity player, double baseSpeed) {
        context.assertFalse(player.getAttributeInstance(EntityAttributes.GENERIC_MOVEMENT_SPEED).hasModifier(StarlitArmor.SPEED_ID), "Inactive armor retained speed bonus");
        context.assertFalse(player.getAttributeInstance(EntityAttributes.GENERIC_KNOCKBACK_RESISTANCE).hasModifier(StarlitArmor.STEADY_ID), "Inactive armor retained knockback bonus");
        context.assertTrue(Math.abs(player.getAttributeValue(EntityAttributes.GENERIC_MOVEMENT_SPEED) - baseSpeed) < .00001, "Inactive armor changed ordinary speed");
    }
    private static void equipSet(ServerPlayerEntity player) {
        player.equipStack(EquipmentSlot.HEAD, new ItemStack(ModItems.STARSTEEL_HELMET));
        player.equipStack(EquipmentSlot.CHEST, new ItemStack(ModItems.STARSTEEL_CHESTPLATE));
        player.equipStack(EquipmentSlot.LEGS, new ItemStack(ModItems.STARSTEEL_LEGGINGS));
        player.equipStack(EquipmentSlot.FEET, new ItemStack(ModItems.STARSTEEL_BOOTS));
    }
    private static BlockPos naturalGround(TestContext context) {
        clearFixtureSky(context);
        for (int x = 1; x <= 13; x++) for (int z = 1; z <= 13; z++) {
            for (int y = 1; y <= 4; y++) context.setBlockState(x, y, z, Blocks.DIRT);
            context.setBlockState(x, 5, z, Blocks.GRASS_BLOCK);
        }
        return context.getAbsolutePos(new BlockPos(7, 5, 7));
    }
    private static void clearFixtureSky(TestContext context) {
        for (int x = 1; x <= 13; x++) for (int z = 1; z <= 13; z++) for (int y = 6; y <= 16; y++) {
            context.getWorld().setBlockState(context.getAbsolutePos(new BlockPos(x, y, z)), Blocks.AIR.getDefaultState(), Block.NOTIFY_ALL);
        }
    }
    private static ServerPlayerEntity player(TestContext context) {
        var id = UUID.randomUUID();
        var profile = new GameProfile(id, "exp-" + id.toString().substring(0, 8));
        var data = ConnectedClientData.createDefault(profile, false);
        var world = context.getWorld();
        var player = new ServerPlayerEntity(world.getServer(), world, profile, data.syncedOptions());
        var connection = new ClientConnection(NetworkSide.SERVERBOUND);
        var channel = new EmbeddedChannel(connection); CONNECTIONS.put(id, channel);
        world.getServer().getPlayerManager().onPlayerConnect(connection, player, data);
        player.changeGameMode(GameMode.SURVIVAL);
        var pos = context.getAbsolutePos(new BlockPos(7, 9, 7));
        player.refreshPositionAndAngles(pos.getX() + .5, pos.getY(), pos.getZ() + .5, 0, 0);
        return player;
    }
    private static void removePlayer(TestContext context, ServerPlayerEntity player) {
        context.getWorld().getServer().getPlayerManager().remove(player); player.discard();
        var channel = CONNECTIONS.remove(player.getUuid()); if (channel != null) channel.finishAndReleaseAll();
    }
}
