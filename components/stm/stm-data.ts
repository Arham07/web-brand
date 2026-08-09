// Content inventory for the STM ("scroll text motion") section:
// 20 groups of keyword lines interleaved with the giant N/U/D/O/T
// dot-matrix letters. Each item carries a base position class number
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

/** zh status line: instant text + blinking block cursor below it. */
const status = (text: string): StmGroup => [
  { text, pos: 1, alt: 3, scramble: 0, typing: true },
];

export const STM_GROUPS: StmGroup[] = [
  // 1
  group(4, 2, ["Brand identity", "Visual strategy", "核點創意"]),
  // 2
  group(1, 3, [
    "Motion design",
    "Micro interactions",
    "Type system",
    "Creative direction",
    "設計語言",
  ]),
  // 3 — giant N
  xl("N", 1, 2),
  // 4
  status("品牌識別系統建構中"),
  // 5
  group(2, 5, ["Interface design", "Web experience", "Digital storytelling"]),
  // 6 — giant U
  xl("U", 3, 9),
  // 7
  group(3, 2, [
    "Art direction",
    "Campaign design",
    "視覺敘事",
    "Brand experience",
  ]),
  // 8
  status("視覺系統載入中"),
  // 9
  group(2, 4, [
    "UX strategy",
    "Creative coding",
    "Logo design",
    "Editorial layout",
    "Packaging design",
    "數位體驗",
  ]),
  // 10 — giant D
  xl("D", 1, 3),
  // 11
  group(2, 9, [
    "Interaction design",
    "Brand guidelines",
    "Typography",
    "Colour systems",
    "品牌顧問",
  ]),
  // 12 — giant O (only element with a custom flip ease)
  xl("O", 3, 10, "expo.in"),
  // 13
  group(4, 3, [
    "Social media design",
    "Video production",
    "Illustration",
    "創意策略",
  ]),
  // 14
  status("創意能量持續輸出中"),
  // 15
  group(3, 5, [
    "Print design",
    "Space branding",
    "Exhibition design",
    "Sound identity",
  ]),
  // 16 — giant T
  xl("T", 2, 3),
  // 17
  group(3, 6, [
    "Concept development",
    "Market positioning",
    "品牌個性定義",
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
    "數位品牌規範",
    "Scroll experience",
    "WebGL interface",
    "Kinetic typography",
    "動態視覺設計",
  ]),
  // 20 — all pos-1, per-item alt targets
  [
    { text: "Brand audit", pos: 1, alt: 1 },
    { text: "Competitor analysis", pos: 1, alt: 2 },
    { text: "Mood board", pos: 1, alt: 4 },
    { text: "品牌核心價值", pos: 1, alt: 5 },
    { text: "Style guide", pos: 1, alt: 6 },
    { text: "Launch strategy", pos: 1, alt: 4 },
  ],
];
