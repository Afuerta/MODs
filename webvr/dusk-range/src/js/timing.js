"use strict";
// Game effects follow simulation time, so pause and run resets also stop them.
let gameEffects = [];
function scheduleGameEffect(callback, delayMs) {
  gameEffects.push({ callback, remaining: Math.max(0, delayMs / 1000) });
}
function clearGameEffects() {
  gameEffects = [];
}
function tickGameEffects(dt) {
  if (dt <= 0) return;
  const pending = gameEffects;
  gameEffects = [];
  for (const effect of pending) {
    effect.remaining -= dt;
    if (effect.remaining <= 0) effect.callback();
    else gameEffects.push(effect);
  }
}
