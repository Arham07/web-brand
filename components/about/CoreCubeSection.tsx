"use client";

// Capabilities cube section.
//
// Choreography: a 480vh track wraps a sticky 100svh stage. A GSAP proxy value
// is scrubbed 0 -> 1 across the track (no pin — the sticky child does the
// pinning, which survives client-side navigation). Each update maps progress
// through rotationAt() and writes ONE transform string to both the main cube
// and the 45px mini cube, so the two can never desync (their differing sizes
// live purely in CSS). The face index derived from the same progress drives
// the left dot strip and the icon nav; the nav uses a single delegated click
// listener that scrolls to the exact stop offset inside the track.
// Behind everything sit decorative CSS-keyframe marquee rows at low opacity.

import { useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { scrollToTarget } from "@/lib/lenis";
import { prefersReducedMotion } from "@/lib/device";
import { useSectionNear } from "@/hooks/useSectionNear";
import {
  CUBE_FACES,
  CUBE_NAV_ICONS,
  CUBE_TICKER_WORDS,
  CUBE_TICKER_CENTER,
} from "./about-data";
import {
  CUBE_STEPS,
  CUBE_STOPS,
  rotationAt,
  activeFaceAt,
  rotationTransform,
} from "./cube-rotations";

const SEPARATORS = [1, 2, 3, 4, 5, 6].map((n) => `/images/about/box/s${n}.svg`);

/** duration / reverse / negative delay per decorative marquee row */
const TICKER_ROWS = [
  { dur: "28s", reverse: false, delay: "-4s" },
  { dur: "38s", reverse: true, delay: "-11s" },
  { dur: "44s", reverse: true, delay: "-19s" },
  { dur: "26s", reverse: false, delay: "-7s" },
];

const MINI_FACES = ["front", "right", "back", "left", "top", "bottom"] as const;

function TickerRow({
  dur,
  reverse,
  delay,
}: {
  dur: string;
  reverse: boolean;
  delay: string;
}) {
  const seq = (
    <>
      {CUBE_TICKER_WORDS.map((word, i) => (
        <span className="ab-cube-ticker-item" key={`${word}-${i}`}>
          <span className="ab-cube-ticker-word">{word}</span>
          <img
            className="ab-cube-ticker-sep"
            src={SEPARATORS[i % SEPARATORS.length]}
            alt=""
            width={18}
            height={18}
            aria-hidden="true"
          />
        </span>
      ))}
    </>
  );
  return (
    <div className="ab-cube-ticker-row" aria-hidden="true">
      <div
        className="ab-cube-ticker-move"
        style={{
          animationDuration: dur,
          animationDelay: delay,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {seq}
        {seq}
      </div>
    </div>
  );
}

export default function CoreCubeSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useSectionNear(
    sectionRef,
    () => {
      const section = sectionRef.current;
      if (!section || !section.isConnected) return;

      const track = section.querySelector<HTMLElement>(".ab-cube-track");
      const cube = section.querySelector<HTMLElement>(".ab-cube");
      const mini = section.querySelector<HTMLElement>(".ab-cube-mini-inner");
      const nav = section.querySelector<HTMLElement>(".ab-cube-nav");
      if (!track || !cube || !mini) return;

      const dots = Array.from(
        section.querySelectorAll<HTMLElement>(".ab-cube-dot")
      );
      const buttons = Array.from(
        section.querySelectorAll<HTMLButtonElement>(".ab-cube-nav-btn")
      );

      const applyRotation = (rx: number, ry: number) => {
        const t = rotationTransform(rx, ry);
        cube.style.transform = t;
        mini.style.transform = t;
      };

      let activeIndex = -1;
      const setActive = (i: number) => {
        if (i === activeIndex) return;
        activeIndex = i;
        dots.forEach((d, n) => d.classList.toggle("is-active", n === i));
        buttons.forEach((b, n) => {
          b.classList.toggle("is-active", n === i);
          b.setAttribute("aria-current", n === i ? "true" : "false");
        });
      };

      const reduced = prefersReducedMotion();
      let rafId = 0;

      const ctx = gsap.context(() => {
        if (reduced) {
          const [rx, ry] = CUBE_STOPS[1];
          applyRotation(rx, ry);
          setActive(1);
          return;
        }

        const proxy = { val: 0 };
        applyRotation(CUBE_STOPS[0][0], CUBE_STOPS[0][1]);
        setActive(0);

        gsap.to(proxy, {
          val: 1,
          ease: "none",
          scrollTrigger: {
            trigger: track,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.9,
            invalidateOnRefresh: true,
            id: "ab-cube",
          },
          onUpdate: () => {
            const { rx, ry } = rotationAt(proxy.val);
            applyRotation(rx, ry);
            setActive(activeFaceAt(proxy.val));
          },
        });

        rafId = requestAnimationFrame(() => ScrollTrigger.refresh());
      }, section);

      const onNavClick = (e: Event) => {
        const target = e.target as HTMLElement | null;
        const btn = target?.closest<HTMLButtonElement>(".ab-cube-nav-btn");
        if (!btn) return;
        const i = buttons.indexOf(btn);
        if (i < 0) return;
        const st = ScrollTrigger.getById("ab-cube");
        if (!st) return;
        const to = st.start + (i / CUBE_STEPS) * (st.end - st.start);
        scrollToTarget(to, { duration: 1.2 });
      };
      nav?.addEventListener("click", onNavClick);

      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        nav?.removeEventListener("click", onNavClick);
        ctx.revert();
        gsap.set([cube, mini], { clearProps: "transform" });
        dots.forEach((d) => d.classList.remove("is-active"));
        buttons.forEach((b) => {
          b.classList.remove("is-active");
          b.removeAttribute("aria-current");
        });
      };
    },
    { rootMargin: 2200 }
  );

  return (
    <section className="ab-cube-section" ref={sectionRef}>
      <div className="ab-cube-track">
        <div className="ab-cube-stage">
          <div className="ab-cube-ticker" aria-hidden="true">
            {TICKER_ROWS.map((row, i) => (
              <TickerRow key={i} {...row} />
            ))}
            <div className="ab-cube-ticker-row ab-cube-ticker-center">
              <div className="ab-cube-ticker-move">
                <span className="ab-cube-ticker-item">
                  {CUBE_TICKER_CENTER}&nbsp;&nbsp;
                </span>
                <span className="ab-cube-ticker-item">
                  {CUBE_TICKER_CENTER}&nbsp;&nbsp;
                </span>
                <span className="ab-cube-ticker-item">
                  {CUBE_TICKER_CENTER}&nbsp;&nbsp;
                </span>
                <span className="ab-cube-ticker-item">
                  {CUBE_TICKER_CENTER}&nbsp;&nbsp;
                </span>
                <span className="ab-cube-ticker-item">
                  {CUBE_TICKER_CENTER}&nbsp;&nbsp;
                </span>
                <span className="ab-cube-ticker-item">
                  {CUBE_TICKER_CENTER}&nbsp;&nbsp;
                </span>
              </div>
            </div>
          </div>

          <div className="ab-cube-dots" aria-hidden="true">
            {CUBE_FACES.map((f) => (
              <span className="ab-cube-dot" key={f.face} />
            ))}
          </div>

          <div className="ab-cube-scene">
            <div className="ab-cube">
              {CUBE_FACES.map((f) => (
                <div
                  className={`ab-cube-face ab-cube-face--${f.face}`}
                  key={f.face}
                  style={
                    { "--ab-face-bg": `url(${f.bg})` } as React.CSSProperties
                  }
                >
                  <div className="ab-cube-face-inner">
                    <img
                      className="ab-cube-face-icon"
                      src={f.icon}
                      alt=""
                      width={96}
                      height={96}
                      aria-hidden="true"
                    />
                    <p className="ab-cube-face-title">{f.title}</p>
                    <p className="ab-cube-face-sub">{f.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ab-cube-caption">
            <div className="ab-cube-mini" aria-hidden="true">
              <div className="ab-cube-mini-inner">
                {MINI_FACES.map((face, i) => (
                  <span
                    className={`ab-cube-mini-face ab-cube-mini-face--${face}`}
                    key={face}
                  >
                    {i + 1}
                  </span>
                ))}
              </div>
            </div>
            <p className="ab-cube-caption-text">SIX SIDES OF ONE PRACTICE</p>
          </div>

          <nav className="ab-cube-nav" aria-label="Capabilities">
            {CUBE_NAV_ICONS.map((item) => (
              <button
                type="button"
                className="ab-cube-nav-btn"
                key={item.label}
                aria-label={item.label}
                data-cursor="SELECT"
              >
                <img
                  src={item.icon}
                  alt=""
                  width={22}
                  height={22}
                  aria-hidden="true"
                />
              </button>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
