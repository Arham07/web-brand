import { gsap } from "@/lib/gsap";
import { SLIDES, TRANSITION_SECONDS } from "./slides-data";
import type { SlideRenderer } from "./slide-renderer";

/**
 * Phone slide renderer: one absolutely-positioned layer per slide holding a
 * plain <video> or <img>, crossfaded with GSAP.
 *
 * Matches the WebGL path's idle look exactly — the shader samples the
 * central 95% of the UV box (`zoomAroundCenter(uv, 0.95)`), which is a
 * 1/0.95 magnification of a cover-fitted image, so the media carries
 * `object-fit: cover` plus `scale(1.0527)`.
 *
 * The transition is a crossfade with a small settle-scale instead of the
 * noise-warp + chromatic aberration: both are compositor-only properties,
 * so a phone spends nothing per frame while a slide is simply on screen.
 */

/** 1 / 0.95 — the shader's centre zoom, reproduced in CSS. */
const ZOOM = 1.0527;
/** how long a layer may block the crossfade waiting for media */
const READY_TIMEOUT_MS = 3000;

export class DomSlideRenderer implements SlideRenderer {
  private container: HTMLElement;
  private stage: HTMLDivElement | null = null;
  private layers = new Map<number, HTMLElement>();
  private media = new Map<number, HTMLVideoElement | HTMLImageElement>();
  private loading = new Map<number, Promise<HTMLElement>>();
  private io: IntersectionObserver | null = null;
  private activeIndex = 0;
  private token = 0;
  private disposed = false;
  private onScreen = true;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  init() {
    const stage = document.createElement("div");
    stage.className = "hero-dom-stage";
    this.container.appendChild(stage);
    this.stage = stage;

    void this.load(0).then((layer) => {
      if (this.disposed) return;
      gsap.set(layer, { autoAlpha: 1 });
      this.syncPlayback();
      // the prewarm poster/element can stand down now
      window.dispatchEvent(new CustomEvent("nudot:hero-gl-ready"));
    });
    requestAnimationFrame(() => {
      if (!this.disposed) void this.load(1);
    });

    // stop decoding once the hero is off screen (the WebGL path used a
    // scroll threshold; an observer is both cheaper and more accurate)
    this.io = new IntersectionObserver(
      (entries) => {
        this.onScreen = entries.some((e) => e.isIntersecting);
        this.syncPlayback();
      },
      { rootMargin: "10% 0px 10% 0px" }
    );
    this.io.observe(this.container);
  }

  load(index: number): Promise<HTMLElement> {
    const existing = this.loading.get(index);
    if (existing) return existing;

    const data = SLIDES[index];
    const promise = new Promise<HTMLElement>((resolve) => {
      const layer = document.createElement("div");
      layer.className = "hero-dom-slide";
      gsap.set(layer, { autoAlpha: 0 });

      const videoSrc = data.mobileVideo ?? data.video;
      const imageSrc = data.mobileImage ?? data.image;
      let settled = false;
      const ready = () => {
        if (settled) return;
        settled = true;
        resolve(layer);
      };

      if (videoSrc) {
        const video = document.createElement("video");
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = "auto";
        video.src = videoSrc;
        layer.appendChild(video);
        this.media.set(index, video);
        if (video.readyState >= 2) ready();
        else video.addEventListener("loadeddata", ready, { once: true });
      } else if (imageSrc) {
        const img = document.createElement("img");
        img.decoding = "async";
        img.alt = "";
        img.src = imageSrc;
        layer.appendChild(img);
        this.media.set(index, img);
        if (img.complete) ready();
        else img.addEventListener("load", ready, { once: true });
      } else {
        ready();
      }

      // never let a stalled asset deadlock the slideshow's UI lock
      window.setTimeout(ready, READY_TIMEOUT_MS);

      this.stage?.appendChild(layer);
      this.layers.set(index, layer);
    });

    this.loading.set(index, promise);
    return promise;
  }

  async transition(from: number, to: number, direction: 1 | -1): Promise<boolean> {
    const token = ++this.token;
    const [fromLayer, toLayer] = await Promise.all([
      this.load(from),
      this.load(to),
    ]);
    if (token !== this.token || this.disposed) return false;

    // both endpoints play through the crossfade, like syncPlayback's
    // two-bound-slide case on the WebGL path
    this.play(from);
    this.play(to);

    return new Promise<boolean>((resolve) => {
      gsap
        .timeline({
          onComplete: () => {
            if (token !== this.token || this.disposed) {
              resolve(false);
              return;
            }
            this.activeIndex = to;
            this.syncPlayback();
            resolve(true);
          },
        })
        .set(toLayer, { zIndex: 2 })
        .set(fromLayer, { zIndex: 1 })
        .fromTo(
          toLayer,
          { autoAlpha: 0, scale: 1 + 0.05 * direction },
          {
            autoAlpha: 1,
            scale: 1,
            duration: TRANSITION_SECONDS,
            ease: "expo.inOut",
          },
          0
        )
        .to(
          fromLayer,
          {
            autoAlpha: 0,
            duration: TRANSITION_SECONDS * 0.85,
            ease: "power2.inOut",
          },
          0
        );
    });
  }

  /** only the active slide's video decodes, and nothing decodes off screen */
  private syncPlayback() {
    this.media.forEach((el, i) => {
      if (!(el instanceof HTMLVideoElement)) return;
      if (i === this.activeIndex && this.onScreen) {
        el.play().catch(() => {});
      } else {
        el.pause();
      }
    });
  }

  private play(index: number) {
    const el = this.media.get(index);
    if (el instanceof HTMLVideoElement && this.onScreen) {
      el.play().catch(() => {});
    }
  }

  dispose() {
    this.disposed = true;
    this.token++;
    this.io?.disconnect();
    this.io = null;
    this.media.forEach((el) => {
      if (el instanceof HTMLVideoElement) {
        el.pause();
        el.removeAttribute("src");
        el.load();
      }
    });
    this.media.clear();
    this.layers.clear();
    this.loading.clear();
    this.stage?.remove();
    this.stage = null;
  }
}

export const HERO_DOM_ZOOM = ZOOM;
