"use client";

/**
 * Decorative 12-column hairline grid pinned to the viewport behind the About
 * page content.
 *
 * Choreography: the columns wipe down from their top edge in a staggered
 * cascade shortly after mount, then the whole overlay fades out once the
 * capabilities cube stage comes into view (and fades back in scrolling up).
 * Purely ornamental — fixed, pointer-events:none, aria-hidden, and hidden
 * outright on small screens. Reduced motion renders the grid already drawn.
 */

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/device";

const COLUMN_COUNT = 12;
const CUBE_TRIGGER = ".about-page .ab-cube-track";

export default function GridOverlay() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;

      const columns = gsap.utils.toArray<HTMLElement>(
        el.querySelectorAll(".ab-grid-column")
      );
      if (!columns.length) return;

      if (prefersReducedMotion()) {
        gsap.set(columns, { opacity: 1, scaleY: 1, willChange: "auto" });
        return;
      }

      gsap.set(columns, { opacity: 0, scaleY: 0, transformOrigin: "top" });
      gsap.to(columns, {
        opacity: 1,
        scaleY: 1,
        duration: 1.2,
        stagger: 0.08,
        ease: "power2.out",
        delay: 1.0,
        onComplete: () => gsap.set(columns, { willChange: "auto" }),
      });

      // The cube section is owned by a sibling component and may not exist yet
      // (or at all) — only wire the fade when it is actually in the document.
      const cube = document.querySelector(CUBE_TRIGGER);
      if (!cube) return;

      ScrollTrigger.create({
        trigger: cube,
        start: "top bottom",
        onEnter: () => gsap.to(el, { autoAlpha: 0, duration: 0.4 }),
        onLeaveBack: () => gsap.to(el, { autoAlpha: 1, duration: 0.4 }),
      });
    },
    { scope: root }
  );

  return (
    <div className="ab-grid-overlay" ref={root} aria-hidden="true">
      <div className="ab-grid-inner">
        {Array.from({ length: COLUMN_COUNT }, (_, i) => (
          <div className="ab-grid-column" key={i} />
        ))}
      </div>
    </div>
  );
}
