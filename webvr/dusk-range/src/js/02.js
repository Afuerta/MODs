'use strict';
const SET = (() => {
    const e = {
        diff: 'normal',
        assist: 'low',
        turn: 'snap45',
        seated: !1,
        gfx: 'balanced',
        music: !0
    };
    try {
        const saved = JSON.parse(localStorage.getItem('dusk-range-settings') || '{}');
        const choices = {
            diff: ['easy', 'normal', 'hard'],
            assist: ['off', 'low', 'high'],
            turn: ['snap45', 'snap30', 'smooth', 'off'],
            gfx: ['balanced', 'high', 'ultra']
        };
        if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
            for (const key of Object.keys(choices)) {
                if (choices[key].includes(saved[key])) e[key] = saved[key];
            }
            for (const key of ['music', 'seated']) {
                if (typeof saved[key] === 'boolean') e[key] = saved[key];
            }
        }
    } catch {}
    return e
})();

function saveSettings() {
    try {
        localStorage.setItem('dusk-range-settings', JSON.stringify(SET))
    } catch {}
}
const OPTIONS = [{
        id: 'diff',
        name: 'DIFFICULTY',
        vals: ['easy', 'normal', 'hard'],
        label: {
            easy: 'EASY',
            normal: 'NORMAL',
            hard: 'HARD'
        },
        desc: {
            easy: 'Tougher you, slower foes, more gold',
            normal: 'The intended challenge',
            hard: 'Fewer hearts, faster, deadlier foes'
        }
    }, {
        id: 'assist',
        name: 'AIM ASSIST',
        vals: ['off', 'low', 'high'],
        label: {
            off: 'OFF',
            low: 'LOW',
            high: 'HIGH'
        },
        desc: {
            off: 'Every shot is all you',
            low: 'Near misses bend onto the target',
            high: 'Generous help for new players'
        }
    }, {
        id: 'turn',
        name: 'TURNING',
        vals: ['snap45', 'snap30', 'smooth', 'off'],
        label: {
            snap45: 'SNAP 45°',
            snap30: 'SNAP 30°',
            smooth: 'SMOOTH',
            off: 'OFF'
        },
        desc: {
            snap45: 'Flick a thumbstick to turn',
            snap30: 'Smaller, finer snap turns',
            smooth: 'Thumbstick turns smoothly',
            off: 'Turn your body to look around'
        }
    }, {
        id: 'seated',
        name: 'SEATED PLAY',
        vals: [!1, !0],
        label: {
            false: 'OFF',
            true: 'ON'
        },
        desc: {
            false: 'Play standing, room-scale',
            true: 'Raises your view while you sit'
        }
    }, {
        id: 'gfx',
        name: 'GRAPHICS',
        vals: ['balanced', 'high', 'ultra'],
        label: {
            balanced: 'BALANCED',
            high: 'HIGH',
            ultra: 'ULTRA'
        },
        desc: {
            balanced: 'Smooth on every Quest',
            high: 'Sharper, more dynamic light',
            ultra: 'Sharpest; best on Quest 3'
        }
    }, {
        id: 'music',
        name: 'MUSIC',
        vals: [!0, !1],
        label: {
            true: 'ON',
            false: 'OFF'
        },
        desc: {
            true: 'Score builds with the fight',
            false: 'Sound effects only'
        }
    }],
    DIFF = {
        easy: {
            hp: .72,
            speed: .85,
            cd: 1.3,
            proj: .82,
            hearts: 2,
            gold: 1.25,
            core: 30
        },
        normal: {
            hp: 1,
            speed: 1,
            cd: 1,
            proj: 1,
            hearts: 0,
            gold: 1,
            core: 20
        },
        hard: {
            hp: 1.3,
            speed: 1.1,
            cd: .85,
            proj: 1.12,
            hearts: -1,
            gold: .9,
            core: 15
        }
    },
    diff = () => DIFF[SET.diff] || DIFF.normal;

function applyDiff() {
    const e = diff();
    D.hp *= e.hp, D.speed *= e.speed, D.cd *= e.cd, D.proj *= e.proj
}
const GFX = {
        balanced: {
            scale: 1,
            lights: 2
        },
        high: {
            scale: 1.2,
            lights: 4
        },
        ultra: {
            scale: 1.4,
            lights: 4
        }
    },
    gfx = () => GFX[SET.gfx] || GFX.balanced,
    PERF = {
        ema: .0139,
        slow: 0,
        low: !1
    };

function perfGuard(e) {
    if (!(!e || PERF.low) && (PERF.ema += (e - PERF.ema) * .05, PERF.slow = PERF.ema > .0185 ? PERF.slow + e : Math.max(0, PERF.slow - e * .5), PERF.slow > 4)) {
        PERF.low = !0;
        try {
            xrQuality(1)
        } catch {}
    }
}
