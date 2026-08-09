"use client";

/**
 * About hero.
 *
 * Choreography
 * ------------
 * A 200vh track (`.ab-hero-track`) holds a sticky 100vh stage. Inside the stage
 * two CSS-keyframe marquee rows drift in opposite directions behind a hairline
 * divider carrying four meta labels, and a video sits on top.
 *
 * On load an intro timeline (gated on the global loader) slides the marquee rows
 * in from either side, lifts the masked divider labels, wipes the rule out from
 * its left edge, pops the video in and fades the two caption blocks up.
 *
 * On scroll the video scrubs from a small inset box — measured live from an
 * invisible placeholder element so the box always tracks the CSS — out to a
 * full-bleed 100vw x 100vh frame. Nothing is pinned: the stickiness is pure CSS,
 * the ScrollTrigger only scrubs.
 *
 * Mobile (<=767px) drops the track to a single screen, un-sticks the stage and
 * skips the scrub entirely; the video just plays in its placeholder box. Reduced
 * motion skips every animation and renders the final, full-bleed state.
 */

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { isMobileLayout, prefersReducedMotion } from "@/lib/device";
import { useScrollTriggerSettle } from "@/hooks/useScrollTriggerSettle";
import {
  MARQUEE_ROW_A,
  MARQUEE_ROW_B,
  DIVIDER_LABELS,
  HERO_CAPTION,
  HERO_BOTTOM,
} from "./about-data";

const SEPARATOR = "/images/about/box/s1.svg";
const HERO_VIDEO = "/images/about/about.mp4";
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

  useScrollTriggerSettle(root);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;

      const q = gsap.utils.selector(el);
      const stage = el.querySelector<HTMLElement>(".ab-hero-viewport");
      const video = el.querySelector<HTMLVideoElement>(".ab-hero-video");
      const box = el.querySelector<HTMLElement>(".ab-hero-placeholder");

      const startVideo = () => {
        video?.play().catch(() => {});
      };

      /* -------------------------------------------------- reduced motion */
      if (prefersReducedMotion()) {
        if (video) {
          gsap.set(video, {
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            opacity: 1,
            scale: 1,
          });
        }
        startVideo();
        return;
      }

      /* ------------------------------------------------------- intro set */
      gsap.set(q(".ab-marquee-row--a"), { x: "-110%" });
      gsap.set(q(".ab-marquee-row--b"), { x: "110%" });
      gsap.set(q(".ab-divider__inner"), { yPercent: 110 });
      gsap.set(q(".ab-divider__line"), { scaleX: 0 });
      gsap.set(q(".ab-hero-video"), { opacity: 0, scale: 0.9 });
      gsap.set(q(".ab-hero-caption, .ab-hero-bottom"), { opacity: 0, y: 15 });

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
        )
        .to(
          q(".ab-hero-video"),
          {
            scale: 1,
            opacity: 1,
            duration: 1.5,
            ease: "power3.out",
            onStart: startVideo,
          },
          0.6
        )
        .to(
          q(".ab-hero-caption, .ab-hero-bottom"),
          { opacity: 1, y: 0, duration: 1.0, stagger: 0.05 },
          0.8
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

      /* ------------------------------------------------------ video scrub */
      if (!isMobileLayout() && stage && video && box) {
        // Live measurement of the placeholder box relative to the stage, so the
        // scrub start always matches whatever the CSS says the small box is.
        const measure = () => {
          const stageRect = stage.getBoundingClientRect();
          const boxRect = box.getBoundingClientRect();
          return {
            top: boxRect.top - stageRect.top,
            left: boxRect.left - stageRect.left,
            width: boxRect.width,
            height: boxRect.height,
          };
        };

        let start = measure();
        const resync = () => {
          start = measure();
        };

        gsap.fromTo(
          video,
          {
            top: () => start.top,
            left: () => start.left,
            width: () => start.width,
            height: () => start.height,
          },
          {
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            ease: "power2.inOut",
            scrollTrigger: {
              trigger: el,
              start: "top top",
              end: "bottom bottom",
              scrub: 1,
              invalidateOnRefresh: true,
              onRefreshInit: resync,
            },
          }
        );
        ScrollTrigger.refresh();
      }

      return () => {
        window.removeEventListener("nudot:hero-reveal", play);
        window.clearTimeout(failsafe);
        if (video) {
          video.pause();
          gsap.set(video, { clearProps: "top,left,width,height" });
        }
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

        <div className="ab-hero-placeholder" aria-hidden="true" />

        <video
          className="ab-hero-video"
          src={HERO_VIDEO}
          muted
          playsInline
          autoPlay
          loop
          preload="metadata"
        />

        <div className="ab-hero-caption">
          {HERO_CAPTION.map((line) => (
            <span className="ab-hero-line" key={line}>
              {line}
            </span>
          ))}
        </div>

        <div className="ab-hero-bottom">
          {HERO_BOTTOM.map((line) => (
            <span className="ab-hero-line" key={line}>
              {line}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
