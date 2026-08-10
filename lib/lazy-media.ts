// Attribute-driven lazy media hydration.
//
//   <video data-lazy-video ...><source data-src="…"></video>
//     data-lazy-priority="high"  → hydrate on first rAF after init
//     data-lazy-on-scroll="true" → hydrate on first user intent (or 5s timeout)
//     otherwise                  → hydrate when near viewport (IO)
//   <img data-defer-src="…">     → hydrate on first user intent (or 5s timeout)
//
// Hydration is spread across frames (1 video + 2 images per rAF).

let started = false;

export function initLazyMedia() {
  if (started || typeof window === "undefined") return;
  started = true;

  const hydrateVideo = (video: HTMLVideoElement) => {
    if (video.dataset.hydrated) return;
    video.dataset.hydrated = "1";
    let changed = false;
    video.querySelectorAll<HTMLSourceElement>("source[data-src]").forEach((s) => {
      s.src = s.dataset.src!;
      changed = true;
    });
    if (changed) {
      video.load();
      if (video.autoplay) video.play().catch(() => {});
    }
  };

  const hydrateImg = (img: HTMLImageElement) => {
    if (img.dataset.hydrated || !img.dataset.deferSrc) return;
    img.dataset.hydrated = "1";
    img.src = img.dataset.deferSrc;
  };

  const visible = (el: HTMLElement) =>
    "checkVisibility" in el ? el.checkVisibility() : true;

  // --- priority: first rAF ---
  requestAnimationFrame(() => {
    document
      .querySelectorAll<HTMLVideoElement>('video[data-lazy-video][data-lazy-priority="high"]')
      .forEach((v) => visible(v) && hydrateVideo(v));
  });

  // --- intent-gated batch ---
  let intentFired = false;
  const onIntent = () => {
    if (intentFired) return;
    intentFired = true;
    removeIntentListeners();

    const videos = [
      ...document.querySelectorAll<HTMLVideoElement>(
        'video[data-lazy-video][data-lazy-on-scroll="true"]'
      ),
    ].filter(visible);
    const imgs = [
      ...document.querySelectorAll<HTMLImageElement>("img[data-defer-src]"),
    ].filter(visible);

    // one video + two images per frame, whichever queue still has work
    const step = () => {
      const v = videos.shift();
      if (v) hydrateVideo(v);
      for (let i = 0; i < 2; i++) {
        const img = imgs.shift();
        if (img) hydrateImg(img);
      }
      if (videos.length || imgs.length) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const keyIntent = (e: KeyboardEvent) => {
    if (["ArrowDown", "PageDown", " ", "End"].includes(e.key)) onIntent();
  };
  const scrollIntent = () => {
    if (window.scrollY > 8) onIntent();
  };
  const removeIntentListeners = () => {
    window.removeEventListener("wheel", onIntent);
    window.removeEventListener("touchstart", onIntent);
    window.removeEventListener("scroll", scrollIntent);
    window.removeEventListener("keydown", keyIntent);
  };
  window.addEventListener("wheel", onIntent, { passive: true });
  window.addEventListener("touchstart", onIntent, { passive: true });
  window.addEventListener("scroll", scrollIntent, { passive: true });
  window.addEventListener("keydown", keyIntent);
  setTimeout(onIntent, 5000);

  // --- proximity-gated videos (everything else) ---
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          hydrateVideo(e.target as HTMLVideoElement);
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: "280px 0px 420px 0px" }
  );
  document
    .querySelectorAll<HTMLVideoElement>(
      "video[data-lazy-video]:not([data-lazy-priority]):not([data-lazy-on-scroll])"
    )
    .forEach((v) => io.observe(v));
}

/** Force-hydrate every lazy video inside a container (e.g. dark wrapper at progress 0.035). */
export function hydrateVideosIn(container: HTMLElement) {
  container
    .querySelectorAll<HTMLVideoElement>("video[data-lazy-video]")
    .forEach((video) => {
      if (video.dataset.hydrated) return;
      video.dataset.hydrated = "1";
      video.querySelectorAll<HTMLSourceElement>("source[data-src]").forEach((s) => {
        s.src = s.dataset.src!;
      });
      video.load();
      if (video.autoplay) video.play().catch(() => {});
    });
}

/**
 * Force-hydrate every deferred image inside a container. The global engine's
 * intent-gated batch only queries the DOM once per full page load, so sections
 * remounted by a client-side navigation must call this from their own init.
 */
export function hydrateImagesIn(container: HTMLElement) {
  container
    .querySelectorAll<HTMLImageElement>("img[data-defer-src]")
    .forEach((img) => {
      if (img.dataset.hydrated || !img.dataset.deferSrc) return;
      img.dataset.hydrated = "1";
      img.src = img.dataset.deferSrc;
    });
}
