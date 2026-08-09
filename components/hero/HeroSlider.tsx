"use client";

import { useEffect, useRef } from "react";
import { WebGLManager } from "./webgl-manager";
import { Slideshow } from "./slideshow";

/**
 * Mounts the three.js slide renderer into #webgl-container and wires the
 * slideshow controller to the already-rendered hero UI elements.
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

    const gl = new WebGLManager(container);
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
