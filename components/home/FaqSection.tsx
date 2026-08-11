"use client";

import { useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useSectionNear } from "@/hooks/useSectionNear";
import { prefersReducedMotion } from "@/lib/device";
import { initReveals } from "@/components/shared/reveal";

// Q&As mirrored verbatim from the reference site (webdesignmechanic.com).
const FAQS = [
  {
    q: "Should I go for custom web design?",
    a: "Templates are fun, but when you need to build a website that's built for your needs and feels yours, then you need to have custom web design.",
  },
  {
    q: "How long does it take to build a website?",
    a: "Every project's a bit different. We keep things moving while making sure everything's spot-on before launch.",
  },
  {
    q: "Will my website work on phones?",
    a: "Definitely! Every site we build is mobile-friendly, so it'll look great and work smoothly on phones, tablets, laptops, and wherever people visit from.",
  },
  {
    q: "Do you think about SEO when designing a site?",
    a: "For sure. We keep SEO in mind from the start, so your site isn't just pretty, it's built to show up and get noticed.",
  },
  {
    q: "Can I make changes after launch?",
    a: "Yes! You'll be able to make updates yourself, and if you'd rather not, we're always here to help with tweaks or ongoing support.",
  },
] as const;

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
