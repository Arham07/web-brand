"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useSectionNear } from "@/hooks/useSectionNear";
import { isMobileWidth, prefersReducedMotion } from "@/lib/device";
import { initReveals } from "@/components/shared/reveal";
import { hydrateImagesIn, hydrateVideosIn } from "@/lib/lazy-media";

const GIF = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";

// All cards point at the Work listing page — per-project pages don't exist yet.
// Slots 2/3/5/6 reuse the /work archive's own thumbnails so both surfaces show
// the same artwork; slots 1/4 keep their original imagery.
const ITEMS = [
  { href: "/work", img: "01", src: "/images/home/list/01.webp" },
  { href: "/work", img: "02", src: "/images/work/list/aw-01.webp" },
  { href: "/work", img: "03", src: "/images/work/list/aw-03.webp" },
  { href: "/work", img: "04", src: "/images/home/list/04.webp" },
  { href: "/work", img: "05", src: "/images/work/list/aw-04.webp" },
  { href: "/work", img: "06", src: "/images/work/list/aw-05.webp" },
] as const;

const PARALLAX_SPEEDS = [12, 18, 10, 20, 15, 22];

export default function GallerySection() {
  const sectionRef = useRef<HTMLElement>(null);

  useSectionNear(
    sectionRef,
    () => {
      const section = sectionRef.current;
      if (!section) return;

      // The global lazy-media engine only scans once at app mount, so a
      // gallery mounted by a client-side navigation would never load its
      // card images / header video without this.
      hydrateImagesIn(section);
      hydrateVideosIn(section);

      // Reduced motion: leave everything visible/static, no clipping gate.
      if (prefersReducedMotion()) return;

      const timeouts: number[] = [];
      const entryTls: { item: HTMLElement; tl: gsap.core.Timeline }[] = [];

      const ctx = gsap.context(() => {
        // Header masked reveals (label / 3 word lines / sub)
        initReveals(section);

        const grid = section.querySelector<HTMLElement>(".pg-gallery");
        const items = gsap.utils.toArray<HTMLElement>(".pg-item", section);

        // Gate class: clip is only ever applied once GSAP is confirmed running.
        document.documentElement.classList.add("pg-anim-ready");

        items.forEach((item, i) => {
          const wrap = item.querySelector<HTMLElement>(".pg-img-wrap");
          const img = item.querySelector<HTMLElement>(".pg-img-wrap img");
          if (!wrap || !img) return;

          // Entry: bottom-up clip wipe + settle-scale
          const inView = item.getBoundingClientRect().top < window.innerHeight * 0.9;
          if (inView) {
            gsap.set(wrap, { clipPath: "inset(0% 0% 0% 0%)" });
            gsap.set(img, { scale: 0.9 });
          } else {
            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: item,
                start: "top 90%",
                toggleActions: "play none none reverse",
              },
            });
            tl.fromTo(
              wrap,
              { clipPath: "inset(100% 0% 0% 0%)" },
              { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "expo.out" },
              0
            ).fromTo(
              img,
              { scale: 1.3 },
              { scale: 1, duration: 1.0, ease: "power3.out" },
              0
            );
            entryTls.push({ item, tl });
          }

          // Parallax drift (image only)
          const speed = PARALLAX_SPEEDS[i % PARALLAX_SPEEDS.length];
          gsap.fromTo(
            img,
            { yPercent: -speed },
            {
              yPercent: speed,
              ease: "none",
              scrollTrigger: {
                trigger: item,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.2,
              },
            }
          );
        });

        // Header exit — text lifts away as .pg-item-5 finishes (desktop only;
        // on mobile the header is static and long scrolled past).
        if (!isMobileWidth()) {
          const item5 = section.querySelector<HTMLElement>(".pg-item-5");
          const wordInners = section.querySelectorAll<HTMLElement>(
            ".gallery-header-title .reveal-word-inner"
          );
          const label = section.querySelector<HTMLElement>(".gallery-header-label");
          const sub = section.querySelector<HTMLElement>(".gallery-header-sub");
          if (item5) {
            const exitTl = gsap.timeline({
              scrollTrigger: {
                trigger: item5,
                start: "bottom 65%",
                end: "bottom 5%",
                scrub: 1.2,
              },
            });
            if (wordInners.length) {
              exitTl.to(
                wordInners,
                { yPercent: -130, ease: "power2.in", stagger: 0.04 },
                0
              );
            }
            if (label) exitTl.to(label, { autoAlpha: 0, y: -15 }, 0);
            if (sub) exitTl.to(sub, { autoAlpha: 0, y: -15 }, 0.05);
          }
        }

        // Section exit — the whole grid lifts and fades under the next section.
        if (grid) {
          gsap.to(grid, {
            opacity: 0,
            y: -30,
            ease: "power2.in",
            scrollTrigger: {
              trigger: section,
              start: "bottom 55%",
              end: "bottom top",
              scrub: 1.5,
            },
          });
        }
      }, section);

      // Watchdogs: never leave an in-view item clipped shut.
      const forceUnclip = () => {
        entryTls.forEach(({ item, tl }) => {
          const r = item.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0 && tl.progress() === 0) {
            tl.progress(1);
          }
        });
      };
      timeouts.push(window.setTimeout(forceUnclip, 1500));
      timeouts.push(window.setTimeout(forceUnclip, 4000));

      // Let layout settle (pin spacers etc.) then re-measure.
      const raf = requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => {
        cancelAnimationFrame(raf);
        timeouts.forEach((t) => clearTimeout(t));
        document.documentElement.classList.remove("pg-anim-ready");
        ctx.revert();
      };
    },
    { rootMargin: 1800 }
  );

  return (
    <section id="s3-gallery" className="s3-gallery-section" ref={sectionRef}>
      <div className="gallery-header">
        <div className="gallery-header-video" aria-hidden="true">
          <video
            data-lazy-video=""
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            disableRemotePlayback
          >
            <source data-src="/images/wavebg.mp4" type="video/mp4" />
          </video>
        </div>
        <h2 className="gallery-header-label" data-reveal="fade">
          ( Redefining Brand Visual Thinking )
        </h2>
        <div className="gallery-header-title">
          <span className="gh-line" data-reveal="word">
            ARCHIVE OF
          </span>
          <span className="gh-line grad-text" data-reveal="word">
            THE SELECTED WORKS
          </span>
          <span className="gh-line" data-reveal="word">
            BY AMERICAN WEB GUILD
          </span>
        </div>
        <p className="gallery-header-sub text1vw" data-reveal="fade" data-reveal-delay="0.3">
          Where digital visual energy is unleashed
        </p>
      </div>

      <div className="pg-gallery">
        {ITEMS.map((item, i) => (
          <div key={item.img} className={`pg-item pg-item-${i + 1}`}>
            <a
              href={item.href}
              data-cursor="VIEW"
              data-transition-label="Work"
              aria-label="View work"
            />
            <div className="pg-img-wrap">
              <img
                src={GIF}
                data-defer-src={item.src}
                alt={`Work ${item.img}`}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
