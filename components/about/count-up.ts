import { gsap } from "@/lib/gsap";

/**
 * Ease-out-quad counter driven by the shared GSAP ticker, so it shares the
 * app's single animation loop (and its lag smoothing / tab-throttling
 * behaviour) rather than running a competing rAF.
 * Returns a canceller that restores the original text.
 */
export function countUp(el: HTMLElement, to: number, ms = 2500): () => void {
  const original = el.textContent;
  const started = gsap.ticker.time;

  const tick = () => {
    const t = Math.min((gsap.ticker.time - started) * 1000 / ms, 1);
    el.textContent = String(Math.floor(t * (2 - t) * to));
    if (t >= 1) gsap.ticker.remove(tick);
  };
  gsap.ticker.add(tick);

  return () => {
    gsap.ticker.remove(tick);
    el.textContent = original;
  };
}
