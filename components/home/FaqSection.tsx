"use client";

import { useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useSectionNear } from "@/hooks/useSectionNear";
import { prefersReducedMotion } from "@/lib/device";
import { initReveals } from "@/components/shared/reveal";
import { FAQS } from "./faq-data";

/**
 * FAQ accordion — single-open, first item open by default. Answers collapse
 * via the CSS grid-rows 0fr→1fr transition (pricing's pattern); entry is a
 * masked header reveal + a gentle one-time stagger on the items.
 */
export default function FaqSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(0);

  useSectionNear(sectionRef, () => {
    const section = sectionRef.current;
    if (!section) return;
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const triggers = initReveals(section);
      const items = gsap.utils.toArray<HTMLElement>(".fq-item", section);
      const tween = gsap.fromTo(
        items,
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: section, start: "top 78%", once: true },
        }
      );
      return () => {
        triggers.forEach((t) => t.kill());
        tween.scrollTrigger?.kill();
      };
    }, section);

    return () => ctx.revert();
  });

  return (
    <section className="fq-section" ref={sectionRef} aria-label="Frequently asked questions">
      <div className="fq-head">
        <span className="fq-head__label" data-reveal="fade">
          ( Frequently Asked Questions )
        </span>
        <h2 className="fq-head__title">
          <span data-reveal="word">QUESTIONS,</span>{" "}
          <span className="grad-text" data-reveal="word">
            ANSWERED
          </span>
        </h2>
      </div>

      <div className="fq-list">
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div className={`fq-item${isOpen ? " is-open" : ""}`} key={item.q}>
              <button
                type="button"
                className="fq-q"
                aria-expanded={isOpen}
                data-cursor={isOpen ? "CLOSE" : "OPEN"}
                onClick={() => setOpen(isOpen ? -1 : i)}
              >
                <span className="fq-q__index">{String(i + 1).padStart(2, "0")}</span>
                <span className="fq-q__text">{item.q}</span>
                <span className="fq-q__icon" aria-hidden="true">
                  +
                </span>
              </button>
              <div className={`fq-a${isOpen ? " is-open" : ""}`}>
                <div>
                  <p>{item.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
