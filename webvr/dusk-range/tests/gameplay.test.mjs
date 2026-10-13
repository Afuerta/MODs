import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = (file) =>
  readFileSync(new URL(`../src/js/${file}.js`, import.meta.url), "utf8");
// Run the shipped game functions without WebGL, exercising their actual state changes.
function gameFunction(file, name) {
  const match = source(file).match(
    new RegExp(`^function ${name}\\([^]*?^}`, "m"),
  );
  assert.ok(match, `${name} is present in ${file}.js`);
  return match[0];
}

function waveGame(mode) {
  const noop = () => {};
  const context = vm.createContext({
    R: {
      kind: mode,
      phase: "fight",
      phaseT: 0,
      wave: 2,
      queue: ["shambler"],
      spawnT: 0,
      cap: 5,
      spawned: 0,
      waveSize: 1,
      bountyDone: true,
      stat: {},
      score: 0,
      gold: 0,
      waveHit: false,
    },
    PL: {},
    TD: { padT: [], ko: 0, charge: 0 },
    enemies: [],
    eshots: [],
    pshots: [],
    SIEGE_SHOP_SECONDS: 40,
    sfx: { clear: noop },
    rand: () => 1,
    maybeElite: noop,
    updateCoffin: noop,
    markBounty: noop,
    puff: noop,
    showBanner: noop,
    tdUpdateTowers: noop,
    tdUpdateDrones: noop,
    tdUpdateStrikes: noop,
  });
  vm.runInContext(
    `
    function liveEnemies() { return enemies.filter(enemy => enemy.state !== "dead").length; }
    function spawnEnemy(type) { const enemy = { type, state: "spawn", T: {} }; enemies.push(enemy); return enemy; }
    const spawnZombie = spawnEnemy;
    function tdSpawnNext() { spawnEnemy(R.queue.shift()); }
    function addGold(amount) { R.gold += amount; }
    const tdGold = addGold;
  `,
    context,
  );
  const file = mode === "survival" ? "28" : mode === "siege" ? "29" : "31";
  const name =
    mode === "survival"
      ? "runUpdate"
      : mode === "siege"
        ? "siegeUpdate"
        : "tdUpdate";
  vm.runInContext(gameFunction(file, name), context);
  if (mode === "td")
    vm.runInContext(gameFunction("31", "tdWaveClear"), context);
  return { context, tick: () => vm.runInContext(`${name}(0.1)`, context) };
}

for (const mode of ["survival", "siege", "td"]) {
  test(`${mode}: spawning the final queued enemy cannot clear or reward a wave`, () => {
    const { context: game, tick } = waveGame(mode);
    tick();
    assert.equal(game.R.queue.length, 0);
    assert.equal(game.enemies.length, 1);
    assert.equal(
      game.R.phase,
      "fight",
      "the last enemy must still be defeated",
    );
    assert.equal(game.R.gold, 0);
    assert.equal(game.R.score, 0);
    assert.equal(game.R.stat.clean, undefined);

    game.enemies[0].state = "dead";
    tick();
    assert.equal(game.R.phase, "clear");
    assert.equal(game.R.stat.clean, 1);
    const reward = mode === "survival" ? game.R.score : game.R.gold;
    assert.equal(
      reward,
      mode === "survival" ? 100 : mode === "siege" ? 80 : 69,
    );
    tick();
    assert.equal(
      mode === "survival" ? game.R.score : game.R.gold,
      reward,
      "one reward per cleared wave",
    );
    assert.equal(game.R.stat.clean, 1);
  });
}

function metaGame(saved) {
  const storage = { value: saved, writes: 0 };
  const context = vm.createContext({
    storage,
    localStorage: {
      getItem: () => storage.value,
      setItem: (_key, value) => {
        storage.value = value;
        storage.writes++;
      },
    },
  });
  const weapons = source("20");
  vm.runInContext(
    weapons.slice(
      weapons.indexOf("const BASE_GUNS ="),
      weapons.indexOf("function heldGun("),
    ),
    context,
  );
  vm.runInContext(source("29").split("function awardSouls()")[0], context);
  return context;
}

test("saved progression preserves valid purchases and bounds invalid upgrade levels", () => {
  const game = metaGame(
    JSON.stringify({
      souls: "19",
      total: 44,
      up: {
        vital: 1,
        quick: 2000,
        guns: -4,
        fire: "2",
        gold: 2.8,
        luck: null,
        sidearm: 999,
        unknown: 5,
      },
    }),
  );
  const meta = JSON.parse(vm.runInContext("JSON.stringify(META)", game));
  assert.deepEqual(meta, {
    souls: 19,
    total: 44,
    up: { vital: 1, gold: 2, fire: 2, quick: 3, luck: 0, guns: 0, sidearm: 1 },
  });
});

test("Armory never sells tiers without guns and refunds legacy purchases only once", () => {
  const game = metaGame(
    JSON.stringify({ souls: 20, total: 1800, up: { guns: 10, vital: 2 } }),
  );
  assert.equal(
    vm.runInContext(
      "UPGRADES.find(upgrade => upgrade.id === 'guns').cost.length",
      game,
    ),
    6,
  );
  assert.equal(vm.runInContext("META.up.guns", game), 6);
  assert.equal(vm.runInContext("gunPool().length", game), 20);
  assert.equal(vm.runInContext("META.souls", game), 1240);
  assert.equal(
    vm.runInContext("META.total", game),
    1800,
    "refunds do not count as new lifetime earnings",
  );
  assert.equal(vm.runInContext("META.up.vital", game), 2);
  assert.equal(game.storage.writes, 1);
  const reloaded = metaGame(game.storage.value);
  assert.equal(vm.runInContext("META.souls", reloaded), 1240);
  assert.equal(
    reloaded.storage.writes,
    0,
    "the normalized save cannot trigger a second refund",
  );
});

test("Night Siege trader holds until its advertised 40-second deadline", () => {
  const { context: game, tick } = waveGame("siege");
  game.R.phase = "shop";
  game.R.phaseT = 39.7;
  vm.runInContext(
    "function closeShop() { R.phase = 'leaving'; R.phaseT = 0; }",
    game,
  );
  tick();
  assert.equal(game.R.phase, "shop");
  game.R.phaseT = 39.95;
  tick();
  assert.equal(game.R.phase, "leaving");
});

test("VR wrist redraws partial contract progress without an unrelated stat change", () => {
  const labels = [];
  const noop = () => {};
  const ctx = new Proxy(
    { fillText: (label) => labels.push(label) },
    { get: (target, key) => target[key] ?? noop },
  );
  const game = vm.createContext({
    R: {
      wave: 1,
      gold: 100,
      lvl: 1,
      xp: 0,
      combo: 0,
      weapons: {},
      queue: [],
      stat: { parries: 1 },
      contracts: [
        {
          c: { stat: "parries", text: () => "Shoot down 5 shots" },
          n: 5,
          done: false,
        },
      ],
    },
    PL: { hearts: 5, max: 5, shield: 0 },
    TD: { core: 20 },
    wrist: { ctx },
    FB: "sans-serif",
    FD: "sans-serif",
    inRun: () => true,
    goldMode: () => true,
    liveEnemies: () => 1,
    drawHearts: noop,
    gunLine: noop,
    spaced: noop,
    upload: noop,
    xpNext: () => 7,
  });
  vm.runInContext(
    "let wristKey = '';\n" + gameFunction("11", "drawWrist"),
    game,
  );
  vm.runInContext("drawWrist();", game);
  assert.ok(labels.includes("1/5"));
  labels.length = 0;
  game.R.stat.parries = 2;
  vm.runInContext("drawWrist();", game);
  assert.ok(labels.includes("2/5"));
});

for (const saved of [
  "{broken",
  "null",
  JSON.stringify({ souls: -5, total: "Infinity", up: {} }),
]) {
  test(`invalid save recovers playable default progression: ${saved}`, () => {
    const game = metaGame(saved);
    assert.equal(
      vm.runInContext(
        "META.souls + META.total + Object.values(META.up).reduce((a, b) => a + b, 0)",
        game,
      ),
      0,
    );
  });
}

test("Gridlock reset clears a pending Beacon defeat before another match", () => {
  const game = vm.createContext({ TD: { lost: true, core: 0 } });
  vm.runInContext(gameFunction("31", "tdReset") + "\ntdReset();", game);
  assert.equal(game.TD.lost, false);
  assert.equal(game.TD.core, 20);
});

test("ending a run twice awards souls once and does not repay completed contracts", () => {
  const game = metaGame(JSON.stringify({ souls: 10, total: 10 }));
  const noop = () => {};
  Object.assign(game, {
    S: { mode: "run", bestSiege: 0 },
    R: { kind: "siege", wave: 2, kills: 8, bossKills: 0, contractSouls: 10 },
    targets: [],
    COFFIN: {},
    clock: 1,
    sfx: { die: noop },
    showBanner: noop,
    clearEnemies: noop,
    saveNum: noop,
    updateBestOut: noop,
    drawSignResults: noop,
    drawBoard: noop,
    setTimeout: noop,
  });
  vm.runInContext(
    gameFunction("29", "awardSouls") + "\n" + gameFunction("28", "endRun"),
    game,
  );
  vm.runInContext("endRun(); endRun();", game);
  assert.equal(game.S.mode, "results");
  assert.equal(vm.runInContext("META.souls", game), 22);
  assert.equal(vm.runInContext("META.total", game), 22);
  assert.equal(game.R.souls, 12);
});
