"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { getLenis } from "@/lib/lenis";
import { prefersReducedMotion } from "@/lib/device";
import { WORK_PROJECTS } from "./work-data";

/**
 * The project archive: a 2-column grid of clickable cards. Clicking a card
 * opens a fullscreen lightbox with the project's full-length page screenshot
 * in its own scroll container (`data-lenis-prevent` keeps Lenis out of it;
 * page scroll is stopped while open).
 *
 * Desktop hover choreography (fine pointers >1024px only): cover zooms
 * slightly, a backdrop-blur veil and a color-blend desaturation layer fade
 * in, and a caption (index + subtitle) slides up from the bottom edge.
 */
export default function WorkGrid() {
  const rootRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);
  const [active, setActive] = useState<number | null>(null);
  const [hintGone, setHintGone] = useState(false);

  // ---- hover choreography (unchanged) ----
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

  // ---- lightbox ----
  const open = (i: number) => {
    closingRef.current = false;
    setHintGone(false);
    setActive(i);
  };

  const close = useCallback(() => {
    if (closingRef.current) return;
    const overlay = overlayRef.current;
    const finish = () => {
      closingRef.current = false;
      setActive(null);
    };
    if (!overlay || prefersReducedMotion()) {
      finish();
      return;
    }
    closingRef.current = true;
    gsap.to(overlay, {
      autoAlpha: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: finish,
    });
  }, []);

  // open/close side effects: page-scroll lock + grain hide + entry animation
  useEffect(() => {
    if (active === null) return;

    getLenis()?.stop();
    document.documentElement.classList.add("wk-lb-open");

    const overlay = overlayRef.current;
    const panel = panelRef.current;
    if (overlay && panel && !prefersReducedMotion()) {
      gsap.fromTo(
        overlay,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.35, ease: "power2.out" }
      );
      gsap.fromTo(
        panel,
        { y: 60, clipPath: "inset(10% 6% 10% 6% round 14px)" },
        {
          y: 0,
          clipPath: "inset(0% 0% 0% 0% round 14px)",
          duration: 0.6,
          ease: "expo.out",
          delay: 0.05,
          clearProps: "clipPath",
        }
      );
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("wk-lb-open");
      getLenis()?.start();
    };
  }, [active, close]);

  const project = active !== null ? WORK_PROJECTS[active] : null;

  return (
    <section className="wk-grid" aria-label="Selected works" ref={rootRef}>
      {WORK_PROJECTS.map((p, i) => (
        <article
          className="wk-card"
          key={p.index}
          data-cursor="VIEW"
          role="button"
          tabIndex={0}
          aria-label={`View ${p.title} — ${p.subtitle}`}
          onClick={() => open(i)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              open(i);
            }
          }}
        >
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

      {project && (
        <div
          className="wk-lb"
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${project.title} — full preview`}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="wk-lb__panel" ref={panelRef}>
            <div className="wk-lb__bar">
              <span className="wk-lb__meta">
                <span className="wk-lb__index">{project.index}</span>
                <span className="wk-lb__title">{project.title}</span>
              </span>
              <button
                type="button"
                className="wk-lb__close"
                aria-label="Close preview"
                data-cursor="CLOSE"
                onClick={close}
              >
                ✕
              </button>
            </div>
            <div
              className="wk-lb__body"
              data-lenis-prevent=""
              onScroll={() => !hintGone && setHintGone(true)}
            >
              <img
                className="wk-lb__img"
                src={project.full}
                alt={`${project.title} — full page design`}
                width={project.fullWidth}
                height={project.fullHeight}
                decoding="async"
              />
            </div>
            <span
              className={`wk-lb__hint${hintGone ? " is-gone" : ""}`}
              aria-hidden="true"
            >
              Scroll to explore ↓
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
