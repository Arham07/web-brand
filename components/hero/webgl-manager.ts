import * as THREE from "three";
import { gsap } from "@/lib/gsap";
import { scrollTop } from "@/lib/lenis";
import { heroVertexShader, heroFragmentShader } from "./hero-shaders";
import {
  SLIDES,
  TRANSITION_SECONDS,
  SLEEP_THRESHOLD_VH,
  type SlideData,
} from "./slides-data";

// r128-style raw color pipeline so textures match the reference site.
THREE.ColorManagement.enabled = false;

interface LoadedSlide {
  texture: THREE.Texture;
  video?: HTMLVideoElement;
  width: number;
  height: number;
}

const isMobileMedia = () => window.matchMedia("(max-width: 767px)").matches;

export class WebGLManager {
  private container: HTMLElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.OrthographicCamera;
  private material!: THREE.ShaderMaterial;

  private slides: LoadedSlide[] = [];
  private loading = new Map<number, Promise<LoadedSlide>>();
  private videoBucket!: HTMLDivElement;

  private mouse = new THREE.Vector2();
  private targetMouse = new THREE.Vector2();

  activeIndex = 0;
  private boundA = -1;
  private boundB = -1;
  private transitionToken = 0;
  private paused = false;
  private frameParity = 0;
  private disposed = false;

  private tick = () => this.render();
  private onResize = () => this.resize();
  private onMouseMove = (e: MouseEvent) => {
    this.targetMouse.set(
      (e.clientX / window.innerWidth) * 2 - 1,
      -((e.clientY / window.innerHeight) * 2 - 1)
    );
  };

  constructor(container: HTMLElement) {
    this.container = container;
  }

  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    this.videoBucket = document.createElement("div");
    this.videoBucket.style.cssText =
      "position:absolute;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;";
    this.container.appendChild(this.videoBucket);

    this.material = new THREE.ShaderMaterial({
      vertexShader: heroVertexShader,
      fragmentShader: heroFragmentShader,
      uniforms: {
        uTex1: { value: null },
        uTex2: { value: null },
        uProgress: { value: 0 },
        uDirection: { value: 1 },
        uTexReady: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uImageResolution: { value: new THREE.Vector2(1920, 1080) },
        uImageResolution2: { value: new THREE.Vector2(1920, 1080) },
        uMouse: { value: this.mouse },
      },
    });
    this.scene.add(
      new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    );

    this.resize();
    window.addEventListener("resize", this.onResize);
    window.addEventListener("mousemove", this.onMouseMove);
    gsap.ticker.add(this.tick);

    // slide 0 immediately, slide 1 on the next frame
    this.load(0).then((s) => {
      if (this.disposed) return;
      this.bindA(0, s);
      this.material.uniforms.uTexReady.value = 1;
      this.syncPlayback();
    });
    requestAnimationFrame(() => {
      if (!this.disposed) void this.load(1);
    });
  }

  // ---------------------------------------------------------------- load

  load(index: number): Promise<LoadedSlide> {
    const existing = this.loading.get(index);
    if (existing) return existing;

    const data = SLIDES[index];
    const promise = this.loadMedia(data).then((slide) => {
      this.slides[index] = slide;
      return slide;
    });
    this.loading.set(index, promise);
    return promise;
  }

  private loadMedia(data: SlideData): Promise<LoadedSlide> {
    const mobile = isMobileMedia();
    const videoSrc = mobile ? data.mobileVideo ?? data.video : data.video;
    const imageSrc = mobile ? data.mobileImage ?? data.image : data.image;

    if (videoSrc) {
      return new Promise((resolve) => {
        const video = document.createElement("video");
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = "auto";
        if (mobile) video.autoplay = true;
        video.src = videoSrc;
        this.videoBucket.appendChild(video);

        const texture = new THREE.VideoTexture(video);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const finish = () =>
          resolve({
            texture,
            video,
            width: video.videoWidth || 1920,
            height: video.videoHeight || 1080,
          });

        if (video.readyState >= 2) finish();
        else {
          video.addEventListener("loadeddata", finish, { once: true });
          // slow-network fallback poller
          const poll = () => {
            if (video.readyState >= 2) finish();
            else setTimeout(poll, 400);
          };
          setTimeout(poll, 2500);
        }
        video.play().catch(() => {
          video.addEventListener("canplay", () => video.play().catch(() => {}), {
            once: true,
          });
        });
      });
    }

    return new Promise((resolve) => {
      new THREE.TextureLoader().load(imageSrc!, (texture) => {
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.generateMipmaps = true;
        resolve({
          texture,
          width: texture.image?.width ?? 1920,
          height: texture.image?.height ?? 1080,
        });
      });
    });
  }

  private bindA(index: number, slide: LoadedSlide) {
    this.boundA = index;
    this.material.uniforms.uTex1.value = slide.texture;
    (this.material.uniforms.uImageResolution.value as THREE.Vector2).set(
      slide.width,
      slide.height
    );
  }

  private bindB(index: number, slide: LoadedSlide) {
    this.boundB = index;
    this.material.uniforms.uTex2.value = slide.texture;
    (this.material.uniforms.uImageResolution2.value as THREE.Vector2).set(
      slide.width,
      slide.height
    );
  }

  // ---------------------------------------------------------- transition

  async transition(
    from: number,
    to: number,
    direction: 1 | -1
  ): Promise<boolean> {
    const token = ++this.transitionToken;
    const [a, b] = await Promise.all([this.load(from), this.load(to)]);
    if (token !== this.transitionToken || this.disposed) return false;

    this.bindA(from, a);
    this.bindB(to, b);
    this.material.uniforms.uDirection.value = direction;
    this.material.uniforms.uProgress.value = 0;
    a.video?.play().catch(() => {});
    b.video?.play().catch(() => {});

    return new Promise((resolve) => {
      gsap.to(this.material.uniforms.uProgress, {
        value: 1,
        duration: TRANSITION_SECONDS,
        ease: "expo.inOut",
        onComplete: () => {
          if (token !== this.transitionToken || this.disposed) {
            resolve(false);
            return;
          }
          this.bindA(to, b);
          this.boundB = -1;
          this.material.uniforms.uProgress.value = 0;
          this.activeIndex = to;
          this.syncPlayback();
          resolve(true);
        },
      });
    });
  }

  /** only the active slide's video plays (both endpoints during a transition) */
  private syncPlayback() {
    this.slides.forEach((slide, i) => {
      if (!slide?.video) return;
      if (i === this.activeIndex) slide.video.play().catch(() => {});
      else slide.video.pause();
    });
  }

  // -------------------------------------------------------------- render

  private render() {
    if (this.disposed) return;

    const asleep = scrollTop() > SLEEP_THRESHOLD_VH * window.innerHeight;
    if (asleep !== this.paused) {
      this.paused = asleep;
      this.container.style.visibility = asleep ? "hidden" : "";
      if (asleep) {
        this.slides.forEach((s) => s?.video?.pause());
      } else {
        this.syncPlayback();
      }
    }
    if (this.paused) return;

    // mobile renders at half rate
    if (window.innerWidth <= 768 && (this.frameParity ^= 1)) return;

    this.mouse.lerp(this.targetMouse, 0.05);

    for (const i of [this.boundA, this.boundB]) {
      const slide = this.slides[i];
      if (slide?.video && slide.video.readyState >= 2) {
        slide.texture.needsUpdate = true;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  private resize() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h);
    (this.material.uniforms.uResolution.value as THREE.Vector2).set(
      w * this.renderer.getPixelRatio(),
      h * this.renderer.getPixelRatio()
    );
  }

  dispose() {
    this.disposed = true;
    this.transitionToken++;
    gsap.ticker.remove(this.tick);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("mousemove", this.onMouseMove);
    this.slides.forEach((s) => {
      s?.video?.pause();
      s?.texture.dispose();
    });
    this.material?.dispose();
    this.renderer?.dispose();
    this.renderer?.domElement.remove();
    this.videoBucket?.remove();
  }
}
