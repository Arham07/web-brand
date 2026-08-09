"use client";

import { useEffect, useRef, useState } from "react";
import type Lenis from "lenis";
import { getLenis } from "@/lib/lenis";
import { isMobileWidth, prefersReducedMotion } from "@/lib/device";

declare global {
  interface Window {
    _holdFilmGrain?: (ms?: number) => void;
  }
}

const FRAME_COUNT = 10;
const DENSITY = 0.7;
const BASE_INTERVAL = 1000 / 25;
const SCROLL_INTERVAL = 1000 / 12;
const SCROLL_HOLD_MS = 180;
const SCROLL_HOOK_DELAY = 300;
const RESIZE_DEBOUNCE = 160;

/**
 * #film-grain-canvas — full-viewport animated noise overlay (spec §8).
 * Renders nothing at all on mobile widths (≤768 at mount) or when the user
 * prefers reduced motion.
 */
export default function FilmGrain() {
  const [enabled, setEnabled] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isMobileWidth() || prefersReducedMotion()) return;
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let frames: ImageData[] = [];
    let frameIndex = 0;
    let holdUntil = 0;
    let interval = BASE_INTERVAL;
    let timeoutId = 0;
    let rafId = 0;
    let destroyed = false;

    const bake = () => {
      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);
      canvas.width = w; // 1× DPR on purpose
      canvas.height = h;
      const next: ImageData[] = [];
      for (let i = 0; i < FRAME_COUNT; i++) {
        const img = ctx.createImageData(w, h);
        const px = new Uint32Array(img.data.buffer);
        for (let p = 0; p < px.length; p++) {
          if (Math.random() < DENSITY) px[p] = 0xffffffff;
        }
        next.push(img);
      }
      frames = next;
      frameIndex = 0;
      ctx.putImageData(frames[frameIndex], 0, 0);
    };

    const stopLoop = () => {
      window.clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
      timeoutId = 0;
      rafId = 0;
    };

    const step = () => {
      rafId = 0;
      if (destroyed) return;
      const now = performance.now();
      const held = now < holdUntil;
      interval = held ? SCROLL_INTERVAL : BASE_INTERVAL;
      if (!held && frames.length > 0) {
        frameIndex = (frameIndex + 1) % frames.length;
        ctx.putImageData(frames[frameIndex], 0, 0);
      }
      queueTick();
    };

    const queueTick = () => {
      if (destroyed || document.hidden) return;
      timeoutId = window.setTimeout(() => {
        timeoutId = 0;
        rafId = requestAnimationFrame(step);
      }, interval);
    };

    const startLoop = () => {
      if (destroyed || timeoutId !== 0 || rafId !== 0) return;
      queueTick();
    };

    const hold = (ms: number = SCROLL_HOLD_MS) => {
      holdUntil = Math.max(holdUntil, performance.now() + ms);
    };

    const onScroll = () => hold(SCROLL_HOLD_MS);

    const onVisibility = () => {
      if (document.hidden) stopLoop();
      else startLoop();
    };

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (!destroyed) bake();
      }, RESIZE_DEBOUNCE);
    };

    // Scroll listeners are attached late so page-load scroll restoration
    // doesn't immediately throttle the grain.
    let hookedLenis: Lenis | null = null;
    const hookTimer = window.setTimeout(() => {
      window.addEventListener("scroll", onScroll, { passive: true });
      const lenis = getLenis();
      if (lenis) {
        hookedLenis = lenis;
        lenis.on("scroll", onScroll);
      }
    }, SCROLL_HOOK_DELAY);

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResize);
    window._holdFilmGrain = hold;

    bake();
    startLoop();

    return () => {
      destroyed = true;
      stopLoop();
      window.clearTimeout(hookTimer);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      hookedLenis?.off("scroll", onScroll);
      if (window._holdFilmGrain === hold) delete window._holdFilmGrain;
      frames = [];
    };
  }, [enabled]);

  if (!enabled) return null;
  return <canvas id="film-grain-canvas" ref={canvasRef} aria-hidden="true" />;
}
