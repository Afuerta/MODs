const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

const source = readFileSync(path.join(__dirname, "../src/js/35.js"), "utf8");
const matrix = () =>
  new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1.6, 0, 1]);
function events(extra = {}) {
  const listeners = new Map();
  return {
    ...extra,
    addEventListener(type, callback) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(callback);
    },
    dispatch(type, detail = {}) {
      for (const callback of listeners.get(type) || []) callback(detail);
    },
  };
}
function makeSession() {
  const space = events({
    getOffsetReferenceSpace() {
      return this;
    },
  });
  return events({
    visibilityState: "visible",
    inputSources: [],
    renderState: {},
    ends: 0,
    frames: 0,
    async requestReferenceSpace(type) {
      if (type === "bounded-floor") throw new Error("No boundary available");
      return space;
    },
    updateRenderState(state) {
      Object.assign(this.renderState, state);
    },
    requestAnimationFrame() {
      this.frames++;
    },
    async end() {
      this.ends++;
      this.dispatch("end");
    },
  });
}
function harness({ session = makeSession(), request, compatible } = {}) {
  const state = {
    requests: 0,
    menu: 0,
    shots: 0,
    updates: 0,
    banners: 0,
    notes: [],
  };
  const noop = () => {};
  const sandbox = {
    m4: matrix,
    setTimeout,
    clearTimeout,
    Set,
    Map,
    navigator: {
      xr: {
        requestSession: async (...args) => {
          state.requests++;
          return request ? request(...args) : session;
        },
      },
    },
    xrSession: null,
    refSpace: null,
    boundedSpace: null,
    guns: [],
    MR: { on: false },
    audio: noop,
    applyMapLighting: noop,
    squareRoom: noop,
    resetToMenu: noop,
    drawWrist: noop,
    overlayOpen: false,
    openMenu: () => {
      state.menu++;
      sandbox.overlay.hidden = false;
    },
    showBanner: () => {
      state.banners++;
    },
    overlay: { hidden: false },
    menuBtn: {},
    reticle: {},
    hint: {},
    hudEl: {},
    vrBtn: events(),
    arBtn: events(),
    vrNote: {
      innerHTML: "",
      append(...text) {
        state.notes.push(...text);
      },
    },
    gl: {
      makeXRCompatible: compatible || (async () => {}),
      bindFramebuffer: noop,
      clearColor: noop,
      clear: noop,
      viewport: noop,
    },
    XRWebGLLayer: class {
      getViewport() {
        return { x: 0, y: 0, width: 100, height: 100 };
      }
    },
    XRRigidTransform: class {},
    document: {
      createDocumentFragment: () => ({ append: noop }),
      createElement: () => ({ append: noop }),
    },
    window: {},
    location: { protocol: "https:" },
    QUEST_LINK: "",
    clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
    headPos: [0, 1.6, 0],
    HEADM: matrix(),
    PL: { pos: [0, 0] },
    norm: (value) => value,
    setListener: noop,
    setRoom: noop,
    xf: (m, v) => v,
    syncGun: noop,
    heldGun: noop,
    inRun: () => false,
    WEAPONS: { peacemaker: { muzzle: -0.1 } },
    startReload: noop,
    trs: noop,
    mul: noop,
    wrist: { w: 1, h: 1 },
    orient: noop,
    triggerGun: (hand) => {
      if (!hand.held && !hand.pullT) return false;
      state.shots++;
      hand.pullT = 0;
      return true;
    },
    update: () => {
      state.updates++;
    },
    dbgSteps: 1,
    frames: 0,
    aimRay: noop,
    buildFrame: noop,
    fogCol: [0, 0, 0],
    renderScene: noop,
    sfx: { grip: noop },
  };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  const api = vm.runInContext(
    "({ enterXR, onXRFrame, handFor, hands, clearXRInput, twoHandGrip })",
    sandbox,
  );
  const controller = { handedness: "right", targetRaySpace: {} };
  function frame({ tracked = true, viewer = true } = {}) {
    const pose = {
      transform: { matrix: matrix(), position: { x: 0, y: 1.6, z: 0 } },
      views: [],
    };
    api.onXRFrame(100, {
      session,
      getViewerPose: () => (viewer ? pose : null),
      getPose: () => (tracked ? pose : null),
    });
  }
  return { api, sandbox, state, session, controller, frame };
}
function assertReleased(hand) {
  for (const key of ["held", "squeeze", "steady", "support", "gripping", "ok"])
    assert.equal(hand[key], false, key + " should be released");
  assert.equal(hand.pullT, 0);
}

test("failed graphics setup ends the acquired session and permits retry", async () => {
  let fail = true;
  const h = harness({
    compatible: async () => {
      if (fail) throw new Error("Graphics unavailable");
    },
  });
  await h.api.enterXR("ar");
  assert.equal(h.session.ends, 1);
  assert.equal(h.sandbox.xrSession, null);
  assert.equal(h.sandbox.MR.on, false);
  assert.equal(h.sandbox.overlay.hidden, false);
  assert.match(h.state.notes.join(""), /Graphics unavailable/);
  fail = false;
  await h.api.enterXR("vr");
  assert.equal(h.state.requests, 2);
  assert.equal(h.sandbox.xrSession, h.session);
  assert.equal(h.sandbox.overlay.hidden, true);
});

test("reference-space setup failure cleans up instead of leaking a headset session", async () => {
  const session = makeSession();
  session.requestReferenceSpace = async () => {
    throw new Error("No tracking space");
  };
  const h = harness({ session });
  await h.api.enterXR("vr");
  assert.equal(session.ends, 1);
  assert.equal(h.sandbox.xrSession, null);
  assert.equal(h.sandbox.refSpace, null);
  assert.equal(h.state.menu, 1);
  assert.match(h.state.notes.join(""), /No tracking space/);
});

test("concurrent entry clicks acquire only one session", async () => {
  let resolve;
  const pending = new Promise((r) => {
    resolve = r;
  });
  const h = harness({ request: () => pending });
  const first = h.api.enterXR("vr");
  await h.api.enterXR("vr");
  assert.equal(h.state.requests, 1);
  resolve(h.session);
  await first;
  assert.equal(h.session.frames, 1);
});

test("ending a session while graphics setup awaits cannot reactivate it", async () => {
  let resolve;
  const pending = new Promise((r) => {
    resolve = r;
  });
  let ready;
  const started = new Promise((r) => {
    ready = r;
  });
  const h = harness({
    compatible: () => {
      ready();
      return pending;
    },
  });
  const entry = h.api.enterXR("vr");
  await started;
  h.session.dispatch("end");
  resolve();
  await entry;
  assert.equal(h.sandbox.xrSession, null);
  assert.equal(h.sandbox.overlay.hidden, false);
  assert.equal(h.session.frames, 0);
  assert.equal(h.session.ends, 0);
});

test("local space fallback works when local-floor and bounded-floor are unsupported", async () => {
  const session = makeSession();
  let offsetUsed = false;
  session.requestReferenceSpace = async (type) => {
    if (type !== "local") throw new Error("Unsupported space");
    return events({
      getOffsetReferenceSpace() {
        offsetUsed = true;
        return this;
      },
    });
  };
  const h = harness({ session });
  await h.api.enterXR("vr");
  assert.equal(offsetUsed, true);
  assert.equal(h.sandbox.xrSession, session);
  assert.equal(h.sandbox.boundedSpace, null);
  assert.equal(h.session.ends, 0);
});

test("hidden or blurred sessions cannot fire a buffered shot or advance gameplay", async () => {
  const h = harness();
  await h.api.enterXR("vr");
  h.session.inputSources = [h.controller];
  h.frame();
  const hand = h.api.handFor(h.controller);
  for (const visibility of ["hidden", "visible-blurred"]) {
    Object.assign(hand, {
      held: true,
      pullT: 0.25,
      squeeze: true,
      gripping: true,
    });
    h.session.visibilityState = visibility;
    const updates = h.state.updates;
    h.frame();
    assert.equal(h.state.shots, 0);
    assert.equal(h.state.updates, updates);
    assertReleased(hand);
    h.session.dispatch("selectstart", { inputSource: h.controller });
    assert.equal(hand.held, false);
  }
});

test("lost controller tracking drops the trigger until a new valid press", async () => {
  const h = harness();
  await h.api.enterXR("vr");
  h.session.inputSources = [h.controller];
  h.frame();
  h.session.dispatch("selectstart", { inputSource: h.controller });
  const hand = h.api.handFor(h.controller);
  assert.equal(hand.held, true);
  h.frame({ tracked: false });
  assertReleased(hand);
  h.session.dispatch("selectstart", { inputSource: h.controller });
  assert.equal(hand.held, false);
  h.frame();
  assert.equal(h.state.shots, 0);
  h.session.dispatch("selectstart", { inputSource: h.controller });
  h.frame();
  assert.equal(h.state.shots, 1);
});

test("lost headset tracking suspends simulation and releases every controller", async () => {
  const h = harness();
  await h.api.enterXR("vr");
  h.session.inputSources = [h.controller];
  h.frame();
  const hand = h.api.handFor(h.controller);
  Object.assign(hand, { held: true, pullT: 0.25, squeeze: true });
  const updates = h.state.updates;
  h.frame({ viewer: false });
  assertReleased(hand);
  assert.equal(h.state.updates, updates);
  assert.equal(h.state.shots, 0);
});

test("visibility and controller removal events clear pending input and two-hand grip", async () => {
  const h = harness();
  await h.api.enterXR("vr");
  const hand = h.api.handFor(h.controller);
  Object.assign(hand, {
    held: true,
    pullT: 0.25,
    squeeze: true,
    gripping: true,
    ok: true,
  });
  h.session.dispatch("visibilitychange");
  assertReleased(hand);
  Object.assign(hand, {
    held: true,
    pullT: 0.25,
    squeeze: true,
    gripping: true,
    ok: true,
  });
  h.session.dispatch("inputsourceschange", { removed: [h.controller] });
  assertReleased(hand);
  assert.equal(h.api.hands.has(h.controller), false);
});

test("late frames after session end do not schedule more headset work", async () => {
  const h = harness();
  await h.api.enterXR("vr");
  h.session.dispatch("end");
  const frames = h.session.frames;
  h.frame();
  assert.equal(h.session.frames, frames);
  assert.equal(h.state.updates, 0);
  assert.equal(h.sandbox.xrSession, null);
});
