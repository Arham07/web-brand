import { scrollVelocity } from "@/lib/lenis";

/**
 * Velocity-reactive infinite marquee.
 * Constant leftward drift that speeds up (and momentarily reverses) with
 * scroll velocity; the rAF loop is gated externally via start()/stop().
 */
export class MarqueeEngine {
  private x = 0;
  private vel = 0;
  private setWidth = 0;
  private rafId = 0;
  private running = false;
  private onResize = () => this.build();

  constructor(
    private inner: HTMLElement,
    private opts: { dir?: number; baseSpeed?: number } = {}
  ) {}

  init() {
    this.build();
    window.addEventListener("resize", this.onResize);
    document.fonts?.ready.then(() => this.build());
  }

  /** clone the first set until the track covers viewport + 2 sets */
  private build() {
    const first = this.inner.querySelector<HTMLElement>(".marquee-set");
    if (!first) return;
    // drop previous clones
    this.inner
      .querySelectorAll<HTMLElement>(".marquee-set[data-clone]")
      .forEach((el) => el.remove());

    this.setWidth = first.offsetWidth;
    if (this.setWidth === 0) return;

    const needed = Math.max(
      2,
      Math.ceil((window.innerWidth + 2 * this.setWidth) / this.setWidth)
    );
    for (let i = 1; i < needed; i++) {
      const clone = first.cloneNode(true) as HTMLElement;
      clone.dataset.clone = "1";
      clone.setAttribute("aria-hidden", "true");
      this.inner.appendChild(clone);
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.rafId = requestAnimationFrame(this.step);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  private step = () => {
    if (!this.running) return;
    const dir = this.opts.dir ?? -1;
    const base = this.opts.baseSpeed ?? 1;

    // scroll velocity feeds a decaying boost (signed, so scrolling up
    // momentarily counteracts the drift)
    const sample = scrollVelocity() * 0.25;
    this.vel = Math.abs(sample) > Math.abs(this.vel) ? sample : this.vel * 0.93;

    this.x += (base + this.vel) * dir;

    // keep x within (−setWidth, 0] so the clone train never shows a gap
    if (this.setWidth > 0) {
      while (this.x <= -this.setWidth) this.x += this.setWidth;
      while (this.x > 0) this.x -= this.setWidth;
    }
    this.inner.style.transform = `translate3d(${this.x}px, 0, 0)`;
    this.rafId = requestAnimationFrame(this.step);
  };

  destroy() {
    this.stop();
    window.removeEventListener("resize", this.onResize);
  }
}
