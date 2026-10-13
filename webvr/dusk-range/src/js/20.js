"use strict";
const RAR = [
  { name: "COMMON", col: [0.82, 0.8, 0.76], css: "#d8d0c4", dmg: 1, mag: 1 },
  { name: "RARE", col: [0.3, 0.62, 1], css: "#5aa8ff", dmg: 1.35, mag: 1.15 },
  { name: "EPIC", col: [0.72, 0.38, 1], css: "#b86bff", dmg: 1.8, mag: 1.3 },
  {
    name: "LEGENDARY",
    col: [1, 0.72, 0.18],
    css: "#ffc23a",
    dmg: 2.5,
    mag: 1.5,
  },
];
(Object.assign(WEAPONS.peacemaker, { mag: 12, reload: 1.1 }),
  Object.assign(WEAPONS.scatter, { mag: 2, reload: 1.3, cd: 0.32 }),
  Object.assign(WEAPONS.hornet, { mag: 32, reload: 1.6 }),
  Object.assign(WEAPONS.rail, { mag: 4, reload: 2 }),
  Object.assign(WEAPONS.arc, { mag: 10, reload: 1.6, fx: "shock" }),
  Object.assign(WEAPONS.boom, { mag: 4, reload: 2, proj: "grenade" }),
  Object.assign(WEAPONS.rico, { mag: 8, reload: 1.4 }),
  Object.assign(WEAPONS, {
    sixgun: {
      name: "SIX-SHOOTER",
      desc: "Heavy revolver. Big hits, six rounds.",
      cd: 0.28,
      dmg: 2.6,
      mag: 6,
      reload: 1.9,
      col: [1, 0.78, 0.45],
      tw: 0.02,
      muzzle: -0.26,
      kick: 1.4,
      casing: 1,
      snd: "six",
    },
    lever: {
      name: "LEVER RIFLE",
      desc: "Each round punches through two foes.",
      cd: 0.5,
      dmg: 3.4,
      pierce: 2,
      mag: 10,
      reload: 2.2,
      col: [1, 0.86, 0.6],
      tw: 0.018,
      muzzle: -0.44,
      kick: 1.3,
      casing: 1,
      snd: "lever",
    },
    deadshot: {
      name: "DEAD-SHOT",
      desc: "Scoped rifle. Head hits deal triple.",
      cd: 1,
      dmg: 9,
      pierce: !0,
      headMul: 3,
      mag: 5,
      reload: 2.4,
      col: [1, 0.95, 0.85],
      tw: 0.026,
      muzzle: -0.52,
      kick: 1.8,
      casing: 1,
      snd: "sniper",
    },
    gatling: {
      name: "GATLING",
      desc: "Ninety rounds of spinning lead.",
      cd: 0.06,
      dmg: 0.5,
      auto: !0,
      spread: 0.035,
      mag: 90,
      reload: 3.2,
      col: [1, 0.8, 0.4],
      tw: 0.01,
      muzzle: -0.35,
      kick: 0.35,
      casing: 1,
      snd: "gatling",
    },
    dragon: {
      name: "DRAGON'S BREATH",
      desc: "Flamethrower. Sets the dead alight.",
      cd: 0.05,
      dmg: 0.3,
      auto: !0,
      proj: "flame",
      fx: "burn",
      mag: 80,
      reload: 2.4,
      col: [1, 0.55, 0.15],
      muzzle: -0.32,
      snd: "flame",
    },
    frost: {
      name: "FROSTBITE",
      desc: "Ice bolts slow, then freeze solid.",
      cd: 0.22,
      dmg: 1.1,
      proj: "frost",
      speed: 28,
      fx: "freeze",
      mag: 18,
      reload: 1.8,
      col: [0.55, 0.9, 1],
      muzzle: -0.27,
      snd: "frost",
    },
    venom: {
      name: "VENOM SPITTER",
      desc: "Acid globs that splash and poison.",
      cd: 0.45,
      dmg: 1.5,
      proj: "acid",
      speed: 15,
      splash: 1.6,
      fx: "poison",
      mag: 10,
      reload: 2,
      col: [0.7, 1, 0.25],
      muzzle: -0.25,
      snd: "acid",
    },
    hellfire: {
      name: "HELLFIRE",
      desc: "Homing rockets with a big blast.",
      cd: 0.7,
      dmg: 4,
      proj: "rocket",
      speed: 13,
      splash: 2.4,
      mag: 3,
      reload: 2.6,
      col: [1, 0.4, 0.2],
      muzzle: -0.35,
      kick: 1.4,
      snd: "rocket",
    },
    saw: {
      name: "BUZZSAW",
      desc: "Saw blades carve through four foes.",
      cd: 0.55,
      dmg: 2.2,
      proj: "saw",
      speed: 19,
      mag: 6,
      reload: 2.2,
      col: [0.9, 0.95, 1],
      muzzle: -0.25,
      kick: 1,
      snd: "saw",
    },
    plasma: {
      name: "PULSE ORB",
      desc: "Slow orb that melts all it touches.",
      cd: 0.9,
      dmg: 2.6,
      proj: "plasma",
      speed: 8,
      splash: 2.6,
      mag: 4,
      reload: 2.4,
      col: [0.8, 0.45, 1],
      muzzle: -0.27,
      kick: 1.2,
      snd: "plasma",
    },
    leech: {
      name: "BLOOD LEECH",
      desc: "Drains foes to heal your hearts.",
      cd: 0.16,
      dmg: 1,
      fx: "leech",
      mag: 20,
      reload: 1.6,
      col: [1, 0.2, 0.3],
      tw: 0.014,
      muzzle: -0.23,
      snd: "leech",
    },
    thunder: {
      name: "THUNDERCLAP",
      desc: "Shock pellets stun whatever they hit.",
      cd: 0.7,
      dmg: 0.6,
      pellets: 7,
      spread: 0.08,
      fx: "shock",
      mag: 5,
      reload: 2,
      col: [1, 0.95, 0.4],
      tw: 0.01,
      muzzle: -0.29,
      kick: 1.6,
      snd: "thunder",
    },
    moonbeam: {
      name: "MOONBEAM",
      desc: "Hold for a piercing lunar beam.",
      cd: 0.05,
      dmg: 0.45,
      auto: !0,
      pierce: !0,
      beam: !0,
      mag: 120,
      reload: 2.8,
      col: [0.65, 0.85, 1],
      tw: 0.03,
      muzzle: -0.25,
      snd: "beam",
    },
    nailer: {
      name: "NAIL DRIVER",
      desc: "Full-auto railroad spikes.",
      cd: 0.075,
      dmg: 0.6,
      auto: !0,
      proj: "nail",
      speed: 48,
      spread: 0.02,
      mag: 40,
      reload: 1.8,
      col: [0.85, 0.85, 0.8],
      muzzle: -0.23,
      kick: 0.4,
      snd: "nail",
    },
  }),
  (WEAPON_IDS.length = 0),
  WEAPON_IDS.push(...Object.keys(WEAPONS)));
const BASE_GUNS = [
    "peacemaker",
    "sixgun",
    "scatter",
    "hornet",
    "lever",
    "rico",
    "boom",
    "frost",
  ],
  UNLOCK_GUNS = [
    "gatling",
    "arc",
    "venom",
    "leech",
    "rail",
    "saw",
    "thunder",
    "dragon",
    "deadshot",
    "hellfire",
    "plasma",
    "moonbeam",
  ],
  PEACE = { id: "peacemaker", rar: 0, mods: [] };
function heldGun(n) {
  return (inRun() && R.weapons[n]) || PEACE;
}
function magSize(n) {
  const l = WEAPONS[n.id];
  return Math.max(
    1,
    Math.round((l.mag || 12) * RAR[n.rar].mag * (R.perks.mags ? 1.5 : 1)),
  );
}
function reloadTime(n) {
  return (
    WEAPONS[n.id].reload *
    (R.perks.speed ? 0.6 : 1) *
    (goldMode() ? 1 - 0.1 * META.up.quick : 1)
  );
}
function gunName(n) {
  return (
    (n.rar
      ? RAR[n.rar].name.slice(0, 1) +
        RAR[n.rar].name.slice(1).toLowerCase() +
        " "
      : "") + WEAPONS[n.id].name
  );
}
(() => {
  const n = (e, a, o, t, s, c, u, i, g) =>
      e.add(
        cyl(new Geo(), 0, 0, 0, s, s, c, u, i, g || null),
        trs(m4(), a, o, t, 0, -Math.PI / 2, 0, 1, 1, 1),
      ),
    l = (e, a = C.wood) => (
      e.add(
        box(new Geo(), 0, -0.055, 0, 0.036, 0.11, 0.046, a),
        trs(m4(), 0, 0, 0.075, 0, 0.32, 0, 1, 1, 1),
      ),
      strut(e, [0, -0.03, -0.02], [0, -0.06, 0], 0.006, C.gunDk),
      strut(e, [0, -0.06, 0], [0, -0.055, 0.045], 0.006, C.gunDk),
      box(e, 0, -0.042, 0.012, 0.006, 0.022, 0.008, C.metalLt),
      e
    ),
    m = (e, a = C.woodLt) => {
      (e.add(
        box(new Geo(), 0, 0, 0, 0.04, 0.06, 0.16, a),
        trs(m4(), 0, -0.025, 0.17, 0, 0.12, 0, 1, 1, 1),
      ),
        box(e, 0, -0.03, 0.25, 0.044, 0.08, 0.02, C.woodDk));
    },
    d = (e, a, o, t, s = 0.006) =>
      e.add(
        ring(new Geo(), o * 0.55, o, 12, t, 0),
        trs(m4(), 0, s, a, 0, Math.PI, 0, 1, 1, 1),
      ),
    r = (e, a) => {
      const o = new Geo(),
        t = new Geo();
      (a(o, t, WEAPONS[e].col), (GUN[e] = { body: o.mesh(), glow: t.mesh() }));
    };
  (r("sixgun", (e, a, o) => {
    (box(e, 0, 0, 0.04, 0.036, 0.06, 0.1, C.gun),
      n(e, 0, 0.006, -0, 0.026, 0.055, 12, C.metal, C.gunDk),
      n(e, 0, 0.012, -0.04, 0.011, 0.22, 10, C.metalLt, C.gunDk),
      box(e, 0, 0.03, -0.24, 0.006, 0.012, 0.01, C.gunDk),
      box(e, 0, 0.034, 0.085, 0.014, 0.02, 0.02, C.gunDk),
      l(e, C.woodLt));
    for (let t = 0; t < 6; t++) {
      const s = (t / 6) * TAU;
      n(
        a,
        Math.cos(s) * 0.019,
        0.006 + Math.sin(s) * 0.019,
        -0,
        0.004,
        0.056,
        6,
        o,
      );
    }
    d(a, -0.261, 0.012, o, 0.012);
  }),
    r("lever", (e, a, o) => {
      (box(e, 0, 0, 0.03, 0.04, 0.055, 0.14, C.metal),
        n(e, 0, 0.012, -0.04, 0.012, 0.4, 10, C.gunDk, C.metal),
        n(e, 0, -0.012, -0.05, 0.01, 0.3, 8, C.metal),
        box(e, 0, -0.015, -0.16, 0.04, 0.035, 0.16, C.woodLt),
        m(e),
        l(e),
        strut(e, [0, -0.04, 0], [0, -0.07, 0.04], 0.006, C.metalLt),
        strut(e, [0, -0.07, 0.04], [0, -0.06, 0.09], 0.006, C.metalLt),
        box(a, 0.021, 0, 0.03, 0.002, 0.012, 0.1, o),
        d(a, -0.441, 0.013, o, 0.012));
    }),
    r("deadshot", (e, a, o) => {
      (box(e, 0, 0, 0.03, 0.042, 0.058, 0.16, C.gunDk),
        n(e, 0, 0.01, -0.05, 0.013, 0.47, 10, C.gun, C.metal),
        n(e, 0, 0.068, 0.07, 0.018, 0.2, 12, C.metal, C.gunDk),
        box(e, 0, 0.045, 0.02, 0.012, 0.02, 0.04, C.gunDk),
        box(e, 0, 0.045, -0.09, 0.012, 0.02, 0.03, C.gunDk),
        m(e, C.gun),
        l(e, C.gunDk),
        box(e, 0, -0.045, -0.04, 0.02, 0.06, 0.04, C.gunDk),
        a.add(
          ring(new Geo(), 0, 0.016, 12, o, 0),
          trs(m4(), 0, 0.068, -0.131, 0, Math.PI, 0, 1, 1, 1),
        ),
        box(a, 0.022, 0, 0.03, 0.002, 0.014, 0.13, o),
        d(a, -0.521, 0.014, o, 0.01));
    }),
    r("gatling", (e, a, o) => {
      (box(e, 0, 0, 0.05, 0.07, 0.075, 0.16, C.gun),
        n(e, 0, 0, -0.03, 0.022, 0.04, 12, C.metal));
      for (let t = 0; t < 6; t++) {
        const s = (t / 6) * TAU;
        n(
          e,
          Math.cos(s) * 0.025,
          Math.sin(s) * 0.025,
          -0.05,
          0.007,
          0.3,
          6,
          C.metalLt,
          C.gunDk,
        );
      }
      for (const t of [-0.12, -0.3]) n(e, 0, 0, t, 0.036, 0.012, 14, C.gunDk);
      (n(e, 0, -0.075, 0.06, 0.05, 0.05, 14, C.ammo, C.gunDk),
        box(e, 0, 0.05, 0.02, 0.012, 0.03, 0.08, C.gunDk),
        l(e, C.gunDk),
        box(a, 0.036, 0, 0.05, 0.002, 0.02, 0.12, o),
        d(a, -0.351, 0.04, o, 0));
    }),
    r("dragon", (e, a, o) => {
      (box(e, 0, 0, 0.04, 0.05, 0.06, 0.15, C.gun),
        n(e, 0, 0.01, -0.03, 0.014, 0.22, 10, C.metal),
        n(e, 0, 0.01, -0.24, 0.024, 0.07, 12, C.gunDk, C.gunDk),
        l(e),
        n(a, 0, -0.06, 0.06, 0.03, 0.17, 12, o, C.gunDk));
      for (const t of [-0.06, 0])
        strut(e, [0, -0.03, t], [0, -0.04, t], 0.01, C.gunDk);
      d(a, -0.321, 0.024, o, 0.01);
    }),
    r("frost", (e, a, o) => {
      (box(e, 0, 0, 0.04, 0.046, 0.06, 0.14, C.gun),
        n(e, 0, 0.006, -0.03, 0.012, 0.14, 8, C.metal),
        l(e, C.gunDk));
      const t = mulberry(41);
      ico(a, 0, 0.006, -0.2, 0.034, 0.034, 0.05, o, t, 0.2, 0.1);
      for (let s = 0; s < 4; s++) {
        const c = (s / 4) * TAU + 0.4;
        a.add(
          box(new Geo(), 0, 0.03, 0, 0.006, 0.05, 0.03, o),
          trs(m4(), 0, 0.006, -0.12, 0, 0, c, 1, 1, 1),
        );
      }
      box(a, 0.024, 0, 0.04, 0.002, 0.012, 0.1, o);
    }),
    r("venom", (e, a, o) => {
      (box(e, 0, 0, 0.04, 0.05, 0.06, 0.14, C.gun),
        n(e, 0, 0.006, -0.03, 0.02, 0.2, 10, C.gunDk, C.metal),
        l(e),
        box(e, 0, 0.04, 0.05, 0.03, 0.006, 0.08, C.gunDk),
        n(a, 0, 0.065, 0.09, 0.026, 0.1, 12, o, C.metalLt),
        d(a, -0.251, 0.022, o, 0.006));
    }),
    r("hellfire", (e, a, o) => {
      (n(e, 0, 0.02, 0.12, 0.045, 0.46, 14, C.gunDk, C.gun),
        box(e, 0, -0.03, -0.04, 0.03, 0.04, 0.05, C.gun),
        box(e, 0, 0.075, 0, 0.01, 0.03, 0.03, C.metalLt),
        l(e, C.gunDk));
      for (let t = 0; t < 3; t++) {
        const s = (t / 3) * TAU + 0.5;
        a.add(
          cyl(new Geo(), 0, 0, 0, 0.012, 0, 0.03, 8, o),
          trs(
            m4(),
            Math.cos(s) * 0.022,
            0.02 + Math.sin(s) * 0.022,
            -0.335,
            0,
            -Math.PI / 2,
            0,
            1,
            1,
            1,
          ),
        );
      }
      box(a, 0.047, 0.02, 0.05, 0.003, 0.02, 0.2, o);
    }),
    r("saw", (e, a, o) => {
      (box(e, 0, 0, 0.04, 0.05, 0.06, 0.15, C.gun),
        box(e, 0, 0.012, -0.1, 0.02, 0.016, 0.16, C.metal),
        l(e, C.gunDk),
        a.add(
          cyl(new Geo(), 0, 0, 0, 0.07, 0.07, 0.004, 16, o, o),
          trs(m4(), 0, 0.04, -0.13, 0, 0, 0, 1, 1, 1),
        ));
      for (let t = 0; t < 10; t++) {
        const s = (t / 10) * TAU;
        box(
          a,
          Math.cos(s) * 0.073,
          0.04,
          -0.13 + Math.sin(s) * 0.073,
          0.01,
          0.003,
          0.01,
          o,
        );
      }
    }),
    r("plasma", (e, a, o) => {
      (box(e, 0, 0, 0.06, 0.05, 0.06, 0.12, C.gun),
        n(e, 0, 0.006, -0.12, 0.018, 0.14, 10, C.gunDk, C.metal));
      for (const t of [-1, 1])
        box(e, t * 0.03, 0.006, -0.06, 0.008, 0.07, 0.07, C.gunDk);
      (l(e, C.gunDk),
        ico(a, 0, 0.006, -0.06, 0.03, 0.03, 0.03, o, mulberry(5), 0, 0.1),
        d(a, -0.271, 0.018, o, 0.006));
    }),
    r("leech", (e, a, o) => {
      (box(e, 0, 0, 0.04, 0.04, 0.058, 0.14, C.gunDk),
        n(e, 0, 0.008, -0.05, 0.012, 0.18, 10, C.metal));
      for (let t = 0; t < 4; t++)
        box(e, 0, -0.015, -0.03 - t * 0.035, 0.03, 0.006, 0.01, C.metal);
      (l(e, C.gunDk),
        n(a, 0.032, 0.01, 0.06, 0.012, 0.1, 8, o, C.metalLt),
        d(a, -0.231, 0.013, o, 0.008));
    }),
    r("thunder", (e, a, o) => {
      (box(e, 0, 0, 0.03, 0.05, 0.06, 0.16, C.gun),
        n(e, 0, 0.01, -0.05, 0.016, 0.24, 10, C.gunDk, C.metal),
        box(e, 0, -0.02, -0.12, 0.05, 0.03, 0.08, C.woodLt),
        m(e),
        l(e));
      for (let t = 0; t < 3; t++)
        n(a, 0, 0.01, -0.09 - t * 0.06, 0.024, 0.01, 12, o);
      d(a, -0.291, 0.016, o, 0.01);
    }),
    r("moonbeam", (e, a, o) => {
      (box(e, 0, 0, 0.05, 0.04, 0.05, 0.14, C.metalLt),
        n(e, 0, 0.004, -0.06, 0.02, 0.18, 14, C.metal, C.metal),
        box(e, 0, 0.034, 0.02, 0.006, 0.02, 0.18, C.metal),
        l(e, C.gunDk),
        a.add(
          cyl(new Geo(), 0, 0, 0, 0.017, 0.017, 0.006, 14, o, o),
          trs(m4(), 0, 0.004, -0.236, 0, -Math.PI / 2, 0, 1, 1, 1),
        ));
      for (let t = 0; t < 3; t++)
        n(a, 0, 0.004, -0.1 - t * 0.05, 0.022, 0.006, 14, o);
    }),
    r("nailer", (e, a, o) => {
      (box(e, 0, 0, 0.03, 0.05, 0.075, 0.17, C.rust),
        box(e, 0, 0.012, -0.15, 0.024, 0.024, 0.16, C.metal),
        box(e, 0.035, 0.01, 0, 0.02, 0.02, 0.12, C.metalLt),
        l(e, C.gunDk));
      for (let t = 0; t < 6; t++)
        box(a, 0.047, 0.01, -0.05 + t * 0.02, 0.004, 0.012, 0.006, o);
      d(a, -0.231, 0.013, o, 0.012);
    }));
})();
