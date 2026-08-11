"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/device";
import {
  PRICING_CATEGORIES,
  PRICING_HEADING,
  type PricingPackage,
} from "./pricing-data";

/** flat lists longer than this collapse behind a "View all" toggle */
const COLLAPSE_OVER = 12;
const VISIBLE_WHEN_COLLAPSED = 10;

function featureCount(pkg: PricingPackage): number {
  if (pkg.groups) return pkg.groups.reduce((n, g) => n + g.items.length, 0);
  return pkg.features?.length ?? 0;
}

function Check() {
  return (
    <svg
      className="pr-check"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 6.2 5 9l5-6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="pr-features">
      {items.map((f) => (
        <li key={f}>
          <Check />
          <span>{f}</span>
        </li>
      ))}
    </ul>
  );
}

function PackageCard({
  pkg,
  note,
  expanded,
  onToggle,
}: {
  pkg: PricingPackage;
  note: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const total = featureCount(pkg);
  const collapsible = pkg.groups ? pkg.groups.length > 1 : total > COLLAPSE_OVER;

  let visible: React.ReactNode;
  let hidden: React.ReactNode = null;

  if (pkg.groups) {
    // grouped (SEO): first group always visible, the rest collapse
    const [first, ...rest] = pkg.groups;
    visible = (
      <div className="pr-group">
        <h4 className="pr-group__heading">{first.heading}</h4>
        <FeatureList items={first.items} />
      </div>
    );
    hidden = rest.map((g) => (
      <div className="pr-group" key={g.heading}>
        <h4 className="pr-group__heading">{g.heading}</h4>
        <FeatureList items={g.items} />
      </div>
    ));
  } else {
    const features = pkg.features ?? [];
    const head = collapsible ? features.slice(0, VISIBLE_WHEN_COLLAPSED) : features;
    const tail = collapsible ? features.slice(VISIBLE_WHEN_COLLAPSED) : [];
    visible = <FeatureList items={head} />;
    hidden = tail.length ? <FeatureList items={tail} /> : null;
  }

  return (
    <article className={`pr-card${pkg.popular ? " pr-card--popular" : ""}`}>
      {pkg.popular && <span className="pr-card__badge">Popular</span>}
      <h3 className="pr-card__name">{pkg.name}</h3>
      <div className="pr-card__pricing">
        <span className="pr-card__price">{pkg.price}</span>
        <span className="pr-card__original">{pkg.original}</span>
      </div>
      <p className="pr-card__note">{note}</p>
      <div className="pr-card__divider" />

      {visible}

      {collapsible && hidden && (
        <>
          <div className={`pr-more${expanded ? " is-open" : ""}`}>
            <div>{hidden}</div>
          </div>
          <button
            type="button"
            className="pr-toggle"
            aria-expanded={expanded}
            onClick={onToggle}
            data-cursor={expanded ? "LESS" : "MORE"}
          >
            {expanded ? "Hide extra features" : `View all ${total} features`}
            <span className="pr-toggle__chev" aria-hidden="true">
              {expanded ? "↑" : "↓"}
            </span>
          </button>
        </>
      )}

      <a className="pr-card__cta" href="/contact" data-cursor="CONTACT">
        Get Started
        <span aria-hidden="true">&rarr;</span>
      </a>
    </article>
  );
}

/**
 * Tabbed pricing browser. Tab switches animate the outgoing cards down/out
 * and stagger the incoming set up/in via GSAP; expansion state resets per
 * category so cards always open collapsed (readable first paint).
 */
export default function PricingSection() {
  const [active, setActive] = useState(PRICING_CATEGORIES[0].key);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const gridRef = useRef<HTMLDivElement>(null);
  const switching = useRef(false);

  const category =
    PRICING_CATEGORIES.find((c) => c.key === active) ?? PRICING_CATEGORIES[0];

  const selectTab = (key: string) => {
    if (key === active || switching.current) return;
    const grid = gridRef.current;
    if (prefersReducedMotion() || !grid) {
      setActive(key);
      return;
    }
    switching.current = true;
    gsap.to(grid.children, {
      autoAlpha: 0,
      y: 14,
      duration: 0.22,
      stagger: 0.04,
      ease: "power2.in",
      onComplete: () => {
        switching.current = false;
        setActive(key);
      },
    });
  };

  // entry animation for the (new) card set — also runs on first mount
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || prefersReducedMotion()) return;
    const tween = gsap.fromTo(
      grid.children,
      { autoAlpha: 0, y: 18 },
      { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power3.out" }
    );
    return () => {
      tween.kill();
    };
  }, [active]);

  return (
    <section className="pr-section">
      <div className="pr-head">
        <span className="pr-head__label">( {PRICING_HEADING} )</span>
        <h2 className="pr-head__title">
          <span className="grad-text">{category.title}</span>
        </h2>
      </div>

      <div className="pr-tabs" role="tablist" aria-label="Pricing categories">
        {PRICING_CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            role="tab"
            aria-selected={c.key === active}
            className={`pr-tab${c.key === active ? " is-active" : ""}`}
            onClick={() => selectTab(c.key)}
            data-cursor="VIEW"
          >
            {c.tab}
          </button>
        ))}
      </div>

      <div className="pr-grid" ref={gridRef}>
        {category.packages.map((pkg, i) => {
          const id = `${category.key}-${i}`;
          return (
            <PackageCard
              key={id}
              pkg={pkg}
              note={category.note}
              expanded={!!expanded[id]}
              onToggle={() =>
                setExpanded((s) => ({ ...s, [id]: !s[id] }))
              }
            />
          );
        })}
      </div>
    </section>
  );
}
