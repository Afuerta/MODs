"use strict";
const BERMS = [
    { r: 7, h: 0.55 },
    { r: 11, h: 0.75 },
    { r: 15, h: 0.95 },
  ],
  BERM_ARC = 1.43,
  WALL_R = 19.6,
  WALL_ARC = 1.32,
  SIGN_POS = [0, 2.75, -4.4],
  SIGN_UP = 2.75,
  SIGN_DOWN = -2.2,
  BOARD_POS = [0, 4.1, -9.2],
  START_POS = [0, 1.38, -4],
  WM = { x: -24, z: -31, h: 10, yaw: 0.75 };
WM.hub = [
  WM.x + Math.sin(WM.yaw) * 0.55,
  WM.h + 0.45,
  WM.z + Math.cos(WM.yaw) * 0.55,
];
const FLAG_POS = [-4.6, 0, -1.2],
  ROAD_A = [36, 30],
  ROAD_B = [70, -260],
  BULBS = [],
  LAMPS = [],
  groundH = (a, t) => {
    const i = Math.hypot(a, t);
    return i < 26
      ? 0
      : (Math.sin(a * 0.07 + t * 0.03) * 0.6 +
          Math.sin(a * 0.021 - t * 0.05 + 1.3) * 0.4 +
          Math.sin(a * 0.15 + t * 0.11) * 0.15) *
          Math.min(1, (i - 26) / 30) *
          3;
  };
function roadDist(a, t) {
  const i = ROAD_B[0] - ROAD_A[0],
    f = ROAD_B[1] - ROAD_A[1],
    c = Math.hypot(i, f);
  return Math.abs((a - ROAD_A[0]) * f - (t - ROAD_A[1]) * i) / c;
}
function groundCol(a, t) {
  const i = Math.hypot(a, t),
    f = Math.atan2(a, -t),
    c =
      Math.sin(a * 0.35 + t * 0.21) * 0.5 +
      Math.sin(a * 0.13 - t * 0.31 + 1.7) * 0.5 +
      Math.sin((a + t) * 0.9) * 0.15 +
      Math.sin(a * 2.1 - t * 1.7) * 0.08;
  let p = mix3(C.sand, C.earth, 0.2 + c * 0.13);
  const r =
    (1 - smooth(WALL_R - 3, WALL_R, i)) * (1 - smooth(1.22, 1.36, Math.abs(f)));
  ((p = mix3(p, C.sandLt, 0.5 * r)),
    i < 3.2 && (p = mix3(p, C.trample, 0.55 * (1 - i / 3.2))));
  const w = roadDist(a, t);
  return (
    w < 4 &&
      (p = mix3(
        p,
        C.road,
        0.65 * (1 - smooth(2.2, 4, w)) * (0.85 + 0.15 * Math.sin(t * 0.7)),
      )),
    p
  );
}
function skyColor(a) {
  const t = norm(a),
    i = Math.asin(clamp(t[1], -1, 1)),
    f = [
      [-0.4, "#6e4a5c"],
      [-0.02, "#c98673"],
      [0, "#ffb47e"],
      [0.06, "#f7957c"],
      [0.16, "#d6728a"],
      [0.32, "#8b5a9a"],
      [0.6, "#433776"],
      [1, "#211c4a"],
      [1.58, "#141130"],
    ];
  let c = hex(f[0][1]);
  for (let m = 0; m < f.length - 1; m++) {
    const [k, D] = f[m],
      [S, g] = f[m + 1];
    if (i >= k && i <= S) {
      c = mix3(hex(D), hex(g), (i - k) / (S - k));
      break;
    }
    i > S && (c = hex(g));
  }
  const p = norm([t[0], 0, t[2]]),
    r = norm([SUN[0], 0, SUN[2]]),
    w = Math.max(0, -(p[0] * r[0] + p[2] * r[2]));
  ((c = mix3(
    c,
    hex("#e88fa6"),
    smooth(0.02, 0.07, i) * (1 - smooth(0.12, 0.3, i)) * w * 0.45,
  )),
    (c = mix3(
      c,
      hex("#6f6496"),
      (1 - smooth(-0.01, 0.05, i)) * smooth(-0.1, 0, i) * w * 0.35,
    )));
  const G = Math.max(0, t[0] * SUN[0] + t[1] * SUN[1] + t[2] * SUN[2]);
  return (
    (c = mix3(c, hex("#ffc08a"), Math.pow(G, 4) * 0.35)),
    (c = mix3(c, hex("#ffe0a6"), Math.pow(G, 28) * 0.95)),
    c
  );
}
function disc(a, t, i, f, c, p = 24) {
  const r = scale3(t, i),
    w = norm(cross(t, [0, 1, 0])),
    G = cross(w, t);
  for (let m = 0; m < p; m++) {
    const k = (m / p) * TAU,
      D = ((m + 1) / p) * TAU,
      S = (g) => [
        r[0] + (w[0] * Math.cos(g) + G[0] * Math.sin(g)) * f,
        r[1] + (w[1] * Math.cos(g) + G[1] * Math.sin(g)) * f,
        r[2] + (w[2] * Math.cos(g) + G[2] * Math.sin(g)) * f,
      ];
    a.tri(r, S(k), S(D), c);
  }
}
function buildSky() {
  const a = new Geo(),
    t = 400,
    i = 48,
    f = [
      -0.45, -0.1, -0.02, 0, 0.025, 0.06, 0.1, 0.16, 0.24, 0.34, 0.48, 0.66,
      0.9, 1.2, 1.5707,
    ],
    c = (m, k) => [
      Math.cos(m) * Math.sin(k) * t,
      Math.sin(m) * t,
      -Math.cos(m) * Math.cos(k) * t,
    ];
  for (let m = 0; m < f.length - 1; m++)
    for (let k = 0; k < i; k++) {
      const D = (k / i) * TAU,
        S = ((k + 1) / i) * TAU,
        g = c(f[m], D),
        A = c(f[m], S),
        o = c(f[m + 1], S),
        e = c(f[m + 1], D);
      a.quadV(g, A, o, e, skyColor(g), skyColor(A), skyColor(o), skyColor(e));
    }
  (disc(a, SUN, 380, 11, hex("#fff1c9")),
    disc(a, MOON, 380, 5.6, hex("#efe6d6")));
  const p = norm(cross(MOON, [0, 1, 0])),
    r = cross(p, MOON);
  for (const [m, k, D] of [
    [-1.6, 1.2, 1.6],
    [1.4, 0.4, 1.2],
    [0.2, -1.8, 1.4],
    [-0.6, -0.4, 0.8],
  ])
    disc(
      a,
      norm([
        MOON[0] * 380 + p[0] * m + r[0] * k,
        MOON[1] * 380 + p[1] * m + r[1] * k,
        MOON[2] * 380 + p[2] * m + r[2] * k,
      ]),
      379,
      D,
      hex("#d8cdbd"),
      12,
    );
  const w = mulberry(42);
  for (let m = 0; m < 260; m++) {
    const k = w() * TAU,
      D = Math.asin(lerp(Math.sin(0.4), 1, w())),
      S = [Math.cos(D) * Math.sin(k), Math.sin(D), -Math.cos(D) * Math.cos(k)],
      g = scale3(S, 392),
      A = norm(cross(S, [0, 1, 0.001])),
      o = cross(A, S),
      e = lerp(0.45, 1.15, w()),
      s = clamp((D - 0.4) / 0.8, 0, 1) * lerp(0.35, 1, w()),
      n = mix3(skyColor(g), [1, 0.96, 0.9], 0.25 + 0.7 * s);
    a.tri(
      [g[0] + A[0] * e, g[1] + A[1] * e, g[2] + A[2] * e],
      [g[0] + o[0] * e, g[1] + o[1] * e, g[2] + o[2] * e],
      [
        g[0] - A[0] * e - o[0] * e,
        g[1] - A[1] * e - o[1] * e,
        g[2] - A[2] * e - o[2] * e,
      ],
      n,
    );
  }
  const G = [
    { R: 378, h0: 9, h1: 34, seed: 1.3, top: "#9b7598", base: "#e0a08a" },
    { R: 368, h0: 3, h1: 19, seed: 4.1, top: "#6a4f7a", base: "#bf8a88" },
  ];
  for (const m of G) {
    const D = (o) =>
        Math.abs(Math.sin(o * 3 + m.seed)) * 0.5 +
        Math.abs(Math.sin(o * 7.3 + m.seed * 2)) * 0.3 +
        Math.abs(Math.sin(o * 17 + m.seed * 3)) * 0.14 +
        Math.sin(o * 41 + m.seed) * 0.04,
      S = hex(m.top),
      g = hex(m.base),
      A = hex("#e7a08e");
    for (let o = 0; o < 180; o++) {
      const e = (o / 180) * TAU,
        s = ((o + 1) / 180) * TAU,
        n = m.h0 + (m.h1 - m.h0) * D(e),
        l = m.h0 + (m.h1 - m.h0) * D(s),
        h = mix3(S, A, Math.pow(Math.max(0, Math.cos(e - SUN_AZ)), 6) * 0.6),
        d = mix3(S, A, Math.pow(Math.max(0, Math.cos(s - SUN_AZ)), 6) * 0.6);
      a.quadV(
        polar(e, m.R, -10),
        polar(s, m.R, -10),
        polar(s, m.R, l),
        polar(e, m.R, n),
        g,
        g,
        d,
        h,
      );
    }
  }
  return a.mesh();
}
function buildClouds() {
  const a = new TGeo(),
    t = mulberry(19),
    i = 330,
    f = norm([SUN[0], 0, SUN[2]]),
    c = (p, r) => {
      const w = norm(p),
        G = norm([w[0], 0, w[2]]),
        m = Math.asin(w[1]),
        k = Math.pow(Math.max(0, G[0] * f[0] + G[2] * f[2]), 2.5);
      let D = mix3(hex("#8a6a9c"), hex("#ffb488"), k);
      return (
        (D = r
          ? mix3(D, hex("#ff9a7c"), 0.25 + 0.35 * k)
          : mix3(D, hex("#c8a0c0"), 0.15)),
        mix3(D, hex("#4a3a6a"), smooth(0.25, 0.5, m) * 0.6)
      );
    };
  for (let p = 0; p < 28; p++) {
    const r = t() * TAU,
      w = lerp(0.05, 0.44, Math.pow(t(), 1.3)),
      G = lerp(0.25, 0.62, t()),
      m = G * lerp(0.1, 0.2, t()),
      k = Math.floor(t() * 4),
      D = (k % 2) * 0.5,
      S = k >> 1 ? 0 : 0.5,
      g = 4,
      A = (o, e) => [
        Math.cos(e) * Math.sin(o) * i,
        Math.sin(e) * i,
        -Math.cos(e) * Math.cos(o) * i,
      ];
    for (let o = 0; o < g; o++) {
      const e = r - G / 2 + (G * o) / g,
        s = r - G / 2 + (G * (o + 1)) / g,
        n = w - m / 2,
        l = w + m / 2,
        h = A(e, n),
        d = A(s, n),
        x = A(s, l),
        u = A(e, l);
      a.quadV(
        h,
        d,
        x,
        u,
        [D + (0.5 * o) / g, S, D + (0.5 * (o + 1)) / g, S + 0.5],
        c(h, 1),
        c(d, 1),
        c(x, 0),
        c(u, 0),
      );
    }
  }
  return a.mesh();
}
function shadowLong(a, t, i, f, c) {
  const p = SHADOW_DIR,
    r = [p[2], 0, -p[0]],
    w = groundH(t, i) + 0.03,
    G = t - p[0] * f * 0.25,
    m = i - p[2] * f * 0.25;
  a.quad(
    [G - (r[0] * f) / 2, w, m - (r[2] * f) / 2],
    [G + (r[0] * f) / 2, w, m + (r[2] * f) / 2],
    [G + (r[0] * f) / 2 + p[0] * c, w, m + (r[2] * f) / 2 + p[2] * c],
    [G - (r[0] * f) / 2 + p[0] * c, w, m - (r[2] * f) / 2 + p[2] * c],
    UV_LONG,
  );
}
function shadowBlob(a, t, i, f) {
  const c = groundH(t, i) + 0.03,
    p = t + SHADOW_DIR[0] * f * 0.25,
    r = i + SHADOW_DIR[2] * f * 0.25;
  a.quad(
    [p - f / 2, c, r + f / 2],
    [p + f / 2, c, r + f / 2],
    [p + f / 2, c, r - f / 2],
    [p - f / 2, c, r - f / 2],
    UV_BLOB,
  );
}
function stack(a, t, i, f, c, p) {
  let r = f;
  for (const [w, G, m, k] of c)
    (cyl(a, t, r, i, w, G, m, 7, mix3(k, [0, 0, 0], p() * 0.08), k), (r += m));
}
function buildWorld() {
  const a = new Geo(),
    t = new Geo(),
    i = new TGeo(),
    f = new TGeo(),
    c = new Geo(),
    p = new Geo(),
    r = mulberry(7),
    w = [
      0, 0.8, 1.6, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5,
      13.5, 14.5, 15.5, 16.5, 17.5, 18.5, 19.5, 21, 23, 26, 30, 36, 44, 54, 68,
      86, 110, 140, 180, 230, 300, 380,
    ],
    G = 96,
    m = (o, e) => {
      const s = Math.sin(e) * o,
        n = -Math.cos(e) * o;
      return [s, groundH(s, n), n];
    };
  for (let o = 0; o < w.length - 1; o++)
    for (let e = 0; e < G; e++) {
      const s = (e / G) * TAU,
        n = ((e + 1) / G) * TAU,
        l = m(w[o], s),
        h = m(w[o], n),
        d = m(w[o + 1], n),
        x = m(w[o + 1], s),
        u = (M) => mix3(groundCol(M[0], M[2]), C.earth, r() * 0.06);
      a.quadV(l, h, d, x, u(l), u(h), u(d), u(x));
    }
  const k = [
    [-0.55, 150, 38, 26],
    [-0.2, 195, 52, 34],
    [0.3, 165, 30, 20],
    [0.98, 215, 58, 40],
    [1.4, 180, 40, 28],
    [1.9, 200, 45, 30],
    [2.6, 170, 35, 24],
    [3.2, 225, 70, 44],
    [-1.2, 175, 42, 30],
    [-1.9, 205, 55, 36],
    [-2.6, 185, 38, 22],
  ];
  for (const [o, e, s, n] of k) {
    const l = Math.sin(o) * e,
      h = -Math.cos(o) * e,
      d = 12,
      x = Array.from({ length: d }, () => s * lerp(0.78, 1.14, r())),
      u = [
        [-3, 1.4, C.talus],
        [n * 0.28, 1, C.rockDk],
        [n * 0.55, 0.94, C.rock],
        [n * 0.68, 0.9, C.rockBand],
        [n * 0.92, 0.86, C.rock],
        [n, 0.84, C.rockDk],
      ],
      M = (b, y, L) => {
        const U = (b / d) * TAU,
          O = x[b % d] * y;
        return [l + Math.cos(U) * O, L, h + Math.sin(U) * O];
      };
    for (let b = 0; b < u.length - 1; b++)
      for (let y = 0; y < d; y++) {
        const [L, U, O] = u[b],
          [T, P] = u[b + 1];
        a.quad(
          M(y, U, L),
          M(y + 1, U, L),
          M(y + 1, P, T),
          M(y, P, T),
          mix3(O, [0, 0, 0], r() * 0.08),
        );
      }
    for (let b = 0; b < d; b++)
      a.tri([l, n, h], M(b + 1, 0.84, n), M(b, 0.84, n), C.rockTop);
  }
  for (const [o, e, s] of [
    [-0.95, 78, 1.1],
    [-0.4, 96, 1.4],
    [0.12, 88, 0.9],
    [0.82, 74, 1.2],
    [1.6, 70, 1],
    [-1.75, 84, 1.3],
    [2.4, 60, 1.1],
    [-2.7, 72, 0.9],
  ]) {
    const n = Math.sin(o) * e,
      l = -Math.cos(o) * e,
      h = groundH(n, l) - 1;
    stack(
      a,
      n,
      l,
      h,
      [
        [3.2 * s, 2.3 * s, 4.5 * s, C.talus],
        [2.3 * s, 1.4 * s, 3.5 * s, C.rock],
        [1.4 * s, 2 * s, 2.6 * s, C.rockBand],
        [2 * s, 1.1 * s, 2.4 * s, C.rock],
        [1.9 * s, 1.9 * s, 0.9 * s, C.rockDk],
      ],
      r,
    );
  }
  for (const { r: o, h: e } of BERMS) {
    const n = [
      [o - 0.9, 0],
      [o - 0.45, e * 0.8],
      [o - 0.2, e],
      [o + 0.2, e],
      [o + 0.45, e * 0.8],
      [o + 0.9, 0],
    ];
    for (let l = 0; l < 48; l++) {
      const h = lerp(-BERM_ARC, BERM_ARC, l / 48),
        d = lerp(-BERM_ARC, BERM_ARC, (l + 1) / 48);
      for (let x = 0; x < n.length - 1; x++) {
        const u = [C.earth, C.earth, C.earthTop, C.earthBk, C.earthBk],
          M = polar(h, n[x][0], n[x][1]),
          b = polar(d, n[x][0], n[x][1]),
          y = polar(d, n[x + 1][0], n[x + 1][1]),
          L = polar(h, n[x + 1][0], n[x + 1][1]),
          U = (O) => mix3(u[x], groundCol(O[0], O[2]), 0.25 + r() * 0.15);
        a.quadV(M, b, y, L, U(M), U(b), U(y), U(L));
      }
    }
    for (const l of [-1, 1]) {
      const h = l * (BERM_ARC + 0.05),
        d = o - 1.2,
        x = polar(h, d, 0.95),
        u = norm([-x[0], 0, -x[2]]),
        M = norm(cross([0, 1, 0], u)),
        b = 0.46,
        y = 0.25;
      (a.add(
        box(new Geo(), 0, 0.45, 0, 0.07, 0.9, 0.07, C.wood),
        trs(m4(), x[0] - u[0] * 0.04, 0, x[2] - u[2] * 0.04, 0, 0, 0, 1, 1, 1),
      ),
        a.add(
          box(new Geo(), 0, 0, 0, b + 0.04, y + 0.04, 0.03, C.woodDk),
          trs(
            m4(),
            x[0] - u[0] * 0.02,
            0.95,
            x[2] - u[2] * 0.02,
            Math.atan2(u[0], u[2]),
            0,
            0,
            1,
            1,
            1,
          ),
        ));
      const L = [x[0] - (M[0] * b) / 2, 0.95 - y / 2, x[2] - (M[2] * b) / 2],
        U = [x[0] + (M[0] * b) / 2, 0.95 - y / 2, x[2] + (M[2] * b) / 2];
      f.quad(
        L,
        U,
        [U[0], 0.95 + y / 2, U[2]],
        [L[0], 0.95 + y / 2, L[2]],
        labelUV(BERMS.findIndex((O) => O.r === o)),
      );
    }
  }
  const D = [C.tie, C.tieLt, C.tieDk],
    S = 44;
  for (let o = 0; o < 9; o++) {
    const e = (o % 2) * 0.5;
    for (let s = 0; s < S; s++) {
      const n = lerp(-WALL_ARC, WALL_ARC, Math.max(0, s + e - 0.5) / S),
        l = lerp(-WALL_ARC, WALL_ARC, Math.min(S, s + e + 0.5) / S);
      if (l <= n) continue;
      const h = (n + l) / 2,
        d = (l - n) * WALL_R * 0.985,
        x = polar(h, WALL_R, 0.13 + o * 0.26);
      a.add(
        box(
          new Geo(),
          0,
          0,
          0,
          d,
          0.24,
          0.22,
          mix3(D[(s + o) % 3], [0, 0, 0], r() * 0.12),
        ),
        trs(m4(), x[0], x[1], x[2], -h, 0, 0, 1, 1, 1),
      );
    }
  }
  for (let o = 0; o <= 22; o++) {
    const e = lerp(-WALL_ARC, WALL_ARC, o / 22),
      s = polar(e, WALL_R + 0.2, 1.25);
    a.add(
      box(new Geo(), 0, 0, 0, 0.16, 2.6, 0.16, C.woodDk),
      trs(m4(), s[0], s[1], s[2], -e, 0, 0, 1, 1, 1),
    );
  }
  for (let o = 0; o < 4; o++)
    box(
      c,
      0,
      0.95,
      -0.73 - o * 0.08,
      1.5,
      0.05,
      0.074,
      o % 2 ? C.woodLt : mix3(C.woodLt, C.wood, 0.4),
    );
  for (const o of [-0.66, 0.66])
    for (const e of [-0.74, -0.96])
      box(c, o, 0.46, e, 0.07, 0.92, 0.07, C.wood);
  strut(c, [-0.66, 0.35, -0.85], [0.66, 0.35, -0.85], 0.05, C.woodDk);
  for (let o = 0; o < 5; o++)
    icosa(
      c,
      trs(
        m4(),
        -0.68 + o * 0.34,
        0.12,
        -1.13,
        r() * 0.3 - 0.15,
        0,
        0,
        0.19,
        0.12,
        0.14,
      ),
      mix3(C.bag, C.earth, r() * 0.25),
      r,
      0.06,
      0.08,
    );
  for (let o = 0; o < 4; o++)
    icosa(
      c,
      trs(
        m4(),
        -0.51 + o * 0.34,
        0.33,
        -1.13,
        r() * 0.3 - 0.15,
        0,
        0,
        0.18,
        0.11,
        0.13,
      ),
      mix3(C.bag, C.earth, r() * 0.25),
      r,
      0.06,
      0.08,
    );
  {
    box(c, -0.52, 0.975 + 0.012, -0.8, 0.11, 0.024, 0.11, C.metal);
    for (const [n, l] of [
      [-0.045, -0.045],
      [0.045, -0.045],
      [-0.045, 0.045],
      [0.045, 0.045],
    ])
      box(c, -0.52 + n, 0.975 + 0.085, -0.8 + l, 0.012, 0.13, 0.012, C.metal);
    (box(c, -0.52, 0.975 + 0.155, -0.8, 0.11, 0.02, 0.11, C.metal),
      box(c, -0.52, 0.975 + 0.175, -0.8, 0.05, 0.025, 0.05, C.metal),
      strut(
        c,
        [-0.52 - 0.04, 0.975 + 0.18, -0.8],
        [-0.52, 0.975 + 0.24, -0.8],
        0.008,
        C.metal,
      ),
      strut(
        c,
        [-0.52, 0.975 + 0.24, -0.8],
        [-0.52 + 0.04, 0.975 + 0.18, -0.8],
        0.008,
        C.metal,
      ),
      box(p, -0.52, 0.975 + 0.085, -0.8, 0.08, 0.11, 0.08, C.lamp),
      LAMPS.push({
        p: [-0.52, 0.975 + 0.09, -0.8],
        s: 0.6,
        c: [1, 0.68, 0.32],
        a: 0.55,
        flick: 1,
        range: !0,
      }));
  }
  {
    (box(c, 0.42, 0.975 + 0.06, -0.86, 0.27, 0.12, 0.14, C.ammo),
      box(
        c,
        0.42,
        0.975 + 0.125,
        -0.86,
        0.28,
        0.012,
        0.15,
        mix3(C.ammo, [0, 0, 0], 0.25),
      ),
      box(c, 0.42, 0.975 + 0.07, -0.86 + 0.073, 0.05, 0.03, 0.006, C.brass));
    for (let n = 0; n < 5; n++) {
      const l = 0.12 + r() * 0.12,
        h = -0.76 - r() * 0.2;
      c.add(
        cyl(new Geo(), 0, 0, 0, 0.006, 0.006, 0.024, 6, C.brass, C.brass),
        trs(m4(), l, 0.975 + 0.006, h, r() * TAU, Math.PI / 2, 0, 1, 1, 1),
      );
    }
  }
  const g = [
      [-3.7, 1.5],
      [3.7, 1.5],
      [-4.1, -4],
      [4.1, -4],
    ],
    A = 3.4;
  for (const [o, e] of g)
    (box(a, o, A / 2, e, 0.09, A, 0.09, C.woodDk),
      box(a, o, A - 0.1, e, 0.3, 0.05, 0.05, C.woodDk),
      shadowLong(i, o, e, 0.16, A * SHADOW_K));
  for (const [o, e] of [
    [0, 1],
    [0, 2],
    [1, 3],
  ]) {
    const s = [g[o][0], A - 0.08, g[o][1]],
      n = [g[e][0], A - 0.08, g[e][1]],
      l = 0.45;
    wire(a, s, n, l, 16, 0.009, C.wire);
    const h = Math.hypot(n[0] - s[0], n[2] - s[2]),
      d = Math.floor(h / 0.42);
    for (let x = 1; x < d; x++) {
      const u = catPoint(s, n, l, x / d);
      (box(a, u[0], u[1] - 0.03, u[2], 0.016, 0.03, 0.016, C.wire),
        t.add(
          octa(new Geo(), 1, x % 3 ? C.bulb : C.bulb2),
          trs(m4(), u[0], u[1] - 0.075, u[2], 0, 0, 0, 0.026, 0.04, 0.026),
        ),
        BULBS.push([u[0], u[1] - 0.075, u[2]]));
    }
  }
  (cyl(
    a,
    FLAG_POS[0],
    0,
    FLAG_POS[2],
    0.045,
    0.035,
    4.3,
    8,
    C.metalLt,
    C.metalLt,
  ),
    icosa(
      a,
      trs(m4(), FLAG_POS[0], 4.33, FLAG_POS[2], 0, 0, 0, 0.06, 0.06, 0.06),
      C.brass,
      r,
      0,
      0.05,
    ),
    shadowLong(i, FLAG_POS[0], FLAG_POS[2], 0.12, 4.3 * SHADOW_K),
    box(
      a,
      BOARD_POS[0],
      BOARD_POS[1],
      BOARD_POS[2] - 0.06,
      2.78,
      1.48,
      0.08,
      C.frame,
    ),
    box(
      a,
      BOARD_POS[0],
      BOARD_POS[1] + 0.79,
      BOARD_POS[2] - 0.02,
      2.9,
      0.1,
      0.22,
      C.metal,
    ),
    box(
      a,
      -1.1,
      BOARD_POS[1] / 2 - 0.35,
      BOARD_POS[2] - 0.12,
      0.11,
      BOARD_POS[1] - 0.7,
      0.11,
      C.wood,
    ),
    box(
      a,
      1.1,
      BOARD_POS[1] / 2 - 0.35,
      BOARD_POS[2] - 0.12,
      0.11,
      BOARD_POS[1] - 0.7,
      0.11,
      C.wood,
    ));
  for (const o of [-1, 1]) {
    const e = [o * 0.75, BOARD_POS[1] + 0.84, BOARD_POS[2] - 0.02],
      s = [o * 0.75, BOARD_POS[1] + 1.02, BOARD_POS[2] + 0.42];
    (strut(a, e, s, 0.025, C.metal),
      box(a, s[0], s[1], s[2], 0.26, 0.09, 0.16, C.metal),
      box(t, s[0], s[1] - 0.05, s[2], 0.2, 0.012, 0.11, C.lamp),
      LAMPS.push({
        p: [s[0], s[1] - 0.08, s[2]],
        s: 0.9,
        c: [1, 0.86, 0.6],
        a: 0.5,
        flick: 0,
      }));
  }
  shadowLong(i, 0, BOARD_POS[2], 2.5, 4.9 * SHADOW_K * 0.9);
  for (const o of [-1, 1]) {
    const e = o * 1.32,
      s = 14.5,
      n = polar(e, s),
      l = new Geo();
    (box(l, 0, 0.45, 0, 1.6, 0.9, 1.4, C.concrete),
      box(l, 0, 0.95, 0, 1.8, 0.1, 1.6, C.frame),
      box(l, 0, 0.55, 0.71, 0.9, 0.26, 0.02, C.gunDk),
      a.add(
        l,
        trs(m4(), n[0], 0, n[2], Math.atan2(-n[0], -n[2]), 0, 0, 1, 1, 1),
      ),
      shadowLong(i, n[0], n[2], 1.8, 1.4));
  }
  {
    const s = Math.atan2(-6.4, -4),
      n = new Geo(),
      l = new Geo();
    box(n, 0, 1.25, 0, 3.2, 2.5, 2.6, C.plank);
    for (let u = 0; u < 11; u++)
      (box(n, -1.5 + u * 0.3, 1.25, 1.305, 0.025, 2.5, 0.01, C.plankDk),
        box(n, -1.5 + u * 0.3, 1.25, -1.305, 0.025, 2.5, 0.01, C.plankDk));
    for (let u = 0; u < 9; u++)
      (box(n, 1.605, 1.25, -1.2 + u * 0.3, 0.01, 2.5, 0.025, C.plankDk),
        box(n, -1.605, 1.25, -1.2 + u * 0.3, 0.01, 2.5, 0.025, C.plankDk));
    const h = new Geo();
    box(h, 0, 0, 0, 3.7, 0.06, 3.2, C.roof);
    for (let u = 0; u < 13; u++)
      box(
        h,
        -1.8 + u * 0.3,
        0.04,
        0,
        0.04,
        0.03,
        3.2,
        mix3(C.roof, C.rust, r() * 0.6),
      );
    (n.add(h, trs(m4(), 0, 2.72, 0.1, 0, 0.14, 0, 1, 1, 1)),
      box(n, -0.75, 1, 1.32, 0.9, 2, 0.04, hex("#3a2a22")),
      box(n, -0.42, 1, 1.35, 0.06, 0.06, 0.03, C.brass),
      box(n, 0.75, 1.5, 1.31, 0.95, 0.8, 0.05, C.woodDk),
      box(l, 0.75, 1.5, 1.335, 0.8, 0.65, 0.01, C.windowLit),
      box(n, 0.75, 1.5, 1.345, 0.04, 0.65, 0.01, C.woodDk),
      box(n, 0.75, 1.5, 1.345, 0.8, 0.04, 0.01, C.woodDk),
      box(n, -0.75, 2.2, 1.38, 0.16, 0.12, 0.12, C.metal),
      box(l, -0.75, 2.13, 1.4, 0.1, 0.02, 0.08, C.lamp),
      cyl(
        n,
        1.95,
        0,
        1,
        0.3,
        0.3,
        0.9,
        10,
        C.rust,
        mix3(C.rust, [0, 0, 0], 0.3),
      ));
    const d = trs(m4(), 6.4, 0, 4, s, 0, 0, 1, 1, 1);
    (a.add(n, d),
      t.add(l, d),
      LAMPS.push({
        p: xf(d, [-0.75, 2.08, 1.45]),
        s: 1.1,
        c: [1, 0.78, 0.45],
        a: 0.45,
        flick: 0,
      }),
      LAMPS.push({
        p: xf(d, [0.75, 1.5, 1.45]),
        s: 1.4,
        c: [1, 0.7, 0.35],
        a: 0.25,
        flick: 0,
      }));
    const x = xf(d, [0, 0, 0]);
    shadowLong(i, x[0], x[2], 3.4, 2.6 * SHADOW_K);
  }
  for (const [o, e, s] of [
    [9.5, 1.5, 0.4],
    [10.6, 2.4, 1.2],
    [-8.5, 4.5, 2.1],
    [-21, -14, 0.3],
    [22, -12, 1],
  ]) {
    const n = new Geo();
    (cyl(n, 0, -0.65, 0, 0.62, 0.62, 1.3, 12, C.hay, C.hayDk),
      a.add(n, trs(m4(), o, 0.62, e, s, 0, Math.PI / 2, 1, 1, 1)),
      shadowBlob(i, o, e, 2));
  }
  {
    let s = null;
    for (let n = 0; n <= 16; n++) {
      const l = Math.PI - 1.25 + (2.5 * n) / 16,
        h = polar(l, 7.5);
      (box(a, h[0], 0.55, h[2], 0.1, 1.1, 0.1, C.woodDk),
        s &&
          (strut(a, [s[0], 0.45, s[2]], [h[0], 0.45, h[2]], 0.06, C.wood),
          strut(a, [s[0], 0.9, s[2]], [h[0], 0.9, h[2]], 0.06, C.wood)),
        (s = h));
    }
  }
  {
    const { x: o, z: e, h: s } = WM,
      n = [
        [-1.3, -1.3],
        [1.3, -1.3],
        [1.3, 1.3],
        [-1.3, 1.3],
      ],
      l = 0.32,
      h = (M, b) => [
        o + n[M][0] * lerp(1, l / 1.3, b),
        s * b,
        e + n[M][1] * lerp(1, l / 1.3, b),
      ];
    for (let M = 0; M < 4; M++) strut(a, h(M, 0), h(M, 1), 0.09, C.metalLt);
    for (const M of [0.3, 0.6, 0.9])
      for (let b = 0; b < 4; b++)
        strut(a, h(b, M), h((b + 1) % 4, M), 0.05, C.metalLt);
    for (const [M, b] of [
      [0, 0.3],
      [0.3, 0.6],
      [0.6, 0.9],
    ])
      for (let y = 0; y < 4; y++)
        (strut(a, h(y, M), h((y + 1) % 4, b), 0.035, C.metalLt),
          strut(a, h((y + 1) % 4, M), h(y, b), 0.035, C.metalLt));
    (box(a, o, s + 0.05, e, 1.1, 0.1, 1.1, C.metal),
      strut(a, [o, 0, e], [o, s, e], 0.04, C.metal));
    const d = new Geo();
    (box(d, 0, 0.45, 0.1, 0.5, 0.45, 0.9, C.metal),
      strut(d, [0, 0.45, -0.3], [0, 0.6, -2.4], 0.05, C.metalLt),
      box(d, 0, 0.75, -2.5, 0.03, 1, 1.3, C.metalLt),
      a.add(d, trs(m4(), o, s, e, WM.yaw, 0, 0, 1, 1, 1)));
    const x = o + 3.2,
      u = e + 1.5;
    for (const [M, b] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ])
      box(a, x + M * 1, 0.6, u + b * 1, 0.12, 1.2, 0.12, C.woodDk);
    cyl(
      a,
      x,
      1.2,
      u,
      1.6,
      1.6,
      1.9,
      16,
      mix3(C.metalLt, C.rust, 0.35),
      mix3(C.metalLt, C.rust, 0.5),
    );
    for (const M of [1.6, 2.2, 2.8])
      cyl(a, x, M, u, 1.62, 1.62, 0.05, 16, C.rust);
    (shadowLong(i, o, e, 2.6, s * SHADOW_K * 0.8),
      shadowLong(i, x, u, 3.3, 3.1 * SHADOW_K));
  }
  {
    const o = ROAD_B[0] - ROAD_A[0],
      e = ROAD_B[1] - ROAD_A[1],
      s = Math.hypot(o, e),
      n = o / s,
      l = e / s,
      h = -l,
      d = n,
      x = Math.floor(s / 27),
      u = [];
    for (let M = 0; M <= x; M++) {
      const b = ROAD_A[0] + n * M * 27 - h * 6,
        y = ROAD_A[1] + l * M * 27 - d * 6,
        L = groundH(b, y) - 0.3;
      (strut(a, [b, L, y], [b, L + 9.4, y], 0.26, C.woodDk),
        strut(
          a,
          [b - h * 1.4, L + 8.7, y - d * 1.4],
          [b + h * 1.4, L + 8.7, y + d * 1.4],
          0.12,
          C.woodDk,
        ),
        u.push([
          [b - h * 1.25, L + 8.84, y - d * 1.25],
          [b, L + 9.4, y],
          [b + h * 1.25, L + 8.84, y + d * 1.25],
        ]),
        M < 3 && shadowLong(i, b, y, 0.35, 9.4 * SHADOW_K));
    }
    for (let M = 0; M < u.length - 1; M++)
      for (let b = 0; b < 3; b++)
        wire(a, u[M][b], u[M + 1][b], 0.8, 8, 0.035, C.wire);
  }
  for (let o = 0; o < 90; o++) {
    const e = r() * TAU - Math.PI,
      s = lerp(3, 75, Math.pow(r(), 0.8)),
      n = Math.abs(e) < 1.38 && s < WALL_R + 1;
    if (s < 2.5) continue;
    const l = Math.min(
        n ? lerp(0.05, 0.16, r()) : lerp(0.15, 1.5, Math.pow(r(), 1.6)),
        Math.max(0.12, (s - 6) * 0.09),
      ),
      h = Math.sin(e) * s,
      d = -Math.cos(e) * s;
    (icosa(
      a,
      trs(
        m4(),
        h,
        groundH(h, d) + l * 0.25,
        d,
        r() * TAU,
        r() * 0.4,
        0,
        l * lerp(1, 1.6, r()),
        l * lerp(0.55, 0.9, r()),
        l,
      ),
      mix3(C.boulder, C.boulderDk, r()),
      r,
      0.25,
      0.2,
    ),
      l > 0.6 && s < 40 && shadowBlob(i, h, d, l * 2.6));
  }
  for (let o = 0; o < 55; o++) {
    const e = r() * TAU - Math.PI,
      s = lerp(8, 60, r());
    if (Math.abs(e) < 1.42 && s < WALL_R + 1.5) continue;
    const n = Math.sin(e) * s,
      l = -Math.cos(e) * s,
      h = groundH(n, l),
      d = lerp(0.6, 1.2, r());
    for (let x = 0; x < 6; x++)
      icosa(
        a,
        trs(
          m4(),
          n + (r() - 0.5) * 0.8 * d,
          h + lerp(0.2, 0.55, r()) * d,
          l + (r() - 0.5) * 0.8 * d,
          r() * TAU,
          0,
          0,
          0.3 * d,
          0.26 * d,
          0.3 * d,
        ),
        r() < 0.5 ? C.shrub : C.shrubDk,
        r,
        0.3,
        0.15,
      );
    s < 35 && shadowBlob(i, n, l, 1.8 * d);
  }
  for (let o = 0; o < 520; o++) {
    const e = r() * TAU - Math.PI,
      s = lerp(1.8, 45, Math.pow(r(), 0.85)),
      n = Math.sin(e) * s,
      l = -Math.cos(e) * s,
      h = groundH(n, l),
      d = lerp(0.12, 0.38, r());
    for (let x = 0; x < 4; x++) {
      const u = r() * TAU,
        M = lerp(0.03, 0.12, r()),
        b = [n + Math.cos(u + 1.6) * 0.025, h, l + Math.sin(u + 1.6) * 0.025],
        y = [n - Math.cos(u + 1.6) * 0.025, h, l - Math.sin(u + 1.6) * 0.025],
        L = [
          n + Math.cos(u) * M,
          h + d * lerp(0.7, 1.1, r()),
          l + Math.sin(u) * M,
        ];
      a.triV(
        b,
        y,
        L,
        C.grassDk,
        C.grassDk,
        mix3(C.grass, [1, 0.9, 0.7], r() * 0.2),
      );
    }
  }
  for (let o = 0; o < 16; o++) {
    let e, s;
    do ((e = r() * TAU - Math.PI), (s = lerp(21, 70, r())));
    while (Math.abs(e) < 1.45 && s < 26);
    const n = Math.sin(e) * s,
      l = -Math.cos(e) * s,
      h = groundH(n, l),
      d = lerp(2.8, 5.4, r()),
      x = mix3(C.cactus, C.earth, r() * 0.2);
    (cyl(a, n, h - 0.2, l, 0.34, 0.3, d, 10, x, mix3(x, [1, 1, 1], 0.1)),
      icosa(
        a,
        trs(m4(), n, h + d - 0.2, l, 0, 0, 0, 0.3, 0.22, 0.3),
        x,
        r,
        0.05,
        0.05,
      ));
    const u = 1 + (r() < 0.65 ? 1 : 0);
    for (let M = 0; M < u; M++) {
      const b = M ? -1 : 1,
        y = h + d * lerp(0.35, 0.6, r()),
        L = lerp(0.9, 1.8, r()),
        U = r() * TAU,
        O = new Geo();
      (box(O, b * 0.45, 0, 0, 0.6, 0.34, 0.34, x),
        cyl(O, b * 0.75, -0.1, 0, 0.21, 0.19, L, 8, x, x),
        icosa(
          O,
          trs(m4(), b * 0.75, L - 0.12, 0, 0, 0, 0, 0.19, 0.15, 0.19),
          x,
          r,
          0.05,
          0.05,
        ),
        a.add(O, trs(m4(), n, y, l, U, 0, 0, 1, 1, 1)));
    }
    s < 36 && shadowLong(i, n, l, 1.3, d * SHADOW_K);
  }
  for (let o = 0; o < 14; o++) {
    const e = r() * TAU - Math.PI,
      s = lerp(6, 30, r());
    if (Math.abs(e) < 1.42 && s < WALL_R + 1) continue;
    const n = Math.sin(e) * s,
      l = -Math.cos(e) * s,
      h = lerp(0.18, 0.32, r());
    cyl(a, n, 0, l, h, h * 0.8, h * 1.5, 10, C.cactusDk, C.cactus);
    for (let d = 0; d < 3; d++)
      box(
        a,
        n + (r() - 0.5) * h * 0.6,
        h * 1.5 + 0.03,
        l + (r() - 0.5) * h * 0.6,
        0.05,
        0.05,
        0.05,
        C.bloom,
      );
    shadowBlob(i, n, l, h * 3);
  }
  return {
    world: a.mesh(),
    glow: t.mesh(),
    shadows: i.mesh(),
    labels: f.mesh(),
    bench: c.mesh(),
    benchGlow: p.mesh(),
  };
}
function buildRotor() {
  const a = new Geo();
  for (let t = 0; t < 18; t++) {
    const i = (t / 18) * TAU,
      f = Math.cos(i),
      c = Math.sin(i),
      p = -c,
      r = f,
      w = (m, k, D) => [f * m + p * k, c * m + r * k, D],
      G = t % 2 ? C.metalLt : mix3(C.metalLt, C.rust, 0.25);
    a.quad(
      w(0.4, -0.05, 0.02),
      w(1.9, -0.15, 0.05),
      w(1.9, 0.15, -0.05),
      w(0.4, 0.05, -0.02),
      G,
    );
  }
  return (
    ring(a, 1.82, 1.9, 36, C.metal, 0.03),
    ring(a, 0.9, 0.96, 24, C.metal, 0.02),
    a.add(
      cyl(new Geo(), 0, 0, 0, 0.18, 0.12, 0.25, 10, C.metal, C.metal),
      trs(m4(), 0, 0, 0.05, 0, Math.PI / 2, 0, 1, 1, 1),
    ),
    a.mesh()
  );
}
function buildTumbleweed() {
  const a = new Geo(),
    t = mulberry(23),
    i = () => {
      const f = t() * 2 - 1,
        c = t() * TAU,
        p = Math.sqrt(1 - f * f);
      return [Math.cos(c) * p * 0.45, f * 0.42, Math.sin(c) * p * 0.45];
    };
  for (let f = 0; f < 46; f++) {
    const c = i(),
      p = i();
    strut(a, c, p, lerp(0.012, 0.022, t()), t() < 0.5 ? C.weed : C.weedDk);
  }
  return a.mesh();
}
function bullseye(a, t) {
  a.add(
    cyl(new Geo(), 0, 0, 0, t * 1.08, t * 1.08, 0.05, 36, C.wood, C.woodLt),
    trs(m4(), 0, 0, -0.055, 0, Math.PI / 2, 0, 1, 1, 1),
  );
  for (const i of [-1, 1])
    box(a, i * t * 0.7, 0, -0.065, 0.03, t * 1.8, 0.02, C.woodDk);
  return a;
}
const MESH = {};
function buildMeshes() {
  ((MESH.sky = buildSky()),
    (MESH.clouds = buildClouds()),
    Object.assign(MESH, buildWorld()),
    (MESH.rotor = buildRotor()),
    (MESH.tumbleweed = buildTumbleweed()));
  {
    const t = bullseye(new Geo(), 0.42);
    (box(t, 0, -1.4, -0.06, 0.07, 2.1, 0.05, C.wood),
      (MESH.popper = t.mesh()),
      (MESH.dud = MESH.popper));
  }
  {
    const t = bullseye(new Geo(), 0.34);
    ring(t, 0.34 * 1.08, 0.34 * 1.18, 36, C.clayLt, -0.012);
    for (const i of [-1, 1])
      (cyl(t, i * 0.47, -0.05, -0.04, 0.06, 0.06, 0.1, 12, C.gun, C.clay),
        strut(t, [i * 0.36, 0, -0.05], [i * 0.43, 0, -0.05], 0.03, C.gunDk));
    (box(t, 0, 0.42, -0.05, 0.02, 0.12, 0.02, C.gunDk),
      (MESH.floater = t.mesh()));
  }
  {
    const t = new Geo();
    (cyl(t, 0, -0.025, 0, 0.16, 0.13, 0.03, 20, C.clay, C.clayLt),
      cyl(t, 0, 0.005, 0, 0.13, 0.08, 0.025, 20, C.clayLt, C.clayLt),
      (MESH.clay = t.mesh()));
  }
  {
    const t = bullseye(new Geo(), 0.45);
    (box(t, 0, -1.55, -0.06, 0.08, 2.3, 0.05, C.wood), (MESH.start = t.mesh()));
  }
  {
    const t = new Geo();
    (box(t, 0, 0, -0.06, 2.56, 1.36, 0.08, C.frame),
      box(t, -1, -2.6, -0.12, 0.1, 3.9, 0.1, C.wood),
      box(t, 1, -2.6, -0.12, 0.1, 3.9, 0.1, C.wood),
      (MESH.sign = t.mesh()));
  }
  {
    const t = new Geo(),
      i = new Geo();
    (box(t, 0, 0, 0.02, 0.044, 0.058, 0.15, C.gun),
      box(t, 0, 0.036, 0, 0.04, 0.018, 0.18, C.gunDk));
    for (let c = 0; c < 7; c++)
      box(t, 0, 0.0465, -0.06 + c * 0.022, 0.026, 0.004, 0.007, C.gun);
    (box(t, 0, 0.052, -0.075, 0.006, 0.014, 0.01, C.clay),
      box(t, 0, 0.05, 0.085, 0.022, 0.012, 0.008, C.gunDk),
      box(t, 0.0225, 0, 0.03, 0.002, 0.012, 0.11, C.gold),
      box(t, -0.0225, 0, 0.03, 0.002, 0.012, 0.11, C.gold));
    const f = cyl(new Geo(), 0, 0, 0, 0.017, 0.017, 0.11, 12, C.gunDk, C.gunDk);
    for (const c of [0.02, 0.05, 0.08])
      cyl(f, 0, c, 0, 0.0195, 0.0195, 0.008, 12, C.gun);
    (t.add(f, trs(m4(), 0, 0.006, -0.055, 0, -Math.PI / 2, 0, 1, 1, 1)),
      t.add(
        cyl(new Geo(), 0, 0, 0, 0.021, 0.019, 0.025, 12, C.gun, C.gunDk),
        trs(m4(), 0, 0.006, -0.165, 0, -Math.PI / 2, 0, 1, 1, 1),
      ),
      i.add(
        ring(new Geo(), 0.009, 0.0165, 12, C.clay, 0),
        trs(m4(), 0, 0.006, -0.1905, 0, Math.PI, 0, 1, 1, 1),
      ),
      i.add(
        cyl(new Geo(), 0, 0, 0, 0.011, 0.011, 0.07, 10, C.cell, C.cell),
        trs(m4(), -0.026, 0.004, -0.01, 0, Math.PI / 2, 0, 1, 1, 1),
      ),
      box(t, -0.027, 0.004, 0.03, 0.006, 0.026, 0.012, C.gunDk),
      box(t, -0.027, 0.004, -0.05, 0.006, 0.026, 0.012, C.gunDk),
      t.add(
        box(new Geo(), 0, -0.055, 0, 0.036, 0.11, 0.046, C.wood),
        trs(m4(), 0, 0, 0.075, 0, 0.32, 0, 1, 1, 1),
      ));
    for (const c of [-1, 1])
      t.add(
        box(new Geo(), c * 0.0185, -0.055, 0, 0.002, 0.08, 0.03, C.woodDk),
        trs(m4(), 0, 0, 0.075, 0, 0.32, 0, 1, 1, 1),
      );
    (strut(t, [0, -0.03, -0.02], [0, -0.06, 0], 0.006, C.gunDk),
      strut(t, [0, -0.06, 0], [0, -0.055, 0.045], 0.006, C.gunDk),
      box(t, 0, -0.042, 0.012, 0.006, 0.022, 0.008, C.metalLt),
      (MESH.blaster = t.mesh()),
      (MESH.blasterGlow = i.mesh()));
  }
  ((MESH.shard = octa(new Geo(), 1, C.white1).mesh()),
    (MESH.cube = box(new Geo(), 0, 0, 0, 1, 1, 1, C.white1).mesh()),
    (MESH.casing = cyl(
      new Geo(),
      0,
      -0.5,
      0,
      1,
      1,
      1,
      8,
      C.white1,
      C.white1,
    ).mesh()),
    (MESH.beam = box(new Geo(), 0, 0, 0.5, 1, 1, 1, C.white1).mesh()),
    (MESH.shock = ring(new Geo(), 0.93, 1, 40, C.white1).mesh()));
  {
    const t = new Geo();
    (t.tri([0, 0, 0.28], [-0.95, 0.32, -0.18], [0, 0, -0.12], C.bird),
      t.tri([0, 0, 0.28], [0, 0, -0.12], [0.95, 0.32, -0.18], C.bird),
      t.tri([0, 0, -0.1], [-0.12, 0, -0.38], [0.12, 0, -0.38], C.bird),
      (MESH.bird = t.mesh()));
  }
  const a = (t, i, f, c, p) => {
    const r = new TGeo();
    return (r.quad(t, i, f, c, p), r.mesh());
  };
  ((MESH.quad = a(
    [-0.5, -0.5, 0],
    [0.5, -0.5, 0],
    [0.5, 0.5, 0],
    [-0.5, 0.5, 0],
    [0, 0, 1, 1],
  )),
    (MESH.gLong = a(
      [-0.5, 0, 0],
      [0.5, 0, 0],
      [0.5, 0, 1],
      [-0.5, 0, 1],
      UV_LONG,
    )),
    (MESH.gBlob = a(
      [-0.5, 0, 0.5],
      [0.5, 0, 0.5],
      [0.5, 0, -0.5],
      [-0.5, 0, -0.5],
      UV_BLOB,
    )));
}
buildMeshes();
const B = {
    cube: makeBatch(MESH.cube, 560),
    shard: makeBatch(MESH.shard, 420),
    casing: makeBatch(MESH.casing, 100),
  },
  PT = { glow: makePts(2200), smoke: makePts(260) };
for (const a of [LIT, INST]) {
  gl.useProgram(a.p);
  const t = a.u;
  (gl.uniform3fv(t.uLight, LIGHT),
    gl.uniform3fv(t.uSunCol, SUN_COL),
    gl.uniform3fv(t.uSkyAmb, SKY_AMB),
    gl.uniform3fv(t.uGndAmb, GND_AMB),
    gl.uniform3fv(t.uFogCol, FOG),
    gl.uniform3fv(t.uGlowCol, FOG_GLOW),
    gl.uniform3fv(t.uRimCol, RIM),
    gl.uniform3fv(t.uSunDir, SUN),
    gl.uniform2f(t.uFogRange, 22, 270));
}
(gl.useProgram(TEX.p),
  gl.uniform3fv(TEX.u.uFogCol, FOG),
  gl.uniform2f(TEX.u.uFogRange, 22, 270),
  gl.uniform1i(TEX.u.uTex, 0));
