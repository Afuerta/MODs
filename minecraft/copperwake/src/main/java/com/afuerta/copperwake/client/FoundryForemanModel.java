package com.afuerta.copperwake.client;

import com.afuerta.copperwake.entity.FoundryForemanEntity;
import net.minecraft.client.model.Dilation;
import net.minecraft.client.model.ModelData;
import net.minecraft.client.model.ModelPart;
import net.minecraft.client.model.ModelPartBuilder;
import net.minecraft.client.model.ModelPartData;
import net.minecraft.client.model.ModelTransform;
import net.minecraft.client.model.TexturedModelData;
import net.minecraft.client.render.entity.model.SinglePartEntityModel;
import net.minecraft.util.math.MathHelper;

/** A walking blast furnace assembled from broad plates, exposed pistons and hammer fists. */
public final class FoundryForemanModel extends SinglePartEntityModel<FoundryForemanEntity> {
    private final ModelPart root;
    private final ModelPart body;
    private final ModelPart head;
    private final ModelPart leftArm;
    private final ModelPart rightArm;
    private final ModelPart leftLeg;
    private final ModelPart rightLeg;
    private final ModelPart furnace;

    public FoundryForemanModel(ModelPart root) {
        this.root = root;
        this.body = root.getChild("body");
        this.head = body.getChild("head");
        this.leftArm = body.getChild("left_arm");
        this.rightArm = body.getChild("right_arm");
        this.leftLeg = root.getChild("left_leg");
        this.rightLeg = root.getChild("right_leg");
        this.furnace = root.getChild("furnace");
    }

    public static TexturedModelData getTexturedModelData() {
        ModelData data = new ModelData();
        ModelPartData root = data.getRoot();
        ModelPartData body = root.addChild("body", ModelPartBuilder.create()
                .uv(0, 0).cuboid(-10.0F, -4.0F, -6.0F, 20.0F, 17.0F, 12.0F)
                // Separate breastplate and waist bands give the furnace a layered silhouette.
                .uv(0, 30).cuboid(-11.0F, -5.0F, -7.0F, 22.0F, 3.0F, 13.0F,
                        Dilation.NONE, 1.125F, 1.0F)
                .uv(0, 0).cuboid(-11.0F, 9.0F, -7.0F, 22.0F, 4.0F, 13.0F,
                        Dilation.NONE, 1.125F, 1.0F)
                .uv(0, 22).cuboid(-7.0F, 13.0F, -4.5F, 14.0F, 2.0F, 9.0F)
                // Core surround, with real gaps between the protective grille bars.
                .uv(0, 0).cuboid(-6.0F, -2.5F, -7.2F, 2.0F, 9.0F, 1.5F)
                .uv(0, 0).cuboid(4.0F, -2.5F, -7.2F, 2.0F, 9.0F, 1.5F)
                .uv(0, 0).cuboid(-4.0F, -2.5F, -7.2F, 8.0F, 1.5F, 1.5F)
                .uv(0, 0).cuboid(-4.0F, 5.0F, -7.2F, 8.0F, 1.5F, 1.5F)
                .uv(0, 0).cuboid(-2.75F, -1.0F, -7.0F, 1.0F, 6.0F, 1.0F)
                .uv(0, 0).cuboid(-0.5F, -1.0F, -7.0F, 1.0F, 6.0F, 1.0F)
                .uv(0, 0).cuboid(1.75F, -1.0F, -7.0F, 1.0F, 6.0F, 1.0F)
                // Rear boiler and its broad lower coupling.
                .uv(0, 0).cuboid(-7.0F, -3.0F, 5.0F, 14.0F, 13.0F, 4.0F)
                .uv(0, 0).cuboid(-8.0F, 1.0F, 8.0F, 16.0F, 2.0F, 2.0F),
                ModelTransform.pivot(0.0F, -4.0F, 0.0F));

        // Kept at root level so an emissive feature can draw only the open furnace core.
        root.addChild("furnace", ModelPartBuilder.create()
                .uv(0, 0).cuboid(-4.0F, -1.0F, -6.65F, 8.0F, 6.0F, 0.5F),
                ModelTransform.pivot(0.0F, -4.0F, 0.0F));

        body.addChild("head", ModelPartBuilder.create()
                .uv(0, 0).cuboid(-5.0F, -7.0F, -4.5F, 10.0F, 9.0F, 9.0F)
                .uv(0, 18).cuboid(-6.0F, -7.0F, -5.5F, 12.0F, 3.0F, 10.0F)
                // The recessed visor sits beneath the overhanging brow.
                .uv(0, 0).cuboid(-5.5F, -2.0F, -5.5F, 11.0F, 3.0F, 1.5F)
                .uv(0, 0).cuboid(-5.5F, -4.0F, -5.5F, 2.0F, 2.0F, 1.5F)
                .uv(0, 0).cuboid(3.5F, -4.0F, -5.5F, 2.0F, 2.0F, 1.5F)
                .uv(0, 0).cuboid(-1.0F, -4.0F, -5.6F, 2.0F, 2.0F, 1.5F)
                .uv(0, 0).cuboid(-3.5F, 1.0F, -3.5F, 7.0F, 3.0F, 7.0F),
                ModelTransform.pivot(0.0F, -10.0F, 0.0F));

        // Twin open stacks rise behind the helmet without exceeding its overall height.
        addChimney(body, "left_stack", 6.0F);
        addChimney(body, "right_stack", -6.0F);
        addArm(body, "left_arm", 1.0F);
        addArm(body, "right_arm", -1.0F);
        addLeg(root, "left_leg", 5.5F);
        addLeg(root, "right_leg", -5.5F);
        return TexturedModelData.of(data, 64, 64);
    }

    private static void addChimney(ModelPartData body, String name, float x) {
        body.addChild(name, ModelPartBuilder.create()
                .uv(0, 0).cuboid(-2.0F, -13.0F, -2.0F, 4.0F, 13.0F, 4.0F)
                .uv(0, 0).cuboid(-3.0F, -14.0F, -3.0F, 6.0F, 2.0F, 1.0F)
                .uv(0, 0).cuboid(-3.0F, -14.0F, 2.0F, 6.0F, 2.0F, 1.0F)
                .uv(0, 0).cuboid(-3.0F, -14.0F, -2.0F, 1.0F, 2.0F, 4.0F)
                .uv(0, 0).cuboid(2.0F, -14.0F, -2.0F, 1.0F, 2.0F, 4.0F)
                .uv(0, 0).cuboid(-2.5F, -8.0F, -2.5F, 5.0F, 2.0F, 5.0F),
                ModelTransform.pivot(x, -2.0F, 6.0F));
    }

    private static void addArm(ModelPartData body, String name, float side) {
        body.addChild(name, ModelPartBuilder.create()
                // Overhanging shoulder cap, then a narrow upper piston assembly.
                .uv(0, 0).cuboid(-5.0F, -3.0F, -5.5F, 10.0F, 6.0F, 11.0F)
                .uv(0, 0).cuboid(-4.0F, -4.5F, -4.5F, 8.0F, 2.0F, 9.0F)
                .uv(0, 0).cuboid(-3.0F, 2.0F, -3.0F, 6.0F, 9.0F, 6.0F)
                .uv(0, 0).cuboid(-4.0F, 3.0F, -1.0F, 1.5F, 8.0F, 2.0F)
                .uv(0, 0).cuboid(2.5F, 3.0F, -1.0F, 1.5F, 8.0F, 2.0F)
                .uv(0, 0).cuboid(-3.5F, 9.0F, -3.5F, 7.0F, 3.0F, 7.0F)
                // Hammer gauntlet with a thick face and stepped knuckles.
                .uv(0, 0).cuboid(-4.5F, 11.0F, -4.5F, 9.0F, 9.0F, 9.0F)
                .uv(0, 0).cuboid(-5.0F, 12.0F, -5.0F, 10.0F, 2.0F, 10.0F)
                .uv(0, 0).cuboid(-4.0F, 18.0F, -5.5F, 8.0F, 3.0F, 2.0F)
                .uv(0, 0).cuboid(-3.0F, 14.0F, -5.5F, 2.0F, 3.0F, 1.0F)
                .uv(0, 0).cuboid(1.0F, 14.0F, -5.5F, 2.0F, 3.0F, 1.0F),
                ModelTransform.pivot(side * 14.0F, -3.0F, 0.0F));
    }

    private static void addLeg(ModelPartData root, String name, float x) {
        root.addChild(name, ModelPartBuilder.create()
                .uv(0, 0).cuboid(-3.5F, 0.0F, -3.5F, 7.0F, 8.0F, 7.0F)
                .uv(0, 0).cuboid(-4.0F, 5.0F, -5.0F, 8.0F, 4.0F, 2.0F)
                .uv(0, 0).cuboid(-3.0F, 7.0F, -3.0F, 6.0F, 6.0F, 6.0F)
                .uv(0, 0).cuboid(-4.0F, 8.0F, -1.0F, 1.0F, 4.0F, 2.0F)
                .uv(0, 0).cuboid(3.0F, 8.0F, -1.0F, 1.0F, 4.0F, 2.0F)
                // Feet end at y=24 and project forward like heavy casting molds.
                .uv(0, 0).cuboid(-4.5F, 12.0F, -6.0F, 9.0F, 3.0F, 10.0F)
                .uv(0, 0).cuboid(-4.0F, 10.5F, -4.5F, 8.0F, 2.0F, 8.0F),
                ModelTransform.pivot(x, 9.0F, 0.0F));
    }

    @Override
    public ModelPart getPart() {
        return root;
    }

    public ModelPart getFurnace() {
        return furnace;
    }

    @Override
    public void setAngles(FoundryForemanEntity entity, float limbAngle, float limbDistance,
                          float animationProgress, float headYaw, float headPitch) {
        root.traverse().forEach(ModelPart::resetTransform);
        boolean enraged = entity.isEnraged();
        float stride = limbAngle * 0.55F;
        float movement = Math.min(limbDistance, 1.0F);
        float pace = enraged ? 0.9F : 0.7F;
        leftLeg.pitch = MathHelper.cos(stride) * movement * pace;
        rightLeg.pitch = MathHelper.cos(stride + MathHelper.PI) * movement * pace;
        leftArm.pitch = MathHelper.cos(stride + MathHelper.PI) * movement * 0.45F;
        rightArm.pitch = MathHelper.cos(stride) * movement * 0.45F;
        leftArm.roll = -0.06F;
        rightArm.roll = 0.06F;
        body.roll = MathHelper.cos(stride) * movement * 0.035F;
        body.pivotY += MathHelper.sin(stride * 2.0F) * movement * 0.35F;
        head.yaw = MathHelper.clamp(headYaw, -55.0F, 55.0F) * MathHelper.RADIANS_PER_DEGREE;
        head.pitch = MathHelper.clamp(headPitch, -25.0F, 30.0F) * MathHelper.RADIANS_PER_DEGREE;

        if (enraged) {
            // A slight boiling tremor makes the second phase readable even while stationary.
            body.pitch = 0.045F;
            leftArm.roll -= MathHelper.sin(animationProgress * 1.7F) * 0.022F;
            rightArm.roll += MathHelper.sin(animationProgress * 1.7F) * 0.022F;
        }

        int windup = entity.getAttackWindup();
        if (windup > 0) {
            float duration = enraged ? 23.0F : 32.0F;
            float charge = 1.0F - MathHelper.clamp(windup / duration, 0.0F, 1.0F);
            float lift = MathHelper.sin(charge * MathHelper.HALF_PI);
            leftArm.pitch = -1.0F - lift * 1.65F;
            rightArm.pitch = -1.0F - lift * 1.65F;
            leftArm.roll = -0.2F;
            rightArm.roll = 0.2F;
            body.pitch = -0.08F * lift;
            body.roll = 0.0F;
            head.pitch = 0.16F * lift;
            leftLeg.pitch *= 0.2F;
            rightLeg.pitch *= 0.2F;
        } else if (handSwingProgress > 0.0F) {
            float slam = MathHelper.sin(handSwingProgress * MathHelper.PI);
            leftArm.pitch = -0.6F - slam * 0.65F;
            rightArm.pitch = -0.6F - slam * 0.65F;
            body.pitch = slam * 0.2F;
        }

        // The separate emissive part must follow every torso rotation and translation exactly.
        furnace.copyTransform(body);
    }
}
