import type { Metadata } from "next";
import WorkHero from "@/components/work/WorkHero";
import WorkGrid from "@/components/work/WorkGrid";
import WorkTestimonials from "@/components/work/WorkTestimonials";
import WorkCta from "@/components/work/WorkCta";
import BookingMarquee from "@/components/work/BookingMarquee";
import SiteFooter from "@/components/footer/SiteFooter";

export const metadata: Metadata = {
  title: "Web Design Portfolio | American Web Guild",
  description:
    "Browse our web design portfolio: custom websites, redesigns and e-commerce builds across fintech, real estate, retail and more.",
  openGraph: {
    title: "Web Design Portfolio | American Web Guild",
    description:
      "Browse our web design portfolio: custom websites, redesigns and e-commerce builds across fintech, real estate, retail and more.",
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
        <WorkTestimonials />
        <WorkCta />
      </main>
      <BookingMarquee />
      <SiteFooter />
    </div>
  );
}
