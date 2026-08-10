# web-brand — American Web Guild

The **American Web Guild** site, a Next.js build with smooth-scroll
storytelling via Lenis, GSAP ScrollTrigger choreography, and three.js WebGL
scenes — the animation techniques were originally studied from
[nudot.com.tw](https://nudot.com.tw). All media currently mirrors that
reference site as **placeholders**; swap files under `public/images/` with
your own assets (same names/paths) when ready. Domain, email and social
links throughout the codebase are also placeholders (`americanwebguild.com`,
`hello@americanwebguild.com`, `#`) — search for `TODO` to find them.

## Stack

- **Next.js 16** (App Router) + TypeScript + React 19
- **Lenis** smooth scroll (singleton in `lib/lenis.ts`, driven by `gsap.ticker`;
  disabled on touch devices — native scroll fallback everywhere)
- **GSAP 3.15** + ScrollTrigger (+ Flip & ScrambleText, desktop-only, lazy-loaded)
- **three.js** — hero slide transition shader + ring-gallery scene
  (color management disabled for r128-parity rendering)
- Fonts via `next/font/google`: DM Sans (body), Zalando Sans SemiExpanded
  (display), Bitcount Grid Single (dot-matrix accent)

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

## Refresh placeholder assets

```bash
node scripts/download-assets.mjs   # mirrors the manifest into public/, skips existing
```

Missing files are listed in `missing-assets.json` and get generated SVG stand-ins.

## Page anatomy (home)

1. **Loader** — CSS-keyframe N▶D boot screen; dispatches
   `nudot:hero-reveal` (2.7s) and `nudot:loader-dismissed` (3.2s)
2. **Hero** — fullscreen WebGL slider (noise-warp + chromatic aberration
   transition), overlay typography in `mix-blend-mode: difference`,
   equalizer scrubber + filmstrip
3. **Dark wrapper** — 600vh pinned sequence driven by a single ticker
   state machine (`components/dark-wrapper/sequencer.ts`): curtain reveal →
   dual-wave word columns → velocity-reactive marquee → CSS 3D cube
   tumble / spin / zoom
4. **STM** — scramble-text mosaic scrolling over the pinned cube (desktop);
   velocity-reactive 3D cube section on mobile
5. **CCAP** — three.js ring gallery (72 planes, 3 counter-rotating rings,
   RGB-shift/grain/vignette/iris post pass) under reveal-wrap typography
6. **S3 gallery** — sticky header + 6 parallax work cards
7. **Footer** — staged reveal timeline, giant © bridge, fixed-attachment
   parallax band
8. **Page transitions** — 17×9 pixel grid blooming from center on route change

## Conventions

- Global CSS with stable class names (JS toggles classes by string) —
  tokens in `styles/tokens.css`
- Animated sections are client components with SSR'd DOM; canvas-only code is
  `next/dynamic` + `ssr:false`
- Lazy media via `data-lazy-video` / `data-defer-src` attributes
  (`lib/lazy-media.ts`)
