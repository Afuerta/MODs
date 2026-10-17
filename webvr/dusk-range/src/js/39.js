'use strict';

// The HTML launcher shares the same mode entry points as the in-world targets.
// A paused run must be resumed or explicitly abandoned at the hub first.
function launchMode(mode) {
    if (xrSession || xrEntering || flatPaused || !overlayOpen || !gl) return false;
    const modes = {
        range: startRound,
        run: startRun,
        siege: startSiege,
        td: startTD,
        duel: startDuel
    };
    if (!Object.hasOwn(modes, mode)) return false;
    playFlat();
    modes[mode]();
    return true;
}

// Enable only after the game has completed its normal boot sequence.
if (gl && window.__dusk) {
    for (const button of document.querySelectorAll('[data-mode]')) {
        button.disabled = false;
        button.addEventListener('click', () => launchMode(button.dataset.mode));
    }
}
