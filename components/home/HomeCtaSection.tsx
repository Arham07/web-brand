"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useSectionNear } from "@/hooks/useSectionNear";
import { prefersReducedMotion } from "@/lib/device";
import { initReveals } from "@/components/shared/reveal";

/**
 * Closing CTA statement — heading/sub mirrored from the reference site; the
 * form lives on /contact, so this is a statement + gradient button (the
 * floating CTA auto-hides while this section is on screen).
 */
export default function HomeCtaSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useSectionNear(sectionRef, () => {
    const section = sectionRef.current;
    if (!section) return;
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const triggers = initReveals(section);
      return () => triggers.forEach((t) => t.kill());
    }, section);

    return () => ctx.revert();
  });

  return (
    <section className="hcta" ref={sectionRef} aria-label="Start a project">
      <h2 className="hcta__title">
        <span className="hcta__line" data-reveal="word">
          LOOKING FOR EXPERT
        </span>
        <span className="hcta__line" data-reveal="word">
          WEB DESIGN OR DEVELOPMENT?
        </span>
        <span className="hcta__line grad-text" data-reveal="word">
          LET&apos;S TALK.
        </span>
      </h2>
      <p className="hcta__sub" data-reveal="fade">
        Share a few details about your project and we&apos;ll send you a free,
        no-obligation quote within 24 hours — know exactly what your website
        will cost before you spend a single dollar.
      </p>
      <div className="hcta__actions" data-reveal="fade">
        <a className="hcta__btn" href="/contact" data-cursor="QUOTE">
          Get a Free Quote
          <span aria-hidden="true">&rarr;</span>
        </a>
        <a className="hcta__btn hcta__btn--ghost" href="/pricing" data-cursor="PRICING">
          View Pricing
        </a>
      </div>
    </section>
  );
}
