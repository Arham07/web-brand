// Three.js "ring gallery" — 72 image planes laid out as 3 concentric,
// counter-rotating rings on the XY plane, rendered through a post pass
// (random-angle RGB shift + film grain + vignette + circular iris wipe).
//
// Plain class: the React side owns the lifecycle and drives the three
// public progress values (tweened by GSAP scroll timelines).

import * as THREE from "three";
import { scrollVelocity } from "@/lib/lenis";
import { isCoarsePointer, isMobileLayout, isMobileWidth } from "@/lib/device";

// r128-era parity: no color-space conversions on textures or output.
THREE.ColorManagement.enabled = false;

const RING_COUNT = 3;
const RING_UNIT = 12; // ring i holds RING_UNIT * (i + 1) planes → 12 / 24 / 36
const TEXTURE_COUNT = 25;
const RING_INSET: readonly number[] = [0.65, 0.8, 0];
const FALLBACK_ASPECT = 320 / 400;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const textureUrl = (index: number) =>
  `/images/core-capabilities/ring/${String((index % TEXTURE_COUNT) + 1).padStart(
    2,
    "0"
  )}.webp`;

function makeFallbackTexture(index: number): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 400;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = `hsl(${(index * 37) % 360}, 8%, 46%)`; // graphite steps, not rainbow
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  return new THREE.CanvasTexture(canvas);
}

const POST_VERTEX = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const POST_FRAGMENT = /* glsl */ `
precision highp float;

uniform sampler2D tDiffuse;
uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float uTransitionProgress;

varying vec2 vUv;

float random(vec2 st) {
  return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec2 uv = vUv;

  // --- chromatic shimmer: random-angle shift, strongest on red ---
  float raw = random(uv + iTime);
  float noise = raw * 0.5 + 0.5;
  vec2 offset = 0.0025 * vec2(cos(noise), sin(noise));
  vec3 col;
  col.r = texture2D(tDiffuse, uv + offset).r;
  col.g = texture2D(tDiffuse, uv + offset * 0.5).g;
  col.b = texture2D(tDiffuse, uv + offset * 0.25).b;

  // --- film grain (±0.0125) ---
  col += (raw - 0.5) * 0.025;

  // --- vignette toward black, intensity 0.8 ---
  float dist = distance(uv, vec2(0.5));
  float vig = pow(smoothstep(0.5, 0.3, dist), 0.6);
  col *= mix(1.0, vig, 0.8);

  // --- circular iris reveal (aspect-corrected SDF) ---
  vec2 p = uv - 0.5;
  p.x *= iResolution.x / max(iResolution.y, 1.0);
  float sdf = length(p) - uTransitionProgress * sqrt(2.2);
  float outside = smoothstep(-0.2, 0.0, sdf);
  col = mix(col, vec3(0.0), outside);

  gl_FragColor = vec4(col, 1.0);
}
`;

/* Mobile variant: single texture tap (no RGB shift) — grain, vignette and
   the iris reveal are kept. Phone GPUs pay 3× texture bandwidth for a
   shimmer that is invisible at that size. */
const POST_FRAGMENT_MOBILE = /* glsl */ `
precision highp float;

uniform sampler2D tDiffuse;
uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float uTransitionProgress;

varying vec2 vUv;

float random(vec2 st) {
  return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec2 uv = vUv;
  float raw = random(uv + iTime);

  vec3 col = texture2D(tDiffuse, uv).rgb;

  // film grain (±0.0125)
  col += (raw - 0.5) * 0.025;

  // vignette toward black, intensity 0.8
  float dist = distance(uv, vec2(0.5));
  float vig = pow(smoothstep(0.5, 0.3, dist), 0.6);
  col *= mix(1.0, vig, 0.8);

  // circular iris reveal (aspect-corrected SDF)
  vec2 p = uv - 0.5;
  p.x *= iResolution.x / max(iResolution.y, 1.0);
  float sdf = length(p) - uTransitionProgress * sqrt(2.2);
  float outside = smoothstep(-0.2, 0.0, sdf);
  col = mix(col, vec3(0.0), outside);

  gl_FragColor = vec4(col, 1.0);
}
`;

interface PostUniforms {
  tDiffuse: { value: THREE.Texture };
  iTime: { value: number };
  iResolution: { value: THREE.Vector2 };
  iMouse: { value: THREE.Vector2 };
  uTransitionProgress: { value: number };
  [uniform: string]: { value: unknown };
}

export class RingGalleryScene {
  /** 0 → iris closed (black), 1 → iris fully open. Tweened by scroll. */
  transitionProgress = 0;
  /** 0 → tiles 90 units behind, 1 → tiles at rest depth. */
  enterProgress = 0;
  /** Spin multiplier — scrubbed 10 → 1 on entrance. */
  rotateSpeed = 10;

  /** captured at construction: mobile trades plane density, post-shader
      taps, DPR and render rate for a stable frame rate on phone GPUs */
  private readonly mobile = isMobileLayout();
  private readonly ringUnit = this.mobile ? 8 : RING_UNIT;
  /* The mobile half-rate cap is gone: it existed to pay for the post pass
     (30fps × 2 fullscreen passes). With the post pass removed, full rate ×
     1 pass costs the same GPU budget — and a slow continuous rotation
     rendered at half rate is exactly what read as "laggy" on a 60/120Hz
     phone display. */
  /** last value pushed to the CSS `--iris` var (mobile iris mask) */
  private irisWritten = -1;

  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private planeGeometry: THREE.PlaneGeometry;
  private rings: THREE.Group[] = [];
  private lines: THREE.Group[] = [];
  private textures: THREE.Texture[] = [];
  private loader = new THREE.TextureLoader();
  /** one shared load per unique texture URL — 72 planes cycle 25 images,
      so per-plane loads meant 47 redundant decodes + GPU uploads */
  private sharedTextures = new Map<
    number,
    Promise<{ tex: THREE.Texture; aspect: number }>
  >();

  private target: THREE.WebGLRenderTarget;
  private postScene: THREE.Scene;
  private postCamera: THREE.OrthographicCamera;
  private postGeometry: THREE.PlaneGeometry;
  private postMaterial: THREE.ShaderMaterial;
  private uniforms: PostUniforms;

  private io: IntersectionObserver;
  private disposed = false;
  private running = false;

  private dragEnabled: boolean;
  private dragging = false;
  private dragDelta = 0;
  private lastX = 0;
  private lastY = 0;

  constructor(container: HTMLElement) {
    this.container = container;

    // antialias off: the scene draws into a render target (no MSAA there
    // anyway) and the only default-framebuffer draw is the post quad —
    // the flag was pure cost
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.setClearColor(0x000000, 1);
    this.renderer = renderer;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.camera.position.z = 16;

    this.planeGeometry = new THREE.PlaneGeometry(1, 1);
    // ring 0 (12 planes) builds now so a warm frame has content; the outer
    // rings (24 + 36 planes) build in idle slices — constructing all 72
    // synchronously was a visible scroll-jank spike ~2200px before the
    // section
    this.buildRing(0);
    this.scheduleRing(1);

    // --- post pass: scene renders into a target, then a fullscreen quad ---
    // (allocated on desktop only — mobile renders straight to the screen)
    this.target = new THREE.WebGLRenderTarget(1, 1);
    this.uniforms = {
      tDiffuse: { value: this.target.texture },
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector2(1, 1) },
      iMouse: { value: new THREE.Vector2(0, 0) },
      uTransitionProgress: { value: 0 },
    };
    this.postScene = new THREE.Scene();
    this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.postGeometry = new THREE.PlaneGeometry(2, 2);
    this.postMaterial = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: POST_VERTEX,
      fragmentShader: this.mobile ? POST_FRAGMENT_MOBILE : POST_FRAGMENT,
      depthTest: false,
      depthWrite: false,
    });
    this.postScene.add(new THREE.Mesh(this.postGeometry, this.postMaterial));

    this.applySize();
    container.appendChild(renderer.domElement);
    // (program compile + warm frame happen after the last idle-built ring
    // — see scheduleRing)

    // --- input ---
    this.dragEnabled = !(isCoarsePointer() || isMobileLayout());
    if (this.dragEnabled) {
      container.addEventListener("pointerdown", this.onPointerDown);
      window.addEventListener("pointermove", this.onDragMove);
      window.addEventListener("pointerup", this.onPointerUp);
    } else {
      container.style.touchAction = "pan-y";
    }
    window.addEventListener("resize", this.onWindowResize);

    // --- render loop gated by proximity ---
    // phones keep the live window tight — the scene used to render across
    // ~2.5 viewports of scroll (all of the cube section and into the gallery)
    const margin = this.mobile
      ? Math.round(window.innerHeight * 0.35)
      : Math.max(900, Math.round(window.innerHeight * 1.25));
    this.io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) this.start();
        else this.stop();
      },
      { rootMargin: `${margin}px 0px ${margin}px 0px` }
    );
    this.io.observe(container);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    this.io.disconnect();

    window.removeEventListener("resize", this.onWindowResize);
    window.removeEventListener("pointermove", this.onDragMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    this.container.removeEventListener("pointerdown", this.onPointerDown);

    for (const ring of this.rings) {
      ring.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          (obj.material as THREE.Material).dispose();
        }
      });
      this.scene.remove(ring);
    }
    this.rings.length = 0;
    this.lines.length = 0;
    this.textures.forEach((t) => t.dispose());
    this.textures.length = 0;

    this.planeGeometry.dispose();
    this.postGeometry.dispose();
    this.postMaterial.dispose();
    this.target.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  // ------------------------------------------------------------------ //

  /** slot base for ring i = unit·(1 + 2 + … + i) — matches the old
      sequential counter across rings */
  private slotBase(i: number) {
    return (this.ringUnit * (i * (i + 1))) / 2;
  }

  private buildRing(i: number) {
    let slot = this.slotBase(i);
    const ring = new THREE.Group();
    const count = this.ringUnit * (i + 1);
    const planeHeight = 1.6 * (0.36 * i + 1);
    const radius = 6.4 * (i + 1) + 2.3 - (RING_INSET[i] ?? 0);

    for (let j = 0; j < count; j++) {
      const index = slot++;
      const material = new THREE.MeshBasicMaterial({ transparent: true });
      const mesh = new THREE.Mesh(this.planeGeometry, material);
      mesh.scale.set(planeHeight * FALLBACK_ASPECT, planeHeight, 1);
      mesh.position.x = radius;
      mesh.rotation.z = -Math.PI / 2;

      // wrapper "line" group: rotating it around Z places the tile
      // tangentially on the circle
      const line = new THREE.Group();
      line.rotation.z = (j / count) * Math.PI * 2;
      // entrance depth lives on the scene, not per line — see renderFrame
      line.add(mesh);
      ring.add(line);
      this.lines.push(line);

      this.assignTexture(index, material, mesh, planeHeight);
    }

    this.scene.add(ring);
    this.rings.push(ring);
  }

  private scheduleRing(i: number) {
    const idle: (cb: () => void) => void =
      "requestIdleCallback" in window
        ? (cb) => (window as Window).requestIdleCallback(() => cb(), { timeout: 700 })
        : (cb) => window.setTimeout(cb, 40);
    idle(() => {
      if (this.disposed) return;
      if (i < RING_COUNT) {
        this.buildRing(i);
        this.scheduleRing(i + 1);
      } else {
        // all rings present — compile programs + one warm frame while idle
        this.renderer.compile(this.scene, this.camera);
        if (!this.running) this.renderFrame(0);
      }
    });
  }

  private loadShared(index: number) {
    const key = index % TEXTURE_COUNT;
    let promise = this.sharedTextures.get(key);
    if (!promise) {
      promise = new Promise((resolve) => {
        this.loader.load(
          textureUrl(index),
          (tex) => {
            this.textures.push(tex);
            const img = tex.image as
              | { width?: number; height?: number }
              | undefined;
            const aspect =
              img && img.width && img.height
                ? img.width / img.height
                : FALLBACK_ASPECT;
            // pre-upload to the GPU while idle — otherwise all uploads
            // happen lazily on first use, mid-entrance, as one hitch
            const idle =
              "requestIdleCallback" in window
                ? (cb: () => void) =>
                    (window as Window).requestIdleCallback(() => cb())
                : (cb: () => void) => window.setTimeout(cb, 30);
            idle(() => {
              if (!this.disposed) this.renderer.initTexture(tex);
            });
            resolve({ tex, aspect });
          },
          undefined,
          () => {
            const tex = makeFallbackTexture(index);
            this.textures.push(tex);
            resolve({ tex, aspect: FALLBACK_ASPECT });
          }
        );
      });
      this.sharedTextures.set(key, promise);
    }
    return promise;
  }

  private assignTexture(
    index: number,
    material: THREE.MeshBasicMaterial,
    mesh: THREE.Mesh,
    planeHeight: number
  ) {
    void this.loadShared(index).then(({ tex, aspect }) => {
      if (this.disposed) return;
      material.map = tex;
      material.needsUpdate = true;
      mesh.scale.x = planeHeight * aspect;
    });
  }

  private stageSize() {
    return {
      width: this.container.clientWidth || window.innerWidth,
      height: this.container.clientHeight || window.innerHeight,
    };
  }

  private computeDpr() {
    const base = Math.min(window.devicePixelRatio || 1, 2);
    return Math.min(base, isMobileWidth() ? 1.0 : 1.35);
  }

  private applySize() {
    const { width, height } = this.stageSize();
    this.appliedW = width;
    this.appliedH = height;
    const dpr = this.computeDpr();
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    const bw = Math.max(1, Math.round(width * dpr));
    const bh = Math.max(1, Math.round(height * dpr));
    if (!this.mobile) this.target.setSize(bw, bh);
    this.uniforms.iResolution.value.set(bw, bh);
  }

  private start() {
    if (this.running || this.disposed) return;
    this.running = true;
    this.renderer.setAnimationLoop(this.renderFrame);
  }

  private stop() {
    if (!this.running) return;
    this.running = false;
    this.renderer.setAnimationLoop(null);
  }

  // ------------------------------------------------------------------ //

  private renderFrame = (time: number) => {
    if (this.disposed) return;

    const scrollDelta = scrollVelocity() * 0.02;
    const boost = 1 + Math.abs(scrollDelta * 10) + Math.abs(this.dragDelta);
    for (let i = 0; i < this.rings.length; i++) {
      const dir = i % 2 === 1 ? -1 : 1;
      this.rings[i]!.rotation.z += 0.0025 * dir * boost * this.rotateSpeed;
    }
    this.dragDelta *= 0.9;

    const z =
      -lerp(0, 100, 1 - this.enterProgress) + lerp(10, 0, this.enterProgress);
    // Every line received the identical z, and the rings only ever rotate
    // about Z — so translating the scene is the same transform for one
    // write instead of 48 (plus 48 fewer matrix updates) per frame.
    this.scene.position.z = z;

    this.uniforms.iTime.value = (time * 0.001) % 100;
    this.uniforms.uTransitionProgress.value = this.transitionProgress;

    const r = this.renderer;
    if (this.mobile) {
      // Straight to the screen: the post pass cost a full-screen shader
      // plus a ~1.2MB render-target resolve every frame — on a tiled
      // mobile GPU that resolve is a pipeline stall, i.e. scroll jitter.
      // The iris is a CSS mask on the canvas and the vignette a static
      // gradient overlay, both driven from `--iris` below.
      if (this.irisWritten !== this.transitionProgress) {
        this.irisWritten = this.transitionProgress;
        this.container.style.setProperty(
          "--iris",
          this.transitionProgress.toFixed(3)
        );
      }
      r.render(this.scene, this.camera);
      return;
    }
    r.setRenderTarget(this.target);
    r.render(this.scene, this.camera);
    r.setRenderTarget(null);
    r.render(this.postScene, this.postCamera);
  };

  private onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    this.dragging = true;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
  };

  private onDragMove = (e: PointerEvent) => {
    if (!this.dragging) return;
    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.dragDelta -= (dx || dy) * 2;
  };

  private onPointerUp = () => {
    this.dragging = false;
  };

  private resizeTimer = 0;
  private appliedW = 0;
  private appliedH = 0;
  /** debounced; a resize here reallocates the render target, so mobile
      URL-bar height jitter must not reach applySize() */
  private onWindowResize = () => {
    if (this.disposed) return;
    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => {
      if (this.disposed) return;
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      if (w === this.appliedW && Math.abs(h - this.appliedH) < 120) return;
      this.applySize();
    }, 200);
  };
}
