"use strict";
let actx = null,
  master = null,
  noiseBuf = null,
  lastClink = 0;
const sndGate = {};
function audio() {
  if (typeof PLAY !== "undefined" && PLAY.paused) return null;
  if (!actx) {
    const t = window.AudioContext || window.webkitAudioContext;
    if (!t) return null;
    try {
      actx = new t();
      const e = actx.createDynamicsCompressor();
      ((e.threshold.value = -14),
        (e.ratio.value = 4),
        e.connect(actx.destination),
        (master = actx.createGain()),
        (master.gain.value = PLAY.volume),
        master.connect(e),
        (noiseBuf = actx.createBuffer(
          1,
          (actx.sampleRate * 0.6) | 0,
          actx.sampleRate,
        )));
      const n = noiseBuf.getChannelData(0);
      for (let o = 0; o < n.length; o++) n[o] = Math.random() * 2 - 1;
    } catch {
      return ((actx = null), null);
    }
  }
  return (actx.state === "suspended" && actx.resume().catch(() => {}), actx);
}
function gate(t, e) {
  const n = clock;
  return n - (sndGate[t] ?? -9) < e ? !1 : ((sndGate[t] = n), !0);
}
function setAP(t, e) {
  t && (t.value = e);
}
function setListener(t, e, n) {
  if (!actx) return;
  const o = actx.listener;
  o.positionX
    ? (setAP(o.positionX, t[0]),
      setAP(o.positionY, t[1]),
      setAP(o.positionZ, t[2]),
      setAP(o.forwardX, e[0]),
      setAP(o.forwardY, e[1]),
      setAP(o.forwardZ, e[2]),
      setAP(o.upX, n[0]),
      setAP(o.upY, n[1]),
      setAP(o.upZ, n[2]))
    : o.setPosition &&
      (o.setPosition(t[0], t[1], t[2]),
      o.setOrientation(e[0], e[1], e[2], n[0], n[1], n[2]));
}
function dest(t) {
  if (!audio()) return null;
  if (!t) return master;
  const e = actx.createPanner();
  return (
    (e.panningModel = "HRTF"),
    (e.distanceModel = "inverse"),
    (e.refDistance = 1.6),
    (e.rolloffFactor = 0.9),
    (e.maxDistance = 120),
    e.positionX
      ? ((e.positionX.value = t[0]),
        (e.positionY.value = t[1]),
        (e.positionZ.value = t[2]))
      : e.setPosition(t[0], t[1], t[2]),
    e.connect(master),
    e
  );
}
function env(t, e, n, o) {
  (t.gain.setValueAtTime(1e-4, e),
    t.gain.exponentialRampToValueAtTime(n, e + 0.006),
    t.gain.exponentialRampToValueAtTime(1e-4, e + o));
}
function tone(t, e, n, o, a, c = 0, u) {
  if (!audio()) return;
  const s = actx.currentTime + c,
    i = actx.createOscillator();
  ((i.type = t),
    i.frequency.setValueAtTime(e, s),
    n && i.frequency.exponentialRampToValueAtTime(n, s + o));
  const r = actx.createGain();
  (env(r, s, a, o),
    i.connect(r),
    r.connect(u || master),
    i.start(s),
    i.stop(s + o + 0.05));
}
function hiss(t, e, n, o, a = 1, c = 0, u) {
  if (!audio()) return;
  const s = actx.currentTime + c,
    i = actx.createBufferSource();
  i.buffer = noiseBuf;
  const r = actx.createBiquadFilter();
  ((r.type = "bandpass"),
    (r.Q.value = a),
    r.frequency.setValueAtTime(e, s),
    r.frequency.exponentialRampToValueAtTime(n, s + t));
  const l = actx.createGain();
  (env(l, s, o, t),
    i.connect(r),
    r.connect(l),
    l.connect(u || master),
    i.start(s),
    i.stop(s + t + 0.05));
}
const arp = (t, e, n, o, a = 0, c = "triangle") =>
    t.forEach((u, s) => tone(c, u, 0, n, o, a + s * e)),
  sfx = {
    shot() {
      (hiss(0.13, 3400, 500, 0.45, 0.8), tone("square", 1500, 210, 0.1, 0.09));
    },
    scatter() {
      (hiss(0.28, 2400, 160, 0.75, 0.5),
        tone("square", 320, 60, 0.2, 0.16),
        tone("sawtooth", 120, 40, 0.25, 0.12));
    },
    hornet() {
      gate("hornet", 0.04) &&
        (hiss(0.06, 4200, 900, 0.3, 1.2),
        tone("square", 2100, 600, 0.05, 0.05));
    },
    rail() {
      (tone("sawtooth", 220, 1800, 0.12, 0.12),
        hiss(0.4, 6e3, 600, 0.5, 2),
        tone("sine", 90, 40, 0.5, 0.35));
    },
    arc() {
      (hiss(0.25, 5e3, 2500, 0.4, 6),
        tone("sawtooth", 70, 140, 0.22, 0.14),
        tone("square", 1300, 400, 0.12, 0.05));
    },
    boom() {
      (tone("sine", 180, 70, 0.18, 0.35), hiss(0.14, 900, 300, 0.4, 0.8));
    },
    rico() {
      (hiss(0.12, 3800, 600, 0.45, 0.8),
        tone("triangle", 2600, 3400, 0.16, 0.08, 0.03));
    },
    six() {
      (hiss(0.2, 2600, 300, 0.6, 0.7),
        tone("square", 900, 120, 0.14, 0.12),
        tone("sine", 110, 50, 0.2, 0.3));
    },
    lever() {
      (hiss(0.22, 3e3, 300, 0.6, 0.7),
        tone("sine", 140, 60, 0.25, 0.3),
        tone("square", 2400, 0, 0.03, 0.05, 0.22),
        tone("square", 1800, 0, 0.03, 0.05, 0.3));
    },
    sniper() {
      (hiss(0.5, 4e3, 200, 0.8, 0.5),
        tone("sine", 90, 30, 0.6, 0.5),
        tone("square", 1200, 200, 0.2, 0.1));
    },
    gatling() {
      gate("gat", 0.03) &&
        (hiss(0.07, 3e3, 700, 0.35, 1), tone("square", 600, 200, 0.05, 0.06));
    },
    flame() {
      gate("flame", 0.12) &&
        (hiss(0.2, 900, 1400, 0.3, 0.4), hiss(0.18, 300, 200, 0.2, 0.7));
    },
    frost() {
      (tone("sine", 2400, 900, 0.18, 0.12),
        hiss(0.2, 7e3, 4e3, 0.18, 4),
        tone("triangle", 3600, 0, 0.12, 0.05, 0.04));
    },
    acid() {
      (tone("sine", 300, 120, 0.2, 0.25), hiss(0.18, 1400, 500, 0.25, 2));
    },
    rocket() {
      (hiss(0.6, 600, 2400, 0.5, 0.6), tone("sawtooth", 120, 60, 0.3, 0.15));
    },
    saw() {
      (tone("sawtooth", 900, 1400, 0.3, 0.1), hiss(0.25, 5e3, 3e3, 0.25, 3));
    },
    plasma() {
      (tone("sine", 160, 520, 0.35, 0.3),
        tone("sawtooth", 80, 160, 0.35, 0.08),
        hiss(0.3, 1200, 3e3, 0.15, 3));
    },
    leech() {
      (tone("sine", 520, 260, 0.16, 0.14), hiss(0.12, 2400, 900, 0.2, 2));
    },
    thunder() {
      (hiss(0.3, 2600, 200, 0.75, 0.5),
        tone("sawtooth", 90, 45, 0.3, 0.2),
        hiss(0.2, 6e3, 3e3, 0.3, 6, 0.02));
    },
    beam() {
      gate("beam", 0.14) &&
        (tone("sine", 880, 900, 0.16, 0.06),
        tone("sine", 1320, 1300, 0.16, 0.03));
    },
    nail() {
      gate("nail", 0.04) &&
        (tone("square", 1500, 500, 0.05, 0.07), hiss(0.05, 4e3, 2e3, 0.2, 2));
    },
    reload() {
      (tone("square", 900, 0, 0.03, 0.08),
        tone("square", 600, 0, 0.03, 0.06, 0.08),
        hiss(0.08, 3e3, 1500, 0.15, 3, 0.04));
    },
    reloaded() {
      (tone("square", 1400, 0, 0.03, 0.09),
        tone("square", 2e3, 0, 0.03, 0.08, 0.06));
    },
    dry() {
      gate("dry", 0.15) && tone("square", 1800, 0, 0.02, 0.06);
    },
    burn(t) {
      if (!gate("burn", 0.2)) return;
      const e = dest(t);
      hiss(0.5, 600, 1600, 0.3, 0.6, 0, e);
    },
    freeze(t) {
      const e = dest(t);
      (tone("sine", 3e3, 1200, 0.3, 0.15, 0, e),
        hiss(0.35, 8e3, 5e3, 0.25, 5, 0, e),
        tone("triangle", 2400, 0, 0.2, 0.08, 0.1, e));
    },
    coin() {
      gate("coin", 0.05) &&
        (tone("square", 1568, 0, 0.06, 0.05),
        tone("square", 2093, 0, 0.12, 0.05, 0.05));
    },
    buy() {
      (arp([523, 784, 1047, 1319], 0.05, 0.2, 0.16),
        tone("square", 2093, 0, 0.15, 0.04, 0.2));
    },
    deny() {
      (tone("square", 180, 140, 0.18, 0.12),
        tone("square", 150, 120, 0.2, 0.1, 0.14));
    },
    boxTick(t) {
      const e = dest(t);
      tone("triangle", rand(700, 1400), 0, 0.06, 0.12, 0, e);
    },
    boxOpen(t) {
      const e = dest(t);
      (tone("sawtooth", 70, 50, 0.6, 0.18, 0, e),
        hiss(0.6, 300, 900, 0.3, 1, 0, e),
        arp([392, 466, 554], 0.12, 0.4, 0.1, 0.2, "sine"));
    },
    boxDone(t, e) {
      const n = dest(t);
      (arp(
        e >= 3
          ? [523, 659, 784, 1047, 1319, 1568]
          : e >= 2
            ? [523, 659, 784, 1047]
            : [523, 659, 784],
        0.06,
        0.25,
        0.16,
      ),
        tone("sine", 220, 0, 0.6, 0.12, 0, n));
    },
    groan(t) {
      if (!gate("groan", 0.35)) return;
      const e = dest(t),
        n = rand(80, 140);
      (tone("sawtooth", n, n * 0.7, 0.9, 0.09, 0, e),
        tone("sine", n * 2, n * 1.3, 0.8, 0.06, 0.05, e),
        hiss(0.7, 400, 250, 0.08, 2, 0, e));
    },
    zbite(t) {
      const e = dest(t);
      (hiss(0.2, 1500, 400, 0.45, 1, 0, e),
        tone("sawtooth", 160, 70, 0.22, 0.2, 0, e));
    },
    slam(t) {
      const e = dest(t);
      (tone("sine", 70, 28, 0.7, 0.7, 0, e),
        hiss(0.6, 500, 80, 0.7, 0.5, 0, e));
    },
    scream(t) {
      const e = dest(t);
      (tone("sawtooth", 900, 1700, 0.9, 0.12, 0, e),
        tone("sawtooth", 1350, 2200, 0.9, 0.08, 0.04, e),
        hiss(0.9, 3e3, 6e3, 0.12, 3, 0, e));
    },
    hit(t, e) {
      const n = 620 * Math.pow(2, (t / 10) * 0.6 + (e - 1) * 0.17);
      (tone("triangle", n, 0, 0.24, 0.3),
        tone("sine", n * 1.5, 0, 0.32, 0.16, 0.035),
        t >= 10 && tone("sine", n * 2, 0, 0.5, 0.15, 0.08));
    },
    clay() {
      (hiss(0.3, 2200, 260, 0.5, 0.6),
        tone("triangle", 990, 0, 0.3, 0.22),
        tone("triangle", 1320, 0, 0.36, 0.18, 0.06));
    },
    dud() {
      (tone("sawtooth", 150, 70, 0.38, 0.22),
        tone("square", 96, 60, 0.38, 0.12));
    },
    tick() {
      tone("square", 1760, 0, 0.05, 0.1);
    },
    clink() {
      if (!actx || clock - lastClink < 0.06) return;
      lastClink = clock;
      const t = rand(3600, 5200);
      (tone("triangle", t, 0, 0.05, 0.035),
        tone("sine", t * 1.47, 0, 0.04, 0.02));
    },
    start() {
      arp([523, 659, 784], 0.09, 0.18, 0.22);
    },
    end() {
      arp([784, 659, 523, 392], 0.12, 0.26, 0.22);
    },
    best() {
      arp([523, 659, 784, 1047], 0.1, 0.32, 0.22, 0.55);
    },
    wave() {
      (tone("sawtooth", 110, 0, 0.6, 0.12),
        tone("sawtooth", 165, 0, 0.6, 0.08, 0.02),
        arp([392, 523, 659], 0.11, 0.3, 0.16, 0.1));
    },
    clear() {
      arp([523, 659, 784, 1047, 1319], 0.07, 0.3, 0.18);
    },
    pick() {
      (arp([784, 1047, 1568], 0.06, 0.25, 0.2), hiss(0.3, 1800, 5e3, 0.12, 2));
    },
    die() {
      (tone("sawtooth", 300, 60, 1.4, 0.25),
        tone("square", 150, 40, 1.4, 0.12),
        arp([392, 311, 262, 196], 0.22, 0.5, 0.18, 0.3));
    },
    hurt() {
      (tone("sawtooth", 220, 70, 0.3, 0.32),
        hiss(0.25, 900, 200, 0.5, 0.7),
        tone("sine", 60, 30, 0.4, 0.5));
    },
    heal() {
      arp([659, 880, 1175], 0.07, 0.35, 0.15, 0, "sine");
    },
    shield() {
      (tone("sine", 1400, 700, 0.3, 0.2),
        tone("triangle", 2100, 1050, 0.25, 0.12, 0.02),
        hiss(0.2, 6e3, 3e3, 0.15, 3));
    },
    thud(t) {
      const e = dest(t);
      (tone("sine", 120, 50, 0.25, 0.5, 0, e),
        hiss(0.2, 600, 150, 0.35, 0.8, 0, e));
    },
    rise(t) {
      const e = dest(t);
      (hiss(0.7, 300, 1200, 0.3, 0.6, 0, e),
        tone("square", 80, 160, 0.6, 0.08, 0, e));
    },
    tele(t) {
      if (!gate("tele", 0.08)) return;
      const e = dest(t);
      (tone("sine", 600, 1500, 0.4, 0.16, 0, e),
        tone("square", 1200, 3e3, 0.4, 0.04, 0, e));
    },
    eshot(t, e) {
      if (!gate("eshot", 0.03)) return;
      const n = dest(t);
      e === "zap"
        ? (tone("sawtooth", 1800, 300, 0.22, 0.18, 0, n),
          tone("sine", 900, 200, 0.25, 0.12, 0, n))
        : e === "orb"
          ? (tone("sine", 200, 500, 0.35, 0.25, 0, n),
            hiss(0.3, 800, 2400, 0.12, 4, 0, n))
          : (hiss(0.14, 2600, 400, 0.4, 0.8, 0, n),
            tone("square", 900, 180, 0.12, 0.1, 0, n));
    },
    whoosh(t) {
      if (!gate("whoosh", 0.05)) return;
      const e = dest(t);
      hiss(0.3, 600, 2600, 0.35, 1.5, 0, e);
    },
    parry(t) {
      const e = dest(t);
      (tone("triangle", 2400, 3600, 0.12, 0.2, 0, e),
        tone("sine", 4800, 0, 0.18, 0.08, 0.02, e));
    },
    ehit(t, e) {
      if (!gate("ehit", 0.035)) return;
      const n = dest(t);
      e
        ? (tone("square", rand(700, 900), 300, 0.08, 0.14, 0, n),
          tone("triangle", rand(2200, 2800), 0, 0.12, 0.08, 0, n))
        : (hiss(0.1, 1200, 300, 0.4, 1, 0, n),
          tone("sine", 300, 120, 0.1, 0.18, 0, n));
    },
    ekill(t) {
      if (!gate("ekill", 0.05)) return;
      const e = dest(t);
      (hiss(0.45, 1500, 120, 0.55, 0.6, 0, e),
        tone("sawtooth", 300, 60, 0.35, 0.14, 0, e),
        tone("triangle", 880, 1320, 0.15, 0.1, 0.05));
    },
    explode(t, e) {
      const n = dest(t);
      (hiss(e ? 0.9 : 0.6, 1400, 80, e ? 0.9 : 0.7, 0.5, 0, n),
        tone("sine", 90, 30, e ? 0.8 : 0.5, 0.6, 0, n));
    },
    fuse(t) {
      const e = dest(t);
      hiss(0.6, 5e3, 4e3, 0.18, 6, 0, e);
    },
    throw(t) {
      const e = dest(t);
      hiss(0.25, 800, 1600, 0.25, 1, 0, e);
    },
    blink(t) {
      const e = dest(t);
      (tone("sine", 300, 2400, 0.15, 0.18, 0, e),
        tone("sine", 2400, 300, 0.15, 0.12, 0.15, e));
    },
    moan(t) {
      const e = dest(t);
      (tone("sine", 220, 180, 1.1, 0.14, 0, e),
        tone("sine", 228, 170, 1.1, 0.1, 0.05, e),
        hiss(1, 500, 300, 0.08, 3, 0, e));
    },
    roar(t) {
      const e = dest(t);
      (tone("sawtooth", 90, 45, 1.6, 0.35, 0, e),
        tone("square", 60, 35, 1.6, 0.2, 0, e),
        hiss(1.4, 700, 150, 0.5, 0.6, 0, e));
    },
    splat(t) {
      const e = dest(t);
      (hiss(0.2, 700, 200, 0.4, 1.5, 0, e),
        tone("sine", 220, 90, 0.18, 0.25, 0, e));
    },
    scorp(t) {
      const e = dest(t);
      (hiss(0.4, 3e3, 6e3, 0.22, 4, 0, e),
        tone("square", 120, 90, 0.3, 0.06, 0, e));
    },
    screech(t) {
      const e = dest(t);
      (tone("sawtooth", 1400, 900, 0.5, 0.16, 0, e),
        tone("sawtooth", 1480, 820, 0.5, 0.1, 0.03, e));
    },
  };
