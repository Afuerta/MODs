"use strict";
const PROJ = m4(),
  VIEW = m4(),
  CAM = m4();
let dbgSteps = 1,
  frames = 0,
  userFov = clamp(loadNum("dusk-range-fov") || 75, 50, 110);
((fovIn.value = userFov),
  (fovOut.textContent = userFov + "°"),
  fovIn.addEventListener("input", () => {
    ((userFov = +fovIn.value),
      (fovOut.textContent = userFov + "°"),
      saveNum("dusk-range-fov", userFov));
  }));
let fovy = (65 * Math.PI) / 180,
  aspect = 1,
  flatArc = 0.5,
  camYaw = 0,
  camPitch = 0.06,
  baseYaw = 0,
  lastFlat = 0,
  flatCrouch = 0;
const mouse = { x: 0, y: 0, inside: !1, type: "mouse", down: !1 },
  keys = new Set(),
  flatGun = {
    id: "peacemaker",
    hand: "right",
    model: m4(),
    muzzle: [0, 0, 0],
    ray: { o: [0, 1.6, 0], d: [0, 0, -1] },
    aim: null,
    recoil: 0,
    heat: 0,
    muzzleAhead: 0,
    cd: 0,
    held: !1,
    pullT: 0,
    swap: 0,
    noLaser: !0,
    inst: null,
    ammo: 0,
    rel: 0,
    relMax: 1,
    ads: !1,
    adsK: 0,
  };
function resize() {
  const e = Math.min(window.devicePixelRatio || 1, screenPixelRatio()),
    n = Math.max(1, Math.round(canvas.clientWidth * e)),
    s = Math.max(1, Math.round(canvas.clientHeight * e));
  ((canvas.width !== n || canvas.height !== s) &&
    ((canvas.width = n), (canvas.height = s)),
    (aspect = n / s));
  const t = (userFov * Math.PI) / 180;
  ((fovy =
    Math.min(1.95, Math.max(t, 2 * Math.atan(Math.tan(t * 0.48) / aspect))) *
    lerp(1, 0.6, flatGun.adsK)),
    (flatArc = clamp(
      Math.atan(Math.tan(fovy / 2) * aspect) - 0.13,
      0.22,
      0.75,
    )),
    perspective(PROJ, fovy, aspect, 0.05, 600));
}
function mouseDir() {
  const e = Math.tan(fovy / 2),
    n = mouse.x * e * aspect,
    s = mouse.y * e;
  return norm([
    CAM[0] * n + CAM[4] * s - CAM[8],
    CAM[1] * n + CAM[5] * s - CAM[9],
    CAM[2] * n + CAM[6] * s - CAM[10],
  ]);
}
const keyOn = (...e) => (e.some((n) => keys.has(n)) ? 1 : 0);
function flatControls(e) {
  let n = keyOn("q", "arrowleft") - keyOn("e", "arrowright");
  if (
    (inRun() &&
      mouse.inside &&
      (mouse.type === "mouse" || mouse.down) &&
      Math.abs(mouse.x) > 0.8 &&
      (n -= Math.sign(mouse.x) * smooth(0.8, 0.98, Math.abs(mouse.x))),
    (baseYaw += n * 1.9 * e),
    inRun())
  ) {
    const t = keyOn("w", "arrowup") - keyOn("s", "arrowdown"),
      o = keyOn("d") - keyOn("a");
    if (t || o) {
      const i = Math.hypot(t, o),
        a = (2.1 * (1 - flatCrouch * 0.45) * e) / i,
        d = -Math.sin(baseYaw),
        l = -Math.cos(baseYaw),
        r = Math.cos(baseYaw),
        c = -Math.sin(baseYaw);
      [PL.pos[0], PL.pos[1]] = clampRoom(
        PL.pos[0] + (d * t + r * o) * a,
        PL.pos[1] + (l * t + c * o) * a,
      );
    }
  } else
    ((PL.pos[0] *= Math.max(0, 1 - e * 3)),
      (PL.pos[1] *= Math.max(0, 1 - e * 3)));
  flatCrouch +=
    ((keyOn("c", "control", "shift") ? 1 : 0) - flatCrouch) *
    Math.min(1, e * 12);
}
function flatFrame(e) {
  if ((requestAnimationFrame(flatFrame), xrSession)) return;
  const n = e / 1e3,
    s = screenPaused() ? 0 : clamp(n - lastFlat, 0, 0.05);
  if (((lastFlat = n), resize(), overlayOpen))
    ((baseYaw = 0),
      (camYaw = reducedMotion ? 0.05 : Math.sin(n * 0.07) * 0.2 + 0.05),
      (camPitch = 0.07),
      (PL.pos[0] = PL.pos[1] = 0),
      (flatCrouch = 0));
  else {
    flatControls(s);
    const t = R.kind === "td" && TD.on;
    ((camYaw +=
      (baseYaw - mouse.x * (t ? 0.55 : 0.13) - camYaw) * Math.min(1, s * 5)),
      (camPitch +=
        ((t ? mouse.y * 0.3 - 0.24 : mouse.y * 0.08 + 0.06) - camPitch) *
        Math.min(1, s * 5)));
  }
  if (
    (trs(
      CAM,
      PL.pos[0],
      1.6 - flatCrouch * 0.6,
      PL.pos[1],
      camYaw,
      camPitch,
      0,
      1,
      1,
      1,
    ),
    invert(VIEW, CAM),
    HEADM.set(CAM),
    (headPos[0] = CAM[12]),
    (headPos[1] = CAM[13]),
    (headPos[2] = CAM[14]),
    (PL.fwd = norm([-CAM[8], 0, -CAM[10]])),
    (PL.viewA = Math.atan2(PL.fwd[0], -PL.fwd[2])),
    setListener(
      headPos,
      [-CAM[8], -CAM[9], -CAM[10]],
      [CAM[4], CAM[5], CAM[6]],
    ),
    (guns.length = 0),
    !overlayOpen)
  ) {
    const t = flatGun;
    (syncGun(t, heldGun("right")), (t.swap = Math.max(0, t.swap - s * 3)));
    const o = WEAPONS[t.id],
      i = mouseDir(),
      a = [CAM[12], CAM[13], CAM[14]];
    ((t.ray.o = a), (t.ray.d = i));
    const d = aimRay(a, i),
      l = d ? d.point : [a[0] + i[0] * 25, a[1] + i[1] * 25, a[2] + i[2] * 25];
    ((t.aim = d),
      (t.recoil = Math.max(0, t.recoil - s * 9)),
      (t.heat = Math.max(0, t.heat - s * 1.5)),
      (t.adsK += ((t.ads ? 1 : 0) - t.adsK) * Math.min(1, s * 10)));
    const r = xf(CAM, [
        lerp(0.17 * Math.min(1, aspect), 0, t.adsK),
        lerp(-0.165, -0.1, t.adsK),
        lerp(-0.5, -0.42, t.adsK) + t.recoil * 0.04,
      ]),
      c = t.rel > 0 ? Math.sin(Math.PI * (1 - t.rel / t.relMax)) : 0,
      h = Math.hypot(l[0] - r[0], l[1] - r[1], l[2] - r[2]);
    (orient(
      t.model,
      r,
      norm([
        l[0] - r[0],
        l[1] - r[1] + t.recoil * 0.4 + c * 0.8 * h,
        l[2] - r[2],
      ]),
    ),
      (t.muzzle = xf(t.model, [0, 0.006, o.muzzle])),
      guns.push(t),
      !screenPaused() && triggerGun(t, s));
  }
  for (let t = 0; t < dbgSteps; t++) update(s);
  (frames++,
    buildFrame(),
    gl.bindFramebuffer(gl.FRAMEBUFFER, null),
    gl.viewport(0, 0, canvas.width, canvas.height),
    gl.clearColor(fogCol[0], fogCol[1], fogCol[2], 1),
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT),
    renderScene(PROJ, VIEW, headPos, canvas.height * 0.5 * PROJ[5]),
    updateHud(),
    updateObjective());
}
let hudKey = "";
function updateHud() {
  const e =
    !overlayOpen &&
    !xrSession &&
    (inRun() || (S.mode === "results" && S.last !== "range"));
  if ((hudEl.hidden === e && (hudEl.hidden = !e), !e)) return;
  const n = [
    PL.hearts,
    PL.max,
    PL.shield,
    R.wave,
    R.score,
    R.gold,
    flatGun.id,
    flatGun.inst && flatGun.inst.rar,
    flatGun.inst && flatGun.inst.mods.join(),
    flatGun.ammo,
    flatGun.rel > 0,
    liveEnemies() + R.queue.length,
    TD.core,
    R.lvl,
    Math.floor(R.xp * 10),
    Math.floor(R.combo / 4),
    (R.contracts || [])
      .map((a) => a.done + ":" + (R.stat[a.c.stat] || 0))
      .join(),
  ].join("|");
  if (n === hudKey) return;
  hudKey = n;
  let s = "";
  for (let a = 0; a < PL.max; a++)
    s += a < PL.hearts ? "♥" : '<span class="off">♥</span>';
  for (let a = 0; a < PL.shield; a++) s += '<span class="sh">♥</span>';
  hudHearts.innerHTML = s;
  const t = liveEnemies() + R.queue.length;
  hudInfo.textContent =
    "WAVE " +
    R.wave +
    " · " +
    (goldMode() ? "$" + R.gold.toLocaleString() : R.score.toLocaleString()) +
    (R.kind === "td" ? " · BEACON " + TD.core + "/" + TD.coreMax : "") +
    (t ? " · " + t + " left" : "");
  const o = flatGun,
    i = o.inst ? magSize(o.inst) : 0;
  ((hudGun.textContent =
    (o.inst ? gunName(o.inst) : "") +
    "   " +
    (o.rel > 0 ? "RELOADING" : o.ammo + " / " + i)),
    (hudXP.innerHTML =
      "LV " +
      R.lvl +
      '<i><b style="width:' +
      Math.round(100 * Math.min(1, R.xp / xpNext(R.lvl))) +
      '%"></b></i>' +
      (R.combo > 1 ? "  ·  COMBO x" + comboMul().toFixed(1) : "")),
    (hudTasks.innerHTML =
      (R.contracts || [])
        .map(
          (a) =>
            '<div class="' +
            (a.done ? "ok" : "") +
            '">' +
            a.c.text(a.n) +
            " · " +
            Math.min(a.n, R.stat[a.c.stat] || 0) +
            "/" +
            a.n +
            "</div>",
        )
        .join("") +
      (o.inst && o.inst.mods.length
        ? "<div>MODS: " +
          o.inst.mods.map((a) => MODS[a].name).join(", ") +
          "</div>"
        : "")),
    (hudGun.style.color = o.inst && o.inst.rar ? RAR[o.inst.rar].css : ""));
}
function setMouse(e) {
  const n = canvas.getBoundingClientRect();
  ((mouse.x = clamp(((e.clientX - n.left) / n.width) * 2 - 1, -1, 1)),
    (mouse.y = clamp(1 - ((e.clientY - n.top) / n.height) * 2, -1, 1)),
    (mouse.type = e.pointerType || "mouse"),
    (reticle.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`));
}
(canvas.addEventListener("pointermove", (e) => {
  ((mouse.inside = !0), setMouse(e));
}),
  canvas.addEventListener("pointerenter", () => {
    mouse.inside = !0;
  }),
  canvas.addEventListener("pointerleave", () => {
    ((mouse.inside = !1), (mouse.down = !1), (flatGun.held = !1));
  }),
  canvas.addEventListener("pointerdown", (e) => {
    if (!overlayOpen && !xrSession && !screenPaused() && e.button === 2) {
      flatGun.ads = !0;
      return;
    }
    if (!(overlayOpen || xrSession || screenPaused() || e.button !== 0)) {
      ((mouse.inside = !0),
        (mouse.down = !0),
        setMouse(e),
        audio(),
        (flatGun.held = !0),
        (flatGun.pullT = 0.25));
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {}
    }
  }));
const releaseTrigger = () => {
  ((mouse.down = !1), (flatGun.held = !1));
};
(canvas.addEventListener("pointerup", (e) => {
  e.button === 2 ? (flatGun.ads = !1) : releaseTrigger();
}),
  canvas.addEventListener("pointercancel", releaseTrigger),
  canvas.addEventListener("contextmenu", (e) => {
    overlayOpen || e.preventDefault();
  }),
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlayOpen && !xrSession) {
      e.preventDefault();
      if (e.repeat) return;
      PLAY.paused ? resumeFlat() : pauseFlat();
      return;
    }
    if (
      overlayOpen ||
      xrSession ||
      screenPaused() ||
      e.metaKey ||
      e.altKey ||
      e.ctrlKey
    )
      return;
    if (
      e.target instanceof HTMLElement &&
      e.target.closest("button, input, select, textarea, summary, a")
    )
      return;
    const n = e.key.toLowerCase();
    (keys.add(n),
      (n.startsWith("arrow") || n === " ") && e.preventDefault(),
      n === " " && !e.repeat && ((flatGun.held = !0), (flatGun.pullT = 0.25)),
      n === "r" && startReload(flatGun));
  }),
  addEventListener("keyup", (e) => {
    const n = e.key.toLowerCase();
    (keys.delete(n), n === " " && (flatGun.held = !1));
  }),
  addEventListener("blur", () => {
    (clearScreenInput(), pauseFlat());
  }));
function openMenu() {
  closePause();
  clearScreenInput();
  updateMenuStats();
  $("objective").hidden = true;
  $("touchControls").hidden = true;
  ((overlayOpen = !0),
    (overlay.hidden = !1),
    (menuBtn.hidden = !0),
    (reticle.hidden = !0),
    (hint.hidden = !0),
    (hudEl.hidden = !0),
    keys.clear(),
    releaseTrigger(),
    resetToMenu(),
    vrBtn.disabled ? flatBtn.focus() : vrBtn.focus());
}
function playFlat() {
  closePause();
  clearScreenInput();
  baseYaw = camYaw = 0;
  camPitch = 0.06;
  PL.pos[0] = PL.pos[1] = 0;
  (audio(),
    (overlayOpen = !1),
    (overlay.hidden = !0),
    (menuBtn.hidden = !1),
    (reticle.hidden = !1),
    (hint.hidden = !1),
    (hint.textContent =
      "Click fire · Right-click aim · R reload · WASD move · C duck · Q/E turn · Esc pause"),
    (mouse.x = 0),
    (mouse.y = 0),
    (reticle.style.transform = `translate(${innerWidth / 2}px, ${innerHeight / 2}px)`),
    resetToMenu(),
    setTimeout(() => {
      hint.hidden = !0;
    }, 8e3));
  canvas.focus({ preventScroll: true });
}
(flatBtn.addEventListener("click", launchMission),
  menuBtn.addEventListener("click", pauseFlat));
