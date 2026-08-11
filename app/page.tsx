import HeroSection from "@/components/hero/HeroSection";
import DarkWrapper from "@/components/dark-wrapper/DarkWrapper";
import StmSection from "@/components/stm/StmSection";
import MobileCubeSection from "@/components/mobile/MobileCubeSection";
import CcapSection from "@/components/ccap/CcapSection";
import GallerySection from "@/components/gallery/GallerySection";
import FaqSection from "@/components/home/FaqSection";
import HomeCtaSection from "@/components/home/HomeCtaSection";
import SiteFooter from "@/components/footer/SiteFooter";

export default function Home() {
  return (
    <div className="home-page">
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
