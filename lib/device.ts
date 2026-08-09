// Client-only device gates. Call these inside effects / event handlers only.

export const isCoarsePointer = () =>
  window.matchMedia("(hover: none), (pointer: coarse)").matches;

export const isMobileWidth = () => window.innerWidth <= 768;

export const isMobileLayout = () => window.innerWidth <= 767;

export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
