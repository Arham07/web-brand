"use client";

import { useEffect, useRef } from "react";
import { WORK_HERO } from "./work-data";

/**
 * Work-archive hero — the CSS-transition entry family shared with the
 * contact page: WORK and DESIGN fly apart from centre, the hairline draws
 * outward, then the small type fades in. Armed by a class added after a
 * double rAF so the initial state paints first.
 *
 * Desktop: `position: sticky; top: 0` (CSS) — the opaque project grid
 * scrolls up over it. No GSAP here.
 */
export default function WorkHero() {
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
    <header className="wk-hero" ref={rootRef}>
      <div className="wk-hero__top">
        {/* The lockup is decoration; "WORK" is not what this page is about.
            The <h1> is the sentence in the middle, so the heading a crawler
            and a screen reader read matches what the page actually shows. */}
        <span className="wk-hero__title" aria-hidden="true">
          {WORK_HERO.title}
        </span>
        <div className="wk-hero__center">
          <h1 className="wk-hero__desc">{WORK_HERO.heading}</h1>
        </div>
        <span className="wk-hero__code" aria-hidden="true">
          {WORK_HERO.code}
        </span>
      </div>

      <div className="wk-hero__line" />

      <div className="wk-hero__bottom">
        <p className="wk-hero__meta wk-hero__year">{WORK_HERO.year}</p>
        <p className="wk-hero__meta wk-hero__kicker">{WORK_HERO.kicker}</p>
        <p className="wk-hero__meta wk-hero__tags">{WORK_HERO.tags}</p>
      </div>
    </header>
  );
}
