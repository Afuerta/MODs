package com.afuerta.convergence;

import com.afuerta.convergence.domain.InfusionCatalog;
import net.minecraft.block.Block;
import net.minecraft.block.BlockState;
import net.minecraft.block.entity.BlockEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.entity.player.PlayerInventory;
import net.minecraft.inventory.Inventories;
import net.minecraft.inventory.SidedInventory;
import net.minecraft.item.ItemStack;
import net.minecraft.nbt.NbtCompound;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.registry.Registries;
import net.minecraft.registry.RegistryWrapper;
import net.minecraft.screen.NamedScreenHandlerFactory;
import net.minecraft.screen.ScreenHandler;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.sound.SoundCategory;
import net.minecraft.sound.SoundEvents;
import net.minecraft.text.Text;
import net.minecraft.util.Identifier;
import net.minecraft.util.collection.DefaultedList;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.Direction;
import net.minecraft.world.Heightmap;
import net.minecraft.world.World;

/** At most four recipe checks, nine slots and one sky-column check per second. */
public final class AstralInfusionBlockEntity extends BlockEntity implements SidedInventory, NamedScreenHandlerFactory {
    static final int FIRST_OUTPUT = 7;
    private static final int[] INPUT_SLOTS = {0, 1, 2, 3, 4, 5, 6};
    private static final int[] OUTPUT_SLOTS = {7, 8};
    private DefaultedList<ItemStack> stacks = DefaultedList.ofSize(9, ItemStack.EMPTY);
    private int progress;
    private String recipeId = "";
    private String status = "incomplete";
    public AstralInfusionBlockEntity(BlockPos pos, BlockState state) { super(ConvergenceMod.INFUSION_ENTITY, pos, state); }

    public static void tick(World world, BlockPos pos, BlockState state, AstralInfusionBlockEntity station) {
        if (world.getTime() % 20 == 0) station.processStep();
    }
    /** Server-thread transaction: no inputs change until output capacity and every ingredient are validated. */
    void processStep() {
        if (!(world instanceof ServerWorld server)) return;
        InfusionCatalog.Infusion recipe = matchingRecipe();
        boolean changed = false;
        if (recipe == null) {
            changed = progress != 0 || !recipeId.isEmpty();
            progress = 0; recipeId = ""; status = stacks.get(7).isEmpty() && stacks.get(8).isEmpty() ? "incomplete" : "ready";
        } else {
            if (!recipe.id().equals(recipeId)) { recipeId = recipe.id(); progress = 0; changed = true; }
            int output = outputSlot(recipe);
            if (output < 0) status = "full";
            else if (!clearNight(server)) status = "night";
            else {
                status = "working";
                progress = Math.min(InfusionCatalog.DURATION, progress + 20);
                changed = true;
                if (progress == InfusionCatalog.DURATION) {
                    // All work happens on the server thread, and matchingRecipe/outputSlot already
                    // preflighted this exact inventory immediately before the first mutation.
                    for (int slot = 0; slot < InfusionCatalog.INPUTS; slot++) {
                        var ingredient = recipe.ingredients().get(slot);
                        if (ingredient != null) stacks.get(slot).decrement(ingredient.count());
                    }
                    ItemStack result = new ItemStack(Registries.ITEM.get(Identifier.of(recipe.output())));
                    if (stacks.get(output).isEmpty()) stacks.set(output, result);
                    else stacks.get(output).increment(result.getCount());
                    progress = 0; recipeId = ""; status = "ready";
                    server.playSound(null, pos, SoundEvents.BLOCK_AMETHYST_BLOCK_CHIME, SoundCategory.BLOCKS, .7f, 1.25f);
                    server.spawnParticles(ParticleTypes.END_ROD, pos.getX() + .5, pos.getY() + 1.15, pos.getZ() + .5, 8, .3, .1, .3, .015);
                }
            }
        }
        boolean active = status.equals("working");
        BlockState state = world.getBlockState(pos);
        if (state.isOf(ConvergenceMod.ASTRAL_INFUSER) && state.get(AstralInfusionBlock.ACTIVE) != active)
            world.setBlockState(pos, state.with(AstralInfusionBlock.ACTIVE, active), Block.NOTIFY_LISTENERS);
        if (changed) markDirty();
    }
    private boolean clearNight(ServerWorld server) {
        long day = Math.floorMod(server.getTimeOfDay(), 24000L);
        return server.getRegistryKey() == World.OVERWORLD && day >= 13000 && day < 23000
                && !server.isRaining() && !server.isThundering() && server.isSkyVisible(pos.up())
                && server.getTopY(Heightmap.Type.MOTION_BLOCKING, pos.getX(), pos.getZ()) <= pos.getY() + 1;
    }
    private InfusionCatalog.Infusion matchingRecipe() {
        for (var recipe : InfusionCatalog.all()) {
            boolean matches = Registries.ITEM.containsId(Identifier.of(recipe.output()));
            for (int slot = 0; slot < InfusionCatalog.INPUTS && matches; slot++) {
                var ingredient = recipe.ingredients().get(slot);
                ItemStack stack = stacks.get(slot);
                if (ingredient != null) matches = stack.getCount() >= ingredient.count() && stack.getCount() <= stack.getMaxCount()
                        && Registries.ITEM.getId(stack.getItem()).toString().equals(ingredient.item());
                else matches = stack.isEmpty() || isValid(slot, stack) && stack.getCount() <= stack.getMaxCount();
            }
            if (matches) return recipe;
        }
        return null;
    }
    private int outputSlot(InfusionCatalog.Infusion recipe) {
        ItemStack result = new ItemStack(Registries.ITEM.get(Identifier.of(recipe.output())));
        for (int slot : OUTPUT_SLOTS) {
            ItemStack current = stacks.get(slot);
            if (current.isEmpty() || ItemStack.areItemsAndComponentsEqual(current, result)
                    && current.getCount() + result.getCount() <= Math.min(getMaxCountPerStack(), current.getMaxCount())) return slot;
        }
        return -1;
    }
    int progress() { return progress; }
    String status() { return status; }
    Text statusText() {
        var recipe = InfusionCatalog.all().stream().filter(r -> r.id().equals(recipeId)).findFirst();
        Text target = recipe.<Text>map(r -> Text.translatable("infusion.convergence." + r.id()))
                .orElseGet(() -> Text.translatable("message.convergence.infusion.no_recipe"));
        return Text.translatable("message.convergence.infusion.status." + status, target, progress / 20, InfusionCatalog.DURATION / 20);
    }
    void showRecipes(PlayerEntity player) {
        player.sendMessage(Text.translatable("message.convergence.infusion.layout"), false);
        for (var recipe : InfusionCatalog.all()) player.sendMessage(Text.translatable("message.convergence.infusion.recipe." + recipe.id()), false);
        player.sendMessage(statusText(), false);
    }
    @Override protected void writeNbt(NbtCompound nbt, RegistryWrapper.WrapperLookup registries) {
        super.writeNbt(nbt, registries);
        Inventories.writeNbt(nbt, stacks, registries);
        nbt.putInt("InfusionProgress", progress); nbt.putString("InfusionRecipe", recipeId);
    }
    @Override protected void readNbt(NbtCompound nbt, RegistryWrapper.WrapperLookup registries) {
        super.readNbt(nbt, registries);
        stacks = DefaultedList.ofSize(9, ItemStack.EMPTY);
        Inventories.readNbt(nbt, stacks, registries);
        progress = Math.max(0, Math.min(InfusionCatalog.DURATION - 20, nbt.getInt("InfusionProgress")));
        recipeId = nbt.getString("InfusionRecipe");
        if (InfusionCatalog.all().stream().noneMatch(r -> r.id().equals(recipeId))) { recipeId = ""; progress = 0; }
        // Corrupt/edited input counts are rejected by matchingRecipe on the next server step;
        // overflow output is preserved and blocks payment rather than being silently discarded.
    }
    @Override public Text getDisplayName() { return Text.translatable("container.convergence.astral_infuser"); }
    @Override public ScreenHandler createMenu(int syncId, PlayerInventory inventory, PlayerEntity player) {
        return new AstralInfusionScreenHandler(syncId, inventory, this, player);
    }
    @Override public int size() { return stacks.size(); }
    @Override public boolean isEmpty() { return stacks.stream().allMatch(ItemStack::isEmpty); }
    @Override public ItemStack getStack(int slot) { return stacks.get(slot); }
    @Override public ItemStack removeStack(int slot, int amount) { ItemStack result = Inventories.splitStack(stacks, slot, amount); if (!result.isEmpty()) markDirty(); return result; }
    @Override public ItemStack removeStack(int slot) { ItemStack result = Inventories.removeStack(stacks, slot); if (!result.isEmpty()) markDirty(); return result; }
    @Override public void setStack(int slot, ItemStack stack) {
        stacks.set(slot, stack);
        if (stack.getCount() > Math.min(getMaxCountPerStack(), stack.getMaxCount())) stack.setCount(Math.min(getMaxCountPerStack(), stack.getMaxCount()));
        markDirty();
    }
    @Override public boolean canPlayerUse(PlayerEntity player) { return world != null && world.getBlockEntity(pos) == this && player.squaredDistanceTo(pos.toCenterPos()) <= 64; }
    @Override public void clear() { stacks.clear(); progress = 0; recipeId = ""; markDirty(); }
    @Override public boolean isValid(int slot, ItemStack stack) { return InfusionCatalog.accepts(slot, Registries.ITEM.getId(stack.getItem()).toString()); }
    @Override public int[] getAvailableSlots(Direction side) { return (side == Direction.DOWN ? OUTPUT_SLOTS : INPUT_SLOTS).clone(); }
    @Override public boolean canInsert(int slot, ItemStack stack, Direction side) { return side != Direction.DOWN && isValid(slot, stack); }
    @Override public boolean canExtract(int slot, ItemStack stack, Direction side) { return side == Direction.DOWN && slot >= FIRST_OUTPUT && slot < size(); }
}
