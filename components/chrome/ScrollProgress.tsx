"use client";

import { useEffect } from "react";
import type Lenis from "lenis";
import { getLenis, scrollTop } from "@/lib/lenis";

/**
 * #scroll-progress — 1.5px fixed top bar (spec §6).
 * Target progress (0–100) tracks scrollTop / (docHeight − innerHeight);
 * rendered through a self-terminating rAF lerp that sleeps once settled.
 */
export default function ScrollProgress() {
  useEffect(() => {
    const bar = document.getElementById("scroll-progress");
    if (!(bar instanceof HTMLElement)) return;

    let target = 0; // 0..100
    let current = 0;
    let lastWritten = -1;
    let rafId = 0;
    let running = false;
    let disposed = false;

    const write = (value: number) => {
      bar.style.transform = `scaleX(${value / 100})`;
      lastWritten = value;
    };

    const step = () => {
      if (disposed) return;
      current += (target - current) * 0.12;

      const settled = Math.abs(target - current) < 0.05;
      if (settled) current = target;

      // Skip DOM writes below 0.05 (of the 0–100 range) unless finishing.
      if (settled || Math.abs(current - lastWritten) > 0.05) write(current);

      if (settled) {
        running = false;
        rafId = 0;
        return; // loop sleeps until the next wake()
      }
      rafId = requestAnimationFrame(step);
    };

    const wake = () => {
      if (running || disposed) return;
      running = true;
      rafId = requestAnimationFrame(step);
    };

    // scrollHeight is a forced-layout read — reading it on every scroll
    // event thrashed layout on mobile. Cache it; the resize listener and
    // the body ResizeObserver keep it fresh.
    let cachedMax = 0;
    const remeasure = () => {
      cachedMax = document.documentElement.scrollHeight - window.innerHeight;
      update();
    };

    const update = () => {
      const pct = cachedMax > 0 ? (scrollTop() / cachedMax) * 100 : 0;
      target = Math.min(100, Math.max(0, pct));
      wake();
    };

    // Lenis drives the real window scroll, so the native listener covers the
    // fallback; the Lenis event (hooked once available) mirrors the original.
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", remeasure);
    window.addEventListener("load", remeasure);

    let hookedLenis: Lenis | null = null;
    const hookRaf = requestAnimationFrame(() => {
      const lenis = getLenis();
      if (lenis) {
        hookedLenis = lenis;
        lenis.on("scroll", update);
      }
    });

    const ro = new ResizeObserver(remeasure);
    ro.observe(document.body);

    remeasure();

    return () => {
      disposed = true;
      running = false;
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(hookRaf);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("load", remeasure);
      hookedLenis?.off("scroll", update);
      ro.disconnect();
    };
  }, []);

  return <div id="scroll-progress" aria-hidden="true" />;
}
