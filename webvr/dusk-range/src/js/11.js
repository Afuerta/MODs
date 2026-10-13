"use strict";
const INK = "#2b2140",
  PAPER = "#efe2c6",
  CLAYINK = "#c84e1c",
  sign = panel(1024, 512, 2.4),
  board = panel(640, 320, 2.6),
  wrist = panel(512, 384, 0.15),
  banner = Object.assign(panel(1024, 256, 2.6), { t: 0, dur: 0, on: !1 }),
  popupPool = Array.from({ length: 12 }, () => ({
    ...panel(256, 128, 1),
    live: !1,
    t: 0,
    born: 0,
  }));
function spaced(t, o) {
  "letterSpacing" in t && (t.letterSpacing = o + "px");
}
function signFrame(t) {
  ((t.fillStyle = PAPER), t.fillRect(0, 0, 1024, 512));
  const o = mulberry(3);
  ((t.globalAlpha = 0.06), (t.fillStyle = INK));
  for (let e = 0; e < 260; e++)
    t.fillRect(o() * 1024, o() * 512, o() * 60 + 10, 1.5);
  ((t.globalAlpha = 1),
    (t.strokeStyle = INK),
    (t.lineWidth = 8),
    t.strokeRect(22, 22, 980, 468));
}
function downArrow(t, o, e) {
  (t.beginPath(),
    t.moveTo(o - 22, e - 18),
    t.lineTo(o + 22, e - 18),
    t.lineTo(o, e + 10),
    t.closePath(),
    t.fill());
}
function drawSignMenu() {
  const t = sign.ctx;
  (signFrame(t),
    (t.textBaseline = "alphabetic"),
    spaced(t, 0),
    (t.textAlign = "center"),
    (t.fillStyle = CLAYINK),
    (t.font = `130px ${FD}`),
    t.fillText("DUSK RANGE", 512, 150, 900),
    spaced(t, 4),
    (t.fillStyle = INK),
    (t.font = `600 26px ${FB}`),
    t.fillText("SHOOT A TARGET BELOW TO PICK A MODE", 512, 196, 900));
  const o = !MR.on,
    e = o ? [143, 391, 637, 883] : [196, 512, 828],
    l = o ? 232 : 300;
  ((t.fillStyle = "#c8b89c"), t.fillRect(70, 216, 884, 3));
  for (let i = 1; i < e.length; i++)
    t.fillRect((e[i - 1] + e[i]) / 2, 236, 3, 200);
  const n = (i, a, s, r, c, g) => {
    (spaced(t, 0),
      (t.fillStyle = g),
      (t.font = `${o ? 42 : 50}px ${FD}`),
      t.fillText(a, i, 286, l),
      (t.fillStyle = INK),
      (t.font = `600 ${o ? 21 : 23}px ${FB}`),
      t.fillText(s, i, 328, l),
      t.fillText(r, i, 358, l),
      (t.font = `700 ${o ? 22 : 24}px ${FB}`),
      (t.fillStyle = g),
      t.fillText(c, i, 404, l));
  };
  (n(
    e[0],
    "TARGET RANGE",
    "60 seconds on the clock",
    "Rings, clays, no red X",
    "BEST " + S.best.toLocaleString(),
    INK,
  ),
    n(
      e[1],
      "SURVIVAL",
      "Robots, aliens, beasts",
      "Pick a crate each wave",
      S.bestWave ? "BEST WAVE " + S.bestWave : "NO RUNS YET",
      CLAYINK,
    ),
    n(
      e[2],
      "NIGHT SIEGE",
      "Zombies in Hollow Creek",
      "Gold, coffin, trader",
      S.bestSiege ? "BEST WAVE " + S.bestSiege : "NO SIEGES YET",
      "#3e5a7a",
    ),
    o &&
      n(
        e[3],
        "GRIDLOCK",
        "Neon city tower defense",
        "Build, shoot, hold",
        S.bestTD ? "BEST WAVE " + S.bestTD : "NO GAMES YET",
        "#a0307a",
      ));
  const f = [INK, CLAYINK, "#3e5a7a", "#a0307a"];
  (e.forEach((i, a) => {
    ((t.fillStyle = f[a]), downArrow(t, i, 470));
  }),
    upload(sign.tex, sign.cvs));
}
function drawSignResults() {
  const t = sign.ctx;
  (signFrame(t), (t.textAlign = "left"), (t.textBaseline = "alphabetic"));
  const o = S.last !== "range",
    e = S.last === "siege",
    l = S.last === "td";
  (spaced(t, 0),
    (t.fillStyle = e ? "#3e5a7a" : l ? "#a0307a" : CLAYINK),
    (t.font = `112px ${FD}`),
    t.fillText(
      o && R.extracted
        ? "EXTRACTED"
        : e
          ? "SIEGE OVER"
          : l
            ? "CITY FALLEN"
            : o
              ? "RUN OVER"
              : "ROUND OVER",
      58,
      150,
      640,
    ),
    (t.fillStyle = INK),
    (t.font = `176px ${FD}`),
    t.fillText(o ? "WAVE " + R.wave : S.score.toLocaleString(), 56, 336, 540),
    spaced(t, 4),
    (t.font = `600 28px ${FB}`),
    t.fillText(o ? "REACHED" : "POINTS", 64, 378));
  const n = S.shots ? Math.round((S.hits / S.shots) * 100) : 0;
  ((l
    ? [
        ["GOLD EARNED", "$" + (R.goldTotal || 0).toLocaleString()],
        ["KILLS", String(R.kills)],
        ["SOULS", "+" + (R.souls || 0)],
      ]
    : e
      ? [
          ["GOLD EARNED", "$" + (R.goldTotal || 0).toLocaleString()],
          ["KILLS", String(R.kills)],
          ["SOULS", "+" + (R.souls || 0)],
        ]
      : o
        ? [
            ["SCORE", R.score.toLocaleString()],
            ["KILLS", String(R.kills)],
            ["SOULS", "+" + (R.souls || 0)],
          ]
        : [
            ["HITS", String(S.hits)],
            ["ACCURACY", n + "%"],
            ["BEST STREAK", String(S.bestStreak)],
          ]
  ).forEach(([i, a], s) => {
    const r = 200 + s * 78;
    (spaced(t, 3),
      (t.textAlign = "left"),
      (t.font = `600 26px ${FB}`),
      (t.fillStyle = "#6a5a80"),
      t.fillText(i, 620, r, 200),
      spaced(t, 0),
      (t.textAlign = "right"),
      (t.font = `58px ${FD}`),
      (t.fillStyle = INK),
      t.fillText(a, 962, r + 4, 150));
  }),
    S.newBest &&
      (t.save(),
      t.translate(842, 92),
      t.rotate(-0.08),
      (t.fillStyle = "#ff7a2a"),
      t.fillRect(-120, -34, 240, 64),
      (t.textAlign = "center"),
      (t.fillStyle = INK),
      (t.font = `44px ${FD}`),
      t.fillText("NEW BEST", 0, 16),
      t.restore()),
    (t.textAlign = "left"),
    spaced(t, 2),
    (t.font = `700 34px ${FB}`),
    (t.fillStyle = INK),
    t.fillText("SHOOT A TARGET TO PLAY AGAIN", 62, 448, 900),
    spaced(t, 0),
    upload(sign.tex, sign.cvs));
}
function heart(t, o, e, l, n, f) {
  (t.beginPath(),
    t.moveTo(o, e + l * 0.35),
    t.bezierCurveTo(o, e, o - l * 0.5, e, o - l * 0.5, e + l * 0.32),
    t.bezierCurveTo(o - l * 0.5, e + l * 0.62, o, e + l * 0.8, o, e + l),
    t.bezierCurveTo(
      o,
      e + l * 0.8,
      o + l * 0.5,
      e + l * 0.62,
      o + l * 0.5,
      e + l * 0.32,
    ),
    t.bezierCurveTo(o + l * 0.5, e, o, e, o, e + l * 0.35),
    n && ((t.fillStyle = n), t.fill()),
    f && ((t.lineWidth = 3), (t.strokeStyle = f), t.stroke()));
}
function drawHearts(t, o, e, l, n) {
  for (let f = 0; f < PL.max; f++)
    heart(
      t,
      o + f * n,
      e,
      l,
      f < PL.hearts ? "#ff4a3a" : null,
      f < PL.hearts ? null : "#6a5a80",
    );
  for (let f = 0; f < PL.shield; f++)
    heart(t, o + (PL.max + f) * n, e, l, null, "#8fd8ff");
}
let boardKey = "";
function drawBoard(t) {
  const o = inRun() || (S.mode === "results" && S.last !== "range"),
    e = goldMode() && o,
    l =
      S.mode === "playing"
        ? Math.ceil(S.timeLeft)
        : S.mode === "results"
          ? 0
          : ROUND,
    n = multiplier(),
    f = o
      ? [
          "run",
          R.score,
          R.gold,
          R.wave,
          PL.hearts,
          PL.max,
          PL.shield,
          liveEnemies() + R.queue.length,
          R.phase,
          R.phase === "shop" ? Math.ceil(SIEGE_SHOP_SECONDS - R.phaseT) : 0,
        ].join("|")
      : [S.mode, S.score, l, n, S.streak].join("|");
  if (f === boardKey && !t) return;
  boardKey = f;
  const i = board.ctx,
    a = 640,
    s = 320;
  if (
    ((i.fillStyle = "#1c1730"),
    i.fillRect(0, 0, a, s),
    (i.strokeStyle = "#ff7a2a"),
    (i.lineWidth = 6),
    i.strokeRect(14, 14, a - 28, s - 28),
    (i.textBaseline = "alphabetic"),
    spaced(i, 5),
    (i.font = `600 28px ${FB}`),
    (i.fillStyle = "#b9a6d3"),
    (i.textAlign = "left"),
    i.fillText(e ? "GOLD" : "SCORE", 44, 70),
    (i.textAlign = "right"),
    i.fillText(o ? "WAVE" : "TIME", a - 44, 70),
    spaced(i, 0),
    (i.font = `118px ${FD}`),
    (i.textAlign = "left"),
    (i.fillStyle = "#ffd257"),
    i.fillText(
      e
        ? "$" + R.gold.toLocaleString()
        : (o ? R.score : S.score).toLocaleString(),
      40,
      182,
      380,
    ),
    (i.textAlign = "right"),
    (i.fillStyle =
      !o && S.mode === "playing" && l <= 10 ? "#ff5a4a" : "#f3e3c8"),
    i.fillText(String(o ? R.wave : l), a - 40, 182, 170),
    (i.fillStyle = "#3b2f57"),
    i.fillRect(40, 214, a - 80, 3),
    o)
  ) {
    drawHearts(i, 70, 238, 46, 56);
    const r = liveEnemies() + R.queue.length;
    (spaced(i, 3),
      (i.textAlign = "right"),
      (i.font = `600 26px ${FB}`),
      (i.fillStyle = "#b9a6d3"),
      i.fillText(
        R.phase === "shop"
          ? "TRADER " +
              Math.max(0, Math.ceil(SIEGE_SHOP_SECONDS - R.phaseT)) +
              "s"
          : r
            ? r + " LEFT"
            : "CLEAR",
        a - 44,
        276,
      ));
  } else {
    (spaced(i, 5),
      (i.textAlign = "left"),
      (i.font = `600 28px ${FB}`),
      (i.fillStyle = "#b9a6d3"),
      i.fillText("COMBO", 44, 276),
      spaced(i, 0),
      (i.font = `68px ${FD}`),
      (i.fillStyle = "#ff7a2a"),
      i.fillText("×" + n, 176, 284));
    const r = n >= 4 ? 5 : S.streak % 5;
    for (let c = 0; c < 5; c++)
      (i.beginPath(),
        i.arc(360 + c * 52, 262, 15, 0, TAU),
        c < r
          ? ((i.fillStyle = "#ff7a2a"), i.fill())
          : ((i.lineWidth = 3), (i.strokeStyle = "#5a4a7a"), i.stroke()));
  }
  (spaced(i, 0), upload(board.tex, board.cvs));
}
let wristKey = "";
function gunLine(t, o, e, l, n) {
  ((t.textAlign = "left"),
    (t.font = `600 28px ${FB}`),
    (t.fillStyle = e.rar ? RAR[e.rar].css : "#f3e3c8"),
    t.fillText(o + "  " + WEAPONS[e.id].name, l, n, 330),
    (e.mods || []).forEach((f, i) => {
      (t.beginPath(),
        t.arc(l + 360 + i * 26, n - 9, 9, 0, TAU),
        (t.fillStyle = MODS[f].css),
        t.fill());
    }));
  for (let f = (e.mods || []).length; f < e.rar + 1; f++)
    (t.beginPath(),
      t.arc(l + 360 + f * 26, n - 9, 8, 0, TAU),
      (t.lineWidth = 2),
      (t.strokeStyle = "#5a4a7a"),
      t.stroke());
}
function drawWrist(t) {
  const o = inRun(),
    e = o
      ? [
          "r",
          PL.hearts,
          PL.max,
          PL.shield,
          R.wave,
          R.gold,
          R.lvl,
          Math.floor(R.xp * 10),
          Math.floor(R.combo / 5),
          JSON.stringify(R.weapons),
          (R.contracts || [])
            .map((n) => n.done + ":" + Math.min(n.n, R.stat[n.c.stat] || 0))
            .join(),
          liveEnemies() + R.queue.length,
          TD.core,
        ].join("|")
      : ["g", S.mode, S.score, Math.ceil(S.timeLeft), MR.portals.length].join(
          "|",
        );
  if (e === wristKey && !t) return;
  wristKey = e;
  const l = wrist.ctx;
  (l.clearRect(0, 0, 512, 384),
    (l.fillStyle = "rgba(28,23,48,0.9)"),
    l.beginPath(),
    l.roundRect ? l.roundRect(6, 6, 500, 372, 26) : l.rect(6, 6, 500, 372),
    l.fill(),
    (l.strokeStyle = "#ff7a2a"),
    (l.lineWidth = 5),
    l.stroke(),
    (l.textBaseline = "alphabetic"),
    o
      ? (drawHearts(l, 40, 24, 44, 52),
        (l.textAlign = "right"),
        (l.font = `56px ${FD}`),
        (l.fillStyle = "#ffd257"),
        l.fillText(goldMode() ? "$" + R.gold : "W" + R.wave, 488, 70, 190),
        gunLine(l, "L", R.weapons.left, 26, 124),
        gunLine(l, "R", R.weapons.right, 26, 164),
        (l.textAlign = "left"),
        (l.font = `44px ${FD}`),
        (l.fillStyle = "#7fe0a0"),
        l.fillText("LV " + R.lvl, 26, 222),
        (l.fillStyle = "#3b2f57"),
        l.fillRect(150, 196, 220, 16),
        (l.fillStyle = "#7fe0a0"),
        l.fillRect(150, 196, 220 * Math.min(1, R.xp / xpNext(R.lvl)), 16),
        (l.textAlign = "right"),
        (l.font = `600 26px ${FB}`),
        (l.fillStyle = R.combo > 4 ? "#ff7a2a" : "#b9a6d3"),
        l.fillText(
          R.combo > 1
            ? "COMBO x" + comboMul().toFixed(1)
            : R.kind === "td"
              ? "BEACON " + TD.core
              : goldMode()
                ? "W" + R.wave
                : "",
          488,
          214,
        ),
        (l.textAlign = "left"),
        (l.font = `600 22px ${FB}`),
        (R.contracts || []).forEach((n, f) => {
          const i = 262 + f * 34,
            a = Math.min(n.n, R.stat[n.c.stat] || 0);
          ((l.fillStyle = n.done ? "#7fe0a0" : "#d8cce8"),
            l.fillText((n.done ? "✓ " : "◇ ") + n.c.text(n.n), 26, i, 360),
            (l.textAlign = "right"),
            l.fillText(n.done ? "DONE" : a + "/" + n.n, 488, i),
            (l.textAlign = "left"));
        }))
      : ((l.textAlign = "left"),
        (l.font = `600 30px ${FB}`),
        (l.fillStyle = "#b9a6d3"),
        l.fillText(
          S.mode === "playing"
            ? "SCORE"
            : MR.on
              ? "PORTALS " + MR.portals.length + "/4"
              : "DUSK RANGE",
          34,
          70,
        ),
        (l.font = `96px ${FD}`),
        (l.fillStyle = "#ffd257"),
        l.fillText(
          S.mode === "playing" ? S.score.toLocaleString() : "READY",
          30,
          180,
          300,
        ),
        S.mode === "playing" &&
          ((l.textAlign = "right"),
          (l.fillStyle = "#f3e3c8"),
          l.fillText(String(Math.ceil(S.timeLeft)), 486, 180, 150)),
        (l.textAlign = "left"),
        (l.font = `600 24px ${FB}`),
        (l.fillStyle = "#c9a8ff"),
        l.fillText(
          "RANK " + rankOf(META.total) + "  ·  " + META.souls + " SOULS",
          34,
          250,
          440,
        ),
        MR.on &&
          ((l.fillStyle = "#8fdcff"),
          l.fillText(
            "Aim at the floor + trigger: place a portal",
            34,
            300,
            440,
          ))),
    upload(wrist.tex, wrist.cvs));
}
function showBanner(t, o) {
  const e = banner.ctx;
  e.clearRect(0, 0, 1024, 256);
  const l = e.createLinearGradient(0, 0, 1024, 0);
  (l.addColorStop(0, "rgba(28,23,48,0)"),
    l.addColorStop(0.18, "rgba(28,23,48,0.82)"),
    l.addColorStop(0.82, "rgba(28,23,48,0.82)"),
    l.addColorStop(1, "rgba(28,23,48,0)"),
    (e.fillStyle = l),
    e.fillRect(0, 30, 1024, 196),
    (e.fillStyle = "#ff7a2a"),
    e.fillRect(180, 30, 664, 4),
    e.fillRect(180, 222, 664, 4),
    (e.textAlign = "center"),
    (e.textBaseline = "alphabetic"),
    spaced(e, 0),
    (e.font = `112px ${FD}`),
    (e.fillStyle = "#f3e3c8"),
    e.fillText(t, 512, 150, 900),
    spaced(e, 4),
    (e.font = `600 32px ${FB}`),
    (e.fillStyle = "#ffb35a"),
    e.fillText(o || "", 512, 200, 880),
    spaced(e, 0),
    upload(banner.tex, banner.cvs),
    (banner.on = !0),
    (banner.t = 0),
    (banner.dur = 2.6));
  const n = PL.fwd,
    f = Math.atan2(n[0], -n[2]);
  banner.p = [
    headPos[0] + Math.sin(f) * 3.4,
    headPos[1] + 0.45,
    headPos[2] - Math.cos(f) * 3.4,
  ];
}
function hideBanner() {
  banner.on = !1;
}
