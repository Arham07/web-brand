"use client";

import { Fragment, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { isCoarsePointer, isMobileWidth } from "@/lib/device";
import { easeInOutCubic } from "@/lib/ease";
import { useSectionNear } from "@/hooks/useSectionNear";
import { STM_GROUPS } from "./stm-data";

/** ScrollTrigger attaches itself to the animation it drives at runtime. */
type WithTrigger = gsap.core.Timeline & { scrollTrigger?: ScrollTrigger };

/**
 * Desktop-only effects, per `.stm-el`:
 *  A) scramble-in on every enter/enter-back through the viewport;
 *  B) scrubbed Flip swap between the base pos class and the alt pos class,
 *     peaking at viewport center (base→alt on the way in, alt→base on the
 *     way out);
 * plus the exit hand-off that shrinks/fades `.stm-content` as the next
 * section slides over.
 */
function initStmEffects(section: HTMLElement): () => void {
  let disposed = false;
  const triggers: ScrollTrigger[] = [];
  const flips: WithTrigger[] = [];
  const content = section.querySelector<HTMLElement>(".stm-content");

  void (async () => {
    const [{ ScrambleTextPlugin }, { Flip }] = await Promise.all([
      import("gsap/ScrambleTextPlugin"),
      import("gsap/Flip"),
    ]);
    if (disposed) return;
    gsap.registerPlugin(ScrambleTextPlugin, Flip);

    for (const el of Array.from(
      section.querySelectorAll<HTMLElement>(".stm-el")
    )) {
      // A) scramble-in, re-run on each pass through the viewport
      const finalText = el.textContent ?? "";
      const duration = Number(el.dataset.stmScramble ?? 1);
      const scrambleIn = () => {
        gsap.fromTo(
          el,
          { scrambleText: { text: "", chars: "" } },
          {
            duration,
            scrambleText: {
              text: finalText,
              chars: "upperAndLowerCase",
              revealDelay: 0,
            },
          }
        );
      };
      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          onEnter: scrambleIn,
          onEnterBack: scrambleIn,
        })
      );

      // B) scrubbed Flip position swap
      const altClass = el.dataset.stmAlt;
      if (!altClass) continue;
      const baseClass = Array.from(el.classList).find((c) =>
        /^stm-pos-\d+$/.test(c)
      );
      if (!baseClass || baseClass === altClass) continue; // same slot: no drift

      el.classList.remove(baseClass);
      el.classList.add(altClass);
      const altState = Flip.getState(el, { props: "opacity,filter,width" });
      el.classList.remove(altClass);
      el.classList.add(baseClass);

      const ease = el.dataset.stmFlipEase || "expo.inOut";

      // base → alt while the line travels viewport bottom → center…
      flips.push(
        Flip.to(altState, {
          ease,
          scrollTrigger: {
            trigger: el,
            start: "clamp(bottom bottom-=10%)",
            end: "clamp(center center)",
            scrub: true,
          },
        }) as WithTrigger
      );
      // …then alt → base as it continues center → top.
      flips.push(
        Flip.from(altState, {
          ease,
          scrollTrigger: {
            trigger: el,
            start: "clamp(center center)",
            end: "clamp(top top)",
            scrub: true,
          },
        }) as WithTrigger
      );
    }

    // Exit hand-off: shrink/fade the whole field under the incoming section.
    if (content) {
      triggers.push(
        ScrollTrigger.create({
          trigger: section,
          start: "bottom bottom",
          end: "bottom top",
          scrub: 0.35,
          onUpdate: (self) => {
            const e = easeInOutCubic(self.progress);
            gsap.set(content, {
              scale: 1 - 0.04 * e,
              y: -18 * e,
              opacity: 1 - 0.78 * e,
            });
          },
        })
      );
    }
  })();

  return () => {
    disposed = true;
    for (const tl of flips) {
      tl.scrollTrigger?.kill();
      tl.kill();
    }
    for (const t of triggers) t.kill();
    gsap.killTweensOf(section.querySelectorAll(".stm-el"));
    if (content) gsap.set(content, { clearProps: "transform,opacity" });
  };
}

/**
 * STM section — the scramble-text keyword field that scrolls over the
 * pinned dark-wrapper cube backdrop. Desktop only: CSS hides it ≤768px
 * and all JS is skipped on coarse pointers / narrow viewports.
 */
export default function StmSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useSectionNear(sectionRef, () => {
    if (isCoarsePointer() || isMobileWidth()) return;
    const section = sectionRef.current;
    if (!section) return;
    return initStmEffects(section);
  });

  return (
    <section className="stm-section" id="stm-section" ref={sectionRef}>
      <div className="stm-content">
        {STM_GROUPS.map((items, gi) => (
          <div className="stm-group" key={gi}>
            {items.map((item, ii) => (
              <Fragment key={ii}>
                <div
                  className={`stm-el stm-pos-${item.pos}${
                    item.xl ? " stm-el--xl" : ""
                  }`}
                  data-stm-alt={`stm-pos-${item.alt}`}
                  data-stm-scramble={
                    item.scramble !== undefined
                      ? String(item.scramble)
                      : undefined
                  }
                  data-stm-flip-ease={item.flipEase}
                >
                  {item.text}
                </div>
                {item.typing ? (
                  <span className="stm-typing" aria-hidden="true">
                    █
                  </span>
                ) : null}
              </Fragment>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
