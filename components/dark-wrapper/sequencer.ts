import { gsap } from "@/lib/gsap";
import { scrollTop } from "@/lib/lenis";
import { clamp01, easeInOutCubic } from "@/lib/ease";
import { hydrateVideosIn } from "@/lib/lazy-media";
import { MarqueeEngine } from "./marquee";

// phase boundaries (progress 0..1 over 500vh of scroll)
const P_REVEAL = 0.12;
const P_TEXT_OUT = 0.44;
const P_TUMBLE = 0.6;
const P_SPIN = 0.78;

const CUBE_BASE = 230;
const CUBE_TUMBLE_SCALE = 1.5;

interface Els {
  track: HTMLElement;
  mask: HTMLElement;
  wrapper: HTMLElement;
  blackOverlay: HTMLElement;
  glow1: HTMLElement;
  glow2: HTMLElement;
  scrollIndicator: HTMLElement;
  introPanel: HTMLElement;
  ipHeader: HTMLElement;
  ipHeaderTitle: HTMLElement;
  waveWrapper: HTMLElement;
  waveLeft: HTMLElement[];
  waveRight: HTMLElement[];
  waveThumb: HTMLImageElement;
  s2Content: HTMLElement;
  s2Masks: HTMLElement[]; // mask inners in reveal order (marquee row)
  ntg: HTMLElement;
  ntgRows: HTMLElement[];
  sceneWrapper: HTMLElement;
  scene: HTMLElement;
  cube: HTMLElement;
  faces: HTMLElement[];
  marqueeInner: HTMLElement;
}

/**
 * The 600vh pinned scroll choreography, driven by a single gsap.ticker
 * callback lerping toward the real scroll position — not ScrollTrigger.
 */
export class DarkWrapperSequencer {
  private els: Els;
  private marquee: MarqueeEngine;
  private target = 0;
  private current = 0;
  private settled = false;
  private baseRotY = 0;
  private targetYPhase1 = 360;
  private lazyFired = false;
  private focusedIndex = -1;
  private marqueeRunning = false;
  private waveXTo: Array<(v: number) => void> = [];
  private destroyed = false;

  private tick = () => this.update();

  constructor(els: Els) {
    this.els = els;
    this.marquee = new MarqueeEngine(els.marqueeInner, { dir: -1, baseSpeed: 1 });
  }

  init() {
    this.marquee.init();
    this.waveXTo = [...this.els.waveLeft, ...this.els.waveRight].map((el) =>
      gsap.quickTo(el, "x", { duration: 0.6, ease: "power4.out" })
    );
    this.applyStatic();
    gsap.ticker.add(this.tick);
    // debug hook: lets tests pump frames when rAF is throttled
    (window as unknown as { __dwSeq?: DarkWrapperSequencer }).__dwSeq = this;
  }

  /** test helper — advance the state machine n frames without rAF */
  pump(n = 1) {
    for (let i = 0; i < n; i++) this.update();
  }

  destroy() {
    this.destroyed = true;
    gsap.ticker.remove(this.tick);
    this.marquee.destroy();
  }

  /** initial parked state */
  private applyStatic() {
    const { els } = this;
    gsap.set(els.mask, { clipPath: "inset(100% 0 0 0)" });
    gsap.set([els.glow1, els.glow2], { opacity: 0, scale: 0.4, visibility: "hidden" });
    gsap.set(els.scrollIndicator, { opacity: 0 });
    gsap.set(els.introPanel, { opacity: 0, visibility: "hidden" });
    gsap.set(els.ipHeaderTitle, { yPercent: 110 });
    gsap.set(els.s2Content, { opacity: 0 });
    gsap.set(els.s2Masks, { yPercent: 130 });
    gsap.set(els.ntg, { opacity: 0 });
    gsap.set(els.ntgRows, { yPercent: 130 });
    gsap.set(els.blackOverlay, { opacity: 0 });
    this.applyCube(0.0001, -15, 0, CUBE_BASE, 1, 40, 0.05);
  }

  private update() {
    if (this.destroyed) return;
    if (window.innerWidth <= 767) return; // CSS hides the whole mechanism

    const maxScroll = this.els.track.offsetHeight - window.innerHeight;
    if (maxScroll <= 0) return;
    this.target = clamp01(scrollTop() / maxScroll);

    const delta = this.target - this.current;
    if (Math.abs(delta) < 0.0001) {
      if (this.settled) return; // frame-skip
      this.settled = true;
      this.current = this.target;
    } else {
      this.settled = false;
      this.current += delta * 0.1;
    }

    const p = this.current;

    if (!this.lazyFired && p > 0.035) {
      this.lazyFired = true;
      hydrateVideosIn(this.els.wrapper);
    }

    this.phaseReveal(p);
    this.phaseIntroPanel(p);
    this.phaseSection2(p);
    this.phaseCube(p);
    this.syncMarquee(p);
  }

  // ---------------------------------------------------- phase A: curtain

  private phaseReveal(p: number) {
    const { els } = this;
    const pr = clamp01(p / P_REVEAL);
    const ease = easeInOutCubic(pr);
    gsap.set(els.mask, { clipPath: `inset(${(1 - ease) * 100}% 0 0 0)` });

    // cube pre-spin while hidden
    if (p <= P_REVEAL) {
      this.baseRotY += 0.4;
      this.targetYPhase1 = Math.ceil(this.baseRotY / 360) * 360 + 360;
    }

    const uiT = easeInOutCubic(clamp01((pr - 0.6) / 0.4));
    gsap.set(els.glow1, {
      opacity: uiT,
      scale: 0.4 + uiT * 0.6,
      visibility: uiT > 0 ? "visible" : "hidden",
    });
    gsap.set(els.glow2, {
      opacity: uiT * 0.8,
      scale: 0.4 + uiT * 0.6,
      visibility: uiT > 0 ? "visible" : "hidden",
    });
    gsap.set(els.scrollIndicator, { opacity: uiT * 0.7 });
  }

  // ------------------------------------------------ phase B: intro panel

  private phaseIntroPanel(p: number) {
    const { els } = this;
    const pr = clamp01(p / P_REVEAL);

    if (p >= P_TEXT_OUT) {
      // hard reset past the phase
      gsap.set(els.introPanel, { opacity: 0, visibility: "hidden" });
      gsap.set(els.ipHeaderTitle, { yPercent: 110 });
      return;
    }

    // pre-fade during the reveal phase
    const waveRp = clamp01((pr - 0.45) / 0.55);
    const panelVisible = waveRp > 0;
    const panelT = p <= P_REVEAL ? 0 : clamp01((p - P_REVEAL) / (P_TEXT_OUT - P_REVEAL));

    const ndIn = easeInOutCubic(
      clamp01(panelT > 0 ? 1 : (waveRp - 0.3) / 0.65)
    );
    const ndOut = easeInOutCubic(clamp01((panelT - 0.84) / 0.16));
    const outT = easeInOutCubic(clamp01((panelT - 0.83) / 0.17));

    gsap.set(els.introPanel, {
      opacity: panelVisible ? 1 - outT : 0,
      visibility: panelVisible ? "visible" : "hidden",
    });
    gsap.set(els.ipHeaderTitle, { yPercent: (1 - ndIn) * 110 });
    gsap.set(els.ipHeader, { opacity: ndIn * (1 - ndOut) });

    if (!panelVisible) return;

    // vertical travel of the whole wave wrapper
    const wrapperH = els.waveWrapper.offsetHeight || 1;
    gsap.set(els.waveWrapper, { y: wrapperH * (0.5 - panelT) });

    // sine x-offsets, mirrored between columns
    const applyColumn = (items: HTMLElement[], sign: 1 | -1, offset: number) => {
      const colWidth = items[0]?.parentElement?.offsetWidth ?? 0;
      const widest = Math.max(...items.map((el) => el.offsetWidth), 1);
      const max = Math.max(0, colWidth - widest);
      items.forEach((el, i) => {
        const phase = 12 * i + panelT * Math.PI * 2 - Math.PI / 2;
        const x = ((Math.sin(phase) + 1) / 2) * max;
        this.waveXTo[offset + i]?.(x * sign);
      });
    };
    applyColumn(els.waveLeft, 1, 0);
    applyColumn(els.waveRight, -1, els.waveLeft.length);

    // focused row + thumbnail swap
    const focused = Math.round(panelT * 11);
    if (focused !== this.focusedIndex) {
      this.focusedIndex = focused;
      els.waveLeft.forEach((el, i) =>
        el.classList.toggle("focused", i === focused)
      );
      els.waveRight.forEach((el, i) =>
        el.classList.toggle("focused", i === focused)
      );
      const img = els.waveLeft[focused]?.dataset.image;
      if (img && els.waveThumb.getAttribute("src") !== img) {
        els.waveThumb.src = img;
      }
    }
  }

  // -------------------------------------- phase C: section-2 titles + exit

  private phaseSection2(p: number) {
    const { els } = this;

    if (p < P_TEXT_OUT) {
      gsap.set(els.s2Content, { opacity: 0 });
      gsap.set(els.s2Masks, { yPercent: 130 });
      gsap.set(els.ntg, { opacity: 0 });
      gsap.set(els.ntgRows, { yPercent: 130 });
      gsap.set(els.blackOverlay, { opacity: 0 });
      return;
    }

    gsap.set(els.s2Content, { opacity: 1 });

    // reveal window
    const revealPr = clamp01((p - P_TEXT_OUT) / 0.28);
    const zoomEase = easeInOutCubic(clamp01((p - P_SPIN) / (1 - P_SPIN)));

    els.s2Masks.forEach((mask, i) => {
      // marquee row window 0.08→0.50 (single visible row in this build)
      const winStart = 0.08 + i * 0.1;
      const winEnd = 0.5 + i * 0.1;
      const inT = easeInOutCubic(clamp01((revealPr - winStart) / (winEnd - winStart)));
      // exit during zoom: slide up and out
      const exitT = easeInOutCubic(clamp01((zoomEase - 0.1 * i) / (1 - 0.1 * i || 1)));
      const y = zoomEase > 0 ? -130 * exitT : 130 * (1 - inT);
      gsap.set(mask, { yPercent: y });
    });

    gsap.set(els.s2Content, { opacity: 1 - zoomEase });

    // new-text-group enters inside the zoom
    const enterPr = clamp01(zoomEase / 0.7);
    gsap.set(els.ntg, { opacity: enterPr });
    els.ntgRows.forEach((row, i) => {
      const start = [0, 0.1, 0.2, 0.35][i] ?? 0;
      const t = easeInOutCubic(clamp01((enterPr - start) / 0.6));
      gsap.set(row, { yPercent: 130 * (1 - t) });
    });
  }

  // ----------------------------------------------------- the 3D cube

  private phaseCube(p: number) {
    if (p <= P_TEXT_OUT) {
      this.applyCube(0.0001, -15, this.baseRotY, CUBE_BASE, 1, 40, 0.05);
      return;
    }

    if (p <= P_TUMBLE) {
      // tumble: fly in with a full X somersault + at least one Y turn
      const t = easeInOutCubic((p - P_TEXT_OUT) / (P_TUMBLE - P_TEXT_OUT));
      const scale = 0.0001 + t * (CUBE_TUMBLE_SCALE - 0.0001);
      const rotX = -15 + t * 375; // −15 → 360
      const rotY = this.baseRotY + t * (this.targetYPhase1 - this.baseRotY);
      this.applyCube(scale, rotX, rotY, CUBE_BASE, 1, 40, 0.05);
      gsap.set(this.els.blackOverlay, { opacity: 0 });
      return;
    }

    if (p <= P_SPIN) {
      // spin: one more full Y revolution at rest scale
      const t = easeInOutCubic((p - P_TUMBLE) / (P_SPIN - P_TUMBLE));
      const rotY = this.targetYPhase1 + t * 360;
      this.applyCube(CUBE_TUMBLE_SCALE, 360, rotY, CUBE_BASE, 1, 40, 0.05);
      gsap.set(this.els.blackOverlay, { opacity: 0 });
      return;
    }

    // zoom: swap scale-zoom for size-zoom, front face square to camera
    const t = easeInOutCubic((p - P_SPIN) / (1 - P_SPIN));
    const fromSize = CUBE_BASE * CUBE_TUMBLE_SCALE;
    const toSize =
      Math.min(window.innerWidth * 0.44, window.innerHeight * 0.72) * 0.9;
    const size = fromSize + t * (toSize - fromSize);
    const shadow = 40 * (1 - t);
    const borderAlpha = 0.05 * (1 - t);
    this.applyCube(1, 360, this.targetYPhase1 + 360, size, 1, shadow, borderAlpha);
    gsap.set(this.els.blackOverlay, { opacity: t });
  }

  private applyCube(
    scale: number,
    rotX: number,
    rotY: number,
    size: number,
    wrapperScale: number,
    shadowPx: number,
    borderAlpha: number
  ) {
    const { els } = this;
    els.scene.style.setProperty("--scene-size", `${size}px`);
    els.scene.style.setProperty("--scene-depth", `${size / 2}px`);
    gsap.set(els.cube, { rotationX: rotX, rotationY: rotY, rotationZ: 0 });
    gsap.set(els.sceneWrapper, {
      xPercent: -50,
      yPercent: -50,
      scale: scale * wrapperScale,
      top: "50%",
      left: "50%",
    });
    els.faces.forEach((face) => {
      face.style.boxShadow = `inset 0 0 ${shadowPx}px rgba(0,0,0,1)`;
      face.style.borderColor = `rgba(255,255,255,${borderAlpha})`;
    });
  }

  // ------------------------------------------------------------ marquee

  private syncMarquee(p: number) {
    const shouldRun = p > P_TEXT_OUT && p < 1;
    if (shouldRun && !this.marqueeRunning) {
      this.marqueeRunning = true;
      this.marquee.start();
    } else if (!shouldRun && this.marqueeRunning) {
      this.marqueeRunning = false;
      this.marquee.stop();
    }
  }
}
