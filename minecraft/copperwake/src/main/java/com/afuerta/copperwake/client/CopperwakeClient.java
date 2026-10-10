package com.afuerta.copperwake.client;

import com.afuerta.copperwake.entity.CoilSentryEntity;
import com.afuerta.copperwake.entity.ConstructRegistry;
import com.afuerta.copperwake.entity.FoundryForemanEntity;
import com.afuerta.copperwake.entity.RustMiteEntity;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.rendering.v1.EntityRendererRegistry;
import net.minecraft.client.model.ModelPart;
import net.minecraft.client.render.OverlayTexture;
import net.minecraft.client.render.RenderLayer;
import net.minecraft.client.render.VertexConsumerProvider;
import net.minecraft.client.render.entity.EntityRendererFactory;
import net.minecraft.client.render.entity.MobEntityRenderer;
import net.minecraft.client.render.entity.feature.FeatureRenderer;
import net.minecraft.client.render.entity.feature.FeatureRendererContext;
import net.minecraft.client.render.entity.model.EntityModel;
import net.minecraft.client.util.math.MatrixStack;
import net.minecraft.entity.mob.MobEntity;
import net.minecraft.util.Identifier;

import java.util.function.Function;
import java.util.function.ToIntFunction;

/** All construct geometry and rendering stay behind Fabric's client-only entrypoint. */
public final class CopperwakeClient implements ClientModInitializer {
    private static final Identifier RUST = Identifier.ofVanilla("textures/block/exposed_copper.png");
    private static final Identifier COPPER = Identifier.ofVanilla("textures/block/copper_block.png");
    private static final Identifier PATINA = Identifier.ofVanilla("textures/block/weathered_copper.png");
    private static final Identifier LIGHT = Identifier.ofVanilla("textures/block/shroomlight.png");

    @Override
    public void onInitializeClient() {
        EntityRendererRegistry.register(ConstructRegistry.RUST_MITE, RustMiteRenderer::new);
        EntityRendererRegistry.register(ConstructRegistry.COIL_SENTRY, CoilSentryRenderer::new);
        EntityRendererRegistry.register(ConstructRegistry.FOUNDRY_FOREMAN, ForemanRenderer::new);
    }

    private static final class RustMiteRenderer extends MobEntityRenderer<RustMiteEntity, RustMiteModel> {
        RustMiteRenderer(EntityRendererFactory.Context context) {
            super(context, new RustMiteModel(RustMiteModel.getTexturedModelData().createModel()), 0.4F);
            addFeature(new CoreLight<>(this, RustMiteModel::getLamp,
                    entity -> entity.getAttackWindup() > 0 ? 0xFFFF6030 : 0xFFFFD18A));
        }

        @Override
        public Identifier getTexture(RustMiteEntity entity) {
            return RUST;
        }
    }

    private static final class CoilSentryRenderer extends MobEntityRenderer<CoilSentryEntity, CoilSentryModel> {
        CoilSentryRenderer(EntityRendererFactory.Context context) {
            super(context, new CoilSentryModel(CoilSentryModel.getTexturedModelData().createModel()), 0.5F);
            addFeature(new CoreLight<>(this, CoilSentryModel::getLamp,
                    entity -> entity.getAttackWindup() > 0 ? 0xFFFF7040 : 0xFF90FFE5));
        }

        @Override
        public Identifier getTexture(CoilSentryEntity entity) {
            return PATINA;
        }
    }

    private static final class ForemanRenderer extends MobEntityRenderer<FoundryForemanEntity, FoundryForemanModel> {
        ForemanRenderer(EntityRendererFactory.Context context) {
            super(context, new FoundryForemanModel(FoundryForemanModel.getTexturedModelData().createModel()), 0.9F);
            addFeature(new CoreLight<>(this, FoundryForemanModel::getFurnace,
                    entity -> entity.isEnraged() || entity.getAttackWindup() > 0 ? 0xFFFF5030 : 0xFFFFD080));
        }

        @Override
        public Identifier getTexture(FoundryForemanEntity entity) {
            return COPPER;
        }
    }

    /** A separate full-bright pass lights only the exposed reactor, never the entire body. */
    private static final class CoreLight<T extends MobEntity, M extends EntityModel<T>> extends FeatureRenderer<T, M> {
        private final Function<M, ModelPart> part;
        private final ToIntFunction<T> color;

        CoreLight(FeatureRendererContext<T, M> context, Function<M, ModelPart> part, ToIntFunction<T> color) {
            super(context);
            this.part = part;
            this.color = color;
        }

        @Override
        public void render(MatrixStack matrices, VertexConsumerProvider consumers, int light, T entity,
                           float limbAngle, float limbDistance, float tickDelta, float animationProgress,
                           float headYaw, float headPitch) {
            if (entity.isInvisible()) {
                return;
            }
            part.apply(getContextModel()).render(matrices, consumers.getBuffer(RenderLayer.getEyes(LIGHT)),
                    0xF000F0, OverlayTexture.DEFAULT_UV, color.applyAsInt(entity));
        }
    }
}
