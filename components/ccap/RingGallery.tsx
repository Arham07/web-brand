"use client";

// Mounts the three.js ring gallery into #sketch and wires the two
// scrubbed scroll timelines that drive its progress values:
//   enter — iris opens, tiles fly forward, spin decelerates 10× → 1×
//   exit  — hero DOM fades, iris closes back to black

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useSectionNear } from "@/hooks/useSectionNear";
import { isMobileLayout } from "@/lib/device";
import { RingGalleryScene } from "./ring-gallery";

export default function RingGallery() {
  const hostRef = useRef<HTMLDivElement>(null);

  useSectionNear(
    hostRef,
    () => {
      const host = hostRef.current;
      if (!host || !host.isConnected) return;
      const section = host.closest<HTMLElement>(".ccap-section");
      if (!section) return;
      const heroDom = section.querySelector<HTMLElement>(".hero-dom");

      let scene: RingGalleryScene;
      try {
        scene = new RingGalleryScene(host);
      } catch {
        // WebGL unavailable — reveal the DOM copy and bail
        if (heroDom) gsap.set(heroDom, { opacity: 1 });
        return;
      }

      // Phones play the entrance as a self-timed timeline instead of
      // scrubbing it to scroll position. The scrubbed version mapped the
      // whole entrance onto half a viewport of scroll: a flick crosses that
      // in ~250ms, so the animation was still catching up after the finger
      // left — "it only starts when I stop scrolling" — and every catch-up
      // frame competed with the fling for the main thread. Self-timed, it
      // runs at its own tempo the moment the section arrives.
      const mobile = isMobileLayout();

      const enterTl = gsap.timeline({
        scrollTrigger: mobile
          ? { trigger: section, start: "top 85%", once: true }
          : { trigger: section, start: "top 80%", end: "top 30%", scrub: 1 },
      });
      enterTl.to(scene, {
        transitionProgress: 1,
        duration: 1,
        ease: "power1.inOut",
      });
      enterTl.to(
        scene,
        { enterProgress: 1, rotateSpeed: 1, duration: 1.5, ease: "power1.inOut" },
        "-=1"
      );
      if (heroDom) {
        enterTl.to(heroDom, { opacity: 1, duration: 1, ease: "none" }, "<");
      }

      const exitTl = gsap.timeline({
        scrollTrigger: mobile
          ? {
              trigger: section,
              start: "bottom 60%",
              toggleActions: "play none none reverse",
            }
          : { trigger: section, start: "bottom 90%", end: "bottom 20%", scrub: 1 },
      });
      if (heroDom) {
        exitTl.to(heroDom, { opacity: 0, duration: 1, ease: "none" });
      }
      exitTl.to(
        scene,
        { transitionProgress: 0, duration: 1, ease: "power1.inOut" },
        heroDom ? "-=0.5" : 0
      );

      return () => {
        enterTl.scrollTrigger?.kill();
        exitTl.scrollTrigger?.kill();
        enterTl.kill();
        exitTl.kill();
        if (heroDom) gsap.set(heroDom, { clearProps: "opacity" });
        scene.dispose();
      };
    },
    { rootMargin: 2200 }
  );

  return <div id="sketch" ref={hostRef} aria-hidden="true" />;
}
