"use strict";
const hands = new Map(),
  GUN_LOCAL = m4(),
  WRIST_LOCAL = m4();
let lastXR = 0,
  boundsPending = !1,
  xrStarting = !1;
function haptic(t, r, o) {
  try {
    const n =
      t.gamepad && t.gamepad.hapticActuators && t.gamepad.hapticActuators[0];
    if (n && n.pulse) {
      const pulse = n.pulse(r, o);
      pulse && pulse.catch && pulse.catch(() => {});
    }
  } catch {}
}
function handFor(t) {
  let r = hands.get(t);
  return (
    r ||
      ((r = {
        src: t,
        id: "peacemaker",
        hand: t.handedness === "left" ? "left" : "right",
        model: m4(),
        rayM: m4(),
        ray: { o: [0, 0, 0], d: [0, 0, -1] },
        muzzle: [0, 0, 0],
        aim: null,
        recoil: 0,
        heat: 0,
        muzzleAhead: 0.12,
        cd: 0,
        held: !1,
        pullT: 0,
        swap: 0,
        ok: !1,
        wristM: null,
        inst: null,
        ammo: 0,
        rel: 0,
        relMax: 1,
        squeeze: !1,
        steady: !1,
        support: !1,
        btnA: !1,
        near: 0,
      }),
      hands.set(t, r)),
    r
  );
}
// Tracking loss and headset menus must never leave a buffered shot or grip active.
function resetXRHand(hand) {
  hand.held = false;
  hand.pullT = 0;
  hand.squeeze = false;
  hand.btnA = false;
  hand.steady = false;
  hand.support = false;
  hand.gripping = false;
  hand.ok = false;
  hand.near = 0;
  hand.aim = null;
}
function clearXRInput() {
  for (const hand of hands.values()) resetXRHand(hand);
  guns.length = 0;
  lastXR = 0;
}
function xrVisible(session) {
  return !session.visibilityState || session.visibilityState === "visible";
}
function readBounds(t) {
  const r = boundedSpace && boundedSpace.boundsGeometry;
  if (!r || r.length < 3) {
    boundsPending = !1;
    return;
  }
  const o = t.getPose(boundedSpace, refSpace);
  if (!o) return;
  const n = o.transform.matrix;
  (setRoom(
    Array.from(r, (s) => {
      const i = xf(n, [s.x, 0, s.z]);
      return [i[0], i[2]];
    }),
    !0,
  ),
    (boundsPending = !1));
}
function onXRFrame(t, r) {
  const o = r.session;
  if (o !== xrSession || !refSpace) return;
  o.requestAnimationFrame(onXRFrame);
  // A zero delta still lets buffered/automatic shots fire. Suspend the whole
  // simulation until the headset is visible and its position is tracked again.
  if (!xrVisible(o)) {
    clearXRInput();
    return;
  }
  const s = r.getViewerPose(refSpace);
  if (!s) {
    clearXRInput();
    return;
  }
  const n = lastXR ? clamp((t - lastXR) / 1e3, 0, 0.05) : 0.016;
  lastXR = t;
  {
    const a = s.transform.matrix,
      e = s.transform.position;
    ((headPos[0] = e.x),
      (headPos[1] = e.y),
      (headPos[2] = e.z),
      HEADM.set(a),
      (PL.fwd = norm([-a[8], 0, -a[10]])),
      (PL.viewA = Math.atan2(PL.fwd[0], -PL.fwd[2])),
      (PL.pos[0] = e.x),
      (PL.pos[1] = e.z),
      setListener(headPos, [-a[8], -a[9], -a[10]], [a[4], a[5], a[6]]));
  }
  (boundsPending && readBounds(r), (guns.length = 0));
  const sources = new Set(o.inputSources);
  for (const [source, hand] of hands) {
    if (!sources.has(source)) {
      resetXRHand(hand);
      hands.delete(source);
    }
  }
  for (const a of sources) {
    const e = handFor(a);
    const l = a.targetRaySpace && r.getPose(a.targetRaySpace, refSpace);
    if (!l) {
      resetXRHand(e);
      continue;
    }
    e.ok = true;
    const d = e.inst;
    (syncGun(e, heldGun(e.hand)),
      d && d !== e.inst && inRun() && haptic(a, 0.6, 80),
      (e.swap = Math.max(0, e.swap - n * 3)));
    const m = WEAPONS[e.id],
      u = l.transform.matrix;
    (e.rayM.set(u),
      (e.ray.o = [u[12], u[13], u[14]]),
      (e.ray.d = norm([-u[8], -u[9], -u[10]])),
      (e.recoil = Math.max(0, e.recoil - n * 9)),
      (e.heat = Math.max(0, e.heat - n * 1.5)));
    const p = e.rel > 0 ? Math.sin(Math.PI * (1 - e.rel / e.relMax)) : 0;
    e.ray.d[1] < -0.85 && startReload(e);
    const c = a.gamepad,
      f = !!(c && c.buttons && c.buttons[4] && c.buttons[4].pressed);
    (f && !e.btnA && startReload(e),
      (e.btnA = f),
      trs(
        GUN_LOCAL,
        0,
        -0.012,
        0.07 + e.recoil * 0.035,
        0,
        e.recoil * 0.25 + p * 0.9,
        p * 0.4,
        1,
        1,
        1,
      ),
      mul(e.model, e.rayM, GUN_LOCAL),
      (e.muzzle = xf(e.model, [0, 0.006, m.muzzle])),
      (e.muzzleAhead =
        (e.muzzle[0] - e.ray.o[0]) * e.ray.d[0] +
        (e.muzzle[1] - e.ray.o[1]) * e.ray.d[1] +
        (e.muzzle[2] - e.ray.o[2]) * e.ray.d[2]),
      e.hand === "left" &&
        ((e.wristM = e.wristM || m4()),
        trs(WRIST_LOCAL, 0, 0.03, 0.24, 0, -1, 0, wrist.w, wrist.h, 1),
        mul(e.wristM, e.rayM, WRIST_LOCAL)),
      guns.push(e));
  }
  twoHandGrip();
  for (const a of guns)
    if (!a.support && triggerGun(a, n)) {
      const e = WEAPONS[a.id];
      haptic(
        a.src,
        e.kick ? Math.min(1, 0.45 * e.kick) : 0.5,
        e.auto ? 18 : 40,
      );
    }
  for (let a = 0; a < dbgSteps; a++) update(n);
  frames++;
  for (const a of guns) a.aim = a.support ? null : aimRay(a.ray.o, a.ray.d);
  buildFrame();
  const i = o.renderState.baseLayer;
  if (
    (gl.bindFramebuffer(gl.FRAMEBUFFER, i.framebuffer),
    MR.on
      ? gl.clearColor(0, 0, 0, 0)
      : gl.clearColor(fogCol[0], fogCol[1], fogCol[2], 1),
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT),
    !!s)
  )
    for (const a of s.views) {
      const e = i.getViewport(a);
      gl.viewport(e.x, e.y, e.width, e.height);
      const l = a.transform.position;
      renderScene(
        a.projectionMatrix,
        a.transform.inverse.matrix,
        [l.x, l.y, l.z],
        e.height * 0.5 * a.projectionMatrix[5],
      );
    }
}
const GRIPM = m4();
function twoHandGrip() {
  for (const t of guns) ((t.support = !1), (t.near = 0));
  for (const t of guns) t.steady = !1;
  for (const t of guns) {
    const r = WEAPONS[t.id];
    if (!r.long || t.support) {
      t.gripping = false;
      continue;
    }
    const o = guns.find((a) => a !== t);
    if (!o) {
      t.gripping = false;
      continue;
    }
    const n = xf(t.model, [0, -0.02, r.muzzle * 0.55]),
      s = Math.hypot(o.ray.o[0] - n[0], o.ray.o[1] - n[1], o.ray.o[2] - n[2]),
      i = t.gripping ? s < 0.45 : s < 0.22;
    if (((t.near = s < 0.3 ? 1 - s / 0.3 : 0), o.squeeze && i)) {
      (t.gripping || (sfx.grip(), haptic(o.src, 0.4, 30)),
        (t.gripping = !0),
        (t.steady = !0),
        (o.support = !0));
      const a = norm([
        o.ray.o[0] - t.ray.o[0],
        o.ray.o[1] - t.ray.o[1],
        o.ray.o[2] - t.ray.o[2],
      ]);
      ((t.ray.d = a),
        orient(GRIPM, t.ray.o, a),
        trs(
          GUN_LOCAL,
          0,
          -0.012,
          0.07 + t.recoil * 0.02,
          0,
          t.recoil * 0.12,
          0,
          1,
          1,
          1,
        ),
        mul(t.model, GRIPM, GUN_LOCAL),
        (t.muzzle = xf(t.model, [0, 0.006, r.muzzle])),
        (t.muzzleAhead =
          (t.muzzle[0] - t.ray.o[0]) * a[0] +
          (t.muzzle[1] - t.ray.o[1]) * a[1] +
          (t.muzzle[2] - t.ray.o[2]) * a[2]));
      break;
    } else t.gripping = !1;
  }
}
const enterVR = () => enterXR("vr");
async function enterXR(mode) {
  if (xrSession || xrStarting) return;
  xrStarting = true;
  let session = null;
  let ended = false;
  let bannerTimer = null;
  const label = mode === "ar" ? "mixed reality" : "VR";
  const restoreDesktop = () => {
    if (bannerTimer !== null) clearTimeout(bannerTimer);
    // An old session's end event must not tear down a newer session.
    if (xrSession !== session) return;
    clearXRInput();
    hands.clear();
    xrSession = null;
    refSpace = null;
    boundedSpace = null;
    boundsPending = false;
    MR.on = false;
    applyMapLighting();
    squareRoom(1);
    openMenu();
  };
  const requireActiveSession = () => {
    if (ended || xrSession !== session)
      throw new Error(
        "The headset session ended during setup. Please try again",
      );
  };
  try {
    audio();
    session = await navigator.xr.requestSession(
      mode === "ar" ? "immersive-ar" : "immersive-vr",
      { optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"] },
    );
    xrSession = session;
    session.addEventListener("end", () => {
      ended = true;
      restoreDesktop();
    });
    if (gl.makeXRCompatible) await gl.makeXRCompatible();
    requireActiveSession();
    MR.on = mode === "ar";
    applyMapLighting();
    const layer = new XRWebGLLayer(session, gl, {
      antialias: true,
      alpha: MR.on,
    });
    try {
      if ("fixedFoveation" in layer) layer.fixedFoveation = 0;
    } catch {}
    session.updateRenderState({
      baseLayer: layer,
      depthNear: 0.05,
      depthFar: 600,
    });
    let space;
    try {
      space = await session.requestReferenceSpace("local-floor");
    } catch {
      requireActiveSession();
      space = (
        await session.requestReferenceSpace("local")
      ).getOffsetReferenceSpace(new XRRigidTransform({ x: 0, y: -1.6, z: 0 }));
    }
    requireActiveSession();
    let bounds = null;
    try {
      bounds = await session.requestReferenceSpace("bounded-floor");
    } catch {}
    requireActiveSession();
    refSpace = space;
    boundedSpace = bounds;
    boundsPending = !!bounds;
    squareRoom(1);
    try {
      refSpace.addEventListener("reset", () => {
        if (xrSession !== session) return;
        clearXRInput();
        if (boundedSpace) boundsPending = true;
      });
    } catch {}
    lastXR = 0;
    hands.clear();
    guns.length = 0;
    overlay.hidden = true;
    menuBtn.hidden = true;
    reticle.hidden = true;
    hint.hidden = true;
    hudEl.hidden = true;
    overlayOpen = true;
    session.addEventListener("selectstart", (event) => {
      const hand = hands.get(event.inputSource);
      if (xrSession !== session || !xrVisible(session) || !hand || !hand.ok)
        return;
      hand.held = true;
      hand.pullT = 0.25;
      audio();
    });
    session.addEventListener("selectend", (event) => {
      if (xrSession !== session) return;
      const hand = hands.get(event.inputSource);
      if (hand) hand.held = false;
    });
    session.addEventListener("squeezestart", (event) => {
      const hand = hands.get(event.inputSource);
      if (xrSession !== session || !xrVisible(session) || !hand || !hand.ok)
        return;
      hand.squeeze = true;
    });
    session.addEventListener("squeezeend", (event) => {
      if (xrSession !== session) return;
      const hand = hands.get(event.inputSource);
      if (hand) hand.squeeze = false;
    });
    session.addEventListener("visibilitychange", () => {
      if (xrSession === session) clearXRInput();
    });
    session.addEventListener("inputsourceschange", (event) => {
      if (xrSession !== session) return;
      // Clear the other controller's two-hand grip, too, when its partner leaves.
      if ((event.removed || []).length) clearXRInput();
      for (const source of event.removed || []) hands.delete(source);
    });
    resetToMenu();
    drawWrist(true);
    if (MR.on) {
      bannerTimer = setTimeout(() => {
        if (xrSession === session && MR.on)
          showBanner(
            "MIXED REALITY",
            "Aim at your floor and pull the trigger to place up to 4 enemy portals",
          );
      }, 900);
    }
    session.requestAnimationFrame(onXRFrame);
  } catch (error) {
    if (session) {
      restoreDesktop();
      if (!ended) {
        try {
          await session.end();
        } catch {}
      }
    }
    vrNote.innerHTML = "";
    vrNote.append(
      "Couldn't start " +
        label +
        " here (" +
        ((error && (error.message || error.name)) || "blocked") +
        "). ",
    );
    vrNote.append(questHint());
  } finally {
    xrStarting = false;
  }
}
(vrBtn.addEventListener("click", enterVR),
  arBtn.addEventListener("click", () => enterXR("ar")));
function questHint() {
  const t = document.createDocumentFragment();
  let r = "";
  try {
    window.top === window &&
      /^https:$/.test(location.protocol) &&
      (r = location.origin + location.pathname);
  } catch {}
  if ((r || (r = QUEST_LINK), r)) {
    t.append("On your Quest, open ");
    const o = document.createElement("a");
    ((o.href = r),
      (o.target = "_blank"),
      (o.rel = "noopener"),
      (o.textContent = r.replace("https://", "").replace("http://", "")));
    const n = document.createElement("strong");
    (n.append(o), t.append(n, " in the Meta Quest Browser and tap Enter VR."));
  } else
    t.append(
      "On your Quest, open this page in the Meta Quest Browser and tap Enter VR.",
    );
  return t;
}
async function checkVR() {
  let t = !1,
    r = "";
  if (!navigator.xr) r = "This browser doesn't support WebXR. ";
  else
    try {
      ((t = await navigator.xr.isSessionSupported("immersive-vr")),
        t || (r = "No VR headset found in this browser. "));
    } catch {
      r = "VR is blocked in this view. ";
    }
  vrBtn.disabled = !t;
  try {
    navigator.xr &&
      (await navigator.xr.isSessionSupported("immersive-ar")) &&
      (arBtn.hidden = !1);
  } catch {}
  ((vrNote.innerHTML = ""),
    t
      ? vrNote.append(
          "Headset ready. Put it on, tap ",
          Object.assign(document.createElement("strong"), {
            textContent: "Enter VR",
          }),
          ", then shoot a start target.",
        )
      : (vrNote.append(r),
        vrNote.append(questHint()),
        vrNote.append(" Or play here with your mouse.")));
}
