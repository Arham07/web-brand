"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useSectionNear } from "@/hooks/useSectionNear";
import { prefersReducedMotion } from "@/lib/device";

/**
 * A-08 (copy doc, Part 5): the closing CTA the About page never had — it
 * used to simply end on the services cube. The process block that used to
 * live here moved directly under the hero (see AboutProcess).
 */
export default function AboutOutro() {
  const rootRef = useRef<HTMLElement>(null);

  useSectionNear(rootRef, () => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".ab-outro-cta > *",
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: {
            trigger: ".ab-outro-cta",
            start: "top 82%",
            once: true,
          },
        }
      );
    }, root);

    return () => ctx.revert();
  });

  return (
    <section className="ab-outro" ref={rootRef} aria-label="Next step">
      <div className="ab-outro-cta">
        <h2 className="ab-outro-heading ab-outro-heading--cta">
          Still reading? Let&apos;s build yours.
        </h2>
        <p className="ab-outro-sub">
          Send your site and what you sell. Custom homepage concept back in 72
          hours — free, no call required.
        </p>
        <div className="ab-outro-actions">
          <a
            className="ab-outro-btn"
            href="/contact"
            data-cursor="CONCEPT"
            data-transition-label="Contact"
          >
            Get My Free Homepage Concept <span aria-hidden="true">&rarr;</span>
          </a>
          <a
            className="ab-outro-btn ab-outro-btn--ghost"
            href="/work"
            data-cursor="WORK"
            data-transition-label="Work"
          >
            See the work first
          </a>
        </div>
      </div>
    </section>
  );
}
