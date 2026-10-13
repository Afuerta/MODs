"use strict";
const PL = {
  hearts: 5,
  max: 5,
  shield: 0,
  invuln: 0,
  hurt: 0,
  heal: 0,
  shieldFx: 0,
  viewA: 0,
  fwd: [0, 0, -1],
  pos: [0, 0],
  crouch: 0,
  turn: 0,
};
function headDist(t) {
  const e = headPos,
    n = Math.hypot(t[0] - e[0], t[1] - e[1], t[2] - e[2]) - 0.15,
    h = e[1] - 0.3,
    s = Math.max(0.3, e[1] - 1.05),
    i = clamp(t[1], s, h),
    r = e[0] - PL.fwd[0] * 0.06,
    a = e[2] - PL.fwd[2] * 0.06;
  return Math.min(n, Math.hypot(t[0] - r, t[1] - i, t[2] - a) - 0.19);
}
function hapticAll(t, e) {
  if (xrSession) for (const n of xrSession.inputSources) haptic(n, t, e);
}
function hurtPlayer(t) {
  return !inRun() || PL.invuln > 0
    ? !1
    : PL.shield > 0
      ? (PL.shield--,
        (PL.invuln = 0.7),
        (PL.shieldFx = 1),
        sfx.shield(),
        hapticAll(0.4, 60),
        !1)
      : ((PL.hearts = Math.max(0, PL.hearts - t)),
        (PL.invuln = 1),
        (PL.hurt = 1),
        (R.waveHit = !0),
        sfx.hurt(),
        hapticAll(1, 140),
        PL.hearts <= 0 && (R.kind === "td" ? tdKO() : endRun()),
        !0);
}
function healPlayer(t) {
  ((PL.hearts = Math.min(PL.max, PL.hearts + t)), (PL.heal = 1), sfx.heal());
}
