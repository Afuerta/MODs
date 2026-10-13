"use strict";
function loadNum(e) {
  try {
    return parseInt(localStorage.getItem(e) || "0", 10) || 0;
  } catch {
    return 0;
  }
}
function saveNum(e, a) {
  try {
    localStorage.setItem(e, String(a));
  } catch {}
}
const S = {
  mode: "menu",
  last: "range",
  score: 0,
  timeLeft: ROUND,
  elapsed: 0,
  streak: 0,
  bestStreak: 0,
  shots: 0,
  hits: 0,
  best: loadNum("dusk-range-best"),
  bestWave: loadNum("dusk-range-best-wave"),
  bestRun: loadNum("dusk-range-best-run"),
  bestSiege: loadNum("dusk-range-best-siege"),
  bestTD: loadNum("dusk-range-best-td"),
  returnAt: 0,
  newBest: !1,
  spawnTimer: 0,
  lastSec: ROUND,
  replayAt: 0,
  replaySpawned: !0,
};
let targets = [],
  parts = [],
  tracers = [],
  flashes = [],
  shocks = [],
  puffs = [],
  clock = 0,
  signY = SIGN_UP,
  signGoal = SIGN_UP,
  timeScale = 1,
  xrSession = null,
  refSpace = null,
  boundedSpace = null,
  overlayOpen = !0;
const headPos = [0, 1.6, 0],
  MAX_LIVE = 7,
  CLAY_G = 3.2,
  CLAY_HIT = 0.3,
  multiplier = () => Math.min(4, 1 + Math.floor(S.streak / 5)),
  inRun = () => S.mode === "run";
function updateBestOut() {
  bestOut.textContent =
    (S.best ? S.best.toLocaleString() : "—") +
    " range  ·  " +
    (S.bestWave ? "wave " + S.bestWave : "—") +
    " survival  ·  " +
    (S.bestSiege ? "wave " + S.bestSiege : "—") +
    " siege  ·  " +
    (S.bestTD ? "wave " + S.bestTD : "—") +
    " gridlock";
}
updateBestOut();
function playArc() {
  return xrSession ? 1.2 : flatArc;
}
function pickAngle(e) {
  let a = 0;
  for (
    let r = 0;
    r < 8 &&
    ((a = rand(-e, e)),
    !targets.every(
      (t) =>
        t.state !== "live" ||
        t.kind === "clay" ||
        Math.abs(Math.atan2(t.x, -t.z) - a) > 0.16,
    ));
    r++
  );
  return a;
}
function addTarget(e) {
  return (
    (e.age = 0),
    (e.state = "live"),
    (e.scale = e.scale ?? 1),
    (e.yaw = 0),
    (e.hitT = 0),
    targets.push(e),
    e
  );
}
function spawnStart() {
  targets = targets.filter((t) => t.kind !== "start");
  const e = MR.on ? ["range", "run", "siege"] : ["range", "run", "siege", "td"],
    a = e.length,
    r = a > 3 ? 0.98 : 1.05;
  (e.forEach((t, s) =>
    addTarget({
      kind: "start",
      game: t,
      R: a > 3 ? 0.39 : 0.42,
      x: (s - (a - 1) / 2) * r,
      y: START_POS[1],
      z: START_POS[2],
      y1: START_POS[1],
      scale: 0,
      age0: s * 0.12,
    }),
  ),
    addArmory());
}
function spawnTarget(e) {
  const a = playArc(),
    r = Math.random();
  let t = "popper";
  if (
    (S.elapsed > 7 && r < 0.12
      ? (t = "dud")
      : S.elapsed > 4 && r < 0.24
        ? (t = "clay")
        : r < 0.56 && (t = "floater"),
    t === "clay")
  ) {
    const n = Math.random() < 0.5 ? -1 : 1,
      l = n * Math.min(a + 0.15, 1.3),
      o = -n * a * rand(0.2, 0.7),
      i = lerp(2.7, 1.9, e) * rand(0.9, 1.1),
      d = 14,
      f = rand(9, 12),
      u = Math.sin(l) * d,
      c = -Math.cos(l) * d,
      g = Math.sin(o) * f,
      h = -Math.cos(o) * f,
      p = 1;
    (addTarget({
      kind: t,
      R: 0.16,
      x: u,
      y: p,
      z: c,
      vx: (g - u) / i,
      vz: (h - c) / i,
      vy: (0.6 - p + 0.5 * CLAY_G * i * i) / i,
      spin: 0,
      trail: [],
    }),
      puff([u, 1, c], 4, [0.85, 0.75, 0.68], 0.25, 0.9));
    return;
  }
  const s = pickAngle(a);
  if (t === "floater") {
    const n = rand(4.8, 9);
    addTarget({
      kind: t,
      R: 0.34,
      ang: s,
      r: n,
      w:
        (Math.random() < 0.5 ? -1 : 1) *
        rand(0.12, 0.3) *
        (1 + e * 0.8) *
        (6 / n),
      y1: rand(1.35, 2.7),
      ph: rand(0, TAU),
      life: lerp(3.8, 2.3, e),
      x: Math.sin(s) * n,
      y: 2,
      z: -Math.cos(s) * n,
      scale: 0,
    });
  } else {
    const n = BERMS[Math.random() < 0.4 ? 0 : Math.random() < 0.6 ? 1 : 2],
      l = 0.42,
      o = n.r + 0.6;
    addTarget({
      kind: t,
      R: l,
      x: Math.sin(s) * o,
      z: -Math.cos(s) * o,
      y0: -l - 0.2,
      y1: n.h + l + rand(0.12, 0.45),
      y: -l - 0.2,
      hold: t === "dud" ? lerp(2.3, 1.7, e) : lerp(2.5, 1.35, e),
    });
  }
}
function resetToMenu() {
  clearGameEffects();
  resetExpedition();
  ((MAP.cur !== "range" || MAP.next) &&
    ((MAP.cur = "range"),
    (MAP.next = null),
    (MAP.then = null),
    (MAP.fade = 0),
    applyMapLighting()),
    (S.returnAt = 0),
    (COFFIN.t = null),
    (COFFIN.prize = null),
    tdReset(),
    (S.mode = "menu"),
    (targets = []),
    (tracers = []),
    (flashes = []),
    (shocks = []),
    (puffs = []),
    (parts = parts.filter((e) => e.kind === "casing")),
    clearEnemies(),
    (R.weapons.left = makeGun("peacemaker")),
    (R.weapons.right = makeGun("peacemaker")),
    (timeScale = 1),
    (PL.hurt = 0),
    (R.lvlUp = null),
    (signGoal = SIGN_UP),
    drawSignMenu(),
    spawnStart(),
    drawBoard(!0),
    hideBanner());
}
function startRound() {
  clearGameEffects();
  ((R.weapons.left = makeGun("peacemaker")),
    (R.weapons.right = makeGun("peacemaker")),
    (targets = targets.filter((e) => e.kind !== "armory")));
  for (const e of targets)
    e.kind === "start" && e.state === "live" && (e.state = "retract");
  (Object.assign(S, {
    mode: "playing",
    last: "range",
    score: 0,
    timeLeft: ROUND,
    elapsed: 0,
    streak: 0,
    bestStreak: 0,
    shots: 0,
    hits: 0,
    newBest: !1,
    spawnTimer: 0.9,
    lastSec: ROUND,
    replaySpawned: !0,
  }),
    (signGoal = SIGN_DOWN),
    sfx.start(),
    drawBoard(!0));
}
function endRound() {
  ((S.mode = "results"), (S.timeLeft = 0));
  for (const e of targets) e.state === "live" && (e.state = "retract");
  (S.score > S.best &&
    ((S.best = S.score),
    (S.newBest = !0),
    saveNum("dusk-range-best", S.best),
    updateBestOut(),
    sfx.best()),
    sfx.end(),
    drawSignResults(),
    (signGoal = SIGN_UP),
    (S.replayAt = clock + 1.5),
    (S.replaySpawned = !1),
    drawBoard(!0));
}
