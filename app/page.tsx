import type { Metadata } from "next";
import { FAQS } from "@/components/home/faq-data";
import { faqPageJsonLd, jsonLdString } from "@/lib/structured-data";
import HeroSection from "@/components/hero/HeroSection";
import DarkWrapper from "@/components/dark-wrapper/DarkWrapper";
import StmSection from "@/components/stm/StmSection";
import MobileCubeSection from "@/components/mobile/MobileCubeSection";
import CcapSection from "@/components/ccap/CcapSection";
import GallerySection from "@/components/gallery/GallerySection";
import FaqSection from "@/components/home/FaqSection";
import HomeCtaSection from "@/components/home/HomeCtaSection";
import SiteFooter from "@/components/footer/SiteFooter";

// The only indexed page without a self-canonical (every other page sets its
// own). Declared here, not in layout metadata, so it cannot cascade onto
// routes that deliberately have none.
export const metadata: Metadata = {
  alternates: { canonical: "https://americanwebguild.com" },
};

export default function Home() {
  return (
    <div className="home-page">
      {/* FAQ rich-result markup — mirrors the FaqSection accordion below,
          same FAQS array, so the markup can never drift from the visible page
          (Google treats mismatched FAQ markup as spam). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(faqPageJsonLd(FAQS)) }}
      />
      <div className="scroll-track">
        <div className="sticky-container">
          <HeroSection />
          <DarkWrapper />
        </div>
        {/* scrolls over the pinned scene, entering one viewport into the track */}
        <StmSection />
      </div>
      <MobileCubeSection />
      <CcapSection />
      <GallerySection />
      <FaqSection />
      <HomeCtaSection />
      <SiteFooter />
    </div>
  );
}
