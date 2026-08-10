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
  "COMMERCIAL IMAGERY",
  "CREATIVE DIRECTION",
];

/** The four labels sitting on the hero divider line. */
export const DIVIDER_LABELS = [
  { text: "Web Design Studio", align: "left" as const, heading: true },
  { text: "( Brand Identity )", align: "center" as const, heading: false },
  { text: "( AI Motion Imagery )", align: "center" as const, heading: false },
  {
    text: "( High-End Commercial Image Generation )",
    align: "right" as const,
    heading: false,
  },
];

export const HERO_CAPTION = ["DEFINING THE CORE DNA OF", "BRAND AESTHETICS"];
export const HERO_BOTTOM = [
  "AMERICAN WEB GUILD IS COMMITTED",
  "TO THE ART OF SUBTRACTION.",
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
    title: "Absolute Precision",
    subtitle: "Distilled to the core, ignited with precision",
    column: "2 / span 5",
    row: "1 / span 2",
    lens: 700,
  },
  {
    img: "/images/about/box2.webp",
    meta: "SERVICE 02",
    title: "Vibe Workflow",
    subtitle: "Generative workflow integration, elevated craft",
    column: "8 / span 4",
    row: "1",
    lens: 300,
  },
  {
    img: "/images/about/box3.webp",
    meta: "SERVICE 03",
    title: "Elite Frontend Tech",
    subtitle: "Reshaping visual space with elite front-end interaction",
    column: "3 / span 4",
    row: "3",
    lens: 350,
    offset: 4,
  },
  {
    img: "/images/about/box4.webp",
    meta: "SERVICE 04",
    title: "Striking Visuals",
    subtitle: "Maximum visual tension",
    column: "8 / span 3",
    row: "2 / span 3",
    lens: 450,
    offset: 4,
  },
];

export const WORK_HEADER = {
  tag: "AMERICAN WEB GUILD",
  copy: "Master of absolute precision and the art of subtraction.",
};

export const YEARS_COUNTER = {
  above: "Distilling Over",
  target: 14,
  unit: "YEARS",
  below: "Total Digital Shift",
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
    title: "WEB PLANNING",
    subtitle: "( Web Planning )",
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
    subtitle: "( High-End Commercial Visual Generation )",
  },
  {
    face: "left",
    icon: "/images/about/box/c5.svg",
    bg: "/images/about/box/b4.webp",
    title: "AI VIDEO",
    subtitle: "( AI Motion Imagery )",
  },
  {
    face: "bottom",
    icon: "/images/about/box/c6.svg",
    bg: "/images/about/box/b6.webp",
    title: "DIGITAL CONSULTANT",
    subtitle: "( Digital Design Consulting )",
  },
];

/** Icon-nav buttons — deliberately not in face order, matching the original. */
export const CUBE_NAV_ICONS = [
  { icon: "/images/about/box/s2.svg", label: "Brand Identity" },
  { icon: "/images/about/box/s1.svg", label: "Web Planning" },
  { icon: "/images/about/box/s3.svg", label: "Web Design" },
  { icon: "/images/about/box/s5.svg", label: "AI Visuals" },
  { icon: "/images/about/box/s4.svg", label: "AI Motion" },
  { icon: "/images/about/box/s6.svg", label: "Digital & Visual" },
];

/** Decorative low-opacity ticker rows behind the cube. */
export const CUBE_TICKER_WORDS = [
  "BRAND IDENTITY",
  "WEB PLANNING",
  "WEB DESIGN",
  "AI VISUALS",
  "AI MOTION",
  "DIGITAL & VISUAL",
];

export const CUBE_TICKER_CENTER = "SERVICE";
