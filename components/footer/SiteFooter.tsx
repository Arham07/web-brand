"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useSectionNear } from "@/hooks/useSectionNear";
import { prefersReducedMotion } from "@/lib/device";
import { hydrateVideosIn } from "@/lib/lazy-media";

const DORMANT_NAV = [
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/lab", label: "Lab" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
] as const;

// TODO: point these at American Web Guild's real profiles once they exist —
// the original hrefs belonged to the reference site's own accounts.
const SOCIALS = [
  { href: "#", text: "Instagram" },
  { href: "#", text: "Threads" },
  { href: "#", text: "Facebook" },
] as const;

/** Wrap `el` in an overflow-hidden .frev-wrap (idempotent) and preset its offset. */
function frevWrap(el: HTMLElement | null, yPercent: number) {
  if (!el) return;
  if (!el.parentElement?.classList.contains("frev-wrap")) {
    const wrap = document.createElement("span");
    wrap.className = "frev-wrap";
    el.parentElement?.insertBefore(wrap, el);
    wrap.appendChild(el);
  }
  gsap.set(el, { yPercent });
}

export default function SiteFooter() {
  const footerRef = useRef<HTMLElement>(null);

  useSectionNear(
    footerRef,
    () => {
      const footer = footerRef.current;
      if (!footer) return;

      // The global lazy-media engine only scans once at app mount, so a footer
      // mounted by a client-side navigation would never load its video.
      hydrateVideosIn(footer);

      // Parallax band background (always applied, even reduced-motion)
      const parallaxBg = footer.querySelector<HTMLElement>("#footer-parallax-bg");
      if (parallaxBg?.dataset.bg) {
        parallaxBg.style.backgroundImage = `url("${parallaxBg.dataset.bg}")`;
      }

      if (prefersReducedMotion()) return;

      const showBridge = window.innerWidth > 1024;

      // Collect targets BEFORE wrapping mutates the tree
      const infoBar = footer.querySelector<HTMLElement>(".footer-info-bar");
      const infoSpans = Array.from(
        footer.querySelectorAll<HTMLElement>(".footer-info-bar > span")
      );
      const navLinks = Array.from(
        footer.querySelectorAll<HTMLElement>(".footer-nav-links > a")
      );
      const email = footer.querySelector<HTMLElement>(".footer-email");
      const phone = footer.querySelector<HTMLElement>(".footer-phone");
      const desc = footer.querySelector<HTMLElement>(".footer-description");
      const address = footer.querySelector<HTMLElement>(".footer-address");
      const videoThumb = footer.querySelector<HTMLElement>(".footer-video-thumb");
      const bridge = footer.querySelector<HTMLElement>("#footer-c-bridge");
      const bridgeGlyph = bridge?.querySelector<HTMLElement>("span") ?? null;
      const parallaxSection = footer.querySelector<HTMLElement>(
        "#footer-parallax-section"
      );

      // --- runtime DOM prep -------------------------------------------------
      // animated hairline replacing the info bar's static border
      let infoLine = footer.querySelector<HTMLElement>(".footer-info-line");
      if (!infoLine && infoBar) {
        infoLine = document.createElement("div");
        infoLine.className = "footer-info-line";
        infoBar.parentElement?.insertBefore(infoLine, infoBar);
        infoBar.style.borderTop = "none";
      }

      // masked-line wrappers
      infoSpans.forEach((s) => frevWrap(s, 110));
      navLinks.forEach((a) => frevWrap(a, 120));
      frevWrap(email, 105);
      frevWrap(phone, 105);

      // cover panel over the footer video
      let cover = videoThumb?.querySelector<HTMLElement>(".footer-video-cover") ?? null;
      if (!cover && videoThumb) {
        cover = document.createElement("div");
        cover.className = "footer-video-cover";
        videoThumb.appendChild(cover);
      }

      const ctx = gsap.context(() => {
        if (infoLine) gsap.set(infoLine, { scaleX: 0 });
        if (cover) gsap.set(cover, { scaleX: 1 });
        if (desc) gsap.set(desc, { clipPath: "inset(0% 0% 100% 0%)", y: 20 });
        if (address) gsap.set(address, { y: 14, autoAlpha: 0 });
        if (showBridge && bridgeGlyph) {
          gsap.set(bridgeGlyph, { scale: 0, rotation: -20, transformOrigin: "50% 50%" });
        }

        // --- entry timeline (one-shot) -------------------------------------
        const tl = gsap.timeline({
          scrollTrigger: { trigger: footer, start: "top 82%", once: true },
        });
        if (infoLine) tl.to(infoLine, { scaleX: 1, duration: 1.1, ease: "power3.inOut" }, 0);
        if (cover) tl.to(cover, { scaleX: 0, duration: 0.85, ease: "power4.inOut" }, 0.15);
        if (infoSpans.length) {
          tl.to(
            infoSpans,
            { yPercent: 0, duration: 1.0, ease: "power4.out", stagger: 0.1 },
            0.2
          );
        }
        if (desc) {
          tl.to(
            desc,
            { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 1.1, ease: "power4.out" },
            0.5
          );
        }
        if (email) tl.to(email, { yPercent: 0, duration: 1.2, ease: "power4.out" }, 0.68);
        if (showBridge && bridgeGlyph) {
          tl.to(
            bridgeGlyph,
            { scale: 1, rotation: 0, duration: 1.1, ease: "back.out(1.3)" },
            0.8
          );
        }
        if (phone) tl.to(phone, { yPercent: 0, duration: 0.9, ease: "power3.out" }, 0.85);
        if (address) {
          tl.to(address, { y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out" }, 0.95);
        }
        if (navLinks.length) {
          tl.to(
            navLinks,
            { yPercent: 0, duration: 0.85, ease: "power4.out", stagger: 0.07 },
            1.05
          );
        }

        // --- © bridge scroll parallax --------------------------------------
        // CSS keeps translateY(50%) for the no-JS state; GSAP re-expresses it
        // as yPercent so the scrubbed drift composes cleanly on top.
        if (showBridge && bridge && parallaxSection) {
          gsap.fromTo(
            bridge,
            { y: 0, yPercent: 50 },
            {
              yPercent: 80,
              ease: "none",
              scrollTrigger: {
                trigger: parallaxSection,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            }
          );
        }
      }, footer);

      return () => ctx.revert();
    },
    { rootMargin: 2200 }
  );

  return (
    <footer id="site-footer" className="site-footer" ref={footerRef}>
      <nav className="dark-nav footer-nav" id="ui-nav" aria-label="Footer menu">
        {DORMANT_NAV.map((item) => (
          <a key={item.href} href={item.href} data-transition-label={item.label}>
            {item.label}
          </a>
        ))}
      </nav>

      <div className="footer-top">
        <div className="footer-info-bar">
          <span>Web Design Studio</span>
          <span>Commercial Visual · AI Motion</span>
          <span>Est. 2026 · Taichung</span>
        </div>

        <div className="footer-main-content">
          <div className="footer-left">
            <p className="footer-description">
              American Web Guild | Taichung web design, high-end commercial
              visual generation, and AI motion imagery. We integrate brand
              identity, interactive experience design, and Gen-AI visual
              technology to build internationally competitive digital visual
              narratives for brands.
            </p>
            <div className="footer-contact-info">
              {/* TODO: swap in the real inbox once one exists */}
              <a className="footer-email" href="mailto:hello@americanwebguild.com">
                hello@americanwebguild.com
              </a>
              <span className="footer-phone">(04) 3603-3622</span>
            </div>
            <div className="footer-address">
              4F, No. 447, Sec. 3, Wenxin Rd., Beitun Dist., Taichung City
              406, Taiwan
            </div>
            <div className="footer-nav-links">
              {SOCIALS.map((s) => (
                <a key={s.text} href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.text}
                </a>
              ))}
              <a href="/blog" data-transition-label="Blog">
                blog
              </a>
            </div>
          </div>

          <div className="footer-right-panel">
            <div className="footer-video-thumb">
              <video
                data-lazy-video=""
                autoPlay
                muted
                loop
                playsInline
                preload="none"
                disableRemotePlayback
                width={320}
                height={180}
              >
                <source data-src="/images/footer.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>

        <div className="footer-cta">
          <span className="footer-cta__label">Have a project in mind?</span>
          <a className="footer-cta__btn" href="/contact" data-cursor="CONTACT">
            Let&apos;s Talk
            <span className="footer-cta__arrow" aria-hidden="true">
              &rarr;
            </span>
          </a>
        </div>

        <div className="footer-copyright-bridge" id="footer-c-bridge">
          <span>©</span>
        </div>
      </div>

      <div className="footer-parallax-section" id="footer-parallax-section">
        <div
          className="footer-parallax-bg"
          id="footer-parallax-bg"
          data-bg="/images/footer.webp"
        />
        <div className="footer-parallax-copy">
          <span>American Web Guild Creative Co., Ltd.</span>
          <span>© 2026 AMERICAN WEB GUILD. ALL RIGHTS RESERVED.</span>
        </div>
      </div>
    </footer>
  );
}
