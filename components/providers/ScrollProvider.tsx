"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { initLenis, getLenis, scrollToTarget } from "@/lib/lenis";

/**
 * Mounts the shared Lenis instance and global scroll plumbing.
 * Renders nothing; must be the FIRST child of AppShell so its effect
 * runs before sibling components that read the Lenis singleton.
 */
export default function ScrollProvider() {
  useEffect(() => {
    initLenis();

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh, { once: true });
    document.fonts?.ready.then(refresh);

    const onVisibility = () => {
      const lenis = getLenis();
      if (!document.hidden && lenis) {
        lenis.scrollTo(lenis.scroll, { immediate: true, force: true });
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // same-page hash links → smooth scroll
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href")!;
      if (id.length < 2) return;
      const target = document.querySelector<HTMLElement>(id);
      if (!target) return;
      e.preventDefault();
      scrollToTarget(target, { duration: 1.4, offset: 0 });
    };
    document.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("load", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
