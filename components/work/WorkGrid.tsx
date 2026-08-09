"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/device";
import { WORK_PROJECTS } from "./work-data";

/**
 * The project archive: a 2-column grid of ten display-only cards.
 * No navigation, no hover videos — per the client's requirement the cards
 * are inert <article>s with a static cover image.
 *
 * Desktop hover choreography (fine pointers >1024px only): cover zooms
 * slightly, a backdrop-blur veil and a color-blend desaturation layer fade
 * in, and a caption (index + subtitle) slides up from the bottom edge.
 */
export default function WorkGrid() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (prefersReducedMotion()) return;
    if (
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
      window.innerWidth <= 1024
    )
      return;

    const detachers: Array<() => void> = [];

    const ctx = gsap.context(() => {
      root.querySelectorAll<HTMLElement>(".wk-card").forEach((card) => {
        const cover = card.querySelector(".wk-cover");
        const blur = card.querySelector(".wk-blur");
        const blend = card.querySelector(".wk-blend");
        const caption = card.querySelector(".wk-card-caption");
        if (!cover || !blur || !blend || !caption) return;

        gsap.set([blur, blend], { opacity: 0 });
        gsap.set(caption, { opacity: 0, y: 30 });

        const enter = () => {
          gsap.killTweensOf([cover, blur, blend, caption]);
          gsap.to(cover, { scale: 1.05, duration: 0.6, ease: "power1.inOut" });
          gsap.to(blur, { opacity: 1, duration: 0.1, ease: "power1.in" });
          gsap.to(blend, { opacity: 1, duration: 0.6, ease: "power1.inOut" });
          gsap.to(caption, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power1.inOut",
            delay: 0.05,
          });
        };
        const leave = () => {
          gsap.killTweensOf([cover, blur, blend, caption]);
          gsap.to(cover, { scale: 1, duration: 0.5, ease: "power1.inOut" });
          gsap.to(blur, { opacity: 0, duration: 0.35, ease: "power1.out" });
          gsap.to(blend, { opacity: 0, duration: 0.45, ease: "power1.inOut" });
          gsap.to(caption, {
            opacity: 0,
            y: 30,
            duration: 0.3,
            ease: "power1.inOut",
          });
        };

        card.addEventListener("mouseenter", enter);
        card.addEventListener("mouseleave", leave);
        detachers.push(() => {
          card.removeEventListener("mouseenter", enter);
          card.removeEventListener("mouseleave", leave);
        });
      });
    }, root);

    return () => {
      detachers.forEach((fn) => fn());
      ctx.revert();
    };
  }, []);

  return (
    <section
      className="wk-grid"
      aria-label="Selected works"
      ref={rootRef}
    >
      {WORK_PROJECTS.map((p, i) => (
        <article className="wk-card" key={p.index} data-cursor="PREVIEW">
          <div className="wk-box">
            <img
              className="wk-cover"
              src={p.img}
              alt={`${p.title} — ${p.subtitle}`}
              width={p.width}
              height={p.height}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : undefined}
              decoding="async"
            />
            <div className="wk-blur" aria-hidden="true" />
            <div className="wk-blend" aria-hidden="true" />
            <div className="wk-card-caption" aria-hidden="true">
              <span className="wk-card-caption__index">{p.index}</span>
              <span className="wk-card-caption__label">{p.subtitle}</span>
            </div>
          </div>

          {/* visible ≤1024px instead of the hover overlay */}
          <div className="wk-card-info">
            <span className="wk-card-info__date">{p.date}</span>
            <span className="wk-card-info__title">{p.title}</span>
            <span className="wk-card-info__subtitle">{p.subtitle}</span>
          </div>
        </article>
      ))}
    </section>
  );
}
