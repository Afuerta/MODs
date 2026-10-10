package io.github.afuerta.starfall.event;

import io.github.afuerta.starfall.registry.ModBlocks;
import net.minecraft.nbt.NbtCompound;
import net.minecraft.registry.RegistryWrapper;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.util.math.BlockPos;
import net.minecraft.world.PersistentState;
import java.util.Iterator;
import java.util.LinkedHashSet;
import java.util.List;

/** Per-dimension, insertion-ordered record of the newest 64 successful star impacts. */
public final class StarChart extends PersistentState {
    public static final int MAX_STARS = 64;
    private static final Type<StarChart> TYPE = new Type<>(StarChart::new, StarChart::read, null);
    private final LinkedHashSet<Long> stars = new LinkedHashSet<>();

    public static StarChart get(ServerWorld world) {
        return world.getPersistentStateManager().getOrCreate(TYPE, "starfall_star_chart");
    }
    public static StarChart read(NbtCompound nbt, RegistryWrapper.WrapperLookup lookup) {
        var state = new StarChart();
        // Load work is bounded too: oversized save data retains only its newest 64 records.
        long[] saved = nbt.getLongArray("stars");
        for (int index = Math.max(0, saved.length - MAX_STARS); index < saved.length; index++) {
            state.record(BlockPos.fromLong(saved[index]));
        }
        return state;
    }
    public void record(BlockPos pos) {
        long packed = pos.asLong();
        stars.remove(packed);
        stars.add(packed);
        if (stars.size() > MAX_STARS) stars.remove(stars.iterator().next());
        markDirty();
    }
    public void remove(BlockPos pos) {
        if (stars.remove(pos.asLong())) markDirty();
    }
    public List<BlockPos> positions() { return stars.stream().map(BlockPos::fromLong).toList(); }

    /** Unloaded targets remain usable memories. No block lookup occurs before the load check. */
    public BlockPos nearest(ServerWorld world, BlockPos origin) {
        BlockPos nearest = null;
        double distance = Double.POSITIVE_INFINITY;
        Iterator<Long> iterator = stars.iterator();
        while (iterator.hasNext()) {
            BlockPos pos = BlockPos.fromLong(iterator.next());
            boolean invalid = !world.isInBuildLimit(pos) || !world.getWorldBorder().contains(pos);
            if (!invalid && world.isChunkLoaded(pos.getX() >> 4, pos.getZ() >> 4)) {
                invalid = !world.getBlockState(pos).isOf(ModBlocks.FALLEN_STAR);
            }
            if (invalid) {
                iterator.remove();
                markDirty();
                continue;
            }
            double candidate = pos.getSquaredDistance(origin);
            if (candidate < distance) { nearest = pos; distance = candidate; }
        }
        return nearest;
    }
    @Override public NbtCompound writeNbt(NbtCompound nbt, RegistryWrapper.WrapperLookup lookup) {
        nbt.putLongArray("stars", stars.stream().mapToLong(Long::longValue).toArray());
        return nbt;
    }
}
