import HeroSection from "@/components/hero/HeroSection";
import DarkWrapper from "@/components/dark-wrapper/DarkWrapper";

export default function Home() {
  return (
    <main>
      <div className="scroll-track">
        <div className="sticky-container">
          <HeroSection />
          <DarkWrapper />
        </div>
      </div>
      {/* stm / ccap / gallery / footer sections land in P4–P7 */}
    </main>
  );
}
