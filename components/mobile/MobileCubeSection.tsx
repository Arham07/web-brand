"use client";

import { useRef } from "react";
import { getLenis } from "@/lib/lenis";
import { useSectionNear } from "@/hooks/useSectionNear";
import { isMobileLayout } from "@/lib/device";

// all faces ship as 1200×1200 (verified with sips)
const IMAGE_FACES = [
  { face: "is-right", src: "/images/cube/t2.webp", width: 1200, height: 1200 },
  { face: "is-back", src: "/images/cube/t3.webp", width: 1200, height: 1200 },
  { face: "is-left", src: "/images/cube/t4.webp", width: 1200, height: 1200 },
  { face: "is-top", src: "/images/cube/t5.webp", width: 1200, height: 1200 },
  { face: "is-bottom", src: "/images/cube/t6.webp", width: 1200, height: 1200 },
] as const;

// Spin model constants
const BASE_SPIN = 0.21; // deg per frame baseline
const FRICTION = 0.87; // per-frame decay of the scroll-fed boost
const VEL_GAIN = 0.07; // scroll velocity → extra spin coefficient
const MAX_EXTRA = 1.12; // clamp for the scroll boost (deg/frame)
const DRAG_X = 0.55; // horizontal finger travel → rotY
const DRAG_Y = 0.48; // vertical finger travel → rotX
const FLING = 0.16; // horizontal fling feeds the spin boost
const SPRING = 0.1; // resting spring-back lerp factor
const SPRING_BOOST = 0.22; // stronger spring right after release / scroll
const BOOST_DECAY = 0.92; // per-frame decay of the boosted spring

/**
 * Phone-only replacement for the STM text field: a CSS 3D cube that
 * auto-rotates, speeds up with scroll velocity and can be flicked by touch.
 * Rendering work (rAF) only runs while the scene is near the viewport.
 */
export default function MobileCubeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<HTMLDivElement>(null);

  useSectionNear(sectionRef, () => {
    // desktop: the section is display:none — its zero rect fools isNear(),
    // so without this guard the whole init (and the section's media) ran on
    // desktop too
    if (!isMobileLayout()) return;

    const scene = sceneRef.current;
    const cube = cubeRef.current;
    if (!scene || !cube) return;

    let angle = 0; // continuous auto-rotation (deg)
    let extra = 0; // scroll/fling boost (deg per frame)
    let rotX = 0; // touch-driven tilt
    let rotY = 0; // touch-driven extra yaw
    let touching = false;
    let boost = 0; // temporary spring-back strength
    let rafId = 0;
    let running = false;

    const addVelocity = (v: number) => {
      extra = Math.max(-MAX_EXTRA, Math.min(MAX_EXTRA, extra + v * VEL_GAIN));
    };

    // ── Scroll feed: Lenis velocity when the smoother is active,
    //    native scroll deltas otherwise (touch devices). ──
    const lenis = getLenis();
    let detachScroll: () => void;
    if (lenis) {
      const onLenisScroll = (e: { velocity: number }) =>
        addVelocity(e.velocity * 3.2);
      lenis.on("scroll", onLenisScroll);
      detachScroll = () => lenis.off("scroll", onLenisScroll);
    } else {
      let lastY = window.scrollY;
      const onScroll = () => {
        const dy = window.scrollY - lastY;
        lastY = window.scrollY;
        addVelocity(dy);
        if (dy > 0) boost = SPRING_BOOST;
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      detachScroll = () => window.removeEventListener("scroll", onScroll);
    }

    // ── Touch drag / fling ──
    let lastTouchX = 0;
    let lastTouchY = 0;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      touching = true;
      boost = 0;
      lastTouchX = t.clientX;
      lastTouchY = t.clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - lastTouchX;
      const dy = t.clientY - lastTouchY;
      lastTouchX = t.clientX;
      lastTouchY = t.clientY;
      rotY += dx * DRAG_X;
      rotX -= dy * DRAG_Y;
      addVelocity(dx * FLING);
    };

    const onTouchEnd = () => {
      touching = false;
      boost = SPRING_BOOST;
      lastTouchX = 0;
      lastTouchY = 0;
    };

    scene.addEventListener("touchstart", onTouchStart, { passive: true });
    scene.addEventListener("touchmove", onTouchMove, { passive: true });
    scene.addEventListener("touchend", onTouchEnd, { passive: true });
    scene.addEventListener("touchcancel", onTouchEnd, { passive: true });

    // ── Frame loop (gated by the IntersectionObserver below) ──
    const tick = () => {
      rafId = 0;
      extra *= FRICTION;
      angle += BASE_SPIN + extra;

      if (!touching) {
        const k = Math.max(SPRING, boost);
        rotX += (0 - rotX) * k;
        rotY += (0 - rotY) * k;
        boost *= BOOST_DECAY;
      }

      cube.style.transform = `rotateX(${rotX}deg) rotateY(${angle + rotY}deg)`;
      if (running) rafId = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        const inView = entries.some((entry) => entry.isIntersecting);
        if (inView && !running) {
          running = true;
          if (!rafId) rafId = requestAnimationFrame(tick);
        } else if (!inView && running) {
          running = false;
          if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = 0;
          }
        }
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(scene);

    return () => {
      io.disconnect();
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      detachScroll();
      scene.removeEventListener("touchstart", onTouchStart);
      scene.removeEventListener("touchmove", onTouchMove);
      scene.removeEventListener("touchend", onTouchEnd);
      scene.removeEventListener("touchcancel", onTouchEnd);
    };
  });

  return (
    <section
      ref={sectionRef}
      className="mobile-cube-section"
      aria-label="Mobile cube showcase"
    >
      <div className="mobile-cube-bg" aria-hidden="true">
        <video
          data-lazy-video=""
          data-lazy-on-scroll="true"
          autoPlay
          muted
          loop
          playsInline
          preload="none"
        >
          <source data-src="/images/bg.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="mcube-title">
        <h2 className="mcube-title__eye">( Focused on the Essence of Digital Craft )</h2>
        <p className="mcube-title__line">WHO WE ARE</p>
      </div>

      <div ref={sceneRef} className="mobile-cube-scene">
        <div ref={cubeRef} className="mobile-cube">
          <div className="mobile-cube-face is-front">
            <video
              data-lazy-video=""
              autoPlay
              muted
              loop
              playsInline
              preload="none"
            >
              <source data-src="/images/cube/t1.mp4" type="video/mp4" />
            </video>
          </div>
          {/* native lazy: the browser's fetch scheduler beats the JS
              trickle-hydrator (faces used to show up blank mid-spin), and
              display:none on desktop means it never fetches there */}
          {IMAGE_FACES.map(({ face, src, width, height }) => (
            <div key={face} className={`mobile-cube-face ${face}`}>
              <img
                src={src}
                alt=""
                width={width}
                height={height}
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mcube-copy">
        <p className="mcube-copy__desc">
          Every powerful digital experience begins at a single precise point.
          American Web Guild specializes in Taichung web design, high-end
          commercial visual generation, and AI motion imagery — crafting
          every pixel with precision so it delivers maximum brand value.
        </p>
      </div>
    </section>
  );
}
