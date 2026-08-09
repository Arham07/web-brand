// Content for the /work archive. Cards are display-only: no navigation and
// no hover videos — a static cover image per project (the user's requirement).

export interface WorkProject {
  index: string;
  date: string;
  title: string;
  subtitle: string;
  img: string;
  width: number;
  height: number;
}

export const WORK_PROJECTS: WorkProject[] = [
  {
    index: "00-1",
    date: "Section 01",
    title: "HIGH-END SKINCARE",
    subtitle: "Premium Skincare Brand Site",
    img: "/images/work/list/1.webp",
    width: 2560,
    height: 1920,
  },
  {
    index: "00-2",
    date: "Section 02",
    title: "METERSEVEN",
    subtitle: "Twilight Table",
    img: "/images/work/list/2.webp",
    width: 3000,
    height: 2000,
  },
  {
    index: "00-3",
    date: "Section 03",
    title: "COUNTRY CAMPING",
    subtitle: "Forest Luxury Retreat",
    img: "/images/work/list/3.webp",
    width: 2752,
    height: 1536,
  },
  {
    index: "00-4",
    date: "Section 04",
    title: "PERFORMANCE FLUIDS",
    subtitle: "High-Performance Lubrication Technology",
    img: "/images/work/list/4.webp",
    width: 1200,
    height: 860,
  },
  {
    index: "00-5",
    date: "Section 05",
    title: "OURATTAN",
    subtitle: "Ourattan Furniture",
    img: "/images/work/list/5.webp",
    width: 1280,
    height: 960,
  },
  {
    index: "00-6",
    date: "Section 06",
    title: "HAND PULLED NOODLE",
    subtitle: "Noodle House",
    img: "/images/work/list/6.webp",
    width: 2560,
    height: 1920,
  },
  {
    index: "00-7",
    date: "Section 07",
    title: "PRECISION MACHINING",
    subtitle: "High-Precision Machining",
    img: "/images/work/list/7.webp",
    width: 1280,
    height: 853,
  },
  {
    index: "00-8",
    date: "Section 08",
    title: "STELLAR MACHINING",
    subtitle: "Steel Tempered, Future Built",
    img: "/images/work/list/8.webp",
    width: 2560,
    height: 1920,
  },
  {
    index: "00-9",
    date: "Section 09",
    title: "MEDICAL AESTHETICS",
    subtitle: "Awakening Skin's Natural Radiance",
    img: "/images/work/list/9.webp",
    width: 1280,
    height: 853,
  },
  {
    index: "00-10",
    date: "Section 10",
    title: "SOLAR ENERGY",
    subtitle: "Sustainable Power, Driving the Future",
    img: "/images/work/list/10.webp",
    width: 2560,
    height: 1920,
  },
];

export const WORK_HERO = {
  title: "WORK",
  code: "DESIGN",
  desc: ["DEFINING THE CORE DNA OF", "BRAND AESTHETICS"],
  year: "©2025—2026",
  kicker: "( Selected Work )",
  tags: "DIGITAL | WEB | BRANDING",
};
