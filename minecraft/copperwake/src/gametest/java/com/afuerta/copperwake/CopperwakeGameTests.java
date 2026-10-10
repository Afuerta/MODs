package com.afuerta.copperwake;

import com.afuerta.copperwake.domain.ContractCatalog;
import com.afuerta.copperwake.entity.ConstructRegistry;
import com.google.gson.JsonParser;
import com.mojang.serialization.JsonOps;
import net.fabricmc.fabric.api.gametest.v1.FabricGameTest;
import net.minecraft.block.Blocks;
import net.minecraft.block.entity.LootableContainerBlockEntity;
import net.minecraft.block.entity.StructureBlockBlockEntity;
import net.minecraft.component.DataComponentTypes;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.effect.StatusEffects;
import net.minecraft.entity.mob.MobEntity;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.loot.LootTable;
import net.minecraft.loot.context.LootContextParameterSet;
import net.minecraft.loot.context.LootContextParameters;
import net.minecraft.loot.context.LootContextTypes;
import net.minecraft.registry.Registries;
import net.minecraft.registry.RegistryKey;
import net.minecraft.registry.RegistryKeys;
import net.minecraft.registry.RegistryOps;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.structure.StructurePlacementData;
import net.minecraft.structure.PoolStructurePiece;
import net.minecraft.structure.StructureStart;
import net.minecraft.test.GameTest;
import net.minecraft.test.TestContext;
import net.minecraft.text.Text;
import net.minecraft.util.ActionResult;
import net.minecraft.util.Hand;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.ChunkPos;
import net.minecraft.util.math.Vec3d;
import net.minecraft.world.GameMode;
import net.minecraft.world.World;
import net.minecraft.world.dimension.DimensionOptions;
import net.minecraft.world.Heightmap;
import net.minecraft.world.gen.StructureTerrainAdaptation;
import net.minecraft.world.gen.chunk.NoiseChunkGenerator;
import net.minecraft.world.gen.chunk.placement.RandomSpreadStructurePlacement;
import net.minecraft.world.gen.noise.NoiseConfig;

import java.util.LinkedHashMap;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

/** Actual Minecraft-server checks. The gametest source set is not shipped in the playable jar. */
public final class CopperwakeGameTests implements FabricGameTest {
    @GameTest(templateName = EMPTY_STRUCTURE)
    public void dimensionDefinitionBiomesAndWorldgenCodecsLoad(TestContext context) throws Exception {
        var server = context.getWorld().getServer();
        var registries = server.getRegistryManager();
        // Vanilla TestServer builds FLAT.toConfig(emptyDimensionRegistry), intentionally excluding
        // custom dimensions. Decode the production file here; RuntimeSmoke tests actual world creation.
        DimensionOptions rustwild;
        try (var reader = server.getResourceManager().getResource(CopperwakeMod.id("dimension/rustwild.json"))
                .orElseThrow().getReader()) {
            rustwild = DimensionOptions.CODEC.parse(RegistryOps.of(JsonOps.INSTANCE, registries),
                    JsonParser.parseReader(reader)).getOrThrow();
        }
        context.assertTrue(rustwild.dimensionTypeEntry().matchesKey(RegistryKey.of(RegistryKeys.DIMENSION_TYPE,
                CopperwakeMod.id("rustwild"))), "Dimension definition resolves the wrong dimension type");
        for (String name : List.of("oxide_flats", "verdigris_woods", "cinder_works")) {
            var id = CopperwakeMod.id(name);
            context.assertTrue(registries.get(RegistryKeys.BIOME).containsId(id), "Biome codec failed: " + name);
            var biome = registries.get(RegistryKeys.BIOME).get(id);
            context.assertTrue(rustwild.chunkGenerator().getBiomeSource().getBiomes()
                    .stream().anyMatch(entry -> entry.value() == biome), "Biome omitted from dimension source: " + name);
        }
        for (String name : List.of("salvage_yard", "relay_tower", "foundry", "siphon_gardens", "switchyard_depot")) {
            var id = CopperwakeMod.id(name);
            context.assertTrue(registries.get(RegistryKeys.STRUCTURE).containsId(id), "Structure codec failed: " + name);
            context.assertTrue(registries.get(RegistryKeys.STRUCTURE_SET).containsId(id), "Structure set did not load: " + name);
            context.assertTrue(registries.get(RegistryKeys.TEMPLATE_POOL).containsId(id), "Template pool did not load: " + name);
        }
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void recipesAndLootTablesDecodeInMinecraft(TestContext context) {
        var recipes = context.getWorld().getRecipeManager();
        context.assertFalse(recipes.isErrored(), "Minecraft reported a recipe decoding error");
        for (String name : List.of("scrap", "salvage_bench", "foreman_seal", "patch_kit", "spring_boots",
                "field_journal", "riveted_copper", "lumen_glass", "arc_gauntlet", "survey_key", "lumen_glass_from_heart",
                "survey_flare", "field_repairer")) {
            var recipe = recipes.get(CopperwakeMod.id(name));
            context.assertTrue(recipe.isPresent(), "Recipe was rejected or missing: " + name);
            String output = name.equals("lumen_glass_from_heart") ? "lumen_glass" : name;
            context.assertTrue(recipe.orElseThrow().value().getResult(context.getWorld().getRegistryManager())
                    .isOf(Registries.ITEM.get(CopperwakeMod.id(output))), "Wrong recipe result: " + name);
        }
        var loot = context.getWorld().getServer().getReloadableRegistries();
        for (String name : List.of("blocks/salvage_bench", "blocks/riveted_copper", "blocks/lumen_glass",
                "chests/salvage_yard", "chests/relay_tower", "chests/foundry", "chests/siphon_gardens", "chests/switchyard_depot",
                "entities/rust_mite", "entities/coil_sentry", "entities/foundry_foreman")) {
            var id = CopperwakeMod.id(name);
            context.assertTrue(loot.getIds(RegistryKeys.LOOT_TABLE).contains(id), "Loot table did not decode: " + name);
            var table = loot.getLootTable(RegistryKey.of(RegistryKeys.LOOT_TABLE, id));
            context.assertTrue(table != LootTable.EMPTY, "Loot table fell back to empty: " + name);
            if (name.startsWith("chests/")) {
                var parameters = new LootContextParameterSet.Builder(context.getWorld())
                        .add(LootContextParameters.ORIGIN, context.getAbsolutePos(new BlockPos(2, 2, 2)).toCenterPos())
                        .build(LootContextTypes.CHEST);
                var drops = table.generateLoot(parameters, 17841L);
                context.assertFalse(drops.isEmpty(), "Chest table produced no actual stacks: " + name);
                context.assertTrue(drops.stream().allMatch(stack -> !stack.isEmpty()), "Chest table emitted an empty stack: " + name);
                if (name.equals("chests/relay_tower")) {
                    context.assertTrue(drops.stream().anyMatch(stack -> stack.isOf(ModContent.MEMORY_GLASS)),
                            "Relay tower lost its guaranteed exploration memory glass");
                }
                if (name.equals("chests/foundry")) {
                    context.assertTrue(drops.stream().anyMatch(stack -> stack.isOf(ModContent.FOREMAN_SEAL)),
                            "Foundry lost its guaranteed boss seal");
                }
            }
        }
        context.complete();
    }

    // The runner loads and places each production NBT inside its own correctly sized, isolated canvas.
    // Checking actual placed blocks and their block entities catches palette and NBT errors.
    @GameTest(templateName = "copperwake:salvage_yard")
    public void salvageYardTemplatePlacesItsLoot(TestContext context) {
        checkPlacedTemplate(context, "salvage_yard");
        context.complete();
    }

    @GameTest(templateName = "copperwake:relay_tower")
    public void relayTowerTemplatePlacesItsLoot(TestContext context) {
        checkPlacedTemplate(context, "relay_tower");
        context.complete();
    }

    @GameTest(templateName = "copperwake:foundry")
    public void foundryTemplatePlacesItsLoot(TestContext context) {
        checkPlacedTemplate(context, "foundry");
        context.complete();
    }

    @GameTest(templateName = "copperwake:siphon_gardens")
    public void siphonGardensPlacesDryEntranceLadderCisternsAndFiniteCaches(TestContext context) {
        checkPlacedTemplate(context, "siphon_gardens");
        BlockPos offset = templateOffset(context);
        expectClear(context, offset.add(17, 1, 0));
        expectClear(context, offset.add(17, 1, 1));
        expectClear(context, offset.add(27, 10, 18));
        expectClear(context, offset.add(15, 10, 24));
        expectClear(context, offset.add(15, 10, 19));
        for (int y = 1; y <= 11; y++) context.expectBlock(Blocks.LADDER, offset.add(14, y, 24));
        for (int x : new int[]{5, 27}) for (int z : new int[]{6, 23}) {
            context.expectBlock(Blocks.WATER, offset.add(x, 1, z));
            context.expectBlock(Blocks.STONE_BRICKS, offset.add(x, 0, z));
        }
        context.expectBlock(Blocks.STONE_BRICKS, offset.add(27, 9, 18));
        checkPersistentGuards(context, 2, 2);
        checkFiniteCache(context, offset.add(20, 1, 25), 2, 4, 6, 12, 1, 3);
        checkFiniteCache(context, offset.add(31, 10, 18), 2, 4, 6, 12, 1, 3);
        context.complete();
    }

    @GameTest(templateName = "copperwake:switchyard_depot")
    public void switchyardDepotPlacesWalkablePlatformsOfficeAndFiniteCaches(TestContext context) {
        checkPlacedTemplate(context, "switchyard_depot");
        BlockPos offset = templateOffset(context);
        expectClear(context, offset.add(18, 1, 0));
        expectClear(context, offset.add(9, 1, 24));
        expectClear(context, offset.add(9, 7, 24));
        expectClear(context, offset.add(30, 8, 19));
        for (int y = 1; y <= 8; y++) context.expectBlock(Blocks.LADDER, offset.add(4, y, 29));
        for (int x : new int[]{6, 12, 19, 26, 32}) context.expectBlock(Blocks.RAIL, offset.add(x, 1, 10));
        context.expectBlock(Blocks.DARK_OAK_PLANKS, offset.add(30, 7, 19));
        checkPersistentGuards(context, 2, 3);
        checkFiniteCache(context, offset.add(13, 7, 30), 1, 3, 8, 14, 2, 4);
        checkFiniteCache(context, offset.add(23, 2, 27), 1, 3, 8, 14, 2, 4);
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE, tickLimit = 200)
    public void allJigsawStartsUseRustwildSurfaceHeightAndRejectWrongBiomes(TestContext context) throws Exception {
        var world = context.getWorld();
        var registries = world.getRegistryManager();
        DimensionOptions definition;
        try (var reader = world.getServer().getResourceManager().getResource(CopperwakeMod.id("dimension/rustwild.json"))
                .orElseThrow().getReader()) {
            definition = DimensionOptions.CODEC.parse(RegistryOps.of(JsonOps.INSTANCE, registries),
                    JsonParser.parseReader(reader)).getOrThrow();
        }
        context.assertTrue(definition.chunkGenerator() instanceof NoiseChunkGenerator, "Rustwild must retain its real noise terrain generator");
        var generator = (NoiseChunkGenerator) definition.chunkGenerator();
        long seed = 508431L;
        var noise = NoiseConfig.create(generator.getSettings().value(), registries.getWrapperOrThrow(RegistryKeys.NOISE_PARAMETERS), seed);
        for (String name : List.of("salvage_yard", "relay_tower", "foundry", "siphon_gardens", "switchyard_depot")) {
            var structure = registries.get(RegistryKeys.STRUCTURE).get(CopperwakeMod.id(name));
            context.assertEquals(StructureTerrainAdaptation.BEARD_THIN, structure.getTerrainAdaptation(), "Lost terrain joining: " + name);
            var allowed = structure.getValidBiomes().stream().map(entry -> entry.getKey().orElseThrow().getValue()).collect(java.util.stream.Collectors.toSet());
            var expected = switch (name) {
                case "salvage_yard" -> java.util.Set.of(CopperwakeMod.id("oxide_flats"), CopperwakeMod.id("verdigris_woods"));
                case "relay_tower" -> java.util.Set.of(CopperwakeMod.id("oxide_flats"), CopperwakeMod.id("verdigris_woods"), CopperwakeMod.id("cinder_works"));
                case "foundry" -> java.util.Set.of(CopperwakeMod.id("cinder_works"));
                case "siphon_gardens" -> java.util.Set.of(CopperwakeMod.id("verdigris_woods"));
                default -> java.util.Set.of(CopperwakeMod.id("oxide_flats"), CopperwakeMod.id("cinder_works"));
            };
            context.assertEquals(expected, allowed, "Landmark can generate outside its intended Rustwild biomes: " + name);
            var placement = registries.get(RegistryKeys.STRUCTURE_SET).get(CopperwakeMod.id(name)).placement();
            context.assertTrue(placement instanceof RandomSpreadStructurePlacement, "Landmark lost bounded grid placement: " + name);
            var spread = (RandomSpreadStructurePlacement) placement;
            int spacing = switch (name) { case "salvage_yard" -> 24; case "relay_tower" -> 30; case "foundry" -> 38; case "siphon_gardens" -> 34; default -> 32; };
            int separation = switch (name) { case "salvage_yard" -> 10; case "relay_tower" -> 12; case "foundry" -> 16; case "siphon_gardens" -> 14; default -> 13; };
            context.assertEquals(spacing, spread.getSpacing(), "Landmark placement frequency changed");
            context.assertEquals(separation, spread.getSeparation(), "Landmark minimum separation changed");
            for (ChunkPos chunk : List.of(new ChunkPos(0, 0), new ChunkPos(19, -13), new ChunkPos(-27, 41))) {
                // Height sampling and start construction use the production noise generator.
                // They do not populate or load distant chunks in the running test world.
                var start = structure.createStructureStart(registries, generator, generator.getBiomeSource(), noise,
                        world.getStructureTemplateManager(), seed, chunk, 0, world, entry -> true);
                context.assertTrue(start.hasChildren(), "Jigsaw failed to create its template piece: " + name);
                context.assertEquals(1, start.getChildren().size(), "Landmark generated unbounded extra pieces: " + name);
                context.assertTrue(start.getChildren().getFirst() instanceof PoolStructurePiece, "Unexpected landmark piece type");
                var piece = (PoolStructurePiece) start.getChildren().getFirst();
                var box = piece.getBoundingBox();
                int x = (box.getMinX() + box.getMaxX()) / 2;
                int z = (box.getMinZ() + box.getMaxZ()) / 2;
                int surface = generator.getHeightOnGround(x, z, Heightmap.Type.WORLD_SURFACE_WG, world, noise);
                context.assertEquals(surface, box.getMinY() + piece.getGroundLevelDelta(), "Landmark floats or sinks instead of anchoring to Rustwild terrain: " + name);
                var rejected = structure.createStructureStart(registries, generator, generator.getBiomeSource(), noise,
                        world.getStructureTemplateManager(), seed, chunk, 0, world, entry -> false);
                context.assertTrue(rejected == StructureStart.DEFAULT || !rejected.hasChildren(), "Biome rejection still generated a landmark");
            }
        }
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void newCacheLootStaysWithinBoundsAcrossSeeds(TestContext context) {
        var parameters = new LootContextParameterSet.Builder(context.getWorld())
                .add(LootContextParameters.ORIGIN, context.getAbsolutePos(new BlockPos(2, 2, 2)).toCenterPos()).build(LootContextTypes.CHEST);
        for (String name : List.of("siphon_gardens", "switchyard_depot")) {
            var table = context.getWorld().getServer().getReloadableRegistries().getLootTable(
                    RegistryKey.of(RegistryKeys.LOOT_TABLE, CopperwakeMod.id("chests/" + name)));
            for (long seed = 1; seed <= 64; seed++) {
                var drops = table.generateLoot(parameters, seed);
                boolean gardens = name.equals("siphon_gardens");
                checkLootBounds(context, drops, gardens ? 2 : 1, gardens ? 4 : 3, gardens ? 6 : 8, gardens ? 12 : 14, gardens ? 1 : 2, gardens ? 3 : 4);
            }
        }
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void deliveryIsAtomicAcrossInventoryAndOffhandAndCannotDoublePay(TestContext context) {
        var player = survivalPlayer(context);
        try {
            var contract = ContractCatalog.current(0);
            fillRequirements(player, 0);
            // Split the payment across ordinary inventory and offhand, then remove the only glass.
            int scrap = contract.requirements().get("copperwake:scrap");
            SalvageGuild.consume(player, ModContent.SCRAP, scrap);
            player.getInventory().insertStack(new ItemStack(ModContent.SCRAP, scrap - 1));
            player.setStackInHand(Hand.OFF_HAND, new ItemStack(ModContent.SCRAP));
            SalvageGuild.consume(player, ModContent.MEMORY_GLASS, 1);
            Map<Item, Integer> before = inventoryCounts(player);
            SalvageGuild.deliver(player);
            context.assertEquals(before, inventoryCounts(player), "Incomplete delivery partially consumed inventory");
            context.assertEquals(0, GuildProgress.completed(player), "Incomplete delivery advanced progress");
            player.getInventory().insertStack(new ItemStack(ModContent.MEMORY_GLASS));
            SalvageGuild.deliver(player);
            context.assertEquals(1, GuildProgress.completed(player), "Complete delivery did not advance once");
            for (String id : contract.requirements().keySet()) {
                context.assertEquals(0, SalvageGuild.count(player, SalvageGuild.requiredItem(id)), "Payment left behind: " + id);
            }
            context.assertTrue(player.getOffHandStack().isEmpty(), "Split offhand payment was not consumed");
            context.assertEquals(3, SalvageGuild.count(player, ModContent.BRASS_GEAR), "First delivery reward must be exactly three gears");
            var paid = inventoryCounts(player);
            SalvageGuild.deliver(player);
            context.assertEquals(paid, inventoryCounts(player), "Retry duplicated a reward or consumed unpaid supplies");
            context.assertEquals(1, GuildProgress.completed(player), "Unpaid retry advanced progress");
        } finally {
            removePlayer(context, player);
        }
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void realDeliveriesPromoteAtBothThresholdsAndPreserveExtraSupplies(TestContext context) {
        var player = survivalPlayer(context);
        try {
            for (int startingCount : new int[]{3, 11}) {
                player.getInventory().clear();
                GuildProgress.put(player, "cw_contracts", startingCount);
                var contract = ContractCatalog.current(startingCount);
                fillRequirements(player, startingCount);
                player.getInventory().insertStack(new ItemStack(ModContent.SCRAP, 2));
                SalvageGuild.deliver(player);
                context.assertEquals(startingCount + 1, GuildProgress.completed(player), "Promotion delivery progress mismatch");
                context.assertEquals(startingCount == 3 ? 1 : 2, ContractCatalog.rankIndex(GuildProgress.completed(player)),
                        "Real delivery failed to unlock the next rank");
                context.assertEquals(2, SalvageGuild.count(player, ModContent.SCRAP), "Delivery consumed surplus scrap");
                contract.rewards().forEach((id, amount) -> context.assertEquals(amount,
                        SalvageGuild.count(player, SalvageGuild.requiredItem(id)), "Promotion reward mismatch: " + id));
            }
            GuildProgress.put(player, "cw_contracts", Integer.MAX_VALUE);
            GuildProgress.complete(player);
            context.assertEquals(Integer.MAX_VALUE, GuildProgress.completed(player), "Persistent counter overflowed");
        } finally {
            removePlayer(context, player);
        }
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void expandedCatalogDeliversEveryContractInFixedOrder(TestContext context) {
        var player = survivalPlayer(context);
        var visited = new HashSet<String>();
        try {
            for (int completed = 0; completed < 26; completed++) {
                context.assertEquals(completed, GuildProgress.completed(player), "Delivery progress was reset or reordered");
                var contract = ContractCatalog.current(completed);
                if (completed == 18) context.assertEquals("copperwake:apiary_exchange", contract.id(), "Expansion did not append after the original cycle");
                visited.add(contract.id());
                player.getInventory().clear();
                fillRequirements(player, completed);
                SalvageGuild.deliver(player);
                context.assertEquals(completed + 1, GuildProgress.completed(player), "Full authored order failed to deliver: " + contract.id());
                contract.requirements().forEach((id, amount) -> context.assertEquals(0,
                        SalvageGuild.count(player, SalvageGuild.requiredItem(id)), "Unpaid contract input: " + id));
                contract.rewards().forEach((id, amount) -> context.assertEquals(amount,
                        SalvageGuild.count(player, SalvageGuild.requiredItem(id)), "Incorrect catalog reward: " + id));
            }
            context.assertEquals(22, visited.size(), "Not every authored contract was reached");
            context.assertEquals("copperwake:deep_chime", ContractCatalog.current(26).id(), "Expanded Artificer cycle did not wrap in fixed order");
        } finally {
            removePlayer(context, player);
        }
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void surveyFlareChecksRankFuelCapRadiusAndCooldownWithoutDamage(TestContext context) {
        var player = survivalPlayer(context);
        var mobs = new ArrayList<MobEntity>();
        try {
            // Separate this bounded scan from neighboring concurrently placed test structures.
            player.refreshPositionAndAngles(player.getX(), player.getY() + 100, player.getZ(), 0, 0);
            player.setStackInHand(Hand.MAIN_HAND, new ItemStack(ModContent.SURVEY_FLARE));
            player.getInventory().insertStack(new ItemStack(ModContent.SCRAP, 2));
            var result = ModContent.SURVEY_FLARE.use(context.getWorld(), player, Hand.MAIN_HAND);
            context.assertEquals(ActionResult.FAIL, result.getResult(), "Scrounger activated Survey Flare");
            context.assertEquals(2, SalvageGuild.count(player, ModContent.SCRAP), "Rank rejection consumed survey fuel");
            GuildProgress.put(player, "cw_contracts", 4);
            result = ModContent.SURVEY_FLARE.use(context.getWorld(), player, Hand.MAIN_HAND);
            context.assertEquals(ActionResult.FAIL, result.getResult(), "Empty survey consumed fuel");
            context.assertEquals(2, SalvageGuild.count(player, ModContent.SCRAP), "Empty survey spent Scrap");
            for (int i = 0; i < 10; i++) {
                var zombie = EntityType.ZOMBIE.create(context.getWorld());
                context.assertTrue(zombie != null, "Zombie fixture creation failed");
                zombie.setAiDisabled(true);
                zombie.refreshPositionAndAngles(player.getX() + 1 + i * .1, player.getY(), player.getZ(), 0, 0);
                context.assertTrue(context.getWorld().spawnEntity(zombie), "Hostile fixture did not spawn");
                mobs.add(zombie);
            }
            var outside = EntityType.ZOMBIE.create(context.getWorld());
            outside.setAiDisabled(true);
            outside.refreshPositionAndAngles(player.getX() + 17, player.getY(), player.getZ(), 0, 0);
            context.assertTrue(context.getWorld().spawnEntity(outside), "Radius fixture did not spawn");
            mobs.add(outside);
            var cow = EntityType.COW.create(context.getWorld());
            cow.setAiDisabled(true);
            cow.refreshPositionAndAngles(player.getX(), player.getY(), player.getZ() + 1, 0, 0);
            context.assertTrue(context.getWorld().spawnEntity(cow), "Passive fixture did not spawn");
            mobs.add(cow);
            SalvageGuild.consume(player, ModContent.SCRAP, 2);
            result = ModContent.SURVEY_FLARE.use(context.getWorld(), player, Hand.MAIN_HAND);
            context.assertEquals(ActionResult.FAIL, result.getResult(), "Unfueled Survey Flare succeeded");
            context.assertFalse(mobs.getFirst().hasStatusEffect(StatusEffects.GLOWING), "Unfueled scan marked a target");
            player.getInventory().insertStack(new ItemStack(ModContent.SCRAP, 2));
            result = ModContent.SURVEY_FLARE.use(context.getWorld(), player, Hand.MAIN_HAND);
            context.assertEquals(ActionResult.SUCCESS, result.getResult(), "Fueled Survey Flare failed");
            context.assertEquals(1, SalvageGuild.count(player, ModContent.SCRAP), "Survey did not cost exactly one Scrap");
            for (int i = 0; i < 10; i++) {
                context.assertEquals(i < 8, mobs.get(i).hasStatusEffect(StatusEffects.GLOWING), "Survey cap/nearest ordering mismatch " + i);
                context.assertEquals(mobs.get(i).getMaxHealth(), mobs.get(i).getHealth(), "Survey dealt combat damage");
            }
            context.assertEquals(160, mobs.getFirst().getStatusEffect(StatusEffects.GLOWING).getDuration(), "Survey reveal duration changed");
            context.assertFalse(outside.hasStatusEffect(StatusEffects.GLOWING), "Survey marked a target beyond its radius");
            context.assertFalse(cow.hasStatusEffect(StatusEffects.GLOWING), "Survey marked a passive mob");
            context.assertEquals(ActionResult.FAIL, ModContent.SURVEY_FLARE.use(context.getWorld(), player, Hand.MAIN_HAND).getResult(), "Survey ignored cooldown");
            context.assertEquals(1, SalvageGuild.count(player, ModContent.SCRAP), "Cooldown retry spent Scrap");
        } finally {
            mobs.forEach(MobEntity::discard);
            removePlayer(context, player);
        }
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void fieldRepairerPaysAtomicallyPreservesMetadataAndClampsRepair(TestContext context) {
        var player = survivalPlayer(context);
        try {
            var tool = new ItemStack(net.minecraft.item.Items.DIAMOND_PICKAXE);
            tool.setDamage(100);
            tool.set(DataComponentTypes.CUSTOM_NAME, Text.literal("Field Test Pickaxe"));
            player.setStackInHand(Hand.OFF_HAND, tool);
            player.setStackInHand(Hand.MAIN_HAND, new ItemStack(ModContent.FIELD_REPAIRER));
            player.getInventory().insertStack(new ItemStack(ModContent.SCRAP, 2));
            context.assertEquals(ActionResult.FAIL, ModContent.FIELD_REPAIRER.use(context.getWorld(), player, Hand.MAIN_HAND).getResult(), "Scrounger repaired equipment");
            context.assertEquals(100, tool.getDamage(), "Rank rejection changed durability");
            GuildProgress.put(player, "cw_contracts", 4);
            SalvageGuild.consume(player, ModContent.SCRAP, 1);
            context.assertEquals(ActionResult.FAIL, ModContent.FIELD_REPAIRER.use(context.getWorld(), player, Hand.MAIN_HAND).getResult(), "Partial payment repaired equipment");
            context.assertEquals(100, tool.getDamage(), "Partial payment changed durability");
            context.assertEquals(1, SalvageGuild.count(player, ModContent.SCRAP), "Partial payment consumed its only Scrap");
            player.getInventory().insertStack(new ItemStack(ModContent.SCRAP));
            context.assertEquals(ActionResult.SUCCESS, ModContent.FIELD_REPAIRER.use(context.getWorld(), player, Hand.MAIN_HAND).getResult(), "Valid field repair failed");
            context.assertEquals(68, tool.getDamage(), "Field repair must restore exactly 32 durability");
            context.assertEquals(0, SalvageGuild.count(player, ModContent.SCRAP), "Field repair must consume exactly two Scrap");
            context.assertEquals(Text.literal("Field Test Pickaxe"), tool.get(DataComponentTypes.CUSTOM_NAME), "Repair discarded equipment metadata");
            context.assertEquals(ActionResult.FAIL, ModContent.FIELD_REPAIRER.use(context.getWorld(), player, Hand.MAIN_HAND).getResult(), "Repair ignored cooldown");
            context.assertEquals(68, tool.getDamage(), "Cooldown retry changed durability");
            player.getItemCooldownManager().set(ModContent.FIELD_REPAIRER, 0);
            tool.setDamage(8);
            player.getInventory().insertStack(new ItemStack(ModContent.SCRAP, 4));
            context.assertEquals(ActionResult.SUCCESS, ModContent.FIELD_REPAIRER.use(context.getWorld(), player, Hand.MAIN_HAND).getResult(), "Small repair failed");
            context.assertEquals(0, tool.getDamage(), "Repair underflowed below zero damage");
            player.getItemCooldownManager().set(ModContent.FIELD_REPAIRER, 0);
            context.assertEquals(ActionResult.FAIL, ModContent.FIELD_REPAIRER.use(context.getWorld(), player, Hand.MAIN_HAND).getResult(), "Undamaged equipment spent fuel");
            context.assertEquals(2, SalvageGuild.count(player, ModContent.SCRAP), "Undamaged repair consumed Scrap");
            player.setStackInHand(Hand.MAIN_HAND, tool);
            player.setStackInHand(Hand.OFF_HAND, new ItemStack(ModContent.FIELD_REPAIRER));
            context.assertEquals(ActionResult.FAIL, ModContent.FIELD_REPAIRER.use(context.getWorld(), player, Hand.OFF_HAND).getResult(), "Offhand device repaired the wrong stack");
            context.assertEquals(2, SalvageGuild.count(player, ModContent.SCRAP), "Wrong-hand repair consumed Scrap");
        } finally {
            removePlayer(context, player);
        }
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void springGadgetRejectsRankAndFuelThenConsumesOnlyOnceDuringCooldown(TestContext context) {
        var player = survivalPlayer(context);
        try {
            player.setStackInHand(Hand.MAIN_HAND, new ItemStack(ModContent.SPRING_BOOTS));
            player.getInventory().insertStack(new ItemStack(ModContent.SCRAP, 2));
            player.setOnGround(true);
            player.setVelocity(Vec3d.ZERO);
            var before = inventoryCounts(player);
            var result = ModContent.SPRING_BOOTS.use(context.getWorld(), player, Hand.MAIN_HAND);
            context.assertEquals(ActionResult.FAIL, result.getResult(), "Scrounger fired a Mechanist gadget");
            context.assertEquals(before, inventoryCounts(player), "Rank rejection consumed fuel or device");
            context.assertEquals(Vec3d.ZERO, player.getVelocity(), "Rank rejection launched player");
            context.assertFalse(player.getItemCooldownManager().isCoolingDown(ModContent.SPRING_BOOTS), "Rank rejection started cooldown");

            GuildProgress.put(player, "cw_contracts", 4);
            SalvageGuild.consume(player, ModContent.SCRAP, 2);
            before = inventoryCounts(player);
            result = ModContent.SPRING_BOOTS.use(context.getWorld(), player, Hand.MAIN_HAND);
            context.assertEquals(ActionResult.FAIL, result.getResult(), "Unfueled gadget succeeded");
            context.assertEquals(before, inventoryCounts(player), "Fuel rejection mutated inventory");
            context.assertEquals(Vec3d.ZERO, player.getVelocity(), "Fuel rejection launched player");
            context.assertFalse(player.getItemCooldownManager().isCoolingDown(ModContent.SPRING_BOOTS), "Fuel rejection started cooldown");

            player.getInventory().insertStack(new ItemStack(ModContent.SCRAP, 2));
            result = ModContent.SPRING_BOOTS.use(context.getWorld(), player, Hand.MAIN_HAND);
            context.assertEquals(ActionResult.SUCCESS, result.getResult(), "Fueled Mechanist gadget failed");
            context.assertEquals(1, SalvageGuild.count(player, ModContent.SCRAP), "Spring use did not consume exactly one scrap");
            context.assertTrue(player.getVelocity().y > 0, "Spring did not launch player");
            context.assertTrue(player.getItemCooldownManager().isCoolingDown(ModContent.SPRING_BOOTS), "Spring did not start cooldown");
            Vec3d launched = player.getVelocity();
            result = ModContent.SPRING_BOOTS.use(context.getWorld(), player, Hand.MAIN_HAND);
            context.assertEquals(ActionResult.FAIL, result.getResult(), "Cooldown allowed a second activation");
            context.assertEquals(1, SalvageGuild.count(player, ModContent.SCRAP), "Cooldown consumed more fuel");
            context.assertEquals(launched, player.getVelocity(), "Cooldown modified launch velocity");
        } finally {
            removePlayer(context, player);
        }
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void travelRejectionsPreserveInventoryAndHome(TestContext context) {
        var player = survivalPlayer(context);
        try {
            player.setStackInHand(Hand.MAIN_HAND, new ItemStack(ModContent.SURVEY_KEY));
            GuildProgress.put(player, "cw_home_x", 117);
            var inventory = inventoryCounts(player);
            var position = player.getPos();
            player.changeGameMode(GameMode.SPECTATOR);
            context.assertFalse(RustwildTravel.useKey(player), "Spectator initiated travel");
            player.changeGameMode(GameMode.SURVIVAL);
            player.getItemCooldownManager().set(ModContent.SURVEY_KEY, 200);
            context.assertFalse(RustwildTravel.useKey(player), "Cooldown initiated travel");
            context.assertFalse(RustwildTravel.returnHome(player), "Return succeeded outside Rustwild");
            context.assertEquals(World.OVERWORLD, player.getWorld().getRegistryKey(), "Rejected travel changed dimension");
            context.assertEquals(position, player.getPos(), "Rejected travel moved player");
            context.assertEquals(inventory, inventoryCounts(player), "Rejected travel consumed a key");
            context.assertEquals(117, GuildProgress.get(player, "cw_home_x"), "Rejected travel overwrote saved home");
        } finally {
            removePlayer(context, player);
        }
        context.complete();
    }

    @GameTest(templateName = EMPTY_STRUCTURE)
    public void landingValidationRejectsFluidsHazardsCeilingsAndPartialBorderFit(TestContext context) {
        var world = context.getWorld();
        BlockPos local = new BlockPos(2, 2, 2);
        BlockPos landing = context.getAbsolutePos(local);
        context.setBlockState(local.down(), Blocks.STONE);
        context.setBlockState(local, Blocks.AIR);
        context.setBlockState(local.up(), Blocks.AIR);
        context.assertTrue(RustwildTravel.safe(world, landing), "Clear solid landing was rejected");
        context.setBlockState(local, Blocks.WATER);
        context.assertFalse(RustwildTravel.safe(world, landing), "Landing accepted water at the player's feet");
        context.setBlockState(local, Blocks.AIR);
        context.setBlockState(local.up(), Blocks.WATER);
        context.assertFalse(RustwildTravel.safe(world, landing), "Landing accepted water at the player's head");
        context.setBlockState(local.up(), Blocks.STONE);
        context.assertFalse(RustwildTravel.safe(world, landing), "Landing accepted a one-block ceiling");
        context.setBlockState(local.up(), Blocks.AIR);
        context.setBlockState(local.down(), Blocks.MAGMA_BLOCK);
        context.assertFalse(RustwildTravel.safe(world, landing), "Landing accepted damaging magma footing");
        context.setBlockState(local.down(), Blocks.STONE);
        for (var hazard : List.of(Blocks.POWDER_SNOW, Blocks.SWEET_BERRY_BUSH, Blocks.FIRE, Blocks.SOUL_FIRE)) {
            context.setBlockState(local.down(), hazard == Blocks.SWEET_BERRY_BUSH ? Blocks.DIRT
                    : hazard == Blocks.SOUL_FIRE ? Blocks.SOUL_SOIL : Blocks.STONE);
            context.setBlockState(local, hazard);
            context.assertFalse(RustwildTravel.safe(world, landing), "Landing accepted hazard " + hazard);
        }
        context.setBlockState(local, Blocks.AIR);
        context.setBlockState(local.down(), Blocks.STONE);
        context.assertTrue(RustwildTravel.safe(world, landing), "Clearing hazards did not restore safe landing");

        // Entire check is synchronous on the server thread; restore the shared border even on failure.
        var border = world.getWorldBorder();
        double oldX = border.getCenterX();
        double oldZ = border.getCenterZ();
        double oldSize = border.getSize();
        double oldTarget = border.getSizeLerpTarget();
        long oldRemaining = border.getSizeLerpTime();
        try {
            border.setCenter(landing.getX() - 4.8, landing.getZ() + .5);
            border.setSize(10);
            context.assertTrue(border.contains(landing), "Fractional-border fixture must contain block origin");
            context.assertFalse(RustwildTravel.safe(world, landing), "Landing accepted a player body crossing the border");
            border.setCenter(landing.getX() + .5, landing.getZ() + .5);
            context.assertTrue(RustwildTravel.safe(world, landing), "Centered player does not fit inside a ten-block border");
        } finally {
            border.setCenter(oldX, oldZ);
            border.setSize(oldSize);
            if (oldRemaining > 0) border.interpolateSize(oldSize, oldTarget, oldRemaining);
        }
        context.complete();
    }

    private static void checkPlacedTemplate(TestContext context, String name) {
        var template = context.getWorld().getStructureTemplateManager().getTemplate(CopperwakeMod.id(name));
        context.assertTrue(template.isPresent(), "Production NBT template missing: " + name);
        var placed = template.orElseThrow();
        var controller = context.getBlockEntity(BlockPos.ORIGIN);
        context.assertTrue(controller instanceof StructureBlockBlockEntity, "GameTest structure controller missing");
        BlockPos offset = ((StructureBlockBlockEntity) controller).getOffset();
        context.assertTrue(placed.getSize().getX() >= 9 && placed.getSize().getZ() >= 9, "Template unexpectedly empty: " + name);
        var barrels = placed.getInfosForBlock(BlockPos.ORIGIN, new StructurePlacementData(), Blocks.BARREL);
        context.assertFalse(barrels.isEmpty(), "Structure has no loot barrels: " + name);
        for (var barrel : barrels) {
            BlockPos position = barrel.pos().add(offset);
            context.expectBlock(Blocks.BARREL, position);
            var entity = context.getBlockEntity(position);
            context.assertTrue(entity instanceof LootableContainerBlockEntity, "Placed barrel lost its block entity: " + name);
            var loot = ((LootableContainerBlockEntity) entity).getLootTable();
            context.assertTrue(loot != null, "Barrel lost its deferred loot table: " + name);
            context.assertTrue(barrel.nbt() != null, "Authored barrel has no loot NBT: " + name);
            context.assertEquals(barrel.nbt().getString("LootTable"), loot.getValue().toString(), "Barrel lost its authored loot table");
            context.assertTrue(context.getWorld().getServer().getReloadableRegistries().getLootTable(loot) != LootTable.EMPTY,
                    "Placed barrel points to unloaded loot: " + name);
        }
        context.assertFalse(context.getBlockState(offset).isAir(), "Structure foundation was not placed: " + name);
    }

    private static BlockPos templateOffset(TestContext context) {
        var controller = context.getBlockEntity(BlockPos.ORIGIN);
        context.assertTrue(controller instanceof StructureBlockBlockEntity, "GameTest structure controller missing");
        return ((StructureBlockBlockEntity) controller).getOffset();
    }

    private static void expectClear(TestContext context, BlockPos feet) {
        context.assertTrue(context.getBlockState(feet).isAir() && context.getBlockState(feet.up()).isAir(),
                "Authored expedition route lost two-block headroom at " + feet);
    }

    private static void checkPersistentGuards(TestContext context, int mites, int sentries) {
        var placedMites = context.getEntities(ConstructRegistry.RUST_MITE);
        var placedSentries = context.getEntities(ConstructRegistry.COIL_SENTRY);
        context.assertEquals(mites, placedMites.size(), "World-generation Rust Mite guard NBT did not spawn");
        context.assertEquals(sentries, placedSentries.size(), "World-generation Coil Sentry guard NBT did not spawn");
        context.assertTrue(placedMites.stream().allMatch(MobEntity::isPersistent) && placedSentries.stream().allMatch(MobEntity::isPersistent),
                "Expedition guards lost their persistence marker");
    }

    private static void checkFiniteCache(TestContext context, BlockPos position,
            int glassMin, int glassMax, int scrapMin, int scrapMax, int gearMin, int gearMax) {
        var entity = context.getBlockEntity(position);
        context.assertTrue(entity instanceof LootableContainerBlockEntity, "Expedition cache was not a placed lootable barrel");
        var barrel = (LootableContainerBlockEntity) entity;
        barrel.setLootTableSeed(72141L);
        barrel.generateLoot(null);
        context.assertTrue(barrel.getLootTable() == null, "Opening a cache did not consume its deferred loot marker");
        var drops = new ArrayList<ItemStack>();
        for (int slot = 0; slot < barrel.size(); slot++) drops.add(barrel.getStack(slot).copy());
        checkLootBounds(context, drops, glassMin, glassMax, scrapMin, scrapMax, gearMin, gearMax);
        for (int slot = 0; slot < barrel.size(); slot++) barrel.removeStack(slot);
        barrel.generateLoot(null);
        context.assertTrue(barrel.isEmpty(), "An emptied cache generated a second reward");
        // Survival-placed barrels have no world-generation marker; a player cannot
        // refresh expedition loot by moving or rebuilding a normal container.
        context.setBlockState(position, Blocks.AIR);
        context.setBlockState(position, Blocks.BARREL);
        var replacement = (LootableContainerBlockEntity) context.getBlockEntity(position);
        context.assertTrue(replacement.getLootTable() == null && replacement.isEmpty(), "Replacing a barrel recreated expedition loot");
    }

    private static void checkLootBounds(TestContext context, List<ItemStack> drops,
            int glassMin, int glassMax, int scrapMin, int scrapMax, int gearMin, int gearMax) {
        int glass = lootCount(drops, ModContent.MEMORY_GLASS);
        int scrap = lootCount(drops, ModContent.SCRAP);
        int gears = lootCount(drops, ModContent.BRASS_GEAR);
        context.assertTrue(glass >= glassMin && glass <= glassMax, "Expedition cache exploration loot is outside its stated bounds");
        context.assertTrue(scrap >= scrapMin && scrap <= scrapMax, "Expedition cache Scrap is outside its stated bounds");
        context.assertTrue(gears >= gearMin && gears <= gearMax, "Expedition cache gears are outside their stated bounds");
        context.assertTrue(lootCount(drops, ModContent.CHARGED_CORE) <= 1, "Expedition cache rolled multiple cores");
        context.assertEquals(0, lootCount(drops, ModContent.FOREMAN_SEAL), "New landmark bypassed the existing boss-summon loop");
        context.assertEquals(0, lootCount(drops, ModContent.FOREMAN_HEART), "New landmark awarded an undefeated boss trophy");
        context.assertTrue(drops.stream().noneMatch(stack -> !stack.isEmpty() && !Registries.ITEM.getId(stack.getItem()).getNamespace().equals("minecraft")
                && !Registries.ITEM.getId(stack.getItem()).getNamespace().equals("copperwake")), "Landmark granted another mod's trial-gated reward");
    }

    private static int lootCount(List<ItemStack> drops, Item item) {
        return drops.stream().filter(stack -> stack.isOf(item)).mapToInt(ItemStack::getCount).sum();
    }

    private static ServerPlayerEntity survivalPlayer(TestContext context) {
        var player = context.createMockCreativeServerPlayerInWorld();
        player.changeGameMode(GameMode.SURVIVAL);
        player.getAbilities().invulnerable = true;
        player.getInventory().clear();
        GuildProgress.put(player, "cw_contracts", 0);
        var position = context.getAbsolutePos(new BlockPos(2, 2, 2));
        player.refreshPositionAndAngles(position.getX() + .5, position.getY(), position.getZ() + .5, 0, 0);
        return player;
    }

    private static void fillRequirements(ServerPlayerEntity player, int completed) {
        ContractCatalog.current(completed).requirements().forEach((id, amount) ->
                player.getInventory().insertStack(new ItemStack(SalvageGuild.requiredItem(id), amount)));
    }

    private static Map<Item, Integer> inventoryCounts(ServerPlayerEntity player) {
        Map<Item, Integer> result = new LinkedHashMap<>();
        for (int slot = 0; slot < player.getInventory().size(); slot++) {
            var stack = player.getInventory().getStack(slot);
            if (!stack.isEmpty()) result.merge(stack.getItem(), stack.getCount(), Integer::sum);
        }
        return result;
    }

    private static void removePlayer(TestContext context, ServerPlayerEntity player) {
        context.getWorld().getServer().getPlayerManager().remove(player);
        player.discard();
    }
}
