"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useSectionNear } from "@/hooks/useSectionNear";
import { prefersReducedMotion } from "@/lib/device";
import { MARQUEE_WORD, MARQUEE_REPEAT } from "./contact-data";

const SPIN_SECONDS = 3;

/**
 * Full-bleed "LET'S TALK" band. Two independent triggers: the track scrubs
 * against whole-document scroll, while the band's own clip reveal fires when
 * it comes into view — they run on different clocks by design.
 */
export default function ContactMarquee() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useSectionNear(
    sectionRef,
    () => {
      const section = sectionRef.current;
      if (!section) return;
      const track = section.querySelector<HTMLElement>(".ct-marquee__track");
      if (!track) return;

      if (prefersReducedMotion()) {
        gsap.set(section, { clipPath: "inset(0% 0 0 0)" });
        return;
      }

      const ctx = gsap.context(() => {
        gsap.to(track, {
          x: "-50%",
          ease: "none",
          scrollTrigger: {
            trigger: document.documentElement,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
          },
        });

        gsap.to(section, {
          clipPath: "inset(0% 0 0 0)",
          duration: 1,
          ease: "power3.inOut",
          scrollTrigger: { trigger: section, start: "top 92%" },
        });
      }, section);

      const raf = requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => {
        cancelAnimationFrame(raf);
        ctx.revert();
      };
    },
    { rootMargin: 1200 }
  );

  // Duplicated once so translating the track by -50% loops seamlessly.
  const items = Array.from({ length: MARQUEE_REPEAT * 2 }, (_, i) => i);

  return (
    <div className="ct-marquee" ref={sectionRef} aria-hidden="true">
      <div className="ct-marquee__track">
        {items.map((i) => (
          <span className="ct-marquee__unit" key={i}>
            <span className="ct-marquee__item">{MARQUEE_WORD}</span>
            <span className="ct-marquee__sep">
              <img
                src="/images/lab/hourglass.svg"
                alt=""
                width={40}
                height={51}
                style={{
                  // negative delays desynchronise the row
                  animationDelay: `${
                    -(i % MARQUEE_REPEAT) * (SPIN_SECONDS / MARQUEE_REPEAT)
                  }s`,
                }}
              />
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
