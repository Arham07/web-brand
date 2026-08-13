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

  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private planeGeometry: THREE.PlaneGeometry;
  private rings: THREE.Group[] = [];
  private lines: THREE.Group[] = [];
  private textures: THREE.Texture[] = [];
  private loader = new THREE.TextureLoader();

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

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.setClearColor(0x000000, 1);
    this.renderer = renderer;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.camera.position.z = 16;

    this.planeGeometry = new THREE.PlaneGeometry(1, 1);
    this.buildRings();

    // --- post pass: scene renders into a target, then a fullscreen quad ---
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
      fragmentShader: POST_FRAGMENT,
      depthTest: false,
      depthWrite: false,
    });
    this.postScene.add(new THREE.Mesh(this.postGeometry, this.postMaterial));

    this.applySize();
    container.appendChild(renderer.domElement);

    // prewarm: compile programs + one warm frame while idle
    renderer.compile(this.scene, this.camera);
    this.renderFrame(0);

    // --- input ---
    this.dragEnabled = !(isCoarsePointer() || isMobileLayout());
    if (this.dragEnabled) {
      container.addEventListener("pointerdown", this.onPointerDown);
      window.addEventListener("pointermove", this.onDragMove);
      window.addEventListener("pointerup", this.onPointerUp);
    } else {
      container.style.touchAction = "pan-y";
    }
    container.addEventListener("pointermove", this.onMouseTrack);
    window.addEventListener("resize", this.onWindowResize);

    // --- render loop gated by proximity ---
    const margin = Math.max(900, Math.round(window.innerHeight * 1.25));
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
    this.container.removeEventListener("pointermove", this.onMouseTrack);

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

  private buildRings() {
    let slot = 0;
    for (let i = 0; i < RING_COUNT; i++) {
      const ring = new THREE.Group();
      const count = RING_UNIT * (i + 1);
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
        line.position.z = -90; // entrance start depth (enterProgress 0)
        line.add(mesh);
        ring.add(line);
        this.lines.push(line);

        this.assignTexture(index, material, mesh, planeHeight);
      }

      this.scene.add(ring);
      this.rings.push(ring);
    }
  }

  private assignTexture(
    index: number,
    material: THREE.MeshBasicMaterial,
    mesh: THREE.Mesh,
    planeHeight: number
  ) {
    const apply = (tex: THREE.Texture, aspect: number) => {
      if (this.disposed) {
        tex.dispose();
        return;
      }
      this.textures.push(tex);
      material.map = tex;
      material.needsUpdate = true;
      mesh.scale.x = planeHeight * aspect;
    };

    this.loader.load(
      textureUrl(index),
      (tex) => {
        const img = tex.image as { width?: number; height?: number } | undefined;
        const aspect =
          img && img.width && img.height ? img.width / img.height : FALLBACK_ASPECT;
        apply(tex, aspect);
      },
      undefined,
      () => apply(makeFallbackTexture(index), FALLBACK_ASPECT)
    );
  }

  private stageSize() {
    return {
      width: this.container.clientWidth || window.innerWidth,
      height: this.container.clientHeight || window.innerHeight,
    };
  }

  private computeDpr() {
    const base = Math.min(window.devicePixelRatio || 1, 2);
    return Math.min(base, isMobileWidth() ? 1.1 : 1.35);
  }

  private applySize() {
    const { width, height } = this.stageSize();
    const dpr = this.computeDpr();
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    const bw = Math.max(1, Math.round(width * dpr));
    const bh = Math.max(1, Math.round(height * dpr));
    this.target.setSize(bw, bh);
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
    for (const line of this.lines) line.position.z = z;

    this.uniforms.iTime.value = (time * 0.001) % 100;
    this.uniforms.uTransitionProgress.value = this.transitionProgress;

    const r = this.renderer;
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

  /** iMouse is uploaded for shader parity (unused in the fragment math). */
  private onMouseTrack = (e: PointerEvent) => {
    const rect = this.container.getBoundingClientRect();
    this.uniforms.iMouse.value.set(
      e.clientX - rect.left,
      rect.height - (e.clientY - rect.top)
    );
  };

  private onWindowResize = () => {
    if (!this.disposed) this.applySize();
  };
}
