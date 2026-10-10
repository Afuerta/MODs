package io.github.afuerta.starfall;

import com.mojang.authlib.GameProfile;
import io.github.afuerta.starfall.event.StarlitArmor;
import io.github.afuerta.starfall.registry.ModArmorMaterials;
import io.github.afuerta.starfall.registry.ModItems;
import io.netty.channel.embedded.EmbeddedChannel;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents;
import net.fabricmc.fabric.api.gametest.v1.FabricGameTest;
import net.minecraft.block.Block;
import net.minecraft.block.Blocks;
import net.minecraft.entity.EquipmentSlot;
import net.minecraft.entity.effect.StatusEffectInstance;
import net.minecraft.entity.effect.StatusEffects;
import net.minecraft.item.ArmorItem;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.network.ClientConnection;
import net.minecraft.network.NetworkSide;
import net.minecraft.recipe.ShapedRecipe;
import net.minecraft.recipe.input.CraftingRecipeInput;
import net.minecraft.registry.Registries;
import net.minecraft.registry.tag.ItemTags;
import net.minecraft.server.network.ConnectedClientData;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.test.GameTest;
import net.minecraft.test.TestContext;
import net.minecraft.util.Hand;
import net.minecraft.util.math.BlockPos;
import net.minecraft.world.GameMode;
import net.minecraft.world.World;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** C03 checks real recipes, equipment, server events and damage rather than just predicates. */
public final class StarsteelArmorGameTests implements FabricGameTest {
    private static final Map<UUID, EmbeddedChannel> CONNECTIONS = new HashMap<>();

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void armorMaterialSlotsRepairAndEnchantmentTagsLoad(TestContext context) {
        var pieces = pieces();
        var slots = List.of(EquipmentSlot.HEAD, EquipmentSlot.CHEST, EquipmentSlot.LEGS, EquipmentSlot.FEET);
        var tags = List.of(ItemTags.HEAD_ARMOR_ENCHANTABLE, ItemTags.CHEST_ARMOR_ENCHANTABLE,
                ItemTags.LEG_ARMOR_ENCHANTABLE, ItemTags.FOOT_ARMOR_ENCHANTABLE);
        int[] protection = {3, 7, 6, 3};
        int[] durability = {297, 432, 405, 351};
        int totalProtection = 0;
        context.assertTrue(Registries.ARMOR_MATERIAL.containsId(Starfall.id("starsteel")), "Starsteel material is not registered");
        for (int i = 0; i < pieces.size(); i++) {
            var stack = new ItemStack(pieces.get(i));
            context.assertTrue(stack.getItem() instanceof ArmorItem, "Starsteel piece is not usable armor");
            var armor = (ArmorItem) stack.getItem();
            context.assertEquals(slots.get(i), armor.getSlotType(), "Armor uses the wrong equipment slot");
            context.assertEquals(ModArmorMaterials.STARSTEEL, armor.getMaterial(), "Piece uses the wrong material");
            context.assertEquals(protection[i], armor.getProtection(), "Incorrect armor protection");
            context.assertEquals(1F, armor.getToughness(), "Incorrect armor toughness");
            context.assertEquals(18, armor.getEnchantability(), "Incorrect enchantability");
            context.assertEquals(durability[i], stack.getMaxDamage(), "Durability multiplier must be 27");
            context.assertEquals(1, stack.getMaxCount(), "Armor must not stack");
            context.assertTrue(armor.canRepair(stack, new ItemStack(ModItems.STARSTEEL_INGOT)), "Starsteel cannot repair its armor");
            context.assertFalse(armor.canRepair(stack, new ItemStack(Items.IRON_INGOT)), "Iron incorrectly repairs Starsteel");
            context.assertTrue(stack.isIn(ItemTags.ARMOR_ENCHANTABLE), "Protection enchantments cannot target this piece");
            context.assertTrue(stack.isIn(ItemTags.DURABILITY_ENCHANTABLE), "Durability enchantments cannot target this piece");
            for (int j = 0; j < tags.size(); j++) {
                context.assertEquals(i == j, stack.isIn(tags.get(j)), "Slot-specific enchantment tag is incorrect");
            }
            totalProtection += armor.getProtection();
        }
        context.assertEquals(19, totalProtection, "The complete set must provide 19 armor points");
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void fourRecipesCraftOnePieceForTwentyFourStarsteelIngots(TestContext context) {
        var names = List.of("starsteel_helmet", "starsteel_chestplate", "starsteel_leggings", "starsteel_boots");
        var patterns = List.of("SSSS S", "S SSSSSSS", "SSSS SS S", "S SS S");
        int[] costs = {5, 8, 7, 4};
        int totalCost = 0;
        for (int i = 0; i < names.size(); i++) {
            var entry = context.getWorld().getRecipeManager().get(Starfall.id(names.get(i)));
            context.assertTrue(entry.isPresent(), "Missing armor recipe " + names.get(i));
            context.assertTrue(entry.orElseThrow().value() instanceof ShapedRecipe, "Armor recipe must be shaped");
            var recipe = (ShapedRecipe) entry.orElseThrow().value();
            var pattern = patterns.get(i);
            var input = recipeInput(pattern, ModItems.STARSTEEL_INGOT);
            context.assertEquals(costs[i], input.getStackCount(),
                    "Fixture has the wrong ingredient cost");
            context.assertTrue(recipe.matches(input, context.getWorld()), "Conventional armor pattern does not craft " + names.get(i));
            context.assertFalse(recipe.matches(recipeInput(pattern, Items.IRON_INGOT), context.getWorld()),
                    "Vanilla iron bypasses Starsteel's crafting cost");
            var crafted = recipe.craft(input, context.getWorld().getRegistryManager());
            context.assertTrue(crafted.isOf(pieces().get(i)), "Recipe crafts the wrong armor piece");
            context.assertEquals(1, crafted.getCount(), "Recipe duplicates armor");
            var incomplete = new ArrayList<>(input.getStacks());
            for (int slot = 0; slot < incomplete.size(); slot++) {
                if (!incomplete.get(slot).isEmpty()) { incomplete.set(slot, ItemStack.EMPTY); break; }
            }
            context.assertFalse(recipe.matches(CraftingRecipeInput.create(input.getWidth(), input.getHeight(), incomplete),
                    context.getWorld()), "Recipe accepts a missing ingot");
            totalCost += costs[i];
        }
        context.assertEquals(24, totalCost, "Full armor set changed from 24 ingots");
        context.complete();
    }

    @GameTest(templateName = "starfall_test:arena")
    public void setRequiresEveryExactPieceInItsEquipmentSlot(TestContext context) {
        var player = player(context);
        try {
            equipSet(player);
            context.assertTrue(StarlitArmor.hasFullSet(player), "Complete equipped set was rejected");
            var slots = List.of(EquipmentSlot.HEAD, EquipmentSlot.CHEST, EquipmentSlot.LEGS, EquipmentSlot.FEET);
            for (var slot : slots) {
                var removed = player.getEquippedStack(slot);
                player.equipStack(slot, ItemStack.EMPTY);
                player.setStackInHand(Hand.MAIN_HAND, removed);
                context.assertFalse(StarlitArmor.hasFullSet(player), "Holding a missing piece counts as wearing it: " + slot);
                player.equipStack(slot, removed);
                player.setStackInHand(Hand.MAIN_HAND, ItemStack.EMPTY);
            }
            player.equipStack(EquipmentSlot.CHEST, new ItemStack(Items.DIAMOND_CHESTPLATE));
            context.assertFalse(StarlitArmor.hasFullSet(player), "Mixed armor qualifies for the set bonus");
            player.equipStack(EquipmentSlot.CHEST, new ItemStack(ModItems.STARSTEEL_HELMET));
            context.assertFalse(StarlitArmor.hasFullSet(player), "A duplicated piece in the wrong slot qualifies");
        } finally { removePlayer(context, player); }
        context.complete();
    }

    @GameTest(templateName = "starfall_test:arena", batchId = "starsteel_conditions")
    public void bonusesRequireClearOverworldSkyAndTheExactNightWindow(TestContext context) {
        var world = context.getWorld();
        var sky = Sky.capture(world);
        var player = player(context);
        try {
            openSky(context);
            equipSet(player);
            clearNight(world);
            for (long time : new long[] {13000, 22999, 37000}) {
                world.setTimeOfDay(time);
                context.assertTrue(StarlitArmor.isEligible(player), "Night boundary wrongly excluded: " + time);
            }
            for (long time : new long[] {6000, 12999, 23000, 24000}) {
                world.setTimeOfDay(time);
                assertNoRefresh(context, player, "Outside the night window: " + time);
            }
            clearNight(world);
            world.setWeather(0, 1000, true, false);
            world.setRainGradient(1);
            assertNoRefresh(context, player, "Rain");
            clearNight(world);
            var roof = player.getBlockPos().up(2);
            world.setBlockState(roof, Blocks.STONE.getDefaultState());
            assertNoRefresh(context, player, "Solid roof");
            world.setBlockState(roof, Blocks.AIR.getDefaultState());
            player.equipStack(EquipmentSlot.FEET, ItemStack.EMPTY);
            assertNoRefresh(context, player, "Partial set");
            var nether = world.getServer().getWorld(World.NETHER);
            context.assertTrue(nether != null, "Nether fixture is missing");
            var profile = new GameProfile(UUID.randomUUID(), "armor-nether");
            var netherPlayer = new ServerPlayerEntity(world.getServer(), nether, profile,
                    ConnectedClientData.createDefault(profile, false).syncedOptions());
            equipSet(netherPlayer);
            assertNoRefresh(context, netherPlayer, "Nether");
        } finally {
            removePlayer(context, player);
            sky.restore(world);
        }
        context.complete();
    }

    @GameTest(templateName = "starfall_test:arena", batchId = "starsteel_potions")
    public void strongerLongerAndInfinitePotionsSurviveArmorRefreshAndRemoval(TestContext context) {
        var world = context.getWorld();
        var sky = Sky.capture(world);
        var player = player(context);
        try {
            openSky(context); clearNight(world); equipSet(player);
            for (var original : List.of(new StatusEffectInstance(StatusEffects.NIGHT_VISION, 1200, 0),
                    new StatusEffectInstance(StatusEffects.NIGHT_VISION, 60, 1),
                    new StatusEffectInstance(StatusEffects.NIGHT_VISION, -1, 0),
                    new StatusEffectInstance(StatusEffects.NIGHT_VISION, 250, 0))) {
                int duration = original.getDuration(), amplifier = original.getAmplifier();
                player.removeStatusEffect(StatusEffects.NIGHT_VISION);
                player.addStatusEffect(original);
                StarlitArmor.refreshNightVision(player);
                assertEffect(context, player, duration, amplifier);
                player.equipStack(EquipmentSlot.FEET, ItemStack.EMPTY);
                StarlitArmor.refreshNightVision(player);
                assertEffect(context, player, duration, amplifier);
                equipSet(player);
            }
            player.removeStatusEffect(StatusEffects.NIGHT_VISION);
            player.addStatusEffect(new StatusEffectInstance(StatusEffects.NIGHT_VISION, 240, 0));
            StarlitArmor.refreshNightVision(player);
            assertEffect(context, player, 260, 0);
        } finally {
            removePlayer(context, player);
            sky.restore(world);
        }
        context.complete();
    }

    @GameTest(templateName = "starfall_test:arena", batchId = "starsteel_damage", tickLimit = 100)
    public void realFallDamageIsCancelledOnlyWhileEligibleAndOtherDamageStillHurts(TestContext context) {
        var player = player(context, true);
        equipSet(player);
        // Real server players receive 60 ticks of join immunity. Let it expire so cancellation
        // cannot be mistaken for the mod's protection, then exercise the actual damage callback.
        context.waitAndRun(65, () -> {
            var world = context.getWorld();
            var sky = Sky.capture(world);
            try {
                openSky(context); clearNight(world);
                context.assertTrue(StarlitArmor.isEligible(player), "Damage fixture is not starlit");
                resetHealth(player);
                player.damage(world.getDamageSources().fall(), 6);
                context.assertEquals(20F, player.getHealth(), "Full starlit armor did not stop real fall damage");
                resetHealth(player);
                player.damage(world.getDamageSources().stalagmite(), 6);
                context.assertEquals(20F, player.getHealth(), "The IS_FALL-tagged stalagmite source bypassed protection");
                resetHealth(player);
                player.damage(world.getDamageSources().generic(), 6);
                context.assertTrue(player.getHealth() < 20, "Set bonus incorrectly cancels ordinary damage");
                // Re-check equipment at impact time, without a tick or Night Vision update.
                player.equipStack(EquipmentSlot.FEET, ItemStack.EMPTY);
                assertFallHurts(context, player, "Removing boots retained fall immunity");
                equipSet(player);
                world.setTimeOfDay(23000);
                assertFallHurts(context, player, "Dawn retained fall immunity");
                clearNight(world);
                world.setWeather(0, 1000, true, false); world.setRainGradient(1);
                assertFallHurts(context, player, "Rain retained fall immunity");
                clearNight(world);
                world.setBlockState(player.getBlockPos().up(2), Blocks.STONE.getDefaultState());
                assertFallHurts(context, player, "A roof retained fall immunity");
            } finally {
                removePlayer(context, player);
                sky.restore(world);
            }
            context.complete();
        });
    }

    @GameTest(templateName = "starfall_test:arena", batchId = "starsteel_hook", tickLimit = 60)
    public void registeredWorldTickHookRefreshesOnlyOnItsTwentyTickSchedule(TestContext context) {
        // Select a real refresh tick without changing world's absolute time or calling the
        // armor helper directly. Invoking the Fabric event also verifies registration.
        boolean[] checkedOffTick = {false};
        context.runAtEveryTick(() -> {
            var world = context.getWorld();
            boolean refreshTick = world.getTime() % 20 == 0;
            if (refreshTick != checkedOffTick[0]) return;
            var sky = Sky.capture(world);
            var player = player(context);
            try {
                openSky(context); clearNight(world); equipSet(player);
                ServerTickEvents.END_WORLD_TICK.invoker().onEndTick(world);
                if (!refreshTick) {
                    context.assertFalse(player.hasStatusEffect(StatusEffects.NIGHT_VISION), "Armor refreshed outside its 20-tick schedule");
                    checkedOffTick[0] = true;
                    return;
                }
                assertEffect(context, player, 260, 0);
                player.equipStack(EquipmentSlot.HEAD, ItemStack.EMPTY);
                player.removeStatusEffect(StatusEffects.NIGHT_VISION);
                ServerTickEvents.END_WORLD_TICK.invoker().onEndTick(world);
                context.assertFalse(player.hasStatusEffect(StatusEffects.NIGHT_VISION), "World hook grants a partial set Night Vision");
            } finally {
                removePlayer(context, player);
                sky.restore(world);
            }
            context.complete();
        });
    }

    @GameTest(templateName = "starfall_test:arena", batchId = "starsteel_expiry", tickLimit = 310)
    public void serverTicksRenewTheBonusAndRemovalLetsItExpireWithinThirteenSeconds(TestContext context) {
        var world = context.getWorld();
        var sky = Sky.capture(world);
        var player = player(context, true);
        openSky(context); clearNight(world); equipSet(player);
        // The player helper supplies the same playerTick callback as a real network handler.
        // The normal END_WORLD_TICK event must supply the armor effect on its own.
        context.waitAndRun(25, () -> {
            try {
                var effect = player.getStatusEffect(StatusEffects.NIGHT_VISION);
                context.assertTrue(effect != null, "Normal server ticks never applied the registered armor bonus");
                context.assertTrue(effect.getDuration() >= 239 && effect.getDuration() <= 260, "Bonus is not refreshed every 20 ticks");
                player.equipStack(EquipmentSlot.CHEST, ItemStack.EMPTY);
                StarlitArmor.refreshNightVision(player);
                context.assertTrue(player.hasStatusEffect(StatusEffects.NIGHT_VISION), "Armor removal forcibly deleted a potion effect");
            } catch (RuntimeException | Error failure) {
                removePlayer(context, player); sky.restore(world); throw failure;
            }
        });
        context.waitAndRun(286, () -> {
            try {
                context.assertFalse(player.hasStatusEffect(StatusEffects.NIGHT_VISION), "Set effect outlived its 13-second residual window");
            } finally {
                removePlayer(context, player);
                sky.restore(world);
            }
            context.complete();
        });
    }

    private static List<Item> pieces() {
        return List.of(ModItems.STARSTEEL_HELMET, ModItems.STARSTEEL_CHESTPLATE,
                ModItems.STARSTEEL_LEGGINGS, ModItems.STARSTEEL_BOOTS);
    }

    private static CraftingRecipeInput recipeInput(String pattern, Item ingredient) {
        var stacks = new ArrayList<ItemStack>();
        for (char symbol : pattern.toCharArray()) stacks.add(symbol == 'S' ? new ItemStack(ingredient) : ItemStack.EMPTY);
        return CraftingRecipeInput.create(3, pattern.length() / 3, stacks);
    }

    private static void equipSet(ServerPlayerEntity player) {
        player.equipStack(EquipmentSlot.HEAD, new ItemStack(ModItems.STARSTEEL_HELMET));
        player.equipStack(EquipmentSlot.CHEST, new ItemStack(ModItems.STARSTEEL_CHESTPLATE));
        player.equipStack(EquipmentSlot.LEGS, new ItemStack(ModItems.STARSTEEL_LEGGINGS));
        player.equipStack(EquipmentSlot.FEET, new ItemStack(ModItems.STARSTEEL_BOOTS));
    }

    private static void assertNoRefresh(TestContext context, ServerPlayerEntity player, String condition) {
        player.removeStatusEffect(StatusEffects.NIGHT_VISION);
        context.assertFalse(StarlitArmor.isEligible(player), condition + " incorrectly qualifies");
        StarlitArmor.refreshNightVision(player);
        context.assertFalse(player.hasStatusEffect(StatusEffects.NIGHT_VISION), condition + " grants Night Vision");
    }

    private static void assertEffect(TestContext context, ServerPlayerEntity player, int duration, int amplifier) {
        var effect = player.getStatusEffect(StatusEffects.NIGHT_VISION);
        context.assertTrue(effect != null, "Night Vision is missing");
        context.assertEquals(duration, effect.getDuration(), "Night Vision duration was overwritten");
        context.assertEquals(amplifier, effect.getAmplifier(), "Night Vision amplifier was overwritten");
    }

    private static void resetHealth(ServerPlayerEntity player) {
        player.setHealth(20);
        player.timeUntilRegen = 0;
    }

    private static void assertFallHurts(TestContext context, ServerPlayerEntity player, String message) {
        resetHealth(player);
        player.damage(context.getWorld().getDamageSources().fall(), 6);
        context.assertTrue(player.getHealth() < 20, message);
    }

    private static void clearNight(ServerWorld world) {
        world.setTimeOfDay(18000);
        world.setWeather(0, 0, false, false);
        world.setRainGradient(0); world.setThunderGradient(0);
    }

    private static void openSky(TestContext context) {
        // Remove the GameTest barrier ceiling, which counts in MOTION_BLOCKING.
        for (int x = 5; x <= 9; x++) for (int z = 5; z <= 9; z++) for (int y = 9; y <= 16; y++) {
            context.getWorld().setBlockState(context.getAbsolutePos(new BlockPos(x, y, z)),
                    Blocks.AIR.getDefaultState(), Block.NOTIFY_ALL);
        }
    }

    private static ServerPlayerEntity player(TestContext context) {
        return player(context, false);
    }

    private static ServerPlayerEntity player(TestContext context, boolean advanceLivingState) {
        var id = UUID.randomUUID();
        var profile = new GameProfile(id, "armor-" + id.toString().substring(0, 8));
        var data = ConnectedClientData.createDefault(profile, false);
        var world = context.getWorld();
        var player = new ServerPlayerEntity(world.getServer(), world, profile, data.syncedOptions());
        var connection = new ClientConnection(NetworkSide.SERVERBOUND);
        var channel = new EmbeddedChannel(connection);
        CONNECTIONS.put(id, channel);
        world.getServer().getPlayerManager().onPlayerConnect(connection, player, data);
        player.changeGameMode(GameMode.SURVIVAL);
        player.setNoGravity(true);
        var pos = context.getAbsolutePos(new BlockPos(7, 9, 7));
        player.refreshPositionAndAngles(pos.getX() + .5, pos.getY(), pos.getZ() + .5, 0, 0);
        // EmbeddedChannel is not in ServerNetworkIo's connection list. Supply only its
        // missing playerTick callback so effect durations advance normally in timed tests.
        if (advanceLivingState) context.runAtEveryTick(() -> { if (!player.isRemoved()) player.playerTick(); });
        return player;
    }

    private static void removePlayer(TestContext context, ServerPlayerEntity player) {
        context.getWorld().getServer().getPlayerManager().remove(player);
        player.discard();
        var channel = CONNECTIONS.remove(player.getUuid());
        if (channel != null) channel.finishAndReleaseAll();
    }

    private record Sky(long time, boolean rain, boolean thunder) {
        static Sky capture(ServerWorld world) { return new Sky(world.getTimeOfDay(), world.isRaining(), world.isThundering()); }
        void restore(ServerWorld world) {
            world.setTimeOfDay(time);
            world.setWeather(0, 0, rain, thunder);
            world.setRainGradient(rain ? 1 : 0); world.setThunderGradient(thunder ? 1 : 0);
        }
    }
}
