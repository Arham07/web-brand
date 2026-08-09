"use client";

import { useEffect, useRef } from "react";
import { DarkWrapperSequencer } from "./sequencer";
import {
  WAVE_LEFT,
  WAVE_RIGHT,
  WAVE_GLOSS,
  MARQUEE_ITEMS,
  CUBE_FACES,
} from "./wave-data";

function WaveItem({ text, image }: { text: string; image?: string }) {
  return (
    <div className="animated-text" data-image={image}>
      <span className="flip-wrap">
        <span className="at-primary">{text}</span>
        <span className="at-gloss" aria-hidden="true">
          {WAVE_GLOSS[text] ?? text}
        </span>
      </span>
    </div>
  );
}

/**
 * The pinned dark sequence that covers the hero: curtain reveal → dual wave
 * → marquee → 3D cube tumble/spin/zoom. Desktop only (CSS hides ≤767px).
 */
export default function DarkWrapper() {
  const maskRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mask = maskRef.current;
    const track = mask?.closest<HTMLElement>(".scroll-track");
    if (!mask || !track) return;

    const q = <T extends HTMLElement>(sel: string) =>
      mask.querySelector<T>(sel)!;
    const qa = <T extends HTMLElement>(sel: string) => [
      ...mask.querySelectorAll<T>(sel),
    ];

    const sequencer = new DarkWrapperSequencer({
      track,
      mask,
      wrapper: q(".dark-wrapper"),
      blackOverlay: q("#dw-black-overlay"),
      glow1: q("#ui-glow1"),
      glow2: q("#ui-glow2"),
      scrollIndicator: q("#ui-scroll"),
      introPanel: q("#intro-panel"),
      ipHeader: q(".ip-top-header"),
      ipHeaderTitle: q(".ip-top-header .title-reveal-wrap > *"),
      waveWrapper: q("#ip-wave-wrapper"),
      waveLeft: qa(".wave-column.is-left .animated-text"),
      waveRight: qa(".wave-column.is-right .animated-text"),
      waveThumb: q<HTMLImageElement>("#ip-wave-thumb"),
      s2Content: q("#section-2-content"),
      s2Masks: qa("#section-2-content .title-reveal-wrap > *"),
      ntg: q("#new-text-group"),
      ntgRows: qa("#new-text-group .title-reveal-wrap > *"),
      sceneWrapper: q("#sceneWrapper"),
      scene: q("#cubeScene"),
      cube: q("#cube"),
      faces: qa(".cube .face"),
      marqueeInner: q("#marquee-inner"),
    });
    sequencer.init();
    return () => sequencer.destroy();
  }, []);

  return (
    <div className="dark-wrapper-mask" id="dark-wrapper-mask" ref={maskRef}>
      <div className="dark-wrapper" id="dark-wrapper">
        <div id="dw-black-overlay" />

        <video
          className="dw-bg-video"
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          data-lazy-video
          data-lazy-on-scroll="true"
        >
          <source data-src="/images/wavebg.mp4" type="video/mp4" />
        </video>

        <div className="glow-bottom-left" id="ui-glow1" />
        <div className="glow-center-left" id="ui-glow2" />

        <div className="scroll-indicator" id="ui-scroll">
          <div className="si-block">
            <span className="si-letter">
              <img src="/images/down.svg" alt="" aria-hidden="true" />
            </span>
            <span className="si-label">DOWN</span>
          </div>
        </div>

        <div id="intro-panel" className="intro-panel">
          <div className="ip-top-chapter1">( Brand Strategy Experts )</div>
          <div className="ip-top-header">
            <div className="title-reveal-wrap">
              <h2 className="ip-top-chapter">
                ( Guarding the Aesthetic Core, Defining the Digital Landing Point )
              </h2>
            </div>
          </div>

          <div className="dual-wave-wrapper" id="ip-wave-wrapper">
            <div className="wave-column is-left">
              {WAVE_LEFT.map((text, i) => (
                <WaveItem
                  key={text}
                  text={text}
                  image={`/images/home/company/${i + 1}.webp`}
                />
              ))}
            </div>
            <div className="wave-column is-right">
              {WAVE_RIGHT.map((text) => (
                <WaveItem key={text} text={text} />
              ))}
            </div>
          </div>

          <div className="image-thumbnail-wrapper">
            <div className="ip-thumb-row">
              <span className="ip-thumb-line" />
              <img
                className="image-thumbnail"
                id="ip-wave-thumb"
                src="/images/home/company/1.webp"
                alt=""
                width={128}
                height={64}
                loading="lazy"
              />
              <span className="ip-thumb-line" />
            </div>
          </div>
        </div>

        <div id="section-2-content" className="section-2-content">
          <div className="title-wrapper marquee-wrapper">
            <div className="title-reveal-wrap">
              <div id="title-marquee" className="marquee-outer">
                <div
                  className="marquee-inner js-scroll-marquee"
                  id="marquee-inner"
                  data-marquee-dir="-1"
                >
                  <div className="marquee-set">
                    {MARQUEE_ITEMS.map(([title, label]) => (
                      <div className="marquee-block" key={title}>
                        <span className="huge-title marquee-item">{title}</span>
                        <span className="marquee-label">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="new-text-group" id="new-text-group">
          <div className="title-reveal-wrap">
            <div className="subtitle" id="new-subtitle" />
          </div>
          <div className="title-wrapper">
            <div className="title-reveal-wrap">
              <div className="huge-title title-outline" id="new-line1" />
            </div>
            <div className="title-reveal-wrap">
              <div className="huge-title" id="new-line2" />
            </div>
          </div>
          <div className="title-reveal-wrap">
            <p className="desc" id="new-desc" />
          </div>
        </div>

        <div className="scene-wrapper" id="sceneWrapper">
          <div className="scene" id="cubeScene">
            <div className="cube" id="cube">
              <div className="face front">
                <video
                  className="face-media"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="none"
                  data-lazy-video
                  data-lazy-on-scroll="true"
                >
                  <source data-src={CUBE_FACES.frontVideo} type="video/mp4" />
                </video>
                <div id="img-overlay" />
              </div>
              {(["right", "back", "left", "top", "bottom"] as const).map(
                (side) => (
                  <div className={`face ${side}`} key={side}>
                    <img
                      className="face-media"
                      src="data:image/gif;base64,R0lGODlhAQABAAAAACw="
                      data-defer-src={CUBE_FACES[side]}
                      alt={`Cube ${side}`}
                      width={1200}
                      height={1200}
                    />
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
