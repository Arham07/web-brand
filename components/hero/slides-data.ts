export interface SlideData {
  /** desktop media — exactly one of video/image is set */
  video?: string;
  image?: string;
  mobileVideo?: string;
  mobileImage?: string;
  thumb: string;
  mobileThumb?: string;
  title: string;
}

export const SLIDES: SlideData[] = [
  {
    video: "/images/home/slider1/slider01.mp4",
    mobileVideo: "/images/home/slider1/slider01_s.mp4",
    thumb: "/images/home/slider1/slider01.webp",
    mobileThumb: "/images/home/slider1/slider01_s.webp",
    title: "Custom web design that books calls. Not just compliments.",
  },
  {
    image: "/images/home/slider2/slider02.webp",
    mobileImage: "/images/home/slider2/slider02_m.webp",
    thumb: "/images/home/slider2/slider02_pc.webp",
    mobileThumb: "/images/home/slider2/slider02_s.webp",
    title: "A website your competitors screenshot. And your buyers buy from.",
  },
  {
    video: "/images/home/slider3/slider03pro.mp4",
    mobileVideo: "/images/home/slider3/slider03_s.mp4",
    thumb: "/images/home/slider3/slider03.webp",
    mobileThumb: "/images/home/slider3/slider03_s.webp",
    title: "Custom website, live in 14 days. Or you don't pay.",
  },
];

export const AUTOPLAY_MS = 5000;
export const TRANSITION_SECONDS = 1.4;
export const SWIPE_THRESHOLD_PX = 50;
export const SLEEP_THRESHOLD_VH = 1.1;
