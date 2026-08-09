"use client";

// Generic `data-reveal` masked-reveal initializer.
//
//   data-reveal="word"  → innerText split on whitespace; every word wrapped in
//                         span(overflow clip) > span(inline-block); inners tween
//                         yPercent 130 → 0, 1.2s power4.out, stagger 0.08
//   data-reveal="fade"  → autoAlpha 0 / y 28 → 1 / 0, 1.1s power3.out
//
// Optional attrs: data-reveal-delay (s), data-reveal-stagger (word only).
// Trigger: element `top 85%`, once. Elements already past that line at init
// snap straight to their final state (no trigger created).
//
// StrictMode-safe: word splitting is idempotent (marked via data-reveal-split);
// re-running reuses the existing spans. Returns the created ScrollTriggers so
// callers can kill them on cleanup (killing inside a gsap.context also works —
// tweens are created synchronously).

import { gsap, ScrollTrigger } from "@/lib/gsap";

function splitWords(el: HTMLElement): HTMLElement[] {
  if (el.dataset.revealSplit) {
    return Array.from(el.querySelectorAll<HTMLElement>(".reveal-word-inner"));
  }
  el.dataset.revealSplit = "1";

  const words = (el.textContent ?? "").trim().split(/\s+/).filter(Boolean);
  el.textContent = "";

  const inners: HTMLElement[] = [];
  words.forEach((word, i) => {
    if (i > 0) el.appendChild(document.createTextNode(" "));
    const outer = document.createElement("span");
    outer.className = "reveal-word";
    outer.style.display = "inline-block";
    outer.style.overflow = "clip";
    const inner = document.createElement("span");
    inner.className = "reveal-word-inner";
    inner.style.display = "inline-block";
    inner.textContent = word;
    outer.appendChild(inner);
    el.appendChild(outer);
    inners.push(inner);
  });
  return inners;
}

export function initReveals(root: HTMLElement): ScrollTrigger[] {
  const triggers: ScrollTrigger[] = [];
  const alreadyPast = (el: HTMLElement) =>
    el.getBoundingClientRect().top < window.innerHeight * 0.85;

  root.querySelectorAll<HTMLElement>('[data-reveal="word"]').forEach((el) => {
    const inners = splitWords(el);
    if (!inners.length) return;

    if (alreadyPast(el)) {
      gsap.set(inners, { yPercent: 0 });
      return;
    }
    const tween = gsap.fromTo(
      inners,
      { yPercent: 130 },
      {
        yPercent: 0,
        duration: 1.2,
        ease: "power4.out",
        stagger: parseFloat(el.dataset.revealStagger ?? "0.08"),
        delay: parseFloat(el.dataset.revealDelay ?? "0"),
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      }
    );
    if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
  });

  root.querySelectorAll<HTMLElement>('[data-reveal="fade"]').forEach((el) => {
    if (alreadyPast(el)) {
      gsap.set(el, { autoAlpha: 1, y: 0 });
      return;
    }
    const tween = gsap.fromTo(
      el,
      { autoAlpha: 0, y: 28 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 1.1,
        ease: "power3.out",
        delay: parseFloat(el.dataset.revealDelay ?? "0"),
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      }
    );
    if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
  });

  return triggers;
}
