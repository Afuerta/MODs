"use strict";
const QUEST_LINK = "https://dusk-range.vercel.app",
  ROUND = 60,
  $ = (e) => document.getElementById(e),
  canvas = $("gl"),
  overlay = $("menu"),
  vrBtn = $("vrBtn"),
  flatBtn = $("flatBtn"),
  vrNote = $("vrNote"),
  bestOut = $("bestOut"),
  menuBtn = $("menuBtn"),
  reticle = $("reticle"),
  hint = $("hint"),
  hudEl = $("hud"),
  hudHearts = $("hudHearts"),
  hudInfo = $("hudInfo"),
  hudGun = $("hudGun"),
  arrowsEl = $("arrows"),
  arBtn = $("arBtn"),
  fovIn = $("fovIn"),
  fovOut = $("fovOut"),
  hudXP = $("hudXP"),
  hudTasks = $("hudTasks"),
  gl = canvas.getContext("webgl2", {
    antialias: !0,
    alpha: !1,
    xrCompatible: !0,
    powerPreference: "high-performance",
  });
if (!gl)
  throw (
    (vrNote.textContent =
      "This browser can't run WebGL 2, which the game needs. Try a current Chrome, Edge, Safari or the Meta Quest Browser."),
    (flatBtn.disabled = !0),
    new Error("WebGL 2 unavailable")
  );
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
