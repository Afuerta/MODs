package com.afuerta.riftbound;

import com.afuerta.riftbound.domain.Aspect;
import com.afuerta.riftbound.domain.EncounterPattern;
import com.afuerta.riftbound.domain.HazardSchedule;
import com.afuerta.riftbound.domain.HazardZone;
import com.afuerta.riftbound.domain.MobKind;
import com.afuerta.riftbound.domain.TrialCooldowns;
import com.afuerta.riftbound.domain.TrialPlan;
import com.afuerta.riftbound.domain.TrialPlanner;
import com.afuerta.riftbound.domain.TrialSession;
import com.afuerta.riftbound.domain.TrialTier;
import com.afuerta.riftbound.domain.WavePlan;
import net.minecraft.entity.Entity;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.SpawnReason;
import net.minecraft.entity.boss.BossBar;
import net.minecraft.entity.boss.ServerBossBar;
import net.minecraft.entity.attribute.EntityAttributes;
import net.minecraft.entity.effect.StatusEffectInstance;
import net.minecraft.entity.effect.StatusEffects;
import net.minecraft.entity.mob.MobEntity;
import net.minecraft.entity.mob.ZombieEntity;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.registry.Registries;
import net.minecraft.util.Identifier;
import net.minecraft.util.math.Vec3d;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.sound.SoundCategory;
import net.minecraft.sound.SoundEvents;
import net.minecraft.text.Text;
import net.minecraft.util.math.BlockPos;
import net.minecraft.world.Difficulty;
import net.minecraft.world.World;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/** All encounter mutation runs on the logical server thread. No client packet can award loot. */
public final class TrialManager {
    private static final int ARENA_RADIUS = 24;
    private static final int PARTY_RADIUS = 12;
    private static final int MAX_TRIALS = 4;
    private static final int HAZARD_EFFECT_TICKS = 60;
    private static final int HAZARD_PARTICLE_INTERVAL = 5;
    private static final Identifier ATTUNEMENT_CORE = Identifier.of("convergence", "attunement_core");
    private static final Identifier CONCORDANCE = Identifier.of("convergence", "concordance");
    private final Map<BlockPos, ActiveTrial> trials = new LinkedHashMap<>();
    private final Map<UUID, TrialTier> selections = new HashMap<>();
    private final Map<UUID, Long> readyUntil = new HashMap<>();
    private final Set<UUID> managedMobs = new HashSet<>();
    private final TrialCooldowns cooldowns = new TrialCooldowns();

    public void initialize(MinecraftServer server) {
        trials.clear(); selections.clear(); readyUntil.clear(); managedMobs.clear();
        cooldowns.clear();
    }

    private static long clock(MinecraftServer server) { return server.getOverworld().getTime(); }
    private static void tell(ServerPlayerEntity player, String message) {
        player.sendMessage(Text.literal("[Riftbound] " + message), false);
    }
    private static void translated(ServerPlayerEntity player, String key, Object... arguments) {
        player.sendMessage(Text.translatable(key, arguments), false);
    }
    private static String label(Enum<?> value) {
        String s = value.name().toLowerCase(Locale.ROOT);
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    public boolean isManagedMob(UUID id) { return managedMobs.contains(id); }

    public void ready(ServerPlayerEntity player) {
        long now = clock(Objects.requireNonNull(player.getServer()));
        if (readyUntil.getOrDefault(player.getUuid(), 0L) > now) {
            readyUntil.remove(player.getUuid());
            tell(player, "You are no longer ready for a party trial.");
        } else {
            readyUntil.put(player.getUuid(), now + 6000);
            tell(player, "Ready for 5 minutes. Stand within 12 blocks of your friend's anchor; /riftbound ready cancels.");
        }
    }

    public void status(ServerPlayerEntity player) {
        long now = clock(Objects.requireNonNull(player.getServer()));
        tell(player, "Selected: " + label(selections.getOrDefault(player.getUuid(), TrialTier.INITIATE))
                + ". Highest completed tier: " + PlayerProgress.completedTier(player)
                + ". Cooldown: " + ((cooldowns.remainingTicks(player.getUuid(), now) + 19) / 20) + "s.");
    }

    public void useAnchor(ServerPlayerEntity player, BlockPos clicked) {
        BlockPos pos = clicked.toImmutable();
        ItemStack offered = player.getMainHandStack();
        if (offered.isEmpty() && player.isSneaking()) {
            int maxOrdinal = Math.min(PlayerProgress.completedTier(player), 2);
            TrialTier current = selections.getOrDefault(player.getUuid(), TrialTier.INITIATE);
            TrialTier next = TrialTier.values()[(current.ordinal() + 1) % (maxOrdinal + 1)];
            selections.put(player.getUuid(), next);
            tell(player, "Selected " + label(next) + ". Hold an Echo and right-click to begin.");
            return;
        }
        Aspect aspect = RiftboundMod.aspectOf(offered);
        if (aspect == null) {
            status(player);
            tell(player, "Hold an Echo to open a trial. Sneak with an empty hand to cycle unlocked tiers.");
            return;
        }
        MinecraftServer server = Objects.requireNonNull(player.getServer());
        ServerWorld world = player.getServerWorld();
        long now = clock(server);
        if (!world.getRegistryKey().equals(World.OVERWORLD)) {
            tell(player, "Rift trials require an Overworld anchor."); return;
        }
        if (world.getDifficulty() == Difficulty.PEACEFUL || player.isCreative() || player.isSpectator()) {
            tell(player, "Use Survival or Adventure mode and a difficulty above Peaceful."); return;
        }
        if (!cooldowns.isReady(player.getUuid(), now)) { status(player); return; }
        if (trials.size() >= MAX_TRIALS || trials.keySet().stream().anyMatch(other ->
                other.getSquaredDistance(pos) < 64 * 64)) {
            tell(player, "Another trial is nearby, or all four server trial slots are occupied."); return;
        }
        if (inTrial(player.getUuid())) { tell(player, "You are already participating in a trial."); return; }
        TrialTier tier = selections.getOrDefault(player.getUuid(), TrialTier.INITIATE);
        if (PlayerProgress.completedTier(player) < tier.ordinal()) {
            tell(player, "Complete the preceding tier first."); return;
        }
        boolean convergence = Registries.ITEM.getId(player.getOffHandStack().getItem()).equals(ATTUNEMENT_CORE);
        if (convergence && tier == TrialTier.INITIATE) {
            translated(player, "message.riftbound.convergence.requires_tier"); return;
        }
        Item concordance = convergence ? Registries.ITEM.get(CONCORDANCE) : Items.AIR;
        if (convergence && concordance == Items.AIR) {
            translated(player, "message.riftbound.convergence.unavailable"); return;
        }
        if (offered.getCount() < tier.echoCost()) {
            tell(player, label(tier) + " requires " + tier.echoCost() + " Echoes of the same aspect."); return;
        }
        List<ServerPlayerEntity> party = new ArrayList<>();
        party.add(player);
        world.getPlayers().stream().filter(p -> p != player && p.isAlive()
                        && !p.isCreative() && !p.isSpectator()
                        && p.squaredDistanceTo(pos.toCenterPos()) <= PARTY_RADIUS * PARTY_RADIUS
                        && readyUntil.getOrDefault(p.getUuid(), 0L) > now
                        && !inTrial(p.getUuid()) && cooldowns.isReady(p.getUuid(), now)
                        && PlayerProgress.completedTier(p) >= tier.ordinal())
                .sorted(Comparator.comparingDouble(p -> p.squaredDistanceTo(pos.toCenterPos())))
                .limit(3).forEach(party::add);
        TrialPlan plan = TrialPlanner.plan(aspect, tier, party.size(), world.random.nextLong());
        if (spawnPositions(world, pos).size() < plan.waves().stream().mapToInt(WavePlan::mobCount).max().orElse(0)) {
            tell(player, "The arena is obstructed. Place the anchor on flat, dry ground with a clear 12-block radius."); return;
        }
        TrialSession session = new TrialSession(plan, party.stream().map(Entity::getUuid).toList(), now);
        ActiveTrial active = new ActiveTrial(world, pos, session, convergence, concordance);
        party.forEach(p -> {
            readyUntil.remove(p.getUuid());
            active.bar.addPlayer(p);
            tell(p, label(tier) + " " + label(aspect) + " trial begins in 5 seconds. Stay within 24 blocks.");
            if (convergence) translated(p, "message.riftbound.convergence.started");
        });
        announcePattern(active, server, 0);
        trials.put(pos, active);
        offered.decrement(tier.echoCost());
        // Both offerings are consumed only after every activation preflight succeeds.
        if (convergence) player.getOffHandStack().decrement(1);
        world.playSound(null, pos, SoundEvents.BLOCK_RESPAWN_ANCHOR_CHARGE, SoundCategory.BLOCKS, 1.0f, 1.1f);
    }

    private boolean inTrial(UUID player) {
        return trials.values().stream().anyMatch(t -> t.session.participants().contains(player));
    }

    public void onDeath(LivingEntity entity) {
        for (ActiveTrial trial : trials.values()) {
            trial.session.mobDefeated(entity.getUuid());
            if (entity.getUuid().equals(trial.standardBearer)) clearStandardGuard(trial);
            if (trial.session.withdraw(entity.getUuid()) && entity instanceof ServerPlayerEntity player) {
                trial.bar.removePlayer(player);
                tell(player, "You died and forfeited this trial's reward. Your existing relics are unaffected.");
            }
        }
    }

    public void onConversion(MobEntity previous, MobEntity converted, boolean keepEquipment) {
        if (!managedMobs.contains(previous.getUuid())) return;
        for (ActiveTrial trial : trials.values()) {
            if (trial.session.replaceMob(previous.getUuid(), converted.getUuid())) {
                managedMobs.remove(previous.getUuid());
                managedMobs.add(converted.getUuid());
                trial.allMobs.add(converted.getUuid());
                if (previous.getUuid().equals(trial.standardBearer)) {
                    trial.standardBearer = converted.getUuid();
                    markStandardBearer(converted);
                }
                converted.addCommandTag(RiftboundMod.TRIAL_MOB_TAG);
                converted.setPersistent();
                converted.setCanPickUpLoot(false);
                if (converted instanceof ZombieEntity zombie) {
                    zombie.setCanBreakDoors(false);
                    var reinforcement = zombie.getAttributeInstance(EntityAttributes.ZOMBIE_SPAWN_REINFORCEMENTS);
                    if (reinforcement != null) reinforcement.setBaseValue(0.0);
                }
                converted.addStatusEffect(new StatusEffectInstance(StatusEffects.FIRE_RESISTANCE,
                        (int) trial.session.plan().timeoutTicks(), 0, true, false, false));
                return;
            }
        }
        // A conversion racing an abort must not escape the cleanup tag.
        converted.addCommandTag(RiftboundMod.TRIAL_MOB_TAG);
    }

    public void tick(MinecraftServer server) {
        long now = clock(server);
        if (now % 20 == 0) {
            cooldowns.prune(now);
            readyUntil.entrySet().removeIf(e -> e.getValue() <= now || server.getPlayerManager().getPlayer(e.getKey()) == null);
            applyRelics(server);
        }
        Iterator<ActiveTrial> iterator = trials.values().iterator();
        while (iterator.hasNext()) {
            ActiveTrial trial = iterator.next();
            validate(trial, server);
            TrialSession.State previousState = trial.session.state();
            TrialSession.Event event = trial.session.advance(now);
            if (previousState == TrialSession.State.ACTIVE
                    && trial.session.state() == TrialSession.State.INTERMISSION) {
                clearStandardGuard(trial);
                announcePattern(trial, server, trial.session.waveIndex() + 1);
            }
            if (event == TrialSession.Event.SPAWN_WAVE) spawnWave(trial, server);
            if (trial.session.isTerminal()) {
                finish(trial, server, now);
                iterator.remove();
                continue;
            }
            tickEncounter(trial, server, now);
            if (!trial.session.isTerminal()) tickHazards(trial, server, now);
            if (trial.session.isTerminal()) {
                finish(trial, server, now);
                iterator.remove();
                continue;
            }
            if (now % 20 == 0) {
                trial.bar.setName(Text.literal(label(trial.session.plan().aspect()) + " Rift · "
                        + label(trial.session.plan().tier()) + " · Wave "
                        + Math.max(1, trial.session.waveIndex() + 1) + "/" + trial.session.plan().waves().size()
                        + " · " + trial.session.remainingMobs() + " enemies · "
                        + ((trial.session.remainingTicks(now) + 19) / 20) + "s"));
                trial.bar.setPercent((float) trial.session.remainingTicks(now) / trial.session.plan().timeoutTicks());
                for (int i = 0; i < 16; i++) {
                    double angle = i * Math.PI / 8;
                    trial.world.spawnParticles(ParticleTypes.END_ROD,
                            trial.pos.getX() + 0.5 + Math.cos(angle) * ARENA_RADIUS,
                            trial.pos.getY() + 1.2, trial.pos.getZ() + 0.5 + Math.sin(angle) * ARENA_RADIUS,
                            1, 0, 0.15, 0, 0);
                }
            }
        }
    }

    private void tickHazards(ActiveTrial trial, MinecraftServer server, long now) {
        if (trial.hazards == null) return;
        int activeWave = trial.session.state() == TrialSession.State.ACTIVE ? trial.session.waveIndex() : -1;
        HazardSchedule.Event event = trial.hazards.advance(now, activeWave);
        if (activeWave < 0) { trial.zone = null; return; }
        if (event == HazardSchedule.Event.WARNING) {
            List<UUID> eligible = trial.session.eligibleParticipants().stream().sorted().toList();
            ServerPlayerEntity focus = eligible.isEmpty() ? null : server.getPlayerManager()
                    .getPlayer(eligible.get((trial.hazards.pulse() - 1) % eligible.size()));
            double x = focus == null ? 0 : focus.getX() - trial.pos.getX() - .5;
            double z = focus == null ? 0 : focus.getZ() - trial.pos.getZ() - .5;
            trial.zone = HazardZone.create(trial.session.plan().aspect(), trial.session.plan().seed(),
                    trial.hazards.pulse(), x, z);
            for (UUID id : eligible) {
                ServerPlayerEntity player = server.getPlayerManager().getPlayer(id);
                if (player != null) translated(player, "message.riftbound.hazard."
                        + trial.session.plan().aspect().name().toLowerCase(Locale.ROOT));
            }
            drawHazard(trial);
        } else if (event == HazardSchedule.Event.IMPACT && trial.zone != null) {
            // Snapshot avoids mutation during the death callbacks caused by hazard damage.
            for (UUID id : trial.session.eligibleParticipants()) {
                ServerPlayerEntity player = server.getPlayerManager().getPlayer(id);
                if (player == null || !player.isAlive() || player.isCreative() || player.isSpectator()
                        || player.getServerWorld() != trial.world
                        || player.squaredDistanceTo(trial.pos.toCenterPos()) > ARENA_RADIUS * ARENA_RADIUS) continue;
                if (!trial.zone.contains(player.getX() - trial.pos.getX() - .5,
                        player.getZ() - trial.pos.getZ() - .5)) continue;
                switch (trial.zone.aspect()) {
                    case VERDANT -> player.addStatusEffect(new StatusEffectInstance(StatusEffects.SLOWNESS,
                            HAZARD_EFFECT_TICKS, 1, false, true, true));
                    case EMBER -> player.damage(trial.world.getDamageSources().magic(),
                            trial.session.plan().tier() == TrialTier.ADEPT ? 3.0f : 4.0f);
                    case TIDAL -> {
                        Vec3d pull = trial.pos.toCenterPos().subtract(player.getPos());
                        Vec3d horizontal = new Vec3d(pull.x, 0, pull.z).normalize().multiply(.55);
                        player.addVelocity(horizontal.x, .08, horizontal.z);
                        player.velocityModified = true;
                    }
                    case HOLLOW -> player.addStatusEffect(new StatusEffectInstance(StatusEffects.WEAKNESS,
                            HAZARD_EFFECT_TICKS, 0, false, true, true));
                }
            }
            trial.zone = null;
        } else if (trial.zone != null && trial.hazards.isWarning() && now % HAZARD_PARTICLE_INTERVAL == 0) {
            drawHazard(trial);
        }
    }

    private static void drawHazard(ActiveTrial trial) {
        if (trial.zone == null) return;
        var particle = switch (trial.zone.aspect()) {
            case VERDANT -> ParticleTypes.HAPPY_VILLAGER;
            case EMBER -> ParticleTypes.FLAME;
            case TIDAL -> ParticleTypes.SPLASH;
            case HOLLOW -> ParticleTypes.WITCH;
        };
        for (HazardZone.Point point : trial.zone.markers()) {
            trial.world.spawnParticles(particle, trial.pos.getX() + .5 + point.x(), trial.pos.getY() + 1.15,
                    trial.pos.getZ() + .5 + point.z(), 1, 0, .05, 0, 0);
        }
    }

    private void validate(ActiveTrial trial, MinecraftServer server) {
        if (!trial.world.isChunkLoaded(trial.pos)) {
            trial.session.fail(TrialSession.FailureReason.WORLD_UNLOADED); return;
        }
        if (!trial.world.getBlockState(trial.pos).isOf(RiftboundMod.ANCHOR)) {
            trial.session.fail(TrialSession.FailureReason.ANCHOR_REMOVED); return;
        }
        for (UUID id : trial.session.eligibleParticipants()) {
            ServerPlayerEntity player = server.getPlayerManager().getPlayer(id);
            if (player == null || !player.isAlive() || player.isCreative() || player.isSpectator()
                    || player.getServerWorld() != trial.world
                    || player.squaredDistanceTo(trial.pos.toCenterPos()) > ARENA_RADIUS * ARENA_RADIUS) {
                trial.session.withdraw(id);
                if (player != null) {
                    trial.bar.removePlayer(player);
                    tell(player, "You left the arena and forfeited this run. You cannot rejoin it.");
                }
            }
        }
        for (UUID id : trial.session.activeMobs()) {
            Entity entity = trial.world.getEntity(id);
            if (entity == null) {
                // Chunk unloading/discard is not a kill. Never turn absent mobs into free wins.
                trial.session.fail(TrialSession.FailureReason.WORLD_UNLOADED); return;
            }
            if (entity.squaredDistanceTo(trial.pos.toCenterPos()) > 40 * 40) {
                trial.session.fail(TrialSession.FailureReason.SPAWN_FAILED); return;
            }
        }
    }

    private void spawnWave(ActiveTrial trial, MinecraftServer server) {
        WavePlan wave = trial.session.nextWave();
        List<BlockPos> locations = spawnPositions(trial.world, trial.pos);
        if (locations.size() < wave.mobCount()) {
            trial.session.fail(TrialSession.FailureReason.SPAWN_FAILED); return;
        }
        List<UUID> spawned = new ArrayList<>();
        List<UUID> targets = trial.session.eligibleParticipants().stream().sorted().toList();
        clearStandardGuard(trial);
        trial.waveStarted = clock(server);
        for (int i = 0; i < wave.mobs().size(); i++) {
            MobEntity mob = mobType(wave.mobs().get(i)).create(trial.world);
            if (mob == null) { trial.session.fail(TrialSession.FailureReason.SPAWN_FAILED); return; }
            BlockPos location = locations.get(wave.pattern().spawnSlot(i, locations.size()));
            mob.refreshPositionAndAngles(location.getX() + 0.5, location.getY(), location.getZ() + 0.5, 0, 0);
            mob.initialize(trial.world, trial.world.getLocalDifficulty(location), SpawnReason.EVENT, null);
            // initialize() may create a jockey. Waves contain only the planned enemies.
            for (Entity passenger : new ArrayList<>(mob.getPassengerList())) passenger.discard();
            mob.removeAllPassengers();
            mob.stopRiding();
            mob.setPersistent();
            mob.setCanPickUpLoot(false);
            if (mob instanceof ZombieEntity zombie) {
                zombie.setCanBreakDoors(false);
                var reinforcements = zombie.getAttributeInstance(EntityAttributes.ZOMBIE_SPAWN_REINFORCEMENTS);
                if (reinforcements != null) reinforcements.setBaseValue(0.0);
            }
            // Daylight must not pass a survival wave for players by burning every undead.
            mob.addStatusEffect(new StatusEffectInstance(StatusEffects.FIRE_RESISTANCE,
                    (int) trial.session.plan().timeoutTicks(), 0, true, false, false));
            mob.addCommandTag(RiftboundMod.TRIAL_MOB_TAG);
            if (wave.pattern() == EncounterPattern.PINCER) {
                mob.addStatusEffect(new StatusEffectInstance(StatusEffects.SPEED,
                        EncounterPattern.PINCER_RUSH_TICKS, 0, true, true, true));
            }
            if (wave.pattern() == EncounterPattern.STANDARD_BEARER && i == 0) {
                trial.standardBearer = mob.getUuid();
                markStandardBearer(mob);
            }
            if (!targets.isEmpty()) mob.setTarget(server.getPlayerManager().getPlayer(targets.get(i % targets.size())));
            managedMobs.add(mob.getUuid());
            trial.allMobs.add(mob.getUuid());
            if (i >= wave.pattern().initialCount(wave.mobCount())) {
                trial.pending.put(mob.getUuid(), mob);
                continue;
            }
            if (!trial.world.isSpaceEmpty(mob) || !trial.world.spawnEntity(mob)) {
                managedMobs.remove(mob.getUuid()); mob.discard();
                trial.session.fail(TrialSession.FailureReason.SPAWN_FAILED); return;
            }
            spawned.add(mob.getUuid());
            trial.world.spawnParticles(ParticleTypes.PORTAL, mob.getX(), mob.getY() + 1, mob.getZ(), 20, .3, .6, .3, .03);
        }
        trial.session.registerWaveMobs(spawned, trial.pending.keySet());
        for (UUID id : targets) {
            ServerPlayerEntity p = server.getPlayerManager().getPlayer(id);
            if (p != null) tell(p, "Wave " + (trial.session.waveIndex() + 1) + ": " + wave.mobCount() + " enemies.");
        }
    }

    private static void announcePattern(ActiveTrial trial, MinecraftServer server, int waveIndex) {
        EncounterPattern pattern = trial.session.plan().waves().get(waveIndex).pattern();
        if (pattern == EncounterPattern.STANDARD) return;
        for (UUID id : trial.session.eligibleParticipants()) {
            ServerPlayerEntity player = server.getPlayerManager().getPlayer(id);
            if (player != null) translated(player, "message.riftbound.encounter."
                    + pattern.name().toLowerCase(Locale.ROOT));
        }
        trial.world.playSound(null, trial.pos, SoundEvents.BLOCK_RESPAWN_ANCHOR_CHARGE,
                SoundCategory.HOSTILE, .8f, .8f);
    }

    private static void markStandardBearer(MobEntity mob) {
        mob.setCustomName(Text.translatable("entity.riftbound.standard_bearer"));
        mob.setCustomNameVisible(true);
        mob.setGlowing(true);
    }

    private static void clearStandardGuard(ActiveTrial trial) {
        if (trial.standardBearer == null) return;
        trial.standardBearer = null;
        for (UUID id : trial.session.activeMobs()) {
            Entity entity = trial.world.getEntity(id);
            if (entity instanceof MobEntity mob) mob.removeStatusEffect(StatusEffects.RESISTANCE);
        }
    }

    private void tickEncounter(ActiveTrial trial, MinecraftServer server, long now) {
        if (trial.session.state() != TrialSession.State.ACTIVE) return;
        if (!trial.pending.isEmpty()) {
            if (now - trial.waveStarted >= EncounterPattern.REINFORCEMENT_DELAY_TICKS) {
                // Recheck terrain and collisions at deployment: players can build during the warning.
                List<UUID> targets = trial.session.eligibleParticipants().stream().sorted().toList();
                int targetIndex = 0;
                for (MobEntity mob : trial.pending.values()) {
                    BlockPos pos = mob.getBlockPos();
                    if (!isSpawnPositionSafe(trial.world, pos)
                            || !trial.world.isSpaceEmpty(mob) || !trial.world.spawnEntity(mob)) {
                        trial.session.fail(TrialSession.FailureReason.SPAWN_FAILED);
                        return;
                    }
                    if (!targets.isEmpty()) mob.setTarget(server.getPlayerManager()
                            .getPlayer(targets.get(targetIndex++ % targets.size())));
                    trial.session.deployMob(mob.getUuid());
                    trial.world.spawnParticles(ParticleTypes.PORTAL, mob.getX(), mob.getY() + 1,
                            mob.getZ(), 20, .3, .6, .3, .03);
                }
                trial.pending.clear();
                for (UUID id : targets) {
                    ServerPlayerEntity player = server.getPlayerManager().getPlayer(id);
                    if (player != null) translated(player, "message.riftbound.encounter.reinforcements_arrived");
                }
                trial.world.playSound(null, trial.pos, SoundEvents.BLOCK_RESPAWN_ANCHOR_CHARGE,
                        SoundCategory.HOSTILE, 1.0f, 1.3f);
            } else if (now % 5 == 0) {
                for (MobEntity mob : trial.pending.values()) {
                    trial.world.spawnParticles(ParticleTypes.END_ROD, mob.getX(), mob.getY() + .5,
                            mob.getZ(), 2, .4, .3, .4, 0);
                }
            }
        }
        if (trial.standardBearer == null || now % EncounterPattern.GUARD_REFRESH_TICKS != 0) return;
        Entity bearer = trial.world.getEntity(trial.standardBearer);
        if (!(bearer instanceof MobEntity leader) || !leader.isAlive()) {
            clearStandardGuard(trial);
            return;
        }
        // Only this wave's registered allies receive guard, never the leader or ordinary mobs.
        for (UUID id : trial.session.activeMobs()) {
            Entity entity = trial.world.getEntity(id);
            if (entity instanceof MobEntity ally && ally != leader && ally.isAlive()
                    && ally.squaredDistanceTo(leader) <= EncounterPattern.GUARD_RADIUS * EncounterPattern.GUARD_RADIUS) {
                ally.addStatusEffect(new StatusEffectInstance(StatusEffects.RESISTANCE,
                        EncounterPattern.GUARD_EFFECT_TICKS, 0, true, true, true));
            }
        }
    }

    private static EntityType<? extends MobEntity> mobType(MobKind kind) {
        return switch (kind) {
            case ZOMBIE -> EntityType.ZOMBIE;
            case SKELETON -> EntityType.SKELETON;
            case SPIDER -> EntityType.SPIDER;
            case HUSK -> EntityType.HUSK;
            case DROWNED -> EntityType.DROWNED;
            case STRAY -> EntityType.STRAY;
        };
    }

    private static List<BlockPos> spawnPositions(ServerWorld world, BlockPos anchor) {
        List<BlockPos> result = new ArrayList<>();
        for (int i = 0; i < 32; i++) {
            double angle = i * Math.PI / 16;
            int radius = i % 2 == 0 ? 8 : 10;
            int x = anchor.getX() + (int) Math.round(Math.cos(angle) * radius);
            int z = anchor.getZ() + (int) Math.round(Math.sin(angle) * radius);
            for (int dy = 4; dy >= -4; dy--) {
                BlockPos p = new BlockPos(x, anchor.getY() + dy, z);
                if (isSpawnPositionSafe(world, p)) {
                    if (!result.contains(p)) result.add(p);
                    break;
                }
            }
        }
        return result;
    }

    private static boolean isSpawnPositionSafe(ServerWorld world, BlockPos p) {
        if (!world.isChunkLoaded(p) || !world.getBlockState(p.down()).isSolidBlock(world, p.down())) return false;
        // Spiders can straddle chunks. Recheck the full reserved footprint before querying
        // collision/fluid state; an unloaded neighboring chunk must never be force-loaded.
        for (int dx = -1; dx <= 1; dx++) for (int dz = -1; dz <= 1; dz++) {
            BlockPos foot = p.add(dx, 0, dz);
            if (!world.isChunkLoaded(foot)
                    || !world.getBlockState(foot).getCollisionShape(world, foot).isEmpty()
                    || !world.getBlockState(foot.up()).getCollisionShape(world, foot.up()).isEmpty()
                    || !world.getFluidState(foot).isEmpty() || !world.getFluidState(foot.up()).isEmpty()) return false;
        }
        return true;
    }

    private void finish(ActiveTrial trial, MinecraftServer server, long now) {
        for (var reward : trial.session.claimRewards().entrySet()) {
            ServerPlayerEntity player = server.getPlayerManager().getPlayer(reward.getKey());
            if (player == null) continue;
            int bonus = trial.convergence ? (trial.session.plan().tier() == TrialTier.ADEPT ? 2 : 3) : 0;
            int totalShards = reward.getValue().resonanceShards() + bonus;
            ItemStack shards = new ItemStack(RiftboundMod.RESONANCE, totalShards);
            if (!player.getInventory().insertStack(shards)) player.dropItem(shards, false);
            if (trial.convergence) {
                ItemStack concordance = new ItemStack(trial.concordance);
                if (!player.getInventory().insertStack(concordance)) player.dropItem(concordance, false);
                translated(player, "message.riftbound.convergence.reward", totalShards);
            }
            PlayerProgress.complete(player, trial.session.plan().tier().ordinal() + 1);
            tell(player, "Trial complete! +" + totalShards
                    + " Resonance Shards. Sneak-click the anchor empty-handed to select the next unlocked tier.");
        }
        for (UUID id : trial.session.participants()) {
            cooldowns.start(id, now, trial.session.plan().cooldownTicks());
            ServerPlayerEntity player = server.getPlayerManager().getPlayer(id);
            if (player != null && trial.session.state() == TrialSession.State.FAILED) {
                tell(player, "Trial ended: " + trial.session.failureReason().orElseThrow().name().toLowerCase(Locale.ROOT)
                        .replace('_', ' ') + ". Retry after 60 seconds.");
            }
        }
        cleanup(trial);
    }

    private void cleanup(ActiveTrial trial) {
        if (trial.hazards != null) trial.hazards.stop();
        trial.zone = null;
        clearStandardGuard(trial);
        for (MobEntity mob : trial.pending.values()) mob.discard();
        trial.pending.clear();
        trial.bar.clearPlayers();
        for (UUID id : trial.allMobs) {
            managedMobs.remove(id);
            Entity entity = trial.world.getEntity(id);
            if (entity != null) entity.discard();
        }
    }

    private static void applyRelics(MinecraftServer server) {
        for (ServerPlayerEntity player : server.getPlayerManager().getPlayerList()) {
            if (!player.isAlive() || player.isSpectator()) continue;
            ItemStack held = player.getOffHandStack();
            if (held.isOf(RiftboundMod.WAYFARER)) {
                player.addStatusEffect(new StatusEffectInstance(StatusEffects.SPEED, 40, 0, true, false, true));
                player.addStatusEffect(new StatusEffectInstance(StatusEffects.JUMP_BOOST, 40, 0, true, false, true));
            } else if (held.isOf(RiftboundMod.BULWARK)) {
                player.addStatusEffect(new StatusEffectInstance(StatusEffects.RESISTANCE, 40, 0, true, false, true));
            } else if (held.isOf(RiftboundMod.HARVESTER)) {
                player.addStatusEffect(new StatusEffectInstance(StatusEffects.HASTE, 40, 0, true, false, true));
            }
        }
    }

    public void stop(MinecraftServer server) {
        for (ActiveTrial trial : trials.values()) {
            trial.session.fail(TrialSession.FailureReason.SERVER_STOPPED);
            cleanup(trial);
        }
        trials.clear(); readyUntil.clear(); selections.clear(); managedMobs.clear(); cooldowns.clear();
    }

    public void cancel(ServerPlayerEntity player) {
        for (ActiveTrial trial : trials.values()) if (trial.session.participants().contains(player.getUuid())) {
            trial.session.withdraw(player.getUuid()); trial.bar.removePlayer(player);
            tell(player, "You withdrew from the trial and forfeited its reward."); return;
        }
        tell(player, "You are not in a trial.");
    }

    private static final class ActiveTrial {
        final ServerWorld world;
        final BlockPos pos;
        final TrialSession session;
        final Set<UUID> allMobs = new HashSet<>();
        final Map<UUID, MobEntity> pending = new LinkedHashMap<>();
        long waveStarted;
        UUID standardBearer;
        final boolean convergence;
        final Item concordance;
        final HazardSchedule hazards;
        HazardZone zone;
        final ServerBossBar bar = new ServerBossBar(Text.literal("Rift forming · prepare"),
                BossBar.Color.PURPLE, BossBar.Style.PROGRESS);
        ActiveTrial(ServerWorld world, BlockPos pos, TrialSession session, boolean convergence, Item concordance) {
            this.world = world; this.pos = pos; this.session = session;
            this.convergence = convergence; this.concordance = concordance;
            this.hazards = convergence ? new HazardSchedule(session.plan().tier()) : null;
        }
    }
}
