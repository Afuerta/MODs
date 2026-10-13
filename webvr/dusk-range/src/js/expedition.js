"use strict";

// Frontier expansion: bounded combat patterns and rewards follow simulation time.
const CAREER_MILESTONES = [
  { id: "first", name: "FIRST BLOOD", stat: "kills", goal: 1, souls: 8 },
  { id: "hunter", name: "FRONTIER HUNTER", stat: "kills", goal: 50, souls: 25 },
  { id: "veteran", name: "DUSK VETERAN", stat: "kills", goal: 250, souls: 60 },
  { id: "deflector", name: "DEFLECTOR", stat: "parries", goal: 15, souls: 25 },
  { id: "boss", name: "GIANT SLAYER", stat: "bosses", goal: 3, souls: 50 },
  {
    id: "extract",
    name: "LIVE TO FIGHT",
    stat: "extractions",
    goal: 1,
    souls: 30,
  },
  {
    id: "runner",
    name: "RUN THE FRONTIER",
    stat: "extractions",
    goal: 5,
    souls: 80,
  },
  { id: "clean", name: "UNTOUCHABLE", stat: "clean", goal: 5, souls: 40 },
];
function normalizeCareer(raw) {
  const career = {
    kills: 0,
    bosses: 0,
    parries: 0,
    extractions: 0,
    clean: 0,
    medals: [],
  };
  for (const key of ["kills", "bosses", "parries", "extractions", "clean"])
    career[key] = metaInteger(raw && raw[key], 10000000);
  const known = new Set(CAREER_MILESTONES.map((item) => item.id));
  career.medals = Array.isArray(raw?.medals)
    ? [...new Set(raw.medals.filter((id) => known.has(id)))]
    : [];
  return career;
}
const CAREER = (() => {
  try {
    return normalizeCareer(
      JSON.parse(localStorage.getItem("dusk-range-career") || "null"),
    );
  } catch {
    return normalizeCareer(null);
  }
})();
function saveCareer() {
  // Career and soul rewards share the existing meta record for atomic claims.
  META.career = CAREER;
  saveMeta();
  try {
    localStorage.setItem("dusk-range-career", JSON.stringify(CAREER));
  } catch {}
}
// A meta record takes precedence so a failed secondary write cannot repeat rewards.
if (META.career) Object.assign(CAREER, normalizeCareer(META.career));
function claimCareerMilestones() {
  let earned = 0;
  for (const medal of CAREER_MILESTONES) {
    if (CAREER.medals.includes(medal.id) || CAREER[medal.stat] < medal.goal)
      continue;
    CAREER.medals.push(medal.id);
    earned += medal.souls;
    showBanner(medal.name, "+" + medal.souls + " souls · career milestone");
    sfx.pick();
  }
  if (earned) {
    META.souls += earned;
    META.total += earned;
  }
  saveCareer();
  return earned;
}
B.rift = makeBatch(MESH.cube, 512);
const EXP = {
  center: [0, 0],
  wave: 0,
  phase: "",
  supplies: 0,
  kills: 0,
  parries: 0,
  clean: 0,
  extraction: null,
  label: "",
  reward: 0,
  pulses: [],
  hazards: [],
};
const MOBILITY = {
  stamina: 100,
  dashCd: 0,
  dashing: 0,
  dashDir: [0, -1],
  pulse: 0,
};
const WAVE_EVENTS = [
  {
    name: "RIFT PATROL",
    detail: "Prism drones scatter energy fans",
    speed: 1,
    cd: 1,
  },
  {
    name: "RED SKY",
    detail: "Mortars paint the ground before they strike",
    speed: 1,
    cd: 0.92,
  },
  {
    name: "IRON FRONT",
    detail: "Wardens shield their body · target the head",
    speed: 0.97,
    cd: 1,
  },
  {
    name: "GHOST WIND",
    detail: "Faster hostiles · supply drops every 10 kills",
    speed: 1.12,
    cd: 1,
  },
];
function resetExpedition() {
  EXP.center = [ROOM.cx, ROOM.cz];
  EXP.wave = 0;
  EXP.phase = "";
  EXP.supplies = 0;
  EXP.kills = 0;
  EXP.parries = 0;
  EXP.clean = 0;
  EXP.extraction = null;
  EXP.label = "";
  EXP.reward = 0;
  EXP.pulses = [];
  EXP.hazards = [];
  MOBILITY.stamina = 100;
  MOBILITY.dashCd = 0;
  MOBILITY.dashing = 0;
}
function careerKill(enemy) {
  CAREER.kills++;
  if (enemy.T.boss) CAREER.bosses++;
  EXP.kills++;
  claimCareerMilestones();
  const every = EXP.label === "GHOST WIND" ? 10 : 12;
  if (EXP.kills % every === 0 && inRun()) {
    EXP.supplies++;
    if (R.perks.courier) healPlayer(1);
    const ahead = [
      headPos[0] + PL.fwd[0] * 2.4,
      1.3,
      headPos[2] + PL.fwd[2] * 2.4,
    ];
    dropLoot(
      ahead,
      PL.hearts < PL.max && EXP.supplies % 2
        ? "heart"
        : EXP.supplies % 3
          ? "mod"
          : "gun",
      EXP.supplies % 3 ? 1 : 2,
    );
    showBanner(
      "SUPPLY DROP",
      "Shoot the glowing drop · guaranteed every " + every + " eliminations",
    );
  }
}
function prepareExpeditionWave() {
  EXP.wave = R.wave;
  const event = WAVE_EVENTS[(R.wave - 1) % WAVE_EVENTS.length];
  EXP.label = event.name;
  EXP.reward = 12 + R.wave * 3;
  D.speed *= event.speed;
  D.cd *= event.cd;
  const roster =
    R.wave < 2
      ? ["prism"]
      : R.wave < 3
        ? ["prism", "mortar"]
        : ["prism", "mortar", "warden"];
  // Replace regular enemies, retain boss positions, wave sizes and spawn caps.
  const candidates = R.queue
    .map((entry, index) => ({ entry, index }))
    .filter(
      ({ entry }) =>
        !ETYPES[typeof entry === "string" ? entry : entry.type].boss,
    );
  const count = Math.min(roster.length, candidates.length);
  for (let i = 0; i < count; i++) {
    const { entry, index } =
      candidates[Math.floor(((i + 0.5) * candidates.length) / count)];
    const type = roster[i];
    R.queue[index] =
      typeof entry === "string"
        ? type
        : { ...entry, type, lane: type === "prism" ? -1 : entry.lane };
  }
  R.waveSize = R.queue.length;
  if (R.wave % 5 !== 0)
    showBanner(
      "WAVE " + R.wave + " · " + event.name,
      event.detail + " · clear bonus " + EXP.reward,
    );
}
function canExtract() {
  return (
    inRun() &&
    R.wave >= 3 &&
    ["clear", "pick", "picked", "shop", "build"].includes(R.phase) &&
    !R.lvlUp
  );
}
const EXTRACTION_LABEL = panel(256, 96, 0.8);
function paintExtractionLabel() {
  const ctx = EXTRACTION_LABEL.ctx;
  ctx.fillStyle = "#132b30";
  ctx.fillRect(0, 0, 256, 96);
  ctx.fillStyle = "#76efcf";
  ctx.fillRect(0, 0, 256, 6);
  ctx.textAlign = "center";
  ctx.font = `700 18px ${FB}`;
  ctx.fillText("SHOOT TO BANK YOUR RUN", 128, 29);
  ctx.font = `34px ${FD}`;
  ctx.fillText("EXTRACT +25%", 128, 70);
  upload(EXTRACTION_LABEL.tex, EXTRACTION_LABEL.cvs);
}
paintExtractionLabel();
function extractRun() {
  if (!canExtract()) return false;
  CAREER.extractions++;
  claimCareerMilestones();
  endRun(true);
  return true;
}
function expeditionTick(dt) {
  MOBILITY.dashCd = Math.max(0, MOBILITY.dashCd - dt);
  MOBILITY.pulse = Math.max(0, MOBILITY.pulse - dt * 2);
  if (!inRun()) {
    EXP.hazards = [];
    EXP.pulses = [];
    return;
  }
  if (R.wave && R.wave !== EXP.wave) prepareExpeditionWave();
  const parries = R.stat.parries || 0,
    clean = R.stat.clean || 0;
  if (parries > EXP.parries) {
    CAREER.parries += parries - EXP.parries;
    EXP.parries = parries;
    claimCareerMilestones();
  }
  if (clean > EXP.clean) {
    CAREER.clean += clean - EXP.clean;
    EXP.clean = clean;
    claimCareerMilestones();
  }
  if (R.phase === "clear" && EXP.phase !== "clear") {
    EXP.hazards = [];
    EXP.pulses = [];
    if (goldMode())
      R.kind === "td" ? tdGold(EXP.reward, null) : addGold(EXP.reward, null);
    else R.score += EXP.reward;
    gainXP(2 + Math.floor(R.wave / 3));
  }
  EXP.phase = R.phase;
  if (canExtract() && !EXP.extraction) {
    EXP.extraction = addTarget({
      kind: "loot",
      loot: { type: "extract" },
      slot: EXTRACTION_LABEL,
      col: [0.3, 1, 0.8],
      R: 0.3,
      x: headPos[0] + PL.fwd[0] * 2.6 + PL.fwd[2] * 1.4,
      y: 1.25,
      z: headPos[2] + PL.fwd[2] * 2.6 - PL.fwd[0] * 1.4,
      y1: 1.25,
      life: 1e9,
      scale: 0,
    });
  } else if (!canExtract() && EXP.extraction) {
    targets = targets.filter((t) => t !== EXP.extraction);
    EXP.extraction = null;
  }
  for (let i = EXP.hazards.length - 1; i >= 0; i--) {
    const hazard = EXP.hazards[i];
    hazard.t += dt;
    if (hazard.t >= hazard.delay && !hazard.fired) {
      hazard.fired = true;
      explodeAt(hazard.p, hazard.r, hazard.col, false);
      if (
        Math.hypot(headPos[0] - hazard.p[0], headPos[2] - hazard.p[2]) <
          hazard.r &&
        headPos[1] < hazard.p[1] + 2.6
      )
        hurtPlayer(1);
    }
    if (hazard.t > hazard.delay + 0.4) EXP.hazards.splice(i, 1);
  }
  for (let i = EXP.pulses.length - 1; i >= 0; i--) {
    const pulse = EXP.pulses[i];
    pulse.t += dt;
    if (pulse.t > 1.5) EXP.pulses.splice(i, 1);
  }
  // Trails are rate-limited, rather than appending one on every display frame.
  for (const shot of eshots) {
    if (!shot.v || !shot.col) continue;
    shot.trailT = (shot.trailT || 0) - dt;
    if (shot.trailT <= 0) {
      shot.trailT = 0.065;
      if (zaps.length < 100)
        zaps.push({
          kind: "streak",
          a: shot.p.slice(),
          b: shot.p.map((v, i) => v - shot.v[i] * 0.075),
          t: 0,
          max: 0.14,
          col: shot.col,
          w: 0.025,
        });
    }
  }
}
function hazardAt(p, radius = 1.1, delay = 1.15, origin = null) {
  if (EXP.hazards.length >= 12) return;
  EXP.hazards.push({
    p: [p[0], groundAt(p[0], p[2]) + 0.035, p[2]],
    r: radius,
    delay,
    t: 0,
    fired: false,
    origin,
    col: [1, 0.32, 0.14],
  });
}
function fanFire(enemy, origin, spread, count, color, speed = 6.6) {
  const cap = Math.min(5, count);
  for (let i = 0; i < cap && eshots.length < 90; i++) {
    const before = eshots.length;
    eFire(enemy, origin, "zap", {
      yawOff: (i - (cap - 1) / 2) * spread,
      speed,
    });
    const shot = eshots[before];
    if (shot) {
      shot.col = color.slice();
      shot.home = 0;
      shot.r = 0.13;
    }
  }
  EXP.pulses.push({ p: origin.slice(), col: color, t: 0 });
}
const RIFT_COL = [0.35, 0.72, 1.4],
  MORTAR_COL = [1, 0.5, 0.15],
  WARDEN_COL = [0.4, 1.2, 0.85];
function drawRiftEnemy(enemy, matrix) {
  const color = enemy.flash > 0 ? FLASH : enemy.T.eye;
  const tele = enemy.state === "tele" ? 1 + 0.6 * Math.sin(enemy.st * 18) : 1;
  if (enemy.type === "prism") {
    ep(
      EM.bubble,
      matrix,
      0,
      0,
      0,
      enemy.age * 0.7,
      0,
      0,
      0.4,
      0.38,
      0.4,
      [0.16, 0.22, 0.38],
      0.1,
    );
    ep(EM.bubble, matrix, 0, 0, 0.26, 0, 0, 0, 0.17, 0.17, 0.17, color, 1);
    for (let i = 0; i < 4; i++) {
      const a = enemy.age * 1.3 + (i * TAU) / 4;
      ep(
        EM.bar,
        matrix,
        Math.sin(a) * 0.66,
        Math.cos(a) * 0.66,
        0,
        a,
        0,
        0,
        0.32,
        0.1,
        0.18,
        [0.25, 0.3, 0.45],
        0.2,
      );
      ep(
        EM.bar,
        matrix,
        Math.sin(a) * 0.66,
        Math.cos(a) * 0.66,
        0.1,
        a,
        0,
        0,
        0.2,
        0.035,
        0.025,
        color,
        1,
      );
    }
  } else {
    drawBot(enemy, matrix, BOT);
    const warden = enemy.type === "warden";
    for (const side of [-1, 1]) {
      ep(
        EM.bar,
        matrix,
        side * 0.38,
        1.45,
        0,
        0,
        0,
        side * 0.2,
        0.22,
        0.4,
        0.3,
        [0.23, 0.3, 0.37],
        0.1,
      );
      ep(
        EM.bar,
        matrix,
        side * 0.38,
        1.45,
        0.17,
        0,
        0,
        0,
        0.1,
        0.24,
        0.025,
        color,
        1,
      );
      if (!warden)
        ep(
          EM.bar,
          matrix,
          side * 0.4,
          1.73,
          -0.1,
          0,
          -0.5,
          0,
          0.15,
          0.42,
          0.15,
          [0.34, 0.25, 0.2],
          0.1,
        );
    }
    if (warden && enemy.state !== "tele")
      ep(
        EM.bubble,
        matrix,
        0,
        1,
        0.38,
        0,
        0,
        0,
        0.65,
        0.8,
        0.14,
        color,
        0.85,
        0.24,
      );
  }
  const p = lw(enemy, 0, enemy.type === "prism" ? 0 : 1.6, 0.15);
  ppush(
    PT.glow,
    ...p,
    enemy.type === "prism" ? 0.7 : 0.3,
    color[0] * tele,
    color[1] * tele,
    color[2] * tele,
    0.5,
  );
}
Object.assign(ETYPES, {
  prism: {
    name: "PRISM DRONE",
    hp: 4,
    score: 65,
    gold: 45,
    brain: "flyer",
    speed: 2,
    standoff: [7, 11],
    alt: [2.4, 3.8],
    metal: true,
    eye: RIFT_COL,
    shoot: { cd: 3.4, tele: 0.95 },
    hit: [
      [0, 0, 0, 0.43, 1],
      [0, 0, 0.28, 0.17, 3],
    ],
    gib: [[0.18, 0.25, 0.4], RIFT_COL],
    fire(enemy) {
      fanFire(enemy, lw(enemy, 0, 0, 0.35), 0.14, 3, RIFT_COL);
    },
    draw: drawRiftEnemy,
  },
  mortar: {
    name: "ASH MORTAR",
    hp: 5,
    score: 75,
    gold: 55,
    brain: "walker",
    speed: 1.25,
    standoff: [8, 12],
    metal: true,
    eye: MORTAR_COL,
    shoot: { cd: 4.7, tele: 1.2 },
    hit: ETYPES.gunslinger.hit,
    gib: [[0.32, 0.23, 0.18], MORTAR_COL],
    fire(enemy) {
      const p = [headPos[0], 0, headPos[2]];
      hazardAt(p, 1.05, 1.2, lw(enemy, 0, 1.9, 0));
      hazardAt([p[0] + 1.7, 0, p[2] - 0.8], 0.8, 1.65, lw(enemy, 0.4, 1.9, 0));
      hazardAt([p[0] - 1.7, 0, p[2] - 0.8], 0.8, 1.65, lw(enemy, -0.4, 1.9, 0));
      EXP.pulses.push({ p: lw(enemy, 0, 1.8, 0), col: MORTAR_COL, t: 0 });
      sfx.throw(lw(enemy, 0, 1.7, 0));
    },
    draw: drawRiftEnemy,
  },
  warden: {
    name: "RIFT WARDEN",
    hp: 7,
    score: 95,
    gold: 75,
    brain: "walker",
    speed: 1.55,
    standoff: [5, 9],
    metal: true,
    eye: WARDEN_COL,
    shoot: { cd: 3.8, tele: 1.1 },
    hit: ETYPES.gunslinger.hit,
    gib: [[0.15, 0.3, 0.27], WARDEN_COL],
    fire(enemy) {
      fanFire(enemy, lw(enemy, 0, 1.25, 0.5), 0.11, 5, WARDEN_COL, 5.8);
    },
    onHit(enemy, damage, hb, p) {
      if (hb && hb[4] < 2 && enemy.state !== "tele") {
        flashes.push({ p: p.slice(), t: 0, s: 0.5, c: WARDEN_COL });
        enemy.blockT = (enemy.blockT || 0) + 1;
        if (enemy.blockT % 3 === 1)
          popup(
            "SHIELDED · AIM HIGH",
            "#89efce",
            [enemy.x, enemy.y + 2, enemy.z],
            0.8,
          );
        return true;
      }
      return false;
    },
    draw: drawRiftEnemy,
  },
});
COST.prism = 2.5;
COST.mortar = 3;
COST.warden = 3.5;
Object.assign(BOONS, {
  runner: {
    name: "QUICKSTEP",
    desc: "Dodge recharges 25% faster.",
    once: true,
    apply() {
      R.perks.runner = true;
    },
  },
  breath: {
    name: "SECOND WIND",
    desc: "Sprinting uses 35% less stamina.",
    once: true,
    apply() {
      R.perks.breath = true;
    },
  },
  courier: {
    name: "FIELD MEDIC",
    desc: "Heal one heart with every guaranteed supply drop.",
    once: true,
    apply() {
      R.perks.courier = true;
    },
  },
});

// Screen locomotion is separate from headset guardian boundaries.
function movementLimit() {
  return R.kind === "td" ? 3.5 : 5.5;
}
function clampMovement(x, z) {
  const limit = movementLimit(),
    dx = x - EXP.center[0],
    dz = z - EXP.center[1],
    distance = Math.hypot(dx, dz);
  if (distance <= limit) return [x, z];
  return [
    EXP.center[0] + (dx / distance) * limit,
    EXP.center[1] + (dz / distance) * limit,
  ];
}
function startDodge(dx, dz) {
  if (
    !inRun() ||
    screenPaused() ||
    (R.kind === "td" && TD.ko > 0) ||
    MOBILITY.dashCd > 0 ||
    MOBILITY.stamina < 25
  )
    return false;
  const length = Math.hypot(dx, dz) || 1;
  MOBILITY.dashDir = [dx / length, dz / length];
  MOBILITY.dashing = 0.18;
  MOBILITY.dashCd = R.perks.runner ? 1.8 : 2.4;
  MOBILITY.stamina -= 25;
  PL.invuln = Math.max(PL.invuln, 0.23);
  MOBILITY.pulse = 0.35;
  sfx.whoosh(headPos);
  return true;
}
function dodgeFlat() {
  const f = keyOn("w", "arrowup") - keyOn("s", "arrowdown"),
    side = keyOn("d") - keyOn("a");
  const forward = f || (!side ? 1 : 0);
  return startDodge(
    -Math.sin(baseYaw) * forward + Math.cos(baseYaw) * side,
    -Math.cos(baseYaw) * forward - Math.sin(baseYaw) * side,
  );
}
function flatMobility(dt) {
  if (!inRun()) return;
  const moving = keyOn("w", "a", "s", "d", "arrowup", "arrowdown");
  const sprint =
    keys.has("shift") && moving && MOBILITY.stamina > 1 && flatCrouch < 0.1;
  if (sprint)
    MOBILITY.stamina = Math.max(
      0,
      MOBILITY.stamina - dt * (R.perks.breath ? 12 : 19),
    );
  else MOBILITY.stamina = Math.min(100, MOBILITY.stamina + dt * 17);
  if (MOBILITY.dashing > 0) {
    const used = Math.min(dt, MOBILITY.dashing);
    MOBILITY.dashing -= used;
    [PL.pos[0], PL.pos[1]] = clampMovement(
      PL.pos[0] + MOBILITY.dashDir[0] * 11 * used,
      PL.pos[1] + MOBILITY.dashDir[1] * 11 * used,
    );
  }
  return sprint ? 1.65 : 1;
}

const ENV_PROPS = (() => {
  const rng = mulberry(3817),
    items = [];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * TAU,
      r = 25 + rng() * 35;
    items.push({
      x: Math.sin(a) * r,
      z: -Math.cos(a) * r,
      h: 3 + rng() * 11,
      phase: rng() * TAU,
    });
  }
  return items;
})();
function expansionBox(x, y, z, w, h, d, col, rot = 0) {
  bpush(B.rift, x, y, z, w, h, d, rot, 0, 0, ...col, 1);
}
function expansionRing(p, r, col, phase = 0, y = 0.06) {
  for (let i = 0; i < 18; i++) {
    const a = (i * TAU) / 18 + phase;
    expansionBox(
      p[0] + Math.sin(a) * r,
      p[1] + y,
      p[2] + Math.cos(a) * r,
      0.035,
      0.035,
      r * 0.29,
      col,
      a,
    );
  }
}
function buildExpeditionFrame() {
  if (!MR.on) {
    for (const [i, prop] of ENV_PROPS.entries()) {
      if (MAP.cur === "range") {
        expansionBox(
          prop.x,
          prop.h * 0.5,
          prop.z,
          1.5,
          prop.h,
          1.4,
          [0.31, 0.21, 0.29],
          prop.phase,
        );
        expansionBox(
          prop.x,
          prop.h + 0.3,
          prop.z,
          0.24,
          0.65,
          0.24,
          [0.35, 0.62, 1],
          clock * 0.2 + prop.phase,
        );
      } else if (MAP.cur === "night") {
        const phase = clock * 0.65 + prop.phase;
        ppush(
          PT.glow,
          prop.x * 0.58,
          2.4 + Math.sin(phase) * 1.2,
          prop.z * 0.58,
          0.14,
          0.35,
          1,
          0.67,
          0.55,
        );
        if (i < 10) {
          expansionBox(
            prop.x * 0.7,
            prop.h * 0.4,
            prop.z * 0.7,
            0.22,
            prop.h * 0.8,
            0.22,
            [0.14, 0.23, 0.21],
            prop.phase,
          );
          expansionBox(
            prop.x * 0.7,
            prop.h * 0.8,
            prop.z * 0.7,
            0.14,
            0.25,
            0.14,
            [0.24, 0.83, 0.48],
            clock * 0.7,
          );
        }
      } else if (MAP.cur === "city") {
        const r = 40 + i * 1.1,
          a = prop.phase + clock * 0.025;
        ppush(
          PT.glow,
          Math.sin(a) * r,
          20 + (i % 6),
          Math.cos(a) * r - 30,
          0.3,
          0.4,
          0.65,
          1,
          0.7,
        );
        if (i < 14) {
          expansionBox(
            prop.x,
            12 + prop.h,
            prop.z - 30,
            0.13,
            prop.h * 1.2,
            0.13,
            [0.25, 0.38, 0.58],
          );
          expansionBox(
            prop.x,
            12 + prop.h * 1.6,
            prop.z - 30,
            0.4,
            0.18,
            0.4,
            [0.4, 0.83, 1],
          );
        }
      }
    }
    // A layered ribbon in the distance; it never covers near combat targets.
    for (let i = 0; i < 24; i++) {
      const x = (i - 12) * 4,
        y = 34 + Math.sin(i * 0.25 + clock * 0.16) * 3;
      const col =
        MAP.cur === "night"
          ? [0.12, 0.35, 0.28]
          : MAP.cur === "city"
            ? [0.18, 0.28, 0.52]
            : [0.34, 0.18, 0.4];
      ppush(PT.glow, x, y + 15, -95, 14, col[0], col[1], col[2], 0.045);
    }
  }
  for (const enemy of enemies) {
    if (
      enemy.state !== "tele" ||
      !["prism", "mortar", "warden"].includes(enemy.type)
    )
      continue;
    const p = lw(enemy, 0, enemy.type === "prism" ? 0 : 1.3, 0.4),
      col = enemy.T.eye;
    const charging = clamp(enemy.st / enemy.T.shoot.tele, 0, 1);
    ppush(PT.glow, ...p, 0.5 + charging * 0.7, ...col, 0.3 + charging * 0.5);
    if (enemy.type === "mortar")
      expansionRing(
        [headPos[0], groundAt(headPos[0], headPos[2]), headPos[2]],
        0.7 + charging * 0.45,
        [1, 0.4, 0.14],
        0,
      );
  }
  for (const hazard of EXP.hazards) {
    if (hazard.fired) continue;
    expansionRing(hazard.p, hazard.r, hazard.col, hazard.t * 0.8);
    if (hazard.origin) {
      const k = clamp(hazard.t / hazard.delay, 0, 1),
        p = hazard.p.map((v, i) => lerp(hazard.origin[i], v, k));
      p[1] += Math.sin(k * Math.PI) * 4;
      ppush(PT.glow, ...p, 0.28, ...hazard.col, 0.85);
      bpush(
        B.shard,
        ...p,
        0.13,
        0.2,
        0.13,
        hazard.t * 10,
        0,
        0,
        ...hazard.col,
        1,
      );
    }
    ppush(
      PT.glow,
      hazard.p[0],
      hazard.p[1] + 0.08,
      hazard.p[2],
      0.35,
      ...hazard.col,
      0.35 + 0.3 * Math.sin(hazard.t * 20),
    );
  }
  for (const pulse of EXP.pulses)
    expansionRing(pulse.p, 0.25 + pulse.t * 0.7, pulse.col, pulse.t, 0);
}

const XR_MOVE = { snap: false, lastSession: null };
function stickValue(value) {
  return Math.abs(value || 0) < 0.2
    ? 0
    : (Math.sign(value) * (Math.min(1, Math.abs(value)) - 0.2)) / 0.8;
}
function xrLocomotion(frame, pose, session, dt) {
  if (
    typeof PLAY === "undefined" ||
    PLAY.vrMove !== "sticks" ||
    MR.on ||
    !inRun() ||
    !refSpace ||
    dt <= 0
  )
    return false;
  if (XR_MOVE.lastSession !== session) {
    XR_MOVE.lastSession = session;
    XR_MOVE.snap = false;
  }
  const left = Array.from(session.inputSources).find(
    (source) => source.handedness === "left" && source.gamepad,
  );
  const right = Array.from(session.inputSources).find(
    (source) => source.handedness === "right" && source.gamepad,
  );
  const axes = left?.gamepad?.axes || [],
    turn = right?.gamepad?.axes || [];
  const side = stickValue(axes.length >= 4 ? axes[2] : axes[0]),
    forward = -stickValue(axes.length >= 4 ? axes[3] : axes[1]);
  const snap = turn.length >= 4 ? turn[2] : turn[0] || 0;
  if (Math.abs(snap) < 0.25) XR_MOVE.snap = false;
  const matrix = pose.transform.matrix,
    p = pose.transform.position;
  let dx = 0,
    dz = 0,
    angle = 0;
  if (side || forward) {
    const facing = norm([-matrix[8], 0, -matrix[10]]),
      length = Math.max(1, Math.hypot(side, forward));
    dx = ((facing[0] * forward - facing[2] * side) * 2 * dt) / length;
    dz = ((facing[2] * forward + facing[0] * side) * 2 * dt) / length;
    const [x, z] = clampMovement(p.x + dx, p.z + dz);
    dx = x - p.x;
    dz = z - p.z;
  }
  if (Math.abs(snap) > 0.65 && !XR_MOVE.snap) {
    angle = (Math.sign(snap) * Math.PI) / 6;
    XR_MOVE.snap = true;
  }
  if (!dx && !dz && !angle) return false;
  // The offset inverse transforms viewer and controller poses together.
  const c = Math.cos(angle),
    s = Math.sin(angle);
  const position = {
    x: p.x - c * p.x - s * p.z - dx,
    y: 0,
    z: p.z + s * p.x - c * p.z - dz,
  };
  const rotation = {
    x: 0,
    y: Math.sin(angle / 2),
    z: 0,
    w: Math.cos(angle / 2),
  };
  refSpace = refSpace.getOffsetReferenceSpace(
    new XRRigidTransform(position, rotation),
  );
  if (boundedSpace) boundsPending = true;
  return true;
}

function sweptHeadDistance(start, end) {
  const delta = end.map((v, i) => v - start[i]),
    len = delta.reduce((n, v) => n + v * v, 0);
  if (len < 1e-9) return headDist(end);
  let distance = Infinity;
  for (const y of [
    headPos[1],
    headPos[1] - 0.55,
    Math.max(0.3, headPos[1] - 1.05),
  ]) {
    const center = [headPos[0], y, headPos[2]],
      fraction = clamp(
        center.reduce((n, v, i) => n + (v - start[i]) * delta[i], 0) / len,
        0,
        1,
      );
    distance = Math.min(
      distance,
      headDist(start.map((v, i) => v + delta[i] * fraction)),
    );
  }
  return distance;
}
