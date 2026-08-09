"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Runs `init` once when the section approaches the viewport, deferred through
 * requestIdleCallback so it never competes with scrolling.
 *
 * Proximity is detected two ways on purpose: an IntersectionObserver (cheap,
 * handles the common case) plus a rAF-throttled geometry check on scroll.
 * IO callbacks are suppressed or heavily delayed while a document is hidden
 * (background tab, offscreen embed), which would otherwise leave a section
 * permanently uninitialised for anyone who returns to the tab mid-page.
 *
 * Whatever `init` returns is invoked on unmount.
 */
export function useSectionNear(
  ref: RefObject<HTMLElement | null>,
  init: () => void | (() => void),
  { rootMargin = 2200 }: { rootMargin?: number } = {}
) {
  const cleanupRef = useRef<void | (() => void)>(undefined);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let ran = false;
    let fired = false;
    let disposed = false;
    let timerId = 0;

    const invoke = () => {
      // `disposed` matters in dev, where StrictMode tears the effect down
      // while a deferred init is still queued — without it the section would
      // initialise twice and leak a duplicate set of ScrollTriggers.
      if (fired || disposed) return;
      fired = true;
      cleanupRef.current = init();
    };

    const run = () => {
      if (ran) return;
      ran = true;
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      // rIC when available; the timeout guarantees the init still runs in
      // hidden documents and on browsers without requestIdleCallback.
      const ric = (
        window as Window & {
          requestIdleCallback?: (
            cb: () => void,
            opts?: { timeout: number }
          ) => number;
        }
      ).requestIdleCallback;

      if (typeof ric === "function") {
        ric(invoke, { timeout: 600 });
        timerId = window.setTimeout(invoke, 900);
      } else {
        timerId = window.setTimeout(invoke, 1);
      }
    };

    const isNear = () => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight + rootMargin && r.bottom > -rootMargin;
    };

    // Timestamp-throttled rather than rAF-throttled: rAF callbacks are
    // suppressed alongside IO in hidden documents, which would defeat the
    // whole point of this fallback.
    let lastCheck = 0;
    const onScroll = () => {
      const now = Date.now();
      if (now - lastCheck < 150) return;
      lastCheck = now;
      if (isNear()) run();
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) run();
      },
      { rootMargin: `${rootMargin}px 0px ${rootMargin}px 0px` }
    );
    io.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });

    // already in range at mount (deep link, restored scroll position)
    if (isNear()) run();

    return () => {
      disposed = true;
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (timerId) window.clearTimeout(timerId);
      cleanupRef.current?.();
      cleanupRef.current = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
