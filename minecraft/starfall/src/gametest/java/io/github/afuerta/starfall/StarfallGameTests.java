package io.github.afuerta.starfall;

import com.mojang.authlib.GameProfile;
import io.github.afuerta.starfall.event.FallingStarManager;
import io.github.afuerta.starfall.event.ProtectedTerrain;
import io.github.afuerta.starfall.event.StarImpact;
import io.github.afuerta.starfall.item.StardustItem;
import io.github.afuerta.starfall.item.WishingStarItem;
import io.github.afuerta.starfall.registry.ModBlocks;
import io.github.afuerta.starfall.registry.ModItems;
import io.github.afuerta.starfall.util.StarfallUtil;
import io.netty.channel.embedded.EmbeddedChannel;
import net.fabricmc.fabric.api.gametest.v1.FabricGameTest;
import net.minecraft.block.Block;
import net.minecraft.block.Blocks;
import net.minecraft.block.CropBlock;
import net.minecraft.block.FarmlandBlock;
import net.minecraft.enchantment.Enchantments;
import net.minecraft.entity.EntityType;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.nbt.NbtCompound;
import net.minecraft.network.ClientConnection;
import net.minecraft.network.NetworkSide;
import net.minecraft.registry.Registries;
import net.minecraft.registry.RegistryKeys;
import net.minecraft.server.network.ConnectedClientData;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.test.GameTest;
import net.minecraft.test.TestContext;
import net.minecraft.util.Hand;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.random.Random;
import net.minecraft.world.GameMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Real Minecraft runtime tests. These fixtures and test entrypoints are excluded from release jars. */
public final class StarfallGameTests implements FabricGameTest {
    private static final Map<UUID, EmbeddedChannel> CONNECTIONS = new HashMap<>();
    @GameTest(templateName = EMPTY_STRUCTURE)
    public void originalAndExpandedRegistriesAndRecipesLoad(TestContext context) {
        context.assertEquals(17, ModBlocks.ALL.size(), "Expected six original and eleven expanded blocks");
        context.assertEquals(26, ModItems.ALL.size(), "Expected original materials/tools plus every block item");
        for (String name : ModBlocks.ALL.keySet()) {
            context.assertTrue(Registries.BLOCK.containsId(Starfall.id(name)), "Missing block " + name);
            context.assertTrue(Registries.ITEM.containsId(Starfall.id(name)), "Missing block item " + name);
        }
        var recipes = context.getWorld().getRecipeManager();
        context.assertFalse(recipes.isErrored(), "Minecraft reported recipe decoding errors");
        for (String name : List.of("stardust", "wishing_star", "starsteel_ingot", "starsteel_block", "star_lantern",
                "starsteel_sword", "starsteel_pickaxe", "starsteel_axe", "starsteel_shovel", "starsteel_hoe",
                "starstone_stairs", "starstone_slab", "starstone_wall", "starstone_brick_stairs", "starstone_brick_slab",
                "starstone_brick_wall", "polished_starstone", "polished_starstone_stairs", "polished_starstone_slab",
                "polished_starstone_wall", "chiseled_starstone")) {
            var recipe = recipes.get(Starfall.id(name));
            context.assertTrue(recipe.isPresent(), "Recipe did not decode: " + name);
            context.assertTrue(recipe.orElseThrow().value().getResult(context.getWorld().getRegistryManager())
                    .isOf(Registries.ITEM.get(Starfall.id(name))), "Wrong recipe output: " + name);
        }
        context.complete();
    }

    @GameTest(templateName = "starfall_test:arena")
    public void naturalCraterPlacesStarOreAndLining(TestContext context) {
        BlockPos ground = naturalGround(context);
        context.assertTrue(StarImpact.canImpact(context.getWorld(), ground, 2), "Natural dry terrain rejected");
        BlockPos star = StarImpact.impact(context.getWorld(), ground, 2);
        context.assertTrue(star != null, "Safe impact was not placed");
        context.assertTrue(context.getWorld().getBlockState(star).isOf(ModBlocks.FALLEN_STAR), "Missing fallen star");
        context.assertTrue(context.getWorld().getBlockState(star.down()).isOf(ModBlocks.STARSTONE)
                || context.getWorld().getBlockState(star.down()).isOf(ModBlocks.STARSTONE_ORE), "Missing crater floor");
        context.assertTrue(context.getWorld().getBlockState(ground.add(1, 0, 0)).isAir(), "Crater was not carved");
        context.complete();
    }

    @GameTest(templateName = "starfall_test:arena")
    public void constructedBlocksAndBlockEntitiesAbortWholeImpact(TestContext context) {
        BlockPos ground = naturalGround(context);
        BlockPos obstruction = ground.add(1, 1, 0);
        for (Block protectedBlock : List.of(Blocks.OAK_PLANKS, Blocks.CHEST, Blocks.BEDROCK, Blocks.WATER)) {
            context.getWorld().setBlockState(obstruction, protectedBlock.getDefaultState());
            context.assertTrue(StarImpact.impact(context.getWorld(), ground, 2) == null, "Unsafe impact was accepted: " + protectedBlock);
            context.assertTrue(context.getWorld().getBlockState(ground).isOf(Blocks.GRASS_BLOCK), "Rejected impact partially carved terrain");
            context.assertTrue(context.getWorld().getBlockState(obstruction).isOf(protectedBlock), "Protected block was altered");
        }
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void unloadedColumnsAndWorldBorderAreRejected(TestContext context) {
        BlockPos unloaded = new BlockPos(1_000_000, 64, 1_000_000);
        context.assertFalse(context.getWorld().isChunkLoaded(unloaded), "Fixture needs an unloaded far column");
        context.assertFalse(StarImpact.canReplace(context.getWorld(), unloaded), "Unloaded column may be modified");
        context.assertTrue(FallingStarManager.findGround(context.getWorld(), unloaded.getX(), unloaded.getZ()) == null,
                "Ground query returned unloaded terrain");
        BlockPos outsideBorder = new BlockPos(30_000_000, 64, 0);
        context.assertFalse(StarImpact.canReplace(context.getWorld(), outsideBorder), "Outside-border position may be changed");
        context.complete();
    }

    @GameTest(templateName = "starfall_test:arena")
    public void playerNaturalPlacementsProtectColumnsAndSerializeCompactly(TestContext context) {
        BlockPos ground = naturalGround(context);
        ProtectedTerrain state = ProtectedTerrain.get(context.getWorld());
        state.protect(ground.up(100));
        context.assertFalse(StarImpact.canImpact(context.getWorld(), ground, 2), "A protected natural-material column was carved");
        var independent = new ProtectedTerrain();
        var negative = new BlockPos(-33, 80, -17);
        independent.protect(negative);
        independent.protect(negative.down(30));
        var nbt = independent.writeNbt(new NbtCompound(), context.getWorld().getRegistryManager());
        context.assertEquals(1, nbt.getList("chunks", 10).size(), "Repeated heights grew placement data");
        context.assertEquals(4, nbt.getList("chunks", 10).getCompound(0).getLongArray("columns").length,
                "Chunk should use exactly 256 protection bits");
        var restored = ProtectedTerrain.read(nbt, context.getWorld().getRegistryManager());
        context.assertTrue(restored.isProtected(negative.down(100)), "Negative-coordinate placement column did not survive NBT");
        context.assertFalse(restored.isProtected(negative.east()), "Serialization protected unrelated column");
        context.complete();
    }

    @GameTest(templateName = "starfall_test:arena")
    public void twoGrowthPulsesConsumeOnlyOneDust(TestContext context) {
        var pos = context.getAbsolutePos(new BlockPos(5, 3, 5));
        context.getWorld().setBlockState(pos.down(), Blocks.FARMLAND.getDefaultState().with(FarmlandBlock.MOISTURE, 7));
        context.getWorld().setBlockState(pos, Blocks.WHEAT.getDefaultState().with(CropBlock.AGE, 0));
        var stack = new ItemStack(ModItems.STARDUST, 2);
        context.assertTrue(StardustItem.applyStardust(stack, context.getWorld(), pos, false), "Wheat did not grow");
        context.assertEquals(1, stack.getCount(), "Growth consumed other than one dust");
        context.assertTrue(context.getWorld().getBlockState(pos).get(CropBlock.AGE) >= 4, "Two wheat growth pulses were not applied");
        context.getWorld().setBlockState(pos, Blocks.STONE.getDefaultState());
        context.assertFalse(StardustItem.applyStardust(stack, context.getWorld(), pos, false), "Stone incorrectly grew");
        context.assertEquals(1, stack.getCount(), "Failed growth consumed dust");
        context.getWorld().setBlockState(pos, Blocks.WHEAT.getDefaultState());
        context.assertTrue(StardustItem.applyStardust(stack, context.getWorld(), pos, true), "Creative growth failed");
        context.assertEquals(1, stack.getCount(), "Creative use consumed dust");
        context.complete();
    }

    @GameTest(templateName = "starfall_test:arena")
    public void wishUseGrantsHelpfulEffectConsumesAndHonorsCooldown(TestContext context) {
        var player = player(context);
        try {
            player.setStackInHand(Hand.MAIN_HAND, new ItemStack(ModItems.WISHING_STAR, 2));
            var item = (WishingStarItem) ModItems.WISHING_STAR;
            item.use(context.getWorld(), player, Hand.MAIN_HAND);
            context.assertEquals(1, player.getMainHandStack().getCount(), "Wish did not consume one item");
            context.assertEquals(1, player.getStatusEffects().size(), "Wish did not grant exactly one effect");
            var effect = player.getStatusEffects().iterator().next();
            context.assertTrue(WishingStarItem.WISHES.contains(effect.getEffectType()), "Wish granted an unlisted effect");
            context.assertEquals(WishingStarItem.WISH_DURATION_TICKS, effect.getDuration(), "Wish duration changed");
            context.assertTrue(effect.getAmplifier() == 0 || effect.getAmplifier() == 1, "Wish level outside I/II");
            item.use(context.getWorld(), player, Hand.MAIN_HAND);
            context.assertEquals(1, player.getMainHandStack().getCount(), "Cooldown allowed a second wish");
        } finally { removePlayer(context, player); }
        context.complete();
    }

    @GameTest(templateName = "starfall_test:arena", batchId = "starfall_sky")
    public void clearNightBonusesApplyToMiningAndMeleeOnly(TestContext context) {
        var world = context.getWorld();
        long previousTime = world.getTimeOfDay();
        boolean previousRain = world.isRaining(), previousThunder = world.isThundering();
        var player = player(context);
        try {
            clearFixtureSky(context);
            var pos = context.getAbsolutePos(new BlockPos(6, 9, 6));
            player.refreshPositionAndAngles(pos.getX() + .5, pos.getY(), pos.getZ() + .5, 0, 0);
            player.setStackInHand(Hand.MAIN_HAND, new ItemStack(ModItems.STARSTEEL_PICKAXE));
            world.setWeather(0, 0, false, false);
            world.setRainGradient(0); world.setThunderGradient(0);
            world.setTimeOfDay(6000);
            float daylight = player.getBlockBreakingSpeed(Blocks.STONE.getDefaultState());
            var dayPlayer = player(context);
            float daylightDamage;
            try {
                dayPlayer.setStackInHand(Hand.MAIN_HAND, new ItemStack(ModItems.STARSTEEL_PICKAXE));
                var dayTarget = context.spawnMob(EntityType.PIG, new BlockPos(3, 2, 3));
                dayTarget.setAiDisabled(true);
                dayPlayer.attack(dayTarget);
                daylightDamage = 10 - dayTarget.getHealth();
                context.assertTrue(daylightDamage > 0, "Daylight control attack dealt no damage");
            } finally { removePlayer(context, dayPlayer); }
            world.setTimeOfDay(18000);
            context.assertTrue(StarfallUtil.isStarlit(player), "Fixture must stand under clear night sky: pos="
                    + player.getBlockPos() + " top=" + world.getTopY(net.minecraft.world.Heightmap.Type.MOTION_BLOCKING,
                    player.getBlockX(), player.getBlockZ()) + " sky=" + world.isSkyVisible(player.getBlockPos())
                    + " rain=" + world.isRaining() + " night=" + StarfallUtil.isNight(world));
            float night = player.getBlockBreakingSpeed(Blocks.STONE.getDefaultState());
            context.assertTrue(Math.abs(night - daylight * 1.5F) < .001, "Night mining multiplier missing");
            var target = context.spawnMob(EntityType.PIG, new BlockPos(3, 2, 3));
            target.setAiDisabled(true);
            player.attack(target);
            context.assertTrue(Math.abs((10 - target.getHealth()) - daylightDamage * 1.25F) < .001,
                    "Night vanilla melee multiplier missing");
            var attributed = context.spawnMob(EntityType.PIG, new BlockPos(8, 2, 3));
            attributed.setAiDisabled(true);
            attributed.damage(world.getDamageSources().playerAttack(player), 4);
            context.assertTrue(Math.abs(attributed.getHealth() - 6) < .001,
                    "Arbitrary player-attributed mod damage received the melee bonus");
            var ordinary = context.spawnMob(EntityType.PIG, new BlockPos(10, 2, 10));
            ordinary.setAiDisabled(true);
            ordinary.damage(world.getDamageSources().generic(), 4);
            context.assertTrue(Math.abs(ordinary.getHealth() - 6) < .001, "Unrelated damage was amplified");
            world.setBlockState(player.getBlockPos().up(2), Blocks.STONE.getDefaultState());
            context.assertFalse(StarfallUtil.isStarlit(player), "Roof did not disable Starlit");
            context.assertTrue(Math.abs(player.getBlockBreakingSpeed(Blocks.STONE.getDefaultState()) - daylight) < .001,
                    "Mining bonus leaked under a roof");
        } finally {
            removePlayer(context, player);
            world.setTimeOfDay(previousTime);
            world.setWeather(0, 0, previousRain, previousThunder);
            world.setRainGradient(previousRain ? 1 : 0); world.setThunderGradient(previousThunder ? 1 : 0);
        }
        context.complete();
    }

    @GameTest(templateName = "starfall_test:arena")
    public void fallenStarLootAndSilkTouchResolveInMinecraft(TestContext context) {
        var world = context.getWorld();
        var pos = context.getAbsolutePos(new BlockPos(5, 5, 5));
        var player = player(context);
        try {
            var pickaxe = new ItemStack(Items.DIAMOND_PICKAXE);
            for (int roll = 0; roll < 20; roll++) {
                var loot = Block.getDroppedStacks(ModBlocks.FALLEN_STAR.getDefaultState(), world, pos, null, player, pickaxe);
                int shards = count(loot, ModItems.STAR_SHARD), dust = count(loot, ModItems.STARDUST);
                context.assertTrue(shards >= 2 && shards <= 4, "Fallen star shard range changed");
                context.assertTrue(dust >= 1 && dust <= 3, "Fallen star dust range changed");
                context.assertEquals(0, count(loot, ModBlocks.FALLEN_STAR.asItem()), "Unenchanted mining returned star block");
            }
            pickaxe.addEnchantment(world.getRegistryManager().get(RegistryKeys.ENCHANTMENT).entryOf(Enchantments.SILK_TOUCH), 1);
            var silkLoot = Block.getDroppedStacks(ModBlocks.FALLEN_STAR.getDefaultState(), world, pos, null, player, pickaxe);
            context.assertEquals(1, count(silkLoot, ModBlocks.FALLEN_STAR.asItem()), "Silk Touch did not retain star");
            context.assertEquals(0, count(silkLoot, ModItems.STAR_SHARD), "Silk Touch duplicated shards");
        } finally { removePlayer(context, player); }
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void malformedConfigurationIsBoundedAndNullGroupsRecover(TestContext context) {
        var config = new StarfallConfig();
        config.falling_stars.chance_per_second = 0;
        config.falling_stars.min_distance = 256;
        config.falling_stars.max_distance = -100;
        config.craters.max_radius = 1000;
        config.showers.multiplier = Integer.MAX_VALUE;
        config.showers.max_impacts_per_night = 0;
        config.normalize();
        context.assertEquals(1, config.falling_stars.chance_per_second, "Chance may divide by zero");
        context.assertEquals(256, config.falling_stars.max_distance, "Distance range is reversed");
        context.assertEquals(5, config.craters.max_radius, "Crater radius unbounded");
        context.assertEquals(16, config.showers.multiplier, "Shower multiplier unbounded");
        context.assertEquals(1, config.showers.max_impacts_per_night, "Night budget unbounded");
        config.falling_stars = null; config.craters = null; config.showers = null;
        config.normalize();
        context.assertTrue(config.falling_stars != null && config.craters != null && config.showers != null, "Null config group survived");
        context.complete();
    }

    @GameTest(templateName = "starfall_test:arena", batchId = "starfall_meteor", tickLimit = 100)
    public void meteorRechecksConstructionBeforeLanding(TestContext context) {
        var world = context.getWorld();
        FallingStarManager.clear();
        var ground = naturalGround(context);
        var found = FallingStarManager.findGround(world, ground.getX(), ground.getZ());
        context.assertTrue(StarImpact.canImpact(world, ground, 3), "Meteor fixture footprint is unsafe");
        context.assertEquals(ground, found, "Meteor heightmap found wrong ground: top="
                + world.getTopY(net.minecraft.world.Heightmap.Type.MOTION_BLOCKING_NO_LEAVES, ground.getX(), ground.getZ())
                + " ceil=" + world.getDimension().hasCeiling() + " bottom=" + world.getBottomY()
                + " ground=" + ground + " loaded=" + world.isChunkLoaded(ground));
        context.assertTrue(FallingStarManager.launchStarAt(world, ground.getX(), ground.getZ()),
                "Safe meteor launch failed with quota " + StarfallConfig.INSTANCE.showers.max_impacts_per_night);
        context.assertEquals(1, FallingStarManager.incomingCount(), "Meteor not tracked");
        world.setBlockState(ground.up(), Blocks.CHEST.getDefaultState());
        context.waitAndRun(FallingStarManager.FALL_TICKS + 2, () -> {
            context.assertTrue(world.getBlockState(ground.up()).isOf(Blocks.CHEST), "Construction made during flight was damaged");
            context.assertTrue(world.getBlockState(ground).isOf(Blocks.GRASS_BLOCK), "Aborted meteor carved terrain");
            context.assertEquals(0, FallingStarManager.incomingCount(), "Aborted meteor leaked flight state");
            FallingStarManager.clear();
            context.complete();
        });
    }

    @GameTest(templateName = "starfall_test:arena", batchId = "starfall_shower")
    public void showerRequiresClearNightAndHonorsSharedLaunchBudget(TestContext context) {
        var world = context.getWorld();
        long previousTime = world.getTimeOfDay();
        boolean previousRain = world.isRaining(), previousThunder = world.isThundering();
        var previousConfig = StarfallConfig.INSTANCE;
        try {
            StarfallConfig.INSTANCE = new StarfallConfig();
            StarfallConfig.INSTANCE.showers.max_impacts_per_night = 1;
            FallingStarManager.clear();
            var ground = naturalGround(context);
            world.setWeather(0, 0, false, false);
            world.setRainGradient(0); world.setThunderGradient(0);
            world.setTimeOfDay(6000);
            context.assertFalse(FallingStarManager.startShower(world), "Daylight shower was accepted");
            world.setTimeOfDay(18000);
            world.setWeather(0, 1000, true, false);
            world.setRainGradient(1);
            context.assertFalse(FallingStarManager.startShower(world), "Rainy shower was accepted");
            world.setWeather(0, 0, false, false);
            world.setRainGradient(0); world.setThunderGradient(0);
            context.assertTrue(FallingStarManager.startShower(world), "Clear night shower failed");
            context.assertTrue(FallingStarManager.isShower(world), "Shower state was not active");
            context.assertFalse(FallingStarManager.startShower(world), "Repeated command restarted shower");
            context.assertTrue(FallingStarManager.launchStarAt(world, ground.getX(), ground.getZ()), "First quota launch failed: top="
                    + world.getTopY(net.minecraft.world.Heightmap.Type.MOTION_BLOCKING_NO_LEAVES, ground.getX(), ground.getZ())
                    + " expected=" + ground + " found=" + FallingStarManager.findGround(world, ground.getX(), ground.getZ()));
            context.assertFalse(FallingStarManager.launchStarAt(world, ground.getX() + 3, ground.getZ()), "Night quota allowed second launch");
            context.assertEquals(1, FallingStarManager.incomingCount(), "Quota rejection added another meteor");
            world.setTimeOfDay(6000);
            FallingStarManager.tick(world);
            context.assertFalse(FallingStarManager.isShower(world), "Dawn retained shower bonus");
        } finally {
            FallingStarManager.clear();
            StarfallConfig.INSTANCE = previousConfig;
            world.setTimeOfDay(previousTime);
            world.setWeather(0, 0, previousRain, previousThunder);
            world.setRainGradient(previousRain ? 1 : 0); world.setThunderGradient(previousThunder ? 1 : 0);
        }
        context.complete();
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
        // Vanilla wraps GameTest structures in an invisible barrier ceiling. Barriers have
        // full sky light but count in MOTION_BLOCKING, so explicitly open only our fixture's sky.
        for (int x = 1; x <= 13; x++) for (int z = 1; z <= 13; z++) for (int y = 6; y <= 16; y++) {
            context.getWorld().setBlockState(context.getAbsolutePos(new BlockPos(x, y, z)),
                    Blocks.AIR.getDefaultState(), Block.NOTIFY_ALL);
        }
    }
    private static int count(List<ItemStack> loot, Item item) {
        return loot.stream().filter(stack -> stack.isOf(item)).mapToInt(ItemStack::getCount).sum();
    }
    private static ServerPlayerEntity player(TestContext context) {
        var id = UUID.randomUUID();
        var profile = new GameProfile(id, "star-" + id.toString().substring(0, 8));
        var data = ConnectedClientData.createDefault(profile, false);
        var world = context.getWorld();
        var player = new ServerPlayerEntity(world.getServer(), world, profile, data.syncedOptions());
        var connection = new ClientConnection(NetworkSide.SERVERBOUND);
        var channel = new EmbeddedChannel(connection);
        CONNECTIONS.put(id, channel);
        world.getServer().getPlayerManager().onPlayerConnect(connection, player, data);
        player.changeGameMode(GameMode.SURVIVAL);
        var pos = context.getAbsolutePos(new BlockPos(7, 9, 7));
        player.refreshPositionAndAngles(pos.getX() + .5, pos.getY(), pos.getZ() + .5, 0, 0);
        return player;
    }
    private static void removePlayer(TestContext context, ServerPlayerEntity player) {
        context.getWorld().getServer().getPlayerManager().remove(player);
        player.discard();
        var channel = CONNECTIONS.remove(player.getUuid());
        if (channel != null) channel.finishAndReleaseAll();
    }
}
