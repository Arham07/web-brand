// Content inventory for the STM ("scroll text motion") section:
// 20 groups of keyword lines interleaved with the giant A/W/E/B/G
// (American Web Guild) dot-matrix letters. Each item carries a base position class number
// (stm-pos-N) and an alternate slot the scrubbed Flip swap drifts to.

export interface StmItem {
  /** Rendered line text (also the scramble target). */
  text: string;
  /** Base position class number → `stm-pos-{pos}`. */
  pos: number;
  /** Alternate position class number for the scrubbed Flip swap. */
  alt: number;
  /** Scramble duration in seconds (0 = instant). Omitted = default 1. */
  scramble?: number;
  /** Giant dot-matrix display letter (`.stm-el--xl`). */
  xl?: boolean;
  /** Render a blinking block-cursor sibling (`.stm-typing`) after this line. */
  typing?: boolean;
  /** Ease for the scrubbed Flip tweens. Omitted = "expo.inOut". */
  flipEase?: string;
}

export type StmGroup = StmItem[];

/** Shorthand: a group whose items all share the same pos → alt swap. */
const group = (pos: number, alt: number, texts: string[]): StmGroup =>
  texts.map((text) => ({ text, pos, alt }));

const xl = (letter: string, pos: number, alt: number, flipEase?: string): StmGroup => [
  { text: letter, pos, alt, xl: true, scramble: 2.5, ...(flipEase ? { flipEase } : {}) },
];

/** status line: instant text + blinking block cursor below it. */
const status = (text: string): StmGroup => [
  { text, pos: 1, alt: 3, scramble: 0, typing: true },
];

export const STM_GROUPS: StmGroup[] = [
  // 1
  group(4, 2, ["Brand identity", "Visual strategy", "Brand Craft"]),
  // 2
  group(1, 3, [
    "Motion design",
    "Micro interactions",
    "Type system",
    "Creative direction",
    "Design Language",
  ]),
  // 3 — giant A
  xl("A", 1, 2),
  // 4
  status("Building Brand Identity System"),
  // 5
  group(2, 5, ["Interface design", "Web experience", "Digital storytelling"]),
  // 6 — giant W
  xl("W", 3, 9),
  // 7
  group(3, 2, [
    "Art direction",
    "Campaign design",
    "Visual Storytelling",
    "Brand experience",
  ]),
  // 8
  status("Loading Visual System"),
  // 9
  group(2, 4, [
    "UX strategy",
    "Creative coding",
    "Logo design",
    "Editorial layout",
    "Packaging design",
    "Digital Experience",
  ]),
  // 10 — giant E
  xl("E", 1, 3),
  // 11
  group(2, 9, [
    "Interaction design",
    "Brand guidelines",
    "Typography",
    "Colour systems",
    "Brand Consulting",
  ]),
  // 12 — giant B (only element with a custom flip ease)
  xl("B", 3, 10, "expo.in"),
  // 13
  group(4, 3, [
    "Social media design",
    "Video production",
    "Illustration",
    "Concept Strategy",
  ]),
  // 14
  status("Creative Energy Flowing"),
  // 15
  group(3, 5, [
    "Print design",
    "Space branding",
    "Exhibition design",
    "Sound identity",
  ]),
  // 16 — giant G
  xl("G", 2, 3),
  // 17
  group(3, 6, [
    "Concept development",
    "Market positioning",
    "Brand Personality",
    "Audience insight",
  ]),
  // 18
  group(2, 7, [
    "Design thinking",
    "Prototyping",
    "User research",
    "Content strategy",
  ]),
  // 19
  group(3, 8, [
    "Visual identity",
    "Responsive design",
    "Animation direction",
    "UI component design",
    "Design system",
    "Cross-media branding",
    "Landing page",
    "Digital Brand Guidelines",
    "Scroll experience",
    "WebGL interface",
    "Kinetic typography",
    "Motion Visual Design",
  ]),
  // 20 — all pos-1, per-item alt targets
  [
    { text: "Brand audit", pos: 1, alt: 1 },
    { text: "Competitor analysis", pos: 1, alt: 2 },
    { text: "Mood board", pos: 1, alt: 4 },
    { text: "Core Brand Values", pos: 1, alt: 5 },
    { text: "Style guide", pos: 1, alt: 6 },
    { text: "Launch strategy", pos: 1, alt: 4 },
  ],
];
