"use strict";

// The screen shell owns presentation and pause state, never run progression.
const MISSIONS = {
  range: {
    name: "Target Range",
    tag: "Precision · 60 seconds",
    goal: "Find your rhythm.",
    detail:
      "Hit the gold, chain your streak, and catch the clay pigeons. Red X targets cost you points.",
    tip: "Rings score 2–10. Clay pigeons score 25. Every five consecutive hits raises your multiplier, up to 4×.",
  },
  run: {
    name: "Survival",
    tag: "Endless · choose your upgrades",
    goal: "Outlast the frontier.",
    detail:
      "Outlaw robots, invaders, and wild things. Clear each wave, then shoot one reward crate to shape your build.",
    tip: "A boss arrives every fifth wave. Duck or sidestep incoming shots; upgrade your weapons and perks between fights.",
  },
  siege: {
    name: "Night Siege",
    tag: "Roguelite · loot & permanent upgrades",
    goal: "Hold Hollow Creek.",
    detail:
      "The dead are rising. Earn gold, try the Lucky Coffin, and bring souls home to spend at the Armory.",
    tip: "The trader arrives between waves. Shoot READY when equipped, or watch the countdown. Aim down in VR to reload.",
  },
  td: {
    name: "Gridlock",
    tag: "Tower defense · command & combat",
    goal: "Keep the beacon alive.",
    detail:
      "Build a defense on the miniature war table. Upgrade towers, recruit wingman drones, and call in airstrikes.",
    tip: "Shoot a pad on the table to build. Start a wave early for bonus gold. Your guns can help finish enemies that get through.",
  },
};
const PLAY = {
  paused: false,
  selected: "range",
  quality: "balanced",
  volume: 0.5,
};
try {
  const selected = localStorage.getItem("dusk-range-mode");
  if (Object.hasOwn(MISSIONS, selected)) PLAY.selected = selected;
  const quality = localStorage.getItem("dusk-range-quality");
  if (["performance", "balanced", "crisp"].includes(quality))
    PLAY.quality = quality;
  const raw = localStorage.getItem("dusk-range-volume");
  if (raw !== null && Number.isFinite(Number(raw)))
    PLAY.volume = clamp(Number(raw), 0, 1);
} catch {}

function rememberSetting(key, value) {
  try {
    localStorage.setItem("dusk-range-" + key, String(value));
  } catch {}
}
function screenPaused() {
  return PLAY.paused || (!xrSession && document.hidden);
}
function screenPixelRatio() {
  return { performance: 1, balanced: 1.5, crisp: 2 }[PLAY.quality];
}
function updateMenuStats() {
  $("careerRank").textContent = rankOf(META.total);
  $("careerSouls").textContent = META.souls.toLocaleString();
  $("careerRecord").textContent = S.bestWave
    ? "Wave " + S.bestWave
    : "Your first run awaits";
}
function selectMission(id) {
  if (!Object.hasOwn(MISSIONS, id)) return;
  PLAY.selected = id;
  rememberSetting("mode", id);
  const mission = MISSIONS[id];
  for (const button of document.querySelectorAll("[data-mission]")) {
    button.setAttribute("aria-pressed", String(button.dataset.mission === id));
  }
  $("missionTag").textContent = mission.tag;
  $("missionTitle").textContent = mission.goal;
  $("missionDetail").textContent = mission.detail;
  $("missionTip").textContent = mission.tip;
  flatBtn.textContent = "Play " + mission.name;
}
function launchMission() {
  const id = PLAY.selected;
  playFlat();
  ({ range: startRound, run: startRun, siege: startSiege, td: startTD })[id]();
  updateObjective();
}
function clearScreenInput() {
  keys.clear();
  releaseTrigger();
  flatGun.pullT = 0;
  flatGun.ads = false;
}
function pauseFlat() {
  if (xrSession || overlayOpen || PLAY.paused) return;
  PLAY.paused = true;
  clearScreenInput();
  $("pauseSummary").textContent =
    S.mode === "playing"
      ? Math.ceil(S.timeLeft) +
        " seconds left · " +
        S.score.toLocaleString() +
        " points"
      : inRun()
        ? MISSIONS[R.kind === "survival" ? "run" : R.kind].name +
          " · Wave " +
          R.wave +
          " · " +
          R.kills +
          " eliminations"
        : "Take your time. Your position is held.";
  $("abandonPrompt").hidden = true;
  $("pauseMenu").showModal();
  $("resumeBtn").focus();
  if (actx?.state === "running") actx.suspend().catch(() => {});
}
function resumeFlat() {
  if (!PLAY.paused || xrSession) return;
  PLAY.paused = false;
  clearScreenInput();
  lastFlat = performance.now() / 1000;
  $("pauseMenu").close();
  audio();
  canvas.focus({ preventScroll: true });
}
function closePause() {
  PLAY.paused = false;
  $("pauseMenu").close();
}
function objectiveText() {
  if (S.mode === "playing")
    return {
      label: "TARGET RANGE · " + Math.ceil(S.timeLeft) + "s",
      detail:
        S.score.toLocaleString() +
        " points · " +
        multiplier() +
        "× multiplier · " +
        (S.shots ? Math.round((S.hits / S.shots) * 100) : 0) +
        "% accuracy",
    };
  if (!inRun())
    return S.mode === "results"
      ? {
          label: "RUN COMPLETE",
          detail:
            "Shoot a mode target to play again, or open the lobby from Pause.",
        }
      : {
          label: "CHOOSE YOUR NEXT RUN",
          detail:
            "Shoot a mode target to begin. The Armory on the left spends your earned souls.",
        };
  const left = liveEnemies() + R.queue.length;
  if (R.lvlUp)
    return {
      label: "LEVEL UP",
      detail: "Shoot one of the glowing upgrade cards to choose your perk.",
    };
  if (R.phase === "enter")
    return {
      label: "ENTERING THE FIELD",
      detail: "Get ready. Your next run is loading.",
    };
  if (R.phase === "build")
    return {
      label: "BUILD PHASE · " + Math.max(0, Math.ceil(TD.t)) + "s",
      detail:
        "Shoot a war-table pad to build. Call the next wave early for bonus gold.",
    };
  if (R.phase === "shop")
    return {
      label:
        "TRADER · " +
        Math.max(0, Math.ceil(SIEGE_SHOP_SECONDS - R.phaseT)) +
        "s",
      detail:
        "Buy equipment, then shoot READY. The next wave starts when the countdown ends.",
    };
  if (R.phase === "pick")
    return {
      label: "CHOOSE ONE REWARD",
      detail:
        "Shoot a crate to equip a weapon, claim a perk, or recover health.",
    };
  if (R.phase === "intro")
    return {
      label: (R.wave % 5 === 0 ? "BOSS WAVE " : "WAVE ") + R.wave,
      detail:
        R.kind === "td"
          ? "Protect the beacon. Watch the routes on your war table."
          : "Reload and get ready. Enemies are approaching.",
    };
  if (R.phase === "fight")
    return {
      label: "WAVE " + R.wave + " · " + left + " REMAINING",
      detail:
        R.kind === "td"
          ? "Defend the beacon · " + TD.core + "/" + TD.coreMax + " integrity"
          : R.kind === "siege"
            ? "Hold the line. Collect gold and watch for marked bounty targets."
            : "Clear every enemy to unlock your next upgrade.",
    };
  return {
    label: "WAVE " + R.wave + " CLEARED",
    detail: "Catch your breath. Your next reward is on its way.",
  };
}
let objectiveKey = "";
function updateObjective() {
  const visible = !overlayOpen && !xrSession;
  $("objective").hidden = !visible;
  $("touchControls").hidden = !visible || PLAY.paused;
  if (!visible) return;
  const { label, detail } = objectiveText();
  const key = label + detail;
  if (key === objectiveKey) return;
  objectiveKey = key;
  $("objectiveLabel").textContent = label;
  $("objectiveDetail").textContent = detail;
}

for (const button of document.querySelectorAll("[data-mission]")) {
  button.addEventListener("click", () => selectMission(button.dataset.mission));
}
$("resumeBtn").addEventListener("click", resumeFlat);
$("pauseMenu").addEventListener("cancel", (event) => {
  event.preventDefault();
  resumeFlat();
});
$("lobbyBtn").addEventListener("click", () => {
  if (inRun() || S.mode === "playing") {
    $("abandonPrompt").hidden = false;
    $("keepPlayingBtn").focus();
  } else openMenu();
});
$("keepPlayingBtn").addEventListener("click", () => {
  $("abandonPrompt").hidden = true;
  $("resumeBtn").focus();
});
$("abandonBtn").addEventListener("click", () => openMenu());
$("browseLobbyBtn").addEventListener("click", () => {
  playFlat();
  updateObjective();
});
$("qualityIn").value = PLAY.quality;
$("qualityIn").addEventListener("change", (event) => {
  if (!["performance", "balanced", "crisp"].includes(event.target.value))
    return;
  PLAY.quality = event.target.value;
  rememberSetting("quality", PLAY.quality);
});
$("volumeIn").value = Math.round(PLAY.volume * 100);
$("volumeOut").textContent = Math.round(PLAY.volume * 100) + "%";
$("volumeIn").addEventListener("input", (event) => {
  PLAY.volume = clamp(Number(event.target.value) / 100, 0, 1);
  $("volumeOut").textContent = Math.round(PLAY.volume * 100) + "%";
  if (master) master.gain.value = PLAY.volume;
  rememberSetting("volume", PLAY.volume);
});
// Touch users can turn, reload, and duck without a physical keyboard.
for (const button of document.querySelectorAll("[data-control]")) {
  const key = button.dataset.control;
  button.addEventListener("pointerdown", (event) => {
    if (overlayOpen || xrSession || PLAY.paused) return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    key === "r" ? startReload(flatGun) : keys.add(key);
  });
  for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
    button.addEventListener(event, () => keys.delete(key));
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseFlat();
});
selectMission(PLAY.selected);
updateMenuStats();
