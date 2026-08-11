"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Global floating "Let's Talk" CTA — fixed bottom-right on every page
 * except /contact (where the click would be a same-pathname no-op).
 *
 * A plain anchor: TransitionProvider's capture-phase click listener picks
 * it up and plays the pixel-grid page transition, so no router wiring is
 * needed here. All motion (entry, pulse, hover) lives in styles/cta.css.
 *
 * Suppressed (faded out) while the footer's own CTA band is on screen —
 * two identical gradient buttons stacked in one viewport read as a bug.
 * Timestamp-throttled scroll check, not IO/rAF (both are suppressed in
 * hidden documents — see the project's verification notes).
 */
export default function FloatingCta() {
  const pathname = usePathname();
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let last = 0;
    const check = () => {
      const band = document.querySelector(".footer-cta");
      const overlaps = band
        ? band.getBoundingClientRect().top < window.innerHeight
        : false;
      el.classList.toggle("is-suppressed", overlaps);
    };
    const onScroll = () => {
      const now = Date.now();
      if (now - last < 120) return;
      last = now;
      check();
    };

    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  if (pathname === "/contact") return null;

  return (
    <a
      id="floating-cta"
      href="/contact"
      data-cursor="CONTACT"
      aria-label="Contact us — let's talk"
      ref={ref}
    >
      <span className="floating-cta__label">Let&apos;s Talk</span>
      <svg
        className="floating-cta__arrow"
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M2 7h9M7.5 3.5 11 7l-3.5 3.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}
