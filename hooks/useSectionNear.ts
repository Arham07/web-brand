"use client";

import { useEffect, useRef, type RefObject } from "react";

/* ------------------------------------------------------------------ */
/*  Idle warm-up queue                                                 */
/*  Section inits used to run mid-scroll as each section came near —   */
/*  the entire first scroll paid for GSAP contexts, video hydration,   */
/*  image decodes and (heaviest) the ring scene's WebGL boot, which is */
/*  exactly the "laggy the first time, fine afterwards" report. The    */
/*  pump drains every pending init one idle slice at a time shortly    */
/*  after load, while the user is still reading the hero.              */
/* ------------------------------------------------------------------ */

type IdleDeadline = { timeRemaining: () => number };

const warmQueue = new Set<() => void>();
let pumpStarted = false;

const idleSlice = (cb: (deadline?: IdleDeadline) => void) => {
  const ric = (
    window as Window & {
      requestIdleCallback?: (
        cb: (deadline: IdleDeadline) => void,
        opts?: { timeout: number }
      ) => number;
    }
  ).requestIdleCallback;
  if (typeof ric === "function") ric(cb, { timeout: 400 });
  else window.setTimeout(cb, 200);
};

function pump(deadline?: IdleDeadline) {
  // Drain as many inits as the idle deadline actually affords rather than one
  // per slice. With ~10 sections queued, one-per-slice was still draining long
  // after a phone user had started scrolling — and a scroll suppresses the
  // idle queue outright, so everything left over waited for the scroll to
  // stop. Which is exactly what "it only starts when I stop scrolling" is.
  do {
    const next = warmQueue.values().next();
    if (next.done) {
      // queue drained — allow a later pump for newly mounted sections
      // (client-side navigations register fresh inits)
      pumpStarted = false;
      return;
    }
    warmQueue.delete(next.value);
    next.value(); // idempotent — no-op if proximity already ran it
  } while (deadline && deadline.timeRemaining() > 8);
  idleSlice(pump);
}

function startPump() {
  if (pumpStarted || typeof window === "undefined") return;
  pumpStarted = true;
  const begin = () => window.setTimeout(() => idleSlice(pump), 1500);
  if (document.readyState === "complete") begin();
  else window.addEventListener("load", begin, { once: true });
}

/**
 * Runs `init` once when the section approaches the viewport, deferred through
 * requestIdleCallback so it never competes with scrolling — or earlier, from
 * the global idle warm-up pump that drains all pending inits shortly after
 * load so the first scroll never pays for them.
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

      // Short deadlines on purpose: proximity fires ~2200px out, and a
      // 600/900ms wait is 2–3 thousand pixels of fling — long enough for the
      // section to have been scrolled past before its init even ran.
      if (typeof ric === "function") {
        ric(invoke, { timeout: 250 });
        timerId = window.setTimeout(invoke, 400);
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

    // idle warm-up: init runs shortly after load even if the user never
    // scrolls near — run() is idempotent so the proximity path stays safe
    warmQueue.add(run);
    startPump();

    // already in range at mount (deep link, restored scroll position)
    if (isNear()) run();

    return () => {
      disposed = true;
      warmQueue.delete(run);
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (timerId) window.clearTimeout(timerId);
      cleanupRef.current?.();
      cleanupRef.current = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
