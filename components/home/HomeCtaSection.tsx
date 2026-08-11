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
        Get expert help for your website or app from top-rated web designers
        and developers. Let us handle the code work!
      </p>
      <a className="hcta__btn" href="/contact" data-cursor="CONTACT" data-reveal="fade">
        Let&apos;s Talk
        <span aria-hidden="true">&rarr;</span>
      </a>
    </section>
  );
}
