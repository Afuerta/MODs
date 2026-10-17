const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '../src/js', file), 'utf8');

function launcher(overrides = {}) {
    const calls = [];
    const buttons = ['range', 'run', 'siege', 'td', 'duel'].map(mode => ({
        dataset: { mode }, disabled: true,
        addEventListener(event, fn) { this.click = fn; }
    }));
    const context = vm.createContext({
        xrSession: null, xrEntering: false, flatPaused: false, overlayOpen: true, gl: {},
        window: { __dusk: {} },
        document: { querySelectorAll: () => buttons },
        playFlat: () => calls.push('hub'),
        startRound: () => calls.push('range'),
        startRun: () => calls.push('run'),
        startSiege: () => calls.push('siege'),
        startTD: () => calls.push('td'),
        startDuel: () => calls.push('duel'),
        ...overrides
    });
    vm.runInContext(read('39.js'), context);
    return { context, calls, buttons };
}

test('all five quick-start buttons enter the hub before their matching game', () => {
    const h = launcher();
    for (const button of h.buttons) {
        assert.equal(button.disabled, false);
        button.click();
        assert.deepEqual(h.calls.splice(0), ['hub', button.dataset.mode]);
    }
});

test('quick start cannot overwrite paused, active or headset games', () => {
    for (const state of [{ flatPaused: true }, { overlayOpen: false }, { xrSession: {} }, { xrEntering: true }]) {
        const h = launcher(state);
        assert.equal(h.context.launchMode('run'), false);
        assert.equal(h.calls.length, 0);
    }
});

test('unsupported graphics or incomplete boot leaves launch buttons disabled', () => {
    for (const state of [{ gl: null }, { window: {} }]) {
        const h = launcher(state);
        assert.ok(h.buttons.every(button => button.disabled));
    }
});

test('unknown and inherited property mode names do not reset the game', () => {
    const h = launcher();
    for (const mode of ['unknown', '__proto__', 'constructor', 'toString']) {
        assert.equal(h.context.launchMode(mode), false);
    }
    assert.equal(h.calls.length, 0);
});

function settings(saved) {
    const context = vm.createContext({ localStorage: { getItem: () => saved } });
    vm.runInContext(read('02.js'), context);
    return JSON.parse(vm.runInContext('JSON.stringify(SET)', context));
}

test('existing valid comfort and difficulty preferences survive loading', () => {
    const saved = { diff: 'hard', assist: 'off', turn: 'snap30', seated: true, gfx: 'high', music: false };
    assert.deepEqual(settings(JSON.stringify(saved)), saved);
});

test('malformed saved settings retain defaults without admitting unknown keys', () => {
    const defaults = { diff: 'normal', assist: 'low', turn: 'snap45', seated: false, gfx: 'balanced', music: true };
    for (const input of ['{', 'null', '[]', '7', '{"diff":"broken","turn":"spin","seated":"false","music":0,"unknown":true}']) {
        assert.deepEqual(settings(input), defaults);
    }
});
