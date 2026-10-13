"use strict";
Object.assign(C, {
  nGround: hex("#3a3830"),
  nGrass: hex("#2c3529"),
  nDirt: hex("#4a4136"),
  nPath: hex("#565046"),
  nWood: hex("#4a3a2e"),
  nWoodDk: hex("#2e241d"),
  nWoodLt: hex("#5e4a3a"),
  nRoof: hex("#2a2630"),
  nStone: hex("#6a6670"),
  nStoneDk: hex("#4a4750"),
  nIron: hex("#1e1b22"),
  nTree: hex("#2a2420"),
  nLit: hex("#ffb347"),
  nLitRed: hex("#ff6a3a"),
  nMoss: hex("#3f4a34"),
  nBone: hex("#cfc6b0"),
});
const NIGHT_MOON = norm([-0.38, 0.5, -0.78]),
  NIGHT_BOARD = [0, 3.3, -15.6],
  MAPS = {
    range: {
      fog: FOG,
      glow: FOG_GLOW,
      rim: RIM,
      light: LIGHT,
      sun: SUN_COL,
      sky: SKY_AMB,
      gnd: GND_AMB,
      sunDir: SUN,
      fogRange: [22, 270],
    },
    night: {
      fog: hex("#141a26"),
      glow: hex("#5a6a86"),
      rim: hex("#7f9cc8"),
      light: NIGHT_MOON,
      sun: scale3(hex("#9fb4e0"), 0.55),
      sky: scale3(hex("#5a6aa0"), 0.42),
      gnd: scale3(hex("#4a3e48"), 0.32),
      sunDir: NIGHT_MOON,
      fogRange: [9, 62],
    },
  };
MAPS.mr = {
  fog: [0, 0, 0],
  glow: [0, 0, 0],
  rim: hex("#8a8aa0"),
  light: norm([0.35, 0.8, 0.45]),
  sun: scale3(hex("#fff2e0"), 0.62),
  sky: scale3(hex("#c8ccd8"), 0.55),
  gnd: scale3(hex("#8a7a70"), 0.4),
  sunDir: norm([0.35, 0.8, 0.45]),
  fogRange: [500, 900],
};
const MAP = { cur: "range", fade: 0, next: null, then: null },
  MR = { on: !1, portals: [] };
function portalSpot() {
  if (!MR.on || !MR.portals.length) return null;
  const o = MR.portals[Math.floor(Math.random() * MR.portals.length)];
  return [o[0] + rand(-0.35, 0.35), o[2] + rand(-0.35, 0.35)];
}
function placePortal(o) {
  const t = MR.portals.findIndex(
    (b) => Math.hypot(b[0] - o[0], b[2] - o[2]) < 0.7,
  );
  if (t >= 0) {
    (MR.portals.splice(t, 1), sfx.deny());
    return;
  }
  (MR.portals.length >= 4 && MR.portals.shift(),
    MR.portals.push([o[0], 0.02, o[2]]),
    sfx.vortex(),
    puff([o[0], 0.1, o[2]], 6, [0.6, 0.4, 1], 0.3, 1));
}
let fogCol = FOG;
function applyMapLighting() {
  const o = MR.on ? MAPS.mr : MAPS[MAP.cur];
  for (const t of [LIT, INST]) {
    gl.useProgram(t.p);
    const b = t.u;
    (gl.uniform3fv(b.uLight, o.light),
      gl.uniform3fv(b.uSunCol, o.sun),
      gl.uniform3fv(b.uSkyAmb, o.sky),
      gl.uniform3fv(b.uGndAmb, o.gnd),
      gl.uniform3fv(b.uFogCol, o.fog),
      gl.uniform3fv(b.uGlowCol, o.glow),
      gl.uniform3fv(b.uRimCol, o.rim),
      gl.uniform3fv(b.uSunDir, o.sunDir),
      gl.uniform2f(b.uFogRange, o.fogRange[0], o.fogRange[1]));
  }
  (gl.useProgram(TEX.p),
    gl.uniform3fv(TEX.u.uFogCol, o.fog),
    gl.uniform2f(TEX.u.uFogRange, o.fogRange[0], o.fogRange[1]),
    (fogCol = o.fog));
}
function switchMap(o, t) {
  if (MAP.cur === o && !MAP.next) {
    t && t();
    return;
  }
  ((MAP.next = o), (MAP.then = t || null));
}
function updateMapFade(o) {
  if (MAP.next) {
    if (((MAP.fade = Math.min(1, MAP.fade + o * 2.6)), MAP.fade >= 1)) {
      ((MAP.cur = MAP.next), (MAP.next = null), applyMapLighting());
      const t = MAP.then;
      ((MAP.then = null), t && t());
    }
  } else MAP.fade = Math.max(0, MAP.fade - o * 1.8);
}
const nightGround = (o, t) => {
    const b = Math.hypot(o, t);
    return b < 24
      ? 0
      : groundH(o * 1.3, t * 1.3) * 0.7 * Math.min(1, (b - 24) / 20);
  },
  NIGHT_LAMPS = [],
  NIGHT = {};
(() => {
  const o = new Geo(),
    t = new Geo(),
    b = new Geo(),
    z = new Geo(),
    g = mulberry(66),
    T = (r) =>
      r < 0
        ? hex("#141a26")
        : mix3(
            mix3(hex("#26304a"), hex("#121628"), smooth(0, 0.5, r)),
            hex("#090b16"),
            smooth(0.5, 1.4, r),
          );
  {
    const s = [-0.4, -0.05, 0, 0.05, 0.12, 0.22, 0.36, 0.55, 0.8, 1.1, 1.5707],
      e = (n, x) => [
        Math.cos(n) * Math.sin(x) * 400,
        Math.sin(n) * 400,
        -Math.cos(n) * Math.cos(x) * 400,
      ];
    for (let n = 0; n < s.length - 1; n++)
      for (let x = 0; x < 40; x++) {
        const l = (x / 40) * TAU,
          f = ((x + 1) / 40) * TAU,
          d = s[n],
          i = s[n + 1],
          u = (m) =>
            Math.pow(
              Math.max(
                0,
                Math.cos(m - Math.atan2(NIGHT_MOON[0], -NIGHT_MOON[2])),
              ),
              3,
            ) * 0.3,
          M = (m, W) =>
            mix3(
              T(m),
              hex("#3a4a6a"),
              u(W) * (1 - smooth(0, 0.6, Math.abs(m - 0.5))),
            );
        z.quadV(
          e(d, l),
          e(d, f),
          e(i, f),
          e(i, l),
          M(d, l),
          M(d, f),
          M(i, f),
          M(i, l),
        );
      }
    for (let n = 0; n < 520; n++) {
      const x = g() * TAU,
        l = Math.asin(lerp(Math.sin(0.08), 1, g())),
        f = [
          Math.cos(l) * Math.sin(x),
          Math.sin(l),
          -Math.cos(l) * Math.cos(x),
        ],
        d = scale3(f, 392),
        i = norm(cross(f, [0, 1, 0.001])),
        u = cross(i, f),
        M = lerp(0.35, 1, g()),
        m = lerp(0.4, 1, g()) * smooth(0.05, 0.4, l),
        W = mix3(T(l), g() < 0.2 ? [1, 0.85, 0.7] : [0.85, 0.9, 1], m);
      z.tri(
        [d[0] + i[0] * M, d[1] + i[1] * M, d[2] + i[2] * M],
        [d[0] + u[0] * M, d[1] + u[1] * M, d[2] + u[2] * M],
        [
          d[0] - i[0] * M - u[0] * M,
          d[1] - i[1] * M - u[1] * M,
          d[2] - i[2] * M - u[2] * M,
        ],
        W,
      );
    }
    (disc(z, NIGHT_MOON, 380, 30, hex("#2c3650"), 32),
      disc(z, NIGHT_MOON, 379, 19, hex("#46557a"), 32),
      disc(z, NIGHT_MOON, 378, 13, hex("#eef0e0"), 32));
    const c = norm(cross(NIGHT_MOON, [0, 1, 0])),
      h = cross(c, NIGHT_MOON);
    for (const [n, x, l] of [
      [-3.6, 2.6, 3.2],
      [3.2, 0.8, 2.4],
      [0.4, -4, 2.8],
      [-1.6, -1, 1.6],
      [4.6, -3.2, 1.4],
    ])
      disc(
        z,
        norm([
          NIGHT_MOON[0] * 378 + c[0] * n + h[0] * x,
          NIGHT_MOON[1] * 378 + c[1] * n + h[1] * x,
          NIGHT_MOON[2] * 378 + c[2] * n + h[2] * x,
        ]),
        377,
        l,
        hex("#c8ccc0"),
        14,
      );
    for (const n of [
      { R: 372, h0: 8, h1: 30, s: 2.1, c: "#0e1018" },
      { R: 330, h0: 4, h1: 14, s: 5.3, c: "#0a0c12" },
    ]) {
      const l = (f) =>
        Math.abs(Math.sin(f * 2 + n.s)) * 0.55 +
        Math.abs(Math.sin(f * 5.7 + n.s * 2)) * 0.3 +
        Math.abs(Math.sin(f * 13 + n.s)) * 0.15;
      for (let f = 0; f < 160; f++) {
        const d = (f / 160) * TAU,
          i = ((f + 1) / 160) * TAU,
          u = hex(n.c);
        z.quad(
          polar(d, n.R, -10),
          polar(i, n.R, -10),
          polar(i, n.R, n.h0 + (n.h1 - n.h0) * l(i)),
          polar(d, n.R, n.h0 + (n.h1 - n.h0) * l(d)),
          u,
        );
      }
    }
    for (let n = 0; n < 220; n++) {
      const x = g() * TAU,
        l = lerp(150, 260, g()),
        f = lerp(8, 20, g()),
        d = f * 0.28,
        i = Math.sin(x) * l,
        u = -Math.cos(x) * l,
        M = hex("#080a10"),
        m = Math.atan2(i, u) + Math.PI / 2,
        W = Math.sin(m) * d,
        L = Math.cos(m) * d;
      z.tri([i - W, -2, u - L], [i + W, -2, u + L], [i, f, u], M);
    }
  }
  const D = [
      0, 1, 2, 3.5, 5, 6.5, 8, 9.5, 11, 12.5, 14, 15.5, 17, 19, 21, 24, 28, 34,
      42, 54, 70, 90, 120, 160, 220, 300,
    ],
    I = 72,
    k = (r, a) => {
      const s = Math.hypot(r, a),
        e =
          Math.sin(r * 0.41 + a * 0.27) * 0.5 +
          Math.sin(r * 0.13 - a * 0.37 + 1.1) * 0.5 +
          Math.sin(r * 1.7 + a * 1.3) * 0.15;
      let c = mix3(C.nGround, C.nGrass, 0.5 + e * 0.3);
      return (
        (c = mix3(c, C.nDirt, (1 - smooth(10, 14, s)) * 0.8)),
        Math.abs(r) < 1.6 &&
          (a > 12 || a < -12) &&
          (c = mix3(c, C.nPath, 0.6 * (1 - smooth(1, 1.6, Math.abs(r))))),
        r < -8 && r > -19 && a < -6 && a > -20 && (c = mix3(c, C.nMoss, 0.4)),
        mix3(c, [0, 0, 0], g() * 0.08)
      );
    },
    w = (r, a) => {
      const s = Math.sin(a) * r,
        e = -Math.cos(a) * r;
      return [s, nightGround(s, e), e];
    };
  for (let r = 0; r < D.length - 1; r++)
    for (let a = 0; a < I; a++) {
      const s = (a / I) * TAU,
        e = ((a + 1) / I) * TAU,
        c = w(D[r], s),
        h = w(D[r], e),
        n = w(D[r + 1], e),
        x = w(D[r + 1], s);
      o.quadV(
        c,
        h,
        n,
        x,
        k(c[0], c[2]),
        k(h[0], h[2]),
        k(n[0], n[2]),
        k(x[0], x[2]),
      );
    }
  for (let r = 0; r < 260; r++) {
    const a = g() * TAU,
      s = lerp(12, 40, Math.sqrt(g())),
      e = Math.sin(a) * s,
      c = -Math.cos(a) * s,
      h = lerp(0.15, 0.45, g());
    for (let n = 0; n < 3; n++) {
      const x = g() * TAU;
      o.tri(
        [e + Math.cos(x) * 0.05, 0, c + Math.sin(x) * 0.05],
        [e - Math.cos(x) * 0.05, 0, c - Math.sin(x) * 0.05],
        [e + Math.cos(x + 1) * 0.08, h, c + Math.sin(x + 1) * 0.08],
        mix3(C.nGrass, hex("#55603e"), g() * 0.6),
      );
    }
  }
  const p = (r, a, s, e, c) => {
      NIGHT_LAMPS.push({
        p: [r, a, s],
        s: e,
        c: c ? [1, 0.45, 0.25] : [1, 0.72, 0.35],
        a: 0.55,
        ph: g() * TAU,
      });
      const h = e * 3.2,
        n = 20,
        x = c ? [0.32, 0.12, 0.06] : [0.34, 0.22, 0.09];
      for (let l = 0; l < n; l++) {
        const f = (l / n) * TAU,
          d = ((l + 1) / n) * TAU;
        b.triV(
          [r, 0.03, s],
          [r + Math.cos(f) * h, 0.03, s + Math.sin(f) * h],
          [r + Math.cos(d) * h, 0.03, s + Math.sin(d) * h],
          x,
          [0, 0, 0],
          [0, 0, 0],
        );
      }
    },
    G = (r, a, s, e, c, h, n) =>
      box(o, r, a, s, e, c, h, mix3(n || C.nWood, [0, 0, 0], g() * 0.15));
  {
    for (let n = 0; n < 16; n++)
      G(
        0 - 8 / 2 + ((n + 0.5) * 8) / 16,
        6 / 2,
        -23 + 10 / 2,
        (8 / 16) * 0.96,
        6,
        0.2,
        n % 2 ? C.nWood : C.nWoodLt,
      );
    (G(0, 6 / 2, -23, 0.2, 6, 10, C.nWood),
      box(o, 0 - 8 / 2, 6 / 2, -23, 0.2, 6, 10, C.nWoodDk),
      box(o, 0 + 8 / 2, 6 / 2, -23, 0.2, 6, 10, C.nWoodDk),
      box(o, 0, 6 / 2, -23 - 10 / 2, 8, 6, 0.2, C.nWoodDk));
    for (const n of [-1, 1])
      o.quad(
        [0 + n * (8 / 2 + 0.4), 6 - 0.1, -23 + 10 / 2 + 0.4],
        [0, 6 + 3.4, -23 + 10 / 2 + 0.4],
        [0, 6 + 3.4, -23 - 10 / 2 - 0.4],
        [0 + n * (8 / 2 + 0.4), 6 - 0.1, -23 - 10 / 2 - 0.4],
        C.nRoof,
      );
    (o.tri(
      [0 - 8 / 2, 6, -23 + 10 / 2 + 0.1],
      [0 + 8 / 2, 6, -23 + 10 / 2 + 0.1],
      [0, 6 + 3.3, -23 + 10 / 2 + 0.1],
      C.nWoodLt,
    ),
      box(o, 0, 1.4, -23 + 10 / 2 + 0.12, 1.8, 2.8, 0.08, C.nWoodDk),
      box(t, 0, 1.4, -23 + 10 / 2 + 0.13, 0.08, 2.7, 0.06, C.nLit));
    for (const n of [-1, 1])
      (box(t, 0 + n * 2.6, 3.3, -23 + 10 / 2 + 0.13, 0.9, 1.6, 0.05, C.nLitRed),
        box(o, 0 + n * 2.6, 3.3, -23 + 10 / 2 + 0.16, 0.08, 1.6, 0.04, C.nIron),
        box(
          o,
          0 + n * 2.6,
          3.3,
          -23 + 10 / 2 + 0.16,
          0.9,
          0.08,
          0.04,
          C.nIron,
        ));
    t.add(
      ring(new Geo(), 0, 0.7, 16, C.nLit, 0),
      trs(m4(), 0, 6 + 1.5, -23 + 10 / 2 + 0.14, 0, 0, 0, 1, 1, 1),
    );
    const h = -23 + 10 / 2 - 1.6;
    (box(o, 0, 6 + 3.2, h, 2.6, 6.4, 2.6, C.nWood),
      box(o, 0, 6 + 6.6, h, 3, 0.3, 3, C.nWoodDk));
    for (const n of [-1, 1])
      (box(t, 0 + n * 1.31, 6 + 4.6, h, 0.04, 1.4, 0.7, C.nLit),
        box(t, 0, 6 + 4.6, h + n * 1.31, 0.7, 1.4, 0.04, C.nLit));
    (o.add(
      cyl(new Geo(), 0, 0, 0, 1.6, 0.05, 5, 4, C.nRoof),
      trs(m4(), 0, 6 + 6.7, h, Math.PI / 4, 0, 0, 1, 1, 1),
    ),
      box(o, 0, 6 + 12.5, h, 0.12, 1.6, 0.12, C.nIron),
      box(o, 0, 6 + 12.8, h, 0.8, 0.12, 0.12, C.nIron),
      p(0 - 1.4, 2.3, -23 + 10 / 2 + 0.6, 0.8),
      p(0 + 1.4, 2.3, -23 + 10 / 2 + 0.6, 0.8));
    for (const n of [-1, 1])
      (box(o, 0 + n * 1.4, 2, -23 + 10 / 2 + 0.45, 0.06, 0.5, 0.06, C.nIron),
        box(t, 0 + n * 1.4, 2.3, -23 + 10 / 2 + 0.6, 0.16, 0.22, 0.16, C.nLit));
  }
  {
    for (let n = -18; n <= -8 + 0.01; n += 0.5)
      (box(o, n, 0.55, -19, 0.04, 1.1, 0.04, C.nIron),
        box(o, n, 0.55, -6, 0.04, 1.1, 0.04, C.nIron),
        box(o, n, 1.15, -19, 0.07, 0.12, 0.07, C.nIron));
    for (let n = -19; n <= -6 + 0.01; n += 0.5)
      (Math.abs(n + 12.5) > 1.2 &&
        box(o, -8, 0.55, n, 0.04, 1.1, 0.04, C.nIron),
        box(o, -18, 0.55, n, 0.04, 1.1, 0.04, C.nIron));
    for (const n of [0.25, 0.95])
      (box(o, -26 / 2, n, -19, 10, 0.04, 0.04, C.nIron),
        box(o, -26 / 2, n, -6, 10, 0.04, 0.04, C.nIron),
        box(o, -18, n, -25 / 2, 0.04, 0.04, 13, C.nIron),
        box(o, -8, n, (-25 - 1.2) / 2 - 0.6 + 0.6, 0.04, 0.04, 0.01, C.nIron));
    (box(o, -8, 0.25, (-19 - 13.7) / 2, 0.04, 0.04, -13.7 - -19, C.nIron),
      box(o, -8, 0.95, (-19 - 13.7) / 2, 0.04, 0.04, -13.7 - -19, C.nIron),
      box(o, -8, 0.25, (-6 - 11.3) / 2, 0.04, 0.04, -6 + 11.3, C.nIron),
      box(o, -8, 0.95, (-6 - 11.3) / 2, 0.04, 0.04, -6 + 11.3, C.nIron));
    for (let n = 0; n < 4; n++)
      for (let x = 0; x < 6; x++) {
        const l = -16.8 + x * 1.5 + g() * 0.3,
          f = -19 + 1.6 + n * 3 + g() * 0.4,
          d = (g() - 0.5) * 0.3,
          i = Math.PI / 2 + (g() - 0.5) * 0.4,
          u = g(),
          M = mix3(C.nStone, C.nStoneDk, g());
        if (u < 0.55) {
          const m = lerp(0.7, 1.1, g());
          (o.add(
            box(new Geo(), 0, m / 2, 0, 0.55, m, 0.12, M),
            trs(m4(), l, 0, f, i, 0, d, 1, 1, 1),
          ),
            o.add(
              cyl(new Geo(), 0, 0, 0, 0.275, 0.275, 0.12, 10, M, M),
              trs(m4(), l, m, f, i, Math.PI / 2, d, 1, 1, 1),
            ));
        } else
          u < 0.85
            ? (o.add(
                box(new Geo(), 0, 0.6, 0, 0.1, 1.2, 0.1, M),
                trs(m4(), l, 0, f, i, 0, d, 1, 1, 1),
              ),
              o.add(
                box(new Geo(), 0, 0.85, 0, 0.55, 0.1, 0.1, M),
                trs(m4(), l, 0, f, i, 0, d, 1, 1, 1),
              ))
            : (box(o, l, 0.08, f, 0.7, 0.16, 1.6, C.nDirt),
              o.add(
                box(new Geo(), 0, 0.4, 0, 0.45, 0.8, 0.1, M),
                trs(m4(), l, 0, f - 0.75, i - Math.PI / 2, 0, 0, 1, 1, 1),
              ));
        box(
          o,
          l + 0.5,
          0.02,
          f,
          0.6,
          0.04,
          1.3,
          mix3(C.nDirt, C.nMoss, g() * 0.5),
        );
      }
    const c = -16,
      h = -16;
    (box(o, c, 1.4, h, 3, 2.8, 3.4, C.nStoneDk),
      o.add(
        cyl(new Geo(), 0, 0, 0, 2.3, 0.2, 1.3, 4, C.nStone),
        trs(m4(), c, 2.8, h, Math.PI / 4, 0, 0, 1, 1, 1),
      ));
    for (const n of [-1, 1])
      box(o, c + 1.55, 1.3, h + n * 1.1, 0.25, 2.6, 0.3, C.nStone);
    (box(o, c + 1.52, 1, h, 0.06, 2, 1.2, C.nIron),
      box(t, c + 1.55, 1, h, 0.02, 1.7, 0.08, hex("#7dffb0")),
      p(c + 1.9, 0.5, h, 0.6, !1));
  }
  {
    box(o, 17.5 + 3, 3, -5, 6, 6, 9, C.nWoodDk);
    for (let s = 0; s < 18; s++)
      G(
        17.5,
        3.6,
        -5 - 4.5 + (s + 0.5) * 0.5,
        0.2,
        7.2,
        0.48,
        s % 2 ? C.nWood : C.nWoodLt,
      );
    box(o, 17.5 - 1.4, 2.9, -5, 2.8, 0.12, 9, C.nRoof);
    for (const s of [-4.2, -1.4, 1.4, 4.2])
      box(o, 17.5 - 2.7, 1.45, -5 + s, 0.14, 2.9, 0.14, C.nWoodLt);
    box(o, 17.5 - 1.4, 0.12, -5, 2.8, 0.24, 9, C.nWoodDk);
    for (const s of [-2.6, 2.6])
      (box(t, 17.5 - 0.12, 1.5, -5 + s, 0.04, 1.2, 1.5, C.nLit),
        box(o, 17.5 - 0.14, 1.5, -5 + s, 0.04, 1.2, 0.06, C.nWoodDk),
        box(o, 17.5 - 0.14, 1.5, -5 + s, 0.04, 0.06, 1.5, C.nWoodDk));
    box(o, 17.5 - 0.13, 1.2, -5, 0.06, 2.4, 1.4, C.nWoodDk);
    for (const s of [-1, 1])
      box(o, 17.5 - 0.2, 1.2, -5 + s * 0.36, 0.06, 1, 0.66, C.nWoodLt);
    (box(o, 17.5 - 0.15, 5.6, -5, 0.1, 1.2, 6.5, C.nWoodLt),
      p(17.5 - 2.5, 2.4, -5 - 4.2, 0.8),
      p(17.5 - 2.5, 2.4, -5 + 4.2, 0.8));
    for (const s of [-4.2, 4.2])
      box(t, 17.5 - 2.5, 2.4, -5 + s, 0.18, 0.24, 0.18, C.nLit);
    for (let s = 0; s < 3; s++) {
      const c = 1 + s * 0.7;
      cyl(o, 14.3, 0, c, 0.3, 0.3, 0.9, 10, C.nWood, C.nWoodDk);
    }
  }
  {
    box(o, -21, 2.5, 5, 6, 5, 9, hex("#4a2a24"));
    for (const s of [-1, 1])
      o.quad(
        [-21 + s * 3.3, 4.9, 5 + 4.6],
        [-21, 7.4, 5 + 4.6],
        [-21, 7.4, 5 - 4.6],
        [-21 + s * 3.3, 4.9, 5 - 4.6],
        C.nRoof,
      );
    for (const s of [-1, 1])
      o.tri(
        [-21 + 3.01, 5, 5 + s * 4.5],
        [-21 + 3.01, 5, 5 - s * 4.5],
        [-21 + 3.01, 7.3, 5],
        hex("#3e2420"),
      );
    box(o, -21 + 3.02, 1.8, 5, 0.06, 3.6, 3.2, C.nWoodDk);
    for (const s of [-1, 1])
      strut(
        o,
        [-21 + 3.06, 0.2, 5 + s * 1.5],
        [-21 + 3.06, 3.4, 5 - s * 1.5],
        0.12,
        C.nWoodLt,
      );
    box(t, -21 + 3.03, 5.6, 5, 0.04, 0.8, 0.8, C.nLitRed);
    for (let s = 0; s < 4; s++)
      cyl(
        o,
        -17 + (s % 2) * 0.9,
        (s >> 1) * 0.7,
        10 + (s % 2) * 0.3,
        0.42,
        0.42,
        0.7,
        10,
        C.hayDk,
        C.hay,
      );
  }
  {
    const e = trs(m4(), -12.5, 0, 11, 0.6, 0, 0.12, 1, 1, 1);
    o.add(box(new Geo(), 0, 0.9, 0, 1.6, 0.12, 3.2, C.nWood), e);
    for (const c of [-1, 1])
      o.add(box(new Geo(), c * 0.8, 1.2, 0, 0.08, 0.5, 3.2, C.nWoodLt), e);
    for (const [c, h] of [
      [-0.95, -1.1],
      [0.95, 1.1],
      [-0.95, 1.1],
    ])
      o.add(
        ring(new Geo(), 0.4, 0.5, 14, C.nWoodDk, 0),
        mul(m4(), e, trs(m4(), c, 0.48, h, Math.PI / 2, 0, 0, 1, 1, 1)),
      );
    o.add(
      ring(new Geo(), 0.4, 0.5, 14, C.nWoodDk, 0),
      mul(
        m4(),
        e,
        trs(m4(), 1.4, 0.1, 1.3, Math.PI / 2, Math.PI / 2, 0, 1, 1, 1),
      ),
    );
  }
  {
    for (const [s, e] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ])
      strut(
        o,
        [15 + s * 1.4, 0, 13 + e * 1.4],
        [15 + s * 0.9, 6, 13 + e * 0.9],
        0.14,
        C.nWoodDk,
      );
    (strut(
      o,
      [15 - 1.3, 2, 13 - 1.3],
      [15 + 1.2, 4, 13 + 1.2],
      0.08,
      C.nWoodDk,
    ),
      strut(
        o,
        [15 + 1.3, 2, 13 - 1.3],
        [15 - 1.2, 4, 13 + 1.2],
        0.08,
        C.nWoodDk,
      ),
      cyl(o, 15, 6, 13, 1.8, 1.8, 3, 14, C.nWood, C.nWoodDk),
      o.add(
        cyl(new Geo(), 0, 0, 0, 2, 0.1, 1.4, 14, C.nRoof),
        trs(m4(), 15, 9, 13, 0, 0, 0, 1, 1, 1),
      ));
    for (const s of [6.4, 7.5, 8.6])
      cyl(o, 15, s, 13, 1.84, 1.84, 0.08, 14, C.nIron);
  }
  {
    for (const a of [-1, 1])
      (box(o, a * 2.4, 2.5, 19, 0.35, 5, 0.35, C.nWoodDk),
        box(o, a * 2.4, 0.4, 19, 0.55, 0.8, 0.55, C.nStoneDk));
    box(o, 0, 4.8, 19, 5.6, 0.3, 0.3, C.nWoodDk);
    for (const a of [-1, 1])
      strut(o, [a * 2.4, 4.1, 19], [a * 1.6, 4.8, 19], 0.1, C.nWoodDk);
    box(o, 0, 4, 19 - 0.02, 3.2, 0.9, 0.08, C.nWoodLt);
    for (const a of [-1, 1])
      box(o, a * 1.4, 4.55, 19 - 0.02, 0.04, 0.3, 0.04, C.nIron);
    (p(-2.4, 3.6, 19 - 0.4, 0.7), p(2.4, 3.6, 19 - 0.4, 0.7));
    for (const a of [-1, 1])
      box(t, a * 2.4, 3.6, 19 - 0.4, 0.18, 0.24, 0.18, C.nLit);
    for (let a = 0; a < 20; a++) {
      const s = -20 + a * 0.9;
      Math.abs(s) < 3 || box(o, s, 0.6, 19 + 0.2, 0.1, 1.2, 0.1, C.nWoodDk);
    }
    (box(o, -11.5, 0.9, 19 + 0.2, 17, 0.08, 0.08, C.nWood),
      box(o, -11.5, 0.4, 19 + 0.2, 17, 0.08, 0.08, C.nWood));
  }
  for (let r = 0; r < 8; r++) {
    const a = ((r + 0.5) / 8) * TAU,
      s = 11.5,
      e = Math.sin(a) * s,
      c = -Math.cos(a) * s;
    box(o, e, 1.3, c, 0.12, 2.6, 0.12, C.nWoodDk);
    const h = -Math.sin(a) * 0.35,
      n = Math.cos(a) * 0.35;
    (strut(o, [e, 2.5, c], [e + h, 2.6, c + n], 0.05, C.nIron),
      box(o, e + h, 2.35, c + n, 0.2, 0.06, 0.2, C.nIron),
      box(
        t,
        e + h,
        2.2,
        c + n,
        0.14,
        0.24,
        0.14,
        r % 3 === 1 ? C.nLitRed : C.nLit,
      ),
      p(e + h, 2.2, c + n, 0.9, r % 3 === 1));
  }
  const y = (r, a) =>
      !(
        (r > -19.5 && r < -6.5 && a > -20 && a < -5) ||
        (Math.abs(r) < 6 && a < -16) ||
        (r > 13 && a > -11 && a < 2) ||
        (r < -16 && a > -1 && a < 11) ||
        (r > 11 && a > 9 && a < 17) ||
        Math.abs(a - 19) < 1.5
      ),
    R = (r, a, s, e) => {
      const c = mulberry(e),
        h = trs(m4(), r, 0, a, c() * TAU, 0, (c() - 0.5) * 0.15, 1, 1, 1);
      o.add(
        cyl(
          new Geo(),
          0,
          0,
          0,
          s * 0.06,
          s * 0.025,
          s * 0.65,
          7,
          C.nTree,
          C.nTree,
        ),
        h,
      );
      const n = (x, l, f, d, i) => {
        const u = [x[0] + l[0] * f, x[1] + l[1] * f, x[2] + l[2] * f];
        if ((strut(o, x, u, d, C.nTree), i > 0))
          for (let M = 0; M < 2; M++) {
            const m = norm([
              l[0] + (c() - 0.5) * 1.4,
              l[1] + c() * 0.4,
              l[2] + (c() - 0.5) * 1.4,
            ]);
            n(u, m, f * 0.65, d * 0.6, i - 1);
          }
      };
      for (let x = 0; x < 3; x++) {
        const l = c() * TAU,
          f = s * (0.35 + x * 0.12),
          d = xf(h, [0, f, 0]);
        n(
          d,
          norm([Math.cos(l), 0.5 + c() * 0.5, Math.sin(l)]),
          s * 0.3,
          s * 0.03,
          2,
        );
      }
    };
  for (let r = 0; r < 30; r++) {
    const a = g() * TAU,
      s = lerp(16, 45, g()),
      e = Math.sin(a) * s,
      c = -Math.cos(a) * s;
    y(e, c) && R(e, c, lerp(4, 8, g()), 100 + r);
  }
  for (const [r, a, s, e] of [
    [-6, 13.5, 0.4, 1],
    [8.5, -13, -0.8, 0],
    [12.8, 3.5, 1.4, 1],
  ]) {
    const c = trs(m4(), r, 0, a, s, 0, 0, 1, 1, 1);
    (o.add(box(new Geo(), 0, 0.22, 0, 0.7, 0.44, 2, C.nWoodDk), c),
      o.add(
        box(new Geo(), 0, 0, 0, 0.74, 0.08, 2.04, C.nWood),
        mul(
          m4(),
          c,
          trs(
            m4(),
            e ? 0.55 : 0,
            e ? 0.3 : 0.48,
            0,
            0,
            0,
            e ? 0.6 : 0,
            1,
            1,
            1,
          ),
        ),
      ));
  }
  for (const [r, a] of [
    [9, -12],
    [-13, 9],
    [6, 14],
  ])
    (box(o, r, 0.35, a, 0.7, 0.7, 0.7, C.nWood),
      box(o, r + 0.5, 0.25, a + 0.6, 0.5, 0.5, 0.5, C.nWoodLt));
  {
    const [r, a, s] = NIGHT_BOARD;
    box(o, r, a, s - 0.06, 2.78, 1.48, 0.08, C.nWoodDk);
    for (const e of [-1, 1])
      box(o, e * 1.1, a / 2 - 0.35, s - 0.12, 0.11, a - 0.7, 0.11, C.nWoodDk);
    (p(0, a + 1, s + 0.3, 0.7),
      box(t, 0, a + 0.95, s + 0.3, 0.2, 0.05, 0.12, C.nLit),
      box(o, 0, a + 0.95, s + 0.15, 0.1, 0.1, 0.4, C.nIron));
  }
  ((NIGHT.sky = z.mesh()),
    (NIGHT.world = o.mesh()),
    (NIGHT.glow = t.mesh()),
    (NIGHT.pool = b.mesh()));
})();
const GATE_TEX = canvasTex(512, 144, (o, t, b) => {
    ((o.fillStyle = "#5e4a3a"),
      o.fillRect(0, 0, t, b),
      (o.globalAlpha = 0.18),
      (o.fillStyle = "#1a1410"));
    for (let z = 0; z < 14; z++) o.fillRect(0, z * 11 + 4, t, 2);
    ((o.globalAlpha = 1),
      (o.fillStyle = "#e8dcc0"),
      (o.font = `78px ${FD}`),
      (o.textAlign = "center"),
      (o.textBaseline = "middle"),
      o.fillText("HOLLOW CREEK", t / 2, b / 2 + 4, t - 30));
  }),
  flies = Array.from({ length: 60 }, () => ({
    p: [rand(-16, 16), rand(0.3, 2.2), rand(-16, 16)],
    ph: rand(0, TAU),
    s: rand(0.03, 0.06),
  })),
  bats = Array.from({ length: 7 }, (o, t) => ({
    th: rand(0, TAU),
    w: rand(0.5, 0.9) * (t % 2 ? 1 : -1),
    R: rand(3, 7),
    h: rand(13, 18),
    ph: rand(0, TAU),
  })),
  mist = Array.from({ length: 26 }, () => ({
    a: rand(0, TAU),
    r: rand(9, 22),
    y: rand(0.2, 0.9),
    s: rand(2.2, 4),
    w: rand(0.01, 0.03) * (Math.random() < 0.5 ? -1 : 1),
    ph: rand(0, TAU),
  }));
function updateNight(o) {
  for (const t of flies)
    ((t.p[0] += Math.sin(clock * 0.6 + t.ph) * 0.3 * o),
      (t.p[1] += Math.sin(clock * 0.9 + t.ph * 2) * 0.12 * o),
      (t.p[2] += Math.cos(clock * 0.5 + t.ph) * 0.3 * o));
  for (const t of bats) t.th += t.w * o;
  for (const t of mist) t.a += t.w * o;
}
function buildNightFrame() {
  for (const t of NIGHT_LAMPS) {
    const b =
      0.85 +
      0.1 * Math.sin(clock * 11 + t.ph) +
      0.05 * Math.sin(clock * 23 + t.ph * 2);
    ppush(
      PT.glow,
      t.p[0],
      t.p[1],
      t.p[2],
      t.s * b,
      t.c[0],
      t.c[1],
      t.c[2],
      t.a * b,
    );
  }
  const o = scale3(NIGHT_MOON, 370);
  ppush(
    PT.glow,
    o[0] + headPos[0],
    o[1] + headPos[1],
    o[2] + headPos[2],
    130,
    0.75,
    0.85,
    1,
    0.22,
  );
  for (const t of flies) {
    const b = 0.5 + 0.5 * Math.sin(clock * 2.3 + t.ph * 5);
    b > 0.3 &&
      ppush(PT.glow, t.p[0], t.p[1], t.p[2], t.s * 2, 0.75, 1, 0.35, b * 0.8);
  }
  for (const t of mist)
    ppush(
      PT.smoke,
      Math.sin(t.a) * t.r,
      t.y + Math.sin(clock * 0.3 + t.ph) * 0.1,
      -Math.cos(t.a) * t.r,
      t.s,
      0.55,
      0.62,
      0.72,
      0.16,
    );
}
function renderNight(o) {
  (gl.disable(gl.DEPTH_TEST),
    gl.depthMask(!1),
    gl.useProgram(LIT.p),
    draw(NIGHT.sky, trs(MM, o[0], o[1], o[2], 0, 0, 0, 1, 1, 1), W1, 1, 1, 0),
    gl.enable(gl.DEPTH_TEST),
    gl.depthMask(!0),
    draw(NIGHT.world, IDENT, W1, 0),
    draw(NIGHT.glow, IDENT, [1, 0.95, 0.9], 1, 1, 0.15));
  for (const t of bats) {
    const b = Math.cos(t.th) * t.R,
      z = -21.4 + Math.sin(t.th) * t.R,
      g = -Math.sin(t.th) * t.w,
      T = Math.cos(t.th) * t.w,
      D = Math.sin(clock * 14 + t.ph);
    draw(
      MESH.bird,
      trs(
        MM,
        b,
        t.h + Math.sin(clock * 0.8 + t.ph),
        z,
        Math.atan2(g, T),
        0,
        -Math.sign(t.w) * 0.4,
        0.55,
        0.55 * D,
        0.55,
      ),
      [0.4, 0.35, 0.45],
      0,
      1,
      0.5,
    );
  }
  (gl.useProgram(TEX.p),
    gl.activeTexture(gl.TEXTURE0),
    drawT(
      MESH.quad,
      GATE_TEX.tex,
      trs(MM, 0, 4, 18.94, Math.PI, 0, 0, 3.1, 0.87, 1),
      [0.8, 0.75, 0.7],
      1,
      0,
      0.5,
      0,
    ),
    drawT(
      MESH.quad,
      board.tex,
      trs(
        MM,
        NIGHT_BOARD[0],
        NIGHT_BOARD[1],
        NIGHT_BOARD[2],
        0,
        0,
        0,
        board.w,
        board.h,
        1,
      ),
      [0.85, 0.85, 0.9],
      1,
      0,
      0.15,
      0,
    ));
}
function renderNightPools() {
  (gl.useProgram(LIT.p),
    gl.enable(gl.BLEND),
    gl.blendFunc(gl.ONE, gl.ONE),
    gl.depthMask(!1),
    gl.enable(gl.POLYGON_OFFSET_FILL),
    gl.polygonOffset(-1, -3),
    draw(NIGHT.pool, IDENT, [1, 1, 1], 1, 1, 0.4),
    gl.disable(gl.POLYGON_OFFSET_FILL),
    gl.depthMask(!0),
    gl.disable(gl.BLEND));
}
