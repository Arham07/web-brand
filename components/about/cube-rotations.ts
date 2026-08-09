/**
 * The six rotation stops the capabilities cube steps through, in scroll order.
 * Each brings one face square to the camera: top → front → right → back →
 * left → bottom.
 */
export const CUBE_STOPS: Array<[rotX: number, rotY: number]> = [
  [90, 0],
  [0, 0],
  [0, -90],
  [0, -180],
  [0, -270],
  [-90, -270],
];

export const CUBE_STEPS = CUBE_STOPS.length - 1; // 5 transitions

/** Smoothstep-ish ease applied within each segment. */
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

/**
 * Maps scrub progress (0..1) to interpolated cube rotation.
 * Pure — no DOM — so both the main and mini cube can be driven from one result.
 */
export function rotationAt(progress: number): { rx: number; ry: number } {
  const t = Math.min(Math.max(progress, 0), 1) * CUBE_STEPS;
  const i = Math.min(Math.floor(t), CUBE_STEPS - 1);
  const f = easeInOut(t - i);
  const [ax, ay] = CUBE_STOPS[i];
  const [bx, by] = CUBE_STOPS[i + 1];
  return { rx: ax + (bx - ax) * f, ry: ay + (by - ay) * f };
}

/** Index of the face currently facing the camera. */
export const activeFaceAt = (progress: number) =>
  Math.round(Math.min(Math.max(progress, 0), 1) * CUBE_STEPS);

/** The exact string written to both cubes, so they can never desync. */
export const rotationTransform = (rx: number, ry: number) =>
  `rotateX(${rx}deg) rotateY(${ry}deg)`;
