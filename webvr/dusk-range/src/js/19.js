"use strict";
const WEAPONS = {
    peacemaker: {
      name: "PEACEMAKER",
      desc: "Trusty six-blaster. One shot per pull.",
      cd: 0.13,
      dmg: 1,
      col: [1, 0.82, 0.5],
      tw: 0.014,
      muzzle: -0.19,
      casing: 1,
      snd: "shot",
    },
    scatter: {
      name: "SCATTERGUN",
      desc: "Eight pellets. Brutal up close.",
      cd: 0.6,
      dmg: 0.55,
      pellets: 8,
      spread: 0.075,
      col: [1, 0.5, 0.32],
      tw: 0.008,
      muzzle: -0.245,
      kick: 1.6,
      casing: 2,
      snd: "scatter",
    },
    hornet: {
      name: "HORNET",
      desc: "Hold the trigger for full auto.",
      cd: 0.09,
      dmg: 0.42,
      auto: !0,
      spread: 0.022,
      col: [0.85, 1, 0.4],
      tw: 0.008,
      muzzle: -0.165,
      casing: 1,
      snd: "hornet",
      kick: 0.5,
    },
    rail: {
      name: "RAIL LANCE",
      desc: "Pierces every enemy in a line.",
      cd: 0.85,
      dmg: 3.2,
      pierce: !0,
      col: [0.6, 0.92, 1],
      tw: 0.035,
      muzzle: -0.31,
      kick: 1.5,
      snd: "rail",
    },
    arc: {
      name: "ARC CASTER",
      desc: "Lightning leaps to three more foes.",
      cd: 0.36,
      dmg: 1.15,
      chain: 3,
      chainR: 6.5,
      col: [0.8, 0.6, 1],
      tw: 0.01,
      muzzle: -0.22,
      snd: "arc",
    },
    boom: {
      name: "BOOM TUBE",
      desc: "Lobs a grenade with a 2 m blast.",
      cd: 0.8,
      dmg: 3,
      splash: 2.2,
      proj: !0,
      col: [1, 0.6, 0.25],
      muzzle: -0.27,
      kick: 1.3,
      snd: "boom",
    },
    rico: {
      name: "RICOCHET",
      desc: "Every shot bounces to two more foes.",
      cd: 0.3,
      dmg: 1.4,
      bounce: 2,
      bounceR: 7.5,
      col: [1, 0.85, 0.4],
      tw: 0.012,
      muzzle: -0.235,
      casing: 1,
      snd: "rico",
    },
  },
  WEAPON_IDS = Object.keys(WEAPONS),
  GUN = {};
(() => {
  const r = (o) => {
      o.add(
        box(new Geo(), 0, -0.055, 0, 0.036, 0.11, 0.046, C.wood),
        trs(m4(), 0, 0, 0.075, 0, 0.32, 0, 1, 1, 1),
      );
      for (const e of [-1, 1])
        o.add(
          box(new Geo(), e * 0.0185, -0.055, 0, 0.002, 0.08, 0.03, C.woodDk),
          trs(m4(), 0, 0, 0.075, 0, 0.32, 0, 1, 1, 1),
        );
      return (
        strut(o, [0, -0.03, -0.02], [0, -0.06, 0], 0.006, C.gunDk),
        strut(o, [0, -0.06, 0], [0, -0.055, 0.045], 0.006, C.gunDk),
        box(o, 0, -0.042, 0.012, 0.006, 0.022, 0.008, C.metalLt),
        o
      );
    },
    s = (o, e, n, t, c, a, d, l, m) =>
      o.add(
        cyl(new Geo(), 0, 0, 0, c, c, a, d, l, m || null),
        trs(m4(), e, n, t, 0, -Math.PI / 2, 0, 1, 1, 1),
      );
  GUN.peacemaker = { body: MESH.blaster, glow: MESH.blasterGlow };
  {
    const o = new Geo(),
      e = new Geo();
    (box(o, 0, 0, 0.03, 0.05, 0.06, 0.16, C.gun),
      box(o, 0, 0.033, 0.03, 0.03, 0.008, 0.14, C.gunDk));
    for (const n of [-1, 1])
      s(o, n * 0.0125, 0.008, -0.05, 0.012, 0.19, 10, C.gunDk, C.metal);
    box(o, 0, -0.022, -0.13, 0.05, 0.034, 0.09, C.woodLt);
    for (let n = 0; n < 4; n++)
      box(o, 0, -0.022, -0.16 + n * 0.022, 0.052, 0.036, 0.004, C.woodDk);
    (o.add(
      box(new Geo(), 0, 0, 0, 0.042, 0.055, 0.12, C.wood),
      trs(m4(), 0, -0.02, 0.15, 0, 0.18, 0, 1, 1, 1),
    ),
      r(o));
    for (const n of [-1, 1])
      box(e, n * 0.026, 0, 0.05, 0.003, 0.012, 0.06, C.scatter);
    for (const n of [-1, 1])
      e.add(
        ring(new Geo(), 0.004, 0.011, 8, C.scatter, 0),
        trs(m4(), n * 0.0125, 0.008, -0.241, 0, Math.PI, 0, 1, 1, 1),
      );
    GUN.scatter = { body: o.mesh(), glow: e.mesh() };
  }
  {
    const o = new Geo(),
      e = new Geo();
    (box(o, 0, 0.005, 0.01, 0.046, 0.07, 0.15, C.gun),
      box(o, 0, 0.044, 0, 0.022, 0.012, 0.13, C.gunDk),
      s(o, 0, 0.012, -0.065, 0.017, 0.09, 10, C.gunDk, C.metal));
    for (let n = 0; n < 3; n++)
      s(o, 0, 0.012, -0.08 - n * 0.025, 0.0195, 0.008, 10, C.gun);
    (o.add(
      box(new Geo(), 0, -0.06, 0, 0.026, 0.1, 0.036, C.gunDk),
      trs(m4(), 0, -0.02, -0.02, 0, -0.15, 0, 1, 1, 1),
    ),
      box(o, 0, -0.005, 0.11, 0.03, 0.04, 0.07, C.gunDk),
      r(o),
      box(e, 0.0235, 0.012, 0.02, 0.003, 0.012, 0.09, C.hornet),
      box(e, -0.0235, 0.012, 0.02, 0.003, 0.012, 0.09, C.hornet),
      e.add(
        ring(new Geo(), 0.007, 0.0135, 10, C.hornet, 0),
        trs(m4(), 0, 0.012, -0.156, 0, Math.PI, 0, 1, 1, 1),
      ),
      (GUN.hornet = { body: o.mesh(), glow: e.mesh() }));
  }
  {
    const o = new Geo(),
      e = new Geo();
    (box(o, 0, 0, 0.04, 0.042, 0.058, 0.18, C.gun),
      box(o, 0, -0.035, 0.06, 0.03, 0.02, 0.1, C.gunDk));
    for (const n of [-0.016, 0.022])
      box(o, 0, n, -0.18, 0.012, 0.012, 0.25, C.metalLt);
    (box(o, 0, 0.045, 0.02, 0.016, 0.03, 0.05, C.gunDk), r(o));
    for (let n = 0; n < 5; n++)
      e.add(
        cyl(new Geo(), 0, 0, 0, 0.026, 0.026, 0.008, 12, C.rail),
        trs(m4(), 0, 0.003, -0.08 - n * 0.045, 0, -Math.PI / 2, 0, 1, 1, 1),
      );
    (box(e, 0, 0.003, -0.18, 0.006, 0.026, 0.24, C.rail),
      box(e, 0.022, 0, 0.05, 0.003, 0.02, 0.12, C.rail),
      (GUN.rail = { body: o.mesh(), glow: e.mesh() }));
  }
  {
    const o = new Geo(),
      e = new Geo(),
      n = mulberry(91);
    (box(o, 0, 0, 0.03, 0.046, 0.062, 0.15, C.gun),
      s(o, 0, 0.005, -0.04, 0.014, 0.12, 8, C.gunDk));
    for (let t = 0; t < 3; t++)
      s(o, 0, 0.005, -0.06 - t * 0.035, 0.03 - t * 0.004, 0.006, 12, C.gunDk);
    (r(o), ico(e, 0, 0.005, -0.2, 0.026, 0.026, 0.026, C.arc, n, 0.15, 0));
    for (let t = 0; t < 8; t++) {
      const c = t * 0.8;
      box(
        e,
        Math.cos(c) * 0.017,
        0.005 + Math.sin(c) * 0.017,
        -0.05 - t * 0.012,
        0.005,
        0.005,
        0.01,
        C.arc,
      );
    }
    (box(e, 0.0235, 0, 0.03, 0.003, 0.014, 0.1, C.arc),
      (GUN.arc = { body: o.mesh(), glow: e.mesh() }));
  }
  {
    const o = new Geo(),
      e = new Geo();
    (s(o, 0, 0.01, 0.08, 0.034, 0.35, 14, C.gunDk, C.gun),
      box(o, 0, 0.05, -0.02, 0.012, 0.03, 0.03, C.gun),
      box(o, 0, -0.04, -0.12, 0.024, 0.06, 0.028, C.woodLt),
      r(o),
      e.add(
        ring(new Geo(), 0.024, 0.036, 14, C.boom, 0),
        trs(m4(), 0, 0.01, -0.271, 0, Math.PI, 0, 1, 1, 1),
      ),
      e.add(
        cyl(new Geo(), 0, 0, 0, 0.036, 0.036, 0.01, 14, C.boom),
        trs(m4(), 0, 0.01, 0.02, 0, -Math.PI / 2, 0, 1, 1, 1),
      ),
      (GUN.boom = { body: o.mesh(), glow: e.mesh() }));
  }
  {
    const o = new Geo(),
      e = new Geo();
    (box(o, 0, 0, 0.04, 0.034, 0.06, 0.12, C.gun),
      s(o, 0, 0.004, 0, 0.024, 0.05, 12, C.gunDk, C.gun),
      s(o, 0, 0.012, -0.03, 0.009, 0.2, 10, C.gunDk, C.metal),
      box(o, 0, 0.026, -0.12, 0.012, 0.01, 0.18, C.gun),
      box(o, 0, 0.04, 0.09, 0.012, 0.02, 0.02, C.gunDk),
      r(o));
    for (let n = 0; n < 6; n++) {
      const t = (n / 6) * TAU;
      e.add(
        cyl(new Geo(), 0, 0, 0, 0.004, 0.004, 0.052, 6, C.rico),
        trs(
          m4(),
          Math.cos(t) * 0.024,
          0.004 + Math.sin(t) * 0.024,
          0.001,
          0,
          -Math.PI / 2,
          0,
          1,
          1,
          1,
        ),
      );
    }
    (box(e, 0.018, 0.012, -0.08, 0.002, 0.006, 0.14, C.rico),
      (GUN.rico = { body: o.mesh(), glow: e.mesh() }));
  }
})();
