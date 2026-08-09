export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

/** eased progress of `x` inside the [from, to] window */
export const window01 = (x: number, from: number, to: number) =>
  easeInOutCubic(clamp01((x - from) / (to - from)));

// shared cubic-beziers (CSS strings)
export const BEZIER = {
  letterIn: "cubic-bezier(0.2, 0.9, 0.3, 1)",
  boxOpen: "cubic-bezier(0.76, 0, 0.24, 1)",
  barIn: "cubic-bezier(0.22, 1, 0.36, 1)",
  barOut: "cubic-bezier(0.4, 0, 0.6, 1)",
  ringHover: "cubic-bezier(0.23, 1, 0.32, 1)",
  equalizer: "cubic-bezier(0.25, 0.1, 0.25, 1)",
  clipReveal: "cubic-bezier(0.645, 0.045, 0.355, 1)",
  textReveal: "cubic-bezier(0.19, 1, 0.22, 1)",
  flipLink: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;
