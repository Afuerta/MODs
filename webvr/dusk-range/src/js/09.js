"use strict";
Object.assign(C, {
  uAsph: hex("#25222d"),
  uWalk: hex("#3c3847"),
  uCurb: hex("#5d5769"),
  uPlaza: hex("#3a3649"),
  uPlazaLt: hex("#4a4560"),
  uDeck: hex("#2b2e3a"),
  uGrass: hex("#1d3a2a"),
  uGrassLt: hex("#264832"),
  uLeaf: hex("#1f4d37"),
  uLeafLt: hex("#2e6a4b"),
  uTrunk: hex("#3b2d29"),
  uConc: hex("#5a5563"),
  uConcDk: hex("#35313f"),
  uRoof: hex("#2b2735"),
  uMetal: hex("#6c6a7a"),
  uDark: hex("#17151d"),
  uLine: hex("#d0c9b2"),
  uLineY: hex("#d9a932"),
  uGlass: hex("#20263a"),
  uPink: hex("#ff3aa8"),
  uCyan: hex("#36e8ff"),
  uAmber: hex("#ffb43a"),
  uLime: hex("#a8ff3a"),
  uViolet: hex("#a46aff"),
  uRed: hex("#ff4040"),
  uLamp: hex("#ffd9a0"),
});
const NEONS = ["uPink", "uCyan", "uAmber", "uLime", "uViolet"],
  CITY_MOON = norm([0.32, 0.4, -0.86]);
MAPS.city = {
  fog: hex("#1d1731"),
  glow: hex("#80407e"),
  rim: hex("#ff86c8"),
  light: CITY_MOON,
  sun: scale3(hex("#aab6ff"), 0.52),
  sky: scale3(hex("#6c62b4"), 0.6),
  gnd: scale3(hex("#4c3c5a"), 0.42),
  sunDir: CITY_MOON,
  fogRange: [30, 170],
};
function laneInfo(o) {
  const n = [0];
  for (let f = 1; f < o.length; f++)
    n.push(n[f - 1] + Math.hypot(o[f][0] - o[f - 1][0], o[f][1] - o[f - 1][1]));
  return { pts: o, cum: n, len: n[n.length - 1] };
}
function lanePoint(o, n) {
  n = clamp(n, 0, o.len);
  let f = 1;
  for (; f < o.pts.length - 1 && o.cum[f] < n;) f++;
  const x = o.pts[f - 1],
    p = o.pts[f],
    h = o.cum[f] - o.cum[f - 1] || 1,
    E = (n - o.cum[f - 1]) / h;
  return [
    x[0] + (p[0] - x[0]) * E,
    x[1] + (p[1] - x[1]) * E,
    (p[0] - x[0]) / h,
    (p[1] - x[1]) / h,
  ];
}
const CITY = {
    core: [0, -8],
    plaza: [-24, -21.5, 24, 8],
    deck: [-2.6, -2.4, 2.6, 2.4],
    hq: [-13, 19, 13, 36],
    roads: [
      [0, -150, 0, -21.5, 4.5],
      [-150, -26, 150, -26, 3.5],
      [-150, -48, 150, -48, 3.5],
      [-150, -74, 150, -74, 3.5],
      [-150, -100, 150, -100, 3.5],
      [-150, 14, 150, 14, 3.5],
      [-20, -150, -20, -21.5, 3.5],
      [20, -150, 20, -21.5, 3.5],
      [-40, -150, -40, 14, 3.5],
      [40, -150, 40, 14, 3.5],
      [-64, -150, -64, 40, 3.5],
      [64, -150, 64, 40, 3.5],
      [-88, -150, -88, 40, 3.5],
      [88, -150, 88, 40, 3.5],
    ],
    parks: [
      [-14.5, -42.5, -6.5, -31.5],
      [6.5, -42.5, 14.5, -31.5],
      [-14.5, -68.5, -6.5, -53.5],
      [6.5, -68.5, 14.5, -53.5],
    ],
    lanes: [
      [
        [0, -64],
        [0, -8],
      ],
      [
        [-60, -26],
        [-20, -26],
        [-20, -14],
        [0, -8],
      ],
      [
        [60, -26],
        [20, -26],
        [20, -14],
        [0, -8],
      ],
      [
        [-40, -66],
        [-40, -48],
        [0, -48],
        [0, -8],
      ],
      [
        [40, -66],
        [40, -48],
        [0, -48],
        [0, -8],
      ],
    ].map(laneInfo),
    pads: [
      [-9, -18],
      [9, -18],
      [-9, 0],
      [9, 0],
      [-10, -36],
      [10, -36],
      [-10, -60],
      [10, -60],
      [-27, -19],
      [27, -19],
      [-30, -36],
      [30, -36],
      [-48, -19],
      [48, -19],
      [-30, -60],
      [30, -60],
    ],
    bld: [],
    lamps: [],
    beacons: [],
    cars: [],
  },
  inRect = (o, n, f, x = 0) =>
    o > f[0] - x && o < f[2] + x && n > f[1] - x && n < f[3] + x,
  rectHit = (o, n) => o[0] < n[2] && o[2] > n[0] && o[1] < n[3] && o[3] > n[1];
function roadRect(o, n = 0) {
  const f = o[4] + n;
  return [
    Math.min(o[0], o[2]) - (o[0] === o[2] ? f : 0),
    Math.min(o[1], o[3]) - (o[1] === o[3] ? f : 0),
    Math.max(o[0], o[2]) + (o[0] === o[2] ? f : 0),
    Math.max(o[1], o[3]) + (o[1] === o[3] ? f : 0),
  ];
}
function segD(o, n, f, x) {
  const p = x[0] - f[0],
    h = x[1] - f[1],
    E = p * p + h * h || 1,
    T = clamp(((o - f[0]) * p + (n - f[1]) * h) / E, 0, 1);
  return Math.hypot(o - f[0] - p * T, n - f[1] - h * T);
}
const lsp = (o, n) => {
  "letterSpacing" in o && (o.letterSpacing = n + "px");
};
function laneDist(o, n) {
  let f = 1 / 0;
  for (const x of CITY.lanes)
    for (let p = 1; p < x.pts.length; p++)
      f = Math.min(f, segD(o, n, x.pts[p - 1], x.pts[p]));
  return f;
}
const WIN_TEX = canvasTex(256, 256, (o, n, f) => {
  ((o.fillStyle = "#16131e"), o.fillRect(0, 0, n, f));
  const x = mulberry(404);
  for (let p = 0; p < 8; p++)
    for (let h = 0; h < 8; h++) {
      const E = h * 32 + 6,
        T = p * 32 + 8,
        m = x();
      ((o.fillStyle =
        m < 0.3
          ? "#ffcf7a"
          : m < 0.4
            ? "#9fe0ff"
            : m < 0.44
              ? "#ff8ad0"
              : m < 0.6
                ? "#3a3448"
                : "#231e2e"),
        o.fillRect(E, T, 20, 17),
        m < 0.44 &&
          ((o.fillStyle = "rgba(0,0,0,0.28)"), o.fillRect(E, T + 11, 20, 6)));
    }
  o.fillStyle = "rgba(255,255,255,0.05)";
  for (let p = 0; p < 8; p++) o.fillRect(p * 32, 0, 2, f);
  o.fillStyle = "rgba(0,0,0,0.35)";
  for (let p = 0; p < 8; p++) o.fillRect(0, p * 32 + 28, n, 3);
});
(gl.bindTexture(gl.TEXTURE_2D, WIN_TEX.tex),
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT),
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT));
const BILL_TEX = canvasTex(1024, 256, (o, n, f) => {
    ((o.fillStyle = "#120e1e"),
      o.fillRect(0, 0, n, f),
      (o.strokeStyle = "#ff3aa8"),
      (o.lineWidth = 10),
      o.strokeRect(12, 12, n - 24, f - 24),
      (o.textAlign = "center"),
      (o.textBaseline = "middle"),
      lsp(o, 6),
      (o.shadowColor = "#36e8ff"),
      (o.shadowBlur = 24),
      (o.fillStyle = "#bff6ff"),
      (o.font = `128px ${FD}`),
      o.fillText("NEON GRIDLOCK", n / 2, f / 2 - 18, n - 80),
      (o.shadowColor = "#ff3aa8"),
      (o.shadowBlur = 16),
      (o.fillStyle = "#ffc2e6"),
      (o.font = `700 34px ${FB}`),
      lsp(o, 12),
      o.fillText(
        "HOLD THE BEACON  ·  KEEP THE LIGHTS ON",
        n / 2,
        f - 44,
        n - 100,
      ),
      (o.shadowBlur = 0),
      lsp(o, 0));
  }),
  HQ_TEX = canvasTex(512, 128, (o, n, f) => {
    ((o.fillStyle = "#120e1e"),
      o.fillRect(0, 0, n, f),
      (o.textAlign = "center"),
      (o.textBaseline = "middle"),
      (o.shadowColor = "#ffb43a"),
      (o.shadowBlur = 18),
      (o.fillStyle = "#ffe2b0"),
      (o.font = `86px ${FD}`),
      lsp(o, 8),
      o.fillText("GRID HQ", n / 2, f / 2 + 4, n - 40),
      (o.shadowBlur = 0),
      lsp(o, 0));
  }),
  CITYX = {};
(() => {
  const o = new Geo(),
    n = new Geo(),
    f = new Geo(),
    x = new Geo(),
    p = new TGeo(),
    h = mulberry(2077),
    E = () => C[NEONS[Math.floor(h() * NEONS.length)]],
    T = (t) =>
      t < 0
        ? hex("#1d1731")
        : mix3(
            mix3(hex("#52264f"), hex("#1c1640"), smooth(0, 0.32, t)),
            hex("#08071a"),
            smooth(0.32, 1.25, t),
          );
  {
    const s = [-0.4, -0.05, 0, 0.04, 0.1, 0.18, 0.3, 0.48, 0.75, 1.1, 1.5707],
      r = (a, l) => [
        Math.cos(a) * Math.sin(l) * 400,
        Math.sin(a) * 400,
        -Math.cos(a) * Math.cos(l) * 400,
      ];
    for (let a = 0; a < s.length - 1; a++)
      for (let l = 0; l < 40; l++) {
        const c = (l / 40) * TAU,
          u = ((l + 1) / 40) * TAU,
          i = s[a],
          d = s[a + 1];
        x.quadV(r(i, c), r(i, u), r(d, u), r(d, c), T(i), T(i), T(d), T(d));
      }
    for (let a = 0; a < 300; a++) {
      const l = h() * TAU,
        c = Math.asin(lerp(Math.sin(0.25), 1, h())),
        u = [
          Math.cos(c) * Math.sin(l),
          Math.sin(c),
          -Math.cos(c) * Math.cos(l),
        ],
        i = scale3(u, 392),
        d = norm(cross(u, [0, 1, 0.001])),
        b = cross(d, u),
        M = lerp(0.35, 0.9, h()),
        g = mix3(
          T(c),
          [0.9, 0.88, 1],
          lerp(0.3, 0.9, h()) * smooth(0.25, 0.6, c),
        );
      x.tri(
        [i[0] + d[0] * M, i[1] + d[1] * M, i[2] + d[2] * M],
        [i[0] + b[0] * M, i[1] + b[1] * M, i[2] + b[2] * M],
        [
          i[0] - d[0] * M - b[0] * M,
          i[1] - d[1] * M - b[1] * M,
          i[2] - d[2] * M - b[2] * M,
        ],
        g,
      );
    }
    (disc(x, CITY_MOON, 380, 34, hex("#2a2048"), 32),
      disc(x, CITY_MOON, 379, 21, hex("#4a3c70"), 32),
      disc(x, CITY_MOON, 378, 14, hex("#efe6ff"), 32));
    for (const a of [
      { R: 360, n: 150, h0: 18, h1: 90, c: "#0e0b18" },
      { R: 318, n: 120, h0: 10, h1: 46, c: "#130f20" },
    ]) {
      let l = 0;
      for (; l < TAU;) {
        const c = lerp(0.018, 0.05, h()),
          u = lerp(a.h0, a.h1, Math.pow(h(), 1.6)),
          i = Math.min(TAU, l + c),
          d = hex(a.c);
        (x.quad(
          polar(l, a.R, -12),
          polar(i, a.R, -12),
          polar(i, a.R, u),
          polar(l, a.R, u),
          d,
        ),
          u > a.h1 * 0.7 &&
            h() < 0.5 &&
            x.tri(
              polar(l + c * 0.3, a.R, u),
              polar(l + c * 0.7, a.R, u),
              polar(l + c * 0.5, a.R, u + u * 0.12),
              d,
            ));
        const b = Math.floor((u * c * a.R) / 90);
        for (let M = 0; M < b; M++) {
          const g = lerp(l, i, h()),
            k = lerp(0, u * 0.95, h()),
            P = 0.9,
            y = a.R - 0.5,
            A =
              h() < 0.7
                ? hex("#ffc86a")
                : h() < 0.5
                  ? hex("#8ad8ff")
                  : hex("#ff7ac8");
          x.quad(
            polar(g, y, k),
            polar(g + P / y, y, k),
            polar(g + P / y, y, k + P * 1.1),
            polar(g, y, k + P * 1.1),
            mix3(d, A, lerp(0.35, 0.8, h())),
          );
        }
        (u > 60 &&
          CITY.beacons.push({
            sky: !0,
            p: polar(lerp(l, i, 0.5), a.R - 1, u + 2),
            ph: h() * TAU,
          }),
          (l = i + lerp(0.002, 0.012, h())));
      }
    }
  }
  const m = { walk: 0.012, road: 0.024, top: 0.036, mark: 0.05, glow: 0.06 },
    w = (t, e, s, r, a, l, c) =>
      t.quad([e, l, a], [r, l, a], [r, l, s], [e, l, s], c);
  w(o, -400, -400, 400, 400, 0, C.uAsph);
  for (const t of CITY.roads) {
    const e = roadRect(t, 2);
    w(o, e[0], e[1], e[2], e[3], m.walk, C.uWalk);
  }
  for (const t of CITY.roads) {
    const e = roadRect(t);
    w(o, e[0], e[1], e[2], e[3], m.road, C.uAsph);
    const s = t[0] === t[2],
      r = Math.abs(s ? t[3] - t[1] : t[2] - t[0]),
      a = s ? t[1] : t[0];
    for (let l = 1; l < r; l += 6) {
      const c = a + l,
        u = s ? t[0] : c,
        i = s ? c : t[1];
      if (
        !CITY.roads.some((d) => d !== t && inRect(u, i, roadRect(d), 0.5)) &&
        !inRect(u, i, CITY.plaza, 1)
      )
        if (t[4] > 4)
          for (const d of [-0.18, 0.18])
            s
              ? w(o, u + d - 0.07, i, u + d + 0.07, i + 3, m.mark, C.uLineY)
              : w(o, u, i + d - 0.07, u + 3, i + d + 0.07, m.mark, C.uLineY);
        else
          s
            ? w(o, u - 0.07, i, u + 0.07, i + 3, m.mark, C.uLine)
            : w(o, u, i - 0.07, u + 3, i + 0.07, m.mark, C.uLine);
    }
  }
  {
    const t = CITY.plaza;
    w(o, t[0], t[1], t[2], t[3], m.top, C.uPlaza);
    for (let a = t[0]; a < t[2] - 0.1; a += 4)
      for (let l = t[1]; l < t[3] - 0.1; l += 4)
        ((a + l) / 4) % 2 === 0 &&
          w(
            o,
            a + 0.1,
            l + 0.1,
            a + 3.9,
            l + 3.9,
            m.top + 0.004,
            mix3(C.uPlaza, C.uPlazaLt, 0.35),
          );
    const [e, s] = CITY.core;
    for (const [a, l, c] of [
      [5.6, 6.2, C.uPlazaLt],
      [9.4, 9.8, C.uPlazaLt],
    ])
      o.add(
        ring(new Geo(), a, l, 48, c),
        trs(m4(), e, m.mark, s, 0, -Math.PI / 2, 0, 1, 1, 1),
      );
    const r = CITY.deck;
    w(o, r[0], r[1], r[2], r[3], m.mark, C.uDeck);
    for (let a = 0; a < 13; a++) {
      const l = r[0] + a * 0.4;
      (w(o, l, r[1] - 0.25, l + 0.2, r[1], m.mark + 0.004, C.uAmber),
        w(o, l, r[3], l + 0.2, r[3] + 0.25, m.mark + 0.004, C.uAmber));
    }
    for (const [a, l] of [
      [-21, -18],
      [21, -18],
      [-21, -6],
      [21, -6],
      [-21, 5],
      [21, 5],
      [-14, 5.5],
      [14, 5.5],
    ])
      (box(o, a, 0.35, l, 1.6, 0.7, 1.6, C.uConc),
        box(o, a, 0.72, l, 1.4, 0.06, 1.4, C.uGrass),
        ico(o, a, 2.2, l, 1, 1.1, 1, C.uLeaf, h, 0.25, 0.25),
        cyl(o, a, 0.7, l, 0.1, 0.08, 1, 6, C.uTrunk));
    for (const [a, l, c] of [
      [-12, -21, 0],
      [12, -21, 0],
      [-23, -12, Math.PI / 2],
      [23, -12, Math.PI / 2],
      [-23, 0, Math.PI / 2],
      [23, 0, Math.PI / 2],
    ])
      (o.add(
        box(new Geo(), 0, 0.42, 0, 1.8, 0.08, 0.5, C.uMetal),
        trs(m4(), a, 0, l, c, 0, 0, 1, 1, 1),
      ),
        o.add(
          box(new Geo(), 0, 0.2, 0, 1.6, 0.4, 0.1, C.uConcDk),
          trs(m4(), a, 0, l, c, 0, 0, 1, 1, 1),
        ));
  }
  const F = (t, e, s) => {
    (cyl(o, t, 0, e, 0.14 * s, 0.1 * s, 1.6 * s, 6, C.uTrunk),
      ico(o, t, 2.4 * s, e, 1.3 * s, 1.4 * s, 1.3 * s, C.uLeaf, h, 0.28, 0.25),
      ico(
        o,
        t + 0.3 * s,
        3.3 * s,
        e - 0.2 * s,
        0.9 * s,
        0.9 * s,
        0.9 * s,
        C.uLeafLt,
        h,
        0.28,
        0.2,
      ));
  };
  for (const t of CITY.parks) {
    w(o, t[0], t[1], t[2], t[3], m.top, C.uGrass);
    const e = (t[0] + t[2]) / 2,
      s = (t[1] + t[3]) / 2;
    w(o, e - 0.8, t[1], e + 0.8, t[3], m.top + 0.004, C.uWalk);
    for (let r = 0; r < 6; r++) {
      const a = lerp(t[0] + 1, t[2] - 1, h()),
        l = lerp(t[1] + 1, t[3] - 1, h());
      Math.abs(a - e) < 1.6 ||
        CITY.pads.some((c) => Math.hypot(c[0] - a, c[1] - l) < 3.2) ||
        F(a, l, lerp(0.8, 1.2, h()));
    }
  }
  const D = [-150, -88, -64, -40, -20, 0, 20, 40, 64, 88, 150],
    z = [-150, -100, -74, -48, -26, 14, 40],
    N = (t) => (Math.abs(t) === 150 ? 0 : t === 0 ? 6.5 : 5.5),
    H = (t) =>
      rectHit(t, [
        CITY.plaza[0] - 0.5,
        CITY.plaza[1] - 0.5,
        CITY.plaza[2] + 0.5,
        CITY.plaza[3] + 0.5,
      ]) ||
      CITY.parks.some((e) => rectHit(t, e)) ||
      rectHit(t, CITY.hq) ||
      CITY.pads.some(
        (e) =>
          e[0] > t[0] - 5.5 &&
          e[0] < t[2] + 5.5 &&
          e[1] > t[1] - 5.5 &&
          e[1] < t[3] + 5.5,
      ) ||
      CITY.roads.some((e) => rectHit(t, roadRect(e, 2))),
    _ = [
      [0.92, 0.9, 1],
      [1, 0.92, 0.86],
      [0.88, 0.86, 1],
      [0.84, 0.95, 1],
      [1, 0.88, 0.95],
    ];
  for (let t = 0; t < D.length - 1; t++)
    for (let e = 0; e < z.length - 1; e++) {
      const s = D[t] + N(D[t]),
        r = D[t + 1] - N(D[t + 1]),
        a = z[e] + N(z[e]),
        l = z[e + 1] - N(z[e + 1]);
      if (r - s < 4 || l - a < 4) continue;
      const c = Math.max(1, Math.round((r - s) / 10)),
        u = Math.max(1, Math.round((l - a) / 10));
      for (let i = 0; i < c; i++)
        for (let d = 0; d < u; d++) {
          if (c > 2 && u > 2 && i > 0 && i < c - 1 && d > 0 && d < u - 1)
            continue;
          const b = [
              lerp(s, r, i / c) + 0.5,
              lerp(a, l, d / u) + 0.5,
              lerp(s, r, (i + 1) / c) - 0.5,
              lerp(a, l, (d + 1) / u) - 0.5,
            ],
            M = (b[0] + b[2]) / 2,
            g = (b[1] + b[3]) / 2,
            k = Math.hypot(M, g);
          if (k > 165 || H(b)) continue;
          const P = Math.min(
            70,
            lerp(7, 16, h()) +
              Math.max(0, k - 26) * lerp(0.08, 0.5, Math.pow(h(), 1.4)),
          );
          CITY.bld.push({
            r: b,
            h: P,
            d: k,
            tint: _[Math.floor(h() * _.length)],
          });
        }
    }
  CITY.bld.push({ r: CITY.hq, h: 24, d: 30, tint: [0.95, 0.9, 1], hq: !0 });
  const O = (t, e, s, r, a, l, c) => {
    const u = Math.hypot(e[0] - t[0], e[1] - t[1]),
      i = [r[0] * a, r[1] * a, r[2] * a];
    p.quad(
      [t[0], 0, t[1]],
      [e[0], 0, e[1]],
      [e[0], s, e[1]],
      [t[0], s, t[1]],
      [l, c, l + u / 25.6, c + s / 27.2],
      i,
    );
  };
  for (const t of CITY.bld) {
    const [e, s, r, a] = t.r,
      l = t.h,
      c = Math.floor(h() * 8) / 8,
      u = Math.floor(h() * 8) / 8;
    (O([e, a], [r, a], l, t.tint, 1, c, u),
      O([r, a], [r, s], l, t.tint, 0.78, c + 0.25, u),
      O([r, s], [e, s], l, t.tint, 0.62, c + 0.5, u),
      O([e, s], [e, a], l, t.tint, 0.8, c + 0.75, u),
      w(o, e, s, r, a, l, C.uRoof));
    for (const [g, k, P, y] of [
      [e, a, r, a],
      [r, s, r, a],
      [e, s, r, s],
      [e, s, e, a],
    ])
      box(
        o,
        (g + P) / 2,
        l + 0.3,
        (k + y) / 2,
        Math.max(0.3, P - g),
        0.6,
        Math.max(0.3, y - k),
        C.uConcDk,
      );
    const i = r - e,
      d = a - s,
      b = (e + r) / 2,
      M = (s + a) / 2;
    if (!t.hq) {
      if (
        (h() < 0.5 &&
          box(
            o,
            b + (h() - 0.5) * i * 0.4,
            l + 0.7,
            M + (h() - 0.5) * d * 0.4,
            1.8,
            1.4,
            1.4,
            C.uMetal,
          ),
        h() < 0.18)
      ) {
        const g = b + (h() - 0.5) * i * 0.3,
          k = M + (h() - 0.5) * d * 0.3;
        for (const [P, y] of [
          [-0.7, -0.7],
          [0.7, -0.7],
          [0.7, 0.7],
          [-0.7, 0.7],
        ])
          box(o, g + P, l + 0.9, k + y, 0.12, 1.8, 0.12, C.uConcDk);
        cyl(o, g, l + 1.8, k, 1.1, 1.1, 2, 10, C.uTrunk, C.uRoof);
      }
      if (
        (l > 30 &&
          (box(o, b, l + 3, M, 0.15, 6, 0.15, C.uMetal),
          CITY.beacons.push({ p: [b, l + 6.1, M], ph: h() * TAU })),
        t.d < 120 && h() < 0.3)
      ) {
        const g = E();
        for (const [k, P, y, A] of [
          [e, a, r, a],
          [r, s, r, a],
          [e, s, r, s],
          [e, s, e, a],
        ])
          box(
            n,
            (k + y) / 2,
            l + 0.62,
            (P + A) / 2,
            Math.max(0.12, y - k + 0.1),
            0.12,
            Math.max(0.12, A - P + 0.1),
            g,
          );
      }
      if (t.d < 75) {
        const g = [
          [b, a + 3, 0, 1],
          [r + 3, M, 1, 0],
          [b, s - 3, 0, -1],
          [e - 3, M, -1, 0],
        ];
        let k = g[0],
          P = 1 / 0;
        for (const L of g) {
          const G = Math.min(
            ...CITY.roads.map((R) =>
              segD(L[0], L[1], [R[0], R[1]], [R[2], R[3]]),
            ),
          );
          G < P && ((P = G), (k = L));
        }
        const y = E(),
          [A, W, S, I] = k;
        if (
          (h() < 0.6 &&
            box(
              n,
              S ? (S > 0 ? r + 0.08 : e - 0.08) : b,
              3.5,
              I ? (I > 0 ? a + 0.08 : s - 0.08) : M,
              S ? 0.08 : i * 0.8,
              0.22,
              I ? 0.08 : d * 0.8,
              y,
            ),
          h() < 0.22)
        ) {
          const L = S ? (S > 0 ? r + 0.6 : e - 0.6) : e + 0.8,
            G = I ? (I > 0 ? a + 0.6 : s - 0.6) : s + 0.8,
            R = lerp(3, 6, h());
          (box(n, L, 5 + R / 2, G, S ? 1.1 : 0.22, R, I ? 1.1 : 0.22, y),
            CITY.lamps.push({
              p: [L + S * 0.6, 5 + R / 2, G + I * 0.6],
              s: 3.2,
              c: y,
              a: 0.3,
              ph: h() * TAU,
              sign: !0,
            }));
        }
      }
    }
  }
  {
    const [t, e, s] = CITY.hq;
    box(n, 0, 2.2, e - 0.05, 8, 3.6, 0.1, hex("#ffd59a"));
    for (let r = 0; r < 6; r++)
      box(o, -3.5 + r * 1.4, 2.2, e - 0.12, 0.12, 3.8, 0.1, C.uDark);
    box(o, 0, 4.4, e - 1.6, 12, 0.25, 3.2, C.uConcDk);
    for (const r of [-1, 1])
      box(o, r * 5.6, 2.2, e - 3, 0.3, 4.4, 0.3, C.uConc);
    (box(n, 0, 4.25, e - 3.15, 11, 0.1, 0.1, C.uAmber),
      (CITYX.hqSign = [0, 8.5, e - 0.12]));
  }
  {
    for (const s of [-1, 1])
      (box(o, s * 7.4, (17.5 + 3) / 2, -44, 0.6, 17.5 + 3, 0.6, C.uConcDk),
        box(
          n,
          s * 7.05,
          (17.5 + 3) / 2,
          -44 + 0.31,
          0.08,
          17.5 + 2,
          0.06,
          C.uCyan,
        ));
    (box(o, 0, 17.5 + 2.6, -44, 15.4, 0.6, 0.8, C.uConcDk),
      box(o, 0, 17.5, -44 - 0.2, 14.4, 4.2, 0.3, C.uDark),
      (CITYX.bill = [0, 17.5, -44]));
  }
  const U = (t, e, s, r, a) => {
      (cyl(o, t, 0, e, 0.1, 0.07, 6.2, 6, C.uMetal),
        strut(o, [t, 6.1, e], [t + s * 1.5, 6.3, e + r * 1.5], 0.08, C.uMetal),
        box(o, t + s * 1.5, 6.2, e + r * 1.5, 0.7, 0.18, 0.4, C.uConcDk),
        box(n, t + s * 1.5, 6.08, e + r * 1.5, 0.55, 0.06, 0.3, a));
      const l = t + s * 1.5,
        c = e + r * 1.5;
      CITY.lamps.push({
        p: [l, 5.95, c],
        s: 1.6,
        c: a,
        a: 0.55,
        ph: h() * TAU,
      });
      const u = 6,
        i = 20,
        d = scale3(a, 0.26);
      for (let b = 0; b < i; b++) {
        const M = (b / i) * TAU,
          g = ((b + 1) / i) * TAU;
        f.triV(
          [l, 0.07, c],
          [l + Math.cos(M) * u, 0.07, c + Math.sin(M) * u],
          [l + Math.cos(g) * u, 0.07, c + Math.sin(g) * u],
          d,
          [0, 0, 0],
          [0, 0, 0],
        );
      }
    },
    q = hex("#bfe4ff");
  [-33, -42, -57, -68, -92, -112].forEach((t, e) => {
    for (const s of [-1, 1]) U(s * 5.9, t, -s, 0, e % 2 ? q : C.uLamp);
  });
  for (const t of [-34, -54, 34, 54, -78, 78])
    (U(t, -31.3, 0, 1, C.uLamp), U(t, -53.3, 0, 1, q));
  for (const t of [-15, -2, 7])
    for (const e of [-1, 1])
      U(e * 24.6, t, -e, 0, t === -2 ? hex("#ffc2ec") : C.uLamp);
  const X = (t, e, s, r) => {
      const a = trs(m4(), t, 0, e, s, 0, (h() - 0.5) * 0.06, 1, 1, 1);
      (o.add(box(new Geo(), 0, 0.55, 0, 1.8, 0.6, 4.2, r), a),
        o.add(box(new Geo(), 0, 1.1, -0.2, 1.6, 0.55, 2.1, C.uGlass), a));
      for (const [l, c] of [
        [-0.85, 1.3],
        [0.85, 1.3],
        [-0.85, -1.3],
        [0.85, -1.3],
      ])
        o.add(
          cyl(new Geo(), 0, -0.12, 0, 0.36, 0.36, 0.24, 8, C.uDark, C.uDark),
          mul(m4(), a, trs(m4(), l, 0.36, c, 0, 0, Math.PI / 2, 1, 1, 1)),
        );
      if (h() < 0.5)
        for (const l of [-1, 1])
          n.add(
            box(new Geo(), l * 0.6, 0.62, 2.11, 0.35, 0.14, 0.04, C.uLamp),
            a,
          );
      for (const l of [-1, 1])
        n.add(box(new Geo(), l * 0.62, 0.66, -2.11, 0.3, 0.1, 0.04, C.uRed), a);
    },
    B = [
      hex("#7a2a3a"),
      hex("#2a4a7a"),
      hex("#c8b070"),
      hex("#3a3a46"),
      hex("#6a6a7a"),
      hex("#2a6a5a"),
    ];
  for (const [t, e, s] of [
    [1.8, -96, 0.1],
    [-2, -104, Math.PI + 0.2],
    [2.2, -118, 0],
    [-62, -36, 0],
    [-64 - 1.6, -62, Math.PI],
    [62, -40, Math.PI],
    [64 + 1.8, -66, 0.1],
    [-70, -74 + 1.6, Math.PI / 2],
    [-100, -74 - 1.8, -Math.PI / 2],
    [76, -74 + 1.8, Math.PI / 2],
    [-20 + 1.8, -86, 0.05],
    [20 - 1.6, -92, Math.PI],
    [-52, 14 + 1.6, Math.PI / 2 + 0.3],
    [56, 14 - 1.7, -Math.PI / 2],
    [-88 + 1.7, -20, 0],
    [88 - 1.7, -8, Math.PI],
    [-40 + 1.6, 2, 0.2],
    [40 - 1.6, -4, Math.PI - 0.1],
  ])
    X(t, e, s, B[Math.floor(h() * B.length)]);
  for (const t of [-1, 1])
    for (let e = -24; e > -46; e -= 2.6)
      if (e < -30 || e > -24.5) {
        if (Math.abs(e + 26) < 4.5 || Math.abs(e + 48) < 4.5) continue;
        (o.add(
          box(new Geo(), 0, 0.4, 0, 0.6, 0.8, 2.2, C.uConc),
          trs(m4(), t * 4.9, 0, e, 0, 0, 0, 1, 1, 1),
        ),
          box(o, t * 4.9, 0.83, e, 0.3, 0.06, 2.2, C.uAmber));
      }
  ((CITYX.sky = x.mesh()),
    (CITYX.world = o.mesh()),
    (CITYX.glow = n.mesh()),
    (CITYX.pool = f.mesh()),
    (CITYX.bld = p.mesh()));
})();
const SEARCH = [
  { p: [-140, 40, -170], a: 0.3, w: 0.25, ph: 0 },
  { p: [160, 46, -150], a: -0.4, w: -0.2, ph: 2 },
  { p: [-90, 38, 150], a: 2.6, w: 0.18, ph: 4 },
];
function updateCity(o) {
  for (const n of SEARCH) n.a += n.w * o * 0.6;
}
function buildCityFrame() {
  for (const n of CITY.lamps) {
    const f = n.sign
      ? 0.85 + 0.15 * Math.sin(clock * 3 + n.ph)
      : 0.94 + 0.06 * Math.sin(clock * 9 + n.ph);
    ppush(
      PT.glow,
      n.p[0],
      n.p[1],
      n.p[2],
      n.s * f,
      n.c[0],
      n.c[1],
      n.c[2],
      n.a * f,
    );
  }
  for (const n of CITY.beacons) {
    const f = Math.sin(clock * 2.4 + n.ph) > 0.4 ? 1 : 0.15,
      x = n.sky
        ? [n.p[0] + headPos[0], n.p[1] + headPos[1], n.p[2] + headPos[2]]
        : n.p;
    ppush(PT.glow, x[0], x[1], x[2], n.sky ? 5 : 1.4, 1, 0.2, 0.2, 0.8 * f);
  }
  const o = scale3(CITY_MOON, 370);
  ppush(
    PT.glow,
    o[0] + headPos[0],
    o[1] + headPos[1],
    o[2] + headPos[2],
    120,
    0.8,
    0.7,
    1,
    0.2,
  );
}
function renderCity(o) {
  (gl.disable(gl.DEPTH_TEST),
    gl.depthMask(!1),
    gl.useProgram(LIT.p),
    draw(CITYX.sky, trs(MM, o[0], o[1], o[2], 0, 0, 0, 1, 1, 1), W1, 1, 1, 0),
    gl.enable(gl.DEPTH_TEST),
    gl.depthMask(!0),
    draw(CITYX.world, IDENT, W1, 0),
    draw(CITYX.glow, IDENT, [1.1, 1.1, 1.1], 1, 1, 0.12),
    gl.useProgram(TEX.p),
    gl.activeTexture(gl.TEXTURE0),
    drawT(CITYX.bld, WIN_TEX.tex, IDENT, W1, 1, 0, 0.92, 0),
    drawT(
      MESH.quad,
      BILL_TEX.tex,
      trs(
        MM,
        CITYX.bill[0],
        CITYX.bill[1],
        CITYX.bill[2] + 0.01,
        0,
        0,
        0,
        14,
        3.5,
        1,
      ),
      [1.25, 1.25, 1.25],
      1,
      0,
      0.35,
      0,
    ),
    drawT(
      MESH.quad,
      HQ_TEX.tex,
      trs(
        MM,
        CITYX.hqSign[0],
        CITYX.hqSign[1],
        CITYX.hqSign[2],
        Math.PI,
        0,
        0,
        9,
        2.25,
        1,
      ),
      [1.2, 1.2, 1.2],
      1,
      0,
      0.3,
      0,
    ));
}
function renderCityPools() {
  (gl.useProgram(LIT.p),
    gl.enable(gl.BLEND),
    gl.blendFunc(gl.ONE, gl.ONE),
    gl.depthMask(!1),
    gl.enable(gl.POLYGON_OFFSET_FILL),
    gl.polygonOffset(-1, -3),
    draw(CITYX.pool, IDENT, [1, 1, 1], 1, 1, 0.4),
    gl.disable(gl.POLYGON_OFFSET_FILL),
    gl.depthMask(!0),
    gl.disable(gl.BLEND));
}
function renderCityAdd() {
  for (const o of SEARCH) {
    const n = norm([
      Math.sin(o.a) * 0.5,
      0.75 + 0.1 * Math.sin(clock * 0.3 + o.ph),
      -Math.cos(o.a) * 0.5,
    ]);
    draw(MESH.beam, beam(MM, o.p, n, 320, 5), [0.55, 0.6, 1], 1, 0.045, 0);
  }
}
const CITY_TEX = canvasTex(256, 256, (o, n) => {
  const f = n / 2,
    x = n / 2 - 3,
    p = ["#140f24", "#3a1e48", "#140f24", "#5a2a6a"];
  for (let T = 0; T < 4; T++)
    (o.beginPath(),
      o.arc(f, f, x * (1 - T * 0.22), 0, TAU),
      (o.fillStyle = p[T]),
      o.fill());
  (o.save(), o.beginPath(), o.arc(f, f, x * 0.56, 0, TAU), o.clip());
  const h = mulberry(9);
  let E = f - x * 0.6;
  for (; E < f + x * 0.6;) {
    const T = 8 + h() * 14,
      m = 14 + h() * 44;
    ((o.fillStyle = "#0c0916"),
      o.fillRect(E, f + 22 - m, T, m + 40),
      (o.fillStyle = h() < 0.5 ? "#ffcf7a" : "#7fe8ff"));
    for (let w = 0; w < 4; w++)
      o.fillRect(E + 2 + h() * (T - 5), f + 22 - m + 4 + h() * (m - 6), 2, 2);
    E += T + 1;
  }
  ((o.fillStyle = "#ff3aa8"),
    o.fillRect(f - x * 0.6, f + 22, x * 1.2, 3),
    o.restore(),
    (o.font = `30px ${FD}`),
    (o.textAlign = "center"),
    (o.textBaseline = "middle"),
    (o.fillStyle = "#ffc2e6"),
    (o.shadowColor = "#ff3aa8"),
    (o.shadowBlur = 10),
    o.fillText("GRIDLOCK", f, f - x * 0.64, x * 1.3),
    (o.shadowBlur = 0),
    (o.font = `700 18px ${FB}`),
    (o.fillStyle = "#bff6ff"),
    o.fillText("TOWER DEFENSE", f, f + x * 0.66, x * 1.3),
    paperGrain(o, f, x, 9, 700));
});
