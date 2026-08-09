"use client";

type MenuRow = {
  href: string;
  transitionLabel: string;
  zh: string;
  title: string;
  thumbs: [string, string];
};

const ROWS: MenuRow[] = [
  {
    href: "/",
    transitionLabel: "Home",
    zh: "首頁",
    title: "HOME",
    thumbs: ["/images/nav/1.webp", "/images/nav/2.webp"],
  },
  {
    href: "/about",
    transitionLabel: "About",
    zh: "核點創意",
    title: "ABOUT",
    thumbs: ["/images/nav/3.webp", "/images/nav/4.webp"],
  },
  {
    href: "/work",
    transitionLabel: "Work",
    zh: "設計案例",
    title: "WORK",
    thumbs: ["/images/nav/5.webp", "/images/nav/6.webp"],
  },
  {
    href: "/lab",
    transitionLabel: "Labs",
    zh: "核點實驗室",
    title: "LABS",
    thumbs: ["/images/nav/7.webp", "/images/nav/8.webp"],
  },
  {
    href: "/contact",
    transitionLabel: "Contact",
    zh: "聯繫我們",
    title: "CONTACT",
    thumbs: ["/images/nav/9.webp", "/images/nav/10.webp"],
  },
];

/**
 * Cream fullscreen dropdown menu markup. All behavior (open/close +
 * hover-preview timelines) lives in ScrollNav; images are hydrated
 * from `data-nav-src` on first menu open / row hover.
 */
export default function NavMenu() {
  return (
    <div className="ns-dropdown" id="nav-scroll-dropdown" aria-hidden="true" inert>
      <div className="ns-dropdown__inner" id="nav-scroll-dropdown-content">
        <div className="ns-menu-stage">
          <div className="ns-menu-rows">
            {ROWS.map((row) => (
              <a
                key={row.href}
                className="ns-showcase-row ns-dropdown__item"
                href={row.href}
                data-transition-label={row.transitionLabel}
                aria-label={row.zh}
              >
                <span
                  className="ns-showcase-row__index"
                  data-text={`( ${row.zh} )`}
                />
                <span className="ns-showcase-row__thumb is-left" aria-hidden="true">
                  <img
                    alt=""
                    width={300}
                    height={200}
                    loading="lazy"
                    data-nav-src={row.thumbs[0]}
                  />
                </span>
                <span className="ns-showcase-row__title">
                  <span className="ns-showcase-row__title-track">
                    <span
                      className="ns-showcase-row__title-layer is-primary"
                      data-text={row.title}
                    />
                    <span
                      className="ns-showcase-row__title-layer is-accent"
                      aria-hidden="true"
                      data-text={row.title}
                    />
                  </span>
                </span>
                <span className="ns-showcase-row__thumb is-right" aria-hidden="true">
                  <img
                    alt=""
                    width={300}
                    height={200}
                    loading="lazy"
                    data-nav-src={row.thumbs[1]}
                  />
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
