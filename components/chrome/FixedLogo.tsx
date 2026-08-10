"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

/**
 * Top-state nav: only the centered blend-mode logo.
 * Revealed by GSAP 2.8s after mount (mirrors the original's post-loader
 * timing, which keyed the same 2.8s delay off navigation start).
 * `html.show-nav-scroll` hides it via CSS (see styles/nav.css).
 */
export default function FixedLogo() {
  const logoRef = useRef<HTMLAnchorElement>(null);

  useGSAP(() => {
    const logo = logoRef.current;
    if (!logo) return;

    gsap.fromTo(
      logo,
      { opacity: 0, y: -16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
        delay: 2.8,
        onComplete: () => {
          // hand the visible state back to CSS so `html.show-nav-scroll`
          // can hide it via its own transition (inline styles would win)
          logo.classList.add("is-revealed");
          gsap.set(logo, { clearProps: "all" });
        },
      }
    );
  });

  return (
    <nav id="nav">
      <a
        id="fixed-logo"
        ref={logoRef}
        href="/"
        data-cursor="HOME"
        aria-label="American Web Guild home"
      >
        <img src="/images/pc_logo.svg" alt="American Web Guild" width={45} height={35} />
      </a>
    </nav>
  );
}
