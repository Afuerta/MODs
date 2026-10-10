package com.afuerta.copperwake.client;

import com.afuerta.copperwake.entity.RustMiteEntity;
import net.minecraft.client.model.ModelData;
import net.minecraft.client.model.ModelPart;
import net.minecraft.client.model.ModelPartBuilder;
import net.minecraft.client.model.ModelPartData;
import net.minecraft.client.model.ModelTransform;
import net.minecraft.client.model.TexturedModelData;
import net.minecraft.client.render.entity.model.SinglePartEntityModel;
import net.minecraft.util.math.MathHelper;

/** A low, scuttling scrap construct with four hinged legs and a copper carapace. */
public final class RustMiteModel extends SinglePartEntityModel<RustMiteEntity> {
    private final ModelPart root;
    private final ModelPart shell;
    private final ModelPart lamp;
    private final ModelPart[] legs;
    private final ModelPart leftMandible;
    private final ModelPart rightMandible;

    public RustMiteModel(ModelPart root) {
        this.root = root;
        this.shell = root.getChild("shell");
        this.lamp = root.getChild("lamp");
        this.legs = new ModelPart[] {root.getChild("front_left"), root.getChild("front_right"),
                root.getChild("back_left"), root.getChild("back_right")};
        this.leftMandible = root.getChild("left_mandible");
        this.rightMandible = root.getChild("right_mandible");
    }

    public static TexturedModelData getTexturedModelData() {
        ModelData data = new ModelData();
        ModelPartData root = data.getRoot();
        root.addChild("shell", ModelPartBuilder.create().uv(0, 0)
                .cuboid(-5, -4, -6, 10, 6, 12)
                .uv(0, 22).cuboid(-3, -6, -3, 6, 2, 7)
                .uv(0, 0).cuboid(-4, -2, -9, 8, 4, 3), ModelTransform.pivot(0, 18, 0));
        root.addChild("lamp", ModelPartBuilder.create().uv(0, 0)
                .cuboid(-3, -1, -0.15F, 2, 2, 1)
                .cuboid(1, -1, -0.15F, 2, 2, 1), ModelTransform.pivot(0, 16.5F, -9));
        root.addChild("left_mandible", ModelPartBuilder.create().uv(0, 0)
                .cuboid(0, 0, -4, 2, 2, 5), ModelTransform.pivot(2.5F, 19, -7));
        root.addChild("right_mandible", ModelPartBuilder.create().uv(0, 0)
                .cuboid(-2, 0, -4, 2, 2, 5), ModelTransform.pivot(-2.5F, 19, -7));
        addLeg(root, "front_left", 4, -4, 1);
        addLeg(root, "front_right", -4, -4, -1);
        addLeg(root, "back_left", 4, 4, 1);
        addLeg(root, "back_right", -4, 4, -1);
        return TexturedModelData.of(data, 64, 64);
    }

    private static void addLeg(ModelPartData root, String name, float x, float z, int side) {
        ModelPartData leg = root.addChild(name, ModelPartBuilder.create().uv(0, 0)
                        .cuboid(side > 0 ? 0 : -5, -1, -1, 5, 2, 2),
                ModelTransform.pivot(x, 19, z));
        leg.addChild("foot", ModelPartBuilder.create().uv(0, 0)
                        .cuboid(-1, -1, -1, 2, 6, 2),
                ModelTransform.of(side * 4, 0, 0, 0, 0, side * -0.3F));
    }

    @Override
    public ModelPart getPart() {
        return root;
    }

    public ModelPart getLamp() {
        return lamp;
    }

    @Override
    public void setAngles(RustMiteEntity entity, float limbAngle, float limbDistance,
                          float animationProgress, float headYaw, float headPitch) {
        root.traverse().forEach(ModelPart::resetTransform);
        float stride = Math.min(limbDistance, 1.0F);
        for (int i = 0; i < legs.length; i++) {
            float phase = limbAngle * 1.5F + ((i == 0 || i == 3) ? 0 : MathHelper.PI);
            int side = i % 2 == 0 ? 1 : -1;
            legs[i].yaw = MathHelper.cos(phase) * stride * 0.55F;
            legs[i].roll = side * (0.12F + MathHelper.sin(phase) * stride * 0.25F);
        }
        float bob = MathHelper.sin(animationProgress * 0.2F) * 0.25F;
        shell.pivotY += bob;
        lamp.pivotY += bob;
        float warning = entity.getAttackWindup() > 0 ? 1.0F : 0.0F;
        shell.pitch = -warning * 0.16F;
        leftMandible.yaw = -0.12F - warning * 0.5F;
        rightMandible.yaw = 0.12F + warning * 0.5F;
        if (warning > 0) {
            // The spread jaws and raised front pair make the lunge readable without particles.
            legs[0].pitch = -0.55F;
            legs[1].pitch = -0.55F;
            lamp.pivotY -= 0.65F;
        }
    }
}
