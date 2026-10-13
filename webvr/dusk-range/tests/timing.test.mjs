import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
function timing() {
  const ctx = vm.createContext({});
  vm.runInContext(
    readFileSync(new URL("../src/js/timing.js", import.meta.url), "utf8"),
    ctx,
  );
  return ctx;
}
test("delayed game effects do not expire during pause, and continue on resume", () => {
  const ctx = timing();
  let fired = 0;
  ctx.scheduleGameEffect(() => fired++, 250);
  ctx.tickGameEffects(0.1);
  for (let i = 0; i < 1000; i++) ctx.tickGameEffects(0);
  assert.equal(fired, 0);
  ctx.tickGameEffects(0.2);
  assert.equal(fired, 1);
  ctx.tickGameEffects(10);
  assert.equal(fired, 1);
});
test("leaving a run cancels its pending explosions and rank banners", () => {
  const ctx = timing();
  let old = 0;
  let current = 0;
  ctx.scheduleGameEffect(() => old++, 250);
  ctx.scheduleGameEffect(() => old++, 2600);
  ctx.clearGameEffects();
  ctx.scheduleGameEffect(() => current++, 100);
  ctx.tickGameEffects(3);
  assert.equal(old, 0);
  assert.equal(current, 1);
});
test("paused audio cannot create or resume its audio context", () => {
  const ctx = vm.createContext({ PLAY: { paused: true } });
  vm.runInContext(
    readFileSync(new URL("../src/js/12.js", import.meta.url), "utf8"),
    ctx,
  );
  assert.equal(ctx.audio(), null);
});
