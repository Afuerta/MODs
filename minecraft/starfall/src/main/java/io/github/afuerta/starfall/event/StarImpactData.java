package io.github.afuerta.starfall.event;

import io.github.afuerta.starfall.registry.ModBlocks;
import net.minecraft.nbt.NbtCompound;
import net.minecraft.nbt.NbtElement;
import net.minecraft.nbt.NbtList;
import net.minecraft.registry.RegistryWrapper;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.util.math.BlockPos;
import net.minecraft.world.PersistentState;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Per-dimension memory of recent successful impacts; reading it never loads terrain. */
public final class StarImpactData extends PersistentState {
    public static final int MAX_STARS = 64;
    // Ordinary saves contain at most 64 entries. Bound recovery work on malformed saves too.
    public static final int MAX_READ_ENTRIES = 4096;
    private static final Type<StarImpactData> TYPE = new Type<>(StarImpactData::new,
            StarImpactData::fromNbt, null);
    private static final Comparator<BlockPos> POSITION_ORDER = Comparator.comparingInt(BlockPos::getX)
            .thenComparingInt(BlockPos::getY).thenComparingInt(BlockPos::getZ);
    private static final Comparator<RememberedStar> AGE_ORDER = Comparator.comparingLong(RememberedStar::landedAt)
            .thenComparing(RememberedStar::position, POSITION_ORDER);
    private final Map<BlockPos, Long> stars = new HashMap<>();

    public static StarImpactData get(ServerWorld world) {
        // Each ServerWorld has its own state manager, including custom dimensions.
        return world.getPersistentStateManager().getOrCreate(TYPE, "starfall_impacts");
    }

    public static StarImpactData fromNbt(NbtCompound nbt, RegistryWrapper.WrapperLookup lookup) {
        StarImpactData state = new StarImpactData();
        NbtList entries = nbt.getList("stars", NbtElement.COMPOUND_TYPE);
        for (int i = 0; i < Math.min(entries.size(), MAX_READ_ENTRIES); i++) {
            NbtCompound entry = entries.getCompound(i);
            if (!entry.contains("pos", NbtElement.LONG_TYPE)
                    || !entry.contains("landed_at", NbtElement.LONG_TYPE)) continue;
            state.record(BlockPos.fromLong(entry.getLong("pos")), entry.getLong("landed_at"));
        }
        state.setDirty(false);
        return state;
    }

    /** Only the impact placement path calls this in gameplay; player-placed stars are not indexed. */
    public void record(BlockPos pos, long landedAt) {
        BlockPos immutable = pos.toImmutable();
        Long previous = stars.get(immutable);
        if (previous != null && previous >= landedAt) return;
        stars.put(immutable, landedAt);
        if (stars.size() > MAX_STARS) {
            RememberedStar oldest = entries().getFirst();
            stars.remove(oldest.position());
        }
        markDirty();
    }

    public boolean remove(BlockPos pos) {
        if (stars.remove(pos) == null) return false;
        markDirty();
        return true;
    }

    public int size() { return stars.size(); }

    /** Immutable snapshot in save/eviction order, independent of map iteration order. */
    public List<RememberedStar> entries() {
        return stars.entrySet().stream().map(entry -> new RememberedStar(entry.getKey(), entry.getValue()))
                .sorted(AGE_ORDER).toList();
    }

    /** Three-dimensional distance; equal distances break ties by X, then Y, then Z. */
    public Optional<BlockPos> nearest(BlockPos origin) {
        return stars.keySet().stream().min(Comparator.comparingDouble((BlockPos pos) -> pos.getSquaredDistance(origin))
                .thenComparing(POSITION_ORDER));
    }

    /** Retains remembered stars in unloaded chunks so exploration cannot erase their signal. */
    public Optional<BlockPos> nearest(ServerWorld world, BlockPos origin) {
        pruneMissing(world);
        return nearest(origin);
    }

    public int pruneMissing(ServerWorld world) {
        int previousSize = stars.size();
        stars.keySet().removeIf(pos -> world.isChunkLoaded(pos.getX() >> 4, pos.getZ() >> 4)
                && !world.getBlockState(pos).isOf(ModBlocks.FALLEN_STAR));
        int removed = previousSize - stars.size();
        if (removed > 0) markDirty();
        return removed;
    }

    @Override public NbtCompound writeNbt(NbtCompound nbt, RegistryWrapper.WrapperLookup lookup) {
        NbtList entries = new NbtList();
        for (RememberedStar star : entries()) {
            NbtCompound entry = new NbtCompound();
            entry.putLong("pos", star.position().asLong());
            entry.putLong("landed_at", star.landedAt());
            entries.add(entry);
        }
        nbt.put("stars", entries);
        return nbt;
    }

    public record RememberedStar(BlockPos position, long landedAt) {
        public RememberedStar { position = position.toImmutable(); }
    }
}
