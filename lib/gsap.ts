import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ limitCallbacks: true, ignoreMobileResize: true });

  // Dev-only handles so scroll choreography can be inspected from the console.
  if (process.env.NODE_ENV !== "production") {
    Object.assign(window, { __gsap: gsap, __ScrollTrigger: ScrollTrigger });
  }
}

export { gsap, ScrollTrigger };
