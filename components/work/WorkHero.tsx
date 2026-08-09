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
        <h1 className="wk-hero__title">{WORK_HERO.title}</h1>
        <div className="wk-hero__center">
          <p className="wk-hero__desc">
            {WORK_HERO.desc[0]}
            <br />
            {WORK_HERO.desc[1]}
          </p>
        </div>
        <p className="wk-hero__code">{WORK_HERO.code}</p>
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
