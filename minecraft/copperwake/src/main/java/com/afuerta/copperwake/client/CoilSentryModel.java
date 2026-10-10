package com.afuerta.copperwake.client;

import com.afuerta.copperwake.entity.CoilSentryEntity;
import net.minecraft.client.model.ModelData;
import net.minecraft.client.model.ModelPart;
import net.minecraft.client.model.ModelPartBuilder;
import net.minecraft.client.model.ModelPartData;
import net.minecraft.client.model.ModelTransform;
import net.minecraft.client.model.TexturedModelData;
import net.minecraft.client.render.entity.model.SinglePartEntityModel;
import net.minecraft.util.math.MathHelper;

/** A hovering reactor suspended over a three-legged survey chassis. */
public final class CoilSentryModel extends SinglePartEntityModel<CoilSentryEntity> {
    private final ModelPart root;
    private final ModelPart reactor;
    private final ModelPart rotor;
    private final ModelPart lamp;
    private final ModelPart[] legs;

    public CoilSentryModel(ModelPart root) {
        this.root = root;
        this.reactor = root.getChild("reactor");
        this.rotor = root.getChild("rotor");
        this.lamp = root.getChild("lamp");
        this.legs = new ModelPart[] {root.getChild("left_leg"), root.getChild("right_leg"),
                root.getChild("rear_leg")};
    }

    public static TexturedModelData getTexturedModelData() {
        ModelData data = new ModelData();
        ModelPartData root = data.getRoot();
        root.addChild("reactor", ModelPartBuilder.create().uv(0, 0)
                .cuboid(-4, -5, -4, 8, 2, 8)
                .cuboid(-4, 3, -4, 8, 2, 8)
                .cuboid(-4, -3, -4, 2, 6, 2)
                .cuboid(2, -3, -4, 2, 6, 2)
                .cuboid(-4, -3, 2, 2, 6, 2)
                .cuboid(2, -3, 2, 2, 6, 2)
                .cuboid(-1, -9, -1, 2, 4, 2), ModelTransform.pivot(0, 6, 0));
        root.addChild("lamp", ModelPartBuilder.create().uv(0, 0)
                .cuboid(-2.6F, -2.6F, -2.6F, 5.2F, 5.2F, 5.2F), ModelTransform.pivot(0, 6, 0));
        root.addChild("rotor", ModelPartBuilder.create().uv(0, 0)
                .cuboid(-8, -1, -8, 16, 2, 2)
                .cuboid(-8, -1, 6, 16, 2, 2)
                .cuboid(-8, -1, -6, 2, 2, 12)
                .cuboid(6, -1, -6, 2, 2, 12), ModelTransform.pivot(0, 6, 0));
        root.addChild("chassis", ModelPartBuilder.create().uv(0, 0)
                .cuboid(-4, -2, -4, 8, 4, 8)
                .cuboid(-1, -5, -1, 2, 3, 2), ModelTransform.pivot(0, 15, 0));
        addLeg(root, "left_leg", 3, -2, -0.48F, -0.3F);
        addLeg(root, "right_leg", -3, -2, -0.48F, 0.3F);
        addLeg(root, "rear_leg", 0, 3, 0.55F, 0);
        return TexturedModelData.of(data, 64, 64);
    }

    private static void addLeg(ModelPartData root, String name, float x, float z, float pitch, float roll) {
        ModelPartData leg = root.addChild(name, ModelPartBuilder.create().uv(0, 0)
                .cuboid(-1.5F, 0, -1.5F, 3, 10, 3), ModelTransform.of(x, 15, z, pitch, 0, roll));
        leg.addChild("foot", ModelPartBuilder.create().uv(0, 0)
                .cuboid(-2.5F, -1, -3, 5, 2, 6), ModelTransform.pivot(0, 9, 0));
    }

    @Override
    public ModelPart getPart() {
        return root;
    }

    public ModelPart getLamp() {
        return lamp;
    }

    @Override
    public void setAngles(CoilSentryEntity entity, float limbAngle, float limbDistance,
                          float animationProgress, float headYaw, float headPitch) {
        root.traverse().forEach(ModelPart::resetTransform);
        boolean warning = entity.getAttackWindup() > 0;
        float hover = MathHelper.sin(animationProgress * 0.12F) * 0.8F;
        reactor.pivotY += hover;
        rotor.pivotY += hover;
        lamp.pivotY += hover;
        reactor.yaw = headYaw * MathHelper.RADIANS_PER_DEGREE * 0.65F;
        lamp.yaw = animationProgress * 0.04F;
        rotor.yaw = animationProgress * 0.035F;
        rotor.roll = MathHelper.sin(animationProgress * 0.07F) * 0.12F;
        for (int i = 0; i < legs.length; i++) {
            legs[i].pitch += MathHelper.cos(limbAngle * 0.8F + i * MathHelper.TAU / 3)
                    * Math.min(limbDistance, 1) * 0.32F;
        }
        if (warning) {
            // Ring tilts upright and the reactor expands before firing its shock pulse.
            rotor.pitch = -MathHelper.HALF_PI;
            reactor.pivotY -= 1.5F;
            lamp.pivotY -= 1.5F;
            float pulse = 1.1F + MathHelper.sin(animationProgress * 0.8F) * 0.12F;
            lamp.xScale = pulse;
            lamp.yScale = pulse;
            lamp.zScale = pulse;
        }
    }
}
