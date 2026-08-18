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
          SEE YOUR NEW HOMEPAGE
        </span>
        <span className="hcta__line" data-reveal="word">
          BEFORE YOU SPEND
        </span>
        <span className="hcta__line grad-text" data-reveal="word">
          A DOLLAR.
        </span>
      </h2>
      <p className="hcta__sub" data-reveal="fade">
        Send us your current site and one line about what you sell. Within 72
        hours we&apos;ll send back a custom homepage concept designed for your
        business. Free, no call required. Like it? We build the rest in 14
        days. Don&apos;t? Keep the concept anyway.
      </p>
      <div className="hcta__actions" data-reveal="fade">
        <a className="hcta__btn" href="/contact" data-cursor="CONCEPT">
          Get My Free Homepage Concept
          <span aria-hidden="true">&rarr;</span>
        </a>
        <a className="hcta__btn hcta__btn--ghost" href="/pricing" data-cursor="PRICING">
          View Pricing &amp; Packages
        </a>
      </div>
      <p className="hcta__risk" data-reveal="fade">
        Free · 72-hour turnaround · No call required · Yours to keep
      </p>
    </section>
  );
}
