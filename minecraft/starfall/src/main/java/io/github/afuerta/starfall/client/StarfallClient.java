package io.github.afuerta.starfall.client;

import io.github.afuerta.starfall.registry.ModItems;
import net.fabricmc.api.ClientModInitializer;
import net.minecraft.client.item.CompassAnglePredicateProvider;
import net.minecraft.client.item.ModelPredicateProviderRegistry;
import net.minecraft.component.DataComponentTypes;
import net.minecraft.util.Identifier;

/** Loaded only from the client entrypoint. Compass direction uses vanilla's lodestone renderer. */
public final class StarfallClient implements ClientModInitializer {
    @Override public void onInitializeClient() {
        ModelPredicateProviderRegistry.register(ModItems.STAR_COMPASS, Identifier.ofVanilla("angle"),
                new CompassAnglePredicateProvider((world, stack, entity) -> {
                    var tracker = stack.get(DataComponentTypes.LODESTONE_TRACKER);
                    return tracker == null ? null : tracker.target().orElse(null);
                }));
    }
}
