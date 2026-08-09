import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap";
import { isCoarsePointer, prefersReducedMotion } from "./device";

declare global {
  interface Window {
    _lenis: Lenis | null;
  }
}

let lenis: Lenis | null = null;
let initialized = false;

const tick = (time: number) => {
  lenis?.raf(time * 1000);
};

/**
 * Create the single shared Lenis instance. No-op on coarse pointers
 * (native touch scrolling, `getLenis()` stays null) and on re-entry.
 */
export function initLenis(): Lenis | null {
  if (typeof window === "undefined") return null;
  if (initialized || window._lenis !== undefined) {
    lenis = window._lenis ?? lenis;
    if (lenis) return lenis;
  }
  initialized = true;

  if (isCoarsePointer()) {
    window._lenis = null;
    return null;
  }

  const reduced = prefersReducedMotion();
  lenis = new Lenis({
    lerp: reduced ? 1 : 0.09,
    smoothWheel: !reduced,
    wheelMultiplier: 1.0,
    touchMultiplier: 1.5,
    syncTouch: false,
    infinite: false,
  });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  window._lenis = lenis;
  return lenis;
}

export const getLenis = () => lenis;

/** Current scroll position — Lenis when active, native otherwise. */
export const scrollTop = () => (lenis ? lenis.scroll : window.scrollY);

/** Signed scroll velocity — 0 when Lenis is not active. */
export const scrollVelocity = () => lenis?.velocity ?? 0;

export function scrollToTarget(
  target: number | string | HTMLElement,
  opts?: { duration?: number; offset?: number; immediate?: boolean }
) {
  if (lenis) {
    lenis.scrollTo(target, opts);
  } else if (typeof target === "number") {
    window.scrollTo({ top: target, behavior: opts?.immediate ? "auto" : "smooth" });
  } else {
    const el =
      typeof target === "string"
        ? document.querySelector<HTMLElement>(target)
        : target;
    el?.scrollIntoView({ behavior: opts?.immediate ? "auto" : "smooth" });
  }
}
