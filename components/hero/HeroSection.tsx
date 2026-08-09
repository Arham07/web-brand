"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { SLIDES } from "./slides-data";

const HeroSlider = dynamic(() => import("./HeroSlider"), { ssr: false });

const SERVICES_ZH = ["核心策略規劃", "品牌識別", "內容創意", "技術趨勢實踐"];
const SERVICES_EN = [
  "Creative Strategy",
  "Brand Identity",
  "Creative Content",
  "Web Design",
];
const QUICK_LINKS: Array<[string, string]> = [
  ["/about", "About"],
  ["/work", "Work"],
  ["/lab", "Labs"],
  ["/blog", "Blog"],
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
      <div id="webgl-container" />

      <div className="overlay-ui">
        <div className="overlay-top">
          <div className="top-header">
            <div className="huge-text">
              <Mask>STUDIO</Mask>
            </div>
            <div className="small-tag">
              <Mask>( Brand Direction )</Mask>
            </div>
            <div className="huge-text">
              <Mask>DIGITAL</Mask>
            </div>
          </div>
          <div className="grid-4">
            <ul className="services-list">
              {SERVICES_ZH.map((s) => (
                <li key={s}>
                  <Mask>{s}</Mask>
                </li>
              ))}
            </ul>
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
              </nav>
            </div>
            <div className="grid-4 border-top-line">
              <div>
                <Mask>( 網頁互動開發 )</Mask>
              </div>
              <div className="cell-center">
                <Mask>( 動態設計 )</Mask>
              </div>
              <div className="cell-center">
                <h1 className="hero-title">
                  <Mask>高階網頁設計</Mask>
                </h1>
              </div>
              <div className="cell-right">
                <Mask>( 品牌核心識別 )</Mask>
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
                <a href="mailto:hello@nudot.com.tw">hello@nudot.com.tw</a>
                <br />
                04-36033622
                <br />
                核點 Nudot Studio 2026©
              </Mask>
            </div>
            <div className="footer-col col-right footer-links">
              {[
                ["https://www.instagram.com/nudotlabs/", "Instagram"],
                ["https://www.threads.com/@leeyiheng0513", "Threads"],
                [
                  "https://www.facebook.com/profile.php?id=61588727983387",
                  "Facebook",
                ],
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
            <span className="counter-divider">//</span>
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
