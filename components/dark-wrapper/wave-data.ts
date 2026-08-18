// Real search terms, not invented names — "3D Matrix" ranks for nothing;
// "Website Redesign" is what buyers literally type an hour before the ad.
export const WAVE_LEFT = [
  "Custom Web Design",
  "Website Redesign",
  "Landing Pages",
  "E-Commerce",
  "UI/UX Design",
  "Conversion Design",
  "Brand Identity",
  "Motion Design",
  "3D & WebGL",
  "Technical SEO",
  "Web Copywriting",
  "Care Plans",
];

export const WAVE_RIGHT = [
  "Strategy",
  "Design",
  "Code",
  "Copy",
  "Motion",
  "Brand",
  "SEO",
  "Speed",
  "CMS",
  "Analytics",
  "Access",
  "Craft",
];

/** short English gloss shown on hover/focus, flipping in under the label */
export const WAVE_GLOSS: Record<string, string> = {
  "Custom Web Design": "(Hand-Built Sites)",
  "Website Redesign": "(Site Rebuilds)",
  "Landing Pages": "(High-Converting)",
  "E-Commerce": "(Shopify & Stores)",
  "UI/UX Design": "(Interface / Experience)",
  "Conversion Design": "(Built to Sell)",
  "Brand Identity": "(Logo, Type, Colour)",
  "Motion Design": "(Scroll & Micro-Motion)",
  "3D & WebGL": "(Immersive Visuals)",
  "Technical SEO": "(Core Web Vitals)",
  "Web Copywriting": "(Words That Sell)",
  "Care Plans": "(Post-Launch Support)",
  Strategy: "(Strategy)",
  Design: "(Design)",
  Code: "(Code)",
  Copy: "(Copywriting)",
  Motion: "(Motion)",
  Brand: "(Brand)",
  SEO: "(Search)",
  Speed: "(Performance)",
  CMS: "(Edit It Yourself)",
  Analytics: "(Measurement)",
  Access: "(Accessibility)",
  Craft: "(Craft)",
};

export const MARQUEE_ITEMS: Array<[title: string, label: string]> = [
  ["WEBDESIGN", "( Web Design )"],
  ["UI/UX", "( Interface / Experience )"],
  ["MOTION", "( Motion Design )"],
  ["BRANDING", "( Brand Identity )"],
];

export const CUBE_FACES = {
  frontVideo: "/images/cube/responsive-web-design-showcase-mobile-ipad.mp4",
  right: "/images/cube/high-end-restaurant-web-design.webp",
  back: "/images/cube/brand-website.webp",
  left: "/images/cube/interior-design-website-mockup.webp",
  top: "/images/cube/fluid-minimalism-web-design-texture.webp",
  bottom: "/images/cube/b2b-manufacturing-web-design-portfolio.webp",
} as const; 