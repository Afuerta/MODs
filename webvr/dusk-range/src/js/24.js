"use strict";
const EM = {};
(() => {
  const a = mulberry(101);
  {
    const e = new Geo();
    (box(e, 0, 1.12, 0, 0.46, 0.5, 0.3, C.botPlate),
      box(e, 0, 1.2, 0.155, 0.36, 0.28, 0.02, C.botDark));
    for (const r of [-1, 1])
      (box(e, r * 0.12, 1.28, 0.168, 0.04, 0.04, 0.01, C.botRust),
        box(e, r * 0.12, 1.1, 0.168, 0.04, 0.04, 0.01, C.botRust));
    (box(e, 0, 0.86, 0, 0.48, 0.09, 0.33, C.botDark),
      box(e, 0, 0.86, 0.17, 0.09, 0.07, 0.012, C.brass),
      box(e, 0, 0.73, 0, 0.36, 0.2, 0.26, C.botPlate),
      box(e, 0, 1.4, 0.04, 0.3, 0.09, 0.22, C.bandana),
      box(e, 0, 1.44, 0, 0.12, 0.08, 0.12, C.botDark));
    for (const r of [-1, 1])
      box(e, r * 0.3, 1.31, 0, 0.17, 0.12, 0.3, C.botRust);
    box(e, -0.27, 0.78, 0.04, 0.07, 0.22, 0.12, C.hat);
    for (let r = 0; r < 5; r++)
      box(e, -0.2 + r * 0.1, 0.92, 0.17, 0.025, 0.05, 0.012, C.brass);
    EM.gsTorso = e.mesh();
    const s = new Geo();
    (box(s, 0, 0.13, 0, 0.3, 0.24, 0.28, C.botPlate),
      box(s, 0, 0.04, 0.12, 0.22, 0.06, 0.06, C.botDark));
    for (let r = 0; r < 4; r++)
      box(s, -0.075 + r * 0.05, 0.04, 0.152, 0.018, 0.04, 0.01, C.botPlate);
    (cyl(s, 0, 0.255, 0, 0.29, 0.27, 0.025, 16, C.hat, C.hat),
      cyl(s, 0, 0.28, 0, 0.14, 0.12, 0.13, 12, C.hat, C.hat),
      cyl(s, 0, 0.28, 0, 0.145, 0.145, 0.03, 12, C.bandana));
    for (const r of [-1, 1])
      box(s, r * 0.16, 0.12, 0, 0.03, 0.08, 0.08, C.botRust);
    ((EM.gsHead = s.mesh()),
      (EM.gsVisor = box(
        new Geo(),
        0,
        0.15,
        0.143,
        0.24,
        0.045,
        0.012,
        C.white1,
      ).mesh()));
    const t = new Geo();
    (box(t, 0, -0.2, 0, 0.13, 0.4, 0.14, C.botPlate),
      box(t, 0, -0.42, 0, 0.1, 0.06, 0.1, C.botDark),
      box(t, 0, -0.62, 0, 0.12, 0.36, 0.13, C.botPlate),
      box(t, 0, -0.81, 0.05, 0.16, 0.07, 0.25, C.hat),
      (EM.gsLeg = t.mesh()));
    const o = new Geo();
    (box(o, 0, -0.19, 0, 0.11, 0.38, 0.11, C.botPlate),
      box(o, 0, -0.42, 0, 0.1, 0.1, 0.1, C.botDark),
      (EM.gsArm = o.mesh()));
    const n = new Geo();
    (box(n, 0, -0.19, 0, 0.11, 0.38, 0.11, C.botPlate),
      box(n, 0, -0.42, 0, 0.1, 0.1, 0.1, C.botDark),
      box(n, 0, -0.5, 0.05, 0.06, 0.08, 0.12, C.gunDk),
      box(n, 0, -0.58, 0, 0.05, 0.16, 0.06, C.gunDk),
      box(n, 0, -0.62, 0, 0.03, 0.1, 0.03, C.metal),
      (EM.gsGunArm = n.mesh()));
    const c = new Geo();
    for (let r = 0; r < 5; r++) {
      const h = (r / 5) * TAU,
        l = h + TAU / 10,
        w = h - TAU / 10;
      (c.tri(
        [0, 0, 0],
        [Math.sin(w) * 0.045, Math.cos(w) * 0.045, 0],
        [Math.sin(h) * 0.11, Math.cos(h) * 0.11, 0],
        C.badge,
      ),
        c.tri(
          [0, 0, 0],
          [Math.sin(h) * 0.11, Math.cos(h) * 0.11, 0],
          [Math.sin(l) * 0.045, Math.cos(l) * 0.045, 0],
          C.badge,
        ));
    }
    EM.badge = c.mesh();
    const b = new Geo();
    (box(b, 0, 0, 0, 0.16, 0.14, 0.22, C.botDark),
      b.add(
        cyl(new Geo(), 0, 0, 0, 0.045, 0.045, 0.3, 10, C.metal, C.metal),
        trs(m4(), 0, 0, 0.08, 0, Math.PI / 2, 0, 1, 1, 1),
      ),
      box(b, 0, 0.08, -0.04, 0.1, 0.03, 0.12, C.botRust),
      (EM.cannon = b.mesh()),
      (EM.cannonGlow = cyl(
        new Geo(),
        0,
        0,
        0,
        0.03,
        0.03,
        0.01,
        10,
        C.white1,
        C.white1,
      ).mesh()));
  }
  {
    const e = new Geo();
    (cyl(e, 0, 0.42, 0, 0.29, 0.34, 0.36, 14, C.barrel),
      cyl(e, 0, 0.78, 0, 0.34, 0.29, 0.36, 14, C.barrel, C.botDark));
    for (const n of [0.5, 0.78, 1.05])
      cyl(
        e,
        0,
        n,
        0,
        n === 0.78 ? 0.345 : 0.315,
        n === 0.78 ? 0.345 : 0.315,
        0.04,
        14,
        C.band,
      );
    strut(e, [-0.3, 1, 0.22], [0.3, 0.55, 0.24], 0.05, C.hat);
    for (let n = 0; n < 4; n++) {
      const c = 0.2 + n * 0.2;
      box(
        e,
        lerp(-0.3, 0.3, c),
        lerp(1, 0.55, c),
        0.27,
        0.04,
        0.12,
        0.03,
        C.dyn,
      );
    }
    (box(e, 0, 1.24, 0, 0.26, 0.2, 0.24, C.botPlate),
      box(e, 0, 1.18, 0.11, 0.18, 0.05, 0.04, C.botDark),
      e.add(
        ico(new Geo(), 0, 0, 0, 0.17, 0.11, 0.16, C.helmet, a, 0, 0.05),
        trs(m4(), 0, 1.34, 0, 0, 0, 0, 1, 1, 1),
      ),
      cyl(e, 0, 1.33, 0, 0.19, 0.19, 0.02, 14, C.helmet),
      (EM.dynBody = e.mesh()));
    const s = new Geo();
    for (const n of [-1, 1])
      s.add(
        cyl(new Geo(), 0, 0, 0, 0.035, 0.035, 0.02, 10, C.white1, C.white1),
        trs(m4(), n * 0.06, 1.26, 0.122, 0, Math.PI / 2, 0, 1, 1, 1),
      );
    (box(s, 0, 1.37, 0.15, 0.05, 0.04, 0.02, C.white1),
      (EM.dynEyes = s.mesh()));
    const t = new Geo();
    (box(t, 0, -0.17, 0, 0.13, 0.34, 0.14, C.botPlate),
      box(t, 0, -0.36, 0.05, 0.16, 0.07, 0.24, C.hat),
      (EM.dynLeg = t.mesh()));
    const o = new Geo();
    (cyl(o, 0, -0.08, 0, 0.026, 0.026, 0.16, 8, C.dyn, C.dyn),
      strut(o, [0, 0.08, 0], [0.02, 0.12, 0], 0.006, C.hat),
      (EM.dynStick = o.mesh()));
  }
  {
    const e = new Geo();
    (cyl(e, 0, -0.07, 0, 0.18, 0.62, 0.08, 22, C.hullDk, C.hullDk),
      cyl(e, 0, 0.01, 0, 0.64, 0.64, 0.025, 22, C.hullDk),
      cyl(e, 0, 0.035, 0, 0.62, 0.28, 0.09, 22, C.hull));
    for (let t = 0; t < 3; t++) {
      const o = (t / 3) * TAU;
      box(
        e,
        Math.sin(o) * 0.45,
        -0.1,
        Math.cos(o) * 0.45,
        0.04,
        0.12,
        0.04,
        C.hullDk,
      );
    }
    ((EM.saucer = e.mesh()),
      (EM.dome = ico(
        new Geo(),
        0,
        0.14,
        0,
        0.27,
        0.2,
        0.27,
        C.white1,
        a,
        0,
        0.04,
      ).mesh()));
    const s = new Geo();
    for (let t = 0; t < 10; t++) {
      const o = (t / 10) * TAU;
      box(
        s,
        Math.sin(o) * 0.63,
        0.015,
        Math.cos(o) * 0.63,
        0.05,
        0.03,
        0.05,
        C.white1,
      );
    }
    ((EM.saucerLights = s.mesh()),
      (EM.saucerBelly = ring(new Geo(), 0, 0.16, 16, C.white1, 0).mesh()),
      (EM.pod = (() => {
        const t = new Geo();
        return (
          ico(t, 0, 0, 0, 0.12, 0.12, 0.12, C.white1, a, 0.05, 0.05),
          t.mesh()
        );
      })()),
      (EM.podFrame = (() => {
        const t = new Geo();
        return (
          cyl(t, 0, -0.03, 0, 0.14, 0.14, 0.06, 12, C.hullDk, C.hullDk),
          t.mesh()
        );
      })()),
      (EM.bubble = ico(new Geo(), 0, 0, 0, 1, 1, 1, C.white1, a, 0, 0).mesh()));
  }
  {
    const e = new Geo();
    (ico(e, 0, 0, 0, 1, 1, 1, C.blob, mulberry(77), 0.16, 0.12),
      (EM.blobBody = e.mesh()),
      (EM.blobCore = ico(
        new Geo(),
        0,
        0,
        0,
        1,
        1,
        1,
        C.blobCore,
        a,
        0.1,
        0.05,
      ).mesh()));
    const s = new Geo();
    for (const t of [-1, 1])
      (strut(s, [t * 0.1, 0.3, 0.05], [t * 0.16, 0.5, 0.1], 0.035, C.blob),
        ico(s, t * 0.16, 0.52, 0.11, 0.075, 0.075, 0.075, C.eyeW, a, 0, 0.02),
        ico(s, t * 0.16, 0.53, 0.175, 0.032, 0.032, 0.02, C.eyeB, a, 0, 0));
    EM.blobEyes = s.mesh();
  }
  {
    const e = new Geo(),
      s = mulberry(303);
    (ico(e, 0, 0.3, 0.12, 0.3, 0.16, 0.38, C.scorp, s, 0.08, 0.12),
      ico(e, 0, 0.29, 0.46, 0.19, 0.12, 0.17, C.scorpLt, s, 0.08, 0.1));
    for (let o = 0; o < 3; o++)
      ico(
        e,
        0,
        0.32 - o * 0.01,
        -0.2 - o * 0.19,
        0.25 - o * 0.035,
        0.14 - o * 0.01,
        0.13,
        o % 2 ? C.scorpLt : C.scorp,
        s,
        0.06,
        0.12,
      );
    for (let o = 0; o < 4; o++)
      box(e, 0, 0.44 - o * 0.005, 0.25 - o * 0.17, 0.12, 0.02, 0.08, C.scorpLt);
    EM.scorpBody = e.mesh();
    const t = new Geo();
    for (const o of [-1, 1])
      ico(t, o * 0.07, 0.38, 0.58, 0.03, 0.03, 0.03, C.white1, s, 0, 0);
    ((EM.scorpEyes = t.mesh()),
      (EM.scorpSeg = ico(
        new Geo(),
        0,
        0,
        0,
        0.1,
        0.1,
        0.12,
        C.scorp,
        s,
        0.1,
        0.12,
      ).mesh()));
    {
      const o = new Geo();
      (ico(o, 0, 0, 0, 0.08, 0.08, 0.09, C.white1, s, 0.05, 0),
        o.add(
          cyl(new Geo(), 0, 0, 0, 0.035, 0, 0.16, 8, C.white1),
          trs(m4(), 0, 0, 0.05, 0, Math.PI / 2, 0, 1, 1, 1),
        ),
        (EM.scorpSting = o.mesh()));
    }
    {
      const o = new Geo();
      (strut(o, [0, 0, 0], [0.24, 0.14, 0], 0.035, C.scorpLt),
        strut(o, [0.24, 0.14, 0], [0.42, -0.28, 0], 0.028, C.scorp),
        (EM.scorpLeg = o.mesh()));
    }
    {
      const o = new Geo();
      (strut(o, [0, 0, 0], [0.12, 0.02, 0.24], 0.05, C.scorpLt),
        ico(o, 0.14, 0.02, 0.36, 0.08, 0.05, 0.11, C.scorp, s, 0.05, 0.1),
        strut(o, [0.1, 0.02, 0.42], [0.08, 0.02, 0.52], 0.03, C.scorpLt),
        strut(o, [0.18, 0.02, 0.42], [0.2, 0.02, 0.53], 0.03, C.scorpLt),
        (EM.scorpClaw = o.mesh()));
    }
  }
  {
    const e = new Geo(),
      s = mulberry(404);
    (ico(e, 0, 0, 0, 0.17, 0.15, 0.36, C.feather, s, 0.08, 0.12),
      strut(e, [0, 0.04, 0.28], [0, 0.12, 0.43], 0.06, C.neck),
      ico(e, 0, 0.14, 0.47, 0.07, 0.065, 0.08, C.neck, s, 0.05, 0.08),
      e.add(
        cyl(new Geo(), 0, 0, 0, 0.025, 0, 0.09, 6, C.beak),
        trs(m4(), 0, 0.13, 0.53, 0, Math.PI / 2, 0, 1, 1, 1),
      ),
      cyl(e, 0, 0.06, 0.32, 0.075, 0.075, 0.04, 8, C.featherLt));
    for (let o = -2; o <= 2; o++)
      e.tri(
        [0, 0.02, -0.25],
        [o * 0.06 - 0.04, 0, -0.5],
        [o * 0.06 + 0.04, 0, -0.5],
        C.featherLt,
      );
    EM.buzzBody = e.mesh();
    const t = new Geo();
    t.quad(
      [0, 0, 0.12],
      [0.55, 0.02, 0.1],
      [0.55, 0.02, -0.14],
      [0, 0, -0.12],
      C.feather,
    );
    for (let o = 0; o < 5; o++) {
      const n = 0.08 - o * 0.05;
      t.tri(
        [0.5, 0.02, n + 0.03],
        [0.95 - o * 0.05, 0 - o * 0.015, n],
        [0.5, 0.02, n - 0.03],
        o % 2 ? C.featherLt : C.feather,
      );
    }
    EM.buzzWing = t.mesh();
  }
  {
    const e = new Geo();
    strut(e, [0, 0.78, -0.02], [0, 1.42, -0.02], 0.05, C.bone);
    for (let r = 0; r < 4; r++) {
      const h = 1.02 + r * 0.09,
        l = 0.34 - Math.abs(r - 1.5) * 0.04;
      box(e, 0, h, 0.05, l, 0.025, 0.04, C.bone);
      for (const w of [-1, 1])
        box(e, (w * l) / 2, h, -0.01, 0.025, 0.025, 0.12, C.bone);
    }
    (box(e, 0, 0.8, 0, 0.3, 0.1, 0.16, C.boneDk),
      box(e, 0, 1.4, 0, 0.42, 0.045, 0.1, C.bone),
      box(e, 0.1, 0.84, 0.06, 0.2, 0.06, 0.18, C.hat),
      (EM.skTorso = e.mesh()));
    const s = new Geo(),
      t = mulberry(505);
    (ico(s, 0, 0.14, 0, 0.13, 0.14, 0.15, C.bone, t, 0.04, 0.05),
      box(s, 0, 0.02, 0.04, 0.12, 0.05, 0.11, C.boneDk));
    for (const r of [-1, 1])
      box(s, r * 0.05, 0.14, 0.125, 0.06, 0.05, 0.03, C.eyeB);
    (box(s, 0, 0.08, 0.135, 0.03, 0.03, 0.02, C.eyeB),
      cyl(s, 0, 0.24, 0, 0.27, 0.25, 0.022, 16, C.hat, C.hat),
      cyl(s, 0, 0.26, 0, 0.13, 0.11, 0.13, 12, C.hat, C.hat),
      (EM.skHead = s.mesh()));
    const o = new Geo();
    for (const r of [-1, 1])
      box(o, r * 0.05, 0.14, 0.138, 0.03, 0.025, 0.01, C.white1);
    EM.skEyes = o.mesh();
    const n = new Geo();
    (strut(n, [0, 0, 0], [0, -0.4, 0], 0.045, C.bone),
      box(n, 0, -0.41, 0, 0.07, 0.05, 0.07, C.boneDk),
      strut(n, [0, -0.42, 0], [0, -0.8, 0], 0.04, C.bone),
      box(n, 0, -0.81, 0.05, 0.1, 0.05, 0.2, C.hat),
      (EM.skLeg = n.mesh()));
    const c = new Geo();
    (strut(c, [0, 0, 0], [0, -0.42, 0], 0.035, C.bone), (EM.skArm = c.mesh()));
    const b = new Geo();
    (strut(b, [0, 0, 0], [0, -0.42, 0], 0.035, C.bone),
      box(b, 0, -0.5, 0.04, 0.05, 0.08, 0.11, C.wood),
      box(b, 0, -0.6, 0, 0.035, 0.18, 0.035, C.metal),
      (EM.skGunArm = b.mesh()));
  }
  {
    const e = new Geo();
    lathe(
      e,
      [
        [0.46, 0.62],
        [0.4, 0.9],
        [0.35, 1.2],
        [0.31, 1.45],
        [0.27, 1.7],
        [0.18, 1.88],
        [0, 1.96],
      ],
      16,
      C.ghost,
    );
    for (let o = 0; o < 16; o++) {
      const n = (o / 16) * TAU,
        c = ((o + 1) / 16) * TAU,
        b = (n + c) / 2,
        r = 0.46;
      e.tri(
        [Math.cos(n) * r, 0.62, Math.sin(n) * r],
        [Math.cos(b) * r * 1.04, 0.36 + (o % 2) * 0.1, Math.sin(b) * r * 1.04],
        [Math.cos(c) * r, 0.62, Math.sin(c) * r],
        C.ghostDk,
      );
    }
    for (const o of [-1, 1])
      e.add(
        cyl(new Geo(), 0, 0, 0, 0.12, 0.05, 0.42, 8, C.ghost),
        trs(m4(), o * 0.3, 1.38, 0.08, 0, 1.2, o * 0.6, 1, 1, 1),
      );
    EM.ghostBody = e.mesh();
    const s = new Geo(),
      t = mulberry(606);
    for (const o of [-1, 1])
      ico(s, o * 0.095, 1.62, 0.27, 0.06, 0.085, 0.03, C.eyeB, t, 0, 0);
    (ico(s, 0, 1.45, 0.3, 0.07, 0.06, 0.03, C.eyeB, t, 0, 0),
      (EM.ghostFace = s.mesh()));
  }
  {
    const e = mulberry(707),
      s = new Geo();
    ico(s, 0, 0, 0, 0.75, 0.62, 0.75, C.wyrm, e, 0.1, 0.15);
    for (let n = 0; n < 3; n++)
      s.add(
        cyl(new Geo(), 0, 0, 0, 0.12, 0, 0.3, 6, C.wyrmDk),
        trs(m4(), 0, 0.5, -0.3 + n * 0.3, 0, -0.3, 0, 1, 1, 1),
      );
    (ico(s, 0, -0.35, 0, 0.55, 0.3, 0.6, C.wyrmBelly, e, 0.05, 0.08),
      (EM.wyrmSeg = s.mesh()));
    const t = new Geo();
    ico(t, 0, 0, 0, 0.95, 0.78, 1, C.wyrm, e, 0.08, 0.15);
    for (const n of [-1, 1])
      t.add(
        cyl(new Geo(), 0, 0, 0, 0.14, 0, 0.7, 7, C.wyrmBelly),
        trs(m4(), n * 0.4, -0.3, 0.85, n * 0.4, 1.4, 0, 1, 1, 1),
      );
    for (let n = 0; n < 5; n++)
      t.add(
        cyl(new Geo(), 0, 0, 0, 0.16, 0, 0.42, 6, C.wyrmDk),
        trs(m4(), 0, 0.7, -0.4 + n * 0.22, 0, -0.5, 0, 1, 1, 1),
      );
    (ring(t, 0.18, 0.42, 14, C.eyeB, 0.9), (EM.wyrmHead = t.mesh()));
    const o = new Geo();
    for (const n of [-1, 1])
      ico(o, n * 0.42, 0.32, 0.72, 0.11, 0.09, 0.08, C.white1, e, 0, 0);
    EM.wyrmEyes = o.mesh();
  }
  {
    const e = new Geo(),
      s = 0.27;
    box(e, 0, 0, 0, 0.5, 0.5, 0.5, C.crate);
    for (const t of [-1, 1])
      for (const o of [-1, 1])
        box(e, 0, t * 0.23, o * 0.23, 0.54, 0.06, 0.06, C.crateDk);
    for (const t of [-1, 1])
      for (const o of [-1, 1])
        box(e, t * 0.23, 0, o * 0.23, 0.06, 0.54, 0.06, C.crateDk);
    for (const t of [-1, 1])
      for (const o of [-1, 1])
        box(e, t * 0.23, o * 0.23, 0, 0.06, 0.06, 0.54, C.crateDk);
    EM.crate = e.mesh();
  }
  ((EM.chevron = (() => {
    const e = new Geo();
    return (
      e.tri([0, 0, 0.09], [-0.06, 0, -0.03], [0.06, 0, -0.03], C.white1),
      e.mesh()
    );
  })()),
    (EM.bar = box(new Geo(), 0, 0, 0, 1, 1, 1, C.white1).mesh()));
})();
