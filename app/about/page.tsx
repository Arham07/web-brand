import type { Metadata } from "next";
import AboutHero from "@/components/about/AboutHero";
import GridOverlay from "@/components/about/GridOverlay";
import WorkPreviewSection from "@/components/about/WorkPreviewSection";
import CoreCubeSection from "@/components/about/CoreCubeSection";
import SiteFooter from "@/components/footer/SiteFooter";

export const metadata: Metadata = {
  title: "About American Web Guild | Custom Web Design Studio",
  description:
    "A custom web design studio that builds every site from scratch around one question: does it convert? Meet the team, the process, and the 14-day build.",
  openGraph: {
    title: "About American Web Guild | Custom Web Design Studio",
    description:
      "A custom web design studio that builds every site from scratch around one question: does it convert? Meet the team, the process, and the 14-day build.",
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
