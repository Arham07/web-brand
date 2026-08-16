"use client";

// Core-capabilities section: full-viewport black stage hosting the WebGL
// ring gallery, with a centered DOM overlay whose texts reveal via the
// CSS-transition .reveal-wrap/.reveal-inner mechanic (JS only writes the
// inline transform; per-element transition-delays choreograph the stagger).

import { useRef, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { easeInOutCubic } from "@/lib/ease";
import { useSectionNear } from "@/hooks/useSectionNear";
import { hydrateImagesIn, hydrateVideosIn } from "@/lib/lazy-media";

const RingGallery = dynamic(() => import("./RingGallery"), { ssr: false });

const SERVICE_TAGS = [
  "( Web Visual Aesthetics )",
  "( High-End Commercial Visuals )",
  "( UX & Interface )",
  "( AI Image & Motion )",
];

type TitleState = "hidden" | "visible" | "exiting";
const TITLE_Y: Record<TitleState, string> = {
  hidden: "translateY(110%)",
  visible: "translateY(0%)",
  exiting: "translateY(-110%)",
};

function Reveal({ children }: { children: ReactNode }) {
  return (
    <span className="reveal-wrap">
      <span className="reveal-inner">{children}</span>
    </span>
  );
}

export default function CcapSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useSectionNear(
    sectionRef,
    () => {
      const section = sectionRef.current;
      if (!section || !section.isConnected) return;

      // The global lazy-media engine only scans once at app mount, so a
      // section remounted by a client-side navigation would never load its
      // deferred video/images without this.
      hydrateVideosIn(section);
      hydrateImagesIn(section);

      const titleInners = Array.from(
        section.querySelectorAll<HTMLElement>(
          ".giant-title .reveal-inner, .sub-title .reveal-inner"
        )
      );
      const staticInners = Array.from(
        section.querySelectorAll<HTMLElement>(
          ".top-nav .reveal-inner, .service-label .reveal-inner, .service-tags .reveal-inner"
        )
      );
      const mediaBox = section.querySelector<HTMLElement>(".center-video-box");
      const overlay = section.querySelector<HTMLElement>("#ccap-exit-overlay");

      let revealed = false;
      const revealCoreContent = () => {
        if (revealed) return;
        revealed = true;
        staticInners.forEach((el) => {
          el.style.transform = "translateY(0%)";
        });
        if (mediaBox) mediaBox.style.clipPath = "inset(0% 0px 0px 0px)";
      };

      const setTitleState = (state: TitleState) => {
        titleInners.forEach((el) => {
          el.style.transform = TITLE_Y[state];
        });
      };

      const triggers: ScrollTrigger[] = [];

      // --- reveal state machine ---
      // The state is resolved from the rect, never from which callback fired,
      // and both triggers end at "max" so neither can be stepped over.
      // ScrollTrigger runs with limitCallbacks: true (lib/gsap.ts), which
      // drops onEnter/onLeave entirely when one tick moves the scroll from
      // before `start` to past `end` — routine on a phone fling, and it left
      // the titles stuck at translateY(110%) until some later tick happened
      // to land inside the range. That is a reveal that never plays while you
      // scroll and then plays when you stop.
      const resolveState = () => {
        const rect = section.getBoundingClientRect();
        const vh = window.innerHeight;
        if (rect.bottom < vh * 0.45) {
          revealCoreContent();
          setTitleState("exiting");
        } else if (rect.top <= vh * 0.8) {
          revealCoreContent();
          setTitleState("visible");
        } else {
          setTitleState("hidden");
        }
      };

      for (const start of ["top 80%", "bottom 45%"]) {
        triggers.push(
          ScrollTrigger.create({
            trigger: section,
            start,
            end: "max",
            onEnter: resolveState,
            onLeaveBack: resolveState,
          })
        );
      }

      // initial state resolution (deep link, restored scroll position)
      resolveState();

      // --- exit glue: the overlay darkens as the next section slides over
      // (ease-in-out-cubic applied to the scrubbed progress) ---
      //
      // A quickSetter, not gsap.set: a set() inside a scrubbed onUpdate
      // re-resolves the target and rebuilds a plugin chain every frame.
      //
      // NEVER hand quickSetter a multi-value alias — `scale`, `autoAlpha` or
      // `transform`. gsap-core substitutes the alias without checking for a
      // comma (gsap-core.js:4165), defeating CSSPlugin's own guard
      // (CSSPlugin.js:1565), and the name reaches setAttribute() as the
      // literal "scaleX,scaleY" — which throws InvalidCharacterError in every
      // engine. This used to also shrink `main` 4.6% and lift it 24px via
      // quickSetter(mainEl, "scale"); that threw on EVERY frame of this
      // glue's one-viewport range, so the shrink and the lift never rendered
      // at all, and the throw escaped through Lenis's emit and ScrollTrigger's
      // update loop — neither of which catches — taking out every scroll
      // listener and every trigger queued behind this one, on every one of
      // those frames. Exactly the jitter reported at the SECTORS->ARCHIVE
      // boundary. The overlay fade is what has actually been rendering all
      // along, so it is what the section keeps. Use "scaleX"/"scaleY" if the
      // shrink is ever wanted back.
      const setOverlayOpacity = overlay
        ? gsap.quickSetter(overlay, "opacity")
        : null;
      const proxy = { p: 0 };
      const glue = gsap.to(proxy, {
        p: 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "bottom bottom",
          end: "bottom top",
          scrub: 0.35,
        },
        onUpdate: () => {
          setOverlayOpacity?.(0.74 * easeInOutCubic(proxy.p));
        },
      });
      if (glue.scrollTrigger) triggers.push(glue.scrollTrigger);

      return () => {
        glue.kill();
        triggers.forEach((t) => t.kill());
        titleInners.forEach((el) => {
          el.style.transform = "";
        });
        staticInners.forEach((el) => {
          el.style.transform = "";
        });
        if (mediaBox) mediaBox.style.clipPath = "";
        if (overlay) gsap.set(overlay, { clearProps: "opacity" });
      };
    },
    { rootMargin: 2200 }
  );

  return (
    <section className="ccap-section" id="core-capabilities" ref={sectionRef}>
      <div className="ring-gallery-sticky">
        <div
          className="ccap-exit-overlay"
          id="ccap-exit-overlay"
          aria-hidden="true"
        />
        <RingGallery />
        <div className="ccap-side-fade ccap-side-fade-left" aria-hidden="true" />
        <div className="ccap-side-fade ccap-side-fade-right" aria-hidden="true" />
        <div className="hero-dom">
          <main>
            <div className="giant-title">
              <Reveal>THE SECTORS</Reveal>
            </div>
            <div className="sub-title">
              <Reveal>DEFINING THE CORE DNA OF</Reveal>
              <br />
              <Reveal>BRAND AESTHETICS</Reveal>
            </div>
            <div className="top-nav">
              <div className="nav-left">
                <Reveal>14Y_VISUAL_MASTERY</Reveal>
              </div>
              <div className="nav-center">
                <Reveal>400+_DEPLOYED_WORKS</Reveal>
              </div>
              <div className="nav-right">
                <Reveal>ESTABLISHED_2026</Reveal>
              </div>
            </div>
            <div className="media-gallery">
              <div className="media-track">
                <div className="center-divider">
                  <div className="center-video-box">
                    {/* proximity-tier: a 120px accent video must never race
                        the hero for boot bandwidth */}
                    <video
                      data-lazy-video=""
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="none"
                      aria-hidden="true"
                    >
                      <source data-src="/images/home/star.mp4" type="video/mp4" />
                    </video>
                  </div>
                  <div className="service-label reveal-wrap text1vw">
                    <h2 className="reveal-inner">
                      Cross-Disciplinary Visuals & Digital Integration
                    </h2>
                  </div>
                </div>
              </div>
            </div>
            <div className="service-tags">
              {SERVICE_TAGS.map((tag) => (
                <span className="reveal-wrap" key={tag}>
                  <h3 className="reveal-inner">{tag}</h3>
                </span>
              ))}
            </div>
          </main>
        </div>
      </div>
    </section>
  );
}
