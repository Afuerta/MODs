"use strict";
let benchY = 0;
const benchGoal = () =>
  inRun() || (S.mode === "results" && S.last !== "range") ? -1.25 : 0;
function update(i) {
  if (screenPaused()) return;
  tickGameEffects(i);
  (updateMapFade(i), (timeScale += (1 - timeScale) * Math.min(1, i * 0.7)));
  const t = i * timeScale * (inRun() && R.lvlUp ? 0.3 : 1);
  if (
    ((clock += t),
    (signY += (signGoal - signY) * Math.min(1, t * 3.2)),
    (benchY += (benchGoal() - benchY) * Math.min(1, t * 2.2)),
    (PL.invuln = Math.max(0, PL.invuln - t)),
    (PL.hurt = Math.max(0, PL.hurt - i * 1.6)),
    (PL.heal = Math.max(0, PL.heal - i * 1.5)),
    (PL.shieldFx = Math.max(0, PL.shieldFx - i * 2)),
    S.mode === "playing")
  ) {
    ((S.elapsed += t), (S.timeLeft = Math.max(0, ROUND - S.elapsed)));
    const a = Math.ceil(S.timeLeft);
    if (
      (a !== S.lastSec && ((S.lastSec = a), a <= 5 && a > 0 && sfx.tick()),
      (S.spawnTimer -= t),
      S.spawnTimer <= 0 && S.timeLeft > 0.9)
    ) {
      const e = S.elapsed / ROUND;
      ((S.spawnTimer = lerp(1.05, 0.5, e) * rand(0.75, 1.25)),
        targets.filter((s) => s.state === "live").length < MAX_LIVE &&
          spawnTarget(e));
    }
    S.timeLeft <= 0 && endRound();
  }
  (S.mode === "results" &&
    !S.replaySpawned &&
    clock >= S.replayAt &&
    ((S.replaySpawned = !0), spawnStart()),
    S.mode === "results" &&
      S.returnAt &&
      clock >= S.returnAt &&
      ((S.returnAt = 0),
      switchMap("range", () => {
        (tdReset(),
          (targets = targets.filter((a) => !a.td)),
          (signGoal = SIGN_UP),
          drawSignResults(),
          spawnStart());
      })),
    inRun() &&
      (R.kind === "siege"
        ? siegeUpdate
        : R.kind === "td"
          ? tdUpdate
          : runUpdate)(t),
    tdTick(t),
    updateEnemies(t),
    updateEShots(t),
    updatePShots(t),
    updateFields(t),
    rewardsTick(t, i),
    audioTick(i));
  for (let a = targets.length - 1; a >= 0; a--) {
    const e = targets[a];
    if (((e.age += t), e.state === "hit")) {
      ((e.hitT += t),
        (e.scale = 1 + e.hitT * 3),
        e.hitT > 0.09 && targets.splice(a, 1));
      continue;
    }
    if (e.state === "retract") {
      ((e.scale -= t * 4), e.scale <= 0 && targets.splice(a, 1));
      continue;
    }
    if (e.kind === "popper" || e.kind === "dud") {
      if (e.age < 0.28) e.y = lerp(e.y0, e.y1, easeOutBack(e.age / 0.28));
      else if (e.age < 0.28 + e.hold) e.y = e.y1;
      else if (e.age < 0.28 + e.hold + 0.25)
        e.y = lerp(e.y1, e.y0, Math.pow((e.age - 0.28 - e.hold) / 0.25, 2));
      else {
        targets.splice(a, 1);
        continue;
      }
      e.age < 0.05 &&
        !e.dusted &&
        ((e.dusted = !0), puff([e.x, 0.5, e.z], 5, [0.78, 0.6, 0.5], 0.3, 0.9));
    } else if (e.kind === "floater") {
      if (
        ((e.ang += e.w * t),
        (e.x = Math.sin(e.ang) * e.r),
        (e.z = -Math.cos(e.ang) * e.r),
        (e.y = e.y1 + Math.sin(e.age * 2.3 + e.ph) * 0.16),
        (e.scale =
          e.age < 0.25
            ? Math.max(0.01, easeOutBack(e.age / 0.25))
            : e.age > e.life - 0.25
              ? Math.max(0, (e.life - e.age) / 0.25)
              : 1),
        e.age >= e.life)
      ) {
        targets.splice(a, 1);
        continue;
      }
    } else if (e.kind === "clay") {
      if (
        ((e.vy -= CLAY_G * t),
        (e.x += e.vx * t),
        (e.y += e.vy * t),
        (e.z += e.vz * t),
        (e.spin += t * 9),
        e.trail.push([e.x, e.y, e.z]),
        e.trail.length > 9 && e.trail.shift(),
        (e.age > 0.6 && e.y < 0.3) || e.age > 6)
      ) {
        targets.splice(a, 1);
        continue;
      }
    } else
      e.kind === "start"
        ? ((e.scale = Math.max(
            0.01,
            easeOutBack(clamp((e.age - (e.age0 || 0)) / 0.4, 0, 1)),
          )),
          (e.y = e.y1 + Math.sin(e.age * 1.6 + (e.age0 ? 1.5 : 0)) * 0.04))
        : e.kind === "crate" || e.kind === "shop"
          ? e.landed
            ? (e.y = e.y1 + Math.sin(e.age * 2 + e.ph) * 0.03)
            : ((e.y -= Math.max(1.6, (e.y - e.y1) * 2.6) * t),
              e.y <= e.y1 &&
                ((e.y = e.y1),
                (e.landed = !0),
                puff([e.x, e.y - 0.25, e.z], 6, [0.85, 0.72, 0.55], 0.3, 1),
                sfx.thud([e.x, e.y, e.z])))
          : e.kind === "coffin" || e.kind === "armory" || e.kind === "ready"
            ? ((e.scale = Math.max(
                0.01,
                easeOutBack(clamp(e.age / 0.5, 0, 1)),
              )),
              e.kind === "ready" && (e.y = e.y1 + Math.sin(e.age * 2) * 0.03))
            : e.kind === "loot"
              ? ((e.y = lerp(
                  e.y,
                  e.y1 + Math.sin(e.age * 2.5) * 0.06,
                  Math.min(1, t * 4),
                )),
                (e.scale = Math.min(1, e.age * 3)))
              : e.kind === "lvl"
                ? ((e.scale = Math.max(
                    0.01,
                    easeOutBack(clamp(e.age / 0.35, 0, 1)),
                  )),
                  (e.y = e.y1 + Math.sin(e.age * 2 + e.ph) * 0.03))
                : e.kind === "prize" &&
                  ((e.y = e.y1 + Math.sin(e.age * 2.2) * 0.05),
                  (e.scale = Math.min(1, e.age * 3)));
    e.yaw =
      e.fixedYaw ?? e.faceYaw ?? Math.atan2(headPos[0] - e.x, headPos[2] - e.z);
  }
  const r = benchY > -0.05;
  for (let a = parts.length - 1; a >= 0; a--) {
    const e = parts[a];
    if (((e.life += t), e.life >= e.max)) {
      parts.splice(a, 1);
      continue;
    }
    if (e.rest) continue;
    e.v[1] -= e.grav * t;
    const s = Math.max(0, 1 - e.drag * t);
    ((e.v[0] *= s),
      (e.v[1] *= s),
      (e.v[2] *= s),
      (e.p[0] += e.v[0] * t),
      (e.p[1] += e.v[1] * t),
      (e.p[2] += e.v[2] * t),
      (e.rot[0] += e.rv[0] * t),
      (e.rot[1] += e.rv[1] * t),
      (e.rot[2] += e.rv[2] * t));
    const n =
      (r &&
      Math.abs(e.p[0]) < 0.75 &&
      e.p[2] < -0.69 &&
      e.p[2] > -1.01 &&
      e.p[1] > 0.9
        ? 0.975
        : 0) +
      Math.max(e.s[1], e.s[0]) * 0.5;
    e.p[1] < n &&
      ((e.p[1] = n),
      e.clink &&
        Math.abs(e.v[1]) > 0.5 &&
        Math.hypot(e.p[0] - headPos[0], e.p[2] - headPos[2]) < 4 &&
        sfx.clink(),
      Math.abs(e.v[1]) > 0.6 && e.bounce > 0
        ? ((e.v[1] = -e.v[1] * e.bounce),
          (e.v[0] *= 0.55),
          (e.v[2] *= 0.55),
          (e.rv = e.rv.map((f) => f * 0.5)))
        : ((e.rest = !0),
          e.kind === "casing"
            ? (e.rot[1] = Math.PI / 2)
            : e.s[1] < 0.006 && (e.rot[1] = 0)));
  }
  if (!r)
    for (const a of parts)
      a.rest &&
        a.p[1] > 0.9 &&
        Math.abs(a.p[0]) < 0.75 &&
        a.p[2] < -0.69 &&
        a.p[2] > -1.01 &&
        (a.rest = !1);
  for (let a = tracers.length - 1; a >= 0; a--)
    ((tracers[a].t += t), tracers[a].t > 0.09 && tracers.splice(a, 1));
  for (let a = zaps.length - 1; a >= 0; a--)
    ((zaps[a].t += t), zaps[a].t > zaps[a].max && zaps.splice(a, 1));
  for (let a = flashes.length - 1; a >= 0; a--)
    ((flashes[a].t += t), flashes[a].t > 0.12 && flashes.splice(a, 1));
  for (let a = shocks.length - 1; a >= 0; a--)
    ((shocks[a].t += t), shocks[a].t > 0.28 && shocks.splice(a, 1));
  for (let a = puffs.length - 1; a >= 0; a--) {
    const e = puffs[a];
    if (((e.t += t), e.t > e.max)) {
      puffs.splice(a, 1);
      continue;
    }
    const s = Math.max(0, 1 - 1.6 * t);
    ((e.v[0] *= s),
      (e.v[1] *= s),
      (e.v[2] *= s),
      (e.p[0] += e.v[0] * t + 0.15 * t),
      (e.p[1] += e.v[1] * t),
      (e.p[2] += e.v[2] * t));
  }
  for (const a of popupPool)
    a.live && ((a.t += i), a.t > 0.95 && (a.live = !1));
  if (banner.on) {
    ((banner.t += i), banner.t > banner.dur && (banner.on = !1));
    const a = PL.fwd,
      e = Math.atan2(a[0], -a[2]),
      s = Math.min(1, i * 1.6),
      l = [
        headPos[0] + Math.sin(e) * 3.4,
        headPos[1] + 0.45,
        headPos[2] - Math.cos(e) * 3.4,
      ];
    for (let n = 0; n < 3; n++) banner.p[n] += (l[n] - banner.p[n]) * s;
  }
  (MAP.cur === "night"
    ? updateNight(t)
    : MAP.cur === "city"
      ? updateCity(t)
      : updateAmbient(t),
    drawBoard(!1),
    xrSession && drawWrist(!1));
}
