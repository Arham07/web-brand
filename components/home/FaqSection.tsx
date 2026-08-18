"use client";

import { useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useSectionNear } from "@/hooks/useSectionNear";
import { prefersReducedMotion } from "@/lib/device";
import { initReveals } from "@/components/shared/reveal";

// The eight objections standing between a visitor and a message (copy doc
// H-10). Q3/Q4/Q7 carry the heaviest load for cold Meta traffic — money
// risk, time risk and lock-in risk, in that order.
const FAQS = [
  {
    q: "How much does a custom website cost?",
    a: "Our packages run $349 to $1,299, and most fully custom builds land between $1,500 and $6,000. You get an exact number in writing before anything starts. No hourly billing, no surprises at the end.",
  },
  {
    q: "How long does it take?",
    a: "Fourteen days from kickoff to live for a standard build. E-commerce and larger custom projects run three to six weeks. We put the date in writing, and if we miss it, the build is free.",
  },
  {
    q: "What if I don't like the design?",
    a: "Then you don't pay. You see a full homepage concept before you commit a dollar. If it's not right, we revise it or you walk — no charge, and you keep the concept.",
  },
  {
    q: "Do I have to get on a call?",
    a: "No. You can get your free homepage concept without ever speaking to us. Send the brief, get the design in 72 hours, decide from there.",
  },
  {
    q: "Will it actually rank on Google?",
    a: "We build SEO in at the structure level: clean semantic HTML, fast Core Web Vitals, schema markup, proper headings and metadata, sitemap submitted. Ranking also depends on your market and your content, so we'll tell you honestly what to expect rather than promise page one.",
  },
  {
    q: "Can I edit it myself after launch?",
    a: "Yes. Every site ships on a CMS, and we record a walkthrough video using your site, not a generic tutorial. Or hand it to us on a care plan and never think about it.",
  },
  {
    q: "Who owns the website?",
    a: "You do — code, domain, hosting, content, all transferred at launch. We don't hold anything hostage, and you can leave whenever you like.",
  },
  {
    q: "I already have a site. Is a rebuild overkill?",
    a: "Sometimes. Send it over and we'll audit it free. If the honest answer is “keep it and fix three things,” we'll say so — we'd rather have your trust than a project that shouldn't happen.",
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
