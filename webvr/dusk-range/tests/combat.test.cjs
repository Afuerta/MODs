const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// The original game uses classic scripts with WebGL initialization at file scope.
// Exercise its real combat functions without creating a renderer or an XR session.
function gameFunction(file, name) {
  const source = fs.readFileSync(path.join(__dirname, '../src/js', file), 'utf8');
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} exists in ${file}`);
  let depth = 0;
  let quote = null;
  let lineComment = false;
  let blockComment = false;
  for (let i = source.indexOf('{', start); i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];
    if (lineComment) {
      if (ch === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (ch === '*' && next === '/') { blockComment = false; i++; }
      continue;
    }
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '/' && next === '/') { lineComment = true; i++; continue; }
    if (ch === '/' && next === '*') { blockComment = true; i++; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`Unterminated function ${name}`);
}

function damageHarness() {
  const numbers = [];
  const context = vm.createContext({
    R: { dmg: 1, perks: {} },
    TD: { quiet: false },
    flashes: [], shocks: [],
    inRun: () => true,
    dmgNumber: (point, damage, crit) => numbers.push({ damage, crit }),
    sfx: { ehit() {} },
    rdir: () => [0, 0, 0],
    rand: () => 1,
    part() {},
    killEnemy: enemy => { enemy.state = 'dead'; },
  });
  vm.runInContext(gameFunction('26.js', 'damageEnemy'), context);
  const enemy = (options = {}) => ({
    state: 'hold', hp: 100, phased: 0, kx: 0, kz: 0,
    T: { gib: [[1, 1, 1]] }, ...options,
  });
  const hit = (target, damage, multiplier = 1) => context.damageEnemy(
    target, damage, [0, 1, -5, 0.3, multiplier], [0, 1, -5], null, false,
  );
  return { context, numbers, enemy, hit };
}

test('armor reduces health damage and the displayed damage by the same amount', () => {
  const h = damageHarness();
  h.context.R.dmg = 2;
  const armored = h.enemy({ elite: 'armored' });
  const normal = h.enemy();
  h.hit(armored, 10);
  h.hit(normal, 10);
  assert.equal(armored.hp, 88);
  assert.equal(normal.hp, 80);
  assert.deepEqual(h.numbers.map(hit => hit.damage), [12, 20]);
});

test('weak spots bypass armor while lethal body hits still kill', () => {
  const h = damageHarness();
  const head = h.enemy({ elite: 'armored' });
  const body = h.enemy({ elite: 'armored', hp: 5 });
  h.hit(head, 10, 2);
  h.hit(body, 10);
  assert.equal(head.hp, 80);
  assert.equal(h.numbers[0].crit, true);
  assert.equal(body.state, 'dead');
  assert.equal(body.hp, -1);
});

test('custom hit handlers receive armor-adjusted damage and remain authoritative', () => {
  const h = damageHarness();
  let received;
  const target = h.enemy({
    elite: 'armored',
    T: { gib: [[1, 1, 1]], onHit(enemy, damage) { received = damage; return true; } },
  });
  h.hit(target, 10);
  assert.equal(received, 6);
  assert.equal(target.hp, 100);
  assert.equal(h.numbers.length, 0);
});

test('phase and boss spawn immunity still prevent damage', () => {
  const h = damageHarness();
  const phased = h.enemy({ phased: 1, elite: 'armored' });
  const spawningBoss = h.enemy({ state: 'spawn', T: { boss: true } });
  h.hit(phased, 10);
  h.hit(spawningBoss, 10);
  assert.equal(phased.hp, 100);
  assert.equal(spawningBoss.hp, 100);
  assert.equal(h.numbers.length, 0);
});

function frameHarness(kind = 'duel', timeScale = 1) {
  const events = [];
  const noop = () => {};
  const context = vm.createContext({
    R: { kind, phase: 'draw', phaseT: 0, lvlUp: null },
    S: { mode: 'run' },
    PL: { invuln: 0, hurt: 0, heal: 0, shieldFx: 0 },
    DUEL: {},
    HINTQ: [], medalT: 10,
    timeScale, clock: 0, signY: 0, signGoal: 0, benchY: 0,
    benchGoal: () => 0,
    MAP: { cur: 'city' },
    xrSession: null,
    banner: { on: false },
    targets: [], parts: [], tracers: [], zaps: [], flashes: [], shocks: [], puffs: [], popupPool: [],
    inRun: () => context.S.mode === 'run',
    duelGuns: () => [],
    updateMapFade: noop,
    tdTick: noop,
    updateEnemies: dt => events.push(['enemies', context.R.phaseT, dt]),
    updateEShots: noop, updatePShots: noop, updateFields: noop,
    rewardsTick: noop, audioTick: noop, updateCity: noop, drawBoard: noop,
  });
  for (const name of ['runUpdate', 'siegeUpdate', 'tdUpdate']) {
    context[name] = dt => { events.push([name, dt]); context.R.phaseT += dt; };
  }
  vm.runInContext([
    gameFunction('33.js', 'duelUpdate'),
    gameFunction('33.js', 'extrasTick'),
    gameFunction('34.js', 'update'),
  ].join('\n'), context);
  const duelUpdate = context.duelUpdate;
  context.duelUpdate = dt => { events.push(['duel', dt]); duelUpdate(dt); };
  return { context, events };
}

test('Quick Draw advances once per frame in real time before enemy decisions', () => {
  const { context, events } = frameHarness('duel', 0.25);
  context.update(0.1);
  assert.equal(context.R.phaseT, 0.1);
  assert.deepEqual(events.map(event => event[0]), ['duel', 'enemies']);
  assert.equal(events[1][1], 0.1);
  assert.ok(events[1][2] < 0.1, 'world animation remains slowed');
});

test('Quick Draw clock remains accurate across multiple slowed frames', () => {
  const { context, events } = frameHarness('duel', 0.3);
  for (let i = 0; i < 60; i++) context.update(1 / 60);
  assert.ok(Math.abs(context.R.phaseT - 1) < 1e-12);
  assert.equal(events.filter(event => event[0] === 'duel').length, 60);
});

test('other run modes retain one simulation-time update per frame', () => {
  for (const [kind, expected] of [['survival', 'runUpdate'], ['siege', 'siegeUpdate'], ['td', 'tdUpdate']]) {
    const { context, events } = frameHarness(kind, 0.25);
    context.update(0.1);
    assert.deepEqual(events.map(event => event[0]), [expected, 'enemies']);
    assert.equal(context.R.phaseT, events[1][2]);
    assert.ok(context.R.phaseT > 0 && context.R.phaseT < 0.1);
  }
});

test('results do not continue the duel reaction clock', () => {
  const { context, events } = frameHarness();
  context.S = { mode: 'results', replaySpawned: true, returnAt: 0 };
  context.update(0.1);
  assert.equal(context.R.phaseT, 0);
  assert.deepEqual(events.map(event => event[0]), ['enemies']);
});
