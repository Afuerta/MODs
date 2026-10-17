'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function harness() {
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      id, hidden: false, disabled: id === 'vrBtn', value: '', type: id === 'setSeated' || id === 'setMusic' ? 'checkbox' : 'select-one',
      style: {}, events: {}, textContent: '',
      addEventListener(name, callback) { this.events[name] = callback; },
      focus() { this.focused = true; },
      setPointerCapture() {}, append() {},
    });
    return elements.get(id);
  }
  const windowEvents = {}, documentEvents = {}, counts = { resets: 0, updates: 0, perf: 0, renders: 0 };
  const context = {
    console, Float32Array, Map, Set, Math, Promise,
    m4: () => new Float32Array(16), loadNum: () => 0, saveNum() {}, $: element,
    fovIn: element('fovIn'), fovOut: element('fovOut'), canvas: element('gl'),
    overlay: element('menu'), vrBtn: element('vrBtn'), arBtn: element('arBtn'), flatBtn: element('flatBtn'),
    menuBtn: element('menuBtn'), reticle: element('reticle'), hint: element('hint'), hudEl: element('hud'),
    vrNote: element('vrNote'),
    addEventListener(name, callback) { windowEvents[name] = callback; },
    document: { hidden: false, addEventListener(name, callback) { documentEvents[name] = callback; } },
    performance: { now: () => 1000 }, setTimeout() {}, innerWidth: 800, innerHeight: 600,
    SET: { diff: 'normal', assist: 'low', gfx: 'balanced', music: true, turn: 'snap45', seated: false },
    S: { mode: 'run', last: 'run' }, inRun: () => context.S.mode === 'run',
    resetToMenu() { counts.resets++; context.S.mode = 'menu'; }, audio() {},
    saveSettings() {}, applySetting() {}, targets: [], drawOptions() {},
    xrSession: null, refSpace: null, boundedSpace: null, overlayOpen: false,
    guns: [], update() { counts.updates++; }, perfGuard() { counts.perf++; },
    clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
    headPos: [0, 1.6, 0], XRRigidTransform: class { constructor(position, orientation) { this.position=position; this.orientation=orientation; } },
  };
  vm.createContext(context);
  for (const file of ['36.js', '37.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/js', file), 'utf8'), context, { filename: file });
  }
  const run = source => vm.runInContext(source, context);
  return { context, run, element, counts, windowEvents, documentEvents };
}

test('Escape pauses and resumes an active run without resetting it', () => {
  const h = harness();
  h.run('xrReady=true;flatGun.held=true;flatGun.pullT=.25;flatGun.ads=true;keys.add("w")');
  const escape = { key: 'Escape', preventDefault() {} };
  h.windowEvents.keydown(escape);
  assert.equal(h.run('flatPaused'), true);
  assert.equal(h.context.overlayOpen, true);
  assert.equal(h.counts.resets, 0);
  assert.equal(h.run('flatGun.held||flatGun.ads||flatGun.pullT>0||keys.size>0'), false);
  assert.equal(h.element('flatBtn').textContent, 'Resume game');
  assert.equal(h.element('modePicker').hidden, true);
  assert.equal(h.element('vrBtn').disabled, true);
  h.windowEvents.keydown(escape);
  assert.equal(h.run('flatPaused'), false);
  assert.equal(h.context.overlayOpen, false);
  assert.equal(h.counts.resets, 0);
  assert.equal(h.element('vrBtn').disabled, false);
});

test('returning to the hub is an explicit reset and restores the mode picker', () => {
  const h = harness();
  h.run('openMenu();returnToHub()');
  assert.equal(h.counts.resets, 1);
  assert.equal(h.context.S.mode, 'menu');
  assert.equal(h.run('flatPaused'), false);
  assert.equal(h.context.overlayOpen, true);
  assert.equal(h.element('modePicker').hidden, false);
});

test('holding Escape does not toggle a paused game back into combat', () => {
  const h = harness();
  h.windowEvents.keydown({ key: 'Escape', repeat: false, preventDefault() {} });
  h.windowEvents.keydown({ key: 'Escape', repeat: true, preventDefault() {} });
  assert.equal(h.run('flatPaused'), true);
  assert.equal(h.counts.resets, 0);
});

test('screen play cannot reset a run while XR entry is pending or active', () => {
  const h = harness();
  h.run('xrEntering=true;syncPauseMenu();playFlat()');
  assert.equal(h.element('flatBtn').disabled, true);
  assert.equal(h.counts.resets, 0);
  h.run('xrEntering=false;xrSession={};playFlat()');
  assert.equal(h.counts.resets, 0);
});

test('focus loss pauses a run and clears pending shots and aim', () => {
  const h = harness();
  h.run('flatGun.pullT=.25;flatGun.held=true;flatGun.ads=true;keys.add("w")');
  h.context.document.hidden = true;
  h.documentEvents.visibilitychange();
  assert.equal(h.run('flatPaused'), true);
  assert.equal(h.run('flatGun.pullT'), 0);
  assert.equal(h.run('flatGun.ads'), false);
  assert.equal(h.run('keys.size'), 0);
  assert.equal(h.counts.resets, 0);
});

test('normal release retains short clicks; pointer cancellation clears them', () => {
  const h = harness();
  h.run('flatGun.pullT=.25;flatGun.held=true;mouse.down=true');
  h.element('gl').events.pointerup({ button: 0 });
  h.element('gl').events.lostpointercapture();
  assert.equal(h.run('flatGun.pullT'), .25);
  h.run('flatGun.ads=true');
  h.element('gl').events.pointercancel();
  assert.equal(h.run('flatGun.pullT'), 0);
  assert.equal(h.run('flatGun.ads'), false);
});

for (const visibility of ['hidden', 'visible-blurred', 'visible']) {
  test(`XR ${visibility === 'visible' ? 'tracking loss' : visibility} stops simulation and clears controller input`, () => {
    const h = harness();
    let scheduled = 0, poseReads = 0;
    const session = { visibilityState: visibility, requestAnimationFrame() { scheduled++; } };
    h.context.xrSession = session;
    h.context.refSpace = {};
    h.context.frame = { session, getViewerPose() { poseReads++; return null; } };
    h.run('const testHand=handFor({handedness:"right"});testHand.held=true;testHand.pullT=.25;testHand.squeeze=true;testHand.gripping=true;onXRFrame(1000,frame)');
    assert.equal(scheduled, 1);
    assert.equal(poseReads, visibility === 'visible' ? 1 : 0);
    assert.equal(h.counts.updates, 0);
    assert.equal(h.counts.perf, 0);
    assert.equal(h.run('testHand.held||testHand.pullT>0||testHand.squeeze||testHand.gripping'), false);
    assert.equal(h.run('xrInputReady'), false);
  });
}

test('XR turning waits for a neutral stick after tracking loss', () => {
  const h = harness();
  let turns = 0;
  h.context.refSpace = { getOffsetReferenceSpace() { turns++; return this; } };
  h.context.source = { gamepad: { axes: [0, 0, 1, 0] } };
  h.run('const testHand=handFor(source);releaseXRHand(testHand);stickTurn(testHand,source,.016)');
  assert.equal(turns, 0);
  h.context.source.gamepad.axes[2] = 0;
  h.run('stickTurn(testHand,source,.016)');
  assert.equal(h.run('testHand.turnBlocked'), false);
});

test('pre-headset turning and seated controls mirror persisted options', () => {
  const h = harness();
  h.run('SET.turn="snap30";SET.seated=true;syncMenuSettings()');
  assert.equal(h.element('setTurn').value, 'snap30');
  assert.equal(h.element('setSeated').checked, true);
});

test('paused desktop frames preserve location and do not advance the simulation', () => {
  const h = harness();
  Object.assign(h.context, {
    window: { devicePixelRatio: 1 }, requestAnimationFrame() {},
    lerp: (a,b,t) => a+(b-a)*t, perspective() {}, trs() {}, invert() {}, norm: a => a,
    PL: { pos: [2, 3] }, HEADM: new Float32Array(16), setListener() {},
    buildFrame() {}, fogCol: [0,0,0], renderScene() {},
    gl: { bindFramebuffer() {}, viewport() {}, clearColor() {}, clear() {} },
  });
  Object.assign(h.element('gl'), { clientWidth: 800, clientHeight: 600 });
  h.run('openMenu();flatFrame(1016)');
  assert.equal(h.counts.updates, 0);
  assert.deepEqual(h.context.PL.pos, [2, 3]);
});

test('failed XR initialization ends the partial session and unlocks entry', async () => {
  const h = harness();
  let ended = 0;
  Object.assign(h.context, {
    navigator: { xr: { async requestSession() { return { async end() { ended++; } }; } } },
    gl: { async makeXRCompatible() { throw Error('context not compatible'); } },
    MR: { on: false }, applyMapLighting() {}, squareRoom() {},
  });
  h.context.S.mode = 'menu';
  await h.run('enterXR("vr")');
  assert.equal(ended, 1);
  assert.equal(h.run('xrEntering'), false);
  assert.equal(h.context.xrSession, null);
  assert.match(h.element('vrNote').textContent, /Couldn't initialize VR.*context not compatible/);
});
