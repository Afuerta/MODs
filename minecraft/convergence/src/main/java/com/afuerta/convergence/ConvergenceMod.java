package com.afuerta.convergence;

import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents;
import net.fabricmc.fabric.api.itemgroup.v1.FabricItemGroup;
import net.fabricmc.fabric.api.object.builder.v1.block.entity.FabricBlockEntityTypeBuilder;
import net.minecraft.block.AbstractBlock;
import net.minecraft.block.Blocks;
import net.minecraft.block.entity.BlockEntityType;
import net.minecraft.entity.effect.StatusEffectInstance;
import net.minecraft.entity.effect.StatusEffects;
import net.minecraft.item.Item;
import net.minecraft.item.BlockItem;
import net.minecraft.item.ItemStack;
import net.minecraft.item.tooltip.TooltipType;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;
import net.minecraft.util.Identifier;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** The Fabric bridge only uses public registries and vanilla persisted scores of the three mods. */
public final class ConvergenceMod implements ModInitializer {
    public static final String MOD_ID = "convergence";
    private static final Map<String, Item> ITEMS = new LinkedHashMap<>();
    public static final Item ATTUNEMENT_CORE = item("attunement_core", 1);
    public static final Item CONCORDANCE = item("concordance", 64);
    public static final Item FILAMENT = item("confluence_filament", 64);
    public static final Item FOCUS = item("tempered_focus", 64);
    public static final Item MATRIX = item("harmonic_matrix", 64);
    public static final Item ASTRAL_LENS = item("astral_lens", 1);
    public static final Item STORMWARD_SIGIL = item("stormward_sigil", 1);
    public static final Item EXPEDITION_HARNESS = item("expedition_harness", 1);
    public static final Item FIELD_ATLAS = gadget("field_atlas", ExpeditionGadget.Action.ATLAS);
    public static final Item TRIUNE_PULSE = gadget("triune_pulse", ExpeditionGadget.Action.PULSE);
    public static final Item MENDER_COIL = gadget("mender_coil", ExpeditionGadget.Action.REPAIR);
    public static final AstralInfusionBlock ASTRAL_INFUSER = Registry.register(Registries.BLOCK, id("astral_infuser"),
            new AstralInfusionBlock(AbstractBlock.Settings.copy(Blocks.SMITHING_TABLE).strength(3.5f).requiresTool()
                    .luminance(state -> state.get(AstralInfusionBlock.ACTIVE) ? 6 : 0)));
    public static final BlockEntityType<AstralInfusionBlockEntity> INFUSION_ENTITY = Registry.register(Registries.BLOCK_ENTITY_TYPE,
            id("astral_infuser"), FabricBlockEntityTypeBuilder.create(AstralInfusionBlockEntity::new, ASTRAL_INFUSER).build());
    public static final Item ASTRAL_INFUSER_ITEM = register("astral_infuser", new BlockItem(ASTRAL_INFUSER, new Item.Settings()) {
        @Override public void appendTooltip(ItemStack stack, TooltipContext context, List<Text> tooltip, TooltipType type) {
            tooltip.add(Text.translatable("tooltip.convergence.astral_infuser"));
        }
    });

    public static Identifier id(String path) { return Identifier.of(MOD_ID, path); }

    @Override public void onInitialize() {
        Registry.register(Registries.ITEM_GROUP, id("expeditions"), FabricItemGroup.builder()
                .displayName(Text.translatable("itemGroup.convergence"))
                .icon(() -> new ItemStack(FIELD_ATLAS))
                .entries((context, entries) -> ITEMS.values().forEach(entries::add)).build());
        CommandRegistrationCallback.EVENT.register((dispatcher, registryAccess, environment) -> ConvergenceCommands.register(dispatcher));
        ServerTickEvents.END_SERVER_TICK.register(server -> {
            if (server.getTicks() % 20 != 0) return;
            for (ServerPlayerEntity player : server.getPlayerManager().getPlayerList()) applyOffhand(player);
        });
    }

    static void applyOffhand(ServerPlayerEntity player) {
        if (!player.isAlive() || player.isSpectator() || player.isCreative()) return;
        ItemStack stack = player.getOffHandStack();
        if (stack.isOf(ASTRAL_LENS)) {
            player.addStatusEffect(new StatusEffectInstance(StatusEffects.NIGHT_VISION, 260, 0, true, false, true));
        } else if (stack.isOf(STORMWARD_SIGIL)) {
            player.addStatusEffect(new StatusEffectInstance(StatusEffects.FIRE_RESISTANCE, 40, 0, true, false, true));
            player.addStatusEffect(new StatusEffectInstance(StatusEffects.WATER_BREATHING, 40, 0, true, false, true));
        } else if (stack.isOf(EXPEDITION_HARNESS)) {
            player.addStatusEffect(new StatusEffectInstance(StatusEffects.SPEED, 40, 0, true, false, true));
            player.addStatusEffect(new StatusEffectInstance(StatusEffects.JUMP_BOOST, 40, 1, true, false, true));
            player.addStatusEffect(new StatusEffectInstance(StatusEffects.SLOW_FALLING, 40, 0, true, false, true));
        }
    }

    private static Item item(String name, int maxCount) {
        return register(name, new Item(new Item.Settings().maxCount(maxCount)) {
            @Override public void appendTooltip(ItemStack stack, TooltipContext context, List<Text> tooltip, TooltipType type) {
                tooltip.add(Text.translatable("tooltip.convergence." + name));
            }
        });
    }

    private static Item gadget(String name, ExpeditionGadget.Action action) {
        return register(name, new ExpeditionGadget(new Item.Settings().maxCount(1), name, action));
    }

    private static Item register(String name, Item item) {
        ITEMS.put(name, item);
        return Registry.register(Registries.ITEM, id(name), item);
    }
}
