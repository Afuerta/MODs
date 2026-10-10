package io.github.afuerta.starfall.event;

import net.minecraft.nbt.NbtCompound;
import net.minecraft.nbt.NbtElement;
import net.minecraft.nbt.NbtList;
import net.minecraft.registry.RegistryWrapper;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.ChunkPos;
import net.minecraft.world.PersistentState;
import java.util.HashMap;
import java.util.Map;

/** Protects player placement columns persistently; at most 256 bits per touched chunk. */
public final class ProtectedTerrain extends PersistentState {
    private static final Type<ProtectedTerrain> TYPE = new Type<>(ProtectedTerrain::new,
            ProtectedTerrain::read, null);
    private final Map<Long, long[]> columns = new HashMap<>();
    public static ProtectedTerrain get(ServerWorld world) {
        return world.getPersistentStateManager().getOrCreate(TYPE, "starfall_protected_terrain");
    }
    public static ProtectedTerrain read(NbtCompound nbt, RegistryWrapper.WrapperLookup lookup) {
        var state = new ProtectedTerrain();
        NbtList entries = nbt.getList("chunks", NbtElement.COMPOUND_TYPE);
        for (int i = 0; i < entries.size(); i++) {
            NbtCompound entry = entries.getCompound(i);
            long[] bits = entry.getLongArray("columns");
            if (bits.length == 4) state.columns.put(entry.getLong("chunk"), bits);
        }
        return state;
    }
    public void protect(BlockPos pos) {
        long[] bits = columns.computeIfAbsent(chunkKey(pos), key -> new long[4]);
        int index = (pos.getZ() & 15) * 16 + (pos.getX() & 15);
        long mask = 1L << (index & 63);
        if ((bits[index >> 6] & mask) == 0) { bits[index >> 6] |= mask; markDirty(); }
    }
    public boolean isProtected(BlockPos pos) {
        long[] bits = columns.get(chunkKey(pos));
        int index = (pos.getZ() & 15) * 16 + (pos.getX() & 15);
        return bits != null && (bits[index >> 6] & (1L << (index & 63))) != 0;
    }
    private static long chunkKey(BlockPos pos) { return ChunkPos.toLong(pos.getX() >> 4, pos.getZ() >> 4); }
    @Override public NbtCompound writeNbt(NbtCompound nbt, RegistryWrapper.WrapperLookup lookup) {
        NbtList entries = new NbtList();
        columns.forEach((chunk, bits) -> {
            NbtCompound entry = new NbtCompound();
            entry.putLong("chunk", chunk);
            entry.putLongArray("columns", bits);
            entries.add(entry);
        });
        nbt.put("chunks", entries);
        return nbt;
    }
}
