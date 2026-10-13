"use strict";
Object.assign(WEAPONS, {
  crossbow: {
    name: "CROSSBOW",
    desc: "Heavy bolts pierce two foes. Head hits x3.",
    cd: 0.3,
    dmg: 4.5,
    proj: "bolt",
    speed: 42,
    headMul: 3,
    mag: 1,
    reload: 0.8,
    col: [1, 0.85, 0.55],
    muzzle: -0.27,
    kick: 1.1,
    snd: "crossbow",
    long: !0,
  },
  blunder: {
    name: "BLUNDERBUSS",
    desc: "Twelve pellets that knock foes flat.",
    cd: 0.9,
    dmg: 0.6,
    pellets: 12,
    spread: 0.13,
    knock: 0.9,
    mag: 1,
    reload: 1.2,
    col: [1, 0.6, 0.3],
    tw: 0.008,
    muzzle: -0.33,
    kick: 2,
    casing: 2,
    snd: "blunder",
    long: !0,
  },
  tommy: {
    name: "TOMMY GUN",
    desc: "Fifty-round drum, full auto.",
    cd: 0.07,
    dmg: 0.55,
    auto: !0,
    spread: 0.03,
    mag: 50,
    reload: 2.2,
    col: [1, 0.8, 0.45],
    tw: 0.009,
    muzzle: -0.3,
    kick: 0.45,
    casing: 1,
    snd: "tommy",
    long: !0,
  },
  harpoon: {
    name: "HARPOON",
    desc: "Spears a foe and drags it to you, stunned.",
    cd: 0.4,
    dmg: 3,
    proj: "harpoon",
    speed: 30,
    fx: "shock",
    mag: 1,
    reload: 1,
    col: [0.8, 0.9, 1],
    muzzle: -0.36,
    kick: 1.2,
    snd: "harpoon",
    long: !0,
  },
  vortex: {
    name: "BLACK HOLE",
    desc: "A singularity that drags foes in, then implodes.",
    cd: 1.2,
    dmg: 4,
    proj: "vortex",
    speed: 13,
    splash: 2.6,
    mag: 2,
    reload: 2.5,
    col: [0.6, 0.35, 1],
    muzzle: -0.27,
    kick: 1.3,
    snd: "vortex",
  },
  spirit: {
    name: "SPIRIT BOW",
    desc: "Three ghost arrows that hunt their prey.",
    cd: 0.45,
    dmg: 1.1,
    proj: "spirit",
    speed: 18,
    mag: 8,
    reload: 1.6,
    col: [0.55, 1, 0.85],
    muzzle: -0.24,
    snd: "spirit",
  },
  tesla: {
    name: "TESLA COIL",
    desc: "Hold for lightning that jumps to two more.",
    cd: 0.06,
    dmg: 0.38,
    auto: !0,
    chain: 2,
    chainR: 5,
    fx: "shock",
    mag: 100,
    reload: 2.6,
    col: [0.6, 0.8, 1],
    tw: 0.012,
    muzzle: -0.27,
    snd: "tesla",
    long: !0,
  },
  napalm: {
    name: "NAPALM",
    desc: "Lobs fire that leaves a burning pool.",
    cd: 0.8,
    dmg: 1.5,
    proj: "napalm",
    speed: 14,
    splash: 1.5,
    fx: "burn",
    mag: 3,
    reload: 2.2,
    col: [1, 0.45, 0.1],
    muzzle: -0.3,
    kick: 1.2,
    snd: "napalm",
    long: !0,
  },
});
for (const s of [
  "lever",
  "deadshot",
  "gatling",
  "rail",
  "hellfire",
  "moonbeam",
  "thunder",
  "scatter",
  "dragon",
])
  WEAPONS[s].long = !0;
((WEAPON_IDS.length = 0),
  WEAPON_IDS.push(...Object.keys(WEAPONS)),
  UNLOCK_GUNS.push(
    "crossbow",
    "tommy",
    "blunder",
    "spirit",
    "napalm",
    "harpoon",
    "tesla",
    "vortex",
  ),
  Object.assign(PSPEC, {
    bolt: { r: 0.06, grav: 0.08, life: 1.6 },
    harpoon: { r: 0.08, grav: 0.1, life: 1.4 },
    vortex: { r: 0.12, grav: 0.7, life: 3 },
    spirit: { r: 0.09, grav: 0, life: 3 },
    napalm: { r: 0.1, grav: 1, life: 3 },
  }));
const makeGun = (s, t = 0, o) => ({
    id: s,
    rar: t,
    mods: o ? o.slice(0, t + 1) : [],
  }),
  modSlots = (s) => s.rar + 1;
function equip(s, t, o) {
  const a = R.weapons[s];
  return ((R.weapons[s] = makeGun(t, o, a && a.mods)), R.weapons[s]);
}
const MODS = {
    fire: {
      name: "INCENDIARY",
      desc: "Hits set foes ablaze.",
      col: [1, 0.5, 0.15],
      css: "#ff8a3a",
      fx: "burn",
    },
    ice: {
      name: "CRYO",
      desc: "Hits chill and freeze.",
      col: [0.55, 0.9, 1],
      css: "#8fdcff",
      fx: "freeze",
    },
    shock: {
      name: "VOLTAIC",
      desc: "Hits stun and arc onward.",
      col: [1, 0.95, 0.4],
      css: "#ffe85a",
      fx: "shock",
    },
    venom: {
      name: "VENOM",
      desc: "Hits poison over time.",
      col: [0.6, 1, 0.25],
      css: "#a8ff4a",
      fx: "poison",
    },
    boom: {
      name: "EXPLOSIVE",
      desc: "1 in 4 hits explodes.",
      col: [1, 0.6, 0.25],
      css: "#ffa040",
    },
    rico: {
      name: "RICOCHET",
      desc: "Hits bounce to a nearby foe.",
      col: [1, 0.85, 0.4],
      css: "#ffd257",
    },
    pierce: {
      name: "PIERCING",
      desc: "Bullets pass through one more foe.",
      col: [0.8, 0.9, 1],
      css: "#d0e0ff",
    },
    leech: {
      name: "VAMPIRIC",
      desc: "Damage dealt heals you.",
      col: [1, 0.2, 0.3],
      css: "#ff4a5a",
      fx: "leech",
    },
    split: {
      name: "SPLIT SHOT",
      desc: "Two extra pellets per shot.",
      col: [1, 0.7, 0.5],
      css: "#ffb080",
    },
    mag: {
      name: "EXT MAG",
      desc: "40% bigger magazine.",
      col: [0.8, 0.8, 0.8],
      css: "#d8d0c4",
    },
    rate: {
      name: "QUICKDRAW",
      desc: "Fires 20% faster.",
      col: [1, 1, 0.6],
      css: "#fff080",
    },
    crit: {
      name: "HOLLOW TIP",
      desc: "Head hits deal 50% more.",
      col: [1, 0.4, 0.3],
      css: "#ff6a5a",
    },
    seek: {
      name: "SEEKER",
      desc: "Shots curve into nearby foes.",
      col: [0.6, 1, 0.85],
      css: "#8affd8",
    },
  },
  MOD_IDS = Object.keys(MODS),
  hasMod = (s, t) => !!(s && s.mods && s.mods.includes(t));
function attachMod(s, t, o) {
  const a = R.weapons[s];
  a &&
    (a.mods.includes(t)
      ? a.mods.splice(a.mods.indexOf(t), 1)
      : a.mods.length >= modSlots(a) && a.mods.shift(),
    a.mods.push(t),
    popup(MODS[t].name, MODS[t].css, o, 0.9),
    sfx.pickup(),
    (R.stat.mods = (R.stat.mods || 0) + 1));
}
function shotFx(s) {
  const t = [];
  s.W.fx && s.W.fx !== "leech" && t.push(s.W.fx);
  for (const o of (s.inst && s.inst.mods) || [])
    MODS[o].fx &&
      MODS[o].fx !== "leech" &&
      !t.includes(MODS[o].fx) &&
      t.push(MODS[o].fx);
  return t;
}
const REACT = {
  shatter: { name: "SHATTER", css: "#bfefff" },
  blast: { name: "IGNITION", css: "#ff8a3a" },
  surge: { name: "TOXIC SURGE", css: "#c0ff5a" },
  super: { name: "SUPERCONDUCT", css: "#ffe85a" },
};
function react(s, t, o) {
  const a = enemyCenter(s);
  ((R.stat.reacts = (R.stat.reacts || 0) + 1),
    (!TD.quiet || hdist(s) < 22) &&
      (popup(
        REACT[t].name,
        REACT[t].css,
        [a[0], a[1] + 0.7 * Math.min(2, s.s), a[2]],
        0.8,
      ),
      sfx.react(a, t)));
  const e = { W: { dmg: 1, col: [1, 1, 1] }, inst: null, dmg: 1, g: null };
  if (t === "shatter") {
    ((s.burn = 0), (s.frozen = 0), (s.slow = 0), (s.chill = 0));
    for (let n = 0; n < 14; n++) {
      const r = rdir(0.4),
        d = rand(2, 6);
      part(
        "shard",
        a,
        [r[0] * d, r[1] * d, r[2] * d],
        [0.04, 0.06, 0.04],
        [0.75, 0.95, 1],
        0.8,
        { grav: 7, glow: 1 },
      );
    }
    (shocks.push({ p: a.slice(), t: 0, r: 1.2, col: [0.7, 0.95, 1] }),
      dotDamage(s, 5 * o));
  } else if (t === "blast")
    ((s.burn = 0),
      (s.poison = 0),
      blast(
        a,
        2.2,
        3.5 * o,
        {
          W: { dmg: 3.5 * o, col: [1, 0.5, 0.15] },
          inst: null,
          dmg: 3.5 * o,
          g: null,
        },
        [1, 0.5, 0.15],
      ));
  else if (t === "surge") {
    for (const n of nearestEnemies(a, 3.5, new Set([s]), 4))
      (applyFxRaw(n, "poison", o),
        (n.stun = Math.max(n.stun || 0, 0.5)),
        bolt(a, enemyCenter(n), [0.7, 1, 0.3], 0.02, 0.3));
    ((s.stun = Math.max(s.stun || 0, 0.8)), dotDamage(s, 1.5 * o));
  } else {
    ((s.vuln = 4), (s.stun = Math.max(s.stun || 0, 0.6)), dotDamage(s, 2 * o));
    for (let n = 0; n < 3; n++)
      bolt(
        a,
        [a[0] + rand(-1, 1), a[1] + rand(-0.6, 0.8), a[2] + rand(-1, 1)],
        [1, 0.95, 0.5],
        0.015,
        0.25,
      );
  }
}
let fields = [];
function addField(s, t, o, a, e) {
  (fields.push({
    kind: s,
    p: [t[0], groundAt(t[0], t[2]) + 0.05, t[2]],
    r: o,
    life: a,
    t: 0,
    shot: e,
    tick: 0,
  }),
    s === "vortex" && sfx.vortex());
}
function updateFields(s) {
  for (let t = fields.length - 1; t >= 0; t--) {
    const o = fields[t];
    ((o.t += s), (o.tick -= s));
    const a = o.tick <= 0;
    a && (o.tick = 0.25);
    for (const e of enemies) {
      if (e.state === "dead" || !e.hbw[0]) continue;
      const n = o.p[0] - e.x,
        r = o.p[2] - e.z;
      if (!(Math.hypot(n, r) > o.r * (o.kind === "vortex" ? 2.2 : 1))) {
        if (o.kind === "fire")
          a &&
            e.y < 1.5 &&
            (applyFx(e, "burn", o.shot.dmg / o.shot.W.dmg),
            dotDamage(e, 0.3 * o.shot.dmg));
        else if (!e.T.boss) {
          const l = Math.min(1, s * 3.5) * (e.T.mini ? 0.3 : 1);
          ((e.x += n * l),
            (e.z += r * l),
            a && dotDamage(e, 0.25 * o.shot.dmg));
        }
      }
    }
    (o.kind === "fire" &&
      a &&
      Math.hypot(headPos[0] - o.p[0], headPos[2] - o.p[2]) < o.r * 0.7 &&
      Math.random() < 0.15 &&
      puff([headPos[0], 0.2, headPos[2]], 2, [0.4, 0.35, 0.35], 0.2, 0.5),
      o.t >= o.life &&
        (fields.splice(t, 1),
        o.kind === "vortex" &&
          (blast(
            [o.p[0], o.p[1] + 0.8, o.p[2]],
            o.shot.W.splash || 2.6,
            o.shot.dmg * 1.5,
            o.shot,
            [0.6, 0.35, 1],
          ),
          sfx.implode(o.p))));
  }
}
function buildFieldDraws() {
  for (const s of fields) {
    const t = Math.min(1, s.t * 4) * Math.min(1, (s.life - s.t) * 2);
    if (s.kind === "fire") {
      for (let o = 0; o < 5; o++) {
        const a = rand(0, TAU),
          e = Math.sqrt(Math.random()) * s.r;
        ppush(
          PT.glow,
          s.p[0] + Math.cos(a) * e,
          s.p[1] + rand(0, 0.5),
          s.p[2] + Math.sin(a) * e,
          rand(0.25, 0.55),
          1,
          rand(0.35, 0.6),
          0.1,
          0.7 * t,
        );
      }
      Math.random() < 0.3 &&
        ppush(
          PT.smoke,
          s.p[0] + rand(-s.r, s.r) * 0.6,
          s.p[1] + 0.8,
          s.p[2] + rand(-s.r, s.r) * 0.6,
          0.6,
          0.2,
          0.17,
          0.17,
          0.2 * t,
        );
    } else {
      const o = s.p[1] + 0.8,
        a = s.t * 6;
      ppush(PT.glow, s.p[0], o, s.p[2], 1.6 * t, 0.45, 0.2, 1, 0.75);
      for (let e = 0; e < 8; e++) {
        const n = a + (e * TAU) / 8,
          r = 1.4 - ((s.t * 1.5 + e * 0.12) % 1.4);
        ppush(
          PT.glow,
          s.p[0] + Math.cos(n) * r,
          o + Math.sin(n * 1.7) * 0.2,
          s.p[2] + Math.sin(n) * r,
          0.18,
          0.7,
          0.5,
          1,
          0.8 * t,
        );
      }
      bpush(
        B.shard,
        s.p[0],
        o,
        s.p[2],
        0.35 * t,
        0.35 * t,
        0.35 * t,
        a,
        a * 0.7,
        0,
        0.05,
        0.02,
        0.1,
        1,
      );
    }
  }
}
((() => {
  const s = (e, n, r, d, l, c, i, f, m) =>
      e.add(
        cyl(new Geo(), 0, 0, 0, l, l, c, i, f, m || null),
        trs(m4(), n, r, d, 0, -Math.PI / 2, 0, 1, 1, 1),
      ),
    t = (e, n = C.wood) => {
      (e.add(
        box(new Geo(), 0, -0.055, 0, 0.036, 0.11, 0.046, n),
        trs(m4(), 0, 0, 0.075, 0, 0.32, 0, 1, 1, 1),
      ),
        strut(e, [0, -0.03, -0.02], [0, -0.06, 0], 0.006, C.gunDk),
        strut(e, [0, -0.06, 0], [0, -0.055, 0.045], 0.006, C.gunDk));
    },
    o = (e, n = C.woodLt) => {
      e.add(
        box(new Geo(), 0, 0, 0, 0.04, 0.06, 0.16, n),
        trs(m4(), 0, -0.025, 0.17, 0, 0.12, 0, 1, 1, 1),
      );
    },
    a = (e, n) => {
      const r = new Geo(),
        d = new Geo();
      (n(r, d, WEAPONS[e].col), (GUN[e] = { body: r.mesh(), glow: d.mesh() }));
    };
  (a("crossbow", (e, n, r) => {
    (box(e, 0, 0, -0.04, 0.04, 0.05, 0.26, C.woodLt), o(e), t(e));
    for (const d of [-1, 1])
      (strut(e, [0, 0.01, -0.16], [d * 0.2, 0.01, -0.1], 0.016, C.wood),
        strut(n, [d * 0.2, 0.012, -0.1], [0, 0.012, 0], 0.003, r));
    box(e, 0, 0.032, -0.08, 0.012, 0.012, 0.3, C.metalLt);
  }),
    a("blunder", (e, n, r) => {
      (s(e, 0, 0.008, -0.02, 0.018, 0.22, 10, C.brass),
        e.add(
          cyl(new Geo(), 0, 0, 0, 0.02, 0.045, 0.1, 12, C.brass, C.gunDk),
          trs(m4(), 0, 0.008, -0.24, 0, -Math.PI / 2, 0, 1, 1, 1),
        ),
        box(e, 0, -0.01, 0.03, 0.04, 0.05, 0.12, C.wood),
        o(e, C.wood),
        t(e),
        n.add(
          ring(new Geo(), 0.025, 0.045, 14, r, 0),
          trs(m4(), 0, 0.008, -0.341, 0, Math.PI, 0, 1, 1, 1),
        ));
    }),
    a("tommy", (e, n, r) => {
      (box(e, 0, 0.005, 0, 0.044, 0.06, 0.18, C.gun),
        s(e, 0, 0.012, -0.09, 0.016, 0.2, 10, C.gunDk, C.metal));
      for (let d = 0; d < 5; d++)
        s(e, 0, 0.012, -0.11 - d * 0.025, 0.02, 0.008, 10, C.gunDk);
      (s(e, 0, -0.06, -0.02, 0.06, 0.035, 16, C.gunDk, C.gun),
        box(e, 0, -0.03, -0.17, 0.03, 0.06, 0.03, C.wood),
        o(e, C.wood),
        t(e),
        n.add(
          ring(new Geo(), 0.03, 0.05, 16, r, 0),
          trs(m4(), 0, -0.06, -0.056, 0, Math.PI, 0, 1, 1, 1),
        ));
    }),
    a("harpoon", (e, n, r) => {
      (s(e, 0, 0.01, 0.05, 0.03, 0.26, 12, C.gunDk, C.gun),
        box(e, 0, -0.03, -0.04, 0.03, 0.04, 0.06, C.gun),
        t(e, C.gunDk),
        s(n, 0, 0.01, -0.2, 0.007, 0.14, 6, r),
        n.add(
          cyl(new Geo(), 0, 0, 0, 0.02, 0, 0.05, 6, r, r),
          trs(m4(), 0, 0.01, -0.34, 0, -Math.PI / 2, 0, 1, 1, 1),
        ));
    }),
    a("vortex", (e, n, r) => {
      (box(e, 0, 0, 0.04, 0.05, 0.06, 0.14, C.gunDk),
        s(e, 0, 0.006, -0.05, 0.032, 0.2, 14, C.gun, C.gunDk),
        t(e, C.gunDk));
      for (let d = 0; d < 3; d++)
        n.add(
          ring(new Geo(), 0.026, 0.036, 14, r, 0),
          trs(m4(), 0, 0.006, -0.1 - d * 0.05, 0, Math.PI, 0, 1, 1, 1),
        );
      ico(
        n,
        0,
        0.006,
        -0.26,
        0.02,
        0.02,
        0.02,
        [0.1, 0.05, 0.2],
        mulberry(3),
        0,
        0,
      );
    }),
    a("spirit", (e, n, r) => {
      (box(e, 0, 0, 0.02, 0.03, 0.08, 0.04, C.woodDk), t(e, C.woodDk));
      for (const d of [-1, 1])
        (strut(e, [0, d * 0.03, 0], [0, d * 0.16, -0.08], 0.012, C.woodLt),
          strut(e, [0, d * 0.16, -0.08], [0, d * 0.22, -0.04], 0.01, C.woodLt),
          strut(n, [0, d * 0.22, -0.04], [0, 0, 0.06], 0.003, r));
      strut(n, [0, 0, 0.06], [0, 0, -0.24], 0.006, r);
    }),
    a("tesla", (e, n, r) => {
      (box(e, 0, 0, 0.04, 0.05, 0.06, 0.16, C.metal),
        s(e, 0, 0.006, -0.04, 0.012, 0.2, 8, C.brass),
        o(e, C.gun),
        t(e, C.gunDk));
      for (let d = 0; d < 4; d++)
        s(n, 0, 0.006, -0.07 - d * 0.045, 0.026, 0.012, 12, r);
      ico(n, 0, 0.006, -0.26, 0.03, 0.03, 0.03, r, mulberry(17), 0.2, 0);
    }),
    a("napalm", (e, n, r) => {
      (box(e, 0, 0, 0.03, 0.05, 0.065, 0.16, C.rust),
        s(e, 0, 0.012, -0.05, 0.022, 0.25, 12, C.gunDk, C.metal),
        o(e, C.gun),
        t(e),
        s(n, 0, -0.065, 0.08, 0.035, 0.16, 12, r, C.gunDk),
        n.add(
          ring(new Geo(), 0.012, 0.022, 12, r, 0),
          trs(m4(), 0, 0.012, -0.301, 0, Math.PI, 0, 1, 1, 1),
        ));
    }));
})(),
  Object.assign(WEAPONS, {
    starfire: {
      name: "STARFIRE",
      desc: "Off-world blaster. Hot bolts pierce two foes.",
      cd: 0.2,
      dmg: 1.8,
      pierce: 2,
      fx: "burn",
      mag: 14,
      reload: 1.4,
      col: [1, 0.45, 0.75],
      tw: 0.02,
      muzzle: -0.2,
      kick: 0.9,
      snd: "laser",
      asset: "blaster",
    },
    pulse: {
      name: "PULSE REPEATER",
      desc: "Off-world auto blaster with a shocking kick.",
      cd: 0.085,
      dmg: 0.6,
      auto: !0,
      spread: 0.02,
      mag: 40,
      reload: 1.8,
      col: [0.4, 1, 0.6],
      tw: 0.012,
      muzzle: -0.24,
      kick: 0.4,
      snd: "laser",
      asset: "repeater",
      fx: "shock",
      fxChance: 0.15,
    },
  }),
  (WEAPON_IDS.length = 0),
  WEAPON_IDS.push(...Object.keys(WEAPONS)),
  UNLOCK_GUNS.push("starfire", "pulse"),
  (GUN.starfire = GUN.moonbeam),
  (GUN.pulse = GUN.hornet));
const NO_GLOW = new Geo().mesh();
(assetHooks.push((s, t) => {
  for (const o of ["starfire", "pulse"])
    WEAPONS[o].asset === s &&
      ((GUN[o] = { body: t.mesh, glow: NO_GLOW }),
      (WEAPONS[o].muzzle = t.muzzle - 0.005));
  s === "drone" && (EM.drone = t.mesh);
}),
  (sfx.laser = () => {
    gate("laser", 0.05) &&
      (tone("square", 1800, 400, 0.12, 0.08),
      tone("sine", 900, 200, 0.14, 0.12),
      hiss(0.08, 6e3, 3e3, 0.1, 4));
  }));
