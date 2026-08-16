/**
 * The surface the slideshow controller drives. Two implementations exist:
 *
 *   WebGLManager     — desktop: three.js, noise-warp + chromatic transition
 *   DomSlideRenderer — phones: plain <video>/<img> layers, CSS crossfade
 *
 * The WebGL path uploads a full video frame as a texture on every rendered
 * frame (≈35-47 MB/s at mobile video sizes) and runs a fullscreen 6-tap
 * shader on top — the dominant cause of scroll jitter in the first
 * viewport on phones, which is exactly where ad traffic lands. The DOM path
 * hands the same media to the compositor, which can use the hardware video
 * overlay and costs effectively nothing while idle.
 */
export interface SlideRenderer {
  /** Build the renderer, load slides 0 and 1, dispatch `nudot:hero-gl-ready`. */
  init(): void;
  /** Memoised — called repeatedly on thumbnail hover. */
  load(index: number): Promise<unknown>;
  /** Resolves when the transition finishes (the slideshow unlocks its UI on it). */
  transition(from: number, to: number, direction: 1 | -1): Promise<boolean>;
  dispose(): void;
}
