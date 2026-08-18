// Content for the About page. All copy is the English rendering of the
// original studio site (the replica is English-only).

/** Hero marquee rows — the second row scrolls the opposite way. */
export const MARQUEE_ROW_A = [
  "AMERICAN WEB GUILD",
  "BRAND STRATEGY",
  "DIGITAL EXPERIENCE",
  "MOTION DESIGN",
  "AI VISUALS",
];

export const MARQUEE_ROW_B = [
  "WEB DESIGN",
  "VISUAL IDENTITY",
  "UI / UX",
  "WEBSITE REDESIGN",
  "E-COMMERCE DESIGN",
];

/** The four labels sitting on the hero divider line. */
export const DIVIDER_LABELS = [
  {
    // The display type above stays big; this H1 is the sentence that
    // actually ranks and positions (copy doc A-01).
    text: "A custom web design studio built around one question: does it convert?",
    align: "left" as const,
    heading: true,
  },
  { text: "( Small Senior Team )", align: "center" as const, heading: false },
  { text: "( Strategy to Code, In-House )", align: "center" as const, heading: false },
  {
    text: "( No Juniors Learning on Your Budget )",
    align: "right" as const,
    heading: false,
  },
];

/** Work-preview cards. `span`/`row` drive the asymmetric 12-column grid. */
export interface WorkCard {
  img: string;
  meta: string;
  title: string;
  subtitle: string;
  /** grid-column shorthand, desktop */
  column: string;
  /** grid-row shorthand, desktop */
  row: string;
  /** lens height in px, desktop */
  lens: number;
  /** extra top offset in rem, desktop */
  offset?: number;
}

export const WORK_CARDS: WorkCard[] = [
  {
    img: "/images/about/box.webp",
    meta: "SERVICE 01",
    title: "Built From Scratch",
    subtitle: "No page builders, no bought themes — hand-written code that stays fast",
    column: "2 / span 5",
    row: "1 / span 2",
    lens: 700,
  },
  {
    img: "/images/about/box2.webp",
    meta: "SERVICE 02",
    title: "AI-Accelerated, Human-Directed",
    subtitle: "Generative speed on drafts, a senior designer directing every frame",
    column: "8 / span 4",
    row: "1",
    lens: 300,
  },
  {
    img: "/images/about/box3.webp",
    meta: "SERVICE 03",
    title: "Front-End That Feels Expensive",
    subtitle: "Scroll motion, micro-interactions and WebGL — used with restraint",
    column: "3 / span 4",
    row: "3",
    lens: 350,
    offset: 4,
  },
  {
    img: "/images/about/box4.webp",
    meta: "SERVICE 04",
    title: "Visuals That Do The Selling",
    subtitle: "Imagery built to communicate the offer, not decorate around it",
    column: "8 / span 3",
    row: "2 / span 3",
    lens: 450,
    offset: 4,
  },
];

export const WORK_HEADER = {
  tag: "AMERICAN WEB GUILD",
  copy: "We remove more than we add. Most websites fail from abundance, not scarcity — we start by deleting, then design what's left so precisely a visitor can't misread it.",
};

export const YEARS_COUNTER = {
  above: "Distilling Over",
  target: 6,
  unit: "YEARS",
  below: "Every element earns its place — or gets cut",
};

/**
 * Cube faces in scroll order — the rotation stops in `cube-rotations.ts`
 * bring each of these square to the camera in turn.
 */
export interface CubeFace {
  /** which physical face of the cube this sits on */
  face: "top" | "front" | "right" | "back" | "left" | "bottom";
  icon: string;
  bg: string;
  title: string;
  subtitle: string;
}

export const CUBE_FACES: CubeFace[] = [
  {
    face: "top",
    icon: "/images/about/box/c1.svg",
    bg: "/images/about/box/b5.webp",
    title: "BRAND IDENTITY",
    subtitle: "( Brand Identity Design )",
  },
  {
    face: "front",
    icon: "/images/about/box/c2.svg",
    bg: "/images/about/box/b1.webp",
    title: "WEB STRATEGY",
    subtitle: "( Sitemap, Click Paths & Offer )",
  },
  {
    face: "right",
    icon: "/images/about/box/c3.svg",
    bg: "/images/about/box/b3.webp",
    title: "WEB DESIGN",
    subtitle: "( Web Design & Development )",
  },
  {
    face: "back",
    icon: "/images/about/box/c4.svg",
    bg: "/images/about/box/b2.webp",
    title: "AI VISUALS",
    subtitle: "( Product Imagery, No Shoot Day )",
  },
  {
    face: "left",
    icon: "/images/about/box/c5.svg",
    bg: "/images/about/box/b4.webp",
    title: "MOTION & VIDEO",
    subtitle: "( Hero Loops & Ad-Ready Cuts )",
  },
  {
    face: "bottom",
    icon: "/images/about/box/c6.svg",
    bg: "/images/about/box/b6.webp",
    title: "DIGITAL CONSULTING",
    subtitle: "( What to Build Next — and What to Stop Paying For )",
  },
];

/** Icon-nav buttons — deliberately not in face order, matching the original. */
export const CUBE_NAV_ICONS = [
  { icon: "/images/about/box/s2.svg", label: "Brand Identity" },
  { icon: "/images/about/box/s1.svg", label: "Web Strategy" },
  { icon: "/images/about/box/s3.svg", label: "Web Design" },
  { icon: "/images/about/box/s5.svg", label: "AI Visuals" },
  { icon: "/images/about/box/s4.svg", label: "Motion & Video" },
  { icon: "/images/about/box/s6.svg", label: "Consulting" },
];

/** Decorative low-opacity ticker rows behind the cube. */
export const CUBE_TICKER_WORDS = [
  "BRAND IDENTITY",
  "WEB STRATEGY",
  "WEB DESIGN",
  "AI VISUALS",
  "MOTION & VIDEO",
  "CONSULTING",
];

export const CUBE_TICKER_CENTER = "SERVICE";
