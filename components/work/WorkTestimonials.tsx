"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useSectionNear } from "@/hooks/useSectionNear";
import { prefersReducedMotion } from "@/lib/device";

/**
 * Client words, text only — no headshots, by request.
 *
 * These are quoted verbatim as supplied. If a name here is ever challenged,
 * the quote has to come out: an unverifiable testimonial is worth less than
 * no testimonial, and on ad traffic it is the first thing a sceptic checks.
 */
const QUOTES = [
  {
    q: "They worked with a structured delivery plan and were responsive throughout the process.",
    by: "Trac Stephenson",
  },
  {
    q: "Web Guild was constantly making great suggestions on how to improve the project from a business and process perspective which made the project even better and brought us closer to our goals.",
    by: "Mila Banerjee",
  },
  {
    q: "They are technology partners and feel like close team members. We could engage with everyone on the team which allowed for fast and efficient interactions.",
    by: "Tosan Lee",
  },
  {
    q: "The team not only guided us through every stage of the project but also ensured timely delivery and continuously looked for the best possible solutions.",
    by: "Auston Anon",
  },
  {
    q: "American Web Guild has delivered an MVP that meets the changing needs of AI users. The team has completed the project on time and within budget. They have been highly responsive to the client's needs.",
    by: "Michael Sarlitt",
  },
  {
    q: "We appreciated their very good communication and strong ownership of their work. It's difficult to find a professional and reliable development partner these days, and American Web Guild has delivered.",
    by: "Henry Richard",
  },
];

export default function WorkTestimonials() {
  const rootRef = useRef<HTMLElement>(null);

  useSectionNear(rootRef, () => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".wk-quote",
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.07,
          scrollTrigger: { trigger: root, start: "top 80%", once: true },
        }
      );
    }, root);

    return () => ctx.revert();
  });

  return (
    <section className="wk-quotes" ref={rootRef} aria-label="Client feedback">
      <p className="wk-quotes__eyebrow">( What Clients Say )</p>
      <h2 className="wk-quotes__heading">
        The same three words keep coming back: responsive, on time, on budget.
      </h2>

      <div className="wk-quotes__grid">
        {QUOTES.map((t) => (
          <figure className="wk-quote" key={t.by}>
            <blockquote className="wk-quote__text">
              &ldquo;{t.q}&rdquo;
            </blockquote>
            <figcaption className="wk-quote__by">{t.by}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
