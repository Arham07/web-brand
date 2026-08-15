// Content for the /work archive. Cards open a fullscreen lightbox with the
// project's full-length page screenshot (`full`) — thumbs (`img`) stay light
// for the grid. Projects 02+ mirror the reference portfolios' website-design
// shots (americanwebbuilders.com + webdesignmechanic.com), rehosted locally.

export interface WorkProject {
  index: string;
  date: string;
  title: string;
  subtitle: string;
  /** grid thumbnail */
  img: string;
  width: number;
  height: number;
  /** full-length screenshot shown in the lightbox */
  full: string;
  fullWidth: number;
  fullHeight: number;
}

/** aw-XX: 1920-wide full-page webp shots; thumbs 512x387 */
const aw = (n: number, h: number): Pick<
  WorkProject,
  "img" | "width" | "height" | "full" | "fullWidth" | "fullHeight"
> => {
  const p = String(n).padStart(2, "0");
  return {
    img: `/images/work/list/aw-${p}.webp`,
    width: 512,
    height: 387,
    full: `/images/work/full/aw-${p}.webp`,
    fullWidth: 1920,
    fullHeight: h,
  };
};

/** wm-XX: 895x4096 full-page png shots; thumbs 900x674 top-crop jpg */
const wm = (n: number): Pick<
  WorkProject,
  "img" | "width" | "height" | "full" | "fullWidth" | "fullHeight"
> => {
  const p = String(n).padStart(2, "0");
  return {
    img: `/images/work/list/wm-${p}.jpg`,
    width: 720,
    height: 539,
    full: `/images/work/full/wm-${p}.jpg`,
    fullWidth: 895,
    fullHeight: 4096,
  };
};

const AW_HEIGHTS = [8213, 8386, 6396, 6390, 7506, 8490, 9637, 6880];

const entry = (
  i: number,
  media: Pick<
    WorkProject,
    "img" | "width" | "height" | "full" | "fullWidth" | "fullHeight"
  >
): WorkProject => ({
  index: `00-${i}`,
  date: `Section ${String(i).padStart(2, "0")}`,
  title: `PROJECT ${String(i).padStart(2, "0")}`,
  subtitle: "Website Design",
  ...media,
});

export const WORK_HERO = {
  title: "WORK",
  code: "DESIGN",
  desc: ["DEFINING THE CORE DNA OF", "BRAND AESTHETICS"],
  year: "©2025—2026",
  kicker: "( Selected Work )",
  tags: "DIGITAL | WEB | BRANDING",
};

export const WORK_PROJECTS: WorkProject[] = [
  ...AW_HEIGHTS.map((h, i) => entry(i + 1, aw(i + 1, h))),
  ...[1, 2, 3, 4, 5, 6].map((n, i) => entry(i + 9, wm(n))),
];
