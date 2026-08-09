// Fullscreen-quad shaders for the hero slide transition.
// Effect: cover-fit crossfade with a simplex-noise "molten" warp, a vertical
// push in the navigation direction, center-pull scaling and RGB fringing —
// all peaking at mid-transition and vanishing at the endpoints.

export const heroVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

export const heroFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D uTex1;
uniform sampler2D uTex2;
uniform float uProgress;
uniform float uDirection;
uniform float uTexReady;
uniform vec2 uResolution;
uniform vec2 uImageResolution;
uniform vec2 uImageResolution2;
uniform vec2 uMouse;

varying vec2 vUv;

// --- 2D simplex noise (standard implementation) -----------------------
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// --- CSS object-fit: cover for a texture's UVs ------------------------
vec2 coverUv(vec2 uv, vec2 imageRes) {
  vec2 s = uResolution / imageRes;
  float scale = max(s.x, s.y);
  vec2 scaledSize = imageRes * scale;
  vec2 offset = (uResolution - scaledSize) * 0.5;
  return (uv * uResolution - offset) / scaledSize;
}

vec2 zoomAroundCenter(vec2 uv, float amount) {
  return (uv - 0.5) * amount + 0.5;
}

void main() {
  if (uTexReady < 0.5) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float p = smoothstep(0.0, 1.0, uProgress);

  vec2 uvA = coverUv(vUv, uImageResolution);
  vec2 uvB = coverUv(vUv, uImageResolution2);

  // idle look: constant 5% zoom + subtle mouse parallax
  uvA = zoomAroundCenter(uvA, 0.95) - uMouse * 0.015;
  uvB = zoomAroundCenter(uvB, 0.95) - uMouse * 0.015;

  vec2 warp = vec2(0.0);
  float n = 0.0;
  if (uProgress > 0.001 && uProgress < 0.999) {
    n = snoise(mix(uvA, uvB, 0.5) * 3.0 + p * 2.0);
    warp = vec2(n) * p * (1.0 - p) * 0.3;
  }

  vec2 center = vec2(0.5);
  vec2 uv1 = mix(uvA, center, p * 0.15) + vec2(0.0, uDirection * p * 0.3) + warp;
  vec2 uv2 = mix(uvB, center, (1.0 - p) * 0.15) -
             vec2(0.0, uDirection * (1.0 - p) * 0.3) + warp;

  float shift = 0.04 * p * (1.0 - p) * (n + 1.0);

  vec4 t1 = vec4(
    texture2D(uTex1, uv1 + vec2(shift, 0.0)).r,
    texture2D(uTex1, uv1).g,
    texture2D(uTex1, uv1 - vec2(shift, 0.0)).b,
    1.0
  );
  vec4 t2 = vec4(
    texture2D(uTex2, uv2 + vec2(shift, 0.0)).r,
    texture2D(uTex2, uv2).g,
    texture2D(uTex2, uv2 - vec2(shift, 0.0)).b,
    1.0
  );

  gl_FragColor = mix(t1, t2, p);
}
`;
