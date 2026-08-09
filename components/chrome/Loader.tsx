"use client";

import { useEffect, useRef, useState } from "react";

/**
 * NUDOT boot loader (spec §3).
 *
 * The visual choreography is 100% CSS keyframes (styles/loader.css) with
 * absolute delays measured from first paint / mount. This component only:
 *   1. renders the loader DOM on the very first mount (SSR included, so the
 *      dark shield covers paint before hydration),
 *   2. dispatches the two lifecycle events other systems listen for,
 *   3. force-hides + removes the node once the show is over.
 *
 * A module-level flag makes every later mount (client navigations) render
 * nothing — the loader plays exactly once per full page load.
 */

const HERO_REVEAL_MS = 2700;
const DISMISS_MS = 3200;
const REMOVE_MS = 3500;
const HARD_FALLBACK_MS = 5500;

let hasBooted = false;

const ICON_VIDEO_HTML =
  '<video src="/images/loading.mp4" autoplay muted playsinline preload="auto"></video>';

export default function Loader() {
  // Read-only initializer: true on any mount after the first client boot.
  const [removed, setRemoved] = useState<boolean>(() => hasBooted);
  const [dismissed, setDismissed] = useState(false);

  // Refs survive StrictMode effect re-runs, keeping init idempotent and
  // the timeline anchored to the original mount time.
  const ownsBootRef = useRef<boolean | null>(null);
  const mountedAtRef = useRef<number | null>(null);
  const heroFiredRef = useRef(false);
  const dismissFiredRef = useRef(false);

  useEffect(() => {
    if (ownsBootRef.current === null) {
      // Decide once, per instance, whether this mount owns the boot sequence.
      ownsBootRef.current = !hasBooted;
    }
    if (!ownsBootRef.current) return;
    hasBooted = true;

    if (mountedAtRef.current === null) {
      mountedAtRef.current = performance.now();
    }
    const anchor = mountedAtRef.current;
    const remaining = (target: number) =>
      Math.max(0, target - (performance.now() - anchor));

    const fireHeroReveal = () => {
      if (heroFiredRef.current) return;
      heroFiredRef.current = true;
      window.dispatchEvent(new CustomEvent("nudot:hero-reveal"));
    };

    const fireDismiss = () => {
      if (dismissFiredRef.current) return;
      dismissFiredRef.current = true;
      setDismissed(true);
      (window as unknown as { _nudotLoaderDismissed?: boolean })._nudotLoaderDismissed =
        true;
      window.dispatchEvent(new CustomEvent("nudot:loader-dismissed"));
    };

    const timers: number[] = [
      window.setTimeout(fireHeroReveal, remaining(HERO_REVEAL_MS)),
      window.setTimeout(fireDismiss, remaining(DISMISS_MS)),
      window.setTimeout(() => setRemoved(true), remaining(REMOVE_MS)),
      // Hard fallback: if anything stalled, force the full dismissal path.
      window.setTimeout(() => {
        fireHeroReveal();
        fireDismiss();
        setRemoved(true);
      }, remaining(HARD_FALLBACK_MS)),
    ];

    return () => {
      for (const id of timers) window.clearTimeout(id);
    };
  }, []);

  if (removed) return null;

  return (
    <div
      id="nudot-loader"
      className={dismissed ? "nd-dismissed" : undefined}
      aria-hidden="true"
    >
      <div className="nd-mask" />
      <div className="nd-logo">
        <span className="nd-letter nd-n">N</span>
        {/* Raw HTML so muted/autoplay attributes exist in SSR markup and the
            video plays before hydration. */}
        <span
          className="nd-icon"
          dangerouslySetInnerHTML={{ __html: ICON_VIDEO_HTML }}
        />
        <span className="nd-letter nd-d">D</span>
      </div>
    </div>
  );
}
