"use client";

import { useEffect, type RefObject } from "react";
import { ScrollTrigger } from "@/lib/gsap";

/**
 * Keeps ScrollTrigger measurements honest on content-heavy pages.
 *
 * TransitionProvider refreshes once inside a single rAF after a route change,
 * and ScrollProvider only refreshes on `window load` / `fonts.ready` — neither
 * of which re-fire on a client-side navigation. This debounces a refresh
 * across every moment the page height can still move.
 */
export function useScrollTriggerSettle(
  rootRef: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    let timer = 0;
    let disposed = false;

    const refresh = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!disposed) ScrollTrigger.refresh();
      }, 120);
    };

    const raf = requestAnimationFrame(refresh);
    const backstop = window.setTimeout(refresh, 1200);

    // Only worth listening when the document hasn't finished loading —
    // after a client-side nav readyState is already "complete".
    const waitingOnLoad = document.readyState !== "complete";
    if (waitingOnLoad) window.addEventListener("load", refresh, { once: true });

    document.fonts?.ready.then(refresh).catch(() => {});

    const images = rootRef.current
      ? Array.from(rootRef.current.querySelectorAll("img"))
      : [];
    images.forEach((img) => {
      if (img.complete) return;
      img.addEventListener("load", refresh);
      img.addEventListener("error", refresh);
    });

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      window.clearTimeout(backstop);
      cancelAnimationFrame(raf);
      if (waitingOnLoad) window.removeEventListener("load", refresh);
      images.forEach((img) => {
        img.removeEventListener("load", refresh);
        img.removeEventListener("error", refresh);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
