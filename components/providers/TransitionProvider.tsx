"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { getLenis } from "@/lib/lenis";

const COLS = 17;
const ROWS = 9;

/**
 * Pixel-grid page transitions: a 17×9 cell grid blooms from screen center to
 * cover the page, the route swaps underneath, then the grid dissolves.
 * Lives in the root shell so it never remounts across navigations.
 */
export default function TransitionProvider() {
  const shellRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const pendingRef = useRef(false);
  const coveringRef = useRef(false);
  const lastPathRef = useRef(pathname);

  // ---- intercept link clicks (capture phase, whole document) ----
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
        return;
      const a = (e.target as HTMLElement).closest?.(
        "a[href]"
      ) as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href")!;
      if (
        a.target === "_blank" ||
        a.hasAttribute("download") ||
        /^(mailto:|tel:|javascript:)/i.test(href)
      )
        return;

      let url: URL;
      try {
        url = new URL(href, location.href);
      } catch {
        return;
      }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname) {
        // same-page hash handled by the hash-scroll listener / no-op
        return;
      }
      if (coveringRef.current) {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      coveringRef.current = true;
      pendingRef.current = true;
      document.documentElement.classList.add("is-page-transitioning");
      window.dispatchEvent(new CustomEvent("nudot:navigate"));
      getLenis()?.stop();

      const shell = shellRef.current!;
      const cells = shell.querySelectorAll<HTMLElement>(".pt-cell");
      shell.classList.add("is-active");

      let navigated = false;
      const go = () => {
        if (navigated) return;
        navigated = true;
        router.push(url.pathname + url.search + url.hash);
      };
      gsap.fromTo(
        cells,
        { scale: 0, opacity: 0, transformOrigin: "50% 50%" },
        {
          scale: 1.03,
          opacity: 1,
          duration: 0.28,
          ease: "power1.in",
          stagger: { grid: [ROWS, COLS], from: "center", each: 0.022 },
          onComplete: go,
        }
      );
      // stall fallback
      window.setTimeout(go, 1000);
    };

    document.addEventListener("click", onClick, { capture: true });
    return () =>
      document.removeEventListener("click", onClick, { capture: true });
  }, [router]);

  // ---- reveal on route change ----
  useEffect(() => {
    if (pathname === lastPathRef.current) return;
    lastPathRef.current = pathname;
    if (!pendingRef.current) return;
    pendingRef.current = false;

    const shell = shellRef.current!;
    const cells = shell.querySelectorAll<HTMLElement>(".pt-cell");

    // arrive covered, at the top of the new page
    gsap.set(cells, { scale: 1.03, opacity: 1 });
    const lenis = getLenis();
    if (lenis) {
      lenis.start();
      lenis.scrollTo(0, { immediate: true, force: true });
    } else {
      window.scrollTo(0, 0);
    }

    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      gsap.to(cells, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: "power1.out",
        stagger: { grid: [ROWS, COLS], from: "center", each: 0.022 },
        onComplete: () => {
          shell.classList.remove("is-active");
          document.documentElement.classList.remove("is-page-transitioning");
          coveringRef.current = false;
        },
      });
    });

    // fail-safe: never leave the page covered
    const failsafe = window.setTimeout(() => {
      shell.classList.remove("is-active");
      document.documentElement.classList.remove("is-page-transitioning");
      coveringRef.current = false;
      gsap.set(cells, { scale: 0, opacity: 0 });
    }, 2400);
    return () => window.clearTimeout(failsafe);
  }, [pathname]);

  return (
    <div
      className="page-transition-shell js-page-transition-shell"
      aria-hidden="true"
      ref={shellRef}
    >
      <div className="page-transition-pixels">
        {Array.from({ length: COLS * ROWS }, (_, i) => (
          <div className="pt-cell" key={i} />
        ))}
      </div>
    </div>
  );
}
