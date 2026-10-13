"use strict";
const SIEGE_SHOP_SECONDS = 40,
  ARMORY_GUN_COSTS = [20, 40, 60, 90, 130, 180, 220, 270, 330, 400],
  UPGRADES = [
    {
      id: "vital",
      name: "VITALITY",
      desc: "+1 starting heart",
      cost: [25, 60, 120],
    },
    {
      id: "gold",
      name: "NEST EGG",
      desc: "+250 starting gold",
      cost: [15, 35, 70, 120],
    },
    {
      id: "fire",
      name: "FIREPOWER",
      desc: "+8% damage with every gun",
      cost: [20, 40, 70, 110, 160],
    },
    {
      id: "quick",
      name: "QUICK HANDS",
      desc: "Reload 10% faster",
      cost: [20, 45, 90],
    },
    {
      id: "luck",
      name: "FORTUNE",
      desc: "Rarer guns from the coffin",
      cost: [30, 70, 140],
    },
    {
      id: "guns",
      name: "ARMORY",
      desc: "Unlock two new guns",
      cost: ARMORY_GUN_COSTS.slice(0, Math.ceil(UNLOCK_GUNS.length / 2)),
    },
    {
      id: "sidearm",
      name: "SIDEARM",
      desc: "Start with a Six-Shooter",
      cost: [50],
    },
  ],
  metaDmg = () => 1 + 0.08 * META.up.fire,
  rankOf = (e) => Math.floor(Math.sqrt(e / 8)) + 1,
  gunPool = () => BASE_GUNS.concat(UNLOCK_GUNS.slice(0, META.up.guns * 2));
// Saved progress is untrusted input: preserve valid values and recover safely.
function metaInteger(value, max = Number.MAX_SAFE_INTEGER) {
  if (typeof value !== "number" && typeof value !== "string") return 0;
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.min(max, Math.max(0, Math.floor(number)))
    : 0;
}
const META = (() => {
  let e = null;
  try {
    e = JSON.parse(localStorage.getItem("dusk-range-meta") || "null");
  } catch {}
  const s = Object.fromEntries(
    UPGRADES.map(({ id, cost }) => [
      id,
      metaInteger(e && e.up && e.up[id], cost.length),
    ]),
  );
  // Older builds sold four extra tiers after every gun was already unlocked.
  // Refund those tiers and persist the normalized level together, exactly once.
  const oldGunLevel = metaInteger(
    e && e.up && e.up.guns,
    ARMORY_GUN_COSTS.length,
  );
  const refund = ARMORY_GUN_COSTS.slice(s.guns, oldGunLevel).reduce(
    (sum, cost) => sum + cost,
    0,
  );
  const progress = {
    souls: metaInteger(metaInteger(e && e.souls) + refund),
    total: metaInteger(e && e.total),
    up: s,
    ...(e && e.career && typeof e.career === "object"
      ? { career: e.career }
      : {}),
  };
  if (refund > 0) {
    try {
      localStorage.setItem("dusk-range-meta", JSON.stringify(progress));
    } catch {}
  }
  return progress;
})();
function saveMeta() {
  try {
    localStorage.setItem("dusk-range-meta", JSON.stringify(META));
  } catch {}
}
function awardSouls() {
  const e = R.kind === "siege",
    s = Math.max(
      1,
      Math.round(
        e
          ? R.kills * 0.5 + R.wave * 4 + R.bossKills * 20
          : R.kind === "td"
            ? R.kills * 0.25 + R.wave * 5 + R.bossKills * 20
            : R.kills * 0.35 + R.wave * 3 + R.bossKills * 15,
      ),
    );
  const reward = R.extracted ? Math.ceil(s * 1.25) : s;
  return (
    (META.souls += reward),
    (META.total += reward),
    saveMeta(),
    (R.souls = reward),
    reward
  );
}
function buyUpgrade(e) {
  const s = UPGRADES[e];
  if (!s) return;
  const t = META.up[s.id];
  if (t >= s.cost.length) {
    sfx.deny();
    return;
  }
  if (META.souls < s.cost[t]) {
    (sfx.deny(),
      popup(
        "NEED " + s.cost[t],
        "#ff7a6a",
        [ARMORY_POS[0], ARMORY_POS[1] + 1.1, ARMORY_POS[2]],
        0.9,
      ));
    return;
  }
  ((META.souls -= s.cost[t]),
    META.up[s.id]++,
    saveMeta(),
    sfx.buy(),
    popup(
      s.name,
      "#c9a8ff",
      [ARMORY_POS[0], ARMORY_POS[1] + 1.1, ARMORY_POS[2]],
      1,
    ),
    drawArmory());
}
const ARMORY_POS = [-3.05, 1.75, -3.5],
  ARMORY_YAW = Math.atan2(-ARMORY_POS[0], -ARMORY_POS[2]),
  armory = panel(1024, 1024, 1.7),
  AR_HEAD = 230,
  AR_ROW = 110;
function drawArmory() {
  const e = armory.ctx,
    s = 1024;
  ((e.fillStyle = "#1c1730"),
    e.fillRect(0, 0, s, s),
    (e.strokeStyle = "#b58aff"),
    (e.lineWidth = 8),
    e.strokeRect(10, 10, s - 20, s - 20),
    (e.textBaseline = "alphabetic"),
    (e.textAlign = "center"),
    spaced(e, 0),
    (e.fillStyle = "#e8dcf8"),
    (e.font = `96px ${FD}`),
    e.fillText("ARMORY", s / 2, 108, 900),
    spaced(e, 4),
    (e.font = `600 30px ${FB}`),
    (e.fillStyle = "#b9a6d3"),
    e.fillText("SHOOT A ROW TO SPEND SOULS", s / 2, 152, 900),
    spaced(e, 0),
    (e.font = `52px ${FD}`),
    (e.fillStyle = "#c9a8ff"),
    (e.textAlign = "left"),
    e.fillText(META.souls + " SOULS", 52, 212, 520),
    (e.textAlign = "right"),
    (e.fillStyle = "#ffd257"),
    e.fillText("RANK " + rankOf(META.total), s - 52, 212, 400),
    UPGRADES.forEach((t, a) => {
      const n = AR_HEAD + a * AR_ROW,
        i = META.up[t.id],
        o = t.cost.length,
        r = i >= o,
        l = r ? 0 : t.cost[i],
        f = !r && META.souls >= l;
      ((e.fillStyle = a % 2 ? "#241d3c" : "#2a2246"),
        e.fillRect(24, n, s - 48, AR_ROW - 8),
        (e.textAlign = "left"),
        (e.font = `50px ${FD}`),
        (e.fillStyle = "#f3e3c8"),
        e.fillText(t.name, 50, n + 50, 440),
        (e.font = `600 26px ${FB}`),
        (e.fillStyle = "#b9a6d3"),
        e.fillText(
          t.id === "guns"
            ? t.desc +
                "  (" +
                gunPool().length +
                " of " +
                WEAPON_IDS.length +
                ")"
            : t.desc,
          50,
          n + 88,
          560,
        ));
      const c = o > 6 ? 17 : 30,
        d = o > 6 ? 7 : 10;
      for (let p = 0; p < o; p++)
        (e.beginPath(),
          e.arc(600 + p * c, n + 40, d, 0, TAU),
          p < i
            ? ((e.fillStyle = "#c9a8ff"), e.fill())
            : ((e.lineWidth = 3), (e.strokeStyle = "#5a4a7a"), e.stroke()));
      ((e.textAlign = "right"),
        (e.font = `46px ${FD}`),
        (e.fillStyle = r ? "#7fe0a0" : f ? "#ffd257" : "#8a7aa0"),
        e.fillText(r ? "MAXED" : l + " ✦", s - 50, n + 72, 240));
    }),
    upload(armory.tex, armory.cvs));
}
function armoryRow(e) {
  const s = Math.cos(ARMORY_YAW),
    t = -Math.sin(ARMORY_YAW),
    a = (e[0] - ARMORY_POS[0]) * s + (e[2] - ARMORY_POS[2]) * t,
    n = e[1] - ARMORY_POS[1],
    i = a / armory.w + 0.5,
    o = 0.5 - n / armory.h;
  if (i < 0 || i > 1 || o < 0 || o > 1) return -1;
  const r = Math.floor((o * 1024 - AR_HEAD) / AR_ROW);
  return r >= 0 && r < UPGRADES.length ? r : -1;
}
function addArmory() {
  targets.some((e) => e.kind === "armory") ||
    (drawArmory(),
    addTarget({
      kind: "armory",
      R: 0.85 * 1.42,
      x: ARMORY_POS[0],
      y: ARMORY_POS[1],
      z: ARMORY_POS[2],
      y1: ARMORY_POS[1],
      scale: 0,
      fixedYaw: ARMORY_YAW,
    }));
}
Object.assign(PERKS, {
  speed: {
    name: "SPEED LOADER",
    desc: "Reload 40% faster.",
    once: !0,
    apply() {
      R.perks.speed = !0;
    },
  },
  mags: {
    name: "DEEP MAGS",
    desc: "Magazines hold 50% more.",
    once: !0,
    apply() {
      R.perks.mags = !0;
    },
  },
  greed: {
    name: "GREED",
    desc: "Earn 30% more gold.",
    once: !0,
    siege: !0,
    apply() {
      R.perks.greed = !0;
    },
  },
  rabbit: {
    name: "RABBIT FOOT",
    desc: "The coffin rolls rarer guns.",
    once: !0,
    siege: !0,
    apply() {
      R.perks.rabbit = !0;
    },
  },
});
function startSiege() {
  (resetRun(),
    clearEnemies(),
    (R.kind = "siege"),
    (S.mode = "run"),
    (S.last = "siege"),
    (S.newBest = !1),
    (signGoal = SIGN_DOWN),
    (PL.max = 5 + META.up.vital),
    (PL.hearts = PL.max),
    (R.gold = 250 * META.up.gold),
    (R.rolls = 0),
    (R.weapons.right = makeGun(META.up.sidearm ? "sixgun" : "peacemaker")),
    (R.weapons.left = makeGun("peacemaker")),
    (targets = targets.filter(
      (e) => e.kind !== "start" && e.kind !== "armory",
    )),
    (R.phase = "enter"),
    startContracts(),
    sfx.start(),
    drawBoard(!0),
    switchMap("night", () => {
      (addCoffin(), siegeNextWave());
    }));
}
function siegeNextWave() {
  R.wave++;
  const e = R.wave,
    s = e % 5 === 0;
  Object.assign(D, {
    hp: 1 + 0.1 * (e - 1),
    speed: Math.min(1.45, 1 + 0.025 * (e - 1)),
    cd: Math.max(0.55, 1 - 0.03 * (e - 1)),
    proj: Math.min(1.4, 1 + 0.02 * (e - 1)),
    dodge: Math.min(0.2, 0.012 * e),
  });
  const t = [
      ["shambler", 1],
      ["runner", e >= 2 ? Math.min(0.9, 0.12 + e * 0.06) : 0],
      ["crawler", e >= 3 ? 0.3 : 0],
      ["spitter", e >= 4 ? 0.25 : 0],
      ["bloater", e >= 4 ? 0.2 : 0],
      ["coyote", e >= 6 ? 0.25 : 0],
      ["skeleton", e >= 8 ? 0.12 : 0],
      ["bat", e >= 3 ? 0.12 : 0],
      ["skull", e >= 4 ? 0.15 : 0],
      ["burrower", e >= 5 ? 0.12 : 0],
      ["buzzard", e >= 6 ? 0.12 : 0],
    ],
    a = t.reduce((r, l) => r + l[1], 0),
    n = () => {
      let r = Math.random() * a;
      for (const [l, f] of t) if ((r -= f) < 0) return l;
      return "shambler";
    },
    i = s ? 4 + e : Math.min(48, Math.round(6 + e * 2.2)),
    o = [];
  for (let r = 0; r < i; r++) o.push(n());
  if (!s && e >= 3 && (e >= 5 || Math.random() < 0.6))
    for (let r = 0; r < (e >= 8 ? 2 : 1); r++)
      o.splice(
        Math.floor(o.length * (0.35 + r * 0.3)),
        0,
        Math.random() < 0.5 ? "brute" : "witch",
      );
  (s && o.unshift(["marshal", "titan", "drake"][(e / 5) % 3]),
    (R.queue = o),
    (R.cap = Math.min(12, 5 + Math.floor(e / 2))),
    (R.spawnT = 0.5),
    (PL.shield = Math.max(PL.shield, R.shieldMax)),
    (R.waveHit = !1),
    (R.spawned = 0),
    (R.waveSize = o.length),
    (R.bountyDone = e < 2),
    (R.phase = "intro"),
    (R.phaseT = 0),
    s
      ? showBanner(ETYPES[o[0]].name, "WAVE " + e + "  ·  BOSS")
      : showBanner(
          "WAVE " + e,
          e === 1 ? "THE DEAD ARE RISING" : i + " OF THE DEAD",
        ),
    sfx.wave(),
    drawBoard(!0));
}
function siegeUpdate(e) {
  if (((R.phaseT += e), updateCoffin(e), R.phase !== "enter"))
    if (R.phase === "intro")
      R.phaseT > 2.2 && ((R.phase = "fight"), (R.phaseT = 0));
    else if (R.phase === "fight") {
      R.spawnT -= e;
      const s = liveEnemies(),
        t = enemies.some((a) => (a.T.boss || a.T.mini) && a.state !== "dead");
      if (
        (R.queue.length &&
          R.spawnT <= 0 &&
          s < R.cap &&
          (maybeElite(spawnZombie(R.queue.shift())),
          R.spawned++,
          (R.spawnT = rand(0.5, 1.4) * (t ? 1.8 : 1))),
        !R.bountyDone &&
          R.spawned >= R.waveSize * 0.4 &&
          ((R.bountyDone = !0), markBounty()),
        !R.queue.length && liveEnemies() === 0)
      ) {
        ((R.phase = "clear"),
          (R.phaseT = 0),
          (R.bonus = 40 * R.wave),
          addGold(R.bonus, null),
          R.waveHit || (R.stat.clean = (R.stat.clean || 0) + 1));
        for (const a of eshots) puff(a.p, 2, [0.7, 0.6, 0.6], 0.15, 0.5);
        ((eshots = []),
          (pshots = []),
          showBanner("WAVE " + R.wave + " SURVIVED", "+$" + R.bonus + " bonus"),
          sfx.clear());
      }
    } else
      R.phase === "clear"
        ? R.phaseT > 1.8 &&
          (R.wave % 5 === 0
            ? (offerCrates(!0), (R.phase = "pick"))
            : openShop(),
          (R.phaseT = 0))
        : R.phase === "picked"
          ? R.phaseT > 1.2 && openShop()
          : R.phase === "shop"
            ? R.phaseT >= SIEGE_SHOP_SECONDS && closeShop()
            : R.phase === "leaving" && R.phaseT > 1.4 && siegeNextWave();
}
function addGold(e, s) {
  ((e = Math.round(e * (R.perks.greed ? 1.3 : 1))),
    (R.gold += e),
    (R.goldTotal = (R.goldTotal || 0) + e),
    s && popup("+$" + e, "#ffd257", s, 0.75),
    sfx.coin());
}
function siegeKill(e, s) {
  (addGold(
    ((e.T.gold || 20) + (e.lastCrit ? 10 : 0)) *
      comboMul() *
      (e.elite ? 2.5 : 1) *
      (e.bounty ? 3 : 1),
    [s[0], s[1] + 0.5 * Math.min(2, e.s), s[2]],
  ),
    (e.T.boss || e.T.mini) &&
      (R.bossKills++,
      e.T.boss && showBanner(e.T.name + " FALLS", "+$" + e.T.gold)));
}
const COFFIN = {
    t: null,
    st: "idle",
    time: 0,
    cycle: 0,
    show: "peacemaker",
    rar: 0,
    prize: null,
    a: -0.72,
  },
  coffinCost = () => 350 + 40 * R.rolls,
  PRIZE_LABEL = panel(512, 160, 0.9);
function coffinPos() {
  const [e, s] = arenaPoint(PL.viewA + COFFIN.a, ROOM.r + 2);
  return [e, s];
}
function addCoffin() {
  const [e, s] = coffinPos();
  ((COFFIN.st = "idle"),
    (COFFIN.time = 0),
    (COFFIN.prize = null),
    (COFFIN.t = addTarget({
      kind: "coffin",
      R: 0.5,
      x: e,
      y: 1,
      z: s,
      y1: 1,
      scale: 0,
      faceYaw: Math.atan2(ROOM.cx - e, ROOM.cz - s),
    })));
}
function rollRarity(e = 0) {
  const s = META.up.luck + (R.perks.rabbit ? 2 : 0) + e,
    t = R.wave,
    a = [60, 28 + 4 * s, 9 + 3 * s + 0.5 * t, 1.5 + 1.5 * s + 0.35 * t];
  let n = Math.random() * (a[0] + a[1] + a[2] + a[3]);
  for (let i = 0; i < 4; i++) if ((n -= a[i]) < 0) return i;
  return 0;
}
function randomGun() {
  const e = new Set([R.weapons.left.id, R.weapons.right.id]);
  let s = gunPool().filter((t) => !e.has(t));
  return (s.length || (s = gunPool()), s[Math.floor(Math.random() * s.length)]);
}
function paintPrize(e, s) {
  const t = PRIZE_LABEL.ctx;
  (t.clearRect(0, 0, 512, 160),
    (t.fillStyle = "rgba(20,16,32,0.88)"),
    t.fillRect(0, 10, 512, 140),
    (t.fillStyle = RAR[s].css),
    t.fillRect(0, 10, 512, 8),
    t.fillRect(0, 142, 512, 8),
    (t.textAlign = "center"),
    (t.textBaseline = "middle"),
    spaced(t, 4),
    (t.font = `700 26px ${FB}`),
    t.fillText(RAR[s].name, 256, 44),
    spaced(t, 0),
    (t.font = `58px ${FD}`),
    (t.fillStyle = "#f3e3c8"),
    t.fillText(WEAPONS[e].name, 256, 100, 480),
    upload(PRIZE_LABEL.tex, PRIZE_LABEL.cvs));
}
function hitCoffin(e) {
  if (COFFIN.st !== "idle") return;
  const s = coffinCost(),
    t = COFFIN.t;
  if (R.gold < s) {
    (sfx.deny(), popup("NEED $" + s, "#ff7a6a", [t.x, t.y + 1.3, t.z], 0.9));
    return;
  }
  ((R.gold -= s),
    R.rolls++,
    (COFFIN.st = "roll"),
    (COFFIN.time = 0),
    (COFFIN.cycle = 0),
    (COFFIN.hand = e.hand),
    sfx.boxOpen([t.x, t.y, t.z]),
    flashes.push({ p: [t.x, t.y + 0.5, t.z], t: 0, s: 2.5, c: [1, 0.85, 0.5] }),
    drawBoard(!0));
}
function updateCoffin(e) {
  const s = COFFIN.t;
  if (!(!s || s.state !== "live"))
    if (((COFFIN.time += e), COFFIN.st === "roll")) {
      if (((COFFIN.cycle -= e), COFFIN.cycle <= 0)) {
        const t = gunPool();
        ((COFFIN.show = t[Math.floor(Math.random() * t.length)]),
          (COFFIN.rar = Math.floor(Math.random() * 4)),
          (COFFIN.cycle = lerp(0.07, 0.3, COFFIN.time / 2.6)),
          sfx.boxTick([s.x, s.y + 1, s.z]));
      }
      if (COFFIN.time > 2.6) {
        const t = randomGun(),
          a = rollRarity();
        ((COFFIN.show = t),
          (COFFIN.rar = a),
          (COFFIN.st = "offer"),
          (COFFIN.time = 0),
          paintPrize(t, a),
          sfx.boxDone([s.x, s.y + 1, s.z], a));
        const n = prizePos();
        ((COFFIN.prize = addTarget({
          kind: "prize",
          R: 0.3,
          x: n[0],
          y: n[1],
          z: n[2],
          y1: n[1],
          scale: 1,
          gun: { id: t, rar: a },
        })),
          a >= 3 &&
            (showBanner("LEGENDARY", WEAPONS[t].name),
            flashes.push({ p: n, t: 0, s: 4, c: [1, 0.8, 0.3] })));
      }
    } else
      COFFIN.st === "offer"
        ? (COFFIN.time > 9 || !COFFIN.prize || COFFIN.prize.state !== "live") &&
          (COFFIN.prize &&
            COFFIN.prize.state === "live" &&
            (COFFIN.prize.state = "retract"),
          (COFFIN.prize = null),
          (COFFIN.st = "close"),
          (COFFIN.time = 0))
        : COFFIN.st === "close" &&
          COFFIN.time > 0.6 &&
          ((COFFIN.st = "idle"), (COFFIN.time = 0));
}
function prizePos() {
  const e = COFFIN.t,
    s = e.faceYaw;
  return [e.x + Math.sin(s) * 0.7, 1.35, e.z + Math.cos(s) * 0.7];
}
function takePrize(e, s) {
  const t = s.hand === "left" ? "left" : "right";
  (equip(t, e.gun.id, e.gun.rar),
    (e.state = "hit"),
    (e.hitT = 0),
    popup(RAR[e.gun.rar].name, RAR[e.gun.rar].css, [e.x, e.y + 0.5, e.z], 0.9),
    sfx.pick(),
    crateBurst(e));
}
const SHOP_LABELS = Array.from({ length: 6 }, () => panel(256, 256, 0.5)),
  READY_TEX = canvasTex(256, 256, (e, s) => {
    const t = s / 2,
      a = s / 2 - 3;
    for (let n = 0; n < 4; n++)
      (e.beginPath(),
        e.arc(t, t, a * (1 - n * 0.22), 0, TAU),
        (e.fillStyle = ["#2a2632", "#3f6a3a", "#2a2632", "#5fa04a"][n]),
        e.fill());
    ((e.fillStyle = "#f3e3c8"),
      (e.font = `46px ${FD}`),
      (e.textAlign = "center"),
      (e.textBaseline = "middle"),
      e.fillText("READY", t, t - 8, a * 1.5),
      (e.font = `700 18px ${FB}`),
      e.fillText("NEXT WAVE", t, t + 30, a * 1.5));
  });
function paintShopCard(e, s) {
  const t = e.ctx,
    a = 256,
    n = R.gold >= s.price,
    i =
      s.type === "weapon"
        ? RAR[s.rar].css
        : s.type === "perk"
          ? "#b58aff"
          : s.type === "temper"
            ? "#ff8a2a"
            : "#5fd38a";
  ((t.fillStyle = "#efe2c6"),
    t.fillRect(0, 0, a, a),
    (t.fillStyle = i),
    t.fillRect(0, 0, a, 46),
    (t.fillStyle = "#2b2140"),
    (t.font = `700 22px ${FB}`),
    (t.textAlign = "center"),
    (t.textBaseline = "middle"),
    spaced(t, 3),
    t.fillText(
      s.type === "weapon"
        ? RAR[s.rar].name
        : s.type === "perk"
          ? "PERK"
          : s.type === "temper"
            ? "UPGRADE"
            : "SUPPLIES",
      a / 2,
      24,
    ),
    spaced(t, 0),
    (t.font = `38px ${FD}`),
    t.fillText(s.name, a / 2, 92, 236),
    (t.font = `600 20px ${FB}`),
    (t.fillStyle = "#4a3d5e"));
  const o = s.desc.split(" ");
  let r = "",
    l = 134;
  for (const f of o) {
    const c = r ? r + " " + f : f;
    t.measureText(c).width > 222
      ? (t.fillText(r, a / 2, l), (r = f), (l += 24))
      : (r = c);
  }
  (r && t.fillText(r, a / 2, l),
    (t.fillStyle = n ? "#2b2140" : "#b0402e"),
    t.fillRect(40, 196, a - 80, 46),
    (t.fillStyle = n ? "#ffd257" : "#ffe0d8"),
    (t.font = `40px ${FD}`),
    t.fillText("$" + s.price, a / 2, 221, a - 90),
    (t.strokeStyle = "#2b2140"),
    (t.lineWidth = 8),
    t.strokeRect(4, 4, a - 8, a - 8),
    upload(e.tex, e.cvs));
}
function shopItems() {
  const e = [];
  for (let t = 0; t < 2; t++) {
    const a = randomGun(),
      n = rollRarity(0.5);
    e.push({
      type: "weapon",
      id: a,
      rar: n,
      name: WEAPONS[a].name,
      desc: WEAPONS[a].desc,
      price: [250, 450, 800, 1300][n] + R.wave * 10,
    });
  }
  e.push({
    type: "temper",
    name: "TEMPER",
    desc: "Raise the rarity of the gun that shoots this.",
    price: 500,
  });
  const s = shuffle(
    Object.keys(PERKS).filter((t) => !(PERKS[t].once && R.perks[t])),
  );
  if (
    (s.length &&
      e.push({
        type: "perk",
        id: s[0],
        name: PERKS[s[0]].name,
        desc: PERKS[s[0]].desc,
        price: 600 + 50 * R.wave,
      }),
    PL.hearts < PL.max)
  )
    e.push({
      type: "heal",
      name: "BANDAGES",
      desc: "Heal one heart.",
      price: 150,
    });
  else {
    const t = randomGun(),
      a = rollRarity(0.5);
    e.push({
      type: "weapon",
      id: t,
      rar: a,
      name: WEAPONS[t].name,
      desc: WEAPONS[t].desc,
      price: [250, 450, 800, 1300][a] + R.wave * 10,
    });
  }
  return (
    e.push({
      type: "armor",
      name: "IRON VEST",
      desc: "Armor that blocks one hit.",
      price: 250,
    }),
    e.slice(0, 6)
  );
}
function openShop() {
  ((R.phase = "shop"), (R.phaseT = 0));
  const e = shopItems(),
    s = e.length;
  e.forEach((a, n) => {
    const i = PL.viewA + (n - (s - 1) / 2) * 0.33,
      o = SHOP_LABELS[n];
    (paintShopCard(o, a),
      addTarget({
        kind: "shop",
        item: a,
        slot: o,
        R: 0.34,
        x: headPos[0] + Math.sin(i) * 2.4,
        z: headPos[2] - Math.cos(i) * 2.4,
        y: 7 + n * 0.4,
        y1: 1.5,
        ph: n * 1.3,
        landed: !1,
        offer: {
          type:
            a.type === "weapon"
              ? "weapon"
              : a.type === "perk"
                ? "perk"
                : "heal",
        },
      }));
  });
  const t = PL.viewA;
  (addTarget({
    kind: "ready",
    R: 0.3,
    x: headPos[0] + Math.sin(t) * 2.2,
    z: headPos[2] - Math.cos(t) * 2.2,
    y: 0.85,
    y1: 0.85,
    scale: 0,
  }),
    showBanner(
      "THE TRADER",
      "Next wave in " + SIEGE_SHOP_SECONDS + "s · shoot READY to start early",
    ));
}
function repaintShop() {
  for (const e of targets)
    e.kind === "shop" && e.state === "live" && paintShopCard(e.slot, e.item);
}
function buyItem(e, s) {
  const t = e.item;
  if (R.gold < t.price) {
    (sfx.deny(),
      popup("NEED $" + t.price, "#ff7a6a", [e.x, e.y + 0.5, e.z], 0.8));
    return;
  }
  const a = s.hand === "left" ? "left" : "right";
  if (t.type === "temper" && R.weapons[a].rar >= 3) {
    (sfx.deny(), popup("MAXED", "#ff7a6a", [e.x, e.y + 0.5, e.z], 0.8));
    return;
  }
  if (((R.gold -= t.price), t.type === "weapon")) equip(a, t.id, t.rar);
  else if (t.type === "temper") {
    const n = R.weapons[a];
    ((R.weapons[a] = makeGun(n.id, n.rar + 1, n.mods)),
      popup(
        RAR[n.rar + 1].name,
        RAR[n.rar + 1].css,
        [e.x, e.y + 0.6, e.z],
        0.9,
      ));
  } else
    t.type === "perk"
      ? (PERKS[t.id].apply(), (R.perks[t.id] = R.perks[t.id] || !0))
      : t.type === "heal"
        ? healPlayer(1)
        : t.type === "armor" && (PL.shield++, (PL.shieldFx = 1), sfx.shield());
  (t.type !== "temper" && popup(t.name, "#7fe0a0", [e.x, e.y + 0.6, e.z], 0.8),
    sfx.buy(),
    (e.state = "hit"),
    (e.hitT = 0),
    crateBurst(e),
    repaintShop(),
    drawBoard(!0));
}
function closeShop() {
  for (const e of targets)
    (e.kind === "shop" || e.kind === "ready") &&
      e.state === "live" &&
      ((e.state = "retract"),
      puff([e.x, e.y, e.z], 4, [0.75, 0.6, 0.5], 0.25, 1));
  ((R.phase = "leaving"), (R.phaseT = 0), hideBanner());
}
function siegeOffers() {
  const e = shuffle(
      Object.keys(PERKS).filter((n) => !(PERKS[n].once && R.perks[n])),
    ),
    s = [],
    t = randomGun(),
    a = Math.max(2, rollRarity(1));
  for (
    s.push({
      type: "weapon",
      id: t,
      rar: a,
      name: WEAPONS[t].name,
      desc: RAR[a].name.toLowerCase() + " · " + WEAPONS[t].desc,
    });
    s.length < 3 && e.length;
  ) {
    const n = e.shift();
    s.push({ type: "perk", id: n, name: PERKS[n].name, desc: PERKS[n].desc });
  }
  return shuffle(s);
}
const SIEGE_TEX = canvasTex(256, 256, (e, s) => {
  const t = s / 2,
    a = s / 2 - 3,
    n = ["#1a1a2a", "#2e3a5a", "#1a1a2a", "#3e5a7a"];
  for (let i = 0; i < 4; i++)
    (e.beginPath(),
      e.arc(t, t, a * (1 - i * 0.22), 0, TAU),
      (e.fillStyle = n[i]),
      e.fill());
  (e.beginPath(),
    e.arc(t + 6, t - 4, a * 0.28, 0, TAU),
    (e.fillStyle = "#eef0e0"),
    e.fill(),
    e.beginPath(),
    e.arc(t + 18, t - 12, a * 0.24, 0, TAU),
    (e.fillStyle = "#3e5a7a"),
    e.fill(),
    (e.font = `32px ${FD}`),
    (e.textAlign = "center"),
    (e.textBaseline = "middle"),
    (e.fillStyle = "#d8e0f0"),
    e.fillText("NIGHT SIEGE", t, t - a * 0.62, a * 1.3),
    (e.font = `700 19px ${FB}`),
    e.fillText("ZOMBIE WAVES", t, t + a * 0.66, a * 1.3),
    paperGrain(e, t, a, 9, 700));
});
(() => {
  const e = [
      [-0.18, 0.05],
      [-0.31, 1.35],
      [-0.22, 1.95],
      [0.22, 1.95],
      [0.31, 1.35],
      [0.18, 0.05],
    ],
    s = new Geo(),
    t = new Geo(),
    a = new Geo(),
    n = -0.17,
    i = 0.15;
  for (let l = 0; l < 6; l++) {
    const f = e[l],
      c = e[(l + 1) % 6];
    s.quad(
      [f[0], f[1], i],
      [c[0], c[1], i],
      [c[0], c[1], n],
      [f[0], f[1], n],
      l % 2 ? C.zLid : mix3(C.zLid, [0, 0, 0], 0.2),
    );
  }
  for (const [l, f, c] of [
    [0, 1, 4],
    [0, 4, 5],
    [1, 2, 3],
    [1, 3, 4],
  ])
    s.tri(
      [e[l][0], e[l][1], n],
      [e[f][0], e[f][1], n],
      [e[c][0], e[c][1], n],
      C.zLid,
    );
  for (const [l, f, c] of [
    [0, 1, 4],
    [0, 4, 5],
    [1, 2, 3],
    [1, 3, 4],
  ])
    s.tri(
      [e[l][0] * 0.86, e[l][1] * 0.97 + 0.03, i - 0.12],
      [e[f][0] * 0.86, e[f][1] * 0.97 + 0.03, i - 0.12],
      [e[c][0] * 0.86, e[c][1] * 0.97 + 0.03, i - 0.12],
      hex("#1a1216"),
    );
  box(s, 0, 0.02, -0.01, 0.7, 0.06, 0.5, C.nStoneDk);
  for (const [l, f, c] of [
    [0, 1, 4],
    [0, 4, 5],
    [1, 2, 3],
    [1, 3, 4],
  ])
    a.tri(
      [e[l][0] * 0.8, e[l][1] * 0.95 + 0.05, i - 0.1],
      [e[f][0] * 0.8, e[f][1] * 0.95 + 0.05, i - 0.1],
      [e[c][0] * 0.8, e[c][1] * 0.95 + 0.05, i - 0.1],
      C.white1,
    );
  const o = e.map(([l, f]) => [l + 0.31, f]);
  for (const [l, f, c] of [
    [0, 1, 4],
    [0, 4, 5],
    [1, 2, 3],
    [1, 3, 4],
  ])
    (t.tri(
      [o[l][0], o[l][1], 0],
      [o[f][0], o[f][1], 0],
      [o[c][0], o[c][1], 0],
      mix3(C.zLid, [1, 1, 1], 0.08),
    ),
      t.tri(
        [o[l][0], o[l][1], 0.04],
        [o[f][0], o[f][1], 0.04],
        [o[c][0], o[c][1], 0.04],
        C.zLid,
      ));
  (box(t, 0.31, 1.2, 0.05, 0.05, 0.62, 0.02, C.brass),
    box(t, 0.31, 1.32, 0.05, 0.34, 0.05, 0.02, C.brass));
  for (const l of [0.4, 1.6]) box(t, 0, l, 0.02, 0.05, 0.12, 0.06, C.nIron);
  ((EM.coffin = s.mesh()),
    (EM.coffinLid = t.mesh()),
    (EM.coffinGlow = a.mesh()));
  const r = new Geo();
  (cyl(r, 0, 0, 0, 0.035, 0.03, 0.22, 8, hex("#e8e0c8"), hex("#e8e0c8")),
    (EM.candle = r.mesh()));
})();
const COFFIN_SIGN = panel(512, 128, 0.9);
let coffinSignKey = "";
function paintCoffinSign() {
  const e = coffinCost() + "|" + (R.gold >= coffinCost());
  if (e === coffinSignKey) return;
  coffinSignKey = e;
  const s = COFFIN_SIGN.ctx;
  (s.clearRect(0, 0, 512, 128),
    (s.fillStyle = "rgba(28,23,48,0.9)"),
    s.fillRect(0, 0, 512, 128),
    (s.strokeStyle = "#ffd257"),
    (s.lineWidth = 6),
    s.strokeRect(3, 3, 506, 122),
    (s.textAlign = "center"),
    (s.textBaseline = "middle"),
    spaced(s, 0),
    (s.font = `52px ${FD}`),
    (s.fillStyle = "#f3e3c8"),
    s.fillText("LUCKY COFFIN", 256, 48, 480),
    (s.font = `700 32px ${FB}`),
    (s.fillStyle = R.gold >= coffinCost() ? "#ffd257" : "#ff8a7a"),
    s.fillText("$" + coffinCost() + "  ·  SHOOT TO OPEN", 256, 96, 480),
    upload(COFFIN_SIGN.tex, COFFIN_SIGN.cvs));
}
