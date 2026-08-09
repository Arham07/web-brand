import type { Metadata } from "next";
import WorkHero from "@/components/work/WorkHero";
import WorkGrid from "@/components/work/WorkGrid";
import ScrollMarquee from "@/components/shared/ScrollMarquee";
import SiteFooter from "@/components/footer/SiteFooter";

export const metadata: Metadata = {
  title: "Work | NUDOT Studio — Corporate Site Redesign & Digital Transformation",
  description:
    "Browse NUDOT's premium portfolio. Web design, motion/FX design and brand visual elevation across precision machining, technology, food & beverage and beauty — immersive digital experiences with international presence.",
  openGraph: {
    title: "Works | NUDOT — Web Design × Motion FX × Brand Visual Elevation",
    description:
      "Browse NUDOT's premium portfolio. Web design, motion FX and brand visual elevation — immersive digital experiences for enterprises.",
    url: "https://nudot.com.tw/work",
  },
  alternates: { canonical: "https://nudot.com.tw/work" },
};

export default function WorkPage() {
  return (
    <div className="work-page">
      <main className="wk-archive">
        <WorkHero />
        <WorkGrid />
      </main>
      <ScrollMarquee word="COMING SOON" />
      <SiteFooter />
    </div>
  );
}
