"use strict";
(resetToMenu(),
  checkVR(),
  requestAnimationFrame(flatFrame),
  loadAssets(),
  document.fonts &&
    document.fonts.load &&
    Promise.all([
      document.fonts.load(`100px ${FD}`),
      document.fonts.load(`600 30px ${FB}`),
      document.fonts.load(`700 30px ${FB}`),
    ])
      .catch(() => {})
      .then(() => {
        (S.mode === "results" ? drawSignResults() : drawSignMenu(),
          drawBoard(!0),
          drawWrist(!0),
          FACE_TEX.paint(),
          DUD_TEX.paint(),
          LABEL_TEX.paint(),
          RUN_TEX.paint(),
          CITY_TEX.paint(),
          BILL_TEX.paint(),
          HQ_TEX.paint(),
          (TD.cmdKey = TD.bldKey = ""));
      }),
  (window.__dusk = {
    project(e, t, r) {
      const s = xf(VIEW, [e, t, r]);
      return {
        x: (((PROJ[0] * s[0]) / -s[2]) * 0.5 + 0.5) * innerWidth,
        y: (0.5 - ((PROJ[5] * s[1]) / -s[2]) * 0.5) * innerHeight,
        behind: s[2] > 0,
      };
    },
    get paused() {
      return PLAY.paused;
    },
    get elapsed() {
      return S.elapsed;
    },
    get objective() {
      return objectiveText();
    },
    get mode() {
      return S.mode;
    },
    get score() {
      return S.score;
    },
    get shots() {
      return S.shots;
    },
    get hits() {
      return S.hits;
    },
    get targets() {
      return targets.map((e) => ({
        kind: e.kind,
        game: e.game,
        state: e.state,
        x: e.x,
        y: e.y,
        z: e.z,
        scale: e.scale,
        offer: e.offer && e.offer.type,
        landed: e.landed,
      }));
    },
    get run() {
      return {
        wave: R.wave,
        phase: R.phase,
        score: R.score,
        kills: R.kills,
        queue: R.queue.length,
        weapons: { left: R.weapons.left.id, right: R.weapons.right.id },
        gold: R.gold,
        kind: R.kind,
        perks: Object.keys(R.perks),
        hearts: PL.hearts,
        max: PL.max,
        shield: PL.shield,
      };
    },
    get enemies() {
      return enemies.map((e) => ({
        type: e.type,
        state: e.state,
        x: e.x,
        y: e.y,
        z: e.z,
        hp: e.hp,
        phased: e.phased > 0,
        hb: e.hbw.map((t) => t.slice(0, 4)),
      }));
    },
    get eshots() {
      return eshots.map((e) => ({ kind: e.kind, p: e.p.slice() }));
    },
    get room() {
      return {
        cx: ROOM.cx,
        cz: ROOM.cz,
        r: ROOM.r,
        bounded: ROOM.bounded,
        pts: ROOM.pts,
      };
    },
    get head() {
      return headPos.slice();
    },
    startRun,
    nextWave,
    spawn: (e) => spawnEnemy(e),
    clear: () => {
      for (const e of enemies) killEnemy(e, !0);
      R.queue = [];
    },
    give(e, t, r, s) {
      R.weapons[e] = makeGun(t, r || 0, s);
    },
    hurt: (e) => hurtPlayer(e || 1),
    godMode(e) {
      PL.invuln = e ? 1e9 : 0;
    },
    wave(e) {
      ((R.wave = e - 1), clearEnemies(), nextWave());
    },
    turnTo(e, t) {
      baseYaw = -Math.atan2(e - headPos[0], -(t - headPos[2]));
    },
    calm() {
      for (const e of enemies)
        ((e.cd = 999), e.state === "tele" && (e.state = "hold"));
    },
    get gun() {
      const e = flatGun;
      return {
        id: e.id,
        ammo: e.ammo,
        rel: e.rel,
        cd: e.cd,
        held: e.held,
        pullT: e.pullT,
        inst: e.inst,
      };
    },
    get pshots() {
      return pshots.map(
        (e) => e.kind + ":" + e.p.map((t) => t.toFixed(2)).join(","),
      );
    },
    setGold(e) {
      R.gold = e;
    },
    setSouls(e) {
      ((META.souls = e), drawArmory());
    },
    get meta() {
      return JSON.parse(JSON.stringify(META));
    },
    siegeWave(e) {
      ((R.wave = e - 1), clearEnemies(), (R.queue = []), siegeNextWave());
    },
    spawnZ: (e) => spawnZombie(e),
    get coffin() {
      return {
        st: COFFIN.st,
        show: COFFIN.show,
        rar: COFFIN.rar,
        t: COFFIN.t && { x: COFFIN.t.x, y: COFFIN.t.y, z: COFFIN.t.z },
        prize: COFFIN.prize && {
          x: COFFIN.prize.x,
          y: COFFIN.prize.y,
          z: COFFIN.prize.z,
        },
      };
    },
    get map() {
      return MAP.cur;
    },
    get fade() {
      return MAP.fade;
    },
    get assets() {
      return { ...assetStatus, have: Object.keys(ASSETS) };
    },
    get lvl() {
      return {
        lvl: R.lvl,
        xp: R.xp,
        pending: R.lvlPending,
        up: !!R.lvlUp,
        combo: R.combo,
        contracts: (R.contracts || []).map((e) => e.c.id + ":" + e.done),
        stat: R.stat,
      };
    },
    xp(e) {
      gainXP(e);
    },
    loot(e, t) {
      dropLoot([headPos[0], 1.2, headPos[2] - 2], e, t || 0);
    },
    mods(e) {
      return R.weapons[e].mods;
    },
    mr(e) {
      ((MR.on = e), applyMapLighting());
    },
    portal(e, t) {
      placePortal([e, 0, t]);
    },
    get portals() {
      return MR.portals;
    },
    elite(e) {
      const t = enemies.find((r) => r.state !== "dead");
      t && makeElite(t, e || "armored");
    },
    set steps(e) {
      dbgSteps = e;
    },
    get frames() {
      return frames;
    },
    get look() {
      return { baseYaw, camYaw, viewA: PL.viewA };
    },
    get tris() {
      const e = (t) => Math.round(t.count / 3);
      return {
        world: e(CITYX.world),
        glow: e(CITYX.glow),
        bld: e(CITYX.bld),
        sky: e(CITYX.sky),
        pool: e(CITYX.pool),
        table: e(TBL.mini) + e(TBL.glow) + e(TBL.body),
        pads: e(EM.tdPads),
        towers: Object.values(TWM).reduce(
          (t, r) => t + e(r.base) + e(r.glow) + (r.head ? e(r.head) : 0),
          0,
        ),
      };
    },
    get glowN() {
      return PT.glow.n;
    },
    get beacons() {
      return CITY.beacons.length;
    },
    get bld() {
      return CITY.bld.length;
    },
    startTD,
    get td() {
      return {
        on: TD.on,
        phase: R.phase,
        t: TD.t,
        core: TD.core,
        sel: TD.sel,
        hover: TD.hover,
        towers: TD.towers.map((e) => ({
          type: e.type,
          lvl: e.lvl,
          pad: e.pad,
          kills: e.kills,
          drop: e.drop,
          emp: e.emp,
        })),
        drones: TD.drones.length,
        charge: TD.charge,
        armed: TD.armed,
        lanes: TD.lanes,
        ko: TD.ko,
        gold: R.gold,
        wave: R.wave,
      };
    },
    tdSelect(e) {
      TD.sel = e;
    },
    tdBuild(e) {
      tdBuild(e);
    },
    tdUpgrade() {
      const e = towerAt(TD.sel);
      e && tdUpgrade(e);
    },
    tdWave() {
      tdNextWave(!0);
    },
    sim(e) {
      for (let t = 0; t < e * 30; t++) update(1 / 30);
    },
    tdTowerAt(e) {
      return !!towerAt(e);
    },
    tdSpawn(e, t, r) {
      const s = tdSpawnGround(e, t, r);
      return ((s.state = "move"), (s.y = 0), !0);
    },
    tdPhase(e) {
      R.phase = e;
    },
    tdCharge() {
      TD.charge = 1;
    },
    tdCore(e) {
      TD.core = e;
    },
    tdCmd(e) {
      tdCommand(e);
    },
    tdLose() {
      tdLose();
    },
    tdJump(e) {
      ((R.wave = e - 1), (R.queue = []));
      for (const t of enemies) killEnemy(t, !0);
      tdNextWave(!1);
    },
    tableXY(e, t) {
      const r = toTable(e, t, 0.004);
      return this.project(r[0], r[1], r[2]);
    },
    panelXY(e, t, r) {
      const s = e === "cmd" ? TD.cmd : TD.bld,
        a = e === "cmd" ? CMDP : BLDP,
        o = (t / a.cvs.width - 0.5) * a.w,
        n = (0.5 - r / a.cvs.height) * a.h;
      return this.project(
        s.x + Math.cos(s.yaw) * o,
        s.y + n,
        s.z - Math.sin(s.yaw) * o,
      );
    },
  }));
