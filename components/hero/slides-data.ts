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
    title: "Nudot Creative Studio",
  },
  {
    video: "/images/home/slider2/slider02pro.mp4",
    mobileVideo: "/images/home/slider2/slider02_s.mp4",
    thumb: "/images/home/slider2/slider02.webp",
    mobileThumb: "/images/home/slider2/slider02_s.webp",
    title: "Visual Direction",
  },
  {
    image: "/images/home/slider3/slider03.webp",
    mobileImage: "/images/home/slider3/slider03_m.webp",
    thumb: "/images/home/slider3/slider03_pc.webp",
    mobileThumb: "/images/home/slider3/slider03_s.webp",
    title: "High-End Skincare",
  },
  {
    image: "/images/home/slider4/slider04.webp",
    mobileImage: "/images/home/slider4/slider04_m.webp",
    thumb: "/images/home/slider4/slider04_pc.webp",
    mobileThumb: "/images/home/slider4/slider04_s.webp",
    title: "METERSEVEN",
  },
  {
    image: "/images/home/slider5/slider05.webp",
    mobileImage: "/images/home/slider5/slider05_m.webp",
    thumb: "/images/home/slider5/slider05_pc.webp",
    mobileThumb: "/images/home/slider5/slider05_s.webp",
    title: "PERFORMANCE FLUIDS",
  },
];

export const AUTOPLAY_MS = 5000;
export const TRANSITION_SECONDS = 1.4;
export const SWIPE_THRESHOLD_PX = 50;
export const SLEEP_THRESHOLD_VH = 1.1;
