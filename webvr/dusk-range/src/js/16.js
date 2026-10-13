"use strict";
function part(n, t, c, o, r, s, a = {}) {
  (parts.length > 440 && parts.shift(),
    parts.push({
      kind: n,
      p: t.slice(),
      v: c,
      s: o,
      c: r,
      max: s,
      life: 0,
      rot: [rand(0, TAU), rand(0, TAU), rand(0, TAU)],
      rv: a.rv || [rand(-14, 14), rand(-14, 14), rand(-14, 14)],
      grav: a.grav ?? 7,
      drag: a.drag ?? 0.6,
      bounce: a.bounce ?? 0.3,
      glow: a.glow || 0,
      clink: !!a.clink,
      rest: !1,
    }));
}
const rdir = (n = 0.3) => norm([rand(-1, 1), rand(-0.3, 1) + n, rand(-1, 1)]);
function hitBurst(n, t, c) {
  const o = [
    C.white,
    C.white,
    RING_COLORS[c],
    RING_COLORS[Math.max(0, c - 1)],
    RING_COLORS[Math.min(4, c + 1)],
  ];
  for (let r = 0; r < 30; r++) {
    const s = rdir(0.2),
      a = rand(0.8, 2.6);
    part(
      "cube",
      n,
      [
        s[0] * a - t[0] * rand(0, 1.5),
        s[1] * a + 0.8,
        s[2] * a - t[2] * rand(0, 1.5),
      ],
      [rand(0.05, 0.1), 0.004, rand(0.04, 0.09)],
      o[r % o.length],
      rand(1.4, 2.4),
      {
        grav: 2.2,
        drag: 2.6,
        bounce: 0,
        rv: [rand(-8, 8), rand(-8, 8), rand(-8, 8)],
      },
    );
  }
  for (let r = 0; r < 12; r++) {
    const s = rdir(0.3),
      a = rand(2, 4.5);
    part(
      "cube",
      n,
      [s[0] * a, s[1] * a + 1, s[2] * a],
      [0.012, 0.012, rand(0.05, 0.12)],
      r % 2 ? C.wood : C.woodLt,
      rand(0.8, 1.4),
      { grav: 9, bounce: 0.35 },
    );
  }
  for (let r = 0; r < 6; r++) {
    const s = rdir(0.5),
      a = rand(3, 6);
    part(
      "shard",
      n,
      [s[0] * a, s[1] * a, s[2] * a],
      [0.012, 0.012, 0.012],
      C.flash,
      0.35,
      { grav: 4, glow: 1 },
    );
  }
  (shocks.push({ p: n.slice(), t: 0, r: 0.7, col: [1, 0.85, 0.55] }),
    flashes.push({ p: n.slice(), t: 0, s: 1.4, c: [1, 0.85, 0.55] }));
}
function clayBurst(n, t) {
  for (let c = 0; c < 22; c++) {
    const o = rdir(0.2),
      r = rand(1.5, 4);
    part(
      "shard",
      n,
      [o[0] * r + t[0] * 0.4, o[1] * r + t[1] * 0.3, o[2] * r + t[2] * 0.4],
      [rand(0.02, 0.045), rand(0.008, 0.015), rand(0.02, 0.04)],
      c % 3 ? C.clay : C.clayLt,
      rand(1.2, 2.2),
      { grav: 8, bounce: 0.25 },
    );
  }
  (puff(n, 7, [1, 0.62, 0.4], 0.35, 1.3),
    shocks.push({ p: n.slice(), t: 0, r: 0.6, col: [1, 0.6, 0.3] }),
    flashes.push({ p: n.slice(), t: 0, s: 1.6, c: [1, 0.7, 0.4] }));
}
function dudBurst(n) {
  for (let t = 0; t < 20; t++) {
    const c = rdir(0.2),
      o = rand(1, 3);
    part(
      "cube",
      n,
      [c[0] * o, c[1] * o + 0.6, c[2] * o],
      [rand(0.03, 0.06), 0.004, rand(0.03, 0.06)],
      t % 2 ? C.red : C.dudFace,
      rand(1.2, 2),
      { grav: 2.5, drag: 2.4, bounce: 0 },
    );
  }
  (shocks.push({ p: n.slice(), t: 0, r: 0.7, col: [1, 0.3, 0.25] }),
    flashes.push({ p: n.slice(), t: 0, s: 1.2, c: [1, 0.35, 0.3] }));
}
function crateBurst(n) {
  const t = [n.x, n.y, n.z];
  for (let c = 0; c < 18; c++) {
    const o = rdir(0.4),
      r = rand(1.5, 4);
    part(
      "cube",
      t,
      [o[0] * r, o[1] * r + 1, o[2] * r],
      [rand(0.03, 0.07), 0.015, rand(0.12, 0.3)],
      c % 2 ? C.crate : C.crateDk,
      rand(1.2, 2),
      { grav: 9, bounce: 0.3 },
    );
  }
  for (let c = 0; c < 10; c++) {
    const o = rdir(0.6),
      r = rand(2, 5);
    part(
      "shard",
      t,
      [o[0] * r, o[1] * r, o[2] * r],
      [0.015, 0.015, 0.015],
      C.flash,
      0.5,
      { grav: 3, glow: 1 },
    );
  }
  (puff(t, 8, [0.85, 0.72, 0.55], 0.35, 1.4),
    shocks.push({ p: t.slice(), t: 0, r: 0.9, col: [1, 0.85, 0.55] }),
    flashes.push({ p: t.slice(), t: 0, s: 2, c: [1, 0.85, 0.55] }));
}
function puff(n, t, c, o, r) {
  for (let s = 0; s < t && puffs.length < 180; s++) {
    const a = rdir(0.6),
      e = rand(0.2, 0.7) * r;
    puffs.push({
      p: [n[0] + a[0] * 0.05, n[1] + a[1] * 0.05, n[2] + a[2] * 0.05],
      v: [a[0] * e, a[1] * e * 0.6 + 0.25, a[2] * e],
      t: 0,
      max: rand(0.9, 1.6),
      s0: o * 0.5,
      s1: o * rand(1.6, 2.6),
      c,
    });
  }
}
function ejectCasing(n, t) {
  const c = norm([n[0], n[1], n[2]]),
    o = norm([n[4], n[5], n[6]]),
    r = norm([n[8], n[9], n[10]]),
    s = xf(n, [0.024, 0.03, 0.02]),
    a = rand(1.3, 1.9),
    e = rand(1.4, 2.1);
  part(
    "casing",
    s,
    [
      c[0] * a + o[0] * e + r[0] * 0.3,
      c[1] * a + o[1] * e + r[1] * 0.3,
      c[2] * a + o[2] * e + r[2] * 0.3,
    ],
    t ? [0.011, 0.034, 0.011] : [0.0055, 0.022, 0.0055],
    t ? C.red : C.brass,
    9,
    {
      grav: 9.8,
      drag: 0.2,
      bounce: 0.38,
      clink: !0,
      rv: [rand(-25, 25), rand(-25, 25), rand(-25, 25)],
    },
  );
  let d = 0;
  for (const l of parts) l.kind === "casing" && d++;
  d > 60 &&
    parts.splice(
      parts.findIndex((l) => l.kind === "casing"),
      1,
    );
}
function popup(n, t, c, o = 1) {
  let r = popupPool.find((e) => !e.live);
  if (!r) {
    r = popupPool[0];
    for (const e of popupPool) e.born < r.born && (r = e);
  }
  const s = r.ctx;
  (s.clearRect(0, 0, 256, 128),
    (s.textAlign = "center"),
    (s.textBaseline = "middle"),
    spaced(s, 0));
  const a = n.length > 6 ? 64 : 96;
  ((s.font = `${a}px ${FD}`),
    (s.lineJoin = "round"),
    (s.lineWidth = 14),
    (s.strokeStyle = "rgba(28,23,48,0.92)"),
    s.strokeText(n, 128, 68, 236),
    (s.fillStyle = t),
    s.fillText(n, 128, 68, 236),
    upload(r.tex, r.cvs),
    Object.assign(r, {
      live: !0,
      t: 0,
      born: clock,
      p: c.slice(),
      size:
        (0.45 + Math.hypot(c[0] - headPos[0], c[2] - headPos[2]) * 0.045) * o,
    }));
}
function bolt(n, t, c, o, r) {
  const s = [n.slice()],
    a = 6,
    e = Math.hypot(t[0] - n[0], t[1] - n[1], t[2] - n[2]),
    d = Math.min(0.35, e * 0.08);
  for (let l = 1; l < a; l++) {
    const i = l / a;
    s.push([
      lerp(n[0], t[0], i) + rand(-d, d),
      lerp(n[1], t[1], i) + rand(-d, d),
      lerp(n[2], t[2], i) + rand(-d, d),
    ]);
  }
  (s.push(t.slice()),
    zaps.push({
      kind: "arc",
      pts: s,
      t: 0,
      max: r || 0.22,
      col: c,
      w: o || 0.02,
    }));
}
