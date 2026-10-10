package io.github.afuerta.starfall.client;

import io.github.afuerta.starfall.registry.ModItems;
import net.fabricmc.api.ClientModInitializer;
import net.minecraft.client.item.CompassAnglePredicateProvider;
import net.minecraft.client.item.ModelPredicateProviderRegistry;
import net.minecraft.component.DataComponentTypes;
import net.minecraft.component.type.LodestoneTrackerComponent;
import net.minecraft.util.Identifier;

/** Client-only model registration; dedicated servers never load this entry point. */
public final class StarfallClient implements ClientModInitializer {
    @Override
    public void onInitializeClient() {
        ModelPredicateProviderRegistry.register(ModItems.STAR_COMPASS, Identifier.ofVanilla("angle"),
                new CompassAnglePredicateProvider((world, stack, entity) -> {
                    LodestoneTrackerComponent tracker = stack.get(DataComponentTypes.LODESTONE_TRACKER);
                    // An empty target deliberately uses vanilla's aimless spin. Never use world spawn.
                    return tracker == null ? null : tracker.target().orElse(null);
                }));
    }
}
