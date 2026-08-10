import type { Metadata } from "next";
import AboutHero from "@/components/about/AboutHero";
import GridOverlay from "@/components/about/GridOverlay";
import WorkPreviewSection from "@/components/about/WorkPreviewSection";
import CoreCubeSection from "@/components/about/CoreCubeSection";
import SiteFooter from "@/components/footer/SiteFooter";

export const metadata: Metadata = {
  title: "About American Web Guild | High-End Custom Websites & Digital Experience",
  description:
    "American Web Guild is an independent digital studio of senior UI/UX designers and avant-garde developers. We reject bloated templates, building on native code, headless architecture and top-tier motion to create quietly luxurious digital assets for enterprises and benchmark brands.",
  openGraph: {
    title: "About Us | American Web Guild — Web Design × Motion FX × AI Visual Innovation",
    description:
      "Meet American Web Guild. We focus on high-end custom site builds and brand visual upgrades, augmented by advanced AI imaging, to craft digital identities with international perspective.",
    url: "https://americanwebguild.com/about",
  },
  alternates: { canonical: "https://americanwebguild.com/about" },
};

export default function AboutPage() {
  return (
    <div className="about-page">
      <GridOverlay />
      <AboutHero />
      <WorkPreviewSection />
      <CoreCubeSection />
      <SiteFooter />
    </div>
  );
}
