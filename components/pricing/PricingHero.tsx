"use client";

import { useEffect, useRef } from "react";

/**
 * Pricing hero — the CSS-transition entry family shared with the contact
 * and work pages: PRICING and PLANS fly apart from centre, the hairline
 * draws outward, then the small type fades in. Armed by a class added
 * after a double rAF so the initial state paints first. No GSAP.
 */
export default function PricingHero() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => el.classList.add("is-entered"));
    });

    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
      el.classList.remove("is-entered");
    };
  }, []);

  return (
    <header className="pr-hero" ref={rootRef}>
      <div className="pr-hero__top">
        <h1 className="pr-hero__title">PRICING</h1>
        <div className="pr-hero__center">
          <p className="pr-hero__desc">
            BETTER PACKAGES
            <br />
            BETTER PRICES
          </p>
        </div>
        <p className="pr-hero__code">PLANS</p>
      </div>

      <div className="pr-hero__line" />

      <div className="pr-hero__bottom">
        <p className="pr-hero__meta">©2025—2026</p>
        <p className="pr-hero__meta pr-hero__kicker">( Transparent Pricing )</p>
        <p className="pr-hero__meta pr-hero__tags">WEB | LOGO | SEO | SMM</p>
      </div>
    </header>
  );
}
