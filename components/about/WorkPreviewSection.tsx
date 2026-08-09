"use client";

/**
 * About — work preview.
 *
 * Four cards on an asymmetric 12-column grid. Choreography per card:
 *   1. the `.ab-lens` wipes open bottom-up (clip-path inset 100% -> 0) once its
 *      top passes 88% of the viewport, reversing when scrolled back out;
 *   2. the image inside scrubs from scale 1.18 to 1 across the card's full
 *      travel through the viewport, giving a slow settle rather than parallax;
 *   3. the caption block fades and lifts 24px into place just after the wipe.
 *
 * The clip itself only exists while `html.ab-anim-ready` is set — JS adds that
 * class after GSAP is confirmed running, and two watchdogs (1.5s / 4s) force
 * open any card that is already in view but still shut, so a scripting failure
 * can never hide content.
 *
 * Card 1 carries an overlaid years counter (one-shot, rAF-driven) and every
 * card gets a difference-blend pointer dot on fine pointers only.
 *
 * Reduced motion: no gate class, no dots, counter jumps to its final value.
 */

import { useRef, type CSSProperties } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useSectionNear } from "@/hooks/useSectionNear";
import { isCoarsePointer, prefersReducedMotion } from "@/lib/device";
import { attachBlendDot } from "@/components/about/blend-dot";
import { countUp } from "@/components/about/count-up";
import {
  WORK_CARDS,
  WORK_HEADER,
  YEARS_COUNTER,
} from "@/components/about/about-data";

/** Intrinsic pixel sizes of the source art — kept explicit so document height
 *  is stable before the images decode. */
const IMG_DIMS: { w: number; h: number }[] = [
  { w: 800, h: 800 },
  { w: 1000, h: 580 },
  { w: 1000, h: 581 },
  { w: 525, h: 497 },
];

const GATE_CLASS = "ab-anim-ready";
const WATCHDOG_MS = [1500, 4000];

export default function WorkPreviewSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useSectionNear(
    sectionRef,
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const numEl = section.querySelector<HTMLElement>(".ab-years__num");

      // Reduced motion: final state only — no gate class means no clip at all.
      if (prefersReducedMotion()) {
        if (numEl) numEl.textContent = String(YEARS_COUNTER.target);
        return () => {
          if (numEl) numEl.textContent = "0";
        };
      }

      const timeouts: number[] = [];
      const detachers: (() => void)[] = [];
      const wipes: { card: HTMLElement; tween: gsap.core.Tween }[] = [];
      let cancelCount: (() => void) | null = null;

      const ctx = gsap.context(() => {
        document.documentElement.classList.add(GATE_CLASS);

        const cards = gsap.utils.toArray<HTMLElement>(".ab-work-card", section);

        cards.forEach((card) => {
          const lens = card.querySelector<HTMLElement>(".ab-lens");
          const img = card.querySelector<HTMLElement>(".ab-lens img");
          const info = card.querySelector<HTMLElement>(".ab-card-info");

          if (lens) {
            const tween = gsap.fromTo(
              lens,
              { clipPath: "inset(100% 0% 0% 0%)" },
              {
                clipPath: "inset(0% 0% 0% 0%)",
                duration: 0.7,
                ease: "expo.out",
                scrollTrigger: {
                  trigger: card,
                  start: "top 88%",
                  toggleActions: "play none none reverse",
                },
              }
            );
            wipes.push({ card, tween });
          }

          if (img) {
            gsap.fromTo(
              img,
              { scale: 1.18 },
              {
                scale: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: card,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: 1.2,
                },
              }
            );
          }

          if (info) {
            gsap.fromTo(
              info,
              { autoAlpha: 0, y: 24 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.5,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: card,
                  start: "top 82%",
                  toggleActions: "play none none reverse",
                },
              }
            );
          }

          if (!isCoarsePointer()) detachers.push(attachBlendDot(card));
        });

        // Years counter — one shot when its card arrives.
        const yearsCard = cards.find((c) => c.querySelector(".ab-years"));
        if (numEl && yearsCard) {
          ScrollTrigger.create({
            trigger: yearsCard,
            start: "top 80%",
            once: true,
            onEnter: () => {
              cancelCount = countUp(numEl, YEARS_COUNTER.target, 2500);
            },
          });
        }
      }, section);

      // Watchdogs: an in-view card must never stay wiped shut.
      const forceUnclip = () => {
        wipes.forEach(({ card, tween }) => {
          const r = card.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0 && tween.progress() === 0) {
            tween.progress(1);
          }
        });
      };
      WATCHDOG_MS.forEach((ms) =>
        timeouts.push(window.setTimeout(forceUnclip, ms))
      );

      const raf = requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => {
        cancelAnimationFrame(raf);
        timeouts.forEach((t) => clearTimeout(t));
        cancelCount?.();
        detachers.forEach((d) => d());
        document.documentElement.classList.remove(GATE_CLASS);
        ctx.revert();
      };
    },
    { rootMargin: 1800 }
  );

  return (
    <section className="ab-work" ref={sectionRef}>
      <div className="ab-work-header">
        <div className="ab-work-header-meta">
          <span className="ab-work-tag">{WORK_HEADER.tag}</span>
          <p className="ab-work-copy">{WORK_HEADER.copy}</p>
        </div>
      </div>

      <div className="ab-work-grid">
        {WORK_CARDS.map((card, i) => {
          const dims = IMG_DIMS[i] ?? { w: 1000, h: 700 };
          return (
            <article
              className="ab-work-card"
              key={card.img}
              style={
                {
                  "--ab-col": card.column,
                  "--ab-row": card.row,
                  "--ab-lens": `${card.lens}px`,
                  "--ab-offset": `${card.offset ?? 0}rem`,
                } as CSSProperties
              }
            >
              <div className="ab-lens">
                <img
                  src={card.img}
                  alt={card.title}
                  width={dims.w}
                  height={dims.h}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
                {i === 0 && (
                  <div className="ab-years">
                    <span className="ab-years__label">
                      {YEARS_COUNTER.above}
                    </span>
                    <span className="ab-years__line">
                      <span className="ab-years__num">0</span>
                      &thinsp;{YEARS_COUNTER.unit}
                    </span>
                    <span className="ab-years__label">
                      {YEARS_COUNTER.below}
                    </span>
                  </div>
                )}
              </div>

              <div className="ab-card-info">
                <span className="ab-card-meta">{card.meta}</span>
                <h3 className="ab-card-title">{card.title}</h3>
                <p className="ab-card-sub">{card.subtitle}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
