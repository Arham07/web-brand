"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { SLIDES } from "./slides-data";

const HeroSlider = dynamic(() => import("./HeroSlider"), { ssr: false });

const SERVICES_EN = [
  "Creative Strategy",
  "Brand Identity",
  "Creative Content",
  "Web Design",
];
const QUICK_LINKS: Array<[string, string]> = [
  ["/about", "About"],
  ["/work", "Work"],
  ["/pricing", "Pricing"],
  ["/contact", "Contact"],
];

/** wraps content in an overflow-hidden mask for the yPercent reveal */
function Mask({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`reveal-mask ${className ?? ""}`}>
      <span className="reveal-mask__inner">{children}</span>
    </span>
  );
}

export default function HeroSection() {
  const root = useRef<HTMLElement>(null);
  const prewarmRef = useRef<HTMLVideoElement>(null);

  // Prewarm lifecycle (desktop only): the canvas takes a moment to paint
  // its first frame, so a plain <video> holds the backdrop until then and
  // stops on `nudot:hero-gl-ready`.
  //
  // On phones the DOM slide renderer *is* plain media, so a prewarm would
  // just be a second decoder of the same file — the element steps aside
  // immediately and the loader covers the gap.
  useEffect(() => {
    const v = prewarmRef.current;
    if (!v) return;

    if (window.innerWidth <= 767) {
      v.style.display = "none";
      return;
    }

    v.src = "/images/home/slider1/slider01.mp4";
    v.play().catch(() => {});

    const onGlReady = () => {
      v.pause();
      v.removeAttribute("src");
      v.load();
      v.style.display = "none";
    };
    window.addEventListener("nudot:hero-gl-ready", onGlReady, { once: true });
    return () => window.removeEventListener("nudot:hero-gl-ready", onGlReady);
  }, []);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      gsap.set(q(".reveal-mask__inner"), { yPercent: 110 });
      gsap.set(q(".bottom-ui-container"), { autoAlpha: 0, y: 22 });

      const tl = gsap.timeline({ paused: true });
      tl.to(
        q(".top-header .reveal-mask__inner"),
        { yPercent: 0, duration: 0.85, stagger: 0.14, ease: "power4.out" },
        0.4
      )
        .to(
          q(".small-tag .reveal-mask__inner"),
          { yPercent: 0, duration: 0.75, ease: "power3.out" },
          "-=0.9"
        )
        .to(
          q(".services-list .reveal-mask__inner"),
          { yPercent: 0, duration: 0.5, stagger: 0.04, ease: "power3.out" },
          "-=0.65"
        )
        .to(
          q(".grid-section .reveal-mask__inner"),
          { yPercent: 0, duration: 0.42, stagger: 0.05, ease: "power3.out" },
          0.35
        )
        .to(
          q(".bottom-footer .reveal-mask__inner"),
          { yPercent: 0, duration: 0.25, stagger: 0.03, ease: "power3.out" },
          0.3
        )
        .to(
          q(".bottom-ui-container"),
          { autoAlpha: 1, y: 0, duration: 0.55, ease: "power3.out" },
          0.7
        );

      const play = () => tl.play();
      if (
        (window as unknown as { _nudotLoaderDismissed?: boolean })
          ._nudotLoaderDismissed
      ) {
        play();
      } else {
        window.addEventListener("nudot:hero-reveal", play, { once: true });
      }
      return () => window.removeEventListener("nudot:hero-reveal", play);
    },
    { scope: root }
  );

  return (
    <section className="hero-section" ref={root}>
      {/* instant slide-0 backdrop; the poster paints pre-hydration, the
          mount effect picks the width-appropriate variant, and the element
          is stopped + hidden once the WebGL canvas is ready (it used to
          keep decoding the desktop file forever, in parallel with WebGL's
          own copy — on phones that meant two decoders and 1.2MB extra). */}
      <video
        className="hero-prewarm"
        ref={prewarmRef}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/images/home/slider1/slider01.webp"
      />
      <div id="webgl-container" />

      {/* TODO: brand-core video (slider_video02) — parked until the final
          asset is chosen. Styles are commented out in sections/hero.css and
          the assets in scripts/assets-manifest.mjs.
      <div className="brand-core-video-row">
        <div className="brand-core-video">
          <a
            href="https://www.youtube.com/watch?v=MyC-JCaQDtI"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Watch on YouTube"
            data-cursor="VIDEO"
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="none"
              poster="/images/home/slider_video02_thumb.jpg"
              data-lazy-video
            >
              <source data-src="/images/home/slider_video02.mp4" type="video/mp4" />
            </video>
          </a>
        </div>
      </div>
      */}

      <div className="overlay-ui">
        <div className="overlay-top">
          <div className="top-header">
            <div className="huge-text">
              <Mask>STUDIO</Mask>
            </div>
            <div className="small-tag">
              <Mask>( AMERICAN WEB GUILD )</Mask>
            </div>
            <div className="huge-text">
              <Mask>DIGITAL</Mask>
            </div>
          </div>
          <div className="grid-4">
            <div className="col-right">
              <ul className="services-list services-list_en bordered">
                {SERVICES_EN.map((s) => (
                  <li key={s}>
                    <Mask>{s}</Mask>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="overlay-bottom">
          <div className="grid-section">
            <div className="grid-4 hero-quick-links-row">
              <nav
                className="hero-quick-links"
                role="navigation"
                aria-label="Hero quick links"
              >
                {QUICK_LINKS.map(([href, label]) => (
                  <a key={href} href={href} data-transition-label={label}>
                    <Mask>{label}</Mask>
                  </a>
                ))}
                <a className="hero-cta" href="/contact" data-cursor="CONTACT">
                  <Mask>
                    Let&apos;s Talk
                    <span className="hero-cta__arrow" aria-hidden="true">
                      {" "}&rarr;
                    </span>
                  </Mask>
                </a>
              </nav>
            </div>
            <div className="grid-4 border-top-line">
              <div>
                <Mask>( Interactive Web Development )</Mask>
              </div>
              <div className="cell-center">
                <Mask>( Motion Design )</Mask>
              </div>
              <div className="cell-center">
                <h1 className="hero-title">
                  <Mask>High-End Web Design</Mask>
                </h1>
              </div>
              <div className="cell-right">
                <Mask>( Core Brand Identity )</Mask>
              </div>
            </div>
          </div>

          <div className="grid-4 bottom-footer">
            <div className="footer-col">
              <Mask>
                Strategy, Design, and
                <br />
                Development. Lightning-fast, lean,
                <br />
                and sensibly priced.
              </Mask>
            </div>
            <div className="footer-col">
              <Mask>
                {/* TODO: swap in the real inbox once one exists */}
                <a href="mailto:hello@americanwebguild.com">
                  hello@americanwebguild.com
                </a>
                <br />
                04-36033622
                <br />
                American Web Guild 2026©
              </Mask>
            </div>
            <div className="footer-col col-right footer-links">
              {/* TODO: point these at American Web Guild's real profiles —
                  the original hrefs belonged to the reference site's own accounts */}
              {[
                ["#", "Instagram"],
                ["#", "Threads"],
                ["#", "Facebook"],
              ].map(([href, label]) => (
                <Mask key={label}>
                  <a
                    className="hairline-link"
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {label}
                  </a>
                </Mask>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-ui-container">
        <div className="slide-counter">
          <button className="counter-nav prev-slide" aria-label="Previous slide">
            ⟪
          </button>
          <div className="counter-display">
            <span className="current-slide">01</span>
            <span className="counter-divider">{"//"}</span>
            <span className="total-slides">
              {String(SLIDES.length).padStart(2, "0")}
            </span>
          </div>
          <button className="counter-nav next-slide" aria-label="Next slide">
            ⟫
          </button>
        </div>
        <div className="slide-title-container">
          <div className="slide-title">{SLIDES[0].title}</div>
        </div>
        <div className="drag-indicator">
          <div className="lines-container" />
        </div>
        <div className="thumbs-container">
          <div className="slide-thumbs" />
        </div>
      </div>

      <HeroSlider />
    </section>
  );
}
