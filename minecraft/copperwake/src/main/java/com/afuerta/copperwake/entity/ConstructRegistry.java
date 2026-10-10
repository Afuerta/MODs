package com.afuerta.copperwake.entity;

import net.fabricmc.fabric.api.object.builder.v1.entity.FabricEntityTypeBuilder;
import net.minecraft.entity.EntityDimensions;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.SpawnGroup;
import net.minecraft.entity.SpawnLocationTypes;
import net.minecraft.entity.mob.HostileEntity;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;
import net.minecraft.world.Heightmap;

/** Copperwake's own constructs; no overwrites of vanilla entities or spawn tables. */
public final class ConstructRegistry {
    public static final EntityType<RustMiteEntity> RUST_MITE = Registry.register(
            Registries.ENTITY_TYPE, Identifier.of("copperwake", "rust_mite"),
            FabricEntityTypeBuilder.<RustMiteEntity>createMob()
                    .spawnGroup(SpawnGroup.MONSTER).entityFactory(RustMiteEntity::new)
                    .dimensions(EntityDimensions.fixed(1.0F, 0.65F))
                    .defaultAttributes(RustMiteEntity::createAttributes)
                    .spawnRestriction(SpawnLocationTypes.ON_GROUND,
                            Heightmap.Type.MOTION_BLOCKING_NO_LEAVES, HostileEntity::canSpawnInDark)
                    .trackRangeBlocks(64).trackedUpdateRate(2).build());

    public static final EntityType<CoilSentryEntity> COIL_SENTRY = Registry.register(
            Registries.ENTITY_TYPE, Identifier.of("copperwake", "coil_sentry"),
            FabricEntityTypeBuilder.<CoilSentryEntity>createMob()
                    .spawnGroup(SpawnGroup.MONSTER).entityFactory(CoilSentryEntity::new)
                    .dimensions(EntityDimensions.fixed(1.1F, 1.6F))
                    .defaultAttributes(CoilSentryEntity::createAttributes)
                    .spawnRestriction(SpawnLocationTypes.ON_GROUND,
                            Heightmap.Type.MOTION_BLOCKING_NO_LEAVES, HostileEntity::canSpawnInDark)
                    .trackRangeBlocks(64).trackedUpdateRate(2).build());

    public static final EntityType<FoundryForemanEntity> FOUNDRY_FOREMAN = Registry.register(
            Registries.ENTITY_TYPE, Identifier.of("copperwake", "foundry_foreman"),
            FabricEntityTypeBuilder.<FoundryForemanEntity>createMob()
                    .spawnGroup(SpawnGroup.MONSTER).entityFactory(FoundryForemanEntity::new)
                    .dimensions(EntityDimensions.fixed(2.3F, 2.8F))
                    .defaultAttributes(FoundryForemanEntity::createAttributes)
                    .fireImmune().trackRangeBlocks(96).trackedUpdateRate(2).build());

    private ConstructRegistry() {}

    public static void initialize() {
        // Static registration is deliberately isolated behind the common entrypoint call.
    }
}
