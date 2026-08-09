"use client";

import { useEffect, useRef } from "react";
import { HERO } from "./contact-data";

/**
 * Contact hero — no pin, no GSAP. The entry is pure CSS transitions,
 * armed by adding a class after a double rAF so the initial state paints first.
 */
export default function ContactHero() {
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
    <header className="ct-hero" ref={rootRef}>
      <div className="ct-hero__top">
        <h1 className="ct-hero__title">{HERO.left}</h1>
        <p className="ct-hero__title ct-hero__title--mobile" aria-hidden="true">
          {HERO.mobile}
        </p>
        <div className="ct-hero__center">
          <p className="ct-hero__desc">
            {HERO.desc[0]}
            <br />
            {HERO.desc[1]}
          </p>
        </div>
        <p className="ct-hero__code">{HERO.right}</p>
      </div>

      <div className="ct-hero__line" />

      <div className="ct-hero__bottom">
        <p className="ct-hero__meta">{HERO.year}</p>
        <p className="ct-hero__meta ct-hero__kicker">{HERO.kicker}</p>
        <p className="ct-hero__meta ct-hero__tags">{HERO.tags}</p>
      </div>
    </header>
  );
}
