"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Custom cursor (dot + magnetic ring) and 5px grid mouse trail.
 * Desktop only — bails out entirely on small/coarse-pointer devices.
 * Styling lives in styles/cursor.css (imported by the root layout).
 */

const GATE_QUERY = "(max-width: 1024px), (hover: none), (pointer: coarse)";
const INTERACTIVE_SELECTOR = "a, button, .slide-thumb, .pg-item, [data-cursor]";

const RING_LERP = 0.18;
const MAGNET_PULL = 0.22;
const MAGNET_MAX_WIDTH = 300;
const SLEEP_EPSILON = 0.08; // px — ring considered settled below this
const WRITE_EPSILON = 0.05; // px — skip DOM writes below this delta
const SLEEP_AFTER_MS = 260; // idle time before the rAF loop self-sleeps
const CURSOR_EXIT_MS = 140; // is-leaving cleanup delay
const DEFAULT_LABEL = "EXPLORE";
const DEFAULT_SIDE = "right";

const TRAIL_POOL_SIZE = 50;
const TRAIL_GRID = 5; // px — sample spacing and grid snap
const TRAIL_FADE_MS = 1000;

export default function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia(GATE_QUERY).matches) setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    /* ---------------- physics state ---------------- */
    let mx = 0;
    let my = 0; // raw pointer
    let rx = 0;
    let ry = 0; // ring (lerped)
    let lastDotX = Infinity;
    let lastDotY = Infinity;
    let lastRingX = Infinity;
    let lastRingY = Infinity;
    let hoverEl: HTMLElement | null = null;
    let rafId = 0;
    let running = false;
    let lastWake = 0;
    let seen = false; // first pointer position received
    let leaveTimer = 0;
    let linkRafId = 0;
    let labelObserver: MutationObserver | null = null;

    const computeTarget = (): [number, number] => {
      // Magnetism: small interactive elements pull the cursor toward their center.
      if (hoverEl && hoverEl.isConnected && hoverEl.offsetWidth < MAGNET_MAX_WIDTH) {
        const rect = hoverEl.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        return [mx + (cx - mx) * MAGNET_PULL, my + (cy - my) * MAGNET_PULL];
      }
      return [mx, my];
    };

    const loop = (now: number) => {
      const [tx, ty] = computeTarget();

      // Dot snaps to the target (CSS transition smooths the 0.03s hop).
      if (
        Math.abs(tx - lastDotX) > WRITE_EPSILON ||
        Math.abs(ty - lastDotY) > WRITE_EPSILON
      ) {
        dot.style.transform = `translate(${tx}px, ${ty}px)`;
        lastDotX = tx;
        lastDotY = ty;
      }

      // Ring eases toward the target.
      rx += (tx - rx) * RING_LERP;
      ry += (ty - ry) * RING_LERP;
      if (
        Math.abs(rx - lastRingX) > WRITE_EPSILON ||
        Math.abs(ry - lastRingY) > WRITE_EPSILON
      ) {
        ring.style.transform = `translate(${rx}px, ${ry}px)`;
        lastRingX = rx;
        lastRingY = ry;
      }

      const settled =
        Math.abs(tx - rx) < SLEEP_EPSILON && Math.abs(ty - ry) < SLEEP_EPSILON;
      if (settled && now - lastWake > SLEEP_AFTER_MS) {
        running = false;
        return; // self-sleep
      }
      rafId = requestAnimationFrame(loop);
    };

    const wake = () => {
      lastWake = performance.now();
      if (!running) {
        running = true;
        rafId = requestAnimationFrame(loop);
      }
    };

    /* ---------------- grid trail ---------------- */
    const pool: HTMLDivElement[] = [];
    const allSquares: HTMLDivElement[] = [];
    const activeCells = new Set<string>();
    for (let i = 0; i < TRAIL_POOL_SIZE; i++) {
      const sq = document.createElement("div");
      sq.className = "mouseTracker--01";
      document.body.appendChild(sq);
      pool.push(sq);
      allSquares.push(sq);
    }
    let px = NaN;
    let py = NaN; // previous trail anchor

    const dropSquare = (x: number, y: number) => {
      const gx = Math.round(x / TRAIL_GRID) * TRAIL_GRID;
      const gy = Math.round(y / TRAIL_GRID) * TRAIL_GRID;
      const key = `${gx},${gy}`;
      if (activeCells.has(key)) return; // one active square per grid cell
      const sq = pool.pop();
      if (!sq) return; // pool exhausted
      activeCells.add(key);
      sq.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
      for (const a of sq.getAnimations()) a.cancel();
      const anim = sq.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: TRAIL_FADE_MS,
        easing: "linear",
        fill: "forwards",
      });
      anim.onfinish = () => {
        activeCells.delete(key);
        pool.push(sq);
      };
    };

    const onPointerMove = (e: PointerEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      if (Number.isNaN(px)) {
        px = x;
        py = y;
        dropSquare(x, y);
        return;
      }
      const dx = x - px;
      const dy = y - py;
      const dist = Math.hypot(dx, dy);
      if (dist < TRAIL_GRID) return; // accumulate until a full grid step
      const steps = Math.floor(dist / TRAIL_GRID);
      for (let i = 1; i <= steps; i++) {
        const t = (i * TRAIL_GRID) / dist;
        dropSquare(px + dx * t, py + dy * t);
      }
      px = x;
      py = y;
    };

    /* ---------------- pointer tracking ---------------- */
    const onMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!seen) {
        seen = true;
        // Start the ring under the pointer instead of flying in from (0,0).
        rx = mx;
        ry = my;
        dot.classList.remove("is-hidden");
        ring.classList.remove("is-hidden");
      }
      wake();
    };

    /* ---------------- hover state ---------------- */
    const applyLabel = (el: HTMLElement) => {
      ring.setAttribute("data-cursor-label", el.dataset.cursor || DEFAULT_LABEL);
      ring.setAttribute("data-cursor-side", el.dataset.cursorSide || DEFAULT_SIDE);
    };

    const onPointerOver = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const el = target.closest<HTMLElement>(INTERACTIVE_SELECTOR);
      if (!el || el === hoverEl) return;
      hoverEl = el;
      window.clearTimeout(leaveTimer);
      ring.classList.remove("is-leaving");
      applyLabel(el);
      // Track live label swaps (e.g. menu button OPEN <-> CLOSE mid-hover).
      labelObserver?.disconnect();
      labelObserver = new MutationObserver(() => {
        if (hoverEl) applyLabel(hoverEl);
      });
      labelObserver.observe(el, {
        attributes: true,
        attributeFilter: ["data-cursor", "data-cursor-side"],
      });
      dot.classList.add("is-link");
      cancelAnimationFrame(linkRafId);
      linkRafId = requestAnimationFrame(() => ring.classList.add("is-link"));
      wake();
    };

    const onPointerOut = (e: PointerEvent) => {
      if (!hoverEl) return;
      const rel = e.relatedTarget;
      if (rel instanceof Element && rel.closest(INTERACTIVE_SELECTOR) === hoverEl) {
        return; // still inside the same interactive element
      }
      hoverEl = null;
      labelObserver?.disconnect();
      labelObserver = null;
      cancelAnimationFrame(linkRafId);
      dot.classList.remove("is-link");
      ring.classList.remove("is-link");
      ring.classList.add("is-leaving");
      window.clearTimeout(leaveTimer);
      leaveTimer = window.setTimeout(() => {
        ring.classList.remove("is-leaving");
        ring.setAttribute("data-cursor-label", DEFAULT_LABEL);
        ring.setAttribute("data-cursor-side", DEFAULT_SIDE);
      }, CURSOR_EXIT_MS);
      wake();
    };

    /* ---------------- document enter/leave fade ---------------- */
    const onDocLeave = () => {
      dot.classList.add("is-hidden");
      ring.classList.add("is-hidden");
    };
    const onDocEnter = () => {
      if (!seen) return;
      dot.classList.remove("is-hidden");
      ring.classList.remove("is-hidden");
    };

    document.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("pointerout", onPointerOut);
    document.documentElement.addEventListener("mouseleave", onDocLeave);
    document.documentElement.addEventListener("mouseenter", onDocEnter);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerout", onPointerOut);
      document.documentElement.removeEventListener("mouseleave", onDocLeave);
      document.documentElement.removeEventListener("mouseenter", onDocEnter);
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(linkRafId);
      running = false;
      window.clearTimeout(leaveTimer);
      labelObserver?.disconnect();
      for (const sq of allSquares) {
        for (const a of sq.getAnimations()) a.cancel();
        sq.remove();
      }
      activeCells.clear();
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div id="cursor-dot" ref={dotRef} className="is-hidden" aria-hidden="true" />
      <div
        id="cursor-ring"
        ref={ringRef}
        className="is-hidden"
        aria-hidden="true"
        data-cursor-label={DEFAULT_LABEL}
        data-cursor-side={DEFAULT_SIDE}
      />
    </>
  );
}
