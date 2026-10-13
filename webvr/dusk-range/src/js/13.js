"use strict";
const SND = {
  wind: null,
  windF: null,
  windG: null,
  music: null,
  amb: null,
  next: 0,
  step: 0,
  inten: 0,
  ambT: 3,
  owlT: 20,
  bellT: 30,
  hawkT: 25,
  beatT: 0,
};
function noteAt(t, e, a, r, f, u, c, n) {
  const s = actx.createOscillator();
  ((s.type = t),
    s.frequency.setValueAtTime(e, a),
    n && s.frequency.exponentialRampToValueAtTime(n, a + r));
  const i = actx.createGain();
  (i.gain.setValueAtTime(1e-4, a),
    i.gain.exponentialRampToValueAtTime(f, a + 0.012),
    i.gain.exponentialRampToValueAtTime(1e-4, a + r));
  let o = s;
  if (c) {
    const l = actx.createBiquadFilter();
    ((l.type = "lowpass"), (l.frequency.value = c), s.connect(l), (o = l));
  }
  (o.connect(i), i.connect(u), s.start(a), s.stop(a + r + 0.05));
}
function noiseAt(t, e, a, r, f, u, c = "bandpass") {
  const n = actx.createBufferSource();
  n.buffer = noiseBuf;
  const s = actx.createBiquadFilter();
  ((s.type = c), (s.frequency.value = a), (s.Q.value = r));
  const i = actx.createGain();
  (i.gain.setValueAtTime(1e-4, t),
    i.gain.exponentialRampToValueAtTime(f, t + 0.005),
    i.gain.exponentialRampToValueAtTime(1e-4, t + e),
    n.connect(s),
    s.connect(i),
    i.connect(u),
    n.start(t, rand(0, 0.3)),
    n.stop(t + e + 0.05));
}
function soundInit() {
  if (SND.music || !actx) return;
  ((SND.music = actx.createGain()),
    (SND.music.gain.value = 1e-4),
    SND.music.connect(master),
    (SND.amb = actx.createGain()),
    (SND.amb.gain.value = 0.5),
    SND.amb.connect(master));
  const t = actx.createBufferSource();
  ((t.buffer = noiseBuf),
    (t.loop = !0),
    (SND.windF = actx.createBiquadFilter()),
    (SND.windF.type = "bandpass"),
    (SND.windF.frequency.value = 500),
    (SND.windF.Q.value = 0.7),
    (SND.windG = actx.createGain()),
    (SND.windG.gain.value = 0.05),
    t.connect(SND.windF),
    SND.windF.connect(SND.windG),
    SND.windG.connect(SND.amb),
    t.start(),
    (SND.next = actx.currentTime + 0.1));
}
const SCORE = {
  siege: {
    bass: [73.42, 58.27, 49, 55],
    arp: [
      [293.66, 349.23, 440],
      [233.08, 293.66, 349.23],
      [196, 233.08, 293.66],
      [220, 277.18, 329.63],
    ],
  },
  survival: {
    bass: [55, 43.65, 49, 41.2],
    arp: [
      [220, 261.63, 329.63],
      [174.6, 220, 261.63],
      [196, 246.94, 293.66],
      [164.8, 207.65, 246.94],
    ],
  },
};
function audioTick(t) {
  if (!actx || actx.state !== "running") return;
  soundInit();
  const e = actx.currentTime,
    a = MAP.cur === "night",
    r = MAP.cur === "city";
  if (
    (SND.windF.frequency.setTargetAtTime(
      (r ? 210 : a ? 380 : 620) +
        Math.sin(e * 0.13) * (r ? 60 : 180) +
        Math.sin(e * 0.31) * 90,
      e,
      0.6,
    ),
    SND.windG.gain.setTargetAtTime(
      (r ? 0.045 : a ? 0.035 : 0.05) * (0.6 + 0.4 * Math.sin(e * 0.07)),
      e,
      0.8,
    ),
    (SND.ambT -= t),
    (SND.owlT -= t),
    (SND.bellT -= t),
    (SND.hawkT -= t),
    r)
  ) {
    if (SND.owlT <= 0) {
      SND.owlT = rand(22, 45);
      const n = dest([rand(-120, 120), 6, rand(-140, -40)]);
      for (let s = 0; s < 6; s++)
        noteAt("sine", s % 2 ? 640 : 820, e + s * 0.42, 0.42, 0.035, n);
    }
    if (SND.bellT <= 0) {
      SND.bellT = rand(30, 60);
      const n = dest([rand(-80, 80), 2, rand(-100, 20)]);
      (noteAt("sawtooth", 233, e, 0.5, 0.025, n, 900),
        noteAt("sawtooth", 277, e, 0.5, 0.02, n, 900));
    }
    if (SND.hawkT <= 0) {
      SND.hawkT = rand(40, 80);
      const n = dest([rand(-150, 150), 20, -160]);
      for (let s = 0; s < 10; s++)
        noiseAt(e + s * 0.22, 0.18, 300, 1.2, 0.05, n);
    }
  } else if (a) {
    if (SND.ambT <= 0) {
      SND.ambT = rand(0.4, 1.8);
      const n = [headPos[0] + rand(-12, 12), 0.3, headPos[2] + rand(-12, 12)],
        s = dest(n),
        i = rand(4200, 5200);
      for (let o = 0; o < 3; o++)
        noteAt("sine", i, e + o * 0.06, 0.035, 0.03, s);
    }
    if (SND.owlT <= 0) {
      SND.owlT = rand(25, 50);
      const n = dest([rand(-25, 25), 8, rand(-30, -10)]);
      (noteAt("sine", 400, e, 0.35, 0.08, n, 0, 340),
        noteAt("sine", 380, e + 0.55, 0.6, 0.07, n, 0, 320));
    }
    if (SND.bellT <= 0) {
      SND.bellT = rand(40, 70);
      const n = dest([0, 14, -21]);
      for (const [s, i] of [
        [196, 1],
        [392, 0.5],
        [588, 0.3],
        [783, 0.15],
      ])
        noteAt("sine", s, e, 5, 0.12 * i, n);
    }
  } else if (SND.hawkT <= 0) {
    SND.hawkT = rand(30, 60);
    const n = dest([rand(-40, 40), 30, rand(-60, -20)]);
    noteAt("sawtooth", 2200, e, 0.7, 0.03, n, 3e3, 1400);
  }
  let f = 0;
  if (inRun()) {
    const n = liveEnemies(),
      s = enemies.some((i) => i.T.boss && i.state !== "dead");
    ((f =
      R.phase === "fight" || R.phase === "intro"
        ? clamp(0.3 + n * 0.07 + (s ? 0.45 : 0), 0, 1)
        : 0.15),
      (SND.boss = s));
  }
  ((SND.inten += (f - SND.inten) * Math.min(1, t * 0.8)),
    SND.music.gain.setTargetAtTime(SND.inten > 0.04 ? 0.16 : 1e-4, e, 0.8));
  const u = 60 / 104 / 2,
    c = SCORE[R.kind] || SCORE.survival;
  for (
    SND.next < e - 0.5 && (SND.next = e + 0.05);
    SND.inten > 0.04 && SND.next < e + 0.2;
  ) {
    const n = SND.next,
      s = SND.step,
      i = Math.floor(s / 8) % 4,
      o = s % 8,
      l = SND.inten,
      d = SND.music;
    if (
      (o % 2 === 0 &&
        noteAt(
          "sawtooth",
          c.bass[i] * (o === 6 && l > 0.6 ? 2 : 1),
          n,
          u * 1.7,
          0.22,
          d,
          320,
        ),
      l > 0.25)
    ) {
      const h = c.arp[i],
        m = [0, 1, 2, 1, 0, 2, 1, 2][o],
        T = h[m] * (l > 0.75 && (o === 3 || o === 7) ? 2 : 1);
      noteAt("triangle", T, n, u * 0.9, 0.06 + l * 0.04, d);
    }
    if (
      (l > 0.55 &&
        ((o === 0 || o === 4) && noteAt("sine", 120, n, 0.18, 0.35, d, 0, 45),
        (o === 2 || o === 6) && noiseAt(n, 0.12, 1800, 0.8, 0.12, d),
        o % 2 === 1 && noiseAt(n, 0.04, 7e3, 1.5, 0.05, d, "highpass")),
      SND.boss && o === 0)
    )
      for (const h of [c.bass[i] * 2, c.bass[i] * 3, c.bass[i] * 4.75])
        noteAt("sawtooth", h, n, u * 7.5, 0.035, d, 900);
    ((SND.next += u), SND.step++);
  }
  inRun() &&
    PL.hearts === 1 &&
    ((SND.beatT -= t),
    SND.beatT <= 0 &&
      ((SND.beatT = 0.85),
      noteAt("sine", 60, e, 0.12, 0.4, master, 0, 40),
      noteAt("sine", 55, e + 0.18, 0.14, 0.3, master, 0, 38)));
}
Object.assign(sfx, {
  crossbow() {
    (tone("triangle", 900, 300, 0.12, 0.12), hiss(0.18, 2500, 900, 0.3, 2));
  },
  blunder() {
    (hiss(0.45, 1800, 120, 0.9, 0.4),
      tone("sine", 80, 30, 0.4, 0.5),
      tone("sawtooth", 200, 50, 0.3, 0.15));
  },
  tommy() {
    gate("tommy", 0.04) &&
      (hiss(0.07, 2600, 600, 0.38, 0.9), tone("square", 420, 140, 0.05, 0.07));
  },
  harpoon() {
    (tone("sawtooth", 300, 900, 0.18, 0.1),
      hiss(0.25, 3e3, 900, 0.3, 1.5),
      tone("square", 120, 0, 0.05, 0.1, 0.18));
  },
  vortex() {
    (tone("sine", 120, 600, 0.5, 0.25),
      tone("sine", 180, 900, 0.5, 0.12),
      hiss(0.5, 400, 3e3, 0.2, 4));
  },
  spirit() {
    (tone("sine", 700, 1400, 0.25, 0.12),
      tone("triangle", 1400, 2100, 0.3, 0.06, 0.04));
  },
  tesla() {
    gate("tesla", 0.1) &&
      (hiss(0.14, 5e3, 3e3, 0.25, 8), tone("sawtooth", 60, 70, 0.12, 0.08));
  },
  napalm() {
    (tone("sine", 220, 90, 0.25, 0.25), hiss(0.3, 900, 400, 0.3, 1));
  },
  implode(t) {
    const e = dest(t);
    (tone("sine", 600, 40, 0.9, 0.5, 0, e), hiss(0.8, 3e3, 100, 0.5, 1, 0, e));
  },
  levelUp() {
    (arp([523, 659, 784, 1047, 1319, 1568], 0.06, 0.35, 0.18),
      tone("sine", 2093, 0, 0.6, 0.08, 0.36),
      hiss(0.6, 3e3, 9e3, 0.08, 3, 0.1));
  },
  choose() {
    arp([784, 1175, 1568], 0.05, 0.3, 0.18);
  },
  react(t, e) {
    const a = dest(t);
    if (e === "shatter") {
      for (let r = 0; r < 4; r++)
        tone("triangle", rand(2500, 4500), 0, 0.25, 0.1, r * 0.02, a);
      hiss(0.4, 7e3, 3e3, 0.4, 3, 0, a);
    } else
      e === "blast"
        ? (tone("sine", 110, 35, 0.6, 0.6, 0, a),
          hiss(0.6, 1600, 100, 0.7, 0.6, 0, a))
        : e === "surge"
          ? (tone("sawtooth", 200, 800, 0.4, 0.12, 0, a),
            hiss(0.4, 1e3, 4e3, 0.25, 2, 0, a))
          : (tone("square", 1200, 300, 0.3, 0.1, 0, a),
            hiss(0.3, 6e3, 2e3, 0.3, 5, 0, a));
  },
  headpop(t) {
    const e = dest(t);
    (hiss(0.18, 1400, 300, 0.5, 1.2, 0, e),
      tone("sine", 520, 180, 0.12, 0.25, 0, e),
      tone("triangle", 1760, 0, 0.12, 0.06, 0.04));
  },
  streak(t) {
    const e = [392, 440, 494, 523, 587, 659][Math.min(5, t - 2)] || 659;
    arp([e, e * 1.25, e * 1.5, e * 2], 0.05, 0.3, 0.14, 0, "square");
  },
  loot(t, e) {
    const a = dest(t);
    (arp(
      e >= 3
        ? [784, 988, 1175, 1568, 1976]
        : e >= 2
          ? [784, 988, 1175, 1568]
          : [784, 1175],
      0.07,
      0.4,
      0.1,
      0,
      "triangle",
    ),
      tone("sine", 196, 0, 0.8, 0.12, 0, a));
  },
  pickup() {
    arp([1047, 1319, 1568, 2093], 0.04, 0.25, 0.12, 0, "triangle");
  },
  contract() {
    arp([523, 659, 784, 1047, 784, 1047, 1319], 0.08, 0.35, 0.16);
  },
  rankUp() {
    arp([392, 523, 659, 784, 1047, 1319, 1568, 2093], 0.07, 0.5, 0.16);
  },
  flutter(t) {
    if (!gate("flutter", 0.2)) return;
    const e = dest(t);
    for (let a = 0; a < 4; a++)
      noiseAt(actx.currentTime + a * 0.05, 0.04, 2400, 2, 0.12, e);
  },
  fireball(t) {
    const e = dest(t);
    (hiss(0.4, 900, 300, 0.4, 0.8, 0, e),
      tone("sawtooth", 160, 90, 0.35, 0.1, 0, e));
  },
  rumble(t) {
    if (!gate("rumble", 0.25)) return;
    const e = dest(t);
    (hiss(0.5, 160, 90, 0.5, 0.8, 0, e), tone("sine", 45, 38, 0.5, 0.25, 0, e));
  },
  erupt(t) {
    const e = dest(t);
    (hiss(0.5, 700, 120, 0.7, 0.6, 0, e), tone("sine", 90, 35, 0.5, 0.5, 0, e));
  },
  grip() {
    (tone("square", 2400, 0, 0.02, 0.06),
      tone("square", 1600, 0, 0.03, 0.05, 0.03));
  },
  elite(t) {
    const e = dest(t);
    (tone("sawtooth", 150, 300, 0.6, 0.12, 0, e),
      tone("sawtooth", 225, 450, 0.6, 0.08, 0.05, e));
  },
});
