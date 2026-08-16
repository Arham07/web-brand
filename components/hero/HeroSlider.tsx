"use client";

import { useEffect, useRef } from "react";
import { isMobileLayout } from "@/lib/device";
import { WebGLManager } from "./webgl-manager";
import { DomSlideRenderer } from "./dom-slides";
import { Slideshow } from "./slideshow";
import type { SlideRenderer } from "./slide-renderer";

/**
 * Mounts a slide renderer into #webgl-container and wires the slideshow
 * controller to the already-rendered hero UI elements.
 * Loaded with ssr:false — window is safe here.
 */
export default function HeroSlider() {
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    const container = document.getElementById("webgl-container");
    const root = container?.closest<HTMLElement>(".hero-section");
    if (!container || !root) return;

    const els = {
      root,
      counterCurrent: root.querySelector<HTMLElement>(".current-slide"),
      titleContainer: root.querySelector<HTMLElement>(".slide-title-container"),
      linesContainer: root.querySelector<HTMLElement>(".lines-container"),
      thumbsContainer: root.querySelector<HTMLElement>(".slide-thumbs"),
      prev: root.querySelector<HTMLElement>(".prev-slide"),
      next: root.querySelector<HTMLElement>(".next-slide"),
    };
    if (Object.values(els).some((el) => !el)) return;
    mounted.current = true;

    // Phones get the DOM renderer: the WebGL path re-uploads the slide
    // video as a GPU texture every frame, which is the bulk of the
    // first-viewport scroll jitter on mobile.
    const gl: SlideRenderer = isMobileLayout()
      ? new DomSlideRenderer(container)
      : new WebGLManager(container);
    gl.init();
    const show = new Slideshow(
      gl,
      els as { [K in keyof typeof els]: HTMLElement }
    );
    show.init();

    return () => {
      mounted.current = false;
      show.destroy();
      gl.dispose();
    };
  }, []);

  return null;
}
