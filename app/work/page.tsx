import type { Metadata } from "next";
import WorkHero from "@/components/work/WorkHero";
import WorkGrid from "@/components/work/WorkGrid";
import ScrollMarquee from "@/components/shared/ScrollMarquee";
import SiteFooter from "@/components/footer/SiteFooter";

export const metadata: Metadata = {
  title: "Web Design Portfolio — 14 Recent Builds | American Web Guild",
  description:
    "Browse our web design portfolio: custom websites, redesigns and e-commerce builds, with the results each one produced after launch.",
  openGraph: {
    title: "Web Design Portfolio — 14 Recent Builds | American Web Guild",
    description:
      "Browse our web design portfolio: custom websites, redesigns and e-commerce builds, with the results each one produced after launch.",
    url: "https://americanwebguild.com/work",
  },
  alternates: { canonical: "https://americanwebguild.com/work" },
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
