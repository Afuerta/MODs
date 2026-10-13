import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFileSync } from "node:fs";
const source = readFileSync(
  new URL("../src/js/expedition.js", import.meta.url),
  "utf8",
);
function harness(savedMeta = {}) {
  const storage = new Map();
  const state = {
    mode: "run",
    paused: false,
    loot: [],
    hits: 0,
    extracted: 0,
    saves: 0,
  };
  const noop = () => {};
  const ctx = vm.createContext({
    META: { souls: 0, total: 0, ...savedMeta },
    localStorage: {
      getItem: (k) => storage.get(k) || null,
      setItem: (k, v) => storage.set(k, v),
    },
    metaInteger: (v, max = Number.MAX_SAFE_INTEGER) =>
      Number.isFinite(Number(v))
        ? Math.max(0, Math.min(max, Math.floor(Number(v))))
        : 0,
    saveMeta: () => state.saves++,
    showBanner: noop,
    sfx: { pick: noop, throw: noop, whoosh: noop },
    B: {},
    MESH: { cube: {} },
    makeBatch: () => ({}),
    panel: () => ({
      ctx: { fillRect: noop, fillText: noop },
      tex: {},
      cvs: {},
    }),
    upload: noop,
    FB: "sans",
    FD: "sans",
    ROOM: { cx: 0, cz: 0 },
    headPos: [0, 1.6, 0],
    PL: { fwd: [0, 0, -1], hearts: 5, max: 5, invuln: 0, pos: [0, 0] },
    R: {
      wave: 1,
      phase: "fight",
      queue: ["gunslinger", "gunslinger", "sheriff"],
      perks: {},
      kind: "survival",
      stat: {},
      score: 0,
      lvlUp: null,
    },
    D: { speed: 1, cd: 1 },
    ETYPES: {
      gunslinger: { hit: [[0, 1, 0, 0.3, 1]] },
      sheriff: { boss: true },
    },
    COST: {},
    BOONS: {},
    FLASH: [2, 2, 2],
    inRun: () => state.mode === "run",
    screenPaused: () => state.paused,
    goldMode: () => false,
    gainXP: noop,
    tdGold: noop,
    addGold: noop,
    addTarget: (t) => t,
    targets: [],
    enemies: [],
    eshots: [],
    zaps: [],
    fields: [],
    dropLoot: (...a) => state.loot.push(a),
    healPlayer: noop,
    explodeAt: noop,
    hurtPlayer: () => state.hits++,
    headDist: (p) => Math.hypot(p[0], p[1] - 1.6, p[2]) - 0.2,
    groundAt: () => 0,
    eFire: (e, p, k, o) =>
      ctx.eshots.push({
        p: p.slice(),
        v: [0, 0, -o.speed],
        kind: k,
        col: [1, 1, 1],
      }),
    drawBot: noop,
    BOT: {},
    EM: {},
    ep: noop,
    ppush: noop,
    bpush: noop,
    lw: (e, x, y, z) => [e.x + x, e.y + y, e.z + z],
    popup: noop,
    mulberry: () => () => 0.5,
    TAU: Math.PI * 2,
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    norm: (v) => {
      const l = Math.hypot(...v) || 1;
      return v.map((x) => x / l);
    },
    keys: new Set(),
    keyOn: (...k) => (k.some((v) => ctx.keys.has(v)) ? 1 : 0),
    flatCrouch: 0,
    baseYaw: 0,
    TD: { ko: 0 },
    MR: { on: false },
    PLAY: { vrMove: "sticks" },
    refSpace: {
      getOffsetReferenceSpace(offset) {
        state.offset = offset;
        return this;
      },
    },
    boundedSpace: null,
    boundsPending: false,
    XRRigidTransform: class {
      constructor(p, q) {
        this.position = p;
        this.orientation = q;
      }
    },
    clock: 0,
    endRun: () => {
      state.mode = "results";
      state.extracted++;
    },
  });
  vm.runInContext(source, ctx);
  const api = vm.runInContext(
    "({EXP,CAREER,CAREER_MILESTONES,MOBILITY,XR_MOVE})",
    ctx,
  );
  return { ctx, state, api };
}
test("career milestone soul rewards are once-only across repeated checks and reload", () => {
  const { ctx, api } = harness();
  api.CAREER.kills = 50;
  assert.equal(ctx.claimCareerMilestones(), 33);
  assert.equal(ctx.claimCareerMilestones(), 0);
  assert.equal(ctx.META.souls, 33);
  const resumed = harness(JSON.parse(JSON.stringify(ctx.META)));
  assert.equal(resumed.ctx.claimCareerMilestones(), 0);
  assert.equal(resumed.ctx.META.souls, 33);
});
test("career input rejects invalid counters and unrecognized medals", () => {
  const { ctx } = harness();
  const career = ctx.normalizeCareer({
    kills: -5,
    bosses: Infinity,
    parries: "12",
    medals: ["unknown", "first", "first"],
  });
  assert.equal(career.kills, 0);
  assert.equal(career.bosses, 0);
  assert.equal(career.parries, 12);
  assert.deepEqual(Array.from(career.medals), ["first"]);
});
test("wave reinforcements preserve queued bosses and wave size in both formats", () => {
  const { ctx } = harness();
  ctx.R.wave = 3;
  ctx.prepareExpeditionWave();
  assert.equal(ctx.R.queue.length, 3);
  assert.equal(ctx.R.queue[2], "sheriff");
  assert.equal(ctx.R.queue[0], "prism");
  ctx.R.queue = [
    { type: "gunslinger", lane: 2 },
    { type: "sheriff", lane: 0 },
  ];
  ctx.prepareExpeditionWave();
  assert.equal(ctx.R.queue[0].lane, -1);
  assert.equal(ctx.R.queue[1].type, "sheriff");
});
test("guaranteed supplies recur without rerolling a reward from duplicate ticks", () => {
  const { ctx, state } = harness();
  for (let i = 0; i < 24; i++) ctx.careerKill({ T: { boss: false } });
  assert.equal(state.loot.length, 2);
  ctx.expeditionTick(0.01);
  assert.equal(state.loot.length, 2);
});
test("extraction unlocks after completed wave 3 and cannot award twice", () => {
  const { ctx, state } = harness();
  ctx.R.wave = 2;
  ctx.R.phase = "shop";
  assert.equal(ctx.extractRun(), false);
  ctx.R.wave = 3;
  ctx.R.phase = "fight";
  assert.equal(ctx.extractRun(), false);
  ctx.R.phase = "shop";
  assert.equal(ctx.extractRun(), true);
  assert.equal(ctx.extractRun(), false);
  assert.equal(state.extracted, 1);
});
test("mortar hazards warn first, strike once, and remain bounded", () => {
  const { ctx, state, api } = harness();
  for (let i = 0; i < 30; i++) ctx.hazardAt([0, 0, 0], 1, 1);
  assert.equal(api.EXP.hazards.length, 12);
  ctx.expeditionTick(0.4);
  assert.equal(state.hits, 0);
  ctx.expeditionTick(0.7);
  assert.equal(state.hits, 12);
  ctx.expeditionTick(0.1);
  assert.equal(state.hits, 12);
});
test("fan projectiles have bounded counts and no homing surprise", () => {
  const { ctx } = harness();
  ctx.fanFire({ T: {} }, [0, 2, 0], 0.1, 999, [0, 1, 1]);
  assert.equal(ctx.eshots.length, 5);
  assert.ok(ctx.eshots.every((s) => s.home === 0));
});
test("dodge consumes stamina once, respects cooldown/pause and stays in arena", () => {
  const { ctx, state, api } = harness();
  assert.equal(ctx.startDodge(0, -1), true);
  assert.equal(api.MOBILITY.stamina, 75);
  assert.equal(ctx.startDodge(0, -1), false);
  ctx.flatMobility(1);
  assert.ok(Math.abs(ctx.PL.pos[1]) <= 5.5);
  state.paused = true;
  api.MOBILITY.dashCd = 0;
  assert.equal(ctx.startDodge(1, 0), false);
});
test("VR locomotion is opt-in and snap-turn requires a fresh stick deflection", () => {
  const { ctx, state } = harness();
  const session = {
    inputSources: [{ handedness: "right", gamepad: { axes: [0, 0, 0.9, 0] } }],
  };
  const pose = {
    transform: {
      matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0],
      position: { x: 0, y: 1.6, z: 0 },
    },
  };
  ctx.PLAY.vrMove = "room";
  assert.equal(ctx.xrLocomotion({}, pose, session, 0.02), false);
  ctx.PLAY.vrMove = "sticks";
  assert.equal(ctx.xrLocomotion({}, pose, session, 0.02), true);
  assert.equal(ctx.xrLocomotion({}, pose, session, 0.02), false);
  assert.equal(state.offset.position.y, 0);
  ctx.MR.on = true;
  assert.equal(ctx.xrLocomotion({}, pose, session, 0.02), false);
});
test("Warden shield blocks body hits until attack tell; head weakspot stays open", () => {
  const { ctx } = harness();
  ctx.flashes = [];
  const w = ctx.ETYPES.warden;
  const e = { state: "hold", x: 0, y: 0, z: 0 };
  assert.equal(w.onHit(e, 5, [0, 0, 0, 1, 1], [0, 0, 0]), true);
  assert.equal(w.onHit(e, 5, [0, 0, 0, 1, 2], [0, 0, 0]), false);
  e.state = "tele";
  assert.equal(w.onHit(e, 5, [0, 0, 0, 1, 1], [0, 0, 0]), false);
});

test("fast enemy shots use their full traveled segment for collision", () => {
  const { ctx } = harness();
  assert.ok(ctx.sweptHeadDistance([-2, 1.6, 0], [2, 1.6, 0]) < 0);
  assert.ok(ctx.sweptHeadDistance([-2, 1.6, 2], [2, 1.6, 2]) > 1);
});
test("clearing a wave removes outstanding enemy strike zones before shopping", () => {
  const { ctx, api, state } = harness();
  ctx.hazardAt([0, 0, 0], 1, 0.1);
  ctx.R.phase = "clear";
  ctx.expeditionTick(0.2);
  assert.equal(api.EXP.hazards.length, 0);
  assert.equal(state.hits, 0);
});
