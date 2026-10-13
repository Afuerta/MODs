"use strict";
function raySphere(t, i, e, s, a, o) {
  const r = e - t[0],
    f = s - t[1],
    n = a - t[2],
    c = r * i[0] + f * i[1] + n * i[2];
  if (c < 0) return -1;
  const u = r * r + f * f + n * n - c * c;
  return u > o * o ? -1 : Math.max(0, c - Math.sqrt(o * o - u));
}
function castRay(t, i, e = {}) {
  const s = e.maxT || 90,
    a = e.all ? [] : null;
  let o = null,
    r = s;
  const f = (n, c) => {
    ((n.dist = c),
      (n.point = [t[0] + i[0] * c, t[1] + i[1] * c, t[2] + i[2] * c]),
      a ? a.push(n) : ((o = n), (r = c)));
  };
  for (const n of targets) {
    if (n.state !== "live" || n.scale < 0.35 || n.off) continue;
    if (n.flat) {
      if (Math.abs(i[1]) < 1e-4) continue;
      const h = (n.y - t[1]) / i[1];
      if (h < 0 || (!a && h >= r)) continue;
      const b = t[0] + i[0] * h - n.x,
        k = t[2] + i[2] * h - n.z;
      if (
        n.rect
          ? Math.abs(b) > n.rect[0] || Math.abs(k) > n.rect[1]
          : b * b + k * k > n.R * n.R
      )
        continue;
      f({ t: n, ring: 0 }, h);
      continue;
    }
    if (
      n.kind === "clay" ||
      n.kind === "crate" ||
      n.kind === "shop" ||
      n.kind === "coffin" ||
      n.kind === "prize" ||
      n.kind === "loot" ||
      n.kind === "lvl"
    ) {
      const h = raySphere(
        t,
        i,
        n.x,
        n.y,
        n.z,
        n.kind === "clay" ? CLAY_HIT : n.R * 1.2,
      );
      h >= 0 && (a || h < r) && f({ t: n, ring: -1 }, h);
      continue;
    }
    const c = Math.sin(n.yaw),
      u = Math.cos(n.yaw),
      l = i[0] * c + i[2] * u;
    if (Math.abs(l) < 1e-4) continue;
    const p = ((n.x - t[0]) * c + (n.z - t[2]) * u) / l;
    if (p < 0 || (!a && p >= r)) continue;
    const m = t[0] + i[0] * p - n.x,
      d = t[1] + i[1] * p - n.y,
      y = t[2] + i[2] * p - n.z;
    if (n.rect) {
      if (
        Math.abs(m * Math.cos(n.yaw) - y * Math.sin(n.yaw)) > n.rect[0] ||
        Math.abs(d) > n.rect[1]
      )
        continue;
      f({ t: n, ring: 0 }, p);
      continue;
    }
    const z = Math.hypot(m, d, y) / (n.R * n.scale);
    z > 1.08 || f({ t: n, ring: z }, p);
  }
  if (!e.noEnemies) {
    for (const n of enemies) {
      if (n.state === "dead" || n === e.skip) continue;
      let c = 1 / 0,
        u = null;
      for (const l of n.hbw) {
        const p = raySphere(t, i, l[0], l[1], l[2], l[3]);
        p >= 0 && p < c && ((c = p), (u = l));
      }
      u && (a || c < r) && f({ e: n, hb: u }, c);
    }
    for (const n of eshots) {
      if (n.kind === "rift" || n.kind === "hands") continue;
      const c = raySphere(t, i, n.p[0], n.p[1], n.p[2], n.r + 0.1);
      c >= 0 && (a || c < r) && f({ s: n }, c);
    }
  }
  return a ? (a.sort((n, c) => n.dist - c.dist), a) : o;
}
function missEnd(t, i, e = 70) {
  if (i[1] < -0.01) {
    const s = -t[1] / i[1];
    if (s < e) {
      const a = [t[0] + i[0] * s, 0.03, t[2] + i[2] * s];
      puff(a, 4, [0.78, 0.6, 0.5], 0.16, 0.8);
      for (let o = 0; o < 4; o++) {
        const r = rdir(0.8),
          f = rand(1, 2.5);
        part(
          "shard",
          a,
          [r[0] * f, r[1] * f + 1, r[2] * f],
          [0.02, 0.02, 0.02],
          C.dust,
          0.8,
          { grav: 9, bounce: 0.2 },
        );
      }
      return a;
    }
  }
  return [t[0] + i[0] * e, t[1] + i[1] * e, t[2] + i[2] * e];
}
function spreadDir(t, i) {
  const e = rand(0, TAU),
    s = i * Math.sqrt(Math.random()),
    a = Math.abs(t[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0],
    o = norm(cross(a, t)),
    r = cross(t, o);
  return norm([
    t[0] + (o[0] * Math.cos(e) + r[0] * Math.sin(e)) * s,
    t[1] + (o[1] * Math.cos(e) + r[1] * Math.sin(e)) * s,
    t[2] + (o[2] * Math.cos(e) + r[2] * Math.sin(e)) * s,
  ]);
}
function nearMiss(t, i, e) {
  for (const s of enemies) {
    if (s.state === "dead" || s === e || !s.hbw[0]) continue;
    const a = s.hbw[0],
      o = a[0] - t[0],
      r = a[1] - t[1],
      f = a[2] - t[2],
      n = o * i[0] + r * i[1] + f * i[2];
    n > 0 && o * o + r * r + f * f - n * n < 1.1 * 1.1 && flinch(s);
  }
}
const enemyCenter = (t) =>
  t.hbw[0] ? [t.hbw[0][0], t.hbw[0][1], t.hbw[0][2]] : [t.x, t.y + 1, t.z];
function nearestEnemies(t, i, e, s) {
  const a = [];
  for (const o of enemies) {
    if (o.state === "dead" || e.has(o) || o.phased > 0 || !o.hbw[0]) continue;
    const r = enemyCenter(o),
      f = Math.hypot(r[0] - t[0], r[1] - t[1], r[2] - t[2]);
    f < i && a.push([f, o]);
  }
  return (a.sort((o, r) => o[0] - r[0]), a.slice(0, s).map((o) => o[1]));
}
function fire(t) {
  const i = t.inst || PEACE,
    e = WEAPONS[i.id] || WEAPONS.peacemaker,
    s = t.ray.o,
    a = t.ray.d,
    o = inRun() ? RAR[i.rar].dmg * (goldMode() ? metaDmg() : 1) : 1,
    r = t.steady || t.ads,
    f = { W: e, inst: i, dmg: e.dmg * o * (r ? 1.2 : 1), g: t };
  if (
    ((t.cd =
      Math.max(-0.1, t.cd) +
      e.cd * (inRun() ? R.rate : 1) * (hasMod(i, "rate") ? 0.8 : 1)),
    (t.recoil = Math.min(1.8, e.kick || 1) * (r ? 0.5 : 1)),
    (t.heat = Math.min(1, t.heat + (e.auto ? 0.1 : 0.35))),
    !e.beam &&
      e.proj !== "flame" &&
      flashes.push({
        p: t.muzzle.slice(),
        t: 0,
        s: e.pellets ? 0.85 : e.pierce ? 0.75 : 0.5,
        c: e.col,
        muzzle: !0,
      }),
    (sfx[e.snd] || sfx.shot)(),
    e.casing && ejectCasing(t.model, e.casing > 1),
    S.mode === "playing" && S.shots++,
    R.kind === "td" && inRun() && TD.armed && tdStrikeShot(s, a, t))
  )
    return;
  if (e.proj) {
    const u = castRay(s, a, { noEnemies: !0, maxT: 6 });
    if (u && u.t && UI_KINDS.has(u.t.kind)) {
      (tracers.push({
        a: t.muzzle.slice(),
        b: u.point,
        t: 0,
        col: e.col,
        w: 0.01,
      }),
        onTargetHit(u, t));
      return;
    }
    launch(f, t.muzzle, a);
    return;
  }
  const n = (e.spread || 0) * (r ? 0.35 : 1) + (hasMod(i, "split") ? 0.05 : 0);
  if (e.pierce || (hasMod(i, "pierce") && !e.pellets)) {
    pierceShot(f, s, n ? spreadDir(a, n) : a, e.pierce || 2);
    return;
  }
  let c = !1;
  for (let u = 0; u < (e.pellets || 1) + (hasMod(i, "split") ? 2 : 0); u++) {
    let l = n ? spreadDir(a, n) : a,
      p = castRay(s, l);
    if (hasMod(i, "seek") && (!p || !p.e)) {
      const d = seekDir(s, l);
      d && ((l = d), (p = castRay(s, l) || p));
    }
    if (!p && MR.on && !inRun() && S.mode !== "playing" && l[1] < -0.08) {
      const d = -s[1] / l[1];
      d < 12 && placePortal([s[0] + l[0] * d, 0, s[2] + l[2] * d]);
    }
    const m = p ? p.point : missEnd(s, l);
    (tracers.push({
      a: t.muzzle.slice(),
      b: m,
      t: 0,
      col: e.col,
      w: e.tw || 0.014,
    }),
      p ? ((c = !0), applyHit(p, l, f)) : nearMiss(s, l));
  }
  !c && S.mode === "playing" && (S.streak = 0);
}
function seekDir(t, i) {
  let e = null,
    s = Math.cos(0.1);
  for (const a of enemies) {
    if (a.state === "dead" || !a.hbw[0]) continue;
    const o = enemyCenter(a),
      r = norm([o[0] - t[0], o[1] - t[1], o[2] - t[2]]),
      f = r[0] * i[0] + r[1] * i[1] + r[2] * i[2];
    f > s && ((s = f), (e = r));
  }
  return e;
}
function pierceShot(t, i, e, s) {
  const a = t.W,
    o = t.g,
    r = castRay(i, e, { all: !0 }),
    f = (s ?? a.pierce) === !0 ? 99 : (s ?? a.pierce);
  let n = null,
    c = 0;
  const u = new Set();
  for (const l of r) {
    if (l.t) {
      (applyHit(l, e, t), (n = l.point));
      break;
    }
    if (l.s) {
      shootDown(l.s);
      continue;
    }
    if (
      l.e &&
      !u.has(l.e) &&
      (u.add(l.e), hitEnemy(t, l.e, l.hb, l.point, e), ++c >= f)
    ) {
      n = l.point;
      break;
    }
  }
  (n || (n = missEnd(i, e, a.beam ? 40 : 80)),
    a.beam
      ? zaps.push({
          kind: "beam",
          a: o.muzzle.slice(),
          b: n,
          t: 0,
          max: 0.07,
          col: a.col,
          w: a.tw,
        })
      : a.pierce === !0
        ? (zaps.push({
            kind: "beam",
            a: o.muzzle.slice(),
            b: n,
            t: 0,
            max: 0.35,
            col: a.col,
            w: a.tw,
          }),
          zaps.push({
            kind: "beam",
            a: o.muzzle.slice(),
            b: n,
            t: 0,
            max: 0.18,
            col: [1, 1, 1],
            w: a.tw * 0.35,
          }))
        : tracers.push({
            a: o.muzzle.slice(),
            b: n,
            t: 0,
            col: a.col,
            w: a.tw || 0.016,
          }),
    u.size || nearMiss(i, e));
}
function applyHit(t, i, e) {
  const s = e.W,
    a = e.g;
  if (t.s) {
    shootDown(t.s);
    return;
  }
  if (t.t) {
    onTargetHit(t, a);
    return;
  }
  const o = t.e;
  if ((hitEnemy(e, o, t.hb, t.point, i), s.chain)) {
    let r = t.point;
    const f = new Set([o]);
    bolt(a.muzzle, t.point, s.col, 0.022, 0.2);
    for (const n of nearestEnemies(t.point, s.chainR, f, s.chain)) {
      f.add(n);
      const c = enemyCenter(n);
      (bolt(r, c, s.col, 0.016, 0.26),
        hitEnemy(e, n, n.hbw[0], c, null, !1, 0.75),
        (r = c));
    }
  }
  if (
    (s.fx === "shock" &&
      !s.chain &&
      bolt(
        t.point,
        [
          t.point[0] + rand(-0.3, 0.3),
          t.point[1] + rand(-0.3, 0.3),
          t.point[2] + rand(-0.3, 0.3),
        ],
        s.col,
        0.012,
        0.15,
      ),
    s.bounce)
  ) {
    let r = t.point;
    const f = new Set([o]);
    for (let n = 0; n < s.bounce; n++) {
      const c = nearestEnemies(r, s.bounceR, f, 1)[0];
      if (!c) break;
      f.add(c);
      const u = enemyCenter(c);
      (tracers.push({ a: r, b: u, t: 0, col: s.col, w: s.tw }),
        hitEnemy(e, c, c.hbw[0], u, null, !1, 0.8),
        sfx.parry(u),
        (r = u));
    }
  }
}
const UI_KINDS = new Set([
  "table",
  "tdcmd",
  "tdbuild",
  "tdpad",
  "shop",
  "ready",
  "lvl",
  "loot",
  "prize",
  "crate",
  "coffin",
  "armory",
  "start",
]);
function onTargetHit(t, i) {
  const e = t.t,
    s = [e.x, e.y, e.z],
    a = [Math.sin(e.yaw), 0, Math.cos(e.yaw)];
  if (e.td) {
    tdTargetHit(e, t, i);
    return;
  }
  if (e.kind === "coffin") {
    inRun() && hitCoffin(i);
    return;
  }
  if (e.kind === "loot") {
    inRun() && takeLoot(e, i);
    return;
  }
  if (e.kind === "lvl") {
    R.lvlUp && pickLevel(e, i);
    return;
  }
  if (e.kind === "prize") {
    inRun() && takePrize(e, i);
    return;
  }
  if (e.kind === "shop") {
    R.phase === "shop" && buyItem(e, i);
    return;
  }
  if (e.kind === "ready") {
    R.phase === "shop" &&
      (hitBurst(t.point, a, 0),
      sfx.hit(10, 1),
      (e.state = "hit"),
      (e.hitT = 0),
      closeShop());
    return;
  }
  if (e.kind === "armory") {
    if (!inRun() && S.mode !== "playing") {
      const c = armoryRow(t.point);
      c >= 0 &&
        (buyUpgrade(c),
        flashes.push({ p: t.point.slice(), t: 0, s: 0.6, c: [0.8, 0.6, 1] }));
    }
    return;
  }
  if (e.kind === "crate") {
    if (R.phase !== "pick") return;
    ((e.state = "hit"), (e.hitT = 0), crateBurst(e), pickCrate(e, i.hand));
    return;
  }
  if (e.kind === "start") {
    if (S.mode === "playing" || inRun()) return;
    ((e.state = "hit"),
      (e.hitT = 0),
      hitBurst(t.point, a, 0),
      sfx.hit(10, 1),
      e.game === "run"
        ? startRun()
        : e.game === "siege"
          ? startSiege()
          : e.game === "td"
            ? startTD()
            : startRound());
    return;
  }
  if (S.mode !== "playing") return;
  if (((e.state = "hit"), (e.hitT = 0), e.kind === "dud")) {
    ((S.score = Math.max(0, S.score - 20)),
      (S.streak = 0),
      dudBurst(t.point),
      popup("−20", "#ff5a4a", [s[0], s[1] + 0.5, s[2]]),
      sfx.dud());
    return;
  }
  (S.hits++, S.streak++, (S.bestStreak = Math.max(S.bestStreak, S.streak)));
  const o = multiplier();
  let r, f;
  if (e.kind === "clay")
    ((r = 25), (f = "#ffa060"), sfx.clay(), clayBurst(s, [e.vx, e.vy, e.vz]));
  else {
    const c = Math.min(4, Math.floor(t.ring * 5));
    ((r = RING_POINTS[c]),
      (f = ["#ffd257", "#ff6a5a", "#6cb6ff", "#e8e0f0", "#f3eee2"][c]),
      sfx.hit(r, o),
      hitBurst(t.point, a, c));
  }
  const n = r * o;
  ((S.score += n),
    popup("+" + n, f, [s[0], s[1] + (e.kind === "clay" ? 0.35 : 0.55), s[2]]));
}
function aimRay(t, i) {
  return castRay(t, i, { maxT: 60 });
}
function syncGun(t, i) {
  t.inst !== i &&
    ((t.inst = i),
    (t.id = i.id),
    (t.ammo = magSize(i)),
    (t.rel = 0),
    (t.cd = Math.min(t.cd || 0, 0.15)),
    t.ammo !== void 0 && inRun() && (t.swap = 1));
}
function startReload(t) {
  !inRun() ||
    t.rel > 0 ||
    !t.inst ||
    t.ammo >= magSize(t.inst) ||
    ((t.rel = t.relMax = reloadTime(t.inst)), sfx.reload());
}
function triggerGun(t, i) {
  if (((t.cd -= i), (t.pullT -= i), inRun() && R.kind === "td" && TD.ko > 0))
    return !1;
  if (t.rel > 0)
    return (
      (t.rel -= i),
      t.rel <= 0 && ((t.rel = 0), (t.ammo = magSize(t.inst)), sfx.reloaded()),
      !1
    );
  if (t.cd > 0) return !1;
  const e = WEAPONS[t.id] || WEAPONS.peacemaker;
  let s = !1;
  for (
    let a = 0;
    a < 4 && t.cd <= 0 && (t.pullT > 0 || (e.auto && t.held));
    a++
  ) {
    if (((t.pullT = 0), inRun() && t.ammo <= 0)) {
      (sfx.dry(), startReload(t));
      break;
    }
    if ((fire(t), (s = !0), inRun() && --t.ammo <= 0)) {
      startReload(t);
      break;
    }
  }
  return (!s && t.cd < 0 && (t.cd = 0), s);
}
