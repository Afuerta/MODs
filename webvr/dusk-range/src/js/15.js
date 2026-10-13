"use strict";
const ROOM = { pts: [], cx: 0, cz: 0, r: 1, bounded: !1, mesh: null };
function segDist(t, e, o, r) {
  const c = r[0] - o[0],
    i = r[1] - o[1],
    l = c * c + i * i || 1,
    n = clamp(((t - o[0]) * c + (e - o[1]) * i) / l, 0, 1);
  return Math.hypot(t - o[0] - c * n, e - o[1] - i * n);
}
function setRoom(t, e) {
  if (!t || t.length < 3) return;
  let o = 0,
    r = 0;
  for (const n of t) ((o += n[0]), (r += n[1]));
  ((o /= t.length), (r /= t.length));
  let c = 1 / 0;
  for (let n = 0; n < t.length; n++)
    c = Math.min(c, segDist(o, r, t[n], t[(n + 1) % t.length]));
  Object.assign(ROOM, {
    pts: t,
    cx: o,
    cz: r,
    r: clamp(c, 0.5, 6),
    bounded: e,
  });
  const i = new Geo();
  for (let n = 0; n < t.length; n++) {
    const h = t[n],
      s = t[(n + 1) % t.length];
    strut(i, [h[0], 0.014, h[1]], [s[0], 0.014, s[1]], 0.035, C.room);
  }
  for (const n of t.length <= 8 ? t : [])
    cyl(i, n[0], 0, n[1], 0.04, 0.03, 0.12, 6, C.room, C.room);
  const l = 28;
  for (let n = 0; n < l; n++) {
    const h = (n / l) * TAU,
      s = ((n + 0.5) / l) * TAU;
    strut(
      i,
      [o + Math.sin(h) * 0.25, 0.012, r - Math.cos(h) * 0.25],
      [o + Math.sin(s) * 0.25, 0.012, r - Math.cos(s) * 0.25],
      0.02,
      C.room,
    );
  }
  ROOM.mesh = i.mesh();
}
function squareRoom(t, e = 0, o = 0) {
  setRoom(
    [
      [e - t, o - t],
      [e + t, o - t],
      [e + t, o + t],
      [e - t, o + t],
    ],
    !1,
  );
}
function inRoom(t, e) {
  const o = ROOM.pts;
  let r = !1;
  for (let c = 0, i = o.length - 1; c < o.length; i = c++) {
    const [l, n] = o[c],
      [h, s] = o[i];
    n > e != s > e && t < ((h - l) * (e - n)) / (s - n) + l && (r = !r);
  }
  return r;
}
function clampRoom(t, e) {
  if (inRoom(t, e)) return [t, e];
  let o = [ROOM.cx, ROOM.cz],
    r = 1 / 0;
  const c = ROOM.pts;
  for (let i = 0; i < c.length; i++) {
    const l = c[i],
      n = c[(i + 1) % c.length],
      h = n[0] - l[0],
      s = n[1] - l[1],
      d = h * h + s * s || 1,
      u = clamp(((t - l[0]) * h + (e - l[1]) * s) / d, 0, 1),
      f = l[0] + h * u,
      m = l[1] + s * u,
      g = Math.hypot(t - f, e - m);
    g < r &&
      ((r = g), (o = [f + (ROOM.cx - f) * 0.02, m + (ROOM.cz - m) * 0.02]));
  }
  return o;
}
squareRoom(1);
