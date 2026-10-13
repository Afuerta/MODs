"use strict";
(Object.assign(C, {
  zSkin: hex("#9aa58c"),
  zSkinDk: hex("#6f7a64"),
  zBlood: hex("#5a1e1e"),
  zMouth: hex("#1a1014"),
  zOver: hex("#4a5a72"),
  zShirt: hex("#8a7a5a"),
  zCoat: hex("#26222a"),
  zCollar: hex("#d8d2c4"),
  zFlannel: hex("#8a2e2a"),
  zFlannelDk: hex("#5a1e1c"),
  zPants: hex("#4a3e32"),
  zBoot: hex("#2a2018"),
  zBelt: hex("#3a2a1e"),
  zHat: hex("#5a4a36"),
  zHair: hex("#3a342e"),
  zBloat: hex("#8a9a6a"),
  zPus: hex("#c8ff5a"),
  zSac: hex("#9adf4a"),
  zBone: hex("#d8d0b8"),
  zBoneDk: hex("#a89e86"),
  zIron: hex("#3a3640"),
  zLid: hex("#5a4030"),
  zRobe: hex("#2a2632"),
  zRobeDk: hex("#18161e"),
  zHag: hex("#b8c0b0"),
  zHagHair: hex("#e0e4e8"),
  zTitan: hex("#7f8a72"),
  zTitanDk: hex("#5a6452"),
  zStitch: hex("#2a2226"),
  zHeart: hex("#ff5a3a"),
  zStone: hex("#7a7680"),
}),
  (() => {
    const t = mulberry(311);
    {
      const o = new Geo();
      (box(o, 0, -0.22, 0, 0.14, 0.44, 0.15, C.zPants),
        box(o, 0, -0.62, 0, 0.12, 0.38, 0.13, C.zPants),
        box(o, 0, -0.82, 0.04, 0.13, 0.07, 0.24, C.zBoot),
        box(o, 0.02, -0.5, 0.075, 0.06, 0.1, 0.01, C.zSkinDk),
        (EM.zLeg = o.mesh()));
    }
    {
      const o = new Geo();
      (box(o, 0, -0.16, 0, 0.11, 0.32, 0.11, C.zShirt),
        box(o, 0, -0.38, 0, 0.08, 0.16, 0.08, C.zSkin),
        box(o, 0, -0.5, 0, 0.09, 0.08, 0.05, C.zSkin));
      for (let n = 0; n < 3; n++)
        box(o, -0.03 + n * 0.03, -0.58, 0, 0.018, 0.09, 0.02, C.zSkinDk);
      EM.zArm = o.mesh();
    }
    const e = (o, n, a) => {
      const s = new Geo();
      (box(s, 0, 1.14, 0, 0.42, 0.5, 0.26, o),
        box(s, 0, 0.86, 0, 0.38, 0.2, 0.24, n));
      for (const i of [-1, 1]) box(s, i * 0.25, 1.33, 0, 0.12, 0.12, 0.26, o);
      return (
        box(s, 0, 1.42, 0, 0.12, 0.1, 0.12, C.zSkin),
        box(s, 0.08, 1.05, 0.135, 0.1, 0.12, 0.01, C.zBlood),
        a(s),
        s.mesh()
      );
    };
    ((EM.zTorsoA = e(C.zShirt, C.zOver, (o) => {
      box(o, 0, 1, 0.13, 0.3, 0.32, 0.02, C.zOver);
      for (const n of [-1, 1])
        box(o, n * 0.1, 1.24, 0.135, 0.05, 0.3, 0.01, C.zOver);
    })),
      (EM.zTorsoB = e(C.zCoat, C.zCoat, (o) => {
        (box(o, 0, 1.38, 0.13, 0.12, 0.05, 0.02, C.zCollar),
          box(o, 0, 0.7, -0.02, 0.44, 0.34, 0.28, C.zCoat),
          box(o, 0, 1.15, 0.135, 0.02, 0.5, 0.01, C.zRobeDk));
      })),
      (EM.zTorsoC = e(C.zFlannel, C.zPants, (o) => {
        for (let n = 0; n < 4; n++)
          box(o, 0, 0.95 + n * 0.12, 0.132, 0.42, 0.02, 0.01, C.zFlannelDk);
        for (const n of [-1, 1])
          box(o, n * 0.12, 1.15, 0.136, 0.035, 0.5, 0.01, C.zBelt);
        box(o, 0, 0.88, 0.125, 0.4, 0.05, 0.02, C.zBelt);
      })));
    const r = (o) => {
      const n = new Geo();
      (box(n, 0, 0.14, 0, 0.24, 0.26, 0.25, C.zSkin),
        box(n, 0, 0.02, 0.04, 0.2, 0.08, 0.2, C.zSkinDk),
        box(n, 0, 0, 0.12, 0.12, 0.05, 0.02, C.zMouth));
      for (const a of [-1, 1])
        box(n, a * 0.06, 0.16, 0.122, 0.06, 0.045, 0.01, C.zMouth);
      return (
        box(n, 0, 0.11, 0.135, 0.04, 0.06, 0.03, C.zSkinDk),
        o(n),
        n.mesh()
      );
    };
    ((EM.zHeadA = r((o) => {
      for (let n = 0; n < 5; n++)
        box(
          o,
          -0.1 + t() * 0.2,
          0.28,
          -0.05 + t() * 0.12,
          0.05,
          0.05 + t() * 0.04,
          0.05,
          C.zHair,
        );
    })),
      (EM.zHeadB = r((o) => {
        (cyl(o, 0, 0.26, 0, 0.24, 0.23, 0.02, 14, C.zHat, C.zHat),
          cyl(o, 0, 0.27, 0, 0.13, 0.12, 0.12, 10, C.zHat, C.zHat));
      })),
      (EM.zHeadS = r((o) => {
        box(o, 0, -0.06, 0.06, 0.18, 0.12, 0.16, C.zSac);
      })),
      (EM.zEyes = (() => {
        const o = new Geo();
        for (const n of [-1, 1])
          box(o, n * 0.06, 0.16, 0.125, 0.03, 0.02, 0.012, C.white1);
        return o.mesh();
      })()),
      (EM.zSacGlow = box(
        new Geo(),
        0,
        -0.06,
        0.142,
        0.12,
        0.08,
        0.01,
        C.zPus,
      ).mesh()));
    {
      const o = new Geo();
      (ico(o, 0, 1, 0.04, 0.42, 0.46, 0.4, C.zBloat, t, 0.08, 0.12),
        box(o, 0, 1.45, 0, 0.14, 0.1, 0.14, C.zSkin));
      for (const a of [-1, 1])
        box(o, a * 0.33, 1.3, 0, 0.14, 0.12, 0.2, C.zShirt);
      (box(o, 0, 0.62, 0, 0.36, 0.14, 0.26, C.zPants),
        (EM.zBloatBody = o.mesh()));
      const n = new Geo();
      for (let a = 0; a < 9; a++) {
        const s = t() * TAU,
          i = 0.75 + t() * 0.5;
        ico(
          n,
          Math.sin(s) * 0.4,
          i,
          0.04 + Math.cos(s) * 0.36,
          0.06,
          0.06,
          0.06,
          C.zPus,
          t,
          0.1,
          0,
        );
      }
      EM.zPustules = n.mesh();
    }
    {
      const o = new Geo();
      (box(o, 0, 0.2, 0, 0.42, 0.24, 0.5, C.zShirt),
        box(o, 0, 0.18, -0.32, 0.3, 0.16, 0.2, C.zPants));
      for (let n = 0; n < 3; n++)
        box(o, -0.08 + n * 0.08, 0.1, -0.44, 0.05, 0.05, 0.08, C.zBlood);
      (box(o, 0, 0.33, 0.25, 0.1, 0.08, 0.1, C.zSkin), (EM.zCrawl = o.mesh()));
    }
    {
      const o = new Geo();
      for (let s = 0; s < 5; s++)
        box(
          o,
          0,
          0.62,
          -0.25 + s * 0.12,
          0.26 - Math.abs(s - 2) * 0.02,
          0.2,
          0.025,
          C.zBone,
        );
      (strut(o, [0, 0.72, -0.4], [0, 0.72, 0.38], 0.035, C.zBoneDk),
        box(o, 0, 0.6, -0.36, 0.22, 0.16, 0.14, C.zBoneDk));
      for (let s = 0; s < 4; s++)
        strut(
          o,
          [0, 0.66, -0.42 - s * 0.06],
          [0, 0.7 + s * 0.04, -0.48 - s * 0.07],
          0.02,
          C.zBone,
        );
      EM.dogBody = o.mesh();
      const n = new Geo();
      (box(n, 0, 0, 0, 0.18, 0.16, 0.2, C.zBone),
        box(n, 0, -0.03, 0.17, 0.1, 0.08, 0.18, C.zBone),
        box(n, 0, -0.07, 0.17, 0.09, 0.03, 0.17, C.zBoneDk));
      for (const s of [-1, 1])
        (box(n, s * 0.06, 0.11, -0.02, 0.04, 0.1, 0.04, C.zBoneDk),
          box(n, s * 0.05, 0.03, 0.1, 0.04, 0.035, 0.01, C.zMouth));
      ((EM.dogHead = n.mesh()),
        (EM.dogEyes = (() => {
          const s = new Geo();
          for (const i of [-1, 1])
            box(s, i * 0.05, 0.03, 0.105, 0.03, 0.02, 0.01, C.white1);
          return s.mesh();
        })()));
      const a = new Geo();
      (strut(a, [0, 0, 0], [0, -0.3, 0.04], 0.025, C.zBone),
        strut(a, [0, -0.3, 0.04], [0, -0.58, -0.02], 0.02, C.zBone),
        box(a, 0, -0.6, 0.02, 0.05, 0.03, 0.08, C.zBoneDk),
        (EM.dogLeg = a.mesh()));
    }
    {
      const o = new Geo();
      (box(o, 0, 1.16, 0, 0.66, 0.6, 0.4, C.zSkin),
        box(o, 0, 0.82, 0, 0.56, 0.24, 0.36, C.zPants));
      for (const i of [-1, 1])
        box(o, i * 0.4, 1.38, 0, 0.24, 0.2, 0.36, C.zSkinDk);
      for (let i = 0; i < 4; i++)
        box(o, -0.2 + i * 0.13, 1.1, 0.205, 0.02, 0.4, 0.01, C.zStitch);
      for (let i = 0; i < 8; i++) {
        const h = (i / 8) * Math.PI;
        box(
          o,
          Math.cos(h) * 0.3,
          1 + Math.sin(h) * 0.35,
          0.21,
          0.05,
          0.05,
          0.03,
          C.zIron,
        );
      }
      EM.bruteTorso = o.mesh();
      const n = new Geo();
      box(n, 0, 0.12, 0.02, 0.26, 0.24, 0.26, C.zSkinDk);
      for (let i = 0; i < 5; i++)
        box(n, -0.12 + i * 0.06, 0.13, 0.16, 0.025, 0.28, 0.025, C.zIron);
      (box(n, 0, 0.27, 0.02, 0.3, 0.03, 0.3, C.zIron),
        box(n, 0, 0.02, 0.16, 0.3, 0.03, 0.03, C.zIron),
        (EM.bruteHead = n.mesh()));
      const a = new Geo();
      (box(a, 0, -0.2, 0, 0.2, 0.42, 0.2, C.zSkin),
        box(a, 0, -0.5, 0, 0.17, 0.26, 0.17, C.zSkinDk),
        box(a, 0, -0.68, 0.02, 0.2, 0.14, 0.18, C.zSkin),
        (EM.bruteArm = a.mesh()));
      const s = new Geo();
      for (const [i, h] of [
        [0.5, 0.35],
        [0.62, 0.05],
        [0.56, -0.3],
        [0.42, -0.6],
      ])
        box(s, 0, h, 0, i, 0.32, 0.06, C.zLid);
      for (let i = 0; i < 3; i++)
        box(s, 0, 0.3 - i * 0.4, 0.035, 0.6, 0.04, 0.02, C.zIron);
      (box(s, 0, 0, 0.04, 0.04, 0.5, 0.02, C.zIron),
        box(s, 0, 0.1, 0.04, 0.3, 0.04, 0.02, C.zIron),
        (EM.bruteShield = s.mesh()));
    }
    {
      const o = new Geo();
      lathe(
        o,
        [
          [0.42, 0],
          [0.36, 0.5],
          [0.24, 1.1],
          [0.16, 1.45],
          [0.12, 1.58],
        ],
        10,
        C.zRobe,
        C.zRobe,
      );
      for (let i = 0; i < 12; i++) {
        const h = (i / 12) * TAU;
        o.tri(
          [Math.sin(h) * 0.42, 0, Math.cos(h) * 0.42],
          [Math.sin(h + 0.26) * 0.42, 0, Math.cos(h + 0.26) * 0.42],
          [
            Math.sin(h + 0.13) * 0.36,
            -0.3 - t() * 0.3,
            Math.cos(h + 0.13) * 0.36,
          ],
          C.zRobeDk,
        );
      }
      (box(o, 0, 1.3, 0.14, 0.3, 0.06, 0.12, C.zRobeDk),
        (EM.witchBody = o.mesh()));
      const n = new Geo();
      (box(n, 0, 0.12, 0.02, 0.2, 0.24, 0.2, C.zHag),
        box(n, 0, 0.08, 0.15, 0.04, 0.1, 0.08, C.zHag),
        box(n, 0, 0, 0.11, 0.1, 0.04, 0.02, C.zMouth));
      for (let i = 0; i < 7; i++) {
        const h = -0.12 + i * 0.04;
        box(
          n,
          h,
          0 - t() * 0.1,
          -0.06 + t() * 0.04,
          0.035,
          0.42 + t() * 0.2,
          0.06,
          C.zHagHair,
        );
      }
      (cyl(n, 0, 0.22, -0.01, 0.18, 0.02, 0.32, 8, C.zRobeDk, C.zRobeDk),
        (EM.witchHead = n.mesh()),
        (EM.witchEyes = (() => {
          const i = new Geo();
          for (const h of [-1, 1])
            box(i, h * 0.05, 0.15, 0.115, 0.035, 0.025, 0.01, C.white1);
          return i.mesh();
        })()));
      const a = new Geo();
      (box(a, 0, -0.25, 0, 0.07, 0.5, 0.07, C.zRobe),
        box(a, 0, -0.55, 0, 0.05, 0.14, 0.05, C.zHag));
      for (let i = 0; i < 4; i++)
        box(a, -0.03 + i * 0.02, -0.67, 0, 0.012, 0.12, 0.012, C.zHag);
      EM.witchArm = a.mesh();
      const s = new Geo();
      (box(s, 0, 0, 0, 0.14, 0.02, 0.14, C.zIron),
        box(s, 0, 0.22, 0, 0.14, 0.02, 0.14, C.zIron));
      for (const [i, h] of [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ])
        box(s, i * 0.065, 0.11, h * 0.065, 0.015, 0.22, 0.015, C.zIron);
      ((EM.lantern = s.mesh()),
        (EM.lanternGlow = box(
          new Geo(),
          0,
          0.11,
          0,
          0.1,
          0.18,
          0.1,
          C.white1,
        ).mesh()));
    }
    {
      let h = function (c) {
        (c.add(
          cyl(new Geo(), 0, 0, 0, 0.3, 0.3, 0.16, 10, C.zStone, C.zStone),
          trs(m4(), 0, 0.45, -0.08, 0, Math.PI / 2, 0, 1, 1, 1),
        ),
          box(c, 0, 0.1, 0.085, 0.3, 0.06, 0.01, hex("#4a4650")),
          box(c, 0, -0.06, 0.085, 0.36, 0.04, 0.01, hex("#4a4650")));
      };
      const o = new Geo();
      (box(o, 0, 1.2, 0, 0.8, 0.7, 0.5, C.zTitan),
        box(o, 0, 0.8, 0, 0.66, 0.3, 0.44, C.zTitanDk),
        box(o, 0, 1.58, -0.04, 0.9, 0.2, 0.46, C.zTitanDk));
      for (const c of [-1, 1])
        (box(o, c * 0.5, 1.48, 0, 0.3, 0.3, 0.46, C.zTitan),
          box(o, c * 0.2, 1.25, 0.255, 0.18, 0.36, 0.02, C.zTitanDk));
      for (let c = 0; c < 6; c++)
        (box(o, -0.38 + c * 0.15, 0.98, 0.252, 0.012, 0.36, 0.01, C.zStitch),
          box(
            o,
            -0.3 + t() * 0.6,
            1 + t() * 0.5,
            0.253,
            0.12,
            0.012,
            0.01,
            C.zStitch,
          ));
      box(o, 0, 1.25, 0.24, 0.24, 0.24, 0.04, C.zBlood);
      for (let c = 0; c < 4; c++)
        box(o, -0.1 + c * 0.065, 1.25, 0.265, 0.015, 0.3, 0.015, C.zIron);
      (box(o, 0, 0.72, 0.23, 0.68, 0.06, 0.04, C.zBelt),
        box(o, 0, 0.72, 0.255, 0.1, 0.08, 0.02, C.zIron));
      for (let c = 0; c < 5; c++)
        box(o, -0.3 + c * 0.15, 0.55, 0.2, 0.1, 0.28, 0.06, C.zPants);
      EM.titanTorso = o.mesh();
      const n = new Geo();
      (box(n, 0, 0.1, 0.06, 0.32, 0.28, 0.3, C.zTitanDk),
        box(n, 0, -0.02, 0.2, 0.22, 0.08, 0.06, C.zMouth));
      for (let c = 0; c < 5; c++)
        box(n, -0.08 + c * 0.04, 0.02, 0.23, 0.02, 0.05, 0.01, C.zBone);
      (box(n, 0.08, 0.2, 0.215, 0.12, 0.01, 0.01, C.zStitch),
        box(n, -0.1, 0.24, 0.1, 0.01, 0.01, 0.2, C.zStitch),
        (EM.titanHead = n.mesh()),
        (EM.titanEyes = (() => {
          const c = new Geo();
          return (
            box(c, -0.07, 0.15, 0.215, 0.05, 0.03, 0.01, C.white1),
            box(c, 0.07, 0.13, 0.215, 0.035, 0.035, 0.01, C.white1),
            c.mesh()
          );
        })()));
      const a = new Geo();
      (box(a, 0, -0.25, 0, 0.26, 0.5, 0.26, C.zTitan),
        box(a, 0, -0.62, 0, 0.22, 0.34, 0.22, C.zTitanDk),
        box(a, 0, -0.9, 0.03, 0.3, 0.24, 0.3, C.zTitan),
        box(a, 0, -0.25, 0.135, 0.012, 0.4, 0.01, C.zStitch),
        (EM.titanArm = a.mesh()));
      const s = new Geo();
      (box(s, 0, -0.22, 0, 0.26, 0.44, 0.28, C.zPants),
        box(s, 0, -0.6, 0, 0.24, 0.36, 0.26, C.zTitanDk),
        box(s, 0, -0.82, 0.06, 0.28, 0.1, 0.38, C.zBoot),
        (EM.titanLeg = s.mesh()),
        (EM.titanHeart = (() => {
          const c = new Geo();
          return (
            ico(c, 0, 0, 0, 0.1, 0.12, 0.06, C.white1, t, 0.15, 0),
            c.mesh()
          );
        })()));
      const i = new Geo();
      (box(i, 0, 0, 0, 0.6, 0.9, 0.16, C.zStone),
        h(i),
        (EM.tombstone = i.mesh()));
    }
  })());
const ZT = ["zTorsoA", "zTorsoB", "zTorsoC"],
  ZH = ["zHeadA", "zHeadB", "zHeadA"],
  ZSKIN = [
    [1, 1, 1],
    [0.86, 0.92, 0.82],
    [1.06, 1.02, 0.94],
    [0.8, 0.84, 0.9],
  ],
  ZPANTS = [
    [1, 1, 1],
    [0.7, 0.75, 0.95],
    [1.2, 1.05, 0.9],
    [0.75, 0.7, 0.7],
  ];
(Object.assign(ETYPES, {
  shambler: {
    name: "SHAMBLER",
    hp: 3,
    score: 30,
    gold: 20,
    brain: "zombie",
    speed: 0.85,
    undead: !0,
    melee: { range: 0.85, reach: 1.1, tele: 0.6 },
    hit: [
      [0, 1.12, 0, 0.3, 1],
      [0, 1.6, 0.04, 0.17, 2],
      [0, 0.45, 0, 0.24, 1],
    ],
    gib: [C.zSkin, C.zShirt, C.zBlood],
    draw: drawZombie,
  },
  runner: {
    name: "RUNNER",
    hp: 2.2,
    score: 35,
    gold: 25,
    brain: "zombie",
    speed: 3,
    weave: 1.2,
    undead: !0,
    melee: { range: 0.9, reach: 1.15, tele: 0.38 },
    hit: [
      [0, 1.12, 0, 0.3, 1],
      [0, 1.6, 0.04, 0.17, 2],
      [0, 0.45, 0, 0.24, 1],
    ],
    gib: [C.zSkin, C.zFlannel, C.zBlood],
    draw: drawZombie,
  },
  crawler: {
    name: "CRAWLER",
    hp: 2,
    score: 30,
    gold: 20,
    brain: "zombie",
    speed: 0.9,
    crawl: !0,
    undead: !0,
    melee: { range: 0.8, reach: 1, tele: 0.5 },
    hit: [
      [0, 0.25, 0, 0.28, 1],
      [0, 0.42, 0.32, 0.15, 2],
    ],
    gib: [C.zSkin, C.zShirt, C.zBlood],
    draw: drawCrawler,
  },
  spitter: {
    name: "SPITTER",
    hp: 3,
    score: 40,
    gold: 30,
    brain: "zombie",
    speed: 1,
    undead: !0,
    standoff: [6, 9],
    melee: { range: 0.85, reach: 1.1, tele: 0.55 },
    shoot: { cd: 3.6, tele: 0.8 },
    hit: [
      [0, 1.12, 0, 0.3, 1],
      [0, 1.6, 0.04, 0.17, 2],
      [0, 0.45, 0, 0.24, 1],
    ],
    gib: [C.zSkin, C.zSac, C.zBlood],
    draw: drawZombie,
  },
  bloater: {
    name: "BLOATER",
    hp: 5,
    score: 45,
    gold: 30,
    brain: "zombie",
    speed: 0.7,
    undead: !0,
    bloat: !0,
    melee: { range: 1.4, reach: 2.1, tele: 0.9 },
    hit: [
      [0, 1, 0.04, 0.46, 1],
      [0, 1.62, 0, 0.16, 2],
      [0, 0.4, 0, 0.24, 1],
    ],
    gib: [C.zBloat, C.zPus, C.zBlood],
    draw: drawBloater,
  },
  coyote: {
    name: "BONE COYOTE",
    hp: 1.6,
    score: 30,
    gold: 25,
    brain: "charger",
    speed: 4.6,
    undead: !0,
    melee: { range: 1.5, reach: 1.8, tele: 0.4 },
    dodge: { kind: "step", chance: 0.35, cd: 2.4, dist: 1.3, aim: 0.35 },
    hit: [
      [0, 0.62, 0, 0.3, 1],
      [0, 0.78, 0.5, 0.14, 2],
    ],
    gib: [C.zBone, C.zBoneDk],
    draw: drawCoyote,
  },
  brute: {
    name: "BRUTE",
    mini: !0,
    hp: 30,
    score: 250,
    gold: 200,
    brain: "brute",
    speed: 0.95,
    scale: 1.55,
    undead: !0,
    metal: !0,
    gib: [C.zSkin, C.zLid, C.zIron, C.zBlood],
    draw: drawBrute,
    onHit: bruteHit,
  },
  witch: {
    name: "GRAVE WITCH",
    mini: !0,
    hp: 22,
    score: 250,
    gold: 200,
    brain: "witch",
    speed: 1,
    undead: !0,
    dodge: { kind: "blink", chance: 0.5, cd: 2.6, dist: 2.4, aim: 0.3 },
    hit: [
      [0, 0.9, 0, 0.34, 1],
      [0, 1.66, 0.03, 0.15, 2],
    ],
    gib: [C.zRobe, C.zHag, C.ecto],
    draw: drawWitch,
  },
  titan: {
    name: "GRAVE TITAN",
    boss: !0,
    hp: 70,
    score: 900,
    gold: 600,
    brain: "titan",
    scale: 2.5,
    undead: !0,
    gib: [C.zTitan, C.zTitanDk, C.zStone, C.zBlood],
    draw: drawTitan,
    onHit: titanHit,
  },
}),
  (ETYPES.marshal.gold = 600),
  (ETYPES.ghost.gold = 15),
  (ETYPES.skeleton.gold = 25));
function zombieLook(t) {
  ((t.look = t.look ?? Math.floor(Math.random() * 3)),
    (t.skin = t.skin ?? Math.floor(Math.random() * 4)),
    (t.pants = t.pants ?? Math.floor(Math.random() * 4)));
}
function spawnZombie(t, e) {
  const r = ETYPES[t];
  if (t === "witch") {
    const i = spawnAngle(),
      [h, c] = arenaPoint(i, ROOM.r + 9),
      l = makeEnemy(t, h, c, {
        ang: i,
        orbR: ROOM.r + rand(6.5, 8.5),
        alt: rand(2.4, 3.4),
        w: (Math.random() < 0.5 ? -1 : 1) * 0.3,
        summonT: 6,
        alpha: 0,
        screamT: 0,
      });
    return ((l.y = 7), (l.state = "spawn"), sfx.scream([h, 6, c]), l);
  }
  if (t === "titan") {
    const i = PL.viewA + rand(-0.4, 0.4),
      [h, c] = arenaPoint(i, ROOM.r + 11),
      l = makeEnemy(t, h, c, { summonT: 10, hbList: [] });
    return (
      (l.y = -6),
      (l.state = "spawn"),
      sfx.roar([h, 2, c]),
      puff([h, 0.5, c], 20, [0.32, 0.28, 0.24], 1.2, 2.5),
      l
    );
  }
  if (t === "bat" || t === "skull" || t === "burrower") return spawnCreature(t);
  if (t === "drake") return spawnDrake();
  if (
    !r.undead ||
    r.brain === "charger" ||
    r.brain === "diver" ||
    t === "marshal"
  )
    return spawnEnemy(t, e);
  const o = e ? Math.atan2(e[0] - ROOM.cx, -(e[1] - ROOM.cz)) : spawnAngle(),
    [n, a] = e || portalSpot() || arenaPoint(o, ROOM.r + rand(9, 13)),
    s = makeEnemy(t, n, a, {
      weave: rand(0, 6),
      atkCd: 0,
      groanT: rand(1, 5),
      lurch: rand(0.85, 1.15),
      hbList: r.hit ? null : [],
    });
  (zombieLook(s),
    t === "spitter" && (s.look = 2),
    (s.y = -1.8 * s.s),
    (s.state = "spawn"),
    puff([n, 0.2, a], 8, [0.32, 0.28, 0.24], 0.4, 1.2));
  for (let i = 0; i < 8; i++) {
    const h = rdir(0.8),
      c = rand(1, 3);
    part(
      "cube",
      [n, 0.05, a],
      [h[0] * c, h[1] * c + 1.5, h[2] * c],
      [0.06, 0.04, 0.05],
      C.nDirt,
      1.2,
      { grav: 9, bounce: 0.2 },
    );
  }
  return (sfx.rise([n, 0.3, a]), s);
}
const zSpeed = (t) =>
  t.T.speed * D.speed * (t.rage > 0 ? 1.35 : 1) * (t.lurch || 1);
Object.assign(BRAINS, {
  zombie(t, e) {
    const r = t.T,
      o = toHead(t),
      n = hdist(t);
    if (
      ((t.groanT -= e),
      t.groanT <= 0 &&
        ((t.groanT = rand(3, 7)), sfx.groan([t.x, t.y + 1.5, t.z])),
      t.rage > 0 && (t.rage -= e),
      t.state === "spawn")
    ) {
      t.st += e;
      const a = Math.min(1, t.st / 1.3);
      ((t.rise = a),
        (t.faceYaw = o),
        (t.y = groundAt(t.x, t.z) - (1 - a) * (1 - a) * 1.8 * t.s),
        a >= 1 && ((t.state = "move"), (t.st = 0)));
      return;
    }
    if (((t.atkCd -= e), t.state === "move")) {
      let a = zSpeed(t);
      const s =
        Math.sin(t.age * 1.6 + t.weave) *
        (r.weave || 0.35) *
        Math.min(1, n / 3);
      if (
        (r.standoff && n < r.standoff[0] && n > r.melee.range + 0.6
          ? (a *= -0.5)
          : r.standoff &&
            n < r.standoff[1] &&
            n > r.melee.range + 0.6 &&
            (a *= 0.15),
        n > r.melee.range * 0.8 || a < 0)
      ) {
        const i = Math.sin(o),
          h = Math.cos(o),
          c = i + h * s,
          l = h - i * s,
          f = Math.hypot(c, l);
        ((t.x += (c / f) * a * e),
          (t.z += (l / f) * a * e),
          (t.walk += e * Math.abs(a) * (r.crawl ? 3 : 4.2)));
      }
      ((t.faceYaw = o),
        r.shoot &&
          ((t.cd -= e),
          t.cd <= 0 &&
            n > 3 &&
            ((t.state = "spit"), (t.st = 0), sfx.tele([t.x, t.y + 1.5, t.z]))),
        n < r.melee.range + 0.1 &&
          t.atkCd <= 0 &&
          (r.crawl || headPos[1] < t.y + 2.3 * t.s) &&
          ((t.state = "tele"),
          (t.st = 0),
          r.bloat && sfx.tele([t.x, t.y + 1, t.z])));
    } else if (t.state === "spit")
      ((t.faceYaw = o),
        (t.st += e),
        t.st >= r.shoot.tele &&
          (eFire(t, lw(t, 0, 1.55, 0.25), "acid", { flight: 1.3 }),
          sfx.splat(lw(t, 0, 1.5, 0.3)),
          (t.cd = r.shoot.cd * D.cd * rand(0.8, 1.2)),
          (t.state = "move")));
    else if (t.state === "tele") {
      if (
        ((t.faceYaw = o),
        (t.st += e),
        r.bloat && (t.swell = Math.min(1, t.st / r.melee.tele)),
        t.st >= r.melee.tele / (t.rage > 0 ? 1.3 : 1))
      ) {
        if (r.bloat) {
          bloaterPop(t);
          return;
        }
        ((t.state = "swipe"),
          (t.st = 0),
          hdist(t) < r.melee.reach && (r.crawl || headPos[1] < t.y + 2.4 * t.s)
            ? (hurtPlayer(1),
              sfx.zbite([headPos[0], headPos[1] - 0.3, headPos[2]]))
            : sfx.whoosh([t.x, t.y + 1.2, t.z]));
      }
    } else
      t.state === "swipe" &&
        ((t.st += e),
        t.st > 0.45 && ((t.state = "move"), (t.st = 0), (t.atkCd = 0.7)));
    if (((t.y = groundAt(t.x, t.z)), !r.crawl && !r.bloat)) {
      const a =
          t.state === "tele"
            ? Math.min(1, t.st / 0.25)
            : t.state === "swipe"
              ? 1 - Math.min(1, t.st / 0.4)
              : 0,
        s = (t.hunch = (r.speed > 2 ? 0.32 : 0.14) + a * 0.12),
        i = Math.cos(s),
        h = Math.sin(s);
      t.hbList = [
        [0, 1.12 * i, 1.12 * h, 0.3, 1],
        [0, 1.6 * i, 1.6 * h + 0.04, 0.17, 2],
        [0, 0.45, 0, 0.24, 1],
      ];
    }
  },
  brute(t, e) {
    const r = t.T,
      o = toHead(t),
      n = hdist(t);
    if (
      ((t.groanT = (t.groanT ?? 2) - e),
      t.groanT <= 0 &&
        ((t.groanT = rand(2.5, 5)), sfx.groan([t.x, t.y + 2.4, t.z])),
      t.state === "spawn")
    ) {
      t.st += e;
      const s = Math.min(1, t.st / 1.8);
      ((t.y = groundAt(t.x, t.z) - (1 - s) * (1 - s) * 3),
        (t.faceYaw = o),
        s >= 1 && ((t.state = "move"), (t.st = 0)));
      return;
    }
    if (((t.faceYaw = o), t.state === "move")) {
      const s = zSpeed(t) * (n < 5 ? 1.4 : 1);
      (n > 1.6 &&
        ((t.x += Math.sin(o) * s * e),
        (t.z += Math.cos(o) * s * e),
        (t.walk += e * s * 3)),
        n < 2.3 &&
          ((t.state = "tele"), (t.st = 0), sfx.tele([t.x, t.y + 2.5, t.z])));
    } else if (t.state === "tele") {
      if (((t.st += e), t.st >= 0.95)) {
        ((t.state = "slam"), (t.st = 0));
        const s = lw(t, 0, 0.05, 0.9);
        (sfx.slam(s),
          shocks.push({
            p: [s[0], 0.1, s[2]],
            t: 0,
            r: 2.4,
            col: [1, 0.7, 0.4],
          }),
          puff(s, 14, [0.32, 0.28, 0.24], 0.5, 2.5),
          hapticAll(0.6, 120),
          hdist(t) < 2.5 && hurtPlayer(1));
      }
    } else
      t.state === "slam" &&
        ((t.st += e), t.st > 1.1 && ((t.state = "move"), (t.st = 0)));
    t.y = groundAt(t.x, t.z);
    const a = t.state === "tele" || t.state === "slam";
    ((t.hbList = [
      [0, 1.15, 0, 0.36, 1],
      [0, 1.66, 0.04, 0.17, 2],
      [0, 0.42, 0, 0.26, 1],
    ]),
      a || t.hbList.unshift([0, 1, 0.42, 0.42, 0, "shield"]));
  },
  witch(t, e) {
    const r = t.T;
    if (t.state === "spawn") {
      ((t.st += e),
        (t.alpha = Math.min(1, t.st / 1.2)),
        (t.y = lerp(t.y, t.alt, Math.min(1, e * 2))),
        t.st > 1.2 && ((t.state = "fly"), (t.st = 0)),
        (t.faceYaw = toHead(t)));
      return;
    }
    t.ang += t.w * D.speed * e * 0.6;
    const [o, n] = arenaPoint(t.ang, t.orbR),
      a = Math.min(1, e * 1.4);
    if (
      ((t.x = lerp(t.x, o, a)),
      (t.z = lerp(t.z, n, a)),
      (t.y = lerp(t.y, t.alt + Math.sin(t.age * 1.4) * 0.35, a)),
      (t.faceYaw = toHead(t)),
      (t.cd -= e),
      (t.summonT -= e),
      t.state === "fly" && t.cd <= 0)
    )
      ((t.state = "tele"), (t.st = 0), sfx.tele([t.x, t.y + 1.5, t.z]));
    else if (t.state === "tele" && ((t.st += e), t.st > 0.7)) {
      for (const s of [-0.12, 0.12])
        eFire(t, lw(t, 0.35, 1, 0.3), "orb", { yawOff: s, speed: 4.6 });
      ((t.state = "fly"), (t.cd = 3.2 * D.cd));
    }
    if (t.summonT <= 0) {
      if (
        ((t.summonT = 11),
        sfx.scream([t.x, t.y + 1.5, t.z]),
        (t.screamT = 1),
        Math.random() < 0.5)
      ) {
        graveHands(headPos, 4);
        return;
      }
      for (const s of enemies)
        s.T.undead && !s.T.boss && s !== t && (s.rage = 5);
      for (let s = 0; s < 2; s++)
        if (enemies.length < 14) {
          const i =
            Math.atan2(headPos[0] - ROOM.cx, -(headPos[2] - ROOM.cz)) +
            rand(-1.2, 1.2);
          spawnZombie("crawler", arenaPoint(i, ROOM.r + rand(3, 5)));
        }
    }
    t.screamT > 0 && (t.screamT -= e);
  },
  titan(t, e) {
    const r = t.T,
      o = toHead(t),
      n = hdist(t);
    if (t.state === "spawn") {
      t.st += e;
      const a = Math.min(1, t.st / 3.2);
      ((t.y = groundAt(t.x, t.z) - (1 - a) * 6),
        (t.faceYaw = o),
        Math.random() < e * 14 &&
          puff(
            [t.x + rand(-2, 2), 0.3, t.z + rand(-2, 2)],
            2,
            [0.32, 0.28, 0.24],
            0.7,
            1.6,
          ),
        a >= 1 && ((t.state = "move"), (t.st = 0), (t.cd = 2)));
      return;
    }
    if (((t.faceYaw = o), (t.cd -= e), (t.summonT -= e), t.state === "move")) {
      if (n > 7.5) {
        const a = 0.7 * D.speed;
        ((t.x += Math.sin(o) * a * e),
          (t.z += Math.cos(o) * a * e),
          (t.walk += e * a * 2.4));
      }
      t.cd <= 0 &&
        ((t.atk = (t.atk || 0) + 1),
        (t.atkKind = t.atk % 3 === 0 ? "throw" : "slam"),
        (t.state = "tele"),
        (t.st = 0),
        sfx.tele([t.x, t.y + 4, t.z]));
    } else if (t.state === "tele") {
      if (((t.st += e), t.st >= 1.1)) {
        if (t.atkKind === "slam") {
          const a = lw(t, 0, 0.05, 0.9),
            s = [headPos[0], headPos[2]];
          (sfx.slam(a),
            shocks.push({
              p: [a[0], 0.15, a[2]],
              t: 0,
              r: 3.5,
              col: [1, 0.5, 0.3],
            }),
            puff(a, 20, [0.32, 0.28, 0.24], 0.8, 3),
            hapticAll(0.8, 200));
          const i = norm([s[0] - a[0], 0, s[1] - a[2]]);
          for (const h of [-0.22, 0, 0.22]) {
            const c = Math.cos(h),
              l = Math.sin(h);
            eshots.push({
              kind: "rift",
              p: [a[0], 0.05, a[2]],
              v: [
                (c * i[0] + l * i[2]) * 7.5 * D.proj,
                0,
                (-l * i[0] + c * i[2]) * 7.5 * D.proj,
              ],
              r: 0.45,
              life: 3.2,
              col: [1, 0.45, 0.2],
              t: 0,
            });
          }
        } else {
          const a = lw(t, 0.55, 2.2, 0.2);
          (eFire(t, a, "lob", { flight: 1.7, stone: !0 }), sfx.throw(a));
        }
        ((t.state = "recover"), (t.st = 0));
      }
    } else
      t.state === "recover" &&
        ((t.st += e), t.st > 1.2 && ((t.state = "move"), (t.cd = 2.6 * D.cd)));
    if (t.summonT <= 0) {
      t.summonT = 14;
      for (let a = 0; a < 3; a++)
        enemies.length < 14 &&
          spawnZombie(
            Math.random() < 0.5 ? "shambler" : "runner",
            arenaPoint(
              Math.atan2(t.x - ROOM.cx, -(t.z - ROOM.cz)) + rand(-0.8, 0.8),
              ROOM.r + rand(6, 9),
            ),
          );
    }
    ((t.y = groundAt(t.x, t.z) + (t.state === "spawn", 0)),
      (t.hbList = [
        [0, 1.25, 0.2, 0.13, 3, "heart"],
        [0, 1.2, 0, 0.45, 1],
        [0, 1.8, 0.05, 0.2, 2],
        [0, 0.45, 0, 0.32, 1],
      ]));
  },
});
function bloaterPop(t) {
  killEnemy(t, !0);
}
ETYPES.bloater.onDeath = (t) => {
  const e = lw(t, 0, 1, 0);
  (puff(e, 12, C.acid, 0.5, 2),
    blast(
      e,
      2.2,
      3,
      { W: { dmg: 3, col: C.zPus }, inst: null, dmg: 3, g: null },
      C.zPus,
    ),
    Math.hypot(headPos[0] - e[0], headPos[2] - e[2]) < 2 &&
      inRun() &&
      hurtPlayer(1));
};
function bruteHit(t, e, r, o) {
  return r && r[5] === "shield"
    ? (flashes.push({ p: o.slice(), t: 0, s: 0.6, c: [1, 0.8, 0.5] }),
      sfx.ehit(o, !0),
      Math.random() < 0.25 &&
        popup("BLOCKED", "#d8d0c4", [o[0], o[1] + 0.4, o[2]], 0.7),
      !0)
    : !1;
}
function titanHit(t, e, r, o) {
  return (r && r[5] === "heart" && (t.heartT = 0.25), !1);
}
function updateRifts(t, e) {
  return (
    (t.t += e),
    (t.p[0] += t.v[0] * e),
    (t.p[2] += t.v[2] * e),
    Math.random() < e * 20 &&
      (puff(t.p, 1, [0.32, 0.28, 0.24], 0.3, 1),
      part(
        "cube",
        t.p,
        [rand(-1, 1), rand(2, 4), rand(-1, 1)],
        [0.08, 0.06, 0.07],
        C.nDirt,
        0.8,
        { grav: 9, bounce: 0.2 },
      )),
    Math.hypot(headPos[0] - t.p[0], headPos[2] - t.p[2]) < t.r
      ? (hurtPlayer(1), !0)
      : !1
  );
}
function zTint(t, e) {
  return t.flash > 0 ? FLASH : e;
}
function drawZombie(t, e) {
  zombieLook(t);
  const r = t.T,
    o = zTint(t, ZSKIN[t.skin]),
    n = zTint(t, ZPANTS[t.pants]),
    a = t.flash > 0 ? 0.7 : 0,
    s = Math.sin(t.walk),
    i = Math.abs(Math.cos(t.walk)) * 0.03,
    h = r.speed > 2,
    c =
      t.state === "tele"
        ? Math.min(1, t.st / 0.25)
        : t.state === "swipe"
          ? 1 - Math.min(1, t.st / 0.4)
          : 0,
    l = t.hunch ?? 0.14,
    f = t.state === "spawn" ? (1 - t.rise) * 0.9 : 0,
    z = pm();
  (mul(
    z,
    e,
    trs(LOC, 0, 0, 0, 0, l + f, Math.sin(t.walk * 0.5) * 0.06, 1, 1, 1),
  ),
    ep(EM[ZT[t.look]], z, 0, i, 0, 0, 0, 0, 1, 1, 1, o, a));
  const d = ep(
      EM[r === ETYPES.spitter ? "zHeadS" : ZH[t.look]],
      z,
      0,
      1.46 + i,
      0.02,
      Math.sin(t.age * 1.3 + t.weave) * 0.25,
      -0.15 - l * 0.5,
      Math.sin(t.age * 0.9) * 0.2,
      1,
      1,
      1,
      o,
      a,
    ),
    m = t.rage > 0 ? [1.6, 0.4, 0.2] : [1.2, 1.5, 0.6];
  ep(EM.zEyes, d, 0, 0, 0, 0, 0, 0, 1, 1, 1, m, 1);
  const M = xf(d, [0, 0.16, 0.14]);
  if (
    (ppush(
      PT.glow,
      M[0],
      M[1],
      M[2],
      0.1 * t.s,
      m[0] * 0.6,
      m[1] * 0.6,
      m[2] * 0.6,
      0.6,
    ),
    r === ETYPES.spitter)
  ) {
    const u = t.state === "spit" ? 1 + t.st * 2 : 1;
    ep(EM.zSacGlow, d, 0, 0, 0, 0, 0, 0, u, u, 1, [1.2, 1.4, 0.6], 1);
    const w = xf(d, [0, -0.06, 0.15]);
    ppush(PT.glow, w[0], w[1], w[2], 0.2 * u, 0.6, 1, 0.3, 0.6);
  }
  (ep(EM.zLeg, e, -0.11, 0.84, 0, 0, s * (h ? 0.9 : 0.45), 0, 1, 1, 1, n, a),
    ep(EM.zLeg, e, 0.11, 0.84, 0, 0, -s * (h ? 0.9 : 0.45), 0, 1, 1, 1, n, a));
  const x =
      -Math.PI / 2 + 0.25 - c * 0.6 + Math.sin(t.age * 2 + t.weave) * 0.12,
    b =
      t.state === "swipe"
        ? Math.sin(Math.min(1, t.st / 0.3) * Math.PI) * 1.3
        : 0;
  (ep(
    EM.zArm,
    z,
    -0.27,
    1.32 + i,
    0,
    0.1 + b * 0.4,
    x + (h ? s * 0.8 : 0) + b,
    0.1,
    1,
    1,
    1,
    o,
    a,
  ),
    ep(
      EM.zArm,
      z,
      0.27,
      1.32 + i,
      0,
      -0.1 - b * 0.4,
      x - (h ? s * 0.8 : 0) + b * 0.6,
      -0.1,
      1,
      1,
      1,
      o,
      a,
    ));
}
function drawCrawler(t, e) {
  zombieLook(t);
  const r = zTint(t, ZSKIN[t.skin]),
    o = t.flash > 0 ? 0.7 : 0,
    n = Math.sin(t.walk),
    a = t.state === "spawn" ? 1 - t.rise : 0,
    s = pm();
  (mul(
    s,
    e,
    trs(LOC, 0, -a * 0.5, 0, 0, -a * 1.2, Math.sin(t.walk) * 0.08, 1, 1, 1),
  ),
    ep(EM.zCrawl, s, 0, 0, 0, 0, 0, 0, 1, 1, 1, r, o));
  const i = ep(
    EM[ZH[t.look]],
    s,
    0,
    0.3,
    0.32,
    0,
    -0.5,
    Math.sin(t.age) * 0.2,
    1,
    1,
    1,
    r,
    o,
  );
  ep(EM.zEyes, i, 0, 0, 0, 0, 0, 0, 1, 1, 1, [1.2, 1.5, 0.6], 1);
  const h = t.state === "tele" ? Math.min(1, t.st / 0.3) : 0;
  (ep(
    EM.zArm,
    s,
    -0.22,
    0.3,
    0.2,
    0.3,
    -Math.PI / 2 - 0.5 + n * 0.6 - h * 0.5,
    0,
    1,
    1,
    1,
    r,
    o,
  ),
    ep(
      EM.zArm,
      s,
      0.22,
      0.3,
      0.2,
      -0.3,
      -Math.PI / 2 - 0.5 - n * 0.6 - h * 0.5,
      0,
      1,
      1,
      1,
      r,
      o,
    ));
}
function drawBloater(t, e) {
  const r = zTint(t, [1, 1, 1]),
    o = t.flash > 0 ? 0.7 : 0,
    n = Math.sin(t.walk),
    a = 1 + (t.swell || 0) * 0.35 + Math.sin(t.age * 3) * 0.02;
  (ep(EM.zBloatBody, e, 0, 1 * (1 - a), 0.04 * (1 - a), 0, 0, 0, a, a, a, r, o),
    ep(
      EM.zPustules,
      e,
      0,
      1 * (1 - a),
      0.04 * (1 - a),
      0,
      0,
      0,
      a,
      a,
      a,
      [1.2 + (t.swell || 0), 1.4, 0.5],
      1,
    ));
  const s = lw(t, 0, 1, 0.1);
  ppush(
    PT.glow,
    s[0],
    s[1],
    s[2],
    0.9 * a,
    0.6,
    1,
    0.25,
    0.3 + (t.swell || 0) * 0.6,
  );
  const i = ep(
    EM.zHeadA,
    e,
    0,
    1.5,
    0.02,
    Math.sin(t.age) * 0.2,
    -0.2,
    0,
    0.9,
    0.9,
    0.9,
    r,
    o,
  );
  (ep(EM.zEyes, i, 0, 0, 0, 0, 0, 0, 1, 1, 1, [1.2, 1.5, 0.6], 1),
    ep(EM.zLeg, e, -0.15, 0.7, 0, 0, n * 0.4, 0, 1.2, 0.83, 1.2, r, o),
    ep(EM.zLeg, e, 0.15, 0.7, 0, 0, -n * 0.4, 0, 1.2, 0.83, 1.2, r, o),
    ep(EM.zArm, e, -0.42, 1.3, 0, 0.3, -1.1 + n * 0.2, 0.3, 1.1, 1, 1.1, r, o),
    ep(
      EM.zArm,
      e,
      0.42,
      1.3,
      0,
      -0.3,
      -1.1 - n * 0.2,
      -0.3,
      1.1,
      1,
      1.1,
      r,
      o,
    ));
}
function drawCoyote(t, e) {
  const r = zTint(t, W1),
    o = t.flash > 0 ? 0.7 : 0,
    n = t.walk * 1.4,
    a =
      t.state === "tele"
        ? Math.min(1, t.st / 0.4)
        : t.state === "strike"
          ? 1 - Math.min(1, t.st / 0.35)
          : 0,
    s = pm();
  (mul(s, e, trs(LOC, 0, a * 0.2, 0, 0, -a * 0.3, 0, 1, 1, 1)),
    ep(EM.dogBody, s, 0, 0, 0, 0, 0, 0, 1, 1, 1, r, o));
  const i = ep(
    EM.dogHead,
    s,
    0,
    0.78,
    0.48,
    0,
    0.1 + Math.sin(t.age * 3) * 0.05 - a * 0.3,
    0,
    1,
    1,
    1,
    r,
    o,
  );
  ep(EM.dogEyes, i, 0, 0, 0, 0, 0, 0, 1, 1, 1, [1.6, 0.5, 0.2], 1);
  const h = xf(i, [0, 0.03, 0.11]);
  ppush(PT.glow, h[0], h[1], h[2], 0.12, 1, 0.4, 0.15, 0.6);
  for (const [c, l, f] of [
    [-0.1, 0.32, 0],
    [0.1, 0.32, Math.PI],
    [-0.1, -0.3, Math.PI],
    [0.1, -0.3, 0],
  ])
    ep(EM.dogLeg, s, c, 0.62, l, 0, Math.sin(n + f) * 0.7, 0, 1, 1, 1, r, o);
}
function drawBrute(t, e) {
  const r = zTint(t, W1),
    o = t.flash > 0 ? 0.7 : 0,
    n = Math.sin(t.walk),
    a = Math.abs(Math.cos(t.walk)) * 0.04,
    s =
      t.state === "tele"
        ? Math.min(1, t.st / 0.5)
        : t.state === "slam"
          ? 1 - Math.min(1, t.st / 0.15)
          : 0;
  ep(EM.bruteTorso, e, 0, a, 0, 0, 0.12 - s * 0.15, 0, 1, 1, 1, r, o);
  const i = ep(
      EM.bruteHead,
      e,
      0,
      1.5 + a,
      0.04,
      Math.sin(t.age) * 0.15,
      -0.1,
      0,
      1,
      1,
      1,
      r,
      o,
    ),
    h = xf(i, [0, 0.14, 0.15]);
  (ppush(PT.glow, h[0], h[1], h[2], 0.15 * t.s, 1, 0.4, 0.2, 0.7),
    ep(EM.zLeg, e, -0.17, 0.84, 0, 0, n * 0.4, 0, 1.5, 1, 1.5, r, o),
    ep(EM.zLeg, e, 0.17, 0.84, 0, 0, -n * 0.4, 0, 1.5, 1, 1.5, r, o));
  const c = -Math.PI * 0.95 * s;
  ep(
    EM.bruteArm,
    e,
    0.45,
    1.38 + a,
    0,
    0,
    -0.3 + c - n * 0.2,
    -0.15,
    1,
    1,
    1,
    r,
    o,
  );
  const l = ep(
    EM.bruteArm,
    e,
    -0.45,
    1.38 + a,
    0,
    0,
    -1.2 + c * 0.9,
    0.15,
    1,
    1,
    1,
    r,
    o,
  );
  s
    ? ep(EM.bruteShield, l, 0, -0.75, 0.15, 0, Math.PI / 2, 0, 1, 1, 1, r, o)
    : ep(EM.bruteShield, e, -0.05, 1, 0.45, 0.05, 0, 0, 1, 1, 1, r, o);
}
function drawWitch(t, e) {
  const r = t.alpha,
    o = zTint(t, W1),
    n = t.flash > 0 ? 0.7 : 0.08,
    a = t.screamT > 0 ? t.screamT : 0;
  ep(
    EM.witchBody,
    e,
    0,
    0,
    0,
    0,
    0.1,
    Math.sin(t.age * 1.3) * 0.05,
    1,
    1,
    1,
    o,
    n,
    r,
  );
  const s = ep(
    EM.witchHead,
    e,
    0,
    1.55,
    0.04,
    Math.sin(t.age * 0.8) * 0.3,
    -0.1 - a * 0.4,
    0,
    1,
    1,
    1,
    o,
    n,
    r,
  );
  ep(EM.witchEyes, s, 0, 0, 0, 0, 0, 0, 1, 1, 1, [0.6, 1.6, 0.8], 1, r);
  const i =
    t.state === "tele"
      ? (-Math.PI / 2) * Math.min(1, t.st / 0.3)
      : -0.5 + Math.sin(t.age * 2) * 0.2;
  ep(EM.witchArm, e, -0.28, 1.32, 0, 0, i - a, 0.4 + a, 1, 1, 1, o, n, r);
  const h = ep(
      EM.witchArm,
      e,
      0.28,
      1.32,
      0,
      0,
      -0.7 + Math.sin(t.age * 1.7) * 0.15,
      -0.3,
      1,
      1,
      1,
      o,
      n,
      r,
    ),
    c = ep(EM.lantern, h, 0, -0.95, 0, 0, 0.7, 0, 1, 1, 1, W1, 0, r);
  ep(EM.lanternGlow, c, 0, 0, 0, 0, 0, 0, 1, 1, 1, [0.4, 1.6, 0.7], 1, r);
  const l = xf(c, [0, 0.11, 0]);
  ppush(PT.glow, l[0], l[1], l[2], 1.4, 0.4, 1, 0.55, 0.7 * r);
}
function drawTitan(t, e) {
  const r = zTint(t, W1),
    o = t.flash > 0 ? 0.6 : 0,
    n = Math.sin(t.walk),
    a = Math.abs(Math.cos(t.walk)) * 0.04,
    s = t.state === "tele" ? Math.min(1, t.st / 0.6) : 0,
    i = t.state === "recover" ? Math.max(0, 1 - t.st / 0.3) : 0,
    h = t.atkKind === "slam",
    c = h ? s : 0,
    l = h ? 0 : s;
  ep(EM.titanTorso, e, 0, a, 0, 0, 0.1 + c * 0.15 - i * 0.25, 0, 1, 1, 1, r, o);
  const f = ep(
    EM.titanHead,
    e,
    0,
    1.72 + a,
    0.06,
    Math.sin(t.age * 0.7) * 0.2,
    -0.1,
    0,
    1,
    1,
    1,
    r,
    o,
  );
  ep(EM.titanEyes, f, 0, 0, 0, 0, 0, 0, 1, 1, 1, [1.8, 0.7, 0.3], 1);
  const z =
    0.8 + 0.4 * Math.max(0, Math.sin(clock * 6)) + (t.heartT > 0 ? 1 : 0);
  t.heartT > 0 && (t.heartT -= 0.016);
  const d = ep(
      EM.titanHeart,
      e,
      0,
      1.25,
      0.25,
      0,
      0,
      0,
      z,
      z,
      z,
      [1.6, 0.5, 0.25],
      1,
    ),
    m = xf(d, [0, 0, 0]);
  (ppush(PT.glow, m[0], m[1], m[2], 0.9 * z, 1, 0.4, 0.2, 0.8),
    ep(EM.titanLeg, e, -0.24, 0.78, 0, 0, n * 0.35, 0, 1, 1, 1, r, o),
    ep(EM.titanLeg, e, 0.24, 0.78, 0, 0, -n * 0.35, 0, 1, 1, 1, r, o));
  const M = -Math.PI * 0.9 * c + i * 0.4;
  ep(
    EM.titanArm,
    e,
    -0.62,
    1.5 + a,
    0,
    0,
    -0.15 + M + n * 0.25,
    0.12,
    1,
    1,
    1,
    r,
    o,
  );
  const x = ep(
    EM.titanArm,
    e,
    0.62,
    1.5 + a,
    0,
    0,
    -0.15 + M - n * 0.25 - l * 2.6,
    -0.12,
    1,
    1,
    1,
    r,
    o,
  );
  !h &&
    t.state === "tele" &&
    ep(EM.tombstone, x, 0, -1.1, 0.1, 0, 0, 0, 0.55, 0.55, 0.55, W1, 0);
}
