"use client";

/**
 * About hero.
 *
 * Choreography
 * ------------
 * A single 100vh stage. Two CSS-keyframe marquee rows drift in opposite
 * directions behind a hairline divider carrying the page H1 and three meta
 * labels.
 *
 * On load an intro timeline (gated on the global loader) slides the marquee
 * rows in from either side, lifts the masked divider labels and wipes the rule
 * out from its left edge. Nothing is pinned and nothing scrubs.
 *
 * The hero used to carry a video that scrubbed from a small inset box out to a
 * full-bleed frame across a 200vh track. The video is gone, so the track is
 * back to one screen: a sticky stage with nothing left to scrub is just 100vh
 * of dead scroll before the first real section.
 */

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/device";
import { useScrollTriggerSettle } from "@/hooks/useScrollTriggerSettle";
import { MARQUEE_ROW_A, MARQUEE_ROW_B, DIVIDER_LABELS } from "./about-data";

const SEPARATOR = "/images/about/box/s1.svg";
const LOADER_FAILSAFE_MS = 3200;

function MarqueeStrip({ items, hidden }: { items: string[]; hidden?: boolean }) {
  return (
    <span className="ab-marquee-strip" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <span className="ab-marquee-cell" key={item}>
          <span className="ab-marquee-item">{item}</span>
          <img
            className="ab-marquee-sep"
            src={SEPARATOR}
            alt=""
            width={28}
            height={28}
            aria-hidden="true"
          />
        </span>
      ))}
    </span>
  );
}

export default function AboutHero() {
  const root = useRef<HTMLElement>(null);

  // Page-wide: the sections below this one still measure their own triggers.
  useScrollTriggerSettle(root);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;

      const q = gsap.utils.selector(el);

      /* -------------------------------------------------- reduced motion */
      if (prefersReducedMotion()) return;

      /* ------------------------------------------------------- intro set */
      gsap.set(q(".ab-marquee-row--a"), { x: "-110%" });
      gsap.set(q(".ab-marquee-row--b"), { x: "110%" });
      gsap.set(q(".ab-divider__inner"), { yPercent: 110 });
      gsap.set(q(".ab-divider__line"), { scaleX: 0 });

      const tl = gsap.timeline({ paused: true, defaults: { ease: "power4.out" } });

      tl.to(
        q(".ab-marquee-row"),
        { x: "0%", duration: 1.4, ease: "power3.out" },
        0.1
      )
        .to(
          q(".ab-divider__inner"),
          { yPercent: 0, duration: 1.2, stagger: 0.1 },
          0.2
        )
        .to(
          q(".ab-divider__line"),
          { scaleX: 1, duration: 1.5, ease: "expo.inOut" },
          0.4
        );

      /* ---------------------------------------------------- loader gating */
      let started = false;
      const play = () => {
        if (started) return;
        started = true;
        tl.play();
      };

      if (
        (window as unknown as { _nudotLoaderDismissed?: boolean })
          ._nudotLoaderDismissed === true
      ) {
        play();
      } else if (document.getElementById("nudot-loader")) {
        window.addEventListener("nudot:hero-reveal", play, { once: true });
      } else {
        play();
      }
      const failsafe = window.setTimeout(play, LOADER_FAILSAFE_MS);

      return () => {
        window.removeEventListener("nudot:hero-reveal", play);
        window.clearTimeout(failsafe);
      };
    },
    { scope: root }
  );

  return (
    <section className="ab-hero-track" ref={root}>
      <div className="ab-hero-viewport">
        <div className="ab-marquee-rows" aria-hidden="true">
          <div className="ab-marquee-row ab-marquee-row--a">
            <div className="ab-marquee-lane ab-marquee-lane--l">
              <MarqueeStrip items={MARQUEE_ROW_A} />
              <MarqueeStrip items={MARQUEE_ROW_A} hidden />
            </div>
          </div>
          <div className="ab-marquee-row ab-marquee-row--b">
            <div className="ab-marquee-lane ab-marquee-lane--r">
              <MarqueeStrip items={MARQUEE_ROW_B} />
              <MarqueeStrip items={MARQUEE_ROW_B} hidden />
            </div>
          </div>
        </div>

        <div className="ab-divider">
          <div className="ab-divider__labels">
            {DIVIDER_LABELS.map((label) => (
              <span
                className={`ab-divider__cell ab-divider__cell--${label.align}`}
                key={label.text}
              >
                <span className="ab-divider__mask">
                  {label.heading ? (
                    <h1 className="ab-divider__inner ab-divider__inner--head">
                      {label.text}
                    </h1>
                  ) : (
                    <span className="ab-divider__inner">{label.text}</span>
                  )}
                </span>
              </span>
            ))}
          </div>
          <div className="ab-divider__line" />
        </div>
      </div>
    </section>
  );
}
