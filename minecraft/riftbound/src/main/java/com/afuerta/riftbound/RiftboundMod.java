package com.afuerta.riftbound;

import com.afuerta.riftbound.domain.Aspect;
import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback;
import net.fabricmc.fabric.api.entity.event.v1.ServerLivingEntityEvents;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerEntityEvents;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerLifecycleEvents;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents;
import net.fabricmc.fabric.api.event.player.UseBlockCallback;
import net.fabricmc.fabric.api.itemgroup.v1.FabricItemGroup;
import net.minecraft.block.AbstractBlock;
import net.minecraft.block.Block;
import net.minecraft.entity.Entity;
import net.minecraft.entity.mob.HostileEntity;
import net.minecraft.item.BlockItem;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.item.tooltip.TooltipType;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.registry.RegistryKey;
import net.minecraft.registry.RegistryKeys;
import net.minecraft.registry.tag.BiomeTags;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.sound.BlockSoundGroup;
import net.minecraft.text.Text;
import net.minecraft.util.ActionResult;
import net.minecraft.util.Hand;
import net.minecraft.util.Identifier;
import net.minecraft.world.World;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

public final class RiftboundMod implements ModInitializer {
    public static final String ID = "riftbound";
    public static final Logger LOGGER = LoggerFactory.getLogger(ID);
    public static final String TRIAL_MOB_TAG = "riftbound_trial";
    public static final Map<Aspect, Item> ECHOES = new EnumMap<>(Aspect.class);
    public static final Item RESONANCE = item("resonance_shard", 64);
    public static final Item DORMANT_RELIC = item("dormant_relic", 1);
    public static final Item WAYFARER = item("wayfarer_relic", 1);
    public static final Item BULWARK = item("bulwark_relic", 1);
    public static final Item HARVESTER = item("harvester_relic", 1);
    public static final Block ANCHOR = Registry.register(Registries.BLOCK, id("rift_anchor"),
            new Block(AbstractBlock.Settings.create().strength(4.0f, 1200.0f).requiresTool()
                    .sounds(BlockSoundGroup.AMETHYST_BLOCK).luminance(state -> 7)));
    public static final Item ANCHOR_ITEM = Registry.register(Registries.ITEM, id("rift_anchor"),
            new BlockItem(ANCHOR, new Item.Settings()) {
                @Override public void appendTooltip(ItemStack stack, TooltipContext context,
                                                    List<Text> tooltip, TooltipType type) {
                    tooltip.add(Text.translatable("tooltip.riftbound.rift_anchor"));
                }
            });
    public static final TrialManager TRIALS = new TrialManager();

    public static Identifier id(String path) { return Identifier.of(ID, path); }

    private static Item item(String path, int stackSize) {
        return Registry.register(Registries.ITEM, id(path), new Item(new Item.Settings().maxCount(stackSize)) {
            @Override public void appendTooltip(ItemStack stack, TooltipContext context,
                                                List<Text> tooltip, TooltipType type) {
                tooltip.add(Text.translatable("tooltip.riftbound." + path));
            }
        });
    }

    public static Aspect aspectOf(ItemStack stack) {
        for (var entry : ECHOES.entrySet()) if (stack.isOf(entry.getValue())) return entry.getKey();
        return null;
    }

    @Override public void onInitialize() {
        for (Aspect aspect : Aspect.values()) {
            ECHOES.put(aspect, item(aspect.name().toLowerCase(java.util.Locale.ROOT) + "_echo", 64));
        }
        Registry.register(Registries.ITEM_GROUP, id("relics"), FabricItemGroup.builder()
                .displayName(Text.translatable("itemGroup.riftbound"))
                .icon(() -> new ItemStack(ANCHOR_ITEM))
                .entries((context, entries) -> {
                    ECHOES.values().forEach(entries::add);
                    entries.add(ANCHOR_ITEM); entries.add(RESONANCE); entries.add(DORMANT_RELIC);
                    entries.add(WAYFARER); entries.add(BULWARK); entries.add(HARVESTER);
                }).build());

        UseBlockCallback.EVENT.register((player, world, hand, hit) -> {
            if (hand != Hand.MAIN_HAND || !world.getBlockState(hit.getBlockPos()).isOf(ANCHOR)) {
                return ActionResult.PASS;
            }
            if (!world.isClient && player instanceof ServerPlayerEntity serverPlayer) {
                TRIALS.useAnchor(serverPlayer, hit.getBlockPos());
            }
            return ActionResult.SUCCESS;
        });
        CommandRegistrationCallback.EVENT.register((dispatcher, registry, environment) ->
                RiftboundCommands.register(dispatcher));
        ServerTickEvents.END_SERVER_TICK.register(TRIALS::tick);
        ServerLifecycleEvents.SERVER_STOPPING.register(TRIALS::stop);
        ServerLifecycleEvents.SERVER_STARTED.register(TRIALS::initialize);
        // Active trials are deliberately not resumed after a restart. Clean up persistent
        // trial mobs as their chunks load, including chunks absent during shutdown.
        ServerEntityEvents.ENTITY_LOAD.register((entity, world) -> {
            if (entity.getCommandTags().contains(TRIAL_MOB_TAG) && !TRIALS.isManagedMob(entity.getUuid())) {
                entity.discard();
            }
        });
        ServerLivingEntityEvents.AFTER_DEATH.register((entity, source) -> {
            TRIALS.onDeath(entity);
            Entity attacker = source.getAttacker();
            if (entity instanceof HostileEntity && attacker instanceof ServerPlayerEntity player
                    && !entity.getCommandTags().contains(TRIAL_MOB_TAG)
                    && !player.isCreative() && entity.getWorld() instanceof ServerWorld world
                    && world.random.nextFloat() < 0.18f) {
                Aspect aspect = classify(world, entity.getBlockPos());
                entity.dropStack(new ItemStack(ECHOES.get(aspect)));
            }
        });
        ServerLivingEntityEvents.MOB_CONVERSION.register(TRIALS::onConversion);
        LOGGER.info("Riftbound: Wild Resonance 0.1 initialized");
    }

    private static Aspect classify(ServerWorld world, net.minecraft.util.math.BlockPos pos) {
        if (world.getRegistryKey().equals(World.NETHER)) return Aspect.EMBER;
        if (pos.getY() < 0) return Aspect.HOLLOW;
        var biome = world.getBiome(pos);
        if (biome.isIn(BiomeTags.IS_OCEAN) || biome.isIn(BiomeTags.IS_RIVER)) return Aspect.TIDAL;
        if (biome.isIn(BiomeTags.IS_BADLANDS) || biome.matchesKey(RegistryKey.of(RegistryKeys.BIOME,
                Identifier.ofVanilla("desert")))) return Aspect.EMBER;
        return Aspect.VERDANT;
    }
}
