// Content for the /work archive. Cards open a fullscreen lightbox with the
// project's full-length page screenshot (`full`) — thumbs (`img`) stay light
// for the grid. Projects 02+ mirror the reference portfolios' website-design
// shots (americanwebbuilders.com + webdesignmechanic.com), rehosted locally.

export interface WorkProject {
  index: string;
  /** industry line above the title (W-03 slot 2) */
  date: string;
  title: string;
  /** build facts (W-03 slot 3) — replace with a real outcome as soon as
      the client gives you one; a number always beats a scope description */
  subtitle: string;
  /** written for a screen reader, not stuffed with the title again */
  alt: string;
  /** grid thumbnail */
  img: string;
  width: number;
  height: number;
  /** full-length screenshot shown in the lightbox */
  full: string;
  fullWidth: number;
  fullHeight: number;
  /** same shot at 1000px (aw) / 895px (wm) — see fullMdWidth */
  fullMd: string;
  fullMdWidth: number;
}

/** aw-XX: 1920-wide full-page webp shots; thumbs 512x387 */
const aw = (n: number, h: number): Pick<
  WorkProject,
  | "img" | "width" | "height"
  | "full" | "fullWidth" | "fullHeight" | "fullMd" | "fullMdWidth"
> => {
  const p = String(n).padStart(2, "0");
  return {
    img: `/images/work/list/aw-${p}.webp`,
    width: 512,
    height: 387,
    full: `/images/work/full/aw-${p}.webp`,
    fullWidth: 1920,
    fullHeight: h,
    fullMd: `/images/work/full-md/aw-${p}.webp`,
    fullMdWidth: 1000,
  };
};

/** wm-XX: 895x4096 full-page shots; thumbs 900x674 top-crop jpg */
const wm = (n: number): Pick<
  WorkProject,
  | "img" | "width" | "height"
  | "full" | "fullWidth" | "fullHeight" | "fullMd" | "fullMdWidth"
> => {
  const p = String(n).padStart(2, "0");
  return {
    img: `/images/work/list/wm-${p}.jpg`,
    width: 720,
    height: 539,
    full: `/images/work/full/wm-${p}.jpg`,
    fullWidth: 895,
    fullHeight: 4096,
    // already only 895 wide — the md copy is the same pixels as webp, which
    // is where the two thirds of the bytes go
    fullMd: `/images/work/full-md/wm-${p}.webp`,
    fullMdWidth: 895,
  };
};

const AW_HEIGHTS = [8213, 8386, 6396, 6390, 7506, 8490, 9637, 6880];

/**
 * Per-project copy (doc Part 6, W-03): "[Client] · [Industry] · [One result]".
 *
 * Client names and post-launch numbers are not in hand yet, so slot 1 is the
 * build type and slot 3 is build facts — the doc's own fallback. Every
 * industry label here is read off the screenshot itself, so nothing on this
 * page claims a client, a sector or a result that cannot be pointed at.
 * When real numbers arrive they belong in `subtitle`, one project at a time.
 */
const META: { industry: string; title: string; facts: string; alt: string }[] = [
  {
    industry: "Creative Agency",
    title: "CREATIVE STUDIO SITE",
    facts: "Full site · team, process and blog",
    alt: "Creative agency homepage with an illustrated hero, team grid and a four-step process section",
  },
  {
    industry: "Architecture",
    title: "ARCHITECTURE & PROPERTY",
    facts: "Full site · project gallery + news",
    alt: "Architecture studio site showing a residential project hero, interior gallery and a news listing",
  },
  {
    industry: "Design Studio",
    title: "DESIGN STUDIO PORTFOLIO",
    facts: "Full site · portfolio + lead capture",
    alt: "Web design studio portfolio with a monochrome hero, results counters and a free-consultation form",
  },
  {
    industry: "Web3 Marketplace",
    title: "NFT MARKETPLACE",
    facts: "Marketplace UI · browse, collect, sell",
    alt: "NFT marketplace interface with collection categories, a best-sellers grid and how-to-buy guides",
  },
  {
    industry: "E-Commerce",
    title: "ELECTRONICS STOREFRONT",
    facts: "Storefront · category, product and cart pages",
    alt: "Consumer electronics store showing a headphone product page, category filters and a checkout cart",
  },
  {
    industry: "Fintech",
    title: "DIGITAL BANKING SITE",
    facts: "Product site · app tour + reviews",
    alt: "Digital banking product site with a phone mockup, money-transfer feature blocks and customer reviews",
  },
  {
    industry: "Real Estate",
    title: "REAL ESTATE LISTINGS",
    facts: "Full site · listings, services, enquiry",
    alt: "Property site with an apartment hero, service cards for condos and rentals, and an enquiry form",
  },
  {
    industry: "Consulting",
    title: "BUSINESS CONSULTING SITE",
    facts: "Full site · services, FAQ, contact",
    alt: "Business consulting site with a spokesperson hero, question-and-answer section and a contact block",
  },
  {
    industry: "Retail E-Commerce",
    title: "VAPE E-COMMERCE",
    facts: "Storefront · product grid + checkout",
    alt: "Dark e-commerce storefront showing three product cards with prices and add-to-cart buttons",
  },
  {
    industry: "Consumer Tech",
    title: "SMARTWATCH LAUNCH PAGE",
    facts: "Product launch · feature walkthrough",
    alt: "Smartwatch launch page with product photography and a numbered list of fitness and health features",
  },
  {
    industry: "Fashion E-Commerce",
    title: "FASHION STORE REDESIGN",
    facts: "Redesign · navigation, product pages, checkout",
    alt: "Fashion store redesign showing navigation, product page and checkout improvements beside a live cart",
  },
  {
    industry: "Consumer Hardware",
    title: "KEYBOARD PRODUCT PAGE",
    facts: "Product page · specs + performance story",
    alt: "Mechanical keyboard product page with a hero render and a performance and connectivity write-up",
  },
  {
    industry: "Creative Agency",
    title: "AGENCY SERVICES SITE",
    facts: "Full site · services, work, testimonials",
    alt: "Agency services page listing UI/UX, branding, development and motion, with a testimonials section",
  },
  {
    industry: "Crypto / AI",
    title: "CRYPTO TOKEN LANDING",
    facts: "Landing page · narrative + join CTA",
    alt: "Crypto token landing page with a 3D robot mascot, project narrative and a join-the-movement button",
  },
];

const entry = (
  i: number,
  media: Pick<
    WorkProject,
    | "img" | "width" | "height"
    | "full" | "fullWidth" | "fullHeight" | "fullMd" | "fullMdWidth"
  >
): WorkProject => {
  const m = META[i - 1]!;
  return {
    index: `00-${i}`,
    date: m.industry,
    title: m.title,
    subtitle: m.facts,
    alt: m.alt,
    ...media,
  };
};

export const WORK_HERO = {
  /* decorative lockup — the real <h1> is `heading` */
  title: "WORK",
  code: "DESIGN",
  heading:
    "Web design portfolio — custom sites, redesigns and storefronts, and what each one was built to do.",
  year: "\u00a92025\u20142026",
  kicker: "( Selected Work )",
  tags: "DIGITAL | WEB | BRANDING",
};

export const WORK_PROJECTS: WorkProject[] = [
  ...AW_HEIGHTS.map((h, i) => entry(i + 1, aw(i + 1, h))),
  ...[1, 2, 3, 4, 5, 6].map((n, i) => entry(i + 9, wm(n))),
];
