"use strict";
function shader(e, o) {
  const t = gl.createShader(e);
  if (
    (gl.shaderSource(t, o),
    gl.compileShader(t),
    !gl.getShaderParameter(t, gl.COMPILE_STATUS))
  )
    throw new Error(gl.getShaderInfoLog(t));
  return t;
}
function program(e, o) {
  const t = gl.createProgram();
  if (
    (gl.attachShader(t, shader(gl.VERTEX_SHADER, e)),
    gl.attachShader(t, shader(gl.FRAGMENT_SHADER, o)),
    gl.linkProgram(t),
    !gl.getProgramParameter(t, gl.LINK_STATUS))
  )
    throw new Error(gl.getProgramInfoLog(t));
  const r = {},
    c = gl.getProgramParameter(t, gl.ACTIVE_UNIFORMS);
  for (let n = 0; n < c; n++) {
    const i = gl.getActiveUniform(t, n);
    r[i.name] = gl.getUniformLocation(t, i.name);
  }
  return { p: t, u: new Proxy(r, { get: (n, i) => n[i] || null }) };
}
const LIT_FS = `#version 300 es
precision mediump float;
in vec3 vCol; in vec3 vNor; in vec3 vWorld; in float vAlpha;
uniform vec4 uTint; uniform float uEmit; uniform float uFog;
uniform vec3 uEye, uLight, uSunCol, uSkyAmb, uGndAmb, uFogCol, uGlowCol, uRimCol, uSunDir; uniform vec2 uFogRange;
out vec4 o;
void main(){
vec3 n = normalize(vNor); if (!gl_FrontFacing) n = -n;
vec3 V = vWorld - uEye; float dist = length(V); V = V/max(dist, 0.0001);
vec3 base = vCol*uTint.rgb;
vec3 amb = mix(uGndAmb, uSkyAmb, n.y*0.5+0.5);
float rim = pow(1.0 - clamp(dot(n,-V),0.0,1.0), 3.0) * (0.25 + 0.75*max(dot(V,uSunDir),0.0)) * (1.0 - 0.85*max(n.y,0.0));
vec3 lit = base*(amb + uSunCol*max(dot(n,uLight),0.0)) + uRimCol*rim*0.45;
vec3 c = mix(lit, base, uEmit);
float f = smoothstep(uFogRange.x, uFogRange.y, dist);
f = max(f, (1.0 - smoothstep(0.0, 8.0, vWorld.y)) * smoothstep(15.0, 160.0, dist) * 0.4);
vec3 fc = mix(uFogCol, uGlowCol, pow(max(dot(V,uSunDir),0.0), 5.0));
o = vec4(mix(c, fc, f*uFog), uTint.a*vAlpha);
}`,
  LIT = program(
    `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aNor; layout(location=2) in vec3 aCol;
uniform mat4 uProj, uView, uModel;
out vec3 vCol; out vec3 vNor; out vec3 vWorld; out float vAlpha;
void main(){ vec4 w = uModel*vec4(aPos,1.0); vWorld = w.xyz; vNor = mat3(uModel)*aNor; vCol = aCol; vAlpha = 1.0; gl_Position = uProj*uView*w; }`,
    LIT_FS,
  ),
  INST = program(
    `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aNor; layout(location=2) in vec3 aCol;
layout(location=3) in vec3 iPos; layout(location=4) in vec3 iScale; layout(location=5) in vec3 iRot; layout(location=6) in vec4 iCol;
uniform mat4 uProj, uView;
out vec3 vCol; out vec3 vNor; out vec3 vWorld; out float vAlpha;
void main(){
float cy=cos(iRot.x), sy=sin(iRot.x), cx=cos(iRot.y), sx=sin(iRot.y), cz=cos(iRot.z), sz=sin(iRot.z);
mat3 R = mat3(cy*cz+sy*sx*sz, cx*sz, -sy*cz+cy*sx*sz,  -cy*sz+sy*sx*cz, cx*cz, sy*sz+cy*sx*cz,  sy*cx, -sx, cy*cx);
vec3 w = iPos + R*(aPos*iScale);
vWorld = w; vNor = R*(aNor/max(iScale, vec3(0.0001))); vCol = aCol*iCol.rgb; vAlpha = iCol.a;
gl_Position = uProj*uView*vec4(w,1.0);
}`,
    LIT_FS,
  ),
  TEX = program(
    `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec2 aUv; layout(location=2) in vec3 aCol;
uniform mat4 uProj, uView, uModel; out vec2 vUv; out vec3 vCol; out vec3 vWorld;
void main(){ vec4 w = uModel*vec4(aPos,1.0); vWorld = w.xyz; vUv = aUv; vCol = aCol; gl_Position = uProj*uView*w; }`,
    `#version 300 es
precision mediump float;
in vec2 vUv; in vec3 vCol; in vec3 vWorld;
uniform sampler2D uTex; uniform vec4 uTint; uniform float uCut, uFog, uFogMode; uniform vec3 uEye, uFogCol; uniform vec2 uFogRange;
out vec4 o;
void main(){
vec4 c = texture(uTex, vUv);
if (c.a < uCut) discard;
float f = smoothstep(uFogRange.x, uFogRange.y, length(vWorld-uEye))*uFog;
o = vec4(mix(c.rgb*vCol*uTint.rgb, uFogCol, f*(1.0-uFogMode)), c.a*uTint.a*(1.0 - f*uFogMode));
}`,
  ),
  PTS = program(
    `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in float aSize; layout(location=2) in vec4 aCol;
uniform mat4 uProj, uView; uniform float uPx;
out vec4 vCol;
void main(){ vec4 v = uView*vec4(aPos,1.0); gl_Position = uProj*v; gl_PointSize = clamp(aSize*uPx/max(-v.z,0.05), 1.0, 256.0); vCol = aCol; }`,
    `#version 300 es
precision mediump float;
in vec4 vCol; uniform float uSoft; out vec4 o;
void main(){ vec2 p = gl_PointCoord*2.0-1.0; float d = dot(p,p); if (d > 1.0) discard; o = vec4(vCol.rgb, vCol.a*pow(1.0-d, uSoft)); }`,
  ),
  VIG = program(
    `#version 300 es
layout(location=0) in vec2 aPos; out vec2 vP;
void main(){ vP = aPos; gl_Position = vec4(aPos, 0.0, 1.0); }`,
    `#version 300 es
precision mediump float;
in vec2 vP; uniform vec4 uCol; uniform float uIn; out vec4 o;
void main(){ float a = smoothstep(uIn, 1.35, length(vP)); o = vec4(uCol.rgb, uCol.a*a); }`,
  ),
  VIG_VAO = (() => {
    const e = gl.createVertexArray();
    gl.bindVertexArray(e);
    const o = gl.createBuffer();
    return (
      gl.bindBuffer(gl.ARRAY_BUFFER, o),
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]),
        gl.STATIC_DRAW,
      ),
      gl.enableVertexAttribArray(0),
      gl.vertexAttribPointer(0, 2, gl.FLOAT, !1, 8, 0),
      gl.bindVertexArray(null),
      e
    );
  })();
function makeMesh(e) {
  const o = gl.createVertexArray();
  gl.bindVertexArray(o);
  const t = gl.createBuffer();
  return (
    gl.bindBuffer(gl.ARRAY_BUFFER, t),
    gl.bufferData(gl.ARRAY_BUFFER, e, gl.STATIC_DRAW),
    gl.enableVertexAttribArray(0),
    gl.vertexAttribPointer(0, 3, gl.FLOAT, !1, 36, 0),
    gl.enableVertexAttribArray(1),
    gl.vertexAttribPointer(1, 3, gl.FLOAT, !1, 36, 12),
    gl.enableVertexAttribArray(2),
    gl.vertexAttribPointer(2, 3, gl.FLOAT, !1, 36, 24),
    gl.bindVertexArray(null),
    { vao: o, buf: t, count: e.length / 9 }
  );
}
function makeTMesh(e) {
  const o = gl.createVertexArray();
  gl.bindVertexArray(o);
  const t = gl.createBuffer();
  return (
    gl.bindBuffer(gl.ARRAY_BUFFER, t),
    gl.bufferData(gl.ARRAY_BUFFER, e, gl.STATIC_DRAW),
    gl.enableVertexAttribArray(0),
    gl.vertexAttribPointer(0, 3, gl.FLOAT, !1, 32, 0),
    gl.enableVertexAttribArray(1),
    gl.vertexAttribPointer(1, 2, gl.FLOAT, !1, 32, 12),
    gl.enableVertexAttribArray(2),
    gl.vertexAttribPointer(2, 3, gl.FLOAT, !1, 32, 20),
    gl.bindVertexArray(null),
    { vao: o, buf: t, count: e.length / 8 }
  );
}
function makeBatch(e, o) {
  const t = gl.createVertexArray();
  (gl.bindVertexArray(t),
    gl.bindBuffer(gl.ARRAY_BUFFER, e.buf),
    gl.enableVertexAttribArray(0),
    gl.vertexAttribPointer(0, 3, gl.FLOAT, !1, 36, 0),
    gl.enableVertexAttribArray(1),
    gl.vertexAttribPointer(1, 3, gl.FLOAT, !1, 36, 12),
    gl.enableVertexAttribArray(2),
    gl.vertexAttribPointer(2, 3, gl.FLOAT, !1, 36, 24));
  const r = gl.createBuffer();
  (gl.bindBuffer(gl.ARRAY_BUFFER, r),
    gl.bufferData(gl.ARRAY_BUFFER, o * 52, gl.DYNAMIC_DRAW));
  for (const [c, n, i] of [
    [3, 3, 0],
    [4, 3, 12],
    [5, 3, 24],
    [6, 4, 36],
  ])
    (gl.enableVertexAttribArray(c),
      gl.vertexAttribPointer(c, n, gl.FLOAT, !1, 52, i),
      gl.vertexAttribDivisor(c, 1));
  return (
    gl.bindVertexArray(null),
    { vao: t, ib: r, mesh: e, max: o, data: new Float32Array(o * 13), n: 0 }
  );
}
function bpush(e, o, t, r, c, n, i, v, A, g, u, f, s, m) {
  if (e.n >= e.max) return;
  const l = e.data,
    a = e.n++ * 13;
  ((l[a] = o),
    (l[a + 1] = t),
    (l[a + 2] = r),
    (l[a + 3] = c),
    (l[a + 4] = n),
    (l[a + 5] = i),
    (l[a + 6] = v),
    (l[a + 7] = A),
    (l[a + 8] = g),
    (l[a + 9] = u),
    (l[a + 10] = f),
    (l[a + 11] = s),
    (l[a + 12] = m));
}
function bflush(e) {
  e.n &&
    (gl.bindBuffer(gl.ARRAY_BUFFER, e.ib),
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, e.data, 0, e.n * 13));
}
function bdraw(e) {
  e.n &&
    (gl.bindVertexArray(e.vao),
    gl.drawArraysInstanced(gl.TRIANGLES, 0, e.mesh.count, e.n));
}
function makePts(e) {
  const o = gl.createVertexArray();
  gl.bindVertexArray(o);
  const t = gl.createBuffer();
  return (
    gl.bindBuffer(gl.ARRAY_BUFFER, t),
    gl.bufferData(gl.ARRAY_BUFFER, e * 32, gl.DYNAMIC_DRAW),
    gl.enableVertexAttribArray(0),
    gl.vertexAttribPointer(0, 3, gl.FLOAT, !1, 32, 0),
    gl.enableVertexAttribArray(1),
    gl.vertexAttribPointer(1, 1, gl.FLOAT, !1, 32, 12),
    gl.enableVertexAttribArray(2),
    gl.vertexAttribPointer(2, 4, gl.FLOAT, !1, 32, 16),
    gl.bindVertexArray(null),
    { vao: o, buf: t, max: e, data: new Float32Array(e * 8), n: 0 }
  );
}
function ppush(e, o, t, r, c, n, i, v, A) {
  if (e.n >= e.max) return;
  const g = e.data,
    u = e.n++ * 8;
  ((g[u] = o),
    (g[u + 1] = t),
    (g[u + 2] = r),
    (g[u + 3] = c),
    (g[u + 4] = n),
    (g[u + 5] = i),
    (g[u + 6] = v),
    (g[u + 7] = A));
}
function pflush(e) {
  e.n &&
    (gl.bindBuffer(gl.ARRAY_BUFFER, e.buf),
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, e.data, 0, e.n * 8));
}
function pdraw(e) {
  e.n && (gl.bindVertexArray(e.vao), gl.drawArrays(gl.POINTS, 0, e.n));
}
const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
function makeTex() {
  const e = gl.createTexture();
  return (
    gl.bindTexture(gl.TEXTURE_2D, e),
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR,
    ),
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR),
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE),
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE),
    aniso &&
      gl.texParameterf(
        gl.TEXTURE_2D,
        aniso.TEXTURE_MAX_ANISOTROPY_EXT,
        Math.min(4, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)),
      ),
    e
  );
}
function upload(e, o) {
  (gl.bindTexture(gl.TEXTURE_2D, e),
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, !0),
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, o),
    gl.generateMipmap(gl.TEXTURE_2D),
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, !1));
}
function panel(e, o, t) {
  const r = document.createElement("canvas");
  return (
    (r.width = e),
    (r.height = o),
    { cvs: r, ctx: r.getContext("2d"), tex: makeTex(), w: t, h: (t * o) / e }
  );
}
function canvasTex(e, o, t) {
  const r = panel(e, o, 1);
  return (
    (r.paint = () => {
      (r.ctx.clearRect(0, 0, e, o), t(r.ctx, e, o), upload(r.tex, r.cvs));
    }),
    r.paint(),
    r
  );
}
