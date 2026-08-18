"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useSectionNear } from "@/hooks/useSectionNear";
import { prefersReducedMotion } from "@/lib/device";

/** W-06: the archive used to end on a marquee and a footer — nothing asked. */
export default function WorkCta() {
  const rootRef = useRef<HTMLElement>(null);

  useSectionNear(rootRef, () => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".wk-cta > *",
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: root, start: "top 82%", once: true },
        }
      );
    }, root);

    return () => ctx.revert();
  });

  return (
    <section className="wk-cta-section" ref={rootRef} aria-label="Start a project">
      <div className="wk-cta">
        <h2 className="wk-cta__heading">Yours could be next.</h2>
        <p className="wk-cta__sub">
          Send your site and what you sell. Custom homepage concept back in 72
          hours — free, no call required.
        </p>
        <div className="wk-cta__actions">
          <a
            className="wk-cta__btn"
            href="/contact"
            data-cursor="CONCEPT"
            data-transition-label="Contact"
          >
            Get My Free Homepage Concept <span aria-hidden="true">&rarr;</span>
          </a>
          <a
            className="wk-cta__btn wk-cta__btn--ghost"
            href="/pricing"
            data-cursor="PRICING"
            data-transition-label="Pricing"
          >
            See pricing
          </a>
        </div>
      </div>
    </section>
  );
}
