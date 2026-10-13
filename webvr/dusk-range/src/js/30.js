"use strict";
const DIGITS = "0123456789!+$",
  DIG_TEX = canvasTex(512, 64, (t) => {
    ((t.font = `52px ${FD}`),
      (t.textAlign = "center"),
      (t.textBaseline = "middle"),
      (t.lineJoin = "round"));
    for (let s = 0; s < DIGITS.length; s++) {
      const e = s * 38 + 19;
      ((t.lineWidth = 9),
        (t.strokeStyle = "rgba(24,18,36,0.95)"),
        t.strokeText(DIGITS[s], e, 34),
        (t.fillStyle = "#ffffff"),
        t.fillText(DIGITS[s], e, 34));
    }
  }),
  DIG_MESH = DIGITS.split("").map((t, s) => {
    const e = new TGeo();
    return (
      e.quad(
        [-0.5, -0.5, 0],
        [0.5, -0.5, 0],
        [0.5, 0.5, 0],
        [-0.5, 0.5, 0],
        [(s * 38) / 512, 0, ((s + 1) * 38) / 512, 1],
      ),
      e.mesh()
    );
  }),
  nums = [];
function dmgNumber(t, s, e) {
  const o = Math.max(1, Math.round(s * 10));
  (nums.length >= 16 && nums.shift(),
    nums.push({
      p: [t[0] + rand(-0.1, 0.1), t[1] + 0.15, t[2] + rand(-0.1, 0.1)],
      s: String(o) + (e ? "!" : ""),
      t: 0,
      crit: e,
      col: e ? [1, 0.85, 0.25] : [1, 1, 1],
    }));
}
function drawNumbers(t) {
  for (const s of nums) {
    const e = s.t / 0.75,
      o = s.p[1] + e * 0.5,
      n = Math.hypot(t[0] - s.p[0], t[2] - s.p[2]),
      l =
        (0.1 + n * 0.018) *
        (s.crit ? 1.45 : 1) *
        (1 + Math.max(0, 0.25 - s.t) * 2),
      i = Math.atan2(t[0] - s.p[0], t[2] - s.p[2]),
      a = Math.cos(i),
      d = -Math.sin(i),
      r = l * 0.62,
      f = s.s.length;
    for (let c = 0; c < f; c++) {
      const p = DIGITS.indexOf(s.s[c]),
        h = (c - (f - 1) / 2) * r * 0.8;
      drawT(
        DIG_MESH[p],
        DIG_TEX.tex,
        trs(MM, s.p[0] + a * h, o, s.p[2] + d * h, i, 0, 0, r, l, 1),
        s.col,
        e < 0.6 ? 1 : 1 - (e - 0.6) / 0.4,
        0.05,
        0,
        0,
      );
    }
  }
}
const STREAK = [
  "",
  "",
  "DOUBLE KILL",
  "TRIPLE KILL",
  "QUAD KILL",
  "RAMPAGE",
  "UNSTOPPABLE",
  "GODLIKE",
];
function onKillReward(t, s) {
  careerKill(t);
  if (
    ((R.stat.kills = (R.stat.kills || 0) + 1),
    (R.stat["k_" + t.type] = (R.stat["k_" + t.type] || 0) + 1),
    t.lastCrit &&
      ((R.stat.heads = (R.stat.heads || 0) + 1),
      t.T.undead &&
        !t.T.boss &&
        t.type !== "bat" &&
        t.type !== "skull" &&
        t.type !== "burrower"))
  ) {
    const n = t.hbw[1] || t.hbw[0];
    if (n) {
      for (let l = 0; l < 8; l++) {
        const i = rdir(0.8),
          a = rand(1.5, 4);
        part(
          "cube",
          [n[0], n[1], n[2]],
          [i[0] * a, i[1] * a + 1, i[2] * a],
          [0.05, 0.05, 0.05],
          l % 2 ? C.zSkin : C.zBlood,
          1.4,
          { grav: 9, bounce: 0.3 },
        );
      }
      (part(
        "cube",
        [n[0], n[1], n[2]],
        [rand(-1.5, 1.5), 4, rand(-1.5, 1.5)],
        [0.22, 0.24, 0.22],
        C.zSkin,
        2.5,
        { grav: 9, bounce: 0.4 },
      ),
        sfx.headpop([n[0], n[1], n[2]]));
    }
  }
  (t.elite && (R.stat.elites = (R.stat.elites || 0) + 1),
    t.T.boss && (R.stat.bosses = (R.stat.bosses || 0) + 1));
  const e = R.kind === "td" && t.byTower;
  (e ||
    ((R.streakN = clock - R.streakT < 1.4 ? R.streakN + 1 : 1),
    (R.streakT = clock),
    (R.stat.bestStreak = Math.max(R.stat.bestStreak || 0, R.streakN)),
    R.streakN >= 2 &&
      (popup(
        STREAK[Math.min(7, R.streakN)],
        "#ff7a2a",
        [s[0], s[1] + 1.1 * Math.min(2, t.s), s[2]],
        0.9,
      ),
      sfx.streak(R.streakN),
      goldMode() ? addGold(10 * R.streakN, null) : (R.score += 15 * R.streakN)),
    (R.combo = Math.min(40, R.combo + 1)),
    (R.comboT = 3.5)),
    gainXP(
      (t.T.xp ?? (t.T.boss ? 25 : t.T.mini ? 8 : 1) * (t.elite ? 3 : 1)) *
        (e ? 0.35 : 1),
    ));
  const o = Math.random();
  (t.bounty
    ? (dropLoot(
        s,
        Math.random() < 0.5 ? "gun" : "mod",
        2 + (Math.random() < 0.35 ? 1 : 0),
      ),
      (R.stat.bounties = (R.stat.bounties || 0) + 1))
    : t.T.boss
      ? (dropLoot(s, "gun", 3), dropLoot([s[0] + 1, s[1], s[2]], "mod", 2))
      : t.T.mini || t.elite
        ? dropLoot(s, o < 0.7 ? "mod" : "gun", t.T.mini ? 2 : 1)
        : o < 0.025
          ? dropLoot(s, "mod", 0)
          : o < 0.05 && PL.hearts < PL.max && dropLoot(s, "heart", 0),
    (R.kind === "siege" ||
      (R.kind === "td" &&
        !e &&
        Math.hypot(s[0] - headPos[0], s[2] - headPos[2]) < 20)) &&
      spawnCoins(s, Math.min(6, 1 + Math.floor((t.T.gold || 20) / 20))));
}
const comboMul = () => 1 + Math.min(1, (R.combo || 0) * 0.04),
  xpNext = (t) => 4 + t * 3;
function gainXP(t) {
  for (R.xp += t; R.xp >= xpNext(R.lvl);)
    ((R.xp -= xpNext(R.lvl)), R.lvl++, R.lvlPending++, (R.stat.level = R.lvl));
}
const BOONS = {
  sharp: {
    name: "SHARPSHOOTER",
    desc: "+12% damage with everything.",
    apply() {
      R.dmg *= 1.12;
    },
  },
  vigor: {
    name: "VIGOR",
    desc: "+1 max heart and heal it.",
    apply() {
      (PL.max++, healPlayer(1));
    },
  },
  mend: {
    name: "MEND",
    desc: "Heal two hearts.",
    apply() {
      healPlayer(2);
    },
  },
  hasty: {
    name: "HASTE",
    desc: "Fire 12% faster.",
    apply() {
      R.rate *= 0.88;
    },
  },
  plate: {
    name: "PLATED",
    desc: "Armor that blocks two hits.",
    apply() {
      ((PL.shield += 2), (PL.shieldFx = 1));
    },
  },
  temper: {
    name: "TEMPERED",
    desc: "Upgrade the rarity of the gun that shoots this.",
    hand: !0,
  },
  purse: {
    name: "FAT PURSE",
    desc: "+$400 gold right now.",
    siege: !0,
    apply() {
      R.kind === "td" ? tdGold(400, null) : addGold(400, null);
    },
  },
  greedy: {
    name: "BOUNTY HUNTER",
    desc: "Elites appear twice as often.",
    once: !0,
    apply() {
      R.perks.hunter = !0;
    },
  },
};
function levelChoices() {
  const t = [],
    s = shuffle(
      Object.keys(BOONS).filter(
        (o) =>
          !(BOONS[o].siege && !goldMode()) &&
          !(BOONS[o].td && R.kind !== "td") &&
          !(BOONS[o].once && R.perks[o === "greedy" ? "hunter" : o]),
      ),
    ),
    e = shuffle(modPool().slice());
  for (
    t.push({
      type: "mod",
      id: e[0],
      name: MODS[e[0]].name,
      desc: MODS[e[0]].desc + " Goes on the gun that shoots this.",
    }),
      Math.random() < 0.5 &&
        t.push({
          type: "mod",
          id: e[1],
          name: MODS[e[1]].name,
          desc: MODS[e[1]].desc + " Goes on the gun that shoots this.",
        });
    t.length < 3 && s.length;
  ) {
    const o = s.shift();
    t.push({ type: "boon", id: o, name: BOONS[o].name, desc: BOONS[o].desc });
  }
  return shuffle(t);
}
const LVL_LABELS = Array.from({ length: 3 }, () => panel(256, 256, 0.5));
function paintLevelCard(t, s) {
  const e = t.ctx,
    o = 256,
    n = s.type === "mod",
    l = n ? MODS[s.id].css : "#7fe0a0";
  ((e.fillStyle = "#1c1730"),
    e.fillRect(0, 0, o, o),
    (e.fillStyle = l),
    e.fillRect(0, 0, o, 46),
    (e.fillStyle = "#1c1730"),
    (e.font = `700 22px ${FB}`),
    (e.textAlign = "center"),
    (e.textBaseline = "middle"),
    spaced(e, 3),
    e.fillText(n ? "MOD" : "LEVEL " + R.lvl, o / 2, 24),
    spaced(e, 0),
    (e.font = `38px ${FD}`),
    (e.fillStyle = "#f3e3c8"),
    e.fillText(s.name, o / 2, 100, 236),
    (e.font = `600 20px ${FB}`),
    (e.fillStyle = "#b9a6d3"));
  const i = s.desc.split(" ");
  let a = "",
    d = 146;
  for (const r of i) {
    const f = a ? a + " " + r : r;
    e.measureText(f).width > 222
      ? (e.fillText(a, o / 2, d), (a = r), (d += 24))
      : (a = f);
  }
  (a && e.fillText(a, o / 2, d),
    (e.strokeStyle = l),
    (e.lineWidth = 8),
    e.strokeRect(4, 4, o - 8, o - 8),
    upload(t.tex, t.cvs));
}
function levelTick(t) {
  if (inRun()) {
    if (R.lvlUp) {
      if (((R.lvlUp.t += t), R.lvlUp.t > 9)) {
        const s = targets.filter((e) => e.kind === "lvl" && e.state === "live");
        s.length &&
          pickLevel(s[Math.floor(Math.random() * s.length)], { hand: "right" });
      }
      return;
    }
    if (
      R.lvlPending > 0 &&
      (R.phase === "fight" ||
        R.phase === "intro" ||
        R.phase === "leaving" ||
        R.phase === "build")
    ) {
      R.lvlPending--;
      const s = levelChoices(),
        e = PL.viewA;
      (s.forEach((o, n) => {
        const l = e + (n - 1) * 0.42,
          i = LVL_LABELS[n];
        (paintLevelCard(i, o),
          addTarget({
            kind: "lvl",
            item: o,
            slot: i,
            R: 0.34,
            x: headPos[0] + Math.sin(l) * 2.1,
            z: headPos[2] - Math.cos(l) * 2.1,
            y: headPos[1] - 0.15,
            y1: headPos[1] - 0.15,
            ph: n * 1.7,
            scale: 0,
          }));
      }),
        (R.lvlUp = { t: 0 }),
        showBanner("LEVEL " + R.lvl, "Shoot an upgrade  ·  time is slowed"),
        sfx.levelUp());
    }
  }
}
function pickLevel(t, s) {
  const e = t.item,
    o = s.hand === "left" ? "left" : "right";
  if (e.type === "mod") attachMod(o, e.id, [t.x, t.y + 0.5, t.z]);
  else if (e.id === "temper") {
    const n = R.weapons[o];
    n.rar < 3
      ? (equip(o, n.id, n.rar + 1),
        (R.weapons[o].mods = n.mods.slice()),
        popup(
          RAR[n.rar + 1].name,
          RAR[n.rar + 1].css,
          [t.x, t.y + 0.5, t.z],
          0.9,
        ))
      : healPlayer(1);
  } else
    (BOONS[e.id].apply(), popup(e.name, "#7fe0a0", [t.x, t.y + 0.5, t.z], 0.9));
  ((t.state = "hit"), (t.hitT = 0), crateBurst(t), sfx.choose());
  for (const n of targets)
    n.kind === "lvl" && n !== t && n.state === "live" && (n.state = "retract");
  R.lvlUp = null;
}
const CONTRACTS = [
  {
    id: "kills",
    text: (t) => "Kill " + t + " enemies",
    n: [40, 60, 90],
    stat: "kills",
    souls: 6,
  },
  {
    id: "heads",
    text: (t) => t + " headshot kills",
    n: [10, 18, 28],
    stat: "heads",
    souls: 8,
  },
  {
    id: "reacts",
    text: (t) => "Trigger " + t + " reactions",
    n: [3, 6, 10],
    stat: "reacts",
    souls: 10,
  },
  {
    id: "streak",
    text: (t) => "Get a " + t + "-kill streak",
    n: [3, 4, 5],
    stat: "bestStreak",
    souls: 8,
  },
  {
    id: "elites",
    text: (t) => "Kill " + t + " elites",
    n: [2, 4, 6],
    stat: "elites",
    souls: 10,
  },
  {
    id: "mods",
    text: (t) => "Collect " + t + " mods",
    n: [2, 4, 6],
    stat: "mods",
    souls: 8,
  },
  {
    id: "level",
    text: (t) => "Reach level " + t,
    n: [4, 6, 8],
    stat: "level",
    souls: 8,
  },
  {
    id: "wave",
    text: (t) => "Reach wave " + t,
    n: [5, 7, 10],
    stat: "wave",
    souls: 10,
  },
  {
    id: "parry",
    text: (t) => "Shoot down " + t + " shots",
    n: [5, 10, 16],
    stat: "parries",
    souls: 8,
  },
  {
    id: "nohit",
    text: (t) => t + " waves without a hit",
    n: [1, 2, 3],
    stat: "clean",
    souls: 12,
  },
  {
    id: "coffin",
    text: (t) => "Open the coffin " + t + "x",
    n: [1, 2, 3],
    stat: "rolls",
    souls: 6,
    siege: !0,
  },
  {
    id: "boss",
    text: (t) => "Defeat " + t + " boss",
    n: [1, 1, 2],
    stat: "bosses",
    souls: 15,
  },
];
function startContracts() {
  const t = Math.min(2, Math.floor(rankOf(META.total) / 3));
  R.contracts = shuffle(
    CONTRACTS.filter(
      (s) =>
        (!s.siege || R.kind === "siege") &&
        (!s.td || R.kind === "td") &&
        !(s.id === "coffin" && R.kind === "td"),
    ),
  )
    .slice(0, 3)
    .map((s) => ({ c: s, n: s.n[t], done: !1 }));
}
function contractTick() {
  if (!(!inRun() || !R.contracts)) {
    ((R.stat.wave = R.wave), (R.stat.rolls = R.rolls));
    for (const t of R.contracts)
      if (!t.done && (R.stat[t.c.stat] || 0) >= t.n) {
        t.done = !0;
        const s = t.c.souls + Math.floor(t.n / 10);
        ((META.souls += s),
          (META.total += s),
          saveMeta(),
          (R.contractSouls = (R.contractSouls || 0) + s),
          R.kind === "siege"
            ? addGold(150, null)
            : R.kind === "td" && tdGold(150, null),
          showBanner(
            "CONTRACT COMPLETE",
            t.c.text(t.n) + "  ·  +" + s + " souls",
          ),
          sfx.contract());
      }
  }
}
const ELITES = {
  armored: { name: "ARMORED", col: [0.75, 0.8, 1], css: "#c0ccff" },
  swift: { name: "SWIFT", col: [0.5, 1, 0.6], css: "#80ff90" },
  volatile: { name: "VOLATILE", col: [1, 0.45, 0.2], css: "#ff7a3a" },
  frenzied: { name: "FRENZIED", col: [1, 0.25, 0.3], css: "#ff4a5a" },
};
function maybeElite(t) {
  if (
    !t ||
    !inRun() ||
    t.T.boss ||
    t.T.mini ||
    t.type === "bat" ||
    t.type === "miniblob"
  )
    return;
  const s = Math.min(0.25, 0.04 + 0.006 * R.wave) * (R.perks.hunter ? 2 : 1);
  R.wave >= 3 &&
    Math.random() < s &&
    makeElite(t, Object.keys(ELITES)[Math.floor(Math.random() * 4)]);
}
function makeElite(t, s) {
  ((t.elite = s),
    (t.hp *= s === "armored" ? 2.5 : 1.6),
    (t.maxHp = t.hp),
    (t.s *= 1.12),
    s === "swift" && (t.lurch = (t.lurch || 1) * 1.6),
    s === "frenzied" && (t.rage = 1e9));
}
function markBounty() {
  const t = enemies.filter(
    (e) => e.state !== "dead" && !e.T.boss && !e.bounty && e.type !== "bat",
  );
  if (!t.length) return;
  const s = t[Math.floor(Math.random() * t.length)];
  (s.elite || makeElite(s, "armored"),
    (s.bounty = !0),
    (s.hp *= 1.5),
    (s.maxHp = s.hp),
    sfx.elite([s.x, s.y + 1, s.z]),
    showBanner(
      "BOUNTY",
      "A marked " + s.T.name.toLowerCase() + " carries rare loot",
    ));
}
const LOOT_LABELS = Array.from({ length: 6 }, () => panel(256, 96, 0.55));
let lootSlot = 0;
function modPool() {
  const t = rankOf(META.total);
  return MOD_IDS.filter((s, e) => e < 5 + Math.floor(t / 1.5) * 2);
}
function dropLoot(t, s, e) {
  let o = null,
    n = "",
    l = "#ffffff";
  if (s === "mod") {
    const r = modPool();
    ((o = r[Math.floor(Math.random() * r.length)]),
      (n = MODS[o].name),
      (l = MODS[o].css));
  } else
    s === "gun"
      ? ((o = goldMode()
          ? randomGun()
          : WEAPON_IDS[
              1 + Math.floor(Math.random() * (WEAPON_IDS.length - 1))
            ]),
        (e = Math.max(e, rollRarity(0.5))),
        (n = WEAPONS[o].name),
        (l = RAR[e].css))
      : ((n = "HEART"), (l = "#ff5a4a"));
  R.kind === "td" && (t = tdLootSpot());
  const i = LOOT_LABELS[lootSlot++ % LOOT_LABELS.length],
    a = i.ctx;
  (a.clearRect(0, 0, 256, 96),
    (a.fillStyle = "rgba(20,16,32,0.85)"),
    a.fillRect(0, 8, 256, 80),
    (a.fillStyle = l),
    a.fillRect(0, 8, 256, 6),
    (a.textAlign = "center"),
    (a.textBaseline = "middle"),
    spaced(a, 3),
    (a.font = `700 16px ${FB}`),
    a.fillText(
      s === "gun" ? RAR[e].name : s === "mod" ? "MOD" : "HEAL",
      128,
      30,
    ),
    spaced(a, 0),
    (a.font = `36px ${FD}`),
    (a.fillStyle = "#f3e3c8"),
    a.fillText(n, 128, 64, 240),
    upload(i.tex, i.cvs));
  const d =
    s === "gun" ? RAR[e].col : s === "mod" ? MODS[o].col : [1, 0.35, 0.3];
  (addTarget({
    kind: "loot",
    loot: { type: s, id: o, rar: e },
    slot: i,
    col: d,
    R: 0.24,
    x: t[0],
    y: Math.max(0.6, t[1]),
    z: t[2],
    y1: 1.25,
    life: 22,
    scale: 0,
  }),
    sfx.loot(t, s === "gun" ? e : s === "mod" ? 1 : 0));
}
function takeLoot(t, s) {
  if (t.loot.type === "extract") {
    extractRun();
    return;
  }
  const e = t.loot,
    o = s.hand === "left" ? "left" : "right",
    n = [t.x, t.y + 0.5, t.z];
  (e.type === "mod"
    ? attachMod(o, e.id, n)
    : e.type === "gun"
      ? (equip(o, e.id, e.rar),
        popup(RAR[e.rar].name, RAR[e.rar].css, n, 0.9),
        sfx.pick())
      : healPlayer(1),
    (t.state = "hit"),
    (t.hitT = 0),
    crateBurst(t));
}
const coins = [];
function spawnCoins(t, s) {
  for (let e = 0; e < s && coins.length < 40; e++)
    coins.push({
      p: [t[0], t[1], t[2]],
      v: [rand(-2, 2), rand(2.5, 4.5), rand(-2, 2)],
      t: 0,
      spin: rand(0, TAU),
    });
}
function updateCoins(t) {
  for (let s = coins.length - 1; s >= 0; s--) {
    const e = coins[s];
    if (((e.t += t), (e.spin += t * 9), e.t < 0.45))
      ((e.v[1] -= 9.8 * t),
        (e.p[0] += e.v[0] * t),
        (e.p[1] += e.v[1] * t),
        (e.p[2] += e.v[2] * t),
        e.p[1] < 0.1 && ((e.p[1] = 0.1), (e.v[1] *= -0.4)));
    else {
      const o = [headPos[0], headPos[1] - 0.4, headPos[2]],
        n = [o[0] - e.p[0], o[1] - e.p[1], o[2] - e.p[2]],
        l = Math.hypot(n[0], n[1], n[2]),
        i = 4 + e.t * 12;
      if (l < 0.3) {
        (coins.splice(s, 1), sfx.coin());
        continue;
      }
      ((e.p[0] += (n[0] / l) * i * t),
        (e.p[1] += (n[1] / l) * i * t),
        (e.p[2] += (n[2] / l) * i * t));
    }
  }
}
function rewardsTick(t, s) {
  for (let e = nums.length - 1; e >= 0; e--)
    ((nums[e].t += s), nums[e].t > 0.75 && nums.splice(e, 1));
  if ((updateCoins(s), !!inRun())) {
    (R.comboT > 0 && ((R.comboT -= t), R.comboT <= 0 && (R.combo = 0)),
      levelTick(s),
      contractTick());
    for (const e of targets)
      e.kind === "loot" &&
        e.state === "live" &&
        ((e.life -= t), e.life <= 0 && (e.state = "retract"));
  }
}
function rankRewards(t) {
  const s = [];
  return (
    (t % 2 === 0 || t === 3) && s.push("new mods in the loot pool"),
    t % 3 === 0 && s.push("harder contracts pay more"),
    s.length ? s.join(", ") : "bragging rights"
  );
}
