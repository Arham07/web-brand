"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { getLenis, scrollTop } from "@/lib/lenis";
import { isMobileLayout } from "@/lib/device";
import NavMenu from "./NavMenu";

const SHOW_THRESHOLD = 300;
const MENU_BG_OPEN = "#efe6d8";
const MENU_BG_CLOSED = "#141414";
const HOVER_GRACE_MS = 110;
const BLEND_FADEOUT_MS = 260;

/**
 * Scroll-pill nav + cream fullscreen dropdown menu.
 * - Pill shows when scrollTop > 300 (desktop); always visible <=767px.
 * - Menu open = reusable GSAP timeline replayed from 0; close = fresh timeline.
 * - Row hover previews (thumbs wipe-in + title roll) on >1280px pointers only.
 */
export default function ScrollNav() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;
      const dropdown = container.querySelector<HTMLElement>(".ns-dropdown");
      const menuBtn = container.querySelector<HTMLButtonElement>(".ns-hamburger");
      if (!dropdown || !menuBtn) return;

      const html = document.documentElement;
      const items = gsap.utils.toArray<HTMLElement>(".ns-dropdown__item", container);

      /* ----- shared geometry getters (resize-safe) ----- */
      const closedTop = () => (isMobileLayout() ? 16 : 30);
      const closedWidth = () =>
        Math.min(500, Math.max(280, window.innerWidth - (isMobileLayout() ? 24 : 80)));

      let shown = false;
      let menuOpen = false;
      let openTl: gsap.core.Timeline | null = null;
      let closeTl: gsap.core.Timeline | null = null;
      let thumbsHydrated = false;
      let fadeoutTimer = 0;
      let bootRaf = 0;

      /* ----- thumb image hydration (src <- data-nav-src) ----- */
      const hydrate = (scope: ParentNode) => {
        scope
          .querySelectorAll<HTMLImageElement>("img[data-nav-src]")
          .forEach((img) => {
            if (!img.getAttribute("src") && img.dataset.navSrc) {
              img.src = img.dataset.navSrc;
            }
          });
      };

      /* ================= hover previews (>1280px only) ================= */

      const previewsEnabled = () => window.innerWidth > 1280;

      // accent layer starts rolled 104% down; take ownership from CSS so
      // yPercent tweens don't stack onto the stylesheet transform
      gsap.set(
        container.querySelectorAll(".ns-showcase-row__title-layer.is-accent"),
        { yPercent: 104, y: 0 }
      );

      const rowTls = new Map<HTMLElement, gsap.core.Timeline>();
      const graceTimers = new Map<HTMLElement, number>();
      let activeRow: HTMLElement | null = null;

      const buildRowTl = (row: HTMLElement) => {
        const thumbs = row.querySelectorAll<HTMLElement>(".ns-showcase-row__thumb");
        const imgs = row.querySelectorAll<HTMLElement>(".ns-showcase-row__thumb img");
        const primary = row.querySelector<HTMLElement>(".is-primary");
        const accent = row.querySelector<HTMLElement>(".is-accent");
        const index = row.querySelector<HTMLElement>(".ns-showcase-row__index");

        const tl = gsap.timeline({ paused: true });
        tl.to(
          thumbs,
          {
            autoAlpha: 1,
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 0.42,
            ease: "expo.out",
            stagger: 0.025,
          },
          0
        )
          .to(imgs, { scale: 1, duration: 0.46, ease: "expo.out", stagger: 0.025 }, 0.02)
          .to(primary, { yPercent: -104, duration: 0.46, ease: "expo.out" }, 0.02)
          .to(accent, { yPercent: 0, duration: 0.46, ease: "expo.out" }, 0.02)
          .to(
            index,
            { color: "rgba(23,20,17,0.55)", duration: 0.38, ease: "expo.out" },
            0.04
          );
        return tl;
      };

      const clearGrace = (row: HTMLElement) => {
        const t = graceTimers.get(row);
        if (t !== undefined) {
          window.clearTimeout(t);
          graceTimers.delete(row);
        }
      };

      const rowEnter = (row: HTMLElement) => {
        if (!previewsEnabled()) return;
        clearGrace(row);
        if (activeRow && activeRow !== row) {
          rowTls.get(activeRow)?.timeScale(1.6).reverse();
          activeRow.classList.remove("is-previewed");
        }
        hydrate(row);
        let tl = rowTls.get(row);
        if (!tl) {
          tl = buildRowTl(row);
          rowTls.set(row, tl);
        }
        tl.timeScale(1).play();
        row.classList.add("is-previewed");
        activeRow = row;
      };

      const rowLeave = (row: HTMLElement) => {
        if (!previewsEnabled()) return;
        clearGrace(row);
        const timer = window.setTimeout(() => {
          graceTimers.delete(row);
          rowTls.get(row)?.timeScale(1.8).reverse();
          row.classList.remove("is-previewed");
          if (activeRow === row) activeRow = null;
        }, HOVER_GRACE_MS);
        graceTimers.set(row, timer);
      };

      const resetPreviews = () => {
        graceTimers.forEach((t) => window.clearTimeout(t));
        graceTimers.clear();
        rowTls.forEach((tl) => tl.pause(0));
        items.forEach((row) => row.classList.remove("is-previewed"));
        activeRow = null;
      };

      /* ================= menu open / close ================= */

      const setMenuButtonState = (open: boolean) => {
        menuBtn.dataset.cursor = open ? "CLOSE" : "OPEN";
        menuBtn.dataset.cursorSide = open ? "left" : "right";
        menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
        menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      };

      const buildOpenTl = () =>
        gsap
          .timeline({
            paused: true,
            defaults: { ease: "expo.inOut" },
            onComplete: () => container.classList.remove("is-menu-animating"),
          })
          .to(
            container,
            {
              top: () => closedTop() + 30,
              height: 4,
              borderRadius: 999,
              duration: 0.2,
              ease: "power3.inOut",
            },
            0
          )
          .to(container, { width: "100vw", duration: 0.25, ease: "power3.inOut" }, 0.1)
          .to(
            container,
            {
              top: 0,
              height: "100vh",
              borderRadius: 0,
              backgroundColor: MENU_BG_OPEN,
              duration: 0.35,
              ease: "power3.inOut",
            },
            0.3
          )
          .fromTo(
            dropdown,
            { opacity: 0, y: 24, clipPath: "inset(6% 0% 0% 0%)", filter: "blur(12px)" },
            {
              opacity: 1,
              y: 0,
              clipPath: "inset(0% 0% 0% 0%)",
              filter: "blur(0px)",
              duration: 0.3,
              ease: "power2.out",
            },
            0.35
          )
          .fromTo(
            items,
            { y: 34, opacity: 0, filter: "blur(14px)" },
            {
              y: 0,
              opacity: 1,
              filter: "blur(0px)",
              duration: 0.35,
              ease: "power2.out",
              stagger: 0.02,
            },
            0.4
          );

      const openMenu = () => {
        if (menuOpen) return;
        menuOpen = true;
        closeTl?.kill();
        closeTl = null;
        window.clearTimeout(fadeoutTimer);
        container.classList.remove("ns-enter", "ns-exit", "is-blend-fadeout");
        container.classList.add("ns-visible", "is-menu-open", "is-menu-animating");
        container.inert = false;
        dropdown.inert = false;
        dropdown.setAttribute("aria-hidden", "false");
        dropdown.style.pointerEvents = "auto";
        setMenuButtonState(true);
        if (!thumbsHydrated) {
          hydrate(dropdown);
          thumbsHydrated = true;
        }
        openTl?.kill();
        openTl = buildOpenTl();
        openTl.play(0);
      };

      const finalizeClose = () => {
        dropdown.inert = true;
        dropdown.setAttribute("aria-hidden", "true");
        dropdown.style.pointerEvents = "";
        setMenuButtonState(false);
        resetPreviews();
        gsap.set(dropdown, { clearProps: "opacity,transform,clipPath,filter,visibility" });
        gsap.set(items, { clearProps: "opacity,transform,filter,visibility" });
        gsap.set(container, {
          clearProps: "top,width,height,borderRadius,backgroundColor",
        });
        container.classList.remove("is-menu-open", "is-menu-animating");
        if (shown || isMobileLayout()) {
          container.classList.add("ns-visible");
          container.inert = false;
          container.classList.add("is-blend-fadeout");
          window.clearTimeout(fadeoutTimer);
          fadeoutTimer = window.setTimeout(
            () => container.classList.remove("is-blend-fadeout"),
            BLEND_FADEOUT_MS
          );
        } else {
          container.inert = true;
        }
      };

      const closeMenu = (immediate = false) => {
        if (!menuOpen) return;
        menuOpen = false;
        openTl?.kill();
        openTl = null;
        closeTl?.kill();
        closeTl = null;
        container.classList.add("is-menu-animating");
        if (immediate) {
          finalizeClose();
          return;
        }
        closeTl = gsap
          .timeline({ defaults: { ease: "expo.inOut" }, onComplete: finalizeClose })
          .to(
            dropdown,
            {
              opacity: 0,
              y: 10,
              clipPath: "inset(2% 0% 0% 0%)",
              filter: "blur(4px)",
              duration: 0.18,
              ease: "power2.in",
            },
            0
          )
          .to(
            container,
            {
              top: () => closedTop() + 30,
              height: 4,
              borderRadius: 999,
              duration: 0.2,
              ease: "power3.inOut",
            },
            0.05
          )
          .to(
            container,
            { width: () => closedWidth(), duration: 0.25, ease: "power3.inOut" },
            0.2
          )
          .add(() => container.classList.remove("is-menu-open"), 0.45)
          .to(
            container,
            {
              top: () => closedTop(),
              height: 64,
              borderRadius: 6,
              backgroundColor: MENU_BG_CLOSED,
              duration: 0.25,
              ease: "power3.out",
            },
            0.45
          );
      };

      /* ================= pill show / hide ================= */

      const show = () => {
        if (shown) return;
        shown = true;
        html.classList.add("show-nav-scroll");
        container.inert = false;
        container.classList.remove("ns-exit", "ns-enter", "ns-visible");
        requestAnimationFrame(() => container.classList.add("ns-enter"));
      };

      const hide = () => {
        if (!shown) return;
        shown = false;
        html.classList.remove("show-nav-scroll");
        if (menuOpen) closeMenu(true);
        container.inert = true;
        container.classList.remove("ns-enter", "ns-visible");
        requestAnimationFrame(() => container.classList.add("ns-exit"));
      };

      const onAnimEnd = (e: AnimationEvent) => {
        if (e.target !== container) return;
        if (e.animationName === "nsBarIn") {
          // hand steady state to .ns-visible so the filled animation's
          // border-radius/transform can't fight the menu GSAP tweens
          container.classList.remove("ns-enter");
          container.classList.add("ns-visible");
        } else if (e.animationName === "nsBarOut") {
          container.classList.remove("ns-exit");
        }
      };

      const syncVisibility = () => {
        if (isMobileLayout()) {
          if (!menuOpen) container.inert = false;
          container.classList.add("ns-visible");
          return;
        }
        if (scrollTop() > SHOW_THRESHOLD) show();
        else hide();
      };

      /* ================= wiring ================= */

      container.inert = true;
      dropdown.inert = true;

      const onScroll = () => syncVisibility();

      // Lenis may not exist yet (ScrollProvider's useEffect runs after this
      // layout effect) — hook it on the next frame; keep a window fallback.
      let hookedLenis: ReturnType<typeof getLenis> = null;
      const hookLenis = () => {
        const lenis = getLenis();
        if (lenis && lenis !== hookedLenis) {
          lenis.on("scroll", onScroll);
          hookedLenis = lenis;
        }
      };
      hookLenis();
      bootRaf = requestAnimationFrame(() => {
        hookLenis();
        syncVisibility();
      });
      window.addEventListener("scroll", onScroll, { passive: true });

      const onResize = () => {
        if (menuOpen) {
          // re-apply open geometry instantly
          gsap.set(container, { top: 0, width: "100vw", height: "100vh", borderRadius: 0 });
        }
        syncVisibility();
      };
      window.addEventListener("resize", onResize);

      const onMenuBtnClick = () => (menuOpen ? closeMenu() : openMenu());
      menuBtn.addEventListener("click", onMenuBtnClick);

      const onDocPointerDown = (e: PointerEvent) => {
        if (!menuOpen) return;
        const target = e.target as HTMLElement | null;
        if (!target) return;
        if (target.closest("#nav_scroll") || target.closest(".ns-showcase-row")) return;
        closeMenu();
      };
      document.addEventListener("pointerdown", onDocPointerDown);

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && menuOpen) closeMenu();
      };
      document.addEventListener("keydown", onKeyDown);

      // page transitions force-close the menu the instant a link is taken
      const onNavigate = () => {
        if (menuOpen) closeMenu(true);
      };
      window.addEventListener("nudot:navigate", onNavigate);

      container.addEventListener("animationend", onAnimEnd);

      const rowHandlers = items.map((row) => {
        const enter = () => rowEnter(row);
        const leave = () => rowLeave(row);
        row.addEventListener("pointerenter", enter);
        row.addEventListener("pointerleave", leave);
        return { row, enter, leave };
      });

      /* ================= cleanup (StrictMode-safe) ================= */

      return () => {
        cancelAnimationFrame(bootRaf);
        window.clearTimeout(fadeoutTimer);
        graceTimers.forEach((t) => window.clearTimeout(t));
        graceTimers.clear();
        hookedLenis?.off("scroll", onScroll);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
        menuBtn.removeEventListener("click", onMenuBtnClick);
        document.removeEventListener("pointerdown", onDocPointerDown);
        document.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("nudot:navigate", onNavigate);
        container.removeEventListener("animationend", onAnimEnd);
        rowHandlers.forEach(({ row, enter, leave }) => {
          row.removeEventListener("pointerenter", enter);
          row.removeEventListener("pointerleave", leave);
        });
        rowTls.forEach((tl) => tl.kill());
        rowTls.clear();
        openTl?.kill();
        closeTl?.kill();
        html.classList.remove("show-nav-scroll");
        container.classList.remove(
          "ns-enter",
          "ns-exit",
          "ns-visible",
          "is-menu-open",
          "is-menu-animating",
          "is-blend-fadeout"
        );
      };
    },
    { scope: containerRef }
  );

  return (
    <div id="nav_scroll_container" ref={containerRef} inert>
      <div id="nav_scroll">
        <a
          className="ns-icon"
          href="/contact"
          data-cursor="CONTACT"
          aria-label="Contact"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </a>
        <a className="ns-logo" href="/" data-cursor="HOME" aria-label="NUDOT home">
          <img
            src="/images/pc_logo.svg"
            alt="NUDOT 核點創意"
            width={45}
            height={35}
            loading="lazy"
          />
        </a>
        <button
          className="ns-icon ns-hamburger"
          id="nav-scroll-menu-btn"
          type="button"
          data-cursor="OPEN"
          data-cursor-side="right"
          aria-label="Open menu"
          aria-expanded="false"
          aria-controls="nav-scroll-dropdown"
        >
          <svg
            className="ns-ham-svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <line className="ns-ham-l1" x1="5" y1="9" x2="19" y2="9" />
            <line className="ns-ham-l2" x1="5" y1="15" x2="19" y2="15" />
          </svg>
        </button>
      </div>
      <NavMenu />
    </div>
  );
}
