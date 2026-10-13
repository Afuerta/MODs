"use strict";
const FD = '"Saira Stencil One", Impact, "Arial Narrow", sans-serif',
  FB = '"Saira Semi Condensed", "Arial Narrow", sans-serif',
  SHADOW_TEX = canvasTex(128, 128, (e, i, t) => {
    const l = e.createImageData(i, t),
      n = l.data;
    for (let o = 0; o < t; o++)
      for (let r = 0; r < i; r++) {
        let f = 0;
        if (r < 64) {
          const s = (r + 0.5) / 32 - 1,
            p = 1 - (o + 0.5) / 128,
            d = 0.6 + 0.4 * Math.min(1, p * 5),
            b = Math.abs(s) / d;
          f =
            b < 1
              ? Math.pow(1 - b * b, 1.3) *
                Math.pow(1 - p, 1.4) *
                Math.min(1, 0.45 + p * 8)
              : 0;
        } else if (o < 64) {
          const s = (r - 64 + 0.5) / 32 - 1,
            p = (o + 0.5) / 32 - 1,
            d = s * s + p * p;
          f = d < 1 ? Math.pow(1 - d, 1.8) : 0;
        }
        const a = (o * i + r) * 4;
        ((n[a] = n[a + 1] = n[a + 2] = 0), (n[a + 3] = Math.round(f * 255)));
      }
    e.putImageData(l, 0, 0);
  }),
  UV_LONG = [0, 0, 0.5, 1],
  UV_BLOB = [0.5, 0.5, 1, 1],
  CLOUD_TEX = canvasTex(512, 256, (e) => {
    const i = mulberry(11);
    for (let t = 0; t < 4; t++) {
      const l = (t % 2) * 256,
        n = (t >> 1) * 128;
      (e.save(), e.beginPath(), e.rect(l, n, 256, 128), e.clip());
      for (let r = 0; r < 52; r++) {
        const f = l + lerp(30, 226, i()),
          a = n + 64 + (i() - 0.5) * lerp(16, 44, i()) * (t === 3 ? 1.5 : 1),
          s = lerp(14, 48, i()),
          p = s * lerp(0.22, 0.48, i()),
          d = e.createRadialGradient(0, 0, 0, 0, 0, 1);
        (d.addColorStop(0, "rgba(255,255,255,0.5)"),
          d.addColorStop(0.6, "rgba(255,255,255,0.2)"),
          d.addColorStop(1, "rgba(255,255,255,0)"),
          e.save(),
          e.translate(f, a),
          e.scale(s, p),
          (e.fillStyle = d),
          e.beginPath(),
          e.arc(0, 0, 1, 0, TAU),
          e.fill(),
          e.restore());
      }
      e.globalCompositeOperation = "destination-in";
      const o = e.createLinearGradient(l, 0, l + 256, 0);
      (o.addColorStop(0, "rgba(0,0,0,0)"),
        o.addColorStop(0.2, "rgba(0,0,0,1)"),
        o.addColorStop(0.8, "rgba(0,0,0,1)"),
        o.addColorStop(1, "rgba(0,0,0,0)"),
        (e.fillStyle = o),
        e.fillRect(l, n, 256, 128),
        (e.globalCompositeOperation = "source-over"),
        e.restore());
    }
  });
function paperGrain(e, i, t, l, n) {
  const o = mulberry(l);
  (e.save(), e.beginPath(), e.arc(i, i, t, 0, TAU), e.clip());
  for (let r = 0; r < n; r++)
    ((e.fillStyle =
      o() < 0.5 ? "rgba(40,30,20,0.07)" : "rgba(255,255,255,0.07)"),
      e.fillRect(o() * i * 2, o() * i * 2, 1.2, 1.2));
  e.restore();
}
const FACE_TEX = canvasTex(256, 256, (e, i) => {
    const t = i / 2,
      l = i / 2 - 3,
      n = ["#f3eee2", "#1d1b22", "#2f86d6", "#e23b2e", "#f6c21c"];
    for (let a = 0; a < 5; a++)
      (e.beginPath(),
        e.arc(t, t, l * (1 - a * 0.2), 0, TAU),
        (e.fillStyle = n[a]),
        e.fill());
    for (let a = 10; a >= 1; a--) {
      const s = Math.floor((10 - a) / 2);
      (e.beginPath(),
        e.arc(t, t, (l * a) / 10, 0, TAU),
        (e.lineWidth = a % 2 === 0 ? 1.8 : 0.9),
        (e.strokeStyle =
          s === 1 ? "rgba(243,238,226,0.75)" : "rgba(29,27,34,0.8)"),
        e.stroke());
    }
    ((e.strokeStyle = "rgba(29,27,34,0.85)"),
      (e.lineWidth = 1.2),
      e.beginPath(),
      e.moveTo(t - 4, t - 4),
      e.lineTo(t + 4, t + 4),
      e.moveTo(t + 4, t - 4),
      e.lineTo(t - 4, t + 4),
      e.stroke(),
      (e.font = `700 13px ${FB}`),
      (e.textAlign = "center"),
      (e.textBaseline = "middle"));
    const o = ["2", "4", "6", "8", "10"],
      r = ["#2b2140", "#f3eee2", "#f3eee2", "#f3eee2", "#2b2140"];
    for (let a = 0; a < 4; a++) {
      const s = l * (1 - a * 0.2 - 0.1);
      ((e.fillStyle = r[a]),
        e.fillText(o[a], t + s, t),
        e.fillText(o[a], t - s, t));
    }
    ((e.font = `700 10px ${FB}`),
      (e.fillStyle = r[4]),
      e.fillText("10", t + l * 0.12, t),
      e.fillText("10", t - l * 0.12, t),
      paperGrain(e, t, l, 5, 1400));
    const f = mulberry(9);
    for (let a = 0; a < 7; a++) {
      const s = f() * TAU,
        p = l * lerp(0.25, 0.95, Math.sqrt(f())),
        d = t + Math.cos(s) * p,
        b = t + Math.sin(s) * p;
      (e.beginPath(),
        e.arc(d, b, 3.4, 0, TAU),
        (e.fillStyle = "rgba(255,250,240,0.35)"),
        e.fill(),
        e.beginPath(),
        e.arc(d, b, 2.2, 0, TAU),
        (e.fillStyle = "#17121a"),
        e.fill());
    }
    (e.beginPath(),
      e.arc(t, t, l, 0, TAU),
      (e.lineWidth = 2),
      (e.strokeStyle = "rgba(29,27,34,0.9)"),
      e.stroke());
  }),
  DUD_TEX = canvasTex(256, 256, (e, i) => {
    const t = i / 2,
      l = i / 2 - 3;
    (e.beginPath(),
      e.arc(t, t, l, 0, TAU),
      (e.fillStyle = "#2a2430"),
      e.fill(),
      e.beginPath(),
      e.arc(t, t, l - 11, 0, TAU),
      (e.lineWidth = 20),
      (e.strokeStyle = "#e23b2e"),
      e.stroke());
    const n = l * 0.46;
    ((e.lineWidth = 24),
      (e.lineCap = "butt"),
      e.beginPath(),
      e.moveTo(t - n, t - n),
      e.lineTo(t + n, t + n),
      e.moveTo(t + n, t - n),
      e.lineTo(t - n, t + n),
      e.stroke(),
      (e.font = `700 24px ${FB}`),
      (e.textAlign = "center"),
      (e.textBaseline = "middle"),
      (e.fillStyle = "#f3e3c8"),
      e.fillText("−20", t, t + l * 0.7),
      (e.font = `20px ${FD}`),
      e.fillText("HOLD", t, t - l * 0.7),
      paperGrain(e, t, l, 6, 900));
  }),
  LABEL_TEX = canvasTex(256, 256, (e) => {
    ["7 M", "11 M", "15 M"].forEach((i, t) => {
      const l = t * 85;
      ((e.fillStyle = "#efe2c6"),
        e.fillRect(0, l, 256, 80),
        (e.strokeStyle = "#2b2140"),
        (e.lineWidth = 6),
        e.strokeRect(5, l + 5, 246, 70),
        (e.fillStyle = "#2b2140"),
        (e.font = `52px ${FD}`),
        (e.textAlign = "center"),
        (e.textBaseline = "middle"),
        e.fillText(i, 128, l + 43, 220));
    });
  }),
  labelUV = (e) => [0, 1 - (e * 85 + 80) / 256, 1, 1 - (e * 85) / 256],
  RUN_TEX = canvasTex(256, 256, (e, i) => {
    const t = i / 2,
      l = i / 2 - 3,
      n = ["#2a2430", "#7a1e1a", "#2a2430", "#b02a24"];
    for (let o = 0; o < 4; o++)
      (e.beginPath(),
        e.arc(t, t, l * (1 - o * 0.22), 0, TAU),
        (e.fillStyle = n[o]),
        e.fill());
    (e.beginPath(),
      e.arc(t, t, l * 0.24, 0, TAU),
      (e.fillStyle = "#ffd257"),
      e.fill(),
      (e.strokeStyle = "#f3e3c8"),
      (e.lineWidth = 5),
      (e.lineCap = "round"));
    for (const o of [-1, 1])
      (e.beginPath(),
        e.moveTo(t - o * l * 0.62, t - l * 0.62),
        e.lineTo(t + o * l * 0.62, t + l * 0.62),
        e.stroke());
    ((e.font = `34px ${FD}`),
      (e.textAlign = "center"),
      (e.textBaseline = "middle"),
      (e.fillStyle = "#f3e3c8"),
      e.fillText("SURVIVAL", t, t - l * 0.62, l * 1.3),
      (e.font = `700 20px ${FB}`),
      e.fillText("ENDLESS WAVES", t, t + l * 0.66, l * 1.3),
      (e.fillStyle = "#2b2140"),
      (e.font = `26px ${FD}`),
      e.fillText("GO", t, t + 2),
      paperGrain(e, t, l, 7, 900));
  }),
  CRATE_LABELS = Array.from({ length: 3 }, () => panel(256, 256, 0.5));
function paintCrate(e, i) {
  const t = e.ctx,
    l = 256,
    n = { weapon: "#ff8a2a", perk: "#b58aff", heal: "#5fd38a", mod: "#5fe8c0" }[
      i.type
    ];
  ((t.fillStyle = "#efe2c6"),
    t.fillRect(0, 0, l, l),
    (t.fillStyle = n),
    t.fillRect(0, 0, l, 46),
    (t.fillStyle = "#2b2140"),
    (t.font = `700 22px ${FB}`),
    (t.textAlign = "center"),
    (t.textBaseline = "middle"),
    "letterSpacing" in t && (t.letterSpacing = "3px"),
    t.fillText(
      i.type === "weapon"
        ? "WEAPON"
        : i.type === "perk"
          ? "PERK"
          : i.type === "mod"
            ? "MOD"
            : "SUPPLIES",
      l / 2,
      24,
    ),
    "letterSpacing" in t && (t.letterSpacing = "0px"),
    (t.font = `40px ${FD}`),
    t.fillText(i.name, l / 2, 108, 236),
    (t.font = `600 21px ${FB}`),
    (t.fillStyle = "#4a3d5e"));
  const o = i.desc.split(" ");
  let r = "",
    f = 158;
  for (const a of o) {
    const s = r ? r + " " + a : a;
    t.measureText(s).width > 222
      ? (t.fillText(r, l / 2, f), (r = a), (f += 26))
      : (r = s);
  }
  (r && t.fillText(r, l / 2, f),
    (t.strokeStyle = "#2b2140"),
    (t.lineWidth = 8),
    t.strokeRect(4, 4, l - 8, l - 8),
    upload(e.tex, e.cvs));
}
