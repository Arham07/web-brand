"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useSectionNear } from "@/hooks/useSectionNear";
import { prefersReducedMotion } from "@/lib/device";

/**
 * A-07 (copy doc, Part 5): the five-stage timeline that makes the 14-day
 * claim believable. "14 days" is a claim; a timeline with a free decision
 * point at day three is a mechanism — and mechanisms are what make claims
 * believable.
 *
 * Sits directly under the hero, not at the page bottom: the H1 makes the
 * promise, so the proof of *how* has to be the next thing read — before the
 * work grid and the services cube ask for any more scrolling.
 */
const STAGES = [
  {
    k: "Day 0–1",
    t: "Brief.",
    v: "A short form or a 20-minute call. We ask what you sell, who buys it, and what a lead is worth.",
  },
  {
    k: "Day 2–3",
    t: "Free concept.",
    v: "You get a custom homepage design. No payment yet. This is the decision point — approve, revise, or walk.",
  },
  {
    k: "Day 4–10",
    t: "Build.",
    v: "Remaining pages designed, copy written, everything coded. One shared link, updated live, so you're never waiting on an email.",
  },
  {
    k: "Day 11–14",
    t: "Review & launch.",
    v: "Two rounds of revisions, testing across devices, analytics installed, then live. You get the walkthrough video the same day.",
  },
  {
    k: "Day 15+",
    t: "30 days of unlimited changes,",
    v: "included. Then a care plan if you want one.",
  },
];

export default function AboutProcess() {
  const rootRef = useRef<HTMLElement>(null);

  useSectionNear(rootRef, () => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".ab-stage",
        { autoAlpha: 0, y: 26 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.09,
          scrollTrigger: {
            trigger: ".ab-process",
            start: "top 78%",
            once: true,
          },
        }
      );
    }, root);

    return () => ctx.revert();
  });

  return (
    <section className="ab-outro ab-process" ref={rootRef} aria-label="Our process">
      <p className="ab-outro-eyebrow">( The Process )</p>
      <h2 className="ab-outro-heading">
        Fourteen days, four stages, no mystery.
      </h2>
      <ol className="ab-stages">
        {STAGES.map((s) => (
          <li className="ab-stage" key={s.k}>
            <span className="ab-stage__k">{s.k}</span>
            <span className="ab-stage__body">
              <strong>{s.t}</strong> {s.v}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
