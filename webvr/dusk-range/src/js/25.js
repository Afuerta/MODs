"use strict";
let enemies = [],
  eshots = [],
  pshots = [],
  zaps = [];
const D = { hp: 1, speed: 1, cd: 1, proj: 1, dodge: 0 },
  FLASH = [2.4, 2.3, 2.2],
  MPOOL = [];
let mpi = 0;
const pm = () => (
    mpi >= MPOOL.length && MPOOL.push(new Float32Array(16)),
    MPOOL[mpi++]
  ),
  LOC = m4(),
  EDL = [];
function ep(s, t, a, o, n, h, i, r, l, f, c, p, d, e) {
  trs(LOC, a, o, n, h, i, r, l, f, c);
  const M = pm();
  return (
    mul(M, t, LOC),
    EDL.push({ mesh: s, m: M, tint: p || W1, emit: d || 0, alpha: e ?? 1 }),
    M
  );
}
function epw(s, t, a, o, n, h, i, r, l, f, c, p, d) {
  const e = trs(pm(), t, a, o, n, h, i, r, l, f);
  return (
    EDL.push({ mesh: s, m: e, tint: c || W1, emit: p || 0, alpha: d ?? 1 }),
    e
  );
}
const angTo = (s, t, a) => {
  let o = t - s;
  for (; o > Math.PI;) o -= TAU;
  for (; o < -Math.PI;) o += TAU;
  return s + o * Math.min(1, a);
};
function groundAt(s, t) {
  if (MAP.cur === "night") return nightGround(s, t);
  if (MAP.cur === "city") return 0;
  let a = groundH(s, t);
  const o = Math.hypot(s, t),
    n = Math.atan2(s, -t);
  if (Math.abs(n) < BERM_ARC)
    for (const h of BERMS) {
      const i = Math.abs(o - h.r);
      i < 0.9 && (a = Math.max(a, h.h * (1 - smooth(0.2, 0.9, i))));
    }
  return a;
}
function arenaPoint(s, t) {
  return (
    MAP.cur === "night"
      ? (t = Math.min(t, 14.5 - Math.hypot(ROOM.cx, ROOM.cz)))
      : MAP.cur === "city"
        ? (t = Math.min(t, 34))
        : Math.abs(Math.atan2(Math.sin(s), Math.cos(s))) < WALL_ARC + 0.08 &&
          (t = Math.min(t, WALL_R - 1.4 - Math.hypot(ROOM.cx, ROOM.cz))),
    [ROOM.cx + Math.sin(s) * t, ROOM.cz - Math.cos(s) * t]
  );
}
const toHead = (s) => Math.atan2(headPos[0] - s.x, headPos[2] - s.z),
  hdist = (s) => Math.hypot(headPos[0] - s.x, headPos[2] - s.z);
function spawnAngle() {
  return xrSession ? rand(0, TAU) : PL.viewA + rand(-1.15, 1.15);
}
const BOT = {
    torso: "gsTorso",
    head: "gsHead",
    eyes: "gsVisor",
    leg: "gsLeg",
    arm: "gsArm",
    gun: "gsGunArm",
  },
  SKEL = {
    torso: "skTorso",
    head: "skHead",
    eyes: "skEyes",
    leg: "skLeg",
    arm: "skArm",
    gun: "skGunArm",
  },
  ETYPES = {
    gunslinger: {
      name: "BANDIT BOT",
      hp: 3,
      score: 40,
      brain: "walker",
      speed: 1.6,
      standoff: [6, 11],
      metal: !0,
      eye: [1, 0.35, 0.2],
      shoot: { cd: 2.8, tele: 0.65, kind: "bolt", speed: 7.5 },
      dodge: { kind: "step", chance: 0.45, cd: 2.4, dist: 1.9, aim: 0.3 },
      hit: [
        [0, 1.1, 0, 0.34, 1],
        [0, 1.6, 0, 0.2, 2],
        [0, 0.45, 0, 0.25, 1],
      ],
      gib: [C.botPlate, C.botRust, C.botDark],
      fire(s) {
        eFire(s, lw(s, 0.3, 1.3, 0.66), "bolt");
      },
      draw(s, t) {
        drawBot(s, t, BOT);
      },
    },
    dynamiter: {
      name: "DYNAMITER",
      hp: 2,
      score: 50,
      brain: "walker",
      speed: 1.3,
      standoff: [9, 13],
      metal: !0,
      eye: [1, 0.85, 0.4],
      shoot: { cd: 3.6, tele: 0.85, kind: "lob" },
      hit: [
        [0, 0.8, 0, 0.4, 1],
        [0, 1.3, 0.02, 0.17, 2],
      ],
      gib: [C.barrel, C.band, C.helmet],
      fire(s) {
        (eFire(s, lw(s, 0.36, 1.6, -0.1), "lob", { flight: 1.45 }),
          sfx.throw([s.x, s.y + 1.5, s.z]));
      },
      draw: drawDyn,
    },
    saucer: {
      name: "SAUCER",
      hp: 2,
      score: 50,
      brain: "flyer",
      speed: 2.2,
      standoff: [7, 12],
      alt: [3, 5.5],
      metal: !0,
      shoot: { cd: 2.4, tele: 0.5, kind: "zap", speed: 10 },
      dodge: { kind: "blink", chance: 0.55, cd: 2, dist: 2.6, aim: 0.25 },
      hit: [
        [0, 0.04, 0, 0.62, 1],
        [0, 0.2, 0, 0.22, 2],
      ],
      gib: [C.hull, C.hullDk, C.alien],
      fire(s) {
        for (const t of [-1, 1])
          eFire(s, lw(s, t * 0.5, -0.02, 0.2), "zap", { yawOff: t * 0.03 });
      },
      draw: drawSaucer,
    },
    blob: {
      name: "GLOOP",
      hp: 4,
      score: 45,
      brain: "hopper",
      speed: 1.3,
      melee: { range: 0.75 },
      split: "miniblob",
      hit: [
        [0, 0.45, 0, 0.48, 1],
        [0, 1, 0.1, 0.16, 2],
      ],
      gib: [C.blob, C.blobCore],
      draw: drawBlob,
    },
    miniblob: {
      name: "GLOOP",
      hp: 1,
      score: 15,
      brain: "hopper",
      speed: 2,
      scale: 0.55,
      melee: { range: 0.6 },
      hit: [[0, 0.45, 0, 0.5, 1]],
      gib: [C.blob, C.blobCore],
      draw: drawBlob,
    },
    scorpion: {
      name: "SCORPION",
      hp: 3,
      score: 45,
      brain: "charger",
      speed: 2.3,
      scale: 1.25,
      melee: { range: 1.25, reach: 1.55, tele: 0.55 },
      dodge: { kind: "step", chance: 0.4, cd: 2.2, dist: 1.4, aim: 0.35 },
      hit: [
        [0, 0.32, 0.05, 0.42, 1],
        [0, 0.95, -0.3, 0.17, 2],
      ],
      gib: [C.scorp, C.scorpLt, C.sting],
      draw: drawScorp,
    },
    buzzard: {
      name: "BUZZARD",
      hp: 1,
      score: 35,
      brain: "diver",
      speed: 9.5,
      scale: 1.3,
      hit: [[0, 0, 0, 0.42, 1]],
      gib: [C.feather, C.featherLt, C.neck],
      draw: drawBuzz,
    },
    skeleton: {
      name: "BONESLINGER",
      hp: 2,
      score: 40,
      brain: "walker",
      speed: 1.4,
      standoff: [6, 11],
      eye: [0.5, 1, 0.4],
      shoot: { cd: 3, tele: 0.7, kind: "orb", speed: 4.2 },
      dodge: { kind: "step", chance: 0.35, cd: 2.6, dist: 1.5, aim: 0.35 },
      hit: [
        [0, 1.1, 0, 0.3, 1],
        [0, 1.6, 0, 0.18, 2],
        [0, 0.45, 0, 0.22, 1],
      ],
      gib: [C.bone, C.boneDk],
      fire(s) {
        eFire(s, lw(s, 0.3, 1.3, 0.68), "orb");
      },
      draw(s, t) {
        drawBot(s, t, SKEL);
      },
    },
    ghost: {
      name: "SPOOK",
      hp: 2,
      score: 45,
      brain: "phaser",
      speed: 1.25,
      ghost: !0,
      dodge: { kind: "phase", chance: 0.65, cd: 2.4, aim: 0.3 },
      hit: [
        [0, 1.35, 0, 0.38, 1],
        [0, 1.65, 0.06, 0.2, 2],
      ],
      gib: [C.ghost, C.ghostDk],
      draw: drawGhost,
    },
    sheriff: {
      name: "IRON SHERIFF",
      boss: !0,
      hp: 36,
      score: 600,
      brain: "sheriff",
      scale: 3,
      metal: !0,
      eye: [1, 0.35, 0.2],
      summon: "gunslinger",
      bolt: "bolt",
      shoot: { tele: 1 },
      gib: [C.botPlate, C.botRust, C.botDark, C.badge],
      draw: drawSheriff,
      onHit: sheriffHit,
    },
    marshal: {
      name: "PHANTOM MARSHAL",
      boss: !0,
      hp: 34,
      score: 650,
      brain: "sheriff",
      scale: 3,
      eye: [0.5, 1, 0.4],
      summon: "ghost",
      bolt: "orb",
      phasing: !0,
      shoot: { tele: 1 },
      gib: [C.ghost, C.ghostDk, C.bone],
      draw: drawSheriff,
      onHit: sheriffHit,
    },
    mothership: {
      name: "MOTHERSHIP",
      boss: !0,
      hp: 30,
      score: 700,
      brain: "mothership",
      scale: 5,
      metal: !0,
      summon: "saucer",
      gib: [C.hull, C.hullDk, C.alien],
      draw: drawMother,
      onHit: motherHit,
    },
    wyrm: {
      name: "SAND WYRM",
      boss: !0,
      hp: 34,
      score: 700,
      brain: "wyrm",
      scale: 1.35,
      customHB: !0,
      gib: [C.wyrm, C.wyrmDk, C.wyrmBelly, C.acid],
      draw: drawWyrm,
      onHit: wyrmHit,
    },
  };
function makeEnemy(s, t, a, o = {}) {
  const n = ETYPES[s],
    h = Object.assign(
      {
        type: s,
        T: n,
        x: t,
        z: a,
        y: 0,
        s: n.scale || 1,
        hp: n.hp * (n.boss ? 1 + (D.hp - 1) * 0.6 : D.hp),
        age: 0,
        st: 0,
        state: "spawn",
        rise: 0,
        cd: n.shoot && n.shoot.cd ? n.shoot.cd * rand(0.5, 1) : 2,
        aimT: 0,
        dodgeCd: 1.2,
        flash: 0,
        lean: 0,
        walk: rand(0, 6),
        alpha: 1,
        hbw: [],
        recoil: 0,
        kx: 0,
        kz: 0,
        phased: 0,
        faceYaw: 0,
        spin: 0,
      },
      o,
    );
  return (
    (h.yaw = h.faceYaw = toHead(h)),
    (h.maxHp = h.hp),
    enemies.push(h),
    h
  );
}
function spawnEnemy(s, t) {
  const a = ETYPES[s],
    o = t
      ? Math.atan2(t[0] - ROOM.cx, -(t[1] - ROOM.cz)) + rand(-0.4, 0.4)
      : spawnAngle();
  let n;
  if (a.brain === "walker") {
    const h =
        ROOM.r +
        (t
          ? Math.hypot(t[0] - ROOM.cx, t[1] - ROOM.cz) - ROOM.r - rand(1, 3)
          : rand(...a.standoff)),
      [i, r] = (!t && portalSpot()) || arenaPoint(o, Math.max(ROOM.r + 4, h));
    ((n = makeEnemy(s, i, r, { gx: i, gz: r })),
      (n.y = groundAt(i, r) - 1.9),
      sfx.rise([i, 0.5, r]),
      puff([i, 0.3, r], 8, [0.78, 0.6, 0.5], 0.4, 1.2));
  } else if (a.brain === "flyer") {
    const h = ROOM.r + rand(...a.standoff),
      [i, r] = arenaPoint(o, h + 6);
    ((n = makeEnemy(s, i, r, {
      ang: o,
      orbR: h,
      alt: rand(...a.alt),
      w: (Math.random() < 0.5 ? -1 : 1) * rand(0.18, 0.32),
      y0: 18,
    })),
      (n.y = 18));
  } else if (a.brain === "hopper") {
    const [h, i] = t || portalSpot() || arenaPoint(o, ROOM.r + rand(8, 12));
    ((n = makeEnemy(s, h, i, { vy: 0, hopT: 0, atkCd: 0.5 })),
      (n.y = t ? groundAt(h, i) + 0.3 : 12),
      (n.state = t ? "move" : "spawn"));
  } else if (a.brain === "charger") {
    const [h, i] = portalSpot() || arenaPoint(o, ROOM.r + rand(10, 14));
    ((n = makeEnemy(s, h, i, { zig: rand(0, 6) })),
      (n.y = -1),
      sfx.rise([h, 0.3, i]),
      puff([h, 0.2, i], 8, [0.78, 0.6, 0.5], 0.4, 1.2));
  } else if (a.brain === "diver") {
    const [h, i] = arenaPoint(o, 22);
    ((n = makeEnemy(s, h, i, {
      ang: o,
      circR: rand(7, 9),
      alt: rand(8, 11),
      w: (Math.random() < 0.5 ? -1 : 1) * 0.55,
      timer: rand(2.5, 4.5),
    })),
      (n.y = 15),
      (n.state = "circle"));
  } else if (a.brain === "phaser") {
    const [h, i] = t || portalSpot() || arenaPoint(o, ROOM.r + rand(10, 14));
    ((n = makeEnemy(s, h, i, { weave: rand(0, 6), phaseT: rand(3, 5) })),
      (n.y = headPos[1] - 1.55),
      (n.alpha = 0),
      sfx.moan([h, 1.5, i]));
  } else if (s === "sheriff" || s === "marshal") {
    const h = PL.viewA + rand(-0.3, 0.3),
      [i, r] = arenaPoint(h, ROOM.r + 13);
    ((n = makeEnemy(s, i, r, {
      gx: i,
      gz: r,
      cannons: [
        { hp: 9 * D.hp, alive: !0, glow: 0 },
        { hp: 9 * D.hp, alive: !0, glow: 0 },
      ],
      atk: 0,
      summonT: 13,
      strafe: 1,
      phaseT: 6,
    })),
      (n.y = -6),
      sfx.roar([i, 2, r]),
      puff([i, 0.5, r], 20, [0.78, 0.6, 0.5], 1.2, 2.5));
  } else if (s === "mothership") {
    const h = PL.viewA + rand(-0.4, 0.4);
    ((n = makeEnemy(s, ...arenaPoint(h, ROOM.r + 14), {
      ang: h,
      orbR: ROOM.r + 14,
      alt: 10.5,
      pods: [0, 1, 2].map((i) => ({
        hp: 9 * D.hp,
        alive: !0,
        off: (i * TAU) / 3,
        cd: 2 + i * 0.8,
      })),
      summonT: 15,
    })),
      (n.y = 45),
      sfx.roar([n.x, 20, n.z]));
  } else
    s === "wyrm" &&
      ((n = makeEnemy(s, ROOM.cx, ROOM.cz - 12, {
        arcT: -1.2,
        segs: 14,
        S: [0, 0],
        E: [0, 0],
        peak: 6,
        dur: 3.4,
        spit: 0,
      })),
      (n.y = -5),
      (n.state = "under"));
  return n;
}
function lw(s, t, a, o) {
  const n = Math.cos(s.yaw),
    h = Math.sin(s.yaw),
    i = s.s;
  return [s.x + (n * t + h * o) * i, s.y + a * i, s.z + (-h * t + n * o) * i];
}
function updateHitboxes(s) {
  if (s.T.customHB) return;
  const t = s.hbList || s.T.hit;
  s.hbw.length = 0;
  for (const a of t) {
    const o = lw(s, a[0], a[1], a[2]);
    s.hbw.push([o[0], o[1], o[2], a[3] * s.s, a[4], a[5]]);
  }
}
function aimedAt(s) {
  const t = s.hbw[0];
  if (!t) return !1;
  for (const a of guns) {
    if (!a.ray) continue;
    const o = a.ray.o,
      n = a.ray.d,
      h = t[0] - o[0],
      i = t[1] - o[1],
      r = t[2] - o[2],
      l = h * n[0] + i * n[1] + r * n[2];
    if (l > 0 && h * h + i * i + r * r - l * l < t[3] * 2.2 * (t[3] * 2.2))
      return !0;
  }
  return !1;
}
function tryDodge(s, t) {
  const a = s.T.dodge;
  !a ||
    s.state === "spawn" ||
    s.dodge ||
    (s.T.brain === "charger" && s.state === "tele") ||
    ((s.dodgeCd -= t),
    (s.aimT = aimedAt(s) ? s.aimT + t : Math.max(0, s.aimT - t * 1.5)),
    s.aimT > a.aim &&
      s.dodgeCd <= 0 &&
      ((s.aimT = 0),
      Math.random() < a.chance + D.dodge
        ? (doDodge(s, a), (s.dodgeCd = a.cd * rand(0.85, 1.25)))
        : (s.dodgeCd = 0.7)));
}
function flinch(s) {
  s.T.dodge && (s.aimT += 0.25);
}
function doDodge(s, t) {
  const a = toHead(s),
    o = Math.random() < 0.5 ? -1 : 1,
    n = Math.cos(a) * o,
    h = -Math.sin(a) * o;
  if (t.kind === "step")
    ((s.dodge = {
      t: 0,
      dur: 0.26,
      vx: (n * t.dist) / 0.26,
      vz: (h * t.dist) / 0.26,
    }),
      (s.lean = o),
      puff([s.x, s.y + 0.1, s.z], 4, [0.78, 0.6, 0.5], 0.25, 0.8),
      sfx.whoosh([s.x, s.y + 1, s.z]),
      zaps.push({
        kind: "streak",
        a: [s.x, s.y + 1 * s.s, s.z],
        b: [s.x + n * t.dist, s.y + 1 * s.s, s.z + h * t.dist],
        t: 0,
        max: 0.22,
        col: [1, 0.8, 0.6],
        w: 0.25,
      }));
  else if (t.kind === "blink") {
    const i = [s.x, s.y, s.z];
    ((s.x += n * t.dist),
      (s.z += h * t.dist),
      (s.alt = clamp(s.alt + rand(-0.8, 0.8), 2.6, 6.5)),
      (s.y = s.alt),
      (s.ang = Math.atan2(s.x - ROOM.cx, -(s.z - ROOM.cz))));
    for (const r of [i, [s.x, s.y, s.z]])
      (flashes.push({ p: r, t: 0, s: 1.2, c: [0.5, 1, 0.8] }),
        shocks.push({ p: r, t: 0, r: 0.6, col: [0.4, 1, 0.7] }));
    sfx.blink(i);
  } else
    t.kind === "phase" && ((s.phased = 1.3), sfx.moan([s.x, s.y + 1.5, s.z]));
}
function eFire(s, t, a, o = {}) {
  const n = s.T.shoot || {},
    h = R.perks.slow ? 0.75 : 1;
  if (a === "lob" || a === "acid") {
    const i = [headPos[0] + rand(-0.5, 0.5), 0, headPos[2] + rand(-0.5, 0.5)];
    i[1] = groundAt(i[0], i[2]);
    const r = (o.flight || 1.45) / (D.proj * h),
      f = [
        (i[0] - t[0]) / r,
        (i[1] - t[1] + 0.5 * 9.8 * r * r) / r,
        (i[2] - t[2]) / r,
      ];
    eshots.push({
      kind: "lob",
      acid: a === "acid",
      stone: !!o.stone,
      p: t.slice(),
      v: f,
      r: o.stone ? 0.35 : 0.22,
      land: i,
      fuse: -1,
      blast: a === "acid" ? 1.1 : o.stone ? 1.6 : 1.25,
      life: 8,
      spin: 0,
    });
  } else {
    const i = (o.speed || n.speed || 7.5) * D.proj * h,
      r = [
        headPos[0] + rand(-0.12, 0.12),
        headPos[1] - 0.18 + rand(-0.12, 0.08),
        headPos[2] + rand(-0.12, 0.12),
      ];
    let l = norm([r[0] - t[0], r[1] - t[1], r[2] - t[2]]);
    if (o.yawOff) {
      const c = Math.cos(o.yawOff),
        p = Math.sin(o.yawOff);
      l = [c * l[0] + p * l[2], l[1], -p * l[0] + c * l[2]];
    }
    const f =
      a === "zap"
        ? [0.4, 1, 0.7]
        : a === "orb"
          ? [0.55, 1, 0.4]
          : a === "fire"
            ? [1, 0.55, 0.15]
            : [1, 0.42, 0.22];
    eshots.push({
      kind: a,
      p: t.slice(),
      v: scale3(l, i),
      r: a === "orb" ? 0.17 : 0.12,
      col: f,
      life: 7,
      home: a === "orb" ? 1 : 0,
      whoosh: !1,
    });
  }
  (flashes.push({
    p: t.slice(),
    t: 0,
    s: 0.7,
    c:
      a === "zap" ? [0.5, 1, 0.8] : a === "orb" ? [0.6, 1, 0.5] : [1, 0.6, 0.3],
  }),
    a !== "lob" && sfx.eshot(t, a));
}
function explodeAt(s, t, a, o) {
  for (let n = 0; n < (o ? 26 : 14); n++) {
    const h = rdir(0.6),
      i = rand(2, 6);
    part(
      "shard",
      s,
      [h[0] * i, h[1] * i, h[2] * i],
      [rand(0.02, 0.05), rand(0.02, 0.05), rand(0.02, 0.05)],
      n % 3 ? a : C.flash,
      rand(0.5, 1.1),
      { grav: 7, glow: n % 4 === 0 ? 1 : 0 },
    );
  }
  (puff(s, o ? 14 : 8, [0.42, 0.34, 0.38], t * 0.6, 2.2),
    puff(s, 6, [1, 0.6, 0.3], t * 0.4, 1.4),
    shocks.push({ p: s.slice(), t: 0, r: t * 1.1, col: [1, 0.65, 0.3] }),
    flashes.push({ p: s.slice(), t: 0, s: t * 2.4, c: [1, 0.7, 0.4] }),
    sfx.explode(s, o));
}
function explodeLob(s) {
  explodeAt(s.p, s.blast, s.acid ? C.acid : [1, 0.55, 0.2], !1);
  const t = headPos[0] - s.p[0],
    a = headPos[2] - s.p[2];
  Math.hypot(t, a) < s.blast && headPos[1] < s.p[1] + 2.4 && hurtPlayer(1);
}
function shootDown(s) {
  const t = eshots.indexOf(s);
  if (!(t < 0)) {
    if ((eshots.splice(t, 1), s.kind === "lob")) explodeLob(s);
    else {
      flashes.push({ p: s.p.slice(), t: 0, s: 0.8, c: s.col });
      for (let a = 0; a < 6; a++) {
        const o = rdir(0.2),
          n = rand(1, 3);
        part(
          "shard",
          s.p,
          [o[0] * n, o[1] * n, o[2] * n],
          [0.02, 0.02, 0.02],
          s.col,
          0.4,
          { grav: 3, glow: 1 },
        );
      }
    }
    (inRun() &&
      ((R.score += 5),
      (R.stat.parries = (R.stat.parries || 0) + 1),
      popup("+5", "#b9f4ff", [s.p[0], s.p[1] + 0.3, s.p[2]], 0.6)),
      sfx.parry(s.p));
  }
}
function updateEShots(s) {
  for (let t = eshots.length - 1; t >= 0; t--) {
    const a = eshots[t];
    if (a) {
      if (((a.life -= s), a.kind === "rift")) {
        if (updateRifts(a, s) || a.life <= 0) {
          const o = eshots.indexOf(a);
          o >= 0 && eshots.splice(o, 1);
        }
        continue;
      }
      if (a.kind === "hands") {
        if (updateHands(a, s) || a.life <= 0) {
          const o = eshots.indexOf(a);
          o >= 0 && eshots.splice(o, 1);
        }
        continue;
      }
      if (a.kind === "lob") {
        if (a.fuse < 0)
          ((a.v[1] -= 9.8 * s),
            (a.p[0] += a.v[0] * s),
            (a.p[1] += a.v[1] * s),
            (a.p[2] += a.v[2] * s),
            (a.spin += s * 14),
            a.v[1] < 0 &&
              a.p[1] <= groundAt(a.p[0], a.p[2]) + 0.06 &&
              ((a.p[1] = groundAt(a.p[0], a.p[2]) + 0.06),
              (a.fuse = a.acid ? 0.45 : a.stone ? 0.05 : 0.7),
              sfx.fuse(a.p),
              a.acid && puff(a.p, 5, C.acid, 0.3, 0.6)));
        else if (((a.fuse -= s), a.fuse <= 0)) {
          (eshots.splice(t, 1), explodeLob(a));
          continue;
        }
      } else {
        if (a.home) {
          const n = Math.hypot(a.v[0], a.v[1], a.v[2]),
            h = norm([
              headPos[0] - a.p[0],
              headPos[1] - 0.15 - a.p[1],
              headPos[2] - a.p[2],
            ]),
            i = scale3(a.v, 1 / n),
            r = Math.min(1, a.home * s);
          a.v = scale3(
            norm([
              lerp(i[0], h[0], r),
              lerp(i[1], h[1], r),
              lerp(i[2], h[2], r),
            ]),
            n,
          );
        }
        ((a.p[0] += a.v[0] * s),
          (a.p[1] += a.v[1] * s),
          (a.p[2] += a.v[2] * s));
        const o = headDist(a.p);
        if (o < a.r) {
          (eshots.splice(t, 1),
            flashes.push({ p: a.p.slice(), t: 0, s: 1, c: a.col }),
            hurtPlayer(1));
          continue;
        }
        if (
          (!a.whoosh && o < 0.75 && ((a.whoosh = !0), sfx.whoosh(a.p)),
          a.p[1] < groundAt(a.p[0], a.p[2]))
        ) {
          (eshots.splice(t, 1), puff(a.p, 3, [0.78, 0.6, 0.5], 0.15, 0.6));
          continue;
        }
      }
      a.life <= 0 && eshots.splice(t, 1);
    }
  }
}
function damageEnemy(s, t, a, o, n, h, i) {
  if (s.state === "dead" || (s.state === "spawn" && s.T.boss)) return;
  if (s.phased > 0) {
    flashes.push({ p: o.slice(), t: 0, s: 0.5, c: [0.8, 0.9, 1] });
    return;
  }
  const r = a ? a[4] : 1,
    l = r >= 2 && !h;
  let f = t * R.dmg * (l ? (i || r) * (R.perks.deadeye ? 1.5 : 1) : 1);
  if (s.T.onHit && s.T.onHit(s, f, a, o)) return;
  ((s.hp -= f),
    (s.flash = 0.09),
    n && !s.T.boss && ((s.kx += n[0] * 0.18), (s.kz += n[2] * 0.18)),
    s.elite === "armored" && !l && (f *= 0.6),
    (s.lastCrit = l),
    TD.quiet || (inRun() && dmgNumber(o, f, l), sfx.ehit(o, s.T.metal)));
  const c = s.T.gib;
  for (let p = 0; p < 4; p++) {
    const d = rdir(0.3),
      e = rand(1, 3);
    part(
      "shard",
      o,
      [d[0] * e, d[1] * e, d[2] * e],
      [0.025, 0.025, 0.025],
      c[p % c.length],
      0.6,
      { grav: 8 },
    );
  }
  s.hp <= 0 && killEnemy(s);
}
function killEnemy(s, t) {
  if (s.state === "dead") return;
  ((s.state = "dead"), (s.st = 0));
  const a = s.hbw[0]
      ? [s.hbw[0][0], s.hbw[0][1], s.hbw[0][2]]
      : [s.x, s.y + 1, s.z],
    o = s.T.gib,
    n = s.T.boss ? 60 : 20;
  for (let h = 0; h < n; h++) {
    const i = rdir(0.5),
      r = rand(1.5, s.T.boss ? 9 : 4.5),
      l = rand(0.04, 0.11) * (s.T.boss ? 2.2 : 1) * Math.min(1.3, s.s);
    part(
      "cube",
      [
        a[0] + rand(-0.2, 0.2) * s.s,
        a[1] + rand(-0.3, 0.3) * s.s,
        a[2] + rand(-0.2, 0.2) * s.s,
      ],
      [i[0] * r, i[1] * r + 1, i[2] * r],
      [l, l * rand(0.5, 1), l],
      o[h % o.length],
      rand(1.2, 2.4),
      { grav: 9, bounce: 0.3 },
    );
  }
  if (
    (puff(
      a,
      s.T.boss ? 20 : 8,
      s.T.ghost ? [0.85, 0.9, 1] : [0.5, 0.42, 0.42],
      0.45 * Math.min(2.5, s.s),
      1.6,
    ),
    shocks.push({
      p: a.slice(),
      t: 0,
      r: 0.9 * Math.min(3, s.s),
      col: [1, 0.8, 0.5],
    }),
    flashes.push({
      p: a.slice(),
      t: 0,
      s: 1.8 * Math.min(3, s.s),
      c: [1, 0.8, 0.55],
    }),
    s.T.boss &&
      (explodeAt(a, 3, [1, 0.6, 0.3], !0),
      scheduleGameEffect(
        () => explodeAt(lw(s, 0.3, 1, 0), 2, [1, 0.6, 0.3], !0),
        250,
      )),
    sfx.ekill(a),
    s.T.onDeath && s.T.onDeath(s, a, t),
    s.elite === "volatile" &&
      (explodeAt(a, 2, [1, 0.45, 0.2], !0),
      Math.hypot(headPos[0] - a[0], headPos[2] - a[2]) < 2.2 &&
        inRun() &&
        hurtPlayer(1)),
    !t && inRun())
  ) {
    R.kills++;
    const h = Math.round(s.T.score * (1 + 0.1 * (R.wave - 1)));
    if (
      ((R.score += h),
      R.kind === "siege"
        ? siegeKill(s, a)
        : R.kind === "td"
          ? tdKill(s, a)
          : popup(
              "+" + h,
              s.T.boss ? "#ffd257" : "#ffb35a",
              [a[0], a[1] + 0.6 * Math.min(2, s.s), a[2]],
              s.T.boss ? 1.6 : 0.8,
            ),
      R.perks.leech && ++R.leech >= 12 && ((R.leech = 0), healPlayer(1)),
      s.T.split && s.lane)
    )
      tdSplit(s);
    else if (s.T.split)
      for (let i = 0; i < 2; i++) {
        const r = spawnEnemy(s.T.split, [s.x + (i ? 0.6 : -0.6), s.z]);
        ((r.y = s.y + 0.4), (r.hopT = i * 0.3));
      }
    (s.T.boss &&
      R.kind === "survival" &&
      showBanner(s.T.name + " DOWN", "+" + h + " points"),
      onKillReward(s, a));
  }
}
function pickGoal(s) {
  const t = Math.atan2(s.x - ROOM.cx, -(s.z - ROOM.cz)) + rand(-0.7, 0.7);
  [s.gx, s.gz] = arenaPoint(t, ROOM.r + rand(...s.T.standoff));
}
const BRAINS = {
  walker(s, t) {
    const a = s.T,
      o = toHead(s);
    if (s.state === "spawn")
      ((s.st += t),
        (s.rise = Math.min(1, s.st / 0.9)),
        (s.faceYaw = o),
        s.rise >= 1 &&
          ((s.state = "hold"),
          (s.st = 0),
          (s.holdT = rand(1.5, 3.5)),
          (s.strafe = Math.random() < 0.5 ? -1 : 1)));
    else if (!s.dodge)
      if (s.state === "move") {
        const n = s.gx - s.x,
          h = s.gz - s.z,
          i = Math.hypot(n, h);
        if (i < 0.3)
          ((s.state = "hold"),
            (s.holdT = rand(2.5, 5)),
            (s.strafe = Math.random() < 0.5 ? -1 : 1));
        else {
          const r = a.speed * D.speed;
          ((s.x += (n / i) * r * t),
            (s.z += (h / i) * r * t),
            (s.walk += t * r * 3.4),
            (s.faceYaw = Math.atan2(n, h)));
        }
        s.cd -= t * 0.5;
      } else if (s.state === "hold") {
        s.faceYaw = o;
        const n = s.x - ROOM.cx,
          h = s.z - ROOM.cz,
          i = Math.hypot(n, h) || 1,
          r = a.speed * D.speed * 0.32 * s.strafe;
        ((s.x += (-h / i) * r * t),
          (s.z += (n / i) * r * t),
          (s.walk += t * Math.abs(r) * 3.4),
          (s.cd -= t),
          (s.holdT -= t),
          s.cd <= 0
            ? ((s.state = "tele"), (s.st = 0), sfx.tele(lw(s, 0.3, 1.3, 0.5)))
            : s.holdT <= 0 && (pickGoal(s), (s.state = "move")));
      } else
        s.state === "tele" &&
          ((s.faceYaw = o),
          (s.st += t),
          s.st >= a.shoot.tele &&
            (a.fire(s),
            (s.cd = a.shoot.cd * D.cd * rand(0.8, 1.25)),
            (s.state = "hold"),
            (s.holdT = rand(1.5, 3)),
            (s.recoil = 1)));
    ((s.recoil = Math.max(0, s.recoil - t * 3)),
      (s.y =
        groundAt(s.x, s.z) +
        (s.state === "spawn" ? (s.rise - 1) * 1.9 * s.s : 0)));
  },
  flyer(s, t) {
    const a = s.T;
    if (((s.spin += t * 2.4), s.state === "spawn")) {
      s.st += t;
      const o = Math.min(1, s.st / 1.6),
        n = 1 - (1 - o) * (1 - o),
        [h, i] = arenaPoint(s.ang, s.orbR);
      ((s.x = lerp(s.x, h, Math.min(1, t * 1.5))),
        (s.z = lerp(s.z, i, Math.min(1, t * 1.5))),
        (s.y = lerp(s.y0, s.alt, n)),
        o >= 1 && ((s.state = "fly"), (s.st = 0)));
    } else {
      s.ang += (s.w * D.speed * t) / Math.max(1, s.orbR / 8);
      const [o, n] = arenaPoint(s.ang, s.orbR),
        h = s.alt + Math.sin(s.age * 1.3) * 0.35,
        i = Math.min(1, t * 2.2);
      ((s.x = lerp(s.x, o, i)),
        (s.z = lerp(s.z, n, i)),
        (s.y = lerp(s.y, h, i)),
        Math.random() < t * 0.12 &&
          ((s.orbR = ROOM.r + rand(...a.standoff)),
          (s.alt = rand(...a.alt)),
          (s.w = -s.w)),
        s.state === "fly"
          ? ((s.cd -= t),
            s.cd <= 0 &&
              ((s.state = "tele"), (s.st = 0), sfx.tele([s.x, s.y, s.z])))
          : s.state === "tele" &&
            ((s.st += t),
            s.st >= a.shoot.tele &&
              (a.fire(s),
              (s.cd = a.shoot.cd * D.cd * rand(0.8, 1.3)),
              (s.state = "fly"))));
    }
    s.faceYaw = toHead(s);
  },
  hopper(s, t) {
    const a = s.T,
      o = groundAt(s.x, s.z);
    if (((s.atkCd -= t), s.state === "spawn")) {
      ((s.vy = (s.vy || 0) - 9.8 * t),
        (s.y += s.vy * t),
        s.y <= o &&
          ((s.y = o),
          (s.state = "move"),
          (s.hopT = 0),
          (s.squash = 0.6),
          puff([s.x, o + 0.2, s.z], 6, C.blob, 0.35 * s.s, 1.2),
          sfx.splat([s.x, o, s.z])));
      return;
    }
    const n = 0.78 / D.speed,
      h = s.hopT % n;
    s.hopT += t;
    const i = (s.hopT % n) / n;
    if (s.hopT % n < h) {
      const r = toHead(s),
        l = hdist(s),
        f = s.bounce
          ? -2
          : Math.min(Math.max(0, l - 0.2), 1.1 * (s.s < 1 ? 1.4 : 1));
      ((s.hvx = (Math.sin(r) * f) / n),
        (s.hvz = (Math.cos(r) * f) / n),
        (s.bounce = !1),
        (s.squash = 0.45));
    }
    ((s.x += (s.hvx || 0) * t),
      (s.z += (s.hvz || 0) * t),
      (s.y = groundAt(s.x, s.z) + Math.sin(Math.PI * i) * 0.6 * s.s),
      (s.squash = Math.max(0, (s.squash || 0) - t * 3)),
      (s.faceYaw = toHead(s)),
      hdist(s) < a.melee.range + 0.15 &&
        s.atkCd <= 0 &&
        headPos[1] < s.y + 1.9 &&
        ((s.atkCd = 1.5),
        (s.bounce = !0),
        (s.squash = 0.7),
        puff([headPos[0], headPos[1] - 0.6, headPos[2]], 6, C.blob, 0.3, 1),
        sfx.splat([s.x, s.y + 0.5, s.z]),
        hurtPlayer(1)));
  },
  charger(s, t) {
    const a = s.T,
      o = toHead(s),
      n = hdist(s);
    if (s.state === "spawn")
      ((s.st += t),
        (s.rise = Math.min(1, s.st / 0.8)),
        s.rise >= 1 && ((s.state = "move"), (s.st = 0)));
    else if (!s.dodge) {
      if (s.state === "move") {
        s.zig += t * 3.2;
        const h = Math.sin(s.zig) * 0.75 * Math.min(1, n / 4),
          i = Math.sin(o),
          r = Math.cos(o),
          l = r,
          f = -i,
          c = i + l * h,
          p = r + f * h,
          d = Math.hypot(c, p),
          e = a.speed * D.speed;
        ((s.x += (c / d) * e * t),
          (s.z += (p / d) * e * t),
          (s.walk += t * e * 6),
          (s.faceYaw = Math.atan2(c, p)),
          n < a.melee.range &&
            ((s.state = "tele"), (s.st = 0), sfx.scorp([s.x, s.y + 0.6, s.z])));
      } else if (s.state === "tele")
        ((s.faceYaw = o),
          (s.st += t),
          s.st >= a.melee.tele / D.speed &&
            ((s.state = "strike"),
            (s.st = 0),
            n < a.melee.reach && headPos[1] < 2.4
              ? hurtPlayer(1)
              : sfx.whoosh([s.x, s.y + 1, s.z])));
      else if (s.state === "strike")
        ((s.st += t), s.st > 0.35 && ((s.state = "retreat"), (s.st = 0)));
      else if (s.state === "retreat") {
        s.st += t;
        const h = a.speed * 0.9;
        ((s.x -= Math.sin(o) * h * t),
          (s.z -= Math.cos(o) * h * t),
          (s.walk -= t * h * 6),
          (s.faceYaw = o),
          s.st > 0.8 && ((s.state = "move"), (s.st = 0)));
      }
    }
    s.y = groundAt(s.x, s.z) + (s.state === "spawn" ? (s.rise - 1) * 1.2 : 0);
  },
  diver(s, t) {
    const a = s.T;
    if (s.state === "circle") {
      s.ang += s.w * t;
      const o = headPos[0] + Math.sin(s.ang) * s.circR,
        n = headPos[2] - Math.cos(s.ang) * s.circR,
        h = Math.min(1, t * 1.6),
        i = s.x,
        r = s.z;
      ((s.x = lerp(s.x, o, h)),
        (s.z = lerp(s.z, n, h)),
        (s.y = lerp(s.y, s.alt, h)),
        (s.faceYaw = Math.atan2(s.x - i, s.z - r) || s.faceYaw),
        (s.bank = -Math.sign(s.w) * 0.5),
        (s.flapK = 0.4),
        (s.timer -= t),
        s.timer <= 0 &&
          ((s.state = "tele"), (s.st = 0), sfx.screech([s.x, s.y, s.z])));
    } else if (s.state === "tele") {
      if (
        ((s.st += t),
        (s.faceYaw = toHead(s)),
        (s.bank = 0),
        (s.flapK = 1.6),
        s.st > 0.6)
      ) {
        const o = [headPos[0], headPos[1] - 0.05, headPos[2]],
          n = norm([o[0] - s.x, o[1] - s.y, o[2] - s.z]);
        ((s.dv = n),
          (s.dl = Math.hypot(o[0] - s.x, o[1] - s.y, o[2] - s.z) + 5),
          (s.travel = 0),
          (s.state = "dive"));
      }
    } else if (s.state === "dive") {
      const o = a.speed * D.speed;
      ((s.x += s.dv[0] * o * t),
        (s.y += s.dv[1] * o * t),
        (s.z += s.dv[2] * o * t),
        (s.travel += o * t),
        (s.flapK = 0),
        (s.bank = 0),
        (s.faceYaw = Math.atan2(s.dv[0], s.dv[2])),
        (s.pitch = Math.asin(-s.dv[1])),
        headDist([s.x, s.y, s.z]) < 0.32 && (hurtPlayer(1), (s.travel = s.dl)),
        (s.travel >= s.dl || s.y < 0.4) &&
          ((s.state = "climb"), (s.st = 0), (s.pitch = 0)));
    } else
      s.state === "climb" &&
        ((s.st += t),
        (s.y += 4 * t),
        (s.x += s.dv[0] * 5 * t),
        (s.z += s.dv[2] * 5 * t),
        (s.flapK = 1.2),
        s.st > 1.4 &&
          ((s.state = "circle"),
          (s.timer = rand(2.5, 4.5)),
          (s.ang = Math.atan2(s.x - headPos[0], -(s.z - headPos[2])))));
  },
  phaser(s, t) {
    const a = s.T;
    ((s.alpha = Math.min(1, s.alpha + t * 1.2)),
      (s.phaseT -= t),
      s.phaseT <= 0 && ((s.phased = 1.1), (s.phaseT = rand(3.5, 5.5))),
      (s.weave += t * 1.7));
    const o = headPos[0],
      n = headPos[2],
      h = headPos[1] - 1.55,
      i = hdist(s),
      r = toHead(s),
      l = a.speed * D.speed * (i < 3 ? 1.35 : 1),
      f = Math.sin(s.weave) * 0.9 * Math.min(1, i / 3);
    ((s.x += (Math.sin(r) + Math.cos(r) * f) * l * t),
      (s.z += (Math.cos(r) - Math.sin(r) * f) * l * t),
      (s.y = lerp(s.y, h + Math.sin(s.age * 2.1) * 0.12, Math.min(1, t * 1.5))),
      (s.faceYaw = r));
    const c = s.hbw[1];
    c &&
      Math.hypot(c[0] - headPos[0], c[1] - headPos[1], c[2] - headPos[2]) <
        0.5 &&
      s.phased <= 0.2 &&
      (hurtPlayer(1), killEnemy(s, !0));
  },
  sheriff(s, t) {
    const a = s.T,
      o = toHead(s);
    if (s.state === "spawn")
      ((s.st += t),
        (s.y = groundAt(s.x, s.z) - 6 * (1 - Math.min(1, s.st / 2.4))),
        (s.faceYaw = o),
        Math.random() < t * 12 &&
          puff(
            [s.x + rand(-1.5, 1.5), 0.3, s.z + rand(-1.5, 1.5)],
            2,
            [0.78, 0.6, 0.5],
            0.6,
            1.5,
          ),
        s.st >= 2.4 && ((s.state = "hold"), (s.st = 0), (s.cd = 1.5)));
    else {
      s.faceYaw = o;
      const h = s.x - ROOM.cx,
        i = s.z - ROOM.cz,
        r = Math.hypot(h, i) || 1,
        l = 0.55 * s.strafe;
      (s.state === "hold" &&
        ((s.x += (-i / r) * l * t),
        (s.z += (h / r) * l * t),
        (s.walk += t * 1.2),
        Math.random() < t * 0.15 && (s.strafe = -s.strafe)),
        (s.y = groundAt(s.x, s.z)),
        a.phasing &&
          ((s.phaseT -= t),
          s.phaseT <= 0 &&
            ((s.phased = 1.6),
            (s.phaseT = rand(6, 8)),
            sfx.moan([s.x, 5, s.z]))),
        (s.cd -= t),
        (s.summonT -= t));
      for (const f of s.cannons) f.glow = Math.max(0, f.glow - t * 2);
      if (s.state === "hold" && s.cd <= 0) {
        const f = s.cannons.some((c) => c.alive);
        ((s.atkKind = f && s.atk % 3 !== 2 ? "volley" : "draw"),
          s.atk++,
          (s.state = "tele"),
          (s.st = 0),
          sfx.tele([s.x, s.y + 4, s.z]));
      } else if (s.state === "tele") {
        s.st += t;
        const f = s.atkKind === "volley" ? 1 : 0.6;
        if (s.atkKind === "volley")
          for (const c of s.cannons) c.alive && (c.glow = s.st / f);
        s.st >= f &&
          (s.atkKind === "volley"
            ? s.cannons.forEach((c, p) => {
                if (!c.alive) return;
                const d = lw(s, p ? 0.32 : -0.32, 1.42, 0.25);
                for (const e of [-0.26, -0.13, 0, 0.13, 0.26])
                  eFire(s, d, a.bolt, {
                    yawOff: e,
                    speed: a.bolt === "orb" ? 4.6 : 7,
                  });
              })
            : eFire(
                s,
                lw(s, 0.3, 1.3, 0.66),
                a.bolt === "orb" ? "orb" : "bolt",
                { speed: a.bolt === "orb" ? 5.5 : 12 },
              ),
          (s.state = "hold"),
          (s.cd = 2.3 * D.cd),
          (s.recoil = 1));
      }
      if (s.summonT <= 0) {
        s.summonT = 15;
        for (let f = 0; f < 2; f++)
          enemies.length < 10 &&
            spawnEnemy(a.summon, [s.x + rand(-3, 3), s.z + rand(-3, 3)]);
      }
    }
    s.recoil = Math.max(0, s.recoil - t * 2);
    const n = s.cannons;
    ((s.hbList = [
      [0, 1.12, 0, 0.32, 1],
      [0, 1.62, 0, 0.2, 2],
      [0, 1.2, 0.17, 0.1, 3, "badge"],
    ]),
      n[0].alive && s.hbList.push([-0.32, 1.42, 0.08, 0.14, 1, 0]),
      n[1].alive && s.hbList.push([0.32, 1.42, 0.08, 0.14, 1, 1]),
      s.hbList.push([0, 0.5, 0, 0.26, 1]));
  },
  mothership(s, t) {
    const a = s.T;
    if (((s.spin += t * 0.35), s.state === "spawn")) {
      s.st += t;
      const o = Math.min(1, s.st / 3.2);
      ((s.y = lerp(45, s.alt, 1 - (1 - o) * (1 - o))),
        o >= 1 && ((s.state = "fly"), (s.cd = 4)));
    } else {
      s.ang += 0.05 * t;
      const [o, n] = arenaPoint(s.ang, s.orbR);
      ((s.x = lerp(s.x, o, t)),
        (s.z = lerp(s.z, n, t)),
        (s.y = s.alt + Math.sin(s.age * 0.6) * 0.5));
      for (const h of s.pods)
        h.alive &&
          ((h.cd -= t),
          h.cd <= 0 &&
            ((h.cd = 2.8 * D.cd * rand(0.8, 1.2)),
            eFire(s, podPos(s, h), "orb", { speed: 4.4 })));
      if (((s.cd -= t), (s.summonT -= t), s.state === "fly" && s.cd <= 0))
        ((s.state = "tele"), (s.st = 0), sfx.tele([s.x, s.y, s.z]));
      else if (s.state === "tele" && ((s.st += t), s.st > 1)) {
        for (let h = 0; h < 7; h++)
          eFire(s, lw(s, 0, -0.08, 0), "zap", {
            yawOff: (h - 3) * 0.07,
            speed: 9,
          });
        ((s.state = "fly"), (s.cd = 7 * D.cd));
      }
      s.summonT <= 0 &&
        ((s.summonT = 16), enemies.length < 10 && spawnEnemy("saucer"));
    }
    ((s.faceYaw = toHead(s)),
      (s.hbList = []),
      s.pods.forEach((o, n) => {
        if (o.alive) {
          const h = o.off + s.spin;
          s.hbList.push([
            Math.sin(h) * 0.66,
            0,
            Math.cos(h) * 0.66,
            0.15,
            1,
            n,
          ]);
        }
      }),
      s.hbList.push(
        [0, 0.16, 0, 0.28, 2, "core"],
        [0, -0.02, 0, 0.62, 1, "hull"],
      ));
  },
  wyrm(s, t) {
    const a = s.T;
    if (((s.hbw.length = 0), s.arcT < 0)) {
      if (((s.arcT += t), (s.state = "under"), s.arcT >= 0)) {
        const c = spawnAngle();
        ((s.S = arenaPoint(c, ROOM.r + 13)),
          (s.E = arenaPoint(c + Math.PI + rand(-0.5, 0.5), ROOM.r + 12)),
          (s.peak = rand(5, 7)),
          (s.dur = 3.6 / D.speed),
          (s.spit = 0),
          (s.state = "arc"),
          sfx.roar([s.S[0], 1, s.S[1]]),
          puff([s.S[0], 0.4, s.S[1]], 16, [0.78, 0.6, 0.5], 1, 2.5));
      }
      return;
    }
    s.arcT += t;
    const o = s.arcT / s.dur,
      n = 0.055,
      h = (c) => [
        lerp(s.S[0], s.E[0], c),
        -2.8 +
          (s.peak + 2.8) * Math.sin(Math.PI * clamp(c, 0, 1)) -
          (c < 0 || c > 1 ? 4 : 0),
        lerp(s.S[1], s.E[1], c),
      ];
    s.pts = [];
    for (let c = 0; c <= s.segs; c++) s.pts.push(h(o - c * n));
    const i = s.pts[0];
    ((s.x = i[0]),
      (s.y = i[1]),
      (s.z = i[2]),
      s.spit < 3 &&
        o > 0.38 + s.spit * 0.1 &&
        (s.spit++, eFire(s, i.slice(), "acid", { flight: 1.2 }), sfx.throw(i)),
      Math.abs(o - 1) < (t / s.dur) * 1.2 &&
        puff([s.E[0], 0.4, s.E[1]], 14, [0.78, 0.6, 0.5], 1, 2.5));
    const r = h(o + 0.01),
      l = norm([r[0] - i[0], r[1] - i[1], r[2] - i[2]]);
    ((s.yaw = s.faceYaw = Math.atan2(l[0], l[2])),
      (s.pitch = Math.asin(clamp(-l[1], -1, 1))));
    const f = s.s;
    s.pts.forEach((c, p) => {
      c[1] > -1.2 &&
        s.hbw.push([
          c[0],
          c[1],
          c[2],
          (p ? 0.68 - p * 0.02 : 0.95) * f,
          p ? 1 : 2,
          p ? "body" : "head",
        ]);
    });
    for (const c of s.hbw)
      if (headDist([c[0], c[1], c[2]]) < c[3] * 0.8) {
        hurtPlayer(1);
        break;
      }
    o - s.segs * n > 1 && (s.arcT = -rand(1, 1.8));
  },
};
function podPos(s, t) {
  const a = t.off + s.spin;
  return lw(s, Math.sin(a) * 0.66, 0, Math.cos(a) * 0.66);
}
function sheriffHit(s, t, a, o) {
  if (a && typeof a[5] == "number") {
    const n = s.cannons[a[5]];
    return (
      !n ||
        !n.alive ||
        ((n.hp -= t),
        (s.flash = 0.06),
        sfx.ehit(o, !0),
        n.hp <= 0 &&
          ((n.alive = !1),
          explodeAt(o, 1.6, [1, 0.6, 0.3], !0),
          popup("CANNON DOWN", "#ffd257", [o[0], o[1] + 0.8, o[2]], 1.2),
          (s.hp -= 6 * D.hp),
          s.hp <= 0 && killEnemy(s))),
      !0
    );
  }
  return !1;
}
function motherHit(s, t, a, o) {
  if (a && typeof a[5] == "number") {
    const n = s.pods[a[5]];
    return (
      !n ||
        !n.alive ||
        ((n.hp -= t),
        (s.flash = 0.05),
        sfx.ehit(o, !0),
        n.hp <= 0 &&
          ((n.alive = !1),
          explodeAt(o, 2, [0.4, 1, 0.6], !0),
          popup("POD DOWN", "#7dffb8", [o[0], o[1] + 1, o[2]], 1.4))),
      !0
    );
  }
  return s.pods.some((n) => n.alive)
    ? (flashes.push({ p: o.slice(), t: 0, s: 0.9, c: [0.5, 1, 0.8] }),
      Math.random() < 0.3 &&
        popup("SHIELDED", "#7dffb8", [o[0], o[1] + 0.6, o[2]], 0.9),
      !0)
    : a && a[5] === "hull"
      ? ((s.hp -= t * 0.35), (s.flash = 0.06), s.hp <= 0 && killEnemy(s), !0)
      : !1;
}
function wyrmHit(s, t, a, o) {
  return a && a[5] === "body"
    ? ((s.hp -= t * 0.35),
      (s.flash = 0.05),
      puff(o, 2, [0.78, 0.6, 0.5], 0.2, 0.6),
      s.hp <= 0 && killEnemy(s),
      !0)
    : !1;
}
function updateEnemies(s) {
  for (let t = enemies.length - 1; t >= 0; t--) {
    const a = enemies[t];
    if (!a) continue;
    if (
      ((a.age += s), (a.flash = Math.max(0, a.flash - s)), a.state === "dead")
    ) {
      ((a.st += s), a.st > 0.12 && enemies.splice(t, 1));
      continue;
    }
    if ((a.phased > 0 && (a.phased -= s), statusTick(a, s), a.state === "dead"))
      continue;
    const o = s * timeFactor(a);
    if (a.dodge) {
      const n = a.dodge;
      ((n.t += o),
        (a.x += n.vx * o),
        (a.z += n.vz * o),
        n.t >= n.dur && (a.dodge = null));
    }
    ((a.lean *= Math.max(0, 1 - s * 5)),
      (a.x += a.kx),
      (a.z += a.kz),
      (a.kx *= 0.5),
      (a.kz *= 0.5),
      BRAINS[a.brain || a.T.brain](a, o),
      o === s && tryDodge(a, s),
      a.T.customHB || (a.yaw = angTo(a.yaw, a.faceYaw, o * 7)),
      updateHitboxes(a));
  }
  for (const t of enemies) {
    if (t.state === "dead" || t.T.boss || t.T.customHB || t.y > 1.2) continue;
    const a = t.x - headPos[0],
      o = t.z - headPos[2],
      n = Math.hypot(a, o),
      h = 0.42 * t.s + 0.25;
    n < h &&
      n > 0.001 &&
      ((t.x = headPos[0] + (a / n) * h), (t.z = headPos[2] + (o / n) * h));
  }
  for (let t = 0; t < enemies.length; t++)
    for (let a = t + 1; a < enemies.length; a++) {
      const o = enemies[t],
        n = enemies[a];
      if (o.T.boss || n.T.boss || o.state === "dead" || n.state === "dead")
        continue;
      const h = n.x - o.x,
        i = n.z - o.z,
        r = Math.hypot(h, i),
        l = 0.55 * (o.s + n.s);
      if (r > 0.001 && r < l && Math.abs(o.y - n.y) < 1.5) {
        const f = ((l - r) * 0.5) / r;
        ((o.x -= h * f), (o.z -= i * f), (n.x += h * f), (n.z += i * f));
      }
    }
}
function clearEnemies() {
  for (const s of enemies)
    s.state !== "dead" && puff([s.x, s.y + 1, s.z], 5, [0.7, 0.6, 0.6], 0.4, 1);
  ((enemies = []), (eshots = []), (pshots = []), (zaps = []), (fields = []));
}
function drawBot(s, t, a) {
  const o = s.T,
    n = s.flash > 0 ? FLASH : s.T.ghost || o.phasing ? [0.85, 0.92, 1.1] : W1,
    h = s.flash > 0 ? 0.7 : 0,
    i = s.alpha * (s.phased > 0 ? 0.2 : 1),
    r = Math.sin(s.walk),
    l = Math.abs(Math.cos(s.walk)) * 0.035,
    f = s.state === "tele" ? Math.min(1, s.st / (o.shoot.tele || 0.6)) : 0,
    c =
      s.state === "tele"
        ? Math.min(1, s.st / 0.2)
        : o.boss
          ? 0
          : s.recoil * 0.9;
  (ep(EM[a.torso], t, 0, l, 0, 0, 0, 0, 1, 1, 1, n, h, i),
    ep(EM[a.head], t, 0, 1.46 + l, 0, 0, -0.08, 0, 1, 1, 1, n, h, i));
  const p = o.eye,
    d = 0.8 + f * 1.6,
    e = ep(
      EM[a.eyes],
      t,
      0,
      1.46 + l,
      0,
      0,
      -0.08,
      0,
      1,
      1,
      1,
      [p[0] * d, p[1] * d, p[2] * d],
      1,
      i,
    ),
    M = xf(e, [0, 0.15, 0.15]);
  (ppush(
    PT.glow,
    M[0],
    M[1],
    M[2],
    0.12 * s.s * (1 + f),
    p[0],
    p[1],
    p[2],
    0.5 + f * 0.5,
  ),
    ep(EM[a.leg], t, -0.12, 0.84, 0, 0, r * 0.55, 0, 1, 1, 1, n, h, i),
    ep(EM[a.leg], t, 0.12, 0.84, 0, 0, -r * 0.55, 0, 1, 1, 1, n, h, i),
    ep(EM[a.arm], t, -0.31, 1.3 + l, 0, 0, -r * 0.45, 0.08, 1, 1, 1, n, h, i));
  const w = ep(
    EM[a.gun],
    t,
    0.31,
    1.3 + l,
    0,
    0,
    r * 0.45 * (1 - c) -
      (c * Math.PI) / 2 +
      s.recoil * 0.35 * (s.state !== "tele" ? 1 : 0),
    -0.08 * (1 - c),
    1,
    1,
    1,
    n,
    h,
    i,
  );
  if (f > 0 && !o.boss) {
    const g = xf(w, [0, -0.66, 0]);
    ppush(PT.glow, g[0], g[1], g[2], 0.25 * f, p[0], p[1], p[2], 0.9);
  }
}
function drawSheriff(s, t) {
  drawBot(s, t, s.type === "marshal" ? SKEL : BOT);
  const a = s.alpha * (s.phased > 0 ? 0.2 : 1),
    o = 0.8 + 0.4 * Math.sin(clock * 5),
    n = ep(
      EM.badge,
      t,
      0,
      1.2,
      0.165,
      0,
      0,
      0,
      1,
      1,
      1,
      [1.3 * o, 1.1 * o, 0.5],
      1,
      a,
    ),
    h = xf(n, [0, 0, 0.02]);
  (ppush(PT.glow, h[0], h[1], h[2], 0.6, 1, 0.85, 0.3, 0.6 * o),
    s.cannons.forEach((i, r) => {
      if (!i.alive) return;
      const l = r ? 1 : -1,
        f = ep(
          EM.cannon,
          t,
          l * 0.32,
          1.42,
          0.02,
          0,
          -0.06,
          0,
          1,
          1,
          1,
          s.flash > 0 ? FLASH : W1,
          0,
          a,
        );
      if (i.glow > 0) {
        const c = ep(
            EM.cannonGlow,
            f,
            0,
            0,
            0.38,
            0,
            Math.PI / 2,
            0,
            1,
            1,
            1,
            [1.5, 0.7 * i.glow + 0.3, 0.2],
            1,
            a,
          ),
          p = xf(c, [0, 0, 0]);
        ppush(PT.glow, p[0], p[1], p[2], 0.9 * i.glow, 1, 0.5, 0.2, 0.9);
      }
    }));
}
function drawDyn(s, t) {
  const a = s.T,
    o = s.flash > 0 ? FLASH : W1,
    n = s.flash > 0 ? 0.7 : 0,
    h = Math.sin(s.walk),
    i = Math.abs(Math.cos(s.walk)) * 0.03,
    r = s.state === "tele" ? Math.min(1, s.st / a.shoot.tele) : 0;
  (ep(EM.dynBody, t, 0, i, 0, 0, 0, 0, 1, 1, 1, o, n),
    ep(EM.dynEyes, t, 0, i, 0, 0, 0, 0, 1, 1, 1, [1.3, 1.1, 0.6], 1));
  const l = lw(s, 0, 1.37 + i, 0.18);
  (ppush(PT.glow, l[0], l[1], l[2], 0.35, 1, 0.9, 0.6, 0.6),
    ep(EM.dynLeg, t, -0.14, 0.42, 0, 0, h * 0.6, 0, 1, 1, 1, o, n),
    ep(EM.dynLeg, t, 0.14, 0.42, 0, 0, -h * 0.6, 0, 1, 1, 1, o, n));
  const f = s.state === "tele" ? 2.3 * Math.min(1, r * 1.3) : -1.3 * s.recoil;
  if (
    (ep(EM.gsArm, t, -0.38, 1.05 + i, 0, 0, -h * 0.4, 0.1, 1, 1, 1, o, n),
    ep(EM.gsArm, t, 0.38, 1.05 + i, 0, 0, f, -0.1, 1, 1, 1, o, n),
    s.state === "tele")
  ) {
    const c = [0.38, 1.05 + i - 0.45 * Math.cos(f), -0.45 * Math.sin(f)],
      p = ep(EM.dynStick, t, c[0], c[1], c[2], 0, f, 0, 1, 1, 1, W1, 0.2),
      d = xf(p, [0.02, 0.13, 0]);
    ppush(
      PT.glow,
      d[0],
      d[1],
      d[2],
      0.12 + 0.06 * Math.sin(clock * 40),
      1,
      0.8,
      0.3,
      1,
    );
  }
}
function drawSaucer(s, t) {
  const a = s.flash > 0 ? FLASH : W1,
    o =
      s.state === "tele"
        ? Math.min(1, s.st / (s.T.shoot ? s.T.shoot.tele : 1))
        : 0;
  (ep(
    EM.saucer,
    t,
    0,
    0,
    0,
    s.spin * 0.2,
    0,
    0,
    1,
    1,
    1,
    a,
    s.flash > 0 ? 0.7 : 0.05,
  ),
    ep(EM.dome, t, 0, 0, 0, 0, 0, 0, 1, 1, 1, [0.45, 1, 0.75], 0.75),
    ep(
      EM.saucerLights,
      t,
      0,
      0,
      0,
      -s.spin,
      0,
      0,
      1,
      1,
      1,
      [0.6 + o, 1.4, 1],
      1,
    ),
    ep(
      EM.saucerBelly,
      t,
      0,
      -0.075,
      0,
      0,
      Math.PI / 2,
      0,
      1,
      1,
      1,
      [0.4 + o * 1.2, 1 + o, 0.7 + o],
      1,
    ));
  const n = lw(s, 0, -0.1, 0);
  ppush(
    PT.glow,
    n[0],
    n[1],
    n[2],
    (0.5 + o * 0.9) * s.s,
    0.4,
    1,
    0.7,
    0.5 + o * 0.5,
  );
}
function drawMother(s, t) {
  drawSaucer(s, t);
  const a = s.pods.some((o) => o.alive);
  (s.pods.forEach((o) => {
    const n = o.off + s.spin;
    if (
      (ep(
        EM.podFrame,
        t,
        Math.sin(n) * 0.66,
        0,
        Math.cos(n) * 0.66,
        0,
        0,
        0,
        1,
        1,
        1,
        W1,
        0,
      ),
      o.alive)
    ) {
      const h = ep(
          EM.pod,
          t,
          Math.sin(n) * 0.66,
          0,
          Math.cos(n) * 0.66,
          0,
          0,
          0,
          1,
          1,
          1,
          [0.5, 1.3, 0.8],
          1,
        ),
        i = xf(h, [0, 0, 0]);
      ppush(PT.glow, i[0], i[1], i[2], 1.5, 0.4, 1, 0.7, 0.7);
    }
  }),
    a &&
      ep(
        EM.bubble,
        t,
        0,
        0.16,
        0,
        clock * 0.5,
        0,
        0,
        0.36,
        0.3,
        0.36,
        [0.4, 1, 0.8],
        1,
        0.22 + 0.06 * Math.sin(clock * 4),
      ));
}
function drawBlob(s, t) {
  const a = s.squash || 0,
    o = s.flash > 0 ? FLASH : W1;
  (ep(
    EM.blobBody,
    t,
    0,
    0.45 * (1 - a * 0.5),
    0,
    s.age * 0.6,
    0,
    0,
    0.48 * (1 + a * 0.4),
    0.45 * (1 - a * 0.5),
    0.48 * (1 + a * 0.4),
    o,
    s.flash > 0 ? 0.8 : 0.35,
  ),
    ep(
      EM.blobEyes,
      t,
      0,
      0.5 - a * 0.35,
      0,
      Math.sin(s.age * 3) * 0.15,
      0,
      Math.sin(s.age * 2.3) * 0.1,
      1,
      1,
      1,
      W1,
      0.2,
    ));
  const n = lw(s, 0, 0.45, 0);
  ppush(PT.glow, n[0], n[1], n[2], 0.9 * s.s, 0.5, 1, 0.5, 0.35);
}
function drawScorp(s, t) {
  const a = s.T,
    o = s.flash > 0 ? FLASH : W1,
    n = s.flash > 0 ? 0.7 : 0,
    h = s.state === "tele" ? Math.min(1, s.st / a.melee.tele) : 0,
    i = s.state === "strike" ? Math.sin(Math.min(1, s.st / 0.2) * Math.PI) : 0;
  (ep(EM.scorpBody, t, 0, 0, 0, 0, 0, 0, 1, 1, 1, o, n),
    ep(EM.scorpEyes, t, 0, 0, 0, 0, 0, 0, 1, 1, 1, [1.4, 0.9, 0.3], 1));
  for (let u = 0; u < 3; u++)
    for (const m of [-1, 1]) {
      const b = s.walk + u * 2.1 + (m > 0 ? 0 : Math.PI);
      ep(
        EM.scorpLeg,
        t,
        m * 0.18,
        0.3,
        0.28 - u * 0.2,
        (m > 0 ? 0 : Math.PI) + Math.cos(b) * 0.3 * m,
        0,
        Math.max(0, Math.sin(b)) * 0.35 * m,
        1,
        1,
        1,
        o,
        n,
      );
    }
  const r = 0.15 + 0.15 * Math.sin(s.age * 7);
  (ep(EM.scorpClaw, t, 0.14, 0.3, 0.5, -0.2 + r, 0, 0, 1, 1, 1, o, n),
    ep(EM.scorpClaw, t, -0.14, 0.3, 0.5, 0.2 - r, 0, 0, -1, 1, 1, o, n));
  const l = 1 + h * 0.25 - i * 0.9;
  let f = -0.8,
    c = 0.38,
    p = 0.55;
  for (let u = 0; u < 5; u++) {
    p = 0.55 + (u + 1) * 0.5 * l;
    const m = -Math.cos(p) * 0.15,
      b = Math.sin(p) * 0.15;
    ((f += m),
      (c += b),
      ep(
        EM.scorpSeg,
        t,
        0,
        c,
        f,
        0,
        Math.atan2(-b, m),
        0,
        1 - u * 0.08,
        1 - u * 0.08,
        1 - u * 0.08,
        o,
        n,
      ));
  }
  const d = -Math.cos(p + 0.4),
    e = Math.sin(p + 0.4),
    M = 1 + h * 1.5,
    w = ep(
      EM.scorpSting,
      t,
      0,
      c + e * 0.08,
      f + d * 0.08,
      0,
      Math.atan2(-e, d),
      0,
      1,
      1,
      1,
      [1.2 * M, 0.7 * M, 0.2],
      1,
    ),
    g = xf(w, [0, 0, 0]);
  (ppush(
    PT.glow,
    g[0],
    g[1],
    g[2],
    0.25 + h * 0.4,
    1,
    0.65,
    0.2,
    0.6 + h * 0.4,
  ),
    (s.hbList = [
      [0, 0.32, 0.05, 0.42, 1],
      [0, c + e * 0.08, f + d * 0.08, 0.17, 2],
    ]));
}
function drawBuzz(s, t) {
  const a = s.flash > 0 ? FLASH : W1,
    o =
      Math.sin(s.age * (s.flapK > 1 ? 14 : 7)) * 0.6 * (s.flapK ?? 1) +
      (s.state === "dive" ? -0.9 : 0.15);
  (ep(EM.buzzBody, t, 0, 0, 0, 0, 0, 0, 1, 1, 1, a, s.flash > 0 ? 0.7 : 0),
    ep(EM.buzzWing, t, 0.12, 0.04, 0, 0, 0, o, 1, 1, 1, a, 0),
    ep(EM.buzzWing, t, -0.12, 0.04, 0, 0, 0, -o, -1, 1, 1, a, 0));
}
function drawGhost(s, t) {
  const a = Math.min(s.alpha, 1) * (s.phased > 0 ? 0.16 : 0.72),
    o = s.flash > 0 ? FLASH : [0.95, 1, 1.1];
  (ep(
    EM.ghostBody,
    t,
    0,
    0,
    0,
    0,
    0,
    Math.sin(s.age * 1.7) * 0.06,
    1,
    1,
    1,
    o,
    0.55,
    a,
  ),
    ep(
      EM.ghostFace,
      t,
      0,
      0,
      0,
      0,
      0,
      Math.sin(s.age * 1.7) * 0.06,
      1,
      1,
      1,
      W1,
      0,
      Math.min(1, a * 1.25),
    ));
  const n = lw(s, 0, 1.3, 0);
  ppush(PT.glow, n[0], n[1], n[2], 1.6, 0.75, 0.85, 1, 0.22 * a);
}
function drawWyrm(s) {
  if (!s.pts || s.arcT < 0) return;
  const t = s.s,
    a = s.flash > 0 ? FLASH : W1,
    o = s.flash > 0 ? 0.6 : 0;
  for (let h = s.pts.length - 1; h >= 1; h--) {
    const i = s.pts[h],
      r = s.pts[h - 1];
    if (i[1] < -1.3) continue;
    const l = Math.atan2(r[0] - i[0], r[2] - i[2]),
      f = Math.atan2(-(r[1] - i[1]), Math.hypot(r[0] - i[0], r[2] - i[2])),
      c = t * (1 - h * 0.035);
    epw(EM.wyrmSeg, i[0], i[1], i[2], l, f, 0, c, c, c, a, o);
  }
  const n = s.pts[0];
  if (n[1] > -1.5) {
    const h = epw(
      EM.wyrmHead,
      n[0],
      n[1],
      n[2],
      s.yaw,
      s.pitch,
      0,
      t,
      t,
      t,
      a,
      o,
    );
    epw(
      EM.wyrmEyes,
      n[0],
      n[1],
      n[2],
      s.yaw,
      s.pitch,
      0,
      t,
      t,
      t,
      [1.3, 1.4, 0.4],
      1,
    );
    const i = xf(h, [0, 0, 0.9]);
    ppush(PT.glow, i[0], i[1], i[2], 1.2, 0.7, 1, 0.3, 0.4);
  }
}
function buildEnemyDraws() {
  ((EDL.length = 0), (mpi = 0));
  for (const s of enemies) {
    if (s.state === "dead") continue;
    if (s.T.customHB) {
      s.T.draw(s);
      continue;
    }
    const t = trs(
        pm(),
        s.x,
        s.y,
        s.z,
        s.yaw,
        s.pitch || 0,
        (s.lean || 0) * 0.3 + (s.bank || 0),
        s.s,
        s.s,
        s.s,
      ),
      a = EDL.length;
    s.T.draw(s, t);
    const o =
      s.frozen > 0
        ? [0.55, 0.85, 1.45]
        : s.slow > 0
          ? [0.78, 0.92, 1.15]
          : s.burn > 0
            ? [1.25, 0.85, 0.65]
            : s.poison > 0
              ? [0.8, 1.15, 0.7]
              : null;
    if (s.elite && s.flash <= 0) {
      const n = ELITES[s.elite].col;
      for (let h = a; h < EDL.length; h++) {
        const i = EDL[h],
          r = i.tint;
        ((i.tint = [
          r[0] * (0.6 + n[0] * 0.6),
          r[1] * (0.6 + n[1] * 0.6),
          r[2] * (0.6 + n[2] * 0.6),
        ]),
          (i.emit = Math.max(i.emit, 0.12)));
      }
    }
    if (o && s.flash <= 0)
      for (let n = a; n < EDL.length; n++) {
        const h = EDL[n],
          i = h.tint;
        ((h.tint = [i[0] * o[0], i[1] * o[1], i[2] * o[2]]),
          s.frozen > 0 && (h.emit = Math.max(h.emit, 0.25)));
      }
    if (s.hp < s.maxHp && s.hbw[0]) {
      const n = s.T.boss
          ? s.y + (s.type === "mothership" ? 2.2 : 6.4)
          : s.hbw[0][1] + s.hbw[0][3] + 0.35 * Math.min(s.s, 1.4),
        h = s.T.boss ? 3.2 : s.T.mini ? 1.4 : 0.6,
        i = clamp(s.hp / s.maxHp, 0, 1),
        r = Math.atan2(headPos[0] - s.x, headPos[2] - s.z),
        l = trs(pm(), s.x, n, s.z, r, 0, 0, 1, 1, 1);
      (ep(
        EM.bar,
        l,
        0,
        0,
        0,
        0,
        0,
        0,
        h + 0.04,
        s.T.boss ? 0.14 : 0.07,
        0.01,
        [0.12, 0.09, 0.16],
        1,
      ),
        ep(
          EM.bar,
          l,
          (-h * (1 - i)) / 2,
          0,
          0.008,
          0,
          0,
          0,
          h * i,
          s.T.boss ? 0.1 : 0.045,
          0.012,
          s.T.boss ? [1, 0.55, 0.2] : [1, 0.3, 0.25],
          1,
        ));
    }
  }
  for (const s of enemies)
    if (s.type === "wyrm" && s.state !== "dead" && s.hp < s.maxHp) {
      const t = clamp(s.hp / s.maxHp, 0, 1),
        a = Math.atan2(headPos[0] - ROOM.cx, headPos[2] - (ROOM.cz - 9)),
        o = trs(pm(), ROOM.cx, 6.5, ROOM.cz - 9, a, 0, 0, 1, 1, 1);
      (ep(EM.bar, o, 0, 0, 0, 0, 0, 0, 3.24, 0.14, 0.01, [0.12, 0.09, 0.16], 1),
        ep(
          EM.bar,
          o,
          (-3.2 * (1 - t)) / 2,
          0,
          0.008,
          0,
          0,
          0,
          3.2 * t,
          0.1,
          0.012,
          [1, 0.55, 0.2],
          1,
        ));
    }
  for (const s of eshots) {
    if (s.kind === "hands") {
      drawHands(s);
      continue;
    }
    if (s.kind === "rift") {
      for (let t = 0; t < 3; t++)
        ppush(
          PT.glow,
          s.p[0] + rand(-0.3, 0.3),
          0.1,
          s.p[2] + rand(-0.3, 0.3),
          rand(0.3, 0.6),
          1,
          0.45,
          0.15,
          0.8,
        );
      continue;
    }
    if (s.kind === "lob" && s.stone) {
      epw(
        EM.tombstone,
        s.p[0],
        s.p[1],
        s.p[2],
        s.spin * 0.3,
        s.spin * 0.5,
        0,
        0.55,
        0.55,
        0.55,
        W1,
        0,
      );
      continue;
    }
    if (s.kind === "lob") {
      s.acid
        ? bpush(
            B.shard,
            s.p[0],
            s.p[1],
            s.p[2],
            0.09,
            0.09,
            0.09,
            s.spin,
            s.spin * 0.7,
            0,
            C.acid[0] * 1.3,
            C.acid[1] * 1.3,
            C.acid[2],
            1,
          )
        : bpush(
            B.casing,
            s.p[0],
            s.p[1],
            s.p[2],
            0.026,
            0.16,
            0.026,
            s.spin,
            s.spin * 1.3,
            0,
            C.dyn[0],
            C.dyn[1],
            C.dyn[2],
            1,
          );
      const t = s.fuse >= 0 ? 0.5 + 0.5 * Math.sin(clock * 30) : 0.6;
      ppush(
        PT.glow,
        s.p[0],
        s.p[1] + 0.1,
        s.p[2],
        0.15,
        1,
        s.acid ? 1 : 0.7,
        (s.acid, 0.3),
        t,
      );
    } else {
      const t = Math.hypot(s.v[0], s.v[1], s.v[2]),
        a = Math.atan2(s.v[0], s.v[2]),
        o = -Math.asin(clamp(s.v[1] / t, -1, 1)),
        n = s.kind === "orb" ? 0.13 : 0.24;
      (bpush(
        B.shard,
        s.p[0],
        s.p[1],
        s.p[2],
        s.kind === "orb" ? 0.13 : 0.055,
        s.kind === "orb" ? 0.13 : 0.055,
        n,
        a,
        o,
        clock * 8,
        s.col[0] * 1.5,
        s.col[1] * 1.5,
        s.col[2] * 1.5,
        1,
      ),
        ppush(
          PT.glow,
          s.p[0],
          s.p[1],
          s.p[2],
          s.kind === "orb" ? 0.7 : 0.45,
          s.col[0],
          s.col[1],
          s.col[2],
          0.95,
        ));
    }
  }
  buildPShotDraws();
}
