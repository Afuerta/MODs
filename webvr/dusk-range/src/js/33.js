"use strict";
const MM = m4(),
  IDENT = m4(),
  HEADM = m4(),
  W1 = [1, 1, 1],
  guns = [],
  CHEV = [],
  OFFER_COL = {
    weapon: [1, 0.55, 0.2],
    perk: [0.72, 0.55, 1],
    heal: [0.4, 1, 0.6],
    mod: [0.35, 1, 0.8],
  };
function draw(o, s, a, i, c = 1, u = 0.82) {
  const l = LIT.u;
  (gl.uniformMatrix4fv(l.uModel, !1, s),
    gl.uniform4f(l.uTint, a[0], a[1], a[2], c),
    gl.uniform1f(l.uEmit, i),
    gl.uniform1f(l.uFog, MR.on ? 0 : u),
    gl.bindVertexArray(o.vao),
    gl.drawArrays(gl.TRIANGLES, 0, o.count));
}
function drawT(o, s, a, i, c, u, l, g) {
  const f = TEX.u;
  (gl.uniformMatrix4fv(f.uModel, !1, a),
    gl.uniform4f(f.uTint, i[0], i[1], i[2], c),
    gl.uniform1f(f.uCut, u),
    gl.uniform1f(f.uFog, MR.on ? 0 : l),
    gl.uniform1f(f.uFogMode, g),
    gl.bindTexture(gl.TEXTURE_2D, s),
    gl.bindVertexArray(o.vao),
    gl.drawArrays(gl.TRIANGLES, 0, o.count));
}
const showRoom = () => benchY < -0.3,
  AMM = m4(),
  AML = m4();
function gunPart(o, s, a, i, c, u, l, g, f = 1) {
  draw(
    EM.bar,
    mul(AMM, o.model, trs(AML, s, a, i, 0, 0, 0, c, u, l)),
    g,
    1,
    f,
    0,
  );
}
function drawAmmo(o) {
  const s = magSize(o.inst),
    a = WEAPONS[o.id],
    i = 0.078,
    c = o.ammo <= Math.ceil(s * 0.25);
  if (o.inst.rar) {
    const l = RAR[o.inst.rar].col;
    gunPart(o, 0, -0.036, -0.03, 0.05, 0.008, 0.07, [
      l[0] * 1.3,
      l[1] * 1.3,
      l[2] * 1.3,
    ]);
  }
  if (o.rel > 0) {
    const l = 1 - o.rel / o.relMax;
    (gunPart(o, 0, i, 0.02, 0.006, 0.006, 0.12, [0.15, 0.12, 0.2]),
      gunPart(
        o,
        0,
        i + 0.002,
        0.08 - 0.06 * l,
        0.008,
        0.008,
        0.12 * l,
        [1, 0.7, 0.25],
      ));
    return;
  }
  const u = c ? [1, 0.3, 0.25] : a.col;
  if (s <= 12)
    for (let l = 0; l < s; l++)
      gunPart(
        o,
        0,
        i,
        0.075 - l * 0.012,
        0.008,
        0.008,
        0.007,
        l < o.ammo ? u : [0.18, 0.15, 0.22],
      );
  else {
    const l = o.ammo / s;
    (gunPart(o, 0, i, 0.02, 0.006, 0.006, 0.12, [0.18, 0.15, 0.22]),
      gunPart(o, 0, i + 0.002, 0.08 - 0.06 * l, 0.008, 0.008, 0.12 * l, u));
  }
}
function buildChevrons() {
  CHEV.length = 0;
  const o = [HEADM[0], HEADM[1], HEADM[2]],
    s = [HEADM[4], HEADM[5], HEADM[6]],
    a = [-HEADM[8], -HEADM[9], -HEADM[10]],
    i = [HEADM[12], HEADM[13], HEADM[14]],
    c = !!xrSession,
    u = c ? 0.75 : Math.tan(fovy / 2),
    l = c ? 0.85 : u * aspect,
    g = (f, h, t, n) => {
      const e = norm([f[0] - i[0], f[1] - i[1], f[2] - i[2]]),
        r = e[0] * o[0] + e[1] * o[1] + e[2] * o[2],
        d = e[0] * s[0] + e[1] * s[1] + e[2] * s[2],
        E = e[0] * a[0] + e[1] * a[1] + e[2] * a[2];
      if (E > 0.1 && Math.abs(r / E) < l * 0.92 && Math.abs(d / E) < u * 0.92)
        return;
      let p = r,
        m = E < 0 ? d * 0.3 : d;
      const T = Math.hypot(p, m);
      T < 0.001 ? ((p = 1), (m = 0)) : ((p /= T), (m /= T));
      const x = c ? 0.4 : l * 1.3 * 0.82,
        A = c ? 0.4 : u * 1.3 * 0.78,
        I =
          1 /
          Math.max(Math.abs(p) / x, Math.abs(m) / A, Math.hypot(p / x, m / A)),
        b = p * I,
        y = m * I,
        P = [o[0] * p + s[0] * m, o[1] * p + s[1] * m, o[2] * p + s[2] * m],
        k = [-a[0], -a[1], -a[2]],
        F = cross(k, P),
        N = [
          i[0] + a[0] * 1.3 + o[0] * b + s[0] * y,
          i[1] + a[1] * 1.3 + o[1] * b + s[1] * y,
          i[2] + a[2] * 1.3 + o[2] * b + s[2] * y,
        ],
        M = pm(),
        w = n * (c ? 1 : 0.6);
      ((M[0] = F[0] * w),
        (M[1] = F[1] * w),
        (M[2] = F[2] * w),
        (M[3] = 0),
        (M[4] = k[0] * w),
        (M[5] = k[1] * w),
        (M[6] = k[2] * w),
        (M[7] = 0),
        (M[8] = P[0] * w),
        (M[9] = P[1] * w),
        (M[10] = P[2] * w),
        (M[11] = 0),
        (M[12] = N[0]),
        (M[13] = N[1]),
        (M[14] = N[2]),
        (M[15] = 1),
        CHEV.push({ m: M, col: h, a: t }));
    };
  if (inRun()) {
    for (const f of enemies) {
      if (
        f.state === "dead" ||
        !f.hbw[0] ||
        CHEV.length >= 8 ||
        (f.lane && !f.T.boss && hdist(f) > 16)
      )
        continue;
      const h = f.hbw[0],
        t = Math.hypot(h[0] - i[0], h[2] - i[2]) < 3.5;
      g(
        h,
        f.T.boss ? [1, 0.8, 0.25] : t ? [1, 0.25, 0.2] : [1, 0.55, 0.3],
        t ? 0.75 + 0.25 * Math.sin(clock * 12) : 0.7,
        f.T.boss ? 1.6 : 1.1,
      );
    }
    for (const f of targets)
      f.kind === "crate" &&
        f.state === "live" &&
        f.landed &&
        g([f.x, f.y, f.z], OFFER_COL[f.offer.type], 0.8, 1.1);
  } else if (c && S.mode !== "playing") {
    const f = targets.find((h) => h.kind === "start" && h.state === "live");
    f && g([0, f.y, f.z], [1, 0.85, 0.4], 0.6 + 0.3 * Math.sin(clock * 4), 1.2);
  }
}
function buildFrame() {
  for (const o in B) B[o].n = 0;
  ((PT.glow.n = 0), (PT.smoke.n = 0), buildEnemyDraws(), buildChevrons());
  for (const o of parts) {
    const s = Math.min(1, (o.max - o.life) / 0.4),
      a = B[o.kind],
      i = o.kind === "casing" ? Math.max(0, 1 - o.life * 2.5) : 0;
    (bpush(
      a,
      o.p[0],
      o.p[1],
      o.p[2],
      o.s[0],
      o.s[1],
      o.s[2],
      o.rot[0],
      o.rot[1],
      o.rot[2],
      o.c[0] + i * 0.6,
      o.c[1] + i * 0.3,
      o.c[2],
      s,
    ),
      o.glow &&
        ppush(PT.glow, o.p[0], o.p[1], o.p[2], 0.08, 1, 0.8, 0.5, 0.8 * s));
  }
  if (MAP.cur === "range" && !MR.on) {
    let i = FLAG_POS[0] + 0.05,
      c = FLAG_POS[2];
    for (let u = 0; u < 8; u++) {
      const l = (u + 0.5) / 8,
        g =
          Math.sin(flagT * 4.2 - l * 5.5) * 0.5 +
          Math.sin(flagT * 7.1 - l * 9) * 0.18,
        f = -0.8 + g * 0.5 * l,
        h = 0.95 / 8,
        t = i + Math.cos(f) * h,
        n = c + Math.sin(f) * h,
        e = 0.85 + 0.15 * Math.cos(f * 3);
      (bpush(
        B.cube,
        (i + t) / 2,
        3.95 - l * 0.04 - Math.abs(g) * 0.02 * l,
        (c + n) / 2,
        h * 1.04,
        0.56 * (1 - l * 0.08),
        0.012,
        -f,
        0,
        0,
        C.flagRed[0] * e,
        C.flagRed[1] * e,
        C.flagRed[2] * e,
        1,
      ),
        (i = t),
        (c = n));
    }
  }
  (MR.on
    ? buildPortalFrame()
    : MAP.cur === "night"
      ? buildNightFrame()
      : MAP.cur === "city"
        ? buildCityFrame()
        : buildRangeFrame(),
    tdBuildFrame());
  for (const o of flashes) {
    const s = 1 - o.t / (o.muzzle ? 0.06 : 0.12);
    s > 0 &&
      ppush(
        PT.glow,
        o.p[0],
        o.p[1],
        o.p[2],
        o.s * (o.muzzle ? 1 : 0.6 + 0.6 * (1 - s)),
        o.c[0],
        o.c[1],
        o.c[2],
        0.9 * s,
      );
  }
  if (COFFIN.t && COFFIN.t.state === "live") {
    const o = COFFIN.t,
      s = Math.cos(o.faceYaw),
      a = Math.sin(o.faceYaw);
    for (const i of [-0.55, 0.55])
      ppush(
        PT.glow,
        o.x + s * i + a * 0.25,
        0.31 + Math.sin(clock * 13 + i) * 0.01,
        o.z - a * i + s * 0.25,
        0.22,
        1,
        0.75,
        0.35,
        0.8,
      );
    if (COFFIN.st !== "idle") {
      const i = COFFIN.st === "offer" ? RAR[COFFIN.rar].col : [1, 0.8, 0.4];
      ppush(
        PT.glow,
        o.x + a * 0.2,
        1.1,
        o.z + s * 0.2,
        1.4,
        i[0],
        i[1],
        i[2],
        0.32,
      );
    }
    if (COFFIN.st === "offer" && COFFIN.prize) {
      const i = COFFIN.prize,
        c = RAR[COFFIN.rar].col;
      ppush(
        PT.glow,
        i.x,
        i.y,
        i.z,
        0.8 + 0.15 * Math.sin(clock * 5),
        c[0],
        c[1],
        c[2],
        0.5,
      );
    }
  }
  finishFrame();
}
function buildPortalFrame() {
  for (const o of MR.portals)
    for (let s = 0; s < 6; s++) {
      const a = clock * 2 + (s * TAU) / 6,
        i = 0.45 + 0.1 * Math.sin(clock * 3 + s);
      ppush(
        PT.glow,
        o[0] + Math.cos(a) * i,
        0.08 + ((clock * 0.6 + s * 0.17) % 1) * 0.9,
        o[2] + Math.sin(a) * i,
        0.12,
        0.7,
        0.45,
        1,
        0.8,
      );
    }
}
function buildRangeFrame() {
  BULBS.forEach((o, s) =>
    ppush(
      PT.glow,
      o[0],
      o[1],
      o[2],
      0.3,
      1,
      0.75,
      0.4,
      0.32 + 0.05 * Math.sin(clock * 2.3 + s * 1.7),
    ),
  );
  for (const o of LAMPS) {
    if (o.range && benchY < -0.9) continue;
    const s = o.flick
      ? 0.82 + 0.1 * Math.sin(clock * 13) + 0.08 * Math.sin(clock * 7.7 + 1)
      : 1;
    ppush(
      PT.glow,
      o.p[0],
      o.p[1] + (o.range ? benchY : 0),
      o.p[2],
      o.s * s,
      o.c[0],
      o.c[1],
      o.c[2],
      o.a * s,
    );
  }
  (ppush(
    PT.glow,
    MOON[0] * 370 + headPos[0],
    MOON[1] * 370 + headPos[1],
    MOON[2] * 370 + headPos[2],
    46,
    1,
    0.95,
    0.88,
    0.22,
  ),
    ppush(
      PT.glow,
      SUN[0] * 370 + headPos[0],
      SUN[1] * 370 + headPos[1],
      SUN[2] * 370 + headPos[2],
      150,
      1,
      0.75,
      0.45,
      0.42,
    ));
  for (const o of motes)
    ppush(
      PT.glow,
      o.p[0],
      o.p[1],
      o.p[2],
      o.s,
      1,
      0.85,
      0.6,
      0.35 + 0.3 * Math.sin(clock * 1.7 + o.ph * 3),
    );
}
function finishFrame() {
  for (const o of guns) {
    if (o.support) continue;
    const s = WEAPONS[o.id];
    if (o.near > 0 && !o.steady && s.long) {
      const a = xf(o.model, [0, -0.02, s.muzzle * 0.55]);
      ppush(
        PT.glow,
        a[0],
        a[1],
        a[2],
        0.06 + o.near * 0.06,
        0.6,
        0.9,
        1,
        0.4 + o.near * 0.5,
      );
    }
    if (o.steady) {
      const a = xf(o.model, [0, -0.02, s.muzzle * 0.55]);
      ppush(PT.glow, a[0], a[1], a[2], 0.05, 0.6, 1, 0.8, 0.6);
    }
    if (o.id === "peacemaker") {
      const a = xf(o.model, [-0.026, 0.004, -0.045]);
      ppush(
        PT.glow,
        a[0],
        a[1],
        a[2],
        0.05 + o.heat * 0.05,
        1,
        0.65,
        0.25,
        0.5 + 0.2 * Math.sin(clock * 4),
      );
    } else
      ppush(
        PT.glow,
        o.muzzle[0],
        o.muzzle[1],
        o.muzzle[2],
        0.05 + o.heat * 0.08,
        s.col[0],
        s.col[1],
        s.col[2],
        0.35 + o.heat * 0.5,
      );
    o.aim &&
      !o.noLaser &&
      ppush(
        PT.glow,
        o.aim.point[0],
        o.aim.point[1],
        o.aim.point[2],
        0.07,
        s.col[0],
        s.col[1] * 0.7,
        s.col[2] * 0.5,
        0.9,
      );
  }
  for (const o of targets)
    o.kind === "loot" &&
      o.state === "live" &&
      ppush(
        PT.glow,
        o.x,
        o.y,
        o.z,
        0.6 + 0.1 * Math.sin(clock * 5),
        o.col[0],
        o.col[1],
        o.col[2],
        0.7,
      );
  if (!ASSETS.coin)
    for (const o of coins)
      bpush(
        B.casing,
        o.p[0],
        o.p[1],
        o.p[2],
        0.06,
        0.012,
        0.06,
        o.spin,
        Math.PI / 2,
        0,
        1,
        0.8,
        0.25,
        1,
      );
  for (const o of coins)
    ppush(PT.glow, o.p[0], o.p[1], o.p[2], 0.12, 1, 0.85, 0.3, 0.6);
  buildFieldDraws();
  for (const o of targets)
    if (o.kind === "crate" && o.state === "live") {
      const s = OFFER_COL[o.offer.type];
      ppush(
        PT.glow,
        o.x,
        o.y,
        o.z,
        1.1,
        s[0],
        s[1],
        s[2],
        0.35 + 0.1 * Math.sin(clock * 4 + o.ph),
      );
    }
  for (const o of puffs) {
    const s = o.t / o.max;
    ppush(
      PT.smoke,
      o.p[0],
      o.p[1],
      o.p[2],
      lerp(o.s0, o.s1, Math.sqrt(s)),
      o.c[0],
      o.c[1],
      o.c[2],
      0.32 * (1 - s) * Math.min(1, o.t * 8),
    );
  }
  for (const o in B) bflush(B[o]);
  (pflush(PT.glow), pflush(PT.smoke));
}
function setView(o, s, a, i) {
  for (const c of [LIT, INST, TEX])
    (gl.useProgram(c.p),
      gl.uniformMatrix4fv(c.u.uProj, !1, o),
      gl.uniformMatrix4fv(c.u.uView, !1, s),
      gl.uniform3fv(c.u.uEye, a));
  (gl.useProgram(PTS.p),
    gl.uniformMatrix4fv(PTS.u.uProj, !1, o),
    gl.uniformMatrix4fv(PTS.u.uView, !1, s),
    gl.uniform1f(PTS.u.uPx, i));
}
function faceModel(o, s, a) {
  return trs(
    MM,
    o.x + Math.sin(o.yaw) * 0.006,
    o.y,
    o.z + Math.cos(o.yaw) * 0.006,
    o.yaw,
    0,
    0,
    2 * a * s,
    2 * a * s,
    1,
  );
}
const beamTo = (o, s, a, i, c) => {
  const u = [s[0] - o[0], s[1] - o[1], s[2] - o[2]],
    l = Math.hypot(u[0], u[1], u[2]);
  l > 0.01 && draw(MESH.beam, beam(MM, o, norm(u), l, a), i, 1, c, 0);
};
function renderScene(o, s, a, i) {
  setView(o, s, a, i);
  const c = MAP.cur === "night",
    u = MAP.cur === "city",
    l = MAP.cur === "range",
    g = !MR.on;
  (g
    ? c
      ? renderNight(a)
      : u
        ? renderCity(a)
        : (gl.disable(gl.DEPTH_TEST),
          gl.depthMask(!1),
          gl.useProgram(LIT.p),
          draw(
            MESH.sky,
            trs(MM, a[0], a[1], a[2], 0, 0, 0, 1, 1, 1),
            W1,
            1,
            1,
            0,
          ),
          gl.useProgram(TEX.p),
          gl.enable(gl.BLEND),
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA),
          drawT(
            MESH.clouds,
            CLOUD_TEX.tex,
            trs(MM, a[0], a[1], a[2], clock * 0.004, 0, 0, 1, 1, 1),
            W1,
            0.95,
            0,
            0,
            0,
          ),
          gl.disable(gl.BLEND),
          gl.enable(gl.DEPTH_TEST),
          gl.depthMask(!0),
          gl.useProgram(LIT.p),
          draw(MESH.world, IDENT, W1, 0),
          draw(MESH.glow, IDENT, [1, 0.95, 0.9], 1, 1, 0.3),
          draw(
            MESH.rotor,
            trs(
              MM,
              WM.hub[0],
              WM.hub[1],
              WM.hub[2],
              WM.yaw,
              0,
              windSpin,
              1,
              1,
              1,
            ),
            W1,
            0,
          ),
          benchY > -1.2 &&
            (trs(MM, 0, benchY, 0, 0, 0, 0, 1, 1, 1),
            draw(MESH.bench, MM, W1, 0),
            draw(MESH.benchGlow, MM, [1, 0.95, 0.9], 1, 1, 0.3)),
          signY > -2 &&
            draw(
              MESH.sign,
              trs(MM, SIGN_POS[0], signY, SIGN_POS[2], 0, 0, 0, 1, 1, 1),
              W1,
              0.1,
            ))
    : (gl.useProgram(LIT.p),
      l &&
        signY > -2 &&
        draw(
          MESH.sign,
          trs(MM, SIGN_POS[0], signY, SIGN_POS[2], 0, 0, 0, 1, 1, 1),
          W1,
          0.1,
        )),
    gl.useProgram(LIT.p),
    g &&
      showRoom() &&
      ROOM.mesh &&
      draw(
        ROOM.mesh,
        u ? trs(MM, 0, 0.055, 0, 0, 0, 0, 1, 1, 1) : IDENT,
        [0.9 + 0.1 * Math.sin(clock * 2), 0.9, 1],
        c ? 0.6 : 0.85,
        1,
        0,
      ));
  for (const t of targets) {
    if (t.td) continue;
    const n = Math.max(0.001, t.scale),
      e = t.state === "hit" ? FLASH : W1;
    if (t.kind === "clay") {
      draw(
        MESH.clay,
        trs(MM, t.x, t.y, t.z, t.spin, 0.25, 0, n, n, n),
        W1,
        0.45,
      );
      continue;
    }
    if (t.kind === "crate") {
      draw(EM.crate, trs(MM, t.x, t.y, t.z, t.yaw, 0, 0, n, n, n), e, 0.15);
      continue;
    }
    if (t.kind === "loot") {
      const r = 0.1 * n;
      draw(
        MESH.shard,
        trs(MM, t.x, t.y, t.z, t.age * 2, 0.4, t.age * 1.3, r, r * 1.4, r),
        t.col,
        1,
        1,
        0,
      );
      continue;
    }
    if (t.kind === "lvl") {
      draw(
        EM.bar,
        trs(
          MM,
          t.x - Math.sin(t.yaw) * 0.02,
          t.y,
          t.z - Math.cos(t.yaw) * 0.02,
          t.yaw,
          0,
          0,
          0.54 * n,
          0.54 * n,
          0.04,
        ),
        t.state === "hit" ? FLASH : [0.25, 0.6, 0.45],
        0.5,
      );
      continue;
    }
    if (t.kind === "shop") {
      draw(
        EM.bar,
        trs(
          MM,
          t.x - Math.sin(t.yaw) * 0.02,
          t.y,
          t.z - Math.cos(t.yaw) * 0.02,
          t.yaw,
          0,
          0,
          0.54 * n,
          0.54 * n,
          0.04,
        ),
        t.state === "hit" ? FLASH : C.zLid,
        0.1,
      );
      continue;
    }
    if (t.kind === "coffin") {
      drawCoffin(t);
      continue;
    }
    if (t.kind !== "prize") {
      if (t.kind === "armory") {
        const r = Math.cos(t.yaw),
          d = -Math.sin(t.yaw),
          E = t.x - Math.sin(t.yaw) * 0.04,
          p = t.z - Math.cos(t.yaw) * 0.04;
        draw(
          EM.bar,
          trs(MM, E, t.y, p, t.yaw, 0, 0, 1.82 * n, 1.82 * n, 0.06),
          C.frame,
          0.05,
        );
        for (const m of [-0.7, 0.7])
          draw(
            EM.bar,
            trs(
              MM,
              E + r * m,
              (t.y - 0.9) / 2,
              p + d * m,
              t.yaw,
              0,
              0,
              0.09,
              t.y - 0.9,
              0.09,
            ),
            C.wood,
            0,
          );
        continue;
      }
      if (t.kind === "ready") {
        const r = t.R / 0.45;
        draw(
          MESH.start,
          trs(MM, t.x, t.y, t.z, t.yaw, 0, 0, n * r, n * r, n * r),
          W1,
          0.1,
        );
        continue;
      }
      draw(MESH[t.kind], trs(MM, t.x, t.y, t.z, t.yaw, 0, 0, n, n, n), W1, 0.1);
    }
  }
  if (g && l)
    for (const t of birds) {
      const n = t.cx + Math.cos(t.th) * t.R,
        e = t.cz + Math.sin(t.th) * t.R,
        r = -Math.sin(t.th) * t.w,
        d = Math.cos(t.th) * t.w,
        E = Math.sin(clock * 0.6 + t.ph) > 0.2,
        p = E ? Math.sin(clock * 9 + t.ph) : 0.35;
      draw(
        MESH.bird,
        trs(
          MM,
          n,
          t.h + Math.sin(clock * 0.5 + t.ph) * 1.5,
          e,
          Math.atan2(r, d),
          0,
          -Math.sign(t.w) * 0.25,
          1.3,
          1.3 * p,
          1.3,
        ),
        W1,
        0,
        1,
        0.6,
      );
    }
  if (
    (g &&
      weed.on &&
      l &&
      draw(
        MESH.tumbleweed,
        trs(MM, weed.x, weed.y, weed.z, 0.3, 0, weed.roll, 1, 1, 1),
        W1,
        0,
      ),
    drawPrize(),
    tdDrawSolid(),
    ASSETS.coin)
  )
    for (const t of coins)
      draw(
        ASSETS.coin.mesh,
        trs(MM, t.p[0], t.p[1], t.p[2], t.spin, 0, 0, 1, 1, 1),
        W1,
        0.3,
      );
  for (const t of EDL) t.alpha >= 0.999 && draw(t.mesh, t.m, t.tint, t.emit, 1);
  for (const t of guns) {
    if (t.support) continue;
    const n = GUN[t.id] || GUN.peacemaker;
    draw(n.body, t.model, W1, 0.12, 1, 0);
    const e = 0.75 + 0.25 * Math.sin(clock * 4),
      r = t.heat || 0,
      d = t.swap || 0;
    (t.id === "peacemaker"
      ? draw(
          n.glow,
          t.model,
          [e + r * 0.4 + d, e * 0.8 + r * 0.5 + d, e * 0.6 + r * 0.6 + d],
          1,
          1,
          0,
        )
      : draw(
          n.glow,
          t.model,
          [e + r * 0.5 + d, e + r * 0.5 + d, e + r * 0.5 + d],
          1,
          1,
          0,
        ),
      inRun() && t.inst && drawAmmo(t));
  }
  (gl.useProgram(INST.p),
    gl.uniform4f(INST.u.uTint, 1, 1, 1, 1),
    gl.uniform1f(INST.u.uFog, MR.on ? 0 : 0.82),
    gl.uniform1f(INST.u.uEmit, 0.22),
    bdraw(B.cube),
    gl.uniform1f(INST.u.uEmit, 0.5),
    bdraw(B.shard),
    gl.uniform1f(INST.u.uEmit, 0.25),
    bdraw(B.casing),
    gl.useProgram(TEX.p),
    gl.activeTexture(gl.TEXTURE0));
  for (const t of targets) {
    if (t.kind === "clay" || t.td) continue;
    const n = Math.max(0.001, t.scale),
      e = t.state === "hit" ? 1.8 : 1;
    if (t.kind === "loot") {
      drawT(
        MESH.quad,
        t.slot.tex,
        trs(
          MM,
          t.x,
          t.y + 0.34,
          t.z,
          t.yaw,
          0,
          0,
          t.slot.w * n,
          t.slot.h * n,
          1,
        ),
        W1,
        1,
        0.05,
        0,
        0,
      );
      continue;
    }
    if (t.kind === "crate" || t.kind === "shop" || t.kind === "lvl") {
      const d = (t.kind === "crate" ? 0.256 : 0.005) * n,
        E = t.x + Math.sin(t.yaw) * d,
        p = t.z + Math.cos(t.yaw) * d,
        m = t.kind === "crate" ? 0.44 : 0.5;
      drawT(
        MESH.quad,
        t.slot.tex,
        trs(MM, E, t.y, p, t.yaw, 0, 0, m * n, m * n, 1),
        [e, e, e],
        1,
        0,
        0.5,
        0,
      );
      continue;
    }
    if (t.kind === "coffin") {
      (paintCoffinSign(),
        drawT(
          MESH.quad,
          COFFIN_SIGN.tex,
          trs(
            MM,
            t.x + Math.sin(t.yaw) * 0.1,
            2.3,
            t.z + Math.cos(t.yaw) * 0.1,
            t.yaw,
            0,
            0,
            COFFIN_SIGN.w * n,
            COFFIN_SIGN.h * n,
            1,
          ),
          W1,
          1,
          0,
          0.3,
          0,
        ));
      continue;
    }
    if (t.kind === "prize") {
      drawT(
        MESH.quad,
        PRIZE_LABEL.tex,
        trs(
          MM,
          t.x,
          t.y + 0.5,
          t.z,
          t.yaw,
          0,
          0,
          PRIZE_LABEL.w * n,
          PRIZE_LABEL.h * n,
          1,
        ),
        W1,
        1,
        0.05,
        0,
        0,
      );
      continue;
    }
    if (t.kind === "armory") {
      drawT(
        MESH.quad,
        armory.tex,
        trs(MM, t.x, t.y, t.z, t.yaw, 0, 0, armory.w * n, armory.h * n, 1),
        [0.95, 0.95, 0.95],
        1,
        0,
        0.3,
        0,
      );
      continue;
    }
    const r =
      t.kind === "dud"
        ? DUD_TEX.tex
        : t.kind === "ready"
          ? READY_TEX.tex
          : t.kind === "start" && t.game === "run"
            ? RUN_TEX.tex
            : t.kind === "start" && t.game === "siege"
              ? SIEGE_TEX.tex
              : t.kind === "start" && t.game === "td"
                ? CITY_TEX.tex
                : FACE_TEX.tex;
    drawT(
      MESH.quad,
      r,
      faceModel(t, n, t.R),
      [0.97 * e, 0.92 * e, 0.88 * e],
      1,
      0.5,
      0.82,
      0,
    );
  }
  (tdDrawTex(),
    l &&
      (signY > -1.4 &&
        drawT(
          MESH.quad,
          sign.tex,
          trs(MM, SIGN_POS[0], signY, SIGN_POS[2], 0, 0, 0, sign.w, sign.h, 1),
          [0.93, 0.9, 0.88],
          1,
          0,
          0.3,
          0,
        ),
      g &&
        (drawT(
          MESH.quad,
          board.tex,
          trs(
            MM,
            BOARD_POS[0],
            BOARD_POS[1],
            BOARD_POS[2],
            0,
            0,
            0,
            board.w,
            board.h,
            1,
          ),
          W1,
          1,
          0,
          0.3,
          0,
        ),
        drawT(
          MESH.labels,
          LABEL_TEX.tex,
          IDENT,
          [0.95, 0.9, 0.86],
          1,
          0.5,
          0.82,
          0,
        ))));
  for (const t of guns)
    t.wristM &&
      (gl.enable(gl.BLEND),
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA),
      drawT(MESH.quad, wrist.tex, t.wristM, W1, 1, 0.02, 0, 0),
      gl.disable(gl.BLEND));
  (gl.enable(gl.BLEND),
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA),
    gl.depthMask(!1),
    gl.enable(gl.POLYGON_OFFSET_FILL),
    gl.polygonOffset(-1, -2),
    g &&
      l &&
      drawT(MESH.shadows, SHADOW_TEX.tex, IDENT, W1, 0.42, 0.004, 1, 1));
  const f = u ? 0.075 : 0.035,
    h = (t, n, e, r, d, E, p) => {
      p
        ? drawT(
            MESH.gBlob,
            SHADOW_TEX.tex,
            trs(
              MM,
              t + SHADOW_DIR[0] * n * 0.9,
              f,
              e + SHADOW_DIR[2] * n * 0.9,
              0,
              0,
              0,
              r,
              1,
              r,
            ),
            W1,
            E,
            0.004,
            1,
            1,
          )
        : drawT(
            MESH.gLong,
            SHADOW_TEX.tex,
            trs(
              MM,
              t - SHADOW_DIR[0] * r * 0.25,
              f,
              e - SHADOW_DIR[2] * r * 0.25,
              SHADOW_YAW,
              0,
              0,
              r,
              1,
              d,
            ),
            W1,
            E,
            0.004,
            1,
            1,
          );
    };
  tdShadows(h);
  for (const t of targets) {
    if (t.td) continue;
    const n = Math.max(0, Math.min(1, t.scale));
    if (t.kind === "floater") h(t.x, t.y, t.z, t.R * 2.6 * n, 0, 0.3 * n, !0);
    else if (t.kind === "clay") t.y < 6 && h(t.x, t.y, t.z, 0.5, 0, 0.22, !0);
    else if (t.kind === "crate" || t.kind === "shop")
      t.y < 6 && h(t.x, t.y * 0.3, t.z, 0.8 * n, 0, 0.3 * n, !0);
    else if (t.kind === "coffin") h(t.x, 0, t.z, 1, 0, 0.45, !0);
    else {
      if (t.kind === "prize" || t.kind === "armory" || t.kind === "lvl")
        continue;
      if (t.kind === "loot") {
        h(t.x, t.y, t.z, 0.4, 0, 0.25, !0);
        continue;
      } else
        t.y + t.R > 0.05 &&
          h(t.x, 0, t.z, t.R * 2.2 * n, (t.y + t.R) * SHADOW_K, 0.4 * n, !1);
    }
  }
  for (const t of enemies) {
    if (t.state === "dead" || t.type === "wyrm" || t.y < -0.5) continue;
    const n = Math.max(0, t.y - groundAt(t.x, t.z)),
      e = clamp(1 - n / 14, 0.2, 1),
      r = (t.T.boss ? 1.4 : 0.85) * Math.min(t.s, 3.2);
    h(
      t.x,
      Math.min(n, 3),
      t.z,
      r * (t.type === "mothership" ? 1.4 : 1),
      0,
      0.34 * e * t.alpha,
      !0,
    );
  }
  (signY > 0.6 &&
    l &&
    h(0, 0, SIGN_POS[2], 2.6, (signY + 0.68) * SHADOW_K, 0.35, !1),
    weed.on && l && h(weed.x, weed.y - 0.45, weed.z, 1.1, 0, 0.3, !0),
    gl.disable(gl.POLYGON_OFFSET_FILL),
    g &&
      u &&
      (renderCityPools(),
      gl.enable(gl.BLEND),
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA),
      gl.depthMask(!1)),
    g &&
      c &&
      (renderNightPools(),
      gl.enable(gl.BLEND),
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA),
      gl.depthMask(!1)),
    gl.useProgram(LIT.p));
  for (const t of EDL)
    t.alpha < 0.999 && draw(t.mesh, t.m, t.tint, t.emit, t.alpha);
  (gl.disable(gl.DEPTH_TEST), gl.useProgram(TEX.p));
  for (const t of popupPool)
    if (t.live) {
      const n = t.t / 0.95,
        e = t.p[1] + n * 0.6,
        r = Math.atan2(a[0] - t.p[0], a[2] - t.p[2]);
      drawT(
        MESH.quad,
        t.tex,
        trs(
          MM,
          t.p[0],
          e,
          t.p[2],
          r,
          0,
          0,
          t.size * 2 * (0.85 + 0.15 * Math.min(1, n * 6)),
          t.size,
          1,
        ),
        W1,
        n < 0.6 ? 1 : 1 - (n - 0.6) / 0.4,
        0,
        0,
        0,
      );
    }
  if (banner.on) {
    const t = banner.t / banner.dur,
      n = Math.min(1, banner.t * 5, (1 - t) * 5),
      e = Math.atan2(a[0] - banner.p[0], a[2] - banner.p[2]),
      r = 0.94 + 0.06 * Math.min(1, banner.t * 4);
    drawT(
      MESH.quad,
      banner.tex,
      trs(
        MM,
        banner.p[0],
        banner.p[1],
        banner.p[2],
        e,
        0,
        0,
        banner.w * r,
        banner.h * r,
        1,
      ),
      W1,
      n,
      0,
      0,
      0,
    );
  }
  if ((drawNumbers(a), CHEV.length)) {
    gl.useProgram(LIT.p);
    for (const t of CHEV) draw(EM.chevron, t.m, t.col, 1, t.a, 0);
  }
  (gl.enable(gl.DEPTH_TEST),
    gl.useProgram(LIT.p),
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE));
  for (const t of guns)
    if (t.ray && !t.noLaser && !t.support) {
      const n = WEAPONS[t.id],
        e = t.aim ? t.aim.dist - 0.02 - t.muzzleAhead : 28;
      (e > 0.05 &&
        draw(
          MESH.beam,
          beam(MM, t.muzzle, t.ray.d, e, 0.0045),
          [n.col[0], n.col[1] * 0.67, n.col[2] * 0.5],
          1,
          0.38,
          0,
        ),
        t.aim &&
          draw(
            MESH.shard,
            trs(
              MM,
              t.aim.point[0],
              t.aim.point[1],
              t.aim.point[2],
              clock * 4,
              0.6,
              0,
              0.022,
              0.022,
              0.022,
            ),
            [1, 0.6, 0.25],
            1,
            0.9,
            0,
          ));
    }
  for (const t of tracers)
    beamTo(
      t.a,
      t.b,
      t.w || 0.014,
      t.col || [1, 0.82, 0.5],
      0.85 * (1 - t.t / 0.09),
    );
  for (const t of zaps) {
    const n = 1 - t.t / t.max;
    if (t.pts)
      for (let e = 1; e < t.pts.length; e++)
        beamTo(t.pts[e - 1], t.pts[e], t.w, t.col, 0.95 * n);
    else
      beamTo(
        t.a,
        t.b,
        t.w * (t.kind === "beam" ? 0.4 + 0.6 * n : 1),
        t.col,
        (t.kind === "streak" ? 0.5 : 0.9) * n,
      );
  }
  if (COFFIN.t && COFFIN.t.state === "live" && COFFIN.st !== "idle") {
    const t = COFFIN.st === "offer" ? RAR[COFFIN.rar].col : [1, 0.8, 0.4],
      n = COFFIN.t;
    draw(
      MESH.beam,
      beam(MM, [n.x, 0.2, n.z], [0, 1, 0], 30, 0.12),
      t,
      1,
      0.1 + 0.04 * Math.sin(clock * 8),
      0,
    );
  }
  for (const t of targets)
    t.kind === "loot" &&
      t.state === "live" &&
      draw(
        MESH.beam,
        beam(MM, [t.x, t.y, t.z], [0, 1, 0], 6, 0.035),
        t.col,
        1,
        0.3 + 0.1 * Math.sin(clock * 6 + t.x),
        0,
      );
  if (R.phase === "pick") {
    for (const t of targets)
      if (t.kind === "crate" && t.state === "live") {
        const n = OFFER_COL[t.offer.type];
        draw(
          MESH.beam,
          beam(MM, [t.x, t.y + 0.3, t.z], [0, 1, 0], 40, 0.09),
          n,
          1,
          0.22 + 0.06 * Math.sin(clock * 5 + t.ph),
          0,
        );
      }
  }
  if ((drawPShotTrails(), g && u && renderCityAdd(), tdDrawAdd(), MR.on))
    for (const t of MR.portals) {
      const n = 0.55 + 0.08 * Math.sin(clock * 3);
      (draw(
        MESH.shock,
        trs(MM, t[0], 0.03, t[2], 0, -Math.PI / 2, clock * 1.5, n, n, n),
        [0.7, 0.4, 1],
        1,
        0.8,
        0,
      ),
        draw(
          MESH.shock,
          trs(
            MM,
            t[0],
            0.04,
            t[2],
            0,
            -Math.PI / 2,
            -clock * 2,
            n * 0.6,
            n * 0.6,
            n * 0.6,
          ),
          [0.4, 0.9, 1],
          1,
          0.6,
          0,
        ));
    }
  for (const t of targets)
    if (t.kind === "clay" && t.state === "live" && t.trail.length > 2) {
      const n = t.trail[0],
        e = t.trail[t.trail.length - 1],
        r = [e[0] - n[0], e[1] - n[1], e[2] - n[2]],
        d = Math.hypot(r[0], r[1], r[2]);
      d > 0.05 &&
        draw(
          MESH.beam,
          beam(MM, n, norm(r), d, 0.05),
          [1, 0.55, 0.3],
          1,
          0.22,
          0,
        );
    }
  for (const t of eshots)
    if (t.kind !== "lob" && t.kind !== "rift") {
      const n = Math.hypot(t.v[0], t.v[1], t.v[2]) || 1,
        e = Math.min(0.9, n * 0.07);
      draw(
        MESH.beam,
        beam(MM, t.p, [-t.v[0] / n, -t.v[1] / n, -t.v[2] / n], e, t.r * 0.55),
        t.col,
        1,
        0.5,
        0,
      );
    }
  for (const t of shocks) {
    const n = t.t / 0.28,
      e = t.r * (0.35 + n * 1.1),
      r = Math.atan2(a[0] - t.p[0], a[2] - t.p[2]);
    draw(
      MESH.shock,
      trs(MM, t.p[0], t.p[1], t.p[2], r, 0, 0, e, e, e),
      t.col,
      1,
      0.55 * (1 - n) * (1 - n),
      0,
    );
  }
  for (const t of flashes)
    if (t.muzzle && t.t < 0.06) {
      const n = 0.035 + t.t * 1.4;
      draw(
        MESH.shard,
        trs(MM, t.p[0], t.p[1], t.p[2], t.t * 30, 0.4, 0, n, n, n * 1.6),
        C.flash,
        1,
        1 - t.t / 0.06,
        0,
      );
    }
  (gl.useProgram(PTS.p),
    gl.uniform1f(PTS.u.uSoft, 2.2),
    pdraw(PT.glow),
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA),
    gl.uniform1f(PTS.u.uSoft, 1.3),
    pdraw(PT.smoke),
    vignette(),
    MAP.fade > 0.002 &&
      (gl.disable(gl.DEPTH_TEST),
      gl.useProgram(VIG.p),
      gl.uniform4f(VIG.u.uCol, 0.02, 0.02, 0.04, MAP.fade),
      gl.uniform1f(VIG.u.uIn, -60),
      gl.bindVertexArray(VIG_VAO),
      gl.drawArrays(gl.TRIANGLES, 0, 6),
      gl.enable(gl.DEPTH_TEST)),
    gl.disable(gl.BLEND),
    gl.depthMask(!0));
}
const CM = m4(),
  CL = m4();
function drawCoffin(o) {
  const s = o.scale,
    a = COFFIN.st,
    i = COFFIN.time,
    c =
      a === "roll"
        ? Math.min(1, i * 2.5)
        : a === "offer"
          ? 1
          : a === "close"
            ? 1 - Math.min(1, i / 0.5)
            : 0;
  (trs(CM, o.x, 0, o.z, o.faceYaw, 0, 0, s, s, s),
    draw(EM.coffin, CM, o.state === "hit" ? FLASH : W1, 0.04),
    draw(
      EM.coffinLid,
      mul(CL, CM, trs(MM, -0.31, 0, 0.155, -c * 1.85, 0, 0, 1, 1, 1)),
      W1,
      0.06,
    ));
  const u = a === "offer" ? RAR[COFFIN.rar].col : [1, 0.75, 0.35],
    l = 0.2 + c * 0.6;
  draw(EM.coffinGlow, CM, [u[0] * l, u[1] * l, u[2] * l], 1, 1, 0);
  for (const g of [-0.55, 0.55])
    draw(
      EM.candle,
      mul(CL, CM, trs(MM, g, 0.05, 0.25, 0, 0, 0, 1, 1, 1)),
      W1,
      0.3,
    );
}
function drawPrize() {
  if (!COFFIN.t || COFFIN.t.state !== "live") return;
  let o = null;
  if (COFFIN.st === "roll") {
    const c = COFFIN.t,
      u = Math.min(1, COFFIN.time * 1.2);
    o = [
      c.x + Math.sin(c.faceYaw) * 0.3 * u,
      0.9 + u * 0.45,
      c.z + Math.cos(c.faceYaw) * 0.3 * u,
    ];
  } else
    COFFIN.st === "offer" &&
      COFFIN.prize &&
      COFFIN.prize.state === "live" &&
      (o = [COFFIN.prize.x, COFFIN.prize.y, COFFIN.prize.z]);
  if (!o) return;
  const s = GUN[COFFIN.show] || GUN.peacemaker,
    a = RAR[COFFIN.rar].col,
    i = clock * 2.2;
  (trs(CM, o[0], o[1], o[2], i, 0.15, 0, 2.2, 2.2, 2.2),
    draw(s.body, CM, W1, 0.3),
    draw(s.glow, CM, [a[0] * 1.6, a[1] * 1.6, a[2] * 1.6], 1, 1, 0));
}
function vignette() {
  let o = null,
    s = 0,
    a = 0.5;
  (PL.hurt > 0
    ? ((o = [0.85, 0.05, 0.05]), (s = 0.7 * PL.hurt), (a = 0.05))
    : PL.shieldFx > 0
      ? ((o = [0.4, 0.8, 1]), (s = 0.55 * PL.shieldFx), (a = 0.2))
      : PL.heal > 0
        ? ((o = [0.3, 1, 0.5]), (s = 0.4 * PL.heal), (a = 0.3))
        : inRun() &&
          PL.hearts === 1 &&
          ((o = [0.7, 0.04, 0.04]),
          (s = 0.24 + 0.12 * Math.sin(clock * 5)),
          (a = 0.4)),
    !(!o || s < 0.01) &&
      (gl.disable(gl.DEPTH_TEST),
      gl.useProgram(VIG.p),
      gl.uniform4f(VIG.u.uCol, o[0], o[1], o[2], s),
      gl.uniform1f(VIG.u.uIn, a),
      gl.bindVertexArray(VIG_VAO),
      gl.drawArrays(gl.TRIANGLES, 0, 6),
      gl.enable(gl.DEPTH_TEST)));
}
