// Asset manifest — every media file the homepage references, mirrored from the
// original site into public/. Paths are saved without query strings.
// Replace any of these with your own assets later; the downloader only fills gaps.

const range = (n, pad = 0) =>
  Array.from({ length: n }, (_, i) => String(i + 1).padStart(pad, "0"));

export const ORIGIN = "https://nudot.com.tw";

export const ASSETS = [
  // --- logos / svg ---
  "images/pc_logo.svg",
  "images/textlogo.svg",
  "images/down.svg",
  "images/fav.png",
  "images/og.jpg",

  // --- loader ---
  "images/loading.mp4",

  // --- hero slides (desktop + mobile variants + thumbs) ---
  "images/home/slider1/slider01.mp4",
  "images/home/slider1/slider01_s.mp4",
  "images/home/slider1/slider01.webp",
  "images/home/slider1/slider01_s.webp",
  "images/home/slider2/slider02.webp",
  "images/home/slider2/slider02_m.webp",
  "images/home/slider2/slider02_pc.webp",
  "images/home/slider2/slider02_s.webp",
  "images/home/slider3/slider03pro.mp4",
  "images/home/slider3/slider03_s.mp4",
  "images/home/slider3/slider03.webp",
  "images/home/slider3/slider03_s.webp",

  // --- hero misc ---
  // TODO: brand-core video parked — re-enable with its markup/styles
  // "images/home/slider_video02.mp4?v=1",
  // "images/home/slider_video02_thumb.jpg",
  "images/load.webp",

  // --- dark wrapper ---
  "images/wavebg.mp4",
  ...range(12).map((n) => `images/home/company/${n}.webp`),
  "images/cube/responsive-web-design-showcase-mobile-ipad.mp4",
  "images/cube/high-end-restaurant-web-design.webp",
  "images/cube/japanese-dining-brand-website.webp",
  "images/cube/interior-design-website-mockup.webp",
  "images/cube/fluid-minimalism-web-design-texture.webp",
  "images/cube/b2b-manufacturing-web-design-portfolio.webp",

  // --- mobile cube ---
  "images/bg.mp4",
  "images/cube/t1.mp4",
  ...["t2", "t3", "t4", "t5", "t6"].map((t) => `images/cube/${t}.webp`),

  // --- nav menu previews ---
  ...range(10).map((n) => `images/nav/${n}.webp`),

  // --- ccap ring gallery ---
  "images/home/star.mp4",
  ...range(25, 2).map((n) => `images/core-capabilities/ring/${n}.webp`),

  // --- s3 gallery ---
  ...range(6, 2).map((n) => `images/home/list/${n}.webp`),

  // --- footer ---
  "images/footer.mp4",
  "images/footer-bg.jpg",

  // --- about page ---
  "images/about/about.mp4",
  "images/about/box.webp",
  ...["box2", "box3", "box4"].map((b) => `images/about/${b}.webp`),
  ...range(6).map((n) => `images/about/box/s${n}.svg`), // marquee separators
  ...range(6).map((n) => `images/about/box/c${n}.svg`), // cube face icons
  ...range(6).map((n) => `images/about/box/b${n}.webp`), // cube face backgrounds

  // --- contact page ---
  "images/contact.svg",
  "images/lab/hourglass.svg",

  // --- work page (static covers only; hover videos deliberately excluded) ---
  ...range(10).map((n) => `images/work/list/${n}.webp`),
];
