"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Runs `init` once when the section approaches the viewport
 * (IntersectionObserver with a large rootMargin), deferred through
 * requestIdleCallback so it never competes with scrolling.
 * Returns whatever cleanup `init` returns, invoked on unmount.
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
    const run = () => {
      if (ran) return;
      ran = true;
      const idle =
        window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1));
      idle(() => {
        cleanupRef.current = init();
      });
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          run();
        }
      },
      { rootMargin: `${rootMargin}px 0px ${rootMargin}px 0px` }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cleanupRef.current?.();
      cleanupRef.current = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
