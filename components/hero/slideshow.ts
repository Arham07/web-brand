import { scrollTop, scrollToTarget } from "@/lib/lenis";
import { isCoarsePointer } from "@/lib/device";
import type { SlideRenderer } from "./slide-renderer";
import {
  SLIDES,
  AUTOPLAY_MS,
  SWIPE_THRESHOLD_PX,
} from "./slides-data";

const BAR_COUNT = 60;
const UI_WIDTH = 720;
const BASE_H = 15;
const PEAK_H = 35;

interface SlideshowEls {
  root: HTMLElement;
  counterCurrent: HTMLElement;
  titleContainer: HTMLElement;
  linesContainer: HTMLElement;
  thumbsContainer: HTMLElement;
  prev: HTMLElement;
  next: HTMLElement;
}

export class Slideshow {
  current = 0;
  private total = SLIDES.length;
  private isAnimating = false;
  private pending: number | null = null;
  private autoplayTimer: ReturnType<typeof setInterval> | null = null;
  private autoplayArmed = false;
  private hoveredThumb: number | null = null;
  private bars: HTMLDivElement[] = [];
  private thumbs: HTMLDivElement[] = [];
  private cleanups: Array<() => void> = [];

  constructor(private gl: SlideRenderer, private els: SlideshowEls) {}

  init() {
    this.buildBars();
    this.buildThumbs();
    this.aimWave(0);
    this.bindInputs();

    const arm = () => {
      this.autoplayArmed = true;
      this.startAutoplay();
    };
    if ((window as unknown as { _nudotLoaderDismissed?: boolean })._nudotLoaderDismissed) {
      arm();
    } else {
      const onDismiss = () => arm();
      window.addEventListener("nudot:loader-dismissed", onDismiss, { once: true });
      this.cleanups.push(() =>
        window.removeEventListener("nudot:loader-dismissed", onDismiss)
      );
      // never wait forever
      const fallback = setTimeout(arm, 6000);
      this.cleanups.push(() => clearTimeout(fallback));
    }
  }

  // ------------------------------------------------------------- build

  private buildBars() {
    this.els.linesContainer.replaceChildren();
    this.bars = [];
    const frag = document.createDocumentFragment();
    for (let i = 0; i < BAR_COUNT; i++) {
      const bar = document.createElement("div");
      bar.className = "drag-line";
      frag.appendChild(bar);
      this.bars.push(bar);
    }
    this.els.linesContainer.appendChild(frag);
  }

  private buildThumbs() {
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const strip = this.els.thumbsContainer;
    strip.replaceChildren();
    this.thumbs = [];
    const frag = document.createDocumentFragment();
    SLIDES.forEach((slide, i) => {
      const t = document.createElement("div");
      t.className = "slide-thumb" + (i === 0 ? " active" : "");
      t.dataset.cursor = "VIEW";
      const src = mobile ? slide.mobileThumb ?? slide.thumb : slide.thumb;
      t.style.backgroundImage = `url("${src}")`;
      t.addEventListener("mouseenter", () => {
        this.hoveredThumb = i;
        void this.gl.load(i);
        this.aimWave(i);
      });
      t.addEventListener("click", () => {
        void this.gl.load(i);
        this.goTo(i, undefined, true);
      });
      frag.appendChild(t);
      this.thumbs.push(t);
    });
    strip.appendChild(frag);

    strip.addEventListener("mouseenter", () => this.stopAutoplay());
    strip.addEventListener("mouseleave", () => {
      this.hoveredThumb = null;
      this.aimWave(this.current);
      this.startAutoplay();
    });
  }

  // ------------------------------------------------------------ inputs

  private bindInputs() {
    const onPrev = () => this.navigate(-1, true);
    const onNext = () => this.navigate(1, true);
    this.els.prev.addEventListener("click", onPrev);
    this.els.next.addEventListener("click", onNext);

    const onKey = (e: KeyboardEvent) => {
      if (scrollTop() > window.innerHeight * 0.5 || this.isAnimating) return;
      if (e.key === "ArrowRight") this.navigate(1, true);
      if (e.key === "ArrowLeft") this.navigate(-1, true);
    };
    window.addEventListener("keydown", onKey);
    this.cleanups.push(() => window.removeEventListener("keydown", onKey));

    // desktop mouse drag
    if (window.innerWidth > 768) {
      let downX: number | null = null;
      const onDown = (e: MouseEvent) => {
        downX = e.clientX;
        this.els.root.classList.add("is-grabbing");
        this.stopAutoplay();
      };
      const onUp = (e: MouseEvent) => {
        this.els.root.classList.remove("is-grabbing");
        if (downX !== null) {
          const dx = e.clientX - downX;
          if (Math.abs(dx) > SWIPE_THRESHOLD_PX)
            this.navigate(dx < 0 ? 1 : -1, true);
        }
        downX = null;
        this.startAutoplay();
      };
      this.els.root.addEventListener("mousedown", onDown);
      window.addEventListener("mouseup", onUp);
      this.cleanups.push(() => window.removeEventListener("mouseup", onUp));
    }

    // touch swipe — only for gestures that start inside the hero and are
    // clearly horizontal, so a vertical scroll with a bit of thumb arc is
    // never mistaken for a slide swipe.
    let touchX: number | null = null;
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      // a touch anywhere pauses autoplay (mouseenter never fires on phones)
      this.stopAutoplay();
      const t = e.touches[0];
      if (!this.els.root.contains(t.target as Node)) {
        touchX = null;
        return;
      }
      touchX = t.clientX;
      touchY = t.clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (touchX === null || scrollTop() > window.innerHeight) {
        touchX = null;
        return;
      }
      const dx = e.changedTouches[0].clientX - touchX;
      const dy = e.changedTouches[0].clientY - touchY;
      touchX = null;
      if (Math.abs(dx) > SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy) * 1.5) {
        this.navigate(dx < 0 ? 1 : -1, true);
      }
    };
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    this.cleanups.push(() => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    });
  }

  // -------------------------------------------------------- navigation

  navigate(dir: 1 | -1, userInitiated = false) {
    const next = (this.current + dir + this.total) % this.total;
    this.goTo(next, dir, userInitiated);
  }

  goTo(index: number, dirHint?: 1 | -1, userInitiated = false) {
    if (index === this.current) return;
    if (this.isAnimating) {
      this.pending = index;
      return;
    }
    // Only a deliberate slide change pulls the hero back into view — an
    // autoplay tick must never move the page under the reader.
    if (userInitiated) this.ensureTop();
    const dir: 1 | -1 = dirHint ?? (index > this.current ? 1 : -1);
    this.isAnimating = true;
    this.setUiLocked(true);

    const from = this.current;
    this.current = index;
    this.updateCounter(index);
    this.swapTitle(SLIDES[index].title);
    // Which H1 variant is on screen — a free multivariate signal once any
    // analytics is installed (dataLayer if present, plus a DOM event).
    (window as unknown as { dataLayer?: unknown[] }).dataLayer?.push({
      event: "hero_slide_view",
      slideIndex: index,
    });
    window.dispatchEvent(
      new CustomEvent("awg:hero-slide", { detail: { index } })
    );
    this.setActiveThumb(index);
    this.aimWave(index);

    void this.gl.transition(from, index, dir).then(() => {
      this.isAnimating = false;
      this.setUiLocked(false);
      if (this.hoveredThumb !== null) this.aimWave(this.hoveredThumb);
      if (this.pending !== null) {
        const queued = this.pending;
        this.pending = null;
        setTimeout(() => this.goTo(queued), 50);
      }
    });
  }

  private ensureTop() {
    // Desktop only: there the hero lives in a pinned scaffold, so a slide
    // swap has to happen at scroll 0 to read correctly. On touch the hero
    // is a plain relative block — scrolling the reader back would be a bug.
    if (isCoarsePointer()) return;
    if (scrollTop() > 2) scrollToTarget(0, { duration: 1.2 });
  }

  private setUiLocked(locked: boolean) {
    this.els.prev.classList.toggle("is-locked", locked);
    this.els.next.classList.toggle("is-locked", locked);
    this.thumbs.forEach((t) => t.classList.toggle("is-locked", locked));
  }

  // ---------------------------------------------------------------- UI

  private updateCounter(index: number) {
    this.els.counterCurrent.textContent = String(index + 1).padStart(2, "0");
  }

  private swapTitle(title: string) {
    const container = this.els.titleContainer;
    const old = container.querySelector<HTMLElement>(".slide-title");
    if (old) {
      old.classList.add("exit-up");
      setTimeout(() => old.remove(), 500);
    }
    const el = document.createElement("div");
    el.className = "slide-title enter-up";
    el.textContent = title;
    container.appendChild(el);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => el.classList.remove("enter-up"))
    );
  }

  private setActiveThumb(index: number) {
    this.thumbs.forEach((t, i) => t.classList.toggle("active", i === index));
  }

  /** cosine "mountain" of bar heights centered above slide `index` */
  aimWave(index: number) {
    const uiWidth = this.els.linesContainer.offsetWidth || UI_WIDTH;
    const thumbWidth = uiWidth / this.total;
    const center = (index + 0.5) * thumbWidth;
    const lineWidth = uiWidth / BAR_COUNT;
    const maxDist = thumbWidth * 0.7;

    this.bars.forEach((bar, i) => {
      const barCenter = (i + 0.5) * lineWidth;
      const dist = Math.abs(barCenter - center);
      if (dist <= maxDist) {
        const w = Math.cos((dist / maxDist) * (Math.PI / 2));
        bar.style.height = `${BASE_H + w * PEAK_H}px`;
        // wave peak brightens into the silver sheen — monochrome metallic
        bar.style.backgroundColor = `rgba(232,235,239,${0.3 + w * 0.6})`;
        bar.style.transitionDelay = `${(dist / maxDist) * 0.08}s`;
      } else {
        bar.style.height = `${BASE_H}px`;
        bar.style.backgroundColor = "rgba(255,255,255,0.3)";
        bar.style.transitionDelay = "0s";
      }
    });
  }

  // ----------------------------------------------------------- autoplay

  startAutoplay() {
    if (!this.autoplayArmed || this.autoplayTimer) return;
    this.autoplayTimer = setInterval(() => {
      if (this.isAnimating) return;
      // hero asleep — half a viewport is already past the mobile hero (90vh),
      // so autoplay stops well before it leaves the screen
      if (scrollTop() > window.innerHeight * 0.5) return;
      this.navigate(1);
    }, AUTOPLAY_MS);
  }

  stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  destroy() {
    this.stopAutoplay();
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
  }
}
