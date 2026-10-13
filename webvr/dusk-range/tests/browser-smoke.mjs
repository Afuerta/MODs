// Opt-in real WebGL browser regression. Run against the served src directory.
// PLAYWRIGHT_MODULE can point to an installed Playwright package when it is not
// available in this checkout. CHROMIUM_PATH/CHROMIUM_ARGS support CI browsers.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const moduleName = process.env.PLAYWRIGHT_MODULE || "playwright";
const imported = await import(
  moduleName.startsWith("/") ? pathToFileURL(moduleName).href : moduleName
);
const { chromium } = imported.default || imported;
const executablePath = process.env.CHROMIUM_PATH;
const args = process.env.CHROMIUM_ARGS
  ? JSON.parse(process.env.CHROMIUM_ARGS)
  : [
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ];
const browser = await chromium.launch({
  headless: true,
  args,
  ...(executablePath ? { executablePath } : {}),
});
const baseURL = process.env.DUSK_BASE_URL || "http://localhost:8775";
const screenshots = process.env.DUSK_SCREENSHOTS;
if (screenshots) await mkdir(screenshots, { recursive: true });
const pageErrors = [];
const capture = async (page, name) => {
  if (screenshots)
    await page.screenshot({
      path: resolve(screenshots, name + ".png"),
      fullPage: true,
    });
};
async function openPage(context) {
  const page = await context.newPage();
  page.on("pageerror", (error) =>
    pageErrors.push(error.stack || error.message),
  );
  // Optional CDN models and web fonts must never be required for playability.
  // This also keeps the regression deterministic/offline on CI.
  await page.route("https://**/*", (route) =>
    new URL(route.request().url()).origin === new URL(baseURL).origin
      ? route.continue()
      : route.abort(),
  );
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__dusk && window.__dusk.frames > 2);
  assert.equal(
    await page.locator("#vrBtn").isDisabled(),
    true,
    "headless browser has no VR device",
  );
  return page;
}
async function state(page) {
  return page.evaluate(() => ({
    mode: S.mode,
    kind: R.kind,
    phase: R.phase,
    time: S.timeLeft,
    phaseTime: R.phaseT,
    wave: R.wave,
    hearts: PL.hearts,
    score: R.score,
    core: TD.core,
    buildTime: TD.t,
    position: PL.pos.slice(),
    camera: [baseYaw, camYaw, camPitch, flatCrouch],
    ammo: flatGun.ammo,
    projectiles: pshots.map((shot) => ({ p: shot.p.slice(), t: shot.t })),
    enemyShots: eshots.map((shot) => ({ p: shot.p.slice(), t: shot.t })),
  }));
}
async function abandon(page) {
  await page.keyboard.press("Escape");
  await page.locator("#lobbyBtn").click();
  assert.equal(await page.locator("#abandonPrompt").isVisible(), true);
  await page.locator("#keepPlayingBtn").click();
  assert.equal(await page.locator("#abandonPrompt").isVisible(), false);
  assert.equal(await page.evaluate(() => __dusk.paused), true);
  await page.locator("#lobbyBtn").click();
  await page.locator("#abandonBtn").click();
  assert.equal(await page.locator("#menu").isVisible(), true);
}
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await openPage(context);
  await capture(page, "desktop-lobby");
  for (const [mission, kind] of [
    ["range", null],
    ["run", "survival"],
    ["siege", "siege"],
    ["td", "td"],
  ]) {
    await page.locator(`[data-mission="${mission}"]`).click();
    assert.equal(
      await page
        .locator(`[data-mission="${mission}"]`)
        .getAttribute("aria-pressed"),
      "true",
    );
    await page.locator("#flatBtn").click();
    await page.waitForTimeout(200);
    assert.equal(
      await page.evaluate(() => S.mode),
      mission === "range" ? "playing" : "run",
    );
    if (kind) assert.equal(await page.evaluate(() => R.kind), kind);
    if (mission === "run") {
      // Use the existing debugging gun-grant API, then shoot through real input.
      await page.evaluate(() => __dusk.give("right", "plasma"));
      await page.waitForFunction(() => __dusk.gun.id === "plasma");
      await page.mouse.move(720, 500);
      await page.mouse.down();
      await page.waitForFunction(() => pshots.length > 0);
    }
    await page.keyboard.press("Escape");
    assert.equal(
      await page.evaluate(() => __dusk.paused),
      true,
      "Escape must stay paused, not trigger native dialog cancel",
    );
    assert.equal(
      await page.locator("#pauseMenu").evaluate((dialog) => dialog.open),
      true,
    );
    const frozen = await state(page);
    if (mission === "run")
      assert.ok(
        frozen.projectiles.length > 0,
        "pause test includes a live projectile",
      );
    await page.mouse.up();
    await page.mouse.move(2, 2);
    await page.keyboard.down("w");
    await page.keyboard.down("q");
    await page.waitForTimeout(400);
    await page.keyboard.up("q");
    await page.keyboard.up("w");
    assert.deepEqual(
      await state(page),
      frozen,
      "pause freezes timers, position, view, health, shots, and wave state",
    );
    await page.locator("#resumeBtn").click();
    assert.equal(await page.evaluate(() => __dusk.paused), false);
    if (kind) {
      const position = await page.evaluate(() => PL.pos.slice());
      await page.keyboard.down("w");
      await page.waitForTimeout(250);
      await page.keyboard.up("w");
      assert.notDeepEqual(
        await page.evaluate(() => PL.pos.slice()),
        position,
        "WASD remains available after resume",
      );
    }
    await capture(page, mission + "-playing");
    await abandon(page);
    console.log(
      "PASS desktop " +
        mission +
        ": launch, pause freeze, resume, discard protection",
    );
  }
  await page.locator(".settings summary").click();
  await page.locator("#qualityIn").selectOption("performance");
  await page.locator("#volumeIn").fill("25");
  await page.locator("#volumeIn").dispatchEvent("input");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__dusk && window.__dusk.frames > 2);
  assert.equal(await page.locator("#qualityIn").inputValue(), "performance");
  assert.equal(await page.locator("#volumeIn").inputValue(), "25");
  assert.equal(
    await page.locator('[data-mission="td"]').getAttribute("aria-pressed"),
    "true",
  );
  await page.locator("#browseLobbyBtn").click();
  assert.equal(
    await page.evaluate(() => S.mode),
    "menu",
    "Armory visit opens the playable lobby",
  );
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  assert.equal(
    await page.evaluate(() => __dusk.paused),
    false,
    "Escape resumes an existing pause",
  );
  await context.close();

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  });
  const touch = await openPage(mobile);
  await capture(touch, "mobile-lobby");
  const overflow = await touch.evaluate(() => {
    const menu = document.querySelector("#menu");
    const controls = [
      ...document.querySelectorAll("[data-mission], #flatBtn, #gameTitle"),
    ];
    return {
      menu: menu.scrollWidth - menu.clientWidth,
      clipped: controls
        .filter(
          (element) =>
            element.getBoundingClientRect().right > innerWidth + 1 ||
            element.getBoundingClientRect().left < -1,
        )
        .map((element) => element.id || element.dataset.mission),
    };
  });
  assert.equal(overflow.menu, 0, "mobile lobby must not overflow horizontally");
  assert.deepEqual(
    overflow.clipped,
    [],
    "mobile title and launch cards stay on-screen",
  );
  await touch.locator('[data-mission="run"]').tap();
  await touch.locator("#flatBtn").tap();
  assert.equal(await touch.locator("#touchControls").isVisible(), true);
  const turn = touch.locator('[data-control="q"]');
  const turnBox = await turn.boundingBox();
  const yaw = await touch.evaluate(() => baseYaw);
  // The touchscreen tap API releases immediately; hold pointer input to exercise
  // the same pointer-capture handlers used by a sustained finger press.
  await touch.mouse.move(
    turnBox.x + turnBox.width / 2,
    turnBox.y + turnBox.height / 2,
  );
  await touch.mouse.down();
  await touch.waitForTimeout(300);
  await touch.mouse.up();
  assert.notEqual(
    await touch.evaluate(() => baseYaw),
    yaw,
    "touch turn button changes heading",
  );
  assert.equal(
    await touch.evaluate(() => keys.has("q")),
    false,
    "touch turn releases cleanly",
  );
  const duck = touch.locator('[data-control="c"]');
  const duckBox = await duck.boundingBox();
  await touch.mouse.move(
    duckBox.x + duckBox.width / 2,
    duckBox.y + duckBox.height / 2,
  );
  await touch.mouse.down();
  await touch.waitForTimeout(250);
  assert.ok(
    await touch.evaluate(() => flatCrouch > 0.1),
    "touch duck lowers the viewpoint",
  );
  await touch.mouse.up();
  await touch.evaluate(() => {
    flatGun.ammo = 1;
  });
  await touch.locator('[data-control="r"]').tap();
  assert.ok(
    await touch.evaluate(() => flatGun.rel > 0 || flatGun.ammo > 1),
    "touch reload starts or completes",
  );
  await touch.locator("#menuBtn").tap();
  assert.equal(await touch.evaluate(() => __dusk.paused), true);
  await capture(touch, "mobile-pause");
  await touch.locator("#resumeBtn").tap();
  assert.equal(await touch.evaluate(() => __dusk.paused), false);
  console.log(
    "PASS mobile: no clipping, launch, turn/duck/reload controls, pause/resume",
  );
  await mobile.close();
  assert.deepEqual(pageErrors, [], "no browser JavaScript exceptions");
  console.log(
    "PASS browser regression (procedural fallback; no physical headset test)",
  );
} finally {
  await browser.close();
}
