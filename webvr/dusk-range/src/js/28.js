"use strict";
const GENRES = [
    {
      name: "OUTLAW BOTS",
      types: ["gunslinger", "gunslinger", "dynamiter"],
      boss: "sheriff",
    },
    {
      name: "INVADERS",
      types: ["saucer", "drone", "blob", "drone"],
      boss: "mothership",
    },
    {
      name: "WILD THINGS",
      types: ["scorpion", "scorpion", "buzzard"],
      boss: "wyrm",
    },
    {
      name: "THE RESTLESS",
      types: ["skeleton", "ghost", "ghost"],
      boss: "marshal",
    },
  ],
  COST = {
    gunslinger: 2,
    dynamiter: 2.5,
    saucer: 2.5,
    blob: 3,
    scorpion: 2,
    buzzard: 1.5,
    skeleton: 2,
    ghost: 2,
    drone: 1.5,
  },
  PERKS = {
    heart: {
      name: "IRON HEART",
      desc: "+1 max heart and heal one.",
      apply() {
        (PL.max++, healPlayer(1));
      },
    },
    trigger: {
      name: "HAIR TRIGGER",
      desc: "Every gun fires 25% faster.",
      apply() {
        R.rate *= 0.8;
      },
    },
    hollow: {
      name: "HOLLOW POINTS",
      desc: "All shots deal 30% more damage.",
      apply() {
        R.dmg *= 1.3;
      },
    },
    deadeye: {
      name: "DEAD EYE",
      desc: "Head and weak-spot hits deal triple.",
      once: !0,
      apply() {
        R.perks.deadeye = !0;
      },
    },
    shield: {
      name: "TIN STAR",
      desc: "A shield blocks one hit every wave.",
      apply() {
        (R.shieldMax++, (PL.shield = R.shieldMax));
      },
    },
    leech: {
      name: "LIFE LEECH",
      desc: "Heal one heart every 12 kills.",
      once: !0,
      apply() {
        R.perks.leech = !0;
      },
    },
    slow: {
      name: "SLOW BURN",
      desc: "Enemy shots fly 25% slower.",
      once: !0,
      apply() {
        R.perks.slow = !0;
      },
    },
  },
  R = {
    stat: {},
    xp: 0,
    lvl: 1,
    lvlPending: 0,
    combo: 0,
    kind: "survival",
    wave: 0,
    kills: 0,
    score: 0,
    gold: 0,
    dmg: 1,
    rate: 1,
    shieldMax: 0,
    perks: {},
    weapons: { left: makeGun("peacemaker"), right: makeGun("peacemaker") },
    queue: [],
    spawnT: 0,
    cap: 3,
    phase: "",
    phaseT: 0,
    leech: 0,
    genre: GENRES[0],
    bonus: 0,
  };
function resetRun() {
  clearGameEffects();
  resetExpedition();
  R.extracted = false;
  (Object.assign(R, {
    kind: "survival",
    wave: 0,
    kills: 0,
    score: 0,
    gold: 0,
    dmg: 1,
    rate: 1,
    shieldMax: 0,
    perks: {},
    weapons: { left: makeGun("peacemaker"), right: makeGun("peacemaker") },
    queue: [],
    spawnT: 0,
    cap: 3,
    phase: "",
    phaseT: 0,
    leech: 0,
    leechAcc: 0,
    bonus: 0,
    rolls: 0,
    bossKills: 0,
    stat: {},
    xp: 0,
    lvl: 1,
    lvlPending: 0,
    lvlUp: null,
    combo: 0,
    comboT: 0,
    streakN: 0,
    streakT: -9,
    contracts: null,
    contractSouls: 0,
    waveHit: !1,
    spawned: 0,
    souls: 0,
    goldTotal: 0,
  }),
    (coins.length = 0),
    (nums.length = 0),
    Object.assign(PL, {
      hearts: 5,
      max: 5,
      shield: 0,
      invuln: 0,
      hurt: 0,
      heal: 0,
    }));
}
function startRun() {
  (resetRun(),
    clearEnemies(),
    (S.mode = "run"),
    (S.last = "run"),
    (S.newBest = !1),
    (signGoal = SIGN_DOWN),
    (targets = targets.filter(
      (e) => e.kind !== "start" && e.kind !== "crate" && e.kind !== "armory",
    )),
    startContracts(),
    sfx.start(),
    nextWave(),
    drawBoard(!0));
}
function shuffle(e) {
  for (let t = e.length - 1; t > 0; t--) {
    const a = Math.floor(Math.random() * (t + 1));
    [e[t], e[a]] = [e[a], e[t]];
  }
  return e;
}
function nextWave() {
  R.wave++;
  const e = R.wave,
    t = Math.floor((e - 1) / 20),
    a = GENRES[Math.floor((e - 1) / 5) % 4],
    n = e % 5 === 0;
  (Object.assign(D, {
    hp: 1 + 0.08 * (e - 1) + 0.6 * t,
    speed: Math.min(1.5, 1 + 0.02 * (e - 1)),
    cd: Math.max(0.5, 1 - 0.025 * (e - 1)),
    proj: Math.min(1.4, 1 + 0.015 * (e - 1)),
    dodge: Math.min(0.25, 0.015 * e),
  }),
    (R.genre = a));
  const o = a.types.slice(),
    s = [];
  for (let l = 0; l < Math.min(4, Math.floor((e - 1) / 5)); l++)
    s.push(...GENRES[l].types);
  const r = [];
  let i = n ? 1.5 + e * 0.25 : 3 + e * 1.5 + t * 4;
  for (; i > 0;) {
    const l =
      s.length && Math.random() < 0.25
        ? s[Math.floor(Math.random() * s.length)]
        : o[Math.floor(Math.random() * o.length)];
    (r.push(l), (i -= COST[l]));
  }
  ((R.queue = n ? [a.boss, ...shuffle(r)] : shuffle(r)),
    (R.cap = Math.min(8, 2 + Math.floor(e / 2))),
    (R.spawnT = 0.6),
    (PL.shield = Math.max(PL.shield, R.shieldMax)),
    (R.waveHit = !1),
    (R.phase = "intro"),
    (R.phaseT = 0),
    n
      ? showBanner(ETYPES[a.boss].name, "WAVE " + e + "  ·  BOSS")
      : showBanner("WAVE " + e, a.name),
    sfx.wave());
}
function liveEnemies() {
  let e = 0;
  for (const t of enemies) t.state !== "dead" && e++;
  return e;
}
function runUpdate(e) {
  if (((R.phaseT += e), R.phase === "intro"))
    R.phaseT > 2.2 && ((R.phase = "fight"), (R.phaseT = 0));
  else if (R.phase === "fight") {
    R.spawnT -= e;
    const t = liveEnemies(),
      a = enemies.some((n) => n.T.boss && n.state !== "dead");
    if (
      (R.queue.length &&
        R.spawnT <= 0 &&
        t < R.cap &&
        (maybeElite(spawnEnemy(R.queue.shift())),
        (R.spawnT = rand(0.9, 2) * (a ? 2.5 : 1))),
      !R.queue.length && liveEnemies() === 0)
    ) {
      ((R.phase = "clear"),
        (R.phaseT = 0),
        (R.bonus = 50 * R.wave),
        (R.score += R.bonus),
        R.waveHit || (R.stat.clean = (R.stat.clean || 0) + 1));
      for (const n of eshots) puff(n.p, 2, [0.7, 0.6, 0.6], 0.15, 0.5);
      ((eshots = []),
        (pshots = []),
        showBanner("WAVE " + R.wave + " CLEARED", "+" + R.bonus + " bonus"),
        sfx.clear());
    }
  } else
    R.phase === "clear"
      ? R.phaseT > 1.8 && (offerCrates(), (R.phase = "pick"), (R.phaseT = 0))
      : R.phase === "picked" && R.phaseT > 1.5 && nextWave();
}
function makeOffers() {
  const e = new Set([R.weapons.left.id, R.weapons.right.id]);
  let t = shuffle(WEAPON_IDS.filter((s) => s !== "peacemaker" && !e.has(s)));
  t.length < 2 && (t = shuffle(WEAPON_IDS.filter((s) => s !== "peacemaker")));
  const a = shuffle(
      Object.keys(PERKS).filter(
        (s) => !PERKS[s].siege && !(PERKS[s].once && R.perks[s]),
      ),
    ),
    n = R.wave % 5 === 0 || Math.random() < 0.6 ? 2 : 1,
    o = [];
  for (let s = 0; s < n && t.length; s++) {
    const r = t.shift();
    o.push({
      type: "weapon",
      id: r,
      name: WEAPONS[r].name,
      desc: WEAPONS[r].desc,
    });
  }
  if (Math.random() < 0.6) {
    const s = modPool(),
      r = s[Math.floor(Math.random() * s.length)];
    o.push({
      type: "mod",
      id: r,
      name: MODS[r].name,
      desc: MODS[r].desc + " Goes on the gun that shoots it.",
    });
  }
  for (; o.length < 3 && a.length;) {
    const s = a.shift();
    o.push({ type: "perk", id: s, name: PERKS[s].name, desc: PERKS[s].desc });
  }
  return (
    PL.hearts < PL.max &&
      Math.random() < 0.55 &&
      (o[2] = {
        type: "heal",
        id: "patch",
        name: "PATCH KIT",
        desc: "Heal two hearts right now.",
      }),
    shuffle(o)
  );
}
function offerCrates(e) {
  ((e ? siegeOffers() : makeOffers()).forEach((a, n) => {
    const o = PL.viewA + (n - 1) * 0.44,
      s = CRATE_LABELS[n];
    (paintCrate(s, a),
      addTarget({
        kind: "crate",
        offer: a,
        slot: s,
        R: 0.34,
        x: headPos[0] + Math.sin(o) * 2.5,
        z: headPos[2] - Math.cos(o) * 2.5,
        y: 8 + n * 0.8,
        y1: 1.3,
        ph: n * 2.1,
        landed: !1,
      }));
  }),
    showBanner(
      "PICK A SUPPLY CRATE",
      "Shoot one. Weapons go to the hand that shoots.",
    ));
}
function pickCrate(e, t) {
  const a = e.offer;
  if (a.type === "weapon") {
    const n = t === "left" ? "left" : "right";
    (equip(n, a.id, a.rar || 0),
      popup(a.name, "#ffb35a", [e.x, e.y + 0.6, e.z], 1.1));
  } else
    a.type === "mod"
      ? attachMod(t === "left" ? "left" : "right", a.id, [e.x, e.y + 0.6, e.z])
      : a.type === "perk"
        ? (PERKS[a.id].apply(),
          (R.perks[a.id] = R.perks[a.id] || !0),
          popup(a.name, "#c9a8ff", [e.x, e.y + 0.6, e.z], 1.1))
        : (healPlayer(2),
          popup("+2 HEARTS", "#7fe0a0", [e.x, e.y + 0.6, e.z], 1.1));
  sfx.pick();
  for (const n of targets)
    n.kind === "crate" &&
      n !== e &&
      ((n.state = "retract"),
      puff([n.x, n.y, n.z], 5, [0.75, 0.6, 0.5], 0.3, 1));
  ((R.phase = "picked"), (R.phaseT = 0));
}
function endRun(extracted = false) {
  if (S.mode !== "run" || (extracted && !canExtract())) return;
  R.extracted = extracted;
  const e = R.kind === "siege",
    t = R.kind === "td";
  ((S.mode = "results"),
    (S.last = e ? "siege" : t ? "td" : "run"),
    (timeScale = 0.25));
  const a = rankOf(META.total),
    n = awardSouls() + (R.contractSouls || 0),
    o = rankOf(META.total);
  (o > a &&
    scheduleGameEffect(() => {
      (showBanner("RANK " + o, "Unlocked: " + rankRewards(o)), sfx.rankUp());
    }, 2600),
    (R.lvlUp = null),
    (targets = targets.filter((s) => s.kind !== "lvl" && s.kind !== "loot")),
    extracted ? sfx.clear() : sfx.die(),
    showBanner(
      extracted
        ? "EXTRACTION COMPLETE"
        : e
          ? "THE DEAD TAKE YOU"
          : t
            ? "THE CITY FALLS"
            : "YOU'RE DOWN",
      "Wave " + R.wave + "  ·  +" + n + " souls",
    ),
    clearEnemies(),
    (targets = targets.filter(
      (s) => !["crate", "shop", "ready", "coffin", "prize"].includes(s.kind),
    )),
    (COFFIN.t = null),
    (COFFIN.prize = null),
    (S.newBest = !1),
    e
      ? R.wave > S.bestSiege &&
        ((S.bestSiege = R.wave),
        saveNum("dusk-range-best-siege", R.wave),
        (S.newBest = !0))
      : t
        ? R.wave > S.bestTD &&
          ((S.bestTD = R.wave),
          saveNum("dusk-range-best-td", R.wave),
          (S.newBest = !0))
        : (R.wave > S.bestWave &&
            ((S.bestWave = R.wave),
            saveNum("dusk-range-best-wave", R.wave),
            (S.newBest = !0)),
          R.score > S.bestRun &&
            ((S.bestRun = R.score),
            saveNum("dusk-range-best-run", R.score),
            (S.newBest = !0))),
    updateBestOut(),
    drawSignResults(),
    drawBoard(!0),
    e || t
      ? ((S.replaySpawned = !0), (S.returnAt = clock + (t ? 4 : 3)))
      : ((signGoal = SIGN_UP),
        (S.replayAt = clock + 2.4),
        (S.replaySpawned = !1)));
}
