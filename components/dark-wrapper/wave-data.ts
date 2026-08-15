export const WAVE_LEFT = [
  "Core-Site",
  "Gen-AI Visual",
  "Motion Flow",
  "WebGL Realm",
  "3D Matrix",
  "Interaction",
  "Pixel Perfect",
  "Logic Build",
  "Fluid UI",
  "Aero Design",
  "Pure Code",
  "Digital Art",
];

export const WAVE_RIGHT = [
  "Strategy",
  "Design",
  "Tech",
  "Creative",
  "Motion",
  "Brand",
  "Future",
  "Vision",
  "System",
  "Labs",
  "Core",
  "Craft",
];

/** short English gloss shown on hover/focus, flipping in under the label */
export const WAVE_GLOSS: Record<string, string> = {
  "Core-Site": "(Core Site)",
  "Gen-AI Visual": "(Generative Visuals)",
  "Motion Flow": "(Motion Flow)",
  "WebGL Realm": "(WebGL Realm)",
  "3D Matrix": "(3D Matrix)",
  Interaction: "(Interaction Design)",
  "Pixel Perfect": "(Pixel Perfect)",
  "Logic Build": "(Logic Build)",
  "Fluid UI": "(Fluid Interface)",
  "Aero Design": "(Lightweight Design)",
  "Pure Code": "(Pure Code)",
  "Digital Art": "(Digital Art)",
  Strategy: "(Strategy)",
  Design: "(Design)",
  Tech: "(Technology)",
  Creative: "(Creative)",
  Motion: "(Motion)",
  Brand: "(Brand)",
  Future: "(Future)",
  Vision: "(Vision)",
  System: "(System)",
  Labs: "(Labs)",
  Core: "(Core)",
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