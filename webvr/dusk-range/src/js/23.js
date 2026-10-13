"use strict";
const birds = Array.from({ length: 5 }, (r, n) => ({
    th: rand(0, TAU),
    w: rand(0.1, 0.17) * (n % 2 ? 1 : -1),
    R: rand(26, 46),
    h: rand(22, 34),
    cx: rand(-20, 30),
    cz: rand(-90, -50),
    ph: rand(0, TAU),
  })),
  weed = { on: !1, next: 8, x: 0, z: 0, v: 0, roll: 0, y: 0.45 },
  motes = Array.from({ length: 70 }, () => ({
    p: [rand(-7, 7), rand(0.2, 3.6), rand(-9, 3)],
    ph: rand(0, TAU),
    s: rand(0.012, 0.03),
  }));
let windSpin = 0,
  flagT = 0;
function updateAmbient(r) {
  ((windSpin += r * 1.3), (flagT += r));
  for (const n of birds) n.th += n.w * r;
  (!weed.on &&
    clock > weed.next &&
    ((weed.on = !0),
    (weed.x = -26),
    (weed.z = Math.random() < 0.5 ? rand(-5.2, -5.9) : rand(-17.3, -18.2)),
    (weed.v = rand(2.2, 3.4)),
    (weed.roll = 0)),
    weed.on &&
      ((weed.x += weed.v * r),
      (weed.roll -= (weed.v * r) / 0.45),
      (weed.y = 0.45 + Math.abs(Math.sin(weed.x * 1.3)) * 0.28),
      weed.x > 26 && ((weed.on = !1), (weed.next = clock + rand(16, 34)))));
  for (const n of motes)
    ((n.p[0] += (0.12 + Math.sin(clock * 0.7 + n.ph) * 0.05) * r),
      (n.p[1] += Math.sin(clock * 0.9 + n.ph * 2) * 0.04 * r),
      (n.p[2] += (-0.1 + Math.cos(clock * 0.6 + n.ph) * 0.04) * r),
      n.p[0] > 7 && (n.p[0] -= 14),
      n.p[2] < -9 && (n.p[2] += 12));
}
